/**
 * Woody Acoustic Service Client — CLAP navigation layer.
 *
 * Wraps the Python acoustic service (packages/acoustic-service) for the
 * Next.js app. All distance / arc / k-NN navigation goes through here.
 *
 * Endpoint contract (canonical: WOODY_BUILD_SPEC.md Section 3):
 *   POST /embed/text              text -> 512D
 *   POST /embed/audio             one track -> 512D
 *   POST /embed/audio/batch       N tracks -> N x 512D
 *   POST /arc/generate            target + pool -> ordered arc
 *   POST /5d/project              Spotify features -> 5D coords (display only)
 *
 * Configuration:
 *   ACOUSTIC_SERVICE_URL          base URL of the running service
 *   ACOUSTIC_SERVICE_TIMEOUT_MS   per-request timeout (default 30s for embed, 60s for arc)
 *
 * @see .cursor/rules/woody-engine.mdc — hard rules this client respects:
 *   - Embeddings are 512D L2-normalised float arrays
 *   - Navigation distance is cosine in CLAP space (not Euclidean in 5D)
 *   - No 'recommend' / 'recommendation' / 'suggestion' vocabulary in nav code
 */

import type {
  AcousticCoords5D,
  ArcResult,
  ArcShape,
  ArcStep,
  CLAPEmbedding,
  EmbedAudioBatchInput,
  EmbedAudioBatchResult,
} from './types'

// ─── Configuration ──────────────────────────────────────────────────────────

const ACOUSTIC_SERVICE_URL = process.env.ACOUSTIC_SERVICE_URL
const ACOUSTIC_SERVICE_TOKEN = process.env.ACOUSTIC_SERVICE_TOKEN
const EMBED_TIMEOUT_MS = Number(process.env.ACOUSTIC_SERVICE_EMBED_TIMEOUT_MS ?? 30_000)
const BATCH_TIMEOUT_MS = Number(process.env.ACOUSTIC_SERVICE_BATCH_TIMEOUT_MS ?? 120_000)
const ARC_TIMEOUT_MS = Number(process.env.ACOUSTIC_SERVICE_ARC_TIMEOUT_MS ?? 60_000)

export const CLAP_EMBEDDING_DIM = 512

/** Returns true iff the service is configured. Callers should branch and not
 *  blow up when unset — the Woody app must remain usable without the service
 *  (the globe path still works on the legacy 4-dim acoustic.ts). */
export function isAcousticServiceEnabled(): boolean {
  return typeof ACOUSTIC_SERVICE_URL === 'string' && ACOUSTIC_SERVICE_URL.length > 0
}

function requireServiceUrl(): string {
  if (!ACOUSTIC_SERVICE_URL) {
    throw new Error(
      'Acoustic service not configured. Set ACOUSTIC_SERVICE_URL in .env.local ' +
        '(e.g. http://localhost:8765 for local dev).',
    )
  }
  return ACOUSTIC_SERVICE_URL
}

// ─── HTTP helper ────────────────────────────────────────────────────────────

