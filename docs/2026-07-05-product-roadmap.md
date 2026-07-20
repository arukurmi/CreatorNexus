# Creator Nexus — Post-Launch Product Roadmap
*2026-07-05 · Derived from Product Hunt launch feedback + market pain-point research · For review before technical implementation*

---

## 1. Where the product is today

Shipped & deployed (backend on Render, frontend on Vercel):

- **Allocation engine** — `POST /api/allocate`: budget + niche + strategy (`reach | engagement | value | count`) + optional India-city filter → creator mix across nano/micro/macro with projected reach, engagement, CPE.
- **Creator data** — RapidAPI Instagram endpoint with deterministic generated fallback (`influencerService`).
- **Pricing engine** — env-configurable (`cpm`, `tierFlat`, `engagementMultiplier`, `weighted`).
- **Campaign history** — save/list/get campaigns per user (Supabase).
- **AI Strategist** — Gemini-backed brief → strategy (`POST /api/ai/strategy`).
- **Auth** — Supabase email+password JWT. **Infra** — Upstash Redis rate-limit/cache.

**The product today is a calculator.** The roadmap below turns it into a *workflow* — because calculators get one visit, workflows get weekly visits.

---

## 2. What launch feedback actually said (comment → generic feature)

Three independent PH reviewers converged on the same themes:

| Verbatim signal | Generalized product feature |
|---|---|
| "not just a generic 80/20 split… actually felt realistic" (Gökçe) | **F1 Explainable allocations** — show *why* this split; trust is the product |
| "flagged overspending on one influencer tier I kept defaulting to" (Emin) | **F2 Budget Health / tier-overspend diagnostics** — the most *remembered* feature; promote it to hero |
| "made sense of my chaos" (Emin) | **F8 Campaign tracker** — the chaos isn't the math, it's managing 20 creators after the math |
| "suggested micro-influencers I hadn't considered" (Serap) | **F3 Discovery + saved shortlists** — people want the *names*, not just the split |
| "small skincare brand" ×2 | **F4 Vertical presets** — skincare/D2C beachhead; niche-tuned defaults |
| "understands creator tiers, not lumping everyone together" (Serap) | Tier granularity is the differentiator — deepen it (sub-tiers, city tiers), never flatten it |

---

## 3. Market pain-point research (what the internet says)

