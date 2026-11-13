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
    deleteByIdOwner: async () => false,
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
// POST body: server computes result and projected_spend — client sends only params
const body = { brand_id: null, niche: 'tech', budget: 50000, strategy: 'reach', count: null }

describe('campaign history', () => {
  it('saves snapshot with server-computed result, lists, fetches by id', async () => {
    user = { id: 'u1', email: 'a@b.c' }
    const saved = await A(request(createApp()).post('/api/campaigns').send(body))
    expect(saved.status).toBe(201)
    const id = saved.body.id
    // Server must have computed projected_spend and result
    expect(Number.isFinite(saved.body.projected_spend)).toBe(true)
    expect(saved.body.projected_spend).toBeGreaterThanOrEqual(0)
    expect(saved.body.result.total_projected_spend).toBe(saved.body.projected_spend)
    expect(Array.isArray(saved.body.result.selected)).toBe(true)
    expect((await A(request(createApp()).get('/api/campaigns'))).body.length).toBe(1)
    const got = await A(request(createApp()).get(`/api/campaigns/${id}`))
    expect(got.status).toBe(200)
    expect(got.body.result.total_projected_spend).toBe(saved.body.projected_spend)
  })
  it('404 fetching another user\'s campaign, same as when missing', async () => {
    user = { id: 'u1', email: 'a@b.c' }
    const saved = await A(request(createApp()).post('/api/campaigns').send(body))
    user = { id: 'u2', email: 'x@y.z' }
    expect((await A(request(createApp()).get(`/api/campaigns/${saved.body.id}`))).status).toBe(404)
    expect((await A(request(createApp()).get(`/api/campaigns/${crypto.randomUUID()}`))).status).toBe(404)
  })
  it('404 rather than a database error for a malformed campaign id', async () => {
    const res = await A(request(createApp()).get('/api/campaigns/missing'))
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Campaign not found' })
  })
  it('400 when budget or count exceed their caps or brand_id is not a UUID', async () => {
    const post = (b: object) => A(request(createApp()).post('/api/campaigns').send({ ...body, ...b }))
    expect((await post({ budget: 10_000_001 })).status).toBe(400)
    expect((await post({ strategy: 'count', count: 201 })).status).toBe(400)
    expect((await post({ brand_id: 'not-a-uuid' })).status).toBe(400)
  })
  it('saves a campaign against the caller\'s own brand', async () => {
    user = { id: 'u1', email: 'a@b.c' }
    const brand = await A(request(createApp()).post('/api/brands').send({ name: 'Acme', niche: 'tech' }))
    const saved = await A(request(createApp()).post('/api/campaigns').send({ ...body, brand_id: brand.body.id }))
    expect(saved.status).toBe(201)
    expect(saved.body.brand_id).toBe(brand.body.id)
  })
  it('404 when brand_id belongs to another user or does not exist', async () => {
    user = { id: 'u1', email: 'a@b.c' }
    const brand = await A(request(createApp()).post('/api/brands').send({ name: 'Acme', niche: 'tech' }))
    user = { id: 'u2', email: 'x@y.z' }
    const foreign = await A(request(createApp()).post('/api/campaigns').send({ ...body, brand_id: brand.body.id }))
    expect(foreign.status).toBe(404)
    expect(foreign.body).toEqual({ error: 'Brand not found' })
    expect((await A(request(createApp()).post('/api/campaigns').send({ ...body, brand_id: crypto.randomUUID() }))).status).toBe(404)
    expect((await A(request(createApp()).get('/api/campaigns'))).body).toEqual([])
  })
})
