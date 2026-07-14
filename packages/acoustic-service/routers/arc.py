"""Arc generation in CLAP 512D embedding space.

Implements the algorithm from WOODY_BUILD_SPEC.md Section 3.5:
  - Greedy selection with progressive coherence relaxation (1.0x -> 1.5x -> 2.0x -> inf)
  - Shape-aware waypoint interpolation (journey / plateau / discharge / peak_early)
  - Frisson candidate flagging at 30/65/85% of arc progress

True multi-candidate beam search is a Phase 2 upgrade — see TODO at the bottom.
Phase 1 deliberately ships greedy because the relaxation schedule provides the
escape valve and the pool sizes (<= 50 tracks) make true beam marginal.

Diagnostic logging is mandatory for the listen-test failure-mode triage matrix
(WOODY_BUILD_SPEC plan, "Listen test failure diagnosis" section).
"""

from __future__ import annotations

import logging
import math
import time
from typing import Literal, Optional

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.clap_service import EMBEDDING_DIM

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/arc", tags=["arc"])

ArcShape = Literal["journey", "plateau", "discharge", "peak_early"]

# Coherence relaxation schedule applied to max_transition_distance.
# Maps directly to failure-mode B diagnostics in the listen-test plan.
RELAX_SCHEDULE: tuple[float, ...] = (1.0, 1.5, 2.0, math.inf)

# Frisson positions and tolerance per spec.
FRISSON_POSITIONS: tuple[float, ...] = (0.30, 0.65, 0.85)
FRISSON_TOLERANCE: float = 0.06
FRISSON_SETUP_TRACKS: int = 3  # require at least 3 tracks before any frisson flag


# ─── Schemas ─────────────────────────────────────────────────────────────────


class PoolTrack(BaseModel):
    id: str
    embedding: list[float] = Field(..., min_length=EMBEDDING_DIM, max_length=EMBEDDING_DIM)


class ArcGenerateRequest(BaseModel):
    target_embedding: list[float] = Field(..., min_length=EMBEDDING_DIM, max_length=EMBEDDING_DIM)
    pool: list[PoolTrack] = Field(..., min_length=1)
    current_position: Optional[list[float]] = None
    arc_length: int = Field(20, ge=1, le=200)
    max_transition_distance: float = Field(0.35, gt=0.0, le=2.0)
    exclude_ids: list[str] = Field(default_factory=list)
    arc_shape: ArcShape = "journey"


class ArcStepOut(BaseModel):
    id: str
    position_in_arc: int
    progress: float
    transition_distance: float
    distance_to_target: float
    is_frisson_candidate: bool
    waypoint_distance: float
    relaxation_level: int  # 0..3 — diagnostic: 0=tight constraint, 3=unbounded fallback


class ArcGenerateResponse(BaseModel):
    steps: list[ArcStepOut]
    arc_shape: ArcShape
    reached_target: bool
    final_distance: float
    coherence_violations: int
    pool_size_used: int
    diagnostics: dict  # for failure-mode triage; never user-facing
    latency_ms: float


# ─── Math primitives ─────────────────────────────────────────────────────────


def cosine_distance(a: np.ndarray, b: np.ndarray) -> float:
    """For unit-normalised vectors only: cosine distance = 1 - dot.

    Range [0, 2]. We do not renormalise here — callers are responsible
    for ensuring inputs are unit vectors (CLAPService.embed_* guarantees this).
    """
    return float(1.0 - np.dot(a, b))


def lerp_embedding(start: np.ndarray, end: np.ndarray, t: float) -> np.ndarray:
    """Linear interpolation between two unit vectors, renormalised.

    True spherical interpolation (slerp) would be marginally more correct on
    the unit hypersphere but lerp + renormalise is within 1% on small angles
    and avoids the sin(omega) numerical edge cases.
    """
    t = max(0.0, min(1.0, t))
    vec = start + (end - start) * t
    norm = float(np.linalg.norm(vec))
    return vec / norm if norm > 1e-8 else end.copy()


