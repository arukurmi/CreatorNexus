import type { AllocationStrategy } from './types'

interface AllocParams { budget: number; niche: string; strategy: AllocationStrategy; count?: number }
interface Opts { base?: string; fetchFn?: typeof fetch }

export async function allocateViaApi(p: AllocParams, token: string, opts: Opts = {}) {
  const base = opts.base ?? process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000'
  const f = opts.fetchFn ?? fetch
  const res = await f(`${base}/api/allocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(p),
  })
  if (!res.ok) throw new Error(`allocate failed: ${res.status}`)
  return res.json()
}
