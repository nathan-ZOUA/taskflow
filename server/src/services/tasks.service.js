import { randomUUID } from 'node:crypto'
import { pool } from '../db/pool.js'
import { HttpError } from '../utils/httpError.js'

const taskFields = `id, user_id AS "userId", title, description, status, priority,
  to_char(due_date, 'YYYY-MM-DD') AS "dueDate", created_at AS "createdAt", updated_at AS "updatedAt"`

export async function listTasks(userId, filters) {
  const conditions = ['user_id = $1']
  const values = [userId]
  const addCondition = (sql, value) => {
    values.push(value)
    conditions.push(sql.replace('?', `$${values.length}`))
  }
  if (filters.status) addCondition('status = ?', filters.status)
  if (filters.priority) addCondition('priority = ?', filters.priority)
  if (filters.search) {
    values.push(`%${filters.search}%`)
    const parameter = `$${values.length}`
    conditions.push(`(title ILIKE ${parameter} OR description ILIKE ${parameter})`)
  }
  if (filters.dueBefore) addCondition('due_date <= ?', filters.dueBefore)
  if (filters.dueAfter) addCondition('due_date >= ?', filters.dueAfter)

  const where = conditions.join(' AND ')
  const limit = Math.min(Math.max(Number.parseInt(filters.limit, 10) || 100, 1), 100)
  const { rows } = await pool.query(
    `SELECT ${taskFields} FROM tasks WHERE ${where} ORDER BY due_date NULLS LAST, created_at DESC LIMIT ${limit}`,
    values,
  )
  return rows
}

export async function getTask(userId, taskId) {
  const { rows } = await pool.query(
    `SELECT ${taskFields} FROM tasks WHERE user_id = $1 AND id = $2`,
    [userId, taskId],
  )
  if (!rows[0]) throw new HttpError(404, 'Task not found.')
  return rows[0]
}

export async function createTask(userId, task) {
  const { rows } = await pool.query(
    `INSERT INTO tasks (id, user_id, title, description, status, priority, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${taskFields}`,
    [randomUUID(), userId, task.title, task.description, task.status, task.priority, task.dueDate],
  )
  return rows[0]
}

export async function updateTask(userId, taskId, changes) {
  const columns = {
    title: 'title',
    description: 'description',
    status: 'status',
    priority: 'priority',
    dueDate: 'due_date',
  }
  const updates = Object.entries(changes).filter(([key]) => columns[key])
  if (updates.length === 0) throw new HttpError(400, 'Provide at least one task field to update.')
  const values = [userId, taskId]
  const setClauses = updates.map(([key, value]) => {
    values.push(value)
    return `${columns[key]} = $${values.length}`
  })
  setClauses.push('updated_at = now()')
  const { rows } = await pool.query(
    `UPDATE tasks SET ${setClauses.join(', ')} WHERE user_id = $1 AND id = $2 RETURNING ${taskFields}`,
    values,
  )
  if (!rows[0]) throw new HttpError(404, 'Task not found.')
  return rows[0]
}

export async function deleteTask(userId, taskId) {
  const { rowCount } = await pool.query('DELETE FROM tasks WHERE user_id = $1 AND id = $2', [
    userId,
    taskId,
  ])
  if (!rowCount) throw new HttpError(404, 'Task not found.')
}

export async function getTaskStats(userId) {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS total,
      count(*) FILTER (WHERE status = 'completed')::int AS completed,
      count(*) FILTER (WHERE status = 'pending')::int AS pending,
      count(*) FILTER (WHERE status = 'in_progress')::int AS "inProgress",
      count(*) FILTER (WHERE status <> 'completed' AND due_date >= CURRENT_DATE AND due_date < CURRENT_DATE + 7)::int AS "dueSoon"
     FROM tasks WHERE user_id = $1`,
    [userId],
  )
  const stats = rows[0]
  return {
    ...stats,
    completionPercentage: stats.total ? Math.round((stats.completed / stats.total) * 100) : 0,
  }
}
