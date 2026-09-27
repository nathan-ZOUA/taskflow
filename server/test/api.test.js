import assert from 'node:assert/strict'
import { once } from 'node:events'
import { after, before, test } from 'node:test'

process.env.DATABASE_URL ||= 'postgresql://taskflow_test:unused@127.0.0.1:5432/taskflow_test'
process.env.JWT_SECRET ||= 'taskflow-api-test-secret-that-is-at-least-32-characters'
process.env.CLIENT_ORIGIN ||= 'http://127.0.0.1:5173'

const [{ default: app }, { pool }, authService, bcrypt] = await Promise.all([
  import('../src/app.js'),
  import('../src/db/pool.js'),
  import('../src/services/auth.service.js'),
  import('bcryptjs'),
])

let server
let baseUrl

async function withQueryMock(mockQuery, callback) {
  const originalQuery = pool.query
  pool.query = mockQuery
  try {
    return await callback()
  } finally {
    pool.query = originalQuery
  }
}

before(async () => {
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  server.close()
  await once(server, 'close')
  await pool.end()
})

test('root reports the API name and demonstration status', async () => {
  const response = await fetch(baseUrl)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    name: 'TaskFlow API',
    message: 'TaskFlow personal demonstration API.',
  })
  assert.equal(response.headers.get('x-powered-by'), null)
})

test('invalid registration and login requests are rejected before database access', async () => {
  const registration = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'A', email: 'invalid', password: 'short' }),
  })
  assert.equal(registration.status, 400)
  assert.match((await registration.json()).error.message, /Name must/)

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'invalid', password: 'password' }),
  })
  assert.equal(login.status, 400)
  assert.match((await login.json()).error.message, /valid email/)
})

test('invalid JSON receives a client error response', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  })
  assert.equal(response.status, 400)
  assert.ok((await response.json()).error.message)
})

test('health reports whether PostgreSQL is reachable', async () => {
  const response = await fetch(`${baseUrl}/api/health`)
  const result = await response.json()
  assert.ok([200, 503].includes(response.status))
  if (response.status === 200) {
    assert.equal(result.service, 'TaskFlow API')
    assert.equal(result.database, 'connected')
  } else {
    assert.equal(result.service, 'TaskFlow API')
    assert.equal(result.database, 'unavailable')
  }
})

test('private account and task routes reject requests without a session', async () => {
  const [account, tasks, stats] = await Promise.all([
    fetch(`${baseUrl}/api/auth/me`),
    fetch(`${baseUrl}/api/tasks`),
    fetch(`${baseUrl}/api/tasks/stats`),
  ])
  assert.deepEqual([account.status, tasks.status, stats.status], [401, 401, 401])
})

test('registration hashes the password, returns a safe user and creates an HTTP-only session', async () => {
  let savedUser
  await withQueryMock(
    async (sql, values) => {
      if (sql.startsWith('INSERT INTO users')) {
        savedUser = {
          id: values[0],
          name: values[1],
          email: values[2],
          password_hash: values[3],
          created_at: new Date('2026-01-01T00:00:00.000Z'),
        }
        return {
          rows: [
            {
              id: savedUser.id,
              name: savedUser.name,
              email: savedUser.email,
              created_at: savedUser.created_at,
            },
          ],
        }
      }
      if (sql.startsWith('SELECT id, name, email, created_at FROM users WHERE id')) {
        return { rows: [savedUser] }
      }
      if (sql.includes('FROM users WHERE lower(email)')) {
        return { rows: [savedUser] }
      }
      throw new Error(`Unexpected account query: ${sql}`)
    },
    async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jordan Reed',
          email: 'JORDAN@example.com',
          password: 'safe-test-password',
        }),
      })
      assert.equal(response.status, 201)
      const { user } = await response.json()
      assert.equal(user.email, 'jordan@example.com')
      assert.equal('password' in user, false)
      assert.equal('password_hash' in user, false)
      assert.notEqual(savedUser.password_hash, 'safe-test-password')
      assert.equal(
        await bcrypt.default.compare('safe-test-password', savedUser.password_hash),
        true,
      )

      const cookie = response.headers.get('set-cookie')
      assert.match(cookie, /HttpOnly/i)
      const session = cookie.split(';')[0]
      const current = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: session } })
      assert.equal(current.status, 200)
      assert.equal((await current.json()).user.id, user.id)

      const login = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'jordan@example.com', password: 'safe-test-password' }),
      })
      assert.equal(login.status, 200)
      assert.match(login.headers.get('set-cookie'), /HttpOnly/i)

      const wrongPassword = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'jordan@example.com', password: 'incorrect-password' }),
      })
      assert.equal(wrongPassword.status, 401)

      const logout = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: session },
      })
      assert.equal(logout.status, 204)
      assert.match(logout.headers.get('set-cookie'), /taskflow_session=;/)
    },
  )
})

test('duplicate registration is translated to HTTP 409', async () => {
  await withQueryMock(
    async () => {
      const error = new Error('unique constraint')
      error.code = '23505'
      throw error
    },
    async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jordan Reed',
          email: 'jordan@example.com',
          password: 'safe-test-password',
        }),
      })
      assert.equal(response.status, 409)
      assert.match((await response.json()).error.message, /already exists/)
    },
  )
})

