import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function diagnoseEnabled() {
  return process.env.NODE_ENV !== 'production' || process.env.SPOTIFY_DIAGNOSE === 'true'
}

function maskId(id: string | undefined): { set: boolean; prefix: string | null } {
  if (!id?.trim()) return { set: false, prefix: null }
  const t = id.trim()
  return { set: true, prefix: t.length <= 6 ? `${t.slice(0, 2)}…` : `${t.slice(0, 6)}…` }
}

export async function GET(request: NextRequest) {
  if (!diagnoseEnabled()) {
    return NextResponse.json(
      { error: 'Diagnose disabled in production. Set SPOTIFY_DIAGNOSE=true in .env to enable.' },
      { status: 404 }
    )
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim()
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim()
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI?.trim()
  const authAppUrl = process.env.AUTH_APP_URL?.trim()

  let redirectOrigin: string | null = null
  let redirectPath: string | null = null
  let redirectParseError: string | null = null

  if (redirectUri) {
    try {
      const u = new URL(redirectUri)
      redirectOrigin = u.origin
      redirectPath = u.pathname + u.search
    } catch {
      redirectParseError = 'SPOTIFY_REDIRECT_URI is not a valid URL'
    }
  }

  const serverOrigin = request.nextUrl.origin
  const browserOrigin = request.nextUrl.searchParams.get('browserOrigin')?.trim() || null

  const hints: string[] = []

  if (!clientId) hints.push('SPOTIFY_CLIENT_ID is missing in .env.local')
  if (!clientSecret) hints.push('SPOTIFY_CLIENT_SECRET is missing in .env.local')
  if (!redirectUri) hints.push('SPOTIFY_REDIRECT_URI is missing in .env.local')
  if (redirectParseError) hints.push(redirectParseError)

  if (redirectOrigin && browserOrigin && redirectOrigin !== browserOrigin) {
    hints.push(
      `MISMATCH: This page was opened at ${browserOrigin} but SPOTIFY_REDIRECT_URI uses ${redirectOrigin}. Open the app using that same origin, or change .env and Spotify dashboard to match this tab.`
    )
  }

  if (redirectOrigin && serverOrigin !== redirectOrigin && !authAppUrl) {
    hints.push(
      `Server origin is ${serverOrigin}; redirect URI origin is ${redirectOrigin}. If OAuth completes on the wrong host, set AUTH_APP_URL (rare for local dev).`
    )
  }

  if (
    redirectPath &&
    redirectPath !== '/callback' &&
    redirectPath !== '/api/auth/callback'
  ) {
    hints.push(
      `Redirect path is "${redirectPath}". Woody only serves /callback and /api/auth/callback — use one of those in dashboard and .env.`
    )
  }

  hints.push(
    'Spotify Dashboard: Settings → Redirect URIs must list the exact same string as SPOTIFY_REDIRECT_URI (copy/paste).'
  )
  hints.push('After editing .env.local, restart the dev server.')

  return NextResponse.json({
    ok: true,
    serverOrigin,
    browserOriginReported: browserOrigin,
    env: {
      clientId: maskId(clientId),
      clientSecretSet: Boolean(clientSecret),
      redirectUri: redirectUri ?? null,
      redirectOrigin,
      redirectPath,
      authAppUrlSet: Boolean(authAppUrl),
      authAppUrl: authAppUrl ?? null,
    },
    oauthAuthorizeUrlPreview:
      clientId && redirectUri
        ? `https://accounts.spotify.com/authorize?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=…`
        : null,
    hints,
    links: {
      login: `${serverOrigin}/api/auth/login`,
      callbackShort: redirectOrigin ? `${redirectOrigin}/callback` : null,
      callbackApi: redirectOrigin ? `${redirectOrigin}/api/auth/callback` : null,
    },
  })
}
