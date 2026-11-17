import Link from 'next/link'
import BrandCard from '@/components/BrandCard'

export default function NotFound() {
  return (
    <BrandCard>
      <h1 className="text-2xl font-extrabold text-foreground">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="shadow-soft flex-1 rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90"
        >
          Go home
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 rounded-xl border border-border bg-white/60 py-2.5 text-center text-sm font-semibold text-foreground/80 transition hover:border-primary/40 hover:text-primary"
        >
          Open dashboard
        </Link>
      </div>
    </BrandCard>
  )
}
