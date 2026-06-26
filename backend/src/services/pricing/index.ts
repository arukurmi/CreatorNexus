import type { Pricer } from './types.js'
import type { PricingConfig } from '../../config/pricingConfig.js'
import { cpmPricer } from './cpm.js'
import { weightedPricer } from './weighted.js'
import { tierFlatPricer } from './tierFlat.js'

const REGISTRY: Record<PricingConfig['model'], Pricer> = {
  cpm: cpmPricer, weighted: weightedPricer, tier_flat: tierFlatPricer,
}
export function getPricer(model: PricingConfig['model']): Pricer {
  return REGISTRY[model] ?? cpmPricer
}
export type { Pricer, PriceRange } from './types.js'
