import { NextRequest, NextResponse } from 'next/server'
import { apiError, badRequest } from '@/lib/apiError'
import { searchSupportedCorpus } from '@/lib/acousticService'
import { getSpotifyAccessToken, spotifyFetch } from '@/lib/auth/spotifySession'
import { spotifyTrackToWoody } from '@/lib/spotify'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim()
  if (!query || query.length < 2 || query.length > 200) return badRequest('invalid_search_query')
  try {
    await getSpotifyAccessToken()
    const supported = await searchSupportedCorpus(query)
    if (supported.length === 0) return NextResponse.json({ tracks: [] })
    const ids = supported.map((track) => track.id).join(',')
    const spotifyResponse = await spotifyFetch(`/tracks?ids=${encodeURIComponent(ids)}`)
    const data = (await spotifyResponse.json()) as { tracks?: unknown[] }
    return NextResponse.json({ tracks: (data.tracks ?? []).filter(Boolean).map(spotifyTrackToWoody) })
  } catch (error) {
    return apiError(error, 'supported_track_search_failed')
  }
}
