import React, { useState, useEffect } from 'react'
import AuditActivityLogModule from './AuditActivityLogModule'
import { saveTeamUsersFirestore, getTeamUsersFirestore } from '../lib/atsFirestore'

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
    lastLogin: '2026-08-27T18:45:00.000Z',
    createdAt: '2026-01-10T10:00:00.000Z'
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
    // Sync to Firestore
    saveTeamUsersFirestore(newList).catch(() => {})
    if (notifyMsg) showToast(notifyMsg)
  }

  const fetchRecruiters = async () => {
    setLoading(true)
    try {
      // 1. Fetch from Firestore
      const firestoreUsers = await getTeamUsersFirestore()
      if (Array.isArray(firestoreUsers) && firestoreUsers.length > 0) {
        setRecruiters(prev => {
          const map = new Map()
          prev.forEach(u => { if (u && (u.email || u.id)) map.set((u.email || u.id).toLowerCase(), u) })
          firestoreUsers.forEach(u => {
            if (u && (u.email || u.id)) {
              const existing = map.get((u.email || u.id).toLowerCase()) || {}
              map.set((u.email || u.id).toLowerCase(), { ...existing, ...u })
            }
          })
          const merged = Array.from(map.values())
          try { localStorage.setItem('smarthire_recruiters', JSON.stringify(merged)) } catch (e) {}
          return merged
        })
      }

      // 2. Fetch from Backend Server
      const res = await fetch('/api/admin/recruiters')
      const data = await res.json()
      if (res.ok && data.success && Array.isArray(data.recruiters)) {
        if (data.recruiters.length > 0) {
          saveRecruiters(data.recruiters)
        }
      }
    } catch (err) {
      console.warn('Recruiter sync notice:', err)
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
    const targetName = (rec.name || '').toLowerCase().trim()
    const targetEmail = (rec.email || '').toLowerCase().trim()
    const targetId = String(rec.id || rec._id || '').toLowerCase().trim()
    return recruiters.filter(u => {
      if (u.role !== 'employee') return false
      const parent = (u.parentRecruiterName || '').toLowerCase().trim()
      const pId = String(u.parentRecruiterId || '').toLowerCase().trim()
      const pEmail = (u.parentRecruiterEmail || '').toLowerCase().trim()
      return (parent && (parent === targetName || parent.includes(targetName) || targetName.includes(parent))) ||
             (pId && pId === targetId) ||
             (pEmail && pEmail === targetEmail)
    })
  }

  const getSourcedCount = (rec) => {
    if (!rec || !allCandidates || !Array.isArray(allCandidates)) return 0
    const recRef = (rec.refCode || '').toLowerCase().trim()
    const recName = (rec.name || '').toLowerCase().trim()
    const recEmail = (rec.email || '').toLowerCase().trim()
    const recId = String(rec.id || rec._id || '').toLowerCase().trim()

    // If rec is a Lead Recruiter, get their subordinates to calculate total team count
    const subordinates = rec.role === 'recruiter' ? getSubordinateEmployees(rec) : []
    const subNames = subordinates.map(s => (s.name || '').toLowerCase().trim()).filter(Boolean)
    const subEmails = subordinates.map(s => (s.email || '').toLowerCase().trim()).filter(Boolean)
    const subRefs = subordinates.map(s => (s.refCode || '').toLowerCase().trim()).filter(Boolean)

    return allCandidates.filter(c => {
      if (!c) return false
      const candRecruiter = (c.recruiter || c.assignedTo || c.assignedBy || c.addedByName || c.submittedBy || c.referredByRecruiterName || '').toLowerCase().trim()
      const candEmail = (c.recruiterEmail || '').toLowerCase().trim()
      const candRef = (c.recruiterRefCode || c.recruiterRef || '').toLowerCase().trim()
      const candCreator = String(c.createdBy || '').toLowerCase().trim()
      const candParent = (c.parentRecruiterName || '').toLowerCase().trim()

      const isDirectMatch = (recRef && (candRef === recRef || candRef.includes(recRef))) ||
                            (recName && (candRecruiter === recName || candRecruiter.includes(recName) || recName.includes(candRecruiter))) ||
                            (recEmail && (candEmail === recEmail || candRecruiter.includes(recEmail))) ||
                            (recId && candCreator === recId) ||
                            (rec.id && c.referredByRecruiter === rec.id)

      if (isDirectMatch) return true

      // If lead recruiter, also include candidates sourced by their subordinate employees
      if (rec.role === 'recruiter') {
        if (candParent && (candParent === recName || candParent.includes(recName))) return true
        const isSubSourced = subNames.some(sn => sn && (candRecruiter === sn || candRecruiter.includes(sn) || sn.includes(candRecruiter))) ||
                             subEmails.some(se => se && (candEmail === se || candRecruiter.includes(se))) ||
                             subRefs.some(sr => sr && (candRef === sr || candRef.includes(sr)))
        if (isSubSourced) return true
      }

      return false
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
    setNewRecCompany('SmartHire')
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
      company: newRecCompany.trim() || 'SmartHire',
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
    setEditRecCompany(rec.company || 'SmartHire')
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
          company: editRecCompany.trim() || 'SmartHire',
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
          company: editRecCompany.trim() || 'SmartHire',
          password: editRecPassword.trim(),
          parentRecruiterName: editRecRole === 'employee' ? editRecParent : ''
        })
      }).catch(() => {})
    } catch (err) {}
  }

  const handleDeleteRecruiter = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete user "${name}"?`)) {
      const targetName = (name || '').toLowerCase().trim()
      const targetId = String(id || '')
      const updated = recruiters.filter(r => {
        const thisId = String(r.id || r._id || '')
        const thisName = (r.name || '').toLowerCase().trim()
        return thisId !== targetId && thisName !== targetName
      })
      saveRecruiters(updated, `User "${name}" account deleted.`)
      window.dispatchEvent(new CustomEvent('smarthire_recruiters_updated', { detail: updated }))

      try {
        await fetch(`/api/admin/recruiters/${encodeURIComponent(targetId || targetName)}`, { method: 'DELETE' })
        await fetch('/api/admin/recruiters/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recruiters: updated })
        })
      } catch (err) {
        console.warn('Backend delete sync note:', err)
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
    window.dispatchEvent(new CustomEvent('smarthire_permissions_updated', { detail: updated }))
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
          className={`subtab-btn ${subTab === 'audit' ? 'active' : ''}`}
          onClick={() => setSubTab('audit')}
        >
          📜 Audit & Activity Log
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
                <div style={{ overflowX: 'auto', border: '1px solid #7f9db9', borderRadius: 0 }}>
                  <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'Arial, Helvetica, sans-serif', textAlign: 'left', background: '#ffffff' }}>
                    <thead>
                      <tr style={{ background: '#708090', color: '#ffffff', borderBottom: '1px solid #4a5568' }}>
                        <th style={{ padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>TEAM MEMBER</th>
                        <th style={{ padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>SYSTEM ROLE</th>
                        <th style={{ padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>TEAM HIERARCHY / REPORTING</th>
                        <th style={{ padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>COMPANY & REF</th>
                        <th style={{ padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>SOURCED</th>
                        <th style={{ padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>ACCOUNT STATUS</th>
                        <th style={{ padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>LAST ACTIVE</th>
                        <th style={{ padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', textAlign: 'center', width: '140px' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecruiters.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
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

                          if (rec.role === 'superadmin' || rec.role === 'admin') {
                            roleBadgeBg = '#e0f2fe'
                            roleBadgeColor = '#0369a1'
                            roleBadgeBorder = '#bae6fd'
                            roleLabel = '👑 Super Admin'
                          } else if (rec.role === 'manager') {
                            roleBadgeBg = '#fef3c7'
                            roleBadgeColor = '#92400e'
                            roleBadgeBorder = '#fde68a'
                            roleLabel = '🛡️ Manager / Lead'
                          } else if (rec.role === 'employee') {
                            roleBadgeBg = '#dcfce7'
                            roleBadgeColor = '#15803d'
                            roleBadgeBorder = '#bbf7d0'
                            roleLabel = '👤 Employee (Sourcer)'
                          }

                          return (
                            <React.Fragment key={rec.id || rec._id}>
                              <tr style={{
                                opacity: rec.isActive !== false ? 1 : 0.65,
                                background: isExpanded ? '#eff6ff' : '#ffffff',
                                borderBottom: '1px solid #e2e8f0',
                                transition: 'background-color 0.15s ease'
                              }}>
                                {/* Team Member without Circle Avatar */}
                                <td style={{ padding: '6px 10px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#0033cc', fontSize: '11.5px' }}>
                                      {rec.name} {isMaster ? '(Primary Owner)' : ''}
                                    </span>
                                    <span style={{ fontSize: '10px', color: '#475569', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                      {rec.email}
                                    </span>
                                  </div>
                                </td>

                                {/* System Role */}
                                <td style={{ padding: '6px 10px' }}>
                                  <span style={{
                                    background: roleBadgeBg, color: roleBadgeColor,
                                    border: `1px solid ${roleBadgeBorder}`,
                                    borderRadius: '2px', padding: '2px 7px', fontSize: '10.5px', fontWeight: 'bold',
                                    display: 'inline-block'
                                  }}>
                                    {roleLabel}
                                  </span>
                                </td>

                                {/* Team Hierarchy / Reporting */}
                                <td style={{ padding: '6px 10px' }}>
                                  {rec.role === 'employee' ? (
                                    <span style={{ color: '#0284c7', fontWeight: 'bold', fontSize: '10.5px', background: '#eff6ff', padding: '2px 7px', borderRadius: '2px', border: '1px solid #bfdbfe', display: 'inline-block' }}>
                                      ↳ Reports to: {rec.parentRecruiterName || 'Lead Recruiter'}
                                    </span>
                                  ) : subordinates.length > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleExpandRecruiter(rec.id || rec._id)}
                                      style={{
                                        background: isExpanded ? '#dcfce7' : '#f1f5f9',
                                        color: isExpanded ? '#15803d' : '#1e3a8a',
                                        border: `1px solid ${isExpanded ? '#86efac' : '#cbd5e1'}`,
                                        padding: '2px 8px',
                                        borderRadius: '2px',
                                        fontSize: '10.5px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                      title="Click to view employees reporting under this recruiter"
                                    >
                                      <span>👥 {subordinates.length} Subordinate{subordinates.length === 1 ? '' : 's'}</span>
                                      <span>{isExpanded ? '▲ Hide' : '▼ View'}</span>
                                    </button>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: '10.5px', color: '#64748b' }}>Independent Lead</span>
                                      {(rec.role === 'recruiter' || rec.role === 'manager' || rec.role === 'superadmin') && (
                                        <button
                                          type="button"
                                          onClick={() => openAddModal(rec.name)}
                                          style={{
                                            background: '#eff6ff', color: '#0033cc', border: '1px solid #bfdbfe',
                                            padding: '1px 6px', borderRadius: '2px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer'
                                          }}
                                          title={`Add an employee under ${rec.name}`}
                                        >
                                          + Assign Employee
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Company & Ref */}
                                <td style={{ padding: '6px 10px' }}>
                                  <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: 'bold' }}>{rec.company || 'SmartHire'}</div>
                                  {rec.refCode && (
                                    <span style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '2px', padding: '0 4px', fontSize: '9.5px', color: '#475569', fontFamily: 'monospace' }}>
                                      {rec.refCode}
                                    </span>
                                  )}
                                </td>

                                {/* Sourced */}
                                <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                  <span style={{ fontWeight: 'bold', color: count > 0 ? '#0033cc' : '#64748b', fontSize: '11.5px' }}>{count}</span>
                                </td>

                                {/* Account Status */}
                                <td style={{ padding: '6px 10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <label style={{ position: 'relative', display: 'inline-block', width: '28px', height: '16px', margin: 0, cursor: isMaster ? 'not-allowed' : 'pointer' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={rec.isActive !== false} 
                                        disabled={isMaster}
                                        onChange={() => handleToggleStatus(rec.id || rec._id, rec.name)} 
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                      />
                                      <span style={{
                                        position: 'absolute', cursor: isMaster ? 'not-allowed' : 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundColor: rec.isActive !== false ? '#4f46e5' : '#cbd5e1',
                                        transition: '.2s', borderRadius: '16px'
                                      }}>
                                        <span style={{
                                          position: 'absolute', content: '""', height: '12px', width: '12px', left: rec.isActive !== false ? '14px' : '2px', bottom: '2px',
                                          backgroundColor: 'white', transition: '.2s', borderRadius: '50%'
                                        }}></span>
                                      </span>
                                    </label>
                                    <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: rec.isActive !== false ? '#16a34a' : '#dc2626' }}>
                                      {rec.isActive !== false ? '🟢 Active' : '🔴 Inactive'}
                                    </span>
                                  </div>
                                </td>

                                {/* Last Active */}
                                <td style={{ padding: '6px 10px', fontSize: '10.5px', color: '#475569' }}>
                                  {formatDate(rec.lastLogin)}
                                </td>

                                {/* Action Buttons */}
                                <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                                    {(rec.role === 'recruiter' || rec.role === 'manager') && (
                                      <button 
                                        type="button"
                                        style={{ background: '#eff6ff', color: '#0284c7', border: '1px solid #bfdbfe', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' }}
                                        onClick={() => openAddModal(rec.name)}
                                        title={`Add new employee under ${rec.name}`}
                                      >
                                        + Sub-User
                                      </button>
                                    )}
                                    <button 
                                      type="button"
                                      style={{ background: '#f1f5f9', color: '#0033cc', border: '1px solid #cbd5e1', padding: '2px 7px', fontSize: '10.5px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' }}
                                      onClick={() => openEditModal(rec)}
                                    >
                                      Edit
                                    </button>
                                    {!isMaster && (
                                      <button 
                                        type="button"
                                        style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '2px 7px', fontSize: '10.5px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' }}
                                        onClick={() => handleDeleteRecruiter(rec.id || rec._id, rec.name)}
                                        title="Permanently delete user"
                                      >
                                        🗑️ Delete
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr style={{ background: '#f8fafc' }}>
                                  <td colSpan="8" style={{ padding: '10px 14px', borderBottom: '1px solid #cbd5e1' }}>
                                    <div style={{ background: '#ffffff', border: '1px solid #86efac', borderRadius: '4px', padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                                      
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span style={{ fontSize: '14px' }}>👥</span>
                                          <strong style={{ color: '#166534', fontSize: '11.5px' }}>
                                            Direct Reporting Sub-Team for {rec.name} ({subordinates.length} Employee{subordinates.length === 1 ? '' : 's'})
                                          </strong>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => openAddModal(rec.name)}
                                          style={{
                                            background: '#16a34a', color: '#ffffff', border: 'none',
                                            padding: '2px 10px', fontSize: '10.5px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer'
                                          }}
                                        >
                                          + Add Employee under {rec.name}
                                        </button>
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {subordinates.map((subEmp, index) => {
                                          const subSourced = getSourcedCount(subEmp)
                                          return (
                                            <div
                                              key={subEmp.id || subEmp._id || index}
                                              style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '2px', padding: '6px 10px', fontSize: '11px'
                                              }}
                                            >
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontWeight: 'bold', color: '#15803d', width: '16px', fontSize: '11px' }}>
                                                  {index + 1}.
                                                </span>
                                                <div>
                                                  <strong style={{ color: '#0033cc', fontSize: '11.5px' }}>{subEmp.name}</strong>
                                                  <span style={{ color: '#475569', fontSize: '10px', fontFamily: 'monospace', marginLeft: '6px' }}>({subEmp.email})</span>
                                                </div>
                                                <span style={{ background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: '2px', fontSize: '10px', fontWeight: 'bold' }}>
                                                  👤 Sourcing Employee
                                                </span>
                                                <span style={{ color: subEmp.isActive !== false ? '#16a34a' : '#dc2626', fontSize: '10.5px', fontWeight: 'bold' }}>
                                                  {subEmp.isActive !== false ? '🟢 Active' : '🔴 Inactive'}
                                                </span>
                                                <span style={{ fontSize: '10.5px', color: '#475569' }}>
                                                  Sourced: <strong style={{ color: '#15803d' }}>{subSourced} Candidates</strong>
                                                </span>
                                              </div>

                                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '10px', color: '#64748b', marginRight: '6px' }}>
                                                  Last login: {formatDate(subEmp.lastLogin)}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => openEditModal(subEmp)}
                                                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '1px 6px', fontSize: '10.5px', borderRadius: '2px', cursor: 'pointer', color: '#0033cc', fontWeight: 'bold' }}
                                                >
                                                  Edit
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleDeleteRecruiter(subEmp.id || subEmp._id, subEmp.name)}
                                                  style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '1px 6px', fontSize: '10.5px', borderRadius: '2px', cursor: 'pointer', color: '#dc2626', fontWeight: 'bold' }}
                                                >
                                                  🗑️
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
            <div style={{ overflowX: 'auto', border: '1px solid #7f9db9', borderRadius: 0 }}>
              <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'Arial, Helvetica, sans-serif', textAlign: 'left', background: '#ffffff' }}>
                <thead>
                  <tr style={{ background: '#708090', color: '#ffffff', borderBottom: '1px solid #4a5568' }}>
                    <th style={{ padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>CANDIDATE NAME</th>
                    <th style={{ padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>ROLE / SKILL</th>
                    <th style={{ padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>EMAIL ADDRESS</th>
                    <th style={{ padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>SOURCED BY</th>
                    <th style={{ padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>SCREENING TRUST</th>
                    <th style={{ padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>STATUS</th>
                    <th style={{ padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', textAlign: 'center', width: '100px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {allCandidates && allCandidates.length > 0 ? (
                    allCandidates.map(cand => (
                      <tr key={cand.id || cand._id} style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                        <td style={{ padding: '6px 10px' }}>
                          <strong style={{ color: '#0033cc', fontSize: '11.5px' }}>{cand.name}</strong>
                        </td>
                        <td style={{ padding: '6px 10px', color: '#0f172a' }}>{cand.role || 'Software Consultant'}</td>
                        <td style={{ padding: '6px 10px', color: '#475569', fontFamily: 'monospace' }}>{cand.email}</td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ background: '#eff6ff', color: '#1e40af', padding: '2px 6px', borderRadius: '2px', fontSize: '10.5px', fontWeight: 'bold', border: '1px solid #bfdbfe' }}>
                            {cand.referredByRecruiterName || cand.recruiter || 'Direct'}
                          </span>
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                          <strong style={{ color: '#16a34a', fontSize: '11.5px' }}>{cand.trustScore || '88'}%</strong>
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <span className={`pill-status status-${(cand.status || 'new').toLowerCase().replace(' ', '-')}`} style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '2px' }}>
                            {cand.status || 'Screened'}
                          </span>
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                          <button 
                            type="button"
                            onClick={() => setSelectedCandidate(cand)}
                            style={{ background: '#f1f5f9', color: '#0033cc', border: '1px solid #cbd5e1', padding: '2px 8px', fontSize: '10.5px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' }}
                          >
                            Details
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

        {/* AUDIT & ACTIVITY LOG SUB-TAB */}
        {subTab === 'audit' && (
          <div className="card shadow-sm" style={{ padding: 20 }}>
            <AuditActivityLogModule />
          </div>
        )}

        {/* ROLE PERMISSIONS SUB-TAB */}
        {subTab === 'permissions' && (
          <div className="card shadow-sm" style={{ padding: 24 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 800 }}>🔒 Role-Based Workspace Access (Pages ON/OFF)</h4>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--ink-soft)' }}>
              Configure which workspaces, portals, and ATS modules are accessible to Managers and Recruiters. Any change takes effect in real-time.
            </p>
            <div className="permission-grid-wrap">
              <table className="permissions-table">
                <thead>
                  <tr>
                    <th>Page / Module / Workspace</th>
                    <th style={{ textAlign: 'center' }}>👑 Super Admin Access</th>
                    <th style={{ textAlign: 'center' }}>🛡️ Manager Access</th>
                    <th style={{ textAlign: 'center' }}>💼 Recruiter Access</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'ats', label: '💼 ATS Workspace Platform (/ats)', desc: 'Core ATS Talent portal with candidate database, screening, and jobs.' },
                    { id: 'dashboard', label: '📊 Executive Dashboard (/dashboard)', desc: 'Requisition allocation, candidate submissions, and VMS metrics.' },
                    { id: 'reports', label: '📑 Intelligence & Reports (/reports)', desc: 'Recruitment analytics, conversion charts, and export tools.' },
                    { id: 'audit', label: '📜 Audit & Activity Log (/ats?tab=audit)', desc: 'Chronological timeline of candidate status changes & reviews.' },
                    { id: 'linkedin', label: '🌐 LinkedIn Automation (/linkedin-posts)', desc: 'Auto-post vacancies and social outreach studio.' },
                    { id: 'branding', label: '🎨 AI Branding Studio (/branding)', desc: 'Marketing flyers, promotional banners, and social creatives.' },
                    { id: 'jobs', label: '💼 Jobs Hub (ATS Module)', desc: 'Post new positions, scrape JDs, and link openings.' },
                    { id: 'candidates', label: '👤 Candidate List (ATS Module)', desc: 'Review, search, filter, and modify candidate talent profiles.' },
                    { id: 'pipeline', label: '📈 Visual Pipeline (ATS Module)', desc: 'Kanban board of candidates across hiring stages.' },
                    { id: 'screening', label: '🔍 AI Screening Sessions (ATS Module)', desc: 'Manage interactive AI candidate pre-screening and chat evaluations.' },
                    { id: 'submissions', label: '📤 Client Submissions & RTR (ATS Module)', desc: 'Package and submit shortlisted candidate profiles to clients.' },
                    { id: 'automation', label: '⚙️ Automation Rules (ATS Module)', desc: 'Configure background jobs, webhooks, and automation triggers.' },
                    { id: 'inbox', label: '💬 Real-time Inbox (ATS Module)', desc: '1-on-1 direct candidate messaging platform.' }
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
                  placeholder="e.g. SmartHire" 
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
