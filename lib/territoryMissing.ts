import type { TasteProfile, Track, TrackSuggestion } from './types'
import { getRecommendations } from './spotify'

const toneToGenres: Record<TrackSuggestion['tone'], string[]> = {
  violet: ['electronic', 'ambient', 'chill'],
  amber: ['dance', 'house', 'hip-hop'],
  moss: ['folk', 'acoustic', 'country'],
  rose: ['indie', 'alternative', 'r-n-b'],
}

const DEFAULT_TONES: TrackSuggestion['tone'][] = ['violet', 'amber', 'moss', 'rose']

export async function fetchTerritoryMissing(
  profile: TasteProfile,
  excludeIds: string[]
): Promise<TrackSuggestion[]> {
  const tones =
    profile.dominantTones.length > 0 ? profile.dominantTones : DEFAULT_TONES
  const seeds = tones.flatMap((t) => toneToGenres[t] ?? ['indie']).slice(0, 5)

  const tracks = await getRecommendations({
    seedGenres: seeds,
    targetEnergy:
      profile.avgEnergy === 'high' ? 0.78 : profile.avgEnergy === 'low' ? 0.32 : 0.52,
    limit: 24,
  })

  const exclude = new Set(excludeIds)
  const filtered: Track[] = tracks.filter((t: Track) => !exclude.has(t.id)).slice(0, 4)

  return filtered.map((track: Track, i) => ({
    track,
    reason: 'belongs in your territory',
    tone: tones[i % tones.length]!,
  }))
}
