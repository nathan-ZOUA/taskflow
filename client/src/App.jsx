import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import { LoginPage, RegisterPage } from './pages/AuthPages.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import TasksPage from './pages/TasksPage.jsx'

function PageTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const section = pathname.startsWith('/app/tasks')
      ? 'Tasks'
      : pathname.startsWith('/app/profile')
        ? 'Profile'
        : pathname.startsWith('/app')
          ? 'Dashboard'
          : pathname === '/login'
            ? 'Sign in'
            : pathname === '/register'
              ? 'Create account'
              : ''
    document.title = section ? `${section} · TaskFlow` : 'TaskFlow — Personal Demonstration Project'
  }, [pathname])
  return null
}

function AppRoutes() {
  return (
    <>
      <PageTitle />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
