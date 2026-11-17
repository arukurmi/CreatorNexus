import type { AllocationStrategy, Niche } from './types'
import { NICHES } from './niches'
import { clampBudget } from './budget'

export interface Filters {
  budget: number
  niche: Niche
  strategy: AllocationStrategy
  count: number
  city: string
}

const STORAGE_KEY = 'creator-nexus:last-filters'
const STRATEGIES: AllocationStrategy[] = ['reach', 'engagement', 'value', 'count']

export function loadSavedFilters(): Filters | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (
      typeof saved?.budget !== 'number' ||
      !NICHES.some((n) => n.value === saved.niche) ||
      !STRATEGIES.includes(saved.strategy) ||
      !Number.isInteger(saved.count) ||
      saved.count < 1 ||
      typeof saved.city !== 'string'
    ) {
      return null
    }
    return {
      budget: clampBudget(saved.budget),
      niche: saved.niche,
      strategy: saved.strategy,
      count: saved.count,
      city: saved.city,
    }
  } catch {
    return null
  }
}

export function saveFilters(filters: Filters): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  } catch {}
}
