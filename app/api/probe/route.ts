/**
 * GET  /api/probe        — returns the 8 probe tracks with CLAP embeddings
 * POST /api/probe        — accepts probe signals, returns the territory centroid
 *
 * Per WOODY_BUILD_SPEC.md Section 6. The 8 probes are pre-selected to span
 * the CLAP embedding space. Step 2.4's pairwise distance gate (>0.30 between
 * any two probes) must pass before this route is trusted to seed territory —
 * run scripts/validate_probes.py against the running acoustic service.
 *
 * Probe identity: artist + title pair, resolved to Spotify ID via search,
 * embedded via iTunes audio preview through the acoustic service. The
 * server caches resolved {track, embedding} pairs in-process for the process
 * lifetime — this is acceptable for Phase 1 (cold start happens rarely).
 */

import { NextRequest, NextResponse } from 'next/server'

import {
  embedAudioBatch,
  isAcousticServiceEnabled,
} from '@/lib/acousticService'
import {
  computeTerritoryFromProbe,
  PROBE_SIGNAL_WEIGHTS,
  validateProbeSpan,
  type ProbeSignal,
  type ProbeSignalType,
} from '@/lib/coldStart'
import { searchTracks } from '@/lib/spotify'
import type { CLAPEmbedding, Track } from '@/lib/types'

/**
 * The 8 probe tracks per WOODY_BUILD_SPEC.md Section 6.1.
 * Each spans a distinct corner of the CLAP embedding space; the curveball is
 * deliberately culturally orthogonal so the centroid does not collapse onto
 * Western pop by default.
 *
 * To swap a probe: change artist/title here, then re-run validate_probes.py.
 * Probe IDs (the `id` field) are stable across changes and are what clients
 * send back in POST signals — these never need to be Spotify IDs.
 */
const PROBE_SPECS: Array<{
  id: string
  artist: string
  title: string
  axisHint: string
}> = [
  { id: 'high_energy_cold', artist: 'Aphex Twin', title: 'Come to Daddy', axisHint: 'high energy + cold' },
  { id: 'high_energy_warm', artist: 'Kendrick Lamar', title: 'HUMBLE.', axisHint: 'high energy + warm' },
  { id: 'low_energy_cold', artist: 'Stars of the Lid', title: 'Requiem for Dying Mothers', axisHint: 'low energy + cold' },
  { id: 'low_energy_warm_sacred', artist: 'Nick Drake', title: 'Pink Moon', axisHint: 'low energy + warm + sacred' },
  { id: 'high_density_mid_energy', artist: 'Death Grips', title: 'Guillotine', axisHint: 'high density + mid energy' },
  { id: 'high_organicity_low_density', artist: 'Nils Frahm', title: 'Says', axisHint: 'high organicity + low density' },
  { id: 'centre_of_mass', artist: 'Radiohead', title: 'Exit Music (For A Film)', axisHint: 'mid everything' },
  { id: 'curveball_cross_cultural', artist: 'Tinariwen', title: 'Tamiditin Tan Ufrawan', axisHint: 'cross-cultural orthogonal' },
]

interface ResolvedProbe {
  probeId: string
  axisHint: string
  track: Track
  embedding: CLAPEmbedding
}

// Process-lifetime cache. Cold start is infrequent; recomputing per request
// would waste CLAP inference. Cache invalidates on server restart.
let _probesCache: ResolvedProbe[] | null = null
let _probesCachePromise: Promise<ResolvedProbe[]> | null = null

