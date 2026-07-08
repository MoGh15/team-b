export const LOCAL_DOCTORS_KEY = 'clinicHealthForm.localDoctors'

const createApiError = (message, status = 400) => {
  const error = new Error(message)
  error.response = {
    status,
    data: { message },
  }
  return error
}

const createId = () => `local-doctor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const normalizeDoctor = (doctor) => {
  const isActive = doctor.isActive !== false && doctor.status !== 'inactive'
  const id = doctor._id || doctor.id || createId()
  const fullName = doctor.fullName || doctor.name || ''

  return {
    ...doctor,
    _id: id,
    id,
    fullName,
    name: doctor.name || fullName,
    email: (doctor.email || '').trim().toLowerCase(),
    role: 'doctor',
    specialization: doctor.specialization || '',
    isActive,
    status: isActive ? 'active' : 'inactive',
    savedLocally: true,
  }
}

export const readLocalDoctors = () => {
  try {
    const doctors = JSON.parse(localStorage.getItem(LOCAL_DOCTORS_KEY) || '[]')
    return Array.isArray(doctors) ? doctors.map(normalizeDoctor) : []
  } catch (error) {
    return []
  }
}

export const writeLocalDoctors = (doctors) => {
  localStorage.setItem(LOCAL_DOCTORS_KEY, JSON.stringify(doctors.map(normalizeDoctor)))
}

export const sanitizeDoctor = (doctor) => {
  if (!doctor) {
    return null
  }

  const { password, ...safeDoctor } = normalizeDoctor(doctor)
  return safeDoctor
}

export const getLocalDoctors = () => readLocalDoctors().map(sanitizeDoctor)

export const getActiveLocalDoctors = () =>
  getLocalDoctors().filter((doctor) => doctor.role === 'doctor' && doctor.isActive !== false && doctor.status === 'active')

export const createLocalDoctor = (doctorData) => {
  const fullName = (doctorData.fullName || doctorData.name || '').trim()
  const email = (doctorData.email || '').trim().toLowerCase()
  const password = doctorData.password || ''

  if (!fullName || !email || !password) {
    throw createApiError('Full name, email, and password are required')
  }

  const doctors = readLocalDoctors()
  const emailExists = doctors.some((doctor) => doctor.email === email)

  if (emailExists) {
    throw createApiError('Doctor email already exists')
  }

  const now = new Date().toISOString()
  const doctor = normalizeDoctor({
    _id: createId(),
    fullName,
    name: fullName,
    email,
    password,
    role: 'doctor',
    specialization: doctorData.specialization || '',
    isActive: doctorData.isActive !== false,
    status: doctorData.isActive === false ? 'inactive' : 'active',
    createdAt: now,
    updatedAt: now,
  })

  writeLocalDoctors([doctor, ...doctors])
  return sanitizeDoctor(doctor)
}

export const updateLocalDoctor = (id, doctorData) => {
  const now = new Date().toISOString()
  let updatedDoctor = null

  const doctors = readLocalDoctors().map((doctor) => {
    if (doctor._id !== id) {
      return doctor
    }

    const nextDoctor = {
      ...doctor,
      fullName: doctorData.fullName?.trim() || doctor.fullName,
      name: doctorData.fullName?.trim() || doctorData.name,
      email: doctorData.email?.trim().toLowerCase() || doctor.email,
      specialization:
        Object.prototype.hasOwnProperty.call(doctorData, 'specialization')
          ? doctorData.specialization || ''
          : doctor.specialization,
      updatedAt: now,
    }

    if (doctorData.password) {
      nextDoctor.password = doctorData.password
    }

    updatedDoctor = normalizeDoctor(nextDoctor)
    return updatedDoctor
  })

  if (!updatedDoctor) {
    throw createApiError('Doctor not found', 404)
  }

  writeLocalDoctors(doctors)
  return sanitizeDoctor(updatedDoctor)
}

export const updateLocalDoctorStatus = (id, isActive) => {
  const now = new Date().toISOString()
  let updatedDoctor = null

  const doctors = readLocalDoctors().map((doctor) => {
    if (doctor._id !== id) {
      return doctor
    }

    updatedDoctor = normalizeDoctor({
      ...doctor,
      isActive: Boolean(isActive),
      status: isActive ? 'active' : 'inactive',
      updatedAt: now,
    })

    return updatedDoctor
  })

  if (!updatedDoctor) {
    throw createApiError('Doctor not found', 404)
  }

  writeLocalDoctors(doctors)
  return sanitizeDoctor(updatedDoctor)
}

export const findLocalDoctorByCredentials = ({ identifier, email, username, password }) => {
  const loginIdentifier = (identifier || email || username || '').trim().toLowerCase()

  if (!loginIdentifier || !password) {
    return null
  }

  const doctor = readLocalDoctors().find((currentDoctor) => {
    return currentDoctor.email === loginIdentifier && currentDoctor.password === password
  })

  if (!doctor || doctor.isActive === false || doctor.status !== 'active') {
    return null
  }

  return sanitizeDoctor(doctor)
}
