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
  // Location — creators are India-only; city is used for the optional city filter.
  country?: string
  city?: string
  // True ONLY for accounts confirmed to exist via the live API (real, public,
  // not private). Generated/demo creators are false so the UI never links to a
  // non-existent Instagram profile.
  verified?: boolean
}

export interface Influencer extends RawCreatorSignals {
  id: string
  tier: Tier
  cost_min: number
  cost_max: number
}
