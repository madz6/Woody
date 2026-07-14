/**
 * Woody Acoustic Intelligence Layer — LEGACY (4-dim proxy)
 * ========================================================
 * This module is the original /api/intent path: PersonaLens → 4-dim
 * AcousticTarget {energy, bpmMin/Max, valenceProxy, spectralTarget} →
 * weighted distance ranking against tracks measured by the Librosa /analyze
 * endpoint.
 *
 * @deprecated for NAVIGATION purposes. The arc engine (lib/acousticService.ts +
 * app/api/arc) navigates in CLAP 512-dim space using cosine distance, per
 * WOODY_BUILD_SPEC.md Section 3 and .cursor/rules/woody-engine.mdc.
 *
 * Functions here remain in use by the existing globe path and intentToSuggestions().
 * Do not call them from new arc-engine code.
 */

import type {
  AcousticFeatureVector,
  AcousticTarget,
  LearnedIntentBias,
  PersonaLens,
  Track,
} from './types'

// ---------------------------------------------------------------------------
// PersonaLens → AcousticTarget
// ---------------------------------------------------------------------------

/** Derive an acoustic target from a PersonaLens.
 *  This is what we're looking for in acoustic feature space.
 *
 *  @deprecated Navigation now uses CLAP text embeddings as the target.
 *  Kept for the existing /api/intent path that powers the globe.
 */
export function acousticTargetFromLens(lens: PersonaLens): AcousticTarget {
  // Energy mapping: lens.energy level → 0-1 float
  const energyMap: Record<PersonaLens['energy'], number> = {
    low: 0.25,
    medium: 0.5,
    high: 0.8,
  }

  // Tempo mapping: lens.tempo → BPM range
  const tempoRanges: Record<PersonaLens['tempo'], [number, number]> = {
    slow: [50, 90],
    medium: [85, 125],
    fast: [120, 175],
  }

  // Valence proxy: rough sentiment scan of mood words
  // Positive words → high valence, negative/dark words → low valence
  const POSITIVE_MOOD_WORDS = new Set([
    'happy', 'joyful', 'bright', 'euphoric', 'uplifting', 'warm', 'playful',
    'hopeful', 'triumphant', 'sunny', 'light', 'celebratory', 'optimistic',
  ])
  const NEGATIVE_MOOD_WORDS = new Set([
    'dark', 'melancholy', 'sad', 'somber', 'ominous', 'brooding', 'heavy',
    'mournful', 'gloomy', 'tense', 'anxious', 'menacing', 'cold', 'desolate',
  ])
  let valenceScore = 0.5 // default: neutral
  let valenceCount = 0
  for (const word of [...lens.mood, ...lens.texture]) {
    const lower = word.toLowerCase()
    if (POSITIVE_MOOD_WORDS.has(lower)) { valenceScore += 0.15; valenceCount++ }
    if (NEGATIVE_MOOD_WORDS.has(lower)) { valenceScore -= 0.15; valenceCount++ }
  }
  const valenceProxy = valenceCount > 0
    ? Math.max(0, Math.min(1, valenceScore))
    : undefined

  // Spectral brightness hint from texture words
  const BRIGHT_WORDS = new Set([
    'glossy', 'bright', 'crisp', 'clean', 'polished', 'airy', 'sparkly', 'shimmery',
  ])
  const DARK_WORDS = new Set([
    'muddy', 'thick', 'heavy', 'warm', 'low', 'bass-heavy', 'subby', 'murky',
    '808', 'rumble',
  ])
  let spectral: number | undefined
  for (const word of [...lens.texture, ...lens.mood]) {
    const lower = word.toLowerCase()
    if (BRIGHT_WORDS.has(lower)) { spectral = (spectral ?? 0.5) + 0.1 }
    if (DARK_WORDS.has(lower)) { spectral = (spectral ?? 0.5) - 0.1 }
  }
  if (spectral !== undefined) spectral = Math.max(0.1, Math.min(0.9, spectral))

  const [bpmMin, bpmMax] = tempoRanges[lens.tempo]

  return {
    energy: energyMap[lens.energy],
    bpmMin,
    bpmMax,
    valenceProxy,
    spectralTarget: spectral,
  }
}

// ---------------------------------------------------------------------------
// Acoustic Scoring
// ---------------------------------------------------------------------------

