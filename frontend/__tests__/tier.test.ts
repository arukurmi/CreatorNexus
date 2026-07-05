import { describe, it, expect } from 'vitest'
import { getTier, TIER_META, TIER_ORDER } from '../lib/tier'
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
    }
  })

  it('every getTier output is a valid TIER_META key', () => {
    for (const followers of [500, 50_000, 500_000]) {
      expect(TIER_META[getTier(followers)]).toBeTruthy()
    }
  })
})
