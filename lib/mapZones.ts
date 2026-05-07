/**
 * Named map territories (PRD S4) — shared by WoodyMap visuals and node placement.
 */

import type { MapZoneId } from './types'

export type { MapZoneId }

export const ZONE_SPECS: readonly {
  id: MapZoneId
  label: string
  color: string
  /** Approximate anchor on unit sphere (same as WoodyMap meshes). */
  position: readonly [number, number, number]
}[] = [
  { id: 'dm', label: 'Dark Matter', color: '#7C6BCE', position: [-0.4, 0.3, 0.6] as const },
  { id: 'sp', label: 'Signal Plain', color: '#C4874A', position: [0.5, -0.1, 0.5] as const },
  { id: 'oc', label: 'Organic Country', color: '#4E6B45', position: [-0.2, -0.4, 0.55] as const },
  { id: 'df', label: 'Dusk Fringe', color: '#8C5C5C', position: [0.3, 0.35, 0.5] as const },
] as const

/** Search query bias when user deepens into a zone (intent pipeline). */
export const ZONE_SEARCH_BIAS: Record<MapZoneId, string> = {
  dm: 'dark ambient drone atmospheric',
  sp: 'synth electronic signal pulse',
  oc: 'organic acoustic folk earthy',
  df: 'twilight cinematic dusk melancholy',
}

function vecToLatLng(x: number, y: number, z: number): { lat: number; lng: number } {
  const len = Math.hypot(x, y, z)
  if (len < 1e-6) return { lat: 0, lng: 0 }
  const nx = x / len
  const ny = y / len
  const nz = z / len
  const lat = Math.asin(Math.max(-1, Math.min(1, ny)))
  const lng = Math.atan2(nz, nx)
  return { lat, lng }
}

/** Globe lat/lng (radians) near zone centroid — pull suggestion nodes toward territory. */
export function zoneAnchorLatLng(zoneId: MapZoneId): { lat: number; lng: number } {
  const spec = ZONE_SPECS.find((z) => z.id === zoneId)
  if (!spec) return { lat: 0, lng: 0 }
  const [x, y, z] = spec.position
  return vecToLatLng(x, y, z)
}
