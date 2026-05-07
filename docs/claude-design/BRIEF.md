# Woody — Design Brief
**For Claude Design | Requirements + Philosophy edition**

> Give this to Claude Design along with TOKENS.md and DESIGN-SYSTEM.md.
> This brief describes *what needs to be solved* and *why*. It does not prescribe *how*.
> Let the design solutions emerge from the constraints and philosophy.

---

## What Woody Is

Woody is a personal music intelligence system. The user describes a feeling — in plain language, the way they'd describe it to a friend — and Woody finds music that acoustically matches it. Not by category. Not by genre. By actually listening to the audio and understanding what the user means by "dark" or "warm" or "like driving through fog at 2am."

The product learns over time. It develops a model of what your words mean acoustically, which is different from what those words mean to anyone else. "Dark" for you might mean slow and reverb-drenched. For someone else it might mean aggressive and distorted. Woody learns the difference.

This is not a playlist app. Not a recommendation engine. Not Spotify. The closest precedent is Björk's Biophilia — each session is a navigable sonic universe.

---

## The One Sentence

> Woody should feel like a **living terrain of taste** — grounded, warm, and quietly intelligent. It changes personality without losing identity.

Every design decision gets tested against this sentence.

---

## The Philosophy Behind the Requirements

Understanding this section is more important than any specific requirement below. The design should be able to derive solutions from the philosophy, not from a list of features.

**The map is the interface.**
Woody's primary navigation surface is a 3D globe. Tracks exist as glowing nodes on this globe. There are no categories, no sidebars, no lists of tracks. The metaphor is cartographic — your taste is a territory you explore. Places you've been are lit up. Unknown territory is dark and sparse. You navigate by describing where you want to go, not by clicking a category.

**Intent is the primary act.**
The user's entry point is a text input where they describe a vibe. This is the core interaction. Everything else — playback, saving, history — is secondary to this act of description. The design hierarchy should reflect this: the invitation to describe a vibe should be the most prominent thing in the product when the user hasn't described one yet.

**The product is Understanding, not Mirror, not Actor.**
Three modes a music product can be in:
- **Mirror** — reflects your listening behavior back at you ("based on what you've been listening to"). Passive surveillance.
- **Actor** — takes control ("we chose these for you"). Paternalistic.
- **Understanding** — serves your present intention. This is Woody.

The UI must never look like it's reflecting behavior back at the user. No "based on your listening history." No "your top genres." No "you've been listening to a lot of X." The product serves intent, not history. The design should make this distinction feel obvious.

**Acoustic intelligence is invisible.**
Woody does complex things in the background — analyzing audio, building a personal acoustic fingerprint, learning what your words mean. None of this should be visible or explained in the UI. The product's intelligence should be experienced through the quality of suggestions, not announced through dashboards or explanations. If a user has to understand how the system works to use it, the design has failed.

**Restraint is the signal of quality.**
This product is for people who care deeply about music. That audience reads overdesign as insecurity. Every element that can be removed should be removed. Every animation that doesn't carry meaning should be cut. The design should feel authored — like every decision was made deliberately — not assembled from a component library.

---

## The Current State

The app has one screen. A 3D globe fills the entire viewport. A text input sits fixed at the bottom. When music plays, a player bar appears above the input. There are no other persistent UI surfaces.

**What exists:**
- The globe with track nodes
- The intent input bar (primary action)
- The player bar (appears when playing)
- A session queue panel (currently triggered by a hidden button)
- A save moment modal
- A saved moments browser (currently buried, inaccessible to new users)
- A Spotify connect button (top corner, unauthenticated state)

**What doesn't exist yet:**
- A way to reach account management, settings, or saved moments without knowing hidden buttons exist
- An onboarding experience
- A way for users to communicate their physical context (stationary vs. moving)
- Any visual response to the emotional character of the current session (the UI doesn't shift with the music's mood)

---

## Problems to Solve

These are the design challenges. Each one includes the requirement, the constraint, and the philosophical intent. The *how* is for you to determine.

---

### Problem 1 — Secondary Surface Access

