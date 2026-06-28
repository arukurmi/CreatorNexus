export const env = {
  port: Number(process.env.PORT ?? 4000),
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET ?? '',
  upstashUrl: process.env.UPSTASH_REDIS_REST_URL ?? '',
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  rapidApiKey: process.env.RAPIDAPI_KEY ?? '',
  rapidApiHost: process.env.RAPIDAPI_HOST ?? '',
  // Live data is OPT-IN. Default false → use the unlimited generated dataset and
  // never call the (rate-limited) API. Set RAPIDAPI_ENABLED=true to go live.
  rapidApiEnabled: process.env.RAPIDAPI_ENABLED === 'true' || process.env.RAPIDAPI_ENABLED === '1',
  rapidApiDebug: process.env.RAPIDAPI_DEBUG === 'true' || process.env.RAPIDAPI_DEBUG === '1',
  // Profile endpoint path for the configured RapidAPI product (Instagram Scraper 2025).
  rapidApiProfilePath: process.env.RAPIDAPI_PROFILE_PATH ?? '/userinfo/',
  // Cache priced creators per niche for a long time to conserve the API's monthly
  // request quota (default 7 days). Lower it for fresher data if your plan allows.
  creatorsCacheTtlSec: Number(process.env.CREATORS_CACHE_TTL_SEC ?? 604800),
  pricingModel: process.env.PRICING_MODEL ?? 'cpm',
}
