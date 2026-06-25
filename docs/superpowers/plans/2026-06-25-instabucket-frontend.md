# InstaBucket Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium, portfolio-grade Single-Page Application that lets Indian D2C brands enter a budget + niche and receive an animated, optimized "bucket" of influencers maximizing reach within the budget ceiling.

**Architecture:** Next.js 14 App Router with a single root route that renders the entire dashboard. All data lives in a static mock layer (swappable for Supabase later). The budget allocation runs client-side via a pure utility function. A Next.js Route Handler proxied behind Upstash rate-limiting acts as the future API seam.

**Tech Stack:** Next.js 14, Tailwind CSS (custom Organic Indie theme), Shadcn UI, Framer Motion, Lucide React, Vitest (unit tests), @upstash/ratelimit + @upstash/redis (edge middleware).

## Global Constraints

- Node 18+; use `npm` (not yarn/pnpm) unless otherwise stated.
- No `/login`, `/signup`, or any route other than `/` — single dashboard.
- No user auth, no payment integration, no landing page.
- Theme colors verbatim: Background `#FDFBF7`, Primary `#E2725B`, Secondary `#C5E1A5`, Text `#1F2937`.
- Font: **Plus Jakarta Sans** loaded via `next/font/google`.
- All cards and buttons: `rounded-2xl`, soft box-shadow.
- Footer contains exactly **one** link: `<a href="https://arukurmi.vercel.app/" target="_blank" rel="noopener noreferrer">Contact the Developer</a>` — no other links.
- Framer Motion `whileHover={{ scale: 1.02, y: -5 }}` on every `InfluencerCard`.
- `AnimatePresence` + `layoutId` on the grid so cards animate position changes.
- Cost formula (when `estimated_cost` not present): `(followers * 0.05) + (avg_views / 10 * 0.1)`.
- All monetary values in INR (₹).

---

## File Map

```
/
├── app/
│   ├── layout.tsx              # Root layout: font, metadata, body bg color
│   ├── page.tsx                # Dashboard page — wires all components
│   ├── globals.css             # Tailwind base + custom scrollbar
│   └── api/
│       └── fetch-metrics/
│           └── route.ts        # GET handler → RapidAPI proxy (mock for MVP)
├── components/
│   ├── Header.tsx              # Glassmorphism sticky nav with Goat icon
│   ├── Footer.tsx              # Single-link minimal footer
│   ├── InfluencerCard.tsx      # Animated card (Framer Motion)
│   ├── BucketGrid.tsx          # AnimatePresence grid + stagger
│   └── BudgetControls.tsx      # Budget input + niche selector
├── lib/
│   ├── types.ts                # Influencer type + BucketResult type
│   ├── mockData.ts             # 20 static influencers across 4 niches
│   └── allocateBudget.ts       # Greedy knapsack utility
├── middleware.ts               # Upstash rate-limiting (10 req/min/IP)
├── tailwind.config.ts          # Custom Organic Indie theme tokens
├── vitest.config.ts            # Vitest setup
└── __tests__/
    └── allocateBudget.test.ts  # Unit tests for the algorithm
```

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json` (via CLI)
- Create: `tailwind.config.ts`
- Create: `vitest.config.ts`
- Create: `app/globals.css`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd /Users/aryanshkurmi/code/CreatorNexus
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

When prompted, accept all defaults. This creates the Next.js 14 App Router scaffold.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install framer-motion lucide-react @upstash/ratelimit @upstash/redis
npm install @fontsource/plus-jakarta-sans
```

- [ ] **Step 3: Install Shadcn UI**

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Neutral**
- CSS variables: **Yes**

Then add the components we need:

```bash
npx shadcn@latest add badge slider
```

- [ ] **Step 4: Install Vitest**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 5: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
})
```

- [ ] **Step 6: Configure custom Tailwind theme**

Replace `tailwind.config.ts` with:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FDFBF7',
        primary: {
          DEFAULT: '#E2725B',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#C5E1A5',
          foreground: '#1F2937',
        },
        foreground: '#1F2937',
        muted: '#F3F0EA',
        border: '#E8E3DA',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 16px 0 rgba(31,41,55,0.07)',
        card: '0 4px 24px 0 rgba(31,41,55,0.10)',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 7: Replace `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-plus-jakarta: 'Plus Jakarta Sans', system-ui, sans-serif;
}

