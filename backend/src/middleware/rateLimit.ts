import type { Response, NextFunction } from 'express'
import { Ratelimit } from '@upstash/ratelimit'
import { getRedis } from '../services/redis.js'
import { httpError } from './errorHandler.js'
import type { AuthedRequest } from './supabaseAuth.js'

const redis = getRedis()
const limiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '60 s') }) : null

export async function rateLimit(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!limiter) return next() // no Upstash configured → skip
  const id = req.user?.id ?? req.ip ?? 'anon'
  const { success, limit, remaining } = await limiter.limit(id)
  res.setHeader('X-RateLimit-Limit', String(limit))
  res.setHeader('X-RateLimit-Remaining', String(remaining))
  if (!success) return next(httpError(429, 'Rate limit exceeded'))
  next()
}