def is_frisson_position(progress: float) -> bool:
    return any(abs(progress - target) < FRISSON_TOLERANCE for target in FRISSON_POSITIONS)


# ─── Waypoint shapes ─────────────────────────────────────────────────────────


def waypoint_t(progress: float, shape: ArcShape) -> float:
    """Per-shape mapping from arc progress (0..1) to start->target interp parameter.

    journey     : linear t = progress
    plateau     : reach target by 40% then hold (clamped to 1.0)
    discharge   : stay congruent with start for first 40%, then move toward target
    peak_early  : arc to target at 40%, then descend halfway back (BRAC recovery)
    """
    if shape == "plateau":
        return min(1.0, progress / 0.4)
    if shape == "discharge":
        if progress <= 0.4:
            return 0.0
        return (progress - 0.4) / 0.6
    if shape == "peak_early":
        if progress <= 0.4:
            return progress / 0.4
        # peak at 1.0 (40%) then decay halfway: 1.0 -> 0.5 over remaining 60%
        return 1.0 - ((progress - 0.4) / 0.6) * 0.5
    # journey (default)
    return progress


# ─── Generation ──────────────────────────────────────────────────────────────


def _to_unit_array(values: list[float], label: str) -> np.ndarray:
    arr = np.asarray(values, dtype=np.float32)
    if arr.shape != (EMBEDDING_DIM,):
        raise HTTPException(status_code=400, detail=f"{label}: expected {EMBEDDING_DIM} dims, got {arr.shape[0]}")
    norm = float(np.linalg.norm(arr))
    if norm < 1e-8:
        raise HTTPException(status_code=400, detail=f"{label}: zero-norm vector")
    # If the caller forgot to normalise, do it here. Boundary defense, not a guarantee.
    return arr / norm


def _generate(
    target: np.ndarray,
    pool: list[tuple[str, np.ndarray]],
    arc_length: int,
    max_transition_distance: float,
    arc_shape: ArcShape,
    current_position: Optional[np.ndarray],
    exclude: set[str],
) -> tuple[list[dict], int, dict]:
    """Core arc generator. Returns (steps, coherence_violations, diagnostics)."""

    # Filter the pool to usable candidates.
    candidates = [(tid, emb) for tid, emb in pool if tid not in exclude]
    if not candidates:
        return [], 0, {"reason": "empty_pool_after_exclude"}

    # Determine start position per Psychology Law 2: meet user where they are.
    if current_position is None:
        # Without a known current position, pick the pool track closest to the
        # midpoint between an arbitrary anchor and the target. The spec uses
        # candidates[0] as anchor — we keep that to match deterministic seed test output.
        current_position = lerp_embedding(candidates[0][1], target, 0.1)

    prev_embedding = current_position
    used: set[str] = set(exclude)
    completed: list[dict] = []
    coherence_violations = 0

    # Diagnostic counters
    diag = {
        "pool_size_initial": len(candidates),
        "candidates_per_step": [],
        "relaxation_used_per_step": [],
        "frisson_hits": [],
    }

    for i in range(arc_length):
        progress = (i + 1) / arc_length
        t = waypoint_t(progress, arc_shape)
        waypoint = lerp_embedding(current_position, target, t)

        available = [(tid, emb) for tid, emb in candidates if tid not in used]
        if not available:
            diag["terminated_early_at_step"] = i
            break
        diag["candidates_per_step"].append(len(available))

        # Score by waypoint proximity; track each candidate's transition distance.
        scored: list[tuple[str, np.ndarray, float, float]] = []
        for tid, emb in available:
            wd = cosine_distance(emb, waypoint)
            td = cosine_distance(prev_embedding, emb)
            scored.append((tid, emb, wd, td))
        scored.sort(key=lambda x: x[2])  # best waypoint match first

        # Pick nearest-to-waypoint candidate satisfying coherence at the current relaxation level
        chosen: Optional[tuple[str, np.ndarray, float, float, int]] = None
        for relax_level, multiplier in enumerate(RELAX_SCHEDULE):
            limit = max_transition_distance * multiplier
            for tid, emb, wd, td in scored:
                if td <= limit:
                    chosen = (tid, emb, wd, td, relax_level)
                    if relax_level > 0:
                        coherence_violations += 1
                    break
            if chosen is not None:
                break

        if chosen is None:
            diag["terminated_early_at_step"] = i
            diag["termination_reason"] = "no_candidate_under_any_relaxation"
            break

        tid, emb, wd, td, relax_level = chosen
        diag["relaxation_used_per_step"].append(relax_level)

        # Frisson rules:
        #   1. Position must be within tolerance of 30/65/85% progress
        #   2. At least FRISSON_SETUP_TRACKS tracks before it
        #   3. Transition must NOT have relaxed (relax_level == 0) — the energy spike
        #      requires the path to remain coherent, otherwise it's just a jump
        frisson = (
            is_frisson_position(progress)
            and i >= FRISSON_SETUP_TRACKS
            and relax_level == 0
        )
        if frisson:
            diag["frisson_hits"].append({"step": i, "progress": round(progress, 3)})

        completed.append({
            "id": tid,
            "position_in_arc": i,
            "progress": round(progress, 4),
            "transition_distance": round(td, 4),
            "distance_to_target": round(cosine_distance(emb, target), 4),
            "is_frisson_candidate": frisson,
            "waypoint_distance": round(wd, 4),
            "relaxation_level": relax_level,
        })
        used.add(tid)
        prev_embedding = emb

    return completed, coherence_violations, diag


