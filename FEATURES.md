# Woody — Feature Registry
*Exhaustive list of every feature discussed. Check here before suggesting new features — it may already exist with decisions attached. Add new features here immediately when they emerge.*

*Last updated: 2026-05-06*

---

## Feature Status Key
- `[ ]` Not started
- `[~]` Prototyped / partially built
- `[x]` Designed / decided
- `[→]` Deferred to later phase

---

## 01 — Acoustic Engine (Foundation)

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| E01 | **5D acoustic coordinate extraction** — energy, warmth, density, organicity, sacred | `[~]` | Hardcoded in prototype. Needs real Spotify Audio Features API |
| E02 | **Spotify Audio Features API integration** — map valence, energy, acousticness, instrumentalness, tempo → 5D | `[ ]` | Core Phase 01 build |
| E03 | **Intent → acoustic coordinate parser** — NL text → 5D target | `[~]` | Keyword-based prototype exists. Needs LLM upgrade |
| E04 | **Nearest-neighbour recommendation** — weighted Euclidean distance in 5D space | `[~]` | Basic version in rec-engine prototype |
| E05 | **Personal territory biasing** — territory centroid shifts recommendation space | `[~]` | Basic version in rec-engine prototype |
| E06 | **Collaborative filtering layer** — users with similar territories liked these sessions | `[ ]` | Phase 02+ |
| E07 | **Acoustic coordinate caching** — don't re-analyse tracks already in the database | `[ ]` | Infrastructure |
| E08 | **Session arc generation** — optimal acoustic path between start and end states | `[ ]` | Core Phase 01 build — dynamic programming or beam search |
| E09 | **Real-time acoustic analysis** — Web Audio API, mic/file input | `[~]` | v3 prototype built |
| E10 | **Acoustic coordinate for albums** — aggregate track coordinates into album fingerprint | `[ ]` | Phase 02 |
| E11 | **Acoustic coordinate for artists** — aggregate across discography | `[ ]` | Phase 02 |
| E12 | **Acoustic coordinate for playlists** — aggregate + arc analysis | `[ ]` | Phase 02 |

---

## 02 — Discovery (Personal)

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| D01 | **Intent input** — free-text "what do I want to hear" → acoustic target | `[~]` | Prototype built |
| D02 | **Derived coordinate display** — show the 5D translation of the intent | `[~]` | Prototype built |
| D03 | **Track recommendations** — top 5 nearest tracks to acoustic target | `[~]` | Prototype built |
| D04 | **Session arc recommendation** — full 2-hour journey matching intent | `[ ]` | Phase 01 priority |
| D05 | **Album recommendations** — albums whose aggregate coordinates match intent | `[ ]` | Phase 02 |
| D06 | **Artist recommendations** — artists whose territory overlaps target | `[ ]` | Phase 02 |
| D07 | **"Sound-alike" discovery** — given a track, find acoustically adjacent tracks | `[ ]` | Phase 01 |
| D08 | **Adjacent territory discovery** — what's just outside your known territory | `[ ]` | Phase 02 |
| D09 | **Acoustic search** — describe sound properties directly, not song names | `[x]` | Part of intent parser |
| D10 | **Spotify library import** — ingest liked songs, extract acoustic coordinates, build initial territory | `[ ]` | Phase 01 |
| D11 | **Spotify playback integration** — play directly within Woody via Spotify SDK | `[ ]` | Phase 01 |
| D12 | **Scrobbling equivalent** — auto-tag listening sessions with acoustic coordinates | `[ ]` | Phase 02 — needs browser extension or native app |

---

