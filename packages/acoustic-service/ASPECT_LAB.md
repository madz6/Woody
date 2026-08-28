# Aspect Analysis Lab

This is a local research tool. It never reads, records, or decrypts Spotify audio and is not imported by the deployed FastAPI service.

## Inputs

1. Export research JSON from `/lab` after marking moments.
2. Supply processable local audio files.
3. Create a mapping JSON from Spotify track IDs to local paths:

```json
{
  "spotify_track_id": "C:/Music/example.wav"
}
```

Raw files, separated stems, the research database, and trial exports are ignored by Git.

## Setup

```powershell
cd packages/acoustic-service
.\.venv\Scripts\python.exe -m pip install -r requirements-aspect-lab.txt
```

Demucs model weights download on first use. The tool separates `drums`, `bass`, `vocals`, and `other`, then analyzes each marked 12-second window with CLAP and deterministic librosa descriptors.

## Analyze

```powershell
.\.venv\Scripts\python.exe scripts\aspect_lab.py analyze `
  --export C:\path\woody-research.json `
  --mapping C:\path\aspect-mapping.json
```

Failures are stored in `aspect_segments.status/error`; missing audio or stems never silently fall back to whole-track analysis.

## Compare

```powershell
.\.venv\Scripts\python.exe scripts\aspect_lab.py compare --capture-id CAPTURE_ID
```

The result contains the nearest whole-segment CLAP baseline and the aspect-aware result. Run at least ten blinded comparisons before integrating aspect scores into the live selector.
