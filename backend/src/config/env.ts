export const env = {
  port: Number(process.env.PORT ?? 4000),
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET ?? '',
  upstashUrl: process.env.UPSTASH_REDIS_REST_URL ?? '',
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  rapidApiKey: process.env.RAPIDAPI_KEY ?? '',
  rapidApiHost: process.env.RAPIDAPI_HOST ?? '',
  rapidApiDebug: process.env.RAPIDAPI_DEBUG === 'true' || process.env.RAPIDAPI_DEBUG === '1',
  pricingModel: process.env.PRICING_MODEL ?? 'cpm',
}
