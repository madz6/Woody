# Woody — Design Brief for Claude Design
**Version:** 1.0 | Hand this entire document to Claude Design as project context.

---

## What Woody Is (Read This First)

Woody is a personal music intelligence system. Not a playlist app. Not a recommendation engine. A system that understands what you mean when you describe a feeling, and finds music that matches it — acoustically, not algorithmically.

The core interaction is one text input. You describe a vibe in natural language. Woody maps it onto a living 3D globe — a terrain of your taste — and surfaces tracks as glowing nodes on that globe. There are no categories, no genre filters, no stars, no social features.

The product learns over time — not what you listened to, but what your words mean to you acoustically. "Dark" means something specific to each person. Woody learns your version.

**The product thesis in one sentence:**
> Spotify knows what people-like-you listen to. Woody knows what *you* mean.

---

## The One Design Sentence

> Woody should feel like a **living terrain of taste** — grounded, warm, and quietly intelligent. It changes personality without losing identity.

Every single design decision gets tested against this sentence. If a component doesn't feel like it belongs in a living terrain, it's wrong.

---

## Feeling Descriptors

### Must feel:
- **Grounded** — not floating in space. The globe has gravity. The UI has weight.
- **Alive** — not static. Things breathe, drift, settle. But never jitter.
- **Warm dark** — not cold dark. The blacks have earth tones baked in.
- **Premium and considered** — not overdesigned. Restraint is the signal of quality here.
- **Emotionally porous** — the same UI holds jazz, prayer, drill, and folk without breaking character.
- **Authored** — feels like a person made it, not a template.

### Must never feel:
- Sci-fi / space / neon
- Generic dark mode SaaS
- Spotify clone (avoid their card-based layout, their green, their list metaphors)
- Blob startup (no gradient blobs as background design elements)
- Over-animated or anxious
- Cold or clinical
- Gamified (no points, streaks, badges, levels)

---

## Reference Aesthetics — Study These

### The primary references (most important):
- **Björk's Biophilia app (2011)** — each song is a navigable universe with its own physics. The closest precedent. Look it up. This is the spiritual ancestor of Woody.
- **Endel** — adaptive audio environment where the UI disappears into the experience. Study how they handle absence.
- **Mapbox dark maps** — how darkness becomes depth, not emptiness. How named territories float in unnamed space.
- **Linear (linear.app)** — restraint as premium signal. Spacing, type weight, zero noise. The dark surfaces.
- **Vercel dark mode** — soil-adjacent blacks, not blue-black. Learn the difference.

### Secondary references:
- **Topographic maps** — territory, elevation, named places surrounded by unnamed ones
- **Google Earth night view** — lit cities in vast dark territory. Your taste = the lit cities.
- **Nervous System studio (nervousystem.com)** — generative forms that feel natural, never random
- **Raycast** — command palette energy. Everything fast, considered.
- **Arc Browser** — personality without clutter. UI that steps back.
- **Lusion studio (lusion.co)** — WebGL that feels physical and grounded

### What NOT to reference:
- Spotify (any version)
- Apple Music
- Any music app with a "Now Playing" card
- Dark mode dashboards
- Anything with a sidebar navigation

---

## Color System — Use Exact Values

### Layer 1 — Base environment (always present)
These are not black. They are dark earth tones with warmth.

```
bg-soil:        #0F0F0D   Primary background — soil black
bg-moss:        #171713   Elevated surface — charred moss
bg-bark:        #1E1B18   Cards, inputs — deep bark
bg-bark-light:  #2A2520   Hover states, active surfaces
```

Pure `#000000` is forbidden. Blue-black (`#0D0D14` type values) is forbidden. These must be warm earth.

### Layer 2 — Accent colors (used sparingly — dots, glows, borders only. Never fills.)
```
accent-violet:  #7C6BCE   Nocturnal, introspective, mellow sessions
accent-amber:   #C4874A   Energetic, warm, forward-moving sessions
accent-moss:    #4E6B45   Earthy, grounded, acoustic, organic sessions
accent-rose:    #8C5C5C   Emotional, stretched, unresolved sessions
```

Rule: accents appear at 60–80% opacity maximum. Never at full saturation as fills.

### Layer 3 — Text hierarchy
```
text-hi:   #E8E4DC   Primary — warm off-white, never pure white
text-mid:  #8A8680   Secondary — muted, readable
text-lo:   #4A4844   Tertiary — barely there, metadata
```

