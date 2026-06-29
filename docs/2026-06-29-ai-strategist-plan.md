# AI Strategist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second, AI-only product ("AI Strategist") where a brand pastes a campaign brief and Gemini returns an advisory (niche, tier mix, rationale, audience, content ideas) plus a creator bucket it picks from our creator list.

**Architecture:** New backend endpoint `POST /api/ai/strategy` → `strategyService` builds a compact candidate pool from our priced creators, calls a thin `geminiClient` (Generative Language API, structured JSON output), validates/maps the result. New frontend `/strategist` page + `AdvisoryCard`; Header gains a two-product switcher. Current Budget Studio is untouched.

**Tech Stack:** Express + TS (backend), Gemini `gemini-2.0-flash` via REST, zod, Vitest + Supertest; Next.js 16 + Tailwind + Framer Motion (frontend), Vitest + Testing Library (happy-dom).

## Global Constraints

- Products are named **Budget Studio** (`/dashboard`) and **AI Strategist** (`/strategist`).
- `GEMINI_API_KEY` is backend-only; default model `gemini-2.0-flash`; base `https://generativelanguage.googleapis.com`.
- No key → route returns **503**; empty/too-long brief → **400**; Gemini error/bad JSON → **502**; missing auth → **401**. Unknown niche/ids from the model are clamped/dropped (still 200).
- Brief: trimmed, **min 10**, **max 4000** chars.
- AI advisory shape: `{ recommended_niche, secondary_niches[], tier_mix{nano,micro,macro}, rationale, target_audience, content_ideas[], selected_creator_ids[] }`. No budget/strategy fields.
- Niches (14): pets, fashion, beauty, food, fitness, travel, tech, gaming, parenting, finance, home, sustainability, education, comedy.
- Commit messages < 15 words, body ends with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- The existing Budget Studio (`/dashboard`) flow must remain unchanged and all existing tests stay green.

---

## File Structure

```
backend/src/
  config/env.ts                     (modify: geminiApiKey, geminiModel, geminiBaseUrl)
  services/ai/
    types.ts                        AiAdvisory, AiStrategyResult, Candidate
    geminiClient.ts                 generate(prompt, schema) → parsed JSON (fetchFn injectable)
    strategyService.ts              getStrategy(brief, opts) → { advisory, creators }
  routes/aiStrategy.ts              POST /api/ai/strategy
  app.ts                            (modify: mount aiStrategyRouter)
backend/__tests__/
  geminiClient.test.ts  strategyService.test.ts  aiStrategy.e2e.test.ts
frontend/
  lib/aiApi.ts                      getAiStrategy(brief, token, opts?)
  app/strategist/page.tsx           AI Strategist page
  components/AdvisoryCard.tsx       advisory display
  components/Header.tsx             (modify: two-product switcher)
  app/page.tsx                      (modify: second CTA to /strategist)
frontend/__tests__/
  AdvisoryCard.test.tsx  Strategist.test.tsx  Header.test.tsx
```

---

### Task 1: Gemini client + env

**Files:**
- Modify: `backend/src/config/env.ts`
- Create: `backend/src/services/ai/types.ts`, `backend/src/services/ai/geminiClient.ts`
- Test: `backend/__tests__/geminiClient.test.ts`

**Interfaces:**
- Produces:
  - `interface AiAdvisory { recommended_niche: string; secondary_niches: string[]; tier_mix: { nano: number; micro: number; macro: number }; rationale: string; target_audience: string; content_ideas: string[]; selected_creator_ids: string[] }`
  - `interface Candidate { id: string; handle: string; niche: string; tier: string; followers: number; engagement_rate: number; city?: string; cost_mid: number }`
  - `interface AiStrategyResult { advisory: AiAdvisory; creators: import('../../types/index.js').Influencer[] }`
  - `class GeminiClient { constructor(opts: { key: string; model?: string; baseUrl?: string; fetchFn?: FetchFn }); generate(prompt: string, schema: object): Promise<unknown> }`
  - `env.geminiApiKey`, `env.geminiModel`, `env.geminiBaseUrl`

- [ ] **Step 1: Add env fields** in `backend/src/config/env.ts` (inside the `env` object, before `pricingModel`):

```ts
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
  geminiBaseUrl: process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com',
```

