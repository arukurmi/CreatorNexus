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
