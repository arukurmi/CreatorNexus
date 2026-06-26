'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from './AuthProvider'

// Protects the dashboard. When Supabase is configured and there's no session,
// redirect to /login. When Supabase isn't configured, stay open (demo mode).
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (configured && !loading && !user) {
      router.replace('/login')
    }
  }, [configured, loading, user, router])

  if (configured && (loading || !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
