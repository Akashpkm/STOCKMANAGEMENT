import React from 'react'

const Profile = ({ user }) => {
  return (
    <div className="profile-page">
      <div className="page-header">
        <div className="header-content">
          <h1><i className="fas fa-user"></i> Profile</h1>
          <p>Manage your account information</p>
        </div>
      </div>
      
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <i className="fas fa-user-circle"></i>
            </div>
            <div className="profile-info">
              <h2>{user?.name}</h2>
              <p className="profile-email">{user?.email}</p>
              <span className={`role-badge ${user?.role === 'admin' ? 'role-admin' : 'role-staff'}`}>
                <i className={`fas ${user?.role === 'admin' ? 'fa-user-shield' : 'fa-user'}`}></i>
                {user?.role?.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="profile-details">
            <h3><i className="fas fa-info-circle"></i> User Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">
                  <i className="fas fa-id-card"></i>
                  Full Name
                </div>
                <div className="info-value">{user?.name}</div>
              </div>
              
              <div className="info-item">
                <div className="info-label">
                  <i className="fas fa-envelope"></i>
                  Email Address
                </div>
                <div className="info-value">{user?.email}</div>
              </div>
              
              <div className="info-item">
                <div className="info-label">
                  <i className="fas fa-user-tag"></i>
                  Role
                </div>
                <div className="info-value">
                  <span className={`role-tag ${user?.role === 'admin' ? 'role-admin' : 'role-staff'}`}>
                    {user?.role}
                  </span>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-label">
                  <i className="fas fa-key"></i>
                  Permissions
                </div>
                <div className="info-value">
                  {user?.role === 'admin' 
                    ? 'Full access to all features' 
                    : 'Read-only access to view data'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="system-info">
            <h3><i className="fas fa-cogs"></i> System Information</h3>
            <div className="system-details">
              <div className="system-item">
                <i className="fas fa-boxes"></i>
                <div>
                  <strong>Stock Management System v2.0</strong>
                  <p>Professional inventory tracking solution</p>
                </div>
              </div>
              
              <div className="system-features">
                <h4>Features</h4>
                <ul>
                  <li><i className="fas fa-check"></i> Real-time inventory tracking</li>
                  <li><i className="fas fa-check"></i> Stock level alerts</li>
                  <li><i className="fas fa-check"></i> Multi-product management</li>
                  <li><i className="fas fa-check"></i> Vendor tracking</li>
                  <li><i className="fas fa-check"></i> Role-based access control</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile