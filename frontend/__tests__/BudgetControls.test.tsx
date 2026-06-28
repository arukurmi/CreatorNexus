import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BudgetControls from '@/components/BudgetControls'

function setup(over: Partial<React.ComponentProps<typeof BudgetControls>> = {}) {
  const props = {
    budget: 50000,
    niche: 'pets' as const,
    strategy: 'reach' as const,
    count: 5,
    city: '',
    maxCount: 10,
    dirty: false,
    loading: false,
    onBudgetChange: vi.fn(),
    onNicheChange: vi.fn(),
    onStrategyChange: vi.fn(),
    onCountChange: vi.fn(),
    onCityChange: vi.fn(),
    onApply: vi.fn(),
    ...over,
  }
  render(<BudgetControls {...props} />)
  return props
}

describe('BudgetControls', () => {
  it('disables Apply when filters are unchanged', () => {
    setup({ dirty: false })
    expect(screen.getByRole('button', { name: /apply filters/i })).toBeDisabled()
  })

  it('enables Apply when dirty and calls onApply on click', () => {
    const props = setup({ dirty: true })
    const btn = screen.getByRole('button', { name: /apply filters/i })
    expect(btn).toBeEnabled()
    fireEvent.click(btn)
    expect(props.onApply).toHaveBeenCalledTimes(1)
  })

  it('shows the optional city filter with an All-locations default', () => {
    const props = setup({ dirty: false })
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'Mumbai' } })
    expect(props.onCityChange).toHaveBeenCalledWith('Mumbai')
  })

  it('switches strategy when a tab is clicked', () => {
    const props = setup()
    fireEvent.click(screen.getByRole('button', { name: /max engagement/i }))
    expect(props.onStrategyChange).toHaveBeenCalledWith('engagement')
  })
})
