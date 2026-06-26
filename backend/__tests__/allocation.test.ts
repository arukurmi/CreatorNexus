import { describe, it, expect } from 'vitest'
import { allocate, influencerCost } from '../src/services/allocationService'
import type { Influencer } from '../src/types'

function mk(id: string, followers: number, views: number, eng: number, min: number, max: number): Influencer {
  return { id, handle: id, avatar_url: '', followers, avg_views: views, avg_likes: 1, avg_comments: 0,
    engagement_rate: eng, niche: 'tech', tier: followers >= 100000 ? 'macro' : followers >= 10000 ? 'micro' : 'nano', cost_min: min, cost_max: max }
}
const pool: Influencer[] = [
  mk('nano1', 5000, 2000, 0.08, 1000, 2000),
  mk('nano2', 8000, 3000, 0.06, 1500, 2500),
  mk('micro1', 40000, 20000, 0.05, 8000, 12000),
  mk('macro1', 200000, 120000, 0.03, 80000, 120000),
]

describe('allocate', () => {
  it('reach: stays within total budget', () => {
    const r = allocate(pool, 50000, { strategy: 'reach' })
    expect(r.total_projected_spend).toBeLessThanOrEqual(50000)
    expect(r.budget_buffer_applied).toBe(false)
    expect(r.effective_budget).toBe(50000)
  })

  it('engagement: applies 1.10 buffer and may exceed slider total', () => {
    const r = allocate(pool, 10000, { strategy: 'engagement' })
    expect(r.effective_budget).toBe(11000)
    expect(r.budget_buffer_applied).toBe(true)
    expect(r.total_projected_spend).toBeLessThanOrEqual(11000)
  })

  it('value: selects within budget and reports by_tier', () => {
    const r = allocate(pool, 30000, { strategy: 'value' })
    expect(r.total_projected_spend).toBeLessThanOrEqual(30000)
    const tierSpend = r.by_tier.nano.spend + r.by_tier.micro.spend + r.by_tier.macro.spend
    expect(tierSpend).toBe(r.total_projected_spend)
  })

  it('count: returns at most N creators that fit', () => {
    const r = allocate(pool, 1_000_000, { strategy: 'count', count: 2 })
    expect(r.selected.length).toBeLessThanOrEqual(2)
  })

  it('corner: zero budget selects nothing', () => {
    const r = allocate(pool, 0, { strategy: 'reach' })
    expect(r.selected).toEqual([])
    expect(r.total_projected_spend).toBe(0)
    expect(r.leftover_budget).toBe(0)
  })

  it('corner: empty pool selects nothing', () => {
    const r = allocate([], 50000, { strategy: 'value' })
    expect(r.selected).toEqual([])
  })

  it('corner: budget below cheapest selects nothing', () => {
    const r = allocate(pool, 500, { strategy: 'reach' })
    expect(r.selected).toEqual([])
  })

  it('influencerCost is the range midpoint', () => {
    expect(influencerCost(pool[0])).toBe(1500)
  })
})
