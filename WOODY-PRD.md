# Woody — Product Requirements Document
**Version**: 0.3 | April 2026  
**Authors**: Madhu Racherla, Claude  
**Status**: Living document — append, never overwrite

---

## The One-Line Brief

Woody is a taste-and-intent engine for curator listeners — people who have a relationship with music, not just a playlist. You describe a feeling or a moment, and Woody finds territory you haven't been to yet but immediately recognises as yours.

---

## Problem Statement

Streaming platforms optimise for engagement and retention, not for taste cultivation. Their recommendation systems are fundamentally backward-looking: they find more of what you already listen to, because familiarity drives streams. This works for casual listeners and is entirely wrong for curator listeners — people who think about music the way others think about books, who want the gap between what they know and what belongs to them to get smaller over time.

The experience this creates for curator listeners: you open Spotify with a specific feeling in mind, get algorithmically correct but emotionally inert suggestions, spend ten minutes searching, settle for something adjacent, and close the app feeling like you missed something. The discovery moment — finding a track that immediately feels like it should have always been yours — happens by accident on current platforms, never by design.

Woody is designed around that moment. Everything it builds exists to make it happen reliably.

---

## Target Users

### Primary: The Curator Listener

**Who they are**: Music is identity infrastructure for these people. They have opinions about production choices. They notice when a playlist transitions badly. They have sub-genres named after dead cities and know why. They represent 15–35% of streaming subscribers but a disproportionate share of cultural authority — they are the tastemakers casual listeners follow.

**What they want**: Discovery that respects musical nuance. Intent-based navigation ("I want something that feels like walking through a night market, acoustic, no western pop structure"). A way to record and revisit moments of discovery. A sense that the system is learning *their* taste, not averaging it against everyone else's.

**What they do not want**: Gamified streaks. Social sharing prompts. Genre labels that ignore cross-cultural influence. Recommendations that are demonstrably "popular in your genre."

### Secondary: The Listening-Party Host / DJ

Someone who curates for others in real time — a dinner party, a drive, a set. They need session continuity, queue management, mood-to-mood transitions that feel considered, and the ability to steer a session mid-flow. They are a stretch target for v1 but influence how we design the queue engine from the start.

### Not in scope (v1): The Casual Listener

Casual listeners want low friction and high familiarity. Woody is the opposite. Designing for them now would compromise the product for the people it's actually for.

---

## Goals

### User Goals

1. A user can describe a mood, feeling, or context in plain language and receive tracks that genuinely match — vibe-matched, not just genre-matched — within 8 seconds.
2. A user navigating the map for 20 minutes discovers at least 2 tracks they immediately want to save that they had never heard before.
3. A user who returns after a week perceives a noticeable improvement in how well Woody knows them — first suggestions more on-point than first session.
4. A user can steer a listening session in real time (darker, more energy, more acoustic) without leaving their flow state.
5. A user can save and name a specific discovery moment and return to it as a meaningful place on their map.

### Business Goals

1. 60% of first-time users who submit an intent play at least one track in their first session.
2. 30-day retention of 40% — users who return within a month of their first discovery session.
3. 70% of retained users have at least one SavePoint — a signal they consider the product theirs.
4. NPS among curator listeners of 50+ within 6 months of public launch.

---

## Non-Goals (v1)

**Social / sharing features.** Woody is not a social platform. No profiles, follower counts, or share-to-Instagram. The listening experience is private. Sharing may come in v2 if the product earns the trust for it.

**Group listening / listening parties.** Multi-user sessions are architecturally and UX-complex. The product must be excellent for the solo listener first.

**Podcast, audiobook, or spoken-word content.** Woody's audio intelligence is built around music signal features. Non-music audio is a permanently different product.

**Lyrics display.** The Lyric Feature Layer is P2. Genius timestamp sync is a future hook. Not surfaced in v1.

**Offline playback.** Web Playback SDK requires a live connection and Premium auth. Offline is a native app problem.

---

## User Stories

### Core Discovery Flow

- As a curator listener, I want to type a vibe, feeling, or context in plain language so that I get tracks that match how I'm thinking about the moment — not just a genre label.
- As a curator listener, I want results on a visual map so that I can see how tracks relate spatially and navigate by feel, not by clicking through lists.
- As a curator listener, I want to click a node on the map and have it play immediately so that the gap between discovery and listening is zero.
- As a curator listener, I want to drag the globe in a direction so that the system steers — darker, warmer, more electronic — and updates suggestions without me having to type again.
- As a curator listener, I want to add a layer on top of an existing session ("now make it more acoustic, keep the energy") so that I can refine a vibe without losing what's already working.

### Map and Territory

