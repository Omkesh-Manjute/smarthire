import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import InfinityLoader from '../components/InfinityLoader'

export default function ClientScreeningPortal() {
  const navigate = useNavigate()

  // User state
  const [currentUser, setCurrentUser] = useState(null)
  const [clientProfile, setClientProfile] = useState(null)
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Invite Modal States
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [candidateName, setCandidateName] = useState('')
  const [candidateEmail, setCandidateEmail] = useState('')
  const [sendInviteEmail, setSendInviteEmail] = useState(true)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [createdSessionResult, setCreatedSessionResult] = useState(null)
  const [questions, setQuestions] = useState([
    {
      id: 'q1',
      text: 'Give a 60-90 second introduction of your background, core technical skills, and recent projects.',
      description: 'Highlight primary technologies, frameworks, and business achievements.',
      allowedFormats: ['video', 'audio', 'text'],
      maxDuration: 120
    },
    {
      id: 'q2',
      text: 'Describe a challenging technical problem you solved recently and your direct contribution.',
      description: 'Explain the problem architecture, your approach, and the final impact.',
      allowedFormats: ['video', 'audio', 'text'],
      maxDuration: 120
    },
    {
      id: 'q3',
      text: 'What is your current work authorization status, notice period/availability, and target compensation?',
      description: 'Confirm current location, remote/relocation preference, and authorization.',
      allowedFormats: ['video', 'audio', 'text'],
      maxDuration: 90
    }
  ])

  // Email Config Modal States
  const [showEmailConfigModal, setShowEmailConfigModal] = useState(false)
  const [senderName, setSenderName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState(465)
  const [security, setSecurity] = useState('SSL')
  const [appPassword, setAppPassword] = useState('')
  const [signature, setSignature] = useState('')
  const [isSavingEmailConfig, setIsSavingEmailConfig] = useState(false)
  const [emailConfigFeedback, setEmailConfigFeedback] = useState('')

  // Candidate Review Modal States
  const [reviewSession, setReviewSession] = useState(null)
  const [activeQuestionTab, setActiveQuestionTab] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedSessionId, setCopiedSessionId] = useState(null)

  // Initialize and load user
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user')
      if (userStr) {
        const u = JSON.parse(userStr)
        setCurrentUser(u)
      } else {
        // Fallback demo client user
        setCurrentUser({ email: 'client@partner.com', name: 'Partner Client', role: 'client', company: 'Client Enterprise' })
      }
    } catch (_) {
      setCurrentUser({ email: 'client@partner.com', name: 'Partner Client', role: 'client', company: 'Client Enterprise' })
    }
  }, [])

  const userEmail = currentUser?.email || 'client@partner.com'

  // Fetch client portal data (credits, profile, email config, sessions)
  const fetchPortalData = useCallback(async () => {
    if (!userEmail) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/client/portal-data?email=${encodeURIComponent(userEmail)}`, {
        headers: {
          'x-client-email': userEmail,
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        }
      })
      const data = await res.json()
      if (data.success) {
        setClientProfile(data.client)
        setSessions(data.sessions || [])
        if (data.client?.emailConfig) {
          setSenderName(data.client.emailConfig.senderName || '')
          setFromEmail(data.client.emailConfig.fromEmail || data.client.email || '')
          setSmtpHost(data.client.emailConfig.smtpHost || '')
          setSmtpPort(data.client.emailConfig.smtpPort || 465)
          setSecurity(data.client.emailConfig.security || 'SSL')
          setSignature(data.client.emailConfig.signature || '')
        }
      }
    } catch (err) {
      console.warn('Failed to load client portal data:', err.message)
    } finally {
      setIsLoading(false)
    }
  }, [userEmail])

  useEffect(() => {
    if (userEmail) {
      fetchPortalData()
    }
  }, [userEmail, fetchPortalData])

  // 1-Click Generate AI Questions from Job Description
  const handleGenerateAIQuestions = async () => {
    if (!jobTitle.trim()) {
      alert('Please enter a Job Position / Role title first.')
      return
    }
    if ((clientProfile?.aiCredits ?? 300) < 1) {
      alert('AI credits exhausted. Please contact Admin to refill your AI question generation credits.')
      return
    }

    setIsGeneratingQuestions(true)
    try {
      const res = await fetch('/api/client/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: userEmail,
          jobTitle: jobTitle.trim(),
          jobDescription: jobDescription.trim(),
          questionCount: 4
        })
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions)
        if (typeof data.remainingAiCredits === 'number') {
          setClientProfile(prev => ({
            ...prev,
            aiCredits: data.remainingAiCredits,
            usedAiCredits: data.usedAiCredits
          }))
        }
      } else {
        alert(data.message || 'Failed to auto-generate questions.')
      }
    } catch (err) {
      alert('Error generating questions: ' + err.message)
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  // Handle Create Screening Session
  const handleCreateScreening = async () => {
    if (!jobTitle.trim()) {
      alert('Please enter a target Job Position / Role.')
      return
    }
    if ((clientProfile?.screeningCredits ?? 50) < 1) {
      alert('Screening credits exhausted. Please contact Admin to refill your interview credits.')
      return
    }

    setIsCreatingSession(true)
    try {
      const res = await fetch('/api/client/screening/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: userEmail,
          jobTitle: jobTitle.trim(),
          candidateName: candidateName.trim(),
          candidateEmail: candidateEmail.trim(),
          questions,
          jobDescription: jobDescription.trim(),
          sendInviteEmail: Boolean(sendInviteEmail && candidateEmail.trim())
        })
      })
      const data = await res.json()
      if (data.success) {
        setCreatedSessionResult({
          sessionId: data.sessionId,
          screeningUrl: data.screeningUrl,
          jobTitle: jobTitle.trim(),
          candidateName: candidateName.trim(),
          candidateEmail: candidateEmail.trim(),
          inviteEmailSent: data.inviteEmailSent
        })
        if (typeof data.remainingScreeningCredits === 'number') {
          setClientProfile(prev => ({
            ...prev,
            screeningCredits: data.remainingScreeningCredits,
            usedScreeningCredits: data.usedScreeningCredits
          }))
        }
        fetchPortalData()
      } else {
        alert(data.message || 'Failed to create screening session.')
      }
    } catch (err) {
      alert('Error creating screening session: ' + err.message)
    } finally {
      setIsCreatingSession(false)
    }
  }

  // Handle Save Email Config
  const handleSaveEmailConfig = async (e) => {
    e.preventDefault()
    setIsSavingEmailConfig(true)
    setEmailConfigFeedback('')
    try {
      const res = await fetch('/api/client/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          senderName: senderName.trim(),
          fromEmail: fromEmail.trim(),
          smtpHost: smtpHost.trim(),
          smtpPort: parseInt(smtpPort) || 465,
          security,
          appPassword: appPassword.trim(),
          signature
        })
      })
      const data = await res.json()
      if (data.success) {
        setEmailConfigFeedback('Email settings saved successfully!')
        setTimeout(() => {
          setShowEmailConfigModal(false)
          setEmailConfigFeedback('')
        }, 1500)
        fetchPortalData()
      } else {
        setEmailConfigFeedback(data.message || 'Failed to save email settings.')
      }
    } catch (err) {
      setEmailConfigFeedback('Error: ' + err.message)
    } finally {
      setIsSavingEmailConfig(false)
    }
  }

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('smarthire_authenticated')
    localStorage.removeItem('verifyhire_authenticated')
    localStorage.removeItem('smarthire_user')
    localStorage.removeItem('smarthire_token')
    window.location.href = '/login'
  }

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const cand = (s.candidateName || '').toLowerCase()
      const email = (s.candidateEmail || '').toLowerCase()
      const role = (s.jobTitle || '').toLowerCase()
      const q = searchQuery.toLowerCase().trim()
      const matchQuery = !q || cand.includes(q) || email.includes(q) || role.includes(q)
      
      const sStatus = s.status || 'pending'
      const matchStatus = statusFilter === 'all' || sStatus === statusFilter
      return matchQuery && matchStatus
    })
  }, [sessions, searchQuery, statusFilter])

  // KPIs
  const totalScreened = sessions.length
  const completedCount = sessions.filter(s => s.status === 'submitted' || s.status === 'shortlisted' || (s.responses && s.responses.length > 0)).length
  const pendingCount = sessions.filter(s => s.status === 'pending').length
  const shortlistedCount = sessions.filter(s => s.status === 'shortlisted').length

  const hasSubmittedResponses = Boolean(
    reviewSession &&
    reviewSession.status !== 'pending' &&
    ((Array.isArray(reviewSession.responses) && reviewSession.responses.length > 0 && reviewSession.responses.some(r => r.transcript || r.response || r.mediaUrl)) || reviewSession.masterMediaUrl)
  )

  return (
    <div style={clientStyles.pageContainer}>
      {/* ─── CLIENT TOP NAVIGATION BAR ────────────────────────────────────── */}
      <header style={clientStyles.header}>
        <div style={clientStyles.headerInner}>
          <div style={clientStyles.headerLeft}>
            <div style={clientStyles.logoGlyph}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <div>
              <div style={clientStyles.brandTitle}>SmartHire AI Video Screening</div>
              <div style={clientStyles.brandSubtitle}>
                {clientProfile?.company || currentUser?.company || 'Enterprise Client Workspace'}
              </div>
            </div>
          </div>

          <div style={clientStyles.headerRight}>
            {/* Live Screening Credits Pill */}
            <div style={clientStyles.creditPill} title="Remaining candidate video screening sessions">
              <span style={clientStyles.creditLabel}>Screenings:</span>
              <span style={{ fontWeight: '800', color: (clientProfile?.screeningCredits ?? 50) < 5 ? '#dc2626' : '#059669' }}>
                {clientProfile?.screeningCredits ?? 50}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>Available</span>
            </div>

            {/* Live AI Question Generation Credits Pill */}
            <div style={clientStyles.creditPill} title="Remaining AI question generation runs">
              <span style={clientStyles.creditLabel}>AI Credits:</span>
              <span style={{ fontWeight: '800', color: '#2563eb' }}>
                {clientProfile?.aiCredits ?? 300}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>Available</span>
            </div>

            {/* Email Config Button */}
            <button
              type="button"
              onClick={() => setShowEmailConfigModal(true)}
              style={clientStyles.emailConfigBtn}
              title="Configure your company sender email and SMTP credentials"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Email Setup
            </button>

            {/* User Profile & Logout */}
            <div style={clientStyles.userBox}>
              <span style={clientStyles.userName}>{clientProfile?.name || currentUser?.name || 'Client'}</span>
              <button type="button" onClick={handleLogout} style={clientStyles.logoutBtn} title="Sign Out">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main style={clientStyles.mainArea}>
        {/* Top Action Row */}
        <div style={clientStyles.actionRow}>
          <div>
            <h1 style={clientStyles.pageTitle}>Candidate Video Screening</h1>
            <p style={clientStyles.pageSubtitle}>
              Invite candidates to complete asynchronous 1-way video interviews. Review recordings, AI speech-to-text transcripts, and evaluation scorecards on demand.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowInviteModal(true)
              setCreatedSessionResult(null)
              setJobTitle('')
              setJobDescription('')
              setCandidateName('')
              setCandidateEmail('')
            }}
            style={clientStyles.primaryInviteBtn}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Invite Candidate for Screening
          </button>
        </div>

        {/* KPI Summary Cards */}
        <div style={clientStyles.kpiGrid}>
          <div style={clientStyles.kpiCard}>
            <div style={clientStyles.kpiLabel}>Total Candidates Invited</div>
            <div style={clientStyles.kpiValue}>{totalScreened}</div>
          </div>
          <div style={clientStyles.kpiCard}>
            <div style={clientStyles.kpiLabel}>Completed Interviews</div>
            <div style={{ ...clientStyles.kpiValue, color: '#059669' }}>{completedCount}</div>
          </div>
          <div style={clientStyles.kpiCard}>
            <div style={clientStyles.kpiLabel}>Awaiting Submission</div>
            <div style={{ ...clientStyles.kpiValue, color: '#d97706' }}>{pendingCount}</div>
          </div>
          <div style={clientStyles.kpiCard}>
            <div style={clientStyles.kpiLabel}>Shortlisted Candidates</div>
            <div style={{ ...clientStyles.kpiValue, color: '#2563eb' }}>{shortlistedCount}</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div style={clientStyles.filterBar}>
          <div style={clientStyles.searchBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search by candidate name, email, or role..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={clientStyles.searchInput}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'submitted', 'pending', 'shortlisted'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                style={{
                  ...clientStyles.filterPill,
                  background: statusFilter === f ? '#0f172a' : '#ffffff',
                  color: statusFilter === f ? '#ffffff' : '#475569',
                  borderColor: statusFilter === f ? '#0f172a' : '#cbd5e1'
                }}
              >
                {f === 'all' ? 'All Candidates' : f === 'submitted' ? 'Completed' : f === 'pending' ? 'Pending' : 'Shortlisted'}
              </button>
            ))}
          </div>
        </div>

        {/* Authentic Excel-Style Candidates Grid (Rule 9) */}
        <div style={clientStyles.tableWrapper}>
          <table style={clientStyles.excelTable}>
            <thead>
              <tr>
                <th style={{ ...clientStyles.excelTh, width: '45px', textAlign: 'center' }}>#</th>
                <th style={clientStyles.excelTh}>Candidate Name & Email</th>
                <th style={clientStyles.excelTh}>Job Position / Role</th>
                <th style={clientStyles.excelTh}>Interview Date</th>
                <th style={{ ...clientStyles.excelTh, width: '130px', textAlign: 'center' }}>AI Match</th>
                <th style={{ ...clientStyles.excelTh, width: '110px', textAlign: 'center' }}>Status</th>
                <th style={{ ...clientStyles.excelTh, width: '150px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center' }}>
                    <InfinityLoader text="Loading video screening candidates..." showBrand={false} minHeight="120px" />
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No video screening sessions found. Click <strong>"Invite Candidate for Screening"</strong> above to send your first interview link.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session, idx) => {
                  const isSubmitted = session.status === 'submitted' || session.status === 'shortlisted' || (session.responses && session.responses.length > 0)
                  const candName = session.candidateName || 'Candidate'
                  const candEmail = session.candidateEmail || 'No email specified'
                  const role = session.jobTitle || 'Custom Role'
                  const dateStr = session.submittedAt 
                    ? new Date(session.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : (session.createdAt ? new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent')

                  return (
                    <tr
                      key={session.sessionId || session.id || idx}
                      onClick={() => {
                        setReviewSession(session)
                        setActiveQuestionTab(0)
                      }}
                      style={{
                        ...clientStyles.excelTr,
                        background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                    >
                      <td style={{ ...clientStyles.excelTd, textAlign: 'center', color: '#64748b', fontWeight: '600' }}>
                        {idx + 1}
                      </td>
                      <td style={clientStyles.excelTd}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{candName}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{candEmail}</div>
                      </td>
                      <td style={{ ...clientStyles.excelTd, fontWeight: '600', color: '#334155' }}>
                        {role}
                      </td>
                      <td style={{ ...clientStyles.excelTd, color: '#475569' }}>
                        {dateStr}
                      </td>
                      <td style={{ ...clientStyles.excelTd, textAlign: 'center' }}>
                        {isSubmitted && session.aiScore ? (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            fontWeight: '800',
                            background: session.aiScore >= 80 ? '#ecfdf5' : session.aiScore >= 70 ? '#eff6ff' : '#fffbeb',
                            color: session.aiScore >= 80 ? '#059669' : session.aiScore >= 70 ? '#2563eb' : '#d97706'
                          }}>
                            {session.aiScore}% Match
                          </span>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Awaiting</span>
                        )}
                      </td>
                      <td style={{ ...clientStyles.excelTd, textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: session.status === 'shortlisted' ? '#ecfdf5' : isSubmitted ? '#eff6ff' : '#f8fafc',
                          color: session.status === 'shortlisted' ? '#059669' : isSubmitted ? '#2563eb' : '#64748b',
                          border: '1px solid',
                          borderColor: session.status === 'shortlisted' ? '#a7f3d0' : isSubmitted ? '#bfdbfe' : '#e2e8f0'
                        }}>
                          {session.status === 'shortlisted' ? 'Shortlisted' : isSubmitted ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ ...clientStyles.excelTd, textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setReviewSession(session)
                              setActiveQuestionTab(0)
                            }}
                            style={clientStyles.tableActionBtn}
                          >
                            {isSubmitted ? 'View Interview' : 'Details'}
                          </button>
                          {!isSubmitted && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                const url = `${window.location.origin}/candidate-chat/${session.sessionId || session.id}`
                                navigator.clipboard.writeText(url)
                                setCopiedSessionId(session.sessionId || session.id)
                                setTimeout(() => setCopiedSessionId(null), 2500)
                              }}
                              style={{
                                ...clientStyles.tableActionBtn,
                                background: copiedSessionId === (session.sessionId || session.id) ? '#ecfdf5' : '#ffffff',
                                color: copiedSessionId === (session.sessionId || session.id) ? '#059669' : '#2563eb',
                                borderColor: copiedSessionId === (session.sessionId || session.id) ? '#a7f3d0' : '#cbd5e1'
                              }}
                              title="Copy candidate invite link"
                            >
                              {copiedSessionId === (session.sessionId || session.id) ? 'Copied' : 'Copy Link'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* ─── INVITE CANDIDATE MODAL ────────────────────────────────────────── */}
      {showInviteModal && (
        <div style={clientStyles.modalBackdrop} onClick={() => setShowInviteModal(false)}>
          <div style={clientStyles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={clientStyles.modalHeader}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Invite Candidate for Video Screening
                </h2>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0' }}>
                  Paste your Job Description or enter a role. AI will generate custom questions tailored to the position.
                </p>
              </div>
              <button type="button" onClick={() => setShowInviteModal(false)} style={clientStyles.closeBtn}>✕</button>
            </div>

            <div style={clientStyles.modalBody}>
              {!createdSessionResult ? (
                <div>
                  {/* Job Title */}
                  <div style={clientStyles.formGroup}>
                    <label style={clientStyles.label}>Job Position / Role Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Frontend Engineer (React / TypeScript)"
                      value={jobTitle}
                      onChange={e => setJobTitle(e.target.value)}
                      style={clientStyles.input}
                    />
                  </div>

                  {/* Paste Job Description */}
                  <div style={clientStyles.formGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={clientStyles.label}>Paste Job Description (JD) — Optional</label>
                      <button
                        type="button"
                        onClick={handleGenerateAIQuestions}
                        disabled={isGeneratingQuestions || !jobTitle.trim()}
                        style={clientStyles.generateAiBtn}
                      >
                        {isGeneratingQuestions ? 'Generating...' : '⚡ Generate AI Questions from JD (1 AI Credit)'}
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Paste key responsibilities, required technical skills, and qualifications here..."
                      value={jobDescription}
                      onChange={e => setJobDescription(e.target.value)}
                      style={clientStyles.textarea}
                    />
                  </div>

                  {/* Candidate Name & Email */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <label style={clientStyles.label}>Candidate Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah Jenkins"
                        value={candidateName}
                        onChange={e => setCandidateName(e.target.value)}
                        style={clientStyles.input}
                      />
                    </div>
                    <div>
                      <label style={clientStyles.label}>Candidate Email</label>
                      <input
                        type="email"
                        placeholder="e.g. sarah.jenkins@example.com"
                        value={candidateEmail}
                        onChange={e => setCandidateEmail(e.target.value)}
                        style={clientStyles.input}
                      />
                    </div>
                  </div>

                  {/* Questions Preview & Edit */}
                  <div style={clientStyles.formGroup}>
                    <label style={clientStyles.label}>Interview Questions ({questions.length})</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {questions.map((q, qIdx) => (
                        <div key={q.id || qIdx} style={clientStyles.questionItem}>
                          <div style={{ fontWeight: '700', fontSize: '12px', color: '#2563eb', marginBottom: '4px' }}>
                            Question {qIdx + 1}
                          </div>
                          <input
                            type="text"
                            value={q.text}
                            onChange={e => {
                              const val = e.target.value
                              setQuestions(prev => prev.map((item, idx) => idx === qIdx ? { ...item, text: val } : item))
                            }}
                            style={{ ...clientStyles.input, fontSize: '12.5px' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Send Email Checkbox */}
                  {candidateEmail.trim() && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                      <input
                        type="checkbox"
                        id="sendInviteCheckbox"
                        checked={sendInviteEmail}
                        onChange={e => setSendInviteEmail(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <label htmlFor="sendInviteCheckbox" style={{ fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
                        Automatically dispatch screening invitation email to candidate from my company email
                      </label>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" onClick={() => setShowInviteModal(false)} style={clientStyles.cancelBtn}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateScreening}
                      disabled={isCreatingSession || !jobTitle.trim()}
                      style={clientStyles.submitBtn}
                    >
                      {isCreatingSession ? 'Creating...' : 'Create & Send Screening Invite (1 Credit)'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Session Created Success View */
                <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    border: '1px solid #a7f3d0'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
                    Screening Session Created!
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>
                    {createdSessionResult.inviteEmailSent
                      ? `Invitation email successfully delivered to ${createdSessionResult.candidateEmail}.`
                      : 'Share the secure interview link below with the candidate:'}
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    marginBottom: '20px'
                  }}>
                    <input
                      type="text"
                      readOnly
                      value={createdSessionResult.screeningUrl}
                      style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '12.5px', color: '#334155' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdSessionResult.screeningUrl)
                        setCopiedLink(true)
                        setTimeout(() => setCopiedLink(false), 2500)
                      }}
                      style={{
                        padding: '6px 14px',
                        background: copiedLink ? '#059669' : '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedLink ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false)
                      setCreatedSessionResult(null)
                    }}
                    style={clientStyles.primaryInviteBtn}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── EMAIL SETTINGS MODAL ──────────────────────────────────────────── */}
      {showEmailConfigModal && (
        <div style={clientStyles.modalBackdrop} onClick={() => setShowEmailConfigModal(false)}>
          <div style={clientStyles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={clientStyles.modalHeader}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Company Sender Email Configuration
                </h2>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0' }}>
                  Candidate invitations will be dispatched directly from your company email address.
                </p>
              </div>
              <button type="button" onClick={() => setShowEmailConfigModal(false)} style={clientStyles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleSaveEmailConfig} style={clientStyles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={clientStyles.label}>Sender Display Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Talent Team"
                    value={senderName}
                    onChange={e => setSenderName(e.target.value)}
                    style={clientStyles.input}
                    required
                  />
                </div>
                <div>
                  <label style={clientStyles.label}>From Email Address *</label>
                  <input
                    type="email"
                    placeholder="e.g. careers@acmecorp.com"
                    value={fromEmail}
                    onChange={e => setFromEmail(e.target.value)}
                    style={clientStyles.input}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={clientStyles.label}>SMTP Host (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. smtp.gmail.com / smtp.office365.com"
                    value={smtpHost}
                    onChange={e => setSmtpHost(e.target.value)}
                    style={clientStyles.input}
                  />
                </div>
                <div>
                  <label style={clientStyles.label}>Port</label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={e => setSmtpPort(e.target.value)}
                    style={clientStyles.input}
                  />
                </div>
                <div>
                  <label style={clientStyles.label}>Security</label>
                  <select value={security} onChange={e => setSecurity(e.target.value)} style={clientStyles.input}>
                    <option value="SSL">SSL (465)</option>
                    <option value="TLS">TLS (587)</option>
                  </select>
                </div>
              </div>

              <div style={clientStyles.formGroup}>
                <label style={clientStyles.label}>App Password / SMTP Password</label>
                <input
                  type="password"
                  placeholder="App Password from your email provider"
                  value={appPassword}
                  onChange={e => setAppPassword(e.target.value)}
                  style={clientStyles.input}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Leave empty if you wish to send via SmartHire verified mail relay with your Reply-To address.
                </span>
              </div>

              <div style={clientStyles.formGroup}>
                <label style={clientStyles.label}>Email Signature</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Best regards,&#10;Acme Talent Acquisition&#10;www.acmecorp.com"
                  value={signature}
                  onChange={e => setSignature(e.target.value)}
                  style={clientStyles.textarea}
                />
              </div>

              {emailConfigFeedback && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '14px',
                  background: emailConfigFeedback.includes('success') ? '#ecfdf5' : '#fef2f2',
                  color: emailConfigFeedback.includes('success') ? '#059669' : '#dc2626'
                }}>
                  {emailConfigFeedback}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowEmailConfigModal(false)} style={clientStyles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={isSavingEmailConfig} style={clientStyles.submitBtn}>
                  {isSavingEmailConfig ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CANDIDATE INTERVIEW DETAIL REVIEW MODAL ───────────────────────── */}
      {reviewSession && (
        <div style={clientStyles.modalBackdrop} onClick={() => setReviewSession(null)}>
          <div style={{ ...clientStyles.modalCard, maxWidth: '1020px' }} onClick={e => e.stopPropagation()}>
            <div style={clientStyles.modalHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    {reviewSession.candidateName || 'Candidate'}
                  </h2>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                    background: reviewSession.status === 'shortlisted' ? '#ecfdf5' : hasSubmittedResponses ? '#eff6ff' : '#f8fafc',
                    color: reviewSession.status === 'shortlisted' ? '#059669' : hasSubmittedResponses ? '#2563eb' : '#64748b',
                    border: '1px solid',
                    borderColor: reviewSession.status === 'shortlisted' ? '#a7f3d0' : hasSubmittedResponses ? '#bfdbfe' : '#e2e8f0'
                  }}>
                    {reviewSession.status === 'shortlisted' ? 'Shortlisted' : hasSubmittedResponses ? 'Completed' : 'Pending Interview'}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                  Applied for <strong>{reviewSession.jobTitle}</strong> • {reviewSession.candidateEmail || 'No email'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {hasSubmittedResponses && (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={clientStyles.emailConfigBtn}
                  >
                    Print / PDF Report
                  </button>
                )}
                <button type="button" onClick={() => setReviewSession(null)} style={clientStyles.closeBtn}>✕</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: '460px' }}>
              {/* Left Column: Metadata & AI Match */}
              <div style={{ padding: '20px', borderRight: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Candidate Information
                </div>
                <div style={{ fontSize: '12.5px', color: '#334155', marginBottom: '6px' }}>
                  <strong>Email:</strong> {reviewSession.candidateEmail || 'N/A'}
                </div>
                <div style={{ fontSize: '12.5px', color: '#334155', marginBottom: '14px' }}>
                  <strong>Role:</strong> {reviewSession.jobTitle || 'N/A'}
                </div>

                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  AI Fit Assessment
                </div>

                {hasSubmittedResponses && reviewSession.aiScore ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '15px',
                        background: reviewSession.aiScore >= 80 ? '#ecfdf5' : '#eff6ff',
                        color: reviewSession.aiScore >= 80 ? '#059669' : '#2563eb',
                        border: '2px solid',
                        borderColor: reviewSession.aiScore >= 80 ? '#a7f3d0' : '#bfdbfe'
                      }}>
                        {reviewSession.aiScore}%
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                        {reviewSession.recommendation || 'Evaluated Match'}
                      </div>
                    </div>

                    {Array.isArray(reviewSession.aiSummary) && reviewSession.aiSummary.length > 0 ? (
                      <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                        {reviewSession.aiSummary.map((pt, pIdx) => (
                          <li key={pIdx} style={{ marginBottom: '6px' }}>{pt}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
                        {reviewSession.keyTakeaways || 'Candidate completed all screening answers.'}
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '16px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      Interview Pending
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
                      AI evaluation, match score, and spoken transcript will appear here automatically once the candidate submits their video answers.
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Video Playback or Invitation Control */}
              <div style={{ padding: '20px' }}>
                {hasSubmittedResponses && Array.isArray(reviewSession.responses) && reviewSession.responses.length > 0 ? (
                  <div>
                    {/* Question Tabs */}
                    <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '16px' }}>
                      {reviewSession.responses.map((r, rIdx) => (
                        <button
                          key={rIdx}
                          type="button"
                          onClick={() => setActiveQuestionTab(rIdx)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            background: activeQuestionTab === rIdx ? '#2563eb' : '#f1f5f9',
                            color: activeQuestionTab === rIdx ? '#ffffff' : '#475569'
                          }}
                        >
                          Q{rIdx + 1}
                        </button>
                      ))}
                    </div>

                    {/* Question Banner & Video */}
                    {reviewSession.responses[activeQuestionTab] && (
                      <div>
                        <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
                          {reviewSession.responses[activeQuestionTab].questionText || `Question ${activeQuestionTab + 1}`}
                        </div>

                        {reviewSession.responses[activeQuestionTab].mediaUrl ? (
                          <div style={{ marginBottom: '16px' }}>
                            <video
                              src={reviewSession.responses[activeQuestionTab].mediaUrl}
                              controls
                              playsInline
                              playbackRate={playbackSpeed}
                              style={{ width: '100%', maxHeight: '340px', borderRadius: '8px', background: '#000' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                                Cloud Retention: 7-Day Storage Active
                              </span>
                              <a
                                href={reviewSession.responses[activeQuestionTab].mediaUrl}
                                download={`Interview_${(reviewSession.candidateName || 'Candidate').replace(/\s+/g, '_')}_Q${activeQuestionTab + 1}.webm`}
                                style={{
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: '#2563eb',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                ↓ Download Video (.webm)
                              </a>
                            </div>
                          </div>
                        ) : null}

                        {/* Transcript */}
                        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                            Spoken Response Transcript (Groq Whisper AI)
                          </div>
                          <p style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                            {reviewSession.responses[activeQuestionTab].transcript || 'No transcript generated yet.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Pending Invitation Status Card */
                  <div style={{ padding: '30px 16px', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#f8fafc',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 14px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7"/>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                      </svg>
                    </div>

                    <h3 style={{ fontSize: '16.5px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
                      Candidate Video Interview Pending
                    </h3>
                    <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.5, margin: '0 0 20px' }}>
                      The candidate has been invited for this asynchronous screening session. Video recordings, AI transcripts, and the scorecard will activate automatically once submitted.
                    </p>

                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Candidate Interview Link
                      </div>
                      <div style={{ display: 'flex', gap: '8px', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/candidate-chat/${reviewSession.sessionId || reviewSession.id}`}
                          style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '11.5px', color: '#334155' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/candidate-chat/${reviewSession.sessionId || reviewSession.id}`
                            navigator.clipboard.writeText(url)
                            setCopiedLink(true)
                            setTimeout(() => setCopiedLink(false), 2500)
                          }}
                          style={{
                            padding: '4px 10px',
                            background: copiedLink ? '#059669' : '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          {copiedLink ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES (Strict Rule 8: Zero unrequested emojis, clean corporate B2B polish)
// ═══════════════════════════════════════════════════════════════════════════════
const clientStyles = {
  pageContainer: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: '#0f172a'
  },
  header: {
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 40
  },
  headerInner: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoGlyph: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: '#0f172a',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.01em'
  },
  brandSubtitle: {
    fontSize: '11.5px',
    color: '#64748b'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  creditPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 12px',
    borderRadius: '20px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    fontSize: '12px'
  },
  creditLabel: {
    color: '#64748b',
    fontWeight: '600'
  },
  emailConfigBtn: {
    padding: '6px 12px',
    background: '#ffffff',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  userBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: '6px',
    paddingLeft: '12px',
    borderLeft: '1px solid #e2e8f0'
  },
  userName: {
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#0f172a'
  },
  logoutBtn: {
    padding: '4px 8px',
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  mainArea: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '28px 24px'
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 4px',
    letterSpacing: '-0.02em'
  },
  pageSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
    maxWidth: '680px',
    lineHeight: 1.5
  },
  primaryInviteBtn: {
    padding: '10px 20px',
    background: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  kpiCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px 20px'
  },
  kpiLabel: {
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '6px'
  },
  kpiValue: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#0f172a'
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    gap: '12px'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '6px 12px',
    width: '380px'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '12.5px',
    color: '#0f172a',
    background: 'transparent',
    width: '100%'
  },
  filterPill: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  tableWrapper: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  excelTable: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  excelTh: {
    background: '#f1f5f9',
    color: '#334155',
    fontSize: '11.5px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    padding: '10px 14px',
    borderBottom: '1px solid #cbd5e1',
    borderRight: '1px solid #e2e8f0'
  },
  excelTr: {
    cursor: 'pointer',
    transition: 'background 0.1s ease'
  },
  excelTd: {
    padding: '10px 14px',
    fontSize: '12.5px',
    borderBottom: '1px solid #e2e8f0',
    borderRight: '1px solid #f1f5f9'
  },
  tableActionBtn: {
    padding: '4px 10px',
    background: '#ffffff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: '5px',
    fontSize: '11.5px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '20px'
  },
  modalCard: {
    background: '#ffffff',
    borderRadius: '12px',
    maxWidth: '680px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  modalHeader: {
    padding: '18px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '18px',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  modalBody: {
    padding: '20px 24px'
  },
  formGroup: {
    marginBottom: '14px'
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '4px'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    resize: 'vertical'
  },
  generateAiBtn: {
    padding: '4px 10px',
    background: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    borderRadius: '5px',
    fontSize: '11.5px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  questionItem: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '10px 12px'
  },
  cancelBtn: {
    padding: '8px 16px',
    background: '#ffffff',
    color: '#64748b',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '8px 18px',
    background: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer'
  }
}
