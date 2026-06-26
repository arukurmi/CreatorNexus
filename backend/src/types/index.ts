export type Niche =
  | 'pets' | 'fashion' | 'beauty' | 'food' | 'fitness' | 'travel' | 'tech'
  | 'gaming' | 'parenting' | 'finance' | 'home' | 'sustainability'
  | 'education' | 'comedy'

export const NICHES: readonly Niche[] = [
  'pets','fashion','beauty','food','fitness','travel','tech','gaming',
  'parenting','finance','home','sustainability','education','comedy',
]

export type Tier = 'nano' | 'micro' | 'macro'
export type AllocationStrategy = 'reach' | 'engagement' | 'value' | 'count'

export interface RawCreatorSignals {
  handle: string
  avatar_url: string
  followers: number
  avg_views: number
  avg_likes: number
  avg_comments: number
  engagement_rate: number
  niche: Niche
}

export interface Influencer extends RawCreatorSignals {
  id: string
  tier: Tier
  cost_min: number
  cost_max: number
}
