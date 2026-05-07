import { compatibleKeys } from './camelot'

export type HeuristicScore = {
  keyCompatibility: number
  bpmCompatibility: number
  energyFlow: 'match' | 'build' | 'drop' | 'neutral'
  overallScore: number
}

type Trackish = {
  key?: number
  mode?: number
  tempo?: number
  energy?: number
}

function isKeyMissing(k: number | undefined | null): boolean {
  return k === undefined || k === null || k < 0
}

function isTempoMissing(t: number | undefined | null): boolean {
  return t === undefined || t === null || t <= 0
}

function isEnergyMissing(e: number | undefined | null): boolean {
  return e === undefined || e === null
}

function keysCompatible(a: Trackish, b: Trackish): boolean {
  if (isKeyMissing(a.key) || isKeyMissing(b.key)) return false
  const ak = a.key as number
  const am = a.mode ?? 0
  const bk = b.key as number
  const bm = b.mode ?? 0
  const compat = compatibleKeys(ak, am)
  return compat.some(([k, m]) => k === bk && m === bm)
}

/** Same Spotify key index (parallel / same letter class); used when not Camelot-compatible. */
function keysEnharmonicLoose(a: Trackish, b: Trackish): boolean {
  if (isKeyMissing(a.key) || isKeyMissing(b.key)) return false
  return (a.key as number) === (b.key as number)
}

export function scoreTransition(from: Trackish, to: Trackish): HeuristicScore {
  let keyCompatibility: number
  if (isKeyMissing(from.key) || isKeyMissing(to.key)) {
    keyCompatibility = 0.7
  } else if (keysCompatible(from, to)) {
    keyCompatibility = 1
  } else if (keysEnharmonicLoose(from, to)) {
    keyCompatibility = 0.5
  } else {
    keyCompatibility = 0
  }

  let bpmCompatibility: number
  if (isTempoMissing(from.tempo) || isTempoMissing(to.tempo)) {
    bpmCompatibility = 0.6
  } else {
    const d = Math.abs((from.tempo as number) - (to.tempo as number))
    if (d < 8) bpmCompatibility = 1
    else if (d < 15) bpmCompatibility = 0.7
    else if (d < 25) bpmCompatibility = 0.4
    else bpmCompatibility = 0.1
  }

  let energyFlow: HeuristicScore['energyFlow'] = 'neutral'
  if (!isEnergyMissing(from.energy) && !isEnergyMissing(to.energy)) {
    const fe = from.energy as number
    const te = to.energy as number
    const diff = Math.abs(fe - te)
    if (diff < 0.15) energyFlow = 'match'
    else if (te > fe + 0.15) energyFlow = 'build'
    else if (te < fe - 0.15) energyFlow = 'drop'
    else energyFlow = 'neutral'
  }

  const energyWeight =
    energyFlow === 'match' ? 0.25 : energyFlow === 'neutral' ? 0.15 : 0.1

  const overallScore =
    keyCompatibility * 0.4 + bpmCompatibility * 0.35 + energyWeight

  return {
    keyCompatibility,
    bpmCompatibility,
    energyFlow,
    overallScore,
  }
}

export function rankByTransition<
  T extends { key?: number; mode?: number; tempo?: number; energy?: number },
>(from: Trackish | null, candidates: T[]): T[] {
  if (from === null) return [...candidates]
  return [...candidates].sort(
    (a, b) => scoreTransition(from, b).overallScore - scoreTransition(from, a).overallScore
  )
}
