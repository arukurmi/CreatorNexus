import type { Tier } from '../types/index.js'

export interface PricingConfig {
  model: 'cpm' | 'weighted' | 'tier_flat'
  cpm: Record<Tier, number>
  engMultiplierK: number
  tierAvgEng: Record<Tier, number>
  spread: number
  weights: { followers: number; likes: number; eng: number; ctr: number }
  tierBands: Record<Tier, [number, number]>
  tierPerfRange: [number, number]
  weightedNormK: number
}

export const DEFAULT_PRICING: PricingConfig = {
  model: 'cpm',
  cpm: { nano: 150, micro: 300, macro: 550 },        // INR per 1000 views
  engMultiplierK: 4,
  tierAvgEng: { nano: 0.06, micro: 0.045, macro: 0.03 },
  spread: 0.2,
  weights: { followers: 0.02, likes: 1.2, eng: 50000, ctr: 30000 },
  tierBands: { nano: [1500, 9000], micro: [12000, 60000], macro: [90000, 600000] },
  tierPerfRange: [0.85, 1.2],
  weightedNormK: 50000,
}

function num(name: string, fallback: number, min = -Infinity): number {
  const raw = process.env[name]
  if (raw == null || raw.trim() === '') return fallback
  const n = Number(raw)
  return Number.isFinite(n) && n >= min ? n : fallback
}

export interface ResolveCtx { brandId?: string; userId?: string }

export function resolvePricingConfig(_ctx: ResolveCtx = {}): PricingConfig {
  // Chain: Redis(brand/user) [stub — added later] → env → defaults.
  const model = (process.env.PRICING_MODEL as PricingConfig['model']) || DEFAULT_PRICING.model
  const valid: PricingConfig['model'][] = ['cpm', 'weighted', 'tier_flat']
  return {
    model: valid.includes(model) ? model : DEFAULT_PRICING.model,
    cpm: {
      nano: num('CPM_NANO', DEFAULT_PRICING.cpm.nano, 1),
      micro: num('CPM_MICRO', DEFAULT_PRICING.cpm.micro, 1),
      macro: num('CPM_MACRO', DEFAULT_PRICING.cpm.macro, 1),
    },
    engMultiplierK: num('ENG_MULTIPLIER_K', DEFAULT_PRICING.engMultiplierK, 0),
    tierAvgEng: {
      nano: num('TIER_AVG_ENG_NANO', DEFAULT_PRICING.tierAvgEng.nano, 0.0001),
      micro: num('TIER_AVG_ENG_MICRO', DEFAULT_PRICING.tierAvgEng.micro, 0.0001),
      macro: num('TIER_AVG_ENG_MACRO', DEFAULT_PRICING.tierAvgEng.macro, 0.0001),
    },
    spread: num('PRICE_SPREAD', DEFAULT_PRICING.spread, 0),
    weights: {
      followers: num('W_FOLLOWERS', DEFAULT_PRICING.weights.followers, 0),
      likes: num('W_LIKES', DEFAULT_PRICING.weights.likes, 0),
      eng: num('W_ENG', DEFAULT_PRICING.weights.eng, 0),
      ctr: num('W_CTR', DEFAULT_PRICING.weights.ctr, 0),
    },
    tierBands: {
      nano: [num('TIER_BAND_NANO_MIN', DEFAULT_PRICING.tierBands.nano[0], 1), num('TIER_BAND_NANO_MAX', DEFAULT_PRICING.tierBands.nano[1], 1)],
      micro: [num('TIER_BAND_MICRO_MIN', DEFAULT_PRICING.tierBands.micro[0], 1), num('TIER_BAND_MICRO_MAX', DEFAULT_PRICING.tierBands.micro[1], 1)],
      macro: [num('TIER_BAND_MACRO_MIN', DEFAULT_PRICING.tierBands.macro[0], 1), num('TIER_BAND_MACRO_MAX', DEFAULT_PRICING.tierBands.macro[1], 1)],
    },
    tierPerfRange: [num('TIER_PERF_MIN', DEFAULT_PRICING.tierPerfRange[0], 0), num('TIER_PERF_MAX', DEFAULT_PRICING.tierPerfRange[1], 0)],
    weightedNormK: num('W_NORM_K', DEFAULT_PRICING.weightedNormK, 1),
  }
}
