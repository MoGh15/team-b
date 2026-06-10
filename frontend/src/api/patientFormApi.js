import api from './userApi'

const LOCAL_FORMS_KEY = 'clinicHealthForm.localPatientForms'

const isNetworkFailure = (error) => {
  return !error.response || error.code === 'ERR_NETWORK' || error.message === 'Network Error'
}

const isRecoverableApiFailure = (error) => {
  return isNetworkFailure(error) || error.response?.status >= 500
}

const isLocalAdminSession = () => {
  return localStorage.getItem('authToken')?.startsWith('local-admin-')
}

const isLocalDoctorSession = () => {
  return localStorage.getItem('authToken')?.startsWith('local-doctor-')
}

const isLocalSession = () => {
  return isLocalAdminSession() || isLocalDoctorSession()
}

const getAuthUser = () => {
  try {
    return JSON.parse(localStorage.getItem('authUser') || 'null')
  } catch (error) {
    return null
  }
}

const getFormDoctorId = (form) => {
  if (!form?.doctorId) {
    return ''
  }

  return typeof form.doctorId === 'object' ? form.doctorId._id : form.doctorId
}

const filterLocalForms = (forms, params = {}) => {
  return forms.filter((form) => {
    const matchesDoctor = !params.doctorId || getFormDoctorId(form) === params.doctorId
    const matchesStatus = !params.status || form.status === params.status

    return matchesDoctor && matchesStatus
  })
}

const getPatientFormsListEndpoint = () => {
  return getAuthUser()?.role === 'doctor' ? '/doctor/patient-forms' : '/admin/patient-forms'
}

const getPatientFormDetailsEndpoint = (id) => {
  return getAuthUser()?.role === 'doctor' ? `/doctor/patient-forms/${id}` : `/admin/patient-forms/${id}`
}

const readLocalForms = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_FORMS_KEY) || '[]')
  } catch (error) {
    return []
  }
}

const writeLocalForms = (forms) => {
  localStorage.setItem(LOCAL_FORMS_KEY, JSON.stringify(forms))
}

const createLocalForm = (formData) => {
  const now = new Date().toISOString()
  const localForm = {
    ...formData,
    _id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'NEW',
    statusUpdatedAt: now,
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
    savedLocally: true,
  }

  writeLocalForms([localForm, ...readLocalForms()])
  return localForm
}

const findLocalForm = (id) => {
  return readLocalForms().find((form) => form._id === id)
}

const updateLocalFormStatus = (id, status) => {
  const now = new Date().toISOString()
  let updatedForm = null
  const forms = readLocalForms().map((form) => {
    if (form._id !== id) {
      return form
    }

    updatedForm = {
      ...form,
      status,
      statusUpdatedAt: now,
      updatedAt: now,
    }
    return updatedForm
  })

  writeLocalForms(forms)
  return updatedForm
}

const updateLocalForm = (id, updates) => {
  const now = new Date().toISOString()
  let updatedForm = null
  const forms = readLocalForms().map((form) => {
    if (form._id !== id) {
      return form
    }

    updatedForm = {
      ...form,
      ...updates,
      _id: form._id,
      status: updates.status || form.status,
      statusUpdatedAt: updates.statusUpdatedAt || form.statusUpdatedAt,
      savedLocally: true,
      updatedAt: now,
    }
    return updatedForm
  })

  writeLocalForms(forms)
  return updatedForm
}

const updateLocalDoctorConsultation = (id, updates) => {
  const authUser = getAuthUser()
  const localForm = findLocalForm(id)

  if (!localForm) {
    return null
  }

  if (authUser?.role === 'doctor' && getFormDoctorId(localForm) !== authUser.id) {
    const error = new Error('Doctors can only update patient forms assigned to them')
    error.response = { status: 403, data: { message: error.message } }
    throw error
  }

  const now = new Date().toISOString()
  return updateLocalForm(id, {
    consultation: {
      diagnosis: updates.diagnosis || '',
      notes: updates.notes || '',
      prescription: updates.prescription || '',
      updatedAt: now,
      updatedBy: authUser?.id,
    },
    status: updates.status || localForm.status,
    statusUpdatedAt: updates.status ? now : localForm.statusUpdatedAt,
  })
}

