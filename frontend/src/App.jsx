import React, { useState, useEffect } from 'react'
import UserManagement from './pages/UserManagement'
import { API_BASE_URL } from './api/userApi'
import './App.css'

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
      <UserManagement />
    </div>
  )
}

export default App
