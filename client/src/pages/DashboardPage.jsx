import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'
import { useAuth } from '../context/useAuth.js'
import { EmptyState, ErrorMessage, LoadingState } from '../components/States.jsx'

const cards = [
  { key: 'total', label: 'Total tasks', icon: '☷', color: 'blue' },
  { key: 'completed', label: 'Completed', icon: '✓', color: 'green' },
  { key: 'pending', label: 'To do', icon: '◷', color: 'amber' },
  { key: 'dueSoon', label: 'Due soon', icon: '↗', color: 'violet' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [statsResponse, tasksResponse] = await Promise.all([
        api.getStats(),
        api.getTasks({ limit: '5' }),
      ])
      setData({ stats: statsResponse.stats, tasks: tasksResponse.tasks })
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([api.getStats(), api.getTasks({ limit: '5' })])
      .then(([statsResponse, tasksResponse]) => {
        if (active) setData({ stats: statsResponse.stats, tasks: tasksResponse.tasks })
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])
  const greeting = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
  return (
    <>
      <div className="page-heading dashboard-heading">
        <div>
          <p className="eyebrow">{greeting.toUpperCase()}</p>
          <h1>
            Good to see you, {user?.name?.split(' ')[0]}
            <span>.</span>
          </h1>
          <p>Here&apos;s a snapshot of what you&apos;re working on.</p>
        </div>
        <Link className="button button-primary" to="/app/tasks?new=1">
          ＋ Create a task
        </Link>
      </div>
      {error && <ErrorMessage message={error} onRetry={load} />}
      {loading ? (
        <LoadingState label="Loading your workspace…" />
      ) : (
        data &&
        !error && (
          <>
            <section className="stats-grid" aria-label="Task statistics">
              {cards.map((card) => (
                <article className="stat-card" key={card.key}>
                  <div className={`stat-icon ${card.color}`}>{card.icon}</div>
                  <div>
                    <span>{card.label}</span>
                    <strong>{data.stats[card.key]}</strong>
                  </div>
                  <small>YOUR TASKS</small>
                </article>
              ))}
            </section>
            <section className="completion-card">
              <div className="completion-copy">
                <div>
                  <p className="eyebrow">YOUR MOMENTUM</p>
                  <h2>Progress, one task at a time.</h2>
                  <p>Keep moving at a pace that works for you.</p>
                </div>
                <div className="completion-percent">
                  {data.stats.completionPercentage}
                  <span>%</span>
                </div>
              </div>
              <div
                className="completion-track"
                role="progressbar"
                aria-label="Task completion"
                aria-valuenow={data.stats.completionPercentage}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <i style={{ width: `${data.stats.completionPercentage}%` }} />
              </div>
              <div className="completion-foot">
                <span>
                  {data.stats.completed} of {data.stats.total} tasks completed
                </span>
                <Link to="/app/tasks">
                  View all tasks <span aria-hidden="true">→</span>
                </Link>
              </div>
            </section>
            <section className="recent-section">
              <div className="section-row">
                <div>
                  <p className="eyebrow">YOUR WORKSPACE</p>
                  <h2>Recent tasks</h2>
                </div>
                <Link to="/app/tasks" className="text-link">
                  See all tasks <span aria-hidden="true">→</span>
                </Link>
              </div>
              {data.tasks.length ? (
                <div className="dashboard-task-list">
                  {data.tasks.slice(0, 4).map((task) => (
                    <Link className="dashboard-task-row" to="/app/tasks" key={task.id}>
                      <span
                        className={`mini-task-check${task.status === 'completed' ? ' checked' : ''}`}
                      >
                        {task.status === 'completed' ? '✓' : ''}
                      </span>
                      <span className="dashboard-task-title">
                        {task.title}
                        <small>
                          {task.dueDate
                            ? `Due ${new Date(`${task.dueDate}T00:00:00`).toLocaleDateString()}`
                            : 'No due date'}
                        </small>
                      </span>
                      <span className={`status-label status-${task.status}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span
                        className={`priority-dot priority-dot-${task.priority}`}
                        aria-label={`${task.priority} priority`}
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="A clear space to start"
                  description="Create your first task to see your work take shape."
                  action={
                    <Link to="/app/tasks?new=1" className="text-link">
                      Create a task →
                    </Link>
                  }
                />
              )}
            </section>
            <div className="dashboard-disclaimer">
              Your statistics and tasks are calculated from your account&apos;s database records.
            </div>
          </>
        )
      )}
    </>
  )
}