async function resolveProbes(): Promise<ResolvedProbe[]> {
  if (_probesCache) return _probesCache
  if (_probesCachePromise) return _probesCachePromise

  _probesCachePromise = (async () => {
    // Step 1: resolve each probe spec independently so index alignment is preserved
    // even when a search returns zero results (resolveTracksToSpotify .flat() would
    // collapse gaps).
    const spotifyResults: Array<Track | null> = await Promise.all(
      PROBE_SPECS.map(async (spec) => {
        try {
          const found = await searchTracks(`${spec.title} ${spec.artist}`, 1)
          return found[0] ?? null
        } catch (err) {
          console.warn(`[/api/probe] Spotify search failed for ${spec.id}:`, err)
          return null
        }
      }),
    )

    // Step 2: build embed-batch input — falls back to iTunes if preview_url is empty,
    // which is the expected path post-Spotify-deprecation.
    const embedInputs = PROBE_SPECS.map((spec, idx) => {
      const found = spotifyResults[idx]
      return {
        id: spec.id, // use probe ID as the embedding key, not the Spotify id
        previewUrl: found?.previewUrl,
        artist: spec.artist,
        title: spec.title,
        spec,
        found,
      }
    })
    const embeddings = await embedAudioBatch(
      embedInputs.map((e) => ({
        id: e.id,
        previewUrl: e.previewUrl,
        artist: e.artist,
        title: e.title,
      })),
    )
    const byId = new Map(embeddings.map((e) => [e.id, e]))

    const resolved: ResolvedProbe[] = []
    for (const e of embedInputs) {
      const embResult = byId.get(e.id)
      if (!embResult?.embedding) {
        console.warn(
          `[/api/probe] probe ${e.id} (${e.spec.artist} — ${e.spec.title}) ` +
            `did not produce an embedding: ${embResult?.error ?? 'unknown'}`,
        )
        continue
      }
      const track: Track = e.found ?? {
        id: `probe:${e.id}`,
        name: e.title,
        artist: e.artist,
        album: '',
        durationMs: 0,
      }
      resolved.push({
        probeId: e.id,
        axisHint: e.spec.axisHint,
        track,
        embedding: embResult.embedding,
      })
    }
    return resolved
  })()

  try {
    const result = await _probesCachePromise
    _probesCache = result
    return result
  } finally {
    _probesCachePromise = null
  }
}

// ─── GET /api/probe ──────────────────────────────────────────────────────────

export async function GET() {
  if (!isAcousticServiceEnabled()) {
    return NextResponse.json(
      { error: 'acoustic_service_disabled' },
      { status: 503 },
    )
  }
  try {
    const probes = await resolveProbes()
    const spanCheck = validateProbeSpan(
      probes.map((p) => ({ id: p.probeId, embedding: p.embedding })),
      0.3,
    )
    return NextResponse.json({
      probes: probes.map((p) => ({
        probeId: p.probeId,
        axisHint: p.axisHint,
        track: p.track,
        embedding: p.embedding,
      })),
      spanCheck,
      probeCount: probes.length,
      expectedCount: PROBE_SPECS.length,
    })
  } catch (err) {
    console.error('[/api/probe GET] failed:', err)
    return NextResponse.json(
      { error: 'probe_resolution_failed', detail: String(err) },
      { status: 502 },
    )
  }
}

// ─── POST /api/probe ─────────────────────────────────────────────────────────

interface ProbeSignalInput {
  probeId: unknown
  signal: unknown
}

interface ProbePostBody {
  signals: ProbeSignalInput[]
}

function isValidSignalType(value: unknown): value is ProbeSignalType {
  return typeof value === 'string' && value in PROBE_SIGNAL_WEIGHTS
}

export async function POST(request: NextRequest) {
  if (!isAcousticServiceEnabled()) {
    return NextResponse.json(
      { error: 'acoustic_service_disabled' },
      { status: 503 },
    )
  }

  let body: ProbePostBody
  try {
    body = (await request.json()) as ProbePostBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!Array.isArray(body.signals) || body.signals.length === 0) {
    return NextResponse.json(
      { error: 'signals_required', message: 'Pass {signals: [{probeId, signal}, ...]}' },
      { status: 400 },
    )
  }

  let probes: ResolvedProbe[]
  try {
    probes = await resolveProbes()
  } catch (err) {
    console.error('[/api/probe POST] probe resolution failed:', err)
    return NextResponse.json(
      { error: 'probe_resolution_failed', detail: String(err) },
      { status: 502 },
    )
  }

  const probeIndex = new Map(probes.map((p) => [p.probeId, p]))
  const validated: ProbeSignal[] = []
  const rejected: Array<{ probeId: unknown; reason: string }> = []

  for (const sig of body.signals) {
    if (typeof sig.probeId !== 'string') {
      rejected.push({ probeId: sig.probeId, reason: 'probeId not a string' })
      continue
    }
    if (!isValidSignalType(sig.signal)) {
      rejected.push({ probeId: sig.probeId, reason: `signal not in ${Object.keys(PROBE_SIGNAL_WEIGHTS).join('|')}` })
      continue
    }
    const probe = probeIndex.get(sig.probeId)
    if (!probe) {
      rejected.push({ probeId: sig.probeId, reason: 'unknown probeId' })
      continue
    }
    validated.push({ probeId: probe.probeId, signal: sig.signal, embedding: probe.embedding })
  }

  if (validated.length === 0) {
    return NextResponse.json(
      { error: 'no_valid_signals', rejected },
      { status: 400 },
    )
  }

  const territoryCentroid = computeTerritoryFromProbe(validated)

  return NextResponse.json({
    territoryCentroid,
    signalCount: validated.length,
    rejected,
    weightTable: PROBE_SIGNAL_WEIGHTS,
  })
}
