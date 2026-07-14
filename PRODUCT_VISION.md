# Woody — Product Vision
*Last updated: 2026-06-23. Living document — update after every significant product discussion.*

---

## The Core Belief

Music listening is the most personal form of cultural consumption, yet every product built around it treats preference as a behavioural output to be modelled and fed back. Woody starts from a different premise: your musical taste has structure, that structure has causes, and understanding those causes is itself valuable — not just as input to a discovery engine, but as a form of self-knowledge.

**The founding insight:** emotion in music is a byproduct of musical infrastructure. A melody resolves in a particular way. A rhythm creates specific tension. A timbre carries cultural memory. A harmonic movement implies a cultural lineage. These are the causes. The feeling is the effect. Every product in the market optimises for the effect. Woody maps the causes.

---

## The Problem

Active listening is dying. Spotify killed it by optimising for time-on-platform through passive consumption loops. The cost is ownership — most listeners have no real relationship with their own taste. They have a relationship with Spotify's model of their taste, which is built on what they played, not on what they actually responded to or why.

The music nerd already does this manually — researches influences, traces lineages, connects melodic patterns across cultures, builds a personal map. Woody is the infrastructure that makes this possible at scale and sharable as identity.

The specific gap nobody has filled: **understanding why a specific musical element produced a specific response, then using that understanding to navigate discovery**. Not "people like you also played." The song that fits the harmonic movement, the melodic contour, the timbral texture, the cultural thread — surfaced because the system understood the cause, not just the effect.

---

## Who It's For

**Primary user: the music nerd who wants to discover themselves through music.**
Someone for whom a song is not entertainment but an object of inquiry: why does it work, where did it come from, what specific thing is it doing to me and why. They collect, research, make connections, and feel ownership over their taste. They are frustrated by Spotify because it knows what they played but has no idea what they actually heard.

**Secondary user: the curious listener who wants genuinely good discovery without the intricate process.**
Same engine, different interface sensitivity. The musical intelligence is identical — what changes is how much of the reasoning is surfaced versus abstracted into a simpler experience. This is user-sensitive discovery, not two separate products.

**Not for:** passive listeners who want background music and are happy with Spotify's loop.

---

## The Primary Interaction

**Explore. Understand. Own.**

Not three separate features — one progressive arc. You explore musical territory. You understand what you find and why it resonates. You own the result as part of your identity and taste narrative.

Navigation (the arc) is the format for exploring. Understanding — why this track, what element caused the response, where that element came from — is what makes discovery meaningful rather than accidental. Ownership is what brings people back and generates the shareable artifact. "Explore" alone undersells it.

Secondary interaction: **purposeful playback** — attach an intent or context to an arc and let Woody execute it. This is "musical gaslighting" in the consensual sense: you set a directional intent at a high level, Woody steers the musical experience toward it through specific structural choices, not just mood labels. More intentional than Spotify's manipulation, fully transparent in its mechanism.

---

## The Core Mechanic

**Finding the song you didn't know you were looking for.**

You heard something — a melody, a harmonic movement, a build, a texture. You responded to it. You don't know why exactly, but you know the response was real. Woody's job is to: (1) understand what musical element caused the response, (2) find more instances of that specific element across the full musical universe, and (3) surface connections you couldn't have found yourself — across genres, cultures, eras, languages.

The knowledge graph is the mechanism: nodes are musical properties (melodic contours, harmonic movements, rhythmic patterns, timbral qualities, cultural influences), not tracks. Tracks are instances of node combinations. Discovery navigates the graph, not a feature vector space.

Example: you loved an EDM track — the melody and the build specifically. Woody extracts: the melodic contour type, the tension/release structure of the build, the timbral character of the lead sound. It traces those elements: this melodic contour has roots in French house, which drew from Chicago disco, which drew from Philly soul. It finds other tracks — across all those lineages — that share the specific elements you responded to, not the genre label.

---

## The Dimensional Space

Dynamic, not static. The dimensions that matter are personal — they are the musical properties this specific user responds to, weighted by the strength and recency of their response signals. The space evolves as the user's taste is better understood.

