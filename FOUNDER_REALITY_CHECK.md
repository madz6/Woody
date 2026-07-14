# Woody — Full Project Audit & Reality Check
*Created 2026-06-27. A complete, unsparing audit: is the idea good, what's going wrong, the deepest pressure test, what's genuinely right, and how to make it better. Grounded in the actual repo state, not just the strategy docs.*
*Companion to STRATEGIC_AUDIT.md (business) and BIOGRAPHICAL_COLD_START.md (design).*

---

## 1. Verdict in three sentences

The idea is good — genuinely differentiated, emotionally true, and aimed at a real underserved niche — but it is **mis-scoped and under-validated**, not under-thought. You have built an 11,000-line documentation cathedral and a real, well-architected engine, and you have **never once run the one test that tells you if any of it works** (`gate_listen` / `test_arc.py`). The single thing you are doing wrong, from which almost everything else follows, is **spending your energy on the activities that feel like progress (planning, deciding, documenting) and avoiding the one cheap experiment that could invalidate the whole thing.**

---

## 2. Is the idea good? — an honest, qualified verdict

**Yes, conditionally — and the condition is empirical, knowable, and untested.**

- **As a beloved niche product / movement / founder-DJ brand:** good. There's a real, global, underserved tribe (music nerds + selectors), a credible $0 channel (you, DJing), a differentiated wedge (cause-not-effect discovery + taste identity), and a defensible long-term moat (accumulated personal territory). This version is achievable by a solo founder.
- **As a venture-scale business:** high-risk. The "acoustic intelligence" graveyard is deep (see STRATEGIC_AUDIT.md §3 — Pandora, Echo Nest), willingness-to-pay for taste tools is low (~$6/yr commodity floor), and the durable-value claim rests on beating Spotify at discovery from session one.
- **As currently scoped (self-knowledge instrument + discovery engine + identity layer + DJ tool + social platform + open infra):** too broad to be good. It's five products in a trenchcoat. Good ideas are good *because they're narrow*; this one's quality is being diluted by its breadth.

**The honest core:** the idea's goodness is gated almost entirely on one fact you can check in a week — *does a generated arc actually produce "the song I didn't know I was looking for" for someone who isn't you?* — and you keep not checking it. Until you do, "is the idea good" is unanswerable, and 11,000 lines of docs is an elaborate way of avoiding the question.

---

## 3. What you're doing wrong (the real patterns)

### 3.1 The documentation cathedral — the central problem
The repo has **35 markdown files, ~11,000 lines** (PRD.md alone is 2,149 lines; WOODY_BUILD_SPEC 1,313; MASTER_BUILD_PROMPT 758). There are **at least four overlapping "what is Woody" docs** (PRD.md, WOODY-PRD.md, WOODY.md, PRODUCT_VISION.md) and **five+ build/spec docs** (MASTER_BUILD_PROMPT, WOODY_BUILD_SPEC, BUILD_BRIEF, BUILD_PLAN, BUILD_PLAN_LAYER1_DNA). Meanwhile git shows **2 commits**, and `test_arc.py` — labelled in its own header as the **"HARD QUALITY GATE"** — has never been run.

This is **productive procrastination**. Documentation feels like de-risking but it isn't; it's risk *deferral*. Every hour spent refining the PRD is an hour not spent finding out whether the thing works. The docs have also become a maintenance tax on yourself — you now have to keep 35 files consistent, which is why you need a `STARTUP_PROMPT` and a session-capture skill just to re-enter your own project. **You have built infrastructure for thinking about Woody instead of Woody.**

A telling detail: `AUDIT.md` shows you **already ran a critical PRD audit on 2026-05-06** (via the idea-prd-killer skill). Seven weeks later, the headline finding — validate the core before building more — is still open, and you've written *more docs* since. The pattern is auditing and planning in place of shipping and testing.

### 3.2 Architecture maximalism before a single validated signal
You've designed (and partly built toward) an 8-layer stack: own DNA pipeline (Essentia + Basic Pitch + madmom + Demucs), CLAP embeddings, 5D projection, knowledge graph, on-device personal LLM, federated learning, agentic layer. **None of it is justified yet**, because the cheapest layer (CLAP arc) hasn't been heard. You are specifying federated differential privacy for a product that has produced zero arcs for zero users. Each unvalidated layer you design is a sunk-cost anchor that makes you *less* able to pivot when the listen test surprises you.

### 3.3 The unproven core conceptual bet
The founding insight — "emotion is downstream of musical structure, so extract the structural cause of a response" — is beautiful and **may be only marginally true in a way that matters for the product** (full pressure test in §4). You've treated it as axiomatic across 11k lines. It's a hypothesis, and it's testable, and you haven't tested it.

### 3.4 Scope and identity sprawl
Across the docs Woody is described as: an instrument for musical self-knowledge, a discovery engine, an identity layer, a purposeful-playback tool, a DJ tool, a community platform, and potential open infrastructure. Each doc re-frames the product. **A founder who can't say what the product is in one sentence with one user will build all of them badly instead of one of them well.**

### 3.5 Zero external contact
Everything is founder-internal. There is no evidence anyone but you has heard an arc, seen the artifact, or reacted to the pitch. For a product whose entire thesis is "this creates a feeling in a listener," the absence of a single outside listener is the highest-leverage gap in the project.

---

## 4. The deepest pressure test — the conceptual core

This is the one I most want you to sit with, because it's load-bearing and nobody has challenged it.

**Claim:** response to music is caused by musical structure; extract the structure (musical DNA) and you can find the cause of a response and navigate by it.

