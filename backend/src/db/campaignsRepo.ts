import type { DbDriver } from './brandsRepo.js'
import type { AllocationResult } from '../services/allocation/types.js'

export interface Campaign {
  id: string; brand_id: string | null; owner_id: string; niche: string
  budget: number; strategy: string; count: number | null
  result: AllocationResult; projected_spend: number; created_at: string
}

export function makeCampaignsRepo(db: DbDriver) {
  return {
    async create(input: Omit<Campaign, 'id' | 'created_at'>): Promise<Campaign> {
      const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...input }
      return db.insert('campaigns', row) as Promise<Campaign>
    },
    listByOwner: (owner: string) => db.selectByOwner('campaigns', owner) as Promise<Campaign[]>,
    getById: (id: string) => db.selectById('campaigns', id) as Promise<Campaign | null>,
  }
}
