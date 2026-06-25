import { describe, it, expect } from 'vitest'
import { allocateBudget } from '../lib/allocateBudget'
import { Influencer } from '../lib/types'

const makeInfluencer = (
  overrides: Partial<Influencer> & { id: string }
): Influencer => ({
  handle: `@user_${overrides.id}`,
  avatar_url: '',
  followers: 10000,
  avg_views: 5000,
  engagement_rate: 0.05,
  estimated_cost: 1000,
  niche: 'pets',
  ...overrides,
})

describe('allocateBudget', () => {
  it('returns empty selection when budget is 0', () => {
    const influencers = [makeInfluencer({ id: 'a', estimated_cost: 500 })]
    const result = allocateBudget(influencers, 0)
    expect(result.selected_influencers).toHaveLength(0)
    expect(result.total_projected_spend).toBe(0)
    expect(result.leftover_budget).toBe(0)
  })

  it('selects influencers greedily by highest engagement_rate first', () => {
    const low = makeInfluencer({ id: 'low', engagement_rate: 0.02, estimated_cost: 500 })
    const high = makeInfluencer({ id: 'high', engagement_rate: 0.09, estimated_cost: 500 })
    const result = allocateBudget([low, high], 1000)
    expect(result.selected_influencers[0].id).toBe('high')
  })

  it('does not exceed the target budget', () => {
    const influencers = [
      makeInfluencer({ id: 'a', estimated_cost: 1500, engagement_rate: 0.09 }),
      makeInfluencer({ id: 'b', estimated_cost: 800, engagement_rate: 0.07 }),
      makeInfluencer({ id: 'c', estimated_cost: 600, engagement_rate: 0.05 }),
    ]
    const result = allocateBudget(influencers, 2000)
    expect(result.total_projected_spend).toBeLessThanOrEqual(2000)
  })

  it('computes leftover_budget correctly', () => {
    const influencers = [
      makeInfluencer({ id: 'a', estimated_cost: 700, engagement_rate: 0.08 }),
    ]
    const result = allocateBudget(influencers, 1000)
    expect(result.leftover_budget).toBe(300)
    expect(result.total_projected_spend).toBe(700)
  })

  it('skips influencer whose cost alone exceeds remaining budget', () => {
    const influencers = [
      makeInfluencer({ id: 'expensive', estimated_cost: 5000, engagement_rate: 0.1 }),
      makeInfluencer({ id: 'cheap', estimated_cost: 500, engagement_rate: 0.06 }),
    ]
    const result = allocateBudget(influencers, 1000)
    expect(result.selected_influencers).toHaveLength(1)
    expect(result.selected_influencers[0].id).toBe('cheap')
  })

  it('applies cost formula when estimated_cost is 0', () => {
    const influencer = makeInfluencer({
      id: 'formula',
      followers: 20000,
      avg_views: 10000,
      engagement_rate: 0.05,
      estimated_cost: 0,
    })
    // formula: (20000 * 0.05) + (10000 / 10 * 0.1) = 1000 + 100 = 1100
    const result = allocateBudget([influencer], 2000)
    expect(result.total_projected_spend).toBe(1100)
  })
})
