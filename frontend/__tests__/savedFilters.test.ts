import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadSavedFilters, saveFilters, type Filters } from '../lib/savedFilters'
import { MAX_BUDGET } from '../lib/budget'

const KEY = 'creator-nexus:last-filters'
const filters: Filters = { budget: 75_000, niche: 'food', strategy: 'count', count: 8, city: 'Pune' }

describe('savedFilters', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('round-trips the last applied filters', () => {
    saveFilters(filters)
    expect(loadSavedFilters()).toEqual(filters)
  })

  it('returns null when nothing is saved', () => {
    expect(loadSavedFilters()).toBeNull()
  })

  it('returns null for corrupt JSON', () => {
    localStorage.setItem(KEY, '{not json')
    expect(loadSavedFilters()).toBeNull()
  })

  it('returns null for a non-object value', () => {
    localStorage.setItem(KEY, '42')
    expect(loadSavedFilters()).toBeNull()
  })

  it('rejects an unknown niche or strategy', () => {
    localStorage.setItem(KEY, JSON.stringify({ ...filters, niche: 'crypto' }))
    expect(loadSavedFilters()).toBeNull()
    localStorage.setItem(KEY, JSON.stringify({ ...filters, strategy: 'viral' }))
    expect(loadSavedFilters()).toBeNull()
  })

  it('rejects a non-positive or fractional count and a non-string city', () => {
    for (const bad of [{ count: 0 }, { count: 2.5 }, { count: '3' }, { city: null }, { budget: '50000' }]) {
      localStorage.setItem(KEY, JSON.stringify({ ...filters, ...bad }))
      expect(loadSavedFilters()).toBeNull()
    }
  })

  it('clamps an out-of-range budget', () => {
    localStorage.setItem(KEY, JSON.stringify({ ...filters, budget: 1e12 }))
    expect(loadSavedFilters()?.budget).toBe(MAX_BUDGET)
  })

  it('returns null when reading storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(loadSavedFilters()).toBeNull()
  })

  it('ignores a storage write that throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => saveFilters(filters)).not.toThrow()
  })
})
