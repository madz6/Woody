# Build Plan — Layer 1: Musical DNA Extraction
*Drop this into Cursor. Do NOT start until gate_listen passes.*

---

## What This Builds

Layer 1 of the 6-layer architecture: extraction of five research-validated musical properties from raw audio. These feed into the CLAP embedding layer (Layer 2) and eventually the knowledge graph (Layer 4).

**Five properties (research-validated minimum set):**
| Property | Tool | Output |
|----------|------|--------|
| Tempo + rhythmic feel | Essentia | BPM, beat grid, groove descriptor |
| Mode + harmonic content | madmom | Key, mode (maj/min), chord sequence |
| Melodic contour | Basic Pitch → MIDI → contour | Contour shape descriptor (ascending/descending/arch/valley/flat) |
| Timbral character | Essentia | Spectral centroid, brightness, roughness, warmth proxy |
| Dynamic envelope | Essentia | RMS envelope, dynamic range, build detection |

**NOT in scope:** Demucs (source separation) — on-demand only, Phase 2.

---

## Prerequisites

```bash
pip install essentia-tensorflow --break-system-packages
pip install basic-pitch --break-system-packages
pip install madmom --break-system-packages
pip install pretty_midi --break-system-packages
```

Verify each imports without error before starting code.

---

## Files to Create

### 1. `packages/acoustic-service/services/dna_extractor.py`

Single class `DNAExtractor` with:

```python
class DNAExtractor:
    def extract(self, audio_path: str) -> MusicalDNA:
        """
        Returns MusicalDNA dataclass with all five properties.
        audio_path: local file path to audio (wav or mp3).
        """
```

Internal methods (private):
- `_extract_tempo_rhythm(audio, sr)` → `TempoRhythm`
- `_extract_harmony(audio_path)` → `HarmonyFeatures` (madmom needs file path not array)
- `_extract_melodic_contour(audio_path)` → `MelodicContour`
- `_extract_timbre(audio, sr)` → `TimbralCharacter`
- `_extract_dynamics(audio, sr)` → `DynamicEnvelope`

Use Essentia's `MonoLoader` for audio loading (not librosa — Essentia is already a dep).

**Melodic contour extraction pipeline:**
1. Basic Pitch: `audio_path → midi_data`
2. Extract highest-confidence melody track from MIDI
3. Convert to pitch sequence
4. Compute contour: slope over 8-note windows → classify as ascending/descending/arch/valley/flat/complex
5. Return dominant contour type + contour_complexity score (0-1)

**Hard stops:**
- NO Spotify Audio Features — these are deprecated/403 for our app
- NO hardcoded numerical thresholds for signal quality — log warnings, don't gate
- NO Demucs in this file — timbral analysis is on mixed audio for now

---

### 2. `packages/acoustic-service/types/dna_types.py`

Dataclasses only:

```python
@dataclass
class TempoRhythm:
    bpm: float
    bpm_confidence: float
    groove_descriptor: str  # "straight" | "swung" | "complex" | "rubato"

@dataclass  
class HarmonyFeatures:
    key: str           # e.g. "C", "F#"
    mode: str          # "major" | "minor" | "ambiguous"
    mode_confidence: float
    chord_complexity: float  # 0-1, derived from chord variety in sequence

@dataclass
class MelodicContour:
    dominant_shape: str  # "ascending" | "descending" | "arch" | "valley" | "flat" | "complex"
    complexity: float    # 0-1
    has_melody: bool     # False for pure ambient/rhythmic tracks

@dataclass
class TimbralCharacter:
    spectral_centroid_mean: float  # Hz — proxy for brightness
    spectral_rolloff_mean: float
    roughness: float               # 0-1
    warmth_proxy: float            # inverse brightness normalised 0-1

@dataclass
class DynamicEnvelope:
    dynamic_range_db: float
    has_build: bool       # True if RMS increases >6dB over any 30s window
    peak_position: float  # 0-1, where in track the loudest moment occurs

@dataclass
class MusicalDNA:
    track_id: str
    tempo_rhythm: TempoRhythm
    harmony: HarmonyFeatures
    melodic_contour: MelodicContour
    timbre: TimbralCharacter
    dynamics: DynamicEnvelope
    extraction_version: str = "1.0"
    extracted_at: str = ""  # ISO timestamp
```

---

### 3. `packages/acoustic-service/routers/dna.py`

Two endpoints:

```
POST /dna/extract
  body: { track_id: str, audio_url: str }
  → resolves audio (iTunes Search or direct URL)
  → downloads to temp file
  → runs DNAExtractor.extract()
  → stores result in db
  → returns MusicalDNA as JSON

GET /dna/{track_id}
  → returns stored MusicalDNA from db
  → 404 if not found
```

Reuse the existing `audio_source.py` resolver for `audio_url` resolution. Download to `/tmp/{track_id}.mp3`, clean up after extraction.

---

### 4. `packages/acoustic-service/db/schema_dna.sql`

```sql
CREATE TABLE IF NOT EXISTS musical_dna (
    track_id TEXT PRIMARY KEY,
    dna_json TEXT NOT NULL,          -- full MusicalDNA as JSON
    extraction_version TEXT NOT NULL,
    extracted_at TEXT NOT NULL
);
```

Run this in `init_db.py` alongside existing schema.

---

### 5. `packages/acoustic-service/scripts/test_dna.py`

Test against 5 probe tracks spanning different musical characters:
- 1 ambient/electronic (expect: flat contour, complex harmony, has_build=True)
- 1 classical (expect: arch contour, clear key/mode, high complexity)
- 1 hip-hop/rap (expect: straight groove, straight rhythm, low melodic complexity)
- 1 jazz (expect: swung groove, complex harmony, high chord_complexity)
- 1 pop (expect: ascending or arch contour, major mode, has_build likely)

Print results. Eyeball them. If any extraction throws an exception, the build is not done.

---

## Anti-Slop Checklist

Before closing todos in Cursor:

- [ ] `python -c "import essentia; import madmom; from basic_pitch.inference import predict"` runs without error
- [ ] `DNAExtractor().extract(path)` returns a populated `MusicalDNA` for a real audio file
- [ ] `has_melody=False` returned for a known ambient/drum-only track
- [ ] `/dna/extract` endpoint returns 200 with valid JSON
- [ ] `/dna/{track_id}` returns the same data on second call (from db, not re-extracted)
- [ ] `test_dna.py` runs to completion with no exceptions
- [ ] No Spotify calls anywhere in the new files

---

## Failure Mode Diagnosis

| Symptom | Likely cause |
|---------|-------------|
| madmom import error | Needs `pip install madmom` + may need `cython` first |
| Basic Pitch returns empty MIDI | Audio too short or pure percussion — `has_melody=False` is correct |
| Essentia MonoLoader fails on mp3 | Try converting to wav first with `ffmpeg` |
| Contour always returns "complex" | Melody extraction picking up chords not melody — filter to highest pitch track |
| `/dna/extract` times out | Extraction is synchronous and slow — acceptable for now, async queue is Phase 2 |

---

## Cursor Execution Notes

- Work file by file in the order listed above
- Do not install packages that aren't in the list — no librosa, no mir_eval for now
- If madmom chord recognition is unreliable, fall back to Essentia's tonal extractor for key/mode and set chord_complexity=0.0 with a TODO comment
- The melodic contour pipeline is the highest-risk step — if Basic Pitch integration is painful, stub `has_melody=False` and `dominant_shape="unknown"` and note it as Phase 2
- DNA extraction will be slow (~30-60s per track on CPU) — this is acceptable for Phase 1

*Last updated: 2026-06-23*
