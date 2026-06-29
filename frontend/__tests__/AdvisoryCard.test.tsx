import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdvisoryCard from '@/components/AdvisoryCard'

const advisory = {
  recommended_niche: 'beauty',
  secondary_niches: ['fashion'],
  tier_mix: { nano: 60, micro: 30, macro: 10 },
  rationale: 'Launch needs trust so nano-heavy.',
  target_audience: 'Gen-Z metro skincare buyers',
  content_ideas: ['unboxing reel', 'GRWM'],
  selected_creator_ids: [],
}

describe('AdvisoryCard', () => {
  it('renders niche, rationale, audience and content ideas', () => {
    render(<AdvisoryCard advisory={advisory} />)
    expect(screen.getByText(/beauty/i)).toBeInTheDocument()
    expect(screen.getByText(/nano-heavy/i)).toBeInTheDocument()
    expect(screen.getByText(/Gen-Z metro/i)).toBeInTheDocument()
    expect(screen.getByText(/unboxing reel/i)).toBeInTheDocument()
    expect(screen.getByText(/60%/)).toBeInTheDocument()
  })
})
