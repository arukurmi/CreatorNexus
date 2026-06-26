import { Redis } from '@upstash/redis'
import type { CacheStore } from './rapidapi/CachingProvider.js'
import { env } from '../config/env.js'

let client: Redis | null = null
export function getRedis(): Redis | null {
  if (!env.upstashUrl || !env.upstashToken) return null
  if (!client) client = new Redis({ url: env.upstashUrl, token: env.upstashToken, automaticDeserialization: false })
  return client
}

// A no-op store used when Redis is not configured (local/dev).
export function getCacheStore(): CacheStore {
  const r = getRedis()
  if (!r) return { get: async () => null, set: async () => {} }
  return {
    get: async (k) => {
      const v = await r.get<string>(k)
      if (v == null) return null
      if (typeof v !== 'string') throw new TypeError(`Cache corruption: key ${k} held ${typeof v}`)
      return v
    },
    set: async (k, v, ttl) => { await r.set(k, v, ttl != null ? { ex: ttl } : undefined) },
  }
}
