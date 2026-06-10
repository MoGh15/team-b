import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, Loader2, LogOut, RefreshCcw, Search, Stethoscope } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { patientFormApi } from '../api/patientFormApi'
import LanguageSwitcher from '../components/LanguageSwitcher'
import {
  formatDate,
  formatDateTime,
  getPatientName,
  normalizeStatus,
  StatusPill,
} from './AdminDashboard'
import './AdminDashboard.css'

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('authUser') || 'null')
  } catch (error) {
    return null
  }
}

function DoctorDashboard() {
  const { t, i18n } = useTranslation()
  const [forms, setForms] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const authUser = getStoredUser()

  const fetchForms = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await patientFormApi.getAll()
      setForms(response.data?.data || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('adminDashboard.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchForms()
  }, [])

  const filteredForms = useMemo(() => {
    const searchTerm = query.trim().toLowerCase()

    return forms.filter((form) => {
      const patient = form.patient || {}
      const searchable = [
        patient.firstName,
        patient.lastName,
        patient.email,
        patient.phone,
        patient.city,
        form._id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return !searchTerm || searchable.includes(searchTerm)
    })
  }, [forms, query])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    navigate('/admin/login', { replace: true })
  }

  return (
    <main className="admin-dashboard-page">
      <header className="admin-topbar">
        <div>
          <p className="admin-kicker">{t('doctorDashboard.kicker')}</p>
          <h1>{t('doctorDashboard.title')}</h1>
          <p className="doctor-dashboard-subtitle">
            {authUser?.fullName || authUser?.name || authUser?.email || t('doctorDashboard.assignedSubtitle')}
          </p>
        </div>
        <div className="admin-topbar__actions">
          <LanguageSwitcher />
          <button type="button" className="admin-action admin-action--light" onClick={fetchForms}>
            <RefreshCcw size={18} />
            {t('common.refresh')}
          </button>
          <button type="button" className="admin-action admin-action--light" onClick={handleLogout}>
            <LogOut size={18} />
            {t('common.logout')}
          </button>
        </div>
      </header>

      <section className="admin-panel" aria-label={t('doctorDashboard.patientSubmissions')}>
        <div className="dashboard-toolbar">
          <div className="section-heading-inline">
            <Stethoscope size={22} />
            <div>
              <h2>{t('doctorDashboard.patientSubmissions')}</h2>
              <p>{t('doctorDashboard.assignedSubtitle')}</p>
            </div>
          </div>

          <label className="dashboard-search">
            <Search size={18} />
            <input
              type="search"
              value={query}
              placeholder={t('adminDashboard.searchPlaceholder')}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        {error && <div className="admin-alert admin-alert--error">{error}</div>}

        <div className="submissions-table-wrap">
          <table className="submissions-table doctor-submissions-table">
            <thead>
              <tr>
                <th>{t('adminDashboard.status')}</th>
                <th>{t('patient.name')}</th>
                <th>{t('adminDashboard.created')}</th>
                <th>{t('adminDashboard.birthDate')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="5">
                    <div className="table-loading">
                      <Loader2 size={22} />
                      {t('adminDashboard.loading')}
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                filteredForms.map((form) => {
                  const patient = form.patient || {}
                  const status = normalizeStatus(form.status)

                  return (
                    <tr key={form._id}>
                      <td data-label={t('adminDashboard.status')}>
                        <StatusPill status={status} />
                      </td>
                      <td data-label={t('patient.name')}>
                        <span className="patient-name" dir="auto">
                          {getPatientName(patient)}
                        </span>
                      </td>
                      <td data-label={t('adminDashboard.created')}>
                        {formatDateTime(form.submittedAt || form.createdAt, i18n.resolvedLanguage)}
                      </td>
                      <td data-label={t('adminDashboard.birthDate')}>
                        {formatDate(patient.birthDate, i18n.resolvedLanguage)}
                      </td>
                      <td data-label={t('common.actions')}>
                        <button
                          type="button"
                          className="details-link"
                          onClick={() => navigate(`/doctor/submissions/${form._id}`)}
                        >
                          <Eye size={17} />
                          {t('common.details')}
                        </button>
                      </td>
                    </tr>
                  )
                })}

              {!loading && filteredForms.length === 0 && (
                <tr>
                  <td colSpan="5">
                    <div className="empty-table-state">
                      {forms.length === 0 ? t('doctorDashboard.noAssignedForms') : t('adminDashboard.noMatchingForms')}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default DoctorDashboard
