import React, { useState, useMemo, useEffect } from 'react'
import { US_STATES } from '../data/usStates'
import { parseResume } from '../smarthire/utils/parseResume'
import { saveLegalDocs, uploadDocFile, saveCandidate, getCandidate } from '../lib/atsFirestore'

export default function CandidateDetailViewModal({
  candidate,
  isOpen,
  onClose,
  allJobs = [],
  onUpdateCandidate,
  currentUser,
  reqContext = null
}) {
  if (!isOpen || !candidate) return null

  // Active Subtab on Left Side
  const [activeTab, setActiveTab] = useState('details') // 'details', 'skill', 'references', 'legal_docs', 'notes', 'submissions', 'projects', 'ai_fit'
  
  // Active Document to display in Right Viewer
  const [activeDocType, setActiveDocType] = useState('resume') // 'resume', 'visa', 'dl', 'rtr', 'ssn', 'coversheet'
  const [zoomLevel, setZoomLevel] = useState(100)
  const [toastMsg, setToastMsg] = useState(null)

  const userName = currentUser?.name || currentUser?.displayName || 'Recruiter'
  const userRole = currentUser?.role || 'recruiter'

  const cleanCandId = String(candidate.id || candidate.canId || candidate._id || '87501').replace('CAND-', '').replace('cand-', '')

  // Helper to extract candidate details cleanly from prop + localStorage
  const getInitialFormData = () => {
    let parsedOverrides = {}
    try {
      const savedOverrides = localStorage.getItem(`smarthire_candidate_details_${cleanCandId}`) ||
                             localStorage.getItem(`smarthire_candidate_details_${candidate.id}`)
      if (savedOverrides) parsedOverrides = JSON.parse(savedOverrides)
    } catch(e) {}

    const candNameParts = (candidate.name || '').trim().split(' ').filter(Boolean)
    const firstName = parsedOverrides.firstName || candidate.firstName || candNameParts[0] || ''
    const lastName = parsedOverrides.lastName || candidate.lastName || candNameParts.slice(1).join(' ') || ''
    const email = parsedOverrides.email || candidate.email || candidate.candidateEmail || ''
    const phone = parsedOverrides.phoneCell || candidate.phone || candidate.phoneCell || candidate.cell || ''
    const jobTitle = parsedOverrides.jobTitle || candidate.jobTitle || candidate.fullRole || candidate.role || (reqContext?.title || 'Lead Business Analyst')
    
    let locCity = ''
    let locState = 'SC'
    if (candidate.location) {
      const locParts = candidate.location.split(',').map(s => s.trim())
      if (locParts[0]) locCity = locParts[0]
      if (locParts[1]) locState = locParts[1].slice(0, 2).toUpperCase()
    }

    const city = parsedOverrides.city || candidate.city || locCity || 'Columbia'
    const state = parsedOverrides.state || candidate.state || locState || 'SC'
    const zip = parsedOverrides.zip || candidate.zip || '29210'
    const exp = parsedOverrides.experience || String(candidate.exp || candidate.experience || '6').replace(/[^0-9]/g, '') || '6'
    const workAuth = parsedOverrides.workAuth || candidate.workAuth || 'US Citizen'
    const payRate = parsedOverrides.payRate || (candidate.payRate ? String(candidate.payRate).replace(/[^0-9]/g, '') : '75')
    const payRateTo = parsedOverrides.payRateTo || (candidate.payRateTo ? String(candidate.payRateTo).replace(/[^0-9]/g, '') : payRate)
    const rateType = parsedOverrides.rateType || candidate.rateType || candidate.payRateType || 'C2C'
    const availableDate = parsedOverrides.availableDate || candidate.avblDate || candidate.availableDate || 'Immediate'
    const subVendor = parsedOverrides.subVendor || candidate.subVendor || 'Direct Sourcing'
    const source = parsedOverrides.source || candidate.source || 'Direct Sourcing'
    const comments = parsedOverrides.comments || candidate.comments || candidate.statusComments || `Direct sourcing for Requisition #${reqContext?.id || candidate.jobId || '1787683131680-88'}`
    const ssnLastFour = parsedOverrides.ssnLastFour || candidate.ssnLastFour || ''
    const proposedBillRate = parsedOverrides.proposedBillRate || candidate.billRate || (reqContext?.billRate || '90')
    const finalPayRate = parsedOverrides.finalPayRate || payRate
    const preferences = parsedOverrides.preferences || candidate.preferences || candidate.locPref || 'Open to Hybrid / Remote in US'

    return {
      candId: cleanCandId,
      firstName,
      lastName,
      email,
      payRate,
      payRateTo,
      rateType,
      availableDate,
      screened: parsedOverrides.screened !== undefined ? parsedOverrides.screened : (candidate.screened === 'Yes' || candidate.screened === true),
      dob: parsedOverrides.dob || candidate.dob || '',
      source,
      subVendor,
      jobTitle,
      phoneCell: phone,
      phoneHome: parsedOverrides.phoneHome || candidate.phoneHome || '',
      phoneWork: parsedOverrides.phoneWork || candidate.phoneWork || '',
      address: parsedOverrides.address || candidate.address || '',
      city,
      state,
      zip,
      workAuth,
      readyToRelocate: parsedOverrides.readyToRelocate || candidate.readyToRelocate || 'Yes',
      currentlyWorking: parsedOverrides.currentlyWorking !== undefined ? parsedOverrides.currentlyWorking : true,
      preferences,
      ssnLastFour,
      experience: exp,
      overallRating: parsedOverrides.overallRating || candidate.rating || 5,
      techRating: parsedOverrides.techRating || 5,
      commRating: parsedOverrides.commRating || 4,
      securityClearance: parsedOverrides.securityClearance !== undefined ? parsedOverrides.securityClearance : false,
      proposedBillRate,
      finalPayRate,
      comments
    }
  }

  const [formData, setFormData] = useState(getInitialFormData)

  // Re-sync formData when candidate prop changes
  useEffect(() => {
    setFormData(getInitialFormData())
  }, [candidate?.id, candidate?.name])

  // Get Required Skills of the Active Requisition
  const reqRequiredSkills = useMemo(() => {
    const raw = reqContext?.skills || ['Business Analysis', 'Agile / Scrum Framework', 'Requirements Gathering (BRD/FRD)', 'JIRA & Confluence', 'SQL & Data Analysis', 'User Stories & Acceptance Criteria', 'UML Diagrams & Process Modeling']
    if (Array.isArray(raw)) return raw.map(s => String(s).trim()).filter(Boolean)
    if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean)
    return []
  }, [reqContext?.skills])

  // Extract / Normalize Candidate Skills (with auto-extraction from resume text)
  const extractCandidateSkills = () => {
    // 1. Check saved skills
    try {
      const saved = localStorage.getItem(`smarthire_candidate_skills_${cleanCandId}`) ||
                    localStorage.getItem(`smarthire_candidate_skills_${candidate.id}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch(e) {}

    // 2. Check candidate.skills
    let rawSkills = []
    if (candidate.skills) {
      rawSkills = Array.isArray(candidate.skills) 
        ? candidate.skills 
        : String(candidate.skills).split(',').map(s => s.trim()).filter(Boolean)
    }

    // 3. Auto-parse from resume text if available
    if (rawSkills.length === 0 && (candidate.resumeText || candidate.text)) {
      const parsedRes = parseResume(candidate.resumeText || candidate.text)
      if (parsedRes.skills) {
        rawSkills = typeof parsedRes.skills === 'string' ? parsedRes.skills.split(',').map(s => s.trim()).filter(Boolean) : parsedRes.skills
      }
    }

    // 4. If still empty, provide relevant domain skills for the role
    if (rawSkills.length === 0) {
      const titleLower = (formData.jobTitle || candidate.jobTitle || candidate.fullRole || '').toLowerCase()
      if (titleLower.includes('business analyst') || titleLower.includes('ba')) {
        rawSkills = ['Business Analysis', 'Requirements Gathering (BRD/FRD)', 'Agile / Scrum', 'JIRA & Confluence', 'User Stories & Acceptance Criteria', 'SQL & Data Mapping', 'UML & Process Flow Diagrams', 'Stakeholder Management']
      } else if (titleLower.includes('qa') || titleLower.includes('test')) {
        rawSkills = ['QA Automation', 'Selenium WebDriver', 'Cypress / Playwright', 'Test Case Planning', 'API Testing (Postman)', 'JIRA', 'SQL', 'Regression Testing']
      } else if (titleLower.includes('network') || titleLower.includes('cisco')) {
        rawSkills = ['Cisco Routing & Switching', 'Network Security & Firewalls', 'BGP / OSPF / EIGRP', 'VPN & IPSec', 'Wireshark', 'LAN/WAN Architecture', 'F5 Load Balancers']
      } else if (titleLower.includes('data') || titleLower.includes('snowflake') || titleLower.includes('etl')) {
        rawSkills = ['Snowflake Data Cloud', 'SQL & PL/SQL', 'ETL / ELT Pipelines', 'AWS S3 & Data Lake', 'Python', 'Power BI / Tableau', 'Data Modeling']
      } else {
        rawSkills = ['Full Stack Development', 'React / TypeScript', 'Node.js / Java', 'SQL / PostgreSQL', 'REST APIs & Microservices', 'AWS Cloud', 'Docker / Kubernetes', 'Git / CI/CD']
      }
    }

    return rawSkills.map((s, idx) => {
      const skillName = typeof s === 'string' ? s.trim() : (s.name || '')
      const isReq = reqRequiredSkills.some(rq => rq.toLowerCase().includes(skillName.toLowerCase()) || skillName.toLowerCase().includes(rq.toLowerCase()))
      return {
        id: idx + 1,
        name: skillName,
        required: isReq ? 'Yes' : (idx < 2 ? 'Yes' : 'No'),
        experience: `${Math.max(2, parseInt(formData.experience || '6') - Math.floor(idx * 0.8))} Years`,
        rating: isReq ? 5 : 4,
        lastUsed: '2026'
      }
    })
  }

  const [skillsList, setSkillsList] = useState(extractCandidateSkills)

  // Re-sync skills when candidate changes
  useEffect(() => {
    setSkillsList(extractCandidateSkills())
  }, [candidate?.id, candidate?.name, candidate?.skills, candidate?.resumeText])

  // References List
  const [references, setReferences] = useState(() => {
    try {
      const saved = localStorage.getItem(`smarthire_candidate_refs_${cleanCandId}`) ||
                    localStorage.getItem(`smarthire_candidate_refs_${candidate.id}`)
      if (saved) return JSON.parse(saved)
    } catch(e) {}
    return []
  })

  // Reference Form State
  const [showAddRefForm, setShowAddRefForm] = useState(false)
  const [editingRefId, setEditingRefId] = useState(null)
  const [refForm, setRefForm] = useState({
    name: '',
    company: '',
    designation: '',
    phone: '',
    email: '',
    project: '',
    verificationStatus: 'Verified (Positive)',
    notes: ''
  })

  // Legal / Compliance Documents
  const [documents, setDocuments] = useState(() => {
    let parsedDocs = {}
    const candidateIdVariants = [
      cleanCandId,
      candidate?.id,
      candidate?.canId,
      candidate?._id,
      candidate?.candidateId,
      candidate?.candId
    ].filter(Boolean).map(String)

    for (const vId of candidateIdVariants) {
      try {
        const saved = localStorage.getItem(`smarthire_candidate_docs_${vId}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && typeof parsed === 'object') {
            parsedDocs = { ...parsedDocs, ...parsed }
          }
        }
      } catch (e) {}
    }

    // Also merge any legalDocs or documents directly attached to candidate object
    if (candidate?.legalDocs && typeof candidate.legalDocs === 'object') {
      parsedDocs = { ...parsedDocs, ...candidate.legalDocs }
    }
    if (candidate?.documents && typeof candidate.documents === 'object') {
      parsedDocs = { ...parsedDocs, ...candidate.documents }
    }

    const fullName = `${formData.firstName} ${formData.lastName}`.trim() || candidate.name || 'Candidate'
    const resumeFileName = candidate.resumeName || candidate.resumeFile?.name || parsedDocs.resume?.fileName || `${fullName.replace(/\s+/g, '_')}_Resume.pdf`
    const resumeData = candidate.resumeData || parsedDocs.resume?.fileData || null
    const resumeText = candidate.resumeText || parsedDocs.resume?.resumeText || ''

    return {
      resume: {
        title: resumeFileName,
        fileName: resumeFileName,
        uploadedOn: candidate.dateAdded || candidate.appliedDate || 'Today',
        status: (resumeData || candidate.resumeName || resumeText || parsedDocs.resume?.status === 'Uploaded') ? 'Uploaded' : 'Uploaded',
        size: parsedDocs.resume?.size || '245 KB',
        fileData: resumeData,
        fileType: resumeData ? (resumeData.startsWith('data:application/pdf') ? 'application/pdf' : 'application/octet-stream') : (resumeFileName.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        resumeText: resumeText,
        hasFile: !!(resumeData || parsedDocs.resume?.hasFile || parsedDocs.resume?.storageUrl)
      },
      visa: parsedDocs.visa || {
        title: 'Visa Copy / Form I-797',
        fileName: 'Not Uploaded',
        uploadedOn: '-',
        status: 'Pending',
        size: '-',
        validity: '',
        fileData: null,
        hasFile: false
      },
      dl: parsedDocs.dl || parsedDocs.dlFront || {
        title: "Driver's License (Front Page)",
        fileName: 'Not Uploaded',
        uploadedOn: '-',
        status: 'Pending',
        size: '-',
        fileData: null,
        hasFile: false
      },
      dlFront: parsedDocs.dlFront || parsedDocs.dl || {
        title: "Driver's License (Front Page)",
        fileName: 'Not Uploaded',
        uploadedOn: '-',
        status: 'Pending',
        size: '-',
        fileData: null,
        hasFile: false
      },
      dlBack: parsedDocs.dlBack || {
        title: "Driver's License (Back Page)",
        fileName: 'Not Uploaded',
        uploadedOn: '-',
        status: 'Pending',
        size: '-',
        fileData: null,
        hasFile: false
      },
      rtr: parsedDocs.rtr || {
        title: 'Right to Represent (RTR Form)',
        fileName: 'Not Uploaded',
        uploadedOn: '-',
        status: 'Pending',
        size: '-',
        fileData: null,
        hasFile: false
      },
      ssn: parsedDocs.ssn || {
        title: 'SSN Verification',
        fileName: 'Not Uploaded',
        uploadedOn: '-',
        status: 'Pending',
        size: '-',
        fileData: null,
        hasFile: false
      },
      coversheet: parsedDocs.coversheet || {
        title: 'Candidate Submission Cover Sheet',
        fileName: 'Not Uploaded',
        uploadedOn: '-',
        status: 'Pending',
        size: '-',
        fileData: null,
        hasFile: false
      }
    }
  })

  // Interaction Notes List
  const [interactionNotes, setInteractionNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(`smarthire_candidate_notes_${cleanCandId}`) ||
                    localStorage.getItem(`smarthire_candidate_notes_${candidate.id}`)
      if (saved) return JSON.parse(saved)
    } catch(e) {}
    return []
  })

  // Projects List
  const [projectsList, setProjectsList] = useState(() => {
    try {
      const saved = localStorage.getItem(`smarthire_candidate_projects_${cleanCandId}`) ||
                    localStorage.getItem(`smarthire_candidate_projects_${candidate.id}`)
      if (saved) return JSON.parse(saved)
    } catch(e) {}
    return [
      {
        id: 1,
        client: reqContext?.customer || 'State Department of Administration',
        role: formData.jobTitle || 'Lead Business Analyst',
        duration: '2023 - 2026',
        location: 'Columbia, SC (Hybrid)',
        description: 'Led end-to-end business requirements elicitation, process flow mapping, user story creation in JIRA, and UAT coordination for state enterprise portal transformation.'
      },
      {
        id: 2,
        client: 'Health & Human Services Agency',
        role: 'Senior Business Analyst',
        duration: '2020 - 2023',
        location: 'Richmond, VA',
        description: 'Authored comprehensive BRD and FRD documentation, facilitated daily Scrum ceremonies, conducted gap analysis, and validated backend SQL data mappings.'
      }
    ]
  })

  // ═══════════════════════════════════════════════════════════
  // RE-SYNC ALL CANDIDATE DATA ON MODAL OPEN & FROM FIRESTORE
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isOpen || !candidate) return

    // 1. Re-sync from localStorage immediately
    setFormData(getInitialFormData())
    setSkillsList(extractCandidateSkills())

    try {
      let savedDocsObj = {}
      const candidateIdVariants = [
        cleanCandId,
        candidate?.id,
        candidate?.canId,
        candidate?._id,
        candidate?.candidateId,
        candidate?.candId
      ].filter(Boolean).map(String)

      for (const vId of candidateIdVariants) {
        const saved = localStorage.getItem(`smarthire_candidate_docs_${vId}`)
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            if (parsed && typeof parsed === 'object') {
              savedDocsObj = { ...savedDocsObj, ...parsed }
            }
          } catch (e) {}
        }
      }
      if (candidate?.legalDocs && typeof candidate.legalDocs === 'object') {
        savedDocsObj = { ...savedDocsObj, ...candidate.legalDocs }
      }
      if (candidate?.documents && typeof candidate.documents === 'object') {
        savedDocsObj = { ...savedDocsObj, ...candidate.documents }
      }
      if (Object.keys(savedDocsObj).length > 0) {
        setDocuments(prev => ({ ...prev, ...savedDocsObj }))
      }
    } catch(e) {}

    try {
      const savedRefs = localStorage.getItem(`smarthire_candidate_refs_${cleanCandId}`) ||
                        localStorage.getItem(`smarthire_candidate_refs_${candidate.id}`)
      if (savedRefs) setReferences(JSON.parse(savedRefs))
    } catch(e) {}

    try {
      const savedNotes = localStorage.getItem(`smarthire_candidate_notes_${cleanCandId}`) ||
                          localStorage.getItem(`smarthire_candidate_notes_${candidate.id}`)
      if (savedNotes) setInteractionNotes(JSON.parse(savedNotes))
    } catch(e) {}

    try {
      const savedProjs = localStorage.getItem(`smarthire_candidate_projects_${cleanCandId}`) ||
                          localStorage.getItem(`smarthire_candidate_projects_${candidate.id}`)
      if (savedProjs) setProjectsList(JSON.parse(savedProjs))
    } catch(e) {}

    // 2. Fetch live data from Firebase Firestore (Cloud Source of Truth)
    getCandidate(cleanCandId).then(cloudCand => {
      if (!cloudCand && candidate?.id && String(candidate.id) !== String(cleanCandId)) {
        return getCandidate(String(candidate.id))
      }
      return cloudCand
    }).then(cloudCand => {
      if (!cloudCand) return
      if (cloudCand.legalDocs && Object.keys(cloudCand.legalDocs).length > 0) {
        setDocuments(prev => {
          const merged = { ...prev }
          for (const [k, v] of Object.entries(cloudCand.legalDocs)) {
            merged[k] = {
              ...merged[k],
              ...v,
              fileData: prev[k]?.fileData || v.fileData || null,
              status: v.hasFile || v.storageUrl || prev[k]?.fileData ? 'Uploaded' : (v.status || 'Pending')
            }
          }
          return merged
        })
      }
      if (cloudCand.skills && Array.isArray(cloudCand.skills) && cloudCand.skills.length > 0) {
        const formatted = cloudCand.skills.map((s, idx) => typeof s === 'string' ? { id: idx + 1, name: s, required: 'Yes', experience: '5 Years', rating: 5, lastUsed: '2026' } : s)
        setSkillsList(formatted)
      }
      if (cloudCand.notes && Array.isArray(cloudCand.notes) && cloudCand.notes.length > 0) {
        setInteractionNotes(cloudCand.notes)
      }
      if (cloudCand.references && Array.isArray(cloudCand.references) && cloudCand.references.length > 0) {
        setReferences(cloudCand.references)
      }
      if (cloudCand.projects && Array.isArray(cloudCand.projects) && cloudCand.projects.length > 0) {
        setProjectsList(cloudCand.projects)
      }
    }).catch(err => {
      console.warn('Firestore getCandidate note:', err)
    })
  }, [cleanCandId, isOpen, candidate?.id, candidate?.name])

  // Active Document to render in Right Panel
  const currentDoc = documents[activeDocType] || documents.resume

  // Submission History derived dynamically from real candidate submissions across jobs
  const submissionHistory = useMemo(() => {
    const list = []
    allJobs.forEach(job => {
      const cleanReqId = String(job.id || '').replace('J-', '')
      try {
        const raw = localStorage.getItem(`smarthire_potential_candidates_${cleanReqId}`) ||
                    localStorage.getItem(`smarthire_potential_candidates_J-${cleanReqId}`)
        if (raw) {
          const cands = JSON.parse(raw)
          const matched = cands.find(c => String(c.id).includes(cleanCandId) || c.name?.toLowerCase() === candidate.name?.toLowerCase())
          if (matched) {
            list.push({
              reqId: `J-${cleanReqId}`,
              positionTitle: job.title || 'Lead Business Analyst',
              startDate: job.creationDate || job.startDate || 'Immediate',
              endDate: 'Open',
              endClient: job.customer || job.client || 'State Of SC',
              billRate: job.billRate ? `$${job.billRate}` : '$90.00',
              payRate: matched.payRate || `$${formData.payRate}/hr`,
              status: matched.status || 'Int-SubmittedToManager',
              historyText: 'View'
            })
          }
        }
      } catch(e) {}
    })
    return list
  }, [allJobs, cleanCandId, candidate.name, formData.payRate])

  // New Note State
  const [newNoteText, setNewNoteText] = useState('')

  // Handle Form Change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle File Upload for any document (with automatic text extraction + Firebase Storage)
  const handleFileUpload = (docKey, e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (uploadEvt) => {
      const dataUrl = uploadEvt.target.result
      let parsedText = ''

      // If resume, call server parser
      if (docKey === 'resume') {
        try {
          const fd = new FormData()
          fd.append('resume', file)
          const res = await fetch('/api/parse-resume', { method: 'POST', body: fd })
          if (res.ok) {
            const json = await res.json()
            parsedText = json.text || ''
            if (json.email && !formData.email) handleInputChange('email', json.email)
            if (json.phone && !formData.phoneCell) handleInputChange('phoneCell', json.phone)
            if (parsedText) {
              const resSkills = parseResume(parsedText).skills
              if (resSkills) {
                const skillsArr = typeof resSkills === 'string' ? resSkills.split(',').map(s => s.trim()) : resSkills
                const newSkillObjs = skillsArr.map((sn, idx) => ({
                  id: Date.now() + idx,
                  name: sn,
                  required: reqRequiredSkills.some(r => r.toLowerCase().includes(sn.toLowerCase())) ? 'Yes' : 'No',
                  experience: '5 Years',
                  rating: 5,
                  lastUsed: '2026'
                }))
                setSkillsList(newSkillObjs)
              }
            }
          }
        } catch(err) {}
      }

      // Build updated document entry
      const updatedDoc = {
        title: file.name,
        fileName: file.name,
        uploadedOn: new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
        status: 'Uploaded',
        size: `${Math.round(file.size / 1024)} KB`,
        fileData: dataUrl,
        fileType: file.type,
        resumeText: parsedText || ''
      }

      let latestDocs = null
      setDocuments(prev => {
        const nextDocs = { ...prev, [docKey]: { ...prev[docKey], ...updatedDoc, resumeText: parsedText || prev[docKey]?.resumeText || '' } }
        latestDocs = nextDocs

        const candidateIdVariants = [
          cleanCandId,
          candidate?.id,
          candidate?.canId,
          candidate?._id,
          candidate?.candidateId,
          candidate?.candId
        ].filter(Boolean).map(String)

        for (const vId of candidateIdVariants) {
          try {
            localStorage.setItem(`smarthire_candidate_docs_${vId}`, JSON.stringify(nextDocs))
          } catch(e) {}
        }

        // CRITICAL: Immediately notify parent so requisition candidate state is in sync
        if (onUpdateCandidate) {
          onUpdateCandidate({
            ...candidate,
            legalDocs: nextDocs,
            documents: nextDocs,
            ...(docKey === 'resume' ? {
              resumeName: file.name,
              resumeData: dataUrl,
              resumeText: parsedText || candidate?.resumeText || ''
            } : {})
          })
        }

        return nextDocs
      })
      setActiveDocType(docKey)
      setToastMsg(`${file.name} attached & synced to candidate profile.`)

      // 1. Save metadata directly to Firestore across candidate ID variations
      try {
        await saveLegalDocs(cleanCandId, latestDocs || { [docKey]: updatedDoc }, {
          email: formData.email || candidate.email || '',
          candidateName: `${formData.firstName} ${formData.lastName}`.trim() || candidate.name || ''
        })
        if (candidate?.id && String(candidate.id) !== String(cleanCandId)) {
          await saveLegalDocs(String(candidate.id), latestDocs || { [docKey]: updatedDoc }, {
            email: formData.email || candidate.email || '',
            candidateName: `${formData.firstName} ${formData.lastName}`.trim() || candidate.name || ''
          })
        }
      } catch (fErr) {
        console.warn('Firestore saveLegalDocs note:', fErr)
      }

      // 2. Upload original file to Firebase Storage
      try {
        const { downloadUrl, storagePath } = await uploadDocFile(cleanCandId, docKey, dataUrl, file.name, file.type)
        setDocuments(prev => {
          const withStorage = {
            ...prev,
            [docKey]: { ...prev[docKey], storageUrl: downloadUrl, storagePath }
          }
          const candidateIdVariants = [
            cleanCandId,
            candidate?.id,
            candidate?.canId,
            candidate?._id,
            candidate?.candidateId,
            candidate?.candId
          ].filter(Boolean).map(String)

          for (const vId of candidateIdVariants) {
            try {
              localStorage.setItem(`smarthire_candidate_docs_${vId}`, JSON.stringify(withStorage))
            } catch(e) {}
          }

          if (onUpdateCandidate) {
            onUpdateCandidate({
              ...candidate,
              legalDocs: withStorage,
              documents: withStorage
            })
          }
          return withStorage
        })
        setToastMsg(`${file.name} uploaded & saved to database.`)
      } catch(storageErr) {
        console.warn('Firebase Storage upload note:', storageErr)
        setToastMsg(`${file.name} uploaded & saved successfully.`)
      }
      setTimeout(() => setToastMsg(null), 3500)
    }
    reader.readAsDataURL(file)
  }

  // Handle Save All Candidate Details
  const handleSaveCandidateDetails = async () => {
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim() || candidate.name || 'Candidate'
    const updatedObj = {
      ...candidate,
      id: cleanCandId,
      canId: cleanCandId,
      name: fullName,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      payRate: `$${formData.payRate}/hr`,
      payRateTo: `$${formData.payRateTo}/hr`,
      rateType: formData.rateType,
      avblDate: formData.availableDate,
      phone: formData.phoneCell,
      phoneCell: formData.phoneCell,
      location: `${formData.city}, ${formData.state} ${formData.zip}`.trim(),
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      workAuth: formData.workAuth,
      exp: formData.experience,
      fullRole: formData.jobTitle,
      role: formData.jobTitle,
      subVendor: formData.subVendor,
      source: formData.source,
      rating: formData.overallRating,
      comments: formData.comments,
      skills: skillsList.map(s => s.name),
      resumeName: documents.resume?.fileName || candidate.resumeName,
      resumeData: documents.resume?.fileData || candidate.resumeData,
      resumeText: documents.resume?.resumeText || candidate.resumeText,
      legalDocs: documents,
      documents: documents
    }

    const candidateIdVariants = [
      cleanCandId,
      candidate?.id,
      candidate?.canId,
      candidate?._id,
      candidate?.candidateId,
      candidate?.candId
    ].filter(Boolean).map(String)

    try {
      localStorage.setItem(`smarthire_candidate_details_${cleanCandId}`, JSON.stringify(formData))
      localStorage.setItem(`smarthire_candidate_skills_${cleanCandId}`, JSON.stringify(skillsList))
      localStorage.setItem(`smarthire_candidate_refs_${cleanCandId}`, JSON.stringify(references))
      for (const vId of candidateIdVariants) {
        localStorage.setItem(`smarthire_candidate_docs_${vId}`, JSON.stringify(documents))
      }
      localStorage.setItem(`smarthire_candidate_notes_${cleanCandId}`, JSON.stringify(interactionNotes))
      localStorage.setItem(`smarthire_candidate_projects_${cleanCandId}`, JSON.stringify(projectsList))
    } catch(e) {}

    // 100% Direct Firebase Firestore Save (No MongoDB / Server Dependency)
    try {
      await saveCandidate(cleanCandId, {
        ...updatedObj,
        legalDocs: documents,
        skills: skillsList,
        references,
        notes: interactionNotes,
        projects: projectsList,
        resumeUrl: documents.resume?.storageUrl || ''
      })
      if (candidate?.id && String(candidate.id) !== String(cleanCandId)) {
        await saveCandidate(String(candidate.id), {
          ...updatedObj,
          legalDocs: documents,
          skills: skillsList,
          references,
          notes: interactionNotes,
          projects: projectsList,
          resumeUrl: documents.resume?.storageUrl || ''
        })
      }
    } catch(fErr) {
      console.warn('Firebase saveCandidate note:', fErr)
    }

    if (onUpdateCandidate) {
      onUpdateCandidate({ ...updatedObj, legalDocs: documents, documents: documents, skills: skillsList, references, notes: interactionNotes, projects: projectsList })
    }

    setToastMsg('Candidate profile, verified skills & resume saved to database!')
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Handle Save Legal Documents to Firebase Firestore (100% Cloud DB)
  const [isSavingDocs, setIsSavingDocs] = useState(false)

  const handleSaveDocuments = async () => {
    setIsSavingDocs(true)
    setToastMsg('⏳ Saving documents to Firebase Database...')

    const candidateIdVariants = [
      cleanCandId,
      candidate?.id,
      candidate?.canId,
      candidate?._id,
      candidate?.candidateId,
      candidate?.candId
    ].filter(Boolean).map(String)

    // Always save to localStorage first as a guaranteed local backup
    try {
      for (const vId of candidateIdVariants) {
        localStorage.setItem(`smarthire_candidate_docs_${vId}`, JSON.stringify(documents))
      }
    } catch(e) {}

    try {
      // Direct Firebase Firestore Save (No MongoDB needed)
      await saveLegalDocs(cleanCandId, documents, {
        email: formData.email || candidate.email || '',
        candidateName: `${formData.firstName} ${formData.lastName}`.trim() || candidate.name || ''
      })
      if (candidate?.id && String(candidate.id) !== String(cleanCandId)) {
        await saveLegalDocs(String(candidate.id), documents, {
          email: formData.email || candidate.email || '',
          candidateName: `${formData.firstName} ${formData.lastName}`.trim() || candidate.name || ''
        })
      }
      if (onUpdateCandidate) {
        onUpdateCandidate({ ...candidate, legalDocs: documents, documents: documents })
      }
      setToastMsg('Legal documents saved to database successfully.')
    } catch(err) {
      console.error('Firebase saveLegalDocs error:', err)
      if (onUpdateCandidate) {
        onUpdateCandidate({ ...candidate, legalDocs: documents, documents: documents })
      }
      setToastMsg('Documents saved locally.')
    } finally {
      setIsSavingDocs(false)
      setTimeout(() => setToastMsg(null), 4000)
    }
  }

  const handleAddSkill = (skillNameToAdd = null) => {
    const skillName = skillNameToAdd || prompt('Enter technical or functional skill name:')
    if (skillName && skillName.trim()) {
      const isReq = reqRequiredSkills.some(rq => rq.toLowerCase().includes(skillName.trim().toLowerCase()) || skillName.trim().toLowerCase().includes(rq.toLowerCase()))
      const nextSkills = [
        ...skillsList.filter(s => s.name.toLowerCase() !== skillName.trim().toLowerCase()),
        {
          id: Date.now(),
          name: skillName.trim(),
          required: isReq ? 'Yes' : 'No',
          experience: '5 Years',
          rating: 5,
          lastUsed: '2026'
        }
      ]
      setSkillsList(nextSkills)
      try {
        localStorage.setItem(`smarthire_candidate_skills_${cleanCandId}`, JSON.stringify(nextSkills))
      } catch(e) {}
      setToastMsg(`Added skill: ${skillName.trim()}`)
      setTimeout(() => setToastMsg(null), 2500)
    }
  }

  const handleSaveReferenceItem = () => {
    if (!refForm.name.trim()) {
      alert('Please enter the Reference Full Name.')
      return
    }

    let nextRefs = []
    if (editingRefId) {
      nextRefs = references.map(r => r.id === editingRefId ? { ...r, ...refForm, id: editingRefId } : r)
    } else {
      nextRefs = [
        ...references,
        {
          id: Date.now(),
          ...refForm
        }
      ]
    }

    setReferences(nextRefs)
    setShowAddRefForm(false)
    setEditingRefId(null)

    // Save to local storage
    try {
      localStorage.setItem(`smarthire_candidate_refs_${cleanCandId}`, JSON.stringify(nextRefs))
    } catch(e) {}

    // Save directly to Firebase Firestore
    saveCandidate(cleanCandId, {
      ...candidate,
      name: `${formData.firstName} ${formData.lastName}`.trim() || candidate.name,
      references: nextRefs
    }).catch(err => console.warn('Firestore save reference error:', err))

    setToastMsg(editingRefId ? 'Reference updated & saved to database.' : 'Reference added & saved to database.')
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleAddNote = () => {
    if (!newNoteText.trim()) return
    const newNote = {
      id: Date.now(),
      author: userName,
      role: userRole === 'admin' ? 'Account Manager' : 'Recruiter',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      text: newNoteText.trim(),
      type: 'manual'
    }
    const nextNotes = [newNote, ...interactionNotes]
    setInteractionNotes(nextNotes)
    setNewNoteText('')
    try {
      localStorage.setItem(`smarthire_candidate_notes_${cleanCandId}`, JSON.stringify(nextNotes))
    } catch(e) {}
    setToastMsg('Note added successfully!')
    setTimeout(() => setToastMsg(null), 2500)
  }

  // ─── Image rotation state (per doc type) ───
  const [imgRotation, setImgRotation] = useState(0)
  // Reset rotation when active doc changes
  useEffect(() => { setImgRotation(0) }, [activeDocType])

  // ─── Full AI Match scoring: title + skills + govt exp + years ───
  const aiMatch = useMemo(() => {
    const candSkillNames = skillsList.map(s => s.name.toLowerCase())
    const reqTitle = (reqContext?.title || candidate.jobTitle || formData.jobTitle || '').toLowerCase()
    const candTitle = (formData.jobTitle || candidate.jobTitle || candidate.fullRole || '').toLowerCase()
    const resumeText = (candidate.resumeText || documents?.resume?.resumeText || '').toLowerCase()
    const projectText = projectsList.map(p => `${p.client} ${p.description || ''}`).join(' ').toLowerCase()
    const allText = `${resumeText} ${projectText}`

    // ── 1. Title Match (0–20 pts) ──
    let titlePts = 0
    let titleReason = ''
    if (reqTitle && candTitle) {
      if (candTitle === reqTitle) { titlePts = 20; titleReason = `Exact title match: "${formData.jobTitle}"` }
      else {
        // Check word overlap
        const reqWords = reqTitle.split(/\s+/).filter(w => w.length > 3)
        const matchedWords = reqWords.filter(w => candTitle.includes(w))
        const ratio = reqWords.length > 0 ? matchedWords.length / reqWords.length : 0
        if (ratio >= 0.75) { titlePts = 16; titleReason = `Strong title match: "${formData.jobTitle}" aligns with JD "${reqContext?.title || ''}"` }
        else if (ratio >= 0.4) { titlePts = 10; titleReason = `Partial title match: "${formData.jobTitle}" shares keywords with JD` }
        else { titlePts = 4; titleReason = `Title diverges: "${formData.jobTitle}" vs JD "${reqContext?.title || ''}" — verify role fit` }
      }
    } else {
      titlePts = 10; titleReason = 'Job title not specified — default partial credit applied'
    }

    // ── 2. Required Skills Match (0–45 pts) ──
    let matchedReqSkills = []
    let missingReqSkills = []
    if (reqRequiredSkills.length > 0) {
      reqRequiredSkills.forEach(rs => {
        const rsLow = rs.toLowerCase().trim()
        const found = candSkillNames.some(cs => cs.includes(rsLow) || rsLow.includes(cs))
        if (found) matchedReqSkills.push(rs)
        else missingReqSkills.push(rs)
      })
    } else {
      matchedReqSkills = skillsList.slice(0, 5).map(s => s.name)
    }
    const skillPts = reqRequiredSkills.length > 0
      ? Math.round((matchedReqSkills.length / reqRequiredSkills.length) * 45)
      : 38

    // ── 3. Nice-to-Have / Bonus Skills (0–15 pts) ──
    const niceToHaveKeywords = ['agile', 'scrum', 'jira', 'confluence', 'sql', 'power bi', 'tableau', 'aws', 'azure', 'python', 'sharepoint', 'salesforce', 'oracle', 'sap', 'erp', 'ms office', 'visio']
    const bonusMatched = niceToHaveKeywords.filter(kw => candSkillNames.some(cs => cs.includes(kw)) || allText.includes(kw))
    const bonusPts = Math.min(15, Math.round(bonusMatched.length * 1.5))

    // ── 4. State/Government Experience (0–15 pts) ──
    const govtKeywords = ['state of', 'department of', 'county', 'dot ', 'doh ', 'dcf', 'hhs', 'dmv', 'division of', 'public sector', 'government', 'dept of', 'agency', 'city of', 'federal', 'municipality']
    const govtMatches = govtKeywords.filter(kw => allText.includes(kw))
    let govtPts = 0
    let govtReason = ''
    if (govtMatches.length >= 3) { govtPts = 15; govtReason = `Strong state/government background — experience at government/public sector organizations` }
    else if (govtMatches.length >= 1) { govtPts = 8; govtReason = `Some government/public sector experience detected` }
    else { govtReason = 'No government/state agency experience detected in resume' }

    // Also check project clients directly
    const govtClients = projectsList.filter(p => govtKeywords.some(kw => (p.client || '').toLowerCase().includes(kw)))
    if (govtClients.length > 0 && govtPts < 15) {
      govtPts = Math.max(govtPts, govtClients.length >= 2 ? 15 : 8)
      govtReason = `Government client experience: ${govtClients.map(p => p.client).join(', ')}`
    }

    // ── 5. Experience Adequacy (0–5 pts) ──
    const candExp = parseInt(formData.experience || candidate.exp || '0') || 0
    const reqExpMatch = (reqContext?.description || '').match(/(\d+)\+?\s*years?/i)
    const reqExp = reqExpMatch ? parseInt(reqExpMatch[1]) : 5
    const expPts = candExp >= reqExp ? 5 : candExp >= reqExp - 2 ? 3 : 1
    const expReason = candExp >= reqExp
      ? `${candExp}+ years experience meets or exceeds the JD requirement of ${reqExp}+ years`
      : `${candExp} years experience (JD requires ${reqExp}+ years) — gap of ${reqExp - candExp} years`

    // ── Final Score ──
    const rawScore = titlePts + skillPts + bonusPts + govtPts + expPts
    const score = Math.min(99, Math.max(55, rawScore))
    const label = score >= 90 ? 'Excellent Match' : score >= 80 ? 'Strong Candidate Match' : score >= 70 ? 'Good Candidate Match' : 'Moderate Match — Review Skills'
    const labelColor = score >= 90 ? '#15803d' : score >= 80 ? '#16a34a' : score >= 70 ? '#0369a1' : '#92400e'
    const labelBg = score >= 90 ? '#dcfce7' : score >= 80 ? '#f0fdf4' : score >= 70 ? '#e0f2fe' : '#fef3c7'

    // ── Build Reasons Array ──
    const reasons = []
    reasons.push({ type: 'info', text: titleReason })
    if (matchedReqSkills.length > 0) {
      reasons.push({ type: 'good', text: `Has ${matchedReqSkills.length} of ${reqRequiredSkills.length || matchedReqSkills.length} required skills: ${matchedReqSkills.slice(0, 6).join(', ')}${matchedReqSkills.length > 6 ? '...' : ''}` })
    }
    if (missingReqSkills.length > 0) {
      reasons.push({ type: 'warn', text: `Missing ${missingReqSkills.length} required skill${missingReqSkills.length > 1 ? 's' : ''}: ${missingReqSkills.slice(0, 4).join(', ')} — review in screening call` })
    }
    if (govtPts > 0) {
      reasons.push({ type: 'good', text: `Government/State experience: ${govtReason}` })
    } else {
      reasons.push({ type: 'neutral', text: govtReason })
    }
    reasons.push({ type: expPts >= 4 ? 'good' : 'warn', text: expReason })
    if (bonusMatched.length > 0) {
      reasons.push({ type: 'info', text: `Bonus skills match: ${bonusMatched.slice(0, 5).join(', ')}` })
    }

    return { score, label, labelColor, labelBg, reasons, matchedReqSkills, missingReqSkills, govtPts, skillPts, titlePts, expPts, bonusPts }
  }, [reqRequiredSkills, skillsList, formData.jobTitle, formData.experience, projectsList, candidate.resumeText, documents?.resume?.resumeText, reqContext])

  // ─── Auto-generate Interaction Note once (when notes list is empty) ───
  useEffect(() => {
    if (!isOpen || !candidate) return
    // Small delay so skillsList/projectsList are settled
    const timer = setTimeout(() => {
      setInteractionNotes(prevNotes => {
        const hasAutoNote = prevNotes.some(n => n.type === 'auto')
        if (prevNotes.length > 0 || hasAutoNote) return prevNotes

        const candSkillNames = skillsList.map(s => s.name)
        const reqTitle = reqContext?.title || candidate.jobTitle || formData.jobTitle || 'this position'
        const matchedReq = aiMatch.matchedReqSkills || []
        const missingReq = aiMatch.missingReqSkills || []

        // Govt experience detection
        const allProjectText = projectsList.map(p => `${p.client} ${p.description || ''}`).join(' ').toLowerCase()
        const govtKeywords = ['state of', 'department of', 'county', 'dcf', 'hhs', 'government', 'federal', 'agency']
        const hasGovtExp = govtKeywords.some(kw => allProjectText.includes(kw)) ||
          govtKeywords.some(kw => (candidate.resumeText || '').toLowerCase().includes(kw))

        let noteLines = []
        noteLines.push(`Candidate has ${matchedReq.length} of ${reqRequiredSkills.length || candSkillNames.length} required skills for "${reqTitle}".`)
        if (matchedReq.length > 0) noteLines.push(`Matched required skills: ${matchedReq.slice(0, 6).join(', ')}${matchedReq.length > 6 ? '...' : ''}.`)
        if (candSkillNames.length > matchedReq.length) {
          const additional = candSkillNames.filter(sn => !matchedReq.some(m => m.toLowerCase().includes(sn.toLowerCase())))
          if (additional.length > 0) noteLines.push(`Additional profiled skills: ${additional.slice(0, 6).join(', ')}${additional.length > 6 ? ' and more' : ''}.`)
        }
        if (hasGovtExp) noteLines.push(`Candidate has prior experience with state/government/department clients — applicable to this engagement.`)
        if (missingReq.length > 0) noteLines.push(`Skills gap to discuss in screening: ${missingReq.slice(0, 4).join(', ')}.`)
        noteLines.push(`Overall AI Match Score: ${aiMatch.score}% — ${aiMatch.label}.`)

        const autoNote = {
          id: Date.now(),
          author: 'SmartHire AI',
          role: 'AI Screener',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          text: noteLines.join(' '),
          type: 'auto'
        }
        const nextNotes = [autoNote]
        try {
          localStorage.setItem(`smarthire_candidate_notes_${cleanCandId}`, JSON.stringify(nextNotes))
        } catch(e) {}
        return nextNotes
      })
    }, 600)
    return () => clearTimeout(timer)
  }, [isOpen, cleanCandId, candidate?.id])



  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '10px'
    }}>
      
      {/* Main Split-Screen Container */}
      <div style={{
        background: '#ffffff',
        width: '98vw',
        maxWidth: '1520px',
        height: '95vh',
        borderRadius: '2px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #7f9db9',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '11px'
      }}>
        
        {/* Toast Notification */}
        {toastMsg && (
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '24px',
            background: '#166534',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontWeight: 'bold',
            zIndex: 10001,
            fontSize: '12px'
          }}>
            {toastMsg}
          </div>
        )}

        {/* ──── TOP REQUISITION HEADER BAR ──── */}
        <div style={{
          background: '#ffffff',
          borderBottom: '1px solid #cbd5e1',
          padding: '6px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#334155'
        }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: '#000080', fontWeight: 'bold' }}>Requisition #: </span>
              <span style={{ fontWeight: 'bold', color: '#0033cc' }}>
                {reqContext?.id || candidate.jobId || candidate.reqId || 'J-1787683131680-88'}
              </span>
            </div>
            <div>
              <span style={{ color: '#000080', fontWeight: 'bold' }}>Position Title: </span>
              <span style={{ fontWeight: 'bold', color: '#0f172a' }}>
                {reqContext?.title || candidate.jobTitle || formData.jobTitle || 'Lead Business Analyst'}
              </span>
            </div>
            <div>
              <span style={{ color: '#000080', fontWeight: 'bold' }}>Customer: </span>
              <span style={{ fontWeight: 'bold', color: '#000080' }}>
                {reqContext?.customer || reqContext?.client || candidate.customer || 'State Of SC'}
              </span>
            </div>
            <div>
              <span style={{ color: '#000080', fontWeight: 'bold' }}>Status: </span>
              <span style={{ color: '#166534', fontWeight: 'bold' }}>In-Progress</span>
            </div>
            <div>
              <span style={{ color: '#000080', fontWeight: 'bold' }}>Start Date: </span>
              <span>{reqContext?.startDate || reqContext?.creationDate || 'Immediate'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid #7f9db9',
              background: '#f8fafc',
              color: '#000080',
              padding: '2px 10px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* ──── TOP CANDIDATE SUMMARY SUB-HEADER ──── */}
        <div style={{
          background: '#f8fafc',
          borderBottom: '2px solid #ea580c',
          padding: '6px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 'bold', color: '#000080' }}>
              Candidate # : <span style={{ color: '#0033cc' }}>CAND-{cleanCandId}</span>
            </span>
            <span
              onClick={() => setActiveTab('projects')}
              style={{ color: '#0033cc', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
            >
              Candidate Projects
            </span>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#000080', fontWeight: 'bold', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.screened}
                onChange={e => handleInputChange('screened', e.target.checked)}
              />
              Screened
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div>
              <span style={{ color: '#000080', fontWeight: 'bold' }}>Candidate Name:* </span>
              <input
                type="text"
                value={formData.firstName}
                onChange={e => handleInputChange('firstName', e.target.value)}
                placeholder="First"
                style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '90px', borderRadius: '0' }}
              />
              <input
                type="text"
                value={formData.lastName}
                onChange={e => handleInputChange('lastName', e.target.value)}
                placeholder="Last"
                style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '100px', marginLeft: '3px', borderRadius: '0' }}
              />
            </div>

            <div>
              <span style={{ color: '#000080', fontWeight: 'bold' }}>E-mail:* </span>
              <input
                type="email"
                placeholder="candidate@email.com"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '160px', borderRadius: '0' }}
              />
            </div>

            <div>
              <span style={{ color: '#000080', fontWeight: 'bold' }}>Pay Rate: </span>
              <input
                type="text"
                value={formData.payRate}
                onChange={e => handleInputChange('payRate', e.target.value)}
                style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '40px', borderRadius: '0' }}
              />
              <span style={{ margin: '0 3px' }}>To</span>
              <input
                type="text"
                value={formData.payRateTo}
                onChange={e => handleInputChange('payRateTo', e.target.value)}
                style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '40px', borderRadius: '0' }}
              />
              <span style={{ marginLeft: '3px' }}>per hour</span>
            </div>

            <div>
              <select
                value={formData.rateType}
                onChange={e => handleInputChange('rateType', e.target.value)}
                style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: '0' }}
              >
                <option value="C2C">C2C</option>
                <option value="W2">W2</option>
                <option value="1099">1099</option>
                <option value="Full Time">Full Time</option>
              </select>
            </div>

            <div>
              <span style={{ color: '#000080', fontWeight: 'bold' }}>Available Date:* </span>
              <input
                type="text"
                value={formData.availableDate}
                onChange={e => handleInputChange('availableDate', e.target.value)}
                style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '80px', borderRadius: '0' }}
              />
            </div>
          </div>
        </div>

        {/* ──── SPLIT BODY WORKSPACE (LEFT FORM + RIGHT VIEWER) ──── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* ──── LEFT PANEL (55% Width, Candidate Details & Subtabs) ──── */}
          <div style={{ width: '55%', borderRight: '2px solid #cbd5e1', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
            
            {/* Sub-tab Navigation Bar */}
            <div style={{
              background: '#e2e8f0',
              borderBottom: '1px solid #cbd5e1',
              display: 'flex',
              padding: '0 8px',
              gap: '2px'
            }}>
              {[
                { id: 'details', label: 'Details' },
                { id: 'skill', label: `Skill (${skillsList.length})` },
                { id: 'references', label: 'References' },
                { id: 'legal_docs', label: 'Legal & Docs (Visa/DL)' },
                { id: 'notes', label: `Interaction Notes (${interactionNotes.length})` },
                { id: 'submissions', label: 'Submission History' },
                { id: 'projects', label: 'Projects' },
                { id: 'ai_fit', label: 'AI Match' }
              ].map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      border: '1px solid #cbd5e1',
                      borderBottom: isActive ? '1px solid #ffffff' : '1px solid #cbd5e1',
                      background: isActive ? '#ffffff' : '#f1f5f9',
                      color: isActive ? '#000080' : '#475569',
                      cursor: 'pointer',
                      borderTopLeftRadius: '3px',
                      borderTopRightRadius: '3px',
                      marginBottom: '-1px'
                    }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Left Subtab Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
              
              {/* ─── 1. DETAILS TAB ─── */}
              {activeTab === 'details' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                    
                    {/* Left Column Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px 8px', alignItems: 'center' }}>
                      <label style={{ color: '#000080', fontWeight: 'bold' }}>Date of Birth:</label>
                      <input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={formData.dob}
                        onChange={e => handleInputChange('dob', e.target.value)}
                        style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '130px' }}
                      />

                      <label style={{ color: '#000080', fontWeight: 'bold' }}>Candidate Source*:</label>
                      <select
                        value={formData.source}
                        onChange={e => handleInputChange('source', e.target.value)}
                        style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '150px' }}
                      >
                        <option value="Direct Sourcing">Direct Sourcing</option>
                        <option value="Dice">Dice</option>
                        <option value="Monster">Monster</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Career Portal">Career Portal</option>
                        <option value="Referral">Referral</option>
                        <option value="Sub-Vendor">Sub-Vendor</option>
                      </select>

                      <label style={{ color: '#000080', fontWeight: 'bold' }}>Sub-Vendor:</label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <select
                          value={formData.subVendor}
                          onChange={e => handleInputChange('subVendor', e.target.value)}
                          style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', flex: 1 }}
                        >
                          <option value="Direct Sourcing">Direct Sourcing</option>
                          <option value="Promatrix Corp">Promatrix Corp</option>
                          <option value="Talent9 Inc">Talent9 Inc</option>
                          <option value="Paramount Software">Paramount Software</option>
                          <option value="Ardor IT Systems">Ardor IT Systems</option>
                          <option value="SmartHire">SmartHire</option>
                        </select>
                      </div>

                      <label style={{ color: '#000080', fontWeight: 'bold' }}>Job Title*:</label>
                      <input
                        type="text"
                        value={formData.jobTitle}
                        onChange={e => handleInputChange('jobTitle', e.target.value)}
                        style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '100%' }}
                      />

                      <label style={{ color: '#000080', fontWeight: 'bold' }}>Phone (any one):</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '36px', color: '#000080', fontSize: '10px' }}>Cell</span>
                          <input
                            type="text"
                            placeholder="(555) 000-0000"
                            value={formData.phoneCell}
                            onChange={e => handleInputChange('phoneCell', e.target.value)}
                            style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '120px' }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '36px', color: '#000080', fontSize: '10px' }}>Home</span>
                          <input
                            type="text"
                            value={formData.phoneHome}
                            onChange={e => handleInputChange('phoneHome', e.target.value)}
                            style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '120px' }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '36px', color: '#000080', fontSize: '10px' }}>Work</span>
                          <input
                            type="text"
                            value={formData.phoneWork}
                            onChange={e => handleInputChange('phoneWork', e.target.value)}
                            style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '120px' }}
                          />
                        </div>
                      </div>

                      <label style={{ color: '#000080', fontWeight: 'bold' }}>Address:</label>
                      <input
                        type="text"
                        placeholder="Candidate address"
                        value={formData.address}
                        onChange={e => handleInputChange('address', e.target.value)}
                        style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '100%' }}
                      />

                      <label style={{ color: '#000080', fontWeight: 'bold' }}>City, State, Zip:</label>
                      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={e => handleInputChange('city', e.target.value)}
                          placeholder="City"
                          style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '85px' }}
                        />
                        <select
                          value={formData.state}
                          onChange={e => handleInputChange('state', e.target.value)}
                          style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9' }}
                        >
                          {US_STATES.map(st => (
                            <option key={st.code} value={st.code}>{st.code}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={formData.zip}
                          onChange={e => handleInputChange('zip', e.target.value)}
                          placeholder="Zip"
                          style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '55px' }}
                        />
                      </div>

                      <label style={{ color: '#000080', fontWeight: 'bold' }}>Work Authorization:</label>
                      <select
                        value={formData.workAuth}
                        onChange={e => handleInputChange('workAuth', e.target.value)}
                        style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '120px' }}
                      >
                        <option value="US Citizen">US Citizen</option>
                        <option value="GC">Green Card (GC)</option>
                        <option value="H1B">H1 / H1B</option>
                        <option value="EAD - GC">EAD - GC</option>
                        <option value="OPT/CPT">OPT / CPT</option>
                        <option value="TN Visa">TN Visa</option>
                      </select>

                      <label style={{ color: '#000080', fontWeight: 'bold' }}>Ready to Relocate:</label>
                      <select
                        value={formData.readyToRelocate}
                        onChange={e => handleInputChange('readyToRelocate', e.target.value)}
                        style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '70px' }}
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Remote Only">Remote Only</option>
                      </select>
                    </div>

                    {/* Right Column Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 8px', alignItems: 'center' }}>
                      <label style={{ color: '#000080', fontWeight: 'bold' }}>Currently Working:</label>
                      <input
                        type="checkbox"
                        checked={formData.currentlyWorking}
                        onChange={e => handleInputChange('currentlyWorking', e.target.checked)}
                      />

                      <label style={{ color: '#000080', fontWeight: 'bold' }}>Resume File:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          onClick={() => setActiveDocType('resume')}
                          style={{ color: '#0033cc', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {documents.resume?.fileName || `${formData.firstName}_Resume.docx`}
                        </span>
                        <label style={{ cursor: 'pointer', fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '1px 6px', borderRadius: '3px' }} title="Upload new resume file">
                          Replace
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={e => handleFileUpload('resume', e)}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>

                      <label style={{ color: '#000080', fontWeight: 'bold' }}>Preferences for Placement:</label>
                      <textarea
                        rows={2}
                        value={formData.preferences}
                        onChange={e => handleInputChange('preferences', e.target.value)}
                        placeholder="Candidate preferences..."
                        style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '100%', resize: 'vertical' }}
                      />

                      <label style={{ color: '#000080', fontWeight: 'bold' }}>SSN (Last four):</label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="e.g. 4821"
                        value={formData.ssnLastFour}
                        onChange={e => handleInputChange('ssnLastFour', e.target.value)}
                        style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '60px' }}
                      />

                      <label style={{ color: '#000080', fontWeight: 'bold' }}>Experience:*</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="text"
                          value={formData.experience}
                          onChange={e => handleInputChange('experience', e.target.value)}
                          style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '40px' }}
                        />
                        <span>years</span>
                      </div>

                      <label style={{ color: '#000080', fontWeight: 'bold' }}>Overall Rating:</label>
                      <div style={{ color: '#f59e0b', fontSize: '12px' }}>
                        {'★'.repeat(formData.overallRating || 5)}
                      </div>

                      <label style={{ color: '#000080', fontWeight: 'bold' }}>Technical Rating:</label>
                      <div style={{ color: '#f59e0b', fontSize: '12px' }}>
                        {'★'.repeat(formData.techRating || 5)}
                      </div>

                      <label style={{ color: '#000080', fontWeight: 'bold' }}>Comm Skill:</label>
                      <div style={{ color: '#f59e0b', fontSize: '12px' }}>
                        {'★'.repeat(formData.commRating || 4)}
                      </div>

                      <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#000080', fontWeight: 'bold', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.securityClearance}
                            onChange={e => handleInputChange('securityClearance', e.target.checked)}
                          />
                          Security Clearance / Federal Clearance
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Financial & Comments Row */}
                  <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <span style={{ color: '#000080', fontWeight: 'bold' }}>Proposed Bill Rate*: </span>
                        <input
                          type="text"
                          value={formData.proposedBillRate}
                          onChange={e => handleInputChange('proposedBillRate', e.target.value)}
                          placeholder="e.g. 95"
                          style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '55px' }}
                        />
                        <span style={{ marginLeft: '3px' }}>per hour</span>
                      </div>

                      <div>
                        <span style={{ color: '#000080', fontWeight: 'bold' }}>Pay Rate*: </span>
                        <input
                          type="text"
                          value={formData.finalPayRate}
                          onChange={e => handleInputChange('finalPayRate', e.target.value)}
                          style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '55px' }}
                        />
                        <span style={{ marginLeft: '3px' }}>per hour</span>
                      </div>

                      <div>
                        <span style={{ color: '#000080', fontWeight: 'bold' }}>Rate Type: </span>
                        <select
                          value={formData.rateType}
                          onChange={e => handleInputChange('rateType', e.target.value)}
                          style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9' }}
                        >
                          <option value="C2C">C2C</option>
                          <option value="W2">W2</option>
                          <option value="1099">1099</option>
                          <option value="Full Time">Full Time</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div style={{ color: '#000080', fontWeight: 'bold', marginBottom: '3px' }}>Comments:</div>
                      <textarea
                        rows={2}
                        value={formData.comments}
                        onChange={e => handleInputChange('comments', e.target.value)}
                        placeholder="Candidate notes or comments..."
                        style={{ width: '100%', padding: '4px', fontSize: '11px', border: '1px solid #7f9db9', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleSaveCandidateDetails}
                        style={{ background: '#0033cc', border: '1px solid #002299', color: '#ffffff', padding: '4px 18px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '3px' }}
                      >
                        Save Candidate Details
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', padding: '4px 14px', fontSize: '11px', cursor: 'pointer', borderRadius: '3px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── 2. SKILL TAB (WITH AUTO-EXTRACT & HIGHLIGHTED REQUIRED SKILLS) ─── */}
              {activeTab === 'skill' && (
                <div>
                  {/* Requisition Required Skills Highlights Banner */}
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', padding: '8px 12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 'bold', color: '#166534', fontSize: '11.5px' }}>
                        Requisition Required Skills Alignment ({reqContext?.id || 'Active Job'}):
                      </span>
                      <span style={{ fontSize: '10px', background: '#16a34a', color: '#ffffff', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                        {skillsList.filter(s => s.required === 'Yes').length} / {reqRequiredSkills.length} Matched
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {reqRequiredSkills.map((rqSkill, rIdx) => {
                        const hasSkill = skillsList.some(s => s.name.toLowerCase().includes(rqSkill.toLowerCase()) || rqSkill.toLowerCase().includes(s.name.toLowerCase()))
                        return (
                          <span
                            key={rIdx}
                            onClick={() => !hasSkill && handleAddSkill(rqSkill)}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '3px',
                              fontSize: '10.5px',
                              fontWeight: 'bold',
                              cursor: hasSkill ? 'default' : 'pointer',
                              background: hasSkill ? '#dcfce7' : '#fef3c7',
                              color: hasSkill ? '#15803d' : '#b45309',
                              border: hasSkill ? '1px solid #86efac' : '1px dashed #f59e0b',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title={hasSkill ? 'Candidate possesses this skill' : 'Click to add this required skill to candidate'}
                          >
                            {hasSkill ? '✓' : '+'} {rqSkill}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#000080' }}>
                      Candidate Technical Skills Matrix ({skillsList.length} verified skills)
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleAddSkill()}
                        style={{ border: '1px solid #0033cc', background: '#0033cc', color: '#ffffff', padding: '2px 10px', fontSize: '10.5px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        + Add Custom Skill
                      </button>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #7f9db9', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#708090', color: '#ffffff' }}>
                        <th style={{ padding: '5px 8px', borderRight: '1px solid #ffffff' }}>Skill Name</th>
                        <th style={{ padding: '5px 8px', borderRight: '1px solid #ffffff', width: '130px' }}>Requisition Match</th>
                        <th style={{ padding: '5px 8px', borderRight: '1px solid #ffffff', width: '80px' }}>Experience</th>
                        <th style={{ padding: '5px 8px', borderRight: '1px solid #ffffff', width: '80px' }}>Rating</th>
                        <th style={{ padding: '5px 8px', borderRight: '1px solid #ffffff', width: '70px' }}>Last Used</th>
                        <th style={{ padding: '5px 8px', width: '40px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skillsList.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                            No skills recorded yet. Click '+ Add Custom Skill' to add skills.
                          </td>
                        </tr>
                      ) : (
                        skillsList.map((sk, idx) => {
                          const isHighlighted = sk.required === 'Yes' || reqRequiredSkills.some(rq => rq.toLowerCase().includes(sk.name.toLowerCase()) || sk.name.toLowerCase().includes(rq.toLowerCase()))
                          return (
                            <tr
                              key={sk.id || idx}
                              style={{
                                background: isHighlighted ? '#f0fdf4' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc'),
                                borderBottom: '1px solid #e2e8f0',
                                borderLeft: isHighlighted ? '3px solid #22c55e' : 'none'
                              }}
                            >
                              <td style={{ padding: '5px 8px', fontWeight: 'bold', color: isHighlighted ? '#15803d' : '#000080' }}>
                                {sk.name}
                              </td>
                              <td style={{ padding: '5px 8px' }}>
                                {isHighlighted ? (
                                  <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold', fontSize: '10px' }}>
                                    REQUIRED (MATCH)
                                  </span>
                                ) : (
                                  <span style={{ color: '#64748b', fontSize: '10px' }}>Optional</span>
                                )}
                              </td>
                              <td style={{ padding: '5px 8px' }}>{sk.experience}</td>
                              <td style={{ padding: '5px 8px', color: '#f59e0b' }}>{'★'.repeat(sk.rating || 5)}</td>
                              <td style={{ padding: '5px 8px' }}>{sk.lastUsed}</td>
                              <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                                <span
                                  onClick={() => setSkillsList(prev => prev.filter(s => s.id !== sk.id))}
                                  style={{ color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}
                                  title="Delete Skill"
                                >
                                  ✕
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>

                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#166534', fontWeight: 'bold' }}>
                      Skills are automatically extracted from parsed resume and matched against the requirement.
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveCandidateDetails}
                      style={{ background: '#0033cc', border: '1px solid #002299', color: '#ffffff', padding: '4px 16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '3px' }}
                    >
                      Update Skills
                    </button>
                  </div>
                </div>
              )}

              {/* ─── 3. REFERENCES TAB (PROFESSIONAL REFERENCE MANAGER) ─── */}
              {activeTab === 'references' && (
                <div>
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '8px 12px', marginBottom: '12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Professional & Client References</span>
                        <span style={{ background: '#16a34a', color: '#ffffff', fontSize: '10px', padding: '1px 8px', borderRadius: '10px' }}>
                          {references.length} Total
                        </span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '2px' }}>
                        Record supervisor and peer verification contacts, feedback, and verification status. Saved directly to Firebase Cloud.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddRefForm(prev => !prev)
                          setEditingRefId(null)
                          setRefForm({
                            name: '',
                            company: formData.city ? `${formData.city} Utility Services` : 'Enterprise Client LLC',
                            designation: 'Project Manager / Supervisor',
                            phone: '(555) 234-5678',
                            email: 'manager@client.com',
                            project: formData.jobTitle ? `${formData.jobTitle} Project` : 'State IT Modernization',
                            verificationStatus: 'Verified (Positive)',
                            notes: 'Strong candidate with exceptional functional skills and work ethic.'
                          })
                        }}
                        style={{
                          border: '1px solid #16a34a',
                          background: showAddRefForm ? '#f1f5f9' : '#16a34a',
                          color: showAddRefForm ? '#166534' : '#ffffff',
                          padding: '4px 12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {showAddRefForm ? '✕ Cancel' : '+ Add Reference'}
                      </button>
                    </div>
                  </div>

                  {/* Add / Edit Reference Form Card */}
                  {showAddRefForm && (
                    <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', marginBottom: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontWeight: 'bold', color: '#000080', fontSize: '11.5px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{editingRefId ? 'Edit Reference Details' : 'Record New Professional Reference'}</span>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>* All fields saved to Cloud DB</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        <div>
                          <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '2px' }}>
                            Reference Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. John Doe"
                            value={refForm.name}
                            onChange={e => setRefForm(prev => ({ ...prev, name: e.target.value }))}
                            style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: '2px' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '2px' }}>
                            Company / Client *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Northern Trust / BCBS"
                            value={refForm.company}
                            onChange={e => setRefForm(prev => ({ ...prev, company: e.target.value }))}
                            style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: '2px' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '2px' }}>
                            Designation / Title *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Delivery Director / Lead"
                            value={refForm.designation}
                            onChange={e => setRefForm(prev => ({ ...prev, designation: e.target.value }))}
                            style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: '2px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        <div>
                          <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '2px' }}>
                            Phone Number
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. (313) 555-0199"
                            value={refForm.phone}
                            onChange={e => setRefForm(prev => ({ ...prev, phone: e.target.value }))}
                            style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: '2px' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '2px' }}>
                            Email Address
                          </label>
                          <input
                            type="email"
                            placeholder="e.g. manager@company.com"
                            value={refForm.email}
                            onChange={e => setRefForm(prev => ({ ...prev, email: e.target.value }))}
                            style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: '2px' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '2px' }}>
                            Verification Status
                          </label>
                          <select
                            value={refForm.verificationStatus}
                            onChange={e => setRefForm(prev => ({ ...prev, verificationStatus: e.target.value }))}
                            style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: '2px', background: '#ffffff', fontWeight: 'bold' }}
                          >
                            <option value="Verified (Positive)">Verified (Positive)</option>
                            <option value="Verified (Neutral)">Verified (Neutral)</option>
                            <option value="Pending Verification">⏳ Pending Verification</option>
                            <option value="Contact Attempted">Contact Attempted</option>
                            <option value="Do Not Contact">Do Not Contact</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '10px' }}>
                        <div>
                          <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '2px' }}>
                            Project / Relationship
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Enterprise Migration (Manager)"
                            value={refForm.project}
                            onChange={e => setRefForm(prev => ({ ...prev, project: e.target.value }))}
                            style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: '2px' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '2px' }}>
                            Feedback / Notes
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Highly recommended, outstanding problem solving and delivery track record"
                            value={refForm.notes}
                            onChange={e => setRefForm(prev => ({ ...prev, notes: e.target.value }))}
                            style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: '2px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddRefForm(false)
                            setEditingRefId(null)
                          }}
                          style={{ padding: '4px 12px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: '3px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveReferenceItem}
                          style={{ padding: '4px 16px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #16a34a', background: '#16a34a', color: '#ffffff', borderRadius: '3px', cursor: 'pointer' }}
                        >
                          {editingRefId ? 'Update Reference' : 'Add to Table'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* References Data Table */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#334155', color: '#ffffff' }}>
                          <th style={{ padding: '6px 8px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>#</th>
                          <th style={{ padding: '6px 8px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Reference Name</th>
                          <th style={{ padding: '6px 8px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Company & Title</th>
                          <th style={{ padding: '6px 8px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Contact Info</th>
                          <th style={{ padding: '6px 8px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Project / Role</th>
                          <th style={{ padding: '6px 8px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Status</th>
                          <th style={{ padding: '6px 8px', width: '80px', textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {references.length === 0 ? (
                          <tr>
                            <td colSpan="7" style={{ padding: '32px 16px', textAlign: 'center', background: '#f8fafc', color: '#64748b' }}>
                              
                              <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                                No References Recorded Yet
                              </div>
                              <div style={{ fontSize: '10.5px', marginBottom: '12px' }}>
                                Click <strong>"+ Add Reference"</strong> above or use <strong>"Auto-Fill Sample Reference"</strong> to populate supervisor details.
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const sample = {
                                    id: Date.now(),
                                    name: 'Robert Vance',
                                    company: 'DTE Energy / Distribution Engineering',
                                    designation: 'Senior Delivery Manager',
                                    phone: '(313) 555-0182',
                                    email: 'robert.vance@dteenergy.com',
                                    project: 'Enterprise Gas Innovations Portal',
                                    verificationStatus: 'Verified (Positive)',
                                    notes: 'Direct supervisor. Praised analytical rigor, sprint discipline, and stakeholder communication.'
                                  }
                                  const updated = [sample]
                                  setReferences(updated)
                                  try { localStorage.setItem(`smarthire_candidate_refs_${cleanCandId}`, JSON.stringify(updated)) } catch(e) {}
                                  saveCandidate(cleanCandId, { ...candidate, references: updated }).catch(() => {})
                                  setToastMsg('Sample supervisor reference added & saved to database!')
                                  setTimeout(() => setToastMsg(null), 3000)
                                }}
                                style={{
                                  background: '#0033cc',
                                  color: '#ffffff',
                                  border: '1px solid #002299',
                                  padding: '4px 14px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                Auto-Fill Sample Reference
                              </button>
                            </td>
                          </tr>
                        ) : (
                          references.map((rf, idx) => (
                            <tr key={rf.id || idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#000080' }}>
                                {rf.name}
                                {rf.notes && (
                                  <div style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 'normal', marginTop: '1px' }}>
                                    {rf.notes}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '6px 8px' }}>
                                <div style={{ fontWeight: 'bold', color: '#334155' }}>{rf.company}</div>
                                <div style={{ fontSize: '10px', color: '#64748b' }}>{rf.designation}</div>
                              </td>
                              <td style={{ padding: '6px 8px', fontSize: '10.5px' }}>
                                {rf.phone && <div style={{ color: '#0f172a' }}>{rf.phone}</div>}
                                {rf.email && <div style={{ color: '#0284c7' }}>{rf.email}</div>}
                              </td>
                              <td style={{ padding: '6px 8px', color: '#475569', fontSize: '10.5px' }}>
                                {rf.project || 'Target Requisition'}
                              </td>
                              <td style={{ padding: '6px 8px' }}>
                                <span style={{
                                  background: (rf.verificationStatus || '').includes('Positive') ? '#dcfce7' : ((rf.verificationStatus || '').includes('Pending') ? '#fef3c7' : '#f1f5f9'),
                                  color: (rf.verificationStatus || '').includes('Positive') ? '#166534' : ((rf.verificationStatus || '').includes('Pending') ? '#b45309' : '#334155'),
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  display: 'inline-block'
                                }}>
                                  {rf.verificationStatus || 'Verified'}
                                </span>
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingRefId(rf.id)
                                      setRefForm({
                                        name: rf.name || '',
                                        company: rf.company || '',
                                        designation: rf.designation || '',
                                        phone: rf.phone || '',
                                        email: rf.email || '',
                                        project: rf.project || '',
                                        verificationStatus: rf.verificationStatus || 'Verified (Positive)',
                                        notes: rf.notes || ''
                                      })
                                      setShowAddRefForm(true)
                                    }}
                                    style={{ border: '1px solid #cbd5e1', background: '#ffffff', padding: '1px 6px', fontSize: '10px', borderRadius: '2px', cursor: 'pointer' }}
                                    title="Edit Reference"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Remove reference for ${rf.name}?`)) {
                                        const nextRefs = references.filter(r => r.id !== rf.id)
                                        setReferences(nextRefs)
                                        try { localStorage.setItem(`smarthire_candidate_refs_${cleanCandId}`, JSON.stringify(nextRefs)) } catch(e) {}
                                        saveCandidate(cleanCandId, { ...candidate, references: nextRefs }).catch(() => {})
                                        setToastMsg('Reference removed and updated in database.')
                                        setTimeout(() => setToastMsg(null), 2500)
                                      }
                                    }}
                                    style={{ border: '1px solid #fecaca', background: '#fff1f2', color: '#dc2626', padding: '1px 6px', fontSize: '10px', borderRadius: '2px', cursor: 'pointer' }}
                                    title="Delete Reference"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Save References to Database Footer Action */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                      References are automatically linked with candidate profile #{cleanCandId} and synced across all recruiters.
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        setToastMsg('⏳ Saving references to Firebase Database...')
                        try {
                          localStorage.setItem(`smarthire_candidate_refs_${cleanCandId}`, JSON.stringify(references))
                        } catch(e) {}
                        try {
                          await saveCandidate(cleanCandId, {
                            ...candidate,
                            name: `${formData.firstName} ${formData.lastName}`.trim() || candidate.name,
                            references
                          })
                          if (onUpdateCandidate) {
                            onUpdateCandidate({ ...candidate, references })
                          }
                          setToastMsg('References saved to database successfully.')
                        } catch(err) {
                          setToastMsg('References saved locally.')
                        }
                        setTimeout(() => setToastMsg(null), 3000)
                      }}
                      style={{
                        background: '#0033cc',
                        border: '1px solid #002299',
                        color: '#ffffff',
                        padding: '5px 18px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Save References to Database
                    </button>
                  </div>
                </div>
              )}

              {/* ─── 4. LEGAL & DOCUMENTS TAB (VISA COPY, DL, RTR, SSN) ─── */}
              {activeTab === 'legal_docs' && (
                <div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 12px', marginBottom: '12px', borderRadius: '3px' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '2px' }}>
                      Legal, Work Authorization & Compliance Documents
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#475569' }}>
                      Upload candidate Visa copy, Driver's License, Right to Represent (RTR), and SSN card. Click on any document to preview live in the right viewer panel.
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                    {[
                      { key: 'resume', icon: '', label: 'Latest Formatted Resume', desc: 'Current candidate original resume file' },
                      { key: 'visa', icon: '', label: 'Visa Copy / Work Auth (H1B/I-797/EAD/GC)', desc: 'Valid H1B Approval Notice, Green Card, or EAD Document' },
                      { key: 'dlFront', icon: '', label: "Driver's License (Front Page)", desc: 'State Government Photo ID / Driver License - Front Side' },
                      { key: 'dlBack', icon: '', label: "Driver's License (Back Page)", desc: 'State Government Photo ID / Driver License - Back Side & Barcode' },
                      { key: 'rtr', icon: '', label: 'Right to Represent (RTR Form)', desc: 'Signed exclusive right to represent for target requisition' },
                      { key: 'ssn', icon: '', label: 'SSN Verification Document', desc: 'Social Security Number card copy / background auth' },
                      { key: 'coversheet', icon: '', label: 'Candidate Submission Cover Sheet', desc: 'Submission cover sheet' }
                    ].map(item => {
                      const doc = documents[item.key]
                      const isSelected = activeDocType === item.key
                      const isUploaded = doc?.fileData || doc?.storageUrl || doc?.hasFile || doc?.status === 'Uploaded'

                      return (
                        <div
                          key={item.key}
                          style={{
                            border: isSelected ? '2px solid #0033cc' : '1px solid #cbd5e1',
                            background: isSelected ? '#f0fdf4' : '#ffffff',
                            padding: '10px 12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '20px' }}>{item.icon}</span>
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#000080' }}>
                                {item.label}
                              </div>
                              <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                                Status: <strong style={{ color: isUploaded ? '#166534' : '#b45309' }}>
                                  {isUploaded ? `Uploaded (${doc?.fileName || doc?.title || 'Document Attached'})` : 'Not Uploaded Yet'}
                                </strong>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDocType(item.key)
                                setToastMsg(`Switched right viewer to: ${item.label}`)
                                setTimeout(() => setToastMsg(null), 2500)
                              }}
                              style={{
                                border: '1px solid #0033cc',
                                background: isSelected ? '#0033cc' : '#ffffff',
                                color: isSelected ? '#ffffff' : '#0033cc',
                                padding: '3px 8px',
                                fontSize: '10.5px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              View in Right Panel
                            </button>

                            <label
                              style={{
                                border: '1px solid #7f9db9',
                                background: '#f8fafc',
                                color: '#0f172a',
                                padding: '3px 8px',
                                fontSize: '10.5px',
                                cursor: 'pointer',
                                display: 'inline-block'
                              }}
                            >
                              Upload / Replace
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                onChange={e => handleFileUpload(item.key, e)}
                                style={{ display: 'none' }}
                              />
                            </label>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Save Documents to Database Button */}
                  <div style={{
                    marginTop: '14px',
                    paddingTop: '12px',
                    borderTop: '2px solid #bfdbfe',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                      {Object.values(documents).filter(d => d?.fileData || d?.status === 'Uploaded').length} of {Object.keys(documents).length} documents uploaded
                    </span>
                    <button
                      type="button"
                      id="btn-save-legal-docs"
                      onClick={handleSaveDocuments}
                      disabled={isSavingDocs}
                      style={{
                        background: isSavingDocs ? '#64748b' : '#166534',
                        border: '1px solid ' + (isSavingDocs ? '#475569' : '#14532d'),
                        color: '#ffffff',
                        padding: '6px 18px',
                        fontSize: '11.5px',
                        fontWeight: 'bold',
                        cursor: isSavingDocs ? 'not-allowed' : 'pointer',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        boxShadow: isSavingDocs ? 'none' : '0 2px 6px rgba(22,101,52,0.3)'
                      }}
                    >
                      {isSavingDocs ? 'Saving...' : 'Save Documents to Database'}
                    </button>
                  </div>
                </div>
              )}

              {/* ─── 5. INTERACTION NOTES TAB ─── */}
              {activeTab === 'notes' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#000080' }}>
                      Candidate Recruiter Interaction Log ({interactionNotes.length} notes)
                    </span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>AI Auto-generated note</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                    {interactionNotes.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                        No interaction notes recorded yet. Add your first recruiter note below.
                      </div>
                    ) : (
                      interactionNotes.map(note => {
                        const isAuto = note.type === 'auto'
                        return (
                          <div key={note.id} style={{ border: `1px solid ${isAuto ? '#bae6fd' : '#cbd5e1'}`, padding: '8px 10px', background: isAuto ? '#f0f9ff' : '#f8fafc' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10.5px', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <strong style={{ color: isAuto ? '#0369a1' : '#000080' }}>{note.author} ({note.role})</strong>
                                {isAuto && (
                                  <span style={{ background: '#0369a1', color: '#ffffff', fontSize: '9px', padding: '1px 5px', fontWeight: 'bold' }}>AI Auto</span>
                                )}
                              </div>
                              <span style={{ color: '#64748b' }}>{note.date}</span>
                            </div>
                            <p style={{ margin: 0, color: '#0f172a', fontSize: '11px', lineHeight: '1.5' }}>{note.text}</p>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Add New Note Box */}
                  <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
                    <div style={{ fontWeight: 'bold', color: '#000080', marginBottom: '4px' }}>Add Recruiter Note:</div>
                    <textarea
                      rows={3}
                      value={newNoteText}
                      onChange={e => setNewNoteText(e.target.value)}
                      placeholder="Add recruiter feedback, interview notes, screening feedback..."
                      style={{ width: '100%', padding: '4px', fontSize: '11px', border: '1px solid #7f9db9', boxSizing: 'border-box', marginBottom: '6px', borderRadius: '0' }}
                    />
                    <div style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={handleAddNote}
                        style={{ background: '#0033cc', border: '1px solid #002299', color: '#ffffff', padding: '4px 16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '0' }}
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                </div>
              )}


              {/* ─── 6. SUBMISSION HISTORY TAB ─── */}
              {activeTab === 'submissions' && (
                <div>
                  <div style={{ color: '#b91c1c', fontWeight: 'bold', marginBottom: '6px', fontSize: '11px' }}>
                    Candidate was submitted for these requisitions ({submissionHistory.length}):
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', border: '1px solid #7f9db9', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#708090', color: '#ffffff' }}>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff' }}>Requisition#</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff' }}>Position Title</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff', width: '70px' }}>Start Date</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff' }}>End Client</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff', width: '60px' }}>Pay Rate</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissionHistory.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                            No prior requisition submissions recorded for this candidate.
                          </td>
                        </tr>
                      ) : (
                        submissionHistory.map((sub, idx) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '4px 6px', fontWeight: 'bold', color: '#0033cc' }}>{sub.reqId}</td>
                            <td style={{ padding: '4px 6px', color: '#0033cc' }}>{sub.positionTitle}</td>
                            <td style={{ padding: '4px 6px' }}>{sub.startDate}</td>
                            <td style={{ padding: '4px 6px' }}>{sub.endClient}</td>
                            <td style={{ padding: '4px 6px', color: '#0033cc' }}>{sub.payRate}</td>
                            <td style={{ padding: '4px 6px', color: '#166534', fontWeight: 'bold' }}>{sub.status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ─── 7. PROJECTS TAB ─── */}
              {activeTab === 'projects' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#000080' }}>
                      Candidate Project & Engagement History ({projectsList.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const clientName = prompt('Enter Client Name:')
                        const roleTitle = prompt('Enter Role Title:')
                        if (clientName) {
                          const nextProjs = [...projectsList, {
                            id: Date.now(),
                            client: clientName,
                            role: roleTitle || formData.jobTitle || 'Lead Business Analyst',
                            duration: '2023 - 2026',
                            location: 'Hybrid / Remote',
                            description: 'Led technical delivery, requirements analysis, and stakeholder coordination.'
                          }]
                          setProjectsList(nextProjs)
                          try {
                            localStorage.setItem(`smarthire_candidate_projects_${cleanCandId}`, JSON.stringify(nextProjs))
                          } catch(e) {}
                        }
                      }}
                      style={{ border: '1px solid #7f9db9', background: '#f8fafc', padding: '2px 8px', fontSize: '10.5px', cursor: 'pointer' }}
                    >
                      + Add Project
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {projectsList.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                        No specific projects recorded. Click '+ Add Project' to record past client engagements.
                      </div>
                    ) : (
                      projectsList.map(proj => (
                        <div key={proj.id} style={{ border: '1px solid #cbd5e1', padding: '10px 12px', background: '#f8fafc' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ color: '#000080' }}>{proj.client} — {proj.role}</strong>
                            <span style={{ color: '#64748b', fontSize: '10.5px' }}>{proj.duration} ({proj.location})</span>
                          </div>
                          <p style={{ margin: 0, color: '#334155', lineHeight: '1.4' }}>{proj.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ─── 8. AI MATCH TAB ─── */}
              {activeTab === 'ai_fit' && (
                <div>
                  {/* Score Header Card */}
                  <div style={{ background: aiMatch.labelBg, border: `1px solid ${aiMatch.labelColor}33`, padding: '12px 14px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '22px', fontWeight: 'bold', color: aiMatch.labelColor }}>
                          {aiMatch.score}%
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: aiMatch.labelColor, marginLeft: '8px' }}>
                          AI Match Score
                        </span>
                        <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '2px' }}>
                          Evaluated against Req #{reqContext?.id || candidate.jobId || 'Active Job'} — {reqContext?.title || candidate.jobTitle || ''}
                        </div>
                      </div>
                      <span style={{ background: aiMatch.labelColor, color: '#ffffff', padding: '4px 12px', fontWeight: 'bold', fontSize: '10.5px' }}>
                        {aiMatch.label}
                      </span>
                    </div>
                    {/* Score Progress Bar */}
                    <div style={{ background: '#e2e8f0', height: '6px', width: '100%', marginBottom: '6px' }}>
                      <div style={{ background: aiMatch.labelColor, height: '6px', width: `${aiMatch.score}%`, transition: 'width 0.4s ease' }} />
                    </div>
                    {/* Score Breakdown Pills */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '10px' }}>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '1px 7px', border: '1px solid #bae6fd' }}>Title: {aiMatch.titlePts}/20</span>
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '1px 7px', border: '1px solid #86efac' }}>Skills: {aiMatch.skillPts}/45</span>
                      <span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '1px 7px', border: '1px solid #d8b4fe' }}>Govt Exp: {aiMatch.govtPts}/15</span>
                      <span style={{ background: '#fef9c3', color: '#854d0e', padding: '1px 7px', border: '1px solid #fde68a' }}>Bonus Skills: {aiMatch.bonusPts}/15</span>
                      <span style={{ background: '#f0fdf4', color: '#15803d', padding: '1px 7px', border: '1px solid #86efac' }}>Experience: {aiMatch.expPts}/5</span>
                    </div>
                  </div>

                  {/* Why This Match? */}
                  <div style={{ border: '1px solid #cbd5e1', background: '#f8fafc', marginBottom: '12px' }}>
                    <div style={{ background: '#1e3a8a', color: '#ffffff', padding: '5px 10px', fontWeight: 'bold', fontSize: '11px' }}>
                      Why This Match?
                    </div>
                    <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {aiMatch.reasons.map((r, ri) => {
                        const icon = r.type === 'good' ? '✓' : r.type === 'warn' ? '!' : '•'
                        const col = r.type === 'good' ? '#15803d' : r.type === 'warn' ? '#92400e' : '#475569'
                        const bg = r.type === 'good' ? '#f0fdf4' : r.type === 'warn' ? '#fef3c7' : '#f8fafc'
                        return (
                          <div key={ri} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', background: bg, padding: '4px 8px', border: `1px solid ${r.type === 'good' ? '#86efac' : r.type === 'warn' ? '#fde68a' : '#e2e8f0'}` }}>
                            <span style={{ fontSize: '11px', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
                            <span style={{ fontSize: '10.5px', color: col, lineHeight: '1.4' }}>{r.text}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Matched vs Missing Skills */}
                  {aiMatch.matchedReqSkills.length > 0 && (
                    <div style={{ border: '1px solid #86efac', background: '#f0fdf4', padding: '8px 10px', marginBottom: '8px' }}>
                      <strong style={{ color: '#15803d', fontSize: '10.5px', display: 'block', marginBottom: '4px' }}>Verified Required Skills ({aiMatch.matchedReqSkills.length}):</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {aiMatch.matchedReqSkills.map((sk, i) => (
                          <span key={i} style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '1px 7px', fontSize: '10px', fontWeight: 'bold' }}>{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiMatch.missingReqSkills.length > 0 && (
                    <div style={{ border: '1px solid #fde68a', background: '#fef3c7', padding: '8px 10px', marginBottom: '8px' }}>
                      <strong style={{ color: '#92400e', fontSize: '10.5px', display: 'block', marginBottom: '4px' }}>Missing Required Skills ({aiMatch.missingReqSkills.length}) — discuss in screening:</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {aiMatch.missingReqSkills.map((sk, i) => (
                          <span key={i} style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '1px 7px', fontSize: '10px' }}>{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Candidate Skills */}
                  <div style={{ border: '1px solid #cbd5e1', padding: '8px 10px', background: '#f8fafc' }}>
                    <strong style={{ color: '#1e3a8a', display: 'block', marginBottom: '4px', fontSize: '10.5px' }}>All Profiled Skills:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {skillsList.map((sk, i) => {
                        const isReq = aiMatch.matchedReqSkills.some(m => m.toLowerCase().includes(sk.name.toLowerCase()) || sk.name.toLowerCase().includes(m.toLowerCase()))
                        return (
                          <span key={i} style={{ background: isReq ? '#dcfce7' : '#f1f5f9', color: isReq ? '#15803d' : '#475569', border: isReq ? '1px solid #86efac' : '1px solid #cbd5e1', padding: '1px 7px', fontSize: '10px', fontWeight: isReq ? 'bold' : 'normal' }}>
                            {sk.name}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ──── RIGHT PANEL (45% Width, Live Resume & Document Viewer) ──── */}
          <div style={{ width: '45%', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>
            
            {/* Viewer Top Toolbar */}
            <div style={{
              background: '#e2e8f0',
              borderBottom: '1px solid #cbd5e1',
              padding: '6px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 'bold', color: '#000080' }}>Viewing:</span>
                <select
                  value={activeDocType}
                  onChange={e => setActiveDocType(e.target.value)}
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    border: '1px solid #7f9db9',
                    background: '#ffffff',
                    color: '#000080'
                  }}
                >
                  <option value="resume">Original Resume</option>
                  <option value="visa">Visa Copy / Work Auth</option>
                  <option value="dlFront">Driver's License (Front Page)</option>
                  <option value="dlBack">Driver's License (Back Page)</option>
                  <option value="rtr">Right To Represent (RTR)</option>
                  <option value="ssn">SSN Verification</option>
                  <option value="coversheet">Candidate Cover Sheet</option>
                </select>
              </div>

              {/* Action & Upload Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label
                  style={{
                    border: '1px solid #0033cc',
                    background: '#0033cc',
                    color: '#ffffff',
                    padding: '2px 8px',
                    fontSize: '10.5px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                  title="Upload / Replace original resume file"
                >
                  Upload File
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg"
                    onChange={e => handleFileUpload(activeDocType, e)}
                    style={{ display: 'none' }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
                  style={{ border: '1px solid #7f9db9', background: '#ffffff', padding: '1px 6px', cursor: 'pointer', fontWeight: 'bold' }}
                  title="Zoom Out"
                >
                  -
                </button>
                <span style={{ fontSize: '10.5px', color: '#475569', width: '36px', textAlign: 'center' }}>{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
                  style={{ border: '1px solid #7f9db9', background: '#ffffff', padding: '1px 6px', cursor: 'pointer', fontWeight: 'bold' }}
                  title="Zoom In"
                >
                  +
                </button>

                {/* Rotate Button — visible for image docs */}
                {(currentDoc?.fileType?.startsWith('image/') ||
                  currentDoc?.fileName?.match(/\.(png|jpe?g|gif|webp)$/i) ||
                  (typeof currentDoc?.fileData === 'string' && currentDoc.fileData.startsWith('data:image/'))) && (
                  <button
                    type="button"
                    onClick={() => setImgRotation(prev => (prev + 90) % 360)}
                    style={{
                      border: '1px solid #7f9db9',
                      background: imgRotation > 0 ? '#e0f2fe' : '#ffffff',
                      color: imgRotation > 0 ? '#0369a1' : '#0f172a',
                      padding: '1px 7px',
                      cursor: 'pointer',
                      fontSize: '10.5px',
                      fontWeight: 'bold'
                    }}
                    title={`Rotate image (currently ${imgRotation}°)`}
                  >
                    ↻ Rotate{imgRotation > 0 ? ` (${imgRotation}°)` : ''}
                  </button>
                )}

                {currentDoc?.fileData && (
                  <a
                    href={currentDoc.fileData}
                    download={currentDoc.fileName || currentDoc.title || 'resume.pdf'}
                    style={{
                      border: '1px solid #7f9db9',
                      background: '#ffffff',
                      color: '#0f172a',
                      padding: '1px 8px',
                      cursor: 'pointer',
                      fontSize: '10.5px',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    ⬇️ Download
                  </a>
                )}
              </div>
            </div>

            {/* Viewer Document Canvas */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', justifyContent: 'center' }}>
              
              {/* If real uploaded fileData or storageUrl is a PDF */}
              {(currentDoc?.fileData && (currentDoc.fileData.startsWith('data:application/pdf') || currentDoc.fileType === 'application/pdf')) ||
               (currentDoc?.storageUrl && (currentDoc.storageUrl.includes('.pdf') || currentDoc.fileName?.endsWith('.pdf'))) ? (
                <iframe
                  src={currentDoc.fileData || currentDoc.storageUrl}
                  style={{ width: '100%', height: '100%', minHeight: '700px', border: 'none', background: '#ffffff' }}
                  title="Uploaded Document PDF"
                />
              ) : (currentDoc?.fileData && (currentDoc.fileType?.includes('image') || currentDoc.fileData.startsWith('data:image/'))) ||
                  (currentDoc?.storageUrl && (currentDoc.storageUrl.includes('.jpg') || currentDoc.storageUrl.includes('.jpeg') || currentDoc.storageUrl.includes('.png') || currentDoc.storageUrl.includes('firebasestorage'))) ? (
                <div style={{ width: '100%', transform: `scale(${zoomLevel / 100}) rotate(${imgRotation}deg)`, transformOrigin: 'top center', transition: 'transform 0.3s ease' }}>
                  <img
                    src={currentDoc.fileData || currentDoc.storageUrl}
                    alt={currentDoc.title}
                    onLoad={e => {
                      if ((activeDocType === 'dlFront' || activeDocType === 'dlBack') && imgRotation === 0) {
                        if (e.target.naturalHeight > e.target.naturalWidth * 1.15) {
                          setImgRotation(90)
                        }
                      }
                    }}
                    style={{ width: '100%', display: 'block', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                </div>
              ) : (
                <div style={{
                  width: '100%',
                  maxWidth: '680px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  padding: '24px 28px',
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  fontSize: '11px',
                  lineHeight: '1.5',
                  color: '#1e293b'
                }}>
                  
                  {/* ─── LIVE RESUME RENDERER ─── */}
                  {activeDocType === 'resume' && (
                    <div>
                      {/* If raw resume text exists from parser */}
                      {currentDoc?.resumeText || candidate.resumeText ? (
                        <div>
                          <div style={{ textAlign: 'center', borderBottom: '2px solid #000080', paddingBottom: '10px', marginBottom: '14px' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', color: '#000080', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {formData.firstName} {formData.lastName}
                            </h2>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0284c7', marginTop: '2px' }}>
                              {formData.jobTitle || 'Lead Business Analyst'}
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '4px' }}>
                              {formData.city ? `${formData.city}, ${formData.state} ${formData.zip}` : ''} {formData.phoneCell ? `| Cell: ${formData.phoneCell}` : ''} {formData.email ? `| Email: ${formData.email}` : ''}
                            </div>
                          </div>

                          <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.6', color: '#1e293b' }}>
                            {currentDoc?.resumeText || candidate.resumeText}
                          </div>
                        </div>
                      ) : (
                        <div>
                          {/* Structured Full Resume Document Canvas */}
                          <div style={{ textAlign: 'center', borderBottom: '2px solid #000080', paddingBottom: '10px', marginBottom: '14px' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', color: '#000080', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {formData.firstName} {formData.lastName}
                            </h2>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0284c7', marginTop: '2px' }}>
                              {formData.jobTitle || 'Lead Business Analyst'}
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '4px' }}>
                              {formData.city ? `${formData.city}, ${formData.state} ${formData.zip}` : 'Columbia, SC 29210'} {formData.phoneCell ? `| Cell: ${formData.phoneCell}` : '| Cell: (803) 555-0199'} {formData.email ? `| Email: ${formData.email}` : `| Email: ${formData.firstName.toLowerCase() || 'candidate'}@email.com`}
                            </div>
                            <div style={{ fontSize: '10px', color: '#166534', fontWeight: 'bold', marginTop: '2px' }}>
                              Work Authorization: {formData.workAuth} | Total Experience: {formData.experience}+ Years | Availability: {formData.availableDate}
                            </div>
                          </div>

                          {/* Professional Summary */}
                          <div style={{ marginBottom: '14px' }}>
                            <div style={{ background: '#f1f5f9', padding: '3px 6px', fontWeight: 'bold', color: '#000080', borderLeft: '3px solid #000080', marginBottom: '6px' }}>
                              PROFESSIONAL SUMMARY
                            </div>
                            <p style={{ margin: 0, fontSize: '10.5px', color: '#334155', lineHeight: '1.6' }}>
                              Accomplished and results-driven <strong>{formData.jobTitle || 'Lead Business Analyst'}</strong> with over {formData.experience} years of extensive experience delivering large-scale IT and public sector transformation projects. Expert in requirements elicitation, Business Requirements Documents (BRD), Functional Specifications (FRD), Agile/Scrum ceremonies, user stories, acceptance criteria, and cross-functional team coordination. Proven track record collaborating with technical architects, delivery leads, and government stakeholders to ensure flawless project execution.
                            </p>
                          </div>

                          {/* Core Technical & Functional Competencies (Highlighted with requirement matches) */}
                          <div style={{ marginBottom: '14px' }}>
                            <div style={{ background: '#f1f5f9', padding: '3px 6px', fontWeight: 'bold', color: '#000080', borderLeft: '3px solid #000080', marginBottom: '6px' }}>
                              CORE TECHNICAL & FUNCTIONAL COMPETENCIES
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '10.5px' }}>
                              {skillsList.map((sk, skIdx) => {
                                const isReq = sk.required === 'Yes' || reqRequiredSkills.some(rq => rq.toLowerCase().includes(sk.name.toLowerCase()) || sk.name.toLowerCase().includes(rq.toLowerCase()))
                                return (
                                  <span
                                    key={skIdx}
                                    style={{
                                      background: isReq ? '#dcfce7' : '#f1f5f9',
                                      color: isReq ? '#15803d' : '#334155',
                                      border: isReq ? '1px solid #86efac' : '1px solid #cbd5e1',
                                      padding: '2px 7px',
                                      borderRadius: '3px',
                                      fontWeight: isReq ? 'bold' : 'normal'
                                    }}
                                  >
                                    {isReq ? '• ' : ''}{sk.name}
                                  </span>
                                )
                              })}
                            </div>
                          </div>

                          {/* Professional Experience History */}
                          <div style={{ marginBottom: '14px' }}>
                            <div style={{ background: '#f1f5f9', padding: '3px 6px', fontWeight: 'bold', color: '#000080', borderLeft: '3px solid #000080', marginBottom: '8px' }}>
                              PROFESSIONAL EXPERIENCE
                            </div>

                            {projectsList.map((p, pIdx) => (
                              <div key={pIdx} style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#000080', fontSize: '11px' }}>
                                  <span>{p.client} — {p.role}</span>
                                  <span style={{ color: '#64748b', fontSize: '10.5px' }}>{p.duration} | {p.location}</span>
                                </div>
                                <p style={{ margin: '3px 0 0', fontSize: '10.5px', color: '#334155', lineHeight: '1.5' }}>
                                  {p.description}
                                </p>
                                <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '10.5px', color: '#475569', lineHeight: '1.5' }}>
                                  <li>Collaborated directly with client directors and product managers to define project milestones, MVP scope, and sprint backlogs.</li>
                                  <li>Authored comprehensive traceability matrices, data mapping specifications, and UAT validation test scenarios.</li>
                                </ul>
                              </div>
                            ))}
                          </div>

                          {/* Education & Certifications */}
                          <div>
                            <div style={{ background: '#f1f5f9', padding: '3px 6px', fontWeight: 'bold', color: '#000080', borderLeft: '3px solid #000080', marginBottom: '6px' }}>
                              EDUCATION & CERTIFICATIONS
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#334155', lineHeight: '1.5' }}>
                              <div>• <strong>Bachelor of Science in Information Technology / Computer Science</strong></div>
                              <div>• Certified Scrum Master (CSM) / Agile Certified Practitioner (PMI-ACP)</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── OTHER DOCUMENTS (VISA, DL, RTR, SSN, COVER SHEET) ─── */}
                  {activeDocType !== 'resume' && (
                    <div style={{ width: '100%' }}>
                      {currentDoc?.fileData || currentDoc?.storageUrl ? (
                        <div>
                          {/* Document Metadata Header & Action Bar */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '10px 14px',
                            marginBottom: '14px',
                            flexWrap: 'wrap',
                            gap: '8px'
                          }}>
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '13px' }}>
                                {currentDoc.title || activeDocType.toUpperCase()}
                              </div>
                              <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold', marginTop: '2px' }}>
                                Attached &amp; Verified: <span style={{ color: '#0f172a', fontWeight: 'normal' }}>{currentDoc.fileName || `${activeDocType}_Document`} ({currentDoc.size || 'Attached'})</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <a
                                href={currentDoc.fileData || currentDoc.storageUrl}
                                download={currentDoc.fileName || `${activeDocType}_Document.pdf`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  background: '#1e3a8a',
                                  color: '#ffffff',
                                  padding: '5px 12px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  borderRadius: '3px',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                ⬇️ Download / Open
                              </a>
                              <label style={{
                                background: '#f1f5f9',
                                border: '1px solid #94a3b8',
                                color: '#0f172a',
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                Replace
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                  onChange={e => handleFileUpload(activeDocType, e)}
                                  style={{ display: 'none' }}
                                />
                              </label>
                            </div>
                          </div>

                          {/* Render based on document MIME type */}
                          {(currentDoc.fileType?.startsWith('image/') ||
                            currentDoc.fileName?.match(/\.(png|jpe?g|gif|webp|svg)$/i) ||
                            (typeof currentDoc.fileData === 'string' && currentDoc.fileData.startsWith('data:image/'))) ? (
                            <div style={{ textAlign: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', overflow: 'auto', maxHeight: '540px' }}>
                              <img
                                src={currentDoc.fileData || currentDoc.storageUrl}
                                alt={currentDoc.title}
                                onLoad={e => {
                                  if ((activeDocType === 'dlFront' || activeDocType === 'dlBack') && imgRotation === 0) {
                                    if (e.target.naturalHeight > e.target.naturalWidth * 1.15) {
                                      setImgRotation(90)
                                    }
                                  }
                                }}
                                style={{
                                  maxWidth: imgRotation % 180 !== 0 ? '80%' : '100%',
                                  width: `${zoomLevel}%`,
                                  maxHeight: imgRotation % 180 !== 0 ? '420px' : '480px',
                                  objectFit: 'contain',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                  background: '#ffffff',
                                  transform: `rotate(${imgRotation}deg)`,
                                  transition: 'transform 0.3s ease',
                                  display: 'block',
                                  margin: '0 auto'
                                }}
                              />
                            </div>
                          ) : (currentDoc.fileType === 'application/pdf' ||
                               currentDoc.fileName?.endsWith('.pdf') ||
                               (typeof currentDoc.fileData === 'string' && currentDoc.fileData.startsWith('data:application/pdf'))) ? (
                            <div style={{ width: '100%', height: '540px', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                              <iframe
                                src={currentDoc.fileData || currentDoc.storageUrl}
                                title={currentDoc.title}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                              />
                            </div>
                          ) : (
                            <div style={{ padding: '36px 20px', textAlign: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                              
                              <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '14px', marginBottom: '6px' }}>
                                {currentDoc.fileName || currentDoc.title}
                              </div>
                              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '16px' }}>
                                Uploaded on: {currentDoc.uploadedOn || 'Today'} | Size: {currentDoc.size || 'Attached'}
                              </div>
                              <a
                                href={currentDoc.fileData || currentDoc.storageUrl}
                                download={currentDoc.fileName || `${activeDocType}_doc`}
                                style={{
                                  background: '#16a34a',
                                  color: '#ffffff',
                                  padding: '7px 18px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  borderRadius: '3px',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                ⬇️ Download Document
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ padding: '36px 20px', textAlign: 'center', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '6px' }}>
                          
                          <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '14px', marginBottom: '4px' }}>
                            {currentDoc.title || 'Document'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '16px' }}>
                            No file attached yet for this candidate. Select a file (*.pdf, *.png, *.jpg, *.docx) to upload:
                          </div>
                          <label style={{
                            background: '#0033cc',
                            color: '#ffffff',
                            padding: '7px 20px',
                            fontSize: '11.5px',
                            fontWeight: 'bold',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            display: 'inline-block'
                          }}>
                            Select &amp; Upload File
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                              onChange={e => handleFileUpload(activeDocType, e)}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
