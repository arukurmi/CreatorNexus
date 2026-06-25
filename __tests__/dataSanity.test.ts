import { describe, it, expect } from 'vitest'
import { MOCK_INFLUENCERS } from '../lib/mockData'
import { allocateBudget } from '../lib/allocateBudget'

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

  it('Max Reach exhausts most of a ₹50k pets budget', () => {
    const pets = MOCK_INFLUENCERS.filter((i) => i.niche === 'pets')
    const r = allocateBudget(pets, 50000, { strategy: 'reach' })
    expect(r.total_projected_spend).toBeGreaterThan(35000)
    expect(r.total_projected_spend).toBeLessThanOrEqual(50000)
  })
})
