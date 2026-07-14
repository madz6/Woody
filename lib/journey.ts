import { randomUUID } from 'node:crypto'
import type {
  JourneyAnchor,
  JourneyAttribution,
  JourneyPlanV1,
  JourneySessionMode,
  JourneyTagCategory,
  Track,
} from './types'

const TAG_CATEGORIES: JourneyTagCategory[] = [
  'function',
  'movement',
  'rhythm',
  'texture',
  'impact',
  'relationship',
]

export interface JourneyPlanInput {
  mode: JourneySessionMode
  intent: string
  durationMinutes: number
  anchors: Array<{ track: Track; role: 'opener' | 'reference'; note: string }>
}

function text(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null
}

export function parseTrack(value: unknown): Track | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  const id = text(item.id, 128)
  const name = text(item.name, 500)
  const artist = text(item.artist, 500)
  if (!id || !name || !artist) return null
  const durationMs = typeof item.durationMs === 'number' && Number.isFinite(item.durationMs)
    ? Math.max(0, Math.round(item.durationMs))
    : 0
  return {
    id,
    name,
    artist,
    album: typeof item.album === 'string' ? item.album.slice(0, 500) : '',
    durationMs,
    ...(typeof item.albumArt === 'string' ? { albumArt: item.albumArt } : {}),
    ...(typeof item.spotifyUri === 'string' ? { spotifyUri: item.spotifyUri } : {}),
    ...(typeof item.previewUrl === 'string' ? { previewUrl: item.previewUrl } : {}),
  }
}

export function parseJourneyPlanInput(value: unknown): JourneyPlanInput | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  const intent = text(item.intent, 1000)
  const durationMinutes = typeof item.durationMinutes === 'number'
    ? Math.round(item.durationMinutes)
    : NaN
  const mode = item.mode === 'control_observation' ? item.mode : item.mode === 'adaptive' ? item.mode : null
  if (!intent || intent.length < 3 || !mode || durationMinutes < 10 || durationMinutes > 240) return null
  if (!Array.isArray(item.anchors) || item.anchors.length < 1 || item.anchors.length > 3) return null

  const anchors = item.anchors.map((candidate) => {
    if (!candidate || typeof candidate !== 'object') return null
    const anchor = candidate as Record<string, unknown>
    const track = parseTrack(anchor.track)
    const role = anchor.role === 'opener' || anchor.role === 'reference' ? anchor.role : null
    if (!track || !role) return null
    return { track, role, note: typeof anchor.note === 'string' ? anchor.note.slice(0, 1000).trim() : '' }
  })
  if (anchors.some((anchor) => anchor === null)) return null
  if (anchors.filter((anchor) => anchor?.role === 'opener').length !== 1) return null
  if (new Set(anchors.map((anchor) => anchor?.track.id)).size !== anchors.length) return null
  return { mode, intent, durationMinutes, anchors: anchors as JourneyPlanInput['anchors'] }
}