- As a curator listener, I want the map to show distinct musical territories so that I understand what regions of taste I'm exploring and which are still unmapped for me.
- As a curator listener, I want tracks I've already heard to look different from new discoveries so that I can see the boundary between my known territory and what's beyond it.
- As a curator listener, I want the currently playing track clearly identified on the map so that I always know where I am.
- As a curator listener, I want track labels to appear only on hover or when playing so that the map feels like terrain, not a list.

### Memory and SavePoints

- As a curator listener, I want to save the moment I'm in — track, vibe, session — so that I can return to it later as a named place in my taste map.
- As a curator listener, I want to name my saved moments in my own language so that the map becomes a personal record, not generic history.
- As a curator listener, I want saved points to persist between sessions so that the map grows over time into a real document of my taste.
- As a curator listener, I want saved points to appear on the globe as permanent, defined nodes so that my taste history has a physical location.

### Playback and Queue

- As a curator listener, I want the playback bar to show where I am in a track and let me seek so that I have full control without leaving the map.
- As a curator listener, I want to skip to the next suggestion without leaving the map so that listening is navigation.
- As a curator listener, I want to add a track to a queue from the map so that I can curate a session path without committing immediately.
- As a curator listener (DJ persona), I want to queue all map suggestions in one action so that I can load a session without micro-managing each track.

---

## Requirements

### Must-Have — P0 (cannot ship without these)

**M1 — Intent parsing to track results**  
Natural language intent → PersonaLens → track search → 4–6 track suggestions within 8 seconds.  
*Acceptance*: "late night drive, no sad piano" returns instrumentally consistent tracks, not just genre-labelled ones.

**M2 — WoodyMap globe rendering**  
Three.js globe with terrain shader, correct camera framing, musically meaningful node placement. Nodes: on visible hemisphere, correctly sized (small, not pins), correct playing/known/unknown states, named zone territories with colour identity.  
*Acceptance*: submit intent, nodes appear on front face, no floating artefacts, zones readable as distinct regions.

**M3 — Playback via Spotify Web Playback SDK**  
Click node → plays in-browser. Play/pause, prev/next, seek functional. MiniPlayer shows art, title, artist, seek bar.  
*Acceptance*: play a track, seek to 50%, skip to next, pause — all without error.

**M4 — Globe steering**  
Drag globe → detect azimuth/polar delta → re-query with directional steer → new suggestions appear.  
*Acceptance*: drag left → warmer/higher momentum suggestions. Drag right → cooler/more still.

**M5 — SavePoint creation**  
Playing → tap save → name modal → saved to memory as permanent node on map.  
*Acceptance*: save a point, refresh, node persists in correct map position.

**M6 — Spotify OAuth**  
Full OAuth flow, token in httpOnly cookie, player initialises. Reconnection on expiry.  
*Acceptance*: disconnect, reconnect, play a track — all without server restart.

---

### Should-Have — P1 (high-priority fast-follows)

**S1 — Context layering**  
Second intent → classify layer vs redirect → adjust suggestions. Mode indicator shows user which mode activated. This is the navigation paradigm that separates Woody from a one-shot search tool.

**S2 — LLM audio attribute estimation**  
Extend reasons prompt to return estimated BPM range, energy (0–1), valence (0–1), key character, texture tags per track. Costs nothing extra. Unlocks heuristics layer immediately.

**S3 — Musical heuristics layer**  
Camelot wheel compatibility, BPM continuity, energy curve scoring. Used to: rank queue order, surface transition quality, eventually drive Woody Radio.  
*Acceptance*: queue 4 tracks → order reflects harmonic compatibility, not random.

**S4 — Map zone definition**  
Named territories on the globe. Not genre labels — textural ones: "Dark matter", "Signal terrain", "Organic country", "Synthetic plain". Stronger colour washes, territory text at low opacity on globe surface. Nodes cluster in appropriate zones based on tone classification.

**S5 — Queue engine**  
Add-to-queue, view queue in order, reorder, clear, queue-all. Queue uses heuristics for optimal order.  
*Acceptance*: build 5-track queue, reorder, play in order with automatic advance.

**S6 — Data enrichment**  
MusicBrainz (tags, release year, MBID) + Last.fm (listener count, similar, folksonomy tags) async per suggestion. Updates feature object after map renders.  
*Acceptance*: submit intent, within 5 seconds each node has additional tag metadata on hover.

**S7 — Multi-source architecture**  
`woodyId` as internal identifier, `sources` dict mapping service IDs, resolver stub. Discovery is service-agnostic. Playback routes to connected source.

---

### Future Considerations — P2 (design for, don't build yet)

**F1 — Audio intelligence microservice**: Python + Essentia on Modal.com. Feature extraction from `preview_url`. Real audio features replace LLM estimates. The ceiling-raiser for the whole product.

**F2 — UMAP feature space**: High-dimensional feature vectors collapsed to 2D → actual map coordinate system. Tracks land where they belong musically. Requires F1.

