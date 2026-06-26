import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/supabaseAuth.js'
import { httpError } from '../middleware/errorHandler.js'
import { NICHES } from '../types/index.js'
import { getPricedCreators } from '../services/influencerService.js'
import { allocate } from '../services/allocationService.js'

export const allocateRouter = Router()
const schema = z.object({
  budget: z.number().positive(),
  niche: z.enum(NICHES as [string, ...string[]]),
  strategy: z.enum(['reach', 'engagement', 'value', 'count']),
  count: z.number().int().positive().optional(),
}).refine((v) => v.strategy !== 'count' || v.count != null, { message: 'count required for count strategy' })

allocateRouter.post('/allocate', requireAuth, async (req, res, next) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return next(httpError(400, parsed.error.issues[0]?.message ?? 'Invalid body'))
  try {
    const { budget, niche, strategy, count } = parsed.data
    const creators = await getPricedCreators(niche as any)
    const result = allocate(creators, budget, { strategy, count })
    res.json({ ...result, creators_considered: creators.length })
  } catch (e) { next(e) }
})
