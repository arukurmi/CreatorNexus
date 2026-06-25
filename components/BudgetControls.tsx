'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IndianRupee, Target, ChevronDown, Check } from 'lucide-react'
import { Niche } from '@/lib/types'
import { NICHES } from '@/lib/niches'

interface Props {
  budget: number
  niche: Niche
  onBudgetChange: (value: number) => void
  onNicheChange: (value: Niche) => void
}

export default function BudgetControls({
  budget,
  niche,
  onBudgetChange,
  onNicheChange,
}: Props) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selected = NICHES.find((n) => n.value === niche) ?? NICHES[0]

  // Close dropdown on outside click
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
      className="shadow-soft rounded-2xl bg-white/60 p-6 ring-1 ring-border/60 backdrop-blur-sm"
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
                className="shadow-card absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-border bg-white p-1.5"
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
    </motion.div>
  )
}
