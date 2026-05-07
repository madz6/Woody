'use client'

import { useEffect, useState } from 'react'

type DiagnosePayload = {
  ok?: boolean
  error?: string
  serverOrigin?: string
  browserOriginReported?: string | null
  env?: {
    clientId: { set: boolean; prefix: string | null }
    clientSecretSet: boolean
    redirectUri: string | null
    redirectOrigin: string | null
    redirectPath: string | null
    authAppUrlSet: boolean
    authAppUrl: string | null
  }
  oauthAuthorizeUrlPreview?: string | null
  hints?: string[]
  links?: { login: string; callbackShort: string | null; callbackApi: string | null }
}

export default function SpotifyDebugPage() {
  const [data, setData] = useState<DiagnosePayload | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const browserOrigin =
      typeof window !== 'undefined' ? window.location.origin : ''
    const q = new URLSearchParams({ browserOrigin })
    fetch(`/api/auth/diagnose?${q}`)
      .then(async (r) => {
        const j = (await r.json()) as DiagnosePayload
        if (!r.ok) {
          setLoadError(j.error ?? `HTTP ${r.status}`)
          return
        }
        setData(j)
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'fetch failed'))
  }, [])

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0F0F0D] text-[#E8E4DC] p-8 font-sans text-sm">
        <p className="text-rose-300 mb-4">{loadError}</p>
        <p className="text-white/60">
          In production, add SPOTIFY_DIAGNOSE=true to .env to enable this page.
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0F0F0D] text-[#E8E4DC] p-8 font-sans text-sm">
        Loading diagnose…
      </div>
    )
  }

  const e = data.env

  return (
    <div className="min-h-screen bg-[#0F0F0D] text-[#E8E4DC] p-8 font-sans text-sm max-w-2xl">
      <a href="/" className="text-white/40 text-xs hover:text-white/70 mb-4 inline-block">
        ← Back to app
      </a>
      <h1 className="text-xl font-medium text-white mb-2">Spotify OAuth diagnose</h1>
      <p className="text-white/50 mb-6">
        Compare these values to Spotify Developer Dashboard → your app → Redirect URIs. They must match{' '}
        <span className="text-amber-200/90">exactly</span>.
      </p>

      <section className="mb-6 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-xs uppercase tracking-widest text-white/40">This browser tab</h2>
        <p>
          <code className="text-emerald-300">{data.browserOriginReported ?? '—'}</code>
        </p>
        <h2 className="text-xs uppercase tracking-widest text-white/40 mt-4">Server (this request)</h2>
        <p>
          <code className="text-cyan-300">{data.serverOrigin}</code>
        </p>
      </section>

      <section className="mb-6 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-xs uppercase tracking-widest text-white/40">.env.local (loaded by Next)</h2>
        <ul className="space-y-1.5">
          <li>
            SPOTIFY_CLIENT_ID:{' '}
            {e?.clientId?.set ? (
              <code className="text-emerald-300">{e.clientId.prefix}</code>
            ) : (
              <span className="text-rose-300">missing</span>
            )}
          </li>
          <li>
            SPOTIFY_CLIENT_SECRET:{' '}
            {e?.clientSecretSet ? <span className="text-emerald-300">set</span> : <span className="text-rose-300">missing</span>}
          </li>
          <li>
            SPOTIFY_REDIRECT_URI:{' '}
            {e?.redirectUri ? (
              <code className="break-all text-amber-200">{e.redirectUri}</code>
            ) : (
              <span className="text-rose-300">missing</span>
            )}
          </li>
          <li>
            Parsed origin:{' '}
            <code className="text-cyan-300">{e?.redirectOrigin ?? '—'}</code>
          </li>
          <li>
            Parsed path: <code>{e?.redirectPath ?? '—'}</code>
          </li>
          {e?.authAppUrlSet && (
            <li>
              AUTH_APP_URL: <code className="break-all">{e.authAppUrl}</code>
            </li>
          )}
        </ul>
      </section>

      {data.hints && data.hints.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-widest text-white/40 mb-2">Hints</h2>
          <ol className="list-decimal list-inside space-y-2 text-white/80">
            {data.hints.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ol>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <a
          href="/api/auth/login"
          className="inline-block rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-center text-white hover:bg-white/15"
        >
          Try Connect Spotify (same tab)
        </a>
        <p className="text-white/40 text-xs">
          After Spotify redirects you, you should land on <code className="text-white/60">/callback</code> or your
          configured path on the <strong>same</strong> origin as SPOTIFY_REDIRECT_URI.
        </p>
      </section>

      <p className="mt-8 text-white/35 text-xs">
        Dev-only. Remove SPOTIFY_DIAGNOSE in production or rely on NODE_ENV=production to hide the API.
      </p>
    </div>
  )
}
