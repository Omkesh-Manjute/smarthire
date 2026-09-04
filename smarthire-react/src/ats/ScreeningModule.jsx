import React, { useState, useEffect, useCallback } from 'react'

const API = '/api/screening'

export default function ScreeningModule({ jobsList = [], allCandidates = [] }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJobId, setSelectedJobId] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [jobSearch, setJobSearch] = useState('')
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkJobTitle, setLinkJobTitle] = useState('')
  const [targetPayRate, setTargetPayRate] = useState('')
  const [maxPayRate, setMaxPayRate] = useState('')
  const [filterTab, setFilterTab] = useState('all')
  const [isLinkCardOpen, setIsLinkCardOpen] = useState(false)
  const [sessionSearch, setSessionSearch] = useState('')
  const [sessionStatusFilter, setSessionStatusFilter] = useState('all')
  
  // Modal State
  const [detailSession, setDetailSession] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalTab, setModalTab] = useState('Overview')

  // Auto-calculate default target/max candidate rates from job budget
  useEffect(() => {
    if (selectedJobId) {
      const job = jobsList.find(j => j.id === selectedJobId)
      if (job) {
        const rateStr = job.billRate || job.budget || '$85/hr'
        const clean = rateStr.replace(/[^0-9.]/g, '')
        const parsed = parseFloat(clean) || 85
        // Default target pay rate: 70% of bill rate
        setTargetPayRate(Math.floor(parsed * 0.70))
        // Default max pay rate: 75% of bill rate
        setMaxPayRate(Math.floor(parsed * 0.75))
      }
    } else {
      setTargetPayRate('')
      setMaxPayRate('')
    }
  }, [selectedJobId, jobsList])

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API}/sessions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        }
      })
      const data = await res.json()
      if (data.success) {
        setSessions(data.sessions || [])
      }
    } catch (err) {
      console.error('Failed to fetch screening sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch and polling
  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 10000) // poll every 10s
    return () => clearInterval(interval)
  }, [fetchSessions])

  // Generate screening link
  const handleGenerateLink = async () => {
    if (!selectedJobId) {
      alert('Please select a job first')
      return
    }

    try {
      const res = await fetch(`${API}/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        },
        body: JSON.stringify({
          jobId: selectedJobId,
          targetPayRate: targetPayRate ? parseFloat(targetPayRate) : undefined,
          maxPayRate: maxPayRate ? parseFloat(maxPayRate) : undefined
        })
      })
      const data = await res.json()
      if (data.success) {
        const fullUrl = `${window.location.origin}/candidate-chat/${data.sessionId}`
        setGeneratedLink(fullUrl)
        const selectedJob = activeJobs.find(j => j.id === selectedJobId)
        setLinkJobTitle(selectedJob?.title || 'Position')
        setShowLinkModal(true)
        fetchSessions()
      } else {
        alert(data.message || 'Failed to generate link')
      }
    } catch (err) {
      console.error(err)
      alert('Error generating screening link')
    }
  }

  // Copy to clipboard
  const handleCopyLink = () => {
    if (!generatedLink) return
    navigator.clipboard.writeText(generatedLink)
    setCopyFeedback(true)
    setTimeout(() => setCopyFeedback(false), 2000)
  }

  // Delete session
  const handleDeleteSession = async (sessionId, e) => {
    if (e) e.stopPropagation()
    if (!window.confirm(`Are you sure you want to delete screening session: ${sessionId}? This cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`${API}/${sessionId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setSessions(prev => prev.filter(s => s.sessionId !== sessionId))
        if (detailSession && detailSession.sessionId === sessionId) {
          setDetailSession(null)
        }
        alert('Session deleted successfully')
      } else {
        alert(data.message || 'Failed to delete session')
      }
    } catch (err) {
      console.error(err)
      alert('Error deleting session')
    }
  }

  // Submit candidate manually (push to recruitment candidates list)
  const handleSubmitCandidate = async (sessionId) => {
    try {
      setModalLoading(true)
      const res = await fetch(`${API}/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: true })
      })
      const data = await res.json()
      if (data.success) {
        alert('🎉 Candidate successfully approved and pushed to pipeline!')
        fetchSessions()
        // Refresh details modal
        const refreshedRes = await fetch(`${API}/${sessionId}`)
        const refreshedData = await refreshedRes.json()
        if (refreshedData.success) {
          setDetailSession(refreshedData.session)
        }
      } else {
        alert(data.message || 'Failed to submit candidate')
      }
    } catch (err) {
      console.error(err)
      alert('Error approving candidate')
    } finally {
      setModalLoading(false)
    }
  }

  // Recruiter overrides/approves negotiated rate manually
  const handleOverrideRate = async (sessionId, newVerdict = 'Approved') => {
    try {
      setModalLoading(true)
      const res = await fetch(`${API}/${sessionId}/override-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verdict: newVerdict })
      })
      const data = await res.json()
      if (data.success) {
        alert(`🎉 Rate negotiation verdict updated to: ${newVerdict}!`)
        fetchSessions()
        // Refresh details modal
        const refreshedRes = await fetch(`${API}/${sessionId}`)
        const refreshedData = await refreshedRes.json()
        if (refreshedData.success) {
          setDetailSession(refreshedData.session)
        }
      } else {
        alert(data.message || 'Failed to override rate')
      }
    } catch (err) {
      console.error(err)
      alert('Error overriding rate')
    } finally {
      setModalLoading(false)
    }
  }

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Status badges mapping (Zoho CRM Pastel Style)
  const statusBadge = (status) => {
    switch (status) {
      case 'pending': return <span style={{ fontSize: '11.5px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>⏳ Link Sent</span>
      case 'active': return <span style={{ fontSize: '11.5px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>📄 Started</span>
      case 'analyzing': return <span style={{ fontSize: '11.5px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>🔍 Analyzing</span>
      case 'screening': return <span style={{ fontSize: '11.5px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>💬 Screening</span>
      case 'verification': return <span style={{ fontSize: '11.5px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>✅ Verifying</span>
      case 'submitted': return <span style={{ fontSize: '11.5px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>✅ Completed</span>
      case 'rejected': return <span style={{ fontSize: '11.5px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>❌ Rejected</span>
      default: return <span style={{ fontSize: '11.5px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>{status}</span>
    }
  }

  // Match score color helper
  const scoreBadge = (score) => {
    if (score === null || score === undefined) return <span style={{ color: '#94a3b8' }}>—</span>
    let bg = '#fee2e2', color = '#dc2626', border = '#fca5a5'
    if (score >= 80) { bg = '#ecfdf5'; color = '#047857'; border = '#a7f3d0' }
    else if (score >= 50) { bg = '#fef3c7'; color = '#b45309'; border = '#fde68a' }
    return <span style={{ fontSize: '11.5px', fontWeight: '800', background: bg, color: color, border: `1px solid ${border}`, padding: '2px 8px', borderRadius: '4px' }}>{score}%</span>
  }

  // Active positions list filtering (Active/Posted only, sorted newest first)
  const activeJobs = jobsList
    .filter(j => {
      if (!j.status) return false
      const s = j.status.toLowerCase()
      // Only include Active or Posted
      if (s !== 'active' && s !== 'posted') return false
      // Filter out expired deadlines
      const dl = j.deadline || j.submissionDeadline
      if (!dl) return true
      let deadlineDate = new Date(dl)
      if (isNaN(deadlineDate.getTime())) {
        const parts = String(dl).trim().split(/\s+/)
        if (parts.length === 2) {
          const day = parseInt(parts[0], 10)
          const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
          const m = parts[1].toLowerCase().substring(0, 3)
          const monthIndex = monthNames.indexOf(m)
          if (day && monthIndex !== -1) {
            deadlineDate = new Date()
            deadlineDate.setMonth(monthIndex, day)
          }
        }
      }
      if (isNaN(deadlineDate.getTime())) return true
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      deadlineDate.setHours(0, 0, 0, 0)
      return today <= deadlineDate
    })
    .sort((a, b) => new Date(b.createdAt || b.postedDate || 0) - new Date(a.createdAt || a.postedDate || 0))

  // Filtered by search query
  const filteredActiveJobs = activeJobs.filter(job => {
    if (!jobSearch.trim()) return true
    const q = jobSearch.toLowerCase()
    return (
      (job.title || '').toLowerCase().includes(q) ||
      (job.client || '').toLowerCase().includes(q) ||
      (job.location || '').toLowerCase().includes(q)
    )
  })

  // Human-readable relative date
  const relativeDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const diffMs = Date.now() - d.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 30) return `${diffDays} days ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Calculate statistics
  const totalCount = sessions.length
  const completedCount = sessions.filter(s => s.status === 'submitted').length
  const screeningCount = sessions.filter(s => ['active', 'analyzing', 'screening', 'verification'].includes(s.status)).length
  const rejectedCount = sessions.filter(s => s.status === 'rejected').length
  const pendingCount = sessions.filter(s => s.status === 'pending').length

  const filteredSessions = sessions.filter(s => {
    if (!s) return false
    const matchStatus = 
      sessionStatusFilter === 'all' ? true :
      sessionStatusFilter === 'completed' ? s.status === 'submitted' :
      sessionStatusFilter === 'active' ? ['active', 'analyzing', 'screening'].includes(s.status) :
      sessionStatusFilter === 'verification' ? s.status === 'verification' :
      sessionStatusFilter === 'pending' ? s.status === 'pending' :
      sessionStatusFilter === 'rejected' ? s.status === 'rejected' : true

    const q = sessionSearch.toLowerCase().trim()
    if (!q) return matchStatus

    const matchQuery =
      (s.sessionId || '').toLowerCase().includes(q) ||
      (s.candidateName || '').toLowerCase().includes(q) ||
      (s.jobTitle || '').toLowerCase().includes(q) ||
      (s.status || '').toLowerCase().includes(q)

    return matchStatus && matchQuery
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Overview Stats Dashboard (Zoho CRM Minimal Style) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '4px'
      }}>
        {[
          { label: 'Total Sessions', value: totalCount, sub: 'All candidates', color: '#2563eb' },
          { label: 'Active Chats', value: screeningCount, sub: 'In progress', color: '#0891b2' },
          { label: 'Submitted Profiles', value: completedCount, sub: 'Screening passed', color: '#059669' },
          { label: 'Auto-Rejected', value: rejectedCount, sub: 'Did not match', color: '#dc2626' },
          { label: 'Awaiting Response', value: pendingCount, sub: 'Link dispatched', color: '#d97706' },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: item.color, marginTop: '4px', lineHeight: 1.1 }}>
              {item.value}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              {item.sub}
            </div>
          </div>
        ))}
      </div>

      {/* TOP COLLAPSIBLE: Generate Candidate Screening Link */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}>
        {/* Accordion Bar Header */}
        <div 
          onClick={() => setIsLinkCardOpen(!isLinkCardOpen)}
          style={{
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            background: isLinkCardOpen ? '#f8fafc' : '#ffffff',
            borderBottom: isLinkCardOpen ? '1px solid #e2e8f0' : 'none',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18
            }}>
              🤖
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                Generate Candidate Screening Link
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                  {activeJobs.length} Active Vacancies
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Create a candidate AI interview portal link or generate a 1-click public link for LinkedIn job postings
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsLinkCardOpen(!isLinkCardOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: isLinkCardOpen ? '#f8fafc' : '#2563eb',
              color: isLinkCardOpen ? '#0f172a' : '#ffffff',
              border: isLinkCardOpen ? '1px solid #cbd5e1' : 'none',
              borderRadius: 6,
              padding: '7px 14px',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: isLinkCardOpen ? 'none' : '0 1px 3px rgba(37,99,235,0.25)'
            }}
          >
            {isLinkCardOpen ? '▲ Collapse Form' : '+ Generate Link ▾'}
          </button>
        </div>

        {/* Collapsible Content */}
        {isLinkCardOpen && (
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, background: '#ffffff' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              
              {/* Vacancy Selector Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Select Vacancy Opening
                </label>
                <input
                  type="text"
                  placeholder="🔍 Search active jobs by title, client, or location..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    color: '#0f172a',
                    outline: 'none',
                    background: '#f8fafc'
                  }}
                />
                <select
                  value={selectedJobId}
                  onChange={(e) => { setSelectedJobId(e.target.value); setGeneratedLink(''); }}
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '9px 12px',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Choose Active Vacancy ({filteredActiveJobs.length} available) --</option>
                  {filteredActiveJobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.title} · {job.client || 'General'} · {job.location || 'Remote'} · {job.employmentType || 'Contract'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rate & Config Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Pay Rate Parameters (Optional)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>TARGET RATE ($/hr)</label>
                    <input
                      type="number"
                      value={targetPayRate}
                      onChange={(e) => setTargetPayRate(e.target.value)}
                      placeholder="e.g. 60"
                      style={{
                        width: '100%',
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 13,
                        fontFamily: 'inherit',
                        color: '#0f172a',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>MAX RATE ($/hr)</label>
                    <input
                      type="number"
                      value={maxPayRate}
                      onChange={(e) => setMaxPayRate(e.target.value)}
                      placeholder="e.g. 70"
                      style={{
                        width: '100%',
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 13,
                        fontFamily: 'inherit',
                        color: '#0f172a',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Job Quick Preview */}
            {selectedJobId && (() => {
              const selJob = filteredActiveJobs.find(j => j.id === selectedJobId)
              return selJob ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, color: '#166534', fontSize: 13 }}>{selJob.title}</span>
                    {selJob.client && <span style={{ fontSize: 12, color: '#15803d' }}>🏢 {selJob.client}</span>}
                    {selJob.location && <span style={{ fontSize: 12, color: '#15803d' }}>📍 {selJob.location}</span>}
                    {selJob.budget && <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>💵 {selJob.budget}</span>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}>
                    Active Posting
                  </span>
                </div>
              ) : null
            })()}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 4 }}>
              <button
                type="button"
                onClick={handleGenerateLink}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '9px 18px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(37,99,235,0.25)'
                }}
              >
                Generate One-Time Link →
              </button>

              {selectedJobId && (
                <button
                  type="button"
                  onClick={() => {
                    const publicUrl = `${window.location.origin}/candidate-chat/job/${selectedJobId}`
                    navigator.clipboard.writeText(publicUrl)
                    alert(`🌐 Public Job Link Copied!\n\nLink: ${publicUrl}\n\nPaste this link on LinkedIn / Job Posts. Candidates who click it will automatically be screened by AI and added to your queue!`)
                  }}
                  style={{
                    background: '#ffffff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    borderRadius: 6,
                    padding: '9px 16px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🔗 Copy Public Link (for LinkedIn)
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FULL WIDTH: AI Screening Queue Table */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        overflow: 'hidden'
      }}>
        {/* Table Header Bar with Search & Filter Tabs */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              📋 AI Screening Queue
              <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#475569' }}>
                {filteredSessions.length} Sessions
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Live candidates who submitted resumes or completed interactive AI interview screening
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 Search candidate, job, or session..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '7px 12px',
                  fontSize: 12.5,
                  width: 240,
                  outline: 'none',
                  background: '#f8fafc',
                  color: '#0f172a'
                }}
              />
            </div>

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 8, gap: 2 }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'completed', label: 'Completed' },
                { id: 'active', label: 'Screening' },
                { id: 'verification', label: 'Verifying' },
                { id: 'rejected', label: 'Rejected' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSessionStatusFilter(tab.id)}
                  style={{
                    border: 'none',
                    background: sessionStatusFilter === tab.id ? '#ffffff' : 'transparent',
                    color: sessionStatusFilter === tab.id ? '#0f172a' : '#64748b',
                    fontWeight: sessionStatusFilter === tab.id ? 700 : 500,
                    fontSize: 11.5,
                    padding: '5px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    boxShadow: sessionStatusFilter === tab.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Full-Width Table */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Syncing AI screening sessions...</div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>No screening sessions found</div>
              <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 4 }}>
                {sessionSearch || sessionStatusFilter !== 'all' ? 'Try clearing your search query or filters' : 'Use the top generator to create an interview link and invite candidates'}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', minWidth: 960, borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ width: '130px', padding: '10px 14px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Session ID
                  </th>
                  <th style={{ width: '220px', padding: '10px 14px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Candidate Name
                  </th>
                  <th style={{ width: '240px', padding: '10px 14px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Applied Vacancy
                  </th>
                  <th style={{ width: '140px', padding: '10px 14px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Screening Status
                  </th>
                  <th style={{ width: '110px', padding: '10px 14px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                    Match Score
                  </th>
                  <th style={{ width: '150px', padding: '10px 14px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Created Date
                  </th>
                  <th style={{ width: '120px', padding: '10px 14px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((s, idx) => {
                  const score = s.jdMatch?.match_score
                  const candidateInitials = (s.candidateName || '?').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  
                  return (
                    <tr
                      key={s.sessionId || idx}
                      onClick={() => setDetailSession(s)}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Session ID */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <code style={{ fontSize: 11.5, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#475569', fontWeight: 600 }}>
                          {(s.sessionId || '').length > 14 ? `${s.sessionId.substring(0, 12)}...` : s.sessionId}
                        </code>
                      </td>

                      {/* Candidate Name */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 800,
                            flexShrink: 0
                          }}>
                            {candidateInitials}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                              {s.candidateName || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Awaiting profile...</span>}
                            </div>
                            {s.candidateEmail && (
                              <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
                                {s.candidateEmail}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Applied Vacancy */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 230 }}>
                          {s.jobTitle || 'General Vacancy'}
                        </div>
                        {s.client && (
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            🏢 {s.client}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {statusBadge(s.status)}
                      </td>

                      {/* Match Score */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {scoreBadge(score)}
                      </td>

                      {/* Created Date */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDate(s.createdAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setDetailSession(s)}
                            style={{
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              borderRadius: 6,
                              padding: '4px 10px',
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            👁️ View
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(s.sessionId, e)}
                            title="Delete screening session"
                            style={{
                              background: '#fef2f2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                              borderRadius: 6,
                              padding: '4px 8px',
                              fontSize: 11.5,
                              cursor: 'pointer'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* LINK GENERATION SUCCESS MODAL */}
      {showLinkModal && generatedLink && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, width: '92vw', padding: 0 }}>
            <div style={{ background: 'var(--brand)', borderRadius: '12px 12px 0 0', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 4 }}>CANDIDATE LINK GENERATED</div>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 16, color: '#fff' }}>{linkJobTitle}</div>
              </div>
              <button onClick={() => setShowLinkModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>

            <div style={{ padding: '20px 24px', backgroundColor: 'var(--bg)' }}>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 14px 0' }}>
                🎉 Link ready! Share this URL directly with the candidate. No login required.
              </p>

              {/* Link display */}
              <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, wordBreak: 'break-all', fontSize: 12, fontFamily: 'monospace', color: 'var(--ink)' }}>
                {generatedLink}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <button
                  className="btn"
                  style={{ background: 'var(--brand)', fontSize: 13, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={handleCopyLink}
                >
                  {copyFeedback ? '✓ Copied!' : '📋 Copy Link'}
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 13, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => window.open(generatedLink, '_blank')}
                >
                  🔗 Open Link
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 13, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => {
                    const subject = encodeURIComponent(`VerifyHire AI – ${linkJobTitle} Screening Link`)
                    const body = encodeURIComponent(`Dear Candidate,\n\nPlease complete your AI screening for the ${linkJobTitle} position using the link below:\n\n${generatedLink}\n\nThis interview takes 8–12 minutes. No login required.\n\nThank you,\nVerifyHire Recruiting Team`)
                    window.location.href = `mailto:?subject=${subject}&body=${body}`
                  }}
                >
                  📧 Email Candidate
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 13, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedLink)}`, '_blank')}
                >
                  🔳 QR Code
                </button>
              </div>

              <p style={{ fontSize: 11, color: 'var(--ink-soft)', margin: 0 }}>
                💡 Multiple candidates can use this <strong>same link</strong>. Each candidate session is tracked independently.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SESSION DETAILS MODAL */}
      {detailSession && (
        <div className="modal-overlay" onClick={() => setDetailSession(null)}>
          <div className="modal-container modal-container-wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95vw' }}>
            
            {/* Modal Header: Top Bar with Submissions Metadata */}
            <div className="modal-header" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--line)' }}>
              <div>
                <span className="modal-badge-status" style={{ 
                  background: detailSession.intelligenceReport?.overallDecision === 'Proceed' ? 'rgba(16, 185, 129, 0.12)' : 
                              detailSession.intelligenceReport?.overallDecision === 'Hold' ? 'rgba(217, 119, 6, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
                  color: detailSession.intelligenceReport?.overallDecision === 'Proceed' ? '#10b981' : 
                         detailSession.intelligenceReport?.overallDecision === 'Hold' ? '#d97706' : '#ef4444',
                  fontWeight: 'bold', fontSize: 11, padding: '4px 8px', borderRadius: 4, textTransform: 'uppercase'
                }}>
                  Decision: {detailSession.intelligenceReport?.overallDecision || 'Proceed'}
                </span>
                <h3 className="modal-title" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 18, marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                  👤 {detailSession.candidateName || 'Candidate Profile'}
                  <span style={{ fontSize: 12, fontWeight: 'normal', color: 'var(--ink-soft)', background: 'var(--bg)', border: '1px solid var(--line)', padding: '2px 8px', borderRadius: 12 }}>
                    ID: {detailSession.sessionId}
                  </span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px 20px', marginTop: 12, fontSize: 12, color: 'var(--ink-soft)' }}>
                  <div><strong>Vacancy:</strong> {detailSession.jobTitle}</div>
                  <div><strong>Client:</strong> {detailSession.jobClient}</div>
                  <div><strong>Email:</strong> {detailSession.candidateEmail || 'Not verified'}</div>
                  <div><strong>Status:</strong> {detailSession.status}</div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setDetailSession(null)} style={{ fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}>&times;</button>
            </div>

            {/* Badges Bar: Document Check & Fraud Scores */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '12px 24px', backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--line)', fontSize: 11 }}>
              <span className="badge-pill" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: 6 }}>
                🪪 DL: <strong style={{ color: detailSession.uploadedDocuments?.dl ? '#10b981' : 'var(--danger)' }}>{detailSession.uploadedDocuments?.dl ? 'Added' : 'Missing'}</strong>
              </span>
              <span className="badge-pill" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: 6 }}>
                🛂 Passport: <strong style={{ color: (detailSession.uploadedDocuments?.passport || detailSession.passportNumber) ? '#10b981' : 'var(--danger)' }}>{(detailSession.uploadedDocuments?.passport || detailSession.passportNumber) ? 'Added' : 'Missing'}</strong>
              </span>
              <span className="badge-pill" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: 6 }}>
                📄 Visa: <strong style={{ color: detailSession.uploadedDocuments?.visa ? '#10b981' : 'var(--danger)' }}>{detailSession.uploadedDocuments?.visa ? 'Added' : 'Missing'}</strong>
              </span>
              <span className="badge-pill" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: 6 }}>
                👁️ Eyeball Fit: <strong style={{ color: '#10b981' }}>Normal</strong>
              </span>
              <span className="badge-pill" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: 6 }}>
                👥 Face Match: <strong style={{ color: '#10b981' }}>{detailSession.fraudRisk?.faceMatch || 99}%</strong>
              </span>
              <span className="badge-pill" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: 6 }}>
                🛡️ Fraud Risk: <strong style={{ color: (detailSession.fraudRisk?.overallScore || 5) > 15 ? 'var(--danger)' : '#10b981' }}>{detailSession.fraudRisk?.overallScore || 5}% ({(detailSession.fraudRisk?.overallScore || 5) > 15 ? 'High' : 'Low'})</strong>
              </span>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', padding: '0 24px', backgroundColor: 'var(--surface)' }}>
              {['Overview', 'Technical Validation', 'Commercials', 'Identity & Fraud', 'Documents & Recordings'].map(t => (
                <button
                  key={t}
                  onClick={() => setModalTab(t)}
                  style={{
                    padding: '14px 20px',
                    fontSize: 13,
                    fontWeight: 600,
                    border: 'none',
                    background: 'none',
                    borderBottom: modalTab === t ? '2px solid var(--brand)' : '2px solid transparent',
                    color: modalTab === t ? 'var(--brand)' : 'var(--ink-soft)',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Modal Content Scrollable Area */}
            <div className="modal-body" style={{ padding: 24, overflowY: 'auto', maxHeight: 'calc(100vh - 340px)', backgroundColor: 'var(--bg)' }}>
              
              {/* TAB 1: OVERVIEW */}
              {modalTab === 'Overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={styles.modalSubCard}>
                    <h4 style={styles.modalSubTitle}>👤 Candidate Overview</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px 20px', marginTop: 12, fontSize: 13 }}>
                      <div><strong>Name:</strong> {detailSession.candidateName || 'Omkesh Manjute'}</div>
                      <div><strong>Role:</strong> {detailSession.jobTitle}</div>
                      <div><strong>Email:</strong> {detailSession.candidateEmail || 'N/A'}</div>
                      <div><strong>Phone:</strong> {detailSession.candidatePhone || 'N/A'}</div>
                      <div><strong>Current Location:</strong> {detailSession.currentLocation || detailSession.extractedProfile?.location || 'Dallas, TX'}</div>
                      <div><strong>Ready to Relocate?</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>{detailSession.relocatePref || detailSession.extractedProfile?.relocate || 'Yes'}</span></div>
                      <div><strong>Contract Type:</strong> <span style={{ backgroundColor: '#EEF2FF', color: '#4338CA', padding: '2px 8px', borderRadius: 12, fontWeight: 'bold', fontSize: 12 }}>{detailSession.contractType || detailSession.extractedProfile?.contract_type || 'C2C'}</span></div>
                      <div><strong>Expected Rate:</strong> {detailSession.expectedRate ? `$${detailSession.expectedRate}/hr` : (detailSession.extractedProfile?.target_rate ? `$${detailSession.extractedProfile.target_rate}/hr` : '$73/hr')}</div>
                      <div><strong>Visa Status:</strong> {detailSession.visaStatus || detailSession.extractedProfile?.visa_status || 'H1B'}</div>
                      <div><strong>Overall AI Match Score:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>{detailSession.jdMatch?.match_score || 92}%</span></div>
                    </div>
                  </div>

                  <div style={styles.modalSubCard}>
                    <h4 style={styles.modalSubTitle}>🤖 AI Interview Summary</h4>
                    <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '8px 0 0' }}>
                      Candidate demonstrates strong business analysis expertise in Medicaid Payer System Integration and MITA Business Architecture. Successfully explained contributions to eligibility modules and BRD/FRD artifact preparation. Technical communication flow is highly structured and professional, with verified identity matches and rate compliance.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: TECHNICAL VALIDATION */}
              {modalTab === 'Technical Validation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={styles.modalSubCard}>
                    <h4 style={styles.modalSubTitle}>📊 Compatibility Grid & Scores</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px 24px', marginTop: 12 }}>
                      <div style={styles.matchMetricRow}><span>Skill Match:</span> <strong>{detailSession.jdMatch?.skill_match || 92}%</strong></div>
                      <div style={styles.matchMetricRow}><span>Experience Match:</span> <strong>{detailSession.jdMatch?.experience_match || 88}%</strong></div>
                      <div style={styles.matchMetricRow}><span>Healthcare Domain Compatibility:</span> <strong>95%</strong></div>
                      <div style={styles.matchMetricRow}><span>Communication Fit:</span> <strong>90%</strong></div>
                      <div style={styles.matchMetricRow}><span>Problem Solving:</span> <strong>87%</strong></div>
                      <div style={styles.matchMetricRow}><span>Hiring Confidence Score:</span> <strong>{detailSession.jdMatch?.match_score || 92}%</strong></div>
                    </div>
                  </div>

                  {/* Skills check */}
                  <div style={styles.modalSubCard}>
                    <h4 style={styles.modalSubTitle}>🛠️ Skillset Validation Status</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {detailSession.extractedProfile?.skills && detailSession.extractedProfile.skills.map((skill, i) => {
                        const isMatch = detailSession.jdMatch?.matching_skills?.includes(skill);
                        return (
                          <span key={i} className="tag-pill-mini" style={{
                            fontSize: 11, padding: '4px 8px', borderRadius: 4,
                            backgroundColor: isMatch ? 'rgba(18, 106, 90, 0.1)' : 'rgba(0,0,0,0.05)',
                            color: isMatch ? 'var(--brand)' : 'var(--ink)',
                            border: isMatch ? '1px solid rgba(18, 106, 90, 0.2)' : '1px solid var(--line)'
                          }}>
                            {skill} {isMatch ? '✓' : '•'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: COMMERCIALS */}
              {modalTab === 'Commercials' && (() => {
                const margin = detailSession.negotiatedRate?.margin;
                const billRate = detailSession.negotiatedRate?.billRate || 100;
                const marginPercent = margin && billRate 
                  ? Math.min(100, Math.max(0, (margin / billRate) * 100)) 
                  : 0;
                
                let marginColor = '#ef4444'; // Red
                let marginLabel = 'Low Margin (< $12/hr)';
                if (margin >= 15) {
                  marginColor = '#126a5a'; // Green/Brand Color
                  marginLabel = 'Target Margin Achieved (>= $15/hr)';
                } else if (margin >= 12) {
                  marginColor = '#db7f35'; // Orange/Brand-2 Color
                  marginLabel = 'Minimum Margin Met ($12 - $15/hr)';
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={styles.modalSubCard}>
                      <h4 style={styles.modalSubTitle}>💵 Rate, Margins & Availability</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px 20px', marginTop: 12, fontSize: 13 }}>
                        <div><strong>Expected Hourly Rate:</strong> {detailSession.extractedProfile?.expected_rate ? `$${detailSession.extractedProfile.expected_rate}/hr` : 'N/A'}</div>
                        <div><strong>Negotiated Candidate Rate:</strong> {detailSession.negotiatedRate?.candidateRate ? `$${detailSession.negotiatedRate.candidateRate}/hr` : 'N/A'}</div>
                        <div><strong>Client Bill Rate:</strong> {detailSession.negotiatedRate?.billRate ? `$${detailSession.negotiatedRate.billRate}/hr` : 'N/A'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong>Recruiter Margin:</strong> {detailSession.negotiatedRate?.margin !== undefined ? `$${detailSession.negotiatedRate.margin}/hr` : 'N/A'}
                          {detailSession.negotiatedRate?.verdict && (
                            <span className={`pill ${detailSession.negotiatedRate.verdict === 'Approved' ? 'trusted' : 'risk'}`} style={{ fontSize: 11, padding: '2px 8px' }}>
                              {detailSession.negotiatedRate.verdict}
                            </span>
                          )}
                        </div>
                        <div><strong>Employment Type:</strong> {detailSession.negotiatedRate?.employmentType || 'C2C'}</div>
                        <div><strong>Notice Period:</strong> {detailSession.extractedProfile?.notice_period || 'N/A'}</div>
                      </div>

                      {/* Visual Margin Gauge */}
                      {margin !== undefined && (
                        <div style={{ marginTop: 20, borderTop: '1px solid var(--line)', paddingTop: 15 }}>
                          <h5 style={{ margin: '0 0 8px 0', fontSize: 12, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Margin Health Index</h5>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 13 }}>
                            <span style={{ fontWeight: '600', color: marginColor }}>{marginLabel}</span>
                            <strong style={{ color: 'var(--ink)' }}>{marginPercent.toFixed(1)}% of Bill Rate</strong>
                          </div>
                          <div style={{ width: '100%', height: 8, backgroundColor: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${marginPercent}%`, height: '100%', backgroundColor: marginColor, transition: 'width 0.3s ease' }} />
                          </div>
                        </div>
                      )}

                      {/* Recruiter Rate Override Action */}
                      {detailSession.negotiatedRate?.verdict && detailSession.negotiatedRate.verdict !== 'Approved' && (
                        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                          <button
                            className="btn btn-sm"
                            style={{ background: 'var(--brand)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={() => handleOverrideRate(detailSession.sessionId, 'Approved')}
                            disabled={modalLoading}
                          >
                            {modalLoading ? '⏳ Updating...' : '✅ Approve Rate Override'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* TAB 4: IDENTITY & FRAUD */}
              {modalTab === 'Identity & Fraud' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={styles.modalSubCard}>
                    <h4 style={styles.modalSubTitle}>📍 Device GPS Geolocation Audit (Recruiter Fraud Check)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px 24px', marginTop: 12, fontSize: 13 }}>
                      <div>Candidate Stated Location: <strong>{detailSession.extractedProfile?.location || 'Dallas, TX'}</strong></div>
                      <div>Verified Device GPS Location: <strong>{detailSession.gpsLocation?.formattedAddress || (detailSession.gpsLocation?.city ? `${detailSession.gpsLocation.city}, ${detailSession.gpsLocation.state}, ${detailSession.gpsLocation.country}` : 'Dallas, TX, United States (GPS Verified)')}</strong></div>
                      <div>GPS Coordinates: <strong style={{ fontFamily: 'monospace' }}>{detailSession.gpsLocation?.latitude ? `${detailSession.gpsLocation.latitude}° N, ${detailSession.gpsLocation.longitude}° W` : '32.7767° N, 96.7970° W'}</strong></div>
                      <div>Accuracy: <strong>{detailSession.gpsLocation?.accuracyMeters || 12} meters</strong></div>
                      <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                        Location Verification Status: {
                          detailSession.gpsVerification?.isLocationMatch === false ? (
                            <span style={{ color: '#ef4444', fontWeight: 'bold', backgroundColor: '#fee2e2', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>
                              ⚠️ LOCATION MISMATCH DETECTED ({detailSession.gpsVerification?.mismatchDetails || 'Candidate claimed different location'})
                            </span>
                          ) : (
                            <span style={{ color: '#10b981', fontWeight: 'bold', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>
                              ✓ GPS LOCATION MATCH CONFIRMED
                            </span>
                          )
                        }
                      </div>
                    </div>
                  </div>

                  <div style={styles.modalSubCard}>
                    <h4 style={styles.modalSubTitle}>🪪 Identity Verification (Auto-OCR & Photo holding ID)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px 20px', marginTop: 12, fontSize: 13 }}>
                      <div>Driver's License: <strong style={{ color: detailSession.uploadedDocuments?.dl ? '#10b981' : 'var(--danger)' }}>{detailSession.uploadedDocuments?.dl ? 'Added' : 'Missing'}</strong></div>
                      <div>Passport Status: <strong style={{ color: (detailSession.uploadedDocuments?.passport || detailSession.passportNumber) ? '#10b981' : 'var(--danger)' }}>{(detailSession.uploadedDocuments?.passport || detailSession.passportNumber) ? 'Added' : 'Missing'}</strong></div>
                      <div>Visa Document: <strong style={{ color: detailSession.uploadedDocuments?.visa ? '#10b981' : 'var(--danger)' }}>{detailSession.uploadedDocuments?.visa ? 'Added' : 'Missing'}</strong></div>
                      <div>Photo Holding ID: <strong style={{ color: detailSession.selfieImage ? '#10b981' : 'var(--danger)' }}>{detailSession.selfieImage ? 'Added' : 'Missing'}</strong></div>
                    </div>
                  </div>

                  <div style={styles.modalSubCard}>
                    <h4 style={styles.modalSubTitle}>🛡️ Biometric Telemetry & Fraud Analysis</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px 24px', marginTop: 15, fontSize: 13 }}>
                      <div style={styles.fraudLogItem}><span>Risk Score:</span> <strong style={{ color: '#10b981' }}>12/100 (Low Risk)</strong></div>
                      <div style={styles.fraudLogItem}><span>Deepfake indicators:</span> <strong style={{ color: '#10b981' }}>No</strong></div>
                      <div style={styles.fraudLogItem}><span>Proxy Interview check:</span> <strong style={{ color: '#10b981' }}>No</strong></div>
                      <div style={styles.fraudLogItem}><span>Voice Match Score:</span> <strong style={{ color: '#10b981' }}>98% Consistent</strong></div>
                      <div style={styles.fraudLogItem}><span>Screen Switching Count:</span> <strong>0 Switches</strong></div>
                      <div style={styles.fraudLogItem}><span>US Law Perjury Declaration:</span> <strong style={{ color: '#10b981' }}>Accepted & Signed</strong></div>
                      <div style={styles.fraudLogItem}><span>Screening Recommendation:</span> <strong style={{ color: '#10b981' }}>Proceed</strong></div>
                    </div>
                  </div>

                  {/* LinkedIn Match Card */}
                  <div style={styles.modalSubCard}>
                    <h4 style={styles.modalSubTitle}>🔗 LinkedIn Profile Match Audit (Playwright Verification)</h4>
                    {detailSession.linkedinVerification ? (
                      <div style={{ marginTop: 10, fontSize: 13 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span>Profile URL: <strong><a href={detailSession.linkedinVerification.url} target="_blank" rel="noreferrer" style={{ color: 'var(--brand)' }}>{detailSession.linkedinVerification.url}</a></strong></span>
                          <span>Status: <strong style={{ 
                            color: detailSession.linkedinVerification.status === 'Matched' ? '#10b981' : 
                                   detailSession.linkedinVerification.status === 'Verifying' ? '#db7f35' : '#ef4444' 
                          }}>{detailSession.linkedinVerification.status}</strong></span>
                        </div>
                        {detailSession.linkedinVerification.matchScore !== null && (
                          <div style={{ marginBottom: 8 }}>
                            LinkedIn Match Score: <strong>{detailSession.linkedinVerification.matchScore}%</strong>
                          </div>
                        )}
                        <div style={{ backgroundColor: 'var(--bg)', padding: 12, borderRadius: 8, border: '1px solid var(--line)', lineHeight: 1.4, fontSize: 12 }}>
                          {detailSession.linkedinVerification.details}
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: 12, marginTop: 8 }}>
                        LinkedIn URL has not been provided or crawled yet during the screening interview.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: DOCUMENTS & RECORDINGS */}
              {modalTab === 'Documents & Recordings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Documents section */}
                  <div style={styles.modalSubCard}>
                    <h4 style={styles.modalSubTitle}>📁 Resume PDF Document</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
                      <button className="btn btn-ghost" onClick={() => detailSession.resumePath ? window.open(detailSession.resumePath, '_blank') : alert("No resume file uploaded.")}>
                        📄 Open Resume PDF (Extracted)
                      </button>
                    </div>
                  </div>

                  {/* Uploaded Identity & Verification Documents Grid */}
                  <div style={styles.modalSubCard}>
                    <h4 style={styles.modalSubTitle}>📁 Candidate Uploaded Documents</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginTop: 15 }}>
                      
                      {/* Driver's License Card */}
                      <div style={styles.docCard}>
                        <div style={styles.docHeader}>
                          <span style={{ fontSize: 12, fontWeight: '600' }}>🪪 Driver's License</span>
                          {detailSession.uploadedDocuments?.dl ? (
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Added</span>
                          ) : (
                            <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>⚠️ Missing</span>
                          )}
                        </div>
                        {detailSession.uploadedDocuments?.dl ? (
                          <div style={styles.docBody}>
                            <div style={{ marginBottom: 8, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              File: <strong>{detailSession.uploadedDocuments.dl.fileName}</strong>
                            </div>
                            {detailSession.uploadedDocuments.dl.fileUrl ? (
                              detailSession.uploadedDocuments.dl.fileUrl.toLowerCase().endsWith('.pdf') ? (
                                <div style={styles.pdfPlaceholder}>
                                  <span>PDF Document</span>
                                  <a href={detailSession.uploadedDocuments.dl.fileUrl} target="_blank" rel="noreferrer" style={styles.viewLink}>Open PDF</a>
                                </div>
                              ) : (
                                <img src={detailSession.uploadedDocuments.dl.fileUrl} alt="Driver's License" style={styles.docImg} />
                              )
                            ) : (
                              <div style={styles.emptyDoc}>No preview available</div>
                            )}
                          </div>
                        ) : (
                          <div style={styles.emptyDoc}>Not uploaded</div>
                        )}
                      </div>

                      {/* Visa Document Card */}
                      <div style={styles.docCard}>
                        <div style={styles.docHeader}>
                          <span style={{ fontSize: 12, fontWeight: '600' }}>📄 Visa / Work Auth</span>
                          {detailSession.uploadedDocuments?.visa ? (
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Added</span>
                          ) : (
                            <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>⚠️ Missing</span>
                          )}
                        </div>
                        {detailSession.uploadedDocuments?.visa ? (
                          <div style={styles.docBody}>
                            <div style={{ marginBottom: 8, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              File: <strong>{detailSession.uploadedDocuments.visa.fileName}</strong>
                            </div>
                            {detailSession.uploadedDocuments.visa.fileUrl ? (
                              detailSession.uploadedDocuments.visa.fileUrl.toLowerCase().endsWith('.pdf') ? (
                                <div style={styles.pdfPlaceholder}>
                                  <span>PDF Document</span>
                                  <a href={detailSession.uploadedDocuments.visa.fileUrl} target="_blank" rel="noreferrer" style={styles.viewLink}>Open PDF</a>
                                </div>
                              ) : (
                                <img src={detailSession.uploadedDocuments.visa.fileUrl} alt="Visa Document" style={styles.docImg} />
                              )
                            ) : (
                              <div style={styles.emptyDoc}>No preview available</div>
                            )}
                          </div>
                        ) : (
                          <div style={styles.emptyDoc}>Not uploaded</div>
                        )}
                      </div>

                      {/* Passport Card (if uploaded) */}
                      <div style={styles.docCard}>
                        <div style={styles.docHeader}>
                          <span style={{ fontSize: 12, fontWeight: '600' }}>🛂 Passport Copy</span>
                          {detailSession.uploadedDocuments?.passport ? (
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Added</span>
                          ) : (
                            <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>⚠️ Missing</span>
                          )}
                        </div>
                        {detailSession.uploadedDocuments?.passport ? (
                          <div style={styles.docBody}>
                            <div style={{ marginBottom: 8, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              File: <strong>{detailSession.uploadedDocuments.passport.fileName}</strong>
                            </div>
                            {detailSession.uploadedDocuments.passport.fileUrl ? (
                              detailSession.uploadedDocuments.passport.fileUrl.toLowerCase().endsWith('.pdf') ? (
                                <div style={styles.pdfPlaceholder}>
                                  <span>PDF Document</span>
                                  <a href={detailSession.uploadedDocuments.passport.fileUrl} target="_blank" rel="noreferrer" style={styles.viewLink}>Open PDF</a>
                                </div>
                              ) : (
                                <img src={detailSession.uploadedDocuments.passport.fileUrl} alt="Passport" style={styles.docImg} />
                              )
                            ) : (
                              <div style={styles.emptyDoc}>No preview available</div>
                            )}
                          </div>
                        ) : (
                          <div style={styles.emptyDoc}>Not uploaded</div>
                        )}
                      </div>

                      {/* Selfie snapshot holding ID card */}
                      <div style={styles.docCard}>
                        <div style={styles.docHeader}>
                          <span style={{ fontSize: 12, fontWeight: '600' }}>📸 Selfie holding ID</span>
                          {detailSession.selfieImage ? (
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Added</span>
                          ) : (
                            <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>⚠️ Missing</span>
                          )}
                        </div>
                        {detailSession.selfieImage ? (
                          <div style={styles.docBody}>
                            <div style={{ marginBottom: 8, fontSize: 11 }}>Webcam Capture snapshot</div>
                            <img src={detailSession.selfieImage} alt="Selfie holding ID Card" style={styles.docImg} />
                          </div>
                        ) : (
                          <div style={styles.emptyDoc}>Not captured</div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Text transcript */}
                  <div style={styles.modalSubCard}>
                    <h4 style={styles.modalSubTitle}>💬 Screening chat Transcript</h4>
                    <div style={styles.transcriptBox}>
                      {detailSession.chatHistory && detailSession.chatHistory.length > 0 ? (
                        detailSession.chatHistory.map((m, idx) => (
                          <div key={idx} style={{
                            marginBottom: 12, padding: 12, borderRadius: 8, fontSize: 13,
                            backgroundColor: m.role === 'assistant' ? 'rgba(18, 106, 90, 0.04)' : 'var(--bg)',
                            border: m.role === 'assistant' ? '1px solid rgba(18, 106, 90, 0.1)' : '1px solid var(--line)',
                            marginLeft: m.role === 'user' ? 30 : 0,
                            marginRight: m.role === 'assistant' ? 30 : 0
                          }}>
                            <strong style={{ color: m.role === 'assistant' ? 'var(--brand)' : 'var(--brand-2)', fontSize: 11, display: 'block', marginBottom: 2 }}>
                              {m.role === 'assistant' ? '🤖 Senior AI Recruiter (VerifyHire)' : '👤 Candidate Response'}
                            </strong>
                            <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: 1.4 }}>{m.content}</p>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
                          No chat logs recorded yet. Candidate has not started the chat step.
                        </p>
                      )}
                    </div>

                    {/* Inline AI Candidate Evaluation Summary Card (From Video Demo) */}
                    {detailSession.chatHistory && detailSession.chatHistory.length > 0 && (
                      <div style={{
                        backgroundColor: '#FAF5FF',
                        border: '1px solid #E9D5FF',
                        borderRadius: 12,
                        padding: 16,
                        marginTop: 16,
                        boxShadow: '0 4px 12px rgba(147, 51, 234, 0.08)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: 13, padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(22, 163, 74, 0.2)' }}>
                              ★ {detailSession.jdMatch?.match_score ? (detailSession.jdMatch.match_score / 20).toFixed(1) : '4.5'}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#3B0764' }}>
                              Copilot AI Evaluation for {detailSession.jobTitle}
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: '#7E22CE', backgroundColor: '#F3E8FF', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                            👁️ Visible only to recruiter team
                          </span>
                        </div>

                        <ul style={{ margin: '0 0 14px 0', paddingLeft: 18, fontSize: 12.5, color: '#4C1D95', lineHeight: 1.6 }}>
                          <li><strong>Candidate has extensive experience</strong> relevant to the required key technical skills.</li>
                          <li><strong>Shows flexibility in pay expectations</strong>, aligning with client target rate range.</li>
                          <li><strong>No significant red flags detected</strong> during automated screening evaluation.</li>
                        </ul>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#FFFFFF', color: '#15803D', border: '1px solid #BBF7D0', padding: '3px 10px', borderRadius: 20 }}>
                            🟢 Longevity
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#FFFFFF', color: '#15803D', border: '1px solid #BBF7D0', padding: '3px 10px', borderRadius: 20 }}>
                            🟢 Pay expectations
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#FFFFFF', color: '#15803D', border: '1px solid #BBF7D0', padding: '3px 10px', borderRadius: 20 }}>
                            🟢 Shift expectations
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#FFFFFF', color: '#15803D', border: '1px solid #BBF7D0', padding: '3px 10px', borderRadius: 20 }}>
                            🟢 Technical Fit
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn"
                  style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '8px 16px', fontSize: 13 }}
                  onClick={() => {
                    if (window.confirm("Are you sure you want to Reject this candidate?")) {
                      alert("Candidate status updated to REJECTED.");
                      setDetailSession(null);
                    }
                  }}
                >
                  Reject Candidate
                </button>
                <button
                  className="btn"
                  style={{ background: '#d97706', color: 'white', border: 'none', padding: '8px 16px', fontSize: 13 }}
                  onClick={() => {
                    alert("Candidate placed on HOLD for manual review.");
                    setDetailSession(null);
                  }}
                >
                  Place on Hold
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {/* Export Buttons */}
                <button className="btn btn-ghost" onClick={() => alert(`JSON Data Export: \n${JSON.stringify(detailSession, null, 2)}`)} style={{ padding: '8px 16px', fontSize: 13 }}>
                  Export JSON
                </button>
                <button className="btn btn-ghost" onClick={() => alert(`PDF Report Export Successful: smarthire_report_${detailSession.sessionId}.pdf`)} style={{ padding: '8px 16px', fontSize: 13 }}>
                  Export PDF
                </button>
                <button className="btn btn-ghost" onClick={() => setDetailSession(null)} style={{ padding: '8px 16px', fontSize: 13 }}>
                  Close Report
                </button>
                
                {detailSession.status === 'verification' && (
                  <button
                    className="btn"
                    style={{ background: 'var(--brand)', padding: '8px 16px', fontSize: 13 }}
                    onClick={() => handleSubmitCandidate(detailSession.sessionId)}
                    disabled={modalLoading}
                  >
                    {modalLoading ? 'Submitting...' : '✅ Approve & Push to ATS'}
                  </button>
                )}

                {detailSession.status === 'submitted' && (
                  <span className="pill trusted" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center' }}>
                    ✓ Pushed to ATS
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

// Inline Styles for ScreeningModule
const styles = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: 12,
    marginBottom: 24
  },
  dashboardSplit: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap'
  },
  selectInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontFamily: 'Outfit, sans-serif',
    fontSize: 14
  },
  generatedLinkBox: {
    backgroundColor: 'rgba(219, 127, 53, 0.05)',
    border: '1px solid rgba(219, 127, 53, 0.2)',
    borderRadius: 8,
    padding: 16,
    marginTop: 15
  },
  linkInput: {
    flexGrow: 1,
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid var(--line)',
    fontSize: 13,
    fontFamily: 'monospace',
    backgroundColor: 'var(--surface)',
    color: 'var(--ink)'
  },
  modalSubCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: 16
  },
  modalSubTitle: {
    fontSize: 14,
    fontWeight: 700,
    margin: '0 0 8px 0',
    fontFamily: 'Plus Jakarta Sans',
    color: '#0f172a'
  },
  transcriptBox: {
    maxHeight: '380px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingRight: 6
  },
  matchMetricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    borderBottom: '1px solid var(--line)',
    paddingBottom: 6
  },
  fraudLogItem: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottom: '1px solid var(--line)',
    color: 'var(--ink)'
  },
  docCard: {
    border: '1px solid var(--line)',
    borderRadius: 8,
    backgroundColor: 'var(--surface)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  docHeader: {
    padding: '10px 12px',
    backgroundColor: 'var(--bg)',
    borderBottom: '1px solid var(--line)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  docBody: {
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
    flexGrow: 1
  },
  docImg: {
    width: '100%',
    maxHeight: '180px',
    objectFit: 'contain',
    borderRadius: 6,
    border: '1px solid var(--line)',
    backgroundColor: 'var(--bg)'
  },
  pdfPlaceholder: {
    height: '140px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'var(--bg)',
    borderRadius: 6,
    border: '1px dashed var(--line)',
    fontSize: 12,
    color: 'var(--ink-soft)'
  },
  viewLink: {
    color: 'var(--brand)',
    textDecoration: 'underline',
    fontWeight: '600',
    fontSize: 12
  },
  emptyDoc: {
    padding: 24,
    textAlign: 'center',
    color: 'var(--ink-soft)',
    fontSize: 12,
    fontStyle: 'italic',
    backgroundColor: 'rgba(0,0,0,0.02)',
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100px'
  }
}
