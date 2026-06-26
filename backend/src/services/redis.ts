import { Redis } from '@upstash/redis'
import type { CacheStore } from './rapidapi/CachingProvider.js'
import { env } from '../config/env.js'

let client: Redis | null = null
export function getRedis(): Redis | null {
  if (!env.upstashUrl || !env.upstashToken) return null
  if (!client) client = new Redis({ url: env.upstashUrl, token: env.upstashToken })
  return client
}

// A no-op store used when Redis is not configured (local/dev).
export function getCacheStore(): CacheStore {
  const r = getRedis()
  if (!r) return { get: async () => null, set: async () => {} }
  return {
    get: (k) => r.get<string>(k).then((v) => (v == null ? null : String(v))),
    set: async (k, v, ttl) => void (await r.set(k, v, ttl ? { ex: ttl } : undefined)),
  }
}
