import React, { useState, useEffect, useMemo } from 'react'

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const IconMail = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

const IconPhone = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const IconBriefcase = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)

const IconExternalLink = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const IconTable = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </svg>
)

const IconGrid = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const [maxResults, setMaxResults] = useState(12)
  const [recencyDays, setRecencyDays] = useState(90) // 30, 60, 90, 180, 9999
  const [interviewModeOverride, setInterviewModeOverride] = useState('auto')

  const [isAutoSourcing, setIsAutoSourcing] = useState(false)
  const [parsedData, setParsedData] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [viewMode, setViewMode] = useState('cards') // 'cards' or 'table'
  const [selectedVariantId, setSelectedVariantId] = useState('variant_1')
  const [activeBooleanQuery, setActiveBooleanQuery] = useState('')

  const [copiedQuery, setCopiedQuery] = useState(false)
  const [copiedEmailId, setCopiedEmailId] = useState(null)
  const [copiedPhoneId, setCopiedPhoneId] = useState(null)
  const [sendingEmailId, setSendingEmailId] = useState(null)
  const [sentEmailIds, setSentEmailIds] = useState(new Set())
  const [importedCandidateIds, setImportedCandidateIds] = useState(new Set())
  const [statusMessage, setStatusMessage] = useState(null)
  const [activeOutreachCandidate, setActiveOutreachCandidate] = useState(null)
  const [showJdEditor, setShowJdEditor] = useState(false)
  const [internalJobs, setInternalJobs] = useState([])

  // Active Monster Account State
  const [monsterAccountEmail, setMonsterAccountEmail] = useState('')

  const activeUserEmail = useMemo(() => {
    if (currentUser?.email) return currentUser.email.toLowerCase().trim()
    try {
      const stored = localStorage.getItem('smarthire_user')
      if (stored) {
        const u = JSON.parse(stored)
        if (u.email) return u.email.toLowerCase().trim()
      }
    } catch (e) {}
    return 'omkesh@coolsofttech.com'
  }, [currentUser])

  // Load live requisitions from ATS
  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.jobs || [])
        if (list && list.length > 0) {
          setInternalJobs(list)
        }
      })
      .catch(err => console.warn('[MonsterModule] Jobs fetch error:', err))

    // Fetch user monster credentials
    fetch(`/api/recruiter/monster-credentials?email=${encodeURIComponent(activeUserEmail)}`)
      .then(res => res.json())
      .then(d => {
        if (d && d.success && d.config) {
          setMonsterAccountEmail(d.config.monsterEmail || activeUserEmail)
          if (d.config.hasPassword) setMonsterAccountPass('••••••••••••')
        }
      })
      .catch(() => {})
  }, [activeUserEmail])

  // Merged Requisitions
  const allRequisitions = useMemo(() => {
    const map = new Map()
    ;(activeJobs || []).forEach(j => {
      const id = String(j.id || j.jobId || j.reqId || '').replace(/^J-/, '').trim()
      if (id) map.set(id, { ...j, id })
    })

    internalJobs.forEach(j => {
      const id = String(j.id || j.jobId || j.reqId || '').replace(/^J-/, '').trim()
      if (id) {
        const existing = map.get(id) || {}
        map.set(id, {
          ...existing,
          ...j,
          id,
          title: j.title || existing.title || `Requisition #${id}`,
          client: j.client || existing.client || 'State Client',
          location: j.location || existing.location || 'Columbia, SC',
          workMode: j.workMode || j.type || existing.workMode || 'Onsite',
          skills: (Array.isArray(j.skills) && j.skills.length > 0) ? j.skills : (existing.skills || []),
          description: j.description || j.rawDescription || existing.description || ''
        })
      }
    })

    return Array.from(map.values())
  }, [activeJobs, internalJobs])

  const currentJob = useMemo(() => {
    if (!selectedJobId) return null
    return allRequisitions.find(j => String(j.id) === String(selectedJobId)) || null
  }, [selectedJobId, allRequisitions])

  // Auto-fill default requisition on mount once requisitions are loaded
  useEffect(() => {
    if (!selectedJobId && allRequisitions.length > 0) {
      const targetJob = allRequisitions.find(j =>
        String(j.id) === '159023' ||
        String(j.id) === '159015' ||
        (j.title && /business analyst|systems administrator|dynamics/i.test(j.title))
      ) || allRequisitions[0]

      if (targetJob) {
        handleApplyJob(targetJob, true)
      }
    }
  }, [allRequisitions])

  // Handle Requisition Selection
  const handleApplyJob = (job, autoTrigger = true) => {
    const jobIdStr = String(job.id || job.jobId || job.reqId).replace(/^J-/, '').trim()
    setSelectedJobId(jobIdStr)
    setTargetReqForImport(jobIdStr)

    const loc = job.location || (job.client && job.client.includes('Carolina') ? 'Columbia, SC' : 'Richmond, VA')
    setLocation(loc)

    const wm = (job.workMode || job.type || '').toLowerCase()
    let effectiveMode = 'auto'
    if (wm.includes('onsite') || wm.includes('in-person')) {
      effectiveMode = 'in_person'
      setInterviewModeOverride('in_person')
    } else if (wm.includes('hybrid')) {
      effectiveMode = 'hybrid'
      setInterviewModeOverride('hybrid')
    } else if (wm.includes('remote')) {
      effectiveMode = 'remote'
      setInterviewModeOverride('remote')
    } else {
      setInterviewModeOverride('auto')
    }

    const rawDesc = job.description || job.rawDescription || job.jobDescription || `${job.title}\nClient: ${job.client || 'State Agency'}\nLocation: ${loc}\nRequired Skills: ${(job.skills || []).join(', ')}`
    setJdText(rawDesc)

    if (autoTrigger) {
      triggerAutoSource(rawDesc, job.title, loc, jobIdStr, job.skills, job, effectiveMode, recencyDays)
    }
  }

  // Trigger Unified Auto-Sourcing
  const triggerAutoSource = async (
    customJd = null,
    customTitle = null,
    customLoc = null,
    customReq = null,
    customSkills = null,
    jobObj = null,
    overrideMode = null,
    overrideRecency = null
  ) => {
    const textToUse = customJd || jdText
    if (!textToUse || textToUse.trim().length < 5) {
      setStatusMessage({ type: 'error', text: 'Please select a requisition or paste a Job Description first.' })
      return
    }

    setIsAutoSourcing(true)
    setStatusMessage(null)

    const reqToUse = customReq || selectedJobId
    const titleToUse = customTitle || jobObj?.title || currentJob?.title || null
    const locToUse = customLoc || location || jobObj?.location || 'Columbia, SC'
    const skillsToUse = customSkills || jobObj?.skills || currentJob?.skills || []
    const modeToUse = overrideMode || (interviewModeOverride !== 'auto' ? interviewModeOverride : null)
    const recencyToUse = overrideRecency !== null ? overrideRecency : recencyDays

    try {
      const res = await fetch('/api/recruiter/auto-source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-recruiter-email': activeUserEmail
        },
        body: JSON.stringify({
          req_id: reqToUse,
          jd_text: textToUse,
          job_title: titleToUse,
          location: locToUse,
          skills: skillsToUse,
          max_results: maxResults,
          max_recency_days: recencyToUse,
          interview_mode: modeToUse
        })
      })

      const data = await res.json()
      if (data && data.success) {
        setParsedData(data.jd_parsed)
        const variants = data.boolean_variants || data.jd_parsed?.boolean_variants || []
        if (variants.length > 0) {
          const first = variants[0]
          setSelectedVariantId(first.id)
          setActiveBooleanQuery(first.query)
        } else {
          setActiveBooleanQuery(data.boolean_query || data.jd_parsed?.monster_boolean_query || '')
        }
        setCandidates(data.candidates || [])
        setStatusMessage({
          type: 'success',
          text: `Found ${data.candidates?.length || 0} top candidate matches for "${data.jd_parsed?.job_title}".`
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

  // Switch Boolean Variant
  const handleSelectVariant = (variant) => {
    setSelectedVariantId(variant.id)
    setActiveBooleanQuery(variant.query)
    // Instant feedback toast
    setStatusMessage({
      type: 'info',
      text: `Active Monster Query updated to "${variant.name}".`
    })
    setTimeout(() => setStatusMessage(null), 3000)
  }

  // Copy Monster Boolean Query
  const handleCopyQuery = () => {
    const q = activeBooleanQuery || parsedData?.monster_boolean_query
    if (!q) return
    navigator.clipboard.writeText(q)
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

  // Send Direct Outreach Email with Full JD
  const handleSendOutreachEmail = async (cand, customBody = null) => {
    setSendingEmailId(cand.id)
    try {
      const emailBodyToSend = customBody || cand.outreach_email
      const res = await fetch('/api/recruiter/monster/send-outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-recruiter-email': activeUserEmail
        },
        body: JSON.stringify({
          toEmail: cand.email,
          candidateName: cand.name,
          subject: `Immediate Opportunity: ${parsedData?.job_title || 'Technical Specialist'} — Coolsoft LLC`,
          emailBody: emailBodyToSend,
          candidateId: cand.id,
          fromEmail: activeUserEmail
        })
      })

      const data = await res.json()
      if (data && data.success) {
        setSentEmailIds(prev => new Set([...prev, cand.id]))
        setStatusMessage({
          type: 'success',
          text: `Outreach email delivered to ${cand.name} (${cand.email}).`
        })
        setActiveOutreachCandidate(null)
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to dispatch email. Please verify your App Password in Monster & Email Settings.'
        })
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
        headers: {
          'Content-Type': 'application/json',
          'x-recruiter-email': activeUserEmail
        },
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



  // Filtered candidate list based on active recency
  const visibleCandidates = useMemo(() => {
    if (recencyDays >= 365) return candidates
    return candidates.filter(c => (c.last_active_days || 0) <= recencyDays)
  }, [candidates, recencyDays])

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
      {/* 1. Header Bar: Clean, Left-Aligned, No Redundant Bloat */}
      <div style={{
        padding: '14px 24px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Monster+ Candidate Sourcing
          </h1>
          <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#64748B' }}>
            Multi-variant Boolean queries, 3-criteria candidate matching, and 1-click outreach with full JD.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Active Monster Account Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 11px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: 6,
            fontSize: 12,
            color: '#334155'
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
            <span>Monster Account: <strong>{monsterAccountEmail || activeUserEmail}</strong></span>
          </div>

          {/* View Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, backgroundColor: '#F1F5F9', padding: '2px', borderRadius: 6 }}>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                border: 'none',
                borderRadius: 5,
                fontSize: 11.5,
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
                padding: '5px 10px',
                border: 'none',
                borderRadius: 5,
                fontSize: 11.5,
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

      {/* Global Status Banner */}
      {statusMessage && (
        <div style={{
          padding: '8px 24px',
          fontSize: 12,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: statusMessage.type === 'success' ? '#F0FDF4' : (statusMessage.type === 'info' ? '#EFF6FF' : '#FEF2F2'),
          color: statusMessage.type === 'success' ? '#166534' : (statusMessage.type === 'info' ? '#1E40AF' : '#991B1B'),
          borderBottom: `1px solid ${statusMessage.type === 'success' ? '#BBF7D0' : (statusMessage.type === 'info' ? '#BFDBFE' : '#FECACA')}`
        }}>
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Main Workspace Layout */}
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* SECTION A: Sourcing Control Panel */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          border: '1px solid #E2E8F0',
          padding: '14px 18px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          {/* Top Row: Requisition Selection & 1-Click Action */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 5 }}>
                <IconBriefcase /> Requisition:
              </span>
              <select
                value={selectedJobId}
                onChange={(e) => {
                  const val = e.target.value
                  setSelectedJobId(val)
                  const job = allRequisitions.find(j => String(j.id) === String(val))
                  if (job) handleApplyJob(job, true)
                }}
                style={{
                  padding: '6px 10px',
                  fontSize: 12.5,
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
                <option value="">-- Choose from {allRequisitions.length || 180} Active Requisitions --</option>
                {allRequisitions.map(j => (
                  <option key={j.id} value={j.id}>
                    #{j.id} — {j.title} ({j.client || 'State Agency'} · {j.location || 'Remote'})
                  </option>
                ))}
              </select>

              {currentJob && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ padding: '2px 7px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#334155' }}>
                    Client: {currentJob.client || 'State Client'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowJdEditor(!showJdEditor)}
                    style={{
                      padding: '2px 7px',
                      backgroundColor: showJdEditor ? '#EFF6FF' : '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      color: showJdEditor ? '#1E40AF' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {showJdEditor ? 'Hide JD' : `View / Edit JD (${jdText.length} chars)`}
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => triggerAutoSource(jdText, currentJob?.title, location, selectedJobId, currentJob?.skills, currentJob, interviewModeOverride, recencyDays)}
              disabled={isAutoSourcing}
              style={{
                padding: '8px 18px',
                backgroundColor: '#1E293B',
                border: 'none',
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 800,
                color: '#FFFFFF',
                cursor: isAutoSourcing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 7
              }}
            >
              <IconSearch />
              {isAutoSourcing ? 'Sourcing Candidates...' : 'Auto-Source Candidates'}
            </button>
          </div>

          {/* Collapsible JD Editor */}
          {showJdEditor && (
            <div style={{
              marginBottom: 12,
              padding: 10,
              backgroundColor: '#F8FAFC',
              borderRadius: 6,
              border: '1px solid #CBD5E1'
            }}>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={6}
                style={{
                  width: '100%',
                  padding: 8,
                  fontSize: 11.5,
                  fontFamily: 'monospace',
                  borderRadius: 4,
                  border: '1px solid #CBD5E1',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {/* Sourcing Filters Bar: Month Recency, Location, Interview Mode */}
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
              {/* Recency / Months Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#475569', fontWeight: 700 }}>Activity / Update:</span>
                <select
                  value={recencyDays}
                  onChange={(e) => {
                    const days = Number(e.target.value)
                    setRecencyDays(days)
                    if (parsedData) {
                      triggerAutoSource(jdText, currentJob?.title, location, selectedJobId, currentJob?.skills, currentJob, interviewModeOverride, days)
                    }
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11.5,
                    borderRadius: 5,
                    border: '1px solid #CBD5E1',
                    fontWeight: 700,
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value={30}>Last 30 Days (1 Month)</option>
                  <option value={60}>Last 60 Days (2 Months)</option>
                  <option value={90}>Last 90 Days (3 Months)</option>
                  <option value={180}>Last 180 Days (6 Months)</option>
                  <option value={9999}>All Active Candidates</option>
                </select>
              </div>

              {/* Location Input & Quick Picks */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#475569', fontWeight: 700 }}>Location:</span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onBlur={() => {
                    if (parsedData) triggerAutoSource(jdText, currentJob?.title, location, selectedJobId, currentJob?.skills, currentJob, interviewModeOverride, recencyDays)
                  }}
                  placeholder="e.g. Columbia, SC"
                  style={{
                    padding: '4px 8px',
                    fontSize: 11.5,
                    borderRadius: 5,
                    border: '1px solid #CBD5E1',
                    fontWeight: 600,
                    width: 120,
                    outline: 'none'
                  }}
                />
                <div style={{ display: 'flex', gap: 4 }}>
                  {['Columbia, SC', 'Richmond, VA', 'Remote'].map((locName) => (
                    <button
                      key={locName}
                      type="button"
                      onClick={() => {
                        setLocation(locName)
                        triggerAutoSource(jdText, currentJob?.title, locName, selectedJobId, currentJob?.skills, currentJob, interviewModeOverride, recencyDays)
                      }}
                      style={{
                        padding: '2px 6px',
                        backgroundColor: location === locName ? '#EFF6FF' : '#F1F5F9',
                        color: location === locName ? '#1E40AF' : '#475569',
                        border: `1px solid ${location === locName ? '#BFDBFE' : '#E2E8F0'}`,
                        borderRadius: 4,
                        fontSize: 10.5,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {locName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interview Mode */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#475569', fontWeight: 700 }}>Interview:</span>
                <select
                  value={interviewModeOverride}
                  onChange={(e) => {
                    setInterviewModeOverride(e.target.value)
                    if (parsedData) triggerAutoSource(jdText, currentJob?.title, location, selectedJobId, currentJob?.skills, currentJob, e.target.value, recencyDays)
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11.5,
                    borderRadius: 5,
                    border: '1px solid #CBD5E1',
                    fontWeight: 700,
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="auto">Auto-Detect</option>
                  <option value="in_person">In-Person (Strict Local)</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote / Video</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B: Boolean Search Query Variants & Live Monospace Display */}
        {parsedData && (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            padding: '12px 18px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
            {/* Top Row: Active Role & 3-Variant Switcher Pills */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                  Target Role: {parsedData.job_title}
                </span>
                {parsedData.interview_mode && (
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: 4,
                    fontSize: 10.5,
                    fontWeight: 700,
                    backgroundColor: parsedData.interview_mode.badgeBg || '#EFF6FF',
                    color: parsedData.interview_mode.badgeColor || '#1E40AF',
                    border: `1px solid ${parsedData.interview_mode.badgeBorder || '#BFDBFE'}`
                  }}>
                    {parsedData.interview_mode.label}
                  </span>
                )}
              </div>

              {/* 1-Click Copy Boolean */}
              <button
                type="button"
                onClick={handleCopyQuery}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 5,
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                {copiedQuery ? <><IconCheck /> Copied</> : <><IconCopy /> Copy Boolean</>}
              </button>
            </div>

            {/* 3 Clickable Variant Tabs */}
            {parsedData.boolean_variants && parsedData.boolean_variants.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Search Variants:
                </span>
                {parsedData.boolean_variants.map((v) => {
                  const isActive = selectedVariantId === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectVariant(v)}
                      style={{
                        padding: '3px 9px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        backgroundColor: isActive ? '#0F766E' : '#F1F5F9',
                        color: isActive ? '#FFFFFF' : '#334155',
                        border: `1px solid ${isActive ? '#0F766E' : '#CBD5E1'}`,
                        transition: 'all 0.15s ease'
                      }}
                      title={v.description}
                    >
                      {v.name}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Monospace Query Box */}
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 5,
              fontSize: 11.5,
              fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              color: '#0F172A',
              fontWeight: 600,
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}>
              {activeBooleanQuery || parsedData.monster_boolean_query}
            </div>

            {/* Required Skills Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Required Skills:
              </span>
              {(parsedData.must_have_skills || []).map((sk, idx) => (
                <span key={idx} style={{
                  padding: '1px 6px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#1E40AF'
                }}>
                  {sk}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SECTION C: Sourced Candidates */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>
                Sourced Candidates ({visibleCandidates.length})
              </h2>
              <span style={{ fontSize: 11, color: '#059669', fontWeight: 700, backgroundColor: '#ECFDF5', padding: '1px 6px', borderRadius: 4, border: '1px solid #A7F3D0' }}>
                {recencyDays >= 365 ? 'All Active' : `Last ${recencyDays} Days Active`}
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: '#64748B' }}>
              Showing verified employer profiles with phone and email
            </span>
          </div>

          {/* Loading Skeleton */}
          {isAutoSourcing && (
            <div style={{
              padding: '32px 20px',
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              textAlign: 'center',
              color: '#475569',
              fontSize: 12.5,
              fontWeight: 600
            }}>
              Evaluating Monster+ candidates against 3-criteria model (Skills, Role Alignment & Proximity)...
            </div>
          )}

          {/* VIEW 1: Candidate Cards View (Responsive 2-Column Sleek Grid) */}
          {viewMode === 'cards' && !isAutoSourcing && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))',
              gap: 12
            }}>
              {visibleCandidates.map((cand) => {
                const isHighMatch = (cand.match_score || 0) >= 80
                const isGoodMatch = (cand.match_score || 0) >= 65 && (cand.match_score || 0) < 80
                const isImported = importedCandidateIds.has(cand.id)
                const isEmailSent = sentEmailIds.has(cand.id)
                const cb = cand.criteria_breakdown || {}

                return (
                  <div
                    key={cand.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      padding: '14px 16px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    <div>
                      {/* Top Header Row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                              {cand.name}
                            </span>
                            <span style={{ padding: '1px 6px', backgroundColor: '#F1F5F9', borderRadius: 4, fontSize: 10.5, fontWeight: 700, color: '#475569' }}>
                              {cand.years_of_experience || 5} Yrs
                            </span>
                            <span style={{ fontSize: 10.5, color: '#059669', fontWeight: 700 }}>
                              {cand.last_active || 'Monster+ Active'}
                            </span>
                          </div>

                          <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginTop: 2 }}>
                            {cand.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                            {cand.company} · {cand.location}
                          </div>
                        </div>

                        {/* Match Score & Tier */}
                        <div style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          backgroundColor: isHighMatch ? '#ECFDF5' : (isGoodMatch ? '#FFFBEB' : '#F1F5F9'),
                          border: `1px solid ${isHighMatch ? '#A7F3D0' : (isGoodMatch ? '#FDE68A' : '#CBD5E1')}`,
                          textAlign: 'right',
                          minWidth: 55
                        }}>
                          <div style={{
                            fontSize: 14,
                            fontWeight: 900,
                            color: isHighMatch ? '#065F46' : (isGoodMatch ? '#92400E' : '#334155'),
                            lineHeight: 1
                          }}>
                            {cand.match_score || 75}%
                          </div>
                          <div style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            color: isHighMatch ? '#047857' : (isGoodMatch ? '#B45309' : '#64748B'),
                            textTransform: 'uppercase',
                            marginTop: 2
                          }}>
                            {cand.match_tier || 'Good Match'}
                          </div>
                        </div>
                      </div>

                      {/* 3-Criteria Match Breakdown Pills */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexWrap: 'wrap',
                        padding: '4px 8px',
                        backgroundColor: '#F8FAFC',
                        borderRadius: 4,
                        border: '1px solid #F1F5F9',
                        fontSize: 10.5,
                        color: '#475569',
                        marginBottom: 8
                      }}>
                        <span style={{ fontWeight: 700 }}>Skills:</span>
                        <strong style={{ color: '#0F766E' }}>{cb.skills?.score ?? 45}/50</strong>
                        <span style={{ color: '#CBD5E1' }}>•</span>
                        <span style={{ fontWeight: 700 }}>Role:</span>
                        <strong style={{ color: '#1E40AF' }}>{cb.role?.score ?? 20}/25</strong>
                        <span style={{ color: '#CBD5E1' }}>•</span>
                        <span style={{ fontWeight: 700 }}>Local:</span>
                        <strong style={{ color: cand.is_local_match ? '#065F46' : '#991B1B' }}>
                          {cand.local_fit_badge || 'Commutable'}
                        </strong>
                      </div>

                      {/* Contact Bar: Phone & Email with Copy */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 8,
                        fontSize: 11,
                        color: '#334155',
                        padding: '4px 8px',
                        backgroundColor: '#F8FAFC',
                        borderRadius: 4,
                        marginBottom: 8
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <IconPhone />
                          <span>{cand.phone}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyContact('phone', cand.phone, cand.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: 10, fontWeight: 700, padding: 0 }}
                          >
                            {copiedPhoneId === cand.id ? 'Copied' : 'Copy'}
                          </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <IconMail />
                          <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cand.email}>
                            {cand.email}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyContact('email', cand.email, cand.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: 10, fontWeight: 700, padding: 0 }}
                          >
                            {copiedEmailId === cand.id ? 'Copied' : 'Copy'}
                          </button>
                        </div>

                        {cand.profile_url && cand.profile_url !== '#' && (
                          <a
                            href={cand.profile_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700, fontSize: 10.5 }}
                          >
                            Profile <IconExternalLink />
                          </a>
                        )}
                      </div>

                      {/* Matched vs Missing Skills (Compact) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#065F46', textTransform: 'uppercase' }}>
                            Matched:
                          </span>
                          {(cand.matched_skills || []).slice(0, 4).map((sk, idx) => (
                            <span key={idx} style={{
                              padding: '1px 5px',
                              backgroundColor: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              borderRadius: 3,
                              fontSize: 10.5,
                              fontWeight: 700,
                              color: '#065F46'
                            }}>
                              {sk}
                            </span>
                          ))}
                          {(cand.matched_skills || []).length > 4 && (
                            <span style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>
                              +{cand.matched_skills.length - 4} more
                            </span>
                          )}
                        </div>

                        {cand.missing_skills && cand.missing_skills.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#991B1B', textTransform: 'uppercase' }}>
                              Missing:
                            </span>
                            {cand.missing_skills.slice(0, 3).map((sk, idx) => (
                              <span key={idx} style={{
                                padding: '1px 5px',
                                backgroundColor: '#FEF2F2',
                                border: '1px solid #FECACA',
                                borderRadius: 3,
                                fontSize: 10.5,
                                fontWeight: 600,
                                color: '#991B1B'
                              }}>
                                {sk}
                              </span>
                            ))}
                            {cand.missing_skills.length > 3 && (
                              <span style={{ fontSize: 10, color: '#DC2626', fontWeight: 700 }}>
                                +{cand.missing_skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                      <button
                        type="button"
                        onClick={() => setActiveOutreachCandidate(cand)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: 5,
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: '#334155',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <IconMail /> Review Full JD Pitch
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleSendOutreachEmail(cand)}
                          disabled={sendingEmailId === cand.id}
                          style={{
                            padding: '5px 11px',
                            backgroundColor: isEmailSent ? '#ECFDF5' : '#0F766E',
                            color: isEmailSent ? '#065F46' : '#FFFFFF',
                            border: isEmailSent ? '1px solid #A7F3D0' : 'none',
                            borderRadius: 5,
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: sendingEmailId === cand.id ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <IconMail />
                          {sendingEmailId === cand.id ? 'Sending...' : (isEmailSent ? 'Sent' : '1-Click Send')}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleImportToAts(cand)}
                          disabled={isImported}
                          style={{
                            padding: '5px 11px',
                            backgroundColor: isImported ? '#ECFDF5' : '#1E293B',
                            border: isImported ? '1px solid #A7F3D0' : 'none',
                            borderRadius: 5,
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: isImported ? '#065F46' : '#FFFFFF',
                            cursor: isImported ? 'default' : 'pointer'
                          }}
                        >
                          {isImported ? 'In ATS' : 'Import'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* VIEW 2: Excel-Style Grid View (Rule 9: 11px font, compact cells, crisp borders) */}
          {viewMode === 'table' && !isAutoSourcing && (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              overflowX: 'auto',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: 11,
                fontFamily: 'inherit'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                    <th style={{ padding: '6px 8px', fontWeight: 800, color: '#334155', borderRight: '1px solid #CBD5E1', width: 34, textAlign: 'center' }}>#</th>
                    <th style={{ padding: '6px 10px', fontWeight: 800, color: '#334155', borderRight: '1px solid #CBD5E1' }}>Candidate & Recency</th>
                    <th style={{ padding: '6px 10px', fontWeight: 800, color: '#334155', borderRight: '1px solid #CBD5E1' }}>Current Role & Experience</th>
                    <th style={{ padding: '6px 10px', fontWeight: 800, color: '#334155', borderRight: '1px solid #CBD5E1' }}>Location & Local Fit</th>
                    <th style={{ padding: '6px 10px', fontWeight: 800, color: '#334155', borderRight: '1px solid #CBD5E1' }}>Visa / Work Auth</th>
                    <th style={{ padding: '6px 10px', fontWeight: 800, color: '#334155', borderRight: '1px solid #CBD5E1' }}>Phone & Email</th>
                    <th style={{ padding: '6px 10px', fontWeight: 800, color: '#334155', borderRight: '1px solid #CBD5E1' }}>3-Criteria Score Breakdown</th>
                    <th style={{ padding: '6px 8px', fontWeight: 800, color: '#334155', borderRight: '1px solid #CBD5E1', textAlign: 'center', width: 65 }}>Match %</th>
                    <th style={{ padding: '6px 10px', fontWeight: 800, color: '#334155', textAlign: 'right', width: 130 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCandidates.map((cand, idx) => {
                    const isImported = importedCandidateIds.has(cand.id)
                    const isEmailSent = sentEmailIds.has(cand.id)
                    const isHigh = (cand.match_score || 0) >= 80
                    const cb = cand.criteria_breakdown || {}

                    return (
                      <tr
                        key={cand.id}
                        style={{
                          backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                          borderBottom: '1px solid #CBD5E1',
                          height: 38
                        }}
                      >
                        <td style={{ padding: '5px 8px', borderRight: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 700, color: '#64748B' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '5px 10px', borderRight: '1px solid #CBD5E1', fontWeight: 700, color: '#0F172A' }}>
                          {cand.name}
                          <div style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>
                            {cand.last_active}
                          </div>
                        </td>
                        <td style={{ padding: '5px 10px', borderRight: '1px solid #CBD5E1', color: '#334155', fontWeight: 600 }}>
                          <div>{cand.title}</div>
                          <div style={{ fontSize: 10, color: '#64748B' }}>{cand.years_of_experience || 5} Yrs · {cand.company}</div>
                        </td>
                        <td style={{ padding: '5px 10px', borderRight: '1px solid #CBD5E1' }}>
                          <div style={{ color: '#0F172A', fontWeight: 600 }}>{cand.location}</div>
                          <span style={{
                            display: 'inline-block',
                            marginTop: 1,
                            padding: '1px 5px',
                            borderRadius: 3,
                            fontSize: 9.5,
                            fontWeight: 700,
                            backgroundColor: cand.is_local_match ? '#ECFDF5' : '#FEF2F2',
                            color: cand.is_local_match ? '#065F46' : '#991B1B'
                          }}>
                            {cand.local_fit_badge || 'Regional'}
                          </span>
                        </td>
                        <td style={{ padding: '5px 10px', borderRight: '1px solid #CBD5E1', color: '#475569', fontWeight: 600 }}>
                          {cand.work_auth}
                        </td>
                        <td style={{ padding: '5px 10px', borderRight: '1px solid #CBD5E1', color: '#0F172A' }}>
                          <div><strong>{cand.phone}</strong></div>
                          <div style={{ color: '#2563EB', fontSize: 10.5 }}>{cand.email}</div>
                        </td>
                        <td style={{ padding: '5px 10px', borderRight: '1px solid #CBD5E1', fontSize: 10.5, color: '#475569' }}>
                          Skills: <strong>{cb.skills?.score ?? 45}/50</strong> · Role: <strong>{cb.role?.score ?? 20}/25</strong> · Local: <strong>{cb.location?.score ?? 20}/25</strong>
                        </td>
                        <td style={{ padding: '5px 8px', borderRight: '1px solid #CBD5E1', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 800,
                            backgroundColor: isHigh ? '#ECFDF5' : '#FFFBEB',
                            color: isHigh ? '#065F46' : '#92400E',
                            border: `1px solid ${isHigh ? '#A7F3D0' : '#FDE68A'}`
                          }}>
                            {cand.match_score}%
                          </span>
                        </td>
                        <td style={{ padding: '5px 10px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                            <button
                              type="button"
                              onClick={() => setActiveOutreachCandidate(cand)}
                              style={{
                                padding: '3px 7px',
                                backgroundColor: isEmailSent ? '#ECFDF5' : '#0F766E',
                                color: isEmailSent ? '#065F46' : '#FFFFFF',
                                border: isEmailSent ? '1px solid #A7F3D0' : 'none',
                                borderRadius: 4,
                                fontSize: 10.5,
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
                                padding: '3px 8px',
                                backgroundColor: isImported ? '#ECFDF5' : '#1E293B',
                                color: isImported ? '#065F46' : '#FFFFFF',
                                border: isImported ? '1px solid #A7F3D0' : 'none',
                                borderRadius: 4,
                                fontSize: 10.5,
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

      {/* 3. Full Job Description Outreach Email Modal */}
      {activeOutreachCandidate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            width: '100%',
            maxWidth: 800,
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 18px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                  Candidate Outreach — Full Job Description
                </h3>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                  Recipient: <strong>{activeOutreachCandidate.name}</strong> ({activeOutreachCandidate.email}) · Sender: <strong>{activeUserEmail}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveOutreachCandidate(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, fontWeight: 800, color: '#64748B', cursor: 'pointer', padding: 2 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: 10, padding: '7px 12px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 5, fontSize: 11.5, color: '#1E40AF' }}>
                This draft embeds the <strong>complete Job Description</strong>, client overview, and required skills formatted for outreach.
              </div>

              <textarea
                value={activeOutreachCandidate.outreach_email}
                onChange={(e) => {
                  const val = e.target.value
                  setActiveOutreachCandidate(prev => ({ ...prev, outreach_email: val }))
                }}
                rows={15}
                style={{
                  width: '100%',
                  padding: 10,
                  fontSize: 11.5,
                  fontFamily: 'monospace',
                  lineHeight: 1.5,
                  borderRadius: 5,
                  border: '1px solid #CBD5E1',
                  color: '#1E293B',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{
              padding: '12px 18px',
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeOutreachCandidate.outreach_email)
                  setCopiedEmailId(activeOutreachCandidate.id)
                  setTimeout(() => setCopiedEmailId(null), 2000)
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 5,
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <IconCopy /> {copiedEmailId === activeOutreachCandidate.id ? 'Copied' : 'Copy Full Message'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setActiveOutreachCandidate(null)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 5,
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#64748B',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSendOutreachEmail(activeOutreachCandidate, activeOutreachCandidate.outreach_email)}
                  disabled={sendingEmailId === activeOutreachCandidate.id}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: '#0F766E',
                    border: 'none',
                    borderRadius: 5,
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#FFFFFF',
                    cursor: sendingEmailId === activeOutreachCandidate.id ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  <IconMail />
                  {sendingEmailId === activeOutreachCandidate.id ? 'Sending...' : 'Send Email Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}
