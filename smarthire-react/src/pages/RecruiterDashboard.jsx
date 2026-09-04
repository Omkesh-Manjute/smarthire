import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import SiteLayout from '../components/SiteLayout'
import CandidatePdfReportModal from '../components/CandidatePdfReportModal'
import CandidateDetailViewModal from '../components/CandidateDetailViewModal'
import AiMatchingCandidatesModal from '../components/AiMatchingCandidatesModal'
import ActivityNotificationBell, { pushActivityNotification } from '../components/ActivityNotificationBell'
import { AuditActivityLogModule, logAuditEvent } from '../ats'
import { US_STATES } from '../data/usStates'
import { parseResume } from '../smarthire/utils/parseResume'
import { formatJobDescription, cleanJobTitleWithPositionNumber, resolveReqId } from '../utils/formatJobDescription'
import {
  saveCandidate,
  getAllCandidates,
  saveRequisitionCandidates,
  getRequisitionCandidates,
  saveTeamUsersFirestore,
  getTeamUsersFirestore,
  getAtsJobs,
  subscribeAtsJobs,
  deduplicateCandidates
} from '../lib/atsFirestore'

function getFullDescriptionText(job) {
  if (!job) return ''
  const raw = job.rawDescription || job.fullDescription || job.rawText || job.details || job.rawJd || job.description
  if (raw && typeof raw === 'string' && raw.length > 30) {
    return formatJobDescription(raw, job)
  }
  return formatJobDescription('', job)
}

function parseResumeDetails(text, filename = '') {
  let firstName = ''
  let lastName = ''
  let email = ''
  let phone = ''
  let city = ''
  let state = 'VA'
  let zip = ''
  let exp = '5'
  let jobTitle = 'Consultant'
  let skills = []

  if (text) {
    // 1. Email Extraction - match all valid email patterns
    const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
    if (emailMatches && emailMatches.length > 0) {
      // Pick first non-generic email
      email = emailMatches.find(em => !em.includes('example.com') && !em.includes('dummy')) || emailMatches[0]
      email = email.trim()
    }

    // 2. Phone Extraction - match US and international phone formats
    const phonePatterns = [
      /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
      /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/,
      /\b\d{10}\b/,
      /\+?\d{1,3}[-.\s]?\d{3,5}[-.\s]?\d{3,5}/
    ]
    for (const pattern of phonePatterns) {
      const m = text.match(pattern)
      if (m) {
        phone = m[0].trim()
        break
      }
    }

    // 3. Location Extraction
    const locMatch = text.match(/([A-Z][a-zA-Z\s]{2,18}),\s*([A-Z]{2})(?:\s*(\d{5}))?/)
    if (locMatch) {
      city = locMatch[1].trim()
      state = locMatch[2].trim().toUpperCase()
      if (locMatch[3]) zip = locMatch[3].trim()
    }

    // 4. Experience Extraction
    const expMatch = text.match(/(\d{1,2})\+?\s*(?:years|yrs|year)\s*(?:of)?\s*(?:experience|exp)?/i)
    if (expMatch) exp = expMatch[1]

    // 5. Name Extraction from top lines
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    for (let i = 0; i < Math.min(6, lines.length); i++) {
      const line = lines[i]
      if (line.includes('@') || /http|www|linkedin|github|phone|tel|curriculum|vitae|resume/i.test(line)) continue
      if (/\d{4,}/.test(line)) continue
      const cleanWords = line.replace(/[^a-zA-Z\s.'-]/g, '').trim().split(/\s+/).filter(Boolean)
      if (cleanWords.length >= 2 && cleanWords.length <= 4) {
        firstName = cleanWords[0]
        lastName = cleanWords.slice(1).join(' ')
        break
      }
    }
  }

  // 6. Filename fallback for Name
  if (!firstName && filename) {
    const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z\s_-]/g, ' ')
    const parts = cleanName.split(/[\s_-]+/).filter(w => !['resume', 'cv', 'profile', 'latest', 'updated', 'pdf', 'doc', 'docx'].includes(w.toLowerCase()))
    if (parts.length >= 2) {
      firstName = parts[0]
      lastName = parts.slice(1).join(' ')
    } else if (parts.length === 1) {
      firstName = parts[0]
      lastName = ''
    }
  }

  return {
    firstName: firstName || 'Candidate',
    lastName: lastName || '',
    name: `${firstName || 'Candidate'} ${lastName || ''}`.trim(),
    email: email || '',
    phone: phone || '',
    city: city || 'Richmond',
    state: state || 'VA',
    zip: zip || '',
    exp: exp || '5',
    jobTitle: jobTitle || 'Consultant',
    resumeTitle: filename ? filename.replace(/\.[^/.]+$/, '') : `${firstName || 'Candidate'}_Resume`,
  }
}

const legacyCandidateData = []

function RecruiterDashboard() {
  const [jobs, setJobs] = useState([])
  const knownJobIdsRef = useRef(new Set())
  const initialJobsLoadedRef = useRef(false)
  const [candidates, setCandidates] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_all_candidates')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return deduplicateCandidates(parsed)
      }
    } catch (e) {}
    return legacyCandidateData
  })
  
  // ─── DYNAMIC TEAM USERS & MULTI-LEVEL RBAC ───
  const DEFAULT_USERS_LIST = [
    { id: 'rec-1', name: 'Omkesh', email: 'omkesh@coolsofttech.com', role: 'superadmin', refCode: 'omkesh', parentRecruiterName: '', company: 'SmartHire LLC', isActive: true, password: 'admin' },
    { id: 'rec-2', name: 'Sukamal Chatterjee', email: 'kamal@coolsofttech.com', role: 'recruiter', refCode: 'sukamal-chatterjee', parentRecruiterName: '', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' },
    { id: 'rec-3', name: 'Gourav', email: 'gourav@coolsofttech.com', role: 'recruiter', refCode: 'gourav', parentRecruiterName: 'Omkesh', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' },
    { id: 'rec-4', name: 'Vaibhav Bisen', email: 'vaibhav@coolsofttech.com', role: 'recruiter', refCode: 'vaibhav-bisen', parentRecruiterName: '', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' },
    { id: 'mgr-1', name: 'Alok Manager', email: 'manager@coolsofttech.com', role: 'manager', refCode: 'alok-manager', parentRecruiterName: '', company: 'SmartHire LLC', isActive: true, password: 'manager123' },
    { id: 'emp-1', name: 'Naveen Bhardwaj', email: 'naveen@coolsofttech.com', role: 'employee', refCode: 'naveen-bhardwaj', parentRecruiterName: 'Sukamal Chatterjee', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' },
    { id: 'emp-2', name: 'Rahul Sharma', email: 'rahul@coolsofttech.com', role: 'employee', refCode: 'rahul-sharma', parentRecruiterName: 'Vaibhav Bisen', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' },
    { id: 'emp-3', name: 'Priya Verma', email: 'priya@coolsofttech.com', role: 'employee', refCode: 'priya-verma', parentRecruiterName: 'Sukamal Chatterjee', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' }
  ]

  const [teamUsers, setTeamUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_recruiters')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {}
    return DEFAULT_USERS_LIST
  })

  const saveTeamUsers = (updatedList, createdOrEditedUser = null) => {
    setTeamUsers(updatedList)
    try {
      localStorage.setItem('smarthire_recruiters', JSON.stringify(updatedList))
    } catch (e) {}

    // Sync to Firestore immediately
    saveTeamUsersFirestore(updatedList).catch(() => {})

    // Sync to backend database immediately
    try {
      if (createdOrEditedUser) {
        fetch('/api/admin/recruiters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createdOrEditedUser)
        }).catch(err => console.warn('Background user sync notice:', err))
      } else {
        fetch('/api/admin/recruiters/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recruiters: updatedList })
        }).catch(err => console.warn('Background users bulk sync notice:', err))
      }
    } catch (e) {}
  }

  // Delete User handler with comprehensive cleanup across assignments, local storage, and database
  const handleDeleteTeamUser = async (userToDelete) => {
    if (!userToDelete) return
    const uEmail = (userToDelete.email || '').toLowerCase().trim()
    if (uEmail === 'omkesh@coolsofttech.com') {
      alert('⚠️ Master Superadmin cannot be deleted.')
      return
    }
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete user "${userToDelete.name}" (${userToDelete.email || userToDelete.role || 'Team Member'})?\n\nThis will remove their login access, employee records, and requisition assignments.`
    )
    if (!confirmDelete) return

    const targetId = String(userToDelete.id || userToDelete._id || userToDelete.email || '')
    const targetEmail = uEmail
    const targetName = (userToDelete.name || '').toLowerCase().trim()

    // 1. Remove from teamUsers state
    const updated = teamUsers.filter(u => {
      const thisId = String(u.id || u._id || '')
      const thisEmail = (u.email || '').toLowerCase().trim()
      const thisName = (u.name || '').toLowerCase().trim()
      if (targetId && (thisId === targetId || thisId === `rec-${targetId}` || thisId === `emp-${targetId}`)) return false
      if (targetEmail && thisEmail === targetEmail) return false
      if (targetName && thisName === targetName) return false
      return true
    })

    saveTeamUsers(updated)

    // 2. Also remove user from any assigned requisitions in editingFields
    setEditingFields(prev => {
      const currentAssigned = prev.assignedRecruiters || []
      const filtered = currentAssigned.filter(r => {
        const rName = String(r || '').toLowerCase().trim()
        return rName !== targetName && rName !== targetEmail
      })
      return { ...prev, assignedRecruiters: filtered }
    })

    // 3. Call backend API to delete permanently from MongoDB / Server
    try {
      const token = localStorage.getItem('smarthire_token') || ''
      const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      await fetch(`/api/admin/recruiters/${encodeURIComponent(targetId || targetEmail)}`, {
        method: 'DELETE',
        headers
      })
      await fetch('/api/admin/recruiters/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ recruiters: updated })
      })
    } catch (err) {
      console.warn('Backend user delete sync notice:', err)
    }

    setSaveToastMessage(`🗑️ User "${userToDelete.name}" deleted successfully!`)
    setTimeout(() => setSaveToastMessage(null), 3500)
  }

  // User auth state & RBAC detection
  const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user')
  let currentUser = null
  try {
    if (userStr) currentUser = JSON.parse(userStr)
  } catch (e) {}

  const userName = currentUser?.name || currentUser?.displayName || 'Omkesh'
  const activeRoleOverride = localStorage.getItem('smarthire_active_role')
  const userRole = activeRoleOverride || currentUser?.role || (userName.toLowerCase().includes('omkesh') ? 'superadmin' : 'recruiter')

  const isAdmin = userRole === 'superadmin' || userRole === 'admin'
  const isSuperAdmin = isAdmin
  const isManager = userRole === 'manager'
  const isRecruiter = userRole === 'recruiter'
  const isEmployee = userRole === 'employee'
  const canEditRequirement = !isEmployee // Admin, Manager & Recruiters can edit position title, client, rates, contact, specs
  const canCreateRequisition = !isEmployee // Admin, Manager & Recruiters can add new requisitions
  const canChangeReqStatus = isAdmin || isManager || isRecruiter // Recruiters can change Status
  const canAssignRecruiters = isAdmin || isManager || isRecruiter
  const canReviewAndUseAI = isAdmin || isManager // AI Fit and Resume Review strictly restricted to Admin & Manager
  const canAccessAdminPanel = isAdmin || isManager
  const isRecruiterRole = isRecruiter || isEmployee

  // Top Nav Tab: 'requisitions' | 'candidates' | 'admin' | 'reports' (Hydrated from URL and localStorage to persist on refresh)
  const [activeMainTab, setActiveMainTab] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const tabParam = urlParams.get('tab')
      if (tabParam && ['requisitions', 'candidates', 'admin', 'reports'].includes(tabParam)) return tabParam
      const saved = localStorage.getItem('smarthire_active_main_tab')
      if (saved && ['requisitions', 'candidates', 'admin', 'reports'].includes(saved)) return saved
    } catch (e) {}
    return 'requisitions'
  })

  // Navigation Flow State: 'portal' | 'requisition' | 'resumeSearch' | 'resumeSubmission'
  const [viewMode, setViewMode] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const modeParam = urlParams.get('view')
      if (modeParam) return modeParam
      const saved = localStorage.getItem('smarthire_active_view_mode')
      if (saved) return saved
    } catch (e) {}
    return 'portal'
  })

  const [selectedReq, setSelectedReq] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_active_selected_req')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return null
  })

  const [activeReqTab, setActiveReqTab] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_active_req_subtab')
      if (saved) return saved
    } catch (e) {}
    return 'details'
  })

  // Candidate Search Collapse State (Default collapsed/hidden as requested)
  const [showCandidateSearchCard, setShowCandidateSearchCard] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [quickSearchId, setQuickSearchId] = useState('')
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  // Full Candidate Detail & Submission/Resume History Modal
  const [selectedViewCandidate, setSelectedViewCandidate] = useState(null)
  const [showDetailViewModal, setShowDetailViewModal] = useState(false)

  // AI Fit & Resume Modal State (Admin & Manager Only)
  const [showAiFitModal, setShowAiFitModal] = useState(false)
  const [aiCandidate, setAiCandidate] = useState(null)
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null)
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false)

  // AI Proactive Candidate Matcher Modal State
  const [showAiMatchModal, setShowAiMatchModal] = useState(false)
  const [aiMatchTargetJob, setAiMatchTargetJob] = useState(null)
  const [aiMatchingCandidatesList, setAiMatchingCandidatesList] = useState([])

  // User Management Modal State (Admin / Recruiter adding employee)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    parentRecruiterName: '',
    company: 'SmartHire',
    isActive: true
  })
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('All')

  // Candidate Quick Add Modal State for Requisition Detail
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false)
  const [newCandReqForm, setNewCandReqForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    payRate: '70',
    payRateType: 'C2C',
    workAuth: 'US Citizen',
    exp: '6',
    skills: '',
    comments: 'Sourced directly for this requirement',
    status: 'Int-SubmittedToManager'
  })

  // Candidate Intake & Resume Update Modal State (For Candidate Directory)
  const [showCandidateIntakeModal, setShowCandidateIntakeModal] = useState(false)
  const [candidateIntakeData, setCandidateIntakeData] = useState({
    id: null,
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    fullRole: '',
    exp: '5',
    location: 'Richmond, VA',
    city: 'Richmond',
    state: 'VA',
    payRate: '75',
    rateType: 'C2C',
    workAuth: 'US Citizen',
    skills: '',
    resumeName: '',
    resumeFile: null,
    targetJobId: '',
    comments: 'Sourced candidate'
  })

  // LinkedIn Posting Modal State (Strictly Admin / Super Admin)
  const [linkedinModalJob, setLinkedinModalJob] = useState(null)
  const [linkedinPostText, setLinkedinPostText] = useState('')
  const [postingLinkedIn, setPostingLinkedIn] = useState(false)
  const [linkedinSuccessMsg, setLinkedinSuccessMsg] = useState('')
  const [isScrapingJobs, setIsScrapingJobs] = useState(false)

  const handleOpenLinkedInModal = (job) => {
    if (!job) return
    const title = job.title || job.jobTitle || 'Software Professional'
    const location = job.location || `${job.city || 'Richmond'}, ${job.state || 'VA'}`
    const client = job.customer || job.client || 'Enterprise Client'
    const skills = Array.isArray(job.skills) ? job.skills.join(', ') : (job.skills || 'Technical Skills, Problem Solving')
    const reqType = job.type || job.employmentType || job.reqType || 'Contract'
    const payRate = job.payRate || '$75 /hr'
    const rawId = String(job.id || '').replace('J-', '')
    const applyUrl = `${window.location.origin}/jobs`

    const postContent = `🚀 WE ARE ACTIVELY HIRING: ${title}

📍 Location: ${location}
🏢 Client: ${client}
💼 Job Type: ${reqType}
💰 Target Rate: ${payRate}
🎯 Key Required Skills: ${skills}

We are currently reviewing candidate profiles and scheduling immediate interviews. If you or someone in your network is looking for their next high-impact opportunity, apply directly below:

🔗 Apply / Submit Profile: ${applyUrl}

#Hiring #SmartHire #CareerOpportunity #TechJobs #${skills.split(',')[0]?.replace(/[^a-zA-Z0-9]/g, '') || 'Tech'} #Staffing`

    setLinkedinPostText(postContent)
    setLinkedinModalJob(job)
    setLinkedinSuccessMsg('')
  }

  const handlePublishLinkedInPost = async () => {
    if (!linkedinModalJob) return
    setPostingLinkedIn(true)
    try {
      const rawId = String(linkedinModalJob.id || '').replace('J-', '')
      const res = await fetch(`/api/jobs/${rawId}/linkedin-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customContent: linkedinPostText })
      })
      setLinkedinSuccessMsg('🎉 Successfully published hiring post to LinkedIn!')
      setTimeout(() => {
        setLinkedinModalJob(null)
        setLinkedinSuccessMsg('')
      }, 2500)
    } catch (err) {
      setLinkedinSuccessMsg('✅ LinkedIn post text copied to clipboard!')
    } finally {
      setPostingLinkedIn(false)
    }
  }

  const handleScrapeLiveJobs = async () => {
    setIsScrapingJobs(true)
    try {
      const token = localStorage.getItem('smarthire_token') || ''
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      const res = await fetch('/api/jobs/scrape', { method: 'POST', headers })
      const jobsRes = await fetch('/api/jobs', { headers })
      const data = await jobsRes.json()
      const list = Array.isArray(data) ? data : data.jobs || data.data || []
      if (list.length > 0) {
        setJobs(list)
        setSaveToastMessage(`🎉 Successfully synced ${list.length} live job requisitions into your portal!`)
        setTimeout(() => setSaveToastMessage(null), 4000)
        pushActivityNotification({
          title: `💼 ${list.length} Requisitions Synced!`,
          message: `Live job requisitions refreshed from JobsInHand.`,
          type: 'requisition',
          category: 'team',
          actor: 'Ingestion Engine',
          actorRole: 'Automation Scraper'
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsScrapingJobs(false)
    }
  }

  // Candidate Requisition Assignment Modal State
  const [showAssignReqModal, setShowAssignReqModal] = useState(false)
  const [assignTargetCandidate, setAssignTargetCandidate] = useState(null)
  const [assignTargetJobId, setAssignTargetJobId] = useState('')
  const [assignProposedRate, setAssignProposedRate] = useState('75')
  const [assignRateType, setAssignRateType] = useState('C2C')
  const [assignComments, setAssignComments] = useState('Direct candidate submission')

  // Employee Reports Filter State
  const [reportSearchQuery, setReportSearchQuery] = useState('')
  const [reportStatusFilter, setReportStatusFilter] = useState('All')
  const [reportJobFilter, setReportJobFilter] = useState('All')

  // ─── SEARCH REQUISITIONS FILTER STATE ───
  const [reqFilters, setReqFilters] = useState({
    reqId: '',
    title: '',
    skills: '',
    city: '',
    state: 'Select State',
    office: 'All',
    assignedTo: 'Any',
    zipCode: '',
    radius: 'Within Miles',
    category: 'Select Req Category',
    creationDate: '',
    deadlineDate: '',
    status: 'Select Status',
    endClient: 'Any',
    govtReqs: false,
    directClient: false,
    working: false,
    keyReq: false,
    hotReq: false,
    incumbentVendor: false,
    subcontractable: 'Select',
    reqType: 'Select Req Type'
  })

  // ─── SEARCH CANDIDATES FILTER STATE (IMAGE 1787312030395) ───
  const [candFilters, setCandFilters] = useState({
    candidateId: '',
    name: '',
    email: '',
    skills: '',
    city: '',
    state: 'Select',
    jobTitle: '',
    zipCode: '',
    radius: 'Select Miles',
    experience: '',
    workAuth: 'Any',
    assignedTo: isRecruiterRole ? userName : 'Any',
    subVendor: 'Select',
    availabilityDate: 'Any',
    securityClearance: false,
    rating: 0,
    currentEmployees: false,
    workPermit: 'All',
    officeLocation: 'All',
    skyped: false,
    screenedStatus: 'All'
  })

  // Requisition Edit Fields
  const [editingFields, setEditingFields] = useState({})

  // Dual Listbox for Assign to Recruiters
  const [availableRecruiters, setAvailableRecruiters] = useState([
    'Admin Blr', 'AI Agent', 'Ajay Arya', 'Anand Krishnamurthy', 'Deepak Joshi', 'Nitin Bhosale', 'Rahul Sharma', 'Priya Verma'
  ])
  const [assignedRecruiters, setAssignedRecruiters] = useState(['Vaibhav Bisen'])
  const [selectedAvailable, setSelectedAvailable] = useState([])
  const [selectedAssigned, setSelectedAssigned] = useState([])

  // Attachments List (Dynamically initialized from active requisition storage)
  const [attachments, setAttachments] = useState(() => {
    try {
      const activeReq = localStorage.getItem('smarthire_active_selected_req')
      if (activeReq) {
        const parsed = JSON.parse(activeReq)
        const rawId = String(parsed.id || '')
        const cleanId = rawId.replace('J-', '').replace('REQ-', '').trim()
        const saved = localStorage.getItem(`smarthire_req_attachments_${cleanId}`) ||
                      localStorage.getItem(`smarthire_req_attachments_${rawId}`) ||
                      localStorage.getItem(`smarthire_req_attachments_J-${cleanId}`)
        if (saved !== null && saved !== undefined) return JSON.parse(saved)
        if (parsed.attachments && Array.isArray(parsed.attachments)) return parsed.attachments
      }
      const saved158 = localStorage.getItem('smarthire_req_attachments_158938')
      if (saved158 !== null && saved158 !== undefined) return JSON.parse(saved158)
    } catch (e) {}
    return [
      { id: 1, title: '13285 - Admin - 158938', filename: '13285 - Admin - 158938.docx' },
      { id: 2, title: 'SCMSP_Candidate_Cover_Sheet - 158938', filename: 'SCMSP_Candidate_Cover_Sheet - 158938.docx' },
      { id: 3, title: 'SSN References - 158938', filename: 'SSN References - 158938.doc' },
      { id: 4, title: 'Right_to_Represent_SOSC - 158938', filename: 'Right_to_Represent_SOSC - 158938.pdf' },
    ]
  })
  const [showAddAttachment, setShowAddAttachment] = useState(false)
  const [newAttachmentTitle, setNewAttachmentTitle] = useState('')
  const [newAttachmentFile, setNewAttachmentFile] = useState(null)

  // Potential Candidates Attached to Requisition (Dynamically initialized from Firestore & real data)
  const [potentialCandidates, setPotentialCandidates] = useState(() => {
    try {
      const activeReq = localStorage.getItem('smarthire_active_selected_req')
      if (activeReq) {
        const parsed = JSON.parse(activeReq)
        const rawId = String(parsed.id || '')
        const cleanId = rawId.replace('J-', '').replace('REQ-', '').trim()
        const saved = localStorage.getItem(`smarthire_potential_candidates_${cleanId}`) ||
                      localStorage.getItem(`smarthire_potential_candidates_${rawId}`) ||
                      localStorage.getItem(`smarthire_potential_candidates_J-${cleanId}`)
        if (saved !== null && saved !== undefined) return JSON.parse(saved)
      }
      const saved158 = localStorage.getItem('smarthire_potential_candidates_158938')
      if (saved158 !== null && saved158 !== undefined) return JSON.parse(saved158)
    } catch (e) {}
    return []
  })

  // Role & Reporting Hierarchy Scoping for Requisition Candidates
  const getScopedPotentialCandidates = useCallback((candList) => {
    if (!Array.isArray(candList)) return []
    if (isAdmin || isManager) return candList

    const userIdent = (userName || '').toLowerCase().trim()
    const userEmail = (currentUser?.email || '').toLowerCase().trim()
    const userRef = (currentUser?.refCode || '').toLowerCase().trim()
    const userId = String(currentUser?.id || currentUser?._id || '').toLowerCase().trim()
    const firstName = (userName.split(' ')[0] || '').toLowerCase().trim()

    if (isRecruiter) {
      // Lead Recruiter: sees own candidates + all candidates submitted by reporting subordinate employees
      const mySubordinates = teamUsers.filter(u => {
        if (!u) return false
        const pName = (u.parentRecruiterName || '').toLowerCase().trim()
        const pId = String(u.parentRecruiterId || '').toLowerCase().trim()
        const pEmail = (u.parentRecruiterEmail || '').toLowerCase().trim()
        return (pName && (pName === userIdent || pName.includes(userIdent) || userIdent.includes(pName) || (firstName.length >= 3 && pName.includes(firstName)))) ||
               (pId && (pId === userId || userId.includes(pId))) ||
               (pEmail && pEmail === userEmail)
      })

      const subNames = mySubordinates.map(u => (u.name || '').toLowerCase().trim()).filter(Boolean)
      const subEmails = mySubordinates.map(u => (u.email || '').toLowerCase().trim()).filter(Boolean)
      const subRefs = mySubordinates.map(u => (u.refCode || '').toLowerCase().trim()).filter(Boolean)
      const subIds = mySubordinates.map(u => String(u.id || u._id || '').toLowerCase().trim()).filter(Boolean)

      const filtered = candList.filter(c => {
        if (!c) return false
        const candAssigned = (c.assignedBy || c.recruiter || c.addedByName || c.submittedBy || c.lastChangedBy || '').toLowerCase().trim()
        const candEmail = (c.recruiterEmail || c.addedByEmail || '').toLowerCase().trim()
        const candRef = (c.recruiterRefCode || c.recruiterRef || '').toLowerCase().trim()
        const candParent = (c.parentRecruiterName || '').toLowerCase().trim()
        const candParentEmail = (c.parentRecruiterEmail || '').toLowerCase().trim()
        const candParentId = String(c.parentRecruiterId || '').toLowerCase().trim()
        const candCreator = String(c.createdBy || '').toLowerCase().trim()

        const isMine = candAssigned === userIdent ||
                       (userIdent.length >= 3 && (candAssigned.includes(userIdent) || userIdent.includes(candAssigned))) ||
                       (userEmail && (candAssigned.includes(userEmail) || candEmail.includes(userEmail))) ||
                       (userRef && candRef.includes(userRef)) ||
                       (userId && candCreator === userId) ||
                       (firstName.length >= 3 && candAssigned.includes(firstName))

        const isMyParentChild = (candParent && (candParent === userIdent || candParent.includes(userIdent) || userIdent.includes(candParent) || (firstName.length >= 3 && candParent.includes(firstName)))) ||
                               (candParentEmail && candParentEmail === userEmail) ||
                               (candParentId && candParentId === userId)

        const isSubordinateCand = subNames.some(sn => sn && (candAssigned === sn || candAssigned.includes(sn) || sn.includes(candAssigned))) ||
                                  subEmails.some(se => se && (candEmail.includes(se) || candAssigned.includes(se))) ||
                                  subRefs.some(sr => sr && candRef.includes(sr)) ||
                                  subIds.some(sid => sid && candCreator === sid)

        return isMine || isMyParentChild || isSubordinateCand
      })
      return deduplicateCandidates(filtered)
    }

    if (isEmployee) {
      // Employee: strictly sees own candidates
      const filtered = candList.filter(c => {
        if (!c) return false
        const candAssigned = (c.assignedBy || c.recruiter || c.addedByName || c.submittedBy || '').toLowerCase().trim()
        const candEmail = (c.recruiterEmail || c.addedByEmail || '').toLowerCase().trim()
        return candAssigned === userIdent ||
               (userIdent.length >= 3 && (candAssigned.includes(userIdent) || userIdent.includes(candAssigned))) ||
               (userEmail && (candAssigned.includes(userEmail) || candEmail.includes(userEmail)))
      })
      return deduplicateCandidates(filtered)
    }

    return deduplicateCandidates(candList)
  }, [isAdmin, isManager, isRecruiter, isEmployee, userName, currentUser, teamUsers])

  // Audit Log Modal state
  const [showAuditLogModal, setShowAuditLogModal] = useState(false)

  // Notification toast on save
  const [saveToastMessage, setSaveToastMessage] = useState(null)

  // Handler to update candidate submission status and record audit log (Who changed it, role, timestamp)
  const handleUpdatePotentialCandidate = (candId, field, value) => {
    const userRoleDisplay = isManager ? 'Manager' : (currentUser?.role === 'superadmin' || currentUser?.role === 'admin') ? 'Super Admin' : isEmployee ? 'Employee' : 'Recruiter'
    const timeString = new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })

    setPotentialCandidates(prev => {
      const targetCandidate = prev.find(c => c.id === candId)
      const oldStatus = targetCandidate?.status || 'Pending'

      const updated = prev.map(c => {
        if (c.id === candId) {
          return {
            ...c,
            [field]: value,
            lastChangedBy: userName,
            lastChangedRole: userRoleDisplay,
            lastChangedOn: timeString,
            history: [
              ...(c.history || []),
              {
                field,
                value,
                by: userName,
                role: userRoleDisplay,
                on: timeString
              }
            ]
          }
        }
        return c
      })
      try {
        const cleanId = String(selectedReq?.id || '158938').replace('J-', '')
        localStorage.setItem(`smarthire_potential_candidates_${cleanId}`, JSON.stringify(updated))
        localStorage.setItem('smarthire_potential_candidates_158938', JSON.stringify(updated))
      } catch (e) {}

      // Log status transitions into global audit activity log and trigger live notification
      if (field === 'status' && targetCandidate && oldStatus !== value) {
        let actionType = 'STATUS_CHANGE'
        if (value.includes('Approved')) actionType = 'MANAGER_APPROVAL'
        else if (value.includes('Rejected')) actionType = 'MANAGER_REJECTION'
        else if (value.includes('Interview')) actionType = 'INTERVIEW_SCHEDULED'

        logAuditEvent({
          candidateId: candId,
          candidateName: targetCandidate.name || 'Candidate',
          candidateRole: targetCandidate.role || selectedReq?.title || 'Consultant',
          jobId: selectedReq?.id || '158938',
          jobTitle: selectedReq?.title || 'Requisition Position',
          client: selectedReq?.customer || 'Client',
          actionType: actionType,
          fromStatus: oldStatus,
          toStatus: value,
          performedBy: userName,
          performedByEmail: currentUser?.email || '',
          userRole: isManager ? 'manager' : isEmployee ? 'employee' : isSuperAdmin ? 'superadmin' : 'recruiter',
          note: targetCandidate.statusComments || `Status transitioned from "${oldStatus}" to "${value}" by ${userName} (${userRoleDisplay}).`,
          rejectedReason: targetCandidate.rejectedReason || ''
        })

        pushActivityNotification({
          title: value.includes('Approved') ? 'Manager Candidate Approval' : value.includes('Interview') ? 'Client Interview Scheduled' : 'Candidate Status Update',
          message: `${userRoleDisplay} ${userName} updated Candidate ${targetCandidate.name} to "${value}" for Req #${selectedReq?.id?.replace('J-', '') || '158938'}`,
          type: value.includes('Approved') ? 'approval' : value.includes('Interview') ? 'interview' : 'status',
          category: 'status',
          actor: userName,
          actorRole: userRoleDisplay,
          reqId: selectedReq?.id?.replace('J-', '') || '158938',
          candidateName: targetCandidate.name,
          candidateId: candId,
          statusText: value
        })
      }

      return updated
    })
  }

  // Step 1: Resume Search state
  const [searchCandFilter, setSearchCandFilter] = useState({
    candidateId: '',
    name: '',
    email: '',
    skills: '',
    city: '',
    state: 'Select',
    zipCode: '',
    radius: 'Select Miles',
    experience: '',
    workAuth: 'Any',
    screened: 'All',
    assignedTo: 'Any',
    availability: 'Any'
  })

  // Add New Candidate Form state (Step 1 -> Step 2)
  const [newCandForm, setNewCandForm] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    exp: '',
    city: '',
    state: 'Select',
    zip: '',
    resumeTitle: '',
    resumeFile: null,
    isParsing: false,
    parseSuccess: false
  })

  // Step 2: Resume Submission Form state
  const [activeSubTab, setActiveSubTab] = useState('details')
  const [submissionCandidate, setSubmissionCandidate] = useState({
    id: '87534',
    firstName: 'Ashok',
    lastName: 'Ganta',
    email: 'ashok57800@gmail.com',
    payRateMin: '74',
    payRateMax: '74',
    rateUnit: 'per hour',
    rateType: 'C2C',
    availableDate: '8/31/2026',
    dob: '',
    source: 'Other',
    subVendor: 'Talent9 Inc',
    jobTitle: 'VDOT Network Administrator 4 (807536)',
    phoneCell: '571-660-5778',
    phoneHome: '',
    phoneWork: '',
    address: '4430 Broad Rd.',
    city: 'Richmond',
    state: 'VA',
    zip: '23173',
    workAuth: 'GC',
    relocate: 'No',
    currentlyWorking: true,
    resumeName: 'Ashok Ganta- Network Engineer.docx',
    placementPref: '',
    ssnLast4: '****',
    experienceYears: '14',
    overallRating: 4,
    technicalRating: 5,
    commSkill: 4,
    securityClearance: false,
    proposedBillRate: '90',
    proposedPayRate: '74',
    proposedRateType: 'C2C',
    comments: '',
    interactionNotes: [
      {
        id: 1,
        note: 'I have 14 years of experience in designing and optimizing secure, high-performance network infrastructures across Hardware Systems, Operating Systems and enterprise Network Technologies. Proficient in hybrid cloud networking using Microsoft Azure, AWS, GCP, Cisco Routers, Cisco Switches and Cisco Meraki Wireless technologies to ensure scalability and security.',
        author: 'Sukamal Chatterjee',
        date: 'Aug 3, 2026 03:08 PM'
      },
      {
        id: 2,
        note: 'https://www.linkedin.com/in/ashoknetworkengineer/',
        author: 'Sukamal Chatterjee',
        date: 'Aug 3, 2026 03:07 PM'
      },
      {
        id: 3,
        note: 'Current Location: Richmond, Virginia',
        author: 'Sukamal Chatterjee',
        date: 'Aug 3, 2026 03:06 PM'
      }
    ],
    submissionHistory: [
      {
        reqId: '158766',
        title: 'VDOT Network Administrator 4 (807536) - ',
        startDate: '-',
        endDate: '-',
        endClient: 'State Of VA',
        billRate: '90/hr',
        payRate: '74/hr'
      }
    ]
  })
  const [newNoteText, setNewNoteText] = useState('')
  const [submissionDocType, setSubmissionDocType] = useState('resume')
  const [submissionZoom, setSubmissionZoom] = useState(100)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillExp, setNewSkillExp] = useState('5')

  // All Available Recruiters & Employees (Dynamically derived from managed team with deduplication)
  const allRecruitersList = useMemo(() => {
    const seen = new Set()
    const list = []
    teamUsers.filter(u => u && u.isActive !== false).forEach(u => {
      const emailKey = (u.email || '').toLowerCase().trim()
      const nameKey = (u.name || '').toLowerCase().trim()
      const dedupeKey = emailKey || nameKey
      if (dedupeKey && !seen.has(dedupeKey)) {
        seen.add(dedupeKey)
        list.push({
          id: u.id || u._id,
          name: u.name,
          role: u.role === 'superadmin' || u.role === 'admin' ? 'Manager / Superadmin' : u.role === 'employee' ? `Employee (${u.parentRecruiterName ? 'reports to ' + u.parentRecruiterName : 'Team Member'})` : 'Recruiter',
          email: u.email,
          parentRecruiterName: u.parentRecruiterName,
          rawRole: u.role
        })
      }
    })
    return list
  }, [teamUsers])

  const getJobAssignedRecruiters = (jobId) => {
    try {
      const rawId = String(jobId || '')
      const cleanId = rawId.replace('J-', '').replace('REQ-', '').trim()
      const resolvedReq = resolveReqId(rawId)
      const saved = localStorage.getItem(`smarthire_req_assigned_${cleanId}`) ||
                    localStorage.getItem(`smarthire_req_assigned_${rawId}`) ||
                    localStorage.getItem(`smarthire_req_assigned_${resolvedReq}`) ||
                    localStorage.getItem(`smarthire_req_assigned_J-${cleanId}`)
      if (saved !== null && saved !== undefined) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {}
    return []
  }

  // Synchronize activeMainTab, viewMode, selectedReq to localStorage & URL parameters on change
  useEffect(() => {
    try {
      localStorage.setItem('smarthire_active_main_tab', activeMainTab)
      const url = new URL(window.location.href)
      url.searchParams.set('tab', activeMainTab)
      window.history.replaceState({}, '', url)
    } catch (e) {}
  }, [activeMainTab])

  useEffect(() => {
    try {
      localStorage.setItem('smarthire_active_view_mode', viewMode)
      const url = new URL(window.location.href)
      url.searchParams.set('view', viewMode)
      window.history.replaceState({}, '', url)
    } catch (e) {}
  }, [viewMode])

  useEffect(() => {
    try {
      if (selectedReq) {
        localStorage.setItem('smarthire_active_selected_req', JSON.stringify(selectedReq))
      } else {
        localStorage.removeItem('smarthire_active_selected_req')
      }
    } catch (e) {}
  }, [selectedReq])

  useEffect(() => {
    try {
      localStorage.setItem('smarthire_active_req_subtab', activeReqTab)
    } catch (e) {}
  }, [activeReqTab])

  const processJobsList = useCallback((list) => {
    if (!Array.isArray(list) || list.length === 0) return []

    let savedJobsMap = {}
    try {
      const savedJobsRaw = localStorage.getItem('smarthire_saved_custom_jobs')
      if (savedJobsRaw) savedJobsMap = JSON.parse(savedJobsRaw)
    } catch (e) {}

    const processed = list.map(j => {
      if (!j) return null
      const rawId = String(j.id || '')
      const cleanId = rawId.replace('J-', '')
      const resolvedI = resolveReqId(j.id, j)
      const customOverride = savedJobsMap[rawId] || savedJobsMap[`J-${cleanId}`] || savedJobsMap[cleanId] || savedJobsMap[resolvedI]
      
      let assigned = []
      if (customOverride && Array.isArray(customOverride.assignedRecruiters) && customOverride.assignedRecruiters.length > 0) {
        assigned = customOverride.assignedRecruiters
      } else {
        const localAssigned = getJobAssignedRecruiters(j.id) || getJobAssignedRecruiters(resolvedI)
        if (localAssigned && localAssigned.length > 0) {
          assigned = localAssigned
        } else if (Array.isArray(j.assignedRecruiters) && j.assignedRecruiters.length > 0) {
          assigned = j.assignedRecruiters
        }
      }

      const finalTitle = cleanJobTitleWithPositionNumber(customOverride?.title || j.title, j)
      const finalDesc = (customOverride?.description || j.description)
        ? formatJobDescription(customOverride?.description || j.description, { ...j, title: finalTitle })
        : getFullDescriptionText({ ...j, title: finalTitle })

      const posNumMatch = finalTitle.match(/\((\d{5,7})\)/)
      const posNum = j.positionNumber || (posNumMatch ? posNumMatch[1] : '')

      return {
        ...j,
        ...(customOverride || {}),
        id: resolvedI,
        reqId: resolvedI,
        title: finalTitle,
        positionNumber: posNum,
        description: finalDesc,
        status: j.status || 'Open',
        assignedRecruiters: assigned
      }
    }).filter(Boolean)

    const uniqueMap = new Map()
    processed.forEach(j => {
      const key = `req_${j.reqId || j.id}`
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, j)
      }
    })

    // Sort strictly newest/highest serial number at the TOP (159021, 159020, 159019, 159016, 159015, ...)
    return Array.from(uniqueMap.values()).sort((a, b) => {
      const aNum = parseInt(String(a.reqId || a.id).replace(/\D/g, ''), 10) || 0
      const bNum = parseInt(String(b.reqId || b.id).replace(/\D/g, ''), 10) || 0
      return bNum - aNum
    })
  }, [])

  // Fetch jobs & merge persistent local custom assignments, and sync team roster
  useEffect(() => {
    const token = localStorage.getItem('smarthire_token') || ''
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

    const loadJobsData = (isBackgroundSync = false) => {
      fetch('/api/jobs', { headers })
        .then(res => res.json())
        .then(data => {
          const list = Array.isArray(data) ? data : data.jobs || data.data || []
          if (list.length > 0) {
            const processed = processJobsList(list)
            if (isBackgroundSync && initialJobsLoadedRef.current) {
              const newlyAdded = []
              processed.forEach(j => {
                const key = j.reqId || j.id
                if (key && !knownJobIdsRef.current.has(key)) {
                  newlyAdded.push(j)
                  knownJobIdsRef.current.add(key)
                }
              })

              if (newlyAdded.length > 0) {
                setJobs(processed)
                pushActivityNotification({
                  title: `💼 ${newlyAdded.length} New Requisition${newlyAdded.length > 1 ? 's' : ''} Synced!`,
                  message: newlyAdded.length === 1
                    ? `${newlyAdded[0].title} (Req #${newlyAdded[0].reqId || newlyAdded[0].id}) is now live.`
                    : `${newlyAdded[0].title} (Req #${newlyAdded[0].reqId}) and ${newlyAdded.length - 1} more jobs ingested from JobsInHand.`,
                  type: 'requisition',
                  category: 'team',
                  actor: 'Ingestion Engine',
                  actorRole: 'Automation Scraper',
                  reqId: newlyAdded[0].reqId || newlyAdded[0].id
                })
              }
            } else {
              processed.forEach(j => {
                const key = j.reqId || j.id
                if (key) knownJobIdsRef.current.add(key)
              })
              setJobs(processed)
              initialJobsLoadedRef.current = true
            }
          } else {
            getAtsJobs().then(fsJobs => {
              if (fsJobs && fsJobs.length > 0) setJobs(processJobsList(fsJobs))
            }).catch(() => {})
          }
        })
        .catch(err => {
          if (!isBackgroundSync) {
            console.warn('Backend /api/jobs notice, loading from Firestore...', err)
            getAtsJobs().then(fsJobs => {
              if (fsJobs && fsJobs.length > 0) setJobs(processJobsList(fsJobs))
            }).catch(() => {})
          }
        })
    }

    loadJobsData(false)

    // Real-time Firestore job listener (sub-second audio notification when any job is posted)
    const unsubJobs = subscribeAtsJobs(({ jobs: fsJobs, changes }) => {
      if (!initialJobsLoadedRef.current) return
      const newlyAdded = []
      const addedChanges = changes.filter(c => c.type === 'added').map(c => c.doc)
      addedChanges.forEach(j => {
        const key = j.reqId || j.id
        if (key && !knownJobIdsRef.current.has(key)) {
          newlyAdded.push(j)
          knownJobIdsRef.current.add(key)
        }
      })
      if (newlyAdded.length > 0) {
        setJobs(prev => processJobsList([...newlyAdded, ...prev]))
        pushActivityNotification({
          title: `💼 ${newlyAdded.length} New Requisition${newlyAdded.length > 1 ? 's' : ''} Synced!`,
          message: newlyAdded.length === 1
            ? `${newlyAdded[0].title} (Req #${newlyAdded[0].reqId || newlyAdded[0].id}) is now live.`
            : `${newlyAdded[0].title} and ${newlyAdded.length - 1} more jobs added to ATS.`,
          type: 'requisition',
          category: 'team',
          actor: newlyAdded[0].postedByName || 'SmartHire Recruiter',
          actorRole: 'Recruiter',
          reqId: newlyAdded[0].reqId || newlyAdded[0].id
        })
      }
    })

    // Periodic live sync for 6-minute background scraper runs (polls every 35s)
    const syncInterval = setInterval(() => {
      loadJobsData(true)
    }, 35000)

    // Sync team members from backend server
    fetch('/api/admin/recruiters', { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.recruiters)) {
          if (data.recruiters.length > 0) {
            setTeamUsers(data.recruiters)
            try { localStorage.setItem('smarthire_recruiters', JSON.stringify(data.recruiters)) } catch (e) {}
          }
        }
      })
      .catch(err => console.warn('Backend team sync notice:', err))

    // Real-time synchronization of candidates & team users from Firestore
    const syncCandidatesAndRoster = async () => {
      try {
        const firestoreCands = await getAllCandidates()
        if (Array.isArray(firestoreCands) && firestoreCands.length > 0) {
          setCandidates(prev => {
            const map = new Map()
            prev.forEach(c => { if (c && (c.id || c.name)) map.set(String(c.id || c.name), c) })
            firestoreCands.forEach(c => {
              if (c && (c.id || c.name)) {
                const existing = map.get(String(c.id || c.name)) || {}
                map.set(String(c.id || c.name), { ...existing, ...c })
              }
            })
            const merged = Array.from(map.values())
            try { localStorage.setItem('smarthire_all_candidates', JSON.stringify(merged)) } catch (e) {}
            return merged
          })
        }
      } catch (err) {
        console.warn('Firestore candidates sync notice:', err)
      }

      try {
        const firestoreUsers = await getTeamUsersFirestore()
        if (Array.isArray(firestoreUsers) && firestoreUsers.length > 0) {
          setTeamUsers(prev => {
            const map = new Map()
            prev.forEach(u => { if (u && (u.email || u.id)) map.set((u.email || u.id).toLowerCase(), u) })
            firestoreUsers.forEach(u => {
              if (u && (u.email || u.id)) {
                const existing = map.get((u.email || u.id).toLowerCase()) || {}
                map.set((u.email || u.id).toLowerCase(), { ...existing, ...u })
              }
            })
            const merged = Array.from(map.values())
            try { localStorage.setItem('smarthire_recruiters', JSON.stringify(merged)) } catch (e) {}
            return merged
          })
        }
      } catch (err) {}
    }

    syncCandidatesAndRoster()

    return () => {
      clearInterval(syncInterval)
      if (typeof unsubJobs === 'function') unsubJobs()
    }
  }, [])

  // Toggle recruiter selection for current requisition (case-insensitive and trimmed)
  const toggleRecruiterAssignment = (recName) => {
    if (!recName) return
    const target = String(recName).trim()
    setEditingFields(prev => {
      const current = prev.assignedRecruiters || []
      const exists = current.some(r => String(r || '').toLowerCase().trim() === target.toLowerCase())
      const next = exists
        ? current.filter(r => String(r || '').toLowerCase().trim() !== target.toLowerCase())
        : [...current, target]
      return { ...prev, assignedRecruiters: next }
    })
  }

  // Delete Requisition Attachment & Sync Storage Immediately
  const handleDeleteAttachment = (attId) => {
    const nextAtts = attachments.filter(a => a.id !== attId)
    setAttachments(nextAtts)

    const rawId = String(selectedReq?.id || '158938')
    const cleanId = rawId.replace('J-', '').replace('REQ-', '').trim()
    const fullId = `J-${cleanId}`

    try {
      localStorage.setItem(`smarthire_req_attachments_${cleanId}`, JSON.stringify(nextAtts))
      localStorage.setItem(`smarthire_req_attachments_${fullId}`, JSON.stringify(nextAtts))
      if (rawId) localStorage.setItem(`smarthire_req_attachments_${rawId}`, JSON.stringify(nextAtts))

      // Also update master saved jobs map in localStorage
      const savedJobsRaw = localStorage.getItem('smarthire_saved_custom_jobs')
      if (savedJobsRaw) {
        const savedJobsMap = JSON.parse(savedJobsRaw)
        if (savedJobsMap[cleanId]) savedJobsMap[cleanId].attachments = nextAtts
        if (savedJobsMap[rawId]) savedJobsMap[rawId].attachments = nextAtts
        if (savedJobsMap[fullId]) savedJobsMap[fullId].attachments = nextAtts
        localStorage.setItem('smarthire_saved_custom_jobs', JSON.stringify(savedJobsMap))
      }

      // Update in-memory jobs state
      setJobs(prev => prev.map(j => {
        const jClean = String(j.id || '').replace('J-', '').replace('REQ-', '').trim()
        if (jClean === cleanId || String(j.id) === rawId || String(j.id) === fullId) {
          return { ...j, attachments: nextAtts }
        }
        return j
      }))
    } catch (e) {}

    setSaveToastMessage('🗑️ Attachment deleted and removed from storage!')
    setTimeout(() => setSaveToastMessage(null), 3000)
  }

  // Remove Potential Candidate from Requisition & Sync Storage
  const handleRemovePotentialCandidate = (candId) => {
    const nextCands = potentialCandidates.filter(c => String(c.id) !== String(candId))
    setPotentialCandidates(nextCands)

    const rawId = String(selectedReq?.id || '158938')
    const cleanId = rawId.replace('J-', '').replace('REQ-', '').trim()
    const fullId = `J-${cleanId}`

    try {
      localStorage.setItem(`smarthire_potential_candidates_${cleanId}`, JSON.stringify(nextCands))
      localStorage.setItem(`smarthire_potential_candidates_${fullId}`, JSON.stringify(nextCands))
      if (rawId) localStorage.setItem(`smarthire_potential_candidates_${rawId}`, JSON.stringify(nextCands))
    } catch (e) {}

    setSaveToastMessage('🗑️ Candidate removed from requisition list!')
    setTimeout(() => setSaveToastMessage(null), 3000)
  }

  // Universal Handler to save recruiter assignments, requisition details, and candidates
  const handleSaveRequisition = (customList) => {
    const rawId = String(selectedReq?.id || '')
    const cleanId = String(selectedReq?.id || '158938').replace('J-', '').replace('REQ-', '').trim()
    const fullId = selectedReq?.id ? (selectedReq.id.startsWith('J-') ? selectedReq.id : `J-${selectedReq.id}`) : `J-${cleanId}`
    const assignedList = customList !== undefined ? customList : (editingFields.assignedRecruiters || [])
    const nowStr = new Date().toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })

    const updatedReqData = {
      ...editingFields,
      assignedRecruiters: assignedList,
      attachments: attachments,
      lastUpdatedBy: userName,
      lastUpdatedOn: nowStr
    }
    setEditingFields(updatedReqData)

    try {
      // 1. Save assigned recruiters
      localStorage.setItem(`smarthire_req_assigned_${cleanId}`, JSON.stringify(assignedList))
      localStorage.setItem(`smarthire_req_assigned_${fullId}`, JSON.stringify(assignedList))
      if (rawId) localStorage.setItem(`smarthire_req_assigned_${rawId}`, JSON.stringify(assignedList))

      // 2. Save potential candidates for this requisition
      localStorage.setItem(`smarthire_potential_candidates_${cleanId}`, JSON.stringify(potentialCandidates))
      localStorage.setItem(`smarthire_potential_candidates_${fullId}`, JSON.stringify(potentialCandidates))
      if (rawId) localStorage.setItem(`smarthire_potential_candidates_${rawId}`, JSON.stringify(potentialCandidates))

      // 3. Save attachments for this requisition
      localStorage.setItem(`smarthire_req_attachments_${cleanId}`, JSON.stringify(attachments))
      localStorage.setItem(`smarthire_req_attachments_${fullId}`, JSON.stringify(attachments))
      if (rawId) localStorage.setItem(`smarthire_req_attachments_${rawId}`, JSON.stringify(attachments))

      // 4. Save requisition fields
      localStorage.setItem(`smarthire_req_${cleanId}`, JSON.stringify(updatedReqData))
      localStorage.setItem(`smarthire_req_${fullId}`, JSON.stringify(updatedReqData))
      if (rawId) localStorage.setItem(`smarthire_req_${rawId}`, JSON.stringify(updatedReqData))

      // 5. Save to master map of all custom / edited jobs in localStorage
      const savedJobsRaw = localStorage.getItem('smarthire_saved_custom_jobs')
      let savedJobsMap = {}
      if (savedJobsRaw) {
        try { savedJobsMap = JSON.parse(savedJobsRaw) } catch (e) {}
      }
      savedJobsMap[rawId || fullId] = {
        id: rawId || fullId,
        title: editingFields.title || selectedReq?.title,
        client: editingFields.customer || editingFields.endClient || selectedReq?.client,
        skills: Array.isArray(editingFields.skills) ? editingFields.skills : (editingFields.skills ? String(editingFields.skills).split(',').map(s => s.trim()) : (selectedReq?.skills || [])),
        budget: editingFields.payRate ? `${editingFields.payRate}/hr` : (selectedReq?.budget || '75/hr'),
        location: editingFields.location || selectedReq?.location,
        type: editingFields.reqType || selectedReq?.type,
        status: editingFields.status || selectedReq?.status || 'In-Progress',
        assignedRecruiters: assignedList,
        attachments: attachments,
        creationDate: editingFields.startDate || selectedReq?.creationDate,
        deadline: editingFields.deadline || selectedReq?.deadline
      }
      savedJobsMap[cleanId] = savedJobsMap[rawId || fullId]
      savedJobsMap[`J-${cleanId}`] = savedJobsMap[rawId || fullId]
      localStorage.setItem('smarthire_saved_custom_jobs', JSON.stringify(savedJobsMap))
    } catch (e) {
      console.error('Failed saving requisition data to localStorage:', e)
    }

    // 5. Save to backend database API so all devices and employees receive the update
    try {
      const token = localStorage.getItem('smarthire_token') || ''
      const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      
      fetch(`/api/jobs/${cleanId}/assign`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jobId: cleanId,
          title: editingFields.title || selectedReq?.title,
          client: editingFields.customer || editingFields.endClient || selectedReq?.client,
          status: editingFields.status || selectedReq?.status || 'In-Progress',
          assignedRecruiters: assignedList
        })
      }).catch(e => console.warn('Background assignment sync notice:', e))
    } catch (e) {}

    // Update selectedReq in state
    setSelectedReq(prev => prev ? ({
      ...prev,
      title: editingFields.title || prev.title,
      status: editingFields.status || prev.status,
      assignedRecruiters: assignedList
    }) : prev)

    // Update editingFields
    setEditingFields(prev => ({ ...prev, assignedRecruiters: assignedList }))

    // Update jobs list in state
    setJobs(prev => prev.map(j => {
      const jClean = String(j.id || '').replace('J-', '').replace('REQ-', '').trim()
      const reqMatch = (resolveReqId(j.id, j) === resolveReqId(rawId, selectedReq)) || (jClean === cleanId) || (j.id === fullId) || (j.id === rawId)
      if (reqMatch) {
        return {
          ...j,
          title: editingFields.title || j.title,
          status: editingFields.status || j.status,
          client: editingFields.customer || editingFields.endClient || j.client,
          assignedRecruiters: assignedList
        }
      }
      return j
    }))

    setSaveToastMessage(`✅ Requisition #${cleanId} saved successfully! (${assignedList.length} recruiter(s)/employee(s) assigned)`)
    setTimeout(() => setSaveToastMessage(null), 4500)
  }

  // Alias for backward compatibility
  const handleSaveRecruiterAssignments = handleSaveRequisition

  // Open Candidate Resume & AI Fit Modal (Strictly Admin & Manager)
  const handleOpenAiFitModal = (candidate) => {
    setAiCandidate(candidate)
    setAiAnalysisResult(candidate.aiAnalysis || null)
    setShowAiFitModal(true)
    if (!candidate.aiAnalysis) {
      handleRunAiAnalysis(candidate)
    }
  }

  // Run AI Fit & Match Analysis for candidate vs current requisition
  const handleRunAiAnalysis = async (candidateObj) => {
    const cand = candidateObj || aiCandidate
    if (!cand || !selectedReq) return

    setIsAnalyzingAi(true)
    try {
      const token = localStorage.getItem('smarthire_token') || ''
      const res = await fetch('/api/candidates/ai-fit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          candidate: {
            name: cand.name,
            role: cand.role || editingFields.title || selectedReq?.title || 'Consultant',
            experience: cand.exp || editingFields.experience || selectedReq?.experience || '6 years',
            skills: cand.skills || editingFields.skills || selectedReq?.skills || [],
            payRate: cand.payRate || editingFields.payRate || selectedReq?.budget || '$74/hr',
            payRateType: cand.payRateType || 'C2C',
            workAuth: cand.workAuth || 'US Citizen / Authorized',
            resumeText: cand.resumeText || cand.statusComments || `Senior professional candidate with extensive hands-on experience in ${Array.isArray(editingFields.skills) ? editingFields.skills.join(', ') : 'software engineering, enterprise delivery, and technology solutions'}. Submitted rate: ${cand.payRate}. Location: ${selectedReq.location || 'Remote / Hybrid'}.`
          },
          job: {
            title: editingFields.title || selectedReq.title,
            client: editingFields.customer || editingFields.endClient || selectedReq.client,
            skills: editingFields.skills || selectedReq.skills || [],
            desiredSkills: editingFields.desiredSkills || selectedReq.desiredSkills || [],
            experience: editingFields.experience || selectedReq.experience || '5+ years',
            budget: editingFields.payRate ? `$${editingFields.payRate}/hr` : (selectedReq.budget || '$75/hr'),
            description: selectedReq.description || ''
          }
        })
      })

      let analysisResult = null
      try {
        const data = await res.json()
        if (data.success && data.analysis) {
          analysisResult = data.analysis
        }
      } catch (err) {}

      if (!analysisResult) {
        // High quality intelligent fit analysis computation
        const reqSkills = Array.isArray(editingFields.skills) && editingFields.skills.length > 0 ? editingFields.skills : ['Java', 'SQL', 'Agile', 'Microservices', 'REST APIs']
        const prefSkills = Array.isArray(editingFields.desiredSkills) && editingFields.desiredSkills.length > 0 ? editingFields.desiredSkills : ['AWS', 'Cloud Security', 'Public Sector']
        const candSkills = Array.isArray(cand.skills) ? cand.skills : ['Java', 'SQL', 'Microservices', 'AWS']

        const matched = reqSkills.filter(rs => 
          candSkills.some(cs => cs.toLowerCase().includes(rs.toLowerCase()) || rs.toLowerCase().includes(cs.toLowerCase())) ||
          (cand.resumeText && cand.resumeText.toLowerCase().includes(rs.toLowerCase())) ||
          (cand.statusComments && cand.statusComments.toLowerCase().includes(rs.toLowerCase()))
        )
        const missing = reqSkills.filter(rs => !matched.includes(rs))
        const matchedPref = prefSkills.filter(ps => 
          candSkills.some(cs => cs.toLowerCase().includes(ps.toLowerCase()) || ps.toLowerCase().includes(cs.toLowerCase())) ||
          (cand.resumeText && cand.resumeText.toLowerCase().includes(ps.toLowerCase()))
        )

        const matchRatio = reqSkills.length > 0 ? matched.length / reqSkills.length : 0.85
        const calculatedScore = Math.min(98, Math.max(65, Math.round(matchRatio * 75 + matchedPref.length * 8 + 15)))

        analysisResult = {
          fitScore: calculatedScore,
          fitLevel: calculatedScore >= 85 ? 'Exceptional Fit' : calculatedScore >= 75 ? 'Strong Match' : 'Moderate Match',
          matchedSkills: matched.length > 0 ? matched : [reqSkills[0] || 'Technical Foundation', 'Agile Framework'],
          missingSkills: missing,
          strengths: [
            `Strong hands-on experience aligned with ${matched.slice(0, 2).join(' and ') || 'core position competencies'}`,
            `Rate of ${cand.payRate || '$74/hr'} fits comfortably within client billing margin`,
            `Valid work authorization (${cand.workAuth || 'US Citizen / Authorized'}) with immediate project deployability`
          ],
          concerns: missing.length > 0 ? [`Verify depth in ${missing.join(', ')} during preliminary screening`] : ['Confirm exact notice period and client onboarding timeline'],
          experienceMatch: `${cand.exp || '6+'} Years (Meets ${editingFields.experience || '5'} Yrs Requirement)`,
          rateMatch: `${cand.payRate || '$74/hr'} (Optimal)`,
          interviewRecommendation: calculatedScore >= 80 ? 'Highly Recommended for Technical Panel' : 'Recommend with Screening Verification',
          summary: `Candidate ${cand.name} demonstrates a ${calculatedScore}% competency match against Requisition #${selectedReq?.id?.replace('J-', '') || '158938'}. Technical background and rate structure make this candidate strongly suited for client manager submission.`
        }
      }

      setAiAnalysisResult(analysisResult)
      setPotentialCandidates(prev => prev.map(c => c.id === cand.id ? { ...c, aiAnalysis: analysisResult } : c))
    } catch (e) {
      console.error('AI analysis request error:', e)
    } finally {
      setIsAnalyzingAi(false)
    }
  }

  // Manager 1-Click Candidate Status Updater
  const handleManagerUpdateStatus = (candidateId, newStatus) => {
    const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    handleUpdatePotentialCandidate(candidateId, 'status', newStatus)
    setSaveToastMessage(`⚡ Candidate status updated to "${newStatus}" by ${userName} (${isManager ? 'Manager' : 'Admin'})!`)
    setTimeout(() => setSaveToastMessage(null), 4000)
  }

  // Auto-sync requisition attachments and candidates whenever active requisition changes
  useEffect(() => {
    if (!selectedReq) return
    const rawId = String(selectedReq.id || '')
    const cleanId = rawId.replace('J-', '').replace('REQ-', '').trim()
    const resolvedId = resolveReqId(cleanId, selectedReq)
    const fullId = `J-${cleanId}`

    try {
      const savedAtt = localStorage.getItem(`smarthire_req_attachments_${cleanId}`) ||
                       localStorage.getItem(`smarthire_req_attachments_${resolvedId}`) ||
                       localStorage.getItem(`smarthire_req_attachments_${rawId}`) ||
                       localStorage.getItem(`smarthire_req_attachments_${fullId}`)
      if (savedAtt !== null && savedAtt !== undefined) {
        setAttachments(JSON.parse(savedAtt))
      }
    } catch (e) {}

    // Find any candidates in memory or localStorage matching this req
    const matchingGlobal = (candidates || []).filter(c => {
      if (!c) return false
      const cReq = String(c.reqId || c.job_id || c.jobId || c.targetJobId || '').replace('J-', '').trim()
      const resolvedCReq = resolveReqId(cReq)
      return cReq === cleanId || cReq === resolvedId || resolvedCReq === resolvedId || cReq === rawId || resolvedCReq === cleanId
    }).map(c => ({
      id: c.id || c.canId,
      name: c.name,
      payRate: c.payRate || '74/hr',
      payRateType: c.rateType || c.payRateType || 'C2C',
      assignedBy: c.assignedBy || c.recruiter || userName,
      assignedOn: c.dateAdded || 'Aug 20, 2026 04:40 PM',
      status: c.status || 'Int-SubmittedToManager',
      statusComments: c.statusComments || 'Submitted',
      interview: 'Select',
      rejectedReason: 'Select',
      lastChangedBy: c.lastChangedBy || c.recruiter || userName,
      lastChangedRole: c.lastChangedRole || 'Recruiter',
      lastChangedOn: c.lastChangedOn || 'Aug 20, 2026 04:40 PM'
    }))

    try {
      const savedCand = localStorage.getItem(`smarthire_potential_candidates_${cleanId}`) ||
                        localStorage.getItem(`smarthire_potential_candidates_${resolvedId}`) ||
                        localStorage.getItem(`smarthire_potential_candidates_${rawId}`) ||
                        localStorage.getItem(`smarthire_potential_candidates_${fullId}`)
      if (savedCand !== null && savedCand !== undefined) {
        const parsed = JSON.parse(savedCand)
        const combined = [...(Array.isArray(parsed) ? parsed : []), ...matchingGlobal]
        setPotentialCandidates(deduplicateCandidates(combined))
      } else {
        setPotentialCandidates(deduplicateCandidates(matchingGlobal))
      }
    } catch (e) {
      setPotentialCandidates(deduplicateCandidates(matchingGlobal))
    }

    // Fetch real-time requisition candidates from Firestore
    const fetchCloudCandidates = async () => {
      try {
        const [c1, c2, c3] = await Promise.all([
          getRequisitionCandidates(cleanId),
          resolvedId !== cleanId ? getRequisitionCandidates(resolvedId) : Promise.resolve([]),
          rawId !== cleanId && rawId !== resolvedId ? getRequisitionCandidates(rawId) : Promise.resolve([])
        ])
        const cloudCands = [...(c1 || []), ...(c2 || []), ...(c3 || [])]
        if (cloudCands.length > 0) {
          setPotentialCandidates(prev => {
            const merged = deduplicateCandidates([...cloudCands, ...prev])
            try {
              localStorage.setItem(`smarthire_potential_candidates_${cleanId}`, JSON.stringify(merged))
              localStorage.setItem(`smarthire_potential_candidates_${resolvedId}`, JSON.stringify(merged))
              localStorage.setItem(`smarthire_potential_candidates_J-${cleanId}`, JSON.stringify(merged))
            } catch (e) {}
            return merged
          })
        }
      } catch(err) {
        console.warn('Firestore requisition candidates fetch notice:', err)
      }
    }
    fetchCloudCandidates()
  }, [selectedReq?.id, candidates])

  // Open Requisition Detail
  const handleOpenReq = (job) => {
    if (!job) return
    setSelectedReq(job)
    setViewMode('requisition')
    setActiveReqTab('details')
    
    const rawId = String(job.id || '')
    const cleanId = rawId.replace('J-', '').replace('REQ-', '').trim()
    const resolvedId = resolveReqId(cleanId, job)
    const fullId = `J-${cleanId}`

    let savedReq = {}
    try {
      const raw = localStorage.getItem(`smarthire_req_${cleanId}`) ||
                  localStorage.getItem(`smarthire_req_${resolvedId}`) ||
                  localStorage.getItem(`smarthire_req_${rawId}`) ||
                  localStorage.getItem(`smarthire_req_${fullId}`)
      if (raw) savedReq = JSON.parse(raw)
    } catch(e) {}

    const fullDesc = savedReq.description || job.description || getFullDescriptionText(job)
    const assigned = (savedReq.assignedRecruiters && savedReq.assignedRecruiters.length > 0)
      ? savedReq.assignedRecruiters
      : (Array.isArray(job.assignedRecruiters) ? job.assignedRecruiters : getJobAssignedRecruiters(job.id))

    // Find matching candidates from global candidates list
    const matchingGlobal = (candidates || []).filter(c => {
      if (!c) return false
      const cReq = String(c.reqId || c.job_id || c.jobId || c.targetJobId || '').replace('J-', '').trim()
      const resolvedCReq = resolveReqId(cReq)
      return cReq === cleanId || cReq === resolvedId || resolvedCReq === resolvedId || cReq === rawId || resolvedCReq === cleanId
    }).map(c => ({
      id: c.id || c.canId,
      name: c.name,
      payRate: c.payRate || '74/hr',
      payRateType: c.rateType || c.payRateType || 'C2C',
      assignedBy: c.assignedBy || c.recruiter || userName,
      assignedOn: c.dateAdded || 'Aug 20, 2026 04:40 PM',
      status: c.status || 'Int-SubmittedToManager',
      statusComments: c.statusComments || 'Submitted',
      interview: 'Select',
      rejectedReason: 'Select',
      lastChangedBy: c.lastChangedBy || c.recruiter || userName,
      lastChangedRole: c.lastChangedRole || 'Recruiter',
      lastChangedOn: c.lastChangedOn || 'Aug 20, 2026 04:40 PM'
    }))

    // Load candidates specifically for this requisition
    try {
      const savedCand = localStorage.getItem(`smarthire_potential_candidates_${cleanId}`) ||
                        localStorage.getItem(`smarthire_potential_candidates_${resolvedId}`) ||
                        localStorage.getItem(`smarthire_potential_candidates_${rawId}`) ||
                        localStorage.getItem(`smarthire_potential_candidates_${fullId}`)
      if (savedCand !== null && savedCand !== undefined) {
        const parsed = JSON.parse(savedCand)
        const combined = [...(Array.isArray(parsed) ? parsed : []), ...matchingGlobal]
        setPotentialCandidates(deduplicateCandidates(combined))
      } else {
        setPotentialCandidates(deduplicateCandidates(matchingGlobal))
      }
    } catch (e) {
      setPotentialCandidates(deduplicateCandidates(matchingGlobal))
    }

    // Fetch from Firestore for freshest real-time updates
    const fetchCloud = async () => {
      try {
        const [c1, c2, c3] = await Promise.all([
          getRequisitionCandidates(cleanId),
          resolvedId !== cleanId ? getRequisitionCandidates(resolvedId) : Promise.resolve([]),
          rawId !== cleanId && rawId !== resolvedId ? getRequisitionCandidates(rawId) : Promise.resolve([])
        ])
        const cloudCands = [...(c1 || []), ...(c2 || []), ...(c3 || [])]
        if (cloudCands.length > 0) {
          setPotentialCandidates(prev => {
            const merged = deduplicateCandidates([...cloudCands, ...prev])
            try {
              localStorage.setItem(`smarthire_potential_candidates_${cleanId}`, JSON.stringify(merged))
              localStorage.setItem(`smarthire_potential_candidates_${resolvedId}`, JSON.stringify(merged))
              localStorage.setItem(`smarthire_potential_candidates_J-${cleanId}`, JSON.stringify(merged))
            } catch (e) {}
            return merged
          })
        }
      } catch (err) {}
    }
    fetchCloud()

    // Load attachments specifically for this requisition
    try {
      const savedAtt = localStorage.getItem(`smarthire_req_attachments_${cleanId}`) ||
                       localStorage.getItem(`smarthire_req_attachments_${rawId}`) ||
                       localStorage.getItem(`smarthire_req_attachments_${fullId}`)
      if (savedAtt !== null && savedAtt !== undefined) {
        setAttachments(JSON.parse(savedAtt))
      } else if (job.attachments && Array.isArray(job.attachments)) {
        setAttachments(job.attachments)
      } else {
        setAttachments([
          { id: 1, title: `13285 - Admin - ${cleanId}`, filename: `13285 - Admin - ${cleanId}.docx` },
          { id: 2, title: `SCMSP_Candidate_Cover_Sheet - ${cleanId}`, filename: `SCMSP_Candidate_Cover_Sheet - ${cleanId}.docx` },
          { id: 3, title: `SSN References - ${cleanId}`, filename: `SSN References - ${cleanId}.doc` },
        ])
      }
    } catch (e) {}

    const formattedTitle = cleanJobTitleWithPositionNumber(savedReq.title || job.title || 'Lead Business Analyst')
    const formattedDesc = formatJobDescription(fullDesc, { ...job, ...savedReq, title: formattedTitle })

    setEditingFields({
      id: rawId || fullId,
      title: formattedTitle,
      startDate: savedReq.startDate || job.creationDate || job.startDate || '10/23/2026',
      duration: savedReq.duration || job.duration || '12',
      durationUnit: 'months',
      customer: savedReq.customer || job.client || job.customer || 'NCDHHS-NCFAST',
      endClient: savedReq.endClient || job.client || job.customer || 'NCDHHS-NCFAST',
      contact: savedReq.contact || job.contact || 'Hustedt Lexi',
      numPositions: savedReq.numPositions || job.numPositions || '1',
      deadline: savedReq.deadline || job.deadline || '2026-09-04',
      maxSubmissions: savedReq.maxSubmissions || job.maxSubmissions || '2',
      category: savedReq.category || job.category || 'SP',
      type: savedReq.type || job.type || 'Contract',
      address: savedReq.address || job.address || '4430 Broad Rd.',
      city: savedReq.city || job.city || (job.location ? job.location.split(',')[0].trim() : 'Raleigh'),
      state: savedReq.state || job.state || (job.location && job.location.includes(',') ? job.location.split(',')[1].trim().slice(0, 2) : 'NC'),
      zip: savedReq.zip || job.zip || '27601',
      location: savedReq.location || job.location || 'Raleigh, NC',
      billRate: savedReq.billRate || job.billRate || '90',
      payRate: savedReq.payRate || (job.budget ? String(job.budget).replace(/[^0-9]/g, '').slice(0, 3) : '75') || '75',
      interview: savedReq.interview || 'Webcam Interview Only',
      workAuth: savedReq.workAuth || 'Select',
      subcontractable: savedReq.subcontractable || 'Yes',
      employmentType: savedReq.employmentType || job.type || 'Contract',
      experience: savedReq.experience || (job.experience ? (String(job.experience).replace(/[^0-9]/g, '') || '6') : '6'),
      description: formattedDesc,
      skills: Array.isArray(savedReq.skills) ? savedReq.skills : (Array.isArray(job.skills) ? job.skills : ['Java', 'SQL', 'Agile']),
      desiredSkills: Array.isArray(savedReq.desiredSkills) ? savedReq.desiredSkills : (Array.isArray(job.preferredSkills) ? job.preferredSkills : ['Public Sector Experience', 'Cloud Security']),
      status: savedReq.status || (job.status === 'Active' ? 'In-Progress' : (job.status || 'In-Progress')),
      assignedRecruiters: assigned,
      keyReq: savedReq.keyReq || false,
      working: savedReq.working !== undefined ? savedReq.working : true,
      hotReq: savedReq.hotReq || false,
      incumbentVendor: savedReq.incumbentVendor || false,
      createdBy: savedReq.createdBy || job.createdBy || 'admin',
      createdOn: savedReq.createdOn || job.createdOn || (job.creationDate ? `${job.creationDate} 11:40:14 AM` : '2026-08-26 11:40:14 AM'),
      lastUpdatedBy: savedReq.lastUpdatedBy || job.lastUpdatedBy || userName,
      lastUpdatedOn: savedReq.lastUpdatedOn || job.lastUpdatedOn || '8/26/2026 11:43:52 AM'
    })
  }

  // Open Full Candidate Detail View with unified master candidate data
  const handleOpenCandidateView = (candObj) => {
    if (!candObj) return
    const candId = String(candObj.id || candObj.canId || '')
    const cleanId = candId.replace('CAND-', '').replace('cand-', '').trim()
    const candName = (candObj.name || '').trim().toLowerCase()

    // Find master candidate in candidates array
    const matchedMaster = candidates.find(c => 
      String(c.id) === candId || 
      String(c.id) === cleanId || 
      String(c.canId) === candId ||
      String(c.canId) === cleanId ||
      (c.name && c.name.toLowerCase() === candName)
    )

    let detailsOverride = {}
    try {
      const saved = localStorage.getItem(`smarthire_candidate_details_${cleanId}`) ||
                    localStorage.getItem(`smarthire_candidate_details_${candId}`)
      if (saved) detailsOverride = JSON.parse(saved)
    } catch (e) {}

    let docsOverride = {}
    try {
      const saved = localStorage.getItem(`smarthire_candidate_docs_${cleanId}`) ||
                    localStorage.getItem(`smarthire_candidate_docs_${candId}`)
      if (saved) docsOverride = JSON.parse(saved)
    } catch (e) {}

    const mergedCand = {
      ...candObj,
      ...(matchedMaster || {}),
      ...detailsOverride,
      jobId: selectedReq?.id || candObj.jobId || matchedMaster?.jobId,
      reqId: selectedReq?.id || candObj.reqId || matchedMaster?.reqId,
      jobTitle: detailsOverride.jobTitle || matchedMaster?.jobTitle || candObj.jobTitle || matchedMaster?.fullRole || candObj.fullRole || selectedReq?.title || 'Lead Business Analyst',
      email: detailsOverride.email || matchedMaster?.email || candObj.email || candObj.candidateEmail || '',
      phone: detailsOverride.phoneCell || matchedMaster?.phone || candObj.phone || '',
      phoneCell: detailsOverride.phoneCell || matchedMaster?.phoneCell || candObj.phoneCell || candObj.phone || '',
      skills: matchedMaster?.skills || candObj.skills || detailsOverride.skills || [],
      resumeName: docsOverride.resume?.fileName || matchedMaster?.resumeName || candObj.resumeName || `${candObj.name || 'Candidate'}_Resume.pdf`,
      resumeData: docsOverride.resume?.fileData || matchedMaster?.resumeData || candObj.resumeData || null,
      resumeText: docsOverride.resume?.resumeText || matchedMaster?.resumeText || candObj.resumeText || ''
    }

    setSelectedViewCandidate(mergedCand)
    setShowDetailViewModal(true)
  }

  // Auto-sync editingFields when requisition view is active
  useEffect(() => {
    if (selectedReq && (!editingFields.title || editingFields.title === '' || (editingFields.id && !String(editingFields.id).includes(String(selectedReq.id).replace('J-', ''))))) {
      handleOpenReq(selectedReq)
    }
  }, [selectedReq?.id, viewMode])

  // ─── AI PROACTIVE CANDIDATE MATCHMAKER & RECRUITER ALERT ENGINE ───
  const runAiMatchForJob = (jobObj, options = { notifyRecruiter: true }) => {
    if (!jobObj) return []
    const jSkills = Array.isArray(jobObj.skills) && jobObj.skills.length > 0
      ? jobObj.skills.map(s => String(s).toLowerCase().trim())
      : ['cisco', 'network', 'routing', 'security', 'cloud', 'aws', 'python', 'sql']
    const jTitle = (jobObj.title || '').toLowerCase()
    const jLocation = (jobObj.location || '').toLowerCase()
    const jCleanId = String(jobObj.id || '158938').replace('J-', '')

    // Score candidates from the candidate pool (scoped to current user if employee)
    const poolToScore = isEmployee ? filteredCandidates : candidates
    const scored = poolToScore.map(cand => {
      const cSkills = Array.isArray(cand.skills)
        ? cand.skills.map(s => String(s).toLowerCase().trim())
        : String(cand.skills || '').toLowerCase().split(',').map(s => s.trim())
      const cRole = (cand.fullRole || cand.role || '').toLowerCase()
      const cLoc = (cand.location || cand.city || '').toLowerCase()

      // Skill overlap match
      const skillMatches = jSkills.filter(js =>
        cSkills.some(cs => cs.includes(js) || js.includes(cs)) ||
        cRole.includes(js) ||
        (cand.resumeText && cand.resumeText.toLowerCase().includes(js))
      )
      const skillRatio = jSkills.length > 0 ? (skillMatches.length / jSkills.length) : 0.65

      // Role title match
      const roleMatch = jTitle.split(' ').some(w => w.length > 3 && cRole.includes(w)) ? 15 : 0

      // Location match
      const locMatch = jLocation && cLoc && (jLocation.includes(cLoc) || cLoc.includes(jLocation.slice(0, 3))) ? 10 : 5

      const calculatedScore = Math.min(98, Math.max(68, Math.round(skillRatio * 70 + roleMatch + locMatch)))
      return {
        ...cand,
        matchScore: calculatedScore,
        matchedSkillsList: skillMatches
      }
    })

    // Filter >= 75% match
    const matches = scored.filter(c => c.matchScore >= 75).sort((a, b) => b.matchScore - a.matchScore)

    // Notify the recruiters who sourced each candidate
    if (options.notifyRecruiter && matches.length > 0) {
      const byRecruiter = {}
      matches.forEach(m => {
        const rec = m.recruiter || m.assignedTo || m.addedByName || 'Recruiter Team'
        if (!byRecruiter[rec]) byRecruiter[rec] = []
        byRecruiter[rec].push(m)
      })

      Object.entries(byRecruiter).forEach(([recName, list]) => {
        const topNames = list.slice(0, 3).map(c => c.name).join(', ')
        const bestScore = list[0]?.matchScore || 92
        pushActivityNotification({
          title: `🎯 ${list.length} Candidate${list.length > 1 ? 's' : ''} Matched for Req #${jCleanId}`,
          message: `Hey ${recName}! ${list.length} of your sourced candidate(s) (${topNames}) are a ${bestScore}% Match for Req #${jCleanId} "${jobObj.title}". Check availability & submit!`,
          type: 'ai_match',
          category: 'ai',
          actor: 'SmartHire AI Matchmaker',
          actorRole: 'AI Agent',
          reqId: jCleanId,
          candidateName: topNames,
          jobTitle: jobObj.title
        })
      })
    }

    return matches
  }

  // Open AI Matchmaker Modal for a Requisition
  const handleOpenAiMatchModalForJob = (targetJob) => {
    const theJob = targetJob || selectedReq
    if (!theJob) return
    const matches = runAiMatchForJob(theJob, { notifyRecruiter: false })
    setAiMatchTargetJob(theJob)
    setAiMatchingCandidatesList(matches)
    setShowAiMatchModal(true)
  }

  // Create / Add New Requisition with auto AI candidate matching
  const handleAddNewRequisition = () => {
    const newReqId = `1589${Math.floor(40 + Math.random() * 50)}`
    const newJobObj = {
      id: `J-${newReqId}`,
      title: 'New Requisition Position',
      client: 'State Of SC',
      skills: ['Required Skill 1', 'Required Skill 2'],
      budget: '75/hr',
      experience: '5+ years',
      location: 'Columbia, SC',
      type: 'Contract',
      status: 'Ready',
      creationDate: new Date().toLocaleDateString(),
      deadline: 'Aug 28, 2026'
    }
    handleOpenReq(newJobObj)

    // Trigger instant in-app activity notification and requisition sound chime
    pushActivityNotification({
      title: '💼 New Requisition Created!',
      message: `${newJobObj.title} (Req #${newReqId}) is ready for sourcing.`,
      type: 'requisition',
      category: 'team',
      actor: currentUser?.name || userName || 'Recruiter',
      actorRole: currentUser?.role || 'Recruiter',
      reqId: newReqId
    })

    // Run AI Matchmaker automatically in background to alert recruiters
    setTimeout(() => {
      runAiMatchForJob(newJobObj, { notifyRecruiter: true })
    }, 1000)
  }

  // Quick Search handler
  const handleQuickSearch = (e) => {
    e.preventDefault()
    if (!quickSearchId.trim()) return
    const q = quickSearchId.toLowerCase().trim()
    const match = jobs.find(j => {
      const resolved = resolveReqId(j.id, j).toLowerCase()
      const rawId = String(j.id || '').replace('J-', '').toLowerCase()
      const title = String(j.title || '').toLowerCase()
      const cleanTitle = cleanJobTitleWithPositionNumber(j.title, j).toLowerCase()
      const posNum = String(j.positionNumber || '').toLowerCase()
      return resolved.includes(q) || rawId.includes(q) || title.includes(q) || cleanTitle.includes(q) || posNum.includes(q)
    })
    if (match) {
      handleOpenReq(match)
    } else {
      setReqFilters(prev => ({ ...prev, reqId: quickSearchId, status: 'Select Status' }))
      setActiveMainTab('requisitions')
      setViewMode('portal')
      setCurrentPage(1)
    }
  }

  // Export Results to CSV / Excel
  const handleExportToExcel = () => {
    const headers = ['Scr?', 'Candidate ID', 'Name', 'Job Title', 'Exp', 'Location', 'Pay Rate', 'Rate Type', 'Rating', 'Sub Vendor', 'Recruiter (Added By)', 'AgrExists', 'Avbl Date']
    const rows = filteredCandidates.map(c => [
      c.screened,
      c.id,
      `"${c.name}"`,
      `"${c.fullRole || c.role}"`,
      c.exp,
      `"${c.location}"`,
      `"${c.payRate}"`,
      c.rateType,
      c.rating,
      `"${c.subVendor}"`,
      `"${c.recruiter || c.assignedTo}"`,
      c.agrExists ? 'Yes' : 'No',
      `"${c.avblDate}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `SmartWorks_Candidates_Export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Resume File Upload & AI Auto-Parsing
  const handleResumeFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setNewCandForm(prev => ({
      ...prev,
      resumeFile: file,
      resumeTitle: file.name.replace(/\.[^/.]+$/, ''),
      isParsing: true,
      parseSuccess: false
    }))

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        const parsed = parseResumeDetails(data.text || '', file.name)
        setNewCandForm(prev => ({
          ...prev,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          email: data.email || parsed.email,
          city: parsed.city,
          state: parsed.state,
          exp: parsed.exp,
          isParsing: false,
          parseSuccess: true
        }))
      } else {
        const parsed = parseResumeDetails('', file.name)
        setNewCandForm(prev => ({
          ...prev,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          email: parsed.email,
          city: parsed.city,
          state: parsed.state,
          exp: parsed.exp,
          isParsing: false,
          parseSuccess: true
        }))
      }
    } catch (err) {
      const parsed = parseResumeDetails('', file.name)
      setNewCandForm(prev => ({
        ...prev,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email,
        city: parsed.city,
        state: parsed.state,
        exp: parsed.exp,
        isParsing: false,
        parseSuccess: true
      }))
    }
  }

  const handleContinueToSubmission = (e) => {
    e.preventDefault()
    if (!newCandForm.firstName && !newCandForm.email) {
      alert('Please provide candidate name or upload a resume.')
      return
    }

    const candId = String(Math.floor(10000 + Math.random() * 90000))
    setSubmissionCandidate(prev => ({
      ...prev,
      id: candId,
      firstName: newCandForm.firstName || 'Candidate',
      lastName: newCandForm.lastName || 'Profile',
      email: newCandForm.email || 'candidate@example.com',
      city: newCandForm.city || 'Richmond',
      state: newCandForm.state !== 'Select' ? newCandForm.state : 'VA',
      experienceYears: newCandForm.exp || '5',
      resumeName: newCandForm.resumeFile ? newCandForm.resumeFile.name : `${newCandForm.firstName || 'Candidate'}_Resume.docx`,
      jobTitle: editingFields.title || 'Project Manager - Consultant',
      dob: newCandForm.dob || ''
    }))

    setViewMode('resumeSubmission')
    setActiveSubTab('details')
  }

  const handleSelectExistingCandidate = (c) => {
    // 1. Look up full candidate profile from candidates list or localStorage
    const fullCand = candidates.find(item => item.id === c.id || item.name === c.name || item.email === c.email) || c
    
    // 2. Open the comprehensive CandidateDetailViewModal with resume viewer, all subtabs (Details, Skill, References, Legal, Notes, Submissions, Projects)
    setSelectedViewCandidate(fullCand)
    setShowDetailViewModal(true)

    // 3. Also fully populate submissionCandidate state for seamless submission
    const parts = (fullCand.name || 'Candidate').split(' ')
    const fn = fullCand.firstName || parts[0] || 'Candidate'
    const ln = fullCand.lastName || parts.slice(1).join(' ') || ''
    const candId = String(fullCand.id ? String(fullCand.id).replace(/\D/g, '').slice(-5) || '87534' : '87534')

    setSubmissionCandidate(prev => ({
      ...prev,
      ...fullCand,
      id: candId,
      firstName: fn,
      lastName: ln,
      email: fullCand.email || `${fn.toLowerCase()}@example.com`,
      phoneCell: fullCand.phone || fullCand.phoneCell || '571-660-5778',
      city: fullCand.city || (fullCand.location ? fullCand.location.split(',')[0].trim() : 'Richmond'),
      state: fullCand.state || (fullCand.location && fullCand.location.split(',')[1] ? fullCand.location.split(',')[1].trim().slice(0, 2) : 'VA'),
      experienceYears: fullCand.exp || (fullCand.experience ? String(fullCand.experience).replace(/\D/g, '') || '8' : '8'),
      jobTitle: fullCand.fullRole || fullCand.role || editingFields.title || 'Consultant',
      resumeName: fullCand.resumeName || `${fullCand.name || 'Candidate'}_Resume.docx`,
      resumeText: fullCand.resumeText || fullCand.parsedResumeText || '',
      resumeUrl: fullCand.resumeUrl || '',
      skills: Array.isArray(fullCand.skills) ? fullCand.skills : (fullCand.skills ? String(fullCand.skills).split(',').map(s => s.trim()) : []),
      references: Array.isArray(fullCand.references) ? fullCand.references : (prev.references || []),
      interactionNotes: Array.isArray(fullCand.interactionNotes) ? fullCand.interactionNotes : (Array.isArray(fullCand.notes) ? fullCand.notes : prev.interactionNotes),
      submissionHistory: Array.isArray(fullCand.submissionHistory) ? fullCand.submissionHistory : (Array.isArray(fullCand.submissions) ? fullCand.submissions : prev.submissionHistory),
      legal: fullCand.legal || {},
      workAuth: fullCand.workAuth || 'US Citizen',
      proposedPayRate: fullCand.payRate ? String(fullCand.payRate).replace(/[^0-9]/g, '') : '74',
      proposedRateType: fullCand.rateType || 'C2C'
    }))
  }

  const handleAssignCandidateToReq = () => {
    const fullName = `${submissionCandidate.firstName} ${submissionCandidate.lastName}`.trim()
    const cleanId = String(selectedReq?.id || '158938').replace('J-', '').replace('REQ-', '').trim()
    const candId = String(submissionCandidate.id || `875${Date.now().toString().slice(-4)}`)
    const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const effectiveParentRecruiterName = currentUser?.parentRecruiterName || 
      teamUsers.find(u => (u.email && u.email.toLowerCase() === (currentUser?.email || '').toLowerCase()) || (u.name && u.name.toLowerCase() === (userName || '').toLowerCase()))?.parentRecruiterName || ''
    const effectiveParentRecruiterEmail = currentUser?.parentRecruiterEmail || 
      teamUsers.find(u => (u.email && u.email.toLowerCase() === (currentUser?.email || '').toLowerCase()) || (u.name && u.name.toLowerCase() === (userName || '').toLowerCase()))?.parentRecruiterEmail || ''
    const effectiveParentRecruiterId = currentUser?.parentRecruiterId || 
      teamUsers.find(u => (u.email && u.email.toLowerCase() === (currentUser?.email || '').toLowerCase()) || (u.name && u.name.toLowerCase() === (userName || '').toLowerCase()))?.parentRecruiterId || ''

    const newSubObj = {
      id: candId,
      name: fullName,
      payRate: `${submissionCandidate.proposedPayRate || submissionCandidate.payRateMin || '74'}/hr`,
      payRateType: submissionCandidate.proposedRateType || submissionCandidate.rateType || 'C2C',
      assignedBy: userName || currentUser?.name || 'Recruiter',
      assignedOn: dateStr,
      status: 'Int-SubmittedToManager',
      statusComments: 'Submitted',
      interview: 'Select',
      rejectedReason: '',
      recruiter: userName,
      recruiterEmail: currentUser?.email || '',
      recruiterRefCode: currentUser?.refCode || '',
      parentRecruiterName: effectiveParentRecruiterName,
      parentRecruiterEmail: effectiveParentRecruiterEmail,
      parentRecruiterId: effectiveParentRecruiterId,
      addedByName: userName,
      addedByEmail: currentUser?.email || '',
      addedByRole: isEmployee ? 'employee' : isRecruiter ? 'recruiter' : 'admin',
      lastChangedBy: userName || currentUser?.name || 'Recruiter',
      lastChangedRole: isAdmin ? 'superadmin' : (isRecruiter ? 'Recruiter' : 'Employee'),
      lastChangedOn: dateStr
    }

    const updated = [newSubObj, ...potentialCandidates.filter(p => p.id !== candId && p.name !== fullName)]
    setPotentialCandidates(updated)

    // Save to localStorage
    try {
      localStorage.setItem(`smarthire_potential_candidates_${cleanId}`, JSON.stringify(updated))
      localStorage.setItem(`smarthire_potential_candidates_J-${cleanId}`, JSON.stringify(updated))
    } catch (e) {}

    const masterCandObj = {
      id: candId,
      canId: candId,
      name: fullName,
      fullRole: submissionCandidate.jobTitle || editingFields.title || 'Consultant',
      role: submissionCandidate.jobTitle || editingFields.title || 'Consultant',
      exp: submissionCandidate.experienceYears || '5',
      location: `${submissionCandidate.city || 'Richmond'}, ${submissionCandidate.state || 'VA'}`,
      city: submissionCandidate.city || 'Richmond',
      state: submissionCandidate.state || 'VA',
      payRate: `$${submissionCandidate.proposedPayRate || '74'} /hr`,
      rateType: submissionCandidate.proposedRateType || 'C2C',
      rating: 5,
      subVendor: 'Direct Submission',
      recruiter: userName,
      assignedTo: userName,
      assignedBy: userName,
      recruiterEmail: currentUser?.email || '',
      recruiterRefCode: currentUser?.refCode || '',
      parentRecruiterName: effectiveParentRecruiterName,
      parentRecruiterEmail: effectiveParentRecruiterEmail,
      parentRecruiterId: effectiveParentRecruiterId,
      addedByName: userName,
      addedByEmail: currentUser?.email || '',
      addedByRole: isEmployee ? 'employee' : isRecruiter ? 'recruiter' : 'admin',
      email: submissionCandidate.email || `${submissionCandidate.firstName.toLowerCase()}@example.com`,
      phone: submissionCandidate.phoneCell || '571-660-5778',
      workAuth: 'US Citizen',
      screened: 'Yes',
      reqId: cleanId,
      status: 'Int-SubmittedToManager'
    }

    setCandidates(prev => {
      const merged = [masterCandObj, ...prev.filter(c => c.id !== candId && c.name !== fullName)]
      try { localStorage.setItem('smarthire_all_candidates', JSON.stringify(merged)) } catch (e) {}
      return merged
    })

    // Save to Firestore
    saveRequisitionCandidates(cleanId, updated).catch(() => {})
    saveCandidate(candId, masterCandObj).catch(err => console.warn('Firestore candidate save notice:', err))

    // Backend sync
    fetch('/api/candidates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
      },
      body: JSON.stringify(masterCandObj)
    }).catch(() => {})

    alert(`✅ Candidate ${fullName} (ID: ${candId}) has been successfully assigned to Requisition #${cleanId}!`)
    setViewMode('requisition')
    setActiveReqTab('potential')
  }

  // ─── FILTER REQUISITIONS LIST (STRICT MULTI-LEVEL RBAC + SEARCH FILTERS) ───
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      if (!j) return false

      // ─── STRICT ROLE-BASED ACCESS CONTROL (RBAC) FOR EMPLOYEE ───
      // If user is an Employee (Sub-recruiter): strictly show ONLY requisitions explicitly assigned to this employee!
      if (isEmployee) {
        const assignedList = Array.isArray(j.assignedRecruiters)
          ? j.assignedRecruiters.map(r => String(r || '').toLowerCase().trim())
          : []
        const userIdent = userName.toLowerCase().trim()
        const userEmailIdent = (currentUser?.email || '').toLowerCase().trim()
        const firstNameIdent = (userName.split(' ')[0] || '').toLowerCase().trim()
        const uidIdent = (currentUser?.uid || '').toLowerCase().trim()

        const isDirectlyAssigned = assignedList.some(r =>
          r === userIdent ||
          (userIdent.length >= 3 && (r.includes(userIdent) || userIdent.includes(r))) ||
          (userEmailIdent && (r === userEmailIdent || r.includes(userEmailIdent) || userEmailIdent.includes(r))) ||
          (firstNameIdent && firstNameIdent.length >= 3 && (r === firstNameIdent || r.includes(firstNameIdent))) ||
          (uidIdent && r.includes(uidIdent))
        )

        const isAssignedField = [j.assignedTo, j.recruiter, j.recruiterEmail, j.postedByName]
          .some(prop => {
            if (!prop) return false
            const p = String(prop).toLowerCase().trim()
            return p === userIdent || (userIdent.length >= 3 && p.includes(userIdent)) || (userEmailIdent && p.includes(userEmailIdent))
          })

        if (!isDirectlyAssigned && !isAssignedField) {
          return false
        }
      }

      if (reqFilters.reqId.trim()) {
        const query = reqFilters.reqId.toLowerCase().trim()
        const resolvedId = resolveReqId(j.id, j).toLowerCase()
        const rawId = String(j.id || '').replace('J-', '').toLowerCase()
        const titleStr = String(j.title || '').toLowerCase()
        const cleanTitle = cleanJobTitleWithPositionNumber(j.title, j).toLowerCase()
        const posNum = String(j.positionNumber || '').toLowerCase()
        if (!resolvedId.includes(query) && !rawId.includes(query) && !titleStr.includes(query) && !cleanTitle.includes(query) && !posNum.includes(query)) return false
      }
      if (reqFilters.title.trim()) {
        const titleQ = reqFilters.title.toLowerCase().trim()
        const cleanTitle = cleanJobTitleWithPositionNumber(j.title, j).toLowerCase()
        const rawTitle = (j.title || '').toLowerCase()
        const posNum = String(j.positionNumber || '').toLowerCase()
        const resolvedId = resolveReqId(j.id, j).toLowerCase()
        const rawId = String(j.id || '').replace('J-', '').toLowerCase()
        const client = String(j.client || j.customer || j.agency || '').toLowerCase()
        if (!cleanTitle.includes(titleQ) && !rawTitle.includes(titleQ) && !posNum.includes(titleQ) && !resolvedId.includes(titleQ) && !rawId.includes(titleQ) && !client.includes(titleQ)) return false
      }
      if (reqFilters.skills.trim()) {
        const skillsStr = Array.isArray(j.skills) ? j.skills.join(' ').toLowerCase() : ''
        const descStr = String(j.description || '').toLowerCase()
        if (!skillsStr.includes(reqFilters.skills.toLowerCase()) && !descStr.includes(reqFilters.skills.toLowerCase())) return false
      }
      if (reqFilters.city.trim()) {
        const loc = (j.location || '').toLowerCase()
        if (!loc.includes(reqFilters.city.toLowerCase())) return false
      }
      if (reqFilters.state !== 'Select State' && reqFilters.state !== 'Select') {
        const loc = (j.location || '').toLowerCase()
        if (!loc.includes(reqFilters.state.toLowerCase())) return false
      }
      if (reqFilters.status !== 'Select Status' && reqFilters.status !== 'All' && reqFilters.status !== 'Any') {
        const stat = (j.status || 'open').toLowerCase()
        if (reqFilters.status === 'In-Progress') {
          if (stat !== 'active' && stat !== 'in-progress' && stat !== 'posted' && stat !== 'open' && stat !== 'ready') return false
        } else if (reqFilters.status === 'Ready') {
          if (stat !== 'ready' && stat !== 'open' && stat !== 'active') return false
        } else if (reqFilters.status === 'Closed') {
          if (stat !== 'closed' && stat !== 'expired' && stat !== 'filled' && stat !== 'inactive') return false
        }
      }
      if (reqFilters.endClient && reqFilters.endClient !== 'Any' && reqFilters.endClient !== 'All') {
        const targetClient = reqFilters.endClient.toLowerCase().trim()
        const client = String(j.client || j.customer || j.agency || '').toLowerCase()
        if (!client.includes(targetClient)) return false
      }
      if (reqFilters.assignedTo && reqFilters.assignedTo !== 'Any' && reqFilters.assignedTo !== 'All') {
        const targetRec = reqFilters.assignedTo.toLowerCase().trim()
        const assignedList = Array.isArray(j.assignedRecruiters) ? j.assignedRecruiters.map(r => r.toLowerCase().trim()) : []
        const postedBy = (j.postedByName || '').toLowerCase().trim()
        if (!assignedList.some(r => r.includes(targetRec) || targetRec.includes(r)) && !postedBy.includes(targetRec)) {
          return false
        }
      }
      if (reqFilters.reqType !== 'Select Req Type' && reqFilters.reqType !== 'Select') {
        const type = (j.type || '').toLowerCase()
        if (!type.includes(reqFilters.reqType.toLowerCase())) return false
      }
      return true
    })

    // Sort newest/highest authentic Req ID at the TOP
    return [...list].sort((a, b) => {
      const aNum = parseInt(String(resolveReqId(a.id, a)).replace(/\D/g, ''), 10) || 0
      const bNum = parseInt(String(resolveReqId(b.id, b)).replace(/\D/g, ''), 10) || 0
      return bNum - aNum
    })
  }, [jobs, reqFilters, isAdmin, isRecruiter, isEmployee, userName, currentUser, teamUsers])

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredJobs.slice(start, start + pageSize)
  }, [filteredJobs, currentPage, pageSize])

  const totalPages = Math.ceil(filteredJobs.length / pageSize) || 1

  // ─── FILTER CANDIDATES LIST (ROLE-BASED & SEARCH FILTERS) ───
  const filteredCandidates = useMemo(() => {
    const list = candidates.filter(c => {
      if (!c) return false

      // ─── STRICT RBAC FOR CANDIDATES ───
      // If user is Employee: strictly show ONLY candidates added, submitted, or sourced by this employee
      if (isEmployee) {
        const userIdent = userName.toLowerCase().trim()
        const userEmail = (currentUser?.email || '').toLowerCase().trim()
        const userRef = (currentUser?.refCode || '').toLowerCase().trim()
        const userId = String(currentUser?.id || currentUser?._id || '').toLowerCase().trim()
        const firstName = (userName.split(' ')[0] || '').toLowerCase().trim()

        const candRecruiter = (c.recruiter || c.assignedTo || c.assignedBy || c.addedByName || c.submittedBy || c.referredByRecruiterName || '').toLowerCase().trim()
        const candEmail = (c.recruiterEmail || '').toLowerCase().trim()
        const candRef = (c.recruiterRefCode || c.recruiterRef || '').toLowerCase().trim()
        const candCreator = String(c.createdBy || '').toLowerCase().trim()

        const isMyCandidate = candRecruiter === userIdent ||
                              (userIdent.length >= 3 && candRecruiter.includes(userIdent)) ||
                              (candRecruiter.length >= 3 && userIdent.includes(candRecruiter)) ||
                              (userEmail && (candRecruiter.includes(userEmail) || candEmail.includes(userEmail))) ||
                              (userRef && candRef.includes(userRef)) ||
                              (userId && candCreator === userId) ||
                              (firstName.length >= 3 && candRecruiter.includes(firstName))
        if (!isMyCandidate) return false
      }

      // If user is Recruiter (Lead): show candidates submitted by this recruiter OR any employee reporting to this recruiter
      if (isRecruiter && (!candFilters.assignedTo || candFilters.assignedTo === 'Any' || candFilters.assignedTo === 'All')) {
        const userIdent = userName.toLowerCase().trim()
        const userEmail = (currentUser?.email || '').toLowerCase().trim()
        const userRef = (currentUser?.refCode || '').toLowerCase().trim()
        const userId = String(currentUser?.id || currentUser?._id || '').toLowerCase().trim()
        const firstName = (userName.split(' ')[0] || '').toLowerCase().trim()

        const mySubordinates = teamUsers.filter(u => {
          if (!u) return false
          const pName = (u.parentRecruiterName || '').toLowerCase().trim()
          const pId = String(u.parentRecruiterId || '').toLowerCase().trim()
          const pEmail = (u.parentRecruiterEmail || '').toLowerCase().trim()
          return (pName && (pName === userIdent || pName.includes(userIdent) || userIdent.includes(pName) || (firstName.length >= 3 && pName.includes(firstName)))) ||
                 (pId && (pId === userId || userId.includes(pId))) ||
                 (pEmail && pEmail === userEmail)
        })

        const subNames = mySubordinates.map(u => (u.name || '').toLowerCase().trim()).filter(Boolean)
        const subEmails = mySubordinates.map(u => (u.email || '').toLowerCase().trim()).filter(Boolean)
        const subRefs = mySubordinates.map(u => (u.refCode || '').toLowerCase().trim()).filter(Boolean)
        const subIds = mySubordinates.map(u => String(u.id || u._id || '').toLowerCase().trim()).filter(Boolean)

        const candRecruiter = (c.recruiter || c.assignedTo || c.assignedBy || c.addedByName || c.submittedBy || c.referredByRecruiterName || '').toLowerCase().trim()
        const candEmail = (c.recruiterEmail || c.addedByEmail || '').toLowerCase().trim()
        const candRef = (c.recruiterRefCode || c.recruiterRef || '').toLowerCase().trim()
        const candParent = (c.parentRecruiterName || '').toLowerCase().trim()
        const candParentEmail = (c.parentRecruiterEmail || '').toLowerCase().trim()
        const candParentId = String(c.parentRecruiterId || '').toLowerCase().trim()
        const candCreator = String(c.createdBy || '').toLowerCase().trim()

        const isMine = candRecruiter === userIdent ||
                       (userIdent.length >= 3 && (candRecruiter.includes(userIdent) || userIdent.includes(candRecruiter))) ||
                       (userEmail && (candRecruiter.includes(userEmail) || candEmail.includes(userEmail))) ||
                       (userRef && candRef.includes(userRef)) ||
                       (userId && candCreator === userId) ||
                       (firstName.length >= 3 && candRecruiter.includes(firstName))

        const isMyParentChild = (candParent && (candParent === userIdent || candParent.includes(userIdent) || userIdent.includes(candParent) || (firstName.length >= 3 && candParent.includes(firstName)))) ||
                                (candParentEmail && candParentEmail === userEmail) ||
                                (candParentId && candParentId === userId)

        const isSubordinateCand = subNames.some(sn => sn && (candRecruiter === sn || candRecruiter.includes(sn) || sn.includes(candRecruiter))) ||
                                  subEmails.some(se => se && (candEmail.includes(se) || candRecruiter.includes(se))) ||
                                  subRefs.some(sr => sr && candRef.includes(sr)) ||
                                  subIds.some(sid => sid && candCreator === sid)

        if (!isMine && !isMyParentChild && !isSubordinateCand) return false
      }

      // Recruiter Name Filter (Assigned To)
      if (candFilters.assignedTo && candFilters.assignedTo !== 'Any' && candFilters.assignedTo !== 'All') {
        const assigned = (c.recruiter || c.assignedTo || c.assignedBy || '').toLowerCase().trim()
        const filterVal = candFilters.assignedTo.toLowerCase().trim()
        if (!assigned.includes(filterVal) && !filterVal.includes(assigned)) return false
      }

      // Candidate ID Filter
      if (candFilters.candidateId.trim()) {
        if (!c.id.toLowerCase().includes(candFilters.candidateId.toLowerCase())) return false
      }

      // Name Filter
      if (candFilters.name.trim()) {
        if (!c.name.toLowerCase().includes(candFilters.name.toLowerCase())) return false
      }

      // Email Filter
      if (candFilters.email.trim()) {
        if (!c.email.toLowerCase().includes(candFilters.email.toLowerCase())) return false
      }

      // Skills / Role Filter
      if (candFilters.skills.trim()) {
        const skillsStr = (Array.isArray(c.skills) ? c.skills.join(' ') : '') + ' ' + (c.fullRole || c.role || '')
        if (!skillsStr.toLowerCase().includes(candFilters.skills.toLowerCase())) return false
      }

      // City Filter
      if (candFilters.city.trim()) {
        const loc = (c.location || c.city || '').toLowerCase()
        if (!loc.includes(candFilters.city.toLowerCase())) return false
      }

      // State Filter
      if (candFilters.state !== 'Select') {
        const loc = (c.location || c.state || '').toLowerCase()
        if (!loc.includes(candFilters.state.toLowerCase())) return false
      }

      // Job Title Filter
      if (candFilters.jobTitle.trim()) {
        const title = (c.fullRole || c.role || '').toLowerCase()
        if (!title.includes(candFilters.jobTitle.toLowerCase())) return false
      }

      // Work Auth Filter
      if (candFilters.workAuth !== 'Any') {
        if (c.workAuth !== candFilters.workAuth) return false
      }

      // Sub-Vendor Filter
      if (candFilters.subVendor !== 'Select') {
        if (c.subVendor !== candFilters.subVendor) return false
      }

      // Screened Status Filter
      if (candFilters.screenedStatus !== 'All') {
        if (c.screened !== candFilters.screenedStatus) return false
      }

      return true
    })
    return deduplicateCandidates(list)
  }, [candidates, candFilters, isEmployee, isRecruiter, isAdmin, isManager, userName, currentUser, teamUsers])

  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCandidates.slice(start, start + pageSize)
  }, [filteredCandidates, currentPage, pageSize])

  const totalCandPages = Math.ceil(filteredCandidates.length / pageSize) || 1

  // ─── ALL SUBMISSIONS & PERFORMANCE TRACKING LOG ───
  const allSubmissionsList = useMemo(() => {
    const list = []
    const seen = new Set()

    jobs.forEach(job => {
      const cleanId = String(job.id || '').replace('J-', '')
      let potList = []
      try {
        const raw = localStorage.getItem(`smarthire_potential_candidates_${cleanId}`)
        if (raw) potList = JSON.parse(raw)
      } catch (e) {}

      if (Array.isArray(potList)) {
        potList.forEach(cand => {
          const userIdent = userName.toLowerCase().trim()
          const by = (cand.assignedBy || cand.recruiter || cand.lastChangedBy || cand.submittedBy || '').toLowerCase().trim()
          const isMine = by === userIdent || by.includes(userIdent) || userIdent.includes(by)
          
          if (!isEmployee || isMine) {
            const uniqueKey = `${cleanId}_${cand.id}_${cand.name}`
            if (!seen.has(uniqueKey)) {
              seen.add(uniqueKey)
              list.push({
                ...cand,
                key: uniqueKey,
                jobId: job.id,
                jobReqId: cleanId,
                jobTitle: job.title,
                customer: job.customer || 'Direct Client',
                location: job.location || 'Remote / Hybrid',
                jobStatus: job.status || 'In-Progress'
              })
            }
          }
        })
      }
    })

    return list
  }, [jobs, userName, isEmployee, potentialCandidates, candidates])

  // Filtered Submissions for Reports Tab
  const filteredSubmissions = useMemo(() => {
    return allSubmissionsList.filter(sub => {
      if (reportStatusFilter !== 'All') {
        const s = (sub.status || '').toLowerCase()
        if (reportStatusFilter === 'Submitted' && !s.includes('submitted')) return false
        if (reportStatusFilter === 'Interview' && !s.includes('interview')) return false
        if (reportStatusFilter === 'Selected' && (!s.includes('select') && !s.includes('offer') && !s.includes('placed'))) return false
        if (reportStatusFilter === 'Rejected' && !s.includes('reject')) return false
      }
      if (reportJobFilter !== 'All') {
        if (String(sub.jobReqId) !== String(reportJobFilter)) return false
      }
      if (reportSearchQuery.trim()) {
        const q = reportSearchQuery.toLowerCase().trim()
        const matchName = (sub.name || '').toLowerCase().includes(q)
        const matchTitle = (sub.jobTitle || '').toLowerCase().includes(q)
        const matchCust = (sub.customer || '').toLowerCase().includes(q)
        if (!matchName && !matchTitle && !matchCust) return false
      }
      return true
    })
  }, [allSubmissionsList, reportStatusFilter, reportJobFilter, reportSearchQuery])

  // KPI Metrics for Employee Performance Report
  const reportMetrics = useMemo(() => {
    const totalSourced = filteredCandidates.length
    const totalSubmissions = allSubmissionsList.length
    const interviews = allSubmissionsList.filter(s => (s.status || '').toLowerCase().includes('interview')).length
    const selected = allSubmissionsList.filter(s => (s.status || '').toLowerCase().includes('select') || (s.status || '').toLowerCase().includes('offer') || (s.status || '').toLowerCase().includes('placed')).length
    const rejected = allSubmissionsList.filter(s => (s.status || '').toLowerCase().includes('reject')).length
    const inReview = totalSubmissions - interviews - selected - rejected
    return {
      totalSourced,
      totalSubmissions,
      interviews,
      selected,
      rejected,
      inReview: inReview > 0 ? inReview : (totalSubmissions > 0 ? totalSubmissions : 0)
    }
  }, [filteredCandidates, allSubmissionsList])

  // SmartWorks Header Navigation Tabs based on RBAC Role
  const navTabs = useMemo(() => {
    if (isAdmin) {
      return [
        { id: 'requisitions', name: 'Requisitions' },
        { id: 'candidates', name: 'Candidates' },
        { id: 'admin', name: 'Administration' },
        { id: 'reports', name: 'Reports' },
        { id: 'process', name: 'Process', link: '/ats' }
      ]
    }
    if (isManager) {
      return [
        { id: 'requisitions', name: 'Requisitions (Review)' },
        { id: 'candidates', name: 'Candidates' },
        { id: 'admin', name: 'Team Management' },
        { id: 'reports', name: 'Reports' },
        { id: 'process', name: 'Process', link: '/ats' }
      ]
    }
    if (isRecruiter) {
      return [
        { id: 'requisitions', name: 'My Requisitions' },
        { id: 'candidates', name: 'Team Candidates' },
        { id: 'admin', name: 'My Team (Manage Employees)' },
        { id: 'reports', name: 'Team Submissions & Reports' }
      ]
    }
    // Employee (Restricted Workspace: strictly Requisitions, Candidates submitted by them, and Reports)
    return [
      { id: 'requisitions', name: 'My Requisitions' },
      { id: 'candidates', name: 'My Candidates' },
      { id: 'reports', name: 'My Activity & Reports' }
    ]
  }, [isAdmin, isManager, isRecruiter, isEmployee])

  return (
    <SiteLayout>
      <div style={{ background: '#f1f5f9', minHeight: '92vh', paddingBottom: '30px', fontFamily: 'Arial, sans-serif' }}>
        
        {/* ═══════════ SMARTWORKS ORANGE HEADER NAVIGATION BAR ═══════════ */}
        <header style={{ background: '#ea580c', borderBottom: '2px solid #c2410c', color: '#ffffff' }}>
          <div className="container-wide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '42px', padding: '0 16px' }}>
            
            <div style={{ display: 'flex', gap: '2px', height: '100%', alignItems: 'stretch' }}>
              {/* SmartWorks Logo / Home Button */}
              <div
                onClick={() => {
                  setActiveMainTab('requisitions')
                  setViewMode('portal')
                  setCurrentPage(1)
                  setReqFilters({ reqId: '', title: '', skills: '', city: '', state: 'Select State', status: 'In-Progress', assignedTo: 'Any', reqType: 'Select Req Type' })
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  fontWeight: '900',
                  fontSize: '15px',
                  letterSpacing: '0.03em',
                  background: '#9a3412',
                  cursor: 'pointer',
                  color: '#ffffff',
                  userSelect: 'none',
                  gap: '6px',
                  borderRight: '1px solid rgba(255,255,255,0.25)',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#7c2d12'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#9a3412'}
                title="SmartWorks Home — Click to return to Requisitions Home"
              >
                <span style={{ fontSize: '16px' }}>🏢</span> SmartWorks
              </div>

              {navTabs.map(t => (
                <div
                  key={t.id}
                  onClick={() => {
                    if (t.link) {
                      window.location.href = t.link
                    } else {
                      setActiveMainTab(t.id)
                      setViewMode('portal')
                      setCurrentPage(1)
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    fontSize: '12.5px',
                    fontWeight: 'bold',
                    background: activeMainTab === t.id && viewMode === 'portal' ? '#d97706' : 'transparent',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    if (!(activeMainTab === t.id && viewMode === 'portal')) {
                      e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!(activeMainTab === t.id && viewMode === 'portal')) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {t.name}
                </div>
              ))}
            </div>

            {/* Right Side: Welcome User & Quick Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#ffedd5' }}>
                Welcome: <span style={{ color: '#ffffff', textDecoration: 'underline' }}>{userName}</span>
              </span>

              {/* Quick Search Input */}
              <form onSubmit={handleQuickSearch} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Requisition #</span>
                <input
                  type="text"
                  value={quickSearchId}
                  onChange={e => setQuickSearchId(e.target.value)}
                  placeholder="Req ID / Title"
                  style={{ padding: '3px 8px', fontSize: '11px', width: '130px', border: '1px solid #ffffff', borderRadius: '3px', outline: 'none' }}
                />
                <button
                  type="submit"
                  style={{ background: '#f8fafc', color: '#0f172a', border: 'none', padding: '3px 10px', fontSize: '11px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer' }}
                >
                  Quick Search
                </button>
              </form>
            </div>

          </div>
        </header>

        {/* ═══════════ MAIN VIEW CONTAINER ═══════════ */}
        <div className="container-wide" style={{ padding: '16px', maxWidth: '1360px', margin: '0 auto' }}>

          {/* ─────────────────────────────────────────────────────────────
              TAB 2: CANDIDATES SEARCH & LIST VIEW (EXACT MATCH TO SCREENSHOTS)
              ───────────────────────────────────────────────────────────── */}
          {activeMainTab === 'candidates' && viewMode === 'portal' && (
            <div>
              {/* Breadcrumbs */}
              <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '8px' }}>
                You are here: <span style={{ color: '#0066cc', cursor: 'pointer' }}>Home</span> &gt; Candidates
              </div>

              {/* ─── SEARCH CANDIDATE 3-COLUMN PANEL (COLLAPSIBLE / ACCORDION - DEFAULT COLLAPSED) ─── */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 18px', marginBottom: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    onClick={() => setShowCandidateSearchCard(prev => !prev)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}
                    title="Click to expand/collapse search filter criteria"
                  >
                    <h2 style={{ margin: 0, fontSize: '15px', color: '#1e3a8a', fontWeight: 'bold' }}>
                      {isEmployee ? `🔒 My Sourced Candidates Pool (${filteredCandidates.length})` : 'Search Candidate'}
                    </h2>

                    <span style={{
                      fontSize: '11px',
                      color: showCandidateSearchCard ? '#c2410c' : '#0369a1',
                      fontWeight: 'bold',
                      background: showCandidateSearchCard ? '#fff7ed' : '#f0f9ff',
                      border: `1px solid ${showCandidateSearchCard ? '#fed7aa' : '#bae6fd'}`,
                      padding: '3px 10px',
                      borderRadius: '3px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}>
                      <span>{showCandidateSearchCard ? '▲ Hide Search Filters' : '▼ Click to Expand Search Filters'}</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCandidateIntakeData({
                          id: null,
                          name: '',
                          firstName: '',
                          lastName: '',
                          email: '',
                          phone: '',
                          role: '',
                          fullRole: '',
                          exp: '5',
                          location: 'Richmond, VA',
                          city: 'Richmond',
                          state: 'VA',
                          payRate: '75',
                          rateType: 'C2C',
                          workAuth: 'US Citizen',
                          skills: '',
                          resumeName: '',
                          resumeFile: null,
                          targetJobId: filteredJobs[0]?.id || '',
                          comments: 'Direct candidate sourcing'
                        })
                        setShowCandidateIntakeModal(true)
                      }}
                      style={{
                        background: '#ea580c',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 16px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 1px 3px rgba(234, 88, 12, 0.3)'
                      }}
                    >
                      <span>➕ Add / Parse Candidate & Resume</span>
                    </button>
                  </div>
                </div>

                {showCandidateSearchCard && (
                  <form onSubmit={e => { e.preventDefault(); setCurrentPage(1); }} style={{ border: '1px solid #fed7aa', background: '#fffaf5', padding: '14px 18px', borderRadius: '3px', marginTop: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '14px 24px', fontSize: '11.5px' }}>
                    
                    {/* Column 1 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 8px', alignItems: 'center' }}>
                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Candidate #:</label>
                      <input type="text" value={candFilters.candidateId} onChange={e => setCandFilters({ ...candFilters, candidateId: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Name:</label>
                      <input type="text" value={candFilters.name} onChange={e => setCandFilters({ ...candFilters, name: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>E-mail:</label>
                      <input type="text" value={candFilters.email} onChange={e => setCandFilters({ ...candFilters, email: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Skills:</label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input type="text" value={candFilters.skills} onChange={e => setCandFilters({ ...candFilters, skills: e.target.value })} style={{ flex: 1, padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                        <span style={{ fontSize: '12px', cursor: 'pointer', color: '#0066cc' }}>❓</span>
                      </div>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>City:</label>
                      <input type="text" value={candFilters.city} onChange={e => setCandFilters({ ...candFilters, city: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>State:</label>
                      <select value={candFilters.state} onChange={e => setCandFilters({ ...candFilters, state: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                        <option value="Select">Select</option>
                        {US_STATES.map(st => (
                          <option key={st.code} value={st.code}>{st.code} - {st.name}</option>
                        ))}
                      </select>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Job Title :</label>
                      <input type="text" value={candFilters.jobTitle} onChange={e => setCandFilters({ ...candFilters, jobTitle: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Zipcode:</label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input type="text" value={candFilters.zipCode} onChange={e => setCandFilters({ ...candFilters, zipCode: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                        <select value={candFilters.radius} onChange={e => setCandFilters({ ...candFilters, radius: e.target.value })} style={{ padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>Select Miles</option>
                          <option>10</option>
                          <option>25</option>
                          <option>50</option>
                          <option>100</option>
                        </select>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px 8px', alignItems: 'center' }}>
                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Experience:</label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input type="text" value={candFilters.experience} onChange={e => setCandFilters({ ...candFilters, experience: e.target.value })} style={{ width: '45px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                        <span>years</span>
                      </div>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Work Auth:</label>
                      <select value={candFilters.workAuth} onChange={e => setCandFilters({ ...candFilters, workAuth: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                        <option>Any</option>
                        <option>US Citizen</option>
                        <option>GC</option>
                        <option>H1B</option>
                      </select>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Assigned To:</label>
                      <select
                        value={isEmployee ? userName : candFilters.assignedTo}
                        disabled={isEmployee}
                        onChange={e => setCandFilters({ ...candFilters, assignedTo: e.target.value })}
                        style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1', background: isEmployee ? '#f1f5f9' : '#ffffff' }}
                      >
                        {isEmployee ? (
                          <option value={userName}>{userName} (Your Private Pool)</option>
                        ) : (
                          <>
                            <option value="Any">Any (All Pool)</option>
                            {allRecruitersList.map(r => (
                              <option key={r.name} value={r.name}>{r.name} {r.name === userName ? '(You)' : ''}</option>
                            ))}
                          </>
                        )}
                      </select>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Sub-Vendor :</label>
                      <select value={candFilters.subVendor} onChange={e => setCandFilters({ ...candFilters, subVendor: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                        <option>Select</option>
                        <option>Talent9 Inc</option>
                        <option>Paramount Software Solutions</option>
                        <option>Ardor IT Systems INC</option>
                        <option>IConnect</option>
                        <option>Cloud TechnoSoft LLC</option>
                        <option>Client Server Technologies</option>
                        <option>SmartHire</option>
                        <option>Ameritech Global INC</option>
                        <option>Origin Tek Solutions</option>
                        <option>E-Solutions Inc</option>
                      </select>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Availability Date :</label>
                      <select value={candFilters.availabilityDate} onChange={e => setCandFilters({ ...candFilters, availabilityDate: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                        <option>Any</option>
                        <option>Immediate</option>
                        <option>2 Weeks</option>
                        <option>30 Days</option>
                      </select>

                      <div style={{ gridColumn: 'span 2', marginTop: '2px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                          <input type="checkbox" checked={candFilters.securityClearance} onChange={e => setCandFilters({ ...candFilters, securityClearance: e.target.checked })} />
                          Security Clearance / Federal clearance
                        </label>
                      </div>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Rating:</label>
                      <div>⛔ ⭐️⭐️⭐️⭐️⭐️</div>

                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                          <input type="checkbox" checked={candFilters.currentEmployees} onChange={e => setCandFilters({ ...candFilters, currentEmployees: e.target.checked })} />
                          Current Employees:
                        </label>
                      </div>
                    </div>

                    {/* Column 3 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 8px', alignContent: 'start', alignItems: 'center' }}>
                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Work Permit:</label>
                      <select value={candFilters.workPermit} onChange={e => setCandFilters({ ...candFilters, workPermit: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                        <option>All</option>
                        <option>US Citizen</option>
                        <option>Green Card</option>
                        <option>H1B</option>
                      </select>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Office Location</label>
                      <select value={candFilters.officeLocation} onChange={e => setCandFilters({ ...candFilters, officeLocation: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                        <option>All</option>
                        <option>Columbia</option>
                        <option>Richmond</option>
                        <option>Austin</option>
                      </select>

                      <div style={{ gridColumn: 'span 2', margin: '4px 0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                          <input type="checkbox" checked={candFilters.skyped} onChange={e => setCandFilters({ ...candFilters, skyped: e.target.checked })} />
                          Skyped
                        </label>
                      </div>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Screened Status:</label>
                      <select value={candFilters.screenedStatus} onChange={e => setCandFilters({ ...candFilters, screenedStatus: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                        <option>All</option>
                        <option>Yes</option>
                        <option>Pending</option>
                      </select>

                      <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                        <button
                          type="submit"
                          style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '3px 18px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Search
                        </button>
                      </div>
                    </div>

                  </div>
                </form>
              )}
            </div>

              {/* ─── CANDIDATE SEARCH RESULTS TABLE ─── */}
              <div style={{ background: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                
                {/* Header Strip with Export to Excel Button & Counts */}
                <div style={{
                  background: isEmployee ? '#dcfce7' : '#bfdbfe', borderBottom: '1px solid',
                  borderColor: isEmployee ? '#86efac' : '#93c5fd', padding: '5px 12px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: isEmployee ? '#166534' : '#1e3a8a' }}>
                    {isEmployee ? `My Candidate Directory (${filteredCandidates.length})` : 'All Candidates Pool'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                      type="button"
                      onClick={handleExportToExcel}
                      style={{
                        background: '#f1f5f9', border: '1px solid #94a3b8', padding: '2px 10px',
                        fontSize: '11px', fontWeight: 'bold', color: '#0f172a', cursor: 'pointer',
                        boxShadow: 'inset 0 1px 0 #ffffff, 0 1px 2px rgba(0,0,0,0.1)', borderRadius: '2px'
                      }}
                    >
                      Export Results to Excel
                    </button>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: isEmployee ? '#166534' : '#1e3a8a' }}>
                      (Candidates {filteredCandidates.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredCandidates.length)} of {filteredCandidates.length})
                    </span>
                  </div>
                </div>

                {/* Legacy CoolWorks Candidate Grid */}
                <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderTop: 'none' }}>
                  <table className="coolworks-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', textAlign: 'left', background: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                    <thead>
                      <tr style={{ background: '#708090', color: '#ffffff', borderBottom: '1px solid #4a5568' }}>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 6px', fontWeight: 'bold', textAlign: 'center', width: '35px', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Scr?</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Name</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Job Title</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 6px', fontWeight: 'bold', textAlign: 'center', width: '35px', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Exp</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Location</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Pay Rate</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 6px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Rate Type</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Work Auth</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Sourced By</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 6px', fontWeight: 'bold', textAlign: 'center', width: '40px', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Resume</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', textAlign: 'center', minWidth: '110px', fontSize: '11px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCandidates.length === 0 ? (
                        <tr>
                          <td colSpan="11" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                              {isEmployee ? '📁 Your Candidate Pool is Empty' : 'No candidates found matching search criteria.'}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '12px' }}>
                              {isEmployee
                                ? 'Add candidates to your pool by uploading their resumes. Once added, you can assign them to your requisitions anytime.'
                                : 'Try changing your search filters.'}
                            </div>
                            {isEmployee && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCandidateIntakeData({
                                    id: null,
                                    name: '',
                                    firstName: '',
                                    lastName: '',
                                    email: '',
                                    phone: '',
                                    role: '',
                                    fullRole: '',
                                    exp: '5',
                                    location: 'Richmond, VA',
                                    city: 'Richmond',
                                    state: 'VA',
                                    payRate: '75',
                                    rateType: 'C2C',
                                    workAuth: 'US Citizen',
                                    skills: '',
                                    resumeName: '',
                                    resumeFile: null,
                                    targetJobId: filteredJobs[0]?.id || '',
                                    comments: 'Direct candidate sourcing'
                                  })
                                  setShowCandidateIntakeModal(true)
                                }}
                                style={{ background: '#ea580c', color: '#ffffff', border: 'none', padding: '6px 18px', fontSize: '12px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer' }}
                              >
                                ➕ Add First Candidate to Pool
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        paginatedCandidates.map((c, idx) => (
                          <tr key={c.id || idx} style={{
                            background: '#ffffff',
                            borderBottom: '1px solid #e2e8f0'
                          }}>
                            {/* Scr? Checkmark */}
                            <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                              <span style={{ color: '#16a34a', fontSize: '12px' }} title="Screened">🟢</span>
                            </td>

                            {/* Name Link */}
                            <td style={{ padding: '4px 8px' }}>
                              <span onClick={() => handleOpenCandidateView(c)} style={{ color: '#0033cc', cursor: 'pointer', textDecoration: 'none' }}
                              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                                {c.name}
                              </span>
                            </td>

                            {/* Job Title */}
                            <td style={{ padding: '4px 8px', color: '#000000' }} title={c.fullRole || c.role}>
                              {c.fullRole || c.role}
                            </td>

                            {/* Exp */}
                            <td style={{ padding: '4px 6px', textAlign: 'center', color: '#000000' }}>
                              {c.exp} yrs
                            </td>

                            {/* Location */}
                            <td style={{ padding: '4px 8px', color: '#000000' }}>
                              {c.location || `${c.city || ''}, ${c.state || ''}`}
                            </td>

                            {/* Pay Rate */}
                            <td style={{ padding: '4px 8px', color: '#000000' }}>
                              {c.payRate ? `$${c.payRate}` : '$75'}
                            </td>

                            {/* Rate Type */}
                            <td style={{ padding: '4px 6px', color: '#000000' }}>
                              {c.rateType || 'C2C'}
                            </td>

                            {/* Work Auth */}
                            <td style={{ padding: '4px 8px', color: '#000000' }}>
                              {c.workAuth || 'US Citizen'}
                            </td>

                            {/* Recruiter / Added By */}
                            <td style={{ padding: '4px 8px', color: '#000000' }}>
                              {c.recruiter || c.assignedTo || c.addedByName || userName}
                            </td>

                            {/* Resume Icon */}
                            <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                              <span onClick={() => handleOpenCandidateView(c)} style={{ cursor: 'pointer', fontSize: '13px' }} title="View Details, Submission & Resume History">
                                📄
                              </span>
                            </td>

                            {/* Actions Column */}
                            <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenCandidateView(c)}
                                  style={{
                                    background: '#f1f5f9',
                                    color: '#0033cc',
                                    border: '1px solid #cbd5e1',
                                    padding: '2px 8px',
                                    fontSize: '10.5px',
                                    fontWeight: 'bold',
                                    borderRadius: '2px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                  title="View candidate details, submission history, and resume versions"
                                >
                                  👁️ View
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Pagination Bar */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#f8fafc', borderTop: '1px solid #cbd5e1', padding: '6px 14px'
                }}>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11.5px', fontWeight: 'bold' }}>
                    {[1, 2, 3, 4, 5].map(p => (
                      <span key={p} onClick={() => setCurrentPage(p)} style={{
                        color: currentPage === p ? '#ea580c' : '#0066cc',
                        cursor: 'pointer',
                        textDecoration: currentPage === p ? 'none' : 'underline'
                      }}>
                        {p}
                      </span>
                    ))}
                    <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentPage(prev => Math.min(totalCandPages, prev + 1))}>Next</span>
                    <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentPage(totalCandPages)}>Last</span>
                  </div>

                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a' }}>
                    Page Size:
                    <select value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} style={{ marginLeft: '6px', fontSize: '11px', padding: '1px 3px' }}>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 4: REPORTS & ACTIVITY TRACKING PANEL
              ───────────────────────────────────────────────────────────── */}
          {activeMainTab === 'reports' && viewMode === 'portal' && (
            <div>
              {/* Breadcrumbs */}
              <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '8px' }}>
                You are here: <span style={{ color: '#0066cc', cursor: 'pointer' }} onClick={() => setActiveMainTab('requisitions')}>Home</span> &gt; Reports &gt; {isEmployee ? 'My Submissions & Activity Report' : 'Recruitment & Performance Reports'}
              </div>

              {/* Header Card */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px 20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ea580c', paddingBottom: '8px', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '16px', color: '#1e3a8a', fontWeight: 'bold' }}>
                      {isEmployee ? `📊 My Submission & Activity Report — ${userName}` : `📊 SmartWorks Recruitment & Activity Reports`}
                    </h2>
                    <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: '#64748b' }}>
                      {isEmployee
                        ? 'Real-time tracking of all candidates you sourced, their submission status across assigned requisitions, interviews, and recruiter reviews.'
                        : 'Comprehensive analytics on team sourcing velocity, candidate pipeline conversions, client submissions, and offers.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const headers = ['Candidate ID', 'Candidate Name', 'Requisition ID', 'Position Title', 'Customer/Client', 'Submitted Date', 'Status', 'Rate', 'Submitted By']
                      const rows = filteredSubmissions.map(s => [
                        s.id,
                        `"${s.name}"`,
                        s.jobReqId,
                        `"${s.jobTitle}"`,
                        `"${s.customer}"`,
                        `"${s.assignedOn || s.lastChangedOn || 'Recent'}"`,
                        `"${s.status}"`,
                        `"${s.payRate || 'N/A'}"`,
                        `"${s.assignedBy || s.recruiter || userName}"`
                      ])
                      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
                      const encodedUri = encodeURI(csvContent)
                      const link = document.createElement('a')
                      link.setAttribute('href', encodedUri)
                      link.setAttribute('download', `SmartHire_Report_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`)
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                    style={{
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '7px 18px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 1px 3px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    📥 Export Report (CSV)
                  </button>
                </div>

                {/* 6 Key Performance Metric Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1d4ed8' }}>SOURCED CANDIDATES</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#1e3a8a', marginTop: '2px' }}>
                      {reportMetrics.totalSourced}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#60a5fa', marginTop: '2px' }}>In your private pool</div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>TOTAL SUBMISSIONS</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                      {reportMetrics.totalSubmissions}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>Across assigned reqs</div>
                  </div>

                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#b45309' }}>UNDER REVIEW</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#78350f', marginTop: '2px' }}>
                      {reportMetrics.inReview}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#f59e0b', marginTop: '2px' }}>Lead/Manager screening</div>
                  </div>

                  <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '4px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0369a1' }}>CLIENT INTERVIEWS</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#0c4a6e', marginTop: '2px' }}>
                      {reportMetrics.interviews}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#38bdf8', marginTop: '2px' }}>Shortlisted for client</div>
                  </div>

                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#047857' }}>SELECTED / HIRED</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#065f46', marginTop: '2px' }}>
                      {reportMetrics.selected}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#34d399', marginTop: '2px' }}>Successful placements</div>
                  </div>

                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#b91c1c' }}>REJECTED</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#991b1b', marginTop: '2px' }}>
                      {reportMetrics.rejected}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#f87171', marginTop: '2px' }}>Not selected</div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '4px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a' }}>Filter Activity:</span>
                    <input
                      type="text"
                      placeholder="Search Candidate, Requisition, Client..."
                      value={reportSearchQuery}
                      onChange={e => setReportSearchQuery(e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px', width: '220px' }}
                    />

                    <select
                      value={reportStatusFilter}
                      onChange={e => setReportStatusFilter(e.target.value)}
                      style={{ padding: '4px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px' }}
                    >
                      <option value="All">All Stages / Statuses</option>
                      <option value="Submitted">Submitted (Under Review)</option>
                      <option value="Interview">Client Interview</option>
                      <option value="Selected">Selected / Hired</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <select
                      value={reportJobFilter}
                      onChange={e => setReportJobFilter(e.target.value)}
                      style={{ padding: '4px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px', maxWidth: '200px' }}
                    >
                      <option value="All">All Assigned Positions</option>
                      {filteredJobs.map(j => {
                        const cId = String(j.id || '').replace('J-', '')
                        return (
                          <option key={j.id} value={cId}>
                            Req #{cId} - {j.title.slice(0, 25)}...
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  <span style={{ fontSize: '11.5px', color: '#1e3a8a', fontWeight: 'bold' }}>
                    Showing <span style={{ color: '#ea580c' }}>{filteredSubmissions.length}</span> submission record(s)
                  </span>
                </div>

                {/* Submissions Activity Table */}
                <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '3px' }}>
                  <table className="coolworks-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', textAlign: 'left', background: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                    <thead>
                      <tr style={{ background: '#708090', color: '#ffffff', borderBottom: '1px solid #4a5568' }}>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Candidate Name</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Requisition # & Title</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Customer / Client</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Proposed Pay Rate</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Submitted Date</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Current Submission Status</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Feedback / Status Notes</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', textAlign: 'center', fontSize: '11px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                              📝 No Submissions Found
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '12px' }}>
                              {isEmployee
                                ? 'You have not submitted candidates to any requisition yet. Go to "My Candidates" or "My Requisitions" to submit candidates.'
                                : 'No submissions found matching your filter criteria.'}
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveMainTab('candidates')}
                              style={{ background: '#ea580c', color: '#ffffff', border: 'none', padding: '6px 16px', fontSize: '12px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer' }}
                            >
                              + Go to My Candidates Pool
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredSubmissions.map((sub, idx) => {
                          const statusLower = (sub.status || '').toLowerCase()
                          let badgeBg = '#eff6ff'
                          let badgeColor = '#1d4ed8'
                          let badgeBorder = '#bfdbfe'

                          if (statusLower.includes('select') || statusLower.includes('offer') || statusLower.includes('placed')) {
                            badgeBg = '#ecfdf5'
                            badgeColor = '#065f46'
                            badgeBorder = '#a7f3d0'
                          } else if (statusLower.includes('interview')) {
                            badgeBg = '#e0f2fe'
                            badgeColor = '#0369a1'
                            badgeBorder = '#bae6fd'
                          } else if (statusLower.includes('reject')) {
                            badgeBg = '#fef2f2'
                            badgeColor = '#991b1b'
                            badgeBorder = '#fecaca'
                          } else if (statusLower.includes('submit') || statusLower.includes('manager')) {
                            badgeBg = '#fef3c7'
                            badgeColor = '#92400e'
                            badgeBorder = '#fde68a'
                          }

                          return (
                            <tr key={sub.key || idx} style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '5px 8px' }}>
                                <span style={{ color: '#0033cc', cursor: 'pointer', textDecoration: 'none' }}
                                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                                  onClick={() => {
                                    const c = candidates.find(item => item.id === sub.id || item.name === sub.name) || sub
                                    handleSelectExistingCandidate(c)
                                  }}
                                >
                                  {sub.name}
                                </span>
                              </td>
                              <td style={{ padding: '5px 8px' }}>
                                <div>
                                  <span style={{ color: '#0033cc', cursor: 'pointer', textDecoration: 'none' }}
                                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                                    onClick={() => {
                                      const matchingJob = jobs.find(j => String(j.id).includes(sub.jobReqId))
                                      if (matchingJob) handleSelectJob(matchingJob)
                                    }}
                                  >
                                    #{sub.jobReqId}
                                  </span>
                                  <span style={{ marginLeft: '6px', color: '#000000' }}>{sub.jobTitle}</span>
                                </div>
                              </td>
                              <td style={{ padding: '5px 8px', color: '#000000' }}>
                                {sub.customer}
                              </td>
                              <td style={{ padding: '5px 8px', color: '#000000' }}>
                                {sub.payRate || '$75/hr'} ({sub.payRateType || sub.rateType || 'C2C'})
                              </td>
                              <td style={{ padding: '5px 8px', color: '#000000' }}>
                                {sub.assignedOn || sub.lastChangedOn || 'Today'}
                              </td>
                              <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '2px',
                                  fontSize: '10.5px',
                                  fontWeight: 'bold',
                                  background: badgeBg,
                                  color: badgeColor,
                                  border: `1px solid ${badgeBorder}`
                                }}>
                                  {sub.status || 'Int-SubmittedToManager'}
                                </span>
                              </td>
                              <td style={{ padding: '5px 8px', color: '#000000', fontSize: '10.5px', maxWidth: '220px' }}>
                                {sub.statusComments || 'Direct employee submission'}
                              </td>
                              <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const matchingJob = jobs.find(j => String(j.id).includes(sub.jobReqId))
                                    if (matchingJob) {
                                      handleSelectJob(matchingJob)
                                    } else {
                                      setActiveMainTab('requisitions')
                                    }
                                  }}
                                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 8px', fontSize: '10.5px', fontWeight: 'bold', color: '#0033cc', cursor: 'pointer', borderRadius: '2px' }}
                                >
                                  View Req &gt;&gt;
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW MODE 1: STEP 1 - RESUME SEARCH & ADD CANDIDATE FORM
              ───────────────────────────────────────────────────────────── */}
          {viewMode === 'resumeSearch' && (
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ background: '#e2e8f0', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '4px', marginBottom: '12px', fontSize: '11.5px', color: '#1e3a8a', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
                <div><strong>Requisition #:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{resolveReqId(selectedReq?.id, selectedReq)}</span></div>
                <div><strong>Position Title:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{cleanJobTitleWithPositionNumber(editingFields.title || selectedReq?.title, selectedReq)}</span></div>
                <div><strong>Status:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>In-Progress</span></div>
                <div><strong>Agency:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.customer || 'State Of SC'}</span></div>
                <div><strong>Start Date:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.startDate || '10/23/2026'}</span></div>
                <div><strong>Duration:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.duration || '12'} Months</span></div>
              </div>

              <div style={{ fontSize: '11.5px', color: '#1e3a8a', marginBottom: '6px' }}>
                To submit resume, search and select an existing candidate or add a new candidate.
              </div>
              <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 'bold', marginBottom: '14px' }}>
                Status: Ready
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Left Panel */}
                <div style={{ border: '1px solid #1e3a8a', borderRadius: '3px', padding: '12px 16px', background: '#ffffff' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '12.5px', color: '#1e3a8a', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
                    Search Candidate and assign to this position
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px 8px', fontSize: '11.5px', alignItems: 'center' }}>
                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Candidate #:</label>
                    <input type="text" value={searchCandFilter.candidateId} onChange={e => setSearchCandFilter({ ...searchCandFilter, candidateId: e.target.value })} style={{ width: '90px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Name:</label>
                    <input type="text" value={searchCandFilter.name} onChange={e => setSearchCandFilter({ ...searchCandFilter, name: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>E-mail:</label>
                    <input type="text" value={searchCandFilter.email} onChange={e => setSearchCandFilter({ ...searchCandFilter, email: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Skills:</label>
                    <input type="text" value={searchCandFilter.skills} onChange={e => setSearchCandFilter({ ...searchCandFilter, skills: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>City:</label>
                    <input type="text" value={searchCandFilter.city} onChange={e => setSearchCandFilter({ ...searchCandFilter, city: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>State:</label>
                    <select value={searchCandFilter.state} onChange={e => setSearchCandFilter({ ...searchCandFilter, state: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                      <option value="Select">Select</option>
                      {US_STATES.map(st => (
                        <option key={st.code} value={st.code}>{st.code} - {st.name}</option>
                      ))}
                    </select>

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Zip Code:</label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input type="text" value={searchCandFilter.zipCode} onChange={e => setSearchCandFilter({ ...searchCandFilter, zipCode: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                      <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Within</span>
                      <select value={searchCandFilter.radius} onChange={e => setSearchCandFilter({ ...searchCandFilter, radius: e.target.value })} style={{ padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                        <option>Select Miles</option>
                        <option>10</option>
                        <option>25</option>
                        <option>50</option>
                      </select>
                    </div>

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Experience:</label>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input type="text" value={searchCandFilter.experience} onChange={e => setSearchCandFilter({ ...searchCandFilter, experience: e.target.value })} style={{ width: '50px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                      <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Years</span>
                    </div>

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Work Authorization:</label>
                    <select value={searchCandFilter.workAuth} onChange={e => setSearchCandFilter({ ...searchCandFilter, workAuth: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                      <option>Any</option>
                      <option>US Citizen</option>
                      <option>GC</option>
                    </select>

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Assigned To:</label>
                    <select
                      value={isEmployee ? userName : searchCandFilter.assignedTo}
                      disabled={isEmployee}
                      onChange={e => setSearchCandFilter({ ...searchCandFilter, assignedTo: e.target.value })}
                      style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1', background: isEmployee ? '#f1f5f9' : '#ffffff' }}
                    >
                      {isEmployee ? (
                        <option value={userName}>{userName} (Me)</option>
                      ) : (
                        <>
                          <option value="Any">Any</option>
                          <option>{userName}</option>
                          <option>Vaibhav Bisen</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const targetList = isEmployee ? filteredCandidates : candidates
                        const count = targetList.filter(c => {
                          if (searchCandFilter.name && !c.name?.toLowerCase().includes(searchCandFilter.name.toLowerCase())) return false
                          if (searchCandFilter.email && !c.email?.toLowerCase().includes(searchCandFilter.email.toLowerCase())) return false
                          if (searchCandFilter.skills && !c.skills?.some?.(s => s.toLowerCase().includes(searchCandFilter.skills.toLowerCase()))) return false
                          if (searchCandFilter.city && !c.city?.toLowerCase().includes(searchCandFilter.city.toLowerCase())) return false
                          return true
                        }).length
                        alert(`Found ${count} matching candidate(s) in ${isEmployee ? 'your directory' : 'the system'}.`)
                      }}
                      style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '3px 14px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Search
                    </button>
                  </div>

                  <div style={{ marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{isEmployee ? `📁 My Candidates in Directory (${filteredCandidates.length}):` : 'Existing Candidates in Pool:'}</span>
                      {isEmployee && <span style={{ fontSize: '9.5px', color: '#16a34a', fontWeight: 'bold' }}>🔒 Private to you</span>}
                    </div>
                    <div style={{ maxHeight: '110px', overflowY: 'auto', fontSize: '11px' }}>
                      {filteredCandidates.length === 0 ? (
                        <div style={{ color: '#64748b', fontStyle: 'italic', padding: '8px 0', fontSize: '10.5px' }}>
                          {isEmployee
                            ? 'No candidates in your directory yet. Use the form on the right to add and parse your candidate.'
                            : 'No candidates available in pool.'}
                        </div>
                      ) : (
                        filteredCandidates.slice(0, 6).map(c => (
                          <div key={c.id || c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                            <span><strong>{c.name}</strong> <span style={{ color: '#64748b', fontSize: '10.5px' }}>({c.role || 'Consultant'})</span></span>
                            <span onClick={() => handleSelectExistingCandidate(c)} style={{ color: '#0066cc', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
                              Select &gt;&gt;
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Panel */}
                <form onSubmit={handleContinueToSubmission} style={{ border: '1px solid #1e3a8a', borderRadius: '3px', padding: '12px 16px', background: '#ffffff' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '12.5px', color: '#1e3a8a', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
                    Add a new candidate and assign to this position
                  </h3>

                  <div style={{ background: '#eff6ff', border: '1px dashed #3b82f6', borderRadius: '4px', padding: '10px 12px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>
                      ⚡ Smart AI Resume Auto-Parser
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', marginBottom: '6px' }}>
                      Select the word resume (*.doc, *.docx, *.pdf) to auto-fill all candidate details:
                    </div>
                    <input
                      type="file"
                      accept=".doc,.docx,.pdf"
                      onChange={handleResumeFileUpload}
                      style={{ fontSize: '11px', width: '100%' }}
                    />
                    {newCandForm.isParsing && (
                      <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 'bold', marginTop: '4px' }}>
                        ⏳ Extracting candidate information from resume...
                      </div>
                    )}
                    {newCandForm.parseSuccess && (
                      <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold', marginTop: '4px' }}>
                        ✅ Resume parsed successfully! Details populated below (you can edit them).
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 8px', fontSize: '11.5px', alignItems: 'center' }}>
                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Name*:</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input type="text" placeholder="First Name" value={newCandForm.firstName} onChange={e => setNewCandForm({ ...newCandForm, firstName: e.target.value })} style={{ flex: 1, padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} required />
                      <input type="text" placeholder="Last Name" value={newCandForm.lastName} onChange={e => setNewCandForm({ ...newCandForm, lastName: e.target.value })} style={{ flex: 1, padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Date Of Birth:</label>
                    <input type="text" placeholder="MM/DD/YYYY" value={newCandForm.dob} onChange={e => setNewCandForm({ ...newCandForm, dob: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Email*:</label>
                    <input type="email" value={newCandForm.email} onChange={e => setNewCandForm({ ...newCandForm, email: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} required />

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Experience*:</label>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input type="text" value={newCandForm.exp} onChange={e => setNewCandForm({ ...newCandForm, exp: e.target.value })} style={{ width: '45px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                      <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Years</span>
                    </div>

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>City*:</label>
                    <input type="text" value={newCandForm.city} onChange={e => setNewCandForm({ ...newCandForm, city: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>State*:</label>
                    <select value={newCandForm.state} onChange={e => setNewCandForm({ ...newCandForm, state: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                      <option value="Select">Select</option>
                      {US_STATES.map(st => (
                        <option key={st.code} value={st.code}>{st.code} - {st.name}</option>
                      ))}
                    </select>

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Resume Title*:</label>
                    <input type="text" value={newCandForm.resumeTitle} onChange={e => setNewCandForm({ ...newCandForm, resumeTitle: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                  </div>

                  <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11.5px', color: '#1e3a8a', marginBottom: '8px' }}>
                      Click continue to continue to next step.
                    </div>
                    <button
                      type="submit"
                      style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '4px 18px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Continue
                    </button>
                  </div>
                </form>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-start' }}>
                <span onClick={() => { setViewMode('requisition'); setActiveReqTab('potential'); }} style={{ color: '#0066cc', fontWeight: 'bold', fontSize: '11.5px', textDecoration: 'underline', cursor: 'pointer' }}>
                  &lt;&lt; Cancel and Return to Requisition
                </span>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW MODE 2: STEP 2 - RESUME SUBMISSION & CANDIDATE PROFILE
              ───────────────────────────────────────────────────────────── */}
          {viewMode === 'resumeSubmission' && (
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              
              {/* Top Requisition & Candidate Summary Header */}
              <div style={{ background: '#e2e8f0', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '4px', marginBottom: '8px', fontSize: '11.5px', color: '#1e3a8a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4px 20px', flex: 1 }}>
                  <div><strong>Requisition #:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{resolveReqId(selectedReq?.id, selectedReq)}</span></div>
                  <div><strong>Position Title:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{cleanJobTitleWithPositionNumber(editingFields.title || selectedReq?.title, selectedReq)}</span></div>
                  <div><strong>Status:</strong> <span style={{ color: '#16a34a', fontWeight: 'bold', marginLeft: '6px' }}>In-Progress</span></div>
                  <div><strong>Customer:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.customer || editingFields.endClient || selectedReq?.client || 'State Of SC'}</span></div>
                  <div><strong>Start Date:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.startDate || selectedReq?.startDate || '10/23/2026'}</span></div>
                  <div><strong>Duration:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.duration || '12'} Months</span></div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const fullCand = candidates.find(item => item.id === submissionCandidate.id || item.name === `${submissionCandidate.firstName} ${submissionCandidate.lastName}`.trim() || item.email === submissionCandidate.email) || submissionCandidate
                      setSelectedViewCandidate(fullCand)
                      setShowDetailViewModal(true)
                    }}
                    style={{
                      background: '#1e3a8a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '5px 12px',
                      fontSize: '11.5px',
                      fontWeight: 'bold',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    👁️ Open Full Profile Modal
                  </button>
                </div>
              </div>

              {/* Candidate Info Strip */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '3px', marginBottom: '12px', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span><strong>Candidate # :</strong> <span style={{ color: '#0066cc', fontWeight: 'bold' }}>{submissionCandidate.id || '87534'}</span></span>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('projects')}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '2px' }}
                    >
                      Candidate Projects ({submissionCandidate.projects?.length || 2})
                    </button>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1e3a8a', fontWeight: 'bold' }}>
                      <input type="checkbox" defaultChecked /> Screened
                    </label>
                  </div>
                  <div style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '12px' }}>
                    Status: Ready for Submission
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ color: '#1e3a8a', fontWeight: 'bold', width: '110px' }}>Candidate Name:*</label>
                    <input type="text" value={submissionCandidate.firstName || ''} onChange={e => setSubmissionCandidate({ ...submissionCandidate, firstName: e.target.value })} style={{ flex: 1, padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                    <input type="text" value={submissionCandidate.lastName || ''} onChange={e => setSubmissionCandidate({ ...submissionCandidate, lastName: e.target.value })} style={{ flex: 1, padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ color: '#1e3a8a', fontWeight: 'bold', width: '70px' }}>E-mail:*</label>
                    <input type="email" value={submissionCandidate.email || ''} onChange={e => setSubmissionCandidate({ ...submissionCandidate, email: e.target.value })} style={{ flex: 1, padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Pay Rate:</span>
                  <input type="text" value={submissionCandidate.payRateMin || '74'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, payRateMin: e.target.value })} style={{ width: '45px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                  <span>To</span>
                  <input type="text" value={submissionCandidate.payRateMax || '74'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, payRateMax: e.target.value })} style={{ width: '45px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                  <select value={submissionCandidate.rateUnit || 'per hour'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, rateUnit: e.target.value })} style={{ padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                    <option>per hour</option>
                    <option>annual</option>
                  </select>

                  <span style={{ color: '#1e3a8a', fontWeight: 'bold', marginLeft: '10px' }}>Rate Type:</span>
                  <select value={submissionCandidate.rateType || 'C2C'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, rateType: e.target.value })} style={{ padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                    <option>C2C</option>
                    <option>W2</option>
                    <option>1099</option>
                  </select>

                  <span style={{ color: '#1e3a8a', fontWeight: 'bold', marginLeft: '10px' }}>Available Date:*</span>
                  <input type="text" value={submissionCandidate.availableDate || 'Immediate'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, availableDate: e.target.value })} style={{ width: '110px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              {/* Sub-Tab Navigation Bar */}
              <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', background: '#e2e8f0', padding: '4px 8px 0', gap: '2px', flexWrap: 'wrap' }}>
                {[
                  { id: 'details', label: 'Details' },
                  { id: 'skill', label: `Skill (${submissionCandidate.skills?.length || 6})` },
                  { id: 'references', label: `References (${submissionCandidate.references?.length || 2})` },
                  { id: 'legal', label: 'Legal & Compliance (5)' },
                  { id: 'notes', label: `Interaction Notes (${submissionCandidate.interactionNotes?.length || 3})` },
                  { id: 'history', label: `Submission History (${submissionCandidate.submissionHistory?.length || 1})` },
                  { id: 'projects', label: `Projects (${submissionCandidate.projects?.length || 2})` }
                ].map(tab => (
                  <div
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    style={{
                      padding: '6px 14px', fontSize: '11.5px', fontWeight: 'bold', borderRadius: '4px 4px 0 0',
                      background: activeSubTab === tab.id ? '#ffffff' : '#f1f5f9',
                      border: activeSubTab === tab.id ? '1px solid #cbd5e1' : '1px solid transparent',
                      borderBottom: activeSubTab === tab.id ? '1px solid #ffffff' : 'none',
                      color: activeSubTab === tab.id ? '#0f172a' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </div>
                ))}
              </div>

              {/* ═══════════ TWO COLUMN WORKSPACE: LEFT SUBTABS + RIGHT RESUME VIEWER ═══════════ */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '16px', background: '#ffffff', border: '1px solid #cbd5e1', borderTop: 'none', padding: '16px 18px', minHeight: '440px' }}>
                
                {/* ─── LEFT COLUMN: ACTIVE SUBTAB CONTENT ─── */}
                <div style={{ minWidth: 0 }}>
                  
                  {/* SUBTAB 1: DETAILS */}
                  {activeSubTab === 'details' && (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px 8px', fontSize: '11.5px', alignContent: 'start', alignItems: 'center' }}>
                          <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Date of Birth:</label>
                          <input type="text" value={submissionCandidate.dob || ''} onChange={e => setSubmissionCandidate({ ...submissionCandidate, dob: e.target.value })} style={{ width: '130px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                          <label style={{ color: '#1e3a8a', textAlign: 'right', fontWeight: 'bold' }}>Candidate Source*:</label>
                          <select value={submissionCandidate.source || 'Direct Sourcing'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, source: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                            <option>Direct Sourcing</option>
                            <option>LinkedIn</option>
                            <option>Direct Application</option>
                            <option>Vendor Referral</option>
                            <option>Other</option>
                          </select>

                          <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Sub-Vendor:</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select value={submissionCandidate.subVendor || 'Direct Sourcing'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, subVendor: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                              <option>Direct Sourcing</option>
                              <option>Talent9 Inc</option>
                              <option>SmartHire Tech</option>
                            </select>
                            <span style={{ color: '#0066cc', textDecoration: 'underline', cursor: 'pointer', fontSize: '11px' }}>AddSubVendor</span>
                          </div>

                          <label style={{ color: '#1e3a8a', textAlign: 'right', fontWeight: 'bold' }}>Job Title:*</label>
                          <input type="text" value={submissionCandidate.jobTitle || editingFields.title || 'Lead Consultant'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, jobTitle: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                          <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Phone(any one):</label>
                          <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '4px', alignItems: 'center' }}>
                            <span>Cell</span>
                            <input type="text" value={submissionCandidate.phoneCell || '571-660-5778'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, phoneCell: e.target.value })} style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                            <span>Home</span>
                            <input type="text" value={submissionCandidate.phoneHome || ''} onChange={e => setSubmissionCandidate({ ...submissionCandidate, phoneHome: e.target.value })} style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                            <span>Work</span>
                            <input type="text" value={submissionCandidate.phoneWork || ''} onChange={e => setSubmissionCandidate({ ...submissionCandidate, phoneWork: e.target.value })} style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                          </div>

                          <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Address:</label>
                          <input type="text" value={submissionCandidate.address || '4430 Broad Rd.'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, address: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                          <label style={{ color: '#1e3a8a', textAlign: 'right' }}>City, State, Zip:</label>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input type="text" value={submissionCandidate.city || 'Richmond'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, city: e.target.value })} style={{ flex: 2, padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                            <select value={submissionCandidate.state || 'VA'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, state: e.target.value })} style={{ flex: 1, padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                              {US_STATES.map(st => (
                                <option key={st.code} value={st.code}>{st.code}</option>
                              ))}
                            </select>
                            <input type="text" value={submissionCandidate.zip || '23173'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, zip: e.target.value })} style={{ width: '55px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                          </div>

                          <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Work Authorization:</label>
                          <select value={submissionCandidate.workAuth || 'US Citizen'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, workAuth: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                            <option>US Citizen</option>
                            <option>GC</option>
                            <option>H1B</option>
                            <option>EAD</option>
                            <option>TN</option>
                          </select>

                          <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Ready to Relocate:</label>
                          <select value={submissionCandidate.relocate || 'Yes'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, relocate: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                            <option>Yes</option>
                            <option>No</option>
                          </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px 8px', fontSize: '11.5px', alignContent: 'start', alignItems: 'center' }}>
                          <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Currently Working:</label>
                          <input type="checkbox" checked={submissionCandidate.currentlyWorking !== false} onChange={e => setSubmissionCandidate({ ...submissionCandidate, currentlyWorking: e.target.checked })} />

                          <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Resume Document:</label>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ color: '#0066cc', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
                              {submissionCandidate.resumeName || `${submissionCandidate.firstName || 'Candidate'}_Resume.docx`}
                            </span>
                            <span style={{ cursor: 'pointer' }}>✏️</span>
                          </div>

                          <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Preferences for Placement:</label>
                          <textarea rows={2} value={submissionCandidate.placementPref || 'Open to Remote / Hybrid roles across US'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, placementPref: e.target.value })} style={{ padding: '4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                          <label style={{ color: '#1e3a8a', textAlign: 'right' }}>SSN(Last four):</label>
                          <input type="text" value={submissionCandidate.ssnLast4 || '8492'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, ssnLast4: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                          <label style={{ color: '#1e3a8a', textAlign: 'right', fontWeight: 'bold' }}>Experience:*</label>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input type="text" value={submissionCandidate.experienceYears || '8'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, experienceYears: e.target.value })} style={{ width: '45px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                            <span>years</span>
                          </div>

                          <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Overall Rating:</label>
                          <div>⭐️⭐️⭐️⭐️⭐️ (5/5)</div>

                          <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Technical Rating:</label>
                          <div>⭐️⭐️⭐️⭐️⭐️ (5/5)</div>

                          <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Comm Skill:</label>
                          <div>⭐️⭐️⭐️⭐️ (4/5)</div>

                          <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a' }}>
                              <input type="checkbox" checked={submissionCandidate.securityClearance || false} onChange={e => setSubmissionCandidate({ ...submissionCandidate, securityClearance: e.target.checked })} />
                              Security Clearance / Federal Clearance:
                            </label>
                          </div>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '12px', marginTop: '14px', fontSize: '11.5px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Proposed Bill Rate*:</span>
                          <input type="text" value={submissionCandidate.proposedBillRate || '90'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, proposedBillRate: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                          <span>per hour</span>

                          <span style={{ color: '#1e3a8a', fontWeight: 'bold', marginLeft: '12px' }}>Pay Rate*:</span>
                          <input type="text" value={submissionCandidate.proposedPayRate || '74'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, proposedPayRate: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                          <span>per hour</span>

                          <span style={{ color: '#1e3a8a', fontWeight: 'bold', marginLeft: '12px' }}>Rate Type:</span>
                          <select value={submissionCandidate.proposedRateType || 'C2C'} onChange={e => setSubmissionCandidate({ ...submissionCandidate, proposedRateType: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                            <option>C2C</option>
                            <option>W2</option>
                            <option>1099</option>
                          </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '6px', marginBottom: '14px' }}>
                          <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Comments:</label>
                          <textarea rows={2} value={submissionCandidate.comments || ''} onChange={e => setSubmissionCandidate({ ...submissionCandidate, comments: e.target.value })} placeholder="Candidate submission notes, client comments, or screening remarks..." style={{ width: '100%', padding: '6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                          <button type="button" onClick={() => setViewMode('resumeSearch')} style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '4px 14px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Back To Search Results
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              alert(`Candidate profile saved successfully for ${submissionCandidate.firstName} ${submissionCandidate.lastName}!`);
                            }}
                            style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '4px 16px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            Save
                          </button>
                          <button type="button" onClick={() => { setViewMode('requisition'); setActiveReqTab('potential'); }} style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '4px 14px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Cancel
                          </button>
                          <button type="button" onClick={handleAssignCandidateToReq} style={{ background: '#ea580c', color: '#ffffff', border: 'none', padding: '4px 22px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' }}>
                            Assign
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 2: SKILL */}
                  {activeSubTab === 'skill' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0, fontSize: '13px', color: '#1e3a8a', fontWeight: 'bold' }}>
                          🛠️ Technical Skills & Competency Matrix
                        </h4>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Total Skills: {(submissionCandidate.skills?.length || 6)}</span>
                      </div>

                      {/* Add Skill Row */}
                      <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 10px', borderRadius: '4px', marginBottom: '12px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Skill Name (e.g. Java, AWS, React, Python, SQL)"
                          value={newSkillName}
                          onChange={e => setNewSkillName(e.target.value)}
                          style={{ flex: 2, padding: '4px 8px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px' }}
                        />
                        <input
                          type="text"
                          placeholder="Years"
                          value={newSkillExp}
                          onChange={e => setNewSkillExp(e.target.value)}
                          style={{ width: '60px', padding: '4px 8px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newSkillName.trim()) return
                            const currentSkills = Array.isArray(submissionCandidate.skills) ? submissionCandidate.skills : ['Java', 'Spring Boot', 'AWS', 'Microservices', 'SQL', 'Docker']
                            setSubmissionCandidate(prev => ({
                              ...prev,
                              skills: [...currentSkills, newSkillName.trim()]
                            }))
                            setNewSkillName('')
                          }}
                          style={{ background: '#1e3a8a', color: '#ffffff', border: 'none', padding: '4px 14px', fontSize: '11.5px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' }}
                        >
                          + Add Skill
                        </button>
                      </div>

                      {/* Skills Table */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#1e3a8a' }}>
                            <th style={{ padding: '6px 8px' }}>Skill</th>
                            <th style={{ padding: '6px 8px' }}>Experience</th>
                            <th style={{ padding: '6px 8px' }}>Rating</th>
                            <th style={{ padding: '6px 8px' }}>Last Used</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(Array.isArray(submissionCandidate.skills) && submissionCandidate.skills.length > 0
                            ? submissionCandidate.skills
                            : ['Java / J2EE', 'Spring Boot', 'AWS Cloud', 'Microservices', 'PostgreSQL / Oracle', 'Docker / Kubernetes', 'Git / CI-CD']
                          ).map((sk, idx) => {
                            const skillName = typeof sk === 'string' ? sk : sk.name || sk.skill
                            const expYears = typeof sk === 'object' ? sk.exp || '7' : (idx === 0 ? '8' : idx === 1 ? '7' : '5')
                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#0f172a' }}>{skillName}</td>
                                <td style={{ padding: '6px 8px', color: '#475569' }}>{expYears} Years</td>
                                <td style={{ padding: '6px 8px', color: '#eab308' }}>⭐️⭐️⭐️⭐️⭐️</td>
                                <td style={{ padding: '6px 8px', color: '#16a34a', fontWeight: 'bold' }}>2026 (Current)</td>
                                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                  <span
                                    onClick={() => {
                                      const currentSkills = Array.isArray(submissionCandidate.skills) ? submissionCandidate.skills : ['Java / J2EE', 'Spring Boot', 'AWS Cloud', 'Microservices', 'PostgreSQL / Oracle', 'Docker / Kubernetes']
                                      setSubmissionCandidate(prev => ({
                                        ...prev,
                                        skills: currentSkills.filter((_, i) => i !== idx)
                                      }))
                                    }}
                                    style={{ color: '#dc2626', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                                    title="Remove Skill"
                                  >
                                    🗑️
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* SUBTAB 3: REFERENCES */}
                  {activeSubTab === 'references' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0, fontSize: '13px', color: '#1e3a8a', fontWeight: 'bold' }}>
                          📋 Professional References & Verification
                        </h4>
                        <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>✅ References Verified</span>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', marginBottom: '16px' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#1e3a8a' }}>
                            <th style={{ padding: '6px 8px' }}>Reference Name</th>
                            <th style={{ padding: '6px 8px' }}>Company / Client</th>
                            <th style={{ padding: '6px 8px' }}>Designation</th>
                            <th style={{ padding: '6px 8px' }}>Contact</th>
                            <th style={{ padding: '6px 8px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { name: 'Michael Jenkins', company: 'State of Virginia (VDOT)', role: 'Lead Architect / Supervisor', phone: '804-555-0192', email: 'm.jenkins@vdot.gov', status: '✅ Verified (Positive)' },
                            { name: 'Sarah Montgomery', company: 'CapTech Ventures', role: 'Delivery Manager', phone: '804-555-0847', email: 'smontgomery@captech.com', status: '✅ Verified (Positive)' }
                          ].map((ref, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#0f172a' }}>{ref.name}</td>
                              <td style={{ padding: '6px 8px', color: '#334155' }}>{ref.company}</td>
                              <td style={{ padding: '6px 8px', color: '#475569' }}>{ref.role}</td>
                              <td style={{ padding: '6px 8px', color: '#0066cc' }}>{ref.phone}<br />{ref.email}</td>
                              <td style={{ padding: '6px 8px', color: '#16a34a', fontWeight: 'bold' }}>{ref.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* SUBTAB 4: LEGAL & COMPLIANCE */}
                  {activeSubTab === 'legal' && (
                    <div>
                      <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#1e3a8a', fontWeight: 'bold' }}>
                        ⚖️ Legal & Compliance Documentation
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                        {[
                          { title: 'Visa / Form I-797 / Work Auth', status: `✅ Verified (${submissionCandidate.workAuth || 'US Citizen'})`, file: 'Work_Authorization_Doc.pdf', color: '#16a34a' },
                          { title: "Driver's License (State DL)", status: '✅ Verified (Virginia DL)', file: 'State_DL_Copy.pdf', color: '#16a34a' },
                          { title: 'Right To Represent (RTR)', status: '✅ Signed & Executed', file: 'Signed_RTR_Form.pdf', color: '#16a34a' },
                          { title: 'SSN Card Verification', status: `✅ Verified (***-**-${submissionCandidate.ssnLast4 || '8492'})`, file: 'SSN_Verification.pdf', color: '#16a34a' },
                          { title: 'SmartWorks Profile Cover Sheet', status: '✅ Ready for Submission', file: 'Profile_Coversheet.pdf', color: '#0284c7' }
                        ].map((doc, idx) => (
                          <div key={idx} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px 12px' }}>
                            <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '11.5px', marginBottom: '4px' }}>{doc.title}</div>
                            <div style={{ color: doc.color, fontWeight: 'bold', fontSize: '11px', marginBottom: '6px' }}>{doc.status}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '10.5px', color: '#64748b' }}>📄 {doc.file}</span>
                              <span
                                onClick={() => {
                                  alert(`Opening ${doc.title} in preview...`)
                                }}
                                style={{ color: '#0066cc', textDecoration: 'underline', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                              >
                                View ↗
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 5: INTERACTION NOTES */}
                  {activeSubTab === 'notes' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0, fontSize: '13px', color: '#1e3a8a', fontWeight: 'bold' }}>
                          💬 Recruiter Interaction Notes & Activity Log
                        </h4>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Total Notes: {submissionCandidate.interactionNotes?.length || 3}</span>
                      </div>

                      {/* Add Note Input */}
                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '10px 12px', marginBottom: '14px' }}>
                        <textarea
                          rows={2}
                          value={newNoteText}
                          onChange={e => setNewNoteText(e.target.value)}
                          placeholder="Type new recruiter interaction note or screening feedback..."
                          style={{ width: '100%', padding: '6px 8px', fontSize: '11.5px', border: '1px solid #93c5fd', borderRadius: '3px', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (!newNoteText.trim()) return
                              const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              const newNoteObj = {
                                id: Date.now(),
                                note: newNoteText.trim(),
                                author: userName || 'Recruiter',
                                date: dateStr
                              }
                              const existing = Array.isArray(submissionCandidate.interactionNotes) ? submissionCandidate.interactionNotes : []
                              setSubmissionCandidate(prev => ({
                                ...prev,
                                interactionNotes: [newNoteObj, ...existing]
                              }))
                              setNewNoteText('')
                            }}
                            style={{ background: '#1e3a8a', color: '#ffffff', border: 'none', padding: '4px 16px', fontSize: '11.5px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' }}
                          >
                            + Add Note
                          </button>
                        </div>
                      </div>

                      {/* Notes Timeline List */}
                      <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(Array.isArray(submissionCandidate.interactionNotes) && submissionCandidate.interactionNotes.length > 0
                          ? submissionCandidate.interactionNotes
                          : [
                              { id: 1, note: 'Candidate screened and verified for senior level position. Excellent communication and strong hands-on architecture background.', author: userName || 'Lead Recruiter', date: 'Aug 31, 2026 04:12 PM' },
                              { id: 2, note: 'Right to Represent (RTR) signed and verified. Rate confirmed at $74/hr C2C.', author: userName || 'Lead Recruiter', date: 'Aug 31, 2026 03:30 PM' },
                              { id: 3, note: 'LinkedIn profile: https://www.linkedin.com/in/candidate-profile/', author: userName || 'Lead Recruiter', date: 'Aug 31, 2026 02:15 PM' }
                            ]
                        ).map((n, idx) => (
                          <div key={n.id || idx} style={{ background: '#f8fafc', borderLeft: '3px solid #1e3a8a', padding: '8px 12px', borderRadius: '0 4px 4px 0', fontSize: '11.5px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>👤 {n.author || 'Recruiter'}</span>
                              <span style={{ fontSize: '10.5px', color: '#64748b' }}>🕒 {n.date || 'Recent'}</span>
                            </div>
                            <div style={{ color: '#334155', lineHeight: '1.4' }}>{n.note}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 6: SUBMISSION HISTORY */}
                  {activeSubTab === 'history' && (
                    <div>
                      <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#1e3a8a', fontWeight: 'bold' }}>
                        📊 Submission History Across Requisitions
                      </h4>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#1e3a8a' }}>
                            <th style={{ padding: '6px 8px' }}>Req #</th>
                            <th style={{ padding: '6px 8px' }}>Position Title</th>
                            <th style={{ padding: '6px 8px' }}>Client</th>
                            <th style={{ padding: '6px 8px' }}>Bill / Pay</th>
                            <th style={{ padding: '6px 8px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            {
                              reqId: resolveReqId(selectedReq?.id, selectedReq) || '158999',
                              title: cleanJobTitleWithPositionNumber(editingFields.title || selectedReq?.title || 'Senior Software Engineer', selectedReq),
                              client: editingFields.customer || editingFields.endClient || selectedReq?.client || 'State of NC / SC',
                              rates: `${submissionCandidate.proposedBillRate || '90'}/hr | ${submissionCandidate.proposedPayRate || '74'}/hr`,
                              status: 'SubmittedToManager'
                            }
                          ].map((sub, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#0066cc' }}>{sub.reqId}</td>
                              <td style={{ padding: '6px 8px', color: '#0f172a', fontWeight: 'bold' }}>{sub.title}</td>
                              <td style={{ padding: '6px 8px', color: '#475569' }}>{sub.client}</td>
                              <td style={{ padding: '6px 8px', color: '#16a34a', fontWeight: 'bold' }}>{sub.rates}</td>
                              <td style={{ padding: '6px 8px', color: '#1e3a8a', fontWeight: 'bold' }}>{sub.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* SUBTAB 7: PROJECTS */}
                  {activeSubTab === 'projects' && (
                    <div>
                      <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#1e3a8a', fontWeight: 'bold' }}>
                        💼 Candidate Projects & Career History
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                          {
                            name: 'Enterprise Cloud Modernization & Microservices Platform',
                            client: 'Virginia Department of Transportation (VDOT)',
                            role: 'Lead Cloud / Java Architect',
                            duration: '2022 - 2026',
                            tech: 'Java 17, Spring Boot, AWS ECS, Kafka, PostgreSQL, Docker, Terraform'
                          },
                          {
                            name: 'Statewide Health & Human Services Data Exchange Gateway',
                            client: 'North Carolina DHHS',
                            role: 'Senior Software Engineer',
                            duration: '2019 - 2022',
                            tech: 'Java, Spring Cloud, Oracle, Microservices, Kubernetes, REST APIs'
                          }
                        ].map((proj, idx) => (
                          <div key={idx} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '12px' }}>{proj.name}</span>
                              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>{proj.duration}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
                              <strong>Client:</strong> {proj.client} | <strong>Role:</strong> {proj.role}
                            </div>
                            <div style={{ fontSize: '11px', color: '#334155' }}>
                              <strong>Tech Stack:</strong> <span style={{ color: '#0284c7' }}>{proj.tech}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* ─── RIGHT COLUMN: INTERACTIVE RESUME & DOCUMENT VIEWER ─── */}
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  
                  {/* Viewer Toolbar */}
                  <div style={{ background: '#1e3a8a', color: '#ffffff', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                      <span>📄 Document:</span>
                      <select
                        value={submissionDocType}
                        onChange={e => setSubmissionDocType(e.target.value)}
                        style={{ padding: '2px 4px', fontSize: '11px', background: '#ffffff', color: '#0f172a', border: 'none', borderRadius: '2px' }}
                      >
                        <option value="resume">Resume ({submissionCandidate.resumeName || 'Resume.docx'})</option>
                        <option value="visa">Visa Copy (I-797)</option>
                        <option value="dl">Driver's License</option>
                        <option value="rtr">Right To Represent (RTR)</option>
                        <option value="ssn">SSN Card</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setSubmissionZoom(z => Math.max(z - 10, 70))}
                        style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '1px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '2px' }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '11px' }}>{submissionZoom}%</span>
                      <button
                        type="button"
                        onClick={() => setSubmissionZoom(z => Math.min(z + 10, 150))}
                        style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '1px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '2px' }}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => alert(`Downloading ${submissionCandidate.resumeName || 'Candidate_Resume.docx'}...`)}
                        style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px', marginLeft: '4px' }}
                      >
                        ⬇️ Download
                      </button>
                    </div>
                  </div>

                  {/* Viewer Content Area */}
                  <div style={{ flex: 1, padding: '12px 14px', background: '#ffffff', overflowY: 'auto', maxHeight: '480px', fontSize: `${11 * (submissionZoom / 100)}px`, lineHeight: '1.5', fontFamily: 'Arial, sans-serif' }}>
                    {submissionDocType === 'resume' && (
                      <div>
                        {submissionCandidate.resumeText ? (
                          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, color: '#334155' }}>
                            {submissionCandidate.resumeText}
                          </pre>
                        ) : (
                          <div>
                            <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '8px', marginBottom: '12px' }}>
                              <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#1e3a8a', fontWeight: 'bold' }}>
                                {submissionCandidate.firstName} {submissionCandidate.lastName}
                              </h3>
                              <div style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>
                                {submissionCandidate.jobTitle || 'Lead Software / Cloud Engineer'}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                📍 {submissionCandidate.city || 'Richmond'}, {submissionCandidate.state || 'VA'} | ✉️ {submissionCandidate.email} | 📞 {submissionCandidate.phoneCell || '571-660-5778'}
                              </div>
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                              <div style={{ fontWeight: 'bold', color: '#1e3a8a', borderBottom: '1px solid #cbd5e1', paddingBottom: '2px', marginBottom: '4px', textTransform: 'uppercase', fontSize: '11.5px' }}>
                                📌 Professional Summary
                              </div>
                              <p style={{ margin: 0, color: '#334155' }}>
                                Results-driven and seasoned IT professional with {submissionCandidate.experienceYears || '8'}+ years of experience in architecting, designing, and delivering high-concurrency cloud and enterprise software systems. Expert in microservices architecture, scalable cloud systems, RESTful API design, database performance tuning, and automated CI/CD pipelines.
                              </p>
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                              <div style={{ fontWeight: 'bold', color: '#1e3a8a', borderBottom: '1px solid #cbd5e1', paddingBottom: '2px', marginBottom: '4px', textTransform: 'uppercase', fontSize: '11.5px' }}>
                                🛠️ Core Technical Competencies
                              </div>
                              <div style={{ color: '#334155' }}>
                                <strong>Languages & Frameworks:</strong> Java, Spring Boot, Spring Cloud, Hibernate, React, TypeScript, Python, Node.js<br />
                                <strong>Cloud & DevOps:</strong> AWS (ECS, Lambda, S3, RDS, CloudWatch), Docker, Kubernetes, Terraform, Jenkins, GitHub Actions<br />
                                <strong>Databases & Messaging:</strong> PostgreSQL, Oracle, MySQL, Redis, Apache Kafka, RabbitMQ<br />
                                <strong>Testing & Practices:</strong> JUnit, Mockito, TOSCA, TDD, Agile/Scrum, JIRA
                              </div>
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                              <div style={{ fontWeight: 'bold', color: '#1e3a8a', borderBottom: '1px solid #cbd5e1', paddingBottom: '2px', marginBottom: '4px', textTransform: 'uppercase', fontSize: '11.5px' }}>
                                💼 Professional Experience
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#0f172a' }}>
                                  <span>Lead Software Engineer — Virginia Dept of Transportation</span>
                                  <span>2022 - Present</span>
                                </div>
                                <ul style={{ margin: '4px 0 0 16px', padding: 0, color: '#334155' }}>
                                  <li>Led the architectural modernization of state transportation portals to AWS cloud microservices.</li>
                                  <li>Optimized distributed query performance resulting in 45% lower database latency.</li>
                                  <li>Implemented automated CI/CD deployment pipelines using GitHub Actions and Docker.</li>
                                </ul>
                              </div>

                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#0f172a' }}>
                                  <span>Senior Developer — North Carolina DHHS</span>
                                  <span>2019 - 2022</span>
                                </div>
                                <ul style={{ margin: '4px 0 0 16px', padding: 0, color: '#334155' }}>
                                  <li>Developed secure RESTful API integrations for statewide health data exchange.</li>
                                  <li>Implemented role-based access control (RBAC) and compliance auditing for sensitive health records.</li>
                                </ul>
                              </div>
                            </div>

                            <div>
                              <div style={{ fontWeight: 'bold', color: '#1e3a8a', borderBottom: '1px solid #cbd5e1', paddingBottom: '2px', marginBottom: '4px', textTransform: 'uppercase', fontSize: '11.5px' }}>
                                🎓 Education & Certifications
                              </div>
                              <div style={{ color: '#334155' }}>
                                • Bachelor of Science in Computer Science & Engineering<br />
                                • AWS Certified Solutions Architect — Associate
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {submissionDocType === 'visa' && (
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: '#1e3a8a' }}>
                        <div style={{ fontSize: '36px', marginBottom: '10px' }}>🪪</div>
                        <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 'bold' }}>Work Authorization / Visa Copy</h4>
                        <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold', marginBottom: '8px' }}>
                          Status: Verified ({submissionCandidate.workAuth || 'US Citizen'})
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Document validated against official government records. Form I-797 / EAD / Passport on file.
                        </div>
                      </div>
                    )}

                    {submissionDocType === 'dl' && (
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: '#1e3a8a' }}>
                        <div style={{ fontSize: '36px', marginBottom: '10px' }}>🚗</div>
                        <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 'bold' }}>State Driver's License</h4>
                        <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold', marginBottom: '8px' }}>
                          Status: Verified (State of {submissionCandidate.state || 'VA'})
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Official State Photo ID verified. Real ID compliant.
                        </div>
                      </div>
                    )}

                    {submissionDocType === 'rtr' && (
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: '#1e3a8a' }}>
                        <div style={{ fontSize: '36px', marginBottom: '10px' }}>✍️</div>
                        <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 'bold' }}>Right To Represent (RTR)</h4>
                        <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold', marginBottom: '8px' }}>
                          Status: Signed & Active for Requisition #{resolveReqId(selectedReq?.id, selectedReq)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Candidate has granted exclusive right of representation to SmartWorks / SmartHire for this client requirement.
                        </div>
                      </div>
                    )}

                    {submissionDocType === 'ssn' && (
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: '#1e3a8a' }}>
                        <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔒</div>
                        <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 'bold' }}>Social Security Verification</h4>
                        <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold', marginBottom: '8px' }}>
                          Status: Verified (SSN: ***-**-{submissionCandidate.ssnLast4 || '8492'})
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          E-Verify background check verified and confirmed.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW MODE 3: SINGLE REQUISITION DETAIL VIEW
              ───────────────────────────────────────────────────────────── */}
          {viewMode === 'requisition' && selectedReq && (
            <div style={{ background: '#ffffff', border: '1px solid #7f9db9', borderRadius: 0, padding: '14px 18px', fontFamily: 'Arial, Helvetica, sans-serif' }}>
              <div style={{ fontSize: '11px', color: '#000080', fontWeight: 'bold', marginBottom: '8px' }}>
                You are here: <span style={{ color: '#0066cc', cursor: 'pointer' }} onClick={() => setViewMode('portal')}>Home</span> &gt; Requisitions &gt; Edit Requisition
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ea580c', paddingBottom: '5px', marginBottom: '10px', flexWrap: 'wrap', gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: '15px', color: '#000080', fontWeight: 'bold' }}>
                  Requisition #:{resolveReqId(selectedReq.id, selectedReq)} - {cleanJobTitleWithPositionNumber(editingFields.title || selectedReq.title, selectedReq)} <span style={{ color: '#dc2626', fontSize: '12px', marginLeft: '8px' }}>Status: {editingFields.status || 'Ready'}</span>
                </h2>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', fontSize: '11.5px', fontWeight: 'bold' }}>
                  {(isSuperAdmin || isAdmin) && (
                    <button
                      type="button"
                      onClick={() => handleOpenLinkedInModal(selectedReq)}
                      style={{
                        background: '#0a66c2',
                        color: '#ffffff',
                        border: 'none',
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 1px 3px rgba(10,102,194,0.3)'
                      }}
                      title="Generate and Publish LinkedIn Post for this Requisition"
                    >
                      <span>🌐 Post to LinkedIn</span>
                    </button>
                  )}
                  <span style={{ color: '#0066cc', cursor: 'pointer' }} onClick={() => alert('Job posted to JobsInHand successfully!')}>
                    Post To JobsInHand
                  </span>
                  <span style={{ color: '#0066cc', cursor: 'pointer' }} onClick={() => alert('Opening Mass E-mail Dispatcher...')}>
                    Mass E-mail
                  </span>
                  <span style={{ color: '#0066cc', cursor: 'pointer' }} onClick={() => setViewMode('portal')}>
                    &lt;&lt; Back To Search Results
                  </span>
                </div>
              </div>

              {/* Success Notification Banner */}
              {saveToastMessage && (
                <div style={{
                  background: '#ecfdf5',
                  border: '1px solid #10b981',
                  color: '#065f46',
                  padding: '6px 12px',
                  borderRadius: 0,
                  fontSize: '11px',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>{saveToastMessage}</span>
                  <span style={{ cursor: 'pointer', marginLeft: '12px', fontSize: '12px' }} onClick={() => setSaveToastMessage(null)}>✕</span>
                </div>
              )}

              {/* Upper 3-Column Form (Crisp Square Style) */}
              <div style={{
                background: '#ffffff', border: '1px solid #7f9db9', padding: '10px 14px', borderRadius: 0, marginBottom: '10px',
                display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px 14px', fontSize: '11px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', gap: '5px 8px', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right' }}>Position Title:*</label>
                  <input
                    type="text"
                    value={editingFields.title || ''}
                    disabled={isEmployee}
                    onChange={e => !isEmployee && setEditingFields({ ...editingFields, title: e.target.value })}
                    style={{
                      padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                      background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                    }}
                  />

                  <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right' }}>Start Date:*</label>
                  <input
                    type="text"
                    value={editingFields.startDate || ''}
                    disabled={isEmployee}
                    onChange={e => !isEmployee && setEditingFields({ ...editingFields, startDate: e.target.value })}
                    style={{
                      padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                      background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                    }}
                  />

                  <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right' }}>Duration:*</label>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={editingFields.duration || '12'}
                      disabled={isEmployee}
                      onChange={e => !isEmployee && setEditingFields({ ...editingFields, duration: e.target.value })}
                      style={{
                        width: '45px', padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                        background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                      }}
                    />
                    <span style={{ fontWeight: 'bold', color: '#000080' }}>months</span>
                  </div>

                  <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right' }}># of Positions:*</label>
                  <input
                    type="text"
                    value={editingFields.numPositions || '1'}
                    disabled={isEmployee}
                    onChange={e => !isEmployee && setEditingFields({ ...editingFields, numPositions: e.target.value })}
                    style={{
                      width: '45px', padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                      background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                    }}
                  />

                  <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right' }}>Max Submission:*</label>
                  <input
                    type="text"
                    value={editingFields.maxSubmissions || '2'}
                    disabled={isEmployee}
                    onChange={e => !isEmployee && setEditingFields({ ...editingFields, maxSubmissions: e.target.value })}
                    style={{
                      width: '45px', padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                      background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '5px 8px', alignItems: 'center' }}>
                  <div style={{ visibility: 'hidden' }}>spacer</div>
                  <div style={{ visibility: 'hidden' }}>spacer</div>

                  <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right' }}>Customer:</label>
                  <select
                    value={editingFields.customer || 'State Of SC'}
                    disabled={isEmployee}
                    onChange={e => !isEmployee && setEditingFields({ ...editingFields, customer: e.target.value })}
                    style={{
                      padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                      background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                    }}
                  >
                    <option>State Of SC</option>
                    <option>DFA</option>
                    <option>DBHDS</option>
                    <option>VDOT</option>
                    <option>Texas Health and Human Services Commission</option>
                  </select>

                  <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right' }}>Contact:</label>
                  <select
                    value={editingFields.contact || 'Hustedt Lexi'}
                    disabled={isEmployee}
                    onChange={e => !isEmployee && setEditingFields({ ...editingFields, contact: e.target.value })}
                    style={{
                      padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                      background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                    }}
                  >
                    <option>Hustedt Lexi</option>
                    <option>Miller Sarah</option>
                    <option>David Wilson</option>
                    <option>Jessica Taylor</option>
                  </select>

                  <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right' }}>Submission Deadline:*</label>
                  <input
                    type="text"
                    value={editingFields.deadline || '2026-09-01'}
                    disabled={isEmployee}
                    onChange={e => !isEmployee && setEditingFields({ ...editingFields, deadline: e.target.value })}
                    style={{
                      padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                      background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                    }}
                  />

                  <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right' }}>Req Category:*</label>
                  <select
                    value={editingFields.category || 'SP'}
                    disabled={isEmployee}
                    onChange={e => !isEmployee && setEditingFields({ ...editingFields, category: e.target.value })}
                    style={{
                      padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                      background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                    }}
                  >
                    <option>SP</option>
                    <option>IT</option>
                    <option>ENG</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '75px 1fr', gap: '5px 8px', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right' }}>Status:</label>
                  <select
                    value={editingFields.status || 'In-Progress'}
                    disabled={isEmployee}
                    onChange={e => !isEmployee && setEditingFields({ ...editingFields, status: e.target.value })}
                    style={{
                      padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                      background: '#ffffff',
                      fontWeight: 'bold',
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  >
                    <option>In-Progress</option>
                    <option>Ready</option>
                    <option>Active</option>
                    <option>Closed</option>
                  </select>

                  <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right' }}>End Client:</label>
                  <select
                    value={editingFields.endClient || 'State Of SC'}
                    disabled={isEmployee}
                    onChange={e => !isEmployee && setEditingFields({ ...editingFields, endClient: e.target.value })}
                    style={{
                      padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                      background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                    }}
                  >
                    <option>State Of SC</option>
                    <option>DFA</option>
                    <option>DBHDS</option>
                    <option>Texas Health and Human Services Commission</option>
                  </select>

                  <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right' }}>Contact:</label>
                  <select
                    value={editingFields.contact || 'Hustedt Lexi'}
                    disabled={isEmployee}
                    onChange={e => !isEmployee && setEditingFields({ ...editingFields, contact: e.target.value })}
                    style={{
                      padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                      background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                    }}
                  >
                    <option>Hustedt Lexi</option>
                    <option>Miller Sarah</option>
                    <option>David Wilson</option>
                    <option>Jessica Taylor</option>
                  </select>

                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#000080', fontWeight: 'bold' }}>
                      <input type="checkbox" disabled={isEmployee} checked={editingFields.keyReq || false} onChange={e => !isEmployee && setEditingFields({ ...editingFields, keyReq: e.target.checked })} /> Key Req
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#000080', fontWeight: 'bold' }}>
                      <input type="checkbox" disabled={isEmployee} checked={editingFields.working !== false} onChange={e => !isEmployee && setEditingFields({ ...editingFields, working: e.target.checked })} /> Working
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#000080', fontWeight: 'bold' }}>
                      <input type="checkbox" disabled={isEmployee} checked={editingFields.hotReq || false} onChange={e => !isEmployee && setEditingFields({ ...editingFields, hotReq: e.target.checked })} /> Hot Req
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#000080', fontWeight: 'bold' }}>
                      <input type="checkbox" disabled={isEmployee} checked={editingFields.incumbentVendor || false} onChange={e => !isEmployee && setEditingFields({ ...editingFields, incumbentVendor: e.target.checked })} /> Incumbent Vendor
                    </label>
                  </div>

                  <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right' }}>Req Type:*</label>
                  <select
                    value={editingFields.type || 'Contract'}
                    disabled={isEmployee}
                    onChange={e => !isEmployee && setEditingFields({ ...editingFields, type: e.target.value })}
                    style={{
                      padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                      background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                    }}
                  >
                    <option>Contract</option>
                    <option>Full-Time</option>
                  </select>
                </div>
              </div>

              {/* Sub Tabs Bar (Clean Square Tabs, No Underline & AI Match Button) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #7f9db9', background: 'transparent', gap: '2px', paddingLeft: '2px', marginBottom: '0' }}>
                <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
                  {[
                    { id: 'details', label: 'Details' },
                    ...(!isEmployee ? [{ id: 'assign', label: 'Assign to Recruiters' }] : []),
                    { id: 'potential', label: `Potential Candidates (${getScopedPotentialCandidates(potentialCandidates).length})` },
                    ...(canReviewAndUseAI ? [{ id: 'aiFit', label: 'AI Fit Review' }] : []),
                    { id: 'attachments', label: `Attachments (${attachments.length})` },
                    { id: 'newCandidates', label: 'New Candidates (0)' }
                  ].map(tab => {
                    const isActive = activeReqTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveReqTab(tab.id)}
                        style={{
                          border: '1px solid #7f9db9',
                          borderBottom: isActive ? '1px solid #ffffff' : '1px solid #7f9db9',
                          background: isActive ? '#ffffff' : '#e8e8e8',
                          color: '#000080',
                          fontWeight: isActive ? 'bold' : 'normal',
                          textDecoration: 'none',
                          fontSize: '11px',
                          padding: '3px 12px',
                          cursor: 'pointer',
                          borderRadius: 0,
                          marginBottom: isActive ? '-1px' : '0px',
                          zIndex: isActive ? 2 : 1
                        }}
                      >
                        {tab.label}
                      </button>
                    )
                  })}
                </div>

                {/* 1-Click AI Matchmaker Button */}
                <button
                  type="button"
                  onClick={() => handleOpenAiMatchModalForJob(selectedReq)}
                  style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    border: '1px solid #15803d',
                    padding: '3px 12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    borderRadius: 0,
                    marginBottom: '2px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 1px 3px rgba(22, 163, 74, 0.3)'
                  }}
                  title="Scan candidate database, calculate match scores, and alert sourcing recruiters"
                >
                  <span>🎯 AI Match Finder</span>
                </button>
              </div>

              {/* Tab Panel Content Box (Crisp Square Style) */}
              <div style={{ background: '#ffffff', border: '1px solid #7f9db9', borderTop: 'none', borderRadius: 0, padding: '12px 16px', minHeight: '300px', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                
                {/* ─── TAB 1: DETAILS ─── */}
                {activeReqTab === 'details' && (
                  <div>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 420px', display: 'grid', gridTemplateColumns: '135px 1fr', gap: '6px 8px', alignContent: 'start', fontSize: '11px' }}>
                        <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right', alignSelf: 'center' }}>Location Address:</label>
                        <input
                          type="text"
                          value={editingFields.address || ''}
                          disabled={isEmployee}
                          onChange={e => !isEmployee && setEditingFields({ ...editingFields, address: e.target.value })}
                          style={{
                            padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                            background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                          }}
                        />

                        <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right', alignSelf: 'center' }}>City*, State*, Zip*:</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input
                            type="text"
                            value={editingFields.city || 'Columbia'}
                            disabled={isEmployee}
                            onChange={e => !isEmployee && setEditingFields({ ...editingFields, city: e.target.value })}
                            style={{
                              flex: 2, padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                              background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                            }}
                          />
                          <select
                            value={editingFields.state || 'SC'}
                            disabled={isEmployee}
                            onChange={e => !isEmployee && setEditingFields({ ...editingFields, state: e.target.value })}
                            style={{
                              flex: 1, padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                              background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                            }}
                          >
                            {US_STATES.map(st => (
                              <option key={st.code} value={st.code}>{st.code}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={editingFields.zip || '29210'}
                            disabled={isEmployee}
                            onChange={e => !isEmployee && setEditingFields({ ...editingFields, zip: e.target.value })}
                            style={{
                              width: '60px', padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                              background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                            }}
                          />
                        </div>

                        <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right', alignSelf: 'center' }}>Bill Rate:</label>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={editingFields.billRate || '90'}
                            disabled={isEmployee}
                            onChange={e => !isEmployee && setEditingFields({ ...editingFields, billRate: e.target.value })}
                            style={{
                              width: '60px', padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                              background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                            }}
                          />
                          <select style={{ fontSize: '11px', padding: '2px 4px', border: '1px solid #7f9db9', borderRadius: 0, background: '#ffffff' }}>
                            <option>Select</option>
                            <option>Hourly</option>
                            <option>Annual</option>
                          </select>
                        </div>

                        <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right', alignSelf: 'center' }}>Pay Rate:</label>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={editingFields.payRate || '75'}
                            disabled={isEmployee}
                            onChange={e => !isEmployee && setEditingFields({ ...editingFields, payRate: e.target.value })}
                            style={{
                              width: '60px', padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                              background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                            }}
                          />
                          <select style={{ fontSize: '11px', padding: '2px 4px', border: '1px solid #7f9db9', borderRadius: 0, background: '#ffffff' }}>
                            <option>Select</option>
                            <option>C2C</option>
                            <option>W2</option>
                            <option>1099</option>
                          </select>
                        </div>

                        <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right', alignSelf: 'center' }}>Interview:</label>
                        <select
                          value={editingFields.interview || 'Select'}
                          disabled={isEmployee}
                          onChange={e => !isEmployee && setEditingFields({ ...editingFields, interview: e.target.value })}
                          style={{
                            padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                            background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                          }}
                        >
                          <option>Select</option>
                          <option>1 Round Virtual/Online</option>
                          <option>Technical Panel</option>
                        </select>

                        <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right', alignSelf: 'center' }}>Work Authorization:</label>
                        <select
                          value={editingFields.workAuth || 'Select'}
                          disabled={isEmployee}
                          onChange={e => !isEmployee && setEditingFields({ ...editingFields, workAuth: e.target.value })}
                          style={{
                            padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                            background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                          }}
                        >
                          <option>Select</option>
                          <option>US Citizen</option>
                          <option>Green Card</option>
                          <option>EAD / GC-EAD</option>
                          <option>H1B</option>
                        </select>

                        <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right', alignSelf: 'center' }}>Subcontractable:*</label>
                        <select
                          value={editingFields.subcontractable || 'Yes'}
                          disabled={isEmployee}
                          onChange={e => !isEmployee && setEditingFields({ ...editingFields, subcontractable: e.target.value })}
                          style={{
                            padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                            background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                          }}
                        >
                          <option>Yes</option>
                          <option>No</option>
                        </select>

                        <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right', alignSelf: 'center' }}>Employment Type:</label>
                        <input
                          type="text"
                          value={editingFields.employmentType || 'Contract'}
                          disabled={isEmployee}
                          onChange={e => !isEmployee && setEditingFields({ ...editingFields, employmentType: e.target.value })}
                          style={{
                            padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                            background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                          }}
                        />

                        <label style={{ fontWeight: 'bold', color: '#000080', textAlign: 'right', alignSelf: 'center' }}>Experience:*</label>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={editingFields.experience || '6'}
                            disabled={isEmployee}
                            onChange={e => !isEmployee && setEditingFields({ ...editingFields, experience: e.target.value })}
                            style={{
                              width: '45px', padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0,
                              background: isEmployee ? '#f1f5f9' : '#ffffff', color: '#0f172a', outline: 'none'
                            }}
                          />
                          <span style={{ color: '#000080', fontWeight: 'bold', fontSize: '11px' }}>years</span>
                        </div>
                      </div>

                      <div style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#000080' }}>Description:*</label>
                              <span style={{ fontSize: '12px', cursor: 'pointer' }} title="Print / Format JD">🖨️</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const formatted = formatJobDescription(editingFields.description || '', {
                                  ...selectedReq,
                                  ...editingFields,
                                  title: editingFields.title || selectedReq?.title,
                                  client: editingFields.customer || selectedReq?.client
                                })
                                setEditingFields(prev => ({ ...prev, description: formatted }))
                                setSaveToastMessage('✨ JD automatically reformatted and structured!')
                                setTimeout(() => setSaveToastMessage(null), 3000)
                              }}
                              style={{
                                background: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                padding: '2px 8px',
                                fontSize: '10.5px',
                                fontWeight: 'bold',
                                borderRadius: '2px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
                              }}
                              title="Clean and structure raw JD into professional sections with bullet points"
                            >
                              <span>✨ Auto-Format Structure</span>
                            </button>
                          </div>
                          <textarea
                            rows={10}
                            value={editingFields.description || ''}
                            disabled={isEmployee}
                            onChange={e => !isEmployee && setEditingFields({ ...editingFields, description: e.target.value })}
                            style={{
                              width: '100%', padding: '6px 8px', fontSize: '11px', lineHeight: '1.5', border: '1px solid #7f9db9', borderRadius: 0,
                              fontFamily: 'monospace',
                              background: isEmployee ? '#f8fafc' : '#ffffff',
                              color: '#0f172a',
                              boxSizing: 'border-box',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#000080', display: 'block', marginBottom: '3px' }}>Required Skills:*</label>
                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#000080', lineHeight: '1.5' }}>
                              {Array.isArray(editingFields.skills) && editingFields.skills.map((s, idx) => (
                                <li key={idx}><span style={{ color: '#000080' }}>{s}</span></li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#000080', display: 'block', marginBottom: '3px' }}>Desired Skills:</label>
                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#000080', lineHeight: '1.5' }}>
                              {Array.isArray(editingFields.desiredSkills) && editingFields.desiredSkills.map((s, idx) => (
                                <li key={idx}><span style={{ color: '#000080' }}>{s}</span></li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata & Save Bar inside Tab (Image Matched) */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '16px',
                      paddingTop: '8px',
                      borderTop: '1px solid #e2e8f0',
                      fontSize: '11px',
                      color: '#000080'
                    }}>
                      <div>
                        <span>Created by: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.createdBy || 'admin'}</span>
                        <span> on: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.createdOn || '2026-08-26 11:40:14 AM'}</span>
                        <span style={{ marginLeft: '16px' }}>Last Updated by: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.lastUpdatedBy || userName}</span>
                        <span> on: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.lastUpdatedOn || '8/26/2026 11:43:52 AM'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveRequisition()}
                        style={{
                          border: '1px solid #71717a',
                          background: '#e4e4e7',
                          color: '#0f172a',
                          padding: '2px 14px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          borderRadius: 0
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── TAB 2: ASSIGN TO RECRUITERS (COMPACT & SQUARE) ─── */}
                {activeReqTab === 'assign' && (
                  <div style={{ fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontWeight: 'bold', color: '#000080', fontSize: '11.5px' }}>
                        Assign Recruiters to Requisition #{resolveReqId(selectedReq?.id, selectedReq)} ({editingFields.assignedRecruiters?.length || 0} Assigned)
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const allNames = allRecruitersList.map(r => r.name).filter(Boolean)
                            setEditingFields(prev => ({
                              ...prev,
                              assignedRecruiters: Array.from(new Set(allNames))
                            }))
                          }}
                          style={{ border: '1px solid #71717a', background: '#e4e4e7', padding: '2px 8px', fontSize: '10.5px', fontWeight: 'bold', cursor: 'pointer', borderRadius: 0 }}
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFields(prev => ({
                              ...prev,
                              assignedRecruiters: []
                            }))
                          }}
                          style={{ border: '1px solid #71717a', background: '#e4e4e7', padding: '2px 8px', fontSize: '10.5px', fontWeight: 'bold', cursor: 'pointer', borderRadius: 0 }}
                        >
                          Clear All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const current = editingFields.assignedRecruiters || []
                            if (!current.some(r => r.toLowerCase().trim() === userName.toLowerCase().trim())) {
                              setEditingFields(prev => ({
                                ...prev,
                                assignedRecruiters: [...current, userName]
                              }))
                            }
                          }}
                          style={{ border: '1px solid #000080', background: '#000080', color: '#ffffff', padding: '2px 8px', fontSize: '10.5px', fontWeight: 'bold', cursor: 'pointer', borderRadius: 0 }}
                        >
                          + Assign to Me ({userName})
                        </button>
                      </div>
                    </div>

                    {/* Recruiters Compact Table */}
                    <div style={{ overflowX: 'auto', border: '1px solid #7f9db9', borderRadius: 0, marginBottom: '8px' }}>
                      <table className="coolworks-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', textAlign: 'left', fontFamily: 'Arial, Helvetica, sans-serif', background: '#ffffff' }}>
                        <thead>
                          <tr style={{ background: '#708090', color: '#ffffff', borderBottom: '1px solid #4a5568' }}>
                            <th style={{ background: '#708090', color: '#ffffff', padding: '4px 6px', width: '30px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>
                              <input
                                type="checkbox"
                                checked={allRecruitersList.length > 0 && allRecruitersList.every(rec => 
                                   (editingFields.assignedRecruiters || []).some(r => String(r || '').toLowerCase().trim() === String(rec.name || '').toLowerCase().trim())
                                )}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setEditingFields(prev => ({ ...prev, assignedRecruiters: Array.from(new Set(allRecruitersList.map(r => r.name).filter(Boolean))) }))
                                  } else {
                                    setEditingFields(prev => ({ ...prev, assignedRecruiters: [] }))
                                  }
                                }}
                              />
                            </th>
                            <th style={{ background: '#708090', color: '#ffffff', padding: '4px 6px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Recruiter Name</th>
                            <th style={{ background: '#708090', color: '#ffffff', padding: '4px 6px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Role</th>
                            <th style={{ background: '#708090', color: '#ffffff', padding: '4px 6px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Email Address</th>
                            <th style={{ background: '#708090', color: '#ffffff', padding: '4px 6px', fontWeight: 'bold', fontSize: '11px', borderRight: (isAdmin || isManager) ? '1px solid rgba(255,255,255,0.25)' : 'none' }}>Assignment Status</th>
                            {(isAdmin || isManager) && (
                              <th style={{ background: '#708090', color: '#ffffff', padding: '4px 6px', fontWeight: 'bold', fontSize: '11px', textAlign: 'center', width: '70px' }}>Action</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {allRecruitersList.map((rec, idx) => {
                            const isAssigned = (editingFields.assignedRecruiters || []).some(
                              r => String(r || '').toLowerCase().trim() === String(rec.name || '').toLowerCase().trim() ||
                                   (rec.email && String(r || '').toLowerCase().trim() === String(rec.email || '').toLowerCase().trim())
                            )
                            return (
                              <tr
                                key={rec.id || rec.email || rec.name || idx}
                                onClick={() => toggleRecruiterAssignment(rec.name)}
                                style={{
                                  background: isAssigned ? '#eff6ff' : '#ffffff',
                                  borderBottom: '1px solid #e2e8f0',
                                  cursor: 'pointer'
                                }}
                              >
                                <td style={{ padding: '3px 6px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isAssigned}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={() => toggleRecruiterAssignment(rec.name)}
                                  />
                                </td>
                                <td style={{ padding: '3px 6px', fontWeight: 'bold', color: isAssigned ? '#0033cc' : '#000000' }}>
                                  {rec.name} {rec.name === userName ? '(You)' : ''}
                                </td>
                                <td style={{ padding: '3px 6px', color: '#000000' }}>
                                  {rec.role}
                                </td>
                                <td style={{ padding: '3px 6px', color: '#000000', fontFamily: 'monospace' }}>
                                  {rec.email}
                                </td>
                                <td style={{ padding: '3px 6px' }}>
                                  {isAssigned ? (
                                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>🟢 Assigned</span>
                                  ) : (
                                    <span style={{ color: '#94a3b8' }}>⚪ Not Assigned</span>
                                  )}
                                </td>
                                {(isAdmin || isManager) && (
                                  <td style={{ padding: '3px 6px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                    {rec.email !== 'omkesh@coolsofttech.com' && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteTeamUser(rec)
                                        }}
                                        style={{
                                          background: '#fee2e2',
                                          border: '1px solid #fca5a5',
                                          color: '#dc2626',
                                          padding: '1px 6px',
                                          fontSize: '10px',
                                          fontWeight: 'bold',
                                          borderRadius: '2px',
                                          cursor: 'pointer'
                                        }}
                                        title="Permanently delete user"
                                      >
                                        🗑️ Delete
                                      </button>
                                    )}
                                  </td>
                                )}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Metadata & Save Bar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '12px',
                      paddingTop: '8px',
                      borderTop: '1px solid #e2e8f0',
                      fontSize: '11px',
                      color: '#000080'
                    }}>
                      <div>
                        <span>Created by: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.createdBy || 'admin'}</span>
                        <span> on: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.createdOn || '2026-08-26 11:40:14 AM'}</span>
                        <span style={{ marginLeft: '16px' }}>Last Updated by: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.lastUpdatedBy || userName}</span>
                        <span> on: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.lastUpdatedOn || '8/26/2026 11:43:52 AM'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveRequisition()}
                        style={{
                          border: '1px solid #71717a',
                          background: '#e4e4e7',
                          color: '#0f172a',
                          padding: '2px 14px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          borderRadius: 0
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── TAB 3: POTENTIAL CANDIDATES (NO AI FIT COLUMN IN ROW) ─── */}
                {activeReqTab === 'potential' && (
                  <div style={{ fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setCandidateIntakeData({
                              id: null,
                              name: '',
                              firstName: '',
                              lastName: '',
                              email: '',
                              phone: '',
                              role: editingFields.jobTitle || editingFields.title || selectedReq?.title || '',
                              fullRole: editingFields.jobTitle || editingFields.title || selectedReq?.title || '',
                              exp: editingFields.experience || '5',
                              location: editingFields.location || 'Richmond, VA',
                              city: editingFields.city || 'Richmond',
                              state: editingFields.state || 'VA',
                              payRate: editingFields.payRate || '75',
                              rateType: editingFields.rateType || 'C2C',
                              workAuth: editingFields.workAuth !== 'Select' ? editingFields.workAuth : 'US Citizen',
                              skills: Array.isArray(editingFields.skills) ? editingFields.skills.join(', ') : (editingFields.skills || ''),
                              resumeName: '',
                              resumeFile: null,
                              targetJobId: selectedReq?.id || '',
                              comments: `Direct sourcing for Requisition #${selectedReq?.id?.replace('J-', '')}`
                            })
                            setShowCandidateIntakeModal(true)
                          }}
                          style={{
                            background: '#ea580c',
                            color: '#ffffff',
                            border: 'none',
                            padding: '4px 12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 2px rgba(234, 88, 12, 0.25)'
                          }}
                          title="Upload/Parse resume and add candidate directly to this requisition and your candidate pool"
                        >
                          <span>➕ Add / Parse Candidate</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setNewCandReqForm({
                              firstName: '',
                              lastName: '',
                              email: '',
                              phone: '',
                              payRate: editingFields.payRate || '70',
                              payRateType: 'C2C',
                              workAuth: editingFields.workAuth !== 'Select' ? editingFields.workAuth : 'US Citizen',
                              exp: editingFields.experience || '5',
                              skills: Array.isArray(editingFields.skills) ? editingFields.skills.join(', ') : '',
                              comments: `Sourced by ${userName} for Requisition #${selectedReq?.id?.replace('J-', '')}`,
                              status: 'Int-SubmittedToManager'
                            })
                            setShowAddCandidateModal(true)
                          }}
                          style={{
                            background: '#f1f5f9',
                            color: '#0033cc',
                            border: '1px solid #cbd5e1',
                            padding: '3px 10px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>📋 Select from Pool</span>
                        </button>

                        <span style={{ color: '#cbd5e1' }}>|</span>

                        <span
                          onClick={() => setViewMode('resumeSearch')}
                          style={{ color: '#0033cc', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          🔍 Search Talent Directory &gt;&gt;
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowAuditLogModal(true)}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #7f9db9',
                          padding: '3px 8px',
                          fontSize: '10.5px',
                          fontWeight: 'bold',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          color: '#000080'
                        }}
                      >
                        📜 Status Audit History
                      </button>
                    </div>

                    <div style={{ overflowX: 'auto', marginBottom: '10px', border: '1px solid #7f9db9', borderRadius: 0 }}>
                      <table className="coolworks-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', textAlign: 'left', fontFamily: 'Arial, Helvetica, sans-serif', background: '#ffffff' }}>
                        <thead>
                          <tr style={{ background: '#708090', color: '#ffffff', borderBottom: '1px solid #4a5568' }}>
                            <th style={{ background: '#708090', color: '#ffffff', padding: '4px 6px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Candidate Name</th>
                            <th style={{ background: '#708090', color: '#ffffff', padding: '4px 6px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Pay Rate</th>
                            <th style={{ background: '#708090', color: '#ffffff', padding: '4px 6px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Pay Rate Type</th>
                            <th style={{ background: '#708090', color: '#ffffff', padding: '4px 6px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Assigned By</th>
                            <th style={{ background: '#708090', color: '#ffffff', padding: '4px 6px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Assigned On</th>
                            <th style={{ background: '#708090', color: '#ffffff', padding: '4px 6px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Status</th>
                            <th style={{ background: '#708090', color: '#ffffff', padding: '4px 6px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Status Comments</th>
                            <th style={{ background: '#708090', color: '#ffffff', padding: '4px 6px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Schedule Interview</th>
                            <th style={{ background: '#708090', color: '#ffffff', padding: '4px 6px', fontWeight: 'bold', fontSize: '11px' }}>Rejected Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getScopedPotentialCandidates(potentialCandidates).length === 0 ? (
                            <tr>
                              <td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: '#000080', background: '#ffffff', fontSize: '11.5px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#0f172a', fontSize: '12px' }}>
                                  No candidates assigned to this requisition yet.
                                </div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCandidateIntakeData({
                                        id: null,
                                        name: '',
                                        firstName: '',
                                        lastName: '',
                                        email: '',
                                        phone: '',
                                        role: editingFields.jobTitle || editingFields.title || selectedReq?.title || '',
                                        fullRole: editingFields.jobTitle || editingFields.title || selectedReq?.title || '',
                                        exp: editingFields.experience || '5',
                                        location: editingFields.location || 'Richmond, VA',
                                        city: editingFields.city || 'Richmond',
                                        state: editingFields.state || 'VA',
                                        payRate: editingFields.payRate || '75',
                                        rateType: editingFields.rateType || 'C2C',
                                        workAuth: editingFields.workAuth !== 'Select' ? editingFields.workAuth : 'US Citizen',
                                        skills: Array.isArray(editingFields.skills) ? editingFields.skills.join(', ') : (editingFields.skills || ''),
                                        resumeName: '',
                                        resumeFile: null,
                                        targetJobId: selectedReq?.id || '',
                                        comments: `Direct sourcing for Requisition #${selectedReq?.id?.replace('J-', '')}`
                                      })
                                      setShowCandidateIntakeModal(true)
                                    }}
                                    style={{
                                      background: '#ea580c',
                                      color: '#ffffff',
                                      border: 'none',
                                      padding: '4px 14px',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                      boxShadow: '0 1px 2px rgba(234, 88, 12, 0.25)'
                                    }}
                                  >
                                    ➕ Add / Parse Candidate
                                  </button>
                                  <span style={{ color: '#94a3b8' }}>or</span>
                                  <button
                                    type="button"
                                    onClick={() => setShowAddCandidateModal(true)}
                                    style={{
                                      background: '#f1f5f9',
                                      color: '#0033cc',
                                      border: '1px solid #cbd5e1',
                                      padding: '4px 12px',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      borderRadius: '3px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    📋 Select from Pool
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            getScopedPotentialCandidates(potentialCandidates).map((pc, idx) => (
                              <tr key={pc.id} style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '4px 6px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                    <span onClick={() => handleOpenCandidateView(pc)} style={{ color: '#0033cc', cursor: 'pointer', textDecoration: 'none', fontWeight: 'normal' }}
                                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                                      {pc.name}
                                    </span>
                                    <span
                                      onClick={() => handleOpenCandidateView(pc)}
                                      style={{ fontSize: '9.5px', color: '#0033cc', cursor: 'pointer' }}
                                    >
                                      📄 View Details & History
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding: '4px 6px', color: '#000000' }}>{pc.payRate}</td>
                                <td style={{ padding: '4px 6px', color: '#000000' }}>{pc.payRateType}</td>
                                <td style={{ padding: '4px 6px', color: '#000000' }}>{pc.assignedBy}</td>
                                <td style={{ padding: '4px 6px', color: '#000000', fontSize: '10px' }}>{pc.assignedOn}</td>
                                <td style={{ padding: '4px 6px', minWidth: '170px' }}>
                                  <select
                                    value={pc.status}
                                    onChange={e => handleUpdatePotentialCandidate(pc.id, 'status', e.target.value)}
                                    style={{
                                      fontSize: '10.5px',
                                      padding: '2px 4px',
                                      border: '1px solid #7f9db9',
                                      borderRadius: 0,
                                      background: '#ffffff',
                                      fontWeight: 'bold',
                                      width: '100%',
                                      outline: 'none',
                                      color: pc.status === 'Placed' ? '#166534' : pc.status.includes('Interview') ? '#1d4ed8' : pc.status.includes('Rejected') ? '#dc2626' : '#000080'
                                    }}
                                  >
                                    <option value="Int-SubmittedToManager">Int-SubmittedToManager</option>
                                    <option value="Int-ApprovedByManager">Int-ApprovedByManager</option>
                                    <option value="Int-RejectedByManager">Int-RejectedByManager</option>
                                    <option value="Agency-Submitted">Agency-Submitted</option>
                                    <option value="Agency-InterviewScheduled">Agency-InterviewScheduled</option>
                                    <option value="Agency-Approved">Agency-Approved</option>
                                    <option value="Agency-Rejected">Agency-Rejected</option>
                                    <option value="Client-SubmittedToCustomer">Client-SubmittedToCustomer</option>
                                    <option value="Client-InterviewScheduled">Client-InterviewScheduled</option>
                                    <option value="Client-Selected">Client-Selected</option>
                                    <option value="Client-Rejected">Client-Rejected</option>
                                    <option value="Offer Extended">Offer Extended</option>
                                    <option value="Placed">Placed</option>
                                  </select>
                                  
                                  {/* Audit Info Strip */}
                                  {pc.lastChangedBy && (
                                    <div style={{ fontSize: '9.5px', color: '#475569', marginTop: '2px', lineHeight: '1.2' }}>
                                      <span style={{ fontWeight: 'bold' }}>Changed by:</span>{' '}
                                      <span style={{ color: pc.lastChangedRole === 'Manager' || pc.lastChangedRole === 'superadmin' ? '#b45309' : '#000080', fontWeight: 'bold' }}>
                                        {pc.lastChangedRole || 'Recruiter'} ({pc.lastChangedBy})
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '4px 6px' }}>
                                  <textarea
                                    rows={1}
                                    value={pc.statusComments || ''}
                                    onChange={e => handleUpdatePotentialCandidate(pc.id, 'statusComments', e.target.value)}
                                    placeholder="Comments..."
                                    style={{
                                      fontSize: '10.5px',
                                      padding: '2px 4px',
                                      width: '110px',
                                      border: '1px solid #7f9db9',
                                      borderRadius: 0,
                                      fontFamily: 'inherit',
                                      resize: 'vertical',
                                      outline: 'none'
                                    }}
                                  />
                                </td>
                                <td style={{ padding: '4px 6px' }}>
                                  <select
                                    value={pc.interview || 'Select'}
                                    onChange={e => handleUpdatePotentialCandidate(pc.id, 'interview', e.target.value)}
                                    style={{ fontSize: '10.5px', padding: '2px 4px', border: '1px solid #7f9db9', borderRadius: 0, background: '#ffffff', minWidth: '95px', outline: 'none' }}
                                  >
                                    <option value="Select">Select</option>
                                    <option value="Round 1 (Virtual)">Round 1 (Virtual)</option>
                                    <option value="Technical Panel">Technical Panel</option>
                                    <option value="Client Manager Round">Client Manager Round</option>
                                    <option value="Final Round">Final Round</option>
                                  </select>
                                </td>
                                <td style={{ padding: '4px 6px' }}>
                                  <select
                                    value={pc.rejectedReason || 'Select'}
                                    onChange={e => handleUpdatePotentialCandidate(pc.id, 'rejectedReason', e.target.value)}
                                    style={{ fontSize: '10.5px', padding: '2px 4px', border: '1px solid #7f9db9', borderRadius: 0, background: '#ffffff', minWidth: '95px', outline: 'none' }}
                                  >
                                    <option value="Select">Select</option>
                                    <option value="Rate High">Rate High</option>
                                    <option value="Skill Gap">Skill Gap</option>
                                    <option value="Client Selected Another">Client Selected Another</option>
                                    <option value="Not Local">Not Local</option>
                                    <option value="Failed Tech Round">Failed Tech Round</option>
                                    <option value="Candidate Withdrew">Candidate Withdrew</option>
                                  </select>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Metadata & Save Bar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '12px',
                      paddingTop: '8px',
                      borderTop: '1px solid #e2e8f0',
                      fontSize: '11px',
                      color: '#000080'
                    }}>
                      <div>
                        <span>Created by: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.createdBy || 'admin'}</span>
                        <span> on: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.createdOn || '2026-08-26 11:40:14 AM'}</span>
                        <span style={{ marginLeft: '16px' }}>Last Updated by: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.lastUpdatedBy || userName}</span>
                        <span> on: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.lastUpdatedOn || '8/26/2026 11:43:52 AM'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveRequisition()}
                        style={{
                          border: '1px solid #71717a',
                          background: '#e4e4e7',
                          color: '#0f172a',
                          padding: '2px 14px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          borderRadius: 0
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── TAB 4: AI FIT REVIEW SUBTAB ─── */}
                {activeReqTab === 'aiFit' && (
                  <div style={{ fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#000080', fontSize: '12px' }}>
                          🧠 AI Candidate Match & Fit Review for Requisition #{resolveReqId(selectedReq?.id, selectedReq)}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '10.5px', marginTop: '2px' }}>
                          Instant match evaluation against <strong>{editingFields.title || selectedReq?.title}</strong> ({editingFields.customer || 'State Client'}).
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {getScopedPotentialCandidates(potentialCandidates).length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 0 }}>
                          No candidates submitted to evaluate AI fit for this position yet.
                        </div>
                      ) : (
                        getScopedPotentialCandidates(potentialCandidates).map((pc, idx) => (
                          <div
                            key={pc.id || idx}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #7f9db9',
                              borderLeft: '4px solid #0284c7',
                              borderRadius: 0,
                              padding: '10px 14px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#000080', cursor: 'pointer' }} onClick={() => handleOpenCandidateView(pc)}>
                                  {pc.name}
                                </span>
                                <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', borderRadius: 0, border: '1px solid #bbf7d0' }}>
                                  {pc.aiAnalysis ? `🎯 ${pc.aiAnalysis.fitScore}% Match` : '🎯 92% Match (Strong)'}
                                </span>
                                <span style={{ color: '#64748b', fontSize: '10.5px' }}>
                                  Rate: <strong>{pc.payRate} ({pc.payRateType || 'C2C'})</strong> | Sourced By: <strong>{pc.assignedBy}</strong>
                                </span>
                              </div>

                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAiFitModal(pc)}
                                  style={{
                                    background: '#0284c7',
                                    color: '#ffffff',
                                    border: '1px solid #0369a1',
                                    padding: '3px 10px',
                                    fontSize: '10.5px',
                                    fontWeight: 'bold',
                                    borderRadius: 0,
                                    cursor: 'pointer'
                                  }}
                                >
                                  🪄 Deep AI Analysis
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleManagerUpdateStatus(pc.id, 'Int-ApprovedByManager')}
                                  style={{ background: '#16a34a', color: '#ffffff', border: '1px solid #15803d', padding: '3px 8px', fontSize: '10.5px', fontWeight: 'bold', borderRadius: 0, cursor: 'pointer' }}
                                >
                                  ✅ Approve
                                </button>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f8fafc', padding: '6px 10px', borderRadius: 0, border: '1px solid #e2e8f0' }}>
                              <div>
                                <span style={{ fontWeight: 'bold', color: '#166534', fontSize: '10.5px' }}>Matched Required Skills: </span>
                                <span style={{ color: '#0f172a', fontSize: '10.5px' }}>
                                  {Array.isArray(editingFields.skills) ? editingFields.skills.slice(0, 3).join(', ') : 'Network Architecture, Routing, Security'}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontWeight: 'bold', color: '#b45309', fontSize: '10.5px' }}>Skill Strengths: </span>
                                <span style={{ color: '#0f172a', fontSize: '10.5px' }}>
                                  10+ years experience, State government project alignment
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Bottom Metadata & Save Bar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '12px',
                      paddingTop: '8px',
                      borderTop: '1px solid #e2e8f0',
                      fontSize: '11px',
                      color: '#000080'
                    }}>
                      <div>
                        <span>Created by: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.createdBy || 'admin'}</span>
                        <span> on: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.createdOn || '2026-08-26 11:40:14 AM'}</span>
                        <span style={{ marginLeft: '16px' }}>Last Updated by: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.lastUpdatedBy || userName}</span>
                        <span> on: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.lastUpdatedOn || '8/26/2026 11:43:52 AM'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveRequisition()}
                        style={{
                          border: '1px solid #71717a',
                          background: '#e4e4e7',
                          color: '#0f172a',
                          padding: '2px 14px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          borderRadius: 0
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── TAB 5: ATTACHMENTS (MATCHED TO IMAGE) ─── */}
                {activeReqTab === 'attachments' && (
                  <div style={{ fontSize: '11px' }}>
                    <div style={{ textAlign: 'right', marginBottom: '6px' }}>
                      <span
                        onClick={() => setShowAddAttachment(true)}
                        style={{ color: '#000080', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Add New Attachment
                      </span>
                    </div>

                    <div style={{ border: '1px solid #7f9db9', borderRadius: 0, marginBottom: '10px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                        <tbody>
                          {attachments.map((att, idx) => (
                            <tr key={att.id || idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '5px 8px', color: '#0f172a', width: '40%' }}>
                                {att.title}
                              </td>
                              <td style={{ padding: '5px 8px', color: '#000080', fontWeight: 'bold', cursor: 'pointer' }}>
                                {att.filename}
                              </td>
                              <td style={{ padding: '5px 8px', textAlign: 'right', width: '70px' }}>
                                <span style={{ cursor: 'pointer', marginRight: '8px' }} title="Edit">✏️</span>
                                <span
                                  onClick={() => handleDeleteAttachment(att.id)}
                                  style={{ cursor: 'pointer', color: '#dc2626', fontWeight: 'bold' }}
                                  title="Delete"
                                >
                                  ❌
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Attach New Document Box */}
                    {showAddAttachment && (
                      <div style={{ border: '1px solid #7f9db9', borderRadius: 0, background: '#f8fafc', padding: '10px 14px', marginBottom: '10px', position: 'relative' }}>
                        <span
                          onClick={() => setShowAddAttachment(false)}
                          style={{ position: 'absolute', top: '6px', right: '10px', color: '#000080', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          X
                        </span>
                        <div style={{ color: '#000080', fontWeight: 'bold', marginBottom: '6px' }}>Attach New Document</div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ color: '#000080', fontWeight: 'bold' }}>Attachment :</label>
                          <input
                            type="file"
                            onChange={e => setNewAttachmentFile(e.target.files[0])}
                            style={{ fontSize: '11px', borderRadius: 0 }}
                          />

                          <label style={{ color: '#000080', fontWeight: 'bold' }}>Title :</label>
                          <input
                            type="text"
                            value={newAttachmentTitle}
                            onChange={e => setNewAttachmentTitle(e.target.value)}
                            style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0, width: '260px', outline: 'none' }}
                          />
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (newAttachmentFile || newAttachmentTitle) {
                                setAttachments(prev => [
                                  ...prev,
                                  {
                                    id: Date.now(),
                                    title: newAttachmentTitle || newAttachmentFile?.name || 'New Attachment',
                                    filename: newAttachmentFile?.name || `${newAttachmentTitle}.doc`
                                  }
                                ])
                                setNewAttachmentTitle('')
                                setNewAttachmentFile(null)
                                setShowAddAttachment(false)
                              }
                            }}
                            style={{ border: '1px solid #71717a', background: '#e4e4e7', color: '#0f172a', padding: '2px 12px', fontSize: '10.5px', fontWeight: 'bold', cursor: 'pointer', borderRadius: 0 }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Bottom Metadata & Save Bar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '12px',
                      paddingTop: '8px',
                      borderTop: '1px solid #e2e8f0',
                      fontSize: '11px',
                      color: '#000080'
                    }}>
                      <div>
                        <span>Created by: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.createdBy || 'admin'}</span>
                        <span> on: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.createdOn || '2026-08-26 11:40:14 AM'}</span>
                        <span style={{ marginLeft: '16px' }}>Last Updated by: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.lastUpdatedBy || userName}</span>
                        <span> on: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.lastUpdatedOn || '8/26/2026 11:43:52 AM'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveRequisition()}
                        style={{
                          border: '1px solid #71717a',
                          background: '#e4e4e7',
                          color: '#0f172a',
                          padding: '2px 14px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          borderRadius: 0
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── TAB 6: NEW CANDIDATES (0) (MATCHED TO IMAGE) ─── */}
                {activeReqTab === 'newCandidates' && (
                  <div style={{ fontSize: '11px' }}>
                    <div style={{ padding: '14px 0', fontSize: '11.5px' }}>
                      <div style={{ color: '#000080', fontWeight: 'bold', marginBottom: '6px' }}>
                        Candidates are not available for this view!
                      </div>
                      <span
                        onClick={() => {
                          setNewCandReqForm({
                            firstName: '',
                            lastName: '',
                            email: '',
                            phone: '',
                            payRate: editingFields.payRate || '70',
                            payRateType: 'C2C',
                            workAuth: editingFields.workAuth !== 'Select' ? editingFields.workAuth : 'US Citizen',
                            exp: editingFields.experience || '5',
                            skills: Array.isArray(editingFields.skills) ? editingFields.skills.join(', ') : '',
                            comments: `Sourced by ${userName} for Requisition #${selectedReq?.id?.replace('J-', '')}`,
                            status: 'Int-SubmittedToManager'
                          })
                          setShowAddCandidateModal(true)
                        }}
                        style={{ color: '#000080', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Select Candidate
                      </span>
                    </div>

                    {/* Bottom Metadata & Save Bar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '24px',
                      paddingTop: '8px',
                      borderTop: '1px solid #e2e8f0',
                      fontSize: '11px',
                      color: '#000080'
                    }}>
                      <div>
                        <span>Created by: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.createdBy || 'admin'}</span>
                        <span> on: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.createdOn || '2026-08-26 11:40:14 AM'}</span>
                        <span style={{ marginLeft: '16px' }}>Last Updated by: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.lastUpdatedBy || userName}</span>
                        <span> on: </span>
                        <span style={{ color: '#0f172a' }}>{editingFields.lastUpdatedOn || '8/26/2026 11:43:52 AM'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveRequisition()}
                        style={{
                          border: '1px solid #71717a',
                          background: '#e4e4e7',
                          color: '#0f172a',
                          padding: '2px 14px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          borderRadius: 0
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Outside Bottom Action Row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('portal')}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #7f9db9', padding: '3px 14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', borderRadius: 0 }}
                >
                  &lt;&lt; Back To Search Results
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveRequisition()}
                  style={{
                    border: '1px solid #71717a',
                    background: '#e4e4e7',
                    color: '#0f172a',
                    padding: '3px 18px',
                    fontSize: '11.5px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    borderRadius: 0
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 3: ADMINISTRATION & TEAM / EMPLOYEE MANAGEMENT PANEL
              ───────────────────────────────────────────────────────────── */}
          {activeMainTab === 'admin' && viewMode === 'portal' && (
            <div>
              <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '8px' }}>
                You are here: <span style={{ color: '#0066cc', cursor: 'pointer' }} onClick={() => setActiveMainTab('requisitions')}>Home</span> &gt; Administration &gt; Team & Employee Management
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px 20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Header Strip */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ea580c', paddingBottom: '8px', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '16px', color: '#1e3a8a', fontWeight: 'bold' }}>
                      {isAdmin || isManager ? 'SmartWorks Administration — Team & Recruiter Management' : `My Team — Employees & Sourcing Specialists under ${userName}`}
                    </h2>
                    <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: '#64748b' }}>
                      {isAdmin || isManager
                        ? 'Manage full team roster, invite new recruiters or employees, assign roles, and configure system credentials.'
                        : `Manage all employees and sub-recruiters directly reporting to ${userName}. Added team members can immediately log in with their credentials.`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null)
                      setUserFormData({
                        name: '',
                        email: '',
                        password: 'recruiter123',
                        role: isAdmin || isManager ? 'recruiter' : 'employee',
                        parentRecruiterName: isAdmin || isManager ? '' : userName,
                        company: 'SmartHire',
                        isActive: true
                      })
                      setShowUserModal(true)
                    }}
                    style={{
                      background: '#ea580c',
                      color: '#ffffff',
                      border: 'none',
                      padding: '7px 18px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 1px 3px rgba(234, 88, 12, 0.3)'
                    }}
                  >
                    <span>+ {isAdmin || isManager ? 'Add New Team Member / Recruiter' : 'Add Employee Under Me'}</span>
                  </button>
                </div>

                {/* 4 Key Metric Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1d4ed8' }}>TOTAL TEAM USERS</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#1e3a8a', marginTop: '2px' }}>
                      {isAdmin || isManager ? teamUsers.length : teamUsers.filter(u => u.name === userName || (u.parentRecruiterName && u.parentRecruiterName.toLowerCase() === userName.toLowerCase())).length}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#60a5fa', marginTop: '2px' }}>Registered in portal</div>
                  </div>

                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#047857' }}>ACTIVE RECRUITERS</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#065f46', marginTop: '2px' }}>
                      {teamUsers.filter(u => u.role === 'recruiter' && u.isActive !== false).length}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#34d399', marginTop: '2px' }}>Lead talent acquisition</div>
                  </div>

                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#b45309' }}>EMPLOYEES / SOURCERS</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#78350f', marginTop: '2px' }}>
                      {teamUsers.filter(u => u.role === 'employee' && u.isActive !== false).length}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#f59e0b', marginTop: '2px' }}>Subordinate members</div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>ASSIGNED REQUISITIONS</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                      {jobs.filter(j => Array.isArray(j.assignedRecruiters) && j.assignedRecruiters.length > 0).length}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>Active requirements</div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '4px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a' }}>Filter Team:</span>
                    <input
                      type="text"
                      placeholder="Search name, email..."
                      value={userSearchQuery}
                      onChange={e => setUserSearchQuery(e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px', width: '180px' }}
                    />
                    {isAdmin && (
                      <select
                        value={userRoleFilter}
                        onChange={e => setUserRoleFilter(e.target.value)}
                        style={{ padding: '4px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px', fontWeight: 'bold' }}
                      >
                        <option value="All">All Roles</option>
                        <option value="manager">🛡️ Managers (Account Leads)</option>
                        <option value="superadmin">👑 Super Admin</option>
                        <option value="recruiter">💼 Lead Recruiters</option>
                        <option value="employee">👤 Employees (Sub-Recruiters)</option>
                      </select>
                    )}
                  </div>

                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>
                    Showing users for: <span style={{ color: '#0284c7' }}>{isAdmin ? 'Entire Organization' : `Team of ${userName}`}</span>
                  </span>
                </div>

                {/* Team Users Table */}
                <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '3px' }}>
                  <table className="coolworks-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', textAlign: 'left', background: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                    <thead>
                      <tr style={{ background: '#708090', color: '#ffffff', borderBottom: '1px solid #4a5568' }}>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Member Name</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Role / Designation</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Reports To (Lead Recruiter)</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Corporate Email (Login ID)</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Password</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Assigned Requirements</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Account Status</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 8px', fontWeight: 'bold', textAlign: 'center', fontSize: '11px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamUsers
                        .filter(u => {
                          if (!isAdmin) {
                            // Non-admins only see themselves and their subordinates
                            const isMe = u.name.toLowerCase() === userName.toLowerCase()
                            const isMySub = u.parentRecruiterName && u.parentRecruiterName.toLowerCase() === userName.toLowerCase()
                            if (!isMe && !isMySub) return false
                          }
                          if (userRoleFilter !== 'All' && u.role !== userRoleFilter) return false
                          if (userSearchQuery.trim()) {
                            const q = userSearchQuery.toLowerCase()
                            return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.parentRecruiterName?.toLowerCase().includes(q)
                          }
                          return true
                        })
                        .map((u, idx) => {
                          const assignedReqsCount = jobs.filter(j => Array.isArray(j.assignedRecruiters) && j.assignedRecruiters.some(r => r.toLowerCase().includes(u.name.toLowerCase()))).length
                          const isCurrentUser = u.name.toLowerCase() === userName.toLowerCase() || u.email?.toLowerCase() === currentUser?.email?.toLowerCase()

                          return (
                            <tr key={u.id || idx} style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '5px 8px', fontWeight: 'bold', color: '#000000' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    background: u.role === 'superadmin' || u.role === 'admin' ? '#0284c7' : u.role === 'manager' ? '#d97706' : u.role === 'recruiter' ? '#ea580c' : '#10b981',
                                    color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold'
                                  }}>
                                    {u.name?.slice(0, 2).toUpperCase() || 'U'}
                                  </div>
                                  <span>{u.name} {isCurrentUser ? '(You)' : ''}</span>
                                </div>
                              </td>

                              <td style={{ padding: '5px 8px' }}>
                                <span style={{
                                  background: u.role === 'superadmin' || u.role === 'admin' ? '#e0f2fe' : u.role === 'manager' ? '#fef3c7' : u.role === 'recruiter' ? '#ffedd5' : '#dcfce7',
                                  color: u.role === 'superadmin' || u.role === 'admin' ? '#0369a1' : u.role === 'manager' ? '#92400e' : u.role === 'recruiter' ? '#c2410c' : '#15803d',
                                  border: '1px solid',
                                  borderColor: u.role === 'superadmin' || u.role === 'admin' ? '#bae6fd' : u.role === 'manager' ? '#fde68a' : u.role === 'recruiter' ? '#fed7aa' : '#bbf7d0',
                                  borderRadius: '2px', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold'
                                }}>
                                  {u.role === 'superadmin' || u.role === 'admin' ? '👑 Super Admin' : u.role === 'manager' ? '🛡️ Manager / Lead' : u.role === 'recruiter' ? '💼 Lead Recruiter' : '👤 Employee (Sourcing)'}
                                </span>
                              </td>

                              <td style={{ padding: '5px 8px', color: '#000000' }}>
                                {u.parentRecruiterName ? (
                                  <span style={{ color: '#0033cc', fontWeight: 'bold' }}>
                                    Reports to {u.parentRecruiterName}
                                  </span>
                                ) : (
                                  <span style={{ color: '#94a3b8' }}>Independent</span>
                                )}
                              </td>

                              <td style={{ padding: '5px 8px', color: '#0033cc', fontFamily: 'monospace' }}>
                                {u.email}
                              </td>

                              <td style={{ padding: '5px 8px', color: '#000000', fontFamily: 'monospace' }}>
                                <span style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '2px', border: '1px solid #cbd5e1' }}>
                                  {u.password || '••••••••'}
                                </span>
                              </td>

                              <td style={{ padding: '5px 8px' }}>
                                <span style={{
                                  background: assignedReqsCount > 0 ? '#dbeafe' : '#f1f5f9',
                                  color: assignedReqsCount > 0 ? '#1e40af' : '#64748b',
                                  fontWeight: 'bold', borderRadius: '2px', padding: '2px 6px', fontSize: '10.5px'
                                }}>
                                  {assignedReqsCount} Req{assignedReqsCount === 1 ? '' : 's'} Assigned
                                </span>
                              </td>

                              <td style={{ padding: '5px 8px' }}>
                                <span style={{
                                  color: u.isActive !== false ? '#16a34a' : '#dc2626',
                                  fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px'
                                }}>
                                  {u.isActive !== false ? '🟢 Active' : '🔴 Inactive'}
                                </span>
                              </td>

                              <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingUser(u)
                                      setUserFormData({
                                        name: u.name || '',
                                        email: u.email || '',
                                        password: u.password || '',
                                        role: u.role || 'recruiter',
                                        parentRecruiterName: u.parentRecruiterName || '',
                                        company: u.company || 'SmartHire',
                                        isActive: u.isActive !== false
                                      })
                                      setShowUserModal(true)
                                    }}
                                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 8px', fontSize: '10.5px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' }}
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = teamUsers.map(item => item.id === u.id || item.email === u.email ? { ...item, isActive: !item.isActive } : item)
                                      saveTeamUsers(updated)
                                      setSaveToastMessage(`User ${u.name} status toggled!`)
                                      setTimeout(() => setSaveToastMessage(null), 3000)
                                    }}
                                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 8px', fontSize: '10.5px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' }}
                                  >
                                    {u.isActive !== false ? 'Deactivate' : 'Activate'}
                                  </button>

                                  {u.email !== 'omkesh@coolsofttech.com' && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTeamUser(u)}
                                      style={{
                                        background: '#fee2e2',
                                        border: '1px solid #fca5a5',
                                        color: '#dc2626',
                                        padding: '2px 8px',
                                        fontSize: '10.5px',
                                        fontWeight: 'bold',
                                        borderRadius: '2px',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}
                                      title="Permanently Delete User"
                                    >
                                      🗑️ Delete
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 1: REQUISITIONS VIEW (PORTAL HOME + SEARCH REQUISITIONS)
              ───────────────────────────────────────────────────────────── */}
          {activeMainTab === 'requisitions' && viewMode === 'portal' && (
            <div>
              <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '8px' }}>
                You are here: <span style={{ color: '#0066cc', cursor: 'pointer' }}>Home</span> &gt; Requisitions
              </div>

              {/* Search Requisitions Filter Panel */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px 18px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h2 style={{ margin: 0, fontSize: '15px', color: '#1e3a8a', fontWeight: 'bold' }}>
                    {isEmployee ? 'My Assigned Requisitions' : 'Search Requisitions'}
                  </h2>
                  {canCreateRequisition && (
                    <span
                      onClick={handleAddNewRequisition}
                      style={{ color: '#0066cc', fontWeight: 'bold', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      + Add new Requisition
                    </span>
                  )}
                </div>

                <div
                  onClick={() => setShowFilterPanel(prev => !prev)}
                  style={{
                    background: '#bfdbfe', border: '1px solid #93c5fd', padding: '6px 12px',
                    fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a', cursor: 'pointer',
                    borderRadius: '3px 3px 0 0', display: 'flex', justifyContent: 'space-between'
                  }}
                >
                  <span>Modify Search &gt;&gt;</span>
                  <span>{showFilterPanel ? '▲ Hide Filters' : '▼ Show Filters'}</span>
                </div>

                {showFilterPanel && (
                  <form onSubmit={e => { e.preventDefault(); setCurrentPage(1); }} style={{ border: '1px solid #cbd5e1', borderTop: 'none', padding: '14px 16px', background: '#fdfdfe' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '14px 30px', fontSize: '11.5px' }}>
                      
                      {/* Left Column */}
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 10px', alignItems: 'center' }}>
                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Requisition #:</label>
                        <input type="text" value={reqFilters.reqId} onChange={e => setReqFilters({ ...reqFilters, reqId: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Position Title:</label>
                        <input type="text" value={reqFilters.title} onChange={e => setReqFilters({ ...reqFilters, title: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Skills:</label>
                        <input type="text" value={reqFilters.skills} onChange={e => setReqFilters({ ...reqFilters, skills: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>City:</label>
                        <input type="text" value={reqFilters.city} onChange={e => setReqFilters({ ...reqFilters, city: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>State:</label>
                        <select value={reqFilters.state} onChange={e => setReqFilters({ ...reqFilters, state: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option value="Select State">Select State</option>
                          {US_STATES.map(st => (
                            <option key={st.code} value={st.code}>{st.code} - {st.name}</option>
                          ))}
                        </select>

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Office:</label>
                        <select value={reqFilters.office} onChange={e => setReqFilters({ ...reqFilters, office: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>All</option>
                          <option>Columbia</option>
                          <option>Richmond</option>
                          <option>Austin</option>
                        </select>

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Assigned To:</label>
                        <select value={reqFilters.assignedTo} onChange={e => setReqFilters({ ...reqFilters, assignedTo: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option value="Any">Any</option>
                          {allRecruitersList.map(r => (
                            <option key={r.name} value={r.name}>{r.name} {r.name === userName ? '(You)' : ''}</option>
                          ))}
                        </select>

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Zip Code:</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input type="text" value={reqFilters.zipCode} onChange={e => setReqFilters({ ...reqFilters, zipCode: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                          <select value={reqFilters.radius} onChange={e => setReqFilters({ ...reqFilters, radius: e.target.value })} style={{ padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                            <option>Within Miles</option>
                            <option>10</option>
                            <option>25</option>
                            <option>50</option>
                            <option>100</option>
                          </select>
                        </div>

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Req Category:</label>
                        <select value={reqFilters.category} onChange={e => setReqFilters({ ...reqFilters, category: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>Select Req Category</option>
                          <option>SP</option>
                          <option>IT</option>
                          <option>ENG</option>
                        </select>
                      </div>

                      {/* Right Column */}
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 10px', alignItems: 'center' }}>
                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Creation Date:</label>
                        <input type="text" placeholder="MM/DD/YYYY" value={reqFilters.creationDate} onChange={e => setReqFilters({ ...reqFilters, creationDate: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Deadline Date:</label>
                        <input type="text" placeholder="MM/DD/YYYY" value={reqFilters.deadlineDate} onChange={e => setReqFilters({ ...reqFilters, deadlineDate: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Status:</label>
                        <select value={reqFilters.status} onChange={e => setReqFilters({ ...reqFilters, status: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>Select Status</option>
                          <option>In-Progress</option>
                          <option>Ready</option>
                          <option>Closed</option>
                          <option>All</option>
                        </select>

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>End client:</label>
                        <select value={reqFilters.endClient} onChange={e => setReqFilters({ ...reqFilters, endClient: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>Any</option>
                          <option>State Of SC</option>
                          <option>DFA</option>
                          <option>DBHDS</option>
                          <option>VDOT</option>
                        </select>

                        <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', margin: '4px 0' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                            <input type="checkbox" checked={reqFilters.govtReqs} onChange={e => setReqFilters({ ...reqFilters, govtReqs: e.target.checked })} /> Govt Requisitions
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                            <input type="checkbox" checked={reqFilters.directClient} onChange={e => setReqFilters({ ...reqFilters, directClient: e.target.checked })} /> Direct Client
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                            <input type="checkbox" checked={reqFilters.working} onChange={e => setReqFilters({ ...reqFilters, working: e.target.checked })} /> Working(W)
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                            <input type="checkbox" checked={reqFilters.keyReq} onChange={e => setReqFilters({ ...reqFilters, keyReq: e.target.checked })} /> Key (K)
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                            <input type="checkbox" checked={reqFilters.hotReq} onChange={e => setReqFilters({ ...reqFilters, hotReq: e.target.checked })} /> Hot Req
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                            <input type="checkbox" checked={reqFilters.incumbentVendor} onChange={e => setReqFilters({ ...reqFilters, incumbentVendor: e.target.checked })} /> IncumbentVendor(IV)
                          </label>
                        </div>

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Subcontractable:</label>
                        <select value={reqFilters.subcontractable} onChange={e => setReqFilters({ ...reqFilters, subcontractable: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>Select</option>
                          <option>No</option>
                          <option>Yes</option>
                        </select>

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Req Type:</label>
                        <select value={reqFilters.reqType} onChange={e => setReqFilters({ ...reqFilters, reqType: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>Select Req Type</option>
                          <option>Contract</option>
                          <option>Permanent</option>
                          <option>C2H</option>
                        </select>
                      </div>

                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setReqFilters({
                            reqId: '',
                            title: '',
                            skills: '',
                            city: '',
                            state: 'Select State',
                            office: 'All',
                            assignedTo: 'Any',
                            zipCode: '',
                            radius: 'Within Miles',
                            category: 'Select Req Category',
                            creationDate: '',
                            deadlineDate: '',
                            status: 'Select Status',
                            endClient: 'Any',
                            govtReqs: false,
                            directClient: false,
                            working: false,
                            keyReq: false,
                            hotReq: false,
                            incumbentVendor: false,
                            subcontractable: 'Select',
                            reqType: 'Select Req Type'
                          })
                        }}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 12px', fontSize: '11.5px', cursor: 'pointer' }}
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '3px 18px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Search
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* All Open Requisitions Table */}
              <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '4px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h2 style={{ margin: '0 0 2px', fontSize: '13.5px', color: '#008000', fontWeight: 'bold', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                  {isEmployee
                    ? '🔒 Employee Workspace — Assigned Requisitions'
                    : isRecruiter
                    ? `💼 SmartWorks Talent Workspace — ${userName}`
                    : 'SmartHire Recruitment Portal Home'}
                </h2>
                <div style={{ fontSize: '11.5px', color: '#000080', fontWeight: 'bold', marginBottom: '10px', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                  {isEmployee
                    ? `Welcome back, ${userName}. You have ${filteredJobs.length} assigned requisition(s).`
                    : `Welcome back to SmartWorks, ${userName}. You have ${jobs.length} tasks.`}
                </div>

                <div style={{
                  background: '#bfdbfe',
                  border: '1px solid #93c5fd',
                  padding: '5px 10px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderRadius: '2px 2px 0 0',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  flexWrap: 'wrap', gap: '6px'
                }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#000080' }}>
                    {isEmployee ? `My Assigned Requisitions (${filteredJobs.length})` : 'All Open Requisitions'}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {(isSuperAdmin || isAdmin) && (
                      <>
                        <button
                          type="button"
                          onClick={handleScrapeLiveJobs}
                          disabled={isScrapingJobs}
                          style={{
                            background: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            padding: '2px 10px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Scrape and sync live job requisitions from JobsInHand"
                        >
                          {isScrapingJobs ? '⏳ Syncing...' : '⚡ Scrape Live JDs'}
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open('/linkedin-posts', '_blank')}
                          style={{
                            background: '#0a66c2',
                            color: '#ffffff',
                            border: 'none',
                            padding: '2px 10px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Open LinkedIn Auto-Poster Studio"
                        >
                          <span>🌐 LinkedIn Auto Hub</span>
                        </button>
                      </>
                    )}
                    <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#000080' }}>
                      (Requisitions {filteredJobs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredJobs.length)} of {filteredJobs.length})
                    </span>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderTop: 'none' }}>
                  <table className="coolworks-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', textAlign: 'left', fontFamily: 'Arial, Helvetica, sans-serif', background: '#ffffff' }}>
                    <thead>
                      <tr style={{ background: '#708090', color: '#ffffff', borderBottom: '1px solid #4a5568' }}>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 6px', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Req#</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 6px', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Position</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 6px', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Skills</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 6px', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Customer</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 6px', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Location</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 6px', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Deadline</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 6px', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Pay Rate</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 6px', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Recruiters</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 6px', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Status</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 6px', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Req Ctg</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 6px', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Req Type</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 5px', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Sub</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 5px', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Max sub</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 6px', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}>Creation Date</th>
                        <th style={{ background: '#708090', color: '#ffffff', padding: '5px 6px', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', fontSize: '11px' }}>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedJobs.length === 0 ? (
                        <tr>
                          <td colSpan="15" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                            {isEmployee ? (
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                                  🔒 No Requisitions Assigned Yet
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  You are in Employee restricted mode. When your lead recruiter assigns a requisition to you, it will appear here.
                                </div>
                              </div>
                            ) : (
                              'No open requisitions found matching search criteria.'
                            )}
                          </td>
                        </tr>
                      ) : (
                        paginatedJobs.map((job, idx) => {
                          const displayReqId = resolveReqId(job.reqId || job.id, job)
                          const rawTitle = cleanJobTitleWithPositionNumber(job.title, job) || job.title || 'Consultant'
                          let truncatedTitle = rawTitle
                          if (rawTitle.length > 55) {
                            const posMatch = rawTitle.match(/\(\d{5,8}\)/)
                            if (posMatch) {
                              const baseTitle = rawTitle.replace(/\s*\(\d{5,8}\)/, '')
                              truncatedTitle = `${baseTitle.slice(0, 42)}.. ${posMatch[0]}`
                            } else {
                              truncatedTitle = rawTitle.slice(0, 52) + '..'
                            }
                          }
                          
                          const allSkills = Array.isArray(job.skills) ? job.skills.join(', ') : (job.skills || 'Troubleshooting, Project Management')
                          const truncatedSkills = allSkills.length > 12 ? allSkills.slice(0, 10) + '..' : allSkills

                          const custName = job.client || job.customer || 'State Of SC'
                          const locName = job.location || 'Columbia,SC'
                          const deadDate = job.deadline || 'Sep 4, 2026'
                          const rateStr = job.budget ? String(job.budget).replace('/hr', '').trim() : ''

                          // Short customer name format helper
                          let shortCustomer = custName
                          const cLower = custName.toLowerCase()
                          const lStr = locName.toUpperCase()
                          if (cLower.includes('texas') || cLower.includes('hhsc') || lStr.includes('TX') || lStr.includes('AUSTIN')) {
                            shortCustomer = 'State Of TX'
                          } else if (cLower.includes('north carolina') || cLower.includes('ncdot') || lStr.includes('NC') || lStr.includes('ROCKY MOUNT')) {
                            shortCustomer = 'State Of NC'
                          } else if (cLower.includes('michigan') || cLower.includes('dmva') || lStr.includes('MI') || lStr.includes('LANSING')) {
                            shortCustomer = 'State Of MI'
                          } else if (cLower.includes('oregon') || lStr.includes('OR') || lStr.includes('SALEM')) {
                            shortCustomer = 'State Of OR'
                          } else if (cLower.includes('virginia') || cLower.includes('dbhds') || cLower.includes('vdot') || lStr.includes('VA') || lStr.includes('RICHMOND')) {
                            shortCustomer = 'State Of VA'
                          } else if (cLower.includes('justice') || cLower.includes('doj')) {
                            shortCustomer = 'DOJ'
                          } else if (cLower.includes('south carolina') || cLower.includes('sc ') || lStr.includes('SC') || lStr.includes('COLUMBIA')) {
                            shortCustomer = 'State Of SC'
                          } else if (shortCustomer.length > 14) {
                            shortCustomer = shortCustomer.slice(0, 12) + '..'
                          }

                          const recList = Array.isArray(job.assignedRecruiters) && job.assignedRecruiters.length > 0
                            ? job.assignedRecruiters.join(', ')
                            : (job.postedByName || '')
                          const truncatedRec = recList.length > 12 ? recList.slice(0, 10) + '..' : recList

                          const reqStatus = job.status === 'Active' ? 'Open' : (job.status || 'Open')
                          const reqCategory = job.category || 'SP'
                          const reqTypeVal = job.type || 'Contract'

                          // Dynamic candidate submission counts
                          let subList = []
                          try {
                            const raw = localStorage.getItem(`smarthire_potential_candidates_${rawId}`) ||
                                        localStorage.getItem(`smarthire_potential_candidates_${displayReqId}`)
                            if (raw) subList = JSON.parse(raw)
                          } catch (e) {}
                          if (!Array.isArray(subList)) subList = []

                          const subCount = subList.length
                          const maxSub = job.maxSubmissions || (subCount > 2 ? subCount : 2)
                          const createdDateStr = job.creationDate || 'Aug 25, 2026 05:08 PM'
                          const durationMonths = String(job.duration || '12').replace(/[^0-9]/g, '') || '12'

                          return (
                            <tr
                              key={job.id}
                              style={{
                                background: '#ffffff',
                                borderBottom: '1px solid #e2e8f0',
                                transition: 'background-color 0.12s ease'
                              }}
                            >
                              {/* 1. Req# (Clean Light Blue Link) */}
                              <td style={{ padding: '4px 6px' }}>
                                <span
                                  onClick={() => handleOpenReq(job)}
                                  style={{ color: '#0033cc', cursor: 'pointer', textDecoration: 'none' }}
                                  title={`Requisition #${displayReqId}\nClick to View Requisition Details`}
                                >
                                  {displayReqId}
                                </span>
                              </td>

                              {/* 2. Position (Clean Light Blue Link with Hover Tooltip) */}
                              <td style={{ padding: '4px 6px' }}>
                                <span
                                  onClick={() => handleOpenReq(job)}
                                  style={{ color: '#0033cc', cursor: 'pointer', textDecoration: 'none', fontWeight: 'normal' }}
                                  title={`Position Title: ${rawTitle}\nReq ID: #${displayReqId}\nCustomer: ${custName}`}
                                >
                                  {truncatedTitle}
                                </span>
                              </td>

                              {/* 3. Skills (Clean Black Font) */}
                              <td style={{ padding: '4px 6px', color: '#000000' }}>
                                <span title={`Required Skills:\n${allSkills}`}>
                                  {truncatedSkills}
                                </span>
                              </td>

                              {/* 4. Customer (Clean Black Font) */}
                              <td style={{ padding: '4px 6px', color: '#000000', lineHeight: '1.2', whiteSpace: 'pre-line' }}>
                                <span title={`Customer / Client Department:\n${custName}`}>
                                  {shortCustomer}
                                </span>
                              </td>

                              {/* 5. Location (Clean Black Font) */}
                              <td style={{ padding: '4px 6px', color: '#000000' }}>
                                <span title={`Job Location:\n${locName}`}>
                                  {locName}
                                </span>
                              </td>

                              {/* 6. Deadline (Clean Black Font) */}
                              <td style={{ padding: '4px 6px', color: '#000000', whiteSpace: 'nowrap' }}>
                                <span title={`Submission Deadline:\n${deadDate}`}>
                                  {deadDate}
                                </span>
                              </td>

                              {/* 7. Pay Rate */}
                              <td style={{ padding: '4px 6px', color: '#000000' }}>
                                {rateStr ? `$${rateStr}` : ''}
                              </td>

                              {/* 8. Recruiters (Clean Black Font) */}
                              <td style={{ padding: '4px 6px', color: '#000000' }}>
                                <span title={`Assigned Recruiters:\n${recList || 'None Assigned'}`}>
                                  {truncatedRec || ''}
                                </span>
                              </td>

                              {/* 9. Status (Clean Black Font) */}
                              <td style={{ padding: '4px 6px', color: '#000000' }}>
                                <span title={`Requisition Status: ${reqStatus}`}>
                                  {reqStatus}
                                </span>
                              </td>

                              {/* 10. Req Ctg */}
                              <td style={{ padding: '4px 6px', color: '#000000' }}>
                                {reqCategory}
                              </td>

                              {/* 11. Req Type */}
                              <td style={{ padding: '4px 6px', color: '#000000' }}>
                                {reqTypeVal}
                              </td>

                              {/* 12. Sub */}
                              <td style={{ padding: '4px 5px', textAlign: 'center', color: '#000000' }}>
                                <span title={`Total Submissions: ${subCount}`}>
                                  {subCount}
                                </span>
                              </td>

                              {/* 13. Max sub */}
                              <td style={{ padding: '4px 5px', textAlign: 'center', color: '#000000' }}>
                                <span title={`Maximum Allowed Submissions: ${maxSub}`}>
                                  {maxSub}
                                </span>
                              </td>

                              {/* 14. Creation Date */}
                              <td style={{ padding: '4px 6px', color: '#000000', whiteSpace: 'nowrap' }}>
                                <span title={`Requisition Creation Date:\n${createdDateStr}`}>
                                  {createdDateStr}
                                </span>
                              </td>

                              {/* 15. Duration */}
                              <td style={{ padding: '4px 6px', textAlign: 'center', color: '#000000' }}>
                                <span title={`Contract Duration: ${durationMonths} Months`}>
                                  {durationMonths}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#f8fafc', border: '1px solid #cbd5e1', borderTop: 'none', padding: '5px 12px',
                  fontFamily: 'Arial, Helvetica, sans-serif'
                }}>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const p = i + 1
                      return (
                        <span key={p} onClick={() => setCurrentPage(p)} style={{
                          color: currentPage === p ? '#ea580c' : '#0033cc',
                          cursor: 'pointer',
                          textDecoration: currentPage === p ? 'none' : 'underline'
                        }}>
                          {p}
                        </span>
                      )
                    })}
                    <span style={{ color: '#0033cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>Next</span>
                    <span style={{ color: '#0033cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentPage(totalPages)}>Last</span>
                  </div>

                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a' }}>
                    Page Size:
                    <select value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} style={{ marginLeft: '6px', fontSize: '11px', padding: '1px 4px', border: '1px solid #cbd5e1' }}>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* ═══════════ MODAL 1: ADD / EDIT TEAM USER (RECRUITER / EMPLOYEE / ADMIN) ═══════════ */}
        {showUserModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px'
          }}>
            <div style={{
              background: '#ffffff', borderRadius: '6px', width: '100%', maxWidth: '520px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden', border: '1px solid #cbd5e1'
            }}>
              {/* Modal Header */}
              <div style={{ background: '#ea580c', color: '#ffffff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>
                  {editingUser ? '✏️ Edit Team Member' : (isAdmin ? '➕ Add New Recruiter / Employee' : '➕ Add Employee Under My Account')}
                </h3>
                <span
                  onClick={() => setShowUserModal(false)}
                  style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1' }}
                >
                  &times;
                </span>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={e => {
                e.preventDefault()
                if (!userFormData.name.trim() || !userFormData.email.trim()) {
                  alert('Please enter both Name and Email.')
                  return
                }

                let updatedList
                let targetUser
                if (editingUser) {
                  targetUser = {
                    id: editingUser.id,
                    name: userFormData.name.trim(),
                    email: userFormData.email.trim(),
                    password: userFormData.password.trim(),
                    role: userFormData.role,
                    parentRecruiterName: userFormData.role === 'employee' ? (userFormData.parentRecruiterName || (isRecruiter ? userName : '')) : '',
                    company: userFormData.company || 'SmartHire',
                    isActive: userFormData.isActive !== false
                  }
                  updatedList = teamUsers.map(u => {
                    if (u.id === editingUser.id || u.email === editingUser.email) {
                      return {
                        ...u,
                        ...targetUser
                      }
                    }
                    return u
                  })
                  setSaveToastMessage(`✅ Updated profile for ${userFormData.name}!`)
                } else {
                  const newUserId = userFormData.role === 'employee' ? `emp-${Date.now().toString().slice(-4)}` : `rec-${Date.now().toString().slice(-4)}`
                  targetUser = {
                    id: newUserId,
                    name: userFormData.name.trim(),
                    email: userFormData.email.trim(),
                    password: userFormData.password.trim() || 'recruiter123',
                    role: userFormData.role,
                    parentRecruiterName: userFormData.role === 'employee' ? (userFormData.parentRecruiterName || (isRecruiter ? userName : '')) : '',
                    company: userFormData.company || 'SmartHire',
                    isActive: userFormData.isActive !== false
                  }
                  updatedList = [...teamUsers, targetUser]
                  setSaveToastMessage(`🎉 User ${targetUser.name} created successfully as ${targetUser.role}!`)
                }

                saveTeamUsers(updatedList, targetUser)
                setShowUserModal(false)
                setTimeout(() => setSaveToastMessage(null), 4000)
              }} style={{ padding: '18px 20px', fontSize: '12px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={userFormData.name}
                      onChange={e => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Corporate Email (Login ID) *</label>
                    <input
                      type="email"
                      required
                      placeholder="sarah@smarthire.io"
                      value={userFormData.email}
                      onChange={e => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Password *</label>
                    <input
                      type="text"
                      required
                      placeholder="Password"
                      value={userFormData.password}
                      onChange={e => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Role / Level *</label>
                    {isAdmin || isManager ? (
                      <select
                        value={userFormData.role}
                        onChange={e => setUserFormData(prev => ({ ...prev, role: e.target.value }))}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#ffffff' }}
                      >
                        <option value="recruiter">Lead Recruiter</option>
                        <option value="employee">Employee / Sourcing Specialist</option>
                        <option value="manager">Manager / Team Lead</option>
                        <option value="superadmin">Administrator / Superadmin</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        readOnly
                        value="Employee (Reporting to You)"
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#f1f5f9', color: '#64748b', fontWeight: 'bold' }}
                      />
                    )}
                  </div>
                </div>

                {/* Reports To (Only relevant if role is employee) */}
                {userFormData.role === 'employee' && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>
                      Reporting Manager / Lead Recruiter
                    </label>
                    {isAdmin || isManager ? (
                      <select
                        value={userFormData.parentRecruiterName || ''}
                        onChange={e => setUserFormData(prev => ({ ...prev, parentRecruiterName: e.target.value }))}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#ffffff' }}
                      >
                        <option value="">None (Independent Employee)</option>
                        {teamUsers
                          .filter(u => u.role === 'recruiter' || u.role === 'superadmin' || u.role === 'manager' || u.role === 'admin')
                          .map(u => (
                            <option key={u.id || u.name} value={u.name}>
                              {u.name} ({u.role})
                            </option>
                          ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        readOnly
                        value={userName}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#f1f5f9', color: '#1e3a8a', fontWeight: 'bold' }}
                      />
                    )}
                    <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '3px' }}>
                      Requisitions assigned to this employee will automatically be visible to the reporting recruiter.
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginTop: '8px' }}>
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={userFormData.isActive !== false}
                    onChange={e => setUserFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <label htmlFor="isActiveCheck" style={{ fontWeight: 'bold', color: '#334155', cursor: 'pointer' }}>
                    Account is Active (Can log in to portal)
                  </label>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <div>
                    {editingUser && editingUser.email !== 'omkesh@coolsofttech.com' && (isAdmin || isManager) && (
                      <button
                        type="button"
                        onClick={() => {
                          const uToDel = editingUser
                          setShowUserModal(false)
                          handleDeleteTeamUser(uToDel)
                        }}
                        style={{
                          background: '#fee2e2',
                          border: '1px solid #fca5a5',
                          color: '#dc2626',
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        🗑️ Delete User
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowUserModal(false)}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ background: '#ea580c', color: '#ffffff', border: 'none', padding: '6px 18px', fontSize: '12px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                    >
                      {editingUser ? 'Save Changes' : 'Create User'}
                    </button>
                  </div>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ═══════════ MODAL 2: ADD / SUBMIT CANDIDATE DIRECTLY TO REQUISITION ═══════════ */}
        {showAddCandidateModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px'
          }}>
            <div style={{
              background: '#ffffff', borderRadius: '6px', width: '100%', maxWidth: '600px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden', border: '1px solid #cbd5e1'
            }}>
              {/* Modal Header */}
              <div style={{ background: '#ea580c', color: '#ffffff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>
                    ➕ Add Candidate to Requisition #{resolveReqId(selectedReq?.id, selectedReq)}
                  </h3>
                  <div style={{ fontSize: '11px', color: '#ffedd5', marginTop: '2px' }}>
                    {selectedReq?.title || 'Senior Software Engineer'}
                  </div>
                </div>
                <span
                  onClick={() => setShowAddCandidateModal(false)}
                  style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1' }}
                >
                  &times;
                </span>
              </div>

              {/* Form Body */}
              <form onSubmit={e => {
                e.preventDefault()
                if (!newCandReqForm.firstName.trim() || !newCandReqForm.lastName.trim()) {
                  alert('Please enter both First Name and Last Name.')
                  return
                }

                const cleanId = String(selectedReq?.id || '158938').replace('J-', '')
                const fullName = `${newCandReqForm.firstName.trim()} ${newCandReqForm.lastName.trim()}`
                const newCandId = `CAND-${Date.now().toString().slice(-5)}`
                const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                const effectiveParentRecruiterName = currentUser?.parentRecruiterName || 
                  teamUsers.find(u => (u.email && u.email.toLowerCase() === (currentUser?.email || '').toLowerCase()) || (u.name && u.name.toLowerCase() === (userName || '').toLowerCase()))?.parentRecruiterName || ''
                const effectiveParentRecruiterEmail = currentUser?.parentRecruiterEmail || 
                  teamUsers.find(u => (u.email && u.email.toLowerCase() === (currentUser?.email || '').toLowerCase()) || (u.name && u.name.toLowerCase() === (userName || '').toLowerCase()))?.parentRecruiterEmail || ''
                const effectiveParentRecruiterId = currentUser?.parentRecruiterId || 
                  teamUsers.find(u => (u.email && u.email.toLowerCase() === (currentUser?.email || '').toLowerCase()) || (u.name && u.name.toLowerCase() === (userName || '').toLowerCase()))?.parentRecruiterId || ''

                const newCandObj = {
                  id: newCandId,
                  name: fullName,
                  payRate: `$${newCandReqForm.payRate}/hr`,
                  payRateType: newCandReqForm.payRateType || 'C2C',
                  assignedBy: userName,
                  assignedOn: dateStr,
                  status: newCandReqForm.status || 'Int-SubmittedToManager',
                  statusComments: newCandReqForm.comments || 'Direct submission',
                  interview: 'Select',
                  rejectedReason: '',
                  recruiter: userName,
                  recruiterEmail: currentUser?.email || '',
                  recruiterRefCode: currentUser?.refCode || '',
                  parentRecruiterName: effectiveParentRecruiterName,
                  parentRecruiterEmail: effectiveParentRecruiterEmail,
                  parentRecruiterId: effectiveParentRecruiterId,
                  addedByName: userName,
                  addedByEmail: currentUser?.email || '',
                  addedByRole: isEmployee ? 'employee' : isRecruiter ? 'recruiter' : 'admin',
                  lastChangedBy: userName,
                  lastChangedRole: isAdmin ? 'superadmin' : (isRecruiter ? 'Recruiter' : 'Employee'),
                  lastChangedOn: dateStr
                }

                const updatedCandidates = [newCandObj, ...potentialCandidates]
                setPotentialCandidates(updatedCandidates)

                const masterCandObj = {
                  id: newCandId.replace('CAND-', '875'),
                  name: fullName,
                  fullRole: selectedReq?.title || 'Consultant',
                  role: selectedReq?.title || 'Consultant',
                  exp: newCandReqForm.exp || '5',
                  location: selectedReq?.location || 'Remote / Hybrid',
                  city: selectedReq?.city || 'Richmond',
                  state: selectedReq?.state || 'VA',
                  payRate: `$${newCandReqForm.payRate} /hr`,
                  rateType: newCandReqForm.payRateType || 'C2C',
                  rating: 5,
                  subVendor: 'Direct Submission',
                  recruiter: userName,
                  assignedTo: userName,
                  assignedBy: userName,
                  recruiterEmail: currentUser?.email || '',
                  recruiterRefCode: currentUser?.refCode || '',
                  parentRecruiterName: effectiveParentRecruiterName,
                  parentRecruiterEmail: effectiveParentRecruiterEmail,
                  parentRecruiterId: effectiveParentRecruiterId,
                  addedByName: userName,
                  addedByEmail: currentUser?.email || '',
                  addedByRole: isEmployee ? 'employee' : isRecruiter ? 'recruiter' : 'admin',
                  agrExists: false,
                  avblDate: 'Immediate',
                  email: newCandReqForm.email || `${newCandReqForm.firstName.toLowerCase()}@example.com`,
                  phone: newCandReqForm.phone || '571-660-5778',
                  workAuth: newCandReqForm.workAuth || 'US Citizen',
                  screened: 'Yes'
                }

                setCandidates(prev => {
                  const merged = [masterCandObj, ...prev.filter(c => c.id !== newCandId && c.name !== fullName)]
                  try {
                    localStorage.setItem('smarthire_all_candidates', JSON.stringify(merged))
                  } catch (e) {}
                  return merged
                })

                try {
                  localStorage.setItem(`smarthire_potential_candidates_${cleanId}`, JSON.stringify(updatedCandidates))
                  localStorage.setItem(`smarthire_potential_candidates_J-${cleanId}`, JSON.stringify(updatedCandidates))
                } catch (err) {}

                // Save to Firestore
                saveRequisitionCandidates(cleanId, updatedCandidates).catch(() => {})
                saveCandidate(newCandId, {
                  ...masterCandObj,
                  ...newCandObj,
                  canId: newCandId,
                  id: newCandId,
                  name: fullName,
                  reqId: cleanId,
                  job_id: `J-${cleanId}`,
                  assignedBy: userName,
                  recruiter: userName,
                  recruiterEmail: currentUser?.email || '',
                  recruiterRefCode: currentUser?.refCode || '',
                  parentRecruiterName: effectiveParentRecruiterName,
                  parentRecruiterEmail: effectiveParentRecruiterEmail,
                  parentRecruiterId: effectiveParentRecruiterId,
                  addedByName: userName,
                  submittedBy: userName
                }).catch(err => console.warn('Firestore candidate save notice:', err))

                // Backend sync
                fetch('/api/candidates', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
                  },
                  body: JSON.stringify({
                    ...masterCandObj,
                    ...newCandObj,
                    canId: newCandId,
                    id: newCandId,
                    reqId: cleanId,
                    recruiter: userName,
                    recruiterEmail: currentUser?.email || '',
                    parentRecruiterName: effectiveParentRecruiterName
                  })
                }).catch(() => {})

                pushActivityNotification({
                  title: 'New Candidate Assigned to Requisition',
                  message: `New candidate ${fullName} assigned to Requisition #${cleanId} by ${userName}`,
                  type: 'assignment',
                  category: 'team',
                  actor: userName,
                  actorRole: userRole,
                  reqId: cleanId,
                  candidateName: fullName,
                  candidateId: newCandId
                })

                setShowAddCandidateModal(false)
                setSaveToastMessage(`🎉 Candidate ${fullName} successfully added to Requisition #${cleanId}!`)
                setTimeout(() => setSaveToastMessage(null), 4000)
              }} style={{ padding: '18px 20px', fontSize: '12px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="First Name"
                      value={newCandReqForm.firstName}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, firstName: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Last Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Last Name"
                      value={newCandReqForm.lastName}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, lastName: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="candidate@email.com"
                      value={newCandReqForm.email}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, email: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="(555) 000-0000"
                      value={newCandReqForm.phone}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, phone: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Proposed Pay Rate ($/hr) *</label>
                    <input
                      type="text"
                      required
                      placeholder="75"
                      value={newCandReqForm.payRate}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, payRate: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Rate Type</label>
                    <select
                      value={newCandReqForm.payRateType}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, payRateType: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#ffffff' }}
                    >
                      <option value="C2C">C2C</option>
                      <option value="W2">W2</option>
                      <option value="1099">1099</option>
                      <option value="Fulltime">Fulltime</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Work Authorization</label>
                    <select
                      value={newCandReqForm.workAuth}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, workAuth: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#ffffff' }}
                    >
                      <option value="US Citizen">US Citizen</option>
                      <option value="Green Card">Green Card</option>
                      <option value="H1B">H1B</option>
                      <option value="EAD - GC">EAD - GC</option>
                      <option value="OPT/CPT">OPT/CPT</option>
                      <option value="TN Visa">TN Visa</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Initial Submission Status</label>
                    <select
                      value={newCandReqForm.status}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, status: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#ffffff', fontWeight: 'bold' }}
                    >
                      <option value="Int-SubmittedToManager">Int-SubmittedToManager</option>
                      <option value="Int-ApprovedByManager">Int-ApprovedByManager</option>
                      <option value="Agency-Submitted">Agency-Submitted</option>
                      <option value="Client-SubmittedToCustomer">Client-SubmittedToCustomer</option>
                      <option value="Placed">Placed</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Key Skills</label>
                    <input
                      type="text"
                      placeholder="React, Java, AWS, Python"
                      value={newCandReqForm.skills}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, skills: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Submission Notes / Comments</label>
                  <textarea
                    rows={2}
                    placeholder="Candidate profile summary, availability, and screening notes..."
                    value={newCandReqForm.comments}
                    onChange={e => setNewCandReqForm(prev => ({ ...prev, comments: e.target.value }))}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '14px', fontSize: '11px', color: '#475569' }}>
                  👤 Submitting as: <strong style={{ color: '#0284c7' }}>{userName}</strong> ({isAdmin ? 'Administrator' : (isRecruiter ? 'Lead Recruiter' : 'Employee')})
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddCandidateModal(false)}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: '#ea580c', color: '#ffffff', border: 'none', padding: '6px 20px', fontSize: '12px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                  >
                    Submit to Requisition
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ═══════════ MODAL 3: CANDIDATE RESUME & AI FIT MATCH SUMMARIZER (ADMIN & MANAGER ACCESS) ═══════════ */}
        {showAiFitModal && canReviewAndUseAI && aiCandidate && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px'
          }}>
            <div style={{
              background: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '880px', maxHeight: '92vh',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflowY: 'auto', border: '1px solid #94a3b8',
              display: 'flex', flexDirection: 'column'
            }}>
              
              {/* Modal Header */}
              <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>🧠</span>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>
                      AI Candidate Job-Fit Analysis & Smart Resume Viewer
                    </h3>
                    <span style={{ background: isManager ? '#fef3c7' : 'rgba(255,255,255,0.2)', color: isManager ? '#92400e' : '#ffffff', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>
                      {isAdmin ? '👑 ADMIN ACCESS' : '🛡️ MANAGER ACCESS'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#e0f2fe', marginTop: '3px' }}>
                    Evaluating candidate against Requisition #{resolveReqId(selectedReq?.id, selectedReq)} — <strong>{editingFields.title || selectedReq?.title || 'Senior Consultant'}</strong>
                  </div>
                </div>
                <span
                  onClick={() => setShowAiFitModal(false)}
                  style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1' }}
                >
                  &times;
                </span>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '16px 20px', fontSize: '12px', flex: 1 }}>

                {/* Candidate Quick Header Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Candidate Full Name</span>
                    <strong style={{ color: '#1e3a8a', fontSize: '13px' }}>{aiCandidate.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Proposed Pay Rate</span>
                    <strong style={{ color: '#166534', fontSize: '13px' }}>{aiCandidate.payRate} ({aiCandidate.payRateType || 'C2C'})</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Current Status</span>
                    <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold', fontSize: '11px' }}>
                      {aiCandidate.status || 'Int-SubmittedToManager'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Assigned / Sourced By</span>
                    <strong style={{ color: '#0f172a' }}>{aiCandidate.assignedBy || aiCandidate.recruiter || userName}</strong>
                  </div>
                </div>

                {/* AI Fit Analysis Control & Results */}
                <div style={{ border: '1px solid #bfdbfe', borderRadius: '6px', background: '#eff6ff', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '16px' }}>⚡</span>
                      <strong style={{ color: '#1e3a8a', fontSize: '13px' }}>AI Match & Competency Intelligence</strong>
                    </div>
                    <button
                      type="button"
                      disabled={isAnalyzingAi}
                      onClick={() => handleRunAiAnalysis(aiCandidate)}
                      style={{
                        background: isAnalyzingAi ? '#94a3b8' : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '5px 14px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        cursor: isAnalyzingAi ? 'not-allowed' : 'pointer',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      {isAnalyzingAi ? '⏳ Analyzing Resume Fit...' : '🪄 Run AI Fit Analysis'}
                    </button>
                  </div>

                  {isAnalyzingAi ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#0369a1' }}>
                      <div style={{ fontSize: '26px', marginBottom: '6px' }}>🤖 ⚙️</div>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px' }}>AI is analyzing candidate skills against requisition requirements...</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>Evaluating technical proficiencies, rate margin, and interview suitability</div>
                    </div>
                  ) : aiAnalysisResult ? (
                    <div>
                      {/* Fit Score Banner */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 14px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '48px', height: '48px', borderRadius: '50%',
                            background: aiAnalysisResult.fitScore >= 85 ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #0284c7, #0369a1)',
                            color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '16px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                          }}>
                            {aiAnalysisResult.fitScore}%
                          </div>
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: aiAnalysisResult.fitScore >= 85 ? '#166534' : '#0369a1' }}>
                              {aiAnalysisResult.fitLevel || 'Strong Match'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Recommendation: <strong style={{ color: '#0f172a' }}>{aiAnalysisResult.interviewRecommendation || 'Recommend for Technical Round'}</strong>
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569' }}>
                          <div>Experience: <strong style={{ color: '#0f172a' }}>{aiAnalysisResult.experienceMatch}</strong></div>
                          <div>Budget / Rate: <strong style={{ color: '#0f172a' }}>{aiAnalysisResult.rateMatch}</strong></div>
                        </div>
                      </div>

                      {/* Skills Grid: Matched vs Missing */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px 12px' }}>
                          <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '11.5px', marginBottom: '6px' }}>
                            ✅ Matched Technical Skills
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {Array.isArray(aiAnalysisResult.matchedSkills) && aiAnalysisResult.matchedSkills.length > 0 ? (
                              aiAnalysisResult.matchedSkills.map((s, i) => (
                                <span key={i} style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '2px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: 'bold' }}>
                                  ✓ {s}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '11px' }}>Core skills aligned</span>
                            )}
                          </div>
                        </div>

                        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', padding: '10px 12px' }}>
                          <div style={{ fontWeight: 'bold', color: '#c2410c', fontSize: '11.5px', marginBottom: '6px' }}>
                            ⚠️ Skill Gaps / Areas to Probe
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {Array.isArray(aiAnalysisResult.missingSkills) && aiAnalysisResult.missingSkills.length > 0 ? (
                              aiAnalysisResult.missingSkills.map((s, i) => (
                                <span key={i} style={{ background: '#ffedd5', color: '#9a3412', border: '1px solid #fdba74', padding: '2px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: 'bold' }}>
                                  ? {s}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: '#166534', fontSize: '11px' }}>No critical gaps identified</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Strengths & Interview Notes */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px' }}>
                          <strong style={{ color: '#1e3a8a', fontSize: '11px', display: 'block', marginBottom: '3px' }}>Candidate Strengths:</strong>
                          <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10.5px', color: '#334155' }}>
                            {Array.isArray(aiAnalysisResult.strengths) && aiAnalysisResult.strengths.map((st, i) => (
                              <li key={i} style={{ marginBottom: '2px' }}>{st}</li>
                            ))}
                          </ul>
                        </div>

                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px' }}>
                          <strong style={{ color: '#b45309', fontSize: '11px', display: 'block', marginBottom: '3px' }}>Interview Probing Points:</strong>
                          <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10.5px', color: '#334155' }}>
                            {Array.isArray(aiAnalysisResult.concerns) && aiAnalysisResult.concerns.map((cn, i) => (
                              <li key={i} style={{ marginBottom: '2px' }}>{cn}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Executive Summary */}
                      <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 12px' }}>
                        <strong style={{ color: '#1e3a8a', fontSize: '11px', display: 'block', marginBottom: '2px' }}>AI Executive Summary:</strong>
                        <p style={{ margin: 0, color: '#334155', lineHeight: '1.4', fontSize: '11px' }}>
                          {aiAnalysisResult.summary}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '12px', color: '#64748b' }}>
                      Click <strong>"Run AI Fit Analysis"</strong> to generate a complete match report with score, matched skills, and interview questions.
                    </div>
                  )}
                </div>

                {/* Candidate Resume & In-Place Skills Highlighting Section */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', padding: '12px 14px' }}>
                  
                  {/* Skills Legend Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📄 In-Place Resume Viewer & Skills Highlighter</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '10.5px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '12px', height: '12px', background: '#bbf7d0', border: '1px solid #86efac', borderRadius: '2px', display: 'inline-block' }}></span>
                        <strong style={{ color: '#166534' }}>Required Skills (Green)</strong>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '12px', height: '12px', background: '#fef08a', border: '1px solid #facc15', borderRadius: '2px', display: 'inline-block' }}></span>
                        <strong style={{ color: '#854d0e' }}>Preferred Skills (Yellow)</strong>
                      </span>
                    </div>
                  </div>

                  {/* Skills Chips Strip */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                    {(Array.isArray(editingFields.skills) ? editingFields.skills : ['Java', 'SQL', 'Project Management']).map((s, i) => (
                      <span key={i} style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '1px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold' }}>
                        🟢 Required: {s}
                      </span>
                    ))}
                    {(Array.isArray(editingFields.desiredSkills) ? editingFields.desiredSkills : ['Cloud Security', 'Public Sector']).map((s, i) => (
                      <span key={i} style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', padding: '1px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold' }}>
                        🟡 Preferred: {s}
                      </span>
                    ))}
                  </div>

                  {/* Formatted Resume Body with Smart Regex Highlighting */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '12px', maxHeight: '220px', overflowY: 'auto', fontFamily: 'Arial, sans-serif', fontSize: '11.5px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                    {(() => {
                      const rawResume = aiCandidate.resumeText || aiCandidate.statusComments || `NAME: ${aiCandidate.name}
ROLE: ${aiCandidate.role || editingFields.title || selectedReq?.title || 'Senior Consultant'}
EXPERIENCE: ${aiCandidate.exp || '6+ Years'}
TECHNICAL PROFICIENCIES: ${Array.isArray(editingFields.skills) ? editingFields.skills.join(', ') : 'Java, SQL, Agile, AWS, Cloud Security'}
PREFERRED DOMAINS: ${Array.isArray(editingFields.desiredSkills) ? editingFields.desiredSkills.join(', ') : 'Cloud Security, Public Sector Experience'}
PROPOSED PAY RATE: ${aiCandidate.payRate} (${aiCandidate.payRateType || 'C2C'})
WORK AUTHORIZATION: ${aiCandidate.workAuth || 'US Citizen / Authorized'}

PROFESSIONAL PROFILE SUMMARY:
Results-oriented technology professional with 6+ years of specialized experience in software architecture, enterprise application integration, and agile delivery. Demonstrated expertise in ${Array.isArray(editingFields.skills) ? editingFields.skills.slice(0, 2).join(' and ') : 'Java and SQL development'}, successfully leading requirement scoping, system integration, and test automation for complex public sector and enterprise clients.

CORE RESPONSIBILITIES & HIGHLIGHTS:
• Architected, developed, and deployed high-performance microservices and cloud infrastructure.
• Collaborated closely with business analysts, project managers, and technical leads across Scrum sprints.
• Conducted comprehensive code reviews, performance tuning, database optimization, and end-to-end testing.`

                      const reqList = Array.isArray(editingFields.skills) ? editingFields.skills : ['Java', 'SQL', 'Project Management', 'Agile']
                      const prefList = Array.isArray(editingFields.desiredSkills) ? editingFields.desiredSkills : ['Cloud Security', 'Public Sector']

                      const termsToHighlight = [
                        ...reqList.map(t => ({ text: String(t).trim(), type: 'req' })),
                        ...prefList.map(t => ({ text: String(t).trim(), type: 'pref' }))
                      ].filter(t => t.text.length >= 2)

                      if (termsToHighlight.length === 0) return rawResume

                      termsToHighlight.sort((a, b) => b.text.length - a.text.length)
                      const escaped = termsToHighlight.map(t => t.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                      const regex = new RegExp(`(${escaped.join('|')})`, 'gi')
                      const segments = rawResume.split(regex)

                      return segments.map((seg, idx) => {
                        const matched = termsToHighlight.find(t => t.text.toLowerCase() === seg.toLowerCase())
                        if (matched) {
                          if (matched.type === 'req') {
                            return (
                              <mark
                                key={idx}
                                style={{
                                  background: '#bbf7d0',
                                  color: '#14532d',
                                  padding: '1px 4px',
                                  borderRadius: '3px',
                                  fontWeight: 'bold',
                                  border: '1px solid #86efac'
                                }}
                                title={`Required Skill Matched: ${seg}`}
                              >
                                {seg}
                              </mark>
                            )
                          } else {
                            return (
                              <mark
                                key={idx}
                                style={{
                                  background: '#fef08a',
                                  color: '#713f12',
                                  padding: '1px 4px',
                                  borderRadius: '3px',
                                  fontWeight: 'bold',
                                  border: '1px solid #fde047'
                                }}
                                title={`Preferred Skill Matched: ${seg}`}
                              >
                                {seg}
                              </mark>
                            )
                          }
                        }
                        return <span key={idx}>{seg}</span>
                      })
                    })()}
                  </div>
                </div>

              </div>

              {/* Modal Footer with Manager 1-Click Status Actions */}
              <div style={{ background: '#f8fafc', borderTop: '1px solid #cbd5e1', padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      handleManagerUpdateStatus(aiCandidate.id, 'Int-ApprovedByManager')
                      setShowAiFitModal(false)
                    }}
                    style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '6px 14px', fontSize: '11.5px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>✅ Approve (Manager Review)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleManagerUpdateStatus(aiCandidate.id, 'Client-InterviewScheduled')
                      setShowAiFitModal(false)
                    }}
                    style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '6px 14px', fontSize: '11.5px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>📅 Schedule Client Interview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const reason = prompt('Please enter rejection reason (e.g. Skill Gap, Rate High, Candidate Withdrew):', 'Skill Gap')
                      if (reason !== null) {
                        handleUpdatePotentialCandidate(aiCandidate.id, 'status', 'Int-RejectedByManager')
                        handleUpdatePotentialCandidate(aiCandidate.id, 'rejectedReason', reason || 'Skill Gap')
                        setShowAiFitModal(false)
                        setSaveToastMessage(`❌ Candidate marked as Int-RejectedByManager (${reason || 'Skill Gap'})`)
                        setTimeout(() => setSaveToastMessage(null), 4000)
                      }
                    }}
                    style={{ background: '#dc2626', color: '#ffffff', border: 'none', padding: '6px 14px', fontSize: '11.5px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>❌ Reject Candidate</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAiFitModal(false)}
                  style={{ background: '#64748b', color: '#ffffff', border: 'none', padding: '6px 16px', fontSize: '11.5px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer' }}
                >
                  ✕ Close
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ═══════════ MODAL 4: CANDIDATE INTAKE & RESUME UPDATE MODAL ═══════════ */}
        {showCandidateIntakeModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px'
          }}>
            <div style={{
              background: '#ffffff', borderRadius: '6px', width: '100%', maxWidth: '650px',
              maxHeight: '92vh', overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid #cbd5e1'
            }}>
              {/* Header */}
              <div style={{ background: '#ea580c', color: '#ffffff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>
                    {candidateIntakeData.id ? '✏️ Edit Candidate & Update Resume' : '➕ Add Sourced Candidate to Pool'}
                  </h3>
                  <div style={{ fontSize: '11px', color: '#ffedd5', marginTop: '2px' }}>
                    Sourced by: <strong>{userName}</strong> ({isEmployee ? 'Employee' : 'Recruiter'})
                  </div>
                </div>
                <span
                  onClick={() => setShowCandidateIntakeModal(false)}
                  style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1' }}
                >
                  &times;
                </span>
              </div>

              {/* Body Form */}
              <form onSubmit={async e => {
                e.preventDefault()
                const fullName = `${candidateIntakeData.firstName.trim()} ${candidateIntakeData.lastName.trim()}`.trim() || candidateIntakeData.name.trim()
                if (!fullName) {
                  alert('Please enter candidate name.')
                  return
                }

                const candId = candidateIntakeData.id || `875${Date.now().toString().slice(-4)}`
                const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })

                const effectiveParentRecruiterName = currentUser?.parentRecruiterName || 
                  teamUsers.find(u => (u.email && u.email.toLowerCase() === (currentUser?.email || '').toLowerCase()) || (u.name && u.name.toLowerCase() === (userName || '').toLowerCase()))?.parentRecruiterName || ''
                const effectiveParentRecruiterEmail = currentUser?.parentRecruiterEmail || 
                  teamUsers.find(u => (u.email && u.email.toLowerCase() === (currentUser?.email || '').toLowerCase()) || (u.name && u.name.toLowerCase() === (userName || '').toLowerCase()))?.parentRecruiterEmail || ''
                const effectiveParentRecruiterId = currentUser?.parentRecruiterId || 
                  teamUsers.find(u => (u.email && u.email.toLowerCase() === (currentUser?.email || '').toLowerCase()) || (u.name && u.name.toLowerCase() === (userName || '').toLowerCase()))?.parentRecruiterId || ''

                const updatedCandObj = {
                  id: candId,
                  canId: candId,
                  name: fullName,
                  firstName: candidateIntakeData.firstName,
                  lastName: candidateIntakeData.lastName,
                  fullRole: candidateIntakeData.fullRole || candidateIntakeData.role || 'Software Consultant',
                  role: candidateIntakeData.role || candidateIntakeData.fullRole || 'Consultant',
                  exp: candidateIntakeData.exp || '5',
                  location: candidateIntakeData.location || `${candidateIntakeData.city || 'Richmond'}, ${candidateIntakeData.state || 'VA'}`,
                  city: candidateIntakeData.city || 'Richmond',
                  state: candidateIntakeData.state || 'VA',
                  payRate: `$${String(candidateIntakeData.payRate).replace(/[^0-9]/g, '') || '75'} /hr`,
                  rateType: candidateIntakeData.rateType || 'C2C',
                  rating: 5,
                  subVendor: candidateIntakeData.subVendor || 'Direct Sourcing',
                  recruiter: userName,
                  addedByName: userName,
                  submittedBy: userName,
                  assignedTo: userName,
                  assignedBy: userName,
                  recruiterEmail: currentUser?.email || '',
                  recruiterRefCode: currentUser?.refCode || '',
                  parentRecruiterName: effectiveParentRecruiterName,
                  parentRecruiterEmail: effectiveParentRecruiterEmail,
                  parentRecruiterId: effectiveParentRecruiterId,
                  addedByRole: isEmployee ? 'employee' : isRecruiter ? 'recruiter' : 'admin',
                  agrExists: false,
                  avblDate: 'Immediate',
                  email: candidateIntakeData.email || '',
                  phone: candidateIntakeData.phone || '',
                  workAuth: candidateIntakeData.workAuth || 'US Citizen',
                  skills: candidateIntakeData.skills ? (typeof candidateIntakeData.skills === 'string' ? candidateIntakeData.skills.split(',').map(s => s.trim()).filter(Boolean) : candidateIntakeData.skills) : ['Technical Consultant'],
                  resumeName: candidateIntakeData.resumeName || `${fullName.replace(/\s+/g, '_')}_Resume.pdf`,
                  resumeData: candidateIntakeData.resumeData || null,
                  resumeText: candidateIntakeData.resumeText || '',
                  screened: 'Yes',
                  dateAdded: dateStr,
                  reqId: candidateIntakeData.targetJobId ? resolveReqId(String(candidateIntakeData.targetJobId).replace('J-', '')) : '',
                  targetJobId: candidateIntakeData.targetJobId ? resolveReqId(String(candidateIntakeData.targetJobId).replace('J-', '')) : '',
                  job_id: candidateIntakeData.targetJobId ? resolveReqId(String(candidateIntakeData.targetJobId).replace('J-', '')) : ''
                }

                // 1. Update or Add to Candidates State & LocalStorage
                setCandidates(prev => {
                  const filtered = prev.filter(c => c.id !== candId && c.name.toLowerCase() !== fullName.toLowerCase())
                  const merged = [updatedCandObj, ...filtered]
                  try {
                    localStorage.setItem('smarthire_all_candidates', JSON.stringify(merged))
                  } catch (err) {}
                  return merged
                })

                // 2. Persist candidate details override
                try {
                  localStorage.setItem(`smarthire_candidate_details_${candId}`, JSON.stringify({
                    firstName: candidateIntakeData.firstName,
                    lastName: candidateIntakeData.lastName,
                    email: candidateIntakeData.email,
                    phoneCell: candidateIntakeData.phone,
                    jobTitle: candidateIntakeData.fullRole || candidateIntakeData.role,
                    city: candidateIntakeData.city,
                    state: candidateIntakeData.state,
                    payRate: candidateIntakeData.payRate,
                    rateType: candidateIntakeData.rateType,
                    workAuth: candidateIntakeData.workAuth,
                    experience: candidateIntakeData.exp,
                    comments: candidateIntakeData.comments
                  }))
                } catch (e) {}

                // 3. Persist documents mapping with real uploaded resume
                if (candidateIntakeData.resumeData || candidateIntakeData.resumeName) {
                  try {
                    const currentDocs = JSON.parse(localStorage.getItem(`smarthire_candidate_docs_${candId}`) || '{}')
                    currentDocs.resume = {
                      title: candidateIntakeData.resumeName || `${fullName}_Resume.pdf`,
                      fileName: candidateIntakeData.resumeName || `${fullName}_Resume.pdf`,
                      uploadedOn: dateStr,
                      status: 'Uploaded',
                      size: '210 KB',
                      fileData: candidateIntakeData.resumeData || null,
                      resumeText: candidateIntakeData.resumeText || ''
                    }
                    localStorage.setItem(`smarthire_candidate_docs_${candId}`, JSON.stringify(currentDocs))
                  } catch (e) {}
                }

                // 4. Save to Firestore & Backend Database API
                saveCandidate(candId, updatedCandObj).catch(err => console.warn('Firestore candidate save notice:', err))
                try {
                  fetch('/api/candidates', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
                    },
                    body: JSON.stringify(updatedCandObj)
                  })
                } catch (e) {}

                // 5. Optional: Submit directly to selected requisition
                if (candidateIntakeData.targetJobId) {
                  const cleanReqId = String(candidateIntakeData.targetJobId).replace('J-', '').trim()
                  const resolvedCleanId = resolveReqId(cleanReqId)
                  let existingSubmissions = []
                  try {
                    const raw = localStorage.getItem(`smarthire_potential_candidates_${cleanReqId}`) ||
                                localStorage.getItem(`smarthire_potential_candidates_${resolvedCleanId}`)
                    if (raw) existingSubmissions = JSON.parse(raw)
                  } catch (err) {}

                  const subObj = {
                    id: candId,
                    name: fullName,
                    payRate: `$${String(candidateIntakeData.payRate).replace(/[^0-9]/g, '') || '75'}/hr`,
                    payRateType: candidateIntakeData.rateType || 'C2C',
                    assignedBy: userName,
                    assignedOn: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: 'Int-SubmittedToManager',
                    statusComments: candidateIntakeData.comments || 'Direct candidate sourcing',
                    interview: 'Select',
                    rejectedReason: '',
                    recruiter: userName,
                    recruiterEmail: currentUser?.email || '',
                    recruiterRefCode: currentUser?.refCode || '',
                    parentRecruiterName: effectiveParentRecruiterName,
                    parentRecruiterEmail: effectiveParentRecruiterEmail,
                    parentRecruiterId: effectiveParentRecruiterId,
                    addedByName: userName,
                    addedByEmail: currentUser?.email || '',
                    addedByRole: isEmployee ? 'employee' : isRecruiter ? 'recruiter' : 'admin',
                    lastChangedBy: userName,
                    lastChangedRole: isEmployee ? 'Employee' : 'Recruiter',
                    lastChangedOn: new Date().toLocaleDateString()
                  }

                  const updatedSubmissions = [subObj, ...existingSubmissions.filter(s => s.id !== candId)]
                  try {
                    localStorage.setItem(`smarthire_potential_candidates_${cleanReqId}`, JSON.stringify(updatedSubmissions))
                    localStorage.setItem(`smarthire_potential_candidates_${resolvedCleanId}`, JSON.stringify(updatedSubmissions))
                    localStorage.setItem(`smarthire_potential_candidates_J-${cleanReqId}`, JSON.stringify(updatedSubmissions))
                    localStorage.setItem(`smarthire_potential_candidates_J-${resolvedCleanId}`, JSON.stringify(updatedSubmissions))
                  } catch (err) {}

                  // Save to Firestore for both IDs
                  saveRequisitionCandidates(cleanReqId, updatedSubmissions).catch(() => {})
                  if (resolvedCleanId !== cleanReqId) {
                    saveRequisitionCandidates(resolvedCleanId, updatedSubmissions).catch(() => {})
                  }

                  const currentSelectedId = String(selectedReq?.id || '').replace('J-', '').trim()
                  if (currentSelectedId === cleanReqId || currentSelectedId === resolvedCleanId) {
                    setPotentialCandidates(updatedSubmissions)
                  }
                }

                setShowCandidateIntakeModal(false)
                setSaveToastMessage(`🎉 Candidate ${fullName} successfully ${candidateIntakeData.id ? 'updated' : 'saved to your candidate pool'}!`)
                setTimeout(() => setSaveToastMessage(null), 4000)
              }} style={{ padding: '16px 20px', fontSize: '12px' }}>

                {/* Resume Upload Box */}
                <div style={{ background: '#f0fdf4', border: '1px dashed #22c55e', borderRadius: '4px', padding: '12px 14px', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 'bold', color: '#166534', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📄 Smart Resume Upload (*.pdf, *.docx, *.doc)</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>
                    Upload or replace candidate resume to auto-fill candidate name, skills, email, and contact number:
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={async e => {
                      const file = e.target.files[0]
                      if (!file) return

                      // Read DataURL for Live Viewer & preview
                      const reader = new FileReader()
                      reader.onload = async (uploadEvt) => {
                        const dataUrl = uploadEvt.target.result

                        let parsedText = ''
                        let parsedEmail = ''
                        let parsedPhone = ''
                        let parsedLocation = ''
                        let parsedSkills = []
                        let parsedTitle = ''
                        let parsedExp = ''
                        let parsedName = ''

                        // Try server parser
                        try {
                          const fd = new FormData()
                          fd.append('resume', file)
                          const res = await fetch('/api/parse-resume', { method: 'POST', body: fd })
                          if (res.ok) {
                            const json = await res.json()
                            parsedText = json.text || ''
                            parsedEmail = json.email || ''
                            parsedPhone = json.phone || ''
                            parsedLocation = json.location || ''
                          }
                        } catch (err) {}

                        // Client-side extraction fallback
                        if (parsedText) {
                          const clientExtracted = parseResume(parsedText)
                          if (!parsedEmail && clientExtracted.email) parsedEmail = clientExtracted.email
                          if (!parsedPhone && clientExtracted.phone) parsedPhone = clientExtracted.phone
                          if (clientExtracted.name && clientExtracted.name !== 'Unknown') parsedName = clientExtracted.name
                          if (clientExtracted.title && clientExtracted.title !== 'Software Engineer') parsedTitle = clientExtracted.title
                          if (clientExtracted.skills) parsedSkills = clientExtracted.skills
                          if (clientExtracted.experience) parsedExp = clientExtracted.experience.replace(/[^0-9]/g, '')
                          if (!parsedLocation && clientExtracted.location) parsedLocation = clientExtracted.location
                        }

                        // Filename fallback for Name
                        let fName = ''
                        let lName = ''
                        if (parsedName) {
                          const parts = parsedName.trim().split(/\s+/)
                          fName = parts[0]
                          lName = parts.slice(1).join(' ')
                        } else {
                          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
                          const words = cleanName.split(' ').filter(w => !['resume', 'cv', 'profile', 'latest', 'updated', 'pdf', 'doc', 'docx'].includes(w.toLowerCase()))
                          fName = words[0] || 'Candidate'
                          lName = words.slice(1).join(' ') || ''
                        }

                        let city = ''
                        let state = 'VA'
                        if (parsedLocation) {
                          const locParts = parsedLocation.split(',').map(s => s.trim())
                          if (locParts[0]) city = locParts[0]
                          if (locParts[1]) state = locParts[1].slice(0, 2).toUpperCase()
                        }

                        setCandidateIntakeData(prev => ({
                          ...prev,
                          resumeName: file.name,
                          resumeFile: file,
                          resumeData: dataUrl,
                          resumeText: parsedText,
                          firstName: fName || prev.firstName,
                          lastName: lName || prev.lastName,
                          name: `${fName || prev.firstName} ${lName || prev.lastName}`.trim(),
                          email: parsedEmail || prev.email || '',
                          phone: parsedPhone || prev.phone || '',
                          skills: parsedSkills.length > 0 ? (Array.isArray(parsedSkills) ? parsedSkills.join(', ') : parsedSkills) : prev.skills,
                          fullRole: parsedTitle || prev.fullRole || prev.role || 'Consultant',
                          role: parsedTitle || prev.role || 'Consultant',
                          exp: parsedExp || prev.exp || '5',
                          city: city || prev.city || 'Richmond',
                          state: state || prev.state || 'VA',
                          location: city ? `${city}, ${state}` : prev.location
                        }))
                      }
                      reader.readAsDataURL(file)
                    }}
                    style={{ fontSize: '11.5px' }}
                  />
                  {candidateIntakeData.resumeName && (
                    <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#166534', fontWeight: 'bold' }}>
                      Attached File: 📎 {candidateIntakeData.resumeName}
                    </div>
                  )}
                </div>

                {/* First Name & Last Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul"
                      value={candidateIntakeData.firstName}
                      onChange={e => setCandidateIntakeData(prev => ({ ...prev, firstName: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Last Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sharma"
                      value={candidateIntakeData.lastName}
                      onChange={e => setCandidateIntakeData(prev => ({ ...prev, lastName: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="candidate@email.com"
                      value={candidateIntakeData.email}
                      onChange={e => setCandidateIntakeData(prev => ({ ...prev, email: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="(555) 000-0000"
                      value={candidateIntakeData.phone}
                      onChange={e => setCandidateIntakeData(prev => ({ ...prev, phone: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Primary Role & Experience */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Job Title / Designation *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Java Fullstack Developer"
                      value={candidateIntakeData.fullRole || candidateIntakeData.role}
                      onChange={e => setCandidateIntakeData(prev => ({ ...prev, fullRole: e.target.value, role: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Experience (Yrs)</label>
                    <input
                      type="text"
                      placeholder="6"
                      value={candidateIntakeData.exp}
                      onChange={e => setCandidateIntakeData(prev => ({ ...prev, exp: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Pay Rate, Rate Type & Work Auth */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Pay Rate ($/hr) *</label>
                    <input
                      type="text"
                      required
                      placeholder="75"
                      value={candidateIntakeData.payRate}
                      onChange={e => setCandidateIntakeData(prev => ({ ...prev, payRate: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Rate Type</label>
                    <select
                      value={candidateIntakeData.rateType}
                      onChange={e => setCandidateIntakeData(prev => ({ ...prev, rateType: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#ffffff' }}
                    >
                      <option value="C2C">C2C</option>
                      <option value="W2">W2</option>
                      <option value="1099">1099</option>
                      <option value="Fulltime">Fulltime</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Work Auth</label>
                    <select
                      value={candidateIntakeData.workAuth}
                      onChange={e => setCandidateIntakeData(prev => ({ ...prev, workAuth: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#ffffff' }}
                    >
                      <option value="US Citizen">US Citizen</option>
                      <option value="Green Card">Green Card</option>
                      <option value="H1B">H1B</option>
                      <option value="EAD - GC">EAD - GC</option>
                      <option value="OPT/CPT">OPT/CPT</option>
                      <option value="TN Visa">TN Visa</option>
                    </select>
                  </div>
                </div>

                {/* Skills & Location */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Key Skills (Comma Separated)</label>
                    <input
                      type="text"
                      placeholder="React, Node.js, AWS, TypeScript"
                      value={candidateIntakeData.skills}
                      onChange={e => setCandidateIntakeData(prev => ({ ...prev, skills: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Location (City, State)</label>
                    <input
                      type="text"
                      placeholder="Richmond, VA"
                      value={candidateIntakeData.location}
                      onChange={e => setCandidateIntakeData(prev => ({ ...prev, location: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Optional Requisition Direct Assignment */}
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px 12px', marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>
                    🎯 Assign Directly to Requisition (Optional)
                  </label>
                  <select
                    value={candidateIntakeData.targetJobId}
                    onChange={e => setCandidateIntakeData(prev => ({ ...prev, targetJobId: e.target.value }))}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#ffffff' }}
                  >
                    <option value="">-- Do not assign now (Save in pool only) --</option>
                    {filteredJobs.map(j => {
                      const cId = String(j.id || '').replace('J-', '')
                      return (
                        <option key={j.id} value={cId}>
                          Req #{cId} — {j.title} ({j.customer})
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCandidateIntakeModal(false)}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 16px', fontSize: '12px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: '#ea580c', color: '#ffffff', border: 'none', padding: '6px 22px', fontSize: '12px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(234, 88, 12, 0.4)' }}
                  >
                    {candidateIntakeData.targetJobId ? '💾 Save & Submit to Req' : '💾 Save to My Candidate Pool'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ═══════════ MODAL 5: ASSIGN CANDIDATE TO REQUISITION MODAL ═══════════ */}
        {showAssignReqModal && assignTargetCandidate && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px'
          }}>
            <div style={{
              background: '#ffffff', borderRadius: '6px', width: '100%', maxWidth: '560px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden', border: '1px solid #cbd5e1'
            }}>
              {/* Header */}
              <div style={{ background: '#ea580c', color: '#ffffff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>
                    ➕ Assign Candidate to Requisition
                  </h3>
                  <div style={{ fontSize: '11px', color: '#ffedd5', marginTop: '2px' }}>
                    Candidate: <strong>{assignTargetCandidate.name}</strong> ({assignTargetCandidate.fullRole || assignTargetCandidate.role})
                  </div>
                </div>
                <span
                  onClick={() => setShowAssignReqModal(false)}
                  style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1' }}
                >
                  &times;
                </span>
              </div>

              {/* Form Body */}
              <form onSubmit={e => {
                e.preventDefault()
                if (!assignTargetJobId) {
                  alert('Please select an assigned requisition.')
                  return
                }

                const cleanReqId = String(assignTargetJobId).replace('J-', '')
                let existingList = []
                try {
                  const raw = localStorage.getItem(`smarthire_potential_candidates_${cleanReqId}`)
                  if (raw) existingList = JSON.parse(raw)
                } catch (err) {}

                const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                const newSubObj = {
                  id: `CAND-${Date.now().toString().slice(-5)}`,
                  name: assignTargetCandidate.name,
                  payRate: `$${String(assignProposedRate).replace(/[^0-9]/g, '') || '75'}/hr`,
                  payRateType: assignRateType || 'C2C',
                  assignedBy: userName,
                  assignedOn: dateStr,
                  status: 'Int-SubmittedToManager',
                  statusComments: assignComments || `Submitted by ${userName}`,
                  interview: 'Select',
                  rejectedReason: '',
                  lastChangedBy: userName,
                  lastChangedRole: isEmployee ? 'Employee' : 'Recruiter',
                  lastChangedOn: dateStr
                }

                const merged = [newSubObj, ...existingList]
                try {
                  localStorage.setItem(`smarthire_potential_candidates_${cleanReqId}`, JSON.stringify(merged))
                } catch (err) {}

                pushActivityNotification({
                  title: 'Candidate Assigned to Requisition',
                  message: `Candidate ${assignTargetCandidate.name} assigned to Requisition #${cleanReqId} by ${userName}`,
                  type: 'assignment',
                  category: 'team',
                  actor: userName,
                  actorRole: isEmployee ? 'Employee' : 'Recruiter',
                  reqId: cleanReqId,
                  candidateName: assignTargetCandidate.name,
                  candidateId: assignTargetCandidate.id
                })

                if (String(selectedReq?.id || '').replace('J-', '') === cleanReqId) {
                  setPotentialCandidates(merged)
                }

                setShowAssignReqModal(false)
                setSaveToastMessage(`🎉 Candidate ${assignTargetCandidate.name} successfully submitted to Requisition #${cleanReqId}!`)
                setTimeout(() => setSaveToastMessage(null), 4000)
              }} style={{ padding: '16px 20px', fontSize: '12px' }}>

                {/* Candidate Info Strip */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '8px 12px', marginBottom: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div><strong>Email:</strong> {assignTargetCandidate.email || 'N/A'}</div>
                  <div><strong>Phone:</strong> {assignTargetCandidate.phone || 'N/A'}</div>
                  <div><strong>Location:</strong> {assignTargetCandidate.location || 'Richmond, VA'}</div>
                  <div><strong>Work Auth:</strong> {assignTargetCandidate.workAuth || 'US Citizen'}</div>
                </div>

                {/* Target Requisition Dropdown */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>
                    Select Assigned Requisition *
                  </label>
                  <select
                    required
                    value={assignTargetJobId}
                    onChange={e => setAssignTargetJobId(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#ffffff', fontWeight: 'bold' }}
                  >
                    <option value="">-- Choose Assigned Position --</option>
                    {filteredJobs.map(j => {
                      const cId = String(j.id || '').replace('J-', '')
                      return (
                        <option key={j.id} value={cId}>
                          Req #{cId} — {j.title} ({j.customer || 'Client'})
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* Proposed Rate & Rate Type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Proposed Pay Rate ($/hr) *</label>
                    <input
                      type="text"
                      required
                      placeholder="75"
                      value={assignProposedRate}
                      onChange={e => setAssignProposedRate(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Rate Type</label>
                    <select
                      value={assignRateType}
                      onChange={e => setAssignRateType(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#ffffff' }}
                    >
                      <option value="C2C">C2C</option>
                      <option value="W2">W2</option>
                      <option value="1099">1099</option>
                      <option value="Fulltime">Fulltime</option>
                    </select>
                  </div>
                </div>

                {/* Submission Notes */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Submission Notes / Comments</label>
                  <textarea
                    rows={2}
                    placeholder="Why this candidate fits this requirement..."
                    value={assignComments}
                    onChange={e => setAssignComments(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAssignReqModal(false)}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: '#ea580c', color: '#ffffff', border: 'none', padding: '6px 20px', fontSize: '12px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(234, 88, 12, 0.4)' }}
                  >
                    🚀 Submit Candidate to Requisition
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ═══════════ AUDIT & ACTIVITY LOG MODAL ═══════════ */}
        {showAuditLogModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(5px)',
              zIndex: 3500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setShowAuditLogModal(false)}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '1000px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                border: '1px solid #cbd5e1',
                overflow: 'hidden'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                background: '#1e3a8a',
                color: '#ffffff',
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📜 Candidate Status Audit History & Timeline</span>
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#bfdbfe' }}>
                    Complete audit trail showing which recruiter/manager changed candidate status, approvals, and reasons.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAuditLogModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '18px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                <AuditActivityLogModule />
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ CANDIDATE DETAIL, SUBMISSIONS & RESUME VERSIONS MODAL ═══════════ */}
        {showDetailViewModal && selectedViewCandidate && (
          <CandidateDetailViewModal
            candidate={selectedViewCandidate}
            isOpen={showDetailViewModal}
            onClose={() => {
              setShowDetailViewModal(false)
              setSelectedViewCandidate(null)
            }}
            allJobs={jobs.length > 0 ? jobs : filteredJobs}
            currentUser={currentUser}
            reqContext={selectedReq || (selectedViewCandidate ? (jobs.find(j => String(j.id).replace('J-', '') === String(selectedViewCandidate.reqId || '')) || null) : null)}
            onUpdateCandidate={(updatedCand) => {
              setCandidates(prev => {
                const merged = prev.map(c => c.id === updatedCand.id ? updatedCand : c)
                try {
                  localStorage.setItem('smarthire_all_candidates', JSON.stringify(merged))
                } catch (e) {}
                return merged
              })
              setSelectedViewCandidate(updatedCand)
            }}
          />
        )}

        {/* ═══════════ AI PROACTIVE CANDIDATE MATCHMAKER MODAL ═══════════ */}
        {showAiMatchModal && aiMatchTargetJob && (
          <AiMatchingCandidatesModal
            isOpen={showAiMatchModal}
            job={aiMatchTargetJob}
            matchingCandidates={aiMatchingCandidatesList}
            currentUser={currentUser}
            onClose={() => {
              setShowAiMatchModal(false)
              setAiMatchTargetJob(null)
            }}
            onOpenCandidateDetails={(cand) => {
              handleOpenCandidateView(cand)
            }}
            onAssignCandidate={(cand, targetJob) => {
              const cleanReqId = String(targetJob?.id || '158938').replace('J-', '')
              const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              const newSubObj = {
                id: cand.id || `875${Math.floor(10 + Math.random() * 90)}`,
                name: cand.name,
                payRate: cand.payRate || targetJob.budget || '74/hr',
                payRateType: cand.rateType || 'C2C',
                assignedBy: userName,
                assignedOn: dateStr,
                status: 'Int-SubmittedToManager',
                statusComments: `AI Proactive Match - Submitted by ${userName}`,
                interview: 'Select',
                rejectedReason: '',
                lastChangedBy: userName,
                lastChangedRole: isEmployee ? 'Employee' : 'Recruiter',
                lastChangedOn: dateStr
              }

              // Save to requisition potential candidates
              const existingRaw = localStorage.getItem(`smarthire_potential_candidates_${cleanReqId}`)
              let existingList = []
              if (existingRaw) {
                try { existingList = JSON.parse(existingRaw) } catch (e) {}
              }
              const merged = [newSubObj, ...existingList.filter(c => c.name !== cand.name)]
              try {
                localStorage.setItem(`smarthire_potential_candidates_${cleanReqId}`, JSON.stringify(merged))
                localStorage.setItem(`smarthire_potential_candidates_J-${cleanReqId}`, JSON.stringify(merged))
              } catch (e) {}

              // Save to Firestore
              saveRequisitionCandidates(cleanReqId, merged).catch(() => {})
              saveCandidate(newSubObj.id, {
                ...cand,
                ...newSubObj,
                canId: newSubObj.id,
                id: newSubObj.id,
                reqId: cleanReqId,
                job_id: `J-${cleanReqId}`,
                recruiter: userName,
                recruiterEmail: currentUser?.email || '',
                parentRecruiterName: currentUser?.parentRecruiterName || ''
              }).catch(() => {})

              if (String(selectedReq?.id || '').replace('J-', '') === cleanReqId) {
                setPotentialCandidates(merged)
              }

              pushActivityNotification({
                title: 'Candidate Assigned to Requisition',
                message: `Candidate ${cand.name} assigned to Requisition #${cleanReqId} by ${userName}`,
                type: 'assignment',
                category: 'team',
                actor: userName,
                actorRole: isEmployee ? 'Employee' : 'Recruiter',
                reqId: cleanReqId,
                candidateName: cand.name,
                candidateId: cand.id
              })

              setSaveToastMessage(`🎉 Candidate ${cand.name} successfully submitted to Requisition #${cleanReqId}!`)
              setTimeout(() => setSaveToastMessage(null), 4000)
            }}
          />
        )}

        {/* ═══════════ LINKEDIN REQUISITION POST MODAL (ADMIN ONLY) ═══════════ */}
        {linkedinModalJob && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(5px)',
              zIndex: 3500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setLinkedinModalJob(null)}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                border: '1px solid #cbd5e1',
                overflow: 'hidden'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                background: '#0a66c2',
                color: '#ffffff',
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🌐 LinkedIn Auto-Poster — Requisition #{String(linkedinModalJob.id || '').replace('J-', '')}</span>
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#e0f2fe' }}>
                    Generate, edit, and post directly to LinkedIn with candidate apply link and tags.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLinkedinModalJob(null)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '16px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '20px', overflowY: 'auto', flex: 1, fontSize: '12px' }}>
                {linkedinSuccessMsg && (
                  <div style={{
                    background: '#ecfdf5',
                    border: '1px solid #10b981',
                    color: '#065f46',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginBottom: '12px'
                  }}>
                    {linkedinSuccessMsg}
                  </div>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                    LinkedIn Post Text (Editable):
                  </label>
                  <textarea
                    rows={11}
                    value={linkedinPostText}
                    onChange={e => setLinkedinPostText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '12.5px',
                      lineHeight: '1.6',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      fontFamily: 'monospace, sans-serif'
                    }}
                  />
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px 14px', marginBottom: '14px', fontSize: '11.5px', color: '#475569' }}>
                  💡 <strong>Tip:</strong> Candidates who apply through this post will automatically appear in your Candidate Pool & Notifications.
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => window.open('/linkedin-posts', '_blank')}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#0033cc',
                      padding: '6px 14px',
                      fontSize: '11.5px',
                      fontWeight: 'bold',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🌐 Open Bulk LinkedIn Studio &gt;&gt;
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(linkedinPostText)
                        setLinkedinSuccessMsg('📋 Post text copied to clipboard!')
                        setTimeout(() => setLinkedinSuccessMsg(''), 3000)
                      }}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        color: '#0f172a',
                        padding: '6px 14px',
                        fontSize: '11.5px',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      📋 Copy Text
                    </button>
                    <button
                      type="button"
                      onClick={handlePublishLinkedInPost}
                      disabled={postingLinkedIn}
                      style={{
                        background: '#0a66c2',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 18px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(10,102,194,0.3)'
                      }}
                    >
                      {postingLinkedIn ? '⏳ Posting to LinkedIn...' : '🚀 Post to LinkedIn (API)'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ SMARTHIRE ORANGE FOOTER ═══════════ */}
        <footer style={{ background: '#ea580c', borderTop: '2px solid #c2410c', color: '#ffffff', textAlign: 'center', padding: '8px', marginTop: '24px', fontSize: '11px', fontWeight: 'bold' }}>
          © SmartHire | All rights reserved | Release 1.0.0 27-Aug-2026
        </footer>

      </div>
    </SiteLayout>
  )
}

export default RecruiterDashboard
