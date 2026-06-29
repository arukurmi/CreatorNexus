# Running Creator Nexus Locally

## Monorepo Layout

```
CreatorNexus/
├── backend/          # Express API (port 4000)
│   ├── src/
│   │   ├── routes/   # health, auth, influencers, allocate, brands, campaigns
│   │   ├── services/ # provider (RapidAPI / fallback), redis, pricer, allocator
│   │   ├── middleware/ # supabaseAuth, rateLimit, errorHandler
│   │   └── db/       # Supabase client, DbDriver
│   └── .env.example
├── frontend/         # Next.js 16 app (port 3000)
│   ├── app/
│   ├── components/
│   └── .env.example
└── docs/
    ├── db-schema.sql
    └── running-locally.md  ← this file
```

---

## Backend

### 1. Configure environment

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in the values you want. The defaults are designed so you can leave most fields blank for local development:

| Variable | Required for | Default behaviour when blank |
|---|---|---|
| `PORT` | server port | `4000` |
| `CORS_ORIGIN` | CORS whitelist | `http://localhost:3000` |
| `SUPABASE_URL` | JWT verification + DB | auth disabled (open) |
| `SUPABASE_SERVICE_ROLE_KEY` | brands/campaigns DB writes | DB writes fail gracefully |
| `SUPABASE_JWT_SECRET` | local JWT verification | falls back to `auth.getUser` |
| `UPSTASH_REDIS_REST_URL` | rate limiting + cache | rate limiting skipped |
| `UPSTASH_REDIS_REST_TOKEN` | rate limiting + cache | rate limiting skipped |
| `RAPIDAPI_KEY` | real Instagram data | deterministic generated fallback |
| `RAPIDAPI_HOST` | real Instagram data | deterministic generated fallback |
| `PRICING_MODEL` | pricing strategy | `cpm` |

See `backend/.env.example` for the full variable list including optional CPM tuning knobs.

### 2. Install and run

```bash
npm install
npm run dev   # tsx watch — hot-reloads on save, port 4000
```

Expected output: `backend listening on :4000`

### 3. Verify

```bash
curl http://localhost:4000/api/health
# → {"status":"ok"}
```

---

## Frontend

### 1. Configure environment

```bash
cd frontend
cp .env.example .env.local
```

Minimum contents of `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=          # from Supabase project settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # from Supabase project settings
```

When Supabase vars are blank, the dashboard runs in demo mode (auth disabled).

See `frontend/.env.example` for the complete list.

### 2. Install and run

```bash
cd frontend
npm install
npm run dev   # Next.js dev server, port 3000
```

Open [http://localhost:3000](http://localhost:3000).

---

## Fallback vs RapidAPI Mode

The backend ships with a **deterministic generated fallback** that produces realistic creator profiles without any external key. It is active whenever `RAPIDAPI_KEY` **or** `RAPIDAPI_HOST` is blank.

To switch to **real Instagram data**, set both in `backend/.env`:

```env
RAPIDAPI_KEY=your_key_here
RAPIDAPI_HOST=your_host_here
```

The adapter in `backend/src/services/provider.ts` handles both paths transparently — no code change needed.

---

## Database Schema

The brands and campaigns history features require two tables in Supabase. To create them:

1. Open your [Supabase project](https://supabase.com/dashboard) → **SQL Editor**.
2. Paste the contents of [`docs/db-schema.sql`](./db-schema.sql) and run it.

---

## Environment Variable Reference

| App | File |
|---|---|
| Backend | `backend/.env.example` |
| Frontend | `frontend/.env.example` |

---

## Running Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

Both test suites use **Vitest**. No real Supabase/Upstash/RapidAPI connection is needed — tests inject stubs via exported seams (`__setVerifier`, `setRepos`).

---

## Authentication Note

The API requires a valid Supabase session token (Bearer) for the following routes:

- `GET /api/influencers`
- `POST /api/allocate`
- `GET /api/brands` / `POST /api/brands`
- `GET /api/campaigns` / `POST /api/campaigns`

Sign in via the frontend (`/login`) to obtain a session. The frontend attaches the token automatically to all API calls. Only `GET /api/health` and the auth exchange routes (`/api/auth/*`) are public.

## AI Strategist (optional)

The **AI Strategist** product (`/strategist`) needs a **Gemini** key. Set
`GEMINI_API_KEY` in `backend/.env` (free at https://aistudio.google.com). Without it,
`POST /api/ai/strategy` returns **503** and the UI shows a friendly "not configured"
message. Default model is `gemini-2.0-flash` (override with `GEMINI_MODEL`).
