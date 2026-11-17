'use client'

import { useState, useRef, useEffect, useId } from 'react'
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
  RefreshCw,
} from 'lucide-react'
import { Niche, AllocationStrategy } from '@/lib/types'
import { NICHES } from '@/lib/niches'
import { MIN_BUDGET, SLIDER_MAX_BUDGET } from '@/lib/budget'

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
  dirty: boolean
  loading: boolean
  onBudgetChange: (value: number) => void
  onNicheChange: (value: Niche) => void
  onStrategyChange: (value: AllocationStrategy) => void
  onCountChange: (value: number) => void
  onCityChange: (value: string) => void
  onApply: () => void
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
  dirty,
  loading,
  onBudgetChange,
  onNicheChange,
  onStrategyChange,
  onCountChange,
  onCityChange,
  onApply,
}: Props) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedIndex = Math.max(0, NICHES.findIndex((n) => n.value === niche))
  const selected = NICHES[selectedIndex]
  const activeStrategy = STRATEGIES.find((s) => s.value === strategy)
  const idPrefix = useId()
  const nicheOptionId = (i: number) => `${idPrefix}-niche-${NICHES[i].value}`
  const activeOptionId = open ? nicheOptionId(activeIndex) : undefined

  function openNiches(index = selectedIndex) {
    setActiveIndex(index)
    setOpen(true)
  }

  function selectNiche(index: number) {
    onNicheChange(NICHES[index].value)
    setOpen(false)
  }

  function onNicheKeyDown(e: React.KeyboardEvent) {
    const lastIndex = NICHES.length - 1
    const step = (delta: number) => (open ? Math.min(lastIndex, Math.max(0, activeIndex + delta)) : selectedIndex)
    const targetIndex = ({ ArrowDown: step(1), ArrowUp: step(-1), Home: 0, End: lastIndex } as Record<string, number>)[e.key]
    if (targetIndex !== undefined) {
      e.preventDefault()
      openNiches(targetIndex)
    } else if (open && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      selectNiche(activeIndex)
    } else if (open && e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  useEffect(() => {
    if (activeOptionId) document.getElementById(activeOptionId)?.scrollIntoView?.({ block: 'nearest' })
  }, [activeOptionId])

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
            <label htmlFor={`${idPrefix}-budget`} className="text-sm font-semibold text-foreground/80">
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
            id={`${idPrefix}-budget`}
            type="range"
            min={MIN_BUDGET}
            max={SLIDER_MAX_BUDGET}
            step={1000}
            value={budget}
            onChange={(e) => onBudgetChange(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
          />
          <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
            <span>₹{MIN_BUDGET.toLocaleString('en-IN')}</span>
            <span>₹{SLIDER_MAX_BUDGET.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Niche dropdown */}
        <div ref={dropdownRef} className="relative">
          <label id={`${idPrefix}-niche-label`} className="mb-2 block text-sm font-semibold text-foreground/80">
            Content Niche
          </label>
          <button
            type="button"
            id={`${idPrefix}-niche-trigger`}
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={`${idPrefix}-niche-listbox`}
            aria-labelledby={`${idPrefix}-niche-label ${idPrefix}-niche-trigger`}
            aria-activedescendant={activeOptionId}
            onClick={() => (open ? setOpen(false) : openNiches())}
            onKeyDown={onNicheKeyDown}
            className="flex w-full items-center justify-between rounded-xl border border-input bg-white/70 px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/40"
          >
            <span>
              {selected.emoji} {selected.label}
            </span>
            <ChevronDown
              aria-hidden
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                open ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {open && (
              <motion.ul
                id={`${idPrefix}-niche-listbox`}
                role="listbox"
                aria-labelledby={`${idPrefix}-niche-label`}
                onMouseDown={(e) => e.preventDefault()}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="shadow-card absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-border bg-white p-1.5"
              >
                {NICHES.map((n, i) => (
                  <li
                    key={n.value}
                    id={nicheOptionId(i)}
                    role="option"
                    aria-selected={n.value === niche}
                    onClick={() => selectNiche(i)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                      n.value === niche
                        ? 'bg-primary/10 font-semibold text-primary'
                        : `text-foreground/80 hover:bg-muted ${i === activeIndex ? 'bg-muted' : ''}`
                    }`}
                  >
                    <span>
                      {n.emoji} {n.label}
                    </span>
                    {n.value === niche && <Check aria-hidden className="h-4 w-4" />}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* City filter (optional) */}
      <div className="mt-6">
        <label htmlFor={`${idPrefix}-city`} className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground/80">
          <MapPin aria-hidden className="h-4 w-4 text-primary" />
          City <span className="font-normal text-muted-foreground">(optional — all locations if blank)</span>
        </label>
        <div className="relative">
          <select
            id={`${idPrefix}-city`}
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl border border-input bg-white/70 px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/40 focus:border-primary"
          >
            <option value="">🌐 All locations</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* Allocation strategy */}
      <div className="mt-6 border-t border-border/60 pt-5">
        <label id={`${idPrefix}-strategy-label`} className="mb-2 block text-sm font-semibold text-foreground/80">
          Allocation Strategy
        </label>
        <div role="group" aria-labelledby={`${idPrefix}-strategy-label`} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STRATEGIES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              aria-pressed={strategy === value}
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
          <p className="text-xs text-muted-foreground">{activeStrategy?.hint}</p>

          {/* Count stepper — only for the "Pick Count" strategy */}
          {strategy === 'count' && (
            <div className="flex items-center gap-2">
              <span id={`${idPrefix}-count-label`} className="text-xs font-semibold text-foreground/70">
                Creators:
              </span>
              <div role="group" aria-labelledby={`${idPrefix}-count-label`} className="flex items-center gap-1 rounded-xl border border-border bg-white/70 p-1">
                <button
                  onClick={() => onCountChange(Math.max(1, count - 1))}
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted disabled:opacity-40"
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
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted disabled:opacity-40"
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

      {/* Apply filters — fetches buckets for the current budget / niche / city / strategy */}
      <div className="mt-6 flex flex-col items-center gap-2 border-t border-border/60 pt-5 sm:flex-row sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {dirty
            ? 'Filters changed — click Apply to refresh your buckets.'
            : 'Buckets reflect the applied filters.'}
        </p>
        <button
          type="button"
          onClick={onApply}
          disabled={loading || !dirty}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition sm:w-auto ${
            dirty && !loading
              ? 'shadow-soft bg-primary text-white hover:opacity-90'
              : 'cursor-not-allowed bg-muted text-foreground/40'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Applying…
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" /> Apply Filters
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}
