# Woody — Build Brief
*A complete, self-contained briefing for planning and building Woody from the current state.*
*Last updated: 2026-05-05*
*Read this document fully before touching any code. Then read VISUAL_LANGUAGE.md and PSYCHOLOGY.md for design and engine depth.*

---

## What Woody Is

Woody is an acoustic-intelligence music discovery and curation platform. It is NOT a streaming service. It sits on top of Spotify (and eventually YouTube, SoundCloud) as a discovery, curation, and identity layer — the way Letterboxd sits on top of watching films.

**The core insight:** music taste is better described by acoustic coordinates than genre labels. Five continuous perceptual dimensions (energy, warmth, density, organicity, sacred) replace genre tags. These are derivable from audio analysis.

**The unit of consumption is the session arc, not the track.** Woody surfaces 2-hour acoustic journeys, not individual song recommendations.

**The primary product loop:**
1. User expresses intent (text, image, or situational description)
2. Intent is translated to acoustic coordinates (5D target)
3. System generates a session arc — a sequence of tracks that forms an acoustic journey from current state to desired state
4. User listens. Real-time signals (skips, replays, volume) refine the arc in progress.
5. Session is saved as an artifact (visual arc). Over time, sessions accumulate into the user's acoustic territory.

---

## The Five Acoustic Dimensions

| Dimension | Range | What it captures |
|-----------|-------|-----------------|
| Energy | 0–1 | Arousal, intensity, tempo feel |
| Warmth | 0–1 | Tonal temperature (cold/synthetic → warm/organic) |
| Density | 0–1 | Textural mass, layering, fullness |
| Organicity | 0–1 | Timbre quality (synthetic/processed → acoustic/natural) |
| Sacred | 0–1 | Harmonic centredness, devotional quality, transcendence |

Derived from Spotify Audio Features (energy, valence, acousticness, instrumentalness, tempo, loudness) via a mapping function. For non-Spotify sources, Web Audio API provides real-time extraction from raw audio.

---

## The Intent Model

**Internal State × External Context × Desired State = Acoustic Target**

- **Internal state:** how the user feels now (tired, anxious, euphoric, focused, grieving, scattered)
- **External context:** environment and activity (running, driving, studying, cooking, at a beach)
- **Desired state:** where they want to go (energized, calm, euphoric, focused, nostalgic)

These three produce a richer acoustic target than any single text description. Context signals (time of day, device state, calendar, recent activity) inform the acoustic **direction vector** — which way to lean coordinates — not the specific track selection. Track selection is governed by direction + user behavior history (skip rate, replay, territory).

Text input, image input, and situational description are all valid intent entry points. The image/visual path: image analysis (colour temperature, scene content, activity inference) → acoustic coordinate priors. This removes language friction.

---

## What Exists Already (Current State)

### Prototype Files (in C:\Users\user\woody\)

| File | What it does | State |
|------|-------------|-------|
| `woody-rec-engine.html` | Working prototype — 42 tracks, NL intent parser, 5D k-NN, territory map canvas | Built but: keyword-based parser (needs LLM), hardcoded track data (needs Spotify API), no session arc generation |
| `woody-design-system.html` | Design tokens, components, acoustic field renderer | Built but: outdated visual language (pre-visual-language-session decisions) |
| `woody-acoustic-field-v3.html` | Web Audio API acoustic field — real-time mic/file input | Built — valid foundation |
| `woody-roadmap.html` | Visual product roadmap — 4 phases | Built |

### Documentation Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Workspace context, design tokens, persistent behaviour rules |
| `STRATEGY.md` | Full product vision, 8-layer model, moat strategy, sequencing |
| `FEATURES.md` | Exhaustive feature registry with 22 sections — check before building anything |
| `DECISIONS.md` | Closed vs open decisions — SSOT, do not reopen closed decisions |
| `VISUAL_LANGUAGE.md` | Visual language specification — canonical for all UI build |
| `PSYCHOLOGY.md` | Music psychology synthesis — canonical for engine design |

