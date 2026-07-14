"""Audio source resolver.

Spotify deprecated `preview_url` for new client registrations in 2024. This
module provides an iTunes Search API fallback that maps Spotify track metadata
(artist + title) to a 30-second m4a preview URL. The downstream CLAP encoder
does not care which CDN the audio comes from.

The resolver is best-effort: an empty result is normal and the caller must
handle it. No exceptions are raised for "no match found" — only for transport
failures.
"""

from __future__ import annotations

import asyncio
import re
from typing import Optional
from urllib.parse import urlparse

import httpx

ITUNES_SEARCH_URL = "https://itunes.apple.com/search"
HTTP_TIMEOUT = 8.0
MAX_AUDIO_BYTES = 15 * 1024 * 1024
ALLOWED_AUDIO_HOST_SUFFIXES = (".apple.com", ".mzstatic.com", ".scdn.co")


def _normalise(text: str) -> str:
    """Lowercase + strip punctuation for fuzzy artist/title matching."""
    return re.sub(r"[^a-z0-9 ]+", "", text.lower()).strip()


def _scores_match(target_artist: str, target_title: str, candidate: dict) -> float:
    """Return a 0..1 confidence that the iTunes candidate matches the target.

    Hard requirements:
      - The candidate's track name must share at least one substantive token with target_title.
      - The candidate's artist must share at least one substantive token with target_artist.

    Bonus:
      - Exact normalised match on either field.
      - Track name token overlap density.
    """
    cand_artist = _normalise(candidate.get("artistName", ""))
    cand_title = _normalise(candidate.get("trackName", ""))
    t_artist = _normalise(target_artist)
    t_title = _normalise(target_title)

    if not cand_artist or not cand_title or not t_artist or not t_title:
        return 0.0

    artist_tokens = set(t_artist.split())
    title_tokens = set(t_title.split())
    cand_artist_tokens = set(cand_artist.split())
    cand_title_tokens = set(cand_title.split())

    if not (artist_tokens & cand_artist_tokens):
        return 0.0
    if not (title_tokens & cand_title_tokens):
        return 0.0

    score = 0.5
    if cand_artist == t_artist:
        score += 0.25
    if cand_title == t_title:
        score += 0.25
    # Track titles often have parenthetical suffixes; reward token density
    title_overlap = len(title_tokens & cand_title_tokens) / max(1, len(title_tokens))
    score += title_overlap * 0.2
    return min(1.0, score)


async def resolve_itunes_preview(
    client: httpx.AsyncClient,
    artist: str,
    title: str,
    country: str = "us",
    limit: int = 8,
) -> Optional[str]:
    """Return a 30-second m4a preview URL from iTunes Search API, or None.

    Parameters
    ----------
    client : httpx.AsyncClient
        Shared client so callers can batch concurrently.
    artist : str
        Track artist name (primary artist is fine; feat. is ignored).
    title : str
        Track title (may include parenthetical version info).
    country : str
        iTunes Store country code. Defaults to 'us' which has the broadest catalogue.
    limit : int
        Max candidates to fetch from iTunes before scoring.
    """
    if not artist or not title:
        return None

    # Strip "(feat. ...)" from artist to improve match rate
    artist_clean = re.sub(r"\s*\(feat\..*?\)", "", artist, flags=re.IGNORECASE).strip()
    query = f"{artist_clean} {title}"
    params = {
        "term": query,
        "entity": "song",
        "limit": str(limit),
        "country": country,
    }

    try:
        resp = await client.get(ITUNES_SEARCH_URL, params=params, timeout=HTTP_TIMEOUT)
        resp.raise_for_status()
    except (httpx.HTTPError, httpx.TimeoutException):
        return None

    data = resp.json()
    candidates = data.get("results") or []
    if not candidates:
        return None

    # Score candidates and pick the highest with a preview URL
    scored = []
    for c in candidates:
        if not c.get("previewUrl"):
            continue
        score = _scores_match(artist_clean, title, c)
        if score > 0:
            scored.append((score, c["previewUrl"]))

    if not scored:
        return None

    scored.sort(key=lambda x: x[0], reverse=True)
    best_score, best_url = scored[0]
    # Require a minimum confidence to avoid returning unrelated tracks
    if best_score < 0.6:
        return None
    return best_url


async def resolve_audio_url(
    client: httpx.AsyncClient,
    preview_url: Optional[str] = None,
    artist: Optional[str] = None,
    title: Optional[str] = None,
) -> Optional[str]:
    """Pick an audio source: explicit preview_url wins, else iTunes lookup.

    Returns None if neither path yields a fetchable preview.
    """
    if preview_url and preview_url.strip():
        return preview_url
    if artist and title:
        return await resolve_itunes_preview(client, artist, title)
    return None


async def fetch_audio_bytes(client: httpx.AsyncClient, url: str) -> Optional[bytes]:
    """Download an audio file. Returns None on failure (callers handle gracefully)."""
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()
    if parsed.scheme != "https" or not any(hostname.endswith(suffix) for suffix in ALLOWED_AUDIO_HOST_SUFFIXES):
        return None
    try:
        async with client.stream("GET", url, timeout=HTTP_TIMEOUT, follow_redirects=True) as resp:
            resp.raise_for_status()
            final_host = (resp.url.host or "").lower()
            if not any(final_host.endswith(suffix) for suffix in ALLOWED_AUDIO_HOST_SUFFIXES):
                return None
            content_length = int(resp.headers.get("content-length", "0") or "0")
            if content_length > MAX_AUDIO_BYTES:
                return None
            chunks: list[bytes] = []
            total = 0
            async for chunk in resp.aiter_bytes():
                total += len(chunk)
                if total > MAX_AUDIO_BYTES:
                    return None
                chunks.append(chunk)
            return b"".join(chunks)
    except (httpx.HTTPError, httpx.TimeoutException):
        return None


# Synchronous convenience wrapper for scripts that don't run in an event loop
def resolve_itunes_preview_sync(artist: str, title: str, country: str = "us") -> Optional[str]:
    """Sync variant for one-off CLI use (seed_corpus.py)."""

    async def _run() -> Optional[str]:
        async with httpx.AsyncClient() as client:
            return await resolve_itunes_preview(client, artist, title, country)

    return asyncio.run(_run())
