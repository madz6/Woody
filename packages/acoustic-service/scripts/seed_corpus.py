"""Seed the sqlite-vec corpus with ~500 acoustically diverse tracks.

Pipeline:
  Spotify search (genre/style seeds)
    -> Spotify track metadata (id, name, artist)
    -> POST /embed/audio/batch (service resolves iTunes preview, downloads, encodes)
    -> store {track row + 512D embedding} in sqlite-vec

Prerequisites:
  1. ffmpeg on PATH (librosa MP3/M4A decode)
  2. The acoustic service running at WOODY_ACOUSTIC_SERVICE_URL (default http://localhost:8765)
  3. SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET in ../../.env.local OR environment

Usage:
  python -m scripts.seed_corpus                     # 500 tracks, default seeds
  python -m scripts.seed_corpus --target 100        # smaller, faster smoke test
  python -m scripts.seed_corpus --resume            # skip already-embedded IDs
  python -m scripts.seed_corpus --seeds rock,techno # subset of seed queries

Latency budget (rough):
  CPU CLAP, 500 tracks: ~35-45 min (audio download + sequential encode)
  GPU CLAP, 500 tracks: ~8-12 min
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import os
import sys
import time
from pathlib import Path
from typing import Optional

import httpx
import numpy as np

# Allow running as `python -m scripts.seed_corpus` from packages/acoustic-service
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from db.embeddings import (  # noqa: E402
    count_embeddings,
    get_db,
    init_schema,
    is_embedded,
    store_embedding,
    upsert_track,
)
from services.clap_service import EMBEDDING_DIM  # noqa: E402


REPO_ROOT = Path(__file__).resolve().parents[3]
ENV_LOCAL = REPO_ROOT / ".env.local"
DEFAULT_SERVICE_URL = os.environ.get("WOODY_ACOUSTIC_SERVICE_URL", "http://localhost:8765")

SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"  # noqa: S105 (public OAuth endpoint)
SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search"

BATCH_SIZE = 20  # CLAP batch embed budget (service caps at 50)
PER_SEED_LIMIT = 28  # tracks fetched per Spotify search seed
MAX_TARGET = 1500


# ─── Seed queries spanning the acoustic space ────────────────────────────────
# Goal: maximise CLAP embedding diversity for a 500-track budget. Genre labels
# are a proxy for acoustic regions — they map roughly to corners of the space
# the Bayesian probe (Step 2.4) will later sample.

SEED_QUERIES: list[tuple[str, str]] = [
    # (search query, axis hint — informational only, not used by retrieval)
    ("industrial techno", "high-energy cold dense"),
    ("drum and bass", "high-energy cold dense"),
    ("death metal", "extreme energy dark"),
    ("hip hop classics", "high-energy warm"),
    ("afrobeat fela kuti", "high-energy warm organic"),
    ("ambient brian eno", "low-energy sparse"),
    ("dark ambient drone", "low-energy cold sacred"),
    ("spiritual jazz pharoah sanders", "mid-energy warm sacred"),
    ("renaissance choral", "sacred sparse"),
    ("noise rock", "dense abrasive"),
    ("math rock", "dense structured"),
    ("solo piano classical", "organic sparse"),
    ("modern classical chamber", "organic mid-density"),
    ("folk traditional acoustic", "warm organic"),
    ("indie rock", "mid-everything"),
    ("shoegaze", "warm dense"),
    ("afrobeats contemporary", "high-energy warm"),
    ("city pop japanese", "warm mid-density"),
    ("carnatic vocal", "sacred cross-cultural"),
    ("qawwali nusrat", "sacred devotional"),
]


# ─── .env.local loader ───────────────────────────────────────────────────────


def load_env_local(path: Path = ENV_LOCAL) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


# ─── Spotify auth + search ───────────────────────────────────────────────────


async def get_spotify_token(client: httpx.AsyncClient, client_id: str, secret: str) -> str:
    creds = f"{client_id}:{secret}".encode()
    b64 = base64.b64encode(creds).decode()
    resp = await client.post(
        SPOTIFY_TOKEN_URL,
        headers={"Authorization": f"Basic {b64}"},
        data={"grant_type": "client_credentials"},
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


async def spotify_search(
    client: httpx.AsyncClient, token: str, query: str, limit: int = PER_SEED_LIMIT
) -> list[dict]:
    resp = await client.get(
        SPOTIFY_SEARCH_URL,
        headers={"Authorization": f"Bearer {token}"},
        params={"q": query, "type": "track", "limit": str(limit), "market": "US"},
    )
    if resp.status_code == 429:
        retry_after = float(resp.headers.get("Retry-After", "1"))
        await asyncio.sleep(retry_after)
        return await spotify_search(client, token, query, limit)
    resp.raise_for_status()
    items = resp.json().get("tracks", {}).get("items", [])
    return items


# ─── Service health + batch embed ────────────────────────────────────────────


async def check_service_health(client: httpx.AsyncClient, base_url: str) -> dict:
    resp = await client.get(f"{base_url}/health", timeout=5.0)
    resp.raise_for_status()
    return resp.json()


async def embed_audio_batch(
    client: httpx.AsyncClient,
    base_url: str,
    tracks: list[dict],
) -> dict:
    """Call /embed/audio/batch. Returns the parsed JSON response."""
    payload = {
        "tracks": [
            {
                "id": t["id"],
                "preview_url": t.get("preview_url"),
                "artist": t["artist"],
                "title": t["name"],
            }
            for t in tracks
        ]
    }
    # Generous timeout — CPU CLAP encode for 20 tracks can take 60-90s
    resp = await client.post(
        f"{base_url}/embed/audio/batch",
        json=payload,
        timeout=300.0,
    )
    resp.raise_for_status()
    return resp.json()


# ─── Orchestration ───────────────────────────────────────────────────────────


def normalise_spotify_track(item: dict, seed_query: str) -> dict:
    artists = item.get("artists") or []
    primary_artist = artists[0]["name"] if artists else "Unknown"
    return {
        "id": item["id"],
        "name": item["name"],
        "artist": primary_artist,
        "album": (item.get("album") or {}).get("name"),
        "spotify_uri": item.get("uri"),
        "preview_url": item.get("preview_url"),
        "duration_ms": item.get("duration_ms"),
        "seed_query": seed_query,
    }


async def gather_candidates(
    client: httpx.AsyncClient,
    token: str,
    seeds: list[tuple[str, str]],
    per_seed: int,
) -> list[dict]:
    candidates: dict[str, dict] = {}
    for query, axis_hint in seeds:
        try:
            items = await spotify_search(client, token, query, limit=per_seed)
        except httpx.HTTPError as exc:
            print(f"  search FAILED for '{query}': {exc}", file=sys.stderr)
            continue
        added = 0
        for item in items:
            if not item or not item.get("id"):
                continue
            tid = item["id"]
            if tid in candidates:
                continue
            candidates[tid] = normalise_spotify_track(item, query)
            added += 1
        print(f"  '{query}' [{axis_hint}] -> {added} new candidates")
    return list(candidates.values())


async def run_seed(
    target: int,
    resume: bool,
    seed_filter: Optional[list[str]],
    service_url: str,
) -> int:
    env = load_env_local()
    client_id = env.get("SPOTIFY_CLIENT_ID") or os.environ.get("SPOTIFY_CLIENT_ID")
    secret = env.get("SPOTIFY_CLIENT_SECRET") or os.environ.get("SPOTIFY_CLIENT_SECRET")
    if not client_id or not secret:
        print("ERROR: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET required", file=sys.stderr)
        print(f"Looked in {ENV_LOCAL} and process env.", file=sys.stderr)
        return 2

    conn = get_db()
    init_schema(conn)
    initial_count = count_embeddings(conn)
    print(f"\nStarting seed run: target={target}, resume={resume}, initial_embeddings={initial_count}")
    print(f"Service URL: {service_url}")
    print(f"DB path: {conn.execute('PRAGMA database_list').fetchall()[0][2]}\n")

    # Filter seeds if user requested a subset
    seeds = SEED_QUERIES
    if seed_filter:
        wanted = {s.lower() for s in seed_filter}
        seeds = [(q, a) for q, a in SEED_QUERIES if any(w in q.lower() for w in wanted)]
        if not seeds:
            print(f"ERROR: --seeds {seed_filter} matched no SEED_QUERIES entries", file=sys.stderr)
            return 2

    async with httpx.AsyncClient() as client:
        # Health gate — fail fast if the service is not running
        try:
            health = await check_service_health(client, service_url)
            print(f"Service health: {health}\n")
        except (httpx.HTTPError, httpx.TimeoutException) as exc:
            print(f"ERROR: service not reachable at {service_url}: {exc}", file=sys.stderr)
            print("Start it first:  python -m uvicorn main:app --port 8765", file=sys.stderr)
            return 2

        print("Phase 1: gathering Spotify candidates ...")
        token = await get_spotify_token(client, client_id, secret)
        per_seed = max(15, target // max(1, len(seeds)) + 5)
        candidates = await gather_candidates(client, token, seeds, per_seed=per_seed)
        print(f"\nGathered {len(candidates)} unique Spotify candidates from {len(seeds)} seeds")

        # Filter resume — skip already-embedded IDs
        if resume:
            before = len(candidates)
            candidates = [c for c in candidates if not is_embedded(conn, c["id"])]
            print(f"Resume filter: {before - len(candidates)} already embedded, {len(candidates)} remaining")

        # Cap to target
        if target > 0 and len(candidates) > target:
            # Spread across seeds: round-robin pick rather than slice-from-front
            by_seed: dict[str, list[dict]] = {}
            for c in candidates:
                by_seed.setdefault(c["seed_query"], []).append(c)
            picked: list[dict] = []
            while len(picked) < target and any(by_seed.values()):
                for q in list(by_seed.keys()):
                    if not by_seed[q]:
                        continue
                    picked.append(by_seed[q].pop(0))
                    if len(picked) >= target:
                        break
            candidates = picked
            print(f"Capped to target: {len(candidates)} candidates after round-robin selection")

        if not candidates:
            print("Nothing to embed.")
            conn.close()
            return 0

        # Phase 2: batch embed
        print(f"\nPhase 2: embedding via {service_url}/embed/audio/batch (BATCH_SIZE={BATCH_SIZE})")
        embedded = 0
        failed = 0
        start = time.perf_counter()
        for i in range(0, len(candidates), BATCH_SIZE):
            batch = candidates[i : i + BATCH_SIZE]
            batch_label = f"batch {i // BATCH_SIZE + 1}/{(len(candidates) + BATCH_SIZE - 1) // BATCH_SIZE}"
            print(f"  {batch_label}: {len(batch)} tracks ... ", end="", flush=True)
            t0 = time.perf_counter()
            try:
                resp = await embed_audio_batch(client, service_url, batch)
            except httpx.HTTPError as exc:
                print(f"FAILED ({exc})", flush=True)
                failed += len(batch)
                continue
            results = resp.get("results", [])
            batch_failed = resp.get("failed", [])

            # Store track rows + embeddings
            by_id = {t["id"]: t for t in batch}
            for r in results:
                tid = r["id"]
                src_track = by_id.get(tid)
                if not src_track:
                    continue
                upsert_track(
                    conn,
                    track_id=tid,
                    name=src_track["name"],
                    artist=src_track["artist"],
                    album=src_track.get("album"),
                    spotify_uri=src_track.get("spotify_uri"),
                    preview_url=src_track.get("preview_url"),
                    audio_url_used=r.get("audio_url_used"),
                    audio_source=r.get("audio_source"),
                    duration_ms=src_track.get("duration_ms"),
                    seed_query=src_track.get("seed_query"),
                )
                if r.get("embedding") is None:
                    continue
                vec = np.asarray(r["embedding"], dtype=np.float32)
                if vec.shape != (EMBEDDING_DIM,):
                    print(f"  WARN: {tid} returned wrong dim {vec.shape}", flush=True)
                    continue
                store_embedding(conn, track_id=tid, embedding=vec)
                embedded += 1

            conn.commit()
            elapsed = time.perf_counter() - t0
            print(f"+{embedded - (embedded - len([r for r in results if r.get('embedding') is not None]))} ok, {len(batch_failed)} failed, {elapsed:.1f}s", flush=True)
            failed += len(batch_failed)

        total_elapsed = time.perf_counter() - start
        print(f"\nDone. embedded={embedded} failed={failed} elapsed={total_elapsed:.1f}s")
        final_count = count_embeddings(conn)
        print(f"DB now contains {final_count} embeddings (delta {final_count - initial_count})")

    conn.close()
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description="Seed the Woody acoustic corpus.")
    p.add_argument("--target", type=int, default=500,
                   help="Approximate number of tracks to embed (default 500, max 1500)")
    p.add_argument("--resume", action="store_true",
                   help="Skip tracks already present in track_embeddings")
    p.add_argument("--seeds", type=str, default="",
                   help="Comma-separated substrings; only seeds matching are used (e.g. 'rock,jazz')")
    p.add_argument("--service-url", type=str, default=DEFAULT_SERVICE_URL,
                   help=f"Acoustic service base URL (default {DEFAULT_SERVICE_URL})")
    args = p.parse_args()

    if args.target > MAX_TARGET:
        print(f"--target capped at {MAX_TARGET}", file=sys.stderr)
        args.target = MAX_TARGET

    seed_filter = [s.strip() for s in args.seeds.split(",") if s.strip()] or None

    try:
        return asyncio.run(run_seed(args.target, args.resume, seed_filter, args.service_url))
    except KeyboardInterrupt:
        print("\nInterrupted. Re-run with --resume to continue.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    sys.exit(main())
