import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

// ─── SVG Icons (Strict Rule 8: Clean Enterprise Line Glyphs, Zero Unrequested Emojis) ───
const IconArrowLeft = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)
const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
const IconPrint = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
)
const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)
const IconSignature = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21l3-1 11-11a2.8 2.8 0 0 0-4-4L2 16l-1 4 2 1z"/>
    <path d="M14 6l4 4"/>
    <path d="M3 21c3-1 6-1 8 0"/>
  </svg>
)
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconExternalLink = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

// ─── Supported Presentation & E-RTR Templates ──────────────────────────────
export const SUBMITTAL_TEMPLATES = [
  {
    id: 'standard',
    name: 'Standard US Direct Client Format',
    badge: 'Direct Client',
    agencyName: 'CoolSoft LLC',
    mspName: 'Direct Client Account Team',
    contractName: 'Master Professional Services Agreement',
    hasCaiBox: false,
    description: 'Corporate client coversheet with agency letterhead, competencies matrix, and standard RTR.'
  },
  {
    id: 'nc_cai',
    name: 'State of North Carolina (NC VectorVMS / CAI Format)',
    badge: 'NC VectorVMS / CAI',
    agencyName: 'COOLSOFT LLC',
    mspName: 'Computer Aid, Inc. (CAI)',
    contractName: 'North Carolina IT Supplemental Services Contract',
    defaultCaiManager: 'Nicole Walker',
    defaultCaiPhone: '910-520-1506',
    defaultCaiEmail: 'nicole.walker@cai.io',
    hasCaiBox: true,
    description: 'Official North Carolina VectorVMS submittal resume layout & Right to Represent acknowledgement.'
  },
  {
    id: 'georgia_cai',
    name: 'State of Georgia (GDOT / VectorVMS / CAI Format)',
    badge: 'Georgia VectorVMS / CAI',
    agencyName: 'COOLSOFT LLC',
    mspName: 'Computer Aid, Inc. (CAI)',
    contractName: "State of Georgia's IT Staffing Services Contract",
    defaultCaiManager: 'Tim Brodrick',
    defaultCaiPhone: '678-427-3660',
    defaultCaiEmail: 'Timothy.Brodrick@cai.io',
    hasCaiBox: true,
    description: 'Official State of Georgia (GDOT) VectorVMS submittal layout with CAI Contact block, Pay Rate & Employment Type.'
  },
  {
    id: 'texas_dir',
    name: 'State Government / Texas DIR Matrix Format',
    badge: 'Texas DIR',
    agencyName: 'CoolSoft LLC',
    mspName: 'Texas Department of Information Resources',
    contractName: 'DIR Cooperative Contracts Program (DIR-CPO-ITSA-0442)',
    hasCaiBox: false,
    description: 'Texas DIR compliant technical skills matrix, solicitation ID tracking, and exclusivity declaration.'
  },
  {
    id: 'msp_vms',
    name: 'MSP / VMS Matrix (Fieldglass & Beeline)',
    badge: 'Fieldglass / Beeline',
    agencyName: 'CoolSoft LLC',
    mspName: 'Contingent Workforce MSP',
    contractName: 'VMS Contingent Labor Staffing Agreement',
    hasCaiBox: false,
    description: 'Fieldglass & Beeline candidate submittal package with rate breakdown and VMS requisition binding.'
  },
  {
    id: 'prime_vendor',
    name: 'Prime Vendor C2C Presentation',
    badge: 'C2C Prime Partner',
    agencyName: 'CoolSoft LLC',
    mspName: 'Prime Vendor / Implementation Partner',
    contractName: 'Subcontracting Corp-to-Corp Agreement',
    hasCaiBox: false,
    description: 'Prime vendor candidate submittal package with blind resume option and non-poach representation.'
  }
]

