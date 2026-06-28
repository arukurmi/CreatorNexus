import type { InfluencerProvider } from './InfluencerProvider.js'
import type { Niche, RawCreatorSignals } from '../../types/index.js'
import { GeneratedProvider } from './GeneratedProvider.js'
import { REAL_HANDLES, COUNTRY, type CuratedCreator } from './handles.js'
import { env } from '../../config/env.js'

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>
interface Opts { key: string; host: string; fetchFn?: FetchFn; debug?: boolean; profilePath?: string }

// Tries several field paths because RapidAPI products nest data differently.
function pick(obj: unknown, paths: string[]): unknown {
  for (const path of paths) {
    let cur: unknown = obj
    let ok = true
    for (const seg of path.split('.')) {
      if (cur && typeof cur === 'object' && seg in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[seg]
      } else { ok = false; break }
    }
    if (ok && cur != null) return cur
  }
  return undefined
}

function num(v: unknown): number {
  const n = typeof v === 'string' ? Number(v) : (v as number)
  return Number.isFinite(n) ? n : 0
}

/**
 * Live provider for the RapidAPI "Instagram Scraper 2025" product
 * (host instagram-scraper-20251.p.rapidapi.com). ONE request per handle:
 * GET /userinfo/?username_or_id=<handle>&include_about=true&url_embed_safe=true
 * — deliberately no per-post call, to conserve the plan's monthly request quota.
 * Engagement is estimated from followers (the profile endpoint has no per-post
 * metrics). Field extraction is defensive; private/non-existent profiles are skipped.
 */
export class RapidApiProvider implements InfluencerProvider {
  private fetchFn: FetchFn
  private debug: boolean
  private profilePath: string
  constructor(private opts: Opts) {
    this.fetchFn = opts.fetchFn ?? (globalThis.fetch as FetchFn)
    this.debug = opts.debug ?? false
    this.profilePath = opts.profilePath ?? '/userinfo/'
  }

  private seedHandles(niche: Niche): CuratedCreator[] {
    return (REAL_HANDLES[niche] ?? []).slice(0, 12)
  }

  private async getInfo(handle: string): Promise<unknown | null> {
    const url =
      `https://${this.opts.host}${this.profilePath}` +
      `?username_or_id=${encodeURIComponent(handle)}&include_about=true&url_embed_safe=true`
    const res = await this.fetchFn(url, {
      headers: { 'x-rapidapi-key': this.opts.key, 'x-rapidapi-host': this.opts.host },
    })
    if (!res.ok) {
      if (this.debug) console.warn(`[rapidapi] userinfo ${handle} → HTTP ${res.status}`)
      return null
    }
    return res.json()
  }

  private async fetchProfile(creator: CuratedCreator, niche: Niche): Promise<RawCreatorSignals | null> {
    const handle = creator.handle
    try {
      const info = await this.getInfo(handle)
      if (info == null) return null
      if (this.debug) console.warn(`[rapidapi] info(${handle})=`, JSON.stringify(info).slice(0, 400))
      const data = (info as Record<string, unknown>).data ?? info

      // Skip private / non-existent accounts — a brand can't act on them.
      if (pick(data, ['is_private', 'user.is_private']) === true) return null

      const followers = num(pick(data, [
        'follower_count', 'edge_followed_by.count', 'followers', 'user.follower_count',
      ]))
      if (!followers) return null
      const username = (pick(data, ['username', 'user.username']) as string) ?? handle
      const avatar_url = (pick(data, [
        'profile_pic_url_hd', 'hd_profile_pic_url_info.url', 'profile_pic_url', 'user.profile_pic_url',
      ]) as string) ?? `https://i.pravatar.cc/150?u=${handle}`
      const country = (pick(data, ['about.country', 'country']) as string) || COUNTRY
      const city = (pick(data, ['location_data.city_name', 'city_name']) as string) || creator.city

      // Engagement estimated from followers (profile endpoint has no per-post metrics;
      // keeps it to ONE request per creator to conserve the monthly quota).
      const avg_likes = Math.max(1, Math.round(followers * 0.03))
      const avg_comments = Math.max(1, Math.round(avg_likes * 0.03))
      const avg_views = Math.max(1, Math.round(followers * 0.4))
      const engagement_rate = +(((avg_likes + avg_comments) / followers).toFixed(4))

      // verified: the profile resolved on the live API → real, public, openable.
      return {
        handle: username, avatar_url, followers, avg_views, avg_likes, avg_comments,
        engagement_rate, niche, country, city: city || undefined, verified: true,
      }
    } catch {
      return null
    }
  }

  async getByNiche(niche: Niche): Promise<RawCreatorSignals[]> {
    const results = await Promise.all(
      this.seedHandles(niche).map((c) => this.fetchProfile(c, niche)),
    )
    return results.filter((r): r is RawCreatorSignals => r !== null)
  }
}

/**
 * Returns the live RapidAPI provider when a key+host are configured, but wrapped
 * so that if the live API yields nothing (bad key, 403, all 404s, outage) the
 * niche degrades to the deterministic generated dataset — the app never shows an
 * empty page. With no key configured, the generated provider is used directly.
 */
export function getProvider(): InfluencerProvider {
  if (env.rapidApiKey && env.rapidApiHost) {
    const live = new RapidApiProvider({
      key: env.rapidApiKey,
      host: env.rapidApiHost,
      debug: env.rapidApiDebug,
      profilePath: env.rapidApiProfilePath,
    })
    const fallback = new GeneratedProvider()
    return {
      async getByNiche(niche) {
        const real = await live.getByNiche(niche)
        return real.length ? real : fallback.getByNiche(niche)
      },
    }
  }
  return new GeneratedProvider()
}
