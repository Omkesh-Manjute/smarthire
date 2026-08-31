import React, { useState, useEffect, useCallback } from 'react'
import SiteLayout from '../components/SiteLayout'
import CandidateMessengerWidget from '../components/CandidateMessengerWidget'
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
import { getAllCandidates } from '../lib/atsFirestore'

const API_BASE = ''

const STATUSES = [
  'New', 'Reviewed', 'Shortlisted', 'RTR Requested', 'RTR Received',
  'Interview Scheduled', 'Selected', 'Rejected', 'Placed',
]

const ALL_TABS = [
  { id: 'candidates',  label: '👤 Candidates',    icon: '👤' },
  { id: 'pipeline',    label: '📈 Pipeline',      icon: '📈', adminOnly: true },
  { id: 'screening',   label: '🔍 Screening',     icon: '🔍' },
  { id: 'submissions', label: '📤 Submissions',   icon: '📤', adminOnly: true },
  { id: 'reports',     label: '📑 Reports',       icon: '📑', adminOnly: true },
  { id: 'audit',       label: '📜 Audit Logs',    icon: '📜' },
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

  const defaultRole = (currentUser && currentUser.role) ? currentUser.role : 'recruiter'
  const realUserRole = currentUser?.role || 'recruiter'
  const isEmployee = realUserRole === 'employee'
  const isManager = realUserRole === 'manager'
  const isSuperAdmin = (realUserRole === 'superadmin' || realUserRole === 'admin') && !isEmployee && !isManager
  const canSwitchRoles = isSuperAdmin
  const activeRole = canSwitchRoles ? (localStorage.getItem('smarthire_active_role') || 'superadmin') : defaultRole
  const roleKey = isSuperAdmin ? 'superadmin' : isManager ? 'manager' : isEmployee ? 'employee' : 'recruiter'

  const DEFAULT_PERMISSIONS = {
    superadmin: {
      ats: true,
      candidates: true,
      pipeline: true,
      screening: true,
      submissions: true,
      reports: true,
      audit: true,
      automation: true,
      inbox: true,
      settings: true,
      users: true,
    },
    manager: {
      ats: true,
      candidates: true,
      pipeline: true,
      screening: true,
      submissions: true,
      reports: true,
      audit: true,
      automation: false,
      inbox: true,
      settings: false,
      users: false,
    },
    recruiter: {
      ats: true,
      candidates: true,
      pipeline: false,
      screening: true,
      submissions: false,
      reports: false,
      audit: true,
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

  // Listen for permission updates
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

  // Strict employee workspace isolation & ATS permission check
  useEffect(() => {
    if (isEmployee) {
      window.location.href = '/dashboard'
    } else if (!isSuperAdmin && permissions && permissions[roleKey] && permissions[roleKey].ats === false) {
      window.location.href = '/dashboard'
    }
  }, [isEmployee, isSuperAdmin, roleKey, permissions])

  const TABS = ALL_TABS.filter(tab => {
    if (isSuperAdmin) return true
    if (tab.id === 'users' || tab.id === 'settings') return false
    if (permissions && permissions[roleKey]) {
      return permissions[roleKey][tab.id] !== false
    }
    if (isManager) {
      return ['candidates', 'pipeline', 'screening', 'submissions', 'reports', 'audit', 'inbox'].includes(tab.id)
    }
    return ['candidates', 'screening', 'audit', 'inbox'].includes(tab.id)
  })

  const getTabFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab === 'jobs' || tab === 'dashboard') return 'candidates'
      return tab
    } catch (e) {
      return null
    }
  }

  const navigate = useNavigate()
  const location = useLocation()

  const [activeTab, setActiveTab] = useState(() => {
    const urlTab = getTabFromUrl()
    if (urlTab && urlTab !== 'dashboard' && urlTab !== 'jobs') return urlTab
    return 'candidates'
  })

  // Listen for navigation tab switch events from top navbar
  useEffect(() => {
    const handleTabSwitch = (e) => {
      if (e.detail?.tab) {
        const nextTab = (e.detail.tab === 'jobs' || e.detail.tab === 'dashboard') ? 'candidates' : e.detail.tab
        setActiveTab(nextTab)
      }
    }
    const handlePopState = () => {
      const tab = getTabFromUrl()
      if (tab) setActiveTab(tab)
    }
    window.addEventListener('smarthire_switch_tab', handleTabSwitch)
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('smarthire_switch_tab', handleTabSwitch)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Sync tab with URL search parameter if changed
  useEffect(() => {
    const urlTab = getTabFromUrl()
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab)
    }
  }, [location?.search])
  
  // Layout mode state: 'topbar' or 'sidebar' (saved in localStorage, default topbar)
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
        setJobsList(list)
      } else {
        setJobsList([])
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
      setJobsList([])
    }
  }, [])

  // Fetch candidates safely with Firestore direct link + API + local cache
  const fetchCandidates = useCallback(async () => {
    try {
      let combined = []

      // 1. Fetch from Firestore (Direct client, 0 server sleep issues)
      try {
        const firestoreList = await getAllCandidates()
        if (Array.isArray(firestoreList) && firestoreList.length > 0) {
          combined = firestoreList
        }
      } catch (fErr) {
        console.warn('Firestore getAllCandidates note:', fErr)
      }

      // 2. Fetch from Backend
      try {
        const res = await fetch(`${API_BASE}/api/candidates`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
          }
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

      // 3. Merge with localStorage cache
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

  const recruiterUserEmail = (currentUser?.email || '').toLowerCase().trim()
  const recruiterUserName = (currentUser?.name || '').toLowerCase().trim()
  const recruiterUserId = String(currentUser?.id || currentUser?._id || '').toLowerCase().trim()
  const recruiterRef = (currentUser?.refCode || '').toLowerCase().trim()

  // Load team users to find subordinates
  const teamUsersList = (() => {
    try {
      const raw = localStorage.getItem('smarthire_recruiters')
      if (raw) return JSON.parse(raw) || []
    } catch(e) {}
    return []
  })()

  const safeCandidates = (isSuperAdmin || realUserRole === 'admin' || isManager)
    ? rawCandidates
    : rawCandidates.filter(c => {
        if (!c) return false
        const cOwner = (c.createdBy || c.recruiterEmail || c.submittedBy || c.recruiterId || '').toLowerCase().trim()
        const cRecruiter = (c.recruiter || c.assignedBy || c.addedByName || c.referredByRecruiterName || '').toLowerCase().trim()
        const cRef = (c.recruiterRefCode || c.recruiterRef || '').toLowerCase().trim()
        const cParent = (c.parentRecruiterName || '').toLowerCase().trim()
        const cParentEmail = (c.parentRecruiterEmail || '').toLowerCase().trim()
        const cParentId = String(c.parentRecruiterId || '').toLowerCase().trim()
        const firstName = (recruiterUserName.split(' ')[0] || '').toLowerCase().trim()

        if (isEmployee) {
          return cOwner === recruiterUserEmail ||
                 cOwner === recruiterUserId ||
                 cRecruiter === recruiterUserName ||
                 (recruiterUserName.length >= 3 && (cRecruiter.includes(recruiterUserName) || recruiterUserName.includes(cRecruiter))) ||
                 (recruiterRef && cRef.includes(recruiterRef)) ||
                 (recruiterUserEmail && cOwner.includes(recruiterUserEmail))
        }

        // For Lead Recruiter: include own candidates + all candidates from subordinate employees!
        const mySubordinates = teamUsersList.filter(u => {
          if (!u) return false
          const pName = (u.parentRecruiterName || '').toLowerCase().trim()
          const pId = String(u.parentRecruiterId || '').toLowerCase().trim()
          const pEmail = (u.parentRecruiterEmail || '').toLowerCase().trim()
          return (pName && (pName === recruiterUserName || pName.includes(recruiterUserName) || recruiterUserName.includes(pName) || (firstName.length >= 3 && pName.includes(firstName)))) ||
                 (pId && (pId === recruiterUserId || recruiterUserId.includes(pId))) ||
                 (pEmail && pEmail === recruiterUserEmail)
        })

        const subNames = mySubordinates.map(u => (u.name || '').toLowerCase().trim()).filter(Boolean)
        const subEmails = mySubordinates.map(u => (u.email || '').toLowerCase().trim()).filter(Boolean)
        const subRefs = mySubordinates.map(u => (u.refCode || '').toLowerCase().trim()).filter(Boolean)
        const subIds = mySubordinates.map(u => String(u.id || u._id || '').toLowerCase().trim()).filter(Boolean)

        const isMine = cOwner === recruiterUserEmail ||
                       cOwner === recruiterUserId ||
                       cRecruiter === recruiterUserName ||
                       (recruiterUserName.length >= 3 && (cRecruiter.includes(recruiterUserName) || recruiterUserName.includes(cRecruiter))) ||
                       (recruiterRef && cRef.includes(recruiterRef)) ||
                       (firstName.length >= 3 && cRecruiter.includes(firstName))

        const isMyParentChild = (cParent && (cParent === recruiterUserName || cParent.includes(recruiterUserName) || recruiterUserName.includes(cParent) || (firstName.length >= 3 && cParent.includes(firstName)))) ||
                                (cParentEmail && cParentEmail === recruiterUserEmail) ||
                                (cParentId && cParentId === recruiterUserId)

        const isSubCandidate = subNames.some(sn => sn && (cRecruiter === sn || cRecruiter.includes(sn) || sn.includes(cRecruiter))) ||
                               subEmails.some(se => se && (cOwner.includes(se) || cRecruiter.includes(se))) ||
                               subRefs.some(sr => sr && cRef.includes(sr)) ||
                               subIds.some(sid => sid && cOwner === sid)

        return isMine || isMyParentChild || isSubCandidate
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
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
          }
        })
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

        {/* ─── ATS WORKSPACE SUB-HEADER BAR ─────────────────────────────────────── */}
        <div style={{
          position: 'sticky', top: '60px', zIndex: 90,
          background: '#ffffff',
          borderBottom: '1px solid #eaecf0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '52px', minHeight: '52px',
        }}>

          {/* LEFT: Workspace Scope & Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '16px' }}>💼</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>ATS Workspace</span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  background: 'rgba(99,102,241,0.08)',
                  color: '#6366f1',
                  padding: '2px 7px',
                  borderRadius: '5px',
                  border: '1px solid rgba(99,102,241,0.2)'
                }}>
                  {isSuperAdmin ? 'SUPER ADMIN' : 'RECRUITER'}
                </span>
              </div>
            </div>
          </div>

          {/* CENTER: Quick Stats Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '5px 16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#4f46e5' }}>{activeJobs}</span>
                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Jobs</span>
              </div>
              <div style={{ width: '1px', height: '18px', background: '#e2e8f0' }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#4f46e5' }}>{safeCandidates.length}</span>
                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Candidates</span>
              </div>
              <div style={{ width: '1px', height: '18px', background: '#e2e8f0' }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#10b981' }}>{qualified}</span>
                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Qualified</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Quick Action Utilities */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Candidate Messages trigger */}
            <button
              id="candidate-messages-btn"
              onClick={() => setShowCandidatePicker(true)}
              title="Candidate Messages & Real-time Chat"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: '600',
                background: '#f8fafc', color: '#334155',
                border: '1px solid #e2e8f0', cursor: 'pointer',
                transition: 'all 0.15s', outline: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.borderColor = '#bfdbfe' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.borderColor = '#e2e8f0' }}
            >
              <span>💬</span>
              <span>Candidate Chat</span>
            </button>

            {/* Layout Toggle (Topbar / Sidebar) */}
            <button
              id="layout-toggle-btn"
              onClick={toggleNavLayout}
              title={navLayout === 'topbar' ? 'Switch to Sidebar layout' : 'Switch to Top Bar layout'}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 10px', borderRadius: '7px', fontSize: '11.5px', fontWeight: '600',
                background: '#f8fafc', color: '#64748b',
                border: '1px solid #e2e8f0', cursor: 'pointer',
                transition: 'all 0.15s', flexShrink: 0, outline: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#1e293b' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b' }}
            >
              {navLayout === 'topbar' ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="18" rx="1.5"/><rect x="14" y="3" width="7" height="18" rx="1.5"/>
                  </svg>
                  <span>Sidebar</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="7" rx="1.5"/><rect x="3" y="14" width="18" height="7" rx="1.5"/>
                  </svg>
                  <span>Tabs</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* TOPBAR TABS (when topbar mode) */}
        {navLayout === 'topbar' && (
          <div style={{
            position: 'sticky', top: '112px', zIndex: 85,
            background: '#ffffff', borderBottom: '1px solid #eaecf0',
            padding: '0 24px', display: 'flex', alignItems: 'center', gap: '4px',
            overflowX: 'auto', scrollbarWidth: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => { if (tab.isLink) navigate(tab.isLink); else setActiveTab(tab.id) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '11px 14px', border: 'none', background: 'transparent',
                    color: isActive ? '#4f46e5' : '#64748b',
                    fontWeight: isActive ? '700' : '600',
                    fontSize: '12.5px', cursor: 'pointer', whiteSpace: 'nowrap',
                    borderBottom: isActive ? '2.5px solid #4f46e5' : '2.5px solid transparent',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#1e293b' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#64748b' }}
                >
                  <span style={{ fontSize: '14px' }}>{tab.icon}</span>
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
              position: 'sticky', top: '112px',
              height: 'calc(100vh - 112px)', overflowY: 'auto',
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

            {(activeTab === 'candidates' || activeTab === 'jobs' || activeTab === 'dashboard' || !['pipeline', 'screening', 'submissions', 'reports', 'audit', 'automation', 'settings', 'users'].includes(activeTab)) && (
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

            {activeTab === 'audit' && (
              <AuditActivityLogModule />
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
                allCandidates={rawCandidates}
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
          role="recruiter"
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

