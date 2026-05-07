# Woody Acoustic Service

Deterministic audio feature extraction from Spotify 30s preview URLs.

This service is the foundation of Woody's personal taste model. It replaces LLM-estimated
audio attributes with real measurements extracted directly from audio.

## What It Returns

For each preview URL, you get a feature vector:

| Field | Type | Description |
|---|---|---|
| `bpm` | float | Beats per minute |
| `energy` | float 0-1 | RMS energy (0=silent, 1=very loud) |
| `spectral_centroid` | float 0-1 | Brightness (0=bass-heavy, 1=treble-heavy) |
| `mfcc` | float[13] | Timbral fingerprint (MFCC coefficients) |
| `key` | string | Musical key (C, C#, D, ... B) |
| `mode` | string | "major" or "minor" |
| `camelot` | string | Camelot wheel notation (8B, 3A, etc.) for harmonic mixing |
| `loudness` | float dBFS | Mean loudness (-30=quiet, -6=loud) |

## Local Setup

Use **Python 3.11 or 3.12** (64-bit). Newer interpreters (for example **3.14**) often lack
prebuilt **SciPy** wheels on Windows, so `pip` falls back to a source build and fails unless
you install a Fortran toolchain. On Linux/macOS, matching the supported Python range still
avoids unnecessary builds.

### Option A: Virtual environment (recommended without Docker)

```bash
# Install ffmpeg (required for MP3 decoding)
brew install ffmpeg            # macOS
sudo apt install ffmpeg        # Ubuntu/Debian
# Windows: install ffmpeg and ensure it is on PATH, or use Chocolatey: choco install ffmpeg

cd packages/acoustic-service

# Create and activate a venv (examples)
python3.12 -m venv .venv && source .venv/bin/activate   # macOS / Linux
py -3.12 -m venv .venv; .\.venv\Scripts\Activate.ps1      # Windows PowerShell

python -m pip install -U pip
python -m pip install -r requirements.txt

python -m uvicorn service:app --host 0.0.0.0 --port 8765 --reload
```

### Option B: Docker

No local Fortran toolchain or Python version wrestling: the image uses **Python 3.12 on Linux**
with wheels for NumPy/SciPy, plus **ffmpeg** and **libsndfile**.

From `packages/acoustic-service`:

```bash
docker compose up --build
```

The API listens on **http://localhost:8765**.

Add to `.env.local` (Next.js on the host talking to the container):

```
ACOUSTIC_SERVICE_URL=http://localhost:8765
```

## Deploy to Modal.com

Modal gives you serverless Python — no server to manage, pay per call.

```bash
pip install modal
modal token new        # one-time auth
modal deploy modal_app.py
```

Modal prints your endpoint URL. Add it to `.env.local`:
```
ACOUSTIC_SERVICE_URL=https://<workspace>--woody-acoustic-service-fastapi-app.modal.run
```

## API

### POST /analyze

```json
{
  "preview_urls": [
    "https://p.scdn.co/mp3-preview/abc123...",
    "https://p.scdn.co/mp3-preview/def456..."
  ]
}
```

Response:
```json
{
  "results": [
    {
      "url": "https://p.scdn.co/mp3-preview/abc123...",
      "bpm": 142.0,
      "energy": 0.72,
      "spectral_centroid": 0.48,
      "mfcc": [21.3, -14.2, 8.1, ...],
      "key": "F#",
      "mode": "minor",
      "camelot": "11A",
      "loudness": -9.4
    }
  ]
}
```

Tracks where the preview URL is null or fails are returned with `error` field set
and sensible neutral defaults — so one bad URL never breaks the whole batch.

## Architecture Note

This service is intentionally dumb. It measures audio. It doesn't recommend anything.
The intelligence layer (personal taste model, Bayesian updating, acoustic ranking)
lives in `lib/acoustic.ts` on the Next.js side. This service just extracts features.

Next step after this is running: build the personal taste centroid in acoustic feature
space (weighted mean of kept/saved tracks) and use acoustic distance for pool ranking.
That's when "Young Nudy meets Tame Impala" stops returning XXXTentacion copies.
