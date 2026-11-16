import { Info, AlertTriangle, AlertCircle } from 'lucide-react'
import type { HealthFlag } from '@/lib/types'

const SEVERITY_STYLE: Record<HealthFlag['severity'], { icon: React.ReactNode; color: string }> = {
  info: { icon: <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />, color: 'border-blue-200 bg-blue-50 text-blue-700' },
  warn: { icon: <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />, color: 'border-amber-200 bg-amber-50 text-amber-800' },
  critical: { icon: <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />, color: 'border-red-200 bg-red-50 text-red-700' },
}

export default function BudgetHealth({ flags }: { flags?: HealthFlag[] }) {
  if (!flags?.length) return null
  return (
    <section className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Budget health</p>
      <ul className="space-y-2">
        {flags.map((flag, i) => (
          <li
            key={i}
            className={`flex items-start gap-2 rounded-xl border px-4 py-2.5 text-sm ${SEVERITY_STYLE[flag.severity].color}`}
          >
            {SEVERITY_STYLE[flag.severity].icon}
            <span>{flag.message}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
