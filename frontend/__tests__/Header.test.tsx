import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }))
vi.mock('@/components/AuthProvider', () => ({ useAuth: () => ({ user: null, configured: false, signOut: vi.fn() }) }))
vi.mock('next/link', () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }))

import Header from '@/components/Header'

describe('Header product switcher', () => {
  it('links to both products', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: /budget studio/i })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: /ai strategist/i })).toHaveAttribute('href', '/strategist')
  })
})
