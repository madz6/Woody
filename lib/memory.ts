import type {
  IntentMemory,
  IntentMemoryEntry,
  LearnedIntentBias,
  MapNode,
  PersonaLens,
  RejectedTrack,
  SavePoint,
  Session,
  SessionTrack,
  TasteCentroid,
  TasteProfile,
  Track,
  TrackAudioAttributes,
  TrackSuggestion,
} from './types'

function nodeHash01(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return (Math.abs(h) % 10000) / 10000
}

const STORAGE_SESSIONS = 'woody_sessions_v1'
const STORAGE_SAVE_POINTS = 'woody_save_points_v1'
const STORAGE_RECENT_INTENT = 'woody_recent_intent_v1'
const STORAGE_INTENT_MEMORY = 'woody_intent_memory_v1'
const STORAGE_TASTE_CENTROID = 'woody_taste_centroid_v1'

type SerializedSessionTrack = Omit<SessionTrack, 'playedAt'> & { playedAt?: string }
type SerializedRejectedTrack = Omit<RejectedTrack, 'rejectedAt'> & { rejectedAt: string }
type SerializedSession = Omit<Session, 'createdAt' | 'tracks' | 'rejectedTracks'> & {
  createdAt: string
  tracks: SerializedSessionTrack[]
  rejectedTracks?: SerializedRejectedTrack[]
}

function serializeSession(s: Session): SerializedSession {
  return {
    ...s,
    createdAt: s.createdAt.toISOString(),
    tracks: s.tracks.map((t) => ({
      ...t,
      playedAt: t.playedAt?.toISOString(),
    })),
    rejectedTracks: s.rejectedTracks?.map((r) => ({
      ...r,
      rejectedAt: r.rejectedAt.toISOString(),
    })),
  }
}

function deserializeSession(raw: SerializedSession): Session {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    tracks: raw.tracks.map((t) => ({
      ...t,
      playedAt: t.playedAt ? new Date(t.playedAt) : undefined,
    })),
    rejectedTracks: raw.rejectedTracks?.map((r) => ({
      ...r,
      rejectedAt: new Date(r.rejectedAt),
    })),
  }
}

type SerializedSavePoint = Omit<SavePoint, 'createdAt'> & { createdAt: string }

function serializeSavePoint(sp: SavePoint): SerializedSavePoint {
  return { ...sp, createdAt: sp.createdAt.toISOString() }
}

function deserializeSavePoint(raw: SerializedSavePoint): SavePoint {
  return { ...raw, createdAt: new Date(raw.createdAt) }
}

function isTone(value: unknown): value is TrackSuggestion['tone'] {
  return value === 'violet' || value === 'amber' || value === 'moss' || value === 'rose'
}

function capList<T>(list: T[], max: number): T[] {
  return list.length <= max ? list : list.slice(list.length - max)
}

export function saveSession(session: Session): void {
  if (typeof window === 'undefined') return
  const existing = getSessionsRaw()
  existing.push(serializeSession(session))
  localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(existing))
}

/**
 * Create a lightweight session shell (no tracks yet) from intent submission.
 * Saved immediately so the session exists before any playback occurs.
 */
export function createSessionShell(params: {
  id: string
  intentText: string
  personaLens: PersonaLens
  suggestions: TrackSuggestion[]
}): Session {
  const toneByTrackId: Record<string, TrackSuggestion['tone']> = {}
  for (const suggestion of params.suggestions) {
    toneByTrackId[suggestion.track.id] = suggestion.tone
  }
  return {
    id: params.id,
    intentText: params.intentText,
    personaLens: params.personaLens,
    seedTrack: undefined,
    tracks: [],
    mode: 'active',
    createdAt: new Date(),
    toneByTrackId,
    rejectedTrackIds: [],
    rejectedTracks: [],
  } as unknown as Session
}

/**
 * Update a session by ID with a partial patch.
 * No-op if session not found in storage.
 */
export function updateSession(sessionId: string, patch: Partial<Session>): void {
  if (typeof window === 'undefined') return
  const raw = getSessionsRaw()
  const idx = raw.findIndex((s) => s.id === sessionId)
  if (idx < 0) return
  const session = deserializeSession(raw[idx])
  const updated = { ...session, ...patch }
  raw[idx] = serializeSession(updated)
  localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(raw))
}

/**
 * Append a played track to a session's track list.
 * Called after successful playback of a track node.
 */
