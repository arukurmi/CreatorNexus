# Creator Nexus — Monorepo + Real Backend Design

**Date:** 2026-06-26
**Status:** Approved (brainstorming) → ready for implementation plan

## 1. Goal

Split the project into a **monorepo**: move today's Next.js app into `frontend/`
unchanged, and stand up a **separate, real Express + TypeScript backend** that owns
**all** business logic. The frontend stops owning algorithms entirely — it calls the
API and renders results.

The backend owns:

- Auth & authorization (verify Supabase JWTs, ownership checks)
- Rate limiting (Upstash Redis)
- Real influencer data fetching via **RapidAPI** (with a generated-data fallback)
- Cost-range pricing computed from real Instagram signals
- Budget allocation across nano/micro/macro buckets with four strategies
- Brand & campaign **history** (Supabase Postgres)

## 2. Confirmed decisions

| Area | Decision |
|---|---|
| Backend stack | **Express + TypeScript** |
| Persistence | **Supabase Postgres** (reuse existing Supabase project; service-role key on backend) |
| Auth | Backend **verifies Supabase JWTs**; frontend keeps Supabase Auth |
| Data source | **RapidAPI** Instagram client + deterministic **generated fallback** (same interface) |
| Pricing | **All models ship**: CPM-base, engagement-multiplier, weighted-scoring, tier-flat — selectable & tunable |
| Pricing config | **Env vars now**; resolver built so a **Redis (per-user/per-brand) layer** drops in later |
| CTR | No scraper exposes real CTR → **ctr_proxy = engagement_rate** (accepted) |
| Algorithms location | **Backend only**; frontend renders API results |
| Max-engagement budget | Effective budget = **total × 1.10** (only this strategy may exceed 100%, because the brand explicitly wants max engagement); the overage is **explained in the frontend strategy-details section** |

## 3. Repository layout

```
CreatorNexus/
  frontend/      ← today's Next.js app, moved wholesale (keeps working as-is)
  backend/       ← new Express + TS API
  docs/
```

The current app (`app/`, `components/`, `lib/`, config files, `package.json`, etc.)
moves into `frontend/` with no behavior change. The frontend's `lib/allocateBudget.ts`,
pricing, and mock-data logic become **dead/relocated** — the algorithms now live in the
backend; the frontend keeps only the rendering types it needs.

## 4. Backend structure

```
backend/src/
  routes/
    auth.ts          POST /api/auth/session
    influencers.ts   GET  /api/influencers
    allocate.ts      POST /api/allocate
    brands.ts        GET/POST/DELETE /api/brands
    campaigns.ts     GET/POST /api/campaigns, GET /api/campaigns/:id
    health.ts        GET /api/health
  services/
    rapidapi/
      InfluencerProvider.ts   interface + RawCreatorSignals
      RapidApiProvider.ts     adapter over RapidAPI JSON
      GeneratedProvider.ts    deterministic seeded fallback
      CachingProvider.ts      Redis decorator
      handles.ts              curated real handles per niche
    pricing/
      types.ts                Pricer interface, PricingConfig
      engagementMultiplier.ts shared, separately tunable
      cpm.ts                  CPM-base × engagement multiplier
      weighted.ts             weighted scoring
      tierFlat.ts             tier flat + perf modifier
      index.ts                getPricer(model) factory/registry
    allocation/
      types.ts                Strategy interface, AllocationResult
      reach.ts engagement.ts value.ts count.ts
      bucketing.ts            group by tier, merge per-bucket results
      index.ts                getStrategy(name) factory/registry
    influencerService.ts      facade: provider → pricing → result
    allocationService.ts      facade: budget math + bucket merge
  middleware/
    supabaseAuth.ts           verify Bearer JWT → req.user
    rateLimit.ts              Upstash per-user/per-IP
    errorHandler.ts
  config/
    pricingConfig.ts          resolvePricingConfig(ctx): Redis→env→defaults
    env.ts                    typed env access
  db/
    supabase.ts               service-role client (singleton)
    brandsRepo.ts             Repository
    campaignsRepo.ts          Repository
  types/                      shared domain types
  app.ts                      express app + middleware wiring
  server.ts                   listen()
```