## 03 — Session Arcs

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| S01 | **Session arc view** — timeline canvas showing acoustic dimensions over time | `[~]` | Design system Section 04 built |
| S02 | **Intent-led session steering** — set start state + end state, system finds path | `[ ]` | Phase 01 |
| S03 | **Acoustic waypoints** — mark 2–4 acoustic moments in the session arc | `[ ]` | Phase 01 |
| S04 | **Real-time nudge controls** — warmer/colder/more intense/ease up during playback | `[ ]` | Phase 02 |
| S05 | **Session duration control** — specify length (20min, 1hr, 2hr), arc adapts | `[ ]` | Phase 01 |
| S06 | **SavePoint** — mark a moment in a session as significant | `[x]` | Core concept — needs implementation |
| S07 | **Session history** — past sessions stored as acoustic arcs | `[ ]` | Phase 02 |
| S08 | **Session replay** — re-run a past acoustic arc | `[ ]` | Phase 02 |
| S09 | **Session as shareable artifact** — visual export of acoustic arc for posting | `[ ]` | Phase 02 |

---

## 04 — Activity Integration

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| A01 | **Strava integration** — import run/ride activity, generate matching acoustic arc | `[x]` | Decided — Phase 02 priority |
| A02 | **Apple Health integration** — import workout data | `[x]` | Phase 02 |
| A03 | **Google Maps / route integration** — import drive route + duration for road trip sessions | `[x]` | Phase 02 |
| A04 | **Activity-arc mapping** — effort curve from activity → acoustic energy/density curve | `[x]` | Core mechanism |
| A05 | **Activity-tagged session artifact** — shareable arc that shows both activity and music arc | `[x]` | Phase 02 |
| A06 | **Activity context presets** — run, drive, study, draw, cook, wind down | `[ ]` | Phase 01 (manual) before API integration |
| A07 | **Strava activity post integration** — embed acoustic arc directly in Strava activity post | `[x]` | Phase 02 — acquisition flywheel |
| A08 | **Other activity platforms** — Garmin Connect, Wahoo, Komoot, Zwift, Peloton | `[→]` | Phase 03+ after Strava proven |

---

## 05 — Territory Map

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| T01 | **2D acoustic map** — energy × warmth scatter plot of all tracks | `[~]` | Built in rec-engine prototype |
| T02 | **Personal territory visualization** — your accumulated acoustic footprint | `[~]` | Basic version in prototype |
| T03 | **Territory heatmap** — density of listening across acoustic space | `[~]` | Built in design system Section 03 |
| T04 | **Territory export** — shareable acoustic fingerprint image | `[ ]` | Phase 02 |
| T05 | **Territory comparison** — overlay two people's territories | `[ ]` | Phase 03 |
| T06 | **Territory evolution over time** — how your acoustic taste has moved | `[ ]` | Phase 03 |
| T07 | **Acoustic field visualization** — parametric generative visual derived from acoustic coordinates | `[~]` | Full design system section + v1/v2/v3 built |
| T08 | **5D territory (not just 2D projection)** — full hyperdimensional territory representation | `[x]` | Technical debt — 2D is a projection, full 5D needed for recs |

---

## 06 — DJ / Mix Tools

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| DJ01 | **DJ set logging** — input tracklist, generate acoustic arc automatically | `[ ]` | Phase 02 priority — the wedge |
| DJ02 | **Acoustic arc visualization for sets** — beautiful visual of energy/warmth/density over set duration | `[~]` | Session timeline design built |
| DJ03 | **Tracklist parser** — paste a Mixcloud/Boiler Room tracklist, auto-fetch acoustic coordinates | `[ ]` | Phase 02 |
| DJ04 | **Set comparison** — compare two sets acoustically | `[ ]` | Phase 02 |
| DJ05 | **Discover-from-set** — given a DJ's set, find acoustically adjacent tracks they haven't played | `[ ]` | Phase 02 |
| DJ06 | **Shareable set arc** — postable to Instagram, Mixcloud, Soundcloud | `[ ]` | Phase 02 — acquisition mechanism |
| DJ07 | **DJ territory map** — aggregate of all sets shows DJ's acoustic signature | `[ ]` | Phase 03 |
| DJ08 | **Live set mode** — real-time acoustic tagging during a live performance | `[ ]` | Phase 03 |

