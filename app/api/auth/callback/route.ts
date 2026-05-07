import type { NextRequest } from 'next/server'
import { handleSpotifyOAuthCallback } from '@/lib/auth/spotifyOAuthCallback'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return handleSpotifyOAuthCallback(request)
}
