import { describe, it, expect, vi, afterEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { errorHandler, httpError, HttpError } from '../src/middleware/errorHandler'

function appThrowing(err: unknown) {
  const app = express()
  app.get('/boom', (_req, _res, next) => next(err))
  app.use(errorHandler)
  return app
}

describe('httpError / HttpError', () => {
  it('builds an HttpError with status and message', () => {
    const e = httpError(404, 'not found')
    expect(e).toBeInstanceOf(HttpError)
    expect(e).toBeInstanceOf(Error)
    expect(e.status).toBe(404)
    expect(e.message).toBe('not found')
  })
})

describe('errorHandler', () => {
  it('uses the error status and message for non-500 errors', async () => {
    const res = await request(appThrowing(httpError(400, 'bad input'))).get('/boom')
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'bad input' })
  })

  it('hides the message behind a generic label for 500 errors', async () => {
    const res = await request(appThrowing(httpError(500, 'secret db string'))).get('/boom')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal Server Error' })
  })

  it('defaults to 500 when the error has no numeric status', async () => {
    const res = await request(appThrowing(new Error('plain error'))).get('/boom')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal Server Error' })
  })

  it('surfaces the message for other 4xx statuses like 401', async () => {
    const res = await request(appThrowing(httpError(401, 'unauthorized'))).get('/boom')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'unauthorized' })
  })

  it('returns the bare status text instead of a library error message', async () => {
    const parseError = Object.assign(new Error('Unexpected token } in JSON at position 7'), { status: 400 })
    const res = await request(appThrowing(parseError)).get('/boom')
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Bad Request' })
  })

  it('answers malformed JSON bodies with a fixed message', async () => {
    const app = express()
    app.use(express.json())
    app.post('/echo', (req, res) => res.json(req.body))
    app.use(errorHandler)
    const res = await request(app).post('/echo').set('Content-Type', 'application/json').send('{"a":}')
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Bad Request' })
  })

  it('treats a status outside 400-599 as 500', async () => {
    const res = await request(appThrowing(Object.assign(new Error('odd'), { status: 302 }))).get('/boom')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal Server Error' })
  })

  describe('logging', () => {
    afterEach(() => { vi.restoreAllMocks() })

    it('logs 500 errors with method and path but keeps the stack out of the response', async () => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => {})
      const res = await request(appThrowing(new Error('db exploded'))).get('/boom')
      expect(log).toHaveBeenCalledOnce()
      expect(log.mock.calls[0][0]).toBe('[GET /boom] 500')
      expect(log.mock.calls[0][1]).toContain('db exploded')
      expect(JSON.stringify(res.body)).not.toMatch(/db exploded|at /)
    })

    it('does not log deliberate 4xx and 503 responses', async () => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => {})
      await request(appThrowing(httpError(404, 'nope'))).get('/boom')
      await request(appThrowing(httpError(503, 'not configured'))).get('/boom')
      expect(log).not.toHaveBeenCalled()
    })
  })
})
