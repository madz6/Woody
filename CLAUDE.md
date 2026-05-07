# Woody — Workspace Context

## What Woody Is

Woody is an acoustic-intelligence music discovery and curation platform. It is not a streaming service. It sits on top of Spotify (and eventually other sources) as a discovery, curation, and identity layer — the way Letterboxd sits on top of watching films.

The core insight: music taste is better described by acoustic coordinates than genre labels. Five continuous perceptual dimensions replace categorical genre tags.

## The Five Acoustic Dimensions

| Dimension | Range | What it captures |
|-----------|-------|-----------------|
| Energy | 0–1 | Arousal, intensity, tempo feel |
| Warmth | 0–1 | Tonal temperature (cold/synthetic → warm/organic) |
| Density | 0–1 | Textural mass, layering, fullness |
| Organicity | 0–1 | Timbre quality (synthetic/processed → acoustic/natural) |
| Sacred | 0–1 | Harmonic centredness, devotional quality, transcendence |

These are derived from Spotify Audio Features (energy, valence, acousticness, instrumentalness, tempo, loudness) mapped to perceptual dimensions. Not genre. Not mood labels.

## Key Product Decisions Made

- **Unit of consumption is the session, not the track.** Rec engine surfaces 2-hour acoustic arcs, not individual track picks.
- **The social object is the arc, not the opinion.** People share journeys (how they got from A to B), not ratings or reviews.
- **Acoustic field as identity bridge.** Your acoustic territory is honest but not exposing — it shows the shape of your taste without surfacing the embarrassing specifics.
- **DJ/mix wedge as community seed.** DJs already document sets publicly. Woody upgrades that artifact from a flat tracklist to a beautiful acoustic arc. Their audience becomes Woody's trial audience.
- **Activity integration is core, not a feature.** Run, drive, draw, study — the activity arc IS the session steering mechanism.
- **Acoustic context, not biographical context.** Woody explains why something sounds the way it feels. For everything else, link to Genius/Wikipedia.
- **Community is topic-organized, not person-organized.** Like Reddit, not Instagram.
- **Rec engine first.** Build it for your own pain before building the social layer.

## Files in This Workspace

| File | Purpose |
|------|---------|
| `woody-design-system.html` | Living design system — tokens, components, acoustic field renderer |
| `woody-acoustic-field.html` | v1 manual parametric renderer |
| `woody-acoustic-field-v2.html` | v2 with full parametric engine |
| `woody-acoustic-field-v3.html` | v3 with Web Audio API (mic/file input) |
| `woody-rec-engine.html` | Rec engine prototype — 42 tracks, NL intent parser, 5D distance |
| `woody-roadmap.html` | Visual product roadmap — 4 phases |
| `STRATEGY.md` | Full product vision and strategic decisions |
| `FEATURES.md` | Exhaustive feature registry — nothing gets lost |
| `VISUAL_LANGUAGE.md` | Visual language specification — closed decisions. Canonical for UI build. |
| `PSYCHOLOGY.md` | Music psychology synthesis — informs arc shapes and intent model |
| `PRD.md` | Comprehensive PRD — 30 sections, canonical product requirements |
| `BUILD_BRIEF.md` | Engineering briefing for fresh AI context |
| `SESSION_NOTES.md` | Running capture of all product discussion, decisions, and sentiment |
| `SHELVED.md` | All rejected, deferred, and superseded ideas with reasons — check before re-proposing |
| `skills/woody-session-capture/SKILL.md` | Session notes capture skill — auto-captures all product discussion |
| `skills/engineering-conscience/SKILL.md` | Persistent security/privacy/ethics audit layer — auth, GDPR, OWASP, ethical ML |
| `skills/devils-advocate/SKILL.md` | Devil's advocate methodology |
| `skills/biz-model-research/SKILL.md` | Business model research methodology |
| `skills/strategy-suite/SKILL.md` | Strategy suite (brainstorm + DA + roadmap) |

## Design Tokens

```css
--void: #0a0a0f        /* background */
--teal: #00e5c4        /* primary accent */
--cobalt: #4455ff      /* secondary accent */
--moon: #f0ede6        /* primary text */
--amber: #f0a040       /* recommendation / highlight */
```

