"""Listen-test arc engine — Step 1.3 HARD QUALITY GATE.

Drives the running acoustic service through 4 arc shapes x 3 intents each,
prints diagnostic markers that distinguish the five failure modes (A-E) from
the build plan, and outputs Spotify URLs for human listening.

Failure mode mapping (from the build plan "Listen test failure diagnosis"):
  A  CLAP embeddings wrong              -> embed_text reproducibility hash mismatch
  B  Beam search greedy (width=1)       -> all relaxation_levels = 0, no movement
  C  Seed corpus too small/not diverse  -> same tracks across all 4 shapes,
                                           transition_distances all near zero
  D  Arc shape inference not firing     -> waypoint progression identical
                                           across shapes
  E  Frisson constraint ignored         -> no frisson hits at 30/65/85%

Run after the service is up and after seed_corpus.py has populated the DB.

Usage:
  python -m scripts.test_arc
  python -m scripts.test_arc --intents "late night drive" "study session no lyrics"
  python -m scripts.test_arc --arc-length 12      # smaller for faster iteration
  python -m scripts.test_arc --pool-size 30

  # Founder listen (one arc, real start, sick-of tracks excluded):
  python -m scripts.test_arc --shape journey --intents "afternoon coffee shop work" \\
    --pool-size 500 --exclude 4J2oDU9oacz7lJ7H8A8P8v --start-track <spotify_track_id>
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import sys
from pathlib import Path

import httpx
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from db.embeddings import count_embeddings, get_db, load_embedding  # noqa: E402
from scripts.embed_one_track import resolve_start_embedding  # noqa: E402

DEFAULT_SERVICE_URL = "http://localhost:8765"

# Default test matrix — 4 shapes x 3 intents covering distinct acoustic regions
DEFAULT_INTENTS_BY_SHAPE: dict[str, list[str]] = {
    "journey": [
        "late night drive on an empty highway",
        "long flight back home",
        "afternoon coffee shop work",
    ],
    "plateau": [
        "deep focus coding session no lyrics",
        "long form study session",
        "background work flow",
    ],
    "discharge": [
        "processing something heavy",
        "sitting with grief, meet me where i am",
        "anxious, music that matches first",
    ],
    "peak_early": [
        "morning run, push then ease off",
        "warm up to high intensity then cool down",
        "pregame energy, then settle",
    ],
}

# Frisson positions per spec
FRISSON_TARGETS = [0.30, 0.65, 0.85]
FRISSON_TOL = 0.06


# ─── Service IO ──────────────────────────────────────────────────────────────


async def embed_text(client: httpx.AsyncClient, base_url: str, text: str) -> np.ndarray:
    r = await client.post(f"{base_url}/embed/text", json={"text": text}, timeout=30.0)
    r.raise_for_status()
    return np.asarray(r.json()["embedding"], dtype=np.float32)


async def call_arc(
    client: httpx.AsyncClient,
    base_url: str,
    target: np.ndarray,
    pool: list[dict],
    arc_shape: str,
    arc_length: int,
    current_position: np.ndarray | None = None,
    exclude_ids: list[str] | None = None,
) -> dict:
    body = {
        "target_embedding": target.tolist(),
        "pool": [{"id": p["id"], "embedding": p["embedding"]} for p in pool],
        "arc_length": arc_length,
        "arc_shape": arc_shape,
        "max_transition_distance": 0.35,
        "exclude_ids": exclude_ids or [],
    }
    if current_position is not None:
        body["current_position"] = current_position.tolist()
    r = await client.post(f"{base_url}/arc/generate", json=body, timeout=60.0)
    r.raise_for_status()
    return r.json()


def resolve_start_position(start_track_id: str | None, pool_lookup: dict[str, dict]) -> np.ndarray | None:
    """Sync load from pool/DB only. Use resolve_start_embedding() for on-demand embed."""
    if not start_track_id:
        return None
    if start_track_id in pool_lookup:
        return np.asarray(pool_lookup[start_track_id]["embedding"], dtype=np.float32)
    conn = get_db(readonly=True)
    try:
        emb = load_embedding(conn, start_track_id)
    finally:
        conn.close()
    if emb is None:
        return None
    return np.asarray(emb, dtype=np.float32)


def build_intent_matrix(args) -> dict[str, list[str]]:
    if args.intents and args.shape:
        return {args.shape: list(args.intents)}
    if args.intents:
        return {
            shape: [args.intents[i % len(args.intents)] for i in range(3)]
            for shape in DEFAULT_INTENTS_BY_SHAPE
        }
    if args.shape:
        return {args.shape: DEFAULT_INTENTS_BY_SHAPE[args.shape]}
    return DEFAULT_INTENTS_BY_SHAPE


# ─── Pool loader ─────────────────────────────────────────────────────────────


def load_pool_from_db(limit: int) -> list[dict]:
    """Pull `limit` tracks with embeddings + metadata for an arc pool.

    Returns [{id, embedding (list), title, artist, spotify_uri}].
    Selects roughly evenly across seed queries so the pool spans acoustic regions.
    """
    conn = get_db(readonly=True)
    n = count_embeddings(conn)
    if n == 0:
        conn.close()
        raise RuntimeError(
            "Corpus is empty. Run: python -m scripts.seed_corpus  (and ensure the service is running)"
        )
    # Round-robin selection across seed queries to maximise diversity
    seeds = [
        row["seed_query"]
        for row in conn.execute(
            "SELECT DISTINCT seed_query FROM tracks WHERE seed_query IS NOT NULL"
        ).fetchall()
    ]
    by_seed: dict[str, list[dict]] = {}
    for s in seeds:
        rows = conn.execute(
            """SELECT t.id, t.name, t.artist, t.spotify_uri, te.clap_vec
                 FROM tracks t JOIN track_embeddings te ON te.track_id = t.id
                WHERE t.seed_query = ?""",
            (s,),
        ).fetchall()
        by_seed[s] = [dict(r) for r in rows]

    pool: list[dict] = []
    while len(pool) < limit and any(by_seed.values()):
        for s in list(by_seed.keys()):
            if not by_seed[s]:
                continue
            r = by_seed[s].pop(0)
            vec = load_embedding(conn, r["id"])
            if vec is None:
                continue
            pool.append({
                "id": r["id"],
                "embedding": vec.tolist(),
                "title": r["name"],
                "artist": r["artist"],
                "spotify_uri": r["spotify_uri"],
            })
            if len(pool) >= limit:
                break
    conn.close()
    return pool


# ─── Diagnostics ─────────────────────────────────────────────────────────────


def embedding_hash(vec: np.ndarray) -> str:
    return hashlib.sha1(vec.tobytes()).hexdigest()[:12]


async def reproducibility_check(client: httpx.AsyncClient, base_url: str, text: str) -> tuple[bool, str, str]:
    """Embed the same text twice; same hash = stable model state."""
    a = await embed_text(client, base_url, text)
    b = await embed_text(client, base_url, text)
    ha, hb = embedding_hash(a), embedding_hash(b)
    return (ha == hb), ha, hb


def cosine_distance(a: np.ndarray, b: np.ndarray) -> float:
    return float(1.0 - np.dot(a, b))


def diagnose_arc(arc: dict, target: np.ndarray) -> dict:
    """Compute per-arc diagnostic signals for failure-mode triage."""
    steps = arc.get("steps", [])
    relax_levels = [s["relaxation_level"] for s in steps]
    transitions = [s["transition_distance"] for s in steps]
    targets = [s["distance_to_target"] for s in steps]
    frisson_hits = [s for s in steps if s["is_frisson_candidate"]]
    return {
        "n_steps": len(steps),
        "all_zero_relax": all(r == 0 for r in relax_levels) if relax_levels else None,
        "relax_distribution": {r: relax_levels.count(r) for r in set(relax_levels)} if relax_levels else {},
        "transitions_max": max(transitions) if transitions else None,
        "transitions_min": min(transitions) if transitions else None,
        "transitions_mean": (sum(transitions) / len(transitions)) if transitions else None,
        "final_distance": arc.get("final_distance"),
        "reached_target": arc.get("reached_target"),
        "frisson_hit_progresses": [round(s["progress"], 3) for s in frisson_hits],
        "frisson_count": len(frisson_hits),
        "step_ids": [s["id"] for s in steps],
        "first_3_target_distances": targets[:3],
        "last_3_target_distances": targets[-3:],
        "coherence_violations": arc.get("coherence_violations"),
    }


def compare_arcs_for_shape_inference(arc_diags: dict[str, list[dict]]) -> dict:
    """Failure-mode D: arcs across different shapes should NOT have identical step IDs.

    For each intent (column across shapes), check whether the same track IDs appear
    in the same positions across shapes. Identical sequences = shape inference dead.
    """
    findings: list[dict] = []
    # Re-pivot: index by intent text via position
    shapes = list(arc_diags.keys())
    if not shapes:
        return {"shapes_compared": [], "identical_arc_pairs": []}
    n_intents = max(len(arc_diags[s]) for s in shapes) if shapes else 0
    identical_pairs = []
    for intent_idx in range(n_intents):
        ids_per_shape = {}
        for shape in shapes:
            if intent_idx < len(arc_diags[shape]):
                ids_per_shape[shape] = arc_diags[shape][intent_idx]["step_ids"]
        # Compare pairwise
        shape_keys = list(ids_per_shape.keys())
        for i in range(len(shape_keys)):
            for j in range(i + 1, len(shape_keys)):
                a, b = shape_keys[i], shape_keys[j]
                if ids_per_shape[a] and ids_per_shape[a] == ids_per_shape[b]:
                    identical_pairs.append({
                        "intent_index": intent_idx,
                        "shape_a": a,
                        "shape_b": b,
                        "step_count": len(ids_per_shape[a]),
                    })
    return {"shapes_compared": shapes, "identical_arc_pairs": identical_pairs}


# ─── Print helpers ───────────────────────────────────────────────────────────


def print_arc(intent: str, shape: str, arc: dict, diag: dict, pool_lookup: dict[str, dict]) -> None:
    print(f"\n── {shape.upper()}: \"{intent}\" ──")
    print(f"  steps={diag['n_steps']}  reached_target={diag['reached_target']}  final_distance={diag['final_distance']}")
    print(f"  transitions: min={diag['transitions_min']:.3f} mean={diag['transitions_mean']:.3f} max={diag['transitions_max']:.3f}")
    print(f"  relaxation_distribution={diag['relax_distribution']}  violations={diag['coherence_violations']}")
    print(f"  frisson_hits at progress: {diag['frisson_hit_progresses']}  (target ≈ {FRISSON_TARGETS})")
    print("  ┌────┬──────┬──────┬────────┬────────────────────────────────────────────────────────")
    print("  │ #  │ prog │ td   │ to_tgt │ track")
    print("  ├────┼──────┼──────┼────────┼────────────────────────────────────────────────────────")
    for s in arc.get("steps", []):
        meta = pool_lookup.get(s["id"], {})
        title = meta.get("title", "?")[:40]
        artist = meta.get("artist", "?")[:25]
        frisson_marker = " *F*" if s["is_frisson_candidate"] else ""
        print(
            f"  │ {s['position_in_arc']:>2} │ {s['progress']:.2f} │ "
            f"{s['transition_distance']:.3f} │ {s['distance_to_target']:.3f}  │ "
            f"{title:<40} — {artist}{frisson_marker}"
        )
    print("  └────┴──────┴──────┴────────┴────────────────────────────────────────────────────────")

    # Per-shape listening checkpoints — these are the comparisons that matter
    print_listening_checkpoints(shape, arc.get("steps", []), pool_lookup)

    # Listen URLs (full arc, for serial play)
    uris = []
    for s in arc.get("steps", []):
        meta = pool_lookup.get(s["id"], {})
        uri = meta.get("spotify_uri") or f"spotify:track:{s['id']}"
        uris.append(uri.replace("spotify:track:", "https://open.spotify.com/track/"))
    print("  LISTEN (full arc, in order):")
    print("    " + " ".join(uris))


def _track_label(step: dict, pool_lookup: dict[str, dict]) -> str:
    meta = pool_lookup.get(step["id"], {})
    title = (meta.get("title") or "?")[:40]
    artist = (meta.get("artist") or "?")[:25]
    uri = meta.get("spotify_uri") or f"spotify:track:{step['id']}"
    url = uri.replace("spotify:track:", "https://open.spotify.com/track/")
    return f"#{step['position_in_arc']:>2}  {title:<40} — {artist:<25}  {url}"


def print_listening_checkpoints(shape: str, steps: list[dict], pool_lookup: dict[str, dict]) -> None:
    """Highlight the per-shape tracks that diagnose whether the shape is working.

    Map of the user's per-shape diagnostic:
      journey     -> compare tracks at 0, mid, last (should feel like 3 places)
      plateau     -> tracks in middle 60% should feel like the same territory
      discharge   -> early tracks (positions 1-3) must NOT feel uplifting
      peak_early  -> peak should land around position 8 (40% of 18-step arc)
    """
    if not steps:
        return
    n = len(steps)
    print("  LISTEN-FIRST CHECKPOINTS:")
    if shape == "journey":
        idx = [0, n // 2, n - 1]
        labels = ["track 1 (start)", f"track {idx[1] + 1} (middle)", f"track {n} (end)"]
        print(f"    Play these THREE only. Do they feel like three different places?")
        for i, pos in enumerate(idx):
            print(f"      [{labels[i]}]  {_track_label(steps[pos], pool_lookup)}")
        print("    FAIL signal: all three feel similar -> navigation isn't moving.")
    elif shape == "plateau":
        lo = max(0, int(n * 0.25))
        hi = min(n - 1, int(n * 0.85))
        sample_positions = [lo, (lo + hi) // 2, hi]
        print(f"    Play tracks {lo + 1}, {sample_positions[1] + 1}, {hi + 1}. "
              f"Do they feel like the SAME acoustic territory?")
        for pos in sample_positions:
            print(f"      [pos {pos + 1}]  {_track_label(steps[pos], pool_lookup)}")
        print("    FAIL signal: noticeable drift between them -> plateau hold isn't working.")
    elif shape == "discharge":
        # Tracks 1-3: must stay congruent with start, NOT uplifting
        cap = min(3, n)
        print(f"    Play the first {cap} tracks. Do they stay congruent with the heavy/sad intent?")
        for i in range(cap):
            print(f"      [pos {i + 1}]  {_track_label(steps[i], pool_lookup)}")
        print("    FAIL signal: any of these feels uplifting -> arc shape inference may not be discharge.")
        print(f"    Then play the LAST track to confirm the arc moves later: {_track_label(steps[-1], pool_lookup)}")
    elif shape == "peak_early":
        # Peak waypoint is at progress=0.4 per arc.py:waypoint_t
        target_pos = max(1, int(round(n * 0.4)) - 1)  # 0-indexed
        print(f"    Peak should be around position {target_pos + 1} (~40% of arc).")
        print(f"    Compare these three:")
        print(f"      [pos 1   start]   {_track_label(steps[0], pool_lookup)}")
        print(f"      [pos {target_pos + 1}  PEAK ?]  {_track_label(steps[target_pos], pool_lookup)}")
        print(f"      [pos {n}  end ]   {_track_label(steps[-1], pool_lookup)}")
        print("    FAIL signal: the most intense track is at position 1 or position N rather "
              "than around the marked peak -> frisson/peak positioning isn't working.")


def print_assertions(diag: dict) -> list[str]:
    """Per-arc measurable acceptance gates from the build plan."""
    issues: list[str] = []
    # All transition distances < 0.35 unless beam relaxed (relaxation_level > 0)
    if diag["transitions_max"] is not None and diag["transitions_max"] > 0.35:
        # Only an issue if it's NOT explained by relaxation
        if diag["relax_distribution"].get(0, 0) == diag["n_steps"]:
            issues.append(f"transitions_max={diag['transitions_max']:.3f} > 0.35 with no relaxation (UNEXPECTED)")
    # Final step within 0.20 cosine of target
    if diag["final_distance"] is not None and diag["final_distance"] > 0.20:
        if diag["reached_target"] is False:
            issues.append(f"final_distance={diag['final_distance']:.3f} > 0.20 (target not reached)")
    return issues


def print_failure_mode_summary(
    repro_ok: bool,
    repro_hashes: tuple[str, str],
    arc_diags: dict[str, list[dict]],
    shape_comparison: dict,
    pool_size: int,
) -> int:
    """Map observed signals to failure modes. Returns exit code (0 = all pass)."""
    print("\n" + "=" * 78)
    print("FAILURE MODE TRIAGE  (Step 1.3 acceptance)")
    print("=" * 78)

    flags = []

    # A: CLAP embeddings stability
    if not repro_ok:
        flags.append(("A", f"embed_text NOT reproducible: {repro_hashes[0]} vs {repro_hashes[1]}. "
                          "Check L2 normalisation, model.eval() mode, deterministic torch settings."))
    else:
        print(f"  [A] OK — embed_text reproducible (hash {repro_hashes[0]})")

    # B vs C distinction (PRIMARY diagnostic when arcs "sound like shuffle").
    # The Phase 1 engine is greedy-with-relaxation (NOT multi-candidate beam),
    # so the relaxation_level distribution is the most direct shuffle signal:
    #
    #   relaxation_level distribution across all arc steps:
    #     0  = tight coherence honoured; engine is finding good neighbours
    #     1  = needed 1.5x relaxation; pool starting to thin
    #     2  = needed 2.0x relaxation; pool clearly too tight
    #     3  = unbounded fallback; pool exhausted, engine picks anything
    #
    # If the majority of steps run at level >= 1, the failure is C (corpus),
    # not B (algorithm) — expanding seed_corpus.py SEED_QUERIES is the fix,
    # NOT switching to true beam search.
    all_arcs = [d for diags in arc_diags.values() for d in diags]
    if all_arcs:
        # Aggregate relaxation distribution across all arc steps
        total_relax = {0: 0, 1: 0, 2: 0, 3: 0}
        total_steps = 0
        for d in all_arcs:
            for level, count in d["relax_distribution"].items():
                total_relax[level] = total_relax.get(level, 0) + count
                total_steps += count
        if total_steps == 0:
            print("  [B/C] no steps emitted — cannot triage")
        else:
            pct = {k: 100.0 * v / total_steps for k, v in total_relax.items()}
            print(f"  [B/C] relaxation distribution across {total_steps} steps in {len(all_arcs)} arcs:")
            print(f"        level 0 (tight):       {pct.get(0, 0):.1f}%")
            print(f"        level 1 (1.5x):        {pct.get(1, 0):.1f}%")
            print(f"        level 2 (2.0x):        {pct.get(2, 0):.1f}%")
            print(f"        level 3 (unbounded):   {pct.get(3, 0):.1f}%")

            relaxed_pct = pct.get(1, 0) + pct.get(2, 0) + pct.get(3, 0)
            unbounded_pct = pct.get(3, 0)
            if unbounded_pct >= 20:
                flags.append(("C", f"{unbounded_pct:.0f}% of steps ran at relaxation level 3 "
                                  "(unbounded fallback). Pool is exhausted — expand seed_corpus "
                                  "SEED_QUERIES with more diverse acoustic regions before considering "
                                  "true beam search."))
            elif relaxed_pct >= 50:
                flags.append(("C", f"{relaxed_pct:.0f}% of steps needed relaxation. Pool is too "
                                  "tight for the targets. Expand corpus diversity first; do NOT "
                                  "upgrade arc.py to true beam search until corpus is healthy."))
            elif pct.get(0, 0) >= 80:
                print(f"  [B/C] OK — {pct.get(0, 0):.0f}% of steps satisfied tight coherence "
                      f"(greedy-with-relaxation is performing well)")

    # C secondary check: transitions clustered near zero across all arcs
    if all_arcs:
        mean_transition_overall = np.mean([d["transitions_mean"] for d in all_arcs if d["transitions_mean"] is not None])
        if mean_transition_overall < 0.05:
            flags.append(("C", f"Mean transition_distance across arcs={mean_transition_overall:.3f} — "
                              "pool likely too similar (different signal from relaxation). "
                              "Expand seed_corpus.py SEED_QUERIES."))
        else:
            print(f"  [C] OK — mean transition_distance across arcs = {mean_transition_overall:.3f}")

    # D: shape inference (different shapes producing identical arcs)
    identical = shape_comparison.get("identical_arc_pairs", [])
    if identical:
        flags.append(("D", f"{len(identical)} pairs of arcs identical across shapes: {identical}. "
                          "Shape parameter is not influencing waypoint progression."))
    else:
        print(f"  [D] OK — no identical arc sequences across shapes")

    # E: frisson — should hit at least once across all arcs in a healthy run
    total_frisson = sum(d["frisson_count"] for d in all_arcs)
    if total_frisson == 0 and len(all_arcs) >= 4:
        flags.append(("E", f"Zero frisson hits across {len(all_arcs)} arcs. "
                          "Check is_frisson_position + FRISSON_SETUP_TRACKS guard in routers/arc.py."))
    else:
        print(f"  [E] OK — {total_frisson} frisson hits across {len(all_arcs)} arcs")

    print()
    if flags:
        print(f"⚠  {len(flags)} potential failure modes detected:")
        for tag, msg in flags:
            print(f"    [{tag}] {msg}")
        print("\nDo NOT proceed to Stage 2 until these are resolved or knowingly accepted.")
        return 1

    print("All automated checks PASS. Proceed to human listen test.")
    print()
    print("Listen procedure (use the LISTEN-FIRST CHECKPOINTS block per arc above):")
    print("  journey    -> play track 1, the middle track, and the last track only.")
    print("                FAIL if they feel like the same place.")
    print("  plateau    -> play three tracks from the middle 60%. FAIL if they drift.")
    print("  discharge  -> play tracks 1-3. FAIL if any feels uplifting (re-check arc_shape log).")
    print("  peak_early -> peak should be around 40% of the arc. FAIL if peak is at start or end.")
    print()
    print("CAVEAT (iTunes audio source):")
    print("  iTunes 30-second previews start at the song's editorial 'highlight', which is")
    print("  often mid-track, not at the intro. CLAP is embedding that 30s clip — usually")
    print("  representative of the song's character, but occasionally biased toward the")
    print("  drop / chorus rather than the overall feel. If a single track feels 'off'")
    print("  but the arc as a whole holds together, this is the most likely cause and is")
    print("  not a navigation failure. If the WHOLE ARC feels off, it is a real failure;")
    print("  use the FAILURE MODE TRIAGE block above.")
    return 0


# ─── Main ────────────────────────────────────────────────────────────────────


async def run(args) -> int:
    intents_by_shape = build_intent_matrix(args)
    exclude_ids = list(args.exclude or [])

    print(f"Pool target size: {args.pool_size}  Arc length: {args.arc_length}  Service: {args.service_url}")
    if exclude_ids:
        print(f"Exclude IDs ({len(exclude_ids)}): {', '.join(exclude_ids)}")
    if args.start_track:
        print(f"Start track: {args.start_track}")
    pool = load_pool_from_db(args.pool_size)
    print(f"Loaded {len(pool)} tracks from DB for arc pool")
    pool_lookup = {p["id"]: p for p in pool}

    async with httpx.AsyncClient() as client:
        start_position = resolve_start_position(args.start_track, pool_lookup)
        if args.start_track and start_position is None:
            print(f"Start track not in corpus — embedding on demand...")
            start_position = await resolve_start_embedding(
                client, args.service_url, args.start_track, pool_lookup, persist=True
            )

        # Reproducibility / model stability check (failure-mode A)
        repro_ok, ha, hb = await reproducibility_check(client, args.service_url, "late night drive")
        print(f"Embedding reproducibility: {'OK' if repro_ok else 'FAIL'}  hashes=({ha}, {hb})")

        arc_diags: dict[str, list[dict]] = {}
        for shape, intents in intents_by_shape.items():
            arc_diags[shape] = []
            for intent in intents:
                target = await embed_text(client, args.service_url, intent)
                arc = await call_arc(
                    client, args.service_url, target, pool,
                    arc_shape=shape, arc_length=args.arc_length,
                    current_position=start_position,
                    exclude_ids=exclude_ids,
                )
                diag = diagnose_arc(arc, target)
                arc_diags[shape].append(diag)
                print_arc(intent, shape, arc, diag, pool_lookup)
                issues = print_assertions(diag)
                if issues:
                    print(f"  ⚠ acceptance issues for this arc: {issues}")

        # Cross-shape comparison for failure-mode D
        shape_comparison = compare_arcs_for_shape_inference(arc_diags)

        return print_failure_mode_summary(
            repro_ok, (ha, hb), arc_diags, shape_comparison, len(pool)
        )


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--service-url", default=DEFAULT_SERVICE_URL)
    p.add_argument("--pool-size", type=int, default=60,
                   help="Number of tracks pulled from DB into the arc pool")
    p.add_argument("--arc-length", type=int, default=18)
    p.add_argument("--intents", nargs="*",
                   help="Override default intents (e.g. --intents 'study' 'run')")
    p.add_argument("--shape", choices=list(DEFAULT_INTENTS_BY_SHAPE.keys()),
                   help="Run a single arc shape only (use with one --intents for founder listen)")
    p.add_argument("--exclude", action="append", default=[],
                   help="Spotify track ID to exclude (repeatable; sick-of / overplayed tracks)")
    p.add_argument("--start-track", metavar="ID",
                   help="Spotify track ID for current_position (real cold-start anchor)")
    args = p.parse_args()
    try:
        return asyncio.run(run(args))
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
