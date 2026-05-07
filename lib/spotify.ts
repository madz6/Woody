// Spotify API service for Woody
// Handles auth token management and track search/recommendations

import type { Track } from './types'

const SPOTIFY_API = 'https://api.spotify.com/v1'
const SPOTIFY_AUTH = 'https://accounts.spotify.com/api/token'

// ── Server-side: get client credentials token (for search, no user needed) ──
let _clientToken: string | null = null
let _clientTokenExpiry: number = 0

export async function getClientToken(): Promise<string> {
  if (_clientToken && Date.now() < _clientTokenExpiry) return _clientToken

  const id = process.env.SPOTIFY_CLIENT_ID?.trim()
  const secret = process.env.SPOTIFY_CLIENT_SECRET?.trim()
  if (!id || !secret) throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET missing')

  const creds = Buffer.from(`${id}:${secret}`).toString('base64')

  const res = await fetch(SPOTIFY_AUTH, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) throw new Error(`Spotify auth failed: ${res.status}`)

  const data = await res.json()
  _clientToken = data.access_token
  _clientTokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return _clientToken!
}

// ── Search tracks ──
export async function searchTracks(query: string, limit = 5) {
  const token = await getClientToken()
  const params = new URLSearchParams({
    q: query,
    type: 'track',
    limit: String(limit),
    market: 'US',
  })

  const res = await fetch(`${SPOTIFY_API}/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error(`Spotify search failed: ${res.status}`)

  const data = await res.json()
  return data.tracks.items.map(spotifyTrackToWoody)
}

// ── Recommendation genre seeds (Spotify rejects unknown genre strings) ──
let genreSeedsCache: { genres: Set<string>; at: number } | null = null
const GENRE_CACHE_MS = 60 * 60 * 1000

const FALLBACK_GENRE_SEEDS = [
  'indie',
  'pop',
  'rock',
  'electronic',
  'alternative',
  'ambient',
  'dance',
  'hip-hop',
  'r-n-b',
  'jazz',
  'folk',
  'soul',
  'house',
]

async function fetchAvailableGenreSeeds(token: string): Promise<Set<string>> {
  if (genreSeedsCache && Date.now() - genreSeedsCache.at < GENRE_CACHE_MS) {
    return genreSeedsCache.genres
  }
  const res = await fetch(`${SPOTIFY_API}/recommendations/available-genre-seeds`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    genreSeedsCache = { genres: new Set(FALLBACK_GENRE_SEEDS), at: Date.now() }
    return genreSeedsCache.genres
  }
  const data = (await res.json()) as { genres?: string[] }
  const list = data.genres ?? []
  const genres = new Set(list.length > 0 ? list : FALLBACK_GENRE_SEEDS)
  genreSeedsCache = { genres, at: Date.now() }
  return genres
}

function normalizeGenreSeed(g: string): string {
  return g.toLowerCase().trim().replace(/\s+/g, '-')
}

/** Map AI-ish labels to Spotify’s hyphenated genre seeds when possible. */
const GENRE_ALIASES: Record<string, string> = {
  rnb: 'r-n-b',
  'r&b': 'r-n-b',
  rb: 'r-n-b',
  'hip-hop': 'hip-hop',
  hiphop: 'hip-hop',
  'hip hop': 'hip-hop',
  'indie-rock': 'indie',
  indiepop: 'indie-pop',
}

function resolveSeedGenres(requested: string[], valid: Set<string>): string[] {
  const out: string[] = []
  for (const raw of requested) {
    let n = normalizeGenreSeed(raw)
    n = GENRE_ALIASES[n] ?? n
    if (valid.has(n) && !out.includes(n)) out.push(n)
    if (out.length >= 5) break
  }
  if (out.length > 0) return out
  for (const f of FALLBACK_GENRE_SEEDS) {
    if (valid.has(f)) out.push(f)
    if (out.length >= 2) break
  }
  if (out.length > 0) return out
  return Array.from(valid).slice(0, 2)
}

// ── Get recommendations based on seed tracks ──
export async function getRecommendations({
  seedTracks = [],
  seedArtists = [],
  seedGenres = [],
  targetEnergy,
  targetValence,
  targetTempo,
  limit = 10,
}: {
  seedTracks?: string[]
  seedArtists?: string[]
  seedGenres?: string[]
  targetEnergy?: number     // 0.0–1.0
  targetValence?: number    // 0.0–1.0 (sad → happy)
  targetTempo?: number      // BPM
  limit?: number
}) {
  const token = await getClientToken()

  const params = new URLSearchParams({ limit: String(limit), market: 'US' })

  if (seedTracks.length) params.set('seed_tracks', seedTracks.slice(0, 5).join(','))
  if (seedArtists.length) params.set('seed_artists', seedArtists.slice(0, 5).join(','))

  if (seedGenres.length) {
    const valid = await fetchAvailableGenreSeeds(token)
    const resolved = resolveSeedGenres(seedGenres, valid)
    if (resolved.length) params.set('seed_genres', resolved.slice(0, 5).join(','))
  }

  if (targetEnergy !== undefined) params.set('target_energy', String(targetEnergy))
  if (targetValence !== undefined) params.set('target_valence', String(targetValence))
  if (targetTempo !== undefined) params.set('target_tempo', String(targetTempo))

  const hasSeed =
    params.has('seed_tracks') || params.has('seed_artists') || params.has('seed_genres')
  if (!hasSeed) {
    const valid = await fetchAvailableGenreSeeds(token)
    const resolved = resolveSeedGenres([], valid)
    if (resolved.length) params.set('seed_genres', resolved.slice(0, 5).join(','))
  }

  const res = await fetch(`${SPOTIFY_API}/recommendations?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.text()
    if (process.env.NODE_ENV === 'development') {
      console.warn('[spotify] recommendations failed', res.status, body.slice(0, 400))
    }
    return []
  }

  const data = (await res.json()) as { tracks?: unknown[] }
  const tracks = data.tracks
  if (!tracks?.length) return []
  return tracks.map(spotifyTrackToWoody)
}

// ── Convert Spotify track object to Woody Track type ──
export function spotifyTrackToWoody(t: any): Track {
  const id = t.id as string
  return {
    id,
    woodyId: id,
    sources: { spotify: id },
    name: t.name,
    artist: t.artists?.[0]?.name ?? 'Unknown',
    album: t.album?.name ?? '',
    albumArt: t.album?.images?.[0]?.url,
    spotifyUri: t.uri,
    durationMs: t.duration_ms,
    previewUrl: t.preview_url,
  }
}

// ── Resolve Last.fm name/artist pairs to Spotify Track objects ──
export async function resolveTracksToSpotify(
  items: { name: string; artist: string }[]
): Promise<Track[]> {
  if (!items.length) return []
  const results = await Promise.all(
    items.map((item) =>
      searchTracks(`${item.name} ${item.artist}`, 1).catch(() => [])
    )
  )
  return results.flat()
}

// ── Get a single track by Spotify ID ──
export async function getTrack(id: string) {
  const token = await getClientToken()
  const res = await fetch(`${SPOTIFY_API}/tracks/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Track fetch failed: ${res.status}`)
  const data = await res.json()
  return spotifyTrackToWoody(data)
}
