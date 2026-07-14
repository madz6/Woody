# Woody — Biographical Cold Start Design
*Created 2026-06-27. Resolves the 🔴 critical REVISIT item "Biographical cold start — design needed."*
*Status: design proposed, three sub-decisions flagged open (Section 7). Connects to but is distinct from the Bayesian acoustic probe.*

---

## 1. The problem this solves

The Bayesian acoustic probe (WOODY_BUILD_SPEC §6) gives an **acoustic prior** — where your taste sits in CLAP space, inferred from behavioural response to probe tracks. It cannot recover the **biographical prior**: formative listening, cultural background, parental influence, friend-group exposure. These create anchors that behavioural data can never reconstruct, because they explain *why* you accept music that sits acoustically "far" from your centre — cultural memory and belonging override acoustic distance.

Both priors are required. This document specifies the biographical one.

---

## 2. The core reframe — anchor = (track, source, era)

The original question was a binary: *track-picking (3 formative tracks)* vs. *something more open-ended that captures multicultural background and friend-group influence.*

**The binary is false.** The cultural and social dimensions are not *additional inputs alongside tracks* — they are **provenance metadata on each track**. A bare track is a point in CLAP space with no biographical meaning. The same track means something completely different if it was your mother's or your best friend's at 16. So:

> An anchor is not a track. It is a **`(track, source, era)`** tuple.

- **track** → the acoustic handle. Maps directly to a CLAP embedding. This is the only reason biographical input can seed the engine at all.
- **source** → the biographical channel it entered your life through. Captures the cultural/social dimension *and* drives differential weighting.
- **era** → the developmental window. Distinguishes deep formative anchors from recent ones.

This keeps onboarding track-grounded (acoustically usable), stays within "3 questions max," and captures exactly the cultural/social richness the open-ended worry was about — without a blank-text-box essay.

---

## 3. The three questions — pull channels, not favourites

The three questions are chosen to pull the **three channels of musical identity**, not three "songs you like":

1. **Inherited** — *"What's a song that was always around before you ever chose it?"*
   → family, parents, culture, heritage. **This is where multicultural background surfaces naturally.**

2. **Belonging** — *"What's a song you fell into with other people — a scene, a friend group, a moment you shared?"*
   → friend-group influence, social transmission, the music of a place and time.

3. **Self** — *"What's a song you found on your own that felt like it was yours?"*
   → the first act of taste ownership, the least exposure-contaminated signal.

*What you were given · what you belonged to · what you claimed.* Three tracks, each doing biographical work "pick your top 3" never could, each still a CLAP-groundable point. This honours the principle "picking up from where we can instead of digging back" — three load-bearing anchors, not an excavation of a whole listening history.

---

## 4. Capturing multicultural depth without free text

Two mechanisms, both structured (no essay, no blank page):

1. **Breadth = CLAP distance between inherited and self anchors.** A person formed across two musical worlds has a wider spread between "what was around me" and "what I claimed." That spread is itself a model input: it tells the engine **how much acoustic territory is native/tolerable** to this user. Narrow spread → tight basin; wide spread → wide basin.

2. **Allow a second inherited anchor** when relevant: *"Was there more than one kind of music around you growing up?"* → yes → second inherited track. This captures a bicultural/multicultural household far better than free text, and stays acoustically grounded. The second inherited anchor is the structured replacement for "tell me your whole background in a text box."

