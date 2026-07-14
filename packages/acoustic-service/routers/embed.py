"""CLAP embedding endpoints.

POST /embed/text           single text -> 512D vector
POST /embed/audio          single track (preview_url OR artist+title) -> 512D
POST /embed/audio/batch    up to 50 tracks, parallel fetch + sequential encode

All embeddings returned are L2-normalised float arrays of length 512.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Optional

import httpx
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.audio_source import fetch_audio_bytes, resolve_audio_url
from services.clap_service import EMBEDDING_DIM, get_clap

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/embed", tags=["embed"])

MAX_BATCH = 50
HTTP_FETCH_TIMEOUT = 8.0
# iTunes Search API rate-limits aggressive parallel lookups (HTTP 429).
_ITUNES_FETCH_SEM = asyncio.Semaphore(4)


# ─── Schemas ─────────────────────────────────────────────────────────────────


class EmbedTextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2048)


class EmbedTextResponse(BaseModel):
    embedding: list[float]
    dim: int = EMBEDDING_DIM
    latency_ms: float


class EmbedAudioRequest(BaseModel):
    preview_url: Optional[str] = None
    artist: Optional[str] = None
    title: Optional[str] = None
    track_id: Optional[str] = None


class EmbedAudioResponse(BaseModel):
    embedding: Optional[list[float]] = None
    dim: int = EMBEDDING_DIM
    track_id: Optional[str] = None
    audio_url_used: Optional[str] = None
    audio_source: Optional[str] = None  # "preview_url" | "itunes"
    error: Optional[str] = None
    latency_ms: float


class BatchTrackInput(BaseModel):
    id: str
    preview_url: Optional[str] = None
    artist: Optional[str] = None
    title: Optional[str] = None


class EmbedAudioBatchRequest(BaseModel):
    tracks: list[BatchTrackInput] = Field(..., min_length=1, max_length=MAX_BATCH)


class BatchTrackResult(BaseModel):
    id: str
    embedding: Optional[list[float]] = None
    audio_url_used: Optional[str] = None
    audio_source: Optional[str] = None
    error: Optional[str] = None


class EmbedAudioBatchResponse(BaseModel):
    results: list[BatchTrackResult]
    failed: list[str]
    latency_ms: float


# ─── Helpers ─────────────────────────────────────────────────────────────────


async def _resolve_and_fetch(
    client: httpx.AsyncClient, preview_url: Optional[str], artist: Optional[str], title: Optional[str]
) -> tuple[Optional[bytes], Optional[str], Optional[str]]:
    """Returns (audio_bytes, url_used, source) — any may be None on failure."""
    if preview_url and preview_url.strip():
        url = preview_url
    else:
        async with _ITUNES_FETCH_SEM:
            await asyncio.sleep(0.12)
            url = await resolve_audio_url(client, preview_url=preview_url, artist=artist, title=title)
    if not url:
        return None, None, None
    source = "preview_url" if (preview_url and preview_url == url) else "itunes"
    audio_bytes = await fetch_audio_bytes(client, url)
    if not audio_bytes:
        return None, url, source
    return audio_bytes, url, source


# ─── Endpoints ───────────────────────────────────────────────────────────────


@router.post("/text", response_model=EmbedTextResponse)
async def embed_text(req: EmbedTextRequest) -> EmbedTextResponse:
    start = time.perf_counter()
    clap = get_clap()
    # CLAP text encoding is fast (~80ms) but blocking — run in thread executor to
    # not block the event loop on CPU-only deployments.
    loop = asyncio.get_running_loop()
    try:
        vec = await loop.run_in_executor(None, clap.embed_text, req.text)
    except Exception as exc:
        logger.exception("embed_text failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"embed_text failed: {exc}") from exc

    latency_ms = (time.perf_counter() - start) * 1000.0
    return EmbedTextResponse(embedding=vec.tolist(), latency_ms=round(latency_ms, 2))


@router.post("/audio", response_model=EmbedAudioResponse)
async def embed_audio(req: EmbedAudioRequest) -> EmbedAudioResponse:
    start = time.perf_counter()
    clap = get_clap()

    if not (req.preview_url or (req.artist and req.title)):
        raise HTTPException(
            status_code=400,
            detail="embed_audio: provide preview_url or both artist+title",
        )

    async with httpx.AsyncClient() as client:
        audio_bytes, url_used, source = await _resolve_and_fetch(
            client, req.preview_url, req.artist, req.title
        )

    if not audio_bytes:
        latency_ms = (time.perf_counter() - start) * 1000.0
        return EmbedAudioResponse(
            track_id=req.track_id,
            audio_url_used=url_used,
            audio_source=source,
            error="audio_unavailable",
            latency_ms=round(latency_ms, 2),
        )

    loop = asyncio.get_running_loop()
    try:
        vec = await loop.run_in_executor(None, clap.embed_audio_from_bytes, audio_bytes)
    except Exception as exc:
        logger.exception("embed_audio failed for %s: %s", url_used, exc)
        latency_ms = (time.perf_counter() - start) * 1000.0
        return EmbedAudioResponse(
            track_id=req.track_id,
            audio_url_used=url_used,
            audio_source=source,
            error=f"clap_encode_failed: {exc}",
            latency_ms=round(latency_ms, 2),
        )

    latency_ms = (time.perf_counter() - start) * 1000.0
    return EmbedAudioResponse(
        embedding=vec.tolist(),
        track_id=req.track_id,
        audio_url_used=url_used,
        audio_source=source,
        latency_ms=round(latency_ms, 2),
    )


@router.post("/audio/batch", response_model=EmbedAudioBatchResponse)
async def embed_audio_batch(req: EmbedAudioBatchRequest) -> EmbedAudioBatchResponse:
    start = time.perf_counter()
    clap = get_clap()
    loop = asyncio.get_running_loop()

    # Phase 1: parallel async URL resolution + audio fetch (I/O bound)
    async with httpx.AsyncClient() as client:
        fetch_tasks = [
            _resolve_and_fetch(client, t.preview_url, t.artist, t.title) for t in req.tracks
        ]
        fetched = await asyncio.gather(*fetch_tasks, return_exceptions=False)

    # Phase 2: sequential CLAP inference (CPU/GPU bound — batching would help
    # but the processor varies per audio length, so we keep it sequential and
    # let GPU users add a torch DataLoader later)
    results: list[BatchTrackResult] = []
    failed: list[str] = []

    for track, (audio_bytes, url_used, source) in zip(req.tracks, fetched):
        if not audio_bytes:
            failed.append(track.id)
            results.append(
                BatchTrackResult(
                    id=track.id,
                    audio_url_used=url_used,
                    audio_source=source,
                    error="audio_unavailable",
                )
            )
            continue

        try:
            vec = await loop.run_in_executor(None, clap.embed_audio_from_bytes, audio_bytes)
        except Exception as exc:
            logger.warning("batch embed failed for %s: %s", track.id, exc)
            failed.append(track.id)
            results.append(
                BatchTrackResult(
                    id=track.id,
                    audio_url_used=url_used,
                    audio_source=source,
                    error=f"clap_encode_failed: {exc}",
                )
            )
            continue

        results.append(
            BatchTrackResult(
                id=track.id,
                embedding=vec.tolist(),
                audio_url_used=url_used,
                audio_source=source,
            )
        )

    latency_ms = (time.perf_counter() - start) * 1000.0
    return EmbedAudioBatchResponse(
        results=results,
        failed=failed,
        latency_ms=round(latency_ms, 2),
    )
