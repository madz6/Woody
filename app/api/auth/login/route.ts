import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'playlist-read-private',
  'user-library-read',
  'user-top-read',
  'user-read-recently-played',
].join(' ')

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim()
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI?.trim()
  if (!clientId || !redirectUri) {
    return new NextResponse(
      [
        'Spotify login is not configured.',
        'Set SPOTIFY_CLIENT_ID and SPOTIFY_REDIRECT_URI in .env.local (see .env.local.example).',
        'Redirect URI must match Spotify Dashboard → Redirect URIs exactly (copy/paste — same host, port, and path).',
        'Example: http://127.0.0.1:8888/callback with npm run dev (port 8888).',
      ].join('\n'),
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    )
  }

  const state = randomBytes(32).toString('base64url')
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
    show_dialog: 'false',
  })

  if (process.env.NODE_ENV === 'development') {
    console.info('[spotify/login] redirect_uri (must match Spotify Dashboard exactly):', redirectUri)
  }

  const response = NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`)
  response.cookies.set('spotify_oauth_state', state, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60,
  })
  return response
}
