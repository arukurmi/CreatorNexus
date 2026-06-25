'use client'

import { motion } from 'framer-motion'
import { Users, Eye, Heart, Info } from 'lucide-react'

const ITEMS = [
  {
    icon: <Users className="h-3.5 w-3.5" />,
    color: 'bg-secondary/40 text-foreground/70',
    label: 'Followers',
    desc: 'Total audience size — drives the nano / micro / macro tier.',
  },
  {
    icon: <Eye className="h-3.5 w-3.5" />,
    color: 'bg-blue-50 text-blue-600',
    label: 'Avg. Views',
    desc: 'Typical reach of a recent reel — real eyeballs, not vanity.',
  },
  {
    icon: <Heart className="h-3.5 w-3.5" />,
    color: 'bg-rose-50 text-rose-500',
    label: 'Engagement',
    desc: 'Likes + comments ÷ followers. Higher = more responsive fans.',
  },
]

export default function MetricsLegend() {
  return (
    <motion.div
      className="shadow-soft mb-6 rounded-2xl bg-white/60 p-5 ring-1 ring-border/50 backdrop-blur-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.18 }}
    >
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/50">
        <Info className="h-3.5 w-3.5" />
        What the badges mean
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {ITEMS.map((item) => (
          <div key={item.label} className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${item.color}`}
            >
              {item.icon}
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {item.label}
              </p>
              <p className="text-xs leading-snug text-foreground/55">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
