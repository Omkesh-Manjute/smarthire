import React, { useState, useEffect } from 'react'

const DEFAULT_RECRUITERS = [
  {
    id: 'rec-1',
    name: 'Omkesh',
    email: 'omkesh@coolsofttech.com',
    role: 'superadmin',
    refCode: 'omkesh',
    company: 'SmartHire LLC',
    isActive: true,
    password: 'admin',
    lastLogin: '2026-08-17T18:45:00.000Z',
    createdAt: '2026-01-10T10:00:00.000Z'
  },
  {
    id: 'rec-2',
    name: 'Sukamal Chatterjee',
    email: 'kamal@coolsofttech.com',
    role: 'recruiter',
    refCode: 'sukamal-chatterjee',
    company: 'SmartHire LLC',
    isActive: true,
    password: 'recruiter123',
    lastLogin: null,
    createdAt: '2026-02-15T11:30:00.000Z'
  },
  {
    id: 'rec-3',
    name: 'Raj',
    email: 'raj@coolsofttech.com',
    role: 'recruiter',
    refCode: 'raj',
    company: 'SmartHire LLC',
    isActive: true,
    password: 'recruiter123',
    lastLogin: null,
    createdAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'rec-4',
    name: 'Vaibhav Bisen',
    email: 'vaibhav@coolsofttech.com',
    role: 'recruiter',
    refCode: 'vaibhav-bisen',
    company: 'SmartHire LLC',
    isActive: true,
    password: 'recruiter123',
    lastLogin: null,
    createdAt: '2026-03-10T09:00:00.000Z'
  },
  {
    id: 'rec-5',
    name: 'Pankaj',
    email: 'pankajm@coolsofttech.com',
    role: 'recruiter',
    refCode: 'pankaj',
    company: 'SmartHire LLC',
    isActive: true,
    password: 'recruiter123',
    lastLogin: null,
    createdAt: '2026-03-15T08:30:00.000Z'
  }
]

