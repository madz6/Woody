import { NextRequest, NextResponse } from 'next/server'
import { embedText, isAcousticServiceEnabled } from '@/lib/acousticService'
import { classifyIntentMode, intentToSuggestions } from '@/lib/intent'
import type { CLAPEmbedding, IntentMemoryEntry, PersonaLens, TasteCentroid } from '@/lib/types'

function parsePreviousLens(value: unknown): PersonaLens | null {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  if (obj.energy !== 'low' && obj.energy !== 'medium' && obj.energy !== 'high') return null
  if (!Array.isArray(obj.mood) || !obj.mood.every((item) => typeof item === 'string')) return null
  if (!Array.isArray(obj.texture) || !obj.texture.every((item) => typeof item === 'string')) return null
  if (obj.tempo !== 'slow' && obj.tempo !== 'medium' && obj.tempo !== 'fast') return null
  if (!Array.isArray(obj.exclusions) || !obj.exclusions.every((item) => typeof item === 'string')) return null
  if (typeof obj.rawIntent !== 'string') return null

  return {
    energy: obj.energy,
    mood: obj.mood,
    exclusions: obj.exclusions,
    tempo: obj.tempo,
    texture: obj.texture,
    rawIntent: obj.rawIntent,
    ...(typeof obj.era === 'string' ? { era: obj.era } : {}),
    ...(Array.isArray(obj.searchQueries)
      ? {
          searchQueries: obj.searchQueries.filter(
            (item): item is string => typeof item === 'string'
          ),
        }
      : {}),
    ...(Array.isArray(obj.spotifyGenres)
      ? {
          spotifyGenres: obj.spotifyGenres.filter(
            (item): item is string => typeof item === 'string'
          ),
        }
      : {}),
    ...(Array.isArray(obj.artistSeeds)
      ? {
          artistSeeds: obj.artistSeeds.filter(
            (item): item is string => typeof item === 'string'
          ),
        }
      : {}),
  }
}

function parseIntentMemoryEntries(value: unknown): IntentMemoryEntry[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const obj = entry as Record<string, unknown>
      if (typeof obj.intentKey !== 'string') return null
      const playedTones = Array.isArray(obj.playedTones)
        ? obj.playedTones.filter(
            (item): item is IntentMemoryEntry['playedTones'][number] =>
              item === 'violet' || item === 'amber' || item === 'moss' || item === 'rose'
          )
        : []
      const playedEnergies = Array.isArray(obj.playedEnergies)
        ? obj.playedEnergies.filter(
            (item): item is number => typeof item === 'number' && Number.isFinite(item)
          )
        : []
      const playedBpms = Array.isArray(obj.playedBpms)
        ? obj.playedBpms.filter(
            (item): item is number => typeof item === 'number' && Number.isFinite(item)
          )
        : []
      const rejectedIds = Array.isArray(obj.rejectedIds)
        ? obj.rejectedIds.filter((item): item is string => typeof item === 'string')
        : []
      const sessionIds = Array.isArray(obj.sessionIds)
        ? obj.sessionIds.filter((item): item is string => typeof item === 'string')
        : []
      const updatedAt =
        typeof obj.updatedAt === 'string' ? obj.updatedAt : new Date().toISOString()
      return {
        intentKey: obj.intentKey,
        playedTones,
        playedEnergies,
        ...(playedBpms.length > 0 ? { playedBpms } : {}),
        rejectedIds,
        sessionIds,
        updatedAt,
      }
    })
    .filter((entry): entry is IntentMemoryEntry => entry != null)
}

function parseTasteCentroid(value: unknown): TasteCentroid | null {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  if (
    typeof obj.energy !== 'number' ||
    typeof obj.bpm !== 'number' ||
    typeof obj.spectralCentroid !== 'number' ||
    typeof obj.sampleCount !== 'number'
  ) return null
  return {
    energy: Math.max(0, Math.min(1, obj.energy)),
    bpm: Math.max(40, Math.min(240, obj.bpm)),
    spectralCentroid: Math.max(0, Math.min(1, obj.spectralCentroid)),
    sampleCount: obj.sampleCount,
    lastUpdated: typeof obj.lastUpdated === 'number' ? obj.lastUpdated : Date.now(),
  }
}

