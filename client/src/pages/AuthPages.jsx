import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { Button } from '../components/Button.jsx'
import { FormField } from '../components/FormField.jsx'

function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const values = Object.fromEntries(form.entries())
    try {
      if (isRegister && values.password !== values.confirmPassword)
        throw new Error('The passwords do not match.')
      delete values.confirmPassword
      await (isRegister ? signUp(values) : signIn(values))
      navigate(location.state?.from?.pathname || '/app', { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-aside">
        <Link className="brand" to="/">
          <span className="brand-symbol">T</span>
          <span>TaskFlow</span>
        </Link>
        <div className="auth-aside-copy">
          <p className="eyebrow">MAKE ROOM FOR WHAT MATTERS</p>
          <h1>
            A calmer way
            <br />
            to move work <em>forward.</em>
          </h1>
          <p>
            A personal demonstration project for learning full-stack web development. Create a local
            demo account to explore it.
          </p>
        </div>
        <span className="auth-aside-foot">PERSONAL DEMONSTRATION PROJECT</span>
      </div>
      <section className="auth-main">
        <div className="auth-mobile-brand">
          <Link className="brand" to="/">
            <span className="brand-symbol">T</span>
            <span>TaskFlow</span>
          </Link>
        </div>
        <div className="auth-form-wrap">
          <span className="auth-step">{isRegister ? 'GET STARTED' : 'WELCOME BACK'}</span>
          <h2>{isRegister ? 'Create your account' : 'Sign in to TaskFlow'}</h2>
          <p className="auth-subtitle">
            {isRegister ? 'Your personal workspace starts here.' : 'Pick up where you left off.'}
          </p>
          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <FormField
                id="name"
                label="Full name"
                placeholder="Your name"
                autoComplete="name"
                minLength="2"
                maxLength="80"
                required
              />
            )}
            <FormField
              id="email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              maxLength="254"
              required
            />
            <FormField
              id="password"
              label="Password"
              type="password"
              placeholder="At least 10 characters"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              minLength={isRegister ? 10 : undefined}
              maxLength="72"
              required
              hint={isRegister ? 'Use at least 10 characters.' : undefined}
            />
            {isRegister && (
              <FormField
                id="confirmPassword"
                label="Confirm password"
                type="password"
                placeholder="Enter your password again"
                autoComplete="new-password"
                minLength="10"
                maxLength="72"
                required
              />
            )}
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <Button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}{' '}
              <span aria-hidden="true">→</span>
            </Button>
          </form>
          <p className="auth-switch">
            {isRegister ? 'Already have an account?' : 'New to TaskFlow?'}{' '}
            <Link to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
          <p className="auth-privacy">
            Demo account data is stored in your local PostgreSQL database. This project is for
            learning and is not a production service.
          </p>
        </div>
      </section>
    </main>
  )
}

export function LoginPage() {
  return <AuthPage mode="login" />
}
export function RegisterPage() {
  return <AuthPage mode="register" />
}