/** Score a feature vector against a target. Lower score = better match.
 *  Returns a value roughly in the range 0-1.
 *
 *  Weights are tuned to reflect perceptual importance:
 *   - Energy (0.4): most salient characteristic of a vibe
 *   - BPM (0.3): tempo is critical for context (running vs. chill)
 *   - Spectral centroid (0.15): brightness / production character
 *   - Valence proxy (0.15): emotional tone
 *
 *  @deprecated Arc navigation uses cosine distance in CLAP 512D space
 *  (see acousticService.generateArc). This 4-dim score is retained for the
 *  legacy /api/intent globe path only.
 */
export function acousticScore(
  features: AcousticFeatureVector,
  target: AcousticTarget
): number {
  let score = 0
  let totalWeight = 0

  // Energy distance (weight 0.4)
  if (target.energy !== undefined) {
    score += 0.4 * Math.abs(features.energy - target.energy)
    totalWeight += 0.4
  }

  // BPM distance, normalized to 0-1 over a 200 BPM range (weight 0.3)
  if (target.bpmMin !== undefined && target.bpmMax !== undefined) {
    const bpmMid = (target.bpmMin + target.bpmMax) / 2
    const bpmRange = target.bpmMax - target.bpmMin
    // Penalty ramps up outside the target range, zero inside
    const bpmDelta = Math.max(0, Math.abs(features.bpm - bpmMid) - bpmRange / 2)
    score += 0.3 * Math.min(1, bpmDelta / 60) // 60 BPM outside range = full penalty
    totalWeight += 0.3
  }

  // Spectral centroid distance (weight 0.15)
  if (target.spectralTarget !== undefined) {
    score += 0.15 * Math.abs(features.spectral_centroid - target.spectralTarget)
    totalWeight += 0.15
  }

  // Valence proxy distance (weight 0.15)
  // Note: feature vectors don't have valence directly — we use mode as a rough proxy
  if (target.valenceProxy !== undefined) {
    // major mode ~ higher valence, minor mode ~ lower valence
    const featureValenceProxy = features.mode === 'major' ? 0.65 : 0.35
    score += 0.15 * Math.abs(featureValenceProxy - target.valenceProxy)
    totalWeight += 0.15
  }

  // Normalize: if we only had some dimensions, scale to avoid bias
  return totalWeight > 0 ? score / totalWeight : 0.5
}

// ---------------------------------------------------------------------------
// Taste Centroid Target
// ---------------------------------------------------------------------------

/** Build an acoustic target from a taste centroid (mean of kept/saved tracks).
 *  Blends the centroid with the lens target so the session intent still steers,
 *  but learned personal taste modulates the result.
 */
export function blendTargetWithTaste(
  lensTarget: AcousticTarget,
  tasteCentroid: Partial<AcousticFeatureVector>,
  blendWeight = 0.35 // 35% taste influence, 65% intent
): AcousticTarget {
  const blend = (a: number | undefined, b: number | undefined): number | undefined => {
    if (a === undefined && b === undefined) return undefined
    if (a === undefined) return b
    if (b === undefined) return a
    return a * (1 - blendWeight) + b * blendWeight
  }

  return {
    energy: blend(lensTarget.energy, tasteCentroid.energy),
    bpmMin: blend(
      lensTarget.bpmMin,
      typeof tasteCentroid.bpm === 'number' ? tasteCentroid.bpm - 20 : undefined
    ),
    bpmMax: blend(
      lensTarget.bpmMax,
      typeof tasteCentroid.bpm === 'number' ? tasteCentroid.bpm + 20 : undefined
    ),
    valenceProxy: lensTarget.valenceProxy,
    spectralTarget: blend(lensTarget.spectralTarget, tasteCentroid.spectral_centroid),
  }
}

/**
 * Blend a per-intent learned bias into the lens-derived target.
 * Keeps the population interpretation primary while letting repeated behavior
 * nudge energy and BPM toward what this user usually means by this intent key.
 */
