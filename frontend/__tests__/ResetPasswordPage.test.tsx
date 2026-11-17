import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const replace = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }))

const session = { user: null as unknown, loading: false }
vi.mock('@/components/AuthProvider', () => ({ useAuth: () => session }))

const updateUser = vi.fn()
vi.mock('@/lib/supabase/client', () => ({ getSupabase: () => ({ auth: { updateUser } }) }))

import ResetPasswordPage from '@/app/reset-password/page'

function submitPasswords(password: string, confirmation: string) {
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: password } })
  fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: confirmation } })
  fireEvent.submit(screen.getByLabelText('New password').closest('form')!)
}

describe('Reset password page', () => {
  beforeEach(() => {
    replace.mockClear()
    updateUser.mockReset()
    session.user = { id: 'u1' }
    session.loading = false
  })

  it('shows a spinner while the session loads', () => {
    session.loading = true
    render(<ResetPasswordPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('explains an invalid or expired link when nobody is signed in', () => {
    session.user = null
    render(<ResetPasswordPage />)
    expect(screen.getByRole('heading', { name: /invalid or has expired/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to sign in/i })).toHaveAttribute('href', '/login')
    expect(replace).not.toHaveBeenCalled()
  })

  it('rejects passwords that do not match', () => {
    render(<ResetPasswordPage />)
    submitPasswords('longenough1', 'longenough2')
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('rejects a password shorter than 8 characters', () => {
    render(<ResetPasswordPage />)
    submitPasswords('short', 'short')
    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('updates the password and goes to the dashboard', async () => {
    updateUser.mockResolvedValue({ error: null })
    render(<ResetPasswordPage />)
    submitPasswords('longenough1', 'longenough1')
    expect(await screen.findByText(/password updated/i)).toBeInTheDocument()
    expect(updateUser).toHaveBeenCalledWith({ password: 'longenough1' })
    expect(replace).toHaveBeenCalledWith('/dashboard')
  })

  it('shows a friendly message when Supabase rejects the new password', async () => {
    updateUser.mockResolvedValue({ error: { message: 'raw', code: 'same_password', status: 422 } })
    render(<ResetPasswordPage />)
    submitPasswords('longenough1', 'longenough1')
    expect(await screen.findByText(/different from your current one/i)).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })
})