**READ VISUAL_LANGUAGE.md AND PSYCHOLOGY.md FULLY BEFORE BUILDING ANY UI OR ENGINE LOGIC.**

---

## Design Tokens (Canonical)

```css
--void: #0a0a0f        /* Base background — always */
--teal: #00e5c4        /* Primary accent — territory, saved, primary actions */
--cobalt: #4455ff      /* Secondary — cold acoustic states, high energy low warmth */
--moon: #f0ede6        /* Primary text */
--amber: #f0a040       /* Recommendations, warm acoustic states */
```

Fonts: **Syne** (headings, 800/700/600), **Epilogue** (body, 300/400/500), **Space Mono** (data/mono).
Always dark theme. Always grain overlay. Borders at 10% moon opacity.

---

## Visual Language (Non-Negotiable, Closed Decisions)

Full spec in VISUAL_LANGUAGE.md. Summary of what must be implemented:

**Art direction:** Algorithmic geometric base (Vera Molnár / Sol LeWitt — rule-based, systematic structures) with fluid rounded illustrative forms overlaid. **Pixelated human figures** embedded in the geometric field — dancing, drifting, running. This is Woody's visual signature.

**Aesthetic reference:** Bold, uncluttered, strong negative space. Nothing decorative that doesn't earn its place. The geometry and figures are the only things when they're present.

**Acoustic field (now playing):**
- Geometric structures respond to acoustic coordinates in real-time
- Metabolic floor: always breathing at a baseline pulse — never drops dead
- Energy → pulse speed | Warmth → glow/amber | Density → layering complexity | Organicity → shifts balance toward fluid forms | Sacred → radial expansion and stillness
- Pixelated figures move in sync with the field's acoustic state

**Motion:** Data-driven with metabolic floor. High energy = fast sharp geometry. High warmth = fluid eases. High sacred = radiant stillness. Figures respond to the same data. Nothing moves at a fixed rate when music is active; nothing drops dead.

**Shareable artifacts:** Consistent recognizable layout (acoustic arc path + coordinate field + time axis) with algorithmically generated geometric texture unique to each session.

**What it is NOT:** Glassmorphism, neon/synthwave, random particle systems, generic music player aesthetic, waveforms/spectrum analyzers.

---

## Architecture Requirements

### Backend — What Needs to Exist

**1. Spotify OAuth + API**
- User authentication via Spotify OAuth 2.0
- Batch fetch of user library (liked songs, playlists) via Audio Features API
- Map Spotify Audio Features → 5D acoustic coordinates
- SDK for playback control

**2. Acoustic Coordinate Database**
- Store tracks with 5D coordinates + metadata (title, artist, duration, source)
- Vector similarity search for k-NN in 5D space
- Index by acoustic region for efficient range queries
- Track play history per user with timestamps

**3. User State Storage**
- User profile: territory (accumulated acoustic history), session history, saved containers (Grain/Line/Pull — see Section 15 of FEATURES.md for naming status)
- Real-time signal capture: skip events with timing, replay events, volume adjustments, session length
- Context signals: last session acoustic state, time patterns, device state where available

**4. Session Arc Generation**
- Dynamic programming or beam search algorithm (E08)
- Two-dimensional optimization: (1) direction toward acoustic target, (2) transition coherence per step
- Transition coherence = acoustic distance from currently playing track to candidate (separate from target distance)
- Manages familiar/novel ratio based on inferred session intent
- Applies session shape (plateau, journey, single apex, baseline rise, inverse, wave, multiple peaks)

**5. Context Signal Pipeline**
- Time of day + day of week → acoustic direction vector
- Headphone connection type, screen state (OS signals)
- Optional: Strava/Apple Health (recent activity), calendar API, wearable heart rate
- These inform direction, not specific track selection

