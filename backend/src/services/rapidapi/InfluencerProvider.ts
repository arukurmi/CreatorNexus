import type { Niche, RawCreatorSignals } from '../../types/index.js'
export interface InfluencerProvider {
  getByNiche(niche: Niche): Promise<RawCreatorSignals[]>
}
