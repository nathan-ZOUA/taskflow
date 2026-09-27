import assert from 'node:assert/strict'
import test from 'node:test'

process.env.DATABASE_URL ||= 'postgresql://taskflow_test:unused@127.0.0.1:5432/taskflow_test'
process.env.JWT_SECRET ||= 'taskflow-service-test-secret-that-is-at-least-32-characters'

const [{ pool }, tasks] = await Promise.all([
  import('../src/db/pool.js'),
  import('../src/services/tasks.service.js'),
])

test('task list scopes by owner and parameterizes every filter', async () => {
  const originalQuery = pool.query.bind(pool)
  let capturedQuery
  pool.query = async (sql, values) => {
    capturedQuery = { sql, values }
    return { rows: [] }
  }

  try {
    await tasks.listTasks('user-id', {
      status: 'pending',
      priority: 'high',
      search: 'design',
      dueBefore: '2026-12-31',
      dueAfter: '2026-01-01',
      limit: '25',
    })
  } finally {
    pool.query = originalQuery
  }

  assert.match(capturedQuery.sql, /user_id = \$1/)
  assert.match(capturedQuery.sql, /title ILIKE \$4 OR description ILIKE \$4/)
  assert.match(capturedQuery.sql, /due_date <= \$5/)
  assert.match(capturedQuery.sql, /due_date >= \$6/)
  assert.match(capturedQuery.sql, /LIMIT 25$/)
  assert.deepEqual(capturedQuery.values, [
    'user-id',
    'pending',
    'high',
    '%design%',
    '2026-12-31',
    '2026-01-01',
  ])
})

test('get task includes the owner ID and returns 404 when no owned row exists', async () => {
  const originalQuery = pool.query.bind(pool)
  let captured
  pool.query = async (sql, values) => {
    captured = { sql, values }
    return { rows: [] }
  }
  try {
    await assert.rejects(tasks.getTask('user-a', 'task-id'), { statusCode: 404 })
  } finally {
    pool.query = originalQuery
  }
  assert.match(captured.sql, /user_id = \$1 AND id = \$2/)
  assert.deepEqual(captured.values, ['user-a', 'task-id'])
})

test('task updates only interpolate known column names and keep values parameterized', async () => {
  const originalQuery = pool.query.bind(pool)
  let captured
  pool.query = async (sql, values) => {
    captured = { sql, values }
    return { rows: [{ id: 'task-id' }] }
  }
  try {
    await tasks.updateTask('user-a', 'task-id', { title: 'New title', dueDate: null })
    await assert.rejects(tasks.updateTask('user-a', 'task-id', {}), { statusCode: 400 })
  } finally {
    pool.query = originalQuery
  }
  assert.match(captured.sql, /title = \$3, due_date = \$4, updated_at = now\(\)/)
  assert.deepEqual(captured.values, ['user-a', 'task-id', 'New title', null])
})
