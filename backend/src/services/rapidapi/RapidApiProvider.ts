import type { InfluencerProvider } from './InfluencerProvider.js'
import type { Niche, RawCreatorSignals } from '../../types/index.js'
import { GeneratedProvider } from './GeneratedProvider.js'
import { REAL_HANDLES } from './handles.js'
import { env } from '../../config/env.js'

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>
interface Opts { key: string; host: string; fetchFn?: FetchFn; debug?: boolean }

function avg(xs: number[]): number {
  const v = xs.filter((n) => Number.isFinite(n) && n > 0)
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0
}

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
 * Live provider for the RapidAPI "instagram-scraper-api2" product.
 * Per handle: GET /v1/info (followers, avatar) + GET /v1/posts (engagement).
 * Field extraction is defensive (multiple candidate paths under `data`) and
 * degrades gracefully — a profile that can't be read is skipped, not fatal.
 */
export class RapidApiProvider implements InfluencerProvider {
  private fetchFn: FetchFn
  private debug: boolean
  constructor(private opts: Opts) {
    this.fetchFn = opts.fetchFn ?? (globalThis.fetch as FetchFn)
    this.debug = opts.debug ?? false
  }

  private seedHandles(niche: Niche): string[] {
    return (REAL_HANDLES[niche] ?? []).slice(0, 12)
  }

  private async get(path: string, handle: string): Promise<unknown | null> {
    const url = `https://${this.opts.host}${path}?username_or_id_or_url=${encodeURIComponent(handle)}`
    const res = await this.fetchFn(url, {
      headers: { 'x-rapidapi-key': this.opts.key, 'x-rapidapi-host': this.opts.host },
    })
    if (!res.ok) {
      if (this.debug) console.warn(`[rapidapi] ${path} ${handle} → HTTP ${res.status}`)
      return null
    }
    return res.json()
  }

  private async fetchProfile(handle: string, niche: Niche): Promise<RawCreatorSignals | null> {
    try {
      const info = await this.get('/v1/info', handle)
      if (info == null) return null
      if (this.debug) console.warn(`[rapidapi] info(${handle})=`, JSON.stringify(info).slice(0, 500))
      const data = (info as Record<string, unknown>).data ?? info

      const followers = num(pick(data, [
        'follower_count', 'edge_followed_by.count', 'followers', 'user.follower_count', 'user.edge_followed_by.count',
      ]))
      if (!followers) return null
      const username = (pick(data, ['username', 'user.username']) as string) ?? handle
      const avatar_url = (pick(data, [
        'profile_pic_url_hd', 'profile_pic_url', 'hd_profile_pic_url_info.url', 'user.profile_pic_url',
      ]) as string) ?? `https://i.pravatar.cc/150?u=${handle}`

      // Recent posts → engagement. Best-effort; degrade to heuristics if unavailable.
      let avg_likes = 0, avg_comments = 0, avg_views = 0
      try {
        const posts = await this.get('/v1/posts', handle)
        const items = (pick(posts, ['data.items', 'items', 'data']) as unknown[]) ?? []
        const arr = Array.isArray(items) ? items : []
        avg_likes = avg(arr.map((p) => num(pick(p, ['like_count', 'edge_liked_by.count', 'likes']))))
        avg_comments = avg(arr.map((p) => num(pick(p, ['comment_count', 'edge_media_to_comment.count', 'comments']))))
        avg_views = avg(arr.map((p) => num(pick(p, ['play_count', 'view_count', 'ig_play_count', 'video_view_count']))))
      } catch { /* posts optional */ }

      // Fallbacks so every resolved profile yields valid, positive signals.
      if (avg_likes === 0) avg_likes = Math.max(1, Math.round(followers * 0.03))
      if (avg_comments === 0) avg_comments = Math.max(1, Math.round(avg_likes * 0.03))
      if (avg_views === 0) avg_views = Math.max(1, Math.round(followers * 0.4))
      const engagement_rate = +(((avg_likes + avg_comments) / followers).toFixed(4))

      return { handle: username, avatar_url, followers, avg_views, avg_likes, avg_comments, engagement_rate, niche }
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
