# Woody
### A curated music discovery experience.
> Living product doc — updated as we build. Last updated: April 2026.

---

## What Woody is

Woody is a **taste-and-intent engine** for curator listeners. It turns a messy, human vibe — *"late night drive, glossy, no sad piano"* — into a repeatable discovery journey with logic, pacing, and memory.

Not a playlist generator. Not a recommendation feed. A journey that feels authored, by you, with help.

---

## The one-line pitch

> "Your aux buddy that understands context, learns your taste, and navigates music with you — not for you."

---

## Who it's for (ICP)

**Curator listeners.** People who think in transitions and taste identity, not genre + popularity.

- Playlist makers, music nerds, DJs-lite
- "I need the exact vibe" people
- People who value mood logic + sequencing
- People frustrated that context evaporates — "that 2am drive vibe" disappears and you can never recreate it

---

## The problem

| Pain | What it means |
|------|--------------|
| **Discovery is noisy** | You can't express nuance. Apps flatten intent into genre + popularity. |
| **Curation takes effort** | Building a coherent run of tracks that make sense together is actual work. |
| **Context evaporates** | "This vibe at 2am" disappears unless you capture it as a reusable artifact. |

---

## Philosophy

Most recommendation systems optimise for **similarity + engagement**.

Woody optimises for **curation**: intent, sequencing, controlled surprise, continuity across sessions.

The goal isn't "more like this." It's **a journey that feels authored, by you, with help.**

Woody treats listening like a psychological state machine:
- Capture the moment
- Preserve what matters
- Explore without breaking coherence
- Remember what you meant last time

---

## The core experience

### The 1am moment
You open Woody. You see **3-4 tracks** — not a playlist, not a feed. Just what's waiting for you. Tracks that belong in your taste territory but you haven't found yet. A beckoning, not a recommendation.

You pick one. Woody builds the flow from there — whether you want to actively listen or just let it run. **That's the intent layer.**

### Active vs. Ambient
Two listening modes:
- **Active** — you're steering, paying attention, in discovery mode
- **Ambient** — you handed control over, it runs, EQ adjusts, don't interrupt me

Woody knows which mode you're in and behaves accordingly.

---

## The Map

The central UI metaphor is a **globe**.

- **Named cities** = tracks and vibes you've claimed, loved, saved. Your anchors.
- **Surrounding territories** = sonic neighbors. Similar energy, adjacent mood. Familiar but unexplored.
- **Deep oceans** = real unknown. High stretch. Far from your established taste.

The map is **alive and reactive**:
- Pulses and breathes with the music playing
- Color temperature shifts with energy and mood (warm = high energy, cool = mellow, dark = late night)
- Your journey through it leaves a visible trail
- That trail is your taste memory made visible

**Navigation IS the controls.** Instead of buttons like "Add Constraint" or "Go Darker" — you move toward a node. Pulling toward a cooler, darker cluster IS the gesture for "take it somewhere more late night."

### Zoom levels
- **Zoomed out** — your full taste territory. Your life as a listener.
- **Zoomed in** — neighborhood detail. Your current session, nearby tracks, the path ahead.

### On mobile
The map lives as an ambient, reactive background behind the player. You occasionally reach into it. Glance interactions only — one tap to signal "stay here" or "go somewhere new." Never interrupts the flow state.

### On desktop
Full spatial experience. You're navigating a territory.

---

## The EQ

**Smart and interactive, not preset.**

Adapts to both:
1. **The track** — reads audio characteristics in real time (bass weight, brightness, dynamics)
2. **You** — your preference profile, your current mood/mode, the device you're on

No presets. No manual tweaking unless you want it. It just hits the right spots.

---

## The loop (how it actually works)

```
Intent Input (prompt + chips + optional seed track)
        ↓
Woody interprets vibe → builds taste lens
        ↓
3-4 track suggestions shown on map (your territory + what's missing)
        ↓
You pick one → session begins
        ↓
Quest Run: Anchor → flow builds outward
        ↓
Micro-signals during listening (glance gestures, not menus)
        ↓
Save Point: name it, note it, it becomes a map artifact
        ↓
Next session starts with this context loaded
```

---

## What makes Woody different

| | Spotify | YouTube | Apple Music | Woody |
|---|---|---|---|---|
| Express intent in natural language | ✗ | ✗ | ✗ | ✓ |
| Steer mid-session | ✗ | ✗ | ✗ | ✓ |
| Session memory + taste notes | ✗ | ✗ | ✗ | ✓ |
| Long-form mixes / DJ sets | ✗ | ✓ | ✗ | ✓ (YouTube mode) |
| Reactive visual map | ✗ | ✗ | ✗ | ✓ |

---

## Technical direction (evolving)

### Stack
- **Frontend**: Next.js + React (web first, mobile-responsive)
- **Styling**: Tailwind CSS
- **Map/Visual**: Three.js / React Three Fiber
- **Audio reactivity**: Web Audio API
- **Backend**: Next.js API routes (serverless, keeps it simple)
- **Database**: TBD (likely Supabase for speed)

### Music data
- **Primary**: Spotify API — track search, recommendations, audio features
- **Secondary**: YouTube API — DJ sets, mixes, long-form content (separate mode)

### Intelligence layer
- LLM (Claude/OpenAI) for intent parsing: turns natural language vibe into structured parameters
- Custom sequencing logic for the quest run
- User taste model built from save points + signals over time

### Build order
1. Core loop — intent → tracks → play → signal (no map yet)
2. Memory layer — save points, taste notes, session history
3. Map — build the globe once the loop is working
4. EQ — smart audio processing layer
5. Polish — reactivity, animations, mobile

---

## Open questions (to answer as we build)

- [ ] What does a "node" represent exactly — a track, an artist, a vibe cluster?
- [ ] How does Woody handle tracks you can't play (licensing gaps between Spotify + YouTube)?
- [ ] What's the minimum signal needed during listening to keep the model learning?
- [ ] Mobile app (React Native) vs progressive web app — which first?
- [ ] How do we store and replay "taste memory" across sessions?

---

## Build log

| Date | What we built | Why |
|------|--------------|-----|
| Apr 2026 | Product doc v1 | Captured vision before writing code |

---

*This is a living document. Update it every time something meaningful changes.*
