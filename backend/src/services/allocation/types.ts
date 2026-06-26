import type { Influencer, Tier } from '../../types/index.js'
export interface AllocStrategy { score(i: Influencer): number }
export interface AllocationResult {
  selected: Influencer[]
  total_projected_spend: number
  leftover_budget: number
  effective_budget: number
  budget_buffer_applied: boolean
  by_tier: Record<Tier, { count: number; spend: number }>
}
export const BUFFER = 1.1
