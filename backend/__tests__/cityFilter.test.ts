import { describe, it, expect } from 'vitest'
import { getPricedCreators } from '../src/services/influencerService.js'
import { GeneratedProvider } from '../src/services/rapidapi/GeneratedProvider.js'

const provider = () => new GeneratedProvider()

describe('city filter (getPricedCreators)', () => {
  it('returns only creators in the requested city', async () => {
    const all = await getPricedCreators('beauty', { provider: provider() })
    const mumbai = await getPricedCreators('beauty', { provider: provider(), city: 'Mumbai' })
    expect(mumbai.length).toBeGreaterThan(0)
    expect(mumbai.length).toBeLessThan(all.length)
    expect(mumbai.every((c) => c.city === 'Mumbai')).toBe(true)
  })

  it('matches city case-insensitively', async () => {
    const lower = await getPricedCreators('beauty', { provider: provider(), city: 'mumbai' })
    expect(lower.length).toBeGreaterThan(0)
    expect(lower.every((c) => (c.city ?? '').toLowerCase() === 'mumbai')).toBe(true)
  })

  it('returns nothing for a city with no creators', async () => {
    const none = await getPricedCreators('beauty', { provider: provider(), city: 'Atlantis' })
    expect(none).toEqual([])
  })
})
