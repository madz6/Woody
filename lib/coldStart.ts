/**
 * Cold-start territory estimation via Bayesian acoustic probe.
 *
 * Per WOODY_BUILD_SPEC.md Section 6: 8 probe tracks span the CLAP embedding
 * space. The user's behavioral response (skip / listen / save / replay) to
 * each probe contributes a signed weight to a weighted-average centroid in
 * 512D CLAP space. The result is the user's initial territory position —
 * the starting point for subsequent arc generation.
 *
 * This supersedes "use Spotify history as territory" per SHELVED.md — Spotify
 * history encodes Spotify's collaborative-filtering bias, not the listener's
 * actual acoustic preference.
 */

import type { CLAPEmbedding } from './types'

/** Behavioral response weights per WOODY_BUILD_SPEC.md Section 6.3. */
export const PROBE_SIGNAL_WEIGHTS = {
  save: 4.0,
  replay: 3.0,
  listen_through: 1.0,
  skip_late: -0.5,
  skip_early: -1.5,
  skip_immediate: -2.5,
} as const

export type ProbeSignalType = keyof typeof PROBE_SIGNAL_WEIGHTS

export interface ProbeSignal {
  probeId: string
  signal: ProbeSignalType
  embedding: CLAPEmbedding
}

const EMBEDDING_DIM = 512

function l2Normalise(vec: Float32Array): Float32Array {
  let norm = 0
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i]
  norm = Math.sqrt(norm)
  if (norm < 1e-8) return vec
  const out = new Float32Array(vec.length)
  for (let i = 0; i < vec.length; i++) out[i] = vec[i] / norm
  return out
}

/**
 * Compute the territory centroid from a set of probe responses.
 *
 * Returns null if every signal has zero weight or no signals are provided
 * (insufficient information — caller should keep the user in "no centroid" state).
 *
 * The returned centroid is L2-normalised so it can be used directly as
 * `currentPosition` for /api/arc.
 */
export function computeTerritoryFromProbe(signals: ProbeSignal[]): CLAPEmbedding | null {
  if (signals.length === 0) return null

  const weighted = new Float32Array(EMBEDDING_DIM)
  let totalAbsWeight = 0

  for (const s of signals) {
    if (s.embedding.length !== EMBEDDING_DIM) {
      throw new Error(
        `computeTerritoryFromProbe: probe ${s.probeId} has wrong embedding dim ${s.embedding.length}`,
      )
    }
    const w = PROBE_SIGNAL_WEIGHTS[s.signal]
    if (w === 0) continue
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      weighted[i] += w * s.embedding[i]
    }
    totalAbsWeight += Math.abs(w)
  }

  if (totalAbsWeight === 0) return null

  for (let i = 0; i < EMBEDDING_DIM; i++) weighted[i] /= totalAbsWeight
  const normalised = l2Normalise(weighted)
  return Array.from(normalised)
}

/** Validate that a probe set spans the embedding space.
 *  Min pairwise cosine distance must exceed `threshold` (default 0.30 per build plan).
 *  Returns the failing pairs so callers can replace probes deliberately. */
export function validateProbeSpan(
  probes: Array<{ id: string; embedding: CLAPEmbedding }>,
  threshold = 0.3,
): { ok: boolean; minDistance: number; failingPairs: Array<{ a: string; b: string; distance: number }> } {
  if (probes.length < 2) return { ok: true, minDistance: 1, failingPairs: [] }

  let minDist = Number.POSITIVE_INFINITY
  const failing: Array<{ a: string; b: string; distance: number }> = []

  for (let i = 0; i < probes.length; i++) {
    for (let j = i + 1; j < probes.length; j++) {
      const a = probes[i].embedding
      const b = probes[j].embedding
      let dot = 0
      for (let k = 0; k < a.length; k++) dot += a[k] * b[k]
      const distance = 1 - dot
      if (distance < minDist) minDist = distance
      if (distance < threshold) {
        failing.push({ a: probes[i].id, b: probes[j].id, distance })
      }
    }
  }

  return {
    ok: failing.length === 0,
    minDistance: minDist === Number.POSITIVE_INFINITY ? 1 : minDist,
    failingPairs: failing,
  }
}
