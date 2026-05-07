---
name: strategy-suite
description: Unified strategy workflow that blends product brainstorming, devil's advocate pressure testing, business model research, and roadmap updating into one coherent session. Use instead of invoking each skill separately. Produces: sharpened ideas → validated against failure cases → mapped to comparable mechanisms → translated into concrete roadmap decisions.
argument-hint: "[product/idea to evaluate] — focus: [pivot | launch | feature | moat | growth]"
---

# /strategy-suite

> One session. Four lenses. One decision.

This skill runs a full strategy cycle without context-switching between tools. The output is always a decision — not a list of options, not a framework, not more questions. A decision with known risks, ranked next actions, and a roadmap update.

---

## When to Use

- You're at a strategic inflection point (pivot, launch decision, major feature bet)
- A brainstorm has generated ideas that need pressure-testing before committing
- You need to update the roadmap based on new information or changed assumptions
- You want to understand how comparable companies solved a similar problem before deciding

Do not use for execution tasks. This is for decision-making, not building.

---

## The Four Lenses (run in sequence)

### Lens 1 — Product Brainstorm
*What are we actually trying to solve? What are all the ways we could solve it?*

Run divergent thinking first. Generate the full solution space. Apply JTBD (what job is the user hiring this for?), first principles (what is irreducibly true about this problem?), and inversion (what would make this definitely fail?).

Rules:
- No evaluating during generation. Ideas first.
- Push past the obvious. The first 3 ideas are usually the ones everyone already thought of.
- Name the underlying job before proposing solutions.

Output: 3–5 distinct directions, each stated as a hypothesis: *"If we [do X], then [user/market does Y], because [mechanism Z]."*

### Lens 2 — Devil's Advocate
*What has to be true for each direction to work? Which assumption is most likely wrong?*

For each direction from Lens 1, run the failure case:
- **What has to be true:** 2–3 specific, testable assumptions
- **The version that fails:** mechanism-level, not generic risk
- **Most fragile assumption:** the one most likely to be wrong
- **Timing:** is the window open, closing, or already closed?

Rank directions by assumption fragility (weakest assumptions = highest risk). The most appealing direction is often not the most defensible one.

Output: ranked directions with failure cases. One direction is identified as "the bet worth taking" — the one with the best ratio of upside to assumption fragility.

### Lens 3 — Business Model Research
*Who has solved a structurally similar problem? What specifically made it work?*

Pull the relevant comparables from the biz-model-research skill. For each, extract Level 3 mechanisms (not observations). Run the mechanism availability test. Map transferable mechanisms to the winning direction from Lens 2.

Focus on:
- What was the load-bearing component of their success (not the narrative, the actual mechanism)?
- Is that mechanism available to us right now?
- What is our specific version of it?

Output: mechanism matrix — what transfers, what doesn't, our version of each transferable mechanism.

### Lens 4 — Roadmap Update
*Given everything above, what changes? What gets moved, added, or dropped?*

Update the roadmap with the following questions:
- Does the validated direction change Phase 1 priorities?
- Are there new dependencies that weren't visible before?
- What is the single most important thing to prove in the next 4 weeks?
- What is the kill condition — the thing that, if it fails, means we should revisit the strategy?

Output: concrete roadmap changes — specific items added/moved/deprioritised, with the reasoning for each change stated as a testable bet.

---

## Output Structure

```
## Strategy Session — [Date] — [Topic]

### The Problem Being Solved
[One paragraph. The job to be done, stated precisely.]

### Directions Explored
1. [Direction] — hypothesis form
2. [Direction] — hypothesis form
3. [Direction] — hypothesis form

### Pressure Test Results
| Direction | Key Assumption | Fragility | Failure Mechanism |
|-----------|---------------|-----------|-------------------|
| ...       | ...           | High/Med/Low | ...            |

### The Bet
[Which direction. Why. What it requires to be true.]

### Mechanisms That Transfer
| From | Mechanism | Our Version | First Test |
|------|-----------|-------------|------------|
| ...  | ...       | ...         | ...        |

### Roadmap Changes
- [Phase/item]: [change] — because [bet]
- [Phase/item]: [change] — because [mechanism transfer]

### Next Actions (ranked)
1. [The single most important thing — validate the riskiest assumption]
2. [Second]
3. [Third]

### Kill Condition
[If X doesn't happen by Y date/milestone, we revisit the strategy.]
```

---

## Integration Notes

**With /devils-advocate:** This skill runs devil's advocate as Lens 2 by default. If you want a deeper pressure test on a specific idea, invoke /devils-advocate directly after this session.

**With /biz-model-research:** Lens 3 runs a focused version of biz-model-research. For a full comp analysis, invoke /biz-model-research as a standalone session.

**With roadmap files:** Always read the existing roadmap before running Lens 4. The output should be a diff — what changed and why — not a replacement.

**CLAUDE.md persistence:** Add to CLAUDE.md to make the strategy-suite lens available as a standing frame for all major decisions:

```markdown
## Strategy Decision Framework

When making significant product, design, or business decisions, apply the four-lens framework:
1. Brainstorm: generate the full solution space before evaluating
2. Pressure test: find the mechanism-level failure case for the leading option
3. Comp research: identify which mechanisms from comparable companies transfer
4. Roadmap: state the change as a testable bet with a kill condition

Never commit to a strategic direction without naming the riskiest assumption and the kill condition.
```