**The requirement:** Users need to reach three things that aren't the map: their account (Spotify connection status), their settings (minimal — physical context, acoustic service status), and their saved moments. These things exist in the product but are currently inaccessible.

**The constraint:** There can be no persistent navigation bar, no hamburger menu, no sidebar, no tab bar. These patterns break the map-as-navigation metaphor and make the product feel like an app, not a terrain.

**The philosophical intent:** Secondary surfaces in this product are rare, intentional destinations. A user doesn't switch between "tabs" in Woody — they have one primary experience (the map) and occasionally need to step away from it for a specific purpose. The design should reflect that rarity. The transition to a secondary surface should feel deliberate and spatial, not mechanical.

**The question for the design:** How does a user access what they need without the product growing a navigation layer that contradicts the map-as-interface principle?

---

### Problem 2 — Intent and Playback Competing

**The requirement:** Both the intent input (describe a vibe) and the player (currently playing track) need to be usable. When music is playing, the user needs to see playback status and control it. They also need to be able to shift the vibe without stopping.

**The constraint:** They cannot both be equally prominent simultaneously. The design cannot just stack them. Visual hierarchy has to be clear: one thing is primary, the other is accessible but secondary.

**The philosophical intent:** Intent is the cause; playback is the effect. When the user first arrives, the invitation to describe a vibe is everything — the player doesn't exist yet. When music is playing, the playback state becomes the primary reality, and the ability to shift intent becomes a secondary action. The UI should reflect this causal relationship rather than treating both as equal parallel controls.

**The question for the design:** How does the interface shift its hierarchy between "invite the user to describe a vibe" and "acknowledge what's playing and let them steer it" — and how does that shift feel spatially and temporally?

---

### Problem 3 — Saved Moments as Memory

**The requirement:** Users can save specific moments in a listening session — a track, a vibe, a point in time. These saved moments need to be browsable and re-enterable. Currently they're buried in a modal that most users will never find.

**The constraint:** This cannot look like a playlist manager, a library view, a history log, or any other music app's saved music pattern. It cannot feel like a Spotify playlist screen. It cannot have edit/delete/sort affordances as primary actions.

**The philosophical intent:** When a user saves a moment in Woody, they're not bookmarking a track — they're naming a territory. They're saying "I want to be able to come back to this feeling." The act of saving is described in the design system as "a ritual, not a form." The act of returning to a saved moment should feel like walking into a familiar room, not loading a playlist. The emotional weight of this feature is significant; it's the moment the product becomes personal memory. The design should honor that.

**The question for the design:** How does this surface look and feel in a way that honors the emotional weight of musical memory rather than reducing it to data management?

---

### Problem 4 — Physical Context Signal

**The requirement:** The product learns how to weight your listening signals differently depending on whether you're moving (running, commuting, walking) or stationary (working, relaxing, focused). When you're moving, a completed track carries less signal — you might have listened because you were busy, not because you loved it. The product needs a way to receive this signal from the user.

**The constraint:** This cannot feel like choosing a mode. It cannot be a setting in a settings panel. It cannot feel like a feature to configure. It should feel like communicating a state, the way you'd tell a friend "I'm about to go for a run" rather than "please activate running mode."

**The philosophical intent:** Physical state is part of the context of listening. The same vibe description — "late night drive, slow and heavy" — sounds like a different acoustic request when you're actually driving vs. when you're sitting still. The product wants to serve the right acoustic interpretation for the right physical context. This isn't a mode switch; it's a piece of contextual truth the user can share with the product when they think of it.

**The question for the design:** How does the user communicate physical context in a way that feels like sharing a state rather than configuring a setting — and where does this live without becoming a fixture of the primary UI?

---

### Problem 5 — First-Time Experience

**The requirement:** A new user arrives, has no Spotify connected, and needs to connect it and understand what Woody is well enough to make their first intent description.

**The constraint:** No feature explanations, no onboarding carousels, no screenshots of the product, no "here's how it works" lists. The product cannot explain itself through marketing copy. Time from arrival to first vibe should be under 60 seconds.

