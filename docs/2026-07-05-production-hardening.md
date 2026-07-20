# Production Hardening — Real Data, BYOK AI, Strategist UI
*2026-07-05 · Findings + designs for review before implementation*

---

## 1. 🔴 CRITICAL: signed-up users are seeing FAKE influencers right now

### The finding (confirmed in code)
- `config/env.ts:12` — `rapidApiEnabled` **defaults to `false`**. Live data is opt-in via `RAPIDAPI_ENABLED=true`.
- `RapidApiProvider.ts:119` `getProvider()` — when `rapidApiEnabled` is false **or** the key/host are missing, it returns `GeneratedProvider` directly. Even when enabled, if the live API yields nothing it silently falls back to generated data.
- `GeneratedProvider.ts` produces **synthetic accounts that do not exist on Instagram**: handles like `catlover_official0`, `i.pravatar.cc` avatars, and — the tell — **`verified: false`** with a code comment: *"synthetic demo accounts that do NOT exist on Instagram, so the UI must not link to them."*

**So unless you set `RAPIDAPI_ENABLED=true` (plus a valid key/host) on Render, every marketer who signs up is being shown 96 fabricated creators per niche.** That is exactly the "people seeing influencers who aren't on the platform" problem you flagged — and it's live in production today.

### Two things to verify immediately
1. **Render env:** is `RAPIDAPI_ENABLED=true` set, with a working `RAPIDAPI_KEY` + `RAPIDAPI_HOST`? (Check Render → your backend service → Environment.) If not, it's 100% generated data.
2. **Even the "real" path is a fixed seed list** — `handles.ts` `REAL_HANDLES[niche]` (max 12 curated handles/niche), enriched via RapidAPI. It's real creators, but a small hand-picked set, not discovery.

### The fix (ties directly to F12 data-independence + verified-gating)
1. **Short term (today):** decide the honest posture. Either (a) turn RapidAPI on and confirm real data flows, or (b) if data isn't ready, **gate the UI on `verified: true`** so fabricated creators are never shown/linked — show a "we're expanding coverage for this niche" state instead of fake names. Option (b) is the integrity-preserving default until the DIY pipeline lands.
2. **Real fix:** ship **F12** from [the data-independence plan](2026-07-05-instagram-data-strategy.md) — the DIY keyless scraper (live-proven today: real followers + engagement for `mamaearth.in`, `powerdrift`, `fittuber`, etc.) populates a `creators` DB of **only real, public, openable profiles**, every row `source`-stamped. Then the app never has a reason to show a fabricated handle.
3. **Guardrail regardless:** the frontend must treat `verified: false` as non-linkable and visually distinct (or hidden). Add a test asserting no `verified: false` creator is ever rendered as a clickable Instagram link.

---

## 2. BYOK multi-provider AI Strategist (owner-key OR user-key, encrypted)

### Why
The AI Strategist (`routes/aiStrategy.ts`) is hard-wired to Gemini and returns 503 when the key is missing/quota-exhausted — which is what you're hitting. Goal: let it run on **our** key by default, or on a **user-supplied** key (OpenAI / Gemini / Claude), stored encrypted.

### Design

**Provider abstraction (backend).** Today `strategyService.getStrategy(brief, { client })` already takes an injected `StrategyClient` (see `aiStrategy.ts:__setStrategyClient`) — this is the seam. Generalize it:
```
interface StrategyClient { generate(brief): Promise<Advisory> }   // already exists
- GeminiClient   (exists)
- ClaudeClient   (new — Anthropic SDK, structured outputs)
- OpenAIClient   (new)
resolveClient(user, req):
  1. if user has a saved key for a provider → build that provider's client from the decrypted key
  2. else if owner key configured for default provider → use it (owner-paid)
  3. else → 503 "add your own AI key in Settings, or try later"
```
Each client maps its raw output into the existing `Advisory` shape (`recommended_niche`, `tier_mix`, `content_ideas`, `selected_creator_ids`, …) so the frontend and `AiResult` contract are untouched.

