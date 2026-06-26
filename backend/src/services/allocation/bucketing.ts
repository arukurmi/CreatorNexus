import type { Influencer, Tier } from '../../types/index.js'
import { TIER_ORDER } from '../../lib/tier.js'

export function groupByTier(creators: Influencer[]): Record<Tier, Influencer[]> {
  const out = { nano: [], micro: [], macro: [] } as Record<Tier, Influencer[]>
  for (const c of creators) out[c.tier].push(c)
  return out
}
export { TIER_ORDER }
