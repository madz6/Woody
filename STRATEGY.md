# Woody — Product Strategy
*Last updated: 2026-04-27*

---

## The Core Thesis

Music discovery is broken not because there isn't enough music, but because there's no language for what you actually want to hear. Genre is too broad and too culturally loaded. Mood labels are arbitrary. Spotify's recommendation algorithm is good at "more of the same" but can't respond to intent.

Woody builds a new language: acoustic coordinates. Five continuous perceptual dimensions that describe how music actually sounds — energy, warmth, density, organicity, sacred. These replace genre labels with something that's MECE (mutually exclusive, collectively exhaustive) and derivable from audio analysis.

The product is the layer between "I want to hear something" and "here it is" — a discovery and curation tool that speaks acoustic fluently.

---

## The Product in Layers

### Layer 0 — Acoustic Engine (the invisible foundation)
Converts audio features → 5D acoustic coordinates. Powers everything else. Without this working well, nothing else matters.

### Layer 1 — Personal Discovery
"What do I want to hear right now?" Natural language intent → acoustic coordinates → nearest-match session arc. Your acoustic territory accumulates over time. The longer you use Woody, the better it knows your acoustic shape.

### Layer 2 — Session Arcs (not track recs)
Music consumption is naturally long-form. A 3-minute recommendation is an ingredient; a 2-hour session is a meal. Woody surfaces complete session arcs: a starting state, an ending state, and an acoustic journey between them. These can be steered.

### Layer 3 — Activity Integration
The activity is the steering mechanism. A run, a drive, a study session, a creative session — each has a natural duration and energy arc. Import from Strava, Apple Health, Google Maps, or manual input (2 hours, meditative, slight build at 90 minutes) and Woody generates the acoustic arc that maps to the activity. The session becomes a sharable artifact attached to the activity.

### Layer 4 — Identity Expression (the acoustic bridge)
Your acoustic territory is honest but not exposing. It shows the shape of your taste — not the specific tracks. A wide, energy-spanning warm territory tells a story about you without exposing your guilty pleasures. This is the structural solution to the introspective/social tension: people can share their acoustic fingerprint without sharing their embarrassing tracklist.

### Layer 5 — Sharing and Social Objects
The primary social object is the **arc**, not the opinion. "Here's the journey I took this Tuesday" is relatable and low-stakes. "Here's my 8/10 review" is performative and high-stakes. Arcs are shareable as visual artifacts — embeddable, postable to Strava, Instagram Stories, DJ channels. Nobody's journey is wrong.

### Layer 6 — Community
Community organized around acoustic territories and discovery arcs, not person-organized profiles. Reddit-like: topic-first, pseudonymous optional, low-friction participation. The conversation is "how did you get here" not "is this good." The incentive is exploration depth and network of connections between tracks/artists, not agreeability scores.

### Layer 7 — Story / Context Layer
Acoustic context only — Woody explains *why something sounds the way it feels*, not the biography of the artist. "The descending minor line in the hook acoustically mirrors the lyrical content" is something Genius doesn't do. For everything else (lyrics, biography, historical context) — link out to Genius, Wikipedia, AllMusic.

---

## The Guilty Pleasure Problem

