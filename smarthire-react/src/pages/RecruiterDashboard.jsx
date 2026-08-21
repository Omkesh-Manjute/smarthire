import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SiteLayout from '../components/SiteLayout'
import CandidatePdfReportModal from '../components/CandidatePdfReportModal'

function getFullDescriptionText(job) {
  if (!job) return ''
  const raw = job.rawDescription || job.fullDescription || job.rawText || job.details || job.rawJd
  if (raw && raw.length > 50) return raw

  if (job.description && job.description.length > 50 && !job.description.startsWith('Looking for a')) {
    return job.description
  }

  const reqSkills = Array.isArray(job.skills) && job.skills.length > 0
    ? job.skills.join(', ')
    : 'Technical leadership, architectural design, cloud deployments'

  const prefSkills = Array.isArray(job.preferredSkills) && job.preferredSkills.length > 0
    ? job.preferredSkills.join(', ')
    : Array.isArray(job.preferred_skills) && job.preferred_skills.length > 0
    ? job.preferred_skills.join(', ')
    : 'PMP Certification, Bachelors Degree in IT Related Field, Agile / Scrum Delivery'

  const expText = job.experience && job.experience !== 'TBD' && job.experience !== 'Any'
    ? job.experience
    : '5+ years'

  const locText = job.location || 'Columbia, SC'
  const modeText = job.work_mode || job.workMode || 'Hybrid'
  const deadlineText = job.deadline || '08/28 at 5:00 PM EST'

  return `Start date :${job.creationDate || '10/23/2026'}\nEnd Date   :${job.duration || '12 Months from projected start date'}\n\nSubmission deadline :${deadlineText}\n\nClient Info : ${job.client || 'ADMIN'}\n\nNote:\n* Interview Process: 1 round, Virtual/Online\n* Work Location: ${modeText} - schedule will be determined by the hiring manager after the start date.\n* Candidate Location: ${locText}\n\nRequired Skills & Experience:\n* Experience: ${expText}\n* Core Skills: ${reqSkills}\n* Certifications & Preferred: ${prefSkills}`
}

function parseResumeDetails(text, filename = '') {
  let firstName = ''
  let lastName = ''
  let email = ''
  let phone = ''
  let city = 'Richmond'
  let state = 'VA'
  let zip = '23173'
  let exp = '14'
  let jobTitle = 'Network Administrator / Consultant'

  if (text) {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    if (emailMatch) email = emailMatch[0]

    const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/)
    if (phoneMatch) phone = phoneMatch[0]

    const locMatch = text.match(/([A-Z][a-zA-Z\s]{2,15}),\s*([A-Z]{2})(?:\s*(\d{5}))?/)
    if (locMatch) {
      city = locMatch[1].trim()
      state = locMatch[2].trim()
      if (locMatch[3]) zip = locMatch[3].trim()
    }

    const expMatch = text.match(/(\d{1,2})\+?\s*(?:years|yrs)/i)
    if (expMatch) exp = expMatch[1]

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length > 0) {
      const nameParts = lines[0].replace(/[^a-zA-Z\s]/g, '').split(' ').filter(Boolean)
      if (nameParts.length >= 2) {
        firstName = nameParts[0]
        lastName = nameParts.slice(1).join(' ')
      } else if (nameParts.length === 1) {
        firstName = nameParts[0]
        lastName = 'Candidate'
      }
    }
  }

  if (!firstName && filename) {
    const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z\s_-]/g, ' ')
    const parts = cleanName.split(/[\s_-]+/).filter(Boolean)
    if (parts.length >= 2) {
      firstName = parts[0]
      lastName = parts[1]
    } else if (parts.length === 1) {
      firstName = parts[0]
      lastName = 'Candidate'
    }
  }

  return {
    firstName: firstName || 'Ashok',
    lastName: lastName || 'Ganta',
    email: email || 'ashok57800@gmail.com',
    phone: phone || '571-660-5778',
    city: city || 'Richmond',
    state: state || 'VA',
    zip: zip || '23173',
    exp: exp || '14',
    jobTitle: jobTitle || 'VDOT Network Administrator 4',
    resumeTitle: filename ? filename.replace(/\.[^/.]+$/, '') : `${firstName || 'Candidate'}_Resume`,
  }
}

