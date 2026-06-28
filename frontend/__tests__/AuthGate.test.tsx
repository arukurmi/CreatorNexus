import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const replace = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }))

const auth = { user: null as unknown, loading: false, configured: false }
vi.mock('@/components/AuthProvider', () => ({ useAuth: () => auth }))

import AuthGate from '@/components/AuthGate'

describe('AuthGate', () => {
  beforeEach(() => {
    replace.mockClear()
    auth.user = null
    auth.loading = false
    auth.configured = false
  })

  it('redirects to /login when Supabase is configured and there is no user', () => {
    auth.configured = true
    auth.user = null
    render(<AuthGate><div>secret</div></AuthGate>)
    expect(replace).toHaveBeenCalledWith('/login')
    expect(screen.queryByText('secret')).toBeNull()
  })

  it('renders children when a user is signed in', () => {
    auth.configured = true
    auth.user = { id: 'u1' }
    render(<AuthGate><div>secret</div></AuthGate>)
    expect(replace).not.toHaveBeenCalled()
    expect(screen.getByText('secret')).toBeInTheDocument()
  })

  it('renders children in demo mode (Supabase not configured)', () => {
    auth.configured = false
    render(<AuthGate><div>secret</div></AuthGate>)
    expect(replace).not.toHaveBeenCalled()
    expect(screen.getByText('secret')).toBeInTheDocument()
  })
})
