import type { RawCreatorSignals } from '../../types/index.js'
import type { PricingConfig } from '../../config/pricingConfig.js'
export interface PriceRange { cost_min: number; cost_max: number }
export interface Pricer { price(s: RawCreatorSignals, cfg: PricingConfig): PriceRange }
export const MIN_FLOOR = 500 // never price below ₹500
