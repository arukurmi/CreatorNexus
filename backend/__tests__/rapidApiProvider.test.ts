import { describe, it, expect, vi } from 'vitest'
import { RapidApiProvider } from '../src/services/rapidapi/RapidApiProvider.js'
import { REAL_HANDLES } from '../src/services/rapidapi/handles.js'

// "Instagram Scraper 2025" /userinfo/ shape (trimmed to the fields we read).
const userinfo = (over: Record<string, unknown> = {}) => ({
  data: {
    username: 'realcreator',
    follower_count: 54000,
    is_private: false,
    is_verified: true,
    profile_pic_url_hd: 'http://cdn/pic.jpg',
    about: { country: 'India' },
    location_data: { city_name: 'Mumbai' },
    ...over,
  },
})

function okJson(body: unknown) {
  return { ok: true, json: async () => body } as unknown as Response
}

describe('RapidApiProvider (Instagram Scraper 2025 /userinfo)', () => {
  it('maps userinfo to RawCreatorSignals with country, city, verified', async () => {
    const fetchFn = vi.fn(async () => okJson(userinfo()))
    const p = new RapidApiProvider({ key: 'k', host: 'h', fetchFn })
    const list = await p.getByNiche('fashion')
    expect(list).toHaveLength(REAL_HANDLES.fashion.length)
    const c = list[0]
    expect(c.handle).toBe('realcreator')
    expect(c.followers).toBe(54000)
    expect(c.country).toBe('India')
    expect(c.city).toBe('Mumbai')
    expect(c.verified).toBe(true)
    expect(c.avg_likes).toBeGreaterThan(0)
    expect(c.avg_views).toBeGreaterThan(0)
    expect(c.engagement_rate).toBeGreaterThan(0)
  })

  it('calls the /userinfo/ endpoint with the right params + headers', async () => {
    const fetchFn = vi.fn(async () => okJson(userinfo()))
    const p = new RapidApiProvider({ key: 'mykey', host: 'myhost', fetchFn })
    await p.getByNiche('tech')
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toContain('https://myhost/userinfo/')
    expect(url).toContain('username_or_id=')
    expect(url).toContain('include_about=true')
    expect((init as RequestInit).headers).toMatchObject({ 'x-rapidapi-key': 'mykey', 'x-rapidapi-host': 'myhost' })
  })

  it('falls back to the curated city when the API city is empty', async () => {
    const fetchFn = vi.fn(async () => okJson(userinfo({ location_data: { city_name: '' } })))
    const p = new RapidApiProvider({ key: 'k', host: 'h', fetchFn })
    const list = await p.getByNiche('fashion')
    expect(list[0].city).toBe(REAL_HANDLES.fashion[0].city)
  })

  it('skips private accounts', async () => {
    const fetchFn = vi.fn(async () => okJson(userinfo({ is_private: true })))
    const p = new RapidApiProvider({ key: 'k', host: 'h', fetchFn })
    await expect(p.getByNiche('fashion')).resolves.toEqual([])
  })

  it('skips a handle whose request fails, keeps the rest', async () => {
    let n = 0
    const fetchFn = vi.fn(async () => {
      n += 1
      return n === 1 ? ({ ok: false, status: 404 } as Response) : okJson(userinfo())
    })
    const p = new RapidApiProvider({ key: 'k', host: 'h', fetchFn })
    const list = await p.getByNiche('fashion')
    expect(list).toHaveLength(REAL_HANDLES.fashion.length - 1)
  })

  it('returns [] (never throws) when JSON is malformed', async () => {
    const fetchFn = vi.fn(async () => ({ ok: true, json: async () => { throw new Error('bad') } }) as unknown as Response)
    const p = new RapidApiProvider({ key: 'k', host: 'h', fetchFn })
    await expect(p.getByNiche('fashion')).resolves.toEqual([])
  })
})
