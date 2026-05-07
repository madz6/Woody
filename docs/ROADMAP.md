# Woody — Product Roadmap

> Format: Now / Next / Later  
> Last updated: April 2026  
> Owner: Madhu  
> Theme: Build the real intelligence layer — stop papering over gaps

---

## Status Overview

| Period | Items | Status |
|--------|-------|--------|
| Now | 4 items | Starting |
| Next | 5 items | Planned |
| Later | 5 items | Directional |

**Critical blocker**: `getRecommendations()` in `lib/spotify.ts` is calling a deprecated endpoint (Spotify killed Audio Features + Recommendations on Nov 27, 2024). Track discovery is compromised. This blocks everything else.

---

## NOW — Current Sprint

*Committed work. Ship these before moving on.*

### 🔴 1. Fix Broken Spotify Recommendations → Last.fm
**Status**: Not started  
**Priority**: P0 — table stakes, nothing else works well until this is fixed  
**Effort**: ~1–2 days  
**Owner**: Madhu

**What**: Replace `getRecommendations()` with Last.fm API calls. Spotify's recommendations endpoint has been dead since November 2024. Current code silently returns nothing useful.

**How**:
- Wire `track.getSimilar` (Last.fm) as primary similarity engine
- Wire `artist.getTopTracks` (Last.fm) for artist-seeded discovery
- Keep `searchTracks` (Spotify search, not recommendations) for text-query breadth
- Keep existing pool/dedup logic in `intentToSuggestions()` — just swap the source

**API**: Last.fm free tier, `http://ws.audioscrobbler.com/2.0/` — no deprecation risk  
**Dependency**: Last.fm API key (free registration)

---

### 🟡 2. Use Yourself as User Zero (2-Week Real Usage Sprint)
**Status**: Not started  
**Priority**: P1 — all further ML work is hypothesis without real data  
**Effort**: 2 weeks, passive  
**Owner**: Madhu

**What**: Actually use Woody daily for 2 weeks. The cold start problem, the personal semantics problem, the feedback friction problem — all of these need observed failure modes before they're worth designing against.

**Observe**:
- Where does the intent parser get it wrong? Keep notes.
- Which sessions feel like they understand you vs. feel generic?
- When does the rejection memory actually help vs. feel pointless?
- What does "atmospheric" surface that confirms/contradicts the personal semantics theory?
- Where does the experience break on mobile / in low-bandwidth contexts?

**Output**: A 1-page "failure map" — concrete places where Woody fails for you specifically. This is the product spec input for Next phase.

---

### 🟡 3. Prototype Context Intake UX
**Status**: Not started  
**Priority**: P1 — needed to validate the context-aware mode theory  
**Effort**: ~2–3 days  
**Owner**: Madhu

**What**: Add a minimal session-start question that collects activity context. One question only. The theory is that knowing "about to go running" vs "at desk exploring" changes how the system should serve tracks and handle feedback.

**Prototype (not design)**:
- On intent submission, optionally show: "What are you about to get into?" with 4 quick chips: Running / Working / Exploring / Just listening
- Store selection in session state
- Use it to adjust: serving mode, whether to surface the "not this" button, feedback signal weight

**Validate**: After 2 weeks of real use, does knowing the context mode actually change what you'd want surfaced? If yes, build the full context model. If no, kill it.

---

### 🟢 4. Audit & Stabilize Existing Implementation
**Status**: Not started  
**Priority**: P2 — confirm the Phase A–E work is solid before building on it  
**Effort**: ~1 day  
**Owner**: Madhu

**What**: Quick audit of the rejection memory, landing animations, and token refresh implemented in the previous sessions.

**Check**:
- IntentMemory localStorage read/write — does it actually persist and reload across sessions?
- excludeTrackIds — are rejected tracks genuinely not re-appearing?
- 30-min token refresh — does it fire and does it actually update the player token?
- Landing animations — do birthTime stagger delays feel right or too slow/fast?
- MiniPlayer "not this" button — does it wire to the rejection flow end-to-end?

**Output**: Small fixes as needed. Confidence that the foundation is solid.

---

## NEXT — 1 to 3 Months

