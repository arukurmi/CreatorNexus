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
    const select = screen.getByRole('combobox', { name: /city/i })
    fireEvent.change(select, { target: { value: 'Mumbai' } })
    expect(props.onCityChange).toHaveBeenCalledWith('Mumbai')
  })

  it('switches strategy when a tab is clicked', () => {
    const props = setup()
    fireEvent.click(screen.getByRole('button', { name: /max engagement/i }))
    expect(props.onStrategyChange).toHaveBeenCalledWith('engagement')
  })

  it('labels the budget slider and city select', () => {
    setup()
    expect(screen.getByLabelText(/total budget/i)).toHaveAttribute('type', 'range')
    expect(screen.getByLabelText(/city/i).tagName).toBe('SELECT')
  })

  it('marks the active strategy as pressed', () => {
    setup({ strategy: 'value' })
    expect(screen.getByRole('button', { name: /best value/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /max reach/i })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('BudgetControls niche combobox', () => {
  const niche = () => screen.getByRole('combobox', { name: /content niche/i })

  it('opens on ArrowDown with the current niche active', () => {
    setup()
    expect(niche()).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(niche(), { key: 'ArrowDown' })
    expect(niche()).toHaveAttribute('aria-expanded', 'true')
    const active = document.getElementById(niche().getAttribute('aria-activedescendant')!)
    expect(active).toHaveTextContent(/pet parents/i)
    expect(active).toHaveAttribute('aria-selected', 'true')
  })

  it('moves the active option with ArrowDown and End', () => {
    setup()
    fireEvent.keyDown(niche(), { key: 'ArrowDown' })
    fireEvent.keyDown(niche(), { key: 'ArrowDown' })
    expect(document.getElementById(niche().getAttribute('aria-activedescendant')!)).toHaveTextContent(/fashion/i)
    fireEvent.keyDown(niche(), { key: 'End' })
    expect(document.getElementById(niche().getAttribute('aria-activedescendant')!)).toHaveTextContent(/comedy/i)
  })

  it('selects the active option on Enter and closes', () => {
    const props = setup()
    fireEvent.keyDown(niche(), { key: 'ArrowDown' })
    fireEvent.keyDown(niche(), { key: 'ArrowDown' })
    fireEvent.keyDown(niche(), { key: 'Enter' })
    expect(props.onNicheChange).toHaveBeenCalledWith('fashion')
    expect(niche()).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes on Escape without changing the niche', () => {
    const props = setup()
    fireEvent.keyDown(niche(), { key: 'ArrowDown' })
    fireEvent.keyDown(niche(), { key: 'ArrowDown' })
    fireEvent.keyDown(niche(), { key: 'Escape' })
    expect(niche()).toHaveAttribute('aria-expanded', 'false')
    expect(props.onNicheChange).not.toHaveBeenCalled()
  })

  it('selects an option on click', () => {
    const props = setup()
    fireEvent.click(niche())
    fireEvent.click(screen.getByRole('option', { name: /travel/i }))
    expect(props.onNicheChange).toHaveBeenCalledWith('travel')
  })
})
