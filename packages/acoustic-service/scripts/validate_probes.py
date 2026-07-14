"""Validate the 8 cold-start probes actually span CLAP embedding space.

This is Step 2.4's mandatory gate per the build plan: all 28 pairwise cosine
distances between the 8 probe embeddings must be > 0.30. If any pair is too
close, the Bayesian centroid (lib/coldStart.ts) will collapse onto that region
of the space regardless of how the user responds — biased cold start.

The probe list MUST match app/api/probe/route.ts PROBE_SPECS — when you swap a
probe there, re-run this script to confirm the new probe maintains span.

Usage (acoustic service must be running):
  python -m scripts.validate_probes
  python -m scripts.validate_probes --service-url https://...modal.run
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from itertools import combinations
from pathlib import Path

import httpx
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


# Mirror of PROBE_SPECS in app/api/probe/route.ts. Keep in sync manually.
# If diverged, this script's pass/fail does not reflect the deployed probes.
PROBE_SPECS = [
    ("high_energy_cold", "Aphex Twin", "Come to Daddy", "high energy + cold"),
    ("high_energy_warm", "Kendrick Lamar", "HUMBLE.", "high energy + warm"),
    ("low_energy_cold", "Stars of the Lid", "Requiem for Dying Mothers", "low energy + cold"),
    ("low_energy_warm_sacred", "Nick Drake", "Pink Moon", "low energy + warm + sacred"),
    ("high_density_mid_energy", "Death Grips", "Guillotine", "high density + mid energy"),
    ("high_organicity_low_density", "Nils Frahm", "Says", "high organicity + low density"),
    ("centre_of_mass", "Radiohead", "Exit Music (For A Film)", "mid everything"),
    ("curveball_cross_cultural", "Tinariwen", "Tamiditin Tan Ufrawan", "cross-cultural orthogonal"),
]

PAIR_DISTANCE_FLOOR = 0.30


async def embed_one(
    client: httpx.AsyncClient, base_url: str, probe_id: str, artist: str, title: str
) -> tuple[str, str, str, np.ndarray | None, str | None]:
    """Returns (probe_id, artist, title, embedding, error)."""
    try:
        resp = await client.post(
            f"{base_url}/embed/audio",
            json={"artist": artist, "title": title, "track_id": probe_id},
            timeout=120.0,
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        return probe_id, artist, title, None, f"http_error: {exc}"

    data = resp.json()
    emb = data.get("embedding")
    if emb is None:
        return probe_id, artist, title, None, data.get("error") or "no_embedding"
    arr = np.asarray(emb, dtype=np.float32)
    if arr.shape != (512,):
        return probe_id, artist, title, None, f"wrong_dim: {arr.shape}"
    # Defense: confirm it's L2-normalised
    norm = float(np.linalg.norm(arr))
    if not 0.999 < norm < 1.001:
        return probe_id, artist, title, arr, f"WARN_not_unit_norm: {norm:.4f}"
    return probe_id, artist, title, arr, None


def cosine_distance(a: np.ndarray, b: np.ndarray) -> float:
    return float(1.0 - np.dot(a, b))


async def main_async(service_url: str) -> int:
    print(f"Probe span validation against {service_url}")
    print(f"Floor: all 28 pairwise cosine distances must be > {PAIR_DISTANCE_FLOOR}\n")

    async with httpx.AsyncClient() as client:
        tasks = [
            embed_one(client, service_url, pid, artist, title)
            for pid, artist, title, _ in PROBE_SPECS
        ]
        results = await asyncio.gather(*tasks)

    embeddings: dict[str, np.ndarray] = {}
    fatal = False
    print("Per-probe embedding status:")
    print("─" * 78)
    for probe_id, artist, title, emb, err in results:
        if emb is None:
            print(f"  FAIL  {probe_id:<32} {artist} — {title}: {err}")
            fatal = True
            continue
        marker = "WARN" if err else "OK  "
        note = f" ({err})" if err else ""
        print(f"  {marker}  {probe_id:<32} {artist} — {title}{note}")
        embeddings[probe_id] = emb

    if fatal:
        print("\nFATAL: at least one probe failed to embed. Cannot validate span.")
        return 2

    # Pairwise distance matrix
    print("\nPairwise cosine distances (8 choose 2 = 28 pairs):")
    print("─" * 78)
    pairs: list[tuple[str, str, float]] = []
    for a_id, b_id in combinations(embeddings.keys(), 2):
        d = cosine_distance(embeddings[a_id], embeddings[b_id])
        pairs.append((a_id, b_id, d))
    pairs.sort(key=lambda x: x[2])

    failing = [(a, b, d) for (a, b, d) in pairs if d <= PAIR_DISTANCE_FLOOR]
    for a, b, d in pairs:
        marker = "FAIL" if d <= PAIR_DISTANCE_FLOOR else "  ok"
        print(f"  [{marker}]  {d:.4f}   {a}  vs  {b}")

    min_dist = pairs[0][2]
    max_dist = pairs[-1][2]
    mean_dist = sum(d for _, _, d in pairs) / len(pairs)

    print("\n" + "=" * 78)
    print(f"min={min_dist:.4f}  mean={mean_dist:.4f}  max={max_dist:.4f}")
    if failing:
        print(f"\nFAIL: {len(failing)} pair(s) below {PAIR_DISTANCE_FLOOR} floor:")
        for a, b, d in failing:
            print(f"  {a}  vs  {b}: distance = {d:.4f}")
        print("\nAction: replace one of the two probes in each failing pair with a")
        print("        track from an under-represented acoustic region. Re-run this")
        print("        script to confirm the replacement raises min pairwise distance.")
        return 1
    print("PASS — all probe pairs span the CLAP embedding space adequately.")
    return 0


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--service-url", default="http://localhost:8765")
    args = p.parse_args()
    return asyncio.run(main_async(args.service_url))


if __name__ == "__main__":
    sys.exit(main())
