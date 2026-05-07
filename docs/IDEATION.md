# Woody — Full Ideation & Architecture Exploration

> Written April 2026. This is a raw capture of the brainstorming sessions behind Woody's intelligence layer — every concept, correction, pivot, and philosophical tangent. Nothing translated, nothing sanitized.

---

## Context: Where This Came From

Woody started as a music discovery interface with a 3D globe, Spotify playback, and natural language intent parsing (type a vibe, get tracks placed on a map). The implementation work in the sessions before this document covered:

- IntentMemory: localStorage-persisted rejection learning keyed by PersonaLens fingerprint
- Landing animations on map nodes (birthTime tracking → opacity/position fade-in)
- MiniPlayer rejection UI ("not this" button)
- excludeTrackIds plumbed through the full API stack
- Proactive 30-min token refresh on woodyPlayer
- Track pool increased from 4 → 8, search limits expanded

After all of this was implemented, the question surfaced: **when do we start building the actual machine learning stuff?** That question opened everything below.

---

## The Question That Opened Everything

*"bro but when do we start building the machine learning stuff man? what nlp stuff do we have no embeddings model etc etc, thats where the real magic lies no? instead we have been circling around ui and minor things here and there"*

This was the pivot point. The UI work had been real but we were papering over a fundamental gap: **Woody has no actual model of a user's taste**. It has:

- A natural language parser (LLM prompt → PersonaLens JSON)
- A rejection memory (IntentMemory, what we just built)
- Spotify search + recommendations (which, critically, are deprecated — more on that)

What it doesn't have:
- Any acoustic understanding of why a track fits a vibe
- Any model that accumulates and becomes more precise over time
- Any notion of what a user actually means when they say a word like "atmospheric"

---

## The Spotify Deprecation Problem

**This is urgent and often overlooked:** Spotify deprecated Audio Features, Audio Analysis, AND Recommendations on **November 27, 2024**. The `getRecommendations()` function in `lib/spotify.ts` is currently calling a dead endpoint. It may silently return empty or cached results, but it is broken infrastructure.

This means:
- The core track discovery mechanism is compromised right now
- We need a replacement before building anything on top of it
- **Last.fm** is the most viable replacement: `track.getSimilar`, `artist.getSimilar`, `artist.getTopTracks` — still active, not deprecated, free tier available

The replacement plan:
1. Wire Last.fm `track.getSimilar` as the primary recommendation engine
2. Fall back to Spotify search (not recommendations) for breadth
3. Keep the existing pool/dedup logic in `intentToSuggestions()`

---

## The ML Architecture Question

### What We Have Now

The current intent system is: **LLM as sole interpreter**. User says "late night drive," LLM produces PersonaLens JSON, system searches Spotify for those query strings. There's no acoustic understanding. The system doesn't learn what "late night drive" means to *this user* specifically. Every session starts fresh except for the rejection memory.

### What We Were Thinking About

The original plan mentioned MERT and Essentia. Let's be precise about what those are:

**MERT** (m-a-p/MERT-v1-330M on HuggingFace):
- A music understanding transformer model, like BERT but trained on audio
- Requires raw audio files as input
- Produces 768-dimensional acoustic embeddings
- Can represent "how a track sounds" in vector space
- To use it: need audio files (not Spotify streams), GPU compute, inference pipeline

**Essentia** (MTG Barcelona):
- C++/Python audio analysis library
- Ships pre-trained TensorFlow models: MusiCNN, VGGish, MAEST embeddings
- Actively maintained through 2025
- More practical for production than MERT — CPU-capable, smaller models
- Produces embeddings from audio features rather than raw waveforms

**The problem with both**: To build embeddings for a user's taste territory, you need:
1. Audio files (not available from Spotify streaming)
2. A corpus of tracks to embed (not just the 8 we surface per session)
3. Compute infrastructure to run inference
4. A growing dataset of user interactions to train on

### The Colab Bridge

Google Colab as free GPU compute, exposed via ngrok tunnel:
- MERT inference: send track metadata → return 768d embeddings
- Viable for validation / proving the concept
- Not production infrastructure
- The pattern: Colab runs the model, ngrok exposes an HTTP endpoint, Next.js calls it

This is a prototype path, not a ship path. But it's enough to prove whether acoustic embeddings actually improve recommendations before investing in proper hosting.

---

## The LLM as Recommender Problem

This was the yes-manning correction. Initial response simply mirrored the user's framing without actually thinking critically. The corrected analysis:

