import { NextResponse } from 'next/server'
import { apiError } from '@/lib/apiError'
import { spotifyFetch } from '@/lib/auth/spotifySession'
import { spotifyTrackToWoody } from '@/lib/spotify'

export async function GET() {
  try {
    const response = await spotifyFetch('/me/player')
    if (response.status === 204) return NextResponse.json({ active: false })
    const data = (await response.json()) as Record<string, any>
    return NextResponse.json({
      active: true,
      isPlaying: data.is_playing === true,
      progressMs: typeof data.progress_ms === 'number' ? data.progress_ms : 0,
      track: data.item?.type === 'track' ? spotifyTrackToWoody(data.item) : null,
      device: data.device ?? null,
      contextUri: data.context?.uri ?? null,
      observedAt: new Date().toISOString(),
    })
  } catch (error) {
    return apiError(error, 'spotify_state_failed')
  }
}