### Layer 4 — Session palette (dynamic — shifts with listening context)
The entire UI color temperature should shift based on what the user is listening to. This is not branding — it is state. Implement by setting `data-palette` attribute on `<html>`.

| Mood territory | Atmosphere |
|---|---|
| Nocturnal / introspective / dark | deep violet-black, muted indigo wash |
| Energetic / warm / forward | amber-forward, tighter geometry, slight warmth boost |
| Earthy / acoustic / folk | clay, bark, muted bronze wash |
| Jazz / smoky / nocturnal | burgundy-black, brass, midnight indigo |
| Electronic / synthetic / glossy | electric violet, chrome blue hints |
| Ambient / dreamlike | grey-blue haze, faded violet wash |

---

## Typography System

### Typefaces
```
Primary sans:   Inter (Google Fonts)
                Use for: ALL UI, controls, metadata, navigation, labels
                Never use Lora for anything interactive

Accent serif:   Lora (Google Fonts), italic preferred
                Use ONLY for: save point names, session titles,
                empty state poetry, the "name this moment" prompt
                Never use for navigation, buttons, or controls
```

### Scale
```
display:      32–36px  Lora italic     Save point name, major serif moments
heading/lg:   24px     Inter 500       Section headers (extremely rare)
heading/md:   18px     Inter 500       Track names in expanded state
body/md:      14–15px  Inter 400       Primary reading text
body/sm:      13px     Inter 400       Secondary content
meta/sm:      11–12px  Inter 400       Artist names, timestamps, labels
label:        10px     Inter 400       ALL CAPS, +0.1em tracking — status labels
```

### Rules
- No heading hierarchy in the map/player view — the node IS the heading
- Never over-kern body text. Labels get +0.08–0.12em. Body gets 0.
- Line height: 1.3 for headings, 1.5–1.6 for body.
- Serif Lora should appear in maximum 2–3 places per screen. It's a signal of importance, not a style.

---

## Shape System

### Core shapes
```
Nodes:        Soft spheres (3D globe) or circles (2D fallback)
              The atomic unit. Every track is a node.

Territories:  Large, extremely blurred washes
              Opacity 3–8% max. No hard edges. Ever.

Contour lines: Thin, very low opacity rings or paths
               Suggest depth and elevation. Never decorative.

Capsules:     Rounded rectangles — input bars, player bar, pills
              Border radius: 12–18px. Never sharp corners anywhere.
```

### Shape behaviour
- Shapes have **mass** — they settle, they don't bounce
- Shapes have **magnetism** — nodes drift toward each other slightly when idle
- Shapes have **memory** — visited/known nodes are more defined than unvisited ones
- Never: jitter, bounce, elastic snap, spring physics

---

## Motion System

### Motion types

**Breathing** (nodes, globe elements)
- Scale: 0.98 → 1.04
- Duration: 3–5s (varies with track BPM — faster BPM = slightly faster breathing)
- Easing: cubic-bezier(0.4, 0, 0.6, 1) — slow in, slow out
- Every element has a unique phase offset — nothing pulses in sync

**Drift** (background washes, idle nodes)
- Translation: 4–12px range, 6–12s cycle
- Easing: ease-in-out
- Feel: alive but not anxious

**Settling** (on selection, on save)
- Scale down slightly, opacity increase
- Duration: 400–600ms, ease-out
- Feel: landing, not snapping

**Mood transition** (session palette shift)
- Duration: 1.5–3s gradual crossfade
- Never abrupt. Feel like a temperature change.

**Orbit** (currently playing node only)
- A faint ring rotating around the active node
- 10–14s full rotation, opacity 0.2–0.3
- This is the only circular motion in the product

### Timing
```
Micro (hover, tap):     150–250ms
Interaction (select):   300–500ms
State change:           500–800ms
Atmosphere shift:       1500–3000ms
Ambient (breathe/drift): 5000ms+
```

### Easing vocabulary
- Never linear. Never sharp cubic-bezier.
- Default: `cubic-bezier(0.4, 0, 0.2, 1)`
- Settle: `cubic-bezier(0, 0, 0.2, 1)`
- Emerge: `cubic-bezier(0.4, 0, 1, 1)`

---

## Material System

```
Matte dark:    Primary surface — soil/bark tones, slight noise texture (2–4% opacity)
               No gloss, no shine

Soft glass:    Input bars, player bar, overlays, Portal Sheet
               backdrop-filter: blur(16–24px)
               background: rgba(#1E1B18, 0.85–0.92)
               border: 1px rgba(255,255,255, 0.05–0.08)

Node material: Small sphere with emissive glow
               Base: bg-bark-light
               Glow: accent color at 30–50% intensity
               No sharp specular highlight
```

