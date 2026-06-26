import { describe, it, expect } from 'vitest'
import { GeneratedProvider } from '../src/services/rapidapi/GeneratedProvider'
import { getTier } from '../src/lib/tier'

describe('GeneratedProvider', () => {
  const p = new GeneratedProvider()

  it('is deterministic across calls', async () => {
    const a = await p.getByNiche('fashion')
    const b = await p.getByNiche('fashion')
    expect(a).toEqual(b)
  })

  it('returns tier-consistent, valid signals for every niche', async () => {
    for (const niche of ['pets','tech','comedy'] as const) {
      const list = await p.getByNiche(niche)
      expect(list.length).toBeGreaterThanOrEqual(15)
      for (const c of list) {
        expect(c.niche).toBe(niche)
        expect(c.followers).toBeGreaterThan(0)
        expect(c.engagement_rate).toBeGreaterThan(0)
        expect(c.avg_views).toBeGreaterThan(0)
        // a creator's followers must map to a real tier bracket
        expect(['nano','micro','macro']).toContain(getTier(c.followers))
      }
    }
  })

  it('spans all three tiers', async () => {
    const list = await p.getByNiche('food')
    const tiers = new Set(list.map((c) => getTier(c.followers)))
    expect(tiers).toEqual(new Set(['nano','micro','macro']))
  })
})