**The fundamental issue**: Using an LLM to *generate* recommendations (give me tracks for this vibe) is not the same as building a *deterministic taste model*. An LLM:
- Generates plausible-sounding responses based on training data
- Doesn't actually know what the user has heard before
- Doesn't accumulate learning across sessions
- Applies population-level knowledge, not personal knowledge
- Can't distinguish between two users who use the same words to mean completely different things

**What a real model does differently**:
- Accumulates behavioral data (plays, skips, saves, rejections, session context)
- Builds a representation of taste in acoustic feature space (not word space)
- Gets more precise over time rather than generating fresh each time
- Can be queried: "find tracks near this cluster but not these specific ones"

**The correct role for LLM**:
- Not: recommend tracks
- Yes: parse vibe language into initial search parameters
- Yes: ask ONE clarifying question when ambiguity maps to divergent acoustic regions
- Yes: explain why a track was surfaced (human-readable reasoning from embeddings)
- Yes: handle the cold start conversationally

The LLM is a disambiguator and translator, not a recommender.

---

## The Personal Semantics Problem

This is arguably the deepest insight from the entire brainstorm.

**The word "atmospheric" was the concrete example that broke it open.**

Initial assumption: "atmospheric" = dark, spacious, probably similar acoustic territory to "dark." Wrong.

The correction: "atmospheric" for this user means *expansive, space-gazing, open to any genre or mood*. It's not an acoustic constraint at all — it's a **stance** toward discovery. It describes openness, not sound.

This is the personal semantics problem: **vibe language words map to completely different meanings per person**.

- For person A: "atmospheric" = shoegaze, reverb-heavy, dense walls of sound
- For person B: "atmospheric" = jazz, late-night, sparse
- For person C (our case): "atmospheric" = expansive curiosity, genre-agnostic

A population-level LLM can't know this. It applies the most common interpretation. But the most common interpretation might be completely wrong for this user.

### The Bayesian Framing

For each user, for each vibe word, maintain a **probability distribution over possible acoustic mappings**. At first, the distribution is wide (high uncertainty). As the user interacts — plays tracks, skips, saves, adjusts — the distribution narrows. Over time, the system learns that when *this user* says "atmospheric," they mean high variance in genre, not dark reverb textures.

The formalism:
- Prior: population-level distribution over acoustic features for word W
- Likelihood: behavioral signal (did the user keep/skip/save after we served interpretation X?)
- Posterior: updated belief about what W means to this user
- Each session updates the posterior

**SDE extension**: Taste isn't static. The posterior itself drifts over time. A Stochastic Differential Equation model lets the distribution evolve — beliefs formed 2 years ago decay, recent sessions get higher weight. This captures life phase changes without requiring explicit "I want something different now" declarations.

---

## The Vibe Language Taxonomy Problem

There was a push to categorize vibe language into two types: "stances" (atmospheric, expansive) vs "constraints" (no sad piano, no lyrics). That binary was wrong.

The push-back: **there are more than two types of vibe language**. Examples:
- Energy descriptor: "high energy"
- Acoustic texture: "glossy production"
- Emotional tone: "melancholic"
- Temporal/contextual: "late night"
- Relational: "sounds like Burial"
- Exclusion: "no sad piano"
- Stance/openness: "atmospheric"
- Functional: "for running"
- Generational: "90s UK"

Each type has different implications for acoustic search. Lumping them into two categories loses information. The system should be able to handle all of them, and learn *per user* what each means.

The real issue isn't taxonomy — it's the **disconnect between what the user believes a word represents and what the system assumes**. Taxonomy helps but doesn't solve it.

---

## The Cold Start Problem

*"the cold start is very much the dilemma im facing right now"*

The challenge: a new user has no behavioral history. There's nothing to update a Bayesian model against. The system knows nothing about this specific person. But the user expects magic from session one.

**The "house of cards" intuition**: Build a provisional model very early, without committing to it. The idea is to gather lightweight early signal — enough to make informed guesses — while remaining completely willing to collapse and rebuild as real data comes in.

Concrete approaches:

**1. Explicit intake question**
- On first session: "What are you about to get into?" (activity context)
- One simple question: "What's a track you've loved recently?"
- Use this as anchor for initial acoustic territory — embed it, find neighbors

**2. Lightweight emotional context**
- Not a full survey. One question, max.
- Activity state signals a lot: "about to go on a run" tells you tempo range, energy, low lyrical bandwidth
- "can't sleep" tells you something very different

