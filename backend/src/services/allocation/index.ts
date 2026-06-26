import type { AllocStrategy } from './types.js'
import type { AllocationStrategy } from '../../types/index.js'
import { reachStrategy } from './reach.js'
import { engagementStrategy } from './engagement.js'
import { valueStrategy } from './value.js'
import { countStrategy } from './count.js'

const REGISTRY: Record<AllocationStrategy, AllocStrategy> = {
  reach: reachStrategy, engagement: engagementStrategy, value: valueStrategy, count: countStrategy,
}
export function getStrategy(name: AllocationStrategy): AllocStrategy {
  return REGISTRY[name] ?? valueStrategy
}
