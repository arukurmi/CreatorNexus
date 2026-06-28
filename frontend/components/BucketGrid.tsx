'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Sparkles, IndianRupee, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import InfluencerCard from './InfluencerCard'
import { Influencer, BucketResult, Tier } from '@/lib/types'
import { getTier, TIER_META, TIER_ORDER } from '@/lib/tier'

interface Props {
  allInfluencers: Influencer[]
  result: BucketResult
}

// Cards shown per page in each tier bucket (2 rows of 5 on wide screens).
const PAGE_SIZE = 10

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 22 },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.18 } },
}

export default function BucketGrid({ allInfluencers, result }: Props) {
  const selectedIds = new Set(result.selected_influencers.map((i) => i.id))
  const totalViews = result.selected_influencers.reduce(
    (sum, i) => sum + i.avg_views,
    0
  )

  // Group influencers into tier buckets, selected first within each band
  const buckets: Record<Tier, Influencer[]> = { nano: [], micro: [], macro: [] }
  for (const inf of allInfluencers) buckets[getTier(inf.followers)].push(inf)
  for (const tier of TIER_ORDER) {
    buckets[tier].sort((a, b) => {
      const aSel = selectedIds.has(a.id) ? 1 : 0
      const bSel = selectedIds.has(b.id) ? 1 : 0
      if (bSel !== aSel) return bSel - aSel
      return b.engagement_rate - a.engagement_rate
    })
  }

  return (
    <div>
      {/* Summary bar */}
      <motion.div
        className="shadow-soft mb-6 grid grid-cols-3 gap-3 rounded-2xl bg-white/60 p-5 ring-1 ring-border/50 backdrop-blur-sm"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
      >
        <SummaryItem
          icon={<Sparkles className="h-4 w-4 text-primary" />}
          label="Creators in Bucket"
          value={String(result.selected_influencers.length)}
        />
        <SummaryItem
          icon={<IndianRupee className="h-4 w-4 text-primary" />}
          label="Projected Spend"
          value={`₹${Math.round(result.total_projected_spend).toLocaleString('en-IN')}`}
        />
        <SummaryItem
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          label="Est. Total Views"
          value={
            totalViews >= 1000
              ? `${(totalViews / 1000).toFixed(0)}K`
              : String(totalViews)
          }
        />
      </motion.div>

      {/* Tier buckets */}
      <div className="space-y-8">
        {TIER_ORDER.map((tier) => {
          const list = buckets[tier]
          if (list.length === 0) return null
          return (
            <TierBucket
              key={tier}
              tier={tier}
              list={list}
              selectedIds={selectedIds}
            />
          )
        })}
      </div>

      {/* Leftover budget note */}
      {result.leftover_budget > 0 && result.selected_influencers.length > 0 && (
        <motion.p
          className="mt-8 text-center text-sm text-foreground/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          ₹{Math.round(result.leftover_budget).toLocaleString('en-IN')} remains
          unallocated in your budget.
        </motion.p>
      )}
    </div>
  )
}

function TierBucket({
  tier,
  list,
  selectedIds,
}: {
  tier: Tier
  list: Influencer[]
  selectedIds: Set<string>
}) {
  const meta = TIER_META[tier]
  const selectedInTier = list.filter((i) => selectedIds.has(i.id)).length
  const [visible, setVisible] = useState(PAGE_SIZE)

  // Reset paging whenever the bucket contents change (a new allocation).
  useEffect(() => setVisible(PAGE_SIZE), [list.length, tier])

  const shown = list.slice(0, visible)
  const remaining = list.length - shown.length

  return (
    <section>
      {/* Bucket header */}
      <div
        className={`mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-gradient-to-r ${meta.band} to-transparent px-4 py-3`}
      >
        <span className="text-lg">{meta.emoji}</span>
        <h3 className="text-base font-bold text-foreground">{meta.label} bucket</h3>
        <span className="text-xs font-medium text-foreground/50">{meta.range}</span>
        <span className="ml-auto rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-semibold text-foreground/60 ring-1 ring-border/50">
          {selectedInTier} in bucket · {list.length} available
        </span>
        <p className="w-full text-xs text-foreground/45">{meta.blurb}</p>
      </div>

      {/* Cards (paginated, 5 per row / 10 per page) */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
      >
        <AnimatePresence mode="popLayout">
          {shown.map((influencer) => (
            <motion.div
              key={influencer.id}
              layout
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

      {/* Pagination controls */}
      {list.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-center gap-3">
          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-white/70 px-4 py-2 text-sm font-semibold text-foreground/70 transition hover:border-primary/40 hover:text-primary"
            >
              <ChevronDown className="h-4 w-4" />
              Show {Math.min(PAGE_SIZE, remaining)} more
              <span className="text-foreground/40">({remaining} left)</span>
            </button>
          )}
          {visible > PAGE_SIZE && (
            <button
              type="button"
              onClick={() => setVisible(PAGE_SIZE)}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-foreground/50 transition hover:text-foreground"
            >
              <ChevronUp className="h-4 w-4" />
              Show less
            </button>
          )}
        </div>
      )}
    </section>
  )
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="mb-1">{icon}</div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-foreground/50">{label}</p>
    </div>
  )
}
