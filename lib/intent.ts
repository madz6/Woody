// Woody Intent Engine
// Parses natural language vibe into a PersonaLens, then finds tracks.
// Provider: 'gemini' (free) | 'claude' (cheap, better JSON reliability)
// Set AI_PROVIDER in .env.local to switch.

import { buildIntentKey, buildLearnedBiasFromEntry } from './memory'
import { ZONE_SEARCH_BIAS } from './mapZones'
import { applyGlobeSteerToLens } from './onSteer'
import type {
  AcousticFeatureVector,
  IntentMemoryEntry,
  MapZoneId,
  PersonaLens,
  TasteCentroid,
  TasteProfile,
  TrackAudioAttributes,
  TrackSuggestion,
} from './types'
import { resolveTracksToSpotify, searchTracks } from './spotify'
import { getLastFmArtistSimilar, getLastFmArtistTopTracks, getLastFmSimilarTracks } from './enrichment/lastfm'
import {
  acousticTargetFromLens,
  blendIntentBias,
  blendTargetWithTaste,
  fetchAcousticFeatures,
  isAcousticServiceEnabled,
  rankByAcoustic,
} from './acoustic'

const PROVIDER = (process.env.AI_PROVIDER ?? 'gemini') as 'gemini' | 'claude'

/** PRD M1: 4–6 suggestions per intent when the pool is large enough. */
export const SUGGESTION_COUNT_MIN = 4
export const SUGGESTION_COUNT_MAX = 6

export function finalSuggestionCount(uniquePoolSize: number): number {
  if (uniquePoolSize <= 0) return 0
  if (uniquePoolSize < SUGGESTION_COUNT_MIN) return uniquePoolSize
  return Math.min(SUGGESTION_COUNT_MAX, uniquePoolSize)
}

const INTENT_PROMPT = (intentText: string, tasteNote = '', layerContext = '', learnedNote = '') =>
  `You are Woody's intent parser. Convert this music vibe description into a structured JSON object.

${layerContext}Vibe: "${intentText}"
${tasteNote}
${learnedNote}

Return ONLY valid JSON matching this exact shape (no markdown, no explanation):
{
  "energy": "low" | "medium" | "high",
  "mood": string[],
  "exclusions": string[],
  "tempo": "slow" | "medium" | "fast",
  "era": string | null,
  "texture": string[],
  "rawIntent": string,
  "searchQueries": string[],
  "spotifyGenres": string[],
  "artistSeeds": string[],
  "oracleArtists": string[]
}

Rules:
- "No sad piano" -> exclusions: ["sad piano", "melancholy piano"]
- "Glossy" -> texture: ["glossy", "polished", "clean production"]
- "Late night drive" -> energy: "medium", mood: ["nocturnal", "introspective", "forward motion"]
- searchQueries: 3 Spotify-style queries describing the SONIC FEEL, never artist names (fallback only)
- spotifyGenres: use valid Spotify genre seeds like "electronic", "indie", "jazz", "r-n-b"
- artistSeeds: list any artist names EXPLICITLY MENTIONED in the vibe (empty array if none)
- oracleArtists: 4-6 artist names from DIFFERENT scenes, eras, or regions than the named artists,
  who are sonically adjacent to the described territory. Include artists who might not appear in
  mainstream similarity algorithms due to cultural or geographic distance from the named artists.
  Examples: if vibe is Atlanta trap + psychedelic rock, oracle might include UK bass artists with
  similar textural qualities, West African producers with matching energy patterns, Japanese
  experimental artists with adjacent atmospherics. Never repeat artistSeeds in oracleArtists.
  If no artist names are mentioned in the vibe, use the sonic description to name 4-6 oracle artists.

ARTIST BLEND RULE (critical):
If the vibe references artists by name (e.g. "X meets Y", "sounds like X but more Y", "X and Y energy"):
1. Decompose what makes each artist sonically distinctive -- production style, texture, mood, tempo, not just genre label
2. Blend those sonic qualities into searchQueries and mood/texture fields
3. Put the artist names in artistSeeds (NOT in searchQueries)
4. For oracleArtists, name artists from DIFFERENT cultural contexts who share sonic qualities
5. Example: "Young Nudy meets Tame Impala"
   - Young Nudy: dark Atlanta trap, heavy 808s, melodic street flow, layered adlibs, menacing atmospheric beats
   - Tame Impala: psychedelic reverb, dreamy synth layers, transcendent space-like texture, woozy rock-pop
   - artistSeeds: ["Young Nudy", "Tame Impala"]
   - oracleArtists: ["MIKE", "Billy Woods", "Kendrick Scott Oracle", "Floating Points", "Unknown Mortal Orchestra", "Shlohmo"]
     (different scenes: underground rap, jazz-adjacent electronic, psychedelic soul -- not the Atlanta trap scene)
6. The mood/texture fields must capture qualities from BOTH artists`

