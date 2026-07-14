# Woody — Master Build Prompt
*Complete context for Cursor, Claude Code, or Codex. Read every section before touching any code.*
*Last updated: 2026-05-13*

---

## SECTION 0 — HOW TO USE THIS DOCUMENT

This is the single source of truth for building Woody. If you are an AI assistant helping build this project, read this entire document before writing a single line of code. Every architectural choice, visual decision, psychology principle, and quality standard is in here.

**Hierarchy of authority (resolve conflicts in this order):**
1. This document
2. `PSYCHOLOGY.md` — behavioral laws for engine design
3. `VISUAL_LANGUAGE.md` — visual decisions (closed, do not reopen without a full design session)
4. `FEATURES.md` — feature registry, check before building anything
5. `BUILD_BRIEF.md` — original engineering briefing
6. `STRATEGY.md` — product vision and strategic sequencing
7. `SESSION_NOTES.md` — decisions made conversationally, cross-check here for anything not in other docs
8. `SHELVED.md` — ideas rejected with reasons. Check before proposing anything.

**Repo note (stack):** `docs/IMPLEMENTATION_SSOT.md` governs the current stack (Next.js 15 + TS + Tailwind at repo root; Python only in `packages/acoustic-service`). Sections 6, 8, and 14 of this document describe the legacy vanilla-HTML/FastAPI prototype spec and are kept for historical context — defer to IMPLEMENTATION_SSOT on any stack/structure conflict. The product, engine, and visual rules in all other sections remain authoritative.

---

## SECTION 1 — WHAT WOODY IS (NON-NEGOTIABLE FRAMING)

### The One-Line Truth
Woody is an **acoustic navigation layer** on top of Spotify. Not a streaming service, not a playlist generator, not a recommendation engine. A navigator — the difference is that Woody takes instructions in acoustic coordinates, not genre labels.

### The Core Problem
Spotify is excellent at "more of the same." It cannot answer: *"Same character, lower energy"* or *"Zone 2 run energy — chill enough to stay in heart rate zone but still feel good"* or *"I'm anxious and I want music that meets me there before trying to lift me."*

These are acoustic coordinate instructions. Spotify has no model for them. Woody does.

### What Woody Is NOT
- **Not a streaming service** — no licensing, no catalog hosting. Sits on top of Spotify (and eventually YouTube, SoundCloud).
- **Not a playlist generator** — that's a feature, not the product.
- **Not a recommendation engine** — Spotify recommends. Woody navigates. You tell it where to go.
- **Not a review platform** — no ratings, no opinions, no critical discourse.
- **Not a social network** — community *emerges* from the product; it is never launched explicitly.
- **Not a DJ tool** — the DJ wedge is an acquisition mechanism, not the destination.
- **Not a mood app** — mood is one axis. The 5D space is far richer.

### The Product Reframe (Most Recent, Most Important)
This is a **portfolio project**. Build it functional, clean, and demonstrable. The real IP is the acoustic attribution and modelling components — these are separable and could be sold as a bespoke B2B acoustic intelligence layer to fitness apps, gaming, meditation platforms. The consumer product framing is secondary for now. Build prototypes you can fork into 2-3 use case demos from the same core engine.

### The Unit of Consumption
**The session arc, not the track.** A track recommendation is an ingredient delivery. A 90-minute acoustic journey is a meal. Every Woody interaction should be arc-shaped: start state → trajectory → landing. Single track recommendations are a degraded fallback, not the product.

---

## SECTION 2 — THE FIVE ACOUSTIC DIMENSIONS

Everything in Woody is built on these five 0–1 dimensions. They are not mood labels. They are not genre. They are perceptual acoustic coordinates derivable from audio analysis.

| Dimension | Range | What it describes |
|-----------|-------|-------------------|
| **Energy** | 0–1 | Arousal, intensity, tempo feel |
| **Warmth** | 0–1 | Tonal temperature — cold/synthetic (0) to warm/organic (1) |
| **Density** | 0–1 | Textural mass — sparse (0) to full/layered (1) |
| **Organicity** | 0–1 | Timbre quality — synthesized/processed (0) to acoustic/natural (1) |
| **Sacred** | 0–1 | Harmonic centredness, devotional quality, transcendence |

### Mapping From Spotify Audio Features

> ⚠️ **DISPLAY ONLY** — This formula produces the user-facing 5D coordinates for the visual field renderer. It is **not used for navigation**. Arc generation, k-NN search, and territory computation all operate in 512D CLAP embedding space (see Section 6). Research confirmed Spotify `valence` has only r=0.67 correlation with human perception; this formula is a Phase 1 heuristic, not a permanent architecture.

Spotify's Audio Features endpoint returns these raw values: `energy`, `valence`, `acousticness`, `instrumentalness`, `liveness`, `loudness` (dB, range −60 to 0), `tempo`, `speechiness`, `danceability`, `mode`, `key`.

Compute 5D display coordinates as follows:

```python
def spotify_to_5d(features: dict) -> dict:
    energy      = features['energy']                           # Direct (0–1)
    loudness_n  = (features['loudness'] + 60) / 60            # Normalize dB to 0–1
    
    warmth      = (features['valence'] * 0.6) + (features['acousticness'] * 0.4)
    density     = (loudness_n * 0.5) + (features['energy'] * 0.5)
    organicity  = (features['acousticness'] * 0.6) + (features['instrumentalness'] * 0.4)
    sacred      = (features['valence'] * 0.3) + (features['instrumentalness'] * 0.4) + (features['acousticness'] * 0.3)
    
    return {
        'energy':     round(energy, 4),
        'warmth':     round(warmth, 4),
        'density':    round(density, 4),
        'organicity': round(organicity, 4),
        'sacred':     round(sacred, 4)
    }
```

