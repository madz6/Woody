import { NextResponse } from 'next/server'
import { enrichTrack } from '@/lib/enrichment'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      trackId?: string
      trackName?: string
      artistName?: string
    }
    const { trackId, trackName, artistName } = body
    if (typeof trackName !== 'string' || typeof artistName !== 'string') {
      return NextResponse.json({
        trackId: trackId ?? null,
        tags: [],
        releaseYear: undefined,
        listeners: undefined,
        similar: [],
      })
    }
    const data = await enrichTrack(trackName.trim(), artistName.trim())
    return NextResponse.json({ trackId: trackId ?? null, ...data })
  } catch {
    return NextResponse.json({
      trackId: null,
      tags: [],
      releaseYear: undefined,
      listeners: undefined,
      similar: [],
    })
  }
}
