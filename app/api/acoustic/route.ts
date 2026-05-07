/**
 * /api/acoustic — proxy to the Woody Acoustic Analysis Service
 *
 * Accepts POST { preview_urls: string[] }
 * Forwards to ACOUSTIC_SERVICE_URL/analyze and returns the feature vectors.
 *
 * This proxy exists so:
 *  1. The acoustic service URL stays server-side (not exposed to browser)
 *  2. We can add caching, rate limiting, or feature gating here later
 *  3. Client code calls /api/acoustic instead of hardcoding the service URL
 *
 * If ACOUSTIC_SERVICE_URL is not configured, returns 503 so the caller
 * can gracefully fall back to LLM-estimated audio attributes.
 */

import { NextRequest, NextResponse } from 'next/server'

const ACOUSTIC_SERVICE_URL = process.env.ACOUSTIC_SERVICE_URL

export async function POST(request: NextRequest) {
  if (!ACOUSTIC_SERVICE_URL) {
    return NextResponse.json(
      { error: 'Acoustic service not configured (ACOUSTIC_SERVICE_URL not set)' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()

    if (!Array.isArray(body.preview_urls)) {
      return NextResponse.json({ error: 'preview_urls must be an array' }, { status: 400 })
    }

    const res = await fetch(`${ACOUSTIC_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preview_urls: body.preview_urls }),
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[/api/acoustic] Service error:', res.status, text)
      return NextResponse.json(
        { error: `Acoustic service error: ${res.status}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/acoustic] Error:', err)
    return NextResponse.json(
      { error: 'Acoustic service unreachable' },
      { status: 503 }
    )
  }
}
