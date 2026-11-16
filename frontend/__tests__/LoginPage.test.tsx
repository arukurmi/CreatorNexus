import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }))
vi.mock('@/components/AuthProvider', () => ({ useAuth: () => ({ user: null, loading: false }) }))
vi.mock('@/lib/supabase/client', () => ({ getSupabase: () => null, isSupabaseConfigured: true }))

import LoginPage from '@/app/login/page'

describe('Login page', () => {
  it('labels the email and password inputs', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')
  })
})
