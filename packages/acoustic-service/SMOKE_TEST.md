# Smoke Test — Woody Arc Engine

This is the **end-to-end verification** the user runs after the build is complete.
It validates every layer from CLAP encoding to the Next.js `/api/arc` route.

> **Prerequisite checklist** (Stage 0 preflight)
>
> - [ ] ffmpeg installed and on PATH (`ffmpeg -version` works)
> - [ ] Python 3.11 venv created in `packages/acoustic-service/.venv`
> - [ ] `pip install -r requirements.txt` succeeded (torch ~1.5 GB; transformers; sqlite-vec)
> - [ ] `ACOUSTIC_SERVICE_URL=http://localhost:8765` added to `.env.local`
> - [ ] Spotify creds set in `.env.local` (already present per Stage 0)
> - [ ] (optional) Modal CLI installed for Step 1.4 parity test

---

## Phase 0 — Start the acoustic service

```powershell
cd packages\acoustic-service
.\.venv\Scripts\Activate.ps1
$env:WOODY_PRELOAD_CLAP = "1"
python -m uvicorn main:app --host 0.0.0.0 --port 8765 --reload
```

First boot downloads CLAP (~1.5 GB) from HuggingFace and loads it.
**Wait until you see `Uvicorn running on http://0.0.0.0:8765`**.

In a new terminal, confirm liveness:

```powershell
curl http://localhost:8765/health
```

Expected:
```json
{"status":"ok","clap_model":"laion/larger_clap_music_and_speech","clap_loaded":true,"preload":true}
```

---

## Phase 1 — Smoke test (~5 minutes)

### Check 1 — Text embedding (latency budget < 100 ms after warm)

```powershell
curl -X POST http://localhost:8765/embed/text `
  -H "Content-Type: application/json" `
  -d '{\"text\": \"late night drive on an empty highway\"}'
```

Pass: response includes a 512-element `embedding` array and `dim: 512`.

### Check 2 — Audio embedding via iTunes fallback (latency budget < 800 ms after warm)

```powershell
curl -X POST http://localhost:8765/embed/audio `
  -H "Content-Type: application/json" `
  -d '{\"artist\": \"Daft Punk\", \"title\": \"Get Lucky\", \"track_id\": \"test\"}'
```

Pass: `audio_source: "itunes"`, embedding is 512-D, no error field.
(`audio_source: "preview_url"` would mean Spotify still serves URLs — also fine.)

### Check 3 — Database init

```powershell
python -m db.init_db
```

Pass: prints `Schema applied. 0 embeddings currently stored.`

### Check 4 — Seed corpus (slow — 30–45 min on CPU)

Start small to verify the path before committing 45 minutes:

```powershell
python -m scripts.seed_corpus --target 30
```

Then for the full run:

```powershell
python -m scripts.seed_corpus --target 500
```

Pass: prints per-batch progress, ends with `DB now contains N embeddings`.

### Check 5 — Listen test (HARD QUALITY GATE)

```powershell
python -m scripts.test_arc
```

Pass criteria (in priority order):

1. **Automated:** the `FAILURE MODE TRIAGE` section reports `All automated checks PASS`.
   If any A–E flag fires, **do not proceed** — diagnose using the matrix
   printed by the script.
2. **Human:** open each printed `LISTEN:` URL. For each shape:
   - `journey`     — feels like movement over 18 tracks
   - `plateau`     — locks in, no jarring drift
   - `discharge`   — first third stays congruent with the start
   - `peak_early`  — peak around track 7–8, natural descent

If anything sounds like shuffle, return to the `FAILURE MODE TRIAGE` matrix and
fix the highest-priority flag before iterating.

### Check 6 — Probe validation

```powershell
python -m scripts.validate_probes
```

Pass: prints `PASS — all probe pairs span the CLAP embedding space adequately`.
If any pair fails, replace one probe in `app/api/probe/route.ts:PROBE_SPECS`
**and** `scripts/validate_probes.py:PROBE_SPECS`, then re-run.

---

## Phase 2 — Next.js end-to-end (~3 minutes)

In a new terminal:

```powershell
cd c:\Users\user\woody
npm run dev:fresh:spotify
```

Wait for `http://127.0.0.1:8888` to come up.

### Check 7 — /api/intent gracefully includes targetEmbedding

```powershell
curl -X POST http://127.0.0.1:8888/api/intent `
  -H "Content-Type: application/json" `
  -d '{\"intent\": \"morning run\"}'
```

Pass: response has `suggestions`, `personaLens`, `mode`, `intent_latency_ms`,
**and** a non-null `targetEmbedding` (512 floats). Existing globe behaviour unchanged.

### Check 8 — /api/arc returns an arc with track metadata

```powershell
curl -X POST http://127.0.0.1:8888/api/arc `
  -H "Content-Type: application/json" `
  -d '{\"intent\": \"deep focus coding session no lyrics\"}'
```

Pass: response has `arcSteps` array (~18 items each with `track` populated),
`arcShape: "plateau"`, `reachedTarget: true|false`, `finalDistance < 0.35`.

### Check 9 — /api/probe returns probes spanning the space

```powershell
curl http://127.0.0.1:8888/api/probe
```

Pass: 8 probes in the response, each with a `track` and 512-D `embedding`,
`spanCheck.ok: true`.

### Check 10 — /api/probe accepts behavioral signals

```powershell
curl -X POST http://127.0.0.1:8888/api/probe `
  -H "Content-Type: application/json" `
  -d '{\"signals\": [{\"probeId\": \"high_energy_warm\", \"signal\": \"replay\"}, {\"probeId\": \"low_energy_cold\", \"signal\": \"skip_immediate\"}]}'
```

Pass: response has `territoryCentroid` (512 floats) and `signalCount: 2`.

---

## Anti-slop checklist (run mentally on every new file)

Per the build plan, each new file must pass all 7:

1. Distance ops on 512-D vectors, not 5-D coords           — `routers/arc.py` ✓
2. No `recommend` / `recommendation` in nav code paths    — verified via grep ✓
3. Did not re-propose A* / 5-D Euclidean / JEPA / etc.    — see SHELVED.md ✓
4. Beam search maintains width > 1 candidates per step    — *greedy-with-relaxation per spec; documented TODO in `routers/arc.py`*
5. Skip handling distinguishes <15% / 15-70% / >70%       — encoded in `PROBE_SIGNAL_WEIGHTS` + `woody-engine.mdc`; runtime handler is deferred
6. PersonaLens used only in search-query path             — `app/api/arc/route.ts` uses it only for the pool ✓
7. CLAP embeddings L2-normalised before storage           — `services/clap_service._l2_normalise` ✓