**F3 — Felt SDK**: Behavioral signal processing — IMU cadence entrainment, body-lock detection, scrub-back events. Per-track engagement heatmap. Standalone SDK, separate repo, Woody is first integrator.

**F4 — Woody Radio**: Continuous station mode. Dijkstra traversal from current track through feature space, auto-queuing, engagement-signal steering. Never repeats. Always moving forward.

**F5 — Reviewer bots / critic-lens matching**: NLP over Pitchfork, RA, AllMusic, Bandcamp. Each source = weighted vocabulary. User matched to critic-lens whose language resonates with their taste descriptions.

**F6 — Lyric feature layer**: Lyric repeatedness index, density, emotional valence, timestamp sync via Genius. Locks lyric patterns to audio signal moments.

**F7 — Moment sharing**: 8–12 second peak-engagement clip per track (from Felt). Shareable as a precise reference. Discovery through a specific moment, not a genre label.

---

## Current Architecture State

### Built and working
- Next.js 15, App Router, TypeScript, Tailwind
- Spotify OAuth (httpOnly cookie, token refresh, dev on `127.0.0.1:8888` per `npm run dev`); Web Playback via `lib/player.ts`
- Intent: natural language → Gemini or Claude (`AI_PROVIDER`) → `PersonaLens`; candidate pool via Spotify search + Last.fm; **4–6 suggestions** when the pool is large enough (`lib/intent.ts` `finalSuggestionCount`); response includes **`intent_latency_ms`**
- **Globe steer (M4):** client sends `steer: { azimuth, polar }` to `POST /api/intent`; server applies `applyGlobeSteerToLens` (`lib/onSteer.ts`) after NL parse — no appended steer text on the base intent
- **Zones (S4):** shared `lib/mapZones.ts` (`ZONE_SPECS`, `zoneAnchorLatLng`); suggestions carry `zoneId`; `useMapNodes` blends coordinates toward zone anchors
- **Queue (S5):** `usePlayback` session queue, `rankByTransition` tail ordering, reorder / queue-all / auto-advance; `SessionQueuePanel` expand/collapse toggle; hydration via `lib/sessionQueueStorage.ts`
- **LLM audio estimates (S2):** reasons JSON includes BPM, energy, valence, Camelot key, **`textureTags`**
- **Enrichment (S6):** `POST /api/enrich` per track; client runs requests **sequentially ~1100ms apart** after map render to respect MusicBrainz rate limits
- **Multi-source stub (S7):** `Track.woodyId` / `Track.sources.spotify`; new tracks from `spotifyTrackToWoody`; `spotifyPlaybackUri()` in `lib/sources.ts`
- Context layering (S1): `classifyIntentMode` + HomeScreen mode chip (`+ layer` / `->`)
- SavePoints: localStorage; save requires active `sessionId` (`SavePointModal`)
- Tests: `npm run test` — `lib/heuristics.test.ts` (Vitest)

### Verify manually
- Layer vs redirect UX and intent chip accuracy after multi-turn sessions (S1)
- **M3** regression checklist: [docs/M3_PLAYBACK_REGRESSION.md](docs/M3_PLAYBACK_REGRESSION.md)

### Implementation note (repo SSOT)
- **Shipped product surface:** this Next.js app. The long-form [PRD.md](PRD.md) / [BUILD_BRIEF.md](BUILD_BRIEF.md) describe a broader arc engine and backend shape for later phases — see [docs/IMPLEMENTATION_SSOT.md](docs/IMPLEMENTATION_SSOT.md).

### P2 — not started here
- F1–F7 (Essentia / UMAP / Felt / Radio / reviewers / lyrics / moment clips) remain design-first; use `packages/acoustic-service` when promoting F1.

---

## Known Technical Constraints

**Spotify audio features API deprecated** for new apps (late 2024). Cannot get energy/valence/tempo from Spotify. Workaround: LLM estimation + Last.fm tags. Long-term: Essentia from `preview_url`.

**Spotify recommendations returning 404** for new apps. Fallback is Spotify search with genre/mood query terms. Working in practice.

**Spotify Web Playback SDK requires Widevine DRM.** Only Chrome/Edge. Not Cursor's built-in browser, Safari, or Firefox. Dev must happen in Chrome at `http://127.0.0.1:8888`.

**Spotify Premium required for Web Playback.** Non-premium users get no in-browser playback. Multi-source architecture partially addresses this.

**MusicBrainz rate limit: 1 req/sec.** Enrichment must be rate-limited. The `POST /api/enrich` route runs MB + Last.fm in parallel per call; the **client** (`HomeScreen`) issues enrich requests **sequentially with ~1100ms spacing** per suggestion set so MB is not hammered. Map renders immediately; metadata fills in on hover as results arrive.

---

## Success Metrics

### Leading Indicators (measure weekly post-launch)

