import type { Request, Response, NextFunction } from 'express'
import { getSupabase } from '../db/supabase.js'
import { httpError } from './errorHandler.js'

export interface AuthUser { id: string; email: string }
export interface AuthedRequest extends Request { user?: AuthUser }

type Verifier = (token: string) => Promise<AuthUser | null>

// Default: ask Supabase to resolve the user from the access token.
let verify: Verifier = async (token) => {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data.user) return null
  return { id: data.user.id, email: data.user.email ?? '' }
}
export function __setVerifier(v: Verifier) { verify = v } // test seam

export async function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return next(httpError(401, 'Missing bearer token'))
  const user = await verify(token)
  if (!user) return next(httpError(401, 'Invalid or expired token'))
  req.user = user
  next()
}
