import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, type AuthedRequest } from '../middleware/supabaseAuth.js'
import { httpError } from '../middleware/errorHandler.js'
import { NICHES } from '../types/index.js'
import { getRepos } from './_repos.js'
import { getPricedCreators } from '../services/influencerService.js'
import { allocate } from '../services/allocationService.js'
import type { AllocationStrategy } from '../types/index.js'

export const campaignsRouter = Router()
const schema = z.object({
  brand_id: z.string().nullable(),
  niche: z.enum(NICHES as [string, ...string[]]),
  budget: z.number().positive(),
  strategy: z.enum(['reach', 'engagement', 'value', 'count']),
  count: z.number().int().positive().nullable(),
})

campaignsRouter.get('/campaigns', requireAuth, async (req: AuthedRequest, res, next) => {
  try { res.json(await getRepos().campaigns.listByOwner(req.user!.id)) } catch (e) { next(e) }
})
campaignsRouter.post('/campaigns', requireAuth, async (req: AuthedRequest, res, next) => {
  const p = schema.safeParse(req.body)
  if (!p.success) return next(httpError(400, 'Invalid campaign'))
  try {
    const creators = await getPricedCreators(p.data.niche as any)
    const result = allocate(creators, p.data.budget, {
      strategy: p.data.strategy as AllocationStrategy,
      count: p.data.count ?? undefined,
    })
    const saved = await getRepos().campaigns.create({
      owner_id: req.user!.id,
      brand_id: p.data.brand_id,
      niche: p.data.niche,
      budget: p.data.budget,
      strategy: p.data.strategy,
      count: p.data.count,
      result,
      projected_spend: result.total_projected_spend,
    })
    res.status(201).json(saved)
  } catch (e) { next(e) }
})
campaignsRouter.get('/campaigns/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const c = await getRepos().campaigns.getById(req.params.id)
    if (!c) return next(httpError(404, 'Campaign not found'))
    if (c.owner_id !== req.user!.id) return next(httpError(403, 'Forbidden'))
    res.json(c)
  } catch (e) { next(e) }
})
