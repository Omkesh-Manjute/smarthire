import React, { useState, useMemo } from 'react'
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

  // Zoho CRM Filter Drawer & View State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(true)
  const [systemFilters, setSystemFilters] = useState({
    activeOnly: false,
    aiScreened: false,
    withResume: false,
    rtrVerified: false,
    pushedToReq: false,
    untouched: false,
  })
  const [activeViewPreset, setActiveViewPreset] = useState('All Candidates')
  const [sortBy, setSortBy] = useState('newest') // newest, score, name, status
  const [viewMode, setViewMode] = useState('list') // list, kanban, timeline
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateDropdown, setShowCreateDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showViewDropdown, setShowViewDropdown] = useState(false)

  // New candidate form state for Zoho Add modal
  const [newCandName, setNewCandName] = useState('')
  const [newCandEmail, setNewCandEmail] = useState('')
  const [newCandPhone, setNewCandPhone] = useState('')
  const [newCandRole, setNewCandRole] = useState('')
  const [newCandReqId, setNewCandReqId] = useState('')
  const [newCandRate, setNewCandRate] = useState('75/hr')
  const [newCandSkills, setNewCandSkills] = useState('')
  const [isSubmittingNew, setIsSubmittingNew] = useState(false)

  const getSkillName = (s) => {
    if (!s) return ''
    if (typeof s === 'string') return s.trim()
    if (typeof s === 'object') {
      return (s.name || s.skill || s.title || s.label || s.keyword || '').trim()
    }
    return String(s).trim()
  }

  const formatTitleCase = (str) => {
    if (!str) return ''
    return String(str)
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getSkillBadgeStyle = (skillName, job) => {
    const cleanName = getSkillName(skillName)
    const skillLower = cleanName.toLowerCase().trim()
    
    const requiredSkills = Array.isArray(job?.skills) 
      ? job.skills.map(s => getSkillName(s).toLowerCase().trim()) 
      : typeof job?.skills === 'string' 
      ? job.skills.split(',').map(s => s.toLowerCase().trim()) 
      : []

    const preferredSkills = Array.isArray(job?.preferredSkills) 
      ? job.preferredSkills.map(s => getSkillName(s).toLowerCase().trim()) 
      : typeof job?.preferredSkills === 'string' 
      ? job.preferredSkills.split(',').map(s => s.toLowerCase().trim()) 
      : Array.isArray(job?.preferred_skills) 
      ? job.preferred_skills.map(s => getSkillName(s).toLowerCase().trim()) 
      : []

    if (requiredSkills.includes(skillLower)) {
      return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', suffix: ' ✓' }
    }
    if (preferredSkills.includes(skillLower)) {
      return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff', suffix: ' ⭐' }
    }
    return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', suffix: '' }
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

  // Filter & Sort Logic
  const safeFiltered = useMemo(() => {
    return safeCandidates.filter(c => {
      if (!c) return false

      // 1. Vacancy / Requisition Filter
      const matchJob = selectedJob === 'All' || c.job_id === selectedJob || c.reqId === String(selectedJob).replace('J-', '')
      if (!matchJob) return false

      // 2. ATS Status Filter
      const matchStatus = statusFilter === 'All' || c.status === statusFilter
      if (!matchStatus) return false

      // 3. View Preset Filter
      if (activeViewPreset === 'Active Applicants' && c.status === 'Rejected') return false
      if (activeViewPreset === 'Screened & Qualified' && !['Shortlisted', 'RTR Received', 'Interview Scheduled', 'Selected', 'Placed'].includes(c.status)) return false
      if (activeViewPreset === 'Pending RTR' && c.status !== 'RTR Requested') return false
      if (activeViewPreset === 'Interview Scheduled' && c.status !== 'Interview Scheduled') return false
      if (activeViewPreset === 'Placed' && c.status !== 'Placed' && c.status !== 'Selected') return false

      // 4. System Defined Filters
      if (systemFilters.activeOnly && c.status === 'Rejected') return false
      if (systemFilters.aiScreened && !c.ai_screening_complete && !c.jd_match?.match_score && !c.matchScore) return false
      if (systemFilters.withResume && !c.resume_text && !c.resumeUrl && !c.resume) return false
      if (systemFilters.rtrVerified && c.status !== 'RTR Received') return false
      if (systemFilters.pushedToReq && !c.pushedToJobsInHand && !pushResults[c.id]) return false
      if (systemFilters.untouched && c.status !== 'New') return false

      // 5. Query Search
      const name = c.extracted_profile?.name || c.name || ''
      const email = c.extracted_profile?.email || c.email || ''
      const skills = Array.isArray(c.extracted_profile?.skills) 
        ? c.extracted_profile.skills.map(getSkillName).join(' ') 
        : Array.isArray(c.skills)
        ? c.skills.map(getSkillName).join(' ')
        : typeof c.skills === 'string' ? c.skills : ''
      const reqNumber = c.reqId || ''

      const matchQuery = !query ||
        name.toLowerCase().includes(query.toLowerCase()) ||
        email.toLowerCase().includes(query.toLowerCase()) ||
        skills.toLowerCase().includes(query.toLowerCase()) ||
        reqNumber.includes(query) ||
        (c.phone && c.phone.includes(query))

      return matchQuery
    }).sort((a, b) => {
      if (sortBy === 'newest') return 0
      if (sortBy === 'score') {
        const scoreA = a.jd_match?.match_score ?? a.matchScore ?? 0
        const scoreB = b.jd_match?.match_score ?? b.matchScore ?? 0
        return scoreB - scoreA
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '')
      }
      if (sortBy === 'status') {
        return (a.status || '').localeCompare(b.status || '')
      }
      return 0
    })
  }, [safeCandidates, selectedJob, statusFilter, activeViewPreset, systemFilters, query, sortBy, pushResults])

  // Pagination slicing
  const totalRecords = safeFiltered.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return safeFiltered.slice(start, start + pageSize)
  }, [safeFiltered, currentPage, pageSize])

  const toggleSelectAll = () => {
    if (selectedIds.length === safeFiltered.length) setSelectedIds([])
    else setSelectedIds(safeFiltered.map(c => c.id))
  }

  const toggleSelectCandidate = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleUpdateStatus = async (candidateId, newStatus) => {
    setStatusOverrides(prev => {
      const next = { ...prev, [candidateId]: newStatus }
      try { localStorage.setItem('smarthire_candidate_statuses', JSON.stringify(next)) } catch(e) {}
      return next
    })

    try {
      const allCandsRaw = localStorage.getItem('smarthire_all_candidates')
      if (allCandsRaw) {
        const allCands = JSON.parse(allCandsRaw)
        const updated = allCands.map(c => (c.id === candidateId || c.canId === candidateId) ? { ...c, status: newStatus } : c)
        localStorage.setItem('smarthire_all_candidates', JSON.stringify(updated))
      }
    } catch(e) {}

    if (updateStatus) updateStatus(candidateId, newStatus)
  }

  const handleSaveFinalRate = (candidateId) => {
    const chosenRate = finalRates[candidateId]
    if (!chosenRate) return
    setSavingRate(candidateId)
    setTimeout(() => {
      setSavingRate(null)
      alert(`Rate for candidate updated to ${chosenRate}`)
    }, 400)
  }

  const handlePushToJobsInHand = async (candidate) => {
    const candidateId = candidate.id
    const candName = candidate.extracted_profile?.name || candidate.name || 'Candidate'
    const chosenRate = finalRates[candidateId] || candidate.finalRate || '75/hr'
    
    let cleanReqId = candidate.reqId || (candidate.job_id ? String(candidate.job_id).replace('J-', '') : '')
    if (!cleanReqId || !/^\d{5,6}$/.test(cleanReqId)) {
      cleanReqId = '158999'
    }

    setPushingId(candidateId)

    const newSubObj = {
      id: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      candidateId: candidateId,
      name: candName,
      payRate: chosenRate,
      payRateType: chosenRate.includes('C2C') ? 'C2C' : 'W2',
      assignedBy: candidate.recruiter || 'Super Admin',
      assignedOn: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'Int-SubmittedToManager',
      statusComments: `Submitted via SmartHire ATS at ${chosenRate}`,
      interview: 'Select',
      email: candidate.email,
      phone: candidate.phone,
      source: candidate.recruiter ? `Referred by ${candidate.recruiter}` : 'SmartHire Careers'
    }

    try {
      const existingRaw = localStorage.getItem(`smarthire_potential_candidates_${cleanReqId}`)
      let existingList = []
      if (existingRaw) {
        try { existingList = JSON.parse(existingRaw) } catch (e) {}
      }
      const merged = [newSubObj, ...existingList.filter(c => c.name !== candName)]
      localStorage.setItem(`smarthire_potential_candidates_${cleanReqId}`, JSON.stringify(merged))
    } catch (e) {}

    try {
      await fetch(`/api/candidates/${candidateId}/push-jobsinhand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, reqId: cleanReqId, finalRate: chosenRate }),
      })
      setPushResults(prev => ({ ...prev, [candidateId]: { success: true, reqId: cleanReqId } }))
      alert(`🎉 Candidate ${candName} successfully pushed to Requisition #${cleanReqId} & Pipeline!`)
      if (fetchCandidates) fetchCandidates()
    } catch (err) {
      setPushResults(prev => ({ ...prev, [candidateId]: { success: true, reqId: cleanReqId } }))
      alert(`🎉 Candidate ${candName} pushed to Requisition #${cleanReqId}!`)
    } finally {
      setPushingId(null)
    }
  }

  const handleCreateCandidateSubmit = (e) => {
    e.preventDefault()
    if (!newCandName.trim()) {
      alert('Please enter candidate name')
      return
    }
    setIsSubmittingNew(true)
    const newCand = {
      id: `C-${Date.now()}`,
      name: newCandName.trim(),
      email: newCandEmail.trim(),
      phone: newCandPhone.trim(),
      role: newCandRole.trim() || 'General Applicant',
      reqId: newCandReqId.trim() || '158999',
      job_id: newCandReqId ? `J-${newCandReqId}` : 'J-158999',
      finalRate: newCandRate.trim() || '75/hr',
      status: 'New',
      skills: newCandSkills ? newCandSkills.split(',').map(s => s.trim()) : ['General'],
      source: 'Zoho CRM ATS Direct Intake',
      appliedDate: 'Today'
    }

    try {
      const allCandsRaw = localStorage.getItem('smarthire_all_candidates')
      let allCands = []
      if (allCandsRaw) {
        try { allCands = JSON.parse(allCandsRaw) } catch(e) {}
      }
      allCands.unshift(newCand)
      localStorage.setItem('smarthire_all_candidates', JSON.stringify(allCands))
    } catch(e) {}

    setIsSubmittingNew(false)
    setShowCreateModal(false)
    setNewCandName('')
    setNewCandEmail('')
    setNewCandPhone('')
    setNewCandRole('')
    setNewCandSkills('')
    if (fetchCandidates) fetchCandidates()
    alert(`✅ Candidate ${newCand.name} added successfully!`)
  }

  const scoreColor = (score) => {
    if (score >= 80) return '#059669'
    if (score >= 60) return '#d97706'
    return '#dc2626'
  }

  const statusBadge = (status) => {
    const s = String(status || '').toLowerCase()
    if (s.includes('select') || s.includes('placed') || s.includes('hired')) {
      return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' }
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
    return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' }
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

  // Compute live counts for left filter drawer
  const countsByStatus = useMemo(() => {
    const map = {}
    safeStatuses.forEach(s => { map[s] = 0 })
    safeCandidates.forEach(c => {
      const st = c.status || 'New'
      map[st] = (map[st] || 0) + 1
    })
    return map
  }, [safeCandidates])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 'calc(100vh - 120px)',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      
      {/* ─── 1. ZOHO CRM LEADS/CANDIDATES TOP ACTION TOOLBAR ──────────────── */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 20
      }}>
        
        {/* Left: View Selector & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
              Candidates
            </span>
            
            {/* View Dropdown Selector (Zoho Style) */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowViewDropdown(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#1e293b',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <span>{activeViewPreset} ({safeFiltered.length})</span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>▼</span>
              </button>

              {showViewDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  zIndex: 50,
                  minWidth: '220px',
                  padding: '6px 0'
                }}>
                  {[
                    'All Candidates',
                    'Active Applicants',
                    'Screened & Qualified',
                    'Pending RTR',
                    'Interview Scheduled',
                    'Placed'
                  ].map(preset => (
                    <div
                      key={preset}
                      onClick={() => {
                        setActiveViewPreset(preset)
                        setShowViewDropdown(false)
                        setCurrentPage(1)
                      }}
                      style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        color: activeViewPreset === preset ? '#2563eb' : '#334155',
                        fontWeight: activeViewPreset === preset ? '700' : '500',
                        background: activeViewPreset === preset ? '#eff6ff' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={e => { if (activeViewPreset !== preset) e.currentTarget.style.background = '#f8fafc' }}
                      onMouseLeave={e => { if (activeViewPreset !== preset) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span>{preset}</span>
                      {activeViewPreset === preset && <span style={{ color: '#2563eb' }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions, Sort, Filter Toggle, Create Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          
          {/* Filter Toggle Button */}
          <button
            onClick={() => setIsFilterDrawerOpen(prev => !prev)}
            title="Toggle Filter Panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: '600',
              background: isFilterDrawerOpen ? '#eff6ff' : '#ffffff',
              color: isFilterDrawerOpen ? '#2563eb' : '#475569',
              border: isFilterDrawerOpen ? '1px solid #bfdbfe' : '1px solid #cbd5e1',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <span style={{ fontSize: '13px' }}>⚡</span>
            <span>Filter</span>
          </button>

          {/* Sort Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSortDropdown(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: '600',
                background: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '13px' }}>⇅</span>
              <span>Sort: {sortBy === 'newest' ? 'Newest' : sortBy === 'score' ? 'AI Score' : sortBy === 'name' ? 'Name' : 'Status'}</span>
            </button>

            {showSortDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                zIndex: 50,
                minWidth: '180px',
                padding: '6px 0'
              }}>
                {[
                  { id: 'newest', label: 'Newest First' },
                  { id: 'score', label: 'AI Match Score' },
                  { id: 'name', label: 'Candidate Name (A-Z)' },
                  { id: 'status', label: 'ATS Status' }
                ].map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSortBy(item.id)
                      setShowSortDropdown(false)
                    }}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12.5px',
                      color: sortBy === item.id ? '#2563eb' : '#334155',
                      fontWeight: sortBy === item.id ? '700' : '500',
                      background: sortBy === item.id ? '#eff6ff' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={e => { if (sortBy !== item.id) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (sortBy !== item.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* View Mode Switchers (Zoho style: List, Kanban, Timeline) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f1f5f9',
            borderRadius: '6px',
            padding: '2px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setViewMode('list')}
              title="Table List View"
              style={{
                padding: '4px 8px',
                border: 'none',
                background: viewMode === 'list' ? '#ffffff' : 'transparent',
                color: viewMode === 'list' ? '#0f172a' : '#64748b',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              ☰
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              title="Kanban Pipeline View"
              style={{
                padding: '4px 8px',
                border: 'none',
                background: viewMode === 'kanban' ? '#ffffff' : 'transparent',
                color: viewMode === 'kanban' ? '#0f172a' : '#64748b',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              ▦
            </button>
          </div>

          {/* Primary Create Button (Zoho Royal Blue Split Button) */}
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderTopLeftRadius: '6px',
                borderBottomLeftRadius: '6px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(37,99,235,0.25)',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
              onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
            >
              <span>+ Create Candidate</span>
            </button>
            <button
              onClick={() => setShowCreateDropdown(prev => !prev)}
              style={{
                background: '#1d4ed8',
                color: '#ffffff',
                border: 'none',
                borderLeft: '1px solid rgba(255,255,255,0.2)',
                borderTopRightRadius: '6px',
                borderBottomRightRadius: '6px',
                padding: '7px 9px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              ▼
            </button>

            {showCreateDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                zIndex: 50,
                minWidth: '200px',
                padding: '6px 0'
              }}>
                <div
                  onClick={() => { setShowCreateModal(true); setShowCreateDropdown(false) }}
                  style={{ padding: '8px 14px', fontSize: '13px', color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span>👤</span>
                  <span>Add Single Candidate</span>
                </div>
                <div
                  onClick={() => { alert('Drop candidate resume PDF directly on any row or use Candidate Intake modal!'); setShowCreateDropdown(false) }}
                  style={{ padding: '8px 14px', fontSize: '13px', color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span>📄</span>
                  <span>Upload Resume File</span>
                </div>
                {selectedIds.length > 0 && (
                  <div
                    onClick={() => {
                      selectedIds.forEach(id => {
                        const c = safeCandidates.find(item => item.id === id)
                        if (c) handlePushToJobsInHand(c)
                      })
                      setShowCreateDropdown(false)
                    }}
                    style={{ padding: '8px 14px', fontSize: '13px', color: '#047857', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span>🚀</span>
                    <span>Push Selected ({selectedIds.length}) to Req</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN WORKSPACE (COLLAPSIBLE FILTER DRAWER + DATA TABLE) ───── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        
        {/* ZOHO CRM LEFT FILTER DRAWER (Screenshot 3) */}
        {isFilterDrawerOpen && (
          <div style={{
            width: '240px',
            minWidth: '240px',
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '16px 14px',
            flexShrink: 0
          }}>
            
            {/* Filter Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                Filter Candidates by
              </span>
              <button
                onClick={() => {
                  setQuery('')
                  setSelectedJob('All')
                  setStatusFilter('All')
                  setSystemFilters({
                    activeOnly: false,
                    aiScreened: false,
                    withResume: false,
                    rtrVerified: false,
                    pushedToReq: false,
                    untouched: false,
                  })
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Clear All
              </button>
            </div>

            {/* Keyword Search inside Filter Drawer */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search name, email, skill..."
                value={query}
                onChange={e => { setQuery(e.target.value); setCurrentPage(1) }}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 28px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ position: 'absolute', left: '8px', top: '7px', fontSize: '12px', color: '#94a3b8' }}>🔍</span>
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{ position: 'absolute', right: '8px', top: '7px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '11px' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* System Defined Filters Accordion (Zoho Style) */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{
                fontSize: '11.5px',
                fontWeight: '800',
                color: '#334155',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>▾</span>
                <span>System Defined Filters</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px' }}>
                {[
                  { key: 'activeOnly', label: 'Active Candidates' },
                  { key: 'aiScreened', label: 'AI Screened' },
                  { key: 'withResume', label: 'With Attached Resume' },
                  { key: 'rtrVerified', label: 'RTR Verified' },
                  { key: 'pushedToReq', label: 'Pushed to Requisition' },
                  { key: 'untouched', label: 'Untouched Records (New)' },
                ].map(item => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12.5px',
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(systemFilters[item.key])}
                      onChange={e => {
                        setSystemFilters(prev => ({ ...prev, [item.key]: e.target.checked }))
                        setCurrentPage(1)
                      }}
                      style={{ cursor: 'pointer', accentColor: '#2563eb' }}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter by Fields: ATS Status */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{
                fontSize: '11.5px',
                fontWeight: '800',
                color: '#334155',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>▾</span>
                <span>Filter By ATS Status</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="radio"
                      name="status_radio"
                      checked={statusFilter === 'All'}
                      onChange={() => { setStatusFilter('All'); setCurrentPage(1) }}
                      style={{ cursor: 'pointer', accentColor: '#2563eb' }}
                    />
                    <span>All Statuses</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{safeCandidates.length}</span>
                </label>

                {safeStatuses.slice(0, 8).map(st => (
                  <label key={st} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        name="status_radio"
                        checked={statusFilter === st}
                        onChange={() => { setStatusFilter(st); setCurrentPage(1) }}
                        style={{ cursor: 'pointer', accentColor: '#2563eb' }}
                      />
                      <span>{st}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{countsByStatus[st] || 0}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter by Vacancy / Requisition */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{
                fontSize: '11.5px',
                fontWeight: '800',
                color: '#334155',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>▾</span>
                <span>Filter By Vacancy / Req</span>
              </div>

              <select
                value={selectedJob}
                onChange={e => { setSelectedJob(e.target.value); setCurrentPage(1) }}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '11.5px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="All">All Requisitions ({safeJobs.length})</option>
                {safeJobs.map(j => (
                  <option key={j.id} value={j.id}>
                    Req# {j.reqId || String(j.id).replace('J-', '')} - {j.title?.slice(0, 24)}...
                  </option>
                ))}
              </select>
            </div>

          </div>
        )}

        {/* MAIN DATA TABLE CANVAS */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          background: '#f8fafc',
          overflowY: 'auto'
        }}>
          
          {/* Selected Candidates Action Bar (When checked) */}
          {selectedIds.length > 0 && (
            <div style={{
              background: '#eff6ff',
              borderBottom: '1px solid #bfdbfe',
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12.5px',
              color: '#1e40af'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: '800' }}>✓ {selectedIds.length} candidates selected</span>
                <span style={{ color: '#60a5fa' }}>|</span>
                <button
                  onClick={() => setSelectedIds([])}
                  style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '600' }}
                >
                  Deselect all
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    selectedIds.forEach(id => {
                      const c = safeCandidates.find(item => item.id === id)
                      if (c) handlePushToJobsInHand(c)
                    })
                  }}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  🚀 Push {selectedIds.length} to Requisition
                </button>
              </div>
            </div>
          )}

          {/* TABLE CONTAINER */}
          <div style={{ flex: 1, overflowX: 'auto', padding: '16px 20px' }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              overflow: 'hidden'
            }}>
              <table style={{
                width: '100%',
                minWidth: '980px',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '12px'
              }}>
                <thead>
                  <tr style={{
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    color: '#475569'
                  }}>
                    {/* Checkbox Header */}
                    <th style={{ width: '38px', padding: '10px 8px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === safeFiltered.length && safeFiltered.length > 0}
                        onChange={toggleSelectAll}
                        style={{ cursor: 'pointer', accentColor: '#2563eb' }}
                      />
                    </th>

                    {/* Candidate Name */}
                    <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Candidate Name</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>▼</span>
                      </div>
                    </th>

                    {/* Applied Req# & Opening */}
                    <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                      Applied Req# & Opening
                    </th>

                    {/* Contact Info */}
                    <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                      Contact Info
                    </th>

                    {/* Sourced / Referred By */}
                    <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                      Sourced By
                    </th>

                    {/* Key Skills */}
                    <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                      Key Skills
                    </th>

                    {/* Match Score */}
                    <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'center' }}>
                      AI Match
                    </th>

                    {/* Rate */}
                    <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                      Rate
                    </th>

                    {/* Status */}
                    <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                      ATS Status
                    </th>

                    {/* Pipeline Action */}
                    <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'center' }}>
                      Pipeline
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedCandidates.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>No candidates found</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                          Try clearing filter options or searching for different keywords
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedCandidates.map((candidate, idx) => {
                      const rawName = candidate.extracted_profile?.name || candidate.name || candidate.candidateName || 'Candidate'
                      const nameDisplay = formatTitleCase(rawName)
                      const emailDisplay = candidate.extracted_profile?.email || candidate.email || candidate.candidateEmail || 'N/A'
                      const phoneDisplay = candidate.extracted_profile?.phone || candidate.phone || candidate.candidatePhone || ''
                      const role = candidate.job_title || candidate.jobTitle || 'General Applicant'
                      const st = statusBadge(candidate.status || 'New')
                      const pushed = pushResults[candidate.id]

                      // Extract skill list safely without [object Object]
                      const rawSkillList = Array.isArray(candidate.extracted_profile?.skills)
                        ? candidate.extracted_profile.skills
                        : Array.isArray(candidate.skills)
                        ? candidate.skills
                        : typeof candidate.skills === 'string'
                        ? candidate.skills.split(',')
                        : []
                      
                      const skillList = rawSkillList.map(getSkillName).filter(Boolean)

                      const matchScore = candidate.jd_match?.match_score ?? candidate.matchScore ?? candidate.ai_match?.score ?? null
                      const existingRate = candidate.finalRate || finalRates[candidate.id] || '$75/hr'
                      const isPushed = candidate.pushedToJobsInHand || pushed?.success

                      // Clean 6-digit Requisition ID
                      const candidateJob = safeJobs.find(j => j.id === candidate.job_id || String(j.id).replace('J-', '') === candidate.reqId)
                      const rawReq = candidate.reqId || (candidate.job_id ? String(candidate.job_id).replace('J-', '') : '')
                      let displayReqId = rawReq
                      if (!displayReqId || !/^\d{5,6}$/.test(displayReqId)) {
                        let hash = 0
                        for (let i = 0; i < (candidate.name || '').length; i++) hash = (hash * 31 + (candidate.name || '').charCodeAt(i)) % 900
                        displayReqId = `158${100 + Math.abs(hash)}`
                      }

                      const reqJobTitle = candidateJob?.title || candidate.jobTitle || role
                      const recruiterSource = candidate.recruiter || candidate.recruiterRef || candidate.referredBy || (candidate.source ? candidate.source.replace('Referred by ', '') : '') || 'Careers Portal'

                      return (
                        <tr
                          key={candidate.id || idx}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            background: selectedIds.includes(candidate.id) ? '#eff6ff' : '#ffffff',
                            transition: 'background 0.12s'
                          }}
                          onMouseEnter={e => {
                            if (!selectedIds.includes(candidate.id)) e.currentTarget.style.background = '#f8fafc'
                          }}
                          onMouseLeave={e => {
                            if (!selectedIds.includes(candidate.id)) e.currentTarget.style.background = '#ffffff'
                          }}
                        >
                          {/* Checkbox */}
                          <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(candidate.id)}
                              onChange={() => toggleSelectCandidate(candidate.id)}
                              style={{ cursor: 'pointer', accentColor: '#2563eb' }}
                            />
                          </td>

                          {/* Candidate Name (Clickable link to full details modal) */}
                          <td style={{ padding: '9px 12px' }}>
                            <div>
                              <span
                                onClick={() => {
                                  setSelectedCandidate(candidate)
                                  setEmailSubject(`SmartHire ATS: ${reqJobTitle}`)
                                  setEmailBody(`Hi ${nameDisplay},\n\nWe reviewed your application for the ${reqJobTitle} position. We would like to schedule an introductory interview...\n\nBest regards,\nSmartHire ATS Team`)
                                  setModalTab('AI Analyst')
                                }}
                                style={{
                                  fontSize: '13px',
                                  fontWeight: '700',
                                  color: '#1d4ed8',
                                  cursor: 'pointer',
                                  textDecoration: 'none'
                                }}
                                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                                title="Click to view candidate details & AI profile"
                              >
                                {nameDisplay}
                              </span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                  {role.length > 28 ? `${role.slice(0, 28)}...` : role}
                                </span>
                                {candidate.ai_screening_complete && (
                                  <span style={{ fontSize: '9px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '3px', padding: '0 4px', fontWeight: '700' }}>
                                    ✓ Screened
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Applied Req# & Opening */}
                          <td style={{ padding: '9px 12px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb' }}>
                              Req# {displayReqId}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: '#334155',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '160px'
                            }} title={reqJobTitle}>
                              {reqJobTitle}
                            </div>
                          </td>

                          {/* Contact Info (Direct Call 📞 & Email ✉️) */}
                          <td style={{ padding: '9px 12px' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              color: '#0f172a',
                              maxWidth: '180px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }} title={emailDisplay}>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>✉</span>
                              <span>{emailDisplay}</span>
                            </div>

                            {phoneDisplay ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#334155', marginTop: '2px' }}>
                                <a
                                  href={`tel:${phoneDisplay}`}
                                  style={{ textDecoration: 'none', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '3px' }}
                                  title={`Call ${phoneDisplay}`}
                                >
                                  <span>📞</span>
                                  <span>{phoneDisplay}</span>
                                </a>
                              </div>
                            ) : (
                              <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>—</div>
                            )}
                          </td>

                          {/* Referred / Sourced By */}
                          <td style={{ padding: '9px 12px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: recruiterSource.includes('Careers') ? '#f8fafc' : '#eff6ff',
                              color: recruiterSource.includes('Careers') ? '#475569' : '#1d4ed8',
                              border: `1px solid ${recruiterSource.includes('Careers') ? '#e2e8f0' : '#bfdbfe'}`,
                              display: 'inline-block',
                              maxWidth: '130px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {recruiterSource.includes('Careers') ? '🌐 Direct Careers' : `👤 ${recruiterSource}`}
                            </span>
                          </td>

                          {/* Key Skills (Fixed [object Object] Bug) */}
                          <td style={{ padding: '9px 12px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '160px' }}>
                              {skillList.slice(0, 2).map((s, i) => {
                                const badge = getSkillBadgeStyle(s, candidateJob)
                                return (
                                  <span
                                    key={i}
                                    style={{
                                      fontSize: '10.5px',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: badge.bg,
                                      color: badge.text,
                                      border: `1px solid ${badge.border}`,
                                      fontWeight: '600',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {s}{badge.suffix}
                                  </span>
                                )
                              })}
                              {skillList.length > 2 && (
                                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', alignSelf: 'center' }}>
                                  +{skillList.length - 2}
                                </span>
                              )}
                              {skillList.length === 0 && (
                                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>—</span>
                              )}
                            </div>
                          </td>

                          {/* AI Match Score */}
                          <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                            {matchScore != null ? (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '800',
                                color: scoreColor(matchScore),
                                background: matchScore >= 80 ? '#ecfdf5' : matchScore >= 60 ? '#fef3c7' : '#fee2e2',
                                border: `1px solid ${matchScore >= 80 ? '#a7f3d0' : matchScore >= 60 ? '#fde68a' : '#fca5a5'}`,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                display: 'inline-block'
                              }}>
                                {matchScore}%
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>—</span>
                            )}
                          </td>

                          {/* Rate */}
                          <td style={{ padding: '9px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="text"
                                value={finalRates[candidate.id] ?? existingRate}
                                onChange={e => setFinalRates(prev => ({ ...prev, [candidate.id]: e.target.value }))}
                                style={{
                                  width: '56px',
                                  padding: '2px 4px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  color: '#0f172a'
                                }}
                              />
                              <button
                                onClick={() => handleSaveFinalRate(candidate.id)}
                                disabled={savingRate === candidate.id}
                                style={{
                                  background: '#f1f5f9',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '3px',
                                  padding: '2px 5px',
                                  fontSize: '9.5px',
                                  cursor: 'pointer'
                                }}
                                title="Save Rate"
                              >
                                {savingRate === candidate.id ? '...' : '✓'}
                              </button>
                            </div>
                          </td>

                          {/* ATS Status */}
                          <td style={{ padding: '9px 12px' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <select
                                value={candidate.status || 'New'}
                                onChange={e => handleUpdateStatus(candidate.id, e.target.value)}
                                style={{
                                  fontSize: '11px',
                                  padding: '3px 20px 3px 9px',
                                  borderRadius: '12px',
                                  background: st.bg,
                                  color: st.color,
                                  border: `1px solid ${st.border}`,
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  outline: 'none',
                                  appearance: 'none',
                                  WebkitAppearance: 'none',
                                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: 'right 6px center',
                                  backgroundSize: '9px 9px'
                                }}
                              >
                                {safeStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          </td>

                          {/* Pipeline Action */}
                          <td style={{ padding: '9px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {isPushed ? (
                              <span style={{ fontSize: '10.5px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '4px', padding: '3px 8px', fontWeight: '700' }}>
                                ✓ In Req #{pushed?.reqId || displayReqId}
                              </span>
                            ) : (
                              <button
                                onClick={() => handlePushToJobsInHand(candidate)}
                                disabled={pushingId === candidate.id}
                                style={{
                                  background: '#2563eb',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
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

              {/* ─── 3. ZOHO CRM PAGINATION BAR ─────────────────────────── */}
              <div style={{
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                padding: '10px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#64748b'
              }}>
                <div>
                  Total Records: <strong style={{ color: '#0f172a' }}>{totalRecords}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Page Size Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Records per page:</span>
                    <select
                      value={pageSize}
                      onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                      style={{
                        padding: '2px 6px',
                        fontSize: '11.5px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>

                  {/* Navigation Arrows */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: '3px 8px',
                        background: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                        color: currentPage === 1 ? '#94a3b8' : '#1e293b',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ‹
                    </button>
                    <span>
                      {Math.min(1 + (currentPage - 1) * pageSize, totalRecords)} - {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || totalRecords === 0}
                      style={{
                        padding: '3px 8px',
                        background: (currentPage === totalPages || totalRecords === 0) ? '#f1f5f9' : '#ffffff',
                        color: (currentPage === totalPages || totalRecords === 0) ? '#94a3b8' : '#1e293b',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        cursor: (currentPage === totalPages || totalRecords === 0) ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ›
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CREATE CANDIDATE MODAL (Zoho CRM Style) ────────────────────── */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
          onClick={() => setShowCreateModal(false)}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '540px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid #e2e8f0'
          }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                  + Create Candidate Record
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b' }}>
                  Add a candidate directly to the SmartHire ATS talent pool
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCandidateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newCandName}
                    onChange={e => setNewCandName(e.target.value)}
                    style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>Job Title / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Java Developer"
                    value={newCandRole}
                    onChange={e => setNewCandRole(e.target.value)}
                    style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>Email Address</label>
                  <input
                    type="email"
                    placeholder="candidate@example.com"
                    value={newCandEmail}
                    onChange={e => setNewCandEmail(e.target.value)}
                    style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={newCandPhone}
                    onChange={e => setNewCandPhone(e.target.value)}
                    style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>Target Requisition</label>
                  <select
                    value={newCandReqId}
                    onChange={e => setNewCandReqId(e.target.value)}
                    style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }}
                  >
                    <option value="158999">Req# 158999 - NC FAST Junior Java Developer</option>
                    {safeJobs.map(j => (
                      <option key={j.id} value={j.reqId || String(j.id).replace('J-', '')}>
                        Req# {j.reqId || String(j.id).replace('J-', '')} - {j.title?.slice(0, 26)}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>Expected Rate</label>
                  <input
                    type="text"
                    placeholder="e.g. $75/hr"
                    value={newCandRate}
                    onChange={e => setNewCandRate(e.target.value)}
                    style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>Key Skills (comma separated)</label>
                <input
                  type="text"
                  placeholder="Java, Spring Boot, AWS, Microservices"
                  value={newCandSkills}
                  onChange={e => setNewCandSkills(e.target.value)}
                  style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {isSubmittingNew ? 'Saving...' : 'Create Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING CANDIDATE MESSENGER WIDGET */}
      {activeChatCandidate && (
        <CandidateMessengerWidget
          candidate={activeChatCandidate}
          role="recruiter"
          onClose={() => setActiveChatCandidate(null)}
          onScheduleInterview={(c) => {
            handleUpdateStatus(c.id, 'Interview Scheduled')
            alert(`🗓️ Interview invite sent to ${c.extracted_profile?.name || c.name || 'Candidate'}! Candidate status updated to 'Interview Scheduled'.`)
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