## 5. Data sourcing — RapidAPI + fallback

One `InfluencerProvider` interface:

```ts
interface RawCreatorSignals {
  handle: string
  avatar_url: string
  followers: number
  avg_views: number
  avg_likes: number
  avg_comments: number
  engagement_rate: number   // derived: (avg_likes + avg_comments) / followers
  niche: Niche
}
interface InfluencerProvider {
  getByNiche(niche: Niche): Promise<RawCreatorSignals[]>
}
```

- `RapidApiProvider` calls the real product when `RAPIDAPI_KEY` is set (Adapter:
  maps vendor JSON → `RawCreatorSignals`).
- `GeneratedProvider` reproduces today's deterministic seeded creators when no key.
- `CachingProvider` decorates either one with Upstash Redis caching keyed by niche.
- **Providers never price** — they only return signals. Pricing is a separate layer so
  real and fallback creators are priced identically.

## 6. Pricing layer — all models, configurable

`PricingConfig` resolved per request via a source chain:

```
resolvePricingConfig(ctx) :  Redis(brandId/userId)  →  env  →  built-in defaults
                              (stub today)             (now)    (now)
```

Active model chosen by `PRICING_MODEL = cpm | weighted | tier_flat`.
Each model implements the `Pricer` Strategy:

```ts
interface Pricer { price(s: RawCreatorSignals, cfg: PricingConfig): { cost_min: number; cost_max: number } }
```

- **CPM + engagement multiplier**
  `base = (avg_views / 1000) × CPM[tier]`
  `factor = engagementMultiplier(eng_rate, tier, cfg)  // 1 + k·(eng_rate − tierAvgEng)`
  `mid = base × factor`; `min = mid·(1−spread)`, `max = mid·(1+spread)`
  Env: `CPM_NANO/MICRO/MACRO`, `ENG_MULTIPLIER_K`, `PRICE_SPREAD`, `TIER_AVG_ENG_*`.
- **Engagement multiplier** — a shared, separately-tunable function reused by other models.
- **Weighted scoring**
  `score = w1·followers + w2·avg_likes + w3·eng_rate + w4·ctr_proxy` (`ctr_proxy = eng_rate`),
  normalized into the tier's INR band → mid → ±spread.
  Env: `W_FOLLOWERS/W_LIKES/W_ENG/W_CTR`, tier bands.
- **Tier flat**
  `band = TIER_BAND[tier]`; `mid = lerp(band, perfScore)`; `min/max = mid·(0.85..1.2)`.
  Env: `TIER_BAND_NANO/MICRO/MACRO`, `TIER_PERF_RANGE`.

All four are pure and unit-tested (known inputs → known ranges). Env selects the active
model and tunes constants; the resolver already takes a `ctx` so the future Redis/per-brand
layer is a drop-in with no call-site changes.

## 7. Allocation strategies

Budget math runs **entirely on the backend** in `POST /api/allocate`. Creators are
grouped into **nano / micro / macro buckets**; each strategy fills within an
**effective budget** using a greedy knapsack per bucket, then merges.

| Strategy | Objective (per rupee) | Effective budget |
|---|---|---|
| **max reach** | maximize Σ `avg_views` | total |
| **max engagement** | maximize Σ (`eng_rate × followers`) | **total × 1.10** |
| **best value** | maximize blended `norm(reach) × norm(engagement)` | total |
| **pick count** | exactly N best-blended creators that fit | total |

- Cost per creator = midpoint of its computed `[cost_min, cost_max]`.
- **Only max-engagement** uses the 1.10 buffer (applied across all three buckets),
  because the brand explicitly wants maximum engagement and accepts up to 10% over.
