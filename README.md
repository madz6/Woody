# Woody Run Companion V0

Woody is a private, mobile-first experiment for adaptive music sequencing during low-control journeys. V0 uses running as the first laboratory, controls the official Spotify app on an iPhone, selects one track ahead from a real CLAP embedding corpus, and compares the result with the founder's normal queue in matched pairs.

The execution gate is **completed paired runs, not code shipped**. After the first working adaptive session, feature work pauses until the first adaptive/control pair is complete.

## V0 Boundaries

- iPhone Safari is the control and observation surface; Spotify remains the audio player.
- Spotify Premium and an active iPhone Spotify device are required.
- Live behavior is observed through Spotify state every five seconds. Headphone, Watch, and phone skips use the same observer.
- Upcoming tracks stay hidden. The user edits phases, familiarity balance, and impact windows—not a generated queue.
- Playback behavior and retrospective self-report remain separate evidence channels.
- Route sensing, cadence, heart rate, native iOS, motorbike testing, monetisation, and a learned metric are outside V0.
- The old globe is frozen at `/legacy` in development only.

## Architecture

- `app/` — Next.js 16 mobile UI and authenticated server routes.
- `components/journey/` — setup, editable preview, run observer, override recovery, and review.
- `lib/journey.ts` — validated plan schema and deterministic AI fallback.
- `lib/playbackObserver.ts` — natural completion, manual transition, and external override reducer.
- `lib/journeyStorage.ts` — versioned browser storage and JSON export.
- `packages/acoustic-service/` — protected FastAPI CLAP corpus and deterministic one-track selector.
- `packages/acoustic-service/data/woody.db` — local corpus; ignored by Git and uploaded separately to Modal.

The V0 selector uses only the 364 stored CLAP embeddings. Missing tempo, energy, danceability, and 5D values do not influence selection.

## Local Setup

Prerequisites: Node 20.9+ (Node 24 is used locally), Python 3.11, Spotify Premium, and a Spotify developer app.

```powershell
Copy-Item .env.local.example .env.local
npm install

cd packages/acoustic-service
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8765
```

In another terminal:

```powershell
npm run dev:spotify
```

Register this exact local Spotify callback:

```text
http://127.0.0.1:8888/api/auth/callback
```

Set `WOODY_ALLOW_UNAUTHENTICATED=1` only for isolated local acoustic-service work, or set the same long random value in `WOODY_SERVICE_TOKEN` and `ACOUSTIC_SERVICE_TOKEN`.

## Journey APIs

- `POST /api/journey/plan` — validate setup and return editable phases/tags with deterministic fallback.
- `POST /api/journey/anchor` — ensure a selected anchor exists in the acoustic corpus.
- `POST /api/journey/next` — request one reproducible next-track decision.
- `GET /api/spotify/context` — deduplicate recent, medium-term top, and first 200 saved tracks.
- `GET /api/player/devices` and `GET /api/player/state` — observe the official Spotify player.
- `POST /api/player/play` and `POST /api/player/queue` — control the active Spotify device.

Access tokens remain in HTTP-only server cookies. Journey and player routes require a valid Spotify session. The acoustic service requires its shared bearer token on every non-health endpoint.

## Validation

```powershell
npm test
npm run lint
npm run build
npm audit --omit=dev
npx tsc --noEmit --incremental false

cd packages/acoustic-service
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m compileall -q .
```

Before deployment, also scan tracked files and reachable Git history for credentials. Do not commit `.env.local`, `woody.db`, listen-test output, Vercel state, caches, or build artifacts.

## Private Deployment

1. Revoke the previously exposed Gemini key in Google AI Studio and add only the rotated key to local/Vercel environment storage.
2. Create an empty private GitHub repository, add it as `origin`, scan tracked files and reachable history, then push.
3. After verifying the sanitized remote, expire local reflogs and garbage-collect the dangling secret-bearing commit.
4. Follow `packages/acoustic-service/README.md` to create the Modal volume/secret, upload `woody.db`, and deploy.
5. Import the private GitHub repository in Vercel and set Spotify, AI, and acoustic-service variables from `.env.local.example`.
6. Add `https://<private-vercel-host>/api/auth/callback` to Spotify and set it as `SPOTIFY_REDIRECT_URI` in Vercel.

Spotify documents Premium requirements and mobile Safari interaction constraints for playback integrations. Keep this prototype private and noncommercial.

## Reality-Contact Gate

Run four matched pairs in this order: A/C, C/A, A/C, C/A. Match route, duration, and intended effort. After each run, record timing/support, management effort, sustained-effort support, impact moments, weak transitions, and preference.

Pass only when adaptive is preferred in at least three pairs, uses fewer interventions in at least three, creates specifically well-timed impact in at least two sessions, is chosen voluntarily for run nine, and the motorbike problem interview confirms recurring pain and later-test willingness.

`THE_PATH.md` is the canonical operating decision. Stale root Markdown files are archived only after the first matched pair, not before.
