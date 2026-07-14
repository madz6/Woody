import { NextRequest, NextResponse } from 'next/server'
import { apiError, badRequest } from '@/lib/apiError'
import { ensureJourneyAnchor } from '@/lib/acousticService'
import { getSpotifyAccessToken } from '@/lib/auth/spotifySession'
import { parseTrack } from '@/lib/journey'

export async function POST(request: NextRequest) {
  try {
    await getSpotifyAccessToken()
    const body = (await request.json()) as Record<string, unknown>
    const track = parseTrack(body.track)
    if (!track) return badRequest('invalid_anchor_track')
    const result = await ensureJourneyAnchor({
      trackId: track.id,
      name: track.name,
      artist: track.artist,
      album: track.album,
      spotifyUri: track.spotifyUri ?? `spotify:track:${track.id}`,
      durationMs: track.durationMs,
    })
    return NextResponse.json(result)
  } catch (error) {
    return apiError(error, 'anchor_embedding_failed')
  }
}
