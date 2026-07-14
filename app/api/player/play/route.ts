import { NextRequest, NextResponse } from 'next/server'
import { apiError, badRequest } from '@/lib/apiError'
import { spotifyFetch } from '@/lib/auth/spotifySession'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    if (typeof body.uri !== 'string' || !/^spotify:track:[A-Za-z0-9]+$/.test(body.uri)) {
      return badRequest('invalid_track_uri')
    }
    const device = typeof body.deviceId === 'string' ? `?device_id=${encodeURIComponent(body.deviceId)}` : ''
    await spotifyFetch(`/me/player/play${device}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: [body.uri] }),
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error, 'spotify_play_failed')
  }
}
