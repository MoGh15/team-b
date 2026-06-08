import React, { useState } from 'react'
import { Eye, EyeOff, Languages, Loader2, LockKeyhole, LogIn, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../api/authApi'
import './AdminLogin.css'

function AdminLogin() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loginError, setLoginError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const targetPath = location.state?.from?.pathname || '/admin/submissions'

  const validate = () => {
    const nextErrors = {}

    if (!identifier.trim()) {
      nextErrors.identifier = 'Benutzername ist erforderlich.'
    }

    if (!password) {
      nextErrors.password = 'Passwort ist erforderlich.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoginError('')

    if (!validate()) {
      return
    }

    try {
      setIsSubmitting(true)
      const response = await authApi.login({
        identifier: identifier.trim(),
        password,
      })

      localStorage.setItem('authToken', response.data.token)
      localStorage.setItem('authUser', JSON.stringify(response.data.user))
      navigate(targetPath, { replace: true })
    } catch (error) {
      setLoginError(
        error.response?.data?.message ||
          'Anmeldung fehlgeschlagen. Bitte admin@example.com / admin123 pruefen oder Backend starten.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearIdentifierError = (value) => {
    setIdentifier(value)
    if (errors.identifier) {
      setErrors((current) => ({ ...current, identifier: '' }))
    }
  }

  const clearPasswordError = (value) => {
    setPassword(value)
    if (errors.password) {
      setErrors((current) => ({ ...current, password: '' }))
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <button type="button" className="language-button" aria-label="Sprache wechseln">
          <Languages size={21} />
        </button>

        <div className="login-heading">
          <div className="login-heading__icon">
            <LockKeyhole size={25} />
          </div>
          <div>
            <h1 id="admin-login-title">Admin Login</h1>
            <p>Bitte melde dich an</p>
          </div>
        </div>

        {loginError && <div className="login-error">{loginError}</div>}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="adminIdentifier">Benutzername*</label>
            <div className={`login-input${errors.identifier ? ' login-input--error' : ''}`}>
              <UserRound size={20} />
              <input
                id="adminIdentifier"
                type="text"
                value={identifier}
                placeholder="Benutzername oder E-Mail"
                autoComplete="username"
                onChange={(event) => clearIdentifierError(event.target.value)}
              />
            </div>
            {errors.identifier && <span>{errors.identifier}</span>}
          </div>

          <div className="login-field">
            <label htmlFor="adminPassword">Passwort*</label>
            <div className={`login-input${errors.password ? ' login-input--error' : ''}`}>
              <LockKeyhole size={20} />
              <input
                id="adminPassword"
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder="Passwort"
                autoComplete="current-password"
                onChange={(event) => clearPasswordError(event.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Passwort ausblenden' : 'Passwort anzeigen'}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <span>{errors.password}</span>}
          </div>

          <button type="submit" className="login-submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="spin-icon" size={20} /> : <LogIn size={20} />}
            {isSubmitting ? 'Wird angemeldet...' : 'Einloggen'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default AdminLogin
