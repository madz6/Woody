import { randomUUID } from 'node:crypto'
import type { JourneyPlanV2, JourneySessionMode, JourneyStartSource, Track } from './types'

export interface JourneyPlanInputV2 {
  mode: JourneySessionMode
  direction: string
  durationMinutes: number
  startTrack: Track
  startSource: JourneyStartSource
}

function text(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null
}

export function parseTrack(value: unknown): Track | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  const id = text(item.id, 128)
  const name = text(item.name, 500)
  const artist = text(item.artist, 500)
  if (!id || !name || !artist) return null
  const durationMs = typeof item.durationMs === 'number' && Number.isFinite(item.durationMs)
    ? Math.max(0, Math.round(item.durationMs))
    : 0
  return {
    id,
    name,
    artist,
    album: typeof item.album === 'string' ? item.album.slice(0, 500) : '',
    durationMs,
    ...(typeof item.albumArt === 'string' ? { albumArt: item.albumArt } : {}),
    ...(typeof item.spotifyUri === 'string' ? { spotifyUri: item.spotifyUri } : {}),
    ...(typeof item.externalUrl === 'string' ? { externalUrl: item.externalUrl } : {}),
    ...(typeof item.previewUrl === 'string' ? { previewUrl: item.previewUrl } : {}),
  }
}

export function parseJourneyPlanInput(value: unknown): JourneyPlanInputV2 | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  const direction = text(item.direction, 1000)
  const durationMinutes = typeof item.durationMinutes === 'number' ? Math.round(item.durationMinutes) : NaN
  const mode = item.mode === 'control_observation' || item.mode === 'adaptive' ? item.mode : null
  const startSource = item.startSource === 'current_spotify_track' || item.startSource === 'supported_track_search'
    ? item.startSource
    : null
  const startTrack = parseTrack(item.startTrack)
  if (!direction || direction.length < 3 || !mode || !startSource || !startTrack) return null
  if (durationMinutes < 10 || durationMinutes > 240) return null
  return { mode, direction, durationMinutes, startTrack, startSource }
}

export function createJourneyPlan(input: JourneyPlanInputV2): JourneyPlanV2 {
  return {
    version: 2,
    sessionId: randomUUID(),
    mode: input.mode,
    direction: input.direction,
    durationMinutes: input.durationMinutes,
    startTrack: input.startTrack,
    startSource: input.startSource,
    createdAt: new Date().toISOString(),
  }
}
