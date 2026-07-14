# Woody — Complete Technical Build Specification
*Version 2. Supersedes Section 2, 3, 5, 8 of MASTER_BUILD_PROMPT.md on all architecture and engine decisions.*
*Last updated: 2026-05-13. Read before touching any engine code.*

---

## AUTHORITY HIERARCHY

Conflicts resolve in this order:
1. This document (WOODY_BUILD_SPEC.md) — architecture and engine
2. MASTER_BUILD_PROMPT.md — product framing, visual language, psychology laws
3. VISUAL_LANGUAGE.md — visual decisions (closed)
4. PSYCHOLOGY.md — behavioral laws
5. FEATURES.md — feature registry
6. SHELVED.md — rejected ideas (check before re-proposing)
7. SESSION_NOTES.md — conversational decisions

**Key correction from MASTER_BUILD_PROMPT.md Section 2:** The Spotify Audio Features → 5D linear formula is a Phase 1 heuristic only — it is NOT the permanent architecture. It is being superseded by CLAP embeddings as described in this document. All distance functions and arc generation operate in CLAP embedding space, not 5D projection space. The 5D projection is display-only.

---

## SECTION 1 — WHAT IS ACTUALLY BEING BUILT

Woody is an acoustic navigation engine. The user gives it a target state ("zone 2 run energy", "anxious and want something that meets me there first"), and the engine finds a path through acoustic space to reach it. This is not a recommendation engine — a recommendation engine serves more of what you liked. Woody navigates to where you need to go.

The distinction in code: a recommendation engine maximises similarity to past behaviour. A navigation engine computes a trajectory from current acoustic position toward a target coordinate, subject to coherence constraints between steps.

**The prototype objective:** Build a demonstrable arc engine. A user types an intent, Woody generates a 20-track acoustic arc that provably moves from start state toward target state, with measurable coherence between consecutive tracks. This is the IP. Everything else is surface.

---

## SECTION 2 — SYSTEM ARCHITECTURE (4-LAYER STACK)

The architecture has four distinct layers. These are NOT interchangeable. Each layer has a different purpose, runs in a different place, and updates at different frequencies.

```
Layer 0: Raw Audio
  → 30-second preview URLs (Spotify) or full audio (non-Spotify sources)
  → Input to Layers 1 and 2

Layer 1: Signal Features (~400 dimensions)
  → Extracted by: Essentia (Python, server-side) or Essentia.js (WASM, browser)
  → Features: BPM, spectral centroid, MFCC (13 coefficients), chroma (12D),
               RMS energy, zero-crossing rate, onset envelope, key/mode,
               loudness (dBFS), spectral rolloff, spectral flux
  → Purpose: interpretable acoustic measurements, used for Layer 1 heuristics
             and as auxiliary features for fine-tuning
  → NOT used for navigation distance calculation (too noisy, too dimensional)

Layer 2: CLAP Embeddings (512 dimensions) ← PRIMARY NAVIGATION LAYER
  → Model: laion/larger_clap_music_and_speech (HuggingFace)
  → Runs in: packages/acoustic-service (Python/FastAPI)
  → Audio input → 512-dim float32 vector
  → Text input → 512-dim float32 vector in the SAME space
  → KEY PROPERTY: text and audio are comparable. "late night drive" and the
                  audio of a track that sounds like a late night drive are
                  near each other in this space.
  → Used for: ALL distance calculations, arc generation, k-NN search
  → Stored in: sqlite-vec (Phase 1) → pgvector (Phase 2+)

Layer 3: 5D Perceptual Projection (display only)
  → Derived from: learned linear probe on top of Layer 2 embeddings
  → Dimensions: energy, warmth, density, organicity, sacred (all 0-1)
  → Purpose: human-readable display, acoustic field visualisation, territory map
  → NOT used for navigation — it is a lossy projection for UI only
  → Phase 1: use Spotify Audio Features heuristic formula as approximation
  → Phase 2: replace with calibrated linear probe trained on annotated data
```

**Critical rule:** Navigation (arc generation, k-NN, distance functions) always operates in Layer 2 (512D CLAP space). The 5D projection is computed after the fact for display. This separation is non-negotiable — projecting to 5D first and then navigating introduces too much information loss.

---

## SECTION 3 — ACOUSTIC SERVICE (packages/acoustic-service)

This is the Python microservice. It is the engine. Everything else in the codebase is scaffolding around it.

### 3.1 Technology Stack

```
Runtime:     Python 3.11+
Framework:   FastAPI (async)
CLAP model:  laion/larger_clap_music_and_speech (via transformers + torch)
Audio:       librosa (for 30s preview URL loading)
Storage:     sqlite-vec (Python bindings: sqlite-vec package)
HTTP client: httpx (async, for fetching preview URLs in parallel)
Cache:       in-memory LRU (functools.lru_cache on track ID → embedding)
             OR Redis if multi-worker deployment
```

### 3.2 Model Loading

```python
# models.py
from transformers import ClapModel, ClapProcessor
import torch

MODEL_ID = "laion/larger_clap_music_and_speech"

class CLAPService:
    def __init__(self):
        self.processor = ClapProcessor.from_pretrained(MODEL_ID)
        self.model = ClapModel.from_pretrained(MODEL_ID)
        self.model.eval()
        # Use GPU if available, CPU otherwise
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)

    def embed_audio(self, audio_array: np.ndarray, sr: int = 48000) -> np.ndarray:
        """Returns normalised 512-dim float32 vector."""
        inputs = self.processor(audios=audio_array, sampling_rate=sr, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        with torch.no_grad():
            features = self.model.get_audio_features(**inputs)
        vec = features[0].cpu().numpy()
        return vec / np.linalg.norm(vec)  # L2 normalise

    def embed_text(self, text: str) -> np.ndarray:
        """Returns normalised 512-dim float32 vector in same space as audio."""
        inputs = self.processor(text=[text], return_tensors="pt", padding=True)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        with torch.no_grad():
            features = self.model.get_text_features(**inputs)
        vec = features[0].cpu().numpy()
        return vec / np.linalg.norm(vec)

# Singleton — loaded once at startup
_clap: CLAPService | None = None

def get_clap() -> CLAPService:
    global _clap
    if _clap is None:
        _clap = CLAPService()
    return _clap
```

