'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AuthGate from '@/components/AuthGate'
import BudgetControls from '@/components/BudgetControls'
import MetricsLegend from '@/components/MetricsLegend'
import BucketGrid from '@/components/BucketGrid'
import { allocateViaApi } from '@/lib/api'
import { getSupabase } from '@/lib/supabase/client'
import { Niche, AllocationStrategy, Influencer, BucketResult } from '@/lib/types'

const DEFAULT_BUDGET = 50000
const DEFAULT_NICHE: Niche = 'pets'

interface TierStat { count: number; spend: number }
interface ApiResult {
  selected: Influencer[]
  total_projected_spend: number
  leftover_budget: number
  effective_budget: number
  budget_buffer_applied: boolean
  by_tier: { nano: TierStat; micro: TierStat; macro: TierStat }
  creators_considered: number
}

export default function DashboardPage() {
  const [budget, setBudget] = useState(DEFAULT_BUDGET)
  const [niche, setNiche] = useState<Niche>(DEFAULT_NICHE)
  const [strategy, setStrategy] = useState<AllocationStrategy>('reach')
  const [count, setCount] = useState(5)
  const [city, setCity] = useState('') // '' = All India

  const [apiResult, setApiResult] = useState<ApiResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAllocation = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabase()
      const sessionData = supabase ? await supabase.auth.getSession() : null
      const token = sessionData?.data.session?.access_token ?? ''

      if (!token) {
        setError('Sign in to generate your allocation.')
        setLoading(false)
        return
      }

      const res = await allocateViaApi<ApiResult>(
        {
          budget,
          niche,
          strategy,
          count: strategy === 'count' ? count : undefined,
          city: city.trim() || undefined,
        },
        token,
        { signal },
      )
      setApiResult(res)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Unable to reach the allocation service. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [budget, niche, strategy, count, city])

  useEffect(() => {
    const controller = new AbortController()
    fetchAllocation(controller.signal)
    return () => controller.abort()
  }, [fetchAllocation])

  // Adapt API result to BucketResult for BucketGrid
  const bucketResult: BucketResult = apiResult
    ? {
        selected_influencers: apiResult.selected,
        total_projected_spend: apiResult.total_projected_spend,
        leftover_budget: apiResult.leftover_budget,
      }
    : { selected_influencers: [], total_projected_spend: 0, leftover_budget: 0 }

  const allInfluencers: Influencer[] = apiResult?.selected ?? []
  const creatorsConsidered = apiResult?.creators_considered ?? 10

  return (
    <AuthGate>
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
              Set your budget. Pick a niche. We allocate the best creators for
              maximum reach.
            </p>
          </motion.div>

          {/* Controls */}
          <div className="mb-8">
            <BudgetControls
              budget={budget}
              niche={niche}
              strategy={strategy}
              count={count}
              city={city}
              maxCount={creatorsConsidered}
              onBudgetChange={setBudget}
              onNicheChange={setNiche}
              onStrategyChange={setStrategy}
              onCountChange={setCount}
              onCityChange={setCity}
            />
          </div>

          {/* Max-engagement buffer note */}
          {apiResult?.budget_buffer_applied && (
            <motion.div
              className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              Max-engagement may spend up to 10% over your budget — the brand opted for maximum engagement.
            </motion.div>
          )}

          {/* Tier breakdown summary */}
          {apiResult && !loading && (
            <motion.div
              className="mb-6 rounded-xl border border-border/50 bg-white/70 px-5 py-4"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="font-semibold text-foreground/70 uppercase tracking-wide text-xs">Tier breakdown</span>
                {(['nano', 'micro', 'macro'] as const).map((tier) => {
                  const stat = apiResult.by_tier[tier]
                  return (
                    <span key={tier} className="flex items-center gap-1.5">
                      <span className="capitalize font-medium text-foreground/80">{tier}</span>
                      <span className="text-foreground/50">
                        {stat.count} creator{stat.count !== 1 ? 's' : ''} · ₹{stat.spend.toLocaleString('en-IN')}
                      </span>
                    </span>
                  )
                })}
                <span className="ml-auto flex items-center gap-3 text-foreground/60">
                  <span>Total spend: <strong className="text-foreground/80">₹{apiResult.total_projected_spend.toLocaleString('en-IN')}</strong></span>
                  <span>Leftover: <strong className="text-foreground/80">₹{apiResult.leftover_budget.toLocaleString('en-IN')}</strong></span>
                </span>
              </div>
            </motion.div>
          )}

          {/* Error state */}
          {error && !loading && (
            <motion.div
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="font-semibold">Could not load allocation</p>
              <p className="mt-1 text-red-600/80">{error}</p>
              <button
                onClick={() => fetchAllocation()}
                className="mt-3 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-200"
              >
                Retry
              </button>
            </motion.div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <motion.div
              className="mb-6 flex items-center justify-center gap-3 rounded-xl border border-border/50 bg-white/60 py-12 text-foreground/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <svg className="h-5 w-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-sm font-medium">Allocating creators…</span>
            </motion.div>
          )}

          {/* Legend */}
          <MetricsLegend />

          {/* Results */}
          {!loading && !error && (
            <BucketGrid allInfluencers={allInfluencers} result={bucketResult} />
          )}
        </main>

        <Footer />
      </div>
    </AuthGate>
  )
}
