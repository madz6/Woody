import { cookies } from 'next/headers'

const SPOTIFY_API = 'https://api.spotify.com/v1'

const cookieBase = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}

export class SpotifySessionError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly retryAfter?: string,
  ) {
    super(message)
  }
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim()
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) {
    throw new SpotifySessionError('Spotify is not configured', 503, 'spotify_misconfigured')
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new SpotifySessionError('Spotify session expired', 401, 'spotify_refresh_failed')
  }

  const tokens = (await response.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
  }
  if (!tokens.access_token) {
    throw new SpotifySessionError('Spotify session expired', 401, 'spotify_refresh_failed')
  }

  const jar = await cookies()
  jar.set('spotify_access_token', tokens.access_token, {
    ...cookieBase,
    maxAge: tokens.expires_in ?? 3600,
  })
  if (tokens.refresh_token) {
    jar.set('spotify_refresh_token', tokens.refresh_token, {
      ...cookieBase,
      maxAge: 60 * 60 * 24 * 30,
    })
  }
  return tokens.access_token
}

export async function getSpotifyAccessToken(forceRefresh = false): Promise<string> {
  const jar = await cookies()
  const accessToken = jar.get('spotify_access_token')?.value
  if (accessToken && !forceRefresh) return accessToken

  const refreshToken = jar.get('spotify_refresh_token')?.value
  if (!refreshToken) {
    throw new SpotifySessionError('Connect Spotify to continue', 401, 'not_connected')
  }
  return refreshAccessToken(refreshToken)
}

export async function spotifyFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const request = async (token: string) =>
    fetch(`${SPOTIFY_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
      cache: 'no-store',
      signal: init.signal ?? AbortSignal.timeout(15_000),
    })

  let response = await request(await getSpotifyAccessToken())
  if (response.status === 401) {
    response = await request(await getSpotifyAccessToken(true))
  }
  if (!response.ok) {
    const retryAfter = response.headers.get('retry-after') ?? undefined
    throw new SpotifySessionError(
      'Spotify request failed',
      response.status,
      response.status === 429 ? 'spotify_rate_limited' : 'spotify_request_failed',
      retryAfter,
    )
  }
  return response
}
