import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ disconnected: true })
  for (const name of ['spotify_access_token', 'spotify_refresh_token', 'spotify_oauth_state']) {
    response.cookies.set(name, '', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
    })
  }
  return response
}