async function postJson<TIn, TOut>(
  path: string,
  body: TIn,
  timeoutMs: number,
): Promise<TOut> {
  const base = requireServiceUrl()
  const url = `${base}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ACOUSTIC_SERVICE_TOKEN
        ? { Authorization: `Bearer ${ACOUSTIC_SERVICE_TOKEN}` }
        : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`[acousticService] ${path} -> ${res.status}: ${detail.slice(0, 256)}`)
  }
  return (await res.json()) as TOut
}

// Journey selection

export type AcousticKnownness = 'known_track' | 'known_artist' | 'unseen'
export type AcousticJourneyPhase = 'settle' | 'build' | 'sustain' | 'impact' | 'release'

export interface AcousticSkipPenalty {
  trackId: string
  weight: number
  decisionsRemaining: number
}

export interface AcousticJourneyNextInput {
  sessionId: string
  decisionIndex: number
  currentTrackId: string
  anchorTrackIds: string[]
  phase: AcousticJourneyPhase
  phaseDescription: string
  familiarityTarget: number
  knownTrackIds: string[]
  knownArtists: string[]
  recentKnownness: AcousticKnownness[]
  excludeIds: string[]
  skipPenalties: AcousticSkipPenalty[]
}

interface AcousticJourneyNextRaw {
  decision_id: string
  track: {
    id: string
    name: string
    artist: string
    album?: string
    spotify_uri?: string
    knownness: AcousticKnownness
  }
  phase: AcousticJourneyPhase
  confidence: number
  transition_distance: number
  target_distance: number
  familiarity_fit: number
  skip_penalty: number
  relaxation_level: number
  candidate_count: number
  latency_ms: number
}

export interface AcousticJourneyDecision {
  decisionId: string
  track: {
    id: string
    name: string
    artist: string
    album?: string
    spotifyUri?: string
    knownness: AcousticKnownness
  }
  phase: AcousticJourneyPhase
  confidence: number
  transitionDistance: number
  targetDistance: number
  familiarityFit: number
  skipPenalty: number
  relaxationLevel: number
  candidateCount: number
  latencyMs: number
}

export async function selectJourneyNext(
  input: AcousticJourneyNextInput,
): Promise<AcousticJourneyDecision> {
  const raw = await postJson<Record<string, unknown>, AcousticJourneyNextRaw>(
    '/journey/next',
    {
      session_id: input.sessionId,
      decision_index: input.decisionIndex,
      current_track_id: input.currentTrackId,
      anchor_track_ids: input.anchorTrackIds,
      phase: input.phase,
      phase_description: input.phaseDescription,
      familiarity_target: input.familiarityTarget,
      known_track_ids: input.knownTrackIds,
      known_artists: input.knownArtists,
      recent_knownness: input.recentKnownness,
      exclude_ids: input.excludeIds,
      skip_penalties: input.skipPenalties.map((penalty) => ({
        track_id: penalty.trackId,
        weight: penalty.weight,
        decisions_remaining: penalty.decisionsRemaining,
      })),
    },
    ARC_TIMEOUT_MS,
  )

  return {
    decisionId: raw.decision_id,
    track: {
      id: raw.track.id,
      name: raw.track.name,
      artist: raw.track.artist,
      album: raw.track.album,
      spotifyUri: raw.track.spotify_uri,
      knownness: raw.track.knownness,
    },
    phase: raw.phase,
    confidence: raw.confidence,
    transitionDistance: raw.transition_distance,
    targetDistance: raw.target_distance,
    familiarityFit: raw.familiarity_fit,
    skipPenalty: raw.skip_penalty,
    relaxationLevel: raw.relaxation_level,
    candidateCount: raw.candidate_count,
    latencyMs: raw.latency_ms,
  }
}

export interface EnsureJourneyAnchorInput {
  trackId: string
  name: string
  artist: string
  album?: string
  spotifyUri?: string
  durationMs?: number
}

export async function ensureJourneyAnchor(
  input: EnsureJourneyAnchorInput,
): Promise<{ trackId: string; embedded: boolean; created: boolean; audioSource?: string }> {
  const raw = await postJson<Record<string, unknown>, {
    track_id: string
    embedded: boolean
    created: boolean
    audio_source?: string
  }>(
    '/journey/anchor',
    {
      track_id: input.trackId,
      name: input.name,
      artist: input.artist,
      album: input.album,
      spotify_uri: input.spotifyUri,
      duration_ms: input.durationMs,
    },
    BATCH_TIMEOUT_MS,
  )
  return {
    trackId: raw.track_id,
    embedded: raw.embedded,
    created: raw.created,
    audioSource: raw.audio_source,
  }
}

// ─── /embed/text ────────────────────────────────────────────────────────────

interface EmbedTextResponseRaw {
  embedding: number[]
  dim: number
  latency_ms?: number
}

/** Embed an intent string into the 512D CLAP space.
 *  Used as the navigation target for arc generation. */
export async function embedText(text: string): Promise<CLAPEmbedding> {
  const resp = await postJson<{ text: string }, EmbedTextResponseRaw>(
    '/embed/text',
    { text },
    EMBED_TIMEOUT_MS,
  )
  if (resp.dim !== CLAP_EMBEDDING_DIM || resp.embedding.length !== CLAP_EMBEDDING_DIM) {
    throw new Error(
      `[acousticService] embedText: expected ${CLAP_EMBEDDING_DIM}D, got dim=${resp.dim} ` +
        `len=${resp.embedding.length}`,
    )
  }
  return resp.embedding
}

// ─── /embed/audio/batch ─────────────────────────────────────────────────────

interface BatchTrackRequestRaw {
  id: string
  preview_url?: string
  artist?: string
  title?: string
}

interface BatchTrackResultRaw {
  id: string
  embedding?: number[]
  audio_url_used?: string
  audio_source?: 'preview_url' | 'itunes'
  error?: string
}

interface EmbedAudioBatchResponseRaw {
  results: BatchTrackResultRaw[]
  failed: string[]
  latency_ms?: number
}

/** Embed an array of tracks (max 50 per call).
 *  Tracks without a preview_url AND without artist+title are returned with `error: "audio_unavailable"`.
 *  Caller is responsible for filtering out results where `embedding` is missing. */
export async function embedAudioBatch(
  tracks: EmbedAudioBatchInput[],
): Promise<EmbedAudioBatchResult[]> {
  if (tracks.length === 0) return []
  if (tracks.length > 50) {
    // Recurse in chunks to keep within the service's MAX_BATCH
    const chunks: EmbedAudioBatchInput[][] = []
    for (let i = 0; i < tracks.length; i += 50) chunks.push(tracks.slice(i, i + 50))
    const all: EmbedAudioBatchResult[] = []
    for (const c of chunks) {
      const part = await embedAudioBatch(c)
      all.push(...part)
    }
    return all
  }
  const payload: { tracks: BatchTrackRequestRaw[] } = {
    tracks: tracks.map((t) => ({
      id: t.id,
      preview_url: t.previewUrl,
      artist: t.artist,
      title: t.title,
    })),
  }
  const resp = await postJson<typeof payload, EmbedAudioBatchResponseRaw>(
    '/embed/audio/batch',
    payload,
    BATCH_TIMEOUT_MS,
  )
  return resp.results.map((r) => ({
    id: r.id,
    embedding: r.embedding,
    audioUrlUsed: r.audio_url_used,
    audioSource: r.audio_source,
    error: r.error,
  }))
}

// ─── /arc/generate ──────────────────────────────────────────────────────────

interface ArcStepRaw {
  id: string
  position_in_arc: number
  progress: number
  transition_distance: number
  distance_to_target: number
  is_frisson_candidate: boolean
  waypoint_distance: number
  relaxation_level: number
}

interface ArcGenerateResponseRaw {
  steps: ArcStepRaw[]
  arc_shape: ArcShape
  reached_target: boolean
  final_distance: number
  coherence_violations: number
  pool_size_used: number
  diagnostics: Record<string, unknown>
  latency_ms?: number
}

export interface GenerateArcArgs {
  targetEmbedding: CLAPEmbedding
  pool: Array<{ id: string; embedding: CLAPEmbedding }>
  currentPosition?: CLAPEmbedding
  arcLength?: number
  maxTransitionDistance?: number
  excludeIds?: string[]
  arcShape?: ArcShape
}

/** Generate an arc through CLAP 512D space from `currentPosition` toward
 *  `targetEmbedding`, threading the `pool`. The arc shape biases how the
 *  waypoint moves over the arc; see WOODY_BUILD_SPEC.md Section 3.5.
 *
 *  Returns an {@link ArcResult} whose steps are in play order. Coherence
 *  violations and relaxation levels are exposed for diagnostic surfaces. */
export async function generateArc(args: GenerateArcArgs): Promise<ArcResult> {
  const payload = {
    target_embedding: args.targetEmbedding,
    pool: args.pool.map((p) => ({ id: p.id, embedding: p.embedding })),
    current_position: args.currentPosition ?? undefined,
    arc_length: args.arcLength ?? 20,
    max_transition_distance: args.maxTransitionDistance ?? 0.35,
    exclude_ids: args.excludeIds ?? [],
    arc_shape: args.arcShape ?? 'journey',
  }
  const resp = await postJson<typeof payload, ArcGenerateResponseRaw>(
    '/arc/generate',
    payload,
    ARC_TIMEOUT_MS,
  )
  const steps: ArcStep[] = resp.steps.map((s) => ({
    id: s.id,
    positionInArc: s.position_in_arc,
    progress: s.progress,
    transitionDistance: s.transition_distance,
    distanceToTarget: s.distance_to_target,
    isFrissonCandidate: s.is_frisson_candidate,
    waypointDistance: s.waypoint_distance,
    relaxationLevel: s.relaxation_level,
  }))
  return {
    steps,
    arcShape: resp.arc_shape,
    reachedTarget: resp.reached_target,
    finalDistance: resp.final_distance,
    coherenceViolations: resp.coherence_violations,
    poolSizeUsed: resp.pool_size_used,
    diagnostics: resp.diagnostics,
    latencyMs: resp.latency_ms,
  }
}

// ─── /5d/project ────────────────────────────────────────────────────────────

/** Spotify Audio Features schema — input to the Phase 1 heuristic projection.
 *  Most fields are unavailable for new app registrations after Spotify's
 *  2024 API changes; the route returns NULL coords when features are absent. */
export interface SpotifyAudioFeaturesInput {
  energy: number
  valence: number
  acousticness: number
  instrumentalness: number
  loudness: number // dB, [-60, 0]
  tempo?: number
}

interface ProjectResponseRaw extends AcousticCoords5D {
  source: 'spotify_features_heuristic' | 'clap_probe'
}

/** Project to 5D display coordinates (NEVER used for navigation).
 *  Phase 1: pass {features} (Spotify Audio Features). Phase 2 will support
 *  {clapEmbedding} once the linear probe ships. */
export async function projectTo5D(
  input: { features: SpotifyAudioFeaturesInput } | { clapEmbedding: CLAPEmbedding },
): Promise<AcousticCoords5D & { source: string }> {
  const payload =
    'features' in input
      ? { features: input.features }
      : { clap_embedding: input.clapEmbedding }
  const resp = await postJson<typeof payload, ProjectResponseRaw>(
    '/5d/project',
    payload,
    EMBED_TIMEOUT_MS,
  )
  return resp
}

// ─── Health probe ───────────────────────────────────────────────────────────

interface HealthResponse {
  status: string
  service: string
  version: string
  clap_model: string
  clap_loaded: boolean
  preload: boolean
}

/** Lightweight liveness check — useful for /api/health gating or dev banners. */
export async function getServiceHealth(): Promise<HealthResponse | null> {
  if (!isAcousticServiceEnabled()) return null
  try {
    const base = requireServiceUrl()
    const res = await fetch(`${base}/health`, {
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) return null
    return (await res.json()) as HealthResponse
  } catch {
    return null
  }
}
