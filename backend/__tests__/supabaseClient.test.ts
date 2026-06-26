import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Regression: on Node < 22 there is no global WebSocket, and @supabase/supabase-js
// constructs a RealtimeClient in its ctor that requires one — so createClient()
// throws and ALL auth fails with 401. getSupabase() must construct without throwing.
describe('getSupabase client construction (Node < 22 WebSocket)', () => {
  const saved = { ...process.env }
  beforeEach(() => { vi.resetModules(); process.env = { ...saved } })
  afterEach(() => { process.env = { ...saved } })

  it('constructs the client without throwing when env is set', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    const { getSupabase } = await import('../src/db/supabase')
    let client: unknown
    expect(() => { client = getSupabase() }).not.toThrow()
    expect(client).not.toBeNull()
  })

  it('returns null (no throw) when env is absent', async () => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const { getSupabase } = await import('../src/db/supabase')
    expect(getSupabase()).toBeNull()
  })
})