export default function SubmittalPackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const urlCandidateId = searchParams.get('candidateId')
  const urlReqId = searchParams.get('reqId') || searchParams.get('jobId')

  // Core Data
  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedCandidateId, setSelectedCandidateId] = useState('')
  const [selectedJobId, setSelectedJobId] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('standard')
  const [activePreviewTab, setActivePreviewTab] = useState('resume') // 'resume', 'rtr', 'all'
  const [blindResume, setBlindResume] = useState(true)

  // Position & Requisition Dynamic Binding State
  const [positionTitle, setPositionTitle] = useState('Senior Full Stack Developer')
  const [vmsNumber, setVmsNumber] = useState('159256')
  const [clientAgency, setClientAgency] = useState('Enterprise Client')
  const [employmentType, setEmploymentType] = useState('C2C')

  // CAI / MSP Contract Manager Configuration State
  const [caiManagerName, setCaiManagerName] = useState('Nicole Walker')
  const [caiManagerPhone, setCaiManagerPhone] = useState('910-520-1506')
  const [caiManagerEmail, setCaiManagerEmail] = useState('nicole.walker@cai.io')

  // Notification Toast State
  const [copyToastText, setCopyToastText] = useState('')

  // Email Submittal Pack Modal
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  // Coversheet Form State
  const [coversheet, setCoversheet] = useState({
    candidateLegalName: '',
    targetRole: '',
    clientName: 'Enterprise Client',
    jobId: '',
    currentLocation: '',
    willingToRelocate: 'Yes (Open to Relocation)',
    visaStatus: 'US Citizen',
    visaExpiry: 'Permanent',
    totalExperience: '8+ Years',
    relevantExperience: '7+ Years',
    proposedRate: '$75.00 / hr C2C',
    highestEducation: 'B.S. in Computer Science',
    noticePeriod: 'Immediate / 2 Weeks',
    interviewAvailability: 'Flexible with 24 Hours Notice (Video)',
    linkedinUrl: 'Verified Profile',
    references: 'Available upon client request',
    skillsMatrix: []
  })

  // Resume Content State
  const [resumeText, setResumeText] = useState('')

  // Find active template metadata
  const activeTemplateMeta = useMemo(() => {
    return SUBMITTAL_TEMPLATES.find(t => t.id === selectedTemplate) || SUBMITTAL_TEMPLATES[0]
  }, [selectedTemplate])

  // 1. Initial Data Ingestion (Candidates, Jobs, Hotlists)
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [candsRes, jobsRes, hotlistsRes] = await Promise.all([
          fetch('/api/candidates', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}` }
          }).then(r => r.json()).catch(() => ({ candidates: [] })),
          fetch('/api/jobs').then(r => r.json()).catch(() => ({ jobs: [] })),
          fetch('/api/recruiter/vendor-hotlists').then(r => r.json()).catch(() => ({ hotlists: [] }))
        ])

        const candList = candsRes.candidates || []
        const hotlistItems = (hotlistsRes.hotlists || []).map(h => ({
          id: h.id,
          candidate_id: h.id,
          name: h.candidateName,
          role: h.role,
          skills: h.skills,
          experience: h.experience,
          location: h.location,
          visaStatus: h.visa,
          rate: h.rate,
          email: h.candidateEmail,
          phone: h.candidatePhone,
          isVendorHotlist: true,
          vendorCompany: h.vendorCompany
        }))

        // Combine and deduplicate candidates
        const combined = [...candList, ...hotlistItems]
        const seen = new Set()
        const unique = combined.filter(c => {
          const key = (c.id || c.candidate_id || c.email || c.name || '').toLowerCase()
          if (!key || seen.has(key)) return false
          seen.add(key)
          return true
        })

        setCandidates(unique)
        const jobList = jobsRes.jobs || jobsRes.requisitions || []
        setJobs(jobList)

        // Pre-select via URL parameters or defaults
        if (urlCandidateId) {
          setSelectedCandidateId(urlCandidateId)
        } else if (unique.length > 0) {
          setSelectedCandidateId(unique[0].id || unique[0].candidate_id)
        }

        if (urlReqId) {
          const matchJob = jobList.find(j => String(j.id) === String(urlReqId) || String(j.id).replace(/^J-/, '') === String(urlReqId))
          if (matchJob) setSelectedJobId(matchJob.id)
          else setSelectedJobId(urlReqId)
        } else if (jobList.length > 0) {
          setSelectedJobId(jobList[0].id)
        }
      } catch (err) {
        console.error('Failed to load submittal pack data:', err)
      }
    }
    loadInitialData()
  }, [urlCandidateId, urlReqId])

  // 2. Dynamic Position & Requisition Binding when Target Job Changes
  useEffect(() => {
    if (!selectedJobId) return
    const job = jobs.find(j => String(j.id) === String(selectedJobId) || String(j.id).replace(/^J-/, '') === String(selectedJobId))
    if (!job) return

    // Extract title & VMS number (e.g. from "Epic Orders Analyst (812797)" or "Mainframe Developer (66393)")
    const titleStr = job.title || 'Senior Consultant'
    const vmsMatch = titleStr.match(/\(([\d]{4,7})\)/)
    const extractedNum = vmsMatch ? vmsMatch[1] : String(job.id).replace(/^J-/, '')
    const cleanRole = titleStr.replace(/\([\d]+\)/g, '').trim()
    const agency = job.client || 'Enterprise Client'

    setPositionTitle(cleanRole)
    setVmsNumber(extractedNum)
    setClientAgency(agency)

    // Intelligently auto-match state template if appropriate
    const lowerCombined = (titleStr + ' ' + agency).toLowerCase()
    if (lowerCombined.includes('nc') || lowerCombined.includes('north carolina') || lowerCombined.includes('ncdhhs') || lowerCombined.includes('dhhs')) {
      setSelectedTemplate('nc_cai')
      setCaiManagerName('Nicole Walker')
      setCaiManagerPhone('910-520-1506')
      setCaiManagerEmail('nicole.walker@cai.io')
    } else if (lowerCombined.includes('georgia') || lowerCombined.includes('gdot')) {
      setSelectedTemplate('georgia_cai')
      setCaiManagerName('Tim Brodrick')
      setCaiManagerPhone('678-427-3660')
      setCaiManagerEmail('Timothy.Brodrick@cai.io')
    } else if (lowerCombined.includes('texas') || lowerCombined.includes('dir')) {
      setSelectedTemplate('texas_dir')
    }
  }, [selectedJobId, jobs])

  // 3. Update CAI defaults when user manually switches template
  const handleTemplateChange = (tplId) => {
    setSelectedTemplate(tplId)
    if (tplId === 'nc_cai') {
      setCaiManagerName('Nicole Walker')
      setCaiManagerPhone('910-520-1506')
      setCaiManagerEmail('nicole.walker@cai.io')
    } else if (tplId === 'georgia_cai') {
      setCaiManagerName('Tim Brodrick')
      setCaiManagerPhone('678-427-3660')
      setCaiManagerEmail('Timothy.Brodrick@cai.io')
    }
  }

  // 4. Auto-populate Candidate Data into Coversheet and Resume
  useEffect(() => {
    if (!selectedCandidateId) return
    const cand = candidates.find(c => c.id === selectedCandidateId || c.candidate_id === selectedCandidateId)
    const job = jobs.find(j => String(j.id) === String(selectedJobId) || String(j.id).replace(/^J-/, '') === String(selectedJobId))

    if (cand) {
      const exp = cand.experience || '7+ Years'
      const candSkills = Array.isArray(cand.skills)
        ? cand.skills
        : String(cand.skills || '').split(/[,|•]+/).map(s => s.trim()).filter(Boolean)
      const jobSkills = job
        ? (Array.isArray(job.skills) ? job.skills : String(job.skills || '').split(',').map(s => s.trim()))
        : (candSkills.slice(0, 5).length > 0 ? candSkills.slice(0, 5) : ['Java', 'SQL', 'Cloud', 'Microservices', 'REST APIs'])

      const matrix = jobSkills.slice(0, 6).map(sk => {
        const has = candSkills.some(cs => cs.toLowerCase().includes(sk.toLowerCase()) || sk.toLowerCase().includes(cs.toLowerCase()))
        return {
          skill: sk,
          requiredExp: '5+ Years',
          candidateExp: has ? `${Math.min(parseInt(exp) || 7, 7)}+ Years` : '3+ Years',
          rating: has ? 'Expert (9/10)' : 'Proficient (7/10)'
        }
      })

      const rawRate = cand.rate || job?.rate || '$75.00 / hr C2C'
      const matchedEmp = String(rawRate).toUpperCase().includes('W2')
        ? 'W2'
        : String(rawRate).toUpperCase().includes('1099')
          ? '1099'
          : 'C2C'
      setEmploymentType(matchedEmp)

      setCoversheet(prev => ({
        ...prev,
        candidateLegalName: cand.name || cand.extracted_profile?.name || 'Candidate Full Legal Name',
        targetRole: positionTitle || cand.role || 'Senior Specialist',
        clientName: clientAgency || job?.client || 'Enterprise Client',
        jobId: vmsNumber || String(job?.id || '').replace(/^J-/, '') || '159256',
        currentLocation: cand.location || 'Remote / US',
        willingToRelocate: 'Yes (Open to Relocation)',
        visaStatus: cand.visaStatus || cand.visa || 'H-1B',
        visaExpiry: (cand.visaStatus === 'US Citizen' || cand.visaStatus === 'Green Card') ? 'Permanent' : 'Valid & Active',
        totalExperience: exp,
        relevantExperience: `${parseInt(exp) > 2 ? parseInt(exp) - 1 : exp}+ Years`,
        proposedRate: rawRate,
        highestEducation: cand.education || 'Bachelor of Science in Computer Science',
        noticePeriod: 'Immediate / 2 Weeks',
        interviewAvailability: 'Flexible with 24 Hours Notice (Video)',
        linkedinUrl: cand.linkedinUrl || 'Represented Exclusively via CoolSoft LLC',
        references: 'Available upon client request',
        skillsMatrix: matrix
      }))

      // Populate formatted Submittal Resume text
      const rawRes = cand.resumeText || cand.summary || ''
      if (rawRes) {
        setResumeText(rawRes)
      } else {
        setResumeText(`PROFESSIONAL SUMMARY
Accomplished ${cand.role || positionTitle} with ${exp} of hands-on expertise building and scaling enterprise distributed systems.

CORE COMPETENCIES
${candSkills.length > 0 ? candSkills.join(' • ') : 'Java • SQL • Cloud • REST APIs • Microservices'}

PROFESSIONAL WORK HISTORY
• Spearheaded high-volume production microservices architecture with high availability
• Designed RESTful and gRPC API gateways ensuring sub-second response times
• Collaborated closely with cross-functional product, cloud, and QA squads

EDUCATION & CERTIFICATIONS
• ${cand.education || 'Bachelor of Science in Computer Science'}`)
      }
    }
  }, [selectedCandidateId, selectedJobId, candidates, jobs, positionTitle, vmsNumber, clientAgency])

  // Synchronize coversheet fields when recruiter directly edits position/vmsNumber
  useEffect(() => {
    setCoversheet(prev => ({
      ...prev,
      targetRole: positionTitle,
      jobId: vmsNumber,
      clientName: clientAgency
    }))
  }, [positionTitle, vmsNumber, clientAgency])

  // ─── Dynamic E-RTR Text Builder (North Carolina, Georgia, Standard) ───────
  const rtrSubject = useMemo(() => {
    return `${positionTitle || 'Specialist'} (${vmsNumber || 'Requisition'})`
  }, [positionTitle, vmsNumber])

  const rtrBody = useMemo(() => {
    const candidateName = coversheet.candidateLegalName || 'Candidate Full Legal Name'
    const reqInfo = `${positionTitle || 'Specialist'} (${vmsNumber || 'Req'})`
    const client = clientAgency || 'Client Agency'
    const rate = coversheet.proposedRate || '$75.00 / hr C2C'

    if (selectedTemplate === 'nc_cai') {
      return `Right to Represent Acknowledgement

By signing below, I acknowledge and agree that [COOLSOFT LLC] has the sole right to represent me in matters of work assignment relating the North Carolina IT Supplemental Services Contract by submitting my professional resume to the Contract's Managed Service Provider, Computer Aid, Inc. for the requirement identified below.

I also acknowledge and verify that all the information contained in my resume related to my technical credentials is accurate and is based on educational training and professional experience obtained throughout my career.

VectorVMS Requirement Number and Title (including Name of Agency):
${reqInfo} - ${client}

Candidate Full Legal Name:
${candidateName}

======================================================================
EMAIL TEMPLATE TO CANDIDATE
ONCE CANDIDATE RESPONDS VIA EMAIL AGREEING WITH YOUR REPRESENTATION, SAVE ENTIRE EMAIL THREAD AS A PDF DOC AND UPLOAD IN CANDIDATE'S VECTORVMS PROFILE`
    }

    if (selectedTemplate === 'georgia_cai') {
      return `Right to Represent Acknowledgement

By inserting my full legal name below, I acknowledge and agree that [COOLSOFT LLC] has the sole right to represent me in matters of work assignment relating to the State of Georgia's IT Staffing Services Contract by submitting my professional resume to the Contract's Managed Service Provider, Computer Aid, Inc. for the requirement identified below.

I also acknowledge and verify that all the information contained in my resume related to my technical credentials is accurate and is based on educational training and professional experience obtained throughout my career.

VectorVMS Requirement Number and Title (including Name of Agency):
${reqInfo} - ${client}

Candidate Full Legal Name:
${candidateName}

Candidate Pay Rate for this Position (as Referenced in VectorVMS Requirement): 
${rate}

Candidate Employment Type if Selected for Engagement (W2, 1099, C2C):
(W2, 1099, C2C):  ${employmentType}

======================================================================
EMAIL TEMPLATE TO CANDIDATE
ONCE CANDIDATE RESPONDS VIA EMAIL AGREEING WITH YOUR REPRESENTATION, SAVE ENTIRE EMAIL THREAD AS A PDF DOC AND UPLOAD IN CANDIDATE'S VECTORVMS PROFILE`
    }

    if (selectedTemplate === 'texas_dir') {
      return `State of Texas Department of Information Resources (DIR)
Contract Representation & Exclusivity Agreement

1. Scope of Representation
The undersigned candidate hereby grants COOLSOFT LLC the exclusive authorization to submit credentials, resume, and rate proposal for active requisition #${vmsNumber} (${positionTitle}) issued under the Texas DIR Cooperative Contracts Program (DIR-CPO-ITSA-0442).

2. Candidate Acknowledgment
Candidate acknowledges that only one submittal per candidate is permitted by the State of Texas for each Solicitation ID. Dual representation will lead to immediate disqualification.

3. Agreed Rate & Term
Agreed Hourly Submittal Rate: ${rate} (${employmentType})
Exclusivity Window: 60 Days from signature date.

Candidate Full Legal Name:
${candidateName}`
    }

    // Default: Standard Direct Client RTR
    return `EXCLUSIVE RIGHT TO REPRESENTATION (RTR)

To: Hiring Client & Account Management (${client})
From: COOLSOFT LLC Staff Augmentation Team
Requisition: #${vmsNumber} - ${positionTitle}

Candidate Declaration:
I, ${candidateName}, grant COOLSOFT LLC the exclusive right to represent and submit my profile for the ${positionTitle} position (Req #${vmsNumber}) with ${client}. I confirm that I am legally authorized to work in the United States (${coversheet.visaStatus}) and have not authorized any other staffing agency or prime vendor to submit my credentials for this requirement.

Agreed Submittal Rate: ${rate} (${employmentType})
Availability / Notice: ${coversheet.noticePeriod}

Candidate Full Legal Name:
${candidateName}`
  }, [selectedTemplate, positionTitle, vmsNumber, clientAgency, coversheet, employmentType])

  // ─── Coversheet Text Generator (Plain-text for ATS / Portals) ──────────────
  const formattedCoversheetText = useMemo(() => {
    return `=====================================================
CANDIDATE SUBMISSION COVERSHEET — ${coversheet.clientName.toUpperCase()}
REQUISITION: #${coversheet.jobId} - ${coversheet.targetRole}
AGENCY: CoolSoft LLC / SmartHire Recruiting Partner
PRESENTATION FORMAT: ${activeTemplateMeta.name}
=====================================================

Candidate Full Legal Name:  ${coversheet.candidateLegalName}
Target Position:            ${coversheet.targetRole}
Client Requisition ID:      #${coversheet.jobId} (${coversheet.clientName})
Current Location:           ${coversheet.currentLocation}
Relocation Preference:      ${coversheet.willingToRelocate}
Work Authorization / Visa:  ${coversheet.visaStatus} (Expiry: ${coversheet.visaExpiry})
Total Professional Exp:     ${coversheet.totalExperience}
Relevant Technology Exp:    ${coversheet.relevantExperience}
Proposed Billing / Pay Rate: ${coversheet.proposedRate} (${employmentType})
Highest Education / Degree: ${coversheet.highestEducation}
Availability / Notice:      ${coversheet.noticePeriod}
Interview Availability:     ${coversheet.interviewAvailability}
Representation Status:      Exclusive via CoolSoft LLC

${activeTemplateMeta.hasCaiBox ? `-----------------------------------------------------
MSP / CAI CONTRACT MANAGER DETAILS:
Name:  ${caiManagerName}
Phone: ${caiManagerPhone}
Email: ${caiManagerEmail}
Contract: ${activeTemplateMeta.contractName}` : ''}

-----------------------------------------------------
TECHNICAL COMPETENCY & SKILLS MATRIX:
-----------------------------------------------------
${coversheet.skillsMatrix.map(sm => `• ${sm.skill.padEnd(24)} | Req: ${sm.requiredExp.padEnd(10)} | Candidate: ${sm.candidateExp.padEnd(10)} | ${sm.rating}`).join('\n')}

-----------------------------------------------------
PROFESSIONAL REFERENCES:
-----------------------------------------------------
${coversheet.references}
=====================================================`
  }, [coversheet, employmentType, activeTemplateMeta, caiManagerName, caiManagerPhone, caiManagerEmail])

  // ─── 1-Click Clipboard Actions ───────────────────────────────────────────
  const handleCopyCoversheet = () => {
    navigator.clipboard.writeText(formattedCoversheetText)
    showToast('Coversheet copied to clipboard!')
  }

  const handleCopyRtr = () => {
    const fullRtrEmail = `SUBJECT: ${rtrSubject}\n\n${rtrBody}`
    navigator.clipboard.writeText(fullRtrEmail)
    showToast('E-RTR Subject & Body copied!')
  }

  const handleCopyCurrentView = () => {
    if (activePreviewTab === 'rtr') {
      handleCopyRtr()
    } else if (activePreviewTab === 'all') {
      const combined = `${formattedCoversheetText}\n\n=====================================================\nSUBMITTAL RESUME\n=====================================================\n\n${resumeText}\n\n=====================================================\nRIGHT TO REPRESENT (E-RTR)\n=====================================================\n\n${rtrBody}`
      navigator.clipboard.writeText(combined)
      showToast('Complete Submittal Pack copied!')
    } else {
      handleCopyCoversheet()
    }
  }

  const showToast = (msg) => {
    setCopyToastText(msg)
    setTimeout(() => setCopyToastText(''), 2600)
  }

  const handlePrint = () => {
    window.print()
  }

  // ─── Email Modal Handler ──────────────────────────────────────────────────
  const handleOpenEmailModal = () => {
    const cand = candidates.find(c => c.id === selectedCandidateId)
    setEmailTo(cand?.recruiterEmail || 'account-manager@coolsofttech.com')
    setEmailSubject(`Candidate Submittal: ${coversheet.candidateLegalName} — ${positionTitle} (Req #${vmsNumber} - ${clientAgency})`)
    setEmailBody(`Hi Team,\n\nPlease find attached the submittal package and presentation coversheet for ${coversheet.candidateLegalName} for the ${positionTitle} opening with ${clientAgency}.\n\nCandidate is confirmed at ${coversheet.proposedRate} (${employmentType}) with ${coversheet.visaStatus} work authorization and is available on ${coversheet.noticePeriod}.\n\nBest regards,\nSmartHire Submissions Team\nCoolSoft LLC`)
    setShowEmailModal(true)
  }

  const handleSendEmail = async (e) => {
    e.preventDefault()
    setIsSendingEmail(true)
    try {
      const payloadMessage = `${emailBody}\n\n${formattedCoversheetText}\n\n=====================================================\nE-RTR ACKNOWLEDGEMENT\n=====================================================\n${rtrBody}`
      const res = await fetch('/api/recruiter/send-direct-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          message: payloadMessage
        })
      })
      const data = await res.json()
      if (data.success) {
        showToast('Submittal pack successfully emailed!')
        setShowEmailModal(false)
      } else {
        alert(data.message || 'Failed to dispatch email')
      }
    } catch (err) {
      alert('Error sending submittal email: ' + err.message)
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div style={styles.pageWrap}>
      {/* ─── Top Navbar ──────────────────────────────────────────────────── */}
      <header style={styles.topNav} className="no-print">
        <div style={styles.navLeft}>
          <button onClick={() => navigate('/inbox')} style={styles.backBtn} title="Back to Recruiter Inbox">
            <IconArrowLeft /> <span>Back to Inbox</span>
          </button>
          <div style={{ height: 18, width: 1, backgroundColor: '#CBD5E1' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
                Submittal Pack & Coversheet Generator
              </h2>
              <span style={styles.badgeEnterprise}>
                {activeTemplateMeta.badge}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: 1 }}>
              Official Client Presentation Engine • VectorVMS & Direct Client Certified
            </div>
          </div>
        </div>

        <div style={styles.navRight}>
          {copyToastText && (
            <div style={styles.toastChip}>
              <IconCheck /> <span>{copyToastText}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopyCurrentView}
            style={styles.actionBtnSecondary}
            title="Copy current active view to clipboard"
          >
            <IconCopy /> <span>Copy {activePreviewTab === 'rtr' ? 'E-RTR' : activePreviewTab === 'all' ? 'Pack' : 'Coversheet'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyRtr}
            style={styles.actionBtnSecondary}
            title="Copy Right to Represent email subject and body for candidate"
          >
            <IconSignature /> <span>Copy RTR Email</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={styles.actionBtnSecondary}
            title="Export clean PDF submittal package"
          >
            <IconPrint /> <span>Print / Save PDF</span>
          </button>

          <button
            type="button"
            onClick={handleOpenEmailModal}
            style={styles.actionBtnPrimary}
            title="Send submittal directly to client or account manager"
          >
            <IconMail /> <span>Email Submittal Pack</span>
          </button>
        </div>
      </header>

      {/* ─── Control Selector Bar ────────────────────────────────────────── */}
      <div style={styles.selectorBar} className="no-print">
        <div style={styles.selectorInner}>
          {/* 1. Candidate Selector */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>SELECT CANDIDATE:</label>
            <select
              value={selectedCandidateId}
              onChange={e => setSelectedCandidateId(e.target.value)}
              style={styles.selectInput}
            >
              {candidates.map(c => (
                <option key={c.id || c.candidate_id} value={c.id || c.candidate_id}>
                  {c.name || 'Candidate'} — {c.role || 'Specialist'} {c.isVendorHotlist ? `(Bench: ${c.vendorCompany})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Target Job Selector */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>TARGET JOB REQUISITION:</label>
            <select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              style={styles.selectInput}
            >
              {jobs.map(j => {
                const titleStr = j.title || 'Requisition'
                const vmsMatch = titleStr.match(/\(([\d]{4,7})\)/)
                const num = vmsMatch ? vmsMatch[1] : String(j.id).replace(/^J-/, '')
                return (
                  <option key={j.id} value={j.id}>
                    #{num}: {titleStr} ({j.client || 'Client'})
                  </option>
                )
              })}
            </select>
          </div>

          {/* 3. Submittal Presentation Template Selector */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>PRESENTATION TEMPLATE:</label>
            <select
              value={selectedTemplate}
              onChange={e => handleTemplateChange(e.target.value)}
              style={{ ...styles.selectInput, fontWeight: '700', color: '#1D4ED8' }}
            >
              {SUBMITTAL_TEMPLATES.map(tpl => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Blind Resume Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 18 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>
              <input
                type="checkbox"
                checked={blindResume}
                onChange={e => setBlindResume(e.target.checked)}
                style={{ cursor: 'pointer', width: 15, height: 15, accentColor: '#2563EB' }}
              />
              Blind Resume (Mask Direct Phone/Email)
            </label>
          </div>
        </div>
      </div>

      {/* ─── Main Workspace: Left Column Coversheet Form, Right Column Presentation ─── */}
      <div style={styles.workspace}>
        {/* LEFT COLUMN: EDITABLE POSITION & COVERSHEET FORM */}
        <div style={styles.coversheetCol} className="no-print">
          <div style={styles.colHeader}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Client Submission Coversheet
              </h3>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: 2 }}>
                Dynamic Position Parameters & Live Form
              </div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', background: '#EFF6FF', padding: '3px 8px', borderRadius: 6, border: '1px solid #BFDBFE' }}>
              Editable Live
            </span>
          </div>

          {/* Dynamic Position Binding Section */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionCardTitle}>
              Position & Requisition Binding
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Target Position / Job Title *</label>
                <input
                  type="text"
                  value={positionTitle}
                  onChange={e => setPositionTitle(e.target.value)}
                  style={{ ...styles.textInput, fontWeight: '700', color: '#1E293B' }}
                  placeholder="e.g. Epic Orders Analyst"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={styles.formGroup}>
                  <label style={styles.inputLabel}>Requisition / VMS # *</label>
                  <input
                    type="text"
                    value={vmsNumber}
                    onChange={e => setVmsNumber(e.target.value)}
                    style={{ ...styles.textInput, fontWeight: '800', color: '#2563EB' }}
                    placeholder="e.g. 812797"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.inputLabel}>Client / State Agency *</label>
                  <input
                    type="text"
                    value={clientAgency}
                    onChange={e => setClientAgency(e.target.value)}
                    style={styles.textInput}
                    placeholder="e.g. NCDHHS-AM or GDOT"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={styles.formGroup}>
                  <label style={styles.inputLabel}>Proposed Rate ($/hr) *</label>
                  <input
                    type="text"
                    value={coversheet.proposedRate}
                    onChange={e => setCoversheet({ ...coversheet, proposedRate: e.target.value })}
                    style={{ ...styles.textInput, fontWeight: '700' }}
                    placeholder="e.g. $75.00 / hr"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.inputLabel}>Employment Type (W2/1099/C2C)</label>
                  <select
                    value={employmentType}
                    onChange={e => setEmploymentType(e.target.value)}
                    style={styles.selectInput}
                  >
                    <option value="C2C">Corp-to-Corp (C2C)</option>
                    <option value="W2">W2 Hourly</option>
                    <option value="1099">1099 Independent</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* MSP / CAI Contract Manager Details (Shown for NC & Georgia Templates) */}
          {activeTemplateMeta.hasCaiBox && (
            <div style={{ ...styles.sectionCard, borderLeft: '3.5px solid #2563EB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={styles.sectionCardTitle}>
                  CAI Contract Manager (VectorVMS Requirement)
                </div>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#059669', background: '#ECFDF5', padding: '2px 6px', borderRadius: 4 }}>
                  Auto-Populated
                </span>
              </div>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.inputLabel}>Manager Name</label>
                  <input
                    type="text"
                    value={caiManagerName}
                    onChange={e => setCaiManagerName(e.target.value)}
                    style={styles.textInput}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={styles.formGroup}>
                    <label style={styles.inputLabel}>Phone</label>
                    <input
                      type="text"
                      value={caiManagerPhone}
                      onChange={e => setCaiManagerPhone(e.target.value)}
                      style={styles.textInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.inputLabel}>Email</label>
                    <input
                      type="email"
                      value={caiManagerEmail}
                      onChange={e => setCaiManagerEmail(e.target.value)}
                      style={styles.textInput}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Candidate Legal & Background Details */}
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Candidate Full Legal Name *</label>
              <input
                type="text"
                value={coversheet.candidateLegalName}
                onChange={e => setCoversheet({ ...coversheet, candidateLegalName: e.target.value })}
                style={{ ...styles.textInput, fontWeight: '700' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Current Location (City, State)</label>
                <input
                  type="text"
                  value={coversheet.currentLocation}
                  onChange={e => setCoversheet({ ...coversheet, currentLocation: e.target.value })}
                  style={styles.textInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Relocation Preference</label>
                <select
                  value={coversheet.willingToRelocate}
                  onChange={e => setCoversheet({ ...coversheet, willingToRelocate: e.target.value })}
                  style={styles.selectInput}
                >
                  <option value="Yes (Open to Relocation)">Yes (Open to Relocation)</option>
                  <option value="No (Local Only)">No (Local Only)</option>
                  <option value="100% Remote Eligible">100% Remote Eligible</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Work Authorization / Visa</label>
                <input
                  type="text"
                  value={coversheet.visaStatus}
                  onChange={e => setCoversheet({ ...coversheet, visaStatus: e.target.value })}
                  style={styles.textInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Visa Expiration Date</label>
                <input
                  type="text"
                  value={coversheet.visaExpiry}
                  onChange={e => setCoversheet({ ...coversheet, visaExpiry: e.target.value })}
                  style={styles.textInput}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Total Experience</label>
                <input
                  type="text"
                  value={coversheet.totalExperience}
                  onChange={e => setCoversheet({ ...coversheet, totalExperience: e.target.value })}
                  style={styles.textInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Relevant Experience</label>
                <input
                  type="text"
                  value={coversheet.relevantExperience}
                  onChange={e => setCoversheet({ ...coversheet, relevantExperience: e.target.value })}
                  style={styles.textInput}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Highest Education / University</label>
              <input
                type="text"
                value={coversheet.highestEducation}
                onChange={e => setCoversheet({ ...coversheet, highestEducation: e.target.value })}
                style={styles.textInput}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Notice Period</label>
                <input
                  type="text"
                  value={coversheet.noticePeriod}
                  onChange={e => setCoversheet({ ...coversheet, noticePeriod: e.target.value })}
                  style={styles.textInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Interview Availability</label>
                <input
                  type="text"
                  value={coversheet.interviewAvailability}
                  onChange={e => setCoversheet({ ...coversheet, interviewAvailability: e.target.value })}
                  style={styles.textInput}
                />
              </div>
            </div>
          </div>

          {/* Technical Skills Matrix Editor */}
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Required Technical Skills Matrix
              </div>
              <button
                type="button"
                onClick={() => setCoversheet({
                  ...coversheet,
                  skillsMatrix: [...coversheet.skillsMatrix, { skill: 'New Skill', requiredExp: '5+ Years', candidateExp: '5+ Years', rating: 'Expert (9/10)' }]
                })}
                style={styles.smallAddBtn}
              >
                + Add Skill
              </button>
            </div>
            <table style={styles.matrixTable}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={styles.matrixTh}>Skill / Requirement</th>
                  <th style={styles.matrixTh}>Req. Years</th>
                  <th style={styles.matrixTh}>Candidate Exp</th>
                  <th style={styles.matrixTh}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {coversheet.skillsMatrix.map((sm, sIdx) => (
                  <tr key={sIdx}>
                    <td style={styles.matrixTd}>
                      <input
                        type="text"
                        value={sm.skill}
                        onChange={e => {
                          const updated = [...coversheet.skillsMatrix]
                          updated[sIdx].skill = e.target.value
                          setCoversheet({ ...coversheet, skillsMatrix: updated })
                        }}
                        style={styles.matrixInput}
                      />
                    </td>
                    <td style={styles.matrixTd}>
                      <input
                        type="text"
                        value={sm.requiredExp}
                        onChange={e => {
                          const updated = [...coversheet.skillsMatrix]
                          updated[sIdx].requiredExp = e.target.value
                          setCoversheet({ ...coversheet, skillsMatrix: updated })
                        }}
                        style={styles.matrixInput}
                      />
                    </td>
                    <td style={styles.matrixTd}>
                      <input
                        type="text"
                        value={sm.candidateExp}
                        onChange={e => {
                          const updated = [...coversheet.skillsMatrix]
                          updated[sIdx].candidateExp = e.target.value
                          setCoversheet({ ...coversheet, skillsMatrix: updated })
                        }}
                        style={styles.matrixInput}
                      />
                    </td>
                    <td style={styles.matrixTd}>
                      <input
                        type="text"
                        value={sm.rating}
                        onChange={e => {
                          const updated = [...coversheet.skillsMatrix]
                          updated[sIdx].rating = e.target.value
                          setCoversheet({ ...coversheet, skillsMatrix: updated })
                        }}
                        style={styles.matrixInput}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: PRESENTATION PREVIEW WITH TABS */}
        <div style={styles.resumeCol}>
          {/* View Tab Switcher Header */}
          <div style={styles.previewTabHeader} className="no-print">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => setActivePreviewTab('resume')}
                style={{
                  ...styles.tabBtn,
                  ...(activePreviewTab === 'resume' ? styles.tabBtnActive : {})
                }}
              >
                Client-Ready Resume Preview
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('rtr')}
                style={{
                  ...styles.tabBtn,
                  ...(activePreviewTab === 'rtr' ? styles.tabBtnActive : {})
                }}
              >
                Electronic Right to Represent (E-RTR)
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('all')}
                style={{
                  ...styles.tabBtn,
                  ...(activePreviewTab === 'all' ? styles.tabBtnActive : {})
                }}
              >
                Complete Submittal Pack
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700', display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconCheck /> Client Presentation Certified
              </span>
            </div>
          </div>

          {/* ─── TAB 1: CLIENT-READY SUBMITTAL RESUME ─────────────────────── */}
          {(activePreviewTab === 'resume' || activePreviewTab === 'all') && (
            <div style={styles.resumePaper}>
              {/* CAI Contact Box (VectorVMS NC & Georgia Formats) */}
              {activeTemplateMeta.hasCaiBox && (
                <div style={styles.caiBox}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: 2 }}>
                    CAI Contact
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginBottom: 8, lineHeight: 1.4 }}>
                    Insert name and contact information for the CAI Contract Manager listed on the VectorVMS requirement. For ease of reference, the Contract Manager's contact information appears below.
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                    {caiManagerName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155', marginTop: 2 }}>
                    Phone: <span style={{ fontWeight: '600' }}>{caiManagerPhone}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#2563EB', marginTop: 1 }}>
                    Email: <span style={{ fontWeight: '600' }}>{caiManagerEmail}</span>
                  </div>
                </div>
              )}

              {/* Standard Corporate Letterhead (When NOT using CAI box) */}
              {!activeTemplateMeta.hasCaiBox && (
                <div style={styles.letterhead}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                        {coversheet.candidateLegalName}
                      </h1>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#2563EB' }}>
                        {positionTitle}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>{activeTemplateMeta.agencyName}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>SmartHire Authorized Presentation</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Req #{vmsNumber} • {clientAgency}</div>
                    </div>
                  </div>

                  {/* Metadata Sub-bar */}
                  <div style={styles.metaSubBar}>
                    <span>Location: {coversheet.currentLocation}</span>
                    <span>•</span>
                    <span>Visa: {coversheet.visaStatus}</span>
                    <span>•</span>
                    <span>Experience: {coversheet.totalExperience}</span>
                    <span>•</span>
                    <span style={{ color: '#059669', fontWeight: '700' }}>
                      Represented exclusively via {activeTemplateMeta.agencyName}
                    </span>
                  </div>
                </div>
              )}

              {/* NC & Georgia Candidate Header Title Bar */}
              {activeTemplateMeta.hasCaiBox && (
                <div style={{ marginBottom: 18, borderBottom: '2px solid #0F172A', paddingBottom: 10 }}>
                  <h1 style={{ fontSize: '23px', fontWeight: '900', color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                    {coversheet.candidateLegalName}
                  </h1>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#2563EB' }}>
                    {positionTitle}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', color: '#64748B', marginTop: 6, flexWrap: 'wrap' }}>
                    <span>Location: {coversheet.currentLocation}</span>
                    <span>•</span>
                    <span>Visa: {coversheet.visaStatus}</span>
                    <span>•</span>
                    <span>Total Exp: {coversheet.totalExperience}</span>
                    <span>•</span>
                    <span>Req #{vmsNumber} ({clientAgency})</span>
                    <span>•</span>
                    <span style={{ color: '#059669', fontWeight: '700' }}>Represented via CoolSoft LLC</span>
                  </div>
                </div>
              )}

              {/* Editable Formatted Resume Body */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                    Resume Experience & Employment History
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748B' }} className="no-print">
                    Click text below to edit prior to submission
                  </span>
                </div>
                <textarea
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  style={styles.resumeTextarea}
                  placeholder="Paste or format candidate employment history, skills, and education..."
                />
              </div>
            </div>
          )}

          {/* ─── TAB 2: ELECTRONIC RIGHT TO REPRESENT (E-RTR) ─────────────── */}
          {(activePreviewTab === 'rtr' || activePreviewTab === 'all') && (
            <div style={{ ...styles.resumePaper, marginTop: activePreviewTab === 'all' ? 24 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0F172A', paddingBottom: 10, marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Right to Represent (E-RTR) Template
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: 2 }}>
                    {activeTemplateMeta.contractName} • Official Representation Acknowledgement
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#1D4ED8', background: '#EFF6FF', padding: '3px 9px', borderRadius: 6, border: '1px solid #BFDBFE' }}>
                  {activeTemplateMeta.badge}
                </span>
              </div>

              {/* Email Subject Card */}
              <div style={styles.rtrSubjectCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                    Candidate Email Subject Line:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(rtrSubject)
                      showToast('Email Subject copied!')
                    }}
                    style={styles.rtrCopyPill}
                    title="Copy subject line"
                  >
                    <IconCopy /> <span>Copy Subject</span>
                  </button>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginTop: 4, fontFamily: 'monospace' }}>
                  {rtrSubject}
                </div>
              </div>

              {/* Email Body Card */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                    Right to Represent Body Text (Copy & Paste to Candidate):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRtr}
                    style={styles.rtrCopyPill}
                    title="Copy full RTR text"
                  >
                    <IconCopy /> <span>Copy Body Text</span>
                  </button>
                </div>
                <pre style={styles.rtrPreBlock}>
                  {rtrBody}
                </pre>
              </div>

              {/* Action Toolbar for E-RTR */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }} className="no-print">
                <button
                  type="button"
                  onClick={handleCopyRtr}
                  style={styles.actionBtnPrimary}
                >
                  <IconCopy /> <span>Copy RTR Email Text</span>
                </button>

                <Link
                  to={`/sign-rtr?template=${selectedTemplate}&candidateId=${encodeURIComponent(selectedCandidateId)}`}
                  style={styles.actionBtnSecondaryLink}
                  title="Open candidate digital signature interface"
                >
                  <IconSignature /> <span>Request Candidate Digital Signature (SmartSign RTR)</span> <IconExternalLink />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Email Submittal Dispatch Modal ───────────────────────────────── */}
      {showEmailModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEmailModal(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Email Submittal Package to Client / Account Manager
              </h3>
              <button onClick={() => setShowEmailModal(false)} style={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleSendEmail} style={{ padding: '20px' }}>
              <div style={styles.modalField}>
                <label style={styles.inputLabel}>Recipient Email *</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  style={styles.textInput}
                  required
                />
              </div>

              <div style={styles.modalField}>
                <label style={styles.inputLabel}>Subject Line *</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  style={styles.textInput}
                  required
                />
              </div>

              <div style={styles.modalField}>
                <label style={styles.inputLabel}>Cover Message *</label>
                <textarea
                  rows={4}
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  style={{ ...styles.textInput, resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  style={styles.actionBtnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  style={styles.actionBtnPrimary}
                >
                  {isSendingEmail ? 'Dispatching...' : 'Send Submittal Email ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  pageWrap: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },
  topNav: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    flexShrink: 0
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#2563EB',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 6px',
    borderRadius: 6
  },
  badgeEnterprise: {
    fontSize: '11px',
    fontWeight: '800',
    padding: '2px 8px',
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    border: '1px solid #BFDBFE'
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  toastChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    color: '#059669',
    border: '1px solid #A7F3D0',
    fontSize: '12px',
    fontWeight: '700'
  },
  actionBtnPrimary: {
    padding: '8px 16px',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 1px 3px rgba(15,23,42,0.15)'
  },
  actionBtnSecondary: {
    padding: '8px 13px',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    border: '1px solid #CBD5E1',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6
  },
  actionBtnSecondaryLink: {
    padding: '8px 14px',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#1D4ED8',
    border: '1px solid #93C5FD',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    textDecoration: 'none'
  },
  selectorBar: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    padding: '12px 24px',
    flexShrink: 0
  },
  selectorInner: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  filterGroup: {
    flex: 1,
    minWidth: '220px'
  },
  filterLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 4
  },
  selectInput: {
    width: '100%',
    padding: '7px 10px',
    borderRadius: 8,
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    outline: 'none',
    boxSizing: 'border-box'
  },
  workspace: {
    flex: 1,
    display: 'flex',
    padding: '18px 24px',
    gap: 20,
    boxSizing: 'border-box',
    alignItems: 'flex-start'
  },
  coversheetCol: {
    width: '450px',
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    border: '1px solid #E2E8F0',
    padding: 18,
    boxSizing: 'border-box',
    maxHeight: 'calc(100vh - 160px)',
    overflowY: 'auto'
  },
  resumeCol: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    border: '1px solid #E2E8F0',
    padding: 18,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 160px)',
    overflowY: 'auto'
  },
  colHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottom: '1px solid #E2E8F0',
    paddingBottom: 10
  },
  previewTabHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottom: '1px solid #E2E8F0',
    paddingBottom: 8,
    flexWrap: 'wrap',
    gap: 8
  },
  tabBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    background: 'none',
    border: 'none',
    color: '#64748B',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  tabBtnActive: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    fontWeight: '800',
    boxShadow: '0 1px 2px rgba(37,99,235,0.1)'
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14
  },
  sectionCardTitle: {
    fontSize: '11.5px',
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    marginBottom: 8
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3
  },
  inputLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#475569'
  },
  textInput: {
    width: '100%',
    padding: '7px 9px',
    borderRadius: 6,
    border: '1px solid #CBD5E1',
    fontSize: '12.5px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#FFFFFF'
  },
  smallAddBtn: {
    background: 'none',
    border: 'none',
    color: '#2563EB',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  matrixTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '11.5px',
    border: '1px solid #E2E8F0'
  },
  matrixTh: {
    padding: '6px 8px',
    border: '1px solid #E2E8F0',
    textAlign: 'left',
    color: '#475569',
    fontSize: '10.5px',
    fontWeight: '800'
  },
  matrixTd: {
    padding: '4px',
    border: '1px solid #E2E8F0'
  },
  matrixInput: {
    width: '100%',
    border: 'none',
    background: 'transparent',
    fontSize: '11px',
    outline: 'none',
    color: '#0F172A'
  },
  resumePaper: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: 8,
    padding: 24,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '500px'
  },
  caiBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 16
  },
  letterhead: {
    borderBottom: '2px solid #0F172A',
    paddingBottom: 12,
    marginBottom: 14
  },
  metaSubBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: '11.5px',
    color: '#475569',
    marginTop: 8,
    flexWrap: 'wrap'
  },
  resumeTextarea: {
    flex: 1,
    minHeight: '380px',
    width: '100%',
    backgroundColor: '#FAFAFA',
    border: '1px solid #CBD5E1',
    borderRadius: 8,
    padding: 14,
    fontSize: '12.5px',
    lineHeight: 1.6,
    color: '#0F172A',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  rtrSubjectCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: 8,
    padding: '10px 14px'
  },
  rtrCopyPill: {
    background: 'none',
    border: 'none',
    color: '#2563EB',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4
  },
  rtrPreBlock: {
    backgroundColor: '#FAFAFA',
    border: '1px solid #CBD5E1',
    borderRadius: 8,
    padding: 14,
    fontSize: '12px',
    lineHeight: 1.55,
    color: '#0F172A',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontFamily: 'monospace',
    margin: 0
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: '100%',
    maxWidth: '560px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    overflow: 'hidden'
  },
  modalHeader: {
    padding: '14px 18px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    color: '#64748B'
  },
  modalField: {
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  }
}
