import { NextResponse } from 'next/server'
import { apiError } from '@/lib/apiError'
import { spotifyFetch } from '@/lib/auth/spotifySession'

export async function GET() {
  try {
    const response = await spotifyFetch('/me/player/devices')
    const data = (await response.json()) as { devices?: unknown[] }
    return NextResponse.json({ devices: data.devices ?? [] })
  } catch (error) {
    return apiError(error, 'spotify_devices_failed')
  }
}
