'use client'

import { motion } from 'framer-motion'
import { IndianRupee, Target } from 'lucide-react'
import { Influencer } from '@/lib/types'

const NICHES: { value: Influencer['niche']; label: string; emoji: string }[] = [
  { value: 'pets', label: 'Pet Parents', emoji: '🐾' },
  { value: 'fashion', label: 'Indie Fashion', emoji: '👗' },
  { value: 'food', label: 'Foodie', emoji: '🍜' },
  { value: 'fitness', label: 'Fitness', emoji: '💪' },
]

interface Props {
  budget: number
  niche: Influencer['niche']
  onBudgetChange: (value: number) => void
  onNicheChange: (value: Influencer['niche']) => void
}

export default function BudgetControls({
  budget,
  niche,
  onBudgetChange,
  onNicheChange,
}: Props) {
  return (
    <motion.div
      className="shadow-soft rounded-2xl bg-white/60 p-6 ring-1 ring-border/60 backdrop-blur-sm"
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
          <label className="text-sm font-semibold text-foreground/80">
            Total Budget
          </label>
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
        <label className="mb-2 block text-sm font-semibold text-foreground/80">
          Niche
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {NICHES.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => onNicheChange(value)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                niche === value
                  ? 'shadow-soft border-primary bg-primary text-white'
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
