import type { Response, NextFunction } from 'express'
import { Ratelimit } from '@upstash/ratelimit'
import { getRedis } from '../services/redis.js'
import { httpError } from './errorHandler.js'
import type { AuthedRequest } from './supabaseAuth.js'

const redis = getRedis()
const limiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '60 s') }) : null

// Gateway-level IP rate limit applied before auth — req.user is not yet populated here.
// TODO: per-user quotas would require running this after requireAuth
export async function rateLimit(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!limiter) return next() // Upstash not configured → skip
  const id = req.ip ?? 'anon'
  try {
    const { success, limit, remaining } = await limiter.limit(id)
    res.setHeader('X-RateLimit-Limit', String(limit))
    res.setHeader('X-RateLimit-Remaining', String(remaining))
    if (!success) return next(httpError(429, 'Rate limit exceeded'))
    next()
  } catch {
    // Upstash unavailable → fail OPEN (do not block traffic on infra failure)
    next()
  }
}
