'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AuthGate from '@/components/AuthGate'
import BudgetControls from '@/components/BudgetControls'
import MetricsLegend from '@/components/MetricsLegend'
import BucketGrid from '@/components/BucketGrid'
import { MOCK_INFLUENCERS } from '@/lib/mockData'
import { allocateBudget } from '@/lib/allocateBudget'
import { Niche } from '@/lib/types'

const DEFAULT_BUDGET = 50000
const DEFAULT_NICHE: Niche = 'pets'

export default function DashboardPage() {
  const [budget, setBudget] = useState(DEFAULT_BUDGET)
  const [niche, setNiche] = useState<Niche>(DEFAULT_NICHE)

  const filtered = useMemo(
    () => MOCK_INFLUENCERS.filter((i) => i.niche === niche),
    [niche]
  )

  const result = useMemo(
    () => allocateBudget(filtered, budget),
    [filtered, budget]
  )

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
              onBudgetChange={setBudget}
              onNicheChange={setNiche}
            />
          </div>

          {/* Legend */}
          <MetricsLegend />

          {/* Results */}
          <BucketGrid allInfluencers={filtered} result={result} />
        </main>

        <Footer />
      </div>
    </AuthGate>
  )
}