export default function UsersModule({ allCandidates, permissions, setPermissions }) {
  const [subTab, setSubTab] = useState('recruiters')
  const [recruiters, setRecruiters] = useState(DEFAULT_RECRUITERS)
  const [loading, setLoading] = useState(false)

  // Add recruiter modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newRecName, setNewRecName] = useState('')
  const [newRecEmail, setNewRecEmail] = useState('')
  const [newRecCompany, setNewRecCompany] = useState('')
  const [newRecRef, setNewRecRef] = useState('')
  const [newRecRole, setNewRecRole] = useState('recruiter')
  const [newRecPassword, setNewRecPassword] = useState('')

  // Edit recruiter modal state
  const [editRecruiter, setEditRecruiter] = useState(null)
  const [editRecName, setEditRecName] = useState('')
  const [editRecEmail, setEditRecEmail] = useState('')
  const [editRecCompany, setEditRecCompany] = useState('')
  const [editRecRef, setEditRecRef] = useState('')
  const [editRecRole, setEditRecRole] = useState('recruiter')
  const [editRecPassword, setEditRecPassword] = useState('')

  const [toastMessage, setToastMessage] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  // Fetch recruiters from backend on mount
  const fetchRecruiters = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/recruiters')
      const data = await res.json()
      if (res.ok && data.success) {
        setRecruiters(data.recruiters)
      }
    } catch (err) {
      console.error('Error fetching recruiters from server:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecruiters()
  }, [])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // Get sourced candidates count in real time
  const getSourcedCount = (rec) => {
    if (!allCandidates || !Array.isArray(allCandidates)) return 0
    return allCandidates.filter(c => {
      const ref = (c.recruiterRefCode || c.referredByRecruiterName || '').toLowerCase()
      const recRef = (rec.refCode || '').toLowerCase()
      const recName = (rec.name || '').toLowerCase()
      
      return (
        ref === recRef || 
        ref.includes(recRef) ||
        ref.includes(recName) ||
        (c.referredByRecruiter && c.referredByRecruiter === rec.id)
      )
    }).length
  }

  const handleToggleStatus = async (id, currentName) => {
    try {
      const res = await fetch(`/api/admin/recruiters/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setRecruiters(prev => prev.map(r => r.id === id ? { ...r, isActive: data.recruiter.isActive } : r))
        showToast(`User "${currentName}" account ${data.recruiter.isActive ? 'activated' : 'deactivated'}.`)
      } else {
        alert(data.message || 'Failed to update status.')
      }
    } catch (err) {
      console.error('Status toggle failed:', err)
      alert('Server connection error.')
    }
  }

  const handleAddRecruiter = async (e) => {
    e.preventDefault()
    if (!newRecName.trim() || !newRecEmail.trim() || !newRecPassword.trim()) {
      alert('Name, Email, and Password are required fields.')
      return
    }

    const newRefCode = newRecRef.trim() 
      ? newRecRef.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')
      : newRecName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')

    const payload = {
      name: newRecName.trim(),
      email: newRecEmail.trim().toLowerCase(),
      role: newRecRole,
      refCode: newRefCode,
      company: newRecCompany.trim() || 'SmartHire LLC',
      password: newRecPassword.trim()
    }

    try {
      const res = await fetch('/api/admin/recruiters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setRecruiters(prev => [data.recruiter, ...prev])
        setShowAddModal(false)
        showToast(`User account created for "${payload.name}"!`)

        // Clear form
        setNewRecName('')
        setNewRecEmail('')
        setNewRecCompany('')
        setNewRecRef('')
        setNewRecRole('recruiter')
        setNewRecPassword('')
        
        // Reload list to get proper ids and values
        fetchRecruiters()
      } else {
        alert(data.message || 'Failed to create user.')
      }
    } catch (err) {
      console.error('Add user failed:', err)
      alert('Server connection error.')
    }
  }

  // Open Edit Modal
  const openEditModal = (rec) => {
    setEditRecruiter(rec)
    setEditRecName(rec.name)
    setEditRecEmail(rec.email)
    setEditRecCompany(rec.company || '')
    setEditRecRef(rec.refCode || '')
    setEditRecRole(rec.role)
    setEditRecPassword(rec.password || '')
  }

  const handleUpdateRecruiter = async (e) => {
    e.preventDefault()
    if (!editRecName.trim() || !editRecEmail.trim() || !editRecPassword.trim()) {
      alert('Name, Email, and Password are required fields.')
      return
    }

    const finalRefCode = editRecRef.trim() 
      ? editRecRef.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')
      : editRecName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')

    const payload = {
      name: editRecName.trim(),
      email: editRecEmail.trim().toLowerCase(),
      role: editRecRole,
      refCode: finalRefCode,
      company: editRecCompany.trim() || 'SmartHire LLC',
      password: editRecPassword.trim()
    }

    try {
      const res = await fetch(`/api/admin/recruiters/${editRecruiter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setRecruiters(prev => prev.map(r => r.id === editRecruiter.id ? { ...r, ...data.recruiter } : r))
        setEditRecruiter(null)
        showToast(`User "${editRecName}" updated successfully!`)
        fetchRecruiters()
      } else {
        alert(data.message || 'Failed to update user.')
      }
    } catch (err) {
      console.error('Update user failed:', err)
      alert('Server connection error.')
    }
  }

  const handleDeleteRecruiter = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete user "${name}"?`)) {
      try {
        const res = await fetch(`/api/admin/recruiters/${id}`, {
          method: 'DELETE'
        })
        const data = await res.json()
        if (res.ok && data.success) {
          setRecruiters(prev => prev.filter(r => r.id !== id))
          showToast(`User "${name}" account deleted.`)
        } else {
          alert(data.message || 'Failed to delete user.')
        }
      } catch (err) {
        console.error('Delete user failed:', err)
        alert('Server connection error.')
      }
    }
  }

  const handleTogglePermission = (role, pageId) => {
    const updated = {
      ...permissions,
      [role]: {
        ...permissions[role],
        [pageId]: !permissions[role]?.[pageId]
      }
    }
    setPermissions(updated)
    try {
      localStorage.setItem('smarthire_role_permissions', JSON.stringify(updated))
    } catch(e) {}
    showToast(`Permissions updated for ${role === 'superadmin' ? 'Super Admin' : 'Recruiter'} role.`)
  }

  const formatDate = (isoString) => {
    if (!isoString) return 'Never'
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="users-module-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span>🔔 {toastMessage}</span>
        </div>
      )}

      {/* Header Block */}
      <div className="users-header">
        <div>
          <h2 className="users-title">👥 Master User & Access Control Hub</h2>
          <p className="users-subtitle">
            Admin console to manage recruitment team members, audit candidate logins, and toggle role-based page permissions.
          </p>
        </div>
        
        {subTab === 'recruiters' && (
          <button className="btn" onClick={() => setShowAddModal(true)}>
            ➕ Add Team Member
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="subtabs-bar">
        <button 
          className={`subtab-btn ${subTab === 'recruiters' ? 'active' : ''}`}
          onClick={() => setSubTab('recruiters')}
        >
          💼 Recruiters & Team ({recruiters.length})
        </button>
        <button 
          className={`subtab-btn ${subTab === 'candidates' ? 'active' : ''}`}
          onClick={() => setSubTab('candidates')}
        >
          🎓 Candidate Users ({allCandidates?.length || 0})
        </button>
        <button 
          className={`subtab-btn ${subTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setSubTab('permissions')}
        >
          🔒 Access Control (Pages ON/OFF)
        </button>
      </div>

      {/* Subtab Contents */}
      <div className="subtab-content-panel">
        
        {/* RECRUITERS & TEAM SUB-TAB */}
        {subTab === 'recruiters' && (
          <div className="card shadow-sm">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-soft)' }}>
                <span className="loader-spinner"></span> Loading team members from database...
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Team Member</th>
                      <th>Ref Code</th>
                      <th>Company</th>
                      <th>Role</th>
                      <th>Sourced</th>
                      <th>Account Status</th>
                      <th>Last Active</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recruiters.map(rec => {
                      const count = getSourcedCount(rec)
                      const isMaster = rec.email === 'omkesh@coolsofttech.com'
                      return (
                        <tr key={rec.id || rec._id} style={{ opacity: rec.isActive ? 1 : 0.6 }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="avatar-circle">
                                {(rec.name || 'R')[0].toUpperCase()}
                              </div>
                              <div>
                                <strong style={{ display: 'block', color: 'var(--ink)' }}>{rec.name}</strong>
                                <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{rec.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <code className="ref-code-badge">{rec.refCode}</code>
                          </td>
                          <td>{rec.company}</td>
                          <td>
                            <span className={`role-pill ${rec.role}`}>
                              {rec.role === 'superadmin' ? '👑 Super Admin' : '💼 Recruiter'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 800, color: 'var(--brand)' }}>{count}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <label className="switch">
                                <input 
                                  type="checkbox" 
                                  checked={rec.isActive} 
                                  disabled={isMaster}
                                  onChange={() => handleToggleStatus(rec.id, rec.name)} 
                                />
                                <span className="slider round"></span>
                              </label>
                              <span style={{ fontSize: 12, fontWeight: 600, color: rec.isActive ? 'var(--brand)' : 'var(--ink-soft)' }}>
                                {rec.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                            {formatDate(rec.lastLogin)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn btn-sm btn-ghost" 
                              style={{ color: 'var(--brand)', border: 'none', marginRight: 8 }}
                              onClick={() => openEditModal(rec)}
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              className="btn btn-sm btn-ghost" 
                              style={{ color: 'var(--danger)', border: 'none' }}
                              onClick={() => handleDeleteRecruiter(rec.id, rec.name)}
                              disabled={isMaster} 
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CANDIDATES SUB-TAB */}
        {subTab === 'candidates' && (
          <div className="card shadow-sm">
            <div style={{ overflowX: 'auto' }}>
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Candidate User</th>
                    <th>Applied Job</th>
                    <th>Visa / Work Auth</th>
                    <th>Status</th>
                    <th>Attributed Recruiter</th>
                    <th>Date Applied</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allCandidates && allCandidates.length > 0 ? (
                    allCandidates.map(cand => {
                      return (
                        <tr key={cand._id || cand.id}>
                          <td>
                            <div>
                              <strong style={{ display: 'block', color: 'var(--ink)' }}>{cand.name}</strong>
                              <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{cand.email}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{cand.role || 'Unspecified Position'}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: 12, fontWeight: 500, background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>
                              {cand.visaStatus || 'Not Specified'}
                            </span>
                          </td>
                          <td>
                            <span className={`pill-status status-${(cand.status || 'new').toLowerCase().replace(' ', '-')}`}>
                              {cand.status || 'New'}
                            </span>
                          </td>
                          <td>
                            {cand.recruiterRefCode ? (
                              <code className="ref-code-badge">{cand.recruiterRefCode}</code>
                            ) : cand.referredByRecruiterName ? (
                              <span style={{ fontSize: 12 }}>{cand.referredByRecruiterName}</span>
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontStyle: 'italic' }}>Direct Application</span>
                            )}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                            {formatDate(cand.createdAt)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn btn-sm btn-ghost"
                              onClick={() => setSelectedCandidate(cand)}
                            >
                              👁️ Details
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-soft)' }}>
                        No candidates have applied yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ROLE PERMISSIONS SUB-TAB */}
        {subTab === 'permissions' && (
          <div className="card shadow-sm" style={{ padding: 24 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 800 }}>🔒 Role-Based Workspace Access (Pages ON/OFF)</h4>
            <p style={{ margin: '0 0 24px', fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              Define which modules/pages are active and visible in the ATS workspace navigation. Any changes will immediately hide/show those navigation items depending on the user's role.
            </p>

            <div className="permission-grid-wrap">
              <table className="permissions-table">
                <thead>
                  <tr>
                    <th>Page / Module</th>
                    <th style={{ textAlign: 'center' }}>👑 Super Admin Access</th>
                    <th style={{ textAlign: 'center' }}>💼 Recruiter Access</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'dashboard', label: '📊 Dashboard', desc: 'Main recruitment funnel overview and quick stats.' },
                    { id: 'jobs', label: '💼 Jobs Panel', desc: 'Post new positions, scrape job descriptions, and link to LinkedIn.' },
                    { id: 'candidates', label: '👤 Candidate List', desc: 'Review, search, filter, and modify profiles.' },
                    { id: 'pipeline', label: '📈 Visual Pipeline', desc: 'Kanban board of candidates across hiring stages.' },
                    { id: 'screening', label: '🔍 AI Screening Sessions', desc: 'Manage interactive AI chats and matching assessments.' },
                    { id: 'submissions', label: '📤 Client Submissions', desc: 'Package and submit shortlisted candidate profiles.' },
                    { id: 'reports', label: '📑 Intelligence & Reports', desc: 'Generate PDF summaries and recruiter performance logs.' },
                    { id: 'automation', label: '⚙️ Automation Rules', desc: 'Configure background jobs and automation triggers.' },
                    { id: 'inbox', label: '💬 Real-time Inbox', desc: '1-on-1 candidate messaging platform.' }
                  ].map(page => {
                    return (
                      <tr key={page.id}>
                        <td>
                          <div>
                            <strong style={{ display: 'block', color: 'var(--ink)' }}>{page.label}</strong>
                            <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{page.desc}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={!!permissions['superadmin']?.[page.id]} 
                            onChange={() => handleTogglePermission('superadmin', page.id)}
                            style={{ width: 18, height: 18, accentColor: 'var(--brand)', cursor: 'pointer' }}
                            disabled={page.id === 'users' || page.id === 'settings'}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={!!permissions['recruiter']?.[page.id]} 
                            onChange={() => handleTogglePermission('recruiter', page.id)}
                            style={{ width: 18, height: 18, accentColor: 'var(--brand)', cursor: 'pointer' }}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="permissions-notice-box">
              <strong>💡 Try Testing This Out:</strong>
              <ol style={{ margin: '6px 0 0 18px', padding: 0, fontSize: 13, lineHeight: 1.5, color: '#451a03' }}>
                <li>Uncheck the <strong>📊 Dashboard</strong> or <strong>📈 Visual Pipeline</strong> checkbox in the <strong>Recruiter Access</strong> column above.</li>
                <li>In the top header, click the <strong>"💼 Switch to Recruiter View"</strong> button.</li>
                <li>You will notice that the corresponding tabs disappear from the navigation list, hiding those pages!</li>
              </ol>
            </div>
          </div>
        )}

      </div>

      {/* ADD RECRUITER MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>➕ Add New Team Member</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ink-soft)' }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddRecruiter}>
              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Rachel Green" 
                  value={newRecName}
                  onChange={e => setNewRecName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input 
                  type="email" 
                  required 
                  placeholder="rachel@company.com" 
                  value={newRecEmail}
                  onChange={e => setNewRecEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Minimum 6 characters" 
                  value={newRecPassword}
                  onChange={e => setNewRecPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Company</label>
                <input 
                  type="text" 
                  placeholder="e.g. SmartHire LLC" 
                  value={newRecCompany}
                  onChange={e => setNewRecCompany(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Referral Tracking Code (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. rachel-g (Leave blank to auto-generate)" 
                  value={newRecRef}
                  onChange={e => setNewRecRef(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>User System Role</label>
                <select value={newRecRole} onChange={e => setNewRecRole(e.target.value)}>
                  <option value="recruiter">💼 Recruiter (Subject to Page Permissions)</option>
                  <option value="superadmin">👑 Super Admin (Full Control)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  💾 Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RECRUITER MODAL */}
      {editRecruiter && (
        <div className="modal-overlay" onClick={() => setEditRecruiter(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>✏️ Edit Team Member Details</h3>
              <button 
                onClick={() => setEditRecruiter(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ink-soft)' }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleUpdateRecruiter}>
              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  required 
                  value={editRecName}
                  onChange={e => setEditRecName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input 
                  type="email" 
                  required 
                  value={editRecEmail}
                  onChange={e => setEditRecEmail(e.target.value)}
                  disabled={editRecruiter.email === 'omkesh@coolsofttech.com'} 
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Update account password" 
                  value={editRecPassword}
                  onChange={e => setEditRecPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Company</label>
                <input 
                  type="text" 
                  value={editRecCompany}
                  onChange={e => setEditRecCompany(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Referral Tracking Code</label>
                <input 
                  type="text" 
                  value={editRecRef}
                  onChange={e => setEditRecRef(e.target.value)}
                  disabled={editRecruiter.email === 'omkesh@coolsofttech.com'}
                />
              </div>

              <div className="form-group">
                <label>User System Role</label>
                <select value={editRecRole} onChange={e => setEditRecRole(e.target.value)} disabled={editRecruiter.email === 'omkesh@coolsofttech.com'}>
                  <option value="recruiter">💼 Recruiter (Subject to Page Permissions)</option>
                  <option value="superadmin">👑 Super Admin (Full Control)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditRecruiter(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  💾 Update Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANDIDATE DETAILS MODAL */}
      {selectedCandidate && (
        <div className="modal-overlay" onClick={() => setSelectedCandidate(null)}>
          <div className="modal-card" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>👤 Candidate User Profile Audit</h3>
              <button 
                onClick={() => setSelectedCandidate(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ink-soft)' }}
              >
                &times;
              </button>
            </div>

            <div className="cand-audit-grid">
              <div className="cand-audit-section">
                <strong>Personal Information</strong>
                <p><strong>Name:</strong> {selectedCandidate.name}</p>
                <p><strong>Email:</strong> {selectedCandidate.email}</p>
                <p><strong>Phone:</strong> {selectedCandidate.phone || 'Not provided'}</p>
                <p><strong>Location:</strong> {selectedCandidate.location || 'Not provided'}</p>
              </div>

              <div className="cand-audit-section">
                <strong>Application Details</strong>
                <p><strong>Position:</strong> {selectedCandidate.role || 'Unspecified'}</p>
                <p><strong>Applied Via:</strong> {selectedCandidate.recruiterRefCode ? `Recruiter (Code: ${selectedCandidate.recruiterRefCode})` : 'Direct Portal'}</p>
                <p><strong>Employment Preference:</strong> {selectedCandidate.contractType || 'W2/C2C'}</p>
                <p><strong>Visa / Work Auth:</strong> {selectedCandidate.visaStatus || 'US Citizen'}</p>
              </div>
              
              <div className="cand-audit-section" style={{ gridColumn: 'span 2' }}>
                <strong>Verification & Background Screening</strong>
                <p><strong>Hiring Status:</strong> <span className={`pill-status status-${(selectedCandidate.status || 'new').toLowerCase().replace(' ', '-')}`}>{selectedCandidate.status}</span></p>
                <p><strong>AI Trust Score:</strong> <span style={{ fontWeight: 800, color: 'var(--brand)' }}>{selectedCandidate.trustScore || 'N/A'}%</span></p>
                {selectedCandidate.experienceSummary && (
                  <p><strong>Experience Summary:</strong> {selectedCandidate.experienceSummary}</p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn" onClick={() => setSelectedCandidate(null)}>
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled block scoped for Users tab */}
      <style>{`
        .users-module-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .users-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }
        .users-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 24px;
          font-weight: 800;
          margin: 0 0 4px;
          color: var(--ink);
        }
        .users-subtitle {
          font-size: 13.5px;
          color: var(--ink-soft);
          margin: 0;
        }
        
        .subtabs-bar {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid var(--line);
          padding-bottom: 2px;
        }
        .subtab-btn {
          background: none;
          border: none;
          padding: 10px 16px;
          font-size: 13.5px;
          font-weight: 700;
          color: var(--ink-soft);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -4px;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .subtab-btn:hover {
          color: var(--ink);
        }
        .subtab-btn.active {
          color: var(--brand);
          border-bottom-color: var(--brand);
        }
        
        .subtab-content-panel {
          min-height: 350px;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13.5px;
        }
        .users-table th {
          background: var(--bg);
          padding: 14px 16px;
          font-weight: 700;
          color: var(--ink);
          border-bottom: 1px solid var(--line);
        }
        .users-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--line);
          vertical-align: middle;
        }
        .users-table tr:hover {
          background: rgba(0,0,0,0.01);
        }

        .avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e0f2fe;
          color: #0369a1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
        }

        .ref-code-badge {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 12px;
          font-family: monospace;
          color: var(--ink);
        }

        .role-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          display: inline-block;
        }
        .role-pill.superadmin {
          background: #fef3c7;
          color: #92400e;
        }
        .role-pill.recruiter {
          background: #dbeafe;
          color: #1e40af;
        }

        .pill-status {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          text-transform: capitalize;
          display: inline-block;
        }
        .pill-status.status-new { background: #e0f2fe; color: #0369a1; }
        .pill-status.status-reviewed { background: #f3e8ff; color: #6b21a8; }
        .pill-status.status-shortlisted { background: #dcfce7; color: #166534; }
        .pill-status.status-placed { background: #dcfce7; color: #166534; }
        .pill-status.status-rejected { background: #fee2e2; color: #991b1b; }

        /* Access control tables */
        .permissions-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13.5px;
          margin-bottom: 20px;
        }
        .permissions-table th {
          background: var(--bg);
          padding: 12px 16px;
          font-weight: 700;
          color: var(--ink);
          border-bottom: 2px solid var(--line);
        }
        .permissions-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--line);
        }
        
        .permissions-notice-box {
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 12px;
          padding: 16px;
          color: #78350f;
          font-size: 13.5px;
        }

        /* Toggle switch */
        .switch {
          position: relative;
          display: inline-block;
          width: 36px;
          height: 20px;
        }
        .switch input { 
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          -webkit-transition: .4s;
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          -webkit-transition: .4s;
          transition: .4s;
        }
        input:checked + .slider {
          background-color: var(--brand);
        }
        input:checked + .slider:before {
          -webkit-transform: translateX(16px);
          -ms-transform: translateX(16px);
          transform: translateX(16px);
        }
        .slider.round {
          border-radius: 34px;
        }
        .slider.round:before {
          border-radius: 50%;
        }

        /* Modal styling */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          z-index: 5000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 16px;
          width: 100%;
          max-width: 480px;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }
        .form-group label {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--ink);
        }
        .form-group input, .form-group select {
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--surface);
          color: var(--ink);
          font-family: inherit;
          font-size: 13.5px;
          outline: none;
        }
        .form-group input:focus, .form-group select:focus {
          border-color: var(--brand);
        }

        .cand-audit-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .cand-audit-section {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 14px;
          font-size: 13px;
        }
        .cand-audit-section strong {
          display: block;
          margin-bottom: 8px;
          color: var(--ink);
          border-bottom: 1px solid var(--line);
          padding-bottom: 4px;
        }
        .cand-audit-section p {
          margin: 4px 0;
          color: var(--ink-soft);
        }

        /* Loading spinner */
        .loader-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid var(--line);
          border-radius: 50%;
          border-top-color: var(--brand);
          animation: spin 0.8s linear infinite;
          margin-right: 6px;
          vertical-align: middle;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Toast message styling */
        .toast-notification {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: var(--ink);
          color: var(--surface);
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
          animation: slideUp 0.3s ease;
          z-index: 9999;
          display: flex;
          align-items: center;
        }
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
