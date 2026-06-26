import type { Pricer } from './types.js'
import { MIN_FLOOR, sanitizeSignals } from './types.js'
import { getTier } from '../../lib/tier.js'

export const weightedPricer: Pricer = {
  price(sRaw, cfg) {
    const s = sanitizeSignals(sRaw)
    const ctrProxy = s.engagement_rate
    const score =
      cfg.weights.followers * s.followers +
      cfg.weights.likes * s.avg_likes +
      cfg.weights.eng * s.engagement_rate +
      cfg.weights.ctr * ctrProxy
    const tier = getTier(s.followers)
    const [lo, hi] = cfg.tierBands[tier]
    // Squash score into [0,1] then map into the tier band.
    const norm = score / (score + cfg.weightedNormK)
    const mid = Math.max(MIN_FLOOR * 1.5, lo + (hi - lo) * norm)
    const cost_min = Math.max(MIN_FLOOR, Math.round(mid * (1 - cfg.spread)))
    const cost_max = Math.max(Math.round(mid * (1 + cfg.spread)), cost_min + 1)
    return { cost_min, cost_max }
  },
}
