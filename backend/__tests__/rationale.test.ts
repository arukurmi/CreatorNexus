import { describe, it, expect } from 'vitest'
import { allocate } from '../src/services/allocationService'
import { allocationRationale } from '../src/services/allocation/rationale'
import type { Influencer } from '../src/types'

function mk(id: string, followers: number, views: number, eng: number, min: number, max: number): Influencer {
  return { id, handle: id, avatar_url: '', followers, avg_views: views, avg_likes: 1, avg_comments: 0,
    engagement_rate: eng, niche: 'tech', tier: followers >= 100000 ? 'macro' : followers >= 10000 ? 'micro' : 'nano', cost_min: min, cost_max: max }
}
const pool: Influencer[] = [
  mk('nano1', 5000, 2000, 0.08, 1000, 1000),
  mk('nano2', 5000, 2000, 0.08, 1000, 1000),
  mk('micro1', 40000, 20000, 0.05, 10000, 10000),
  mk('macro1', 200000, 120000, 0.03, 80000, 80000),
]

describe('allocationRationale', () => {
  it('L1 + L2 + omitted baseline: tier one-liners, macro over the whole budget, no comparison when 80/20 picks nobody', () => {
    expect(allocationRationale(allocate(pool, 20000, { strategy: 'reach' }), pool, 'reach')).toEqual([
      'Nano gets 17% of spend across 2 creators.',
      'Micro gets 83% of spend across 1 creator.',
      'Skipped macro: the cheapest macro creator costs ₹80,000, more than the whole ₹20,000 budget.',
    ])
  })

  it('L2 + L3: macro over the budget left for it, engagement delta vs the 80/20 split', () => {
    const lines = allocationRationale(allocate(pool, 85000, { strategy: 'reach' }), pool, 'reach')
    expect(lines).toContain('Skipped macro: the cheapest macro creator costs ₹80,000, more than the budget left for it.')
    expect(lines.at(-1)).toBe('+40% projected engagement vs a generic 80/20 macro/micro split.')
  })

  it('L2: a tier pushed out by the count limit says so', () => {
    const lines = allocationRationale(allocate(pool, 1_000_000, { strategy: 'count', count: 2 }), pool, 'count')
    expect(lines).toContain('Skipped nano: the cheapest nano creator ranked below the creators that filled the requested count.')
  })

  it('omits the 80/20 comparison for the count strategy, whose pick is capped', () => {
    const lines = allocationRationale(allocate(pool, 1_000_000, { strategy: 'count', count: 2 }), pool, 'count')
    expect(lines.some((l) => l.includes('80/20'))).toBe(false)
  })

  it('returns no lines for an empty pool', () => {
    expect(allocationRationale(allocate([], 50000, { strategy: 'value' }), [], 'value')).toEqual([])
  })
})
