import { describe, it, expect, vi } from 'vitest'
import express from 'express'
import request from 'supertest'

// Verify the middleware returns 429 when the limiter denies.
describe('rateLimit middleware', () => {
  it('returns 429 when limit exceeded', async () => {
    vi.resetModules()
    vi.doMock('../src/services/redis', () => ({ getRedis: () => ({}) }))
    vi.doMock('@upstash/ratelimit', () => ({
      Ratelimit: class { static slidingWindow() { return {} } limit() { return Promise.resolve({ success: false, limit: 60, remaining: 0 }) } },
    }))
    const { rateLimit } = await import('../src/middleware/rateLimit')
    const { errorHandler } = await import('../src/middleware/errorHandler')
    const app = express()
    app.get('/api/x', rateLimit, (_req, res) => res.json({ ok: true }))
    app.use(errorHandler)
    const res = await request(app).get('/api/x')
    expect(res.status).toBe(429)
  })
})
