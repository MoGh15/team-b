import React from 'react'
import './UserCard.css'

function UserCard({ user, onEdit, onDelete }) {
  return (
    <div className={`user-card status-${user.status}`}>
      <div className="card-header">
        <div className="user-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="card-title">
          <h3>{user.name}</h3>
          <p className="email">{user.email}</p>
        </div>
      </div>

      <div className="card-body">
        <div className="info-item">
          <label>Role</label>
          <span className={`badge badge-${user.role}`}>
            {user.role}
          </span>
        </div>

        <div className="info-item">
          <label>Status</label>
          <span className={`status-badge status-${user.status}`}>
            {user.status}
          </span>
        </div>

        <div className="info-item">
          <label>Joined</label>
          <span>{new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="card-footer">
        <button className="btn-secondary btn-edit" onClick={onEdit}>
          Edit
        </button>
        <button className="btn-secondary btn-delete" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  )
}

export default UserCard
