import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('journey acoustic-service V2 contract', () => {
  it('sends only supported-track direction inputs and maps coherent diagnostics', async () => {
    vi.stubEnv('ACOUSTIC_SERVICE_URL', 'https://acoustic.example')
    vi.stubEnv('ACOUSTIC_SERVICE_TOKEN', 'service-secret')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      decision_id: 'decision-1',
      track: { id: 'next', name: 'Next', artist: 'Artist', spotify_uri: 'spotify:track:next' },
      confidence: 0.8,
      selection_mode: 'coherent',
      current_embedding_available: true,
      transition_distance: 0.2,
      target_distance: 0.1,
      skip_penalty: 0.4,
      relaxation_level: 1,
      candidate_count: 42,
      latency_ms: 12,
      adjustment: 'closer_to_current',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const { selectJourneyNext } = await import('./acousticService')
    const decision = await selectJourneyNext({
      sessionId: 'session',
      decisionIndex: 2,
      currentTrackId: 'current',
      currentTrackArtist: 'Current Artist',
      startTrackId: 'start',
      direction: 'Relaxed but self-assured',
      adjustment: 'closer_to_current',
      excludeIds: ['played'],
      skipPenalties: [{ trackId: 'skipped', weight: 0.75, decisionsRemaining: 3 }],
    })
    const [, init] = fetchMock.mock.calls[0]
    const sent = JSON.parse(String(init.body))
    expect(init.headers.Authorization).toBe('Bearer service-secret')
    expect(sent).toMatchObject({ start_track_id: 'start', direction: 'Relaxed but self-assured', adjustment: 'closer_to_current' })
    expect(sent).not.toHaveProperty('phase')
    expect(sent).not.toHaveProperty('familiarity_target')
    expect(decision.transitionDistance).toBe(0.2)
    expect(decision.track.spotifyUri).toBe('spotify:track:next')
  })

  it('never forwards Spotify preview audio when checking support', async () => {
    vi.stubEnv('ACOUSTIC_SERVICE_URL', 'https://acoustic.example')
    vi.stubEnv('ACOUSTIC_SERVICE_TOKEN', 'service-secret')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      track_id: 'anchor', embedded: true, created: false,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const { ensureJourneyAnchor } = await import('./acousticService')
    await ensureJourneyAnchor({ trackId: 'anchor', name: 'Track', artist: 'Artist', previewUrl: 'https://p.scdn.co/example.mp3' })
    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(String(init.body))).not.toHaveProperty('preview_url')
  })
})