### 3.3 API Contract

All endpoints return JSON. Embeddings are returned as float arrays.

```
POST /embed/audio
  Body: { "preview_url": "https://p.scdn.co/mp3-preview/..." }
  Response: { "embedding": [0.023, -0.041, ...], "dim": 512, "track_id": "optional" }
  Latency budget: < 800ms (download 30s clip + CLAP inference on CPU)

POST /embed/audio/batch
  Body: { "tracks": [{ "id": "spotify_id", "preview_url": "..." }, ...] }
  Max batch: 50 tracks
  Response: { "results": [{ "id": "...", "embedding": [...] }, ...], "failed": [...] }
  Strategy: parallel async URL fetch, sequential CLAP inference
  Latency budget: < 3000ms for 20-track batch on CPU

POST /embed/text
  Body: { "text": "late night drive on an empty highway" }
  Response: { "embedding": [0.017, -0.033, ...], "dim": 512 }
  Latency budget: < 100ms (no audio download, just text encoder)

POST /arc/generate
  Body: {
    "target_embedding": [0.017, ...],       // 512-dim text embedding of intent
    "pool": [                                // candidate tracks with embeddings
      { "id": "track_id", "embedding": [...] },
      ...
    ],
    "current_position": [...],              // 512-dim, optional (null = start from target approach)
    "arc_length": 20,                       // number of tracks in arc
    "max_transition_distance": 0.35,        // cosine distance coherence limit
    "exclude_ids": ["id1", "id2"],          // already played or rejected
    "arc_shape": "journey"                  // "journey" | "plateau" | "discharge" | "peak_early"
  }
  Response: {
    "steps": [
      {
        "id": "track_id",
        "position_in_arc": 0,              // 0-indexed
        "progress": 0.05,                  // 0.0-1.0
        "transition_distance": 0.0,        // from previous track (0 for first)
        "distance_to_target": 0.34,        // cosine distance from target embedding
        "is_frisson_candidate": false,     // true at ~30%, 65%, 85% if conditions met
        "waypoint_distance": 0.12          // distance from interpolated waypoint
      },
      ...
    ],
    "reached_target": true,                // final track within 0.2 of target
    "final_distance": 0.18,
    "coherence_violations": 0             // count of steps that relaxed the constraint
  }

POST /5d/project
  Body: { "embedding": [...] }            // 512-dim CLAP vector
  Response: { "energy": 0.72, "warmth": 0.41, "density": 0.58, "organicity": 0.33, "sacred": 0.21 }
  Note: Phase 1 uses heuristic formula on Spotify features. Phase 2 uses trained probe.

GET /health
  Response: { "status": "ok", "model": "laion/larger_clap_music_and_speech", "device": "cpu" }
```

### 3.4 Latency Budget

The arc endpoint is the critical path. Target: full intent → arc response < 5 seconds.

```
Text embedding (intent → target):          ~80ms
Batch audio embedding (20 tracks):        ~2500ms (dominant cost, CPU)
Arc generation (beam search, 20 steps):   ~50ms
Total:                                    ~2600ms ✓

Optimisation levers:
  - Cache: if track embedding is in sqlite-vec, skip re-inference (~60% cache hit after 2 weeks)
  - Reduce batch to 40 tracks max input, return 20 best arc steps
  - GPU deployment: batch inference drops to ~300ms total → full arc < 600ms
  - Streaming response: emit arc steps as they are computed (SSE)
```

### 3.5 Arc Generator (arc.py)

```python
import numpy as np
from dataclasses import dataclass
from typing import List, Optional, Set

@dataclass
class ArcStep:
    id: str
    embedding: np.ndarray
    progress: float
    transition_distance: float
    distance_to_target: float
    is_frisson_candidate: bool
    waypoint_distance: float

def cosine_distance(a: np.ndarray, b: np.ndarray) -> float:
    """Distance in [0, 2]. For normalised vectors: 0=identical, 2=opposite."""
    return float(1 - np.dot(a, b))

def lerp_embedding(start: np.ndarray, end: np.ndarray, t: float) -> np.ndarray:
    """Linear interpolation then renormalise (stays on unit hypersphere)."""
    t = max(0.0, min(1.0, t))
    vec = start + (end - start) * t
    norm = np.linalg.norm(vec)
    return vec / norm if norm > 1e-8 else end

def is_frisson_position(progress: float) -> bool:
    """Frisson candidates should fall at ~30%, 65%, 85% of arc."""
    targets = [0.30, 0.65, 0.85]
    return any(abs(progress - t) < 0.06 for t in targets)

def generate_arc(
    target: np.ndarray,
    pool: List[dict],             # [{"id": str, "embedding": np.ndarray}]
    current_position: Optional[np.ndarray] = None,
    arc_length: int = 20,
    max_transition_distance: float = 0.35,
    exclude_ids: Optional[Set[str]] = None,
    arc_shape: str = "journey",   # journey | plateau | discharge | peak_early
    beam_width: int = 5,
) -> dict:
    """
    Beam search arc generation in CLAP embedding space.

    Arc shapes:
    - journey: linear trajectory from current toward target (default)
    - plateau: reach target quickly then maintain neighborhood  
    - discharge: start congruent with current, move toward target in second half
    - peak_early: reach energy peak at 40% then descend (BRAC-aligned)
    """
    exclude = exclude_ids or set()
    candidates = [p for p in pool if p["id"] not in exclude and "embedding" in p]
    
    if not candidates:
        return {"steps": [], "reached_target": False, "final_distance": 1.0, "coherence_violations": 0}

    # Determine start position
    if current_position is None:
        # Default: start from midpoint (meet user where they are — Psychology Law 2)
        current_position = lerp_embedding(candidates[0]["embedding"], target, 0.1)
    
    start = current_position.copy()

    def get_waypoint(progress: float) -> np.ndarray:
        """Compute arc waypoint based on shape."""
        if arc_shape == "plateau":
            # Reach target by 40%, then hold
            t = min(1.0, progress / 0.4)
        elif arc_shape == "discharge":
            # Hold near start for first 40%, then move toward target
            t = max(0.0, (progress - 0.4) / 0.6) if progress > 0.4 else 0.0
        elif arc_shape == "peak_early":
            # Arc toward target at 40%, then partially return (BRAC descent)
            t = progress / 0.4 if progress <= 0.4 else 1.0 - ((progress - 0.4) / 0.6) * 0.5
        else:  # journey
            t = progress
        return lerp_embedding(start, target, t)

    # Beam search
    # Each beam is a list of ArcStep (the sequence so far)
    initial_beams = [[]]  # start with one empty beam

    completed_steps: List[ArcStep] = []
    used = set(exclude)
    prev_embedding = current_position
    coherence_violations = 0

    # Greedy with relaxation (faster than full beam for prototype)
    for i in range(arc_length):
        progress = (i + 1) / arc_length
        waypoint = get_waypoint(progress)

        available = [c for c in candidates if c["id"] not in used]
        if not available:
            break

        # Score each available track against waypoint
        scored = []
        for c in available:
            emb = c["embedding"]
            waypoint_dist = cosine_distance(emb, waypoint)
            transition_dist = cosine_distance(prev_embedding, emb)
            scored.append((c, waypoint_dist, transition_dist))

        scored.sort(key=lambda x: x[1])  # sort by proximity to waypoint

        # Pick nearest that satisfies coherence constraint (relax if needed)
        chosen = None
        for relax in [1.0, 1.5, 2.0, float("inf")]:
            limit = max_transition_distance * relax
            for c, wd, td in scored:
                if td <= limit:
                    chosen = (c, wd, td)
                    if relax > 1.0:
                        coherence_violations += 1
                    break
            if chosen:
                break

        if not chosen:
            break

        c, wd, td = chosen
        frisson = is_frisson_position(progress) and i >= 3 and td < max_transition_distance

        step = ArcStep(
            id=c["id"],
            embedding=c["embedding"],
            progress=progress,
            transition_distance=td,
            distance_to_target=cosine_distance(c["embedding"], target),
            is_frisson_candidate=frisson,
            waypoint_distance=wd,
        )

        completed_steps.append(step)
        used.add(c["id"])
        prev_embedding = c["embedding"]

    final_dist = cosine_distance(completed_steps[-1].embedding, target) if completed_steps else 1.0

    return {
        "steps": [
            {
                "id": s.id,
                "position_in_arc": i,
                "progress": s.progress,
                "transition_distance": s.transition_distance,
                "distance_to_target": s.distance_to_target,
                "is_frisson_candidate": s.is_frisson_candidate,
                "waypoint_distance": s.waypoint_distance,
            }
            for i, s in enumerate(completed_steps)
        ],
        "reached_target": final_dist <= 0.2,
        "final_distance": final_dist,
        "coherence_violations": coherence_violations,
    }
```

