# Woody — Ideation Log
*Living document. Appended after every session. Cofounder notes between Madhu & Claude.*

---

## Session 1 — Architecture, Audio Intelligence, Behavioral Signals
*April 2026*

---

### The Core Thesis

Woody is not a smarter Spotify shuffle. It's a taste-and-intent engine for curator listeners — people who have a relationship with music, not just a playlist. The north star is: you open it, describe a feeling or a moment, and it finds territory you haven't been to yet but immediately recognises.

Discovery-first. Not recommendation. Not "more of what you like." The gap between what you know and what belongs to you.

---

### What We've Built (Current State)

- Next.js 15 app with Spotify OAuth (httpOnly cookies, token refresh)
- Intent parser: natural language → PersonaLens → Claude API (claude-haiku)
- Track suggestions: Spotify search + recommendations endpoint in parallel
- Web Playback SDK singleton (player.ts) — fixed bugs: 404 acceptance on device transfer, URI validation
- Three.js WoodyMap globe in progress (Cursor building)
- Memory layer / SavePointModal in progress (Cursor building)

**Running**: `npm run dev:spotify` on port 8888, hit `http://127.0.0.1:8888`

---

### The Spotify Audio Features Problem

Spotify deprecated the audio features API (energy, valence, danceability, acousticness) for new apps in late 2024. We have no ground truth audio features beyond what the recommendations endpoint loosely respects.

**Current workaround**: Spotify search + recommendations with seed genres + energy/valence params. Works but it's a black box.

**The real fix**: build our own audio intelligence layer. This is the whole conversation below.

---

### System Architecture — The Layers

#### Layer 0 — Audio Signal Extraction (P1)

**Source**: Every Spotify track exposes `preview_url` — a 30-second MP3, free, no extra auth. Ground truth audio. For full-song analysis, need a licensed source, but previews are enough for the features that matter.

**What we extract per track:**
- Rhythmic: BPM, beat strength, syncopation pattern, groove quantization
- Harmonic: key, mode (major/minor/modal), Camelot wheel position, chord complexity, tension/resolution ratio
- Spectral: frequency distribution, brightness, warmth, sub-bass presence, dynamic range
- Structural: song segmentation (intro/hook/break), repetition patterns
- Source-separated components: drums, bass, vocals, melodic instruments, textures separately
- Production: reverb amount, compression, sidechain presence, stereo width

**Tools:**
- Essentia (C++/Python, industry standard) — primary
- Librosa (Python) — easier entry point
- Demucs (Meta, open source) — source separation into stems
- MERT / CLAP — learned audio embeddings that go beyond handcrafted features

**Infrastructure**: Python microservice on Modal.com (serverless, scales to zero, fast cold start). Next.js backend calls it. Returns feature vectors, stores in DB against track ID.

---

#### Layer 1 — Feature Vectorization and the Musical Plane (P1)

Each song becomes a point in a high-dimensional feature space. Euclidean distance doesn't capture perceptual similarity — two tracks at 124 BPM in the same key can feel completely different based on texture.

**Kernel approach**: RBF (Gaussian) kernel over the feature space maps vectors into a space where distance actually correlates with perceptual similarity. Handles the non-linearity of musical taste.

**Visualization**: UMAP or t-SNE collapses the space to 2D for WoodyMap rendering. The actual routing algorithm runs in full high-dimensional space.

**Sub-genre / cross-genre elements**: Source separation makes this possible. If the percussion track in a UK rap song matches afrobeat polyrhythm signatures, that cultural tag gets attached regardless of Spotify's genre label. This is how we handle cross-genre influences (afrobeat elements, Jamaican roots, opium-era aesthetics, etc.) — by looking at the components, not the label.

---

#### Layer 2 — Lyric Feature Layer (P2)

Lyrics as a feature dimension, not just metadata.

- **Lyric repeatedness index**: ratio of unique phrases to total phrases. High repeatedness = anthem/hook-driven. Low = dense lyricism. Real distinguishing feature.
- **Emotional valence of lyric content**: NLP pass on lyric text
- **Lyric density**: words per bar, syllabic complexity
- **Semantic themes**: extracted topics, not just sentiment
- **Timestamp sync**: via Genius API. Locks lyric content to the moment in the track.

