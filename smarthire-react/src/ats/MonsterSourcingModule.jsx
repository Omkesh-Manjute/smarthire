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
  const [location, setLocation] = useState('Richmond, VA')
  const [maxResults, setMaxResults] = useState(5)
  const [isParsing, setIsParsing] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isLiveSearching, setIsLiveSearching] = useState(false)
  const [parsedData, setParsedData] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [copiedQuery, setCopiedQuery] = useState(false)
  const [copiedEmailId, setCopiedEmailId] = useState(null)
  const [sendingEmailId, setSendingEmailId] = useState(null)
  const [importedCandidateIds, setImportedCandidateIds] = useState(new Set())
  const [statusMessage, setStatusMessage] = useState(null)
  const [expandedEmailId, setExpandedEmailId] = useState(null)
  const [targetReqForImport, setTargetReqForImport] = useState('')

  // Pre-load default sample JD if empty
  useEffect(() => {
    if (!jdText && activeJobs.length > 0) {
      const defaultJob = activeJobs.find(j => 
        (j.title && /dynamics|power platform|developer/i.test(j.title))
      ) || activeJobs[0]

      if (defaultJob) {
        setSelectedJobId(String(defaultJob.id || defaultJob.jobId))
        const desc = defaultJob.description || defaultJob.desc || defaultJob.jobDescription || `${defaultJob.title}\nClient: ${defaultJob.client || 'Coolsoft Client'}\nLocation: ${defaultJob.location || 'Richmond, VA'}\n\nSeeking an experienced professional with deep technical expertise in Microsoft Dynamics 365, C#, .NET, Power Apps, and Azure cloud integration.`
        setJdText(desc)
        setLocation(defaultJob.location || 'Richmond, VA')
        setTargetReqForImport(String(defaultJob.id || defaultJob.jobId))
      }
    } else if (!jdText) {
      setJdText(`Senior Microsoft Dynamics 365 / Power Platform Developer
Location: Richmond, Virginia (VDOT / State Government)
Required Experience: 5+ Years
Contract Rate: $75 - $85/hr C2C

Requirements:
- Strong hands-on experience with Microsoft Dynamics 365 Customer Engagement (CE)
- Building custom Canvas Apps and Model-Driven Apps using Power Apps
- Advanced automated business processes with Power Automate flows and Dataverse
- Backend development in C#, .NET Framework, and REST API integration
- Azure DevOps, ALM managed/unmanaged solutions, and CI/CD pipelines
- SQL Server database queries and reporting`)
    }
  }, [activeJobs])

  // Handle requisition selection from dropdown
  const handleSelectJob = (e) => {
    const val = e.target.value
    setSelectedJobId(val)
    setTargetReqForImport(val)
    if (!val) return

    const job = activeJobs.find(j => String(j.id || j.jobId) === String(val))
    if (job) {
      const desc = job.description || job.desc || job.jobDescription || `${job.title}\nClient: ${job.client || 'Enterprise Client'}\nLocation: ${job.location || 'Richmond, VA'}`
      setJdText(desc)
      if (job.location) setLocation(job.location)
    }
  }

  // Parse JD via API
  const handleParseJd = async () => {
    if (!jdText || jdText.trim().length < 10) {
      setStatusMessage({ type: 'error', text: 'Please enter or select a valid Job Description first.' })
      return
    }

    setIsParsing(true)
    setStatusMessage(null)

    try {
      const res = await fetch('/api/recruiter/parse-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: jdText })
      })

      const data = await res.json()
      if (data && data.success) {
        setParsedData(data)
        setStatusMessage({ type: 'success', text: `Requirements parsed successfully: ${data.job_title}` })
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to parse Job Description.' })
      }
    } catch (err) {
      console.error('Parse error:', err)
      setStatusMessage({ type: 'error', text: 'Error connecting to parsing engine.' })
    } finally {
      setIsParsing(false)
    }
  }

  // Find Monster Candidates via API
  const handleFindCandidates = async () => {
    if (!jdText || jdText.trim().length < 10) {
      setStatusMessage({ type: 'error', text: 'Please enter or select a valid Job Description first.' })
      return
    }

    setIsSearching(true)
    setStatusMessage(null)

    try {
      const res = await fetch('/api/recruiter/find-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text: jdText,
          location,
          max_results: maxResults
        })
      })

      const data = await res.json()
      if (data && data.success) {
        if (data.jd_parsed) setParsedData(data.jd_parsed)
        setCandidates(data.candidates || [])
        setStatusMessage({
          type: 'success',
          text: `Found ${data.count || data.candidates?.length || 0} matching candidates from Monster+ talent pool!`
        })
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to extract Monster candidates.' })
      }
    } catch (err) {
      console.error('Find candidates error:', err)
      setStatusMessage({ type: 'error', text: 'Error executing candidate search.' })
    } finally {
      setIsSearching(false)
    }
  }

  // Live Monster Automated Scraper
  const handleLiveMonsterSearch = async () => {
    const jobTitle = parsedData?.job_title || 'Dynamics 365 Developer'
    const skills = parsedData?.must_have_skills || ['Dynamics 365', 'Power Apps', 'C#', '.NET']

    setIsLiveSearching(true)
    setStatusMessage({ type: 'info', text: 'Connecting to manage.monster.com with employer credentials...' })

    try {
      const res = await fetch('/api/recruiter/live-monster-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: jobTitle,
          skills,
          location,
          max_results: maxResults
        })
      })

      const data = await res.json()
      if (data && data.success && data.candidates?.length > 0) {
        setCandidates(data.candidates)
        setStatusMessage({
          type: 'success',
          text: `Live search complete: extracted ${data.candidates.length} profiles from manage.monster.com.`
        })
      } else {
        // Fallback to talent pool search
        handleFindCandidates()
      }
    } catch (err) {
      console.error('Live search error:', err)
      handleFindCandidates()
    } finally {
      setIsLiveSearching(false)
    }
  }

  // Copy Monster Boolean Query
  const handleCopyQuery = () => {
    if (!parsedData?.monster_boolean_query) return
    navigator.clipboard.writeText(parsedData.monster_boolean_query)
    setCopiedQuery(true)
    setTimeout(() => setCopiedQuery(false), 2000)
  }

  // Copy Personalized Outreach Email
  const handleCopyEmail = (candId, emailText) => {
    navigator.clipboard.writeText(emailText)
    setCopiedEmailId(candId)
    setTimeout(() => setCopiedEmailId(null), 2000)
  }

  // Send Direct Outreach Email
  const handleSendEmail = async (cand) => {
    setSendingEmailId(cand.id)
    try {
      const res = await fetch('/api/recruiter/monster/send-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: cand.email,
          candidateName: cand.name,
          subject: `Exciting ${parsedData?.job_title || 'Role'} Opportunity — Coolsoft LLC`,
          emailBody: cand.outreach_email
        })
      })
      const data = await res.json()
      if (data && data.success) {
        setStatusMessage({ type: 'success', text: `Outreach email delivered to ${cand.name} (${cand.email}).` })
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to dispatch email.' })
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error sending outreach email.' })
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
          text: `Transferred ${cand.name} directly into ATS Candidates pipeline!`
        })
        if (onCandidateImported && typeof onCandidateImported === 'function') {
          onCandidateImported(data.candidate)
        }
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to import candidate.' })
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error connecting to candidate import service.' })
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
        padding: '20px 28px',
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
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
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
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
            Source real candidate profiles directly from employer account with AI requirement extraction, 0–100% fit scoring, and 1-click outreach.
          </p>
        </div>

        {/* Global Feedback Status Banner */}
        {statusMessage && (
          <div style={{
            padding: '8px 14px',
            borderRadius: 6,
            fontSize: 12.5,
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

      {/* 2. Main Content Grid */}
      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Card A: Job Description & Sourcing Controls */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          border: '1px solid #E2E8F0',
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconBriefcase />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Requisition & Job Requirements</span>
            </div>

            {/* Quick Requisition Selector */}
            {activeJobs.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Auto-fill from Requisition:</span>
                <select
                  value={selectedJobId}
                  onChange={handleSelectJob}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12.5,
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    fontWeight: 600,
                    outline: 'none',
                    maxWidth: 320,
                    cursor: 'pointer'
                  }}
                >
                  <option value="">-- Choose Requisition --</option>
                  {activeJobs.map(job => (
                    <option key={job.id || job.jobId} value={job.id || job.jobId}>
                      #{job.id || job.jobId} — {job.title} ({job.client || 'Client'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* JD Input Area */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              Job Description (JD) Text
            </label>
            <textarea
              rows={6}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste Job Description here or select from active requisitions above..."
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: 13,
                fontFamily: 'inherit',
                borderRadius: 6,
                border: '1px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                color: '#0F172A',
                lineHeight: 1.5,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Search Controls Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
                  Target Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Richmond, VA or Remote"
                  style={{
                    padding: '7px 12px',
                    fontSize: 12.5,
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    fontWeight: 600,
                    width: 200,
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
                  Max Candidates
                </label>
                <select
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  style={{
                    padding: '7px 12px',
                    fontSize: 12.5,
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value={5}>Top 5 Candidates</option>
                  <option value={10}>Top 10 Candidates</option>
                  <option value={15}>Top 15 Candidates</option>
                  <option value={20}>Top 20 Candidates</option>
                </select>
              </div>

              {/* Assign to Requisition for 1-click import */}
              {activeJobs.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
                    Assign to ATS Req
                  </label>
                  <select
                    value={targetReqForImport}
                    onChange={(e) => setTargetReqForImport(e.target.value)}
                    style={{
                      padding: '7px 12px',
                      fontSize: 12.5,
                      borderRadius: 6,
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#0F172A',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer',
                      maxWidth: 240
                    }}
                  >
                    <option value="">Talent Pool (General)</option>
                    {activeJobs.map(job => (
                      <option key={job.id || job.jobId} value={job.id || job.jobId}>
                        Req #{job.id || job.jobId} - {job.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleParseJd}
                disabled={isParsing}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#334155',
                  cursor: isParsing ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {isParsing ? 'Parsing Requirements...' : 'Parse Requirements & Boolean'}
              </button>

              <button
                type="button"
                onClick={handleFindCandidates}
                disabled={isSearching}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#1E293B',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  cursor: isSearching ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                <IconSearch />
                {isSearching ? 'Evaluating Monster+ Candidates...' : 'Find Monster+ Candidates'}
              </button>

              <button
                type="button"
                onClick={handleLiveMonsterSearch}
                disabled={isLiveSearching}
                title="Automates search directly on manage.monster.com using saved session"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#0F766E',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  cursor: isLiveSearching ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <IconMonster size={14} color="#FFF" />
                {isLiveSearching ? 'Searching Portal...' : 'Live Monster Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Card B: Parsed Requirements & Boolean Search Query */}
        {parsedData && (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                Extracted Requirements & Monster Search Query
              </span>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                Experience Target: {parsedData.experience_min_years || 4} - {parsedData.experience_max_years || 8} Years
              </span>
            </div>

            {/* Criteria Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              <span style={{ padding: '3px 10px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 4, fontSize: 12, fontWeight: 700, color: '#1E293B' }}>
                Role: {parsedData.job_title}
              </span>
              {parsedData.primary_location && (
                <span style={{ padding: '3px 10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                  Location: {parsedData.primary_location}
                </span>
              )}
              {parsedData.education && (
                <span style={{ padding: '3px 10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                  Edu: {parsedData.education}
                </span>
              )}
            </div>

            {/* Must-Have Skills */}
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Must-Have Technical Skills ({parsedData.must_have_skills?.length || 0}):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {(parsedData.must_have_skills || []).map((sk, idx) => (
                  <span key={idx} style={{
                    padding: '3px 9px',
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#1E40AF'
                  }}>
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Boolean Query Box */}
            {parsedData.monster_boolean_query && (
              <div style={{
                marginTop: 14,
                padding: '12px 16px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16
              }}>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                    Monster Employer Boolean Query
                  </div>
                  <code style={{
                    fontSize: 12.5,
                    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    color: '#0F172A',
                    fontWeight: 600,
                    display: 'block',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap'
                  }}>
                    {parsedData.monster_boolean_query}
                  </code>
                </div>

                <button
                  type="button"
                  onClick={handleCopyQuery}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 5,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 0
                  }}
                >
                  {copiedQuery ? <><IconCheck /> Copied</> : <><IconCopy /> Copy Query</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Card C: Candidates Match List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                Evaluated Monster+ Candidates ({candidates.length})
              </h2>
              {candidates.length > 0 && (
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                  Ranked by Good Match Score (0–100%)
                </span>
              )}
            </div>

            {candidates.length === 0 && !isSearching && (
              <span style={{ fontSize: 12.5, color: '#64748B' }}>
                Click <strong>Find Monster+ Candidates</strong> to evaluate profiles against this requisition.
              </span>
            )}
          </div>

          {/* Loading Indicator */}
          {isSearching && (
            <div style={{
              padding: '40px 20px',
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              textAlign: 'center',
              color: '#475569',
              fontSize: 13,
              fontWeight: 600
            }}>
              Analyzing Monster+ talent pool and scoring candidates against requirements...
            </div>
          )}

          {/* Candidate Profile Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {candidates.map((cand) => {
              const isHighMatch = (cand.match_score || 0) >= 80
              const isGoodMatch = (cand.match_score || 0) >= 65 && (cand.match_score || 0) < 80
              const isImported = importedCandidateIds.has(cand.id)
              const isExpanded = expandedEmailId === cand.id

              return (
                <div
                  key={cand.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    padding: '20px 24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  {/* Row 1: Candidate Header & Match Score */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                          {cand.name}
                        </h3>
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: '#F1F5F9',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#475569'
                        }}>
                          {cand.years_of_experience || 5} Yrs Exp
                        </span>
                        <span style={{ fontSize: 11, color: '#64748B' }}>
                          {cand.last_active || 'Monster+ Active'}
                        </span>
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginTop: 4 }}>
                        {cand.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                        {cand.company} · {cand.location}
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px'
                        }}>
                          {cand.match_tier || (isHighMatch ? 'High Match' : 'Good Match')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Skills Match Breakdown */}
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: 6,
                    border: '1px solid #F1F5F9',
                    marginBottom: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}>
                    {/* Matched Skills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.4px', minWidth: 90 }}>
                        Matched Skills:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(cand.matched_skills || []).map((sk, idx) => (
                          <span key={idx} style={{
                            padding: '2px 8px',
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
                        {(!cand.matched_skills || cand.matched_skills.length === 0) && (
                          <span style={{ fontSize: 11.5, color: '#94A3B8' }}>None identified</span>
                        )}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    {cand.missing_skills && cand.missing_skills.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.4px', minWidth: 90 }}>
                          Missing Skills:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {cand.missing_skills.map((sk, idx) => (
                            <span key={idx} style={{
                              padding: '2px 8px',
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

                  {/* Row 3: Candidate Summary */}
                  {cand.summary && (
                    <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.5, marginBottom: 14 }}>
                      {cand.summary}
                    </div>
                  )}

                  {/* Row 4: Contact & Authorization Information */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                    paddingBottom: 14,
                    borderBottom: '1px solid #F1F5F9',
                    fontSize: 12,
                    color: '#64748B'
                  }}>
                    {cand.email && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <IconMail />
                        <strong style={{ color: '#0F172A' }}>{cand.email}</strong>
                      </span>
                    )}

                    {cand.phone && (
                      <span>
                        Phone: <strong style={{ color: '#0F172A' }}>{cand.phone}</strong>
                      </span>
                    )}

                    {cand.work_auth && (
                      <span>
                        Work Auth: <strong style={{ color: '#0F172A' }}>{cand.work_auth}</strong>
                      </span>
                    )}

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
                          textDecoration: 'none'
                        }}
                      >
                        Monster Profile <IconExternalLink />
                      </a>
                    )}
                  </div>

                  {/* Row 5: AI Recruiter Assessment Notes */}
                  {cand.recruiter_notes && (
                    <div style={{
                      marginTop: 12,
                      padding: '8px 12px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#475569',
                      borderLeft: '3px solid #3B82F6'
                    }}>
                      <strong>AI Assessment:</strong> {cand.recruiter_notes}
                    </div>
                  )}

                  {/* Row 6: Outreach Email Drawer */}
                  {isExpanded && cand.outreach_email && (
                    <div style={{
                      marginTop: 14,
                      padding: '14px 16px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 6
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                          Personalized Outreach Email Draft (Signed on behalf of Coolsoft LLC)
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(cand.id, cand.outreach_email)}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              borderRadius: 4,
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5
                            }}
                          >
                            {copiedEmailId === cand.id ? <><IconCheck /> Copied</> : <><IconCopy /> Copy Email</>}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendEmail(cand)}
                            disabled={sendingEmailId === cand.id}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: '#0F766E',
                              border: 'none',
                              borderRadius: 4,
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: '#FFFFFF',
                              cursor: sendingEmailId === cand.id ? 'wait' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5
                            }}
                          >
                            <IconMail />
                            {sendingEmailId === cand.id ? 'Sending...' : 'Send Email'}
                          </button>
                        </div>
                      </div>

                      <pre style={{
                        margin: 0,
                        padding: '10px 12px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 4,
                        fontSize: 12,
                        fontFamily: 'inherit',
                        lineHeight: 1.5,
                        color: '#1E293B',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {cand.outreach_email}
                      </pre>
                    </div>
                  )}

                  {/* Row 7: Action Buttons Bar */}
                  <div style={{
                    marginTop: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10
                  }}>
                    <button
                      type="button"
                      onClick={() => setExpandedEmailId(isExpanded ? null : cand.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: isExpanded ? '#EFF6FF' : '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: 5,
                        fontSize: 12,
                        fontWeight: 700,
                        color: isExpanded ? '#1E40AF' : '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <IconMail />
                      {isExpanded ? 'Hide Outreach Email' : 'View Outreach Email Draft'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(cand.id, cand.outreach_email)}
                        style={{
                          padding: '6px 12px',
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
                        {copiedEmailId === cand.id ? <><IconCheck /> Copied</> : <><IconCopy /> Copy Outreach</>}
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
                        {isImported ? <><IconCheck /> Imported to ATS</> : 'Import to SmartHire ATS'}
                      </button>
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
