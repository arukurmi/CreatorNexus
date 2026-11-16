import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'

let pathname = '/dashboard'
vi.mock('next/navigation', () => ({ usePathname: () => pathname }))
vi.mock('@/components/AuthProvider', () => ({ useAuth: () => ({ user: null, configured: false, signOut: vi.fn() }) }))
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))

import Header from '@/components/Header'

beforeEach(() => {
  pathname = '/dashboard'
})

const desktopNav = () => screen.getByRole('navigation', { name: 'Products' })
const menuButton = () => screen.getByRole('button', { name: /menu/i })

describe('Header product switcher', () => {
  it('links to both products', () => {
    render(<Header />)
    expect(within(desktopNav()).getByRole('link', { name: /budget studio/i })).toHaveAttribute('href', '/dashboard')
    expect(within(desktopNav()).getByRole('link', { name: /ai strategist/i })).toHaveAttribute('href', '/strategist')
  })

  it('marks the current route link with aria-current', () => {
    render(<Header />)
    expect(within(desktopNav()).getByRole('link', { name: /budget studio/i })).toHaveAttribute('aria-current', 'page')
    expect(within(desktopNav()).getByRole('link', { name: /ai strategist/i })).not.toHaveAttribute('aria-current')
  })
})

describe('Header mobile menu', () => {
  it('toggles the mobile nav from the hamburger', () => {
    render(<Header />)
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('navigation', { name: /mobile/i })).not.toBeInTheDocument()

    fireEvent.click(menuButton())
    expect(menuButton()).toHaveAttribute('aria-expanded', 'true')
    expect(menuButton()).toHaveAccessibleName('Close menu')
    const mobile = screen.getByRole('navigation', { name: /mobile/i })
    expect(within(mobile).getByRole('link', { name: /ai strategist/i })).toHaveAttribute('href', '/strategist')
    expect(within(mobile).getByRole('link', { name: /budget studio/i })).toHaveAttribute('aria-current', 'page')

    fireEvent.click(menuButton())
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes on Escape', () => {
    render(<Header />)
    fireEvent.click(menuButton())
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes when a mobile link is clicked', () => {
    render(<Header />)
    fireEvent.click(menuButton())
    fireEvent.click(within(screen.getByRole('navigation', { name: /mobile/i })).getByRole('link', { name: /ai strategist/i }))
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes when the route changes', () => {
    const { rerender } = render(<Header />)
    fireEvent.click(menuButton())
    pathname = '/strategist'
    rerender(<Header />)
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false')
  })
})
