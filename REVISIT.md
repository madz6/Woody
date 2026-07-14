# Woody — Open Questions & Revisit List
*Living document. Updated after every major discussion.*
*Read this at the start of every product or architecture session.*
*After every autocompact: read CONTEXT_SNAPSHOT.md first, then this file.*

---

## 🔴 Critical — Blocks Architecture

- [~] **Adaptive low-control journeys + synchronized dual-stream method — DIRECTION SET 2026-07-14**
  Current wedge: Woody chooses what should play next from listener context, journey context, recent musical trajectory, and desired direction so the music feels timed without constant pre-planning or skipping. Running is the first repeatable founder laboratory, not the permanent product boundary. First spontaneous non-founder problem signal: a motorbike rider described manually pre-planning a full queue and timing songs to route shape, estimated speed, and turns because skipping during the ride is undesirable. This validates the broader problem category, not solution reception; run a non-leading follow-up interview.
  **Method:** experience/evidence and system-building run simultaneously. Build one generic next-track primitive and event loop, while founder sessions and interviews determine whether it is valuable. The system stream may be at most one experiment ahead of evidence. Do not create separate run/riding engines.
  **Open questions:** which contextual signals predict a desired transition; how much route structure matters; whether users prefer adaptation to their own carefully planned queue; what zero-touch control and recovery behavior are required in safety-critical contexts.
  *Direction set 2026-07-14. Operating detail in THE_PATH.md.*

- [ ] **Living/plastic acoustic substrate ("fascia") — real architecture direction (raised 2026-07-01)**
  The current engine feels dead because CLAP is a *frozen* pretrained space with no feedback loop — nearest-neighbour gravitates to the vibe *prototype* (why it surfaced the cliché "Stay With Me"). The root architecture the founder is reaching for: ONE **plastic** latent space where tracks / user (moving point) / intent (direction) / session (path) / good-transitions (edges) all live, whose **metric is learned from behavioural trajectories** (fascia strengthens under load), with CLAP/Essentia/MERT/camelot/stems as *sensory organs* feeding it. Primary signal = the user's **trajectory** (transitions), not the track. Session = **seek → hold** (converge on a baseline region, then hold the zone; arrival = choice-vector → ~0). Value = coherence **+** surprising-but-right bridges (far overall, near on ONE element → needs element-level decomposition; whole-song CLAP can't). **Grown, not designed** — build the thinnest loop that reshapes its own space, put under load. Full capture in SESSION_NOTES 2026-07-01.
  **Reopens CLAP-as-backbone** (see Decisions Made) — likely split CLAP(text→region) vs music-features/learned-metric(track→track & transitions); `lib/camelot.ts` = cheap first win. Also questions pre-baked arc *shapes* vs a **real-time next-track engine**.
  *Raised 2026-07-01. Biggest architectural shift since CLAP adoption. Design pass needed; stay honest to "grown, not designed."*

- [~] **Biographical cold start — DESIGN RESOLVED 2026-06-27 (3 sub-decisions open)**
  Acoustic cold start (Bayesian probe) ≠ biographical cold start. Design now in **BIOGRAPHICAL_COLD_START.md**. Resolved: anchor = `(track, source, era)` tuple (not bare track); 3 questions pulling channels not favourites (inherited / belonging / self) + optional 2nd inherited; multicultural depth captured via provenance + inherited–self CLAP spread, **no free-text biography**; weighting = `base(source) × developmental_gain(era) × recency_decay(t)` where formative anchors = terrain (no decay, wide variance, define basin) and recent signals = weather (fast decay, sculpt within basin); inherited anchors weight a distinct familiarity/comfort axis; anchors **seed** the probe and behaviour **validates/corrects** (one unified flow, not two). Still open (need founder call): self-vs-inherited weighting, era asked-vs-inferred, missing-channel handling. See BIOGRAPHICAL_COLD_START.md §7. Implementation-level data model deferred to WOODY_BUILD_SPEC.md after sub-decisions close + gate_listen passes.
  *Surfaced 2026-06-23. Design resolved 2026-06-27.*

- [ ] **Strategic value / monetisation / market — AUDITED 2026-06-27, gated on gate_listen**
  Full research-backed devil's-advocate audit in **STRATEGIC_AUDIT.md**. Key conclusions: position Woody as an **identity + discovery layer** (Letterboxd model), NOT as "the acoustic DNA company" (Pandora/Echo Nest precedent → acoustic capability gets absorbed as infrastructure, never became a self-knowledge product). Believable early market = music nerds + DJs (small, reachable at ~$0 via founder-DJ). Pure taste-stats tools price at ~$6/yr (stats.fm) — commodity grave; Letterboxd earns ~$19–49/yr via identity + social lock-in. First real dollar likely the **DJ/creator pro tier**, not consumer insight. Real moat = accumulated territory + social graph (last.fm/Letterboxd data moat), not the pipeline. **Next action: gate_listen — every business question is unanswerable until the core moment ("the song I didn't know I was looking for") is proven on one non-founder.** Do NOT build pipeline / knowledge graph / on-device models / monetisation until then.
  *Surfaced + audited 2026-06-27.*

