import { Niche } from './types'

export interface NicheMeta {
  value: Niche
  label: string
  emoji: string
}

// Main influencer-marketing content niches (researched, India-relevant).
// Future: each can expand into sub-niches.
export const NICHES: NicheMeta[] = [
  { value: 'pets', label: 'Pet Parents', emoji: '🐾' },
  { value: 'fashion', label: 'Fashion & Style', emoji: '👗' },
  { value: 'beauty', label: 'Beauty & Skincare', emoji: '💄' },
  { value: 'food', label: 'Food & Cooking', emoji: '🍜' },
  { value: 'fitness', label: 'Fitness & Wellness', emoji: '💪' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'tech', label: 'Tech & Gadgets', emoji: '📱' },
  { value: 'gaming', label: 'Gaming', emoji: '🎮' },
  { value: 'parenting', label: 'Parenting & Family', emoji: '👶' },
  { value: 'finance', label: 'Finance & Investing', emoji: '💰' },
  { value: 'home', label: 'Home & Decor', emoji: '🏡' },
  { value: 'sustainability', label: 'Sustainability', emoji: '🌱' },
  { value: 'education', label: 'Education', emoji: '📚' },
  { value: 'comedy', label: 'Comedy & Entertainment', emoji: '🎭' },
]

export const NICHE_LABEL: Record<Niche, string> = NICHES.reduce(
  (acc, n) => ({ ...acc, [n.value]: n.label }),
  {} as Record<Niche, string>
)
