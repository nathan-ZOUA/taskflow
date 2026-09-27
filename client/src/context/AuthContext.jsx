import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './auth-context.js'
import { api } from '../services/api.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true
    api
      .currentUser()
      .then((data) => {
        if (active) {
          setUser(data.user)
          setStatus('authenticated')
        }
      })
      .catch(() => {
        if (active) {
          setUser(null)
          setStatus('anonymous')
        }
      })
    const handleUnauthorized = () => {
      setUser(null)
      setStatus('anonymous')
    }
    window.addEventListener('taskflow:unauthorized', handleUnauthorized)
    return () => {
      active = false
      window.removeEventListener('taskflow:unauthorized', handleUnauthorized)
    }
  }, [])

  const signIn = useCallback(async (values) => {
    const data = await api.login(values)
    setUser(data.user)
    setStatus('authenticated')
    return data.user
  }, [])

  const signUp = useCallback(async (values) => {
    const data = await api.register(values)
    setUser(data.user)
    setStatus('authenticated')
    return data.user
  }, [])

  const signOut = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  const value = useMemo(
    () => ({ user, status, signIn, signUp, signOut }),
    [user, status, signIn, signUp, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
