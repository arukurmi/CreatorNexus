import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/supabaseAuth.js'
import { httpError } from '../middleware/errorHandler.js'
import { NICHES } from '../types/index.js'
import { getPricedCreators } from '../services/influencerService.js'
import { citySchema } from './_schemas.js'

export const influencersRouter = Router()
const nicheSchema = z.enum(NICHES as [string, ...string[]])

influencersRouter.get('/influencers', requireAuth, async (req, res, next) => {
  const parsed = nicheSchema.safeParse(req.query.niche)
  if (!parsed.success) return next(httpError(400, 'Invalid or missing niche'))
  const cityQuery = typeof req.query.city === 'string' && req.query.city.trim() ? req.query.city : undefined
  const city = citySchema.optional().safeParse(cityQuery)
  if (!city.success) return next(httpError(400, 'City must be 64 characters or fewer'))
  try {
    const creators = await getPricedCreators(parsed.data as any, { city: city.data })
    res.json({ niche: parsed.data, city: city.data ?? null, creators })
  } catch (e) { next(e) }
})
