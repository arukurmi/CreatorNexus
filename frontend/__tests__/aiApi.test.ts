import { describe, it, expect, vi } from 'vitest'
import { getAiStrategy } from '../lib/aiApi'

const result = {
  advisory: {
    recommended_niche: 'fashion',
    secondary_niches: ['beauty'],
    tier_mix: { nano: 3, micro: 2, macro: 1 },
    rationale: 'why',
    target_audience: 'gen z',
    content_ideas: ['reel'],
    selected_creator_ids: ['c1'],
  },
  creators: [],
}

describe('getAiStrategy', () => {
  it('POSTs the brief with a bearer token and returns the parsed body', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => result })
    const res = await getAiStrategy('launch a lipstick', 'tok', { base: 'http://x', fetchFn })
    expect(fetchFn).toHaveBeenCalledWith(
      'http://x/api/ai/strategy',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer tok',
        }),
        body: JSON.stringify({ brief: 'launch a lipstick' }),
      }),
    )
    expect(res).toEqual(result)
  })

  it('forwards an AbortSignal when provided', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => result })
    const signal = new AbortController().signal
    await getAiStrategy('brief', 'tok', { base: 'http://x', fetchFn, signal })
    expect(fetchFn).toHaveBeenCalledWith('http://x/api/ai/strategy', expect.objectContaining({ signal }))
  })

  it('throws an Error carrying the HTTP status when the response is not ok', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 429 })
    await expect(
      getAiStrategy('brief', 'bad', { base: 'http://x', fetchFn }),
    ).rejects.toMatchObject({ message: 'ai strategy failed: 429', status: 429 })
  })
})