---

## SECTION 4 — EMBEDDING STORAGE

### 4.1 Phase 1: sqlite-vec

sqlite-vec is a production-ready SQLite extension (v0.1.0 stable, 2024). Zero infrastructure overhead — it's just SQLite with a vector index.

```sql
-- Schema

CREATE TABLE tracks (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    artist          TEXT NOT NULL,
    album           TEXT,
    spotify_uri     TEXT,
    preview_url     TEXT,
    duration_ms     INTEGER,
    created_at      INTEGER DEFAULT (unixepoch()),
    updated_at      INTEGER DEFAULT (unixepoch())
);

CREATE TABLE track_embeddings (
    track_id        TEXT PRIMARY KEY REFERENCES tracks(id),
    clap_vec        BLOB NOT NULL,          -- 512 float32, little-endian packed
    spotify_energy  REAL,                   -- Raw Spotify features stored alongside
    spotify_valence REAL,
    spotify_acousticness REAL,
    spotify_instrumentalness REAL,
    spotify_loudness REAL,
    spotify_tempo   REAL,
    energy_5d       REAL,                   -- 5D projection (display layer)
    warmth_5d       REAL,
    density_5d      REAL,
    organicity_5d   REAL,
    sacred_5d       REAL,
    embedded_at     INTEGER DEFAULT (unixepoch())
);

-- sqlite-vec virtual table for cosine similarity search
CREATE VIRTUAL TABLE vec_tracks USING vec0(
    track_id TEXT,
    clap_vec FLOAT[512]
);
```

```python
# embeddings.py — storage and retrieval

import sqlite3
import sqlite_vec
import numpy as np
import struct

DB_PATH = "data/woody.db"

def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.enable_load_extension(True)
    sqlite_vec.load(conn)
    conn.enable_load_extension(False)
    return conn

def pack_embedding(vec: np.ndarray) -> bytes:
    """Pack float32 array to bytes for sqlite storage."""
    return struct.pack(f"{len(vec)}f", *vec.astype(np.float32))

def unpack_embedding(blob: bytes) -> np.ndarray:
    n = len(blob) // 4
    return np.array(struct.unpack(f"{n}f", blob), dtype=np.float32)

def store_embedding(track_id: str, embedding: np.ndarray, spotify_features: dict = None, coords_5d: dict = None):
    conn = get_db()
    blob = pack_embedding(embedding)
    conn.execute(
        """INSERT OR REPLACE INTO track_embeddings 
           (track_id, clap_vec, spotify_energy, spotify_valence, spotify_acousticness,
            spotify_instrumentalness, spotify_loudness, spotify_tempo,
            energy_5d, warmth_5d, density_5d, organicity_5d, sacred_5d)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            track_id, blob,
            spotify_features.get("energy") if spotify_features else None,
            spotify_features.get("valence") if spotify_features else None,
            spotify_features.get("acousticness") if spotify_features else None,
            spotify_features.get("instrumentalness") if spotify_features else None,
            spotify_features.get("loudness") if spotify_features else None,
            spotify_features.get("tempo") if spotify_features else None,
            coords_5d.get("energy") if coords_5d else None,
            coords_5d.get("warmth") if coords_5d else None,
            coords_5d.get("density") if coords_5d else None,
            coords_5d.get("organicity") if coords_5d else None,
            coords_5d.get("sacred") if coords_5d else None,
        )
    )
    # Also insert into vec_tracks for similarity search
    conn.execute(
        "INSERT OR REPLACE INTO vec_tracks (track_id, clap_vec) VALUES (?, ?)",
        (track_id, blob)
    )
    conn.commit()
    conn.close()

def find_nearest(query_embedding: np.ndarray, k: int = 50, exclude_ids: list = None) -> list:
    """k-NN cosine search. Returns list of {"track_id": ..., "distance": ...}."""
    conn = get_db()
    blob = pack_embedding(query_embedding)
    
    rows = conn.execute(
        """SELECT track_id, distance 
           FROM vec_tracks 
           WHERE clap_vec MATCH ? AND k = ?
           ORDER BY distance""",
        (blob, k + len(exclude_ids or []))
    ).fetchall()
    
    exclude = set(exclude_ids or [])
    results = [{"track_id": r[0], "distance": r[1]} for r in rows if r[0] not in exclude]
    conn.close()
    return results[:k]
```

