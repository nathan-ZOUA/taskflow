const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json')
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (
    response.status === 401 &&
    !path.startsWith('/auth/login') &&
    !path.startsWith('/auth/register')
  ) {
    window.dispatchEvent(new Event('taskflow:unauthorized'))
  }
  if (response.status === 204) return null

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error?.message || 'The request could not be completed.')
  return data
}

export const api = {
  health: () => request('/health'),
  currentUser: () => request('/auth/me'),
  register: (values) => request('/auth/register', { method: 'POST', body: JSON.stringify(values) }),
  login: (values) => request('/auth/login', { method: 'POST', body: JSON.stringify(values) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getTasks: (filters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    return request(`/tasks${params.size ? `?${params}` : ''}`)
  },
  getTask: (id) => request(`/tasks/${id}`),
  createTask: (values) => request('/tasks', { method: 'POST', body: JSON.stringify(values) }),
  updateTask: (id, values) =>
    request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(values) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  getStats: () => request('/tasks/stats'),
}
