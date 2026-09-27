import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../services/api.js'
import { Button } from '../components/Button.jsx'
import { SelectField } from '../components/FormField.jsx'
import TaskCard from '../components/TaskCard.jsx'
import TaskForm from '../components/TaskForm.jsx'
import { EmptyState, ErrorMessage, LoadingState } from '../components/States.jsx'

export default function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [editing, setEditing] = useState(() =>
    new URLSearchParams(window.location.search).get('new') === '1' ? 'new' : null,
  )

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await api.getTasks({ search, status, priority })
      setTasks(result.tasks)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [search, status, priority])

  useEffect(() => {
    const timer = window.setTimeout(loadTasks, 220)
    return () => window.clearTimeout(timer)
  }, [loadTasks])

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  async function saveTask(values) {
    if (editing === 'new') await api.createTask(values)
    else await api.updateTask(editing.id, values)
    setEditing(null)
    await loadTasks()
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return
    try {
      await api.deleteTask(task.id)
      await loadTasks()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  async function changeStatus(task, nextStatus) {
    try {
      await api.updateTask(task.id, { status: nextStatus })
      await loadTasks()
    } catch (updateError) {
      setError(updateError.message)
    }
  }

  const hasFilters = search || status || priority
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">STAY IN YOUR FLOW</p>
          <h1>
            My tasks<span>.</span>
          </h1>
          <p>Organize the next steps that matter to you.</p>
        </div>
        <Button onClick={() => setEditing('new')}>＋ New task</Button>
      </div>
      <section className="task-toolbar" aria-label="Task filters">
        <label className="search-field">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label="Search tasks"
            placeholder="Search your tasks…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <SelectField
          id="filter-status"
          label="Filter by status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="pending">To do</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </SelectField>
        <SelectField
          id="filter-priority"
          label="Filter by priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </SelectField>
      </section>
      {error && <ErrorMessage message={error} onRetry={loadTasks} />}
      {loading ? (
        <LoadingState label="Loading your tasks…" />
      ) : error ? null : tasks.length ? (
        <section className="task-list" aria-label="Tasks">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={setEditing}
              onDelete={deleteTask}
              onStatusChange={changeStatus}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          title={hasFilters ? 'No tasks match these filters' : 'Your task list is ready'}
          description={
            hasFilters
              ? 'Try another search or clear your filters.'
              : 'Add a task to keep your next steps in one place.'
          }
          action={
            hasFilters ? (
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setSearch('')
                  setStatus('')
                  setPriority('')
                }}
              >
                Clear filters
              </button>
            ) : (
              <Button onClick={() => setEditing('new')}>＋ Create your first task</Button>
            )
          }
        />
      )}
      {editing && (
        <TaskForm
          task={editing === 'new' ? null : editing}
          onSave={saveTask}
          onCancel={() => setEditing(null)}
        />
      )}
    </>
  )
}