export function appendPlayedTrack(
  sessionId: string,
  track: Track,
  type: SessionTrack['type'] = 'anchor',
  audioAttributes?: SessionTrack['audioAttributes']
): void {
  if (typeof window === 'undefined') return
  const raw = getSessionsRaw()
  const idx = raw.findIndex((s) => s.id === sessionId)
  if (idx < 0) return
  const session = deserializeSession(raw[idx])
  const position = session.tracks.length
  const sessionTrack: SessionTrack = {
    track,
    position,
    type,
    playedAt: new Date(),
    signal: 'kept',
    ...(audioAttributes ? { audioAttributes } : {}),
  }
  session.tracks = capList([...session.tracks, sessionTrack], 200)
  raw[idx] = serializeSession(session)
  localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(raw))
}

/**
 * Return the set of all track IDs the user has heard across all sessions.
 * Used to style "known" vs "new" nodes on the map.
 */
export function getKnownTrackIds(): Set<string> {
  const sessions = getSessions()
  const ids = new Set<string>()
  for (const session of sessions) {
    for (const st of session.tracks) {
      ids.add(st.track.id)
    }
  }
  return ids
}

/** Keep the 50 most recent sessions; drop older ones to bound localStorage growth. */
export function pruneSessions(): void {
  if (typeof window === 'undefined') return
  const raw = getSessionsRaw()
  if (raw.length <= 50) return
  localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(raw.slice(-50)))
}

export function getSessions(): Session[] {
  return getSessionsRaw().map(deserializeSession)
}

export function getSessionById(id: string): Session | null {
  return getSessions().find((s) => s.id === id) ?? null
}

function getSessionsRaw(): SerializedSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_SESSIONS)
    if (!raw) return []
    return JSON.parse(raw) as SerializedSession[]
  } catch {
    return []
  }
}

export function saveSavePoint(savePoint: SavePoint): void {
  if (typeof window === 'undefined') return
  const list = getSavePointsRaw()
  list.push(serializeSavePoint(savePoint))
  localStorage.setItem(STORAGE_SAVE_POINTS, JSON.stringify(list))
}

export function getSavePoints(): SavePoint[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_SAVE_POINTS)
    if (!raw) return []
    return (JSON.parse(raw) as SerializedSavePoint[]).map(deserializeSavePoint)
  } catch {
    return []
  }
}

function getSavePointsRaw(): SerializedSavePoint[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_SAVE_POINTS)
    if (!raw) return []
    return JSON.parse(raw) as SerializedSavePoint[]
  } catch {
    return []
  }
}

export function setRecentIntent(text: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_RECENT_INTENT, text)
}

export function getRecentIntent(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_RECENT_INTENT)
}

export function buildIntentKey(lens: PersonaLens): string {
  const moods = [...lens.mood]
    .map((m) => m.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .slice(0, 3)
  return `${lens.energy}|${lens.tempo}|${moods.join(',') || 'none'}`
}

function normalizeIntentMemory(raw: unknown): IntentMemory {
  if (!raw || typeof raw !== 'object') return { v: 1, entries: [] }
  const obj = raw as Record<string, unknown>

  const rawEntries = obj.entries
  if (Array.isArray(rawEntries)) {
    const entries = rawEntries
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null
        const e = entry as Record<string, unknown>
        const intentKey =
          typeof e.intentKey === 'string'
            ? e.intentKey
            : typeof e.key === 'string'
              ? e.key
              : null
        if (!intentKey) return null
        const playedTones = Array.isArray(e.playedTones)
          ? e.playedTones.filter(isTone)
          : []
        const playedEnergies = Array.isArray(e.playedEnergies)
          ? e.playedEnergies.filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
          : []
        const playedBpms = Array.isArray(e.playedBpms)
          ? e.playedBpms.filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
          : []
        const rejectedIdsSource = Array.isArray(e.rejectedIds)
          ? e.rejectedIds
          : Array.isArray(e.rejectedTrackIds)
            ? e.rejectedTrackIds
            : []
        const rejectedIds = rejectedIdsSource.filter((x): x is string => typeof x === 'string')
        const sessionIds = Array.isArray(e.sessionIds)
          ? e.sessionIds.filter((x): x is string => typeof x === 'string')
          : []
        const updatedAtRaw =
          typeof e.updatedAt === 'string'
            ? e.updatedAt
            : e.lastUpdated instanceof Date
              ? e.lastUpdated.toISOString()
              : typeof e.lastUpdated === 'string'
                ? e.lastUpdated
                : new Date().toISOString()
        return {
          intentKey,
          playedTones,
          playedEnergies,
          ...(playedBpms.length > 0 ? { playedBpms } : {}),
          rejectedIds,
          sessionIds,
          updatedAt: new Date(updatedAtRaw).toISOString(),
        } satisfies IntentMemoryEntry
      })
      .filter((entry): entry is IntentMemoryEntry => entry != null)

    return { v: 1, entries }
  }

  if (rawEntries && typeof rawEntries === 'object') {
    const entries = Object.entries(rawEntries as Record<string, unknown>)
      .map(([fallbackKey, entry]) => {
        if (!entry || typeof entry !== 'object') return null
        const e = entry as Record<string, unknown>
        const playedTones = Array.isArray(e.playedTones)
          ? e.playedTones.filter(isTone)
          : []
        const playedEnergies = Array.isArray(e.playedEnergies)
          ? e.playedEnergies.filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
          : []
        const playedBpms = Array.isArray(e.playedBpms)
          ? e.playedBpms.filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
          : []
        const rejectedIds = Array.isArray(e.rejectedTrackIds)
          ? e.rejectedTrackIds.filter((x): x is string => typeof x === 'string')
          : []
        const updatedAtRaw =
          e.lastUpdated instanceof Date
            ? e.lastUpdated.toISOString()
            : typeof e.lastUpdated === 'string'
              ? e.lastUpdated
              : new Date().toISOString()
        return {
          intentKey: typeof e.key === 'string' ? e.key : fallbackKey,
          playedTones,
          playedEnergies,
          ...(playedBpms.length > 0 ? { playedBpms } : {}),
          rejectedIds,
          sessionIds: [] as string[],
          updatedAt: new Date(updatedAtRaw).toISOString(),
        } satisfies IntentMemoryEntry
      })
      .filter((entry): entry is IntentMemoryEntry => entry != null)
    return { v: 1, entries }
  }

  return { v: 1, entries: [] }
}

