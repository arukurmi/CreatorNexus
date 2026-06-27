import type { InfluencerProvider } from './InfluencerProvider.js'
import type { Niche, RawCreatorSignals } from '../../types/index.js'
import { seeded, hashString } from '../../lib/prng.js'
import { NICHE_PREFIXES, SUFFIXES, INDIAN_CITIES, COUNTRY } from './handles.js'

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
        const likesRate = 0.015 + 0.08 * rnd()                 // 1.5%–9.5% of followers
        const avg_likes = Math.max(1, Math.round(followers * likesRate))
        const avg_comments = Math.max(1, Math.round(avg_likes * (0.02 + 0.05 * rnd())))
        const engagement_rate = +(((avg_likes + avg_comments) / followers).toFixed(4))
        const avg_views = Math.max(1, Math.round(followers * (0.25 + 0.6 * rnd())))
        const handle = `${prefixes[i % prefixes.length]}${SUFFIXES[i % SUFFIXES.length]}${i}`
        // verified:false — these are synthetic demo accounts that do NOT exist on
        // Instagram, so the UI must not link to them. City lets the filter work.
        out.push({
          handle, avatar_url: `https://i.pravatar.cc/150?u=${handle}`,
          followers, avg_views, avg_likes, avg_comments, engagement_rate, niche,
          country: COUNTRY, city: INDIAN_CITIES[i % INDIAN_CITIES.length], verified: false,
        })
      }
    }
    return out
  }
}
