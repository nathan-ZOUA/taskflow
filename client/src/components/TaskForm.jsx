import { useEffect, useRef, useState } from 'react'
import { Button } from './Button.jsx'
import { SelectField } from './FormField.jsx'

export default function TaskForm({ task, onSave, onCancel }) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const titleRef = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement
    titleRef.current?.focus()
    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        onCancel()
        return
      }
      if (event.key !== 'Tab') return

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)',
      )
      const first = focusableElements?.[0]
      const last = focusableElements?.[focusableElements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [onCancel])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const values = {
      title: String(form.get('title')).trim(),
      description: String(form.get('description')).trim(),
      status: String(form.get('status')),
      priority: String(form.get('priority')),
      dueDate: String(form.get('dueDate')) || null,
    }
    if (!values.title) return setError('Add a title for this task.')
    setSaving(true)
    try {
      await onSave(values)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <section
        ref={dialogRef}
        className="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">TASK DETAILS</p>
            <h2 id="task-modal-title">{task ? 'Edit task' : 'Create a task'}</h2>
          </div>
          <button
            className="modal-close"
            type="button"
            aria-label="Close dialog"
            onClick={onCancel}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="task-form">
          <label className="field" htmlFor="task-title">
            <span>Title</span>
            <input
              ref={titleRef}
              id="task-title"
              name="title"
              maxLength="120"
              required
              defaultValue={task?.title || ''}
              placeholder="What needs to get done?"
            />
          </label>
          <label className="field" htmlFor="task-description">
            <span>
              Description <small>(optional)</small>
            </span>
            <textarea
              id="task-description"
              name="description"
              maxLength="2000"
              rows="4"
              defaultValue={task?.description || ''}
              placeholder="Add a few useful details…"
            />
          </label>
          <div className="form-grid two-columns">
            <SelectField
              id="task-status"
              name="status"
              label="Status"
              defaultValue={task?.status || 'pending'}
            >
              <option value="pending">To do</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </SelectField>
            <SelectField
              id="task-priority"
              name="priority"
              label="Priority"
              defaultValue={task?.priority || 'medium'}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </SelectField>
          </div>
          <label className="field" htmlFor="task-due-date">
            <span>
              Due date <small>(optional)</small>
            </span>
            <input
              id="task-due-date"
              name="dueDate"
              type="date"
              defaultValue={task?.dueDate || ''}
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <Button variant="quiet" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : task ? 'Save changes' : 'Create task'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
