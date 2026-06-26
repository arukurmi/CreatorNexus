import type { Pricer } from './types.js'
import { MIN_FLOOR, sanitizeSignals } from './types.js'
import { getTier } from '../../lib/tier.js'
import { engagementMultiplier } from './engagementMultiplier.js'

export const cpmPricer: Pricer = {
  price(sRaw, cfg) {
    const s = sanitizeSignals(sRaw)
    const tier = getTier(s.followers)
    const views = s.avg_views > 0 ? s.avg_views : Math.max(s.followers * 0.4, 500)
    const base = (views / 1000) * cfg.cpm[tier]
    const mid = Math.max(MIN_FLOOR * 1.5, base * engagementMultiplier(s.engagement_rate, tier, cfg))
    const cost_min = Math.max(MIN_FLOOR, Math.round(mid * (1 - cfg.spread)))
    const cost_max = Math.max(Math.round(mid * (1 + cfg.spread)), cost_min + 1)
    return { cost_min, cost_max }
  },
}
