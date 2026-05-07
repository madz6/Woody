# Woody — Design Tokens
**Hard visual constraints. Use exact values.**

---

## Color

### Backgrounds (warm earth tones — not black, not blue-black)
```
bg-soil:        #0F0F0D   Primary background
bg-moss:        #171713   Elevated surface
bg-bark:        #1E1B18   Cards, inputs
bg-bark-light:  #2A2520   Hover, active surfaces
```

### Accents (dots, glows, borders only — never fills, max 60–80% opacity)
```
accent-violet:  #7C6BCE   Nocturnal / introspective / mellow
accent-amber:   #C4874A   Energetic / warm / forward
accent-moss:    #4E6B45   Earthy / grounded / acoustic
accent-rose:    #8C5C5C   Emotional / stretched / unresolved
```

### Text
```
text-hi:   #E8E4DC   Primary (warm off-white — never pure white)
text-mid:  #8A8680   Secondary
text-lo:   #4A4844   Tertiary / metadata
```

### Session palette (dynamic — shifts with listening mood)
Applied as `data-palette` on the document root. Subtle temperature shifts only.
```
data-palette="dark-violet"   nocturnal, introspective sessions
data-palette="warm-amber"    energetic, forward-moving sessions
data-palette="cool-moss"     earthy, acoustic, grounded sessions
data-palette="neutral"       default / no session active
```

---

## Typography

### Typefaces
```
Inter    — all UI, labels, controls, metadata (Google Fonts)
Lora     — emotionally significant moments only: save point names,
           session titles, empty state poetry (Google Fonts, italic preferred)
```

### Scale
```
32–36px   Lora italic     Save point names, major serif moments
24px      Inter 500       Section headers (extremely rare)
18px      Inter 500       Track names in expanded state
14–15px   Inter 400       Primary body text
13px      Inter 400       Secondary content
11–12px   Inter 400       Artist names, timestamps, labels
10px      Inter 400       Status labels (ALL CAPS, +0.1em tracking)
```

### Rules
- Never use Lora for anything interactive
- Lora maximum 2–3 instances per screen
- Body text: line-height 1.5–1.6
- Headings: line-height 1.3
- Labels: +0.08–0.12em letter-spacing

---

## Spacing

4pt base grid:
```
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px
```

---

## Shape

```
Capsules / inputs / bars:    border-radius 12–18px
Nodes (2D):                  circles only
Overlays / sheets:           border-radius 16–20px on top corners
Sharp corners:               never
```

---

## Material

### Soft glass (inputs, player bar, overlays, secondary surfaces)
```
background:       rgba(#1E1B18, 0.85–0.92)
backdrop-filter:  blur(16–24px)
border:           1px rgba(255,255,255, 0.05–0.08)
```

### Matte dark (primary surfaces)
```
background:       bg-soil or bg-bark tones
texture:          very slight noise (2–4% opacity) — optional, for physicality
no gloss, no shine
```

### Node glow
```
box-shadow / filter:  0 0 12px [accent color at 40%]
no hard drop shadows anywhere
```

---

## Motion

### Timing
```
Micro (hover, tap response):    150–250ms
Interaction (select, play):     300–500ms
State change (mode switch):     500–800ms
Atmosphere (mood / palette):    1500–3000ms
Ambient (breathing, drifting):  5000ms+
```

### Easing
```
Default:   cubic-bezier(0.4, 0, 0.2, 1)
Settle:    cubic-bezier(0, 0, 0.2, 1)   fast in, slow settle
Emerge:    cubic-bezier(0.4, 0, 1, 1)   slow start, accelerate
Never:     linear | bouncy spring | elastic
```

### Motion types
```
Breathing:    scale 0.98 → 1.04, 3–5s cycle, unique phase per node
Drift:        4–12px translation, 6–12s, ease-in-out
Settling:     scale down + opacity increase, 400–600ms, ease-out
Orbit:        faint ring around playing node, 10–14s rotation, 0.2–0.3 opacity
Atmosphere:   1.5–3s crossfade between palette states
```

### Rules
```
- No animation should demand attention
- Every ambient element has a unique phase offset (nothing pulses in sync)
- Motion carries meaning about state — not decoration
- Never: jitter, bounce, elastic snap
```

---

## Z-Index Stack

```
0     Globe (100vw 100vh)
10    Territory washes
20    Map nodes and labels
30    Player bar + intent input (fixed bottom)
40    Secondary surface / sheet (when open)
50    Save point modal (when open)
60    Onboarding (first-time only)
70    System errors / ambient toasts (rare)
```

---

## Copy Tone

Quiet. Considered. Poetic but not pretentious. No exclamation marks. No feature announcements.

### Do
```
"your territory is blank — describe a vibe to begin"
"finding your territory…"
"name this moment"
"return to this territory"
"connect spotify to begin"
"I'm settled" / "I'm on the move"
"nothing in range — try shifting the vibe"
"estimating"
```

### Don't
```
"Discover music!"
"Loading..."
"Add to queue"
"Based on your listening"
"No results found"
"Now Playing"
"Your Library"
Anything with an exclamation mark
Anything that implies the system is watching the user
```
