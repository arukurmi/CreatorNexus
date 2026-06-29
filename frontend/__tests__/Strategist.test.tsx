import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/AuthGate', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
vi.mock('@/components/Header', () => ({ default: () => <div /> }))
vi.mock('@/components/Footer', () => ({ default: () => <div /> }))

import StrategistPage from '@/app/strategist/page'

describe('AI Strategist page', () => {
  it('renders the brief textarea and the submit button', () => {
    render(<StrategistPage />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get ai recommendations/i })).toBeInTheDocument()
  })
})
