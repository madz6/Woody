import type { MapNodeData } from '@/components/map/useMapNodes'
import type { MapZoneId, PersonaLens, TrackSuggestion } from '@/lib/types'

const STORAGE_KEY = 'woody_session_queue_v1'

function isMapZoneId(x: unknown): x is MapZoneId {
  return x === 'dm' || x === 'sp' || x === 'oc' || x === 'df'
}

export type PersistedSessionPlaybackV1 = {
  v: 1
  queue: MapNodeData[]
  queueIndex: number
  suggestions: TrackSuggestion[]
  lastIntent: string
  lastLens: PersonaLens | null
  intentMode: 'layer' | 'redirect' | null
  currentSessionId: string | null
}

function isTone(x: unknown): x is TrackSuggestion['tone'] {
  return x === 'violet' || x === 'amber' || x === 'moss' || x === 'rose'
}

function parseMapNodeData(x: unknown): MapNodeData | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  if (typeof o.trackId !== 'string' || typeof o.spotifyUri !== 'string') return null
  if (typeof o.lat !== 'number' || typeof o.lng !== 'number') return null
  if (typeof o.label !== 'string' || typeof o.reason !== 'string') return null
  if (typeof o.id !== 'string') return null
  if (!isTone(o.tone)) return null
  if (typeof o.isKnown !== 'boolean' || typeof o.isPlaying !== 'boolean') return null
  const n: MapNodeData = {
    id: o.id,
    trackId: o.trackId,
    lat: o.lat,
    lng: o.lng,
    tone: o.tone,
    label: o.label,
    spotifyUri: o.spotifyUri,
    reason: o.reason,
    isKnown: o.isKnown,
    isPlaying: o.isPlaying,
    kind:
      o.kind === 'suggestion' || o.kind === 'memory' || o.kind === 'save_point'
        ? o.kind
        : 'suggestion',
  }
  if (typeof o.energyHint === 'number') n.energyHint = o.energyHint
  if (typeof o.bpmHint === 'number') n.bpmHint = o.bpmHint
  if (typeof o.birthTime === 'number') n.birthTime = o.birthTime
  if (o.track && typeof o.track === 'object') {
    const t = o.track as Record<string, unknown>
    if (
      typeof t.id === 'string' &&
      typeof t.name === 'string' &&
      typeof t.artist === 'string' &&
      typeof t.album === 'string' &&
      typeof t.durationMs === 'number'
    ) {
      const src = t.sources && typeof t.sources === 'object' ? (t.sources as Record<string, unknown>) : null
      const sources =
        src && typeof src.spotify === 'string' ? { spotify: src.spotify } : undefined
      n.track = {
        id: t.id,
        ...(typeof t.woodyId === 'string' ? { woodyId: t.woodyId } : {}),
        ...(sources ? { sources } : {}),
        name: t.name,
        artist: t.artist,
        album: t.album,
        durationMs: t.durationMs,
        ...(typeof t.albumArt === 'string' ? { albumArt: t.albumArt } : {}),
        ...(typeof t.spotifyUri === 'string' ? { spotifyUri: t.spotifyUri } : {}),
        ...(typeof t.youtubeId === 'string' ? { youtubeId: t.youtubeId } : {}),
        ...(typeof t.previewUrl === 'string' ? { previewUrl: t.previewUrl } : {}),
      }
    }
  }
  return n
}