- Response surfaces: selected creators **with cost range**, `total_projected_spend`,
  per-tier breakdown, `leftover_budget`, and a `budget_buffer_applied` flag so the
  **frontend strategy-details section** can explain any >100% spend.

## 8. Auth & persistence

- `supabaseAuth` middleware verifies `Authorization: Bearer <supabase JWT>` → `req.user`.
- Supabase Postgres tables (RLS-friendly; ownership enforced in repos too):

```sql
brands(id uuid pk, owner_id uuid, name text, niche text, created_at timestamptz)
campaigns(id uuid pk, brand_id uuid fk, owner_id uuid, niche text,
          budget numeric, strategy text, count int null,
          result jsonb,            -- snapshot of allocation output
          projected_spend numeric, created_at timestamptz)
```

- Saving a campaign snapshots inputs + allocation result for history.
- Every brand/campaign read/write is **ownership-checked** (403 otherwise).

## 9. Endpoints

```
POST   /api/auth/session        validate token → user profile
GET    /api/influencers?niche=  priced creators for a niche
POST   /api/allocate            {budget, niche, strategy, count?} → bucketed result
GET    /api/brands              list (owner)
POST   /api/brands              create
DELETE /api/brands/:id          delete (owner)
GET    /api/campaigns           list history (owner)
POST   /api/campaigns           save snapshot
GET    /api/campaigns/:id       fetch one (owner)
GET    /api/health              liveness
```

Upstash rate limiting on all `/api/*` (per-user when authed, per-IP otherwise).

## 10. Design patterns used

| Pattern | Where | Why |
|---|---|---|
| **Strategy** | `services/pricing/*`, `services/allocation/*` | Interchangeable algorithms behind one interface; add a file, not an `if`. |
| **Factory / Registry** | `pricing/index.ts`, `allocation/index.ts` | Config string → concrete Strategy via a map. |
| **Adapter** | `RapidApiProvider` | Vendor JSON → domain `RawCreatorSignals`; vendor swap = one file. |
| **Provider interface + Fallback object** | `InfluencerProvider`, `GeneratedProvider` | Vendor-agnostic call sites; fallback when no key. |
| **Decorator** | `CachingProvider` | Transparent Redis caching around any provider. |
| **Repository** | `brandsRepo`, `campaignsRepo` | All SQL isolated; tests swap in-memory repos. |
| **Facade / Service layer** | `influencerService`, `allocationService` | Thin routes; orchestration hidden. |
| **Resolver (Strategy + Chain)** | `config/pricingConfig` | Config source chain Redis→env→defaults. |
| **Middleware / Chain of Responsibility** | `supabaseAuth`, `rateLimit` | Request pipeline; each can short-circuit (401/429). |
| **Dependency Injection (constructor)** | services receive `{provider, pricer, repos}` | Mockable units. |
| **Singleton (module)** | `db/supabase`, `services/redis` | One client per process. |

Spine: **Strategy + Factory**, wrapped by a **Facade** service layer, fed by an
**Adapter**-based **Provider** **Decorated** with caching, with **Repository** persistence
and **Middleware** for cross-cutting auth/rate-limit.

## 11. Testing

Vitest. Pure-unit coverage for: every pricing model (known inputs → known ranges),
the engagement multiplier, each allocation strategy (incl. the 1.10 buffer and per-bucket
merge), tier derivation, and the provider fallback. Route-level tests with mocked Supabase
and mocked RapidAPI. Generated-fallback path must produce valid, tier-consistent data with
no key present.

## 12. Out of scope (now) / backlog

- Real Redis-backed per-brand pricing overrides (resolver stub ships now).
- Multi-post / campaign-duration pricing (cost range = single sponsored post/reel for now).
- Real CTR ingestion (requires private creator analytics; proxy used).
- Frontend rewrite beyond wiring to the new API + the strategy-details copy.
