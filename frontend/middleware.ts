import { NextRequest, NextResponse } from 'next/server'

// Rate limit only the API proxy route.
// When Upstash credentials are present, enforce 10 req/min/IP.
// When credentials are absent (local dev), pass through gracefully.
export const config = {
  matcher: '/api/fetch-metrics',
}

export default async function middleware(
  request: NextRequest
): Promise<NextResponse> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    // Local dev without Upstash — pass through
    return NextResponse.next()
  }

  const { Ratelimit } = await import('@upstash/ratelimit')
  const { Redis } = await import('@upstash/redis')

  const ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: false,
  })

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const { success, limit, remaining, reset } = await ratelimit.limit(ip)

  if (!success) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(reset),
        'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
      },
    })
  }

  return NextResponse.next()
}
