import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/useAuth'

const destinations = {
  admin: '/admin/dashboard',
  faculty: '/faculty/dashboard',
  student: '/student/dashboard',
}

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'admin',
}

export default function Register() {
  const navigate = useNavigate()
  const { saveSession } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/register', form)
      saveSession(data.token, data.user)
      navigate(destinations[data.user.role] || '/login', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  return (
    <main className="login-shell">
      <div className="login-orbit" aria-hidden="true" />
      <section className="login-card" aria-labelledby="register-title">
        <div className="brand-mark" aria-hidden="true">SA</div>
        <p className="eyebrow">Smart Attendance</p>
        <h1 id="register-title">Create account</h1>
        <p className="login-intro">Register a new academic user.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" type="text" value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Your full name" required />
          </div>

          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="you@school.edu" required />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="new-password" value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder="Create a password" required />
          </div>

          <div className="field">
            <label htmlFor="role">Role</label>
            <select id="role" value={form.role} onChange={(event) => updateField('role', event.target.value)}>
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
          </div>

          {error && <p className="error-message" role="alert">{error}</p>}

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="login-note">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  )
}
