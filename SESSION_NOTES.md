# Woody — Session Notes
*Running capture of all product discussions, decisions, ideas, and sentiment.*
*Last updated: 2026-07-14*
*Maintained by the woody-session-capture skill. Do not manually reorganise — append only.*

---

## [PRODUCT][WEDGE][CONVERGENCE] — 2026-07-01 (The Run — first concrete wedge)

**What happened:** Long product-brainstorm converged (finally) on a first concrete, bounded product. Reframing journey: three "jobs" (functional/identity/delight) collapsed by founder into ONE — *understand me + serve what I'm unknowingly anticipating, effortlessly* — where "effortless" = the UX/how, "delight/how-did-it-know" = the *receipt/proof*. Then: the balance of familiar↔surprise is set by **purpose**, and purpose is "the input you don't have." Founder's cut (sharper than "pick one room"): target **low-control activity contexts** — gym, run, drive, clean, work — because (a) pain is maximal where agency is minimal (hands busy, can't curate → system must take the wheel), and (b) the activity IS the purpose and it's **sensable** (accelerometer/pace/HR/time), which frictionlessly solves the purpose-input crux. First build chosen: **THE RUN.**

**"Woody for the run" — the definition (from tonight's framework):**
- **Purpose = the run, sensed for free** (pace/cadence, HR if watch). Solves purpose-input.
- **Shape is real & semi-objective** — ease-in → build → push/peak → cool-down. (This is where the shelved arc-shapes finally earn their keep; they were wrong for open-ended "coffee shop," right for an activity with a shape.)
- **Balance = mostly flow (hold cadence) + timed surprise lifts** (a surprising-but-right banger at the hill / last km). Ratio set by purpose.
- **Effortless by necessity** — can't skip mid-run, so the system dictates.
- **Feedback (sparse-signal adaptation):** physiology-DURING (held/raised pace = it worked) + retrospective keep AFTER (the track that hit gets saved). Not mid-run taps.
- **Success / "how did it know":** you pushed harder or held pace because the music hit right, and/or one track dropped at the perfect moment and you saved it after.

**Honest warning (don't rebuild a corpse):** cadence-matched running music is a **solved commodity** (RockMyRun; Spotify built a running feature and killed it). If it's just "BPM matches steps," it's the graveyard. The wedge is the layer ON TOP — taste + surprising-but-right lift + learning you.

**Thinnest first test (grown-not-designed; better than the coffee-shop gate):** generate a run arc with the **existing** engine (energetic intent, peak/build shape, founder taste, excludes) and **go run to it.** No sensor integration yet. Question: does a purpose-shaped, surprise-balanced arc actually *carry* a run? Did a track hit at the right moment? Legs as the sensor. This is the real, concrete gate_listen v2 — purposeful, with an objective success criterion.

**Sentiment:** First genuine convergence of the whole session. Founder went from "I don't see the use case" earlier → "I wish I had a system for it" → committing to the run. Founder-market-fit surfaced organically.

**Category:** Product | Wedge | Convergence

---

## [ARCHITECTURE][ENGINE][DIRECTION] — 2026-07-01 (Fascia / living-substrate reframe)

**What happened:** Long architectural working session (in chat), sparked by founder's "the engine is ass in execution, not just principle" + "think fascia, not tools." Founder pushed past the current CLAP-nearest-neighbour engine to a root-level vision. Genuinely important — captured so it isn't lost.

**Key insights (directional, NOT yet built):**

1. **Trajectory is the primary signal, not the track.** Unit = the transition. A user's sequence of deliberate next-choices traces a vector toward a latent attractor, often unnameable (founder drifted afrobeats → UK drill/grime and was really converging on *afroswing* — the blend, a point *between* genre labels). Frictionless: every "more like this" tap is a step in a path; read the direction, extrapolate. Movement beats words.

2. **Description is subjective; the acoustic space is invariant.** Two people describe the same music in totally different words but point at the same coordinate. Words (genre/mood/free-text intent) are lossy personal pointers; the coordinate is shared ground truth → strongest case yet for continuous-space over tags, and why track→track (language-free) is a cleaner signal than text intent.

3. **Session dynamics: seek → hold.** Trajectory converges on a "baseline region"; job flips from extrapolate-direction to hold-the-zone (don't break the vibe). Arrival = the vector → ~0 (choices cluster tight). Recurring baselines across sessions = the user's territory.

4. **Coherence floor / surprise ceiling.** Value = coherence (hold zone) PLUS surprising-but-right bridges. Bridge mechanism = *far overall, near on ONE element* (a shared thread — e.g. an instrumental texture linking UK rap → 00s R&B). Whole-song CLAP can't do this (it blends everything); needs element-level decomposition. Huron: expectation set → violated → resolved = the dopamine. Trajectory grades surprises (user follows = landed; bounces back = jarred).

5. **Why the current engine feels dead (root diagnosis):** CLAP is a *frozen, pretrained* space — no feedback, no adaptation. Nearest-neighbour on a frozen space gravitates to the vibe *prototype* (why it served the cliché "Stay With Me"). Compounded by a mainstream-by-construction corpus (Spotify genre-search seeds), 30s-preview embeddings (unrepresentative fragment), and greedy drift to the centroid. Adding more tools (MERT/stems/camelot) = adding bones, not the missing living tissue.

6. **The fascia = the root architecture.** ONE *plastic* latent space everything projects into (tracks, user-as-moving-point, intent-as-direction, session-as-path, good-transition-as-edge), whose **metric is LEARNED from behavioural trajectories, not fixed CLAP cosine.** The space tightens where use pulls it (fascia strengthens under load); one signal propagates globally (a drift sharpens the user's region + reinforces the bridge for neighbours + updates attribution — simultaneously). Tools (CLAP/Essentia/MERT/camelot/stems) are *sensory organs* feeding the space; the living metric learns how much to trust each per context. (Docs had "Phase-3 learned contrastive metric" as an add-on; the reframe makes it the CORE living tissue.)

7. **Grown, not designed.** A living system can't be spec'd and shipped — day one, no usage, it's just frozen CLAP. Build = the thinnest organism with a feedback loop that *reshapes its own space*, put under load (even just the founder) to grow. Same truth as "you can't design a feedback loop before running it," at the architecture level.

8. **Domain-general:** a plastic latent model of a person via their trajectory, reshaped by feedback, IS the "underlying system that connects to everything" the founder keeps circling. Music = the first *body* to grow it in. Reconciles the general-system pull with the discipline (grow in one body first).

**Architectural decisions reopened:**
- **CLAP-as-locked-navigation-backbone is REOPENED** (was locked in WOODY_BUILD_SPEC / woody-engine.mdc / REVISIT Decisions Made). Likely split: CLAP for text-intent→region; music-features + learned metric for track→track and transitions. `lib/camelot.ts` (harmonic/tempo mixing) = cheap high-leverage first augmentation.
- Pre-baked arc *shapes* (journey/plateau/discharge/peak_early) questioned as possible theatre; a **real-time next-track engine** (current position + recent trajectory → next) matches how the founder actually listens better than a pre-planned 18-track arc.

**Status:** Directional, not built. Biggest architectural shift since CLAP was adopted. Needs a design pass before building — and must stay honest to "grown, not designed" (ship the loop, grow under load) rather than becoming another big up-front spec.

**Sentiment:** Founder (rightly) frustrated that prior answers defended the existing architecture instead of attacking the root. This entry exists so the reframe survives.

**Category:** Architecture | Engine | Direction

---

## [VALIDATION][ENGINE][STAGE-1] — 2026-07-01

**What happened:**
gate_listen ran (via Cursor) on a 55-track generic corpus, arc-length 14. Automated A–E triage PASSED (level-0 69%, level-1 31%, level-2/3 0%; mean transition 0.302; 31 frisson hits; no identical arcs). Founder did a partial human listen on the "afternoon coffee shop work" journey arc.

**Founder verdict (partial listen):**
Coherent movement that matched intent — "afternoon coffee, slightly shifting": Gentleman as buildup → Stay With Me (Mayonaka no Door) as a comfy zone. BUT: felt "auto chosen, not personalised"; annoyed it surfaced an overplayed track (Stay With Me) and a bland solo-piano landing.

**Read (decided):**
- **Engine layer = GREEN.** Coherent, intent-matching journey from a generic pool with zero personalization = the hardest technical question answered positively, by ear.
- **Product moment (discovery / "song I didn't know I was looking for") = NOT YET TESTED.** The dissatisfaction ("not mine", overplayed) is the *absence* of personal pool + cold-start, which were never in this test — not an engine failure.
- **Stage 1 = partial pass.** Engine coherence proven; discovery moment still to test.

**Key correction (important):** the tempting next step — seed the pool from the founder's own Spotify library — would make discovery impossible (arc can only pick tracks already owned). That tests *curation* (DJ-arc value), not *discovery* (§1 primary moment). They are two different products; the founder bumped into the fork by feel.

**Decided next test ("founder listen" v2 — tests BOTH values at once):**
1. Seed a big, diverse **external** corpus (500, full run — NOT the library).
2. Add `exclude_ids` (drop overplayed tracks like Stay With Me `4J2oDU9oacz7lJ7H8A8P8v`).
3. Set a real `current_position` (a recently-played track, not pool-order default).
4. One journey arc for a real intent; listen while working.
Gate: (a) did an *unknown* track show up and feel right → discovery/CLAP-only works; (b) did it hold as a session → curation/DJ-arc works.

**Implementation note:** arc API already supports `exclude_ids` + `current_position`; `test_arc.py` doesn't expose them (~15-line change: add `--exclude`, `--start-track`). Assigned to whoever the founder routes it to (Claude here or Cursor) — avoid two agents editing test_arc.py simultaneously.

**Caveat:** 55-track pool is below the trustworthy threshold; seed 500 before over-reading anything, including subjective feel.

**Category:** Validation | Engine | Stage 1

---

## [PRODUCT][STRATEGY][COLD-START] — 2026-06-27

**What was discussed:**
Picked up the biographical cold-start design question, then zoomed out to the existential business questions (is it valuable, who wants it, willingness to pay, monetisation) at the founder's request. Research-backed devil's-advocate audit run.

**Key decisions / outputs:**

1. **Biographical cold start design RESOLVED** → BIOGRAPHICAL_COLD_START.md. The track-picking-vs-open-ended binary is false: cultural/social dimensions are **provenance metadata on tracks**, not separate inputs. Anchor = `(track, source, era)`. Three questions pull channels (inherited / belonging / self), not favourites. Multicultural depth = inherited–self CLAP spread + optional 2nd inherited anchor; **no free-text biography**. Weighting: formative = terrain (no decay, defines basin), recent = weather (fast decay, sculpts within). Inherited anchors weight a distinct familiarity/comfort axis. Anchors **seed** the probe; behaviour **validates** — one unified cold-start flow. Three sub-decisions left open for founder call (self-vs-inherited weighting, era asked-vs-inferred, missing-channel handling).

2. **Strategic audit RESOLVED (directionally)** → STRATEGIC_AUDIT.md. Position as **identity + discovery layer (Letterboxd model)**, NOT "the acoustic DNA company." Research: Pandora Music Genome (450 hand-labelled attrs → SiriusXM radio co, $3.5B) and The Echo Nest (computer acoustic analysis → Spotify ~$100M → became Audio Features API → **deprecated Nov 2024**) both prove acoustic DNA becomes *infrastructure*, not a consumer self-knowledge product. Pure taste-stats tools price at ~$6/yr (stats.fm) — commodity grave; Letterboxd earns ~$19–49/yr (~30M users, Tiny acquired 60% at ~$50–60M) via identity + social lock-in. Superfan TAM (~$4.5B, Luminate 19%/+80%) is artist-directed spend, NOT taste-tool spend — don't bank on it. Believable early market = music nerds + DJs. First real dollar = **DJ/creator pro tier**. Real moat = accumulated territory + social graph, not the pipeline.

3. **Sequencing decision (resolves founder overwhelm):** stop answering "is it a business" and "how do I build it all" simultaneously. Cheapest-risk-first: **gate_listen this week** (hand-run one arc on own library; does the core moment land for one non-founder?). It gates every other question including "is it valuable." Do NOT build pipeline / knowledge graph / on-device models / monetisation until the moment is proven. Then turn musical-biography onboarding into the shareable artifact and test stranger-curiosity. Defer monetisation deliberately.

**Status:** Cold-start design resolved (3 sub-decisions open). Strategic direction set. gate_listen remains the #1 blocking action.

**Sentiment:** Founder expressed genuine uncertainty/overwhelm about value, monetisation, and market. Audit aimed to reduce confusion by sequencing, not add more open questions. Honest about the graveyard precedent while preserving the real, differentiated path.

**Category:** Product | Strategy | Cold-Start | Business

**Target docs updated:** BIOGRAPHICAL_COLD_START.md (created), STRATEGIC_AUDIT.md (created), REVISIT.md (updated), SESSION_NOTES.md (this entry)

**Action needed:**
- gate_listen — still the #1 action, now also the gate on the business case
- Founder call on the 3 open cold-start sub-decisions
- After gate_listen passes: prototype musical-biography onboarding as shareable artifact

---

## [PRODUCT][ARCHITECTURE] — 2026-06-23

**What was discussed:**
Major session covering biographical cold start, minimum property set validation, behavioural attribution without friction, CONTEXT_SNAPSHOT.md revamp, GPU cost strategy, immediate value / traction.

**Key decisions:**

1. **Biographical cold start is a separate architecture item from acoustic cold start.** The Bayesian probe gives acoustic priors. Formative listening history, cultural background, parental influence, friend group exposure give biographical priors that acoustic data can never recover. Both are required. The personal model needs to weight formative anchors differently from recent signals.

2. **Primary interaction reframed: "Explore. Understand. Own."** Not just "Explore" — that undersells it. The three verbs are a progressive arc: explore territory, understand what you find, own it as identity. This differentiates Woody from a better discovery playlist.

3. **Minimum property set confirmed by research:** tempo/rhythm (Essentia), mode/harmony (madmom + Essentia), melodic contour (Basic Pitch → MIDI), timbral character (Essentia per stem, needs Demucs), dynamic envelope (Essentia/librosa). Five properties from BRECVEMA framework (Juslin & Västfjäll 2008) and Zentner/Eerola work. Research-validated, not gut choice.

4. **Behavioural attribution: zero friction during playback.** Passive signals always on (replay timestamps, skip timing, section-specific behaviour). Optional moment-level tap (marks a moment, no popup). Post-session pattern surfacing only when patterns are clear and repeated. Manual annotation as pull, not push. Pattern-triggered questions sparingly (4+ occurrences before asking).

5. **Disruption HOW added to CONTEXT_SNAPSHOT:** (1) upstream of emotion not downstream, (2) understanding alongside discovery not instead of it, (3) first-person taste artefact owned by user, (4) platform-agnostic intelligence, (5) biographical + behavioural model that is yours not a population average.

6. **GPU strategy: Modal free tier for corpus build, one-time per track.** Analysis stored forever after ingestion. Marginal cost per new track collapses. No ongoing GPU spend required.

7. **CONTEXT_SNAPSHOT.md fully revamped** with corrected founding insight (past experience + current state + emotion as validating signal, not just acoustic properties), who it's for with user-sensitive dial note, corrected interaction verbs, disruption HOW section, and product-level hard stops added.

**Reading material confirmed for user:** Levitin "This Is Your Brain on Music" → Huron "Sweet Anticipation" → DeNora "Music in Everyday Life" → Gioia "Music: A Subversive History" → Juslin & Västfjäll 2008 BRECVEMA paper.

**Status:** Session completed. REVISIT.md updated with biographical cold start as new critical item.

**Sentiment:** High-clarity session. User's biographical insight is genuinely important — reframes cold start problem entirely.

**Category:** Product | Architecture | Research

**Target docs updated:** CONTEXT_SNAPSHOT.md, REVISIT.md, SESSION_NOTES.md

**Action needed:** 
- gate_listen still PENDING — listen test must happen before UI work
- Biographical cold start needs design session
- Behavioural attribution data model needs a session

---

## [GTM] [BUSINESS] — 2026-05-06

**What was discussed:**
Athlete/purpose-driven use case as a branding and GTM wedge — hype mixes, pregame arcs, performance-oriented listening.

**User's position:**
Proposed athletes and performance-driven users as a natural lifestyle implementation of Woody down the line.

**Claude's position:**
Stronger than it looks. Athletes have a genuinely different relationship to music — pregame is acoustic manipulation with a specific physiological target. Woody's 5D framing makes this legible as a performance tool: "this arc takes you from 0.3 Energy to 0.9 Energy over 45 minutes" is a training prescription, not a playlist rec. That's a different product category (music as performance tool vs. entertainment). The shareable artifact here is a methodology other athletes can adopt and remix — creator-ownable in the right way. The version that fails: it becomes a marketing exercise (athlete posts branded arc for sponsor) with no authentic use underneath.

**Status:** Proposed — future GTM consideration

**Sentiment:** Excited — user saw it as natural lifestyle extension, Claude sees it as a potentially distinct value proposition

**Category:** GTM | Business | UX

**Target doc:** STRATEGY.md (GTM section) | FEATURES.md (use cases)

**Action needed:** Add athlete/performance arc as a named use case in FEATURES.md. Flag in STRATEGY.md as a Phase 2/3 GTM wedge — needs authentic user validation before brand partnerships.

---

## [ARCH] [AUDIO] — 2026-05-06

**What was discussed:**
Full evaluation of MERT vs JEPA vs Essentia as audio representation approaches for the 4-layer embedding architecture.

**User's position:**
Asked for genuine analysis, not a surface-level recommendation. Wanted to understand whether MERT architecture is viable and whether JEPA (LeCun's joint embedding predictive architecture) would fit Woody's use case given its map-like structure.

**Claude's position:**
Essentia + MERT is the correct combination, not a choice between them. Essentia handles deterministic feature extraction (Layer 1). MERT is the correct Layer 2 — a music-domain self-supervised transformer (masked audio modeling on RVQ codecs, trained on 160k hours) that captures temporal musical context Essentia can't. MERT is used as a fine-tuning base, not trained from scratch. JEPA is wrong for this problem: it's a world-model architecture suited for dense temporal prediction, not perceptual mapping. Shelve JEPA for Phase 3 behavioral modeling if session data is dense enough to support it.

**Status:** Decided

**Sentiment:** Confident — first time the recommendation had actual reasoning depth

**Category:** Architecture | Audio Pipeline | Engine

**Target doc:** PRD Section 5 — update Layer 2 to specify MERT fine-tuning

**Action needed:** Update PRD Section 5 with MERT as Layer 2 embedding backbone. Note: MERT runs server-side at track ingestion, not on-device.

**Additional context:**
MERT models are 300M-600M parameters — server-side embedding generation at ingestion time only. Not inference-time, not on-device. Embeddings stored per track.

---

## [UX] [AUDIO] — 2026-05-06

**What was discussed:**
YouTube player latency circumvention via Screen Capture API — full architecture including the synchronization problem and real UX challenge (permission dialog).

**User's position:**
Wanted a proper answer, not just "Screen Capture API is the way."

**Claude's position:**
The latency problem is a synchronization problem, not a round-trip latency problem. Solution: dual buffer with 2-second overlapping windows at 50% overlap → 1-second feature update cadence. Acoustic field visualization lerped at 30fps. The harder problem is the permission UX — `getDisplayMedia` dialog is jarring. Fix: pre-request permission on session start as a feature reveal, not as a security dialog. Engineering conscience: captured audio processed in-browser via Essentia.js in SharedArrayBuffer only, never uploaded. Requires COOP/COEP headers.

**Status:** Decided

**Sentiment:** Confident

**Category:** Architecture | UX | Audio Pipeline

**Target doc:** BUILD_BRIEF.md

**Action needed:** Add YouTube integration architecture to BUILD_BRIEF.md with COOP/COEP header requirements and permission UX spec

---

## [SOCIAL] [VISUAL] — 2026-05-06

**What was discussed:**
Artifact format redesign — why short-video artifacts fail as community objects, and the creator ownership problem.

**User's position:**
Emphatic: "we need a community artifact and a holistic artifact." Creators must be able to claim the artifact as theirs, not as Woody's.

**Claude's position:**
The artifact must show *becoming*, not result. Format split: short video (TikTok/Reels for reach), live screen/projection (DJ sets), interactive web artifact (Mixcloud/blog embeds). Creator ownership fix: Woody provides acoustic data and visualization engine, creator assembles final artifact using their color palette, typography, branding. Woody gets a metadata credit, not a visual element. Similar to SoundCloud embed model.

**Status:** Decided (format principles) | Proposed (template system implementation)

**Sentiment:** Emphatic — creator ownership is non-negotiable

**Category:** Social | Visual | GTM

**Target doc:** FEATURES.md artifact system section | PRD Section 12

**Action needed:** Update FEATURES.md with creator-native template architecture and "powered by Woody" metadata credit model

---

## [UX] [ENGINE] — 2026-05-06

**What was discussed:**
The arc concept reframing — making it concrete instead of abstract product-speak.

**User's position:**
Frustrated: arc concept is abstract and the UX around it lacks complexity.

**Claude's position:**
Arc = trajectory through acoustic space over time. A playlist is a set of objects; an arc is a path with direction, momentum, start/end state. Product expression: a particle moving through the acoustic field visualization. User sees where they are, where they've been, where the music is heading. They can drag the endpoint to redirect the engine. The arc is the interaction surface.

**Status:** Decided — arc = trajectory through acoustic space, visualized as moving particle, steerable by dragging endpoint

**Sentiment:** User was frustrated at vagueness

**Category:** UX | Visual | Engine

**Target doc:** PRD Section 3 | VISUAL_LANGUAGE.md

**Action needed:** Update PRD Section 3 with arc-as-trajectory framing and particle-trace interaction spec.

---

## [COLD-START] [UX] — 2026-05-06

**What was discussed:**
Cold start redesign — Bayesian probe approach and psychologically rich conversation fallback.

**User's position:**
"Fairs common solution, but we can do better." Artist chat fallback "is ass, not ux designed, just some bs generated."

**Claude's position:**
Better cold start: Bayesian optimization over acoustic probe space. 6-8 tracks spanning the 5D space. Behavioral response to each probe updates a Gaussian process prior over taste space. Next probe chosen by maximum expected information gain. 6 observations enough to converge to territory estimate. Faster and more accurate than Spotify history (bypasses Spotify's collaborative filtering bias embedded in history).

Fallback conversation redesign: never ask about artists. Ask about relationship to sound: "When do you most need music?", "What's a song that sounds like how you feel right now?", "What's the last song you turned off because it was wrong for the moment?", "Where are you when music matters most?" Maps to acoustic coordinates via intent BERT model.

**Status:** Decided (conversation design) | Proposed (Bayesian probe — needs Phase 1 validation)

**Sentiment:** User frustrated at laziness of previous answer

**Category:** Cold Start | UX | Engine

**Target doc:** PRD Section 23

**Action needed:** Rewrite PRD Section 23 with Bayesian probe cold start as primary and psychologically rich conversation as fallback.

---

## [ENGINE] [AUDIO] — 2026-05-06

**What was discussed:**
Dimension calibration architecture — pairwise learning, anchor corpus, cultural bias.

**User's position:**
"My BERT thing was a suggestion so please think harder."

**Claude's position:**
Full calibration pipeline: (1) Anchor corpus — 200 tracks spanning 5D space, rated pairwise by 20+ listeners, Bradley-Terry model converts pairwise wins to continuous scores. (2) DistilBERT fine-tuned on Essentia features → 5D coordinates, ~3000 labeled examples. (3) Online calibration via behavioral Bayesian posterior per-user. (4) Active calibration — occasional explicit pairwise UI questions. Cultural calibration gap: Essentia beat features assume Western time signatures. Non-4/4 music needs metadata-conditioned correction factor.

**Status:** Decided

**Sentiment:** Confident

**Category:** Engine | Audio Pipeline | Architecture

**Target doc:** PRD Section 5 | BUILD_BRIEF.md

**Action needed:** Update PRD Section 5 with full calibration pipeline including cultural calibration gap.

---

## [PERSONAL-MODEL] [ARCH] — 2026-05-06

**What was discussed:**
On-device personal model — full architecture spec.

**User's position:**
"Personal on device model - help me more please."

**Claude's position:**
Model: Phi-3-mini-4k or Gemma-2B, INT4 quantized (~750MB-1.5GB). Not doing token generation — maintaining learned acoustic preference state vector via offline RL. Key innovation: can condition on context server never sees (time of day, accelerometer, ambient audio, battery level). Granular RL reward function (skip timing, replay, add to library, manual next <20s). Cold init from population prior distributed with app binary. Single forward pass ~200ms on iPhone 15 Pro — sufficient for transition-time inference, too slow for within-track. Engineering conscience: model weights need NSFileProtectionComplete (iOS) / EncryptedFile (Android).

**Status:** Decided (architecture) | Pending (implementation spec)

**Sentiment:** Confident

**Category:** Architecture | Personal Model | Privacy

**Target doc:** PRD Sections 5 and 7 | BUILD_BRIEF.md

**Action needed:** Update PRD Sections 5 and 7 with full on-device model spec including reward function, cold initialization, hardware constraints.

---

## [VISUAL] [UX] — 2026-05-06

**What was discussed:**
Visualization as product — three jobs it must solve, design constraints.

**User's position:**
"The visualisation thing you mentioned just feels like its not a thought through product."

**Claude's position:**
Three jobs: (1) Pre-conscious acoustic awareness — visualization runs *ahead* of perception using predictive feature extraction (predict 2-4 second acoustic direction). (2) Session steering without words — visualization is input surface, dragging arc endpoint is the intent interface. (3) Trust signal — makes engine reasoning visible and disputable. Design requirements: personal territory has persistent visual identity; particle has inertia; zooming out reveals community heat map; field must be desirable even without music playing. Design for eyes-open contexts first (drawing, studying, driving with mounts).

**Status:** Decided (function) | Needs dedicated design session (execution)

**Sentiment:** User frustrated at lack of product thinking depth

**Category:** Visual | UX | Architecture

**Target doc:** VISUAL_LANGUAGE.md | PRD Section 3

**Action needed:** Extend VISUAL_LANGUAGE.md with particle motion physics spec, predictive rendering approach, community heat map layer. Needs dedicated visual design session.

---

## [ARCH] — 2026-05-06

**What was discussed:**
Engineering-conscience skill creation — persistent security/privacy/ethics audit layer.

**User's position:**
Requested a skill covering auth, privacy by design, OWASP, GDPR/CCPA, ethical ML, secure coding, dependency risks. Persistent once activated. Proportional.

**Claude's position:**
Skill written to `skills/engineering-conscience/SKILL.md`. Added to CLAUDE.md as persistent behavior layer. Covers: OAuth scopes, JWT handling, on-device model access controls, raw event isolation, federated gradient integrity, Spotify ToS, OWASP Top 10 mapped to Woody, cultural bias in Essentia features, RL exploration budget, attribution labeling confounds, Screen Capture API audio isolation, model weight encryption, MERT/Phi-3 license terms.

**Status:** Completed

**Category:** Architecture | Privacy | Security

**Target doc:** CLAUDE.md (updated), skills/engineering-conscience/SKILL.md (created)

**Action needed:** None — skill live.

---

## [ENGINE] [AUDIO] — 2026-05-05

**What was discussed:**
The 5D acoustic dimensions (Energy, Warmth, Density, Organicity, Sacred) are too few and too simple for the engine. The real acoustic space has far more structure. The Tier 1 / Tier 2 embedding architecture was proposed: T1 = interpretable user-facing dimensions, T2 = high-dimensional behavioral embeddings.

**User's position:**
"i dont know why but for the complexity of what we are doing should we not have a lot more vectors defined" — user felt the current 5D is underselling the space, especially given the psychology underpinnings. Also pushed for the system to have space to include more dimensions if needed. Questioned whether T1 is contextual/perceived and characterized through acoustic attribution combinations.

**Claude's position:**
T1 (5D) is the right user-facing surface — interpretable, visualizable, maps to natural language. But the engine should run on Layer 2 (raw audio feature extraction, ~100D from librosa/Essentia) and Layer 3 (learned acoustic embeddings, 64-256D, not interpretable). T1 is a *projection* over this richer space, not the space itself. The dimensions should be a schema, not a hardcoded list — extensible by design.

**Status:** Decided

**Sentiment:** Emphatic (user)
*Note:* User was clearly sensing a gap in the spec before being able to fully articulate it. "Even Spotify had more embeddings man we can definitely do better."

**Category:** Engine | Audio

**Target doc:** PRD Section 5 (needs rewrite to separate T1/T2/audio feature layers properly)

**Action needed:** Rewrite PRD Section 5 with full 4-layer embedding architecture

**Additional context:**
The four layers: (0) raw audio waveform, (1) extracted audio features ~100D, (2) learned acoustic embeddings 64-256D, (3) T1 perceptual 5D projection. T1 is derived from Layer 1 features through mapping formulas (or learned projection). Layer 2 is what the engine actually uses. Layer 4 = behavioral embeddings (from listening behavior, not audio).

---

## [ENGINE] [ARCH] — 2026-05-05

**What was discussed:**
Beam search vs. dynamic Markov chain for arc execution. User proposed a dynamic Markov chain approach with context embeddings that creates a shortlist which only breaks on user disinterest signal.

**User's position:**
"what if we approach this problem like a dynamic markov chain that gives context embeddings in a very cost effective mechanism to then decide but we still have an initial range set by another form of search that creates a shortlist that only breaks when prompted by user behaviour to suggest disinterest"

**Claude's position:**
The Markov approach is better than pure pre-computed beam search for the execution layer. Both are needed: beam search as the planning layer (macro arc shape, waypoints), Markov as the execution layer (micro step decisions, real-time adaptation). The "shortlist that only breaks on disinterest" is the acoustic momentum mechanism — maps to how flow states actually work. This wasn't in the PRD and needs to be added.

**Status:** Decided

**Sentiment:** Confident (both)

**Category:** Engine | Architecture

**Target doc:** PRD Section 5.3 (Arc Generation) and Section 7.3 (Engine Requirements) — needs rewrite

**Action needed:** Rewrite arc generation spec with two-layer architecture (planning + execution)

**Additional context:**
The acoustic zone / neighborhood concept is implied by this approach — a zone is a shortlist of acoustically coherent tracks. The system stays in the zone until a disinterest signal fires, then recomputes context embedding and builds new shortlist. Acoustic momentum ≠ rigid arc following.

---

## [ENGINE] [ARCH] — 2026-05-05

**What was discussed:**
Attribution objectives in the behavioral model — training not just on skip/replay signals but on *why* those signals happened (which acoustic dimension caused the failure).

**User's position:**
Proposed a "learning system with attribution objectives where we define combinations into a db and use that as reference." Wants the system to know which dimension caused a transition failure, not just that a failure occurred.

**Claude's position:**
Sharp idea, not in the PRD. Attribution objectives turn the recommendation engine into an acoustic intelligence system — the model can explain, debug, and steer because it knows *why* things work. Also proposed acoustic archetypes — named clusters in embedding space (e.g. "warm organic descent", "cold electric drive") as navigation anchors. The Markov execution layer navigates between archetypes rather than continuous coordinate space.

**Status:** Decided — add to PRD

**Sentiment:** Excited (Claude), Emphatic (user)

**Category:** Engine | Architecture

**Target doc:** PRD Section 7 (Engine Requirements) — new subsection on attribution objectives and acoustic archetypes

**Action needed:** Add attribution objectives spec and acoustic archetype discovery to PRD

**Additional context:**
Attribution training: at skip moment, decompose signal against acoustic dimensions at transition. Model learns which dimensions predict failure in which session contexts. Acoustic archetypes: discovered by clustering behavioral embedding space, then labelled. Combination database = the archetype library.

---

## [ENGINE] [COLD-START] — 2026-05-05

**What was discussed:**
Cold start problem — can we use Spotify listening history instead of a blank slate? Also: chat interface with artist naming as alternative.

**User's position:**
"could we not source data from previous listening instead of a real cold start? and if cold start surely we can get some insight through a chat interface and naming artists as a rough starting point"

**Claude's position:**
Yes, absolutely. Spotify API provides: top_tracks (short/medium/long term), top_artists, recently_played (last 50), saved tracks, user playlists. Extract Audio Features for all of these → immediate initial territory before user has done anything in Woody. Artist naming maps to: extract acoustic fingerprints from artist's catalog → territory centroid seed. Both approaches are far better than blank slate.

**Status:** Decided

**Sentiment:** Confident (user — this felt obvious in retrospect)

**Category:** Cold-Start | Engine

**Target doc:** PRD Section 23 (New User / Cold Start Experience) — update cold start strategy

**Action needed:** Update Section 23 to lead with Spotify history as primary cold start mechanism

**Additional context:**
Artist chat as fallback for users with sparse Spotify history. 5 artists named → acoustic fingerprints extracted → territory centroid seeded. This also removes the "blank constellation" problem on first login — user sees a populated territory immediately, built from their history.

---

## [AUDIO] [ARCH] — 2026-05-05

**What was discussed:**
Librosa as audio analysis tool — is it good enough, allowed online, any ethical issues, better options, how does the architecture work from librosa to vectors?

**User's position:**
"is librosa even good enough and are we allowed to use it online? any ethical issues? probably lol. any better options than librosa, also what is the architecture from librosa to vectors??"

**Claude's position:**
Librosa: MIT licensed, fine for commercial use, no ethical issues with the library itself. Ethical issue is access to audio files (Spotify DRM-protected — can't feed Spotify streams to librosa). Good for: YouTube audio, uploaded files, mic input, SoundCloud if stream accessible. Better options: Essentia (MTG Barcelona) — more comprehensive, production-grade. For browser: Meyda.js or essentia.js (WASM). Architecture: audio file → librosa/Essentia → ~50-100 raw features (MFCC, chroma, spectral, tempo, onset) → mapping formulas → 5D T1 coordinates AND stored as Layer 2 acoustic embedding (100D feature vector). Phase 3: neural net projection → T2 behavioral embedding space.

**Status:** Decided (Essentia as preferred, librosa as fallback)

**Sentiment:** Curious (user)

**Category:** Audio | Architecture

**Target doc:** PRD Section 15 (Technical Architecture) — add audio analysis pipeline subsection

**Action needed:** Add audio analysis pipeline spec to PRD (Essentia/Librosa → feature vector → T1 mapping)

**Additional context:**
The ethical issue isn't librosa — it's audio access. We can't analyze Spotify tracks directly (DRM). We can analyze: user-uploaded audio, YouTube audio (if we buffer it), mic-captured audio (Web Audio API), SoundCloud streams where accessible. Spotify Audio Features API remains the only route for Spotify-catalogued tracks in Phase 1. The own-analysis pipeline (Phase 2-3) targets non-Spotify sources first.

---

## [SOCIAL] [VISUAL] — 2026-05-05

**What was discussed:**
Artifact shareability problem — static images/GIFs look like any other attached content on Instagram/TikTok/Mixcloud. Need an innovative format.

**User's position:**
"if it looks like a gif just attached, then its gonna look like shite, real world usage of screens with visuals might be better but we would need some pull to have people use it like that or some money which we dont exactly have, so we will have to get creative and think outside the box with a innovative content format that includes our visualisation feature and later used in live audiences etc etc." Also: "a format that doesnt dampen or ruin our format but also doesnt make the user want to never try use the feature again and also gets the users audience a good way to actually engage their audience"

**Claude's position:**
The artifact can't be a static image — it's too easy to scroll past. Options: (1) short video format (15-30s of the acoustic field responding to music — native TikTok/Reels format), (2) live visualization on second screen or projection behind DJ during live sets, (3) interactive web artifact (linkable page, visitors interact with arc), (4) format innovation — something genuinely unprecedented that creates "what is that?" response. The format must serve a real purpose for the person sharing it (not just look nice) — DJs share because it proves professional competence, not because they're promoting Woody.

**Status:** Open — needs dedicated creative session

**Sentiment:** Frustrated (user — "we will have to get creative"), Aligned

**Category:** Social | Visual | GTM

**Target doc:** PRD Section 12 (Social Architecture) — artifact format spec needs expansion

**Action needed:** Dedicated session on artifact format innovation. Live screen integration for DJ sets. Interactive web artifact spec.

**Additional context:**
The physical screen / live audience angle is important — DJ set with Woody acoustic field running behind them is a completely different format from a social post. The format needs to work across: social posts (short video), live events (screen/projection), web embeds (interactive), and DJ set documentation (Mixcloud/Boiler Room). These may need different format variants.

---

## [PRIVACY] [ARCH] — 2026-05-05

**What was discussed:**
Privacy by design — how does it actually work technically? Is it like WhatsApp E2E encryption? How do we tweak things if everything stays local?

**User's position:**
"how do we do this privacy by design, is it like a whatsapp thing where everything and all signals are encrypted? and how would we know how to tweak the right things then? this is where you gotta help me. im guessing your circumvention is that everything stays local which is also valid, ok a key is trust and something i can definitely get behind cos i dont want to be violated with trust"

**Claude's position:**
Federated learning is the mechanism. Data stays on device. Only model update *gradients* (not raw data) go to the server, aggregated across many users. Server learns from aggregate behavior without seeing individual acoustic histories. For tweaking: you measure aggregate model improvement (skip rate, session completion) without reconstructing individual data. WhatsApp analogy is right for transit encryption but federated learning goes further — the server never holds the sensitive data at all.

**Status:** Decided (federated learning as privacy architecture)

**Sentiment:** Confident (user — "i can definitely get behind cos i dont want to be violated with trust")

**Category:** Privacy | Architecture

**Target doc:** PRD Section 24 (Privacy & Data) — add federated learning spec

**Action needed:** Update PRD Section 24 with federated learning architecture detail

**Additional context:**
Key point: Woody needs aggregate behavioral signals to train models (skip patterns, transition coherence) but does NOT need to see individual users' emotional/acoustic histories. These are separable. On-device: territory computation, personal model, behavioral signals. Server: aggregate model updates via federated learning, encrypted territory blob for cross-device sync. The personal model (see below) extends this — the personalization model lives on-device entirely.

---

## [PERSONAL-MODEL] [ENGINE] — 2026-05-05

**What was discussed:**
Native personal LLM that gets fine-tuned per user — light parameters, RAG-style, RL-based, improves as a personal acoustic state model.

**User's position:**
"voice input matter and visual input and attribution system and a native llm thats getting fine tuned? reinforcement learning model light sized rag style with light parameters that learns and improves as your personal state"

**Claude's position:**
Strongly agrees. This is the right end-state architecture. Small models (Phi-3, Gemma 2B class) are viable on mobile hardware. RL reward signal = session quality (uninterrupted time, completion rate, replay events). RAG component = retrieves from user's own acoustic history as context. The model learns: "this user at 10pm post-workout needs X" from their own behavioral patterns. This also solves privacy by design — the personalization model never leaves the device.

**Status:** Decided

**Sentiment:** Confident (user stated as requirement)

**Category:** Engine | Personal-Model | Privacy

**Target doc:** PRD Section 5 and 7 — add personal model layer to architecture

**Action needed:** Add personal model architecture to PRD engine spec

**Additional context:**
This is Phase 3+ architecture. Phase 1 uses population priors. Phase 2 uses server-side behavioral model. Phase 3 personal model runs on-device. The transition from server-side to on-device personalization is a major architectural milestone. Cold start: personal model initializes from population priors, then learns from user's behavioral signals over time.

---

## [ENGINE] [UX] — 2026-05-05

**What was discussed:**
Arc quality in Phase 1 — user will not accept mediocre recs. Beam search + Markov quality is "not acceptable."

**User's position:**
"idk what to do markov chain beam search, its not acceptable, i pride myself on good recs and a seamless experience or at least my capability to think i can build something like that and i will not compromise on that. a brand a vision and movement a community is more than a product"

**Claude's position:**
The quality bar must be set at Phase 1 and validated empirically before launch. The Phase 1 arc cannot accept mediocre quality just because it's Phase 1. Practical solutions: pre-compute multiple arc variations and switch on early skip signals; lightweight reactive shortlist behavior (if skip in first 3 tracks, immediately pull from backup arc); very carefully tuned transition coherence rules hardcoded with the psychological constraints. The Markov execution layer should be moved forward — even a simple "if skip, pull from acoustically adjacent shortlist" is better than rigid arc following.

**Status:** Decided — quality bar is non-negotiable from Phase 1

**Sentiment:** Emphatic (user — this is a brand identity point, not just a product preference)

**Category:** Engine | UX

**Target doc:** PRD Section 18 (Roadmap) — Phase 1 exit criteria need to include arc quality validation threshold

**Action needed:** Add arc quality validation requirement to Phase 1 exit criteria. Move lightweight Markov execution to Phase 1.

**Additional context:**
"A brand a vision and movement a community is more than a product" — user is thinking about this as a cultural artifact, not a utility app. The rec quality IS the brand. This changes the Phase 1 scope: must include at minimum: multiple pre-computed arc variations, early-skip fallback behavior, validated quality threshold before launch.

---

## [GTM] [SOCIAL] — 2026-05-05

**What was discussed:**
User as "user 0" — testing the product themselves, starting DJing, building social media presence, using Woody in their own DJ content.

**User's position:**
"i literally have been saying this from the very fucking start" [re: Spotify as enhancement]. "i plan on starting djing soon and getting decks so i could start rolling out content that way and integrating woody into my vids?? user 0 testing, getting and shouting and talking about this stuff online or something, ive been meaning to start posting shit too lol. i feel like we will need to create a good marketing and rollout plan for early adoption and first impressions too."

**Claude's position:**
This is the strongest possible go-to-market: founder as first DJ user is authentic, not promotional. The user can: document the DJ learning journey, use Woody to analyze practice sets, post acoustic arc artifacts with sets, talk about what they're building in context of musical journey. Builds an audience interested in both music and product. "I'm building this because I need it" is the most credible product story.

**Status:** Decided — founder-led content as primary early GTM

**Sentiment:** Excited (user), Strongly aligned (Claude)

**Category:** GTM | Social

**Target doc:** PRD Section 29 (Landing Page) and new Section 31 (Early Adoption / GTM Strategy) needed

**Action needed:** Create dedicated GTM/early adoption section in PRD. Document founder-DJ strategy formally.

**Additional context:**
This changes the DJ wedge strategy: the founder IS the first DJ, not just a recruiter of DJs. User 0 testing + content creation + audience building all happen simultaneously. The acoustic arc artifacts in DJ videos create genuine "what is that?" moments with an engaged music audience. Also: start DJing = immediate product feedback from real use = genuine product development insight.

---

## [SOCIAL] [GTM] — 2026-05-05

**What was discussed:**
TikTok and Reddit as community layer — light integration of these platforms as discovery sources alongside the product community.

**User's position:**
"i dont understand that shit. and thats facts about they like it not bcos theyre trying to promote woody meaning we will have to expand to universal accepted formats mixed in with trends and out of the box thinking you know." Also proposed: TikTok and Reddit threads should have light integration as community layer — content from these sources alongside people the user knows.

**Claude's position:**
Read-only integration from TikTok/Reddit is a genuinely new idea not in the PRD. Surface relevant content (trending tracks, thread recommendations) as acoustic context data — "this track is moving in r/ifyoulikeblank among users with similar acoustic territory." Doesn't require building an internal social network. Also: the artifact format for TikTok specifically needs to be a short video format (15-30s of the acoustic field) rather than a static image.

**Status:** Proposed — needs spec

**Sentiment:** Energised (user)

**Category:** Social | GTM | Community

**Target doc:** PRD Section 30 (Community) — add external platform integration layer

**Action needed:** Add TikTok/Reddit read-only integration to community roadmap. Spec artifact short-video format for TikTok/Reels.

**Additional context:**
The human touch / human recommendation point is important — people trust recommendations from people they know more than algorithmic suggestions. The community layer should surface: what people with similar acoustic territory are listening to, what's trending acoustically in relevant communities, what the DJ community is responding to.

---

## [GTM] — 2026-05-05

**What was discussed:**
Early adoption / influencer strategy — reaching out to social media influencers as early adopters, building social media influence before launch.

**User's position:**
"this also means i need to start building social media influence or something lol or reach out to social media influencers as early adopters right? which nowadays helps if there is a human touch and human recommendation so an ideal point this might pick up from"

**Claude's position:**
Influencer outreach for early adoption is correct but needs to target the right influencers — not general music influencers but acoustic/taste-focused audiences: music journalists who cover emerging apps, DJ culture creators, "what I'm listening to" content creators on TikTok, audiophile communities on Reddit. The human touch is critical — Woody should feel discovered, not promoted.

**Status:** Proposed

**Sentiment:** Self-aware about what's needed (user)

**Category:** GTM

**Target doc:** PRD — new GTM section

**Action needed:** Document influencer strategy in PRD. Identify target creator profiles.

---

## [RISK] [VISUAL] — 2026-05-05

**What was discussed:**
Visualization as a gimmick — the failure mode where the acoustic field is visually impressive but solves no real pain and users ignore it after 3 sessions.

**User's position:**
"one key thing visualisation needs to solve real pain and not be a simple fucking gimmick, that is definitely a failure mode you have not covered"

**Claude's position:**
Agreed — this is a critical failure mode not in the devil's advocate analysis. Visualization fails as a gimmick if: looks cool in demos but adds no listening value, users learn to ignore it (banner blindness equivalent), it's a distraction not an enhancement, it could be replaced with a Spotify playlist and nothing would be lost. Visualization succeeds if: it changes how you experience the music, creates genuine "oh, that's why this felt different" moments, acts as real-time feedback that builds trust in the system, and is intrinsically worth having independent of the music quality.

**Status:** Decided — visualization must solve real pain, not decorate

**Sentiment:** Emphatic (user — used "fucking gimmick" = strong signal)

**Category:** Visual | UX | Risk

**Target doc:** PRD Section 9 (Visual Language Requirements) — add "must solve real pain" principle

**Action needed:** Add visualization pain-solver requirement to PRD. Define what "real pain" visualization solves.

**Additional context:**
The test: would you want the acoustic field running even if the music was exactly the same as Spotify? If yes → intrinsically valuable. If no → gimmick. What real pain does it solve? (1) Trust signal — you can see the arc moving, which builds confidence the system is working. (2) Awareness — the acoustic field shows you what the music is doing before you consciously register it. (3) The social object — the artifact IS the thing you share, which means the visualization has utility beyond the listening session. These need to be designed as explicit product outcomes, not side effects of looking cool.

---

## [ENGINE] [AUDIO] — 2026-05-05

**What was discussed:**
Lightweight BERT fine-tuning for dimension calibration and intent-to-dimension mapping — replacing LLM prompt engineering.

**User's position:**
"can we hypertune lightweight berts or something i dont know man on the dimension calibration and perceptual accuracy for sure, we definitely need to do something about that a foolproof plan. i dont think llm prompt engineering will suffice."

**Claude's position:**
Correct — prompt engineering won't solve perceptual accuracy at the required level. Fine-tuning a small BERT-class model (DistilBERT, TinyBERT, MobileBERT) on labeled (track → dimension score) pairs is the right approach. For audio: wav2vec 2.0, data2vec, or MusicBERT are fine-tunable on audio features. Training data: ~1000 labeled tracks is sufficient to fine-tune a small model. The bootstrap path: formula-derived scores as initial labels → human correction on a sample → fine-tuned model → iterative improvement.

**Status:** Decided — fine-tuned small model, not prompt engineering

**Sentiment:** Confident (user — stated as "foolproof plan" needed)

**Category:** Engine | Audio

**Target doc:** PRD Section 5 (Acoustic Intelligence) and Section 7 (Engine Requirements)

**Action needed:** Add BERT fine-tuning spec for dimension calibration to PRD engine requirements

**Additional context:**
Two separate fine-tuning tasks: (1) track → dimension score (acoustic calibration model), (2) intent text → dimension target (intent parsing model). Both are small, fast to fine-tune, and replace LLM dependency for core acoustic functions. LLM (Claude API) retained only for: natural language understanding of complex or ambiguous intent, explanation generation, the acoustic explanation layer. Not for core dimension mapping.

---

## [RISK] — 2026-05-05 (Perceptual Validation Design)

**What was discussed:**
The perceptual validation study (100 tracks, 30 raters) is hard to implement well.

**User's position:**
"might be hard to implement if we are asking 30 people that care about music to truly rate a 100 songs and this market research will definitely have to be designed a lot more carefully. i agree though some first hand data would definitely help. but still a baseline should be there for mapping that we can definitely hypothesise and then correct you know."

**Claude's position:**
Agreed — the study design needs to be much more careful than "ask 30 people to rate 100 songs." The study needs: controlled listening conditions, specific rating tasks not open-ended dimensions, anchor examples for each end of each dimension, genre-stratified track sampling (the mapping formulas may work differently across genres), and iterative rather than one-shot design. The formula-based baseline is correct as starting point — hypothesize, validate against human perception, correct.

**Status:** Decided (approach) — study design is open/needs research

**Sentiment:** Pragmatic (user)

**Category:** Risk | Engine | Audio

**Target doc:** PRD — add validation study design requirement

**Action needed:** Design the validation study properly. This is pre-build, not post-build work.

---

## [ARCH] [UX] — 2026-05-05 (Playback / YouTube)

**What was discussed:**
YouTube player as an alternative playback source, with optional video output and in-house EQ.

**User's position:**
"playback sdk is fine tbh we can use a youtube player with no or if wanted video output too + inhouse eq features as well"

**Claude's position:**
YouTube IFrame API works — can be CSS-hidden for audio-only. ToS technically requires video visibility but many apps work around this. Important caveat: YouTube player doesn't expose the audio stream to Web Audio API directly (CORS), so real-time acoustic analysis of YouTube playback requires the mic/Web Audio passthrough approach (capturing speaker output). In-house EQ: fully supported via Web Audio API BiquadFilterNodes — multi-band EQ is a clean differentiator.

**Status:** Decided — YouTube as Phase 2 source, with Web Audio EQ

**Sentiment:** Confident (user)

**Category:** Architecture | UX

**Target doc:** PRD Section 15 (Technical Architecture)

**Action needed:** Update multi-source integration spec with YouTube player approach and Web Audio EQ

---

## [SOCIAL] [GTM] — 2026-05-05 (Social capabilities timing)

**What was discussed:**
When to release in-house social capabilities.

**User's position:**
"i mean i was not planning on releasing in house social capabilities like you mentioned till we have networks and data you know."

**Claude's position:**
Agreed — this is correctly sequenced in the PRD already (social features invisible until community exists). External artifact sharing (Instagram, TikTok, Mixcloud) is the social layer in Phase 1. Internal social features only when there's network density to sustain them.

**Status:** Confirmed / Aligned

**Sentiment:** Pragmatic

**Category:** Social | GTM

**Target doc:** PRD Section 12 (Social Architecture) — already correct

**Action needed:** None — already documented

---

## [RISK] — 2026-05-05 (Revised Failure-Resistant Vision)

**What was discussed:**
Does the failure-resistant vision still hold after all these discussion points?

**User's position:**
"does your vision of a failure resistant version persist after my points of discussion? what changes or directional changes should we change?"

**Claude's position:**
Core stays: perceptual validation (modified design), DJ artifact as business-critical, privacy by design, own-analysis pipeline early. What changes: (1) cold start is now Spotify history + artist chat (much better), (2) Phase 1 arc quality is non-negotiable — must include lightweight Markov execution and quality validation threshold, (3) visualization must solve real pain not just be beautiful, (4) artifact format needs creative innovation beyond static image, (5) personal model architecture changes privacy story significantly, (6) founder-as-DJ is the GTM — not just DJ recruitment but founder-led content.

**Status:** Revised

**Sentiment:** Aligned

**Category:** Risk | GTM | Engine | Visual

**Target doc:** PRD throughout — multiple sections

**Action needed:** Consolidate revised failure-resistant vision into PRD somewhere (perhaps Section 1 Executive Summary or new Section 31)

---

## [ENGINE] [UX] — 2026-05-05 (Intent Input)

**What was discussed:**
Intent input design — must be excellent, not just optional. If badly designed in early stages it's self-harming.

**User's position:**
"i actually disagree cos if its not designed well, especially in early stages to build momentum would be stupid and self-harming"

**Claude's position:**
User is right. The argument "make it optional" is the wrong frame — the right frame is "make it so good that users want to use it AND the zero-input path is also excellent." Voice input is critical because it reduces intent friction to near zero. The early-stage intent UX needs to feel like talking to someone who understands music, not filling out a form.

**Status:** Decided — intent UX is a first-priority design challenge, not an afterthought

**Sentiment:** Emphatic (user — "stupid and self-harming" = strong)

**Category:** Engine | UX

**Target doc:** PRD Section 10.2 (Screen Requirements — Screen 2)

**Action needed:** Elevate intent input design quality as a Phase 1 priority. Voice-first design required.

---

## [GTM] [VISUAL] — 2026-05-05 (Visualization wedge)

**What was discussed:**
Visualization as a genuine product wedge — must create a compelling pull to actually use and share the feature.

**User's position:**
"we will need to create a good wedge with visualisation too"

**Claude's position:**
The visualization wedge works only if it's genuinely unprecedented visually AND solves real pain. The live screen integration (Woody acoustic field running behind a DJ) is the most powerful visualization wedge because it's a real-world context where the visualization is functional (the DJ can see their acoustic trajectory in real time), not just decorative. This is the "what is that?" moment at scale — in a room full of people.

**Status:** Decided — live screen/projection as primary visualization wedge

**Sentiment:** Confident

**Category:** GTM | Visual

**Target doc:** PRD Section 13 (DJ Mode) — add live visualization as DJ tool

**Action needed:** Add live acoustic field visualization as a DJ performance tool to PRD

---

*End of 2026-05-05 session notes.*
*Next session: update PRD with all Decided items above. Priority: cold start strategy, personal model architecture, audio pipeline spec, arc quality validation, visualization pain-solver requirement.*

---

## [ENGINE] [ARCH] — 2026-05-13 (CLAP as Navigation Backbone — Architecture Overhaul)

**What was discussed:**
Deep research session on mathematical representation for acoustic navigation. Evaluated CLAP, MERT, JEPA, sqlite-vec, and the validity of the existing 5D linear formula from Spotify Audio Features.

**User's position:**
"these math stuff are way too simplistic and not representative of human nature" — pushed back hard on the original 5D linear formula used for navigation. Asked for genuine deep research, not surface-level recommendations.

**Claude's position and decisions made:**

1. **CLAP replaces 5D formula as the navigation space.** laion/larger_clap_music_and_speech produces 512-dim shared audio+text embeddings. Text "late night drive" and matching audio are near each other in this space. This is the correct navigation backbone — not because it's fashionable, but because it directly solves the alignment problem: intent expressed in language and audio both live in the same metric space.

2. **Spotify valence is unreliable.** Research confirmed r=0.67 correlation with human perception. The 5D linear formula (warmth = valence×0.6 + acousticness×0.4) compounds noise from an already-noisy source. This is a fundamental flaw, not a tuning problem.

3. **The 4-layer architecture is revised:** Layer 2 is now CLAP (512D), not MERT. MERT remains relevant for fine-grained audio understanding tasks but CLAP is the right embedding for navigation because it's multimodal — text and audio share the same space. Revised layers:
   - Layer 0: Raw audio
   - Layer 1: Essentia signal features (~400D)
   - Layer 2: CLAP embeddings 512D [PRIMARY NAVIGATION LAYER]
   - Layer 3: 5D perceptual projection [DISPLAY ONLY — lossy]

4. **5D coordinates are display-only.** The 5D formula is retained as a Phase 1 heuristic for the visual field renderer and user-facing coordinate display. Navigation, arc generation, and k-NN search all operate in 512D CLAP space using cosine similarity. This is a hard architectural separation.

5. **sqlite-vec is the Phase 1 vector store.** v0.1.0 stable (2024). Zero infrastructure overhead. Virtual table vec0 for cosine similarity. Same schema as pgvector — swap driver when scaling.

6. **Bayesian probe confirmed as primary cold start.** 8 probe tracks spanning CLAP space. Behavioral responses (replay=3.0, save=4.0, listen_through=1.0, skip_late=-0.5, skip_early=-1.5, skip_immediate=-2.5) update territory centroid via weighted average. Supersedes Spotify history as primary cold start signal.

7. **Beam search in CLAP space.** Coherence constraint: cosine distance < 0.35 between consecutive tracks. Relaxation schedule: 1.0x → 1.5x → 2.0x → unlimited. Frisson targets: 30%, 65%, 85% of arc progress (±0.06).

8. **PersonaLens retained for search queries only.** LLM-generated Spotify search seeds (artist names, genres) remain useful for populating the track pool. But acoustic target computation (what the arc is navigating toward) is CLAP text embedding, not LLM 5D output.

9. **Arc shapes formalised:** journey (linear A→B), plateau (reach target fast, hold), discharge (start congruent, move later — for emotional processing), peak_early (BRAC-aligned, peak at ~40% then descend — for workouts). Shape inferred from intent text signals.

10. **Skip taxonomy formalised:** <15% playtime = acoustic mismatch (attribution needed per dimension), 15-70% = moderate engagement, >70% = transition signal (NOT rejection — this is a psychology law from PSYCHOLOGY.md).

**Deliverable created:** `WOODY_BUILD_SPEC.md` — complete technical build specification (~600 lines) covering all of the above in Cursor-executable detail. This is the canonical engineering reference for Phase 1 build.

**Status:** Decided — architecture is locked for Phase 1

**Sentiment:** Aligned after correction — user pushed back correctly on oversimplification, research validated the concern and produced a materially better architecture

**Category:** Engine | Architecture | Audio Pipeline

**Target doc:** WOODY_BUILD_SPEC.md (created this session), .cursor/rules/woody-engine.mdc (updated this session), MASTER_BUILD_PROMPT.md Section 6 (needs annotation)

**Action needed:**
- Cursor: execute 8-step build sequence in WOODY_BUILD_SPEC.md Section 13
- packages/acoustic-service/: scaffold FastAPI service with CLAPService class
- lib/acousticService.ts: client for acoustic service
- app/api/arc/route.ts: new arc endpoint using CLAP navigation
- lib/arcShape.ts: intent text → arc shape inference

---

## [ENGINE] [ARCH] — 2026-05-13 (Distance Metric Evolution)

**What was discussed:**
Phase-gated distance metric evolution for the navigation engine.

**Decision:**
- Phase 1: Cosine similarity in CLAP 512D space (simple, fast, correct)
- Phase 2: Mahalanobis distance (accounts for correlated CLAP dimensions — some dimensions co-vary)
- Phase 3: Learned contrastive metric from behavioral data (trained on skip/replay/completion signals)

**Status:** Decided

**Category:** Engine | Architecture

**Target doc:** WOODY_BUILD_SPEC.md Section 9

**Action needed:** None for Phase 1. Flag for Phase 2 planning.

---

## [ENGINE] — 2026-05-13 (5D Calibration Path)

**What was discussed:**
How to calibrate the 5D display projection from CLAP embeddings.

**Decision:**
- Phase 1: Heuristic Python formula from Spotify Audio Features (retained from MASTER_BUILD_PROMPT.md Section 2 — display only)
- Phase 2: Linear probe (Ridge regression, 500 annotated tracks, Bradley-Terry pairwise comparison). Output: 5×512 weight matrix projecting CLAP → 5D. This is the correct path for display accuracy once track corpus is large enough to annotate.

**Status:** Decided — Phase 1 heuristic is acceptable, Phase 2 is the upgrade path

**Category:** Engine | Calibration

**Target doc:** WOODY_BUILD_SPEC.md Section 8

**Action needed:** None for Phase 1. Annotation workflow to be designed for Phase 2.

---

## [PRODUCT][EVIDENCE][WORKFLOW] — 2026-07-14 (Adaptive journeys + two synchronized streams)

**What happened:** The codebase/documentation audit was combined with the later reactive-running discussion. Founder confirmed a desire to build the underlying system rather than only run manual validation, and challenged the false choice between validation and technical progress. A spontaneous non-founder problem signal also appeared: a friend described pre-planning an entire music queue for motorbike rides to avoid skipping, intentionally aligning songs with route shape, estimated speed, turns, and moments so the ride feels fun and timed.

**Interpretation:** The friend account is meaningful evidence of the **problem**, especially outside running: low-control journeys create preparation and interaction costs that a normal playlist does not always remove. It is not yet evidence that the friend wants an adaptive system; no solution was proposed or tested. Follow up without pitching first.

**Product direction:** Running remains the first laboratory because the founder can test frequently. It is not Woody's permanent definition. The shared category is **adaptive music for low-control journeys**. The primary moment is now: *the next track arrives at the right moment without the listener having to manage it.* Discovery and understanding remain important receipts, but are not the only gate.

**Workflow decision:** Run two streams simultaneously:
1. **Experience/evidence:** founder sessions, matched static-playlist comparisons, non-leading interviews, and post-session transition review.
2. **System/learning loop:** a generic journey-session model, one-next-track selection from the embedded corpus, Spotify playback, and persisted transition events.

The streams are coupled: system work may be at most one experiment ahead of evidence. This permits real building without returning to architecture-first drift.

**UX decision:** Lift / Hold / Release may be used during safe founder sessions as temporary instrumentation that labels desired direction. It is not the intended final interaction. Motorbike/riding experiences must be zero-touch during the ride; candidate signals include route shape, speed, progress, turns, prior behavior, and post-ride judgment.

**Technical direction:** Build one generic next-track primitive, conceptually `POST /api/journey/next`, rather than separate run/riding engines or a pre-planned fixed arc. Inputs combine listener, journey, current track, recent trajectory, requested/inferred direction, exclusions, and session history. Every decision must create a durable event record before Woody can honestly claim to learn.

**Explicitly frozen:** cadence as assumed controller, heart-rate integration, full fascia/learned metric, owned pipeline expansion, knowledge graph, social systems, monetisation, and activity-specific products. These are candidates after the two-week loop produces evidence.

**Action needed:** rotate exposed credential; fix production build; interview the motorbike rider; define generic journey and transition event contracts; build the minimal next-track loop; run 6–8 matched founder sessions before passive sensing.

**Category:** Product | Evidence | Workflow | Adaptive Journeys
