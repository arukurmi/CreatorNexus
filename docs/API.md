# Creator Nexus — API Reference & Postman Collection

The backend is an Express + TypeScript service. Base URL in local dev: `http://localhost:4000`.

> **Postman collection:** [`creator-nexus.postman_collection.json`](./creator-nexus.postman_collection.json)
> In Postman: **Import → File →** select that file (or paste its raw URL). It ships with all 13 requests, folder descriptions, and example bodies.
>
> **Switch Local ↔ Production with one dropdown.** Every request's scheme+domain is the
> `{{base_url}}` variable, so you never edit URLs. Import the two environment files and pick
> one from the environment selector (top-right in Postman):
> - [`creator-nexus.local.postman_environment.json`](./creator-nexus.local.postman_environment.json) → `base_url = http://localhost:4000`
> - [`creator-nexus.production.postman_environment.json`](./creator-nexus.production.postman_environment.json) → `base_url = https://creatornexus.onrender.com`
>
> Selecting an environment overrides `base_url` for the whole collection — health, influencers,
> allocate, brands, campaigns all follow it. Set `token` in the active environment to your
> Supabase access token.

## Authentication

Every route **except `GET /api/health`** requires a Supabase access token:

```
Authorization: Bearer <supabase access token>
```

How to get a token:
1. Run the frontend (`cd frontend && npm run dev`) and sign in / sign up at `http://localhost:3000/login`.
2. Grab the session token — in the browser console:
   ```js
   (await window.supabase?.auth.getSession())?.data.session?.access_token
   ```
   or read it from the Supabase auth cookie / your `AuthProvider`.
3. In Postman, set the collection variable **`token`** to that value. All requests inherit `Bearer {{token}}`.

Auth outcomes: missing/invalid/expired token → **401**; another user's brand/campaign, a missing record or a malformed id → **404** (the API never reveals whether someone else's record exists); bad input → **400**.

## Collection variables

| Variable | Default | Meaning |
|---|---|---|
| `base_url` | `http://localhost:4000` | API origin |
| `token` | _(empty)_ | Supabase access token |
| `brand_id` | _(empty)_ | set from a created brand's `id` |
| `campaign_id` | _(empty)_ | set from a saved campaign's `id` |

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | — | Liveness → `{ status: "ok" }` |
| POST | `/api/auth/session` | ✅ | Validate token → `{ user }` |
| GET | `/api/influencers?niche=&city=` | ✅ | Priced creators for a niche, optionally in one city |
| POST | `/api/allocate` | ✅ | Run budget allocation (4 strategies) |
| GET | `/api/brands` | ✅ | List my brands |
| POST | `/api/brands` | ✅ | Create a brand |
| DELETE | `/api/brands/:id` | ✅ | Delete a brand I own |
| GET | `/api/campaigns` | ✅ | List my saved campaigns |
| POST | `/api/campaigns` | ✅ | Save a campaign (allocation recomputed server-side, optional `city`; `brand_id` must be your own brand) |
| GET | `/api/campaigns/:id` | ✅ | Fetch one campaign I own |
| POST | `/api/ai/strategy` | ✅ | AI Strategist advisory for a 10–4000 character `brief` |

**Niches (14):** pets, fashion, beauty, food, fitness, travel, tech, gaming, parenting, finance, home, sustainability, education, comedy.
**Strategies (4):** `reach`, `engagement` (uses budget × 1.10), `value`, `count` (needs `count`).

### `POST /api/allocate`

Request:
```json
{ "budget": 50000, "niche": "tech", "strategy": "reach", "count": 5 }
```
`count` is required only for `strategy: "count"`. Response (`AllocationResult & { creators_considered }`):
```json
{
  "selected": [ /* Influencer[] with cost_min/cost_max, tier */ ],
  "total_projected_spend": 48750,
  "leftover_budget": 1250,
  "effective_budget": 50000,
  "budget_buffer_applied": false,
  "by_tier": { "nano": { "count": 6, "spend": 9000 }, "micro": { "count": 3, "spend": 27000 }, "macro": { "count": 1, "spend": 12750 } },
  "creators_considered": 20
}
```
For `strategy: "engagement"`, `effective_budget = round(budget × 1.10)` and `budget_buffer_applied = true`.

## Limits

| What | Limit | Over the limit |
|---|---|---|
| JSON request body | 32 KB | **413** |
| `budget` | ₹1 crore (10,000,000) | **400** |
| `count` | 200 | **400** |
| `city` | 64 characters | **400** |
| Brand `name` | 100 characters | **400** |
| Requests per client IP | 60 per minute | **429** |
| `POST /api/ai/strategy` per user | 10 per hour | **429** |

The AI limit fails closed: if Upstash is not configured or unreachable, `POST /api/ai/strategy` returns **503** rather than calling the AI. Unexpected server errors return **500** with `{ "error": "Internal Server Error" }`; the detail goes to the server log only.

Every response carries Helmet's security headers, including `Strict-Transport-Security`, `X-Content-Type-Options: nosniff` and `X-Frame-Options: SAMEORIGIN`.

## Notes for contributors

- With **no `RAPIDAPI_KEY`**, `/api/influencers` and `/api/allocate` work out of the box using a deterministic generated dataset — no external account needed to explore the API.
- **Brands/campaigns** need the Postgres tables ([`db-schema.sql`](./db-schema.sql)) applied in Supabase and a **service-role** key in `backend/.env`. Row-level security limits the anon key to the signed-in user's own rows.
- Full local setup: [`running-locally.md`](./running-locally.md).
