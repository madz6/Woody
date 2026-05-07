# M3 playback — manual regression (P0)

Run in **Chrome or Edge** with **Spotify Premium** at the same origin as `SPOTIFY_REDIRECT_URI` (e.g. `http://127.0.0.1:8888`).

1. **Connect** Spotify (OAuth completes; no server restart needed after reconnect).
2. **Intent** — submit a vibe; wait for nodes on the globe.
3. **Play** — click a suggestion node; audio starts in the Web Player device.
4. **Seek** — in `MiniPlayer`, click ~mid-way on the seek bar; position jumps.
5. **Pause / resume** — transport toggles without leaving the map.
6. **Next / previous** — with at least two tracks queued or from session queue, next/prev advances (queue ordering from map selection uses heuristics).
7. **Reconnect** — optional: clear site cookies for the origin or use Spotify “remove access” then connect again; playback still works after new token.

**Failure triage:** Widevine / DRM off, wrong browser, non-Premium, or redirect URI mismatch → see `WOODY-PRD.md` Known Technical Constraints.
