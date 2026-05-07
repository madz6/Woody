# Woody — Design System
**Version**: 0.1 | Living document

---

## The one sentence

> Woody should feel like a **living terrain of taste** — grounded, warm, and quietly intelligent. It changes personality without losing identity.

---

## Feeling descriptors

These are the words every design decision gets tested against.

**Should feel:**
- Grounded (not floating in space)
- Alive (not static UI)
- Warm dark (not cold dark)
- Premium and considered (not overdesigned)
- Emotionally porous (can hold jazz, prayer, electronic, folk without breaking character)
- Authored (like something a person made, not an algorithm)

**Should never feel:**
- Sci-fi / space / neon
- Generic dark mode SaaS
- Spotify clone
- Blob startup
- Over-animated or anxious
- Cold or clinical

---

## Influences & references

### Spatial / terrain
- **Mapbox dark maps** — how darkness becomes depth, not emptiness. Contour logic.
- **Topographic maps** — territory, elevation, named places surrounded by unnamed ones
- **Google Earth night view** — lit cities in dark territory. Your taste = the lit cities.

### Living systems
- **Nervous System studio** (nervousystem.com) — generative forms that feel natural, never random
- **Casey Reas / Processing** — code-as-material, emergent geometry
- **Refik Anadol data sculptures** — data made tangible and warm, not cold and diagrammatic

### Music interfaces done right
- **Björk's Biophilia app** (2011) — each song is a navigable universe with its own physics. The closest precedent.
- **Endel** — adaptive audio environment, the UI disappears into the experience
- **Boiler Room live streams** — the visual identity changes with every set, same brand

### Dark premium UI
- **Linear** — how restraint becomes premium. Spacing, type weight, no noise.
- **Vercel dark mode** — soil-adjacent blacks, not blue-black
- **Raycast** — command palette energy, everything is fast and considered
- **Arc Browser** — personality without clutter

### Motion / interactive
- **Lusion studio** (lusion.co) — WebGL that feels physical and grounded
- **Active Theory** — interactive work with weight and intentionality
- **Superflux** speculative design — futures that feel human

### Typography references
- **Canela** (Commercial Type) — the serif voice for save points and meaningful moments
- **Söhne** (Klim Type) — the sans backbone, warm grotesk
- **ABC Diatype** — editorial control, intelligence

---

## Colour system

### Layer 1 — Base environment (always present)
These are not black. They are dark earth tones.

```
bg/soil       #0F0F0D    Primary background — soil black
bg/moss       #171713    Elevated surface — charred moss
bg/bark       #1E1B18    Cards, inputs — deep bark
bg/bark-light #2A2520    Hover states, active surfaces
```

**Why not pure black or blue-black:** Pure black feels digital and lifeless.
Blue-black feels like every other dark-mode app. These tones have warmth baked in.

### Layer 2 — Brand accents (used sparingly, never as fills)
```
accent/violet  #7C6BCE   Mellow, nocturnal, introspective sessions
accent/amber   #C4874A   Energetic, warm, forward-moving sessions
accent/moss    #4E6B45   Earthy, grounded, acoustic, organic sessions
accent/rose    #8C5C5C   Emotional, stretched, unresolved sessions
```

Usage rule: accents appear as **dots, glows, borders, and motion cues**. Never as background fills. Never at full opacity — use at 60-80%.

### Layer 3 — Text hierarchy
```
text/hi   #E8E4DC   Primary — warm off-white, not pure white
text/mid  #8A8680   Secondary — muted, readable
text/lo   #4A4844   Tertiary — barely there, metadata
```

### Layer 4 — Reactive session palette (dynamic, applied by the map)
The UI colour temperature shifts with listening context. This is NOT branding — it is state.

| Context | Palette behaviour |
|---------|-------------------|
| Prayer / sacred / reflective | warm ivory, dusk gold, incense plum, deep umber |
| Earthy / acoustic / folk | moss, clay, bark, muted bronze |
| Jazz / smoky / nocturnal | burgundy-black, brass, midnight indigo |
| Glossy / electronic / synthetic | electric violet, chrome blue, liquid silver |
| Ambient / dreamlike | grey-blue haze, faded violet, soft orchid |
| High energy / hype | amber-forward, warmer, tighter geometry |

---

## Typography system

### Pairing principle
**Sans = the system backbone. Serif = the moment matters.**
Type should be more stable than everything else. The map moves. The shapes move. Type is the anchor.

### Typefaces
```
Primary sans:   Inter (loaded via next/font/google)
                — open counters, gentle curves, stable numerics
                — use for all UI, controls, metadata, navigation

Accent serif:   Lora (loaded via next/font/google)
                — use ONLY for: save point names, session titles,
                  empty state poetry, the "name this moment" prompt
                — italic variant preferred
                — never for navigation or controls
```

