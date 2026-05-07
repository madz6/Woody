/**
 * Multi-source playback resolver (PRD S7 stub).
 * Today all catalog tracks are Spotify; extend with other providers without touching the player hook.
 */

import type { Track } from './types'

/** Spotify Web Playback track URI for the current catalog. */
export function spotifyPlaybackUri(track: Track): string {
  if (track.spotifyUri?.startsWith('spotify:')) return track.spotifyUri
  const catalogId = track.sources?.spotify ?? track.id
  return `spotify:track:${catalogId}`
}