These are **Phase 1 heuristics** — pragmatic, functional, good enough to build on. The long-term path is MERT-based learned embeddings that capture what these formulas miss.

### Dimension Weights for Recommendation Distance

When computing acoustic distance between a candidate track and a target, weight dimensions differently because they are not perceptually equal:

```python
DIMENSION_WEIGHTS = {
    'energy':     1.6,   # Most perceptually salient dimension
    'warmth':     1.4,   # Second most — warm/cold is immediately felt
    'sacred':     1.2,   # Harmonic quality is strongly felt even if rarely named
    'organicity': 1.1,
    'density':    1.0    # Least perceptually immediate
}

def weighted_distance(track: dict, target: dict) -> float:
    total = sum(
        DIMENSION_WEIGHTS[dim] * (track[dim] - target[dim]) ** 2
        for dim in DIMENSION_WEIGHTS
    )
    return total ** 0.5
```

### Reference Acoustic Profiles (Psychology-Grounded)

These come from music psychology research in `PSYCHOLOGY.md`. Use as defaults for intent parsing.

| Psychological goal | Energy | Warmth | Density | Organicity | Sacred | Arc shape |
|-------------------|--------|--------|---------|-----------|--------|-----------|
| Deep focus / study | 0.35 | 0.55 | 0.25 | 0.65 | 0.45 | Plateau |
| Creative work | 0.50 | 0.70 | 0.40 | 0.60 | 0.35 | Wave |
| Attention restoration | 0.50 | 0.65 | 0.30 | 0.75 | 0.55 | Wave |
| Physical activity (zone 2) | 0.45 | 0.55 | 0.40 | 0.50 | 0.20 | Plateau |
| Physical activity (high intensity) | 0.85 | 0.50 | 0.75 | 0.35 | 0.40 | Apex/Intervals |
| Wind down / sleep prep | 0.20 | 0.75 | 0.20 | 0.70 | 0.70 | Inverse |
| Mood repair (gradual) | 0.30→0.60 | 0.40→0.70 | 0.30→0.50 | 0.60 | 0.40→0.60 | Journey |
| Discharge / process grief | 0.20→0.40 | 0.20→0.50 | 0.40→0.60 | 0.70 | 0.30→0.60 | Single apex |
| Lock-in / focus induction | starts 0.20→0.45 | starts 0.40 | starts 0.20→0.35 | 0.65 | 0.45 | Baseline Rise |
| Nostalgia / rediscovery | 0.45 | 0.65 | 0.35 | 0.75 | 0.60 | Journey |
| Euphoria / peak | 0.85→0.95 | 0.60 | 0.70→0.85 | 0.40 | 0.50 | Single apex |

---

## SECTION 3 — PSYCHOLOGY LAWS (ENGINE MUST FOLLOW THESE)

These are behavioral laws derived from music psychology research (`PSYCHOLOGY.md`). They are not preferences. Violating them produces a product that fails at its core promise.

### Law 1: Match Before You Move
The arc always starts acoustically close to the user's **current state**, then moves toward the target. Never start where they want to end.
- A user who is anxious wanting calm needs acoustic mirroring first, then descent.
- A user who is sad and wanting to process needs congruent music (equally low warmth), not immediate uplift.
- Starting at the destination is a product failure — it produces a jarring, rejected first track.

### Law 2: The Skip is a Transition Signal, Not a Track Rating
**This is the most fundamental reframe in the engine.** A skip does not mean "I don't like this song." It means "this transition cost more than the current flow state could absorb." The same song might be loved in isolation and skipped mid-session.
- Skip within 15 seconds = **transition failure** — the boundary between tracks was acoustically jarring.
- Skip at 2+ minutes = track mismatch or flow break — the track may be wrong for the session context.
- Optimize for transition coherence, not individual track quality. A "good enough" seamless transition outperforms a "perfect" jarring one every time.
- Acoustic distance between **consecutive tracks** in a session must be tracked and bounded (target < 0.35 weighted distance between adjacent tracks).

### Law 3: Earn the Peaks (Frisson Engineering)
Peak emotional moments (frisson — chills, shivers) require setup:
- A high-energy surge from an already high-energy context produces nothing.
- The same surge from a lower-density, lower-energy passage produces chills.
- Frisson candidates belong at approximately 30–40%, 65–70%, and 85–90% of session arc. Not track 1.
- Frisson mechanism: ≥3 consecutive lower-energy/density tracks → significant upward energy spike. The contrast creates the reward.
- Consecutive frisson candidates habituate — space them. Sacred dimension tracks placed after high-tension passages create harmonic frisson distinct from energy/dynamic type.

### Law 4: Novelty is Earned, Not Gifted
- Establish familiar territory before introducing discovery. First 20–30% of session should anchor in the user's known acoustic territory.
- Novelty preference is highest when the user is in a positive, moderately aroused state. Don't introduce discovery during low-energy or anxious sessions.
- Familiar/novel ratios by intent type:
  - Recovery/wind-down: 70–80% familiar
  - Work/focus: 60–70% familiar  
  - Physical activity: 50–60% familiar
  - Discovery/exploration: 30–40% familiar (user must explicitly request this)
