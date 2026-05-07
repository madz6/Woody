import type { PersonaLens } from './types'

/** Globe drag deltas → bias PersonaLens before search (PRD M4 numeric steer). */
export function applyGlobeSteerToLens(
  lens: PersonaLens,
  steer: { azimuth: number; polar: number }
): PersonaLens {
  const { azimuth, polar } = steer
  let energy = lens.energy
  let tempo = lens.tempo
  const mood = [...lens.mood]
  const texture = [...lens.texture]

  if (polar < -0.06) {
    if (energy === 'high') energy = 'medium'
    else if (energy === 'medium') energy = 'low'
    if (!mood.some((m) => /nocturnal|darker|shadow/i.test(m))) mood.push('nocturnal')
  }
  if (polar > 0.06) {
    if (energy === 'low') energy = 'medium'
    else if (energy === 'medium') energy = 'high'
    if (!mood.some((m) => /open|daylight|brightness/i.test(m))) mood.push('open air')
  }
  if (azimuth > 0.1) {
    if (tempo === 'slow') tempo = 'medium'
    if (!texture.some((t) => /warm|momentum|drive/i.test(t))) texture.push('warm momentum')
  }
  if (azimuth < -0.1) {
    if (tempo === 'fast') tempo = 'medium'
    if (!texture.some((t) => /cool|still|minimal/i.test(t))) texture.push('cool stillness')
  }

  return { ...lens, energy, tempo, mood, texture }
}

/** Optional: append steer phrase to intent text (legacy / debugging). */
export function buildSteeredIntent(originalIntent: string, steerAppend: string): string {
  const tail = steerAppend.trim()
  if (!tail) return originalIntent.trim()
  return `${originalIntent.trim()} → ${tail}`
}
