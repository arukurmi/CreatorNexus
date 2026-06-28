import { describe, it, expect } from 'vitest'
import { getProvider } from '../src/services/rapidapi/RapidApiProvider.js'

// RAPIDAPI_ENABLED is unset in the test env → live data is OFF by default.
describe('getProvider gate (live API opt-in)', () => {
  it('uses generated SAMPLE data when the live API is not enabled', async () => {
    const list = await getProvider().getByNiche('beauty')
    expect(list.length).toBeGreaterThan(0)
    // Sample creators are never marked verified, and carry a country/city.
    expect(list.every((c) => c.verified === false)).toBe(true)
    expect(list.every((c) => c.country === 'India')).toBe(true)
    expect(list.every((c) => !!c.city)).toBe(true)
  })
})