export function getIntentMemory(): IntentMemory {
  if (typeof window === 'undefined') return { v: 1, entries: [] }
  try {
    const raw = localStorage.getItem(STORAGE_INTENT_MEMORY)
    if (!raw) return { v: 1, entries: [] }
    return normalizeIntentMemory(JSON.parse(raw))
  } catch {
    return { v: 1, entries: [] }
  }
}

function saveIntentMemory(memory: IntentMemory): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_INTENT_MEMORY, JSON.stringify(memory))
}

export function getIntentMemoryEntry(intentKey: string): IntentMemoryEntry | null {
  return getIntentMemory().entries.find((entry) => entry.intentKey === intentKey) ?? null
}

export function buildLearnedBiasFromEntry(entry: IntentMemoryEntry | null): LearnedIntentBias {
  if (!entry) return { excludeTrackIds: [] }

  const avgEnergy =
    entry.playedEnergies.length > 0
      ? entry.playedEnergies.reduce((sum, value) => sum + value, 0) / entry.playedEnergies.length
      : undefined
  const avgBpm =
    entry.playedBpms && entry.playedBpms.length > 0
      ? entry.playedBpms.reduce((sum, value) => sum + value, 0) / entry.playedBpms.length
      : undefined

  const toneCounts = new Map<TrackSuggestion['tone'], number>()
  for (const tone of entry.playedTones) {
    toneCounts.set(tone, (toneCounts.get(tone) ?? 0) + 1)
  }

  const dominantTones =
    toneCounts.size > 0
      ? [...toneCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([tone]) => tone)
          .slice(0, 3)
      : undefined

  return {
    ...(avgEnergy !== undefined ? { avgEnergy } : {}),
    ...(avgBpm !== undefined ? { avgBpm } : {}),
    ...(dominantTones && dominantTones.length > 0 ? { dominantTones } : {}),
    excludeTrackIds: entry.rejectedIds,
  }
}

export function recordTrackRejection(sessionId: string, rejection: RejectedTrack): void {
  if (typeof window === 'undefined') return
  const raw = getSessionsRaw()
  const idx = raw.findIndex((s) => s.id === sessionId)
  if (idx < 0) return

  const session = deserializeSession(raw[idx])
  const trackId = rejection.track.id
  session.rejectedTrackIds = [...new Set([...(session.rejectedTrackIds ?? []), trackId])]

  const existingRejections = session.rejectedTracks ?? []
  if (!existingRejections.some((item) => item.track.id === trackId)) {
    existingRejections.push(rejection)
  }
  session.rejectedTracks = existingRejections

  let trackWasPlayed = false
  session.tracks = session.tracks.map((track) => {
    if (track.track.id !== trackId) return track
    trackWasPlayed = true
    return { ...track, signal: 'rejected' }
  })

  if (!trackWasPlayed) {
    // Session.rejectedTracks is the source of truth for not-played-yet rejections.
  }

  raw[idx] = serializeSession(session)
  localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(raw))
}

