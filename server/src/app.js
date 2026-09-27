import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import { pool } from './db/pool.js'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import authRouter from './routes/auth.routes.js'
import tasksRouter from './routes/tasks.routes.js'

const app = express()

app.disable('x-powered-by')
app.use(
  helmet({
    hsts: env.nodeEnv === 'production' ? undefined : false,
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        'connect-src': ["'self'", 'ws:'],
      },
    },
  }),
)
app.use(cors({ origin: env.clientOrigin, credentials: true }))
app.use(express.json({ limit: '20kb' }))
app.use(cookieParser())

app.get('/', (request, response) => {
  response.status(200).json({
    name: 'TaskFlow API',
    message: 'TaskFlow personal demonstration API.',
  })
})

app.get('/api/health', async (request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ status: 'ok', service: 'TaskFlow API', database: 'connected' })
  } catch {
    response.status(503).json({
      status: 'error',
      service: 'TaskFlow API',
      database: 'unavailable',
    })
  }
})
app.use('/api/auth', authRouter)
app.use('/api/tasks', tasksRouter)
app.use(notFound)
app.use(errorHandler)

export default app
