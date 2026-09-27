import { IconButton } from './Button.jsx'

const statusLabels = { pending: 'To do', in_progress: 'In progress', completed: 'Completed' }

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const isCompleted = task.status === 'completed'
  const dueLabel = task.dueDate
    ? new Date(`${task.dueDate}T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No due date'
  return (
    <article className={`task-card${isCompleted ? ' task-completed' : ''}`}>
      <button
        className={`task-check${isCompleted ? ' checked' : ''}`}
        type="button"
        aria-label={isCompleted ? 'Mark task as pending' : 'Mark task as completed'}
        onClick={() => onStatusChange(task, isCompleted ? 'pending' : 'completed')}
      >
        {isCompleted ? '✓' : ''}
      </button>
      <div className="task-copy">
        <div className="task-heading-row">
          <h3>{task.title}</h3>
          <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
        </div>
        {task.description && <p>{task.description}</p>}
        <div className="task-meta">
          <span className={`status-label status-${task.status}`}>{statusLabels[task.status]}</span>
          <span className="task-due">{task.dueDate ? `Due ${dueLabel}` : dueLabel}</span>
        </div>
      </div>
      <div className="task-actions">
        <IconButton label="Edit task" onClick={() => onEdit(task)}>
          ✎
        </IconButton>
        <IconButton label="Delete task" onClick={() => onDelete(task)}>
          ⌫
        </IconButton>
      </div>
    </article>
  )
}
