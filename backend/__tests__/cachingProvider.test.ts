import { describe, it, expect, vi } from 'vitest'
import { CachingProvider, type CacheStore } from '../src/services/rapidapi/CachingProvider'
import type { InfluencerProvider } from '../src/services/rapidapi/InfluencerProvider'

function memoryStore(): CacheStore {
  const m = new Map<string, string>()
  return { get: async (k) => m.get(k) ?? null, set: async (k, v) => void m.set(k, v) }
}

describe('CachingProvider', () => {
  it('caches by niche: inner called once across two reads', async () => {
    const inner: InfluencerProvider = {
      getByNiche: vi.fn().mockResolvedValue([{ handle: 'a', followers: 1, avatar_url: '', avg_views: 1, avg_likes: 1, avg_comments: 0, engagement_rate: 0.5, niche: 'tech' }]),
    }
    const p = new CachingProvider(inner, memoryStore())
    const first = await p.getByNiche('tech')
    const second = await p.getByNiche('tech')
    expect(second).toEqual(first)
    expect(inner.getByNiche).toHaveBeenCalledTimes(1)
  })

  it('refetches on cache miss for a different niche', async () => {
    const inner: InfluencerProvider = { getByNiche: vi.fn().mockResolvedValue([]) }
    const p = new CachingProvider(inner, memoryStore())
    await p.getByNiche('tech'); await p.getByNiche('food')
    expect(inner.getByNiche).toHaveBeenCalledTimes(2)
  })
})
