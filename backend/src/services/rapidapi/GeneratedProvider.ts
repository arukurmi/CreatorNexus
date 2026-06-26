import type { InfluencerProvider } from './InfluencerProvider.js'
import type { Niche, RawCreatorSignals } from '../../types/index.js'
import { seeded, hashString } from '../../lib/prng.js'
import { NICHE_PREFIXES, SUFFIXES } from './handles.js'

const TIER_PLAN: Array<[min: number, max: number, count: number]> = [
  [2_000, 9_500, 8],     // nano
  [12_000, 95_000, 7],   // micro
  [120_000, 650_000, 5], // macro
]

export class GeneratedProvider implements InfluencerProvider {
  async getByNiche(niche: Niche): Promise<RawCreatorSignals[]> {
    const rnd = seeded(hashString(niche))
    const prefixes = NICHE_PREFIXES[niche]
    const out: RawCreatorSignals[] = []
    let i = 0
    for (const [lo, hi, count] of TIER_PLAN) {
      for (let k = 0; k < count; k++, i++) {
        const followers = Math.round(lo + (hi - lo) * rnd())
        const engagement_rate = +(0.015 + 0.08 * rnd()).toFixed(4) // 1.5%–9.5%
        const avg_views = Math.round(followers * (0.25 + 0.6 * rnd()))
        const avg_likes = Math.round(followers * engagement_rate * (0.7 + 0.3 * rnd()))
        const avg_comments = Math.round(avg_likes * (0.02 + 0.05 * rnd()))
        const handle = `${prefixes[i % prefixes.length]}${SUFFIXES[i % SUFFIXES.length]}${i}`
        out.push({
          handle, avatar_url: `https://i.pravatar.cc/150?u=${handle}`,
          followers, avg_views, avg_likes, avg_comments, engagement_rate, niche,
        })
      }
    }
    return out
  }
}
