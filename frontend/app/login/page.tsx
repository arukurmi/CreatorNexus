'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import BrandCard from '@/components/BrandCard'
import PasswordInput, { MIN_PASSWORD_LENGTH } from '@/components/PasswordInput'
import { friendlyAuthError } from '@/lib/authErrors'

type Mode = 'signin' | 'signup' | 'forgot'

const SUBMIT_LABEL: Record<Mode, string> = {
  signin: 'Sign In',
  signup: 'Create Account',
  forgot: 'Send reset link',
}

export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setNotice(null)
  }

  // Already signed in → go to dashboard
  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)

    const supabase = getSupabase()
    if (!supabase) {
      setError(
        'Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.'
      )
      return
    }

    if (mode === 'signup' && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setNotice("If an account exists for that email, we've sent a reset link.")
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setNotice(
          'Account created! Check your email to confirm, then sign in.'
        )
        setMode('signin')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.replace('/dashboard')
      }
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BrandCard>
      {/* Tabs */}
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(['signin', 'signup'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`rounded-lg py-2 text-sm font-semibold transition-all ${
              mode === m
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground/80'
            }`}
          >
            {m === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-700 ring-1 ring-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            Auth backend not configured. Add your Supabase URL + anon key to{' '}
            <code className="font-mono">.env.local</code> to enable real sign
            up / sign in.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-foreground/80">
            Email
          </label>
          <div className="relative">
            <Mail aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@brand.com"
              className="w-full rounded-xl border border-input bg-white/60 py-2.5 pl-10 pr-3 text-sm text-foreground transition focus:border-primary"
            />
          </div>
        </div>

        {mode === 'forgot' ? (
          <p className="text-xs text-muted-foreground">
            Enter your account email and we&apos;ll send you a link to choose a new password.
          </p>
        ) : (
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-foreground/80">
              Password
            </label>
            <PasswordInput
              id="password"
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="mt-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="flex items-start gap-1.5 text-xs text-rose-600">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
        {notice && (
          <p className="flex items-start gap-1.5 text-xs text-green-700">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="shadow-soft flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {SUBMIT_LABEL[mode]}
        </button>
        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Back to sign in
          </button>
        )}
      </form>
    </BrandCard>
  )
}
