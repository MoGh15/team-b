import React, { useState, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './components/Login'
import UserManagement from './pages/UserManagement'
import PatientForm from './pages/PatientForm'
import AppointmentBooking from './pages/AppointmentBooking'
import Appointments from './pages/Appointments'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import SubmissionDetails from './pages/SubmissionDetails'
import CookieConsent from './components/CookieConsent'
import LanguageSwitcher from './components/LanguageSwitcher'
import './App.css'

function AdminDashboardPlaceholder() {
  return (
    <div className="admin-dashboard-placeholder">
      <div>
        <p>Admin Dashboard</p>
        <h1>Dashboard kommt später</h1>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('authToken')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

function LoginRoute() {
  const token = localStorage.getItem('authToken')

  if (token) {
    return <Navigate to="/admin-dashboard" replace />
  }

  return <Login />
}

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check if backend is accessible
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`)
        if (!response.ok) {
          throw new Error('Backend is not responding')
        }
        setIsLoading(false)
      } catch (err) {
        setError('Backend service is not available')
        setIsLoading(false)
      }
    }

    checkBackend()
  }, [])

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="loading-state">
          <p>Loading...</p>
        </div>
      </div>
    )
  }
}

function getRoleHome(role) {
  return role === 'doctor' ? '/doctor' : '/admin/submissions'
}

function ProtectedRoute({ children, roles }) {
  const location = useLocation()
  const token = localStorage.getItem('authToken')
  const user = getStoredUser()

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  if (roles?.length && !user?.role) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate to={getRoleHome(user?.role)} replace />
  }

  return children
}

function App() {
  const { t } = useTranslation()

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboardPlaceholder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  )
}

export default App
