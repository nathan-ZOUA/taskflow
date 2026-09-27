import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { pool } from './pool.js'

const migrationsDirectory = fileURLToPath(new URL('./migrations/', import.meta.url))

try {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`)

  const names = (await readdir(migrationsDirectory)).filter((name) => name.endsWith('.sql')).sort()
  for (const name of names) {
    const { rowCount } = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name])
    if (rowCount) {
      console.log(`Already applied: ${name}`)
      continue
    }

    const sql = await readFile(new URL(`./migrations/${name}`, import.meta.url), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name])
      await client.query('COMMIT')
      console.log(`Applied: ${name}`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
} catch (error) {
  console.error('Database migration failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
