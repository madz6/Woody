# Woody — Innovation & Design Engineering Portfolio

> A living document of the problem, the insight, the architecture, and the decisions.
> Not a product description. A record of how the thinking evolved.

---

## The Problem

Music discovery tools are recommendation engines. They observe what you've listened to
and reflect it back. Spotify learns your behavioral fingerprint. It does not learn what
you mean when you say a word. It learns what you do, not what you want.

The gap: **what you've listened to** and **what you want right now** are different things.
A recommendation engine optimized on the first will systematically fail at the second.

Woody started as an attempt to close that gap — a natural language music discovery
interface where you type a vibe and get tracks placed on a 3D globe. The early
implementation used an LLM to parse intent and Spotify's recommendation API to find
tracks. It worked. It also revealed the fundamental problem.

---

## The Insight That Changed Everything

The concrete failure case was "atmospheric."

Initial assumption: "atmospheric" is an acoustic descriptor. Dark, spacious, reverb-heavy.
Something adjacent to ambient or shoegaze.

That assumption was wrong. For this user, "atmospheric" means *expansive curiosity* —
genre-agnostic openness to discovery. Not a sonic texture. A stance.

This is not an edge case. This is the core problem:

**Vibe language maps to completely different acoustic territories per person.**

For person A: "atmospheric" = shoegaze, walls of reverb.
For person B: "atmospheric" = late-night jazz, sparse.
For person C: "atmospheric" = open curiosity, no acoustic constraint at all.

A population-level language model applies the most common interpretation. That is,
by definition, wrong for anyone whose semantics diverge from the mean. Which is
most people, most of the time, for the words that matter most.

This is **the personal semantics problem**.

---

## The Architectural Implication

Once you see the personal semantics problem clearly, the right architecture follows:

**The LLM should translate intent, not interpret it permanently.**

The LLM's job: parse vibe language into a starting acoustic target. High uncertainty
at first. Wide distribution. Then the system watches what the user actually does with
the results — plays, skips, saves, rejects — and updates its model of what this user
means by this word.

This is Bayesian updating in acoustic feature space. Not word space. Not behavioral
fingerprint space. *Acoustic* feature space — the actual sound of the music.

```
User Intent (text)
    ↓ LLM: translation only
PersonaLens + initial acoustic target (high uncertainty, wide prior)
    ↓ candidate pool (Last.fm similarity + Spotify search)
Acoustic Analysis Service
    → feature vector: {bpm, energy, spectral centroid, MFCC[0-12], key, mode, rhythm}
    ↓
Personal Taste Model
    → taste centroid (weighted mean of kept tracks in acoustic feature space)
    → per-intent semantic map ("atmospheric" → acoustic distribution for this user)
    → Bayesian update on every play / skip / save / reject
    ↓
Ranking: acoustic distance(candidate, taste_centroid + intent_target)
    ↓
Globe: energy → latitude, valence → longitude
```

The LLM appears exactly once: at the top, as a translator.
All learning happens in the deterministic acoustic layer.

---

## Key Architectural Decisions

### Decision 1: Deterministic over probabilistic recommendation

It would be faster to use an LLM to recommend tracks. More prompt engineering,
better search queries, a better-instructed model. This was the temptation at every step.

It was rejected every time.

The reason: an LLM applying better population-level knowledge is still population-level.
A deterministic model learning from this user's actual acoustic responses is personal.
These are not the same thing, and they don't converge with more compute.

The bet: a deterministic system, once built with real acoustic features, will
outperform any amount of LLM recommendation for the same reason that a personalized
recommendation system outperforms a generic one — it has the right data.

### Decision 2: Acoustic features over text/social similarity

The existing approach used Last.fm social similarity (what people who listened to X
also listened to) and Spotify text search. Both are useful as candidate generators.
Neither is a taste model.

Social similarity assumes population: users with similar listening history have
similar taste. That assumption fails on genre boundaries and on edge cases.

Text search retrieves by metadata, not by sound. "Dark electronic" retrieves dark
electronic. "Psychedelic trap" (an artist blend of Young Nudy meets Tame Impala)
retrieves whatever the LLM constructs as a query — which may not be what the user
means at all.

Acoustic features are direct: this track has BPM 142, energy 0.8, spectral centroid
in the upper register, minor mode. Euclidean distance in that space is a real measure
of sonic similarity. It doesn't require any cultural knowledge about what genres are
adjacent to what.

### Decision 3: Personal semantics as the core learning target

Most ML recommendation systems learn "what you like." Woody's learning target is
different: it learns "what you mean."

The distinction matters. "What you like" is a preference over items. "What you mean"
is a mapping from language to acoustic territory. The second is harder but more
powerful — it allows the system to serve novel intent accurately, not just recombine
past behavior.

The implementation: per-user, per-vibe-word, a probability distribution over acoustic
features. Updated Bayesian-style on behavioral signal. Narrow distributions mean the
system knows what this word means for this user. Wide distributions mean uncertainty —
serve diverse candidates, watch what sticks.