*Planned work. Good confidence in what, less confidence in exactly when.*

### 1. MERT / Essentia Acoustic Embedding Pipeline (Validation)
**Status**: Not started  
**Priority**: P1 after Now items are done  
**Effort**: 1–2 weeks (research/prototype)

**What**: Set up Google Colab notebook running either MERT (m-a-p/MERT-v1-330M) or Essentia (MTG Barcelona — lighter, more practical) for audio embedding inference. Expose via ngrok. Use it to embed a test corpus and prove that acoustic similarity outperforms text search similarity for this use case.

**Why not production yet**: Need validation that embeddings actually improve recommendations before investing in real hosting (Hugging Face Inference API, Modal, Replicate, etc.)

**Architecture**:
```
Colab notebook (MERT or Essentia TF models)
    ↓ ngrok HTTP tunnel
Next.js API route → POST audio features / track metadata
    ↓
768d embedding returned
    ↓
Cosine similarity search against user's taste cluster
```

**Success criteria**: Can generate embeddings for 20 tracks and show that acoustic neighbors cluster more intuitively than text-query results for a specific vibe. Not a production metric — just proof of concept.

**Audio acquisition question (open)**: Spotify 30s preview URLs are available in track metadata. These may be sufficient for MERT input. Alternative: YouTube audio via yt-dlp for longer clips. Legal considerations apply.

---

### 2. Personal Semantics Model v1
**Status**: Not started  
**Priority**: P2 — needs 2 weeks of real usage data as input  
**Effort**: 1–2 weeks

**What**: For each user, for each vibe word, maintain a distribution over possible acoustic interpretations. The cold start is wide uncertainty; interactions narrow it.

**v1 scope (simple)**:
- Track which PersonaLens fields (energy, tempo, specific mood words) produce tracks that get kept vs skipped
- When the same field value appears in a new session, slightly bias toward interpretations that previously worked
- Store in localStorage alongside IntentMemory (not yet server-side)

**Not v1**:
- Full Bayesian math
- SDE temporal decay
- Per-word distribution visualization

**The "atmospheric" problem concretely**: If 5 sessions have used "atmospheric" and all the kept tracks have low BPM + high genre variance, bias future "atmospheric" sessions toward similar territory rather than defaulting to LLM interpretation.

---

### 3. Cold Start Protocol
**Status**: Not started  
**Priority**: P2  
**Effort**: 3–5 days

**What**: Session zero experience for a user with no history. Currently Woody works purely from LLM text interpretation with no user context.

**Protocol**:
1. First session: one anchor question — "Drop a track you've loved recently" → search it → embed it (or use metadata) → use as initial taste territory
2. Sessions 1–3: explicitly surface diverse tracks across acoustic territories, observe what sticks
3. After 5 sessions: provisional taste cluster formed, system transitions to narrower serving mode
4. Communicate uncertainty honestly in early sessions ("still getting to know your territory")

**The house of cards principle**: Build provisional clusters early, remain completely ready to collapse them if behavioral signals contradict them.

---

### 4. Low Bandwidth Mode
**Status**: Not started  
**Priority**: P2 — depends on Context Intake prototype results  
**Effort**: 3–5 days (if prototype validates the concept)

**What**: A stripped-down serve mode for users in high-activity states (running, commuting, working). No "not this" buttons, no discovery UI, no questions — just continuous playback in the established taste territory.

**Differences from normal mode**:
- No rejection UI — skip is the only signal
- Automatic queuing from established taste territory (no intent typing)
- Skip signals weighted lower (activity context makes skips noisier)
- Session-start selection sets the mode; no in-session switching

**Depends on**: Context intake prototype validating that users actually want a mode distinction.

---

### 5. Last.fm Integration Depth
**Status**: Not started  
**Priority**: P3 — follow-on from P0 fix  
**Effort**: 1 week

**What**: After the basic Last.fm replacement is live, go deeper with the API:
- `artist.getSimilar` for artist-territory exploration (not just track similarity)
- Last.fm tags as a richer semantic layer than Spotify genres
- `user.getTopTracks` / `user.getRecentTracks` if users connect Last.fm accounts (optional, no account required)
- Use Last.fm artist tags as additional signal for intent parsing (supplement Gemini/Claude PersonaLens)

