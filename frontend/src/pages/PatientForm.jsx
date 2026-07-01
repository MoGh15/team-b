import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  BadgePlus,
  Check,
  ChevronDown,
  ClipboardList,
  FileText,
  FileUp,
  Hand,
  HeartPulse,
  Edit3,
  Pill,
  Plus,
  RefreshCcw,
  Send,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  Trash2,
  UploadCloud,
  UserRound,
  Wind,
  X,
} from 'lucide-react'
import { doctorApi } from '../api/doctorApi'
import { patientFormApi } from '../api/patientFormApi'
import './PatientForm.css'

const initialPatient = {
  firstName: '',
  lastName: '',
  birthDate: '',
  phone: '',
  email: '',
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
}

const defaultSymptomDetails = {
  severity: 5,
  since: '',
  selection: '',
  notes: '',
}

const sinceOptions = ['Seit heute', '2-3 Tage', '1 Woche', 'Laenger als 2 Wochen']
const symptomSelectionOptions = {
  Fieber: ['Schuettelfrost', 'Schwitzen'],
  Husten: ['Trocken', 'Mit Auswurf'],
  Schwindel: ['Drehschwindel', 'Schwankschwindel'],
  Uebelkeit: ['Mit Erbrechen', 'Ohne Erbrechen'],
  Atemnot: ['Bei Belastung', 'In Ruhe'],
  Brustschmerzen: ['Links', 'Rechts', 'Mittig'],
  Kopfschmerzen: ['Druck', 'Stechend'],
  Halsschmerzen: ['Brennen', 'Schluckbeschwerden'],
  Rueckenschmerzen: ['Oben', 'Mitte', 'Unten'],
  Ausschlag: ['Juckend', 'Nicht juckend'],
}

const symptomOptions = [
  { name: 'Fieber', label: 'Fieber', icon: Thermometer },
  { name: 'Husten', label: 'Husten', icon: Activity },
  { name: 'Schwindel', label: 'Schwindel', icon: Wind },
  { name: 'Uebelkeit', label: 'Übelkeit', icon: Activity },
  { name: 'Atemnot', label: 'Atemnot', icon: Wind },
  { name: 'Brustschmerzen', label: 'Brustschmerzen', icon: HeartPulse },
  { name: 'Kopfschmerzen', label: 'Kopfschmerzen', icon: UserRound },
  { name: 'Halsschmerzen', label: 'Halsschmerzen', icon: Stethoscope },
  { name: 'Rueckenschmerzen', label: 'Rückenschmerzen', icon: Hand },
  { name: 'Ausschlag', label: 'Ausschlag', icon: ShieldCheck },
]

const allergyOptions = ['Tierhaare', 'Pollen', 'Hausstaub', 'Lebensmittel', 'Medikamente', 'Latex']
const medicationOptions = ['Ibuprofen', 'Paracetamol', 'ASS', 'Metformin', 'Insulin', 'Antibiotika']

const maxFiles = 5
const maxFileSize = 10 * 1024 * 1024

const getTodayDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function PatientForm() {
  const { t, i18n } = useTranslation()
  const [patient, setPatient] = useState(initialPatient)
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [customSymptoms, setCustomSymptoms] = useState([])
  const [symptomDetails, setSymptomDetails] = useState({})
  const [activeSymptom, setActiveSymptom] = useState(null)
  const [draftSymptomDetails, setDraftSymptomDetails] = useState(defaultSymptomDetails)
  const [selectedAllergies, setSelectedAllergies] = useState([])
  const [customAllergies, setCustomAllergies] = useState([])
  const [selectedMedications, setSelectedMedications] = useState([])
  const [customMedications, setCustomMedications] = useState([])
  const [customSymptomValue, setCustomSymptomValue] = useState('')
  const [customAllergyValue, setCustomAllergyValue] = useState('')
  const [customMedicationValue, setCustomMedicationValue] = useState('')
  const [documents, setDocuments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [doctorsLoading, setDoctorsLoading] = useState(true)
  const [doctorsError, setDoctorsError] = useState('')
  const [signatureTouched, setSignatureTouched] = useState(false)
  const [errors, setErrors] = useState({})
  const [statusMessage, setStatusMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()

  const fileInputRef = useRef(null)
  const signatureCanvasRef = useRef(null)
  const signatureContextRef = useRef(null)
  const isDrawingSignatureRef = useRef(false)

  useEffect(() => {
    const canvas = signatureCanvasRef.current
    if (!canvas) {
      return undefined
    }

    const resizeCanvas = () => {
      const ratio = window.devicePixelRatio || 1
      const width = canvas.clientWidth
      const height = 118
      canvas.width = width * ratio
      canvas.height = height * ratio

      const context = canvas.getContext('2d')
      context.scale(ratio, ratio)
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.lineWidth = 2.5
      context.strokeStyle = '#26358f'
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, width, height)
      signatureContextRef.current = context
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const fetchDoctors = async () => {
      try {
        setDoctorsLoading(true)
        setDoctorsError('')
        const response = await doctorApi.getPublicDoctors()

        if (isMounted) {
          setDoctors(response.data?.data || [])
        }
      } catch (error) {
        if (isMounted) {
          setDoctors([])
          setDoctorsError(error.response?.data?.message || t('patientForm.doctorLoadError'))
        }
      } finally {
        if (isMounted) {
          setDoctorsLoading(false)
        }
      }
    }

    fetchDoctors()

    return () => {
      isMounted = false
    }
  }, [t])

  const updatePatient = (field, value) => {
    setPatient((current) => ({
      ...current,
      [field]: value,
    }))

    if (errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: '',
      }))
    }
  }

  const updateDoctor = (value) => {
    setSelectedDoctorId(value)

    if (errors.doctorId) {
      setErrors((current) => ({
        ...current,
        doctorId: '',
      }))
    }
  }

  const openSymptomDetails = (name) => {
    setDraftSymptomDetails({
      ...defaultSymptomDetails,
      ...(symptomDetails[name] || {}),
    })
    setActiveSymptom(name)
  }

  const updateActiveSymptom = (field, value) => {
    if (!activeSymptom) {
      return
    }

    setDraftSymptomDetails((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const closeSymptomDetails = () => {
    setActiveSymptom(null)
    setDraftSymptomDetails(defaultSymptomDetails)
  }

  const saveActiveSymptom = () => {
    if (!activeSymptom) {
      return
    }

    setSelectedSymptoms((current) =>
      current.includes(activeSymptom) ? current : [...current, activeSymptom]
    )

    const isKnownSymptom = symptomOptions.some((symptom) => symptom.name === activeSymptom)
    if (!isKnownSymptom) {
      setCustomSymptoms((current) =>
        current.includes(activeSymptom) ? current : [...current, activeSymptom]
      )
    }

    setSymptomDetails((current) => ({
      ...current,
      [activeSymptom]: {
        ...defaultSymptomDetails,
        ...draftSymptomDetails,
      },
    }))
    closeSymptomDetails()
  }

  const removeActiveSymptom = () => {
    if (!activeSymptom) {
      return
    }

    const symptomName = activeSymptom
    setSelectedSymptoms((current) => current.filter((item) => item !== symptomName))
    setCustomSymptoms((current) => current.filter((item) => item !== symptomName))
    setSymptomDetails((current) => {
      const nextDetails = { ...current }
      delete nextDetails[symptomName]
      return nextDetails
    })
    closeSymptomDetails()
  }

  const removeSymptom = (symptomName) => {
    setSelectedSymptoms((current) => current.filter((item) => item !== symptomName))
    setCustomSymptoms((current) => current.filter((item) => item !== symptomName))
    setSymptomDetails((current) => {
      const nextDetails = { ...current }
      delete nextDetails[symptomName]
      return nextDetails
    })

    if (activeSymptom === symptomName) {
      closeSymptomDetails()
    }
  }

  const toggleListItem = (item, selectedItems, setter) => {
    setter(
      selectedItems.includes(item)
        ? selectedItems.filter((selectedItem) => selectedItem !== item)
        : [...selectedItems, item]
    )
  }

  const addCustomSymptom = () => {
    const value = customSymptomValue.trim()
    if (!value) {
      return
    }

    setCustomSymptomValue('')
    openSymptomDetails(value)
  }

  const addCustomTag = (value, setValue, selectedItems, setSelectedItems, customItems, setCustomItems) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) {
      return
    }

    if (!customItems.includes(trimmedValue)) {
      setCustomItems([...customItems, trimmedValue])
    }

    if (!selectedItems.includes(trimmedValue)) {
      setSelectedItems([...selectedItems, trimmedValue])
    }

    setValue('')
  }

  const handleFileChange = (event) => {
    const incomingFiles = Array.from(event.target.files || [])
    const currentErrors = []
    const acceptedFiles = []

    incomingFiles.forEach((file) => {
      if (documents.length + acceptedFiles.length >= maxFiles) {
        currentErrors.push(t('patientForm.fileLimitError'))
        return
      }

      if (file.size > maxFileSize) {
        currentErrors.push(t('patientForm.fileSizeError', { fileName: file.name }))
        return
      }

      acceptedFiles.push(file)
    })

    setDocuments((current) => [...current, ...acceptedFiles])
    setErrors((current) => ({
      ...current,
      documents: currentErrors.join(' '),
    }))

    event.target.value = ''
  }

  const removeDocument = (fileName) => {
    setDocuments((current) => current.filter((file) => file.name !== fileName))
  }

  const getCanvasPoint = (event) => {
    const canvas = signatureCanvasRef.current
    const rect = canvas.getBoundingClientRect()

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const startSignature = (event) => {
    const context = signatureContextRef.current
    if (!context) {
      return
    }

    event.preventDefault()
    signatureCanvasRef.current.setPointerCapture(event.pointerId)
    const point = getCanvasPoint(event)
    context.beginPath()
    context.moveTo(point.x, point.y)
    isDrawingSignatureRef.current = true
  }

  const drawSignature = (event) => {
    const context = signatureContextRef.current
    if (!isDrawingSignatureRef.current || !context) {
      return
    }

    event.preventDefault()
    const point = getCanvasPoint(event)
    context.lineTo(point.x, point.y)
    context.stroke()
    setSignatureTouched(true)

    if (errors.signature) {
      setErrors((current) => ({
        ...current,
        signature: '',
      }))
    }
  }

  const endSignature = (event) => {
    if (signatureCanvasRef.current?.hasPointerCapture(event.pointerId)) {
      signatureCanvasRef.current.releasePointerCapture(event.pointerId)
    }
    isDrawingSignatureRef.current = false
  }

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current
    const context = signatureContextRef.current

    if (!canvas || !context) {
      return
    }

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.clientWidth, 118)
    setSignatureTouched(false)
  }

  const updateBirthDate = (value) => {
    if (value && value > getTodayDateString()) {
      setErrors((current) => ({
        ...current,
        birthDate: t('validation.birthDateFuture'),
      }))
      return
    }

    updatePatient('birthDate', value)
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!patient.firstName.trim()) {
      nextErrors.firstName = t('validation.firstNameRequired')
    }

    if (!patient.lastName.trim()) {
      nextErrors.lastName = t('validation.lastNameRequired')
    }

    if (!patient.birthDate) {
      nextErrors.birthDate = t('validation.birthDateRequired')
    } else if (patient.birthDate > getTodayDateString()) {
      nextErrors.birthDate = t('validation.birthDateFuture')
    }

    if (!selectedDoctorId) {
      nextErrors.doctorId = t('validation.doctorRequired')
    }

    if (patient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email)) {
      nextErrors.email = t('validation.emailInvalid')
    }

    if (!signatureTouched) {
      nextErrors.signature = t('validation.signatureRequired')
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const resetForm = () => {
    setPatient(initialPatient)
    setSelectedSymptoms([])
    setCustomSymptoms([])
    setSymptomDetails({})
    setActiveSymptom(null)
    setDraftSymptomDetails(defaultSymptomDetails)
    setSelectedAllergies([])
    setCustomAllergies([])
    setSelectedMedications([])
    setCustomMedications([])
    setCustomSymptomValue('')
    setCustomAllergyValue('')
    setCustomMedicationValue('')
    setDocuments([])
    setSelectedDoctorId('')
    setErrors({})
    setStatusMessage(null)
    clearSignature()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatusMessage(null)

    if (!validateForm()) {
      return
    }

    const selectedDoctor = doctors.find((doctor) => doctor._id === selectedDoctorId)
    const currentLanguage = i18n.resolvedLanguage || i18n.language
    const payload = {
      language: currentLanguage,
      patient,
      doctorId: selectedDoctorId,
      doctorName: selectedDoctor?.fullName || selectedDoctor?.name || '',
      symptoms: selectedSymptoms.map((name) => ({
        name,
        ...defaultSymptomDetails,
        ...(symptomDetails[name] || {}),
      })),
      allergies: selectedAllergies,
      medications: selectedMedications,
      documents: documents.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      })),
      signatureCaptured: signatureTouched,
      signatureDataUrl: signatureCanvasRef.current?.toDataURL('image/png') || '',
    }

    try {
      setIsSubmitting(true)
     const response = await patientFormApi.submit(payload)
      console.log(response)
      const returnedId = response.data?.data?.id || response.data?.data?.localCopyId || response.data?.data?._id || ''
      if (returnedId) {
        localStorage.setItem('patientFormId', returnedId)
      }
      
      // Redirect to appointment booking with the same form and language context.
      if (returnedId) {
        const patientName = `${patient.firstName} ${patient.lastName}`.trim()
        const appointmentContext = {
          patientFormId: returnedId,
          patientName,
          language: currentLanguage,
        }
        sessionStorage.setItem('pendingAppointmentContext', JSON.stringify(appointmentContext))

        const query = new URLSearchParams({
          patientFormId: returnedId,
          lng: currentLanguage,
        })
        navigate(`/appointments/new?${query.toString()}`, { state: appointmentContext })
      }
      setStatusMessage({
        type: 'success',
        text: response.data?.savedLocally
          ? t('patientForm.successLocal')
          : t('patientForm.successRemote', { id: response.data?.data?.id || '-' }),
      })
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text:
          error.response?.data?.message ||
          t('patientForm.submitError'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeDetails = activeSymptom ? draftSymptomDetails : defaultSymptomDetails

  const activeSymptomOption = symptomOptions.find((symptom) => symptom.name === activeSymptom)
  const ActiveSymptomIcon = activeSymptomOption?.icon || BadgePlus
  const activeSymptomLabel = activeSymptom
    ? t(`medical.symptoms.${activeSymptom}`, { defaultValue: activeSymptomOption?.label || activeSymptom })
    : ''
  const activeSelectionOptions = symptomSelectionOptions[activeSymptom] || []

  const getSavedSymptomDetails = (symptomName) => ({
    ...defaultSymptomDetails,
    ...(symptomDetails[symptomName] || {}),
  })

  const translateSymptom = (name) => t(`medical.symptoms.${name}`, { defaultValue: name })
  const translateSymptomSelection = (value) => t(`medical.symptomSelections.${value}`, { defaultValue: value })
  const translateDuration = (value) => t(`medical.duration.${value}`, { defaultValue: value })
  const translateAllergy = (value) => t(`medical.allergies.${value}`, { defaultValue: value })
  const translateMedication = (value) => t(`medical.medications.${value}`, { defaultValue: value })

  return (
    <main className="patient-form-page">
      <form className="patient-form-shell" onSubmit={handleSubmit}>
        <header className="patient-form-header">
          <div>
            <p className="patient-form-kicker">{t('patientForm.kicker')}</p>
            <h1>{t('patientForm.title')}</h1>
            <p>{t('patientForm.subtitle')}</p>
          </div>
          <div className="patient-form-header__actions">
            <button type="button" className="ghost-action" onClick={resetForm}>
              <RefreshCcw size={16} />
              {t('common.reset')}
            </button>
          </div>
        </header>

        {statusMessage && (
          <div className={`form-status form-status--${statusMessage.type}`}>
            {statusMessage.text}
          </div>
        )}

        <section className="form-section">
          <div className="section-heading">
            <UserRound size={22} />
            <div>
              <h2>{t('patient.title')}</h2>
              <p>{t('patient.subtitle')}</p>
            </div>
          </div>

          <div className="patient-grid">
            <TextField
              id="firstName"
              label={`${t('patient.firstName')}*`}
              value={patient.firstName}
              error={errors.firstName}
              onChange={(value) => updatePatient('firstName', value)}
            />
            <TextField
              id="lastName"
              label={`${t('patient.lastName')}*`}
              value={patient.lastName}
              error={errors.lastName}
              onChange={(value) => updatePatient('lastName', value)}
            />
            <TextField
              id="birthDate"
              label={`${t('patient.birthDate')}*`}
              type="date"
              value={patient.birthDate}
              error={errors.birthDate}
              max={getTodayDateString()}
              onChange={updateBirthDate}
            />
            <TextField
              id="phone"
              label={t('patient.phone')}
              type="tel"
              value={patient.phone}
              onChange={(value) => updatePatient('phone', value)}
            />
            <TextField
              id="email"
              label={t('patient.email')}
              type="email"
              value={patient.email}
              error={errors.email}
              onChange={(value) => updatePatient('email', value)}
              wide
            />
            <TextField
              id="street"
              label={t('patient.street')}
              value={patient.street}
              onChange={(value) => updatePatient('street', value)}
              wide
            />
            <TextField
              id="houseNumber"
              label={t('patient.houseNumber')}
              value={patient.houseNumber}
              onChange={(value) => updatePatient('houseNumber', value)}
            />
            <TextField
              id="postalCode"
              label={t('patient.postalCode')}
              value={patient.postalCode}
              onChange={(value) => updatePatient('postalCode', value)}
            />
            <TextField
              id="city"
              label={t('patient.city')}
              value={patient.city}
              onChange={(value) => updatePatient('city', value)}
              wide
            />
            <SelectField
              id="doctorId"
              label={`${t('patientForm.doctorSelectLabel')}*`}
              value={selectedDoctorId}
              error={errors.doctorId}
              disabled={doctorsLoading || doctors.length === 0}
              placeholder={
                doctorsLoading
                  ? t('patientForm.doctorsLoading')
                  : doctors.length === 0
                    ? t('patientForm.noDoctorsAvailable')
                    : t('patientForm.selectDoctorPlaceholder')
              }
              onChange={updateDoctor}
              wide
            >
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.fullName || doctor.name}
                  {doctor.specialization ? ` - ${doctor.specialization}` : ''}
                </option>
              ))}
            </SelectField>
          </div>
          {doctorsError && <p className="field-error doctor-load-error">{doctorsError}</p>}
        </section>

        <section className="form-section medical-section">
          <div className="section-heading">
            <Stethoscope size={22} />
            <div>
              <h2>{t('patientForm.medicalTitle')}</h2>
              <p>{t('patientForm.medicalSubtitle')}</p>
            </div>
          </div>

          <MedicalGroup
            title={t('patientForm.symptomsTitle')}
            description={t('patientForm.symptomsDescription')}
          >
            <div className="chip-grid">
              {symptomOptions.map((symptom) => {
                const SymptomIcon = symptom.icon
                const isSelected = selectedSymptoms.includes(symptom.name)

                return (
                  <button
                    type="button"
                    key={symptom.name}
                    className={`choice-chip${isSelected ? ' choice-chip--selected' : ''}`}
                    onClick={() => openSymptomDetails(symptom.name)}
                  >
                    {isSelected && <Check size={16} />}
                    {!isSelected && <SymptomIcon size={16} />}
                    {translateSymptom(symptom.name)}
                  </button>
                )
              })}
            </div>

            {selectedSymptoms.length > 0 && (
              <div className="selected-symptoms-block" aria-label={t('patientForm.selectedSymptomsAria')}>
                <span>{t('patientForm.selected')}</span>
                <div className="selected-symptoms-list">
                  {selectedSymptoms.map((symptomName) => {
                    const symptomOption = symptomOptions.find((symptom) => symptom.name === symptomName)
                    const SelectedIcon = symptomOption?.icon || BadgePlus
                    const savedDetails = getSavedSymptomDetails(symptomName)

                    return (
                      <div className="selected-symptom-pill" key={symptomName}>
                        <SelectedIcon size={18} />
                        <div className="selected-symptom-copy">
                          <strong>{translateSymptom(symptomName)}</strong>
                          <small>
                            {savedDetails.selection
                              ? t('symptomModal.selectionSaved', {
                                  selection: translateSymptomSelection(savedDetails.selection),
                                })
                              : ''}
                            {t('symptomModal.strength')} {savedDetails.severity}/10
                            {savedDetails.since
                              ? ` · ${t('symptomModal.durationSaved', {
                                  duration: translateDuration(savedDetails.since),
                                })}`
                              : ` · ${t('symptomModal.durationOpen')}`}
                          </small>
                        </div>
                        <button
                          type="button"
                          className="selected-symptom-action"
                          onClick={() => openSymptomDetails(symptomName)}
                          aria-label={t('patientForm.editSymptom', { name: translateSymptom(symptomName) })}
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          type="button"
                          className="selected-symptom-action selected-symptom-action--remove"
                          onClick={() => removeSymptom(symptomName)}
                          aria-label={t('patientForm.removeSymptom', { name: translateSymptom(symptomName) })}
                        >
                          <X size={20} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <InlineAdd
              label={t('patientForm.moreSymptoms')}
              value={customSymptomValue}
              onChange={setCustomSymptomValue}
              onAdd={addCustomSymptom}
            />
          </MedicalGroup>

          <MedicalGroup title={t('patientForm.allergies')}>
            <TagPicker
              options={[...allergyOptions, ...customAllergies]}
              selectedItems={selectedAllergies}
              onToggle={(item) => toggleListItem(item, selectedAllergies, setSelectedAllergies)}
              getLabel={translateAllergy}
            />
            <InlineAdd
              label={t('patientForm.moreAllergy')}
              value={customAllergyValue}
              onChange={setCustomAllergyValue}
              onAdd={() =>
                addCustomTag(
                  customAllergyValue,
                  setCustomAllergyValue,
                  selectedAllergies,
                  setSelectedAllergies,
                  customAllergies,
                  setCustomAllergies
                )
              }
            />
          </MedicalGroup>

          <MedicalGroup title={t('patientForm.medications')}>
            <TagPicker
              options={[...medicationOptions, ...customMedications]}
              selectedItems={selectedMedications}
              onToggle={(item) => toggleListItem(item, selectedMedications, setSelectedMedications)}
              icon={Pill}
              getLabel={translateMedication}
            />
            <InlineAdd
              label={t('patientForm.moreMedication')}
              value={customMedicationValue}
              onChange={setCustomMedicationValue}
              onAdd={() =>
                addCustomTag(
                  customMedicationValue,
                  setCustomMedicationValue,
                  selectedMedications,
                  setSelectedMedications,
                  customMedications,
                  setCustomMedications
                )
              }
            />
          </MedicalGroup>
        </section>

        <section className="form-section">
          <div className="section-heading">
            <FileText size={22} />
            <div>
              <h2>{t('patientForm.documents')}</h2>
              <p>{t('patientForm.documentsSubtitle')}</p>
            </div>
          </div>

          <div className={`upload-zone${errors.documents ? ' upload-zone--error' : ''}`}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,image/*"
              className="visually-hidden"
              onChange={handleFileChange}
            />
            <div className="upload-zone__copy">
              <UploadCloud size={28} />
              <div>
                <strong>{t('patientForm.uploadTitle')}</strong>
                <span>{t('patientForm.uploadHint')}</span>
              </div>
            </div>
            <button type="button" className="secondary-action" onClick={() => fileInputRef.current?.click()}>
              <FileUp size={16} />
              {t('patientForm.selectFiles')}
            </button>
          </div>
          {errors.documents && <p className="field-error">{errors.documents}</p>}

          {documents.length > 0 && (
            <ul className="file-list" aria-label={t('patientForm.selectedDocumentsAria')}>
              {documents.map((file) => (
                <li key={file.name}>
                  <span>{file.name}</span>
                  <small>{Math.ceil(file.size / 1024)} KB</small>
                  <button
                    type="button"
                    onClick={() => removeDocument(file.name)}
                    aria-label={t('patientForm.removeSymptom', { name: file.name })}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="form-section">
          <div className="section-heading">
            <ClipboardList size={22} />
            <div>
              <h2>{t('patientForm.signature')}</h2>
              <p>{t('patientForm.signatureSubtitle')}</p>
            </div>
          </div>

          <div className={`signature-box${errors.signature ? ' signature-box--error' : ''}`}>
            <canvas
              ref={signatureCanvasRef}
              className="signature-canvas"
              aria-label={t('patientForm.signatureField')}
              onPointerDown={startSignature}
              onPointerMove={drawSignature}
              onPointerUp={endSignature}
              onPointerCancel={endSignature}
              onPointerLeave={endSignature}
            />
          </div>
          <div className="signature-footer">
            <button type="button" className="secondary-action" onClick={clearSignature}>
              <Trash2 size={16} />
              {t('common.delete')}
            </button>
            <div>
              <strong>{t('patientForm.signatureRequiredTitle')}</strong>
              <span>{t('patientForm.signatureRequiredHint')}</span>
            </div>
          </div>
          {errors.signature && <p className="field-error">{errors.signature}</p>}
        </section>

        <button type="submit" className="submit-action" disabled={isSubmitting}>
          <Send size={18} />
          {isSubmitting ? t('patientForm.submitting') : t('common.submit')}
        </button>
      </form>

      {activeSymptom && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="symptom-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="symptom-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div className="modal-icon">
                <ActiveSymptomIcon size={27} />
              </div>
              <div>
                <h2 id="symptom-modal-title">{activeSymptomLabel}</h2>
                <p>{t('symptomModal.subtitle')}</p>
              </div>
              <button type="button" className="icon-action" onClick={closeSymptomDetails} aria-label={t('symptomModal.close')}>
                <X size={20} />
              </button>
            </div>

            {activeSelectionOptions.length > 0 && (
              <div className="modal-field">
                <label>{t('symptomModal.selection')}</label>
                <div className="segmented-control">
                  {activeSelectionOptions.map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={activeDetails.selection === option ? 'is-active' : ''}
                      onClick={() => updateActiveSymptom('selection', option)}
                    >
                      {activeDetails.selection === option && <Check size={16} />}
                      {translateSymptomSelection(option)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-field modal-field--severity">
              <label htmlFor="symptomSeverity">{t('symptomModal.severity')}</label>
              <div className="slider-row">
                <input
                  id="symptomSeverity"
                  type="range"
                  min="0"
                  max="10"
                  value={activeDetails.severity}
                  style={{ '--slider-progress': `${Number(activeDetails.severity || 0) * 10}%` }}
                  onChange={(event) => updateActiveSymptom('severity', Number(event.target.value))}
                />
                <output>{activeDetails.severity}</output>
              </div>
            </div>

            <div className="modal-field modal-field--duration">
              <label htmlFor="symptomSince">{t('symptomModal.duration')}</label>
              <DurationSelect
                id="symptomSince"
                value={activeDetails.since}
                options={sinceOptions}
                placeholder={t('symptomModal.duration')}
                getOptionLabel={translateDuration}
                defaultOpen
                onChange={(value) => updateActiveSymptom('since', value)}
              />
            </div>

            <div className="modal-field">
              <textarea
                id="symptomNotes"
                className="modal-textarea"
                value={activeDetails.notes}
                placeholder={t('symptomModal.notes')}
                aria-label={t('symptomModal.notes')}
                onChange={(event) => updateActiveSymptom('notes', event.target.value)}
                rows="4"
              />
            </div>

            {selectedSymptoms.includes(activeSymptom) && (
              <button type="button" className="modal-remove-link" onClick={removeActiveSymptom}>
                {t('symptomModal.remove')}
              </button>
            )}
            <div className="modal-actions">
              <button type="button" className="secondary-action modal-cancel-action" onClick={closeSymptomDetails}>
                {t('common.cancel')}
              </button>
              <button type="button" className="primary-action modal-save-action" onClick={saveActiveSymptom}>
                {t('common.save')}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

function TextField({ id, label, value, onChange, type = 'text', error, wide = false, max }) {
  return (
    <div className={`text-field${wide ? ' text-field--wide' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={label}
        className={error ? 'input-error' : ''}
        max={max}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <span>{error}</span>}
    </div>
  )
}

function SelectField({ id, label, value, onChange, error, wide = false, disabled = false, placeholder, children }) {
  return (
    <div className={`text-field${wide ? ' text-field--wide' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        className={error ? 'input-error' : ''}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      {error && <span>{error}</span>}
    </div>
  )
}

function DurationSelect({ id, value, options, onChange, placeholder, getOptionLabel = (option) => option, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const selectRef = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const closeOnOutsideClick = (event) => {
      if (!selectRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
    }
  }, [isOpen])

  const selectOption = (option) => {
    onChange(option)
    setIsOpen(false)
  }

  return (
    <div className={`duration-select${isOpen ? ' duration-select--open' : ''}`} ref={selectRef}>
      <button
        type="button"
        id={id}
        className={`duration-select__button${value ? '' : ' is-placeholder'}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{value ? getOptionLabel(value) : placeholder}</span>
        <ChevronDown size={18} />
      </button>

      {isOpen && (
        <div className="duration-select__menu" role="listbox" aria-labelledby={id}>
          {options.map((option, index) => (
            <button
              type="button"
              key={option}
              role="option"
              aria-selected={value === option}
              className={`${value === option ? 'is-selected' : ''}${!value && index === 0 ? ' is-highlighted' : ''}`}
              onClick={() => selectOption(option)}
            >
              {getOptionLabel(option)}
              {value === option && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MedicalGroup({ title, description, children }) {
  return (
    <div className="medical-group">
      <div className="medical-group__header">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  )
}

function TagPicker({ options, selectedItems, onToggle, icon: Icon = Check, getLabel = (option) => option }) {
  const uniqueOptions = Array.from(new Set(options))

  return (
    <div className="chip-grid chip-grid--compact">
      {uniqueOptions.map((option) => {
        const isSelected = selectedItems.includes(option)

        return (
          <button
            type="button"
            key={option}
            className={`choice-chip${isSelected ? ' choice-chip--selected' : ''}`}
            onClick={() => onToggle(option)}
          >
            {isSelected ? <Check size={16} /> : <Icon size={15} />}
            {getLabel(option)}
          </button>
        )
      })}
    </div>
  )
}

function InlineAdd({ label, value, onChange, onAdd }) {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      onAdd()
    }
  }

  return (
    <div className="inline-add">
      <input
        type="text"
        value={value}
        placeholder={label}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button type="button" onClick={onAdd} aria-label={label}>
        <Plus size={20} />
      </button>
    </div>
  )
}

export default PatientForm