**The steelman of failure:** your *own docs* say response is a function of musical structure **plus** state at reception **plus** environment/device/EQ **plus** biography. If the non-structural factors dominate the variance — and a large body of music-psychology (DeNora, the contextual turn) suggests context often does — then **the structural cause you extract is a minority of what actually drove the response.** In that world, an elaborate DNA pipeline buys you a small slice of explanatory power over a noisy, context-dominated signal.

**Now the sharper, cheaper version of the same point:** CLAP (Layer 2, already built) is trained on hundreds of thousands of text–audio pairs and *already* encodes a huge amount of perceptual/structural similarity. The entire **Layer 1 DNA pipeline you're about to build** (BUILD_PLAN_LAYER1_DNA — Essentia/Basic Pitch/madmom/Demucs) is justified only if it produces **discovery quality meaningfully beyond what CLAP-alone already gives you.** That marginal value is **assumed, not demonstrated.** It is entirely possible that CLAP-only arcs already produce "the song I didn't know I was looking for" — in which case the months of Layer 1 work are premature optimisation — *or* that neither does, in which case the idea needs rework before any more building. **Either outcome is decided by gate_listen.** That one test could save you months or redirect the whole project. You're standing on the answer and not looking down.

**The fix:** before building Layer 1, run gate_listen on **CLAP-only** and answer one question: *does CLAP-alone already produce the moment?* Let the answer decide whether Layer 1 exists at all.

---

## 5. What is genuinely right (so you don't over-correct)

This project is not a mess — that's what makes the above frustrating rather than fatal. Real strengths:

- **The engine is real and well-architected.** `test_arc.py` with A–E failure-mode diagnosis is the work of someone who thinks rigorously. The CLAP/sqlite-vec/beam-search choices are sound and current.
- **The conceptual depth is unusual and real.** The psychology grounding (Levitin → Huron → DeNora → Juslin & Västfjäll) is not decoration; it's a genuine differentiator most founders couldn't articulate.
- **Your decision hygiene is excellent.** REVISIT / SHELVED / SESSION_NOTES is a better decision-trail than most funded startups keep. (The irony: you've applied rigour to *thinking* and avoided it for *testing*.)
- **Founder–market fit is strong and rare.** You are user-zero and a credible DJ channel. That combination is the kind of thing investors and communities actually respond to.
- **The DJ wedge is a genuinely good idea hiding in plain sight** — it's the one piece with a paying user, a channel, and a shareable object all at once (see §6).

---

## 6. How to make it better (concrete)

1. **Pick the wedge and make it the product: the DJ set as an acoustic arc.** Of everything here, this is the only piece that simultaneously has (a) a user who already pays for tools, (b) a $0 distribution channel (you), (c) a built-in shareable artifact, and (d) **no requirement to beat Spotify at discovery.** Make "document and visualise your set as an acoustic journey" the spearpoint. Let the self-knowledge engine ride *underneath* it. The consumer instrument is the vision; the DJ arc is the way in.

2. **Collapse the claim to one sentence, one user, one moment.** e.g. *"Woody turns a DJ set into a living acoustic map — the journey, not the tracklist."* Everything that doesn't serve that sentence goes to SHELVED or a someday/maybe pile. You can re-expand to the self-knowledge platform *after* one thing works.

3. **Make "understanding" recur, or it habituates.** The "why" layer is a *cool-once* novelty as currently framed (the gimmick risk, generalised). Tie it to a **recurring surface**: after each session/set, "here's the acoustic thread you actually followed, and the one moment you lingered on." Insight that arrives every session is a habit; insight delivered once at onboarding is a party trick.

4. **Reframe the moat in your own head.** Stop thinking the pipeline is the moat (it gets absorbed — §3 of STRATEGIC_AUDIT). The moat is **accumulated personal territory + the social/identity object** (the last.fm/Letterboxd data moat). Build for accumulation and shareability from day one; treat the DNA as a quality input, not the defensibility story.

5. **Test CLAP-only before building Layer 1 DNA.** (§4.) Possibly the highest-value single decision in the project.

6. **Do a doc bankruptcy.** Merge 35 files into ~6: one VISION, one SPEC, one BUILD_PLAN, REVISIT, SESSION_NOTES, SHELVED. Archive the rest in `/docs/archive`. The goal isn't tidiness — it's removing the maintenance tax that makes re-entering the project cost a `STARTUP_PROMPT`.

7. **Get one outside listener this week.** Literally one person who isn't you, hearing one arc, on a call, watching their face. That single data point outranks any document you could write.

---

## 7. The two-week reality check (do this instead of more docs)

- **Days 1–2:** Run gate_listen on CLAP-only. Seed the corpus, run `test_arc.py`, *listen with your ears*. Answer: does the moment land for you?
- **Days 3–5:** If yes, get **3 outside people** (a nerd friend, a DJ, a casual listener) to hear an arc and react. Watch for "wait, what *is* this?"
- **Days 6–10:** Turn the musical-biography onboarding into a shareable artifact (BIOGRAPHICAL_COLD_START §8). Post one. Measure stranger curiosity.
- **Days 11–14:** Decide with evidence: (a) the moment lands and strangers care → commit to the DJ-arc wedge and build; (b) CLAP-only is enough → cancel the Layer 1 DNA build, save months; (c) it doesn't land → you've learned the most important thing for the cost of two weeks instead of two years.

No new strategy doc is allowed in these two weeks. The output is *evidence*, not prose.

---

## 8. Decision

The idea is good enough to deserve a real test and currently isn't getting one. **Stop planning and start listening.** Narrow to the DJ-arc wedge, collapse the docs, and let `gate_listen` — run on CLAP-only — decide both whether the idea works *and* whether half your remaining build plan is even necessary. Everything else in the 11,000 lines is downstream of that one unheard sound.

The next action is not in this document. It's `python -m scripts.test_arc`.
