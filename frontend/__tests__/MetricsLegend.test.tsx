import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MetricsLegend from '@/components/MetricsLegend'

describe('MetricsLegend', () => {
  it('explains all three creator metric badges', () => {
    render(<MetricsLegend />)
    expect(screen.getByText(/what the badges mean/i)).toBeInTheDocument()
    expect(screen.getByText('Followers')).toBeInTheDocument()
    expect(screen.getByText('Avg. Views')).toBeInTheDocument()
    expect(screen.getByText('Engagement')).toBeInTheDocument()
    expect(screen.getByText(/nano \/ micro \/ macro tier/i)).toBeInTheDocument()
    expect(screen.getByText(/Likes \+ comments/i)).toBeInTheDocument()
  })
})
