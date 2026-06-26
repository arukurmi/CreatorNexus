import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, type AuthedRequest } from '../middleware/supabaseAuth.js'
import { httpError } from '../middleware/errorHandler.js'
import { NICHES } from '../types/index.js'
import { getRepos } from './_repos.js'

export const campaignsRouter = Router()
const schema = z.object({
  brand_id: z.string().nullable(),
  niche: z.enum(NICHES as [string, ...string[]]),
  budget: z.number().positive(),
  strategy: z.enum(['reach', 'engagement', 'value', 'count']),
  count: z.number().int().positive().nullable(),
  projected_spend: z.number().nonnegative(),
  result: z.record(z.unknown()),
})

campaignsRouter.get('/campaigns', requireAuth, async (req: AuthedRequest, res, next) => {
  try { res.json(await getRepos().campaigns.listByOwner(req.user!.id)) } catch (e) { next(e) }
})
campaignsRouter.post('/campaigns', requireAuth, async (req: AuthedRequest, res, next) => {
  const p = schema.safeParse(req.body)
  if (!p.success) return next(httpError(400, 'Invalid campaign'))
  try { res.status(201).json(await getRepos().campaigns.create({ owner_id: req.user!.id, ...(p.data as any) })) } catch (e) { next(e) }
})
campaignsRouter.get('/campaigns/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const c = await getRepos().campaigns.getById(req.params.id)
    if (!c) return next(httpError(404, 'Campaign not found'))
    if (c.owner_id !== req.user!.id) return next(httpError(403, 'Forbidden'))
    res.json(c)
  } catch (e) { next(e) }
})
