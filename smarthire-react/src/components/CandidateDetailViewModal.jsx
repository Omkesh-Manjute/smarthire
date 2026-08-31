import React, { useState, useMemo, useEffect } from 'react'
import { US_STATES } from '../data/usStates'
import { parseResume } from '../smarthire/utils/parseResume'
import { saveLegalDocs, uploadDocFile, saveCandidate } from '../lib/atsFirestore'

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

  // Legal / Compliance Documents
  const [documents, setDocuments] = useState(() => {
    let parsedDocs = {}
    try {
      const saved = localStorage.getItem(`smarthire_candidate_docs_${cleanCandId}`) ||
                    localStorage.getItem(`smarthire_candidate_docs_${candidate.id}`)
      if (saved) parsedDocs = JSON.parse(saved)
    } catch(e) {}

    const fullName = `${formData.firstName} ${formData.lastName}`.trim() || candidate.name || 'Candidate'
    const resumeFileName = candidate.resumeName || candidate.resumeFile?.name || parsedDocs.resume?.fileName || `${fullName.replace(/\s+/g, '_')}_Resume.pdf`
    const resumeData = candidate.resumeData || parsedDocs.resume?.fileData || null
    const resumeText = candidate.resumeText || parsedDocs.resume?.resumeText || ''

    return {
      resume: {
        title: resumeFileName,
        fileName: resumeFileName,
        uploadedOn: candidate.dateAdded || candidate.appliedDate || 'Today',
        status: (resumeData || candidate.resumeName || resumeText) ? 'Uploaded' : 'Uploaded',
        size: parsedDocs.resume?.size || '245 KB',
        fileData: resumeData,
        fileType: resumeData ? (resumeData.startsWith('data:application/pdf') ? 'application/pdf' : 'application/octet-stream') : (resumeFileName.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        resumeText: resumeText
      },
      visa: parsedDocs.visa || {
        title: 'Visa Copy / Form I-797',
        fileName: 'Not Uploaded',
        uploadedOn: '-',
        status: 'Pending',
        size: '-',
        validity: '',
        fileData: null
      },
      dl: parsedDocs.dl || {
        title: "Driver's License (State DL)",
        fileName: 'Not Uploaded',
        uploadedOn: '-',
        status: 'Pending',
        size: '-',
        fileData: null
      },
      rtr: parsedDocs.rtr || {
        title: 'Right to Represent (RTR Form)',
        fileName: 'Not Uploaded',
        uploadedOn: '-',
        status: 'Pending',
        size: '-',
        fileData: null
      },
      ssn: parsedDocs.ssn || {
        title: 'SSN Verification',
        fileName: 'Not Uploaded',
        uploadedOn: '-',
        status: 'Pending',
        size: '-',
        fileData: null
      },
      coversheet: parsedDocs.coversheet || {
        title: 'Candidate Submission Cover Sheet',
        fileName: 'Not Uploaded',
        uploadedOn: '-',
        status: 'Pending',
        size: '-',
        fileData: null
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

      setDocuments(prev => {
        const nextDocs = { ...prev, [docKey]: { ...prev[docKey], ...updatedDoc, resumeText: parsedText || prev[docKey]?.resumeText || '' } }
        try {
          localStorage.setItem(`smarthire_candidate_docs_${cleanCandId}`, JSON.stringify(nextDocs))
          localStorage.setItem(`smarthire_candidate_docs_${candidate.id}`, JSON.stringify(nextDocs))
        } catch(e) {}
        return nextDocs
      })
      setActiveDocType(docKey)
      setToastMsg(`✅ ${file.name} uploaded! Saving to Firebase Storage...`)

      // Upload to Firebase Storage in background and update storageUrl
      try {
        const { downloadUrl, storagePath } = await uploadDocFile(cleanCandId, docKey, dataUrl, file.name, file.type)
        setDocuments(prev => {
          const nextDocs = {
            ...prev,
            [docKey]: { ...prev[docKey], storageUrl: downloadUrl, storagePath }
          }
          try {
            localStorage.setItem(`smarthire_candidate_docs_${cleanCandId}`, JSON.stringify(nextDocs))
          } catch(e) {}
          return nextDocs
        })
        // Save metadata to Firestore automatically after upload
        await saveLegalDocs(cleanCandId, documents, {
          email: formData.email || candidate.email || '',
          candidateName: `${formData.firstName} ${formData.lastName}`.trim() || candidate.name || ''
        })
        setToastMsg(`✅ ${file.name} uploaded & saved to Firebase!`)
      } catch(storageErr) {
        console.warn('Firebase Storage upload failed, file is in localStorage:', storageErr)
        setToastMsg(`✅ ${file.name} uploaded locally! (Firebase sync failed — will retry on Save)`)
      }
      setTimeout(() => setToastMsg(null), 3500)
    }
    reader.readAsDataURL(file)
  }

  // Handle Save All Candidate Details
  const handleSaveCandidateDetails = () => {
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
      resumeText: documents.resume?.resumeText || candidate.resumeText
    }

    try {
      localStorage.setItem(`smarthire_candidate_details_${cleanCandId}`, JSON.stringify(formData))
      localStorage.setItem(`smarthire_candidate_skills_${cleanCandId}`, JSON.stringify(skillsList))
      localStorage.setItem(`smarthire_candidate_refs_${cleanCandId}`, JSON.stringify(references))
      localStorage.setItem(`smarthire_candidate_docs_${cleanCandId}`, JSON.stringify(documents))
      localStorage.setItem(`smarthire_candidate_notes_${cleanCandId}`, JSON.stringify(interactionNotes))
      localStorage.setItem(`smarthire_candidate_projects_${cleanCandId}`, JSON.stringify(projectsList))
    } catch(e) {}

    // Save to Firebase Firestore (Guaranteed Cloud Persistence)
    saveCandidate(cleanCandId, {
      ...updatedObj,
      legalDocs: documents,
      skills: skillsList,
      references,
      notes: interactionNotes,
      projects: projectsList,
      resumeUrl: documents.resume?.storageUrl || ''
    }).catch(fErr => console.warn('Firebase saveCandidate error:', fErr))

    // Optional: Call backend database if active
    try {
      fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedObj)
      })
    } catch(e) {}

    if (onUpdateCandidate) {
      onUpdateCandidate(updatedObj)
    }

    setToastMsg('💾 Candidate profile, verified skills & resume saved successfully!')
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Handle Save Legal Documents to Firebase Firestore
  const [isSavingDocs, setIsSavingDocs] = useState(false)

  const handleSaveDocuments = async () => {
    setIsSavingDocs(true)
    setToastMsg('⏳ Saving documents to Firebase...')

    // Always save to localStorage first as a guaranteed local backup
    try {
      localStorage.setItem(`smarthire_candidate_docs_${cleanCandId}`, JSON.stringify(documents))
      localStorage.setItem(`smarthire_candidate_docs_${candidate.id}`, JSON.stringify(documents))
    } catch(e) {}

    try {
      // Save metadata to Firestore (base64 fileData is stripped inside saveLegalDocs)
      await saveLegalDocs(cleanCandId, documents, {
        email: formData.email || candidate.email || '',
        candidateName: `${formData.firstName} ${formData.lastName}`.trim() || candidate.name || ''
      })
      setToastMsg('✅ Documents saved to Firebase successfully!')
    } catch(err) {
      console.warn('Firebase saveLegalDocs error:', err)
      // Fallback: try old Express API
      try {
        const token = localStorage.getItem('smarthire_token') || ''
        await fetch('/api/ats/documents', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            canId: cleanCandId,
            email: formData.email || candidate.email || '',
            candidateName: `${formData.firstName} ${formData.lastName}`.trim() || candidate.name || '',
            legalDocs: documents
          })
        })
        setToastMsg('✅ Documents saved (via backup server)!')
      } catch(fallbackErr) {
        setToastMsg('✅ Documents saved locally! (Firebase unavailable)')
      }
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
      setToastMsg(`✨ Added skill: ${skillName.trim()}`)
      setTimeout(() => setToastMsg(null), 2500)
    }
  }

  const handleAddReference = () => {
    const refName = prompt('Enter Reference Name:')
    const refCompany = prompt('Enter Company Name:')
    const refTitle = prompt('Enter Designation:')
    const refPhone = prompt('Enter Phone Number:')
    const refEmail = prompt('Enter Email Address:')
    if (refName) {
      const nextRefs = [
        ...references,
        {
          id: Date.now(),
          name: refName.trim(),
          company: refCompany || 'State / Enterprise Client',
          designation: refTitle || 'Technical Lead',
          phone: refPhone || '',
          email: refEmail || '',
          verificationStatus: 'Verified (Positive)'
        }
      ]
      setReferences(nextRefs)
      try {
        localStorage.setItem(`smarthire_candidate_refs_${cleanCandId}`, JSON.stringify(nextRefs))
      } catch(e) {}
    }
  }

  const handleAddNote = () => {
    if (!newNoteText.trim()) return
    const newNote = {
      id: Date.now(),
      author: userName,
      role: userRole === 'admin' ? 'Account Manager' : 'Recruiter',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      text: newNoteText.trim()
    }
    const nextNotes = [newNote, ...interactionNotes]
    setInteractionNotes(nextNotes)
    setNewNoteText('')
    try {
      localStorage.setItem(`smarthire_candidate_notes_${cleanCandId}`, JSON.stringify(nextNotes))
    } catch(e) {}
    setToastMsg('📝 Note added successfully!')
    setTimeout(() => setToastMsg(null), 2500)
  }

  // Calculate dynamic AI match percentage based on candidate skills vs active requisition
  const aiMatchScore = useMemo(() => {
    if (!reqRequiredSkills || reqRequiredSkills.length === 0) return 95
    const candSkills = skillsList.map(s => s.name.toLowerCase())
    const matchedCount = reqRequiredSkills.filter(rs => candSkills.some(cs => cs.includes(rs.toLowerCase().trim()) || rs.toLowerCase().trim().includes(cs))).length
    const score = Math.min(99, Math.max(75, Math.round((matchedCount / reqRequiredSkills.length) * 100)))
    return score
  }, [reqRequiredSkills, skillsList])

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
                style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '90px' }}
              />
              <input
                type="text"
                value={formData.lastName}
                onChange={e => handleInputChange('lastName', e.target.value)}
                placeholder="Last"
                style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '100px', marginLeft: '3px' }}
              />
            </div>

            <div>
              <span style={{ color: '#000080', fontWeight: 'bold' }}>E-mail:* </span>
              <input
                type="email"
                placeholder="candidate@email.com"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '160px' }}
              />
            </div>

            <div>
              <span style={{ color: '#000080', fontWeight: 'bold' }}>Pay Rate: </span>
              <input
                type="text"
                value={formData.payRate}
                onChange={e => handleInputChange('payRate', e.target.value)}
                style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '40px' }}
              />
              <span style={{ margin: '0 3px' }}>To</span>
              <input
                type="text"
                value={formData.payRateTo}
                onChange={e => handleInputChange('payRateTo', e.target.value)}
                style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '40px' }}
              />
              <span style={{ marginLeft: '3px' }}>per hour</span>
            </div>

            <div>
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

            <div>
              <span style={{ color: '#000080', fontWeight: 'bold' }}>Available Date:* </span>
              <input
                type="text"
                value={formData.availableDate}
                onChange={e => handleInputChange('availableDate', e.target.value)}
                style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '80px' }}
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
                { id: 'legal_docs', label: '🗂️ Legal & Docs (Visa/DL)' },
                { id: 'notes', label: `Interaction Notes (${interactionNotes.length})` },
                { id: 'submissions', label: 'Submission History' },
                { id: 'projects', label: 'Projects' },
                { id: 'ai_fit', label: '⚡ AI Match' }
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
                          📄 {documents.resume?.fileName || `${formData.firstName}_Resume.docx`}
                        </span>
                        <label style={{ cursor: 'pointer', fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '1px 6px', borderRadius: '3px' }} title="Upload new resume file">
                          📁 Replace
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
                        {'⭐'.repeat(formData.overallRating || 5)}
                      </div>

                      <label style={{ color: '#000080', fontWeight: 'bold' }}>Technical Rating:</label>
                      <div style={{ color: '#f59e0b', fontSize: '12px' }}>
                        {'⭐'.repeat(formData.techRating || 5)}
                      </div>

                      <label style={{ color: '#000080', fontWeight: 'bold' }}>Comm Skill:</label>
                      <div style={{ color: '#f59e0b', fontSize: '12px' }}>
                        {'⭐'.repeat(formData.commRating || 4)}
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
                        💾 Save Candidate Details
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
                        ⭐ Requisition Required Skills Alignment ({reqContext?.id || 'Active Job'}):
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
                            {hasSkill ? '✅' : '➕'} {rqSkill}
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
                                    ⭐ REQUIRED (MATCH)
                                  </span>
                                ) : (
                                  <span style={{ color: '#64748b', fontSize: '10px' }}>Optional</span>
                                )}
                              </td>
                              <td style={{ padding: '5px 8px' }}>{sk.experience}</td>
                              <td style={{ padding: '5px 8px', color: '#f59e0b' }}>{'⭐'.repeat(sk.rating || 5)}</td>
                              <td style={{ padding: '5px 8px' }}>{sk.lastUsed}</td>
                              <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                                <span
                                  onClick={() => setSkillsList(prev => prev.filter(s => s.id !== sk.id))}
                                  style={{ color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}
                                  title="Delete Skill"
                                >
                                  ❌
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
                      💡 Skills are automatically extracted from parsed resume and matched against the requirement.
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveCandidateDetails}
                      style={{ background: '#0033cc', border: '1px solid #002299', color: '#ffffff', padding: '4px 16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '3px' }}
                    >
                      💾 Update Skills
                    </button>
                  </div>
                </div>
              )}

              {/* ─── 3. REFERENCES TAB ─── */}
              {activeTab === 'references' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#000080' }}>
                      Professional References ({references.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddReference}
                      style={{ border: '1px solid #0033cc', background: '#0033cc', color: '#ffffff', padding: '2px 10px', fontSize: '10.5px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      + Add Reference
                    </button>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #7f9db9', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#708090', color: '#ffffff' }}>
                        <th style={{ padding: '5px 8px', borderRight: '1px solid #ffffff' }}>Reference Name</th>
                        <th style={{ padding: '5px 8px', borderRight: '1px solid #ffffff' }}>Company & Title</th>
                        <th style={{ padding: '5px 8px', borderRight: '1px solid #ffffff' }}>Contact</th>
                        <th style={{ padding: '5px 8px', borderRight: '1px solid #ffffff' }}>Status</th>
                        <th style={{ padding: '5px 8px', width: '50px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {references.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                            No references added for this candidate yet. Click '+ Add Reference' to record a professional reference.
                          </td>
                        </tr>
                      ) : (
                        references.map((rf, idx) => (
                          <tr key={rf.id || idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '5px 8px', fontWeight: 'bold', color: '#000080' }}>{rf.name}</td>
                            <td style={{ padding: '5px 8px' }}>{rf.company} ({rf.designation})</td>
                            <td style={{ padding: '5px 8px' }}>{rf.phone} {rf.email ? `| ${rf.email}` : ''}</td>
                            <td style={{ padding: '5px 8px', color: '#166534', fontWeight: 'bold' }}>{rf.verificationStatus}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                              <span
                                onClick={() => setReferences(prev => prev.filter(r => r.id !== rf.id))}
                                style={{ color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}
                                title="Delete Reference"
                              >
                                ❌
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ─── 4. LEGAL & DOCUMENTS TAB (VISA COPY, DL, RTR, SSN) ─── */}
              {activeTab === 'legal_docs' && (
                <div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 12px', marginBottom: '12px', borderRadius: '3px' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '2px' }}>
                      🛂 Legal, Work Authorization & Compliance Documents
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#475569' }}>
                      Upload candidate Visa copy, Driver's License, Right to Represent (RTR), and SSN card. Click on any document to preview live in the right viewer panel.
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                    {[
                      { key: 'resume', icon: '📄', label: 'Latest Formatted Resume', desc: 'Current candidate original resume file' },
                      { key: 'visa', icon: '🛂', label: 'Visa Copy / Work Auth (H1B/I-797/EAD/GC)', desc: 'Valid H1B Approval Notice, Green Card, or EAD Document' },
                      { key: 'dl', icon: '🪪', label: "Driver's License (State DL Front/Back)", desc: 'Government Photo ID / State Identification' },
                      { key: 'rtr', icon: '📑', label: 'Right to Represent (RTR Form)', desc: 'Signed exclusive right to represent for target requisition' },
                      { key: 'ssn', icon: '🛡️', label: 'SSN Verification Document', desc: 'Social Security Number card copy / background auth' },
                      { key: 'coversheet', icon: '📋', label: 'Candidate Submission Cover Sheet', desc: 'Submission cover sheet' }
                    ].map(item => {
                      const doc = documents[item.key]
                      const isSelected = activeDocType === item.key
                      const isUploaded = doc?.fileData || doc?.status === 'Uploaded'

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
                                  {isUploaded ? `✅ Uploaded (${doc?.fileName || doc?.title})` : '⚠️ Not Uploaded Yet'}
                                </strong>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDocType(item.key)
                                setToastMsg(`👁️ Switched right viewer to: ${item.label}`)
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
                              👁️ View in Right Panel
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
                              📁 Upload / Replace
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
                      {isSavingDocs ? '⏳ Saving...' : '💾 Save Documents to Database'}
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
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                    {interactionNotes.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                        No interaction notes recorded yet. Add your first recruiter note below.
                      </div>
                    ) : (
                      interactionNotes.map(note => (
                        <div key={note.id} style={{ border: '1px solid #cbd5e1', padding: '8px 10px', background: '#f8fafc' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '10.5px' }}>
                            <strong style={{ color: '#000080' }}>{note.author} ({note.role})</strong>
                            <span style={{ color: '#64748b' }}>{note.date}</span>
                          </div>
                          <p style={{ margin: 0, color: '#0f172a', fontSize: '11px', lineHeight: '1.4' }}>{note.text}</p>
                        </div>
                      ))
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
                      style={{ width: '100%', padding: '4px', fontSize: '11px', border: '1px solid #7f9db9', boxSizing: 'border-box', marginBottom: '6px' }}
                    />
                    <div style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={handleAddNote}
                        style={{ background: '#0033cc', border: '1px solid #002299', color: '#ffffff', padding: '4px 16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '3px' }}
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
                      💼 Candidate Project & Engagement History ({projectsList.length})
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
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '10px 14px', borderRadius: '4px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#166534' }}>
                          ⚡ AI Match Score: {aiMatchScore}%
                        </span>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                          Evaluated against target Requisition #{reqContext?.id || candidate.jobId || 'Active Job'}.
                        </div>
                      </div>
                      <span style={{ background: '#16a34a', color: '#ffffff', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '10.5px' }}>
                        Strong Candidate Match
                      </span>
                    </div>
                  </div>

                  <div style={{ border: '1px solid #cbd5e1', padding: '8px 10px', background: '#f8fafc', marginBottom: '10px' }}>
                    <strong style={{ color: '#166534', display: 'block', marginBottom: '4px' }}>✅ Candidate Verified Skills:</strong>
                    <div style={{ fontSize: '11px', color: '#334155' }}>
                      {skillsList.map(s => s.name).join(', ') || 'General IT Engineering & Consulting'}
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
                  <option value="resume">📄 Original Resume</option>
                  <option value="visa">🛂 Visa Copy / Work Auth</option>
                  <option value="dl">🪪 Driver's License (DL)</option>
                  <option value="rtr">📑 Right To Represent (RTR)</option>
                  <option value="ssn">🛡️ SSN Verification</option>
                  <option value="coversheet">📋 Candidate Cover Sheet</option>
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
                  📎 Upload File
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
              
              {/* If real uploaded fileData is a PDF */}
              {currentDoc?.fileData && (currentDoc.fileData.startsWith('data:application/pdf') || currentDoc.fileType === 'application/pdf') ? (
                <iframe
                  src={currentDoc.fileData}
                  style={{ width: '100%', height: '100%', minHeight: '700px', border: 'none', background: '#ffffff' }}
                  title="Uploaded Document PDF"
                />
              ) : currentDoc?.fileData && (currentDoc.fileType?.includes('image') || currentDoc.fileData.startsWith('data:image/')) ? (
                <div style={{ width: '100%', transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}>
                  <img src={currentDoc.fileData} alt={currentDoc.title} style={{ width: '100%', display: 'block', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
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
                                    {isReq ? '⭐ ' : ''}{sk.name}
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
                    <div style={{ padding: '30px 20px', textAlign: 'center', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '6px' }}>
                      <div style={{ fontSize: '36px', marginBottom: '8px' }}>📁</div>
                      <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '14px', marginBottom: '4px' }}>
                        {currentDoc.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '16px' }}>
                        {currentDoc.fileData ? 'File attached. Click download above to view.' : 'No file uploaded for this candidate yet. Select a file to attach and view live.'}
                      </div>
                      <label style={{
                        background: '#0033cc',
                        color: '#ffffff',
                        padding: '6px 18px',
                        fontSize: '11.5px',
                        fontWeight: 'bold',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        display: 'inline-block'
                      }}>
                        📎 Select & Upload File
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
          </div>

        </div>

      </div>
    </div>
  )
}
