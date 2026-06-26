import type { Pricer } from './types.js'
import { MIN_FLOOR, sanitizeSignals } from './types.js'
import { getTier } from '../../lib/tier.js'
import { DEFAULT_PRICING } from '../../config/pricingConfig.js'

export const tierFlatPricer: Pricer = {
  price(sRaw, cfg) {
    const s = sanitizeSignals(sRaw)
    const tier = getTier(s.followers)
    const [lo, hi] = cfg.tierBands[tier]
    // Performance score from engagement vs tier average, in [0,1].
    const avg = cfg.tierAvgEng[tier] > 0 ? cfg.tierAvgEng[tier] : DEFAULT_PRICING.tierAvgEng[tier]
    const perf = Math.min(1, Math.max(0, s.engagement_rate / (avg * 2)))
    const mid = lo + (hi - lo) * perf
    const [pMin, pMax] = cfg.tierPerfRange
    return {
      cost_min: Math.max(MIN_FLOOR, Math.round(mid * pMin)),
      cost_max: Math.round(Math.max(mid * pMax, MIN_FLOOR * 2)),
    }
  },
}