- Penalize recently played tracks regardless of acoustic fit (recency decay function).

### Law 5: The Metabolic Floor — Never Drop Dead
The acoustic field visualization (and implicitly the session pacing) must have a **permanent minimum baseline**. It never flatlines. Even at Energy = 0, there is a slow baseline pulse. High-energy compresses the pulse cycle. Sacred extends and radiates it. This applies to:
- The visual field (canvas animation always breathing at minimum rate)
- Session pacing (no acoustically dead transitions — track gaps should be managed)
- The Soft Pause state (hold, not silence)

### Law 6: 90 Minutes is a Biological Default
The 90-minute session length is not arbitrary — it maps to the human Basic Rest-Activity Cycle (BRAC). One ultradian cycle. Design arc shapes around this:
- Plateau arcs for work: include a subtle density dip at ~80 minutes, then gentle recovery
- Single-apex leisure arcs: peak between minutes 60–80, then resolve
- Activity arcs with physical exertion: can sustain higher energy through 90-minute mark
- Present 90-minute as the psychologically motivated default, not just a convenient number.

### Law 7: Silence is an Acoustic Choice
For cognitive work, study, restoration — the goal is often **not to be interesting**. A study arc the user barely notices is a successful study arc. Do not optimize study/focus arcs for acoustic interest. Restraint is a product virtue. Suppress:
- Structural novelty (no sudden energy spikes in focus arcs)
- Prominent lyrics (compete with linguistic cognitive tasks)
- Harmonic surprise (pulls directed attention)

### Law 8: Nostalgia is a Protected Zone
Tracks that trigger autobiographical recall carry emotional weight no acoustic model can measure. Being ambushed by a high-MEAR (Music-Evoked Autobiographical Recall) track during a focus session is a product failure. Rules:
- Nostalgic content is opt-in only (rediscovery mode, solace arcs, explicit request)
- High-MEAR profile: high organicity, moderate energy, high sacred, lower density, era-specific timbral warmth
- Gate against unexpected MEAR in: focus arcs, activity arcs, any task-oriented session
- Allow freely in: wind-down, rediscovery mode, solace arcs

### Law 9: Context Informs Direction, Not Selection
Contextual signals (time of day, device state, recent activity, calendar) shift the **acoustic direction vector** — which way to lean the target. They do not select specific tracks. Track selection is always governed by acoustic distance + user behavior history. The distinction matters for privacy and for avoiding creepy over-inference.

### Law 10: Soft Pause is the Third Playback State
Binary play/pause is the wrong model. The flow state exits within seconds of silence because the default mode network re-engages immediately. The Soft Pause / Acoustic Hold works like this:
1. **Graceful ending**: 1–2 seconds to resolve whatever is playing into a satisfying acoustic exit (micro-fade, reverb sustain). Last sound = completion, not a cut.
2. **Hold state**: low-level ambient texture sustains (reverb tail, gentle drone) — not music, not silence. Space kept warm.
3. **Re-entry protocol**: short hold (<60s) = seamless. Long hold = 15–20 second acoustic re-establishment before resuming. Not just a press-play-and-continue.
4. **Flow may have reset prompt**: after extended hold, offer "Continue or start fresh?" — no guilt, honest acknowledgment.

### Law 11: Baseline Rise for Lock-In Sessions
Lock-in / focus induction arcs must use the Baseline Rise shape:
- Start 0.20–0.30 below target acoustic coordinates across energy and density
- Spend 20–30% of session in the approach
- Arrive at target and plateau
- This is grounded in dopamine reward prediction error — a low starting baseline makes the rise feel disproportionately good. It is how skilled DJs build euphoria. Apply it here for focus induction.

---

## SECTION 4 — VISUAL LANGUAGE (CLOSED DECISIONS)

**These decisions are closed.** Do not reopen, redesign, or deviate without convening a full visual language session. If an AI assistant suggests a visual direction not covered here, reject it and return to these specs.

### The Two Worlds

**World B (the base layer):** Algorithmic / geometric. Vera Molnár, Sol LeWitt. Rule-based, systematic structures. Grids that warp. Lines that accumulate. Geometry that implies intelligence without decoration. This layer gives structure and precision.

**World A (the accent layer):** Scientific intimacy. Fluid rounded forms — like biological illustration, field notes, cosmological sketches. The organic disrupting the geometric. This layer gives life and human warmth. It is overlaid on World B, not replacing it.

These two layers do not fight. B gives structure. A gives life. Both are required. Pure B reads as cold and academic. Pure A reads as too soft and unanchored.

### The Pixelated Human Figure
This is Woody's visual signature. Pixelated human figures — dancing, drifting, running — are embedded in and moving through the geometric field. They are the human element inside the systematic structure. Precise *and* deeply human. Figures are small (16–32px), tile-based pixel art, and move in sync with acoustic data — not separately.

**What "pixelated" means:** Intentional low-resolution sprite art — not a CSS filter, not a blurry render, not accidental blockiness. Actual pixel art designed at the correct resolution. Use PixelLab (pixellab.ai) or similar tool for actual sprite assets rather than hand-coding OR() rectangle primitives, which produce the "Minecraft character" look that has been repeatedly rejected.

### Acoustic Field → Visual Mapping