export const patientFormApi = {
  submit: async (formData) => {
    try {
      const response = await api.post('/patient-forms', formData)
      const remoteId = response.data?.data?.id
      const localForm = createLocalForm({
        ...formData,
        remoteId,
        savedRemotely: Boolean(remoteId),
      })

      return {
        ...response,
        data: {
          ...response.data,
          localCopyId: localForm._id,
          data: {
            ...(response.data?.data || {}),
            localCopyId: localForm._id,
          },
        },
      }
    } catch (error) {
      const hasLocalDoctor = String(formData.doctorId || '').startsWith('local-doctor-')

      if (!isRecoverableApiFailure(error) && !hasLocalDoctor) {
        throw error
      }

      const localForm = createLocalForm(formData)

      return {
        data: {
          status: 'success',
          message: error.response?.data?.message || 'Patient form saved locally for admin review',
          savedLocally: true,
          data: {
            id: localForm._id,
            submittedAt: localForm.submittedAt,
          },
        },
      }
    }
  },
  getAll: async (params = {}) => {
    const authUser = getAuthUser()
    const localParams = authUser?.role === 'doctor' ? { ...params, doctorId: authUser.id } : params
    const localForms = filterLocalForms(readLocalForms(), localParams)

    if (isLocalSession()) {
      return {
        data: {
          status: 'success',
          data: localForms,
          count: localForms.length,
          savedLocally: true,
        },
      }
    }

    try {
      const response = await api.get(getPatientFormsListEndpoint(), { params })
      const remoteForms = response.data?.data || []
      const remoteIds = new Set(remoteForms.map((form) => form._id).filter(Boolean))
      const visibleLocalForms = localForms.filter((form) => !remoteIds.has(form.remoteId))

      return {
        ...response,
        data: {
          ...response.data,
          data: [...visibleLocalForms, ...remoteForms],
          count: visibleLocalForms.length + remoteForms.length,
        },
      }
    } catch (error) {
      if (!isRecoverableApiFailure(error)) {
        throw error
      }

      return {
        data: {
          status: 'success',
          data: localForms,
          count: localForms.length,
          savedLocally: true,
        },
      }
    }
  },
  getById: async (id) => {
    const localForm = findLocalForm(id)
    const authUser = getAuthUser()

    if (localForm) {
      if (authUser?.role === 'doctor' && getFormDoctorId(localForm) !== authUser.id) {
        const error = new Error('Doctors can only access patient forms assigned to them')
        error.response = { status: 403, data: { message: error.message } }
        throw error
      }

      return {
        data: {
          status: 'success',
          data: localForm,
          savedLocally: true,
        },
      }
    }

    return api.get(getPatientFormDetailsEndpoint(id))
  },
  update: async (id, updates) => {
    const localForm = findLocalForm(id)

    if (localForm) {
      const updatedForm = updateLocalForm(id, updates)
      return {
        data: {
          status: 'success',
          data: updatedForm,
          savedLocally: true,
        },
      }
    }

    return api.put(`/patient-forms/${id}`, updates)
  },
  updateStatus: async (id, status) => {
    const localForm = findLocalForm(id)

    if (localForm) {
      const updatedForm = updateLocalFormStatus(id, status)
      return {
        data: {
          status: 'success',
          data: updatedForm,
          savedLocally: true,
        },
      }
    }

    return api.patch(`/patient-forms/${id}/status`, { status })
  },
  updateDoctorConsultation: async (id, updates) => {
    const localForm = findLocalForm(id)

    if (localForm || isLocalDoctorSession()) {
      const updatedForm = updateLocalDoctorConsultation(id, updates)

      if (updatedForm) {
        return {
          data: {
            status: 'success',
            data: updatedForm,
            savedLocally: true,
          },
        }
      }
    }

    return api.patch(`/doctor/patient-forms/${id}/consultation`, updates)
  },
}

export default patientFormApi
