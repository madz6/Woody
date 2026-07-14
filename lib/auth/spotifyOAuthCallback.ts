import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Where to send the browser after OAuth. Must match the host that received the callback
 * or cookies stay on e.g. 127.0.0.1:8888 while you redirect to localhost:3000 and look "logged out".
 * Only set AUTH_APP_URL when behind a proxy / wrong Host header (e.g. some tunnels).
 */
export function appOrigin(request: NextRequest): string {
  const raw = process.env.AUTH_APP_URL?.trim()
  if (raw) {
    try {
      return new URL(raw).origin
    } catch {
      /* fall through */
    }
  }
  return request.nextUrl.origin
}

function redirectAuthError(request: NextRequest, reason: string) {
  const u = new URL('/', appOrigin(request))
  u.searchParams.set('auth', 'error')
  u.searchParams.set('reason', reason)
  return NextResponse.redirect(u)
}

export function redirectTo(path: string, request: NextRequest) {
  return NextResponse.redirect(new URL(path, appOrigin(request)))
}

const cookieOpts = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}

function stateMatches(expected: string | undefined, received: string | null): boolean {
  if (!expected || !received) return false
  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(received)
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer)
}

function clearOAuthState(response: NextResponse): NextResponse {
  response.cookies.delete('spotify_oauth_state')
  return response
}

export async function handleSpotifyOAuthCallback(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')
  const receivedState = searchParams.get('state')
  const expectedState = request.cookies.get('spotify_oauth_state')?.value

  if (!stateMatches(expectedState, receivedState)) {
    return clearOAuthState(redirectAuthError(request, 'invalid_state'))
  }

  if (oauthError) {
    const reason = oauthError === 'access_denied' ? 'denied' : 'oauth'
    return clearOAuthState(redirectAuthError(request, reason))
  }

  if (!code) {
    return clearOAuthState(redirectAuthError(request, 'missing_code'))
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim()
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim()
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI?.trim()

  if (!clientId || !clientSecret || !redirectUri) {
    return clearOAuthState(redirectAuthError(request, 'misconfigured'))
  }

  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!res.ok) {
    let reason = 'token'
    try {
      const j = (await res.json()) as { error?: string; error_description?: string }
      if (j.error === 'invalid_grant') reason = 'invalid_grant'
      else if (j.error === 'invalid_client') reason = 'invalid_client'
      if (process.env.NODE_ENV === 'development') {
        console.error('[spotify/callback] token exchange failed', res.status, j)
      }
    } catch {
      if (process.env.NODE_ENV === 'development') {
        console.error('[spotify/callback] token exchange failed (non-JSON body)', res.status)
      }
    }
    return clearOAuthState(redirectAuthError(request, reason))
  }

  const tokens = (await res.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
  }

  if (!tokens.access_token) {
    return clearOAuthState(redirectAuthError(request, 'no_access_token'))
  }

  const response = redirectTo('/', request)
  response.cookies.set('spotify_access_token', tokens.access_token, {
    ...cookieOpts,
    maxAge: tokens.expires_in ?? 3600,
  })
  if (tokens.refresh_token) {
    response.cookies.set('spotify_refresh_token', tokens.refresh_token, {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  return clearOAuthState(response)
}
