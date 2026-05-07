import { NextResponse } from 'next/server'

/** Accept client beacons; no persistence in MVP. */
export async function POST() {
  return new NextResponse(null, { status: 204 })
}
