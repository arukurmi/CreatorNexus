import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div role="status" className="flex min-h-screen items-center justify-center">
      <Loader2 aria-hidden className="h-6 w-6 animate-spin text-primary" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
