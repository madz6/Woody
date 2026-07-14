"""Woody acoustic service — primary FastAPI app entry.

Run locally:
  py -3.11 -m venv .venv && .\.venv\Scripts\Activate.ps1   # Windows PowerShell
  python -m pip install -r requirements.txt
  python -m uvicorn main:app --host 0.0.0.0 --port 8765 --reload

Endpoints
─────────
POST /embed/text                CLAP text -> 512D vector
POST /embed/audio               Single track audio -> 512D
POST /embed/audio/batch         Up to 50 tracks
POST /arc/generate              Beam-search-with-relaxation arc in CLAP space
POST /5d/project                Phase 1 heuristic 5D projection (display only)
POST /analyze                   LEGACY Librosa features (Layer 1; kept for back compat)
GET  /health                    Liveness + model status

The legacy /analyze endpoint from service.py is mounted as-is so existing
Next.js clients (lib/acoustic.ts old path) keep working until lib/acousticService.ts
takes over.
"""

from __future__ import annotations

import logging
import os
import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from routers import arc, embed, journey, projection
from services.clap_service import MODEL_ID, get_clap, is_clap_loaded

# Import the legacy app so we can copy its routes onto the new app. The legacy
# module is self-contained and still functional (it never references CLAP).
from service import analyze as _legacy_analyze  # noqa: E402
from service import AnalyzeRequest as _LegacyAnalyzeRequest  # noqa: E402
from service import AnalyzeResponse as _LegacyAnalyzeResponse  # noqa: E402

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger("woody-acoustic")


# Eager-load CLAP if WOODY_PRELOAD_CLAP=1; otherwise lazy-load on first /embed/*.
# Modal cold starts benefit from eager load. Local dev iteration benefits from lazy.
PRELOAD = os.environ.get("WOODY_PRELOAD_CLAP", "0") == "1"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if PRELOAD:
        logger.info("Lifespan: WOODY_PRELOAD_CLAP=1 -> loading CLAP eagerly")
        get_clap()  # build the singleton; logs progress
    else:
        logger.info("Lifespan: lazy CLAP load (set WOODY_PRELOAD_CLAP=1 to preload)")
    yield
    logger.info("Lifespan: shutdown")


app = FastAPI(
    title="Woody Acoustic Service",
    version="0.2.0",
    description="CLAP navigation + arc generation + legacy Librosa features",
    lifespan=lifespan,
)

SERVICE_TOKEN = os.environ.get("WOODY_SERVICE_TOKEN", "").strip()
ALLOW_UNAUTHENTICATED = os.environ.get("WOODY_ALLOW_UNAUTHENTICATED", "0") == "1"


@app.middleware("http")
async def authenticate_service(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)
    if not SERVICE_TOKEN:
        if ALLOW_UNAUTHENTICATED:
            return await call_next(request)
        return JSONResponse({"error": "service_token_not_configured"}, status_code=503)
    expected = f"Bearer {SERVICE_TOKEN}"
    if not secrets.compare_digest(request.headers.get("authorization", ""), expected):
        return JSONResponse({"error": "unauthorized"}, status_code=401)
    return await call_next(request)

# New routers (Layer 2 navigation + Layer 3 display projection + arc generator)
app.include_router(embed.router)
app.include_router(arc.router)
app.include_router(journey.router)
app.include_router(projection.router)


# ─── Legacy compatibility ────────────────────────────────────────────────────


@app.post("/analyze", response_model=_LegacyAnalyzeResponse, tags=["legacy"])
async def legacy_analyze(request: _LegacyAnalyzeRequest) -> _LegacyAnalyzeResponse:
    """Backward-compat shim for the original Librosa feature extractor.

    New clients should use /embed/audio for CLAP navigation embeddings.
    This endpoint stays available so lib/acoustic.ts's existing
    fetchAcousticFeatures() callers don't break during the migration.
    """
    return await _legacy_analyze(request)


# ─── Health ──────────────────────────────────────────────────────────────────


@app.get("/health", tags=["meta"])
async def health() -> dict:
    return {
        "status": "ok",
        "service": "woody-acoustic",
        "version": "0.2.0",
        "clap_model": MODEL_ID,
        "clap_loaded": is_clap_loaded(),
        "preload": PRELOAD,
    }