export type ReasonWithAudio = {
  reason: string
  bpm?: number
  energy?: number
  valence?: number
  key?: string
  /** PRD S2: short production/texture tags */
  textureTags?: string[]
}

const REASONS_PROMPT = (tracks: { name: string; artist: string }[], lens: PersonaLens) =>
  `You are Woody. For each track, write a SHORT reason (under 10 words, no punctuation) why it fits this vibe, and estimate audio attributes for DJ-style sequencing.

Vibe: "${lens.rawIntent}"
Mood: ${lens.mood.join(', ')}
Texture: ${lens.texture.join(', ')}

Tracks:
${tracks.map((t, i) => `${i + 1}. ${t.name} by ${t.artist}`).join('\n')}

Return ONLY a JSON array with one object per track, in the same order as the list above. Each object must have:
- "reason": string (under 10 words, no punctuation)
- "bpm": integer, estimated tempo (e.g. 92)
- "energy": number from 0.0 to 1.0 (0 = very calm, 1 = very intense)
- "valence": number from 0.0 to 1.0 (0 = dark/sad, 1 = bright/happy)
- "key": string, Camelot notation only, e.g. "8B", "3A" (capital letter A or B)
- "textureTags": string[], 2-4 short tags for production/texture e.g. ["glossy","808-heavy","reverb-wash"]

Example:
[{"reason":"glossy forward momentum","bpm":118,"energy":0.65,"valence":0.55,"key":"9B","textureTags":["glossy","synth-led","bright"]},{"reason":"nocturnal without the weight","bpm":72,"energy":0.35,"valence":0.25,"key":"5A","textureTags":["sparse","sub-heavy","roomy"]}]`

async function callGemini(prompt: string): Promise<string> {
  const model = 'gemini-2.0-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 600,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

async function callAI(prompt: string): Promise<string> {
  if (PROVIDER === 'gemini') return callGemini(prompt)
  return callClaude(prompt)
}

export async function classifyIntentMode(
  newIntent: string,
  previousIntent: string
): Promise<'layer' | 'redirect'> {
  const prompt = `You are classifying user intent. Given a previous music vibe description and a new one,
decide if the new one is LAYERING (refining/deepening the existing vibe) or REDIRECTING (pivoting to something new).
Previous: ${previousIntent}
New: ${newIntent}
Reply with only the word LAYER or REDIRECT.`
  try {
    const raw = (await callAI(prompt)).toUpperCase()
    return raw.includes('LAYER') ? 'layer' : 'redirect'
  } catch {
    return 'layer'
  }
}

function extractJSON(text: string, type: 'object' | 'array'): any {
  const pattern = type === 'object' ? /\{[\s\S]*\}/ : /\[[\s\S]*\]/
  const clean = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
  const match = clean.match(pattern)
  if (!match) throw new Error(`No JSON ${type} found in AI response`)
  return JSON.parse(match[0])
}

export async function parseIntent(
  intentText: string,
  tasteProfile?: TasteProfile | null,
  previousLens?: PersonaLens | null,
  learnedNote?: string,
  coldStartNote?: string
): Promise<PersonaLens> {
  const tasteNote =
    tasteProfile && tasteProfile.sessionCount > 0
      ? `Listener context: typically ${tasteProfile.dominantTones.slice(0, 4).join(', ')} tones; moods such as ${tasteProfile.commonMoods.slice(0, 10).join(', ')}; average energy ${tasteProfile.avgEnergy}. Bias searchQueries and spotifyGenres toward this territory while keeping one surprising but coherent pick.`
      : ''
  const layerContext =
    previousLens != null
      ? `Context: user was previously listening to: energy=${previousLens.energy}, mood=${previousLens.mood.join(',')}, texture=${previousLens.texture.join(',')}.
They are layering, not redirecting. Preserve these qualities unless explicitly contradicted.

`
      : ''
  const combinedNote = [learnedNote, coldStartNote].filter(Boolean).join('\n')
  const raw = await callAI(INTENT_PROMPT(intentText, tasteNote, layerContext, combinedNote))
  return extractJSON(raw, 'object') as PersonaLens
}

function assignTone(index: number, lens: PersonaLens): TrackSuggestion['tone'] {
  const byEnergy: Record<string, TrackSuggestion['tone'][]> = {
    high: ['amber', 'violet', 'rose', 'moss'],
    low: ['violet', 'moss', 'rose', 'amber'],
    medium: ['violet', 'amber', 'moss', 'rose'],
  }
  return (byEnergy[lens.energy] ?? byEnergy.medium)[index % 4]
}

function normalizeReasonRow(raw: unknown, fallbackReason: string): ReasonWithAudio {
  if (typeof raw === 'string') {
    return { reason: raw.trim() || fallbackReason }
  }
  if (!raw || typeof raw !== 'object') {
    return { reason: fallbackReason }
  }
  const o = raw as Record<string, unknown>
  const reason =
    typeof o.reason === 'string' && o.reason.trim() ? o.reason.trim() : fallbackReason
  const bpm = typeof o.bpm === 'number' && Number.isFinite(o.bpm) ? Math.round(o.bpm) : undefined
  let energy: number | undefined
  if (typeof o.energy === 'number' && Number.isFinite(o.energy)) {
    energy = Math.max(0, Math.min(1, o.energy))
  }
  let valence: number | undefined
  if (typeof o.valence === 'number' && Number.isFinite(o.valence)) {
    valence = Math.max(0, Math.min(1, o.valence))
  }
  const key =
    typeof o.key === 'string' && /^(\d{1,2}[AB])$/i.test(o.key.trim())
      ? o.key.trim().toUpperCase()
      : undefined
  let textureTags: string[] | undefined
  if (Array.isArray(o.textureTags)) {
    const tags = o.textureTags
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.trim())
      .slice(0, 6)
    if (tags.length) textureTags = tags
  }
  return { reason, bpm, energy, valence, key, textureTags }
}

