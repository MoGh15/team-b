import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const userApi = {
  // Get all users
  getAllUsers: () => api.get('/users'),

  // Get single user
  getUser: (id) => api.get(`/users/${id}`),

  // Create user
  createUser: (userData) => api.post('/users', userData),

  // Update user
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),

  // Delete user
  deleteUser: (id) => api.delete(`/users/${id}`),

  // Check health
  checkHealth: () => api.get('/health'),
}

export default api
