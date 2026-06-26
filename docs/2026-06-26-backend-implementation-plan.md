# Creator Nexus — Monorepo + Real Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the repo into `frontend/` (existing Next.js app) + a new `backend/` Express+TypeScript service that owns all auth, rate limiting, RapidAPI data fetching, cost-range pricing, bucketed budget allocation, and brand/campaign history.

**Architecture:** Strategy + Factory for the four pricing models and four allocation strategies, behind Facade service layers, fed by an Adapter-based InfluencerProvider Decorated with Redis caching, with Repository persistence (Supabase Postgres) and Express Middleware for auth (verify Supabase JWT) and rate limiting (Upstash). Frontend gives up all algorithms and renders API results.

**Tech Stack:** Express 4 + TypeScript, tsx (dev), Vitest 2 + Supertest, @supabase/supabase-js (service-role), @upstash/redis + @upstash/ratelimit, zod (validation), Next.js (frontend, unchanged).

## Global Constraints

- Project name is **Creator Nexus** (never "InstaBucket").
- Backend pins **vitest@^2.1.9** (Vitest 4 is incompatible with the Node here).
- All business logic (pricing, allocation, validation) lives **only in `backend/`**; the frontend calls the API.
- Tier brackets: **nano 1 000–9 999**, **micro 10 000–99 999**, **macro ≥100 000** followers.
- Niches (14): pets, fashion, beauty, food, fitness, travel, tech, gaming, parenting, finance, home, sustainability, education, comedy.
- `ctr_proxy = engagement_rate` (no scraper exposes real CTR).
- **Only** the `engagement` strategy uses effective budget = `total × 1.10`; it sets `budget_buffer_applied = true`. All others use `total` and `false`.
- Cost invariants for every priced creator: `cost_min > 0` and `cost_min < cost_max`.
- Pricing config resolves **Redis(stub) → env → defaults**; malformed env must fall back to defaults, never throw.
- Every protected route: missing/invalid JWT → **401**; accessing another user's resource → **403**; not found → **404**; validation failure → **400**.
- Commit messages under 15 words. Footer on git commits:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Tests must cover every happy path AND corner case (§11 of the spec), plus full e2e (Supertest) for every route.

---

## File Structure

```
CreatorNexus/
  frontend/                         ← existing Next.js app, moved wholesale
  backend/
    package.json  tsconfig.json  vitest.config.ts  .env.example
    src/
      server.ts  app.ts
      config/        env.ts  pricingConfig.ts
      types/         index.ts            (Niche, Tier, RawCreatorSignals, Influencer, …)
      lib/           tier.ts  prng.ts
      services/
        rapidapi/    InfluencerProvider.ts  GeneratedProvider.ts
                     RapidApiProvider.ts    CachingProvider.ts  handles.ts
        pricing/     types.ts  engagementMultiplier.ts  cpm.ts
                     weighted.ts  tierFlat.ts  index.ts
        allocation/  types.ts  bucketing.ts  reach.ts  engagement.ts
                     value.ts  count.ts  index.ts
        influencerService.ts  allocationService.ts
      middleware/    supabaseAuth.ts  rateLimit.ts  errorHandler.ts
      db/            supabase.ts  brandsRepo.ts  campaignsRepo.ts
      routes/        health.ts  auth.ts  influencers.ts  allocate.ts
                     brands.ts  campaigns.ts
    __tests__/       (unit + e2e mirror of src)
  docs/
```

---

### Task 1: Split into monorepo — move app into `frontend/`

**Files:**
- Move: everything currently at repo root (except `.git`, `docs/`) → `frontend/`

**Interfaces:**
- Produces: a working `frontend/` Next.js app; repo root now holds `frontend/` + `docs/`.

- [ ] **Step 1: Move the app**

```bash
mkdir -p frontend
git ls-files -z | grep -zZv '^docs/' | while IFS= read -r -d '' f; do
  mkdir -p "frontend/$(dirname "$f")"; git mv "$f" "frontend/$f";
done
# untracked build/dep dirs:
[ -d node_modules ] && mv node_modules frontend/ 2>/dev/null
[ -d .next ] && mv .next frontend/ 2>/dev/null
mv .env.local frontend/ 2>/dev/null || true
```

- [ ] **Step 2: Verify frontend still builds**

Run: `cd frontend && npm run build`
Expected: build succeeds (same as before the move).

- [ ] **Step 3: Verify frontend tests still pass**

Run: `cd frontend && npm test`
Expected: existing 11 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor: move Next.js app into frontend/ for monorepo split

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Scaffold the backend (Express app + health route)

**Files:**
- Create: `backend/package.json`, `backend/tsconfig.json`, `backend/vitest.config.ts`, `backend/.env.example`
- Create: `backend/src/app.ts`, `backend/src/server.ts`, `backend/src/routes/health.ts`
- Test: `backend/__tests__/health.e2e.test.ts`

**Interfaces:**
- Produces: `createApp(): Express` from `src/app.ts`; `GET /api/health → {status:'ok'}`.

- [ ] **Step 1: Create `backend/package.json`**

```json
{
  "name": "creator-nexus-backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.108.2",
    "@upstash/ratelimit": "^2.0.8",
    "@upstash/redis": "^1.38.0",
    "express": "^4.21.2",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20",
    "@types/supertest": "^6.0.2",
    "supertest": "^7.0.0",
    "tsx": "^4.19.2",
    "typescript": "^5",
    "vitest": "^2.1.9"
  }
}
```

- [ ] **Step 2: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node"]
  },
  "include": ["src", "__tests__"]
}
```

- [ ] **Step 3: Create `backend/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'node', include: ['__tests__/**/*.test.ts'] } })
```

- [ ] **Step 4: Create `backend/.env.example`**

```bash
PORT=4000
# Supabase (service role for DB; JWT verified with anon/JWKS)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
# RapidAPI (optional — falls back to generated data when absent)
RAPIDAPI_KEY=
RAPIDAPI_HOST=
# Pricing
PRICING_MODEL=cpm
```

- [ ] **Step 5: Write the failing e2e test** — `backend/__tests__/health.e2e.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(createApp()).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})
```

- [ ] **Step 6: Install deps + run test to confirm it fails**

Run: `cd backend && npm install && npm test`
Expected: FAIL (cannot find `../src/app`).

- [ ] **Step 7: Create `backend/src/routes/health.ts`**

```ts
import { Router } from 'express'
export const healthRouter = Router()
healthRouter.get('/health', (_req, res) => res.json({ status: 'ok' }))
```

- [ ] **Step 8: Create `backend/src/app.ts`**

```ts
import express, { type Express } from 'express'
import { healthRouter } from './routes/health.js'

export function createApp(): Express {
  const app = express()
  app.use(express.json())
  app.use('/api', healthRouter)
  return app
}
```

- [ ] **Step 9: Create `backend/src/server.ts`**

```ts
import { createApp } from './app.js'
const port = Number(process.env.PORT ?? 4000)
createApp().listen(port, () => console.log(`backend listening on :${port}`))
```

- [ ] **Step 10: Run test to verify it passes**

Run: `cd backend && npm test`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add backend && git commit -m "feat(backend): scaffold Express + TS app with health route

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Domain types + tier derivation

**Files:**
- Create: `backend/src/types/index.ts`, `backend/src/lib/tier.ts`
- Test: `backend/__tests__/tier.test.ts`

**Interfaces:**
- Produces:
  - `type Niche` (14 values), `type Tier = 'nano'|'micro'|'macro'`, `type AllocationStrategy = 'reach'|'engagement'|'value'|'count'`
  - `interface RawCreatorSignals { handle; avatar_url; followers; avg_views; avg_likes; avg_comments; engagement_rate; niche }`
  - `interface Influencer extends RawCreatorSignals { id; tier; cost_min; cost_max }`
  - `getTier(followers: number): Tier`, `TIER_ORDER: Tier[]`

- [ ] **Step 1: Write the failing test** — `backend/__tests__/tier.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { getTier } from '../src/lib/tier'