| Dimension | Visual expression |
|-----------|-------------------|
| Energy | Pulse rate / geometry transformation speed |
| Warmth | Amber glow flooding the field; void softens at high warmth |
| Density | Layering complexity — how many geometric structures are simultaneously active |
| Organicity | Balance of World B (geometric) vs World A (fluid rounded forms) — more organicity = more A-world |
| Sacred | Radial expansion, increasing stillness between pulses, geometry that radiates outward |

- High energy + low warmth → fast sharp geometric shifts, dense layering, cobalt-teal palette
- Low energy + high warmth → slow golden breathing, few layers, soft forms drifting, amber flooding
- High sacred regardless of energy → radiating, expanding, space between elements increases, near freeze-frame quality
- The field is NEVER a waveform, spectrum analyzer, EQ bars, or pulsing logo. Those are rejected aesthetics.

### Motion System

- **Metabolic floor**: constant baseline rhythm the field never drops below. Acoustic coordinates modulate it upward (faster, more complex, more expansive) but never below floor.
- **Data-driven, not decorative**: motion derives entirely from 5D coordinates. Nothing moves at a fixed rate when music is active.
- **State transitions**: acoustic coordinate changes produce field reconfiguration over 2–4 seconds — not a hard cut, not an instant update. Momentum matching the rate of change.
- **Breathing**: fluid rounded forms (World A) have a baseline respiration cycle tied to tempo. Fast tempo = shorter breath cycle. Warmth + sacred determine character of breath (expansive vs tight).

### What It Explicitly Is NOT

| Rejected direction | Why |
|--------------------|-----|
| Glassmorphism / frosted blur | Too trendy, not timeless. Void is void — opaque and deep. |
| Neon / synthwave | Colors are precise, not decorative. No glow for glow's sake. |
| Generative noise / lava lamp | Geometry is rule-based and intentional, not random. |
| Standard music player aesthetic | Album art is not the hero. The acoustic field IS the hero. |
| Geometric-only without fluid forms | Reads as cold and academic without World A accents. |
| Illustration-only without geometry | Too soft. World B must anchor it. |
| Waveform/spectrum analyzer | Every music app has one. This is not a music app. |

### Shareable Artifact Layout (Canonical)

Every Woody artifact shares this recognizable structure:
- **Acoustic arc curve**: the path through coordinate space over time
- **Coordinate field**: 2D space (energy × warmth as primary axes)
- **Time axis**: session duration implicit in arc length
- **Annotation marks**: energy peaks, warmth shifts, notable arc waypoints — thin, minimal
- **Texture**: algorithmically seeded from session data — every arc is unique, but all are recognizably Woody

Typography on artifacts: session name in Syne 600, coordinate labels in Space Mono. No timestamps, no track lists, no clutter.

**Creator ownership rule**: Woody provides the acoustic data and visualization engine. Creators assemble the final artifact using their own color palette, typography, and branding. Woody gets metadata credit, not a visual element. Similar to SoundCloud embed model. The artifact must feel like it belongs to the creator, not to Woody.

---

## SECTION 5 — DESIGN TOKENS (NEVER DEVIATE)

```css
--void:   #0a0a0f   /* Base background — always. Never lighter than this for background. */
--teal:   #00e5c4   /* Primary accent — territory, saved, primary actions, selected states */
--cobalt: #4455ff   /* Secondary accent — cold acoustic states, high energy + low warmth */
--moon:   #f0ede6   /* Primary text — all readable content */
--amber:  #f0a040   /* Recommendations, warm acoustic states, highlight moments */
```

**Typography** (load from Google Fonts):
```
Syne      → headings (800/700/600) — all caps when large, mixed case when small
Epilogue  → body (300/400/500) — comfortable reading weight
Space Mono → data, coordinates, timing, dimension labels (always monospace for numbers)
```

**Rules that cannot be broken:**
- Always dark theme. No light mode. Ever.
- Grain overlay always present — structural, not decorative. ~8% opacity SVG noise or CSS noise texture.
- Borders at `rgba(240, 237, 230, 0.10)` — 10% moon opacity. Subtle structure without visible separation.
- Cards / elevated surfaces: `#111118` (slightly lifted from void). Not confirmed — do not hardcode brand strings for container names yet.
- No frosted blur. No transparency stacking.
- No glow effects except where directly derived from acoustic warmth dimension data.

---

## SECTION 6 — ARCHITECTURE DECISIONS

### Stack

```
Backend:     Python + FastAPI
Database:    SQLite → pgvector on Postgres (production)
Auth:        Spotify OAuth 2.0 (Authorization Code Flow — server-side)
Spotify:     spotipy library
LLM:         OpenAI GPT-4o or Anthropic Claude API (intent parsing only)
Frontend:    Vanilla HTML/CSS/JS — no React, no framework overhead for prototype
Canvas:      HTML5 Canvas API for acoustic field renderer
Hosting:     Local for prototype. Vercel (frontend) + Railway (backend) for deployment.
```

### Embedding Architecture (4-Layer)

> ⚠️ **Updated 2026-05-13** — Layer 2 revised from MERT to CLAP after deep research. See `WOODY_BUILD_SPEC.md` for the complete spec. The Section 2 formula below is **display-only** — navigation operates in 512D CLAP space.

