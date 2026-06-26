import { describe, it, expect, vi } from 'vitest'
import { allocateViaApi } from '../lib/api'

describe('allocateViaApi', () => {
  it('POSTs to /api/allocate with bearer token and returns body', async () => {
    const json = { selected: [], total_projected_spend: 0, budget_buffer_applied: false }
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => json })
    const res = await allocateViaApi(
      { budget: 1000, niche: 'tech', strategy: 'reach' }, 'tok',
      { base: 'http://x', fetchFn },
    )
    expect(fetchFn).toHaveBeenCalledWith('http://x/api/allocate', expect.objectContaining({
      method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
      body: JSON.stringify({ budget: 1000, niche: 'tech', strategy: 'reach' }),
    }))
    expect(res).toEqual(json)
  })

  it('throws when response is not ok', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 401 })
    await expect(
      allocateViaApi({ budget: 500, niche: 'food', strategy: 'value' }, 'bad', {
        base: 'http://x',
        fetchFn,
      }),
    ).rejects.toThrow('allocate failed: 401')
  })

  it('includes count in body for count strategy and returns parsed JSON', async () => {
    const json = { selected: [], total_projected_spend: 0, budget_buffer_applied: false }
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => json })
    const res = await allocateViaApi(
      { budget: 5000, niche: 'food', strategy: 'count', count: 3 }, 'tok',
      { base: 'http://x', fetchFn },
    )
    expect(fetchFn).toHaveBeenCalledWith('http://x/api/allocate', expect.objectContaining({
      body: JSON.stringify({ budget: 5000, niche: 'food', strategy: 'count', count: 3 }),
    }))
    expect(res).toEqual(json)
  })
})
