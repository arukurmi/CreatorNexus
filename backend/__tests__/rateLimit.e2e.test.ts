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

  it('keys on the client address added by the one trusted proxy, ignoring spoofed hops', async () => {
    vi.resetModules()
    const keys: string[] = []
    vi.doMock('../src/services/redis', () => ({ getRedis: () => ({}) }))
    vi.doMock('@upstash/ratelimit', () => ({
      Ratelimit: class {
        static slidingWindow() { return {} }
        limit(id: string) { keys.push(id); return Promise.resolve({ success: true, limit: 60, remaining: 59 }) }
      },
    }))
    const { createApp } = await import('../src/app')
    await request(createApp()).get('/api/health').set('X-Forwarded-For', '198.51.100.1, 203.0.113.7')
    expect(keys).toEqual(['203.0.113.7'])
  })
})
