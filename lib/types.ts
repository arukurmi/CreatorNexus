export interface Influencer {
  id: string
  handle: string
  avatar_url: string
  followers: number
  avg_views: number
  engagement_rate: number // e.g. 0.045 = 4.5%
  estimated_cost: number // INR
  niche: 'pets' | 'fashion' | 'food' | 'fitness'
  metadata?: Record<string, unknown> // future LLM embeddings / brand safety flags
}

export interface BucketResult {
  selected_influencers: Influencer[]
  total_projected_spend: number
  leftover_budget: number
}
