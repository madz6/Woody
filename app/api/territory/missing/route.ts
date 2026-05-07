import { NextRequest, NextResponse } from 'next/server'
import type { TasteProfile } from '@/lib/types'
import { fetchTerritoryMissing } from '@/lib/territoryMissing'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tasteProfile = body.tasteProfile as TasteProfile | undefined
    const excludeIds = (body.excludeIds as string[] | undefined) ?? []

    if (!tasteProfile || tasteProfile.sessionCount < 1) {
      return NextResponse.json({ suggestions: [] })
    }

    const suggestions = await fetchTerritoryMissing(tasteProfile, excludeIds)
    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('[/api/territory/missing]', err)
    return NextResponse.json({ suggestions: [] })
  }
}
