# Creator Nexus — Twitter Launch Calendar (Fri–Sun)

**Days 1–2 already posted** (problem + data/pricing build). This file replaces the old 6-day plan with a fast **2.5-day launch push**: today (Fri 3 Jul), tomorrow (Sat 4 Jul), and Sun 4-jul morning.

- **You have X Premium** → up to 25,000 chars/post. So the "threads" below can be posted **two ways**:
  - **Classic thread** (numbered tweets) → each tweet is a fresh entry point, usually more total impressions + more reply hooks. **Default — recommended.**
  - **One long post** (paste the whole thing) → cleaner, good for the reader who lands cold. Use for the "how to use it" walkthrough if you want.
- **Goal:** impressions + reach to people who can (a) try it and give feedback, and (b) hook me up with a better/free **Instagram data API**.
- Live URL: **https://creator-nexus-virid.vercel.app/**
- **Screenshots** live in `docs/screenshots/` — drag straight into the composer. Always keep alt-text (accessibility + reach). Crop the small dark "N" badge (Next dev indicator) if using local shots, or screenshot the live Vercel site.

**Posting rhythm:** 3 anchor posts/day, spaced across the high-traffic IST windows. Best windows for Indian + global indie/tech Twitter: **9–10am IST**, **1–2pm IST**, **8–10pm IST** (8–10pm is where build-in-public peaks — US morning overlaps too). Reply to *everyone* in the first 60 min of each post; early replies are the whole game for reach.

---

# 📅 FRIDAY 3 JUL — LAUNCH DAY

## L1 — The announcement (single, punchy) · **~9:30am IST** · 📎 `08-handshake.gif`

> I built a tool that answers one question every D2C brand gets wrong:
>
> "Do I book 1 big influencer, or 20 small ones?"
>
> Tell Creator Nexus your budget + niche → it splits the money across nano/micro/macro creators and shows the reach you'll get *before* you spend ₹1.
>
> It's live. Try it (no signup needed) 👇
> https://creator-nexus-virid.vercel.app/

*Alt-text:* "Animated landing hero: a D2C brand card and an Instagram creators card slide together into a handshake."
*Why:* Question hook = instant "wait, which is it?" curiosity. GIF stops the scroll. "No signup" removes the #1 reason people don't click.

---

## L2 — The launch thread (the big one) · **~1:30pm IST** · 📎 GIF on 1/, screenshots inline

**Post as a classic thread. This is your anchor for the whole launch — pin it.**

