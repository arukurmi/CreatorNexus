import type { Pricer } from './types.js'
import { MIN_FLOOR } from './types.js'
import { getTier } from '../../lib/tier.js'

export const weightedPricer: Pricer = {
  price(s, cfg) {
    const ctrProxy = s.engagement_rate
    const score =
      cfg.weights.followers * s.followers +
      cfg.weights.likes * s.avg_likes +
      cfg.weights.eng * s.engagement_rate +
      cfg.weights.ctr * ctrProxy
    const tier = getTier(s.followers)
    const [lo, hi] = cfg.tierBands[tier]
    // Squash score into [0,1] then map into the tier band.
    const norm = score / (score + 50000)
    const mid = Math.max(MIN_FLOOR * 1.5, lo + (hi - lo) * norm)
    return {
      cost_min: Math.max(MIN_FLOOR, Math.round(mid * (1 - cfg.spread))),
      cost_max: Math.round(mid * (1 + cfg.spread)),
    }
  },
}
