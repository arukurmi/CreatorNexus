/**
 * pricing.extra.test.ts
 * Additional corner-case / invariant tests for the pricing layer.
 * Do NOT modify pricing.test.ts — this file extends coverage only.
 *
 * BUG FLAG: Search for "BUG:" comments below for issues surfaced by these tests.
 */
import { describe, it, expect } from 'vitest'
import { engagementMultiplier } from '../src/services/pricing/engagementMultiplier'
import { cpmPricer } from '../src/services/pricing/cpm'
import { weightedPricer } from '../src/services/pricing/weighted'
import { tierFlatPricer } from '../src/services/pricing/tierFlat'
import { getPricer } from '../src/services/pricing'
import { MIN_FLOOR } from '../src/services/pricing/types'
import { DEFAULT_PRICING } from '../src/config/pricingConfig'
import type { RawCreatorSignals } from '../src/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const cfg = DEFAULT_PRICING

const base = (over: Partial<RawCreatorSignals> = {}): RawCreatorSignals => ({
  handle: 'test', avatar_url: '', followers: 50_000, avg_views: 20_000,
  avg_likes: 1_000, avg_comments: 100, engagement_rate: 0.045, niche: 'fitness', ...over,
})

const nano = (over: Partial<RawCreatorSignals> = {}): RawCreatorSignals =>
  base({ followers: 5_000, avg_views: 2_000, avg_likes: 300, engagement_rate: 0.06, ...over })

const macro = (over: Partial<RawCreatorSignals> = {}): RawCreatorSignals =>
  base({ followers: 500_000, avg_views: 150_000, avg_likes: 15_000, engagement_rate: 0.03, ...over })

// ---------------------------------------------------------------------------
// engagementMultiplier — clamping & monotonicity
// ---------------------------------------------------------------------------
describe('engagementMultiplier – clamping', () => {
  it('clamps at upper bound 2.5 when factor exceeds it', () => {
    // factor = 1 + 4*(0.5 − 0.045) = 2.82 → clamped to 2.5
    expect(engagementMultiplier(0.5, 'micro', cfg)).toBeCloseTo(2.5, 5)
  })

  it('upper clamp is the same regardless of how far above we go', () => {
    expect(engagementMultiplier(0.7, 'micro', cfg)).toBeCloseTo(2.5, 5)
    expect(engagementMultiplier(1.0, 'micro', cfg)).toBeCloseTo(2.5, 5)
  })

  it('clamps at lower bound 0.4 for very negative engagement', () => {
    // factor = 1 + 4*(−0.2 − 0.045) = 0.02 → clamped to 0.4
    expect(engagementMultiplier(-0.2, 'micro', cfg)).toBeCloseTo(0.4, 5)
  })

  it('is monotonically non-decreasing in engagement (unclamped range for micro)', () => {
    const low  = engagementMultiplier(0.02, 'micro', cfg)  // 0.9
    const mid  = engagementMultiplier(0.045, 'micro', cfg) // 1.0
    const high = engagementMultiplier(0.1,  'micro', cfg)  // 1.22
    expect(low).toBeLessThan(mid)
    expect(mid).toBeLessThan(high)
  })

  it('equals 1 exactly at tier average for all three tiers', () => {
    expect(engagementMultiplier(cfg.tierAvgEng.nano,  'nano',  cfg)).toBeCloseTo(1, 5)
    expect(engagementMultiplier(cfg.tierAvgEng.micro, 'micro', cfg)).toBeCloseTo(1, 5)
    expect(engagementMultiplier(cfg.tierAvgEng.macro, 'macro', cfg)).toBeCloseTo(1, 5)
  })
})

