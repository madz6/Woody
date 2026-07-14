import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('journey acoustic-service contract', () => {
  it('sends the protected snake-case contract and maps diagnostics', async () => {
    vi.stubEnv('ACOUSTIC_SERVICE_URL', 'https://acoustic.example')
    vi.stubEnv('ACOUSTIC_SERVICE_TOKEN', 'service-secret')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      decision_id: 'decision-1',
      track: { id: 'next', name: 'Next', artist: 'Artist', spotify_uri: 'spotify:track:next', knownness: 'unseen' },
      phase: 'impact',
      confidence: 0.8,
      transition_distance: 0.2,
      target_distance: 0.1,
      familiarity_fit: 0.3,
      skip_penalty: 0.4,
      relaxation_level: 1,
      candidate_count: 42,
      latency_ms: 12,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const { selectJourneyNext } = await import('./acousticService')
    const decision = await selectJourneyNext({
      sessionId: 'session',
      decisionIndex: 2,
      currentTrackId: 'current',
      anchorTrackIds: ['anchor'],
      phase: 'impact',
      phaseDescription: 'arrive clearly',
      familiarityTarget: 0.65,
      knownTrackIds: [],
      knownArtists: [],
      recentKnownness: [],
      excludeIds: ['played'],
      skipPenalties: [{ trackId: 'skipped', weight: 0.75, decisionsRemaining: 3 }],
    })
    const [, init] = fetchMock.mock.calls[0]
    const sent = JSON.parse(String(init.body))
    expect(init.headers.Authorization).toBe('Bearer service-secret')
    expect(sent.skip_penalties[0]).toEqual({ track_id: 'skipped', weight: 0.75, decisions_remaining: 3 })
    expect(decision.relaxationLevel).toBe(1)
    expect(decision.track.spotifyUri).toBe('spotify:track:next')
  })
})
