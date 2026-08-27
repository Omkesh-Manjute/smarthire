import React, { useState, useMemo } from 'react'

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

  // Extract / Normalize Candidate Basic Info
  const candNameParts = (candidate.name || 'Candidate Name').trim().split(' ')
  const [formData, setFormData] = useState(() => {
    const cleanCandId = candidate.id || candidate.canId || candidate._id || '71247'
    const savedOverrides = localStorage.getItem(`smarthire_candidate_details_${cleanCandId}`)
    const parsedOverrides = savedOverrides ? JSON.parse(savedOverrides) : {}

    return {
      candId: cleanCandId,
      firstName: parsedOverrides.firstName || candidate.firstName || candNameParts[0] || '',
      lastName: parsedOverrides.lastName || candidate.lastName || candNameParts.slice(1).join(' ') || '',
      email: parsedOverrides.email || candidate.email || candidate.candidateEmail || 'candidate@example.com',
      payRate: parsedOverrides.payRate || (candidate.payRate ? String(candidate.payRate).replace(/[^0-9]/g, '') : '85'),
      payRateTo: parsedOverrides.payRateTo || (candidate.payRateTo ? String(candidate.payRateTo).replace(/[^0-9]/g, '') : '85'),
      rateType: parsedOverrides.rateType || candidate.rateType || candidate.payRateType || 'C2C',
      availableDate: parsedOverrides.availableDate || candidate.avblDate || candidate.availableDate || '8/26/2026',
      screened: parsedOverrides.screened !== undefined ? parsedOverrides.screened : true,
      dob: parsedOverrides.dob || candidate.dob || '',
      source: parsedOverrides.source || candidate.source || 'Dice',
      subVendor: parsedOverrides.subVendor || candidate.subVendor || 'Promatrix Corp',
      jobTitle: parsedOverrides.jobTitle || candidate.jobTitle || candidate.fullRole || candidate.role || 'Business Intel Architect III - 105',
      phoneCell: parsedOverrides.phoneCell || candidate.phone || candidate.phoneCell || '908-348-3561',
      phoneHome: parsedOverrides.phoneHome || candidate.phoneHome || '',
      phoneWork: parsedOverrides.phoneWork || candidate.phoneWork || '',
      address: parsedOverrides.address || candidate.address || '4430 Broad Rd.',
      city: parsedOverrides.city || candidate.city || 'Austin',
      state: parsedOverrides.state || candidate.state || 'TX',
      zip: parsedOverrides.zip || candidate.zip || '75020',
      workAuth: parsedOverrides.workAuth || candidate.workAuth || 'H1',
      readyToRelocate: parsedOverrides.readyToRelocate || candidate.readyToRelocate || 'Yes',
      currentlyWorking: parsedOverrides.currentlyWorking !== undefined ? parsedOverrides.currentlyWorking : true,
      preferences: parsedOverrides.preferences || candidate.preferences || 'Open to hybrid roles in TX/NC/VA.',
      ssnLastFour: parsedOverrides.ssnLastFour || candidate.ssnLastFour || '4821',
      experience: parsedOverrides.experience || candidate.exp || '15',
      overallRating: parsedOverrides.overallRating || candidate.rating || 5,
      techRating: parsedOverrides.techRating || 5,
      commRating: parsedOverrides.commRating || 4,
      securityClearance: parsedOverrides.securityClearance || false,
      proposedBillRate: parsedOverrides.proposedBillRate || '9999',
      finalPayRate: parsedOverrides.finalPayRate || '95',
      comments: parsedOverrides.comments || candidate.statusComments || 'Candidate has strong technical experience and clear communication skills.'
    }
  })

  // Skills List
  const [skillsList, setSkillsList] = useState(() => {
    const cleanCandId = candidate.id || candidate.canId || candidate._id || '71247'
    const saved = localStorage.getItem(`smarthire_candidate_skills_${cleanCandId}`)
    if (saved) {
      try { return JSON.parse(saved) } catch(e) {}
    }
    const defaultRaw = Array.isArray(candidate.skills) ? candidate.skills : (candidate.skills ? String(candidate.skills).split(',') : ['Informatica PowerCenter', 'Informatica IICS (CDI & CAI)', 'SQL & Oracle PL/SQL', 'Data Warehousing & ETL', 'AWS S3 & Snowflake', 'Agile / Scrum Framework'])
    return defaultRaw.map((s, idx) => ({
      id: idx + 1,
      name: typeof s === 'string' ? s.trim() : s.name,
      required: idx < 3 ? 'Yes' : 'No',
      experience: idx === 0 ? '15 Years' : idx === 1 ? '7 Years' : '10 Years',
      rating: 5,
      lastUsed: '2026'
    }))
  })

  // References List
  const [references, setReferences] = useState(() => {
    const cleanCandId = candidate.id || candidate.canId || candidate._id || '71247'
    const saved = localStorage.getItem(`smarthire_candidate_refs_${cleanCandId}`)
    if (saved) {
      try { return JSON.parse(saved) } catch(e) {}
    }
    return [
      {
        id: 1,
        name: 'Rajesh Nair',
        company: 'Cognizant Technology Solutions',
        designation: 'Enterprise Data Architect',
        phone: '732-555-8912',
        email: 'rajesh.nair@cognizant.com',
        verificationStatus: 'Verified (Positive Feedback)'
      },
      {
        id: 2,
        name: 'Michael Henderson',
        company: 'Deloitte Consulting',
        designation: 'Senior Delivery Manager',
        phone: '415-555-0341',
        email: 'mhenderson@deloitte.com',
        verificationStatus: 'Verified (High Technical Rating)'
      }
    ]
  })

  // Legal / Compliance Documents (Visa, DL, RTR, SSN, Cover Sheet)
  const [documents, setDocuments] = useState(() => {
    const cleanCandId = candidate.id || candidate.canId || candidate._id || '71247'
    const saved = localStorage.getItem(`smarthire_candidate_docs_${cleanCandId}`)
    if (saved) {
      try { return JSON.parse(saved) } catch(e) {}
    }
    return {
      resume: {
        title: `${formData.firstName}_${formData.lastName}_Resume.docx`,
        fileName: candidate.resumeName || `${formData.firstName}_${formData.lastName}_Resume.docx`,
        uploadedOn: 'Aug 26, 2026 11:40 AM',
        status: 'Uploaded',
        size: '184 KB',
        fileData: null
      },
      visa: {
        title: `H1B_I797_Approval_Notice_${formData.lastName}.pdf`,
        fileName: `H1B_I797_Approval_${formData.lastName}.pdf`,
        uploadedOn: 'Aug 20, 2026 04:15 PM',
        status: 'Uploaded',
        size: '420 KB',
        validity: 'Valid till 09/30/2028',
        fileData: null
      },
      dl: {
        title: `Drivers_License_${formData.state}_${formData.lastName}.pdf`,
        fileName: `DL_${formData.state}_${formData.lastName}.jpg`,
        uploadedOn: 'Aug 20, 2026 04:18 PM',
        status: 'Uploaded',
        size: '310 KB',
        validity: 'Exp: 11/2029',
        fileData: null
      },
      rtr: {
        title: `Right_To_Represent_Agreement_${formData.lastName}.pdf`,
        fileName: `RTR_Agreement_StateOfTX_${formData.lastName}.pdf`,
        uploadedOn: 'Aug 26, 2026 10:15 AM',
        status: 'Signed & Uploaded',
        size: '142 KB',
        fileData: null
      },
      ssn: {
        title: `SSN_Verification_Card_${formData.lastName}.pdf`,
        fileName: `SSN_Card_Copy_${formData.lastName}.pdf`,
        uploadedOn: 'Aug 20, 2026 04:20 PM',
        status: 'Verified',
        size: '190 KB',
        fileData: null
      },
      coversheet: {
        title: 'Candidate_Cover_Sheet_Req158964.docx',
        fileName: `CoverSheet_${formData.lastName}.docx`,
        uploadedOn: 'Aug 26, 2026 11:43 AM',
        status: 'Generated',
        size: '95 KB',
        fileData: null
      }
    }
  })

  // Recruiter Interaction Notes
  const [interactionNotes, setInteractionNotes] = useState(() => {
    const cleanCandId = candidate.id || candidate.canId || candidate._id || '71247'
    const saved = localStorage.getItem(`smarthire_candidate_notes_${cleanCandId}`)
    if (saved) {
      try { return JSON.parse(saved) } catch(e) {}
    }
    return [
      {
        id: 1,
        note: 'He has required skills/tools. Candidate confirmed 15+ years experience in Informatica Power center and Informatica IICS(CDI&CAI). Good communication skills, 2 weeks notice period availability.',
        by: 'Vaibhav Bisen',
        role: 'Recruiter',
        timestamp: 'Sep 21, 2022 12:43 PM'
      },
      {
        id: 2,
        note: 'Technical pre-screening completed. Candidate rate agreed at $85/hr C2C. Work authorization copy and DL verified.',
        by: 'Sukamal Chatterjee',
        role: 'Account Manager',
        timestamp: 'Jun 28, 2022 04:58 PM'
      }
    ]
  })
  const [newNoteText, setNewNoteText] = useState('')

  // Submission History Calculation
  const submissionHistory = useMemo(() => {
    const subs = []
    const candId = String(candidate.id || '')
    const candName = (candidate.name || '').toLowerCase()

    allJobs.forEach(job => {
      const cleanId = String(job.id || '').replace('J-', '')
      try {
        const raw = localStorage.getItem(`smarthire_potential_candidates_${cleanId}`)
        if (raw) {
          const list = JSON.parse(raw)
          if (Array.isArray(list)) {
            const match = list.find(c => String(c.id) === candId || (c.name && c.name.toLowerCase() === candName))
            if (match) {
              subs.push({
                reqId: cleanId,
                positionTitle: job.title || 'Requisition Position',
                startDate: job.creationDate || '10/1/2026',
                endDate: job.deadline || '-',
                endClient: job.customer || job.client || 'State Of TX',
                billRate: `${job.billRate || '9999'}/hr`,
                payRate: `${match.payRate || '95'}/hr`,
                historyText: 'View'
              })
            }
          }
        }
      } catch (e) {}
    })

    if (subs.length === 0) {
      return [
        { reqId: '134730', positionTitle: 'Business Intel Architect III - 105965 -SP', startDate: '-', endDate: '-', endClient: 'State Of WI', billRate: '100/hr', payRate: '85/hr', historyText: 'View' },
        { reqId: '136480', positionTitle: 'Business Intel Architect IV - 109236 -SP', startDate: '-', endDate: '-', endClient: 'State Of WI', billRate: '999/hr', payRate: '85/hr', historyText: 'View' },
        { reqId: '137636', positionTitle: 'Business Intel Architect III -111756-SP', startDate: '-', endDate: '-', endClient: 'State Of WI', billRate: '85/hr', payRate: '78/hr', historyText: 'View' },
        { reqId: '158964', positionTitle: 'Business Analyst 3 - 529601639R', startDate: '-', endDate: '-', endClient: 'State Of TX', billRate: '9999/hr', payRate: '95/hr', historyText: 'View' }
      ]
    }
    return subs
  }, [candidate, allJobs])

  // Candidate Projects
  const [projectsList, setProjectsList] = useState([
    {
      id: 1,
      client: 'Texas Department of Transportation (TxDOT)',
      role: 'Lead Informatica / ETL Architect',
      duration: 'Mar 2023 - Present',
      location: 'Austin, TX (Hybrid)',
      description: 'Architected end-to-end data migration pipelines using Informatica IICS and Snowflake. Automated daily reconciliation workflows handling 45M+ vehicle and toll records.'
    },
    {
      id: 2,
      client: 'Wisconsin Department of Health Services',
      role: 'Senior Business Intelligence Consultant',
      duration: 'Jan 2021 - Feb 2023',
      location: 'Madison, WI',
      description: 'Implemented enterprise dimensional data models and PowerCenter workflows for Medicaid claim reporting compliance with state healthcare mandates.'
    }
  ])

  // Handle Form Change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle File Upload for any document
  const handleFileUpload = (docKey, e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (uploadEvt) => {
      const dataUrl = uploadEvt.target.result
      setDocuments(prev => {
        const nextDocs = {
          ...prev,
          [docKey]: {
            ...prev[docKey],
            title: file.name,
            fileName: file.name,
            uploadedOn: new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
            status: 'Uploaded',
            size: `${Math.round(file.size / 1024)} KB`,
            fileData: dataUrl,
            fileType: file.type
          }
        }
        try {
          localStorage.setItem(`smarthire_candidate_docs_${formData.candId}`, JSON.stringify(nextDocs))
        } catch(e) {}
        return nextDocs
      })
      setActiveDocType(docKey)
      setToastMsg(`✅ ${file.name} uploaded successfully! Displaying in viewer.`)
      setTimeout(() => setToastMsg(null), 3500)
    }
    reader.readAsDataURL(file)
  }

  // Handle Save All Candidate Details
  const handleSaveCandidateDetails = () => {
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`
    const updatedObj = {
      ...candidate,
      id: formData.candId,
      name: fullName,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      payRate: `$${formData.payRate}/hr`,
      payRateTo: `$${formData.payRateTo}/hr`,
      rateType: formData.rateType,
      avblDate: formData.availableDate,
      phone: formData.phoneCell,
      location: `${formData.city}, ${formData.state} ${formData.zip}`,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      workAuth: formData.workAuth,
      fullRole: formData.jobTitle,
      role: formData.jobTitle,
      exp: formData.experience,
      rating: formData.overallRating,
      statusComments: formData.comments
    }

    try {
      localStorage.setItem(`smarthire_candidate_details_${formData.candId}`, JSON.stringify(formData))
      localStorage.setItem(`smarthire_candidate_skills_${formData.candId}`, JSON.stringify(skillsList))
      localStorage.setItem(`smarthire_candidate_refs_${formData.candId}`, JSON.stringify(references))
      localStorage.setItem(`smarthire_candidate_docs_${formData.candId}`, JSON.stringify(documents))
      localStorage.setItem(`smarthire_candidate_notes_${formData.candId}`, JSON.stringify(interactionNotes))
    } catch(e) {}

    if (onUpdateCandidate) {
      onUpdateCandidate(updatedObj)
    }

    setToastMsg(`🎉 Candidate ${fullName} profile details saved successfully!`)
    setTimeout(() => setToastMsg(null), 4000)
  }

  // Handle Add Note
  const handleAddNote = () => {
    if (!newNoteText.trim()) return
    const newNote = {
      id: Date.now(),
      note: newNoteText.trim(),
      by: userName,
      role: userRole,
      timestamp: new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
    }
    const updatedNotes = [newNote, ...interactionNotes]
    setInteractionNotes(updatedNotes)
    setNewNoteText('')
    try {
      localStorage.setItem(`smarthire_candidate_notes_${formData.candId}`, JSON.stringify(updatedNotes))
    } catch(e) {}
    setToastMsg('📝 Note added to candidate interaction timeline!')
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Active doc object
  const currentDoc = documents[activeDocType] || documents.resume

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 11000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '4px',
          width: '97vw',
          maxWidth: '1440px',
          height: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          border: '1px solid #7f9db9',
          overflow: 'hidden',
          fontFamily: 'Arial, Helvetica, sans-serif'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ═══════════ TOP HEADER: REQUISITION CONTEXT BAR ═══════════ */}
        <div style={{
          background: '#dbeafe',
          borderBottom: '1px solid #93c5fd',
          padding: '8px 16px',
          fontSize: '11px',
          color: '#1e3a8a',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr) auto',
          gap: '8px',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>Requisition #: </span>
            <strong style={{ color: '#000080' }}>{reqContext?.id || candidate.reqId || '158964'}</strong>
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Position Title: </span>
            <strong style={{ color: '#000080' }}>{reqContext?.title || candidate.jobTitle || 'Business Analyst 3 - 529601639R'}</strong>
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Customer: </span>
            <strong style={{ color: '#000080' }}>{reqContext?.client || reqContext?.customer || 'State Of TX'}</strong>
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Status: </span>
            <span style={{ color: '#166534', fontWeight: 'bold' }}>{reqContext?.status || 'In-Progress'}</span>
            <span style={{ marginLeft: '12px', fontWeight: 'bold' }}>Start Date: </span>
            <span>{reqContext?.startDate || '10/1/2026'}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '1px solid #7f9db9',
              color: '#000080',
              fontWeight: 'bold',
              fontSize: '12px',
              padding: '2px 8px',
              cursor: 'pointer'
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* ═══════════ CANDIDATE PRIMARY STRIP ═══════════ */}
        <div style={{
          background: '#f8fafc',
          borderBottom: '1px solid #cbd5e1',
          padding: '8px 16px',
          fontSize: '11px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#000080', fontWeight: 'bold' }}>Candidate # :</span>
            <strong style={{ color: '#0033cc' }}>{formData.candId}</strong>
            <button
              type="button"
              onClick={() => setActiveTab('projects')}
              style={{
                border: '1px solid #7f9db9',
                background: '#ffffff',
                color: '#000080',
                padding: '2px 6px',
                fontSize: '10.5px',
                cursor: 'pointer'
              }}
            >
              Candidate Projects
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px', color: '#000080', fontWeight: 'bold' }}>
              <input
                type="checkbox"
                checked={formData.screened}
                onChange={e => handleInputChange('screened', e.target.checked)}
              />
              Screened
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#000080', fontWeight: 'bold' }}>Candidate Name:*</span>
            <input
              type="text"
              value={formData.firstName}
              onChange={e => handleInputChange('firstName', e.target.value)}
              placeholder="First Name"
              style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '100px' }}
            />
            <input
              type="text"
              value={formData.lastName}
              onChange={e => handleInputChange('lastName', e.target.value)}
              placeholder="Last Name"
              style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '100px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#000080', fontWeight: 'bold' }}>E-mail:*</span>
            <input
              type="email"
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '180px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#000080', fontWeight: 'bold' }}>Pay Rate:</span>
            <input
              type="text"
              value={formData.payRate}
              onChange={e => handleInputChange('payRate', e.target.value)}
              style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '40px' }}
            />
            <span>To</span>
            <input
              type="text"
              value={formData.payRateTo}
              onChange={e => handleInputChange('payRateTo', e.target.value)}
              style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '40px' }}
            />
            <span>per hour</span>
            <select
              value={formData.rateType}
              onChange={e => handleInputChange('rateType', e.target.value)}
              style={{ fontSize: '10.5px', padding: '1px 2px', border: '1px solid #7f9db9' }}
            >
              <option value="C2C">C2C</option>
              <option value="W2">W2</option>
              <option value="1099">1099</option>
              <option value="Full Time">Full Time</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#000080', fontWeight: 'bold' }}>Available Date:*</span>
            <input
              type="text"
              value={formData.availableDate}
              onChange={e => handleInputChange('availableDate', e.target.value)}
              style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '90px' }}
            />
          </div>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div style={{ background: '#dcfce7', borderBottom: '1px solid #86efac', color: '#166534', padding: '6px 16px', fontSize: '11.5px', fontWeight: 'bold' }}>
            {toastMsg}
          </div>
        )}

        {/* ═══════════ MAIN BODY SPLIT-VIEW (LEFT: DETAILS & TABS, RIGHT: RESUME & DOC VIEWER) ═══════════ */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          
          {/* ──── LEFT PANEL (56% Width, Scrollable Forms) ──── */}
          <div style={{ width: '56%', borderRight: '2px solid #cbd5e1', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#ffffff' }}>
            
            {/* Tabs Navigation */}
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              borderBottom: '1px solid #7f9db9',
              padding: '0 8px',
              gap: '2px',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              {[
                { id: 'details', label: 'Details' },
                { id: 'skill', label: 'Skill' },
                { id: 'references', label: 'References' },
                { id: 'legal_docs', label: '📁 Legal & Docs (Visa/DL)' },
                { id: 'notes', label: `Interaction Notes (${interactionNotes.length})` },
                { id: 'submissions', label: 'Submission History' },
                { id: 'projects', label: 'Projects' },
                { id: 'ai_fit', label: '⚡ AI Match' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    border: '1px solid #7f9db9',
                    borderBottom: activeTab === tab.id ? '1px solid #ffffff' : '1px solid #7f9db9',
                    background: activeTab === tab.id ? '#ffffff' : '#e2e8f0',
                    color: activeTab === tab.id ? '#000080' : '#475569',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    marginBottom: activeTab === tab.id ? '-1px' : '0'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT AREA */}
            <div style={{ padding: '14px 16px', fontSize: '11px' }}>
              
              {/* ─── 1. DETAILS TAB ─── */}
              {activeTab === 'details' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '16px' }}>
                    
                    {/* Left Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                        <label style={{ color: '#000080', fontWeight: 'bold' }}>Date of Birth:</label>
                        <input
                          type="text"
                          value={formData.dob}
                          onChange={e => handleInputChange('dob', e.target.value)}
                          placeholder="YYYY-MM-DD"
                          style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '130px' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                        <label style={{ color: '#000080', fontWeight: 'bold' }}>Candidate Source*:</label>
                        <select
                          value={formData.source}
                          onChange={e => handleInputChange('source', e.target.value)}
                          style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '150px' }}
                        >
                          <option value="Dice">Dice</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="SmartHire Careers">SmartHire Careers</option>
                          <option value="Monster">Monster</option>
                          <option value="Referral">Referral</option>
                          <option value="Direct Sourcing">Direct Sourcing</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                        <label style={{ color: '#000080', fontWeight: 'bold' }}>Sub-Vendor:</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <select
                            value={formData.subVendor}
                            onChange={e => handleInputChange('subVendor', e.target.value)}
                            style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '150px' }}
                          >
                            <option value="Promatrix Corp">Promatrix Corp</option>
                            <option value="Apex Systems">Apex Systems</option>
                            <option value="Direct W2">Direct W2</option>
                            <option value="Infoway Solutions">Infoway Solutions</option>
                          </select>
                          <span style={{ color: '#0033cc', cursor: 'pointer', fontSize: '10.5px', textDecoration: 'underline' }}>AddSubVendor</span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                        <label style={{ color: '#000080', fontWeight: 'bold' }}>Job Title*:</label>
                        <input
                          type="text"
                          value={formData.jobTitle}
                          onChange={e => handleInputChange('jobTitle', e.target.value)}
                          style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '100%' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'flex-start' }}>
                        <label style={{ color: '#000080', fontWeight: 'bold', marginTop: '3px' }}>Phone (any one):</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '40px', color: '#000080' }}>Cell</span>
                            <input
                              type="text"
                              value={formData.phoneCell}
                              onChange={e => handleInputChange('phoneCell', e.target.value)}
                              style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '130px' }}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '40px', color: '#000080' }}>Home</span>
                            <input
                              type="text"
                              value={formData.phoneHome}
                              onChange={e => handleInputChange('phoneHome', e.target.value)}
                              style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '130px' }}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '40px', color: '#000080' }}>Work</span>
                            <input
                              type="text"
                              value={formData.phoneWork}
                              onChange={e => handleInputChange('phoneWork', e.target.value)}
                              style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '130px' }}
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                        <label style={{ color: '#000080', fontWeight: 'bold' }}>Address:</label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={e => handleInputChange('address', e.target.value)}
                          style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '100%' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                        <label style={{ color: '#000080', fontWeight: 'bold' }}>City, State, Zip:</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={e => handleInputChange('city', e.target.value)}
                            style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '90px' }}
                          />
                          <select
                            value={formData.state}
                            onChange={e => handleInputChange('state', e.target.value)}
                            style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9' }}
                          >
                            <option value="TX">TX</option>
                            <option value="VA">VA</option>
                            <option value="NC">NC</option>
                            <option value="SC">SC</option>
                            <option value="CA">CA</option>
                            <option value="NY">NY</option>
                            <option value="FL">FL</option>
                          </select>
                          <input
                            type="text"
                            value={formData.zip}
                            onChange={e => handleInputChange('zip', e.target.value)}
                            style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '60px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                        <label style={{ color: '#000080', fontWeight: 'bold' }}>Work Authorization:</label>
                        <select
                          value={formData.workAuth}
                          onChange={e => handleInputChange('workAuth', e.target.value)}
                          style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '130px' }}
                        >
                          <option value="H1">H1 / H1B</option>
                          <option value="US Citizen">US Citizen</option>
                          <option value="Green Card">Green Card</option>
                          <option value="EAD">EAD / GC EAD</option>
                          <option value="OPT">OPT / CPT</option>
                          <option value="TN">TN Visa</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                        <label style={{ color: '#000080', fontWeight: 'bold' }}>Ready to Relocate:</label>
                        <select
                          value={formData.readyToRelocate}
                          onChange={e => handleInputChange('readyToRelocate', e.target.value)}
                          style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '80px' }}
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="Hybrid Only">Hybrid Only</option>
                        </select>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ color: '#000080', fontWeight: 'bold' }}>Currently Working:</label>
                        <input
                          type="checkbox"
                          checked={formData.currentlyWorking}
                          onChange={e => handleInputChange('currentlyWorking', e.target.checked)}
                        />
                      </div>

                      <div>
                        <span style={{ color: '#000080', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Resume</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            onClick={() => setActiveDocType('resume')}
                            style={{ color: '#0033cc', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            {documents.resume.fileName}
                          </span>
                          <label style={{ cursor: 'pointer' }} title="Upload new resume">
                            ✏️
                            <input
                              type="file"
                              accept=".pdf,.docx,.doc"
                              onChange={e => handleFileUpload('resume', e)}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <span style={{ color: '#000080', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Preferences for Placement:</span>
                        <textarea
                          rows={3}
                          value={formData.preferences}
                          onChange={e => handleInputChange('preferences', e.target.value)}
                          style={{ width: '100%', padding: '4px', fontSize: '11px', border: '1px solid #7f9db9', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ color: '#000080', fontWeight: 'bold', width: '100px' }}>SSN (Last four):</label>
                        <input
                          type="text"
                          value={formData.ssnLastFour}
                          onChange={e => handleInputChange('ssnLastFour', e.target.value)}
                          style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '60px' }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ color: '#000080', fontWeight: 'bold', width: '100px' }}>Experience:*</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="text"
                            value={formData.experience}
                            onChange={e => handleInputChange('experience', e.target.value)}
                            style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '40px' }}
                          />
                          <span>years</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ color: '#000080', fontWeight: 'bold', width: '100px' }}>Overall Rating:</label>
                        <div style={{ color: '#f59e0b', fontSize: '14px', cursor: 'pointer' }}>
                          {'⭐'.repeat(formData.overallRating)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ color: '#000080', fontWeight: 'bold', width: '100px' }}>Technical Rating:</label>
                        <div style={{ color: '#f59e0b', fontSize: '14px', cursor: 'pointer' }}>
                          {'⭐'.repeat(formData.techRating)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ color: '#000080', fontWeight: 'bold', width: '100px' }}>Comm Skill:</label>
                        <div style={{ color: '#f59e0b', fontSize: '14px', cursor: 'pointer' }}>
                          {'⭐'.repeat(formData.commRating)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          checked={formData.securityClearance}
                          onChange={e => handleInputChange('securityClearance', e.target.checked)}
                        />
                        <label style={{ color: '#000080', fontWeight: 'bold' }}>Security Clearance / Federal Clearance:</label>
                      </div>
                    </div>
                  </div>

                  {/* Proposed Bill Rate & Comments Section */}
                  <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#000080', fontWeight: 'bold' }}>Proposed Bill Rate*:</span>
                        <input
                          type="text"
                          value={formData.proposedBillRate}
                          onChange={e => handleInputChange('proposedBillRate', e.target.value)}
                          style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '60px' }}
                        />
                        <span>per hour</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#000080', fontWeight: 'bold' }}>Pay Rate*:</span>
                        <input
                          type="text"
                          value={formData.finalPayRate}
                          onChange={e => handleInputChange('finalPayRate', e.target.value)}
                          style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #7f9db9', width: '50px' }}
                        />
                        <span>per hour</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#000080', fontWeight: 'bold' }}>Rate Type:</span>
                        <select
                          value={formData.rateType}
                          onChange={e => handleInputChange('rateType', e.target.value)}
                          style={{ fontSize: '10.5px', padding: '1px 2px', border: '1px solid #7f9db9' }}
                        >
                          <option value="C2C">C2C</option>
                          <option value="W2">W2</option>
                          <option value="1099">1099</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ color: '#000080', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Comments:</span>
                      <textarea
                        rows={3}
                        value={formData.comments}
                        onChange={e => handleInputChange('comments', e.target.value)}
                        style={{ width: '100%', padding: '4px', fontSize: '11px', border: '1px solid #7f9db9', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleSaveCandidateDetails}
                        style={{
                          background: '#e2e8f0',
                          border: '1px solid #71717a',
                          color: '#0f172a',
                          padding: '3px 16px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #71717a',
                          color: '#0f172a',
                          padding: '3px 16px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── 2. SKILL TAB ─── */}
              {activeTab === 'skill' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#0033cc', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>
                      Manage Skills
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newSkillName = prompt('Enter new skill name:')
                        if (newSkillName) {
                          setSkillsList(prev => [...prev, {
                            id: Date.now(),
                            name: newSkillName,
                            required: 'Yes',
                            experience: '5 Years',
                            rating: 5,
                            lastUsed: '2026'
                          }])
                        }
                      }}
                      style={{ border: '1px solid #7f9db9', background: '#f8fafc', padding: '2px 8px', fontSize: '10.5px', cursor: 'pointer' }}
                    >
                      + Add Skill
                    </button>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #7f9db9', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#708090', color: '#ffffff' }}>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff' }}>Skill Name</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff', width: '80px' }}>Required</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff', width: '90px' }}>Experience</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff', width: '90px' }}>Rating</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff', width: '80px' }}>Last Used</th>
                        <th style={{ padding: '4px 6px', width: '60px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skillsList.map((sk, idx) => (
                        <tr key={sk.id || idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '4px 6px', fontWeight: 'bold', color: '#000080' }}>{sk.name}</td>
                          <td style={{ padding: '4px 6px' }}>{sk.required}</td>
                          <td style={{ padding: '4px 6px' }}>{sk.experience}</td>
                          <td style={{ padding: '4px 6px', color: '#f59e0b' }}>{'⭐'.repeat(sk.rating || 5)}</td>
                          <td style={{ padding: '4px 6px' }}>{sk.lastUsed}</td>
                          <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                            <span
                              onClick={() => setSkillsList(prev => prev.filter(s => s.id !== sk.id))}
                              style={{ color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              ❌
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ marginTop: '12px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={handleSaveCandidateDetails}
                      style={{ background: '#e2e8f0', border: '1px solid #71717a', color: '#0f172a', padding: '3px 16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Save Skills
                    </button>
                  </div>
                </div>
              )}

              {/* ─── 3. REFERENCES TAB ─── */}
              {activeTab === 'references' && (
                <div>
                  <div style={{ textAlign: 'right', marginBottom: '8px' }}>
                    <span
                      onClick={() => {
                        const name = prompt('Reference Person Name:')
                        const comp = prompt('Company:')
                        if (name) {
                          setReferences(prev => [...prev, {
                            id: Date.now(),
                            name,
                            company: comp || 'Client Firm',
                            designation: 'Manager',
                            phone: '555-0199',
                            email: `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
                            verificationStatus: 'Verified'
                          }])
                        }
                      }}
                      style={{ color: '#0033cc', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Add Reference
                    </span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #7f9db9', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#708090', color: '#ffffff' }}>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff' }}>Reference Name</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff' }}>Company & Title</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff' }}>Contact Phone / Email</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff' }}>Status</th>
                        <th style={{ padding: '4px 6px', width: '50px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {references.map((rf, idx) => (
                        <tr key={rf.id || idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '4px 6px', fontWeight: 'bold', color: '#000080' }}>{rf.name}</td>
                          <td style={{ padding: '4px 6px' }}>{rf.company} ({rf.designation})</td>
                          <td style={{ padding: '4px 6px' }}>{rf.phone} | {rf.email}</td>
                          <td style={{ padding: '4px 6px', color: '#166534', fontWeight: 'bold' }}>{rf.verificationStatus}</td>
                          <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                            <span
                              onClick={() => setReferences(prev => prev.filter(r => r.id !== rf.id))}
                              style={{ color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              ❌
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ marginTop: '12px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={handleSaveCandidateDetails}
                      style={{ background: '#e2e8f0', border: '1px solid #71717a', color: '#0f172a', padding: '3px 16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Update
                    </button>
                  </div>
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
                      { key: 'visa', icon: '🛂', label: 'Visa Copy / Work Auth (H1B/I-797/EAD/GC)', desc: 'Valid H1B Approval Notice, Green Card, or EAD Document' },
                      { key: 'dl', icon: '🪪', label: "Driver's License (State DL Front/Back)", desc: 'Government Photo ID / State Identification' },
                      { key: 'rtr', icon: '📑', label: 'Right to Represent (RTR Form)', desc: 'Signed exclusive right to represent for target requisition' },
                      { key: 'ssn', icon: '🛡️', label: 'SSN Verification Document', desc: 'Social Security Number card copy / background auth' },
                      { key: 'coversheet', icon: '📋', label: 'Candidate Submission Cover Sheet', desc: 'CoolWorks standard submission cover sheet' },
                      { key: 'resume', icon: '📄', label: 'Latest Formatted Resume', desc: 'Current client-ready candidate resume' }
                    ].map(item => {
                      const doc = documents[item.key]
                      const isSelected = activeDocType === item.key

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
                                File: <strong style={{ color: '#0f172a' }}>{doc?.fileName || doc?.title}</strong> ({doc?.size || '150 KB'})
                                {doc?.validity && <span style={{ color: '#166534', marginLeft: '8px', fontWeight: 'bold' }}>• {doc.validity}</span>}
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
                </div>
              )}

              {/* ─── 5. INTERACTION NOTES TAB ─── */}
              {activeTab === 'notes' && (
                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #7f9db9', textAlign: 'left', marginBottom: '14px' }}>
                    <thead>
                      <tr style={{ background: '#708090', color: '#ffffff' }}>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff' }}>Notes</th>
                        <th style={{ padding: '4px 6px', width: '200px' }}>Submitted By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interactionNotes.map((nt, idx) => (
                        <tr key={nt.id || idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px 8px', color: '#0f172a', lineHeight: '1.4' }}>
                            {nt.note}
                          </td>
                          <td style={{ padding: '6px 8px', color: '#000080', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold' }}>{nt.by}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{nt.timestamp}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ border: '1px solid #7f9db9', background: '#f8fafc', padding: '10px 12px' }}>
                    <label style={{ color: '#000080', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Write Note</label>
                    <textarea
                      rows={3}
                      value={newNoteText}
                      onChange={e => setNewNoteText(e.target.value)}
                      placeholder="Add recruiter feedback, interview notes, client screening comments..."
                      style={{ width: '100%', padding: '4px', fontSize: '11px', border: '1px solid #7f9db9', boxSizing: 'border-box', marginBottom: '6px' }}
                    />
                    <div style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={handleAddNote}
                        style={{ background: '#e2e8f0', border: '1px solid #71717a', color: '#0f172a', padding: '3px 16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
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
                    Candidate was submitted for these requisitions:
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', border: '1px solid #7f9db9', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#708090', color: '#ffffff' }}>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff' }}>Requisition#</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff' }}>Position Title</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff', width: '70px' }}>Start Date</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff', width: '70px' }}>End Date</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff' }}>End Client</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff', width: '60px' }}>Bill Rate</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #ffffff', width: '60px' }}>Pay Rate</th>
                        <th style={{ padding: '4px 6px', width: '50px', textAlign: 'center' }}>History</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissionHistory.map((sub, idx) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '4px 6px', fontWeight: 'bold', color: '#0033cc' }}>{sub.reqId}</td>
                          <td style={{ padding: '4px 6px', color: '#0033cc' }}>{sub.positionTitle}</td>
                          <td style={{ padding: '4px 6px' }}>{sub.startDate}</td>
                          <td style={{ padding: '4px 6px' }}>{sub.endDate}</td>
                          <td style={{ padding: '4px 6px' }}>{sub.endClient}</td>
                          <td style={{ padding: '4px 6px', color: '#0033cc' }}>{sub.billRate}</td>
                          <td style={{ padding: '4px 6px', color: '#0033cc' }}>{sub.payRate}</td>
                          <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                            <span style={{ color: '#0033cc', cursor: 'pointer', textDecoration: 'underline' }}>{sub.historyText}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ─── 7. PROJECTS TAB ─── */}
              {activeTab === 'projects' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#000080' }}>
                      💼 Candidate Project & Engagement History
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const clientName = prompt('Enter Client Name:')
                        const roleTitle = prompt('Enter Role Title:')
                        if (clientName) {
                          setProjectsList(prev => [...prev, {
                            id: Date.now(),
                            client: clientName,
                            role: roleTitle || 'Consultant',
                            duration: '2022 - 2024',
                            location: 'Remote',
                            description: 'Led technical delivery and architecture implementation.'
                          }])
                        }
                      }}
                      style={{ border: '1px solid #7f9db9', background: '#f8fafc', padding: '2px 8px', fontSize: '10.5px', cursor: 'pointer' }}
                    >
                      + Add Project
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {projectsList.map(proj => (
                      <div key={proj.id} style={{ border: '1px solid #cbd5e1', padding: '10px 12px', background: '#f8fafc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ color: '#000080' }}>{proj.client} — {proj.role}</strong>
                          <span style={{ color: '#64748b', fontSize: '10.5px' }}>{proj.duration} ({proj.location})</span>
                        </div>
                        <p style={{ margin: 0, color: '#334155', lineHeight: '1.4' }}>{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── 8. AI MATCH TAB ─── */}
              {activeTab === 'ai_fit' && (
                <div>
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '10px 14px', borderRadius: '4px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#166534' }}>⚡ AI Match Score: 94% (Exceptional Match)</span>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                          Strong alignment with Requisition #{reqContext?.id || candidate.reqId || '158964'} core competencies.
                        </div>
                      </div>
                      <span style={{ background: '#16a34a', color: '#ffffff', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                        Ready for Submission
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ border: '1px solid #cbd5e1', padding: '8px 10px', background: '#f8fafc' }}>
                      <strong style={{ color: '#166534', display: 'block', marginBottom: '4px' }}>✅ Key Strengths:</strong>
                      <ul style={{ margin: 0, paddingLeft: '16px', color: '#334155', lineHeight: '1.4' }}>
                        <li>15+ Years Enterprise Data Architecture and ETL experience.</li>
                        <li>Extensive hands-on expertise in Informatica IICS and PowerCenter.</li>
                        <li>Comfortable with state government client engagements.</li>
                      </ul>
                    </div>

                    <div style={{ border: '1px solid #cbd5e1', padding: '8px 10px', background: '#f8fafc' }}>
                      <strong style={{ color: '#b45309', display: 'block', marginBottom: '4px' }}>🔍 Verification Items:</strong>
                      <ul style={{ margin: 0, paddingLeft: '16px', color: '#334155', lineHeight: '1.4' }}>
                        <li>Verify exact start date availability (2 weeks notice period).</li>
                        <li>Confirm willingness for hybrid schedule in Texas if required.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ──── RIGHT PANEL (44% Width, Live Resume & Document Viewer) ──── */}
          <div style={{ width: '44%', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>
            
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
                  <option value="resume">📄 Resume (Current)</option>
                  <option value="visa">🛂 Visa Copy / Work Auth</option>
                  <option value="dl">🪪 Driver's License (DL)</option>
                  <option value="rtr">📑 Right To Represent (RTR)</option>
                  <option value="ssn">🛡️ SSN Verification</option>
                  <option value="coversheet">📋 Candidate Cover Sheet</option>
                </select>
              </div>

              {/* Zoom & Action Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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

                <button
                  type="button"
                  onClick={() => alert(`⬇️ Downloading ${currentDoc.title}...`)}
                  style={{ border: '1px solid #7f9db9', background: '#ffffff', padding: '1px 8px', cursor: 'pointer', fontSize: '10.5px', marginLeft: '4px' }}
                >
                  ⬇️ Download
                </button>
              </div>
            </div>

            {/* Viewer Document Canvas */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', justifyContent: 'center' }}>
              
              <div style={{
                width: '100%',
                maxWidth: '650px',
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
                    {currentDoc.fileData && currentDoc.fileType?.includes('image') ? (
                      <img src={currentDoc.fileData} alt="Uploaded Resume" style={{ width: '100%', display: 'block' }} />
                    ) : (
                      <div>
                        {/* Header */}
                        <div style={{ textAlign: 'center', borderBottom: '2px solid #000080', paddingBottom: '10px', marginBottom: '14px' }}>
                          <h2 style={{ margin: 0, fontSize: '18px', color: '#000080', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {formData.firstName} {formData.lastName}
                          </h2>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0284c7', marginTop: '2px' }}>
                            {formData.jobTitle}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '4px' }}>
                            {formData.city}, {formData.state} {formData.zip} | Cell: {formData.phoneCell} | Email: {formData.email}
                          </div>
                          <div style={{ fontSize: '10px', color: '#166534', fontWeight: 'bold', marginTop: '2px' }}>
                            Work Authorization: {formData.workAuth} | Total Experience: {formData.experience}+ Years
                          </div>
                        </div>

                        {/* Professional Summary */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ background: '#f1f5f9', padding: '3px 6px', fontWeight: 'bold', color: '#000080', borderLeft: '3px solid #000080', marginBottom: '6px' }}>
                            PROFESSIONAL SUMMARY
                          </div>
                          <p style={{ margin: 0, fontSize: '10.5px', color: '#334155', lineHeight: '1.5' }}>
                            Accomplished <strong>{formData.jobTitle}</strong> with over <strong>{formData.experience} years</strong> of progressive IT experience specializing in Enterprise Data Warehousing, ETL Architecture, Cloud Migrations, and Business Intelligence solutions for state and federal clients. Proven expertise in data ingestion, transformation, performance tuning, and technical leadership across multi-terabyte analytics environments.
                          </p>
                        </div>

                        {/* Core Technical Skills */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ background: '#f1f5f9', padding: '3px 6px', fontWeight: 'bold', color: '#000080', borderLeft: '3px solid #000080', marginBottom: '6px' }}>
                            CORE TECHNICAL SKILLS
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '4px', fontSize: '10px' }}>
                            <strong>ETL / Integration:</strong>
                            <span>Informatica PowerCenter 10.x, Informatica IICS (CDI, CAI), SSIS, Talend</span>
                            <strong>Databases & Cloud:</strong>
                            <span>Oracle 19c, Snowflake, AWS S3, Redshift, Microsoft SQL Server, PostgreSQL</span>
                            <strong>Languages & Query:</strong>
                            <span>SQL, PL/SQL, Python, Unix Shell Scripting, T-SQL</span>
                            <strong>BI & Analytics:</strong>
                            <span>Power BI, Tableau, SSRS, Business Objects XI</span>
                            <strong>Methodologies:</strong>
                            <span>Agile Scrum, Waterfall, CI/CD Pipelines, Data Governance</span>
                          </div>
                        </div>

                        {/* Professional Experience */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ background: '#f1f5f9', padding: '3px 6px', fontWeight: 'bold', color: '#000080', borderLeft: '3px solid #000080', marginBottom: '6px' }}>
                            PROFESSIONAL EXPERIENCE
                          </div>

                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#0f172a' }}>
                              <span>Texas Department of Transportation (TxDOT) — Austin, TX</span>
                              <span style={{ color: '#64748b' }}>Mar 2023 - Present</span>
                            </div>
                            <div style={{ fontStyle: 'italic', color: '#000080', fontSize: '10.5px', marginBottom: '3px' }}>
                              Lead Informatica IICS / Cloud Data Architect
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10px', color: '#334155', lineHeight: '1.4' }}>
                              <li>Designed and deployed cloud data integration pipelines in Informatica Intelligent Cloud Services (IICS) connecting Oracle ERP to Snowflake data warehouse.</li>
                              <li>Optimized SQL execution plans and partitioned massive tables, reducing nightly batch ETL execution windows by 42%.</li>
                              <li>Ensured strict compliance with Texas State Data Security and CJIS privacy standards.</li>
                            </ul>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#0f172a' }}>
                              <span>Wisconsin Dept of Health Services — Madison, WI</span>
                              <span style={{ color: '#64748b' }}>Jan 2021 - Feb 2023</span>
                            </div>
                            <div style={{ fontStyle: 'italic', color: '#000080', fontSize: '10.5px', marginBottom: '3px' }}>
                              Senior ETL & Business Intelligence Consultant
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10px', color: '#334155', lineHeight: '1.4' }}>
                              <li>Constructed star-schema analytical models and automated Medicaid encounter extract feeds.</li>
                              <li>Collaborated directly with State Program Directors and technical panels for sprint deliverables.</li>
                            </ul>
                          </div>
                        </div>

                        {/* Education & Certifications */}
                        <div>
                          <div style={{ background: '#f1f5f9', padding: '3px 6px', fontWeight: 'bold', color: '#000080', borderLeft: '3px solid #000080', marginBottom: '6px' }}>
                            EDUCATION & CERTIFICATIONS
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#334155' }}>
                            <div>• <strong>Bachelor of Science in Computer Science & Engineering</strong> — Accredited University</div>
                            <div>• <strong>Informatica Certified Cloud Specialist</strong> (IICS CDI)</div>
                            <div>• <strong>Snowflake Certified Core Architect</strong> (SnowPro)</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── LIVE VISA / WORK AUTH RENDERER ─── */}
                {activeDocType === 'visa' && (
                  <div>
                    {currentDoc.fileData ? (
                      <img src={currentDoc.fileData} alt="Uploaded Visa" style={{ width: '100%', display: 'block' }} />
                    ) : (
                      <div style={{ border: '2px solid #1e3a8a', padding: '20px', background: '#fafaf9', borderRadius: '4px' }}>
                        <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '10px', marginBottom: '14px' }}>
                          <span style={{ fontSize: '32px' }}>🛂</span>
                          <h3 style={{ margin: '4px 0', color: '#1e3a8a' }}>UNITED STATES DEPARTMENT OF HOMELAND SECURITY</h3>
                          <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '12px' }}>
                            FORM I-797A NOTICE OF ACTION — WORK AUTHORIZATION APPROVAL
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', fontSize: '11px' }}>
                          <strong>Beneficiary Name:</strong>
                          <span>{formData.lastName}, {formData.firstName}</span>

                          <strong>Work Authorization:</strong>
                          <span style={{ color: '#000080', fontWeight: 'bold' }}>{formData.workAuth} Classification (Specialty Occupation)</span>

                          <strong>Valid From:</strong>
                          <span>10/01/2025 to 09/30/2028</span>

                          <strong>Petitioning Sub-Vendor:</strong>
                          <span>{formData.subVendor}</span>

                          <strong>Verification Status:</strong>
                          <span style={{ color: '#166534', fontWeight: 'bold' }}>✅ USCIS E-Verify Verified & Compliant</span>
                        </div>

                        <div style={{ marginTop: '20px', padding: '10px', background: '#f0fdf4', border: '1px dashed #22c55e', fontSize: '10.5px', color: '#166534', textAlign: 'center' }}>
                          Verified by SmartHire Compliance Team on Aug 20, 2026 for Requisition Submission.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── LIVE DRIVER'S LICENSE RENDERER ─── */}
                {activeDocType === 'dl' && (
                  <div>
                    {currentDoc.fileData ? (
                      <img src={currentDoc.fileData} alt="Uploaded DL" style={{ width: '100%', display: 'block' }} />
                    ) : (
                      <div style={{ border: '2px solid #000080', padding: '20px', background: '#f0f9ff', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000080', paddingBottom: '8px', marginBottom: '14px' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#000080' }}>STATE OF {formData.state} — DRIVER LICENSE</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>DEPARTMENT OF PUBLIC SAFETY / REAL ID COMPLIANT ⭐</div>
                          </div>
                          <span style={{ fontSize: '28px' }}>🪪</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '11px' }}>
                          <strong>Full Name:</strong>
                          <span>{formData.firstName} {formData.lastName}</span>

                          <strong>Address:</strong>
                          <span>{formData.address}, {formData.city}, {formData.state} {formData.zip}</span>

                          <strong>License Number:</strong>
                          <span>TX-71249821</span>

                          <strong>DOB / Expiration:</strong>
                          <span>DOB: {formData.dob || '1983-05-14'} | Exp: 11/2029</span>

                          <strong>Status:</strong>
                          <span style={{ color: '#166534', fontWeight: 'bold' }}>✅ Active & Clear (Real ID Verified)</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── LIVE RTR / COVERSHEET / SSN RENDERER ─── */}
                {(activeDocType === 'rtr' || activeDocType === 'coversheet' || activeDocType === 'ssn') && (
                  <div style={{ border: '1px solid #7f9db9', padding: '20px', background: '#fafafa' }}>
                    <div style={{ textAlign: 'center', borderBottom: '2px solid #000080', paddingBottom: '10px', marginBottom: '14px' }}>
                      <span style={{ fontSize: '28px' }}>{activeDocType === 'rtr' ? '📑' : activeDocType === 'ssn' ? '🛡️' : '📋'}</span>
                      <h3 style={{ margin: '4px 0', color: '#000080' }}>
                        {activeDocType === 'rtr' ? 'RIGHT TO REPRESENT (RTR) AGREEMENT' : activeDocType === 'ssn' ? 'SSN VERIFICATION & CONSENT' : 'CANDIDATE SUBMISSION COVER SHEET'}
                      </h3>
                      <div style={{ fontSize: '11px', color: '#475569' }}>
                        Requisition #{reqContext?.id || candidate.reqId || '158964'} | Customer: {reqContext?.client || 'State Of TX'}
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', lineHeight: '1.6', color: '#334155' }}>
                      <p>
                        I, <strong>{formData.firstName} {formData.lastName}</strong>, hereby grant SmartHire / CoolSoft exclusive right to represent my profile and submit my candidacy for the position of <strong>{formData.jobTitle}</strong> with <strong>{reqContext?.client || 'State Of TX'}</strong>.
                      </p>
                      <p>
                        Agreed Pay Rate: <strong>${formData.payRate}/hr ({formData.rateType})</strong> | Work Authorization: <strong>{formData.workAuth}</strong>.
                      </p>
                      <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
                        <div>
                          <strong>Candidate Signature:</strong> <em>{formData.firstName} {formData.lastName}</em>
                        </div>
                        <div>
                          <strong>Date:</strong> {formData.availableDate}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
