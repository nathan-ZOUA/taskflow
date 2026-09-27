import { env } from '../config/env.js'
import {
  authenticateUser,
  createAuthToken,
  getUserById,
  registerUser,
} from '../services/auth.service.js'
import { validateLogin, validateRegistration } from '../utils/validation.js'
import { HttpError } from '../utils/httpError.js'

const cookieName = 'taskflow_session'
const cookieLifetime = 7 * 24 * 60 * 60 * 1000
const cookieOptions = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: 'lax',
  path: '/',
}

function setSession(response, user) {
  response.cookie(cookieName, createAuthToken(user), { ...cookieOptions, maxAge: cookieLifetime })
}

export async function register(request, response) {
  const input = validateRegistration(request.body)
  const user = await registerUser(input)
  setSession(response, user)
  response.status(201).json({ user })
}

export async function login(request, response) {
  const input = validateLogin(request.body)
  const user = await authenticateUser(input)
  setSession(response, user)
  response.status(200).json({ user })
}

export function logout(request, response) {
  response.clearCookie(cookieName, cookieOptions)
  response.status(204).end()
}

export async function currentUser(request, response) {
  const user = await getUserById(request.user.id)
  if (!user) throw new HttpError(401, 'Your account is no longer available.')
  response.status(200).json({ user })
}