### 4.2 Phase 2: pgvector Migration

When moving to Postgres, the schema is identical. Swap:
- `BLOB` → `vector(512)` 
- `sqlite-vec` → pgvector extension
- `vec_tracks` virtual table → regular table with `CREATE INDEX ON track_embeddings USING hnsw (clap_vec vector_cosine_ops)`
- Connection: `psycopg2` or `asyncpg`

The application code only changes at the database driver level — the storage/retrieval interface stays the same.

---

## SECTION 5 — INTENT PIPELINE (REVISED)

### 5.1 What Changes

The existing intent pipeline (`lib/intent.ts`) does two things:
1. **Search**: converts intent text to Spotify search queries, artist seeds, oracle artists → finds candidate tracks
2. **Ranking**: ranks found tracks against an acoustic target

The search side (1) stays mostly the same — the LLM is good at generating search queries. The ranking side (2) changes completely.

**OLD ranking:** LLM generates `target5D` coordinates → Euclidean distance in 5D → rank
**NEW ranking:** CLAP text encoder embeds intent → cosine distance in 512D CLAP space → rank

**NEW arc generation:** CLAP text embedding IS the target. No LLM involvement in acoustic target computation.

### 5.2 New Intent Flow

```
User types: "anxious, want something that meets me there first"
                              │
            ┌─────────────────┴──────────────────┐
            │                                    │
   POST /embed/text                    LLM (existing PersonaLens)
   → 512D CLAP target embedding        → search queries, artist seeds
   (~80ms)                             → Spotify/Last.fm search
                                       → candidate track pool
                                       (~2000ms)
            │                                    │
            └─────────────────┬──────────────────┘
                              │
               For each candidate track:
               POST /embed/audio (or lookup from sqlite-vec cache)
               → 512D CLAP audio embedding
               (~2500ms for 20 uncached tracks)
                              │
               POST /arc/generate
               → target: intent text embedding
               → pool: candidate embeddings
               → arc_shape: inferred from intent ("meets me there" → discharge)
               (~50ms)
                              │
               Return arc sequence + 5D projections for display
```

### 5.3 Arc Shape Inference

Add this to the intent parsing logic (can be rule-based for Phase 1, LLM-assisted for Phase 2):

```typescript
// lib/arcShape.ts

export type ArcShape = 'journey' | 'plateau' | 'discharge' | 'peak_early'

const DISCHARGE_SIGNALS = [
  'process', 'feel it', 'meet me', 'sad', 'grief', 'release', 'cry',
  'let it out', 'sit with', 'congruent', 'match my mood'
]

const PLATEAU_SIGNALS = [
  'study', 'focus', 'work', 'concentrate', 'maintain', 'keep going',
  'deep work', 'flow', 'consistent'
]

const PEAK_EARLY_SIGNALS = [
  'workout', 'run', 'lift', 'training', 'exercise', 'gym', 'peak',
  'warm up', 'high intensity'
]

export function inferArcShape(intentText: string): ArcShape {
  const lower = intentText.toLowerCase()
  if (DISCHARGE_SIGNALS.some(s => lower.includes(s))) return 'discharge'
  if (PLATEAU_SIGNALS.some(s => lower.includes(s))) return 'plateau'
  if (PEAK_EARLY_SIGNALS.some(s => lower.includes(s))) return 'peak_early'
  return 'journey'
}
```

### 5.4 Changes to lib/intent.ts

1. Import `inferArcShape` from `lib/arcShape.ts`
2. Remove `target5D` from LLM prompt — CLAP handles this now
3. Add call to acoustic service for text embedding in parallel with LLM parse
4. After building candidate pool, call acoustic service for batch audio embeddings
5. Call arc generation endpoint instead of flat ranking
6. Return `arcSteps` alongside existing `suggestions` (for backward compat during transition)

### 5.5 New API Route: app/api/arc/route.ts

```typescript
// app/api/arc/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { inferArcShape } from '@/lib/arcShape'
import { intentToSuggestions } from '@/lib/intent'
import { getAcousticService } from '@/lib/acousticService'

export async function POST(request: NextRequest) {
  const { intent, excludeIds = [], arcLength = 20, tasteCentroid } = await request.json()
  
  if (!intent || intent.trim().length < 3) {
    return NextResponse.json({ error: 'Intent required' }, { status: 400 })
  }

  const acoustic = getAcousticService()
  const arcShape = inferArcShape(intent)

  // Run in parallel: text embedding + candidate discovery
  const [targetEmbedding, { suggestions, personaLens }] = await Promise.all([
    acoustic.embedText(intent),
    intentToSuggestions(intent, null, null, null, { excludeTrackIds: excludeIds }),
  ])

  // Get CLAP embeddings for all candidates
  const tracks = suggestions.map(s => s.track)
  const embeddings = await acoustic.embedAudioBatch(
    tracks.map(t => ({ id: t.id, preview_url: t.previewUrl ?? '' }))
  )

  // Build pool
  const pool = embeddings
    .filter(e => e.embedding)
    .map(e => ({ id: e.id, embedding: e.embedding }))

  if (pool.length === 0) {
    return NextResponse.json({ error: 'No embeddable tracks found' }, { status: 422 })
  }

  // Generate arc
  const arc = await acoustic.generateArc({
    targetEmbedding,
    pool,
    arcLength,
    arcShape,
    excludeIds,
  })

  // Attach track metadata to arc steps
  const trackMap = new Map(tracks.map(t => [t.id, t]))
  const stepsWithMetadata = arc.steps.map(step => ({
    ...step,
    track: trackMap.get(step.id),
    suggestion: suggestions.find(s => s.track.id === step.id),
  }))

  return NextResponse.json({
    arcSteps: stepsWithMetadata,
    targetEmbedding,
    arcShape,
    personaLens,
    reachedTarget: arc.reached_target,
    finalDistance: arc.final_distance,
    coherenceViolations: arc.coherence_violations,
  })
}
```