async function generateReasonsWithAudio(
  tracks: { name: string; artist: string }[],
  lens: PersonaLens
): Promise<ReasonWithAudio[]> {
  try {
    const raw = await callAI(REASONS_PROMPT(tracks, lens))
    const arr = extractJSON(raw, 'array') as unknown[]
    return tracks.map((track, i) => normalizeReasonRow(arr[i], 'fits your territory'))
  } catch {
    return tracks.map(() => ({ reason: 'fits your territory' }))
  }
}

function reasonRowToAudioAttributes(row: ReasonWithAudio): TrackAudioAttributes | undefined {
  const out: TrackAudioAttributes = {}
  if (row.bpm !== undefined) out.bpm = row.bpm
  if (row.energy !== undefined) out.energy = row.energy
  if (row.valence !== undefined) out.valence = row.valence
  if (row.key) out.key = row.key
  if (row.textureTags?.length) out.textureTags = row.textureTags
  if (
    out.bpm === undefined &&
    out.energy === undefined &&
    out.valence === undefined &&
    !out.key &&
    !(out.textureTags?.length)
  ) {
    return undefined
  }
  return out
}

function assignMapZoneId(
  lens: PersonaLens,
  audio: TrackAudioAttributes | undefined,
  tone: TrackSuggestion['tone'],
  index: number
): MapZoneId {
  const e = audio?.energy
  const v = audio?.valence
  const tex = [...lens.texture, ...lens.mood, ...(audio?.textureTags ?? [])]
    .join(' ')
    .toLowerCase()
  const organic = /acoustic|organic|folk|wood|live|unplugged|strings|warm vocal/.test(tex)
  const electronic = /synth|electronic|digital|glossy|techno|808|pulse|signal/.test(tex)

  if (e !== undefined && e < 0.38) return 'dm'
  if ((e !== undefined && e > 0.72) || electronic || tone === 'amber') return 'sp'
  if (organic || tone === 'moss') return 'oc'
  if (e !== undefined && e <= 0.55 && v !== undefined && v < 0.42) return 'df'
  const rotate: MapZoneId[] = ['dm', 'sp', 'oc', 'df']
  return rotate[index % 4]
}

function baseEnergyForLens(lens: PersonaLens): number {
  if (lens.energy === 'high') return 0.8
  if (lens.energy === 'low') return 0.3
  return 0.5
}

function buildTargetEnergy(lens: PersonaLens, bias?: { avgEnergy?: number }): number {
  const base = baseEnergyForLens(lens)
  if (bias?.avgEnergy == null) return base
  return Math.max(0, Math.min(1, base * 0.4 + bias.avgEnergy * 0.6))
}

