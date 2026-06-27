import { describe, it, expect, vi } from 'vitest'
import { RapidApiProvider } from '../src/services/rapidapi/RapidApiProvider.js'
import { REAL_HANDLES } from '../src/services/rapidapi/handles.js'

// instagram-scraper-api2 shapes: /v1/info returns { data: {...} }, /v1/posts returns { data: { items: [...] } }
const infoResp = {
  data: { username: 'styledaily', profile_pic_url: 'http://x/y.jpg', follower_count: 54000 },
}
const postsResp = {
  data: {
    items: [
      { like_count: 2600, comment_count: 110, play_count: 30000 },
      { like_count: 2400, comment_count: 90, play_count: 26000 },
    ],
  },
}

function router(overrides: { failInfoFor?: string } = {}) {
  return vi.fn(async (url: string) => {
    if (overrides.failInfoFor && url.includes('/v1/info') && url.includes(overrides.failInfoFor)) {
      return { ok: false, status: 404 } as Response
    }
    if (url.includes('/v1/info')) return { ok: true, json: async () => infoResp } as unknown as Response
    return { ok: true, json: async () => postsResp } as unknown as Response
  })
}

describe('RapidApiProvider (instagram-scraper-api2)', () => {
  it('maps info + posts to RawCreatorSignals', async () => {
    const p = new RapidApiProvider({ key: 'k', host: 'h', fetchFn: router() })
    const list = await p.getByNiche('fashion')
    expect(list).toHaveLength(REAL_HANDLES.fashion.length)
    const c = list[0]
    expect(c.handle).toBe('styledaily')
    expect(c.followers).toBe(54000)
    expect(c.avg_likes).toBe(2500) // (2600+2400)/2
    expect(c.avg_comments).toBe(100) // (110+90)/2
    expect(c.avg_views).toBe(28000) // (30000+26000)/2
    expect(c.engagement_rate).toBeCloseTo((2500 + 100) / 54000, 4)
    expect(c.niche).toBe('fashion')
  })

  it('also reads fields when the product does NOT wrap in `data`', async () => {
    const flat = vi.fn(async (url: string) => {
      if (url.includes('/v1/info')) {
        return { ok: true, json: async () => ({ username: 'flatuser', follower_count: 10000 }) } as unknown as Response
      }
      return { ok: true, json: async () => ({ items: [{ like_count: 300, comment_count: 20, play_count: 5000 }] }) } as unknown as Response
    })
    const p = new RapidApiProvider({ key: 'k', host: 'h', fetchFn: flat })
    const list = await p.getByNiche('tech')
    expect(list[0].handle).toBe('flatuser')
    expect(list[0].followers).toBe(10000)
    expect(list[0].avg_likes).toBe(300)
  })

  it('skips a handle whose info request fails, keeps the rest', async () => {
    const target = REAL_HANDLES.fashion[0].handle
    const p = new RapidApiProvider({ key: 'k', host: 'h', fetchFn: router({ failInfoFor: target }) })
    const list = await p.getByNiche('fashion')
    expect(list).toHaveLength(REAL_HANDLES.fashion.length - 1)
  })

  it('degrades engagement to heuristics when posts are unavailable', async () => {
    const infoOnly = vi.fn(async (url: string) => {
      if (url.includes('/v1/info')) return { ok: true, json: async () => infoResp } as unknown as Response
      return { ok: false, status: 500 } as Response // posts unavailable
    })
    const p = new RapidApiProvider({ key: 'k', host: 'h', fetchFn: infoOnly })
    const list = await p.getByNiche('fashion')
    expect(list[0].followers).toBe(54000)
    expect(list[0].avg_likes).toBeGreaterThan(0)
    expect(list[0].avg_views).toBeGreaterThan(0)
    expect(list[0].engagement_rate).toBeGreaterThan(0)
  })

  it('returns [] (never throws) when info JSON is malformed', async () => {
    const bad = vi.fn(async () => ({ ok: true, json: async () => { throw new Error('bad json') } }) as unknown as Response)
    const p = new RapidApiProvider({ key: 'k', host: 'h', fetchFn: bad })
    await expect(p.getByNiche('fashion')).resolves.toEqual([])
  })
})
