# Woody — PRD Audit Record
*Formal audit findings, severity classifications, and responses. Append new audits here with date.*
*Never delete entries — mark as RESOLVED with date and what was changed.*

---

## PRD Audit — 2026-05-06

**Auditor:** idea-prd-killer skill (Claude / Cowork)
**Input:** PRD.md (version dated 2026-05-06, 30 sections, ~1700 lines)
**Classification:** PRD — has goals, requirements, metrics, architecture, roadmap, personas, business model.

---

### CRITICAL Findings

---

#### C1: Engine architecture and algorithm specs contradict each other
**Status:** PARTIALLY RESOLVED — see PRD Section 5.1b note added 2026-05-06

**Finding:** Section 5.1b states "The recommendation engine operates primarily in Layer 2 (full fidelity)" (64-256D MERT embeddings). But every algorithm in Sections 7.1–7.5 operates in 5D T1 space. k-NN, territory biasing, arc generation cost functions — all 5D. These are not the same thing.

**Resolution added to PRD:** Clarified that Phase 1 engine runs in T1 (5D). Layer 2 incorporated in Phase 2 when MERT pipeline is trained. Algorithm specs in Section 7 are correct for Phase 1. Section 5.1b to be annotated with this phase distinction.

**Remaining action:** Rewrite Section 5.1b opening line to: "The engine runs in T1 (5D) in Phase 1. Layer 2 MERT embeddings are incorporated in Phase 2, at which point the distance function and k-NN shift to higher-dimensional space." — **NOT YET DONE**

---

#### C2: Phase 1 scope is impossible for a solo founder in 3 months
**Status:** OPEN — reframed but not resolved in PRD

**Finding:** Phase 1 (0–3 months) as listed includes DistilBERT calibration (requires 200-track anchor corpus, 20+ human raters, Bradley-Terry fitting, ~3000 labeled examples), MERT fine-tuning (300M-600M parameter model), Bayesian acoustic probe cold start, full design system, full Now Playing screen. No resourcing assumptions stated anywhere.

**Context:** Solo founder confirmed. Speed is not the constraint — data, listeners, and validation are. The correct reframe: Phase 1 is validated in stages, not shipped as a complete deliverable.

