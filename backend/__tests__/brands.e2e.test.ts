import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { __setVerifier, __resetVerifier } from '../src/middleware/supabaseAuth'
import { setRepos, __resetRepos } from '../src/routes/_repos'
import { makeBrandsRepo } from '../src/db/brandsRepo'
import { makeCampaignsRepo } from '../src/db/campaignsRepo'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** Mimics Postgres, which throws rather than returning nothing when a uuid column is queried with a non-UUID. */
function assertUuid(id: string) { if (!UUID.test(id)) throw new Error(`invalid input syntax for type uuid: "${id}"`) }

function fakeDb() {
  const rows: any[] = []
  return {
    insert: async (_t: string, r: any) => { rows.push(r); return r },
    selectByOwner: async (_t: string, o: string) => rows.filter((r) => r.owner_id === o),
    selectById: async (_t: string, id: string) => { assertUuid(id); return rows.find((r) => r.id === id) ?? null },
    deleteByIdOwner: async (_t: string, id: string, o: string) => {
      assertUuid(id)
      const i = rows.findIndex((r) => r.id === id && r.owner_id === o); if (i < 0) return false; rows.splice(i, 1); return true
    },
  }
}
let user = { id: 'u1', email: 'a@b.c' }
beforeEach(() => {
  const db = fakeDb()
  setRepos({ brands: makeBrandsRepo(db), campaigns: makeCampaignsRepo(db) })
  __setVerifier(async () => user)
})
afterEach(() => { __resetRepos(); __resetVerifier() })
const A = (r: request.Test) => r.set('Authorization', 'Bearer good')

describe('brands CRUD', () => {
  it('creates, lists, deletes; another user gets 404, not 403', async () => {
    user = { id: 'u1', email: 'a@b.c' }
    const created = await A(request(createApp()).post('/api/brands').send({ name: 'Acme', niche: 'tech' }))
    expect(created.status).toBe(201)
    const id = created.body.id
    expect((await A(request(createApp()).get('/api/brands'))).body.length).toBe(1)
    user = { id: 'u2', email: 'x@y.z' }
    expect((await A(request(createApp()).delete(`/api/brands/${id}`))).status).toBe(404)
    user = { id: 'u1', email: 'a@b.c' }
    expect((await A(request(createApp()).delete(`/api/brands/${id}`))).status).toBe(204)
  })
  it('400 on invalid body', async () => {
    expect((await A(request(createApp()).post('/api/brands').send({ name: '' }))).status).toBe(400)
  })
  it('400 when the brand name is longer than 100 characters', async () => {
    expect((await A(request(createApp()).post('/api/brands').send({ name: 'x'.repeat(101), niche: 'tech' }))).status).toBe(400)
  })
  it('404 deleting nonexistent brand', async () => {
    user = { id: 'u1', email: 'a@b.c' }
    expect((await A(request(createApp()).delete(`/api/brands/${crypto.randomUUID()}`))).status).toBe(404)
  })
  it('404 rather than a database error for a malformed brand id', async () => {
    const res = await A(request(createApp()).delete('/api/brands/nonexistent-id'))
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Brand not found' })
  })
})