body {
  background-color: #FDFBF7;
  color: #1F2937;
  font-family: var(--font-plus-jakarta);
}

/* Custom scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #F3F0EA; }
::-webkit-scrollbar-thumb { background: #C5E1A5; border-radius: 3px; }
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts at `http://localhost:3000` with no errors. Ctrl+C to stop.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js 14 project with Organic Indie Tailwind theme and Vitest"
```

---

## Task 2: Types and Mock Data

**Files:**
- Create: `lib/types.ts`
- Create: `lib/mockData.ts`

**Interfaces — Produces:**
- `Influencer` type (used by Tasks 3, 4, 5, 6)
- `BucketResult` type (used by Task 3)
- `MOCK_INFLUENCERS` array exported from `mockData.ts` (used by Tasks 3, 6)

- [ ] **Step 1: Write `lib/types.ts`**

```ts
export interface Influencer {
  id: string
  handle: string
  avatar_url: string
  followers: number
  avg_views: number
  engagement_rate: number  // e.g. 0.045 = 4.5%
  estimated_cost: number   // INR
  niche: 'pets' | 'fashion' | 'food' | 'fitness'
  metadata?: Record<string, unknown>  // future LLM embeddings / brand safety flags
}

export interface BucketResult {
  selected_influencers: Influencer[]
  total_projected_spend: number
  leftover_budget: number
}
```

- [ ] **Step 2: Write `lib/mockData.ts`**

```ts
import { Influencer } from './types'

export const MOCK_INFLUENCERS: Influencer[] = [
  // ── PETS ──────────────────────────────────────────────────────────────────
  {
    id: 'p1',
    handle: '@pawsandpurrs',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=pawsandpurrs',
    followers: 48000,
    avg_views: 22000,
    engagement_rate: 0.072,
    estimated_cost: 3200,
    niche: 'pets',
  },
  {
    id: 'p2',
    handle: '@delhidogmom',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=delhidogmom',
    followers: 91000,
    avg_views: 38000,
    engagement_rate: 0.054,
    estimated_cost: 7500,
    niche: 'pets',
  },
  {
    id: 'p3',
    handle: '@meowmumbai',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=meowmumbai',
    followers: 12000,
    avg_views: 8500,
    engagement_rate: 0.091,
    estimated_cost: 1100,
    niche: 'pets',
  },
  {
    id: 'p4',
    handle: '@bengalurupets',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=bengalurupets',
    followers: 27000,
    avg_views: 14000,
    engagement_rate: 0.068,
    estimated_cost: 2400,
    niche: 'pets',
  },
  {
    id: 'p5',
    handle: '@fluffychennai',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=fluffychennai',
    followers: 6500,
    avg_views: 5200,
    engagement_rate: 0.108,
    estimated_cost: 600,
    niche: 'pets',
  },
  // ── FASHION ───────────────────────────────────────────────────────────────
  {
    id: 'f1',
    handle: '@streetweardelhi',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=streetweardelhi',
    followers: 73000,
    avg_views: 45000,
    engagement_rate: 0.061,
    estimated_cost: 6800,
    niche: 'fashion',
  },
  {
    id: 'f2',
    handle: '@indiesaree',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=indiesaree',
    followers: 34000,
    avg_views: 19000,
    engagement_rate: 0.083,
    estimated_cost: 3900,
    niche: 'fashion',
  },
  {
    id: 'f3',
    handle: '@nanofashionpune',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=nanofashionpune',
    followers: 8200,
    avg_views: 6100,
    engagement_rate: 0.112,
    estimated_cost: 750,
    niche: 'fashion',
  },
  {
    id: 'f4',
    handle: '@thriftbangalore',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=thriftbangalore',
    followers: 19500,
    avg_views: 12000,
    engagement_rate: 0.079,
    estimated_cost: 1850,
    niche: 'fashion',
  },
  {
    id: 'f5',
    handle: '@hydrabadzindagi',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=hydrabadzindagi',
    followers: 55000,
    avg_views: 31000,
    engagement_rate: 0.058,
    estimated_cost: 5200,
    niche: 'fashion',
  },
  // ── FOOD ──────────────────────────────────────────────────────────────────
  {
    id: 'fo1',
    handle: '@chaiandchaos',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=chaiandchaos',
    followers: 41000,
    avg_views: 28000,
    engagement_rate: 0.077,
    estimated_cost: 4100,
    niche: 'food',
  },
  {
    id: 'fo2',
    handle: '@streetbhelpuri',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=streetbhelpuri',
    followers: 15000,
    avg_views: 11000,
    engagement_rate: 0.094,
    estimated_cost: 1400,
    niche: 'food',
  },
  {
    id: 'fo3',
    handle: '@homechefhyb',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=homechefhyb',
    followers: 9800,
    avg_views: 7200,
    engagement_rate: 0.103,
    estimated_cost: 900,
    niche: 'food',
  },
  {
    id: 'fo4',
    handle: '@biryanibabes',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=biryanibabes',
    followers: 62000,
    avg_views: 42000,
    engagement_rate: 0.067,
    estimated_cost: 5900,
    niche: 'food',
  },
  {
    id: 'fo5',
    handle: '@veganmumbaikitchen',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=veganmumbaikitchen',
    followers: 23000,
    avg_views: 16500,
    engagement_rate: 0.085,
    estimated_cost: 2200,
    niche: 'food',
  },
  // ── FITNESS ───────────────────────────────────────────────────────────────
  {
    id: 'fit1',
    handle: '@yogawithananya',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=yogawithananya',
    followers: 88000,
    avg_views: 52000,
    engagement_rate: 0.059,
    estimated_cost: 8200,
    niche: 'fitness',
  },
  {
    id: 'fit2',
    handle: '@gymratpune',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=gymratpune',
    followers: 31000,
    avg_views: 18000,
    engagement_rate: 0.076,
    estimated_cost: 3100,
    niche: 'fitness',
  },
  {
    id: 'fit3',
    handle: '@runningwithrohan',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=runningwithrohan',
    followers: 14000,
    avg_views: 9500,
    engagement_rate: 0.088,
    estimated_cost: 1300,
    niche: 'fitness',
  },
  {
    id: 'fit4',
    handle: '@nanofit_delhi',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=nanofit_delhi',
    followers: 5800,
    avg_views: 4200,
    engagement_rate: 0.119,
    estimated_cost: 550,
    niche: 'fitness',
  },
  {
    id: 'fit5',
    handle: '@pilatesbypriya',
    avatar_url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=pilatesbypriya',
    followers: 47000,
    avg_views: 27000,
    engagement_rate: 0.071,
    estimated_cost: 4700,
    niche: 'fitness',
  },
]
```

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts lib/mockData.ts
git commit -m "feat: add Influencer types and 20-item mock dataset across 4 niches"
```

---

## Task 3: Budget Allocation Algorithm (TDD)

**Files:**
- Create: `lib/allocateBudget.ts`
- Create: `__tests__/allocateBudget.test.ts`

**Interfaces:**
- Consumes: `Influencer`, `BucketResult` from `lib/types.ts`
- Produces: `allocateBudget(influencers: Influencer[], targetBudget: number): BucketResult`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/allocateBudget.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { allocateBudget } from '../lib/allocateBudget'
import { Influencer } from '../lib/types'

const makeInfluencer = (overrides: Partial<Influencer> & { id: string }): Influencer => ({
  handle: `@user_${overrides.id}`,
  avatar_url: '',
  followers: 10000,
  avg_views: 5000,
  engagement_rate: 0.05,
  estimated_cost: 1000,
  niche: 'pets',
  ...overrides,
})

describe('allocateBudget', () => {
  it('returns empty selection when budget is 0', () => {
    const influencers = [makeInfluencer({ id: 'a', estimated_cost: 500 })]
    const result = allocateBudget(influencers, 0)
    expect(result.selected_influencers).toHaveLength(0)
    expect(result.total_projected_spend).toBe(0)
    expect(result.leftover_budget).toBe(0)
  })

  it('selects influencers greedily by highest engagement_rate first', () => {
    const low = makeInfluencer({ id: 'low', engagement_rate: 0.02, estimated_cost: 500 })
    const high = makeInfluencer({ id: 'high', engagement_rate: 0.09, estimated_cost: 500 })
    const result = allocateBudget([low, high], 1000)
    expect(result.selected_influencers[0].id).toBe('high')
  })

  it('does not exceed the target budget', () => {
    const influencers = [
      makeInfluencer({ id: 'a', estimated_cost: 1500, engagement_rate: 0.09 }),
      makeInfluencer({ id: 'b', estimated_cost: 800,  engagement_rate: 0.07 }),
      makeInfluencer({ id: 'c', estimated_cost: 600,  engagement_rate: 0.05 }),
    ]
    const result = allocateBudget(influencers, 2000)
    expect(result.total_projected_spend).toBeLessThanOrEqual(2000)
  })

  it('computes leftover_budget correctly', () => {
    const influencers = [
      makeInfluencer({ id: 'a', estimated_cost: 700, engagement_rate: 0.08 }),
    ]
    const result = allocateBudget(influencers, 1000)
    expect(result.leftover_budget).toBe(300)
    expect(result.total_projected_spend).toBe(700)
  })

  it('skips influencer whose cost alone exceeds remaining budget', () => {
    const influencers = [
      makeInfluencer({ id: 'expensive', estimated_cost: 5000, engagement_rate: 0.10 }),
      makeInfluencer({ id: 'cheap',     estimated_cost: 500,  engagement_rate: 0.06 }),
    ]
    const result = allocateBudget(influencers, 1000)
    expect(result.selected_influencers).toHaveLength(1)
    expect(result.selected_influencers[0].id).toBe('cheap')
  })

  it('applies cost formula when estimated_cost is 0', () => {
    const influencer = makeInfluencer({
      id: 'formula',
      followers: 20000,
      avg_views: 10000,
      engagement_rate: 0.05,
      estimated_cost: 0,
    })
    // formula: (20000 * 0.05) + (10000 / 10 * 0.1) = 1000 + 100 = 1100
    const result = allocateBudget([influencer], 2000)
    expect(result.total_projected_spend).toBe(1100)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/allocateBudget.test.ts
```

Expected: FAIL — "Cannot find module '../lib/allocateBudget'"

- [ ] **Step 3: Implement `lib/allocateBudget.ts`**

```ts
import { Influencer, BucketResult } from './types'

function computeCost(influencer: Influencer): number {
  if (influencer.estimated_cost > 0) return influencer.estimated_cost
  return (influencer.followers * 0.05) + (influencer.avg_views / 10 * 0.1)
}

export function allocateBudget(
  influencers: Influencer[],
  targetBudget: number
): BucketResult {
  const sorted = [...influencers].sort((a, b) => b.engagement_rate - a.engagement_rate)

  const selected: Influencer[] = []
  let spent = 0

  for (const influencer of sorted) {
    const cost = computeCost(influencer)
    if (spent + cost <= targetBudget) {
      selected.push({ ...influencer, estimated_cost: cost })
      spent += cost
    }
  }

  return {
    selected_influencers: selected,
    total_projected_spend: spent,
    leftover_budget: targetBudget - spent,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/allocateBudget.test.ts
```

Expected: 6 tests PASS, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add lib/allocateBudget.ts __tests__/allocateBudget.test.ts
git commit -m "feat: implement greedy knapsack allocateBudget with full test suite"
```

---

## Task 4: Root Layout with Font

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: CSS variable `--font-plus-jakarta` consumed by Tailwind `font-sans`

- [ ] **Step 1: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'InstaBucket — Influencer Budget Allocator',
  description: 'Find the perfect mix of micro and nano-influencers for your D2C brand budget.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Verify font loads**

```bash
npm run dev
```

Open `http://localhost:3000`. Open DevTools → Computed styles on `body` → confirm `font-family` starts with "Plus Jakarta Sans". Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: configure Plus Jakarta Sans font and root layout"
```

---

## Task 5: Header Component

**Files:**
- Create: `components/Header.tsx`

- [ ] **Step 1: Create `components/Header.tsx`**

```tsx
'use client'

import { motion } from 'framer-motion'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo + brand name */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Stylised GOAT mascot — SVG inline so no external asset needed */}
          <span
            aria-label="GOAT mascot"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white shadow-soft select-none"
          >
            🐐
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight text-foreground">
              InstaBucket
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-primary/70">
              Greatest Of All Time Influencers
            </span>
          </div>
        </motion.div>

        {/* Right side pill */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          <span className="rounded-full bg-secondary/60 px-4 py-1.5 text-xs font-semibold text-foreground/70 ring-1 ring-secondary">
            MVP Demo · India 🇮🇳
          </span>
        </motion.div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Header.tsx
git commit -m "feat: add glassmorphism sticky Header with GOAT mascot"
```

---

## Task 6: Footer Component

**Files:**
- Create: `components/Footer.tsx`

- [ ] **Step 1: Create `components/Footer.tsx`**

```tsx
export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border/50 py-8 text-center">
      <a
        href="https://arukurmi.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-gray-500 transition-colors hover:text-primary"
      >
        Contact the Developer
      </a>
    </footer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Footer.tsx
git commit -m "feat: add minimal Footer with single developer link"
```

---

## Task 7: BudgetControls Component

**Files:**
- Create: `components/BudgetControls.tsx`

**Interfaces:**
- Consumes: `Influencer['niche']` union type from `lib/types.ts`
- Produces: `onBudgetChange(value: number): void`, `onNicheChange(value: Influencer['niche']): void` callbacks used by `app/page.tsx`

- [ ] **Step 1: Create `components/BudgetControls.tsx`**

```tsx
'use client'

import { motion } from 'framer-motion'
import { IndianRupee, Target } from 'lucide-react'
import { Influencer } from '@/lib/types'

const NICHES: { value: Influencer['niche']; label: string; emoji: string }[] = [
  { value: 'pets',    label: 'Pet Parents',  emoji: '🐾' },
  { value: 'fashion', label: 'Indie Fashion', emoji: '👗' },
  { value: 'food',    label: 'Foodie',        emoji: '🍜' },
  { value: 'fitness', label: 'Fitness',       emoji: '💪' },
]

interface Props {
  budget: number
  niche: Influencer['niche']
  onBudgetChange: (value: number) => void
  onNicheChange:  (value: Influencer['niche']) => void
}

export default function BudgetControls({ budget, niche, onBudgetChange, onNicheChange }: Props) {
  return (
    <motion.div
      className="rounded-2xl bg-white/60 p-6 shadow-soft ring-1 ring-border/60 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
    >
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-foreground">
        <Target className="h-5 w-5 text-primary" />
        Campaign Setup
      </h2>

      {/* Budget slider */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground/80">Total Budget</label>
          <div className="flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1">
            <IndianRupee className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-bold text-primary">
              {budget.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
        <input
          type="range"
          min={5000}
          max={200000}
          step={1000}
          value={budget}
          onChange={(e) => onBudgetChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
        />
        <div className="mt-1.5 flex justify-between text-xs text-foreground/40">
          <span>₹5,000</span>
          <span>₹2,00,000</span>
        </div>
      </div>

      {/* Niche selector */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground/80">Niche</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {NICHES.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => onNicheChange(value)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                niche === value
                  ? 'border-primary bg-primary text-white shadow-soft'
                  : 'border-border bg-white/50 text-foreground/70 hover:border-primary/40 hover:bg-muted'
              }`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/BudgetControls.tsx
git commit -m "feat: add BudgetControls with animated budget slider and niche selector"
```

---

## Task 8: InfluencerCard Component

**Files:**
- Create: `components/InfluencerCard.tsx`

**Interfaces:**
- Consumes: `Influencer` from `lib/types.ts`
- Produces: `<InfluencerCard influencer={Influencer} isSelected={boolean} />` used by `BucketGrid.tsx`

- [ ] **Step 1: Create `components/InfluencerCard.tsx`**

```tsx
'use client'

import { motion } from 'framer-motion'
import { Eye, Heart, Users, IndianRupee } from 'lucide-react'
import Image from 'next/image'
import { Influencer } from '@/lib/types'

interface Props {
  influencer: Influencer
  isSelected: boolean
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export default function InfluencerCard({ influencer, isSelected }: Props) {
  const { handle, avatar_url, followers, avg_views, engagement_rate, estimated_cost } = influencer

  return (
    <motion.div
      layout
      layoutId={influencer.id}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`relative rounded-2xl bg-white/70 p-5 shadow-card ring-1 backdrop-blur-sm transition-all duration-300 ${
        isSelected
          ? 'ring-primary/60 shadow-[0_0_0_2px_theme(colors.primary.DEFAULT)]'
          : 'ring-border/50 hover:ring-border'
      }`}
    >
      {/* Selected badge */}
      {isSelected && (
        <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Selected
        </span>
      )}

      {/* Avatar + handle */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-secondary/60">
          <Image
            src={avatar_url}
            alt={handle}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div>
          <p className="font-bold text-foreground">{handle}</p>
          <p className="text-xs text-foreground/50">
            {(engagement_rate * 100).toFixed(1)}% engagement
          </p>
        </div>
      </div>

      {/* Stats badges */}
      <div className="mb-4 flex flex-wrap gap-2">
        <StatBadge icon={<Users className="h-3 w-3" />} label={formatNumber(followers)} color="bg-secondary/40 text-foreground/70" />
        <StatBadge icon={<Eye   className="h-3 w-3" />} label={formatNumber(avg_views)} color="bg-blue-50 text-blue-600" />
        <StatBadge icon={<Heart className="h-3 w-3" />} label={`${(engagement_rate * 100).toFixed(1)}%`} color="bg-rose-50 text-rose-500" />
      </div>

      {/* Estimated cost */}
      <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-2.5">
        <span className="text-xs font-medium text-foreground/50">Est. Cost</span>
        <div className="flex items-center gap-0.5 font-bold text-primary">
          <IndianRupee className="h-3.5 w-3.5" />
          <span>{estimated_cost.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </motion.div>
  )
}

function StatBadge({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>
      {icon}
      {label}
    </span>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/InfluencerCard.tsx
git commit -m "feat: add animated InfluencerCard with Framer Motion hover and stat badges"
```

---

## Task 9: BucketGrid Component

**Files:**
- Create: `components/BucketGrid.tsx`

**Interfaces:**
- Consumes: `Influencer[]` (all in niche), `string[]` (selected ids), `BucketResult` from `lib/types.ts`
- Produces: `<BucketGrid allInfluencers={Influencer[]} result={BucketResult} />` used by `app/page.tsx`

- [ ] **Step 1: Create `components/BucketGrid.tsx`**

```tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, IndianRupee, TrendingUp } from 'lucide-react'
import InfluencerCard from './InfluencerCard'
import { Influencer, BucketResult } from '@/lib/types'

interface Props {
  allInfluencers: Influencer[]
  result: BucketResult
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 22 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.18 },
  },
}

export default function BucketGrid({ allInfluencers, result }: Props) {
  const selectedIds = new Set(result.selected_influencers.map((i) => i.id))

  // Selected first, then the rest — sorted by engagement descending
  const sorted = [...allInfluencers].sort((a, b) => {
    const aSelected = selectedIds.has(a.id) ? 1 : 0
    const bSelected = selectedIds.has(b.id) ? 1 : 0
    if (bSelected !== aSelected) return bSelected - aSelected
    return b.engagement_rate - a.engagement_rate
  })

  const totalViews = result.selected_influencers.reduce((sum, i) => sum + i.avg_views, 0)

  return (
    <div>
      {/* Summary bar */}
      <motion.div
        className="mb-6 grid grid-cols-3 gap-3 rounded-2xl bg-white/60 p-5 shadow-soft ring-1 ring-border/50 backdrop-blur-sm"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
      >
        <SummaryItem
          icon={<Sparkles className="h-4 w-4 text-primary" />}
          label="Creators Selected"
          value={String(result.selected_influencers.length)}
        />
        <SummaryItem
          icon={<IndianRupee className="h-4 w-4 text-primary" />}
          label="Total Spend"
          value={`₹${result.total_projected_spend.toLocaleString('en-IN')}`}
        />
        <SummaryItem
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          label="Est. Total Views"
          value={totalViews >= 1000 ? `${(totalViews / 1000).toFixed(0)}K` : String(totalViews)}
        />
      </motion.div>

      {/* Cards grid */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {sorted.map((influencer) => (
            <motion.div
              key={influencer.id}
              layout
              layoutId={`wrapper-${influencer.id}`}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <InfluencerCard
                influencer={influencer}
                isSelected={selectedIds.has(influencer.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Leftover budget note */}
      {result.leftover_budget > 0 && result.selected_influencers.length > 0 && (
        <motion.p
          className="mt-6 text-center text-sm text-foreground/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          ₹{result.leftover_budget.toLocaleString('en-IN')} remains unallocated in your budget.
        </motion.p>
      )}
    </div>
  )
}

function SummaryItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="mb-1">{icon}</div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-foreground/50">{label}</p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/BucketGrid.tsx
git commit -m "feat: add BucketGrid with AnimatePresence stagger and summary bar"
```

---

## Task 10: Main Dashboard Page

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `Header`, `Footer`, `BudgetControls`, `BucketGrid` components
- Consumes: `MOCK_INFLUENCERS` from `lib/mockData.ts`
- Consumes: `allocateBudget` from `lib/allocateBudget.ts`
- Consumes: `Influencer` type from `lib/types.ts`

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BudgetControls from '@/components/BudgetControls'
import BucketGrid from '@/components/BucketGrid'
import { MOCK_INFLUENCERS } from '@/lib/mockData'
import { allocateBudget } from '@/lib/allocateBudget'
import { Influencer } from '@/lib/types'

const DEFAULT_BUDGET = 50000
const DEFAULT_NICHE: Influencer['niche'] = 'pets'

export default function DashboardPage() {
  const [budget, setBudget] = useState(DEFAULT_BUDGET)
  const [niche,  setNiche]  = useState<Influencer['niche']>(DEFAULT_NICHE)

  const filtered = useMemo(
    () => MOCK_INFLUENCERS.filter((i) => i.niche === niche),
    [niche]
  )

  const result = useMemo(
    () => allocateBudget(filtered, budget),
    [filtered, budget]
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero headline */}
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Build your{' '}
            <span className="bg-gradient-to-r from-primary to-[#e8956d] bg-clip-text text-transparent">
              Influencer Bucket
            </span>
          </h1>
          <p className="mt-3 text-base text-foreground/60 sm:text-lg">
            Set your budget. Pick a niche. We allocate the best creators for maximum reach.
          </p>
        </motion.div>

        {/* Controls */}
        <div className="mb-8">
          <BudgetControls
            budget={budget}
            niche={niche}
            onBudgetChange={setBudget}
            onNicheChange={setNiche}
          />
        </div>

        {/* Results */}
        <BucketGrid allInfluencers={filtered} result={result} />
      </main>

      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: Start the dev server and verify the full page**

```bash
npm run dev
```

Open `http://localhost:3000`. Check:
- Header renders with GOAT mascot.
- Budget slider moves and cards re-sort with animation.
- Switching niche tabs shows different influencers.
- Selected cards show the "Selected" badge and primary ring.
- Summary bar updates (creators selected, total spend, views).
- Footer link reads "Contact the Developer".

Ctrl+C when done.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire full dashboard page with budget/niche state and animated results"
```

---

## Task 11: API Route + Rate Limiting Middleware

**Files:**
- Create: `app/api/fetch-metrics/route.ts`
- Create: `middleware.ts`

> **Note:** For the MVP, the API route returns mock data. The Upstash middleware is wired up and enforces rate limits now so the seam is ready for a real RapidAPI key later.

- [ ] **Step 1: Add Upstash environment variables to `.env.local`**

```bash
# .env.local — fill in with Upstash Redis credentials from https://console.upstash.com
UPSTASH_REDIS_REST_URL=your_upstash_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_token_here
```

> For local dev without real Upstash credentials, the middleware will fall back gracefully (see implementation below).

- [ ] **Step 2: Create `app/api/fetch-metrics/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { MOCK_INFLUENCERS } from '@/lib/mockData'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const niche = searchParams.get('niche')

  const filtered = niche
    ? MOCK_INFLUENCERS.filter((i) => i.niche === niche)
    : MOCK_INFLUENCERS

  return NextResponse.json({ influencers: filtered })
}
```

- [ ] **Step 3: Create `middleware.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'

// Rate limit only the API proxy route.
// When Upstash credentials are present, enforce 10 req/min/IP.
// When credentials are absent (local dev), skip rate limiting gracefully.
export const config = {
  matcher: '/api/fetch-metrics',
}

export default async function middleware(request: NextRequest): Promise<NextResponse> {
  const url  = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    // Local dev without Upstash — pass through
    return NextResponse.next()
  }

  const { Ratelimit } = await import('@upstash/ratelimit')
  const { Redis }     = await import('@upstash/redis')

  const ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: false,
  })

  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const { success, limit, remaining, reset } = await ratelimit.limit(ip)

  if (!success) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit':     String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset':     String(reset),
        'Retry-After':           String(Math.ceil((reset - Date.now()) / 1000)),
      },
    })
  }

  return NextResponse.next()
}
```

- [ ] **Step 4: Test the API route**

```bash
npm run dev
```

In a separate terminal:

```bash
curl http://localhost:3000/api/fetch-metrics?niche=pets
```

Expected: JSON response with 5 pet influencer objects.

```bash
curl http://localhost:3000/api/fetch-metrics
```

Expected: JSON with all 20 influencers.

Ctrl+C the dev server.

- [ ] **Step 5: Commit**

```bash
git add app/api/fetch-metrics/route.ts middleware.ts
git commit -m "feat: add /api/fetch-metrics route and Upstash rate-limit middleware (10 req/min/IP)"
```

---

## Task 12: Production Build Verification

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: All 6 `allocateBudget` tests PASS.

- [ ] **Step 2: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: Build completes without errors. Check for any "Missing 'key'" or hydration warnings.

- [ ] **Step 4: Run production build locally**

```bash
npm run start
```

Open `http://localhost:3000`. Verify:
- No console errors.
- Animations work.
- Budget slider triggers card re-sort.
- API route accessible at `/api/fetch-metrics`.
Ctrl+C.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: verify production build passes — InstaBucket MVP frontend complete"
```

---

## Self-Review

### Spec Coverage

| Spec Requirement | Covered |
|---|---|
| No auth, no login/signup routes | ✅ Task 10 — only `/` route |
| Root route renders dashboard immediately | ✅ Task 10 |
| Glassmorphism sticky header + GOAT mascot | ✅ Task 5 |
| Minimal footer with exactly one developer link | ✅ Task 6 |
| Organic Indie theme colors | ✅ Task 1 |
| Plus Jakarta Sans font | ✅ Task 4 |
| `rounded-2xl` + soft shadow on cards | ✅ Tasks 1, 8 |
| `whileHover={{ scale: 1.02, y: -5 }}` on cards | ✅ Task 8 |
| AnimatePresence + layoutId on grid | ✅ Task 9 |
| Stagger on initial card load | ✅ Task 9 |
| `allocateBudget` greedy knapsack | ✅ Task 3 |
| Cost formula `(followers * 0.05) + (avg_views / 10 * 0.1)` | ✅ Task 3 |
| `selected_influencers`, `total_projected_spend`, `leftover_budget` output | ✅ Task 3 |
| `/api/fetch-metrics` route handler | ✅ Task 11 |
| Upstash rate limiting 10 req/min/IP + 429 response | ✅ Task 11 |
| `metadata` JSONB column (future AI hook) | ✅ Task 2 — in `Influencer` type |
| `InfluencerCard` decoupled from raw API (future LLM hook) | ✅ Task 8 — only receives `Influencer` type |
| Supabase schema | ❌ Not in frontend scope — Supabase migration is a backend task |
| RapidAPI live scraping | ❌ MVP demo uses mock data; API seam is ready in Task 11 |

### No Placeholders Check
Scanned — no TBD, TODO, or "similar to Task N" patterns found. All code blocks are complete.

### Type Consistency Check
- `Influencer` type defined in Task 2, consumed identically in Tasks 3, 7, 8, 9, 10.
- `BucketResult` defined in Task 2, produced by `allocateBudget` in Task 3, consumed in Tasks 9, 10.
- `allocateBudget(influencers: Influencer[], targetBudget: number): BucketResult` — consistent across Tasks 3 and 10.
