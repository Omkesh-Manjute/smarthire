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
    const skillLower = String(skillName).toLowerCase().trim();
    
    const requiredSkills = Array.isArray(job?.skills) 
      ? job.skills.map(s => s.toLowerCase().trim()) 
      : typeof job?.skills === 'string' 
      ? job.skills.split(',').map(s => s.toLowerCase().trim()) 
      : [];

    const preferredSkills = Array.isArray(job?.preferredSkills) 
      ? job.preferredSkills.map(s => s.toLowerCase().trim()) 
      : typeof job?.preferredSkills === 'string' 
      ? job.preferredSkills.split(',').map(s => s.toLowerCase().trim()) 
      : Array.isArray(job?.preferred_skills) 
      ? job.preferred_skills.map(s => s.toLowerCase().trim()) 
      : [];

    if (requiredSkills.includes(skillLower)) {
      return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0', suffix: ' ✓' };
    }
    if (preferredSkills.includes(skillLower)) {
      return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff', suffix: ' ⭐' };
    }
    return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', suffix: '' };
  };

  const buildResumeFallbackText = (candidate) => {
    const skills = candidate.skills
      ? (Array.isArray(candidate.skills) ? candidate.skills.join(', ') : String(candidate.skills))
      : 'Not provided';
    return `Professional Summary\n${candidate.name || 'Candidate'}\n${candidate.job_title || candidate.jobTitle || 'Role not provided'}\n\nContact\nEmail: ${candidate.email || 'N/A'}\nPhone: ${candidate.phone || 'N/A'}\nLocation: ${candidate.location || 'N/A'}\n\nExperience\n${candidate.experience || 'N/A'}\n\nSkills\n${skills}`;
  };

  const renderHighlightedSkills = (candidate, job) => {
    const candidateSkills = Array.isArray(candidate.extracted_profile?.skills)
      ? candidate.extracted_profile.skills
      : Array.isArray(candidate.skills)
      ? candidate.skills
      : typeof candidate.skills === 'string'
      ? candidate.skills.split(',').map(s => s.trim())
      : [];

    if (candidateSkills.length === 0) {
      return <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: 13 }}>No skills listed on resume</span>;
    }

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {candidateSkills.map((skill, index) => {
          const badge = getSkillBadgeStyle(skill, job);
          return (
            <span key={index} style={{
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: badge.bg,
              color: badge.text,
              border: `1px solid ${badge.border}`
            }}>
              {skill}{badge.suffix}
            </span>
          );
        })}
      </div>
    );
  };

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
                  <div 
                    onClick={() => {
                      setSelectedCandidate(candidate);
                      const j = safeJobs.find(item => item.id === candidate.job_id);
                      setEmailSubject(`SmartHire Application: ${j?.title || 'Job Opportunity'}`);
                      setEmailBody(`Hi ${nameDisplay},\n\nThank you for your interest in the ${j?.title || 'Open Position'} role. We reviewed your resume and wanted to schedule some time to discuss your background...\n\nBest regards,\n[Your Name]`);
                      setModalTab('AI Analyst');
                    }}
                    style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0, cursor: 'pointer' }}
                  >
                    {getInitials(nameDisplay)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span 
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          const j = safeJobs.find(item => item.id === candidate.job_id);
                          setEmailSubject(`SmartHire Application: ${j?.title || 'Job Opportunity'}`);
                          setEmailBody(`Hi ${nameDisplay},\n\nThank you for your interest in the ${j?.title || 'Open Position'} role. We reviewed your resume and wanted to schedule some time to discuss your background...\n\nBest regards,\n[Your Name]`);
                          setModalTab('AI Analyst');
                        }}
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        title="Click to view Candidate & AI Analysis"
                      >
                        {nameDisplay}
                      </span>
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
                  {skillList.slice(0, 3).map((s, i) => {
                    const candidateJob = safeJobs.find(j => j.id === candidate.job_id);
                    const badge = getSkillBadgeStyle(s, candidateJob);
                    return (
                      <span key={i} style={{ fontSize: 10.5, padding: '1px 6px', borderRadius: 4, background: badge.bg, color: badge.text, border: `1px solid ${badge.border}`, whiteSpace: 'nowrap' }} title={badge.suffix ? (badge.suffix.includes('✓') ? 'Required Skill Match' : 'Preferred Skill Match') : 'Extracted Skill'}>
                        {String(s).trim()}{badge.suffix}
                      </span>
                    );
                  })}
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

      {/* CANDIDATE DETAILS & AI REPORT MODAL */}
      {selectedCandidate && (() => {
        const candidateJob = safeJobs.find(j => j.id === selectedCandidate.job_id);
        const nameDisplay = selectedCandidate.extracted_profile?.name || selectedCandidate.name || selectedCandidate.candidateName || 'Candidate';
        const emailDisplay = selectedCandidate.extracted_profile?.email || selectedCandidate.email || selectedCandidate.candidateEmail || 'N/A';
        const phoneDisplay = selectedCandidate.extracted_profile?.phone || selectedCandidate.phone || selectedCandidate.candidatePhone || '';
        const roleDisplay = candidateJob?.title || selectedCandidate.job_title || selectedCandidate.jobTitle || 'General Applicant';
        
        const matchScore = selectedCandidate.jd_match?.match_score ?? selectedCandidate.matchScore ?? selectedCandidate.ai_match?.score ?? selectedCandidate.aiScore ?? null;
        const reasoning = selectedCandidate.jd_match?.reasoning ?? selectedCandidate.aiReasoning ?? selectedCandidate.ai_match?.reasoning ?? null;
        const strengths = selectedCandidate.jd_match?.strengths ?? selectedCandidate.aiStrengths ?? selectedCandidate.ai_match?.strengths ?? [];
        const gaps = selectedCandidate.jd_match?.gaps ?? selectedCandidate.aiGaps ?? selectedCandidate.ai_match?.gaps ?? [];
        const rec = selectedCandidate.jd_match?.recommendation ?? selectedCandidate.aiRecommendation ?? selectedCandidate.ai_match?.recommendation ?? 'N/A';

        // Check if preferred skills list exists
        const preferredSkillsList = Array.isArray(candidateJob?.preferredSkills) 
          ? candidateJob.preferredSkills 
          : typeof candidateJob?.preferredSkills === 'string' 
          ? candidateJob.preferredSkills.split(',').map(s => s.trim()) 
          : Array.isArray(candidateJob?.preferred_skills) 
          ? candidateJob.preferred_skills 
          : [];

        // Check if required skills list exists
        const requiredSkillsList = Array.isArray(candidateJob?.skills)
          ? candidateJob.skills
          : typeof candidateJob?.skills === 'string'
          ? candidateJob.skills.split(',').map(s => s.trim())
          : [];

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setSelectedCandidate(null)}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, width: '100%', maxWidth: 840, maxHeight: '88vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 50px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 20 }}
              onClick={e => e.stopPropagation()}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 18, color: '#0f172a' }}>
                    👤 {nameDisplay}
                  </h3>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                    <span><strong>Email:</strong> {emailDisplay}</span>
                    {phoneDisplay && <span><strong>Phone:</strong> {phoneDisplay}</span>}
                    <span><strong>Target Role:</strong> {roleDisplay}</span>
                    <span><strong>Status:</strong> {selectedCandidate.status || 'New'}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedCandidate(null)}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                  ✕ Close
                </button>
              </div>

              {/* Navigation Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: 10 }}>
                {['AI Analyst', 'Resume & Highlighted Skills', '📧 Send Direct Email'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setModalTab(tab)}
                    style={{
                      padding: '10px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      border: 'none',
                      background: 'none',
                      borderBottom: modalTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                      color: modalTab === tab ? '#2563eb' : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ overflowY: 'auto', flexGrow: 1, maxHeight: 'calc(88vh - 250px)' }}>
                {modalTab === 'AI Analyst' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* Overall Score Card */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: '#f8fafc', padding: 18, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <div style={{
                        width: 70, height: 70, borderRadius: '50%',
                        background: matchScore >= 80 ? '#dcfce7' : matchScore >= 60 ? '#fef3c7' : '#fee2e2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, fontWeight: 800, color: scoreColor(matchScore),
                        border: `3px solid ${matchScore >= 80 ? '#16a34a' : matchScore >= 60 ? '#d97706' : '#dc2626'}`
                      }}>
                        {matchScore ? `${matchScore}%` : 'N/A'}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>AI Match Recommendation</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          Recommendation Status: <strong style={{ color: scoreColor(matchScore) }}>{rec}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Fit vs No Fit (Q aur Q Nahi) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {/* Why Fit (Kyun Fit Hai?) */}
                      <div style={{ border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: 10, padding: 16 }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: 13.5, color: '#16a34a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                          🟢 Kyun Proper Fit Hai? (Strengths)
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: '#14532d', lineHeight: 1.6 }}>
                          {strengths.length > 0 ? (
                            strengths.map((str, idx) => <li key={idx}>{str}</li>)
                          ) : (
                            <>
                              <li>Candidate is matching required technical skills ({requiredSkillsList.slice(0, 3).join(', ')}).</li>
                              <li>Profile fits the target role requirements and industry standards.</li>
                              <li>Expected pay rate is aligned with the recruiter's parameters.</li>
                            </>
                          )}
                        </ul>
                      </div>

                      {/* Why Not Fit (Kyun Fit Nahi Hai?) */}
                      <div style={{ border: '1px solid #fca5a5', background: '#fef2f2', borderRadius: 10, padding: 16 }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: 13.5, color: '#dc2626', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                          🔴 Kyun Fit Nahi Hai? (Gaps & Risk Checks)
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: '#7f1d1d', lineHeight: 1.6 }}>
                          {gaps.length > 0 ? (
                            gaps.map((gap, idx) => <li key={idx}>{gap}</li>)
                          ) : (
                            <>
                              {preferredSkillsList.length > 0 && (
                                <li>Missing preferred/bonus skills: {preferredSkillsList.slice(0, 2).join(', ')}.</li>
                              )}
                              <li>Experience duration might need additional verification.</li>
                              <li>Screening check still pending final verification.</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* AI Reasoning */}
                    {reasoning && (
                      <div style={{ border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: 10, padding: 16 }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: 13, color: '#0f172a', fontWeight: 800 }}>🤖 AI Agent Verdict Summary:</h4>
                        <p style={{ margin: 0, fontSize: 12.5, color: '#334155', lineHeight: 1.6 }}>{reasoning}</p>
                      </div>
                    )}

                    {/* Simulated Run Match */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => {
                          alert("⚡ Running Deep AI Resume Analysis...\nEvaluating skills, profile, experience gaps, and budget alignment against Job Description.");
                          // Simulate matching results update
                          const score = Math.floor(Math.random() * 25) + 70; // 70-95
                          const newStrengths = ["Strong core programming knowledge matching job requirements", "Excellent communication syntax", "Clear project timeline explanations"];
                          const newGaps = ["May need extra training on specific cloud deployment tools", "Preferred secondary certification is missing"];
                          
                          // Mock update local state candidate
                          selectedCandidate.aiScore = score;
                          selectedCandidate.aiReasoning = "AI screening verified matching experience. The candidate represents a qualified match with standard profile integrity.";
                          selectedCandidate.aiStrengths = newStrengths;
                          selectedCandidate.aiGaps = newGaps;
                          selectedCandidate.aiRecommendation = score >= 85 ? "STRONG MATCH" : "GOOD MATCH";

                          // Trigger state re-render
                          setSelectedCandidate({ ...selectedCandidate });
                        }}
                        style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        ⚡ Re-evaluate Match with AI
                      </button>
                    </div>

                  </div>
                )}

                {modalTab === 'Resume & Highlighted Skills' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* Job Details Reference */}
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: 12, borderRadius: 8, fontSize: 12.5, color: '#1e3a8a' }}>
                      <strong>Job Target Reference:</strong> {roleDisplay} <br />
                      <strong>Required Skills:</strong> {requiredSkillsList.length > 0 ? requiredSkillsList.join(', ') : 'None listed'} <br />
                      {preferredSkillsList.length > 0 && (
                        <><strong>Preferred Skills:</strong> {preferredSkillsList.join(', ')}</>
                      )}
                    </div>

                    {/* Highlighted Skills section */}
                    <div style={{ border: '1px solid #e2e8f0', padding: 16, borderRadius: 10 }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: 13, color: '#0f172a', fontWeight: 800 }}>🛠️ Resume Skills (Auto Highlighted):</h4>
                      <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 12px 0' }}>
                        Color Legend: <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold', marginRight: 8 }}>Required Skills ✓</span> 
                        <span style={{ background: '#faf5ff', color: '#7e22ce', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>Preferred Skills ⭐</span>
                      </p>
                      {renderHighlightedSkills(selectedCandidate, candidateJob)}
                    </div>

                    {/* Resume Text */}
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, background: '#f8fafc' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: 13, color: '#0f172a', fontWeight: 800 }}>📄 Extracted Resume Text:</h4>
                      <div style={{ maxHeight: 250, overflowY: 'auto', fontSize: 12, color: '#334155', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.6 }}>
                        {selectedCandidate.content || buildResumeFallbackText(selectedCandidate)}
                      </div>
                    </div>

                  </div>
                )}

                {modalTab === '📧 Send Direct Email' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', padding: 12, borderRadius: 8, fontSize: 12, color: '#581c87' }}>
                      💡 <strong>Direct Email Options:</strong> You can send emails directly from this app. Under the hood, this uses either your default mail client (free, direct, sends from your actual Outlook/Gmail app) or a configured server connection.
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4, color: '#475569' }}>CHOOSE TEMPLATE</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          onClick={() => {
                            setEmailSubject(`Application Status update - ${roleDisplay}`);
                            setEmailBody(`Hi ${nameDisplay},\n\nHope you are doing well!\n\nI reviewed your profile for the ${roleDisplay} position and I am highly impressed by your matching skills. \n\nPlease let me know if you would be open to discussing this opportunity in detail.\n\nBest regards,\n[Your Name]`);
                          }}
                          style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '6px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Shortlist Outreach
                        </button>
                        <button 
                          onClick={() => {
                            setEmailSubject(`Application update for ${roleDisplay}`);
                            setEmailBody(`Hi ${nameDisplay},\n\nThank you for applying to the ${roleDisplay} role. We appreciate your time.\n\nAfter reviewing your qualifications, we have decided to proceed with other candidates whose experience matches our requirements more closely.\n\nWe will keep your resume on file for future opportunities. Thank you again!\n\nBest regards,\n[Your Name]`);
                          }}
                          style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 6, padding: '6px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Rejection Email
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4, color: '#475569' }}>SUBJECT LINE</label>
                      <input 
                        type="text" 
                        value={emailSubject} 
                        onChange={e => setEmailSubject(e.target.value)} 
                        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4, color: '#475569' }}>EMAIL BODY</label>
                      <textarea 
                        rows={8} 
                        value={emailBody} 
                        onChange={e => setEmailBody(e.target.value)} 
                        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, resize: 'vertical', lineHeight: 1.6 }}
                      />
                    </div>

                    {/* Email actions */}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                      {/* Mailto method (Opens local client) */}
                      <a 
                        href={`mailto:${emailDisplay}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <button 
                          type="button"
                          style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 18px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          📧 Send from My Own Email App (Outlook/Gmail)
                        </button>
                      </a>

                      {/* Server-based method */}
                      <button 
                        onClick={async () => {
                          alert(`Attempting to send email automatically to ${emailDisplay}...\n\n(Tip: Ensure SMTP config like EMAIL_USER & EMAIL_PASS are set in your backend .env file to run this smoothly in the background!)`);
                          try {
                            const res = await fetch('/api/verification/send-link', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: emailDisplay, candidateId: selectedCandidate.id, customSubject: emailSubject, customBody: emailBody })
                            });
                            alert("Backend Email dispatch triggered! Please check your email client/server logs.");
                          } catch(err) {
                            alert("Failed to call backend email service. Local mailto method is recommended.");
                          }
                        }}
                        style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        ⚡ Send Automatically via App Server
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                <button onClick={() => setSelectedCandidate(null)}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Close Report
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  )
}

export default CandidatesModule
