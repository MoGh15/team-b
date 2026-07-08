import api from './userApi'
import {
  createLocalDoctor,
  getActiveLocalDoctors,
  getLocalDoctors,
  updateLocalDoctor,
  updateLocalDoctorStatus,
} from './localDoctorStore'

const isNetworkFailure = (error) => {
  return !error.response || error.code === 'ERR_NETWORK' || error.message === 'Network Error'
}

const isRecoverableApiFailure = (error) => {
  return isNetworkFailure(error) || error.response?.status >= 500 || typeof error.response?.data === 'string'
}

const isLocalAdminSession = () => {
  return localStorage.getItem('authToken')?.startsWith('local-admin-')
}

const buildResponse = (data, extra = {}) => ({
  data: {
    status: 'success',
    data,
    ...extra,
  },
})

export const doctorApi = {
  getPublicDoctors: async () => {
    try {
      return await api.get('/doctors/public')
    } catch (error) {
      if (!isRecoverableApiFailure(error)) {
        throw error
      }

      const doctors = getActiveLocalDoctors()
      return buildResponse(doctors, { count: doctors.length, savedLocally: true })
    }
  },
  createDoctor: async (doctorData) => {
    if (isLocalAdminSession()) {
      const doctor = createLocalDoctor(doctorData)
      return buildResponse(doctor, { savedLocally: true })
    }

    try {
      return await api.post('/admin/doctors', doctorData)
    } catch (error) {
      if (!isRecoverableApiFailure(error)) {
        throw error
      }

      const doctor = createLocalDoctor(doctorData)
      return buildResponse(doctor, { savedLocally: true })
    }
  },
  getAdminDoctors: async () => {
    if (isLocalAdminSession()) {
      const doctors = getLocalDoctors()
      return buildResponse(doctors, { count: doctors.length, savedLocally: true })
    }

    try {
      return await api.get('/admin/doctors')
    } catch (error) {
      if (!isRecoverableApiFailure(error)) {
        throw error
      }

      const doctors = getLocalDoctors()
      return buildResponse(doctors, { count: doctors.length, savedLocally: true })
    }
  },
  updateDoctor: async (id, doctorData) => {
    if (isLocalAdminSession()) {
      const doctor = updateLocalDoctor(id, doctorData)
      return buildResponse(doctor, { savedLocally: true })
    }

    try {
      return await api.patch(`/admin/doctors/${id}`, doctorData)
    } catch (error) {
      if (!isRecoverableApiFailure(error)) {
        throw error
      }

      const doctor = updateLocalDoctor(id, doctorData)
      return buildResponse(doctor, { savedLocally: true })
    }
  },
  updateDoctorStatus: async (id, isActive) => {
    if (isLocalAdminSession()) {
      const doctor = updateLocalDoctorStatus(id, isActive)
      return buildResponse(doctor, { savedLocally: true })
    }

    try {
      return await api.patch(`/admin/doctors/${id}/status`, { isActive })
    } catch (error) {
      if (!isRecoverableApiFailure(error)) {
        throw error
      }

      const doctor = updateLocalDoctorStatus(id, isActive)
      return buildResponse(doctor, { savedLocally: true })
    }
  },
}

export default doctorApi
