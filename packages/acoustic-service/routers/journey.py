"""Founder-rig one-track selection backed by supported CLAP corpus tracks."""

from __future__ import annotations

import asyncio
import hashlib
import math
import time
from functools import lru_cache
from typing import Literal, Optional

import numpy as np
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from db.embeddings import find_nearest, get_db, load_embedding
from services.clap_service import get_clap

router = APIRouter(prefix="/journey", tags=["journey"])

AdjustmentKind = Literal["closer_to_current", "different_next", "change_direction"]
RELAX_THRESHOLDS = (0.35, 0.525, 0.7, math.inf)


class SkipPenalty(BaseModel):
    track_id: str
    weight: float = Field(..., ge=0.0, le=1.0)
    decisions_remaining: int = Field(..., ge=1, le=3)


class JourneyNextRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=128)
    decision_index: int = Field(..., ge=0, le=1000)
    current_track_id: str = Field(..., min_length=1, max_length=128)
    current_track_artist: str = Field(..., min_length=1, max_length=500)
    start_track_id: str = Field(..., min_length=1, max_length=128)
    direction: str = Field(..., min_length=3, max_length=1000)
    adjustment: Optional[AdjustmentKind] = None
    exclude_ids: list[str] = Field(default_factory=list, max_length=1000)
    skip_penalties: list[SkipPenalty] = Field(default_factory=list, max_length=20)


class JourneyTrackOut(BaseModel):
    id: str
    name: str
    artist: str
    album: Optional[str] = None
    spotify_uri: Optional[str] = None


class JourneyNextResponse(BaseModel):
    decision_id: str
    track: JourneyTrackOut
    confidence: float
    selection_mode: Literal["coherent"] = "coherent"
    current_embedding_available: Literal[True] = True
    transition_distance: float
    target_distance: float
    skip_penalty: float
    relaxation_level: int
    candidate_count: int
    latency_ms: float
    adjustment: Optional[AdjustmentKind] = None


class EnsureTrackRequest(BaseModel):
    track_id: str = Field(..., min_length=1, max_length=128)
    name: str = Field(..., min_length=1, max_length=500)
    artist: str = Field(..., min_length=1, max_length=500)
    album: Optional[str] = Field(None, max_length=500)
    spotify_uri: Optional[str] = Field(None, max_length=256)
    duration_ms: Optional[int] = Field(None, ge=0)
    preview_url: Optional[str] = Field(None, max_length=2048)


class EnsureTrackResponse(BaseModel):
    track_id: str
    embedded: bool
    created: bool = False
    audio_source: Optional[str] = None


class CorpusTrackOut(BaseModel):
    id: str
    name: str
    artist: str
    album: Optional[str] = None
    spotify_uri: str
    duration_ms: int = 0


class CorpusSearchResponse(BaseModel):
    tracks: list[CorpusTrackOut]


def _normalise(vector: np.ndarray) -> np.ndarray:
    norm = float(np.linalg.norm(vector))
    return vector if norm < 1e-8 else (vector / norm).astype(np.float32)


def _cosine_distance(left: np.ndarray, right: np.ndarray) -> float:
    return float(1.0 - np.dot(left, right))


def _stable_jitter(session_id: str, decision_index: int, track_id: str) -> float:
    digest = hashlib.sha256(f"{session_id}:{decision_index}:{track_id}".encode()).digest()
    return int.from_bytes(digest[:4], "big") / (2**32) * 1e-6


def _candidate_exclusions(current_track_id: str, exclude_ids: list[str]) -> set[str]:
    return set(exclude_ids) | {current_track_id}


def _effective_skip_weight(weight: float, decisions_remaining: int) -> float:
    return weight * decisions_remaining / 3.0


def _decision_score(
    *,
    transition_distance: float,
    target_distance: float,
    skip_penalty: float,
    closer_to_current: bool = False,
) -> float:
    if closer_to_current:
        return transition_distance + 0.001 * target_distance + 0.2 * skip_penalty
    return 0.78 * transition_distance + 0.22 * target_distance + 0.2 * skip_penalty


def _select_with_relaxation(scored: list[dict]) -> tuple[dict, int] | None:
    for allow_same_artist in (False, True):
        for relaxation_level, threshold in enumerate(RELAX_THRESHOLDS):
            eligible = [
                candidate
                for candidate in scored
                if candidate["transition_distance"] <= threshold
                and (allow_same_artist or not candidate["same_artist"])
            ]
            if eligible:
                return min(eligible, key=lambda candidate: candidate["score"]), relaxation_level
    return None


@lru_cache(maxsize=256)
def _cached_text_embedding(text: str) -> np.ndarray:
    return get_clap().embed_text(text)


