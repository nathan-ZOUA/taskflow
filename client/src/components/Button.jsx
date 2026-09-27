export function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button className={`button button-${variant} ${className}`.trim()} type={type} {...props}>
      {children}
    </button>
  )
}

export function IconButton({ label, children, className = '', ...props }) {
  return (
    <button
      className={`icon-button ${className}`.trim()}
      type="button"
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  )
}