@router.post("/generate", response_model=ArcGenerateResponse)
async def arc_generate(req: ArcGenerateRequest) -> ArcGenerateResponse:
    start = time.perf_counter()
    target = _to_unit_array(req.target_embedding, "target_embedding")
    current_pos = (
        _to_unit_array(req.current_position, "current_position")
        if req.current_position is not None
        else None
    )

    pool: list[tuple[str, np.ndarray]] = []
    for p in req.pool:
        try:
            pool.append((p.id, _to_unit_array(p.embedding, f"pool[{p.id}]")))
        except HTTPException as exc:
            # Bad single-pool entries are skipped rather than failing the whole call.
            logger.warning("arc_generate: skipping pool entry %s: %s", p.id, exc.detail)

    if not pool:
        raise HTTPException(status_code=422, detail="No valid pool entries after validation")

    steps, violations, diag = _generate(
        target=target,
        pool=pool,
        arc_length=req.arc_length,
        max_transition_distance=req.max_transition_distance,
        arc_shape=req.arc_shape,
        current_position=current_pos,
        exclude=set(req.exclude_ids),
    )

    final_dist = steps[-1]["distance_to_target"] if steps else 1.0
    reached = bool(steps) and final_dist <= 0.2
    latency_ms = (time.perf_counter() - start) * 1000.0

    return ArcGenerateResponse(
        steps=[ArcStepOut(**s) for s in steps],
        arc_shape=req.arc_shape,
        reached_target=reached,
        final_distance=round(final_dist, 4),
        coherence_violations=violations,
        pool_size_used=len(pool),
        diagnostics=diag,
        latency_ms=round(latency_ms, 2),
    )


# TODO (Phase 2): True beam search with beam_width > 1.
# The current implementation is greedy with relaxation per WOODY_BUILD_SPEC.md
# Section 3.5. Failure-mode B in the listen-test plan ("beam search is greedy")
# is expected during Phase 1 — diagnose with the relaxation_level field, not
# by adding beam_width prematurely. Beam earns its place if listen tests
# show consistent local-minima trapping on diverse pools.
