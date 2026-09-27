import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { currentUser, login, logout, register } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/requireAuth.js'

const authRouter = Router()
const authAttemptLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { message: 'Too many authentication attempts. Try again later.' } },
})

authRouter.post('/register', authAttemptLimit, register)
authRouter.post('/login', authAttemptLimit, login)
authRouter.post('/logout', logout)
authRouter.get('/me', requireAuth, currentUser)

export default authRouter
