'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Store, ArrowRight, Sparkles, Wallet, MapPin, BarChart3 } from 'lucide-react'
import Footer from '@/components/Footer'

// Inline Instagram glyph with the authentic corner-to-corner brand gradient.
function InstagramGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="igGrad" cx="28%" cy="105%" r="135%">
          <stop offset="0%" stopColor="#ffd676" />
          <stop offset="22%" stopColor="#f7a01f" />
          <stop offset="42%" stopColor="#f33d4f" />
          <stop offset="62%" stopColor="#d6249f" />
          <stop offset="100%" stopColor="#3b5fe2" />
        </radialGradient>
      </defs>
      {/* gradient tile */}
      <rect x="1" y="1" width="22" height="22" rx="7" fill="url(#igGrad)" />
      {/* camera body */}
      <rect x="5" y="5" width="14" height="14" rx="4.4" fill="none" stroke="#fff" strokeWidth="1.7" />
      {/* lens */}
      <circle cx="12" cy="12" r="3.6" fill="none" stroke="#fff" strokeWidth="1.7" />
      {/* flash dot */}
      <circle cx="16.6" cy="7.4" r="1.15" fill="#fff" />
    </svg>
  )
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="shadow-soft flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
            🐐
          </span>
          <span className="text-lg font-bold text-foreground">Creator Nexus</span>
        </div>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/login"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground/70 transition hover:text-foreground"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="shadow-soft flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 pt-10 text-center sm:px-6 lg:pt-16">
        <motion.span
          className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-secondary/40 px-3 py-1 text-xs font-semibold text-foreground/70 ring-1 ring-border/50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Influencer budgets, allocated intelligently
        </motion.span>

        <motion.h1
          className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          Start connecting with the{' '}
          <span className="bg-gradient-to-r from-primary to-[#e8956d] bg-clip-text text-transparent">
            right influencers
          </span>{' '}
          now
        </motion.h1>

        <motion.p
          className="mt-4 max-w-xl text-base text-foreground/60 sm:text-lg"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          Tell us your budget and niche. We match your D2C brand with the best
          nano, micro &amp; macro creators — and exhaust every rupee for maximum
          reach.
        </motion.p>

        {/* Brand ↔ Instagram handshake animation */}
        <HandshakeAnimation />

        <motion.div
          className="flex flex-col items-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          <Link
            href="/dashboard"
            className="shadow-soft inline-flex items-center gap-2 rounded-2xl bg-primary px-7 py-3.5 text-base font-bold text-white transition hover:opacity-90"
          >
            Start connecting with the right influencers now
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/strategist"
            className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 px-6 py-3.5 text-base font-bold text-primary transition hover:bg-primary/5"
          >
            Try the AI Strategist ✨
          </Link>
        </motion.div>

        {/* Feature row */}
        <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: Wallet, title: 'Budget-first', body: 'Set a budget; we allocate spend across tiers to exhaust it optimally.' },
            { icon: MapPin, title: 'Creators-focused', body: 'Nano to macro creators, with an optional city / local filter.' },
            { icon: BarChart3, title: 'Real metrics', body: 'Reach, engagement and a quote range computed for every creator.' },
          ].map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              className="rounded-2xl bg-white/60 p-5 text-left ring-1 ring-border/50 backdrop-blur-sm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.2 + i * 0.1 }}
            >
              <Icon className="mb-2 h-5 w-5 text-primary" />
              <p className="font-bold text-foreground">{title}</p>
              <p className="mt-1 text-sm text-foreground/55">{body}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}

function HandshakeAnimation() {
  return (
    <div className="relative my-12 flex h-44 w-full max-w-2xl items-center justify-center">
      {/* D2C Brand — slides in from the left toward center */}
      <motion.div
        className="absolute left-2 flex flex-col items-center gap-2 sm:left-10"
        initial={{ x: -120, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
      >
        <div className="shadow-card flex h-20 w-20 items-center justify-center rounded-3xl bg-white ring-1 ring-border/60 sm:h-24 sm:w-24">
          <Store className="h-9 w-9 text-primary sm:h-11 sm:w-11" />
        </div>
        <span className="text-sm font-bold text-foreground">D2C Brand</span>
      </motion.div>

      {/* Handshake — pops in once both sides arrive; grows ~3x on hover */}
      <motion.div
        className="z-20 cursor-pointer select-none text-5xl drop-shadow-sm sm:text-6xl"
        title="The perfect match"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.95, ease: 'backOut' }}
        whileHover={{ scale: 3, transition: { type: 'spring', stiffness: 180, damping: 14 } }}
        whileTap={{ scale: 2.6 }}
      >
        <motion.span
          className="inline-block"
          animate={{ rotate: [0, -8, 0], y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.6, ease: 'easeInOut' }}
        >
          🤝
        </motion.span>
      </motion.div>

      {/* Instagram — slides in from the right toward center */}
      <motion.div
        className="absolute right-2 flex flex-col items-center gap-2 sm:right-10"
        initial={{ x: 120, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
      >
        <div className="shadow-card flex h-20 w-20 items-center justify-center rounded-3xl bg-white p-3 ring-1 ring-border/60 sm:h-24 sm:w-24">
          <InstagramGlyph className="h-full w-full" />
        </div>
        <span className="text-sm font-bold text-foreground">Instagram Creators</span>
      </motion.div>

      {/* connecting dashes that fade in under the handshake */}
      <motion.div
        className="absolute top-[42%] h-0.5 w-1/2 -translate-y-1/2 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      />
    </div>
  )
}