```
Layer 0: Raw audio
Layer 1: Extracted features ~400D (Essentia primary, Librosa fallback for non-Spotify)
          Essentia.js (WASM) for browser real-time analysis
Layer 2: CLAP embeddings 512D  ← PRIMARY NAVIGATION LAYER (updated)
          model: laion/larger_clap_music_and_speech
          Multimodal: text and audio share the same embedding space
          Navigation (arc gen, k-NN, territory, cold start) ALL happen here
          Distance metric: cosine similarity, transition constraint < 0.35
Layer 3: T1 perceptual 5D projection  ← DISPLAY ONLY (lossy)
          Computed from CLAP via linear probe (Phase 2) or heuristic formula (Phase 1)
          Never used as navigation target — user-facing coordinate system only
Layer 4: Personal acoustic territory (user-specific, on-device Phase 3)
```

**Why CLAP over MERT for navigation:** CLAP is multimodal — a user typing "late night drive" and the audio of a matching track are near each other in the same 512D space. This directly solves the text-to-audio navigation alignment problem. MERT is a stronger model for pure audio understanding tasks but has no text modality and is harder to deploy. MERT remains relevant for fine-grained audio analysis if needed later.

**MERT status:** Moved to optional Phase 2 enhancement for audio-only embedding tasks. Not required for Phase 1.

**JEPA is shelved** — wrong architecture for this problem. Revisit for Phase 3 behavioral modeling only if session data is dense enough to support world-model-style temporal prediction.

**sqlite-vec for Phase 1 vector storage** — zero infrastructure overhead, production-ready (v0.1.0 stable 2024). Same schema as pgvector — swap driver when scaling. See `WOODY_BUILD_SPEC.md` Section 4.

### Session Arc Generation

Beam search in 512D CLAP space:
1. **Direction toward CLAP target** — cosine distance to text embedding of intent decreasing?
2. **Transition coherence** — cosine distance between consecutive tracks < 0.35?
3. **Arc shape** — journey / plateau / discharge / peak_early (inferred from intent text)

The shortlist only breaks on user disinterest signal (skip < 15% playtime = acoustic mismatch). Acoustic neighborhood = unit of execution.

Phases within arc:
- Pre-hype (5–10 min, for activity arcs): high energy build to prime physiological readiness
- Main arc: tempo-matched, Baseline Rise or Journey or Plateau depending on shape
- Cool-down (15–20 min, for activity arcs): inverse shape, warmth increases, recovery acceleration

### Privacy by Design

- **Federated learning**: gradients only go to server, not raw behavioral data
- **Differential privacy** on aggregation
- **Personal model** (Phase 3): on-device fine-tuned LLM (Phi-3 / Gemma 2B class), RL-based, RAG over personal history. Personalization data never leaves device.
- Screen Capture API (for YouTube integration): captured audio processed in-browser via Essentia.js in SharedArrayBuffer only — never uploaded. Requires COOP/COEP headers.
- Contextual signals: never expose raw data, only the acoustic direction vector it produces.

### On-Device vs. Server Split

| What | Where | Why |
|------|-------|-----|
| 5D coordinate computation | Server at ingestion | MERT is 300M+ params, not on-device |
| Arc generation (beam search) | Server | Access to full catalog + user territory |
| Intent parsing (LLM) | Server (API call) | Requires LLM |
| Acoustic field visualization | Client (Canvas API) | Real-time, must be local |
| Real-time audio analysis (Essentia.js) | Client (WASM) | Screen capture privacy requirement |
| Personal behavioral model (Phase 3) | On-device | Privacy by design — data never leaves |
| Embedding storage | Vector DB (Pinecone/Weaviate → pgvector for MVP) | k-NN at scale |

### YouTube / External Source Integration

Latency problem is a **synchronization problem**, not a round-trip latency problem.

Solution: dual buffer with 2-second overlapping windows at 50% overlap → 1-second feature update cadence. Acoustic field visualization lerped at 30fps.

Permission UX: pre-request `getDisplayMedia` permission on session start as a feature reveal ("enable live acoustic visualization"), not as a security dialog mid-session. Better conversion than ambushing the user.

