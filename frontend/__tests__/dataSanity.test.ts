import { describe, it, expect } from 'vitest'
import { MOCK_INFLUENCERS } from '../lib/mockData'

describe('mock dataset sanity', () => {
  it('has valid finite cost ranges for every creator', () => {
    const bad = MOCK_INFLUENCERS.filter(
      (i) =>
        !Number.isFinite(i.cost_min) ||
        !Number.isFinite(i.cost_max) ||
        i.cost_min > i.cost_max
    )
    expect(bad).toHaveLength(0)
  })

  it('has 20 creators in every niche', () => {
    const niches = new Set(MOCK_INFLUENCERS.map((i) => i.niche))
    for (const n of niches) {
      expect(MOCK_INFLUENCERS.filter((i) => i.niche === n)).toHaveLength(20)
    }
  })
})
