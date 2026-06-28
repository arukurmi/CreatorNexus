import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BucketGrid from '@/components/BucketGrid'
import type { Influencer, BucketResult } from '@/lib/types'

// 14 nano creators so pagination (10/page) kicks in.
const nano: Influencer[] = Array.from({ length: 14 }, (_, i) => ({
  id: `n${i}`,
  handle: `nano${i}`,
  avatar_url: '',
  followers: 2000 + i * 100,
  avg_views: 1000,
  engagement_rate: 0.05,
  cost_min: 600,
  cost_max: 900,
  niche: 'pets',
  verified: false,
}))

const result: BucketResult = {
  selected_influencers: nano.slice(0, 3),
  total_projected_spend: 2250,
  leftover_budget: 100,
}

describe('BucketGrid pagination', () => {
  it('shows 10 cards per page and reveals more on "Show more"', () => {
    render(<BucketGrid allInfluencers={nano} result={result} />)
    // Each card renders a "Quote range" label — count them to count cards.
    expect(screen.getAllByText('Quote range')).toHaveLength(10)

    const showMore = screen.getByRole('button', { name: /show .* more/i })
    expect(showMore).toBeInTheDocument()
    fireEvent.click(showMore)

    expect(screen.getAllByText('Quote range')).toHaveLength(14)
    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument()
  })

  it('does not paginate when a bucket has 10 or fewer creators', () => {
    render(<BucketGrid allInfluencers={nano.slice(0, 8)} result={result} />)
    expect(screen.getAllByText('Quote range')).toHaveLength(8)
    expect(screen.queryByRole('button', { name: /show .* more/i })).toBeNull()
  })
})
