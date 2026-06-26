import type { Pricer } from './types.js'
import { MIN_FLOOR } from './types.js'
import { getTier } from '../../lib/tier.js'

export const tierFlatPricer: Pricer = {
  price(s, cfg) {
    const tier = getTier(s.followers)
    const [lo, hi] = cfg.tierBands[tier]
    // Performance score from engagement vs tier average, in [0,1].
    const perf = Math.min(1, Math.max(0, s.engagement_rate / (cfg.tierAvgEng[tier] * 2)))
    const mid = lo + (hi - lo) * perf
    const [pMin, pMax] = cfg.tierPerfRange
    return {
      cost_min: Math.max(MIN_FLOOR, Math.round(mid * pMin)),
      cost_max: Math.round(Math.max(mid * pMax, MIN_FLOOR * 2)),
    }
  },
}
