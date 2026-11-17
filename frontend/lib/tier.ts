import { Tier } from './types'

// Standard creator-economy follower brackets used by Instagram marketers.
export function getTier(followers: number): Tier {
  if (followers < 10_000) return 'nano'
  if (followers < 100_000) return 'micro'
  return 'macro'
}

export interface TierMeta {
  label: string
  range: string
  emoji: string
  blurb: string
  // Tailwind classes for the tier badge/band accent
  badge: string
  band: string
  bar: string
}

export const TIER_META: Record<Tier, TierMeta> = {
  nano: {
    label: 'Nano',
    range: '1K–10K followers',
    emoji: '🌱',
    blurb: 'Tiny audience, highest trust & engagement. Great value per rupee.',
    badge: 'bg-secondary/50 text-foreground/80 ring-secondary',
    band: 'from-secondary/40',
    /** Darker than `secondary`, which is too pale to see against the white card. */
    bar: 'bg-[#689F38]',
  },
  micro: {
    label: 'Micro',
    range: '10K–100K followers',
    emoji: '⭐',
    blurb: 'Niche communities with strong, loyal engagement.',
    badge: 'bg-blue-50 text-blue-600 ring-blue-200',
    band: 'from-blue-100',
    bar: 'bg-blue-600',
  },
  macro: {
    label: 'Macro',
    range: '100K+ followers',
    emoji: '🚀',
    blurb: 'Wide reach for awareness campaigns. Higher cost.',
    badge: 'bg-primary/10 text-primary ring-primary/30',
    band: 'from-primary/20',
    bar: 'bg-primary',
  },
}

export const TIER_ORDER: Tier[] = ['nano', 'micro', 'macro']
