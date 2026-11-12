import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

let search = ''
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(search) }))
vi.mock('@/components/AuthGate', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-gate">{children}</div>,
}))
vi.mock('@/components/Header', () => ({ default: () => <div /> }))
vi.mock('@/components/Footer', () => ({ default: () => <div /> }))

import StrategistPage from '@/app/strategist/page'

describe('AI Strategist page', () => {
  beforeEach(() => {
    search = ''
  })

  it('renders the brief textarea and the submit button', () => {
    render(<StrategistPage />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get ai recommendations/i })).toBeInTheDocument()
    expect(screen.getByTestId('auth-gate')).toBeInTheDocument()
    expect(screen.queryByText(/ai recommendation$/i)).toBeNull()
  })

  it('renders the canned advisory and creators with ?preview=1, without auth or a fetch', () => {
    search = 'preview=1'
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    render(<StrategistPage />)
    expect(screen.queryByTestId('auth-gate')).toBeNull()
    expect(screen.getByText(/ai recommendation$/i)).toBeInTheDocument()
    expect(screen.getByText(/protein brand/i)).toBeInTheDocument()
    expect(screen.getByText('Nano 55%')).toBeInTheDocument()
    expect(screen.getAllByText('Quote range')).toHaveLength(6)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