---

## SECTION 6 — COLD START: BAYESIAN ACOUSTIC PROBE

The existing cold start (Spotify history → territory) is kept as a fallback. The primary cold start is a Bayesian probe.

**Why Spotify history is insufficient as primary:** Spotify history encodes Spotify's collaborative filtering bias. You get what Spotify chose to surface, not the user's true acoustic preferences. It systematically skews toward popular content in the user's apparent genre preferences.

### 6.1 Probe Design

8 probe tracks are pre-selected to span the CLAP embedding space. They are chosen to maximise information gain — each probe, regardless of how the user responds, teaches the system something different.

The probes should cover the acoustic corners of the space:
- High energy + cold (e.g. Aphex Twin — Come to Daddy)
- High energy + warm (e.g. Kendrick Lamar — HUMBLE.)
- Low energy + cold (e.g. Stars of the Lid — Requiem for Dying Mothers)
- Low energy + warm + high sacred (e.g. Nick Drake — Pink Moon)
- High density + mid energy (e.g. Death Grips — Guillotine)
- High organicity + low density (e.g. Nils Frahm — Says)
- Mid everything — the centre of mass (e.g. Radiohead — Exit Music)
- Curveball: culturally orthogonal (e.g. Tinariwen — Tamikrest)

The founder selects and updates the probe set — it requires acoustic judgment, not just algorithmic selection.

### 6.2 Behavioral Response Interpretation

For each probe, present 20 seconds. Collect:
- **Skip < 5s:** Strong repulsion. Probability of this acoustic region ↓↓
- **Skip 5–15s:** Moderate repulsion. ↓
- **Listen through:** Neutral to mild attraction. ↑
- **Replay:** Strong attraction. ↑↑
- **Save (explicit):** Very strong attraction. ↑↑↑

### 6.3 Territory Estimation

After 6–8 probes, compute a territory centroid in CLAP space:

```python
def estimate_territory(probe_results: list[dict]) -> np.ndarray:
    """
    Weighted average of probe embeddings based on behavioral response.
    Returns 512-dim territory centroid.
    """
    weights = {
        'replay': 3.0,
        'save': 4.0,
        'listen_through': 1.0,
        'skip_late': -0.5,
        'skip_early': -1.5,
        'skip_immediate': -2.5,
    }
    
    total_weight = 0
    weighted_sum = np.zeros(512)
    
    for result in probe_results:
        w = weights.get(result['signal'], 0)
        if w != 0:
            weighted_sum += w * result['embedding']
            total_weight += abs(w)
    
    if total_weight == 0:
        return np.zeros(512)  # No signal — return null territory
    
    centroid = weighted_sum / total_weight
    norm = np.linalg.norm(centroid)
    return centroid / norm if norm > 1e-8 else centroid
```

This centroid becomes the `current_position` for the first arc generation — the arc starts from where the user actually is, not from Spotify's model of them.

---

## SECTION 7 — BEHAVIORAL ATTRIBUTION

Skips are not binary. The timing and context of a skip tells you which acoustic dimension failed.

### 7.1 Skip Signal Taxonomy

```
< 15% playtime (< 45s on a 5-min track):
  → Strong acoustic mismatch — something is fundamentally wrong
  → This is NOT a transition signal; the track was a bad fit
  → Attribution: compare this track's 5D to the session running mean
    → The dimension with the largest POSITIVE deviation = cause of skip
    → Example: track has warmth=0.8 when session mean is 0.3 → warmth is too high
  → Action: remove tracks with warmth > 0.6 from remaining arc

15–70% playtime:
  → Moderate mismatch or context change
  → Partial negative signal — track was okay but not right
  → Attribution: weaker version of above
  → Action: bias remaining arc slightly away from this track's coordinates

> 70% playtime (late skip):
  → Transition signal (Psychology Law — from PSYCHOLOGY.md)
  → Track was acoustically right, user is ready to move
  → This is NOT a rejection
  → Action: progress arc faster (increase waypoint step size)
  → Do NOT penalise this track's coordinate in territory model

Replay:
  → Strong positive on ALL dimensions of replayed track
  → Pull territory centroid toward this track's CLAP embedding
  → Mark this track for potential frisson candidate status

Completion without skip:
  → Mild positive — track was acceptable
  → Small positive weight in territory update

Seek backwards within track:
  → Strong positive — user wants more of this specific moment
  → Note: Spotify SDK allows position detection; implement if available
```

### 7.2 Per-Session Attribution Model

Maintain a session attribution state object:

```typescript
interface SessionAttributionState {
  sessionId: string
  skipSignals: SkipSignal[]
  dimensionPenalties: {     // accumulated negative bias per dimension
    energy: number
    warmth: number
    density: number
    organicity: number
    sacred: number
  }
  replayBonus: {            // accumulated positive pull toward replayed tracks
    trackIds: string[]
    centroidPull: number[]  // CLAP embedding direction of pull
  }
  arcProgressModifier: number  // 1.0 = normal, >1.0 = user wants to move faster
}
```

After each skip, update penalties and pass them to the arc generator for the next batch of waypoints.

### 7.3 Cross-Session Learning

After session ends, update the personal taste model:

```python
def update_taste_centroid(
    current_centroid: np.ndarray,
    session_tracks: list[dict],  # [{"embedding": ..., "completion_ratio": float}]
    learning_rate: float = 0.1
) -> np.ndarray:
    """
    Exponential moving average update.
    completion_ratio: 0=immediate skip, 1=played to end.
    """
    if not session_tracks:
        return current_centroid
    
    # Weighted average of session track embeddings
    session_signal = np.zeros(512)
    total_weight = 0
    
    for t in session_tracks:
        w = t["completion_ratio"] * 2 - 1  # maps 0-1 to -1 to +1
        # Only tracks with positive completion contribute positively
        if w > 0:
            session_signal += w * t["embedding"]
            total_weight += w
    
    if total_weight <= 0:
        return current_centroid
    
    session_signal /= total_weight
    updated = (1 - learning_rate) * current_centroid + learning_rate * session_signal
    norm = np.linalg.norm(updated)
    return updated / norm if norm > 1e-8 else updated
```

