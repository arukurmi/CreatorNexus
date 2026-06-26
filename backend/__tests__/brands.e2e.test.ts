import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { __setVerifier } from '../src/middleware/supabaseAuth'
import { setRepos } from '../src/routes/_repos'
import { makeBrandsRepo } from '../src/db/brandsRepo'
import { makeCampaignsRepo } from '../src/db/campaignsRepo'

function fakeDb() {
  const rows: any[] = []
  return {
    insert: async (_t: string, r: any) => { rows.push(r); return r },
    selectByOwner: async (_t: string, o: string) => rows.filter((r) => r.owner_id === o),
    selectById: async (_t: string, id: string) => rows.find((r) => r.id === id) ?? null,
    deleteByIdOwner: async (_t: string, id: string, o: string) => {
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
const A = (r: request.Test) => r.set('Authorization', 'Bearer good')

describe('brands CRUD', () => {
  it('creates, lists, deletes; enforces ownership', async () => {
    user = { id: 'u1', email: 'a@b.c' }
    const created = await A(request(createApp()).post('/api/brands').send({ name: 'Acme', niche: 'tech' }))
    expect(created.status).toBe(201)
    const id = created.body.id
    expect((await A(request(createApp()).get('/api/brands'))).body.length).toBe(1)
    user = { id: 'u2', email: 'x@y.z' }
    expect((await A(request(createApp()).delete(`/api/brands/${id}`))).status).toBe(403)
    user = { id: 'u1', email: 'a@b.c' }
    expect((await A(request(createApp()).delete(`/api/brands/${id}`))).status).toBe(204)
  })
  it('400 on invalid body', async () => {
    expect((await A(request(createApp()).post('/api/brands').send({ name: '' }))).status).toBe(400)
  })
})
