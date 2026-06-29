import type { Influencer } from './types'

export interface Advisory {
  recommended_niche: string
  secondary_niches: string[]
  tier_mix: { nano: number; micro: number; macro: number }
  rationale: string
  target_audience: string
  content_ideas: string[]
  selected_creator_ids: string[]
}
export interface AiResult { advisory: Advisory; creators: Influencer[] }

interface Opts { base?: string; fetchFn?: typeof fetch; signal?: AbortSignal }

export async function getAiStrategy(brief: string, token: string, opts: Opts = {}): Promise<AiResult> {
  const base = opts.base ?? process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000'
  const f = opts.fetchFn ?? fetch
  const res = await f(`${base}/api/ai/strategy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ brief }),
    signal: opts.signal,
  })
  if (!res.ok) throw new Error(`ai strategy failed: ${res.status}`)
  return res.json() as Promise<AiResult>
}
