import { NextRequest, NextResponse } from 'next/server'
import { apiError, badRequest } from '@/lib/apiError'
import { selectJourneyNext, type AcousticJourneyAdjustment } from '@/lib/acousticService'
import { getSpotifyAccessToken, spotifyFetch } from '@/lib/auth/spotifySession'
import { spotifyTrackToWoody } from '@/lib/spotify'

const ADJUSTMENTS = new Set<AcousticJourneyAdjustment>(['closer_to_current', 'different_next', 'change_direction'])

function strings(value: unknown, max: number): string[] | null {
  if (!Array.isArray(value) || value.length > max || !value.every((item) => typeof item === 'string')) return null
  return value
}

export async function POST(request: NextRequest) {
  try {
    await getSpotifyAccessToken()
    const body = (await request.json()) as Record<string, unknown>
    const sessionId = typeof body.sessionId === 'string' && body.sessionId.length <= 128 ? body.sessionId : null
    const decisionIndex = typeof body.decisionIndex === 'number' && Number.isInteger(body.decisionIndex) ? body.decisionIndex : null
    const currentTrackId = typeof body.currentTrackId === 'string' ? body.currentTrackId : null
    const currentTrackArtist = typeof body.currentTrackArtist === 'string' && body.currentTrackArtist.trim().length <= 500
      ? body.currentTrackArtist.trim()
      : null
    const startTrackId = typeof body.startTrackId === 'string' ? body.startTrackId : null
    const direction = typeof body.direction === 'string' && body.direction.trim().length >= 3 && body.direction.trim().length <= 1000
      ? body.direction.trim()
      : null
    const adjustment = body.adjustment === undefined
      ? undefined
      : typeof body.adjustment === 'string' && ADJUSTMENTS.has(body.adjustment as AcousticJourneyAdjustment)
        ? body.adjustment as AcousticJourneyAdjustment
        : null
    const excludeIds = strings(body.excludeIds, 1000)
    const skipPenalties = Array.isArray(body.skipPenalties) && body.skipPenalties.length <= 20
      ? body.skipPenalties.flatMap((candidate) => {
          if (!candidate || typeof candidate !== 'object') return []
          const item = candidate as Record<string, unknown>
          if (
            typeof item.trackId !== 'string'
            || typeof item.weight !== 'number' || item.weight < 0 || item.weight > 1
            || typeof item.decisionsRemaining !== 'number' || !Number.isInteger(item.decisionsRemaining)
            || item.decisionsRemaining < 1 || item.decisionsRemaining > 3
          ) return []
          return [{ trackId: item.trackId, weight: item.weight, decisionsRemaining: item.decisionsRemaining }]
        })
      : null

    if (
      !sessionId || decisionIndex === null || decisionIndex < 0 || decisionIndex > 1000
      || !currentTrackId || !currentTrackArtist || !startTrackId || !direction
      || adjustment === null || !excludeIds || !skipPenalties
      || skipPenalties.length !== (body.skipPenalties as unknown[]).length
    ) return badRequest('invalid_journey_decision_request')

    const selected = await selectJourneyNext({
      sessionId,
      decisionIndex,
      currentTrackId,
      currentTrackArtist,
      startTrackId,
      direction,
      adjustment,
      excludeIds,
      skipPenalties,
    })
    const spotifyResponse = await spotifyFetch(`/tracks/${encodeURIComponent(selected.track.id)}`)
    return NextResponse.json({
      decisionId: selected.decisionId,
      selectedTrack: spotifyTrackToWoody(await spotifyResponse.json()),
      confidence: selected.confidence,
      diagnostics: {
        selectionMode: selected.selectionMode,
        currentEmbeddingAvailable: selected.currentEmbeddingAvailable,
        transitionDistance: selected.transitionDistance,
        targetDistance: selected.targetDistance,
        skipPenalty: selected.skipPenalty,
        relaxationLevel: selected.relaxationLevel,
        candidateCount: selected.candidateCount,
        latencyMs: selected.latencyMs,
        adjustment: selected.adjustment,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.includes('unsupported_current_track') || message.includes('unsupported_start_track')) {
      return NextResponse.json({ error: 'unsupported_track' }, { status: 409 })
    }
    return apiError(error, 'journey_selection_failed')
  }
}
