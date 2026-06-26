import type { Influencer, Niche } from '../types/index.js'
import type { InfluencerProvider } from './rapidapi/InfluencerProvider.js'
import { getProvider } from './rapidapi/RapidApiProvider.js'
import { getCacheStore } from './redis.js'
import { CachingProvider } from './rapidapi/CachingProvider.js'
import { getTier } from '../lib/tier.js'
import { getPricer } from './pricing/index.js'
import { resolvePricingConfig, type ResolveCtx } from '../config/pricingConfig.js'
import { hashString } from '../lib/prng.js'

interface Opts { provider?: InfluencerProvider; ctx?: ResolveCtx }

export async function getPricedCreators(niche: Niche, opts: Opts = {}): Promise<Influencer[]> {
  const provider = opts.provider ?? new CachingProvider(getProvider(), getCacheStore())
  const cfg = resolvePricingConfig(opts.ctx)
  const pricer = getPricer(cfg.model)
  const raw = await provider.getByNiche(niche)
  return raw.map((s) => {
    const { cost_min, cost_max } = pricer.price(s, cfg)
    return { ...s, id: `${niche}-${hashString(s.handle)}`, tier: getTier(s.followers), cost_min, cost_max }
  })
}
