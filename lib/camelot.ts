/**
 * Spotify: key 0–11 (C=0 … B=11), mode 0 = minor, 1 = major.
 * Camelot: slot 0–11 + ring A (minor) / B (major).
 */

export type CamelotCode = `${number}${'A' | 'B'}`

/** `${spotifyKey}-${spotifyMode}` → Camelot code (e.g. "0B" = C major on the B ring). */
export const CAMELOT_WHEEL: Record<string, CamelotCode> = {
  // B ring — major
  '0-1': '0B', // C maj
  '7-1': '1B', // G maj
  '2-1': '2B', // D maj
  '9-1': '3B', // A maj
  '4-1': '4B', // E maj
  '11-1': '5B', // B maj
  '6-1': '6B', // F# maj
  '1-1': '7B', // C# maj
  '8-1': '8B', // Ab maj
  '3-1': '9B', // Eb maj
  '10-1': '10B', // Bb maj
  '5-1': '11B', // F maj
  // A ring — minor
  '9-0': '0A', // Am
  '4-0': '1A', // Em
  '11-0': '2A', // Bm
  '6-0': '3A', // F#m
  '1-0': '4A', // C#m
  '8-0': '5A', // G#m
  '3-0': '6A', // Ebm
  '10-0': '7A', // Bbm
  '5-0': '8A', // Fm
  '0-0': '9A', // Cm
  '7-0': '10A', // Gm
  '2-0': '11A', // Dm
}

const CAMELOT_TO_SPOTIFY = new Map<CamelotCode, [number, number]>()
for (const [km, code] of Object.entries(CAMELOT_WHEEL)) {
  const [k, m] = km.split('-').map(Number) as [number, number]
  CAMELOT_TO_SPOTIFY.set(code, [k, m])
}

/** Map a Camelot wheel code (e.g. "8B") to Spotify key (0–11) and mode (0 minor / 1 major). */
export function camelotCodeToSpotifyKeyMode(code: string): { key: number; mode: number } | null {
  const norm = code.trim().toUpperCase()
  if (!/^\d{1,2}[AB]$/.test(norm)) return null
  const pair = CAMELOT_TO_SPOTIFY.get(norm as CamelotCode)
  if (!pair) return null
  return { key: pair[0], mode: pair[1] }
}

function parseCamelot(code: CamelotCode): { slot: number; major: boolean } {
  const ring = code.endsWith('B') ? 'B' : 'A'
  const slot = Number.parseInt(code.slice(0, -1), 10)
  return { slot, major: ring === 'B' }
}

function toCamelotCode(slot: number, major: boolean): CamelotCode {
  const s = ((slot % 12) + 12) % 12
  return `${s}${major ? 'B' : 'A'}` as CamelotCode
}

/** Same slot (both rings), ±1 slot on B ring, ±1 slot on A ring. */
function compatibleCamelotCodes(slot: number): CamelotCode[] {
  const s = ((slot % 12) + 12) % 12
  const out = new Set<CamelotCode>()
  out.add(toCamelotCode(s, true))
  out.add(toCamelotCode(s, false))
  out.add(toCamelotCode(s - 1, true))
  out.add(toCamelotCode(s + 1, true))
  out.add(toCamelotCode(s - 1, false))
  out.add(toCamelotCode(s + 1, false))
  return [...out]
}

/**
 * Distinct [key, mode] pairs (Spotify) that mix well with the given key+mode:
 * same Camelot slot (relative major/minor), ±1 on the B ring, ±1 on the A ring.
 */
export function compatibleKeys(key: number, mode: number): number[][] {
  const code = CAMELOT_WHEEL[`${key}-${mode}`]
  if (!code) return []
  const { slot } = parseCamelot(code)
  const codes = compatibleCamelotCodes(slot)
  const seen = new Set<string>()
  const pairs: number[][] = []
  for (const c of codes) {
    const sm = CAMELOT_TO_SPOTIFY.get(c)
    if (!sm) continue
    const id = `${sm[0]}-${sm[1]}`
    if (seen.has(id)) continue
    seen.add(id)
    pairs.push([sm[0], sm[1]])
  }
  return pairs
}
