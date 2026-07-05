import { describe, it, expect } from 'vitest'
import { seeded, hashString } from '../src/lib/prng'

describe('seeded (mulberry32)', () => {
  it('is deterministic for a given seed', () => {
    const a = seeded(42)
    const b = seeded(42)
    const seqA = [a(), a(), a(), a(), a()]
    const seqB = [b(), b(), b(), b(), b()]
    expect(seqA).toEqual(seqB)
  })

  it('produces values in [0, 1)', () => {
    const rand = seeded(12345)
    for (let i = 0; i < 1000; i++) {
      const v = rand()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('yields different streams for different seeds', () => {
    const a = seeded(1)
    const b = seeded(2)
    expect(a()).not.toBe(b())
  })

  it('does not get stuck on a constant value', () => {
    const rand = seeded(7)
    const first = rand()
    const distinct = new Set([first])
    for (let i = 0; i < 20; i++) distinct.add(rand())
    expect(distinct.size).toBeGreaterThan(1)
  })
})

describe('hashString (FNV-1a)', () => {
  it('is deterministic', () => {
    expect(hashString('creator-nexus')).toBe(hashString('creator-nexus'))
  })

  it('returns an unsigned 32-bit integer', () => {
    const h = hashString('anything')
    expect(Number.isInteger(h)).toBe(true)
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThanOrEqual(0xffffffff)
  })

  it('differs for different inputs', () => {
    expect(hashString('a')).not.toBe(hashString('b'))
    expect(hashString('fashion')).not.toBe(hashString('fashiom'))
  })

  it('hashes the empty string to the FNV offset basis', () => {
    expect(hashString('')).toBe(2166136261)
  })

  it('pairs with seeded so the same string yields the same stream', () => {
    const s = 'komalpandeyofficial'
    const r1 = seeded(hashString(s))
    const r2 = seeded(hashString(s))
    expect(r1()).toBe(r2())
  })
})
