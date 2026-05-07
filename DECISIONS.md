# Woody — Decision Log
*Single source of truth for what has been decided vs. what is still open.*
*When a decision is made, it comes here. Closed decisions don't get reopened.*

*Last updated: 2026-04-27*

---

## CLOSED DECISIONS — Do Not Reopen

### Product Core
- **Unit of consumption is the session arc, not the track.** Woody surfaces 2-hour acoustic journeys, not individual song recommendations.
- **The intent model is: Internal State × External Context × Desired State = Acoustic Target.** Not just text input. Not just genre.
- **Images/visuals describe acoustic texture, not genre.** The same image produces different acoustic targets depending on the person's internal state. Images narrow the probability space. The person fills the rest.
- **Acoustic field (5 dimensions) is the language.** Energy, warmth, density, organicity, sacred. Not genre labels. Not mood tags. Derived from audio analysis.
- **Rediscovery is first-class.** Woody serves your acoustic need in the moment — new music AND your own old music. "You haven't been in this acoustic pocket in 8 months" is a valid recommendation.

### Platform
- **Web-first, mobile-optimized (PWA).** No app store overhead initially. Native app later if traction justifies.
- **Spotify SDK for playback and library analysis.** Spotify Audio Features API for acoustic coordinate extraction from library.
- **Web Audio API for everything else.** SoundCloud, YouTube, anything playing through speakers — Woody listens in real time and builds acoustic coordinates from the audio directly. No API partnership needed.
- **YouTube has no public audio features API.** Web Audio API real-time analysis is the answer for YouTube mixes.

### Navigation
- **Spatial zoom metaphor is rejected.** Too much cognitive overhead. Gimmick, not UX.
- **No tab-based navigation.** Too generic. Doesn't reflect what the product actually is.
- **Now Playing is the hub.** Everything else lives one gesture from it. Swipe up for history/arcs. Swipe right for territory. Pull down to return. Navigation almost disappears — the primary experience is listening.
- **No binary listener/creator setup choice.** One app. Creator tools surface when behavior signals creator intent (pasting tracklist, logging a set). Not a settings toggle.

### Social
- **Social is a swipe-to-screen, not a tab.** Surfaces when there's something to show. Invisible when empty.
- **Primary social object is the arc, not the opinion.** Share journeys, not ratings.
- **While-listening share:** inviting artifact ("I'm in this acoustic space, join me"). After-listening share: "you missed out" artifact (complete, beautiful, permanent record).
- **Community is topic-organized, not person-organized.** Reddit model. Not Instagram.

### Intent Input
- **Voice input is a mode, not primary.** Toggle between type and talk. User chooses.
- **Images/GIFs as intent shortcut.** Pick a visual that represents the vibe. Image analysis → acoustic priors. Internal state + desired state fills the rest.
- **Activity context chips in intent flow.** Run / Drive / Study / Draw / Wind Down. Part of the same intent surface, not a separate mode.

### DJ Mode
- **DJ mode is first-class, not an afterthought.** Built with DJs in mind — the set arc visualization is the most beautiful artifact in the product.
- **Visualization is bidirectional.** Not just "visualize a set after the fact" — also diagnostic while building. See acoustic gaps. Woody suggests bridges between acoustic states.
- **Creator tools surface from behavior,** not from an onboarding split.

### Controls / Nudge
- **Nudge controls are spatial, not labelled.** A 2D pad. Push in a direction. No words. Intuitive physical metaphor — push toward warm, push toward intensity, ease back.

### Acoustic Field Visualization (Now Playing)
- **The acoustic field IS the now-playing screen.** Not a player with a visualizer bolted on. The generative visual fills the display. Track info is minimal overlay. Arc position is a thin horizon line at the bottom.
- **Exact art direction NOT yet decided.** Visual language session required first.

