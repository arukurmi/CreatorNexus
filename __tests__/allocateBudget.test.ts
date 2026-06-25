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

  it('selects influencers greedily by highest engagement_rate first', () => {
    const low = makeInfluencer({ id: 'low', engagement_rate: 0.02, cost_min: 400, cost_max: 600 })
    const high = makeInfluencer({ id: 'high', engagement_rate: 0.09, cost_min: 400, cost_max: 600 })
    const result = allocateBudget([low, high], 1000)
    expect(result.selected_influencers[0].id).toBe('high')
  })

  it('does not exceed the target budget', () => {
    const influencers = [
      makeInfluencer({ id: 'a', cost_min: 1400, cost_max: 1600, engagement_rate: 0.09 }),
      makeInfluencer({ id: 'b', cost_min: 700, cost_max: 900, engagement_rate: 0.07 }),
      makeInfluencer({ id: 'c', cost_min: 500, cost_max: 700, engagement_rate: 0.05 }),
    ]
    const result = allocateBudget(influencers, 2000)
    expect(result.total_projected_spend).toBeLessThanOrEqual(2000)
  })

  it('computes spend and leftover from the average of each range', () => {
    const influencers = [
      makeInfluencer({ id: 'a', cost_min: 600, cost_max: 800, engagement_rate: 0.08 }),
    ]
    // average cost = 700
    const result = allocateBudget(influencers, 1000)
    expect(result.total_projected_spend).toBe(700)
    expect(result.leftover_budget).toBe(300)
  })

  it('skips an influencer whose average cost exceeds remaining budget', () => {
    const influencers = [
      makeInfluencer({ id: 'expensive', cost_min: 4000, cost_max: 6000, engagement_rate: 0.1 }),
      makeInfluencer({ id: 'cheap', cost_min: 400, cost_max: 600, engagement_rate: 0.06 }),
    ]
    // expensive avg = 5000 (> 1000), cheap avg = 500
    const result = allocateBudget(influencers, 1000)
    expect(result.selected_influencers).toHaveLength(1)
    expect(result.selected_influencers[0].id).toBe('cheap')
  })
})
