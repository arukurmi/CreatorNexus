import express, { type Express } from 'express'
import cors from 'cors'
import { healthRouter } from './routes/health.js'
import { authRouter } from './routes/auth.js'
import { influencersRouter } from './routes/influencers.js'
import { allocateRouter } from './routes/allocate.js'
import { brandsRouter } from './routes/brands.js'
import { campaignsRouter } from './routes/campaigns.js'
import { rateLimit } from './middleware/rateLimit.js'
import { errorHandler } from './middleware/errorHandler.js'

export function createApp(): Express {
  const app = express()
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000', credentials: true }))
  app.use(express.json())
  app.use('/api', rateLimit)
  app.use('/api', healthRouter)
  app.use('/api', authRouter)
  app.use('/api', influencersRouter)
  app.use('/api', allocateRouter)
  app.use('/api', brandsRouter)
  app.use('/api', campaignsRouter)
  app.use(errorHandler)
  return app
}
