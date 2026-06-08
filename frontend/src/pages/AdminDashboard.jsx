import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Filter,
  Loader2,
  LogOut,
  RefreshCcw,
  Search,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { patientFormApi } from '../api/patientFormApi'
import LanguageSwitcher from '../components/LanguageSwitcher'
import './AdminDashboard.css'

const statusFilters = [
  { value: 'ALL', labelKey: 'common.status.all' },
  { value: 'NEW', labelKey: 'common.status.new' },
  { value: 'VIEWED', labelKey: 'common.status.viewed' },
  { value: 'DONE', labelKey: 'common.status.done' },
]

const pageSizeOptions = [10, 25, 50]

function AdminDashboard() {
  const { t, i18n } = useTranslation()
  const [forms, setForms] = useState([])
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const navigate = useNavigate()

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

  useEffect(() => {
    setPage(1)
  }, [activeStatus, query, pageSize])

  const statusCounts = useMemo(() => {
    return forms.reduce(
      (counts, form) => {
        const status = normalizeStatus(form.status)
        counts.ALL += 1
        counts[status] += 1
        return counts
      },
      { ALL: 0, NEW: 0, VIEWED: 0, DONE: 0 }
    )
  }, [forms])

  const filteredForms = useMemo(() => {
    const searchTerm = query.trim().toLowerCase()

    return forms.filter((form) => {
      const status = normalizeStatus(form.status)
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

      const matchesStatus = activeStatus === 'ALL' || status === activeStatus
      const matchesQuery = !searchTerm || searchable.includes(searchTerm)

      return matchesStatus && matchesQuery
    })
  }, [activeStatus, forms, query])

  const pageCount = Math.max(1, Math.ceil(filteredForms.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageStart = filteredForms.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(currentPage * pageSize, filteredForms.length)
  const visibleForms = filteredForms.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    navigate('/admin/login', { replace: true })
  }

  return (
    <main className="admin-dashboard-page">
      <header className="admin-topbar">
        <div>
          <p className="admin-kicker">{t('adminDashboard.kicker')}</p>
          <h1>{t('adminDashboard.title')}</h1>
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

      <section className="admin-panel" aria-label={t('adminDashboard.tableAria')}>
        <div className="dashboard-toolbar">
          <div className="status-tabs" role="tablist" aria-label={t('adminDashboard.statusFilter')}>
            {statusFilters.map((filter) => (
              <button
                type="button"
                key={filter.value}
                className={`status-tab${activeStatus === filter.value ? ' status-tab--active' : ''}`}
                onClick={() => setActiveStatus(filter.value)}
              >
                {activeStatus === filter.value && <Check size={17} />}
                <span>{t(filter.labelKey)}</span>
                <small>{statusCounts[filter.value]}</small>
              </button>
            ))}
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
          <table className="submissions-table">
            <thead>
              <tr>
                <th>{t('adminDashboard.status')}</th>
                <th>
                  <span className="table-heading-with-icon">
                    {t('patient.name')}
                    <Filter size={20} />
                  </span>
                </th>
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
                visibleForms.map((form) => {
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
                          onClick={() => navigate(`/admin/submissions/${form._id}`)}
                        >
                          <Eye size={17} />
                          {t('common.details')}
                        </button>
                      </td>
                    </tr>
                  )
                })}

              {!loading && visibleForms.length === 0 && (
                <tr>
                  <td colSpan="5">
                    <div className="empty-table-state">
                      {forms.length === 0 ? t('adminDashboard.noSubmittedForms') : t('adminDashboard.noMatchingForms')}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="table-footer">
          <label className="page-size-control">
            <span>{t('common.itemsPerPage')}</span>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <span className="page-range">
            {pageStart} - {pageEnd} {t('common.of')} {filteredForms.length}
          </span>

          <div className="pagination-actions">
            <button
              type="button"
              aria-label={t('common.firstPage')}
              disabled={currentPage === 1}
              onClick={() => setPage(1)}
            >
              <ChevronsLeft size={20} />
            </button>
            <button
              type="button"
              aria-label={t('common.previousPage')}
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              aria-label={t('common.nextPage')}
              disabled={currentPage === pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            >
              <ChevronRight size={20} />
            </button>
            <button
              type="button"
              aria-label={t('common.lastPage')}
              disabled={currentPage === pageCount}
              onClick={() => setPage(pageCount)}
            >
              <ChevronsRight size={20} />
            </button>
          </div>
        </footer>
      </section>
    </main>
  )
}

export function StatusPill({ status }) {
  const { t } = useTranslation()
  const normalizedStatus = normalizeStatus(status)

  return (
    <span className={`status-pill status-pill--${normalizedStatus.toLowerCase()}`}>
      {getStatusLabel(normalizedStatus, t)}
    </span>
  )
}

export function normalizeStatus(status) {
  return ['NEW', 'VIEWED', 'DONE'].includes(status) ? status : 'NEW'
}

export function getStatusLabel(status, t) {
  const normalizedStatus = normalizeStatus(status)
  const statusKey = {
    NEW: 'common.status.new',
    VIEWED: 'common.status.viewed',
    DONE: 'common.status.done',
  }[normalizedStatus]

  return t(statusKey)
}

export function getPatientName(patient = {}) {
  const fullName = [patient.firstName, patient.lastName].filter(Boolean).join(' ').trim()
  return fullName || '-'
}

function getDateLocale(language = 'de') {
  const baseLanguage = language.split('-')[0]

  return {
    de: 'de-DE',
    en: 'en-US',
    ar: 'ar',
  }[baseLanguage] || 'de-DE'
}

export function formatDate(value, language = 'de') {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat(getDateLocale(language), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value, language = 'de') {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat(getDateLocale(language), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default AdminDashboard
