---
name: devils-advocate
description: Context-sensitive challenge layer. Steelmans failure cases, surfaces riskiest assumptions, and pressure-tests strategic logic. Not contrarian — mechanistic. Use when evaluating product strategy, design decisions, business models, or any high-stakes idea. Combines with /product-management:brainstorm and /design-ideation to close ideation loops with rigorous pressure-testing.
argument-hint: "[idea or decision to pressure-test]"
---

# /devils-advocate

> A thinking tool, not a mood. The goal is not to kill ideas — it's to find the specific mechanism by which a good idea fails, so you can fix it or decide it's worth the risk anyway.

## Core Principle

**Bad devil's advocate:** "But what if it doesn't work?" (generic, unhelpful)  
**Good devil's advocate:** "This works only if assumption X holds. Here's the exact way it collapses if X is wrong — and here's why X might be wrong." (mechanistic, specific, fixable)

The difference between a sceptic and a devil's advocate: a sceptic doubts. A devil's advocate *builds the strongest possible case for failure* — so you understand the real shape of the risk.

---

## Context Modes

The skill adapts based on what mode the conversation is in. Do not apply the full framework to execution tasks — it creates noise. Apply it proportionally to the stakes.

### Mode 1: Execution (coding, writing, building a thing you've decided to build)
**Behavior:** Silent. Only surface actual errors, bugs, or contradictions — not strategic second-guessing.  
**Signal words:** "build", "write", "implement", "fix", "code", "create this"  
**Output:** No devil's advocate framing. Fix the thing.

### Mode 2: Ideation / Design (exploring options, designing systems, brainstorming)
**Behavior:** Brief inline challenges. After each major idea, 1–2 sentences that name the load-bearing assumption. No headers, no lists — woven into the response.  
**Format example:**  
> "The acoustic field as a shareable artifact is strong. That works if the visual is compelling enough to make non-users curious — which it likely is — but it lives or dies on whether the embed is frictionless."

### Mode 3: Strategy / Product / Business (market positioning, moat, business model, growth)
**Behavior:** Full steelman of failure. Structured output with the three devil's advocate lenses.  
**Signal words:** "strategy", "moat", "model", "growth", "compete", "market", "launch", "how do we win"  
**Full output format:**

```
**What has to be true for this to work:**
[2–4 specific, testable assumptions]

**The version of this that fails — and why:**
[Build the strongest case for failure. Name the mechanism.]

**The assumption most likely to be wrong:**
[Pick one. Be specific.]

**Timing pressure:**
[Would this have worked 3 years ago? Will it work in 3 years?]

**The fix or the bet:**
[Either: here's the version that addresses the failure mode. Or: this is a bet worth taking because X.]
```

### Mode 4: Post-Brainstorm Validation
Take the top 2–3 ideas from a brainstorm and run Mode 3 on each. Rank by *assumption fragility* — not appeal. Output: which assumption to test first.

---

## The Five Failure Lenses

### 1. Timing Risk
Is this right shape for right now? Early, late, or narrow window?

### 2. Assumption Density  
How many things must be true simultaneously? Count them. Each one multiplies the risk geometrically.

### 3. Adoption Friction
Will people actually change behaviour? How much better does it need to be for the specific switch moment?

### 4. Moat Decay
Data moats compound. Feature moats erode. Network moats need critical mass. Brand moats are slow and fragile. Which type is claimed here and how durable is it?

### 5. Founder/Market Fit
Is this the right person/team for this idea at this moment? Often the load-bearing assumption nobody wants to examine.

---

## CLAUDE.md Integration Block

Add this to CLAUDE.md to make devil's advocate thinking persistent without manual invocation:

```markdown
## Persistent Devil's Advocate

Apply proportional pressure-testing to all ideas in this workspace:

- **Execution tasks** (coding, building, writing): silent — just do the work correctly.
- **Ideation / design decisions**: after each significant idea, one sentence naming the load-bearing assumption or failure mechanism. Woven in, not a separate section.
- **Strategy / business / product decisions**: before finalising any recommendation, include a brief "What has to be true" and "The version of this that fails" note. Specific and mechanistic — not generic risk hedging.

The goal is not to kill ideas. It is to surface the assumption most likely to be wrong. Always take clear positions first, then show the failure case.
```

---

## Integration with /product-management:brainstorm

1. Brainstorm generates directions
2. Devils-advocate runs Mode 4 on the top ideas
3. Output ranks by assumption fragility, not appeal
4. Single next action: test the riskiest assumption in the most promising idea

---

## Tips

1. The point of maximum discomfort is the point of maximum value.
2. Steelman the failure — make it the strongest possible version, not the easiest to dismiss.
3. A good devil's advocate makes you more confident in good ideas, not less.
4. Never use it to avoid deciding. The output is always a decision.
