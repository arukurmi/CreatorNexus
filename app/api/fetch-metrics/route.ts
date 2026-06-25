import { NextRequest, NextResponse } from 'next/server'
import { MOCK_INFLUENCERS } from '@/lib/mockData'

// For the MVP this returns mock data. Swap the body for a RapidAPI
// Instagram-scraper proxy later — the rate-limit seam is already wired in
// middleware.ts.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const niche = searchParams.get('niche')

  const filtered = niche
    ? MOCK_INFLUENCERS.filter((i) => i.niche === niche)
    : MOCK_INFLUENCERS

  return NextResponse.json({ influencers: filtered })
}
