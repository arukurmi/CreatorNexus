import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { __setVerifier } from '../src/middleware/supabaseAuth'

beforeAll(() => __setVerifier(async () => ({ id: 'u1', email: 'a@b.c' })))
const auth = (r: request.Test) => r.set('Authorization', 'Bearer good')

describe('GET /api/influencers', () => {
  it('401 without token', async () => {
    expect((await request(createApp()).get('/api/influencers?niche=tech')).status).toBe(401)
  })
  it('400 on missing/unknown niche', async () => {
    expect((await auth(request(createApp()).get('/api/influencers'))).status).toBe(400)
    expect((await auth(request(createApp()).get('/api/influencers?niche=nope'))).status).toBe(400)
  })
  it('200 returns priced creators (fallback path)', async () => {
    const res = await auth(request(createApp()).get('/api/influencers?niche=tech'))
    expect(res.status).toBe(200)
    expect(res.body.creators.length).toBeGreaterThan(0)
    expect(res.body.creators[0].cost_min).toBeLessThan(res.body.creators[0].cost_max)
  })
})
