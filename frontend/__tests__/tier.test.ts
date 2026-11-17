import { describe, it, expect } from 'vitest'
import { getTier, TIER_META, TIER_ORDER, tierSpendRows } from '../lib/tier'
import type { Tier } from '../lib/types'

describe('getTier', () => {
  it('classifies follower bracket boundaries', () => {
    expect(getTier(0)).toBe('nano')
    expect(getTier(9_999)).toBe('nano')
    expect(getTier(10_000)).toBe('micro')
    expect(getTier(99_999)).toBe('micro')
    expect(getTier(100_000)).toBe('macro')
    expect(getTier(2_500_000)).toBe('macro')
  })
})

describe('TIER_META / TIER_ORDER', () => {
  const tiers: Tier[] = ['nano', 'micro', 'macro']

  it('orders tiers ascending by reach', () => {
    expect(TIER_ORDER).toEqual(['nano', 'micro', 'macro'])
  })

  it('has metadata for every tier with non-empty display fields', () => {
    for (const t of tiers) {
      const m = TIER_META[t]
      expect(m).toBeTruthy()
      expect(m.label.length).toBeGreaterThan(0)
      expect(m.range.length).toBeGreaterThan(0)
      expect(m.emoji.length).toBeGreaterThan(0)
      expect(m.blurb.length).toBeGreaterThan(0)
      expect(m.badge.length).toBeGreaterThan(0)
      expect(m.band.length).toBeGreaterThan(0)
      expect(m.bar.length).toBeGreaterThan(0)
    }
  })

  it('every getTier output is a valid TIER_META key', () => {
    for (const followers of [500, 50_000, 500_000]) {
      expect(TIER_META[getTier(followers)]).toBeTruthy()
    }
  })
})

describe('tierSpendRows', () => {
  it('returns tiers in TIER_ORDER with their share of total spend', () => {
    const rows = tierSpendRows({
      macro: { count: 1, spend: 20_000 },
      nano: { count: 4, spend: 12_000 },
      micro: { count: 2, spend: 18_000 },
    })
    expect(rows).toEqual([
      { tier: 'nano', count: 4, spend: 12_000, percent: 24 },
      { tier: 'micro', count: 2, spend: 18_000, percent: 36 },
      { tier: 'macro', count: 1, spend: 20_000, percent: 40 },
    ])
  })

  it('keeps rounded percents summing to 100', () => {
    const rows = tierSpendRows({
      nano: { count: 1, spend: 1 },
      micro: { count: 1, spend: 1 },
      macro: { count: 1, spend: 1 },
    })
    expect(rows.reduce((sum, r) => sum + r.percent, 0)).toBe(100)
  })

  it('gives a zero-spend tier 0% and keeps it in the rows', () => {
    const rows = tierSpendRows({
      nano: { count: 3, spend: 15_000 },
      micro: { count: 0, spend: 0 },
      macro: { count: 1, spend: 35_000 },
    })
    expect(rows.map((r) => [r.tier, r.percent])).toEqual([['nano', 30], ['micro', 0], ['macro', 70]])
  })

  it('returns 0% for every tier when total spend is zero', () => {
    const zero = { count: 0, spend: 0 }
    const rows = tierSpendRows({ nano: zero, micro: zero, macro: zero })
    expect(rows.map((r) => r.percent)).toEqual([0, 0, 0])
  })
})
