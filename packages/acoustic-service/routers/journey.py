"""Adaptive one-track journey selection backed by the persisted CLAP corpus."""

from __future__ import annotations

import asyncio
import hashlib
import math
import time
from typing import Literal, Optional

import httpx
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from db.embeddings import find_nearest, get_db, init_schema, load_embedding, store_embedding, upsert_track
from routers.embed import _resolve_and_fetch
from services.clap_service import EMBEDDING_DIM, get_clap

router = APIRouter(prefix="/journey", tags=["journey"])

PhaseType = Literal["settle", "build", "sustain", "impact", "release"]
Knownness = Literal["known_track", "known_artist", "unseen"]
RELAX_THRESHOLDS = (0.35, 0.525, 0.7, math.inf)


class SkipPenalty(BaseModel):
    track_id: str
    weight: float = Field(..., ge=0.0, le=1.0)
    decisions_remaining: int = Field(..., ge=1, le=3)


class JourneyNextRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=128)
    decision_index: int = Field(..., ge=0, le=1000)
    current_track_id: str = Field(..., min_length=1, max_length=128)
    anchor_track_ids: list[str] = Field(..., min_length=1, max_length=3)
    phase: PhaseType
    phase_description: str = Field(..., min_length=1, max_length=1000)
    familiarity_target: float = Field(0.65, ge=0.0, le=1.0)
    known_track_ids: list[str] = Field(default_factory=list, max_length=500)
    known_artists: list[str] = Field(default_factory=list, max_length=500)
    recent_knownness: list[Knownness] = Field(default_factory=list, max_length=20)
    exclude_ids: list[str] = Field(default_factory=list, max_length=1000)
    skip_penalties: list[SkipPenalty] = Field(default_factory=list, max_length=20)


class JourneyTrackOut(BaseModel):
    id: str
    name: str
    artist: str
    album: Optional[str] = None
    spotify_uri: Optional[str] = None
    knownness: Knownness


class JourneyNextResponse(BaseModel):
    decision_id: str
    track: JourneyTrackOut
    phase: PhaseType
    confidence: float
    transition_distance: float
    target_distance: float
    familiarity_fit: float
    skip_penalty: float
    relaxation_level: int
    candidate_count: int
    latency_ms: float


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
    created: bool
    audio_source: Optional[str] = None


def _normalise(vector: np.ndarray) -> np.ndarray:
    norm = float(np.linalg.norm(vector))
    if norm < 1e-8:
        raise HTTPException(status_code=422, detail="zero_norm_embedding")
    return (vector / norm).astype(np.float32)


def _cosine_distance(left: np.ndarray, right: np.ndarray) -> float:
    return float(max(0.0, min(2.0, 1.0 - float(np.dot(left, right)))))


def _knownness(track_id: str, artist: str, known_ids: set[str], known_artists: set[str]) -> Knownness:
    if track_id in known_ids:
        return "known_track"
    if artist.casefold() in known_artists:
        return "known_artist"
    return "unseen"


def _stable_jitter(session_id: str, decision_index: int, track_id: str) -> float:
    digest = hashlib.sha256(f"{session_id}:{decision_index}:{track_id}".encode()).digest()
    return int.from_bytes(digest[:4], "big") / (2**32) * 1e-6


def _candidate_exclusions(current_track_id: str, exclude_ids: list[str]) -> set[str]:
    return set(exclude_ids) | {current_track_id}


def _effective_skip_weight(weight: float, decisions_remaining: int) -> float:
    return weight * decisions_remaining / 3.0


def _decision_score(
    *,
    phase: PhaseType,
    transition_distance: float,
    target_distance: float,
    familiarity_fit: float,
    skip_penalty: float,
) -> float:
    if phase == "impact":
        base = 0.4 * transition_distance + 0.45 * target_distance + 0.15 * familiarity_fit
    else:
        base = 0.7 * transition_distance + 0.2 * target_distance + 0.1 * familiarity_fit
    return base + 0.2 * skip_penalty


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