- [ ] **Technical pipeline reimagination**
  What replaces Spotify Audio Features? Our own extraction pipeline (Essentia + CLAP + what else?). How do we build musical DNA infrastructure that no platform can take away? This is the foundation of everything.
  *Why open: user confirmed "building own pipeline sounds good but we need to reimagine how." Blocks all engine work past current CLAP build.*

- [ ] **Behavioural signal thresholds — need empirical validation, do not hardcode**
  All quantitative thresholds for behavioural attribution are currently heuristics, not research-validated. Specific unvalidated numbers to flag before building:
  - Skip taxonomy time thresholds (e.g. "<5s = acoustic rejection"): streaming analytics distinguishes early/mid/late skips but published thresholds vary. The acoustic vs contextual mismatch distinction within early skips is inferred, not validated.
  - Pattern surfacing count (e.g. "2-3 patterns after session"): invented. Should be "most salient patterns above noise threshold," defined empirically.
  - Pattern question trigger (e.g. "4+ tracks"): wrong as absolute number — session length varies. Should be proportional threshold or statistical confidence on pattern, not a hardcoded integer.
  *Resolution: either find published streaming analytics research (Spotify Engineering blog, MSD papers) or explicitly mark these as "calibrated from early user data" — never build them as hardcoded constants.*

- [ ] **Feedback/note mechanism**
  How does a user tell Woody what they responded to in a specific track or moment? Text note? Moment-stamp? Woody asks a clarifying question? Pure behavioural inference? Or all of the above depending on user type?
  *Why open: user said "unsure, needs reimagining, UX principles." Defines the behavioural data model which defines everything else.*

- [ ] **Device/listening environment as first-class data**
  Phone speaker vs closed headphones vs car speakers vs boombox vs specific EQ = different musical elements are perceptible. Same track sounds fundamentally different. How is this captured and used in the model?
  *Why open: user surfaced this — "a single listened to on a shitty broken phone speaker vs boombox vs headphones is also key and the EQ they were listening to." Novel, unbuilt anywhere. Blocks personalisation model.*

- [ ] **Behavioural + psychological + environmental data model**
  User said these three are more important than anything. What is the full data model? What signals are collected, how, at what granularity? Minimum required vs optional.
  *Why open: scope undefined. Blocks architecture.*

---

## 🟡 Important — Shapes Product

- [~] **Purposeful playback design — DIRECTION SET, interaction still open**
  The underlying job is no longer limited to a tempo-run preset. Woody should respond to the shape of a low-control journey and select the next track to lift, hold, or release the experience. Running supplies the first test body; the motorbike account shows route-shaped sequencing may generalize. Existing presets and prior sessions may seed a journey, but live context and learned response should eventually alter it.
  **Instrumentation decision:** safe founder tests may use Lift / Hold / Release to produce labels. This is not the final UX. Riding must be zero-touch during the journey, with route/context inputs and post-ride review.
  *Open: exact pre-journey intent input, safe failure/recovery behavior, and how quickly adaptation should respond.*

- [ ] **User journey from scratch**
  Not screens. The emotional/cognitive journey: what does the user know at arrival, what do they do, what changes for them, what do they come back for? Needs to serve both the music nerd (intricate) and the curious listener (simpler) from the same engine.
  *Why open: user said "completely reimagine." Step 3 from PM framework.*

- [ ] **"First impression + state at reception" — capture model**
  The state you're in when you first hear a track affects how you respond to it. This is crucial data. User said: "I believe it's both [asked + inferred] but more data is always better."
  *Why open: data model undefined, UX for capture undefined.*

- [ ] **Agentic layer specifics**
  Reactive (responds when asked) vs proactive (surfaces patterns unprompted — "you've responded to three tracks with this harmonic movement this week, want to explore it?"). What does it actually do?
  *Why open: user confirmed agentic layer is required but specifics not defined.*

- [ ] **Ritual + identity design (Spotify Wrapped reference)**
  Spotify Wrapped succeeds through ritualization (annual event), visual aesthetics, cult-building, identity expression. These are table stakes for Woody — not copied but the psychological mechanism: ritual + identity + social validation. What is Woody's version of this?
  *User said: "Spotify have done an excellent job ritualising it and building a cult out of it — maybe not ritualised but elements of that process."*

