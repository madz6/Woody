---
name: woody-session-capture
description: Automatically captures product decisions, ideas, changes, and discussion points from any Woody product conversation into SESSION_NOTES.md and appropriate documentation files. Use this skill after EVERY substantive Woody product discussion — feature ideas, architectural changes, UX thoughts, psychology insights, go-to-market strategy, technical debates, devil's advocate points, user sentiment, rejected ideas, and anything the user wants noted. Trigger whenever the user proposes an idea, makes or reverses a decision, expresses strong sentiment, debates an approach, says "note this" / "remember" / "add this" / "make sure we capture", or simply continues a product discussion that generates new insight. Never wait to be asked — capture notes proactively after every meaningful exchange. This skill is for the Woody project workspace at C:\Users\user\woody\.
---

# Woody Session Capture

Capture the living product discussion so nothing gets lost between sessions. Every idea, decision, concern, shift in direction, and moment of user sentiment is a signal worth keeping.

## The Problem This Solves

Product conversations accumulate faster than documentation does. Decisions made conversationally evaporate. The user expresses a strong opinion ("I literally have been saying this from the very start") and three sessions later nobody wrote it down. This skill is the antidote: a structured, persistent record of what was said, by whom, with what conviction.

## When to Capture

Capture after any exchange that contains:
- A new idea or feature proposal
- A decision made or reversed
- A technical approach debated or resolved
- An opinion expressed with sentiment (frustration, excitement, doubt, confidence)
- A correction ("no, that's not what I meant")
- A "what about..." or "have we thought about..."
- A circumvention or mitigation strategy for a risk
- User confirming or rejecting something Claude proposed
- Anything the user says should be "noted" or "remembered"

## How to Capture

### Step 1: Scan before writing

Before writing anything, read:
- `C:\Users\user\woody\SESSION_NOTES.md` (exists or will be created)
- The relevant target doc if a decision needs propagating (PRD.md, FEATURES.md, etc.)

Check for duplication — don't write the same decision twice. If updating an existing note, amend it with `[UPDATED: date]` rather than creating a duplicate.

### Step 2: Write to SESSION_NOTES.md

Append a structured entry for each distinct topic discussed. Use this format exactly:

```
---
## [TOPIC TAG] — [Date]

**What was discussed:**
[1-3 sentences describing the idea, decision, or change]

**User's position:**
[What the user thinks, wants, or said — in their own terms if possible]

**Claude's position:**
[What Claude recommended, proposed, or pushed back on]

**Status:** [Proposed | Decided | Open | Rejected | Needs Research | Revisit Later]

**Sentiment:** [Excited | Frustrated | Uncertain | Confident | Skeptical | Emphatic | Conflicted]
*Optional note on emotional weight:* [e.g., "User was emphatic — 'I literally have been saying this from the very start'"]

**Category:** [Engine | UX | Visual | Architecture | Psychology | GTM | Business | Community | Data/Privacy | Audio Pipeline]

**Target doc:** [PRD Section X | FEATURES.md Section Y | PSYCHOLOGY.md | DECISIONS.md | None]

**Action needed:** [Update PRD Section 5 | Add to FEATURES.md | No action | Needs dedicated session]

**Additional context:**
[Anything relevant that didn't fit above — related decisions, dependencies, open questions this raised]
---
```

### Step 3: Propagate to target doc (if actionable)

If **Status = Decided** and **Target doc** is set:
- Make the edit to the target doc directly
- Mark the SESSION_NOTE entry: `**Propagated:** Yes — [target doc + section]`

If **Status = Proposed** or **Open**:
- Write to SESSION_NOTES only
- Leave Target doc untouched until decided

If the decision is significant (changes engine architecture, UX model, or core product principle):
- Update the relevant doc section
- Update Section 20 (Open Decisions) or Section 19 (Rejected) in PRD.md if applicable

## Capture Tone Guidelines

**For user sentiment:** be faithful to the energy, not just the content.
- "User was frustrated that this point keeps getting missed" is more useful than "User mentioned X"
- "User was excited and immediately connected this to the DJ use case" preserves context that plain facts don't

**For Claude's position:** be honest about uncertainty.
- "Claude proposed X, acknowledging this needs validation" is better than stating X as fact
- If Claude was wrong and the user corrected, note the correction clearly

**For status:** when in doubt, mark Proposed not Decided. Decisions need explicit confirmation.

## Topic Tags (use these or create new ones)

```
[ENGINE] — recommendation engine, arc generation, distance metrics, embeddings
[AUDIO] — audio analysis, librosa, feature extraction, pipeline
[UX] — screens, interactions, navigation, intent input
[VISUAL] — acoustic field, artifacts, design language, animation
[ARCH] — technical architecture, data models, APIs, infrastructure
[PSYCH] — psychology underpinnings, behavioral mechanics, flow states
[SOCIAL] — community, sharing, social objects, artifact format
[GTM] — go-to-market, acquisition, influencer strategy, DJ wedge
[PRIVACY] — data, encryption, federated learning, trust
[BUSINESS] — revenue, moat, competitive landscape, pricing
[COLD-START] — onboarding, new user, Spotify history, territory seeding
[PERSONAL-MODEL] — on-device LLM, fine-tuning, RL, personal acoustic model
[REJECTED] — explicitly rejected, with reason
[RISK] — failure modes, devil's advocate, circumventions
```

## Example Capture

```
---
## [ENGINE] [PERSONAL-MODEL] — 2026-05-05

**What was discussed:**
User proposed a personal on-device LLM that learns from individual behavioral signals via reinforcement learning, light-sized and RAG-style, rather than relying on a central model.

**User's position:**
Wants a native LLM getting fine-tuned per user. RL-based, light parameters, learns and improves as a personal state model. Sees this as essential to the privacy-by-design and personalization vision.

**Claude's position:**
Strongly agrees. This aligns with the federated learning privacy architecture and solves the "confident wrongness" problem by making personalization local. Small models (Phi-3, Gemma 2B class) are viable on modern mobile hardware. The RL reward signal is session quality (uninterrupted time, completion rate, replay events).

**Status:** Decided

**Sentiment:** Confident
*Note:* User stated this directly as a requirement, not a question.

**Category:** Engine | Architecture | Data/Privacy | Personal-Model

**Target doc:** PRD Section 5 (Acoustic Intelligence Foundation) — engine architecture rewrite

**Action needed:** Rewrite PRD Section 5 and 7 to include personal model layer as Phase 3 architecture

**Additional context:**
This changes the privacy architecture significantly — sensitive personalization data stays on-device. Central server handles federated aggregate updates only. Also changes the cold start approach — personal model initializes from population priors, not personal data.
---
```

## Files to Know

| File | What it tracks |
|------|---------------|
| `SESSION_NOTES.md` | Running log of all discussions — created if not exists |
| `PRD.md` | Canonical product requirements — update Decided items here |
| `FEATURES.md` | Feature registry — add new features here |
| `PSYCHOLOGY.md` | Psychology underpinnings — add new behavioral insights here |
| `DECISIONS.md` | Open vs closed decisions — update status here |
| `VISUAL_LANGUAGE.md` | Visual language spec — closed unless reopened in session |

## What Not to Capture

- Trivial clarifications ("what does X mean?")
- Exact code snippets (those belong in code files, not notes)
- Things already clearly decided and written into the PRD verbatim
- Formatting or wording preferences that don't affect product decisions
