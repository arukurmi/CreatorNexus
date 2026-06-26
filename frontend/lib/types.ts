export type Niche =
  | 'pets'
  | 'fashion'
  | 'beauty'
  | 'food'
  | 'fitness'
  | 'travel'
  | 'tech'
  | 'gaming'
  | 'parenting'
  | 'finance'
  | 'home'
  | 'sustainability'
  | 'education'
  | 'comedy'

export type Tier = 'nano' | 'micro' | 'macro'

// How the budget allocator chooses creators:
// - reach:      most total views (favours larger creators) — exhausts budget
// - engagement: highest engagement rate (favours nano creators)
// - value:      best engagement × reach per rupee (bang for buck)
// - count:      a fixed number of creators (best engagement that fits)
export type AllocationStrategy = 'reach' | 'engagement' | 'value' | 'count'

export interface Influencer {
  id: string
  handle: string
  avatar_url: string
  followers: number
  avg_views: number
  engagement_rate: number // e.g. 0.045 = 4.5%
  cost_min: number // INR — lowest a creator is likely to quote
  cost_max: number // INR — highest a creator is likely to quote
  niche: Niche
  metadata?: Record<string, unknown> // future LLM embeddings / brand safety flags
}

export interface BucketResult {
  selected_influencers: Influencer[]
  total_projected_spend: number
  leftover_budget: number
}
