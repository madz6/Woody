import { describe, expect, it } from 'vitest'
import { initialPlaybackObserver, reducePlaybackObservation, type PlaybackObservation } from './playbackObserver'
import type { Track } from './types'

const first: Track = { id: 'first', name: 'First', artist: 'A', album: '', durationMs: 200_000 }
const next: Track = { id: 'next', name: 'Next', artist: 'B', album: '', durationMs: 180_000 }

function observed(track: Track, progressMs: number): PlaybackObservation {
  return { track, progressMs, isPlaying: true, observedAt: '2026-07-14T10:00:00.000Z' }
}

describe('playback event reducer', () => {
  it('records exact listened fraction at natural completion', () => {
    let state = initialPlaybackObserver('adaptive')
    state = reducePlaybackObservation(state, observed(first, 0)).state
    state = reducePlaybackObservation(state, observed(first, 196_000)).state
    const result = reducePlaybackObservation({ ...state, expectedTrackId: next.id }, observed(next, 0))
    expect(result.events[0].eventType).toBe('track_completed')
    expect(result.events[0].listenedFraction).toBe(0.98)
    expect(result.skipSignal).toBeUndefined()
  })

  it('treats an early headphone or Watch change as a continuous skip signal', () => {
    let state = initialPlaybackObserver('adaptive')
    state = reducePlaybackObservation(state, observed(first, 50_000)).state
    const result = reducePlaybackObservation({ ...state, expectedTrackId: next.id }, observed(next, 0))
    expect(result.events[0].eventType).toBe('manual_transition')
    expect(result.events[0].listenedFraction).toBe(0.25)
    expect(result.skipSignal).toEqual({ trackId: first.id, weight: 0.75 })
    expect(result.overrideTrack).toBeUndefined()
  })

  it('pauses adaptive queueing on an unexpected playlist override', () => {
    let state = initialPlaybackObserver('adaptive')
    state = reducePlaybackObservation(state, observed(first, 80_000)).state
    const result = reducePlaybackObservation({ ...state, expectedTrackId: 'woody-choice' }, observed(next, 0))
    expect(result.events.some((event) => event.eventType === 'user_override')).toBe(true)
    expect(result.state.pausedForOverride).toBe(true)
    expect(result.overrideTrack?.id).toBe(next.id)
  })

  it('observes control queue changes without calling them overrides', () => {
    let state = initialPlaybackObserver('control_observation')
    state = reducePlaybackObservation(state, observed(first, 80_000)).state
    const result = reducePlaybackObservation(state, observed(next, 0))
    expect(result.events.some((event) => event.eventType === 'user_override')).toBe(false)
    expect(result.state.pausedForOverride).toBe(false)
  })
})
