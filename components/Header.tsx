'use client'

import { motion } from 'framer-motion'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo + brand name */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Stylised GOAT mascot */}
          <span
            aria-label="GOAT mascot"
            className="shadow-soft flex h-9 w-9 select-none items-center justify-center rounded-xl bg-primary text-lg font-bold text-white"
          >
            🐐
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight text-foreground">
              Creator Nexus
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-primary/70">
              Greatest Of All Time Influencers
            </span>
          </div>
        </motion.div>

        {/* Right side pill */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          <span className="rounded-full bg-secondary/60 px-4 py-1.5 text-xs font-semibold text-foreground/70 ring-1 ring-secondary">
            MVP Demo · India 🇮🇳
          </span>
        </motion.div>
      </div>
    </header>
  )
}