export function writeIntentMemoryFromSession(sessionId: string): void {
  if (typeof window === 'undefined') return
  const session = getSessionById(sessionId)
  if (!session) return

  const intentKey = buildIntentKey(session.personaLens)
  const memory = getIntentMemory()
  const existing = memory.entries.find((entry) => entry.intentKey === intentKey)
  if (existing?.sessionIds.includes(session.id)) return

  const keptTracks = session.tracks.filter((track) => track.signal !== 'rejected')

  const playedEnergies = keptTracks
    .map((track) => track.audioAttributes?.energy)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))

  const playedBpms = keptTracks
    .map((track) => track.audioAttributes?.bpm)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))

  const playedTones = keptTracks
    .map((track) => session.toneByTrackId?.[track.track.id])
    .filter((value): value is TrackSuggestion['tone'] => value != null)

  const rejectedIds = [
    ...(session.rejectedTracks?.map((item) => item.track.id) ?? []),
    ...(session.rejectedTrackIds ?? []),
  ]

  const nextEntry: IntentMemoryEntry = existing
    ? {
        intentKey,
        playedTones: capList([...existing.playedTones, ...playedTones], 50),
        playedEnergies: capList([...existing.playedEnergies, ...playedEnergies], 50),
        playedBpms: capList([...(existing.playedBpms ?? []), ...playedBpms], 50),
        rejectedIds: capList([...new Set([...existing.rejectedIds, ...rejectedIds])], 100),
        sessionIds: [...existing.sessionIds, session.id],
        updatedAt: new Date().toISOString(),
      }
    : {
        intentKey,
        playedTones: capList(playedTones, 50),
        playedEnergies: capList(playedEnergies, 50),
        playedBpms: capList(playedBpms, 50),
        rejectedIds: capList([...new Set(rejectedIds)], 100),
        sessionIds: [session.id],
        updatedAt: new Date().toISOString(),
      }

  const withoutExisting = memory.entries.filter((entry) => entry.intentKey !== intentKey)
  const entries = [...withoutExisting, nextEntry]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 30)

  saveIntentMemory({ v: 1, entries })
}

function inferTone(trackId: string, session: Session): TrackSuggestion['tone'] {
  const fromMap = session.toneByTrackId?.[trackId]
  if (fromMap) return fromMap
  const energy = session.personaLens.energy
  if (energy === 'high') return 'amber'
  if (energy === 'low') return 'violet'
  return 'moss'
}

export function getMapNodes(): MapNode[] {
  const sessions = getSessions()
  const byTrack = new Map<
    string,
    { track: Track; visits: number; last: Date; tone: TrackSuggestion['tone'] }
  >()

  for (const session of sessions) {
    for (const st of session.tracks) {
      if (!st.playedAt && st.signal !== 'kept') continue
      const id = st.track.id
      const prev = byTrack.get(id)
      const tone = inferTone(id, session)
      const played = st.playedAt ?? session.createdAt
      if (!prev) {
        byTrack.set(id, { track: st.track, visits: 1, last: played, tone })
      } else {
        byTrack.set(id, {
          track: st.track,
          visits: prev.visits + 1,
          last: played > prev.last ? played : prev.last,
          tone,
        })
      }
    }
  }

  const maxVisits = Math.max(1, ...[...byTrack.values()].map((value) => value.visits))

  const sessionNodes: MapNode[] = [...byTrack.entries()].map(([trackId, value], index) => {
    const lat = (nodeHash01(trackId + 'mem') - 0.5) * 1.2
    const lng = nodeHash01(trackId + 'lng') * Math.PI * 2
    return {
      id: `mem-${trackId}-${index}`,
      trackId,
      track: value.track,
      position: { x: lat, y: lng },
      familiarityScore: Math.min(1, value.visits / maxVisits),
      lastVisited: value.last,
      tone: value.tone,
    }
  })

  const fromSavePoints: MapNode[] = []
  for (const sp of getSavePoints()) {
    const trackId = sp.trackId
    const track = sp.track
    if (!trackId || !track?.id) continue

    const session = sessions.find((item) => item.id === sp.sessionId)
    const tone = session ? inferTone(trackId, session) : 'amber'
    const latBase = (nodeHash01(trackId + 'mem') - 0.5) * 1.2
    const lngBase = nodeHash01(trackId + 'lng') * Math.PI * 2
    const offLat = (nodeHash01(sp.id + ':saveLat') - 0.5) * 0.22
    const offLng = (nodeHash01(sp.id + ':saveLng') - 0.5) * 0.35
    const lat = Math.max(-0.85, Math.min(0.85, latBase + offLat))
    const lng = Math.max(-Math.PI * 0.95, Math.min(Math.PI * 0.95, lngBase + offLng))

    fromSavePoints.push({
      id: `save-${sp.id}`,
      trackId,
      track,
      position: { x: lat, y: lng },
      familiarityScore: 0.92,
      lastVisited: sp.createdAt,
      tone,
      savePointLabel: sp.name,
    })
  }

  return [...sessionNodes, ...fromSavePoints]
}

