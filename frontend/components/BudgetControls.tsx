'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IndianRupee,
  Target,
  ChevronDown,
  Check,
  TrendingUp,
  Heart,
  Gem,
  Hash,
  Minus,
  Plus,
  MapPin,
} from 'lucide-react'
import { Niche, AllocationStrategy } from '@/lib/types'
import { NICHES } from '@/lib/niches'

// Indian cities for the optional location filter (must match backend tags).
const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh',
]

interface Props {
  budget: number
  niche: Niche
  strategy: AllocationStrategy
  count: number
  city: string
  maxCount: number
  onBudgetChange: (value: number) => void
  onNicheChange: (value: Niche) => void
  onStrategyChange: (value: AllocationStrategy) => void
  onCountChange: (value: number) => void
  onCityChange: (value: string) => void
}

const STRATEGIES: {
  value: AllocationStrategy
  label: string
  icon: typeof TrendingUp
  hint: string
}[] = [
  { value: 'reach', label: 'Max Reach', icon: TrendingUp, hint: 'Most eyeballs per rupee; favours larger creators.' },
  { value: 'engagement', label: 'Max Engagement', icon: Heart, hint: 'Highest engaged audience. May exceed your budget by up to 10% because the brand wants maximum engagement.' },
  { value: 'value', label: 'Best Value', icon: Gem, hint: 'Best blend of reach and engagement per rupee.' },
  { value: 'count', label: 'Pick Count', icon: Hash, hint: 'Exactly N best-fit creators within budget.' },
]

export default function BudgetControls({
  budget,
  niche,
  strategy,
  count,
  city,
  maxCount,
  onBudgetChange,
  onNicheChange,
  onStrategyChange,
  onCountChange,
  onCityChange,
}: Props) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selected = NICHES.find((n) => n.value === niche) ?? NICHES[0]
  const activeStrategy = STRATEGIES.find((s) => s.value === strategy)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <motion.div
      className="shadow-soft relative z-30 rounded-2xl bg-white/60 p-6 ring-1 ring-border/60 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
    >
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-foreground">
        <Target className="h-5 w-5 text-primary" />
        Campaign Setup
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Budget slider */}
        <div>
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

        {/* Niche dropdown */}
        <div ref={dropdownRef} className="relative">
          <label className="mb-2 block text-sm font-semibold text-foreground/80">
            Content Niche
          </label>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-white/70 px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/40"
          >
            <span>
              {selected.emoji} {selected.label}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-foreground/40 transition-transform ${
                open ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {open && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="shadow-card absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-border bg-white p-1.5"
              >
                {NICHES.map((n) => (
                  <li key={n.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onNicheChange(n.value)
                        setOpen(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                        n.value === niche
                          ? 'bg-primary/10 font-semibold text-primary'
                          : 'text-foreground/80 hover:bg-muted'
                      }`}
                    >
                      <span>
                        {n.emoji} {n.label}
                      </span>
                      {n.value === niche && <Check className="h-4 w-4" />}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* City filter (optional) */}
      <div className="mt-6">
        <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground/80">
          <MapPin className="h-4 w-4 text-primary" />
          City <span className="font-normal text-foreground/40">(optional — India-wide if blank)</span>
        </label>
        <div className="relative">
          <select
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl border border-border bg-white/70 px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/40 focus:border-primary focus:outline-none"
          >
            <option value="">🇮🇳 All India</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
        </div>
      </div>

      {/* Allocation strategy */}
      <div className="mt-6 border-t border-border/60 pt-5">
        <label className="mb-2 block text-sm font-semibold text-foreground/80">
          Allocation Strategy
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STRATEGIES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onStrategyChange(value)}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                strategy === value
                  ? 'shadow-soft border-primary bg-primary text-white'
                  : 'border-border bg-white/50 text-foreground/70 hover:border-primary/40 hover:bg-muted'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-foreground/50">{activeStrategy?.hint}</p>

          {/* Count stepper — only for the "Pick Count" strategy */}
          {strategy === 'count' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground/70">
                Creators:
              </span>
              <div className="flex items-center gap-1 rounded-xl border border-border bg-white/70 p-1">
                <button
                  onClick={() => onCountChange(Math.max(1, count - 1))}
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-foreground/60 transition hover:bg-muted disabled:opacity-40"
                  disabled={count <= 1}
                  aria-label="Decrease creator count"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-bold text-foreground">
                  {count}
                </span>
                <button
                  onClick={() => onCountChange(Math.min(maxCount, count + 1))}
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-foreground/60 transition hover:bg-muted disabled:opacity-40"
                  disabled={count >= maxCount}
                  aria-label="Increase creator count"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
