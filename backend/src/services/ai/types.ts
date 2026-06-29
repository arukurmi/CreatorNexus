import type { Influencer } from '../../types/index.js'

export interface AiAdvisory {
  recommended_niche: string
  secondary_niches: string[]
  tier_mix: { nano: number; micro: number; macro: number }
  rationale: string
  target_audience: string
  content_ideas: string[]
  selected_creator_ids: string[]
}

export interface Candidate {
  id: string
  handle: string
  niche: string
  tier: string
  followers: number
  engagement_rate: number
  city?: string
  cost_mid: number
}

export interface AiStrategyResult {
  advisory: AiAdvisory
  creators: Influencer[]
}
