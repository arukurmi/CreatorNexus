'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import BrandCard from '@/components/BrandCard'
import PasswordInput, { MIN_PASSWORD_LENGTH } from '@/components/PasswordInput'
import Loading from '@/app/loading'
import { friendlyAuthError } from '@/lib/authErrors'

/** Unlike /login, signed-in users stay here: the recovery link itself signs them in. */
export default function ResetPasswordPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirmation) {
      setError('Passwords do not match.')
      return
    }

    const supabase = getSupabase()
    if (!supabase) return

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setNotice('Password updated. Taking you to your dashboard…')
      router.replace('/dashboard')
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />

  if (!user) {
    return (
      <BrandCard>
        <h1 className="text-xl font-bold text-foreground">This reset link is invalid or has expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Request a new link from the sign-in page.
        </p>
        <Link
          href="/login"
          className="shadow-soft mt-6 block rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90"
        >
          Back to sign in
        </Link>
      </BrandCard>
    )
  }

  return (
    <BrandCard>
      <h1 className="mb-4 text-xl font-bold text-foreground">Choose a new password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold text-foreground/80">
            New password
          </label>
          <PasswordInput
            id="new-password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-semibold text-foreground/80">
            Confirm new password
          </label>
          <PasswordInput
            id="confirm-password"
            required
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </div>

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
          Update password
        </button>
      </form>
    </BrandCard>
  )
}