---

## The Current UI — What Exists

The app is a Next.js/React application with a Three.js 3D WebGL globe filling the full viewport. There is one screen.

### What's currently on screen:
1. **The Globe** — full-viewport 3D WebGL sphere. Tracks appear as glowing nodes. Sessions generate territory washes.
2. **Intent Input Bar** — fixed bottom, full width. Capsule shape. Placeholder rotates through poetic prompts. This is the primary interaction.
3. **MiniPlayer Bar** — fixed, sits above the intent input when a track is playing. Album art left, play/pause center, save right.
4. **Session Queue Panel** — slide-up panel showing the current session's track order with Camelot key compatibility indicators. Triggered by a button.
5. **Save Point Modal** — centered overlay for naming and saving a "moment" in the session.
6. **Save Points Browser** — slide-up overlay listing saved moments. Currently buried as hidden state.
7. **SpotifyLoginNav** — small connect button, top right, when not authenticated.

### What's broken about the current UI (from the design critique):
1. **No secondary navigation** — there is no way to reach Account, Settings, or Saved Moments without knowing hidden button states exist.
2. **Saved Moments is buried** — the most emotionally significant feature is inaccessible.
3. **No onboarding** — a new user sees a dark globe and a text input. Nothing else.
4. **No listening context UI** — the system learns differently when you're running vs. stationary, but there's zero UI for this.
5. **Session palette implemented but not wired** — the UI should shift color temperature with the session mood. Currently static.
6. **Intent input and player compete** — when music is playing, both the player and input bar are visible simultaneously, creating visual hierarchy confusion.

---

## New Patterns to Design (The Key Brief)

These are the new UI patterns that need to be designed. They don't exist yet.

---

### Pattern 1 — The Halo (secondary navigation portal)

**What it is:** A single, always-present glyph in the top-right corner of the screen. 36px soft circle, soil-colored background, faint accent glow. Contains one icon — something between a half-moon and a terrain glyph. It's a door, not a nav bar.

**What it does:** Opens the Portal Sheet (below).

**Rules:**
- Always visible. Never hides.
- Never a hamburger menu icon. Never text. Always a single considered glyph.
- Subtle — it should feel ambient, not demanding attention.
- When the Portal Sheet is open, the Halo transforms into a close gesture.

**States to design:**
- Default (closed)
- Hover
- Active / portal open

---

### Pattern 2 — The Portal Sheet

**What it is:** A bottom sheet that slides up from the Halo tap. 60–70vh tall. Soft glass material (heavy backdrop blur). It's the only secondary surface in the app.

**What it contains (top to bottom):**
1. **Account section** — Spotify avatar, username, "Connected" status with green dot (or "Connect Spotify" CTA). A small disconnect link.
2. **Body state toggle** — A single toggle: `settled` / `moving`. Two states, not four modes. This affects how Woody learns from listening. When moving, it learns more slowly. Label should be poetic, not technical: "I'm settled" / "I'm on the move" or similar.
3. **Saved Moments** — A horizontal scroll of saved moment cards. Each card: the moment name in Lora italic, the intent phrase below in text-mid, a single ambient node dot in the session's tone color. Tapping a card enters that territory.
4. **Acoustic intelligence status** — A single small dot (green/amber/grey) with a one-line label: "acoustic analysis active" / "estimating" / "unavailable". No technical details.
5. **Settings** — Minimal. Only decisions that affect the listening experience. Not app preferences. Currently: nothing else needed.

**Rules:**
- The globe is still visible behind it (glass material, not opaque overlay)
- No close button — tap outside or swipe down to close
- No scrolling within the sheet unless content requires it
- No list items — the content is panels and toggles, not a settings menu

---

### Pattern 3 — Intent Input ↔ Player Morph

**What it is:** The intent input bar and the MiniPlayer bar should morph into each other, not stack.

**States:**
- **Idle state** — Intent input is full width, fully visible, large. Player bar is invisible (not just hidden — gone from layout).
- **Playing state** — Player bar is full width, fully visible. Intent input contracts to a small "shift vibe" pill button at the bottom right of the player bar. It's still tappable — tapping it expands back to the full intent input while pausing the player visually (not stopping playback).
- **Transitioning** — Framer Motion layout animation. The input bar smoothly morphs its shape into the player bar as soon as a track starts playing. Reverse on stop.

