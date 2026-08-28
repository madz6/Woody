import { describe, expect, it } from 'vitest'
import { createJourneyPlan, parseJourneyPlanInput } from './journey'

const track = {
  id: 'track',
  name: 'Track',
  artist: 'Artist',
  album: 'Album',
  durationMs: 180_000,
  spotifyUri: 'spotify:track:track',
}

describe('journey V2 planning', () => {
  it('accepts the current supported track and one direction', () => {
    const input = parseJourneyPlanInput({
      mode: 'adaptive',
      direction: 'Relaxed but keep the confidence of this track',
      durationMinutes: 15,
      startTrack: track,
      startSource: 'current_spotify_track',
    })
    expect(input).not.toBeNull()
    const plan = createJourneyPlan(input!)
    expect(plan).toMatchObject({
      version: 2,
      mode: 'adaptive',
      direction: 'Relaxed but keep the confidence of this track',
      startTrack: track,
    })
    expect(plan).not.toHaveProperty('phases')
    expect(plan).not.toHaveProperty('familiarityTarget')
  })

  it('rejects missing tracks, short directions, and invalid durations', () => {
    expect(parseJourneyPlanInput({ mode: 'adaptive', direction: 'ok', durationMinutes: 15 })).toBeNull()
    expect(parseJourneyPlanInput({ mode: 'adaptive', direction: 'steady', durationMinutes: 5, startTrack: track, startSource: 'current_spotify_track' })).toBeNull()
  })
})