**3. Behavioral signal starts immediately**
- The first skip is data. First save is data. First replay is data.
- Build the model from session one, even with 3 data points
- The house of cards is: provisional clusters formed from early sessions, ready to collapse and reform

**4. Genre priors as cold start baseline**
- If user mentions any genre/artist, use Essentia/MusicBrainz to get acoustic profile of that territory as prior
- Better than nothing

**The "atmospheric/dark" correction in context of cold start**: This is exactly why the cold start can't just use LLM word interpretation. "atmospheric" in early sessions needs to be treated as high-uncertainty, wide-distribution. The system should surface diverse tracks and watch which ones stick — that's how it learns what this user means.

---

## Context-Aware Modes

*"if im showering or about to... if im about to go on a run... these are different use cases"*

This was a key insight that Woody has at least two distinct interaction modes based on user context. They're not just UI variants — they have fundamentally different requirements for the intelligence layer.

**High Bandwidth Mode** (at desk, exploring, beach, open time):
- User can engage, respond, give feedback
- Collaboration is welcome and even enjoyable
- The system should be willing to surface unexpected things
- "Build the model together as a shared artifact"
- Discovery is a feature, not a bug
- This is where "what did you learn about my taste?" is a compelling interaction

**Low Bandwidth Mode** (running, showering, driving, commuting):
- User cannot engage
- Any friction is pure cost
- The wrong track at the right moment is just pain
- Silent observation only — no questions, no UI, no interaction
- System must serve without requiring any response
- Reliability > novelty

The feedback friction calibration problem: **the same signal (skip) means different things in different contexts**. Skipping a track while running might mean "tempo is off" or just "random skip" or "I've heard this too much." Skipping while at your desk, choosing carefully, is a much stronger negative signal about the track itself.

**The system must know which mode it's in** to correctly weight behavioral signals. This is a design/technical challenge — how does Woody know the user is running? Options:
- Explicit activity declaration at session start (minimal friction)
- Motion/accelerometer data (iOS/Android only, not web)
- Time of day + play pattern inference
- Explicit mode toggle in UI (least elegant, most reliable)

---

## The Recommendation Philosophy Trilemma

Three distinct philosophies for what a recommendation system is trying to do:

**Mirror** (what Spotify does):
- Surveillance-based: observe what you've listened to, reflect it back
- "You listened to X, here's more X"
- Self-reinforcing loop, calcifies taste
- No actual understanding, just pattern matching on listening history
- The system learns your behavioral fingerprint, not your desires

**Actor** (suggestion mode):
- System has an agenda to broaden you
- "Here's what you should listen to"
- Paternalistic, curator-knows-best stance
- Can feel patronizing, disconnected from current desire
- The system decides on your behalf

**Understanding** (authentic desire):
- System tries to understand what you actually want *right now*
- Not what you've listened to, not what experts think you should hear
- Serves the present intent, not a profile
- Closest to what Woody is trying to be

The insight: most recommendation systems are **Mirrors**. They track behavior and reflect it, which feels like personalization but is actually surveillance. The experience of being understood is completely different from the experience of being tracked.

**Woody's target**: Understanding mode. The question is whether collaborative modeling (building the taste model together) is part of that, or whether it's a fourth mode (building the model as a shared artifact you can inspect and edit).

---

## Serve vs. Reveal vs. Collaborate

Three different product faces:

**Serve** (invisible magic delivery):
- System works without showing its work
- User doesn't know why they got what they got
- Pure experience, no cognitive load
- Best for Low Bandwidth Mode
- Risk: if it's wrong, there's no correction mechanism

**Reveal** (show what the system learned):
- "Here's what I think I know about you"
- "When you say atmospheric, I understand this to mean..."
- Builds trust through transparency
- User can correct the model explicitly
- Risk: too much meta-information breaks the experience

**Collaborate** (build the model together):
- Taste model as shared artifact
- User actively participates in refining it
- System makes explicit what it's uncertain about
- "Help me understand — when you said atmospheric, were you thinking expansion or texture?"
- Risk: requires high user engagement, can't be the primary mode

**The non-answer answer**: These aren't mutually exclusive. Woody probably has all three, deployed based on context:
- Low Bandwidth → pure Serve
- High Bandwidth, discovery session → Collaborate
- Inspecting past sessions → Reveal

The question *"why can't they go hand in hand?"* was the right question. They can. The design problem is knowing when to invoke which face.

