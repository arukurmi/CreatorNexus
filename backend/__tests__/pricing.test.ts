import { describe, it, expect } from 'vitest'
import { engagementMultiplier } from '../src/services/pricing/engagementMultiplier'
import { getPricer } from '../src/services/pricing'
import { DEFAULT_PRICING } from '../src/config/pricingConfig'
import type { RawCreatorSignals } from '../src/types'

const micro = (over: Partial<RawCreatorSignals> = {}): RawCreatorSignals => ({
  handle: 'x', avatar_url: '', followers: 50000, avg_views: 20000,
  avg_likes: 2200, avg_comments: 100, engagement_rate: 0.046, niche: 'fashion', ...over,
})

describe('engagementMultiplier', () => {
  it('is 1 at tier average', () => {
    expect(engagementMultiplier(0.045, 'micro', DEFAULT_PRICING)).toBeCloseTo(1, 5)
  })
  it('is >1 above average and <1 below', () => {
    expect(engagementMultiplier(0.07, 'micro', DEFAULT_PRICING)).toBeGreaterThan(1)
    expect(engagementMultiplier(0.02, 'micro', DEFAULT_PRICING)).toBeLessThan(1)
  })
  it('never goes non-positive even at zero engagement', () => {
    expect(engagementMultiplier(0, 'micro', DEFAULT_PRICING)).toBeGreaterThan(0)
  })
})

describe('pricers obey invariants', () => {
  for (const model of ['cpm', 'weighted', 'tier_flat'] as const) {
    it(`${model}: cost_min < cost_max and both > 0`, () => {
      const { cost_min, cost_max } = getPricer(model).price(micro(), DEFAULT_PRICING)
      expect(cost_min).toBeGreaterThan(0)
      expect(cost_min).toBeLessThan(cost_max)
    })
    it(`${model}: corner cases (0 followers/views/eng) never crash or go negative`, () => {
      const r = getPricer(model).price(
        micro({ followers: 0, avg_views: 0, avg_likes: 0, avg_comments: 0, engagement_rate: 0 }),
        DEFAULT_PRICING,
      )
      expect(r.cost_min).toBeGreaterThan(0)
      expect(r.cost_min).toBeLessThan(r.cost_max)
    })
  }
})

describe('cpm pricing magnitude', () => {
  it('prices a typical micro creator in a sane INR band', () => {
    const { cost_min, cost_max } = getPricer('cpm').price(micro(), DEFAULT_PRICING)
    expect(cost_min).toBeGreaterThan(1000)
    expect(cost_max).toBeLessThan(500000)
  })
})
