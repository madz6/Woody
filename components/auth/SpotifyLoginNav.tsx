'use client'

import type { ReactNode } from 'react'

/**
 * Full-page navigation to OAuth login on the **current** tab origin (avoids odd relative
 * resolution). After Spotify, you still land on whatever is in SPOTIFY_REDIRECT_URI — that
 * value and the Dashboard must use the same host as this origin (e.g. all 127.0.0.1:8888).
 */
export function SpotifyLoginNav({
  href = '/api/auth/login',
  className,
  children,
}: {
  href?: string
  className?: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        if (typeof window === 'undefined') return
        const path = href.startsWith('/') ? href : `/${href}`
        e.preventDefault()
        window.location.assign(`${window.location.origin}${path}`)
      }}
    >
      {children}
    </a>
  )
}
