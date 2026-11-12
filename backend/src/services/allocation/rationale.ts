import type { AllocationStrategy, Influencer } from '../../types/index.js'
import type { AllocationResult } from './types.js'
import { groupByTier, TIER_ORDER } from './bucketing.js'
import { engagementStrategy } from './engagement.js'
import { getStrategy } from './index.js'
import { rupees } from './diagnostics.js'
import { greedyPick, influencerCost } from '../allocationService.js'

const totalEngagement = (list: Influencer[]) => list.reduce((s, i) => s + engagementStrategy.score(i), 0)

export function allocationRationale(result: AllocationResult, creators: Influencer[], strategy: AllocationStrategy): string[] {
  const { by_tier, total_projected_spend: spend, leftover_budget, effective_budget } = result
  const pool = groupByTier(creators)
  const lines: string[] = []

  for (const tier of TIER_ORDER) {
    const { count, spend: tierSpend } = by_tier[tier]
    if (!tierSpend) continue
    const name = tier[0].toUpperCase() + tier.slice(1)
    lines.push(`${name} gets ${Math.round((tierSpend / spend) * 100)}% of spend across ${count} creator${count === 1 ? '' : 's'}.`)
  }

  for (const tier of TIER_ORDER) {
    if (!pool[tier].length || by_tier[tier].count) continue
    const cheapest = Math.min(...pool[tier].map(influencerCost))
    const reason = cheapest > effective_budget ? `costs ${rupees(cheapest)}, more than the whole ${rupees(effective_budget)} budget`
      : cheapest > leftover_budget ? `costs ${rupees(cheapest)}, more than the budget left for it`
      : 'ranked below the creators that filled the requested count'
    lines.push(`Skipped ${tier}: the cheapest ${tier} creator ${reason}.`)
  }

  if (strategy === 'count') return lines
  const { score } = getStrategy(strategy)
  const macroBudget = Math.round(effective_budget * 0.8)
  const baseline = totalEngagement([
    ...greedyPick(pool.macro, macroBudget, score), ...greedyPick(pool.micro, effective_budget - macroBudget, score),
  ])
  if (baseline > 0) {
    const delta = Math.round(((totalEngagement(result.selected) - baseline) / baseline) * 100)
    lines.push(`${delta >= 0 ? '+' : ''}${delta}% projected engagement vs a generic 80/20 macro/micro split.`)
  }
  return lines
}
