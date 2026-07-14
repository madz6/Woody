import { NextRequest, NextResponse } from 'next/server'
import { apiError, badRequest } from '@/lib/apiError'
import { spotifyFetch } from '@/lib/auth/spotifySession'
import { spotifyTrackToWoody } from '@/lib/spotify'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim()
  if (!query || query.length < 2 || query.length > 200) return badRequest('invalid_search_query')
  try {
    const params = new URLSearchParams({ q: query, type: 'track', limit: '10' })
    const response = await spotifyFetch(`/search?${params}`)
    const data = (await response.json()) as { tracks?: { items?: unknown[] } }
    return NextResponse.json({ tracks: (data.tracks?.items ?? []).map(spotifyTrackToWoody) })
  } catch (error) {
    return apiError(error, 'spotify_search_failed')
  }
}
