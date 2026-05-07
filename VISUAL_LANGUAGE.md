# Woody — Visual Language
*Last updated: 2026-04-28*
*Decided in dedicated visual language session. These decisions are closed unless a full visual language session is convened to reopen them.*

---

## The Direction

**Algorithmic geometric base + fluid rounded illustrative accents + responsive motion.**

Not a music app. Not a data dashboard. Something closer to scientific visualization meets hand-drawn field notes — precise geometric structures that breathe like living organisms.

The two reference worlds that define this:

**World B (the base):** Algorithmic/geometric. Vera Molnár, Sol LeWitt. Rule-based, systematic structures. Grids that warp. Lines that accumulate. Geometry that implies intelligence without decoration.

**World A (the accent):** Scientific intimacy. The hand-drawn quality of field notes, biological illustration, cosmological sketches. Not clinical — curious. Applied as overlaid rounded fluid forms: simple, beautiful, rudimentary. The organic disrupting the geometric.

These two don't fight. B gives structure. A gives life.

---

## The Aesthetic Sensibility

**Reference point:** Bold, uncluttered, confident negative space. Strong central presence. Nothing decorative that doesn't earn its place. More Berlioz album cover than music app — a striking thing with room to breathe, not a dashboard.

This means: when the geometry and figures are present, they are the *only* thing. No competing visual noise. Negative space is structural, not absence.

---

## The Acoustic Field Character

The acoustic field is a living geometric organism with a permanent metabolic floor.

**What it is:**
- Rule-based geometric structures that respond to acoustic coordinates in real-time
- **Pixelated human figures** embedded in and moving through the geometric field — dancing, drifting, running. The figures are the human element inside the systematic structure. This is Woody's visual signature: precise *and* deeply human.
- Fluid rounded forms overlaid onto the geometric base — they expand, contract, drift
- The whole thing has a **baseline pulse** (constant average rhythm) that music shapes — it never drops dead. High energy compresses the pulse cycle. Sacred extends and radiates it. Warm acoustic state makes it fluid. The trance of squares pulsating is the high-density low-energy acoustic state — you land there by listening to the right thing, not by switching modes.
- Not a waveform. Not a spectrum analyzer. Not a visualizer bolted onto a player. The field IS the now-playing experience.

**How acoustic coordinates drive the visual:**

| Dimension | Visual expression |
|-----------|-------------------|
| Energy | Pulse rate / geometry transformation speed |
| Warmth | Glow intensity / amber warmth flooding the field |
| Density | Layering complexity / how many geometric structures are active |
| Organicity | Balance of geometric vs fluid rounded forms (more organic = more A-world illustration) |
| Sacred | Stillness and expansion — high sacred = geometry that radiates outward, slower, more spacious |

**What it feels like:**
Low energy, high warmth: slow golden breathing, few layers, soft forms drifting.
High energy, low warmth: fast sharp geometric shifts, dense layering, teal-cobalt palette.
High sacred regardless of energy: radiating, expanding, space between elements increases.

**What it never is:**
- Reactive EQ bars
- Pulsing logo or waveform
- Generic particle systems
- Anything that could be the default visualizer in any other app

---

## The Shareable Artifact Style

**Algorithmically generated from session data. Recognizable layout. Unique graphic texture.**

The layout is the language — every Woody artifact is instantly identifiable:
- Acoustic arc: the path through coordinate space over time, rendered as a curve
- Coordinate field: the 2D space (energy × warmth primary axes visible)
- Time axis: session duration, implicit in the arc length
- Thin annotation marks for notable moments (energy peaks, warmth shifts, arc waypoints)

The graphic texture is unique to each session:
- The geometric structures generated during the session seed the artifact's visual field
- Two people with similar arcs have similar shapes but different textures — like two journeys on the same route in different weather
- The fluid rounded illustrative forms (World A accent) appear as organic shapes bordering or threading through the arc geometry

**Typography on artifacts:**
- Session name (or auto-generated acoustic description) in Syne, 600 weight, small
- Coordinate labels in Space Mono — the data is legible without dominating
- No timestamps, no track lists, no clutter

**Result:** Every artifact looks unmistakably like a Woody artifact. No two are identical. The arc is legible. The geometry makes you want to know what the session felt like.

---

## Motion Language

**Metabolic floor + data modulation. The field is always alive. Music shapes how alive.**

**The core rule:** The field has a constant baseline rhythm — a resting heartbeat it never drops below. Acoustic coordinates then modulate that baseline upward: faster, sharper, more complex, or more expansive. The motion never flatlines. Purely data-driven motion with no floor produces weird, dead moments at acoustic transitions — the metabolic floor prevents this.

Pixelated figures respond to the same data as the geometry — moving in sync with the field's state, not separately.

