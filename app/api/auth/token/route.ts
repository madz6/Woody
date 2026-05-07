import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token?: string
  expires_in: number
} | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim()
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) return null

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) return null
  return res.json()
}

const cookieBase = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
} as const

export async function GET() {
  const jar = await cookies()
  const access = jar.get('spotify_access_token')?.value
  const refresh = jar.get('spotify_refresh_token')?.value

  if (access) {
    return NextResponse.json({ token: access })
  }

  if (!refresh) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 })
  }

  const tokens = await refreshAccessToken(refresh)
  if (!tokens?.access_token) {
    return NextResponse.json({ error: 'refresh_failed' }, { status: 401 })
  }

  const res = NextResponse.json({ token: tokens.access_token })

  res.cookies.set('spotify_access_token', tokens.access_token, {
    ...cookieBase,
    maxAge: tokens.expires_in ?? 3600,
  })

  if (tokens.refresh_token) {
    res.cookies.set('spotify_refresh_token', tokens.refresh_token, {
      ...cookieBase,
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  return res
}
