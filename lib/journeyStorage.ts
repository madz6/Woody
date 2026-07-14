import type { JourneySessionV1 } from './types'

const STORAGE_KEY = 'woody.journey.sessions'
const MAX_SESSIONS = 50

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
