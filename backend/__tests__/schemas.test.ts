import { describe, it, expect } from 'vitest'
import { isUuid } from '../src/routes/_schemas.js'

describe('isUuid', () => {
  it('accepts any 8-4-4-4-12 hex id, not only RFC 4122 variants', () => {
    expect(isUuid('11111111-1111-1111-1111-111111111111')).toBe(true)
    expect(isUuid('5f0c1a2b-3c4d-4e5f-8a9b-0c1d2e3f4a5b')).toBe(true)
  })

  it('rejects malformed ids', () => {
    expect(isUuid('not-a-uuid')).toBe(false)
    expect(isUuid('11111111-1111-1111-1111-11111111111')).toBe(false)
  })
})