**The philosophical intent:** Woody teaches itself through use. The first experience should be the minimum necessary to get the user to their first moment of the product working — and let that moment do the explaining. The product's concept (describe a vibe, get music that understands you) is simple enough that a new user should be able to grasp it from a single well-crafted invitation, not a tutorial. Trust the user's intelligence.

**The question for the design:** What is the absolute minimum interface required to take a new user from arrival to their first Woody moment — and how does it set the emotional register for everything that follows?

---

### Problem 6 — Session Mood Response

**The requirement:** The UI should visually respond to the emotional character of the current listening session. A nocturnal, introspective session should feel different from a warm, energetic one. This atmospheric response should be subtle — not a color scheme switch, but a temperature shift.

**The constraint:** This cannot look like a theme change, a skin, or a mode. It should not draw attention to itself. It should be the kind of thing the user might feel rather than notice.

**The philosophical intent:** The living terrain metaphor implies that the terrain changes with the territory you're in. A landscape at night feels different from the same landscape at noon. Woody's UI should have the same quality — the same bones, but a different atmosphere depending on the emotional character of what's playing. The globe already shifts. The 2D surfaces (inputs, player bar, overlays) should subtly shift too.

**The question for the design:** How does the UI communicate session mood through atmosphere without it feeling like the product changed its appearance?

---

## What to Produce

### Phase 1 — Architecture (wireframes, no color)
Start here. Validate structure before applying the visual system.

For each screen/state, the question is: can a new user understand what this surface is for in under 2 seconds?

- Home — before first intent (what does the invitation look like?)
- Home — after intent, tracks on globe (how does discovery look?)
- Home — while a track is playing (how does the hierarchy shift?)
- Secondary surface — however you solve Problem 1
- Saved moments — however you solve Problem 3
- First-time experience — however you solve Problem 5

### Phase 2 — Visual system application (hi-fi)
Apply the full token system from TOKENS.md. Use exact values — do not approximate colors, type sizes, or spacing.

### Phase 3 — Component states (hi-fi)
- Track node in: default / hover / currently playing / previously visited / being saved
- Intent input in: idle invitation state / focused / contracted (if playing state changes it)
- Whatever secondary navigation pattern you design, in: resting / active
- Saved moment in: card form / expanded/detail form

### Phase 4 — Motion annotations
Do not animate. Annotate. For each transition: what triggers it, what changes, over how long, with what easing character (settle / emerge / drift / breathe). The development team will implement in Framer Motion.

---

## Hard Constraints (Non-Negotiable)

These are not stylistic preferences. They are architectural constraints of the product.

1. **No navigation bar, sidebar, tab bar, or hamburger menu.** The globe is navigation.
2. **No cards with borders for tracks.** Tracks are nodes on the globe, not list items.
3. **No pure black backgrounds.** The background must use the warm soil tones from TOKENS.md.
4. **No "Now Playing" text label.** The playing state is communicated through the node's animation, not a label.
5. **No gradients as fills on interactive elements.** Gradients are for glows only.
6. **No sharp corners anywhere.** Everything has radius.
7. **No "based on your listening" language anywhere in the product.** This is Understanding mode, not Mirror mode.
8. **Serif (Lora) appears in maximum 2–3 places per screen,** only for emotionally significant moments.
9. **The globe is always visible behind any overlay.** Secondary surfaces are translucent, not opaque walls.

---

## The Anti-Pattern List

Things this product must never look like:
- Spotify (any version, any era)
- Apple Music
- A dark-mode dashboard or analytics product
- A settings panel masquerading as a feature
- A feature-announcement screen ("Introducing...")
- A streaming service library view
- Anything that makes the user feel watched or profiled

---

## Handoff Format

When producing designs ready for implementation:

- **Color tokens:** List any new values as name + hex. Existing values are in TOKENS.md.
- **Component specs:** For each new component — dimensions, states, content hierarchy, interaction behavior. No CSS. The team uses Tailwind + Framer Motion.
- **Motion specs:** Trigger, what animates, duration (ms), easing description. No code.
- **Copy:** Any UI text, exactly as it should appear. Lowercase preferred unless screaming is intentional (it won't be).