---

#### Layer 3 — Review Corpus & Persona Bots (P2)

**The insight**: different critics encode musical knowledge differently. Pitchfork hears a track through a different lens than a dance music blog, a Reddit audiophile thread, or a YouTube long-form essayist. Matching a user to a critic-lens gives a richer taste model than feature vectors alone.

**Implementation path:**
1. Scrape reviews from Pitchfork, AllMusic, RA, Bandcamp editorial, genre blogs, YouTube critique
2. NLP pass to extract feature tags from the language — critics naturally describe texture ("cavernous reverb"), structure ("the breakdown at 2:40"), cultural reference ("has the same nervous energy as early Burial")
3. Each source becomes a "reviewer bot" — a weighted vocabulary and tagging style
4. User gets matched to the reviewer bot whose language resonates most with how they describe what they want
5. That bot mediates curation — annotating and re-weighting feature vectors, not replacing them

**NLP alone?** No. NLP handles semantic/cultural dimension. Audio extraction handles signal dimension. They cross-validate: if a reviewer calls a track "cold and digital" but audio shows high warmth and reverb, you've found either a bad review or a mislabeled track.

**Data sources for training**: Pitchfork, AllMusic, Rate Your Music, RA, Bandcamp, Reddit music subs, YouTube essays, music blog archives.

---

#### Layer 4 — Discovery Algorithm (P1)

**Model**: Dijkstra's algorithm over the musical feature space. Each song is a node. Edge weights = feature distance. The algorithm traverses from "where you are" toward "where the intent points" with a priority queue.

**Priority queue weights:**
1. Feature distance to intent vector (closest match to described vibe)
2. Discovery score — inverse of user's play count for that track (main aim: 0-low listening count tracks)
3. Recyclability score — tracks with high replay rates in user history + similar feature profile get boosted
4. Harmonic compatibility — Camelot wheel distance (harmonic mixing key)
5. BPM delta — smooth transitions unless intent calls for a gear shift
6. Immediate context — last 3-5 plays weight more than full history

**Efficiency**: Coarse → fine search. Pre-filter by existing feature distances, narrow by genre/feature proximity, then mood proximity, then create tokens. Approximate nearest neighbour search (FAISS or Annoy) at scale.

**Expanding from existing**: User's radio playlists / listening history as starting nodes. Navigate outward from known territory into unknown territory. Known = grey/familiar on the map. Unknown = the territory to discover.

---

#### Layer 5 — Intent → Feature Space Mapping (P1)

Current: LLM parses intent into PersonaLens (energy, mood, texture, tempo). Good enough for now.

**Where this goes**: LLM maps intent not just into PersonaLens vocabulary but into a target *region* of the feature space. "Darker, more nocturnal" maps to specific coordinate ranges (lower brightness, higher reverb, lower valence, slower tempo contour), not just descriptive words. The Dijkstra search then has a real target in the feature space.

**The onSteer mechanism** (already built): re-POST intent as `"${original} → darker, more nocturnal"`. This is the directional navigation. In the feature-space model, this becomes a vector translation — move the target coordinates in the direction that corresponds to the steer.

---

### Felt — Behavioral Signal SDK

**What it is**: Standalone SDK. Sits on device. Processes passive behavioral signals. Outputs confidence-weighted engagement state + context classification. Reusable across products.

**Name rationale**: Everything it measures is something *felt*, not stated. Quiet, sits underneath. Like the material — absorbs, doesn't amplify.

**Why it's its own project**: The core logic (IMU signal processing, context classification, engagement scoring with uncertainty) is useful far beyond music. Wellness apps, focus apps, learning apps, gaming — all want contextual engagement signals without burdening the user.

---

#### Felt — Signal Sources

**Primary (no permission required):**
- IMU (accelerometer + gyroscope) — movement patterns, cadence, body lock, stillness
- Interaction events from the player — scrub-backs, volume adjustments, skip latency, replay events, session duration

**Secondary (opt-in):**
- Wearable heart rate (Apple Watch / Wear OS) — HRV elevation above workout baseline at specific timestamps
- DeviceMotion API (mobile web) — access to IMU without native build