// ---------------------------------------------------------------------------
// CPM pricer — monotonicity
// ---------------------------------------------------------------------------
describe('cpmPricer – monotonicity by avg_views', () => {
  // micro tier, exactly average engagement (multiplier = 1.0), varying views
  // 5 k views  → base=1500, mid=1500, min=max(500,1200)=1200, max=1800
  // 20 k views → base=6000, mid=6000, min=4800, max=7200
  // 50 k views → base=15000, mid=15000, min=12000, max=18000
  const eng = cfg.tierAvgEng.micro

  it('5 k views produces expected exact cost', () => {
    const { cost_min, cost_max } = cpmPricer.price(base({ avg_views: 5_000, engagement_rate: eng }), cfg)
    expect(cost_min).toBe(1_200)
    expect(cost_max).toBe(1_800)
  })

  it('20 k views produces expected exact cost', () => {
    const { cost_min, cost_max } = cpmPricer.price(base({ avg_views: 20_000, engagement_rate: eng }), cfg)
    expect(cost_min).toBe(4_800)
    expect(cost_max).toBe(7_200)
  })

  it('50 k views produces expected exact cost', () => {
    const { cost_min, cost_max } = cpmPricer.price(base({ avg_views: 50_000, engagement_rate: eng }), cfg)
    expect(cost_min).toBe(12_000)
    expect(cost_max).toBe(18_000)
  })

  it('higher avg_views strictly increases cost_min and cost_max', () => {
    const low  = cpmPricer.price(base({ avg_views: 5_000,  engagement_rate: eng }), cfg)
    const mid  = cpmPricer.price(base({ avg_views: 20_000, engagement_rate: eng }), cfg)
    const high = cpmPricer.price(base({ avg_views: 50_000, engagement_rate: eng }), cfg)
    expect(low.cost_min).toBeLessThan(mid.cost_min)
    expect(mid.cost_min).toBeLessThan(high.cost_min)
    expect(low.cost_max).toBeLessThan(mid.cost_max)
    expect(mid.cost_max).toBeLessThan(high.cost_max)
  })
})

describe('cpmPricer – monotonicity by engagement_rate', () => {
  // micro tier, 20k views; only engagement_rate varies
  it('lower engagement produces a lower cost than average', () => {
    const low = cpmPricer.price(base({ avg_views: 20_000, engagement_rate: 0.02 }), cfg)
    const avg = cpmPricer.price(base({ avg_views: 20_000, engagement_rate: cfg.tierAvgEng.micro }), cfg)
    expect(low.cost_min).toBeLessThan(avg.cost_min)
    expect(low.cost_max).toBeLessThan(avg.cost_max)
  })

  it('higher engagement produces a higher cost than average', () => {
    const avg  = cpmPricer.price(base({ avg_views: 20_000, engagement_rate: cfg.tierAvgEng.micro }), cfg)
    const high = cpmPricer.price(base({ avg_views: 20_000, engagement_rate: 0.1 }), cfg)
    expect(avg.cost_min).toBeLessThan(high.cost_min)
    expect(avg.cost_max).toBeLessThan(high.cost_max)
  })

  it('cost plateaus once the multiplier hits the 2.5 ceiling', () => {
    // eng=0.5 and eng=0.7 both saturate the multiplier at 2.5 for micro
    const a = cpmPricer.price(base({ avg_views: 20_000, engagement_rate: 0.5 }), cfg)
    const b = cpmPricer.price(base({ avg_views: 20_000, engagement_rate: 0.7 }), cfg)
    expect(a.cost_min).toBe(b.cost_min)
    expect(a.cost_max).toBe(b.cost_max)
  })
})

// ---------------------------------------------------------------------------
// CPM pricer — spread symmetry
// ---------------------------------------------------------------------------
describe('cpmPricer – spread symmetry', () => {
  // For a non-floor-clamped creator the ratio cost_max/cost_min should equal
  // (1 + spread) / (1 − spread) = 1.2/0.8 = 1.5 (up to rounding of ~1 INR).
  it('cost_max / cost_min ≈ (1+spread)/(1−spread) = 1.5 for a mid-range micro', () => {
    // 20k views, avg eng → mid=6000, min=4800, max=7200, ratio=1.5 exactly
    const { cost_min, cost_max } = cpmPricer.price(
      base({ avg_views: 20_000, engagement_rate: cfg.tierAvgEng.micro }), cfg,
    )
    const expected = (1 + cfg.spread) / (1 - cfg.spread) // 1.5
    expect(cost_max / cost_min).toBeCloseTo(expected, 1)
  })

  it('cost_max always > cost_min regardless of tier', () => {
    for (const s of [nano(), base(), macro()]) {
      const { cost_min, cost_max } = cpmPricer.price(s, cfg)
      expect(cost_min).toBeLessThan(cost_max)
    }
  })
})

