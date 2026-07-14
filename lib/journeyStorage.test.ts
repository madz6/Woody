import { describe, expect, it } from 'vitest'
import { parseStoredJourneys } from './journeyStorage'

describe('journey storage migration boundary', () => {
  it('returns an empty v1 store for corrupt or unknown data', () => {
    expect(parseStoredJourneys('{broken')).toEqual({ version: 1, sessions: [] })
    expect(parseStoredJourneys(JSON.stringify({ version: 99, sessions: [{}] }))).toEqual({ version: 1, sessions: [] })
  })

  it('retains only structurally valid v1 sessions', () => {
    const valid = { version: 1, plan: { sessionId: 'one' }, events: [] }
    const parsed = parseStoredJourneys(JSON.stringify({ version: 1, sessions: [valid, { version: 1 }] }))
    expect(parsed.sessions).toHaveLength(1)
  })
})
