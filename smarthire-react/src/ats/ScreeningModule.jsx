import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import InfinityLoader from '../components/InfinityLoader'
import PopButton from '../components/ui/PopButton'

const API = '/api/screening'

// Comprehensive check for mismatch between candidate-entered location and device GPS
export const checkLocationMismatch = (enteredLoc, gpsGeo) => {
  if (!enteredLoc && !gpsGeo) return { hasCheck: false, isMismatch: false }
  const gpsStr = ((gpsGeo && (gpsGeo.cityState || gpsGeo.resolvedAddress)) || '').trim()
  const entered = String(enteredLoc || '').trim()
  if (!gpsStr || !entered) return { hasCheck: false, isMismatch: false }

  const cleanTokens = (str) =>
    str.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2 && !['city', 'the', 'and', 'state', 'usa', 'united', 'states', 'county', 'town', 'village', 'street', 'ave', 'road'].includes(t))

  const enteredTokens = cleanTokens(entered)
  const gpsTokens = cleanTokens(gpsStr)

  const stateMap = {
    wi: 'wisconsin', mo: 'missouri', ct: 'connecticut', tx: 'texas',
    ca: 'california', ny: 'new york', nc: 'north carolina', il: 'illinois',
    ga: 'georgia', fl: 'florida', va: 'virginia', oh: 'ohio', mi: 'michigan',
    pa: 'pennsylvania', nj: 'new jersey', ma: 'massachusetts', co: 'colorado',
    wa: 'washington', az: 'arizona', tn: 'tennessee', in: 'indiana', md: 'maryland',
    mh: 'maharashtra', dl: 'delhi', ka: 'karnataka', up: 'uttar pradesh', ts: 'telangana'
  }

  const expandStates = (tokens) => {
    const res = new Set(tokens)
    tokens.forEach(t => {
      if (stateMap[t]) res.add(stateMap[t])
      Object.entries(stateMap).forEach(([k, v]) => {
        if (v === t || v.includes(t)) res.add(k)
      })
    })
    return Array.from(res)
  }

  const expEntered = expandStates(enteredTokens)
  const expGps = expandStates(gpsTokens)

  const overlap = expEntered.some(t => expGps.includes(t))
  const isMismatch = !overlap

  return {
    hasCheck: true,
    isMismatch,
    enteredLocation: entered,
    actualGpsLocation: gpsStr || `${gpsGeo?.latitude?.toFixed(2)}°, ${gpsGeo?.longitude?.toFixed(2)}°`,
    statusText: isMismatch ? 'Location Discrepancy Flagged' : 'Location Verified'
  }
}