test('authenticated task endpoints create, read, update, scope, count and delete tasks', async () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000'
  const otherUserId = '550e8400-e29b-41d4-a716-446655440001'
  const token = authService.createAuthToken({ id: userId })
  const otherToken = authService.createAuthToken({ id: otherUserId })
  const cookie = (value) => ({ Cookie: `taskflow_session=${value}` })
  const storedTasks = []

  await withQueryMock(
    async (sql, values) => {
      if (sql.startsWith('INSERT INTO tasks')) {
        const task = {
          id: values[0],
          userId: values[1],
          title: values[2],
          description: values[3],
          status: values[4],
          priority: values[5],
          dueDate: values[6],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        storedTasks.push(task)
        return { rows: [task] }
      }
      if (sql.startsWith('SELECT count(*)')) {
        const own = storedTasks.filter((task) => task.userId === values[0])
        const completed = own.filter((task) => task.status === 'completed').length
        return {
          rows: [
            {
              total: own.length,
              completed,
              pending: own.filter((task) => task.status === 'pending').length,
              inProgress: own.filter((task) => task.status === 'in_progress').length,
              dueSoon: 0,
            },
          ],
        }
      }
      if (sql.startsWith('SELECT') && sql.includes('FROM tasks WHERE user_id = $1 AND id = $2')) {
        return {
          rows: storedTasks.filter((task) => task.userId === values[0] && task.id === values[1]),
        }
      }
      if (sql.startsWith('SELECT') && sql.includes('FROM tasks WHERE user_id = $1 ORDER BY')) {
        return { rows: storedTasks.filter((task) => task.userId === values[0]) }
      }
      if (sql.startsWith('UPDATE tasks SET')) {
        const task = storedTasks.find((item) => item.userId === values[0] && item.id === values[1])
        if (!task) return { rows: [] }
        for (const [, column, position] of sql.matchAll(
          /(title|description|status|priority|due_date) = \$(\d+)/g,
        )) {
          const field = column === 'due_date' ? 'dueDate' : column
          task[field] = values[Number(position) - 1]
        }
        task.updatedAt = new Date().toISOString()
        return { rows: [task] }
      }
      if (sql.startsWith('DELETE FROM tasks')) {
        const index = storedTasks.findIndex(
          (task) => task.userId === values[0] && task.id === values[1],
        )
        if (index < 0) return { rowCount: 0 }
        storedTasks.splice(index, 1)
        return { rowCount: 1 }
      }
      throw new Error(`Unexpected task query: ${sql}`)
    },
    async () => {
      const missingTitle = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: { ...cookie(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'A title is required' }),
      })
      assert.equal(missingTitle.status, 400)

      const invalidId = await fetch(`${baseUrl}/api/tasks/not-a-uuid`, { headers: cookie(token) })
      assert.equal(invalidId.status, 400)

      const invalidFilter = await fetch(`${baseUrl}/api/tasks?status=blocked`, {
        headers: cookie(token),
      })
      assert.equal(invalidFilter.status, 400)

      const create = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: { ...cookie(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Write a test',
          description: 'API flow',
          dueDate: '2026-12-31',
        }),
      })
      assert.equal(create.status, 201)
      const { task } = await create.json()

      const list = await fetch(`${baseUrl}/api/tasks`, { headers: cookie(token) })
      assert.equal((await list.json()).tasks.length, 1)
      const detail = await fetch(`${baseUrl}/api/tasks/${task.id}`, { headers: cookie(token) })
      assert.equal((await detail.json()).task.title, 'Write a test')

      const foreignRead = await fetch(`${baseUrl}/api/tasks/${task.id}`, {
        headers: cookie(otherToken),
      })
      assert.equal(foreignRead.status, 404)

      const missingTask = await fetch(`${baseUrl}/api/tasks/550e8400-e29b-41d4-a716-446655440099`, {
        headers: cookie(token),
      })
      assert.equal(missingTask.status, 404)

      const update = await fetch(`${baseUrl}/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { ...cookie(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', priority: 'high' }),
      })
      assert.equal(update.status, 200)
      assert.equal((await update.json()).task.status, 'completed')

      const stats = await fetch(`${baseUrl}/api/tasks/stats`, { headers: cookie(token) })
      assert.equal((await stats.json()).stats.completionPercentage, 100)

      const remove = await fetch(`${baseUrl}/api/tasks/${task.id}`, {
        method: 'DELETE',
        headers: cookie(token),
      })
      assert.equal(remove.status, 204)
      assert.equal(
        (await (await fetch(`${baseUrl}/api/tasks`, { headers: cookie(token) })).json()).tasks
          .length,
        0,
      )
    },
  )
})

test('unknown API routes return a JSON 404 response', async () => {
  const response = await fetch(`${baseUrl}/api/not-a-route`)
  assert.equal(response.status, 404)
  assert.match((await response.json()).error.message, /Route not found/)
})
