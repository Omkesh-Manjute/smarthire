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

  const rawCandidateList = Array.isArray(allCandidates) && allCandidates.length > 0
    ? allCandidates
    : Array.isArray(candidatesList)
    ? candidatesList
    : []

  const safeCandidates = Array.isArray(rawCandidateList) ? rawCandidateList : []
  const safeJobs = Array.isArray(jobsList) ? jobsList : []

  const safeFiltered = safeCandidates.filter(c => {
    if (!c) return false
    const matchJob = selectedJob === 'All' || c.job_id === selectedJob
    const matchStatus = statusFilter === 'All' || c.status === statusFilter
    const name = c.extracted_profile?.name || c.name || ''
    const email = c.extracted_profile?.email || c.email || ''
    const skills = Array.isArray(c.extracted_profile?.skills) ? c.extracted_profile.skills.join(' ') : (c.skills || '')
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
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handlePushToJobsInHand = async (candidate) => {
    setPushingId(candidate.id)
    try {
      const res = await fetch('/api/candidates/push-to-jobsinhand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candidate.id, finalRate: finalRates[candidate.id] || candidate.finalRate || '' })
      })
      const data = await res.json()
      setPushResults(prev => ({ ...prev, [candidate.id]: data }))
      if (data.message) {
        alert(`🚀 JobsInHand Auto-Apply Result:\n${data.message}`)
      }
      if (fetchCandidates) fetchCandidates()
    } catch (e) {
      setPushResults(prev => ({ ...prev, [candidate.id]: { success: false, message: 'Failed to push' } }))
      alert('Failed to submit candidate to JobsInHand.')
    } finally {
      setPushingId(null)
    }
  }

  const handleSaveFinalRate = async (candidateId) => {
    const rate = finalRates[candidateId]
    if (!rate) return
    setSavingRate(candidateId)
    try {
      await fetch(`/api/candidates/${candidateId}/rate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalRate: rate })
      })
      if (fetchCandidates) fetchCandidates()
    } catch (e) {
      alert('Failed to update rate')
    } finally {
      setSavingRate(null)
    }
  }

  const handleUpdateStatus = async (candidateId, status) => {
    if (updateStatus) {
      await updateStatus(candidateId, status)
    } else if (updateCandidateStatus) {
      await updateCandidateStatus(candidateId, status)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'C'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const statusBadge = (s) => {
    switch (s) {
      case 'Shortlisted': case 'RTR Received': return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' }
      case 'Interview Scheduled': return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
      case 'Selected': case 'Placed': return { bg: '#f0fdf4', color: '#16a34a', border: '#86efac' }
      case 'Rejected': return { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' }
      default: return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' }
    }
  }

  const scoreColor = (s) => {
    if (!s && s !== 0) return '#64748b'
    if (s >= 80) return '#16a34a'
    if (s >= 60) return '#d97706'
    return '#dc2626'
  }

  const inputStyle = { padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#ffffff', color: '#0f172a' }
  const safeStatuses = ['New', 'Reviewing', 'Shortlisted', 'RTR Requested', 'RTR Received', 'Interview Scheduled', 'Selected', 'Rejected']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner KPI */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans', color: '#0f172a', fontSize: 16 }}>👤 Candidate Talent Pool</h3>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>Manage candidate applications, live chat with candidates, final rates, and 1-click push</p>
        </div>
        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#2563eb', fontWeight: 700 }}>{selectedIds.length} selected</span>
            <button
              onClick={() => selectedIds.forEach(id => {
                const c = safeCandidates.find(item => item.id === id)
                if (c) handlePushToJobsInHand(c)
              })}
              style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              🚀 Push Selected ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: '1 1 200px' }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter by Job Role</label>
          <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} style={{ ...inputStyle, minWidth: 160 }}>
            <option value="All">All Jobs</option>
            {safeJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: '0 0 140px' }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter by Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
            <option value="All">All</option>
            {safeStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: '1 1 200px' }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search Keywords</label>
          <input placeholder="Search name, email, or skill..." value={query} onChange={e => setQuery(e.target.value)} style={{ ...inputStyle, minWidth: 200 }} />
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          <strong style={{ color: '#2563eb' }}>{safeFiltered.length}</strong> / {safeCandidates.length} candidates
        </div>
      </div>

      {/* Candidates Table (Light Mode) */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '36px 40px 1.2fr 1fr 130px 110px 80px 100px 120px 50px', gap: 0, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '10px 16px' }}>
          <div>
            <input type="checkbox" checked={selectedIds.length === safeFiltered.length && safeFiltered.length > 0}
              onChange={toggleSelectAll} style={{ cursor: 'pointer' }} />
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Rank</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Candidate & Messaging</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Email / Phone</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Target Role</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Key Skills</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Match</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Final Rate</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>ATS Status</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Push</div>
        </div>

        {safeFiltered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>👤</div>
            <p style={{ fontSize: 15, fontWeight: 600 }}>No candidates found</p>
            <p style={{ fontSize: 13 }}>Candidates will appear here after applying to jobs</p>
          </div>
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

            return (
              <div key={candidate.id || idx}
                style={{ display: 'grid', gridTemplateColumns: '36px 40px 1.2fr 1fr 130px 110px 80px 100px 120px 50px', gap: 0, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
              >
                {/* Checkbox */}
                <div>
                  <input type="checkbox" checked={selectedIds.includes(candidate.id)}
                    onChange={() => toggleSelectCandidate(candidate.id)} style={{ cursor: 'pointer' }} />
                </div>

                {/* Rank */}
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>#{idx + 1}</div>

                {/* Candidate Name + Avatar + Chat Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {getInitials(nameDisplay)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{nameDisplay}</span>
                      <button
                        onClick={() => setActiveChatCandidate(candidate)}
                        title="Chat with candidate (Indeed style)"
                        style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 12, padding: '2px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}
                      >
                        💬 Chat
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      {candidate.ai_screening_complete && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }}>AI-Screened</span>}
                      {(candidate.pushedToJobsInHand || isPushed) && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>✓ Saved</span>}
                    </div>
                  </div>
                </div>

                {/* Email / Phone */}
                <div>
                  <div style={{ fontSize: 12, color: '#334155' }}>{emailDisplay}</div>
                  {phoneDisplay && <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{phoneDisplay}</div>}
                </div>

                {/* Role */}
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{role}</div>

                {/* Skills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {skillList.slice(0, 2).map((s, i) => (
                    <span key={i} style={{ fontSize: 10.5, padding: '1px 6px', borderRadius: 4, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                      {String(s).trim()}
                    </span>
                  ))}
                </div>

                {/* Match Score */}
                <div style={{ textAlign: 'center' }}>
                  {matchScore != null ? (
                    <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor(matchScore), background: matchScore >= 80 ? '#dcfce7' : matchScore >= 60 ? '#fef3c7' : '#fee2e2', padding: '3px 8px', borderRadius: 6 }}>
                      {matchScore}%
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>
                  )}
                </div>

                {/* Final Rate */}
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="$70/hr"
                    value={finalRates[candidate.id] ?? existingRate}
                    onChange={e => setFinalRates(prev => ({ ...prev, [candidate.id]: e.target.value }))}
                    style={{ width: 60, padding: '4px 6px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: 12 }}
                  />
                  <button onClick={() => handleSaveFinalRate(candidate.id)} disabled={savingRate === candidate.id}
                    style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 5, padding: '4px 6px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                    {savingRate === candidate.id ? '⏳' : '✓'}
                  </button>
                </div>

                {/* ATS Status */}
                <div>
                  <select value={candidate.status || 'New'}
                    onChange={e => handleUpdateStatus(candidate.id, e.target.value)}
                    style={{ fontSize: 11.5, padding: '4px 6px', borderRadius: 6, background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                    {safeStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Push to JobsInHand */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {isPushed ? (
                    <span style={{ fontSize: 10, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 6, padding: '3px 6px', fontWeight: 700 }}>✓ Pushed</span>
                  ) : (
                    <button onClick={() => handlePushToJobsInHand(candidate)}
                      disabled={pushingId === candidate.id}
                      title="Push to JobsInHand"
                      style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                      {pushingId === candidate.id ? '⏳' : '🚀'}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
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
    </div>
  )
}

export default CandidatesModule
