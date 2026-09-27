import * as tasksService from '../services/tasks.service.js'
import {
  allowedTaskPriorities,
  allowedTaskStatuses,
  isValidDate,
  validateTask,
  validateUuid,
} from '../utils/validation.js'
import { HttpError } from '../utils/httpError.js'

function validateDateQuery(value, name) {
  if (!value) return undefined
  if (!isValidDate(value)) {
    throw new HttpError(400, `${name} must use YYYY-MM-DD format.`)
  }
  return value
}

export async function list(request, response) {
  const { status, priority, search, dueBefore, dueAfter, limit } = request.query
  if (status && !allowedTaskStatuses.includes(status))
    throw new HttpError(400, 'Invalid task status filter.')
  if (priority && !allowedTaskPriorities.includes(priority))
    throw new HttpError(400, 'Invalid task priority filter.')
  if (search && (typeof search !== 'string' || search.length > 100))
    throw new HttpError(400, 'Search must be 100 characters or fewer.')
  if (limit && (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 100))
    throw new HttpError(400, 'Limit must be a whole number between 1 and 100.')
  response.json({
    tasks: await tasksService.listTasks(request.user.id, {
      status,
      priority,
      search: typeof search === 'string' ? search.trim() : undefined,
      dueBefore: validateDateQuery(dueBefore, 'dueBefore'),
      dueAfter: validateDateQuery(dueAfter, 'dueAfter'),
      limit,
    }),
  })
}

export async function getById(request, response) {
  const taskId = validateUuid(request.params.id)
  response.json({ task: await tasksService.getTask(request.user.id, taskId) })
}

export async function create(request, response) {
  const task = await tasksService.createTask(request.user.id, validateTask(request.body))
  response.status(201).json({ task })
}

export async function update(request, response) {
  const taskId = validateUuid(request.params.id)
  const changes = validateTask(request.body, { partial: true })
  response.json({ task: await tasksService.updateTask(request.user.id, taskId, changes) })
}

export async function remove(request, response) {
  const taskId = validateUuid(request.params.id)
  await tasksService.deleteTask(request.user.id, taskId)
  response.status(204).end()
}

export async function stats(request, response) {
  response.json({ stats: await tasksService.getTaskStats(request.user.id) })
}
