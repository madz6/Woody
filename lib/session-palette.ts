import type { PersonaLens } from './types'

export type SessionPalette = 'dark-violet' | 'warm-amber' | 'cool-moss' | 'neutral'

const DARK_VIOLET_WORDS = new Set([
  'dark', 'nocturnal', 'introspective', 'melancholy', 'brooding',
  'mysterious', 'somber', 'shadowy', 'deep', 'late-night', 'midnight',
])
const WARM_AMBER_WORDS = new Set([
  'warm', 'uplifting', 'energetic', 'forward', 'bright', 'euphoric',
  'sunny', 'triumphant', 'celebratory', 'excited', 'driving', 'powerful',
])
const COOL_MOSS_WORDS = new Set([
  'earthy', 'organic', 'acoustic', 'grounded', 'natural', 'pastoral',
  'folk', 'wooden', 'raw', 'stripped', 'honest',
])

/** Map a PersonaLens to a UI palette class.
 *  Sets data-palette on <html> to shift 2D UI color temperature.
 *  Three.js mood tinting is handled separately via WoodyMap moodTint prop.
 */
export function paletteFromLens(lens: PersonaLens): SessionPalette {
  const allWords = [...lens.mood, ...lens.texture].map((w) => w.toLowerCase())

  if (
    lens.energy === 'low' &&
    allWords.some((w) => DARK_VIOLET_WORDS.has(w))
  ) return 'dark-violet'

  if (
    lens.energy !== 'low' &&
    allWords.some((w) => WARM_AMBER_WORDS.has(w))
  ) return 'warm-amber'

  if (allWords.some((w) => COOL_MOSS_WORDS.has(w))) return 'cool-moss'

  return 'neutral'
}

/** Apply the session palette to the document root. */
export function applySessionPalette(lens: PersonaLens): void {
  const palette = paletteFromLens(lens)
  document.documentElement.setAttribute('data-palette', palette)
}

/** Reset palette to neutral (e.g. when session ends). */
export function resetSessionPalette(): void {
  document.documentElement.setAttribute('data-palette', 'neutral')
}
