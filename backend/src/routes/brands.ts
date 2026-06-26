import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, type AuthedRequest } from '../middleware/supabaseAuth.js'
import { httpError } from '../middleware/errorHandler.js'
import { NICHES } from '../types/index.js'
import { getRepos } from './_repos.js'

export const brandsRouter = Router()
const schema = z.object({ name: z.string().min(1), niche: z.enum(NICHES as [string, ...string[]]) })

brandsRouter.get('/brands', requireAuth, async (req: AuthedRequest, res, next) => {
  try { res.json(await getRepos().brands.listByOwner(req.user!.id)) } catch (e) { next(e) }
})
brandsRouter.post('/brands', requireAuth, async (req: AuthedRequest, res, next) => {
  const p = schema.safeParse(req.body)
  if (!p.success) return next(httpError(400, 'Invalid brand'))
  try { res.status(201).json(await getRepos().brands.create({ owner_id: req.user!.id, ...p.data })) } catch (e) { next(e) }
})
brandsRouter.delete('/brands/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const found = await getRepos().brands.getById(req.params.id)
    if (!found) return next(httpError(404, 'Brand not found'))
    if (found.owner_id !== req.user!.id) return next(httpError(403, 'Forbidden'))
    const deleted = await getRepos().brands.deleteOwned(req.params.id, req.user!.id)
    if (!deleted) return next(httpError(404, 'Brand not found'))
    res.status(204).end()
  } catch (e) { next(e) }
})
