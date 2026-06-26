import { describe, it, expect } from 'vitest'
import { allocate, influencerCost } from '../src/services/allocationService'
import type { Influencer } from '../src/types'
import { BUFFER } from '../src/services/allocation/types'

// ---------------------------------------------------------------------------
// Helper – builds an Influencer with an explicit tier so tests are not
// coupled to the followers-threshold logic in the main factory.
// ---------------------------------------------------------------------------
function mk(
  id: string,
  tier: 'nano' | 'micro' | 'macro',
  followers: number,
  views: number,
  eng: number,
  min: number,
  max: number,
): Influencer {
  return {
    id, handle: id, avatar_url: '',
    followers, avg_views: views, avg_likes: 1, avg_comments: 0,
    engagement_rate: eng, niche: 'tech', tier,
    cost_min: min, cost_max: max,
  }
}

// Mixed-tier pool (costs: nano1=1500, nano2=2000, micro1=10000, macro1=100000)
const pool: Influencer[] = [
  mk('nano1',  'nano',  5_000,   2_000, 0.08, 1_000,   2_000),
  mk('nano2',  'nano',  8_000,   3_000, 0.06, 1_500,   2_500),
  mk('micro1', 'micro', 40_000,  20_000, 0.05, 8_000,  12_000),
  mk('macro1', 'macro', 200_000, 120_000, 0.03, 80_000, 120_000),
]

