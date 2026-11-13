import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/supabaseAuth.js'
import { httpError } from '../middleware/errorHandler.js'
import { NICHES } from '../types/index.js'
import { getPricedCreators } from '../services/influencerService.js'
import { allocate } from '../services/allocationService.js'
import { budgetHealth } from '../services/allocation/diagnostics.js'
import { allocationRationale } from '../services/allocation/rationale.js'
import { budgetSchema, creatorCountSchema, citySchema } from './_schemas.js'

export const allocateRouter = Router()
const schema = z.object({
  budget: budgetSchema,
  niche: z.enum(NICHES as [string, ...string[]]),
  strategy: z.enum(['reach', 'engagement', 'value', 'count']),
  count: creatorCountSchema.optional(),
  city: citySchema.optional(), // optional India city filter
}).refine((v) => v.strategy !== 'count' || v.count != null, { message: 'count required for count strategy' })

allocateRouter.post('/allocate', requireAuth, async (req, res, next) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return next(httpError(400, parsed.error.issues[0]?.message ?? 'Invalid body'))
  try {
    const { budget, niche, strategy, count, city } = parsed.data
    const creators = await getPricedCreators(niche as any, { city })
    const result = allocate(creators, budget, { strategy, count })
    res.json({
      ...result, city: city ?? null, creators_considered: creators.length,
      health: budgetHealth(result, creators), rationale: allocationRationale(result, creators, strategy),
    })
  } catch (e) { next(e) }
})
