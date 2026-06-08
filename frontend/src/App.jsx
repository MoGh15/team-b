import React from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import UserManagement from './pages/UserManagement'
import PatientForm from './pages/PatientForm'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import SubmissionDetails from './pages/SubmissionDetails'
import CookieConsent from './components/CookieConsent'
import './App.css'

function ProtectedRoute({ children }) {
  const location = useLocation()
  const token = localStorage.getItem('authToken')

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
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
              <ProtectedRoute>
                <Navigate to="/admin/submissions" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/submissions"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/submissions/:id"
            element={
              <ProtectedRoute>
                <SubmissionDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <UserManagement />
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