export function blendIntentBias(
  target: AcousticTarget,
  bias: LearnedIntentBias | null,
  sampleCount: number
): AcousticTarget {
  if (!bias || sampleCount < 3) return target

  const weight = Math.min(0.25, Math.max(0, sampleCount - 3) / 77)
  const blend = (base: number | undefined, learned: number | undefined): number | undefined => {
    if (base === undefined && learned === undefined) return undefined
    if (base === undefined) return learned
    if (learned === undefined) return base
    return base * (1 - weight) + learned * weight
  }

  return {
    energy: blend(target.energy, bias.avgEnergy),
    bpmMin: blend(target.bpmMin, bias.avgBpm !== undefined ? bias.avgBpm - 15 : undefined),
    bpmMax: blend(target.bpmMax, bias.avgBpm !== undefined ? bias.avgBpm + 15 : undefined),
    valenceProxy: target.valenceProxy,
    spectralTarget: target.spectralTarget,
  }
}

// ---------------------------------------------------------------------------
// Pool Ranking
// ---------------------------------------------------------------------------

/** Rank a pool of tracks by acoustic score against a target.
 *  Tracks without features fall to the back (score = 0.999).
 *  Returns a new array sorted by ascending score (best matches first).
 *
 *  @deprecated Arc navigation uses {@link acousticService.generateArc} which
 *  does a beam-search-with-relaxation in CLAP 512D, not a flat 4-dim ranking.
 *  Retained for the existing /api/intent path that powers the globe.
 */
export function rankByAcoustic(
  pool: Track[],
  featureMap: Map<string, AcousticFeatureVector>,
  target: AcousticTarget
): Array<{ track: Track; score: number; features?: AcousticFeatureVector }> {
  const scored = pool.map((track) => {
    const features = featureMap.get(track.id)
    if (!features) return { track, score: 0.999 }
    const score = acousticScore(features, target)
    return { track, score, features }
  })

  return scored.sort((a, b) => a.score - b.score)
}

// ---------------------------------------------------------------------------
// Acoustic Service Client
// ---------------------------------------------------------------------------

const ACOUSTIC_SERVICE_URL = process.env.ACOUSTIC_SERVICE_URL

/** Returns true if the acoustic service is configured. */
export function isAcousticServiceEnabled(): boolean {
  return typeof ACOUSTIC_SERVICE_URL === 'string' && ACOUSTIC_SERVICE_URL.length > 0
}

export interface AcousticBatchResult {
  /** Map from track ID to feature vector. Only contains tracks that have preview URLs. */
  featureMap: Map<string, AcousticFeatureVector>
  /** Track IDs where analysis failed (preview URL missing or service error). */
  failed: string[]
}

/** Fetch acoustic features for a batch of tracks in parallel.
 *  Tracks without preview URLs are skipped gracefully.
 *  If ACOUSTIC_SERVICE_URL is not set, returns an empty result (graceful degradation).
 */
export async function fetchAcousticFeatures(tracks: Track[]): Promise<AcousticBatchResult> {
  const featureMap = new Map<string, AcousticFeatureVector>()
  const failed: string[] = []

  if (!isAcousticServiceEnabled()) {
    return { featureMap, failed }
  }

  // Build a map from preview URL → track ID so we can match results back
  const urlToId = new Map<string, string>()
  const urlsToFetch: string[] = []
  for (const track of tracks) {
    if (track.previewUrl) {
      urlToId.set(track.previewUrl, track.id)
      urlsToFetch.push(track.previewUrl)
    } else {
      failed.push(track.id)
    }
  }

  if (urlsToFetch.length === 0) {
    return { featureMap, failed }
  }

  try {
    const res = await fetch(`${ACOUSTIC_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preview_urls: urlsToFetch }),
      // Don't block suggestion generation for too long
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      console.warn(`[acoustic] Service returned ${res.status}, falling back to LLM estimates`)
      return { featureMap, failed: tracks.map((t) => t.id) }
    }

    const data = await res.json() as { results: Array<AcousticFeatureVector & { url: string; error?: string }> }

    for (const result of data.results) {
      const trackId = urlToId.get(result.url)
      if (!trackId) continue
      if (result.error) {
        failed.push(trackId)
      } else {
        featureMap.set(trackId, result)
      }
    }
  } catch (err) {
    console.warn('[acoustic] Service unreachable, falling back to LLM estimates:', err)
    return { featureMap, failed: tracks.map((t) => t.id) }
  }

  return { featureMap, failed }
}