---

## SECTION 8 — 5D CALIBRATION PIPELINE

The 5D dimensions (energy, warmth, density, organicity, sacred) are the DISPLAY layer. In Phase 1, they are approximated from Spotify Audio Features using the heuristic formula from MASTER_BUILD_PROMPT. This is good enough to ship.

In Phase 2, they become a calibrated linear probe trained on annotated data.

### 8.1 Phase 1: Heuristic Formula (ship this now)

```python
def spotify_to_5d_heuristic(features: dict) -> dict:
    """
    Phase 1 approximation. Functional but not perceptually calibrated.
    WARNING: Spotify valence has only moderate perceptual validity (r=0.67).
    This formula introduces compounding error. Use for display only.
    """
    loudness_norm = max(0, min(1, (features['loudness'] + 60) / 60))
    
    return {
        'energy':     round(float(features['energy']), 4),
        'warmth':     round(float(features['valence'] * 0.6 + features['acousticness'] * 0.4), 4),
        'density':    round(float(loudness_norm * 0.5 + features['energy'] * 0.5), 4),
        'organicity': round(float(features['acousticness'] * 0.6 + features['instrumentalness'] * 0.4), 4),
        'sacred':     round(float(features['valence'] * 0.3 + features['instrumentalness'] * 0.4 + features['acousticness'] * 0.3), 4),
    }
```

### 8.2 Phase 2: Calibrated Linear Probe

**Annotation workflow:**

1. Select 500 tracks using CLAP embedding diversity sampling:
   - Run k-means (k=500) in 512D CLAP space on a broad corpus
   - Pick the track nearest to each centroid
   - This gives maximum acoustic variety for a fixed annotation budget

2. Annotation interface: simple web page, rate each track 1–5 on each dimension. Play 30-second preview. Estimated time: 2–3 hours for 500 tracks if you move fast.

3. Convert to pairwise Bradley-Terry format for calibration:
   - For each dimension, 200 random pairs
   - "Which is warmer?" → record winner
   - Bradley-Terry MLE converts pairwise wins to continuous 0–1 scores
   - This is more reliable than direct rating (avoids anchoring bias)

4. Train linear probe:
   ```python
   from sklearn.linear_model import Ridge
   import numpy as np
   
   # X: (n_tracks, 512) CLAP embeddings
   # y: (n_tracks, 5) calibrated dimension scores
   
   probes = {}
   for dim in ['energy', 'warmth', 'density', 'organicity', 'sacred']:
       probe = Ridge(alpha=1.0)
       probe.fit(X_train, y_train[dim])
       score = probe.score(X_test, y_test[dim])
       print(f"{dim}: R² = {score:.3f}")
       probes[dim] = probe
   
   # Save: 5×512 weight matrix + 5 bias terms
   weights = np.array([p.coef_ for p in probes.values()])  # (5, 512)
   biases = np.array([p.intercept_ for p in probes.values()])  # (5,)
   np.save('probe_weights.npy', weights)
   np.save('probe_biases.npy', biases)
   ```

5. Inference is a matrix multiply — ~0.1ms:
   ```python
   def clap_to_5d_calibrated(embedding: np.ndarray, weights: np.ndarray, biases: np.ndarray) -> dict:
       scores = weights @ embedding + biases
       scores = np.clip(scores, 0, 1)
       dims = ['energy', 'warmth', 'density', 'organicity', 'sacred']
       return {d: round(float(s), 4) for d, s in zip(dims, scores)}
   ```

---

## SECTION 9 — DISTANCE METRIC EVOLUTION

### Phase 1: Cosine Distance (ship this)

For normalised CLAP embeddings (all L2-normalised to unit sphere), cosine distance = `1 - dot(a, b)`. Range [0, 2]. Values < 0.35 = coherent transition. Values < 0.2 = very similar.

```python
def cosine_distance(a: np.ndarray, b: np.ndarray) -> float:
    return float(1.0 - np.dot(a, b))
```

### Phase 2: Mahalanobis Distance

CLAP dimensions are correlated. Mahalanobis accounts for inter-dimension correlations and stretches/compresses distance by covariance structure. Requires estimating the covariance matrix Σ from your corpus of embedded tracks.

```python
def mahalanobis_distance(a: np.ndarray, b: np.ndarray, inv_cov: np.ndarray) -> float:
    diff = a - b
    return float(np.sqrt(diff @ inv_cov @ diff))
```

Compute `inv_cov` from ~10k embedded tracks in your database. Update monthly.

### Phase 3: Learned Metric (behavioral data required)

Contrastive learning on (track_A, track_B, "user moved from A to B willingly") triplets. The model learns a metric that captures actual human transition preferences, not just acoustic similarity. Requires >100k session transitions. Phase 3 only.

---

## SECTION 10 — PSYCHOLOGY LAWS IN CODE

From PSYCHOLOGY.md, these 10 laws must be enforced at the engineering layer, not left to chance.

