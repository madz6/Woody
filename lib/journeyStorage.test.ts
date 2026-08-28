import { describe, expect, it } from 'vitest'
import { nextPairedRunSlot, parseStoredJourneys } from './journeyStorage'

describe('journey storage migration boundary', () => {
  it('returns an empty v2 store for corrupt or unknown data', () => {
    expect(parseStoredJourneys('{broken')).toEqual({ version: 2, sessions: [] })
    expect(parseStoredJourneys(JSON.stringify({ version: 99, sessions: [{}] }))).toEqual({ version: 2, sessions: [] })
  })

  it('retains legacy sessions and structurally valid v2 sessions', () => {
    const legacy = { version: 1, plan: { sessionId: 'one' }, events: [] }
    const current = { version: 2, plan: { version: 2, sessionId: 'two', startTrack: {} }, events: [] }
    const parsed = parseStoredJourneys(JSON.stringify({ version: 2, sessions: [legacy, current, { version: 2 }] }))
    expect(parsed.sessions).toHaveLength(2)
    expect(parsed.sessions[0]).toHaveProperty('steers')
    expect(parsed.sessions[1]).toHaveProperty('aspectCaptures')
  })
})

describe('paired run progression', () => {
  it('starts with the first adaptive leg', () => {
    expect(nextPairedRunSlot([])).toEqual({ pairNumber: 1, pairLeg: 1, mode: 'adaptive', complete: false })
  })

  it('advances only after a completed research review', () => {
    const reviewed = { version: 2, status: 'completed', plan: { sessionId: 'one' }, events: [], researchReview: { pairNumber: 1, pairLeg: 1 } }
    expect(nextPairedRunSlot([reviewed] as never)).toMatchObject({ pairNumber: 1, pairLeg: 2, mode: 'control_observation' })
  })
})