export default function ScreeningModule({ jobsList = [], allCandidates = [], currentUser = null, isSuperAdmin = false }) {
  // Derive current user identity for role-based session filtering
  const currentUserEmail = (currentUser?.email || '').toLowerCase().trim()
  const currentUserRef = (currentUser?.refCode || '').toLowerCase().trim()
  const currentUserName = (currentUser?.name || '').toLowerCase().trim()

  // Derive list of all available recruiters across the organization
  const allAvailableRecruiters = useMemo(() => {
    const list = [
      { name: 'Omkesh', email: 'omkesh@coolsofttech.com' },
      { name: 'Sukamal Chatterjee', email: 'kamal@coolsofttech.com' },
      { name: 'Gourav', email: 'gourav@coolsofttech.com' },
      { name: 'Vaibhav Bisen', email: 'vaibhav@coolsofttech.com' },
      { name: 'Naveen Bhardwaj', email: 'naveen@coolsofttech.com' },
      { name: 'Rahul Sharma', email: 'rahul@coolsofttech.com' },
      { name: 'Priya Verma', email: 'priya@coolsofttech.com' },
      { name: 'Alok Manager', email: 'manager@coolsofttech.com' }
    ]
    try {
      const stored = localStorage.getItem('smarthire_recruiters')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          parsed.forEach(u => {
            if (u && u.name && !list.some(r => r.name.toLowerCase() === u.name.toLowerCase())) {
              list.push({ name: u.name, email: u.email || '' })
            }
          })
        }
      }
    } catch(e) {}
    // If jobs have recruiters
    if (Array.isArray(jobsList)) {
      jobsList.forEach(j => {
        if (j.recruiterName && !list.some(r => r.name.toLowerCase() === j.recruiterName.toLowerCase())) {
          list.push({ name: j.recruiterName, email: '' })
        }
        if (Array.isArray(j.assignedRecruiters)) {
          j.assignedRecruiters.forEach(ar => {
            if (ar && typeof ar === 'string' && !list.some(r => r.name.toLowerCase() === ar.toLowerCase())) {
              list.push({ name: ar, email: '' })
            }
          })
        }
      })
    }
    // Also include currentUser if not already present
    if (currentUser?.name && !list.some(r => r.name.toLowerCase() === currentUser.name.toLowerCase())) {
      list.push({ name: currentUser.name, email: currentUser.email || '' })
    }
    return list
  }, [jobsList, currentUser])

  // Helper to attach authorization and recruiter identity headers for all screening API calls
  const getAuthHeaders = useCallback((contentTypeJson = false) => {
    let email = 'omkesh@coolsofttech.com'
    let role = 'superadmin'
    try {
      const u = JSON.parse(localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user') || '{}')
      if (u.email) email = u.email
      if (u.role) role = u.role
      const activeRole = localStorage.getItem('smarthire_active_role')
      if (activeRole) role = activeRole
    } catch (_) {}
    if (currentUser?.email) email = currentUser.email
    if (currentUser?.role) role = currentUser.role
    if (isSuperAdmin || email.toLowerCase().includes('omkesh')) role = 'superadmin'

    let token = localStorage.getItem('smarthire_token') || localStorage.getItem('token') || 'token-omkesh'
    if (token === 'null' || token === 'undefined' || !token) token = 'token-omkesh'
    const headers = {
      'Authorization': `Bearer ${token}`,
      'x-recruiter-email': email,
      'x-recruiter-role': role
    }
    if (contentTypeJson) {
      headers['Content-Type'] = 'application/json'
    }
    return headers
  }, [currentUser, isSuperAdmin])

  // Helper to dynamically resolve recruiter name who generated the screening link
  const getRecruiterName = (session) => {
    if (!session) return 'Omkesh'
    if (session.recruiterName && session.recruiterName.trim()) return session.recruiterName.trim()
    if (session.createdByName && session.createdByName.trim()) return session.createdByName.trim()

    if (session.jobId && Array.isArray(jobsList)) {
      const job = jobsList.find(j => j.id === session.jobId || j.jobId === session.jobId)
      if (job?.recruiterName) return job.recruiterName
      if (Array.isArray(job?.assignedRecruiters) && job.assignedRecruiters.length > 0) return job.assignedRecruiters[0]
      if (job?.assignedRecruiter) return job.assignedRecruiter
    }

    const email = session.recruiterEmail || session.createdByEmail || (typeof session.createdBy === 'string' && session.createdBy.includes('@') ? session.createdBy : '')
    if (email) {
      const prefix = email.split('@')[0].replace(/[._-]/g, ' ')
      return prefix.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }

    if (typeof session.createdBy === 'string' && session.createdBy.trim() && !session.createdBy.startsWith('U-')) {
      return session.createdBy.trim()
    }

    return 'Omkesh'
  }

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'submitted', 'shortlisted', 'reviewed', 'rejected'
  const [filterFormat, setFilterFormat] = useState('all') // 'all', 'video', 'audio', 'text'
  const [filterRecruiter, setFilterRecruiter] = useState('all') // 'all' or specific recruiter
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Campaign Builder Modal States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creationMode, setCreationMode] = useState('req') // 'req' or 'custom'
  const [customJobTitle, setCustomJobTitle] = useState('')
  const [pastedJd, setPastedJd] = useState('')
  const [selectedJobId, setSelectedJobId] = useState('')
  const [candidateNameInput, setCandidateNameInput] = useState('')
  const [candidateEmailInput, setCandidateEmailInput] = useState('')
  const [selectedRecruiter, setSelectedRecruiter] = useState(currentUser?.name || 'Omkesh')
  const [campaignTitle, setCampaignTitle] = useState('')
  const [allowedFormats, setAllowedFormats] = useState(['video', 'audio', 'text'])
  const [maxDuration, setMaxDuration] = useState(120)
  const [expiryOption, setExpiryOption] = useState('7days') // '3days', '7days', '14days', 'custom', 'never'
  const [customExpiryDate, setCustomExpiryDate] = useState('')

  // 1-Click Reassign Recruiter on Screening Session
  const handleUpdateSessionRecruiter = async (sessionId, newRecruiterName) => {
    if (!sessionId || !newRecruiterName) return
    const recObj = allAvailableRecruiters.find(r => r.name.toLowerCase() === newRecruiterName.toLowerCase())
    const recEmail = recObj?.email || ''

    // Optimistic UI update
    setSessions(prev => prev.map(s => {
      if (s.sessionId === sessionId || s.id === sessionId || s._id === sessionId) {
        return {
          ...s,
          recruiterName: newRecruiterName,
          createdByName: newRecruiterName,
          recruiterEmail: recEmail || s.recruiterEmail,
          createdByEmail: recEmail || s.createdByEmail
        }
      }
      return s
    }))

    if (reviewSession && (reviewSession.sessionId === sessionId || reviewSession.id === sessionId)) {
      setReviewSession(prev => ({
        ...prev,
        recruiterName: newRecruiterName,
        createdByName: newRecruiterName,
        recruiterEmail: recEmail || prev.recruiterEmail,
        createdByEmail: recEmail || prev.createdByEmail
      }))
    }

    try {
      await fetch(`${API}/${sessionId}/recruiter`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          recruiterName: newRecruiterName,
          recruiterEmail: recEmail
        })
      })
    } catch (err) {
      console.error('Failed to update recruiter on server:', err)
    }
  }

  const [questions, setQuestions] = useState([
    {
      id: 'q1',
      text: 'Give a 60-90 second introduction of your background, key technical skills, and recent work relevant to this position.',
      description: 'Highlight your strongest languages, frameworks, and recent achievements.',
      allowedFormats: ['video', 'audio', 'text'],
      maxDuration: 120
    },
    {
      id: 'q2',
      text: 'Describe a recent challenging technical problem or architecture you designed and how you resolved it.',
      description: 'Explain the technical hurdle, your contribution, and the measurable outcome.',
      allowedFormats: ['video', 'audio', 'text'],
      maxDuration: 120
    },
    {
      id: 'q3',
      text: 'What is your current work authorization status, earliest availability / notice period, and desired hourly rate or salary?',
      description: 'Confirm your current location, relocation/remote preference, and visa status.',
      allowedFormats: ['video', 'audio', 'text'],
      maxDuration: 90
    }
  ])
  const [isCreating, setIsCreating] = useState(false)
  const [createdLinkResult, setCreatedLinkResult] = useState(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [copiedSessionId, setCopiedSessionId] = useState(null)

  // Direct Email Screening Invitation Modal States
  const [showSendEmailModal, setShowSendEmailModal] = useState(false)
  const [emailModalTo, setEmailModalTo] = useState('')
  const [emailModalSubject, setEmailModalSubject] = useState('')
  const [emailModalBody, setEmailModalBody] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailSuccessToast, setEmailSuccessToast] = useState('')
  const [emailErrorToast, setEmailErrorToast] = useState('')

  const handleOpenEmailModal = (linkData) => {
    const jobTitle = linkData?.jobTitle || 'Open Position'
    const screeningUrl = linkData?.screeningUrl || ''
    const candName = linkData?.candidateName || ''
    const candEmail = linkData?.candidateEmail || ''
    setEmailModalTo(candEmail)
    setEmailModalSubject(`Interview Screening Invitation: ${jobTitle} — SmartHire Assessment`)
    setEmailModalBody(
`Dear ${candName || 'Candidate'},

Thank you for your interest in the ${jobTitle} position with our team.

We invite you to complete a short asynchronous video & audio assessment. This interactive screening takes approximately 5–8 minutes and allows our recruitment team to evaluate your technical background directly.

Screening Link:
${screeningUrl}

Instructions:
• Please complete the assessment from a desktop or laptop computer with a working camera, microphone, and desktop screen sharing support.
• The session is conducted in a secure, continuous proctored environment.
• No login or account setup is required — simply open the link above to get started.

If you have any questions or experience any technical difficulties, please reply directly to this email.

Best regards,
SmartHire Recruitment Team`
    )
    setEmailSuccessToast('')
    setEmailErrorToast('')
    setShowSendEmailModal(true)
  }

  const handleSendScreeningEmail = async (e) => {
    if (e) e.preventDefault()
    if (!emailModalTo || !emailModalTo.trim()) {
      setEmailErrorToast('Please enter candidate email address.')
      return
    }
    setIsSendingEmail(true)
    setEmailSuccessToast('')
    setEmailErrorToast('')
    try {
      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
      const recEmail = u.email || 'recruiter@coolsofttech.com'
      const res = await fetch('/api/recruiter/send-direct-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterEmail: recEmail,
          to: emailModalTo.trim(),
          subject: emailModalSubject.trim(),
          body: emailModalBody.trim(),
          candidateName: 'Candidate',
          candidateId: 'screening-invite'
        })
      })
      const data = await res.json()
      if (data.success) {
        setEmailSuccessToast(`Email successfully dispatched to ${emailModalTo.trim()}!`)
        setTimeout(() => {
          setShowSendEmailModal(false)
          setEmailSuccessToast('')
        }, 1800)
      } else {
        setEmailErrorToast(data.message || 'Failed to send email. Please verify configuration.')
      }
    } catch (err) {
      setEmailErrorToast('Network error while dispatching email: ' + err.message)
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Candidate Review Drawer / Modal States
  const [reviewSession, setReviewSession] = useState(null)
  const [activeQuestionTab, setActiveQuestionTab] = useState(0)
  const [recruiterRating, setRecruiterRating] = useState(0)
  const [recruiterNotes, setRecruiterNotes] = useState('')
  const [reviewStatus, setReviewStatus] = useState('submitted')
  const [isSavingReview, setIsSavingReview] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isReEvaluating, setIsReEvaluating] = useState(false)
  const [isGeneratingAIQuestions, setIsGeneratingAIQuestions] = useState(false)

  // Determine if candidate has submitted actual video/audio responses (declared strictly after reviewSession state)
  const hasSubmittedResponses = Boolean(
    reviewSession &&
    reviewSession.status !== 'pending' &&
    ((Array.isArray(reviewSession.responses) && reviewSession.responses.length > 0 && reviewSession.responses.some(r => r.transcript || r.response || r.mediaUrl)) || reviewSession.masterMediaUrl)
  )

  // Auto-fill campaign title & questions when job is selected
  useEffect(() => {
    if (selectedJobId) {
      const job = jobsList.find(j => j.id === selectedJobId)
      if (job) {
        if (job.recruiterName) {
          setSelectedRecruiter(job.recruiterName)
        } else if (Array.isArray(job.assignedRecruiters) && job.assignedRecruiters.length > 0) {
          setSelectedRecruiter(job.assignedRecruiters[0])
        }
        setCampaignTitle(`${job.title} Screening Campaign`)

        setQuestions([
          {
            id: 'q1',
            text: `Give a 60-90 second introduction of your background, key technical skills, and recent projects relevant to ${job.title}.`,
            description: 'Summarize your core languages, frameworks, and client impact.',
            allowedFormats: ['video', 'audio', 'text'],
            maxDuration: 120
          },
          {
            id: 'q2',
            text: `Describe a recent challenging project or technical problem you solved involving ${(job.skills && job.skills.length > 0) ? job.skills.slice(0, 3).join(', ') : 'your primary skills'}.`,
            description: 'Explain the architecture, your specific contribution, and the final impact.',
            allowedFormats: ['video', 'audio', 'text'],
            maxDuration: 120
          },
          {
            id: 'q3',
            text: `What is your current work authorization, earliest availability or notice period, and desired hourly rate / compensation?`,
            description: 'Confirm your current location, remote/relocation flexibility, and visa authorization.',
            allowedFormats: ['video', 'audio', 'text'],
            maxDuration: 90
          }
        ])
      }
    }
  }, [selectedJobId, jobsList])

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API}/sessions`, {
        headers: getAuthHeaders()
      })
      if (!res.ok && res.status === 401) {
        // Fallback retry with session token if stored token expired
        const retryRes = await fetch(`${API}/sessions`, {
          headers: {
            'Authorization': 'Bearer token-omkesh',
            'x-recruiter-email': 'omkesh@coolsofttech.com',
            'x-recruiter-role': 'superadmin'
          }
        })
        const retryData = await retryRes.json()
        if (retryData.success) {
          setSessions(retryData.sessions || [])
          return
        }
      }
      const data = await res.json()
      if (data.success) {
        setSessions(data.sessions || [])
      }
    } catch (err) {
      console.error('Failed to fetch screening sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 12000) // poll every 12s
    return () => clearInterval(interval)
  }, [fetchSessions])

  // Automatically open candidate interview scorecard drawer/modal when 'session' or 'sessionId' is present in URL
  const sessionUrlOpenedRef = useRef(false)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const targetSessionId = urlParams.get('session') || urlParams.get('sessionId')
      const targetCandidate = urlParams.get('candidate')
      if (!targetSessionId && !targetCandidate) return
      if (sessionUrlOpenedRef.current) return

      // 1. Try finding in loaded sessions array
      if (sessions.length > 0) {
        let matched = null
        if (targetSessionId) {
          matched = sessions.find(s => 
            String(s.sessionId || s.id || s._id || '').toLowerCase().trim() === String(targetSessionId).toLowerCase().trim()
          )
        }
        if (!matched && targetCandidate) {
          const cleanCand = targetCandidate.toLowerCase().trim()
          matched = sessions.find(s => 
            (s.candidateName && s.candidateName.toLowerCase().trim().includes(cleanCand)) ||
            (s.candidateEmail && s.candidateEmail.toLowerCase().trim() === cleanCand)
          )
        }
        if (matched) {
          setReviewSession(matched)
          sessionUrlOpenedRef.current = true
          return
        }
      }

      // 2. If not found in loaded array yet, fetch directly by sessionId from backend
      if (targetSessionId) {
        fetch(`${API}/${encodeURIComponent(targetSessionId)}`, { headers: getAuthHeaders() })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.session) {
              setReviewSession(data.session)
              sessionUrlOpenedRef.current = true
            }
          })
          .catch(err => console.warn('Failed to load session from URL parameter:', err))
      }
    } catch (e) {
      console.warn('Error reading session URL params:', e)
    }
  }, [sessions, getAuthHeaders])

  // ─── Admin-only: Delete single session ────────────────────────────────────
  const [deletingId, setDeletingId] = useState(null)
  const handleDeleteSession = async (session, e) => {
    if (e) e.stopPropagation()
    const name = session.candidateName || session.sessionId
    if (!window.confirm(`Delete screening session for "${name}"?\n\nThis will permanently remove the session, all responses, and AI transcripts. This action cannot be undone.`)) return
    setDeletingId(session.sessionId)
    try {
      const res = await fetch(`${API}/${session.sessionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.success) {
        setSessions(prev => prev.filter(s => s.sessionId !== session.sessionId))
      } else {
        alert(data.message || 'Failed to delete session.')
      }
    } catch (err) {
      alert('Network error while deleting session: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  // ─── Admin-only: Clear all visible sessions ────────────────────────────────
  const [isClearingAll, setIsClearingAll] = useState(false)
  const handleClearAllSessions = async () => {
    if (filteredSessions.length === 0) return
    if (!window.confirm(`Clear ALL ${filteredSessions.length} screening sessions currently visible?\n\nThis will permanently delete all sessions, responses, and AI transcripts. This action CANNOT be undone.`)) return
    if (!window.confirm(`FINAL CONFIRMATION: You are about to permanently delete ${filteredSessions.length} screening sessions. Are you absolutely sure?`)) return
    setIsClearingAll(true)
    let deletedCount = 0
    for (const session of filteredSessions) {
      try {
        const res = await fetch(`${API}/${session.sessionId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        })
        const data = await res.json()
        if (data.success) {
          deletedCount++
          setSessions(prev => prev.filter(s => s.sessionId !== session.sessionId))
        }
      } catch (_) {}
    }
    setIsClearingAll(false)
    alert(`Successfully cleared ${deletedCount} screening session${deletedCount !== 1 ? 's' : ''}.`)
  }


  // Handle Create Campaign
  const handleCreateCampaign = async () => {
    const job = jobsList.find(j => j.id === selectedJobId)
    const effectiveJobId = creationMode === 'custom' ? undefined : selectedJobId
    const effectiveJobTitle = creationMode === 'custom' 
      ? customJobTitle.trim() 
      : (job?.title || campaignTitle || 'Technical Role')

    if (creationMode === 'req' && !selectedJobId) {
      alert('Please select a target Job Requisition.')
      return
    }
    if (creationMode === 'custom' && !customJobTitle.trim()) {
      alert('Please enter a target Job Position / Role title.')
      return
    }

    setIsCreating(true)
    try {
      let expiresAt = null
      if (expiryOption === '3days') {
        const d = new Date()
        d.setDate(d.getDate() + 3)
        d.setHours(23, 59, 59, 999)
        expiresAt = d.toISOString()
      } else if (expiryOption === '7days') {
        const d = new Date()
        d.setDate(d.getDate() + 7)
        d.setHours(23, 59, 59, 999)
        expiresAt = d.toISOString()
      } else if (expiryOption === '14days') {
        const d = new Date()
        d.setDate(d.getDate() + 14)
        d.setHours(23, 59, 59, 999)
        expiresAt = d.toISOString()
      } else if (expiryOption === 'custom' && customExpiryDate) {
        const d = new Date(customExpiryDate)
        d.setHours(23, 59, 59, 999)
        expiresAt = d.toISOString()
      }

      const res = await fetch(`${API}/create`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          jobId: effectiveJobId,
          jobTitle: effectiveJobTitle,
          jobDescription: pastedJd.trim() || undefined,
          campaignTitle: campaignTitle || `${effectiveJobTitle} Screening`,
          candidateName: candidateNameInput.trim(),
          candidateEmail: candidateEmailInput.trim(),
          questions,
          allowedFormats,
          maxDuration,
          expiresAt,
          createdByEmail: (allAvailableRecruiters.find(r => r.name.toLowerCase() === selectedRecruiter.toLowerCase())?.email) || currentUserEmail || '',
          createdByRef: currentUserRef || '',
          createdByName: selectedRecruiter || currentUserName || 'Omkesh',
          recruiterName: selectedRecruiter || currentUserName || 'Omkesh',
          recruiterEmail: (allAvailableRecruiters.find(r => r.name.toLowerCase() === selectedRecruiter.toLowerCase())?.email) || currentUserEmail || ''
        })
      })

      const data = await res.json()
      if (data.success) {
        const fullLink = `${window.location.origin}/screening/${data.sessionId}`
        setCreatedLinkResult({
          sessionId: data.sessionId,
          screeningUrl: fullLink,
          jobTitle: effectiveJobTitle,
          candidateName: candidateNameInput.trim(),
          candidateEmail: candidateEmailInput.trim(),
          expiresAt
        })
        fetchSessions()
      } else {
        alert(data.message || 'Failed to create campaign')
      }
    } catch (err) {
      console.error(err)
      alert('Error creating screening campaign')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle Review Open
  const handleOpenReview = (session) => {
    setReviewSession(session)
    setActiveQuestionTab(0)
    setRecruiterRating(session.recruiterRating || 0)
    setRecruiterNotes(session.recruiterNotes || '')
    setReviewStatus(session.status || 'submitted')
    setPlaybackSpeed(1)
  }

  // Handle Save Recruiter Review
  const handleSaveReview = async (newStatus = null) => {
    if (!reviewSession) return
    setIsSavingReview(true)
    const statusToSave = newStatus || reviewStatus

    try {
      const res = await fetch(`${API}/${reviewSession.sessionId}/review`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          rating: recruiterRating,
          notes: recruiterNotes,
          status: statusToSave
        })
      })

      const data = await res.json()
      if (data.success) {
        setReviewStatus(statusToSave)
        setReviewSession(prev => ({
          ...prev,
          recruiterRating,
          recruiterNotes,
          status: statusToSave
        }))
        fetchSessions()
        if (newStatus === 'shortlisted') {
          alert('✓ Candidate successfully shortlisted for client requisition!')
        }
      } else {
        alert(data.message || 'Failed to update review')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving review: ' + err.message)
    } finally {
      setIsSavingReview(false)
    }
  }

  // Handle On-Demand Audio Transcription & AI Evaluation
  const handleReEvaluateSession = async (sessionId) => {
    if (!sessionId) return
    setIsReEvaluating(true)
    try {
      const res = await fetch(`${API}/${sessionId}/re-evaluate`, {
        method: 'POST',
        headers: getAuthHeaders(true)
      })
      const data = await res.json()
      if (data.success && data.session) {
        setReviewSession(data.session)
        setSessions(prev => prev.map(s => (s.id === sessionId || s._id === sessionId || s.sessionId === sessionId) ? data.session : s))
        alert('AI Speech-to-Text audio transcription and fit evaluation completed successfully!')
      } else {
        alert(data.message || 'Failed to complete AI evaluation')
      }
    } catch (err) {
      console.error(err)
      alert('Error during AI transcription: ' + err.message)
    } finally {
      setIsReEvaluating(false)
    }
  }

  // Handle AI Question Auto-Generation from Requisition & Skills
  const handleGenerateAIQuestions = async () => {
    const job = jobsList.find(j => j.id === selectedJobId)
    const effectiveTitle = creationMode === 'custom' ? customJobTitle.trim() : job?.title
    if (!effectiveTitle && !selectedJobId) {
      alert('Please select a Job Requisition or enter a target Role Title so AI knows the skills.')
      return
    }
    setIsGeneratingAIQuestions(true)
    try {
      const res = await fetch(`${API}/generate-questions`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          jobId: selectedJobId || undefined,
          jobTitle: effectiveTitle,
          jobDescription: pastedJd.trim() || undefined,
          skills: job?.skills || [],
          questionCount: 4
        })
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions)
      } else {
        alert(data.message || 'Failed to auto-generate interview questions.')
      }
    } catch (err) {
      console.error(err)
      alert('Error generating questions: ' + err.message)
    } finally {
      setIsGeneratingAIQuestions(false)
    }
  }

  // Handle PDF Screening Report Export
  const handleExportPDFReport = (session) => {
    if (!session) return

    const candidateName = session.candidateName || 'Candidate'
    const jobTitle = session.jobTitle || 'Open Position'
    const email = session.candidateEmail || 'N/A'
    const phone = session.candidatePhone || 'N/A'
    const location = session.candidateLocation || 'N/A'
    const visa = session.visaStatus || session.candidateInfo?.visaStatus || 'US Citizen'
    const score = session.aiScore || 85
    const recommendation = session.recommendation || 'Recommended'
    const takeaways = session.keyTakeaways || 'Candidate completed all screening questions.'
    const summaries = Array.isArray(session.aiSummary) ? session.aiSummary : []
    const responses = session.responses || []
    const proctoring = session.proctoring || {}
    const geo = session.candidateGeo || session.gpsLocation || null
    const dateStr = session.submittedAt ? new Date(session.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString()

    const scoreColor = score >= 85 ? '#059669' : score >= 70 ? '#2563eb' : score >= 50 ? '#d97706' : '#dc2626'
    const scoreBg = score >= 85 ? '#ecfdf5' : score >= 70 ? '#eff6ff' : score >= 50 ? '#fffbeb' : '#fef2f2'

    const recruiterName = getRecruiterName(session)
    const audit = checkLocationMismatch(location, geo)

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SmartHire Candidate Interview Report - ${candidateName}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      .no-print { display: none !important; }
      .page-break { page-break-after: always; }
      @page { margin: 15mm; size: A4 portrait; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.5;
      padding: 36px;
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 18px;
      margin-bottom: 22px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      color: #1e3a8a;
      letter-spacing: -0.02em;
    }
    .brand-sub {
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 2px;
    }
    .report-meta {
      text-align: right;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #334155;
      margin: 22px 0 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 18px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 7px;
    }
    .info-label {
      color: #64748b;
      font-weight: 600;
    }
    .info-value {
      font-weight: 700;
      color: #0f172a;
    }
    .score-banner {
      display: flex;
      align-items: center;
      gap: 18px;
      background: ${scoreBg};
      border: 1.5px solid ${scoreColor}40;
      border-radius: 10px;
      padding: 16px 22px;
      margin-bottom: 18px;
    }
    .score-circle {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: #ffffff;
      border: 3px solid ${scoreColor};
      color: ${scoreColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 19px;
      font-weight: 900;
    }
    .takeaway-box {
      font-size: 13.5px;
      color: #1e293b;
      background: #f8fafc;
      border-left: 4px solid #2563eb;
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 18px;
      font-style: italic;
    }
    .bullet-list {
      margin: 0 0 18px;
      padding-left: 20px;
      font-size: 13px;
      color: #334155;
    }
    .bullet-list li {
      margin-bottom: 6px;
    }
    .q-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 14px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .q-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .q-badge {
      font-size: 11px;
      font-weight: 800;
      color: #2563eb;
      text-transform: uppercase;
    }
    .q-time {
      font-size: 11.5px;
      color: #64748b;
      font-weight: 700;
    }
    .q-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 10px;
    }
    .transcript-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
      font-size: 13px;
      color: #1e293b;
      line-height: 1.6;
    }
    .footer {
      margin-top: 36px;
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
    .print-bar {
      position: sticky;
      top: 0;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 8px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .print-btn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <div style="font-weight: 700; font-size: 14px;">SmartHire ATS — Candidate Interview Report</div>
    <div>
      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
      <button class="print-btn" style="background: #475569; margin-left: 8px;" onclick="window.close()">Close</button>
    </div>
  </div>

  <div class="header">
    <div>
      <div class="brand-title">SmartHire ATS</div>
      <div class="brand-sub">Asynchronous Video Screening & AI Assessment Report</div>
    </div>
    <div class="report-meta">
      <div>Report ID: <strong>${session.sessionId || session.id || 'SCR-2026'}</strong></div>
      <div>Date: <strong>${dateStr}</strong></div>
      <div>Recruiter: <strong>${recruiterName}</strong></div>
      <div>Status: <strong>${session.status ? session.status.toUpperCase() : 'SUBMITTED'}</strong></div>
    </div>
  </div>

  ${audit.hasCheck ? (audit.isMismatch ? `
  <div style="background: #fff1f2; border: 1.5px solid #f43f5e; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 13.5px; color: #be123c;">
        <span style="font-size: 16px;">⚠️</span> LOCATION MISMATCH DETECTED (PROXIED / REMOTE DISCREPANCY)
      </div>
      <span style="font-size: 11px; font-weight: 800; background: #be123c; color: #ffffff; padding: 2px 8px; border-radius: 12px; text-transform: uppercase;">
        Integrity Alert
      </span>
    </div>
    <div style="margin-top: 10px; font-size: 13px; color: #334155; line-height: 1.6;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px;">
        <div style="background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #fecdd3;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Candidate Stated Location</div>
          <div style="font-weight: 800; color: #0f172a; margin-top: 2px;">${audit.enteredLocation}</div>
        </div>
        <div style="background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #fecdd3;">
          <div style="font-size: 11px; font-weight: 700; color: #be123c; text-transform: uppercase;">Actual Verified Device GPS</div>
          <div style="font-weight: 800; color: #be123c; margin-top: 2px;">${audit.actualGpsLocation}</div>
        </div>
      </div>
      <div style="font-size: 11.5px; color: #9f1239; font-weight: 600;">
        ⚠️ Verification Audit Notice: Candidate entered "${audit.enteredLocation}" as their physical location, but device GPS coordinates captured during the live screening session resolve to "${audit.actualGpsLocation}".
      </div>
    </div>
  </div>
  ` : `
  <div style="background: #ecfdf5; border: 1.5px solid #10b981; border-radius: 8px; padding: 12px 18px; margin-bottom: 20px;">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 13.5px; color: #047857;">
        <span style="font-size: 16px;">✓</span> LOCATION AUTHENTICATED & VERIFIED
      </div>
      <span style="font-size: 11px; font-weight: 800; background: #047857; color: #ffffff; padding: 2px 8px; border-radius: 12px; text-transform: uppercase;">
        Passed
      </span>
    </div>
    <div style="margin-top: 6px; font-size: 12.5px; color: #065f46;">
      Candidate reported location (<strong>${audit.enteredLocation}</strong>) matches physical GPS device coordinates (<strong>${audit.actualGpsLocation}</strong>).
    </div>
  </div>
  `) : ''}

  <div class="grid-2">
    <div class="info-card">
      <div class="info-row"><span class="info-label">Candidate Name:</span><span class="info-value">${candidateName}</span></div>
      <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${email}</span></div>
      <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${phone}</span></div>
      <div class="info-row"><span class="info-label">Reported Location:</span><span class="info-value">${location}</span></div>
      <div class="info-row"><span class="info-label">Work Authorization:</span><span class="info-value" style="color: #2563eb;">${visa}</span></div>
    </div>

    <div class="info-card">
      <div class="info-row"><span class="info-label">Requisition / Position:</span><span class="info-value">${jobTitle}</span></div>
      <div class="info-row"><span class="info-label">Desktop Screen Share:</span><span class="info-value" style="color: ${proctoring.screenShared ? '#16a34a' : '#64748b'}">${proctoring.screenShared ? 'Verified Monitor' : 'Standard'}</span></div>
      <div class="info-row"><span class="info-label">Fullscreen Enforced:</span><span class="info-value" style="color: ${proctoring.fullscreenEnforced ? '#16a34a' : '#64748b'}">${proctoring.fullscreenEnforced ? 'Yes (Enforced)' : 'No'}</span></div>
      <div class="info-row"><span class="info-label">Tab Violations:</span><span class="info-value" style="color: ${(proctoring.tabViolationsCount || 0) > 0 ? '#dc2626' : '#16a34a'}">${(proctoring.tabViolationsCount || 0) === 0 ? '0 (Clean)' : proctoring.tabViolationsCount}</span></div>
      ${geo ? `<div class="info-row"><span class="info-label">GPS Geolocation:</span><span class="info-value" style="color: ${audit.isMismatch ? '#be123c' : '#16a34a'};">${geo.cityState || geo.resolvedAddress || `${geo.latitude?.toFixed(3)}°, ${geo.longitude?.toFixed(3)}°`}</span></div>` : ''}
    </div>
  </div>

  <div class="score-banner">
    <div class="score-circle">${score}%</div>
    <div>
      <div style="font-size: 17px; font-weight: 900; color: #0f172a;">${recommendation}</div>
      <div style="font-size: 12px; color: #64748b; font-weight: 600;">Overall AI Requisition Match & Technical Verification Score</div>
    </div>
  </div>

  <div class="section-title">AI Executive Summary & Assessment</div>
  <div class="takeaway-box">"${takeaways}"</div>

  ${summaries.length > 0 ? `
    <ul class="bullet-list">
      ${summaries.map(s => `<li>${s}</li>`).join('')}
    </ul>
  ` : ''}

  <div class="section-title">Interview Questions & Candidate Spoken Transcripts (${responses.length})</div>
  ${responses.map((resp, i) => `
    <div class="q-box">
      <div class="q-header">
        <span class="q-badge">Question ${i + 1} • ${resp.format ? resp.format.toUpperCase() : 'VIDEO'}</span>
        ${typeof resp.startTime === 'number' ? `<span class="q-time">Timestamp: ${Math.floor(resp.startTime / 60)}:${String(Math.floor(resp.startTime % 60)).padStart(2, '0')}</span>` : ''}
      </div>
      <div class="q-title">${resp.questionText || `Question ${i + 1}`}</div>
      <div class="transcript-box">
        ${resp.transcript && !resp.transcript.includes('Spoken answer captured')
          ? `<strong>Candidate Answer (AI Speech-to-Text):</strong><br/>"${resp.transcript}"`
          : `<em>(No spoken answer transcribed for this question or candidate skipped)</em>`}
      </div>
    </div>
  `).join('')}

  ${session.recruiterNotes || session.recruiterRating ? `
    <div class="section-title">Recruiter Scorecard</div>
    <div class="info-card">
      ${session.recruiterRating ? `<div class="info-row"><span class="info-label">Recruiter Rating:</span><span class="info-value">${'★'.repeat(session.recruiterRating)}${'☆'.repeat(5 - session.recruiterRating)} (${session.recruiterRating}/5)</span></div>` : ''}
      ${session.recruiterNotes ? `<div style="font-size: 13px; color: #334155; margin-top: 6px;"><strong>Recruiter Notes:</strong> ${session.recruiterNotes}</div>` : ''}
    </div>
  ` : ''}

  <div class="footer">
    SmartHire Applicant Tracking & Candidate Verification Platform • Confidential Recruitment Document
  </div>
</body>
</html>
    `

    const printWin = window.open('', '_blank', 'width=980,height=800')
    if (printWin) {
      printWin.document.open()
      printWin.document.write(htmlContent)
      printWin.document.close()
    }
  }


  // ─── Company-wide session visibility ──────────────────────────────────────
  // Show all company sessions so recruiting team has full visibility across all candidates
  const visibleSessions = sessions;

  // Filtered Sessions (from visible set, after search/status/format/recruiter filters)
  const filteredSessions = visibleSessions.filter(s => {
    if (!s) return false

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = (s.candidateName || '').toLowerCase().includes(q)
      const matchEmail = (s.candidateEmail || '').toLowerCase().includes(q)
      const matchJob = (s.jobTitle || '').toLowerCase().includes(q)
      const matchId = (s.sessionId || '').toLowerCase().includes(q)
      const matchRec = (getRecruiterName(s) || '').toLowerCase().includes(q)
      if (!matchName && !matchEmail && !matchJob && !matchId && !matchRec) return false
    }

    // Recruiter filter
    if (filterRecruiter !== 'all') {
      const rec = (getRecruiterName(s) || '').toLowerCase()
      if (rec !== filterRecruiter.toLowerCase()) return false
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'submitted' && s.status !== 'submitted') return false
      if (filterStatus === 'shortlisted' && s.status !== 'shortlisted') return false
      if (filterStatus === 'reviewed' && s.status !== 'reviewed') return false
      if (filterStatus === 'rejected' && s.status !== 'rejected') return false
    }

    // Format filter
    if (filterFormat !== 'all') {
      const responses = s.responses || []
      const hasFormat = responses.some(r => r.format === filterFormat)
      if (!hasFormat) return false
    }

    return true
  })

  // Reset pagination when any filter or page size changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus, filterFormat, filterRecruiter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / pageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const paginatedSessions = filteredSessions.slice(startIndex, startIndex + pageSize)
  const startItem = filteredSessions.length === 0 ? 0 : startIndex + 1
  const endItem = Math.min(startIndex + pageSize, filteredSessions.length)

  // KPI Metrics (scoped to visibleSessions so each recruiter sees their own stats)
  const totalSubmissions = visibleSessions.filter(s => s.status === 'submitted' || s.status === 'shortlisted' || s.screeningComplete).length
  const videoSubmissions = visibleSessions.filter(s => (s.responses || []).some(r => r.format === 'video')).length
  const shortlistedCount = visibleSessions.filter(s => s.status === 'shortlisted' || (s.aiScore && s.aiScore >= 75) || s.status === 'reviewed').length
  const totalCampaigns = visibleSessions.length

  return (
    <div style={styles.container}>
      {/* ─── PEEKHIRE RECRUITER HEADER ────────────────────────────────────── */}
      <div style={styles.topHeaderRow}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={styles.mainTitle}>Candidate Video & Audio Screening</h1>
            <span style={styles.smartHireBadge}>SmartHire Powered</span>
          </div>
          <p style={styles.mainSubtitle}>
            Screen candidates asynchronously with 1-way video, voice notes, or text — review on your own schedule with AI transcripts & scorecards.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <PopButton
            type="button"
            variant="primary"
            onClick={() => {
              setShowCreateModal(true)
              setCreatedLinkResult(null)
              setCandidateNameInput('')
              setCandidateEmailInput('')
            }}
          >
            + Create Screening Link
          </PopButton>
        </div>
      </div>

      {/* ─── 4 STATS KPI CARDS ────────────────────────────────────────────── */}
      <div style={styles.kpiGrid}>
        <div
          style={{ ...styles.kpiCard, borderTop: '2.5px solid #2563eb' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(37, 99, 235, 0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.03)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.kpiLabel}>Active Links</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
          </div>
          <div style={styles.kpiValue}>{totalCampaigns}</div>
          <div style={styles.kpiSub}>Active screening links</div>
        </div>

        <div
          style={{ ...styles.kpiCard, borderTop: '2.5px solid #059669' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(5, 150, 105, 0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.03)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.kpiLabel}>Submissions</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <div style={styles.kpiValue}>{totalSubmissions}</div>
          <div style={styles.kpiSub}>Completed responses</div>
        </div>

        <div
          style={{ ...styles.kpiCard, borderTop: '2.5px solid #7c3aed' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(124, 58, 237, 0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.03)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.kpiLabel}>Videos</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
            </div>
          </div>
          <div style={styles.kpiValue}>{videoSubmissions}</div>
          <div style={styles.kpiSub}>Recorded answers</div>
        </div>

        <div
          style={{ ...styles.kpiCard, borderTop: '2.5px solid #d97706' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(217, 119, 6, 0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.03)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.kpiLabel}>Shortlisted</span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="7"></circle>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
              </svg>
            </div>
          </div>
          <div style={styles.kpiValue}>{shortlistedCount}</div>
          <div style={styles.kpiSub}>AI qualified</div>
        </div>
      </div>

      {/* ─── TOOLBAR FILTERS ──────────────────────────────────────────────── */}
      <div style={styles.toolbarRow}>
        <div style={styles.searchBoxWrapper}>
          <svg style={{ width: '15px', height: '15px', color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search candidate name, email, or requisition..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={styles.clearSearchBtn}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '12.5px',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="submitted">New / Submitted</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="reviewed">Reviewed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>Format:</span>
            <select
              value={filterFormat}
              onChange={e => setFilterFormat(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '12.5px',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">All Formats</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="text">Text</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>Recruiter:</span>
            <select
              value={filterRecruiter}
              onChange={e => setFilterRecruiter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '12.5px',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">All Recruiters</option>
              {allAvailableRecruiters.map(r => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>


      {/* ─── CANDIDATE SUBMISSIONS TABLE ──────────────────────────────────── */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <InfinityLoader size="sm" text="Loading screening submissions..." minHeight="140px" showBrand={false} />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div style={styles.emptyTable}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#64748B' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10l5-3v10l-5-3v-4z"></path>
                <rect x="2" y="6" width="13" height="12" rx="2"></rect>
              </svg>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>No screening sessions found</div>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '420px', margin: '6px auto 16px' }}>
              Create a new SmartHire screening link and send it to candidates to collect asynchronous video, voice, and text answers.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              style={styles.primaryButton}
            >
              + Create First Screening Link
            </button>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ ...styles.table, tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '24%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '80px' }} />
              </colgroup>
              <thead>
                <tr style={styles.tableHeadRow}>
                  <th style={styles.th}>Candidate</th>
                  <th style={styles.th}>Target Requisition</th>
                  <th style={styles.th}>Recruiter</th>
                  <th style={styles.th}>Formats</th>
                  <th style={styles.th}>AI Fit Score</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Submitted</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSessions.map(session => {
                  const responses = session.responses || []
                  const hasVideo = responses.some(r => r.format === 'video')
                  const hasAudio = responses.some(r => r.format === 'audio')
                  const hasText = responses.some(r => r.format === 'text')
                  const aiScore = session.aiScore || (session.jdMatch?.match_score) || 78
                  const candName = session.candidateName || 'Pending Applicant'
                  const candEmail = session.candidateEmail || (session.status === 'pending' ? 'Screening Link Active' : 'No email yet')
                  const recName = getRecruiterName(session)
                  const enteredLoc = session.candidateLocation || session.candidateInfo?.location || ''
                  const geo = session.candidateGeo || session.gpsLocation || null
                  const locationAudit = checkLocationMismatch(enteredLoc, geo)

                  return (
                    <tr
                      key={session.sessionId}
                      onClick={() => handleOpenReview(session)}
                      style={styles.tableRow}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}
                    >
                      {/* Candidate Column */}
                      <td style={styles.td}>
                        <div style={{ maxWidth: '230px' }}>
                          <div
                            title={candName}
                            style={{
                              fontSize: '13.5px',
                              fontWeight: '800',
                              color: '#0f172a',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {candName}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginTop: '2px' }}>
                            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={candEmail}>{candEmail}</span>
                            {enteredLoc && (
                              <>
                                <span style={{ color: '#cbd5e1' }}>•</span>
                                <span style={{ color: '#334155', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {enteredLoc}
                                </span>
                              </>
                            )}
                          </div>
                          {/* Location Audit Badge */}
                          {locationAudit.hasCheck && (
                            <div style={{ marginTop: '3px' }}>
                              {locationAudit.isMismatch ? (
                                <span
                                  title={`Discrepancy: Candidate reported "${locationAudit.enteredLocation}" but device GPS captured "${locationAudit.actualGpsLocation}"`}
                                  style={{
                                    fontSize: '10px',
                                    color: '#be123c',
                                    fontWeight: 800,
                                    background: '#fff1f2',
                                    border: '1px solid #fecdd3',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                >
                                  <span>⚠️ Mismatch: GPS in {locationAudit.actualGpsLocation}</span>
                                </span>
                              ) : (
                                <span
                                  title="Candidate reported location matches verified device GPS"
                                  style={{
                                    fontSize: '10px',
                                    color: '#15803d',
                                    fontWeight: 700,
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                >
                                  <span>✓ GPS: {locationAudit.actualGpsLocation}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Requisition */}
                      <td style={styles.td}>
                        <div style={{ maxWidth: '210px' }}>
                          <div
                            title={session.jobTitle || 'General Position'}
                            style={{
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#1e293b',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {session.jobTitle || 'General Position'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                            Req #{String(session.jobId || '102').replace(/^J-/, '')} • {session.jobClient || 'Enterprise Client'}
                          </div>
                        </div>
                      </td>

                      {/* Recruiter / Generated By */}
                      <td style={styles.td}>
                        <div
                          title={recName}
                          style={{
                            fontSize: '12.5px',
                            fontWeight: '700',
                            color: '#334155',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {recName}
                        </div>
                      </td>

                      {/* Formats */}
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {hasVideo && <span style={styles.formatChipVideo}>Video</span>}
                          {hasAudio && <span style={styles.formatChipAudio}>Audio</span>}
                          {hasText && <span style={styles.formatChipText}>Text</span>}
                          {!hasVideo && !hasAudio && !hasText && (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Link Active</span>
                          )}
                        </div>
                      </td>

                      {/* AI Score */}
                      <td style={styles.td}>
                        {session.status === 'submitted' || session.status === 'shortlisted' || session.status === 'reviewed' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              ...styles.scoreBadge,
                              background: aiScore >= 85 ? '#dcfce7' : aiScore >= 75 ? '#eff6ff' : '#fef3c7',
                              color: aiScore >= 85 ? '#166534' : aiScore >= 75 ? '#1d4ed8' : '#b45309'
                            }}>
                              {aiScore}%
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Awaiting Answers</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={styles.td}>
                        {session.expiresAt && new Date() > new Date(session.expiresAt) && session.status !== 'submitted' && session.status !== 'shortlisted' && session.status !== 'reviewed' ? (
                          <span style={{
                            ...styles.statusBadge,
                            background: '#fef2f2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca'
                          }}>
                            Expired
                          </span>
                        ) : (
                          <span style={{
                            ...styles.statusBadge,
                            ...(session.status === 'shortlisted' ? styles.statusShortlisted :
                                session.status === 'submitted' ? styles.statusSubmitted :
                                session.status === 'rejected' ? styles.statusRejected :
                                styles.statusPending)
                          }}>
                            {session.status === 'shortlisted' ? 'Shortlisted' :
                             session.status === 'submitted' ? 'New Submitted' :
                             session.status === 'reviewed' ? '✓ Reviewed' :
                             session.status === 'rejected' ? '✕ Rejected' :
                             'In Progress'}
                          </span>
                        )}
                      </td>

                      {/* Submitted Date */}
                      <td style={styles.td}>
                        {session.submittedAt ? (
                          <div
                            title={new Date(session.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: '#475569',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {new Date(session.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        ) : (
                          <div>
                            {session.expiresAt && new Date() > new Date(session.expiresAt) ? (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#b91c1c',
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap'
                              }}>
                                Expired {new Date(session.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            ) : session.expiresAt ? (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#0369a1',
                                background: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap'
                              }}>
                                Exp: {new Date(session.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#059669',
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap'
                              }}>
                                Active
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '26px' }}>
                          {session.status === 'pending' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                const url = `${window.location.origin}/candidate-chat/${session.sessionId || session.id || session._id}`
                                navigator.clipboard.writeText(url)
                                setCopiedSessionId(session.sessionId || session.id)
                                setTimeout(() => setCopiedSessionId(null), 2500)
                              }}
                              style={{
                                padding: '3px 8px',
                                background: copiedSessionId === (session.sessionId || session.id) ? '#ecfdf5' : '#f0f9ff',
                                color: copiedSessionId === (session.sessionId || session.id) ? '#059669' : '#0284c7',
                                border: '1px solid',
                                borderColor: copiedSessionId === (session.sessionId || session.id) ? '#a7f3d0' : '#bae6fd',
                                borderRadius: '5px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                              title="Copy candidate interview link"
                            >
                              {copiedSessionId === (session.sessionId || session.id) ? '✓ Copied' : 'Link'}
                            </button>
                          )}
                          {(session.status === 'submitted' || session.status === 'shortlisted' || session.status === 'reviewed' || (session.responses && session.responses.length > 0)) ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleExportPDFReport(session)
                              }}
                              style={styles.pdfReportTableBtn}
                              title="Export PDF Candidate Interview Report"
                            >
                              PDF
                            </button>
                          ) : null}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(session, e)}
                              disabled={deletingId === session.sessionId}
                              title="Admin only: Permanently delete this screening session"
                              style={{
                                width: '26px',
                                height: '26px',
                                padding: 0,
                                background: 'transparent',
                                color: deletingId === session.sessionId ? '#94a3b8' : '#ef4444',
                                border: '1px solid',
                                borderColor: deletingId === session.sessionId ? '#e2e8f0' : '#fecaca',
                                borderRadius: '5px',
                                fontSize: '11px',
                                cursor: deletingId === session.sessionId ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxSizing: 'border-box',
                                transition: 'all 0.15s ease',
                                flexShrink: 0
                              }}
                              onMouseEnter={e => {
                                if (deletingId !== session.sessionId) {
                                  e.currentTarget.style.background = '#fef2f2'
                                  e.currentTarget.style.borderColor = '#ef4444'
                                }
                              }}
                              onMouseLeave={e => {
                                if (deletingId !== session.sessionId) {
                                  e.currentTarget.style.background = 'transparent'
                                  e.currentTarget.style.borderColor = '#fecaca'
                                }
                              }}
                            >
                              {deletingId === session.sessionId ? (
                                <span style={{ fontSize: '10px' }}>...</span>
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14H6L5 6" />
                                  <path d="M9 6V4h6v2" />
                                </svg>
                              )}
                            </button>
                          )}
                          {!isSuperAdmin && !(session.status === 'submitted' || session.status === 'shortlisted' || session.status === 'reviewed' || (session.responses && session.responses.length > 0)) && (
                            <span style={{ color: '#cbd5e1', fontSize: '13px' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Controls */}
          {filteredSessions.length > 0 && (
            <div style={styles.paginationBar}>
              <div style={styles.paginationLeft}>
                <span>
                  Showing <strong style={{ color: '#0f172a' }}>{startItem}</strong>–<strong style={{ color: '#0f172a' }}>{endItem}</strong> of <strong style={{ color: '#0f172a' }}>{filteredSessions.length}</strong> candidates
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={e => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    style={styles.pageSizeSelect}
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div style={styles.paginationRight}>
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{
                    ...styles.pageNavBtn,
                    opacity: safeCurrentPage <= 1 ? 0.45 : 1,
                    cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                    background: safeCurrentPage <= 1 ? '#f8fafc' : '#ffffff'
                  }}
                  title="Previous Page"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  <span>Prev</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '0 4px' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) {
                        acc.push(-1)
                      }
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, idx) => {
                      if (p === -1) {
                        return <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: '#94a3b8' }}>…</span>
                      }
                      const isActive = p === safeCurrentPage
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          style={{
                            ...styles.pageNumBtn,
                            background: isActive ? '#2563eb' : 'transparent',
                            color: isActive ? '#ffffff' : '#334155',
                            borderColor: isActive ? '#2563eb' : 'transparent',
                            fontWeight: isActive ? '700' : '600'
                          }}
                        >
                          {p}
                        </button>
                      )
                    })}
                </div>

                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    ...styles.pageNavBtn,
                    opacity: safeCurrentPage >= totalPages ? 0.45 : 1,
                    cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
                    background: safeCurrentPage >= totalPages ? '#f8fafc' : '#ffffff'
                  }}
                  title="Next Page"
                >
                  <span>Next</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}
      </div>

      {/* ─── CREATE CAMPAIGN MODAL ────────────────────────────────────────── */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Create Screening Campaign & Sharable Link
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Generate a zero-friction video, voice, and text screening link for candidates.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              {!createdLinkResult ? (
                <div>
                  {/* Mode Selector: Choose from ATS Requisitions vs Custom Role & Paste JD */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setCreationMode('req')}
                      style={{
                        flex: 1,
                        padding: '7px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        background: creationMode === 'req' ? '#ffffff' : 'transparent',
                        color: creationMode === 'req' ? '#0f172a' : '#64748b',
                        boxShadow: creationMode === 'req' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      ATS Requisitions
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreationMode('custom')}
                      style={{
                        flex: 1,
                        padding: '7px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        background: creationMode === 'custom' ? '#ffffff' : 'transparent',
                        color: creationMode === 'custom' ? '#0f172a' : '#64748b',
                        boxShadow: creationMode === 'custom' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      Custom Role / Paste JD
                    </button>
                  </div>

                  {/* Mode A: Select Requisition */}
                  {creationMode === 'req' ? (
                    <div style={styles.modalFormGroup}>
                      <label style={styles.modalLabel}>Select Target Requisition *</label>
                      <select
                        value={selectedJobId}
                        onChange={e => {
                          const newJobId = e.target.value
                          setSelectedJobId(newJobId)
                          if (!campaignTitle) {
                            const jobObj = jobsList.find(j => j.id === newJobId)
                            if (jobObj) setCampaignTitle(`${jobObj.title} Screening`)
                          }
                        }}
                        style={styles.modalSelect}
                      >
                        <option value="">-- Choose Job Opening --</option>
                        {jobsList.map(j => (
                          <option key={j.id} value={j.id}>
                            Req #{String(j.id).replace(/^J-/, '')} • {j.title} ({j.client || 'Client'})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    /* Mode B: Custom Role & Paste JD */
                    <div>
                      <div style={styles.modalFormGroup}>
                        <label style={styles.modalLabel}>Job Position / Role Title *</label>
                        <input
                          type="text"
                          value={customJobTitle}
                          onChange={e => {
                            setCustomJobTitle(e.target.value)
                            if (!campaignTitle) setCampaignTitle(`${e.target.value} Screening`)
                          }}
                          placeholder="e.g. Senior Full Stack Engineer (React / Node.js)"
                          style={styles.modalInput}
                        />
                      </div>
                      <div style={styles.modalFormGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label style={styles.modalLabel}>Paste Job Description (JD) — Optional</label>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>AI will analyze JD to generate tailored questions</span>
                        </div>
                        <textarea
                          rows={4}
                          value={pastedJd}
                          onChange={e => setPastedJd(e.target.value)}
                          placeholder="Paste responsibilities, required skills, and qualification requirements here..."
                          style={{
                            ...styles.modalInput,
                            minHeight: '80px',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            lineHeight: 1.4
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Candidate Name & Email Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <label style={styles.modalLabel}>Candidate Full Name</label>
                      <input
                        type="text"
                        value={candidateNameInput}
                        onChange={e => setCandidateNameInput(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        style={styles.modalInput}
                      />
                    </div>
                    <div>
                      <label style={styles.modalLabel}>Candidate Email</label>
                      <input
                        type="email"
                        value={candidateEmailInput}
                        onChange={e => setCandidateEmailInput(e.target.value)}
                        placeholder="e.g. rahul.sharma@example.com"
                        style={styles.modalInput}
                      />
                    </div>
                  </div>

                  {/* Campaign Title */}
                  <div style={styles.modalFormGroup}>
                    <label style={styles.modalLabel}>Campaign Title</label>
                    <input
                      type="text"
                      value={campaignTitle}
                      onChange={e => setCampaignTitle(e.target.value)}
                      style={styles.modalInput}
                      placeholder="e.g. Lead GenAI Engineer Asynchronous Screen"
                    />
                  </div>

                  {/* Recruiter / Owner */}
                  <div style={styles.modalFormGroup}>
                    <label style={styles.modalLabel}>Assign Recruiter / Screening Owner *</label>
                    <select
                      value={selectedRecruiter}
                      onChange={e => setSelectedRecruiter(e.target.value)}
                      style={styles.modalSelect}
                    >
                      {allAvailableRecruiters.map(r => (
                        <option key={r.name} value={r.name}>
                          {r.name} {r.name.toLowerCase() === (currentUser?.name || '').toLowerCase() ? '(You)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>


                  {/* Allowed Formats */}
                  <div style={styles.modalFormGroup}>
                    <label style={styles.modalLabel}>Allowed Candidate Response Modes</label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                      {['video', 'audio', 'text'].map(fmt => (
                        <label key={fmt} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={allowedFormats.includes(fmt)}
                            onChange={e => {
                              if (e.target.checked) {
                                setAllowedFormats(prev => [...prev, fmt])
                              } else {
                                if (allowedFormats.length > 1) {
                                  setAllowedFormats(prev => prev.filter(f => f !== fmt))
                                }
                              }
                            }}
                          />
                          <span>{fmt === 'video' ? 'Video' : fmt === 'audio' ? 'Voice Note' : 'Text'}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Questions Builder */}
                  <div style={styles.modalFormGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={styles.modalLabel}>Screening Questions ({questions.length})</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={handleGenerateAIQuestions}
                          disabled={isGeneratingAIQuestions}
                          style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#1d4ed8',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Generate role-specific technical questions automatically using AI"
                        >
                          {isGeneratingAIQuestions ? 'Generating...' : '✨ AI Generate Questions'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQuestions(prev => [
                              ...prev,
                              {
                                id: `q${prev.length + 1}`,
                                text: `New Question ${prev.length + 1}`,
                                description: 'Provide brief context for candidate.',
                                allowedFormats: ['video', 'audio', 'text'],
                                maxDuration: 120
                              }
                            ])
                          }}
                          style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          + Add Question
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {questions.map((q, qIdx) => (
                        <div key={q.id} style={styles.questionEditorRow}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={styles.qNumBadge}>Q{qIdx + 1}</span>
                            <input
                              type="text"
                              value={q.text}
                              onChange={e => {
                                const newText = e.target.value
                                setQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, text: newText } : item))
                              }}
                              style={styles.modalInput}
                            />
                            {questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setQuestions(prev => prev.filter((_, i) => i !== qIdx))}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px' }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Link Expiration & Validity Period */}
                  <div style={styles.modalFormGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={styles.modalLabel}>Link Expiration & Validity Period</label>
                      <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                        Automatically deactivates after selected date
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', gap: '8px' }}>
                      {[
                        { id: '3days', label: '3 Days' },
                        { id: '7days', label: '7 Days (Std)' },
                        { id: '14days', label: '14 Days' },
                        { id: 'custom', label: 'Custom Date' },
                        { id: 'never', label: 'No Expiry' }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setExpiryOption(opt.id)}
                          style={{
                            padding: '8px 6px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            textAlign: 'center',
                            border: expiryOption === opt.id ? '2px solid #2563eb' : '1px solid #cbd5e1',
                            background: expiryOption === opt.id ? '#eff6ff' : '#ffffff',
                            color: expiryOption === opt.id ? '#1d4ed8' : '#334155',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {expiryOption === 'custom' && (
                      <div style={{ marginTop: '10px' }}>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={customExpiryDate}
                          onChange={e => setCustomExpiryDate(e.target.value)}
                          style={styles.modalInput}
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      style={styles.secondaryButton}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCampaign}
                      disabled={isCreating}
                      style={styles.primaryButton}
                    >
                      {isCreating ? 'Generating...' : 'Generate Sharable Link'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Generated Link Result View */
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </div>
                  <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '12px 0 6px' }}>
                    Screening Link Ready!
                  </h4>
                  <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '440px', margin: '0 auto 12px' }}>
                    Share this link directly via email, LinkedIn, or SMS. Candidates can open it immediately with zero login.
                  </p>

                  {/* Expiration Pill in Modal Result */}
                  <div style={{ marginBottom: '16px' }}>
                    {createdLinkResult.expiresAt ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #fde68a',
                        borderRadius: '20px',
                        padding: '4px 14px',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Expires on: {new Date(createdLinkResult.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#f0fdf4',
                        color: '#166534',
                        border: '1px solid #bbf7d0',
                        borderRadius: '20px',
                        padding: '4px 14px',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>
                        ✓ No Expiry (Always Active)
                      </span>
                    )}
                  </div>

                  <div style={styles.linkDisplayBox}>
                    <input
                      type="text"
                      readOnly
                      value={createdLinkResult.screeningUrl}
                      style={styles.linkInput}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdLinkResult.screeningUrl)
                        setCopySuccess(true)
                        setTimeout(() => setCopySuccess(false), 2500)
                      }}
                      style={styles.copyLinkBtn}
                    >
                      {copySuccess ? '✓ Copied!' : 'Copy Link'}
                    </button>
                  </div>

                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEmailModal(createdLinkResult)}
                      style={{
                        ...styles.emailCandidateBtn,
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        gap: '6px'
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L1 7"/></svg>
                      Email Candidate Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      style={styles.primaryButton}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── SEND SCREENING EMAIL MODAL (IN-APP POPUP) ────────────────────── */}
      {showSendEmailModal && (
        <div style={styles.modalOverlay} onClick={() => !isSendingEmail && setShowSendEmailModal(false)}>
          <div style={{ ...styles.modalCard, maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L1 7"/></svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Send Screening Invitation
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Deliver assessment link directly to candidate's email inbox
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSendingEmail && setShowSendEmailModal(false)}
                style={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendScreeningEmail} style={styles.modalBody}>
              {emailSuccessToast && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', fontSize: '13px', fontWeight: 700, marginBottom: 16 }}>
                  ✓ {emailSuccessToast}
                </div>
              )}
              {emailErrorToast && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '13px', fontWeight: 600, marginBottom: 16 }}>
                  ✕ {emailErrorToast}
                </div>
              )}

              <div style={styles.modalFormGroup}>
                <label style={styles.modalLabel}>Candidate Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. candidate@example.com"
                  value={emailModalTo}
                  onChange={e => setEmailModalTo(e.target.value)}
                  style={styles.modalInput}
                  required
                />
              </div>

              <div style={styles.modalFormGroup}>
                <label style={styles.modalLabel}>Email Subject</label>
                <input
                  type="text"
                  value={emailModalSubject}
                  onChange={e => setEmailModalSubject(e.target.value)}
                  style={styles.modalInput}
                  required
                />
              </div>

              <div style={styles.modalFormGroup}>
                <label style={styles.modalLabel}>Invitation Message & Instructions</label>
                <textarea
                  rows={9}
                  value={emailModalBody}
                  onChange={e => setEmailModalBody(e.target.value)}
                  style={{ ...styles.modalInput, fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5 }}
                  required
                />
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowSendEmailModal(false)}
                  disabled={isSendingEmail}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  style={{
                    ...styles.primaryButton,
                    opacity: isSendingEmail ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {isSendingEmail ? 'Dispatching...' : 'Send Screening Email ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PEEKHIRE CANDIDATE REVIEW DRAWER / MODAL ─────────────────────── */}
      {reviewSession && (
        <div style={styles.modalOverlay} onClick={() => setReviewSession(null)}>
          <div style={styles.reviewModalCard} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={styles.reviewHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      {reviewSession.candidateName || 'Applicant'}
                    </h3>
                    <span style={{
                      ...styles.statusBadge,
                      ...(reviewStatus === 'shortlisted' ? styles.statusShortlisted :
                          reviewStatus === 'rejected' ? styles.statusRejected :
                          styles.statusSubmitted)
                    }}>
                      {reviewStatus}
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                    Applying for <strong>{reviewSession.jobTitle}</strong> • {reviewSession.candidateEmail}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* PDF Screening Report Export - only when candidate submitted answers */}
                {hasSubmittedResponses && (
                  <button
                    type="button"
                    onClick={() => handleExportPDFReport(reviewSession)}
                    style={styles.exportPdfTopBtn}
                    title="Export candidate interview report to PDF or print"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Export PDF Report
                  </button>
                )}

                {/* AI Re-evaluation & Transcription Button - only when candidate submitted answers */}
                {hasSubmittedResponses && (
                  <button
                    type="button"
                    onClick={() => handleReEvaluateSession(reviewSession.id || reviewSession._id || reviewSession.sessionId)}
                    disabled={isReEvaluating}
                    style={styles.reEvaluateTopBtn}
                    title="Extract audio speech from candidate video, transcribe with Whisper AI, and re-evaluate technical fit"
                  >
                    {isReEvaluating ? 'Transcribing & Evaluating...' : '⚡ AI Transcribe & Evaluate'}
                  </button>
                )}

                {hasSubmittedResponses && (
                  <button
                    type="button"
                    onClick={() => handleSaveReview('shortlisted')}
                    disabled={isSavingReview}
                    style={styles.shortlistTopBtn}
                  >
                    Shortlist Candidate
                  </button>
                )}
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleDeleteSession(reviewSession, e)
                      setReviewSession(null)
                    }}
                    style={{
                      padding: '8px 14px',
                      background: '#fef2f2',
                      color: '#ef4444',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    title="Permanently delete this screening session (Admin only)"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                    Delete Session
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setReviewSession(null)}
                  style={styles.modalCloseBtn}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Split Content: Left Evaluation & Scorecard, Right Video/Audio Player */}
            <div style={styles.reviewBodySplit}>
              {/* LEFT COLUMN: CANDIDATE INFO & SCORECARD (~360px) */}
              <div style={styles.reviewLeftCol}>
                {/* Candidate Overview Card */}
                <div style={styles.reviewSideCard}>
                  <div style={styles.sideCardHeading}>Candidate Metadata</div>
                  <div style={styles.sideInfoRow}>
                    <span style={{ color: '#64748b' }}>Email:</span>
                    <span>{reviewSession.candidateEmail || 'N/A'}</span>
                  </div>
                  <div style={styles.sideInfoRow}>
                    <span style={{ color: '#64748b' }}>Phone:</span>
                    <span>{reviewSession.candidatePhone || 'N/A'}</span>
                  </div>
                  <div style={styles.sideInfoRow}>
                    <span style={{ color: '#64748b' }}>Candidate Location:</span>
                    <strong style={{ color: '#0f172a' }}>{reviewSession.candidateLocation || 'Not specified'}</strong>
                  </div>
                  <div style={styles.sideInfoRow}>
                    <span style={{ color: '#64748b' }}>Work Authorization:</span>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>{reviewSession.visaStatus || reviewSession.candidateInfo?.visaStatus || 'US Citizen'}</span>
                  </div>
                  {reviewSession.candidateLinkedin && (
                    <div style={styles.sideInfoRow}>
                      <span style={{ color: '#64748b' }}>LinkedIn:</span>
                      <a href={reviewSession.candidateLinkedin} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: '700' }}>
                        Profile ↗
                      </a>
                    </div>
                  )}
                  <div style={styles.sideInfoRow}>
                    <span style={{ color: '#64748b' }}>Assigned Recruiter:</span>
                    <strong style={{ color: '#0f172a', fontWeight: '700', fontSize: '13px' }}>
                      {getRecruiterName(reviewSession)}
                    </strong>
                  </div>
                </div>


                {/* Proctoring & Integrity Audit Card */}
                {(reviewSession.proctoring || reviewSession.candidateGeo) && (
                  <div style={styles.reviewSideCard}>
                    <div style={styles.sideCardHeading}>Proctoring & Integrity Audit</div>
                    <div style={styles.sideInfoRow}>
                      <span style={{ color: '#64748b' }}>Desktop Screen Share:</span>
                      <strong style={{ color: reviewSession.proctoring?.screenShared ? '#16a34a' : '#64748b' }}>
                        {reviewSession.proctoring?.screenShared ? 'Verified Monitor' : 'Standard'}
                      </strong>
                    </div>
                    <div style={styles.sideInfoRow}>
                      <span style={{ color: '#64748b' }}>Fullscreen Lock:</span>
                      <strong style={{ color: reviewSession.proctoring?.fullscreenEnforced ? '#16a34a' : '#64748b' }}>
                        {reviewSession.proctoring?.fullscreenEnforced ? 'Enforced' : 'No'}
                      </strong>
                    </div>
                    <div style={styles.sideInfoRow}>
                      <span style={{ color: '#64748b' }}>Tab Violations:</span>
                      <strong style={{ color: (reviewSession.proctoring?.tabViolationsCount || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                        {(reviewSession.proctoring?.tabViolationsCount || 0) === 0 ? '0 Infractions (Clean)' : `${reviewSession.proctoring.tabViolationsCount} Infractions Logged`}
                      </strong>
                    </div>
                    {reviewSession.candidateGeo && (
                      <div style={styles.sideInfoRow}>
                        <span style={{ color: '#64748b' }}>GPS Geolocation:</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#16a34a' }}>
                            {reviewSession.candidateGeo.cityState || reviewSession.candidateGeo.resolvedAddress || `${reviewSession.candidateGeo.latitude?.toFixed(3)}°, ${reviewSession.candidateGeo.longitude?.toFixed(3)}°`}
                          </div>
                          <div style={{ fontSize: '10.5px', fontFamily: 'monospace', color: '#64748b' }}>
                            {reviewSession.candidateGeo.latitude?.toFixed(4)}°, {reviewSession.candidateGeo.longitude?.toFixed(4)}°
                          </div>
                        </div>
                      </div>
                    )}

                    {reviewSession.candidateGeo && (() => {
                      const enteredLoc = reviewSession.candidateLocation || reviewSession.candidateInfo?.location || ''
                      const audit = checkLocationMismatch(enteredLoc, reviewSession.candidateGeo)
                      if (!audit.hasCheck) return null
                      if (audit.isMismatch) {
                        return (
                          <div style={{
                            marginTop: '10px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: '#fff1f2',
                            border: '1.5px solid #fecdd3'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#be123c', fontWeight: 800, fontSize: '11.5px' }}>
                              <span>⚠️</span> LOCATION DISCREPANCY DETECTED
                            </div>
                            <div style={{ fontSize: '11px', color: '#475569', marginTop: '5px', lineHeight: 1.5 }}>
                              <div>• Stated Location: <strong style={{ color: '#0f172a' }}>{audit.enteredLocation}</strong></div>
                              <div>• Verified Device GPS: <strong style={{ color: '#be123c' }}>{audit.actualGpsLocation}</strong></div>
                              <div style={{ color: '#e11d48', marginTop: '3px', fontSize: '10.5px', fontWeight: 600 }}>
                                Candidate reported location does not match physical GPS device coordinates.
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return (
                        <div style={{
                          marginTop: '8px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: '#ecfdf5',
                          border: '1px solid #bbf7d0',
                          color: '#15803d',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <span>✓</span> Verified: GPS matches stated location ({audit.enteredLocation})
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* AI Screening Assessment Card */}
                <div style={styles.reviewSideCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={styles.sideCardHeading}>AI Match & Insights</div>
                    {hasSubmittedResponses && (
                      <button
                        type="button"
                        onClick={() => handleReEvaluateSession(reviewSession.id || reviewSession._id || reviewSession.sessionId)}
                        disabled={isReEvaluating}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          padding: '2px 4px'
                        }}
                        title="Re-run AI evaluation on candidate speech"
                      >
                        {isReEvaluating ? 'Evaluating...' : '↻ Re-evaluate'}
                      </button>
                    )}
                  </div>

                  {hasSubmittedResponses && reviewSession.aiScore ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0 12px' }}>
                        <div style={{
                          ...styles.aiMatchScoreCircle,
                          ...(reviewSession.aiScore >= 85 ? { background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' } :
                              reviewSession.aiScore >= 70 ? { background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' } :
                              reviewSession.aiScore >= 50 ? { background: '#fffbeb', color: '#b45309', borderColor: '#fde68a' } :
                              { background: '#fff1f2', color: '#be123c', borderColor: '#fecdd3' })
                        }}>
                          {reviewSession.aiScore}%
                        </div>
                        <div>
                          <div style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '800',
                            background: reviewSession.aiScore >= 85 ? '#ecfdf5' : reviewSession.aiScore >= 70 ? '#eff6ff' : '#fffbeb',
                            color: reviewSession.aiScore >= 85 ? '#047857' : reviewSession.aiScore >= 70 ? '#1d4ed8' : '#b45309'
                          }}>
                            {reviewSession.recommendation || 'Strong Match'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                            Evaluated against Requisition
                          </div>
                        </div>
                      </div>

                      {Array.isArray(reviewSession.aiSummary) && reviewSession.aiSummary.length > 0 ? (
                        <ul style={styles.aiSummaryList}>
                          {reviewSession.aiSummary.map((pt, pIdx) => (
                            <li key={pIdx} style={styles.aiSummaryItem}>
                              {pt}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4, margin: 0 }}>
                          {reviewSession.keyTakeaways || 'Candidate presented clear, well-structured technical answers.'}
                        </p>
                      )}
                    </>
                  ) : (
                    <div style={{ padding: '16px 0', textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Interview Pending
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                        Awaiting candidate submission. AI evaluation, match score, and technical insights will appear here once the candidate completes and submits their video interview.
                      </p>
                    </div>
                  )}
                </div>

                {/* Recruiter Evaluation & Scorecard */}
                <div style={styles.reviewSideCard}>
                  <div style={styles.sideCardHeading}>Recruiter Scorecard</div>
                  
                  {/* 1-5 Stars */}
                  <div style={{ margin: '8px 0 12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Your Rating:</span>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', cursor: 'pointer', fontSize: '24px', color: '#f59e0b' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span
                          key={star}
                          onClick={() => setRecruiterRating(star)}
                          style={{ transition: 'transform 0.1s' }}
                        >
                          {star <= recruiterRating ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status selector */}
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Update Status:</label>
                    <select
                      value={reviewStatus}
                      onChange={e => setReviewStatus(e.target.value)}
                      style={styles.sideSelect}
                    >
                      <option value="submitted">New / Submitted</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Recruiter Notes:</label>
                    <textarea
                      rows={3}
                      value={recruiterNotes}
                      onChange={e => setRecruiterNotes(e.target.value)}
                      placeholder="Add private recruiter evaluation notes..."
                      style={styles.sideTextarea}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveReview()}
                    disabled={isSavingReview}
                    style={styles.saveReviewBtn}
                  >
                    {isSavingReview ? 'Saving...' : 'Save Evaluation'}
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: QUESTION TABS & VIDEO/AUDIO PLAYER */}
              <div style={styles.reviewRightCol}>
                {/* Pinned Question Tabs Header (Never scrolls, never cuts off) */}
                <div style={styles.qTabRowPinned}>
                  {(reviewSession.responses || []).map((resp, idx) => (
                    <button
                      key={resp.questionId || idx}
                      type="button"
                      onClick={() => {
                        setActiveQuestionTab(idx)
                        if (typeof resp.startTime === 'number') {
                          const vid = document.getElementById('screening-review-video')
                          if (vid) {
                            const applySeek = () => {
                              try {
                                vid.currentTime = resp.startTime
                                vid.play().catch(() => {})
                              } catch (e) {}
                            }
                            if (vid.readyState >= 1) {
                              applySeek()
                            } else {
                              vid.addEventListener('loadedmetadata', applySeek, { once: true })
                            }
                          }
                        }
                      }}
                      style={{
                        ...styles.qTabBtn,
                        ...(activeQuestionTab === idx ? styles.qTabBtnActive : {})
                      }}
                    >
                      <span style={{ fontWeight: '700' }}>Q{idx + 1}: {resp.format === 'video' ? 'Video' : resp.format === 'audio' ? 'Audio' : 'Text'}</span>
                      {typeof resp.startTime === 'number' && (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: activeQuestionTab === idx ? 'rgba(255, 255, 255, 0.25)' : '#e2e8f0',
                          color: activeQuestionTab === idx ? '#ffffff' : '#475569',
                          marginLeft: '6px'
                        }}>
                          {Math.floor(resp.startTime / 60)}:{String(Math.floor(resp.startTime % 60)).padStart(2, '0')}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Scrollable Response Content Body */}
                <div style={styles.reviewScrollableBody}>
                  {reviewSession.responses && reviewSession.responses[activeQuestionTab] ? (
                  (() => {
                    const currentAns = reviewSession.responses[activeQuestionTab]
                    return (
                      <div style={styles.playerWrapper}>
                        {/* Question Banner */}
                        <div style={styles.playerQuestionBanner}>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Question {activeQuestionTab + 1}
                          </div>
                          <h4 style={{ fontSize: '15.5px', fontWeight: '800', color: '#0f172a', margin: '4px 0 0', lineHeight: 1.4 }}>
                            {currentAns.questionText || `Question ${activeQuestionTab + 1}`}
                          </h4>
                        </div>

                        {/* Player / Viewer */}
                        {currentAns.format === 'video' && (currentAns.mediaUrl || reviewSession.masterMediaUrl) && (
                          <div style={styles.videoPlayerBox}>
                            <video
                              id="screening-review-video"
                              key={reviewSession?.sessionId}
                              src={currentAns.mediaUrl || reviewSession.masterMediaUrl}
                              controls
                              preload="metadata"
                              playsInline
                              playbackRate={playbackSpeed}
                              style={styles.fullVideoElement}
                              onLoadedMetadata={e => {
                                if (typeof currentAns.startTime === 'number' && currentAns.startTime > 0) {
                                  try {
                                    e.target.currentTime = currentAns.startTime
                                  } catch (err) {}
                                }
                              }}
                            />
                            {/* Playback speed controls & video download */}
                            <div style={styles.speedControlsRow}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '700' }}>Speed:</span>
                                {[1, 1.25, 1.5, 2].map(speed => (
                                  <button
                                    key={speed}
                                    type="button"
                                    onClick={() => {
                                      setPlaybackSpeed(speed)
                                      const vid = document.getElementById('screening-review-video')
                                      if (vid) vid.playbackRate = speed
                                    }}
                                    style={{
                                      ...styles.speedBtn,
                                      ...(playbackSpeed === speed ? styles.speedBtnActive : {})
                                    }}
                                  >
                                    {speed}x
                                  </button>
                                ))}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <a
                                  href={currentAns.mediaUrl || reviewSession.masterMediaUrl}
                                  download={`Interview_${(reviewSession.candidateName || 'Candidate').replace(/\s+/g, '_')}_Q${activeQuestionTab + 1}.webm`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={styles.downloadVideoBtn}
                                  title="Download video for this question"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                  </svg>
                                  Download Video
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        {currentAns.format === 'audio' && currentAns.mediaUrl && (
                          <div style={styles.audioPlayerBox}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                              </svg>
                            </div>
                            <audio
                              src={currentAns.mediaUrl}
                              controls
                              style={{ width: '100%', maxWidth: '440px' }}
                            />
                          </div>
                        )}

                        {currentAns.format === 'text' && (
                          <div style={styles.textAnswerBox}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>
                              Candidate's Written Response:
                            </div>
                            <div style={{ fontSize: '14.5px', color: '#0f172a', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                              {currentAns.textAnswer || currentAns.transcript || 'No written answer provided.'}
                            </div>
                          </div>
                        )}

                        {/* AI Transcript Box */}
                        {currentAns.format !== 'text' && (
                          <div style={styles.transcriptBox}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '800', color: '#312e81', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                </svg>
                                AI Speech-to-Text Transcript (Whisper AI)
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {currentAns.transcript && !currentAns.transcript.includes('Spoken answer captured during continuous interview') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(currentAns.transcript)
                                      alert('Transcript copied to clipboard!')
                                    }}
                                    style={styles.copyTranscriptBtn}
                                  >
                                    Copy Text
                                  </button>
                                )}
                              </div>
                            </div>

                            {currentAns.transcript && !currentAns.transcript.includes('Spoken answer captured during continuous interview') ? (
                              <p style={styles.transcriptParagraph}>
                                "{currentAns.transcript}"
                              </p>
                            ) : (
                              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 10px' }}>
                                  Candidate speech audio has not been transcribed yet, or placeholder text was detected.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleReEvaluateSession(reviewSession.id || reviewSession._id || reviewSession.sessionId)}
                                  disabled={isReEvaluating}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    background: '#4f46e5',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {isReEvaluating ? 'Transcribing with AI...' : '⚡ Transcribe Spoken Audio with AI'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })()
                ) : (
                  <div style={{ padding: '40px 24px', maxWidth: '620px', margin: '0 auto', textAlign: 'center' }}>
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: '#f8fafc',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                    </div>

                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                      Candidate Video Interview Pending
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>
                      The candidate has been invited for this asynchronous screening session. Video recordings, AI transcripts, and the evaluation scorecard will activate automatically as soon as the candidate submits their responses.
                    </p>

                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '16px',
                      textAlign: 'left',
                      marginBottom: '20px'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                        Candidate Screening Invite Link
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '6px 10px'
                      }}>
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/candidate-chat/${reviewSession.sessionId || reviewSession.id || reviewSession._id}`}
                          style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            fontSize: '12px',
                            color: '#334155',
                            background: 'transparent'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/candidate-chat/${reviewSession.sessionId || reviewSession.id || reviewSession._id}`
                            navigator.clipboard.writeText(url)
                            setCopiedSessionId(reviewSession.sessionId || reviewSession.id)
                            setTimeout(() => setCopiedSessionId(null), 3000)
                          }}
                          style={{
                            padding: '6px 14px',
                            background: copiedSessionId === (reviewSession.sessionId || reviewSession.id) ? '#059669' : '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '5px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {copiedSessionId === (reviewSession.sessionId || reviewSession.id) ? '✓ Copied' : 'Copy Link'}
                        </button>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Session: {reviewSession.sessionId || reviewSession.id}</span>
                        <span>{reviewSession.expiresAt ? `Valid until ${new Date(reviewSession.expiresAt).toLocaleDateString()}` : '7-Day Cloud Retention Active'}</span>
                      </div>
                    </div>

                    {reviewSession.candidateEmail && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const inviteUrl = `${window.location.origin}/candidate-chat/${reviewSession.sessionId || reviewSession.id || reviewSession._id}`
                            handleOpenEmailModal({
                              jobTitle: reviewSession.jobTitle,
                              screeningUrl: inviteUrl,
                              candidateName: reviewSession.candidateName,
                              candidateEmail: reviewSession.candidateEmail
                            })
                          }}
                          style={{
                            padding: '8px 18px',
                            background: '#ffffff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          Resend Invitation Email
                        </button>
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── STYLES ───────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const styles = {
  container: {
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: '#0f172a'
  },
  topHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '14px',
    marginTop: '0px'
  },
  mainTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.01em',
    lineHeight: '1.25'
  },
  smartHireBadge: {
    fontSize: '10.5px',
    fontWeight: '700',
    color: '#2563eb',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    padding: '2px 8px',
    borderRadius: '10px',
    letterSpacing: '0.01em',
    display: 'inline-flex',
    alignItems: 'center',
    lineHeight: '1.2'
  },
  mainSubtitle: {
    fontSize: '12px',
    color: '#64748b',
    margin: '3px 0 0',
    lineHeight: '1.4'
  },
  createCampaignBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
    transition: 'all 0.15s ease'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginBottom: '14px'
  },
  kpiCard: {
    background: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '10px 14px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
    transition: 'all 0.15s ease'
  },
  kpiLabel: {
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#64748b'
  },
  kpiValue: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '4px 0 1px',
    lineHeight: '1.1'
  },
  kpiSub: {
    fontSize: '11px',
    color: '#94a3b8'
  },
  kpiIconBlue: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px'
  },
  kpiIconTeal: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: '#ecfdf5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px'
  },
  kpiIconPurple: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: '#faf5ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px'
  },
  kpiIconAmber: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: '#fffbeb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px'
  },
  toolbarRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '16px'
  },
  searchBoxWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '8px 14px',
    width: '100%',
    maxWidth: '360px'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '13px',
    color: '#0f172a',
    fontFamily: 'inherit'
  },
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '12px'
  },
  filterButtonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  filterTab: {
    padding: '6px 12px',
    borderRadius: '8px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    color: '#475569',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  filterTabActive: {
    background: '#eff6ff',
    color: '#2563eb',
    borderColor: '#bfdbfe'
  },
  tableCard: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  tableHeadRow: {
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  },
  th: {
    padding: '10px 14px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  tableRow: {
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'background 0.15s ease'
  },
  td: {
    padding: '10px 14px',
    verticalAlign: 'middle'
  },
  paginationBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 18px',
    borderTop: '1px solid #e2e8f0',
    background: '#ffffff',
    fontSize: '13px',
    color: '#475569',
    flexWrap: 'wrap',
    gap: '12px'
  },
  paginationLeft: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px'
  },
  paginationRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  pageSizeSelect: {
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#0f172a',
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    cursor: 'pointer',
    outline: 'none'
  },
  pageNavBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    color: '#1e293b',
    transition: 'all 0.15s ease'
  },
  pageNumBtn: {
    minWidth: '28px',
    height: '28px',
    padding: '0 6px',
    borderRadius: '6px',
    border: '1px solid transparent',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  avatarCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#dbeafe',
    color: '#1d4ed8',
    fontWeight: '800',
    fontSize: '12.5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  avatarCircleLarge: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    background: '#dbeafe',
    color: '#1d4ed8',
    fontWeight: '900',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  formatChipVideo: {
    background: '#f3e8ff',
    color: '#7e22ce',
    fontSize: '10.5px',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '6px'
  },
  formatChipAudio: {
    background: '#e0f2fe',
    color: '#0369a1',
    fontSize: '10.5px',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '6px'
  },
  formatChipText: {
    background: '#f1f5f9',
    color: '#334155',
    fontSize: '10.5px',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '6px'
  },
  scoreBadge: {
    fontSize: '11.5px',
    fontWeight: '800',
    padding: '3px 8px',
    borderRadius: '12px'
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 9px',
    borderRadius: '12px'
  },
  statusShortlisted: {
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fde68a'
  },
  statusSubmitted: {
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0'
  },
  statusRejected: {
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca'
  },
  statusPending: {
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0'
  },
  reviewButton: {
    padding: '6px 14px',
    borderRadius: '8px',
    background: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  emptyTable: {
    padding: '60px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  primaryButton: {
    padding: '10px 20px',
    borderRadius: '10px',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  secondaryButton: {
    padding: '10px 18px',
    borderRadius: '10px',
    background: '#ffffff',
    color: '#475569',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(6px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  modalCard: {
    background: '#ffffff',
    borderRadius: '18px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: '1px solid #cbd5e1'
  },
  modalHeader: {
    padding: '18px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#94a3b8',
    cursor: 'pointer'
  },
  modalBody: {
    padding: '24px'
  },
  modalFormGroup: {
    marginBottom: '18px'
  },
  modalLabel: {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '6px'
  },
  modalSelect: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box'
  },
  modalInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box'
  },
  questionEditorRow: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '8px'
  },
  qNumBadge: {
    background: '#eff6ff',
    color: '#2563eb',
    fontSize: '11px',
    fontWeight: '800',
    padding: '4px 8px',
    borderRadius: '6px'
  },
  linkCreatedSuccessIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: '#ecfdf5',
    color: '#059669',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto'
  },
  linkDisplayBox: {
    display: 'flex',
    gap: '8px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '8px 10px'
  },
  linkInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    color: '#0f172a',
    fontFamily: 'monospace'
  },
  copyLinkBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  emailCandidateBtn: {
    padding: '10px 18px',
    borderRadius: '10px',
    background: '#f1f5f9',
    color: '#334155',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center'
  },
  reviewModalCard: {
    background: '#ffffff',
    borderRadius: '20px',
    width: '96vw',
    maxWidth: '1360px',
    height: '94vh',
    maxHeight: '94vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
    border: '1px solid #cbd5e1',
    overflow: 'hidden'
  },
  reviewHeader: {
    padding: '16px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f8fafc',
    flexShrink: 0
  },
  shortlistTopBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fde68a',
    fontSize: '12.5px',
    fontWeight: '800',
    cursor: 'pointer'
  },
  reviewBodySplit: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  },
  reviewLeftCol: {
    width: '360px',
    flexShrink: 0,
    borderRight: '1px solid #e2e8f0',
    background: '#f8fafc',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflowY: 'auto'
  },
  reviewRightCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#ffffff'
  },
  qTabRowPinned: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    background: '#ffffff',
    padding: '16px 28px 14px 28px',
    borderBottom: '1.5px solid #e2e8f0',
    flexShrink: 0,
    boxSizing: 'border-box',
    overflowX: 'auto',
    zIndex: 10
  },
  reviewScrollableBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '18px 28px 28px 28px',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  },
  reviewSideCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '16px'
  },
  sideCardHeading: {
    fontSize: '12px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: '#64748b',
    marginBottom: '10px'
  },
  sideInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12.5px',
    marginBottom: '6px'
  },
  aiMatchScoreCircle: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: '#eff6ff',
    color: '#1d4ed8',
    fontSize: '14px',
    fontWeight: '900',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #bfdbfe'
  },
  aiSummaryList: {
    margin: 0,
    paddingLeft: '16px',
    fontSize: '12px',
    color: '#334155',
    lineHeight: 1.5
  },
  aiSummaryItem: {
    marginBottom: '6px'
  },
  sideSelect: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '12.5px',
    color: '#0f172a',
    marginTop: '4px',
    outline: 'none'
  },
  sideTextarea: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '12.5px',
    color: '#0f172a',
    marginTop: '4px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  saveReviewBtn: {
    width: '100%',
    padding: '9px',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  qTabRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    background: '#ffffff',
    padding: '16px 0 12px 0',
    borderBottom: '1px solid #e2e8f0',
    marginBottom: '16px',
    overflowX: 'auto',
    flexWrap: 'wrap',
    boxSizing: 'border-box',
    position: 'sticky',
    top: 0,
    zIndex: 20
  },
  qTabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 18px',
    borderRadius: '10px',
    border: '1.5px solid #cbd5e1',
    background: '#f8fafc',
    color: '#334155',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
  },
  qTabBtnActive: {
    background: '#2563eb',
    color: '#ffffff',
    borderColor: '#1d4ed8',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
    fontWeight: '800'
  },
  playerWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  playerQuestionBanner: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderLeft: '4px solid #2563eb',
    borderRadius: '10px',
    padding: '14px 18px',
    boxSizing: 'border-box'
  },
  videoPlayerBox: {
    position: 'relative',
    background: '#000000',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
  },
  fullVideoElement: {
    width: '100%',
    maxHeight: '420px',
    display: 'block'
  },
  speedControlsRow: {
    background: '#0f172a',
    padding: '8px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: '1px solid #1e293b'
  },
  downloadVideoBtn: {
    padding: '4px 10px',
    borderRadius: '6px',
    background: '#334155',
    color: '#ffffff',
    border: 'none',
    fontSize: '11.5px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    textDecoration: 'none'
  },
  reEvaluateTopBtn: {
    padding: '7px 14px',
    borderRadius: '8px',
    background: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background 0.15s ease'
  },
  exportPdfTopBtn: {
    padding: '7px 14px',
    borderRadius: '8px',
    background: '#0f172a',
    color: '#ffffff',
    border: 'none',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background 0.15s ease'
  },
  pdfReportTableBtn: {
    height: '26px',
    padding: '0 8px',
    borderRadius: '5px',
    background: '#f8fafc',
    color: '#334155',
    border: '1px solid #cbd5e1',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    lineHeight: 1,
    transition: 'all 0.15s ease',
    flexShrink: 0
  },
  downloadTopBtn: {
    padding: '7px 14px',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    textDecoration: 'none'
  },
  speedBtn: {
    padding: '3px 8px',
    borderRadius: '6px',
    background: '#334155',
    color: '#ffffff',
    border: 'none',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  speedBtnActive: {
    background: '#2563eb'
  },
  audioPlayerBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '36px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  textAnswerBox: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '18px'
  },
  transcriptBox: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    padding: '14px 18px'
  },
  copyTranscriptBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '11.5px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  transcriptParagraph: {
    fontSize: '13px',
    color: '#1e293b',
    fontStyle: 'italic',
    lineHeight: 1.5,
    margin: '8px 0 0'
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto'
  }
}
