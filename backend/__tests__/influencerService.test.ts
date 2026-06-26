import { describe, it, expect } from 'vitest'
import { getPricedCreators } from '../src/services/influencerService'
import { GeneratedProvider } from '../src/services/rapidapi/GeneratedProvider'
import { getTier } from '../src/lib/tier'

describe('getPricedCreators', () => {
  it('prices every creator with valid range and derived tier', async () => {
    const list = await getPricedCreators('beauty', { provider: new GeneratedProvider() })
    expect(list.length).toBeGreaterThan(0)
    for (const c of list) {
      expect(c.id).toBeTruthy()
      expect(c.tier).toBe(getTier(c.followers))
      expect(c.cost_min).toBeGreaterThan(0)
      expect(c.cost_min).toBeLessThan(c.cost_max)
    }
  })
})
