import { describe, it, expect } from 'vitest'
import { clampBudget, MAX_BUDGET, MIN_BUDGET } from '@/lib/budget'

describe('clampBudget', () => {
  it.each([
    [50000, 50000],
    [12345.6, 12346],
    [100, MIN_BUDGET],
    [-1, MIN_BUDGET],
    [20_000_000, MAX_BUDGET],
    [Infinity, MAX_BUDGET],
    [NaN, MIN_BUDGET],
  ])('clamps %s to %s', (input, expected) => {
    expect(clampBudget(input)).toBe(expected)
  })
})
