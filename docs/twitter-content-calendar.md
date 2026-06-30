# Creator Nexus — Build-in-Public Twitter Calendar

6 days · ~7 tweets/day · mixed formats (single-liners, 2-liners, threads)
Goals: impressions + reach to people who can help with Instagram APIs / free scraper credits.
Days 5–6 = launch + full feature + bug-fix hype.

---

## DAY 1 — Set the problem (why this exists)

**1.1 (single line)**
Indian D2C brands burn lakhs on influencers by *guessing* the split between nano, micro and macro creators. I'm building the tool that stops the guessing. 🧵 soon

**1.2 (2 lines)**
Started building "Creator Nexus" this week.
You give it a budget + a niche, it tells you exactly how to spread that money across creator tiers for max reach or max engagement. Building it fully in public.

**1.3 (thread)**
Why influencer budgeting is broken for small D2C brands 🧵

1/ A founder has ₹2L for a campaign. Where does it go? 5 macro influencers? 50 nano ones? Nobody actually knows — they go by vibes and a marketing agency's invoice.

2/ Nano creators (1K–10K) convert insanely well but you need many. Macro creators (100K+) give reach but cost 10–50x. The *math* of the split is the whole game.

3/ So I'm building Creator Nexus: enter budget → it allocates across nano/micro/macro and projects your reach, engagement and cost-per-engagement before you spend ₹1.

4/ Stack: Next.js 16 + Express/TS + Supabase + Redis, Instagram data via RapidAPI. Building it in the open. Follow along. 👇

**1.4 (single line)**
Day 1 of building in public: an influencer budget allocator for D2C brands. If you've ever asked "should I book 1 big creator or 20 small ones?" — that's the question this answers.

**1.5 (2 lines)**
First architecture decision locked: a creator's *tier* is always derived from follower count, never stored.
Nano 1K–10K, micro 10K–100K, macro 100K+. Makes "tier doesn't match followers" bugs structurally impossible. Small decision, huge payoff later.

**1.6 (the ASK — variant A)**
Building a tool that needs reliable Instagram creator data (followers, engagement, verified status).
Right now I'm on RapidAPI scrapers. They work but quota is tight.
👉 If you know a solid/affordable Instagram data API — or can spare free scraper credits — reply or DM. Would genuinely speed this up. 🙏

**1.7 (single line)**
Naming is hard. This started life as "InstaBucket." It's now "Creator Nexus." Both are placeholders until someone roasts them in the replies.

---

## DAY 2 — The engine (data + pricing)

**2.1 (single line)**
The hardest part of an influencer tool isn't the UI. It's getting trustworthy creator metrics. Everything downstream is just math.

**2.2 (2 lines)**
Built the data layer today: real Instagram metrics via RapidAPI, with a deterministic generated fallback.
So even with zero API key the product *always* returns a full creator set. No blank screens, ever. Graceful degradation > a 500 error.

**2.3 (thread)**
How I price an influencer programmatically 🧵

1/ You can't just charge "₹X per follower." A 5K creator with 12% engagement is worth more than a 200K ghost account.

2/ So pricing = base rate per tier × an engagement multiplier. Higher real engagement → higher value → the allocator prefers them.

3/ I shipped 4 pricing models behind an env-driven config, so a brand can tune assumptions without touching code.

4/ Then reality hit: engagement rates came back as NaN and Infinity from messy API data, and quietly poisoned every cost. 🙃

5/ Fix: sanitize every signal *before* pricing, floor it at 1, enforce cost_min ≤ cost_max as an invariant. Wrote corner-case tests that surfaced the NaN bug in the first place. Tests earn their keep.

**2.4 (single line)**
Today's bug: messy Instagram data made engagement rate = Infinity, which made one creator cost ₹∞. The allocator happily tried to book them. Sanitize your inputs, kids.

**2.5 (2 lines)**
Added a Redis caching layer over the Instagram provider today.
Every creator lookup is cached 12h+ so I don't melt my API quota on repeat requests. Cache-as-a-decorator = providers don't even know caching exists. Clean seam.

**2.6 (the ASK — variant B)**
Real talk: RapidAPI Instagram scrapers are the single biggest constraint on this project — rate limits + quota cost.
If anyone here works at / knows an Instagram data provider, or has scraper credits going spare, I'd love to test against you. RTs help me find them 🙏

**2.7 (single line)**
"Just cache it" is doing 90% of the load-bearing work in this entire app.

---

## DAY 3 — Allocation (the actual brain)

**3.1 (single line)**
Shipped the part that makes this a *product* and not a spreadsheet: the budget allocation engine.

**3.2 (thread)**
The allocation engine — the actual brain of Creator Nexus 🧵

1/ Input: a budget, a niche, a strategy. Output: which creators to book and the projected reach/engagement.

2/ Three strategies:
• max-reach (greedy on followers)
• max-engagement (greedy on real engagement)
• tier-balanced (spread across nano/micro/macro)