**1/** 🚀 Launching **Creator Nexus** — an influencer budget allocator for Indian D2C brands.

You give it a budget + a niche. It tells you *exactly* how to split that money across creators for max reach or max engagement — and projects the results before you spend a rupee.

Built in public, solo (+ a lot of Claude Code). Everything's inside 👇
📎 *`08-handshake.gif`*

**2/ THE PROBLEM**
A founder has ₹2L for a campaign. Where does it go — 5 macro creators, or 50 nano ones?

Nobody actually knows. They go by vibes and an agency invoice. Nano creators (1K–10K) convert insanely well but you need many. Macro (100K+) give reach at 10–50x the cost. The *math of the split* is the entire game — and it's the part everyone skips.

**3/ HOW IT WORKS**
Enter budget → pick a niche → pick a strategy → hit Apply.

It allocates your spend across nano/micro/macro tiers and projects **reach, engagement, and cost-per-engagement**. A creator's tier is always *derived* from follower count, never stored — so "tier doesn't match followers" bugs are structurally impossible.
📎 *`04-dashboard-pets.png`*

**4/ IT'S EXACT TO THE RUPEE**
Real run: **₹50,000, Pet Parents niche** → 34 nano + 6 micro creators, **₹49,404 spent, ₹596 left, ~219K reach.**

A budgeting tool that goes even ₹3 over budget is broken. Making accidental overshoot mathematically impossible was a whole day of work. Worth it.
📎 *`06-dashboard-pets-top.png`*

**5/ FOUR STRATEGIES**
• **Max Reach** — most eyeballs per rupee, favours bigger creators
• **Max Engagement** — greedy on real engagement rate
• **Best Value** — best bang per rupee
• **Pick Count** — maximise number of creators

Same budget, four completely different creator line-ups. Pick your goal, the engine optimises for it.
📎 *`05-dashboard-beauty.png`*

**6/ SCALES UP CLEANLY**
**₹2,00,000, Beauty & Skincare** → 50 nano + 15 micro + **1 macro**, **₹1,98,369 spent, 659K projected reach.** Notice it books exactly *one* macro creator — the math decided that, not me.
📎 *`07-dashboard-beauty-top.png`*

**7/ THE STACK**
Next.js 16 · Tailwind v4 · Express + TypeScript · Supabase (auth + saved campaigns) · Upstash Redis (caching) · Instagram data via RapidAPI. Frontend on Vercel, API on Render.
**129 backend tests green · 0 npm-audit vulnerabilities.** "Indie" is not an excuse for "fragile."

**8/ TRY IT — RIGHT NOW**
Runs on realistic demo data by default, so you can click through the whole product with **no account and no API key.**

Break it. Tell me what's wrong. Reply with your worst influencer-budgeting horror story 👇
https://creator-nexus-virid.vercel.app/

*Alt-text per image:* reuse the descriptions from `docs/screenshots/README.md`.
*Why:* Problem → how → proof → stack → CTA is the canonical launch-thread shape. Real numbers (₹49,404 / ₹596 left) are the credibility spike. Ends on a reply-bait question, not just a link.

---

## L3 — The ASK (Instagram data) · **~8:45pm IST** · text-only

> Creator Nexus is live — and the bottleneck is now painfully obvious: **Instagram data.**
>
> The whole product lives or dies on reliable follower + engagement + verified-status data. RapidAPI scrapers get me to MVP, but quota is tight and the data's messy.
>
> 👉 If you run an Instagram data API, work at one, or have spare scraper credits — reply or DM. This single intro moves the project more than any line of code I could write today. RTs genuinely help me find them 🙏

*Why:* Post the ask *after* the launch thread is circulating, so people click through, see it's real, then read the ask primed to help. Evening = peak indie-hacker/founder audience.

---

# 📅 SATURDAY 4 JUL — DEEP DIVES (problem + tech)

## S1 — THREAD: "Why influencer budgeting is broken" · **~10am IST** · 📎 optional `01-landing-full.png` on last tweet

**1/** Indian D2C brands burn *lakhs* on influencers by guessing the split between nano, micro and macro creators.

Here's exactly why that guess is so expensive — and how I turned it into math 🧵

**2/** The instinct is "book the biggest creator I can afford." A 500K macro creator feels safe.

But a 200K account with 1.2% engagement is often a *ghost with reach*. A 5K creator at 12% engagement will out-convert them for a fraction of the cost. Follower count alone lies.

**3/** So the real question isn't "big or small creator?" It's **"what mix?"**

Some nano for conversion. Some micro for the sweet spot. Maybe one macro for the reach spike. The *ratio* is where the money is won or lost — and it changes with every budget and niche.

**4/** That ratio is a solvable problem. Budget → tiers → fill each bucket by your chosen strategy until the money runs out, with an engagement buffer so the projection isn't fantasy.

Humans do this on gut. A machine does it exactly, in a second, and never goes over budget.

**5/** That's the entire thesis of Creator Nexus: replace the agency's "trust me" with a number you can see *before* you spend.

Enter a budget, watch the split happen. No signup 👇
https://creator-nexus-virid.vercel.app/
📎 *`01-landing-full.png`*

*Why:* Pure problem/insight thread — no product pitch until the end. This is the one most likely to get RT'd by marketing folks who *feel* the pain. Great top-of-funnel.

---

## S2 — THREAD: "How it works + the stack" · **~1:30pm IST** · 📎 `04-dashboard-pets.png`, `03-login.png`

**1/** People asked how Creator Nexus actually works under the hood. Here's the full pipeline, honestly — including the bugs 🧵

Real Instagram data → cached → priced → allocated → projected. Every stage swappable.

**2/ DATA**
Instagram metrics come via RapidAPI (followers, engagement, verified, city). Messy real-world data broke pricing instantly: engagement came back as `NaN` / `Infinity` and made one creator cost **₹∞** — which the allocator cheerfully tried to fit in the budget 🙃

Fix: sanitize + floor every signal *before* it touches pricing.

**3/ CACHING**
Every creator lookup is cached in Redis for 12h+, added as a *decorator* so the providers don't even know caching exists. When you're rationing API quota, every saved request is real money. Architecture is budgeting.

**4/ PRICING**
Not "₹X per follower." Price = base rate per tier × an engagement multiplier, so higher *real* engagement → higher value → the allocator prefers them. Four pricing models sit behind an env config so assumptions are tunable without touching code.

**5/ ALLOCATION**
The brain. Naive tier splits overshot the budget by a few rupees (rounding). For a budgeting tool that's the one unforgivable sin. Fix: floor each tier's share + redistribute the remainder deterministically. 23 corner-case tests guard it.
📎 *`04-dashboard-pets.png`*

**6/ TRUST**
Supabase JWT auth + per-user saved campaigns, with an ownership check on every record. Open someone else's campaign → clean 403, not their data. Multi-tenant from day one.
📎 *`03-login.png`*

**7/ STACK, in full**
Next.js 16 · Tailwind v4 · Express/TS · Supabase · Upstash Redis · RapidAPI. Vercel + Render. 129 tests · 0 audit vulns.

Biggest lesson: **graceful degradation is a feature.** No API key? Generated data. API 500s? Fallback creator. The user never sees the mess underneath.

**8/** All built in public, mostly solo + Claude Code. Poke it 👇
https://creator-nexus-virid.vercel.app/

*Why:* Technical audience loves the "here are the bugs" honesty — it's the most sharable format among devs. The ₹∞ bug is your signature story; lead the dev crowd with it.

---

## S3 — Engagement bait (poll) · **~8:30pm IST** · text-only

> Quick one for anyone who's run an influencer campaign 👇
>
> You've got ₹1,00,000 for one campaign. Be honest — how did you *actually* decide the creator split?
>
> 🔲 Gut feeling / vibes
> 🔲 The agency decided
> 🔲 A spreadsheet
> 🔲 I didn't — I booked whoever DM'd back
>
> (Building a tool that does this with math. Curious how bad the status quo really is.)

*Why:* Polls are the cheapest reach on X — one tap to engage, and the algorithm rewards it. The options are self-deprecating and true, so people vote *and* quote-tweet. Feeds directly into your problem narrative.

---

# 📅 SUNDAY 5 JUL (morning) — HOW TO USE IT + FINAL ASK

## U1 — THREAD: "How to actually use it" (walkthrough) · **~10am IST** · 📎 `04-`, `06-`, `05-`, `07-`
**Good candidate for the single long-post format if you want it all in one screen.**

**1/** How to use Creator Nexus in 30 seconds — a real walkthrough with two live runs 🧵
No signup, no API key. Follow along: https://creator-nexus-virid.vercel.app/

**2/ STEP 1 — Set your budget & niche**
Drag the budget slider (₹5,000 → ₹2,00,000), pick a Content Niche (Pet Parents, Beauty & Skincare, …), optionally filter by city. Hit **Apply Filters**.
📎 *`06-dashboard-pets-top.png`*

**3/ STEP 2 — Pick a strategy**
Max Reach / Max Engagement / Best Value / Pick Count. This is where the *same* budget becomes four different creator line-ups. Toggle and watch the buckets rebuild.

**4/ RUN A — ₹50,000, Pet Parents, Max Reach**
→ 34 nano + 6 micro creators. **₹49,404 spent, ₹596 leftover, ~219K reach.** Zero macro creators — at this budget the math says nano+micro wins. Every creator card shows followers, avg views, engagement + a quote range.
📎 *`04-dashboard-pets.png`*

**5/ RUN B — ₹2,00,000, Beauty & Skincare, Max Reach**
→ 50 nano + 15 micro + **1 macro.** **₹1,98,369 spent, ₹1,631 leftover, ~659K reach.** Bump the budget 4x and *one* macro creator finally earns its slot. You can see the allocation logic change in real time.
📎 *`07-dashboard-beauty-top.png` (then `05-dashboard-beauty.png` for the full buckets)*

**6/ STEP 3 — Save it**
Sign up (Supabase) and every campaign is saved to your history, private to you. Come back, tweak the budget, compare runs.

**7/** That's it. Budget in → creator plan out, exact to the rupee.
Try your own niche + budget and tell me where the allocation feels wrong 👇
https://creator-nexus-virid.vercel.app/

*Why:* The "how to use" thread converts curious viewers into actual users. Screenshots carry it — someone can understand the whole product without leaving the timeline. Two contrasting runs prove the engine actually reasons.

---

## U2 — THREAD: The Instagram-data ask (dedicated) · **~12:30pm IST** · text-only

**1/** One honest ask to close out the launch weekend 🧵

I've built an entire D2C influencer tool — pricing engine, allocation engine, auth, saved campaigns, a landing page, 129 tests. The code is the *easy* part now.

The hard part is **Instagram data.**

**2/** The product needs reliable follower counts, engagement rates, verified status, and city data at scale. Right now that comes from **RapidAPI Instagram scrapers.**

They work — but quota is tight, rates are messy, and it's the single ceiling on how far this can go.

**3/** I've engineered *around* it as hard as I can: 12h Redis caching, one request per creator, a deterministic fallback dataset so it never breaks. But caching only stretches quota — it doesn't create it.

**4/** So I'm asking the timeline:
• Know a solid/affordable **Instagram data API**?
• Work at one?
• Have **free scraper credits** going spare to test with?
• Or just an intro to someone who runs one?

Reply or DM. I'll happily trade build-in-public shoutouts for it.

**5/** RTs genuinely help this reach the right person — the API founder, the growth person, the friend-of-a-friend who runs a scraper. This is the one intro that 10x's the project 🙏
https://creator-nexus-virid.vercel.app/

*Why:* A standalone, no-pitch ask thread on Sunday afternoon (people are relaxed + scrolling). Clear, specific asks ("free credits", "an intro") convert far better than a vague "help." RT-call is explicit.

---

## U3 — Wrap-up / roadmap + last call · **~1:30pm IST (first half of day)** · 📎 `01-landing-full.png`

> Launch-weekend scorecard for **Creator Nexus**:
> • Live, running on demo data so anyone can try it free
> • Budget → creator allocation, exact to the rupee, 4 strategies
> • Next.js 16 · Express/TS · Supabase · Redis · RapidAPI
> • 129 tests green · 0 audit vulns · built solo + Claude Code
>
> What's next: more niches, real campaign performance tracking, and live Instagram data at scale (if I find the right API 👀).
>
> If this were *your* tool — what would you add? Genuinely building the roadmap from the replies 👇
> https://creator-nexus-virid.vercel.app/

*Alt-text:* "Full Creator Nexus landing page showing the value props and feature cards."
*Why:* Closes the weekend with momentum + an open question (roadmap-from-replies) that keeps the thread alive into next week and gives you next week's content for free.

---

## 🔁 Reusable drop-in tweets (fire any time a conversation opens up)

**A —** Building a D2C influencer tool that lives or dies on Instagram data quality. On RapidAPI now. Know a better/cheaper Instagram API or have free scraper credits? DM me 🙏 RTs appreciated.

**B —** PSA: I'll trade build-in-public shoutouts for Instagram API scraper credits. Building Creator Nexus — need follower + engagement data at scale. Who can help? 👀

**C —** The bottleneck on my SaaS isn't code, it's Instagram data access. RapidAPI gets me to MVP; I need real quota to scale. If you run an Instagram API or know someone, this RT helps me find them 🙏

**D — (reply-bait for anyone who says "cool project")** Thanks 🙏 If you've ever run an influencer campaign — how did you decide the creator split? Trying to find out how wrong the status quo really is.

---

## ⏱️ At-a-glance schedule

| When (IST) | Post | Media |
|---|---|---|
| Fri 9:30am | **L1** announcement | `08-handshake.gif` |
| Fri 1:30pm | **L2** launch thread (pin) | GIF + 04/06/05/07 |
| Fri 8:45pm | **L3** the ask | — |
| Sat 10:00am | **S1** why budgeting is broken | `01-landing-full.png` |
| Sat 1:30pm | **S2** how it works + stack | `04`, `03` |
| Sat 8:30pm | **S3** poll | — |
| Sun 10:00am | **U1** how to use it | `06`, `04`, `07`, `05` |
| Sun 12:30pm | **U2** Instagram-data ask thread | — |
| Sun 1:30pm | **U3** wrap-up + roadmap | `01-landing-full.png` |

**Golden rules:** pin L2 · reply within the first hour of every post · never post a bare link without a hook line above it · quote-tweet your own launch thread on Sat/Sun with a new angle to recycle its reach.
