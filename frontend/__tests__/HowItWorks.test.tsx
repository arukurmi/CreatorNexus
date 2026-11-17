import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import HowItWorks from '@/components/HowItWorks'

describe('HowItWorks', () => {
  it('lists the three steps in order under a heading', () => {
    render(<HowItWorks onStart={() => {}} />)
    expect(screen.getByRole('heading', { name: 'How it works' })).toBeInTheDocument()
    const steps = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(steps.map((li) => li.textContent)).toEqual([
      expect.stringContaining('Set your budget and niche'),
      expect.stringContaining('Pick a strategy'),
      expect.stringContaining('Get your creator bucket'),
    ])
  })

  it('calls onStart when the button is clicked', () => {
    const onStart = vi.fn()
    render(<HowItWorks onStart={onStart} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run my first allocation' }))
    expect(onStart).toHaveBeenCalledOnce()
  })
})
