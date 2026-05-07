# Session design — longer discovery (north star)

## Problem

The PRD imagines a listener spending meaningful time **in** a territory and surfacing multiple tracks worth saving. Today the loop is: one intent → a small suggestion set on the globe → steer/layer → relatively short engagement. The map reads as a **result set**, not yet a **navigable territory** you can deepen without re-querying.

## Two complementary directions

### A. Zone deepening (no re-intent)

After the initial suggestion set, the user can **go deeper into a zone** (e.g. tap a named territory on the globe) and receive **more tracks from that territory** without typing a new line. Success means: same session, same emotional frame, expanding candidate set.

**Acceptance (draft):** From an active intent, user can trigger at least one “deeper” expansion tied to a **zone** (not a generic re-roll of the whole intent) and see **new** tracks on the map before leaving the session.

### B. History density

The globe becomes interesting over time because **memory nodes, trails, and SavePoints** create structure—panning and revisiting is itself discovery.

**Acceptance (draft):** After N sessions (configurable in testing), a cold user can **see** prior territory without opening a secondary list; optional **Moments** list remains the explicit “return” surface for named saves.

## Decision for implementation sequencing

1. Ship **explicit return** (Moments / SavePoint browser + restore intent) first—it makes accumulation legible immediately.
2. Implement **zone deepening** as the next mechanical answer to “20 minutes” once zone semantics exist (see `phase-e-territory.md`).
3. Keep improving **history density** in parallel (map chrome, memory visibility) without blocking A.

## Reason visibility before play (product gap)

An unwired `SuggestionNodes` experiment was removed on purpose: it implied a second suggestion surface without integration (no select/play, layout hardcoded for a few items). **The problem it gestured at remains unsolved.**

Woody’s per-track **`reason`** (the LLM line that makes a pick feel like discovery, not a search hit) is **hard to read before the user commits to playing**. Today it shows up in small or secondary places (e.g. queue context) rather than as the main read before click. That weakens discovery and works against longer, reflective sessions—even if zone deepening and history density improve later.

**Pick a direction before building replacement UI:**

1. **On-map** — Make `reason` legible on the primary map surface (e.g. selected/focused node state or tap-to-expand), not only on hover or after play.
2. **Alongside the globe** — A persistent or collapsible panel tied to focus/hover that always shows title, artist, and **reason** for the current suggestion set or focused track.
3. **Hybrid / mode** — For some session states, the globe may not be the right **primary** surface for dense text; a list or card strip might be co-primary (not a dead component—**only** after this is specced and wired end-to-end).

This question is **orthogonal** to Phase E coordinate math; see `phase-e-territory.md` for zone semantics and navigation.

## Out of scope here

- Session queue persistence across full page refresh (low user value until the core loop is richer).
- Reordering the full suggestion list at intent time from an arbitrary “first track” anchor (conflicts with click-time tail ranking).