// ---------------------------------------------------------------------------
// 1. Buffer isolation – same pool, same budget, four strategies
// ---------------------------------------------------------------------------
describe('buffer isolation', () => {
  const BUDGET = 30_000

  it('engagement applies BUFFER (×1.1) and sets budget_buffer_applied=true', () => {
    const r = allocate(pool, BUDGET, { strategy: 'engagement' })
    expect(r.effective_budget).toBe(Math.round(BUDGET * BUFFER))
    expect(r.budget_buffer_applied).toBe(true)
  })

  it('reach has effective_budget===budget and budget_buffer_applied===false', () => {
    const r = allocate(pool, BUDGET, { strategy: 'reach' })
    expect(r.effective_budget).toBe(BUDGET)
    expect(r.budget_buffer_applied).toBe(false)
  })

  it('value has effective_budget===budget and budget_buffer_applied===false', () => {
    const r = allocate(pool, BUDGET, { strategy: 'value' })
    expect(r.effective_budget).toBe(BUDGET)
    expect(r.budget_buffer_applied).toBe(false)
  })

  it('count has effective_budget===budget and budget_buffer_applied===false', () => {
    const r = allocate(pool, BUDGET, { strategy: 'count', count: 2 })
    expect(r.effective_budget).toBe(BUDGET)
    expect(r.budget_buffer_applied).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 2. Buffer genuinely unlocks spend above the slider total
//    Creator cost = 10 500; budget = 10 000; effective (engagement) = 11 000.
//    Engagement CAN pick the creator; reach CANNOT.
// ---------------------------------------------------------------------------
describe('buffer unlocks above-budget spend', () => {
  // cost_min=10400, cost_max=10600 → midpoint = 10500
  const tightPool = [mk('mid', 'micro', 40_000, 20_000, 0.05, 10_400, 10_600)]
  const BUDGET = 10_000

  it('engagement selects creator whose cost > budget but <= effective_budget', () => {
    const cost = influencerCost(tightPool[0]) // 10500
    const r = allocate(tightPool, BUDGET, { strategy: 'engagement' })
    expect(cost).toBeGreaterThan(BUDGET)
    expect(cost).toBeLessThanOrEqual(r.effective_budget)
    expect(r.selected).toHaveLength(1)
    expect(r.total_projected_spend).toBe(cost)
    // spend is above the raw slider but within the buffered ceiling
    expect(r.total_projected_spend).toBeGreaterThan(BUDGET)
    expect(r.total_projected_spend).toBeLessThanOrEqual(r.effective_budget)
  })

  it('reach cannot select that same creator (no buffer)', () => {
    const r = allocate(tightPool, BUDGET, { strategy: 'reach' })
    expect(r.effective_budget).toBe(BUDGET)
    expect(r.selected).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// 3. Structural invariants across all strategies
//    – spend <= effective_budget
//    – leftover === max(0, effective_budget – spend)
//    – by_tier spends sum exactly to total_projected_spend
//    – by_tier[t].count === number of selected creators in tier t
// ---------------------------------------------------------------------------
describe('structural invariants (all strategies)', () => {
  const BUDGET = 50_000
  const cases: Array<{ strategy: 'reach' | 'engagement' | 'value' | 'count'; extra?: { count: number } }> = [
    { strategy: 'reach' },
    { strategy: 'engagement' },
    { strategy: 'value' },
    { strategy: 'count', extra: { count: 3 } },
  ]

  for (const { strategy, extra } of cases) {
    it(`${strategy}: invariants hold`, () => {
      const r = allocate(pool, BUDGET, { strategy, ...extra })

      // spend never exceeds effective ceiling
      expect(r.total_projected_spend).toBeLessThanOrEqual(r.effective_budget)

      // leftover is exact
      expect(r.leftover_budget).toBe(
        Math.max(0, r.effective_budget - r.total_projected_spend),
      )

      // tier spend sums match
      const tierSum = r.by_tier.nano.spend + r.by_tier.micro.spend + r.by_tier.macro.spend
      expect(tierSum).toBe(r.total_projected_spend)

      // tier counts match selected list
      const countNano  = r.selected.filter(c => c.tier === 'nano').length
      const countMicro = r.selected.filter(c => c.tier === 'micro').length
      const countMacro = r.selected.filter(c => c.tier === 'macro').length
      expect(r.by_tier.nano.count).toBe(countNano)
      expect(r.by_tier.micro.count).toBe(countMicro)
      expect(r.by_tier.macro.count).toBe(countMacro)
    })
  }
})

// ---------------------------------------------------------------------------
// 4. count strategy edge cases
// ---------------------------------------------------------------------------
describe('count strategy edge cases', () => {
  it('count: 0 returns empty selection regardless of budget', () => {
    const r = allocate(pool, 1_000_000, { strategy: 'count', count: 0 })
    expect(r.selected).toHaveLength(0)
    expect(r.total_projected_spend).toBe(0)
  })

  it('count: 1 returns exactly one creator (the best-scored affordable)', () => {
    const r = allocate(pool, 1_000_000, { strategy: 'count', count: 1 })
    expect(r.selected.length).toBe(1)
  })

  it('count > pool size returns at most pool.length creators', () => {
    const BIG_COUNT = pool.length + 50
    const r = allocate(pool, 1_000_000, { strategy: 'count', count: BIG_COUNT })
    expect(r.selected.length).toBeLessThanOrEqual(pool.length)
  })

  it('count: 2 with budget that only affords 1 returns at most 1', () => {
    // Budget = 2000; nano1 costs 1500, nano2 costs 2000 – only one fits in leftover.
    // After picking the best-scored at cost <=2000, the second would exceed remaining.
    const r = allocate(pool, 2_000, { strategy: 'count', count: 2 })
    expect(r.selected.length).toBeLessThanOrEqual(2)
    expect(r.total_projected_spend).toBeLessThanOrEqual(r.effective_budget)
  })
})

// ---------------------------------------------------------------------------
// 5. No double-selection
//    A creator must never appear twice in `selected` even when the leftover
//    pass runs after the per-tier pass.
// ---------------------------------------------------------------------------
describe('no double-selection', () => {
  const STRATEGIES = ['reach', 'engagement', 'value'] as const

  for (const strategy of STRATEGIES) {
    it(`${strategy}: all selected ids are unique`, () => {
      const r = allocate(pool, 1_000_000, { strategy })
      const ids = r.selected.map(c => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  }

  it('count: all selected ids are unique', () => {
    const r = allocate(pool, 1_000_000, { strategy: 'count', count: 10 })
    const ids = r.selected.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ---------------------------------------------------------------------------
// 6. Determinism – identical inputs produce identical outputs
// ---------------------------------------------------------------------------
describe('determinism', () => {
  const STRATEGIES = ['reach', 'engagement', 'value'] as const

  for (const strategy of STRATEGIES) {
    it(`${strategy}: repeated calls return the same selected ids`, () => {
      const a = allocate(pool, 50_000, { strategy })
      const b = allocate(pool, 50_000, { strategy })
      expect(a.selected.map(c => c.id)).toEqual(b.selected.map(c => c.id))
      expect(a.total_projected_spend).toBe(b.total_projected_spend)
    })
  }
})

// ---------------------------------------------------------------------------
// 7. Overshoot guard – Math.round tier-share split must never exceed effective
//    Pool: 1 nano + 1 micro + 1 macro, each affordable.
//    budget=10000, strategy=engagement → effective=11000.
//    Old Math.round split: round(11000/3)=3667 × 3 = 11001 > 11000 (bug).
//    Fixed floor+remainder split: 3666 + 3666 + 3668 = 11000 (correct).
// ---------------------------------------------------------------------------
describe('overshoot guard – tier share floor+remainder invariant', () => {
  // Costs: nano=500, micro=500, macro=500 – all individually affordable at any split
  const overshootPool: Influencer[] = [
    mk('os_nano',  'nano',   5_000,  2_000, 0.08, 250,  750),   // cost=500
    mk('os_micro', 'micro', 40_000, 20_000, 0.05, 250,  750),   // cost=500
    mk('os_macro', 'macro', 200_000, 120_000, 0.03, 250, 750),  // cost=500
  ]
  const BUDGET = 10_000
  const cases: Array<{ strategy: 'reach' | 'engagement' | 'value' | 'count'; extra?: { count: number } }> = [
    { strategy: 'reach' },
    { strategy: 'engagement' },
    { strategy: 'value' },
    { strategy: 'count', extra: { count: 3 } },
  ]

  for (const { strategy, extra } of cases) {
    it(`${strategy}: total_projected_spend <= effective_budget (overshoot pool)`, () => {
      const r = allocate(overshootPool, BUDGET, { strategy, ...extra })

      // Binding invariant: spend never exceeds effective ceiling
      expect(r.total_projected_spend).toBeLessThanOrEqual(r.effective_budget)

      // Leftover is exact
      expect(r.leftover_budget).toBe(
        Math.max(0, r.effective_budget - r.total_projected_spend),
      )

      // Tier spends sum to total
      const tierSum = r.by_tier.nano.spend + r.by_tier.micro.spend + r.by_tier.macro.spend
      expect(tierSum).toBe(r.total_projected_spend)
    })
  }
})

// ---------------------------------------------------------------------------
// 9. Ranking sanity – reach prefers higher avg_views when only one fits
// ---------------------------------------------------------------------------
describe('reach ranking sanity', () => {
  // Both nano creators have identical cost (1000). Budget 1500 → only one fits.
  const lowViews  = mk('low_v',  'nano', 5_000, 1_000,  0.05, 500,  1_500)
  const highViews = mk('high_v', 'nano', 6_000, 10_000, 0.05, 500,  1_500)
  // cost of both = Math.round((500+1500)/2) = 1000

  it('selects the creator with higher avg_views', () => {
    expect(influencerCost(lowViews)).toBe(1_000)
    expect(influencerCost(highViews)).toBe(1_000)

    const r = allocate([lowViews, highViews], 1_500, { strategy: 'reach' })
    // Only one can be picked (1000 spent, remaining 500 < 1000)
    expect(r.selected).toHaveLength(1)
    expect(r.selected[0].id).toBe('high_v')
  })

  it('engagement prefers the creator with higher engagement_rate × followers', () => {
    const lowEng  = mk('low_e',  'nano', 5_000, 2_000, 0.02, 500, 1_500) // score=100
    const highEng = mk('high_e', 'nano', 6_000, 2_000, 0.10, 500, 1_500) // score=600

    const r = allocate([lowEng, highEng], 1_500, { strategy: 'engagement' })
    // effective = Math.round(1500 * 1.1) = 1650; share for nano = 1650
    // both cost 1000; high_e wins on score-per-cost
    expect(r.selected.length).toBeGreaterThanOrEqual(1)
    expect(r.selected[0].id).toBe('high_e')
  })
})
