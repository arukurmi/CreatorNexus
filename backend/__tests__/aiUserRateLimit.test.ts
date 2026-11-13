import { describe, it, expect, afterEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { aiUserRateLimit, __setAiLimiter, __resetAiLimiter } from '../src/middleware/rateLimit'
import { errorHandler } from '../src/middleware/errorHandler'
import type { AuthedRequest } from '../src/middleware/supabaseAuth'

function appAs(userId: string) {
  const app = express()
  app.post('/ai', (req: AuthedRequest, _res, next) => { req.user = { id: userId, email: 'a@b.c' }; next() }, aiUserRateLimit, (_req, res) => res.json({ ok: true }))
  app.use(errorHandler)
  return app
}

afterEach(() => __resetAiLimiter())

describe('aiUserRateLimit', () => {
  it('lets the request through and keys the limit on the user id', async () => {
    const keys: string[] = []
    __setAiLimiter({ limit: async (id) => { keys.push(id); return { success: true } } })
    expect((await request(appAs('u1')).post('/ai')).status).toBe(200)
    expect(keys).toEqual(['u1'])
  })

  it('429 once the user is over the hourly limit', async () => {
    __setAiLimiter({ limit: async () => ({ success: false }) })
    const res = await request(appAs('u1')).post('/ai')
    expect(res.status).toBe(429)
    expect(res.body.error).toMatch(/10 AI requests per hour/)
  })

  it('fails closed with 503 when the limiter store errors', async () => {
    __setAiLimiter({ limit: async () => { throw new Error('upstash down') } })
    expect((await request(appAs('u1')).post('/ai')).status).toBe(503)
  })

  it('fails closed with 503 when no limiter store is configured', async () => {
    __setAiLimiter(null)
    expect((await request(appAs('u1')).post('/ai')).status).toBe(503)
  })
})
