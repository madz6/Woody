import type { NextRequest } from 'next/server'
import { handleSpotifyOAuthCallback } from '@/lib/auth/spotifyOAuthCallback'

export const dynamic = 'force-dynamic'

/** Spotify redirect URI path `/callback` (e.g. http://127.0.0.1:8888/callback) when dashboard disallows or omits localhost. */
export async function GET(request: NextRequest) {
  return handleSpotifyOAuthCallback(request)
}
