# Woody

**An adaptive music companion for hands-busy moments — it picks the next track *while you move*, instead of making you plan a queue or skip mid-run.**

Woody is a personal project. I built it to play my own music the way I like on runs and other times my hands are busy, and I'm open-sourcing it in case the ideas or the code are useful to anyone else. It is an honest experiment, not a product — see [Status](#status) below.

<!-- Add a screenshot or short GIF of the app here — it's the single biggest thing that makes a repo feel alive:
![Woody](docs/screenshot.png)
-->

## The idea

A playlist is a *set* of songs. Woody is a *path* through them.

Most music apps hand you a bag of tracks and let you skip. But when you're running (or riding, or cleaning), you can't curate — your hands and attention are on the thing you're doing. Woody's bet is that the valuable move is **choosing what should come next, one track at a time, so the sequence feels timed to the moment without you managing it.**

It works on **sound, not tags**. Every track is turned into a vector by [CLAP](https://github.com/LAION-AI/CLAP) (a model that embeds audio and text into the same space), so "what fits next" is measured by how the music actually *sounds* — not by genre labels or by "people who played X also played Y." That lets it move between two songs that share a feel even if they'd never share a genre.

The other half is **honesty about evidence.** Woody refuses to pretend it knows more than it does:

- Finishing a track is *neutral*, never counted as "you loved it."
- Silence or a dropped connection is a *gap*, not a preference.
- A skip means "wrong *now*," not "wrong forever" — and never "why."
- It never invents acoustic facts (BPM, key, energy) it hasn't actually measured.

## How it works

- A **Python acoustic service** holds a corpus of tracks as CLAP embeddings and answers one question at a time: *given the current track and a stated direction, what's the best next track?* Selection is deterministic and reproducible, scored mostly on transition coherence with a gentle pull toward your chosen direction.
- A **Next.js web app** (built for iPhone Safari) is the control surface. It drives the **official Spotify app** as the audio device, observes natural playback (skips from your headphones, watch, or phone; how much of each track you actually heard), and stores everything locally.
- Nothing about Spotify's audio is captured or analysed — Woody only ever sees playback *events*, and any local audio experiments use files you provide yourself.

## Tech

Next.js 16 · TypeScript · Python (FastAPI) · CLAP embeddings · SQLite · Spotify Web API

## Getting started

**Prerequisites:** Node 20.9+ (24 recommended), Python 3.11, Spotify **Premium**, and a Spotify developer app.

```powershell
# 1. Web app
Copy-Item .env.local.example .env.local   # fill in your Spotify + AI keys
npm install

# 2. Acoustic service (separate terminal)
cd packages/acoustic-service
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8765

# 3. Run the web app (back in the root, separate terminal)
npm run dev:spotify
```

Register this exact redirect URI in your Spotify developer dashboard:

```
http://127.0.0.1:8888/api/auth/callback
```

For local-only acoustic-service work you can set `WOODY_ALLOW_UNAUTHENTICATED=1`; otherwise set the same random value in both `WOODY_SERVICE_TOKEN` and `ACOUSTIC_SERVICE_TOKEN`. Access tokens live in HTTP-only cookies; every service endpoint except `/health` requires the shared token.

## Project layout

```
app/                         Next.js pages + authenticated API routes (/api/journey/*, /api/player/*)
components/journey/          The listening + review UI
lib/                         Journey planning, playback observation, local storage
packages/acoustic-service/   Python: CLAP corpus + the one-next-track selector
```

## Status

This is a **personal experiment, honestly incomplete.** The core question — does adaptive one-track-at-a-time selection actually feel better than a good playlist? — hasn't been settled with real side-by-side runs yet. The acoustic engine is real; the "it feels better" claim is not proven. I'm sharing it as a working sketch of an idea I find interesting, not a polished or maintained product. Use it, fork it, take the parts you like.

## License

[MIT](LICENSE) © Madhu Racherla
