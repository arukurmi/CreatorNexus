import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('getCacheStore (Upstash adapter)', () => {
  beforeEach(() => vi.resetModules())
  it('round-trips a raw string value and honors TTL', async () => {
    const mem = new Map<string, string>()
    const setSpy = vi.fn((k: string, v: string) => { mem.set(k, v); return Promise.resolve('OK') })
    vi.doMock('@upstash/redis', () => ({
      Redis: class {
        constructor(_opts: any) {}
        get(k: string) { return Promise.resolve(mem.get(k) ?? null) }
        set(k: string, v: string, opts?: any) { return setSpy(k, v, opts) }
      },
    }))
    process.env.UPSTASH_REDIS_REST_URL = 'http://x'
    process.env.UPSTASH_REDIS_REST_TOKEN = 't'
    const { getCacheStore } = await import('../src/services/redis.js')
    const store = getCacheStore()
    await store.set('creators:tech', '[{"handle":"a"}]', 60)
    expect(setSpy).toHaveBeenCalledWith('creators:tech', '[{"handle":"a"}]', { ex: 60 })
    expect(await store.get('creators:tech')).toBe('[{"handle":"a"}]')
  })
})
