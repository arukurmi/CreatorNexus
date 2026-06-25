import { Influencer, BucketResult } from './types'

function computeCost(influencer: Influencer): number {
  if (influencer.estimated_cost > 0) return influencer.estimated_cost
  return influencer.followers * 0.05 + (influencer.avg_views / 10) * 0.1
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
    const cost = computeCost(influencer)
    if (spent + cost <= targetBudget) {
      selected.push({ ...influencer, estimated_cost: cost })
      spent += cost
    }
  }

  return {
    selected_influencers: selected,
    total_projected_spend: spent,
    leftover_budget: targetBudget - spent,
  }
}
