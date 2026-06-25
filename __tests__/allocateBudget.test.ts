import { describe, it, expect } from 'vitest'
import { allocateBudget, influencerCost } from '../lib/allocateBudget'
import { Influencer } from '../lib/types'

const makeInfluencer = (
  overrides: Partial<Influencer> & { id: string }
): Influencer => ({
  handle: `@user_${overrides.id}`,
  avatar_url: '',
  followers: 10000,
  avg_views: 5000,
  engagement_rate: 0.05,
  cost_min: 800,
  cost_max: 1200,
  niche: 'pets',
  ...overrides,
})

describe('influencerCost', () => {
  it('returns the average of the cost range', () => {
    const inf = makeInfluencer({ id: 'a', cost_min: 1000, cost_max: 3000 })
    expect(influencerCost(inf)).toBe(2000)
  })
})

describe('allocateBudget', () => {
  it('returns empty selection when budget is 0', () => {
    const influencers = [makeInfluencer({ id: 'a', cost_min: 400, cost_max: 600 })]
    const result = allocateBudget(influencers, 0)
    expect(result.selected_influencers).toHaveLength(0)
    expect(result.total_projected_spend).toBe(0)
    expect(result.leftover_budget).toBe(0)
  })

  it('never exceeds the target budget', () => {
    const influencers = [
      makeInfluencer({ id: 'a', cost_min: 1400, cost_max: 1600, avg_views: 9000 }),
      makeInfluencer({ id: 'b', cost_min: 700, cost_max: 900, avg_views: 5000 }),
      makeInfluencer({ id: 'c', cost_min: 500, cost_max: 700, avg_views: 3000 }),
    ]
    const result = allocateBudget(influencers, 2000)
    expect(result.total_projected_spend).toBeLessThanOrEqual(2000)
  })

  it('computes spend and leftover from the average of each range', () => {
    const influencers = [
      makeInfluencer({ id: 'a', cost_min: 600, cost_max: 800, avg_views: 9999 }),
    ]
    // average cost = 700
    const result = allocateBudget(influencers, 1000)
    expect(result.total_projected_spend).toBe(700)
    expect(result.leftover_budget).toBe(300)
  })

  describe('strategy: reach (default)', () => {
    it('prefers the highest avg_views first', () => {
      const low = makeInfluencer({ id: 'low', avg_views: 1000, cost_min: 400, cost_max: 600 })
      const high = makeInfluencer({ id: 'high', avg_views: 9000, cost_min: 400, cost_max: 600 })
      const result = allocateBudget([low, high], 1000)
      expect(result.selected_influencers[0].id).toBe('high')
    })
  })

  describe('strategy: engagement', () => {
    it('prefers the highest engagement_rate first', () => {
      const low = makeInfluencer({ id: 'low', engagement_rate: 0.02, cost_min: 400, cost_max: 600 })
      const high = makeInfluencer({ id: 'high', engagement_rate: 0.09, cost_min: 400, cost_max: 600 })
      const result = allocateBudget([low, high], 1000, { strategy: 'engagement' })
      expect(result.selected_influencers[0].id).toBe('high')
    })
  })

  describe('strategy: value', () => {
    it('prefers the best engagement × reach per rupee', () => {
      // cheap+engaged beats expensive despite similar raw engagement
      const cheap = makeInfluencer({ id: 'cheap', engagement_rate: 0.08, avg_views: 5000, cost_min: 400, cost_max: 600 })
      const pricey = makeInfluencer({ id: 'pricey', engagement_rate: 0.08, avg_views: 5000, cost_min: 4000, cost_max: 6000 })
      const result = allocateBudget([pricey, cheap], 600, { strategy: 'value' })
      expect(result.selected_influencers[0].id).toBe('cheap')
    })
  })

  describe('strategy: count via maxCount', () => {
    it('selects at most maxCount creators', () => {
      const influencers = [
        makeInfluencer({ id: 'a', engagement_rate: 0.09, cost_min: 400, cost_max: 600 }),
        makeInfluencer({ id: 'b', engagement_rate: 0.08, cost_min: 400, cost_max: 600 }),
        makeInfluencer({ id: 'c', engagement_rate: 0.07, cost_min: 400, cost_max: 600 }),
      ]
      const result = allocateBudget(influencers, 100000, {
        strategy: 'engagement',
        maxCount: 2,
      })
      expect(result.selected_influencers).toHaveLength(2)
    })
  })
})
