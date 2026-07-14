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
      previewUrl: track.previewUrl,
    })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message.includes('anchor_audio_unavailable')) {
      return NextResponse.json({ error: 'anchor_audio_unavailable' }, { status: 422 })
    }
    if (error instanceof Error && (error.name === 'TimeoutError' || error.message.includes('timed out'))) {
      return NextResponse.json({ error: 'anchor_embedding_timeout' }, { status: 504 })
    }
    return apiError(error, 'anchor_embedding_failed')
  }
}
