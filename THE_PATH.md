# Woody — The Path (current operating decision)

*Originally created 2026-06-27. Revised 2026-07-14 after the codebase audit, the reactive-system discussion, and the first spontaneous non-founder problem signal. This remains the one operating document. Where older strategy or build documents conflict with this file, this file wins.*

---

## 0. The sequencing decision

The lifecycle remains sequential:

```text
ALIGNMENT -> POC -> MVP -> REAL CONTACT -> BUSINESS
```

But validation and system-building do **not** need to happen one after the other. They run as two synchronized streams:

```text
EXPERIENCE / EVIDENCE  <->  SYSTEM / LEARNING LOOP
what should feel true       what must exist to test it
```

The correction is not "stop building." It is: **never let the system stream get more than one experiment ahead of evidence.** Every technical increment must create a usable experience, collect a meaningful signal, or remove a blocker to the next test.

---

## 1. Alignment (locked for this experiment)

> **Woody is an adaptive music system for low-control journeys. It chooses what should play next from the listener, the live context, and the direction the moment needs, so music feels timed to the experience without constant pre-planning or skipping.**

- **North star:** learn how music changes a person's state, then adapt the next musical decision to help move or hold that state.
- **First laboratory:** running, because the founder is user-zero and can test repeatedly.
- **First non-founder problem signal:** a motorbike rider independently described pre-planning an entire queue and aligning songs with route shape, estimated speed, turns, and moments because skipping while riding is undesirable. This is problem evidence, not yet solution validation.
- **Shared category:** low-control, time-shaped activities such as running, riding, driving, training, cleaning, or focused work. These are not separate products; they are contexts for the same next-track intelligence.
- **Primary moment:** the next track arrives at the right moment without the listener having to manage it.
- **Secondary receipts:** the track is surprisingly right, the sequence feels personal, and the listener can later understand what worked.

Running is the wedge, not the permanent boundary of Woody. The motorbike example expands confidence in the problem while increasing the importance of zero-touch and safety-conscious UX.

---

## 2. The shared primitive

Do not build a running engine and a motorbike engine. Build one reusable decision:

```text
listener context
+ activity / journey context
+ current track and recent trajectory
+ desired direction or inferred need
+ tracks already played and constraints
-> next track + confidence + reason
```

The first technical surface should be conceptually equivalent to:

```text
POST /api/journey/next
```

It selects one next track at a time from the embedded corpus. It does not pre-plan a fixed 18-track arc, and it does not depend on the current LLM-generated pool of a few suggestions. CLAP may contribute evidence, but it is not treated as unquestionable ground truth.

Every decision must emit an event record: context, candidates, chosen track, transition, user intervention, skip/completion, retrospective judgment, and available physiological or route signals. That event stream is the seed of the later adaptive model.

---

## 3. Two streams, run simultaneously

### Stream A — Experience and evidence

Purpose: determine whether adaptive sequencing provides meaningful value beyond a well-made static playlist or manually planned queue.

Current actions:
1. Run a proper follow-up problem interview with the motorbike rider. Do not pitch Woody first. Understand frequency, preparation time, what ruins a queue, what "aligned with the route" means, and what a successful ride sounds like.
2. Run 6–8 founder sessions in matched pairs: Woody-assisted versus the founder's normal playlist/queue.
3. Before each session, capture the intended direction in plain language.
4. During safe founder tests only, use **Lift / Hold / Release** as instrumentation to create ground-truth labels. These controls are not the intended final UX.
5. Review the transition timeline after each session and mark what felt right, mistimed, generic, or surprising.
6. End every week with observed evidence: a completed journey, an interview, or an external reaction—not another strategy document.

For motorbike use, the target UX is zero-touch during the ride. Route shape, speed, progress, prior preferences, and post-ride review are candidate inputs. No interaction design should encourage phone use while riding.

### Stream B — System and learning loop

Purpose: build the smallest general substrate that can power Stream A and accumulate useful behavioral data.

Current actions:
1. Restore a safe, buildable baseline: rotate the exposed credential, fix the TypeScript build, and preserve the current worktree.
2. Add a generic journey-session model rather than a run-specific schema.
3. Add a one-next-track selector that queries the real embedded corpus directly.
4. Connect Spotify full-track playback to the selector.
5. Persist session and transition events locally before claiming that Woody learns.
6. Build a minimal mobile test surface: start session, playback status, optional instrumentation controls, and post-session review.

Allowed system work is limited to what the current or immediately following experiment needs. Sensor fusion, learned metrics, and autonomous control remain hypotheses until explicit labels and session data exist.

---

## 4. The two-week gate

The question is:

> **Does responsive next-track selection make a low-control journey feel more supported, better timed, and less manually managed than the person's normal playlist or queue?**

Pre-register the internal gate before running sessions. Directional evidence should include:

- Most requested transitions move in the intended direction.
- Woody is preferred in most matched founder sessions.
- Multiple moments feel specifically well-timed rather than merely coherent.
- The founder voluntarily wants to use it again.
- The motorbike follow-up confirms recurring pain and a desire for adaptation, not only enjoyment of manual queue-building.

If the gate passes, test a safe version with three non-founder users and begin comparing cadence, pace, heart rate, route progress, and history as predictors of explicit feedback.

If it fails, do not automatically add sensors or architecture. Diagnose whether the failure came from candidate quality, timing, context interpretation, interaction friction, or a weak underlying need. Permit one bounded correction, then re-evaluate the wedge.

---

## 5. What is frozen

- A separate product for every activity context
- DeviceMotion/cadence as the assumed primary controller
- Heart-rate integration before the manual feedback loop produces labels
- The full living/fascia model
- Owned acoustic DNA pipeline expansion
- Knowledge graph, federated learning, on-device models, and agentic layer
- Social/community systems and monetisation design
- A full redesign of the existing globe experience
- Any new strategy or PRD document

These are not rejected. They are unearned by current evidence.

---

## 6. Workflow rules

- This file is the operating decision. Update it deliberately; do not create a competing master document.
- Both streams produce something each week: one evidence artifact and one usable system increment.
- The system stream may be at most one experiment ahead of evidence.
- Manual controls are temporary scientific instruments, not product dogma.
- Sensors describe what happened; explicit feedback initially teaches what the person wanted.
- Build generic data contracts, but optimize the experience for the current running test.
- Measure progress in completed loops and learned facts, not files, features, or architectural sophistication.

---

## 7. Immediate order

1. Rotate the exposed credential.
2. Fix the current build failure.
3. Interview the motorbike rider without pitching the solution.
4. Specify the generic journey-session and transition-event contracts.
5. Build the minimal `/api/journey/next` loop and test surface.
6. Run the first matched founder sessions.
7. Review the evidence before adding passive sensing.

*This direction is locked for the two-week experiment, not forever. Evidence may change the wedge; it should not restart the documentation cathedral.*