### Scale
```
display        32–36px  Lora italic   Save point name, major serif moments
heading/lg     24px     Inter 500     Section headers (rare)
heading/md     18px     Inter 500     Track names in expanded state
body/md        14–15px  Inter 400     Primary reading text
body/sm        13px     Inter 400     Secondary content
meta/sm        11–12px  Inter 400     Artist names, timestamps, labels
label          10px     Inter 400     ALL CAPS, +0.1em tracking — status labels
```

### Rules
- No heading hierarchy in the player view — the node IS the heading
- Tracking: labels get +0.08–0.12em. Body gets 0. Don't over-kern.
- Line height: 1.3 for headings, 1.5–1.6 for body
- Never use serif for anything interactive

---

## Shape system

### Core principle
**Shapes are territories, not decorations.**

### Primary shapes
```
Nodes          Soft spheres (3D) or circles (2D)
               — the core unit, everything is a node or cluster
               
Territories    Large, extremely blurred washes
               — define regions, never have hard edges
               — opacity 3–8% maximum
               
Contour lines  Thin, very low opacity rings or paths
               — suggest elevation and distance
               — never decorative
               
Capsules       Rounded rectangles for input, player bar
               — corners: 12–18px radius
               — never sharp corners anywhere in the product
```

### Shape behaviour rules
- Shapes have **mass** — they settle, they don't bounce
- Shapes have **magnetism** — nodes drift toward each other slightly
- Shapes have **memory** — visited nodes are more defined than unvisited
- Never jitter, never bounce, never elastic snap

### What NOT to do with shapes
- No hard drop shadows (use glow only)
- No gradients as fills on interactive elements (glow halos only)
- No decorative geometric patterns
- No sharp edges anywhere

---

## Motion system

### Philosophy
**Motion is interpretation, not decoration.**
Every animation should carry meaning about state, not just make things look nice.

### Motion types

**Breathing** (nodes, map elements)
```
Scale: 0.98 → 1.04
Duration: 3–5s
Easing: cubic-bezier(0.4, 0, 0.6, 1) — slow in, slow out
Use: all living elements when idle
Rate tied to: track BPM (faster track = slightly faster breathing)
```

**Drift** (background territories, idle nodes)
```
Translation: 4–12px range
Duration: 6–12s
Easing: ease-in-out
Use: anything "alive" that isn't being interacted with
Phase: stagger each element's drift cycle
```

**Settling** (on selection, on save)
```
Transition: scale down slightly, opacity increase
Duration: 400–600ms
Easing: ease-out
Feel: like something landing, not snapping
```

**Mood transition** (colour/atmosphere change)
```
Duration: 1.5–3s
Type: gradual opacity crossfade between colour states
Never: abrupt swap
Feel: temperature change, not mode switch
```

**Orbit** (currently playing node)
```
A faint ring orbiting the active node
Duration: 10–14s full rotation
Opacity: 0.2–0.3
This is the only circular motion — everything else drifts
```

### Timing system
```
Micro (hover, tap response):   150–250ms
Interaction (selection, play): 300–500ms
State change (mode switch):    500–800ms
Atmosphere (mood shift):       1500–3000ms
Ambient (drift, breathe):      5000ms+
```

### Easing vocabulary
- **Never use** linear or sharp cubic-bezier for visible animations
- **Default:** `cubic-bezier(0.4, 0, 0.2, 1)` — Material's standard, feels physical
- **Settle:** `cubic-bezier(0, 0, 0.2, 1)` — fast in, slow settle
- **Emerge:** `cubic-bezier(0.4, 0, 1, 1)` — slow start, accelerate out

### Motion rules
- Ambient mode: everything slows by ~60%, contrast reduces
- Active mode: tighter response, more defined movement
- No animation should demand attention — if you notice it's animating, it's too much
- Every element has a unique animation phase offset so nothing pulses in sync

---

## Material system

### Base surfaces
```
Matte dark      Primary surface material — soil/bark tones
                Slight noise texture (opacity 2–4%) to feel physical
                No gloss, no shine

Soft glass      Input bars, player bar, overlays
                backdrop-filter: blur(16–24px)
                background: rgba(bark, 0.85–0.92)
                border: 1px rgba(white, 0.05–0.08)

Node material   Small sphere with emissive glow
                Base: bark-light
                Emissive: accent colour at 30–50% intensity
                No sharp specular highlight
```

### Metallic / reflective — used with extreme discipline
```
WHERE it works:
- Subtle highlight on the top edge of an active node
- Inner gradient shift on the currently-playing sphere
- Chrome/liquid-metal hints in marketing (not product UI)

WHERE it doesn't:
- Full chrome logo
- Background surfaces
- Anything that makes a quiet, earthy session feel fake
```

**Rule: metal = signal of interaction, not identity**

---

## Component catalogue

### Node (core unit)
The atomic element of the whole product.

