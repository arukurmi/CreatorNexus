import type { InfluencerProvider } from './InfluencerProvider.js'
import type { Niche, RawCreatorSignals } from '../../types/index.js'

export interface CacheStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSec?: number): Promise<void>
}

export class CachingProvider implements InfluencerProvider {
  constructor(
    private inner: InfluencerProvider,
    private store: CacheStore,
    private ttlSec = 3600,
  ) {}

  async getByNiche(niche: Niche): Promise<RawCreatorSignals[]> {
    const key = `creators:${niche}`
    const hit = await this.store.get(key)
    if (hit) return JSON.parse(hit) as RawCreatorSignals[]
    const fresh = await this.inner.getByNiche(niche)
    await this.store.set(key, JSON.stringify(fresh), this.ttlSec)
    return fresh
  }
}
