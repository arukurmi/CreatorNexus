import type { Influencer } from '../../types/index.js'
import { NICHES } from '../../types/index.js'
import type { InfluencerProvider } from '../rapidapi/InfluencerProvider.js'
import { getPricedCreators } from '../influencerService.js'
import { influencerCost } from '../allocationService.js'
import type { AiAdvisory, AiStrategyResult, Candidate } from './types.js'

export interface StrategyClient { generate(prompt: string, schema: object): Promise<unknown> }

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    recommended_niche: { type: 'STRING' },
    secondary_niches: { type: 'ARRAY', items: { type: 'STRING' } },
    tier_mix: {
      type: 'OBJECT',
      properties: { nano: { type: 'NUMBER' }, micro: { type: 'NUMBER' }, macro: { type: 'NUMBER' } },
    },
    rationale: { type: 'STRING' },
    target_audience: { type: 'STRING' },
    content_ideas: { type: 'ARRAY', items: { type: 'STRING' } },
    selected_creator_ids: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['recommended_niche', 'tier_mix', 'rationale', 'target_audience', 'content_ideas', 'selected_creator_ids'],
}

export async function buildCandidates(perNiche = 8, provider?: InfluencerProvider) {
  const byId = new Map<string, Influencer>()
  const candidates: Candidate[] = []
  for (const niche of NICHES) {
    const priced = await getPricedCreators(niche, provider ? { provider } : {})
    for (const c of priced.slice(0, perNiche)) {
      byId.set(c.id, c)
      candidates.push({
        id: c.id, handle: c.handle, niche: c.niche, tier: c.tier,
        followers: c.followers, engagement_rate: c.engagement_rate,
        city: c.city, cost_mid: influencerCost(c),
      })
    }
  }
  return { candidates, byId }
}

function buildPrompt(brief: string, candidates: Candidate[]): string {
  // Compact CSV (id,niche,tier,followers,engagement%) — far fewer tokens than JSON.
  // We only send what the model needs to PICK; handle/city/cost are mapped by id later.
  const rows = candidates
    .map((c) => `${c.id},${c.niche},${c.tier},${c.followers},${(c.engagement_rate * 100).toFixed(1)}`)
    .join('\n')
  return [
    'You are an influencer-marketing strategist for Indian D2C brands.',
    'Pick 6-12 creators (by their exact id) that best fit the campaign brief, matching the tier_mix you recommend.',
    `recommended_niche MUST be one of: ${NICHES.join(', ')}.`,
    'CREATORS as CSV "id,niche,tier,followers,engagement%":',
    rows,
    `BRIEF: ${brief}`,
  ].join('\n')
}

export async function getStrategy(
  brief: string,
  opts: { client: StrategyClient; provider?: InfluencerProvider },
): Promise<AiStrategyResult> {
  const { candidates, byId } = await buildCandidates(8, opts.provider)
  const raw = (await opts.client.generate(buildPrompt(brief, candidates), RESPONSE_SCHEMA)) as AiAdvisory

  const niche = (NICHES as readonly string[]).includes(raw.recommended_niche)
    ? raw.recommended_niche
    : NICHES[0]
  const secondary = (raw.secondary_niches ?? []).filter((n) => (NICHES as readonly string[]).includes(n))
  const ids = Array.isArray(raw.selected_creator_ids) ? raw.selected_creator_ids : []
  const creators = ids.map((id) => byId.get(id)).filter((c): c is Influencer => !!c)

  return {
    advisory: {
      recommended_niche: niche,
      secondary_niches: secondary,
      tier_mix: raw.tier_mix ?? { nano: 60, micro: 30, macro: 10 },
      rationale: raw.rationale ?? '',
      target_audience: raw.target_audience ?? '',
      content_ideas: Array.isArray(raw.content_ideas) ? raw.content_ideas : [],
      selected_creator_ids: ids,
    },
    creators,
  }
}
