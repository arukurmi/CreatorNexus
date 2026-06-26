import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { __setVerifier } from '../src/middleware/supabaseAuth'

beforeAll(() => __setVerifier(async () => ({ id: 'u1', email: 'a@b.c' })))
const post = (b: any) => request(createApp()).post('/api/allocate').set('Authorization', 'Bearer good').send(b)

describe('POST /api/allocate', () => {
  it('400 on invalid budget', async () => {
    expect((await post({ budget: -5, niche: 'tech', strategy: 'reach' })).status).toBe(400)
    expect((await post({ budget: 'x', niche: 'tech', strategy: 'reach' })).status).toBe(400)
  })
  it('400 when count strategy missing count', async () => {
    expect((await post({ budget: 50000, niche: 'tech', strategy: 'count' })).status).toBe(400)
  })
  it('reach stays within budget', async () => {
    const res = await post({ budget: 80000, niche: 'tech', strategy: 'reach' })
    expect(res.status).toBe(200)
    expect(res.body.total_projected_spend).toBeLessThanOrEqual(80000)
    expect(res.body.budget_buffer_applied).toBe(false)
  })
  it('engagement applies 10% buffer', async () => {
    const res = await post({ budget: 80000, niche: 'tech', strategy: 'engagement' })
    expect(res.body.effective_budget).toBe(88000)
    expect(res.body.budget_buffer_applied).toBe(true)
  })
})
