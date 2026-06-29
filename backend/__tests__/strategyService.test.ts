import { describe, it, expect } from 'vitest'
import { getStrategy } from '../src/services/ai/strategyService.js'
import { GeneratedProvider } from '../src/services/rapidapi/GeneratedProvider.js'
import type { AiAdvisory } from '../src/services/ai/types.js'

// A fake Gemini client that selects the first two candidate ids it is given.
function fakeClient(advisory: Partial<AiAdvisory> = {}) {
  return {
    async generate(prompt: string) {
      const ids = [...prompt.matchAll(/"id":"([^"]+)"/g)].map((m) => m[1]).slice(0, 2)
      const full: AiAdvisory = {
        recommended_niche: 'beauty',
        secondary_niches: ['fashion'],
        tier_mix: { nano: 60, micro: 30, macro: 10 },
        rationale: 'because',
        target_audience: 'gen z',
        content_ideas: ['reel', 'grwm'],
        selected_creator_ids: ids,
        ...advisory,
      }
      return full
    },
  }
}

describe('getStrategy', () => {
  it('returns advisory and maps selected ids to full creators', async () => {
    const res = await getStrategy('Launch a vegan skincare line for Gen Z', {
      client: fakeClient(), provider: new GeneratedProvider(),
    })
    expect(res.advisory.recommended_niche).toBe('beauty')
    expect(res.creators.length).toBe(2)
    expect(res.creators[0].id).toBeTruthy()
    expect(res.creators[0].cost_min).toBeLessThan(res.creators[0].cost_max)
  })

  it('drops selected ids that are not in the candidate pool', async () => {
    const res = await getStrategy('brief text here', {
      client: fakeClient({ selected_creator_ids: ['does-not-exist', 'nope'] }),
      provider: new GeneratedProvider(),
    })
    expect(res.creators).toEqual([])
  })

  it('clamps an unknown recommended niche to a valid one', async () => {
    const res = await getStrategy('brief text here', {
      client: fakeClient({ recommended_niche: 'aliens' }),
      provider: new GeneratedProvider(),
    })
    expect(['pets','fashion','beauty','food','fitness','travel','tech','gaming','parenting','finance','home','sustainability','education','comedy'])
      .toContain(res.advisory.recommended_niche)
  })
})