**Shelved (permission cost too high):**
- Camera — too invasive during vulnerable listening moments. People don't want to be seen while they're deep in music.
- Microphone — same trust cost even if on-device only

---

#### Felt — Key Signals and What They Mean

**Cadence entrainment**: Running cadence (150-180 SPM) syncing to track BPM involuntarily. Detectable via accelerometer frequency correlation with audio beat grid. One of the strongest engagement signals — it's involuntary.

**Body lock**: Transition from movement to stillness at a specific timestamp. Stronger than the nod. The moment something hits so hard you stop.

**Scrub-back events**: Manually rewinding to a specific timestamp = strongest single interaction signal in the system. That moment mattered enough to seek back to.

**Volume adjustment + timestamp**: Cranking it at a specific moment is a positive signal correlated to that timestamp.

**Skip latency**: How far into a track before skipping. Gives you a rejection *timestamp*, not just a rejection.

**Sustained non-interaction**: Phone placed down, not touching it, track plays to completion. In context = high engagement. The system reads stillness correctly.

**Post-interruption behavior**: Got called away, came back. Did they scrub back to where they were? Let it auto-continue? Skip? Verdict on that track at that moment.

---

#### Felt — The Edge Cases

**Phone placed to the side**: IMU flatlines. What survives:
- Sustained non-interaction as engagement signal
- Post-session behavior as verdict
- Wearable data if available
- Design response: this is the success state. Woody doing its job well enough that you stopped managing it. Don't over-instrument this moment.

**Constant motion (running, gym)**: Absolute thresholds fail when baseline is always high.
- Fix: delta detection against rolling personal baseline, not absolute values
- Cadence acceleration at specific timestamps (ran faster for this section)
- Cadence sync with track BPM — involuntary entrainment
- Heart rate relative spike above workout baseline

**Sudden context switch (called away mid-session)**: Single aperiodic spike ≠ engagement.
- Require N consecutive beats of BPM-correlated motion before flagging
- Cross-correlate IMU time series against audio beat grid. Random movement is aperiodic, fails the correlation filter.
- External event detection: notification arriving → suppress engagement detector for that window

**The general principle — uncertainty over binary calls**: Don't commit to engaged/not-engaged. Maintain a probability distribution that updates with each observation. Low-confidence readings don't write to the user's feature embedding with full weight. High-confidence readings do. The model only learns from moments it's sure about.

---

#### Felt — Context Classification

Run context classification *before* interpreting any signals. The same accelerometer reading means completely different things in different contexts.

**Context types**: sitting/desk, walking/commute, running, gym, out-somewhere, stationary-not-desk

**Input from user**: soft context check at session start. Not a form — three taps max. "What's the vibe tonight?" with 4-5 options. This single input makes every sensor reading more interpretable without complex inference.

**Mid-session context switch**: Detect sustained pattern shift (high-motion → zero for 2+ minutes) → gentle ambient nudge. Not a popup. A quiet chip. The user confirms or ignores.

**Key principle**: Only break the user's flow when the reward is immediate and perceptible. If Woody asks something and the next 20 minutes is noticeably better, the user forms a habit around it voluntarily. Friction becomes ritual when ritual reliably produces felt value.

---

#### Felt — Song Timeline as Ground Truth

The most powerful output of Felt: **engagement heatmap per track, per user**.

Cross-referencing:
- Timestamp of engagement signal (body lock, scrub-back, volume up, cadence spike)
- Audio feature state at that exact second (what the drums are doing, chord change, spectral shift, bass pattern)
- Lyric content at that timestamp (Genius sync)
- Behavioral signal confidence weight

Result: not "you like hip-hop" but "you respond to syncopated snare patterns with prominent reverb tail when the vocal drops out, consistently, across sessions."

That's a different resolution of taste model than any current system has.

**The moment-sharing surface**: The 8-12 seconds of a track that consistently generate peak engagement. Potential product surface — discovery through a specific moment, not through a genre label.

**Cross-user validation**: Use aggregate engagement heatmaps only to catch catastrophic recommendation failures. A drum texture that generates engagement spikes across users who otherwise listen to completely different things tells you something real about the music itself, not about the listeners. Use sparingly. Never to homogenize individual journeys — the micro-mechanisms of personal discovery are the whole product.

