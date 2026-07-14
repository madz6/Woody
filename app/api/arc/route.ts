/**
 * POST /api/arc
 *
 * Generates an acoustic arc by:
 *   1. CLAP text-embedding the intent     -> 512D target
 *   2. Running the existing PersonaLens search path (Spotify + Last.fm) -> candidate pool
 *   3. CLAP audio-embedding each candidate -> pool with 512D vectors
 *   4. Beam-with-relaxation arc generation in CLAP space -> ordered ArcStep[]
 *
 * This route is parallel to /api/intent — it does NOT replace it. The globe
 * UI continues to consume /api/intent. New surfaces (arc page, listen-test
 * UI) consume /api/arc. The two routes share the candidate-pool search logic
 * via intentToSuggestions().
 *
 * @see .cursor/rules/woody-engine.mdc for the navigation contract.
 * @see WOODY_BUILD_SPEC.md Section 5.5 for the canonical route shape.
 */

import { NextRequest, NextResponse } from 'next/server'

import {
  CLAP_EMBEDDING_DIM,
  embedAudioBatch,
  embedText,
  generateArc,
  isAcousticServiceEnabled,
} from '@/lib/acousticService'
import { explainShapeChoice, inferArcShape } from '@/lib/arcShape'
import { intentToSuggestions } from '@/lib/intent'
import type {
  ArcShape,
  ArcStep,
  CLAPEmbedding,
  PersonaLens,
  TasteProfile,
  Track,
} from '@/lib/types'

const MIN_INTENT_LENGTH = 3
const DEFAULT_ARC_LENGTH = 18
const MAX_ARC_LENGTH = 40
const MIN_POOL_SIZE_BEFORE_FAIL = 6

interface ArcRequestBody {
  intent: unknown
  excludeIds?: unknown
  arcLength?: unknown
  arcShape?: unknown
  currentPosition?: unknown
  zoneId?: unknown
  tasteProfile?: unknown
  firstSession?: unknown
}

interface ArcStepWithTrack extends ArcStep {
  track?: Track
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string')
}

function parseCurrentPosition(value: unknown): CLAPEmbedding | undefined {
  if (!Array.isArray(value)) return undefined
  if (value.length !== CLAP_EMBEDDING_DIM) return undefined
  if (!value.every((n): n is number => typeof n === 'number' && Number.isFinite(n))) return undefined
  return value as CLAPEmbedding
}

function parseArcShapeOverride(value: unknown): ArcShape | undefined {
  if (typeof value !== 'string') return undefined
  if (value === 'journey' || value === 'plateau' || value === 'discharge' || value === 'peak_early') {
    return value
  }
  return undefined
}

function parseTasteProfile(value: unknown): TasteProfile | null {
  if (!value || typeof value !== 'object') return null
  const profile = value as Record<string, unknown>
  const tones = ['violet', 'amber', 'moss', 'rose'] as const
  if (!Array.isArray(profile.dominantTones) || !profile.dominantTones.every((tone) => tones.includes(tone))) return null
  if (!Array.isArray(profile.commonMoods) || !profile.commonMoods.every((mood) => typeof mood === 'string')) return null
  if (!Array.isArray(profile.topArtists) || !profile.topArtists.every((artist) => typeof artist === 'string')) return null
  if (profile.avgEnergy !== 'low' && profile.avgEnergy !== 'medium' && profile.avgEnergy !== 'high') return null
  if (typeof profile.sessionCount !== 'number' || !Number.isFinite(profile.sessionCount) || profile.sessionCount < 0) return null
  return {
    dominantTones: profile.dominantTones as TasteProfile['dominantTones'],
    commonMoods: profile.commonMoods as string[],
    avgEnergy: profile.avgEnergy,
    topArtists: profile.topArtists as string[],
    sessionCount: Math.floor(profile.sessionCount),
  }
}

