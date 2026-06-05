import React, { useState, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './components/Login'
import UserManagement from './pages/UserManagement'
import { API_BASE_URL } from './api/userApi'
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

  if (error) {
    return (
      <div className="app-container">
        <div className="error-state">
          <h2>Connection Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

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
