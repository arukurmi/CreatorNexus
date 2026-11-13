import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(createApp()).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('sends security headers and hides the framework', async () => {
    const res = await request(createApp()).get('/api/health')
    expect(res.headers['strict-transport-security']).toMatch(/max-age=\d+/)
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(res.headers['referrer-policy']).toBe('no-referrer')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })
})
