'use client'

import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import BrandCard from '@/components/BrandCard'

export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <BrandCard>
      <h1 className="text-2xl font-extrabold text-foreground">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        An unexpected error stopped this page from loading. Try again, or head back home.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="shadow-soft flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <RefreshCw aria-hidden className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/"
          className="flex-1 rounded-xl border border-border bg-white/60 py-2.5 text-center text-sm font-semibold text-foreground/80 transition hover:border-primary/40 hover:text-primary"
        >
          Go home
        </Link>
      </div>
    </BrandCard>
  )
}
