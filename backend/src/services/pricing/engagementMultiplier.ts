import type { Tier } from '../../types/index.js'
import type { PricingConfig } from '../../config/pricingConfig.js'

// 1 at the tier average; rises/falls with deviation; clamped to a positive band.
export function engagementMultiplier(engRate: number, tier: Tier, cfg: PricingConfig): number {
  const e = Number.isFinite(engRate) ? engRate : 0
  const factor = 1 + cfg.engMultiplierK * (e - cfg.tierAvgEng[tier])
  return Math.min(2.5, Math.max(0.4, factor))
}
