import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '@/components/Footer'

describe('Footer', () => {
  it('shows copyright (left), made-with-love (center), contact developer (right)', () => {
    render(<Footer />)
    const year = new Date().getFullYear()
    expect(screen.getByText(new RegExp(`© ${year} Creator Nexus`))).toBeInTheDocument()
    expect(screen.getByText(/in Bengaluru/i)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /contact the developer/i })
    expect(link).toHaveAttribute('href', 'https://arukurmi.vercel.app/#contact')
  })
})