Requirements: COOP/COEP headers (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`) for SharedArrayBuffer access.

---

## SECTION 7 — ENGINEERING STANDARDS AND GUARDRAILS

These apply to every line of code written for Woody. Silent on routine execution. Flag on moderate risks. Stop on critical risks.

### Authentication and Authorization
- Spotify OAuth: use Authorization Code Flow (not implicit, not PKCE for server-side). Refresh tokens must be stored encrypted at rest, never in plaintext.
- Never log access tokens or refresh tokens — not in console, not in files, not in error messages.
- Session tokens: sign and expire. Check expiry before every Spotify API call.
- Scopes: request only what is needed. For prototype: `user-library-read`, `user-top-read`, `user-read-recently-played`, `streaming`, `user-read-playback-state`, `user-modify-playback-state`. Do not over-permission.
- Environment variables: all credentials in `.env`, never hardcoded. `.env` in `.gitignore` — check before first commit.

### Data Privacy
- User listening behavior is sensitive. Treat it as PII.
- Do not log individual listening events in plaintext. Store as acoustic coordinates, not raw track data, where possible.
- Any third-party API calls (OpenAI for intent parsing): do not send identifying user data. Send acoustic coordinate targets and intent text only — not username, not listening history.
- GDPR baseline: be able to delete all user data on request. Design the schema with deletion in mind from day one.

### Input Validation
- Validate all LLM-returned coordinate values: must be float between 0.0 and 1.0. Clamp or reject out-of-range values.
- Validate Spotify API responses before processing. Audio Features can return null for some tracks (local files, some podcasts). Handle null gracefully — skip track, do not crash.
- Intent text inputs: sanitize before sending to LLM. Maximum length cap.

### Error Handling
- Spotify API rate limits: implement exponential backoff with jitter. Do not hammer the API on 429 responses.
- LLM API failures (intent parsing): fall back to keyword heuristics, not a crash. The product should be usable even if the LLM call fails.
- Database failures: fail gracefully. Return cached or partial results where possible.
- Token expiry: auto-refresh silently. Never surface OAuth errors directly to the user as error messages.

### Security
- No SQL string concatenation — parameterized queries only.
- No `eval()` or `exec()` on user-provided strings anywhere.
- CORS: lock to known frontend origin in production. Never `*` in production.
- Content Security Policy headers for the frontend.
- Do not expose internal error messages or stack traces in API responses.

### Code Quality Standards
- Every function has a single clear responsibility. If it does two things, split it.
- Acoustic coordinate computation is pure functions — no side effects, easy to test and verify.
- Keep the 5D mapping formula in one place (`acoustic.py` or equivalent). Do not duplicate it.
- Arc generation algorithm must be separately testable from the API layer.
- All Spotify API calls go through `spotify.py` — no direct API calls scattered across files.

---

## SECTION 8 — PROJECT STRUCTURE

```
woody-prototype/
├── backend/
│   ├── main.py           # FastAPI app — all route definitions
│   ├── spotify.py        # Spotify OAuth + Audio Features API wrapper
│   ├── acoustic.py       # 5D coordinate extraction, mapping, distance calculation
│   ├── engine.py         # Arc generation, k-NN, intent parsing, session logic
│   ├── db.py             # Database schema + queries (SQLite / pgvector)
│   ├── models.py         # Pydantic models for request/response validation
│   └── .env              # SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, etc. (never commit)
│
├── frontend/
│   ├── index.html        # Landing + Spotify login
│   ├── intent.html       # Intent input screen
│   ├── nowplaying.html   # Now playing + acoustic field renderer
│   ├── territory.html    # Acoustic territory scatter view
│   ├── acoustic-field.js # Canvas renderer — standalone, no dependencies
│   └── style.css         # All shared styles using design tokens above
│
├── .gitignore            # Must include: .env, __pycache__, *.db, node_modules
└── README.md
```

---

## SECTION 9 — API ROUTES

```
GET  /auth/login                  → Spotify OAuth redirect
GET  /auth/callback               → Exchange code, store tokens, redirect to /library/import
POST /library/import              → Batch fetch user library, compute 5D, store in DB
GET  /library/status              → Import progress (processed / total tracks)

POST /recommend                   → {intent: str, n: int} → ranked tracks + 5D coords
POST /arc/generate                → {intent: str, duration_minutes: int, shape?: str} → full arc
GET  /arc/{session_id}            → Retrieve saved arc
POST /arc/{session_id}/signal     → {type: "skip"|"replay"|"volume", timestamp_ms: int, ...}

GET  /territory                   → All user tracks with 5D coords (for scatter plot)
GET  /tracks/search               → {coords: dict, n: int} → k-NN search by raw coordinates
GET  /tracks/{spotify_id}         → Track details + 5D coordinates

GET  /health                      → Service health check
```

---

## SECTION 10 — ENVIRONMENT VARIABLES

```bash
# backend/.env — never commit this file
SPOTIFY_CLIENT_ID=your_spotify_app_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_app_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/auth/callback
OPENAI_API_KEY=your_openai_key
# OR:
ANTHROPIC_API_KEY=your_anthropic_key
SECRET_KEY=long_random_string_for_session_signing
DATABASE_URL=sqlite:///woody.db
```

---

## SECTION 11 — BUILD SEQUENCE (DO NOT DEVIATE FROM ORDER)

Prototype priority is to have a working demo of the core loop. Nothing else matters until the core loop works.

### Phase 1 — Core Loop (Build This First, Demo This)

```
Step 1: Spotify OAuth flow → access token stored
Step 2: Library import → batch Audio Features → 5D coords stored in DB
Step 3: Intent input → LLM → 5D target (with keyword fallback)
Step 4: k-NN with weighted distance → ranked track list returned
Step 5: Session arc generation → ordered track sequence (beam search, transition coherence)
Step 6: Minimal frontend — dark, clean, functional. No elaborate visuals yet.
         index.html → intent.html → results view → arc view
Step 7: Acoustic field canvas renderer (nowplaying.html)
```

### Phase 2 — Session Experience

```
- Full intent screen (tripartite: internal state + context + desired state)
- Spotify playback SDK integration (actually play the arc)
- Signal capture (skip, replay, volume events) → log to DB
- Soft Pause / Acoustic Hold state
- Session arc visualization (the arc path canvas)
- Territory scatter plot (energy × warmth 2D view)
- Basic shareable artifact generation
```

### Phase 3 — Forks and Demos

```
Fork the core into 3 demo variants:
1. Zone 2 Run Arc — arc for heart rate zone 2 running
2. Focus Session Builder — lock-in arc with Baseline Rise shape
3. DJ Set Analyser — paste tracklist → generate acoustic arc of the set
```

---

## SECTION 12 — FRONTEND SCREEN SPECS

### `index.html` — Landing / Login
- Full-screen dark background (`--void`)
- Centred: "WOODY" wordmark (Syne 800, `--moon`)
- One-line description below (Epilogue 300, `--moon` at 60% opacity)
- "Connect Spotify" button — teal, clean, no decoration
- Grain overlay
- Nothing else

### `intent.html` — Intent Input
Three text input areas (can be simple `<textarea>` for prototype):
1. **"How do you feel right now?"** — internal state
2. **"What are you doing?"** — external context
3. **"Where do you want to get to?"** — desired state

Below inputs:
- Duration chips: 30min / 60min / 90min / 2hr (radio, default 90min)
- Arc shape selector (optional, default to inferred): Journey / Plateau / Single Apex / Inverse / Wave / Baseline Rise
- "Start session" button → calls `/arc/generate`, loads arc

Live coordinate preview: as user types in any field, show a small 5D target preview (five bars, one per dimension, Space Mono labels). This makes the acoustic translation visible.

### `nowplaying.html` — Now Playing
This is the core experience screen. Get this right.
- Acoustic field canvas: fills most of the screen — this IS the player, not a decorative element added to a player
- Track info: small bottom overlay. Artist + Title. Epilogue 300. Dim — not competing with the field.
- Arc progress: thin horizontal bar at very bottom. Proportional to session position.
- Next track: small text below arc bar. Greyed out.
- Soft pause button: minimal, not a standard play/pause button. The button action triggers the graceful ending sequence, not a hard stop.
- Nothing else on this screen. No nav. No clutter.

### `territory.html` — Acoustic Territory
- Canvas scatter plot: all user tracks plotted with energy on X axis, warmth on Y axis
- Each point colored by density (higher density → more amber, lower density → more cobalt)
- Hover over point: tooltip with artist / title / 5D coordinates
- Click point: "Start session from here" → pre-fills intent.html with these coordinates as the target
- Keep it simple. This is a diagnostic/exploration view, not the primary product.

---

## SECTION 13 — ACOUSTIC FIELD CANVAS RENDERER

The most important technical component. The rules it must follow:

```javascript
// File: frontend/acoustic-field.js
// Standalone — no external dependencies

function renderAcousticField(ctx, W, H, coords, t) {
    // coords = {energy, warmth, density, organicity, sacred} each 0–1
    // t = elapsed time in seconds
    
    const {energy, warmth, density, organicity, sacred} = coords;
    
    // Metabolic floor: minimum pulse rate prevents dead field
    const pulseRate = 0.2 + (energy * 1.6);  // 0.2 floor, scales to 1.8 at max
    const t_scaled = t * pulseRate;
    
    // Clear with void color (not transparent — preserves grain overlay interaction)
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);
    
    // Layer 1: Ground color pools (atmospheric depth)
    drawGroundPools(ctx, W, H, warmth, sacred, density);
    
    // Layer 2: World B — geometric field (Vera Molnár style, rule-based)
    // energy → transformation speed, density → layer count/complexity
    drawGeometricField(ctx, W, H, energy, density, t_scaled);
    
    // Layer 3: World A — fluid rounded forms (scientific illustration quality)
    // organicity → controls balance: more organicity = more fluid forms vs grid
    // warmth → governs breathing character
    drawOrganicForms(ctx, W, H, organicity, warmth, t_scaled);
    
    // Layer 4: Sacred geometry (mandala-like radial structures, only when sacred > 0.20)
    if (sacred > 0.20) {
        drawSacredGeometry(ctx, W, H, sacred, t_scaled);
    }
    
    // Layer 5: Pixelated figure (small, embedded in field, moves with data)
    // state: 'dancing' (high energy), 'drifting' (low energy), 'running' (mid energy + high density)
    const figureState = energy > 0.65 ? 'dancing' : energy > 0.35 ? 'running' : 'drifting';
    drawPixelFigure(ctx, W, H, figureState, energy, density, t_scaled);
}