---

### Open Questions / Flagged for Later

- **BSA report** — Madhu referenced this, unclear what it stands for. Needs clarification.
- **Shazam-style fingerprinting** — fingerprinting specific timestamps for cross-track moment matching ("0:12 of X sounds like this moment in Indian classical"). How Shazam works: spectrogram landmarks (constellation map), hash them, match against database. Worth understanding for the timestamp feature layer.
- **Music debate engagement** — letting Woody engage in music arguments with the user to build taste model. "Why does this remind you of that?" Interesting as a taste-capture mechanism, complex to build. Flag for P2.
- **Lyric: alliteration, sibilance and other audio-poetic features** — treating vocal performance as a sound feature, not just a lyric feature. Sibilance is spectral, alliteration is rhythmic/phonetic. Interesting for the audio extraction layer.
- **Recyclability model** — needs its own model. Inputs: historical replay rates for tracks with similar feature profiles, session context, time since last play. Not built yet.
- **Idea board feature** — safe space for exploration, separate from the main discovery flow. Flagged P1 in PRD.
- **/flagforimprovement** — Madhu flagged something early in conversations, never clarified what. Ask next session.

---

### UX Principles Locked In

1. **The system earns the right to learn from you, not demands it.** Passive signals by default. Explicit input only when the reward is immediate and felt.
2. **Only interrupt the flow when the value is perceptible.** If asking produces noticeably better music, the friction becomes ritual.
3. **Phone to the side is the success state.** Don't over-instrument immersion. Read absence of interaction correctly.
4. **Micro-mechanisms of individual discovery are the whole product.** Cross-user signals only for catastrophic failure detection. Never to flatten personal journeys.
5. **Watches how you move, not how you look.** Privacy design principle. Behavioral, not biometric.
6. **Confidence over binary calls.** The system hedges when uncertain. Never confidently wrong.

---

### Build Sequencing

**Woody — Immediate (Cursor + validation):**
- WoodyMap Three.js globe visual (Cursor building)
- Memory layer + SavePointModal (Cursor building)
- Musical heuristics: BPM continuity, Camelot wheel, energy curve in track sequencing

**Woody — Next:**
- LLM attribute estimation as stopgap (extend existing reasons prompt to also return estimated audio attributes — fast, costs nothing extra, unlocks heuristics layer immediately)
- Intent → feature-space region mapping (not just PersonaLens vocabulary)

**Felt SDK — Parallel, separate repo:**
- Spec as standalone
- Start with browser DeviceMotion API (mobile web, no native required yet)
- Context classification + delta engagement scoring
- No native dependency until React Native build

**Audio Intelligence Microservice — Medium term:**
- Python + Essentia on Modal.com
- Feature extraction from preview_url
- Returns feature vectors per track ID
- Replaces LLM estimates with real signal
- Schema locked early so everything else builds against it

---

*Last updated: Session 1, April 2026*
*Next: Validate Cursor's WoodyMap build. Write Cursor prompt for musical heuristics layer.*

---

## Session 2 — Build Validation, Design Fixes, Vision Check
*April 2026*

---

### What Got Built (Cursor)

- WoodyMap camera rework: close to surface, fog, constrained OrbitControls
- MapNode redesign attempt: torus rings, Html labels (both wrong — see below)
- HomeScreen 3-state layout (empty / loading / active)
- MiniPlayer with pause only (incomplete — needs seek bar, prev/next)
- Intent chip top-left, rotating prompts in empty state

### What's Broken / Wrong

**drei `<Html>` labels**: Renders as blurry ghost artefacts at close camera distance. Wrong tool entirely. Replace with projected screen-space 2D overlay system (project 3D → screen coords via camera, render absolutely positioned DOM elements outside the Canvas). No drei Html anywhere in MapNode.

**Node aesthetic**: Solid saturated circles with prominent torus rings on every node = radar display aesthetic, wrong. Design system specifies matte fill + faint emissive glow + orbit ring on playing node only. Fix: three-layer sphere stack (core + inner halo + outer atmosphere), orbit ring only for playing state.