// ---------------------------------------------------------------------------
// Weighted pricer — monotonicity & band
// ---------------------------------------------------------------------------
describe('weightedPricer – monotonicity and band', () => {
  it('increasing followers (same tier, same other signals) does not decrease cost_min', () => {
    // Both are micro (10k–99k followers); follower weight=0.02 is small but non-zero
    const low  = weightedPricer.price(base({ followers: 15_000 }), cfg)
    const high = weightedPricer.price(base({ followers: 40_000 }), cfg)
    expect(high.cost_min).toBeGreaterThanOrEqual(low.cost_min)
  })

  it('cost for a typical micro is within tier band scaled by spread', () => {
    const { cost_min, cost_max } = weightedPricer.price(base(), cfg)
    const [lo, hi] = cfg.tierBands.micro
    // cost_min must be at least MIN_FLOOR; cost_max should not wildly exceed hi*(1+spread)
    expect(cost_min).toBeGreaterThanOrEqual(MIN_FLOOR)
    expect(cost_max).toBeLessThanOrEqual(hi * (1 + cfg.spread) + 1)
  })

  it('cost_min < cost_max for nano, micro, macro', () => {
    for (const s of [nano(), base(), macro()]) {
      const { cost_min, cost_max } = weightedPricer.price(s, cfg)
      expect(cost_min).toBeLessThan(cost_max)
    }
  })
})

// ---------------------------------------------------------------------------
// tierFlat pricer — exact values & band behaviour
// ---------------------------------------------------------------------------
describe('tierFlatPricer – exact values at median engagement', () => {
  // nano: perf = eng/(avgEng*2) = 0.06/(0.12) = 0.5
  // mid = 1500 + 7500*0.5 = 5250
  // min = max(500, round(5250*0.85)) = 4463, max = round(5250*1.2) = 6300
  it('nano at median engagement produces expected cost band', () => {
    const { cost_min, cost_max } = tierFlatPricer.price(nano({ engagement_rate: 0.06 }), cfg)
    expect(cost_min).toBe(4_463)
    expect(cost_max).toBe(6_300)
  })

  // micro: perf = 0.045/(0.09) = 0.5
  // mid = 12000 + 48000*0.5 = 36000
  // min = max(500, round(36000*0.85)) = 30600, max = round(36000*1.2) = 43200
  it('micro at median engagement produces expected cost band', () => {
    const { cost_min, cost_max } = tierFlatPricer.price(base({ engagement_rate: 0.045 }), cfg)
    expect(cost_min).toBe(30_600)
    expect(cost_max).toBe(43_200)
  })

  // macro: perf = 0.03/(0.06) = 0.5
  // mid = 90000 + 510000*0.5 = 345000
  // min = max(500, round(345000*0.85)) = 293250, max = round(345000*1.2) = 414000
  it('macro at median engagement produces expected cost band', () => {
    const { cost_min, cost_max } = tierFlatPricer.price(macro({ engagement_rate: 0.03 }), cfg)
    expect(cost_min).toBe(293_250)
    expect(cost_max).toBe(414_000)
  })
})

describe('tierFlatPricer – high engagement pushes toward upper band', () => {
  // nano at eng=0.12 → perf=1 → mid=9000 → min=7650, max=10800
  // nano at eng=0.06 → perf=0.5 → mid=5250 → min=4463, max=6300
  it('very high nano engagement reaches top of tier band', () => {
    const { cost_min, cost_max } = tierFlatPricer.price(nano({ engagement_rate: 0.12 }), cfg)
    expect(cost_min).toBe(7_650)
    expect(cost_max).toBe(10_800)
  })

  it('high engagement nano costs more than median engagement nano', () => {
    const median = tierFlatPricer.price(nano({ engagement_rate: 0.06 }), cfg)
    const high   = tierFlatPricer.price(nano({ engagement_rate: 0.12 }), cfg)
    expect(high.cost_min).toBeGreaterThan(median.cost_min)
    expect(high.cost_max).toBeGreaterThan(median.cost_max)
  })
})

