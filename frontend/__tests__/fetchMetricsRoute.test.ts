import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../app/api/fetch-metrics/route'
import { MOCK_INFLUENCERS } from '../lib/mockData'

function get(url: string) {
  return GET(new NextRequest(new URL(url, 'http://localhost:3000')))
}

describe('GET /api/fetch-metrics', () => {
  it('returns every influencer when no niche filter is given', async () => {
    const res = await get('/api/fetch-metrics')
    const body = await res.json()
    expect(body.influencers).toHaveLength(MOCK_INFLUENCERS.length)
  })

  it('filters influencers by the requested niche', async () => {
    const res = await get('/api/fetch-metrics?niche=tech')
    const body = await res.json()
    expect(body.influencers.length).toBeGreaterThan(0)
    expect(body.influencers.every((i: { niche: string }) => i.niche === 'tech')).toBe(true)
  })

  it('returns an empty list for a niche with no creators', async () => {
    const res = await get('/api/fetch-metrics?niche=not-a-real-niche')
    const body = await res.json()
    expect(body.influencers).toEqual([])
  })
})
