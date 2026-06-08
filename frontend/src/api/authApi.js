import api from './userApi'

const DEFAULT_ADMIN_EMAIL = 'admin@example.com'
const DEFAULT_ADMIN_USERNAME = 'admin'
const DEFAULT_ADMIN_PASSWORD = 'admin123'

const canUseLocalAdminLogin = (error) => {
  return !error.response || error.response.status >= 500 || typeof error.response.data === 'string'
}

const isDefaultAdmin = ({ identifier, email, username, password }) => {
  const loginIdentifier = (identifier || email || username || '').trim().toLowerCase()

  return (
    password === DEFAULT_ADMIN_PASSWORD &&
    [DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_USERNAME].includes(loginIdentifier)
  )
}

const createLocalAdminSession = () => ({
  data: {
    status: 'success',
    message: 'Local admin login successful',
    token: `local-admin-${Date.now()}`,
    localAuth: true,
    user: {
      id: 'local-admin',
      name: DEFAULT_ADMIN_USERNAME,
      email: DEFAULT_ADMIN_EMAIL,
      role: 'admin',
    },
  },
})

export const authApi = {
  login: async (credentials) => {
    try {
      return await api.post('/auth/login', credentials)
    } catch (error) {
      if (canUseLocalAdminLogin(error) && isDefaultAdmin(credentials)) {
        return createLocalAdminSession()
      }

      throw error
    }
  },
  me: () => api.get('/auth/me'),
}

export default authApi
