# Deploying the backend to Render

The backend is a standard Node + TypeScript service. It compiles to `dist/` and
runs `node dist/server.js`.

## Render service settings

| Setting | Value |
|---|---|
| **Environment** | Node |
| **Root Directory** | `backend` |
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/api/health` |
| **Node version** | 20+ (Render's default 22 is fine) |

> **Why `--include=dev`?** `npm run build` runs `tsc`, which is a *devDependency*.
> Render may set `NODE_ENV=production`, which makes `npm install` skip devDependencies
> and the build fails with `tsc: not found`. `--include=dev` forces them in.
> (Equivalent alternative: keep `npm install && npm run build` and add an env var
> `NPM_CONFIG_PRODUCTION=false`.)

**Do NOT set `PORT`.** Render injects `PORT` automatically and the server already
listens on `process.env.PORT`. Setting it yourself can break the health check.

## Environment variables to set on Render

Set these under the service's **Environment** tab. Mark secrets as secret.

| Var | Value in production | New key needed? |
|---|---|---|
| `CORS_ORIGIN` | Your deployed **frontend** URL, e.g. `https://creator-nexus.vercel.app` (NOT localhost, NOT `*`) | n/a — it's a URL |
| `SUPABASE_URL` | **Same** as local: `https://<project>.supabase.co` | No — same Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | The **real service-role** secret key | Use the real one (local currently uses the anon key as a stand-in) |
| `UPSTASH_REDIS_REST_URL` | Same as local (or a separate prod Upstash DB) | No — reuse for testing |
| `UPSTASH_REDIS_REST_TOKEN` | Same as local | No — reuse for testing |
| `RAPIDAPI_KEY` | Your subscribed RapidAPI key | No — one key per RapidAPI account, works anywhere |
| `RAPIDAPI_HOST` | `instagram-scraper-api2.p.rapidapi.com` | No |
| `PRICING_MODEL` | `cpm` (optional) | No |
| `SUPABASE_JWT_SECRET` | leave unset (currently unused) | No |
| `RAPIDAPI_DEBUG` | leave unset in prod | No |

## Are the local URLs/keys the same in production?

- **Supabase** — the project URL and keys are tied to the **Supabase project**, not to
  your machine. Reuse the **same** `SUPABASE_URL`. The difference: the backend should use
  the **service-role** key in production (secret, server-only) so brand/campaign DB writes
  work; the frontend keeps using the public **anon** key. You do **not** need a new Supabase
  project to deploy — one project serves both local and prod. (Create a separate project
  later only if you want prod data isolated from dev.)
- **Upstash** — the URL+token are a connection to a hosted Redis. The **same** values work
  from Render. For real production you may create a second Upstash database, but reusing the
  current one is fine for testing.
- **RapidAPI** — the key is account-level and works from any host. **Same** key.

So for a first test deploy you can **reuse the same Supabase/Upstash/RapidAPI values** — the
only value that MUST change is `CORS_ORIGIN` (point it at the deployed frontend), plus
swapping the Supabase anon stand-in for the real service-role key if you want history to persist.

## Deploy order (avoids the CORS chicken-and-egg)

1. **Deploy the backend** on Render → note its URL, e.g. `https://creator-nexus-api.onrender.com`.
2. **On the frontend (Vercel)** set `NEXT_PUBLIC_API_BASE` = the Render backend URL, and deploy → note the Vercel URL.
3. **Back on Render** set `CORS_ORIGIN` = the Vercel frontend URL and **redeploy** the backend.
4. Apply `docs/db-schema.sql` in Supabase (once) so brands/campaigns persist.

## Verify

```bash
curl https://<your-render-url>/api/health      # → {"status":"ok"}
```
Then sign in on the frontend and run an allocation — it should hit the Render backend.

## Notes
- The server loads `dotenv/config` for local `.env`; on Render there is no `.env` file and
  Render's injected env vars are used directly — harmless either way.
- Free Render services sleep when idle and cold-start on the next request (first call is slow).
- Node < 22 has no global `WebSocket`; the backend polyfills it via `ws`, so it runs on
  Render's Node 20 or 22 without changes.
