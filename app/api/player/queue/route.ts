import { NextRequest, NextResponse } from 'next/server'
import { apiError, badRequest } from '@/lib/apiError'
import { spotifyFetch } from '@/lib/auth/spotifySession'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    if (typeof body.uri !== 'string' || !/^spotify:track:[A-Za-z0-9]+$/.test(body.uri)) {
      return badRequest('invalid_track_uri')
    }
    const params = new URLSearchParams({ uri: body.uri })
    if (typeof body.deviceId === 'string') params.set('device_id', body.deviceId)
    await spotifyFetch(`/me/player/queue?${params}`, { method: 'POST' })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error, 'spotify_queue_failed')
  }
}
