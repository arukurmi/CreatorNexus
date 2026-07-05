import { describe, it, expect } from 'vitest'
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
})
