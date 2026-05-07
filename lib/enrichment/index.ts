import { getLastFmData } from './lastfm'
import { getMusicBrainzData } from './musicbrainz'

export type EnrichedTrackData = {
  mbid?: string
  tags?: string[]
  releaseYear?: number
  listeners?: number
  similar?: { name: string; artist: string }[]
}

/** One-line copy for map / queue tooltips from merged Last.fm + MusicBrainz data. */
export function enrichmentSummaryLine(data: EnrichedTrackData | undefined): string | null {
  if (!data) return null
  const parts: string[] = []
  if (data.releaseYear != null) parts.push(String(data.releaseYear))
  if (data.tags?.length) parts.push(data.tags.slice(0, 5).join(', '))
  if (data.listeners != null) parts.push(`${data.listeners.toLocaleString()} listeners`)
  if (data.similar?.length) {
    parts.push(`like ${data.similar.slice(0, 2).map((s) => s.name).join(', ')}`)
  }
  return parts.length ? parts.join(' · ') : null
}

function dedupeTags(...groups: (string[] | undefined)[]): string[] | undefined {
  const seen = new Set<string>()
  const out: string[] = []
  for (const g of groups) {
    if (!g) continue
    for (const t of g) {
      const key = t.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(t)
    }
  }
  return out.length ? out : undefined
}

export async function enrichTrack(trackName: string, artistName: string): Promise<EnrichedTrackData> {
  try {
    const settled = await Promise.allSettled([
      getMusicBrainzData(trackName, artistName),
      getLastFmData(trackName, artistName),
    ])

    const mb = settled[0].status === 'fulfilled' ? settled[0].value : null
    const lf = settled[1].status === 'fulfilled' ? settled[1].value : null

    const merged: EnrichedTrackData = {}

    if (mb?.mbid) merged.mbid = mb.mbid
    if (mb?.releaseYear !== undefined) merged.releaseYear = mb.releaseYear

    if (lf?.listeners !== undefined) merged.listeners = lf.listeners
    if (lf?.similar?.length) merged.similar = lf.similar

    const tags = dedupeTags(mb?.tags, lf?.tags)
    if (tags?.length) merged.tags = tags

    return merged
  } catch {
    return {}
  }
}
