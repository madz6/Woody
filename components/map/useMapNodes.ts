'use client'

import { useMemo } from 'react'
import { zoneAnchorLatLng } from '@/lib/mapZones'
import { spotifyPlaybackUri } from '@/lib/sources'
import type { MapNode, PersonaLens, Track, TrackSuggestion } from '@/lib/types'

export type MapNodeData = {
  id: string
  trackId: string
  lat: number
  lng: number
  tone: TrackSuggestion['tone']
  label: string
  spotifyUri: string
  reason: string
  isKnown: boolean
  isPlaying: boolean
  kind: 'suggestion' | 'memory' | 'save_point'
  track?: Track
  energyHint?: number
  bpmHint?: number
  keyHint?: string
  birthTime?: number
}

function hash01(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return (Math.abs(h) % 10000) / 10000
}

const TONE_LAT_CENTER: Record<TrackSuggestion['tone'], number> = {
  violet: 0.35,
  amber: -0.15,
  moss: -0.45,
  rose: 0.05,
}

const TONE_LNG_OFFSET: Record<TrackSuggestion['tone'], number> = {
  violet: 0,
  amber: Math.PI * 0.5,
  moss: -Math.PI * 0.4,
  rose: Math.PI * 0.25,
}

const suggestionBirthTimes: Record<string, number> = {}

function baseLatFromSessionEnergy(h: number): number {
  if (h > 0.7) return 0.3 + hash01(`elat:${h}`) * 0.3
  if (h < 0.3) return -0.5 + hash01(`elat:${h}`) * 0.3
  return -0.1 + hash01(`elat:${h}`) * 0.35
}

export function latLngToVec3(lat: number, lng: number, radius = 1.02): [number, number, number] {
  const cl = Math.cos(lat)
  return [cl * Math.cos(lng) * radius, Math.sin(lat) * radius, cl * Math.sin(lng) * radius]
}

export function nodeSurfaceRadius(isKnown: boolean, isPlaying: boolean): number {
  if (isPlaying) return 1.05
  if (isKnown) return 1.038
  return 1.008
}

function mapNodeToData(m: MapNode, playingTrackId: string | null): MapNodeData {
  const uri = spotifyPlaybackUri(m.track)
  const isSave = Boolean(m.savePointLabel)
  const label = isSave
    ? `${m.savePointLabel} - ${m.track.name} - ${m.track.artist}`
    : `${m.track.name} - ${m.track.artist}`
  return {
    id: m.id,
    trackId: m.trackId,
    lat: m.position.x,
    lng: m.position.y,
    tone: m.tone,
    label,
    spotifyUri: uri,
    reason: isSave ? 'save point' : 'your map',
    isKnown: true,
    isPlaying: playingTrackId === m.track.id,
    kind: isSave ? 'save_point' : 'memory',
    track: m.track,
  }
}

export function useMapNodes(
  suggestions: TrackSuggestion[],
  memoryNodes: MapNode[],
  opts: {
    knownTrackIds: Set<string>
    playingTrackId: string | null
    personaLens?: PersonaLens | null
  }
): MapNodeData[] {
  return useMemo(() => {
    const suggestionIds = new Set(suggestions.map((s) => s.track.id))
    const fromMemory = memoryNodes
      .filter((m) => !suggestionIds.has(m.trackId) || m.id.startsWith('save-'))
      .map((m) => mapNodeToData(m, opts.playingTrackId))

    const lens = opts.personaLens
    const sessionEnergy =
      lens != null
        ? lens.energy === 'high'
          ? 0.8
          : lens.energy === 'low'
            ? 0.2
            : 0.5
        : undefined

    const fromSuggestions = suggestions.map((s, index) => {
      const h1 = hash01(s.track.id + 'a')
      const h2 = hash01(s.track.id + 'b')
      const h3 = hash01(s.track.id + 'c')
      const audio = s.audioAttributes
      const uri = spotifyPlaybackUri(s.track)

      let lat: number
      let lng: number
      let bpmHint: number | undefined

      if (audio?.energy !== undefined && audio?.bpm !== undefined) {
        const energyLat = (audio.energy - 0.5) * 1.4
        const bpmNorm = Math.max(0, Math.min(1, (audio.bpm - 60) / 120))
        const bpmLng = (bpmNorm - 0.5) * Math.PI * 1.2
        const jitterLat = (h1 - 0.5) * 0.14
        const jitterLng = (h2 - 0.5) * 0.16
        lat = Math.max(-0.85, Math.min(0.85, energyLat + jitterLat))
        lng = Math.max(
          -Math.PI * 0.6,
          Math.min(Math.PI * 0.6, bpmLng + jitterLng + (h3 - 0.5) * 0.08)
        )
        bpmHint = audio.bpm
      } else if (audio?.energy !== undefined) {
        const energyLat = (audio.energy - 0.5) * 1.4
        const jitterLat = (h1 - 0.5) * 0.14
        const baseLng = TONE_LNG_OFFSET[s.tone] + index * 0.18
        const jitterLng = (h2 - 0.5) * 0.28
        lat = Math.max(-0.85, Math.min(0.85, energyLat + jitterLat))
        lng = Math.max(
          -Math.PI * 0.6,
          Math.min(Math.PI * 0.6, baseLng + jitterLng + h3 * 0.12)
        )
      } else {
        const baseLat =
          sessionEnergy !== undefined ? baseLatFromSessionEnergy(sessionEnergy) : TONE_LAT_CENTER[s.tone]
        const baseLng = TONE_LNG_OFFSET[s.tone] + index * 0.18
        const jitterLat = (h1 - 0.5) * 0.32
        const jitterLng = (h2 - 0.5) * 0.32
        lat = Math.max(-0.85, Math.min(0.85, baseLat + jitterLat))
        lng = Math.max(
          -Math.PI * 0.6,
          Math.min(Math.PI * 0.6, baseLng + jitterLng + h3 * 0.12)
        )
      }

      if (s.zoneId) {
        const anchor = zoneAnchorLatLng(s.zoneId)
        const w = 0.4
        lat = lat * (1 - w) + anchor.lat * w
        lng = lng * (1 - w) + anchor.lng * w
        lat = Math.max(-0.85, Math.min(0.85, lat))
        lng = Math.max(-Math.PI * 0.95, Math.min(Math.PI * 0.95, lng))
      }

      if (!suggestionBirthTimes[s.track.id]) {
        suggestionBirthTimes[s.track.id] = Date.now()
      }

      return {
        id: s.track.id,
        trackId: s.track.id,
        lat,
        lng,
        tone: s.tone,
        label: `${s.track.name} - ${s.track.artist}`,
        spotifyUri: uri,
        reason: s.reason,
        isKnown: opts.knownTrackIds.has(s.track.id),
        isPlaying: opts.playingTrackId === s.track.id,
        kind: 'suggestion' as const,
        track: s.track,
        birthTime: suggestionBirthTimes[s.track.id],
        ...(sessionEnergy !== undefined ? { energyHint: sessionEnergy } : {}),
        ...(bpmHint !== undefined ? { bpmHint } : {}),
        ...(audio?.key ? { keyHint: audio.key } : {}),
      }
    })

    return [...fromMemory, ...fromSuggestions]
  }, [suggestions, memoryNodes, opts.knownTrackIds, opts.playingTrackId, opts.personaLens])
}
