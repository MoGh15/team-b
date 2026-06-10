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
  Pencil,
  Loader2,
  LogOut,
  Power,
  RefreshCcw,
  Save,
  Search,
  Stethoscope,
  X,
  UserPlus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { doctorApi } from '../api/doctorApi'
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
  const [doctors, setDoctors] = useState([])
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [doctorFilter, setDoctorFilter] = useState('ALL')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [doctorsLoading, setDoctorsLoading] = useState(true)
  const [error, setError] = useState('')
  const [doctorMessage, setDoctorMessage] = useState(null)
  const [doctorSaving, setDoctorSaving] = useState(false)
  const [doctorUpdatingId, setDoctorUpdatingId] = useState('')
  const [editingDoctorId, setEditingDoctorId] = useState('')
  const [doctorEditDraft, setDoctorEditDraft] = useState({
    fullName: '',
    email: '',
    password: '',
    specialization: '',
  })
  const [doctorDraft, setDoctorDraft] = useState({
    fullName: '',
    email: '',
    password: '',
    specialization: '',
  })

  const navigate = useNavigate()

  const fetchForms = async (filterValue = doctorFilter) => {
    try {
      setLoading(true)
      setError('')
      const params = filterValue !== 'ALL' ? { doctorId: filterValue } : {}
      const response = await patientFormApi.getAll(params)
      setForms(response.data?.data || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('adminDashboard.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const fetchDoctors = async () => {
    try {
      setDoctorsLoading(true)
      const response = await doctorApi.getAdminDoctors()
      setDoctors(response.data?.data || [])
    } catch (requestError) {
      setDoctorMessage({
        type: 'error',
        text: requestError.response?.data?.message || t('adminDashboard.doctorLoadError'),
      })
    } finally {
      setDoctorsLoading(false)
    }
  }

  const refreshDashboard = () => {
    fetchDoctors()
    fetchForms()
  }

  useEffect(() => {
    fetchDoctors()
  }, [])

  useEffect(() => {
    fetchForms(doctorFilter)
  }, [doctorFilter])

  useEffect(() => {
    setPage(1)
  }, [activeStatus, doctorFilter, query, pageSize])

  const updateDoctorDraft = (field, value) => {
    setDoctorDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const startEditingDoctor = (doctor) => {
    setDoctorMessage(null)
    setEditingDoctorId(doctor._id)
    setDoctorEditDraft({
      fullName: getDoctorName(doctor) === '-' ? '' : getDoctorName(doctor),
      email: doctor.email || '',
      password: '',
      specialization: doctor.specialization || '',
    })
  }

  const cancelEditingDoctor = () => {
    setEditingDoctorId('')
    setDoctorEditDraft({
      fullName: '',
      email: '',
      password: '',
      specialization: '',
    })
  }

  const updateDoctorEditDraft = (field, value) => {
    setDoctorEditDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const saveDoctorEdit = async (doctorId) => {
    if (!doctorEditDraft.fullName.trim() || !doctorEditDraft.email.trim()) {
      setDoctorMessage({
        type: 'error',
        text: t('adminDashboard.updateDoctorError'),
      })
      return
    }

    try {
      setDoctorUpdatingId(doctorId)
      setDoctorMessage(null)
      const payload = {
        fullName: doctorEditDraft.fullName.trim(),
        email: doctorEditDraft.email.trim(),
        specialization: doctorEditDraft.specialization.trim(),
      }

      if (doctorEditDraft.password) {
        payload.password = doctorEditDraft.password
      }

      const response = await doctorApi.updateDoctor(doctorId, payload)
      const updatedDoctor = response.data?.data

      setDoctors((current) =>
        current.map((currentDoctor) => (currentDoctor._id === doctorId ? updatedDoctor : currentDoctor))
      )
      cancelEditingDoctor()
      setDoctorMessage({
        type: 'success',
        text: t('adminDashboard.updateDoctorSuccess'),
      })
    } catch (requestError) {
      setDoctorMessage({
        type: 'error',
        text: requestError.response?.data?.message || t('adminDashboard.updateDoctorError'),
      })
    } finally {
      setDoctorUpdatingId('')
    }
  }

  const handleCreateDoctor = async (event) => {
    event.preventDefault()
    setDoctorMessage(null)

    if (!doctorDraft.fullName.trim() || !doctorDraft.email.trim() || !doctorDraft.password) {
      setDoctorMessage({
        type: 'error',
        text: t('adminDashboard.createDoctorError'),
      })
      return
    }

    try {
      setDoctorSaving(true)
      const response = await doctorApi.createDoctor({
        fullName: doctorDraft.fullName.trim(),
        email: doctorDraft.email.trim(),
        password: doctorDraft.password,
        specialization: doctorDraft.specialization.trim(),
        isActive: true,
      })

      setDoctors((current) => [response.data?.data, ...current].filter(Boolean))
      setDoctorDraft({
        fullName: '',
        email: '',
        password: '',
        specialization: '',
      })
      setDoctorMessage({
        type: 'success',
        text: t('adminDashboard.createDoctorSuccess'),
      })
    } catch (requestError) {
      setDoctorMessage({
        type: 'error',
        text: requestError.response?.data?.message || t('adminDashboard.createDoctorError'),
      })
    } finally {
      setDoctorSaving(false)
    }
  }

  const toggleDoctorStatus = async (doctor) => {
    try {
      setDoctorUpdatingId(doctor._id)
      setDoctorMessage(null)
      const response = await doctorApi.updateDoctorStatus(doctor._id, !doctor.isActive)
      const updatedDoctor = response.data?.data

      setDoctors((current) =>
        current.map((currentDoctor) => (currentDoctor._id === doctor._id ? updatedDoctor : currentDoctor))
      )
    } catch (requestError) {
      setDoctorMessage({
        type: 'error',
        text: requestError.response?.data?.message || t('adminDashboard.updateDoctorStatusError'),
      })
    } finally {
      setDoctorUpdatingId('')
    }
  }

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
        getAssignedDoctorName(form),
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
          <button type="button" className="admin-action admin-action--light" onClick={refreshDashboard}>
            <RefreshCcw size={18} />
            {t('common.refresh')}
          </button>
          <button type="button" className="admin-action admin-action--light" onClick={handleLogout}>
            <LogOut size={18} />
            {t('common.logout')}
          </button>
        </div>
      </header>

      <section className="admin-panel doctor-management-panel" aria-label={t('adminDashboard.doctorsTitle')}>
        <div className="panel-heading-row">
          <div className="section-heading-inline">
            <Stethoscope size={22} />
            <div>
              <h2>{t('adminDashboard.doctorsTitle')}</h2>
              <p>{t('adminDashboard.doctorsSubtitle')}</p>
            </div>
          </div>
        </div>

        {doctorMessage && (
          <div className={`admin-alert admin-alert--${doctorMessage.type}`}>
            {doctorMessage.text}
          </div>
        )}

        <form className="doctor-create-form" onSubmit={handleCreateDoctor}>
          <label>
            <span>{t('adminDashboard.fullName')}*</span>
            <input
              type="text"
              value={doctorDraft.fullName}
              autoComplete="name"
              onChange={(event) => updateDoctorDraft('fullName', event.target.value)}
            />
          </label>
          <label>
            <span>{t('patient.email')}*</span>
            <input
              type="email"
              value={doctorDraft.email}
              autoComplete="email"
              onChange={(event) => updateDoctorDraft('email', event.target.value)}
            />
          </label>
          <label>
            <span>{t('adminDashboard.password')}*</span>
            <input
              type="password"
              value={doctorDraft.password}
              autoComplete="new-password"
              onChange={(event) => updateDoctorDraft('password', event.target.value)}
            />
          </label>
          <label>
            <span>{t('adminDashboard.specialization')}</span>
            <input
              type="text"
              value={doctorDraft.specialization}
              onChange={(event) => updateDoctorDraft('specialization', event.target.value)}
            />
          </label>
          <button type="submit" className="admin-action admin-action--primary" disabled={doctorSaving}>
            {doctorSaving ? <Loader2 className="spin-icon" size={18} /> : <UserPlus size={18} />}
            {t('adminDashboard.createDoctor')}
          </button>
        </form>

        <div className="doctors-list">
          {doctorsLoading && (
            <div className="table-loading">
              <Loader2 size={22} />
              {t('adminDashboard.loading')}
            </div>
          )}

          {!doctorsLoading &&
            doctors.map((doctor) => {
              const isEditing = editingDoctorId === doctor._id

              return (
                <article className={`doctor-row${isEditing ? ' doctor-row--editing' : ''}`} key={doctor._id}>
                  {isEditing ? (
                    <div className="doctor-edit-grid">
                      <label>
                        <span>{t('adminDashboard.fullName')}*</span>
                        <input
                          type="text"
                          value={doctorEditDraft.fullName}
                          onChange={(event) => updateDoctorEditDraft('fullName', event.target.value)}
                        />
                      </label>
                      <label>
                        <span>{t('patient.email')}*</span>
                        <input
                          type="email"
                          value={doctorEditDraft.email}
                          onChange={(event) => updateDoctorEditDraft('email', event.target.value)}
                        />
                      </label>
                      <label>
                        <span>{t('adminDashboard.specialization')}</span>
                        <input
                          type="text"
                          value={doctorEditDraft.specialization}
                          onChange={(event) => updateDoctorEditDraft('specialization', event.target.value)}
                        />
                      </label>
                      <label>
                        <span>{t('adminDashboard.password')}</span>
                        <input
                          type="password"
                          value={doctorEditDraft.password}
                          placeholder={t('adminDashboard.keepPasswordPlaceholder')}
                          onChange={(event) => updateDoctorEditDraft('password', event.target.value)}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="doctor-row__summary">
                      <strong>{getDoctorName(doctor)}</strong>
                      <span>{doctor.email}</span>
                      {doctor.specialization && <small>{doctor.specialization}</small>}
                    </div>
                  )}

                  <span className={`doctor-status doctor-status--${doctor.isActive ? 'active' : 'inactive'}`}>
                    {doctor.isActive ? t('common.active') : t('common.inactive')}
                  </span>

                  <div className="doctor-row-actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="admin-action admin-action--plain"
                          disabled={doctorUpdatingId === doctor._id}
                          onClick={cancelEditingDoctor}
                        >
                          <X size={17} />
                          {t('common.cancel')}
                        </button>
                        <button
                          type="button"
                          className="admin-action admin-action--primary"
                          disabled={doctorUpdatingId === doctor._id}
                          onClick={() => saveDoctorEdit(doctor._id)}
                        >
                          {doctorUpdatingId === doctor._id ? <Loader2 className="spin-icon" size={17} /> : <Save size={17} />}
                          {t('common.save')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="admin-action admin-action--plain"
                          onClick={() => startEditingDoctor(doctor)}
                        >
                          <Pencil size={17} />
                          {t('adminDashboard.editDoctor')}
                        </button>
                        <button
                          type="button"
                          className="admin-action admin-action--plain"
                          disabled={doctorUpdatingId === doctor._id}
                          onClick={() => toggleDoctorStatus(doctor)}
                        >
                          {doctorUpdatingId === doctor._id ? <Loader2 className="spin-icon" size={17} /> : <Power size={17} />}
                          {doctor.isActive ? t('adminDashboard.deactivateDoctor') : t('adminDashboard.activateDoctor')}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              )
            })}

          {!doctorsLoading && doctors.length === 0 && (
            <div className="empty-table-state">{t('adminDashboard.noDoctors')}</div>
          )}
        </div>
      </section>

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

          <div className="dashboard-filters">
            <label className="dashboard-select">
              <Filter size={18} />
              <select
                value={doctorFilter}
                aria-label={t('adminDashboard.doctorFilter')}
                title={t('adminDashboard.doctorFilter')}
                onChange={(event) => setDoctorFilter(event.target.value)}
              >
                <option value="ALL">{t('adminDashboard.allDoctors')}</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {getDoctorName(doctor)}
                  </option>
                ))}
              </select>
            </label>

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
                <th>{t('adminDashboard.assignedDoctor')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6">
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
                      <td data-label={t('adminDashboard.assignedDoctor')}>
                        {getAssignedDoctorName(form)}
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
                  <td colSpan="6">
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

export function getDoctorName(doctor = {}) {
  return doctor.fullName || doctor.name || '-'
}

export function getAssignedDoctorName(form = {}) {
  if (form.doctorName) {
    return form.doctorName
  }

  if (form.doctorId && typeof form.doctorId === 'object') {
    return getDoctorName(form.doctorId)
  }

  return '-'
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
