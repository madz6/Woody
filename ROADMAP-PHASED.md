# Woody — Phased roadmap (no timelines)

Living companion to [WOODY-PRD.md](./WOODY-PRD.md). Phases are ordered for **dependency leverage** and infrastructure depth, not calendar. Voice, motion, and surface rules: [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md).

---

## Phase A — Perception and trust

- Globe layout, camera, controls (full-viewport, centered framing).
- Named map territories + readability (washes, labels, smaller nodes).
- Context layering UX verified end-to-end (`mode`, previous intent/lens).
- Optional: feature-snapshot types stub for later LLM/Essentia fields.

## Phase B — P0 spine complete

Ship everything in PRD **Must-Have M1–M6** with clear acceptance: intent → map → play → steer → SavePoint → OAuth refresh.

- Session model single-sourced; leading metrics hooks (intent-to-play, steer rate, SavePoint rate, latency).

**Shipped in repo (verify manually):** client session queue + MiniPlayer prev/next; optional `audioAttributes` from intent; `/api/enrich` + `enrichmentMap` (hover tooltips on map nodes); queue tail from `rankByTransition` on click; queue panel + auto-advance. **SavePoints** persist `track` + `trackId`; `getMapNodes()` merges `getSavePoints()` so named anchors appear on the memory globe (offset from pure session-memory nodes). M5: confirm **SavePoint after hard refresh** still shows that anchor node and label.

## Phase C — Data plane (PRD P1 engine room)

- **C1 / S2** LLM `audioAttributes` per track in `lib/intent.ts` (BPM band, energy, valence, key, texture).
- **C2 / S6** Client `useEffect` → `POST /api/enrich` per suggestion; MusicBrainz + Last.fm (rate limits respected).
- **C3 / S3** `rankByTransition` when building the **session queue on map click** (tail ordered relative to the track the user chose, not a speculative full-list reorder at intent time).
- Field names compatible with future Essentia swap (open question: LLM first).

## Phase D — Queue and session continuity (P1)

- **S5 (partial, shipped):** in-session queue + heuristic tail; MiniPlayer prev/next; queue panel (reorder, clear, load-all); auto-advance on track end; enrichment hints on node hover.
- **S5 (not yet / backlog):** intent-time reorder of the full suggestion list; **session queue** persistence across hard refresh (separate from SavePoint map anchors above).
- Single source of truth for now-playing across map, MiniPlayer, SDK state.

## Phase E — Map as musical space

- **S4** Zone vocabulary + colour identity + clustering by tone + attributes.
- Meaningful coordinates: energy/tempo (then UMAP when F2 exists); isolate `latLng` derivation function.

## Phase F — Multi-source readiness (S7)

- `woodyId` + `sources` dict; resolver stub; API shapes woody-facing.

## Phase G — Intelligence layer (P2, design-first)

- **F1** Essentia / Modal on `preview_url`.
- **F2** UMAP → globe coordinates.
- **F3** Felt SDK integration path.
- **F4** Woody Radio prototype after D is solid.

## Phase H — Horizon

Moment sharing, group listening, lyric layer, full multi-provider playback, native + Felt, Radio at scale — only after A–D are undeniable.

---

## Dependency sketch

```text
A (stability) → B (P0) → C (data plane) → D (queue)
                      ↘ E (map semantics)
C + D → F (multi-source types)
C → G (intelligence)
```

## Parallel infra (any phase)

- Feature flags for heuristics, enrichment, coordinate formula.
- Contract tests on `/api/intent` response shape.
- Centralized rate limits / retries for Spotify + MB + Last.fm.
- Structured logging on intent → search → play path.

---

*Derived from WOODY-PRD v0.3; update when queue + LLM attributes ship.*
