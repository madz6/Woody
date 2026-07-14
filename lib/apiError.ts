import { NextResponse } from 'next/server'
import { SpotifySessionError } from './auth/spotifySession'

export function apiError(error: unknown, fallback = 'request_failed'): NextResponse {
  if (error instanceof SpotifySessionError) {
    const response = NextResponse.json({ error: error.code }, { status: error.status })
    if (error.retryAfter) response.headers.set('Retry-After', error.retryAfter)
    return response
  }
  if (process.env.NODE_ENV === 'development') console.error(error)
  return NextResponse.json({ error: fallback }, { status: 500 })
}

export function badRequest(error: string): NextResponse {
  return NextResponse.json({ error }, { status: 400 })
}
