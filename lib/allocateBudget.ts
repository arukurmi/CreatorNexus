import { Influencer, BucketResult, AllocationStrategy } from './types'

// A creator's quote is a range; we budget on the midpoint of that range.
export function influencerCost(influencer: Influencer): number {
  return (influencer.cost_min + influencer.cost_max) / 2
}

interface AllocateOptions {
  strategy?: AllocationStrategy
  maxCount?: number
}

// Score used to rank creators for a given strategy (higher = picked sooner).
function scoreFor(strategy: AllocationStrategy): (i: Influencer) => number {
  switch (strategy) {
    case 'engagement':
    case 'count':
      return (i) => i.engagement_rate
    case 'value':
      return (i) => (i.engagement_rate * i.avg_views) / influencerCost(i)
    case 'reach':
    default:
      return (i) => i.avg_views
  }
}

export function allocateBudget(
  influencers: Influencer[],
  targetBudget: number,
  options: AllocateOptions = {}
): BucketResult {
  const { strategy = 'reach', maxCount } = options
  const score = scoreFor(strategy)

  const sorted = [...influencers].sort((a, b) => score(b) - score(a))

  const selected: Influencer[] = []
  let spent = 0

  for (const influencer of sorted) {
    if (maxCount != null && selected.length >= maxCount) break
    const cost = influencerCost(influencer)
    if (spent + cost <= targetBudget) {
      selected.push(influencer)
      spent += cost
    }
  }

  return {
    selected_influencers: selected,
    total_projected_spend: spent,
    leftover_budget: targetBudget - spent,
  }
}
