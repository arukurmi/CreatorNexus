import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }))
vi.mock('@/components/AuthProvider', () => ({ useAuth: () => ({ user: null, loading: false }) }))
vi.mock('@/lib/supabase/client', () => ({ getSupabase: () => null, isSupabaseConfigured: true }))

import LoginPage from '@/app/login/page'

describe('Login page', () => {
  it('labels the email and password inputs', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })

  it('toggles password visibility with the show-password button', () => {
    render(<LoginPage />)
    const toggle = screen.getByRole('button', { name: 'Show password' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(toggle)
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(toggle)
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })
})
