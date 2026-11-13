import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

let search = ''
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(search) }))
vi.mock('@/components/AuthGate', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-gate">{children}</div>,
}))
vi.mock('@/components/Header', () => ({ default: () => <div /> }))
vi.mock('@/components/Footer', () => ({ default: () => <div /> }))
vi.mock('@/lib/supabase/client', () => ({
  getSupabase: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'tok' } } }) } }),
}))
const getAiStrategy = vi.fn()
vi.mock('@/lib/aiApi', () => ({ getAiStrategy: (...args: unknown[]) => getAiStrategy(...args) }))

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

  it('explains the hourly AI limit when the backend answers 429', async () => {
    getAiStrategy.mockRejectedValueOnce(Object.assign(new Error('ai strategy failed: 429'), { status: 429 }))
    render(<StrategistPage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Launch a protein bar for gym-goers' } })
    fireEvent.click(screen.getByRole('button', { name: /get ai recommendations/i }))
    expect(await screen.findByText(/AI request limit \(10 per hour\)/)).toBeInTheDocument()
  })
})
