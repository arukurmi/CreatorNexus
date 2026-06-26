import { describe, it, expect } from 'vitest'
import { makeBrandsRepo, type DbDriver } from '../src/db/brandsRepo.js'

function fakeDb(): DbDriver {
  const rows: any[] = []
  return {
    insert: async (_t, row) => { rows.push(row); return row },
    selectByOwner: async (_t, owner) => rows.filter((r) => r.owner_id === owner),
    selectById: async (_t, id) => rows.find((r) => r.id === id) ?? null,
    deleteByIdOwner: async (_t, id, owner) => {
      const i = rows.findIndex((r) => r.id === id && r.owner_id === owner)
      if (i < 0) return false; rows.splice(i, 1); return true
    },
  }
}

describe('brandsRepo', () => {
  it('creates and lists only the owner rows', async () => {
    const repo = makeBrandsRepo(fakeDb())
    await repo.create({ owner_id: 'u1', name: 'A', niche: 'tech' })
    await repo.create({ owner_id: 'u2', name: 'B', niche: 'food' })
    const mine = await repo.listByOwner('u1')
    expect(mine.map((b) => b.name)).toEqual(['A'])
  })
  it('deleteOwned returns false for another user', async () => {
    const repo = makeBrandsRepo(fakeDb())
    const b = await repo.create({ owner_id: 'u1', name: 'A', niche: 'tech' })
    expect(await repo.deleteOwned(b.id, 'u2')).toBe(false)
    expect(await repo.deleteOwned(b.id, 'u1')).toBe(true)
  })
})
