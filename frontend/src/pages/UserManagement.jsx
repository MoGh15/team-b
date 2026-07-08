import React, { useState, useEffect } from 'react'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import UserList from '../components/UserList'
import UserForm from '../components/UserForm'
import { userApi } from '../api/userApi'
import './UserManagement.css'

function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const navigate = useNavigate()

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await userApi.getAllUsers()
      setUsers(response.data?.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClick = () => {
    setEditingUser(null)
    setShowForm(true)
  }

  const handleEditClick = (user) => {
    setEditingUser(user)
    setShowForm(true)
  }

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userApi.deleteUser(id)
        setSuccessMessage('User deleted successfully')
        fetchUsers()
        setTimeout(() => setSuccessMessage(''), 3000)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete user')
      }
    }
  }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingUser) {
        // Update user
        await userApi.updateUser(editingUser._id, formData)
        setSuccessMessage('User updated successfully')
      } else {
        // Create user
        await userApi.createUser(formData)
        setSuccessMessage('User created successfully')
      }
      setShowForm(false)
      setEditingUser(null)
      fetchUsers()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user')
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingUser(null)
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="user-management">
      <header className="management-header">
        <div className="header-content">
          <h1>User Management</h1>
          <p>Manage system users and their roles</p>
        </div>
        <div className="management-actions">
          <button
            className="btn-secondary btn-logout"
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={16} />
            Logout
          </button>
          <button
            className="btn-primary"
            onClick={handleCreateClick}
            disabled={showForm}
            type="button"
          >
            + Add New User
          </button>
        </div>
      </header>

      <main className="management-main">
        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {showForm ? (
          <UserForm
            user={editingUser}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        ) : (
          <UserList
            users={users}
            loading={loading}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onRefresh={fetchUsers}
          />
        )}
      </main>
    </div>
  )
}

export default UserManagement
