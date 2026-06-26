import { Router } from 'express'
import { requireAuth, type AuthedRequest } from '../middleware/supabaseAuth.js'
export const authRouter = Router()
authRouter.post('/auth/session', requireAuth, (req: AuthedRequest, res) => res.json({ user: req.user }))
