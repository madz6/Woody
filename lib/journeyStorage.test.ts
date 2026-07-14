import { describe, expect, it } from 'vitest'
import { nextPairedRunSlot, parseStoredJourneys } from './journeyStorage'

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

describe('paired run progression', () => {
  it('starts with the first adaptive leg', () => {
    expect(nextPairedRunSlot([])).toEqual({ pairNumber: 1, pairLeg: 1, mode: 'adaptive', complete: false })
  })

  it('advances only after a completed reviewed session', () => {
    const reviewed = {
      version: 1,
      status: 'completed',
      plan: { sessionId: 'one' },
      events: [],
      review: { pairNumber: 1, pairLeg: 1 },
    }
    const unfinished = {
      version: 1,
      status: 'active',
      plan: { sessionId: 'two' },
      events: [],
      review: { pairNumber: 1, pairLeg: 2 },
    }
    expect(nextPairedRunSlot([reviewed, unfinished] as never)).toMatchObject({ pairNumber: 1, pairLeg: 2, mode: 'control_observation' })
  })

  it('reports completion after all eight reviewed legs', () => {
    const sessions = Array.from({ length: 8 }, (_, index) => ({
      version: 1,
      status: 'completed',
      plan: { sessionId: `${index}` },
      events: [],
      review: { pairNumber: Math.floor(index / 2) + 1, pairLeg: index % 2 + 1 },
    }))
    expect(nextPairedRunSlot(sessions as never).complete).toBe(true)
  })
})
