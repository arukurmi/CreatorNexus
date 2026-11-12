import { describe, it, expect } from 'vitest'
import { allocate, influencerCost } from '../src/services/allocationService'
import { budgetHealth } from '../src/services/allocation/diagnostics'
import type { AllocationResult } from '../src/services/allocation/types'
import type { Influencer } from '../src/types'

function mk(id: string, followers: number, views: number, eng: number, min: number, max: number): Influencer {
  return { id, handle: id, avatar_url: '', followers, avg_views: views, avg_likes: 1, avg_comments: 0,
    engagement_rate: eng, niche: 'tech', tier: followers >= 100000 ? 'macro' : followers >= 10000 ? 'micro' : 'nano', cost_min: min, cost_max: max }
}
const nano = (id: string, cost: number) => mk(id, 5000, 2000, 0.08, cost, cost)
const micro = (id: string, cost: number) => mk(id, 40000, 20000, 0.05, cost, cost)
const macro = (id: string, cost: number) => mk(id, 200000, 120000, 0.03, cost, cost)

function resultOf(selected: Influencer[], effective_budget: number): AllocationResult {
  const by_tier = { nano: { count: 0, spend: 0 }, micro: { count: 0, spend: 0 }, macro: { count: 0, spend: 0 } }
  for (const i of selected) { by_tier[i.tier].count++; by_tier[i.tier].spend += influencerCost(i) }
  const spend = selected.reduce((s, i) => s + influencerCost(i), 0)
  return { selected, total_projected_spend: spend, leftover_budget: Math.max(0, effective_budget - spend),
    effective_budget, budget_buffer_applied: false, by_tier }
}
const codes = (selected: Influencer[], effective: number, pool: Influencer[] = selected) =>
  budgetHealth(resultOf(selected, effective), pool).map((f) => f.code)

describe('budgetHealth', () => {
  it('no_creators: only flag when the budget is below the cheapest creator', () => {
    const pool = [nano('a', 1500), micro('m', 10000)]
    expect(budgetHealth(allocate(pool, 500, { strategy: 'reach' }), pool)).toEqual([{ severity: 'critical', code: 'no_creators',
      message: 'The cheapest creator costs ₹1,500, more than the ₹500 budget, so no one was selected.' }])
  })

  it('no_creators: says no creators matched when the pool is empty', () => {
    expect(budgetHealth(resultOf([], 50000), [])[0].message).toBe('No creators matched this search, so no one was selected.')
  })

  it('no_creators: absent when someone is selected', () => {
    expect(codes([nano('a', 1000)], 1000)).not.toContain('no_creators')
  })

  it('tier_concentration: fires when one tier holds over 55% of spend', () => {
    const flags = budgetHealth(resultOf([macro('M', 80000), nano('a', 20000)], 100000), [macro('M', 80000), nano('a', 20000)])
    expect(flags).toContainEqual({ severity: 'warn', code: 'tier_concentration',
      message: '80% of spend is in macro creators. Consider spreading it across tiers.' })
  })

  it('tier_concentration: absent when the pool has only one tier', () => {
    expect(codes([nano('a', 1000), nano('b', 1000)], 2000)).not.toContain('tier_concentration')
  })

  it('tier_concentration: absent when spend is balanced across tiers', () => {
    expect(codes([nano('a', 5000), micro('m', 5000)], 10000)).not.toContain('tier_concentration')
  })

  it('unspent_budget: fires when over 10% of the effective budget is left', () => {
    const flags = budgetHealth(resultOf([nano('a', 8000)], 10000), [nano('a', 8000)])
    expect(flags).toContainEqual({ severity: 'warn', code: 'unspent_budget', message: '₹2,000 (20% of the budget) is left unspent.' })
  })

  it('unspent_budget: absent at exactly 10% left', () => {
    expect(codes([nano('a', 9000)], 10000)).not.toContain('unspent_budget')
  })

  it('single_creator_concentration: fires when one creator takes over 35% of spend', () => {
    const flags = budgetHealth(resultOf([nano('a', 4000), nano('b', 3000), nano('c', 3000)], 10000), [])
    expect(flags).toContainEqual({ severity: 'warn', code: 'single_creator_concentration', message: '@a takes 40% of spend on their own.' })
  })

  it('single_creator_concentration: absent with a single creator', () => {
    expect(codes([nano('a', 5000)], 5000)).not.toContain('single_creator_concentration')
  })

  it('single_creator_concentration: absent when spend is even', () => {
    expect(codes(['a', 'b', 'c', 'd'].map((id) => nano(id, 2500)), 10000)).not.toContain('single_creator_concentration')
  })

  it('macro_cpe_premium: fires when macro costs over 1.5x micro per engagement', () => {
    const flags = budgetHealth(resultOf([macro('M', 60000), micro('m', 10000)], 70000), [])
    expect(flags).toContainEqual({ severity: 'info', code: 'macro_cpe_premium',
      message: 'Macro creators cost 2.0× more per engagement than micro creators.' })
  })

  it('macro_cpe_premium: absent when macro is cheaper per engagement', () => {
    expect(codes([macro('M', 12000), micro('m', 10000)], 22000)).not.toContain('macro_cpe_premium')
  })

  it('macro_cpe_premium: absent without selected micro creators', () => {
    expect(codes([macro('M', 60000), nano('a', 1000)], 61000)).not.toContain('macro_cpe_premium')
  })
})
