import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorPage from '@/app/error'
import NotFound from '@/app/not-found'
import Loading from '@/app/loading'

describe('App error page', () => {
  it('hides the raw error message and retries on click', () => {
    const retry = vi.fn()
    render(<ErrorPage error={new Error('db password leaked in stack')} retry={retry} />)
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument()
    expect(screen.queryByText(/db password leaked/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(retry).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: /go home/i })).toHaveAttribute('href', '/')
  })
})

describe('App not-found page', () => {
  it('links home and to the dashboard', () => {
    render(<NotFound />)
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /go home/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /open dashboard/i })).toHaveAttribute('href', '/dashboard')
  })
})

describe('App loading state', () => {
  it('announces loading through a status region', () => {
    render(<Loading />)
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i)
  })
})
