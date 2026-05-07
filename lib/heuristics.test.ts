import { describe, expect, it } from 'vitest'
import { camelotCodeToSpotifyKeyMode } from './camelot'
import { rankByTransition } from './heuristics'

describe('rankByTransition', () => {
  it('orders queue tail toward compatible keys and similar BPM', () => {
    const anchor = camelotCodeToSpotifyKeyMode('8B')!
    const from = {
      key: anchor.key,
      mode: anchor.mode,
      tempo: 120,
      energy: 0.5,
    }
    const adjacent = camelotCodeToSpotifyKeyMode('9B')!
    const good = {
      id: 'good',
      key: adjacent.key,
      mode: adjacent.mode,
      tempo: 121,
      energy: 0.52,
    }
    const badKey = {
      id: 'badKey',
      key: 0,
      mode: 1,
      tempo: 121,
      energy: 0.52,
    }
    const badBpm = {
      id: 'badBpm',
      key: anchor.key,
      mode: anchor.mode,
      tempo: 150,
      energy: 0.5,
    }

    const pool = [badBpm, badKey, good]
    const ranked = rankByTransition(from, pool)
    expect(ranked[0].id).toBe('good')
  })
})