// ---------------------------------------------------------------------------
// Taste Centroid — acoustic preference model from behavioral signals
// ---------------------------------------------------------------------------

/** Read the current taste centroid from localStorage. Returns null if not yet seeded. */
export function getTasteCentroid(): TasteCentroid | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_TASTE_CENTROID)
    if (!raw) return null
    return JSON.parse(raw) as TasteCentroid
  } catch {
    return null
  }
}

/** Persist the taste centroid to localStorage. */
export function saveTasteCentroid(centroid: TasteCentroid): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_TASTE_CENTROID, JSON.stringify(centroid))
}

/**
 * Update the taste centroid with a new track's audio attributes.
 * Uses exponential moving average: new signal blends in at `alpha` weight.
 *
 * @param features - Audio attributes of the played track (from LLM estimates or acoustic service)
 * @param alpha - Blend weight for new signal (default 0.2). Pass lower value (0.1) for low-bandwidth
 *                contexts (running/working) where completion is not a strong preference signal.
 */
export function updateTasteCentroid(features: TrackAudioAttributes, alpha = 0.2): void {
  if (features.energy === undefined && features.bpm === undefined) return
  const stored = getTasteCentroid()
  const updated: TasteCentroid = stored && stored.sampleCount > 0
    ? {
        energy: features.energy !== undefined
          ? stored.energy * (1 - alpha) + features.energy * alpha
          : stored.energy,
        bpm: features.bpm !== undefined
          ? stored.bpm * (1 - alpha) + features.bpm * alpha
          : stored.bpm,
        spectralCentroid: stored.spectralCentroid, // LLM estimates lack spectral data; keep existing
        sampleCount: stored.sampleCount + 1,
        lastUpdated: Date.now(),
      }
    : {
        energy: features.energy ?? 0.5,
        bpm: features.bpm ?? 120,
        spectralCentroid: 0.5, // neutral default until real acoustic service data available
        sampleCount: 1,
        lastUpdated: Date.now(),
      }
  saveTasteCentroid(updated)
}

export function buildTasteProfile(): TasteProfile {
  const sessions = getSessions()
  if (sessions.length === 0) {
    return {
      dominantTones: [],
      commonMoods: [],
      avgEnergy: 'medium',
      topArtists: [],
      sessionCount: 0,
    }
  }

  const toneCount: Partial<Record<TrackSuggestion['tone'], number>> = {}
  const moodCount = new Map<string, number>()
  const energyCount = { low: 0, medium: 0, high: 0 }
  const artistCount = new Map<string, number>()

  for (const session of sessions) {
    energyCount[session.personaLens.energy]++
    for (const mood of session.personaLens.mood) {
      moodCount.set(mood, (moodCount.get(mood) ?? 0) + 1)
    }
    if (session.toneByTrackId) {
      for (const tone of Object.values(session.toneByTrackId)) {
        toneCount[tone] = (toneCount[tone] ?? 0) + 1
      }
    }
    for (const track of session.tracks) {
      artistCount.set(track.track.artist, (artistCount.get(track.track.artist) ?? 0) + 1)
    }
  }

  const dominantTones = (Object.entries(toneCount) as [TrackSuggestion['tone'], number][])
    .sort((a, b) => b[1] - a[1])
    .map(([tone]) => tone)
    .slice(0, 4)

  const commonMoods = [...moodCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([mood]) => mood)
    .slice(0, 12)

  const avgEnergy: 'low' | 'medium' | 'high' =
    energyCount.high >= energyCount.low && energyCount.high >= energyCount.medium
      ? 'high'
      : energyCount.low >= energyCount.medium
        ? 'low'
        : 'medium'

  const topArtists = [...artistCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([artist]) => artist)
    .slice(0, 10)

  return {
    dominantTones,
    commonMoods,
    avgEnergy,
    topArtists,
    sessionCount: sessions.length,
  }
}