function deduplicateByNameArtist<T extends { name: string; artist: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.name.toLowerCase()}|${item.artist.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function intentToSuggestions(
  intentText: string,
  tasteProfile?: TasteProfile | null,
  previousLens?: PersonaLens | null,
  zoneId?: string | null,
  opts?: {
    excludeTrackIds?: string[] | null
    intentMemoryEntries?: IntentMemoryEntry[]
    firstSession?: boolean
    tasteCentroid?: TasteCentroid | null
    /** PRD M4: globe drag deltas bias the lens after NL parse. */
    steer?: { azimuth: number; polar: number }
  }
): Promise<{ suggestions: TrackSuggestion[]; personaLens: PersonaLens }> {
  const coldStartNote = opts?.firstSession
    ? `This is the user's first session. They may have typed a track name, an artist name, or a vibe. If it reads like a specific track or artist, treat it as a sonic anchor -- find similar-sounding tracks. If it reads like a mood or vibe, proceed normally.`
    : ''

  // Build learnedNote from previous lens territory (if we've been here before)
  let learnedNote = ''
  if (previousLens && opts?.intentMemoryEntries?.length) {
    const prevKey = buildIntentKey(previousLens)
    const prevEntry = opts.intentMemoryEntries.find((e) => e.intentKey === prevKey) ?? null
    const prevBias = buildLearnedBiasFromEntry(prevEntry)
    if (prevBias.avgEnergy != null || prevBias.dominantTones?.length) {
      learnedNote = `Learned preference: typically ~${prevBias.avgEnergy?.toFixed(2) ?? 'unknown'} energy, ${prevBias.dominantTones?.join(', ') ?? 'varied'} tones. Bias searchQueries toward this range.`
    }
  }

  let lens = await parseIntent(intentText, tasteProfile, previousLens, learnedNote, coldStartNote)
  if (opts?.steer) {
    lens = applyGlobeSteerToLens(lens, opts.steer)
  }
  const intentKey = buildIntentKey(lens)
  const matchingEntry =
    opts?.intentMemoryEntries?.find((entry) => entry.intentKey === intentKey) ?? null
  const bias = buildLearnedBiasFromEntry(matchingEntry)

  const artistSeeds = lens.artistSeeds ?? []
  const oracleArtists = lens.oracleArtists ?? []
  const zoneBias =
    zoneId != null && zoneId !== '' && zoneId in ZONE_SEARCH_BIAS
      ? ZONE_SEARCH_BIAS[zoneId as MapZoneId]
      : null
  const zoneQuery = zoneBias
    ? `${lens.searchQueries?.[0] ?? intentText} ${zoneBias}`
    : null

  // ---------------------------------------------------------------------------
  // Multi-Source Candidate Pool — four sources, one acoustic ranker
  // ---------------------------------------------------------------------------

  // Batch 1 (all in parallel): S1 raw, S2 similar-artist names, S3 oracle, zone
  const [s1RawResults, s2SimilarNameResults, s3Tracks, zoneResults] = await Promise.all([
    // S1: Last.fm top tracks for each named artist (highest trust — these ARE the territory)
    artistSeeds.length > 0
      ? Promise.all(artistSeeds.slice(0, 3).map((a) => getLastFmArtistTopTracks(a, 5).catch(() => [])))
      : Promise.resolve([] as Array<Array<{ name: string; artist: string }>>),

    // S2 prep: similar artist names from Last.fm for each named seed
    artistSeeds.length > 0
      ? Promise.all(artistSeeds.slice(0, 2).map((a) => getLastFmArtistSimilar(a, 5).catch(() => [] as string[])))
      : Promise.resolve([] as string[][]),

    // S3: LLM oracle artists → Spotify catalog search (cultural breadth, cross-scene)
    oracleArtists.length > 0
      ? Promise.all(oracleArtists.slice(0, 6).map((name) =>
          searchTracks(`artist:"${name}"`, 2).catch(() => [])
        )).then((results) => results.flat())
      : Promise.resolve([]),

    // Zone: context-specific zone search (if zone is active)
    zoneQuery ? searchTracks(zoneQuery, 6).catch(() => []) : Promise.resolve([]),
  ])

  // Batch 2 (parallel): resolve S1 to Spotify + fetch S2 neighborhood top tracks
  const s1Items = deduplicateByNameArtist(s1RawResults.flat())
  const s2ArtistNames = [...new Set(s2SimilarNameResults.flat())].slice(0, 8)

  const [s1Tracks, s2RawResults] = await Promise.all([
    resolveTracksToSpotify(s1Items),
    s2ArtistNames.length > 0
      ? Promise.all(s2ArtistNames.map((a) => getLastFmArtistTopTracks(a, 2).catch(() => [])))
      : Promise.resolve([] as Array<Array<{ name: string; artist: string }>>),
  ])

  // Batch 3 (parallel): resolve S2 + fetch S2b track-level similarity seeded from first S1 track
  const s2Items = deduplicateByNameArtist(s2RawResults.flat())
  const s1First = s1Tracks[0]

  const [s2Tracks, s2bTracks] = await Promise.all([
    resolveTracksToSpotify(s2Items),
    s1First
      ? getLastFmSimilarTracks(s1First.name, s1First.artist, 8)
          .then((items) => resolveTracksToSpotify(items.slice(0, 8)))
          .catch(() => [])
      : Promise.resolve([]),
  ])

  // Assemble pool: zone first (context-specific), then S1 (highest trust), then neighborhood, oracle
  const pool = [
    ...zoneResults,   // zone context
    ...s1Tracks,      // S1: named artist anchor tracks
    ...s2Tracks,      // S2: Last.fm neighborhood (data-driven)
    ...s2bTracks,     // S2b: track-level similarity from first S1
    ...s3Tracks,      // S3: oracle artists (cultural breadth)
  ]

  // S4: text search — primary when no artistSeeds (pure vibe intent), fallback otherwise
  // For "late night drive" style intents: artistSeeds is empty, so S1/S2 produce nothing.
  // For "Young Nudy meets Tame Impala": S1/S2/S3 should be sufficient; text is only a backup.
  const needsTextSearch = pool.length < 12
  if (needsTextSearch && lens.searchQueries?.length) {
    const [fallback1, fallback2] = await Promise.all([
      lens.searchQueries[0] ? searchTracks(lens.searchQueries[0], 8).catch(() => []) : Promise.resolve([]),
      lens.searchQueries[1] ? searchTracks(lens.searchQueries[1], 5).catch(() => []) : Promise.resolve([]),
    ])
    pool.push(...fallback1, ...fallback2)
  }

  // Deduplication + exclusion filter
  const excludeSet = new Set([
    ...(opts?.excludeTrackIds ?? []),
    ...bias.excludeTrackIds,
  ])
  const seen = new Set<string>()
  const unique = pool.filter((track) => {
    if (seen.has(track.id)) return false
    if (excludeSet.has(track.id)) return false
    seen.add(track.id)
    return true
  })

  if (unique.length === 0) {
    throw new Error(
      'No tracks found -- check Spotify API credentials and ensure LASTFM_API_KEY is set'
    )
  }

  const pickN = finalSuggestionCount(unique.length)

  // Acoustic ranking: real feature vectors from the acoustic service rank the pool.
  // If tasteCentroid has >= 3 samples, blend it in (35% taste, 65% intent target).
  let selected: typeof unique
  if (isAcousticServiceEnabled() && unique.length > 0) {
    try {
      const lensTarget = acousticTargetFromLens(lens)
      const intentBiasSampleCount = Math.max(
        matchingEntry?.playedEnergies.length ?? 0,
        matchingEntry?.playedBpms?.length ?? 0
      )
      const intentAdjustedTarget = blendIntentBias(lensTarget, bias, intentBiasSampleCount)
      const centroid = opts?.tasteCentroid
      const acousticTarget =
        centroid && centroid.sampleCount >= 3
          ? blendTargetWithTaste(intentAdjustedTarget, {
              energy: centroid.energy,
              bpm: centroid.bpm,
              spectral_centroid: centroid.spectralCentroid,
            } as Partial<AcousticFeatureVector>)
          : intentAdjustedTarget
      const { featureMap } = await fetchAcousticFeatures(unique.slice(0, 20))
      if (featureMap.size > 0) {
        const ranked = rankByAcoustic(unique.slice(0, 20), featureMap, acousticTarget)
        selected = ranked.map((r) => r.track).slice(0, pickN)
      } else {
        selected = unique.slice(0, pickN)
      }
    } catch {
      selected = unique.slice(0, pickN)
    }
  } else {
    selected = unique.slice(0, pickN)
  }

  const reasonRows = await generateReasonsWithAudio(
    selected.map((track) => ({ name: track.name, artist: track.artist })),
    lens
  )

  const suggestions = selected.map((track, i) => {
    const row = reasonRows[i] ?? { reason: 'fits your territory' }
    const audioAttributes = reasonRowToAudioAttributes(row)
    const tone = assignTone(i, lens)
    const mapZoneId = assignMapZoneId(lens, audioAttributes, tone, i)
    return {
      track,
      reason: row.reason,
      tone,
      zoneId: mapZoneId,
      ...(audioAttributes ? { audioAttributes } : {}),
    }
  })

  return { suggestions, personaLens: lens }
}