---

## LATER — 3 to 6+ Months

*Directional bets. Strategic territory we intend to enter when the foundation is right.*

### 1. Longitudinal Drift Tracking
**What**: Measure behavioral drift across sessions over time — energy trend, genre diversity, skip pattern changes. Build a lightweight "taste trajectory" that shows how taste is moving, not just where it currently is.

**Why later**: Needs months of sessions to be meaningful. Premature to build now.

**Key metrics to track per session**:
- Average energy of kept tracks
- Genre spread (count of unique genre territories surfaced)
- Skip rate
- Replay rate
- Session length

---

### 2. Life Phase Inference
**What**: From longitudinal drift, infer behavioral life phases (high-intensity work phase, transitional/exploratory phase, low-stimulation period). Not labeled by the user — inferred from behavioral patterns.

**Why later**: Requires longitudinal data. Also requires validation that the inference is actually useful rather than just clever.

**The key insight**: Don't predict what phase someone is in and change behavior dramatically. Observe drift and adjust serving territory gradually. High confidence required before acting on this signal.

---

### 3. Taste Model as Inspectable Artifact
**What**: Give the user visibility into what the system has learned about their taste. "When you say atmospheric, I understand this to mean..." — a reveal interface that shows the personal semantics model, allows correction, and builds trust through transparency.

**Why later**: Needs the personal semantics model to be accurate enough to be worth showing. Showing a wrong model destroys trust faster than not showing any model.

---

### 4. Purpose-Built Feedback Primitives
**What**: Design feedback mechanisms that aren't borrowed from Spotify/iTunes UI conventions. Current primitives (skip, save, like) were designed for different contexts and carry noisy signal.

**Possible directions**:
- Gesture-based: swipe depth = reaction intensity
- Moment-tagging: "this part" at a specific timestamp
- Mood-contextual: "right for this moment" vs "good track in general"
- Resurfacing: "not now but resurface in 2 weeks"

**Why later**: Can't design this without observing how users actually interact with existing primitives and where they fall short. The 2-week real usage sprint will surface this.

---

### 5. "Situation Hasn't Arisen Yet" Territory Mapping
**What**: Maintain a map of acoustic territory adjacent to the user's known taste that they haven't explored yet. Not "you should explore jazz" — rather, territory that sits near their behavioral trajectory but hasn't been entered. Surfaces when relevant rather than being pushed.

**Why later**: Requires longitudinal data to understand trajectory, and requires acoustic embeddings to map the space meaningfully. This is a long-term feature, not a near-term one.

---

## What We're Explicitly NOT Building

- **Hosted ML inference** — before the Colab validation proves it out
- **Social/multi-user features** — wrong phase entirely
- **Life phase labeling UI** — before longitudinal tracking exists
- **Complex feedback UI** — before simpler primitives are working well
- **Server-side taste model storage** — privacy and complexity tradeoffs not resolved yet

---

## Dependencies

| Item | Depends On | Risk |
|------|-----------|------|
| Personal Semantics v1 | 2 weeks real usage + Last.fm fix | Medium |
| Low Bandwidth Mode | Context Intake Prototype | Low |
| Longitudinal Drift | Months of sessions | High — time-gated |
| Life Phase Inference | Longitudinal Drift | High |
| Taste Model Artifact | Personal Semantics accuracy | High |
| Embedding Pipeline | Colab setup + audio source | Medium |

---

## Capacity Note

This is a solo project. The Now items are 1–2 weeks of real work. The Next items are another 4–8 weeks. Everything in Later is >3 months out and gated on data that doesn't exist yet. Don't pull Later items forward — they'll be worse if built too early.

The principle: **fix the pipeline, use the product, let reality tell you what's missing.**

---

## Changelog

| Date | Change |
|------|--------|
| April 2026 | Initial roadmap created. Spotify deprecation confirmed as critical blocker. Last.fm replacement added as P0. ML/embedding pipeline moved to Next (after validation). Longitudinal concepts banked in Later. |

---

*See [IDEATION.md](./IDEATION.md) for full product philosophy and architecture exploration behind this roadmap.*