**6. Implicit Signal Learning**
- Skip rate (especially <15 seconds = transition failure, not track failure)
- Replay events → extend in this acoustic neighbourhood
- Volume adjustments → engagement vs distraction signal
- Session length vs expected → satisfaction signal
- These train transition coherence model over time

### Infrastructure Choices (Recommended)

- **Vector DB:** Pinecone or Weaviate for 5D k-NN at scale. Simple Postgres pgvector for MVP.
- **Backend:** Node.js or Python FastAPI — both fine. Python preferred for ML/audio analysis work.
- **Frontend:** Vanilla JS + Web Audio API for the acoustic field renderer (no framework overhead for the real-time visual). React or Next.js for the application shell.
- **Audio analysis:** Spotify API for library analysis. Web Audio API for real-time analysis of any source (YouTube, SoundCloud, anything playing).
- **Hosting:** Vercel (frontend) + Railway or Render (backend) for MVP.

---

## Engine Requirements (Priority Order)

### Phase 1 — Core Engine (Build This First)

**E01/E02 — Acoustic coordinate extraction**
- Spotify OAuth → Audio Features batch fetch for user library
- Map to 5D: Energy (direct), Warmth (valence + acousticness composite), Density (loudness + energy composite), Organicity (acousticness + instrumentalness), Sacred (valence + instrumentalness + acousticness composite — the most constructed dimension)
- Store in vector DB

**E03/E04 — Intent → coordinates + recommendation**
- Replace keyword-based prototype parser with LLM intent parsing
- LLM receives: internal state, external context, desired state → 5D acoustic target
- k-NN retrieval from vector DB with weighted Euclidean distance (energy×1.6, warmth×1.4, organicity×1.1, sacred×1.2, density×1.0)

**E05 — Territory biasing**
- User's acoustic territory centroid shifts the recommendation space
- New users: no bias. As territory accumulates: bias toward centroid + frontier (adjacent unexplored territory)

**E08/TC05 — Session arc generation**
- Two-dimensional beam search: progress toward target + transition coherence
- Start state = current acoustic position. End state = acoustic target from intent.
- Manage familiar/novel ratio per session type (inferred from intent)
- Apply session shape classification to the arc

**TC01/TC02 — Transition coherence**
- Per track boundary: score = f(distance_to_target, distance_from_current)
- Skip signals feed back into transition coherence model
- Skip <15 seconds = transition failure. Skip at 2+ minutes = track mismatch or flow break.

### Phase 2 — Session Experience

**AH01-AH05 — Acoustic Hold / Soft Pause**
- Third playback state: hold instead of silence
- Graceful ending (1-2 second resolution) when pause triggered
- Re-entry protocol (15-20 second acoustic re-establishment on resume after long hold)
- "Flow may have reset" prompt after extended hold

**LI01-LI04 — Lock-in Sessions**
- Task-aligned acoustic targeting beyond mood
- Baseline Rise arc shape: start 0.2-0.3 below acoustic target, rise gradually
- No-decision session execution: music takes responsibility

**TC07 — Dopamine baseline arc**
- Sessions deliberately start below user's expected acoustic state
- Gradual rise amplifies perceived reward at target arrival

### Phase 3 — Intelligence Layer

