import { ChevronDown } from 'lucide-react'

export default function WhySplit({ rationale }: { rationale?: string[] }) {
  if (!rationale?.length) return null
  return (
    <details className="group mb-6 rounded-xl border border-border/50 bg-white/70 px-5 py-3">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-foreground/80">
        Why this split?
        <ChevronDown className="h-4 w-4 text-foreground/50 transition group-open:rotate-180" />
      </summary>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-foreground/70">
        {rationale.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </details>
  )
}
