# AI Strategist — Design (second product)

**Date:** 2026-06-29
**Status:** Approved → ready for implementation plan

## 1. Goal

Add a second, **AI-only** product alongside the existing budget allocator. A brand
pastes their campaign brief into a text box; **Gemini** generates the whole advisory
**and** picks a creator bucket from our creator list. The current toggle-filter
allocator stays 100% non-AI.

## 2. Confirmed decisions

| Area | Decision |
|---|---|
| AI ↔ data | **AI picks from our creator list** — Gemini receives a candidate pool of our priced creators and selects the bucket. Advisory is AI-only (no rule-based allocator involved). |
| Gemini key | Live from the start. `GEMINI_API_KEY` (backend only). Missing key → clean 503, never crash. |
| Model | `gemini-2.0-flash` (free tier), configurable via `GEMINI_MODEL`. |
| Product names | **Budget Studio** (current, `/dashboard`) + **AI Strategist ✨** (new, `/strategist`). |
| AI output | recommended niche (+ secondary), tier mix (nano/micro/macro %), rationale, target audience, content ideas. **No** budget/strategy suggestion. |
| Strategist input | Campaign brief text only — **no budget slider** on this product. |
| Bucket source | Our current creators (Sample until real data enabled); AI selects from them. |

## 3. Navigation & shell

- `/dashboard` → Budget Studio (unchanged).
- `/strategist` → AI Strategist.
- Header shows a two-tab switcher `[ Budget Studio ] [ AI Strategist ✨ ]`, highlighting
  the active route. Both are behind the existing Supabase `AuthGate`.
- Landing page gains a second CTA to the Strategist.

## 4. Backend

### Endpoint
`POST /api/ai/strategy` (requireAuth + rate-limited). Body: `{ brief: string }`
(zod: trimmed, min 10 chars, max 4000 chars).

### Flow
1. **Candidate pool** — `getPricedCreators` for each niche, take a representative
   sample (~10/niche, spread across tiers) → compact rows
   `{ id, handle, niche, tier, followers, engagement_rate, city, cost_mid }`.
2. **Gemini call** — `geminiClient.generateStrategy(brief, candidates)` posts to the
   Generative Language API with a **structured `responseSchema`** so the model returns
   strict JSON.
3. **Validate + map** — clamp `recommended_niche` to our 14; drop `selected_creator_ids`
   not present in the pool; map ids → full priced `Influencer` objects.
4. **Respond** — `{ advisory, creators }`.

### AI response shape (responseSchema)
```ts
interface AiAdvisory {
  recommended_niche: Niche
  secondary_niches: Niche[]
  tier_mix: { nano: number; micro: number; macro: number } // percentages ~sum 100
  rationale: string
  target_audience: string
  content_ideas: string[]
  selected_creator_ids: string[]
}
```
API response: `{ advisory: AiAdvisory; creators: Influencer[] }` (creators = mapped from
`selected_creator_ids`, grouped client-side by tier).

### Components (one responsibility each)
- `services/ai/geminiClient.ts` — REST wrapper over
  `POST {GEMINI_BASE}/v1beta/models/{model}:generateContent?key=...`. Input: prompt +
  schema. Output: parsed JSON (throws on transport/parse error). `fetchFn` injectable for tests.
- `services/ai/strategyService.ts` — builds candidate pool + prompt, calls the client,
  validates/maps the result. `getStrategy(brief, { client?, provider? })`.
- `routes/aiStrategy.ts` — zod validation, auth, calls the service, maps errors to
  400/502/503.
- `config/env.ts` — add `geminiApiKey`, `geminiModel` (default `gemini-2.0-flash`),
  `geminiBaseUrl` (default `https://generativelanguage.googleapis.com`).

## 5. Frontend

- `app/strategist/page.tsx` (client, behind `AuthGate`): a large textarea + **Get AI
  Recommendations** button; loading + error states; renders `AdvisoryCard` + the
  AI-picked bucket via the existing `BucketGrid`/`TierBucket` + `InfluencerCard`.
- `components/AdvisoryCard.tsx`: recommended niche (+ secondary chips), a tier-mix bar
  (nano/micro/macro %), rationale, target audience, content-idea chips.
- `components/Header.tsx`: add the two-product switcher (active-route aware via
  `usePathname`).
- `lib/aiApi.ts`: `getAiStrategy(brief, token, opts?)` → POST `/api/ai/strategy`.

## 6. Error handling

| Case | Result |
|---|---|
| Empty / too-long brief | 400 |
| No `GEMINI_API_KEY` | 503 "AI Strategist isn't configured" → friendly UI message |
| Gemini transport error / timeout | 502 + Retry |
| Malformed AI JSON (fails schema) | 502 (no half-baked output) |
| Unknown niche / ids from model | clamped / dropped, still 200 |
| Missing/invalid auth | 401 |

## 7. Testing

- **Backend:** `strategyService` with a **mocked Gemini client** — valid response →
  mapped creators; unknown ids dropped; bad niche clamped; empty selection handled.
  `geminiClient` with a mocked `fetchFn` (maps API JSON; throws on non-ok). Route e2e:
  401 (no auth), 400 (empty brief), 503 (no key), 200 (happy path, mocked client).
- **Frontend:** Strategist page renders textarea + button; on a mocked response shows the
  advisory + bucket; Header switcher links both products and marks the active one.

## 8. Deploy

`GEMINI_API_KEY` (+ optional `GEMINI_MODEL`) added to Render. Shipped in phases:
backend client → service → route → frontend page/components → header switcher → tests →
push to production.

## 9. Out of scope (now)

- Conversational follow-ups / multi-turn chat.
- AI budget optimization or auto-running the existing allocator.
- Streaming responses.
- Caching AI results (each brief is unique).