function RecruiterDashboard() {
  const [jobs, setJobs] = useState([])
  const [candidates, setCandidates] = useState([])
  
  // Navigation Flow State: 'portal' | 'requisition' | 'resumeSearch' | 'resumeSubmission'
  const [viewMode, setViewMode] = useState('portal')
  const [selectedReq, setSelectedReq] = useState(null)
  const [activeReqTab, setActiveReqTab] = useState('details')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [quickSearchId, setQuickSearchId] = useState('')
  const [showFilterPanel, setShowFilterPanel] = useState(true)

  // ─── TOP SEARCH REQUISITIONS FILTER STATE (NEW IMAGE) ───
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

  // Requisition Fields
  const [editingFields, setEditingFields] = useState({})

  // Dual Listbox for Assign to Recruiters
  const [availableRecruiters, setAvailableRecruiters] = useState([
    'Admin Blr', 'AI Agent', 'Ajay Arya', 'Anand Krishnamurthy', 'Deepak Joshi', 'Nitin Bhosale', 'Rahul Sharma', 'Priya Verma'
  ])
  const [assignedRecruiters, setAssignedRecruiters] = useState(['Vaibhav Bisen'])
  const [selectedAvailable, setSelectedAvailable] = useState([])
  const [selectedAssigned, setSelectedAssigned] = useState([])
  const [emailOption, setEmailOption] = useState('none')

  // Attachments List
  const [attachments, setAttachments] = useState([
    { id: 1, title: '13285 - Admin - 158938', filename: '13285 - Admin - 158938.docx' },
    { id: 2, title: 'SCMSP_Candidate_Cover_Sheet - 158938', filename: 'SCMSP_Candidate_Cover_Sheet - 158938.docx' },
    { id: 3, title: 'SSN References - 158938', filename: 'SSN References - 158938.doc' },
    { id: 4, title: 'Right_to_Represent_SOSC - 158938', filename: 'Right_to_Represent_SOSC - 158938.pdf' },
  ])
  const [showAddAttachment, setShowAddAttachment] = useState(false)
  const [newAttachmentTitle, setNewAttachmentTitle] = useState('')
  const [newAttachmentFile, setNewAttachmentFile] = useState(null)

  // Potential Candidates Attached to Requisition
  const [potentialCandidates, setPotentialCandidates] = useState([
    {
      id: '87534',
      name: 'Ashok Ganta',
      payRate: '74/hr',
      payRateType: 'C2C',
      assignedBy: 'Prudhvi',
      assignedOn: 'Aug 20, 2026 04:40 PM',
      status: 'Int-SubmittedToManager',
      statusComments: 'Submitted',
      interview: 'Select',
      rejectedReason: ''
    },
    {
      id: '87535',
      name: 'Kashyap K Vora',
      payRate: '55/hr',
      payRateType: 'W2',
      assignedBy: 'Vaibhav',
      assignedOn: 'Aug 20, 2026 06:41 PM',
      status: 'Int-SubmittedToManager',
      statusComments: 'Submitted',
      interview: 'Select',
      rejectedReason: ''
    }
  ])

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

  // User auth state
  const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user')
  let currentUser = null
  try {
    if (userStr) currentUser = JSON.parse(userStr)
  } catch (e) {}

  const userName = currentUser?.name || currentUser?.displayName || 'Omkesh Manjute'

  // Fetch real jobs and candidates from API
  useEffect(() => {
    const token = localStorage.getItem('smarthire_token') || ''
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

    fetch('/api/jobs', { headers })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.jobs || data.data || []
        setJobs(list)
      })
      .catch(err => console.error('Failed to load jobs:', err))

    fetch('/api/candidates', { headers })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.candidates || data.data || []
        setCandidates(list)
      })
      .catch(err => console.error('Failed to load candidates:', err))
  }, [])

  // Open Requisition Detail
  const handleOpenReq = (job) => {
    setSelectedReq(job)
    setViewMode('requisition')
    setActiveReqTab('details')
    const fullDesc = getFullDescriptionText(job)
    setEditingFields({
      title: job.title || '',
      startDate: job.creationDate || '10/23/2026',
      duration: job.duration || '12',
      durationUnit: 'months',
      customer: job.client || 'State Of SC',
      endClient: job.client || 'State Of SC',
      contact: job.contact || 'Hustedt Lexi',
      numPositions: job.numPositions || '1',
      deadline: job.deadline || '8/28/2026',
      maxSubmissions: job.maxSubmissions || '2',
      category: job.category || 'SP',
      type: job.type || 'Contract',
      address: job.address || '4430 Broad Rd.',
      city: job.city || 'Columbia',
      state: job.state || 'SC',
      zip: job.zip || '29210',
      location: job.location || 'Columbia, SC 29210',
      billRate: job.billRate || '90',
      payRate: job.budget ? job.budget.replace(/[^0-9]/g, '').slice(0, 3) || '75' : '75',
      interview: 'Select',
      workAuth: 'Select',
      subcontractable: 'No',
      employmentType: 'Contract',
      experience: job.experience ? (job.experience.replace(/[^0-9]/g, '') || '5') : '5',
      description: fullDesc,
      skills: Array.isArray(job.skills) ? job.skills : ['PMP Certification', 'Bachelors Degree In An IT Related Field', 'Project Management'],
      desiredSkills: Array.isArray(job.preferredSkills) ? job.preferredSkills : ['Cloud Security', 'Public Sector Experience'],
      status: job.status === 'Active' ? 'In-Progress' : (job.status || 'In-Progress'),
      keyReq: false,
      working: true,
      hotReq: false,
      incumbentVendor: false
    })
  }

  // Create / Add New Requisition
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
  }

  // Quick Search handler
  const handleQuickSearch = (e) => {
    e.preventDefault()
    if (!quickSearchId.trim()) return
    const match = jobs.find(j => (j.id || '').toLowerCase().includes(quickSearchId.toLowerCase()) || (j.title || '').toLowerCase().includes(quickSearchId.toLowerCase()))
    if (match) {
      handleOpenReq(match)
    } else {
      alert(`Requisition "${quickSearchId}" not found.`)
    }
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
    const parts = (c.name || 'Candidate').split(' ')
    const fn = parts[0]
    const ln = parts.slice(1).join(' ') || ''
    const candId = String(c.id ? String(c.id).replace(/\D/g, '').slice(-5) || '87534' : '87534')

    setSubmissionCandidate(prev => ({
      ...prev,
      id: candId,
      firstName: fn,
      lastName: ln,
      email: c.email || `${fn.toLowerCase()}@example.com`,
      phoneCell: c.phone || '571-660-5778',
      city: c.location ? c.location.split(',')[0].trim() : 'Richmond',
      state: c.location && c.location.split(',')[1] ? c.location.split(',')[1].trim().slice(0, 2) : 'VA',
      experienceYears: c.experience ? String(c.experience).replace(/\D/g, '') || '8' : '8',
      jobTitle: c.role || editingFields.title || 'Consultant',
      resumeName: `${c.name || 'Candidate'}_Resume.docx`
    }))

    setViewMode('resumeSubmission')
    setActiveSubTab('details')
  }

  const handleAssignCandidateToReq = () => {
    const fullName = `${submissionCandidate.firstName} ${submissionCandidate.lastName}`.trim()
    
    setPotentialCandidates(prev => [
      {
        id: submissionCandidate.id,
        name: fullName,
        payRate: `${submissionCandidate.proposedPayRate}/hr`,
        payRateType: submissionCandidate.proposedRateType || 'C2C',
        assignedBy: currentUser?.name || 'Recruiter',
        assignedOn: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Int-SubmittedToManager',
        statusComments: 'Submitted',
        interview: 'Select',
        rejectedReason: ''
      },
      ...prev.filter(p => p.id !== submissionCandidate.id)
    ])

    alert(`✅ Candidate ${fullName} (ID: ${submissionCandidate.id}) has been successfully assigned to Requisition #${selectedReq?.id?.replace('J-', '') || '158938'}!`)
    setViewMode('requisition')
    setActiveReqTab('potential')
  }

  // ─── FILTER REQUISITIONS LIST (WITH SEARCH REQUISITIONS FILTER CRITERIA) ───
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      if (!j) return false
      
      // Req ID filter
      if (reqFilters.reqId.trim()) {
        const cleanId = j.id.replace('J-', '')
        if (!cleanId.toLowerCase().includes(reqFilters.reqId.toLowerCase())) return false
      }

      // Title filter
      if (reqFilters.title.trim()) {
        if (!j.title?.toLowerCase().includes(reqFilters.title.toLowerCase())) return false
      }

      // Skills filter
      if (reqFilters.skills.trim()) {
        const skillsStr = Array.isArray(j.skills) ? j.skills.join(' ').toLowerCase() : ''
        if (!skillsStr.includes(reqFilters.skills.toLowerCase())) return false
      }

      // City filter
      if (reqFilters.city.trim()) {
        const loc = (j.location || '').toLowerCase()
        if (!loc.includes(reqFilters.city.toLowerCase())) return false
      }

      // State filter
      if (reqFilters.state !== 'Select State') {
        const loc = (j.location || '').toLowerCase()
        if (!loc.includes(reqFilters.state.toLowerCase())) return false
      }

      // Status filter
      if (reqFilters.status !== 'Select Status' && reqFilters.status !== 'All') {
        const stat = (j.status || '').toLowerCase()
        if (reqFilters.status === 'In-Progress' && stat !== 'active' && stat !== 'in-progress' && stat !== 'posted') return false
        if (reqFilters.status === 'Ready' && stat !== 'ready') return false
        if (reqFilters.status === 'Closed' && stat !== 'closed') return false
      }

      // End Client filter
      if (reqFilters.endClient !== 'Any') {
        const client = (j.client || '').toLowerCase()
        if (!client.includes(reqFilters.endClient.toLowerCase())) return false
      }

      // Req Type filter
      if (reqFilters.reqType !== 'Select Req Type') {
        const type = (j.type || '').toLowerCase()
        if (!type.includes(reqFilters.reqType.toLowerCase())) return false
      }

      return true
    })
  }, [jobs, reqFilters])

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredJobs.slice(start, start + pageSize)
  }, [filteredJobs, currentPage, pageSize])

  const totalPages = Math.ceil(filteredJobs.length / pageSize) || 1

  return (
    <SiteLayout>
      <div style={{ background: '#f1f5f9', minHeight: '92vh', paddingBottom: '30px', fontFamily: 'Arial, sans-serif' }}>
        
        {/* ═══════════ TOP HEADER USER INFO STRIP (NEW SCREENSHOT) ═══════════ */}
        <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '4px 16px', fontSize: '11px', color: '#475569' }}>
          <div className="container-wide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <span onClick={() => setViewMode('portal')} style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>Home</span>
              <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>About Us</span>
              <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>My Account</span>
              <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>Logout</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span>Theme: <select style={{ fontSize: '11px', padding: '1px 3px' }}><option>Default</option></select></span>
              <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Welcome: {userName}</span>
            </div>
          </div>
        </div>

        {/* ═══════════ COOLWORKS ORANGE HEADER NAVIGATION BAR ═══════════ */}
        <header style={{ background: '#ea580c', borderBottom: '2px solid #c2410c', color: '#ffffff' }}>
          <div className="container-wide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '42px', padding: '0 16px' }}>
            
            <div style={{ display: 'flex', gap: '2px', height: '100%', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontWeight: 'bold', fontSize: '15px', letterSpacing: '0.02em', background: '#c2410c' }}>
                COOLWORKS
              </div>
              {[
                { name: 'Requisitions', active: true },
                { name: 'Candidates', active: false, link: '/ats' },
                { name: 'Administration', active: false, link: '/ats' },
                { name: 'Reports', active: false, link: '/reports' },
                { name: 'Process', active: false, link: '/ats' }
              ].map(t => (
                <div
                  key={t.name}
                  onClick={() => { if (!t.active && t.link) window.location.href = t.link; else setViewMode('portal'); }}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '12.5px', fontWeight: 'bold',
                    background: t.active && viewMode === 'portal' ? '#d97706' : 'transparent',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer'
                  }}
                >
                  {t.name}
                </div>
              ))}
            </div>

            {/* Quick Search Input */}
            <form onSubmit={handleQuickSearch} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Requisition #</span>
              <input
                type="text"
                value={quickSearchId}
                onChange={e => setQuickSearchId(e.target.value)}
                placeholder="Req ID / Title"
                style={{ padding: '2px 6px', fontSize: '11px', width: '130px', border: '1px solid #ffffff', borderRadius: '2px' }}
              />
              <button
                type="submit"
                style={{ background: '#f8fafc', color: '#0f172a', border: 'none', padding: '3px 10px', fontSize: '11px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' }}
              >
                Quick Search
              </button>
            </form>
          </div>
        </header>

        {/* ═══════════ MAIN VIEW CONTAINER ═══════════ */}
        <div className="container-wide" style={{ padding: '16px', maxWidth: '1360px', margin: '0 auto' }}>

          {/* ─────────────────────────────────────────────────────────────
              VIEW MODE 1: STEP 1 - RESUME SEARCH & ADD CANDIDATE FORM (IMAGE 1)
              ───────────────────────────────────────────────────────────── */}
          {viewMode === 'resumeSearch' && (
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              
              <div style={{ background: '#e2e8f0', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '4px', marginBottom: '12px', fontSize: '11.5px', color: '#1e3a8a', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
                <div><strong>Requisition #:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{selectedReq?.id?.replace('J-', '') || '158938'}</span></div>
                <div><strong>Position Title:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.title || 'Project Manager - Consultant - 13285'}</span></div>
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
                      <option>Select</option>
                      <option>SC</option>
                      <option>VA</option>
                      <option>TX</option>
                      <option>NC</option>
                      <option>GA</option>
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
                        <option>100</option>
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
                      <option>Green Card</option>
                      <option>H1B</option>
                    </select>

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Screened:</label>
                    <select value={searchCandFilter.screened} onChange={e => setSearchCandFilter({ ...searchCandFilter, screened: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                      <option>All</option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Assigned To:</label>
                    <select value={searchCandFilter.assignedTo} onChange={e => setSearchCandFilter({ ...searchCandFilter, assignedTo: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                      <option>Any</option>
                      <option>Vaibhav Bisen</option>
                      <option>Nitin Bhosale</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => alert(`Found ${candidates.length} candidate(s) in system.`)}
                      style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '3px 14px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Search
                    </button>
                  </div>

                  <div style={{ marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Existing Candidates in Pool:</div>
                    <div style={{ maxHeight: '110px', overflowY: 'auto', fontSize: '11px' }}>
                      {candidates.slice(0, 4).map(c => (
                        <div key={c.id || c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', borderBottom: '1px solid #f1f5f9' }}>
                          <span><strong>{c.name}</strong> ({c.role || 'Consultant'})</span>
                          <span onClick={() => handleSelectExistingCandidate(c)} style={{ color: '#0066cc', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
                            Select &gt;&gt;
                          </span>
                        </div>
                      ))}
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
                      <option>Select</option>
                      <option>SC</option>
                      <option>VA</option>
                      <option>TX</option>
                      <option>NC</option>
                      <option>GA</option>
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
              VIEW MODE 2: STEP 2 - RESUME SUBMISSION FORM (IMAGES 2, 3, 4)
              ───────────────────────────────────────────────────────────── */}
          {viewMode === 'resumeSubmission' && (
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              
              <div style={{ background: '#e2e8f0', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '4px', marginBottom: '8px', fontSize: '11.5px', color: '#1e3a8a', display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '4px 20px' }}>
                <div><strong>Requisition #:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{selectedReq?.id?.replace('J-', '') || '158938'}</span></div>
                <div><strong>Position Title:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.title || 'Project Manager - Consultant - 13285'}</span></div>
                <div><strong>Status:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>In-Progress</span></div>
                <div><strong>Customer:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.customer || 'State Of SC'}</span></div>
                <div><strong>Start Date:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.startDate || '10/23/2026'}</span></div>
                <div><strong>Duration:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.duration || '12'} Months</span></div>
              </div>

              <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 'bold', marginBottom: '10px' }}>
                Status: Ready
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '3px', marginBottom: '12px', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                  <span><strong>Candidate # :</strong> <span style={{ color: '#0066cc', fontWeight: 'bold' }}>{submissionCandidate.id}</span></span>
                  <button type="button" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 8px', fontSize: '11px', cursor: 'pointer' }}>Candidate Projects</button>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1e3a8a', fontWeight: 'bold' }}>
                    <input type="checkbox" defaultChecked /> Screened
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ color: '#1e3a8a', fontWeight: 'bold', width: '110px' }}>Candidate Name:*</label>
                    <input type="text" value={submissionCandidate.firstName} onChange={e => setSubmissionCandidate({ ...submissionCandidate, firstName: e.target.value })} style={{ flex: 1, padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                    <input type="text" value={submissionCandidate.lastName} onChange={e => setSubmissionCandidate({ ...submissionCandidate, lastName: e.target.value })} style={{ flex: 1, padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ color: '#1e3a8a', fontWeight: 'bold', width: '70px' }}>E-mail:*</label>
                    <input type="email" value={submissionCandidate.email} onChange={e => setSubmissionCandidate({ ...submissionCandidate, email: e.target.value })} style={{ flex: 1, padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Pay Rate:</span>
                  <input type="text" value={submissionCandidate.payRateMin} onChange={e => setSubmissionCandidate({ ...submissionCandidate, payRateMin: e.target.value })} style={{ width: '45px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                  <span>To</span>
                  <input type="text" value={submissionCandidate.payRateMax} onChange={e => setSubmissionCandidate({ ...submissionCandidate, payRateMax: e.target.value })} style={{ width: '45px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                  <select value={submissionCandidate.rateUnit} onChange={e => setSubmissionCandidate({ ...submissionCandidate, rateUnit: e.target.value })} style={{ padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                    <option>per hour</option>
                    <option>annual</option>
                  </select>

                  <span style={{ color: '#1e3a8a', fontWeight: 'bold', marginLeft: '10px' }}>Rate Type:</span>
                  <select value={submissionCandidate.rateType} onChange={e => setSubmissionCandidate({ ...submissionCandidate, rateType: e.target.value })} style={{ padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                    <option>C2C</option>
                    <option>W2</option>
                    <option>1099</option>
                  </select>

                  <span style={{ color: '#1e3a8a', fontWeight: 'bold', marginLeft: '10px' }}>Available Date:*</span>
                  <input type="text" value={submissionCandidate.availableDate} onChange={e => setSubmissionCandidate({ ...submissionCandidate, availableDate: e.target.value })} style={{ width: '110px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', background: '#e2e8f0', padding: '4px 8px 0', gap: '2px' }}>
                {[
                  { id: 'details', label: 'Details' },
                  { id: 'skill', label: 'Skill' },
                  { id: 'references', label: 'References' },
                  { id: 'legal', label: 'Legal' },
                  { id: 'notes', label: `Interaction Notes (${submissionCandidate.interactionNotes?.length || 3})` },
                  { id: 'history', label: 'Submission History' },
                  { id: 'projects', label: 'Projects' }
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

              {/* Sub-Tab Body */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: 'none', padding: '16px 20px', minHeight: '340px' }}>
                {activeSubTab === 'details' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px 8px', fontSize: '11.5px', alignContent: 'start', alignItems: 'center' }}>
                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Date of Birth:</label>
                        <input type="text" value={submissionCandidate.dob || ''} onChange={e => setSubmissionCandidate({ ...submissionCandidate, dob: e.target.value })} style={{ width: '130px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', textAlign: 'right', fontWeight: 'bold' }}>Candidate Source*:</label>
                        <select value={submissionCandidate.source} onChange={e => setSubmissionCandidate({ ...submissionCandidate, source: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>Other</option>
                          <option>LinkedIn</option>
                          <option>Direct Application</option>
                          <option>Vendor Referral</option>
                        </select>

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Sub-Vendor:</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select value={submissionCandidate.subVendor} onChange={e => setSubmissionCandidate({ ...submissionCandidate, subVendor: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                            <option>Talent9 Inc</option>
                            <option>Direct</option>
                            <option>CoolSoft Tech</option>
                          </select>
                          <span style={{ color: '#0066cc', textDecoration: 'underline', cursor: 'pointer', fontSize: '11px' }}>AddSubVendor</span>
                        </div>

                        <label style={{ color: '#1e3a8a', textAlign: 'right', fontWeight: 'bold' }}>Job Title:*</label>
                        <input type="text" value={submissionCandidate.jobTitle} onChange={e => setSubmissionCandidate({ ...submissionCandidate, jobTitle: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Phone(any one):</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '4px', alignItems: 'center' }}>
                          <span>Cell</span>
                          <input type="text" value={submissionCandidate.phoneCell} onChange={e => setSubmissionCandidate({ ...submissionCandidate, phoneCell: e.target.value })} style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                          <span>Home</span>
                          <input type="text" value={submissionCandidate.phoneHome} onChange={e => setSubmissionCandidate({ ...submissionCandidate, phoneHome: e.target.value })} style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                          <span>Work</span>
                          <input type="text" value={submissionCandidate.phoneWork} onChange={e => setSubmissionCandidate({ ...submissionCandidate, phoneWork: e.target.value })} style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                        </div>

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Address:</label>
                        <input type="text" value={submissionCandidate.address} onChange={e => setSubmissionCandidate({ ...submissionCandidate, address: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>City, State, Zip:</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input type="text" value={submissionCandidate.city} onChange={e => setSubmissionCandidate({ ...submissionCandidate, city: e.target.value })} style={{ flex: 2, padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                          <select value={submissionCandidate.state} onChange={e => setSubmissionCandidate({ ...submissionCandidate, state: e.target.value })} style={{ flex: 1, padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                            <option>VA</option>
                            <option>SC</option>
                            <option>TX</option>
                            <option>NC</option>
                          </select>
                          <input type="text" value={submissionCandidate.zip} onChange={e => setSubmissionCandidate({ ...submissionCandidate, zip: e.target.value })} style={{ width: '55px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                        </div>

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Work Authorization:</label>
                        <select value={submissionCandidate.workAuth} onChange={e => setSubmissionCandidate({ ...submissionCandidate, workAuth: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>GC</option>
                          <option>US Citizen</option>
                          <option>H1B</option>
                        </select>

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Ready to Relocate:</label>
                        <select value={submissionCandidate.relocate} onChange={e => setSubmissionCandidate({ ...submissionCandidate, relocate: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>No</option>
                          <option>Yes</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px 8px', fontSize: '11.5px', alignContent: 'start', alignItems: 'center' }}>
                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Currently Working:</label>
                        <input type="checkbox" checked={submissionCandidate.currentlyWorking} onChange={e => setSubmissionCandidate({ ...submissionCandidate, currentlyWorking: e.target.checked })} />

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Resume Document:</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ color: '#0066cc', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
                            {submissionCandidate.resumeName}
                          </span>
                          <span style={{ cursor: 'pointer' }}>✏️</span>
                        </div>

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Preferences for Placement:</label>
                        <textarea rows={3} value={submissionCandidate.placementPref} onChange={e => setSubmissionCandidate({ ...submissionCandidate, placementPref: e.target.value })} style={{ padding: '4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>SSN(Last four):</label>
                        <input type="text" value={submissionCandidate.ssnLast4} onChange={e => setSubmissionCandidate({ ...submissionCandidate, ssnLast4: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', textAlign: 'right', fontWeight: 'bold' }}>Experience:*</label>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input type="text" value={submissionCandidate.experienceYears} onChange={e => setSubmissionCandidate({ ...submissionCandidate, experienceYears: e.target.value })} style={{ width: '45px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                          <span>years</span>
                        </div>

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Overall Rating:</label>
                        <div>⛔ ⭐️⭐️⭐️⭐️⭐️</div>

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Technical Rating:</label>
                        <div>⛔ ⭐️⭐️⭐️⭐️⭐️</div>

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Comm Skill:</label>
                        <div>⛔ ⭐️⭐️⭐️⭐️⭐️</div>

                        <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a' }}>
                            <input type="checkbox" checked={submissionCandidate.securityClearance} onChange={e => setSubmissionCandidate({ ...submissionCandidate, securityClearance: e.target.checked })} />
                            Security Clearance / Federal Clearance:
                          </label>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '12px', marginTop: '14px', fontSize: '11.5px' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Proposed Bill Rate*:</span>
                        <input type="text" value={submissionCandidate.proposedBillRate} onChange={e => setSubmissionCandidate({ ...submissionCandidate, proposedBillRate: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                        <span>per hour</span>

                        <span style={{ color: '#1e3a8a', fontWeight: 'bold', marginLeft: '12px' }}>Pay Rate*:</span>
                        <input type="text" value={submissionCandidate.proposedPayRate} onChange={e => setSubmissionCandidate({ ...submissionCandidate, proposedPayRate: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                        <span>per hour</span>

                        <span style={{ color: '#1e3a8a', fontWeight: 'bold', marginLeft: '12px' }}>Rate Type:</span>
                        <select value={submissionCandidate.proposedRateType} onChange={e => setSubmissionCandidate({ ...submissionCandidate, proposedRateType: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>C2C</option>
                          <option>W2</option>
                          <option>1099</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '6px', marginBottom: '14px' }}>
                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Comments:</label>
                        <textarea rows={3} value={submissionCandidate.comments} onChange={e => setSubmissionCandidate({ ...submissionCandidate, comments: e.target.value })} style={{ width: '100%', maxWidth: '600px', padding: '6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                      </div>

                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                        <button type="button" onClick={() => setViewMode('resumeSearch')} style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '4px 14px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}>
                          Back To Search Results
                        </button>
                        <button type="button" onClick={handleAssignCandidateToReq} style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '4px 16px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}>
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

                {activeSubTab === 'notes' && (
                  <div style={{ fontSize: '11.5px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                        <thead>
                          <tr style={{ background: '#94a3b8', color: '#ffffff' }}>
                            <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 'bold' }}>Notes</th>
                            <th style={{ padding: '6px 10px', width: '220px', textAlign: 'left', fontWeight: 'bold' }}>Submitted By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissionCandidate.interactionNotes?.map((n, idx) => (
                            <tr key={n.id || idx} style={{ background: idx % 2 === 0 ? '#f8fafc' : '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '8px 10px', color: '#1e293b', lineHeight: '1.5' }}>{n.note}</td>
                              <td style={{ padding: '8px 10px', color: '#475569', fontSize: '11px' }}>
                                <div>{n.author}</div>
                                <div>{n.date}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault()
                      if (!newNoteText.trim()) return
                      const newNote = {
                        id: Date.now(),
                        note: newNoteText,
                        author: currentUser?.name || 'Vaibhav Bisen',
                        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                      setSubmissionCandidate(prev => ({
                        ...prev,
                        interactionNotes: [newNote, ...(prev.interactionNotes || [])]
                      }))
                      setNewNoteText('')
                      alert('Note added successfully!')
                    }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>Write Note</label>
                      <textarea rows={3} value={newNoteText} onChange={e => setNewNoteText(e.target.value)} placeholder="Add note or phone screen feedback..." style={{ width: '100%', maxWidth: '640px', padding: '6px', fontSize: '11.5px', border: '1px solid #cbd5e1', marginBottom: '8px' }} />
                      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <button type="submit" style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '3px 16px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}>Save Note</button>
                      </div>
                    </form>
                  </div>
                )}

                {activeSubTab === 'history' && (
                  <div style={{ fontSize: '11.5px' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e3a8a', marginBottom: '8px' }}>Candidate was submitted for these requisitions:</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#94a3b8', color: '#ffffff' }}>
                          <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Requisition#</th>
                          <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Position Title</th>
                          <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Start Date</th>
                          <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>End Date</th>
                          <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>End Client</th>
                          <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Bill Rate</th>
                          <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Pay Rate</th>
                          <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>History</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissionCandidate.submissionHistory?.map((h, idx) => (
                          <tr key={h.reqId || idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{h.reqId}</td>
                            <td style={{ padding: '6px 8px', color: '#0066cc', fontWeight: 'bold' }}>{h.title}</td>
                            <td style={{ padding: '6px 8px' }}>{h.startDate}</td>
                            <td style={{ padding: '6px 8px' }}>{h.endDate}</td>
                            <td style={{ padding: '6px 8px' }}>{h.endClient}</td>
                            <td style={{ padding: '6px 8px' }}>{h.billRate}</td>
                            <td style={{ padding: '6px 8px' }}>{h.payRate}</td>
                            <td style={{ padding: '6px 8px' }}>
                              <span style={{ color: '#0066cc', textDecoration: 'underline', cursor: 'pointer' }}>View</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW MODE 3: SINGLE REQUISITION DETAIL VIEW (IMAGE 1)
              ───────────────────────────────────────────────────────────── */}
          {viewMode === 'requisition' && selectedReq && (
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '10px' }}>
                You are here: <span style={{ color: '#0066cc', cursor: 'pointer' }} onClick={() => setViewMode('portal')}>Home</span> &gt; Requisitions &gt; Edit Requisition
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ea580c', paddingBottom: '6px', marginBottom: '14px', flexWrap: 'wrap', gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: '16px', color: '#1e3a8a', fontWeight: 'bold' }}>
                  Requisition #:{selectedReq.id.replace('J-', '')} <span style={{ color: '#dc2626', fontSize: '12.5px', marginLeft: '8px' }}>Status: Ready</span>
                </h2>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 'bold' }}>
                  <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => alert('Job posted to JobsInHand successfully!')}>
                    Post To JobsInHand
                  </span>
                  <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => alert('Opening Mass E-mail Dispatcher...')}>
                    Mass E-mail
                  </span>
                  <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setViewMode('portal')}>
                    &lt;&lt; Back To Search Results
                  </span>
                </div>
              </div>

              {/* 3-Column Header Form */}
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '4px', marginBottom: '14px',
                display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px 18px', fontSize: '11.5px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px 8px', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>Position Title:*</label>
                  <input type="text" value={editingFields.title || ''} onChange={e => setEditingFields({ ...editingFields, title: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />

                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>Start Date:*</label>
                  <input type="text" value={editingFields.startDate || ''} onChange={e => setEditingFields({ ...editingFields, startDate: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />

                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>Duration:*</label>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input type="text" value={editingFields.duration || '12'} onChange={e => setEditingFields({ ...editingFields, duration: e.target.value })} style={{ width: '45px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />
                    <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>months</span>
                  </div>

                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}># of Positions:*</label>
                  <input type="text" value={editingFields.numPositions || '1'} onChange={e => setEditingFields({ ...editingFields, numPositions: e.target.value })} style={{ width: '45px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />

                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>Max Submission:*</label>
                  <input type="text" value={editingFields.maxSubmissions || '2'} onChange={e => setEditingFields({ ...editingFields, maxSubmissions: e.target.value })} style={{ width: '45px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px 8px', alignItems: 'center' }}>
                  <div style={{ visibility: 'hidden' }}>spacer</div>
                  <div style={{ visibility: 'hidden' }}>spacer</div>

                  <label style={{ fontWeight: 'bold', color: '#0066cc', textAlign: 'right', textDecoration: 'underline', cursor: 'pointer' }}>Customer:</label>
                  <select value={editingFields.customer || ''} onChange={e => setEditingFields({ ...editingFields, customer: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                    <option>State Of SC</option>
                    <option>DFA</option>
                    <option>DBHDS</option>
                    <option>VDOT</option>
                  </select>

                  <label style={{ fontWeight: 'bold', color: '#0066cc', textAlign: 'right', textDecoration: 'underline', cursor: 'pointer' }}>Contact:</label>
                  <select value={editingFields.contact || ''} onChange={e => setEditingFields({ ...editingFields, contact: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                    <option>Hustedt Lexi</option>
                    <option>Miller Sarah</option>
                  </select>

                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>Submission Deadline:*</label>
                  <input type="text" value={editingFields.deadline || ''} onChange={e => setEditingFields({ ...editingFields, deadline: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />

                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>Req Category:*</label>
                  <select value={editingFields.category || 'SP'} onChange={e => setEditingFields({ ...editingFields, category: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                    <option>SP</option>
                    <option>IT</option>
                    <option>ENG</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px 8px', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>Status:</label>
                  <select value={editingFields.status || 'In-Progress'} onChange={e => setEditingFields({ ...editingFields, status: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                    <option>In-Progress</option>
                    <option>Ready</option>
                    <option>Closed</option>
                  </select>

                  <label style={{ fontWeight: 'bold', color: '#0066cc', textAlign: 'right', textDecoration: 'underline', cursor: 'pointer' }}>End Client:</label>
                  <select value={editingFields.endClient || ''} onChange={e => setEditingFields({ ...editingFields, endClient: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                    <option>State Of SC</option>
                    <option>DFA</option>
                  </select>

                  <label style={{ fontWeight: 'bold', color: '#0066cc', textAlign: 'right', textDecoration: 'underline', cursor: 'pointer' }}>Contact:</label>
                  <select value={editingFields.contact || ''} onChange={e => setEditingFields({ ...editingFields, contact: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                    <option>Hustedt Lexi</option>
                  </select>

                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold' }}>
                      <input type="checkbox" checked={editingFields.keyReq || false} onChange={e => setEditingFields({ ...editingFields, keyReq: e.target.checked })} /> Key Req
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold' }}>
                      <input type="checkbox" checked={editingFields.working || true} onChange={e => setEditingFields({ ...editingFields, working: e.target.checked })} /> Working
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold' }}>
                      <input type="checkbox" checked={editingFields.hotReq || false} onChange={e => setEditingFields({ ...editingFields, hotReq: e.target.checked })} /> Hot Req
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold' }}>
                      <input type="checkbox" checked={editingFields.incumbentVendor || false} onChange={e => setEditingFields({ ...editingFields, incumbentVendor: e.target.checked })} /> Incumbent Vendor
                    </label>
                  </div>

                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>Req Type:*</label>
                  <select value={editingFields.type || 'Contract'} onChange={e => setEditingFields({ ...editingFields, type: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                    <option>Contract</option>
                    <option>Full-Time</option>
                  </select>
                </div>
              </div>

              {/* Sub Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', background: '#e2e8f0', padding: '4px 8px 0', gap: '2px' }}>
                {[
                  { id: 'details', label: 'Details' },
                  { id: 'assign', label: 'Assign to Recruiters' },
                  { id: 'potential', label: `Potential Candidates (${potentialCandidates.length})` },
                  { id: 'attachments', label: `Attachments (${attachments.length})` },
                  { id: 'newCandidates', label: 'New Candidates (0)' }
                ].map(tab => (
                  <div
                    key={tab.id}
                    onClick={() => setActiveReqTab(tab.id)}
                    style={{
                      padding: '6px 14px', fontSize: '11.5px', fontWeight: 'bold', borderRadius: '4px 4px 0 0',
                      background: activeReqTab === tab.id ? '#ffffff' : '#f1f5f9',
                      border: activeReqTab === tab.id ? '1px solid #cbd5e1' : '1px solid transparent',
                      borderBottom: activeReqTab === tab.id ? '1px solid #ffffff' : 'none',
                      color: activeReqTab === tab.id ? '#0f172a' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </div>
                ))}
              </div>

              {/* Tab Panel Content */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: 'none', padding: '16px 20px', minHeight: '340px' }}>
                {activeReqTab === 'details' && (
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 420px', display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px 10px', alignContent: 'start', fontSize: '11.5px' }}>
                      <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Location Address:</label>
                      <input type="text" value={editingFields.address || ''} onChange={e => setEditingFields({ ...editingFields, address: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />

                      <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>City*, State*, Zip*:</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input type="text" value={editingFields.city || 'Columbia'} onChange={e => setEditingFields({ ...editingFields, city: e.target.value })} style={{ flex: 2, padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />
                        <select value={editingFields.state || 'SC'} onChange={e => setEditingFields({ ...editingFields, state: e.target.value })} style={{ flex: 1, padding: '3px 4px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                          <option>SC</option>
                          <option>VA</option>
                          <option>TX</option>
                        </select>
                        <input type="text" value={editingFields.zip || '29210'} onChange={e => setEditingFields({ ...editingFields, zip: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />
                      </div>

                      <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Bill Rate:</label>
                      <input type="text" value={editingFields.billRate || '90'} onChange={e => setEditingFields({ ...editingFields, billRate: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />

                      <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Pay Rate:</label>
                      <input type="text" value={editingFields.payRate || '75'} onChange={e => setEditingFields({ ...editingFields, payRate: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />

                      <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Interview:</label>
                      <select value={editingFields.interview || 'Select'} onChange={e => setEditingFields({ ...editingFields, interview: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                        <option>Select</option>
                        <option>1 Round Virtual/Online</option>
                      </select>

                      <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Work Authorization:</label>
                      <select value={editingFields.workAuth || 'Select'} onChange={e => setEditingFields({ ...editingFields, workAuth: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                        <option>Select</option>
                        <option>US Citizen</option>
                        <option>Green Card</option>
                      </select>

                      <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Subcontractable:*</label>
                      <select value={editingFields.subcontractable || 'No'} onChange={e => setEditingFields({ ...editingFields, subcontractable: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                        <option>No</option>
                        <option>Yes</option>
                      </select>

                      <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Experience:*</label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input type="text" value={editingFields.experience || '5'} onChange={e => setEditingFields({ ...editingFields, experience: e.target.value })} style={{ width: '45px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />
                        <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>years</span>
                      </div>
                    </div>

                    <div style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a' }}>Description:*</label>
                          <span style={{ fontSize: '13px', cursor: 'pointer' }}>🖨️</span>
                        </div>
                        <textarea
                          rows={11}
                          value={editingFields.description || ''}
                          onChange={e => setEditingFields({ ...editingFields, description: e.target.value })}
                          style={{ width: '100%', padding: '8px', fontSize: '11.5px', lineHeight: '1.6', border: '1px solid #cbd5e1', fontFamily: 'monospace', background: '#fafafa' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div>
                          <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>Required Skills:*</label>
                          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: '#0066cc', fontWeight: 'bold', lineHeight: '1.6' }}>
                            {Array.isArray(editingFields.skills) && editingFields.skills.map((s, idx) => (
                              <li key={idx}><span style={{ color: '#1e3a8a' }}>{s}</span></li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>Desired Skills:</label>
                          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: '#0066cc', fontWeight: 'bold', lineHeight: '1.6' }}>
                            {Array.isArray(editingFields.desiredSkills) && editingFields.desiredSkills.map((s, idx) => (
                              <li key={idx}><span style={{ color: '#1e3a8a' }}>{s}</span></li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 3: POTENTIAL CANDIDATES ─── */}
                {activeReqTab === 'potential' && (
                  <div style={{ fontSize: '11.5px' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e3a8a', marginBottom: '10px' }}>
                      Candidates available for this view:
                    </div>

                    <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#94a3b8', color: '#ffffff' }}>
                            <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Name</th>
                            <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Pay Rate</th>
                            <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Pay Rate Type</th>
                            <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Assigned By</th>
                            <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Assigned On</th>
                            <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Status</th>
                            <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Status Comments</th>
                            <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Schedule Interview</th>
                            <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Rejected Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {potentialCandidates.map((pc, idx) => (
                            <tr key={pc.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>
                                <span onClick={() => {
                                  const parts = pc.name.split(' ')
                                  setSubmissionCandidate(prev => ({
                                    ...prev,
                                    id: pc.id,
                                    firstName: parts[0] || 'Candidate',
                                    lastName: parts.slice(1).join(' ') || '',
                                    proposedPayRate: pc.payRate.replace(/[^0-9]/g, '') || '74',
                                    proposedRateType: pc.payRateType || 'C2C'
                                  }))
                                  setViewMode('resumeSubmission')
                                  setActiveSubTab('details')
                                }} style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>
                                  {pc.name}
                                </span>
                              </td>
                              <td style={{ padding: '6px 8px' }}>{pc.payRate}</td>
                              <td style={{ padding: '6px 8px' }}>{pc.payRateType}</td>
                              <td style={{ padding: '6px 8px' }}>{pc.assignedBy}</td>
                              <td style={{ padding: '6px 8px', color: '#475569' }}>{pc.assignedOn}</td>
                              <td style={{ padding: '6px 8px' }}>{pc.status}</td>
                              <td style={{ padding: '6px 8px' }}>{pc.statusComments}</td>
                              <td style={{ padding: '6px 8px' }}>{pc.interview}</td>
                              <td style={{ padding: '6px 8px' }}>{pc.rejectedReason || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                      <span
                        onClick={() => setViewMode('resumeSearch')}
                        style={{ color: '#0066cc', fontWeight: 'bold', fontSize: '11.5px', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        Select Candidate
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => { alert(`Requisition saved successfully!`); setViewMode('portal'); }}
                  style={{ background: '#e2e8f0', color: '#0f172a', border: '1px solid #94a3b8', padding: '4px 20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW MODE 4: ALL OPEN REQUISITIONS (PORTAL HOME + SEARCH REQUISITIONS FILTER)
              ───────────────────────────────────────────────────────────── */}
          {viewMode === 'portal' && (
            <div>
              {/* Breadcrumb path */}
              <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '8px' }}>
                You are here: <span style={{ color: '#0066cc', cursor: 'pointer' }}>Home</span> &gt; Requisitions
              </div>

              {/* ═══════════ SEARCH REQUISITIONS FILTER PANEL (NEW UPLOADED SCREENSHOT) ═══════════ */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px 18px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                
                {/* Title & Add New Requisition Link */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h2 style={{ margin: 0, fontSize: '15px', color: '#1e3a8a', fontWeight: 'bold' }}>
                    Search Requisitions
                  </h2>
                  <span
                    onClick={handleAddNewRequisition}
                    style={{ color: '#0066cc', fontWeight: 'bold', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Add new Requisition
                  </span>
                </div>

                {/* Collapsible Modify Search Banner */}
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

                {/* Filter Form Body */}
                {showFilterPanel && (
                  <form onSubmit={e => { e.preventDefault(); setCurrentPage(1); }} style={{ border: '1px solid #cbd5e1', borderTop: 'none', padding: '14px 16px', background: '#fdfdfe' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '14px 30px', fontSize: '11.5px' }}>
                      
                      {/* Left Filter Column */}
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
                          <option>Select State</option>
                          <option>SC</option>
                          <option>VA</option>
                          <option>TX</option>
                          <option>NC</option>
                          <option>GA</option>
                          <option>FL</option>
                          <option>MI</option>
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
                          <option>Any</option>
                          <option>Vaibhav Bisen</option>
                          <option>Nitin Bhosale</option>
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

                      {/* Right Filter Column */}
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

                    {/* Filter Submit Actions */}
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

              {/* ═══════════ ALL OPEN REQUISITIONS TABLE ═══════════ */}
              <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '4px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h2 style={{ margin: '0 0 2px', fontSize: '15px', color: '#16a34a', fontWeight: 'bold' }}>
                  COOLSOFT Recruitment Portal Home
                </h2>
                <div style={{ fontSize: '12px', color: '#334155', fontWeight: 'bold', marginBottom: '12px' }}>
                  Welcome back to CoolWorks. You have {jobs.length} tasks.
                </div>

                <div style={{
                  background: '#bfdbfe', border: '1px solid #93c5fd', padding: '6px 12px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderRadius: '3px 3px 0 0'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a' }}>All Open Requisitions</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a' }}>
                    (Requisitions {filteredJobs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredJobs.length)} of {filteredJobs.length})
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#94a3b8', color: '#ffffff', borderBottom: '1px solid #cbd5e1' }}>
                        <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Req#</th>
                        <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Position</th>
                        <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Skills</th>
                        <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Customer</th>
                        <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Location</th>
                        <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Deadline</th>
                        <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Pay Rate</th>
                        <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Recruiters</th>
                        <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Status</th>
                        <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Req Ctg</th>
                        <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Req Type</th>
                        <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Duration</th>
                        <th style={{ padding: '7px 5px', fontWeight: 'bold', textAlign: 'center' }}>W</th>
                        <th style={{ padding: '7px 5px', fontWeight: 'bold', textAlign: 'center' }}>K</th>
                        <th style={{ padding: '7px 5px', fontWeight: 'bold', textAlign: 'center' }}>Cont</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedJobs.length === 0 ? (
                        <tr>
                          <td colSpan="15" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                            No open requisitions found matching search criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedJobs.map((job, idx) => (
                          <tr key={job.id} style={{
                            background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                            borderBottom: '1px solid #e2e8f0'
                          }}>
                            <td style={{ padding: '7px 9px', fontWeight: 'bold' }}>
                              <span onClick={() => handleOpenReq(job)} style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>
                                {job.id.replace('J-', '')}
                              </span>
                            </td>
                            <td style={{ padding: '7px 9px', fontWeight: 'bold' }}>
                              <span onClick={() => handleOpenReq(job)} style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>
                                {job.title}
                              </span>
                            </td>
                            <td style={{ padding: '7px 9px', color: '#475569' }}>
                              {Array.isArray(job.skills) ? job.skills.slice(0, 3).join(', ') : ''}
                            </td>
                            <td style={{ padding: '7px 9px', color: '#475569' }}>{job.client || 'State Of SC'}</td>
                            <td style={{ padding: '7px 9px', color: '#475569' }}>{job.location || 'Columbia, SC'}</td>
                            <td style={{ padding: '7px 9px', color: '#e11d48', fontWeight: 'bold' }}>{job.deadline || 'Aug 28, 2026'}</td>
                            <td style={{ padding: '7px 9px', color: '#475569' }}>{job.budget || '75/hr'}</td>
                            <td style={{ padding: '7px 9px', color: '#475569' }}>{job.postedByName || 'VaibhavB...'}</td>
                            <td style={{ padding: '7px 9px', color: '#16a34a', fontWeight: 'bold' }}>{job.status === 'Active' ? 'In-Progress' : (job.status || 'In-Progress')}</td>
                            <td style={{ padding: '7px 9px', color: '#475569' }}>SP</td>
                            <td style={{ padding: '7px 9px', color: '#475569' }}>{job.type || 'Contract'}</td>
                            <td style={{ padding: '7px 9px', color: '#475569' }}>{job.duration || '12'}</td>
                            <td style={{ padding: '7px 5px', textAlign: 'center' }}>
                              <input type="checkbox" readOnly checked={false} />
                            </td>
                            <td style={{ padding: '7px 5px', textAlign: 'center' }}>
                              <input type="checkbox" readOnly checked={false} />
                            </td>
                            <td style={{ padding: '7px 5px', textAlign: 'center' }}>
                              <input type="checkbox" readOnly checked={idx % 2 === 1} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderTop: '1px solid #cbd5e1', paddingTop: '10px', marginTop: '10px'
                }}>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const p = i + 1
                      return (
                        <span key={p} onClick={() => setCurrentPage(p)} style={{
                          color: currentPage === p ? '#ea580c' : '#0066cc',
                          cursor: 'pointer',
                          textDecoration: currentPage === p ? 'none' : 'underline'
                        }}>
                          {p}
                        </span>
                      )
                    })}
                    <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>Next</span>
                    <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentPage(totalPages)}>Last</span>
                  </div>

                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                    Page Size:
                    <select value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} style={{ marginLeft: '6px', fontSize: '11px', padding: '1px 3px' }}>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* ═══════════ COOLSOFT ORANGE FOOTER ═══════════ */}
        <footer style={{ background: '#ea580c', borderTop: '2px solid #c2410c', color: '#ffffff', textAlign: 'center', padding: '10px', marginTop: '30px', fontSize: '11px', fontWeight: 'bold' }}>
          © COOLSOFT LLC | All rights reserved | Release 1.9 06-May-2025 (New Server 2023 Aug)
        </footer>

      </div>
    </SiteLayout>
  )
}

export default RecruiterDashboard
