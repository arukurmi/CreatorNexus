import { describe, it, expect } from 'vitest'
import { instagramUrl } from '../lib/instagram'

describe('instagramUrl', () => {
  it('strips a leading @ from the handle', () => {
    expect(instagramUrl('@komalpandeyofficial')).toBe('https://instagram.com/komalpandeyofficial')
  })

  it('accepts a handle without a leading @', () => {
    expect(instagramUrl('nykaa')).toBe('https://instagram.com/nykaa')
  })

  it('only strips the first @ (mid-string @ is preserved)', () => {
    expect(instagramUrl('@a@b')).toBe('https://instagram.com/a@b')
  })
})
