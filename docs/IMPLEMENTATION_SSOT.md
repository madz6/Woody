# Historical Document — Superseded

> Historical implementation context only. `README.md` and `THE_PATH.md` are the current authority.

# Implementation single source of truth (this repo)

- **Product app:** Next.js 15 App Router in the repository root (`app/`, `components/`, `lib/`, `hooks/`).
- **Contract for v1 features:** [WOODY-PRD.md](../WOODY-PRD.md) sections *Must-Have P0* and *Should-Have P1* (and its *Current Architecture State* section, kept in sync with the code).
- **Long-form vision / future engine:** [PRD.md](../PRD.md) and [BUILD_BRIEF.md](../BUILD_BRIEF.md) describe a fuller acoustic arc engine (e.g. beam search, vector store, optional FastAPI stack). Those are **not** the checklist for this codebase’s day-to-day implementation unless explicitly ported.
- **P2:** Audio microservice lives under [packages/acoustic-service](../packages/acoustic-service); optional HTTP integration from `lib/acoustic.ts`.

Branch for PRD execution work: `feat/prd-p0-p1-close` (or whatever branch you use for the PR).
