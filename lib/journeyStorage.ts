import type { JourneySessionMode, JourneySessionV1, JourneySessionV2, StoredJourneySession } from './types'

const STORAGE_KEY = 'woody.journey.sessions'
const MAX_SESSIONS = 50
const PAIR_ORDER: JourneySessionMode[][] = [
  ['adaptive', 'control_observation'],
  ['control_observation', 'adaptive'],
  ['adaptive', 'control_observation'],
  ['control_observation', 'adaptive'],
]

export interface PairedRunSlot {
  pairNumber: 1 | 2 | 3 | 4
  pairLeg: 1 | 2
  mode: JourneySessionMode
  complete: boolean
}

export interface StoredJourneysV2 {
  version: 2
  sessions: StoredJourneySession[]
}

function validV1(session: unknown): session is JourneySessionV1 {
  if (!session || typeof session !== 'object') return false
  const item = session as Record<string, unknown>
  return item.version === 1 && typeof item.plan === 'object' && Array.isArray(item.events)
}

function validV2(session: unknown): session is JourneySessionV2 {
  if (!session || typeof session !== 'object') return false
  const item = session as Record<string, unknown>
  if (item.version !== 2 || !item.plan || typeof item.plan !== 'object' || !Array.isArray(item.events)) return false
  const plan = item.plan as Record<string, unknown>
  return plan.version === 2 && typeof plan.sessionId === 'string' && typeof plan.startTrack === 'object'
}

export function parseStoredJourneys(raw: string | null): StoredJourneysV2 {
  if (!raw) return { version: 2, sessions: [] }
  try {
    const value = JSON.parse(raw) as Record<string, unknown>
    if (!Array.isArray(value.sessions) || (value.version !== 1 && value.version !== 2)) return { version: 2, sessions: [] }
    const sessions = value.sessions.filter((session): session is StoredJourneySession => validV1(session) || validV2(session))
      .map((session) => session.version === 2
        ? { ...session, aspectCaptures: Array.isArray(session.aspectCaptures) ? session.aspectCaptures : [] }
        : { ...session, steers: Array.isArray(session.steers) ? session.steers : [] })
      .slice(0, MAX_SESSIONS)
    return { version: 2, sessions }
  } catch {
    return { version: 2, sessions: [] }
  }
}

export function loadJourneySessions(): StoredJourneySession[] {
  if (typeof window === 'undefined') return []
  return parseStoredJourneys(window.localStorage.getItem(STORAGE_KEY)).sessions
}

export function nextPairedRunSlot(sessions: StoredJourneySession[]): PairedRunSlot {
  const completedSlots = new Set(sessions.flatMap((session) => {
    if (session.status !== 'completed') return []
    const review = session.version === 2 ? session.researchReview : session.review
    return review ? [`${review.pairNumber}:${review.pairLeg}`] : []
  }))
  for (let pairIndex = 0; pairIndex < PAIR_ORDER.length; pairIndex += 1) {
    for (let legIndex = 0; legIndex < PAIR_ORDER[pairIndex].length; legIndex += 1) {
      if (completedSlots.has(`${pairIndex + 1}:${legIndex + 1}`)) continue
      return {
        pairNumber: (pairIndex + 1) as PairedRunSlot['pairNumber'],
        pairLeg: (legIndex + 1) as PairedRunSlot['pairLeg'],
        mode: PAIR_ORDER[pairIndex][legIndex],
        complete: false,
      }
    }
  }
  return { pairNumber: 4, pairLeg: 2, mode: PAIR_ORDER[3][1], complete: true }
}

export function saveJourneySession(session: StoredJourneySession): boolean {
  if (typeof window === 'undefined') return false
  try {
    const current = loadJourneySessions().filter((item) => item.plan.sessionId !== session.plan.sessionId)
    const payload: StoredJourneysV2 = { version: 2, sessions: [session, ...current].slice(0, MAX_SESSIONS) }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

export function clearJourneySessions(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY)
}

export function exportJourneySessions(): string {
  return JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), sessions: loadJourneySessions() }, null, 2)
}