**Rules:**
- Never stack. One or the other is primary.
- The morph should feel organic, not like a slide-in/slide-out.
- The "shift vibe" pill in playing state should still feel like an invitation, not a button.

---

### Pattern 4 — Saved Moments Surface (within Portal Sheet)

**What it is:** The proper room for saved sessions. Accessible from the Portal Sheet (see Pattern 2). Can also expand to a full-screen detail view.

**Card design for the horizontal scroll:**
- Size: approximately 160px × 120px
- Background: bg-bark, very slight node glow in the session tone color
- Content: moment name in Lora italic (16px), intent phrase in text-mid (12px), creation date in text-lo (10px)
- One ambient node dot — breathing slowly
- Tapping: enters full-screen detail view

**Full-screen detail view:**
- Full-screen overlay, soil 96% opacity
- The moment name in Lora italic at 32px — centered, top third of screen
- The original intent phrase in text-mid, smaller, below
- Horizontal scroll of tracks from that session as nodes (not cards, not a list — nodes)
- Single CTA at the bottom: "Return to this territory" — in Inter, not bold, quiet

**Rules:**
- This is a memory palace, not a playlist manager. No edit button. No reorder. No share.
- The serif is the star here. Everything else recedes.
- The nodes in the horizontal scroll should breathe slowly.

---

### Pattern 5 — Onboarding (3 Moments)

Three screens, no carousel dots, no skip button, no feature explanations.

**Moment 1 — The Ask**
- Full screen, soil background
- Lora italic, centered: *"connect spotify to begin"*
- One button below: "Connect Spotify" (matte capsule, text-hi)
- Nothing else. No feature list. No screenshots.

**Moment 2 — The Reveal**
- After Spotify connects, the globe fades in over 2–3 seconds
- The intent input appears at the bottom with a specific first-run placeholder (different from the rotating prompts): *"describe a vibe — any vibe. we do the rest."*
- One single pulsing node in the center of the globe (animated, alive, waiting)
- No other UI elements on screen

**Moment 3 — The Teaching (inline, not a screen)**
- After the user's first intent returns suggestions, one ambient tooltip fades in over 3 seconds
- It says: *"these are your tracks. tap to play. hold to go deeper."*
- It fades out automatically after 6 seconds
- It never appears again

---

## Screen / Surface Inventory

Design wireframes for all of the following, in this order:

### Priority 1 — Core screens (wireframe + hi-fi)
1. **Home — Idle** (no intent yet, globe empty, intent input prominent)
2. **Home — Active** (tracks on globe as nodes, intent input still visible)
3. **Home — Playing** (MiniPlayer morphed in, intent input contracted to "shift vibe" pill)
4. **Portal Sheet — Open** (all sections: account, body state, saved moments, acoustic status)
5. **Onboarding — Moment 1** (The Ask)
6. **Onboarding — Moment 2** (The Reveal)

### Priority 2 — Component states (hi-fi)
7. **Node — 5 states** (default, hover, playing, visited/known, saving)
8. **Intent Input Bar — 2 states** (idle/focused, contracted pill in playing mode)
9. **MiniPlayer Bar — playing state** with shift-vibe pill
10. **Portal Sheet — body state toggle** (settled / moving)
11. **Saved Moments card** (in horizontal scroll)
12. **Saved Moments detail view** (full-screen)
13. **Halo glyph — 3 states** (default, hover, open)

### Priority 3 — Motion specs (annotations only, no need for full hi-fi)
14. **Intent input → Player morph animation** (2 keyframes + timing spec)
15. **Node breathing animation** (idle state, playing state)
16. **Session palette transition** (before/after for 2 different mood territories)
17. **Portal Sheet enter/exit** (slide-up from bottom)

---

## Component Catalogue — What Already Exists

Do not redesign these from scratch — adapt them:

| Component | Description | Status |
|---|---|---|
| Globe (WoodyMap) | Three.js 3D sphere, nodes as spheres | Built |
| Intent Input (IntentInput) | Capsule text input, rotating placeholder | Built |
| MiniPlayer | Fixed bottom bar, album art + controls | Built |
| Session Queue Panel | Slide-up, Camelot key indicators | Built |
| Save Point Modal | Centered overlay for naming a moment | Built |
| Save Points Browser | Hidden modal, needs promotion to Portal Sheet | Built (buried) |
| SpotifyLoginNav | Connect button, top corner | Built |

---

## Voice & Copy Guidelines