**Node positioning**: Nodes placed on back hemisphere (lng offsets pushing behind the globe) render as floating dots off the edge in black space. Fix: constrain lng to front hemisphere range, cull nodes with z < 0.1 in camera space.

**Recommendations 404**: Spotify progressively restricting recommendations API for newer apps since late 2024. Not fixable. Search fallback works, tracks are good quality. Ignore the log noise.

**MiniPlayer**: Only play/pause. Needs: seek bar (2px thin line, not chunky), previous, next/skip, small album art thumbnail (40x40px max). No large album art anywhere.

### Spotify Connection — Fixed

- Root cause 1: Running in Cursor's built-in browser (no Widevine DRM → EMEError)
- Root cause 2: Next.js resolving itself as localhost internally while redirect URI is 127.0.0.1
- Fix 1: Open at `http://127.0.0.1:8888` in Chrome (not Cursor browser)
- Fix 2: Added `AUTH_APP_URL=http://127.0.0.1:8888` to .env.local
- Fix 3: Run `npm run dev:spotify` (binds to 127.0.0.1 explicitly)
- Status: Connected and playing (Alfa Mist, Emmavie — good taste confirmed)

### Design System Audit

The DESIGN-SYSTEM.md vision is correct. The implementation diverges from it. Key gaps:

