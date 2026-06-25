# Creator Nexus — Backend Plan (living document)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.
>
> This is a **living plan** — append new tasks as the backend grows. Keep the existing task numbering stable.

**Goal:** Move all data, validation, and allocation logic to the backend (Next.js Route Handlers). Serve **real Instagram metrics via RapidAPI** with a graceful fallback to deterministic mock data, and guarantee that every creator's tier matches its follower bracket — enforced server-side and covered by tests.

**Architecture:**
- Next.js App Router **Route Handlers** are the backend. No separate server, no DB.
- A **service layer** (`lib/server/*`) holds the real logic: fetching, mapping, validating, caching, allocating. Routes are thin wrappers over the service.
- **RapidAPI Instagram scraper** is the live data source. Responses are cached in **Upstash Redis** (already configured) to stay under rate limits and cost. Any per-handle failure falls back to a deterministic generated stand-in so a niche always returns a full set.
- The frontend stops importing data directly; it calls `/api/influencers` and `/api/allocate`.

**Tech Stack:** Next.js 16 Route Handlers, TypeScript, Vitest (mocked `fetch`), Upstash Redis (`@upstash/redis`), RapidAPI Instagram product (user-selected).

## Global Constraints

- Node 18+, `npm`, Vitest 2 (pinned — v4 rolldown breaks on local Node 20.12).
- Tier brackets (single source of truth, `lib/tier.ts`): **nano** `1K–<10K`, **micro** `10K–<100K`, **macro** `≥100K`. Tier is always *derived from* followers, never stored independently — this makes mismatches structurally impossible for real data.
- All money in INR. Cost is a range `cost_min ≤ cost_max`; budget uses the midpoint.
- Real-data calls must **degrade gracefully**: missing `RAPIDAPI_KEY` or any API error → deterministic mock fallback, never a 500 to the user.
- RapidAPI usage stays behind the existing edge rate-limit (`10 req/min/IP`) and a Redis cache (TTL ≥ 12h).
- Allocation strategies remain: `reach | engagement | value | count`.

## Environment Variables (add to `.env.local` + `.env.example`)

```
RAPIDAPI_KEY=                # from https://rapidapi.com (user provides)
RAPIDAPI_HOST=               # e.g. instagram-scraper-api2.p.rapidapi.com
RAPIDAPI_PROFILE_PATH=/v1/info   # profile endpoint path on the chosen product
# Upstash already present (UPSTASH_REDIS_REST_URL / _TOKEN) — reused as cache
```

---

## File Map

```
lib/
├── tier.ts                  # (exists) getTier + TIER_META — single source of brackets
├── types.ts                 # (exists) Influencer, Tier, Niche, AllocationStrategy
├── allocateBudget.ts        # (exists) pure allocation — stays, now called server-side
├── mockData.ts              # (exists) deterministic generator — becomes the FALLBACK
├── validation.ts            # NEW: validateInfluencer / assertTierMatchesFollowers
└── server/
    ├── rapidapi.ts          # NEW: RapidAPI client + response → Influencer mapping
    ├── handles.ts           # NEW: curated REAL Instagram handles per niche
    ├── cache.ts             # NEW: Upstash Redis get/set helpers (TTL)
    └── influencerService.ts # NEW: fetch real → validate → fallback → return

app/api/
├── fetch-metrics/route.ts   # (exists) keep as simple proxy OR deprecate
├── influencers/route.ts     # NEW: GET ?niche= → validated influencers
└── allocate/route.ts        # NEW: POST {niche,budget,strategy,count} → BucketResult

__tests__/
├── validation.test.ts       # NEW
├── rapidapi.test.ts         # NEW (mocked fetch)
├── influencerService.test.ts# NEW (mocked rapidapi + cache)
├── api-influencers.test.ts  # NEW
└── api-allocate.test.ts     # NEW
```

---

## Task 1: Influencer validation module (TDD)

**Files:**
- Create: `lib/validation.ts`
- Test: `__tests__/validation.test.ts`