export async function POST(request: NextRequest) {
  const started = Date.now()

  if (!isAcousticServiceEnabled()) {
    return NextResponse.json(
      {
        error: 'acoustic_service_disabled',
        message:
          'Arc generation requires the Python acoustic service. ' +
          'Set ACOUSTIC_SERVICE_URL in .env.local and start packages/acoustic-service.',
      },
      { status: 503 },
    )
  }

  let body: ArcRequestBody
  try {
    body = (await request.json()) as ArcRequestBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const intent = typeof body.intent === 'string' ? body.intent.trim() : ''
  if (intent.length < MIN_INTENT_LENGTH) {
    return NextResponse.json(
      { error: 'intent_too_short', message: `intent must be at least ${MIN_INTENT_LENGTH} characters` },
      { status: 400 },
    )
  }

  const excludeIds = parseStringArray(body.excludeIds)
  const requestedArcLength = typeof body.arcLength === 'number' ? body.arcLength : DEFAULT_ARC_LENGTH
  const arcLength = Math.max(5, Math.min(MAX_ARC_LENGTH, Math.floor(requestedArcLength)))
  const currentPosition = parseCurrentPosition(body.currentPosition)
  const arcShapeOverride = parseArcShapeOverride(body.arcShape)
  const zoneId = typeof body.zoneId === 'string' && body.zoneId.length > 0 ? body.zoneId : null
  const tasteProfile = parseTasteProfile(body.tasteProfile)

  const shapeChoice = arcShapeOverride
    ? { shape: arcShapeOverride, matched: ['override'] as string[] }
    : explainShapeChoice(intent)
  const arcShape: ArcShape = shapeChoice.shape

  // Phase 1: parallel kick-off of text embed + candidate pool
  let targetEmbedding: CLAPEmbedding
  let suggestions: Awaited<ReturnType<typeof intentToSuggestions>>['suggestions']
  let personaLens: PersonaLens
  try {
    const [target, intentOut] = await Promise.all([
      embedText(intent),
      intentToSuggestions(
        intent,
        tasteProfile,
        undefined,
        zoneId,
        {
          excludeTrackIds: excludeIds,
          firstSession: body.firstSession === true,
        },
      ),
    ])
    targetEmbedding = target
    suggestions = intentOut.suggestions
    personaLens = intentOut.personaLens
  } catch (err) {
    console.error('[/api/arc] intent+embed phase failed:', err)
    return NextResponse.json({ error: 'intent_embed_failed', detail: String(err) }, { status: 502 })
  }

  // Phase 2: embed candidate audio via batched CLAP
  const candidateTracks: Track[] = suggestions.map((s) => s.track)
  const trackById = new Map(candidateTracks.map((t) => [t.id, t]))

  let embedded: Awaited<ReturnType<typeof embedAudioBatch>>
  try {
    embedded = await embedAudioBatch(
      candidateTracks.map((t) => ({
        id: t.id,
        previewUrl: t.previewUrl,
        artist: t.artist,
        title: t.name,
      })),
    )
  } catch (err) {
    console.error('[/api/arc] batch embed failed:', err)
    return NextResponse.json({ error: 'batch_embed_failed', detail: String(err) }, { status: 502 })
  }

  const pool = embedded
    .filter((r): r is typeof r & { embedding: CLAPEmbedding } => Array.isArray(r.embedding))
    .map((r) => ({ id: r.id, embedding: r.embedding }))

  if (pool.length < MIN_POOL_SIZE_BEFORE_FAIL) {
    return NextResponse.json(
      {
        error: 'pool_too_small',
        message: `Only ${pool.length} of ${candidateTracks.length} candidates produced an embedding. ` +
          'iTunes lookup may be failing for these tracks, or preview URLs are unavailable.',
        embedFailures: embedded.filter((r) => !r.embedding).map((r) => ({ id: r.id, error: r.error })),
      },
      { status: 422 },
    )
  }

  // Phase 3: generate arc
  let arc: Awaited<ReturnType<typeof generateArc>>
  try {
    arc = await generateArc({
      targetEmbedding,
      pool,
      currentPosition,
      arcLength,
      arcShape,
      excludeIds,
    })
  } catch (err) {
    console.error('[/api/arc] arc generation failed:', err)
    return NextResponse.json({ error: 'arc_generation_failed', detail: String(err) }, { status: 502 })
  }

  // Attach track metadata to each arc step
  const stepsWithTracks: ArcStepWithTrack[] = arc.steps.map((s) => ({
    ...s,
    track: trackById.get(s.id),
  }))

  const arcLatencyMs = Date.now() - started

  return NextResponse.json({
    arcSteps: stepsWithTracks,
    arcShape,
    arcShapeMatched: shapeChoice.matched,
    reachedTarget: arc.reachedTarget,
    finalDistance: arc.finalDistance,
    coherenceViolations: arc.coherenceViolations,
    poolSizeUsed: arc.poolSizeUsed,
    poolSizeRequested: candidateTracks.length,
    personaLens,
    targetEmbeddingDim: CLAP_EMBEDDING_DIM,
    embedFailures: embedded.filter((r) => !r.embedding).length,
    arcLatencyMs,
    diagnostics: arc.diagnostics,
  })
}