function parseTrackSuggestion(x: unknown): TrackSuggestion | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  const track = o.track
  if (!track || typeof track !== 'object') return null
  const t = track as Record<string, unknown>
  if (
    typeof t.id !== 'string' ||
    typeof t.name !== 'string' ||
    typeof t.artist !== 'string' ||
    typeof t.album !== 'string' ||
    typeof t.durationMs !== 'number'
  ) {
    return null
  }
  const reason = o.reason
  const tone = o.tone
  if (typeof reason !== 'string' || !isTone(tone)) return null
  const src = t.sources && typeof t.sources === 'object' ? (t.sources as Record<string, unknown>) : null
  const sources = src && typeof src.spotify === 'string' ? { spotify: src.spotify } : undefined
  const tr = {
    id: t.id,
    ...(typeof t.woodyId === 'string' ? { woodyId: t.woodyId } : {}),
    ...(sources ? { sources } : {}),
    name: t.name,
    artist: t.artist,
    album: t.album,
    durationMs: t.durationMs,
    ...(typeof t.albumArt === 'string' ? { albumArt: t.albumArt } : {}),
    ...(typeof t.spotifyUri === 'string' ? { spotifyUri: t.spotifyUri } : {}),
    ...(typeof t.youtubeId === 'string' ? { youtubeId: t.youtubeId } : {}),
    ...(typeof t.previewUrl === 'string' ? { previewUrl: t.previewUrl } : {}),
  }
  const audio = o.audioAttributes
  let audioAttributes: TrackSuggestion['audioAttributes'] | undefined
  if (audio && typeof audio === 'object') {
    const a = audio as Record<string, unknown>
    const textureTags = Array.isArray(a.textureTags)
      ? a.textureTags.filter((x): x is string => typeof x === 'string').slice(0, 8)
      : undefined
    audioAttributes = {
      ...(typeof a.bpm === 'number' ? { bpm: a.bpm } : {}),
      ...(typeof a.energy === 'number' ? { energy: a.energy } : {}),
      ...(typeof a.valence === 'number' ? { valence: a.valence } : {}),
      ...(typeof a.key === 'string' ? { key: a.key } : {}),
      ...(textureTags?.length ? { textureTags } : {}),
    }
  }
  const zoneId = isMapZoneId(o.zoneId) ? o.zoneId : undefined
  return {
    track: tr,
    reason,
    tone,
    ...(zoneId ? { zoneId } : {}),
    ...(audioAttributes ? { audioAttributes } : {}),
  }
}

function parsePersonaLens(x: unknown): PersonaLens | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  const energy = o.energy
  const tempo = o.tempo
  if (energy !== 'low' && energy !== 'medium' && energy !== 'high') return null
  if (tempo !== 'slow' && tempo !== 'medium' && tempo !== 'fast') return null
  const mood = Array.isArray(o.mood) ? o.mood.filter((m): m is string => typeof m === 'string') : []
  const exclusions = Array.isArray(o.exclusions)
    ? o.exclusions.filter((m): m is string => typeof m === 'string')
    : []
  const texture = Array.isArray(o.texture)
    ? o.texture.filter((m): m is string => typeof m === 'string')
    : []
  const rawIntent = typeof o.rawIntent === 'string' ? o.rawIntent : ''
  const era = typeof o.era === 'string' ? o.era : undefined
  return { energy, mood, exclusions, tempo, texture, rawIntent, ...(era ? { era } : {}) }
}

export function loadPersistedSessionPlayback(): PersistedSessionPlaybackV1 | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const p = parsed as Record<string, unknown>
    if (p.v !== 1) return null
    const suggestionsIn = p.suggestions
    const suggestions = Array.isArray(suggestionsIn)
      ? (suggestionsIn.map(parseTrackSuggestion).filter(Boolean) as TrackSuggestion[])
      : []
    const queueIn = p.queue
    const queue = Array.isArray(queueIn)
      ? (queueIn.map(parseMapNodeData).filter(Boolean) as MapNodeData[])
      : []
    const qi = typeof p.queueIndex === 'number' && Number.isFinite(p.queueIndex) ? p.queueIndex : -1
    const lastIntent = typeof p.lastIntent === 'string' ? p.lastIntent : ''
    const lastLens = parsePersonaLens(p.lastLens)
    let intentMode: 'layer' | 'redirect' | null = null
    if (p.intentMode === 'layer' || p.intentMode === 'redirect') intentMode = p.intentMode
    const currentSessionId = typeof p.currentSessionId === 'string' ? p.currentSessionId : null

    if (suggestions.length === 0 && queue.length === 0) return null

    const maxQi = queue.length > 0 ? queue.length - 1 : -1
    const queueIndex = maxQi >= 0 ? Math.min(Math.max(-1, qi), maxQi) : -1

    return {
      v: 1,
      queue,
      queueIndex,
      suggestions,
      lastIntent,
      lastLens,
      intentMode,
      currentSessionId,
    }
  } catch {
    return null
  }
}

export function savePersistedSessionPlayback(data: Omit<PersistedSessionPlaybackV1, 'v'>): void {
  if (typeof window === 'undefined') return
  try {
    const payload: PersistedSessionPlaybackV1 = { v: 1, ...data }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // quota or private mode
  }
}

export function clearPersistedSessionPlayback(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
