import { NextRequest, NextResponse } from 'next/server'
import { apiError, badRequest } from '@/lib/apiError'
import { getSpotifyAccessToken } from '@/lib/auth/spotifySession'
import { createJourneyPlan, parseJourneyPlanInput } from '@/lib/journey'

export async function POST(request: NextRequest) {
  try {
    await getSpotifyAccessToken()
    const input = parseJourneyPlanInput(await request.json())
    if (!input) return badRequest('invalid_journey_setup')
    return NextResponse.json(await createJourneyPlan(input))
  } catch (error) {
    return apiError(error, 'journey_plan_failed')
  }
}
