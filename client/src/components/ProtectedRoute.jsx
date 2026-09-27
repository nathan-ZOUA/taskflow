import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { LoadingState } from './States.jsx'

export default function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <LoadingState label="Restoring your session…" />
  return status === 'authenticated' ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  )
}