```python
# Each law has a concrete implementation rule

LAW_1_ARC_IS_UNIT = True  
# Never return a single track without arc context. Minimum response: 5-track arc.

LAW_2_MATCH_BEFORE_MOVE = True
# Arc shape 'discharge': start position = user's current CLAP position (from probe or history)
# First 20% of arc: interpolation t < 0.2 (stay near start before moving toward target)

LAW_3_BRAC_SESSION_LENGTH = True
# Default arc_length target: 90 minutes (~18-22 tracks at avg 4-5 min each)
# At 80-minute mark: reduce density waypoint by 0.15, increase warmth by 0.1 (BRAC trough)

LAW_4_EARN_PEAK_MOMENTS = True
# Frisson candidate rules (enforced in generate_arc):
# - Is frisson position: progress near 0.30, 0.65, or 0.85
# - At least 3 preceding tracks in lower-energy neighborhood (transition_distance < 0.3)
# - If frisson candidate: prefer tracks with higher energy_5d in 5D display projection

LAW_5_COHERENCE = True
# max_transition_distance: 0.35 (cosine) between consecutive tracks
# Hard limit — never emit an arc step with distance > 0.55 (even with relaxation)

LAW_6_METABOLIC_FLOOR = True
# No track with energy_5d < 0.08 in any arc
# First 20% of arc: energy_5d floor = 0.15 minimum

LAW_7_SKIP_IS_NOT_ALWAYS_REJECTION = True
# Skip > 70% playtime = transition signal → accelerate arc (increase waypoint step)
# Skip < 15% playtime = acoustic mismatch → penalise dimension, rebuild remaining arc

LAW_8_ARC_IS_SOCIAL_OBJECT = True
# Every arc response includes serializable arc structure for sharing
# Arc steps must be reproducible from stored data (no ephemeral computation)

LAW_9_ACTIVITY_ARCS_ARE_PHYSIOLOGICAL = True
# Activity arc shapes are bound to physiological curves, not acoustic preference
# Running: pre-hype (0-10%), tempo-match main (10-85%), cool-down (85-100%)

LAW_10_PSYCHOLOGY_OVER_ACOUSTICS = True
# Acoustic precision is the mechanism. Psychological state navigation is the goal.
# When in conflict: choose the psychologically correct arc shape over the acoustically optimal one.
```

---

## SECTION 11 — NEXT.JS INTEGRATION

### 11.1 New Files

```
lib/acousticService.ts          → HTTP client for acoustic service
lib/arcShape.ts                 → Arc shape inference from intent text
lib/arc.ts                      → Arc type definitions, arc state management
app/api/arc/route.ts            → Arc generation endpoint (POST)
app/api/embed/route.ts          → Proxied text embedding endpoint (POST)
```

### 11.2 Files to Modify

```
lib/types.ts                    → Add CLAPEmbedding, ArcStep, ArcResult, ArcShape types
lib/intent.ts                   → Add parallel CLAP text embedding call; return arcTarget
lib/spotify.ts                  → Add getAudioFeaturesBatch() for Spotify features → 5D display
```

### 11.3 Files to Leave Alone (for now)

```
components/map/WoodyMap.tsx     → Globe stays. Not the focus.
components/player/MiniPlayer.tsx → Keep working
lib/memory.ts                   → Taste centroid logic stays, will be augmented not replaced
app/api/intent/route.ts         → Keep working, arc route is additive not replacement
```

### 11.4 New Types (lib/types.ts additions)

```typescript
export type CLAPEmbedding = number[]  // 512-dim float array

export type ArcShape = 'journey' | 'plateau' | 'discharge' | 'peak_early'

export interface ArcStep {
  id: string
  track?: Track
  suggestion?: TrackSuggestion
  positionInArc: number        // 0-indexed
  progress: number             // 0.0–1.0
  transitionDistance: number   // cosine dist from previous track (0 for first)
  distanceToTarget: number     // cosine dist from intent target embedding
  isFrissonCandidate: boolean
  waypointDistance: number     // distance from interpolated waypoint
  coords5D?: AcousticCoords5D  // display only — computed after arc
}

export interface AcousticCoords5D {
  energy:     number
  warmth:     number
  density:    number
  organicity: number
  sacred:     number
}

export interface ArcResult {
  steps: ArcStep[]
  targetEmbedding: CLAPEmbedding
  arcShape: ArcShape
  reachedTarget: boolean
  finalDistance: number
  coherenceViolations: number
  personaLens: PersonaLens
}
```

### 11.5 Acoustic Service Client (lib/acousticService.ts)

```typescript
// lib/acousticService.ts

const SERVICE_URL = process.env.ACOUSTIC_SERVICE_URL

interface EmbedAudioResult {
  id: string
  embedding: number[] | null
  error?: string
}

interface ArcRequest {
  targetEmbedding: number[]
  pool: { id: string; embedding: number[] }[]
  arcLength?: number
  arcShape?: string
  excludeIds?: string[]
}

class AcousticServiceClient {
  private baseUrl: string

  constructor(url: string) {
    this.baseUrl = url
  }

  async embedText(text: string): Promise<number[]> {
    const res = await fetch(`${this.baseUrl}/embed/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) throw new Error(`Text embed failed: ${res.status}`)
    const data = await res.json()
    return data.embedding
  }

  async embedAudioBatch(tracks: { id: string; preview_url: string }[]): Promise<EmbedAudioResult[]> {
    const res = await fetch(`${this.baseUrl}/embed/audio/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracks }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) return tracks.map(t => ({ id: t.id, embedding: null, error: `${res.status}` }))
    const data = await res.json()
    return data.results
  }

  async generateArc(params: ArcRequest) {
    const res = await fetch(`${this.baseUrl}/arc/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_embedding: params.targetEmbedding,
        pool: params.pool,
        arc_length: params.arcLength ?? 20,
        arc_shape: params.arcShape ?? 'journey',
        exclude_ids: params.excludeIds ?? [],
      }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`Arc generation failed: ${res.status}`)
    return res.json()
  }

  isEnabled(): boolean {
    return typeof SERVICE_URL === 'string' && SERVICE_URL.length > 0
  }
}

let _client: AcousticServiceClient | null = null

