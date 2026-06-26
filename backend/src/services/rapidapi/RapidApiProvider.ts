import type { InfluencerProvider } from './InfluencerProvider.js'
import type { Niche, RawCreatorSignals } from '../../types/index.js'
import { GeneratedProvider } from './GeneratedProvider.js'
import { NICHE_PREFIXES, SUFFIXES } from './handles.js'
import { env } from '../../config/env.js'

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>
interface Opts { key: string; host: string; fetchFn?: FetchFn }

function avg(xs: number[]): number {
  return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0
}

export class RapidApiProvider implements InfluencerProvider {
  private fetchFn: FetchFn
  constructor(private opts: Opts) {
    this.fetchFn = opts.fetchFn ?? (globalThis.fetch as FetchFn)
  }

  // The seed handles to look up for a niche (curated prefixes × suffixes).
  private seedHandles(niche: Niche): string[] {
    const out: string[] = []
    NICHE_PREFIXES[niche].forEach((p) => SUFFIXES.forEach((s) => out.push(`${p}${s}`)))
    return out.slice(0, 20)
  }

  private async fetchProfile(handle: string, niche: Niche): Promise<RawCreatorSignals | null> {
    try {
      const res = await this.fetchFn(`https://${this.opts.host}/profile?username=${handle}`, {
        headers: { 'x-rapidapi-key': this.opts.key, 'x-rapidapi-host': this.opts.host },
      })
      if (!res.ok) return null
      const j: any = await res.json()
      const followers: number = j?.edge_followed_by?.count ?? 0
      if (!followers) return null
      const posts: any[] = Array.isArray(j?.recent_posts) ? j.recent_posts : []
      const avg_likes = avg(posts.map((p) => p.like_count ?? 0))
      const avg_comments = avg(posts.map((p) => p.comment_count ?? 0))
      const avg_views = avg(posts.map((p) => p.view_count ?? 0)) || Math.round(followers * 0.4)
      const engagement_rate = +(((avg_likes + avg_comments) / followers)).toFixed(4)
      return {
        handle: j.username ?? handle,
        avatar_url: j.profile_pic_url ?? `https://i.pravatar.cc/150?u=${handle}`,
        followers, avg_views, avg_likes, avg_comments, engagement_rate, niche,
      }
    } catch {
      return null
    }
  }

  async getByNiche(niche: Niche): Promise<RawCreatorSignals[]> {
    const results = await Promise.all(
      this.seedHandles(niche).map((h) => this.fetchProfile(h, niche)),
    )
    return results.filter((r): r is RawCreatorSignals => r !== null)
  }
}

export function getProvider(): InfluencerProvider {
  if (env.rapidApiKey && env.rapidApiHost) {
    return new RapidApiProvider({ key: env.rapidApiKey, host: env.rapidApiHost })
  }
  return new GeneratedProvider()
}
