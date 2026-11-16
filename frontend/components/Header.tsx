'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, Menu, X } from 'lucide-react'
import { useAuth } from './AuthProvider'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Budget Studio' },
  { href: '/strategist', label: 'AI Strategist ✨' },
]

function ProductNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Products" className="hidden items-center gap-1 rounded-full bg-muted p-1 sm:flex">
      {NAV_ITEMS.map((it) => {
        const active = pathname === it.href
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              active ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}

function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [lastPathname, setLastPathname] = useState(pathname)
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="ml-3 sm:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/70 ring-1 ring-border"
      >
        {open ? <X aria-hidden className="h-4 w-4" /> : <Menu aria-hidden className="h-4 w-4" />}
      </button>
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Products (mobile)"
          className="absolute inset-x-0 top-16 flex flex-col gap-1 border-b border-border/50 bg-background px-6 py-3"
        >
          {NAV_ITEMS.map((it) => {
            const active = pathname === it.href
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                  active ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {it.label}
              </Link>
            )
          })}
        </nav>
      )}
    </div>
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
            <span className="text-[10px] font-medium uppercase tracking-widest text-primary">
              Right creators for your budget
            </span>
          </div>
        </motion.div>

        {/* Product switcher */}
        <ProductNav />

        {/* Right side */}
        <motion.div
          className="flex items-center gap-3 max-sm:ml-auto"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          {configured && user ? (
            <>
              <span className="hidden max-w-[40vw] truncate text-xs font-medium text-muted-foreground sm:inline-block sm:align-middle md:max-w-[220px]">
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
        <MobileNav />
      </div>
    </header>
  )
}
