import { afterEach, describe, expect, it, vi } from 'vitest'
import { createJourneyPlan, parseJourneyPlanInput } from './journey'
import type { Track } from './types'

const track: Track = {
  id: 'track-1',
  name: 'Anchor',
  artist: 'Artist',
  album: 'Album',
  spotifyUri: 'spotify:track:track1',
  durationMs: 180_000,
}

afterEach(() => vi.unstubAllEnvs())

describe('journey setup schema', () => {
  it('accepts one opener and preserves the user note', () => {
    const parsed = parseJourneyPlanInput({
      mode: 'adaptive',
      intent: 'steady and surprising',
      durationMinutes: 35,
      anchors: [{ track, role: 'opener', note: 'hold the tension' }],
    })
    expect(parsed?.anchors[0].note).toBe('hold the tension')
  })

  it('rejects setup without exactly one opener', () => {
    expect(parseJourneyPlanInput({
      mode: 'adaptive',
      intent: 'steady and surprising',
      durationMinutes: 35,
      anchors: [{ track, role: 'reference', note: '' }],
    })).toBeNull()
  })
})

describe('journey fallback plan', () => {
  it('keeps provenance channels separate and defaults to 65/35', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    const plan = await createJourneyPlan({
      mode: 'adaptive',
      intent: 'settle then build confidence',
      durationMinutes: 25,
      anchors: [{ track, role: 'opener', note: 'warm and grounded' }],
    })
    expect(plan.version).toBe(1)
    expect(plan.familiarityTarget).toBe(0.65)
    expect(plan.impactWindows).toHaveLength(1)
    expect(plan.attribution.find((item) => item.field === 'intent')?.source).toBe('user_text')
    expect(plan.anchors[0].attribution.some((item) => item.source === 'system_inferred')).toBe(true)
    expect(JSON.stringify(plan)).not.toMatch(/\b(bpm|key|energy)\b/i)
  })

  it('proposes two removable impact windows for longer runs', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    const plan = await createJourneyPlan({
      mode: 'control_observation',
      intent: 'long controlled effort',
      durationMinutes: 45,
      anchors: [{ track, role: 'opener', note: '' }],
    })
    expect(plan.impactWindows).toHaveLength(2)
    expect(plan.impactWindows.every((window) => window.enabled)).toBe(true)
  })
})
