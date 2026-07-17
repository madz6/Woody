import { NextRequest, NextResponse } from 'next/server'
import { apiError, badRequest } from '@/lib/apiError'
import {
  selectJourneyNext,
  type AcousticJourneyPhase,
  type AcousticKnownness,
} from '@/lib/acousticService'
import { getSpotifyAccessToken, spotifyFetch } from '@/lib/auth/spotifySession'
import { spotifyTrackToWoody } from '@/lib/spotify'
import type { AttributionProvenance, JourneyDecision } from '@/lib/types'

const PHASES = new Set<AcousticJourneyPhase>(['settle', 'build', 'sustain', 'impact', 'release'])
const KNOWNNESS = new Set<AcousticKnownness>(['known_track', 'known_artist', 'unseen'])
const PROVENANCE = new Set<AttributionProvenance>(['user_text', 'model_suggested', 'user_confirmed', 'behavior_observed', 'system_inferred'])

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
    const anchorTrackIds = strings(body.anchorTrackIds, 3)
    const anchorSignals = Array.isArray(body.anchorSignals) && body.anchorSignals.length <= 100
      ? body.anchorSignals.flatMap((candidate) => {
          if (!candidate || typeof candidate !== 'object') return []
          const item = candidate as Record<string, unknown>
          if (
            typeof item.field !== 'string' || item.field.length > 128
            || typeof item.text !== 'string' || !item.text.trim() || item.text.trim().length > 500
            || typeof item.source !== 'string' || !PROVENANCE.has(item.source as AttributionProvenance)
          ) return []
          return [{ field: item.field, text: item.text.trim(), source: item.source as AttributionProvenance }]
        })
      : null
    const phase = typeof body.phase === 'string' && PHASES.has(body.phase as AcousticJourneyPhase)
      ? body.phase as AcousticJourneyPhase
      : null
    const phaseDescription = typeof body.phaseDescription === 'string' && body.phaseDescription.trim().length <= 1000
      ? body.phaseDescription.trim()
      : null
    const familiarityTarget = typeof body.familiarityTarget === 'number' && body.familiarityTarget >= 0 && body.familiarityTarget <= 1
      ? body.familiarityTarget
      : null
    const knownTrackIds = strings(body.knownTrackIds, 500)
    const knownArtists = strings(body.knownArtists, 500)
    const excludeIds = strings(body.excludeIds, 1000)
    const recentKnownness = Array.isArray(body.recentKnownness)
      && body.recentKnownness.length <= 20
      && body.recentKnownness.every((item) => typeof item === 'string' && KNOWNNESS.has(item as AcousticKnownness))
      ? body.recentKnownness as AcousticKnownness[]
      : null
    const skipPenalties = Array.isArray(body.skipPenalties) && body.skipPenalties.length <= 20
      ? body.skipPenalties.flatMap((candidate) => {
          if (!candidate || typeof candidate !== 'object') return []
          const item = candidate as Record<string, unknown>
          if (
            typeof item.trackId !== 'string'
            || typeof item.weight !== 'number'
            || item.weight < 0
            || item.weight > 1
            || typeof item.decisionsRemaining !== 'number'
            || !Number.isInteger(item.decisionsRemaining)
            || item.decisionsRemaining < 1
            || item.decisionsRemaining > 3
          ) return []
          return [{ trackId: item.trackId, weight: item.weight, decisionsRemaining: item.decisionsRemaining }]
        })
      : null

    if (
      !sessionId || decisionIndex === null || decisionIndex < 0 || decisionIndex > 1000
      || !currentTrackId || !currentTrackArtist || !anchorTrackIds || !anchorSignals
      || !phase || !phaseDescription || familiarityTarget === null
      || !knownTrackIds || !knownArtists || !recentKnownness || !excludeIds || !skipPenalties
      || skipPenalties.length !== (body.skipPenalties as unknown[]).length
      || anchorSignals.length !== (body.anchorSignals as unknown[]).length
    ) return badRequest('invalid_journey_decision_request')

    const selected = await selectJourneyNext({
      sessionId,
      decisionIndex,
      currentTrackId,
      currentTrackArtist,
      anchorTrackIds,
      anchorSignals,
      phase,
      phaseDescription,
      familiarityTarget,
      knownTrackIds,
      knownArtists,
      recentKnownness,
      excludeIds,
      skipPenalties,
    })
    const spotifyResponse = await spotifyFetch(`/tracks/${encodeURIComponent(selected.track.id)}`)
    const selectedTrack = spotifyTrackToWoody(await spotifyResponse.json())
    const decision: JourneyDecision = {
      decisionId: selected.decisionId,
      selectedTrack,
      phase: selected.phase,
      knownness: selected.track.knownness,
      confidence: selected.confidence,
      diagnostics: {
        selectionMode: selected.selectionMode,
        currentEmbeddingAvailable: selected.currentEmbeddingAvailable,
        transitionDistance: selected.transitionDistance,
        targetDistance: selected.targetDistance,
        familiarityFit: selected.familiarityFit,
        skipPenalty: selected.skipPenalty,
        relaxationLevel: selected.relaxationLevel,
        candidateCount: selected.candidateCount,
        latencyMs: selected.latencyMs,
      },
    }
    return NextResponse.json(decision)
  } catch (error) {
    return apiError(error, 'journey_selection_failed')
  }
}
