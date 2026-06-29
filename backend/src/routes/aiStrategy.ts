import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/supabaseAuth.js'
import { httpError } from '../middleware/errorHandler.js'
import { getStrategy, type StrategyClient } from '../services/ai/strategyService.js'
import { GeminiClient } from '../services/ai/geminiClient.js'
import { env } from '../config/env.js'

export const aiStrategyRouter = Router()
const schema = z.object({ brief: z.string().trim().min(10).max(4000) })

// Test seam: inject a fake client, or null to simulate "not configured".
let override: StrategyClient | null | undefined
export function __setStrategyClient(c: StrategyClient | null) { override = c }
export function __resetStrategyClient() { override = undefined }

function resolveClient(): StrategyClient | null {
  if (override !== undefined) return override
  if (!env.geminiApiKey) return null
  return new GeminiClient({ key: env.geminiApiKey, model: env.geminiModel, baseUrl: env.geminiBaseUrl })
}

aiStrategyRouter.post('/ai/strategy', requireAuth, async (req, res, next) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return next(httpError(400, 'Brief must be 10–4000 characters'))
  const client = resolveClient()
  if (!client) return next(httpError(503, "AI Strategist isn't configured"))
  try {
    const result = await getStrategy(parsed.data.brief, { client })
    res.json(result)
  } catch (err) {
    // Log the real Gemini error to the server (visible in Render → Logs); the
    // client only gets a safe message.
    console.error('[ai/strategy] failed:', err instanceof Error ? err.message : err)
    const status = (err as { status?: number })?.status
    if (status === 429) {
      return next(httpError(429, 'The AI is rate-limited or out of free-tier quota. Please try again in a minute.'))
    }
    next(httpError(502, 'The AI service is unavailable right now. Please try again.'))
  }
})
