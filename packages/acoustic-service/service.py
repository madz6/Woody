"""
Woody Acoustic Analysis Service
================================
Extracts real audio feature vectors from Spotify 30s preview URLs.
Replaces LLM-estimated audio attributes with deterministic acoustic measurements.

Features extracted per track:
  bpm            - beats per minute (RhythmExtractor)
  energy         - RMS energy normalized 0-1
  spectral_centroid - brightness of the sound (Hz, normalized 0-1)
  mfcc           - 13 MFCC coefficients (mean over time) - timbral fingerprint
  key            - musical key (e.g. "C", "F#")
  mode           - "major" | "minor"
  camelot        - Camelot wheel notation (e.g. "8B", "3A") for harmonic mixing
  loudness       - mean loudness in dBFS

Run locally (Python 3.11/3.12 venv recommended; see README for Docker):
  pip install -r requirements.txt
  python -m uvicorn service:app --host 0.0.0.0 --port 8765 --reload

Deploy to Modal:
  modal deploy modal_app.py
"""

import io
import tempfile
import os
import numpy as np
import httpx
import librosa
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Woody Acoustic Service", version="0.1.0")

# ---------------------------------------------------------------------------
# Camelot Wheel mapping: (key_index, mode) -> camelot notation
# key_index follows Krumhansl-Schmuckler / librosa convention:
#   0=C, 1=C#, 2=D, 3=D#, 4=E, 5=F, 6=F#, 7=G, 8=G#, 9=A, 10=A#, 11=B
# ---------------------------------------------------------------------------
CAMELOT_MAP = {
    # Major keys ("B" in Camelot)
    (0,  1): "8B",   # C major
    (7,  1): "9B",   # G major
    (2,  1): "10B",  # D major
    (9,  1): "11B",  # A major
    (4,  1): "12B",  # E major
    (11, 1): "1B",   # B major
    (6,  1): "2B",   # F# major
    (1,  1): "3B",   # Db major
    (8,  1): "4B",   # Ab major
    (3,  1): "5B",   # Eb major
    (10, 1): "6B",   # Bb major
    (5,  1): "7B",   # F major
    # Minor keys ("A" in Camelot)
    (9,  0): "8A",   # A minor
    (4,  0): "9A",   # E minor
    (11, 0): "10A",  # B minor
    (6,  0): "11A",  # F# minor
    (1,  0): "12A",  # C# minor
    (8,  0): "1A",   # Ab minor
    (3,  0): "2A",   # Eb minor
    (10, 0): "3A",   # Bb minor
    (5,  0): "4A",   # F minor
    (0,  0): "5A",   # C minor
    (7,  0): "6A",   # G minor
    (2,  0): "7A",   # D minor
}

KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

# Energy reference: RMS of a very loud full-scale signal ~ 0.707 (sqrt(0.5))
# We normalize against a reference RMS so 1.0 = extremely loud, 0 = silence
ENERGY_REF = 0.15  # typical loud pop track RMS


class AnalyzeRequest(BaseModel):
    preview_urls: list[str]


class FeatureVector(BaseModel):
    url: str
    bpm: float
    energy: float          # 0-1 normalized
    spectral_centroid: float  # 0-1 normalized (ref: 8000 Hz)
    mfcc: list[float]      # 13 coefficients
    key: str               # e.g. "C", "F#"
    mode: str              # "major" | "minor"
    camelot: str           # e.g. "8B", "3A"
    loudness: float        # mean dBFS (negative number, -30 = quiet, -6 = loud)
    error: Optional[str] = None


class AnalyzeResponse(BaseModel):
    results: list[FeatureVector]


def analyze_audio(y: np.ndarray, sr: int, url: str) -> FeatureVector:
    """Extract feature vector from a numpy audio array."""
    # BPM
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    bpm = float(tempo)

    # Energy (RMS)
    rms = float(np.mean(librosa.feature.rms(y=y)))
    energy = float(np.clip(rms / ENERGY_REF, 0.0, 1.0))

    # Spectral centroid (normalized by 8kHz reference)
    centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
    spectral_centroid = float(np.clip(centroid / 8000.0, 0.0, 1.0))

    # MFCC (13 coefficients, mean over time frames)
    mfcc_raw = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc = [round(float(c), 4) for c in np.mean(mfcc_raw, axis=1)]

    # Key + mode using chroma energy and Krumhansl-Schmuckler profiles
    chroma = np.mean(librosa.feature.chroma_cqt(y=y, sr=sr), axis=1)
    # Major and minor profiles (Krumhansl & Schmuckler, 1990)
    major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09,
                               2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53,
                               2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

    major_scores = np.array([
        np.corrcoef(np.roll(chroma, -i), major_profile)[0, 1]
        for i in range(12)
    ])
    minor_scores = np.array([
        np.corrcoef(np.roll(chroma, -i), minor_profile)[0, 1]
        for i in range(12)
    ])

    best_major = int(np.argmax(major_scores))
    best_minor = int(np.argmax(minor_scores))
    if major_scores[best_major] >= minor_scores[best_minor]:
        key_idx = best_major
        mode_int = 1  # major
        mode = "major"
    else:
        key_idx = best_minor
        mode_int = 0  # minor
        mode = "minor"

    key = KEY_NAMES[key_idx]
    camelot = CAMELOT_MAP.get((key_idx, mode_int), "8B")

    # Loudness (mean dBFS)
    loud_frames = librosa.amplitude_to_db(librosa.feature.rms(y=y), ref=1.0)
    loudness = float(np.mean(loud_frames))

    return FeatureVector(
        url=url,
        bpm=round(bpm, 1),
        energy=round(energy, 4),
        spectral_centroid=round(spectral_centroid, 4),
        mfcc=mfcc,
        key=key,
        mode=mode,
        camelot=camelot,
        loudness=round(loudness, 2),
    )


async def fetch_and_analyze(url: str, client: httpx.AsyncClient) -> FeatureVector:
    """Download a preview URL and extract features. Returns error field on failure."""
    try:
        resp = await client.get(url, timeout=10.0, follow_redirects=True)
        resp.raise_for_status()
        audio_bytes = resp.content

        # Write to temp file (librosa needs a file path or file-like object)
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            y, sr = librosa.load(tmp_path, sr=22050, mono=True, duration=30.0)
            return analyze_audio(y, sr, url)
        finally:
            os.unlink(tmp_path)

    except Exception as exc:
        return FeatureVector(
            url=url,
            bpm=120.0,
            energy=0.5,
            spectral_centroid=0.5,
            mfcc=[0.0] * 13,
            key="C",
            mode="major",
            camelot="8B",
            loudness=-18.0,
            error=str(exc),
        )


@app.get("/health")
async def health():
    return {"status": "ok", "service": "woody-acoustic"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    if not request.preview_urls:
        raise HTTPException(status_code=400, detail="preview_urls must not be empty")
    if len(request.preview_urls) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 URLs per request")

    import asyncio
    async with httpx.AsyncClient() as client:
        tasks = [fetch_and_analyze(url, client) for url in request.preview_urls]
        results = await asyncio.gather(*tasks)

    return AnalyzeResponse(results=list(results))