---

## Longitudinal Persona Modeling

*"not sure to be honest. im a bit stumped. also what about trends like user is in this phase of life..."*

This was an under-theorized but important concept. Taste isn't a static profile — it's a trajectory. A user's relationship to music changes over months and years.

**Observable behavioral drift signals**:
- Energy drift: sessions trending toward higher/lower energy over weeks
- Genre diversity: broadening or narrowing territory over time
- Skip rate changes: increasing skips in previously-loved territory (life phase shift?)
- New saves in previously-unseen territory (exploring outward)
- Listening time patterns: changing from evening to morning sessions (life context change)
- Replay patterns: replaying older sessions more (nostalgic phase)

**Life phase detection**:
- Not labeled explicitly — inferred from behavioral drift
- "User is in a high-intensity work phase" → inferred from short sessions, high energy, morning
- "User is going through a transition" → inferred from high genre exploration, longer sessions
- "User is in a low-stimulation period" → inferred from slow tempo, late night, ambient-adjacent

**The longitudinal model doesn't predict** — it updates. It says: "the territory that worked 6 months ago may not work now, here's the drift vector." It doesn't jump ahead and assume; it follows the behavioral evidence.

**"The situation hasn't arisen yet" concept**: This was one of the most interesting ideas. A user's musical life contains unknown unknowns — moments that haven't happened yet but will, which will require music that hasn't been surfaced yet. The system can't predict these explicitly, but it can maintain a map of unexplored territory relative to the user's current taste trajectory. Not "you should explore jazz" but rather "here's a region adjacent to where you've been that you haven't touched — when the moment comes, it might fit."

---

## The "What Is The Real Product" Moment

*"in retrospect i might be looking at something else as a product/idea and using this music use case to bring it out"*

This was a crucial meta-observation. Music might be the domain, but the actual product might be something more universal:

**The core capability being built**:
- A system that learns the personal semantic mapping of a specific human
- That can serve the *present intent* rather than the behavioral average
- That distinguishes between what you've listened to and what you want
- That knows when to ask and when to observe
- That adapts its own interaction model to your bandwidth state

This is not specifically a music product. The music case makes it concrete and testable. But the same architecture applies to:
- Restaurant/food discovery ("I want something comforting but not heavy")
- Film/TV ("I need something that doesn't require full attention")
- Reading ("long-form, not dense, narrative not analytical")
- Shopping ("functional but not clinical")

The vibe language problem, the personal semantics problem, the cold start problem, the serve/collaborate duality — all of these are domain-agnostic. Music is just the sharpest test case because taste is so personal and the feedback loop is so fast.

---

## The Feedback Signal Problem

*"skips, skipping songs otherwise you might have put on repeat or adding new songs to liked, but also these are only because of existing ui mapping i fundamentally believe that there are easier ways"*

Current feedback primitives are all **artifacts of existing UI conventions**, not natural expressions of reaction:
- Skip: negative signal, but varies enormously in meaning
- Save/Like: positive signal, but varies by mood and context
- Replay: strong positive signal
- Add to queue: forward-facing interest
- Share: social signal, not necessarily personal taste

The fundamental belief: there are feedback mechanisms we haven't designed yet that would be more natural and higher signal. The current primitives are borrowed from Spotify and iTunes, which were designed for different purposes.

**What would a purpose-built feedback mechanism look like?**

Not answered definitively in the sessions. Some directions:
- Gesture-based: swipe depth = intensity of reaction
- Time-based: how long before skip = engagement quality
- Re-surfacing: "resurface this in 2 weeks when I might be in this mood again"
- Moment-tagging: "this exact part" (timestamp-level reaction)
- Mood annotation: not thumbs up/down but "this was right for the moment"

This is an open UX research question. The insight that existing primitives are borrowed rather than native is the important thing to hold onto.

---

## Technical Architecture Summary

### Where We Are Now

```
User intent (text)
    ↓
LLM intent parser (Gemini / Claude Haiku)
    ↓
PersonaLens JSON (energy, mood, tempo, searchQueries, spotifyGenres)
    ↓
Spotify Search + [BROKEN] Recommendations
    ↓
Track pool (8 tracks, deduplicated)
    ↓
LLM reasons generation (why each track fits + estimated BPM/energy/valence/key)
    ↓
TrackSuggestion[] → MapNode placement on 3D globe
```

