import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { __setVerifier, __resetVerifier } from '../src/middleware/supabaseAuth'
import { setRepos, __resetRepos } from '../src/routes/_repos'
import { makeBrandsRepo } from '../src/db/brandsRepo'
import { makeCampaignsRepo } from '../src/db/campaignsRepo'

function fakeDb() {
  const rows: any[] = []
  return {
    insert: async (_t: string, r: any) => { rows.push(r); return r },
    selectByOwner: async (_t: string, o: string) => rows.filter((r) => r.owner_id === o),
    selectById: async (_t: string, id: string) => rows.find((r) => r.id === id) ?? null,
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
const body = { brand_id: null, niche: 'tech', budget: 50000, strategy: 'reach', count: null,
  projected_spend: 40000, result: { selected: [], total_projected_spend: 40000 } }

describe('campaign history', () => {
  it('saves snapshot, lists, fetches by id, round-trips result', async () => {
    user = { id: 'u1', email: 'a@b.c' }
    const saved = await A(request(createApp()).post('/api/campaigns').send(body))
    expect(saved.status).toBe(201)
    const id = saved.body.id
    expect((await A(request(createApp()).get('/api/campaigns'))).body.length).toBe(1)
    const got = await A(request(createApp()).get(`/api/campaigns/${id}`))
    expect(got.status).toBe(200)
    expect(got.body.result.total_projected_spend).toBe(40000)
  })
  it('403 fetching another user\'s campaign, 404 when missing', async () => {
    user = { id: 'u1', email: 'a@b.c' }
    const saved = await A(request(createApp()).post('/api/campaigns').send(body))
    user = { id: 'u2', email: 'x@y.z' }
    expect((await A(request(createApp()).get(`/api/campaigns/${saved.body.id}`))).status).toBe(403)
    expect((await A(request(createApp()).get('/api/campaigns/missing'))).status).toBe(404)
  })
})