describe('tierFlatPricer – floor behaviour at zero engagement', () => {
  // nano eng=0 → perf=0 → mid=1500 → min=max(500,1275)=1275, max=max(1800,1000)=1800
  it('nano at zero engagement stays above MIN_FLOOR and min < max', () => {
    const { cost_min, cost_max } = tierFlatPricer.price(nano({ engagement_rate: 0 }), cfg)
    expect(cost_min).toBeGreaterThanOrEqual(MIN_FLOOR)
    expect(cost_min).toBe(1_275)
    expect(cost_max).toBe(1_800)
    expect(cost_min).toBeLessThan(cost_max)
  })
})

// ---------------------------------------------------------------------------
// getPricer — registry & fallback
// ---------------------------------------------------------------------------
describe('getPricer – registry', () => {
  it('returns the cpm pricer for "cpm"', () => {
    const pricer = getPricer('cpm')
    const direct = cpmPricer.price(base(), cfg)
    const via    = pricer.price(base(), cfg)
    expect(via.cost_min).toBe(direct.cost_min)
    expect(via.cost_max).toBe(direct.cost_max)
  })

  it('returns the weighted pricer for "weighted"', () => {
    const pricer = getPricer('weighted')
    const direct = weightedPricer.price(base(), cfg)
    const via    = pricer.price(base(), cfg)
    expect(via.cost_min).toBe(direct.cost_min)
    expect(via.cost_max).toBe(direct.cost_max)
  })

  it('returns the tier_flat pricer for "tier_flat"', () => {
    const pricer = getPricer('tier_flat')
    const direct = tierFlatPricer.price(base(), cfg)
    const via    = pricer.price(base(), cfg)
    expect(via.cost_min).toBe(direct.cost_min)
    expect(via.cost_max).toBe(direct.cost_max)
  })

  it('different models produce different costs for the same creator', () => {
    const c = cpmPricer.price(base(), cfg).cost_min
    const w = weightedPricer.price(base(), cfg).cost_min
    const t = tierFlatPricer.price(base(), cfg).cost_min
    // All three use different formulas; at least two must differ
    expect(new Set([c, w, t]).size).toBeGreaterThan(1)
  })

  it('falls back to cpm pricer for an unknown model string', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pricer = getPricer('unknown_model' as any)
    const cpmResult      = cpmPricer.price(base(), cfg)
    const fallbackResult = pricer.price(base(), cfg)
    expect(fallbackResult.cost_min).toBe(cpmResult.cost_min)
    expect(fallbackResult.cost_max).toBe(cpmResult.cost_max)
  })
})

// ---------------------------------------------------------------------------
// Robustness — unusual / adversarial inputs
// ---------------------------------------------------------------------------
describe('robustness – negative followers', () => {
  // getTier treats negative followers as 'nano' (< 10 000).
  // With avg_views provided and > 0, views are used directly.
  it('cpm: negative followers with valid views does not throw; yields sane costs', () => {
    // tier=nano, views=10000, base=(10/1)*150=1500
    // engMult = 1+4*(0.04−0.06) = 0.92
    // mid = max(750, 1380) = 1380, min=max(500,1104)=1104, max=1656
    const { cost_min, cost_max } = cpmPricer.price(
      base({ followers: -5_000, avg_views: 10_000, engagement_rate: 0.04 }), cfg,
    )
    expect(cost_min).toBe(1_104)
    expect(cost_max).toBe(1_656)
    expect(cost_min).toBeGreaterThan(0)
    expect(cost_min).toBeLessThan(cost_max)
  })

  it('weighted: negative followers does not throw and yields cost_min > 0', () => {
    const { cost_min, cost_max } = weightedPricer.price(
      base({ followers: -1_000 }), cfg,
    )
    expect(cost_min).toBeGreaterThan(0)
    expect(cost_min).toBeLessThan(cost_max)
  })
})

