import { describe, it, expect } from 'vitest'
import nextConfig from '../next.config'

describe('next.config security headers', () => {
  it('applies HSTS, nosniff, referrer, framing and permissions headers to every route', async () => {
    const rules = await nextConfig.headers!()
    expect(rules).toHaveLength(1)
    expect(rules[0].source).toBe('/:path*')
    const headers = Object.fromEntries(rules[0].headers.map((h) => [h.key, h.value]))
    expect(headers['Strict-Transport-Security']).toMatch(/max-age=\d+/)
    expect(headers['X-Content-Type-Options']).toBe('nosniff')
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['X-Frame-Options']).toBe('DENY')
    expect(headers['Content-Security-Policy']).toBe("frame-ancestors 'none'")
    expect(headers['Permissions-Policy']).toContain('camera=()')
  })
})
