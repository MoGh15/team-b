import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Edit3,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Pill,
  RefreshCcw,
  Save,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { patientFormApi } from '../api/patientFormApi'
import {
  formatDate,
  formatDateTime,
  getAssignedDoctorName,
  getPatientName,
  getStatusLabel,
  normalizeStatus,
  StatusPill,
} from './AdminDashboard'
import './SubmissionDetails.css'

const statusOptions = ['NEW', 'VIEWED', 'DONE']
const sinceOptions = ['Seit heute', '2-3 Tage', '1 Woche', 'Laenger als 2 Wochen']

const createEditDraft = (source) => ({
  patient: {
    firstName: source.patient?.firstName || '',
    lastName: source.patient?.lastName || '',
    birthDate: source.patient?.birthDate ? source.patient.birthDate.slice(0, 10) : '',
    phone: source.patient?.phone || '',
    email: source.patient?.email || '',
    street: source.patient?.street || '',
    houseNumber: source.patient?.houseNumber || '',
    postalCode: source.patient?.postalCode || '',
    city: source.patient?.city || '',
  },
  symptoms: (source.symptoms || []).map((symptom) => ({
    name: symptom.name || '',
    severity: symptom.severity ?? 5,
    since: symptom.since || '',
    selection: symptom.selection || '',
    notes: symptom.notes || '',
  })),
  allergiesText: (source.allergies || []).join('\n'),
  medicationsText: (source.medications || []).join('\n'),
})

const createConsultationDraft = (source) => ({
  diagnosis: source?.consultation?.diagnosis || '',
  notes: source?.consultation?.notes || '',
  prescription: source?.consultation?.prescription || '',
  status: normalizeStatus(source?.status),
})

const splitList = (value) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('authUser') || 'null')
  } catch (error) {
    return null
  }
}

