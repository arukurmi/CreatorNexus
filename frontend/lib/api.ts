import type { AllocationStrategy } from './types'

interface AllocParams { budget: number; niche: string; strategy: AllocationStrategy; count?: number; city?: string }
interface Opts { base?: string; fetchFn?: typeof fetch; signal?: AbortSignal }

export async function allocateViaApi<T = unknown>(p: AllocParams, token: string, opts: Opts = {}): Promise<T> {
  const base = opts.base ?? process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000'
  const f = opts.fetchFn ?? fetch
  const res = await f(`${base}/api/allocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(p),
    signal: opts.signal,
  })
  if (!res.ok) throw new Error(`allocate failed: ${res.status}`)
  return res.json() as Promise<T>
}
