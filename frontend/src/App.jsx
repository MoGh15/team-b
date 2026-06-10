import React from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import UserManagement from './pages/UserManagement'
import PatientForm from './pages/PatientForm'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import SubmissionDetails from './pages/SubmissionDetails'
import CookieConsent from './components/CookieConsent'
import './App.css'

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('authUser') || 'null')
  } catch (error) {
    return null
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
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<PatientForm />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <Navigate to="/admin/submissions" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/submissions"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/submissions/:id"
            element={
              <ProtectedRoute roles={['admin']}>
                <SubmissionDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor"
            element={
              <ProtectedRoute roles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/submissions/:id"
            element={
              <ProtectedRoute roles={['doctor']}>
                <SubmissionDetails />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <CookieConsent />
      </div>
    </BrowserRouter>
  )
}

export default App
