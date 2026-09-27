export function FormField({ label, id, hint, ...props }) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} name={id} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </label>
  )
}

export function SelectField({ label, id, name = id, children, ...props }) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} name={name} {...props}>
        {children}
      </select>
    </label>
  )
}
