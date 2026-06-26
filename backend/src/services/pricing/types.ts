import type { RawCreatorSignals } from '../../types/index.js'
import type { PricingConfig } from '../../config/pricingConfig.js'
export interface PriceRange { cost_min: number; cost_max: number }
export interface Pricer { price(s: RawCreatorSignals, cfg: PricingConfig): PriceRange }
export const MIN_FLOOR = 500 // never price below ₹500

export function sanitizeSignals(s: RawCreatorSignals): RawCreatorSignals {
  const safe = (x: number) => (Number.isFinite(x) && x >= 0 ? x : 0)
  return {
    ...s,
    followers: safe(s.followers),
    avg_views: safe(s.avg_views),
    avg_likes: safe(s.avg_likes),
    avg_comments: safe(s.avg_comments),
    engagement_rate: safe(s.engagement_rate),
  }
}
