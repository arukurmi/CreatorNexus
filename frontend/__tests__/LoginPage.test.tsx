import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthApiError } from '@supabase/supabase-js'

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }))
vi.mock('@/components/AuthProvider', () => ({ useAuth: () => ({ user: null, loading: false }) }))

const auth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
}
let supabase: { auth: typeof auth } | null = null
vi.mock('@/lib/supabase/client', () => ({ getSupabase: () => supabase, isSupabaseConfigured: true }))

import LoginPage from '@/app/login/page'

function fillAndSubmit(fields: { email?: string; password?: string }) {
  if (fields.email !== undefined) fireEvent.change(screen.getByLabelText('Email'), { target: { value: fields.email } })
  if (fields.password !== undefined) fireEvent.change(screen.getByLabelText('Password'), { target: { value: fields.password } })
  fireEvent.submit(screen.getByLabelText('Email').closest('form')!)
}

describe('Login page', () => {
  beforeEach(() => {
    supabase = null
    Object.values(auth).forEach((fn) => fn.mockReset())
  })

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

  it('rejects a 7-character password on sign-up', () => {
    supabase = { auth }
    render(<LoginPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }))
    fillAndSubmit({ email: 'a@brand.com', password: '1234567' })
    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it('lets sign-in try a 7-character password', async () => {
    supabase = { auth }
    auth.signInWithPassword.mockResolvedValue({ error: new AuthApiError('Invalid login credentials', 400, 'invalid_credentials') })
    render(<LoginPage />)
    fillAndSubmit({ email: 'a@brand.com', password: '1234567' })
    expect(await screen.findByText(/email and password don't match/i)).toBeInTheDocument()
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@brand.com', password: '1234567' })
    expect(screen.queryByText(/at least 8 characters/i)).toBeNull()
    expect(screen.queryByText('Invalid login credentials')).toBeNull()
  })

  it('sends a reset link to /reset-password from forgot mode and shows a generic notice', async () => {
    supabase = { auth }
    auth.resetPasswordForEmail.mockResolvedValue({ error: null })
    render(<LoginPage />)
    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }))
    expect(screen.queryByLabelText('Password')).toBeNull()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
    fillAndSubmit({ email: 'a@brand.com' })
    expect(await screen.findByText(/if an account exists for that email/i)).toBeInTheDocument()
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('a@brand.com', {
      redirectTo: expect.stringMatching(/\/reset-password$/),
    })
  })

  it('returns from forgot mode to sign in', () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }))
    fireEvent.click(screen.getByRole('button', { name: /back to sign in/i }))
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })
})
