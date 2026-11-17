import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { saveFilters } from '@/lib/savedFilters'

vi.mock('@/components/AuthGate', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
vi.mock('@/components/Header', () => ({ default: () => <div /> }))
vi.mock('@/components/Footer', () => ({ default: () => <div /> }))
vi.mock('@/lib/supabase/client', () => ({
  getSupabase: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'tok' } } }) } }),
}))
const allocateViaApi = vi.fn()
vi.mock('@/lib/api', () => ({ allocateViaApi: (...args: unknown[]) => allocateViaApi(...args) }))

import DashboardPage from '@/app/dashboard/page'

const result = {
  selected: [],
  total_projected_spend: 45_000,
  leftover_budget: 5_000,
  effective_budget: 50_000,
  budget_buffer_applied: false,
  by_tier: { nano: { count: 0, spend: 0 }, micro: { count: 3, spend: 45_000 }, macro: { count: 0, spend: 0 } },
  creators_considered: 10,
  health: [],
  rationale: [],
}

describe('Dashboard page', () => {
  beforeEach(() => {
    localStorage.clear()
    allocateViaApi.mockReset().mockResolvedValue(result)
  })

  it('shows the how-it-works explainer on first visit without calling the API', async () => {
    render(<DashboardPage />)
    expect(screen.getByRole('heading', { name: 'How it works' })).toBeInTheDocument()
    expect(screen.queryByText('Allocating creators…')).toBeNull()
    await Promise.resolve()
    expect(allocateViaApi).not.toHaveBeenCalled()
  })

  it('runs the first allocation with the default filters and remembers them', async () => {
    render(<DashboardPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Run my first allocation' }))
    expect(screen.queryByRole('heading', { name: 'How it works' })).toBeNull()
    await waitFor(() => expect(allocateViaApi).toHaveBeenCalledOnce())
    expect(allocateViaApi.mock.calls[0][0]).toEqual({ budget: 50_000, niche: 'pets', strategy: 'reach', count: undefined, city: undefined })
    expect(JSON.parse(localStorage.getItem('creator-nexus:last-filters')!)).toMatchObject({ budget: 50_000, niche: 'pets' })
    expect(await screen.findByText('Projected spend')).toBeInTheDocument()
  })

  it('auto-runs with saved filters for a returning visitor and skips the explainer', async () => {
    saveFilters({ budget: 80_000, niche: 'food', strategy: 'value', count: 5, city: 'Pune' })
    render(<DashboardPage />)
    expect(screen.queryByRole('heading', { name: 'How it works' })).toBeNull()
    await waitFor(() => expect(allocateViaApi).toHaveBeenCalledOnce())
    expect(allocateViaApi.mock.calls[0][0]).toEqual({ budget: 80_000, niche: 'food', strategy: 'value', count: undefined, city: 'Pune' })
  })
})