- Behavioral song embeddings (what tracks *do* psychologically, not just what they sound like)
- ML shape learning (learn user's preferred arc shapes per intent type)
- Context signal integration (time, calendar, wearables)
- Multi-source acoustic analysis (YouTube, SoundCloud via Web Audio)

---

## Frontend Requirements (Priority Order)

**Read VISUAL_LANGUAGE.md fully before building any screen.**

### 1. Design System Update (Build First — Everything Inherits From This)

Update `woody-design-system.html` with:
- **Acoustic field renderer:** geometric structures + pixelated figures + fluid rounded overlays. Parameters: energy (pulse speed), warmth (amber glow), density (layer count), organicity (geometric/fluid balance), sacred (radial expansion). Metabolic floor — always alive.
- **Motion system:** baseline rhythm with data-modulation. Define the floor (minimum pulse rate), define how each acoustic dimension scales it up.
- **Pixelated figure library:** dancing, drifting, running, crowd figures. Tile-based pixel art. Small (16-32px). Used across now playing, artifacts, loading states.
- **Geometric structure library:** rule-based grid structures, Vera Molnár-style accumulating lines, intersecting systems. These are the background/base layer.
- **Component updates:** cards, buttons, input fields, session arc visualization, coordinate display bars.
- **Artifact template:** the shareable arc layout (arc curve + coordinate field + time axis + Syne typography overlay).

### 2. Now Playing Screen (The Core Experience)

- Acoustic field fills the display (not a player with visualizer added — the field IS the screen)
- Track info: minimal overlay (artist, track name, small, bottom-aligned)
- Arc position: thin horizon line at the bottom showing position in the session arc
- Spatial nudge pad: 2D, no labels, push to adjust acoustic direction (warmer/colder/more dense/lighter)
- Soft pause button: triggers graceful ending + hold state, not hard stop
- One tap to mark a moment (save a Grain — the captured moment)
- Swipe up: session history / arc view
- Swipe right: territory view
- Nothing else on this screen

### 3. Intent Input Screen

- Three-panel capture: internal state (how you feel now), external context (what you're doing), desired state (where you want to go)
- Text input + quick-pick chips for each panel (not forced — any or all can be filled)
- Lock-in mode toggle: shows task description field, extends intent to include task type
- Session duration selector (30min / 90min / 2hr / custom)
- Session shape selector (optional, inferred if not set): journey / plateau / single apex / wave / inverse
- Image/GIF intent shortcut: alternative to text — pick a visual, image analysis maps to acoustic priors
- "Start session" generates the arc and transitions to Now Playing

### 4. Container Browser (Working names: Grain / Line / Pull — naming not finalized)

**Grain** (unplanned captured moments):
- Feed of marked moments from sessions
- Each Grain: track, timestamp in track, session acoustic state at time of capture, context
- Tap to re-enter the acoustic neighbourhood of that moment

**Line** (crafted session arcs — working name):
- Named sessions created intentionally from intent input
- Shows arc shape visualization, acoustic journey, duration
- Rebuildable (re-run this line), shareable (export as artifact)

**Pull** (recurring acoustic contexts — working name):
- Named acoustic contexts you return to ("Sunday mornings", "pre-run", "the grief one")
- Contains Grains and Lines that share acoustic signature
- System surfaces "you have 8 similar sessions, name this?" prompt to create from behavior

### 5. Territory / Constellation View

- 2D projection of acoustic history (energy × warmth primary axes)
- Heat cloud / fingerprint — NOT a geographic map. Each point is a session/track. Density shows where you've lived acoustically.
- Social overlay: show where other users' territories overlap with yours (anonymous by default)
- Your territory is yours — unique acoustic fingerprint, not generic

### 6. Social / Artifact Sharing

- Shareable arc: visual artifact from session (arc curve + geometric texture + minimal typography)
- While-listening share: "I'm in this acoustic space, join me" — live artifact
- After-listening share: complete session artifact with full arc
- Strava attachment: arc embeds in activity post (key acquisition mechanism)

---

## Psychology Constraints (Engine Must Respect These)

Full detail in PSYCHOLOGY.md. The non-negotiables:

1. **Match before you move** — session starts acoustically congruent with current state, moves toward desired state. Never start where they want to end.

2. **Transition coherence** — the skip is a transition failure signal, not a track rating. Optimize for smooth transitions, not just individually good tracks.

3. **Metabolic floor** — the acoustic field never drops dead. Motion always has a minimum baseline. Music selection never produces a jarring vacuum between tracks.

4. **Earn the peaks** — frisson moments require setup (lower density/energy before the spike). Never front-load intensity. Frisson candidates: 35%, 68%, 88% of session arc.

5. **Novelty is earned** — don't front-load unfamiliar music. Establish familiar territory first (familiar anchor tracks first 20-30 minutes), then introduce adjacent discovery.

6. **Soft pause / graceful exit** — pause is an acoustic event, not a hard stop. The session ends or holds gracefully; it never just cuts.

7. **Context informs direction, not action** — contextual signals (time, state, device) shift the acoustic direction vector. Specific track selection is still governed by the user's own behavior history.

8. **Lock-in sessions use Baseline Rise arc** — start below target, rise gradually. Dopamine baseline manipulation requires the approach, not just the destination.

---

## Build Sequence (Do Not Deviate From This Order)

```
Phase 1 — Foundation
├── Spotify OAuth + library import
├── Acoustic coordinate extraction (5D mapping from Spotify Audio Features)
├── Vector DB setup + track indexing
├── Intent → coordinates (LLM parser, tripartite model)
├── k-NN recommendation with territory biasing
├── Session arc generation (beam search, transition coherence)
└── Basic Now Playing screen (acoustic field + track info + pause)

Phase 2 — Session Experience  
├── Design system update (visual language implementation)
├── Full intent input screen (tripartite + lock-in + shape selection)
├── Acoustic Hold / Soft Pause
├── Lock-in sessions with Baseline Rise arc
├── Container browser (Grain / Line / Pull)
├── Signal capture (skip, replay, volume, session length)
└── Basic artifact generation (session export as visual)

Phase 3 — Intelligence + Social
├── Transition coherence ML (skip signal training)
├── Context signal pipeline (time, device, activity)
├── DJ set logging + arc visualization
├── Territory/constellation visualization
├── Shareable artifacts + Strava integration
├── Multi-source (YouTube + SoundCloud via Web Audio)
└── Basic community layer (arc sharing, territory overlap)

Phase 4 — Moat Deepening
├── Behavioral song embeddings
├── ML arc shape learning per user
├── Own acoustic analysis pipeline (independence from Spotify API)
├── API access for B2B
└── Pro tier features
```

---

## What Not to Build (Explicitly Rejected)

- Streaming service / licensing layer
- Star ratings or reviews
- Influence/follower model (following ≠ promotion)
- Gamified reputation scores
- Spatial zoom navigation (too much cognitive overhead)
- Tab-based navigation (too generic)
- Any visualizer that's "bolted onto" a player — the acoustic field IS the player
- Album art as the visual hero of Now Playing

---

## Key Constraints

- **Web-first (PWA).** No native app in Phase 1.
- **Dark theme always.** No light mode.
- **Grain overlay always present.** Structural, not decorative.
- **No glassmorphism.** No frosted blur.
- **Now Playing is the hub.** Everything else is one gesture away. Navigation almost disappears.
- **Social features are invisible until there's something to show.** Never build empty social surfaces.
- **DJ mode surfaces from behavior**, not from a setup screen split.

---

## Open Decisions (Do Not Close Without a Session)

From DECISIONS.md:
1. **Container names** — working: Grain / Line / Pull. Not finalized. Don't hard-code brand strings yet.
2. **Iconography** — hero symbol, logo, container icons, acoustic dimension marks. Needs design session.
3. **Full IA / screen map** — high-level navigation decided, detailed screen count and transitions not done.
4. **Pixel/custom art for artifacts** — on the table, not decided.
5. **Illustrated form library** — 8–12 fluid rounded shapes needed for consistent visual language implementation.

---

## Reading Order for a Fresh Context

1. This document (`BUILD_BRIEF.md`) — you're here
2. `VISUAL_LANGUAGE.md` — all visual decisions, canonical for UI
3. `PSYCHOLOGY.md` — behavioral principles, canonical for engine
4. `FEATURES.md` — full feature registry (22 sections), check before building anything
5. `DECISIONS.md` — what's closed vs open
6. `CLAUDE.md` — workspace context, design tokens, persistent behavior rules
7. `STRATEGY.md` — full product vision and strategic decisions (if building for product fit, not just engineering)