| Acoustic state | Motion character |
|----------------|-----------------|
| High energy | Faster geometry shifts, sharper transitions, more concurrent movement |
| Low energy | Slow expansion, minimal concurrent movement, long eases |
| High warmth | Fluid, smooth — curves dominate the motion path |
| Low warmth / cold | Snappier, more angular — geometry can step rather than flow |
| High density | Multiple elements moving simultaneously, layered motion |
| Low density | Single element focus, motion has space around it |
| High sacred | Radiating outward, increasing stillness between pulses, almost freeze-frames |

**Transitions:**
- State changes are acoustic events, not UI events. When the acoustic coordinates shift, the field registers it — not instantly, with a momentum that matches the rate of change.
- Intent input → field update: the geometry reconfigures itself over 2–4 seconds, responding to the new acoustic target. Not a hard cut.
- Track changes within a session: the field breathes through the transition, the arc horizon line adjusts.

**What breathing means specifically:**
The fluid rounded forms (World A accent elements) have a baseline respiration cycle tied to tempo. Fast tempo = shorter breath cycle. Slow tempo = longer. But the character of the breath (expansive vs tight, smooth vs irregular) comes from warmth and sacred values. High warmth + high sacred = full, expansive breathing. Low warmth = tighter, more contained.

**What motion never does:**
- Drops dead at an acoustic transition (metabolic floor prevents this)
- Loops at a fixed rate regardless of content (floor is a minimum, not a fixed rate)
- Plays a generic "loading" or "idle" animation when music is active
- Moves faster or slower because of a button press (unless that's a spatial nudge)

---

## Color System

Built on the existing tokens, with usage rules:

```css
--void: #0a0a0f        /* Base background — always present */
--teal: #00e5c4        /* Primary accent — territory, saved, primary actions */
--cobalt: #4455ff      /* Secondary accent — cold acoustic states, energy-high-warmth-low */
--moon: #f0ede6        /* Primary text — all readable content */
--amber: #f0a040       /* Recommendations, warm acoustic states, highlight moments */
```

**Acoustic color mapping:**
- High warmth pushes the field toward amber warmth — the void softens
- High energy + low warmth pushes toward cobalt — cold, electric, intense
- High sacred: the field desaturates slightly, geometry takes on a luminous quality rather than a colored one
- Territory (your saved sessions/tracks): always teal — this is your space

**Grain overlay:** Always present. The grain is structural, not decorative. It prevents the geometric elements from feeling too digital or cold. It also gives the fluid rounded forms texture.

**Borders:** 10% moon opacity (`rgba(240, 237, 230, 0.1)`). Subtle enough to structure without separating.

---

## Typography Rules

| Use | Font | Weight | Style |
|-----|------|--------|-------|
| Headings, session names | Syne | 800/700 | All caps when large, mixed case when small |
| Body, descriptions, intent text | Epilogue | 300/400 | Comfortable reading weight |
| Data, coordinates, timing | Space Mono | 400 | The numbers are always monospace |
| Acoustic dimension labels | Space Mono | 400 | Small caps or all lowercase |

The mix of Syne's geometric weight, Epilogue's warmth, and Space Mono's precision mirrors the visual language itself: structured base, organic accent, legible data.

---

## What This Visual Language Is Not

Decisions made to eliminate confusion:

- **Not dark glassmorphism.** No frosted blur cards. No transparency stacking. Void is void — opaque and deep.
- **Not neon/synthwave.** Teal and cobalt are precise, not decorative. No glow for glow's sake.
- **Not generative noise/lava lamp.** The geometry is rule-based and intentional, not random.
- **Not the default Spotify/Apple Music aesthetic.** Album art is not the hero. The acoustic field is the hero.
- **Not geometric-only.** The fluid rounded illustrative forms (World A) are required. Pure Vera Molnár without them reads as cold and academic.
- **Not illustration-only.** The geometric base (World B) must anchor it. Pure illustration without the structure reads as too soft, too approachable, not distinctive.

---

## Open Questions (Not Blocked, But Unresolved)

These don't block the visual language — they need resolution before full UI build:

1. **Pixel/custom art for artifacts:** User flagged pixelated or custom animated art style for shareable artifacts as on the table. Not decided. Needs a small exploration session with actual examples.

2. **Illustrated form library:** The fluid rounded forms (World A accents) need to be designed as a small, defined library — 8–12 shapes that recur and combine. This gives recognizability without repetitiveness. Not done yet.

3. **Dark vs. near-dark backgrounds:** Void is #0a0a0f. Some surfaces (cards, panels) may need a slightly lifted background. The specific lifted value (e.g., #111118) needs to be set when building the design system proper.

---

## Integration with Design System

The `woody-design-system.html` file holds the living design system. Visual language decisions are the foundation for:
- Updated acoustic field renderer (responsiveness to acoustic coordinates)
- Artifact generation component
- Color system expansion beyond tokens
- Motion easing curves derived from acoustic state
- Typography specimen pages

When the full UI build session begins, visual language document is canonical. Design system inherits from here.