3/ Each tier gets a share of the budget, then we fill buckets until the money runs out — with an engagement buffer so projections aren't fantasy.

4/ The nasty bug: naive tier splits *overshot* the budget by a few rupees because of rounding. For a budgeting tool, an accidental rupee over is the one unforgivable sin.

5/ Fix: floor each tier's share + redistribute the remainder deterministically. 23 corner-case tests guard it now. (Max-Engagement *can* intentionally spend up to 10% over — that's a disclosed choice the brand opts into, not a rounding bug.)

**3.3 (single line)**
A budgeting tool that goes ₹3 over budget due to *rounding* is broken. Spent today making accidental overshoot mathematically impossible (the only time it goes over is the Max-Engagement mode you opt into — capped at +10%).

**3.4 (2 lines)**
TIL writing the corner-case tests *first* is cheating in the best way.
The 23 allocation tests I wrote caught the budget-overshoot AND the NaN-cost bug before any user ever could. Test-driven, genuinely.

**3.5 (the ASK — variant C, casual)**
👀 anyone here using a good Instagram API for follower + engagement data in 2025? asking for a SaaS (mine). currently on RapidAPI, open to better/cheaper. drop names below 👇

**3.6 (2 lines)**
Decision: all money stays in INR, and budgets use the *midpoint* of each creator's cost range.
Building for Indian D2C means ₹, lakhs, and creator rates that swing wildly. The tool speaks the user's currency, literally.

**3.7 (single line)**
Backend is now: real Instagram data → cached → priced → allocated → projected. Each stage swappable. This is the part I'm quietly proud of.

---

## DAY 4 — Auth, history, and the frontend takes shape

**4.1 (single line)**
A tool brands will actually trust needs accounts, saved campaigns, and "only YOU can see your data." Built all of that today.

**4.2 (2 lines)**
Added Supabase JWT auth + per-user campaign history today.
Every brand and campaign has an ownership check — try to open someone else's campaign and you get a clean 403, not their data. Multi-tenant from day one.

**4.3 (thread)**
Frontend day. Turning the engine into something a marketer would actually click 🧵

1/ Next.js 16 + Tailwind v4. The dashboard: pick niche → set budget → choose strategy → see the allocation across tiers.

2/ Killed a UX trap: sliders used to refetch on *every tick*, hammering the API. Now there's an explicit "Apply Filters" button. Your quota will thank you.

3/ Added India location + city filtering, a verified-only toggle, and pagination per tier (10/creator page) so big niches don't render 200 cards at once.

4/ Plus a landing page with a little brand-↔-Instagram handshake animation, because first impressions matter even for a B2B tool. 🤝

**4.4 (single line)**
Small win that felt huge: only *verified, real* creator profiles get linked now — no more dead Instagram links from stale handles.

**4.5 (2 lines)**
Made demo data the default; live Instagram API is now opt-in via a single env flag.
Why? So anyone can clone the repo, run it, and see a full working product in 30 seconds without burning my RapidAPI quota. Contributor-friendly by design.

**4.6 (the ASK — variant A remix, partnership angle)**
I'm at the point where Instagram data quality is the ceiling on this product.
Looking for: an Instagram API partner, scraper credits, or even an intro to someone who runs one. Building a real D2C tool around it. If that's you (or you know them) — my DMs are open. 🙏

**4.7 (single line)**
Shipped a Postman collection with all 13 endpoints + a one-dropdown Local↔Production switch so contributors can poke the API in 2 minutes. Lowering the bar to help me. 😄

---

## DAY 5 — LAUNCH DAY (it's live)

**5.1 (single line — the announcement)**
🚀 It's live. Creator Nexus — tell it your budget, it tells you exactly how to split it across Instagram creators for max reach or engagement. Built in public over the last 2 weeks. Link below 👇

**5.2 (the big launch thread)**
🚀 Launching Creator Nexus — an influencer budget allocator for Indian D2C brands. Built fully in public. Here's everything inside it 🧵

1/ THE PROBLEM
Brands guess how to split influencer spend across nano/micro/macro creators. Wrong split = wasted lakhs. Creator Nexus does the math for you.

2/ HOW IT WORKS
Enter budget + niche + strategy → it allocates spend across creator tiers and projects reach, engagement, and cost-per-engagement *before* you spend a rupee.

3/ THREE STRATEGIES
• Max reach
• Max engagement
• Tier-balanced
Pick your goal, the engine optimizes for it.

4/ REAL DATA
Live Instagram metrics via RapidAPI (Instagram Scraper 2025) — followers, engagement, verified status, country + city. Cached in Redis to stay fast and quota-friendly. Falls back to a generated dataset so it never breaks.

5/ FILTERS
India location + city filter, verified-only toggle, paginated tier buckets. Find the right creators, not all the creators.

6/ TRUST
Supabase auth, per-user saved campaign history, ownership checks on every record. Your campaigns are yours.

