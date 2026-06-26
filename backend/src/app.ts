import express, { type Express } from 'express'
import { healthRouter } from './routes/health.js'
import { authRouter } from './routes/auth.js'
import { influencersRouter } from './routes/influencers.js'
import { allocateRouter } from './routes/allocate.js'
import { rateLimit } from './middleware/rateLimit.js'
import { errorHandler } from './middleware/errorHandler.js'

export function createApp(): Express {
  const app = express()
  app.use(express.json())
  app.use('/api', rateLimit)
  app.use('/api', healthRouter)
  app.use('/api', authRouter)
  app.use('/api', influencersRouter)
  app.use('/api', allocateRouter)
  app.use(errorHandler)
  return app
}