### Framing
- **One app, not two products.** Listener and creator modes emerge from behavior.
- **Mission statement (working):** "Music that matches your moment."
- **Positioning language (working):** "Faith in the human ear." The acoustic intelligence layer for your music life.

---

## OPEN DECISIONS — Need Resolution (in priority order)

### 1. Visual Language — CLOSED ✓
**Status:** Session complete. See `VISUAL_LANGUAGE.md` for full specification.
**Direction:** Algorithmic geometric base (Vera Molnár / Sol LeWitt) + fluid rounded illustrative accents (World A scientific intimacy) + fully acoustic-responsive motion.
**Key decisions:**
- Acoustic field breathes and pulses at the pace of the music — motion is data-driven, not preset
- Shareable artifacts: consistent recognizable layout (arc + coordinate field) with unique generated geometric texture per session
- Motion character (speed, smoothness, complexity) derived from acoustic coordinates in real-time
- Color mapping: high warmth → amber flooding; high energy + low warmth → cobalt; high sacred → luminous desaturation; territory always teal
- Never: glassmorphism, neon/synthwave, lava lamp randomness, album art as hero
**Still unresolved (non-blocking):** Pixel/custom art for artifacts (needs small exploration), illustrated form library (8–12 fluid shapes to define), near-dark surface color lift value

### 2. Container Design — MEDIUM PRIORITY
**Status:** Current proposal (Session → Arc → Mixtape → Pocket → Territory) flagged as too one-size-fits-all.
**Open question:** Different listening relationships need different container shapes. How do we give users shape-ownership without overwhelming with options?
**Session needed:** Half session dedicated to this.
**What to resolve:** Names, shapes, relationships between containers, how containers grow from behavior vs. manual creation.

### 3. Human Psychology Integration — MEDIUM PRIORITY
**Status:** Research + synthesis needed.
**Scope:** Music psychology (mood regulation theory, arousal/valence model, frisson), ultradian rhythms (90-min energy cycles), habituation and novelty-seeking, nostalgia and memory association, flow state acoustic conditions, social bonding through music.
**Not a marketing talking point — informs actual engine and session arc design.**
**Output needed:** Psychology principles document that feeds into arc shape design and intent model.

### 4. Full IA / Screen Map — BLOCKED by Visual Language
**Status:** High-level decisions made (Now Playing as hub, gesture navigation). Detailed screen map not yet done.
**What's decided:** Home surfaces 2–3 session options immediately + intent input. Now Playing is hub. Swipe gestures for history/territory. Social is a separate swipe-screen.
**What's not decided:** Exact screen count, transitions, information hierarchy on each screen.

### 5. Mission Statement — LOW PRIORITY (working version exists)
**Working:** "Music that matches your moment."
**Needs:** 1 session to finalize once visual language is decided (language and visual need to be coherent).

---

## SESSIONS STILL TO HAPPEN (in order)

1. **Visual language + brand direction** — no coding, pure design thinking. References → principles → decisions. High priority, blocks everything else.
2. **Human psychology deep dive** — research synthesis → product principles. Informs arc shapes and intent model.
3. **Container design** — half session. Name and shape the content objects.
4. **Full IA / screen map** — after visual language. Map every screen, every state, every transition.
5. **Engine build** — Spotify OAuth → audio features → 5D mapping → k-NN → session arc generation. Real build, not prototype.
6. **Full UI build** — after all above decisions are made.

---

## THINGS TO NEVER FORGET

- The acoustic field visualization is technically built but NOT aesthetically final. Visual language session changes it.
- DJ mode must feel built-for-DJs, not adapted-for-DJs. This is a culture decision as much as a product decision.
- The social layer is invisible until there's something to show. Do not build empty social features.
- Human psychology informs the engine — this is not a feature, it's the foundation of how arc shapes are designed.
- Open sourcing parts of the acoustic analysis layer is on the table for community/trust building. Not now, flagged for later.
- Website/landing page needed alongside the app. Separate design consideration.
