# gate_listen — The One Runbook

> **Archived preview-era runbook.** Keep this only for reproducing the original corpus listen test. It is not a prerequisite for Journey V0, which no longer fetches audio or requires preview availability at runtime. Use `README.md` for the current product contract and validation commands.

*Created 2026-06-27. This is the only doc you need to run the listen test. Ignore SMOKE_TEST.md / the build plan for this — come back to them later. Goal: hear whether a generated arc sounds like a coherent journey, not shuffle. Everything in the project is downstream of this.*

---

## Before you start (one-time)

- [ ] `ffmpeg -version` works (needed to decode iTunes m4a previews)
- [ ] Python 3.11 venv exists at `packages\acoustic-service\.venv` with `pip install -r requirements.txt` done (torch CPU is the big one)
- [ ] `.env.local` at repo root has `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `ACOUSTIC_SERVICE_URL=http://localhost:8765`
- [x] Delete the stray `packages\acoustic-service\.venv-linux` folder (done — also stops uvicorn `--reload` spam)

---

## ⚠️ Read this first — the corpus-size trap (most important thing on this page)

The automated A–E triage in `test_arc.py` is **only trustworthy on a big enough, diverse enough corpus.** Here's why, from reading the engine:

- The arc is **greedy width-1** (beam search is deliberately Phase 2). It picks the best track per step and removes it from the pool. With a small pool, the late steps run out of good candidates and are *forced* to relax the coherence constraint.
- **Frisson flags** (`relax_level == 0` at 30/65/85% progress) and **coherence** both degrade purely from pool exhaustion when the corpus is small — not because the engine is broken.
- So a 30-track seed will likely fire **false Failure-Mode C (corpus too small), B (greedy/no movement), and E (no frisson)** flags that look like engine bugs but are corpus-size artifacts.

**Therefore:**
- **First listen, just to hear coherence:** seed ~60 and *only* judge how it sounds. Ignore the B/C/E automated flags at this size.
- **Trustworthy automated triage:** seed the full **500** (or at least ~200). Only then does "All automated checks PASS / fail" mean anything.
- Rule of thumb the code implies: **pool should be ≥ 3–4× `arc_length`.** Default arc is ~18–20, so you want 60+ usable embeddings minimum, hundreds to judge frisson.
- Expect **attrition**: iTunes won't have matches for every diverse seed (carnatic, qawwali, industrial techno), so the seeded count lands below your `--target`. Seed higher than you think.

---

## Run it — two terminals

### Terminal 1 — start the service (leave it running)
```powershell
cd packages\acoustic-service
.\.venv\Scripts\Activate.ps1
$env:WOODY_PRELOAD_CLAP = "1"
python -m uvicorn main:app --host 0.0.0.0 --port 8765 --reload
```
First boot downloads CLAP (~1.5 GB) and loads it. **Wait for** `Uvicorn running on http://0.0.0.0:8765`.

### Terminal 2 — db, seed, listen
```powershell
cd packages\acoustic-service
.\.venv\Scripts\Activate.ps1

python -m db.init_db                      # expect: "Schema applied. 0 embeddings..."

# FAST FIRST LISTEN (coherence only — ignore B/C/E flags at this size):
python -m scripts.seed_corpus --target 60

# OR TRUSTWORTHY GATE (do this before believing the triage):
# python -m scripts.seed_corpus --target 500     # ~35–45 min on CPU, one time

python -m scripts.test_arc --arc-length 14        # smaller arc = less pool exhaustion on a small seed
```

If you seeded 500, just `python -m scripts.test_arc` (default arc length 18).

---

## How to judge it (your ears are the gate, not the script)

Open the printed `LISTEN:` Spotify URLs for each shape and ask:

| Shape | Should feel like |
|---|---|
| `journey` | continuous movement A→B over the tracks; no jarring jumps |
| `plateau` | settles into a zone fast and *stays*, no drift |
| `discharge` | first third stays congruent with where it started, *then* moves |
| `peak_early` | builds to a peak around track 6–8, then eases down |

**The real question:** does any single arc produce *"oh — what's the next track, I didn't expect that but it's right"*? That's the moment the whole product is betting on. One arc landing that is worth more than a clean triage.

---

## Reading the automated triage (don't be misled)

- `final_distance` / `reached_target` are only meaningful for **journey** and **plateau**. `peak_early` and `discharge` *intentionally* don't end on the target (peak_early ends ~halfway back), so a "large" final distance there is **correct**, not a failure. Don't treat it as a miss.
- `relaxation_level` per step is the real coherence signal: lots of level-2/3 picks = the pool couldn't sustain a coherent path (usually corpus size on a small seed; possibly local-minima trapping on a big one).
- If flags fire on a **big** seed (500), that's a real signal — paste it to me and we'll diagnose against the A–E matrix.

---

## Static review notes (things I'd watch, from reading the code)

1. **Arbitrary start when `current_position` is None** (`arc.py` ~L170): the arc anchors its start to `candidates[0]` (pool order) interpolated 10% toward target. For a pure listen test that's fine (you're judging movement), but it means `discharge` "stay congruent with the start" is congruent with an essentially *random* track. When you wire real cold-start in, feed a real `current_position`. Not a blocker for gate_listen.
2. **iTunes match threshold 0.6** (`audio_source.py`): conservative — good (avoids wrong audio) but lowers yield on obscure tracks. Another reason seeded count < target.
3. **Greedy width-1 is expected** — the Phase-2 beam TODO is real and acknowledged. Don't "fix" it by adding beam width until a *big-corpus* listen test shows local-minima trapping. Diagnose with `relaxation_level` first.
4. Everything else (L2-norm discipline, cosine on unit vectors, shape waypoint math) looks correct.

---

## When you've run it

Paste me back: (a) the `FAILURE MODE TRIAGE` block, and (b) one sentence on how the `journey` arc actually *sounded*. That's enough for me to tell you whether you're looking at a real engine problem, a corpus problem, or a green light to build the DJ-arc wedge.
