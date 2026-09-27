import { HttpError } from './httpError.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const taskStatuses = ['pending', 'in_progress', 'completed']
const taskPriorities = ['low', 'medium', 'high']

function requireObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object.')
  }
  return body
}

export function validateRegistration(body = {}) {
  body = requireObject(body)
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (name.length < 2 || name.length > 80)
    throw new HttpError(400, 'Name must be between 2 and 80 characters.')
  if (email.length > 254 || !emailPattern.test(email))
    throw new HttpError(400, 'Enter a valid email address.')
  if (password.length < 10 || Buffer.byteLength(password, 'utf8') > 72)
    throw new HttpError(400, 'Password must be at least 10 characters and no more than 72 bytes.')
  return { name, email, password }
}

export function validateLogin(body = {}) {
  body = requireObject(body)
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!emailPattern.test(email) || !password || Buffer.byteLength(password, 'utf8') > 72)
    throw new HttpError(400, 'A valid email and password are required.')
  return { email, password }
}

export function validateTask(body = {}, { partial = false } = {}) {
  body = requireObject(body)
  const task = {}
  if (!partial || body.title !== undefined) {
    task.title = typeof body.title === 'string' ? body.title.trim() : ''
    if (task.title.length < 1 || task.title.length > 120)
      throw new HttpError(400, 'Task title must be between 1 and 120 characters.')
  }
  if (!partial || body.description !== undefined) {
    task.description = typeof body.description === 'string' ? body.description.trim() : ''
    if (task.description.length > 2000)
      throw new HttpError(400, 'Description must be 2,000 characters or fewer.')
  }
  if (!partial || body.status !== undefined) {
    task.status = body.status ?? 'pending'
    if (!taskStatuses.includes(task.status))
      throw new HttpError(400, 'Status must be pending, in_progress or completed.')
  }
  if (!partial || body.priority !== undefined) {
    task.priority = body.priority ?? 'medium'
    if (!taskPriorities.includes(task.priority))
      throw new HttpError(400, 'Priority must be low, medium or high.')
  }
  if (!partial || body.dueDate !== undefined) {
    const value = body.dueDate ?? null
    if (value !== null && !isValidDate(value)) {
      throw new HttpError(400, 'Due date must be a valid date in YYYY-MM-DD format.')
    }
    task.dueDate = value
  }
  return task
}

export function validateUuid(value) {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new HttpError(400, 'A valid task ID is required.')
  }
  return value
}

export function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

export const allowedTaskStatuses = taskStatuses
export const allowedTaskPriorities = taskPriorities
