import type { Request, Response, NextFunction } from 'express'

export class HttpError extends Error { constructor(public status: number, msg: string) { super(msg) } }
export function httpError(status: number, message: string): HttpError { return new HttpError(status, message) }

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = typeof err?.status === 'number' ? err.status : 500
  res.status(status).json({ error: status === 500 ? 'Internal Server Error' : err.message })
}