**Interfaces — Produces:**
- `type ValidationError = { field: string; message: string }`
- `validateInfluencer(input: unknown): { ok: true; value: Influencer } | { ok: false; errors: ValidationError[] }`
- `tierMatchesFollowers(followers: number, tier: Tier): boolean`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from 'vitest'
import { validateInfluencer, tierMatchesFollowers } from '../lib/validation'

const base = {
  id: 'pets-x', handle: '@x', avatar_url: '', followers: 5000,
  avg_views: 2000, engagement_rate: 0.09, cost_min: 500, cost_max: 900, niche: 'pets',
}

describe('tierMatchesFollowers', () => {
  it('accepts nano in 1K–10K', () => expect(tierMatchesFollowers(5000, 'nano')).toBe(true))
  it('rejects nano with 50K followers', () => expect(tierMatchesFollowers(50000, 'nano')).toBe(false))
  it('accepts macro at exactly 100K', () => expect(tierMatchesFollowers(100000, 'macro')).toBe(true))
})

describe('validateInfluencer', () => {
  it('accepts a well-formed influencer', () => {
    const r = validateInfluencer(base)
    expect(r.ok).toBe(true)
  })
  it('rejects cost_min > cost_max', () => {
    const r = validateInfluencer({ ...base, cost_min: 900, cost_max: 500 })
    expect(r.ok).toBe(false)
  })
  it('rejects engagement_rate outside 0–1', () => {
    const r = validateInfluencer({ ...base, engagement_rate: 1.5 })
    expect(r.ok).toBe(false)
  })
  it('rejects negative followers', () => {
    const r = validateInfluencer({ ...base, followers: -10 })
    expect(r.ok).toBe(false)
  })
  it('rejects an unknown niche', () => {
    const r = validateInfluencer({ ...base, niche: 'crypto' })
    expect(r.ok).toBe(false)
  })
})
```

- [ ] **Step 2:** Run `npx vitest run __tests__/validation.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement `lib/validation.ts`**

```ts
import { Influencer, Niche, Tier } from './types'
import { getTier } from './tier'
import { NICHES } from './niches'

export type ValidationError = { field: string; message: string }

const NICHE_SET = new Set<Niche>(NICHES.map((n) => n.value))

export function tierMatchesFollowers(followers: number, tier: Tier): boolean {
  return getTier(followers) === tier
}

export function validateInfluencer(
  input: unknown
): { ok: true; value: Influencer } | { ok: false; errors: ValidationError[] } {
  const errors: ValidationError[] = []
  const o = (input ?? {}) as Record<string, unknown>
  const num = (k: string) => (typeof o[k] === 'number' && Number.isFinite(o[k]) ? (o[k] as number) : NaN)

  if (typeof o.handle !== 'string' || !o.handle) errors.push({ field: 'handle', message: 'required' })
  const followers = num('followers')
  if (!(followers >= 0)) errors.push({ field: 'followers', message: 'must be ≥ 0' })
  const views = num('avg_views')
  if (!(views >= 0)) errors.push({ field: 'avg_views', message: 'must be ≥ 0' })
  const eng = num('engagement_rate')
  if (!(eng >= 0 && eng <= 1)) errors.push({ field: 'engagement_rate', message: 'must be 0–1' })
  const cmin = num('cost_min'), cmax = num('cost_max')
  if (!(cmin >= 0)) errors.push({ field: 'cost_min', message: 'must be ≥ 0' })
  if (!(cmax >= 0)) errors.push({ field: 'cost_max', message: 'must be ≥ 0' })
  if (cmin > cmax) errors.push({ field: 'cost_min', message: 'cost_min > cost_max' })
  if (!NICHE_SET.has(o.niche as Niche)) errors.push({ field: 'niche', message: 'unknown niche' })

  if (errors.length) return { ok: false, errors }
  return { ok: true, value: input as Influencer }
}
```

- [ ] **Step 4:** Run tests → PASS.
- [ ] **Step 5:** Commit `feat: add server-side influencer validation`.

---

## Task 2: RapidAPI client + response mapping (TDD with mocked fetch)

**Files:**
- Create: `lib/server/rapidapi.ts`
- Test: `__tests__/rapidapi.test.ts`

