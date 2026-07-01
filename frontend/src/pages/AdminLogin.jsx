import React, { useState } from 'react'
import { Eye, EyeOff, Loader2, LockKeyhole, LogIn, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/authApi'
import './AdminLogin.css'

const DEFAULT_ADMIN_EMAIL = 'admin@example.com'
const DEFAULT_ADMIN_PASSWORD = 'admin123'

const getRoleHome = (role) => (role === 'doctor' ? '/doctor' : '/admin/submissions')

const canUseTargetPath = (role, targetPath) => {
  if (role === 'doctor') {
    return targetPath.startsWith('/doctor')
  }

  return targetPath.startsWith('/admin')
}

function AdminLogin() {
  const { t } = useTranslation()
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
      nextErrors.identifier = t('adminLogin.identifierRequired')
    }

    if (!password) {
      nextErrors.password = t('adminLogin.passwordRequired')
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
      const role = response.data.user?.role
      const nextPath = canUseTargetPath(role, targetPath) ? targetPath : getRoleHome(role)
      navigate(nextPath, { replace: true })
    } catch (error) {
      setLoginError(
        error.response?.data?.message ||
          t('adminLogin.loginError')
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

  const useAdminCredentials = () => {
    setIdentifier(DEFAULT_ADMIN_EMAIL)
    setPassword(DEFAULT_ADMIN_PASSWORD)
    setErrors({})
    setLoginError('')
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <div className="login-heading">
          <div className="login-heading__icon">
            <LockKeyhole size={25} />
          </div>
          <div>
            <h1 id="admin-login-title">{t('adminLogin.title')}</h1>
            <p>{t('adminLogin.subtitle')}</p>
          </div>
        </div>

        <div className="login-help">
          <h2>{t('adminLogin.helpTitle')}</h2>
          <p>{t('adminLogin.helpText')}</p>

          <div className="login-credentials" aria-label={t('adminLogin.adminCredentialsTitle')}>
            <div className="login-credentials__header">
              <strong>{t('adminLogin.adminCredentialsTitle')}</strong>
              <button type="button" onClick={useAdminCredentials}>
                {t('adminLogin.useAdminCredentials')}
              </button>
            </div>
            <dl>
              <div>
                <dt>{t('adminLogin.emailLabel')}</dt>
                <dd>{DEFAULT_ADMIN_EMAIL}</dd>
              </div>
              <div>
                <dt>{t('adminLogin.passwordLabel')}</dt>
                <dd>{DEFAULT_ADMIN_PASSWORD}</dd>
              </div>
            </dl>
          </div>

          <div className="login-role-notes">
            <p>
              <strong>{t('adminLogin.adminRoleTitle')}</strong>
              {t('adminLogin.adminRoleText')}
            </p>
            <p>
              <strong>{t('adminLogin.doctorRoleTitle')}</strong>
              {t('adminLogin.doctorRoleText')}
            </p>
          </div>
        </div>

        {loginError && <div className="login-error">{loginError}</div>}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="adminIdentifier">{t('adminLogin.identifierLabel')}</label>
            <div className={`login-input${errors.identifier ? ' login-input--error' : ''}`}>
              <UserRound size={20} />
              <input
                id="adminIdentifier"
                type="text"
                value={identifier}
                placeholder={t('adminLogin.identifierPlaceholder')}
                autoComplete="username"
                onChange={(event) => clearIdentifierError(event.target.value)}
              />
            </div>
            {errors.identifier && <span>{errors.identifier}</span>}
          </div>

          <div className="login-field">
            <label htmlFor="adminPassword">{t('adminLogin.passwordInputLabel')}</label>
            <div className={`login-input${errors.password ? ' login-input--error' : ''}`}>
              <LockKeyhole size={20} />
              <input
                id="adminPassword"
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder={t('adminLogin.passwordPlaceholder')}
                autoComplete="current-password"
                onChange={(event) => clearPasswordError(event.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? t('adminLogin.hidePassword') : t('adminLogin.showPassword')}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <span>{errors.password}</span>}
          </div>

          <button type="submit" className="login-submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="spin-icon" size={20} /> : <LogIn size={20} />}
            {isSubmitting ? t('adminLogin.submitting') : t('adminLogin.submit')}
          </button>
        </form>
      </section>
    </main>
  )
}

export default AdminLogin
