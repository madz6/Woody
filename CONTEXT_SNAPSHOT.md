# Woody — Context Snapshot
*Read this immediately after any context compaction. Quick-read only.*
*Then read: THE_PATH.md -> REVISIT.md -> latest SESSION_NOTES.md entry.*

---

## What Woody Is

Woody is an **adaptive music system for low-control journeys**. It decides what should play next from the listener, the live context, and the direction the moment needs, so music feels timed to the experience without constant pre-planning or skipping.

The deeper ambition remains musical self-knowledge: learn how musical structure, personal history, state, environment, and sequence interact for an individual. Running is the first repeatable laboratory for growing that model; it is not the permanent boundary of the product.

**Current product claim:** music should not merely match a category or average mood. It should respond to the person's trajectory and help move or hold the state they are reaching for.

**Current primary moment:** the next track arrives at the right moment without the listener having to manage it.

**Secondary receipts:** the sequence feels personal; a surprising track is right; the listener can later understand what worked.

---

## Evidence So Far

- **Founder signal:** the founder wants music to carry and adapt to a run rather than manually managing a queue.
- **First spontaneous non-founder problem signal (2026-07-14):** a motorbike rider independently described pre-planning an entire queue to avoid skipping, including aligning songs with route shape, estimated speed, turns, and moments of the ride.
- This motorbike account is evidence that the low-control journey problem exists outside running. It is **not** evidence that the person wants Woody's proposed solution; a non-leading follow-up interview is required.
- Running, riding, driving, training, cleaning, and focused work are candidate contexts for one shared next-track intelligence—not separate products to build now.

---

## Who It Is For Now

**Primary user:** the founder as user-zero, testing repeatedly through running.

**First adjacent user:** people who care enough about music to pre-plan a journey because interacting during it is difficult, unsafe, disruptive, or impossible.

**Long-term user:** a curious listener who wants discovery, understanding, and ownership—not merely passive algorithmic playback.

**Not for now:** passive listeners who are already satisfied with generic autoplay, and contexts where a playlist already solves the problem without meaningful preparation or skipping.

---

## Current Interaction Model

**Before:** state the journey or desired direction with minimal friction.

**During:** Woody chooses the next track. In safe founder instrumentation sessions only, **Lift / Hold / Release** creates explicit ground-truth labels. These controls are not the intended final UX.

**After:** review the transition timeline, identify what felt right or mistimed, and preserve the journey.

For motorbike use, the target is zero-touch during the ride. Route shape, speed, progress, prior behavior, and post-ride feedback are candidate signals. Never design an interaction that encourages phone use while riding.

---

## Operating Method

Two streams run simultaneously:

1. **Experience/evidence:** founder sessions, matched playlist comparisons, problem interviews, and post-session judgments.
2. **System/learning loop:** one-next-track selection, playback, generic journey context, and persisted transition events.

The system stream may be at most one experiment ahead of evidence. Building is allowed and expected; speculative platform expansion is not.

---

## Shared Technical Primitive

```text
listener context
+ activity / journey context
+ current track and recent trajectory
+ requested direction or inferred need
+ exclusions and played tracks
-> next track + confidence + reason
```

The intended first surface is a generic `POST /api/journey/next`, backed by the embedded corpus and Spotify playback. It selects one track at a time rather than generating a fixed arc in advance.

Every decision records the context, candidates, selected transition, behavior, and retrospective judgment. Sensors are candidate predictors; explicit feedback initially supplies the meaning.

---

## Current Build State

| Component | Status |
|---|---|
| Spotify auth and full-track playback | Built, needs reuse in the new test surface |
| Existing intent/globe experience | Built, legacy path; not the current validation surface |
| CLAP acoustic service and SQLite corpus | Built, partial corpus; useful input, not fixed truth |
| Static arc generator | Built, greedy-with-relaxation; not a reactive controller |
| `/api/arc` | Experimental and currently fails the production type-check |
| Generic journey-session model | Not built |
| `/api/journey/next` | Not built |
| Persisted transition/feedback events | Not built |
| Passive sensing | Not built and not yet earned |

**Immediate order:** rotate exposed credential -> restore build -> interview motorbike rider -> define event contracts -> build next-track loop -> run matched founder sessions.

---

## Architecture — Current Operating View

```text
Journey context + listener history + explicit direction
                        |
                        v
            next-track candidate selector
        (CLAP + measured properties + constraints)
                        |
                        v
                 Spotify playback
                        |
                        v
       behavior + explicit/post-session feedback
                        |
                        v
              persisted event history
```

The future plastic or "fascia" model may learn from this event history. It is not the first build. CLAP is one sensory input; it is not the whole intelligence.

---

## Hard Stops

- No separate engine for each activity context.
- No cadence/BPM matching presented as the product.
- No assumption that cadence or heart rate reveals what the person wants.
- No required mid-journey interaction in the final low-control UX; manual controls are safe-test instrumentation only.
- No claim that Woody learns until events are persisted and actually influence later decisions.
- No fixed 5D display coordinates used as navigation truth.
- No full fascia, DNA pipeline, knowledge graph, federated learning, monetisation, or social build during the two-week gate.
- No new competing strategy document; update THE_PATH.md deliberately.

---

*Last updated: 2026-07-14*
