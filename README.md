# Creator Nexus

**Creator Nexus** is an influencer budget allocator built for Indian D2C brands. Marketers enter a campaign budget, choose a niche and an allocation strategy (greedy max-reach, max-engagement, or tier-balanced), and the platform distributes spend across nano, micro, and macro Instagram creators — returning projected reach, engagement, and cost-per-engagement at a glance. Real creator data comes from the RapidAPI Instagram endpoint; when no key is configured the backend falls back to a deterministic generated dataset so the product always works.

---

## Monorepo Layout

```
CreatorNexus/
├── backend/      # Express API — auth, influencer data, allocation engine
├── frontend/     # Next.js 16 + Tailwind v4 UI
└── docs/         # API.md, Postman collection, db-schema.sql, running-locally.md
```

---

## API & Postman

Full API reference, auth notes, and an **importable Postman collection**:
**[docs/API.md](docs/API.md)** · collection file: **[docs/creator-nexus.postman_collection.json](docs/creator-nexus.postman_collection.json)**

In Postman: **Import → File →** select `docs/creator-nexus.postman_collection.json`. It ships with every endpoint, example bodies, and a `token` variable for your Supabase access token. Contributors can explore `/api/influencers` and `/api/allocate` immediately — they run on a generated dataset when no RapidAPI key is set.

---

## Quick Start

### Backend (port 4000)

```bash
cd backend
cp .env.example .env   # fill values — leaving RAPIDAPI_* blank enables the generated fallback
npm install
npm run dev
```

### Frontend (port 3000)

```bash
cd frontend
cp .env.example .env.local   # set NEXT_PUBLIC_API_BASE=http://localhost:4000 + Supabase vars
npm install
npm run dev
```

Full setup guide (env vars, DB schema, auth notes, test commands):
**[docs/running-locally.md](docs/running-locally.md)**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, Tailwind CSS v4 |
| Backend | Node.js, Express, TypeScript |
| Auth | Supabase (email + password, JWT) |
| Rate limiting / cache | Upstash Redis |
| Influencer data | RapidAPI Instagram endpoint (+ generated fallback) |
| Database | Supabase Postgres |
| Testing | Vitest (both apps) |

---

## Run Tests

```bash
cd backend && npm test
cd frontend && npm test
```

---

## Developer

Built by [Aryansh Kurmi](https://arukurmi.vercel.app/)