- Accents should appear at 60-80% opacity, never full — currently full saturation
- "No neon glow on dark" is an explicit anti-pattern — current nodes violate this
- Orbit ring = only playing node, slow rotation (10-14s), opacity 0.2-0.3
- Labels = bare Inter type with text-shadow, no card/border/background
- Terrain colour: shader produces cool grey, design system specifies warm soil tones (#0F0F0D warm, not blue-black)
- "Cards with borders for tracks" is an explicit anti-pattern — was violated in v1 labels

### Does Woody Have Real Value?

Honest assessment recorded:

YES — the problem is real and underserved. Curator listeners who think in vibes and reference points have no tool that speaks their language. The intent-based approach + territory metaphor is novel. Felt SDK is independently valuable as B2B infrastructure.

STRUCTURAL RISK — Spotify dependency. Audio features deprecated late 2024. If Web Playback or recommendations get further restricted, Woody breaks. Fix: build audio intelligence layer (Essentia) so Spotify is a playback layer only, not the curation brain.

HONEST GAP — Current state is an intent parser with a globe. The full vision (audio intelligence + behavioral signals + territory map + musical heuristics) is months of engineering. The path from here to defensible is building the audio layer.

### Vision Expansion — Group Sessions / Listening Parties

Madhu identified a gap: the product is deeply singular (one territory, one taste). Group sessions introduce competing intents. How do you blend multiple PersonaLenses? Whose steer wins?

Conceptual direction: two territories overlapping, finding shared ground. The map shows both. The blend of intents creates a new territory neither person would find alone. This is P3 but the metaphor is right.

### Democratisation Tension

Ambition: intuitive enough for everyone, not just music nerds.
Reality: the current ICP (curator listeners who speak in genre + vibe language) is right for day one. "For everyone" requires a different intent capture layer — guided flows, mood boards, reference artist selection. Build for the core ICP with obsessive precision first. If it's undeniably right for them, the DNA is strong enough to expand.

### Cursor Prompts Written This Session

1. Camera rework (keep sphere, get close to surface) ✓ implemented
2. Node redesign v1 (torus rings — wrong, needs redo) ✓ implemented but needs fix
3. HomeScreen 3 states ✓ implemented
4. Emergency label size fix (distanceFactor — partial fix, drei Html still wrong)
5. Node floating fix (constrain to front hemisphere) — pending
6. Projected 2D label system (replace drei Html) — pending  
7. Node organic glow redesign (three-layer sphere, orbit ring only playing) — pending
8. MiniPlayer controls (seek bar, prev/next, no large album art) — pending

---

*Last updated: Session 2, April 2026*
*Next: Implement node fix prompts (floating, labels, glow), MiniPlayer controls. Then: vision synthesis conversation.*

---

## Session 3 — Vision Synthesis, Multi-Service Architecture, Parallelisation
*April 2026*

---

### The Big Architectural Shift

Woody is not a Spotify interface. Woody is a **music intelligence layer that sits on top of everything**. The playback service is a renderer — whatever the user connects. This reframes the entire product and solves the Spotify dependency risk.

**Multi-source track model:**
```
Track {
  woodyId: internal_id,
  name, artist, album,
  sources: {
    spotify: "spotify:track:xxx",
    appleMusic: "am:xxx",
    tidal: "tidal:xxx",
    youtube: "youtube:xxx",
    soundcloud: "sc:xxx"
  },
  features: { ... } // from audio intelligence layer
}
```

Woody resolves the track, routes to whichever source the user has active. No single platform owns the experience.

### New Features Decided

**Queue append** (Spotify: `POST /me/player/queue`) — immediate, trivial, huge UX win. Queue a full session in one tap.

**Playlist creation** (Spotify: `POST /users/{id}/playlists` + `/playlists/{id}/tracks`) — save sessions as real Spotify playlists. Natural extension of SavePoint concept.

**Context layering** — two modes for the intent input:
- REDIRECT: clear base intent, start fresh, map resets
- LAYER: add constraint on top of existing intent, map refines not resets
  PersonaLens merge in the prompt: "here's the existing lens, here's the new layer, keep foundational character, apply additional constraint"
  UI: base intent chip stays, second smaller `+` input appears below for layers
  Memory: session gets `contextLayers: []` array — breadcrumb of navigation

**Woody Radio** — continuous stream via Dijkstra traversal + auto-queue + musical heuristics connecting transitions. Platform-agnostic. Better than Spotify Radio because it uses our feature matching.

### Data Enrichment Sources

**Free / Open:**
- MusicBrainz — comprehensive metadata (instrumentation, recording location, personnel, release context). No auth. The ground truth for music facts.
- Last.fm — tag-based affinity data, real listening patterns, artist similarity. Free API.
- Genius — lyrics with timestamps. Free API. Feeds lyric feature layer.
- AcousticBrainz — deprecated but data downloadable, audio features for 9M tracks.

**Video / DJ content:**
- YouTube Data API — music videos, live performances, Boiler Room sets, DJ mixes. Accessible.
- SoundCloud API — DJ mixes, underground content, indie artists. Free tier.
- Mixcloud API — DJ sets specifically. Legal, good coverage.

**Premium music services (playback routing):**
- Apple Music: MusicKit JS — browser SDK, comparable to Spotify Web Playback. Opens iOS/Mac user base.
- Deezer: JS SDK, 30s previews free, full playback with subscription.
- Tidal: API exists, HiFi audio.

### Musical Heuristics Layer

BPM continuity, Camelot wheel (harmonic mixing), energy curve — these go into `lib/heuristics.ts` as a standalone scoring module. Takes two tracks, returns a compatibility score. Used by:
- Track sequencing (order suggestions by compatibility with what's playing)
- Queue building (Woody Radio)
- Dijkstra traversal edge weights (future audio intelligence)

Camelot wheel compatibility matrix — 12 keys × 2 modes (major/minor), adjacent keys are compatible, relative major/minor are compatible, energy jump is a 4th. This is well-documented music theory, implement as a lookup table.

### Parallelisation Plan

BATCH 1 (run simultaneously — no file conflicts):
- Map node labels + visual redesign (WoodyMap.tsx, MapNode.tsx)
- MiniPlayer full redesign (MiniPlayer.tsx)
- Musical heuristics module (new: lib/heuristics.ts)
- Multi-source track architecture (lib/types.ts additions, new: lib/resolver.ts)
- Data enrichment foundation (new: lib/enrichment/musicbrainz.ts, lastfm.ts, genius.ts)

BATCH 2 (after Batch 1 — some dependencies):
- Context layering in intent pipeline (lib/intent.ts, app/api/intent/route.ts)
- Spotify queue + playlist API routes (new routes, lib/player.ts additions)
- HomeScreen context layer UI (HomeScreen.tsx)

---

*Last updated: Session 3, April 2026*
*Next: Run all Batch 1 Cursor prompts simultaneously. Validate. Then Batch 2.*
