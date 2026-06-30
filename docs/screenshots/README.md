# Creator Nexus — Visual assets for the Twitter calendar

All captured from the **real running app** (local frontend + backend). Dashboard
numbers are produced by the **actual allocation engine** on the sample dataset —
not faked. The pairing below maps each asset to tweets in
[`../twitter-content-calendar.md`](../twitter-content-calendar.md).

> Posting tip: drag the file straight into the X composer. PNGs and the GIF are
> all natively supported. The GIF loops automatically. Keep alt-text — it boosts
> reach and accessibility.

| File | Shows | Best on these tweets | Suggested alt-text |
|---|---|---|---|
| `08-handshake.gif` | The landing hero animation — D2C Brand card and Instagram card slide in and meet at a 🤝 | **Launch announce 5.1**, the launch thread **5.2 (tweet 1)**, brand-intro Day 1 (1.2 / 1.4) | "Animated landing hero: a D2C brand and Instagram creators sliding together into a handshake." |
| `02-landing-hero.png` | Hero headline "Start connecting with the right influencers now" + handshake + CTA | **5.2 (tweet 1)** if you prefer a still over the GIF; **4.3 (tweet 4)** landing animation | "Creator Nexus landing hero with headline and a brand-to-Instagram handshake." |
| `01-landing-full.png` | Whole landing page incl. the 3 feature cards (Budget-first / Creators-focused / Real metrics) + footer | **5.3** (the numbers/honesty tweet), **1.3 (tweet 3)** | "Full Creator Nexus landing page showing the value props and feature cards." |
| `04-dashboard-pets.png` | Full dashboard: Campaign Setup, ₹50,000 budget, Pet Parents niche, Max Reach, the Nano + Micro creator buckets with quote ranges, sample-data banner | **5.2 (tweet 2 — how it works)**, **5.4** ("go click it"), **3.2 (tweet 1)** allocation engine | "Creator Nexus dashboard allocating a ₹50,000 pet-niche budget across nano and micro creator buckets." |
| `06-dashboard-pets-top.png` | Tight crop of the same — setup panel + tier-breakdown totals (good single-image tweet) | **5.1**, **3.1**, **2.2** | "Campaign setup panel and tier-breakdown totals for a ₹50,000 allocation." |
| `05-dashboard-beauty.png` | Full dashboard at ₹2,00,000 Beauty — Nano 50 / Micro 15 / **Macro 1** creators, ₹1.98L spent, ₹1,631 leftover | **5.2 (tweet 3 — strategies)** and **(tweet 5 — filters)**, **3.2 (tweet 2)** three strategies | "Creator Nexus splitting a ₹2,00,000 beauty budget across nano, micro and macro creators." |
| `07-dashboard-beauty-top.png` | Tight crop of the beauty run — setup + Nano/Micro/Macro tier breakdown, total ₹1,98,369 | **3.3** (budget-exact tweet), **6.3** (cost-control), **4.1** | "Tier breakdown: 50 nano, 15 micro, 1 macro creator totalling ₹1,98,369 against a ₹2,00,000 budget." |
| `03-login.png` | Sign In / Sign Up auth card (Supabase) | **4.2** (auth + ownership), **4.1** | "Creator Nexus sign-in screen with email and password, powered by Supabase auth." |

## Which to lead with
- **Launch day (Day 5):** lead 5.1 with `08-handshake.gif`, lead the 5.2 thread with the GIF on tweet 1 and `04-dashboard-pets.png` on tweet 2.
- **Daily build tweets (Days 1–4):** sprinkle `06-` / `07-` crops — they read well at a glance in the timeline.
- **Bug thread (6.1):** no screenshot needed; it's text-driven. Optionally end it with `05-dashboard-beauty.png` as the "here's the finished thing" payoff.

## Notes / regenerating
- The small dark **"N" badge** bottom-left is the Next.js dev indicator; it does
  **not** appear on the production Vercel build. Crop it out if you grab fresh
  shots locally, or just screenshot the live site instead.
- Dashboard data uses the **sample dataset** (hence the in-app "Showing sample
  creator data" banner) — honest to show, and it matches your "demo data is the
  default" commit.
- To re-capture against the **live** site or with your own logged-in account,
  just screenshot `https://creator-nexus-virid.vercel.app/` directly while
  signed in — that gives real, linkable creator profiles.
