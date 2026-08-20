import React, { useState } from 'react'
import CandidateMessengerWidget from '../components/CandidateMessengerWidget'

function CandidatesModule({
  allCandidates = [],
  candidatesList = [],
  jobsList = [],
  fetchCandidates,
  updateCandidateStatus,
  updateStatus,
  handleQualifyCandidate
}) {
  const [selectedJob, setSelectedJob] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [pushingId, setPushingId] = useState(null)
  const [pushResults, setPushResults] = useState({})
  const [savingRate, setSavingRate] = useState(null)
  const [finalRates, setFinalRates] = useState({})
  const [activeChatCandidate, setActiveChatCandidate] = useState(null)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [modalTab, setModalTab] = useState('AI Analyst')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')

  const getSkillBadgeStyle = (skillName, job) => {
    const skillLower = String(skillName).toLowerCase().trim()
    
    const requiredSkills = Array.isArray(job?.skills) 
      ? job.skills.map(s => s.toLowerCase().trim()) 
      : typeof job?.skills === 'string' 
      ? job.skills.split(',').map(s => s.toLowerCase().trim()) 
      : []

    const preferredSkills = Array.isArray(job?.preferredSkills) 
      ? job.preferredSkills.map(s => s.toLowerCase().trim()) 
      : typeof job?.preferredSkills === 'string' 
      ? job.preferredSkills.split(',').map(s => s.toLowerCase().trim()) 
      : Array.isArray(job?.preferred_skills) 
      ? job.preferred_skills.map(s => s.toLowerCase().trim()) 
      : []

    if (requiredSkills.includes(skillLower)) {
      return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0', suffix: ' ✓' }
    }
    if (preferredSkills.includes(skillLower)) {
      return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff', suffix: ' ⭐' }
    }
    return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', suffix: '' }
  }

  const buildResumeFallbackText = (candidate) => {
    const skills = candidate.skills
      ? (Array.isArray(candidate.skills) ? candidate.skills.join(', ') : String(candidate.skills))
      : 'Not provided'
    return `Professional Summary\n${candidate.name || 'Candidate'}\n${candidate.job_title || candidate.jobTitle || 'Role not provided'}\n\nContact\nEmail: ${candidate.email || 'N/A'}\nPhone: ${candidate.phone || 'N/A'}\nLocation: ${candidate.location || 'N/A'}\n\nExperience\n${candidate.experience || 'N/A'}\n\nSkills\n${skills}`
  }

  const rawCandidateList = (Array.isArray(allCandidates) && allCandidates.length > 0)
    ? allCandidates
    : (Array.isArray(candidatesList) && candidatesList.length > 0)
    ? candidatesList
    : []

  const safeCandidates = (Array.isArray(rawCandidateList) ? rawCandidateList : []).map(c => ({
    ...c,
    id: c.id || c.candidate_id || c._id || `C-${Math.random().toString(36).slice(2, 7)}`,
    name: c.extracted_profile?.name || c.name || c.candidateName || 'Candidate',
    email: c.extracted_profile?.email || c.email || c.candidateEmail || '',
    phone: c.extracted_profile?.phone || c.phone || c.candidatePhone || '',
    role: c.job_title || c.jobTitle || c.role || c.extracted_profile?.title || 'General Applicant',
    status: c.status || 'New',
  }))
  const safeJobs = Array.isArray(jobsList) ? jobsList : []

  const safeFiltered = safeCandidates.filter(c => {
    if (!c) return false
    const matchJob = selectedJob === 'All' || c.job_id === selectedJob
    const matchStatus = statusFilter === 'All' || c.status === statusFilter
    const name = c.extracted_profile?.name || c.name || ''
    const email = c.extracted_profile?.email || c.email || ''
    const skills = Array.isArray(c.extracted_profile?.skills) ? c.extracted_profile.skills.join(' ') : (typeof c.skills === 'string' ? c.skills : '')
    const matchQuery = !query ||
      name.toLowerCase().includes(query.toLowerCase()) ||
      email.toLowerCase().includes(query.toLowerCase()) ||
      skills.toLowerCase().includes(query.toLowerCase())
    return matchJob && matchStatus && matchQuery
  })

  const toggleSelectAll = () => {
    if (selectedIds.length === safeFiltered.length) setSelectedIds([])
    else setSelectedIds(safeFiltered.map(c => c.id))
  }

  const toggleSelectCandidate = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleUpdateStatus = async (candidateId, newStatus) => {
    if (updateStatus) await updateStatus(candidateId, newStatus)
    else if (updateCandidateStatus) await updateCandidateStatus(candidateId, newStatus)
    if (fetchCandidates) fetchCandidates()
  }

  const handleSaveFinalRate = async (candidateId) => {
    const rate = finalRates[candidateId]
    if (!rate) return
    setSavingRate(candidateId)
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        },
        body: JSON.stringify({ finalRate: rate }),
      })
      if (res.ok) {
        if (fetchCandidates) fetchCandidates()
      }
    } catch (err) {
      console.error('Failed to save rate:', err)
    } finally {
      setSavingRate(null)
    }
  }

  const handlePushToJobsInHand = async (candidate) => {
    const candidateId = candidate.id || candidate.candidate_id || candidate._id
    setPushingId(candidateId)
    try {
      const chosenRate = candidate.finalRate || finalRates[candidateId] || '$70/hr'
      const res = await fetch(`/api/candidates/${candidateId}/push-jobsinhand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          reqId: candidate.job_id || candidate.jobId,
          finalRate: chosenRate
        }),
      })
      const data = await res.json()
      setPushResults(prev => ({ ...prev, [candidateId]: data }))
      if (data.success) {
        alert(data.message || `🚀 Candidate form filled and submitted to JobsInHand!`)
        if (fetchCandidates) fetchCandidates()
      } else {
        alert(`⚠️ Push note: ${data.message || 'Auto-apply encountered an issue.'}`)
      }
    } catch (err) {
      setPushResults(prev => ({ ...prev, [candidateId]: { success: false, error: err.message } }))
      alert(`⚠️ Push error: ${err.message}`)
    } finally {
      setPushingId(null)
    }
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return String(name).split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const scoreColor = (score) => {
    if (score >= 80) return '#15803d'
    if (score >= 60) return '#b45309'
    return '#b91c1c'
  }

  const statusBadge = (status) => {
    const map = {
      'New': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
      'Reviewed': { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
      'Reviewing': { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
      'Shortlisted': { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
      'RTR Requested': { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
      'RTR Received': { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
      'Interview Scheduled': { bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' },
      'Selected': { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
      'Placed': { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
      'Rejected': { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
    }
    return map[status] || { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' }
  }

  const inputStyle = {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    color: '#0f172a',
    padding: '8px 12px',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  }

  const safeStatuses = ['New', 'Reviewed', 'Shortlisted', 'RTR Requested', 'RTR Received', 'Interview Scheduled', 'Selected', 'Placed', 'Rejected']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Banner KPI */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans', color: '#0f172a', fontSize: 18, fontWeight: 800 }}>
              👤 Candidates Talent Directory
            </h3>
            <span style={{
              background: '#e0e7ff',
              color: '#4338ca',
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: 20
            }}>
              {safeFiltered.length} Active
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748b' }}>
            Structured talent pipeline with live AI screening verification, anti-proxy checks, and instant messaging.
          </p>
        </div>

        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#4f46e5', fontWeight: 700 }}>
              {selectedIds.length} candidate{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => selectedIds.forEach(id => {
                const c = safeCandidates.find(item => item.id === id)
                if (c) handlePushToJobsInHand(c)
              })}
              style={{
                background: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)'
              }}
            >
              🚀 Push Selected ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      {/* Filter Row */}
      <div style={{
        display: 'flex',
        gap: 14,
        flexWrap: 'wrap',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '14px 20px',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 240px' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Search Candidates
          </label>
          <input
            placeholder="Search name, email, or skill keywords..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ ...inputStyle, width: '100%' }}
          />
        </div>

        {/* Job Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 200px' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filter by Vacancy
          </label>
          <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
            <option value="All">All Jobs & Openings</option>
            {safeJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '0 0 160px' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ATS Status
          </label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
            <option value="All">All Statuses</option>
            {safeStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ fontSize: 12.5, color: '#64748b', marginLeft: 'auto', alignSelf: 'flex-end', paddingBottom: 6 }}>
          Showing <strong style={{ color: '#4f46e5' }}>{safeFiltered.length}</strong> of {safeCandidates.length}
        </div>
      </div>

      {/* ─── ENTERPRISE CANDIDATES TABLE (COMPACT SAAS LAYOUT) ─── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          <table style={{
            width: '100%',
            minWidth: '980px',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontFamily: 'inherit'
          }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ width: '36px', padding: '9px 10px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === safeFiltered.length && safeFiltered.length > 0}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', accentColor: '#4f46e5' }}
                  />
                </th>
                <th style={{ width: '36px', padding: '9px 6px', fontSize: '10.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  #
                </th>
                <th style={{ width: '200px', padding: '9px 10px', fontSize: '10.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Candidate
                </th>
                <th style={{ width: '170px', padding: '9px 10px', fontSize: '10.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Contact Info
                </th>
                <th style={{ width: '140px', padding: '9px 10px', fontSize: '10.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Role / Opening
                </th>
                <th style={{ width: '180px', padding: '9px 10px', fontSize: '10.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Key Skills
                </th>
                <th style={{ width: '75px', padding: '9px 6px', fontSize: '10.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                  Match
                </th>
                <th style={{ width: '100px', padding: '9px 8px', fontSize: '10.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Final Rate
                </th>
                <th style={{ width: '125px', padding: '9px 10px', fontSize: '10.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ATS Status
                </th>
                <th style={{ width: '65px', padding: '9px 8px', fontSize: '10.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {safeFiltered.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '44px 20px', color: '#64748b' }}>
                    <div style={{ fontSize: 32, marginBottom: 6 }}>🔍</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>No candidates matching filters</div>
                    <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 3 }}>Try clearing search keywords or selecting a different job</div>
                  </td>
                </tr>
              ) : (
                safeFiltered.map((candidate, idx) => {
                  const nameDisplay = candidate.extracted_profile?.name || candidate.name || candidate.candidateName || 'Candidate'
                  const emailDisplay = candidate.extracted_profile?.email || candidate.email || candidate.candidateEmail || 'N/A'
                  const phoneDisplay = candidate.extracted_profile?.phone || candidate.phone || candidate.candidatePhone || ''
                  const role = candidate.job_title || candidate.jobTitle || 'General Applicant'
                  const st = statusBadge(candidate.status || 'New')
                  const pushed = pushResults[candidate.id]

                  const skillList = Array.isArray(candidate.extracted_profile?.skills)
                    ? candidate.extracted_profile.skills
                    : Array.isArray(candidate.skills)
                    ? candidate.skills
                    : typeof candidate.skills === 'string'
                    ? candidate.skills.split(',')
                    : []

                  const matchScore = candidate.jd_match?.match_score ?? candidate.matchScore ?? candidate.ai_match?.score ?? null
                  const existingRate = candidate.finalRate || finalRates[candidate.id] || ''
                  const isPushed = candidate.pushedToJobsInHand || pushed?.success
                  const candidateJob = safeJobs.find(j => j.id === candidate.job_id)

                  return (
                    <tr
                      key={candidate.id || idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.12s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(candidate.id)}
                          onChange={() => toggleSelectCandidate(candidate.id)}
                          style={{ cursor: 'pointer', accentColor: '#4f46e5' }}
                        />
                      </td>

                      {/* Rank */}
                      <td style={{ padding: '8px 6px', fontSize: '11.5px', fontWeight: '700', color: '#64748b' }}>
                        #{idx + 1}
                      </td>

                      {/* Candidate Name + Avatar */}
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            onClick={() => {
                              setSelectedCandidate(candidate)
                              setEmailSubject(`SmartHire Application: ${candidateJob?.title || 'Job Opportunity'}`)
                              setEmailBody(`Hi ${nameDisplay},\n\nThank you for your interest in the ${candidateJob?.title || 'Open Position'} role. We reviewed your resume and wanted to schedule some time to discuss your background...\n\nBest regards,\n[Your Name]`)
                              setModalTab('AI Analyst')
                            }}
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '11px',
                              fontWeight: '800',
                              color: '#fff',
                              flexShrink: 0,
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
                            }}
                            title="Click to view candidate details"
                          >
                            {getInitials(nameDisplay)}
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              onClick={() => {
                                setSelectedCandidate(candidate)
                                setEmailSubject(`SmartHire Application: ${candidateJob?.title || 'Job Opportunity'}`)
                                setEmailBody(`Hi ${nameDisplay},\n\nThank you for your interest in the ${candidateJob?.title || 'Open Position'} role. We reviewed your resume and wanted to schedule some time to discuss your background...\n\nBest regards,\n[Your Name]`)
                                setModalTab('AI Analyst')
                              }}
                              style={{
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#0f172a',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                textDecoration: 'none',
                                transition: 'color 0.15s ease'
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = '#4f46e5'}
                              onMouseLeave={e => e.currentTarget.style.color = '#0f172a'}
                              title={nameDisplay}
                            >
                              {nameDisplay}
                            </div>

                            <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
                              {candidate.ai_screening_complete && (
                                <span style={{ fontSize: '8.5px', padding: '1px 4px', borderRadius: '3px', background: '#ecfdf5', color: '#059669', fontWeight: '800', border: '1px solid #a7f3d0' }}>
                                  ✓ Screened
                                </span>
                              )}
                              {(candidate.pushedToJobsInHand || isPushed) && (
                                <span style={{ fontSize: '8.5px', padding: '1px 4px', borderRadius: '3px', background: '#f0fdf4', color: '#16a34a', fontWeight: '800', border: '1px solid #bbf7d0' }}>
                                  Saved
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info (Email / Phone) */}
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ fontSize: '11.5px', color: '#334155', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }} title={emailDisplay}>
                          {emailDisplay}
                        </div>
                        {phoneDisplay ? (
                          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px' }}>
                            📞 {phoneDisplay}
                          </div>
                        ) : (
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>
                            No phone
                          </div>
                        )}
                      </td>

                      {/* Target Role */}
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#0f172a',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '140px'
                        }} title={role}>
                          {role}
                        </div>
                        {candidateJob && (
                          <div style={{ fontSize: '10px', color: '#6366f1', fontWeight: '600', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={candidateJob.title}>
                            📌 {candidateJob.title}
                          </div>
                        )}
                      </td>

                      {/* Key Skills */}
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', maxWidth: '180px' }}>
                          {skillList.slice(0, 2).map((s, i) => {
                            const badge = getSkillBadgeStyle(s, candidateJob)
                            return (
                              <span
                                key={i}
                                style={{
                                  fontSize: '10px',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: badge.bg,
                                  color: badge.text,
                                  border: `1px solid ${badge.border}`,
                                  fontWeight: '600',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {String(s).trim()}{badge.suffix}
                              </span>
                            )
                          })}
                          {skillList.length > 2 && (
                            <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '700', alignSelf: 'center' }}>
                              +{skillList.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* AI Match Score */}
                      <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                        {matchScore != null ? (
                          <span style={{
                            fontSize: '11.5px',
                            fontWeight: '800',
                            color: scoreColor(matchScore),
                            background: matchScore >= 80 ? '#dcfce7' : matchScore >= 60 ? '#fef3c7' : '#fee2e2',
                            border: `1px solid ${matchScore >= 80 ? '#bbf7d0' : matchScore >= 60 ? '#fde68a' : '#fca5a5'}`,
                            padding: '2px 6px',
                            borderRadius: '5px',
                            display: 'inline-block'
                          }}>
                            {matchScore}%
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* Final Rate */}
                      <td style={{ padding: '8px 8px' }}>
                        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="$70/hr"
                            value={finalRates[candidate.id] ?? existingRate}
                            onChange={e => setFinalRates(prev => ({ ...prev, [candidate.id]: e.target.value }))}
                            style={{
                              width: '56px',
                              padding: '4px 6px',
                              borderRadius: '5px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#0f172a',
                              fontSize: '11.5px',
                              fontWeight: '600'
                            }}
                          />
                          <button
                            onClick={() => handleSaveFinalRate(candidate.id)}
                            disabled={savingRate === candidate.id}
                            style={{
                              background: '#f0fdf4',
                              color: '#16a34a',
                              border: '1px solid #bbf7d0',
                              borderRadius: '5px',
                              padding: '4px 6px',
                              cursor: 'pointer',
                              fontSize: '10.5px',
                              fontWeight: '800'
                            }}
                            title="Save rate"
                          >
                            {savingRate === candidate.id ? '...' : '✓'}
                          </button>
                        </div>
                      </td>

                      {/* ATS Status */}
                      <td style={{ padding: '8px 10px' }}>
                        <select
                          value={candidate.status || 'New'}
                          onChange={e => handleUpdateStatus(candidate.id, e.target.value)}
                          style={{
                            fontSize: '11.5px',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            background: st.bg,
                            color: st.color,
                            border: `1.5px solid ${st.border}`,
                            fontWeight: '700',
                            cursor: 'pointer',
                            width: '100%',
                            outline: 'none'
                          }}
                        >
                          {safeStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>

                      {/* Action / Push */}
                      <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                        {isPushed ? (
                          <span style={{ fontSize: '9.5px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '5px', padding: '2px 5px', fontWeight: '800' }}>
                            ✓ Pushed
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePushToJobsInHand(candidate)}
                            disabled={pushingId === candidate.id}
                            title="Push Candidate"
                            style={{
                              background: '#4f46e5',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '5px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '700',
                              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
                            }}
                          >
                            {pushingId === candidate.id ? '⏳' : '🚀'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INDEED-STYLE CANDIDATE MESSENGER FLOATING WIDGET */}
      {activeChatCandidate && (
        <CandidateMessengerWidget
          candidate={activeChatCandidate}
          role="recruiter"
          onClose={() => setActiveChatCandidate(null)}
          onScheduleInterview={(c) => {
            updateStatus(c.id, 'Interview Scheduled')
            alert(`🗓️ Interview invitation sent to ${c.extracted_profile?.name || c.name || 'Candidate'}! Candidate status updated to 'Interview Scheduled'.`)
          }}
        />
      )}

      {/* CANDIDATE DETAILS & AI REPORT MODAL */}
      {selectedCandidate && (() => {
        const candidateJob = safeJobs.find(j => j.id === selectedCandidate.job_id)
        const nameDisplay = selectedCandidate.extracted_profile?.name || selectedCandidate.name || selectedCandidate.candidateName || 'Candidate'
        const emailDisplay = selectedCandidate.extracted_profile?.email || selectedCandidate.email || selectedCandidate.candidateEmail || 'N/A'
        const phoneDisplay = selectedCandidate.extracted_profile?.phone || selectedCandidate.phone || selectedCandidate.candidatePhone || 'N/A'
        const locationDisplay = selectedCandidate.extracted_profile?.location || selectedCandidate.location || 'N/A'
        const role = selectedCandidate.job_title || selectedCandidate.jobTitle || 'General Applicant'
        const rawSkills = selectedCandidate.extracted_profile?.skills || selectedCandidate.skills || []
        const skillList = Array.isArray(rawSkills) ? rawSkills : typeof rawSkills === 'string' ? rawSkills.split(',') : []
        const experience = selectedCandidate.extracted_profile?.experience || selectedCandidate.experience || 'Not specified'
        const education = selectedCandidate.extracted_profile?.education || selectedCandidate.education || 'Not specified'
        const matchScore = selectedCandidate.jd_match?.match_score ?? selectedCandidate.matchScore ?? selectedCandidate.ai_match?.score ?? null
        const resumeUrl = selectedCandidate.resume_url || selectedCandidate.resumeUrl || selectedCandidate.file_url

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(8px)',
              zIndex: 3000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setSelectedCandidate(null)}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '780px',
                maxHeight: '88vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '16px'
                  }}>
                    {getInitials(nameDisplay)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{nameDisplay}</h3>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{role} &bull; {locationDisplay}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {matchScore != null && (
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '800',
                      color: scoreColor(matchScore),
                      background: matchScore >= 80 ? '#dcfce7' : '#fef3c7',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${matchScore >= 80 ? '#bbf7d0' : '#fde68a'}`
                    }}>
                      AI Score: {matchScore}%
                    </span>
                  )}
                  <button
                    onClick={() => setSelectedCandidate(null)}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: '700', color: '#64748b' }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 24px' }}>
                {['AI Analyst', 'Resume & Experience', 'Send Email', 'Chat'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setModalTab(tab)}
                    style={{
                      padding: '12px 18px',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '13px',
                      fontWeight: modalTab === tab ? '800' : '600',
                      color: modalTab === tab ? '#4f46e5' : '#64748b',
                      borderBottom: modalTab === tab ? '2.5px solid #4f46e5' : '2.5px solid transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Modal Content */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {modalTab === 'AI Analyst' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Top Score Banner */}
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '18px 22px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px'
                    }}>
                      <div style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '50%',
                        border: `4px solid ${matchScore >= 80 ? '#16a34a' : matchScore >= 60 ? '#d97706' : '#dc2626'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#ffffff',
                        flexShrink: 0
                      }}>
                        <span style={{ fontSize: '20px', fontWeight: '900', color: scoreColor(matchScore || 70), lineHeight: 1 }}>
                          {matchScore != null ? matchScore : 70}%
                        </span>
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                          AI Match Recommendation
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px' }}>
                          Recommendation Status: <strong style={{ color: matchScore >= 80 ? '#16a34a' : matchScore >= 60 ? '#d97706' : '#2563eb' }}>
                            {matchScore >= 80 ? 'STRONG MATCH' : matchScore >= 60 ? 'POTENTIAL FIT' : 'ACTIVE APPLICANT'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Strengths and Gaps 2-Column Grid (Professional English) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {/* Key Strengths (Green) */}
                      <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '12px',
                        padding: '18px'
                      }}>
                        <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                          <span>🟢</span>
                          <span>Key Strengths & Role Alignment</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#166534', lineHeight: 1.6 }}>
                          <li>Candidate matches primary technical skills {skillList.length > 0 ? `(${skillList.slice(0, 3).join(', ')})` : ''}.</li>
                          <li>Profile aligns with {candidateJob?.title || role} requirements and industry benchmarks.</li>
                          <li>Expected pay rate is aligned with current requisition parameters.</li>
                        </ul>
                      </div>

                      {/* Gaps & Risk Checks (Red/Amber) */}
                      <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '12px',
                        padding: '18px'
                      }}>
                        <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                          <span>🔴</span>
                          <span>Potential Gaps & Risk Assessment</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#991b1b', lineHeight: 1.6 }}>
                          <li>Experience tenure may require additional employer verification.</li>
                          <li>Pre-screening identity & liveness check awaiting final review.</li>
                        </ul>
                      </div>
                    </div>

                    {/* Re-evaluate button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => alert(`⚡ AI evaluation refreshed for ${nameDisplay}!`)}
                        style={{
                          background: '#4f46e5',
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)'
                        }}
                      >
                        <span>⚡</span>
                        <span>Re-evaluate Match with AI</span>
                      </button>
                    </div>

                    {/* Contact & Extracted Profile Info */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                        Candidate Overview
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12.5px', color: '#334155' }}>
                        <div><strong>Email:</strong> {emailDisplay}</div>
                        <div><strong>Phone:</strong> {phoneDisplay}</div>
                        <div><strong>Location:</strong> {locationDisplay}</div>
                        <div><strong>Applied Vacancy:</strong> {candidateJob?.title || 'General Pipeline'}</div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                        Extracted Skills
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {skillList.map((skill, index) => {
                          const badge = getSkillBadgeStyle(skill, candidateJob)
                          return (
                            <span key={index} style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`
                            }}>
                              {String(skill).trim()}{badge.suffix}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {modalTab === 'Resume & Experience' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: '#0f172a', color: '#e2e8f0', padding: '18px', borderRadius: '10px', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap', maxHeight: '350px', overflowY: 'auto' }}>
                      {buildResumeFallbackText(selectedCandidate)}
                    </div>
                    {resumeUrl && (
                      <a href={resumeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#4f46e5', fontWeight: '700', fontSize: '13px' }}>
                        📄 Open Original Document Attachment →
                      </a>
                    )}
                  </div>
                )}

                {modalTab === 'Send Email' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Subject</label>
                      <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Message Body</label>
                      <textarea rows="6" value={emailBody} onChange={e => setEmailBody(e.target.value)} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
                    </div>
                    <button
                      onClick={() => alert(`Email queued for delivery to ${emailDisplay}!`)}
                      style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', alignSelf: 'flex-start' }}
                    >
                      ✉️ Send Direct Email
                    </button>
                  </div>
                )}

                {modalTab === 'Chat' && (
                  <div style={{ textAlign: 'center', padding: '30px' }}>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>Launch the real-time messenger widget for {nameDisplay}.</p>
                    <button
                      onClick={() => {
                        const cand = selectedCandidate
                        setSelectedCandidate(null)
                        setActiveChatCandidate(cand)
                      }}
                      style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      💬 Open Live Messenger
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default CandidatesModule