**Interfaces — Produces:**
- `isRapidApiConfigured(): boolean`
- `fetchProfile(handle: string): Promise<RawProfile | null>` — calls RapidAPI; returns `null` on any error/missing config.
- `mapProfileToInfluencer(raw: RawProfile, handle: string, niche: Niche): Influencer` — derives tier from real followers, estimates avg_views/engagement/cost when fields are absent.
- `type RawProfile = { follower_count: number; media_count?: number; avg_views?: number; avg_likes?: number; avg_comments?: number }`

Notes for implementer:
- The exact RapidAPI JSON shape depends on the chosen product. Keep `mapProfileToInfluencer` defensive: read several candidate keys (`follower_count` / `followers` / `edge_followed_by.count`).
- `engagement_rate = (avg_likes + avg_comments) / followers` when available, else a tier-typical default.
- `avg_views`: use `avg_views` if present, else `followers * 0.5`.
- `cost_min/cost_max`: reuse the anchor formula from `mockData.ts` so pricing is consistent across real + mock.

- [ ] **Step 1: Write failing tests** (mock global `fetch`)

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mapProfileToInfluencer } from '../lib/server/rapidapi'

describe('mapProfileToInfluencer', () => {
  it('derives macro tier from real follower count', () => {
    const inf = mapProfileToInfluencer({ follower_count: 250000 } as never, '@realstar', 'fashion')
    expect(inf.followers).toBe(250000)
    expect(inf.niche).toBe('fashion')
    // tier is derivable: getTier(250000) === 'macro'
  })
  it('computes engagement from likes + comments when present', () => {
    const inf = mapProfileToInfluencer(
      { follower_count: 10000, avg_likes: 700, avg_comments: 100 } as never, '@x', 'food'
    )
    expect(inf.engagement_rate).toBeCloseTo(0.08, 2)
  })
  it('keeps cost_min ≤ cost_max', () => {
    const inf = mapProfileToInfluencer({ follower_count: 50000 } as never, '@x', 'tech')
    expect(inf.cost_min).toBeLessThanOrEqual(inf.cost_max)
  })
})
```

- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement `lib/server/rapidapi.ts`** (client with env guard + defensive mapping; `fetchProfile` returns `null` on non-200 or thrown error).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: add RapidAPI Instagram client and profile mapping`.

---

## Task 3: Curated real Instagram handles per niche

**Files:**
- Create: `lib/server/handles.ts`

**Interfaces — Produces:**
- `REAL_HANDLES: Record<Niche, string[]>` — 12–20 **real, public** Indian creator handles per niche, spread across nano/micro/macro so each tier bucket fills.

Notes:
- These must be real handles for RapidAPI to return data. Curate from public creator lists.
- No test needed (static data), but include a lightweight assertion in Task 5's tests that every niche has ≥ 8 handles.

- [ ] **Step 1:** Create `lib/server/handles.ts` with curated handles per niche.
- [ ] **Step 2:** Commit `feat: add curated real Instagram handles per niche`.

---

## Task 4: Upstash Redis cache layer

**Files:**
- Create: `lib/server/cache.ts`
- Test: covered indirectly in Task 5 (mock the cache).

**Interfaces — Produces:**
- `cacheGet<T>(key: string): Promise<T | null>`
- `cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void>`
- Both no-op (return null / do nothing) when Upstash env is absent.

- [ ] **Step 1: Implement `lib/server/cache.ts`** using `@upstash/redis` lazily, guarded by env presence (mirror `middleware.ts`).
- [ ] **Step 2:** Commit `feat: add Upstash Redis cache helpers`.

---

## Task 5: Influencer service — fetch → validate → fallback (TDD)

**Files:**
- Create: `lib/server/influencerService.ts`
- Test: `__tests__/influencerService.test.ts`

**Interfaces:**
- Consumes: `REAL_HANDLES`, `fetchProfile`, `mapProfileToInfluencer`, `validateInfluencer`, `cacheGet/Set`, `MOCK_INFLUENCERS`.
- Produces: `getInfluencersForNiche(niche: Niche): Promise<Influencer[]>`

