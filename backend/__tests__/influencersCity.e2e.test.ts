import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { __setVerifier } from '../src/middleware/supabaseAuth.js'

beforeAll(() => __setVerifier(async () => ({ id: 'u1', email: 'a@b.c' })))
const auth = (r: request.Test) => r.set('Authorization', 'Bearer good')

describe('GET /api/influencers — city filter (e2e)', () => {
  it('returns only the requested city and echoes it back', async () => {
    const res = await auth(request(createApp()).get('/api/influencers?niche=beauty&city=Mumbai'))
    expect(res.status).toBe(200)
    expect(res.body.city).toBe('Mumbai')
    expect(res.body.creators.length).toBeGreaterThan(0)
    expect(res.body.creators.every((c: { city?: string }) => c.city === 'Mumbai')).toBe(true)
  })

  it('city is null when omitted (all locations)', async () => {
    const res = await auth(request(createApp()).get('/api/influencers?niche=beauty'))
    expect(res.status).toBe(200)
    expect(res.body.city).toBeNull()
  })
})

describe('POST /api/allocate — city filter (e2e)', () => {
  it('accepts an optional city and echoes it', async () => {
    const res = await auth(request(createApp()).post('/api/allocate'))
      .send({ budget: 80000, niche: 'beauty', strategy: 'reach', city: 'Mumbai' })
    expect(res.status).toBe(200)
    expect(res.body.city).toBe('Mumbai')
  })
})