IntentMemory (localStorage):
- Records rejections per intent key (energy:sorted-moods:tempo)
- Records played tones/energies per intent key
- Passes excludeTrackIds and bias back into next session's query

### What Needs To Change (Priority Order)

**1. Fix broken infrastructure (Last.fm replacement)**
- `getRecommendations()` → Last.fm `track.getSimilar` + `artist.getTopTracks`
- This is table-stakes before any intelligence work

**2. Acoustic embedding pipeline (validation phase)**
- Set up Colab + ngrok endpoint for MERT or Essentia inference
- Get embeddings for a small corpus of tracks
- Prove that embedding similarity outperforms text search similarity
- This is research, not production

**3. Personal semantics model (first version)**
- Per-user, per-word: distribution over acoustic features
- Start simple: just track which interpretations get kept vs skipped
- SDE layer for temporal decay (later)

**4. Cold start protocol**
- One anchor question at session zero
- Provisional cluster from first 2-3 sessions
- Explicit uncertainty communication during early sessions

**5. Context mode detection**
- Explicit activity declaration at session start
- Low Bandwidth → pure serve mode (no questions, no UI beyond play/pause)
- High Bandwidth → full collaborative interface

**6. Longitudinal drift tracking**
- Energy trend over N sessions
- Genre diversity metric
- Skip pattern changes
- Life phase inference (low confidence label, high behavioral grounding)

---

## What Not To Build Yet

- Any hosted ML inference before the Colab validation proves it out
- Complex feedback UI before the simpler primitives are working well
- Life phase labeling before longitudinal drift tracking exists
- Multi-user social features (wrong phase entirely)

---

## Open Questions (Genuinely Unanswered)

1. **Front door UX**: How does the user declare context and intent at session start? "Bit of both" (quick mode tap + optional free text) was the direction, but exact design needs prototyping not theorizing.

2. **Audio acquisition**: Where do we get audio files for MERT embedding? Spotify preview clips (30s) are one path. YouTube audio is another. Legal and practical implications both matter.

3. **The right feedback primitive**: What does a non-Spotify-borrowed feedback mechanism look like? This is genuinely open and probably requires prototyping with a real user.

4. **At what point does the model become self-sustaining?**: How many sessions of data before the personal semantics model is more reliable than the LLM interpretation? Unknown. Probably varies heavily by user.

5. **The privacy model**: All taste data is currently localStorage — no server, no account required. As the model gets richer, this stays local (full privacy) or goes server-side (cross-device, better backup). This is a product philosophy decision as much as a technical one.

---

## How To Proceed

The sessions ended with a clear prioritization insight: **stop theorizing, start building with real data**.

The recommendation was:
1. **Fix the pipeline** (Last.fm replacement) — nothing else works well until this is fixed
2. **Use yourself as user zero** for 2 weeks — actually use Woody daily, observe where it fails
3. **Prototype the context intake** — a single session-start question, see if it helps
4. **Set up the Colab pipeline** — get MERT/Essentia running on a test corpus
5. **Bank the longitudinal concepts** — they're real and important, but they need months of data to be meaningful

The "build as we think" vs "keep ideating" question was resolved as: **stop ideating on things that require data to validate**. The cold start problem, the personal semantics problem, the feedback primitive problem — all of these will become clearer after 2 weeks of real usage than after 2 hours of additional theorizing.

Build the fix, use the product, let reality tell you what's missing.

---

## Appendix: Key Corrections Made During Sessions

These are important because they represent places where assumptions were challenged and refined:

1. **Spotify Recommendations is broken**: Not deprecated eventually — broken now, since November 2024. The initial response glossed over this.

2. **"Atmospheric" ≠ dark/reverby**: For this user, "atmospheric" means expansive curiosity and genre-openness, not an acoustic constraint. This was the concrete example that unlocked the personal semantics problem.

3. **LLM as recommender is the wrong framing**: The initial ML response yes-manned the input without recognizing that using an LLM to generate recommendations (rather than as a disambiguator for a deterministic model) is a fundamentally different architecture with different limitations.

4. **Stance/constraint binary is incomplete**: There are more than two types of vibe language. The real issue is the disconnect between what the user means and what the system assumes, which taxonomy alone doesn't solve.

5. **Atmospheric doesn't mean similar to dark**: Correcting the framing that "atmospheric" is adjacent to "dark" acoustic territory. These are orthogonal dimensions for this user.

---

*Last updated: April 2026*
*All concepts above are exploratory — nothing here is final architecture*