Fonts: Syne (headings, 800/700/600), Epilogue (body, 300/400/500), Space Mono (data/mono).
Always dark theme. Always grain overlay. Subtle borders at 10% moon opacity.

---

## Persistent Engineering Conscience

Read `skills/engineering-conscience/SKILL.md` and apply it proportionally to all engineering, architecture, and data discussions in this workspace. Silent on routine execution. One-line flag on moderate risks. Interrupt on critical risks (data exposure, auth bypass, ML bias violations). Invoke explicitly with `/engineering-conscience` for a structured audit.

---

## Persistent Devil's Advocate

Apply proportional pressure-testing to all ideas in this workspace:

- **Execution tasks** (coding, building, writing files): silent — just do the work correctly.
- **Ideation / design decisions**: after each significant idea, one sentence naming the load-bearing assumption or failure mechanism. Woven in naturally, not a separate section.
- **Strategy / product / business decisions**: before finalising any recommendation, include a "What has to be true" and "The version of this that fails" note. Specific and mechanistic — not generic risk hedging.

The goal is not to kill ideas. It is to surface the assumption most likely to be wrong. Always take clear positions first, then show the failure case. Never use devil's advocate to avoid deciding — the output is always a decision.

---

## Session Continuity Notes

Features have been discussed across many sessions and can get lost. Always check `FEATURES.md` before suggesting new functionality — it may already be there and may have design decisions attached. When new features emerge in conversation, add them to `FEATURES.md` immediately.

The strategic vision has evolved significantly. Check `STRATEGY.md` for current direction before making roadmap suggestions.

**`SESSION_NOTES.md` is the running memory of all product discussion.** Read it at the start of any session to catch decisions made conversationally that haven't yet propagated to other docs. The woody-session-capture skill maintains it — append new entries after every substantive discussion. Do not reorganize it — append-only, reverse chronological within each date.

## Key Architectural Decisions (Recent — not yet fully in PRD)

- **Embedding architecture is 4-layer:** (0) raw audio → (1) extracted features ~100D → (2) learned acoustic embeddings 64-256D → (3) T1 perceptual 5D projection. T1 is a lossy projection, not the embedding space.
- **Arc execution = planning layer (beam search) + execution layer (Markov/acoustic momentum).** The shortlist only breaks on user disinterest signal. Acoustic neighborhood = the unit of execution.
- **Attribution objectives:** behavioral model trains on *why* signals happen (which dimension caused failure), not just that they happened.
- **Acoustic archetypes:** named clusters in embedding space (e.g. "warm organic descent", "cold electric drive") used as Markov navigation waypoints.
- **Cold start:** Spotify listening history (top_tracks, recently_played, saved, playlists) → territory from day one. Artist chat as fallback.
- **Audio analysis:** Essentia (primary) / Librosa (fallback) for non-Spotify sources. Essentia.js (WASM) for browser real-time analysis.
- **Dimension calibration:** fine-tuned small BERT-class model, NOT LLM prompt engineering. Two models: (1) audio features → 5D scores, (2) intent text → dimension target.
- **Personal model:** on-device fine-tuned LLM (Phi-3/Gemma 2B class), RL-based, RAG over personal history. Phase 3 architecture. Privacy by design — personalization data never leaves device.
- **Privacy:** federated learning. Gradients only go to server, not raw behavioral data. Differential privacy on aggregation.
- **Phase 1 arc quality is non-negotiable.** Pre-compute 3 arc variants, acoustic shortlist at each step, early-skip fallback. Quality validated empirically before launch.
- **Visualization must solve real pain, not be decorative.** Trust signal + pre-conscious awareness + social object. Test: would you want the field running even with identical music to Spotify?
- **Artifact format:** short video (TikTok/Reels), live screen/projection (DJ sets), interactive web artifact (Mixcloud). Not static images.
- **Founder is user 0 and first DJ.** Founder-led content as primary early GTM — document DJ journey, integrate Woody in content, build audience alongside product.
- **TikTok/Reddit light integration:** read-only acoustic data from external communities. Not internal social features.
