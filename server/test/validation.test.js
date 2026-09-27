import assert from 'node:assert/strict'
import test from 'node:test'
import {
  validateLogin,
  validateRegistration,
  validateTask,
  validateUuid,
} from '../src/utils/validation.js'

test('registration trims names and normalizes email addresses', () => {
  assert.deepEqual(
    validateRegistration({
      name: '  Taylor Reed ',
      email: 'TAYLOR@example.com',
      password: 'long-enough-password',
    }),
    {
      name: 'Taylor Reed',
      email: 'taylor@example.com',
      password: 'long-enough-password',
    },
  )
})

test('registration rejects invalid email addresses and short passwords', () => {
  assert.throws(
    () =>
      validateRegistration({
        name: 'Taylor',
        email: 'not-an-email',
        password: 'long-enough-password',
      }),
    { statusCode: 400 },
  )
  assert.throws(
    () => validateRegistration({ name: 'Taylor', email: 'taylor@example.com', password: 'short' }),
    { statusCode: 400 },
  )
  assert.throws(
    () =>
      validateRegistration({
        name: 'Taylor',
        email: 'taylor@example.com',
        password: 'é'.repeat(40),
      }),
    { statusCode: 400 },
  )
})

test('login requires a valid email and a password', () => {
  assert.deepEqual(validateLogin({ email: ' TAYLOR@example.com ', password: 'password' }), {
    email: 'taylor@example.com',
    password: 'password',
  })
  assert.throws(() => validateLogin({ email: 'bad', password: 'password' }), { statusCode: 400 })
  assert.throws(() => validateLogin({ email: 'taylor@example.com', password: 'x'.repeat(73) }), {
    statusCode: 400,
  })
})

test('task validation supplies defaults and accepts valid values', () => {
  assert.deepEqual(validateTask({ title: '  Write tests  ', dueDate: '2026-02-28' }), {
    title: 'Write tests',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: '2026-02-28',
  })
})

test('task validation rejects blank titles, invalid enums and impossible dates', () => {
  assert.throws(() => validateTask({ title: '   ' }), { statusCode: 400 })
  assert.throws(() => validateTask({ title: 'Task', status: 'blocked' }), { statusCode: 400 })
  assert.throws(() => validateTask({ title: 'Task', priority: 'urgent' }), { statusCode: 400 })
  assert.throws(() => validateTask({ title: 'Task', dueDate: '2026-02-31' }), { statusCode: 400 })
})

test('task IDs must be valid UUIDs', () => {
  assert.equal(
    validateUuid('550e8400-e29b-41d4-a716-446655440000'),
    '550e8400-e29b-41d4-a716-446655440000',
  )
  assert.throws(() => validateUuid('task-1'), { statusCode: 400 })
})

test('request validators reject non-object JSON bodies', () => {
  assert.throws(() => validateRegistration(null), { statusCode: 400 })
  assert.throws(() => validateLogin([]), { statusCode: 400 })
  assert.throws(() => validateTask([]), { statusCode: 400 })
})

test('registration respects bcrypt password byte limits', () => {
  assert.throws(
    () =>
      validateRegistration({
        name: 'Taylor',
        email: 'taylor@example.com',
        password: '\u00e9'.repeat(37),
      }),
    { statusCode: 400 },
  )
})
