import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import WhySplit from '@/components/WhySplit'

describe('WhySplit', () => {
  it('lists every rationale line under a collapsed "Why this split?" summary', () => {
    const { container } = render(
      <WhySplit rationale={['Nano gets 45%: best CPE in this niche', 'Skipped macro: cheapest rate exceeds budget']} />,
    )
    expect(screen.getByText('Why this split?')).toBeInTheDocument()
    expect(container.querySelector('details')).not.toHaveAttribute('open')
    expect(screen.getByText('Nano gets 45%: best CPE in this niche')).toBeInTheDocument()
    expect(screen.getByText('Skipped macro: cheapest rate exceeds budget')).toBeInTheDocument()
  })

  it('renders nothing for an empty or missing rationale', () => {
    const { container, rerender } = render(<WhySplit rationale={[]} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<WhySplit />)
    expect(container).toBeEmptyDOMElement()
  })
})
