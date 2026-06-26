import type { Tier } from '../types/index.js'

export const TIER_ORDER: Tier[] = ['nano', 'micro', 'macro']

export function getTier(followers: number): Tier {
  if (followers >= 100_000) return 'macro'
  if (followers >= 10_000) return 'micro'
  return 'nano'
}
