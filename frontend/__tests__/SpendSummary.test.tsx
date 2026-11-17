import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SpendSummary from '@/components/SpendSummary'

const byTier = {
  nano: { count: 4, spend: 12_000 },
  micro: { count: 0, spend: 0 },
  macro: { count: 1, spend: 38_000 },
}

describe('SpendSummary', () => {
  it('pairs each summary tile label with its value', () => {
    const { container } = render(<SpendSummary budget={50_000} spend={50_000} leftover={0} byTier={byTier} />)
    const pairs = [...container.querySelectorAll('dt')].map((dt) => [dt.textContent, dt.nextElementSibling?.textContent])
    expect(pairs).toEqual([
      ['Budget', '₹50,000'],
      ['Projected spend', '₹50,000'],
      ['Leftover', '₹0'],
      ['Budget used', '100%'],
    ])
  })

  it('shows budget used above 100% when spend exceeds the budget', () => {
    render(<SpendSummary budget={40_000} spend={44_000} leftover={0} byTier={byTier} />)
    expect(screen.getByText('110%')).toBeInTheDocument()
  })

  it('describes every tier in the bar label, including zero-spend tiers', () => {
    render(<SpendSummary budget={50_000} spend={50_000} leftover={0} byTier={byTier} />)
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Spend by tier: Nano ₹12,000 (24%), Micro ₹0 (0%), Macro ₹38,000 (76%)',
    )
  })

  it('draws a segment only for tiers with spend', () => {
    render(<SpendSummary budget={50_000} spend={50_000} leftover={0} byTier={byTier} />)
    const widths = [...screen.getByRole('img').children].map((el) => (el as HTMLElement).style.width)
    expect(widths).toEqual(['24%', '76%'])
  })

  it('lists count, rupee spend and percent for every tier in the legend', () => {
    render(<SpendSummary budget={50_000} spend={50_000} leftover={0} byTier={byTier} />)
    expect(screen.getByText('4 creators · ₹12,000 · 24%')).toBeInTheDocument()
    expect(screen.getByText('0 creators · ₹0 · 0%')).toBeInTheDocument()
    expect(screen.getByText('1 creator · ₹38,000 · 76%')).toBeInTheDocument()
  })
})