### 3.1 Fraud & vetting — the #1 industry pain
- **81% of marketers hit influencer fraud in 2026**; ~$4.8B global losses; **37.2% of influencer followers are fake/suspicious** ([SociaVault 100K-account study](https://sociavault.com/blog/fake-follower-study-key-findings), [AutoFaceless stats](https://autofaceless.ai/blog/influencer-fraud-statistics-2026)).
- Macro tier (100K–500K) has the **highest fraud rate (~48%)** — which *validates our nano/micro-first allocation* as a fraud-avoidance strategy. That's a marketing claim we can make.
- Small brands waste **$10K–50K per failed campaign** when they skip vetting; most vetting is still manual, 5–10 min/creator, catches almost nothing ([CreatorScore guide](https://creatorscore.io/blog/complete-guide-influencer-vetting)).
- → **F5 Credibility score** is the highest-value feature research surfaces that no PH commenter asked for (they don't know yet that they're being defrauded).

### 3.2 Pricing opacity — the India-specific pain
- India influencer pricing has "**zero transparency**"; small businesses **overpay 40–60%** because they don't know market rates; quotes carry 10–30% negotiation margin ([JigsawKraft 2026 pricing guide](https://www.jigsawkraft.com/post/influencer-marketing-cost-in-india-complete-2026-pricing-guide)).
- Rates: nano Reel from ₹3,000 → celebrity ₹25L+ ([upGrowth rate card](https://upgrowth.in/influencer-marketing-pricing-india-2026/)); nano $50–300/post, micro $200–2,500 globally ([Stan rates](https://stan.store/blog/influencer-rates/)).
- Tier-2 city nano creators: **15–20% better engagement at ~30% lower cost** than metro ([Otbox](https://otboxmediasolutions.com/nano-influencers-india-the-secret-weapon-for-d2c-brands-in-2026/)) — our `city` filter is already ahead here; expose it harder.
- → **F6 Fair-price benchmark** ("is this quote fair?") is a wedge feature nobody serves at SMB price point.

### 3.3 Barter economy — India-specific, totally unserved by allocators
- Nano/micro creators in India commonly accept **barter (product-value) deals**; brands start at ₹10K–50K/month via barter before cash ([InfluencerHai](https://influencerhai.com/blog/top-barter-influencer-marketing-agency), [Hobo.Video](https://hobo.video/blog/how-much-should-brands-pay-influencers-india-2025/)).
- No budget allocator models "₹X cash + Y units of product at ₹Z landed cost." → **F7 Barter mode** is a genuine differentiator.

### 3.4 Post-allocation chaos — where retention lives
- "Managing campaigns out of **messy spreadsheets** is the biggest operational hurdle"; DMs → ghosting and lost threads; generic outreach gets **<5% response** vs ~30% for personalized ([Insense](https://insense.pro/blog/influencer-outreach), [Armful Media](https://armfulmedia.com/influencer-outreach-response-rate/)).
- 3 of 4 Indian D2C brands now use creators for growth ([BuzzInContent](https://www.buzzincontent.com/insight/3-in-4-d2c-brands-in-india-now-rely-on-creators-to-boost-growth-10895963)) — the market is real and growing (₹3,375 Cr by 2026, 25% CAGR).
- Attribution is broken in India: heavy COD in Tier-2/3 means click-tracking misses conversions; discount codes + post-purchase surveys work better.
- → **F8 tracker, F9 outreach kit, F10 attribution lite** are the retention ladder.

### 3.5 Competitor gap
- Enterprise platforms (Upfluence, Modash, Later Influence…) are discovery-first, $100s/month, US-centric. Indian platforms (Qoruz, OPA, Hobo) are agency/marketplace models. **Nobody does "budget-first planning for SMB D2C India."** Budget-first is our category; keep it.

---

## 4. Feature list (iterated, generic, ranked)

Each feature: problem → what it is → why now → effort (S/M/L) → dependency.

### Tier A — polish the wedge (ship in 1–2 weeks, before traffic decays)

**F1. Explainable allocation ("Why this split?") — final form, iterated 2026-07-05** — S→M (4 layers, ship in order)
- *Problem:* trust drove all 3 PH comments; "realistic, not generic" must be visible, not lucky.
- *End-state:* **every allocation is an argument, not a number.** Four layers, each independently shippable:
  1. **L1 — Inline tier one-liners (S):** each tier row carries one deterministic sentence ("Nano gets 45%: at ₹50K, nano CPE beats macro 2.1× in this niche"). Pure templates over numbers the allocator already computed.
  2. **L2 — Decisions & exclusions panel (S):** collapsible "Why this split?" listing what was *rejected* and why ("Skipped macro: cheapest macro rate ₹80K > remaining budget", "Capped one creator at 35% of spend"). Rejections are what make it feel intelligent — this is the layer that earns "not a generic 80/20."
  3. **L3 — Baseline comparison (S/M):** show the naive 80/20 split next to ours with the delta: "**+23% projected engagement vs a generic split.**" One quantified sentence = the screenshot-able marketing moment; feeds directly into F11 share cards/OG images.
  4. **L4 — Counterfactual sliders (M):** "move ₹10K macro→micro" → instant recomputed projections. Turns report into playground; biggest retention effect. Ship last, gate on L1–L3 engagement analytics.
- *Implementation:* all deterministic, from a single `rationale.ts` over the allocator's own intermediate numbers (expose them from `services/allocation/` instead of discarding). Optional `?explain=ai` Gemini polish reuses `strategyService`; never required.
- *Why:* converts skeptics; L3 gives marketing a number; zero external dependencies.

**F2. Budget Health flags (promote overspend detection to hero)** — S
- *Problem:* the single most-remembered feature is buried as a side effect.
- *What:* a diagnostics block on every result: over-concentration ("62% of spend in one tier — reallocate ₹X to micro for +Y projected engagement"), diminishing returns, unused budget, tier-gap warnings. Plus a standalone **"Audit my current spend"** input: user pastes what they're *currently* paying per tier → get flags without committing to our plan. Zero-friction growth wedge.
- *Why:* Emin's comment verbatim; audits are shareable and demand nothing.

**F3. Saved shortlists (creator watchlist)** — M
- *Problem:* "suggested micros I hadn't considered" — but they vanish on refresh.
- *What:* ⭐ any creator from a result → saved list per user (name, handle, tier, est. rate, niche, status: `saved | contacted | replied | agreed | dropped`). This status enum is deliberately the seed of F8.
- *Why:* first retention feature; turns calculator → workspace.

**F4. Niche-aware quality (generic — every niche first-class)** — S/M
- *Decision (2026-07-05):* **NOT skincare-specific.** The product must feel equally excellent whether the user is a skincare, automotive, gaming, or home-decor brand. No vertical branding, no "built for skincare" copy.
- *Problem:* today every niche runs through the same defaults; a niche with different creator economics (automotive CPMs ≠ skincare CPMs) gets a less "realistic-feeling" split — and "realistic" is our whole brand.
- *What:* a **niche parameter table** (DB/config, not code): per-niche engagement norms, tier CPM multipliers, typical deliverable mix — seeded from published benchmarks, later auto-tuned from F10 actuals. The allocator and pricing engine read from it for *whatever* niche is selected. Adding a niche = adding a row, not a feature. Also: audit the `NICHES` list for coverage (add automotive, gaming, home, parenting, finance, travel if missing) and make the niche picker searchable.
- *Why:* same "tuned defaults" win as presets, but scales horizontally to any vertical that shows up tomorrow. Marketing can still *target* skincare audiences without the product being skincare-shaped.

**F5-lite. Credibility hints** — S (full F5 below is Tier B)
- *What:* deterministic red-flag heuristics on data we already fetch: engagement-rate way above/below tier norm, round-number follower counts, follower/following anomalies. Badge: `looks healthy | check manually`. Never claim certainty.
- *Why:* 37% fake followers; even a heuristic beats the nothing SMBs have.

**F11. Share/export allocation plan** — S
- *What:* public read-only share link (`/plan/[id]`, no auth, noindex optional) + CSV export + print-friendly PDF view. Branded footer → every shared plan is an ad.
- *Why:* agencies/founders share plans with stakeholders; built-in virality loop.

### Tier B — differentiate (weeks 3–6)

**F5. Credibility score (full)** — M
- Composite 0–100 from: engagement authenticity vs tier benchmark, follower-growth shape (if API exposes), comment-to-like ratio, posting cadence. Cache per-creator in Redis (24h TTL) to control RapidAPI cost. Marketing hook: *"48% of macro accounts show inflated followers — our allocator avoids the tier where fraud lives."*

**F6. Fair-price benchmark ("Is this quote fair?")** — M
- Input: creator handle or follower count + niche + deliverable (Reel/Story/Post) + quoted price → verdict vs our pricing engine's expected band: `fair | high (−N% negotiable) | suspicious-low`. India rate-card data seeded from published 2026 benchmarks, env/DB-configurable like existing pricing. **Standalone free tool page** → SEO magnet ("influencer rate calculator India").

**F7. Barter mode** — M
- Budget input becomes `cash + product units × landed cost`. Allocation prefers barter-receptive tiers (nano/micro) for product-value comp, cash for larger creators. Output labels each creator `cash | barter | hybrid`. No competitor does this; deeply Indian.

### Tier C — retention ladder (month 2+, gate behind usage signals)

**F8. Campaign tracker lite** — L
- Shortlist statuses grow into a kanban: `outreach → negotiating → content due → posted → paid`, with dates and amounts. Explicitly **not** building contracts/payments/marketplace — just replacing the spreadsheet.

**F9. Outreach kit** — M (cheap because Gemini plumbing exists)
- Per shortlisted creator, generate a personalized DM/email (brand brief + creator niche/tier + barter-vs-cash framing). Copy-to-clipboard, not sending — avoids spam/platform-ToS problems entirely. Personalized outreach: ~30% response vs <5% generic.

**F10. Attribution lite (actual vs projected)** — M
- Generate per-creator discount code / UTM suggestion at allocation time; later, user manually enters actual reach/engagement/orders → dashboard shows projected vs actual CPE and *retunes future pricing multipliers per niche from real outcomes*. This closes the data flywheel — allocations get provably better with use, which no rate-card competitor can copy.

### Tier A+ — infrastructure that is also product

**F12. Data independence (drop RapidAPI)** — M, runs parallel to Tier A
- *Problem:* RapidAPI is paid, rate-limited, and sits in our hot path.
- *What:* own `creators` DB as source of truth + background refresher (free-tier provider rotation + keyless DIY Instagram endpoint from a residential runner) + discovery seeding. **Live-tested 2026-07-05: Instagram's `web_profile_info` endpoint returns followers, category, and 12 recent posts' likes/comments — keyless — but only from residential IPs (Render is blocked).** Full test evidence, provider comparison, architecture, and 4-step migration plan: **[2026-07-05-instagram-data-strategy.md](2026-07-05-instagram-data-strategy.md)**.
- *Bonus:* real recent-post engagement data makes F5 credibility hints *much* stronger than RapidAPI estimates, and `category_name` gives free niche classification for F4's generic niche table.

### Explicitly NOT building (and why)
- **Marketplace / creator side of the platform** — different business, needs liquidity we don't have.
- **Auto-DM / auto-email sending** — Instagram ToS risk, spam risk, deliverability burden. Generate, don't send.
- **Payments/escrow** — regulatory weight; revisit at scale.
- **TikTok** — banned in India; Instagram + YouTube Shorts (later) is the correct scope.
- **Full analytics suite** — F10 manual-entry loop first; API-pull analytics only if retention proves demand.

---

## 5. Prioritized order & monetization sketch

**Confirmed by Aryansh (2026-07-05):** ✅ F2 (Budget Health + free public audit) · ✅ F11 (share links + OG images) · ✅ F1 (iterate to final form, see 4 layers above) · ✅ F12 (data independence — RapidAPI isn't free) · 🔁 F4 reshaped to generic niche-aware quality, **no vertical-specific product**.

| # | Feature | Effort | Impact | Order |
|---|---|---|---|---|
| F2 | Budget Health + audit wedge ✅ | S | ★★★★★ | 1 |
| F1 | Explainability L1–L3 ✅ | S | ★★★★ | 2 |
| F11 | Share/export + OG ✅ | S | ★★★★ | 3 |
| F12 | Data independence ✅ | M | ★★★★★ | parallel 1–3 |
| F4 | Generic niche table 🔁 | S/M | ★★★★ | 4 |
| F3 | Saved shortlists | M | ★★★★ | 5 |
| F5 | Credibility hints → score | S→M | ★★★★★ | 6 |
| F6 | Fair-price benchmark | M | ★★★★★ | 7 |
| F7 | Barter mode | M | ★★★★ | 8 |
| F9 | Outreach kit | M | ★★★ | 9 |
| F8 | Campaign tracker | L | ★★★★ | 10 |
| F10 | Attribution lite | M | ★★★★ | 11 |

**Monetization (later, but design for it now):** free = 3 allocations/mo + audits; Pro (₹999–1,999/mo) = unlimited, shortlists, credibility scores, exports; Team = tracker + attribution. F6 and F2-audit stay free forever as acquisition tools.

---

## 6. Implementation plans (grounded in current code)

### F2 — Budget Health flags
- **Backend:** new `services/allocation/diagnostics.ts` — pure function `(result: AllocationResult, creators, budget) => Flag[]` where `Flag = { severity: 'info'|'warn'|'critical', code, message, suggestion?: { move_amount, from_tier, to_tier, projected_delta } }`. Rules: tier concentration >55%, unspent budget >10%, single-creator >35% of spend, macro CPE worse than micro CPE by >1.5×. Call it inside `allocate.ts` and `campaigns.ts`; append `flags` to response (additive — no breaking change).
- **Audit endpoint:** `POST /api/audit` `{ niche, spend: { nano, micro, macro } }` → reuse `getPricedCreators` benchmarks + same diagnostics. **No auth** (rate-limited via existing Upstash) so it works as a top-of-funnel page.
- **Frontend:** `components/BudgetHealth.tsx` — flag cards with severity colors; `/audit` public page.
- **Tests:** Vitest unit tests per rule; route test for `/api/audit` unauthenticated + rate-limited.

### F4 — Vertical presets
- **Backend:** `config/presets.ts` — map preset → `{ default_strategy, tier_weights, pricing_overrides }`; `allocate` schema gains optional `preset`; pricing service accepts per-request overrides (currently env-only — refactor `pricing/index.ts` to take an options bag defaulting to env).
- **Frontend:** preset selector above the form; reads `?preset=` param; presets adjust visible defaults so users see what changed (transparency = F1 spirit).
- **Tests:** preset → expected strategy/weights snapshot tests.

### F1 — Explainable allocation
- **Backend:** `services/allocation/rationale.ts` — deterministic template sentences computed from the same numbers the allocator used (tier CPE comparisons, exclusions, remainders). Append `rationale: string[]` to result. Optional: `?explain=ai` flag routes rationale through `strategyService` for polish, guarded by the existing 503-when-unconfigured pattern.
- **Frontend:** collapsible "Why this split?" panel; "copy as text" button (marketing loop).

### F11 — Share/export
- **Backend:** `share_tokens` table (`id uuid, campaign_id, created_at`) or a signed slug on campaigns; `GET /api/plans/:token` public read-only projection (strip owner data).
- **Frontend:** `/plan/[token]` server-rendered page (fast on Vercel, OG image via `next/og` for social unfurls — this matters for X promotion); CSV via client-side blob; PDF = print stylesheet, not a PDF lib.

### F3 — Saved shortlists
- **DB (Supabase):** `shortlist_items(id, owner_id, creator_handle, creator_snapshot jsonb, niche, tier, est_rate, status text default 'saved', notes, created_at)` + RLS by `owner_id`, matching existing repo pattern in `routes/_repos.ts`.
- **Backend:** `routes/shortlist.ts` CRUD, `requireAuth`, zod schemas mirroring `campaigns.ts`.
- **Frontend:** star toggle on result rows; `/dashboard/shortlist` table with status dropdown.

### F5 — Credibility hints → score
- **Phase 1 (hints):** pure function in `services/credibility.ts` over fields already returned by `influencerService`; thresholds in config. Badge in results UI.
- **Phase 2 (score):** enrich via RapidAPI profile fetch, cache in Redis `cred:{handle}` 24h TTL; budget the API calls (only score creators actually shown). Show score breakdown, always with "heuristic, verify manually" copy — never guarantee.

### F6 — Fair-price benchmark
- **Backend:** `POST /api/benchmark` `{ followers | handle, niche, deliverable, quoted_price }` → expected band from `pricing` service (extend `tierFlat`/`cpm` with deliverable multipliers: Reel 1.0, Story 0.4, Static 0.6, seeded from published India rate cards, env-configurable). Public + rate-limited.
- **Frontend:** standalone `/rate-check` page, no login, SEO title "Instagram Influencer Rate Calculator India"; CTA into the allocator.

### F7 — Barter mode
- **Backend:** `allocate` schema gains `barter?: { unit_value: number, max_units: number }`; allocation treats barter pool as tier-restricted currency (nano/micro only, configurable receptivity per tier); result rows gain `compensation: 'cash'|'barter'|'hybrid'` and unit counts. Core logic change lives in `services/allocation/` as a new pass before bucketing — keep existing strategies untouched and composable.
- **Frontend:** "I can also offer product" toggle → unit value + stock inputs.

### F9 — Outreach kit
- **Backend:** `POST /api/ai/outreach` `{ shortlist_item_id, brand_brief }` → reuse `GeminiClient` + a new prompt in `services/ai/`; same 429/502 handling as `aiStrategy.ts`.
- **Frontend:** "Draft outreach" button on shortlist rows → modal with copy button.

### F8 / F10 — tracker & attribution
- Build only after F3 shows status-field usage (instrument it). F8 = status kanban over `shortlist_items` + `due_date`, `agreed_amount` columns. F10 = `campaign_results(campaign_id, creator_handle, actual_reach, actual_engagement, orders, code)` + a projected-vs-actual view + a periodic job that nudges pricing multipliers per niche from actuals.

---

## 7. Production-readiness checklist (do alongside Tier A)

1. **Render cold starts** — free/starter tier sleeps; either a `GET /health` cron ping every 10 min or upgrade. A 30s first-load kills PH-traffic conversion. *(Highest-priority infra item.)*
2. **Error tracking** — Sentry (free tier) on both apps; Render logs alone won't surface frontend errors.
3. **Product analytics** — PostHog (free tier): track `allocation_run`, `preset_selected`, `flag_shown`, `shortlist_add`, `share_clicked`. Tier B/C decisions above are explicitly gated on these numbers.
4. **Public-endpoint rate limits** — `/api/audit`, `/api/benchmark`, `/plan/:token` need Upstash limits + basic bot filtering before launch.
5. **RapidAPI budget guard** — daily call cap + Redis cache TTLs; alert (email) at 80% quota so a traffic spike can't run up the bill.
6. **SEO/landing** — `/rate-check` and `/audit` as indexable marketing pages; OG images on `/plan/*`; sitemap.
7. **Uptime monitor** — UptimeRobot/BetterStack free tier on both deployments.
8. **DB migrations discipline** — new tables (`shortlist_items`, `share_tokens`, `campaign_results`) added to `docs/db-schema.sql` + RLS policies reviewed before deploy.

---

## 8. Suggested review pass

Mark each feature ✅ build / ❌ skip / 🤔 later directly in this file; recommended first sprint if you agree with the analysis: **F2 → F4 → F1 → F11 + checklist items 1–3** (all S-effort, all compound the PH momentum while it's warm). Then we write the detailed technical plan for the approved set.
