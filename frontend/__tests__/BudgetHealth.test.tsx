import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BudgetHealth from '@/components/BudgetHealth'

describe('BudgetHealth', () => {
  it('renders each flag with its severity colour', () => {
    render(
      <BudgetHealth
        flags={[
          { severity: 'info', code: 'unspent', message: '12% of budget unspent' },
          { severity: 'warn', code: 'tier_concentration', message: '62% of spend in macro' },
          { severity: 'critical', code: 'single_creator', message: 'One creator takes 40% of spend' },
        ]}
      />,
    )
    expect(screen.getByText('12% of budget unspent').closest('li')).toHaveClass('bg-blue-50')
    expect(screen.getByText('62% of spend in macro').closest('li')).toHaveClass('bg-amber-50')
    expect(screen.getByText('One creator takes 40% of spend').closest('li')).toHaveClass('bg-red-50')
  })

  it('renders nothing for an empty or missing flag list', () => {
    const { container, rerender } = render(<BudgetHealth flags={[]} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<BudgetHealth />)
    expect(container).toBeEmptyDOMElement()
  })
})