@router.post("/next", response_model=JourneyNextResponse)
async def journey_next(req: JourneyNextRequest) -> JourneyNextResponse:
    started = time.perf_counter()
    conn = get_db(readonly=True)
    try:
        current = load_embedding(conn, req.current_track_id)
        if current is None:
            raise HTTPException(status_code=404, detail="current_track_not_embedded")
        anchor_vectors = [load_embedding(conn, track_id) for track_id in req.anchor_track_ids]
        anchors = [vector for vector in anchor_vectors if vector is not None]
        if not anchors:
            raise HTTPException(status_code=422, detail="no_anchor_embeddings")
        anchor_target = _normalise(np.mean(anchors, axis=0))
        loop = asyncio.get_running_loop()
        text_target = await loop.run_in_executor(None, get_clap().embed_text, req.phase_description)
        target = _normalise(0.6 * anchor_target + 0.4 * text_target)

        exclude = _candidate_exclusions(req.current_track_id, req.exclude_ids)
        raw_candidates: dict[str, dict] = {}
        for row in find_nearest(conn, current, k=50, exclude_ids=list(exclude)):
            raw_candidates[row["track_id"]] = row
        for row in find_nearest(conn, target, k=50, exclude_ids=list(exclude)):
            raw_candidates[row["track_id"]] = row

        known_ids = set(req.known_track_ids)
        known_artists = {artist.casefold() for artist in req.known_artists}
        recent_values = [1.0 if item == "known_track" else 0.5 if item == "known_artist" else 0.0 for item in req.recent_knownness]
        current_familiarity = sum(recent_values) / len(recent_values) if recent_values else req.familiarity_target
        desired_familiarity = 1.0 if current_familiarity < req.familiarity_target else 0.0
        penalty_vectors: list[tuple[np.ndarray, float]] = []
        for penalty in req.skip_penalties:
            vector = load_embedding(conn, penalty.track_id)
            if vector is not None:
                penalty_vectors.append((vector, _effective_skip_weight(penalty.weight, penalty.decisions_remaining)))
        current_row = conn.execute("SELECT artist FROM tracks WHERE id = ?", (req.current_track_id,)).fetchone()
        current_artist = (current_row["artist"] if current_row else "").casefold()

        scored: list[dict] = []
        for track_id, row in raw_candidates.items():
            vector = load_embedding(conn, track_id)
            if vector is None:
                continue
            transition_distance = _cosine_distance(current, vector)
            target_distance = _cosine_distance(target, vector)
            knownness = _knownness(track_id, row.get("artist") or "", known_ids, known_artists)
            known_value = 1.0 if knownness == "known_track" else 0.5 if knownness == "known_artist" else 0.0
            familiarity_fit = abs(desired_familiarity - known_value)
            skip_penalty = sum(weight * max(0.0, 1.0 - _cosine_distance(skipped, vector)) for skipped, weight in penalty_vectors)
            same_artist = bool(current_artist and (row.get("artist") or "").casefold() == current_artist)
            score = _decision_score(
                phase=req.phase,
                transition_distance=transition_distance,
                target_distance=target_distance,
                familiarity_fit=familiarity_fit,
                skip_penalty=skip_penalty,
            )
            score += _stable_jitter(req.session_id, req.decision_index, track_id)
            scored.append({"track_id": track_id, "row": row, "score": score, "transition_distance": transition_distance, "target_distance": target_distance, "familiarity_fit": familiarity_fit, "skip_penalty": skip_penalty, "knownness": knownness, "same_artist": same_artist})

        if not scored:
            raise HTTPException(status_code=422, detail="empty_candidate_pool")
        selection = _select_with_relaxation(scored)
        if selection is None:
            raise HTTPException(status_code=422, detail="no_candidate_after_relaxation")
        selected, relaxation_level = selection

        row = selected["row"]
        confidence = max(0.0, min(1.0, 1.0 - selected["score"]))
        decision_id = hashlib.sha256(f"{req.session_id}:{req.decision_index}:{selected['track_id']}".encode()).hexdigest()[:20]
        return JourneyNextResponse(
            decision_id=decision_id,
            track=JourneyTrackOut(id=selected["track_id"], name=row.get("name") or "Unknown", artist=row.get("artist") or "Unknown", album=row.get("album"), spotify_uri=row.get("spotify_uri"), knownness=selected["knownness"]),
            phase=req.phase,
            confidence=round(confidence, 6),
            transition_distance=round(selected["transition_distance"], 6),
            target_distance=round(selected["target_distance"], 6),
            familiarity_fit=round(selected["familiarity_fit"], 6),
            skip_penalty=round(selected["skip_penalty"], 6),
            relaxation_level=relaxation_level,
            candidate_count=len(scored),
            latency_ms=round((time.perf_counter() - started) * 1000.0, 2),
        )
    finally:
        conn.close()


@router.post("/anchor", response_model=EnsureTrackResponse)
async def ensure_anchor(req: EnsureTrackRequest) -> EnsureTrackResponse:
    conn = get_db()
    try:
        init_schema(conn)
        if load_embedding(conn, req.track_id) is not None:
            return EnsureTrackResponse(track_id=req.track_id, embedded=True, created=False)
        async with httpx.AsyncClient() as client:
            audio_bytes, url_used, source = await _resolve_and_fetch(client, req.preview_url, req.artist, req.name)
        if not audio_bytes:
            raise HTTPException(status_code=422, detail="anchor_audio_unavailable")
        loop = asyncio.get_running_loop()
        vector = await loop.run_in_executor(None, get_clap().embed_audio_from_bytes, audio_bytes)
        if vector.shape != (EMBEDDING_DIM,):
            raise HTTPException(status_code=500, detail="invalid_anchor_embedding")
        upsert_track(conn, track_id=req.track_id, name=req.name, artist=req.artist, album=req.album, spotify_uri=req.spotify_uri or f"spotify:track:{req.track_id}", audio_url_used=url_used, audio_source=source, duration_ms=req.duration_ms, seed_query="journey_anchor")
        store_embedding(conn, track_id=req.track_id, embedding=vector)
        conn.commit()
        return EnsureTrackResponse(track_id=req.track_id, embedded=True, created=True, audio_source=source)
    finally:
        conn.close()
