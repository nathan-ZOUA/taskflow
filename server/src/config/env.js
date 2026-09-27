import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) })

function requiredString(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} must be set in server/.env.`)
  return value
}

const port = Number(process.env.PORT || 4000)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid port number between 1 and 65535.')
}

const jwtSecret = requiredString('JWT_SECRET')
if (jwtSecret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.')

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  host: process.env.HOST || '127.0.0.1',
  port,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173',
  databaseUrl: requiredString('DATABASE_URL'),
  jwtSecret,
  cookieSecure: process.env.COOKIE_SECURE === 'true',
})
