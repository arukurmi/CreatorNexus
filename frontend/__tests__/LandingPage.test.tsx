import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// next/link → plain anchor for assertions.
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

import LandingPage from '@/app/page'

describe('Landing page', () => {
  it('renders the hero headline and CTA', () => {
    render(<LandingPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/start connecting with the right influencers/i)
  })

  it('links Get Started / CTA to /dashboard and Sign In to /login', () => {
    render(<LandingPage />)
    const dashboardLinks = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href') === '/dashboard')
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(2) // nav + hero CTA
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
  })

  it('does not mention India (creators-focused wording)', () => {
    render(<LandingPage />)
    expect(screen.queryByText(/india-focused/i)).toBeNull()
    expect(screen.getByText(/creators-focused/i)).toBeInTheDocument()
  })
})