function SubmissionDetails() {
  const { t, i18n } = useTranslation()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState(null)
  const [consultationDraft, setConsultationDraft] = useState(null)

  const { id } = useParams()
  const navigate = useNavigate()
  const authUser = getStoredUser()
  const isDoctor = authUser?.role === 'doctor'

  const fetchForm = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await patientFormApi.getById(id)
      const nextForm = response.data?.data

      if (!isDoctor && normalizeStatus(nextForm?.status) === 'NEW') {
        const viewedResponse = await patientFormApi.updateStatus(id, 'VIEWED')
        const viewedForm = viewedResponse.data?.data || nextForm
        setForm(viewedForm)
        setConsultationDraft(createConsultationDraft(viewedForm))
      } else {
        setForm(nextForm)
        setConsultationDraft(createConsultationDraft(nextForm))
      }

      setIsEditing(false)
      setEditDraft(null)
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('submissionDetails.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchForm()
  }, [id])

  const patient = form?.patient || {}
  const status = normalizeStatus(form?.status)
  const hasConsultation = Boolean(
    form?.consultation?.diagnosis || form?.consultation?.notes || form?.consultation?.prescription
  )

  const address = useMemo(() => {
    return [
      [patient.street, patient.houseNumber].filter(Boolean).join(' '),
      [patient.postalCode, patient.city].filter(Boolean).join(' '),
    ]
      .filter(Boolean)
      .join(', ')
  }, [patient.city, patient.houseNumber, patient.postalCode, patient.street])

  const updateStatus = async (nextStatus) => {
    try {
      setSaving(true)
      setError('')
      const response = await patientFormApi.updateStatus(id, nextStatus)
      setForm(response.data?.data)
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('submissionDetails.saveStatusError'))
    } finally {
      setSaving(false)
    }
  }

  const startEditing = () => {
    setEditDraft(createEditDraft(form))
    setIsEditing(true)
    setError('')
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditDraft(null)
    setError('')
  }

  const updatePatientDraft = (field, value) => {
    setEditDraft((current) => ({
      ...current,
      patient: {
        ...current.patient,
        [field]: value,
      },
    }))
  }

  const updateSymptomDraft = (index, field, value) => {
    setEditDraft((current) => ({
      ...current,
      symptoms: current.symptoms.map((symptom, symptomIndex) =>
        symptomIndex === index
          ? {
              ...symptom,
              [field]: value,
            }
          : symptom
      ),
    }))
  }

  const saveEdits = async () => {
    try {
      setSaving(true)
      setError('')
      const response = await patientFormApi.update(id, {
        patient: editDraft.patient,
        symptoms: editDraft.symptoms,
        allergies: splitList(editDraft.allergiesText),
        medications: splitList(editDraft.medicationsText),
      })

      setForm(response.data?.data)
      setIsEditing(false)
      setEditDraft(null)
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('submissionDetails.saveChangesError'))
    } finally {
      setSaving(false)
    }
  }

  const updateConsultationDraft = (field, value) => {
    setConsultationDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const saveDoctorConsultation = async () => {
    try {
      setSaving(true)
      setError('')
      const response = await patientFormApi.updateDoctorConsultation(id, consultationDraft)
      const updatedForm = response.data?.data
      setForm(updatedForm)
      setConsultationDraft(createConsultationDraft(updatedForm))
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('submissionDetails.saveConsultationError'))
    } finally {
      setSaving(false)
    }
  }

  const translateSymptom = (name) => t(`medical.symptoms.${name}`, { defaultValue: name })
  const translateSymptomSelection = (value) => t(`medical.symptomSelections.${value}`, { defaultValue: value })
  const translateDuration = (value) => t(`medical.duration.${value}`, { defaultValue: value })
  const translateAllergy = (value) => t(`medical.allergies.${value}`, { defaultValue: value })
  const translateMedication = (value) => t(`medical.medications.${value}`, { defaultValue: value })

  return (
    <main className="submission-page">
      <header className="submission-topbar">
        <button type="button" className="back-button" onClick={() => navigate(isDoctor ? '/doctor' : '/admin/submissions')}>
          <ArrowLeft size={18} />
          {t('submissionDetails.title')}
        </button>
        {form && <StatusPill status={status} />}
      </header>

      {loading && (
        <div className="submission-state">
          <Loader2 size={24} />
          {t('submissionDetails.loading')}
        </div>
      )}

      {!loading && error && <div className="admin-alert admin-alert--error">{error}</div>}

      {!loading && form && (
        <>
          <section className="detail-section">
            <div className="detail-section__title">
              <UserRound size={20} />
              <h2>{t('patient.title')}</h2>
              <span>{t('submissionDetails.formVersion')}</span>
            </div>

            {isEditing ? (
              <div className="admin-edit-grid">
                <EditField label={t('patient.firstName')} value={editDraft.patient.firstName} onChange={(value) => updatePatientDraft('firstName', value)} />
                <EditField label={t('patient.lastName')} value={editDraft.patient.lastName} onChange={(value) => updatePatientDraft('lastName', value)} />
                <EditField label={t('patient.birthDate')} type="date" value={editDraft.patient.birthDate} onChange={(value) => updatePatientDraft('birthDate', value)} />
                <EditField label={t('patient.phone')} value={editDraft.patient.phone} onChange={(value) => updatePatientDraft('phone', value)} />
                <EditField label={t('patient.email')} type="email" value={editDraft.patient.email} onChange={(value) => updatePatientDraft('email', value)} wide />
                <EditField label={t('patient.street')} value={editDraft.patient.street} onChange={(value) => updatePatientDraft('street', value)} wide />
                <EditField label={t('patient.houseNumber')} value={editDraft.patient.houseNumber} onChange={(value) => updatePatientDraft('houseNumber', value)} />
                <EditField label={t('patient.postalCode')} value={editDraft.patient.postalCode} onChange={(value) => updatePatientDraft('postalCode', value)} />
                <EditField label={t('patient.city')} value={editDraft.patient.city} onChange={(value) => updatePatientDraft('city', value)} wide />
              </div>
            ) : (
              <div className="patient-summary-grid">
                <DetailItem label={t('patient.name')} value={getPatientName(patient)} autoDir />
                <DetailItem label={t('patient.birthDate')} value={formatDate(patient.birthDate, i18n.resolvedLanguage)} />
                <DetailItem label={t('patient.phone')} value={patient.phone || '-'} icon={Phone} />
                <DetailItem label={t('patient.email')} value={patient.email || '-'} icon={Mail} autoDir />
                <DetailItem label={t('adminDashboard.created')} value={formatDateTime(form.submittedAt || form.createdAt, i18n.resolvedLanguage)} />
                <DetailItem label={t('patient.address')} value={address || '-'} icon={MapPin} autoDir />
                <DetailItem label={t('submissionDetails.assignedDoctor')} value={getAssignedDoctorName(form)} icon={Stethoscope} autoDir />
                <DetailItem label={t('patient.id')} value={form._id} wide />
              </div>
            )}
          </section>

          <section className="detail-section">
            <div className="detail-section__title">
              <Stethoscope size={20} />
              <h2>{t('submissionDetails.medicalTitle')}</h2>
            </div>

            <DetailGroup title={t('submissionDetails.symptomsTitle')}>
              {isEditing ? (
                <div className="symptom-edit-list">
                  {editDraft.symptoms.map((symptom, index) => (
                    <article className="symptom-edit-card" key={`${symptom.name}-${index}`}>
                      <EditField label={t('submissionDetails.symptom')} value={symptom.name} onChange={(value) => updateSymptomDraft(index, 'name', value)} wide />
                      <EditField
                        label={t('submissionDetails.severity')}
                        type="number"
                        min="0"
                        max="10"
                        value={symptom.severity}
                        onChange={(value) => updateSymptomDraft(index, 'severity', Number(value))}
                      />
                      <label className="edit-field">
                        <span>{t('symptomModal.duration')}</span>
                        <select value={symptom.since} onChange={(event) => updateSymptomDraft(index, 'since', event.target.value)}>
                          <option value="">{t('symptomModal.duration')}</option>
                          {sinceOptions.map((option) => (
                            <option key={option} value={option}>
                              {translateDuration(option)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="edit-field edit-field--wide">
                        <span>{t('symptomModal.notes')}</span>
                        <textarea value={symptom.notes} rows="3" onChange={(event) => updateSymptomDraft(index, 'notes', event.target.value)} />
                      </label>
                    </article>
                  ))}
                </div>
              ) : form.symptoms?.length > 0 ? (
                <div className="symptom-detail-list">
                  {form.symptoms.map((symptom, index) => (
                    <article className="symptom-detail" key={`${symptom.name}-${index}`}>
                      <div>
                        <Stethoscope size={17} />
                        <strong dir="auto">{translateSymptom(symptom.name)}</strong>
                      </div>
                      <p>
                        {t('submissionDetails.severityDisplay', { value: symptom.severity ?? '-' })}
                        {symptom.since ? ` - ${t('symptomModal.durationSaved', { duration: translateDuration(symptom.since) })}` : ''}
                        {symptom.selection ? ` - ${t('submissionDetails.selectionDisplay', { selection: translateSymptomSelection(symptom.selection) })}` : ''}
                      </p>
                      {symptom.notes && <span dir="auto">{symptom.notes}</span>}
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyValue />
              )}
            </DetailGroup>

            <TwoColumnDetails>
              <DetailGroup title={t('patientForm.allergies')}>
                {isEditing ? (
                  <EditTextArea
                    label={t('patientForm.allergies')}
                    value={editDraft.allergiesText}
                    onChange={(value) => setEditDraft((current) => ({ ...current, allergiesText: value }))}
                  />
                ) : (
                  <TagList items={form.allergies} icon={ShieldCheck} getLabel={translateAllergy} />
                )}
              </DetailGroup>
              <DetailGroup title={t('patientForm.medications')}>
                {isEditing ? (
                  <EditTextArea
                    label={t('patientForm.medications')}
                    value={editDraft.medicationsText}
                    onChange={(value) => setEditDraft((current) => ({ ...current, medicationsText: value }))}
                  />
                ) : (
                  <TagList items={form.medications} icon={Pill} getLabel={translateMedication} />
                )}
              </DetailGroup>
            </TwoColumnDetails>
          </section>

          {(isDoctor || hasConsultation) && (
            <section className="detail-section">
              <div className="detail-section__title">
                <ClipboardList size={20} />
                <h2>{t('submissionDetails.consultationTitle')}</h2>
              </div>

              {isDoctor && consultationDraft ? (
                <div className="consultation-edit-grid">
                  <EditTextArea
                    label={t('submissionDetails.diagnosis')}
                    value={consultationDraft.diagnosis}
                    onChange={(value) => updateConsultationDraft('diagnosis', value)}
                  />
                  <EditTextArea
                    label={t('submissionDetails.doctorNotes')}
                    value={consultationDraft.notes}
                    onChange={(value) => updateConsultationDraft('notes', value)}
                  />
                  <EditTextArea
                    label={t('submissionDetails.prescription')}
                    value={consultationDraft.prescription}
                    onChange={(value) => updateConsultationDraft('prescription', value)}
                  />
                  <label className="edit-field edit-field--wide">
                    <span>{t('submissionDetails.consultationStatus')}</span>
                    <select
                      value={consultationDraft.status}
                      onChange={(event) => updateConsultationDraft('status', event.target.value)}
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {getStatusLabel(option, t)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : (
                <div className="patient-summary-grid">
                  <DetailItem label={t('submissionDetails.diagnosis')} value={form.consultation?.diagnosis || '-'} autoDir wide />
                  <DetailItem label={t('submissionDetails.doctorNotes')} value={form.consultation?.notes || '-'} autoDir wide />
                  <DetailItem label={t('submissionDetails.prescription')} value={form.consultation?.prescription || '-'} autoDir wide />
                  <DetailItem
                    label={t('submissionDetails.consultationUpdated')}
                    value={formatDateTime(form.consultation?.updatedAt, i18n.resolvedLanguage)}
                    wide
                  />
                </div>
              )}
            </section>
          )}

          <section className="detail-section">
            <div className="detail-section__title">
              <ClipboardList size={20} />
              <h2>{t('submissionDetails.signature')}</h2>
            </div>
            {form.signatureDataUrl ? (
              <div className="signature-preview">
                <img src={form.signatureDataUrl} alt={t('submissionDetails.patientSignatureAlt')} />
              </div>
            ) : (
              <EmptyValue />
            )}
          </section>

          <section className="detail-section">
            <div className="detail-section__title">
              <FileText size={20} />
              <h2>{t('submissionDetails.documents')}</h2>
            </div>
            {form.documents?.length > 0 ? (
              <ul className="document-list">
                {form.documents.map((document, index) => (
                  <li key={`${document.name}-${index}`}>
                    <FileText size={17} />
                    <span dir="auto">{document.name || t('submissionDetails.document')}</span>
                    <small>{formatFileSize(document.size)}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyValue />
            )}
          </section>

          <section className="detail-section">
            <div className="detail-section__title">
              <ShieldCheck size={20} />
              <h2>{t('submissionDetails.consents')}</h2>
            </div>
            <div className="consent-grid">
              <DetailItem label={t('submissionDetails.signature')} value={form.signatureCaptured ? t('common.yes') : t('common.no')} />
              <DetailItem label={t('submissionDetails.statusUpdated')} value={formatDateTime(form.statusUpdatedAt, i18n.resolvedLanguage)} />
            </div>
          </section>

          <footer className="submission-actions">
            {isDoctor ? (
              <>
                <button type="button" className="admin-action admin-action--plain" onClick={fetchForm}>
                  <RefreshCcw size={17} />
                  {t('submissionDetails.refresh')}
                </button>
                <span className="read-only-note">{t('submissionDetails.patientReadOnlyDoctor')}</span>
                <button
                  type="button"
                  className="admin-action admin-action--primary"
                  disabled={saving || !consultationDraft}
                  onClick={saveDoctorConsultation}
                >
                  {saving ? <Loader2 className="submission-spinner" size={17} /> : <Save size={17} />}
                  {t('submissionDetails.saveConsultation')}
                </button>
              </>
            ) : isEditing ? (
              <>
                <button type="button" className="admin-action admin-action--plain" onClick={cancelEditing}>
                  <X size={17} />
                  {t('common.cancel')}
                </button>
                <button type="button" className="admin-action admin-action--primary" disabled={saving} onClick={saveEdits}>
                  {saving ? <Loader2 className="submission-spinner" size={17} /> : <Save size={17} />}
                  {t('submissionDetails.saveChanges')}
                </button>
              </>
            ) : (
              <>
                <button type="button" className="admin-action admin-action--plain" onClick={fetchForm}>
                  <RefreshCcw size={17} />
                  {t('submissionDetails.refresh')}
                </button>
                <button type="button" className="admin-action admin-action--plain" onClick={startEditing}>
                  <Edit3 size={17} />
                  {t('submissionDetails.edit')}
                </button>
                <div className="status-switch" aria-label={t('submissionDetails.statusSwitch')}>
                  {statusOptions.map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={status === option ? 'is-active' : ''}
                      disabled={saving || status === option}
                      onClick={() => updateStatus(option)}
                    >
                      {status === option && <Check size={16} />}
                      {getStatusLabel(option, t)}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="admin-action admin-action--primary"
                  disabled={saving || status === 'DONE'}
                  onClick={() => updateStatus('DONE')}
                >
                  {saving ? <Loader2 className="submission-spinner" size={17} /> : <Save size={17} />}
                  {t('submissionDetails.saveAndMarkDone')}
                </button>
              </>
            )}
          </footer>
        </>
      )}
    </main>
  )
}

function DetailItem({ label, value, icon: Icon, autoDir = false, wide = false }) {
  return (
    <div className={`detail-item${wide ? ' detail-item--wide' : ''}`}>
      <span>{label}</span>
      <strong dir={autoDir ? 'auto' : undefined}>
        {Icon && <Icon size={15} />}
        {value || '-'}
      </strong>
    </div>
  )
}

function EditField({ label, value, onChange, type = 'text', wide = false, min, max }) {
  return (
    <label className={`edit-field${wide ? ' edit-field--wide' : ''}`}>
      <span>{label}</span>
      <input type={type} value={value} min={min} max={max} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function EditTextArea({ label, value, onChange }) {
  return (
    <label className="edit-field edit-field--wide">
      <span>{label}</span>
      <textarea value={value} rows="5" onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function DetailGroup({ title, children }) {
  return (
    <div className="detail-group">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

function TwoColumnDetails({ children }) {
  return <div className="two-column-details">{children}</div>
}

function TagList({ items = [], icon: Icon, getLabel = (item) => item }) {
  if (!items.length) {
    return <EmptyValue />
  }

  return (
    <div className="detail-tags">
      {items.map((item) => (
        <span key={item} dir="auto">
          {Icon && <Icon size={14} />}
          {getLabel(item)}
        </span>
      ))}
    </div>
  )
}

function EmptyValue() {
  return <p className="empty-value">-</p>
}

function formatFileSize(size) {
  if (!size) {
    return '-'
  }

  if (size < 1024 * 1024) {
    return `${Math.ceil(size / 1024)} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export default SubmissionDetails
