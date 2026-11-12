import type { Influencer, Tier } from '../../types/index.js'
import type { AllocationResult } from './types.js'
import { groupByTier, TIER_ORDER } from './bucketing.js'
import { engagementStrategy } from './engagement.js'
import { influencerCost } from '../allocationService.js'

export interface HealthFlag { severity: 'info' | 'warn' | 'critical'; code: string; message: string }

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`
const pct = (part: number, whole: number) => Math.round((part / whole) * 100)

export function budgetHealth(result: AllocationResult, creators: Influencer[]): HealthFlag[] {
  const { selected, by_tier, total_projected_spend: spend, leftover_budget, effective_budget } = result
  if (!selected.length) {
    const message = creators.length
      ? `The cheapest creator costs ${rupees(Math.min(...creators.map(influencerCost)))}, more than the ${rupees(effective_budget)} budget, so no one was selected.`
      : 'No creators matched this search, so no one was selected.'
    return [{ severity: 'critical', code: 'no_creators', message }]
  }

  const flags: HealthFlag[] = []
  const pool = groupByTier(creators)
  const topTier = TIER_ORDER.reduce((a, b) => (by_tier[b].spend > by_tier[a].spend ? b : a))
  if (by_tier[topTier].spend > 0.55 * spend && TIER_ORDER.filter((t) => pool[t].length).length > 1) {
    flags.push({ severity: 'warn', code: 'tier_concentration',
      message: `${pct(by_tier[topTier].spend, spend)}% of spend is in ${topTier} creators. Consider spreading it across tiers.` })
  }

  if (leftover_budget > 0.1 * effective_budget) {
    flags.push({ severity: 'warn', code: 'unspent_budget',
      message: `${rupees(leftover_budget)} (${pct(leftover_budget, effective_budget)}% of the budget) is left unspent.` })
  }

  const priciest = selected.reduce((a, b) => (influencerCost(b) > influencerCost(a) ? b : a))
  if (selected.length > 1 && influencerCost(priciest) > 0.35 * spend) {
    flags.push({ severity: 'warn', code: 'single_creator_concentration',
      message: `@${priciest.handle} takes ${pct(influencerCost(priciest), spend)}% of spend on their own.` })
  }

  const costPerEngagement = (tier: Tier) =>
    by_tier[tier].spend / selected.filter((i) => i.tier === tier).reduce((s, i) => s + engagementStrategy.score(i), 0)
  if (by_tier.macro.count && by_tier.micro.count) {
    const premium = costPerEngagement('macro') / costPerEngagement('micro')
    if (premium > 1.5 && Number.isFinite(premium)) {
      flags.push({ severity: 'info', code: 'macro_cpe_premium',
        message: `Macro creators cost ${premium.toFixed(1)}× more per engagement than micro creators.` })
    }
  }
  return flags
}
