import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/useAuth'

const destinations = { admin: '/admin/dashboard', faculty: '/faculty/dashboard', student: '/student/dashboard' }

export default function Login() {
  const navigate = useNavigate()
  const { saveSession } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      saveSession(data.token, data.user)
      navigate(destinations[data.user.role] || '/login', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  return <main className="login-shell">
    <div className="login-orbit" aria-hidden="true" />
    <section className="login-card" aria-labelledby="login-title">
      <div className="brand-mark" aria-hidden="true">SA</div>
      <p className="eyebrow">Smart Attendance</p>
      <h1 id="login-title">Welcome back.</h1>
      <p className="login-intro">Sign in to manage your attendance workspace.</p>
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" autoComplete="email" placeholder="you@school.edu" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={(event) => updateField('password', event.target.value)} required />
        </div>
        {error && <p className="error-message" role="alert">{error}</p>}
        <button className="login-button" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
      <p className="login-note">
        Need an account? <Link to="/register">Create one</Link>
      </p>
    </section>
  </main>
}
