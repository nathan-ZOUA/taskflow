import { verifyAuthToken } from '../services/auth.service.js'
import { HttpError } from '../utils/httpError.js'

export function requireAuth(request, response, next) {
  const token = request.cookies?.taskflow_session
  if (!token) return next(new HttpError(401, 'Please sign in to continue.'))
  try {
    const payload = verifyAuthToken(token)
    request.user = { id: payload.sub }
    next()
  } catch {
    next(new HttpError(401, 'Your session is invalid or has expired.'))
  }
}
