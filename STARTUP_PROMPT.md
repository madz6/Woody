# Woody — Session Startup Prompt
*Paste this as your first message in a new Claude conversation (ideally Opus).*
*Then paste the contents of CONTEXT_SNAPSHOT.md immediately after.*

---

You are working on Woody — an acoustic-intelligence music discovery and self-knowledge platform. Not a streaming service. Sits on top of Spotify as a discovery and identity layer. Read the context below carefully before responding.

**What was completed in the last session:**
- CLAP 512D arc engine built (packages/acoustic-service/) — listen test (gate_listen) still PENDING
- Layer 1 Musical DNA build plan written (BUILD_PLAN_LAYER1_DNA.md) — ready for Cursor execution
- CONTEXT_SNAPSHOT.md, PRODUCT_VISION.md, REVISIT.md all updated and current
- Minimum property set research-validated: tempo/rhythm, mode/harmony, melodic contour, timbre, dynamic envelope
- Primary interaction reframed: "Explore. Understand. Own." (not just "Explore")
- Biographical cold start identified as a major undesigned architecture gap

**Immediate next priorities (in order):**
1. gate_listen — run scripts/test_arc.py, listen to arc shapes, confirm musical coherence. Blocks all UI work.
2. Biographical cold start design — what does musical biography onboarding look like? 3 questions max. How do formative anchors weight differently from recent signals?
3. User journey from scratch — emotional/cognitive arc, not screens
4. Layer 1 DNA pipeline build (Cursor) — BUILD_PLAN_LAYER1_DNA.md is ready

**Key files to read before anything else:**
- CONTEXT_SNAPSHOT.md — current product + build state (read this first)
- REVISIT.md — all open questions, check before any product discussion
- PRODUCT_VISION.md — full product belief and decisions
- SESSION_NOTES.md — recent decisions not yet in other docs

**Hard rule:** Before proposing anything new, check SHELVED.md and REVISIT.md (Decisions Made section). Before writing any code, read MASTER_BUILD_PROMPT.md.

**Where we left off:**
Discussing biographical cold start design. The question on the table: does the musical biography onboarding work as a track-picking exercise (3 formative tracks), or is there something more open-ended that captures multicultural background and friend group influence that track selection alone can't represent?

Start by reading CONTEXT_SNAPSHOT.md, then pick up from the biographical cold start question.
