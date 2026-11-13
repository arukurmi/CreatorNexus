import type { Response, NextFunction } from 'express'
import { Ratelimit } from '@upstash/ratelimit'
import { getRedis } from '../services/redis.js'
import { httpError } from './errorHandler.js'
import type { AuthedRequest } from './supabaseAuth.js'

type Limiter = { limit(id: string): Promise<{ success: boolean }> }

const redis = getRedis()
const limiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '60 s') }) : null
const defaultAiLimiter: Limiter | null = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 h'), prefix: 'ratelimit:ai-user' })
  : null
let aiLimiter = defaultAiLimiter
export function __setAiLimiter(l: Limiter | null) { aiLimiter = l }
export function __resetAiLimiter() { aiLimiter = defaultAiLimiter }

// Gateway-level IP rate limit applied before auth — req.user is not yet populated here.
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

/** Runs after requireAuth. Fails closed because every AI call costs money: no working limiter, no call. */
export async function aiUserRateLimit(req: AuthedRequest, _res: Response, next: NextFunction) {
  const unavailable = httpError(503, 'The AI Strategist is unavailable right now. Please try again later.')
  if (!aiLimiter) return next(unavailable)
  try {
    const { success } = await aiLimiter.limit(req.user!.id)
    next(success ? undefined : httpError(429, 'You have reached the limit of 10 AI requests per hour. Please try again later.'))
  } catch {
    next(unavailable)
  }
}
