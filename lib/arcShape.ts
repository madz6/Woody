/**
 * Arc shape inference from intent text.
 *
 * Per WOODY_BUILD_SPEC.md Section 5.3 and .cursor/rules/woody-engine.mdc.
 * Rule-based for Phase 1; LLM-assisted in Phase 2 if signals collide.
 *
 * The shape biases waypoint progression in the CLAP arc generator:
 *   journey     — linear movement from current to target (default)
 *   plateau     — reach target by ~40% then hold (focus / study)
 *   discharge   — stay congruent with start for ~40% then move (grief / sit with)
 *   peak_early  — peak at ~40% then descend (workout / activity, BRAC-aligned)
 */

import type { ArcShape } from './types'

const DISCHARGE_SIGNALS = [
  'process',
  'feel it',
  'meet me',
  'sad',
  'grief',
  'release',
  'cry',
  'let it out',
  'sit with',
  'congruent',
  'match my mood',
  'meets me',
  'heavy',
  'loss',
  'mourn',
]

const PLATEAU_SIGNALS = [
  'study',
  'focus',
  'work',
  'deep work',
  'concentrate',
  'maintain',
  'keep going',
  'flow',
  'consistent',
  'lock in',
  'locked in',
  'background',
]

const PEAK_EARLY_SIGNALS = [
  'workout',
  'run',
  'lift',
  'training',
  'exercise',
  'gym',
  'peak',
  'warm up',
  'high intensity',
  'sprint',
  'cardio',
  'pregame',
  'cooldown',
  'cool down',
]

function matches(text: string, signals: readonly string[]): boolean {
  return signals.some((s) => text.includes(s))
}

/**
 * Infer the arc shape for an intent. Always returns a shape — defaults to
 * 'journey' when no specialised signal is present.
 *
 * Conflict resolution: discharge > peak_early > plateau > journey. The order
 * matches psychological priority — discharge (state-matching) is the most
 * restrictive and overrides activity / focus framings if both appear.
 */
export function inferArcShape(intentText: string): ArcShape {
  const lower = intentText.toLowerCase()
  if (matches(lower, DISCHARGE_SIGNALS)) return 'discharge'
  if (matches(lower, PEAK_EARLY_SIGNALS)) return 'peak_early'
  if (matches(lower, PLATEAU_SIGNALS)) return 'plateau'
  return 'journey'
}

/** Useful for diagnostics / logging — tells the caller which signal fired. */
export function explainShapeChoice(intentText: string): {
  shape: ArcShape
  matched: string[]
} {
  const lower = intentText.toLowerCase()
  const dischargeHits = DISCHARGE_SIGNALS.filter((s) => lower.includes(s))
  if (dischargeHits.length) return { shape: 'discharge', matched: dischargeHits }
  const peakHits = PEAK_EARLY_SIGNALS.filter((s) => lower.includes(s))
  if (peakHits.length) return { shape: 'peak_early', matched: peakHits }
  const plateauHits = PLATEAU_SIGNALS.filter((s) => lower.includes(s))
  if (plateauHits.length) return { shape: 'plateau', matched: plateauHits }
  return { shape: 'journey', matched: [] }
}
