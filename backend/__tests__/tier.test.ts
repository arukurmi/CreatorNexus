import { describe, it, expect } from 'vitest'
import { getTier } from '../src/lib/tier'

describe('getTier', () => {
  it('classifies boundaries', () => {
    expect(getTier(1000)).toBe('nano')
    expect(getTier(9999)).toBe('nano')
    expect(getTier(10000)).toBe('micro')
    expect(getTier(99999)).toBe('micro')
    expect(getTier(100000)).toBe('macro')
    expect(getTier(650000)).toBe('macro')
  })
  it('clamps below-nano to nano', () => {
    expect(getTier(0)).toBe('nano')
    expect(getTier(500)).toBe('nano')
  })
})
