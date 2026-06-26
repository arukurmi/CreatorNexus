import { describe, it, expect, afterEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { requireAuth, __setVerifier, __resetVerifier } from '../src/middleware/supabaseAuth.js'

function appWith() {
  const app = express()
  app.get('/secure', requireAuth, (req: any, res) => res.json({ id: req.user.id }))
  app.use((err: any, _req: any, res: any, _next: any) => res.status(err.status ?? 500).json({ error: err.message }))
  return app
}

describe('requireAuth', () => {
  afterEach(() => __resetVerifier())

  it('401 when no token', async () => {
    const res = await request(appWith()).get('/secure')
    expect(res.status).toBe(401)
  })
  it('401 when token invalid', async () => {
    __setVerifier(async () => null)
    const res = await request(appWith()).get('/secure').set('Authorization', 'Bearer bad')
    expect(res.status).toBe(401)
  })
  it('sets req.user when token valid', async () => {
    __setVerifier(async () => ({ id: 'u1', email: 'a@b.c' }))
    const res = await request(appWith()).get('/secure').set('Authorization', 'Bearer good')
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('u1')
  })
  it('401 when verifier throws (no hang)', async () => {
    __setVerifier(async () => { throw new Error('supabase down') })
    const res = await request(appWith()).get('/secure').set('Authorization', 'Bearer x')
    expect(res.status).toBe(401)
  })
  it('200 with lowercase bearer scheme', async () => {
    __setVerifier(async () => ({ id: 'u2', email: 'b@c.d' }))
    const res = await request(appWith()).get('/secure').set('Authorization', 'bearer good')
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('u2')
  })
})