7/ STACK
Next.js 16 · Tailwind v4 · Express + TypeScript · Supabase · Upstash Redis · RapidAPI. Frontend on Vercel, API on Render. 129 backend tests green, 0 audit vulnerabilities.

8/ Built in public, mostly solo (+ a lot of Claude Code). Try it, break it, tell me what's wrong 👇
https://creator-nexus-virid.vercel.app/

**5.3 (2 lines — the honesty flex)**
Numbers behind the launch:
129 backend tests passing · 19 test files · 0 npm audit vulnerabilities · every endpoint documented in Postman. I wanted "indie project" to stop being an excuse for "fragile."

**5.4 (single line)**
The whole product runs on demo data by default — so you can try Creator Nexus right now without an account or an API key. Go click it. 👇 https://creator-nexus-virid.vercel.app/

**5.5 (the ASK — launch-day version, strongest)**
Creator Nexus is live — and now the bottleneck is obvious: Instagram data.
RapidAPI gets me to MVP, but to scale I need a serious Instagram API partner or scraper credits.
If you run one, work at one, or know someone — this is the RT/DM that genuinely moves my project forward. 🙏

**5.6 (2 lines)**
Biggest lesson launching this: graceful degradation is a feature, not a nicety.
Missing API key? Generated data. API 500s? Fallback creator. Bad engagement number? Sanitized. The user never sees the mess underneath. That's the whole job.

**5.7 (single line)**
If you're a D2C founder or run influencer campaigns in India — I built Creator Nexus for you and I want it to be wrong in ways you can teach me. Reply with your worst budgeting horror story. 👇

---

## DAY 6 — Post-launch: the bugs, the build story, the ask (sustained hype)

**6.1 (thread — every bug Claude Code and I killed)**
Creator Nexus is live. Here's the graveyard of bugs we killed to get here 🪦🧵

1/ Engagement rate came back as NaN/Infinity from messy Instagram data → poisoned every price. Fixed: sanitize + floor every signal before pricing.

2/ Tier budget split *accidentally* overshot the total by rounding rupees. Fixed: floor each share + redistribute remainder deterministically. (Going over is now only ever the +10% Max-Engagement mode you deliberately pick.)

3/ cost_min could exceed cost_max. Fixed: enforced as an invariant with corner-case tests.

4/ Sliders refetched the API on every tick → quota slaughter. Fixed: explicit Apply Filters button.

5/ Dead Instagram links from stale handles. Fixed: only link verified, real profiles.

6/ Supabase client wouldn't build on Node <22 (missing WebSocket). Fixed: polyfilled `ws`.

7/ Rate limiter was keying on a user id that didn't exist yet (runs before auth). Fixed: honest gateway-level IP limit.

8/ Repo had npm audit vulns. Fixed: vitest 3 + esbuild override → 0 vulnerabilities.

Every one caught by tests or review before a user hit it. 129 tests green. 🟢

**6.2 (single line)**
My favorite bug from this build: an influencer who cost ₹Infinity because of one bad engagement number, and the allocator cheerfully trying to fit them in the budget. Sanitize. Your. Inputs.

**6.3 (2 lines)**
Real cost-control story: I map Instagram Scraper 2025's /userinfo as *1 request per creator* and cache it for 12h+.
When you're rationing API quota, every saved request is real money. Architecture *is* budgeting.

**6.4 (the ASK — variant B remix, ongoing)**
Still the #1 thing I need for Creator Nexus: a better Instagram data source.
On RapidAPI today. Looking for more generous quota, cleaner data, or free credits to test with.
Know a provider? Run one? RT so it reaches them. This single intro could 10x the project 🙏

**6.5 (single line)**
Build-in-public scorecard: 2 weeks, ~50 commits, a full pricing + allocation engine, auth, history, a landing page, and 0 audit vulns. Solo + Claude Code. Shipping > perfect.

**6.6 (2 lines)**
What's next for Creator Nexus: more niches, real campaign performance tracking, and (if I find the right API) live engagement at scale.
What would *you* add if this were your tool? Genuinely collecting the roadmap from replies. 👇

**6.7 (the ASK — casual remix, last call)**
asking one more time because it matters: anyone got Instagram scraper API credits or a provider rec? 🙏
i've built the whole product around creator data — RapidAPI works but i want to push further. names, intros, DMs all welcome. ❤️

---

## Reusable "Instagram API help" tweets (drop any of these whenever)

**A —**
Building a D2C influencer tool that lives or dies on Instagram data quality. On RapidAPI now. If you know a better/cheaper Instagram API or have free scraper credits, DM me 🙏 RTs appreciated.

**B —**
PSA: I will trade build-in-public shoutouts for Instagram API scraper credits. Building Creator Nexus, need follower + engagement data at scale. Who can help? 👀

**C —**
The bottleneck on my SaaS isn't code — it's Instagram data access. RapidAPI gets me to MVP, but I need real quota to scale. If you run an Instagram API or know someone who does, this RT helps me find them. 🙏
