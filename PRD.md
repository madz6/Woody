# Woody — Product Requirements Document
*Comprehensive specification covering product vision, system behaviour, engine requirements, psychology underpinnings, visual language, UX, architecture, and roadmap.*
*Last updated: 2026-05-07*
*This is the canonical PRD. All decisions in this document supersede informal session notes unless a more recent specific decision document (DECISIONS.md, VISUAL_LANGUAGE.md) exists for a given topic.*

---

## 1. Executive Summary

Woody is an acoustic-intelligence music discovery and curation platform. It is not a streaming service. It sits on top of Spotify (and eventually YouTube, SoundCloud) as a discovery, curation, and identity layer — the way Letterboxd sits on top of watching films.

**The core insight:** music taste is better described by acoustic coordinates than genre labels. Five continuous perceptual dimensions (energy, warmth, density, organicity, sacred) replace categorical genre tags. These are derivable from audio analysis.

**The unit of consumption is the session arc, not the track.** Woody surfaces 2-hour acoustic journeys, not individual song recommendations.

**The positioning:** "Faith in the human ear." Woody is the acoustic intelligence layer for your music life — not algorithmic delivery, but psychological intentionality delivered through music.

---

## 2. Problem Statement

### Why Music Discovery Is Broken

Music discovery fails not because there isn't enough music, but because there is no language for what you actually want to hear.

- **Genre is too broad and culturally loaded.** "I want something indie" tells you nothing acoustically. Two tracks both called indie can be sonically incompatible.
- **Mood labels are arbitrary and unverifiable.** "Happy playlist" describes a social category, not an acoustic reality.
- **Spotify's recommendation algorithm optimises for "more of the same."** It cannot respond to intent, to state change, or to what someone needs acoustically in a specific moment.
- **Track-level recommendations are the wrong unit.** A 3-minute track recommendation is an ingredient. Listening happens in 1-2 hour arcs. Nobody actually listens in isolation.
- **Search cannot capture pre-verbal preference.** Acoustic desire is felt before it can be named. "Something warm and slow that feels like late Sunday afternoon" cannot be searched. It can only be described — or pointed at. This is not a search problem — it is a translation problem.
- **Maintenance listening is completely underserved.** The largest single listening use case is not discovery and not emotional processing — it is maintenance: staying in a state that's already working. Focus maintenance, mood maintenance, energy maintenance. No current product is designed for this. Discovery engines disrupt it. Shuffle breaks it. Woody's arc-and-hold model is the first product architecture designed to sustain an acoustic state over time.

### The Social Tension

The fundamental tension in music identity: introspective listening (your real taste, including embarrassing stuff) vs. social sharing (what you would publicly admit to liking). Existing products force a choice: share your library and expose yourself, or hide everything and lose the social dimension.

**Woody's structural solution:** the acoustic field shows the *shape* of taste, not its content. A high-energy warm-to-cold-spanning acoustic territory is interesting and honest without naming a single track. Guilty pleasures contribute to the shape without being legible as specific artists.

### The Window

Post-Spotify Wrapped backlash, post-TikTok algorithm anxiety, Letterboxd proving that taste communities can work outside of streaming — the cultural moment for "actually understand what you like" vs "be fed what the algorithm thinks you like" is open. Estimated 18–24 months before Spotify closes the social/acoustic gap.

**Kill condition for current strategy:** If Spotify ships a genuine social/curation layer with acoustic intelligence before Woody reaches the DJ wedge milestone, the moat strategy needs to be revisited.

---

## 3. Target Users

### Primary: Intentional Listener

A music enthusiast who listens actively and with purpose — not background noise, but deliberate acoustic experiences. They have a sense of what they want to hear but cannot articulate it in standard genre/mood terms. They feel underserved by existing recommendation products.

**Characteristics:**
- Listens in focused sessions (not shuffle-all-day passive listening)
- Has strong acoustic preferences but limited vocabulary to express them
- Frustrated by Spotify recommendations that feel like "more of the same"
- May use Last.fm, Letterboxd, or similar taste-tracking products
- Appreciates curation over volume

**Pain points:**
- "I know what I want to hear but I can't find it"
- "My recommendations are stuck in a genre rut"
- "I've been listening to the same 50 songs for months"
- "I have old music in my library I keep forgetting about"

### Secondary: DJ / Music Creator

A DJ or music creator who already documents their listening publicly (tracklists on Mixcloud, Boiler Room, SoundCloud). They have professional-grade taste and an existing audience. Woody upgrades their primary artifact from a flat tracklist to a rich acoustic arc visualization.

**Why DJs specifically:**
1. They already have documentation behavior (public tracklists)
2. The upgraded artifact (acoustic arc) is useful to them — they can see their own patterns
3. The artifact is visually compelling enough that their followers ask "what is that?"
4. Their audience (taste communities, music enthusiasts) is exactly Woody's target listener
5. No acquisition cost — the utility creates the sharing which creates the reach

**The DJ wedge:** DJs populate the social layer with authentic content before requiring community behavior from general users. They solve the cold-start problem by generating content before the general user base exists.

### Tertiary: Activity-Led Listener

Someone who listens primarily in the context of physical activity or focused work. Running, cycling, studying, creative work — acoustic requirements are physiological, not aesthetic. Woody's activity integration (Strava, Apple Health) makes this a first-class use case.

---

## 4. Product Vision & Positioning

### Mission (Working)

"Music that matches your moment."

### Positioning

"Faith in the Human Ear."

