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
    lastLogin: '2026-08-26T18:45:00.000Z',
    createdAt: '2026-01-10T10:00:00.000Z'
  },
  {
    id: 'mgr-1',
    name: 'Alok Manager',
    email: 'manager@coolsofttech.com',
    role: 'manager',
    refCode: 'alok-manager',
    company: 'SmartHire LLC',
    isActive: true,
    password: 'manager123',
    lastLogin: '2026-08-26T14:15:00.000Z',
    createdAt: '2026-01-15T09:00:00.000Z'
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
    lastLogin: '2026-08-25T11:30:00.000Z',
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
    lastLogin: '2026-08-26T09:00:00.000Z',
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
  },
  {
    id: 'emp-1',
    name: 'Rahul Sharma',
    email: 'rahul.s@coolsofttech.com',
    role: 'employee',
    parentRecruiterName: 'Vaibhav Bisen',
    company: 'SmartHire LLC',
    isActive: true,
    password: 'recruiter123',
    lastLogin: '2026-08-26T16:20:00.000Z',
    createdAt: '2026-04-01T10:00:00.000Z'
  },
  {
    id: 'emp-2',
    name: 'Priya Verma',
    email: 'priya.v@coolsofttech.com',
    role: 'employee',
    parentRecruiterName: 'Sukamal Chatterjee',
    company: 'SmartHire LLC',
    isActive: true,
    password: 'recruiter123',
    lastLogin: '2026-08-25T17:40:00.000Z',
    createdAt: '2026-04-10T12:00:00.000Z'
  }
]

