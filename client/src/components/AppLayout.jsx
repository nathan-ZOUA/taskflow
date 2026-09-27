import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { Button } from './Button.jsx'

const navigation = [
  { to: '/app', label: 'Overview', icon: '◫', end: true },
  { to: '/app/tasks', label: 'My tasks', icon: '☷' },
  { to: '/app/profile', label: 'Profile', icon: '◎' },
]

function Sidebar({ closeMenu }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <>
      <div className="sidebar-brand">
        <a href="/" className="brand">
          <span className="brand-symbol">T</span>
          <span>TaskFlow</span>
        </a>
        <span className="demo-badge">DEMO</span>
      </div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-navigation" aria-label="Main navigation">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={closeMenu}
            className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="user-card">
          <div className="avatar">{user?.name?.charAt(0).toUpperCase() || '?'}</div>
          <div className="user-card-copy">
            <strong>{user?.name}</strong>
            <small>{user?.email}</small>
          </div>
        </div>
        <Button
          variant="quiet"
          className="logout-button"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? 'Signing out…' : '↪  Log out'}
        </Button>
      </div>
    </>
  )
}

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const title =
    navigation.find((item) => item.to === location.pathname)?.label ||
    (location.pathname.includes('tasks') ? 'My tasks' : 'Profile')
  return (
    <div className="app-frame">
      <aside className={`sidebar${menuOpen ? ' sidebar-open' : ''}`}>
        <Sidebar closeMenu={() => setMenuOpen(false)} />
      </aside>
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <main className="app-main">
        <header className="app-topbar">
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
          <span className="mobile-brand">
            <span className="brand-symbol">T</span>TaskFlow
          </span>
          <div className="topbar-page-title">{title}</div>
          <div className="topbar-right">
            <span className="topbar-demo">PERSONAL DEMO</span>
            <span className="topbar-avatar">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