---

## 07 — Social / Sharing

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| SO01 | **Acoustic arc share** — share a session as a visual arc artifact | `[ ]` | Phase 02 — primary social unit |
| SO02 | **Journey sharing** — "here's how I got from A to B" — the route, not the opinion | `[x]` | Decided mechanism — Phase 03 |
| SO03 | **Public territory** — make your acoustic territory viewable | `[ ]` | Phase 03 |
| SO04 | **Discovery path network** — graph of how tracks connect via listening journeys | `[ ]` | Phase 03 |
| SO05 | **Mutual territory discovery** — "you and this person share acoustic territory but arrived differently" | `[x]` | Phase 03 — humanizing through relatability |
| SO06 | **Acoustic arc embed** — embeddable live visualization for Substack, websites | `[ ]` | Phase 04 |
| SO07 | **Year in review** — acoustic year-in-review (Spotify Wrapped alternative, genuinely personal) | `[ ]` | Phase 03 |
| SO08 | **Curator profiles** — curators share what they're actually listening to, not their own music | `[x]` | Phase 03 — artists as listeners, not promoters |
| SO09 | **Artist profiles** — artists share listening (same as curator profiles — no special treatment) | `[x]` | Phase 03 |

---

## 08 — Community

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| C01 | **Topic-organized community** — organized around acoustic territories, not user profiles | `[x]` | Architectural decision — Reddit model |
| C02 | **Acoustic resonance** — low-friction "this arc moved me" response (not like/dislike) | `[x]` | Phase 03 — replaces upvote/downvote |
| C03 | **Discovery attribution** — "X introduced me to this acoustic space" | `[ ]` | Phase 03 |
| C04 | **Friends / acoustic compatibility** — connect with people whose territory overlaps | `[ ]` | Phase 03 |
| C05 | **Community norms set by DJ seed community** — culture defined before gamification | `[x]` | Strategic decision |
| C06 | **No influence model** — following someone ≠ them promoting their own music | `[x]` | Architectural decision |

---

## 09 — Story / Context Layer

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| CT01 | **Acoustic explanation** — why does this song sound the way it feels, acoustically | `[x]` | Woody's unique version of "story" |
| CT02 | **Track acoustic breakdown** — the specific acoustic events that create the emotional effect | `[ ]` | Phase 03 |
| CT03 | **Album acoustic narrative** — how the album moves through acoustic space across tracks | `[ ]` | Phase 03 |
| CT04 | **Deep dive mode** — intentional listener path: artist, album, song history, lyrics | `[ ]` | Phase 03 — optional, not default |
| CT05 | **Context links** — surface Genius, Wikipedia, AllMusic for biographical context | `[ ]` | Phase 02 — don't rebuild, link out |
| CT06 | **Segmented by listener type** — immersive listeners get no context overlay by default | `[x]` | Architectural decision |

---

## 10 — UI / Information Architecture (To Be Designed)

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| UI01 | **Home / entry point** — what is the first thing a new user sees? | `[ ]` | To be decided |
| UI02 | **Intent input** — always accessible, primary action | `[x]` | Core UX |
| UI03 | **Now Playing view** — current session arc, live position, nudge controls | `[ ]` | To be designed |
| UI04 | **Territory view** — your acoustic map | `[ ]` | To be designed |
| UI05 | **Explore view** — discovery, adjacent territory | `[ ]` | To be designed |
| UI06 | **Session history view** — past arcs, saved sessions | `[ ]` | To be designed |
| UI07 | **Social feed** — arcs from people you follow or territory-adjacent | `[ ]` | Phase 03 |
| UI08 | **DJ mode** — set logging and visualization | `[ ]` | Phase 02 |
| UI09 | **Activity mode** — import activity, generate session | `[ ]` | Phase 02 |
| UI10 | **Profile / territory page** — your public-facing acoustic identity | `[ ]` | Phase 03 |
| UI11 | **Onboarding** — Spotify import → initial territory → first session | `[ ]` | Phase 01 |

