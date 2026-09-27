import pg from 'pg'
import { env } from '../config/env.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (error) => {
  console.error('Unexpected idle PostgreSQL client error:', error.message)
})
