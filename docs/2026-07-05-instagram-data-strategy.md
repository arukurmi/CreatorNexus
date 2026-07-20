# Instagram Data Strategy — Escaping RapidAPI
*2026-07-05 · Live endpoint tests + provider research + target architecture*

## 0. TL;DR

RapidAPI is a paid dependency in our hot path. Today's live tests prove we can replace it with a **three-layer pipeline**: our own creator DB (source of truth) + a background refresher fed by free-tier providers and a keyless DIY scraper + the existing generated fallback. External APIs leave the request path entirely — faster product, near-zero data cost at MVP scale, and the creator DB becomes a moat instead of a bill.

---

## 1. Live test results (2026-07-05, residential IP)

### ✅ DIY keyless endpoint — WORKS for enrichment

```
GET https://www.instagram.com/api/v1/users/web_profile_info/?username=<handle>
Headers: x-ig-app-id: 936619743392459, User-Agent: <desktop Chrome UA>
```

Tested live today: `instagram`, `mamaearth.in`, `virat.kohli`, `diet_sabya`, `thevisualvibes` → **5/5 HTTP 200, no key, no login.** Returns per profile:

| Field | Use in Creator Nexus |
|---|---|
| `edge_followed_by.count` / `edge_follow.count` | tier bucketing + follower/following credibility ratio (F5) |
| **12 recent posts** w/ `edge_liked_by.count`, `edge_media_to_comment.count`, `is_video` | **real engagement rate** — better than RapidAPI's estimate |
| `category_name` (e.g. "Beauty, cosmetic & personal care") | **free niche classification** for any vertical |
| `is_verified`, `is_private`, `biography`, `full_name` | vetting + display |

### ❌ Discovery endpoints — login-walled

- `web/search/topsearch/?query=…` → 200 but 0 users (auth-gated result set)
- `api/v1/fbsearch/web/top_serp/` → 302 to login
- `api/v1/tags/web_info/` → empty

**Conclusion: DIY = enrichment only.** Discovery (finding *new* creators per niche) needs seed lists or third-party free tiers → that's fine, see architecture.

### ⚠️ The critical constraint

