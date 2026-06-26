import { describe, it, expect, vi } from 'vitest'
import { RapidApiProvider } from '../src/services/rapidapi/RapidApiProvider.js'

const sampleProfile = {
  username: 'styledaily', profile_pic_url: 'http://x/y.jpg',
  edge_followed_by: { count: 54000 },
  recent_posts: [
    { like_count: 2600, comment_count: 110, view_count: 30000 },
    { like_count: 2400, comment_count: 90, view_count: 26000 },
  ],
}

describe('RapidApiProvider', () => {
  it('maps vendor payload to RawCreatorSignals', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true, json: async () => sampleProfile,
    } as Response)
    const p = new RapidApiProvider({ key: 'k', host: 'h', fetchFn })
    const list = await p.getByNiche('fashion')
    expect(list[0].handle).toBe('styledaily')
    expect(list[0].followers).toBe(54000)
    expect(list[0].avg_likes).toBe(2500)             // (2600+2400)/2
    expect(list[0].avg_comments).toBe(100)           // (110+90)/2
    expect(list[0].avg_views).toBe(28000)            // (30000+26000)/2
    expect(list[0].engagement_rate).toBeCloseTo((2500 + 100) / 54000, 4)
    expect(list[0].niche).toBe('fashion')
  })

  it('skips handles whose fetch fails, never throws', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      .mockResolvedValue({ ok: true, json: async () => sampleProfile } as Response)
    const p = new RapidApiProvider({ key: 'k', host: 'h', fetchFn })
    const list = await p.getByNiche('fashion')
    expect(Array.isArray(list)).toBe(true)
  })

  it('handles malformed JSON by skipping the creator', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true, json: async () => { throw new Error('bad json') },
    } as unknown as Response)
    const p = new RapidApiProvider({ key: 'k', host: 'h', fetchFn })
    await expect(p.getByNiche('fashion')).resolves.toEqual([])
  })
})
