'use client'

import { motion } from 'framer-motion'
import { Eye, Heart, Users, IndianRupee } from 'lucide-react'
import { Influencer } from '@/lib/types'

interface Props {
  influencer: Influencer
  isSelected: boolean
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export default function InfluencerCard({ influencer, isSelected }: Props) {
  const { handle, avatar_url, followers, avg_views, engagement_rate, estimated_cost } =
    influencer

  return (
    <motion.div
      layout
      layoutId={influencer.id}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`shadow-card relative rounded-2xl bg-white/70 p-5 ring-1 backdrop-blur-sm transition-colors duration-300 ${
        isSelected
          ? 'ring-2 ring-primary/70'
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
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-secondary/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatar_url}
            alt={handle}
            className="h-full w-full object-cover"
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
        <StatBadge
          icon={<Users className="h-3 w-3" />}
          label={formatNumber(followers)}
          color="bg-secondary/40 text-foreground/70"
        />
        <StatBadge
          icon={<Eye className="h-3 w-3" />}
          label={formatNumber(avg_views)}
          color="bg-blue-50 text-blue-600"
        />
        <StatBadge
          icon={<Heart className="h-3 w-3" />}
          label={`${(engagement_rate * 100).toFixed(1)}%`}
          color="bg-rose-50 text-rose-500"
        />
      </div>

      {/* Estimated cost */}
      <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-2.5">
        <span className="text-xs font-medium text-foreground/50">Est. Cost</span>
        <div className="flex items-center gap-0.5 font-bold text-primary">
          <IndianRupee className="h-3.5 w-3.5" />
          <span>{Math.round(estimated_cost).toLocaleString('en-IN')}</span>
        </div>
      </div>
    </motion.div>
  )
}

function StatBadge({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode
  label: string
  color: string
}) {
  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}
    >
      {icon}
      {label}
    </span>
  )
}