```
Sizes:
  Known node (played):      r=0.035 (3D) / 28–32px (2D)
  Suggested node:           r=0.025 / 20–24px
  Unknown/territory:        r=0.015 / 12–16px
  Save point:               r=0.04  / 36–40px (slightly larger, permanent)

States:
  Default      Matte fill, faint glow matching tone colour
  Hover        Scale 1.08, glow increases, label appears
  Playing      Breathing animation + orbit ring + stronger glow
  Visited      Full opacity, defined border
  Unknown      60% opacity, no border, ghost-like
  Saving       Everything slows, amber tone, halo expands

Tone → colour mapping:
  violet  →  #7C6BCE  Nocturnal, introspective, mellow
  amber   →  #C4874A  Energetic, warm, forward
  moss    →  #4E6B45  Earthy, grounded, acoustic
  rose    →  #8C5C5C  Emotional, stretched, unresolved
```

### Intent input bar
```
Background:   bg/bark + soft glass (backdrop blur)
Border:       1px rgba(white, 0.06), focus → 0.12
Border radius: 14–16px
Padding:      14px 16px
Font:         Inter 14px, text/hi
Placeholder:  text/lo, italic

Feel: a quiet place to speak, not a search box
```

### Mini player bar
```
Position:     Fixed, bottom of screen, above intent input
Background:   bg/bark + heavy glass blur
Border-top:   1px rgba(white, 0.05)
Height:       60–64px
Layout:       track info left, play/pause center, save right

Animation:    slides up from off-screen when track starts
              slides down when nothing playing
```

### Save point modal
```
Background:   bg/soil at 92% opacity (everything dims behind it)
Layout:       centered, vertically stacked
Node:         amber tone, breathing slowed to ~7s cycle, halo ring
Typography:   Lora italic for prompt text ("name this moment")
              Inter regular for input fields
Transition:   everything slows when this opens (ambient mode signals)

Feel: a ritual, not a form. The moment the product becomes memory.
```

### Territory wash (map background)
```
Shape:        Large ellipse, heavily blurred (blur: 60–100px)
Opacity:      3–8% maximum
Colours:      tone accents at very low saturation
Animation:    slow drift, 15–25s cycle
Count:        2–4 per view, never more
```

---

## Layout principles

### The stack (z-index mental model)
```
z-0   Map / globe (fills 100vw 100vh, pointer-events for globe interaction)
z-10  Territory washes (part of the map layer)
z-20  Map nodes and labels
z-30  Player bar + intent input (fixed bottom, always visible)
z-40  Save point modal (when open)
z-50  System errors / toasts (rare)
```

### Spacing
4pt base grid: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`

### Mobile layout
```
Full screen map, no chrome
Intent input: bottom 0, full width, px-5 padding
Player bar: bottom 72px (above intent)
Header: top 48–52px (status bar clearance), minimal
```

### Rules
- No navigation bar — the map IS navigation
- No grid layout for nodes — they float in space
- No cards for tracks once map is live — tracks live on the map
- Maximum density: 4 suggestions at once, never more on home

---

## Voice & copy

The words in the product carry the brand as much as visuals.

**Tone:** Quiet. Considered. A little poetic but never pretentious.

```
DO:   "Tonight"  /  "finding your territory…"  /  "name this moment"
      "what you're missing"  /  "anchor to map"  /  "continue where you left off"

DON'T: "Discover music!"  /  "Loading..."  /  "Add to queue"
       "Based on your listening"  /  "No results found"
```

**Empty states** should feel like an invitation, not an error:
```
No sessions yet:     "your territory is blank — describe a vibe to begin"
No tracks found:     "nothing in range — try shifting the vibe"
Not connected:       "connect spotify to start navigating"
```

---

## Anti-patterns (what to actively avoid)

| Pattern | Why it kills Woody |
|---------|-------------------|
| Blue-black background | Feels like every other dark app, removes warmth |
| Neon glow on dark | Looks like a gaming interface, wrong emotion |
| Heavy drop shadows | Too material-design, too 2015 |
| Symmetrical node layouts | Kills the organic territory feel |
| Progress bars that look like bars | Use thin lines, not chunky progress indicators |
| Hamburger menus / nav bars | Navigation is the map |
| Cards with borders for tracks | Tracks are nodes on the map, not list items |
| "Now Playing" text label | The breathing node IS the now playing state |
| Gradient fills on buttons | Buttons are matte. Gradients are for glows only. |
| Loading spinners | Use ambient animations or subtle skeleton states |

---

## Figma implementation notes

When building components in Figma:

1. **Colour styles** — use the exact hex values above, named exactly as shown
2. **Typography styles** — Inter and Lora only, at the sizes above
3. **Node component** — build with variants: Default / Hover / Playing / Unknown / Saving
4. **Never use % opacity on text** — use the exact text colour tokens
5. **Auto layout spacing** — always multiples of 4
6. **Effect styles** — define glow effects as Figma styles so they're consistent:
   - Node glow: `0 0 12px [accent colour at 40%]`
   - Player bar blur: `backdrop-filter blur(20px)`

---

*This document governs every visual and motion decision in Woody. When in doubt, return to the one sentence at the top.*