**Key storage (encrypted at rest).**
- New Supabase table `user_ai_keys(owner_id, provider text, ciphertext bytea, last4 text, created_at)`, RLS by `owner_id`.
- Encrypt with **AES-256-GCM** using a server-side `AI_KEY_ENC_SECRET` (env, 32 bytes) — *reversible* encryption, not a hash (we must decrypt to call the provider; "hash" wouldn't work here). Store only `ciphertext` + `last4` (for display: `sk-…a1b2`). Never return the plaintext key to the client after save.
- New routes: `POST /api/ai/keys` `{provider, key}` (validates with a cheap probe call, then stores), `GET /api/ai/keys` (returns provider + last4 only), `DELETE /api/ai/keys/:provider`.
- Transport: HTTPS only (already true on Render/Vercel). Rotate `AI_KEY_ENC_SECRET` = re-encrypt job.

**Frontend (Profile/Settings page).**
- "AI Provider Keys" section: 3 rows (OpenAI / Gemini / Claude), each with a password input, Save, and a `•••• last4` + Remove state once set.
- Strategist page: a small "Using: [Our AI ▾ | Your OpenAI | Your Gemini | Your Claude]" selector; default "Our AI" (owner key).

### Model + pricing recommendation (owner-paid default)
The strategist is a **short, structured JSON task** (a paragraph brief → one Advisory object) — it does not need a frontier model. Priorities: cheap, reliable structured output, low latency.

| Option | Input / Output ($/1M) | Notes |
|---|---|---|
| **Claude Haiku 4.5** `claude-haiku-4-5` ✅ **recommended owner default** | **$1 / $5** | Cheapest capable Claude; native **structured outputs** (`output_config.format`) guarantees valid Advisory JSON — kills the "AI returned malformed JSON" failure mode. ~₹0.05–0.15 per strategy call. |
| Gemini 2.0 Flash (current) | free tier / low paid | Cheapest if you stay on Google; but you're exhausting the **free** tier — move to a **paid** Gemini key or switch default to Haiku. Keep as a BYOK option. |
| Claude Sonnet 4.6 | $3 / $15 | Only if you want noticeably richer rationales; overkill for the default. |
| OpenAI (gpt-class) | *verify current pricing before enabling* | Offer as BYOK; don't make it the owner default until you've priced it. |

**Recommendation:** make **Claude Haiku 4.5** the owner-paid default (reliability of structured outputs + trivial per-call cost), keep **Gemini Flash** as a BYOK option, and offer **OpenAI + Claude** BYOK for users who bring their own. Use Anthropic structured outputs so the Advisory always parses. Model IDs are exact: `claude-haiku-4-5`, `claude-sonnet-4-6`, `claude-opus-4-8`.

> Cost reality at MVP scale: even 1,000 strategy calls/month on Haiku 4.5 is well under ₹200. Owner-paying the default is cheap; BYOK exists mainly so power users aren't rate-limited by our quota.

---

## 3. AI Strategist UI — how it renders, and the screenshot/preview plan

### What the page renders (from code)
`app/strategist/page.tsx` → on success sets `AiResult { advisory, creators }` and renders:
- **`AdvisoryCard`** — recommended niche, secondary niches, `tier_mix` (nano/micro/macro %), rationale, target audience, content ideas.
- **`BucketGrid`** — the `creators` returned, as creator cards.
Wrapped in `AuthGate` (must be signed in) and gated on a Supabase session token.

### Why you've never seen it render
It only renders after a **live Gemini call succeeds** — and your Gemini quota is exhausted (503), so you've only ever seen the error state. That's the gap.

### Fix: add a `?preview=1` mock mode (small, high value)
Render a **canned `AiResult`** when `?preview=1` is set — no auth, no AI call. This lets you (and screenshots) see the exact rendered layout, and doubles as a visual test fixture. Proposed mock payload (drop into a `MOCK_AI_RESULT` const):
```jsonc
{
  "advisory": {
    "recommended_niche": "fitness",
    "secondary_niches": ["food", "fashion"],
    "tier_mix": { "nano": 55, "micro": 35, "macro": 10 },
    "rationale": "At a ₹75k/month budget for a protein brand, a nano-heavy mix maximises authentic reach; micro adds credibility, one macro anchors the campaign.",
    "target_audience": "Urban Indians 22–35 starting a fitness routine; Tier-1/Tier-2 metros.",
    "content_ideas": ["7-day protein challenge Reels", "Honest first-try review", "Gym-bag essentials feature"],
    "selected_creator_ids": ["fitness-…","fitness-…"]
  },
  "creators": [ /* 6–8 real priced creators from getPricedCreators('fitness') */ ]
}
```

### The campaign brief I'd use to test the live strategist (once BYOK/Haiku is wired)
> *"I run a D2C plant-protein brand in India. Budget ₹75,000/month. I want to drive first-time trial among urban 22–35 year-olds who are just starting fitness. Prefer authentic, non-celebrity creators."*
This exercises niche inference (→ fitness), tier mix (nano-heavy at that budget), audience, and content ideas.

### Screenshots
Producing real screenshots needs both servers running + a session (AuthGate) + either the preview mode or a working AI key. **Fastest path:** implement `?preview=1` (no auth, canned data) → run frontend → screenshot. I can do that as the immediate next step once you approve the mock-mode approach; it's a ~30-line change plus a run.

---

## 4. Immediate action checklist

- [ ] **You:** check Render env for `RAPIDAPI_ENABLED=true` + valid key/host. Tell me what you find — it decides whether real users see real or fake data *right now*.
- [ ] **Decide posture** (§1 fix): turn RapidAPI on, or gate UI on `verified:true` until F12 lands. (Recommend the gate — it's honest and cheap.)
- [ ] **Approve** BYOK design + **Claude Haiku 4.5** as owner-paid default → I wire the provider abstraction, encrypted key store, and settings UI.
- [ ] **Approve** `?preview=1` mock mode → I implement it and deliver strategist screenshots.
- [ ] Set `AI_KEY_ENC_SECRET` (32-byte) on Render before the key-store ships.
```
```