This requires:
- **Musical DNA extraction**: structural properties from audio (melody, harmony, rhythm, timbre, key, mode, cultural markers) — not Spotify's audio features, which are too shallow and increasingly restricted
- **Behavioural attribution**: not just "did you play it" but "which specific element caused the response" — requires note/feedback mechanisms and skip taxonomy
- **Learning model**: multidimensional, user-specific, updates on every meaningful signal
- **Agentic layer**: assists users in articulating what they like, especially when they can't name it themselves

---

## The Social Object

Not a playlist. A **documented musical journey with its reasoning visible**.

Shareable not because the tracks are good but because the path is interesting and the reasoning is personal. The Strava analogy: the meaning isn't in finishing the run, it's in the record of the effort and what it reveals about you. Social validation as a driver of habitual use — not mass social features, but the ability to export a discovery arc as an artifact that says something true about the person who made it.

Formats: Spotify/Apple Music/YouTube playlist, DJ tracklist, a visual arc, a "radio" format. The artifact type adapts to the context. The reasoning layer is always preserved.

---

## What This Is Not

- Not a streaming service (we sit on top of Spotify, YouTube, Apple Music, SoundCloud — whatever is accessible)
- Not a recommendation engine (recommendations tell you what to listen to; Woody maps why you like what you like and lets you navigate from there)
- Not mood-based (mood is downstream of musical structure — we work upstream)
- Not passive consumption (the disruption thesis is active listening as identity)
- Not genre-bounded (genre is a marketing category; Woody works at the level of musical properties that cross genre boundaries)
- Not platform-dependent (Spotify is a playback layer, not the intelligence layer)

---

## The Disruption Thesis

The music industry — streaming platforms specifically — has optimised for time-on-platform through passive consumption. This produces listeners who have vast libraries and no relationship with them. The counter-thesis: ownership of musical taste is valuable, possible to achieve, and can be the basis of a different product category entirely.

Woody disrupts not by being a better Spotify but by being a fundamentally different thing — an instrument for musical self-knowledge, with playback as the delivery mechanism for what you discover.

**How it disrupts (the mechanism):**
1. Works upstream of emotion — musical structure → emotional response, not the reverse
2. Builds understanding alongside discovery — every find comes with a why
3. Makes taste a first-person artefact — you own your discovery history, it's yours to share or keep
4. Platform-agnostic intelligence — Spotify is a playback layer, not the intelligence layer
5. Biographical + behavioural personal model — yours, not a population average

**What has to be true:** Discovery quality must be meaningfully better than Spotify from session one, before personalisation kicks in. The understanding layer must feel illuminating, not academic. The ownership artefact must feel worth sharing.

The market gap this exploits: AcousticBrainz (the only serious open musical DNA infrastructure) was shut down. Spotify's audio-features API is being restricted. The infrastructure layer for musical intelligence is being systematically removed by platforms protecting their moats. Woody builds that infrastructure — first for its own engine, eventually potentially as a community resource.

---

## MVP Moment

A user hears a song that immediately feels like "this is mine" — not because an algorithm predicted they'd play it, but because the system understood a specific musical element they'd responded to weeks earlier and found an exact match they'd never have found themselves.

**"The song I didn't know I was looking for."**

Everything in the build is pointed at producing this moment reliably, then repeatedly.

---

## Success Signals (early)

- User can articulate something about their taste they couldn't have articulated before using Woody
- User finds a track via Woody that they've been "looking for" without knowing it
- A discovery arc gets shared as an artifact by someone who isn't the builder of the product
- Return usage driven by discovery interest, not habit loops

---

## Open Questions (unresolved)

- **Biographical cold start** — what does the musical biography onboarding actually look like? Three questions max. How do formative anchors weight differently from recent signals in the personal model?
- What does the note/feedback mechanism look like in practice? (Text? Tags? Moment-level annotation?)
- How is "first impression and state at reception" captured — asked or inferred?
- What environmental signals are in scope? (Time, location, activity, device, social context?)
- Is the knowledge graph AI-extracted, community-curated, or both?
- Open source angle: does the musical DNA infrastructure become a public resource as a moat strategy?
- Artifact format: what specifically does a shared discovery arc look like visually?
- User journey from scratch — emotional/cognitive arc, not screens