export function getAcousticService(): AcousticServiceClient {
  if (!_client) {
    const url = SERVICE_URL ?? 'http://localhost:8000'
    _client = new AcousticServiceClient(url)
  }
  return _client
}
```

---

## SECTION 12 — PHASE GATING

### Phase 1 — Engine Proving Ground (build this now)
**Objective:** A demonstrable arc. Hit the endpoint, get back a 20-track sequence that provably navigates from A to B.

Deliverables:
- [ ] packages/acoustic-service running locally (FastAPI + CLAP loaded)
- [ ] POST /embed/text working
- [ ] POST /embed/audio/batch working  
- [ ] POST /arc/generate returning a valid arc
- [ ] sqlite-vec database seeding (100 tracks pre-embedded as test corpus)
- [ ] app/api/arc/route.ts wired to acoustic service
- [ ] lib/acousticService.ts client working
- [ ] Debug endpoint: GET /api/arc/test returns arc for hardcoded intent
- [ ] 5D display projection from Spotify heuristic formula (not CLAP probe yet)

NOT in Phase 1:
- Bayesian acoustic probe (cold start) — use Spotify history for Phase 1
- Calibrated 5D linear probe — heuristic formula is fine for Phase 1
- Mahalanobis distance — cosine distance is fine for Phase 1
- Behavioral attribution per-session — capture signals but don't act on them yet
- Full UI rebuild — engine first, UI after engine is proven

### Phase 2 — Calibration (3–4 weeks after Phase 1 proven)
- [ ] 5D annotation of 500 tracks (founder-led)
- [ ] Linear probe trained, deployed to acoustic service
- [ ] Bayesian probe cold start (8 probe tracks, behavioral response collection)
- [ ] Per-session behavioral attribution (skip timing → dimension penalty)
- [ ] Mahalanobis distance (requires 10k+ embedded tracks)
- [ ] Arc UI component in Next.js (timeline, progress, frisson markers)
- [ ] Personal territory centroid update post-session

### Phase 3 — Personal Model (6+ months)
- [ ] On-device fine-tuned model (Phi-3/Gemma 2B class)
- [ ] Federated learning (gradients only, no raw behavioral data to server)
- [ ] MERT fine-tuned on Woody listening data
- [ ] Learned metric (contrastive learning on session transitions)
- [ ] DJ mode (set logging, acoustic arc from tracklist)

---

## SECTION 13 — BUILD SEQUENCE FOR CURSOR

Execute in this exact order. Each step is independently testable.

### Step 1 — packages/acoustic-service/ scaffold
```
packages/acoustic-service/
├── main.py          # FastAPI app, route definitions
├── models.py        # CLAP loader, embed_audio(), embed_text()
├── embeddings.py    # sqlite-vec storage, find_nearest(), store_embedding()
├── arc.py           # generate_arc(), cosine_distance(), lerp_embedding()
├── requirements.txt
└── data/
    └── woody.db     # created on first run
```

requirements.txt:
```
fastapi==0.115.0
uvicorn==0.30.0
transformers==4.44.0
torch==2.4.0
librosa==0.10.2
httpx==0.27.0
sqlite-vec==0.1.1
numpy==1.26.4
scikit-learn==1.5.0
python-dotenv==1.0.0
```

**Test:** `uvicorn main:app --reload` → `curl localhost:8000/health` returns `{"status":"ok"}`

### Step 2 — Seed test corpus (100 tracks)

Write a seed script `scripts/seed_tracks.py`:
1. Take 100 Spotify track IDs covering acoustic variety
2. Fetch their preview URLs via Spotify API
3. For each: download 30s clip, CLAP embed, store in sqlite-vec
4. Also fetch Spotify Audio Features → compute 5D heuristic → store alongside

**Test:** `python scripts/seed_tracks.py` → `SELECT COUNT(*) FROM track_embeddings` returns 100

### Step 3 — Verify arc endpoint

Hit `POST localhost:8000/arc/generate` with:
```json
{
  "target_embedding": [fetch from POST /embed/text with "electric cold drive"],
  "pool": [fetch from sqlite-vec find_nearest on same query],
  "arc_length": 10
}
```
Verify: steps are returned, transition distances are < 0.35, distance_to_target decreases over arc.

### Step 4 — lib/acousticService.ts

Write client. Test: unit test that embedText() returns a 512-element array. Use `ACOUSTIC_SERVICE_URL=http://localhost:8000` in .env.local.

### Step 5 — app/api/arc/route.ts

Wire it up. Test: `curl -X POST localhost:3000/api/arc -d '{"intent":"cold electric drive"}'` returns arc steps with track metadata.

### Step 6 — lib/arcShape.ts

Add arc shape inference. Test: verify "study session" → 'plateau', "processing grief" → 'discharge', "run" → 'peak_early', "late night drive" → 'journey'.

### Step 7 — Update lib/intent.ts

Add parallel CLAP text embedding call. Keep all existing search logic unchanged. The CLAP embedding is an additional output, not a replacement.

### Step 8 — app/api/arc/test/route.ts (dev-only)

GET endpoint. Hardcoded: intent="anxious and want something that meets me where I am first", 30-track pool from seeded corpus, arc_shape=discharge. Returns full arc with track names. This is your validation endpoint — you can see in plain text whether the arc makes sense.

---

## SECTION 14 — WHAT NOT TO BUILD (HARD STOPS)

From SHELVED.md — do not re-propose without explicit instruction:
- A* search for arc generation → Beam search is the answer
- Pure Euclidean distance as permanent metric → cosine now, Mahalanobis Phase 2
- LLM prompt engineering for dimension calibration → fine-tuned probe
- JEPA architecture → wrong for this problem (deferred to Phase 3+)
- In-house social features → Phase 3+, only after DJ community exists
- On-device audio analysis as primary pipeline → Essentia.js for live sources only

From MASTER_BUILD_PROMPT.md hard stops:
- No streaming / audio hosting
- No star ratings, reviews, or opinion systems
- No follower / influence social model
- No glassmorphism or frosted blur
- No neon / synthwave aesthetic
- No tab-based navigation
- No album art as visual hero of now-playing
- No generic AI chat interface as fallback UX

---

## SECTION 15 — VALIDATION CRITERIA

How you know the engine is working before building any UI:

1. **Arc coherence:** All consecutive track pairs have cosine distance < 0.40. Mean < 0.25.
2. **Arc progression:** `distance_to_target` decreases monotonically for 'journey' arcs (allow 20% violations).
3. **Frisson positions:** At least 1 frisson candidate exists in arcs of length ≥ 15.
4. **Shape compliance:** 'discharge' arc: first 30% of steps have target_distance > 0.4. 'plateau' arc: after step 8, target_distance < 0.2 and stays there.
5. **Latency:** Full arc endpoint (intent → arc response) < 6 seconds with warm cache, < 12 seconds cold.
6. **Human test:** You listen to the arc. It makes acoustic sense. The journey is real.

Point 6 is the only one that actually matters. The metrics are proxies for it.

---

*End of build spec. Next document to read: PSYCHOLOGY.md (behavioral laws). Next thing to build: packages/acoustic-service/main.py.*