Woody's moat is not the catalog (Spotify's) or the social graph (everyone's problem) but the dissective acoustic intelligence and systematic attribution of listening to human psychological states.

Music is the perfect neuro-regulatory stimulus. Given enough understanding of mental psychology and acoustic intelligence, any track can feel precisely right for any moment. That is not algorithm delivery — that is acoustic intelligence delivered with psychological intentionality.

### Acoustic Territory as Identity

Your acoustic territory is your musical identity without the exposure risk. It shows the *shape* of your taste — high energy, warm, spanning a wide range — without surfacing any specific artist or track. Guilty pleasures contribute to the shape without being legible. Embarrassing artists live inside the territory blob, not on the surface.

This is a structural innovation in music identity: honest but not exposing. The territory is shareable, embeddable, and exportable as a standalone artifact. It is Woody's version of a profile — but one grounded in acoustic reality, not social performance.

**Acoustic territory as a portable identity signal:** the territory visualization is exportable as a shareable image artifact, embeddable in social bios, and linkable as a public page. "Here is the shape of what I listen to" — without revealing what you listen to.

### What Woody Is Not

- Not a streaming service (no licensing, no catalog)
- Not a playlist generator (a feature, not the product)
- Not a review platform
- Not a social network (community emerges from product, not vice versa)
- Not a DJ tool (DJ wedge is entry point, not destination)
- Not a music player (it layers on top of players)

---

## 5. The Acoustic Intelligence Foundation

### 5.1 The Five Acoustic Dimensions

| Dimension | Range | What it captures |
|-----------|-------|-----------------|
| Energy | 0–1 | Arousal, intensity, tempo feel |
| Warmth | 0–1 | Tonal temperature (cold/synthetic → warm/organic) |
| Density | 0–1 | Textural mass, layering, fullness |
| Organicity | 0–1 | Timbre quality (synthetic/processed → acoustic/natural) |
| Sacred | 0–1 | Harmonic centredness, devotional quality, transcendence |

**Derivation from Spotify Audio Features (Phase 1a Bootstrap Approximations):**
- Energy → direct mapping (Spotify `energy`)
- Warmth → composite: `valence` × 0.6 + `acousticness` × 0.4
- Density → composite: normalised(`loudness`) × 0.5 + `energy` × 0.3 + (1 - `instrumentalness`) × 0.2
- Organicity → composite: `acousticness` × 0.6 + `instrumentalness` × 0.4
- Sacred → composite: `valence` × 0.3 + `instrumentalness` × 0.4 + `acousticness` × 0.3 (then inverted for high-sacred = resolved/transcendent)

> **⚠️ Bootstrap note (S4):** These formulas are Phase 1a approximations. They produce approximately correct coordinates for Western popular music and are systematically incorrect outside this domain (non-Western music, irregular time signatures, lyric-centric traditions). The calibration pipeline in Section 5.1c replaces these formulas as labeled data accumulates. Track coordinates store a `coordinate_source` field: `bootstrap` (formula-derived) vs `calibrated` (model-derived from anchor corpus). Trust calibrated scores over bootstrap scores in all model training and attribution work.

**For non-Spotify sources:** Web Audio API real-time analysis extracts proxy dimensions from raw audio. Lower accuracy than Spotify API but covers any source (YouTube, SoundCloud, anything playing through speakers or headphones). For YouTube specifically: Screen Capture API (tab audio sharing) feeds an Essentia.js WASM pipeline in-browser. Audio is processed locally, never uploaded — feature vectors only are emitted. Requires COOP/COEP headers server-side (`Cross-Origin-Embedder-Policy: require-corp`, `Cross-Origin-Opener-Policy: same-origin`). Dual-buffer architecture: 2-second overlapping windows at 50% overlap → 1-second feature update cadence. Acoustic field visualization lerped at 30fps for perceptually continuous motion.

### 5.1b The Four-Layer Embedding Architecture

The 5D perceptual dimensions (T1) are a *lossy projection* of a richer acoustic embedding space — not the embedding space itself. The full architecture is four layers:

| Layer | Description | Dimensionality | Where it lives |
|-------|-------------|----------------|----------------|
| Layer 0 | Raw audio | Waveform / spectrogram | Ingest only |
| Layer 1 | Extracted features | ~100D (Essentia descriptors: MFCC, spectral centroid, rhythm, tonal, etc.) | Server-side at ingestion |
| Layer 2 | Learned acoustic embeddings | 64–256D (MERT fine-tuned) | Server-side at ingestion, stored per track |
| Layer 3 (T1) | Perceptual 5D projection | 5D | User-facing, navigation, visualization |

**Layer 1 — Essentia feature extraction:** Essentia (MTG Barcelona, Python) is the primary audio feature extractor. It produces ~100 descriptors covering spectral, rhythmic, tonal, and dynamic properties. More music-specific and production-ready than Librosa (kept as fallback). MIT licensed. Essentia.js (WASM build) used for real-time browser-side analysis of non-Spotify sources.

**Layer 2 — MERT fine-tuning:** MERT (Music Encoder Representations from Transformers) is a music-domain self-supervised model trained on 160k hours of music using masked audio modeling with RVQ codec tokens (not raw waveform masking). Unlike Essentia, MERT captures temporal context across the full track — it understands that a chord at bar 8 relates to the same chord at bar 1, that a chord progression implies tension and resolution. MERT is the Layer 2 backbone: fine-tuned on the dimension calibration task (Essentia features → 5D coordinates) rather than trained from scratch. MERT runs **server-side at track ingestion only** — embeddings are computed once per track and stored. Not on-device, not at inference time. Model size: 300M–600M parameters (not viable for on-device).

**Layer 3 (T1) — Perceptual projection:** The 5D perceptual dimensions are a learned projection from Layer 2 embeddings. T1 is the user-facing navigation and visualization space — interpretable, actionable, shareable. It is deliberately lossy: much acoustic information is discarded in service of usability. **The engine runs in T1 (5D) in Phase 1.** Layer 2 MERT embeddings are incorporated in Phase 2, at which point the distance function and k-NN/HNSW search shift to the higher-dimensional embedding space. Until then, T1 is both the display layer and the recommendation search space. T1 is for display, intent input, and social sharing at all phases.

### 5.1c Dimension Calibration Pipeline

The mapping from audio features to 5D perceptual coordinates is a learned model, not a hand-coded formula. The calibration pipeline:

**Step 1 — Anchor corpus:** 200 tracks hand-selected to span the full 5D perceptual space. Tracks rated pairwise by 20+ listeners ("is track A more energetic than track B?"). Bradley-Terry model converts pairwise wins to continuous scores. These are ground-truth perceptual coordinates, validated against human perception rather than theoretical feature mappings.

**Step 2 — Feature model:** DistilBERT-class model (DistilBERT or TinyBERT) fine-tuned on `[Essentia feature vector] → [5D coordinates]` using the anchor corpus as labeled data. ~3000 labeled examples is sufficient for fine-tuning. Pairwise/contrastive learning objective: humans are far more reliable at relative judgments ("A is more energetic than B") than absolute ratings ("rate A's energy 1-10"). The model trains on this signal.

**Step 3 — Online calibration:** Every behavioral signal (skip timing, replay, add to library) is a weak label updating a per-user Bayesian posterior over their personal dimension mapping. This is separate from the population model — learning which dimensions *this user* is most sensitive to.

**Step 4 — Active calibration:** Occasional explicit pairwise questions surfaced in the UI ("which of these sounds more [X] to you?"). Frequency: once per session for the first 5 sessions, then rare. Strong labels for the personal model.

**Cultural calibration gap (S1 — Day 1 product validity problem):** Essentia's rhythm features assume Western time signatures. Non-4/4 music (Afrobeat, Indian classical, math rock, Bossa nova) will score incorrectly on Energy and Density without correction. The problem is more fundamental than a correction factor: the 5D model as designed is missing entire dimensions that are central to non-Western listening (lyrical centrality, rhythmic complexity, cultural gravity). See FEATURES.md Section 23 for candidate additional dimensions.

**Phase 1 mitigation — Calibration Confidence Flag:**
Every track's coordinate record stores a `calibration_confidence` score (0–1). Low confidence is assigned automatically when:
- Time signature metadata is non-4/4 (from Spotify track metadata or Essentia detection)
- Rhythmic regularity score is low (Essentia BPM detection has high variance)
- Track language is non-English and genre signals suggest lyric-centric tradition
- Essentia feature extraction produced high-variance outputs on any axis

Low-confidence tracks are down-weighted in arc generation until calibrated labels exist (i.e., until the human rater anchor corpus includes non-Western examples). This prevents the 5D error from propagating to users.

**Open Decision (added to Section 20):** Non-Western calibration data source — a named partner dataset (e.g., CompMusic, AcousticBrainz) or labeled data acquisition strategy must be resolved before Phase 2. The current model will actively mis-serve non-Western music listeners at any scale.

### 5.2 The Distance Function and Progression

**MVP (Phase 1): Weighted Euclidean distance**

```
distance = sqrt(
  (ΔEnergy × 1.6)² +
  (ΔWarmth × 1.4)² +
  (ΔDensity × 1.0)² +
  (ΔOrganicity × 1.1)² +
  (ΔSacred × 1.2)²
)
```

Weights reflect relative perceptual importance: energy and warmth are most immediately perceptible; sacred and organicity carry longer-term emotional significance; density is important but more context-dependent.

**Limitation of Euclidean:** assumes dimensions are independent. They are not — energy and density correlate strongly; sacred and organicity correlate. Euclidean treats these as orthogonal when they aren't.

**Phase 2: Mahalanobis distance**

```
distance = sqrt((x-y)ᵀ Σ⁻¹ (x-y))
```

Where Σ is the covariance matrix of the full track database. Accounts for inter-dimension correlations. Theoretically correct for correlated acoustic features. Covariance matrix computed once from the full track database and updated periodically.

**Phase 3: Learned distance metric**

Train from skip/replay behavioral signals via metric learning (Siamese network or contrastive learning). Tracks that users listen to sequentially without skipping are "perceptually similar"; tracks that follow skip events are "dissimilar." This produces a distance function derived from actual human acoustic perception rather than theoretical feature correlations.

### 5.2b Search Algorithm — HNSW

The distance metric and the search algorithm are separate concerns. The search algorithm is **HNSW (Hierarchical Navigable Small World)**, implemented via pgvector's `hnsw` index.

**Why not exact k-NN:** exact k-nearest-neighbor search has O(N·D) query time — it doesn't scale beyond ~100k tracks at acceptable latency. HNSW gives approximate nearest-neighbor results in microseconds at any catalog scale with recall >99% (configurable).

| Phase | Space | Dimensions | Index |
|-------|-------|-----------|-------|
| Phase 1 | T1 perceptual | 5D | pgvector HNSW, ef_construction=200 |
| Phase 2+ | Layer 2 embedding | 64–256D | pgvector HNSW (same infrastructure, higher D) |

Phase 2 is the inflection point where Woody owns the embedding space entirely — coordinates are no longer derived from Spotify Audio Features API, so HNSW search in Layer 2 space eliminates the last analytical dependency on Spotify. Playback SDK remains.

**No proprietary vector DB required in Phase 1.** pgvector on the existing Postgres instance is sufficient through ~5M tracks. Pinecone is an optional scale migration path, not a Phase 1 dependency.

### 5.3 The Arc Generation Algorithm

Session arc generation is a constrained sequential selection problem — finding the optimal sequence of tracks from current acoustic state to desired state over a fixed duration.

**Not pure A*:** True A* over a catalog of millions of tracks at 30-40 step depth is computationally infeasible without extreme pruning. The algorithm that works in practice is constrained beam search — maintaining k candidate sequences at each step, extending each by one track, keeping the k best.

**The cost function matters more than the algorithm label:**

```
cost_at_step_t = α(distance_to_target)
               + β(transition_incoherence_from_current)
               + γ(shape_deviation_at_t)
               + δ(novelty_overload)
```

Where:
- `distance_to_target` = weighted distance from candidate to acoustic target
- `transition_incoherence` = weighted distance from candidate to currently playing track (skip risk)
- `shape_deviation_at_t` = distance from the expected acoustic position at this point in the desired arc shape (e.g. at 50% of a single-apex arc, energy should be approaching peak — a plateau track here deviates from shape)
- `novelty_overload` = penalty when too many unfamiliar tracks appear consecutively

Weights α/β/γ/δ are session-type-dependent: lock-in and focus sessions weight β (transition coherence) more heavily; discovery sessions weight δ less heavily.

**Phase 3: Reinforcement learning** — train an agent to select tracks sequentially, rewarded by session quality signals (completion rate vs expected duration, time-to-first-skip, replay rate). This captures complex long-horizon dependencies that beam search cannot.

### 5.4 The Intent Model

**Internal State × External Context × Desired State = Acoustic Target**

| Input | Captures | Examples |
|-------|---------|---------|
| Internal state | How the user feels now | Tired, anxious, euphoric, focused, grieving, scattered, energized |
| External context | Environment and activity | Running, driving, studying, cooking, at a beach, at a party |
| Desired state | Where they want to go | Calm, energized, focused, euphoric, nostalgic, cathartic |

These three inputs together produce a richer acoustic target than any single text description. Users can fill any or all of them. System infers missing inputs from context signals.

**Intent entry points:**
1. **Free text** — "something warm and slow, I'm winding down after a long day"
2. **Voice** — speak the intent; transcribed and parsed identically to free text. Voice is the fastest entry method on mobile — no typing, no friction. "Hey, I just finished a run and I want to cool down" takes 3 seconds to say.
3. **Image/GIF** — pick a visual that represents the vibe; image analysis → acoustic coordinate priors (colour temperature, scene content, activity inference)
4. **Situational description** — "sunset beach with friends", "goku vs broly gym session"
5. **Structured panels** — three-panel UI for internal state / external context / desired state with quick-pick chips
6. **Activity import** — Strava/Apple Health data drives acoustic arc directly

---

## 6. System Behaviour Model

### 6.1 Universal Logic, Personalized Output

**The core principle:** The system's inference logic is universal — the same rules apply to all users. What varies is the *output direction*, because it is derived from each individual user's behavioral history. The system does not have different rules for different users.

**How it works:**
1. Context signals detected (time of day, device state, recent activity, etc.)
2. Universal inference logic maps context → probable state inference
3. State inference is combined with *this user's* acoustic behavioral history
4. Output: a direction vector (which way to push acoustic coordinates for this specific person in this specific context)
5. Track selection within that direction uses HNSW approximate nearest-neighbor search + territory biasing

**Example:**
- High-stakes situation detected (calendar: big meeting just ended; time: 6pm Friday)
- Universal rule: post-high-stakes = likely decompression need
- User A's history: decompression consistently associated with high-warmth, low-energy acoustic states → direction = calm, warm
- User B's history: post-high-stakes consistently associates with high-energy celebratory sessions → direction = energize, peak
- Same system. Same logic. Different directions because different user history.

**The directions are mutually independent in consumer attribution.** The system does not assume what any user needs — it learns from each user's own patterns. New users get informed defaults based on population priors; established users get personalized directions from their own data.

### 6.1b Incognito Mode / Session Exclusion

Some sessions should not write to the territory. Grief listening. The guilty pleasure sprint. The "not me, just this once" session.

**Requirements:**
- **Incognito session toggle:** available at session start. When enabled: session plays normally, no signals written to territory or behavioral model. No skip data, no replay data, no acoustic history updated.
- **Exclude from territory:** after any session, option to exclude it retroactively from territory contribution. Up to 24 hours post-session.
- **What is never collected in incognito:** acoustic coordinates written to history, skip/replay model updates, territory centroid adjustment, social sharing options disabled.
- **What still works in incognito:** the session itself, arc generation, the acoustic field, soft pause, arc view. The experience is full — just private.
- **Incognito indicator:** a subtle persistent indicator while incognito mode is active. Not intrusive, not badge-like — a small visual cue that this session is private.
- **Rationale:** users need psychological safety to listen without performance. Knowing that grief music or embarrassing music won't permanently shift their acoustic identity encourages honest listening over identity management.

### 6.2 Direction vs Action

- **Direction:** which way to lean acoustic coordinates (derived from context + user history)
- **Action:** which specific track to play (derived from direction + k-NN + transition coherence + territory)

Context signals inform direction only. Track selection is always driven by acoustic matching + user behavior signals.

### 6.3 Session Arc Generation

A session arc is the optimal acoustic path from the user's current state to their desired state over the specified duration.

**Generation algorithm:** Two-dimensional beam search

**Dimension 1 — Progress toward target:**
- How far is this candidate track from the acoustic target?
- Are we making progress along the acoustic trajectory?

**Dimension 2 — Transition coherence:**
- How far is this candidate track from the *currently playing track*?
- A track that scores well against the target but requires a large acoustic jump from the current moment is a skip risk

**The arc manages:**
- Step size per transition (rate of acoustic change)
- Familiar/novel ratio (inferred from session intent — see Section 10)
- Session shape (plateau, journey, single apex, baseline rise, wave, inverse, multiple peaks)
- Frisson candidate placement (35%, 68%, 88% marks)
- Ultradian rhythm accommodation (subtle energy management at ~80-minute mark)

---

## 7. Engine Requirements

### 7.1 Acoustic Coordinate Extraction

**Requirement E01:** Extract 5D acoustic coordinates from all tracks in user's Spotify library via Audio Features API. Store in vector database with track metadata.

**Requirement E02:** Map Spotify Audio Features to 5D coordinates using derivation formulas in Section 5.1.

**Requirement E03:** Real-time extraction for non-Spotify sources via Web Audio API. Lower precision than Spotify API but functional for session analysis and on-the-fly recommendations.

**Requirement E07:** Cache coordinates — do not re-analyse tracks already in database.

### 7.2 Intent Parsing

**Requirement IP01:** Intent parser converts tripartite input (internal state + external context + desired state) to a 5D acoustic target vector. Must use LLM for semantic understanding, not keyword matching.

**Requirement:** LLM receives structured input (all three intent axes separately), user's territory centroid as context, and session shape preference. Returns 5D target + confidence per dimension + recommended session shape.

**Requirement V01/V03:** Image input path: image analysis (colour temperature, scene content, activity type) → acoustic priors → combined with any text intent.

### 7.3 Session Arc Generation

**Requirement E08:** Beam search session arc generation. Input: start state, end state (from intent), duration, session shape, familiar/novel ratio. Output: ordered track sequence with transition scores.

**Requirement TC05:** Two-dimensional optimization per track selection: (1) direction toward acoustic target, (2) transition coherence score from current track. Parameterize the weighting between these two dimensions per session type (lock-in sessions weight transition coherence higher; discovery sessions weight target progress higher).

**Requirement SH01-SH03:** Session shape classification and application:
- **Single apex:** builds to peak at ~65-75% then descends (leisure, entertainment)
- **Multiple peaks:** interval-style intensity variations (physical training)
- **Plateau:** acoustically stable throughout (study, deep work)
- **Journey:** gradually evolves acoustic state (mood repair, long drives)
- **Inverse:** starts high, descends (wind-down, post-event decompression)
- **Wave:** oscillates between acoustic states (social, dynamic environments)
- **Baseline Rise:** starts below target, rises gradually to plateau (lock-in, focus induction — dopamine baseline principle)
- **Restoration:** mid-energy wave with high organicity. NOT relaxation. NOT focus. Restores directed attention capacity after cognitive depletion. Distinct from both Inverse and Plateau. (See Section 8 and new Section 26)

### 7.4 Transition Coherence Engine

**Requirement TC01:** For each candidate track, compute transition coherence score = f(acoustic distance from currently playing track). High distance = higher skip risk.

**Requirement TC02:** Skip signals are transition quality data, not track quality data. Record skip events with timing:
- Skip < 15 seconds = transition failure signal (track never evaluated on its own terms)
- Skip at 2+ minutes = track mismatch or flow state disruption
- Model these separately in the transition quality model

**Requirement TC03:** Replay events indicate acoustic resonance — extend time in this acoustic neighbourhood.

**Requirement TC04:** Volume adjustments as engagement signal — volume up = engagement, volume down = distraction or state shift.

**Requirement TC06:** Session length vs expected duration = satisfaction signal for the overall arc.

**Requirement TC07 (Dopamine Baseline):** For lock-in and focus sessions, deliberately start arc 0.2–0.3 below acoustic target across energy and density. Rise gradually over the first 20-30% of session duration. Amplifies perceived reward at target arrival via reward prediction error principle.

### 7.5 Personal Territory

**Requirement E05:** User's acoustic territory = accumulated distribution of acoustic coordinates from all saved/listened sessions. Territory centroid shifts the recommendation space toward the user's acoustic center of gravity.

**Territory biasing formula:**
```
adjusted_target = (intent_target × 0.7) + (territory_centroid × 0.3)
```
Weight shifts as territory matures: new users (< 20 sessions): 0.9/0.1; established users (> 100 sessions): 0.6/0.4.

**Territory frontier:** tracks at the acoustic edge of the user's territory are adjacent discovery candidates — familiar enough to accept, novel enough to expand.

### 7.6 Context Signal Pipeline

**Requirement:** Context signals inform the acoustic direction vector per user session. They do NOT prescribe specific tracks.

**Available signals (all optional, graceful degradation without them):**

| Signal | What it infers | Accuracy |
|--------|---------------|---------|
| Time of day + day of week | Probable state (morning alertness, afternoon dip, evening wind-down) | High — universal pattern |
| Headphone connection type | Committed listening vs background | High |
| Screen state (on/off during playback) | Active vs passive listening mode | Medium |
| Recent activity (Strava/Health) | Physical state (post-workout, sedentary) | High |
| Calendar state (if connected) | Cognitive load context (meeting just ended, meeting incoming) | High |
| Session history (last 24h) | Acoustic trajectory, prior states | High |
| Real-time skip rate | Acoustic fit quality of current session | High |
| Volume adjustments | Engagement level | Medium |
| Wearable heart rate (optional) | Actual physiological arousal | Very high — if available |
| Weather/ambient (if permitted) | Environmental mood context | Low-medium |

**Direction vector derivation:**
1. Collect available signals
2. Apply universal inference rules (time → probable state, post-exercise → elevated baseline, etc.)
3. Cross-reference with *this user's* behavioral history for that context
4. Output: acoustic direction adjustment (e.g., "push warmth +0.15, reduce energy –0.1, increase organicity +0.1")
5. Apply direction adjustment to intent-derived acoustic target

**Critical:** direction is per-user because behavioral history is per-user. System logic is universal; output is individual.

**Conflict resolution when signals contradict:**

When context signals point in opposite directions (e.g., time-of-day suggests calm [10pm] but recent Strava run suggests elevated baseline), apply this priority hierarchy:

1. **Explicit user intent** — if the user has entered intent, it overrides all context signals
2. **Wearable physiological data** — heart rate is the most direct signal; takes priority over inferred signals
3. **Recent activity data** — Strava/Health within last 60 minutes outweighs time-of-day inference
4. **Calendar context** — upcoming or recent meetings outweigh day-of-week defaults
5. **Session history** — what was the user just listening to
6. **Time of day / day of week** — lowest priority, most general

When signals conflict at the same priority level, use the user's historical pattern in that specific conflict context (e.g., "this user's sessions that started post-run at 10pm have historically been high-energy — follow that pattern"). Fall back to population prior if no personal history exists for the combination.

### 7.7 Implicit Signal Capture

**Requirement:** All implicit signals must be captured and stored for model training.

**Signal schema (S7):**

Every signal record stores the following base fields, plus signal-specific fields:

```
SignalRecord {
  signal_type: enum(skip | replay | volume_change | session_end | container_save | nudge | arc_steer)
  user_id: UUID
  track_id: string (Spotify ID or internal ID)
  session_id: UUID
  timestamp_utc: datetime
  acoustic_coordinates_at_signal: float[5]   // T1 position when signal fired
  signal_context: {
    position_in_track_ms: int,               // skip: where in track; replay: start of replay
    session_elapsed_ms: int,                 // how far into session when signal fired
    session_energy_at_signal: float,         // session energy coordinate
    transition_index: int,                   // which track-to-track transition (0 = first)
    arc_shape: string,                       // plateau, journey, single_apex, etc.
    familiar_ratio_at_signal: float,         // % familiar tracks up to this point in session
    context_signals_active: string[],        // which context signals were active (time_of_day, post_workout, etc.)
  }
}
```

Signal-specific additional fields:

| Signal | Additional fields |
|--------|-----------------|
| skip | `skip_at_ms` (when in track), `duration_before_skip_ms`, `skip_classification` (transition_failure if <15s; track_mismatch if 2+min; undetermined otherwise) |
| replay | `replay_count`, `replay_loop_duration_ms` |
| volume_change | `direction` (up/down), `magnitude_delta` (normalized 0–1), `previous_volume` |
| session_end | `planned_duration_ms`, `actual_duration_ms`, `completion_pct`, `ending_type` (natural/forced/hold) |
| container_save | `container_type` (grain/line), `save_acoustic_coordinates`, `session_context_at_save` |
| nudge | `nudge_direction` (2D vector), `acoustic_state_before`, `acoustic_state_after` |
| arc_steer | `original_endpoint`, `new_endpoint`, `preview_accepted` (bool) |

**Retention policy:**
- Raw individual signal records: 12 months
- Anonymized and aggregated signals (model training features, no user_id): indefinite
- Session-level summaries (completion rate, skip rate, avg transition coherence): indefinite
- Per-user territory and preference vectors derived from signals: user-controlled (exportable/deletable)

**Ingestion pipeline:**
- All signals emitted as events from the client (SDK or frontend)
- Events queued async (Redis or equivalent event queue) — never blocking the playback path
- Signal processor service consumes queue: validates, enriches, writes to behavioral DB (separate from main session/user DB)
- Behavioral DB is the training data source for all ML models; main session DB is the product data source
- Queue monitoring required: dropped signals degrade model quality silently. Alert on queue depth >1000 or processing lag >30 seconds.

### 7.8 Personal On-Device Model (Phase 3 Architecture)

The on-device personal model is a fine-tuned small language model running locally on the user's device. It is not a recommendation model — it is a **behavioral prior** that understands what acoustic states this specific user tends toward in specific contexts.

**Model spec:**
- Base: Phi-3-mini-4k-instruct or Gemma-2B
- Quantization: INT4 (~750MB–1.5GB on-device footprint)
- Training: offline RL on behavioral signals, continuously fine-tuned
- Not doing token generation — maintaining a learned state vector of acoustic preferences

**Why on-device matters:** The personal model can condition on context that the server never sees and that privacy regulations make impractical to send to a server:
- Time of day (trivial, but available)
- Accelerometer / motion data (movement vs. stationary)
- Ambient noise level (quiet room vs. noisy environment)
- Battery level and charging state (listening context signal)
- Active app context (if permitted) — gym app, maps, notes

These are powerful predictors of acoustic preference unavailable to a server-side model without invasive data collection.

**RL reward signal (granular, not sparse):**

| Signal | Reward |
|--------|--------|
| Track played >60% of intended duration | +reward on current acoustic neighborhood |
| Energy-triggered skip | -reward on Energy dimension delta; +reward on others |
| Manual skip at <20 seconds | Strong -reward on current track's acoustic coordinates |
| Replay | Strong +reward |
| Add to library | Delayed +reward weighted by track dimensions |
| Volume increase | Moderate +reward on current acoustic state |

**Cold initialization:** The on-device model initializes from a population prior distributed with the app binary. Fine-tuning begins immediately on first behavioral signal. No cold start for the personal model — it starts from population knowledge and personalizes from observation 1.

**Hardware constraint:** Single forward pass ~200ms on iPhone 15 Pro (512-token context). Sufficient for between-track transition inference. Too slow for within-track real-time adjustments. Design the system so the personal model runs at transition time only, not at every audio frame.

**Privacy:** Model weights live in the app's protected sandbox. Must set `NSFileProtectionComplete` (iOS) / `EncryptedFile` from Jetpack Security (Android) on the model directory — weights are encrypted when device is locked. Never include model weights in crash reports. Never sync raw weights to server without explicit user opt-in.

**Population model:** A separate server-side model is trained on anonymized aggregated behavioral signals (not individual data). This is the foundation the on-device model fine-tunes on top of. Phase 3 may implement full federated gradient aggregation (differentially private gradient uploads) if scale justifies the infrastructure. See SHELVED.md for federated learning deferral reasoning.

### 7.8b Dynamic Weight Store (Phase 2 Architecture)

**Formal principle (A2):** No weight in the Woody system is permanently fixed. Every parameter that governs acoustic behavior has three values:

1. **Cold-start default** — the value used when no personal history exists for this user in this context
2. **Session-type parameterization** — the value adjusted for the current session type (lock-in, discovery, activity, wind-down, etc.)
3. **Learned value** — the value updated by behavioral signals from this specific user in this specific context

The calibration confidence score (per track) governs how much weight to give learned vs. default values for a given track's contribution.

**The weight store** is a per-user, per-context table of learned parameter values. Examples of parameters that must be dynamic:

| Parameter | Cold-start default | What learns it |
|-----------|------------------|----------------|
| 5D coordinate derivation weights (Section 5.1) | Formula-derived | Anchor corpus + online calibration |
| Territory biasing ratio (0.7/0.3) | 0.9/0.1 new users, 0.6/0.4 established | Session count |
| Familiar/novel ratio per session type | Type-specific defaults (Section 8.5) | Session completion signals |
| Arc cost function weights (α/β/γ/δ) | Session-type defaults | Skip/replay behavioral signals |
| Confidence score weights (acoustic_fit/territory/transition) | 0.4/0.35/0.25 | Model performance per user |
| Frisson placement timing (35%, 68%, 88%) | Fixed markers | Engagement signal alignment |

**Phase 2 implementation:** Weight store as a versioned parameter table in the user DB. Updated by the signal processing pipeline asynchronously. Read by the arc generation engine at session start.

**Phase 3 relationship:** The on-device personal model (Section 7.8) IS the weight store at Phase 3 — RL updates the parameters directly on-device. The server-side weight store in Phase 2 is the precursor to this; the schema should be compatible with eventual on-device ownership.

### 7.9 Lock-In Session Requirements

**Requirement LI01:** Lock-in mode captures task description, current state, desired end state, duration. Combines these into an acoustic target optimized for the specific task type.

**Task-to-acoustic-target defaults:**

| Task | Energy | Warmth | Density | Organicity | Sacred | Shape |
|------|--------|--------|---------|-----------|--------|-------|
| Deep writing / analytical | 0.35 | 0.55 | 0.25 | 0.65 | 0.45 | Plateau |
| Creative / design work | 0.5 | 0.7 | 0.4 | 0.6 | 0.35 | Wave |
| Physical training | 0.85 | 0.5 | 0.75 | 0.35 | 0.4 | Single apex / intervals |
| Study / learning | 0.3 | 0.55 | 0.2 | 0.65 | 0.45 | Plateau |
| Meditation / mindfulness | 0.15 | 0.65 | 0.15 | 0.75 | 0.75 | Inverse |
| Social / collaborative | 0.6 | 0.75 | 0.55 | 0.5 | 0.35 | Wave |
| Wind-down / decompression | 0.2 | 0.75 | 0.2 | 0.7 | 0.7 | Inverse |

**Requirement LI04:** All lock-in sessions apply Baseline Rise arc shape — start 0.2-0.3 below target on energy and density, rise gradually over first 20-30% of session.

**Requirement LI05:** Once lock-in session starts, no decisions required from user. Music takes responsibility for state management. Nudge controls available but no track prompts.

**Requirement LI06:** Post-session: correlate acoustic characteristics with completion signals (session length vs expected, skip rate, uninterrupted run time) to refine future lock-in recommendations.

### 7.9 Acoustic Hold / Soft Pause

**Requirement AH01:** Three playback states exist: play, hold (soft pause), and full stop.

**Requirement AH02 (Graceful Ending):** When hold is triggered, Woody has 1–2 seconds to resolve whatever is playing into a satisfying acoustic exit — reverb sustain, micro-fade, or resolving harmonic texture generated from the track's current acoustic state. The last sound before hold is a completion, not a cut. Applies peak-end rule: the session is remembered by its ending.

**Requirement AH03 (Hold Texture):** During hold state, a low-level ambient acoustic texture sustains the session's mood field. Not silence. Not progression. A held acoustic space.

Implementation: extend the reverb tail of the last playing track using a Web Audio API `ConvolverNode`. Decay time parameterized by the session's energy coordinate — high energy = shorter decay (0.8–1.5s); low energy = longer reverb tail (3–6s). This is achievable with the Web Audio API in Phase 1 without any audio synthesis library. **No generated drone** — audio synthesis is not in the tech stack (Spotify SDK + Web Audio API do not generate audio from scratch).

Phase 3 upgrade path: `Tone.js` procedural synthesis for richer hold textures, conditioned on all 5 acoustic coordinates.

**Rejected approach (C4):** generating a drone at the session's acoustic coordinates. This requires an audio synthesis engine not present in the stack. Removed from requirements.

**Requirement AH04 (Re-entry Protocol):**
- Hold < 60 seconds: seamless continuation from where the session was
- Hold 60 seconds – 3 minutes: brief acoustic re-establishment (10 seconds) before main content
- Hold > 3 minutes: full re-entry protocol (15–20 seconds rebuilding momentum + "Flow may have reset" prompt)

**Requirement AH05:** After extended hold, on resume: present two options — "Continue this session" or "Start fresh." Non-judgmental, no guilt, user keeps agency.

**Rationale:** Silence is cognitively active — the default mode network re-engages immediately, exiting the flow state. The hold state prevents this by maintaining acoustic presence. The graceful ending applies the peak-end rule (experience judged by peak and ending) to prevent hard cuts from defining the session memory negatively.

---

## 8. Psychology Requirements

*These are not features — they are behavioral laws that the engine must respect. Full research basis in PSYCHOLOGY.md.*

### 8.0 The Optimization Target Is Non-Disruption, Not Preference

The most important behavioural principle in the entire engine: **the optimization target is not "songs the user loves" — it is "songs the user does not interrupt."** These are different things.

A track can score highly against an acoustic target and still cause a skip — because the skip is not a judgment on the track, it is a judgment on the *transition*. The same song, loved in isolation, will be skipped mid-session if it breaks something that was working. Woody's engine must optimize for flow preservation first, acoustic preference second.

**Implementation consequence:** transition coherence is a first-class constraint, not a secondary optimization. A "good enough" seamless transition beats a "perfect" jarring one in every session type except explicit discovery mode. The cost function in arc generation weights transition coherence as a hard constraint before target proximity.

**What the skip actually signals:** "this transition cost more than the current flow state could absorb." Not "I don't like this song." The engine trains on this interpretation — skip signals feed the transition coherence model, not the track quality model. These are separate models.

---

### 8.1 Match Before You Move

The session arc always starts acoustically congruent with the user's current state, then moves toward the desired state. Never start where they want to end.

**Implementation:** The first 15–20% of any session arc should have acoustic coordinates within 0.15 distance of the user's current state (inferred from context signals and session history). The arc then traverses toward the target.

**Exception:** explicit "shock" intent ("jolt me awake", "snap out of it") — user has explicitly requested non-congruent opening. Rare.

**Psychological grounding:** Congruent music outperforms incongruent for mood repair (discharge strategy). Someone anxious reaching for calm music through an anxious-start arc is more effective than immediate calm music delivery.

### 8.2 Transition Coherence Over Track Optimality

A seamless "good enough" transition beats a perfect but jarring one. The engine must optimize for smooth transitions as much as for acoustic target proximity.

**Implementation:** Transition coherence score weighted at minimum 30% of track selection decision. In flow-critical session types (lock-in, study, wind-down), weight increases to 50%.

**The skip is not a track rating.** It is a transition quality signal. Engine must model these separately.

### 8.3 Metabolic Floor

The acoustic field (visual) and the session (audio) must always maintain a minimum baseline rhythm. Nothing drops dead. No hard cuts between tracks, no silence, no flat visual field.

**Implementation:** Crossfade minimum of 2 seconds between all tracks. Acoustic field renderer maintains minimum animation frequency regardless of acoustic coordinates. Hold state uses ambient texture, never silence.

### 8.4 Earn the Peaks

Frisson moments (most potent emotional payoffs) require setup. High-density, high-energy tracks after consistently high-density tracks produce nothing. The same track after lower-density setup produces chills.

**Implementation:** Place frisson candidate tracks (high energy spike, high density spike) at approximately 35%, 68%, and 88% of session arc. Ensure minimum 3 lower-energy tracks precede each frisson candidate. Never place frisson candidates in first 25% of session.

**Frisson suppression rule:** Frisson candidates are actively suppressed in focus, work, study, and lock-in session types. The same acoustic event that produces a pleasurable chill in leisure listening is an attention-breaking disruption in a cognitive work session. The engine must distinguish between session contexts where frisson is desirable (entertainment, physical activity, leisure) and contexts where it is harmful (any cognitively demanding task). Physical activity arcs are the exception — frisson is motivationally useful during exertion and is not suppressed.

### 8.5 Novelty Is Earned, Not Gifted

New music is a stressor that requires spare cognitive bandwidth. Introduce novelty after acoustic anchors (familiar territory tracks) establish safety.

**Implementation:** First 20–30 minutes of any session should draw primarily from user's established territory (familiar ratio 70%+). Novel tracks are introduced after commitment to the session is established.

**Familiar/novel ratio by session type:**

| Session type | Familiar | Novel |
|-------------|---------|-------|
| Wind-down / recovery | 70–80% | 20–30% |
| Work / focus | 60–70% | 30–40% |
| Physical activity | 50–60% | 40–50% |
| Discovery / exploration | 30–40% | 60–70% |
| Lock-in | 65–75% | 25–35% |

### 8.6 Context Informs Direction, Action Comes From User Data

External context signals shift the acoustic direction vector. They do not prescribe specific actions. The specific track selection is always governed by the user's own behavioral history within that direction. This prevents the system from assuming what any user needs in any situation.

### 8.7 Ultradian Rhythm Respect

The default 90-minute session is biologically grounded (one Basic Rest-Activity Cycle). The arc should accommodate the ~80-minute ultradian trough:

**Implementation:** Plateau and study arcs incorporate a subtle density dip at 75–85 minutes (reduce density by ~0.1–0.15), then gentle re-energize for remaining duration. Single-apex arcs should peak between minutes 60–75, then resolve before the trough hits.

### 8.8 Nostalgia Is Protected

Tracks with high autobiographical memory potential should not appear unexpectedly in task-oriented sessions. Being ambushed by a track that triggers intense personal memory during work is a product failure.

**Implementation:** Track nostalgia potential scoring (derived from: era-matching user's reminiscence bump age range, listen history age of the track, acoustic fingerprint of nostalgic content). High-nostalgia-potential tracks restricted to: wind-down arcs, rediscovery sessions, solace sessions. Gated from: focus, work, physical activity sessions.

### 8.9 The Dopamine Baseline Effect

Sessions that start below the user's natural arousal baseline and rise gradually produce disproportionately rewarding peak moments. This is applied via the Baseline Rise arc shape in lock-in and focus sessions.

### 8.10 Soft Pause Is Not Optional

The peak-end rule means a session's memory is determined by its ending. Hard cuts produce negative final impressions regardless of session quality. Graceful endings are required, not optional.

---

## 9. Visual Language Requirements

*Full specification in VISUAL_LANGUAGE.md. These requirements are closed decisions.*

### 9.1 Art Direction

**Base layer:** Algorithmic geometric structures — rule-based, systematic, Vera Molnár / Sol LeWitt reference. Grids that warp. Lines that accumulate. Geometry that implies intelligence without decoration.

**Accent layer:** Fluid rounded illustrative forms — organic, simple, beautiful. The organic disrupting the geometric.

**Figure layer:** Pixelated human figures embedded in and moving through the geometric field. Dancing, drifting, running figures. Small (16–32px tile-based pixel art). This is Woody's visual signature — precise AND deeply human.

**Aesthetic reference:** Bold, uncluttered, confident negative space. Strong central presence. Nothing decorative that doesn't earn its place. When the geometry and figures are present, they are the only thing. Think Berlioz album cover aesthetic — striking, simple, room to breathe.

### 9.2 The Acoustic Field (Now Playing Screen)

The acoustic field IS the now-playing screen. Not a player with a visualizer added — the field is the hero.

**Acoustic-to-visual mapping:**

| Acoustic dimension | Visual expression |
|-------------------|-----------------|
| Energy | Pulse rate / geometry transformation speed |
| Warmth | Glow intensity / amber warmth flooding the field |
| Density | Layering complexity / active geometric structure count |
| Organicity | Balance of geometric vs fluid rounded forms (high organicity = more fluid) |
| Sacred | Radial expansion, stillness between pulses, near freeze-frames |

**Motion requirements:**
- **Metabolic floor:** constant baseline pulse — always alive, never drops dead
- **Data modulation:** acoustic coordinates push motion up from the floor, never to zero
- High energy = faster, sharper geometry shifts
- High warmth = fluid, smooth eases
- High sacred = radiant stillness, long pauses between pulses
- High density = multiple elements moving simultaneously
- Pixelated figures move in sync with the field's acoustic state (same data drives both)

### 9.3 Shareable Artifact Layout

Consistent recognizable layout (every Woody artifact is identifiable):
- Acoustic arc: path through coordinate space over time (the curve)
- Coordinate field: 2D space with energy × warmth primary axes
- Time axis: implicit in arc length
- Thin annotation marks at frisson candidate moments and significant transitions
- Session name in Syne 600, small — acoustic description auto-generated if unnamed
- Coordinate labels in Space Mono

Unique per session: the geometric texture generated during the session seeds the artifact's visual field. Same layout, different world every time.

### 9.4 Design Tokens

```css
--void: #0a0a0f        /* Base background — always present */
--teal: #00e5c4        /* Primary accent — territory, saved, primary actions */
--cobalt: #4455ff      /* Secondary — cold acoustic states, high energy low warmth */
--moon: #f0ede6        /* Primary text */
--amber: #f0a040       /* Recommendations, warm acoustic states */
```

Grain overlay: always present. Structural, not decorative.
Borders: 10% moon opacity (`rgba(240, 237, 230, 0.1)`).

### 9.5 Typography

| Role | Font | Weight |
|------|------|--------|
| Headings, session names | Syne | 800/700/600 |
| Body, descriptions | Epilogue | 300/400/500 |
| Data, coordinates, timing | Space Mono | 400 |
| Acoustic labels | Space Mono | 400 small |

### 9.6 What the Visual Language Is Not

Glassmorphism, neon/synthwave, random particle systems, generic music player aesthetic, waveform/spectrum analyzer visualizations, album art as hero, pure geometric-only without fluid forms, pure illustration without geometric base.

### 9.7 Open Visual Questions (Not Blocking Build, But Unresolved)

- Pixel/custom art for shareable artifacts — on the table, not decided
- Illustrated form library (8–12 fluid rounded shapes to be designed)
- Near-dark surface lift value for cards/panels above void background
- Iconography: hero symbol, logo mark, container icons, acoustic dimension icons — dedicated session required

---

## 10. UX / Screen Requirements

### 10.1 Navigation Model

**Now Playing is the hub.** Everything else is one gesture from it. Navigation almost disappears — the primary experience is listening.

**Navigation gestures:**
- Swipe up from Now Playing → Session history / arc view
- Swipe right from Now Playing → Territory / constellation view
- Swipe left from Now Playing → Social feed (invisible if empty)
- Pull down from any view → Return to Now Playing
- No tab navigation. No persistent navigation bar.

**Home (first screen, no active session):**
- Intent input is the primary action — always visible, always accessible
- 2–3 suggested session options based on context signals and territory
- Recent containers (last accessed)
- No feed, no browse, no catalog — the entry point is intent

### 10.2 Screen Requirements

#### Screen 1: Home / Entry Point

**Purpose:** first experience and return state when no session is active

**Requirements:**
- Intent input field: prominent, primary action, immediately accessible
- Context-aware suggestions: 2–3 session starting points inferred from time, recent history, territory
- Recent containers: last accessed Grains, Lines, Pulls (working names)
- No session? No music playing? Home is what you see.
- Minimal chrome — negative space is structural

#### Screen 2: Intent Input (Full)

**Purpose:** detailed session configuration

**Requirements:**
- Three-panel capture: internal state / external context / desired state
- Each panel: free text OR quick-pick chips (not forced, any or all can be set)
- **Voice input:** microphone button on the intent field — speaks intent, auto-transcribed, parsed identically to typed text. Primary mobile entry method. No special "voice mode" — it's just another way to fill the field.
- Lock-in mode toggle: adds task description field, adjusts arc shape to Baseline Rise
- Session duration selector: 30min, 60min, 90min (default), 120min, custom
- Session shape selector (optional — inferred if not set):
  - Journey / Plateau / Single apex / Wave / Inverse / Baseline Rise
- Image/GIF intent shortcut: tap to use visual instead of text
- Activity import button: pull from Strava/Health to set context automatically
- Derived coordinates preview: show 5D bars updating as intent is built (transparency into the engine)
- "Start Session" → generate arc → transition to Now Playing

#### Screen 3: Now Playing

**Purpose:** the primary listening experience

**Requirements:**
- Acoustic field fills the display (full screen — no chrome around it)
- Track info overlay: minimal, bottom-positioned, artist + title + duration
- Arc horizon line: thin line at bottom showing current position in session arc
- Spatial nudge pad: 2D pad accessible via persistent small target in lower corner. No labels. Push in a direction. Warmer/colder/more intense/ease up.
- Soft pause button: triggers graceful ending + hold state (not hard stop)
- One-tap Grain save: mark this moment (saves current track + acoustic state + timestamp)
- Swipe gestures (see Section 10.1)
- Lock-in mode indicator: if in lock-in session, small persistent indicator showing task + time remaining

#### Screen 4: Session Arc View

**Purpose:** view the current or past session as an acoustic arc — and steer it

**Requirements:**
- Full arc visualization: time axis horizontal, acoustic dimensions vertical
- Current position marked
- Frisson candidates marked (designed moments, visible)
- Past arc: shows actual acoustic trajectory including any nudge adjustments
- Future arc: shows planned trajectory (dimmable — not the focus while listening)
- Track markers along the arc: tap to see track info at that point
- At session end: option to save as Line (named, craftable), leave as Grain (unnamed moment), or discard

**Steering Interaction (S3 — core UX innovation, must spec before Screen 4 build):**

The future arc endpoint is draggable. This is the primary arc steering mechanism — more intentional than the nudge pad, less disruptive than generating a new session.

Interaction flow:
1. User grabs the arc endpoint (the destination dot at the far right of the future arc)
2. Drags it toward a new acoustic target — up/down on the energy axis, left/right on the warmth axis
3. As the user drags, the arc re-routes dynamically (live preview): the remaining session arc from the current track position recalculates via partial beam search restart
4. Rerouted arc is visually distinct from original plan: different line style (dashed or dimmer opacity, different color) until committed
5. 3-second preview confirmation: the first 2 tracks on the new path are surfaced briefly ("Going here next: [track A] → [track B]") — user can abort or confirm
6. On confirm: arc commits, engine executes the new path from current position
7. On abort (no interaction within 3 seconds): arc returns to original plan, no disruption

**Why this matters:** the arc-as-steerable-surface is the core product concept — the session is not a fixed playlist, it is a route through acoustic space that the user can redirect at any point. The steering interaction is what makes that concept real and tangible. Without it, the arc is display-only, not a navigation surface.

**Technical note:** partial beam search restart from the current track position — not a full regeneration from the beginning. This means latency is proportional to remaining arc length, which is shorter than the full session. Should complete in <500ms for a standard session length.

#### Screen 5: Container Browser

**Purpose:** browse and manage saved sessions

**Three container types (working names — not finalized):**

**Grain** (unplanned captured moments):
- Reverse chronological feed
- Each Grain: track, acoustic state at capture, context (time, session context)
- Tap to re-enter the acoustic neighbourhood of that Grain
- Auto-named with acoustic description if not named

**Line** (crafted/named session arcs):
- Grid or list of named sessions
- Each shows: arc shape visualization (mini), acoustic range, duration, date
- Tap to replay or share
- Edit to adjust arc parameters and rebuild

**Pull** (recurring acoustic contexts — working name):
- Named acoustic contexts ("Sunday mornings", "pre-run", "the 3am one")
- Each shows: number of sessions inside, acoustic fingerprint of the context, last accessed
- Contains Grains and Lines that share acoustic signature
- System creates Pull suggestions: "You have 8 similar morning sessions — name this?"
- Pull is a trained acoustic context: Woody learns its acoustic signature, uses it for future recommendations in that context

#### Screen 6: Territory / Constellation View

**Purpose:** your personal acoustic history as a spatial distribution

**Requirements:**
- 2D projection of acoustic history: energy (x-axis) × warmth (y-axis) primary
- Heat cloud / constellation: each point is a session or saved track; density shows acoustic habitation
- NOT a geographic map. NOT the same for everyone. Your unique acoustic fingerprint.
- Colour coding: teal = your territory; amber = recommended areas; cobalt = unexplored adjacent territory
- Tap a cluster: see what sessions/tracks live in that acoustic space
- Territory frontier: the edge of your acoustic territory — adjacent discovery territory shown as lighter overlay
- Social overlay (Phase 3): where other users' territories overlap yours (anonymous by default)
- Time filter: view territory by time period — how has your acoustic shape changed?

#### Screen 7: DJ Mode

**Purpose:** set logging and visualization for DJs and creators

**Requirements:**
- Tracklist input: paste from Mixcloud/Boiler Room, or manual entry
- Auto-fetch acoustic coordinates for each track in tracklist
- Full arc visualization: energy/warmth/density over set duration
- Bidirectional use: (1) visualize a set retrospectively, (2) build a set diagnostically — see acoustic gaps, Woody suggests bridges
- Acoustic gap detection: highlight transitions where energy/warmth jumps are high
- Bridge suggestion: given gap between two tracks, suggest tracks that would smooth the transition
- Shareable set arc: exportable as visual artifact for Instagram, Mixcloud post, etc.
- DJ territory map (Phase 3): aggregate of all sets shows DJ's acoustic signature over time

#### Screen 8: Profile / Territory Page

**Purpose:** public-facing acoustic identity

**Requirements:**
- Territory visualization (public view of constellation)
- Shared Lines and acoustic arcs
- Acoustic statistics (top territory quadrant, average session energy, etc.)
- No track list exposed — acoustic shape visible, specific tracks not
- Social: mutual territory overlaps shown (Phase 3)

#### Screen 9: Post-Session Flow

**Purpose:** the moment after a session ends — closing ritual, save prompt, artifact generation

**Trigger:** session reaches planned end OR user triggers graceful ending manually

**Requirements:**
- Graceful ending plays first (see Section 7.9 AH02) — no abrupt cut to this screen
- **The session summary emerges:**
  - Acoustic arc visualization (mini) — the journey you just took
  - Actual vs planned trajectory (if nudges were used)
  - Session duration (actual vs planned)
  - Frisson moments marked on arc (if any were detected by engagement signals)
- **Save decision:**
  - "Name this Line" → save as crafted session arc (Line)
  - "It was a moment" → auto-save as unnamed Grain
  - "Let it go" → discard (but incognito note: if in incognito mode, this is the only option shown)
- **Share artifact:**
  - One-tap artifact generation from session data
  - Preview shows generated arc artifact (unique geometric texture from this session)
  - Share to: Instagram, Strava (if active session), copy link, save to camera roll
- **Lock-in session extension (if lock-in mode):**
  - "Task done?" → confirm or extend
  - If extended: "Re-entering flow" → soft acoustic re-entry, no full re-start
- **"Go again?"** — one-tap to return to intent input with session context pre-loaded. Or swipe down to return to home.

**Tone:** this screen should feel like exhaling. Not rushed. Not full of prompts. The hierarchy is: experience → save if you want → share if you want → back whenever you're ready.

### 10.3 Onboarding Flow

**Requirement:** New user onboarding must establish acoustic territory before first session.

**Steps:**
1. Spotify OAuth — connect library
2. Library analysis: background fetch of Audio Features for liked songs + playlists
3. Initial territory visualization: show the user their acoustic fingerprint from existing library
4. "Your acoustic shape looks like this" — moment of recognition
5. First intent input: "What do you want to hear right now?" — assisted with suggestions based on territory
6. First session generated and started
7. Tutorial touchpoints inline (not a separate tutorial mode)

**Time to first session target:** < 3 minutes from sign-up

---

## 11. Container Model (In Detail)

Three container types representing three fundamentally different listening relationships:

### Grain (Unplanned / Received)

A moment that arrived. Something resonated during passive or active listening. One tap to save. No setup required.

**What it stores:**
- Track ID + source
- Timestamp within the track at moment of save
- Acoustic coordinates of the session at time of save
- Session context (intent text if any, time, duration into session, arc position)
- External context signals at time of save

**How it's created:**
- During any session: tap the Grain button
- Auto-suggested after sessions with high engagement signals
- Can occur within a Line (arc) — a marked moment within a crafted journey

**Note:** A Grain within a Line maintains its relationship to the Line AND exists in the standalone Grain collection. The Grain is the atomic unit of capture.

### Line (Crafted / Intentional)

A journey with intention. Started with intent input. Named. Shareable.

**What it stores:**
- Full acoustic arc (track sequence + acoustic trajectory)
- Intent that created it (internal state, external context, desired state)
- Session shape
- Duration
- Actual vs planned acoustic trajectory (including nudge adjustments)
- Grains marked within it
- Share artifact

**How it's created:**
- Intent input → session generation → session end → user names it
- Upgrade from Grain: user can retroactively "name and save" any session
- DJ set upload → converted to Line with visualized arc

### Pull (Recurring Context)

The acoustic home you keep returning to. A named need, not a named playlist.

**What it stores:**
- Name (user-assigned)
- Acoustic signature (learned from member Grains and Lines)
- Member Grains and Lines
- Creation method (manual or system-suggested)
- Last accessed timestamp

**How it's created:**
- Manual: user names a recurring acoustic context
- System-suggested: after pattern detection ("You have 8 similar Sunday morning sessions — group these?")
- Pattern detection criteria: ≥5 sessions with acoustic coordinates within distance 0.3 of each other, minimum 2 different calendar weeks

**The Pull difference from a playlist:** Woody learns the Pull's acoustic signature and can generate new sessions targeted to it. "I want a Pull session for Sunday morning" → system generates a new Line whose acoustic target matches the Pull's learned signature. The Pull is a trained acoustic context, not a static collection.

**Naming note:** Grain / Line / Pull are working names — not finalized. Do not hard-code brand strings pending final naming decision.

---

## 12. Social Architecture Requirements

### 12.1 Core Social Objects

- **Primary social object:** the arc (the journey), not the opinion
- **Not:** ratings, reviews, likes, follower counts
- **Yes:** acoustic arcs, territory overlaps, journey artifacts

### 12.2 Sharing Mechanics

**While-listening share:** "I'm in this acoustic space, join me" — a live artifact with the acoustic field visualization at the current moment. Invitation to experience the same acoustic state.

**After-listening share:** Complete session artifact — the full arc, the acoustic journey, generated geometric texture unique to the session. Beautiful, permanent, shareable to any platform.

**Strava integration:** Session arc embeds directly in Strava activity post. Acoustic arc + physical activity arc combined in one artifact. Primary acquisition mechanism for active listeners.

**Platform outputs:** Instagram Stories format, web embed, Strava post attachment, standalone link.

### 12.3 Community Architecture

- **Topic-organized, not person-organized:** Reddit model, not Instagram
- **Conversation starter:** "how did you get here" (to this acoustic territory), not "is this good"
- **Mutual territory discovery:** "you and this person share acoustic territory but arrived via completely different routes" — acoustic overlap as connection mechanism
- **No influence model:** following ≠ self-promotion. Artists and DJs appear as listeners, same as anyone else.
- **Community norms set by DJ seed community before general users join**

### 12.4 Group Listening

Group listening is a Phase 3 feature. Two or more users listening to the same arc simultaneously.

**Requirements:**
- One user generates the arc (the host); others join the session link
- All listeners hear the same track at the same position (synchronized playback)
- Each listener's individual acoustic field renderer runs independently — same acoustic data, different generated geometry. Group session = shared journey, unique visual experience per person.
- Soft nudge input: guests can nudge the acoustic direction; host controls whether guest nudges apply or just register as preference data
- After-session artifact: shows multiple territory overlaps within the session — "you listened here together"
- **No voice/video chat inside Woody.** Group listening is acoustic-only. If people want to talk, they're already on a call.

### 12.5 Acoustic Embed

The acoustic arc is embeddable anywhere that accepts an iframe or image: Mixcloud, Boiler Room, Notion, personal sites, social bios.

**Requirements:**
- Static embed: PNG/SVG export of the arc artifact — postable to any platform
- Live embed: iframe showing real-time acoustic field at the current session's coordinates — for Notion pages, web profiles, live sets
- Embed size variants: 4:5 (Instagram), 16:9 (Twitter/X header), 1:1 (profile), wide-format (Mixcloud banner)
- Embed privacy: shared only what the user selects — arc shape only, arc + session name, arc + full annotation, or full artifact

### 12.6 Acoustic Year-in-Review

Annual acoustic identity artifact. Generated automatically from all sessions in the calendar year.

**Requirements:**
- Aggregate territory visualization: the full year's acoustic arc as a distribution — where did you spend your acoustic time?
- Acoustic arc highlights: longest session, highest-energy session, most unique session (furthest from centroid)
- Dimension statistics: average energy, warmth, density, organicity, sacred across the year — and how they changed month to month
- Journey map: the territory's evolution — how the acoustic centroid shifted over 12 months
- Most-returned-to Pull: the recurring context with the most sessions
- Shareable artifact: unique per user, aesthetically beautiful, identifiably Woody
- **Unlike Spotify Wrapped:** no track lists, no artist rankings, no comparison to other users. Only acoustic shapes, arc patterns, and acoustic evolution over time. The art of your year, not the data of it.

### 12.7 Social Layer Activation

Social features are invisible until there is something to show. Empty social surfaces are not built. Sequence:
1. DJs share arcs (no social layer needed — artifact goes to Mixcloud/Instagram)
2. DJ audience discovers Woody through artifacts
3. Audience builds their own territory
4. Territory overlaps begin surfacing mutual connections
5. Community emerges from the connections, not from building the community first

---

## 13. DJ / Creator Mode Requirements

### 13.1 First-Class, Not Adapted

DJ mode must feel built for DJs, not adapted from a listener product. The set arc visualization is the most beautiful artifact in the product.

### 13.2 Core DJ Features

**Set logging:**
- Paste tracklist (Mixcloud/Boiler Room format, Rekordbox export, manual)
- Auto-fetch acoustic coordinates for all tracks
- Generate full arc visualization (energy, warmth, density over set duration)
- Identify acoustic gaps (high-distance transitions)
- Suggest acoustic bridges (tracks that could smooth flagged transitions)

**Bidirectional visualization:**
- Retrospective: upload a completed set, see its acoustic arc
- Diagnostic: build a set and see its acoustic shape as you go

**Shareable set artifact:**
- Visual arc of the full set
- Embeddable, postable to Mixcloud, SoundCloud, Instagram Stories
- Shows the acoustic journey without exposing track choices (privacy option)
- "What is that?" — the artifact that makes followers ask about Woody

### 13.3 Creator Tools Surface From Behavior

Creator mode is not a setup choice. It surfaces when behavior signals creator intent:
- Pasting a tracklist → DJ mode activates
- Logging multiple sets → DJ territory map offered
- Building sessions longer than 2 hours → creator tools surface

No setup toggle. No "are you a DJ?" question at onboarding.

---

## 14. Activity Integration Requirements

### 14.1 Supported Activities

| Platform | Priority | Integration type |
|----------|---------|-----------------|
| Strava (run, ride) | Phase 2 Priority | OAuth, activity import, artifact embed |
| Apple Health (workout) | Phase 2 | HealthKit, workout data import |
| Google Maps (drive routes) | Phase 2 | Route + duration import |
| Garmin Connect, Wahoo | Phase 3 | After Strava proven |
| Peloton, Zwift | Phase 3 | Niche but high-engagement |

### 14.2 Activity-to-Arc Mapping

**Input from activity:** duration, effort curve (heart rate, elevation, pace), activity type

**Output:** acoustic energy curve that maps to the effort curve, with BPM targets derived from movement cadence

**Three-zone activity session structure:**
1. **Pre-hype** (5–10 min): high-energy build before activity begins. Primes anaerobic readiness. Physiologically grounded.
2. **Main arc** (duration of activity): tempo-matched to activity cadence, energy follows effort curve
3. **Cool-down** (15–20 min): inverse shape, high warmth and organicity, descending energy. Accelerates heart rate recovery.

**BPM targets by activity:**

| Activity | BPM range | Energy target |
|---------|-----------|--------------|
| Running | 155–175 BPM | 0.8–0.9 |
| Cycling | 130–145 BPM | 0.75–0.85 |
| Walking | 110–125 BPM | 0.5–0.65 |
| High-intensity interval | 145–175 BPM cycling | 0.6–0.9 (intervals) |

### 14.3 Pre-Hype Arc

5–10 minutes of high-energy, high-density acoustic preparation before an activity. Physiologically primes performance. This is a designed product moment — a distinct session component with its own start/transition/end logic.

---

## 15. Technical Architecture Requirements

### 15.1 Platform

- **Web-first, PWA.** No native app in Phase 1.
- **Mobile-optimized.** The primary use case is mobile (headphones on, phone in pocket, listening anywhere).
- **Always dark theme.** No light mode.

### 15.2 Backend Stack (Recommended)

| Component | Technology | Rationale |
|-----------|-----------|---------|
| API server | Python FastAPI | ML/audio analysis libraries; async support |
| Vector database | Postgres + pgvector (MVP), Pinecone (scale) | HNSW approximate nearest-neighbor search via pgvector. Phase 1: 5D T1 space. Phase 2+: 64-256D Layer 2 embedding space. No proprietary dependency. Microsecond query time at any catalog scale. |
| User data | Postgres | Relational data: users, sessions, containers, signals |
| Session arc cache | Redis | Fast retrieval of generated arcs |
| Audio analysis | Essentia (Python) — primary; Librosa (Python) — fallback | Music-specific feature extraction for non-Spotify sources; Essentia preferred (MIT licensed, production-grade, music-specific); Librosa as fallback only |
| LLM intent parsing | Claude API | Semantic intent → acoustic coordinate translation |
| File storage | S3-compatible | Artifact images, session exports |
| Authentication | Spotify OAuth 2.0 (primary), email/social fallback |

### 15.3 Frontend Stack

| Component | Technology | Rationale |
|-----------|-----------|---------|
| App shell | Next.js (React) | PWA support, SSR for onboarding |
| Acoustic field renderer | Vanilla JS + Web Audio API + Canvas | Performance-critical, no framework overhead |
| Real-time audio analysis | Web Audio API | Any source, no API dependency |
| Spotify playback | Spotify Web Playback SDK | In-browser playback |
| Styling | CSS custom properties (tokens) | Design token system |
| Animation | GSAP or Web Animations API | Performance-critical motion |

### 15.4 Data Architecture

**Core entities:**

```
User
  ├── SpotifyProfile
  ├── Territory (vector: centroid + distribution)
  ├── Sessions[]
  ├── Containers[] (Grains, Lines, Pulls)
  └── SignalHistory[]

Track
  ├── SpotifyID (or other source ID)
  ├── AcousticCoordinates (5D vector)
  ├── CoordinateSource (`bootstrap` | `calibrated`) — see Section 5.1 bootstrap note
  ├── CalibrationConfidence (0–1 float) — low for non-Western, irregular time sig, sparse features
  ├── Metadata (title, artist, duration, source, release_year, language)
  └── BehavioralEmbedding (Phase 3)

Session
  ├── User
  ├── Intent (internal state, context, desired state, task)
  ├── ArcShape
  ├── PlannedArc (track sequence + planned trajectory)
  ├── ActualArc (track sequence + actual trajectory including nudges)
  ├── Signals[] (skips, replays, volume changes)
  ├── Duration (planned vs actual)
  └── ContainerRefs[] (which Grain/Line/Pull this belongs to)

Container
  ├── Type (Grain | Line | Pull)
  ├── User
  ├── AcousticSignature (5D centroid for Pull; snapshot for Grain/Line)
  ├── Members[] (Grains/Lines within a Pull)
  └── ShareArtifact (generated artifact URL)
```

### 15.5 Key APIs

| API | Purpose | Dependency risk |
|-----|---------|----------------|
| Spotify OAuth + Audio Features | Library analysis, coordinate extraction, playback | High — primary dependency. Mitigation: Web Audio API fallback for real-time. Long-term: own analysis pipeline. |
| Spotify Web Playback SDK | In-browser Spotify playback | High — same as above |
| Strava API | Activity import | Medium — replaceable with manual input |
| Apple HealthKit | Workout data | Medium — iOS only |
| Google Maps API | Route data for drives | Low — enhancement |
| Claude API | LLM intent parsing | Low — switchable |
| Web Audio API | Real-time audio analysis, non-Spotify sources | None — browser native |

### 15.6 Spotify Dependency Risk Mitigation

Spotify API dependency is the primary technical risk. Mitigation strategy:

1. **Phase 1:** Spotify Audio Features for library analysis. Accept dependency.
2. **Phase 2:** Web Audio API deployed for all non-Spotify sources. Reduces dependency for new content.
3. **Phase 3:** Own acoustic analysis pipeline (Essentia-based, with MERT Layer 2 embeddings fully in-house). Independent of Spotify for coordinate extraction. Spotify reduced to playback SDK only.
4. **Phase 4:** Own analysis pipeline covers library re-analysis. Spotify dependency limited to playback.

Long-term target: Spotify API used only for playback control. All acoustic intelligence is Woody's own.

**Spotify API terms change risk (S5 — not addressed above):**

The above addresses Spotify being *unavailable*. A distinct and more immediate risk is Spotify *changing terms* — specifically the Audio Features endpoint, which has been flagged as under review at Spotify. If this endpoint is restricted or deprecated:

- Phases 1 AND 2 break simultaneously (coordinate extraction for existing and new tracks both rely on it)
- The fallback plan is not graceful degradation — it is emergency acceleration

**Contingency triggers and responses:**

| Trigger | Response |
|---------|---------|
| Spotify restricts Audio Features API in Phase 1 | Activate emergency Phase: accelerate Essentia own-pipeline to immediate priority. Use cached coordinates for already-analyzed tracks. Supplement with MusicBrainz/AcousticBrainz dataset for coordinate bootstrapping on new tracks. |
| Spotify deprecates Audio Features with notice | Begin Phase 3 pipeline 1 phase early. No user-facing disruption if transition completes within notice period. |
| Audio Features returns degraded/inaccurate data | Flag all new coordinates as `low_confidence` in `coordinate_source` field. Suppress in arc generation. Surface engineering alert. |

**Kill condition:** If Spotify restricts Audio Features in Phase 1 or early Phase 2, before the own-pipeline is live, treat it as an immediate engineering emergency and activate own-pipeline ahead of schedule. The Phase 2 timeline compresses, not the product quality.

### 15.7 Graceful Degradation

Woody must degrade gracefully when external services are unavailable. Priority order for degradation:

| Service failure | Degradation behavior |
|----------------|---------------------|
| Spotify Audio Features API | Use cached coordinates for known tracks; Web Audio API analysis for unknown tracks; flag degraded accuracy |
| Spotify Web Playback SDK | Surface error + direct user to Spotify app; maintain arc visualization with manual "skip to next" |
| Spotify OAuth session expired | Re-auth prompt inline; do not lose session intent |
| LLM intent parsing (Claude API) | Fall back to keyword-matching rule system; lower accuracy, full functionality |
| Context signals (Strava, Health) | Default to time-of-day priors; no error shown |
| Wearable data | Omit from direction vector; no error shown |
| Vector DB | Serve from cache for recent sessions; degrade to library-only recs |

**Core principle:** the app should never fully break because one dependency is unavailable. Each capability should have an offline or degraded path. The user should not see API errors — they should see a slightly reduced experience with no broken UI.

**Minimum viable experience:** intent input → arc generation from cached data → playback. This must work even if Spotify Audio Features, Strava, Health, and LLM are all unavailable simultaneously.

### 15.8 Dynamic Weight Store (Phase 2 Component)

The weight store is a server-side per-user, per-context parameter table. It is a Phase 2 architectural component.

**Schema:**
```
UserWeightStore {
  user_id: UUID
  context_key: string           // e.g., "lock_in:deep_work", "discovery:late_evening"
  parameter_name: string        // e.g., "territory_bias_ratio", "familiar_novel_ratio"
  learned_value: float
  cold_start_value: float       // used when no learned value exists
  confidence: float             // how many observations back this value
  last_updated: datetime
  version: int                  // for rollback if a bad update degrades quality
}
```

Managed by the signal processor pipeline (Section 7.7). Read by arc generation engine at session start — O(1) lookup per user/context pair. The weight store is consulted before any fixed constant in the arc generation code. If a learned value exists with confidence > threshold, it takes priority.

### 15.9 Multi-Source Integration

| Source | Method | Phase |
|--------|--------|-------|
| Spotify | Audio Features API + Web Playback SDK | Phase 1 |
| YouTube | Web Audio API real-time analysis | Phase 2 |
| SoundCloud | Web Audio API real-time analysis | Phase 2 |
| Unified queue | Cross-source session arc with Web Audio for non-Spotify | Phase 2/3 |

---

## 16. Recommendation Quality & Confidence Scoring

### 16.1 Internal Confidence Score

Every recommendation carries an internal confidence score:

```
confidence = (acoustic_fit × 0.4) + (territory_relevance × 0.35) + (transition_coherence × 0.25)
```

Where:
- `acoustic_fit` = 1 - normalised_distance(candidate, acoustic_target)
- `territory_relevance` = overlap between candidate's acoustic region and user's territory density
- `transition_coherence` = 1 - normalised_distance(candidate, currently_playing_track)

### 16.2 Visual Confidence Tier

Three tiers, not numbers. Represented as a visual mark (specific design TBD in iconography session):
- **Tier 3:** Woody is confident — acoustically close, territory-aligned, smooth transition
- **Tier 2:** Woody recommends — good fit, minor caveats
- **Tier 1:** Woody suggests — acoustic proximity but some uncertainty

### 16.3 Woody Endorsed Mark

The hero mark: applied to top-confidence, top-territory-relevance recommendations. Not a badge with stars — a specific visual symbol that becomes a brand quality signal over time. Same visual DNA as the Woody logo. Appears on shared artifacts. "What's that mark?" becomes an acquisition question.

---

## 17. Business Model

### 17.1 Acquisition Strategy

**DJ Wedge (primary) — redesigned (C3):**

The previous version of this strategy assumed DJs would adopt the artifact workflow because of its aesthetic value. This is an unvalidated assumption. DJs already have limited time and existing workflow tools (Rekordbox, Serato, Mixcloud). Adding a new platform requires a compelling reason — not just a prettier artifact.

**Redesigned DJ acquisition strategy:**

**Step 1 — Zero-account artifact generation.** A DJ pastes their tracklist at `woody.io/set` and receives a full acoustic arc visualization immediately. No login. No friction. No platform commitment. They share it. This removes the adoption cost entirely for first contact.

**Step 2 — Diagnostic intelligence as the adoption hook.** The artifact is not just beautiful — it is *useful*. Specifically:
- **Acoustic gap detection:** the arc highlights transitions where energy/warmth distance is high — potential rough transitions the DJ may not have consciously noticed
- **Bridge suggestions:** "There's a gap between track 4 and track 5. These 3 tracks would smooth it" — suggestions based on acoustic coordinates
- This tells DJs something they cannot get anywhere else. It improves their craft. That is the retention mechanism.

**Step 3 — Account creation downstream.** After they share the artifact and want to track their own arc patterns over time, save sets, see territory evolution — that's when account creation makes sense. Not gated at first contact.

**The moat reframe:** The moat is not shareability — it is diagnostic intelligence. Shareability is the distribution vector. Craft improvement is the lock-in. DJs who improve their sets with Woody don't switch away — the data is their work history.

**Validated assumptions this design builds on:**
- DJs share sets publicly (validated — Mixcloud, Boiler Room, social media)
- DJs care about transition quality (validated — it is the core craft)
- DJs respond to tools that improve their craft (validated — Rekordbox/Serato adoption proves this)

**Validation gate before treating DJ wedge as primary GTM:** 3 out of 5 DJs contacted confirm they would use the acoustic gap detection + bridge suggestion workflow in their actual set preparation. If this gate is not met, treat DJ wedge as secondary and activate founder-led content as primary.

**Fallback if DJ wedge underperforms:**
1. Founder-led content: document the DJ/listening journey publicly, integrate Woody in content, build audience alongside product
2. Discord/Reddit community seeding: acoustic intelligence communities (last.fm, music production forums)
3. Direct listener outreach: intentional listener communities (Letterboxd users, music bloggers, audiophiles)

**Viral artifacts:** every shared arc artifact drives curiosity. The aesthetic quality and uniqueness of the Woody arc artifact is the marketing. Creator-native: the artifact uses the creator's visual identity where possible, Woody's credit is metadata only.

**Strava integration:** arc embedded in activity posts creates product-contextual marketing within an engaged fitness community.

### 17.2 Revenue Model (Phase 4)

**Pro tier:** targeting intentional listeners and power users

| Feature | Free | Pro |
|---------|------|-----|
| Sessions per month | Limited | Unlimited |
| Territory history | 90 days | Full history |
| Multi-source sync (YT + Spotify + SoundCloud) | Spotify only | All sources |
| Artifact export | Basic | High-res + custom |
| Advanced analytics | No | Yes |
| Lock-in session history and learning | No | Yes |

**DJ Pro tier:**

| Feature | Free | DJ Pro |
|---------|------|--------|
| Set logging | Unlimited | Unlimited |
| Set analytics | Basic | Advanced (pattern over time, audience acoustic matching) |
| Bridge suggestions | Limited | Unlimited |
| Export formats | Standard | Rekordbox, Serato, custom |
| Multi-venue arc tracking | No | Yes |

**API Access (Phase 4+):** acoustic intelligence layer licensed to fitness platforms, meditation apps, game studios, label analytics teams. The B2B angle becomes significant once the acoustic analysis quality is demonstrably best-in-class.

### 17.3 Moat Progression

| Phase | Primary Moat |
|-------|------------|
| 0–6 months | Acoustic intelligence quality |
| 6–18 months | Personal territory data (irreplaceable acoustic history) |
| 18–36 months | Social graph (acoustic trust network) |
| 36+ months | Network effects (more territory data → better recs → more users → more data) |

Feature moats erode. Data moats compound. Social graph moats need critical mass. Build in that order.

---

## 18. Roadmap & Build Sequence

> **Context (C2):** This is a solo founder project. Speed is not the primary constraint — data, listeners, and validation are. Phase 1 is split into 1a and 1b to reflect what can actually be built alone before requiring real users and real behavioral data. Scope per phase is sized for one person with AI tooling.

### Phase 1a — Founder Validation (Weeks 1–6)

Build the minimal system that the founder can personally validate. Scope: get to 50 sessions played by the founder as user 0, with skip rate measured.

- Spotify OAuth + library import
- Acoustic coordinate extraction (5D bootstrap formulas + Spotify Audio Features)
- Postgres + pgvector HNSW index setup, track coordinate storage
- Hard-coded territory bias + basic HNSW candidate selection
- Basic intent parser (free text → 5D target via LLM, V1)
- Session arc generation: beam search V1 (2-dimensional: target distance + transition coherence)
- Now Playing screen: acoustic field renderer + track info overlay + arc horizon line
- Basic intent input screen (free text + chips)
- Acoustic Hold / Soft Pause (AH01–AH04)
- Grain save (one-tap session capture)

**Exit criteria (quality-gated, not feature-gated):** Founder (user 0) has completed ≥50 sessions. Median uninterrupted session time ≥45 minutes across those sessions. Skip rate <4 per hour. Engine quality is validated empirically by the person building it before anyone else sees it.

### Phase 1b — Calibration + Arc Quality (Weeks 7–16)

Build the components that require data and iteration: calibration model, improved arc generation, honest cold start. Still solo, no public release.

- Anchor corpus V1: 200 tracks, founder-rated pairwise (Bradley-Terry model)
- DistilBERT calibration model (Essentia features → 5D), trained on anchor corpus
- `coordinate_source` migration: mark existing coordinates as `bootstrap`, recalculate with calibrated model
- Beam search arc generation V2: full cost function (α/β/γ/δ weights, session shape, novelty penalty)
- Phase 1b exit: validate 3 arc shapes (plateau, journey, single apex) with measurably different skip patterns
- Psychologically rich conversation cold start (Section 23.4) — replaces the current onboarding
- Basic territory visualization (constellation view, internal only)

**MERT fine-tuning is Phase 2 (not Phase 1b):** MERT requires the anchor corpus to exist first (it does by Phase 1b end) AND requires non-founder users responding to probe behavioral signals. Cannot be trained in isolation.

**Bayesian probe cold start is Phase 2:** requires users responding to probes. In Phase 1, founder is user 0 — no cold start testing is possible with one user. Build the framework, validate with first external beta users.

**Exit criteria:** Calibration model measurably reduces distance between coordinate-derived session tone and the founder's intended tone (internal evaluation). 3 arc shapes each produce statistically distinct skip rate patterns across 20+ sessions each.

### Phase 2 — Session Experience + External Beta (3–6 months)

- MERT fine-tuning (anchor corpus now exists; Phase 1b output)
- Bayesian acoustic probe cold start (requires real users; first external beta)
- Full intent input (tripartite + lock-in + shape selection)
- Lock-in sessions with Baseline Rise arc
- Implicit signal capture pipeline (Section 7.7 full schema)
- Dynamic weight store V1 (Section 7.8b)
- Container browser (Grain / Line / Pull)
- Territory / Constellation visualization (public-facing)
- Basic shareable artifact generation
- Strava integration (activity import + arc attachment)
- DJ mode V1: set logging + arc visualization + acoustic gap detection
- Zero-account artifact generation (paste tracklist → arc, no login required)
- Multi-source (YouTube + SoundCloud via Web Audio API)
- Context signal pipeline (time, device, activity)
- DJ wedge GTM activation (validation gate: 3/5 DJs confirm artifact useful in actual workflow)

**Exit criteria:** Full session experience from intent → arc → listening → save → artifact. DJ set upload works. Strava arc attachment works. Artifacts are shareable. At least 3 DJs have confirmed the artifact is useful to them. Beta cohort skip rate below Phase 1 exit threshold.

### Phase 3 — Intelligence + Social (6–12 months)

- Transition coherence ML (trained on skip signal data accumulated in Phase 2)
- Behavioral song embeddings (what tracks do psychologically)
- ML arc shape learning per user
- Mahalanobis distance function (replaces Phase 1 Euclidean)
- Basic social layer: arc sharing feed, territory overlap discovery
- Community architecture (topic-organized, Reddit model)
- Rediscovery mode (surface old high-resonance tracks)
- Own acoustic analysis pipeline V1 (Essentia-based — reduces Spotify Audio Features dependency)
- On-device personal model V1 (Phi-3-mini INT4, RL-initialized from population prior)
- Pro tier launch

**Exit criteria:** Social layer is alive with DJ content. Transition coherence ML measurably reduces skip rate vs Phase 2. Community has organic activity. At least one Pro tier user paying.

### Phase 4 — Moat Deepening (12–24 months)

- Own acoustic analysis pipeline fully replacing Spotify Audio Features (HNSW search moves to Layer 2)
- B2B API access launch
- DJ Pro tier
- Advanced analytics (territory evolution, acoustic identity reports)
- Network effects instrumentation
- Full federated learning (if scale justifies infrastructure — see SHELVED.md)

---

## 19. What Not to Build (Explicitly Rejected Decisions)

| Feature | Reason | Status |
|---------|--------|--------|
| Streaming / licensing | Not a streaming service | Rejected permanently |
| Star ratings or reviews | Too performative; arc sharing is the mechanism | Rejected permanently |
| Influence/follower model | Following ≠ promotion; artists appear as listeners | Rejected permanently |
| Gamified reputation scores | Performative optimization risk | Rejected — revisit after culture is set |
| Spatial zoom navigation | Too much cognitive overhead; gimmick not UX | Rejected permanently |
| Tab-based navigation | Too generic; doesn't reflect the product | Rejected permanently |
| Native app (Phase 1) | Web first; don't split focus | Deferred to Phase 3+ |
| Light mode | Always dark theme | Rejected permanently |
| Album art as Now Playing hero | Acoustic field is the hero | Rejected permanently |
| Empty social features | Social is invisible until there's something to show | Architectural rule |
| Listener/Creator setup split | One app; creator tools surface from behavior | Rejected permanently |

---

## 20. Open Decisions

Items that need resolution before build — do not close without a dedicated session.

| Decision | Priority | Blocks |
|---------|---------|--------|
| Container names — Grain/Line/Pull are working names, not final | Medium | Copy, onboarding, brand strings |
| Iconography — hero symbol, logo, container icons, acoustic dimension marks | High | Brand identity, visual language completeness |
| Full IA / screen map — detailed screen count, transitions, information hierarchy | High | Full UI build |
| Pixel/custom art for artifacts — on the table, not decided | Low | Artifact design |
| Illustrated form library — 8–12 fluid rounded shapes | Medium | Design system implementation |
| Near-dark surface lift value — cards/panels above void | Low | Design system |
| Behavioral embedding training data approach — how to bootstrap | High | Phase 3 LI03 |
| Pull pattern detection thresholds — what constitutes a "recurring pattern" | Medium | CS implementation |
| **Non-Western calibration data source** — CompMusic, AcousticBrainz, or labeled data acquisition strategy. Current 5D model systematically mis-scores non-Western music. Must resolve before Phase 2 or Woody cannot serve global listeners accurately. | **High** | Phase 2 engine quality, global market viability |
| **Additional acoustic dimensions** — Lyrical Centrality, Rhythmic Complexity, Temporal Density, Cultural Gravity are candidate extensions (see FEATURES.md Section 23). Embedding space must be designed with extensibility from Phase 1 so dimension slots can be added without schema breaks. | **High** | Phase 2 embedding architecture, global music |
| **Language distribution as territory metadata** — user's listening language mix (% English, Hindi, Portuguese, etc.) is a first-class territory signal, not a dimension. How is it stored, surfaced, and used for routing? | **Medium** | Territory model, Phase 2 personalization |
| **Phase 1 exit quality threshold** — "plays coherently" needs a numerical definition before building Phase 1 (see roadmap M4 fix) | **High** | Phase 1 build/done criteria |

---

## 21. Key Files Reference

| File | Purpose |
|------|---------|
| `VISUAL_LANGUAGE.md` | Closed visual language decisions — canonical for all UI |
| `PSYCHOLOGY.md` | Music psychology synthesis — canonical for engine |
| `FEATURES.md` | Full feature registry (22+ sections) — check before building |
| `DECISIONS.md` | Closed vs open decisions SSOT |
| `BUILD_BRIEF.md` | Engineering-focused build briefing for fresh context |
| `CLAUDE.md` | Workspace context and persistent behavior rules |
| `STRATEGY.md` | Product vision and strategic decisions |

---

## 22. Success Metrics & KPIs

### 22.1 North Star Metric

**Uninterrupted session minutes per user per week.** This captures both engagement and product quality simultaneously — a session that works acoustically is a session nobody interrupts.

This is deliberately different from "streams" or "tracks played." Woody optimizes for sustained listening, not consumption volume.

### 22.2 Core Product Health Metrics

| Metric | Definition | Target (Phase 1 exit) | Target (Phase 2 exit) |
|--------|-----------|----------------------|----------------------|
| Uninterrupted session time | Minutes of continuous listening without user skip | >45 min median session | >60 min median session |
| Skip rate | Skips per hour of listening | <4 skips/hr | <2.5 skips/hr |
| Time to first skip | How far into a session the first skip occurs | >8 min median | >15 min median |
| Session completion rate | Actual duration vs intended duration | >65% | >75% |
| Soft pause rate | % of sessions using soft pause rather than hard stop | >20% by Phase 2 | >40% |
| Return session rate | % of users with 2+ sessions in same week | >45% at D7 | >60% at D14 |

### 22.3 Acoustic Quality Metrics

| Metric | Definition | Why it matters |
|--------|-----------|----------------|
| Transition coherence score | Average acoustic distance between consecutive tracks served | Direct proxy for skip risk |
| Intent-to-arc accuracy | Distance between user's stated intent and generated arc's actual coordinates | Validates LLM parsing quality |
| Territory fit rate | % of recommended tracks landing within user's established territory | Measures personalization effectiveness |
| Novel track acceptance rate | % of non-territory tracks that complete without skip | Measures how well novelty is introduced |
| Frisson detection rate | % of frisson-designed moments that generate engagement signal (replay, volume up) | Validates frisson placement algorithm |

### 22.4 Business Metrics

| Metric | Definition |
|--------|-----------|
| DJ onboarding rate | DJs who upload a set and generate a shareable artifact |
| Artifact share rate | % of completed sessions that produce a shared artifact |
| Artifact-to-signup conversion | New users who signed up after seeing a shared artifact |
| Strava arc attach rate | % of Strava-connected sessions that auto-attach the acoustic arc |
| Pro conversion rate | Free-to-Pro conversion at 90 days |

### 22.5 What Not to Measure

- Tracks streamed (wrong unit — optimizes for volume not experience)
- DAU as a vanity metric without session quality context
- Follower/following counts (not a social growth product)
- "Playlist saves" (not a playlist product)
- Genre distribution (irrelevant — Woody doesn't use genre)

---

## 23. New User / Cold Start Experience

### 23.1 The Cold Start Problem

New users have no acoustic territory, no behavioral history, no personalization data. The first session must be good enough to create a second session. The engine has nothing personal to work with.

**The cold start is actually a constraint relaxation, not a failure.** Without personal territory data, the arc falls back to population priors. But the primary goal is to gather real acoustic preference data as fast as possible — in the minimum number of observations, with the minimum friction.

### 23.2 Cold Start Strategy — Primary: Bayesian Acoustic Probe

The best cold start is not onboarding questions or mining Spotify history. It is observed behavioral response to carefully selected acoustic probes.

**Why Spotify history is not the primary signal:** Spotify history encodes Spotify's collaborative filtering bias as much as genuine taste. What Spotify chose to surface to you is mixed with what you actually preferred. It is a useful supplement, not a reliable ground truth.

**The Bayesian probe approach:**

Six to eight tracks are presented to the new user in the first session, selected to span the 5D acoustic space as efficiently as possible. The user's behavioral response to each track (skip timing, replay, completion, volume adjustment) updates a Gaussian process prior over taste space. Each subsequent probe is chosen by maximum expected information gain — the point in acoustic space that would most reduce uncertainty about where this user's territory is. After 6 observations, the model has converged to a territory estimate comparable in quality to 10–15 standard sessions of unstructured listening.

**Probe corpus specification (S2):**

The probe corpus is 8 tracks. Initial selection by the founder. Selection criteria:
- Each track must occupy a distinct, acoustically unambiguous region of 5D space — no tracks that score ambiguously across multiple quadrants (these produce low-information-gain responses)
- Tracks must span the extremes: at least one high-energy/high-density, one high-warmth/low-energy/high-organicity, one high-sacred/low-density, one low-everything, one high-everything
- Globally recognizable or independently interesting as standalone listens — users shouldn't feel like they're listening to tuning signals
- Genre-diverse to avoid cultural clustering (probes should not all be Western pop)
- Duration: 20–30 seconds per probe sufficient for behavioral response; full track available if user doesn't skip

Probe corpus is maintained and updated as the coordinate model calibrates. When anchor corpus labeling expands to non-Western music, probe set should be updated to include culturally diverse probes. Founder-curated initially; transition to information-theoretically optimized selection when sufficient training data exists to compute expected information gain per probe.

**Probe selection criteria:**
- Probes must span the 5D space without redundancy (information-theoretic coverage)
- Each probe must be listenable and interesting on its own — not acoustic test tones
- Probes are pre-curated to be genre-diverse but acoustically targeted (e.g., one probe targets high-energy/high-density; another targets high-warmth/low-energy/high-organicity)
- The probe sequence is the first session — it IS music, not a survey

**Time to useful territory estimate:** 90 seconds to 3 minutes (6 tracks × 10–20 seconds behavioral observation each).

**Phase 1 (0–5 sessions): Population-based territory with rapid personal calibration**

- Intent is parsed to acoustic target as normal
- Territory biasing weight starts 0% user / 100% population prior
- Bayesian probe responses bootstrap personal territory from session 1
- First 3–5 skips and replays weighted 3× for initial model bootstrapping — most information-dense signals in user history
- Spotify history (top_tracks, recently_played, playlists) supplements probe data but does not replace it

**Phase 2 (5–20 sessions): Hybrid territory**

- Personal territory begins accumulating
- Biasing shifts from population to personal at a rate of approximately 5% per session
- Surface territory visualization to the user at ~10 sessions: "This is your acoustic shape so far"

**Phase 3 (20+ sessions): Established territory**

- Full personal territory biasing active
- Population priors still used for intents far outside established territory (frontier territory)

### 23.3 Onboarding Flow Detail

**Step 1 — Spotify connect:**
- OAuth prompt with explanation of what data is accessed (library, audio features) and why
- Estimated library analysis time shown (30 seconds for most users)

**Step 2 — Library analysis:**
- Background fetch of Audio Features for all saved tracks + top playlists
- Animated acoustic field renders in real-time as coordinates populate — the field coming alive IS the onboarding visualization
- First territory shape emerges from library data before the user has listened to anything on Woody

**Step 3 — Territory reveal:**
- "Here is the shape of your musical taste"
- Territory constellation displayed — user's acoustic distribution from their existing library
- Moment of recognition: "That is actually me"
- Brief orientation: what the axes mean (energy, warmth — not named as dimensions yet, shown as directions)

**Step 4 — First intent:**
- "What do you want to hear right now?"
- Pre-populated suggestion based on time of day + territory centroid
- Fast path: one tap on the suggestion → session starts
- Full path: intent input screen (voice or text or chips)

**Step 5 — First session begins:**
- Tutorial touchpoints inline during first session only:
  - Soft pause (shown at ~5 minutes)
  - Grain save (shown at first track the user volume-up engages)
  - Nudge pad (shown at ~15 minutes)
  - No tutorial if user has already interacted with these

**Time to first session target:** < 3 minutes from install to music playing.

### 23.4 Fallback: Psychologically Rich Conversation (No Spotify Data)

When the user doesn't connect Spotify or has truly sparse data, the fallback is a brief conversation — not an artist list, not a genre picker, not a questionnaire.

**The rule:** never ask about artists or genres. Ask about the user's *relationship to sound*.

**Questions that generate acoustic signal:**

- "When do you most need music?" — answers reveal use context (studying, driving, emotional regulation, movement). Each context maps to acoustic coordinates.
- "What's a song that sounds like how you feel right now?" — reveals current acoustic state, not social identity (people don't perform taste when answering this honestly).
- "What's the last song you turned off because it was wrong for the moment?" — the *negative space* of preference is often more informative than the positive. Exclusions map directly to dimension avoidance.
- "Where are you when music matters most to you?" — physical context (gym, commute, late-night desk) reveals acoustic preference patterns.

**Format:** 2–3 questions maximum. Not sequential form fields — conversational. Each answer is parsed by the intent BERT model to derive acoustic coordinate priors. The conversation should feel like it's about the person, not about their data.

**Artist mention fallback:** if the user volunteers artist names, accept them and derive acoustic coordinates from those artists' aggregate track coordinates. But never prompt for them.

### 23.5 Playlist Import as Cold Start Accelerator (A3)

Users with rich Spotify playlist libraries have already organized their music intentionally. Playlists have acoustic meaning beyond individual tracks: a user who created a "Sunday morning" playlist has expressed an intent cluster, not just a track list. This is high-signal data for cold start.

**Data accessible via Spotify API at onboarding:**
- `top_tracks` (short/medium/long term) — most-listened-to tracks
- `recently_played` — last 50 plays
- `saved_tracks` (Liked Songs)
- User-created playlists — names + track lists

**Apple Music:** MusicKit.js exposes library + playlists on iOS/macOS (requires explicit user permission).

**Last.fm:** historical scrobbles via Last.fm API (user provides username, no auth required for public data).

**What playlist import adds to cold start:**
- Playlist names are acoustic intent signals: "deep work", "pre-run", "late night" parse directly to acoustic contexts via the intent BERT model
- Playlist track composition reveals consistent acoustic preferences per context (the playlist IS a Pull, before the user explicitly names it)
- User-created organizational structure reveals playlist-level acoustic preference that `top_tracks` alone doesn't show

**Phase 1 implementation:** Spotify playlist import is part of the standard OAuth library analysis (already planned). The additional step is: parse playlist *names* through the intent BERT model to seed Pull suggestions at onboarding ("You have a playlist called 'Focus' — want to create a Focus Pull?").

**Phase 2:** Cross-app transfer (Spotify → Apple Music track matching via ISRC). This is scope creep unless it specifically serves territory building. Only implement if meaningful cross-platform listener cohort exists. See SHELVED.md for nuance.

### 23.6 No-Library Cold Start (Minimal Data)

Users with truly minimal data (no Spotify, no probe responses, no conversation):

- Present acoustic dimension preview sliders ("Set your starting point") — user manually sets 2–3 coordinates as a seed
- Avoid questionnaires. One "what do you want to feel right now?" with visual options is acceptable. A 10-question taste survey is not.
- Time to first session target: < 3 minutes regardless of cold start path.

---

## 24. Privacy & Data

### 24.1 Data Philosophy

Woody's model is acoustic intelligence, not surveillance. The distinction matters.

**Data Woody needs:** acoustic coordinates, session behavioral signals (skip, replay, volume, duration), context signals the user actively permits.

**Data Woody does not need and does not collect:** specific track names for social exposure, listening history for advertising, location beyond rough time zone, contact book, browsing history.

**The acoustic territory is the user's data:** it is derived from their listening and belongs to them. Users can export it, view it, and delete it at any time.

### 24.2 Data Collected

| Data type | Purpose | Retention |
|-----------|---------|---------|
| Spotify OAuth token | Playback + audio features access | Until user disconnects |
| Acoustic coordinates (per track) | Recommendation engine | Indefinite (public acoustic properties, not personal) |
| Session data (arc, duration, intent) | Territory building, personalization | User-controlled; default indefinite |
| Skip/replay/volume signals | Transition coherence model training | Anonymized after 12 months |
| Context signals (time, device state) | Direction vector derivation | Session-level; not stored beyond session |
| Wearable/health data (if connected) | Activity arc, direction vector | Session-level only; not retained |
| Strava activity data | Activity arc generation | Session-level only; not stored |
| Calendar context (if connected) | Direction vector | Session-level only |

### 24.3 Data Not Collected

- Full listening history beyond Woody sessions (Spotify history not scraped)
- Personal biographical data (age, gender, location)
- Contact information beyond email (for account)
- Advertising identifiers
- Social graph beyond explicit Woody social connections

### 24.4 User Data Rights

- **Export:** full acoustic territory export as JSON at any time
- **Delete:** full account deletion removes all personal data; track acoustic coordinates (non-personal) are retained in the track database
- **Exclude sessions:** retroactive exclusion of any session from territory contribution (within 24 hours)
- **Incognito:** sessions played without territory contribution (see Section 6.1b)
- **Social visibility:** acoustic territory is private by default; sharing is always explicit and opt-in

### 24.5 Spotify Data Constraints

Spotify API terms prohibit: storing audio features data beyond what is needed for the immediate use case, using listening data for advertising, sharing individual user's Spotify data with third parties.

Woody's architecture is compliant by design: acoustic coordinates derived from audio features are stored as Woody's own computed properties, not as raw Spotify data. Behavioral signals are Woody's own product signals, not Spotify's.

---

## 25. Competitive Landscape

### 25.1 The Field

| Competitor | What they do | Woody's differentiator |
|-----------|-------------|----------------------|
| **Spotify** | Streaming + recommendation + social (experimental) | Woody is not competing with Spotify — it layers on top. Spotify's strength (catalog, playback) is Woody's infrastructure. |
| **Apple Music** | Streaming + editorial curation | Same dynamic as Spotify. Woody layers on top. |
| **Last.fm** | Scrobbling + listening history + community | Last.fm tracks *what* you listen to. Woody tracks *how* your listening feels and *where* it takes you. Last.fm is catalog-level; Woody is acoustic-level. |
| **Letterboxd** | Film taste + social + journal | Direct inspiration, not a competitor. Woody is "Letterboxd for music listening sessions" — the social object is the journey, not the review. |
| **Endel** | Functional music + sound scenes for focus, sleep | Endel creates music procedurally; Woody curates from existing music. Endel is about environment; Woody is about discovery and identity. |
| **Brain.fm** | Functional music for focus | Same as Endel — procedural, functional, not discovery or identity. |
| **SoundCloud** | Music distribution + discovery (niche) | Woody is not a distribution platform. SoundCloud's discovery is artist-level; Woody's is acoustic-level. |
| **Mixcloud** | DJ set sharing + listening | Woody is upstream of Mixcloud — the arc visualization is the enrichment of what DJs already post there. Woody feeds Mixcloud, not competes. |

### 25.2 Why None of These Are Substitutes

Spotify personalizes within genre and behavioral history. It cannot respond to acoustic intent expressed in natural language. It has no session arc concept. It has no acoustic field visualization. It optimizes for streams, not sustained listening.

Last.fm requires explicit review-like engagement. It surfaces historical data but cannot prescribe future sessions.

Endel and Brain.fm generate music you cannot escape from — there is no discovery, no territory, no identity. They are acoustic utilities, not products.

No existing product surfaces the *acoustic shape* of a listening session as a beautiful, shareable artifact. The arc artifact is uncontested territory.

### 25.3 Kill Condition

**If Spotify ships:** a genuine natural-language-to-session-arc interface, with acoustic arc visualization, acoustic territory as identity, and DJ-quality set analytics — the differentiation story weakens significantly. This is the scenario to watch. Estimated time before Spotify could ship this seriously: 18–24 months if they prioritize it.

**The moat that persists:** personal acoustic territory data is irreplaceable once accumulated. Even if Spotify copies the interface, users who have built a Woody territory over 12–24 months have an acoustic history that cannot be replicated. This is the lock-in.

---

## 26. Rediscovery Mode

### 26.1 The Problem

Every user has a graveyard of music they loved and then forgot. Tracks that meant something at a specific time, in a specific state. The standard recommendation engine doesn't surface these — it surfaces new and popular, not personal and dormant.

Rediscovery is the highest-warmth, highest-nostalgia-potential use case in the product. It is emotionally powerful and completely underserved.

### 26.2 Triggering Conditions

Rediscovery mode triggers when:
- User explicitly requests it ("I want to hear something I used to love")
- Long gap in territory — acoustic regions the user hasn't visited in 6+ months
- Time-of-day pattern match: rediscovery is most psychologically effective in late evening, low-energy, high-warmth acoustic states
- Reminiscence bump context: tracks from when the user was 15–25 years old (derivable from account creation date and track release year matching that window)

### 26.3 Engine Behavior

**Rediscovery arc shape:** not Baseline Rise. Not Plateau. A gradual acoustic return — start in current territory, drift toward dormant acoustic regions, arrive at tracks from the dormant era.

**Track selection criteria:**
- Track in user's Spotify library OR high-listen history (scraped from listening history if available)
- Track NOT played in the last 6+ months on Woody
- Acoustic coordinates in a dormant region of the user's territory
- Reminiscence bump scoring: prefer tracks from user's formative years window

**Nostalgia gating (see Section 8.8):** high-nostalgia-potential tracks are suppressed in all other session types. Rediscovery mode is the exclusive context where they are surfaced. This makes the rediscovery session distinctively different — the user understands intuitively that this is "old me" listening, not everyday listening.

### 26.4 UX

**Entry:**
- Home screen contextual suggestion at appropriate time/state: "Visit somewhere you haven't been in a while?"
- Intent input: "take me somewhere I've been before"
- Pull type: a recurring rediscovery Pull — "The Archive" or any user-named variant

**During session:**
- Track info overlay gets subtle warm amber tinting (the acoustic field warmth reflected in the UI)
- No new recommendations — purely from history
- Soft cue when a track has high autobiographical memory potential: no text, just a longer crossfade into it

**After session:**
- Post-session flow shows acoustic territory comparison: "This is where you were. This is where you went back."
- Option to create an Archive Line: a named rediscovery journey

---

## 27. Acoustic Explanation Layer

### 27.1 The Principle

Woody explains why something sounds the way it *feels* — not what genre it is, not who made it, not what people think of it. The acoustic explanation layer is Woody's version of liner notes: the acoustic character of a track or session, in human language.

This is not metadata. It is translation. "This track has high organicity and low density — it sounds like breathing, like space. That's why it feels restorative."

### 27.2 What Gets Explained

**Per track:**
- Acoustic character description: 1–2 sentences generated from acoustic coordinates. "Dense, electric, synthetic — high energy, low warmth. The kind of thing that makes a room sharper."
- Where it sits in the user's territory: "This is at the edge of your usual acoustic space — slightly more intense than what you typically listen to."
- Why it's here in this session: "This track appears here because it bridges between the warmth you started with and the sharpness you're building toward."

**Per session arc:**
- Arc explanation: what the session was trying to do acoustically. "This arc started warm and minimal, peaked at high energy and density around 55 minutes, then descended gradually. Classic single-apex shape — designed for building, peaking, and resolving."
- Dimensions over time: mini sparkline for each of the 5 dimensions across the session

**Per acoustic dimension (educational, on-demand):**
- What is warmth? — accessible explanation in human terms, with 3 example tracks from the user's own territory to anchor it
- Expandable in Territory and Session Arc views

### 27.3 UX Integration

- **Track info overlay (Now Playing):** tap to expand. Shows 1–2 sentence acoustic description + dimension bars.
- **Session Arc view:** tap any track marker to see why that track is there.
- **Territory / Constellation view:** tap any cluster to see its acoustic character described.
- **Discovery:** "Why did Woody suggest this?" — one-tap explanation from Now Playing overlay.

### 27.4 Tone

Not clinical. Not genre-speak. The acoustic explanation layer uses the same language the user would use to describe music to a friend — sensory, evocative, grounded in what it feels like.

"Warm, textured, a little melancholic. High organicity — real instruments, room sound." Not: "Organicity: 0.78."

The numbers are always available for users who want them. The default is human language.

---

## 28. Guided Music Listening / Intentional Precursor Manipulation

### 28.1 The Concept

Music is a psychological tool. Not just for enjoyment — for deliberate state manipulation. The user arrives at a desired cognitive or emotional state *by listening*, not just with listening as accompaniment.

This is different from Lock-In mode. Lock-In is "I'm already working, help me stay there." Guided Listening is "I need to get somewhere before I work (or before I sleep, or before I have a difficult conversation). Take me there."

Music is an unusually powerful attentional and neurological precursor — it can shift arousal, affect, and cognitive readiness faster than almost any other accessible tool. Guided Music Listening makes this explicit and puts it in the user's hands intentionally.

### 28.2 The Use Cases

**Pre-state priming (before an activity):**
- Pre-meeting: shifting from scattered post-commute state to focused, present state before a high-stakes call
- Pre-creative: moving from analytical to associative thinking mode before design or writing work
- Pre-performance: athletic or artistic readiness arc (related to pre-hype, but more cognitively targeted)
- Pre-sleep: decompression from high arousal to sleep-ready state (distinct from generic wind-down)
- Pre-social: moving from isolated/withdrawn state to open, warm, socially present state

**Emotional processing (getting through something):**
- Grief processing: acoustic arc designed to move through grief, not suppress it. Starts congruent (matches the emotional state), moves gradually toward resolution. Not cheerful — resolved.
- Anxiety discharge: high-arousal acoustic match that provides physiological arousal outlet before descending. Not calm music for anxious people — that creates internal incongruence. Arousal match → discharge → descent.
- Frustration processing: similar arc logic to anxiety discharge

**Recovery (after something demanding):**
- Post-exertion: physiological recovery arc (already covered in Activity Integration — this extends it cognitively)
- Post-cognitive-load: attention restoration (see Restoration arc shape in Section 7.3 / Section 8)
- Post-social: decompression for introverts after sustained social engagement

### 28.3 Acoustic Arc Design for Guided Listening

Each guided listening scenario has a prescribed arc shape grounded in psychological mechanisms:

| Scenario | Arc shape | Mechanism |
|----------|----------|-----------|
| Pre-meeting focus | Baseline Rise → Plateau | Dopamine baseline rise to focused arousal |
| Pre-creative work | Wave (moderate energy, high warmth) → Plateau | Associative network activation, reduced executive suppression |
| Pre-performance (physical) | Baseline Rise → Single apex | Progressive arousal priming, psychophysiological readiness |
| Pre-sleep | Inverse (high → very low energy, high organicity) | Physiological arousal reduction, parasympathetic activation |
| Grief processing | Congruent start → slow journey → resolved | Discharge strategy — match before moving |
| Anxiety discharge | Match (high arousal) → rapid descent | Arousal outlet before downregulation |
| Attention restoration | Restoration arc (mid-energy wave, high organicity) | Involuntary attention engagement, directed attention recovery |
| Post-social recovery | Inverse (warm, personal, low density) | Introvert recharge — alone-with-music as restorative |

### 28.4 UX Integration

**Intent input pathway:**
- Guided Listening is available as a named mode in Lock-In toggle area: "I need to get somewhere before I start"
- Three questions: "Where are you now?" / "Where do you need to be?" / "What for?"
- System maps these to an arc shape and acoustic target automatically
- User sees the acoustic journey preview: "We'll take you from here to there over the next [duration]"

**Scenario shortcuts (quick access from Home):**
- "Get me focused" → pre-work Baseline Rise arc
- "Help me wind down" → pre-sleep Inverse arc  
- "I need to process something" → grief/anxiety arc variants
- "Reset my brain" → Restoration arc
- These are not the only options — they are fast-access for the most common scenarios

**Mid-session:** the arc is designed. No user intervention needed. Music takes responsibility for the transition. Nudge pad available but not prompted.

**After session:** post-session flow shows where you started and where you ended — the acoustic journey as evidence of change. "You went from here to here."

### 28.5 Relationship to Lock-In Mode

| | Lock-In | Guided Listening |
|---|---------|-----------------|
| **When** | During task | Before task (or before any state-dependent activity) |
| **Goal** | Sustain an acoustic state | Transition to a desired state |
| **Arc shape** | Plateau (or Baseline Rise to Plateau) | Intentional arc toward target |
| **User attention** | Music in background | Music as the activity for the session duration |
| **After** | Continue working | Arrive at desired state, transition to whatever's next |

They are complementary: Guided Listening gets you to the state → Lock-In keeps you in it.

---

## 29. Landing Page / Marketing Website

### 29.1 Function

The landing page has one job: convert curious visitors (from shared artifacts, Strava posts, Mixcloud embeds, word of mouth) into sign-ups. It is not a product tour. It is not a feature list. It is a demonstration.

### 29.2 Core Experience

**The hero is the acoustic field.** The landing page opens with the acoustic field renderer running live — not a screenshot, not a video. A live, breathing geometric field with pixelated figures. The visitor immediately sees what Woody *is* without reading anything.

**Below the fold:**
- One sentence that explains what they're looking at: "Your music, visualized as what it actually is — not genre labels, not mood tags."
- Three product truths, not features:
  1. "Music matches your moment, not your history."
  2. "Your acoustic shape is yours — nobody else's constellation looks like this."
  3. "Sessions, not tracks. Journeys, not playlists."
- One shareable artifact example: an arc from a real DJ set (with permission), showing the visual quality and the arc annotation style

**Sign-up:**
- Spotify connect button — that's it. No email form for primary conversion.
- Below: email waitlist for users without Spotify Premium (Spotify Web Playback SDK requires Premium)

### 29.3 DJ Landing Path

DJs arrive via a different entry — not the main landing page but a specific DJ artifact embed or Mixcloud link. Their landing path:

- See the set arc visualization (the artifact that made them click)
- "This is what your sets look like" — one sentence
- "Upload your first set" — CTA goes directly to DJ set logging
- No general product tour — they are already using the product as of first action

### 29.4 Visual Language on Landing

Landing page IS the visual language specification in action:
- Void background (#0a0a0f)
- Live acoustic field (geometric + fluid forms + pixelated figures)
- Typography: Syne for headings, Epilogue for body
- Grain overlay
- No glassmorphism, no neon, no generic app screenshots

The landing page is a proof-of-brand, not a marketing asset.

---

## 30. Community Implementation Roadmap

### 30.1 The Sequencing Problem

Community features fail when built before community exists. Empty forums are worse than no forums. The community implementation follows a strict sequencing rule: every community feature unlocks only when the community is already doing the thing the feature formalizes.

### 30.2 Phase 0: Pre-Community (Now — Phase 1)

No community features. Single-player product only.

**What enables future community:**
- DJ artifact sharing (creating external content)
- Shareable arc artifacts (creating content that travels)
- Acoustic territory (creating an identity people will eventually show each other)

**What is NOT built in Phase 0:**
- No feed
- No comments
- No following
- No public profiles
- No leaderboards

### 30.3 Phase 1 Community Seed: DJ Layer (Phase 2)

DJs are the seed community. They are recruited before general users. Full product access, no cost.

**What DJs get:**
- DJ mode with set logging and arc visualization (already in Phase 1 build)
- Shareable set artifact (already planned)
- Early access to new features in exchange for being the content creators

**What DJs generate:**
- Acoustic arc artifacts posted to Mixcloud, Instagram, SoundCloud
- "What is that visualization?" — the artifact creates organic discovery
- Their audience (music enthusiasts) arrives at Woody curious, not cold

**DJ recruitment:** direct outreach to DJs with Boiler Room/Mixcloud presence. Target 50–100 DJs before public launch. Their combined audience reach is the launch audience.

### 30.4 Phase 2 Community Emergence: Territory Overlaps (Phase 3)

Community features unlock once users have territory data.

**First community feature:** territory overlap discovery
- "You and this person share acoustic territory — you arrived via completely different routes"
- No follow required. No social graph to build. Just an observation.
- If both users have public territory: mutual notification

**Second community feature:** acoustic resonance threads
- Topic threads organized around acoustic experiences, not artists or genres
- "High-sacred low-energy music — what lives here for you?"
- No reviews, no ratings — share arcs, not opinions

**Third community feature:** public arc sharing with discovery
- Share a Line with a public audience
- Discoverable via acoustic coordinates — "sessions with similar arc shape to this one"
- NOT a chronological feed — discovery is acoustic, not temporal

### 30.5 Phase 3 Community Self-Governance (Phase 4+)

**Norms set by DJ community before general users arrive.** This is non-negotiable. The culture of the community is set by the first 1000 users — which are DJs and music enthusiasts who found the product through DJ artifacts.

**Governance principles:**
- No influence metrics (follower counts, reputation scores)
- No artist hierarchy (DJs with 100k followers appear the same as DJs with 500 followers)
- Moderation focused on acoustic content norms, not engagement maximization
- Community shapes the product: what community members build (pulls, arcs, collections) informs what the engine learns

### 30.6 What Community Never Becomes

Explicit rejections documented here to prevent feature creep:

- Not a review platform (no ratings, no "best of" lists)
- Not a social network (no following incentives, no profile optimization)
- Not a discovery algorithm (community is for human connection, not content delivery)
- Not a creator economy (no paid memberships, no tipping, no monetized followings)
- Not a charts product (no trending, no viral hooks, no popularity ranking)

The community is for acoustic kinship — finding people whose listening journeys resemble yours. That's it. Any feature that doesn't serve acoustic kinship is out of scope.

---

*PRD last updated: 2026-05-05. Sections 1–21 original; Sections 22–30 added in patching session covering all identified gaps.*