@router.post("/next", response_model=JourneyNextResponse)
async def journey_next(req: JourneyNextRequest) -> JourneyNextResponse:
    started = time.perf_counter()
    conn = get_db(readonly=True)
    try:
        current = load_embedding(conn, req.current_track_id)
        if current is None:
            raise HTTPException(status_code=409, detail="unsupported_current_track")
        start = load_embedding(conn, req.start_track_id)
        if start is None:
            raise HTTPException(status_code=409, detail="unsupported_start_track")

        loop = asyncio.get_running_loop()
        text_target = await loop.run_in_executor(None, _cached_text_embedding, req.direction.strip())
        target = _normalise(0.6 * start + 0.4 * text_target)
        exclude = _candidate_exclusions(req.current_track_id, req.exclude_ids)
        raw_candidates: dict[str, dict] = {}
        for row in find_nearest(conn, current, k=50, exclude_ids=list(exclude)):
            raw_candidates[row["track_id"]] = row
        for row in find_nearest(conn, target, k=50, exclude_ids=list(exclude)):
            raw_candidates[row["track_id"]] = row

        penalty_vectors: list[tuple[np.ndarray, float]] = []
        for penalty in req.skip_penalties:
            vector = load_embedding(conn, penalty.track_id)
            if vector is not None:
                penalty_vectors.append((vector, _effective_skip_weight(penalty.weight, penalty.decisions_remaining)))

        current_artist = req.current_track_artist.casefold()
        scored: list[dict] = []
        for track_id, row in raw_candidates.items():
            vector = load_embedding(conn, track_id)
            if vector is None or not row.get("spotify_uri"):
                continue
            transition_distance = _cosine_distance(current, vector)
            target_distance = _cosine_distance(target, vector)
            skip_penalty = sum(
                weight * max(0.0, 1.0 - _cosine_distance(skipped, vector))
                for skipped, weight in penalty_vectors
            )
            same_artist = bool(current_artist and (row.get("artist") or "").casefold() == current_artist)
            score = _decision_score(
                transition_distance=transition_distance,
                target_distance=target_distance,
                skip_penalty=skip_penalty,
                closer_to_current=req.adjustment == "closer_to_current",
            )
            score += _stable_jitter(req.session_id, req.decision_index, track_id)
            scored.append({
                "track_id": track_id,
                "row": row,
                "score": score,
                "transition_distance": transition_distance,
                "target_distance": target_distance,
                "skip_penalty": skip_penalty,
                "same_artist": same_artist,
            })

        if not scored:
            raise HTTPException(status_code=422, detail="empty_candidate_pool")
        selection = _select_with_relaxation(scored)
        if selection is None:
            raise HTTPException(status_code=422, detail="no_candidate_after_relaxation")
        selected, relaxation_level = selection
        row = selected["row"]
        confidence = max(0.0, min(1.0, 1.0 - selected["score"]))
        decision_id = hashlib.sha256(
            f"{req.session_id}:{req.decision_index}:{selected['track_id']}".encode()
        ).hexdigest()[:20]
        return JourneyNextResponse(
            decision_id=decision_id,
            track=JourneyTrackOut(
                id=selected["track_id"],
                name=row.get("name") or "Unknown",
                artist=row.get("artist") or "Unknown",
                album=row.get("album"),
                spotify_uri=row.get("spotify_uri"),
            ),
            confidence=round(confidence, 6),
            transition_distance=round(selected["transition_distance"], 6),
            target_distance=round(selected["target_distance"], 6),
            skip_penalty=round(selected["skip_penalty"], 6),
            relaxation_level=relaxation_level,
            candidate_count=len(scored),
            latency_ms=round((time.perf_counter() - started) * 1000.0, 2),
            adjustment=req.adjustment,
        )
    finally:
        conn.close()


@router.post("/anchor", response_model=EnsureTrackResponse)
async def ensure_anchor(req: EnsureTrackRequest) -> EnsureTrackResponse:
    conn = get_db(readonly=True)
    try:
        return EnsureTrackResponse(
            track_id=req.track_id,
            embedded=load_embedding(conn, req.track_id) is not None,
        )
    finally:
        conn.close()


@router.get("/corpus/search", response_model=CorpusSearchResponse)
async def search_corpus(
    q: str = Query(..., min_length=2, max_length=200),
    limit: int = Query(10, ge=1, le=25),
) -> CorpusSearchResponse:
    conn = get_db(readonly=True)
    try:
        pattern = f"%{q.strip()}%"
        rows = conn.execute(
            """SELECT t.id, t.name, t.artist, t.album, t.spotify_uri, COALESCE(t.duration_ms, 0) AS duration_ms
                 FROM tracks t
                 JOIN track_embeddings e ON e.track_id = t.id
                WHERE t.spotify_uri IS NOT NULL
                  AND (t.name LIKE ? COLLATE NOCASE OR t.artist LIKE ? COLLATE NOCASE)
             ORDER BY CASE WHEN t.name LIKE ? COLLATE NOCASE THEN 0 ELSE 1 END, t.name
                LIMIT ?""",
            (pattern, pattern, pattern, limit),
        ).fetchall()
        return CorpusSearchResponse(tracks=[CorpusTrackOut(**dict(row)) for row in rows])
    finally:
        conn.close()
