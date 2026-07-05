import { describe, it, expect, afterEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { __setVerifier, __resetVerifier } from '../src/middleware/supabaseAuth.js'

describe('POST /api/auth/session', () => {
  afterEach(() => __resetVerifier())

  it('401 when no Authorization header is sent', async () => {
    const res = await request(createApp()).post('/api/auth/session')
    expect(res.status).toBe(401)
  })

  it('401 when the token is invalid', async () => {
    __setVerifier(async () => null)
    const res = await request(createApp())
      .post('/api/auth/session')
      .set('Authorization', 'Bearer bad')
    expect(res.status).toBe(401)
  })

  it('returns the authenticated user for a valid token', async () => {
    __setVerifier(async () => ({ id: 'u1', email: 'brand@nexus.in' }))
    const res = await request(createApp())
      .post('/api/auth/session')
      .set('Authorization', 'Bearer good')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ user: { id: 'u1', email: 'brand@nexus.in' } })
  })
})
