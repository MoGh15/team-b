import React, { useState } from 'react'
import { Lock, LogIn, Mail, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/authApi'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await authApi.login(formData)
      const { token, user } = response.data

      localStorage.setItem('authToken', token)
      localStorage.setItem('authUser', JSON.stringify(user))

      navigate('/admin-dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login fehlgeschlagen. Bitte prüfe deine Eingaben.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual" aria-hidden="true">
        <div className="login-brand-mark">
          <ShieldCheck size={36} strokeWidth={1.8} />
        </div>
        <div className="login-visual-copy">
          <span>Admin Portal</span>
          <h1>Willkommen zurück</h1>
          <p>Verwalte Benutzer, Rollen und Zugriff zentral an einem Ort.</p>
        </div>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-card">
          <div className="login-heading">
            <div className="login-icon">
              <Lock size={22} strokeWidth={2} />
            </div>
            <div>
              <p>Gesicherter Zugang</p>
              <h2 id="login-title">Admin Login</h2>
            </div>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field">
              <span>E-Mail</span>
              <div className="login-input-wrap">
                <Mail size={18} strokeWidth={2} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label className="login-field">
              <span>Passwort</span>
              <div className="login-input-wrap">
                <Lock size={18} strokeWidth={2} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Passwort eingeben"
                  autoComplete="current-password"
                  required
                />
              </div>
            </label>

            {error && <div className="login-error">{error}</div>}

            <button className="login-button" type="submit" disabled={isSubmitting}>
              <LogIn size={18} strokeWidth={2.2} />
              {isSubmitting ? 'Anmeldung läuft...' : 'Einloggen'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Login