The words carry the brand as much as the visuals.

**Tone:** Quiet. Considered. A little poetic but never pretentious. Never exclamation marks. Never feature announcements. Never "Discover!" energy.

### Do:
- *"your territory is blank — describe a vibe to begin"*
- *"finding your territory…"*
- *"name this moment"*
- *"what you're missing"*
- *"return to this territory"*
- *"connect spotify to begin"*
- *"acoustic analysis active"*
- *"I'm settled"* / *"I'm on the move"*

### Don't:
- "Discover music!"
- "Loading..."
- "Add to queue"
- "Based on your listening"
- "No results found"
- "Now Playing"
- "Your Playlist"
- Anything with exclamation marks

**Empty states should feel like invitations:**
- No sessions: *"your territory is blank — describe a vibe to begin"*
- No tracks found: *"nothing in range — try shifting the vibe"*
- Not connected: *"connect spotify to start navigating"*
- Acoustic service offline: *"estimating"* (single word, no alarm)

---

## Anti-Patterns — What to Actively Avoid

| Pattern | Why it kills Woody |
|---|---|
| Blue-black or cool-toned backgrounds | Removes warmth, looks like every other dark app |
| Neon glow on dark backgrounds | Gaming interface energy, wrong emotion |
| Hamburger menu or sidebar nav | Navigation is the globe |
| Cards with borders for tracks | Tracks are nodes, not list items |
| "Now Playing" text label | The breathing orbit ring IS the now playing state |
| Loading spinners | Use ambient animations or skeleton states |
| Gradient fills on buttons | Buttons are matte. Gradients are for glows only. |
| Symmetrical, grid-aligned node layouts | Kills the organic territory feel |
| Sharp corners anywhere | Never. Everything has radius. |
| Drop shadows (hard) | Use glow only. Soft, emissive, never casting. |
| Alerts, modals, toasts (standard) | Use ambient in-context messaging |
| Feature-forward copy ("Try our new...") | The product teaches itself through use |
| Any visible algorithm | Never say "because you listened to X" |

---

## The Architecture Vocabulary (For Context Only)

These are the internal names for Woody's system components. You don't need to design for them directly — they inform the product philosophy.

| Name | What it is |
|---|---|
| **The Interpreter** | LLM that translates intent text → acoustic parameters |
| **The Field** | Multi-source track candidate pool (Last.fm + Spotify) |
| **The Ear** | Acoustic feature extraction from audio previews |
| **The Compass** | Acoustic scoring + ranking against personal target |
| **The Signature** | Personal acoustic taste fingerprint (per user) |
| **The Lexicon** | Per-user mapping of words → acoustic meanings |
| **The Arc** | Session queue shape + harmonic transition logic |
| **The Guild** | Validated acoustic-fingerprint-based peer population signal |

These components run invisibly. The UI's job is to make the *output* of this system feel like it came from understanding, not computation.

---

## Z-Index Mental Model (For Layout)

```
z-0    Globe (fills 100vw 100vh)
z-10   Territory washes (part of globe layer)
z-20   Map nodes and labels
z-30   MiniPlayer + Intent Input (fixed bottom, always visible)
z-40   Portal Sheet (when open)
z-50   Save Point Modal (when open)
z-60   Onboarding overlay (first-time only)
z-70   System errors / toasts (rare, ambient)
```

---

## What to Produce First

Start with these in order:

1. **Wireframes (black and white, no color):**
   - Home — 3 states (idle / active / playing)
   - Portal Sheet — open
   - Onboarding — Moment 1 and 2

2. **Validate information architecture before going hi-fi.** The question to ask at wireframe stage: can a new user understand what this surface is for in 2 seconds?

3. **Then hi-fi with the exact color tokens above.** Do not approximate — use the exact hex values.

4. **Then annotate motion.** Describe timing and easing in plain language annotations, not animations (the developers will implement in Framer Motion).

---

## Handoff Path

When designs are ready to bring back into the codebase:
- Export the design token system (colors, typography sizes, spacing) as a structured list — these will go into `tailwind.config.ts`
- For each new component (Halo, Portal Sheet, Saved Moments cards), write a component spec: dimensions, states, content hierarchy, interaction behavior
- For motion, describe: trigger, duration, easing curve, what animates
- Do NOT export CSS directly — the codebase uses Tailwind + Framer Motion

---

*This brief governs every visual decision for Woody. When in doubt, return to the one sentence at the top: "a living terrain of taste — grounded, warm, and quietly intelligent."*