**Revised Phase 1 approach (2026-05-06):**
- Phase 1a (weeks 1–6): Spotify import + hard-coded 5D formulas + HNSW + basic intent parser + sessions play. Validate on founder (user 0) — 50 sessions, measure skip rate.
- Phase 1b (weeks 7–16): anchor corpus (founder-rated initially, 200 tracks pairwise), DistilBERT calibration model, beam search arc generation, transition coherence V1.
- MERT fine-tuning: Phase 2 (not Phase 1).
- Bayesian probe cold start: Phase 2 (requires probe corpus and users to respond — can't build in isolation).

**Remaining action:** Update PRD Section 18 (Roadmap) to reflect this split. — **NOT YET DONE**

---

#### C3: GTM acquisition model rests on one unvalidated assumption
**Status:** OPEN — redesign proposed, not yet in PRD

**Finding:** Section 17.1: "DJs generate acoustic arc artifacts that drive organic awareness." Entire acquisition chain is stated as fact rather than hypothesis. No fallback if DJs don't adopt the artifact workflow.

**Redesign proposed (2026-05-06):**
1. Zero-account artifact generation: DJ pastes tracklist at woody.io/set → gets arc visualization immediately, no login. Share it. Account creation downstream, not gated.
2. The adoption hook must be diagnostic value, not just aesthetic: acoustic gap detection + bridge suggestions tells DJs something they can't get anywhere else. This is the retention mechanism. The artifact is the acquisition mechanism.
3. Moat reframe: the moat isn't shareability — it's the diagnostic intelligence. Shareability is the distribution vector. Craft improvement is the lock-in.
4. Validated assumptions to design on: DJs share sets publicly (validated), DJs care about transition quality (validated), DJs respond to tools that improve their craft (validated).
5. Fallback if DJ wedge underperforms: founder-led content, Discord/Reddit community seeding, direct listener outreach.

**Remaining action:** Update PRD Section 17.1 with zero-account artifact path and diagnostic intelligence as adoption hook. Add validation gate to Phase 1 roadmap: "3/5 DJs confirm they would use artifact in actual workflow before DJ wedge is treated as primary GTM." — **NOT YET DONE**

---

#### C4: Acoustic hold texture requires audio synthesis not in tech stack
**Status:** OPEN

**Finding:** Requirement AH03 specifies "generated drone at the session's acoustic coordinates" during hold state. Nothing in the tech stack (Spotify SDK, Web Audio API, Essentia.js) generates audio. This is a hard engineering impossibility as specced.

**Fix proposed:** Change AH03 to: use reverb tail of last playing track extended via ConvolverNode (Web Audio API) with decay time parameterized by session energy. High energy = shorter decay; low energy = longer reverb tail. Achievable with Web Audio API in Phase 1. Upgrade path: Tone.js procedural synthesis in Phase 3.

**Remaining action:** Update PRD Section 7.9 AH03. — **NOT YET DONE**

---

### SIGNIFICANT Findings

---

#### S1: Cultural calibration treated as background research challenge — actually a Day 1 product validity problem
**Status:** OPEN — substantially extended in session discussion 2026-05-06

**Finding:** The 5D model is systematically wrong for non-Western music — not just slightly off, but producing incorrect scores. Essentia's beat tracking assumes Western 4/4. Lyrical centrality (central to Hindi filmi, Bossa nova) has no dimension. Cultural register means different things on the same axis for different traditions.

**Scope extension (2026-05-06):** The problem is larger than the PRD acknowledges. Missing dimensions:
- **Lyrical Centrality** (0 = purely instrumental → 1 = lyrics are the primary vehicle)
- **Rhythmic Complexity** (0 = straight 4/4 → 1 = polyrhythmic/highly complex)
- **Temporal Density** (information density per second — independent of Energy)
- **Cultural Gravity** (0 = globally neutral → 1 = strongly tradition-specific)

Plus language as a first-class metadata layer (not a perceptual dimension but a navigation/filtering layer). A user's language distribution (% English, Hindi, Portuguese, French, Japanese) becomes part of their territory signature. Engine learns language-conditioned acoustic preferences separately.

Era as a calibration variable: release decade matters for acoustic signature beyond just nostalgia scoring. Same "high Warmth" score means different things in 1970s soul vs 2020s synthpop.

**Architecture implication:** MERT fine-tuned on culturally diverse global music data handles the acoustic representation. Additional dimensions handle explicit factors. Regional acoustic archetype models handle tradition-specific navigation. All of this requires the schema and embedding space to be extensible from Phase 1.

**Phase mitigation for Phase 1:** Add calibration confidence flag on tracks where Essentia's feature extraction is unreliable (identified by time signature metadata, rhythmic regularity score). Reduce their weight in arc generation until calibrated labels exist. Add as High priority Open Decision: "Non-Western calibration data source — named partner or dataset required."

**Remaining action:** Add 4 new candidate dimensions to FEATURES.md. Add language distribution to territory model spec. Add cultural calibration confidence flag to PRD Section 5.1c. Add to Open Decisions Section 20. — **PARTIALLY DONE (features added to FEATURES.md in Section 23)**

---

#### S2: Bayesian probe cold start requires probe corpus that doesn't exist and isn't specced
**Status:** OPEN

**Finding:** Section 23.2 specifies 6-8 probe tracks but gives no spec for who selects them, how they're selected, or how the GP prior is initialized.

**Fix:** Spec the probe corpus explicitly: 8 tracks covering orthogonal quadrants of 5D space (one per extreme combination). Initial selection by founder. Selection criteria: acoustically unambiguous coordinates (not tracks that score ambiguously), globally recognizable, interesting on their own as standalone listens. Update probe corpus periodically as the coordinate model calibrates.

**Remaining action:** Add probe corpus spec to PRD Section 23.2. — **NOT YET DONE**

---

#### S3: Arc steering interaction not in PRD
**Status:** OPEN

**Finding:** The arc-as-steerable-surface (drag endpoint to redirect engine) is a core UX innovation not present anywhere in the PRD's screen specifications. Screen 4 describes a display, not an interaction surface.

**Fix required:** Add to Screen 4 (Session Arc View): "Steering Interaction — the endpoint of the future arc is draggable. User grabs arc endpoint, pulls toward new acoustic target. Arc re-routes dynamically. Engine regenerates remaining session arc from current track position via partial beam search restart. Visual: rerouted path shown as distinct color from original plan. Confirmation: 3-second preview of first 2 tracks on new path before committing."

**Remaining action:** Update PRD Screen 4. — **NOT YET DONE**

---

#### S4: Hard-coded 5D derivation formulas coexist with calibration pipeline that supersedes them
**Status:** OPEN

**Fix:** Label Section 5.1 formulas explicitly as "Phase 1a bootstrap approximations — will produce approximately correct coordinates for Western popular music, systematically incorrect outside this domain. The calibration pipeline in Section 5.1c replaces these formulas as labeled data accumulates. Database schema includes `coordinate_source` field: `bootstrap` vs `calibrated`."

**Remaining action:** Add bootstrap labeling to PRD Section 5.1, add `coordinate_source` to data schema in Section 15.4. — **NOT YET DONE**

---

#### S5: Spotify API terms change not listed as a risk
**Status:** OPEN

**Finding:** Section 15.6 addresses Spotify being unavailable, not Spotify changing terms. Audio Features endpoint has been flagged as under review at Spotify. If it changes before Phase 3 independence, Phases 1 AND 2 break simultaneously.

**Fix:** Add to Section 15.6: "Spotify terms change risk: if Audio Features API access is restricted or deprecated before Phase 3 own-pipeline is live, fallback is: (1) use existing cached coordinates for known tracks, (2) accelerate Essentia-based own analysis pipeline to Phase 2 priority, (3) supplement with MusicBrainz AcousticBrainz dataset for coordinate bootstrapping." Add kill condition: "If Spotify restricts Audio Features in Phase 1 or 2: activate own pipeline immediately as emergency Phase."

**Remaining action:** Update PRD Section 15.6. — **NOT YET DONE**

---

#### S6: No resourcing plan
**Status:** ACKNOWLEDGED — solo founder context confirmed

**Finding:** Phase timelines without team size assumptions. "Phase 1: 3 months" is meaningless without stating who builds it.

**Resolution:** Solo founder confirmed. This doesn't require a team section — it requires honest scope sizing for one person with AI tooling. Phase 1a/1b split above addresses this. No PRD section needed, but Phase 1 exit criteria should not include work that takes more than one person-months.

---

#### S7: Signal storage spec is incomplete
**Status:** OPEN

**Finding:** Section 7.7 says signals "must be captured and stored" but doesn't specify the storage schema, retention policy, or ingestion pipeline.

**Fix:** Add to Section 7.7: schema (signal type, user ID, track ID, session ID, timestamp, acoustic coordinates at signal time, signal context metadata), retention (raw signals: 12 months; anonymized/aggregated: indefinite), ingestion (async queue → signal processor → behavioral DB, separate from main session DB).

**Remaining action:** Update PRD Section 7.7. — **NOT YET DONE**

---

### MINOR Findings

---

#### M1: Duplicate requirement IDs
Section 7.1 uses "Requirement E03" for real-time extraction. Section 7.2 also uses "Requirement E03" for intent parsing. **Not yet resolved.**

#### M2: Duplicate section numbers
Two subsections are both labeled "5.3" — Arc Generation Algorithm and Intent Model. **Not yet resolved.**

#### M3: Tech stack contradicts architecture decision
Section 15.2 lists "Librosa (Python)" as the audio analysis tool. Section 5.1b names Essentia as primary, Librosa as fallback. Section 15.6 also mentions "Librosa-based pipeline" as Phase 3 independence path. **Not yet resolved — update Section 15.2 and 15.6 to say Essentia.**

#### M4: Phase 1 exit criteria are engineering gates, not quality gates
Phase 1 exit: "a user can authenticate with Spotify, type an intent, and receive a session arc that plays coherently." "Plays coherently" is undefined. Needs a quality threshold: e.g., "founder's personal testing shows >45 min median uninterrupted session time across 20+ sessions." **Not yet resolved.**

---

### Additional Findings from Post-Audit Discussion (2026-05-06)

---

#### A1: k-NN should be replaced with HNSW
**Status:** OPEN

k-NN (exact nearest neighbor) doesn't scale beyond ~100k tracks at query time. HNSW (Hierarchical Navigable Small World) via pgvector gives approximate nearest neighbor in microseconds at any scale, with no proprietary dependency. Phase 1: pgvector HNSW in T1 (5D). Phase 2+: pgvector HNSW in Layer 2 (64-256D). This also means coordinates are owned (not derived from Spotify features) at Phase 2, eliminating API dependency for similarity search.

**Remaining action:** Update PRD Section 15.2 (vector database), Section 5.2 (distance function) to specify HNSW as the search algorithm, distinct from the distance metric.

---

#### A2: Dynamic variable weights as a system-level principle
**Status:** OPEN

Multiple places in the PRD specify fixed weights (5D derivation formulas, territory biasing 0.7/0.3, familiar/novel ratios, confidence score weights). These are described as universal constants but should be dynamic: defaulting to context-specific values for cold start and learning from behavioral signals for established users.

Formal principle to add: "No weight in the system is permanently fixed. All parameters have: (1) a cold-start default, (2) a session-type parameterization, (3) a learned value updated by behavioral signals. The calibration confidence score governs how much weight to give learned vs default values. The weight store is a per-user, per-context table of learned parameter values."

In Phase 3, the on-device personal model IS the weight store — RL updates the parameters directly.

**Remaining action:** Add "Dynamic Weight Store" as a Phase 2 architectural component to PRD Section 15 and Section 7.

---

#### A3: Playlist import and cross-app transfer as data ingestion paths
**Status:** PROPOSED

Spotify API, Apple Music MusicKit.js, Last.fm all expose personal library and playlist data. Playlists have acoustic meaning (user-organized groups of tracks) that is valuable training signal beyond just the individual tracks. Cross-app transfer (Spotify → Apple Music) is possible via track matching but is scope creep unless it serves territory building.

**Recommended:** Add playlist import as a named data ingestion path in Section 23 (Cold Start) — a user with curated playlists has already expressed intent through organization. Add to FEATURES.md as a cold start accelerator.

---

#### A4: Global music — full scope of missing factors
**Status:** OPEN — requires architectural extensibility from Phase 1

See S1 above. Additional factors missed in the original design that compound across cultures:
- Lyrical centrality as dimension
- Rhythmic complexity as dimension
- Language distribution as territory metadata
- Era × tradition calibration
- Cultural gravity / tradition-specificity
- Regional acoustic archetype models per tradition

These don't block Phase 1 but must be designed for: embedding space must be extensible (dimension slots reserved), schema must support language metadata, territory model must support language-conditioned acoustic preferences.

---

## Resolution Tracking

| ID | Finding | Status | Action Required |
|----|---------|--------|----------------|
| C1 | Architecture/algorithm contradiction | **RESOLVED 2026-05-06** | Section 5.1b rewritten: "engine runs in T1 (5D) in Phase 1, Layer 2 in Phase 2" |
| C2 | Phase 1 scope impossibility | **RESOLVED 2026-05-06** | Section 18 rewritten: Phase 1a (weeks 1–6) + Phase 1b (weeks 7–16) solo-founder scope |
| C3 | GTM assumption unvalidated | **RESOLVED 2026-05-06** | Section 17.1 rewritten: zero-account artifact, diagnostic intelligence hook, validation gate |
| C4 | Hold texture synthesis gap | **RESOLVED 2026-05-06** | AH03 updated: ConvolverNode reverb extension, Phase 3 Tone.js upgrade path |
| S1 | Cultural calibration Day 1 problem | **RESOLVED 2026-05-06** | Section 5.1c: calibration confidence flag, down-weighting, Phase 1 mitigation. Section 20: 3 new open decisions |
| S2 | Probe corpus unspecced | **RESOLVED 2026-05-06** | Section 23.2: full probe corpus spec (8 tracks, selection criteria, founder-curated V1) |
| S3 | Arc steering not in PRD | **RESOLVED 2026-05-06** | Screen 4 updated: full drag-endpoint steering interaction spec |
| S4 | Formula/calibration conflict | **RESOLVED 2026-05-06** | Section 5.1 bootstrap note added; Section 15.4 Track entity: coordinate_source + calibration_confidence fields |
| S5 | Spotify terms change risk | **RESOLVED 2026-05-06** | Section 15.6: contingency triggers and responses table; kill condition defined |
| S6 | No resourcing plan | Acknowledged (solo) | N/A — Phase 1a/1b split in Section 18 addresses scope |
| S7 | Signal storage incomplete | **RESOLVED 2026-05-06** | Section 7.7: full SignalRecord schema, retention policy, ingestion pipeline |
| M1 | Duplicate requirement ID E03 | **RESOLVED 2026-05-06** | Section 7.2 intent parser requirement renamed IP01 |
| M2 | Duplicate section 5.3 | **RESOLVED 2026-05-06** | Second 5.3 (Intent Model) renamed 5.4 |
| M3 | Librosa/Essentia contradiction | **RESOLVED 2026-05-06** | Section 15.2 and 15.6 updated: Essentia primary, Librosa fallback only |
| M4 | Phase 1 exit criteria weak | **RESOLVED 2026-05-06** | Phase 1a exit criteria: ≥50 sessions, ≥45 min median uninterrupted, <4 skips/hr |
| A1 | k-NN → HNSW | **RESOLVED 2026-05-06** | Section 15.2 + new Section 5.2b: HNSW via pgvector, phase progression, no proprietary DB in Phase 1 |
| A2 | Dynamic variable weights | **RESOLVED 2026-05-06** | New Section 7.8b: Dynamic Weight Store formal principle + schema. Section 15.8: server-side implementation spec |
| A3 | Playlist import as ingestion path | **RESOLVED 2026-05-07** | FEATURES.md Section 25 CS04 added. PRD Section 23.5 added: playlist name parsing → Pull seeds (Phase 1), cross-app ISRC transfer (Phase 2, conditional) |
| A4 | Global music full scope | **PARTIALLY RESOLVED** | S1 covers Phase 1 mitigation (calibration confidence flag, down-weighting). Open Decisions Section 20: 3 new entries (non-Western data source, additional dimensions, language metadata). Full architectural extensibility (extensible embedding slots, language-conditioned acoustic preferences) to be tracked in future FEATURES.md update. |
