'use client'

import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Sparkles, IndianRupee, TrendingUp } from 'lucide-react'
import InfluencerCard from './InfluencerCard'
import { Influencer, BucketResult } from '@/lib/types'

interface Props {
  allInfluencers: Influencer[]
  result: BucketResult
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants: Variants = {
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

  // Selected first, then the rest — each group sorted by engagement descending
  const sorted = [...allInfluencers].sort((a, b) => {
    const aSelected = selectedIds.has(a.id) ? 1 : 0
    const bSelected = selectedIds.has(b.id) ? 1 : 0
    if (bSelected !== aSelected) return bSelected - aSelected
    return b.engagement_rate - a.engagement_rate
  })

  const totalViews = result.selected_influencers.reduce(
    (sum, i) => sum + i.avg_views,
    0
  )

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
          label="Creators Selected"
          value={String(result.selected_influencers.length)}
        />
        <SummaryItem
          icon={<IndianRupee className="h-4 w-4 text-primary" />}
          label="Total Spend"
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
          ₹{Math.round(result.leftover_budget).toLocaleString('en-IN')} remains
          unallocated in your budget.
        </motion.p>
      )}
    </div>
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
