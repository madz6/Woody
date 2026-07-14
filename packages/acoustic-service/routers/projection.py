"""5D perceptual projection — display layer only.

Phase 1: heuristic formula on Spotify Audio Features (per
MASTER_BUILD_PROMPT.md Section 2 and WOODY_BUILD_SPEC.md Section 3.3).

This endpoint exists so the Next.js app has ONE place to compute 5D
coordinates for the territory map / acoustic field. It is NEVER used as a
navigation target. The arc engine operates entirely in 512D CLAP space.

Phase 2: replace the formula with a Ridge regression linear probe trained on
500 hand-annotated tracks (CLAP -> 5D). The endpoint signature will gain a
`clap_embedding` field at that time; existing callers using `features` keep
working unchanged.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/5d", tags=["projection"])


def _clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


class SpotifyFeatures(BaseModel):
    energy: float = Field(..., ge=0.0, le=1.0)
    valence: float = Field(..., ge=0.0, le=1.0)
    acousticness: float = Field(..., ge=0.0, le=1.0)
    instrumentalness: float = Field(..., ge=0.0, le=1.0)
    loudness: float = Field(..., ge=-60.0, le=10.0)  # dB
    tempo: Optional[float] = None  # not used in the heuristic but accepted


class ProjectRequest(BaseModel):
    features: Optional[SpotifyFeatures] = None
    # Phase 2 path — present so the contract is stable. Returns 501 today.
    clap_embedding: Optional[list[float]] = None


class ProjectResponse(BaseModel):
    energy: float
    warmth: float
    density: float
    organicity: float
    sacred: float
    source: str  # "spotify_features_heuristic" | "clap_probe"


def spotify_to_5d(features: SpotifyFeatures) -> dict[str, float]:
    """Phase 1 heuristic formula. Display only — see module docstring."""
    loudness_n = (features.loudness + 60.0) / 60.0  # map [-60, 0] dB to [0, 1]
    return {
        "energy": _clamp(features.energy),
        "warmth": _clamp(features.valence * 0.6 + features.acousticness * 0.4),
        "density": _clamp(loudness_n * 0.5 + features.energy * 0.5),
        "organicity": _clamp(features.acousticness * 0.6 + features.instrumentalness * 0.4),
        "sacred": _clamp(
            features.valence * 0.3 + features.instrumentalness * 0.4 + features.acousticness * 0.3
        ),
    }


@router.post("/project", response_model=ProjectResponse)
async def project(req: ProjectRequest) -> ProjectResponse:
    if req.clap_embedding is not None:
        # Phase 2 path — explicit so callers can detect it.
        raise HTTPException(
            status_code=501,
            detail=(
                "CLAP -> 5D projection requires a trained linear probe "
                "(Phase 2). Pass `features` for the Phase 1 heuristic."
            ),
        )

    if req.features is None:
        raise HTTPException(
            status_code=400,
            detail="Provide either `features` (Spotify Audio Features) or `clap_embedding` (Phase 2).",
        )

    coords = spotify_to_5d(req.features)
    return ProjectResponse(**coords, source="spotify_features_heuristic")
