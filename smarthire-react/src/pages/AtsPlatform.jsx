import React, { useState, useEffect, useCallback } from 'react'
import SiteLayout from '../components/SiteLayout'
import CandidateMessengerWidget from '../components/CandidateMessengerWidget'
import { useNavigate } from 'react-router-dom'
import {
  DashboardModule,
  JobsModule,
  CandidatesModule,
  PipelineModule,
  SubmissionModule,
  ReportsModule,
  AutomationModule,
  SettingsModule,
  ScreeningModule,
  UsersModule,
} from '../ats'

const API_BASE = ''

const STATUSES = [
  'New', 'Reviewed', 'Shortlisted', 'RTR Requested', 'RTR Received',
  'Interview Scheduled', 'Selected', 'Rejected', 'Placed',
]

const ALL_TABS = [
  { id: 'dashboard',   label: '📊 Dashboard',    icon: '📊', adminOnly: true },
  { id: 'jobs',        label: '💼 Jobs',          icon: '💼' },
  { id: 'candidates',  label: '👤 Candidates',    icon: '👤' },
  { id: 'pipeline',    label: '📈 Pipeline',      icon: '📈', adminOnly: true },
  { id: 'screening',   label: '🔍 Screening',     icon: '🔍' },
  { id: 'submissions', label: '📤 Submissions',   icon: '📤', adminOnly: true },
  { id: 'reports',     label: '📑 Reports',       icon: '📑', adminOnly: true },
  { id: 'automation',  label: '⚙️ Automation',    icon: '⚙️', adminOnly: true },
  { id: 'inbox',       label: '💬 Inbox',         icon: '💬', isLink: '/inbox' },
  { id: 'settings',    label: '🛠️ Settings',      icon: '🛠️', adminOnly: true },
  { id: 'users',       label: '👥 Manage Users',   icon: '👥', adminOnly: true },
]