---

## The Build Process

### Phase 0: Working infrastructure
The first sessions covered fundamental plumbing: Spotify integration, Last.fm API,
natural language intent parsing, the 3D globe, session memory, rejection learning.
This was necessary even though none of it was the "real" intelligence layer.

The gap was always known. The question was when to address it and how.

### Phase 1: Identify the broken foundation
Spotify deprecated Audio Features, Audio Analysis, and Recommendations in
November 2024. The core discovery mechanism was silently broken. Last.fm became
the primary replacement. This forced a rebuild of the discovery pipeline and
exposed how much the architecture depended on infrastructure that no longer existed.

### Phase 2: The personal semantics realization
The "atmospheric" failure case and the "Young Nudy meets Tame Impala" failure case
made the personal semantics problem undeniable. Better prompting would not fix it.
The architecture needed to change.

### Phase 3: Artist blend as near-term fix, acoustic service as real fix
For the artist blend problem specifically: a prompt rule (ARTIST BLEND RULE) plus
`artistSeeds` in the PersonaLens interface routes named artists to direct Last.fm
discovery rather than text search. This is a band-aid but a functional one.

The real fix is the Essentia acoustic service. That's the next foundational build.

### Phase 4: Essentia acoustic service (next)
Python service on Modal.com serverless infrastructure.
`analyze_preview(spotify_preview_url) → feature_vector`
Runs Essentia audio analysis on 30-second Spotify preview clips.
Returns: {bpm, energy, spectral_centroid, mfcc_0_through_12, key, mode, rhythm_strength, tonal_range}

This is the foundation everything else is built on. Once this exists:
- Globe placement uses real acoustic data, not LLM estimates
- Taste centroid is computable
- Personal semantics learning can begin
- "Young Nudy meets Tame Impala" can be evaluated acoustically, not linguistically

---

## The Meta-Product Insight

Music is the domain. The actual capability being built is domain-agnostic.

A system that:
- Learns the personal semantic mapping of a specific human
- Serves the present intent rather than the behavioral average
- Knows the difference between what you've done and what you want
- Adapts its own interaction model to the user's current bandwidth state

This is not a music recommendation system. It's a personal intent understanding
system that happens to be tested in the music domain because music is a domain where:
- Feedback is fast (skip = 2 seconds)
- The stakes are low enough to experiment
- The personal semantics problem is sharp and testable
- User preference is deeply personal and highly idiosyncratic

The same architecture applies to any domain where vibe language matters and
population-level interpretation is systematically wrong for individual users.

---

## Unresolved Questions (as of April 2026)

1. **Audio acquisition at scale**: 30-second Spotify previews are not always available.
   What's the fallback? YouTube audio extraction? Legal considerations apply.

2. **Cold start quality**: How many sessions before the personal taste model is more
   reliable than LLM interpretation? This requires empirical measurement, not theorizing.

3. **The right feedback primitive**: Skip, save, replay — these are borrowed from
   Spotify's UI conventions. What feedback mechanism would be more natural and higher
   signal if designed from scratch? Genuinely open question.

4. **Context signal without sensors**: Knowing whether a user is running vs. at a desk
   changes how behavioral signals should be weighted. Explicit declaration (a context chip)
   works but requires action. Inferred context is harder but more seamless.

5. **Privacy model as the model gets richer**: Currently all data is localStorage.
   A richer acoustic taste model has more value cross-device, which requires server-side
   storage and an account model. This is a product philosophy decision as much as technical.

---

## Skills and Technologies

**Audio Analysis**: Essentia (MTG Barcelona) — acoustic feature extraction from audio
**Serverless Infrastructure**: Modal.com — Python endpoints without server management
**Music Metadata**: Last.fm API — artist/track similarity, not deprecated
**3D Visualization**: Three.js + React Three Fiber — globe with acoustic-positioned nodes
**Intent Parsing**: Claude Haiku / Gemini — translation layer only, not recommendation
**State & Learning**: Bayesian updating in acoustic feature space (from scratch)
**Frontend**: Next.js + TypeScript, Framer Motion for transitions
**Storage**: localStorage for session persistence and intent memory (privacy-first)

---

## Principles This Project Is Built On

1. **Bet on deterministic systems.** A well-designed deterministic model in the right
   feature space outperforms a probabilistic LLM in its own domain. Always.

2. **The vision is sacred. The build spec is not.** Plans should be changed when they
   drift from the vision. The architecture should be rebuilt when the framing is wrong.
   Trial and error in the right direction is how you build the real thing.

3. **Build specs are tools, not commitments.** The value of a spec is that it forces
   clarity. When clarity reveals the spec is wrong, change the spec.

4. **The personal is the technical.** "What this user means by this word" is both a
   user experience question and a machine learning question. The best architecture is
   the one that holds both.

5. **Serve the present intent.** Not the behavioral average. Not the population.
   Not what's popular. What this person, in this moment, actually wants.

---

*Last updated: April 2026*
*This document is a record of thinking in progress, not a finished statement.*
