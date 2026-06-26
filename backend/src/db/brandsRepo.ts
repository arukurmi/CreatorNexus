export interface Brand { id: string; owner_id: string; name: string; niche: string; created_at: string }

export interface DbDriver {
  insert(table: string, row: Record<string, unknown>): Promise<any>
  selectByOwner(table: string, owner: string): Promise<any[]>
  selectById(table: string, id: string): Promise<any | null>
  deleteByIdOwner(table: string, id: string, owner: string): Promise<boolean>
}

export function makeBrandsRepo(db: DbDriver) {
  return {
    async create(input: { owner_id: string; name: string; niche: string }): Promise<Brand> {
      const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...input }
      return db.insert('brands', row) as Promise<Brand>
    },
    listByOwner: (owner: string) => db.selectByOwner('brands', owner) as Promise<Brand[]>,
    getById: (id: string) => db.selectById('brands', id) as Promise<Brand | null>,
    deleteOwned: (id: string, owner: string) => db.deleteByIdOwner('brands', id, owner),
  }
}
