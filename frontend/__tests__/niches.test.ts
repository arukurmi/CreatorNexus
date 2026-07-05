import { describe, it, expect } from 'vitest'
import { NICHES, NICHE_LABEL } from '../lib/niches'

describe('NICHES', () => {
  it('lists all 14 supported niches with unique values', () => {
    expect(NICHES).toHaveLength(14)
    const values = NICHES.map((n) => n.value)
    expect(new Set(values).size).toBe(values.length)
  })

  it('gives every niche a non-empty label and emoji', () => {
    for (const n of NICHES) {
      expect(n.label.length).toBeGreaterThan(0)
      expect(n.emoji.length).toBeGreaterThan(0)
    }
  })
})

describe('NICHE_LABEL', () => {
  it('maps each niche value to its label', () => {
    for (const n of NICHES) {
      expect(NICHE_LABEL[n.value]).toBe(n.label)
    }
  })

  it('covers every niche value', () => {
    expect(Object.keys(NICHE_LABEL).sort()).toEqual(NICHES.map((n) => n.value).sort())
  })
})
