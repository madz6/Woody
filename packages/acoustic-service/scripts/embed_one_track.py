"""Embed a single Spotify track into woody.db (for --start-track / founder listen).

Fetches track metadata from Spotify, resolves audio via iTunes, CLAP-embeds via
the running acoustic service, and upserts tracks + track_embeddings rows.

Usage:
  python -m scripts.embed_one_track 3PsS445MHcmtroGTstfTbm
  python -m scripts.embed_one_track 3PsS445MHcmtroGTstfTbm --service-url http://localhost:8765
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import os
import sys
from pathlib import Path

import httpx
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from db.embeddings import (  # noqa: E402
    EMBEDDING_DIM,
    get_db,
    init_schema,
    load_embedding,
    store_embedding,
    upsert_track,
)
from scripts.seed_corpus import load_env_local  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[3]
ENV_LOCAL = REPO_ROOT / ".env.local"
DEFAULT_SERVICE_URL = os.environ.get("WOODY_ACOUSTIC_SERVICE_URL", "http://localhost:8765")
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_TRACK_URL = "https://api.spotify.com/v1/tracks"


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


async def fetch_spotify_track(client: httpx.AsyncClient, token: str, track_id: str) -> dict:
    resp = await client.get(
        f"{SPOTIFY_TRACK_URL}/{track_id}",
        headers={"Authorization": f"Bearer {token}"},
        params={"market": "US"},
    )
    resp.raise_for_status()
    return resp.json()


async def embed_via_service(
    client: httpx.AsyncClient,
    service_url: str,
    *,
    track_id: str,
    artist: str,
    title: str,
    preview_url: str | None,
) -> dict:
    resp = await client.post(
        f"{service_url}/embed/audio",
        json={
            "track_id": track_id,
            "artist": artist,
            "title": title,
            "preview_url": preview_url,
        },
        timeout=120.0,
    )
    resp.raise_for_status()
    return resp.json()


def _load_from_pool_or_db(track_id: str, pool_lookup: dict[str, dict] | None) -> np.ndarray | None:
    if pool_lookup and track_id in pool_lookup:
        return np.asarray(pool_lookup[track_id]["embedding"], dtype=np.float32)
    conn = get_db(readonly=True)
    try:
        emb = load_embedding(conn, track_id)
    finally:
        conn.close()
    if emb is None:
        return None
    return np.asarray(emb, dtype=np.float32)


async def resolve_start_embedding(
    client: httpx.AsyncClient,
    service_url: str,
    track_id: str,
    pool_lookup: dict[str, dict] | None = None,
    *,
    persist: bool = True,
) -> np.ndarray:
    """Return CLAP embedding for track_id; embed + optional DB persist if missing."""
    existing = _load_from_pool_or_db(track_id, pool_lookup)
    if existing is not None:
        return existing

    env = load_env_local(ENV_LOCAL)
    client_id = env.get("SPOTIFY_CLIENT_ID") or os.environ.get("SPOTIFY_CLIENT_ID")
    secret = env.get("SPOTIFY_CLIENT_SECRET") or os.environ.get("SPOTIFY_CLIENT_SECRET")
    if not client_id or not secret:
        raise RuntimeError(
            "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET required to embed unknown start tracks"
        )

    token = await get_spotify_token(client, client_id, secret)
    item = await fetch_spotify_track(client, token, track_id)
    artists = item.get("artists") or []
    artist = artists[0]["name"] if artists else "Unknown"
    title = item.get("name") or "Unknown"
    album = (item.get("album") or {}).get("name")
    preview_url = item.get("preview_url")

    print(f"  Embedding start track via service: {title} — {artist}")
    result = await embed_via_service(
        client,
        service_url,
        track_id=track_id,
        artist=artist,
        title=title,
        preview_url=preview_url,
    )
    if result.get("error") or not result.get("embedding"):
        raise RuntimeError(
            f"Failed to embed {track_id} ({title} — {artist}): {result.get('error', 'no embedding')}"
        )

    vec = np.asarray(result["embedding"], dtype=np.float32)
    if vec.shape != (EMBEDDING_DIM,):
        raise RuntimeError(f"Expected embedding dim {EMBEDDING_DIM}, got {vec.shape}")

    if persist:
        conn = get_db()
        init_schema(conn)
        upsert_track(
            conn,
            track_id=track_id,
            name=title,
            artist=artist,
            album=album,
            spotify_uri=item.get("uri"),
            preview_url=preview_url,
            audio_url_used=result.get("audio_url_used"),
            audio_source=result.get("audio_source"),
            duration_ms=item.get("duration_ms"),
            seed_query="start_track",
        )
        store_embedding(conn, track_id=track_id, embedding=vec)
        conn.commit()
        conn.close()
        print(f"  Stored in DB: {track_id}")

    return vec


async def run_embed(track_id: str, service_url: str) -> int:
    async with httpx.AsyncClient() as client:
        health = await client.get(f"{service_url}/health", timeout=10.0)
        health.raise_for_status()
        if not health.json().get("clap_loaded"):
            print("WARN: CLAP not loaded yet; first embed may be slow", file=sys.stderr)

        vec = await resolve_start_embedding(client, service_url, track_id, persist=True)
        print(f"OK: {track_id} embedded ({vec.shape[0]}D)")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description="Embed one Spotify track into woody.db")
    p.add_argument("track_id", help="Spotify track ID (22 chars)")
    p.add_argument("--service-url", default=DEFAULT_SERVICE_URL)
    args = p.parse_args()
    try:
        return asyncio.run(run_embed(args.track_id, args.service_url))
    except (httpx.HTTPError, RuntimeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