// Ground pools: atmospheric colour depth behind the geometry
// These must be perceptible — not 2-3% opacity. Aim for 8-15%.
function drawGroundPools(ctx, W, H, warmth, sacred, density) {
    // Cobalt pool (upper left) — cold energy signal
    const g1 = ctx.createRadialGradient(W*0.30, H*0.22, 0, W*0.30, H*0.22, W*0.58);
    g1.addColorStop(0, `rgba(68, 85, 255, ${0.08 + density*0.05})`);
    g1.addColorStop(1, 'rgba(68, 85, 255, 0)');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
    
    // Teal pool (mid right)
    const g2 = ctx.createRadialGradient(W*0.72, H*0.50, 0, W*0.72, H*0.50, W*0.42);
    g2.addColorStop(0, `rgba(0, 229, 196, ${0.06 + sacred*0.04})`);
    g2.addColorStop(1, 'rgba(0, 229, 196, 0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
    
    // Amber pool (lower centre) — only when warmth > 0.30
    if (warmth > 0.30) {
        const g3 = ctx.createRadialGradient(W*0.50, H*0.78, 0, W*0.50, H*0.78, W*0.45);
        g3.addColorStop(0, `rgba(240, 160, 64, ${(warmth - 0.30) * 0.15})`);
        g3.addColorStop(1, 'rgba(240, 160, 64, 0)');
        ctx.fillStyle = g3; ctx.fillRect(0, 0, W, H);
    }
}
```

**Critical renderer rules:**
- Grain overlay is applied on top of the canvas via CSS `mix-blend-mode` or a separate overlay `<div>`. Do not bake it into the canvas.
- The canvas must resize properly on window resize — use `ResizeObserver`, not fixed dimensions.
- Wrap all canvas initialization in `window.addEventListener('load', ...)` to prevent `offsetWidth = 0` issues.
- For artifact canvases: use `document.fonts.ready.then(...)` before rendering any Syne/Epilogue text.
- All canvas `||fallback` dimension patterns: `const W = canvas.offsetWidth || 800`.

---

## SECTION 14 — WHAT NOT TO BUILD

Explicitly rejected. Check `SHELVED.md` for full list with reasons.

| Rejected feature | Why |
|-----------------|-----|
| Streaming/audio hosting | No licensing. Not the product. |
| Star ratings or reviews | We are not Pitchfork. Not RYM. |
| Follower/influence social model | Influence ≠ community. Rejected. |
| Glassmorphism, frosted blur | Aesthetic decision, closed. |
| Neon/synthwave aesthetic | Not this. Read VISUAL_LANGUAGE.md. |
| React/Next.js for prototype frontend | No framework overhead needed for prototype |
| Random particle systems | Generative noise is not World B. Rule-based only. |
| Album art as visual hero | The acoustic field is the hero. Album art is data, not design. |
| Tab-based navigation | Too generic. Navigation almost disappears in Woody. |
| Gamified reputation scores | Rejected architectural decision. |
| Spatial zoom navigation in territory | Too much cognitive overhead. |
| Building social features before there's something to show | Empty social surfaces are product antipatterns. |
| Generic AI chat interface as fallback | Rejected specifically — needs UX design, not a generated chat box. |

---

## SECTION 15 — USE CASE DEMOS (FORK TARGETS)

Once the core arc engine works, fork into these three demos from the same codebase:

### Demo 1: Zone 2 Run Arc
**The problem**: Running to music that gets you too excited defeats the zone 2 physiological purpose. Spotify can't take "same character, lower energy" as an instruction.
**Target**: energy 0.42, warmth 0.55, density 0.38, organicity 0.52, sacred 0.18
**Arc shape**: Plateau (sustained state, no spikes)
**Duration**: 60 min default
**UX**: Minimal. Just the acoustic field + arc progress. No distractions.

### Demo 2: Focus Session Builder (Lock-In)
**The problem**: Study playlists are either boring or too interesting. No one has solved the acoustic specificity of "deep focus for 90 minutes of coding."
**Target**: energy 0.35, warmth 0.55, density 0.25, organicity 0.65, sacred 0.45
**Arc shape**: Baseline Rise (starts 0.20 below target, rises over first 25 minutes to plateau)
**Duration**: 90 min default (one BRAC)
**UX**: Clean timer overlay. Optional "flow state" indicator based on skip rate.

### Demo 3: DJ Set Analyser
**The problem**: A Mixcloud tracklist is a flat list of names. The acoustic journey — the energy build, the warmth trajectory, the density peaks — is invisible.
**Input**: Paste Spotify playlist URL or newline-separated track names
**Output**: Acoustic arc visualization of the entire set — energy, warmth, density over time as a 2D canvas with annotated moments
**Use case**: DJs see their own acoustic patterns. Shareable. The "wow what is that?" artifact.

---

## SECTION 16 — EXISTING FILES (REFERENCE, DO NOT REBUILD)

| File | What's in it | What to do with it |
|------|-------------|-------------------|
| `woody-rec-engine.html` | Working prototype — 42 hardcoded tracks, keyword NL parser, 5D k-NN, canvas territory map | Extend: upgrade parser to LLM, swap hardcoded tracks for real Spotify API |
| `woody-design-system.html` | Design tokens, components, acoustic field renderer, Apsara figure | Reference for visual language. Not the primary build target. |
| `woody-acoustic-field-v3.html` | Web Audio API acoustic field with mic/file input | Valid foundation for real-time Essentia.js browser analysis |
| `woody-roadmap.html` | Visual product roadmap — 4 phases | Reference only |
| `PSYCHOLOGY.md` | Full music psychology research and arc design implications | **Read before designing any session logic** |
| `VISUAL_LANGUAGE.md` | Visual decisions, canonical for all UI | **Read before writing any CSS or canvas code** |
| `FEATURES.md` | All features with status | **Check before building any feature** |
| `SHELVED.md` | Rejected ideas with reasons | **Check before proposing any idea** |

---

## SECTION 17 — QUICK START

```bash
# Install dependencies
cd backend
pip install fastapi uvicorn spotipy openai python-dotenv sqlalchemy aiohttp pydantic

# Create .env (fill in your credentials)
cp .env.example .env

# Run backend
uvicorn main:app --reload --port 8000

# Serve frontend
python -m http.server 3000 --directory ../frontend
```

**First thing to build (validate the core):**

1. Hardcode 50 Spotify track IDs across diverse acoustic territory
2. Fetch their Audio Features from Spotify API
3. Compute 5D coordinates using the formula in Section 2
4. Accept intent text → LLM call → 5D target
5. Run weighted k-NN → return ranked list with coordinate bars

**Test query**: *"I'm about to go for an easy 45 minute run, zone 2, I want something that keeps me moving but doesn't spike my heart rate"*

**Expected output**: tracks with energy ~0.40–0.55, warmth ~0.50–0.65, density ~0.35–0.50. If your first result is a high-energy banger, the mapping or the parser is wrong.

---

*If anything in this document conflicts with something you're about to build — stop and resolve the conflict against this document first. The most common failure mode is building what seems obvious rather than what is specified here.*