export default function AtsPlatform() {
  const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user')
  let currentUser = null
  try {
    if (userStr) currentUser = JSON.parse(userStr)
  } catch (e) {}

  const defaultRole = (currentUser && currentUser.role) ? currentUser.role : 'superadmin'
  const activeRole = localStorage.getItem('smarthire_active_role') || defaultRole
  const isSuperAdmin = activeRole === 'superadmin' || activeRole === 'admin'

  const DEFAULT_PERMISSIONS = {
    superadmin: {
      dashboard: true,
      jobs: true,
      candidates: true,
      pipeline: true,
      screening: true,
      submissions: true,
      reports: true,
      automation: true,
      inbox: true,
      settings: true,
      users: true,
    },
    recruiter: {
      dashboard: false,
      jobs: true,
      candidates: true,
      pipeline: false,
      screening: true,
      submissions: false,
      reports: false,
      automation: false,
      inbox: true,
      settings: false,
      users: false,
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

  const roleKey = isSuperAdmin ? 'superadmin' : 'recruiter'
  const TABS = ALL_TABS.filter(tab => {
    if (roleKey === 'superadmin' && (tab.id === 'users' || tab.id === 'settings')) {
      return true
    }
    return !!permissions[roleKey]?.[tab.id]
  })

  const [activeTab, setActiveTab] = useState(() => {
    if (roleKey === 'superadmin') return 'dashboard'
    return TABS[0]?.id || 'jobs'
  })
  const navigate = useNavigate()
  
  // Layout mode state: 'topbar' or 'sidebar' (saved in localStorage, default sidebar/topbar)
  const [navLayout, setNavLayout] = useState(() => {
    return localStorage.getItem('smarthire_nav_layout') || 'topbar'
  })

  // Global Real-time Candidate Chat state
  const [activeChatCandidate, setActiveChatCandidate] = useState(null)
  const [showCandidatePicker, setShowCandidatePicker] = useState(false)

  const toggleNavLayout = () => {
    const nextMode = navLayout === 'topbar' ? 'sidebar' : 'topbar'
    setNavLayout(nextMode)
    localStorage.setItem('smarthire_nav_layout', nextMode)
  }

  // Data state with safe defaults
  const [jobsList, setJobsList] = useState([])
  const [allCandidates, setAllCandidates] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [apiOnline, setApiOnline] = useState(false)
  const [isScraping, setIsScraping] = useState(false)

  // Candidates module state
  const [selectedJob, setSelectedJob] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [detailCandidate, setDetailCandidate] = useState(null)

  // Jobs module state
  const [rawJdText, setRawJdText] = useState('')
  const [parsingJd, setParsingJd] = useState(false)
  const [publishingJobId, setPublishingJobId] = useState(null)

  // API health check
  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(r => r.ok ? setApiOnline(true) : setApiOnline(false))
      .catch(() => setApiOnline(false))
  }, [])

  // Fetch jobs safely
  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/jobs`)
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : Array.isArray(data.jobs) ? data.jobs : []
        setJobsList(list)
      } else {
        setJobsList([])
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
      setJobsList([])
    }
  }, [])

  // Fetch candidates safely
  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/candidates`)
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : Array.isArray(data.candidates) ? data.candidates : []
        setAllCandidates(list)
      } else {
        setAllCandidates([])
      }
    } catch (err) {
      console.error('Failed to fetch candidates:', err)
      setAllCandidates([])
    }
  }, [])

  // Fetch submissions safely
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

  // Load all data on mount
  useEffect(() => {
    fetchJobs()
    fetchCandidates()
    fetchSubmissions()
  }, [fetchJobs, fetchCandidates, fetchSubmissions])

  // Safe arrays with role-based candidate scoping
  const rawCandidates = Array.isArray(allCandidates) ? allCandidates : []
  const safeJobs = Array.isArray(jobsList) ? jobsList : []

  const recruiterUserEmail = (currentUser?.email || '').toLowerCase()
  const recruiterUserId = currentUser?.id || currentUser?._id || ''

  const safeCandidates = isSuperAdmin
    ? rawCandidates
    : rawCandidates.filter(c => {
        if (!c) return false
        const cOwner = (c.createdBy || c.recruiterEmail || c.submittedBy || c.recruiterId || '').toLowerCase()
        return !cOwner || cOwner === recruiterUserEmail || cOwner === recruiterUserId || c.isSample || c.job_id === 'J-102'
      })

  // Filtered candidates safely
  const filteredCandidates = safeCandidates.filter(c => {
    if (!c) return false
    const matchJob = selectedJob === 'All' || c.job_id === selectedJob
    const matchStatus = statusFilter === 'All' || c.status === statusFilter
    const nameStr = c.extracted_profile?.name || c.name || ''
    const titleStr = c.extracted_profile?.title || c.title || ''
    const emailStr = c.extracted_profile?.email || c.email || ''
    const skillStr = typeof c.skills === 'string' ? c.skills : Array.isArray(c.skills) ? c.skills.join(' ') : ''

    const matchQuery =
      !query ||
      nameStr.toLowerCase().includes(query.toLowerCase()) ||
      titleStr.toLowerCase().includes(query.toLowerCase()) ||
      emailStr.toLowerCase().includes(query.toLowerCase()) ||
      skillStr.toLowerCase().includes(query.toLowerCase())

    return matchJob && matchStatus && matchQuery
  })

  const liveCandidates = safeCandidates.filter(c => c && c.status !== 'Rejected')

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCandidates.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredCandidates.map(c => c ? c.id : null).filter(Boolean))
    }
  }

  const toggleSelectCandidate = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const updateStatus = async (candidateId, newStatus) => {
    try {
      await fetch(`${API_BASE}/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
        await fetch(`${API_BASE}/api/candidates/${id}`, { method: 'DELETE' })
      } catch (err) {
        console.error('Failed to delete candidate:', err)
      }
    }
    setAllCandidates(prev => Array.isArray(prev) ? prev.filter(c => c && !selectedIds.includes(c.id)) : [])
    setSelectedIds([])
  }

  const handleParseJd = async () => {
    if (!rawJdText.trim()) return
    setParsingJd(true)
    try {
      const res = await fetch(`${API_BASE}/api/jobs/parse-jd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdText: rawJdText }),
      })
      if (res.ok) {
        await fetchJobs()
        setRawJdText('')
      }
    } catch (err) {
      console.error('Failed to parse JD:', err)
    }
    setParsingJd(false)
  }

  const handleScrapeNow = async () => {
    setIsScraping(true)
    try {
      const res = await fetch(`${API_BASE}/api/jobs/scrape`, { method: 'POST' })
      if (res.ok) {
        await fetchJobs()
      }
    } catch (err) {
      console.error('Scrape failed:', err)
    }
    setIsScraping(false)
  }

  const handlePostJobToLinkedIn = async (jobId, customContent) => {
    setPublishingJobId(jobId)
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}/linkedin-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customContent })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'HTTP error ' + res.status)
      }
      await fetchJobs()
    } catch (err) {
      console.error('LinkedIn post failed:', err)
      throw err
    } finally {
      setPublishingJobId(null)
    }
  }

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job?')) return
    try {
      await fetch(`${API_BASE}/api/jobs/${jobId}`, { method: 'DELETE' })
      setJobsList(prev => Array.isArray(prev) ? prev.filter(j => j && j.id !== jobId) : [])
    } catch (err) {
      console.error('Failed to delete job:', err)
    }
  }

  const handleOpenJobPreview = (job) => {
    window.open(`/jobs`, '_blank')
  }

  const qualified = safeCandidates.filter(c =>
    c && ['Shortlisted', 'RTR Received', 'Interview Scheduled', 'Selected', 'Placed'].includes(c.status)
  ).length
  const newCandidates = safeCandidates.filter(c => c && c.status === 'New').length
  const pendingRtr = safeCandidates.filter(c => c && c.status === 'RTR Requested').length
  const activeJobs = safeJobs.filter(j => j && (j.status === 'Active' || j.status === 'Posted')).length

  return (
    <SiteLayout>
      <div style={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>

        {/* ─── TOP HEADER BAR ─────────────────────────────────────── */}
        <div style={{
          position: 'sticky', top: '64px', zIndex: 50,
          background: '#ffffff',
          borderBottom: '1px solid #eaecf0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '60px', minHeight: '60px',
        }}>

          {/* LEFT: Logo + Platform Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 11 2 2 4-4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#111827', lineHeight: 1.2 }}>SmartHire ATS</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>AI Talent Recruitment Platform</div>
            </div>
          </div>

          {/* CENTER: Quick Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '8px 18px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#6366f1' }}>{activeJobs}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jobs</div>
              </div>
              <div style={{ width: '1px', height: '28px', background: '#e5e7eb' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#6366f1' }}>{safeCandidates.length}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Candidates</div>
              </div>
              <div style={{ width: '1px', height: '28px', background: '#e5e7eb' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#10b981' }}>{qualified}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qualified</div>
              </div>
            </div>
          </div>

          {/* RIGHT: Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

            {/* API Status Pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 12px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '600',
              background: apiOnline ? '#ecfdf5' : '#fef2f2',
              color: apiOnline ? '#059669' : '#dc2626',
              border: `1px solid ${apiOnline ? '#a7f3d0' : '#fecaca'}`,
              userSelect: 'none',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: apiOnline ? '#10b981' : '#ef4444',
                display: 'inline-block',
                boxShadow: apiOnline ? '0 0 0 2px rgba(16,185,129,0.2)' : '0 0 0 2px rgba(239,68,68,0.2)',
              }} />
              {apiOnline ? 'Live' : 'Offline'}
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '22px', background: '#e5e7eb', flexShrink: 0 }} />

            {/* Messages Button */}
            <button
              id="candidate-messages-btn"
              onClick={() => setShowCandidatePicker(true)}
              title="Candidate Messages"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 13px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '600',
                background: '#f8fafc', color: '#374151',
                border: '1px solid #e5e7eb', cursor: 'pointer',
                transition: 'all 0.15s', outline: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.borderColor = '#bfdbfe' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = '#e5e7eb' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>Inbox</span>
            </button>

            {/* Role Switcher */}
            <button
              id="role-switcher-btn"
              onClick={() => {
                const nextRole = isSuperAdmin ? 'recruiter' : 'superadmin'
                localStorage.setItem('smarthire_active_role', nextRole)
                window.location.reload()
              }}
              title={isSuperAdmin ? 'Switch to Recruiter View' : 'Switch to Admin View'}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '7px 13px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '700',
                background: isSuperAdmin
                  ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
                  : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                color: isSuperAdmin ? '#92400e' : '#1d4ed8',
                border: isSuperAdmin ? '1px solid #fcd34d' : '1px solid #93c5fd',
                cursor: 'pointer',
                boxShadow: isSuperAdmin
                  ? '0 1px 3px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.6)'
                  : '0 1px 3px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.6)',
                transition: 'all 0.15s', outline: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = isSuperAdmin ? '0 4px 12px rgba(245,158,11,0.25)' : '0 4px 12px rgba(59,130,246,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isSuperAdmin ? '0 1px 3px rgba(245,158,11,0.2)' : '0 1px 3px rgba(59,130,246,0.15)' }}
            >
              <span style={{ fontSize: '13px' }}>{isSuperAdmin ? '👑' : '🧑‍💼'}</span>
              <span>{isSuperAdmin ? 'Admin' : 'Recruiter'}</span>
              <span style={{
                background: isSuperAdmin ? '#f59e0b' : '#3b82f6',
                color: '#fff', borderRadius: '5px',
                padding: '2px 6px', fontSize: '9px', fontWeight: '800',
                letterSpacing: '0.06em', lineHeight: 1.4,
              }}>{isSuperAdmin ? 'ADMIN' : 'RECRUITER'}</span>
            </button>

            {/* Layout Toggle — icon only with tooltip */}
            <button
              id="layout-toggle-btn"
              onClick={toggleNavLayout}
              title={navLayout === 'topbar' ? 'Switch to Sidebar layout' : 'Switch to Top Bar layout'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '34px', height: '34px', borderRadius: '8px',
                background: '#f8fafc', color: '#6b7280',
                border: '1px solid #e5e7eb', cursor: 'pointer',
                transition: 'all 0.15s', flexShrink: 0, outline: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#6b7280' }}
            >
              {navLayout === 'topbar' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="18" rx="1.5"/><rect x="14" y="3" width="7" height="18" rx="1.5"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="7" rx="1.5"/><rect x="3" y="14" width="18" height="7" rx="1.5"/>
                </svg>
              )}
            </button>
          </div>
        </div>


        {/* TOPBAR TABS (when topbar mode) */}
        {navLayout === 'topbar' && (
          <div style={{
            background: '#fff', borderBottom: '1px solid #eaecf0',
            padding: '0 24px', display: 'flex', alignItems: 'center', gap: '2px',
            overflowX: 'auto', scrollbarWidth: 'none',
          }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => { if (tab.isLink) navigate(tab.isLink); else setActiveTab(tab.id) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '14px 16px', border: 'none', background: 'transparent',
                    color: isActive ? '#6366f1' : '#6b7280',
                    fontWeight: isActive ? '700' : '500',
                    fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap',
                    borderBottom: isActive ? '2.5px solid #6366f1' : '2.5px solid transparent',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#374151' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#6b7280' }}
                >
                  <span style={{ fontSize: '15px' }}>{tab.icon}</span>
                  <span>{tab.label.replace(/^[^\s]+\s/, '')}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* MAIN BODY: Sidebar + Content */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

          {/* SIDEBAR (when sidebar mode) */}
          {navLayout === 'sidebar' && (
            <div style={{
              width: '220px', minWidth: '220px', flexShrink: 0,
              background: '#ffffff', borderRight: '1px solid #eaecf0',
              padding: '12px 10px', display: 'flex', flexDirection: 'column',
              position: 'sticky', top: '124px',
              height: 'calc(100vh - 124px)', overflowY: 'auto',
            }}>
              {/* Role badge in sidebar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 12px', borderRadius: '10px', marginBottom: '12px',
                background: isSuperAdmin ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                border: isSuperAdmin ? '1px solid #fde68a' : '1px solid #bfdbfe',
              }}>
                <span style={{ fontSize: '16px' }}>{isSuperAdmin ? '👑' : '💼'}</span>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: isSuperAdmin ? '#92400e' : '#1e40af' }}>
                    {isSuperAdmin ? 'Super Admin' : 'Recruiter Workspace'}
                  </div>
                  <div style={{ fontSize: '10px', color: isSuperAdmin ? '#b45309' : '#2563eb', fontWeight: '500' }}>
                    {isSuperAdmin ? 'Full access' : 'Recruiter view'}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 10px', marginBottom: '6px' }}>Navigation</div>

              {TABS.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => { if (tab.isLink) navigate(tab.isLink); else setActiveTab(tab.id) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 12px', borderRadius: '9px', border: 'none', width: '100%', textAlign: 'left',
                      background: isActive ? 'linear-gradient(135deg, #eef2ff, #e0e7ff)' : 'transparent',
                      color: isActive ? '#4f46e5' : '#6b7280',
                      fontWeight: isActive ? '700' : '500', fontSize: '13px',
                      cursor: 'pointer', transition: 'all 0.15s',
                      fontFamily: 'inherit',
                      boxShadow: isActive ? 'inset 3px 0 0 #6366f1' : 'none',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f9fafb' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{tab.icon}</span>
                    <span>{tab.label.replace(/^[^\s]+\s/, '')}</span>
                    {isActive && <span style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />}
                  </button>
                )
              })}

              {/* Sidebar Bottom Stats */}
              <div style={{ marginTop: 'auto', padding: '14px 10px 8px', borderTop: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Quick Stats</div>
                {[
                  { label: 'Active Jobs', value: activeJobs, color: '#6366f1' },
                  { label: 'Candidates', value: safeCandidates.length, color: '#6366f1' },
                  { label: 'Qualified', value: qualified, color: '#10b981' },
                  { label: 'RTR Pending', value: pendingRtr, color: '#f59e0b' },
                ].map(stat => (
                  <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #f9fafb' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{stat.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: stat.color }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── MAIN CONTENT AREA ─────────────────────────────── */}
          <div style={{ flex: 1, padding: '28px 32px', overflowX: 'hidden', minWidth: 0 }}>

            {activeTab === 'dashboard' && (
              <DashboardModule
                totalCandidates={safeCandidates.length}
                liveCount={liveCandidates.length}
                activeJobs={activeJobs}
                qualified={qualified}
                newCandidates={newCandidates}
                pendingRtr={pendingRtr}
                allCandidates={safeCandidates}
                liveCandidates={liveCandidates}
                jobsList={safeJobs}
                apiOnline={apiOnline}
                submissions={submissions}
              />
            )}

            {activeTab === 'jobs' && (
              <JobsModule
                jobsList={safeJobs}
                allCandidates={safeCandidates}
                submissions={submissions}
                rawJdText={rawJdText}
                setRawJdText={setRawJdText}
                parsingJd={parsingJd}
                handleParseJd={handleParseJd}
                isScraping={isScraping}
                handleScrapeNow={handleScrapeNow}
                publishingJobId={publishingJobId}
                handlePostJobToLinkedIn={handlePostJobToLinkedIn}
                handleDeleteJob={handleDeleteJob}
                handleOpenJobPreview={handleOpenJobPreview}
                fetchJobs={fetchJobs}
                isSuperAdmin={isSuperAdmin}
                recruiterInfo={{
                  id: recruiterUserId,
                  name: currentUser?.name || currentUser?.displayName || 'Recruiter',
                  email: recruiterUserEmail,
                  refCode: currentUser?.refCode || (currentUser?.name
                    ? currentUser.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + (recruiterUserId || '').slice(-3)
                    : 'recruiter'),
                }}
              />
            )}


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

            {activeTab === 'pipeline' && (
              <PipelineModule
                allCandidates={safeCandidates}
                jobsList={safeJobs}
                updateStatus={updateStatus}
              />
            )}

            {activeTab === 'screening' && (
              <ScreeningModule
                jobsList={safeJobs}
                allCandidates={safeCandidates}
              />
            )}

            {activeTab === 'submissions' && (
              <SubmissionModule
                allCandidates={safeCandidates}
                jobsList={safeJobs}
                submissions={submissions}
                setSubmissions={setSubmissions}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsModule
                allCandidates={safeCandidates}
                jobsList={safeJobs}
                submissions={submissions}
              />
            )}

            {activeTab === 'automation' && (
              <AutomationModule
                apiOnline={apiOnline}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsModule />
            )}

            {activeTab === 'users' && (
              <UsersModule
                allCandidates={safeCandidates}
                permissions={permissions}
                setPermissions={setPermissions}
              />
            )}

          </div>
        </div>
      </div>

      {/* CANDIDATE INBOX SELECTOR MODAL */}
      {showCandidatePicker && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.55)', backdropFilter: 'blur(6px)',
          zIndex: 2900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}
          onClick={() => setShowCandidatePicker(false)}>
          <div style={{
            background: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: 520,
            maxHeight: '80vh', overflowY: 'auto', padding: 28,
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)', border: '1px solid #e5e7eb'
          }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'inherit', color: '#111827', fontWeight: 800 }}>
                  💬 Candidate Messages
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>Select a candidate to open real-time chat</p>
              </div>
              <button onClick={() => setShowCandidatePicker(false)} style={{
                background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#6b7280', borderRadius: 8,
                padding: '6px 11px', cursor: 'pointer', fontSize: 13, fontWeight: 700
              }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {safeCandidates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}>No candidates found yet.</div>
              ) : (
                safeCandidates.map(c => {
                  const name = c.extracted_profile?.name || c.name || c.candidateName || 'Candidate'
                  const role = c.job_title || c.jobTitle || 'Applicant'
                  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  const avatarColors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b']
                  const avatarBg = avatarColors[name.charCodeAt(0) % avatarColors.length]
                  return (
                    <div
                      key={c.id}
                      onClick={() => { setActiveChatCandidate(c); setShowCandidatePicker(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', borderRadius: 12,
                        background: '#f9fafb', border: '1px solid #f3f4f6',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#f3f4f6' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%', background: avatarBg,
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 14, flexShrink: 0,
                        }}>{initials}</div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{name}</div>
                          <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{role} · <span style={{ color: '#6366f1' }}>{c.status || 'New'}</span></div>
                        </div>
                      </div>
                      <span style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
                        borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700,
                      }}>Chat →</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING CANDIDATE MESSENGER WIDGET */}
      {activeChatCandidate && (
        <CandidateMessengerWidget
          candidate={activeChatCandidate}
          onClose={() => setActiveChatCandidate(null)}
          onScheduleInterview={(c) => {
            updateCandidateStatus(c.id, 'Interview Scheduled')
            alert(`🗓️ Interview invite sent to ${c.extracted_profile?.name || c.name || 'Candidate'}! Candidate status updated to 'Interview Scheduled'.`)
          }}
        />
      )}
    </SiteLayout>
  )
}

