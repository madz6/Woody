import type { JourneySessionMode, JourneySessionV1 } from './types'

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

interface StoredJourneysV1 {
  version: 1
  sessions: JourneySessionV1[]
}

export function parseStoredJourneys(raw: string | null): StoredJourneysV1 {
  if (!raw) return { version: 1, sessions: [] }
  try {
    const value = JSON.parse(raw) as Record<string, unknown>
    if (value.version !== 1 || !Array.isArray(value.sessions)) return { version: 1, sessions: [] }
    return {
      version: 1,
      sessions: value.sessions.filter((session): session is JourneySessionV1 => {
        if (!session || typeof session !== 'object') return false
        const item = session as Record<string, unknown>
        return item.version === 1 && typeof item.plan === 'object' && Array.isArray(item.events)
      }).slice(0, MAX_SESSIONS),
    }
  } catch {
    return { version: 1, sessions: [] }
  }
}

export function loadJourneySessions(): JourneySessionV1[] {
  if (typeof window === 'undefined') return []
  return parseStoredJourneys(window.localStorage.getItem(STORAGE_KEY)).sessions
}

export function nextPairedRunSlot(sessions: JourneySessionV1[]): PairedRunSlot {
  const completedSlots = new Set(
    sessions
      .filter((session) => session.status === 'completed' && session.review)
      .map((session) => `${session.review!.pairNumber}:${session.review!.pairLeg}`),
  )

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

export function saveJourneySession(session: JourneySessionV1): void {
  if (typeof window === 'undefined') return
  const current = loadJourneySessions().filter(
    (item) => item.plan.sessionId !== session.plan.sessionId,
  )
  const payload: StoredJourneysV1 = {
    version: 1,
    sessions: [session, ...current].slice(0, MAX_SESSIONS),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function exportJourneySessions(): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), sessions: loadJourneySessions() }, null, 2)
}
