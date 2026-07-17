# Woody Acoustic Service

> **Journey runtime note:** preview/iTunes audio resolution remains only for legacy corpus research endpoints. The mobile Journey does not fetch Spotify audio and never blocks setup on preview availability.

CLAP-based acoustic navigation + legacy Librosa feature extraction.

This is the **engine** of Woody. CLAP embeddings (`/embed/*`) provide the 512-dimensional
navigation space the arc generator (`/arc/generate`) operates in. The legacy Librosa
endpoint (`/analyze`) is retained for backward compatibility with `lib/acoustic.ts`.

See [`../../WOODY_BUILD_SPEC.md`](../../WOODY_BUILD_SPEC.md) Sections 3-6 for the canonical
spec. The acoustic architecture is summarised in [`../../.cursor/rules/woody-engine.mdc`](../../.cursor/rules/woody-engine.mdc).

## What It Returns

### `/embed/text`, `/embed/audio`, `/embed/audio/batch` (CLAP — Layer 2)

A 512-dimensional L2-normalised float vector per input. Text and audio share the
same space: the embedding of "late night drive" and a track that sounds like one
are close under cosine distance.

### `/arc/generate`

An ordered sequence of `arc_length` tracks (default 20) from the supplied pool,
navigating from `current_position` (or the pool's centre) toward `target_embedding`
with coherence between consecutive tracks bounded by `max_transition_distance`.

### `/5d/project`

Phase 1 heuristic projection of Spotify Audio Features into the 5D display
coordinates (energy / warmth / density / organicity / sacred). Display only —
never used as a navigation target.

### `/analyze` (legacy)

Librosa Layer-1 features (BPM, MFCC, key/mode, Camelot, loudness, spectral centroid).
Kept available for `lib/acoustic.ts` until callers migrate to `/embed/*`.

## Local Setup

Use **Python 3.11 or 3.12** (64-bit). torch + transformers wheels are reliably
available on these versions; Python 3.14 lacks both torch and SciPy wheels on Windows.

### Option A: Virtual environment (recommended without Docker)

```bash
# Install ffmpeg (required for MP3/M4A decoding via librosa)
brew install ffmpeg            # macOS
sudo apt install ffmpeg        # Ubuntu/Debian
winget install ffmpeg          # Windows (or `choco install ffmpeg` / `scoop install ffmpeg`)

cd packages/acoustic-service

# Create and activate a venv (examples)
python3.11 -m venv .venv && source .venv/bin/activate     # macOS / Linux
py -3.11 -m venv .venv; .\.venv\Scripts\Activate.ps1      # Windows PowerShell

python -m pip install -U pip

# CPU-only torch is fine for development. For GPU on CUDA 12:
#   python -m pip install torch --index-url https://download.pytorch.org/whl/cu121
python -m pip install -r requirements.txt

# Run with CLAP eager-loaded (recommended once installed):
#   $env:WOODY_PRELOAD_CLAP="1"   # PowerShell
#   export WOODY_PRELOAD_CLAP=1   # bash
python -m uvicorn main:app --host 0.0.0.0 --port 8765 --reload
```

First boot downloads the CLAP model (~1.5 GB) from HuggingFace to `~/.cache/huggingface/`.
This is one-time; subsequent boots load from cache in ~30s on CPU.

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
ACOUSTIC_SERVICE_TOKEN=<same value as WOODY_SERVICE_TOKEN>
```

## Deploy to Modal.com

Modal gives you serverless Python — no server to manage, pay per call.

```bash
pip install modal
modal token new
modal volume create woody-corpus
modal volume put woody-corpus data/woody.db /woody.db
modal secret create woody-acoustic-service WOODY_SERVICE_TOKEN=<long-random-value>
modal deploy modal_app.py
```

Modal prints your endpoint URL. Add it to `.env.local`:
```
ACOUSTIC_SERVICE_URL=https://<workspace>--woody-acoustic-service-fastapi-app.modal.run
ACOUSTIC_SERVICE_TOKEN=<same-long-random-value>
```

The database is operational data, not source: keep it ignored by Git and upload it separately to the volume. Every endpoint except `/health` requires `Authorization: Bearer <WOODY_SERVICE_TOKEN>`.

### POST `/journey/next`

Selects one track using provenance-weighted semantic anchor signals, available stored anchor embeddings, the accepted phase description, familiarity fit, temporary skip-region penalties, and deterministic session tie-breaking. When the current track has a stored embedding, transition coherence and relaxation are applied. Otherwise the endpoint uses a lower-confidence target-only fallback. It uses no absent Spotify audio features and does not resolve audio during the request.

### POST `/journey/anchor`

Compatibility lookup only. It reports whether an arbitrary Spotify anchor already has a stored embedding. It does not resolve, download, embed, or upsert audio.

## API

### POST `/embed/text`

```json
{ "text": "late night drive on an empty highway" }
```

Returns:
```json
{ "embedding": [0.017, -0.033, ...], "dim": 512, "latency_ms": 78.4 }
```

### POST `/embed/audio`

Legacy/research corpus tooling only; it is not called by Journey runtime.

Accepts EITHER a direct preview URL OR `artist + title` (an iTunes Search lookup
fallback is invoked when `preview_url` is absent — required because Spotify
deprecated `preview_url` for new app registrations in 2024).

```json
{ "preview_url": "https://...", "track_id": "spotify_xxx" }
// or
{ "artist": "Daft Punk", "title": "Get Lucky", "track_id": "spotify_xxx" }
```

Returns `{ "embedding": [...512...], "dim": 512, "audio_source": "preview_url" | "itunes", "audio_url_used": "..." }`.

### POST `/embed/audio/batch`

Legacy/research corpus tooling only; it is not called by Journey runtime.

```json
{ "tracks": [{ "id": "spotify_xxx", "artist": "...", "title": "..." }, ...] }
```

Max 50 tracks per call. Parallel async download, sequential CLAP encode.
Returns `{ "results": [...], "failed": [...] }` so a single bad track never breaks the batch.

### POST `/arc/generate`

```json
{
  "target_embedding": [...512...],
  "pool": [{ "id": "...", "embedding": [...512...] }, ...],
  "current_position": null,
  "arc_length": 20,
  "max_transition_distance": 0.35,
  "arc_shape": "journey",
  "exclude_ids": []
}
```

Returns `steps[]`, `reached_target`, `final_distance`, `coherence_violations`, plus
a `diagnostics` block that powers the listen-test failure-mode triage (relaxation
levels per step, frisson hits, candidates per step, early termination reason).

Arc shapes: `journey` (default), `plateau`, `discharge`, `peak_early`.

### POST `/5d/project`

```json
{ "features": { "energy": 0.6, "valence": 0.4, "acousticness": 0.3,
                "instrumentalness": 0.0, "loudness": -8.5 } }
```

Returns `{ energy, warmth, density, organicity, sacred }` for display.
Never used as a navigation target — that is always CLAP 512D.

### POST `/analyze` (legacy)

Unchanged from v0.1. Librosa Layer-1 feature extractor for direct preview URLs
(see [service.py](service.py)). Kept available so `lib/acoustic.ts` callers do
not break during the migration to `/embed/audio`.

### GET `/health`

```json
{ "status": "ok", "clap_model": "laion/larger_clap_music_and_speech",
  "clap_loaded": true, "preload": true }
```

## Architecture

Per `WOODY_BUILD_SPEC.md` Section 2:
- **Layer 0** — raw audio (preview URL or user upload)
- **Layer 1** — Librosa features (`/analyze`)
- **Layer 2** — CLAP 512D embeddings (`/embed/*`) ← navigation lives here
- **Layer 3** — 5D perceptual projection (`/5d/project`) ← display only, never navigation

The arc engine (`/arc/generate`) operates entirely in Layer 2. The 5D coords are
output-only — the engine never navigates through them. This separation is non-negotiable.