Behaviour:
1. For each handle in `REAL_HANDLES[niche]`: try cache → else `fetchProfile` → `mapProfileToInfluencer` → `validateInfluencer`.
2. On any miss/failure for a handle, substitute a deterministic generated creator from `MOCK_INFLUENCERS` (so the niche always returns a full, valid set).
3. Cache successful real results (TTL ≥ 12h).
4. **Every returned influencer passes `validateInfluencer`** (guarantees tier↔follower consistency).

- [ ] **Step 1: Write failing tests** — mock `fetchProfile` (some succeed, some return `null`); assert all results are valid, length matches, failures fall back to mock.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement service.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: add influencer service with real-data fetch and mock fallback`.

---

## Task 6: GET /api/influencers route (TDD)

**Files:**
- Create: `app/api/influencers/route.ts`
- Test: `__tests__/api-influencers.test.ts`

**Contract:** `GET /api/influencers?niche=<niche>` →
`200 { influencers: Influencer[] }` (all validated) · `400 { error }` for missing/unknown niche.

- [ ] **Step 1:** Write failing tests (call the route handler with a mock `Request`; mock the service).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement route (validates `niche` query param, calls `getInfluencersForNiche`).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: add GET /api/influencers route`.

---

## Task 7: POST /api/allocate — server-side allocation (TDD)

**Files:**
- Create: `app/api/allocate/route.ts`
- Test: `__tests__/api-allocate.test.ts`

**Contract:** `POST /api/allocate` body `{ niche, budget, strategy, count? }` →
`200 { selected_influencers, total_projected_spend, leftover_budget }` · `400` on bad input.

Behaviour: fetch the niche's influencers via the service (Redis-cached → fast), run `allocateBudget` server-side, return the bucket. Validate `budget > 0`, `strategy ∈ {reach,engagement,value,count}`, `count ≥ 1` when `strategy === 'count'`.

- [ ] **Step 1:** Write failing tests (valid allocation; rejects bad strategy; respects `count`).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement route.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: add POST /api/allocate route (server-side allocation)`.

---

## Task 8: Wire the frontend to the backend

**Files:**
- Modify: `app/page.tsx` (fetch from APIs instead of importing `MOCK_INFLUENCERS` / calling `allocateBudget` directly)
- Possibly: small `lib/api.ts` client helpers
- Modify: rate-limit `middleware.ts` matcher to also cover `/api/influencers` and `/api/allocate`

Behaviour:
1. On niche change → `GET /api/influencers?niche=` (with loading + error states).
2. On budget/strategy/count change → `POST /api/allocate` (**debounced ~250ms** so the slider doesn't spam the API; allocation reads Redis-cached data so it's fast).
3. Keep the tier-bucket display; selected creators highlighted.

> **UX note (separate from data correctness):** today each tier band shows *all* available creators and highlights the selected ones, so the nano band always shows its full inventory (e.g. 8). If you'd rather the buckets visibly *grow/shrink* with the budget, switch the grid to render only `selected_influencers` grouped by tier. Decide during this task.

- [ ] **Step 1:** Add `middleware.ts` matcher for the new routes.
- [ ] **Step 2:** Add `lib/api.ts` fetch helpers (typed).
- [ ] **Step 3:** Rewire `app/page.tsx` with loading/error/debounce.
- [ ] **Step 4:** Manual verify in browser; `npm run build`.
- [ ] **Step 5:** Commit `feat: consume backend APIs from the dashboard`.

---

## Task 9: End-to-end verification

- [ ] `npx vitest run` → all suites green.
- [ ] `npx tsc --noEmit` → clean.
- [ ] `npm run build` → compiles; routes `/api/influencers`, `/api/allocate` present.
- [ ] Manual: with `RAPIDAPI_KEY` unset → mock fallback works; with key set → real follower counts appear and tiers still match.
- [ ] Commit `chore: backend MVP verified end-to-end`.

---

## Backlog (append future backend work here)

- Persist a manual override / "shortlist" per brand (needs auth user id → Supabase table).
- Brand-safety + sentiment flags in `Influencer.metadata` (LLM hook).
- Replace per-handle profile calls with a batch endpoint to cut RapidAPI usage.
- Background refresh job (cron) to warm the Redis cache instead of on-demand fetching.
