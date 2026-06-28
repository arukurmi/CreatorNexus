'use client'

import { motion } from 'framer-motion'
import { Eye, Heart, Users, IndianRupee, ExternalLink, Check, MapPin, FlaskConical } from 'lucide-react'
import { Influencer } from '@/lib/types'
import { getTier, TIER_META } from '@/lib/tier'
import { instagramUrl } from '@/lib/instagram'

interface Props {
  influencer: Influencer
  isSelected: boolean
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export default function InfluencerCard({ influencer, isSelected }: Props) {
  const {
    handle,
    avatar_url,
    followers,
    avg_views,
    engagement_rate,
    cost_min,
    cost_max,
    city,
    verified,
  } = influencer
  const tier = getTier(followers)
  const tierMeta = TIER_META[tier]

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`shadow-card relative rounded-2xl bg-white/70 p-5 ring-1 backdrop-blur-sm transition-colors duration-300 ${
        isSelected ? 'ring-2 ring-primary/70' : 'ring-border/50 hover:ring-border'
      }`}
    >
      {/* Top row: tier badge + Instagram link (only for verified, real accounts) */}
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${tierMeta.badge}`}
          title={tierMeta.range}
        >
          {tierMeta.emoji} {tierMeta.label}
        </span>
        {verified ? (
          <a
            href={instagramUrl(handle)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${handle} on Instagram`}
            title="Open verified profile on Instagram"
            className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/40 transition hover:bg-muted hover:text-primary"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <span
            title="Sample data — a realistic placeholder, not a live Instagram account. Enable a live Instagram API for real, openable profiles."
            className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-600 ring-1 ring-amber-200"
          >
            <FlaskConical className="h-3 w-3" /> Sample
          </span>
        )}
      </div>

      {/* Avatar + handle */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-secondary/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar_url} alt={handle} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold text-foreground">{handle}</p>
          <p className="flex items-center gap-2 text-xs text-foreground/50">
            <span>{(engagement_rate * 100).toFixed(1)}% engagement</span>
            {city && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" /> {city}
              </span>
            )}
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

      {/* Cost range */}
      <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-2.5">
        <span className="text-xs font-medium text-foreground/50">Quote range</span>
        <div className="flex items-center gap-0.5 font-bold text-primary">
          <IndianRupee className="h-3.5 w-3.5" />
          <span>
            {formatINR(cost_min).replace('₹', '')} – {formatINR(cost_max).replace('₹', '')}
          </span>
        </div>
      </div>

      {/* In-bucket marker */}
      {isSelected && (
        <div className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-primary/10 py-1.5 text-[11px] font-bold uppercase tracking-wide text-primary">
          <Check className="h-3.5 w-3.5" />
          In your bucket
        </div>
      )}
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
