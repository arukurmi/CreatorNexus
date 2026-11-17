import { TIER_META, tierSpendRows, type TierStat } from '@/lib/tier'
import { formatINR } from '@/lib/format'
import type { Tier } from '@/lib/types'

interface Props {
  budget: number
  spend: number
  leftover: number
  byTier: Record<Tier, TierStat>
}

export default function SpendSummary({ budget, spend, leftover, byTier }: Props) {
  const rows = tierSpendRows(byTier)
  const tiles = [
    ['Budget', formatINR(budget)],
    ['Projected spend', formatINR(spend)],
    ['Leftover', formatINR(leftover)],
    ['Budget used', `${Math.round((spend / budget) * 100)}%`],
  ]
  const barLabel = `Spend by tier: ${rows
    .map((row) => `${TIER_META[row.tier].label} ${formatINR(row.spend)} (${row.percent}%)`)
    .join(', ')}`

  return (
    <section className="rounded-xl border border-border/50 bg-white/70 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Spend summary</p>
      <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-lg font-bold text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      <div role="img" aria-label={barLabel} className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted">
        {rows
          .filter((row) => row.spend > 0)
          .map((row) => (
            <div key={row.tier} className={TIER_META[row.tier].bar} style={{ width: `${row.percent}%` }} />
          ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {rows.map((row) => (
          <li key={row.tier} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-sm ${TIER_META[row.tier].bar}`} />
            <span className="font-medium text-foreground/80">{TIER_META[row.tier].label}</span>
            <span className="text-muted-foreground">
              {row.count} creator{row.count !== 1 ? 's' : ''} · {formatINR(row.spend)} · {row.percent}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