[Scrapfly's 2026 analysis](https://scrapfly.io/blog/posts/how-to-scrape-instagram) + [instaloader issue #2655](https://github.com/instaloader/instaloader/issues/2655): **datacenter IPs (AWS/GCP/Render) are blocked on the first request**; residential IPs work with modest rate limits (my tests). So the DIY endpoint **cannot run on Render** — it must run from a residential context (see §3, Refresher).

Also ruled out:
- **Login-based libraries (instagrapi w/ credentials)** — account bans, credential risk, worst ToS position. Never in production.
- **Calling Instagram in the request path** — latency, bans, single point of failure regardless of IP.

---

### ✅ PoC proven (2026-07-05, later same day)

Ran a working fetch→normalize pipeline over three niches (automotive `powerdrift`, food `yourfoodlab`, fitness `fittuber`): all returned real follower counts + computed engagement rates (0.176% / 0.557% / 4.234%) in `CreatorSnapshot` shape. **Gotchas found:**
- **Node's native `fetch` gets HTTP 400** (TLS fingerprinting); plain `curl` passes → `refresh-creators.ts` must shell out to `curl` (or use `curl-impersonate`).
- `i.instagram.com` mirrors the endpoint (second host for load spreading).
- GraphQL `doc_id` churn (breaks every 2–4 wks per [Scrapfly](https://scrapfly.io/blog/posts/how-to-scrape-instagram)) does NOT affect us — `web_profile_info` is stable REST.
- Extra backup found: Social Intel API, $0.003/request pay-per-use (≈₹250/wk at our scale) — cheap paid fallback if free tiers die.

## 2. Third-party free tiers (rotation pool for discovery + Render-side enrichment)

| Provider | Free allowance | Notes |
|---|---|---|
| [Bright Data Instagram scraper](https://brightdata.com/products/web-scraper/instagram) | **5K records/month free** | Largest standing free tier found; best rotation anchor |
| [Apify Instagram Scraper](https://apify.com/apify/instagram-scraper) | ~$5 platform credits/mo ≈ 5–10K posts | Standing monthly free credits; has search/hashtag actors → **discovery** |
| [ScrapeCreators](https://scrapecreators.com/) | 1,000 credits on signup, never expire | One-time pool; good for initial DB seeding |
| [SocialCrawl](https://www.socialcrawl.dev/platforms/instagram) | 100 credits signup, no card | Small; keep as tertiary |
| [EnsembleData](https://ensembledata.com/instagram-api) | 7-day trial | Burst-seed a niche during trial window |
| RapidAPI (current) | paid | Demote to optional last-resort behind env flag |

**Scale math:** ~10 niches × 100 creators = 1,000 profiles. Weekly refresh ≈ **~150 calls/day** — fits inside Bright Data's free tier *alone*, with Apify free credits as discovery budget. At MVP scale the data bill is ₹0.

---

## 3. Target architecture

```
                    ┌─────────────────────────────────────────┐
 request path       │  Render API  →  Supabase `creators` DB  │  ← ONLY this. Fast. Never blocked.
                    └─────────────────────────────────────────┘
                                     ▲ upserts
 background         ┌────────────────┴────────────────────────┐
 (not on request)   │           Refresher (cron)              │
                    │  chain: ① free-tier providers (rotate)  │
                    │         ② DIY keyless endpoint          │
                    │            (residential runner)         │
                    │         ③ mark stale, keep last-known   │
                    └─────────────────────────────────────────┘
 discovery          Apify search/hashtag actors + curated seed lists
                    + community submissions ("suggest a creator")
 last resort        existing generated fallback (unchanged)
```

**Components:**

1. **`creators` table (Supabase)** — `handle PK, niche, city, followers, following, posts_count, avg_likes, avg_comments, engagement_rate, category_name, is_verified, snapshot jsonb, source text, fetched_at`. `influencerService.getPricedCreators()` reads this first; generated fallback only when a niche has no rows.
2. **Refresher job** — refreshes stalest N profiles per run through the provider chain. Provider adapters share one interface: `fetchProfile(handle): Promise<CreatorSnapshot>` → adding/removing providers is config, not code.
3. **Residential runner for DIY** — the trick that makes the keyless endpoint usable: a small script (`npm run refresh`) that runs **on your Mac via cron/launchd** (residential IP), hits Instagram politely (2–5s delays, ~100–200/day), and upserts straight to Supabase. Render never talks to Instagram. If the laptop is off, providers ① cover the gap; nothing user-facing breaks — worst case data is a few days stale, which is fine for follower counts.
4. **Discovery pipeline** — (a) Apify search/hashtag actors monthly per niche; (b) curated seed lists (one-time manual research per niche — an evening each); (c) **"Suggest a creator" form** in-app → community fills the DB and we enrich the handle automatically; (d) the social-nudge posts below.

**Compliance guardrails:** public data only, no login/credentials ever, low volume + aggressive caching, honor deletions on request, `source` recorded per row. (Public-data scraping is a gray zone; low-volume public-profile reads are the industry-standard interpretation — the hard lines are credentials, private data, and volume.)

## 4. Migration plan (F12) — 4 steps, each shippable

1. **S — `creators` table + read path.** Schema + repo + `influencerService` reads DB before RapidAPI. Zero behavior change when table is empty. *(Do this first; everything else fills it.)*
2. **S — DIY fetcher + local refresher.** `backend/scripts/refresh-creators.ts` (fetch → normalize → upsert, delays + jitter, resumable). Run manually first, then launchd/cron on the Mac.
3. **M — provider adapters + rotation.** Bright Data + Apify adapters behind the shared interface; quota tracking in Redis (`quota:{provider}:{month}`); chain executor with per-provider caps. Sign up for free tiers (manual step — accounts needed).
4. **M — discovery seeding.** Run Apify discovery per niche once; curate; enrich via chain; ship "Suggest a creator" form. Demote RapidAPI to optional env-flagged fallback → **unsubscribe**.

---

## 5. Community nudge drafts (ready to post)

**X (@BufferLab6):**
> Building an influencer budget allocator for D2C brands (just launched on PH 🚀).
>
> Current headache: Instagram data APIs are either $$$ or sketchy.
>
> Indie hackers — what are you using in 2026 for public IG profile data (followers + engagement) that's actually free/cheap? Building our own pipeline and comparing notes. 🧵👇

*(Reply 1 in-thread, shows you did homework → invites correction, which X loves:)*
> Tested so far: IG's own web_profile_info endpoint (works, but blocks datacenter IPs), Bright Data free 5K/mo, Apify free credits, ScrapeCreators 1K credits. Anything better I'm missing?

**Reddit (r/SideProject or r/webscraping — value-first, not begging):**
> **Title:** Tested 6 ways to get public Instagram profile data on a $0 budget (2026) — results inside
>
> Building a bootstrapped influencer-budget tool; RapidAPI was eating margin so I tested alternatives: [paste findings table from §1–2]. Curious what everyone else is running in 2026 — especially anyone who solved the datacenter-IP block without paying for residential proxies?

*(This framing earns upvotes as research and still harvests recommendations. r/webscraping in particular will hand you battle-tested answers.)*

**Product Hunt maker update:**
> Update 3 days post-launch: you asked for more creator data, faster. We're rebuilding our data layer to be independent of paid APIs — which means fresher creator stats and (soon) a "suggest a creator" button so you can pull any Instagram creator into your allocation. If you run a brand and there's a creator we're missing, drop their handle below 👇

*(Turns an infra project into a feature announcement + collects seed data in the comments.)*

---

## 6. Action items

- [ ] **Aryansh:** sign up — Bright Data (5K/mo), Apify, ScrapeCreators (backup pool)
- [ ] **Aryansh:** post the 3 nudges above (X thread first; Reddit needs the findings table filled in)
- [ ] **Code:** Step 1 `creators` table + read path → Step 2 local refresher (both S; can start immediately)
- [ ] **Verify:** run one `curl` of the DIY endpoint from a Render shell to document (expected) block — evidence for the Reddit post, too
- [ ] After Step 3 ships and DB covers all niches: cancel RapidAPI
