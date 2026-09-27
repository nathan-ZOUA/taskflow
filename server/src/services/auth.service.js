import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import { pool } from '../db/pool.js'
import { env } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'

const passwordRounds = 12
const fallbackPasswordHash = bcrypt.hashSync('taskflow-not-a-real-password', passwordRounds)

function toPublicUser(row) {
  return { id: row.id, name: row.name, email: row.email, createdAt: row.created_at }
}

export async function registerUser({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, passwordRounds)
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, created_at',
      [randomUUID(), name, email, passwordHash],
    )
    return toPublicUser(rows[0])
  } catch (error) {
    if (error.code === '23505')
      throw new HttpError(409, 'An account with this email already exists.')
    throw error
  }
}

export async function authenticateUser({ email, password }) {
  const { rows } = await pool.query(
    'SELECT id, name, email, password_hash, created_at FROM users WHERE lower(email) = $1',
    [email],
  )
  const user = rows[0]
  const matches = await bcrypt.compare(password, user?.password_hash || fallbackPasswordHash)
  if (!user || !matches) throw new HttpError(401, 'Email or password is incorrect.')
  return toPublicUser(user)
}

export function createAuthToken(user) {
  return jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: '7d', issuer: 'taskflow-api' })
}

export function verifyAuthToken(token) {
  return jwt.verify(token, env.jwtSecret, { issuer: 'taskflow-api' })
}

export async function getUserById(id) {
  const { rows } = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [
    id,
  ])
  return rows[0] ? toPublicUser(rows[0]) : null
}
