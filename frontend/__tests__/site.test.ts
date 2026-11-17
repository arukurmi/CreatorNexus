import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadSiteUrl(env: Record<string, string>) {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
  vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '')
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  vi.resetModules()
  return (await import('../lib/site')).SITE_URL
}

describe('SITE_URL', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('prefers NEXT_PUBLIC_SITE_URL and strips its trailing slash', async () => {
    expect(
      await loadSiteUrl({
        NEXT_PUBLIC_SITE_URL: 'https://creatornexus.in/',
        VERCEL_PROJECT_PRODUCTION_URL: 'creator-nexus.vercel.app',
      }),
    ).toBe('https://creatornexus.in')
  })

  it('falls back to the Vercel production host over https', async () => {
    expect(await loadSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'creator-nexus.vercel.app' })).toBe(
      'https://creator-nexus.vercel.app',
    )
  })

  it('falls back to localhost:3000 when neither is set', async () => {
    expect(await loadSiteUrl({})).toBe('http://localhost:3000')
  })
})
