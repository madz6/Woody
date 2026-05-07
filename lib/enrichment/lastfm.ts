function asTopTracks(toptracks: unknown): Array<{ name?: string; artist?: { name?: string } | string }> {
  if (!toptracks || typeof toptracks !== 'object') return []
  const track = (toptracks as { track?: unknown }).track
  if (Array.isArray(track)) return track as Array<{ name?: string; artist?: { name?: string } | string }>
  if (track && typeof track === 'object') return [track as { name?: string; artist?: { name?: string } | string }]
  return []
}

/** Returns name/artist pairs from track.getSimilar -- no Spotify resolution. */
export async function getLastFmSimilarTracks(
  trackName: string,
  artistName: string,
  limit = 8
): Promise<{ name: string; artist: string }[]> {
  const apiKey = process.env.LASTFM_API_KEY
  if (!apiKey) return []
  try {
    const params = new URLSearchParams({
      method: 'track.getSimilar',
      track: trackName,
      artist: artistName,
      autocorrect: '1',
      limit: String(limit),
      api_key: apiKey,
      format: 'json',
    })
    const res = await fetch(`http://ws.audioscrobbler.com/2.0/?${params.toString()}`)
    if (!res.ok) return []
    const data = (await res.json()) as { similartracks?: unknown; error?: number }
    if (data.error != null) return []
    return asSimilarTracks(data.similartracks)
      .map((s) => ({
        name: s?.name?.trim() ?? '',
        artist: artistNameFromSimilar(s?.artist).trim(),
      }))
      .filter((s) => s.name && s.artist)
  } catch {
    return []
  }
}

/** Returns artist names similar to a given artist from artist.getSimilar. */
export async function getLastFmArtistSimilar(
  artistName: string,
  limit = 5
): Promise<string[]> {
  const apiKey = process.env.LASTFM_API_KEY
  if (!apiKey) return []
  try {
    const params = new URLSearchParams({
      method: 'artist.getSimilar',
      artist: artistName,
      autocorrect: '1',
      limit: String(limit),
      api_key: apiKey,
      format: 'json',
    })
    const res = await fetch(`http://ws.audioscrobbler.com/2.0/?${params.toString()}`)
    if (!res.ok) return []
    const data = (await res.json()) as {
      similarartists?: { artist?: Array<{ name?: string }> | { name?: string } }
      error?: number
    }
    if (data.error != null) return []
    const artists = data.similarartists?.artist
    const list = Array.isArray(artists) ? artists : artists ? [artists] : []
    return list.map((a) => a.name?.trim() ?? '').filter(Boolean)
  } catch {
    return []
  }
}

/** Returns name/artist pairs from artist.getTopTracks -- no Spotify resolution. */
export async function getLastFmArtistTopTracks(
  artistName: string,
  limit = 8
): Promise<{ name: string; artist: string }[]> {
  const apiKey = process.env.LASTFM_API_KEY
  if (!apiKey) return []
  try {
    const params = new URLSearchParams({
      method: 'artist.getTopTracks',
      artist: artistName,
      autocorrect: '1',
      limit: String(limit),
      api_key: apiKey,
      format: 'json',
    })
    const res = await fetch(`http://ws.audioscrobbler.com/2.0/?${params.toString()}`)
    if (!res.ok) return []
    const data = (await res.json()) as { toptracks?: unknown; error?: number }
    if (data.error != null) return []
    return asTopTracks(data.toptracks)
      .map((s) => ({
        name: s?.name?.trim() ?? '',
        artist: artistNameFromSimilar(s?.artist).trim() || artistName,
      }))
      .filter((s) => s.name)
  } catch {
    return []
  }
}

function asTagArray(toptags: unknown): Array<{ name?: string }> {
  if (!toptags || typeof toptags !== 'object') return []
  const tag = (toptags as { tag?: unknown }).tag
  if (Array.isArray(tag)) return tag as Array<{ name?: string }>
  if (tag && typeof tag === 'object') return [tag as { name?: string }]
  return []
}

function asSimilarTracks(similartracks: unknown): Array<{ name?: string; artist?: { name?: string } | string }> {
  if (!similartracks || typeof similartracks !== 'object') return []
  const track = (similartracks as { track?: unknown }).track
  if (Array.isArray(track)) return track as Array<{ name?: string; artist?: { name?: string } | string }>
  if (track && typeof track === 'object') return [track as { name?: string; artist?: { name?: string } | string }]
  return []
}

function artistNameFromSimilar(artist: { name?: string } | string | undefined): string {
  if (!artist) return ''
  if (typeof artist === 'string') return artist
  return artist.name ?? ''
}

export async function getLastFmData(
  trackName: string,
  artistName: string
): Promise<{
  tags?: string[]
  similar?: { name: string; artist: string }[]
  listeners?: number
} | null> {
  const apiKey = process.env.LASTFM_API_KEY
  if (!apiKey) return null

  try {
    const params = new URLSearchParams({
      method: 'track.getInfo',
      api_key: apiKey,
      artist: artistName,
      track: trackName,
      format: 'json',
    })

    const url = `http://ws.audioscrobbler.com/2.0/?${params.toString()}`

    const res = await fetch(url)
    if (!res.ok) return null

    const data = (await res.json()) as {
      track?: {
        listeners?: string
        toptags?: unknown
        similartracks?: unknown
      }
      error?: number
      message?: string
    }

    if (data.error != null) return null

    const tr = data.track
    if (!tr) return null
    const tagNames = asTagArray(tr.toptags)
      .map((t) => t?.name)
      .filter((n): n is string => Boolean(n && n.trim()))
    const similarRaw = asSimilarTracks(tr.similartracks)
    const similar = similarRaw
      .map((s) => ({
        name: s?.name?.trim() ?? '',
        artist: artistNameFromSimilar(s?.artist).trim(),
      }))
      .filter((s) => s.name)
    const listenersStr = tr.listeners
    const listeners =
      typeof listenersStr === 'string' && listenersStr.trim() !== ''
        ? parseInt(listenersStr, 10)
        : undefined
    const out: { tags?: string[]; similar?: { name: string; artist: string }[]; listeners?: number } = {}
    if (tagNames.length) out.tags = tagNames
    if (similar.length) out.similar = similar
    if (listeners !== undefined && Number.isFinite(listeners)) out.listeners = listeners
    return Object.keys(out).length ? out : {}
  } catch {
    return null
  }
}
