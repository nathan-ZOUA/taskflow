export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="state-card" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  )
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-message" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button className="text-button" type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-mark" aria-hidden="true">
        ✓
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
