import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/supabaseAuth.js'
import { httpError } from '../middleware/errorHandler.js'
import { NICHES } from '../types/index.js'
import { getPricedCreators } from '../services/influencerService.js'

export const influencersRouter = Router()
const nicheSchema = z.enum(NICHES as [string, ...string[]])

influencersRouter.get('/influencers', requireAuth, async (req, res, next) => {
  const parsed = nicheSchema.safeParse(req.query.niche)
  if (!parsed.success) return next(httpError(400, 'Invalid or missing niche'))
  const city = typeof req.query.city === 'string' && req.query.city.trim() ? req.query.city.trim() : undefined
  try {
    const creators = await getPricedCreators(parsed.data as any, { city })
    res.json({ niche: parsed.data, city: city ?? null, creators })
  } catch (e) { next(e) }
})
