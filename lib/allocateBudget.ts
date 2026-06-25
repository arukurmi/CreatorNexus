import { Influencer, BucketResult } from './types'

// A creator's quote is a range; we budget on the midpoint of that range.
export function influencerCost(influencer: Influencer): number {
  return (influencer.cost_min + influencer.cost_max) / 2
}

export function allocateBudget(
  influencers: Influencer[],
  targetBudget: number
): BucketResult {
  const sorted = [...influencers].sort(
    (a, b) => b.engagement_rate - a.engagement_rate
  )

  const selected: Influencer[] = []
  let spent = 0

  for (const influencer of sorted) {
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
