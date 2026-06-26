import type { AllocationStrategy, Influencer, Tier } from '../types/index.js'
import { getStrategy } from './allocation/index.js'
import { BUFFER, type AllocationResult } from './allocation/types.js'
import { groupByTier, TIER_ORDER } from './allocation/bucketing.js'

export function influencerCost(i: Influencer): number {
  return Math.round((i.cost_min + i.cost_max) / 2)
}

interface Options { strategy: AllocationStrategy; count?: number }

// Greedy: best score-per-rupee first, within a budget, optionally capped to N.
function greedyPick(
  creators: Influencer[], budget: number, score: (i: Influencer) => number, cap?: number,
): Influencer[] {
  const ranked = [...creators]
    .map((i) => { const cost = influencerCost(i); return { i, cost, eff: score(i) / Math.max(1, cost) } })
    .sort((a, b) => b.eff - a.eff)
  const chosen: Influencer[] = []
  let spent = 0
  for (const { i, cost } of ranked) {
    if (cap != null && chosen.length >= cap) break
    if (spent + cost <= budget) { chosen.push(i); spent += cost }
  }
  return chosen
}

export function allocate(creators: Influencer[], budget: number, opts: Options): AllocationResult {
  const strat = getStrategy(opts.strategy)
  const bufferApplied = opts.strategy === 'engagement'
  const effective = Math.round(budget * (bufferApplied ? BUFFER : 1))

  let selected: Influencer[]
  if (opts.strategy === 'count') {
    selected = greedyPick(creators, effective, strat.score, Math.max(0, opts.count ?? 0))
  } else {
    // Split effective budget across tier buckets proportional to bucket size.
    // Use floor+remainder to ensure shares sum to EXACTLY effective (no rounding overshoot).
    const buckets = groupByTier(creators)
    const total = creators.length || 1
    selected = []
    const tiers = TIER_ORDER.filter((t) => buckets[t].length)
    let effectiveRemaining = effective
    for (let idx = 0; idx < tiers.length; idx++) {
      const tier = tiers[idx]
      const list = buckets[tier]
      const isLast = idx === tiers.length - 1
      const share = isLast ? effectiveRemaining : Math.floor(effective * (list.length / total))
      effectiveRemaining -= share
      selected.push(...greedyPick(list, share, strat.score))
    }
    // Second pass: spend any leftover across everything still unselected.
    const spent = selected.reduce((s, i) => s + influencerCost(i), 0)
    const remaining = creators.filter((c) => !selected.includes(c))
    selected.push(...greedyPick(remaining, effective - spent, strat.score))
  }

  const by_tier = { nano: { count: 0, spend: 0 }, micro: { count: 0, spend: 0 }, macro: { count: 0, spend: 0 } } as AllocationResult['by_tier']
  let spend = 0
  for (const i of selected) { const c = influencerCost(i); by_tier[i.tier].count++; by_tier[i.tier].spend += c; spend += c }

  return {
    selected, total_projected_spend: spend, leftover_budget: Math.max(0, effective - spend),
    effective_budget: effective, budget_buffer_applied: bufferApplied, by_tier,
  }
}