| Metric | Definition | Target |
|--------|-----------|--------|
| Intent-to-play rate | % of sessions where user submits intent AND plays ≥1 track | 60% |
| First-play latency | Time from intent submission to first track playing | <10s |
| Session depth | Average tracks played per session | ≥3 |
| Steer rate | % of active sessions where user steers (drags globe or adds layer) | 25% |
| SavePoint creation rate | % of sessions with ≥1 SavePoint created | 20% |
| Map interaction rate | % of sessions where user clicks/hovers beyond first suggestion | 50% |

### Lagging Indicators (measure monthly)

| Metric | Definition | Target |
|--------|-----------|--------|
| 30-day retention | Users who return within 30 days of first session | 40% |
| SavePoint accumulation | Avg SavePoints per retained user at 30 days | ≥3 |
| Session frequency | Avg sessions per retained user per week | ≥2 |
| NPS (curator segment) | Net Promoter Score among target users | 50+ |

---

## Open Questions

| Question | Owner | Blocking? |
|----------|-------|-----------|
| LLM estimation vs audio microservice — which first for BPM/energy/key? | Engineering | Yes — heuristics needs some source of truth |
| How do we handle non-Premium users? Link-out or block? | Product | Yes — affects onboarding |
| What are the exact named territories on the map? Need Woody-specific vocabulary, not genre labels | Design/Product | Yes — S4 blocks on this |
| Multi-source OAuth flows (Apple Music, Tidal) — architecture decisions needed before resolver | Engineering | No — not v1 |
| BSA report — what does this refer to? | Madhu | No |
| Do we store user data server-side, or entirely localStorage/cookie? | Engineering/Legal | Yes — architecture + compliance |

---

## Roadmap

### Now — Foundation Stability (current sprint)

The app works but the experience is broken enough that first impressions are bad. Fix what's visible before building what's new.

- Globe camera and layout fix — centered, correct framing
- Map zone definition — named territories, stronger colour washes, smaller nodes, zone text at low opacity
- Wire heuristics into intent pipeline — LLM estimates attributes → heuristics scores transitions → suggestions ordered by session flow
- Wire enrichment per suggestion — async after map renders, updates node metadata on hover
- Context layering UI verified — layer vs redirect indicator working

### Next — Discovery Engine (4–6 weeks)

The map is visual. Now make it musical.

- LLM audio attribute estimation — extend reasons prompt to return estimated BPM, energy, valence, key
- Meaningful map coordinates — use estimated energy/tempo for actual lat/lng, not tone cluster + jitter. Tracks close in feature space close on the map.
- Queue engine — add-to-queue, view, reorder, queue-all, heuristic ordering
- Woody Radio prototype — continuous mode from current track, auto-queue via heuristics, manual steer mid-session
- Multi-source type architecture — woodyId + sources dict, resolver stub ready for Apple Music / Tidal

### Later — Intelligence Layer (2–4 months)

The product starts learning. The map becomes a personal document.

- Audio intelligence microservice — Essentia on Modal.com, real features from preview_url, replaces LLM estimates
- UMAP coordinate system — feature-space 2D reduction becomes globe coordinates. The map is musically real.
- Felt SDK — behavioral signals, engagement heatmap per track, passive taste model
- Reviewer bots — critic-lens matching, NLP over music review corpus

### Horizon — The Full Vision

- Moment sharing (8–12s peak engagement clip, shareable)
- Group listening / session handoff
- Lyric feature layer
- Cross-platform: Apple Music, Tidal, YouTube Music as full playback citizens
- Native mobile (React Native) for full Felt SDK capability
- Woody Radio at scale (Dijkstra + FAISS approximate nearest neighbour)

---

## Design Principles

Every product decision gets tested against these. From DESIGN-SYSTEM.md — the source of truth.

**The one sentence**: Woody should feel like a living terrain of taste — grounded, warm, and quietly intelligent. It changes personality without losing identity.

**Should never feel**: Sci-fi / space / neon. Generic dark mode SaaS. Spotify clone. Over-animated or anxious. Cold or clinical.

**Voice rule**: "finding your territory…" not "Loading...". "name this moment" not "Add to playlist". "your territory is blank — describe a vibe to begin" not "No results found."

**Motion rule**: Every animation carries meaning about state. Nothing animates to look nice. No element pulses in sync with another.

**UX principles (locked)**:
1. The system earns the right to learn from you, not demands it.
2. Only interrupt the flow when the value is perceptible.
3. Phone to the side is the success state. Don't over-instrument immersion.
4. Micro-mechanisms of individual discovery are the whole product.
5. Watches how you move, not how you look.
6. Confidence over binary calls — the system hedges when uncertain.

---

*Last updated: April 2026, Session 3*  
*Next update: after queue engine and LLM audio attributes ship*