function parseSteer(value: unknown): { azimuth: number; polar: number } | undefined {
  if (!value || typeof value !== 'object') return undefined
  const obj = value as Record<string, unknown>
  if (typeof obj.azimuth !== 'number' || typeof obj.polar !== 'number') return undefined
  if (!Number.isFinite(obj.azimuth) || !Number.isFinite(obj.polar)) return undefined
  if (Math.abs(obj.azimuth) > Math.PI * 2 || Math.abs(obj.polar) > Math.PI) return undefined
  return { azimuth: obj.azimuth, polar: obj.polar }
}

export async function POST(request: NextRequest) {
  const started = Date.now()
  try {
    const body = await request.json()
    const {
      intent,
      tasteProfile,
      previousIntent,
      previousLens: previousLensRaw,
      zoneId,
      excludeTrackIds,
      intentMemoryEntries,
      firstSession,
      tasteCentroid: tasteCentroidRaw,
      steer: steerRaw,
    } = body

    if (!intent || typeof intent !== 'string' || intent.trim().length < 3) {
      return NextResponse.json({ error: 'Intent must be at least 3 characters' }, { status: 400 })
    }

    const trimmed = intent.trim()
    let mode: 'layer' | 'redirect' = 'redirect'
    let lensForParse: PersonaLens | null | undefined

    const prevText =
      typeof previousIntent === 'string' && previousIntent.trim().length >= 3
        ? previousIntent.trim()
        : null
    const prevLens = parsePreviousLens(previousLensRaw)

    if (prevText && prevLens) {
      mode = await classifyIntentMode(trimmed, prevText)
      if (mode === 'layer') {
        lensForParse = prevLens
      }
    }

    const zoneIdSafe = typeof zoneId === 'string' && zoneId.length > 0 ? zoneId : null
    const excludeTrackIdsSafe = Array.isArray(excludeTrackIds)
      ? excludeTrackIds.filter((item): item is string => typeof item === 'string')
      : null
    const intentMemoryEntriesSafe = parseIntentMemoryEntries(intentMemoryEntries)
    const tasteCentroid = parseTasteCentroid(tasteCentroidRaw)
    const steer = parseSteer(steerRaw)

    // Run the suggestion pipeline and the optional CLAP text embed in parallel.
    // The CLAP embed is non-load-bearing for this route: globe consumers ignore it,
    // but the listen-test and /api/arc layers benefit when it is precomputed here.
    // Graceful degradation: if the acoustic service is offline, targetEmbedding = null
    // and the rest of the response is unaffected.
    const embedPromise: Promise<CLAPEmbedding | null> = isAcousticServiceEnabled()
      ? embedText(trimmed).catch((err) => {
          console.warn('[/api/intent] CLAP text embed failed (non-fatal):', err)
          return null
        })
      : Promise.resolve(null)

    const [{ suggestions, personaLens }, targetEmbedding] = await Promise.all([
      intentToSuggestions(
        trimmed,
        tasteProfile ?? null,
        lensForParse,
        zoneIdSafe,
        {
          excludeTrackIds: excludeTrackIdsSafe,
          intentMemoryEntries: intentMemoryEntriesSafe,
          firstSession: firstSession === true,
          tasteCentroid,
          ...(steer ? { steer } : {}),
        }
      ),
      embedPromise,
    ])

    const intent_latency_ms = Date.now() - started
    if (process.env.NODE_ENV === 'development') {
      console.info(
        '[/api/intent] latency_ms', intent_latency_ms,
        'count', suggestions.length,
        'clapEmbedding', targetEmbedding ? 'yes' : 'no',
      )
    }

    return NextResponse.json({
      suggestions,
      personaLens,
      mode,
      intent_latency_ms,
      targetEmbedding,
    })
  } catch (err) {
    console.error('[/api/intent] Error:', err)
    return NextResponse.json({ error: 'Failed to process intent' }, { status: 500 })
  }
}