- [ ] **Step 2: Create `backend/src/services/ai/types.ts`**

```ts
import type { Influencer } from '../../types/index.js'

export interface AiAdvisory {
  recommended_niche: string
  secondary_niches: string[]
  tier_mix: { nano: number; micro: number; macro: number }
  rationale: string
  target_audience: string
  content_ideas: string[]
  selected_creator_ids: string[]
}

export interface Candidate {
  id: string
  handle: string
  niche: string
  tier: string
  followers: number
  engagement_rate: number
  city?: string
  cost_mid: number
}

export interface AiStrategyResult {
  advisory: AiAdvisory
  creators: Influencer[]
}
```

- [ ] **Step 3: Write the failing test** — `backend/__tests__/geminiClient.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest'
import { GeminiClient } from '../src/services/ai/geminiClient.js'

const apiBody = (obj: unknown) => ({
  ok: true,
  json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] }),
})

describe('GeminiClient', () => {
  it('posts to the model endpoint with the key and returns parsed JSON', async () => {
    const fetchFn = vi.fn().mockResolvedValue(apiBody({ ok: 1 }) as Response)
    const c = new GeminiClient({ key: 'K', model: 'gemini-2.0-flash', baseUrl: 'https://g', fetchFn })
    const out = await c.generate('hello', { type: 'OBJECT' })
    expect(out).toEqual({ ok: 1 })
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('https://g/v1beta/models/gemini-2.0-flash:generateContent?key=K')
    expect((init as RequestInit).method).toBe('POST')
    const sent = JSON.parse((init as RequestInit).body as string)
    expect(sent.generationConfig.responseMimeType).toBe('application/json')
    expect(sent.generationConfig.responseSchema).toEqual({ type: 'OBJECT' })
    expect(sent.contents[0].parts[0].text).toBe('hello')
  })

  it('throws on a non-ok response', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' } as Response)
    const c = new GeminiClient({ key: 'K', fetchFn })
    await expect(c.generate('x', {})).rejects.toThrow(/gemini/i)
  })

  it('throws when the model returns non-JSON text', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'not json' }] } }] }),
    } as Response)
    const c = new GeminiClient({ key: 'K', fetchFn })
    await expect(c.generate('x', {})).rejects.toThrow()
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd backend && npm test geminiClient`
Expected: FAIL (cannot find module).

- [ ] **Step 5: Create `backend/src/services/ai/geminiClient.ts`**

```ts
type FetchFn = (url: string, init?: RequestInit) => Promise<Response>

interface Opts { key: string; model?: string; baseUrl?: string; fetchFn?: FetchFn }

export class GeminiClient {
  private key: string
  private model: string
  private baseUrl: string
  private fetchFn: FetchFn
  constructor(opts: Opts) {
    this.key = opts.key
    this.model = opts.model ?? 'gemini-2.0-flash'
    this.baseUrl = opts.baseUrl ?? 'https://generativelanguage.googleapis.com'
    this.fetchFn = opts.fetchFn ?? (globalThis.fetch as FetchFn)
  }

  async generate(prompt: string, schema: object): Promise<unknown> {
    const url = `${this.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.key}`
    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: schema },
      }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`Gemini request failed: ${res.status} ${detail.slice(0, 200)}`)
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Gemini returned no content')
    return JSON.parse(text)
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && npm test geminiClient`
Expected: PASS (3 tests).

- [ ] **Step 7: Build + commit**

Run: `cd backend && npm run build && rm -rf dist`

```bash
git add backend/src/config/env.ts backend/src/services/ai/ backend/__tests__/geminiClient.test.ts
git commit -m "feat(backend): Gemini client + AI types, env config

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Strategy service (candidate pool + validate/map)

**Files:**
- Create: `backend/src/services/ai/strategyService.ts`
- Test: `backend/__tests__/strategyService.test.ts`

**Interfaces:**
- Consumes: `GeminiClient.generate`, `AiAdvisory`, `Candidate`, `AiStrategyResult`, `getPricedCreators`, `NICHES`, `influencerCost`.
- Produces:
  - `interface StrategyClient { generate(prompt: string, schema: object): Promise<unknown> }`
  - `buildCandidates(perNiche?: number, provider?): Promise<{ candidates: Candidate[]; byId: Map<string, Influencer> }>`
  - `getStrategy(brief: string, opts?: { client?: StrategyClient; provider?: InfluencerProvider }): Promise<AiStrategyResult>`

- [ ] **Step 1: Write the failing test** — `backend/__tests__/strategyService.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { getStrategy } from '../src/services/ai/strategyService.js'
import { GeneratedProvider } from '../src/services/rapidapi/GeneratedProvider.js'
import type { AiAdvisory } from '../src/services/ai/types.js'