function fallbackTags(note: string): Partial<Record<JourneyTagCategory, string[]>> {
  const noteTerms = note.toLowerCase().match(/[a-z0-9][a-z0-9'-]{2,}/g)?.slice(0, 3) ?? []
  return {
    function: ['support the journey'],
    movement: ['forward motion'],
    rhythm: ['steady pulse'],
    texture: noteTerms.length > 0 ? noteTerms : ['anchor character'],
    impact: ['clear arrival'],
    relationship: ['reference point'],
  }
}

function attribution(field: string, value: string, source: JourneyAttribution['source']): JourneyAttribution {
  return { field, value, source, recordedAt: new Date().toISOString() }
}

type AiSuggestions = {
  phaseDescriptions: Partial<Record<'settle' | 'build' | 'sustain' | 'release', string>>
  anchorTags: Array<{ trackId: string; tags: Partial<Record<JourneyTagCategory, string[]>> }>
}

function parseAiSuggestions(raw: string, trackIds: Set<string>): AiSuggestions | null {
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    const value = JSON.parse(cleaned) as Record<string, unknown>
    const phaseDescriptions: AiSuggestions['phaseDescriptions'] = {}
    if (value.phaseDescriptions && typeof value.phaseDescriptions === 'object') {
      for (const phase of ['settle', 'build', 'sustain', 'release'] as const) {
        const description = text((value.phaseDescriptions as Record<string, unknown>)[phase], 240)
        if (description) phaseDescriptions[phase] = description
      }
    }
    const anchorTags: AiSuggestions['anchorTags'] = []
    if (Array.isArray(value.anchorTags)) {
      for (const candidate of value.anchorTags) {
        if (!candidate || typeof candidate !== 'object') continue
        const item = candidate as Record<string, unknown>
        const trackId = text(item.trackId, 128)
        if (!trackId || !trackIds.has(trackId) || !item.tags || typeof item.tags !== 'object') continue
        const tags: Partial<Record<JourneyTagCategory, string[]>> = {}
        for (const category of TAG_CATEGORIES) {
          const values = (item.tags as Record<string, unknown>)[category]
          if (!Array.isArray(values)) continue
          tags[category] = values
            .filter((tag): tag is string => typeof tag === 'string')
            .map((tag) => tag.trim().slice(0, 60))
            .filter(Boolean)
            .slice(0, 5)
        }
        anchorTags.push({ trackId, tags })
      }
    }
    return { phaseDescriptions, anchorTags }
  } catch {
    return null
  }
}

async function generateAiSuggestions(input: JourneyPlanInput): Promise<AiSuggestions | null> {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) return null
  const prompt = `Interpret a running journey. Suggest words only; never invent BPM, tempo numbers, energy scores, key, or measured acoustic facts.
Intent: ${input.intent}
Duration: ${input.durationMinutes} minutes
Anchors: ${input.anchors.map((anchor) => `${anchor.track.id}: ${anchor.track.name} by ${anchor.track.artist}; user note: ${anchor.note || '(none)'}`).join('\n')}
Return JSON only: {"phaseDescriptions":{"settle":"...","build":"...","sustain":"...","release":"..."},"anchorTags":[{"trackId":"...","tags":{"function":[],"movement":[],"rhythm":[],"texture":[],"impact":[],"relationship":[]}}]}`
  try {
    const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-lite'
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.25, maxOutputTokens: 1000, responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(12_000),
    })
    if (!response.ok) return null
    const result = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text
    return raw ? parseAiSuggestions(raw, new Set(input.anchors.map((anchor) => anchor.track.id))) : null
  } catch {
    return null
  }
}

export async function createJourneyPlan(input: JourneyPlanInput): Promise<JourneyPlanV1> {
  const now = new Date().toISOString()
  const sessionId = randomUUID()
  const ai = await generateAiSuggestions(input)
  const boundaries = [0, 0.1, 0.25, 0.85, 1]
  const phaseTypes = ['settle', 'build', 'sustain', 'release'] as const
  const defaults = {
    settle: 'Find an easy rhythm without forcing the start.',
    build: 'Increase commitment while keeping transitions coherent.',
    sustain: 'Support steady effort with room for salient moments.',
    release: 'Ease the journey down without dropping its character.',
  }
  const phases = phaseTypes.map((type, index) => ({
    id: `${sessionId}-${type}`,
    type,
    label: type[0].toUpperCase() + type.slice(1),
    description: ai?.phaseDescriptions[type] ?? defaults[type],
    startMinute: Math.round(input.durationMinutes * boundaries[index]),
    endMinute: Math.round(input.durationMinutes * boundaries[index + 1]),
    accepted: true,
  }))
  const anchors: JourneyAnchor[] = input.anchors.map((anchor) => {
    const suggestedTags = ai?.anchorTags.find((item) => item.trackId === anchor.track.id)?.tags
      ?? fallbackTags(anchor.note || input.intent)
    return {
      ...anchor,
      suggestedTags,
      confirmedTags: {},
      attribution: [
        ...(anchor.note ? [attribution('anchor.note', anchor.note, 'user_text')] : []),
        ...Object.entries(suggestedTags).flatMap(([category, values]) =>
          (values ?? []).map((value) => attribution(`anchor.tags.${category}`, value, ai ? 'model_suggested' : 'system_inferred')),
        ),
      ],
    }
  })
  const impactCount = input.durationMinutes < 30 ? 1 : 2
  const impactMinutes = impactCount === 1
    ? [Math.round(input.durationMinutes * 0.62)]
    : [Math.round(input.durationMinutes * 0.45), Math.round(input.durationMinutes * 0.72)]
  return {
    version: 1,
    sessionId,
    mode: input.mode,
    activity: 'running',
    intent: input.intent,
    durationMinutes: input.durationMinutes,
    phases,
    familiarityTarget: 0.65,
    impactWindows: impactMinutes.map((minute, index) => ({
      id: `${sessionId}-impact-${index + 1}`,
      minute,
      enabled: true,
      description: 'A proposed impact or salience moment.',
    })),
    anchors,
    attribution: [
      attribution('intent', input.intent, 'user_text'),
      attribution('durationMinutes', String(input.durationMinutes), 'user_text'),
      attribution('familiarityTarget', '0.65', 'system_inferred'),
    ],
    createdAt: now,
  }
}
