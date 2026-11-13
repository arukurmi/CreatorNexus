import type { Request, Response, NextFunction } from 'express'
import { STATUS_CODES } from 'node:http'

export class HttpError extends Error { constructor(public status: number, msg: string) { super(msg) } }
export function httpError(status: number, message: string): HttpError { return new HttpError(status, message) }

/** Only messages we wrote ourselves (HttpError) reach the client; library errors get the bare status text. */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = Number.isInteger(err?.status) && err.status >= 400 && err.status < 600 ? err.status : 500
  if (status === 500) console.error(`[${req.method} ${req.path}] ${status}`, String(err?.stack ?? err?.message ?? err))
  const message = err instanceof HttpError && status !== 500 ? err.message : STATUS_CODES[status]
  res.status(status).json({ error: message ?? 'Internal Server Error' })
}
