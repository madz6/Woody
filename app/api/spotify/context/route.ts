import { NextResponse } from 'next/server'
import { apiError } from '@/lib/apiError'
import { spotifyFetch } from '@/lib/auth/spotifySession'

type SpotifyTrack = { id?: string; artists?: Array<{ name?: string }> }

export async function GET() {
  try {
    const savedRequests = [0, 50, 100, 150].map((offset) =>
      spotifyFetch(`/me/tracks?limit=50&offset=${offset}`),
    )
    const [recentResponse, topResponse, ...savedResponses] = await Promise.all([
      spotifyFetch('/me/player/recently-played?limit=50'),
      spotifyFetch('/me/top/tracks?time_range=medium_term&limit=50'),
      ...savedRequests,
    ])
    const recent = (await recentResponse.json()) as { items?: Array<{ track?: SpotifyTrack }> }
    const top = (await topResponse.json()) as { items?: SpotifyTrack[] }
    const saved = await Promise.all(savedResponses.map((response) => response.json() as Promise<{ items?: Array<{ track?: SpotifyTrack }> }>))
    const tracks = [
      ...(recent.items ?? []).map((item) => item.track),
      ...(top.items ?? []),
      ...saved.flatMap((page) => (page.items ?? []).map((item) => item.track)),
    ].filter((track): track is SpotifyTrack => Boolean(track))
    const trackIds = new Set<string>()
    const artists = new Set<string>()
    for (const track of tracks) {
      if (track.id) trackIds.add(track.id)
      for (const artist of track.artists ?? []) if (artist.name) artists.add(artist.name)
    }
    return NextResponse.json({ knownTrackIds: [...trackIds], knownArtists: [...artists] })
  } catch (error) {
    return apiError(error, 'spotify_context_failed')
  }
}