describe('robustness – negative avg_views', () => {
  // cpm falls back to Math.max(followers * 0.4, 500) when avg_views <= 0.
  // Negative avg_views triggers the same fallback as zero.
  it('cpm: negative avg_views uses fallback (followers*0.4) and produces valid cost', () => {
    const withNeg  = cpmPricer.price(base({ avg_views: -100 }), cfg)
    const withZero = cpmPricer.price(base({ avg_views: 0    }), cfg)
    expect(withNeg.cost_min).toBe(withZero.cost_min)
    expect(withNeg.cost_max).toBe(withZero.cost_max)
    expect(withNeg.cost_min).toBeGreaterThan(0)
  })
})

describe('robustness – NaN avg_views', () => {
  // NaN > 0 evaluates to false, so the fallback path (followers * 0.4) is taken.
  it('cpm: NaN avg_views triggers the same fallback as zero and produces valid cost', () => {
    const withNaN  = cpmPricer.price(base({ avg_views: NaN }), cfg)
    const withZero = cpmPricer.price(base({ avg_views: 0   }), cfg)
    expect(withNaN.cost_min).toBe(withZero.cost_min)
    expect(withNaN.cost_max).toBe(withZero.cost_max)
    expect(withNaN.cost_min).toBeGreaterThan(0)
  })
})

describe('robustness – NaN engagement_rate [BUG]', () => {
  /**
   * BUG: NaN engagement_rate propagates through engagementMultiplier because
   *   Math.max(0.4, NaN) === NaN  (IEEE-754: comparisons with NaN are false,
   *   so Math.max/min return NaN).
   * Consequently mid = Math.max(MIN_FLOOR*1.5, base * NaN) = NaN,
   * and both cost_min and cost_max become NaN — violating the ≥ MIN_FLOOR invariant.
   * The weighted and tier_flat pricers have the same NaN-propagation issue.
   *
   * Recommended fix: clamp/default engagement_rate to 0 at the top of each pricer
   * or inside engagementMultiplier.
   *
   * These assertions document the ACTUAL (broken) behaviour so CI catches a fix.
   */
  it('cpm: NaN engagement_rate produces NaN cost_min and cost_max [BUG]', () => {
    const { cost_min, cost_max } = cpmPricer.price(base({ engagement_rate: NaN }), cfg)
    // BUG: expected >0; actual NaN
    expect(Number.isNaN(cost_min)).toBe(true)
    expect(Number.isNaN(cost_max)).toBe(true)
  })

  it('weighted: NaN engagement_rate produces NaN costs [BUG]', () => {
    const { cost_min, cost_max } = weightedPricer.price(base({ engagement_rate: NaN }), cfg)
    expect(Number.isNaN(cost_min)).toBe(true)
    expect(Number.isNaN(cost_max)).toBe(true)
  })

  it('tier_flat: NaN engagement_rate produces NaN costs [BUG]', () => {
    const { cost_min, cost_max } = tierFlatPricer.price(base({ engagement_rate: NaN }), cfg)
    expect(Number.isNaN(cost_min)).toBe(true)
    expect(Number.isNaN(cost_max)).toBe(true)
  })
})

describe('robustness – very large followers (macro-scale)', () => {
  it('cpm: 10M followers produces valid, positive, ordered cost', () => {
    const { cost_min, cost_max } = cpmPricer.price(
      macro({ followers: 10_000_000, avg_views: 2_000_000 }), cfg,
    )
    expect(cost_min).toBeGreaterThan(MIN_FLOOR)
    expect(cost_min).toBeLessThan(cost_max)
  })

  it('weighted: 10M followers stays within macro band scaled by spread', () => {
    const { cost_min, cost_max } = weightedPricer.price(
      macro({ followers: 10_000_000 }), cfg,
    )
    const [, hi] = cfg.tierBands.macro
    expect(cost_min).toBeGreaterThan(0)
    expect(cost_max).toBeLessThanOrEqual(hi * (1 + cfg.spread) + 1) // norm saturates near 1
  })
})