describe('getTier', () => {
  it('classifies boundaries', () => {
    expect(getTier(1000)).toBe('nano')
    expect(getTier(9999)).toBe('nano')
    expect(getTier(10000)).toBe('micro')
    expect(getTier(99999)).toBe('micro')
    expect(getTier(100000)).toBe('macro')
    expect(getTier(650000)).toBe('macro')
  })
  it('clamps below-nano to nano', () => {
    expect(getTier(0)).toBe('nano')
    expect(getTier(500)).toBe('nano')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test tier`
Expected: FAIL (cannot find `../src/lib/tier`).

- [ ] **Step 3: Create `backend/src/types/index.ts`**

```ts
export type Niche =
  | 'pets' | 'fashion' | 'beauty' | 'food' | 'fitness' | 'travel' | 'tech'
  | 'gaming' | 'parenting' | 'finance' | 'home' | 'sustainability'
  | 'education' | 'comedy'

export const NICHES: Niche[] = [
  'pets','fashion','beauty','food','fitness','travel','tech','gaming',
  'parenting','finance','home','sustainability','education','comedy',
]

export type Tier = 'nano' | 'micro' | 'macro'
export type AllocationStrategy = 'reach' | 'engagement' | 'value' | 'count'

export interface RawCreatorSignals {
  handle: string
  avatar_url: string
  followers: number
  avg_views: number
  avg_likes: number
  avg_comments: number
  engagement_rate: number
  niche: Niche
}

export interface Influencer extends RawCreatorSignals {
  id: string
  tier: Tier
  cost_min: number
  cost_max: number
}
```

- [ ] **Step 4: Create `backend/src/lib/tier.ts`**

```ts
import type { Tier } from '../types/index.js'

export const TIER_ORDER: Tier[] = ['nano', 'micro', 'macro']

export function getTier(followers: number): Tier {
  if (followers >= 100_000) return 'macro'
  if (followers >= 10_000) return 'micro'
  return 'nano'
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npm test tier`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend && git commit -m "feat(backend): domain types and tier derivation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Deterministic generated provider (no-key fallback)

**Files:**
- Create: `backend/src/lib/prng.ts`, `backend/src/services/rapidapi/InfluencerProvider.ts`, `backend/src/services/rapidapi/GeneratedProvider.ts`, `backend/src/services/rapidapi/handles.ts`
- Test: `backend/__tests__/generatedProvider.test.ts`

**Interfaces:**
- Produces:
  - `interface InfluencerProvider { getByNiche(niche: Niche): Promise<RawCreatorSignals[]> }`
  - `class GeneratedProvider implements InfluencerProvider` — deterministic, tier-consistent signals.
  - `seeded(seed: number): () => number`

- [ ] **Step 1: Write the failing test** — `backend/__tests__/generatedProvider.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { GeneratedProvider } from '../src/services/rapidapi/GeneratedProvider'
import { getTier } from '../src/lib/tier'

describe('GeneratedProvider', () => {
  const p = new GeneratedProvider()

  it('is deterministic across calls', async () => {
    const a = await p.getByNiche('fashion')
    const b = await p.getByNiche('fashion')
    expect(a).toEqual(b)
  })

  it('returns tier-consistent, valid signals for every niche', async () => {
    for (const niche of ['pets','tech','comedy'] as const) {
      const list = await p.getByNiche(niche)
      expect(list.length).toBeGreaterThanOrEqual(15)
      for (const c of list) {
        expect(c.niche).toBe(niche)
        expect(c.followers).toBeGreaterThan(0)
        expect(c.engagement_rate).toBeGreaterThan(0)
        expect(c.avg_views).toBeGreaterThan(0)
        // a creator's followers must map to a real tier bracket
        expect(['nano','micro','macro']).toContain(getTier(c.followers))
      }
    }
  })

  it('spans all three tiers', async () => {
    const list = await p.getByNiche('food')
    const tiers = new Set(list.map((c) => getTier(c.followers)))
    expect(tiers).toEqual(new Set(['nano','micro','macro']))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test generatedProvider`
Expected: FAIL.

- [ ] **Step 3: Create `backend/src/lib/prng.ts`**

```ts
// Mulberry32 — deterministic PRNG in [0,1).
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
```

- [ ] **Step 4: Create `backend/src/services/rapidapi/InfluencerProvider.ts`**

```ts
import type { Niche, RawCreatorSignals } from '../../types/index.js'
export interface InfluencerProvider {
  getByNiche(niche: Niche): Promise<RawCreatorSignals[]>
}
```

- [ ] **Step 5: Create `backend/src/services/rapidapi/handles.ts`**

```ts
import type { Niche } from '../../types/index.js'

// Curated handle prefixes per niche; suffixes shared. Used to synthesize
// stable handles for the generated provider and as the seed pool for real lookups.
export const NICHE_PREFIXES: Record<Niche, string[]> = {
  pets: ['paw','furry','whisker','tail'], fashion: ['style','thread','vogue','drape'],
  beauty: ['glow','blush','lumen','sheen'], food: ['spice','forknife','simmer','tandoor'],
  fitness: ['flex','pulse','stride','core'], travel: ['nomad','wander','voyage','trail'],
  tech: ['byte','circuit','pixel','stack'], gaming: ['respawn','loot','pixel','combo'],
  parenting: ['tinytot','momlife','cradle','nestful'], finance: ['rupee','ledger','vault','compound'],
  home: ['hearth','nest','decor','abode'], sustainability: ['evergreen','reuse','sprout','planet'],
  education: ['scholar','chalk','quanta','lexicon'], comedy: ['giggle','jest','meme','punchline'],
}
export const SUFFIXES = ['daily','diaries','official','hq','studio','co','india','tales']
```

- [ ] **Step 6: Create `backend/src/services/rapidapi/GeneratedProvider.ts`**

```ts
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
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && npm test generatedProvider`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend && git commit -m "feat(backend): deterministic generated influencer provider

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: RapidAPI provider (adapter) + selection

**Files:**
- Create: `backend/src/services/rapidapi/RapidApiProvider.ts`
- Create: `backend/src/config/env.ts`
- Test: `backend/__tests__/rapidApiProvider.test.ts`

**Interfaces:**
- Consumes: `InfluencerProvider`, `RawCreatorSignals`, `seeded/hashString`, `NICHE_PREFIXES`.
- Produces:
  - `class RapidApiProvider implements InfluencerProvider` (ctor `{ key, host, fetchFn? }`)
  - `getProvider(): InfluencerProvider` — returns RapidApi when key present, else Generated.
  - `env` object with typed accessors.

- [ ] **Step 1: Write the failing test** — `backend/__tests__/rapidApiProvider.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest'
import { RapidApiProvider } from '../src/services/rapidapi/RapidApiProvider'

const sampleProfile = {
  username: 'styledaily', profile_pic_url: 'http://x/y.jpg',
  edge_followed_by: { count: 54000 },
  recent_posts: [
    { like_count: 2600, comment_count: 110, view_count: 30000 },
    { like_count: 2400, comment_count: 90, view_count: 26000 },
  ],
}

describe('RapidApiProvider', () => {
  it('maps vendor payload to RawCreatorSignals', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true, json: async () => sampleProfile,
    } as Response)
    const p = new RapidApiProvider({ key: 'k', host: 'h', fetchFn })
    const list = await p.getByNiche('fashion')
    expect(list[0].handle).toBe('styledaily')
    expect(list[0].followers).toBe(54000)
    expect(list[0].avg_likes).toBe(2500)             // (2600+2400)/2
    expect(list[0].avg_comments).toBe(100)           // (110+90)/2
    expect(list[0].avg_views).toBe(28000)            // (30000+26000)/2
    expect(list[0].engagement_rate).toBeCloseTo((2500 + 100) / 54000, 4)
    expect(list[0].niche).toBe('fashion')
  })

  it('skips handles whose fetch fails, never throws', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      .mockResolvedValue({ ok: true, json: async () => sampleProfile } as Response)
    const p = new RapidApiProvider({ key: 'k', host: 'h', fetchFn })
    const list = await p.getByNiche('fashion')
    expect(Array.isArray(list)).toBe(true)
  })

  it('handles malformed JSON by skipping the creator', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true, json: async () => { throw new Error('bad json') },
    } as unknown as Response)
    const p = new RapidApiProvider({ key: 'k', host: 'h', fetchFn })
    await expect(p.getByNiche('fashion')).resolves.toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test rapidApiProvider`
Expected: FAIL.

- [ ] **Step 3: Create `backend/src/config/env.ts`**

```ts
export const env = {
  port: Number(process.env.PORT ?? 4000),
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET ?? '',
  upstashUrl: process.env.UPSTASH_REDIS_REST_URL ?? '',
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  rapidApiKey: process.env.RAPIDAPI_KEY ?? '',
  rapidApiHost: process.env.RAPIDAPI_HOST ?? '',
  pricingModel: process.env.PRICING_MODEL ?? 'cpm',
}
```

- [ ] **Step 4: Create `backend/src/services/rapidapi/RapidApiProvider.ts`**

```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npm test rapidApiProvider`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend && git commit -m "feat(backend): RapidAPI provider adapter with generated fallback

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Caching decorator (Redis)

**Files:**
- Create: `backend/src/services/redis.ts`, `backend/src/services/rapidapi/CachingProvider.ts`
- Test: `backend/__tests__/cachingProvider.test.ts`

**Interfaces:**
- Consumes: `InfluencerProvider`.
- Produces:
  - `interface CacheStore { get(k): Promise<string|null>; set(k, v, ttlSec): Promise<void> }`
  - `class CachingProvider implements InfluencerProvider` (ctor `(inner, store, ttlSec?)`).

- [ ] **Step 1: Write the failing test** — `backend/__tests__/cachingProvider.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest'
import { CachingProvider, type CacheStore } from '../src/services/rapidapi/CachingProvider'
import type { InfluencerProvider } from '../src/services/rapidapi/InfluencerProvider'

function memoryStore(): CacheStore {
  const m = new Map<string, string>()
  return { get: async (k) => m.get(k) ?? null, set: async (k, v) => void m.set(k, v) }
}

describe('CachingProvider', () => {
  it('caches by niche: inner called once across two reads', async () => {
    const inner: InfluencerProvider = {
      getByNiche: vi.fn().mockResolvedValue([{ handle: 'a', followers: 1, avatar_url: '', avg_views: 1, avg_likes: 1, avg_comments: 0, engagement_rate: 0.5, niche: 'tech' }]),
    }
    const p = new CachingProvider(inner, memoryStore())
    const first = await p.getByNiche('tech')
    const second = await p.getByNiche('tech')
    expect(second).toEqual(first)
    expect(inner.getByNiche).toHaveBeenCalledTimes(1)
  })

  it('refetches on cache miss for a different niche', async () => {
    const inner: InfluencerProvider = { getByNiche: vi.fn().mockResolvedValue([]) }
    const p = new CachingProvider(inner, memoryStore())
    await p.getByNiche('tech'); await p.getByNiche('food')
    expect(inner.getByNiche).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test cachingProvider`
Expected: FAIL.

- [ ] **Step 3: Create `backend/src/services/rapidapi/CachingProvider.ts`**

```ts
import type { InfluencerProvider } from './InfluencerProvider.js'
import type { Niche, RawCreatorSignals } from '../../types/index.js'

export interface CacheStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSec?: number): Promise<void>
}

export class CachingProvider implements InfluencerProvider {
  constructor(
    private inner: InfluencerProvider,
    private store: CacheStore,
    private ttlSec = 3600,
  ) {}

  async getByNiche(niche: Niche): Promise<RawCreatorSignals[]> {
    const key = `creators:${niche}`
    const hit = await this.store.get(key)
    if (hit) return JSON.parse(hit) as RawCreatorSignals[]
    const fresh = await this.inner.getByNiche(niche)
    await this.store.set(key, JSON.stringify(fresh), this.ttlSec)
    return fresh
  }
}
```

- [ ] **Step 4: Create `backend/src/services/redis.ts`**

```ts
import { Redis } from '@upstash/redis'
import type { CacheStore } from './rapidapi/CachingProvider.js'
import { env } from '../config/env.js'

let client: Redis | null = null
export function getRedis(): Redis | null {
  if (!env.upstashUrl || !env.upstashToken) return null
  if (!client) client = new Redis({ url: env.upstashUrl, token: env.upstashToken })
  return client
}

// A no-op store used when Redis is not configured (local/dev).
export function getCacheStore(): CacheStore {
  const r = getRedis()
  if (!r) return { get: async () => null, set: async () => {} }
  return {
    get: (k) => r.get<string>(k).then((v) => (v == null ? null : String(v))),
    set: async (k, v, ttl) => void (await r.set(k, v, ttl ? { ex: ttl } : undefined)),
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npm test cachingProvider`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend && git commit -m "feat(backend): Redis caching decorator for providers

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Pricing config resolver

**Files:**
- Create: `backend/src/config/pricingConfig.ts`
- Test: `backend/__tests__/pricingConfig.test.ts`

**Interfaces:**
- Produces:
  - `interface PricingConfig { model; cpm:{nano;micro;macro}; engMultiplierK; tierAvgEng:{nano;micro;macro}; spread; weights:{followers;likes;eng;ctr}; tierBands:{nano:[n,n];micro:[n,n];macro:[n,n]}; tierPerfRange:[n,n] }`
  - `interface ResolveCtx { brandId?: string; userId?: string }`
  - `resolvePricingConfig(ctx?: ResolveCtx): PricingConfig`
  - `DEFAULT_PRICING: PricingConfig`

- [ ] **Step 1: Write the failing test** — `backend/__tests__/pricingConfig.test.ts`

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { resolvePricingConfig, DEFAULT_PRICING } from '../src/config/pricingConfig'

describe('resolvePricingConfig', () => {
  const saved = { ...process.env }
  beforeEach(() => { process.env = { ...saved } })
  afterEach(() => { process.env = { ...saved } })

  it('uses defaults when env empty', () => {
    delete process.env.CPM_MICRO; delete process.env.PRICING_MODEL
    expect(resolvePricingConfig().cpm.micro).toBe(DEFAULT_PRICING.cpm.micro)
    expect(resolvePricingConfig().model).toBe('cpm')
  })

  it('env overrides defaults', () => {
    process.env.CPM_MICRO = '450'
    process.env.PRICING_MODEL = 'weighted'
    const cfg = resolvePricingConfig()
    expect(cfg.cpm.micro).toBe(450)
    expect(cfg.model).toBe('weighted')
  })

  it('malformed env falls back to default, never throws', () => {
    process.env.CPM_MICRO = 'not-a-number'
    process.env.PRICE_SPREAD = ''
    expect(() => resolvePricingConfig()).not.toThrow()
    expect(resolvePricingConfig().cpm.micro).toBe(DEFAULT_PRICING.cpm.micro)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test pricingConfig`
Expected: FAIL.

- [ ] **Step 3: Create `backend/src/config/pricingConfig.ts`**

```ts
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
}

function num(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw == null || raw.trim() === '') return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

export interface ResolveCtx { brandId?: string; userId?: string }

export function resolvePricingConfig(_ctx: ResolveCtx = {}): PricingConfig {
  // Chain: Redis(brand/user) [stub — added later] → env → defaults.
  const model = (process.env.PRICING_MODEL as PricingConfig['model']) || DEFAULT_PRICING.model
  const valid: PricingConfig['model'][] = ['cpm', 'weighted', 'tier_flat']
  return {
    model: valid.includes(model) ? model : DEFAULT_PRICING.model,
    cpm: {
      nano: num('CPM_NANO', DEFAULT_PRICING.cpm.nano),
      micro: num('CPM_MICRO', DEFAULT_PRICING.cpm.micro),
      macro: num('CPM_MACRO', DEFAULT_PRICING.cpm.macro),
    },
    engMultiplierK: num('ENG_MULTIPLIER_K', DEFAULT_PRICING.engMultiplierK),
    tierAvgEng: {
      nano: num('TIER_AVG_ENG_NANO', DEFAULT_PRICING.tierAvgEng.nano),
      micro: num('TIER_AVG_ENG_MICRO', DEFAULT_PRICING.tierAvgEng.micro),
      macro: num('TIER_AVG_ENG_MACRO', DEFAULT_PRICING.tierAvgEng.macro),
    },
    spread: num('PRICE_SPREAD', DEFAULT_PRICING.spread),
    weights: {
      followers: num('W_FOLLOWERS', DEFAULT_PRICING.weights.followers),
      likes: num('W_LIKES', DEFAULT_PRICING.weights.likes),
      eng: num('W_ENG', DEFAULT_PRICING.weights.eng),
      ctr: num('W_CTR', DEFAULT_PRICING.weights.ctr),
    },
    tierBands: {
      nano: [num('TIER_BAND_NANO_MIN', DEFAULT_PRICING.tierBands.nano[0]), num('TIER_BAND_NANO_MAX', DEFAULT_PRICING.tierBands.nano[1])],
      micro: [num('TIER_BAND_MICRO_MIN', DEFAULT_PRICING.tierBands.micro[0]), num('TIER_BAND_MICRO_MAX', DEFAULT_PRICING.tierBands.micro[1])],
      macro: [num('TIER_BAND_MACRO_MIN', DEFAULT_PRICING.tierBands.macro[0]), num('TIER_BAND_MACRO_MAX', DEFAULT_PRICING.tierBands.macro[1])],
    },
    tierPerfRange: [num('TIER_PERF_MIN', DEFAULT_PRICING.tierPerfRange[0]), num('TIER_PERF_MAX', DEFAULT_PRICING.tierPerfRange[1])],
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test pricingConfig`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend && git commit -m "feat(backend): env-driven pricing config resolver with defaults

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Pricing models (engagement multiplier, cpm, weighted, tierFlat) + registry

**Files:**
- Create: `backend/src/services/pricing/types.ts`, `engagementMultiplier.ts`, `cpm.ts`, `weighted.ts`, `tierFlat.ts`, `index.ts`
- Test: `backend/__tests__/pricing.test.ts`

**Interfaces:**
- Consumes: `PricingConfig`, `RawCreatorSignals`, `getTier`.
- Produces:
  - `interface Pricer { price(s: RawCreatorSignals, cfg: PricingConfig): { cost_min; cost_max } }`
  - `engagementMultiplier(engRate, tier, cfg): number`
  - `cpmPricer`, `weightedPricer`, `tierFlatPricer` (all `Pricer`)
  - `getPricer(model: PricingConfig['model']): Pricer`

- [ ] **Step 1: Write the failing test** — `backend/__tests__/pricing.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { engagementMultiplier } from '../src/services/pricing/engagementMultiplier'
import { getPricer } from '../src/services/pricing'
import { DEFAULT_PRICING } from '../src/config/pricingConfig'
import type { RawCreatorSignals } from '../src/types'

const micro = (over: Partial<RawCreatorSignals> = {}): RawCreatorSignals => ({
  handle: 'x', avatar_url: '', followers: 50000, avg_views: 20000,
  avg_likes: 2200, avg_comments: 100, engagement_rate: 0.046, niche: 'fashion', ...over,
})

describe('engagementMultiplier', () => {
  it('is 1 at tier average', () => {
    expect(engagementMultiplier(0.045, 'micro', DEFAULT_PRICING)).toBeCloseTo(1, 5)
  })
  it('is >1 above average and <1 below', () => {
    expect(engagementMultiplier(0.07, 'micro', DEFAULT_PRICING)).toBeGreaterThan(1)
    expect(engagementMultiplier(0.02, 'micro', DEFAULT_PRICING)).toBeLessThan(1)
  })
  it('never goes non-positive even at zero engagement', () => {
    expect(engagementMultiplier(0, 'micro', DEFAULT_PRICING)).toBeGreaterThan(0)
  })
})

describe('pricers obey invariants', () => {
  for (const model of ['cpm', 'weighted', 'tier_flat'] as const) {
    it(`${model}: cost_min < cost_max and both > 0`, () => {
      const { cost_min, cost_max } = getPricer(model).price(micro(), DEFAULT_PRICING)
      expect(cost_min).toBeGreaterThan(0)
      expect(cost_min).toBeLessThan(cost_max)
    })
    it(`${model}: corner cases (0 followers/views/eng) never crash or go negative`, () => {
      const r = getPricer(model).price(
        micro({ followers: 0, avg_views: 0, avg_likes: 0, avg_comments: 0, engagement_rate: 0 }),
        DEFAULT_PRICING,
      )
      expect(r.cost_min).toBeGreaterThan(0)
      expect(r.cost_min).toBeLessThan(r.cost_max)
    })
  }
})

describe('cpm pricing magnitude', () => {
  it('prices a typical micro creator in a sane INR band', () => {
    const { cost_min, cost_max } = getPricer('cpm').price(micro(), DEFAULT_PRICING)
    expect(cost_min).toBeGreaterThan(1000)
    expect(cost_max).toBeLessThan(500000)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test pricing`
Expected: FAIL.

- [ ] **Step 3: Create `backend/src/services/pricing/types.ts`**

```ts
import type { RawCreatorSignals } from '../../types/index.js'
import type { PricingConfig } from '../../config/pricingConfig.js'
export interface PriceRange { cost_min: number; cost_max: number }
export interface Pricer { price(s: RawCreatorSignals, cfg: PricingConfig): PriceRange }
export const MIN_FLOOR = 500 // never price below ₹500
```

- [ ] **Step 4: Create `backend/src/services/pricing/engagementMultiplier.ts`**

```ts
import type { Tier } from '../../types/index.js'
import type { PricingConfig } from '../../config/pricingConfig.js'

// 1 at the tier average; rises/falls with deviation; clamped to a positive band.
export function engagementMultiplier(engRate: number, tier: Tier, cfg: PricingConfig): number {
  const factor = 1 + cfg.engMultiplierK * (engRate - cfg.tierAvgEng[tier])
  return Math.min(2.5, Math.max(0.4, factor))
}
```

- [ ] **Step 5: Create `backend/src/services/pricing/cpm.ts`**

```ts
import type { Pricer } from './types.js'
import { MIN_FLOOR } from './types.js'
import { getTier } from '../../lib/tier.js'
import { engagementMultiplier } from './engagementMultiplier.js'

export const cpmPricer: Pricer = {
  price(s, cfg) {
    const tier = getTier(s.followers)
    const views = s.avg_views > 0 ? s.avg_views : Math.max(s.followers * 0.4, 500)
    const base = (views / 1000) * cfg.cpm[tier]
    const mid = Math.max(MIN_FLOOR * 1.5, base * engagementMultiplier(s.engagement_rate, tier, cfg))
    return {
      cost_min: Math.max(MIN_FLOOR, Math.round(mid * (1 - cfg.spread))),
      cost_max: Math.round(mid * (1 + cfg.spread)),
    }
  },
}
```

- [ ] **Step 6: Create `backend/src/services/pricing/weighted.ts`**

```ts
import type { Pricer } from './types.js'
import { MIN_FLOOR } from './types.js'
import { getTier } from '../../lib/tier.js'

export const weightedPricer: Pricer = {
  price(s, cfg) {
    const ctrProxy = s.engagement_rate
    const score =
      cfg.weights.followers * s.followers +
      cfg.weights.likes * s.avg_likes +
      cfg.weights.eng * s.engagement_rate +
      cfg.weights.ctr * ctrProxy
    const tier = getTier(s.followers)
    const [lo, hi] = cfg.tierBands[tier]
    // Squash score into [0,1] then map into the tier band.
    const norm = score / (score + 50000)
    const mid = Math.max(MIN_FLOOR * 1.5, lo + (hi - lo) * norm)
    return {
      cost_min: Math.max(MIN_FLOOR, Math.round(mid * (1 - cfg.spread))),
      cost_max: Math.round(mid * (1 + cfg.spread)),
    }
  },
}
```

- [ ] **Step 7: Create `backend/src/services/pricing/tierFlat.ts`**

```ts
import type { Pricer } from './types.js'
import { MIN_FLOOR } from './types.js'
import { getTier } from '../../lib/tier.js'

export const tierFlatPricer: Pricer = {
  price(s, cfg) {
    const tier = getTier(s.followers)
    const [lo, hi] = cfg.tierBands[tier]
    // Performance score from engagement vs tier average, in [0,1].
    const perf = Math.min(1, Math.max(0, s.engagement_rate / (cfg.tierAvgEng[tier] * 2)))
    const mid = lo + (hi - lo) * perf
    const [pMin, pMax] = cfg.tierPerfRange
    return {
      cost_min: Math.max(MIN_FLOOR, Math.round(mid * pMin)),
      cost_max: Math.round(Math.max(mid * pMax, MIN_FLOOR * 2)),
    }
  },
}
```

- [ ] **Step 8: Create `backend/src/services/pricing/index.ts`**

```ts
import type { Pricer } from './types.js'
import type { PricingConfig } from '../../config/pricingConfig.js'
import { cpmPricer } from './cpm.js'
import { weightedPricer } from './weighted.js'
import { tierFlatPricer } from './tierFlat.js'

const REGISTRY: Record<PricingConfig['model'], Pricer> = {
  cpm: cpmPricer, weighted: weightedPricer, tier_flat: tierFlatPricer,
}
export function getPricer(model: PricingConfig['model']): Pricer {
  return REGISTRY[model] ?? cpmPricer
}
export type { Pricer, PriceRange } from './types.js'
```

- [ ] **Step 9: Run test to verify it passes**

Run: `cd backend && npm test pricing`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add backend && git commit -m "feat(backend): four pricing models with engagement multiplier and registry

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Influencer service (facade: provider → pricing)

**Files:**
- Create: `backend/src/services/influencerService.ts`
- Test: `backend/__tests__/influencerService.test.ts`

**Interfaces:**
- Consumes: `InfluencerProvider`, `getPricer`, `resolvePricingConfig`, `getTier`.
- Produces:
  - `getPricedCreators(niche: Niche, opts?: { provider?; ctx? }): Promise<Influencer[]>` — attaches `id`, `tier`, `cost_min`, `cost_max`.

- [ ] **Step 1: Write the failing test** — `backend/__tests__/influencerService.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { getPricedCreators } from '../src/services/influencerService'
import { GeneratedProvider } from '../src/services/rapidapi/GeneratedProvider'
import { getTier } from '../src/lib/tier'

describe('getPricedCreators', () => {
  it('prices every creator with valid range and derived tier', async () => {
    const list = await getPricedCreators('beauty', { provider: new GeneratedProvider() })
    expect(list.length).toBeGreaterThan(0)
    for (const c of list) {
      expect(c.id).toBeTruthy()
      expect(c.tier).toBe(getTier(c.followers))
      expect(c.cost_min).toBeGreaterThan(0)
      expect(c.cost_min).toBeLessThan(c.cost_max)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test influencerService`
Expected: FAIL.

- [ ] **Step 3: Create `backend/src/services/influencerService.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test influencerService`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend && git commit -m "feat(backend): influencer service facade pricing creators per niche

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: Allocation strategies + bucketing + service

**Files:**
- Create: `backend/src/services/allocation/types.ts`, `bucketing.ts`, `reach.ts`, `engagement.ts`, `value.ts`, `count.ts`, `index.ts`
- Create: `backend/src/services/allocationService.ts`
- Test: `backend/__tests__/allocation.test.ts`

**Interfaces:**
- Consumes: `Influencer`, `Tier`, `getTier`, `TIER_ORDER`, `AllocationStrategy`.
- Produces:
  - `influencerCost(i: Influencer): number` (range midpoint)
  - `interface AllocationResult { selected: Influencer[]; total_projected_spend; leftover_budget; effective_budget; budget_buffer_applied; by_tier: Record<Tier,{count;spend}> }`
  - `interface AllocStrategy { score(i: Influencer): number }`
  - `getStrategy(name): AllocStrategy`, `BUFFER = 1.1`
  - `allocate(creators, budget, { strategy, count? }): AllocationResult`

- [ ] **Step 1: Write the failing test** — `backend/__tests__/allocation.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { allocate, influencerCost } from '../src/services/allocationService'
import type { Influencer } from '../src/types'

function mk(id: string, followers: number, views: number, eng: number, min: number, max: number): Influencer {
  return { id, handle: id, avatar_url: '', followers, avg_views: views, avg_likes: 1, avg_comments: 0,
    engagement_rate: eng, niche: 'tech', tier: followers >= 100000 ? 'macro' : followers >= 10000 ? 'micro' : 'nano', cost_min: min, cost_max: max }
}
const pool: Influencer[] = [
  mk('nano1', 5000, 2000, 0.08, 1000, 2000),
  mk('nano2', 8000, 3000, 0.06, 1500, 2500),
  mk('micro1', 40000, 20000, 0.05, 8000, 12000),
  mk('macro1', 200000, 120000, 0.03, 80000, 120000),
]

describe('allocate', () => {
  it('reach: stays within total budget', () => {
    const r = allocate(pool, 50000, { strategy: 'reach' })
    expect(r.total_projected_spend).toBeLessThanOrEqual(50000)
    expect(r.budget_buffer_applied).toBe(false)
    expect(r.effective_budget).toBe(50000)
  })

  it('engagement: applies 1.10 buffer and may exceed slider total', () => {
    const r = allocate(pool, 10000, { strategy: 'engagement' })
    expect(r.effective_budget).toBe(11000)
    expect(r.budget_buffer_applied).toBe(true)
    expect(r.total_projected_spend).toBeLessThanOrEqual(11000)
  })

  it('value: selects within budget and reports by_tier', () => {
    const r = allocate(pool, 30000, { strategy: 'value' })
    expect(r.total_projected_spend).toBeLessThanOrEqual(30000)
    const tierSpend = r.by_tier.nano.spend + r.by_tier.micro.spend + r.by_tier.macro.spend
    expect(tierSpend).toBe(r.total_projected_spend)
  })

  it('count: returns at most N creators that fit', () => {
    const r = allocate(pool, 1_000_000, { strategy: 'count', count: 2 })
    expect(r.selected.length).toBeLessThanOrEqual(2)
  })

  it('corner: zero budget selects nothing', () => {
    const r = allocate(pool, 0, { strategy: 'reach' })
    expect(r.selected).toEqual([])
    expect(r.total_projected_spend).toBe(0)
    expect(r.leftover_budget).toBe(0)
  })

  it('corner: empty pool selects nothing', () => {
    const r = allocate([], 50000, { strategy: 'value' })
    expect(r.selected).toEqual([])
  })

  it('corner: budget below cheapest selects nothing', () => {
    const r = allocate(pool, 500, { strategy: 'reach' })
    expect(r.selected).toEqual([])
  })

  it('influencerCost is the range midpoint', () => {
    expect(influencerCost(pool[0])).toBe(1500)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test allocation`
Expected: FAIL.

- [ ] **Step 3: Create `backend/src/services/allocation/types.ts`**

```ts
import type { Influencer, Tier } from '../../types/index.js'
export interface AllocStrategy { score(i: Influencer): number }
export interface AllocationResult {
  selected: Influencer[]
  total_projected_spend: number
  leftover_budget: number
  effective_budget: number
  budget_buffer_applied: boolean
  by_tier: Record<Tier, { count: number; spend: number }>
}
export const BUFFER = 1.1
```

- [ ] **Step 4: Create the four strategy files**

`backend/src/services/allocation/reach.ts`
```ts
import type { AllocStrategy } from './types.js'
export const reachStrategy: AllocStrategy = { score: (i) => i.avg_views }
```

`backend/src/services/allocation/engagement.ts`
```ts
import type { AllocStrategy } from './types.js'
export const engagementStrategy: AllocStrategy = { score: (i) => i.engagement_rate * i.followers }
```

`backend/src/services/allocation/value.ts`
```ts
import type { AllocStrategy } from './types.js'
// Blended: reward creators strong at BOTH reach and engagement (multiplicative).
export const valueStrategy: AllocStrategy = {
  score: (i) => Math.sqrt(i.avg_views) * (i.engagement_rate * i.followers),
}
```

`backend/src/services/allocation/count.ts`
```ts
import type { AllocStrategy } from './types.js'
import { valueStrategy } from './value.js'
export const countStrategy: AllocStrategy = valueStrategy
```

- [ ] **Step 5: Create `backend/src/services/allocation/index.ts`**

```ts
import type { AllocStrategy } from './types.js'
import type { AllocationStrategy } from '../../types/index.js'
import { reachStrategy } from './reach.js'
import { engagementStrategy } from './engagement.js'
import { valueStrategy } from './value.js'
import { countStrategy } from './count.js'

const REGISTRY: Record<AllocationStrategy, AllocStrategy> = {
  reach: reachStrategy, engagement: engagementStrategy, value: valueStrategy, count: countStrategy,
}
export function getStrategy(name: AllocationStrategy): AllocStrategy {
  return REGISTRY[name] ?? valueStrategy
}
```

- [ ] **Step 6: Create `backend/src/services/allocation/bucketing.ts`**

```ts
import type { Influencer, Tier } from '../../types/index.js'
import { TIER_ORDER } from '../../lib/tier.js'

export function groupByTier(creators: Influencer[]): Record<Tier, Influencer[]> {
  const out = { nano: [], micro: [], macro: [] } as Record<Tier, Influencer[]>
  for (const c of creators) out[c.tier].push(c)
  return out
}
export { TIER_ORDER }
```

- [ ] **Step 7: Create `backend/src/services/allocationService.ts`**

```ts
import type { AllocationStrategy, Influencer, Tier } from '../types/index.js'
import { getStrategy } from './allocation/index.js'
import { BUFFER, type AllocationResult } from './allocation/types.js'
import { groupByTier } from './allocation/bucketing.js'

export function influencerCost(i: Influencer): number {
  return Math.round((i.cost_min + i.cost_max) / 2)
}

interface Options { strategy: AllocationStrategy; count?: number }

// Greedy: best score-per-rupee first, within a budget, optionally capped to N.
function greedyPick(
  creators: Influencer[], budget: number, score: (i: Influencer) => number, cap?: number,
): Influencer[] {
  const ranked = [...creators]
    .map((i) => ({ i, eff: score(i) / Math.max(1, influencerCost(i)) }))
    .sort((a, b) => b.eff - a.eff)
  const chosen: Influencer[] = []
  let spent = 0
  for (const { i } of ranked) {
    if (cap != null && chosen.length >= cap) break
    const cost = influencerCost(i)
    if (spent + cost <= budget) { chosen.push(i); spent += cost }
  }
  return chosen
}

export function allocate(creators: Influencer[], budget: number, opts: Options): AllocationResult {
  const strat = getStrategy(opts.strategy)
  const bufferApplied = opts.strategy === 'engagement'
  const effective = Math.round(budget * (bufferApplied ? BUFFER : 1))

  let selected: Influencer[]
  if (opts.strategy === 'count') {
    selected = greedyPick(creators, effective, strat.score, Math.max(0, opts.count ?? 0))
  } else {
    // Split effective budget across tier buckets proportional to bucket size.
    const buckets = groupByTier(creators)
    const total = creators.length || 1
    selected = []
    for (const tier of ['nano', 'micro', 'macro'] as Tier[]) {
      const list = buckets[tier]
      if (!list.length) continue
      const share = Math.round(effective * (list.length / total))
      selected.push(...greedyPick(list, share, strat.score))
    }
    // Second pass: spend any leftover across everything still unselected.
    const spent = selected.reduce((s, i) => s + influencerCost(i), 0)
    const remaining = creators.filter((c) => !selected.includes(c))
    selected.push(...greedyPick(remaining, effective - spent, strat.score))
  }

  const by_tier = { nano: { count: 0, spend: 0 }, micro: { count: 0, spend: 0 }, macro: { count: 0, spend: 0 } } as AllocationResult['by_tier']
  let spend = 0
  for (const i of selected) { const c = influencerCost(i); by_tier[i.tier].count++; by_tier[i.tier].spend += c; spend += c }

  return {
    selected, total_projected_spend: spend, leftover_budget: Math.max(0, effective - spend),
    effective_budget: effective, budget_buffer_applied: bufferApplied, by_tier,
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd backend && npm test allocation`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add backend && git commit -m "feat(backend): bucketed allocation strategies with engagement buffer

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: Auth + rate-limit + error middleware

**Files:**
- Create: `backend/src/middleware/supabaseAuth.ts`, `backend/src/middleware/rateLimit.ts`, `backend/src/middleware/errorHandler.ts`, `backend/src/db/supabase.ts`
- Test: `backend/__tests__/supabaseAuth.test.ts`

**Interfaces:**
- Produces:
  - `requireAuth(req, res, next)` — verifies `Authorization: Bearer <jwt>` via Supabase, sets `req.user = { id, email }`, else 401.
  - `rateLimit(req, res, next)` — Upstash; 429 when exceeded; no-op when Upstash absent.
  - `errorHandler(err, req, res, next)` — JSON `{ error }`, status from `err.status ?? 500`, no stack leak.
  - `httpError(status, message)` helper.
  - `AuthedRequest` type with `user?: { id; email }`.

- [ ] **Step 1: Write the failing test** — `backend/__tests__/supabaseAuth.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import { requireAuth, __setVerifier } from '../src/middleware/supabaseAuth'

function appWith() {
  const app = express()
  app.get('/secure', requireAuth, (req: any, res) => res.json({ id: req.user.id }))
  app.use((err: any, _req: any, res: any, _next: any) => res.status(err.status ?? 500).json({ error: err.message }))
  return app
}

describe('requireAuth', () => {
  it('401 when no token', async () => {
    const res = await request(appWith()).get('/secure')
    expect(res.status).toBe(401)
  })
  it('401 when token invalid', async () => {
    __setVerifier(async () => null)
    const res = await request(appWith()).get('/secure').set('Authorization', 'Bearer bad')
    expect(res.status).toBe(401)
  })
  it('sets req.user when token valid', async () => {
    __setVerifier(async () => ({ id: 'u1', email: 'a@b.c' }))
    const res = await request(appWith()).get('/secure').set('Authorization', 'Bearer good')
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('u1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test supabaseAuth`
Expected: FAIL.

- [ ] **Step 3: Create `backend/src/db/supabase.ts`**

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'

let client: SupabaseClient | null = null
export function getSupabase(): SupabaseClient | null {
  if (!env.supabaseUrl || !env.supabaseServiceKey) return null
  if (!client) client = createClient(env.supabaseUrl, env.supabaseServiceKey, { auth: { persistSession: false } })
  return client
}
```

- [ ] **Step 4: Create `backend/src/middleware/errorHandler.ts`**

```ts
import type { Request, Response, NextFunction } from 'express'

export class HttpError extends Error { constructor(public status: number, msg: string) { super(msg) } }
export function httpError(status: number, message: string): HttpError { return new HttpError(status, message) }

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = typeof err?.status === 'number' ? err.status : 500
  res.status(status).json({ error: status === 500 ? 'Internal Server Error' : err.message })
}
```

- [ ] **Step 5: Create `backend/src/middleware/supabaseAuth.ts`**

```ts
import type { Request, Response, NextFunction } from 'express'
import { getSupabase } from '../db/supabase.js'
import { httpError } from './errorHandler.js'

export interface AuthUser { id: string; email: string }
export interface AuthedRequest extends Request { user?: AuthUser }

type Verifier = (token: string) => Promise<AuthUser | null>

// Default: ask Supabase to resolve the user from the access token.
let verify: Verifier = async (token) => {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data.user) return null
  return { id: data.user.id, email: data.user.email ?? '' }
}
export function __setVerifier(v: Verifier) { verify = v } // test seam

export async function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return next(httpError(401, 'Missing bearer token'))
  const user = await verify(token)
  if (!user) return next(httpError(401, 'Invalid or expired token'))
  req.user = user
  next()
}
```

- [ ] **Step 6: Create `backend/src/middleware/rateLimit.ts`**

```ts
import type { Request, Response, NextFunction } from 'express'
import { Ratelimit } from '@upstash/ratelimit'
import { getRedis } from '../services/redis.js'
import { httpError } from './errorHandler.js'
import type { AuthedRequest } from './supabaseAuth.js'

const redis = getRedis()
const limiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '60 s') }) : null

export async function rateLimit(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!limiter) return next() // no Upstash configured → skip
  const id = req.user?.id ?? req.ip ?? 'anon'
  const { success, limit, remaining } = await limiter.limit(id)
  res.setHeader('X-RateLimit-Limit', String(limit))
  res.setHeader('X-RateLimit-Remaining', String(remaining))
  if (!success) return next(httpError(429, 'Rate limit exceeded'))
  next()
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && npm test supabaseAuth`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend && git commit -m "feat(backend): supabase JWT auth, rate-limit, error middleware

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 12: Repositories + DB schema (brands, campaigns)

**Files:**
- Create: `backend/src/db/brandsRepo.ts`, `backend/src/db/campaignsRepo.ts`
- Create: `docs/db-schema.sql`
- Test: `backend/__tests__/repos.test.ts`

**Interfaces:**
- Produces:
  - `interface Brand { id; owner_id; name; niche; created_at }`
  - `interface Campaign { id; brand_id; owner_id; niche; budget; strategy; count; result; projected_spend; created_at }`
  - `interface DbDriver` (minimal: `insert`, `selectByOwner`, `selectById`, `deleteByIdOwner`)
  - `makeBrandsRepo(db)`, `makeCampaignsRepo(db)` returning `{ create, listByOwner, getById, deleteOwned }`
  - Repos enforce ownership (return null / false on mismatch).

- [ ] **Step 1: Write the failing test** — `backend/__tests__/repos.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { makeBrandsRepo, type DbDriver } from '../src/db/brandsRepo'

function fakeDb(): DbDriver {
  const rows: any[] = []
  return {
    insert: async (_t, row) => { rows.push(row); return row },
    selectByOwner: async (_t, owner) => rows.filter((r) => r.owner_id === owner),
    selectById: async (_t, id) => rows.find((r) => r.id === id) ?? null,
    deleteByIdOwner: async (_t, id, owner) => {
      const i = rows.findIndex((r) => r.id === id && r.owner_id === owner)
      if (i < 0) return false; rows.splice(i, 1); return true
    },
  }
}

describe('brandsRepo', () => {
  it('creates and lists only the owner rows', async () => {
    const repo = makeBrandsRepo(fakeDb())
    await repo.create({ owner_id: 'u1', name: 'A', niche: 'tech' })
    await repo.create({ owner_id: 'u2', name: 'B', niche: 'food' })
    const mine = await repo.listByOwner('u1')
    expect(mine.map((b) => b.name)).toEqual(['A'])
  })
  it('deleteOwned returns false for another user', async () => {
    const repo = makeBrandsRepo(fakeDb())
    const b = await repo.create({ owner_id: 'u1', name: 'A', niche: 'tech' })
    expect(await repo.deleteOwned(b.id, 'u2')).toBe(false)
    expect(await repo.deleteOwned(b.id, 'u1')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test repos`
Expected: FAIL.

- [ ] **Step 3: Create `docs/db-schema.sql`**

```sql
create extension if not exists "pgcrypto";

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  niche text not null,
  created_at timestamptz not null default now()
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete set null,
  owner_id uuid not null,
  niche text not null,
  budget numeric not null,
  strategy text not null,
  count int,
  result jsonb not null,
  projected_spend numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists brands_owner_idx on brands(owner_id);
create index if not exists campaigns_owner_idx on campaigns(owner_id);
```

- [ ] **Step 4: Create `backend/src/db/brandsRepo.ts`**

```ts
export interface Brand { id: string; owner_id: string; name: string; niche: string; created_at: string }

export interface DbDriver {
  insert(table: string, row: Record<string, unknown>): Promise<any>
  selectByOwner(table: string, owner: string): Promise<any[]>
  selectById(table: string, id: string): Promise<any | null>
  deleteByIdOwner(table: string, id: string, owner: string): Promise<boolean>
}

export function makeBrandsRepo(db: DbDriver) {
  return {
    async create(input: { owner_id: string; name: string; niche: string }): Promise<Brand> {
      const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...input }
      return db.insert('brands', row) as Promise<Brand>
    },
    listByOwner: (owner: string) => db.selectByOwner('brands', owner) as Promise<Brand[]>,
    getById: (id: string) => db.selectById('brands', id) as Promise<Brand | null>,
    deleteOwned: (id: string, owner: string) => db.deleteByIdOwner('brands', id, owner),
  }
}
```

- [ ] **Step 5: Create `backend/src/db/campaignsRepo.ts`**

```ts
import type { DbDriver } from './brandsRepo.js'
import type { AllocationResult } from '../services/allocation/types.js'

export interface Campaign {
  id: string; brand_id: string | null; owner_id: string; niche: string
  budget: number; strategy: string; count: number | null
  result: AllocationResult; projected_spend: number; created_at: string
}

export function makeCampaignsRepo(db: DbDriver) {
  return {
    async create(input: Omit<Campaign, 'id' | 'created_at'>): Promise<Campaign> {
      const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...input }
      return db.insert('campaigns', row) as Promise<Campaign>
    },
    listByOwner: (owner: string) => db.selectByOwner('campaigns', owner) as Promise<Campaign[]>,
    getById: (id: string) => db.selectById('campaigns', id) as Promise<Campaign | null>,
  }
}
```

- [ ] **Step 6: Create the Supabase-backed `DbDriver`** — append to `backend/src/db/supabase.ts`

```ts
import type { DbDriver } from './brandsRepo.js'

export function supabaseDriver(): DbDriver {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase not configured')
  return {
    insert: async (t, row) => { const { data, error } = await sb.from(t).insert(row).select().single(); if (error) throw error; return data },
    selectByOwner: async (t, owner) => { const { data, error } = await sb.from(t).select('*').eq('owner_id', owner).order('created_at', { ascending: false }); if (error) throw error; return data ?? [] },
    selectById: async (t, id) => { const { data } = await sb.from(t).select('*').eq('id', id).maybeSingle(); return data ?? null },
    deleteByIdOwner: async (t, id, owner) => { const { data, error } = await sb.from(t).delete().eq('id', id).eq('owner_id', owner).select(); if (error) throw error; return (data?.length ?? 0) > 0 },
  }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && npm test repos`
Expected: PASS.

- [ ] **Step 8: Run `docs/db-schema.sql` against Supabase**

Run (manual): paste `docs/db-schema.sql` into Supabase SQL editor and execute.
Expected: `brands` and `campaigns` tables created.

- [ ] **Step 9: Commit**

```bash
git add backend docs/db-schema.sql && git commit -m "feat(backend): brands/campaigns repositories and SQL schema

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 13: Routes — influencers, allocate, auth/session

**Files:**
- Create: `backend/src/routes/influencers.ts`, `backend/src/routes/allocate.ts`, `backend/src/routes/auth.ts`
- Modify: `backend/src/app.ts` (mount routers, error handler, rate limit)
- Test: `backend/__tests__/influencers.e2e.test.ts`, `backend/__tests__/allocate.e2e.test.ts`

**Interfaces:**
- Consumes: `getPricedCreators`, `allocate`, `requireAuth`, `rateLimit`, `errorHandler`, `NICHES`.
- Produces:
  - `GET /api/influencers?niche=` → `{ niche, creators: Influencer[] }`
  - `POST /api/allocate` body `{ budget, niche, strategy, count? }` → `AllocationResult & { creators_considered }`
  - `POST /api/auth/session` → `{ user }`

- [ ] **Step 1: Write the failing e2e tests**

`backend/__tests__/influencers.e2e.test.ts`
```ts
import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { __setVerifier } from '../src/middleware/supabaseAuth'

beforeAll(() => __setVerifier(async () => ({ id: 'u1', email: 'a@b.c' })))
const auth = (r: request.Test) => r.set('Authorization', 'Bearer good')

describe('GET /api/influencers', () => {
  it('401 without token', async () => {
    expect((await request(createApp()).get('/api/influencers?niche=tech')).status).toBe(401)
  })
  it('400 on missing/unknown niche', async () => {
    expect((await auth(request(createApp()).get('/api/influencers'))).status).toBe(400)
    expect((await auth(request(createApp()).get('/api/influencers?niche=nope'))).status).toBe(400)
  })
  it('200 returns priced creators (fallback path)', async () => {
    const res = await auth(request(createApp()).get('/api/influencers?niche=tech'))
    expect(res.status).toBe(200)
    expect(res.body.creators.length).toBeGreaterThan(0)
    expect(res.body.creators[0].cost_min).toBeLessThan(res.body.creators[0].cost_max)
  })
})
```

`backend/__tests__/allocate.e2e.test.ts`
```ts
import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { __setVerifier } from '../src/middleware/supabaseAuth'

beforeAll(() => __setVerifier(async () => ({ id: 'u1', email: 'a@b.c' })))
const post = (b: any) => request(createApp()).post('/api/allocate').set('Authorization', 'Bearer good').send(b)

describe('POST /api/allocate', () => {
  it('400 on invalid budget', async () => {
    expect((await post({ budget: -5, niche: 'tech', strategy: 'reach' })).status).toBe(400)
    expect((await post({ budget: 'x', niche: 'tech', strategy: 'reach' })).status).toBe(400)
  })
  it('400 when count strategy missing count', async () => {
    expect((await post({ budget: 50000, niche: 'tech', strategy: 'count' })).status).toBe(400)
  })
  it('reach stays within budget', async () => {
    const res = await post({ budget: 80000, niche: 'tech', strategy: 'reach' })
    expect(res.status).toBe(200)
    expect(res.body.total_projected_spend).toBeLessThanOrEqual(80000)
    expect(res.body.budget_buffer_applied).toBe(false)
  })
  it('engagement applies 10% buffer', async () => {
    const res = await post({ budget: 80000, niche: 'tech', strategy: 'engagement' })
    expect(res.body.effective_budget).toBe(88000)
    expect(res.body.budget_buffer_applied).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npm test e2e`
Expected: FAIL.

- [ ] **Step 3: Create `backend/src/routes/auth.ts`**

```ts
import { Router } from 'express'
import { requireAuth, type AuthedRequest } from '../middleware/supabaseAuth.js'
export const authRouter = Router()
authRouter.post('/auth/session', requireAuth, (req: AuthedRequest, res) => res.json({ user: req.user }))
```

- [ ] **Step 4: Create `backend/src/routes/influencers.ts`**

```ts
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/supabaseAuth.js'
import { httpError } from '../middleware/errorHandler.js'
import { NICHES } from '../types/index.js'
import { getPricedCreators } from '../services/influencerService.js'

export const influencersRouter = Router()
const nicheSchema = z.enum(NICHES as [string, ...string[]])

influencersRouter.get('/influencers', requireAuth, async (req, res, next) => {
  const parsed = nicheSchema.safeParse(req.query.niche)
  if (!parsed.success) return next(httpError(400, 'Invalid or missing niche'))
  try {
    const creators = await getPricedCreators(parsed.data as any)
    res.json({ niche: parsed.data, creators })
  } catch (e) { next(e) }
})
```

- [ ] **Step 5: Create `backend/src/routes/allocate.ts`**

```ts
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/supabaseAuth.js'
import { httpError } from '../middleware/errorHandler.js'
import { NICHES } from '../types/index.js'
import { getPricedCreators } from '../services/influencerService.js'
import { allocate } from '../services/allocationService.js'

export const allocateRouter = Router()
const schema = z.object({
  budget: z.number().positive(),
  niche: z.enum(NICHES as [string, ...string[]]),
  strategy: z.enum(['reach', 'engagement', 'value', 'count']),
  count: z.number().int().positive().optional(),
}).refine((v) => v.strategy !== 'count' || v.count != null, { message: 'count required for count strategy' })

allocateRouter.post('/allocate', requireAuth, async (req, res, next) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return next(httpError(400, parsed.error.issues[0]?.message ?? 'Invalid body'))
  try {
    const { budget, niche, strategy, count } = parsed.data
    const creators = await getPricedCreators(niche as any)
    const result = allocate(creators, budget, { strategy, count })
    res.json({ ...result, creators_considered: creators.length })
  } catch (e) { next(e) }
})
```

- [ ] **Step 6: Update `backend/src/app.ts`**

```ts
import express, { type Express } from 'express'
import { healthRouter } from './routes/health.js'
import { authRouter } from './routes/auth.js'
import { influencersRouter } from './routes/influencers.js'
import { allocateRouter } from './routes/allocate.js'
import { rateLimit } from './middleware/rateLimit.js'
import { errorHandler } from './middleware/errorHandler.js'

export function createApp(): Express {
  const app = express()
  app.use(express.json())
  app.use('/api', rateLimit)
  app.use('/api', healthRouter)
  app.use('/api', authRouter)
  app.use('/api', influencersRouter)
  app.use('/api', allocateRouter)
  app.use(errorHandler)
  return app
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd backend && npm test e2e`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend && git commit -m "feat(backend): influencers, allocate, auth/session routes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 14: Routes — brands & campaigns (history) with ownership

**Files:**
- Create: `backend/src/routes/brands.ts`, `backend/src/routes/campaigns.ts`
- Modify: `backend/src/app.ts` (mount), `backend/src/middleware/supabaseAuth.ts` (export injectable repos hook)
- Test: `backend/__tests__/brands.e2e.test.ts`, `backend/__tests__/campaigns.e2e.test.ts`

**Interfaces:**
- Consumes: `makeBrandsRepo`, `makeCampaignsRepo`, `requireAuth`, `httpError`.
- Produces:
  - `setRepos({ brands, campaigns })` test seam in a new `backend/src/routes/_repos.ts`
  - `GET/POST/DELETE /api/brands`, `GET/POST /api/campaigns`, `GET /api/campaigns/:id`
  - All filtered/checked by `req.user.id`; cross-owner → 403; missing → 404.

- [ ] **Step 1: Write the failing e2e tests**

`backend/__tests__/brands.e2e.test.ts`
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { __setVerifier } from '../src/middleware/supabaseAuth'
import { setRepos } from '../src/routes/_repos'
import { makeBrandsRepo } from '../src/db/brandsRepo'
import { makeCampaignsRepo } from '../src/db/campaignsRepo'

function fakeDb() {
  const rows: any[] = []
  return {
    insert: async (_t: string, r: any) => { rows.push(r); return r },
    selectByOwner: async (_t: string, o: string) => rows.filter((r) => r.owner_id === o),
    selectById: async (_t: string, id: string) => rows.find((r) => r.id === id) ?? null,
    deleteByIdOwner: async (_t: string, id: string, o: string) => {
      const i = rows.findIndex((r) => r.id === id && r.owner_id === o); if (i < 0) return false; rows.splice(i, 1); return true
    },
  }
}
let user = { id: 'u1', email: 'a@b.c' }
beforeEach(() => {
  const db = fakeDb()
  setRepos({ brands: makeBrandsRepo(db), campaigns: makeCampaignsRepo(db) })
  __setVerifier(async () => user)
})
const A = (r: request.Test) => r.set('Authorization', 'Bearer good')

describe('brands CRUD', () => {
  it('creates, lists, deletes; enforces ownership', async () => {
    user = { id: 'u1', email: 'a@b.c' }
    const created = await A(request(createApp()).post('/api/brands').send({ name: 'Acme', niche: 'tech' }))
    expect(created.status).toBe(201)
    const id = created.body.id
    expect((await A(request(createApp()).get('/api/brands'))).body.length).toBe(1)
    user = { id: 'u2', email: 'x@y.z' }
    expect((await A(request(createApp()).delete(`/api/brands/${id}`))).status).toBe(403)
    user = { id: 'u1', email: 'a@b.c' }
    expect((await A(request(createApp()).delete(`/api/brands/${id}`))).status).toBe(204)
  })
  it('400 on invalid body', async () => {
    expect((await A(request(createApp()).post('/api/brands').send({ name: '' }))).status).toBe(400)
  })
})
```

`backend/__tests__/campaigns.e2e.test.ts`
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { __setVerifier } from '../src/middleware/supabaseAuth'
import { setRepos } from '../src/routes/_repos'
import { makeBrandsRepo } from '../src/db/brandsRepo'
import { makeCampaignsRepo } from '../src/db/campaignsRepo'

function fakeDb() {
  const rows: any[] = []
  return {
    insert: async (_t: string, r: any) => { rows.push(r); return r },
    selectByOwner: async (_t: string, o: string) => rows.filter((r) => r.owner_id === o),
    selectById: async (_t: string, id: string) => rows.find((r) => r.id === id) ?? null,
    deleteByIdOwner: async () => false,
  }
}
let user = { id: 'u1', email: 'a@b.c' }
beforeEach(() => {
  const db = fakeDb()
  setRepos({ brands: makeBrandsRepo(db), campaigns: makeCampaignsRepo(db) })
  __setVerifier(async () => user)
})
const A = (r: request.Test) => r.set('Authorization', 'Bearer good')
const body = { brand_id: null, niche: 'tech', budget: 50000, strategy: 'reach', count: null,
  projected_spend: 40000, result: { selected: [], total_projected_spend: 40000 } }

describe('campaign history', () => {
  it('saves snapshot, lists, fetches by id, round-trips result', async () => {
    user = { id: 'u1', email: 'a@b.c' }
    const saved = await A(request(createApp()).post('/api/campaigns').send(body))
    expect(saved.status).toBe(201)
    const id = saved.body.id
    expect((await A(request(createApp()).get('/api/campaigns'))).body.length).toBe(1)
    const got = await A(request(createApp()).get(`/api/campaigns/${id}`))
    expect(got.body.result.total_projected_spend).toBe(40000)
  })
  it('403 fetching another user\'s campaign, 404 when missing', async () => {
    user = { id: 'u1', email: 'a@b.c' }
    const saved = await A(request(createApp()).post('/api/campaigns').send(body))
    user = { id: 'u2', email: 'x@y.z' }
    expect((await A(request(createApp()).get(`/api/campaigns/${saved.body.id}`))).status).toBe(403)
    expect((await A(request(createApp()).get('/api/campaigns/missing'))).status).toBe(404)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npm test brands campaigns`
Expected: FAIL.

- [ ] **Step 3: Create `backend/src/routes/_repos.ts`**

```ts
import { makeBrandsRepo } from '../db/brandsRepo.js'
import { makeCampaignsRepo } from '../db/campaignsRepo.js'
import { supabaseDriver } from '../db/supabase.js'

type Repos = { brands: ReturnType<typeof makeBrandsRepo>; campaigns: ReturnType<typeof makeCampaignsRepo> }
let repos: Repos | null = null
export function setRepos(r: Repos) { repos = r }          // test seam
export function getRepos(): Repos {
  if (!repos) { const d = supabaseDriver(); repos = { brands: makeBrandsRepo(d), campaigns: makeCampaignsRepo(d) } }
  return repos
}
```

- [ ] **Step 4: Create `backend/src/routes/brands.ts`**

```ts
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, type AuthedRequest } from '../middleware/supabaseAuth.js'
import { httpError } from '../middleware/errorHandler.js'
import { NICHES } from '../types/index.js'
import { getRepos } from './_repos.js'

export const brandsRouter = Router()
const schema = z.object({ name: z.string().min(1), niche: z.enum(NICHES as [string, ...string[]]) })

brandsRouter.get('/brands', requireAuth, async (req: AuthedRequest, res, next) => {
  try { res.json(await getRepos().brands.listByOwner(req.user!.id)) } catch (e) { next(e) }
})
brandsRouter.post('/brands', requireAuth, async (req: AuthedRequest, res, next) => {
  const p = schema.safeParse(req.body)
  if (!p.success) return next(httpError(400, 'Invalid brand'))
  try { res.status(201).json(await getRepos().brands.create({ owner_id: req.user!.id, ...p.data })) } catch (e) { next(e) }
})
brandsRouter.delete('/brands/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const found = await getRepos().brands.getById(req.params.id)
    if (!found) return next(httpError(404, 'Brand not found'))
    if (found.owner_id !== req.user!.id) return next(httpError(403, 'Forbidden'))
    await getRepos().brands.deleteOwned(req.params.id, req.user!.id)
    res.status(204).end()
  } catch (e) { next(e) }
})
```

- [ ] **Step 5: Create `backend/src/routes/campaigns.ts`**

```ts
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, type AuthedRequest } from '../middleware/supabaseAuth.js'
import { httpError } from '../middleware/errorHandler.js'
import { NICHES } from '../types/index.js'
import { getRepos } from './_repos.js'

export const campaignsRouter = Router()
const schema = z.object({
  brand_id: z.string().nullable(),
  niche: z.enum(NICHES as [string, ...string[]]),
  budget: z.number().positive(),
  strategy: z.enum(['reach', 'engagement', 'value', 'count']),
  count: z.number().int().positive().nullable(),
  projected_spend: z.number().nonnegative(),
  result: z.record(z.unknown()),
})

campaignsRouter.get('/campaigns', requireAuth, async (req: AuthedRequest, res, next) => {
  try { res.json(await getRepos().campaigns.listByOwner(req.user!.id)) } catch (e) { next(e) }
})
campaignsRouter.post('/campaigns', requireAuth, async (req: AuthedRequest, res, next) => {
  const p = schema.safeParse(req.body)
  if (!p.success) return next(httpError(400, 'Invalid campaign'))
  try { res.status(201).json(await getRepos().campaigns.create({ owner_id: req.user!.id, ...(p.data as any) })) } catch (e) { next(e) }
})
campaignsRouter.get('/campaigns/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const c = await getRepos().campaigns.getById(req.params.id)
    if (!c) return next(httpError(404, 'Campaign not found'))
    if (c.owner_id !== req.user!.id) return next(httpError(403, 'Forbidden'))
    res.json(c)
  } catch (e) { next(e) }
})
```

- [ ] **Step 6: Mount in `backend/src/app.ts`** (add imports + `app.use`)

```ts
import { brandsRouter } from './routes/brands.js'
import { campaignsRouter } from './routes/campaigns.js'
// ...after allocateRouter:
  app.use('/api', brandsRouter)
  app.use('/api', campaignsRouter)
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd backend && npm test brands campaigns`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend && git commit -m "feat(backend): brand & campaign history routes with ownership checks

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 15: Full backend suite green + rate-limit e2e

**Files:**
- Test: `backend/__tests__/rateLimit.e2e.test.ts`

**Interfaces:**
- Consumes: existing app + middleware.

- [ ] **Step 1: Write the rate-limit e2e test** — `backend/__tests__/rateLimit.e2e.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest'
import express from 'express'
import request from 'supertest'

// Verify the middleware returns 429 when the limiter denies.
describe('rateLimit middleware', () => {
  it('returns 429 when limit exceeded', async () => {
    vi.resetModules()
    vi.doMock('../src/services/redis', () => ({ getRedis: () => ({}) }))
    vi.doMock('@upstash/ratelimit', () => ({
      Ratelimit: class { static slidingWindow() { return {} } limit() { return Promise.resolve({ success: false, limit: 60, remaining: 0 }) } },
    }))
    const { rateLimit } = await import('../src/middleware/rateLimit')
    const { errorHandler } = await import('../src/middleware/errorHandler')
    const app = express()
    app.get('/api/x', rateLimit, (_req, res) => res.json({ ok: true }))
    app.use(errorHandler)
    const res = await request(app).get('/api/x')
    expect(res.status).toBe(429)
  })
})
```

- [ ] **Step 2: Run the whole backend suite**

Run: `cd backend && npm test`
Expected: ALL tests PASS (tier, providers, caching, pricingConfig, pricing, influencerService, allocation, supabaseAuth, repos, all e2e, rateLimit).

- [ ] **Step 3: Type-check the backend build**

Run: `cd backend && npm run build`
Expected: `tsc` completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add backend && git commit -m "test(backend): rate-limit e2e and full green suite

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 16: Frontend wiring — call the backend, drop local algorithms

**Files:**
- Create: `frontend/lib/api.ts`
- Modify: `frontend/app/page.tsx` (call `/api/allocate` instead of local `allocateBudget`)
- Modify: `frontend/components/BudgetControls.tsx` (strategy details copy incl. max-engagement +10% note)
- Create: `frontend/.env.local` entry `NEXT_PUBLIC_API_BASE=http://localhost:4000`
- Remove (after wiring): `frontend/lib/allocateBudget.ts`, `frontend/lib/mockData.ts` usage from page
- Test: `frontend/__tests__/api.test.ts`

**Interfaces:**
- Consumes: backend `POST /api/allocate`, `GET /api/influencers`.
- Produces:
  - `allocateViaApi(params, token): Promise<AllocationResult>` in `frontend/lib/api.ts`
  - UI renders `result.selected`, `by_tier`, and shows the buffer note when `budget_buffer_applied`.

- [ ] **Step 1: Write the failing test** — `frontend/__tests__/api.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest'
import { allocateViaApi } from '../lib/api'

describe('allocateViaApi', () => {
  it('POSTs to /api/allocate with bearer token and returns body', async () => {
    const json = { selected: [], total_projected_spend: 0, budget_buffer_applied: false }
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => json })
    const res = await allocateViaApi(
      { budget: 1000, niche: 'tech', strategy: 'reach' }, 'tok',
      { base: 'http://x', fetchFn },
    )
    expect(fetchFn).toHaveBeenCalledWith('http://x/api/allocate', expect.objectContaining({
      method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
    }))
    expect(res).toEqual(json)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test api`
Expected: FAIL.

- [ ] **Step 3: Create `frontend/lib/api.ts`**

```ts
import type { AllocationStrategy } from './types'

interface AllocParams { budget: number; niche: string; strategy: AllocationStrategy; count?: number }
interface Opts { base?: string; fetchFn?: typeof fetch }

export async function allocateViaApi(p: AllocParams, token: string, opts: Opts = {}) {
  const base = opts.base ?? process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000'
  const f = opts.fetchFn ?? fetch
  const res = await f(`${base}/api/allocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(p),
  })
  if (!res.ok) throw new Error(`allocate failed: ${res.status}`)
  return res.json()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm test api`
Expected: PASS.

- [ ] **Step 5: Wire `frontend/app/page.tsx`** — replace the local `useMemo(allocateBudget…)` with a call to `allocateViaApi` (using the Supabase session token from `useAuth()`), storing the returned `AllocationResult` in state and rendering `result.selected` + `result.by_tier`. Show a note when `result.budget_buffer_applied` is true: *"Max-engagement may spend up to 10% over your budget — the brand opted for maximum engagement."*

- [ ] **Step 6: Add strategy-details copy** in `frontend/components/BudgetControls.tsx` for each tab:
  - **Max reach** — "Most eyeballs per rupee; favours larger creators."
  - **Max engagement** — "Highest engaged audience. May exceed your budget by up to 10% because the brand wants maximum engagement."
  - **Best value** — "Best blend of reach and engagement per rupee."
  - **Pick count** — "Exactly N best-fit creators within budget."

- [ ] **Step 7: Verify frontend builds and tests pass**

Run: `cd frontend && npm run build && npm test`
Expected: build OK; tests PASS.

- [ ] **Step 8: Commit**

```bash
git add frontend && git commit -m "feat(frontend): call backend allocate API, add strategy details

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 17: End-to-end smoke with both servers + docs

**Files:**
- Create: `docs/running-locally.md`
- Modify: root `README.md` (monorepo layout + run instructions)

**Interfaces:**
- Consumes: full stack.

- [ ] **Step 1: Start backend**

Run: `cd backend && cp .env.example .env && npm run dev`
(Fill `.env` with the values from `frontend/.env.local` Supabase/Upstash; leave `RAPIDAPI_KEY` empty to use fallback.)
Expected: `backend listening on :4000`.

- [ ] **Step 2: Smoke the API**

Run: `curl -s 'http://localhost:4000/api/health'`
Expected: `{"status":"ok"}`.

- [ ] **Step 3: Start frontend, verify allocation flows through the API**

Run: `cd frontend && npm run dev`
Then in the browser: sign in, set a budget, switch strategies, confirm buckets update and max-engagement shows the >100% note.
Expected: creators come from the backend; spend math matches the API response.

- [ ] **Step 4: Write `docs/running-locally.md`** documenting: env vars for each app, how to run both, fallback vs RapidAPI mode, how to run the SQL schema.

- [ ] **Step 5: Update root `README.md`** with the monorepo layout and run commands.

- [ ] **Step 6: Commit**

```bash
git add docs README.md && git commit -m "docs: local run guide and monorepo README

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- §1 monorepo split → Task 1. ✅
- §2 decisions (Express, Supabase, JWT, RapidAPI fallback, all pricing models, env config, CTR proxy, backend-only, engagement buffer) → Tasks 2,5,7,8,10,11,16. ✅
- §3 repo layout → Task 1 + File Structure. ✅
- §4 backend structure → Tasks 2–14. ✅
- §5 provider + fallback → Tasks 4,5,6. ✅
- §6 pricing models + resolver → Tasks 7,8. ✅
- §7 allocation strategies + buckets + buffer → Task 10. ✅
- §8 auth + persistence + schema → Tasks 11,12. ✅
- §9 endpoints → Tasks 13,14. ✅
- §10 design patterns → realized across Tasks 4–14. ✅
- §11 testing (unit happy+corner, e2e all routes, rate-limit, error) → every task's tests + Task 15. ✅
- §12 backlog (Redis pricing override stub, single-post pricing) → resolver stub Task 7; documented. ✅

**Placeholder scan:** No TBD/TODO; every code step has full code; every test has assertions. ✅

**Type consistency:** `RawCreatorSignals`/`Influencer` (Task 3) consumed unchanged in Tasks 4–10; `Pricer.price` signature consistent Tasks 7–9; `AllocationResult` fields (`budget_buffer_applied`, `effective_budget`, `by_tier`) consistent Tasks 10,13,16; `DbDriver` methods consistent Tasks 12,14; `__setVerifier`/`setRepos` test seams defined where used. ✅

**Open follow-ups (not blockers):** real RapidAPI host/endpoint path may need adjusting in Task 5 once you pick the product (the adapter's field mapping is isolated to `fetchProfile`); run `docs/db-schema.sql` in Supabase (Task 12 Step 8).
