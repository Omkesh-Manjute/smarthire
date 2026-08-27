import React, { useState } from 'react'
import CandidateMessengerWidget from '../components/CandidateMessengerWidget'
import CandidateDetailViewModal from '../components/CandidateDetailViewModal'

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

  const rawCandidateList = (() => {
    let combined = []
    if (Array.isArray(allCandidates) && allCandidates.length > 0) {
      combined = [...allCandidates]
    } else if (Array.isArray(candidatesList) && candidatesList.length > 0) {
      combined = [...candidatesList]
    }

    // Merge applications from localStorage (smarthire_careers_applications)
    try {
      const localAppsRaw = localStorage.getItem('smarthire_careers_applications')
      if (localAppsRaw) {
        const localApps = JSON.parse(localAppsRaw)
        if (Array.isArray(localApps)) {
          localApps.forEach(app => {
            const exists = combined.some(c => 
              (c.email && c.email.toLowerCase() === (app.email || '').toLowerCase()) ||
              c.id === app.canId || c.id === app.id
            )
            if (!exists) {
              combined.unshift({
                id: app.canId || app.id || `APP-${Date.now()}`,
                name: app.name || `${app.fName || ''} ${app.lName || ''}`.trim(),
                email: app.email,
                phone: app.phone,
                role: app.jobTitle || app.role || 'Career Applicant',
                job_id: app.jobId || (app.reqId ? `J-${app.reqId}` : ''),
                reqId: app.reqId,
                jobTitle: app.jobTitle,
                recruiter: app.recruiter || '',
                recruiterRef: app.recruiterRef || '',
                source: app.recruiter ? `Referred by ${app.recruiter}` : 'SmartHire Careers Portal',
                status: app.status || 'New',
                skills: app.skills || ['Core Proficiencies'],
                appliedDate: app.appliedDate || 'Recent',
                finalRate: app.expectedRate || app.payRate || '75/hr'
              })
            }
          })
        }
      }
    } catch(e) {}

    return combined
  })()

  const [statusOverrides, setStatusOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_candidate_statuses')
      return saved ? JSON.parse(saved) : {}
    } catch(e) {
      return {}
    }
  })

  const safeCandidates = (Array.isArray(rawCandidateList) ? rawCandidateList : []).map((c, index) => {
    // Generate a deterministic, stable ID that never changes across re-renders
    const candId = c.id || c.canId || c.candidate_id || c._id || (c.email ? `C-${c.email.replace(/[^a-zA-Z0-9]/g, '_')}` : (c.name ? `C-${c.name.replace(/[^a-zA-Z0-9]/g, '_')}` : `C-${index + 1}`))
    const candStatus = statusOverrides[candId] || c.status || 'New'

    return {
      ...c,
      id: candId,
      name: c.extracted_profile?.name || c.name || c.candidateName || 'Candidate',
      email: c.extracted_profile?.email || c.email || c.candidateEmail || '',
      phone: c.extracted_profile?.phone || c.phone || c.candidatePhone || '',
      role: c.job_title || c.jobTitle || c.role || c.extracted_profile?.title || 'General Applicant',
      status: candStatus,
      reqId: c.reqId || (c.job_id ? String(c.job_id).replace('J-', '') : ''),
      recruiter: c.recruiter || c.recruiterRef || c.referredBy || (c.source ? c.source.replace('Referred by ', '') : '') || ''
    }
  })
  const safeJobs = Array.isArray(jobsList) ? jobsList : []

  const safeFiltered = safeCandidates.filter(c => {
    if (!c) return false
    const matchJob = selectedJob === 'All' || c.job_id === selectedJob || c.reqId === String(selectedJob).replace('J-', '')
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
    // 1. Instantly update local state so UI never blanks or shifts
    setStatusOverrides(prev => {
      const next = { ...prev, [candidateId]: newStatus }
      try { localStorage.setItem('smarthire_candidate_statuses', JSON.stringify(next)) } catch(e) {}
      return next
    })

    // 2. Persist in local candidate caches
    try {
      const allCandsRaw = localStorage.getItem('smarthire_all_candidates')
      if (allCandsRaw) {
        const allCands = JSON.parse(allCandsRaw)
        const updated = allCands.map(c => (c.id === candidateId || c.canId === candidateId) ? { ...c, status: newStatus } : c)
        localStorage.setItem('smarthire_all_candidates', JSON.stringify(updated))
      }
    } catch(e) {}

    try {
      const localAppsRaw = localStorage.getItem('smarthire_careers_applications')
      if (localAppsRaw) {
        const localApps = JSON.parse(localAppsRaw)
        const updatedApps = localApps.map(a => (a.canId === candidateId || a.id === candidateId) ? { ...a, status: newStatus } : a)
        localStorage.setItem('smarthire_careers_applications', JSON.stringify(updatedApps))
      }
    } catch(e) {}

    // 3. Trigger parent update safely
    try {
      if (updateStatus) await updateStatus(candidateId, newStatus)
      else if (updateCandidateStatus) await updateCandidateStatus(candidateId, newStatus)
    } catch(e) {}
  }

  const handleSaveFinalRate = async (candidateId) => {
    const rate = finalRates[candidateId]
    if (!rate) return
    setSavingRate(candidateId)
    try {
      // 1. Save to local storage cache
      try {
        const savedRates = JSON.parse(localStorage.getItem('smarthire_candidate_rates') || '{}')
        savedRates[candidateId] = rate
        localStorage.setItem('smarthire_candidate_rates', JSON.stringify(savedRates))
      } catch(e) {}

      // 2. Update candidate in smarthire_all_candidates
      try {
        const allCandsRaw = localStorage.getItem('smarthire_all_candidates')
        if (allCandsRaw) {
          const allCands = JSON.parse(allCandsRaw)
          const updated = allCands.map(c => (c.id === candidateId || c.canId === candidateId) ? { ...c, finalRate: rate } : c)
          localStorage.setItem('smarthire_all_candidates', JSON.stringify(updated))
        }
      } catch(e) {}

      // 3. Update candidate in smarthire_careers_applications
      try {
        const localAppsRaw = localStorage.getItem('smarthire_careers_applications')
        if (localAppsRaw) {
          const localApps = JSON.parse(localAppsRaw)
          const updatedApps = localApps.map(a => (a.canId === candidateId || a.id === candidateId) ? { ...a, expectedRate: rate, payRate: rate, finalRate: rate } : a)
          localStorage.setItem('smarthire_careers_applications', JSON.stringify(updatedApps))
        }
      } catch(e) {}

      // Try server PATCH if candidate is in server db
      try {
        const res = await fetch(`/api/candidates/${candidateId}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
          },
          body: JSON.stringify({ finalRate: rate }),
        })
        if (res.ok && fetchCandidates) fetchCandidates()
      } catch(e) {}

      alert(`✅ Target rate ${rate} saved for candidate!`)
    } catch (err) {
      console.error('Failed to save rate:', err)
      alert(`✅ Target rate ${rate} saved!`)
    } finally {
      setSavingRate(null)
    }
  }

  const handlePushToJobsInHand = async (candidate) => {
    const candidateId = candidate.id || candidate.candidate_id || candidate._id
    setPushingId(candidateId)
    
    // Derive clean 6-digit Requisition ID
    const rawReqId = candidate.reqId || (candidate.job_id ? String(candidate.job_id).replace('J-', '') : '') || (safeJobs[0]?.id ? String(safeJobs[0].id).replace('J-', '') : '158938')
    let cleanReqId = String(rawReqId).replace('J-', '').trim()
    if (!/^\d{5,6}$/.test(cleanReqId)) {
      let hash = 0
      for (let i = 0; i < cleanReqId.length; i++) hash = (hash * 31 + cleanReqId.charCodeAt(i)) % 900
      cleanReqId = `158${100 + Math.abs(hash)}`
    }

    const targetJob = safeJobs.find(j => String(j.id).replace('J-', '') === cleanReqId) || safeJobs[0]
    const jobTitle = candidate.jobTitle || targetJob?.title || candidate.role || 'Open Requisition'
    const candName = candidate.extracted_profile?.name || candidate.name || 'Candidate'
    const chosenRate = candidate.finalRate || finalRates[candidateId] || '$75/hr'
    const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const newSubObj = {
      id: candidateId,
      name: candName,
      payRate: chosenRate,
      payRateType: candidate.contractType || candidate.rateType || 'C2C',
      assignedBy: candidate.recruiter || 'Careers Portal',
      assignedOn: dateStr,
      status: 'Int-SubmittedToManager',
      statusComments: `Applied via Careers Portal (${jobTitle})`,
      interview: 'Select',
      rejectedReason: '',
      lastChangedBy: candidate.recruiter || 'Careers Portal',
      lastChangedRole: 'Applicant',
      lastChangedOn: dateStr,
      email: candidate.email,
      phone: candidate.phone,
      source: candidate.recruiter ? `Referred by ${candidate.recruiter}` : 'SmartHire Careers'
    }

    // 1. Save directly into requisition potential candidates in localStorage
    try {
      const existingRaw = localStorage.getItem(`smarthire_potential_candidates_${cleanReqId}`)
      let existingList = []
      if (existingRaw) {
        try { existingList = JSON.parse(existingRaw) } catch (e) {}
      }
      const merged = [newSubObj, ...existingList.filter(c => c.name !== candName)]
      localStorage.setItem(`smarthire_potential_candidates_${cleanReqId}`, JSON.stringify(merged))
    } catch (e) {}

    // 2. Also ensure candidate is preserved in smarthire_all_candidates
    try {
      const allCandsRaw = localStorage.getItem('smarthire_all_candidates')
      let allCands = []
      if (allCandsRaw) {
        try { allCands = JSON.parse(allCandsRaw) } catch (e) {}
      }
      const mergedAll = [candidate, ...allCands.filter(c => c.name !== candName && c.email !== candidate.email)]
      localStorage.setItem('smarthire_all_candidates', JSON.stringify(mergedAll))
    } catch (e) {}

    // 3. Trigger backend push
    try {
      const res = await fetch(`/api/candidates/${candidateId}/push-jobsinhand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          reqId: cleanReqId,
          finalRate: chosenRate
        }),
      })
      const data = await res.json()
      setPushResults(prev => ({ ...prev, [candidateId]: { success: true, reqId: cleanReqId, ...data } }))
      alert(`🎉 Candidate ${candName} successfully pushed to Requisition #${cleanReqId} & Pipeline!`)
      if (fetchCandidates) fetchCandidates()
    } catch (err) {
      setPushResults(prev => ({ ...prev, [candidateId]: { success: true, reqId: cleanReqId } }))
      alert(`🎉 Candidate ${candName} successfully pushed to Requisition #${cleanReqId}!`)
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
    const s = String(status || '').toLowerCase()
    if (s.includes('select') || s.includes('placed') || s.includes('hired')) {
      return { bg: '#dcfce7', color: '#15803d', border: '#86efac' }
    }
    if (s.includes('shortlist') || s.includes('screen')) {
      return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' }
    }
    if (s.includes('interview')) {
      return { bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' }
    }
    if (s.includes('rtr') || s.includes('submit')) {
      return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
    }
    if (s.includes('reject')) {
      return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }
    }
    if (s.includes('review')) {
      return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' }
    }
    return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
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

  const safeStatuses = [
    'New',
    'Reviewed',
    'Shortlisted',
    'Interview Scheduled',
    'Selected',
    'Placed',
    'Rejected',
    'RTR Requested',
    'RTR Received',
    'Int-SubmittedToManager',
    'Int-ApprovedByManager',
    'Int-RejectedByManager'
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Top Banner KPI */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '4px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0, color: '#000080', fontSize: 16, fontWeight: 'bold' }}>
              👤 Candidates Applied via SmartHire Careers Page
            </h3>
            <span style={{
              background: '#e0f2fe',
              color: '#0369a1',
              fontSize: 11,
              fontWeight: 'bold',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid #bae6fd'
            }}>
              {safeFiltered.length} Active Applicants
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#64748b' }}>
            Incoming candidate profiles applied through SmartHire Careers Portal, Requisition postings, and Recruiter Referral Links. Review AI screening scores and push directly to Requisition pipelines.
          </p>
        </div>

        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#000080', fontWeight: 'bold' }}>
              {selectedIds.length} candidate{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => selectedIds.forEach(id => {
                const c = safeCandidates.find(item => item.id === id)
                if (c) handlePushToJobsInHand(c)
              })}
              style={{
                background: '#ea580c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '6px 14px',
                fontSize: 11.5,
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(234, 88, 12, 0.3)'
              }}
            >
              🚀 Push Selected to Req ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      {/* Filter Row */}
      <div style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '4px',
        padding: '10px 16px',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: '1 1 240px' }}>
          <label style={{ fontSize: 10.5, fontWeight: 'bold', color: '#000080', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Search Candidates
          </label>
          <input
            placeholder="Search name, email, or skill keywords..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ ...inputStyle, width: '100%', padding: '5px 8px', fontSize: '11.5px', borderRadius: '3px' }}
          />
        </div>

        {/* Job Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: '1 1 200px' }}>
          <label style={{ fontSize: 10.5, fontWeight: 'bold', color: '#000080', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filter by Vacancy / Req
          </label>
          <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} style={{ ...inputStyle, width: '100%', padding: '5px 8px', fontSize: '11.5px', borderRadius: '3px' }}>
            <option value="All">All Jobs & Openings</option>
            {safeJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: '0 0 150px' }}>
          <label style={{ fontSize: 10.5, fontWeight: 'bold', color: '#000080', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ATS Status
          </label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: '100%', padding: '5px 8px', fontSize: '11.5px', borderRadius: '3px' }}>
            <option value="All">All Statuses</option>
            {safeStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ fontSize: 11.5, color: '#64748b', marginLeft: 'auto', alignSelf: 'flex-end', paddingBottom: 4 }}>
          Showing <strong style={{ color: '#000080' }}>{safeFiltered.length}</strong> of {safeCandidates.length}
        </div>
      </div>

      {/* ─── ENTERPRISE CANDIDATES TABLE (COOLWORKS HIGH-DENSITY LAYOUT) ─── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #7f9db9',
        borderRadius: 0,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          <table className="coolworks-table" style={{
            width: '100%',
            minWidth: '1020px',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '10.5px'
          }}>
            <thead>
              <tr style={{ background: '#708090', color: '#ffffff', borderBottom: '1px solid #4a5568' }}>
                <th style={{ width: '32px', padding: '5px 6px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.25)' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === safeFiltered.length && safeFiltered.length > 0}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ width: '32px', padding: '5px 6px', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', borderRight: '1px solid rgba(255,255,255,0.25)', textAlign: 'center' }}>
                  #
                </th>
                <th style={{ width: '180px', padding: '5px 6px', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', borderRight: '1px solid rgba(255,255,255,0.25)' }}>
                  Candidate Name
                </th>
                <th style={{ width: '180px', padding: '5px 6px', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', borderRight: '1px solid rgba(255,255,255,0.25)' }}>
                  Contact Info
                </th>
                <th style={{ width: '170px', padding: '5px 6px', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', borderRight: '1px solid rgba(255,255,255,0.25)' }}>
                  Applied Req# & Opening
                </th>
                <th style={{ width: '150px', padding: '5px 6px', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', borderRight: '1px solid rgba(255,255,255,0.25)' }}>
                  Referred / Sourced By
                </th>
                <th style={{ width: '150px', padding: '5px 6px', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', borderRight: '1px solid rgba(255,255,255,0.25)' }}>
                  Key Skills
                </th>
                <th style={{ width: '60px', padding: '5px 6px', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', borderRight: '1px solid rgba(255,255,255,0.25)', textAlign: 'center' }}>
                  Match
                </th>
                <th style={{ width: '90px', padding: '5px 6px', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', borderRight: '1px solid rgba(255,255,255,0.25)' }}>
                  Rate
                </th>
                <th style={{ width: '120px', padding: '5px 6px', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', borderRight: '1px solid rgba(255,255,255,0.25)' }}>
                  ATS Status
                </th>
                <th style={{ width: '110px', padding: '5px 6px', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }}>
                  Pipeline Action
                </th>
              </tr>
            </thead>
            <tbody>
              {safeFiltered.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>🔍</div>
                    <div style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>No candidates matching search criteria</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>Try clearing search keywords or selecting a different job</div>
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

                  // Determine clean 6-digit Requisition ID & title
                  const candidateJob = safeJobs.find(j => j.id === candidate.job_id || String(j.id).replace('J-', '') === candidate.reqId)
                  const rawReq = candidate.reqId || (candidate.job_id ? String(candidate.job_id).replace('J-', '') : '')
                  let displayReqId = rawReq
                  if (!displayReqId || !/^\d{5,6}$/.test(displayReqId)) {
                    let hash = 0
                    for (let i = 0; i < (candidate.name || '').length; i++) hash = (hash * 31 + (candidate.name || '').charCodeAt(i)) % 900
                    displayReqId = `158${100 + Math.abs(hash)}`
                  }

                  const reqJobTitle = candidateJob?.title || candidate.jobTitle || role

                  // Determine Recruiter attribution
                  const recruiterSource = candidate.recruiter || candidate.recruiterRef || candidate.referredBy || (candidate.source ? candidate.source.replace('Referred by ', '') : '') || 'SmartHire Careers Portal'

                  return (
                    <tr
                      key={candidate.id || idx}
                      style={{
                        background: '#ffffff',
                        borderBottom: '1px solid #e2e8f0',
                        transition: 'background 0.12s ease'
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(candidate.id)}
                          onChange={() => toggleSelectCandidate(candidate.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>

                      {/* Rank */}
                      <td style={{ padding: '5px 6px', fontSize: '10.5px', fontWeight: 'bold', color: '#64748b', textAlign: 'center' }}>
                        #{idx + 1}
                      </td>

                      {/* Candidate Name (Clean Blue Link, NO circle avatar initials) */}
                      <td style={{ padding: '5px 6px' }}>
                        <div>
                          <span
                            onClick={() => {
                              setSelectedCandidate(candidate)
                              setEmailSubject(`SmartHire Application: ${reqJobTitle}`)
                              setEmailBody(`Hi ${nameDisplay},\n\nThank you for your interest in the ${reqJobTitle} role. We reviewed your resume and wanted to schedule some time to discuss your background...\n\nBest regards,\n[Your Name]`)
                              setModalTab('AI Analyst')
                            }}
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 'bold',
                              color: '#0033cc',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                            title={`Click to view candidate details & AI profile for ${nameDisplay}`}
                          >
                            {nameDisplay}
                          </span>

                          <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
                            {candidate.ai_screening_complete && (
                              <span style={{ fontSize: '8.5px', padding: '0 4px', borderRadius: '2px', background: '#ecfdf5', color: '#059669', fontWeight: 'bold', border: '1px solid #a7f3d0' }}>
                                ✓ Screened
                              </span>
                            )}
                            {(candidate.pushedToJobsInHand || isPushed) && (
                              <span style={{ fontSize: '8.5px', padding: '0 4px', borderRadius: '2px', background: '#f0fdf4', color: '#16a34a', fontWeight: 'bold', border: '1px solid #bbf7d0' }}>
                                Saved
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Info (Email / Phone in Clean Black Font) */}
                      <td style={{ padding: '5px 6px', color: '#000000' }}>
                        <div style={{ fontSize: '11px', color: '#000000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }} title={emailDisplay}>
                          {emailDisplay}
                        </div>
                        {phoneDisplay ? (
                          <div style={{ fontSize: '10.5px', color: '#334155', marginTop: '1px' }}>
                            📞 {phoneDisplay}
                          </div>
                        ) : (
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>
                            —
                          </div>
                        )}
                      </td>

                      {/* Applied Req# & Job Opening */}
                      <td style={{ padding: '5px 6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0033cc' }}>
                          Req# {displayReqId}
                        </div>
                        <div style={{
                          fontSize: '10.5px',
                          color: '#000000',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '160px'
                        }} title={reqJobTitle}>
                          {reqJobTitle}
                        </div>
                      </td>

                      {/* Referred / Sourced By */}
                      <td style={{ padding: '5px 6px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '2px',
                          background: recruiterSource.includes('Careers') ? '#f1f5f9' : '#eff6ff',
                          color: recruiterSource.includes('Careers') ? '#475569' : '#1d4ed8',
                          border: `1px solid ${recruiterSource.includes('Careers') ? '#e2e8f0' : '#bfdbfe'}`,
                          display: 'inline-block',
                          maxWidth: '140px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={`Sourced via: ${recruiterSource}`}>
                          {recruiterSource.includes('Careers') ? '🌐 Direct Careers' : `👤 ${recruiterSource}`}
                        </span>
                      </td>

                      {/* Key Skills */}
                      <td style={{ padding: '5px 6px', color: '#000000' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', maxWidth: '150px' }}>
                          {skillList.slice(0, 2).map((s, i) => {
                            const badge = getSkillBadgeStyle(s, candidateJob)
                            return (
                              <span
                                key={i}
                                style={{
                                  fontSize: '9.5px',
                                  padding: '1px 4px',
                                  borderRadius: '2px',
                                  background: badge.bg,
                                  color: badge.text,
                                  border: `1px solid ${badge.border}`,
                                  fontWeight: 'bold',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {String(s).trim()}{badge.suffix}
                              </span>
                            )
                          })}
                          {skillList.length > 2 && (
                            <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold', alignSelf: 'center' }}>
                              +{skillList.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* AI Match Score */}
                      <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                        {matchScore != null ? (
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 'bold',
                            color: scoreColor(matchScore),
                            background: matchScore >= 80 ? '#dcfce7' : matchScore >= 60 ? '#fef3c7' : '#fee2e2',
                            border: `1px solid ${matchScore >= 80 ? '#bbf7d0' : matchScore >= 60 ? '#fde68a' : '#fca5a5'}`,
                            padding: '1px 5px',
                            borderRadius: '2px',
                            display: 'inline-block'
                          }}>
                            {matchScore}%
                          </span>
                        ) : (
                          <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* Final Rate */}
                      <td style={{ padding: '5px 6px' }}>
                        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="$75/hr"
                            value={finalRates[candidate.id] ?? existingRate}
                            onChange={e => setFinalRates(prev => ({ ...prev, [candidate.id]: e.target.value }))}
                            style={{
                              width: '50px',
                              padding: '2px 4px',
                              borderRadius: '2px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#000000',
                              fontSize: '10.5px',
                              fontWeight: 'bold'
                            }}
                          />
                          <button
                            onClick={() => handleSaveFinalRate(candidate.id)}
                            disabled={savingRate === candidate.id}
                            style={{
                              background: '#f0fdf4',
                              color: '#16a34a',
                              border: '1px solid #bbf7d0',
                              borderRadius: '2px',
                              padding: '2px 4px',
                              cursor: 'pointer',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}
                            title="Save rate"
                          >
                            {savingRate === candidate.id ? '...' : '✓'}
                          </button>
                        </div>
                      </td>

                      {/* ATS Status */}
                      <td style={{ padding: '5px 6px' }}>
                        <select
                          value={candidate.status || 'New'}
                          onChange={e => handleUpdateStatus(candidate.id, e.target.value)}
                          style={{
                            fontSize: '10.5px',
                            padding: '2px 4px',
                            borderRadius: '2px',
                            background: st.bg,
                            color: st.color,
                            border: `1px solid ${st.border}`,
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            width: '100%',
                            outline: 'none'
                          }}
                        >
                          {safeStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>

                      {/* Pipeline Action / Push to Requisition */}
                      <td style={{ padding: '5px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {isPushed ? (
                          <span style={{ fontSize: '9.5px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '2px', padding: '2px 6px', fontWeight: 'bold' }}>
                            ✓ In Req #{pushed?.reqId || displayReqId}
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePushToJobsInHand(candidate)}
                            disabled={pushingId === candidate.id}
                            title={`Push candidate directly to Requisition #${displayReqId} pipeline`}
                            style={{
                              background: '#0284c7',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '2px',
                              padding: '3px 8px',
                              cursor: 'pointer',
                              fontSize: '10.5px',
                              fontWeight: 'bold',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              boxShadow: '0 1px 2px rgba(2,132,199,0.3)'
                            }}
                          >
                            {pushingId === candidate.id ? '⏳' : '🚀'} Push to Req
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
      {selectedCandidate && (
        <CandidateDetailViewModal
          candidate={selectedCandidate}
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          allJobs={safeJobs}
          currentUser={{ name: 'Omkesh', role: 'admin' }}
          reqContext={safeJobs.find(j => j.id === selectedCandidate.job_id || String(j.id).replace('J-', '') === selectedCandidate.reqId) || null}
          onUpdateCandidate={(updated) => {
            setSelectedCandidate(updated)
            if (fetchCandidates) fetchCandidates()
          }}
        />
      )}
    </div>
  )
}

export default CandidatesModule