// A fake Gemini client that selects the first two candidate ids it is given.
function fakeClient(advisory: Partial<AiAdvisory> = {}) {
  return {
    async generate(prompt: string) {
      const ids = [...prompt.matchAll(/"id":"([^"]+)"/g)].map((m) => m[1]).slice(0, 2)
      const full: AiAdvisory = {
        recommended_niche: 'beauty',
        secondary_niches: ['fashion'],
        tier_mix: { nano: 60, micro: 30, macro: 10 },
        rationale: 'because',
        target_audience: 'gen z',
        content_ideas: ['reel', 'grwm'],
        selected_creator_ids: ids,
        ...advisory,
      }
      return full
    },
  }
}

describe('getStrategy', () => {
  it('returns advisory and maps selected ids to full creators', async () => {
    const res = await getStrategy('Launch a vegan skincare line for Gen Z', {
      client: fakeClient(), provider: new GeneratedProvider(),
    })
    expect(res.advisory.recommended_niche).toBe('beauty')
    expect(res.creators.length).toBe(2)
    expect(res.creators[0].id).toBeTruthy()
    expect(res.creators[0].cost_min).toBeLessThan(res.creators[0].cost_max)
  })

  it('drops selected ids that are not in the candidate pool', async () => {
    const res = await getStrategy('brief text here', {
      client: fakeClient({ selected_creator_ids: ['does-not-exist', 'nope'] }),
      provider: new GeneratedProvider(),
    })
    expect(res.creators).toEqual([])
  })

  it('clamps an unknown recommended niche to a valid one', async () => {
    const res = await getStrategy('brief text here', {
      client: fakeClient({ recommended_niche: 'aliens' }),
      provider: new GeneratedProvider(),
    })
    expect(['pets','fashion','beauty','food','fitness','travel','tech','gaming','parenting','finance','home','sustainability','education','comedy'])
      .toContain(res.advisory.recommended_niche)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test strategyService`
Expected: FAIL.

- [ ] **Step 3: Create `backend/src/services/ai/strategyService.ts`**

```ts
import type { Influencer } from '../../types/index.js'
import { NICHES } from '../../types/index.js'
import type { InfluencerProvider } from '../rapidapi/InfluencerProvider.js'
import { getPricedCreators } from '../influencerService.js'
import { influencerCost } from '../allocationService.js'
import type { AiAdvisory, AiStrategyResult, Candidate } from './types.js'

export interface StrategyClient { generate(prompt: string, schema: object): Promise<unknown> }

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    recommended_niche: { type: 'STRING' },
    secondary_niches: { type: 'ARRAY', items: { type: 'STRING' } },
    tier_mix: {
      type: 'OBJECT',
      properties: { nano: { type: 'NUMBER' }, micro: { type: 'NUMBER' }, macro: { type: 'NUMBER' } },
    },
    rationale: { type: 'STRING' },
    target_audience: { type: 'STRING' },
    content_ideas: { type: 'ARRAY', items: { type: 'STRING' } },
    selected_creator_ids: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['recommended_niche', 'tier_mix', 'rationale', 'target_audience', 'content_ideas', 'selected_creator_ids'],
}

export async function buildCandidates(perNiche = 8, provider?: InfluencerProvider) {
  const byId = new Map<string, Influencer>()
  const candidates: Candidate[] = []
  for (const niche of NICHES) {
    const priced = await getPricedCreators(niche, provider ? { provider } : {})
    for (const c of priced.slice(0, perNiche)) {
      byId.set(c.id, c)
      candidates.push({
        id: c.id, handle: c.handle, niche: c.niche, tier: c.tier,
        followers: c.followers, engagement_rate: c.engagement_rate,
        city: c.city, cost_mid: influencerCost(c),
      })
    }
  }
  return { candidates, byId }
}

function buildPrompt(brief: string, candidates: Candidate[]): string {
  return [
    'You are an influencer-marketing strategist for Indian D2C brands.',
    'Given the campaign brief and a list of available creators, return JSON that matches the schema.',
    'Pick 6–12 creators from the list (by their exact "id") whose niche/tier/engagement best fit the brief,',
    'favouring the tier_mix you recommend. recommended_niche MUST be one of:',
    NICHES.join(', ') + '.',
    '',
    'CAMPAIGN BRIEF:',
    brief,
    '',
    'AVAILABLE CREATORS (JSON):',
    JSON.stringify(candidates),
  ].join('\n')
}

export async function getStrategy(
  brief: string,
  opts: { client: StrategyClient; provider?: InfluencerProvider },
): Promise<AiStrategyResult> {
  const { candidates, byId } = await buildCandidates(8, opts.provider)
  const raw = (await opts.client.generate(buildPrompt(brief, candidates), RESPONSE_SCHEMA)) as AiAdvisory

  const niche = (NICHES as readonly string[]).includes(raw.recommended_niche)
    ? raw.recommended_niche
    : NICHES[0]
  const secondary = (raw.secondary_niches ?? []).filter((n) => (NICHES as readonly string[]).includes(n))
  const ids = Array.isArray(raw.selected_creator_ids) ? raw.selected_creator_ids : []
  const creators = ids.map((id) => byId.get(id)).filter((c): c is Influencer => !!c)

  return {
    advisory: {
      recommended_niche: niche,
      secondary_niches: secondary,
      tier_mix: raw.tier_mix ?? { nano: 60, micro: 30, macro: 10 },
      rationale: raw.rationale ?? '',
      target_audience: raw.target_audience ?? '',
      content_ideas: Array.isArray(raw.content_ideas) ? raw.content_ideas : [],
      selected_creator_ids: ids,
    },
    creators,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npm test strategyService`
Expected: PASS (3 tests).

- [ ] **Step 5: Build + commit**

Run: `cd backend && npm run build && rm -rf dist`

```bash
git add backend/src/services/ai/strategyService.ts backend/__tests__/strategyService.test.ts
git commit -m "feat(backend): AI strategy service — candidate pool, validate, map creators

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Route `POST /api/ai/strategy`

**Files:**
- Create: `backend/src/routes/aiStrategy.ts`
- Modify: `backend/src/app.ts`
- Test: `backend/__tests__/aiStrategy.e2e.test.ts`

**Interfaces:**
- Consumes: `requireAuth`, `httpError`, `getStrategy`, `GeminiClient`, `env`.
- Produces: `aiStrategyRouter` mounted at `/api`; `POST /api/ai/strategy` body `{ brief }` → `{ advisory, creators }`.

- [ ] **Step 1: Write the failing e2e test** — `backend/__tests__/aiStrategy.e2e.test.ts`

```ts
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { __setVerifier } from '../src/middleware/supabaseAuth.js'
import { __setStrategyClient, __resetStrategyClient } from '../src/routes/aiStrategy.js'
import type { AiAdvisory } from '../src/services/ai/types.js'

beforeAll(() => __setVerifier(async () => ({ id: 'u1', email: 'a@b.c' })))
afterEach(() => __resetStrategyClient())
const auth = (r: request.Test) => r.set('Authorization', 'Bearer good')

const advisory: AiAdvisory = {
  recommended_niche: 'beauty', secondary_niches: [], tier_mix: { nano: 60, micro: 30, macro: 10 },
  rationale: 'r', target_audience: 'a', content_ideas: ['x'], selected_creator_ids: [],
}

describe('POST /api/ai/strategy', () => {
  beforeEach(() => __setStrategyClient({ generate: async () => advisory }))

  it('401 without a token', async () => {
    const res = await request(createApp()).post('/api/ai/strategy').send({ brief: 'a valid brief here' })
    expect(res.status).toBe(401)
  })
  it('400 on an empty/too-short brief', async () => {
    expect((await auth(request(createApp()).post('/api/ai/strategy')).send({ brief: 'hi' })).status).toBe(400)
  })
  it('200 with advisory + creators on a valid brief', async () => {
    const res = await auth(request(createApp()).post('/api/ai/strategy')).send({ brief: 'Launch a vegan skincare line for Gen Z in metros' })
    expect(res.status).toBe(200)
    expect(res.body.advisory.recommended_niche).toBe('beauty')
    expect(Array.isArray(res.body.creators)).toBe(true)
  })
  it('503 when the AI client is not configured', async () => {
    __setStrategyClient(null) // simulate missing key
    const res = await auth(request(createApp()).post('/api/ai/strategy')).send({ brief: 'a valid campaign brief' })
    expect(res.status).toBe(503)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test aiStrategy`
Expected: FAIL.

- [ ] **Step 3: Create `backend/src/routes/aiStrategy.ts`**

```ts
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/supabaseAuth.js'
import { httpError } from '../middleware/errorHandler.js'
import { getStrategy, type StrategyClient } from '../services/ai/strategyService.js'
import { GeminiClient } from '../services/ai/geminiClient.js'
import { env } from '../config/env.js'

export const aiStrategyRouter = Router()
const schema = z.object({ brief: z.string().trim().min(10).max(4000) })

// Test seam: inject a fake client, or null to simulate "not configured".
let override: StrategyClient | null | undefined
export function __setStrategyClient(c: StrategyClient | null) { override = c }
export function __resetStrategyClient() { override = undefined }

function resolveClient(): StrategyClient | null {
  if (override !== undefined) return override
  if (!env.geminiApiKey) return null
  return new GeminiClient({ key: env.geminiApiKey, model: env.geminiModel, baseUrl: env.geminiBaseUrl })
}

aiStrategyRouter.post('/ai/strategy', requireAuth, async (req, res, next) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return next(httpError(400, 'Brief must be 10–4000 characters'))
  const client = resolveClient()
  if (!client) return next(httpError(503, 'AI Strategist isn\'t configured'))
  try {
    const result = await getStrategy(parsed.data.brief, { client })
    res.json(result)
  } catch {
    next(httpError(502, 'The AI service is unavailable right now. Please try again.'))
  }
})
```

- [ ] **Step 4: Mount in `backend/src/app.ts`** (add import + `app.use` after the allocate router):

```ts
import { aiStrategyRouter } from './routes/aiStrategy.js'
// ...after app.use('/api', allocateRouter):
  app.use('/api', aiStrategyRouter)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && npm test aiStrategy`
Expected: PASS (4 tests).

- [ ] **Step 6: Full backend suite + build + commit**

Run: `cd backend && npm test && npm run build && rm -rf dist`
Expected: all pass.

```bash
git add backend/src/routes/aiStrategy.ts backend/src/app.ts backend/__tests__/aiStrategy.e2e.test.ts
git commit -m "feat(backend): POST /api/ai/strategy route with auth, validation, 503/502 handling

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Frontend API client + AdvisoryCard

**Files:**
- Create: `frontend/lib/aiApi.ts`, `frontend/components/AdvisoryCard.tsx`
- Test: `frontend/__tests__/AdvisoryCard.test.tsx`

**Interfaces:**
- Produces:
  - `interface Advisory { recommended_niche: string; secondary_niches: string[]; tier_mix: { nano: number; micro: number; macro: number }; rationale: string; target_audience: string; content_ideas: string[]; selected_creator_ids: string[] }`
  - `interface AiResult { advisory: Advisory; creators: Influencer[] }`
  - `getAiStrategy(brief: string, token: string, opts?: { base?: string; fetchFn?: typeof fetch; signal?: AbortSignal }): Promise<AiResult>`
  - `AdvisoryCard({ advisory }: { advisory: Advisory })`

- [ ] **Step 1: Create `frontend/lib/aiApi.ts`**

```ts
import type { Influencer } from './types'

export interface Advisory {
  recommended_niche: string
  secondary_niches: string[]
  tier_mix: { nano: number; micro: number; macro: number }
  rationale: string
  target_audience: string
  content_ideas: string[]
  selected_creator_ids: string[]
}
export interface AiResult { advisory: Advisory; creators: Influencer[] }

interface Opts { base?: string; fetchFn?: typeof fetch; signal?: AbortSignal }

export async function getAiStrategy(brief: string, token: string, opts: Opts = {}): Promise<AiResult> {
  const base = opts.base ?? process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000'
  const f = opts.fetchFn ?? fetch
  const res = await f(`${base}/api/ai/strategy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ brief }),
    signal: opts.signal,
  })
  if (!res.ok) throw new Error(`ai strategy failed: ${res.status}`)
  return res.json() as Promise<AiResult>
}
```

- [ ] **Step 2: Write the failing test** — `frontend/__tests__/AdvisoryCard.test.tsx`

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdvisoryCard from '@/components/AdvisoryCard'

const advisory = {
  recommended_niche: 'beauty',
  secondary_niches: ['fashion'],
  tier_mix: { nano: 60, micro: 30, macro: 10 },
  rationale: 'Launch needs trust so nano-heavy.',
  target_audience: 'Gen-Z metro skincare buyers',
  content_ideas: ['unboxing reel', 'GRWM'],
  selected_creator_ids: [],
}

describe('AdvisoryCard', () => {
  it('renders niche, rationale, audience and content ideas', () => {
    render(<AdvisoryCard advisory={advisory} />)
    expect(screen.getByText(/beauty/i)).toBeInTheDocument()
    expect(screen.getByText(/nano-heavy/i)).toBeInTheDocument()
    expect(screen.getByText(/Gen-Z metro/i)).toBeInTheDocument()
    expect(screen.getByText(/unboxing reel/i)).toBeInTheDocument()
    expect(screen.getByText(/60%/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npm test AdvisoryCard`
Expected: FAIL.

- [ ] **Step 4: Create `frontend/components/AdvisoryCard.tsx`**

```tsx
'use client'

import { motion } from 'framer-motion'
import { Sparkles, Target, Users, Lightbulb } from 'lucide-react'
import type { Advisory } from '@/lib/aiApi'
import { NICHE_LABEL } from '@/lib/niches'

export default function AdvisoryCard({ advisory }: { advisory: Advisory }) {
  const { recommended_niche, secondary_niches, tier_mix, rationale, target_audience, content_ideas } = advisory
  const label = (n: string) => NICHE_LABEL[n as keyof typeof NICHE_LABEL] ?? n
  return (
    <motion.div
      className="shadow-soft mb-8 rounded-2xl bg-white/70 p-6 ring-1 ring-border/60 backdrop-blur-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
        <Sparkles className="h-5 w-5 text-primary" /> AI Recommendation
      </h2>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
          {label(recommended_niche)}
        </span>
        {secondary_niches.map((n) => (
          <span key={n} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/60">
            {label(n)}
          </span>
        ))}
      </div>

      {/* Tier mix bar */}
      <div className="mb-5">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/50">Recommended tier mix</p>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          <div className="bg-secondary" style={{ width: `${tier_mix.nano}%` }} title={`Nano ${tier_mix.nano}%`} />
          <div className="bg-primary/70" style={{ width: `${tier_mix.micro}%` }} title={`Micro ${tier_mix.micro}%`} />
          <div className="bg-primary" style={{ width: `${tier_mix.macro}%` }} title={`Macro ${tier_mix.macro}%`} />
        </div>
        <div className="mt-1 flex gap-3 text-xs text-foreground/55">
          <span>Nano {tier_mix.nano}%</span><span>Micro {tier_mix.micro}%</span><span>Macro {tier_mix.macro}%</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Section icon={<Target className="h-4 w-4 text-primary" />} title="Why this works">{rationale}</Section>
        <Section icon={<Users className="h-4 w-4 text-primary" />} title="Target audience">{target_audience}</Section>
      </div>

      {content_ideas.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/50">
            <Lightbulb className="h-4 w-4 text-primary" /> Content ideas
          </p>
          <div className="flex flex-wrap gap-2">
            {content_ideas.map((idea, i) => (
              <span key={i} className="rounded-full bg-secondary/40 px-3 py-1 text-xs font-medium text-foreground/70">{idea}</span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/50 p-4">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-foreground/70">{icon} {title}</p>
      <p className="text-sm text-foreground/70">{children}</p>
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npm test AdvisoryCard`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/lib/aiApi.ts frontend/components/AdvisoryCard.tsx frontend/__tests__/AdvisoryCard.test.tsx
git commit -m "feat(frontend): AI api client + AdvisoryCard

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: AI Strategist page (`/strategist`)

**Files:**
- Create: `frontend/app/strategist/page.tsx`
- Test: `frontend/__tests__/Strategist.test.tsx`

**Interfaces:**
- Consumes: `getAiStrategy`, `AdvisoryCard`, `BucketGrid`, `Header`, `Footer`, `AuthGate`, `getSupabase`, `Influencer`, `BucketResult`.

- [ ] **Step 1: Write the failing test** — `frontend/__tests__/Strategist.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/AuthGate', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
vi.mock('@/components/Header', () => ({ default: () => <div /> }))
vi.mock('@/components/Footer', () => ({ default: () => <div /> }))

import StrategistPage from '@/app/strategist/page'

describe('AI Strategist page', () => {
  it('renders the brief textarea and the submit button', () => {
    render(<StrategistPage />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get ai recommendations/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test Strategist`
Expected: FAIL.

- [ ] **Step 3: Create `frontend/app/strategist/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AuthGate from '@/components/AuthGate'
import AdvisoryCard from '@/components/AdvisoryCard'
import BucketGrid from '@/components/BucketGrid'
import { getAiStrategy, type AiResult } from '@/lib/aiApi'
import { getSupabase } from '@/lib/supabase/client'
import type { BucketResult } from '@/lib/types'

export default function StrategistPage() {
  const [brief, setBrief] = useState('')
  const [result, setResult] = useState<AiResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (brief.trim().length < 10) { setError('Please describe your campaign in a sentence or two.'); return }
    setLoading(true); setError(null)
    try {
      const supabase = getSupabase()
      const token = (await supabase?.auth.getSession())?.data.session?.access_token ?? ''
      if (!token) { setError('Sign in to use the AI Strategist.'); setLoading(false); return }
      setResult(await getAiStrategy(brief, token))
    } catch {
      setError('The AI Strategist is unavailable right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const bucket: BucketResult = result
    ? { selected_influencers: result.creators, total_projected_spend: 0, leftover_budget: 0 }
    : { selected_influencers: [], total_projected_spend: 0, leftover_budget: 0 }

  return (
    <AuthGate>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
          <motion.div className="mb-8 text-center" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              AI <span className="bg-gradient-to-r from-primary to-[#e8956d] bg-clip-text text-transparent">Strategist</span>
            </h1>
            <p className="mt-3 text-base text-foreground/60">Paste your campaign brief — get a recommended niche, tier mix, audience, content ideas, and a creator bucket.</p>
          </motion.div>

          <div className="shadow-soft mb-8 rounded-2xl bg-white/60 p-6 ring-1 ring-border/60 backdrop-blur-sm">
            <label className="mb-2 block text-sm font-semibold text-foreground/80">Campaign brief</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={6}
              maxLength={4000}
              placeholder="e.g. We're launching a vegan skincare line for Gen-Z in metro cities. Goal: awareness + trust, premium-but-affordable vibe…"
              className="w-full resize-y rounded-xl border border-border bg-white/70 p-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-foreground/40">{brief.length}/4000</span>
              <button
                onClick={submit}
                disabled={loading}
                className="shadow-soft flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? 'Thinking…' : 'Get AI Recommendations'}
              </button>
            </div>
          </div>

          {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>}

          {result && !loading && (
            <>
              <AdvisoryCard advisory={result.advisory} />
              {result.creators.length > 0 && <BucketGrid allInfluencers={result.creators} result={bucket} />}
            </>
          )}
        </main>
        <Footer />
      </div>
    </AuthGate>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm test Strategist`
Expected: PASS.

- [ ] **Step 5: Build + commit**

Run: `cd frontend && npm run build`

```bash
git add frontend/app/strategist/page.tsx frontend/__tests__/Strategist.test.tsx
git commit -m "feat(frontend): AI Strategist page with brief input, advisory + bucket

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Header two-product switcher + landing CTA

**Files:**
- Modify: `frontend/components/Header.tsx`, `frontend/app/page.tsx`
- Test: `frontend/__tests__/Header.test.tsx`

**Interfaces:**
- Consumes: `usePathname` from `next/navigation`.
- Produces: Header nav with links to `/dashboard` (Budget Studio) and `/strategist` (AI Strategist), active-aware.

- [ ] **Step 1: Write the failing test** — `frontend/__tests__/Header.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }))
vi.mock('@/components/AuthProvider', () => ({ useAuth: () => ({ user: null, configured: false, signOut: vi.fn() }) }))
vi.mock('next/link', () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }))

import Header from '@/components/Header'

describe('Header product switcher', () => {
  it('links to both products', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: /budget studio/i })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: /ai strategist/i })).toHaveAttribute('href', '/strategist')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test Header`
Expected: FAIL.

- [ ] **Step 3: Add the switcher to `frontend/components/Header.tsx`** — add imports at top:

```tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
```

Then inside the header `<div className="mx-auto flex h-16 ...">`, between the logo block and the right-side block, insert a centered nav:

```tsx
        {/* Product switcher */}
        <ProductNav />
```

And add this component at the bottom of the file (before the default export's closing, as a separate function):

```tsx
function ProductNav() {
  const pathname = usePathname()
  const items = [
    { href: '/dashboard', label: 'Budget Studio' },
    { href: '/strategist', label: 'AI Strategist ✨' },
  ]
  return (
    <nav className="hidden items-center gap-1 rounded-full bg-muted p-1 sm:flex">
      {items.map((it) => {
        const active = pathname === it.href
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              active ? 'bg-white text-primary shadow-sm' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}
```

(Place `<ProductNav />` as the middle flex child so the header reads: logo · nav · right-side.)

- [ ] **Step 4: Add a second CTA on the landing page** `frontend/app/page.tsx` — directly after the existing primary CTA `<Link href="/dashboard" …>` block, add:

```tsx
          <Link
            href="/strategist"
            className="ml-0 mt-3 inline-flex items-center gap-2 rounded-2xl border border-primary/30 px-6 py-3 text-base font-bold text-primary transition hover:bg-primary/5 sm:ml-3 sm:mt-0"
          >
            Try the AI Strategist ✨
          </Link>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npm test Header`
Expected: PASS.

- [ ] **Step 6: Full frontend suite + build + commit**

Run: `cd frontend && npm test && npm run build`
Expected: all pass.

```bash
git add frontend/components/Header.tsx frontend/app/page.tsx frontend/__tests__/Header.test.tsx
git commit -m "feat(frontend): header two-product switcher + landing AI Strategist CTA

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Env docs + deploy

**Files:**
- Modify: `backend/.env.example`, `docs/deploying-render.md`, `docs/running-locally.md`

- [ ] **Step 1: Add Gemini vars to `backend/.env.example`**

```bash
# ── AI Strategist (Gemini) ──
# Get a free key at https://aistudio.google.com (Get API key). Backend-only.
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
```

- [ ] **Step 2: Document the env var** — add a `GEMINI_API_KEY` row to the env table in `docs/deploying-render.md` and a note in `docs/running-locally.md` (AI Strategist needs `GEMINI_API_KEY`; without it `/api/ai/strategy` returns 503).

- [ ] **Step 3: Commit**

```bash
git add backend/.env.example docs/deploying-render.md docs/running-locally.md
git commit -m "docs: GEMINI_API_KEY env for AI Strategist

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 4: Push + deploy**

```bash
git push
```
Then on Render add `GEMINI_API_KEY` (and optional `GEMINI_MODEL`); on Vercel nothing changes (frontend reads the same `NEXT_PUBLIC_API_BASE`). Verify `POST /api/ai/strategy` returns 503 before the key is set, 200 after.

---

## Self-Review

**Spec coverage:** §1 two products → Tasks 5,6. §2 decisions (Gemini, names, output) → Tasks 1–6. §3 nav/switcher → Task 6. §4 backend (endpoint, flow, schema, components) → Tasks 1–3. §5 frontend → Tasks 4,5,6. §6 error handling (400/401/502/503, clamp/drop) → Tasks 2,3. §7 testing → every task. §8 deploy → Task 7. §9 out-of-scope respected. ✅

**Placeholder scan:** No TBD/TODO; every code step has full code; every test asserts. ✅

**Type consistency:** `AiAdvisory`/`Candidate`/`AiStrategyResult` (Task 1) reused in Tasks 2,3; `StrategyClient` (Task 2) consumed in Task 3; frontend `Advisory`/`AiResult` (Task 4) consumed in Tasks 4,5; `__setStrategyClient`/`__resetStrategyClient` defined+used in Task 3. `getStrategy` signature consistent. ✅

**Follow-ups (not blockers):** user provides `GEMINI_API_KEY`; live-tune the prompt against real Gemini output in Task 7.
