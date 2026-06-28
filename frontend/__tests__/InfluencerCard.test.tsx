import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import InfluencerCard from '@/components/InfluencerCard'
import type { Influencer } from '@/lib/types'

const base: Influencer = {
  id: 'x1',
  handle: 'realcreator',
  avatar_url: 'http://x/a.jpg',
  followers: 54000,
  avg_views: 20000,
  engagement_rate: 0.04,
  cost_min: 1000,
  cost_max: 2000,
  niche: 'fashion',
  city: 'Mumbai',
}

describe('InfluencerCard', () => {
  it('links a VERIFIED creator to its Instagram profile and shows the city', () => {
    render(<InfluencerCard influencer={{ ...base, verified: true }} isSelected={false} />)
    const link = screen.getByRole('link', { name: /open .* on instagram/i })
    expect(link).toHaveAttribute('href', 'https://instagram.com/realcreator')
    expect(link).toHaveAttribute('target', '_blank')
    expect(screen.getByText('Mumbai')).toBeInTheDocument()
  })

  it('does NOT link an unverified creator and marks it as Sample', () => {
    render(<InfluencerCard influencer={{ ...base, verified: false }} isSelected={false} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText(/sample/i)).toBeInTheDocument()
  })
})