export default function UsersModule({ allCandidates, permissions, setPermissions }) {
  const [subTab, setSubTab] = useState('recruiters')
  const [recruiters, setRecruiters] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_recruiters')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {}
    return DEFAULT_RECRUITERS
  })
  const [loading, setLoading] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const [expandedRecruiters, setExpandedRecruiters] = useState({})

  const [showAddModal, setShowAddModal] = useState(false)
  const [newRecName, setNewRecName] = useState('')
  const [newRecEmail, setNewRecEmail] = useState('')
  const [newRecCompany, setNewRecCompany] = useState('SmartHire LLC')
  const [newRecRef, setNewRecRef] = useState('')
  const [newRecRole, setNewRecRole] = useState('recruiter')
  const [newRecPassword, setNewRecPassword] = useState('recruiter123')
  const [newRecParent, setNewRecParent] = useState('')

  const [editRecruiter, setEditRecruiter] = useState(null)
  const [editRecName, setEditRecName] = useState('')
  const [editRecEmail, setEditRecEmail] = useState('')
  const [editRecCompany, setEditRecCompany] = useState('')
  const [editRecRef, setEditRecRef] = useState('')
  const [editRecRole, setEditRecRole] = useState('recruiter')
  const [editRecPassword, setEditRecPassword] = useState('')
  const [editRecParent, setEditRecParent] = useState('')

  const [toastMessage, setToastMessage] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  const saveRecruiters = (newList, notifyMsg = null) => {
    setRecruiters(newList)
    try {
      localStorage.setItem('smarthire_recruiters', JSON.stringify(newList))
    } catch (e) {}
    if (notifyMsg) showToast(notifyMsg)
  }

  const fetchRecruiters = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/recruiters')
      const data = await res.json()
      if (res.ok && data.success && Array.isArray(data.recruiters) && data.recruiters.length > 0) {
        const serverRecs = data.recruiters
        const local = recruiters || []
        const existingEmails = new Set(serverRecs.map(u => (u.email || '').toLowerCase().trim()))
        const localOnly = local.filter(u => !existingEmails.has((u.email || '').toLowerCase().trim()))
        const merged = [...serverRecs, ...localOnly]
        saveRecruiters(merged)
      }
    } catch (err) {
      console.warn('Recruiter backend sync notice:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecruiters()
  }, [])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  const toggleExpandRecruiter = (recId) => {
    setExpandedRecruiters(prev => ({
      ...prev,
      [recId]: !prev[recId]
    }))
  }

  const getSubordinateEmployees = (rec) => {
    if (!rec || !rec.name) return []
    const targetName = rec.name.toLowerCase().trim()
    const targetId = rec.id || rec._id
    return recruiters.filter(u => {
      if (u.role !== 'employee') return false
      const parent = (u.parentRecruiterName || '').toLowerCase().trim()
      const pId = u.parentRecruiterId || ''
      return parent === targetName || (pId && pId === targetId)
    })
  }

  const getSourcedCount = (rec) => {
    if (!allCandidates || !Array.isArray(allCandidates)) return 0
    return allCandidates.filter(c => {
      const ref = (c.recruiterRefCode || c.referredByRecruiterName || c.recruiter || '').toLowerCase()
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
    const updated = recruiters.map(r => {
      if (r.id === id || r._id === id) {
        const nextState = r.isActive === false ? true : false
        return { ...r, isActive: nextState }
      }
      return r
    })
    saveRecruiters(updated, `User "${currentName}" status changed.`)

    try {
      await fetch(`/api/admin/recruiters/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {}
  }

  const openAddModal = (presetParent = '') => {
    setNewRecName('')
    setNewRecEmail('')
    setNewRecCompany('SmartHire LLC')
    setNewRecRef('')
    setNewRecRole(presetParent ? 'employee' : 'recruiter')
    setNewRecPassword('recruiter123')
    setNewRecParent(presetParent || '')
    setShowAddModal(true)
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

    const newId = `rec-${Date.now().toString().slice(-4)}`
    const payload = {
      id: newId,
      name: newRecName.trim(),
      email: newRecEmail.trim().toLowerCase(),
      role: newRecRole,
      refCode: newRefCode,
      company: newRecCompany.trim() || 'SmartHire LLC',
      password: newRecPassword.trim(),
      parentRecruiterName: newRecRole === 'employee' ? newRecParent : '',
      isActive: true,
      createdAt: new Date().toISOString()
    }

    const updated = [payload, ...recruiters]
    saveRecruiters(updated, `🎉 User account created for "${payload.name}" (${payload.role})!`)
    setShowAddModal(false)

    try {
      fetch('/api/admin/recruiters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {})
    } catch (err) {}
  }

  const openEditModal = (rec) => {
    setEditRecruiter(rec)
    setEditRecName(rec.name || '')
    setEditRecEmail(rec.email || '')
    setEditRecCompany(rec.company || 'SmartHire LLC')
    setEditRecRef(rec.refCode || '')
    setEditRecRole(rec.role || 'recruiter')
    setEditRecPassword(rec.password || '••••••••')
    setEditRecParent(rec.parentRecruiterName || '')
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

    const updated = recruiters.map(r => {
      if (r.id === editRecruiter.id || r._id === editRecruiter.id) {
        return {
          ...r,
          name: editRecName.trim(),
          email: editRecEmail.trim().toLowerCase(),
          role: editRecRole,
          refCode: finalRefCode,
          company: editRecCompany.trim() || 'SmartHire LLC',
          password: editRecPassword.trim(),
          parentRecruiterName: editRecRole === 'employee' ? editRecParent : ''
        }
      }
      return r
    })

    saveRecruiters(updated, `✅ User "${editRecName}" updated successfully!`)
    setEditRecruiter(null)

    try {
      fetch(`/api/admin/recruiters/${editRecruiter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editRecName.trim(),
          email: editRecEmail.trim().toLowerCase(),
          role: editRecRole,
          refCode: finalRefCode,
          company: editRecCompany.trim() || 'SmartHire LLC',
          password: editRecPassword.trim(),
          parentRecruiterName: editRecRole === 'employee' ? editRecParent : ''
        })
      }).catch(() => {})
    } catch (err) {}
  }

  const handleDeleteRecruiter = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete user "${name}"?`)) {
      const updated = recruiters.filter(r => r.id !== id && r._id !== id)
      saveRecruiters(updated, `User "${name}" account deleted.`)

      try {
        fetch(`/api/admin/recruiters/${id}`, { method: 'DELETE' }).catch(() => {})
      } catch (err) {}
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
    showToast(`Permissions updated for ${role} role.`)
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

  const filteredRecruiters = recruiters.filter(rec => {
    if (roleFilter !== 'All' && rec.role !== roleFilter) return false
    if (statusFilter === 'Active' && rec.isActive === false) return false
    if (statusFilter === 'Inactive' && rec.isActive !== false) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchName = (rec.name || '').toLowerCase().includes(q)
      const matchEmail = (rec.email || '').toLowerCase().includes(q)
      const matchRef = (rec.refCode || '').toLowerCase().includes(q)
      const matchCompany = (rec.company || '').toLowerCase().includes(q)
      const matchParent = (rec.parentRecruiterName || '').toLowerCase().includes(q)
      if (!matchName && !matchEmail && !matchRef && !matchCompany && !matchParent) return false
    }

    return true
  })

  const totalUsersCount = recruiters.length
  const adminCount = recruiters.filter(r => r.role === 'superadmin' || r.role === 'admin').length
  const managerCount = recruiters.filter(r => r.role === 'manager').length
  const leadRecruiterCount = recruiters.filter(r => r.role === 'recruiter').length
  const employeeCount = recruiters.filter(r => r.role === 'employee').length

  return (
    <div className="users-module-container">
      {toastMessage && (
        <div className="toast-notification">
          <span>🔔 {toastMessage}</span>
        </div>
      )}

      <div className="users-header">
        <div>
          <h2 className="users-title">👥 Master User & Access Control Hub</h2>
          <p className="users-subtitle">
            Admin console to manage organizational hierarchy, assign managers and recruiter teams, and audit permissions.
          </p>
        </div>
        
        {subTab === 'recruiters' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={() => openAddModal('')} style={{ background: '#4f46e5', color: '#ffffff', fontWeight: 'bold' }}>
              ➕ Add Team Member
            </button>
          </div>
        )}
      </div>

      <div className="subtabs-bar">
        <button 
          className={`subtab-btn ${subTab === 'recruiters' ? 'active' : ''}`}
          onClick={() => setSubTab('recruiters')}
        >
          💼 Team & Hierarchy ({recruiters.length})
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

      <div className="subtab-content-panel">
        
        {subTab === 'recruiters' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>TOTAL TEAM USERS</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>{totalUsersCount}</div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Entire Organization</div>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1d4ed8' }}>👑 SUPER ADMINS</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#1e3a8a', marginTop: '2px' }}>{adminCount}</div>
                <div style={{ fontSize: '10.5px', color: '#60a5fa' }}>Full Platform Control</div>
              </div>

              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#b45309' }}>🛡️ MANAGERS & LEADS</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#78350f', marginTop: '2px' }}>{managerCount}</div>
                <div style={{ fontSize: '10.5px', color: '#f59e0b' }}>Candidate Review & AI</div>
              </div>

              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#c2410c' }}>💼 LEAD RECRUITERS</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#9a3412', marginTop: '2px' }}>{leadRecruiterCount}</div>
                <div style={{ fontSize: '10.5px', color: '#fb923c' }}>Managing Requisitions</div>
              </div>

              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#047857' }}>👤 SOURCING EMPLOYEES</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#065f46', marginTop: '2px' }}>{employeeCount}</div>
                <div style={{ fontSize: '10.5px', color: '#34d399' }}>Assigned Sub-Recruiters</div>
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search name, email, ref code..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '220px' }}
                  />
                  {searchQuery && (
                    <span onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 8, top: 6, cursor: 'pointer', color: '#94a3b8', fontSize: '12px' }}>✕</span>
                  )}
                </div>

                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  style={{ padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#ffffff', fontWeight: 'bold' }}
                >
                  <option value="All">All Roles ({recruiters.length})</option>
                  <option value="superadmin">👑 Super Admins ({adminCount})</option>
                  <option value="manager">🛡️ Managers & Leads ({managerCount})</option>
                  <option value="recruiter">💼 Lead Recruiters ({leadRecruiterCount})</option>
                  <option value="employee">👤 Sourcing Employees ({employeeCount})</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#ffffff' }}
                >
                  <option value="All">All Status</option>
                  <option value="Active">🟢 Active Accounts</option>
                  <option value="Inactive">🔴 Inactive Accounts</option>
                </select>
              </div>

              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                Showing <strong style={{ color: '#4f46e5' }}>{filteredRecruiters.length}</strong> of <strong>{recruiters.length}</strong> team members
              </div>
            </div>

            <div className="card shadow-sm" style={{ padding: 0, overflow: 'hidden', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-soft)' }}>
                  <span className="loader-spinner"></span> Loading team members...
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                        <th style={{ padding: '10px 14px', fontWeight: 'bold' }}>Team Member</th>
                        <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>System Role</th>
                        <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>Team Hierarchy / Reporting</th>
                        <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>Company & Ref</th>
                        <th style={{ padding: '10px 12px', fontWeight: 'bold', textAlign: 'center' }}>Sourced</th>
                        <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>Account Status</th>
                        <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>Last Active</th>
                        <th style={{ padding: '10px 14px', fontWeight: 'bold', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecruiters.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                            No team members found matching your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredRecruiters.map(rec => {
                          const count = getSourcedCount(rec)
                          const isMaster = rec.email === 'omkesh@coolsofttech.com'
                          const subordinates = getSubordinateEmployees(rec)
                          const isExpanded = Boolean(expandedRecruiters[rec.id || rec._id])

                          let roleBadgeBg = '#dbeafe'
                          let roleBadgeColor = '#1e40af'
                          let roleBadgeBorder = '#bfdbfe'
                          let roleLabel = '💼 Lead Recruiter'
                          let avatarBg = '#0284c7'

                          if (rec.role === 'superadmin' || rec.role === 'admin') {
                            roleBadgeBg = '#e0f2fe'
                            roleBadgeColor = '#0369a1'
                            roleBadgeBorder = '#bae6fd'
                            roleLabel = '👑 Super Admin'
                            avatarBg = '#0284c7'
                          } else if (rec.role === 'manager') {
                            roleBadgeBg = '#fef3c7'
                            roleBadgeColor = '#92400e'
                            roleBadgeBorder = '#fde68a'
                            roleLabel = '🛡️ Manager / Lead'
                            avatarBg = '#d97706'
                          } else if (rec.role === 'employee') {
                            roleBadgeBg = '#dcfce7'
                            roleBadgeColor = '#15803d'
                            roleBadgeBorder = '#bbf7d0'
                            roleLabel = '👤 Employee (Sourcer)'
                            avatarBg = '#10b981'
                          }

                          return (
                            <React.Fragment key={rec.id || rec._id}>
                              <tr style={{
                                opacity: rec.isActive !== false ? 1 : 0.65,
                                background: isExpanded ? '#f0fdf4' : '#ffffff',
                                borderBottom: '1px solid #e2e8f0',
                                transition: 'background-color 0.15s ease'
                              }}>
                                <td style={{ padding: '10px 14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                      width: '32px', height: '32px', borderRadius: '50%',
                                      background: avatarBg, color: '#ffffff',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontWeight: '800', fontSize: '12px'
                                    }}>
                                      {(rec.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div>
                                      <strong style={{ display: 'block', color: '#0f172a', fontSize: '13px' }}>
                                        {rec.name} {isMaster ? '(Primary Owner)' : ''}
                                      </strong>
                                      <span style={{ fontSize: '11px', color: '#64748b' }}>{rec.email}</span>
                                    </div>
                                  </div>
                                </td>

                                <td style={{ padding: '10px 12px' }}>
                                  <span style={{
                                    background: roleBadgeBg, color: roleBadgeColor,
                                    border: `1px solid ${roleBadgeBorder}`,
                                    borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold',
                                    display: 'inline-block'
                                  }}>
                                    {roleLabel}
                                  </span>
                                </td>

                                <td style={{ padding: '10px 12px' }}>
                                  {rec.role === 'employee' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ color: '#0284c7', fontWeight: 'bold', fontSize: '11.5px', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                                        ↳ Reports to: {rec.parentRecruiterName || 'Lead Recruiter'}
                                      </span>
                                    </div>
                                  ) : subordinates.length > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleExpandRecruiter(rec.id || rec._id)}
                                      style={{
                                        background: isExpanded ? '#dcfce7' : '#f1f5f9',
                                        color: isExpanded ? '#15803d' : '#1e3a8a',
                                        border: `1px solid ${isExpanded ? '#86efac' : '#cbd5e1'}`,
                                        padding: '3px 10px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                      title="Click to view employees reporting under this recruiter"
                                    >
                                      <span>👥 {subordinates.length} Subordinate{subordinates.length === 1 ? '' : 's'}</span>
                                      <span>{isExpanded ? '▲ Hide' : '▼ View Team'}</span>
                                    </button>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Independent Lead</span>
                                      {(rec.role === 'recruiter' || rec.role === 'manager' || rec.role === 'superadmin') && (
                                        <button
                                          type="button"
                                          onClick={() => openAddModal(rec.name)}
                                          style={{
                                            background: '#f8fafc', color: '#4f46e5', border: '1px dashed #a5b4fc',
                                            padding: '1px 6px', borderRadius: '3px', fontSize: '10.5px', fontWeight: 'bold', cursor: 'pointer'
                                          }}
                                          title={`Add an employee under ${rec.name}`}
                                        >
                                          + Assign Employee
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>

                                <td style={{ padding: '10px 12px' }}>
                                  <div style={{ fontSize: '11.5px', color: '#334155' }}>{rec.company || 'SmartHire LLC'}</div>
                                  <code className="ref-code-badge" style={{ fontSize: '10px' }}>{rec.refCode}</code>
                                </td>

                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                  <span style={{ fontWeight: '800', color: '#4f46e5', fontSize: '13px' }}>{count}</span>
                                </td>

                                <td style={{ padding: '10px 12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <label className="switch">
                                      <input 
                                        type="checkbox" 
                                        checked={rec.isActive !== false} 
                                        disabled={isMaster}
                                        onChange={() => handleToggleStatus(rec.id || rec._id, rec.name)} 
                                      />
                                      <span className="slider round"></span>
                                    </label>
                                    <span style={{ fontSize: '11.5px', fontWeight: '600', color: rec.isActive !== false ? '#16a34a' : '#94a3b8' }}>
                                      {rec.isActive !== false ? '🟢 Active' : '🔴 Inactive'}
                                    </span>
                                  </div>
                                </td>

                                <td style={{ padding: '10px 12px', fontSize: '11px', color: '#64748b' }}>
                                  {formatDate(rec.lastLogin)}
                                </td>

                                <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                    {(rec.role === 'recruiter' || rec.role === 'manager') && (
                                      <button 
                                        className="btn btn-sm btn-ghost" 
                                        style={{ color: '#0284c7', border: '1px solid #bfdbfe', padding: '2px 6px', fontSize: '11px', borderRadius: '3px' }}
                                        onClick={() => openAddModal(rec.name)}
                                        title={`Add new employee under ${rec.name}`}
                                      >
                                        ➕ Sub-User
                                      </button>
                                    )}
                                    <button 
                                      className="btn btn-sm btn-ghost" 
                                      style={{ color: '#4f46e5', border: '1px solid #c7d2fe', padding: '2px 6px', fontSize: '11px', borderRadius: '3px' }}
                                      onClick={() => openEditModal(rec)}
                                    >
                                      ✏️ Edit
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-ghost" 
                                      style={{ color: '#dc2626', border: '1px solid #fecaca', padding: '2px 6px', fontSize: '11px', borderRadius: '3px' }}
                                      onClick={() => handleDeleteRecruiter(rec.id || rec._id, rec.name)}
                                      disabled={isMaster} 
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr style={{ background: '#f8fafc' }}>
                                  <td colSpan="8" style={{ padding: '14px 20px', borderBottom: '2px solid #cbd5e1' }}>
                                    <div style={{ background: '#ffffff', border: '1px solid #86efac', borderRadius: '6px', padding: '14px 16px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                                      
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span style={{ fontSize: '16px' }}>👥</span>
                                          <strong style={{ color: '#166534', fontSize: '13px' }}>
                                            Direct Reporting Sub-Team for {rec.name} ({subordinates.length} Employee{subordinates.length === 1 ? '' : 's'})
                                          </strong>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => openAddModal(rec.name)}
                                          style={{
                                            background: '#16a34a', color: '#ffffff', border: 'none',
                                            padding: '4px 12px', fontSize: '11px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer'
                                          }}
                                        >
                                          ➕ Add Employee under {rec.name}
                                        </button>
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {subordinates.map((subEmp, index) => {
                                          const subSourced = getSourcedCount(subEmp)
                                          return (
                                            <div
                                              key={subEmp.id || subEmp._id || index}
                                              style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '8px 12px', fontSize: '12px'
                                              }}
                                            >
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontWeight: 'bold', color: '#15803d', width: '20px', fontSize: '13px' }}>
                                                  {index + 1}.
                                                </span>
                                                <div>
                                                  <strong style={{ color: '#0f172a', fontSize: '12.5px' }}>{subEmp.name}</strong>
                                                  <span style={{ color: '#64748b', fontSize: '11px', marginLeft: '6px' }}>({subEmp.email})</span>
                                                </div>
                                                <span style={{ background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: '3px', fontSize: '10.5px', fontWeight: 'bold' }}>
                                                  👤 Sourcing Specialist
                                                </span>
                                                <span style={{ color: subEmp.isActive !== false ? '#16a34a' : '#dc2626', fontSize: '11px', fontWeight: 'bold' }}>
                                                  {subEmp.isActive !== false ? '🟢 Active' : '🔴 Inactive'}
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#475569' }}>
                                                  Sourced: <strong style={{ color: '#15803d' }}>{subSourced} Candidates</strong>
                                                </span>
                                              </div>

                                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '10.5px', color: '#94a3b8', marginRight: '6px' }}>
                                                  Last login: {formatDate(subEmp.lastLogin)}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => openEditModal(subEmp)}
                                                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 8px', fontSize: '11px', borderRadius: '3px', cursor: 'pointer', color: '#1e3a8a', fontWeight: 'bold' }}
                                                >
                                                  ✏️ Edit
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleDeleteRecruiter(subEmp.id || subEmp._id, subEmp.name)}
                                                  style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '2px 6px', fontSize: '11px', borderRadius: '3px', cursor: 'pointer', color: '#b91c1c' }}
                                                >
                                                  🗑️ Remove
                                                </button>
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>

                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {subTab === 'candidates' && (
          <div className="card shadow-sm" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="users-table">
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569' }}>
                    <th style={{ padding: '10px 14px' }}>Candidate Name</th>
                    <th style={{ padding: '10px 12px' }}>Role / Skill</th>
                    <th style={{ padding: '10px 12px' }}>Email Address</th>
                    <th style={{ padding: '10px 12px' }}>Sourced By</th>
                    <th style={{ padding: '10px 12px' }}>Screening Trust</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allCandidates && allCandidates.length > 0 ? (
                    allCandidates.map(cand => (
                      <tr key={cand.id || cand._id}>
                        <td style={{ padding: '10px 14px' }}>
                          <strong style={{ color: '#0f172a' }}>{cand.name}</strong>
                        </td>
                        <td style={{ padding: '10px 12px' }}>{cand.role || 'Software Consultant'}</td>
                        <td style={{ padding: '10px 12px', color: '#0284c7' }}>{cand.email}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ background: '#eff6ff', color: '#1e40af', padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold' }}>
                            {cand.referredByRecruiterName || cand.recruiter || 'Direct'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <strong style={{ color: '#16a34a' }}>{cand.trustScore || '88'}%</strong>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span className={`pill-status status-${(cand.status || 'new').toLowerCase().replace(' ', '-')}`}>
                            {cand.status || 'Screened'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <button 
                            className="btn btn-sm btn-ghost"
                            onClick={() => setSelectedCandidate(cand)}
                            style={{ color: '#4f46e5', border: '1px solid #c7d2fe', padding: '2px 8px', fontSize: '11px' }}
                          >
                            👁️ Details
                          </button>
                        </td>
                      </tr>
                    ))
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

        {subTab === 'permissions' && (
          <div className="card shadow-sm" style={{ padding: 24 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 800 }}>🔒 Role-Based Workspace Access (Pages ON/OFF)</h4>
            <div className="permission-grid-wrap">
              <table className="permissions-table">
                <thead>
                  <tr>
                    <th>Page / Module</th>
                    <th style={{ textAlign: 'center' }}>👑 Super Admin Access</th>
                    <th style={{ textAlign: 'center' }}>🛡️ Manager Access</th>
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
                            checked={permissions['manager']?.[page.id] !== false} 
                            onChange={() => handleTogglePermission('manager', page.id)}
                            style={{ width: 18, height: 18, accentColor: '#d97706', cursor: 'pointer' }}
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
          </div>
        )}

      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
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
                  placeholder="e.g. Alok Sharma" 
                  value={newRecName}
                  onChange={e => setNewRecName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input 
                  type="email" 
                  required 
                  placeholder="alok@coolsofttech.com" 
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
                  placeholder="e.g. alok-s (Leave blank to auto-generate)" 
                  value={newRecRef}
                  onChange={e => setNewRecRef(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 'bold', color: '#1e3a8a' }}>User System Role *</label>
                <select value={newRecRole} onChange={e => setNewRecRole(e.target.value)} style={{ fontWeight: 'bold' }}>
                  <option value="superadmin">👑 Super Admin (Full Control)</option>
                  <option value="manager">🛡️ Manager / Account Lead (Candidate & AI Reviewer)</option>
                  <option value="recruiter">💼 Lead Recruiter (Client Submissions & Sourcing)</option>
                  <option value="employee">👤 Employee / Sub-Recruiter (Reporting to Recruiter)</option>
                </select>
              </div>

              {newRecRole === 'employee' && (
                <div className="form-group" style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', padding: '10px 12px' }}>
                  <label style={{ fontWeight: 'bold', color: '#166534' }}>Reporting Lead Recruiter / Manager *</label>
                  <select 
                    value={newRecParent} 
                    onChange={e => setNewRecParent(e.target.value)}
                    style={{ background: '#ffffff', fontWeight: 'bold', marginTop: '4px' }}
                    required
                  >
                    <option value="">-- Select Reporting Lead Recruiter --</option>
                    {recruiters
                      .filter(r => r.role === 'recruiter' || r.role === 'manager' || r.role === 'superadmin')
                      .map(r => (
                        <option key={r.id || r._id} value={r.name}>
                          {r.name} ({r.role}) — {r.email}
                        </option>
                      ))}
                  </select>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                    Requisitions assigned to this employee will automatically be accessible to this reporting recruiter.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn" style={{ background: '#4f46e5', color: '#ffffff' }}>
                  💾 Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editRecruiter && (
        <div className="modal-overlay" onClick={() => setEditRecruiter(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
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
                  type="text" 
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
                <label style={{ fontWeight: 'bold', color: '#1e3a8a' }}>User System Role *</label>
                <select 
                  value={editRecRole} 
                  onChange={e => setEditRecRole(e.target.value)} 
                  disabled={editRecruiter.email === 'omkesh@coolsofttech.com'}
                  style={{ fontWeight: 'bold' }}
                >
                  <option value="superadmin">👑 Super Admin (Full Control)</option>
                  <option value="manager">🛡️ Manager / Account Lead (Candidate & AI Reviewer)</option>
                  <option value="recruiter">💼 Lead Recruiter (Client Submissions & Sourcing)</option>
                  <option value="employee">👤 Employee / Sub-Recruiter (Reporting to Recruiter)</option>
                </select>
              </div>

              {editRecRole === 'employee' && (
                <div className="form-group" style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', padding: '10px 12px' }}>
                  <label style={{ fontWeight: 'bold', color: '#166534' }}>Reporting Lead Recruiter / Manager *</label>
                  <select 
                    value={editRecParent} 
                    onChange={e => setEditRecParent(e.target.value)}
                    style={{ background: '#ffffff', fontWeight: 'bold', marginTop: '4px' }}
                  >
                    <option value="">-- Select Reporting Lead Recruiter --</option>
                    {recruiters
                      .filter(r => (r.role === 'recruiter' || r.role === 'manager' || r.role === 'superadmin') && r.id !== editRecruiter.id)
                      .map(r => (
                        <option key={r.id || r._id} value={r.name}>
                          {r.name} ({r.role}) — {r.email}
                        </option>
                      ))}
                  </select>
                </div>
              )}

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
