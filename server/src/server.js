import app from './app.js'
import { env } from './config/env.js'
import { pool } from './db/pool.js'

const server = app.listen(env.port, env.host, () => {
  console.log(`TaskFlow API listening at http://${env.host}:${env.port}`)
})

async function stop(signal) {
  console.log(`${signal} received. Closing TaskFlow API.`)
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGINT', () => stop('SIGINT'))
process.on('SIGTERM', () => stop('SIGTERM'))
