import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import NotFound from '@/app/not-found'

describe('App not-found page', () => {
  it('links home and to the dashboard', () => {
    render(<NotFound />)
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /go home/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /open dashboard/i })).toHaveAttribute('href', '/dashboard')
  })
})
