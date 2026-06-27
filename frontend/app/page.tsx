'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Store, ArrowRight, Sparkles, Wallet, MapPin, BarChart3 } from 'lucide-react'
import Footer from '@/components/Footer'

// Inline Instagram glyph with the brand gradient (avoids icon-set drift).
function InstagramGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#feda75" />
          <stop offset="35%" stopColor="#fa7e1e" />
          <stop offset="65%" stopColor="#d62976" />
          <stop offset="100%" stopColor="#962fbf" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="17" cy="7" r="1.2" fill="#fff" />
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
          nano, micro &amp; macro creators across India — and exhaust every rupee
          for maximum reach.
        </motion.p>

        {/* Brand ↔ Instagram handshake animation */}
        <HandshakeAnimation />

        <motion.div
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
        </motion.div>

        {/* Feature row */}
        <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: Wallet, title: 'Budget-first', body: 'Set a budget; we allocate spend across tiers to exhaust it optimally.' },
            { icon: MapPin, title: 'India-focused', body: 'Indian creators, with an optional city filter for local campaigns.' },
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

      {/* Handshake — pops in once both sides arrive, then breathes */}
      <motion.div
        className="z-10 select-none text-5xl sm:text-6xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.25, 1], opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.95, ease: 'backOut' }}
      >
        <motion.span
          className="inline-block"
          animate={{ scale: [1, 1.12, 1], rotate: [0, -6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 1.6, ease: 'easeInOut' }}
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
