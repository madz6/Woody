# Phase E — Territory: zones as destinations (spike)

## What Phase E is *not* (only)

Replacing hash-based `lat`/`lng` with BPM/energy math moves dots by small radians. That alone does **not** change whether the product feels like a **territory** you can explore.

## What Phase E *is*

**Named zones** (e.g. Dark Matter, Signal Plain, Organic Country, Dusk Fringe in the current map) should become **meaningful destinations**:

- Each zone has a **clear musical / mood semantics** (copy + colour already hint at this).
- The user can **select a zone** and get behaviour: at minimum “**more suggestions biased toward this zone**” without a new free-text intent—or a structured continuation of the current intent scoped to that zone.
- **Labels and affordances** communicate that zones are **navigable**, not only decorative washes on the sphere.

## Thin vertical slice (proposal)

1. **Tap/hit-test on zone decoration** (or a small zone strip UI) sets `activeZoneId`.
2. **Client or API continuation**: POST `/api/intent` with optional `zoneId` + current `intentText` / `personaLens`, or a dedicated `/api/intent/zone` stub that reuses search with zone bias—exact shape TBD when implementing.
3. **Map**: new suggestions appear with placement rules that **cluster toward** the chosen zone’s hemisphere (still compatible with later coordinate-from-audio work).

## Downstream (after slice lands)

- **Coordinate derivation** from `audioAttributes` (energy/tempo → position) becomes a refinement once “why am I placed here?” is tied to **zone + intent**, not raw hash alone.
- Feature flag any new placement formula (`NEXT_PUBLIC_COORD_FORMULA` or similar) for safe rollback.

## Open questions

- Should zone deepening **mutate** the current session’s suggestion list or **append** a second ring of nodes?
- How does zone deepening interact with **steer** (same intent family vs competing metaphors)?
