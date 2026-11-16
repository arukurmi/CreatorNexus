import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }))
vi.mock('@/components/AuthProvider', () => ({ useAuth: () => ({ user: null, configured: false, signOut: vi.fn() }) }))
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))

import Header from '@/components/Header'

const desktopNav = () => screen.getByRole('navigation', { name: 'Products' })

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
