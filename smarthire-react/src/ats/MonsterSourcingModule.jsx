import React, { useState, useEffect, useMemo, useCallback } from 'react'

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const IconBriefcase = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)

const IconExternalLink = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const IconTable = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </svg>
)

const IconGrid = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
)

export const IconMonster = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

export default function MonsterSourcingModule({
  currentUser,
  activeJobs = [],
  onCandidateImported
}) {
  const [selectedJobId, setSelectedJobId] = useState('')
  const [jdText, setJdText] = useState('')
  const [location, setLocation] = useState('Columbia, SC')
  const [targetReqForImport, setTargetReqForImport] = useState('')
  const [maxResults, setMaxResults] = useState(10)
  const [interviewModeOverride, setInterviewModeOverride] = useState('auto') // 'auto', 'in_person', 'hybrid', 'remote'
  const [last90DaysOnly, setLast90DaysOnly] = useState(true)

  const [isAutoSourcing, setIsAutoSourcing] = useState(false)
  const [isLiveSearching, setIsLiveSearching] = useState(false)
  const [parsedData, setParsedData] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [viewMode, setViewMode] = useState('cards') // 'cards' or 'table'

  const [copiedQuery, setCopiedQuery] = useState(false)
  const [copiedEmailId, setCopiedEmailId] = useState(null)
  const [copiedPhoneId, setCopiedPhoneId] = useState(null)
  const [sendingEmailId, setSendingEmailId] = useState(null)
  const [sentEmailIds, setSentEmailIds] = useState(new Set())
  const [importedCandidateIds, setImportedCandidateIds] = useState(new Set())
  const [statusMessage, setStatusMessage] = useState(null)
  const [activeOutreachCandidate, setActiveOutreachCandidate] = useState(null)

  // Current selected job object
  const currentJob = useMemo(() => {
    if (!selectedJobId) return null
    return activeJobs.find(j => String(j.id || j.jobId) === String(selectedJobId)) || null
  }, [selectedJobId, activeJobs])

  // Auto-fill default requisition on mount if available
  useEffect(() => {
    if (!selectedJobId && activeJobs.length > 0) {
      // Pick Systems Administrator or Dynamics job as preferred test requisition
      const targetJob = activeJobs.find(j => 
        String(j.id || j.jobId) === '159015' ||
        (j.title && /systems administrator|dynamics|business analyst/i.test(j.title))
      ) || activeJobs[0]

      if (targetJob) {
        handleApplyJob(targetJob, true)
      }
    }
  }, [activeJobs])

  // Applies a selected job and optionally triggers automated sourcing
  const handleApplyJob = (job, autoTrigger = false) => {
    const jobIdStr = String(job.id || job.jobId)
    setSelectedJobId(jobIdStr)
    setTargetReqForImport(jobIdStr)

    const loc = job.location || (job.client && job.client.includes('Carolina') ? 'Columbia, SC' : 'Richmond, VA')
    setLocation(loc)

    const rawDesc = job.description || job.desc || job.jobDescription || `${job.title}\nClient: ${job.client || 'State Agency'}\nLocation: ${loc}`
    setJdText(rawDesc)

    if (autoTrigger) {
      triggerAutoSource(rawDesc, job.title, loc, jobIdStr)
    }
  }

  // Trigger 1-Click Unified Auto-Sourcing
  const triggerAutoSource = async (customJd = null, customTitle = null, customLoc = null, customReq = null) => {
    const textToUse = customJd || jdText
    if (!textToUse || textToUse.trim().length < 5) {
      setStatusMessage({ type: 'error', text: 'Please select a requisition or paste a Job Description first.' })
      return
    }

    setIsAutoSourcing(true)
    setStatusMessage(null)

    const titleToUse = customTitle || currentJob?.title || null
    const locToUse = customLoc || location || 'United States'

    try {
      const res = await fetch('/api/recruiter/auto-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text: textToUse,
          job_title: titleToUse,
          location: locToUse,
          max_results: maxResults,
          interview_mode: interviewModeOverride !== 'auto' ? interviewModeOverride : null
        })
      })

      const data = await res.json()
      if (data && data.success) {
        setParsedData(data.jd_parsed)
        setCandidates(data.candidates || [])
        setStatusMessage({
          type: 'success',
          text: `Auto-sourced ${data.candidates?.length || 0} top candidates active in last 90 days for "${data.jd_parsed?.job_title}".`
        })
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Auto-sourcing failed to complete.' })
      }
    } catch (err) {
      console.error('[MonsterAutoSource] Error:', err)
      setStatusMessage({ type: 'error', text: 'Failed to connect to auto-sourcing engine.' })
    } finally {
      setIsAutoSourcing(false)
    }
  }

  // Copy Monster Boolean Query
  const handleCopyQuery = () => {
    if (!parsedData?.monster_boolean_query) return
    navigator.clipboard.writeText(parsedData.monster_boolean_query)
    setCopiedQuery(true)
    setTimeout(() => setCopiedQuery(false), 2000)
  }

  // Copy Direct Contact Info
  const handleCopyContact = (type, val, candId) => {
    if (!val) return
    navigator.clipboard.writeText(val)
    if (type === 'phone') {
      setCopiedPhoneId(candId)
      setTimeout(() => setCopiedPhoneId(null), 2000)
    } else {
      setCopiedEmailId(candId)
      setTimeout(() => setCopiedEmailId(null), 2000)
    }
  }

  // Send Direct Outreach Email via SMTP
  const handleSendOutreachEmail = async (cand) => {
    setSendingEmailId(cand.id)
    try {
      const res = await fetch('/api/recruiter/monster/send-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: cand.email,
          candidateName: cand.name,
          subject: `Exciting ${parsedData?.job_title || 'Role'} Opportunity — Coolsoft LLC`,
          emailBody: cand.outreach_email,
          candidateId: cand.id
        })
      })

      const data = await res.json()
      if (data && data.success) {
        setSentEmailIds(prev => new Set([...prev, cand.id]))
        setStatusMessage({
          type: 'success',
          text: `Outreach email successfully sent to ${cand.name} (${cand.email}).`
        })
        setActiveOutreachCandidate(null)
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to dispatch outreach email.' })
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error connecting to email dispatcher service.' })
    } finally {
      setSendingEmailId(null)
    }
  }

  // Import Candidate directly into SmartHire ATS
  const handleImportToAts = async (cand) => {
    try {
      const res = await fetch('/api/recruiter/monster/import-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: cand,
          targetReqId: targetReqForImport || selectedJobId || null
        })
      })
      const data = await res.json()
      if (data && data.success) {
        setImportedCandidateIds(prev => new Set([...prev, cand.id]))
        setStatusMessage({
          type: 'success',
          text: `Imported ${cand.name} into SmartHire ATS under Req #${targetReqForImport || 'Talent Pool'}.`
        })
        if (onCandidateImported && typeof onCandidateImported === 'function') {
          onCandidateImported(data.candidate)
        }
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to import candidate into ATS.' })
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error connecting to ATS import service.' })
    }
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#F8FAFC',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#0F172A',
      overflowY: 'auto'
    }}>
      {/* 1. Header Bar */}
      <div style={{
        padding: '16px 28px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Monster+ AI Candidate Sourcing & Good Match Engine
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '2px 8px',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              color: '#065F46'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
              Monster+ Employer Session Active
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              color: '#1E40AF'
            }}>
              Active in Last 90 Days Only
            </span>
          </div>
          <p style={{ margin: '3px 0 0 0', fontSize: 12.5, color: '#64748B' }}>
            Automated JD parsing, Monster Boolean generation, In-Person / Hybrid location matching, and 1-click candidate outreach.
          </p>
        </div>

        {/* Global Feedback Status Banner */}
        {statusMessage && (
          <div style={{
            padding: '7px 14px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: statusMessage.type === 'success' ? '#F0FDF4' : (statusMessage.type === 'info' ? '#EFF6FF' : '#FEF2F2'),
            color: statusMessage.type === 'success' ? '#166534' : (statusMessage.type === 'info' ? '#1E40AF' : '#991B1B'),
            border: `1px solid ${statusMessage.type === 'success' ? '#BBF7D0' : (statusMessage.type === 'info' ? '#BFDBFE' : '#FECACA')}`
          }}>
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 800, padding: 0 }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 2. Main Workspace Layout */}
      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1440, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* SECTION A: Sourcing Control Panel */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          border: '1px solid #E2E8F0',
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          {/* Top Row: Requisition Selector & 1-Click Action */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconBriefcase /> Select Requisition:
              </span>
              <select
                value={selectedJobId}
                onChange={(e) => {
                  const job = activeJobs.find(j => String(j.id || j.jobId) === e.target.value)
                  if (job) handleApplyJob(job, true)
                  else setSelectedJobId(e.target.value)
                }}
                style={{
                  padding: '7px 12px',
                  fontSize: 13,
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  fontWeight: 700,
                  outline: 'none',
                  minWidth: 320,
                  maxWidth: 480,
                  cursor: 'pointer'
                }}
              >
                <option value="">-- Choose from 180 Active Requisitions --</option>
                {activeJobs.map(j => (
                  <option key={j.id || j.jobId} value={j.id || j.jobId}>
                    #{j.id || j.jobId} — {j.title} ({j.client || 'Client'} · {j.location || 'Remote'})
                  </option>
                ))}
              </select>

              {/* Detected Job Details Badges */}
              {currentJob && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ padding: '3px 8px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#334155' }}>
                    Client: {currentJob.client || 'State Agency'}
                  </span>
                  <span style={{ padding: '3px 8px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#334155' }}>
                    Location: {location}
                  </span>
                </div>
              )}
            </div>

            {/* Primary 1-Click Action Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => triggerAutoSource()}
                disabled={isAutoSourcing}
                style={{
                  padding: '9px 20px',
                  backgroundColor: '#1E293B',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  cursor: isAutoSourcing ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <IconSearch />
                {isAutoSourcing ? 'Auto-Sourcing Monster+ Candidates...' : 'Auto-Source Candidates (1-Click)'}
              </button>
            </div>
          </div>

          {/* Sourcing Filters Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            paddingTop: 10,
            borderTop: '1px solid #F1F5F9',
            fontSize: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {/* Interview Mode Detection & Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Interview Mode:</span>
                <select
                  value={interviewModeOverride}
                  onChange={(e) => {
                    setInterviewModeOverride(e.target.value)
                    if (parsedData) triggerAutoSource()
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    borderRadius: 5,
                    border: '1px solid #CBD5E1',
                    fontWeight: 700,
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="auto">
                    Auto-Detect {parsedData?.interview_mode?.badge ? `(${parsedData.interview_mode.badge})` : ''}
                  </option>
                  <option value="in_person">In-Person Onsite (Strict Local Candidates)</option>
                  <option value="hybrid">Hybrid (Local / Relocatable)</option>
                  <option value="remote">Remote / Video (Nationwide)</option>
                </select>
              </div>

              {/* Target Location */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Location:</span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Columbia, SC"
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    borderRadius: 5,
                    border: '1px solid #CBD5E1',
                    fontWeight: 600,
                    width: 130,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Recency Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  padding: '3px 8px',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#065F46'
                }}>
                  Activity: Last 90 Days Only
                </span>
              </div>
            </div>

            {/* View Mode Toggle: Cards vs Table */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', padding: '2px', borderRadius: 6 }}>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'cards' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'cards' ? '#0F172A' : '#64748B',
                  boxShadow: viewMode === 'cards' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <IconGrid /> Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'table' ? '#0F172A' : '#64748B',
                  boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <IconTable /> Excel Grid
              </button>
            </div>
          </div>
        </div>

        {/* SECTION B: Parsed Requirements & Monster Boolean Query */}
        {parsedData && (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            padding: '14px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                  Target Role: {parsedData.job_title}
                </span>

                {/* Interview Mode Badge */}
                {parsedData.interview_mode && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: parsedData.interview_mode.badgeBg || '#EFF6FF',
                    color: parsedData.interview_mode.badgeColor || '#1E40AF',
                    border: `1px solid ${parsedData.interview_mode.badgeBorder || '#BFDBFE'}`
                  }}>
                    {parsedData.interview_mode.label}
                  </span>
                )}

                <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>
                  Exp: {parsedData.experience_min_years || 4} - {parsedData.experience_max_years || 8} Yrs
                </span>
              </div>

              {/* 1-Click Copy Boolean Query Button */}
              <button
                type="button"
                onClick={handleCopyQuery}
                style={{
                  padding: '5px 12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 5,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {copiedQuery ? <><IconCheck /> Copied Boolean</> : <><IconCopy /> Copy Monster Boolean</>}
              </button>
            </div>

            {/* Boolean Query Monospace Display */}
            {parsedData.monster_boolean_query && (
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 5,
                fontSize: 12,
                fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                color: '#1E293B',
                fontWeight: 600,
                overflowX: 'auto',
                whiteSpace: 'nowrap'
              }}>
                {parsedData.monster_boolean_query}
              </div>
            )}

            {/* Must-Have Skills Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                Required Skills:
              </span>
              {(parsedData.must_have_skills || []).map((sk, idx) => (
                <span key={idx} style={{
                  padding: '2px 8px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: 4,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: '#1E40AF'
                }}>
                  {sk}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SECTION C: Sourced Monster Candidates */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                Sourced Monster+ Candidates ({candidates.length})
              </h2>
              <span style={{ fontSize: 11.5, color: '#059669', fontWeight: 700, backgroundColor: '#ECFDF5', padding: '1px 7px', borderRadius: 4, border: '1px solid #A7F3D0' }}>
                Active in Last 90 Days
              </span>
            </div>

            <span style={{ fontSize: 12, color: '#64748B' }}>
              Showing verified employer profiles with direct phone and email
            </span>
          </div>

          {/* Loading Skeleton */}
          {isAutoSourcing && (
            <div style={{
              padding: '36px 20px',
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              textAlign: 'center',
              color: '#475569',
              fontSize: 13,
              fontWeight: 600
            }}>
              Extracting candidate profiles from Monster+ employer talent pool (Last 90 Days)...
            </div>
          )}

          {/* VIEW 1: Candidate Cards View */}
          {viewMode === 'cards' && !isAutoSourcing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {candidates.map((cand) => {
                const isHighMatch = (cand.match_score || 0) >= 80
                const isGoodMatch = (cand.match_score || 0) >= 65 && (cand.match_score || 0) < 80
                const isImported = importedCandidateIds.has(cand.id)
                const isEmailSent = sentEmailIds.has(cand.id)
                const isOutreachOpen = activeOutreachCandidate?.id === cand.id

                return (
                  <div
                    key={cand.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      padding: '18px 22px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    {/* Header Row: Name, Match Score & Local Fit */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                            {cand.name}
                          </h3>
                          <span style={{ padding: '2px 7px', backgroundColor: '#F1F5F9', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#475569' }}>
                            {cand.years_of_experience || 5} Yrs
                          </span>
                          <span style={{ fontSize: 11.5, color: '#059669', fontWeight: 700 }}>
                            {cand.last_active || 'Monster+ Active'}
                          </span>
                          {cand.local_fit_badge && (
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              backgroundColor: cand.is_local_match ? '#ECFDF5' : '#FEF2F2',
                              color: cand.is_local_match ? '#065F46' : '#991B1B',
                              border: `1px solid ${cand.is_local_match ? '#A7F3D0' : '#FECACA'}`
                            }}>
                              {cand.local_fit_badge}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginTop: 3 }}>
                          {cand.title}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                          {cand.company} · {cand.location}
                        </div>
                      </div>

                      {/* Match Score Badge */}
                      <div style={{
                        padding: '6px 14px',
                        borderRadius: 6,
                        backgroundColor: isHighMatch ? '#ECFDF5' : (isGoodMatch ? '#FFFBEB' : '#F1F5F9'),
                        border: `1px solid ${isHighMatch ? '#A7F3D0' : (isGoodMatch ? '#FDE68A' : '#CBD5E1')}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end'
                      }}>
                        <div style={{
                          fontSize: 15,
                          fontWeight: 900,
                          color: isHighMatch ? '#065F46' : (isGoodMatch ? '#92400E' : '#334155'),
                          lineHeight: 1.1
                        }}>
                          {cand.match_score || 75}%
                        </div>
                        <div style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: isHighMatch ? '#047857' : (isGoodMatch ? '#B45309' : '#64748B'),
                          textTransform: 'uppercase'
                        }}>
                          {cand.match_tier || 'Good Match'}
                        </div>
                      </div>
                    </div>

                    {/* Contact Info Bar (Direct Phone, Email, Work Auth) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      flexWrap: 'wrap',
                      padding: '8px 12px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#334155',
                      marginBottom: 12
                    }}>
                      {/* Phone */}
                      {cand.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <IconPhone />
                          <strong>{cand.phone}</strong>
                          <button
                            type="button"
                            onClick={() => handleCopyContact('phone', cand.phone, cand.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#2563EB', fontSize: 11, fontWeight: 700 }}
                          >
                            {copiedPhoneId === cand.id ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      )}

                      {/* Email */}
                      {cand.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <IconMail />
                          <strong>{cand.email}</strong>
                          <button
                            type="button"
                            onClick={() => handleCopyContact('email', cand.email, cand.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#2563EB', fontSize: 11, fontWeight: 700 }}
                          >
                            {copiedEmailId === cand.id ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      )}

                      {/* Work Auth */}
                      {cand.work_auth && (
                        <div>
                          Auth: <strong>{cand.work_auth}</strong>
                        </div>
                      )}

                      {/* Monster Profile Link */}
                      {cand.profile_url && cand.profile_url !== '#' && (
                        <a
                          href={cand.profile_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: '#2563EB',
                            fontWeight: 700,
                            textDecoration: 'none',
                            marginLeft: 'auto'
                          }}
                        >
                          Monster Profile <IconExternalLink />
                        </a>
                      )}
                    </div>

                    {/* Matched Skills vs Missing Skills */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#065F46', textTransform: 'uppercase' }}>
                          Matched Skills:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {(cand.matched_skills || []).map((sk, idx) => (
                            <span key={idx} style={{
                              padding: '2px 7px',
                              backgroundColor: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              borderRadius: 4,
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: '#065F46'
                            }}>
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      {cand.missing_skills && cand.missing_skills.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#991B1B', textTransform: 'uppercase' }}>
                            Missing:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {cand.missing_skills.map((sk, idx) => (
                              <span key={idx} style={{
                                padding: '2px 7px',
                                backgroundColor: '#FEF2F2',
                                border: '1px solid #FECACA',
                                borderRadius: 4,
                                fontSize: 11.5,
                                fontWeight: 600,
                                color: '#991B1B'
                              }}>
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recruiter Assessment Note */}
                    {cand.recruiter_notes && (
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#F8FAFC',
                        borderRadius: 5,
                        fontSize: 12,
                        color: '#475569',
                        borderLeft: '3px solid #3B82F6',
                        marginBottom: 12
                      }}>
                        <strong>AI Assessment:</strong> {cand.recruiter_notes}
                      </div>
                    )}

                    {/* Email Outreach Box (Expandable) */}
                    {isOutreachOpen && (
                      <div style={{
                        marginTop: 12,
                        padding: '12px 14px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        borderRadius: 6,
                        marginBottom: 12
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>
                            Direct Email Outreach (Coolsoft LLC Pitch)
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(cand.outreach_email)
                                setCopiedEmailId(cand.id)
                                setTimeout(() => setCopiedEmailId(null), 2000)
                              }}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                borderRadius: 4,
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                color: '#334155'
                              }}
                            >
                              {copiedEmailId === cand.id ? 'Copied' : 'Copy Text'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendOutreachEmail(cand)}
                              disabled={sendingEmailId === cand.id}
                              style={{
                                padding: '4px 12px',
                                backgroundColor: '#0F766E',
                                border: 'none',
                                borderRadius: 4,
                                fontSize: 11.5,
                                fontWeight: 800,
                                color: '#FFFFFF',
                                cursor: sendingEmailId === cand.id ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5
                              }}
                            >
                              <IconMail />
                              {sendingEmailId === cand.id ? 'Sending...' : 'Send Email Now'}
                            </button>
                          </div>
                        </div>

                        <pre style={{
                          margin: 0,
                          padding: '10px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: 4,
                          fontSize: 11.5,
                          fontFamily: 'inherit',
                          lineHeight: 1.5,
                          color: '#1E293B',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {cand.outreach_email}
                        </pre>
                      </div>
                    )}

                    {/* Action Buttons Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                      <button
                        type="button"
                        onClick={() => setActiveOutreachCandidate(isOutreachOpen ? null : cand)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: isOutreachOpen ? '#EFF6FF' : '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: 5,
                          fontSize: 12,
                          fontWeight: 700,
                          color: isOutreachOpen ? '#1E40AF' : '#334155',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <IconMail />
                        {isOutreachOpen ? 'Close Email Draft' : 'Email Outreach Draft'}
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isEmailSent && (
                          <span style={{ fontSize: 11.5, color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IconCheck /> Email Sent
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSendOutreachEmail(cand)}
                          disabled={sendingEmailId === cand.id}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#0F766E',
                            border: 'none',
                            borderRadius: 5,
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#FFFFFF',
                            cursor: sendingEmailId === cand.id ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                        >
                          <IconMail />
                          {sendingEmailId === cand.id ? 'Sending...' : '1-Click Email'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleImportToAts(cand)}
                          disabled={isImported}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: isImported ? '#ECFDF5' : '#1E293B',
                            border: isImported ? '1px solid #A7F3D0' : 'none',
                            borderRadius: 5,
                            fontSize: 12,
                            fontWeight: 700,
                            color: isImported ? '#065F46' : '#FFFFFF',
                            cursor: isImported ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          {isImported ? <><IconCheck /> In ATS Pipeline</> : 'Import to SmartHire ATS'}
                        </button>
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>
          )}

          {/* VIEW 2: Excel-Style Spreadsheet Grid (Rule 9) */}
          {viewMode === 'table' && !isAutoSourcing && (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              overflowX: 'auto',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: 12,
                fontFamily: 'inherit'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 800, color: '#334155', borderRight: '1px solid #CBD5E1', width: 45 }}>#</th>
                    <th style={{ padding: '8px 12px', fontWeight: 800, color: '#334155', borderRight: '1px solid #CBD5E1' }}>Candidate Name</th>
                    <th style={{ padding: '8px 12px', fontWeight: 800, color: '#334155', borderRight: '1px solid #CBD5E1' }}>Role / Current Title</th>
                    <th style={{ padding: '8px 12px', fontWeight: 800, color: '#334155', borderRight: '1px solid #CBD5E1' }}>Location & Local Fit</th>
                    <th style={{ padding: '8px 12px', fontWeight: 800, color: '#334155', borderRight: '1px solid #CBD5E1' }}>Visa / Auth</th>
                    <th style={{ padding: '8px 12px', fontWeight: 800, color: '#334155', borderRight: '1px solid #CBD5E1' }}>Direct Phone</th>
                    <th style={{ padding: '8px 12px', fontWeight: 800, color: '#334155', borderRight: '1px solid #CBD5E1' }}>Monster Email</th>
                    <th style={{ padding: '8px 12px', fontWeight: 800, color: '#334155', borderRight: '1px solid #CBD5E1', textAlign: 'center' }}>Match %</th>
                    <th style={{ padding: '8px 12px', fontWeight: 800, color: '#334155', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((cand, idx) => {
                    const isImported = importedCandidateIds.has(cand.id)
                    const isEmailSent = sentEmailIds.has(cand.id)
                    const isHigh = (cand.match_score || 0) >= 80

                    return (
                      <tr
                        key={cand.id}
                        style={{
                          backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                          borderBottom: '1px solid #E2E8F0',
                          height: 42
                        }}
                      >
                        <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: '#64748B' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: '#0F172A' }}>
                          {cand.name}
                          <div style={{ fontSize: 10.5, color: '#059669', fontWeight: 700 }}>
                            {cand.last_active}
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', color: '#334155', fontWeight: 600 }}>
                          {cand.title}
                        </td>
                        <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0' }}>
                          <div style={{ color: '#0F172A', fontWeight: 600 }}>{cand.location}</div>
                          <span style={{
                            display: 'inline-block',
                            marginTop: 2,
                            padding: '1px 6px',
                            borderRadius: 3,
                            fontSize: 10,
                            fontWeight: 700,
                            backgroundColor: cand.is_local_match ? '#ECFDF5' : '#FEF2F2',
                            color: cand.is_local_match ? '#065F46' : '#991B1B'
                          }}>
                            {cand.local_fit_badge || 'Regional'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                          {cand.work_auth}
                        </td>
                        <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: '#0F172A' }}>
                          {cand.phone}
                        </td>
                        <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', fontWeight: 600, color: '#2563EB' }}>
                          {cand.email}
                        </td>
                        <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 800,
                            backgroundColor: isHigh ? '#ECFDF5' : '#FFFBEB',
                            color: isHigh ? '#065F46' : '#92400E',
                            border: `1px solid ${isHigh ? '#A7F3D0' : '#FDE68A'}`
                          }}>
                            {cand.match_score}%
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleSendOutreachEmail(cand)}
                              disabled={sendingEmailId === cand.id}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: isEmailSent ? '#ECFDF5' : '#0F766E',
                                color: isEmailSent ? '#065F46' : '#FFFFFF',
                                border: isEmailSent ? '1px solid #A7F3D0' : 'none',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              {isEmailSent ? 'Sent' : 'Email'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleImportToAts(cand)}
                              disabled={isImported}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: isImported ? '#ECFDF5' : '#1E293B',
                                color: isImported ? '#065F46' : '#FFFFFF',
                                border: isImported ? '1px solid #A7F3D0' : 'none',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: isImported ? 'default' : 'pointer'
                              }}
                            >
                              {isImported ? 'In ATS' : 'Import'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
