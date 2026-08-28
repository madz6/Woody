import { describe, expect, it } from 'vitest'
import { initialPlaybackObserver, reducePlaybackObservation, type PlaybackObservation } from './playbackObserver'
import type { Track } from './types'

const first: Track = { id: 'first', name: 'First', artist: 'A', album: '', durationMs: 200_000 }
const next: Track = { id: 'next', name: 'Next', artist: 'B', album: '', durationMs: 180_000 }

function observed(track: Track, progressMs: number, seconds = 0): PlaybackObservation {
  return { track, progressMs, isPlaying: true, observedAt: `2026-07-14T10:00:${String(seconds).padStart(2, '0')}.000Z` }
}

describe('playback event reducer', () => {
  it('measures playback from Spotify progress rather than wall time', () => {
    let state = initialPlaybackObserver('adaptive')
    state = reducePlaybackObservation(state, observed(first, 10_000, 0)).state
    const result = reducePlaybackObservation(state, observed(first, 15_200, 5))
    expect(result.playbackDeltaMs).toBe(5_200)
  })

  it('records natural completion without a skip penalty', () => {
    let state = initialPlaybackObserver('adaptive')
    state = reducePlaybackObservation(state, observed(first, 196_000, 0)).state
    const result = reducePlaybackObservation({ ...state, expectedTrackId: next.id }, observed(next, 0, 5))
    expect(result.events[0].eventType).toBe('track_completed')
    expect(result.events[1].eventType).toBe('expected_queued_transition')
    expect(result.skipSignal).toBeUndefined()
  })

  it('attributes an early jump to the queued track to the user', () => {
    let state = initialPlaybackObserver('adaptive')
    state = reducePlaybackObservation(state, observed(first, 50_000, 0)).state
    const result = reducePlaybackObservation({ ...state, expectedTrackId: next.id, expectedDecisionId: 'decision' }, observed(next, 0, 5))
    expect(result.events[0]).toMatchObject({ eventType: 'manual_transition', initiatingSource: 'user' })
    expect(result.skipSignal).toEqual({ trackId: first.id, weight: 0.75 })
    expect(result.overrideTrack).toBeUndefined()
  })

  it('does not infer completion or rejection across an observation gap', () => {
    let state = initialPlaybackObserver('adaptive')
    state = reducePlaybackObservation(state, observed(first, 50_000, 0)).state
    const result = reducePlaybackObservation({ ...state, expectedTrackId: next.id }, observed(next, 0, 30))
    expect(result.events[0].eventType).toBe('observation_gap')
    expect(result.playbackDeltaMs).toBe(0)
    expect(result.skipSignal).toBeUndefined()
  })

  it('does not count same-track progress across an observation gap', () => {
    let state = initialPlaybackObserver('adaptive')
    state = reducePlaybackObservation(state, observed(first, 50_000, 0)).state
    const result = reducePlaybackObservation(state, observed(first, 80_000, 30))
    expect(result.events[0].eventType).toBe('observation_gap')
    expect(result.playbackDeltaMs).toBe(0)
  })

  it('pauses adaptive queueing on an unexpected track', () => {
    let state = initialPlaybackObserver('adaptive')
    state = reducePlaybackObservation(state, observed(first, 80_000, 0)).state
    const result = reducePlaybackObservation({ ...state, expectedTrackId: 'woody-choice' }, observed(next, 0, 5))
    expect(result.events.some((event) => event.eventType === 'user_override')).toBe(true)
    expect(result.state.pausedForOverride).toBe(true)
  })
})
