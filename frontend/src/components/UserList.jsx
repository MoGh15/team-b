import React from 'react'
import UserCard from './UserCard'
import './UserList.css'

function UserList({ users, loading, onEdit, onDelete, onRefresh }) {
  if (loading) {
    return (
      <div className="user-list loading">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="user-list empty">
        <div className="empty-state">
          <h3>No Users Found</h3>
          <p>Get started by creating your first user</p>
        </div>
      </div>
    )
  }

  return (
    <div className="user-list">
      <div className="user-list-header">
        <h2>Users ({users.length})</h2>
        <button className="btn-refresh" onClick={onRefresh} title="Refresh users">
          ↻
        </button>
      </div>

      <div className="users-grid">
        {users.map((user) => (
          <UserCard
            key={user._id}
            user={user}
            onEdit={() => onEdit(user)}
            onDelete={() => onDelete(user._id)}
          />
        ))}
      </div>

      {/* Table view for larger screens */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className={`status-${user.status}`}>
                <td className="cell-name">{user.name}</td>
                <td className="cell-email">{user.email}</td>
                <td className="cell-role">
                  <span className={`badge badge-${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td className="cell-status">
                  <span className={`status-badge status-${user.status}`}>
                    {user.status}
                  </span>
                </td>
                <td className="cell-date">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="cell-actions">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => onEdit(user)}
                    title="Edit user"
                  >
                    ✎
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => onDelete(user._id)}
                    title="Delete user"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UserList
