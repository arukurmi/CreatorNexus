'use client'

import { motion } from 'framer-motion'
import { Sparkles, Target, Users, Lightbulb } from 'lucide-react'
import type { Advisory } from '@/lib/aiApi'
import { NICHE_LABEL } from '@/lib/niches'

export default function AdvisoryCard({ advisory }: { advisory: Advisory }) {
  const { recommended_niche, secondary_niches, tier_mix, rationale, target_audience, content_ideas } = advisory
  const label = (n: string) => NICHE_LABEL[n as keyof typeof NICHE_LABEL] ?? n
  return (
    <motion.div
      className="shadow-soft mb-8 rounded-2xl bg-white/70 p-6 ring-1 ring-border/60 backdrop-blur-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
        <Sparkles className="h-5 w-5 text-primary" /> AI Recommendation
      </h2>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
          {label(recommended_niche)}
        </span>
        {secondary_niches.map((n) => (
          <span key={n} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/60">
            {label(n)}
          </span>
        ))}
      </div>

      {/* Tier mix bar */}
      <div className="mb-5">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/50">Recommended tier mix</p>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          <div className="bg-secondary" style={{ width: `${tier_mix.nano}%` }} title={`Nano ${tier_mix.nano}%`} />
          <div className="bg-primary/70" style={{ width: `${tier_mix.micro}%` }} title={`Micro ${tier_mix.micro}%`} />
          <div className="bg-primary" style={{ width: `${tier_mix.macro}%` }} title={`Macro ${tier_mix.macro}%`} />
        </div>
        <div className="mt-1 flex gap-3 text-xs text-foreground/55">
          <span>Nano {tier_mix.nano}%</span><span>Micro {tier_mix.micro}%</span><span>Macro {tier_mix.macro}%</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Section icon={<Target className="h-4 w-4 text-primary" />} title="Why this works">{rationale}</Section>
        <Section icon={<Users className="h-4 w-4 text-primary" />} title="Target audience">{target_audience}</Section>
      </div>

      {content_ideas.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/50">
            <Lightbulb className="h-4 w-4 text-primary" /> Content ideas
          </p>
          <div className="flex flex-wrap gap-2">
            {content_ideas.map((idea, i) => (
              <span key={i} className="rounded-full bg-secondary/40 px-3 py-1 text-xs font-medium text-foreground/70">{idea}</span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/50 p-4">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-foreground/70">{icon} {title}</p>
      <p className="text-sm text-foreground/70">{children}</p>
    </div>
  )
}
