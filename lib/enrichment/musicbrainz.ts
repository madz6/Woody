let lastMusicBrainzCallMs = 0

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function throttleMusicBrainz(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastMusicBrainzCallMs
  if (elapsed < 1100) {
    await sleep(1100 - elapsed)
  }
  lastMusicBrainzCallMs = Date.now()
}

function parseReleaseYear(firstReleaseDate: unknown): number | undefined {
  if (typeof firstReleaseDate !== 'string' || !firstReleaseDate) return undefined
  const year = parseInt(firstReleaseDate.slice(0, 4), 10)
  return Number.isFinite(year) ? year : undefined
}

export async function getMusicBrainzData(
  trackName: string,
  artistName: string
): Promise<{
  mbid?: string
  tags?: string[]
  releaseYear?: number
} | null> {
  try {
    await throttleMusicBrainz()

    const url = `https://musicbrainz.org/ws/2/recording?query=recording:"${encodeURIComponent(trackName)}"+AND+artist:"${encodeURIComponent(artistName)}"&fmt=json&limit=1`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Woody/0.1 (woody-app)' },
    })

    if (!res.ok) return null

    const data = (await res.json()) as {
      recordings?: Array<{
        id?: string
        tags?: Array<{ name?: string }>
        'first-release-date'?: string
      }>
    }

    const rec = data.recordings?.[0]
    if (!rec?.id) return null

    const tags = Array.isArray(rec.tags)
      ? rec.tags.map((t) => t?.name).filter((n): n is string => Boolean(n && n.trim()))
      : undefined

    const releaseYear = parseReleaseYear(rec['first-release-date'])

    return {
      mbid: rec.id,
      ...(tags?.length ? { tags } : {}),
      ...(releaseYear !== undefined ? { releaseYear } : {}),
    }
  } catch {
    return null
  }
}
