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

export const patientFormApi = {
  submit: async (formData) => {
    const localForm = createLocalForm(formData)

    try {
      const response = await api.post('/patient-forms', formData)
      const remoteId = response.data?.data?.id

      if (remoteId) {
        updateLocalForm(localForm._id, {
          remoteId,
          savedRemotely: true,
        })
      }

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
    const localForms = readLocalForms()

    if (isLocalAdminSession()) {
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
      const response = await api.get('/patient-forms', { params })
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
      if (!isRecoverableApiFailure(error) && ![401, 403, 404].includes(error.response?.status)) {
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

    if (localForm) {
      return {
        data: {
          status: 'success',
          data: localForm,
          savedLocally: true,
        },
      }
    }

    return api.get(`/patient-forms/${id}`)
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
}

export default patientFormApi
