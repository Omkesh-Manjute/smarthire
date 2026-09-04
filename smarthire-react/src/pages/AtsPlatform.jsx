import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import CandidateMessengerWidget from '../components/CandidateMessengerWidget'
import ActivityNotificationBell, { pushActivityNotification } from '../components/ActivityNotificationBell'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardModule,
  CandidatesModule,
  PipelineModule,
  SubmissionModule,
  ReportsModule,
  AutomationModule,
  SettingsModule,
  ScreeningModule,
  UsersModule,
  AuditActivityLogModule,
} from '../ats'
import { formatJobDescription, cleanJobTitleWithPositionNumber } from '../utils/formatJobDescription'
import { getAllCandidates, deduplicateCandidates } from '../lib/atsFirestore'

const API_BASE = ''

const STATUSES = [
  'New', 'Reviewed', 'Shortlisted', 'RTR Requested', 'RTR Received',
  'Interview Scheduled', 'Selected', 'Rejected', 'Placed',
]

const formatTitleCase = (str) => {
  if (!str) return ''
  return String(str)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const ALL_MODULES = [
  { id: 'home',        label: 'Home',            icon: '🏠', category: 'main' },
  { id: 'candidates',  label: 'Candidates',      icon: '👤', category: 'talent', countKey: 'candidates' },
  { id: 'pipeline',    label: 'Pipeline',        icon: '📈', category: 'talent', adminOnly: true },
  { id: 'screening',   label: 'AI Screening',    icon: '🤖', category: 'talent' },
  { id: 'submissions', label: 'Submissions',     icon: '📤', category: 'talent', adminOnly: true },
  { id: 'reports',     label: 'Reports',         icon: '📑', category: 'main', adminOnly: true },
  { id: 'analytics',   label: 'Analytics',       icon: '📊', category: 'main' },
  { id: 'audit',       label: 'Audit Logs',      icon: '📜', category: 'admin' },
  { id: 'automation',  label: 'Automation',      icon: '⚙️', category: 'admin', adminOnly: true },
  { id: 'inbox',       label: 'Recruiter Inbox', icon: '💬', category: 'admin', isLink: '/inbox' },
  { id: 'settings',    label: 'Settings',        icon: '🛠️', category: 'admin', adminOnly: true },
  { id: 'users',       label: 'Manage Users',    icon: '👥', category: 'admin', adminOnly: true },
]

export default function AtsPlatform() {
  const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user')
  let currentUser = null
  try {
    if (userStr) currentUser = JSON.parse(userStr)
  } catch (e) {}

  const defaultRole = (currentUser && currentUser.role) ? currentUser.role : 'recruiter'
  const realUserRole = currentUser?.role || 'recruiter'
  const isEmployee = realUserRole === 'employee'
  const isManager = realUserRole === 'manager'
  const isSuperAdmin = (realUserRole === 'superadmin' || realUserRole === 'admin') && !isEmployee && !isManager
  const canSwitchRoles = isSuperAdmin
  const activeRole = canSwitchRoles ? (localStorage.getItem('smarthire_active_role') || 'superadmin') : defaultRole
  const roleKey = isSuperAdmin ? 'superadmin' : isManager ? 'manager' : isEmployee ? 'employee' : 'recruiter'
  const userName = currentUser?.name || 'Omkesh Manjute'

  const DEFAULT_PERMISSIONS = {
    superadmin: {
      ats: true, home: true, candidates: true, pipeline: true, screening: true,
      submissions: true, reports: true, analytics: true, audit: true, automation: true,
      inbox: true, settings: true, users: true,
    },
    manager: {
      ats: true, home: true, candidates: true, pipeline: true, screening: true,
      submissions: true, reports: true, analytics: true, audit: true, automation: false,
      inbox: true, settings: false, users: false,
    },
    recruiter: {
      ats: true, home: true, candidates: true, pipeline: false, screening: true,
      submissions: false, reports: false, analytics: true, audit: true, automation: false,
      inbox: true, settings: false, users: false,
    }
  }

  const [permissions, setPermissions] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_role_permissions')
      return saved ? JSON.parse(saved) : DEFAULT_PERMISSIONS
    } catch(e) {
      return DEFAULT_PERMISSIONS
    }
  })

  useEffect(() => {
    const handlePermUpdate = () => {
      try {
        const saved = localStorage.getItem('smarthire_role_permissions')
        if (saved) setPermissions(JSON.parse(saved))
      } catch (e) {}
    }
    window.addEventListener('smarthire_permissions_updated', handlePermUpdate)
    return () => window.removeEventListener('smarthire_permissions_updated', handlePermUpdate)
  }, [])

  useEffect(() => {
    if (isEmployee) {
      window.location.href = '/dashboard'
    } else if (!isSuperAdmin && permissions && permissions[roleKey] && permissions[roleKey].ats === false) {
      window.location.href = '/dashboard'
    }
  }, [isEmployee, isSuperAdmin, roleKey, permissions])

  const navigate = useNavigate()
  const location = useLocation()

  const getTabFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab === 'jobs' || tab === 'dashboard') return 'home'
      return tab
    } catch (e) {
      return null
    }
  }

  const [activeTab, setActiveTab] = useState(() => {
    const urlTab = getTabFromUrl()
    return urlTab || 'home'
  })

  useEffect(() => {
    const urlTab = getTabFromUrl()
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab)
    }
  }, [location?.search])

  // Zoho CRM Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [teamspaceOpen, setTeamspaceOpen] = useState(true)
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showHomeViewDropdown, setShowHomeViewDropdown] = useState(false)
  const [homeViewName, setHomeViewName] = useState(`${userName.split(' ')[0]}'s Home`)

  // Global Chat Modal
  const [activeChatCandidate, setActiveChatCandidate] = useState(null)
  const [showCandidatePicker, setShowCandidatePicker] = useState(false)

  // Data state
  const [jobsList, setJobsList] = useState([])
  const [allCandidates, setAllCandidates] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [apiOnline, setApiOnline] = useState(true)

  // Candidates module filter state
  const [selectedJob, setSelectedJob] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [detailCandidate, setDetailCandidate] = useState(null)

  const knownAtsJobIdsRef = useRef(new Set())
  const initialAtsLoadRef = useRef(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(r => r.ok ? setApiOnline(true) : setApiOnline(false))
      .catch(() => setApiOnline(false))
  }, [])

  const fetchJobs = useCallback(async (isBackground = false) => {
    try {
      const res = await fetch(`${API_BASE}/api/jobs`)
      if (res.ok) {
        const data = await res.json()
        const rawList = Array.isArray(data) ? data : Array.isArray(data.jobs) ? data.jobs : []
        const list = rawList.map(j => {
          const finalTitle = cleanJobTitleWithPositionNumber(j.title)
          return {
            ...j,
            title: finalTitle,
            description: (j.description && typeof j.description === 'string' && j.description.length > 20)
              ? formatJobDescription(j.description, { ...j, title: finalTitle })
              : j.description
          }
        })

        if (isBackground && initialAtsLoadRef.current) {
          const newlyAdded = []
          list.forEach(j => {
            const key = j.reqId || j.id
            if (key && !knownAtsJobIdsRef.current.has(key)) {
              newlyAdded.push(j)
              knownAtsJobIdsRef.current.add(key)
            }
          })
          if (newlyAdded.length > 0) {
            setJobsList(list)
            pushActivityNotification({
              title: `💼 ${newlyAdded.length} New Requisition${newlyAdded.length > 1 ? 's' : ''} Ingested!`,
              message: newlyAdded.length === 1
                ? `${newlyAdded[0].title} (Req #${newlyAdded[0].reqId || newlyAdded[0].id}) is now active in ATS.`
                : `${newlyAdded[0].title} (Req #${newlyAdded[0].reqId}) and ${newlyAdded.length - 1} more requisitions synced from JobsInHand.`,
              type: 'requisition',
              category: 'team',
              actor: 'Ingestion Engine',
              actorRole: 'Automation Scraper',
              reqId: newlyAdded[0].reqId || newlyAdded[0].id
            })
          }
        } else {
          list.forEach(j => {
            const key = j.reqId || j.id
            if (key) knownAtsJobIdsRef.current.add(key)
          })
          setJobsList(list)
          initialAtsLoadRef.current = true
        }
      } else {
        if (!isBackground) setJobsList([])
      }
    } catch (err) {
      if (!isBackground) {
        console.error('Failed to fetch jobs:', err)
        setJobsList([])
      }
    }
  }, [])

  const fetchCandidates = useCallback(async () => {
    try {
      let combined = []
      try {
        const firestoreList = await getAllCandidates()
        if (Array.isArray(firestoreList) && firestoreList.length > 0) {
          combined = firestoreList
        }
      } catch (fErr) {
        console.warn('Firestore getAllCandidates:', fErr)
      }

      try {
        const res = await fetch(`${API_BASE}/api/candidates`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}` }
        })
        if (res.ok) {
          const data = await res.json()
          const apiList = Array.isArray(data) ? data : Array.isArray(data.candidates) ? data.candidates : Array.isArray(data.data?.candidates) ? data.data.candidates : []
          const map = new Map()
          combined.forEach(c => { if (c && (c.id || c.name)) map.set(String(c.id || c.name), c) })
          apiList.forEach(c => {
            if (c && (c.id || c.name)) {
              const existing = map.get(String(c.id || c.name)) || {}
              map.set(String(c.id || c.name), { ...existing, ...c })
            }
          })
          combined = Array.from(map.values())
        }
      } catch (bErr) {}

      try {
        const localRaw = localStorage.getItem('smarthire_all_candidates')
        if (localRaw) {
          const localList = JSON.parse(localRaw)
          if (Array.isArray(localList)) {
            const map = new Map()
            combined.forEach(c => { if (c && (c.id || c.name)) map.set(String(c.id || c.name), c) })
            localList.forEach(c => {
              if (c && (c.id || c.name)) {
                const existing = map.get(String(c.id || c.name)) || {}
                map.set(String(c.id || c.name), { ...existing, ...c })
              }
            })
            combined = Array.from(map.values())
          }
        }
      } catch (lErr) {}

      setAllCandidates(combined)
    } catch (err) {
      console.error('Failed to fetch candidates:', err)
      setAllCandidates([])
    }
  }, [])

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/submissions`)
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : Array.isArray(data.submissions) ? data.submissions : []
        setSubmissions(list)
      } else {
        setSubmissions([])
      }
    } catch (err) {
      console.error('Failed to fetch submissions:', err)
      setSubmissions([])
    }
  }, [])

  useEffect(() => {
    fetchJobs()
    fetchCandidates()
    fetchSubmissions()

    const intervalId = setInterval(() => {
      fetchJobs(true)
    }, 35000)

    return () => clearInterval(intervalId)
  }, [fetchJobs, fetchCandidates, fetchSubmissions])

  const rawCandidates = Array.isArray(allCandidates) ? allCandidates : []
  const safeJobs = Array.isArray(jobsList) ? jobsList : []

  const recruiterUserEmail = (currentUser?.email || '').toLowerCase().trim()
  const recruiterUserName = (currentUser?.name || '').toLowerCase().trim()
  const recruiterUserId = String(currentUser?.id || currentUser?._id || '').toLowerCase().trim()
  const recruiterRef = (currentUser?.refCode || '').toLowerCase().trim()

  const safeCandidates = deduplicateCandidates((isSuperAdmin || realUserRole === 'admin' || isManager)
    ? rawCandidates
    : rawCandidates.filter(c => {
        if (!c) return false
        const cOwner = (c.createdBy || c.recruiterEmail || c.submittedBy || c.recruiterId || '').toLowerCase().trim()
        const cRecruiter = (c.recruiter || c.assignedBy || c.addedByName || c.referredByRecruiterName || '').toLowerCase().trim()
        return cOwner === recruiterUserEmail || cOwner === recruiterUserId || cRecruiter === recruiterUserName
      }))

  const filteredCandidates = deduplicateCandidates(safeCandidates.filter(c => {
    if (!c) return false
    const matchJob = selectedJob === 'All' || c.job_id === selectedJob
    const matchStatus = statusFilter === 'All' || c.status === statusFilter
    const nameStr = c.extracted_profile?.name || c.name || ''
    const matchQuery = !query || nameStr.toLowerCase().includes(query.toLowerCase())
    return matchJob && matchStatus && matchQuery
  }))

  const liveCandidates = safeCandidates.filter(c => c && c.status !== 'Rejected')
  const qualified = safeCandidates.filter(c =>
    c && ['Shortlisted', 'RTR Received', 'Interview Scheduled', 'Selected', 'Placed'].includes(c.status)
  ).length
  const newCandidates = safeCandidates.filter(c => c && c.status === 'New').length
  const pendingRtr = safeCandidates.filter(c => c && c.status === 'RTR Requested').length
  const activeJobs = safeJobs.filter(j => j && (j.status === 'Active' || j.status === 'Posted')).length
  const interviewsCount = safeCandidates.filter(c => c && c.status === 'Interview Scheduled').length

  const updateStatus = async (candidateId, newStatus) => {
    try {
      await fetch(`${API_BASE}/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        },
        body: JSON.stringify({ status: newStatus }),
      })
      setAllCandidates(prev =>
        Array.isArray(prev) ? prev.map(c => c && c.id === candidateId ? { ...c, status: newStatus } : c) : []
      )
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const handleBulkStatusChange = async (newStatus) => {
    for (const id of selectedIds) {
      await updateStatus(id, newStatus)
    }
    setSelectedIds([])
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected candidates?`)) return
    for (const id of selectedIds) {
      try {
        await fetch(`${API_BASE}/api/candidates/${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}` }
        })
      } catch (err) {}
    }
    setAllCandidates(prev => Array.isArray(prev) ? prev.filter(c => c && !selectedIds.includes(c.id)) : [])
    setSelectedIds([])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCandidates.length) setSelectedIds([])
    else setSelectedIds(filteredCandidates.map(c => c.id).filter(Boolean))
  }

  const toggleSelectCandidate = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // Filter modules based on permissions
  const allowedModules = ALL_MODULES.filter(m => {
    if (isSuperAdmin) return true
    if (m.adminOnly && !isSuperAdmin && !isManager) return false
    return true
  })

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#f4f5f8',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>

      {/* ─── 1. ZOHO CRM DEEP-SLATE NAVY SIDEBAR (#161e31) ───────────────── */}
      <div style={{
        width: sidebarCollapsed ? '64px' : '240px',
        minWidth: sidebarCollapsed ? '64px' : '240px',
        background: '#161e31',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        transition: 'width 0.2s ease',
        zIndex: 100,
        userSelect: 'none',
        flexShrink: 0
      }}>

        {/* Top Brand & Collapse Icon */}
        <div style={{
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: sidebarCollapsed ? '0 16px' : '0 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          {!sidebarCollapsed && (
            <div
              onClick={() => setActiveTab('home')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '7px',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffffff', fontWeight: '900', fontSize: '15px'
              }}>
                ⚡
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.01em' }}>
                  SmartHire ATS
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>▼</span>
              </div>
            </div>
          )}

          {sidebarCollapsed && (
            <div
              onClick={() => setActiveTab('home')}
              style={{
                width: '32px', height: '32px', borderRadius: '7px',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffffff', fontWeight: '900', cursor: 'pointer'
              }}
            >
              ⚡
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(prev => !prev)}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        </div>

        {/* Primary Upper Navigation (Home, Pipeline, Reports, Analytics, Agents) */}
        <div style={{ padding: '8px 8px 4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {[
            { id: 'home', label: 'Home', icon: '🏠' },
            { id: 'pipeline', label: 'Workqueue', icon: '📥' },
            { id: 'reports', label: 'Reports', icon: '📑' },
            { id: 'screening', label: 'AI Agents', icon: '🤖' }
          ].map(item => {
            const isActive = activeTab === item.id
            return (
              <div
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: sidebarCollapsed ? '10px 0' : '9px 12px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  borderRadius: '6px',
                  background: isActive ? '#24324f' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.12s'
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#ffffff' } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' } }}
              >
                <span style={{ fontSize: '15px' }}>{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </div>
            )
          })}
        </div>

        {/* Middle Section: Collapsible ATS Teamspace Accordion with Search */}
        {!sidebarCollapsed && (
          <div style={{ padding: '8px 12px 4px' }}>
            <div
              onClick={() => setTeamspaceOpen(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#cbd5e1',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                padding: '4px 0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', background: '#e11d48', color: '#fff', padding: '1px 4px', borderRadius: '3px', fontWeight: '800' }}>CT</span>
                <span>ATS Teamspace</span>
              </div>
              <span style={{ fontSize: '9px' }}>{teamspaceOpen ? '▼' : '▶'}</span>
            </div>

            {/* Inline Module Search Box */}
            {teamspaceOpen && (
              <div style={{ marginTop: '8px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={sidebarSearch}
                  onChange={e => setSidebarSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px 6px 26px',
                    fontSize: '11px',
                    borderRadius: '5px',
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ position: 'absolute', left: '8px', top: '6px', fontSize: '11px', color: '#64748b' }}>🔍</span>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Sub-modules List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          {/* Section: Talent Acquisition */}
          {!sidebarCollapsed && (
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', padding: '8px 10px 4px' }}>
              📁 Talent Acquisition
            </div>
          )}

          {[
            { id: 'candidates', label: 'Candidates', icon: '👤', count: safeCandidates.length },
            { id: 'pipeline', label: 'Pipeline', icon: '📈' },
            { id: 'screening', label: 'Screening', icon: '🔍' },
            { id: 'submissions', label: 'Submissions', icon: '📤' },
          ]
            .filter(m => !sidebarSearch || m.label.toLowerCase().includes(sidebarSearch.toLowerCase()))
            .map(m => {
              const isActive = activeTab === m.id
              return (
                <div
                  key={m.id}
                  onClick={() => setActiveTab(m.id)}
                  title={sidebarCollapsed ? m.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: sidebarCollapsed ? '10px 0' : '7px 12px',
                    borderRadius: '6px',
                    background: isActive ? '#24324f' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    fontSize: '12.5px',
                    fontWeight: isActive ? '700' : '500',
                    cursor: 'pointer',
                    marginBottom: '2px'
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#ffffff' } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', width: sidebarCollapsed ? '100%' : 'auto' }}>
                    <span style={{ fontSize: '14px' }}>{m.icon}</span>
                    {!sidebarCollapsed && <span>{m.label}</span>}
                  </div>
                  {!sidebarCollapsed && m.count != null && (
                    <span style={{
                      fontSize: '10.5px',
                      background: isActive ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: '700'
                    }}>
                      {m.count}
                    </span>
                  )}
                </div>
              )
            })}

          {/* Section: Operations & Admin */}
          {!sidebarCollapsed && (
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', padding: '12px 10px 4px' }}>
              📁 Operations & Admin
            </div>
          )}

          {[
            { id: 'audit', label: 'Audit Logs', icon: '📜' },
            { id: 'automation', label: 'Automation', icon: '⚙️' },
            { id: 'inbox', label: 'Recruiter Inbox', icon: '💬', isLink: '/inbox' },
            { id: 'settings', label: 'Settings', icon: '🛠️' },
            { id: 'users', label: 'Manage Users', icon: '👥' },
          ]
            .filter(m => !sidebarSearch || m.label.toLowerCase().includes(sidebarSearch.toLowerCase()))
            .map(m => {
              const isActive = activeTab === m.id
              return (
                <div
                  key={m.id}
                  onClick={() => { if (m.isLink) navigate(m.isLink); else setActiveTab(m.id) }}
                  title={sidebarCollapsed ? m.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: sidebarCollapsed ? '10px 0' : '7px 12px',
                    borderRadius: '6px',
                    background: isActive ? '#24324f' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    fontSize: '12.5px',
                    fontWeight: isActive ? '700' : '500',
                    cursor: 'pointer',
                    marginBottom: '2px',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#ffffff' } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px' }}>{m.icon}</span>
                    {!sidebarCollapsed && <span>{m.label}</span>}
                  </div>
                </div>
              )
            })}

          {/* Quick Portals */}
          {!sidebarCollapsed && (
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', padding: '12px 10px 4px' }}>
              📁 Quick Portals
            </div>
          )}

          <div
            onClick={() => navigate('/dashboard')}
            title="Switch to Requisitions Dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: sidebarCollapsed ? '10px 0' : '7px 12px',
              borderRadius: '6px',
              color: '#38bdf8',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: '14px' }}>🏢</span>
            {!sidebarCollapsed && <span>Requisitions Portal ↗</span>}
          </div>

          <div
            onClick={() => navigate('/jobs')}
            title="View Public Careers Portal"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: sidebarCollapsed ? '10px 0' : '7px 12px',
              borderRadius: '6px',
              color: '#34d399',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,211,153,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: '14px' }}>🌐</span>
            {!sidebarCollapsed && <span>Public Careers (/jobs) ↗</span>}
          </div>
        </div>

        {/* Sidebar Bottom Pinned Tools (Zoho CRM Style) */}
        <div style={{
          padding: '8px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-around',
          color: '#94a3b8',
          fontSize: '12px'
        }}>
          {!sidebarCollapsed ? (
            <>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} title="Pinned Records">
                <span>📌</span>
                <span style={{ fontSize: '11px' }}>Pins</span>
              </div>
              <div
                onClick={() => setShowCandidatePicker(true)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Open Candidate Chat"
              >
                <span>💬</span>
                <span style={{ fontSize: '11px' }}>Chats</span>
              </div>
              <div
                onClick={() => setActiveTab('users')}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Team Members"
              >
                <span>👥</span>
                <span style={{ fontSize: '11px' }}>Team</span>
              </div>
              <div
                onClick={() => window.open('https://help.zoho.com', '_blank')}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Help & Documentation"
              >
                <span>❓</span>
                <span style={{ fontSize: '11px' }}>Help</span>
              </div>
            </>
          ) : (
            <div onClick={() => setShowCandidatePicker(true)} style={{ cursor: 'pointer' }} title="Chat">💬</div>
          )}
        </div>
      </div>

      {/* ─── 2. MAIN COLUMN: CLEAN ENTERPRISE TOPBAR + CANVAS ──────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>

        {/* TOP ENTERPRISE HEADER BAR (Zoho CRM Style: Pure White) */}
        <div style={{
          height: '56px',
          minHeight: '56px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 90
        }}>

          {/* Left: Current Tab Title & View Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
              {activeTab === 'home' ? 'Home' : activeTab === 'candidates' ? 'Candidates' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </span>
            {activeTab === 'home' && (
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                · SmartHire Enterprise Workspace
              </span>
            )}
          </div>

          {/* Center: Global Search (Pill shaped, subtle border) */}
          <div style={{ flex: '0 1 420px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search candidate records, skills, requisitions... (⌘K)"
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                if (activeTab !== 'candidates') setActiveTab('candidates')
              }}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                fontSize: '12.5px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '7px', fontSize: '13px', color: '#94a3b8' }}>🔍</span>
          </div>

          {/* Right Utility Cluster: Create +, Chat, Notification, Settings, Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Quick Add Pill */}
            <button
              onClick={() => setActiveTab('candidates')}
              title="Quick Add Candidate"
              style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              +
            </button>

            {/* Candidate Chat Trigger */}
            <button
              onClick={() => setShowCandidatePicker(true)}
              title="Real-time Candidate Chat"
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 10px', borderRadius: '6px',
                background: '#ffffff', border: '1px solid #e2e8f0',
                fontSize: '12px', fontWeight: '600', color: '#334155',
                cursor: 'pointer'
              }}
            >
              <span>💬</span>
              <span>Chat</span>
            </button>

            {/* Live Activity & Push Notification Bell with Sound */}
            <ActivityNotificationBell
              theme="default"
              onSelectNotification={(notif) => {
                if (notif.candidateId) setActiveTab('candidates')
                else if (notif.reqId) navigate('/dashboard')
              }}
            />

            {/* Requisitions Switcher Shortcut */}
            <button
              onClick={() => navigate('/dashboard')}
              title="Switch to Requisitions Dashboard"
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 10px', borderRadius: '6px',
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                fontSize: '12px', fontWeight: '700', color: '#15803d',
                cursor: 'pointer'
              }}
            >
              <span>🏢</span>
              <span>Requisitions</span>
            </button>

            {/* User Profile Avatar with Online Indicator */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setShowUserDropdown(prev => !prev)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  cursor: 'pointer', padding: '2px 4px', borderRadius: '6px'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: '#2563eb', color: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '800', fontSize: '13px'
                  }}>
                    {userName.slice(0, 1).toUpperCase()}
                  </div>
                  <span style={{
                    position: 'absolute', bottom: '-1px', right: '-1px',
                    width: '9px', height: '9px', borderRadius: '50%',
                    background: '#10b981', border: '2px solid #ffffff'
                  }} />
                </div>
                <div style={{ display: 'none', mdDisplay: 'block' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>
                    {userName}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    {isSuperAdmin ? 'SUPER ADMIN' : 'RECRUITER'}
                  </div>
                </div>
              </div>

              {showUserDropdown && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: '6px',
                  background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)', minWidth: '180px',
                  padding: '6px 0', zIndex: 120
                }}>
                  <div style={{ padding: '8px 14px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>{userName}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{currentUser?.email || 'admin@smarthire.com'}</div>
                  </div>
                  <div
                    onClick={() => { setActiveTab('users'); setShowUserDropdown(false) }}
                    style={{ padding: '8px 14px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}
                  >
                    👥 Team Management
                  </div>
                  <div
                    onClick={() => { setActiveTab('settings'); setShowUserDropdown(false) }}
                    style={{ padding: '8px 14px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}
                  >
                    ⚙️ ATS Settings
                  </div>
                  <div
                    onClick={() => {
                      localStorage.clear()
                      window.location.href = '/'
                    }}
                    style={{ padding: '8px 14px', fontSize: '12.5px', color: '#ef4444', fontWeight: '600', cursor: 'pointer', borderTop: '1px solid #f1f5f9' }}
                  >
                    🚪 Sign Out
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── 3. MAIN WORKSPACE CANVAS ────────────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflowY: activeTab === 'candidates' ? 'hidden' : 'auto',
          background: '#f4f5f8'
        }}>

          {/* ══════════════════════════════════════════════════════════════════
              VIEW A: ZOHO CRM HOME OVERVIEW (Screenshots 1 & 2)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'home' && (
            <div style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto' }}>
              
              {/* Welcome Header Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '8px',
                    background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px'
                  }}>
                    🏢
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                      Welcome {userName}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>SmartHire ATS Control Center</span>
                    </div>
                  </div>
                </div>

                {/* Right: View Dropdown + Refresh Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => { fetchJobs(); fetchCandidates(); fetchSubmissions(); alert('↻ Refreshed ATS workspace data!') }}
                    title="Refresh data"
                    style={{
                      background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px',
                      padding: '6px 10px', cursor: 'pointer', fontSize: '13px'
                    }}
                  >
                    ↻
                  </button>

                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowHomeViewDropdown(prev => !prev)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px',
                        padding: '6px 14px', fontSize: '12.5px', fontWeight: '700', color: '#1e293b',
                        cursor: 'pointer'
                      }}
                    >
                      <span>{homeViewName}</span>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>▼</span>
                    </button>

                    {showHomeViewDropdown && (
                      <div style={{
                        position: 'absolute', right: 0, top: '100%', marginTop: '4px',
                        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', minWidth: '200px',
                        padding: '6px 0', zIndex: 40
                      }}>
                        {[`${userName.split(' ')[0]}'s Home`, 'Company Overview', 'Sourcing Specialist View'].map(v => (
                          <div
                            key={v}
                            onClick={() => { setHomeViewName(v); setShowHomeViewDropdown(false) }}
                            style={{
                              padding: '8px 14px', fontSize: '12.5px', color: '#334155', cursor: 'pointer',
                              background: homeViewName === v ? '#eff6ff' : 'transparent',
                              fontWeight: homeViewName === v ? '700' : '500'
                            }}
                          >
                            {v}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Zoho KPI Metric Cards (Pure White, Rounded 8px, Soft Border) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {[
                  { title: 'My Open Requisitions', value: activeJobs, change: '+4 this week', color: '#2563eb', action: () => setActiveTab('candidates') },
                  { title: 'Total Talent Pool', value: safeCandidates.length, change: 'Across all sources', color: '#0f172a', action: () => setActiveTab('candidates') },
                  { title: 'Interviews Scheduled', value: interviewsCount, change: 'Active pipeline', color: '#10b981', action: () => setActiveTab('pipeline') },
                  { title: 'Submissions & RTR', value: qualified, change: 'Manager ready', color: '#f59e0b', action: () => setActiveTab('submissions') },
                ].map((kpi, idx) => (
                  <div
                    key={idx}
                    onClick={kpi.action}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '16px 20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                      {kpi.title}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: kpi.color, lineHeight: 1.1 }}>
                      {kpi.value}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                      {kpi.change}
                    </div>
                  </div>
                ))}
              </div>

              {/* Zoho Setup & Onboarding Interactive Banner (Screenshot 2) */}
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #fdf2f8 50%, #f0fdf4 100%)',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'inline-block', background: '#dbeafe', color: '#1e40af', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', marginBottom: '8px' }}>
                    QUICK START
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                    Set up your SmartHire ATS
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                    Make your recruitment smarter, automated, and more interactive. Configure pipelines, sync JobsInHand requisitions, and screen candidates with Gemini AI.
                  </p>
                </div>

                <div style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}>
                  {[
                    { title: 'Invite your recruiting team', icon: '👥', tab: 'users' },
                    { title: 'Configure candidate pipeline stages', icon: '📈', tab: 'pipeline' },
                    { title: 'AI Resume Screening & Matchmaker', icon: '🤖', tab: 'screening' },
                    { title: 'Connect email & recruiter inbox', icon: '💬', link: '/inbox' }
                  ].map((step, sIdx) => (
                    <div
                      key={sIdx}
                      onClick={() => {
                        if (step.link) navigate(step.link)
                        else if (step.tab) setActiveTab(step.tab)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '7px',
                        background: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        transition: 'background 0.12s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#f1f5f9' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>{step.icon}</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{step.title}</span>
                      </div>
                      <span style={{ fontSize: '13px', color: '#2563eb', fontWeight: 'bold' }}>›</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2-Column Split Widgets (Screenshot 1: Open Tasks & Scheduled Meetings) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                gap: '20px'
              }}>

                {/* Left Widget: My Open Tasks / Sourcing Queue */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                      My Open Tasks & Sourcing Queue
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>⋮</span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                        <th style={{ padding: '8px 14px', fontWeight: '600' }}>Subject / Role</th>
                        <th style={{ padding: '8px 14px', fontWeight: '600' }}>Due Date</th>
                        <th style={{ padding: '8px 14px', fontWeight: '600' }}>Status</th>
                        <th style={{ padding: '8px 14px', fontWeight: '600' }}>Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeJobs.slice(0, 5).map((job, jIdx) => (
                        <tr
                          key={job.id || jIdx}
                          style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                          onClick={() => { setSelectedJob(job.id); setActiveTab('candidates') }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                        >
                          <td style={{ padding: '9px 14px', fontWeight: '600', color: '#2563eb' }}>
                            Req# {job.reqId || String(job.id).replace('J-', '')} - {job.title?.slice(0, 24)}...
                          </td>
                          <td style={{ padding: '9px 14px', color: '#64748b' }}>
                            {job.deadline || 'Closing Soon'}
                          </td>
                          <td style={{ padding: '9px 14px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', fontWeight: '700' }}>
                              In Progress
                            </span>
                          </td>
                          <td style={{ padding: '9px 14px' }}>
                            <span style={{ fontSize: '11px', color: jIdx === 0 ? '#dc2626' : '#d97706', fontWeight: '700' }}>
                              {jIdx === 0 ? 'Highest' : 'Normal'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ padding: '8px 16px', background: '#ffffff', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
                    1 - 5 of {safeJobs.length} ›
                  </div>
                </div>

                {/* Right Widget: My Meetings & Scheduled Interviews */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                      Recent Applicants & Interviews
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>⋮</span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                        <th style={{ padding: '8px 14px', fontWeight: '600' }}>Candidate</th>
                        <th style={{ padding: '8px 14px', fontWeight: '600' }}>Applied For</th>
                        <th style={{ padding: '8px 14px', fontWeight: '600' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeCandidates.slice(0, 5).map((cand, cIdx) => (
                        <tr
                          key={cand.id || cIdx}
                          style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                          onClick={() => setActiveTab('candidates')}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                        >
                          <td style={{ padding: '9px 14px', fontWeight: '700', color: '#2563eb' }}>
                            {formatTitleCase(cand.name)}
                          </td>
                          <td style={{ padding: '9px 14px', color: '#475569' }}>
                            {cand.role?.slice(0, 20)}...
                          </td>
                          <td style={{ padding: '9px 14px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: '#f0fdf4', color: '#16a34a', fontWeight: '700' }}>
                              {cand.status || 'New'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ padding: '8px 16px', background: '#ffffff', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
                    1 - 5 of {safeCandidates.length} ›
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW B: ZOHO CRM CANDIDATES / LEADS (Screenshot 3)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'candidates' && (
            <CandidatesModule
              allCandidates={safeCandidates}
              filteredCandidates={filteredCandidates}
              jobsList={safeJobs}
              selectedJob={selectedJob}
              setSelectedJob={setSelectedJob}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              query={query}
              setQuery={setQuery}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              toggleSelectAll={toggleSelectAll}
              toggleSelectCandidate={toggleSelectCandidate}
              updateStatus={updateStatus}
              setDetailCandidate={setDetailCandidate}
              handleBulkStatusChange={handleBulkStatusChange}
              handleBulkDelete={handleBulkDelete}
              statuses={STATUSES}
            />
          )}

          {/* ══════════════════════════════════════════════════════════════════
              OTHER ATS MODULES (INSIDE ZOHO CANVAS)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'pipeline' && (
            <div style={{ padding: '20px' }}>
              <PipelineModule
                allCandidates={safeCandidates}
                jobsList={safeJobs}
                updateStatus={updateStatus}
              />
            </div>
          )}

          {activeTab === 'screening' && (
            <div style={{ padding: '20px' }}>
              <ScreeningModule
                jobsList={safeJobs}
                allCandidates={safeCandidates}
              />
            </div>
          )}

          {activeTab === 'submissions' && (
            <div style={{ padding: '20px' }}>
              <SubmissionModule
                allCandidates={safeCandidates}
                jobsList={safeJobs}
                submissions={submissions}
                setSubmissions={setSubmissions}
              />
            </div>
          )}

          {activeTab === 'reports' && (
            <div style={{ padding: '20px' }}>
              <ReportsModule
                allCandidates={safeCandidates}
                jobsList={safeJobs}
                submissions={submissions}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div style={{ padding: '20px' }}>
              <ReportsModule
                allCandidates={safeCandidates}
                jobsList={safeJobs}
                submissions={submissions}
              />
            </div>
          )}

          {activeTab === 'audit' && (
            <div style={{ padding: '20px' }}>
              <AuditActivityLogModule />
            </div>
          )}

          {activeTab === 'automation' && (
            <div style={{ padding: '20px' }}>
              <AutomationModule apiOnline={apiOnline} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{ padding: '20px' }}>
              <SettingsModule />
            </div>
          )}

          {activeTab === 'users' && (
            <div style={{ padding: '20px' }}>
              <UsersModule
                allCandidates={rawCandidates}
                permissions={permissions}
                setPermissions={setPermissions}
              />
            </div>
          )}

        </div>
      </div>

      {/* CANDIDATE INBOX SELECTOR MODAL */}
      {showCandidatePicker && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}
          onClick={() => setShowCandidatePicker(false)}>
          <div style={{
            background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '520px',
            maxHeight: '80vh', overflowY: 'auto', padding: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0'
          }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                  💬 Select Candidate to Chat
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Open real-time messaging thread with applicant
                </p>
              </div>
              <button
                onClick={() => setShowCandidatePicker(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {safeCandidates.slice(0, 15).map(c => (
                <div
                  key={c.id}
                  onClick={() => { setActiveChatCandidate(c); setShowCandidatePicker(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: '8px', background: '#f8fafc',
                    border: '1px solid #f1f5f9', cursor: 'pointer'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#f1f5f9' }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{c.role} · {c.email}</div>
                  </div>
                  <span style={{ fontSize: '11.5px', background: '#2563eb', color: '#ffffff', borderRadius: '5px', padding: '3px 8px', fontWeight: '700' }}>
                    Chat →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING CANDIDATE MESSENGER WIDGET */}
      {activeChatCandidate && (
        <CandidateMessengerWidget
          candidate={activeChatCandidate}
          role="recruiter"
          onClose={() => setActiveChatCandidate(null)}
          onScheduleInterview={(c) => {
            updateStatus(c.id, 'Interview Scheduled')
            alert(`🗓️ Interview invite sent to ${c.extracted_profile?.name || c.name || 'Candidate'}!`)
          }}
        />
      )}

    </div>
  )
}
