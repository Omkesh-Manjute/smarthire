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

  const TABS = isSuperAdmin ? ALL_TABS : ALL_TABS.filter(t => !t.adminOnly)

  const [activeTab, setActiveTab] = useState(() => isSuperAdmin ? 'dashboard' : 'jobs')
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

  const handlePostJobToLinkedIn = async (jobId) => {
    setPublishingJobId(jobId)
    try {
      await fetch(`${API_BASE}/api/jobs/${jobId}/post-linkedin`, { method: 'POST' })
      await fetchJobs()
    } catch (err) {
      console.error('LinkedIn post failed:', err)
    }
    setPublishingJobId(null)
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
      <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
        
        {/* Header Bar */}
        <div style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          position: 'sticky',
          top: '64px',
          zIndex: 40,
        }}>
          {/* Title Row */}
          <div style={{
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: navLayout === 'topbar' ? '1px solid #f1f5f9' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffffff', fontSize: '18px', fontWeight: '800',
              }}>⚡</div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '17px', color: '#0f172a', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  SmartHire ATS
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>AI Recruiter & Talent Automation Platform</div>
              </div>

              {/* HIGH VISIBILITY PROMINENT LAYOUT TOGGLE BUTTON NEAR TITLE */}
              <button
                onClick={toggleNavLayout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
                  cursor: 'pointer',
                  marginLeft: '8px',
                  transition: 'transform 0.1s ease',
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span>{navLayout === 'topbar' ? '🗂️ Switch to Side Panel View' : '📌 Switch to Top Bar View'}</span>
              </button>

              {/* INDEED-STYLE CANDIDATE MESSENGER QUICK BUTTON */}
              <button
                onClick={() => setShowCandidatePicker(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '800',
                  background: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                💬 Candidate Messages
              </button>
            </div>

            {/* Quick Stats Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', background: '#f1f5f9', padding: '5px 14px', borderRadius: '8px', fontSize: '12px' }}>
                <span>💼 <strong style={{ color: '#2563eb' }}>{activeJobs}</strong> Jobs</span>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <span>👤 <strong style={{ color: '#2563eb' }}>{safeCandidates.length}</strong> Candidates</span>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <span>⭐ <strong style={{ color: '#16a34a' }}>{qualified}</strong> Qualified</span>
              </div>
              <div style={{
                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                background: apiOnline ? '#dcfce7' : '#fee2e2',
                color: apiOnline ? '#15803d' : '#b91c1c',
                border: `1px solid ${apiOnline ? '#bbf7d0' : '#fca5a5'}`,
              }}>
                {apiOnline ? '🟢 API Online' : '🔴 API Offline'}
              </div>
            </div>
          </div>

          {/* TOPBAR NAVIGATION TABS (Shown when navLayout === 'topbar') */}
          {navLayout === 'topbar' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0 20px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { if (tab.isLink) navigate(tab.isLink); else setActiveTab(tab.id) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'transparent',
                    color: activeTab === tab.id ? '#2563eb' : '#64748b',
                    fontWeight: activeTab === tab.id ? '700' : '500',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                    borderBottom: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                  onMouseEnter={e => {
                    if (activeTab !== tab.id) e.currentTarget.style.color = '#0f172a'
                  }}
                  onMouseLeave={e => {
                    if (activeTab !== tab.id) e.currentTarget.style.color = '#64748b'
                  }}
                >
                  <span style={{ fontSize: '15px' }}>{tab.icon}</span>
                  {tab.label.replace(/^[^\s]+\s/, '')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CONTAINER LAYOUT: SIDEBAR MODE vs TOPBAR MODE */}
        <div style={{
          display: 'flex',
          minHeight: navLayout === 'sidebar' ? 'calc(100vh - 120px)' : 'auto'
        }}>
          
          {/* SIDEBAR NAVIGATION PANEL (Shown when navLayout === 'sidebar') */}
          {navLayout === 'sidebar' && (
            <div style={{
              width: '220px',
              minWidth: '220px',
              background: '#ffffff',
              borderRight: '1px solid #e2e8f0',
              padding: '16px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: '1px 0 3px rgba(0,0,0,0.03)',
            }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { if (tab.isLink) navigate(tab.isLink); else setActiveTab(tab.id) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === tab.id ? '#eff6ff' : 'transparent',
                    color: activeTab === tab.id ? '#2563eb' : '#64748b',
                    fontWeight: activeTab === tab.id ? '700' : '500',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    borderLeft: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                  onMouseEnter={e => {
                    if (activeTab !== tab.id) e.currentTarget.style.background = '#f8fafc'
                  }}
                  onMouseLeave={e => {
                    if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                  {tab.label.replace(/^[^\s]+\s/, '')}
                </button>
              ))}

              {/* Sidebar bottom stats */}
              <div style={{ marginTop: 'auto', padding: '14px 10px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: '700', letterSpacing: '0.05em' }}>PLATFORM STATS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Jobs</span>
                    <span style={{ color: '#2563eb', fontWeight: '700' }}>{activeJobs}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Candidates</span>
                    <span style={{ color: '#2563eb', fontWeight: '700' }}>{safeCandidates.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Qualified</span>
                    <span style={{ color: '#16a34a', fontWeight: '700' }}>{qualified}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div style={{ flex: 1, padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

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

          </div>
        </div>
      </div>

      {/* CANDIDATE INBOX SELECTOR MODAL */}
      {showCandidatePicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 2900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowCandidatePicker(false)}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '80vh', overflowY: 'auto', padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontFamily: 'Plus Jakarta Sans', color: '#0f172a', fontWeight: 800 }}>
                  💬 Candidate Messages Inbox
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Select a candidate to open real-time chat & interview invite</p>
              </div>
              <button onClick={() => setShowCandidatePicker(false)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {safeCandidates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: 13 }}>No candidate applications found yet.</div>
              ) : (
                safeCandidates.map(c => {
                  const name = c.extracted_profile?.name || c.name || c.candidateName || 'Candidate'
                  const role = c.job_title || c.jobTitle || 'Applicant'
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setActiveChatCandidate(c)
                        setShowCandidatePicker(false)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{role} · {c.status || 'New'}</div>
                        </div>
                      </div>
                      <span style={{ background: '#2563eb', color: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>
                        💬 Chat
                      </span>
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
