'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { useAuth } from './AuthProvider'

function ProductNav() {
  const pathname = usePathname()
  const items = [
    { href: '/dashboard', label: 'Budget Studio' },
    { href: '/strategist', label: 'AI Strategist ✨' },
  ]
  return (
    <nav className="hidden items-center gap-1 rounded-full bg-muted p-1 sm:flex">
      {items.map((it) => {
        const active = pathname === it.href
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              active ? 'bg-white text-primary shadow-sm' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default function Header() {
  const { user, configured, signOut } = useAuth()

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
              Right creators for your budget
            </span>
          </div>
        </motion.div>

        {/* Product switcher */}
        <ProductNav />

        {/* Right side */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          {configured && user ? (
            <>
              <span className="hidden max-w-[40vw] truncate text-xs font-medium text-foreground/60 sm:inline-block sm:align-middle md:max-w-[220px]">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground/70 ring-1 ring-border transition hover:bg-white hover:text-primary"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </>
          ) : (
            <span className="rounded-full bg-secondary/60 px-4 py-1.5 text-xs font-semibold text-foreground/70 ring-1 ring-secondary">
              MVP Demo
            </span>
          )}
        </motion.div>
      </div>
    </header>
  )
}
