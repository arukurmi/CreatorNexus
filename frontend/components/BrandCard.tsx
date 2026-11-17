'use client'

import { motion } from 'framer-motion'

export default function BrandCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        className="shadow-card w-full max-w-md rounded-3xl bg-white/70 p-8 ring-1 ring-border/60 backdrop-blur-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="shadow-soft flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
            🐐
          </span>
          <div className="leading-none">
            <p className="text-lg font-bold text-foreground">Creator Nexus</p>
            <p className="text-xs text-muted-foreground">
              Allocate budgets to the right creators
            </p>
          </div>
        </div>
        {children}
      </motion.div>
    </div>
  )
}