---

## 11 — Pro / Revenue

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| P01 | **Pro tier** — advanced analytics, higher arc resolution, longer session history | `[x]` | Phase 04 |
| P02 | **Curator analytics** — see who's engaging with your arcs, territory overlap with audience | `[ ]` | Phase 04 |
| P03 | **Embeddable acoustic arc widget** — for Substack, artist websites | `[ ]` | Phase 04 |
| P04 | **API access** — acoustic coordinates for tracks, session arc generation | `[ ]` | Phase 04 |
| P05 | **DJ analytics** — compare sets over time, see what worked acoustically | `[ ]` | Phase 04 |

---

## 12 — Technical Infrastructure

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| IN01 | **Spotify OAuth** — user authentication | `[ ]` | Phase 01 prerequisite |
| IN02 | **Spotify Audio Features batch fetch** — get coordinates for user's library | `[ ]` | Phase 01 |
| IN03 | **Acoustic coordinate database** — store and index tracks by 5D coordinates | `[ ]` | Phase 01 |
| IN04 | **Vector search** — k-nearest-neighbor in 5D space, efficiently | `[ ]` | Phase 01 |
| IN05 | **Session arc algorithm** — dynamic programming or beam search for optimal path | `[ ]` | Phase 01 |
| IN06 | **Browser extension** (scrobbling equivalent) — auto-tag what's playing | `[ ]` | Phase 02 |
| IN07 | **Mobile app** | `[→]` | Phase 03+ — web first |

---

## Features Explicitly Discussed and Decided Against (for now)

| Feature | Reason |
|---------|--------|
| Streaming / licensing | Not a streaming service — Spotify layer only |
| Star ratings / reviews | Too performative — arc sharing is the mechanism |
| Influence model (following = promotion) | Explicitly rejected — artists share as listeners |
| Artist-direct sales (Bandcamp model) | Wrong model for Woody |
| Gamified reputation scores | Risk of performative optimization over authentic sharing — deferred until culture is set |
| Native app (Phase 01) | Web first — don't split focus |

---

