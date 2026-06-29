import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { __setVerifier } from '../src/middleware/supabaseAuth.js'
import { __setStrategyClient, __resetStrategyClient } from '../src/routes/aiStrategy.js'
import type { AiAdvisory } from '../src/services/ai/types.js'

beforeAll(() => __setVerifier(async () => ({ id: 'u1', email: 'a@b.c' })))
afterEach(() => __resetStrategyClient())
const auth = (r: request.Test) => r.set('Authorization', 'Bearer good')

const advisory: AiAdvisory = {
  recommended_niche: 'beauty', secondary_niches: [], tier_mix: { nano: 60, micro: 30, macro: 10 },
  rationale: 'r', target_audience: 'a', content_ideas: ['x'], selected_creator_ids: [],
}

describe('POST /api/ai/strategy', () => {
  beforeEach(() => __setStrategyClient({ generate: async () => advisory }))

  it('401 without a token', async () => {
    const res = await request(createApp()).post('/api/ai/strategy').send({ brief: 'a valid brief here' })
    expect(res.status).toBe(401)
  })
  it('400 on an empty/too-short brief', async () => {
    expect((await auth(request(createApp()).post('/api/ai/strategy')).send({ brief: 'hi' })).status).toBe(400)
  })
  it('200 with advisory + creators on a valid brief', async () => {
    const res = await auth(request(createApp()).post('/api/ai/strategy')).send({ brief: 'Launch a vegan skincare line for Gen Z in metros' })
    expect(res.status).toBe(200)
    expect(res.body.advisory.recommended_niche).toBe('beauty')
    expect(Array.isArray(res.body.creators)).toBe(true)
  })
  it('503 when the AI client is not configured', async () => {
    __setStrategyClient(null) // simulate missing key
    const res = await auth(request(createApp()).post('/api/ai/strategy')).send({ brief: 'a valid campaign brief' })
    expect(res.status).toBe(503)
  })
})