**Why not free text?** Free text adds friction, a blank-page problem, and — critically — **no acoustic grounding** (you can't navigate from prose). Structured provenance captures ~80% of the cultural/social signal at a fraction of the cost. Reject free-text biography as the primary mechanism.

---

## 5. Weighting logic — formative anchors vs recent signals

The second half of the REVISIT item: formative anchors must weight differently from recent replay signals.

```
effective_weight(anchor) = base(source) × developmental_gain(era) × recency_decay(t)
```

- **Formative anchors set the prior SHAPE** — the home-territory centroid(s) and the acceptable breadth of the basin. They have **high pseudo-count, wide variance, and recency_decay ≈ 1 (they do not fade).** You don't respond identically to everything near a formative anchor, but formative anchors *bound* the space and define its centre of gravity.

- **Inherited anchors specifically weight a familiarity/comfort axis** — distinct from acoustic preference. They explain acceptance of acoustically-distant music via cultural memory. This is a signal recent behaviour cannot produce, so inherited anchors get the slowest decay and the widest tolerance radius.

- **Recent behavioural signals** (replay, skip, completion from the probe and from listening) have **low individual weight, fast update, steep recency decay.** They **sculpt within the basin** the anchors define — they do not redraw it.

Mental model: formative anchors are the **terrain** (slow, stable, defines where the valleys are); recent signals are the **weather** (fast, local, moves within the terrain).

---

## 6. Connection to the acoustic probe — one flow, not two

Critical: **anchors are seeds for the probe, not ground truth.** People misremember formative tracks and *perform* taste at onboarding (naming the impressive thing, not the true thing) — a real attribution confound. So:

1. Biographical onboarding collects the 3–4 anchors → CLAP embeddings → initial territory centroid(s) and basin width.
2. These **seed the Bayesian probe's starting points** (instead of generic probes spanning the whole space, probes are chosen near and between the anchors for maximum information gain).
3. Behavioural response to the probe **confirms or corrects** each anchor's weight. An anchor the user named but doesn't actually respond to gets down-weighted; the terrain is adjusted.

This unifies the two cold-start systems the docs insist are both required: **biographical seeds, behavioural validates.** Neither alone is trusted; together they converge fast.

---

## 7. Open sub-decisions (need founder call before building)

1. **Does "self" outweigh "inherited," or do they weight different axes?**
   Position: they weight **different axes** — *self* sets the centre (least-contaminated preference signal), *inherited* sets breadth/tolerance (cultural-comfort signal). They should not compete on one scalar. *Open to challenge.*

2. **Era — asked or inferred?**
   Asking ("how old were you?") is one extra tap per anchor but precise. Inferring from the source question (inherited ≈ childhood, belonging ≈ adolescence, self ≈ variable) is frictionless but lossy. Position: **infer by default, allow optional correction.** *Open.*

3. **Missing channels.** Not everyone has all three (no musical household → no inherited anchor). Does a missing channel become signal in itself (e.g. "self-made taste, narrow inherited basin"), or do you let the user give two self-anchors? Position: **missing inherited is signal** (treat as a self-originated taste with a narrow inherited basin), but allow a second self-anchor so onboarding never dead-ends. *Open.*

---

## 8. Why this doubles as the first product moment & the viral artifact

The act of articulating *what was given, what you belonged to, what you claimed* is **itself the first product value** — before the engine does anything. It is a small, true, shareable self-portrait ("my musical biography in three songs and where they came from"). This is the Letterboxd-diary mechanism (low-stakes logging that feels personal, not like publishing) and a candidate for the **shareable artifact** that tests stranger-curiosity. See STRATEGIC_AUDIT.md §8–9: the onboarding *is* the cheapest demand test.

---

## 9. Summary of decisions

| Decision | Value |
|---|---|
| Anchor unit | `(track, source, era)` tuple — not a bare track |
| Number of questions | 3 (inherited / belonging / self), +1 optional second inherited |
| Cultural/social capture | provenance metadata + inherited–self CLAP spread + optional 2nd inherited; **no free-text biography** |
| Weighting | `base(source) × developmental_gain(era) × recency_decay(t)`; formative = terrain (no decay, wide variance), recent = weather (fast decay, sculpts within basin) |
| Inherited anchors | weight a distinct familiarity/comfort axis (slowest decay, widest tolerance) |
| Relationship to probe | anchors **seed** the probe; behaviour **validates/corrects** — one unified cold-start flow |
| Still open | self-vs-inherited weighting; era asked-vs-inferred; missing-channel handling (§7) |

---

*Resolves REVISIT.md 🔴 "Biographical cold start — design needed" (design level). Implementation-level data model to be specified in WOODY_BUILD_SPEC.md once the three §7 sub-decisions are closed and gate_listen has passed.*