## 13 — Visual Intent Layer (Image / Situational)

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| V01 | **Image-based intent input** — instead of text, user picks from curated images/GIFs representing acoustic moods. Image IS the intent. Maps image to acoustic coordinates via colour psychology + scene analysis. | `[ ]` | Alternative intent entry point — removes language friction |
| V02 | **Situational intent** — describe a situation ("sunset beach with friends", "goku vs broly gym session") → Woody maps situation to acoustic coordinates. | `[ ]` | Extends NL intent parser with situational/narrative framing |
| V03 | **Image analysis → acoustic mapping** — scene understanding (beach = warm + outdoor = warmth high, energy medium), colour temperature (golden hour = warmth 0.7–0.9), activity inference (running = energy high). | `[ ]` | Core mechanism for V01/V02 |
| V04 | **GIF/animated visual vocabulary** — each acoustic mood profile has an associated animated visual (not generic, Woody's own art style). | `[ ]` | Requires dedicated visual language design session |
| V05 | **Generated art style animations for widgets and shareable artifacts** — pixelated or custom animated style, Woody's visual signature. | `[ ]` | Part of visual language design session |
| V06 | **Photo capture → shareable artifact** — take a photo of your situation, Woody generates a shareable arc artifact using the photo + acoustic visualization. Instagram story format. | `[ ]` | Phase 02–03 — acquisition mechanism |
| V07 | **Visual language tied to acoustic profiles** — colour psychology informing the visual output of each acoustic state. Not generic album art. | `[ ]` | Architectural design decision — needs dedicated session |

---

## 14 — Session Shape Classification

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| SH01 | **Arc shape taxonomy** — classify sessions by shape pattern: Single apex (builds to climax, descends), Multiple peaks (intervals of intensity), Plateau (sustained state), Journey (gradually evolves), Inverse (starts high, descends), Wave (oscillates). | `[x]` | Taxonomy decided — implementation needed |
| SH02 | **ML shape classification** — learn desired shapes from listening patterns across users and sessions. Reinforcement learning to connect intent → acoustic shape pattern. | `[ ]` | Phase 03+ — requires data accumulation |
| SH03 | **Shape selection as part of intent** — user can optionally indicate desired arc shape, or system infers from context (run = single apex or intervals, study = plateau, wind down = inverse). | `[ ]` | Phase 01–02 — manual presets first, ML later |
| SH04 | **Pre-hype → activity transition arc** — specific shape for activity sessions: pre-hype short arc (5–10 min) → transition moment → main activity arc → optional cool-down. | `[ ]` | Phase 02 — integrates with activity layer |
| SH05 | **Shape learning per user** — over time, learn that this user always wants a plateau for work but a single apex for runs. | `[ ]` | Phase 03+ — requires session history data |

---

## 15 — Container Rethink (In Progress)

Containers currently proposed: Session (live), Arc (saved session), Mixtape (curated arc), Pocket (saved moment), Territory (total map). However user has flagged this feels one-size-fits-all. Different listening relationships need different container shapes. Open design question: how do we give users enough control/shape-ownership without overwhelming them with options? Consider naming: Drift (surrender mode), Arc (collaborative/crafted), Set (DJ/creator), Pocket (saved moment). This needs a dedicated design session.

---

## 16 — Internal × External State Engine

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| IE01 | **Internal state input** — how I feel right now (tired, anxious, euphoric, grieving, focused, scattered) | `[ ]` | Extends intent model |
| IE02 | **External state input** — where I am / what I'm doing (running, driving, at a beach, studying, at a party, cooking) | `[ ]` | Extends intent model — overlaps with activity presets (A06) |
| IE03 | **Desired state** — where I want to go (energized, calm, focused, euphoric, nostalgic) | `[ ]` | Third axis of full intent model |
| IE04 | **The full intent model: Internal State × External Context × Desired State = acoustic target** — this replaces the simple text → coordinates model. | `[x]` | Core model decision — supersedes E03 NL-only approach |
| IE05 | **Neuro-regulatory framing** — music as intentional psychological state regulation. Woody's delivery technique matters as much as the rec itself. "Salesman psychology" — given enough adherence to mental psychology, any track can feel god-given depending on delivery and framing. | `[x]` | Brand/product positioning decision |
| IE06 | **Songs as moment containers** — a song carries a moment, a mental image, a specific feeling, a specific need. Woody maps these associations systematically. | `[ ]` | Phase 03 — requires social/annotation layer |

---

## 17 — Transition Coherence Engine

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| TC01 | **Transition coherence scoring** — for each candidate track, compute acoustic distance from *currently playing track* (not just from target). High distance = skip risk. | `[ ]` | Core engine addition — Phase 01/02 |
| TC02 | **Skip signal as transition quality data** — skips are not track ratings, they are transition failure signals. Train the engine on skip timing (8 seconds vs 2 minutes carry different meaning). | `[ ]` | Phase 02 — requires data accumulation |
| TC03 | **Replay signal capture** — replay events indicate acoustic resonance; the engine should extend time in this acoustic neighbourhood. | `[ ]` | Phase 02 |
| TC04 | **Volume adjustment as engagement signal** — volume up = engagement and desire to deepen; volume down = background mode or distraction. Infer from OS audio events. | `[ ]` | Phase 02 |
| TC05 | **Two-dimensional arc optimization** — session arc generation optimizes simultaneously for (1) progress toward acoustic target and (2) transition coherence per step. Step size managed per transition boundary. | `[ ]` | Phase 01/02 — extends E08 |
| TC06 | **First-15-second skip detection** — skip within first 15 seconds is a transition quality failure, not a track quality judgment. Model separately. | `[ ]` | Phase 02 |
| TC07 | **Dopamine baseline arc shape** — session deliberately starts below user's target acoustic state (–0.2 to –0.3 across energy/density). Gradual rise amplifies perceived reward at target arrival through reward prediction error. | `[ ]` | Phase 02 — see PSYCHOLOGY.md Section 11 |

---

## 18 — Acoustic Hold State (Soft Pause)

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| AH01 | **Soft pause / acoustic hold** — third playback state between play and full stop. Triggered instead of hard pause. | `[ ]` | Phase 01/02 — UX priority |
| AH02 | **Graceful ending on pause** — 1–2 second acoustic resolution (reverb sustain, micro-fade, resolving texture) triggered when pause is initiated. Last thing heard is a satisfying exit, not a cut. Applies peak-end rule to pause moments. | `[ ]` | Phase 01/02 |
| AH03 | **Hold texture** — during soft pause, low-level ambient acoustic texture sustains the session's mood field. Not silence. Not progression. A held space. | `[ ]` | Phase 02 |
| AH04 | **Re-entry protocol** — on session resume after long hold (>60 seconds): 15–20 second acoustic re-establishment rebuilds session momentum before main content resumes. Short holds resume seamlessly. | `[ ]` | Phase 02 |
| AH05 | **"Flow may have reset" prompt** — after hold exceeds several minutes, on resume: "It's been a while. Continue this session or start fresh?" Non-judgmental, user keeps agency. | `[ ]` | Phase 02 |

---

## 19 — Lock-In Sessions

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| LI01 | **Lock-in session mode** — on-demand focus induction. User declares intent to lock in. System captures task type, current state, desired end state, duration. | `[ ]` | Phase 02 |
| LI02 | **Task-aligned acoustic targeting** — task description (writing, designing, coding, studying, physical work) feeds acoustic coordinate selection beyond mood. Different tasks have measurably different optimal acoustic profiles. | `[ ]` | Phase 02 — extends IE04 |
| LI03 | **Behavioral song embeddings** — beyond 5D acoustic coordinates, tracks have behavioral embeddings describing what they *do* psychologically ("builds focus without urgency", "grounds without sedating"). NLP task description matched to behavioral embeddings. | `[ ]` | Phase 03 — requires embedding training data |
| LI04 | **Baseline Rise arc for lock-in** — session starts 0.2–0.3 below acoustic target across energy/density. Rises gradually to optimal plateau. User arrives at focus state without noticing transition. Applies dopamine baseline manipulation principle. | `[ ]` | Phase 02 |
| LI05 | **No-decision session execution** — once lock-in starts, music takes responsibility for state management. No skip prompts, no track decisions required. The session has a job. | `[ ]` | Phase 02 |
| LI06 | **Post-session correlation** — after session ends, correlate acoustic characteristics with task completion signals (session length, uninterrupted run time, skip rate). Refine future lock-in recommendations. | `[ ]` | Phase 03 |

---

## 20 — Contextual Signal Capture

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| CS01 | **Time-of-day acoustic priming** — time + day of week as strong proxy for probable state. Adjust acoustic defaults silently. | `[ ]` | Phase 02 |
| CS02 | **Headphone connection detection** — headphones = committed listening mode. Adjust acoustic default toward intentional session. | `[ ]` | Phase 02 |
| CS03 | **Screen state inference** — screen off + music playing = passive/background mode vs screen on = interactive session. | `[ ]` | Phase 02 |
| CS04 | **Calendar context integration** — meeting ending = likely transition state. Meeting starting = focus need incoming. | `[ ]` | Phase 03 |
| CS05 | **Recent activity integration** — post-run, post-workout state inferred from Health/Strava data. | `[ ]` | Phase 02 — extends A02 |
| CS06 | **Wearable heart rate integration** — Apple Watch / Fitbit real-time heart rate as actual physiological arousal signal. Optional enhancement, not dependency. | `[ ]` | Phase 03 |
| CS07 | **Session history as context** — what was the last session's acoustic character? How long ago? Build continuity or contrast based on gap. | `[ ]` | Phase 02 |
| CS08 | **Multi-source audio sync** — connect YouTube, SoundCloud, and Spotify into unified acoustic session. Web Audio API for real-time coordinate extraction from any source. | `[ ]` | Phase 02 — revenue-gated Pro feature |

---

## 21 — Recommendation Quality Signal (Woody Certified)

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| QS01 | **Confidence scoring** — every recommendation has an internal confidence score: acoustic distance to target × territory relevance × contextual fit. 0–1 composite. | `[ ]` | Phase 01 — engine-internal |
| QS02 | **Visual confidence tier** — user-facing representation of confidence without numbers. Three tiers represented as a mark (e.g. tuning fork resonance levels). Not a badge with stars. | `[ ]` | Phase 02 |
| QS03 | **"Woody endorsed" hero mark** — top-confidence, highest-resonance recommendations receive a specific visual mark. Brand quality signal. Same DNA as logo. | `[ ]` | Phase 02 — brand + product decision |
| QS04 | **Mark as brand signal** — over time, the Woody mark on an artifact or recommendation communicates quality to non-users who encounter shared content. Acquisition mechanism. | `[ ]` | Phase 03 — brand strategy |

---

## 22 — Multi-Source Integration

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| MS01 | **Spotify integration** — OAuth, Audio Features API, library import, SDK playback | `[~]` | Core Phase 01 (partially scoped in other sections) |
| MS02 | **YouTube Music / YouTube integration** — Web Audio API real-time analysis for acoustic coordinates. No public audio features API exists — real-time is the answer. | `[ ]` | Phase 02 |
| MS03 | **SoundCloud integration** — Web Audio API real-time analysis. DJ/underground content not on Spotify. | `[ ]` | Phase 02 |
| MS04 | **Unified queue across sources** — single session arc that draws from Spotify, YouTube, SoundCloud simultaneously. | `[ ]` | Phase 02/03 — complex |
| MS05 | **Own acoustic analysis pipeline** — build proprietary audio feature extraction independent of Spotify API. Long-term independence from API dependency. | `[ ]` | Phase 03/04 — moat deepening |
| MS06 | **Open-source acoustic analysis layer** — open source the coordinate extraction to build community, trust, and dataset at scale. | `[→]` | Flagged for future consideration — not now |
| MS07 | **YouTube Screen Capture API integration** — `getDisplayMedia({audio:true})` feeds Essentia.js WASM pipeline in-browser. Dual-buffer: 2s overlapping windows at 50% overlap → 1s feature update cadence. Lerped visualization at 30fps. Permission requested on session start as feature reveal, not security dialog. COOP/COEP headers required. | `[ ]` | Phase 02 — see PRD Section 5.1 |

---

## 23 — Acoustic Embedding Architecture

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| AE01 | **Essentia feature extraction pipeline** — Layer 1 (~100D). Server-side at track ingestion. Essentia (Python/MIT) primary, Librosa fallback. Produces spectral, rhythmic, tonal, dynamic descriptors. | `[ ]` | Phase 01 infrastructure |
| AE02 | **MERT-based acoustic embeddings** — Layer 2 (64-256D). Fine-tune MERT (music transformer, 160k hrs training, RVQ masked audio modeling) on dimension calibration task. Runs server-side at ingestion only. Stored per track. | `[ ]` | Phase 02 |
| AE03 | **Pairwise anchor corpus calibration** — 200 tracks, 20+ raters, pairwise comparisons, Bradley-Terry scoring. Ground-truth perceptual coordinates for dimension model training. | `[ ]` | Phase 01 — needed before launch |
| AE04 | **DistilBERT dimension calibration model** — maps Essentia features → 5D coordinates. Fine-tuned on anchor corpus (~3000 pairwise-labeled examples). Contrastive learning objective. | `[ ]` | Phase 01 |
| AE05 | **Cultural calibration correction** — metadata-conditioned correction factor for non-Western music (non-4/4 time signatures, microtonal, polyrhythmic). Essentia's default models assume Western music structures. | `[ ]` | Phase 02 — ongoing research challenge |
| AE06 | **Online Bayesian calibration** — per-user posterior update over dimension sensitivity based on behavioral signals. Tracks which dimensions this user is most responsive to. | `[ ]` | Phase 02 |

---

## 24 — Personal On-Device Model

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| PM01 | **On-device personal model** — Phi-3-mini-4k or Gemma-2B, INT4 quantized (~750MB-1.5GB). Maintains learned acoustic preference state vector via offline RL. Runs at transition time only (~200ms forward pass on iPhone 15 Pro). | `[ ]` | Phase 03 |
| PM02 | **Context-conditioned inference** — personal model conditions on device-local context: time, accelerometer/motion, ambient noise level, battery, active app context. None of this leaves device. | `[ ]` | Phase 03 |
| PM03 | **Granular RL reward function** — skip timing, replay, add to library, manual next <20s, volume increase. Not just session completion (too sparse and delayed). | `[ ]` | Phase 03 |
| PM04 | **Population prior initialization** — personal model boots from population prior distributed with app binary. Fine-tuning begins on first behavioral signal. No cold start for the personal model. | `[ ]` | Phase 03 |
| PM05 | **Model weight encryption** — NSFileProtectionComplete (iOS) / EncryptedFile Jetpack Security (Android). Weights encrypted at rest, never in crash reports, never synced to server without explicit opt-in. | `[ ]` | Phase 03 — security requirement |

---

## 25 — Cold Start & Onboarding

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| CS01 | **Bayesian acoustic probe cold start** — 6-8 tracks spanning 5D space, selected for maximum information gain. Behavioral response updates Gaussian process prior over taste space. Converges to territory estimate in ~90 seconds. | `[ ]` | Phase 01 — primary cold start strategy |
| CS02 | **Psychologically rich conversation fallback** — for no-Spotify users: 2-3 questions about relationship to sound (not artists, not genres). "When do you most need music?", "What's a song that sounds like how you feel right now?", "What's the last song you turned off because it was wrong for the moment?" | `[ ]` | Phase 01 fallback |
| CS03 | **Spotify history supplement** — top_tracks, recently_played, playlists as supplement to probe data. Not primary signal — Spotify history encodes Spotify's CF bias. | `[ ]` | Phase 01 |
| CS04 | **Playlist import as cold start accelerator (A3)** — parse user's existing Spotify playlists at onboarding. Playlist *names* ("deep work", "pre-run", "late night") run through intent BERT to seed Pull suggestions. Playlist *track composition* seeds acoustic territory before any probe sessions. Apple Music MusicKit.js + Last.fm API also available as sources. Cross-app track matching via ISRC for transfer (Phase 2). Decision: playlist names → Pull seeds is Phase 01; cross-app transfer is scope creep unless a meaningful cross-platform cohort exists. | `[ ]` | Phase 01 — playlist name parsing; Phase 02 — cross-app transfer (if justified) |

---

## 26 — Athlete / Performance Use Case

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| AP01 | **Performance arc presets** — pregame hype (0.3→0.9 Energy over 45min), warm-up, cooldown arcs with validated acoustic profiles for athletic performance contexts. | `[→]` | Phase 02/03 GTM — deferred. See SHELVED.md |
| AP02 | **Shareable performance methodology** — athlete's pregame arc as a methodology artifact others can adopt and remix. Not just a playlist — a prescription. | `[→]` | Phase 02/03 — requires creator artifact system first |
| AP03 | **Activity integration for athletes** — deeper Strava/Health integration: heart rate zones mapped to acoustic targets, recovery detection, training load as session steering signal. | `[→]` | Phase 02/03 |
