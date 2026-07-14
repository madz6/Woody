import { NextResponse } from 'next/server'
import { getSpotifyAccessToken, SpotifySessionError } from '@/lib/auth/spotifySession'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await getSpotifyAccessToken()
    return NextResponse.json({ connected: true })
  } catch (error) {
    if (error instanceof SpotifySessionError) {
      return NextResponse.json({ error: error.code }, { status: error.status })
    }
    return NextResponse.json({ error: 'spotify_session_failed' }, { status: 500 })
  }
}