- [ ] **Artifact format**
  What does a shared discovery arc look like visually? Formats: Spotify/Apple Music/YouTube playlist, DJ tracklist, visual arc, radio format. What's the primary shareable object? What does it communicate about the person who made it?
  *Why open: user said "unsure about the definition of shape of artifact right now, open to suggestions."*

- [ ] **Competitive positioning sentence**
  Current draft: "Spotify knows what you played. Woody knows why you responded."
  User said: "I like that sentence, could be reframed for sure, needs work though."
  *Why open: refinement needed before public comms. Not blocking build.*

---

## 🟢 Phase 2+ — Can Wait

- [ ] **Open source strategy**: Musical DNA extraction as public infrastructure? Community-built graph? Woody owns the personal layer on top. *User said "building own pipeline sounds good" — open source angle unconfirmed but worth exploring.*
- [ ] **Passive journey signals**: Cadence, pace, heart rate, route progress, turns, elevation, accelerometer, and time may help predict what happens next. They describe state; they do not inherently reveal desired direction. Compare them against explicit/post-session labels before choosing a primary controller. *Phase 2, after the manual event loop produces data.*
- [ ] **Cultural/linguistic bias correction**: CLAP and most training data is Western pop-biased. Non-Western music is systematically underrepresented. *Phase 2 corpus work.*
- [ ] **True beam search upgrade**: Current arc is greedy-with-relaxation. Beam search (width > 1) is the Phase 2 upgrade. *One function change when needed.*
- [ ] **5D linear probe calibration**: Ridge regression from 500 annotated tracks + Bradley-Terry pairwise. *Phase 2, requires annotation session.*

---

## Decisions Made — Do Not Re-Open Without Strong Reason

| Decision | Where documented |
|----------|-----------------|
| Navigation in CLAP 512D space (not 5D Euclidean) | woody-engine.mdc | ⚠️ **REOPENED 2026-07-01** — frozen CLAP = "dead tissue"; moving toward a learned/plastic metric + CLAP as one sensory input, not the fixed backbone. See Critical: fascia. |
| 5D formula is display-only heuristic | MASTER_BUILD_PROMPT.md Section 2 |
| Bayesian probe for cold start (not Spotify history) | WOODY_BUILD_SPEC.md Section 6 |
| PersonaLens = search seeds only, not acoustic target | woody-engine.mdc |
| iTunes Search API as audio source (Spotify preview_url deprecated) | packages/acoustic-service/services/audio_source.py |
| Primary interaction verb = EXPLORE | PRODUCT_VISION.md |
| Emotion is downstream of musical structure | PRODUCT_VISION.md |
| Social object = documented musical journey (not playlist) | PRODUCT_VISION.md |
| Greedy-with-relaxation arc (beam search Phase 2) | packages/acoustic-service/routers/arc.py |
| Spotify = playback layer only, not intelligence layer | PRODUCT_VISION.md |

---

## Things Said In Chat Not Yet In Docs

- "Emotion is only a byproduct of the musical infrastructural repercussions" — the founding product insight
- "Your liking of music cannot be boxed" — against any fixed taxonomy
- "Same ear to all music, same music processing — the difference is the first connotation, impression and state at reception" — key psychological insight
- "We need to break out of AI/human data bias and think new" — explicit anti-norm directive
- "Musical gaslighting" — intentional, consensual psychoacoustic steering. Not defined precisely yet.
- Strava analogy: confirmed — habit + identity + social validation mechanism, not functional similarity
- "i am building this for myself and like-minded people — the music nerd who wants to discover themselves through music"
- MVP moment: "The song I didn't know I was looking for"
- Device/EQ/listening environment as first-class signal — surfaced by user, not in any doc yet
- Biographical cold start — formative listening, cultural background, parental influence, friend groups create anchors that acoustic data can't recover. "Picking up from where we can instead of digging back."
- Musical biography as immediate product value — the act of articulating formative tracks is itself the first product moment, before the engine does anything
- Primary interaction reframed as "Explore. Understand. Own." — not just "Explore"
- Behavioral attribution: zero friction during playback; post-session pattern surfacing only; moment-level tap as optional; manual annotation layer
- Disruption HOW: (1) upstream of emotion, (2) understanding alongside discovery, (3) first-person taste artefact, (4) platform-agnostic intelligence, (5) biographical + behavioural personal model
- Reading material validated: Levitin → Huron → DeNora → Gioia → Juslin & Västfjäll 2008 (BRECVEMA)
- Minimum property set research-confirmed: tempo/rhythm, mode/harmony, melodic contour, timbral character, dynamic envelope — five properties, covers majority of emotional response variance
- "Active listening bringing back that idea" — disrupting passive consumption is the thesis
- GitHub / open source angle — mentioned, not confirmed
- "Breaking out of AI/human data bias to think new" — applies to product design, not just technical

---

*Last updated: 2026-07-14*