The fundamental tension: introspective listening (your real taste, including embarrassing stuff) vs. social sharing (what you'd publicly admit to liking).

**The acoustic field solves this structurally.** The field shows the *shape* of taste, not the content. A high-energy warm-to-cold-spanning acoustic territory is beautiful and interesting without naming a single Taylor Swift track. The guilty pleasures contribute to the shape without being legible as specific artists. You share your acoustic fingerprint, not your library.

---

## Session Steering

Two modes:

**Activity-led:** Import activity data (Strava run, Google Maps route, Apple Health workout). Duration and effort curve are known. Woody generates an acoustic arc that matches — energy rises when the effort rises, warmth and organicity provide the emotional texture, density provides the propulsion.

**Intent-led:** Set start state ("I'm tired, ease me in") and end state ("I want to feel energized by the end"). Optional: add acoustic waypoints. Real-time: subtle nudge controls (push warmer / colder / more intense / ease up) that reshape the remaining arc without disrupting flow.

---

## Community Architecture

**What works:**
- Reddit: topic-organized, pseudonymous, low-friction participation, community sets norms early
- The social object is "this arc took me somewhere I wouldn't have found" — rewards being interesting, not being right
- Mutual discovery paths as connection mechanism: "you and this person share acoustic territory but arrived via completely different routes"

**What fails:**
- Identity-tied platforms (Instagram, LinkedIn, Threads): too much social stakes
- Opinion/rating systems: optimize for legible takes over authentic sharing
- Influence model: artists promoting themselves vs. curators sharing what they actually like

**The mechanism that makes community work without the cold-start problem:**
DJ/mix wedge populates the social layer before it's "social." DJs post arcs. Their followers try the tool. Followers build territory. Followers share arcs. Community forms around shared acoustic space, not around any individual.

---

## The DJ/Mix Wedge — Detailed Mechanism

A DJ plays a 2-hour set. Current artifact: a flat list of 40 track names on Mixcloud.

Woody's artifact: the acoustic arc of the entire set. Energy curve over time. Warmth trajectory. Density peaks. The moment the floor started moving, visualized. Automatically generated from the tracklist + acoustic analysis.

Why DJs specifically:
1. They already have the documentation behavior (public tracklists)
2. The upgraded artifact (acoustic arc) is useful to them (they can see their own patterns)
3. The artifact is visually compelling enough that followers ask "what is that?"
4. Their audience (taste community, music enthusiasts) is exactly Woody's target user
5. No acquisition cost — the utility creates the sharing which creates the reach

The DJ wedge is the bridge between "personal tool" and "social platform." It populates the social layer with authentic content before requiring community behavior from general users.

---

## Comparable Business Models — Key Mechanisms

| Mechanism | Source | Our Version |
|-----------|--------|-------------|
| Identity through taste | Letterboxd | Acoustic territory as exportable identity |
| Low-stakes logging | Letterboxd (diary format) | Session arc as personal record, not publication |
| Canonical reference layer | RYM (taxonomy depth) | Acoustic coordinates as the new lingua franca |
| Automatic accumulation | Last.fm (scrobbling) | Acoustic tagging of listening sessions |
| Historical data moat | Last.fm | The longer you use Woody, the more irreplaceable your territory |
| Collector identity | Discogs | Territory map as acoustic collection |
| Power user contribution | RYM | Curators building acoustic annotations and arcs as content |

**Novel mechanisms not from comps:**
- Acoustic embed: shareable arc visualization that plays live on any page
- Activity platform integration: acoustic arc attached to Strava run / Google Maps drive
- Spotify Wrapped alternative: acoustic year-in-review (genuinely personal, not a Spotify ad)
- DJ set as social acquisition: arc from respected DJ → curiosity → trial

---

## Moat Progression

| Phase | Moat |
|-------|------|
| 0–6 months | Acoustic intelligence quality (best mapping of audio → coordinates) |
| 6–18 months | Personal territory data (irreplaceable acoustic history) |
| 18–36 months | Social graph (who you trust acoustically) |
| 36+ months | Network effects (more territory data → better recs → more users → more data) |

Feature moats erode. Data moats compound. Social graph moats need critical mass. Build in that order.

---

## Sequencing

1. **Rec engine** (now — your own pain) — acoustic analysis pipeline + intent parser + session arc generation
2. **DJ/mix wedge** (3–6 months) — set logging, arc visualization, shareable artifact
3. **Activity integration** (parallel with DJ wedge) — Strava, Apple Health, Google Maps
4. **Social layer** (6–12 months) — emerge from DJ community, don't launch it explicitly
5. **Community** (12+ months) — after culture is established, not before
6. **Pro / Revenue** (alongside social) — analytics, API, embeds

---

## The Window

Post-Spotify Wrapped backlash, post-TikTok algorithm anxiety, Letterboxd proving taste communities can work outside streaming — the window is open. Estimated 18–24 months before Spotify closes the social gap. The cultural moment for "actually understand what you like" vs "be fed what the algorithm thinks you like" is now.

**Kill condition for current strategy:** If Spotify ships a genuine social/curation layer with acoustic intelligence before Woody reaches the DJ wedge milestone, the moat strategy needs to be revisited.

---

## What Woody Is Not

- Not a streaming service (no licensing, no catalog)
- Not a playlist generator (that's a feature, not the product)
- Not a review platform (not Pitchfork or RYM)
- Not a social network (community emerges from product, not vice versa)
- Not a DJ tool (DJ wedge is entry point, not destination)

---

## The Real Intent Model

The simple intent model (text → acoustic coordinates) is incomplete. The real model is:

**Internal State × External Context × Desired State = Acoustic Target**

- Internal state: how the user feels right now (tired, anxious, euphoric, focused, grieving)
- External context: environment and activity (running, driving, beach, studying, cooking)
- Desired state: where they want to go (energized, calm, euphoric, focused, nostalgic)

These three inputs together produce a richer acoustic target than any single text description can.

The image/visual intent layer extends this further: instead of describing their state in words, users can pick an image or GIF that represents the vibe. Image analysis (colour temperature, scene content, activity inference) maps to acoustic coordinates automatically. This removes language friction and creates a visual vocabulary unique to Woody.

## Positioning — 'Faith in the Human Ear'

Woody's moat is not the catalog (that's Spotify's) or the social graph (that's everyone's problem) but the dissective acoustic intelligence and systematic attribution of listening to human psychological states. The brand positioning:

'High-impact recs, no friction, fun with the community. Achieved through the engine and faith in the human ear.'

Music is the perfect neuro-regulatory stimulus. Given enough understanding of mental psychology and acoustic intelligence, any track can feel precisely right for any moment. That's not algorithm delivery — that's acoustic intelligence delivered with psychological intentionality.

## Session Shape Classification

Sessions are not all the same shape. Shapes include:
- Single apex (builds to one climax, descends)
- Multiple peaks (interval training equivalent)
- Plateau (sustained state — for work, study)
- Journey (gradually evolves from one acoustic state to another)
- Inverse (starts high, descends — wind-down)
- Wave (oscillates — dynamic environments)

The rec engine needs to understand both WHERE (acoustic coordinates) and HOW (arc shape). ML classification of listening patterns → desired shapes → connect to intent → enable accurate session arc generation.

## Visual Language — Scheduled Design Session

Woody needs a completely unique visual language: brand animations, graphic assets, colour schemes, design language, typography, micro-interaction design, generated art style for artifacts and widgets. This is a dedicated session — NOT to be done incrementally. Note: pixelated or custom animated art style for shareable artifacts is on the table.
