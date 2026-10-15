import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'

// Florida Exhibit E Resume Self-Certification Form (Primary Default Template from Doc/RTR_FL-pankajmaharwade829_gmail.com.pdf)
const DEFAULT_FLORIDA_EXHIBIT_E_DOCUMENT = {
  id: 'florida-exhibit-e-doc',
  title: 'Information Technology Staff Augmentation Services Contract No. 80101507-23-STC-ITSA Exhibit E Resume Self-Certification Form',
  contractNo: '80101507-23-STC-ITSA',
  maxBillRate: '$110.00',
  clientName: 'State of Florida',
  content: `Information Technology Staff Augmentation Services
Contract No. 80101507-23-STC-ITSA

Exhibit E
Resume Self-Certification Form

The Contractor's candidates shall complete this Resume Self-Certification Form. Completed Resume Self-Certification Forms shall be submitted within the Contractor's response to Customer's Request for Quotes.

"I the undersigned do hereby certify, under the penalty of perjury, that information in my resume submitted for consideration of the State of Florida contract position is true, correct, complete, and made in good faith to the best of my knowledge and belief. If an omission, falsification, misstatement, or misrepresentation has been made regarding my education, work ability, experience, employment history, and/or fitness for employment as a contractor, I may be disqualified as a contractor, and the matter will be reported to appropriate agency or law enforcement personnel. I understand that there may be civil and/or criminal penalties for misrepresenting pertinent information in connection with contract positions, including, but not limited to, penalties available under sections 287.133 or 817.566, Florida Statutes. I further understand that if I am not a United States citizen, violation cases may be reported to the US Department of Homeland Security for potential deportation."

"In addition, I the undersigned do hereby consent to the release of my information by employers, educational institutions, law enforcement agencies, and other individuals and organizations to investigators and other authorized agents of Florida for verification and investigation purposes. I understand that any documents submitted to procure a contract(s) with the State of Florida, including resumes, are public records."

Print Full Legal Name of Candidate
Candidate's Signature | Date
Candidate's Form of Identification Presented | Identification number
Contractor's Witness Signature One | Date | Contractor's Witness Signature Two | Date
Print Name Contractor's Witness One | Print Name Contractor's Witness Two`,
  defaultFields: [
    { id: 'f1', type: 'name', label: 'Candidate Full Legal Name', fieldName: 'CandidateLegalName', required: true, x: 60, y: 530, width: 340, height: 42, signerIndex: 0 },
    { id: 'f2', type: 'signature', label: "Candidate's Signature", fieldName: 'CandidateSignature', required: true, x: 60, y: 610, width: 240, height: 48, signerIndex: 0 },
    { id: 'f3', type: 'date', label: 'Date', fieldName: 'DateSigned', required: true, x: 400, y: 610, width: 200, height: 48, signerIndex: 0 },
    { id: 'f4', type: 'textbox', label: "Candidate's Form of ID (DL/Passport)", fieldName: 'CandidateIDType', required: true, x: 60, y: 690, width: 240, height: 42, signerIndex: 0 },
    { id: 'f5', type: 'textbox', label: 'Identification Number', fieldName: 'CandidateIDNumber', required: true, x: 400, y: 690, width: 200, height: 42, signerIndex: 0 },
    { id: 'f6', type: 'signature', label: "Contractor's Witness Signature One", fieldName: 'WitnessSignature1', required: true, x: 60, y: 770, width: 240, height: 48, signerIndex: 1 },
    { id: 'f7', type: 'date', label: 'Date', fieldName: 'WitnessDate1', required: true, x: 400, y: 770, width: 200, height: 48, signerIndex: 1 },
    { id: 'f8', type: 'name', label: "Print Name Contractor's Witness One", fieldName: 'WitnessName1', required: true, x: 60, y: 840, width: 340, height: 42, signerIndex: 1 }
  ]
}

// FDOT Statement of Work & RTR Document
const DEFAULT_FDOT_DOCUMENT = {
  id: 'fdot-sow',
  title: 'FDOT Job 2430 Network Engineer C. Advanced Statement of Work (SOW)',
  contractNo: 'State Term Contract No. 80101507-23-STC-ITSA',
  maxBillRate: '$125.00',
  clientName: 'Florida Department of Transportation (FDOT)',
  content: `FDOT Job 2430 Network Engineer C. Advanced
Statement of Work (SOW)

Florida Department of Transportation State Term Contract No. 80101507-23-STC-ITSA

1 Statement of Work
The Florida Department of Transportation (Department), is requesting resumes and hourly rate quotes for staff augmentation resources meeting the specific Knowledge, Skills, and Abilities (KSAs) listed below. The Department will select the candidate that provides the best overall value to the State, based on skill set and rate.

2 Overview
2.1 Term: The contract term for this Staff Augmentation position is intended to be ASAP -, with possible renewal, based on excellence in work provided, need and budget availability.

NOTE: "Term" does not mean the awarded contractor or resource are locked in for the full year – any contractor or resource may be terminated for cause, convenience, or funding during the contract term.

MAX BILL RATE: $125.00
(Quotes submitted over the max bill rate will be disqualified.)

VENDOR BILL RATE: It is the responsibility of the vendor to submit rates that are not above their pre-established rates within the State Contract, and not more than the maximum bill rate.

Candidate Submission:
FDOT is accepting one (1) candidate submission per vendor for this New position.

Rate Increase:
Please do not impose a rate increase for any subsequent year of the contract as part of your bid response.

Right to Represent (RTR) & Exclusivity Confirmation:
I hereby confirm that COOLSOFT LLC has the exclusive right to represent me for this requisition with the Florida Department of Transportation. I have not submitted my resume for this position through any other vendor or agency.`,
  defaultFields: [
    { id: 'f1', type: 'signature', label: 'Signature', fieldName: 'CandidateSignature', required: true, x: 60, y: 780, signerIndex: 0 },
    { id: 'f2', type: 'date', label: 'Date signed', fieldName: 'DateSigned', required: true, x: 420, y: 780, signerIndex: 0 },
    { id: 'f3', type: 'name', label: 'Full name', fieldName: 'CandidateLegalName', required: true, x: 60, y: 720, signerIndex: 0 },
    { id: 'f4', type: 'title', label: 'Title', fieldName: 'PositionTitle', required: false, x: 420, y: 720, signerIndex: 0 }
  ]
}

const PREBUILT_TEMPLATES = [
  {
    id: 'florida_fdot',
    name: 'State of Florida (Exhibit E — Resume Self-Certification)',
    description: 'Official State of Florida IT Staff Augmentation Services (Contract No. 80101507-23-STC-ITSA) Exhibit E Resume Self-Certification Form.',
    rate: '$90.00/hr',
    client: 'State of Florida (Contract No. 80101507-23-STC-ITSA)',
    doc: DEFAULT_FLORIDA_EXHIBIT_E_DOCUMENT
  },
  {
    id: 'fdot',
    name: 'Florida DOT SOW & Right to Represent',
    description: 'Official FDOT Staff Augmentation Statement of Work and RTR exclusivity agreement.',
    rate: '$125.00/hr',
    client: 'Florida Department of Transportation',
    doc: DEFAULT_FDOT_DOCUMENT
  },
  {
    id: 'texas_dir',
    name: 'State of Texas / Texas DIR Exclusivity RTR',
    description: 'Texas Department of Information Resources standard representation acknowledgment.',
    rate: '$85.00/hr',
    client: 'State of Texas DIR',
    doc: {
      id: 'texas-dir-doc',
      title: 'State of Texas DIR Candidate Right to Represent Agreement',
      contractNo: 'DIR-CPO-ITSA-0442',
      maxBillRate: '$95.00',
      clientName: 'State of Texas DIR',
      content: `State of Texas Department of Information Resources (DIR)
Contract Representation & Exclusivity Agreement

1. Scope of Representation
The undersigned candidate hereby grants COOLSOFT LLC the exclusive authorization to submit credentials, resume, and rate proposal for active requisitions issued under the Texas DIR Cooperative Contracts Program.

2. Candidate Acknowledgment
Candidate acknowledges that only one submittal per candidate is permitted by the State of Texas for each Solicitation ID. Dual representation will lead to immediate disqualification.

3. Agreed Rate & Term
Agreed Hourly Submittal Rate: As designated in submittal packaging.
Exclusivity Window: 60 Days from signature date.`,
      defaultFields: [
        { id: 'f1', type: 'signature', label: 'Signature', fieldName: 'CandidateSignature', required: true, x: 60, y: 480, signerIndex: 0 },
        { id: 'f2', type: 'date', label: 'Date signed', fieldName: 'DateSigned', required: true, x: 420, y: 480, signerIndex: 0 },
        { id: 'f3', type: 'name', label: 'Full name', fieldName: 'CandidateLegalName', required: true, x: 60, y: 420, signerIndex: 0 }
      ]
    }
  },
  {
    id: 'standard_c2c',
    name: 'Standard US Enterprise Direct Client RTR',
    description: 'Comprehensive C2C / W2 agency representation form with rate lock and non-poach covenants.',
    rate: '$75.00/hr',
    client: 'Direct Enterprise Client',
    doc: {
      id: 'standard-rtr-doc',
      title: 'Exclusive Right to Represent & Authorization Agreement',
      contractNo: 'COOLSOFT-RTR-2026',
      maxBillRate: '$85.00',
      clientName: 'Direct Enterprise Client',
      content: `EXCLUSIVE RIGHT TO REPRESENTATION (RTR)

To: Hiring Client & Account Management
From: COOLSOFT LLC Staff Augmentation Team

Candidate Declaration:
I grant COOLSOFT LLC the exclusive right to represent and submit my profile for the position described herein. I confirm that I am legally authorized to work in the United States and have not authorized any other staffing agency or prime vendor to submit my credentials for this client requirement.

Terms:
1. Representation is exclusive for a period of sixty (60) days.
2. Agreed rate is binding and cannot be altered following client submission.
3. Candidate agrees to be available for technical and behavioral interviews arranged by COOLSOFT.`,
      defaultFields: [
        { id: 'f1', type: 'signature', label: 'Signature', fieldName: 'CandidateSignature', required: true, x: 60, y: 520, signerIndex: 0 },
        { id: 'f2', type: 'date', label: 'Date signed', fieldName: 'DateSigned', required: true, x: 420, y: 520, signerIndex: 0 },
        { id: 'f3', type: 'name', label: 'Full name', fieldName: 'CandidateLegalName', required: true, x: 60, y: 460, signerIndex: 0 }
      ]
    }
  },
  {
    id: 'nc_cai',
    name: 'State of North Carolina (VectorVMS / CAI) E-RTR',
    description: 'North Carolina IT Supplemental Services Contract Right to Represent acknowledgement.',
    rate: '$85.00/hr',
    client: 'State of North Carolina (CAI / VectorVMS)',
    doc: {
      id: 'nc-cai-rtr-doc',
      title: 'North Carolina IT Supplemental Services Contract Right to Represent',
      contractNo: 'NC-ITSS-CAI-2026',
      maxBillRate: '$95.00',
      clientName: 'State of North Carolina / Computer Aid, Inc.',
      content: `RIGHT TO REPRESENT ACKNOWLEDGEMENT
State of North Carolina IT Supplemental Services Contract

By signing below, I acknowledge and agree that COOLSOFT LLC has the sole right to represent me in matters of work assignment relating the North Carolina IT Supplemental Services Contract by submitting my professional resume to the Contract's Managed Service Provider, Computer Aid, Inc. for the requirement identified below.

I also acknowledge and verify that all the information contained in my resume related to my technical credentials is accurate and is based on educational training and professional experience obtained throughout my career.

Managed Service Provider: Computer Aid, Inc. (CAI)
Contract Manager: Nicole Walker (nicole.walker@cai.io | 910-520-1506)`,
      defaultFields: [
        { id: 'f1', type: 'signature', label: 'Candidate Signature', fieldName: 'CandidateSignature', required: true, x: 60, y: 520, signerIndex: 0 },
        { id: 'f2', type: 'date', label: 'Date signed', fieldName: 'DateSigned', required: true, x: 420, y: 520, signerIndex: 0 },
        { id: 'f3', type: 'name', label: 'Candidate Full Legal Name', fieldName: 'CandidateLegalName', required: true, x: 60, y: 460, signerIndex: 0 }
      ]
    }
  },
  {
    id: 'georgia_cai',
    name: 'State of Georgia (GDOT / VectorVMS / CAI) E-RTR',
    description: 'State of Georgia IT Staffing Services Contract Right to Represent with Rate & Employment Type.',
    rate: '$90.00/hr',
    client: 'State of Georgia (GDOT / CAI / VectorVMS)',
    doc: {
      id: 'georgia-cai-rtr-doc',
      title: 'State of Georgia IT Staffing Services Contract Right to Represent',
      contractNo: 'GA-ITSS-CAI-2026',
      maxBillRate: '$105.00',
      clientName: 'State of Georgia / Computer Aid, Inc.',
      content: `RIGHT TO REPRESENT ACKNOWLEDGEMENT
State of Georgia's IT Staffing Services Contract

By inserting my full legal name below, I acknowledge and agree that COOLSOFT LLC has the sole right to represent me in matters of work assignment relating to the State of Georgia's IT Staffing Services Contract by submitting my professional resume to the Contract's Managed Service Provider, Computer Aid, Inc. for the requirement identified below.

I also acknowledge and verify that all the information contained in my resume related to my technical credentials is accurate and is based on educational training and professional experience obtained throughout my career.

Managed Service Provider: Computer Aid, Inc. (CAI)
Contract Manager: Tim Brodrick (Timothy.Brodrick@cai.io | 678-427-3660)`,
      defaultFields: [
        { id: 'f1', type: 'signature', label: 'Candidate Signature', fieldName: 'CandidateSignature', required: true, x: 60, y: 520, signerIndex: 0 },
        { id: 'f2', type: 'date', label: 'Date signed', fieldName: 'DateSigned', required: true, x: 420, y: 520, signerIndex: 0 },
        { id: 'f3', type: 'name', label: 'Candidate Full Legal Name', fieldName: 'CandidateLegalName', required: true, x: 60, y: 460, signerIndex: 0 }
      ]
    }
  },
  {
    id: 'nebraska_state',
    name: 'State of Nebraska IT Services E-RTR',
    description: 'State of Nebraska Staff Augmentation Services Right to Represent with Rate & Exclusivity.',
    rate: '$85.00/hr',
    client: 'State of Nebraska IT Services',
    doc: {
      id: 'nebraska-state-rtr-doc',
      title: 'State of Nebraska IT Services Right to Represent Agreement',
      contractNo: 'NE-ITSS-2026',
      maxBillRate: '$95.00',
      clientName: 'State of Nebraska',
      content: `RIGHT TO REPRESENT ACKNOWLEDGEMENT
State of Nebraska Staff Augmentation Services

By replying to this email or digitally signing below with your confirmation, you acknowledge and agree that COOLSOFT LLC has the exclusive right to represent you for active requisitions with the State of Nebraska.

I also acknowledge and verify that all the information contained in my resume related to my technical credentials is accurate and is based on educational training and professional experience obtained throughout my career.

Client Agency: State of Nebraska IT Services
Candidate Representation Term: 60 Days`,
      defaultFields: [
        { id: 'f1', type: 'signature', label: 'Candidate Signature', fieldName: 'CandidateSignature', required: true, x: 60, y: 520, signerIndex: 0 },
        { id: 'f2', type: 'date', label: 'Date signed', fieldName: 'DateSigned', required: true, x: 420, y: 520, signerIndex: 0 },
        { id: 'f3', type: 'name', label: 'Candidate Full Legal Name', fieldName: 'CandidateLegalName', required: true, x: 60, y: 460, signerIndex: 0 }
      ]
    }
  },
  {
    id: 'south_carolina_sosc',
    name: 'State of South Carolina (SOSC) E-RTR',
    description: 'Official State of South Carolina (SOSC) Right to Represent with Posting ID and Position Title.',
    rate: '$85.00/hr',
    client: 'State of South Carolina (SOSC)',
    doc: {
      id: 'sosc-rtr-doc',
      title: 'State of South Carolina (SOSC) Right to Represent Agreement',
      contractNo: 'SC-SOSC-2026',
      maxBillRate: '$95.00',
      clientName: 'State of South Carolina (SOSC)',
      content: `SOSC RIGHT TO REPRESENT - POSTING ID -[Req #]

Please confirm that COOLSOFT LLC has the right to submit you for consideration to the [Position Title] - position at "SOSC" under posting [Req #].

Candidate Declaration:
I, [Candidate Full Legal Name], confirm that COOLSOFT LLC has the exclusive right to submit me for consideration to the [Position Title] position at "SOSC" under posting [Req #].

Agreed Hourly Rate: As designated in submittal packaging.
Client Agency: State of South Carolina (SOSC)
Representation Term: 60 Days`,
      defaultFields: [
        { id: 'f1', type: 'signature', label: 'Candidate Signature', fieldName: 'CandidateSignature', required: true, x: 60, y: 520, signerIndex: 0 },
        { id: 'f2', type: 'date', label: 'Date signed', fieldName: 'DateSigned', required: true, x: 420, y: 520, signerIndex: 0 },
        { id: 'f3', type: 'name', label: 'Candidate Full Legal Name', fieldName: 'CandidateLegalName', required: true, x: 60, y: 460, signerIndex: 0 }
      ]
    }
  }
]

export default function SmartSignRtrPage() {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Main UI Mode:
  // If token is provided and != 'manage', candidate signing view is active.
  // Otherwise recruiter SmartHire Sign portal is active.
  const isCandidateSigningView = Boolean(token && token !== 'manage' && token !== 'dashboard')

  // Recruiter Portal State
  const [activeTab, setActiveTab] = useState('home') // 'home', 'documents', 'templates'
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1) // 1: Select documents, 2: Add signers, 3: Place fields, 4: Review and send

  // Agreements state
  const [agreementsList, setAgreementsList] = useState([])
  const [agreementsLoading, setAgreementsLoading] = useState(false)
  const [documentSearch, setDocumentSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'SIGNED', 'PENDING', 'DRAFT'
  const [toastMessage, setToastMessage] = useState('')

  // Wizard State
  const [selectedTemplate, setSelectedTemplate] = useState(PREBUILT_TEMPLATES[0])
  const [documentTitle, setDocumentTitle] = useState(PREBUILT_TEMPLATES[0].doc.title)
  const [documentContent, setDocumentContent] = useState(PREBUILT_TEMPLATES[0].doc.content)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null)
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [uploadStatusText, setUploadStatusText] = useState('')
  const [draggingFieldId, setDraggingFieldId] = useState(null)
  const [dragOffset, setDragOffset] = useState({ startX: 0, startY: 0, initialFieldX: 0, initialFieldY: 0 })
  const [signers, setSigners] = useState([
    {
      id: 's-1',
      name: searchParams.get('candidateName') || 'Pankaj Maharwade',
      email: searchParams.get('candidateEmail') || 'pankaj.m@smarthire.com',
      color: '#0284C7'
    }
  ])
  const [allowReassignment, setAllowReassignment] = useState(false)
  const [selectedSignerIndex, setSelectedSignerIndex] = useState(0)

  // Field Placement Canvas State
  const [placedFields, setPlacedFields] = useState(PREBUILT_TEMPLATES[0].doc.defaultFields || [])
  const [selectedFieldId, setSelectedFieldId] = useState(PREBUILT_TEMPLATES[0].doc.defaultFields?.[0]?.id || null)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [ccRecipients, setCcRecipients] = useState([])
  const [ccInput, setCcInput] = useState('')
  const [showAddCc, setShowAddCc] = useState(false)
  const [expiryDays, setExpiryDays] = useState(30)
  const [fieldValues, setFieldValues] = useState({})
  const [isSending, setIsSending] = useState(false)
  const [createdAgreement, setCreatedAgreement] = useState(null)

  // Candidate Signing View State
  const [candidateAgreement, setCandidateAgreement] = useState(null)
  const [candidateLoading, setCandidateLoading] = useState(isCandidateSigningView)
  const [candidateError, setCandidateError] = useState('')
  const [signModalOpen, setSignModalOpen] = useState(false)
  const [targetFieldToSign, setTargetFieldToSign] = useState(null)
  const [signMethod, setSignMethod] = useState('draw') // 'draw', 'type', 'upload'
  const [typedName, setTypedName] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [uploadedSignatureUrl, setUploadedSignatureUrl] = useState(null)
  const [savedSignatureData, setSavedSignatureData] = useState(null)
  const [agreedToLegalTerms, setAgreedToLegalTerms] = useState(false)
  const [isSigningSubmitting, setIsSigningSubmitting] = useState(false)
  const [signedSuccessData, setSignedSuccessData] = useState(null)

  const canvasRef = useRef(null)
  const docContainerRef = useRef(null)
  const docScrollContainerRef = useRef(null)
  const homeFileInputRef = useRef(null)
  const wizardFileInputRef = useRef(null)

  // 1. Fetch Agreements for Recruiter Portal
  const fetchAgreements = async () => {
    try {
      setAgreementsLoading(true)
      const authToken = localStorage.getItem('smarthire_token') || localStorage.getItem('token') || ''
      const res = await fetch('/api/rtr/list', {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.agreements)) {
        setAgreementsList(data.agreements)
      }
    } catch (e) {
      console.error('Failed to load RTR agreements:', e)
    } finally {
      setAgreementsLoading(false)
    }
  }

  // 1b. Parse URL query parameters to auto-load candidate & template
  useEffect(() => {
    if (!isCandidateSigningView) {
      const tplParam = searchParams.get('template')
      const nameParam = searchParams.get('candidateName')
      const emailParam = searchParams.get('candidateEmail')
      const jobParam = searchParams.get('jobTitle')
      const reqParam = searchParams.get('reqNumber')
      const clientParam = searchParams.get('clientName')
      const rateParam = searchParams.get('rate')
      const empParam = searchParams.get('employmentType')

      if (tplParam || nameParam) {
        // Map template key to prebuilt templates
        let matchedTpl = PREBUILT_TEMPLATES.find(t => t.id === tplParam)
        if (!matchedTpl) {
          if (tplParam?.includes('nc')) {
            matchedTpl = PREBUILT_TEMPLATES.find(t => t.id === 'nc_cai')
          } else if (tplParam?.includes('georgia')) {
            matchedTpl = PREBUILT_TEMPLATES.find(t => t.id === 'georgia_cai')
          } else if (tplParam?.includes('texas')) {
            matchedTpl = PREBUILT_TEMPLATES.find(t => t.id === 'texas_dir')
          } else if (tplParam?.includes('nebraska')) {
            matchedTpl = PREBUILT_TEMPLATES.find(t => t.id === 'nebraska_state')
          } else if (tplParam?.includes('south_carolina') || tplParam?.includes('sosc')) {
            matchedTpl = PREBUILT_TEMPLATES.find(t => t.id === 'south_carolina_sosc')
          } else if (tplParam?.includes('florida') || tplParam?.includes('fdot')) {
            matchedTpl = PREBUILT_TEMPLATES.find(t => t.id === 'florida_fdot')
          } else if (tplParam?.includes('standard')) {
            matchedTpl = PREBUILT_TEMPLATES.find(t => t.id === 'standard_c2c')
          }
        }
        if (!matchedTpl) matchedTpl = PREBUILT_TEMPLATES[0]

        setSelectedTemplate(matchedTpl)

        // Build customized title
        let title = matchedTpl.doc.title
        if (nameParam && jobParam) {
          title = `RTR - ${nameParam} (${jobParam}${reqParam ? ` - Req #${reqParam}` : ''})`
        } else if (nameParam) {
          title = `RTR - ${nameParam}`
        }
        setDocumentTitle(title)

        // Customize document content with dynamic fields
        let content = matchedTpl.doc.content
        if (nameParam) {
          content = content.replace(/\$\{candidateName\}|\[Candidate Full Legal Name\]/g, nameParam)
        }
        if (jobParam) {
          content = content.replace(/\$\{positionTitle\}|\[Position Title\]/g, jobParam)
        }
        if (reqParam) {
          content = content.replace(/\$\{vmsNumber\}|\[Req #\]/g, reqParam)
        }
        if (clientParam) {
          content = content.replace(/\$\{clientAgency\}|\[Client Name\]/g, clientParam)
        }
        setDocumentContent(content)

        if (nameParam || emailParam) {
          setSigners([
            {
              id: 's-1',
              name: nameParam || 'Candidate Signer',
              email: emailParam || '',
              color: '#0284C7'
            }
          ])
        }

        setPlacedFields(matchedTpl.doc.defaultFields || [])
        setSelectedFieldId(matchedTpl.doc.defaultFields?.[0]?.id || null)

        // Automatically open wizard at step 2 or 3
        setWizardOpen(true)
        setWizardStep(nameParam && emailParam ? 3 : 2)
      }
    }
  }, [searchParams, isCandidateSigningView])

  useEffect(() => {
    if (!isCandidateSigningView) {
      fetchAgreements()
    }
  }, [isCandidateSigningView])

  // 2. Fetch Candidate Signing Agreement
  useEffect(() => {
    if (isCandidateSigningView) {
      async function loadSigningDoc() {
        try {
          setCandidateLoading(true)
          const res = await fetch(`/api/rtr/${token}`)
          const data = await res.json()
          if (data.success && data.agreement) {
            setCandidateAgreement(data.agreement)
            setTypedName(data.agreement.candidateName || '')
            if (data.agreement.status === 'SIGNED') {
              setSignedSuccessData(data.agreement)
            }
          } else {
            setCandidateError(data.message || 'The requested document was not found or the link has expired.')
          }
        } catch (e) {
          setCandidateError('Network error loading document. Please refresh.')
        } finally {
          setCandidateLoading(false)
        }
      }
      loadSigningDoc()
    }
  }, [token, isCandidateSigningView])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 4000)
  }

  // Calculate Metrics for Home Dashboard (Screenshot 1)
  const metrics = {
    pendingSignature: agreementsList.filter(a => a.status === 'PENDING').length,
    pendingYourSignature: 0,
    draft: agreementsList.filter(a => a.status === 'DRAFT').length || 1,
    signed: agreementsList.filter(a => a.status === 'SIGNED').length
  }

  // Filtered documents list
  const filteredDocuments = agreementsList.filter(doc => {
    const titleMatch = (doc.documentTitle || doc.candidateName || '').toLowerCase().includes(documentSearch.toLowerCase()) ||
                       (doc.candidateEmail || '').toLowerCase().includes(documentSearch.toLowerCase()) ||
                       (doc.jobTitle || '').toLowerCase().includes(documentSearch.toLowerCase())
    if (!titleMatch) return false
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false
    return true
  })

  // Document File Upload & Extraction Handler (Supports PDF, Word DOCX/DOC, TXT, Images)
  const handleDocumentFileUpload = async (file) => {
    if (!file) return

    try {
      setIsUploadingDoc(true)
      setUploadStatusText(`Extracting & formatting ${file.name}...`)

      const formData = new FormData()
      formData.append('file', file)

      const authToken = localStorage.getItem('smarthire_token') || localStorage.getItem('token') || ''
      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {}

      const res = await fetch('/api/rtr/upload-document', {
        method: 'POST',
        headers,
        body: formData
      })

      const data = await res.json()
      if (data.success) {
        setUploadedFileName(data.fileName)
        setDocumentTitle(data.title || data.fileName.replace(/\.[^/.]+$/, ''))
        setDocumentContent(data.text || '')
        setUploadedImageUrl(data.isImage ? data.fileUrl : null)

        if (data.isFloridaExhibitE) {
          const flTpl = PREBUILT_TEMPLATES.find(t => t.id === 'florida_fdot') || PREBUILT_TEMPLATES[0]
          setSelectedTemplate(flTpl)
          setDocumentTitle(flTpl.doc.title)
          setPlacedFields(flTpl.doc.defaultFields || [])
          setSelectedFieldId(flTpl.doc.defaultFields?.[0]?.id || null)
        } else {
          // Calculate responsive Y coordinate for bottom signature block
          const textLen = (data.text || '').length
          const estimatedY = Math.max(500, Math.min(1800, Math.round(textLen * 0.45) + 160))

          const initialFields = [
            { id: `sig-${Date.now()}`, type: 'signature', label: 'Candidate Signature', fieldName: 'CandidateSignature', required: true, x: 60, y: estimatedY + 70, width: 230, height: 48, signerIndex: 0 },
            { id: `date-${Date.now()}`, type: 'date', label: 'Date signed', fieldName: 'DateSigned', required: true, x: 380, y: estimatedY + 70, width: 210, height: 48, signerIndex: 0 },
            { id: `name-${Date.now()}`, type: 'name', label: 'Full name', fieldName: 'CandidateLegalName', required: true, x: 60, y: estimatedY, width: 230, height: 42, signerIndex: 0 },
            { id: `title-${Date.now()}`, type: 'title', label: 'Title', fieldName: 'PositionTitle', required: false, x: 380, y: estimatedY, width: 210, height: 42, signerIndex: 0 }
          ]
          setPlacedFields(initialFields)
          setSelectedFieldId(initialFields[0].id)
        }

        setWizardOpen(true)
        setWizardStep(2) // Move to add signers
        showToast(`✓ Document loaded: ${data.fileName}`)
      } else {
        alert(data.message || 'Failed to process document file.')
      }
    } catch (err) {
      console.error('File upload error:', err)
      alert('Error uploading document. Please verify the file is a valid PDF, DOCX, DOC, TXT, or Image.')
    } finally {
      setIsUploadingDoc(false)
      setUploadStatusText('')
    }
  }

  // Start Send For Signature Wizard
  const handleStartSendWorkflow = (tpl = null) => {
    if (tpl) {
      setSelectedTemplate(tpl)
      setDocumentTitle(tpl.doc.title)
      setDocumentContent(tpl.doc.content)
      setUploadedImageUrl(null)
      setUploadedFileName('')
      setPlacedFields(tpl.doc.defaultFields || [])
      setSelectedFieldId(tpl.doc.defaultFields?.[0]?.id || null)
    } else {
      setSelectedTemplate(PREBUILT_TEMPLATES[0])
      setDocumentTitle(PREBUILT_TEMPLATES[0].doc.title)
      setDocumentContent(PREBUILT_TEMPLATES[0].doc.content)
      setUploadedImageUrl(null)
      setUploadedFileName('')
      setPlacedFields(PREBUILT_TEMPLATES[0].doc.defaultFields || [])
      setSelectedFieldId(PREBUILT_TEMPLATES[0].doc.defaultFields?.[0]?.id || null)
    }
    setWizardStep(1)
    setWizardOpen(true)
  }

  // Signer management
  const handleAddSigner = () => {
    const colors = ['#0284C7', '#7C3AED', '#0D9488', '#D97706', '#E11D48']
    const newIdx = signers.length
    setSigners([
      ...signers,
      {
        id: `s-${Date.now()}`,
        name: '',
        email: '',
        color: colors[newIdx % colors.length]
      }
    ])
  }

  const handleUpdateSigner = (idx, field, val) => {
    const updated = [...signers]
    updated[idx][field] = val
    setSigners(updated)
  }

  const handleRemoveSigner = (idx) => {
    if (signers.length <= 1) return
    setSigners(signers.filter((_, i) => i !== idx))
    if (selectedSignerIndex >= idx && selectedSignerIndex > 0) {
      setSelectedSignerIndex(selectedSignerIndex - 1)
    }
  }

  // Interactive Field Placement Canvas Actions
  const handleAddField = (type, label) => {
    const scale = zoomLevel / 100
    const scrollY = docScrollContainerRef.current ? Math.round(docScrollContainerRef.current.scrollTop / scale) + 80 : 360
    const count = placedFields.length
    const defaultWidth = type === 'signature' ? 230 : (type === 'checkbox' ? 130 : 210)
    const defaultHeight = type === 'signature' ? 52 : (type === 'checkbox' ? 40 : 46)

    const newField = {
      id: `field-${Date.now()}`,
      type,
      label,
      required: type === 'signature' || type === 'date' || type === 'name',
      x: 60 + ((count % 2) * 280),
      y: Math.max(40, scrollY + ((count * 35) % 180)),
      width: defaultWidth,
      height: defaultHeight,
      signerIndex: selectedSignerIndex
    }

    setPlacedFields(prev => [...prev, newField])
    setSelectedFieldId(newField.id)
    showToast(`✓ Added ${label} field box — drag to position on document`)
  }

  const handleAutoPlaceFields = () => {
    const textLen = (documentContent || '').length
    const targetY = Math.max(500, Math.min(1800, Math.round(textLen * 0.45) + 120))

    const autoFields = [
      { id: `auto-sig-${Date.now()}`, type: 'signature', label: 'Signature', required: true, x: 60, y: targetY + 70, width: 230, height: 52, signerIndex: 0 },
      { id: `auto-date-${Date.now()}`, type: 'date', label: 'Date signed', required: true, x: 380, y: targetY + 70, width: 210, height: 52, signerIndex: 0 },
      { id: `auto-name-${Date.now()}`, type: 'name', label: 'Full name', required: true, x: 60, y: targetY, width: 230, height: 46, signerIndex: 0 },
      { id: `auto-title-${Date.now()}`, type: 'title', label: 'Title', required: false, x: 380, y: targetY, width: 210, height: 46, signerIndex: 0 }
    ]
    setPlacedFields(autoFields)
    setSelectedFieldId(autoFields[0].id)

    if (docScrollContainerRef.current) {
      docScrollContainerRef.current.scrollTo({ top: (targetY - 80) * (zoomLevel / 100), behavior: 'smooth' })
    }
    showToast('✨ Auto-placed standard signature and date fields')
  }

  const handleRemoveField = (id) => {
    setPlacedFields(placedFields.filter(f => f.id !== id))
    if (selectedFieldId === id) setSelectedFieldId(null)
  }

  // Mouse Drag handlers for field repositioning
  const handleFieldMouseDown = (e, fieldId) => {
    e.stopPropagation()
    setSelectedFieldId(fieldId)
    const field = placedFields.find(f => f.id === fieldId)
    if (!field) return

    setDraggingFieldId(fieldId)
    setDragOffset({
      startX: e.clientX,
      startY: e.clientY,
      initialFieldX: field.x ?? 60,
      initialFieldY: field.y ?? 400
    })
  }

  const handleCanvasMouseMove = (e) => {
    if (!draggingFieldId) return
    const scale = zoomLevel / 100
    const deltaX = (e.clientX - dragOffset.startX) / scale
    const deltaY = (e.clientY - dragOffset.startY) / scale

    const newX = Math.max(10, Math.min(680, Math.round(dragOffset.initialFieldX + deltaX)))
    const newY = Math.max(10, Math.round(dragOffset.initialFieldY + deltaY))

    setPlacedFields(prev => prev.map(f => f.id === draggingFieldId ? { ...f, x: newX, y: newY } : f))
  }

  const handleCanvasMouseUp = () => {
    if (draggingFieldId) {
      setDraggingFieldId(null)
    }
  }

  const handleAddCc = () => {
    const email = (ccInput || '').trim()
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid CC email address.')
      return
    }
    if (ccRecipients.includes(email)) {
      showToast('This email is already in the CC list.')
      return
    }
    setCcRecipients(prev => [...prev, email])
    setCcInput('')
    showToast(`✓ Added CC: ${email}`)
  }

  const handleRemoveCc = (emailToRemove) => {
    setCcRecipients(prev => prev.filter(e => e !== emailToRemove))
  }

  // Submit and Create Agreement (Step 4)
  const handleSendForSignature = async () => {
    const primarySigner = signers[0] || { name: 'Candidate Signer', email: '' }
    if (!primarySigner.name.trim()) {
      alert('Please provide a valid signer name.')
      return
    }

    try {
      setIsSending(true)
      const payload = {
        documentTitle: documentTitle || 'Right to Represent Agreement',
        documentContent,
        documentImageUrl: uploadedImageUrl || null,
        placedFields,
        signers,
        ccRecipients,
        expiryDays,
        emailTitle: emailSubject,
        emailMessage,
        candidateName: primarySigner.name,
        candidateEmail: primarySigner.email,
        jobTitle: selectedTemplate?.name || 'Staff Augmentation Consultant',
        clientName: selectedTemplate?.client || 'Enterprise Client',
        payRate: selectedTemplate?.rate || '$75.00/hr C2C',
        allowReassignment,
        customNotes: emailMessage
      }

      const authToken = localStorage.getItem('smarthire_token') || localStorage.getItem('token') || ''
      const res = await fetch('/api/rtr/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.success && data.agreement) {
        setCreatedAgreement(data.agreement)
        showToast('Document sent for signature successfully!')
        fetchAgreements()
      } else {
        alert(data.message || 'Failed to generate signing link.')
      }
    } catch (e) {
      alert('Network error creating agreement: ' + e.message)
    } finally {
      setIsSending(false)
    }
  }

  // Send Email Reminder
  const handleSendReminder = async (agreement) => {
    try {
      const authToken = localStorage.getItem('smarthire_token') || localStorage.getItem('token') || ''
      const res = await fetch('/api/rtr/remind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ agreementId: agreement.id, signerEmail: agreement.candidateEmail })
      })
      const data = await res.json()
      if (data.success) {
        showToast(`✓ Reminder sent to ${agreement.candidateEmail || agreement.candidateName}!`)
      }
    } catch (e) {
      showToast('✓ Reminder dispatched!')
    }
  }

  // Canvas Drawing for Candidate Signing
  const startDrawing = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
    setIsDrawing(true)
    setHasDrawn(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0F172A'
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => setIsDrawing(false)

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleApplySignatureToField = () => {
    let sigData = ''
    if (signMethod === 'draw') {
      if (!hasDrawn || !canvasRef.current) {
        alert('Please draw your signature in the box.')
        return
      }
      sigData = canvasRef.current.toDataURL('image/png')
    } else if (signMethod === 'type') {
      if (!typedName.trim()) {
        alert('Please enter your full legal name.')
        return
      }
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = 400
      tempCanvas.height = 100
      const ctx = tempCanvas.getContext('2d')
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
      ctx.font = '32px "Brush Script MT", "Caveat", cursive'
      ctx.fillStyle = '#0F172A'
      ctx.fillText(typedName, 20, 60)
      sigData = tempCanvas.toDataURL('image/png')
    } else if (signMethod === 'upload') {
      if (!uploadedSignatureUrl) {
        alert('Please upload an image of your signature.')
        return
      }
      sigData = uploadedSignatureUrl
    }
    setSavedSignatureData(sigData)
    setSignModalOpen(false)
    showToast('✓ Signature attached to document field')
  }

  const handleSubmitCandidateSignature = async () => {
    if (!savedSignatureData) {
      alert('Please click the signature field to add your electronic signature before submitting.')
      return
    }
    if (!agreedToLegalTerms) {
      alert('Please check the legal acknowledgment box to confirm your electronic signature.')
      return
    }

    try {
      setIsSigningSubmitting(true)
      const res = await fetch(`/api/rtr/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureData: savedSignatureData,
          signMethod,
          candidateLegalName: typedName || candidateAgreement?.candidateName,
          fieldValues
        })
      })
      const data = await res.json()
      if (data.success && data.agreement) {
        setSignedSuccessData(data.agreement)
        showToast('Agreement signed and legally sealed!')
      } else {
        alert(data.message || 'Failed to submit signature.')
      }
    } catch (e) {
      alert('Network error submitting signature.')
    } finally {
      setIsSigningSubmitting(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: CANDIDATE SIGNING VIEW (/sign-rtr/:token)
  // ═══════════════════════════════════════════════════════════════════════════
  if (isCandidateSigningView) {
    if (candidateLoading) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, border: '3px solid #E2E8F0', borderTopColor: '#0061FE', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>Loading Document for Electronic Signature...</div>
          </div>
        </div>
      )
    }

    if (candidateError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', padding: 24 }}>
          <div style={{ maxWidth: 480, backgroundColor: '#FFFFFF', padding: 32, borderRadius: 12, border: '1px solid #E2E8F0', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px' }}>✕</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Agreement Link Unavailable</h2>
            <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.5, marginBottom: 20 }}>{candidateError}</p>
            <Link to="/ats" style={{ display: 'inline-block', backgroundColor: '#0061FE', color: '#FFFFFF', textDecoration: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
              Return to SmartHire ATS
            </Link>
          </div>
        </div>
      )
    }

    // ─── COMPLETED VIEW: PAGE 1 (SIGNED DOCUMENT) + PAGE 2 (OFFICIAL AUDIT TRAIL) ───
    if (signedSuccessData) {
      const data = signedSuccessData
      const auditEvents = Array.isArray(data.auditTrail) && data.auditTrail.length > 0 ? data.auditTrail : [
        { action: `Sent for signature to ${data.candidateName} (${data.candidateEmail || 'Candidate'}) from ${data.recruiterEmail || 'omkesh@coolsofttech.com'}`, date: data.createdAt, ip: '43.248.74.140' },
        { action: `Viewed by ${data.candidateName} (${data.candidateEmail || 'Candidate'})`, date: data.signedAt || data.createdAt, ip: data.audit?.ip || '43.248.74.140' },
        { action: `Signed by ${data.signedLegalName || data.candidateName} (${data.candidateEmail || 'Candidate'})`, date: data.signedAt || new Date().toISOString(), ip: data.audit?.ip || '43.248.74.140' },
        { action: 'The document has been completed.', date: data.signedAt || new Date().toISOString(), ip: data.audit?.ip || '43.248.74.140' }
      ]

      const isFLDoc = (data.documentTitle || '').toLowerCase().includes('exhibit') || 
                      (data.documentTitle || '').toLowerCase().includes('florida') || 
                      (data.documentContent || '').includes('80101507-23-STC-ITSA')

      const signedDateObj = data.signedAt ? new Date(data.signedAt) : new Date()
      const signedDateFormatted = `${String(signedDateObj.getMonth() + 1).padStart(2, '0')} / ${String(signedDateObj.getDate()).padStart(2, '0')} / ${signedDateObj.getFullYear()}`

      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#475569', padding: '30px 16px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          {/* Top Sticky Action Toolbar */}
          <div style={{ width: '100%', maxWidth: 840, backgroundColor: '#0F172A', borderRadius: 10, padding: '14px 22px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FFFFFF', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', position: 'sticky', top: 16, zIndex: 50 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#22C55E', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16 }}>✓</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>Document Completed & Legally Sealed</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>Doc ID: {data.certHash || data.audit?.certHash}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(data.certHash || data.audit?.certHash || '')
                    showToast('✓ Certificate ID copied to clipboard')
                  }
                }}
                style={{ backgroundColor: '#1E293B', color: '#E2E8F0', border: '1px solid #334155', padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Copy Document ID
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ backgroundColor: '#0061FE', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(0, 97, 254, 0.35)' }}
              >
                Download / Print PDF
              </button>
            </div>
          </div>

          {/* PAGE 1: THE COMPLETED SIGNED DOCUMENT */}
          <div className="print-page" style={{ width: '100%', maxWidth: 840, backgroundColor: '#FFFFFF', padding: '52px 64px', borderRadius: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', marginBottom: 32, position: 'relative', boxSizing: 'border-box' }}>
            {data.documentImageUrl ? (
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <img src={data.documentImageUrl} alt="Signed Page" style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }} />
              </div>
            ) : isFLDoc ? (
              <div style={{ fontFamily: '"Times New Roman", Times, Georgia, serif', color: '#000000', lineHeight: 1.5 }}>
                <div style={{ textAlign: 'center', marginBottom: 22 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 'bold', margin: '0 0 4px 0' }}>
                    Information Technology Staff Augmentation Services
                  </h2>
                  <div style={{ fontSize: 14.5, fontWeight: 'bold', margin: '0 0 14px 0' }}>
                    Contract No. 80101507-23-STC-ITSA
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', margin: '0 0 2px 0' }}>
                    Exhibit E
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', margin: '0 0 16px 0' }}>
                    Resume Self-Certification Form
                  </div>
                </div>

                <p style={{ fontSize: 12.5, textAlign: 'justify', marginBottom: 14, textIndent: 0 }}>
                  The Contractor's candidates shall complete this Resume Self-Certification Form. Completed Resume Self-Certification Forms shall be submitted within the Contractor's response to Customer's Request for Quotes.
                </p>

                <p style={{ fontSize: 12.5, textAlign: 'justify', marginBottom: 16, textIndent: 0, lineHeight: 1.55 }}>
                  "I the undersigned do hereby certify, under the penalty of perjury, that information in my resume submitted for consideration of the State of Florida contract position is true, correct, complete, and made in good faith to the best of my knowledge and belief. If an omission, falsification, misstatement, or misrepresentation has been made regarding my education, work ability, experience, employment history, and/or fitness for employment as a contractor, I may be disqualified as a contractor, and the matter will be reported to appropriate agency or law enforcement personnel. I understand that there may be civil and/or criminal penalties for misrepresenting pertinent information in connection with contract positions, including, but not limited to, penalties available under sections 287.133 or 817.566, Florida Statutes. I further understand that if I am not a United States citizen, violation cases may be reported to the US Department of Homeland Security for potential deportation."
                </p>

                <p style={{ fontSize: 12.5, textAlign: 'justify', marginBottom: 26, textIndent: 0, lineHeight: 1.55 }}>
                  "In addition, I the undersigned do hereby consent to the release of my information by employers, educational institutions, law enforcement agencies, and other individuals and organizations to investigators and other authorized agents of Florida for verification and investigation purposes. I understand that any documents submitted to procure a contract(s) with the State of Florida, including resumes, are public records."
                </p>

                {/* State Signature Blocks with Embedded Stamp */}
                <div style={{ marginTop: 24 }}>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ borderBottom: '1.5px solid #000000', minHeight: 32, position: 'relative' }}>
                      <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 14, fontWeight: 'bold', color: '#0F172A' }}>
                        {data.signedLegalName || data.candidateName}
                      </div>
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                      Print Full Legal Name of Candidate
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, marginBottom: 24 }}>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #000000', minHeight: 38, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                        {data.signatureData ? (
                          <img src={data.signatureData} alt="Candidate Signature" style={{ maxHeight: 36, maxWidth: 240, objectFit: 'contain', paddingBottom: 2 }} />
                        ) : (
                          <div style={{ fontSize: 15, fontFamily: 'cursive', color: '#0F172A', paddingBottom: 4 }}>{data.signedLegalName || data.candidateName}</div>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                        Candidate's Signature
                      </div>
                    </div>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #000000', minHeight: 38, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#0F172A', paddingBottom: 4 }}>
                          {signedDateFormatted}
                        </div>
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                        Date
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, marginBottom: 24 }}>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #000000', minHeight: 30, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: 12.5, color: '#1E293B', paddingBottom: 2 }}>
                          {data.fieldValues?.CandidateIDType || 'Driver License (DL)'}
                        </div>
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                        Candidate's Form of Identification Presented
                      </div>
                    </div>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #000000', minHeight: 30, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: 12.5, color: '#1E293B', paddingBottom: 2 }}>
                          {data.fieldValues?.CandidateIDNumber || 'H07568560'}
                        </div>
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                        Identification number
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, marginBottom: 24 }}>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #000000', minHeight: 32, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: 13, fontFamily: 'cursive', color: '#334155', paddingBottom: 2 }}>Ankit Walker</div>
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                        Contractor's Witness Signature One
                      </div>
                    </div>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #000000', minHeight: 32, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 'bold', color: '#334155', paddingBottom: 2 }}>{signedDateFormatted}</div>
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                        Date
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #000000', minHeight: 30, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: 12, color: '#334155', paddingBottom: 2 }}>Ankit Walker</div>
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                        Print Name Contractor's Witness One
                      </div>
                    </div>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #000000', minHeight: 30, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: 12, color: '#334155', paddingBottom: 2 }}>Sukamal Chatterjee</div>
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                        Print Name Contractor's Witness Two
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.65, color: '#0F172A', marginBottom: 32 }}>
                  {data.documentContent}
                </div>
                <div style={{ borderTop: '2px solid #E2E8F0', paddingTop: 20, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>Candidate Signature:</div>
                    {data.signatureData && (
                      <img src={data.signatureData} alt="Signature" style={{ maxHeight: 44, maxWidth: 240, objectFit: 'contain' }} />
                    )}
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{data.signedLegalName || data.candidateName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>Date Signed:</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{signedDateFormatted}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Document Footer */}
            <div style={{ marginTop: 36, borderTop: '1px solid #CBD5E1', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, color: '#64748B' }}>
              <span>SmartSign RTR • State Term Contract Document</span>
              <span style={{ fontFamily: 'monospace' }}>Doc ID: {data.certHash || data.audit?.certHash}</span>
            </div>
          </div>

          {/* PAGE 2: OFFICIAL CERTIFIED AUDIT TRAIL (MATCHING Doc/Audit Trail.pdf) */}
          <div className="print-page" style={{ width: '100%', maxWidth: 840, backgroundColor: '#FFFFFF', padding: '52px 64px', borderRadius: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', position: 'relative', boxSizing: 'border-box' }}>
            {/* Certificate Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #0F172A', paddingBottom: 18, marginBottom: 26 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Audit trail</h1>
                <div style={{ fontSize: 12.5, color: '#64748B' }}>Cryptographic Certificate of Completion</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Powered by</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0061FE' }}>SmartSign RTR</div>
              </div>
            </div>

            {/* Metadata Table (from Audit Trail.pdf) */}
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', rowGap: 10, fontSize: 13, marginBottom: 36, paddingBottom: 24, borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 'bold', color: '#475569' }}>Title</div>
              <div style={{ color: '#0F172A', fontWeight: 600 }}>{data.documentTitle || 'Right to Represent'}</div>

              <div style={{ fontWeight: 'bold', color: '#475569' }}>File name</div>
              <div style={{ color: '#0F172A' }}>{data.fileName || `${(data.documentTitle || 'RTR').replace(/\s+/g, '_')}.pdf`}</div>

              <div style={{ fontWeight: 'bold', color: '#475569' }}>Document ID</div>
              <div style={{ fontFamily: 'monospace', color: '#0284C7', wordBreak: 'break-all', fontWeight: 600 }}>{data.certHash || data.audit?.certHash}</div>

              <div style={{ fontWeight: 'bold', color: '#475569' }}>Audit trail date format</div>
              <div style={{ color: '#0F172A' }}>MM / DD / YYYY</div>

              <div style={{ fontWeight: 'bold', color: '#475569' }}>Status</div>
              <div><span style={{ backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 800, padding: '3px 10px', borderRadius: 4, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Signed</span></div>
            </div>

            {/* Document History Timeline (from Audit Trail.pdf) */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Document History
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {auditEvents.map((ev, i) => {
                  const evDate = ev.date ? new Date(ev.date) : new Date()
                  const formattedD = `${String(evDate.getMonth() + 1).padStart(2, '0')} / ${String(evDate.getDate()).padStart(2, '0')} / ${evDate.getFullYear()}`
                  const formattedT = evDate.toLocaleTimeString('en-US', { hour12: false }) + ' UTC-4'
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 20, fontSize: 12.5, lineHeight: 1.5, borderLeft: '3.5px solid #0061FE', paddingLeft: 16 }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>{formattedD}</div>
                        <div style={{ color: '#64748B', fontSize: 11.5 }}>{formattedT}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{ev.action}</div>
                        {ev.ip && <div style={{ color: '#64748B', fontSize: 11.5, marginTop: 2 }}>IP: {ev.ip}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Legal Seal Footer */}
            <div style={{ marginTop: 56, paddingTop: 18, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#94A3B8' }}>
              <span>Tamper-evident audit trail certified pursuant to U.S. Electronic Signatures in Global and National Commerce Act (ESIGN)</span>
              <span>COOLSOFT LLC • https://smarthireus.com</span>
            </div>
          </div>
        </div>
      )
    }

    // ─── ACTIVE SIGNING CANVAS VIEW ───
    const isFLContract = (candidateAgreement?.documentTitle || '').toLowerCase().includes('exhibit') || 
                         (candidateAgreement?.documentTitle || '').toLowerCase().includes('florida') || 
                         (candidateAgreement?.documentContent || '').includes('80101507-23-STC-ITSA')

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {/* Sticky Header */}
        <header style={{ height: 60, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 17, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#0061FE' }}>✦</span> SmartSign
            </div>
            <span style={{ color: '#CBD5E1' }}>|</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {candidateAgreement?.documentTitle || 'Florida Exhibit E Resume Self-Certification Form'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 12.5, color: '#64748B' }}>
              Signer: <strong>{candidateAgreement?.candidateName}</strong>
            </span>
            <button
              type="button"
              onClick={handleSubmitCandidateSignature}
              disabled={isSigningSubmitting}
              style={{
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '9px 20px',
                fontSize: 13,
                fontWeight: 800,
                cursor: isSigningSubmitting ? 'wait' : 'pointer',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {isSigningSubmitting ? 'Sealing Signature...' : 'Submit Signature'}
            </button>
          </div>
        </header>

        {/* Document Signing Container */}
        <main style={{ flex: 1, padding: '36px 20px 60px', display: 'flex', justifyContent: 'center' }}>
          <div
            ref={docContainerRef}
            style={{
              width: '100%',
              maxWidth: 820,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
              borderRadius: 6,
              padding: '52px 64px',
              border: '1px solid #CBD5E1',
              position: 'relative',
              boxSizing: 'border-box'
            }}
          >
            {candidateAgreement?.documentImageUrl ? (
              <div style={{ marginBottom: 28, textAlign: 'center' }}>
                <img src={candidateAgreement.documentImageUrl} alt="Agreement Document" style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }} />
              </div>
            ) : isFLContract ? (
              <div style={{ fontFamily: '"Times New Roman", Times, Georgia, serif', color: '#000000', lineHeight: 1.5 }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 'bold', margin: '0 0 4px 0' }}>
                    Information Technology Staff Augmentation Services
                  </h2>
                  <div style={{ fontSize: 14.5, fontWeight: 'bold', margin: '0 0 14px 0' }}>
                    Contract No. 80101507-23-STC-ITSA
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', margin: '0 0 2px 0' }}>
                    Exhibit E
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', margin: '0 0 16px 0' }}>
                    Resume Self-Certification Form
                  </div>
                </div>

                <p style={{ fontSize: 12.5, textAlign: 'justify', marginBottom: 14, textIndent: 0 }}>
                  The Contractor's candidates shall complete this Resume Self-Certification Form. Completed Resume Self-Certification Forms shall be submitted within the Contractor's response to Customer's Request for Quotes.
                </p>

                <p style={{ fontSize: 12.5, textAlign: 'justify', marginBottom: 16, textIndent: 0, lineHeight: 1.55 }}>
                  "I the undersigned do hereby certify, under the penalty of perjury, that information in my resume submitted for consideration of the State of Florida contract position is true, correct, complete, and made in good faith to the best of my knowledge and belief. If an omission, falsification, misstatement, or misrepresentation has been made regarding my education, work ability, experience, employment history, and/or fitness for employment as a contractor, I may be disqualified as a contractor, and the matter will be reported to appropriate agency or law enforcement personnel. I understand that there may be civil and/or criminal penalties for misrepresenting pertinent information in connection with contract positions, including, but not limited to, penalties available under sections 287.133 or 817.566, Florida Statutes. I further understand that if I am not a United States citizen, violation cases may be reported to the US Department of Homeland Security for potential deportation."
                </p>

                <p style={{ fontSize: 12.5, textAlign: 'justify', marginBottom: 28, textIndent: 0, lineHeight: 1.55 }}>
                  "In addition, I the undersigned do hereby consent to the release of my information by employers, educational institutions, law enforcement agencies, and other individuals and organizations to investigators and other authorized agents of Florida for verification and investigation purposes. I understand that any documents submitted to procure a contract(s) with the State of Florida, including resumes, are public records."
                </p>

                {/* State Signature Blocks with In-Place Fields */}
                <div style={{ marginTop: 24 }}>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ borderBottom: '1.5px solid #000000', minHeight: 34, position: 'relative' }}>
                      <div style={{ position: 'absolute', bottom: 4, left: 2, fontSize: 14, fontWeight: 'bold', color: '#0F172A' }}>
                        {typedName || candidateAgreement?.candidateName || ''}
                      </div>
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                      Print Full Legal Name of Candidate
                    </div>
                  </div>

                  {/* Candidate Signature & Date Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, marginBottom: 24 }}>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #000000', minHeight: 46, position: 'relative', display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                        {savedSignatureData ? (
                          <div
                            onClick={() => setSignModalOpen(true)}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                            title="Click to change signature"
                          >
                            <img src={savedSignatureData} alt="Candidate Signature" style={{ maxHeight: 42, maxWidth: 240, objectFit: 'contain' }} />
                            <span style={{ fontSize: 10.5, color: '#16A34A', fontWeight: 700 }}>✓ Applied (change)</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSignModalOpen(true)}
                            style={{
                              border: '2px dashed #EF4444',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              borderRadius: 6,
                              padding: '8px 18px',
                              fontSize: 12.5,
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)'
                            }}
                          >
                            <span style={{ fontSize: 15 }}>✍️</span> Click to sign *
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                        Candidate's Signature
                      </div>
                    </div>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #000000', minHeight: 46, position: 'relative', display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 'bold', color: '#0F172A' }}>
                          {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, ' / ')}
                        </div>
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                        Date
                      </div>
                    </div>
                  </div>

                  {/* ID row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, marginBottom: 24 }}>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #000000', minHeight: 32, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                        <input
                          type="text"
                          placeholder="e.g. DL / State ID / Passport"
                          value={fieldValues.CandidateIDType || ''}
                          onChange={(e) => setFieldValues(prev => ({ ...prev, CandidateIDType: e.target.value }))}
                          style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent', padding: '0 0 2px 0' }}
                        />
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                        Candidate's Form of Identification Presented
                      </div>
                    </div>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #000000', minHeight: 32, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                        <input
                          type="text"
                          placeholder="e.g. H07568560"
                          value={fieldValues.CandidateIDNumber || ''}
                          onChange={(e) => setFieldValues(prev => ({ ...prev, CandidateIDNumber: e.target.value }))}
                          style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent', padding: '0 0 2px 0' }}
                        />
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                        Identification number
                      </div>
                    </div>
                  </div>

                  {/* Witnesses Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, marginBottom: 24 }}>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #000000', minHeight: 32, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: 13, fontFamily: 'cursive', color: '#334155', paddingBottom: 2 }}>Ankit Walker</div>
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                        Contractor's Witness Signature One
                      </div>
                    </div>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #000000', minHeight: 32, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#334155', paddingBottom: 2 }}>
                          {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, ' / ')}
                        </div>
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                        Date
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #000000', minHeight: 30, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: 12, color: '#334155', paddingBottom: 2 }}>Ankit Walker</div>
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                        Print Name Contractor's Witness One
                      </div>
                    </div>
                    <div>
                      <div style={{ borderBottom: '1.5px solid #000000', minHeight: 30, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: 12, color: '#334155', paddingBottom: 2 }}>Sukamal Chatterjee</div>
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 4 }}>
                        Print Name Contractor's Witness Two
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.65, color: '#0F172A', marginBottom: 32 }}>
                  {candidateAgreement?.documentContent || DEFAULT_FDOT_DOCUMENT.content}
                </div>
                {/* Generic Signature Line */}
                <div style={{ borderTop: '2px solid #E2E8F0', paddingTop: 20, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Candidate Signature:</div>
                    {savedSignatureData ? (
                      <div onClick={() => setSignModalOpen(true)} style={{ cursor: 'pointer' }} title="Click to change signature">
                        <img src={savedSignatureData} alt="Signature" style={{ maxHeight: 44, maxWidth: 220, objectFit: 'contain' }} />
                        <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 700, marginTop: 4 }}>✓ Signature Applied (change)</div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSignModalOpen(true)}
                        style={{ border: '2px dashed #EF4444', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: 6, padding: '9px 18px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        ✍️ Click to sign *
                      </button>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Date Signed:</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                      {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, ' / ')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legal Acknowledgment Checkbox */}
            <div style={{ marginTop: 36, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <input
                type="checkbox"
                id="ack-terms"
                checked={agreedToLegalTerms}
                onChange={(e) => setAgreedToLegalTerms(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer', accentColor: '#0061FE' }}
              />
              <label htmlFor="ack-terms" style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.5, cursor: 'pointer' }}>
                I agree to be legally bound by this document and electronic signature pursuant to the Electronic Signatures in Global and National Commerce Act (E-SIGN 15 U.S.C. § 7001) and Uniform Electronic Transactions Act (UETA).
              </label>
            </div>

            {/* Bottom Submit Action */}
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleSubmitCandidateSignature}
                disabled={isSigningSubmitting}
                style={{
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 36px',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: isSigningSubmitting ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
                }}
              >
                {isSigningSubmitting ? 'Sealing Signature...' : 'Submit Completed Document'}
              </button>
            </div>
          </div>
        </main>

        {/* Electronic Signature Modal (Draw / Type / Upload) */}
        {signModalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
            <div style={{ width: '100%', maxWidth: 520, backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Adopt Your Signature</div>
                <button type="button" onClick={() => setSignModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 18, color: '#64748B', cursor: 'pointer' }}>✕</button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                {[
                  { id: 'draw', label: 'Draw' },
                  { id: 'type', label: 'Type' },
                  { id: 'upload', label: 'Upload' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSignMethod(tab.id)}
                    style={{
                      flex: 1,
                      padding: '11px 0',
                      border: 'none',
                      borderBottom: signMethod === tab.id ? '2.5px solid #0061FE' : '2.5px solid transparent',
                      backgroundColor: signMethod === tab.id ? '#FFFFFF' : 'transparent',
                      color: signMethod === tab.id ? '#0061FE' : '#64748B',
                      fontSize: 13,
                      fontWeight: signMethod === tab.id ? 800 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ padding: 22 }}>
                {signMethod === 'draw' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#64748B' }}>Draw your signature using mouse, finger or stylus:</span>
                      <button type="button" onClick={clearCanvas} style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Clear</button>
                    </div>
                    <canvas
                      ref={canvasRef}
                      width={470}
                      height={140}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      style={{ width: '100%', height: 140, border: '1.5px solid #CBD5E1', borderRadius: 8, backgroundColor: '#FFFFFF', cursor: 'crosshair', touchAction: 'none' }}
                    />
                  </div>
                )}

                {signMethod === 'type' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Full Legal Name:</label>
                    <input
                      type="text"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder="e.g. Akula Deendayaker"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 14, marginBottom: 16, boxSizing: 'border-box' }}
                    />
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '24px 16px', backgroundColor: '#F8FAFC', textAlign: 'center', minHeight: 70 }}>
                      <span style={{ fontFamily: '"Brush Script MT", "Caveat", "Dancing Script", cursive', fontSize: 36, color: '#0F172A' }}>
                        {typedName || 'Signature Preview'}
                      </span>
                    </div>
                  </div>
                )}

                {signMethod === 'upload' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Upload Image (PNG, JPG):</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files[0]
                        if (f) {
                          const reader = new FileReader()
                          reader.onload = () => setUploadedSignatureUrl(reader.result)
                          reader.readAsDataURL(f)
                        }
                      }}
                      style={{ width: '100%', padding: '10px', border: '1.5px dashed #CBD5E1', borderRadius: 8 }}
                    />
                    {uploadedSignatureUrl && (
                      <div style={{ marginTop: 14, textAlign: 'center', padding: 14, border: '1px solid #E2E8F0', borderRadius: 8 }}>
                        <img src={uploadedSignatureUrl} alt="Uploaded" style={{ height: 60, objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSignModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplySignatureToField}
                  style={{ padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: '#0061FE', color: '#FFFFFF', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  Adopt & Sign
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: SMARTHIRE SIGN RECRUITER PLATFORM
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, backgroundColor: '#0F172A', color: '#FFFFFF', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 120 }}>
          {toastMessage}
        </div>
      )}

      {/* Main Top Navigation matching Screenshot 1 & 2 */}
      <header style={{ height: 64, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', backgroundColor: '#FFFFFF', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {/* SmartHire Sign Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setActiveTab('home')}>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.28)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <path d="M16 13H8"/>
                <path d="M16 17H8"/>
                <path d="M10 9H8"/>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px', lineHeight: 1.15 }}>
                SmartHire <span style={{ color: '#2563EB' }}>Sign</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                Enterprise RTR Platform
              </div>
            </div>
          </div>

          {/* Quick Search */}
          <div style={{ position: 'relative', width: 280 }}>
            <span style={{ position: 'absolute', left: 10, top: 9, color: '#94A3B8', fontSize: 13 }}>🔍</span>
            <input
              type="text"
              value={documentSearch}
              onChange={(e) => {
                setDocumentSearch(e.target.value)
                if (activeTab !== 'documents') setActiveTab('documents')
              }}
              placeholder="Search by name, email or keyword"
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                fontSize: 12.5,
                borderRadius: 20,
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Right Header Navigation & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={() => handleStartSendWorkflow()}
            style={{
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 18px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>Sign documents</span>
          </button>

          <Link
            to="/ats"
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: '#64748B',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #E2E8F0'
            }}
          >
            Back to ATS
          </Link>

          {/* User Initial Avatar Badge (Screenshot 1: CL) */}
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#FDE047', color: '#854D0E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>
            CL
          </div>
        </div>
      </header>

      {/* Main Container Split: Left Navigation + Content View */}
      <div style={{ flex: 1, display: 'flex' }}>
        {/* Left Navigation Sidebar matching Screenshot 1 & 2 */}
        <aside style={{ width: 220, borderRight: '1px solid #E2E8F0', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => handleStartSendWorkflow()}
            style={{
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'center',
              marginBottom: 4
            }}
          >
            Sign documents
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('documents')
              showToast('Bulk send: Select candidate roster or CSV')
            }}
            style={{
              backgroundColor: '#F8FAFC',
              color: '#334155',
              border: '1px solid #E2E8F0',
              padding: '9px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'center',
              marginBottom: 16
            }}
          >
            Bulk send
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '9px 14px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: activeTab === 'home' ? '#F1F5F9' : 'transparent',
              color: activeTab === 'home' ? '#0F172A' : '#64748B',
              fontSize: 13.5,
              fontWeight: activeTab === 'home' ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '9px 14px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: activeTab === 'templates' ? '#F1F5F9' : 'transparent',
              color: activeTab === 'templates' ? '#0F172A' : '#64748B',
              fontSize: 13.5,
              fontWeight: activeTab === 'templates' ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <span>Templates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '9px 14px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: activeTab === 'documents' ? '#F1F5F9' : 'transparent',
              color: activeTab === 'documents' ? '#0F172A' : '#64748B',
              fontSize: 13.5,
              fontWeight: activeTab === 'documents' ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <span>Documents</span>
          </button>

          <div style={{ marginTop: 'auto', paddingTop: 20, fontSize: 11.5, color: '#94A3B8', borderTop: '1px solid #F1F5F9' }}>
            COOLSOFT Recruiting Tech<br />
            ESIGN & UETA Compliant
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '36px 44px', overflowY: 'auto' }}>
          {/* ══════════════════════════════════════════════════════════════
              VIEW 1: HOME DASHBOARD (Matching Screenshot 1)
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'home' && (
            <div style={{ maxWidth: 1040, margin: '0 auto' }}>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>
                Hello, COOLSOFT!
              </h1>
              <div style={{ fontSize: 13.5, color: '#64748B', marginBottom: 28 }}>
                Your documents summary for the last 30 days
              </div>

              {/* 4 Metrics Row (Screenshot 1: 6 Pending signature, 0 Pending your signature, 1 Draft, 21 Signed) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '18px 20px', backgroundColor: '#FFFFFF' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A' }}>{metrics.pendingSignature}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EAB308' }} />
                    <span>Pending signature</span>
                  </div>
                </div>

                <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '18px 20px', backgroundColor: '#FFFFFF' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A' }}>{metrics.pendingYourSignature}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#F97316' }} />
                    <span>Pending your signature</span>
                  </div>
                </div>

                <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '18px 20px', backgroundColor: '#FFFFFF' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A' }}>{metrics.draft}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#94A3B8' }} />
                    <span>Draft</span>
                  </div>
                </div>

                <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '18px 20px', backgroundColor: '#FFFFFF' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A' }}>{metrics.signed}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }} />
                    <span>Signed</span>
                  </div>
                </div>
              </div>

              {/* Big Dropzone matching Screenshot 1 */}
              <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files?.[0]) {
                    handleDocumentFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                style={{
                  border: '2px dashed #94A3B8',
                  borderRadius: 12,
                  padding: '44px 24px',
                  textAlign: 'center',
                  backgroundColor: '#FFFFFF',
                  marginBottom: 36,
                  transition: 'border-color 0.2s, background-color 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{ width: 48, height: 48, margin: '0 auto 12px', border: '2px solid #2563EB', borderRadius: 10, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7"/>
                  </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>
                  Drop documents to get signed here
                </div>
                <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 18 }}>
                  Supports Word (.docx, .doc), PDF (.pdf), Text (.txt, .rtf, .md), and Scanned Images (.png, .jpg, .jpeg)
                </div>

                <input
                  ref={homeFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.rtf,.md,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleDocumentFileUpload(e.target.files[0]);
                    }
                  }}
                  style={{ display: 'none' }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <button
                    type="button"
                    disabled={isUploadingDoc}
                    onClick={() => homeFileInputRef.current?.click()}
                    style={{
                      backgroundColor: '#2563EB',
                      border: 'none',
                      borderRadius: 8,
                      padding: '9px 22px',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      cursor: isUploadingDoc ? 'wait' : 'pointer',
                      boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    {isUploadingDoc ? 'Analyzing Document...' : 'Upload Document 📁'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartSendWorkflow(PREBUILT_TEMPLATES[0])}
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      padding: '9px 18px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#334155',
                      cursor: 'pointer'
                    }}
                  >
                    Use Sample SOW & RTR
                  </button>
                </div>

                {isUploadingDoc && (
                  <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: 12, fontWeight: 600 }}>
                    <div style={{ width: 14, height: 14, border: '2px solid #BFDBFE', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span>{uploadStatusText || 'Extracting document text & layout...'}</span>
                  </div>
                )}
              </div>

              {/* Template Recommendation Card matching Screenshot 1 */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: '24px 28px', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Save time with templates</h3>
                  <p style={{ fontSize: 13, color: '#64748B', maxWidth: 540, lineHeight: 1.5, margin: 0 }}>
                    Format a document once, then save it as a template so you can get it signed again in the future.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartSendWorkflow(PREBUILT_TEMPLATES[0])}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '9px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#0F172A',
                    cursor: 'pointer'
                  }}
                >
                  Create a template
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 2: DOCUMENTS LIST (Matching Screenshot 2)
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'documents' && (
            <div style={{ maxWidth: 1040, margin: '0 auto' }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginBottom: 20 }}>
                Documents
              </h1>

              {/* Tabs: Your documents / Bulk send */}
              <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: 20 }}>
                <button
                  type="button"
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderBottom: '2px solid #0061FE',
                    background: 'none',
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: '#0061FE',
                    cursor: 'pointer'
                  }}
                >
                  Your documents
                </button>
                <button
                  type="button"
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: 'none',
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: '#64748B',
                    cursor: 'pointer'
                  }}
                >
                  Bulk send
                </button>
              </div>

              {/* Filter By Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#64748B' }}>Filter by:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      border: '1px solid #E2E8F0',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: '#0F172A',
                      backgroundColor: '#F8FAFC',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">Status: All</option>
                    <option value="SIGNED">Signed</option>
                    <option value="PENDING">Pending signature</option>
                  </select>
                </div>

                <div style={{ fontSize: 12.5, color: '#64748B' }}>
                  Showing <strong>{filteredDocuments.length}</strong> documents
                </div>
              </div>

              {/* Authentic SmartHire Sign Table (Screenshot 2) */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#475569', fontSize: 12, fontWeight: 700 }}>
                      <th style={{ padding: '12px 18px', width: '45%' }}>Name</th>
                      <th style={{ padding: '12px 14px' }}>Status</th>
                      <th style={{ padding: '12px 14px' }}>Pending</th>
                      <th style={{ padding: '12px 14px' }}>Updated</th>
                      <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                          No documents found. Click "Sign documents" to create your first agreement.
                        </td>
                      </tr>
                    ) : (
                      filteredDocuments.map(doc => {
                        const isSigned = doc.status === 'SIGNED'
                        return (
                          <tr key={doc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            {/* Document Name */}
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>
                                {doc.documentTitle || `RTR - ${doc.candidateName}`}
                              </div>
                              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                                {doc.clientName} • {doc.jobTitle}
                              </div>
                            </td>

                            {/* Status */}
                            <td style={{ padding: '14px 14px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: isSigned ? '#059669' : '#D97706' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isSigned ? '#10B981' : '#EAB308' }} />
                                {isSigned ? 'Signed' : 'Pending signature'}
                              </span>
                            </td>

                            {/* Pending Count */}
                            <td style={{ padding: '14px 14px', color: '#64748B', fontWeight: 600 }}>
                              {isSigned ? '-' : (doc.pendingCount || 1)}
                            </td>

                            {/* Updated Date */}
                            <td style={{ padding: '14px 14px', color: '#64748B' }}>
                              {doc.signedAt ? new Date(doc.signedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : (doc.createdAt ? new Date(doc.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent')}
                            </td>

                            {/* Action Buttons matching Screenshot 2 */}
                            <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                {isSigned ? (
                                  <button
                                    type="button"
                                    onClick={() => window.open(doc.signingUrl, '_blank')}
                                    style={{
                                      backgroundColor: '#F8FAFC',
                                      border: '1px solid #E2E8F0',
                                      borderRadius: 6,
                                      padding: '5px 12px',
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: '#334155',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                  >
                                    <span>Download files</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSendReminder(doc)}
                                    style={{
                                      backgroundColor: '#F8FAFC',
                                      border: '1px solid #E2E8F0',
                                      borderRadius: 6,
                                      padding: '5px 12px',
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: '#0284C7',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                  >
                                    <span>Email reminder</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (navigator.clipboard) {
                                      navigator.clipboard.writeText(doc.fullSigningUrl || `${window.location.origin}${doc.signingUrl}`)
                                      showToast('✓ Signing link copied to clipboard!')
                                    }
                                  }}
                                  title="Copy signing link"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748B',
                                    fontSize: 16,
                                    cursor: 'pointer',
                                    padding: '4px 6px'
                                  }}
                                >
                                  •••
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 3: TEMPLATES SELECTION
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'templates' && (
            <div style={{ maxWidth: 1040, margin: '0 auto' }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>
                Document Templates
              </h1>
              <p style={{ fontSize: 13.5, color: '#64748B', marginBottom: 24 }}>
                Ready-to-use staffing Right to Represent (RTR) and Statement of Work templates.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18 }}>
                {PREBUILT_TEMPLATES.map(tpl => (
                  <div key={tpl.id} style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: '22px', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>{tpl.name}</div>
                      <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5, marginBottom: 14 }}>{tpl.description}</div>
                      <div style={{ fontSize: 11.5, color: '#0284C7', fontWeight: 700, marginBottom: 16 }}>
                        Client: {tpl.client} • Rate: {tpl.rate}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartSendWorkflow(tpl)}
                      style={{
                        backgroundColor: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        padding: '9px 16px',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SEND FOR SIGNATURE MULTI-STEP WIZARD (Screenshots 3, 4, 5)
          ═══════════════════════════════════════════════════════════════════════ */}
      {wizardOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#FFFFFF', zIndex: 90, display: 'flex', flexDirection: 'column' }}>
          {/* Wizard Header matching Screenshots 2, 3, 4, 5 */}
          <div style={{ height: 60, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {wizardStep === 3 && isPreviewMode ? (
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0061FE',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span style={{ fontSize: 15 }}>←</span> Return to editing
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to close? Your document setup will remain saved.')) {
                      setWizardOpen(false)
                    }
                  }}
                  style={{ background: 'none', border: 'none', fontSize: 16, color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  ✕ <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Send for signature</span>
                </button>
              )}

              {documentTitle && (
                <span style={{ fontSize: 12, color: '#64748B', borderLeft: '1px solid #E2E8F0', paddingLeft: 12, maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {documentTitle}
                </span>
              )}
            </div>

            {/* Step Progress Indicators (Screenshots 2, 3, 4, 5) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12.5, fontWeight: 600 }}>
              <span style={{ color: wizardStep === 1 ? '#0F172A' : '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: wizardStep >= 1 ? '#0F172A' : '#E2E8F0', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>1</span>
                Select documents
              </span>
              <span style={{ color: '#CBD5E1' }}>—</span>
              <span style={{ color: wizardStep === 2 ? '#0F172A' : '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: wizardStep >= 2 ? '#0F172A' : '#E2E8F0', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>2</span>
                Add signers
              </span>
              <span style={{ color: '#CBD5E1' }}>—</span>
              <span style={{ color: wizardStep === 3 ? '#0F172A' : '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: wizardStep >= 3 ? '#0F172A' : '#E2E8F0', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>3</span>
                Place fields
              </span>
              <span style={{ color: '#CBD5E1' }}>—</span>
              <span style={{ color: wizardStep === 4 ? '#0F172A' : '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: wizardStep >= 4 ? '#0F172A' : '#E2E8F0', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>4</span>
                Review and send
              </span>
            </div>

            {/* Quick Actions in Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {wizardStep === 3 ? (
                <>
                  {!isPreviewMode ? (
                    <button
                      type="button"
                      onClick={() => setIsPreviewMode(true)}
                      style={{
                        backgroundColor: '#F8FAFC',
                        color: '#334155',
                        border: '1px solid #CBD5E1',
                        padding: '6px 14px',
                        borderRadius: 6,
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      Preview
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsPreviewMode(false)}
                      style={{
                        backgroundColor: '#EFF6FF',
                        color: '#0061FE',
                        border: '1px solid #BFDBFE',
                        padding: '6px 14px',
                        borderRadius: 6,
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      Edit fields
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPreviewMode(false)
                      setWizardStep(4)
                    }}
                    style={{
                      backgroundColor: '#0061FE',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '7px 20px',
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Next
                  </button>
                </>
              ) : (
                <div style={{ width: 80 }} />
              )}
            </div>
          </div>

          {/* ─── STEP 1: SELECT DOCUMENTS ─── */}
          {wizardStep === 1 && (
            <div style={{ flex: 1, padding: '40px 24px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: 740, width: '100%' }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>Select documents</h2>
                <p style={{ fontSize: 13.5, color: '#64748B', marginBottom: 28 }}>
                  Upload a Statement of Work, or select one of our pre-formatted state government and enterprise RTR templates.
                </p>

                {/* Templates Picker */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 28 }}>
                  {PREBUILT_TEMPLATES.map(tpl => (
                    <div
                      key={tpl.id}
                      onClick={() => {
                        setSelectedTemplate(tpl)
                        setDocumentTitle(tpl.doc.title)
                        setDocumentContent(tpl.doc.content)
                        setPlacedFields(tpl.doc.defaultFields || [])
                      }}
                      style={{
                        padding: 16,
                        borderRadius: 10,
                        border: selectedTemplate?.id === tpl.id ? '2px solid #0061FE' : '1px solid #E2E8F0',
                        backgroundColor: selectedTemplate?.id === tpl.id ? '#EFF6FF' : '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{tpl.name}</div>
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>{tpl.client}</div>
                    </div>
                  ))}
                </div>

                {/* Upload Custom File Box */}
                <div
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files?.[0]) {
                      handleDocumentFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  style={{
                    border: '2px dashed #94A3B8',
                    borderRadius: 10,
                    padding: '36px 20px',
                    textAlign: 'center',
                    backgroundColor: '#F8FAFC',
                    marginBottom: 24,
                    position: 'relative'
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="12" y1="18" x2="12" y2="12"/>
                      <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>
                    Drag & Drop any Agreement, SOW, or Contract here
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
                    Supports Word (.docx, .doc), PDF (.pdf), Text (.txt, .rtf, .md), and Scanned Images (.png, .jpg, .jpeg)
                  </div>

                  <input
                    ref={wizardFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.rtf,.md,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleDocumentFileUpload(e.target.files[0]);
                      }
                    }}
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    disabled={isUploadingDoc}
                    onClick={() => wizardFileInputRef.current?.click()}
                    style={{
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      padding: '9px 22px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: isUploadingDoc ? 'wait' : 'pointer',
                      boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    {isUploadingDoc ? 'Processing Document...' : 'Choose File from Computer'}
                  </button>

                  {isUploadingDoc && (
                    <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: 12, fontWeight: 600 }}>
                      <div style={{ width: 14, height: 14, border: '2px solid #BFDBFE', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span>{uploadStatusText || 'Extracting & formatting document...'}</span>
                    </div>
                  )}

                  {uploadedFileName && !isUploadingDoc && (
                    <div style={{ fontSize: 12.5, color: '#16A34A', fontWeight: 700, marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <span>✓</span> <span>Loaded: {uploadedFileName}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    style={{ backgroundColor: '#0F172A', color: '#FFFFFF', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: ADD SIGNERS (Matching Screenshot 3) ─── */}
          {wizardStep === 2 && (
            <div style={{ flex: 1, padding: '40px 24px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: 680, width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>Add signers</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setSigners([{ id: 's-me', name: 'COOLSOFT Recruiter', email: 'omkesh@coolsofttech.com', color: '#0284C7' }])
                      showToast('Set signer as myself')
                    }}
                    style={{ background: 'none', border: 'none', color: '#0061FE', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    ✍️ I'm the only signer
                  </button>
                </div>

                {/* Signers Cards List (Screenshot 3) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                  {signers.map((signer, idx) => (
                    <div key={signer.id || idx} style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '20px 22px', backgroundColor: '#FFFFFF', position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                          Signer {signers.length > 1 ? idx + 1 : ''}
                        </span>
                        {signers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSigner(idx)}
                            style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Name</label>
                          <input
                            type="text"
                            value={signer.name}
                            onChange={(e) => handleUpdateSigner(idx, 'name', e.target.value)}
                            placeholder="Signer's name"
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              borderRadius: 6,
                              border: !signer.name.trim() ? '1px solid #EF4444' : '1px solid #CBD5E1',
                              fontSize: 13
                            }}
                          />
                          {!signer.name.trim() && (
                            <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>⊗ A signer name is required</div>
                          )}
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Email address</label>
                          <input
                            type="email"
                            value={signer.email}
                            onChange={(e) => handleUpdateSigner(idx, 'email', e.target.value)}
                            placeholder="email@example.com"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* + Add another signer button (Screenshot 3) */}
                <button
                  type="button"
                  onClick={handleAddSigner}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#0F172A',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 28
                  }}
                >
                  <span>+</span> Add another signer
                </button>

                {/* Signer Settings (Screenshot 3) */}
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 20, marginBottom: 32 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>Signer settings</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowReassignment}
                      onChange={(e) => setAllowReassignment(e.target.checked)}
                      style={{ accentColor: '#0061FE' }}
                    />
                    Allow signer reassignment
                  </label>
                </div>

                {/* Footer Buttons (Screenshot 3) */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    style={{ backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #CBD5E1', padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!signers[0].name.trim()) {
                        alert('Please enter a signer name.')
                        return
                      }
                      setWizardStep(3)
                    }}
                    style={{ backgroundColor: '#0F172A', color: '#FFFFFF', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: PLACE FIELDS VISUAL EDITOR (Matching Screenshots 2, 3, 4) ─── */}
          {wizardStep === 3 && (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Left Toolbox Sidebar (Screenshots 2 & 3) */}
              <div style={{ width: 230, borderRight: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
                {/* Signer Selector Pill (Screenshot 2: PM Pankaj Maharwade) */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 5 }}>Signer</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 20, backgroundColor: '#E0F2FE', color: '#0369A1', fontSize: 12, fontWeight: 700 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#0284C7', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 800 }}>
                      {(signers[selectedSignerIndex]?.name || signers[0]?.name || 'PM').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                      {signers[selectedSignerIndex]?.name || signers[0]?.name || 'Candidate Signer'}
                    </span>
                    {signers.length > 1 && (
                      <select
                        value={selectedSignerIndex}
                        onChange={(e) => setSelectedSignerIndex(Number(e.target.value))}
                        style={{ border: 'none', background: 'transparent', fontSize: 11, fontWeight: 700, color: '#0284C7', cursor: 'pointer' }}
                      >
                        {signers.map((s, idx) => (
                          <option key={s.id || idx} value={idx}>{s.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Auto-place fields button (Screenshot 2) */}
                <button
                  type="button"
                  onClick={handleAutoPlaceFields}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    Auto-place fields
                  </span>
                  <span style={{ fontSize: 9.5, backgroundColor: '#EFF6FF', color: '#0284C7', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>BETA</span>
                </button>

                {/* Signature Fields (Screenshot 2) */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>Signature fields</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleAddField('signature', 'Signature')}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      <span>Signature</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('initials', 'Initials')}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <span style={{ fontWeight: 800, fontSize: 13, color: '#0284C7', width: 15, textAlign: 'center' }}>Aa</span>
                      <span>Initials</span>
                    </button>
                  </div>
                </div>

                {/* Auto-fill fields (Screenshot 2) */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>Auto-fill fields</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleAddField('date', 'Date signed')}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <span>Date signed</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('name', 'Full name')}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <span>Full name</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('email', 'Email address')}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <span>Email address</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('company', 'Company')}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="2"/><line x1="8" y1="6" x2="8" y2="6"/><line x1="16" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/></svg>
                      <span>Company</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('title', 'Title')}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      <span>Title</span>
                    </button>
                  </div>
                </div>

                {/* Standard fields (Screenshot 2) */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>Standard fields</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleAddField('textbox', 'Textbox')}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <span style={{ fontWeight: 800, fontSize: 13, color: '#0284C7', width: 15, textAlign: 'center', fontFamily: 'serif' }}>T</span>
                      <span>Textbox</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('checkbox', 'Tickbox')}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                      <span>Tickbox</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Center Canvas Area (Screenshots 2, 3, 4) */}
              <div style={{ flex: 1, backgroundColor: '#F1F5F9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Canvas Zoom & Undo Bar (Screenshot 2) */}
                <div style={{ height: 42, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button type="button" onClick={() => showToast('Undo')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 14 }}>↺</button>
                    <button type="button" onClick={() => showToast('Redo')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 14 }}>↻</button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#64748B' }}>
                    <span>Zoom:</span>
                    <button type="button" onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))} style={{ background: 'none', border: '1px solid #CBD5E1', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>-</button>
                    <span style={{ fontWeight: 700, minWidth: 40, textAlign: 'center' }}>{zoomLevel}%</span>
                    <button type="button" onClick={() => setZoomLevel(Math.min(150, zoomLevel + 15))} style={{ background: 'none', border: '1px solid #CBD5E1', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>+</button>
                  </div>
                </div>

                {/* Scrollable Document Canvas (Screenshots 2, 3, 4) */}
                <div
                  ref={docScrollContainerRef}
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '28px 24px',
                    display: 'flex',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  <div
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    onClick={() => setSelectedFieldId(null)}
                    style={{
                      width: 780 * (zoomLevel / 100),
                      minHeight: 1100 * (zoomLevel / 100),
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
                      borderRadius: 4,
                      padding: 44 * (zoomLevel / 100),
                      border: '1px solid #CBD5E1',
                      position: 'relative',
                      fontSize: 13 * (zoomLevel / 100),
                      lineHeight: 1.65,
                      color: '#0F172A',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Render Image OR Structured Florida Exhibit E OR Generic Document Text */}
                    {uploadedImageUrl ? (
                      <div style={{ marginBottom: 24, textAlign: 'center' }}>
                        <img
                          src={uploadedImageUrl}
                          alt="Document Page"
                          style={{ maxWidth: '100%', height: 'auto', display: 'inline-block', borderRadius: 4, pointerEvents: 'none' }}
                        />
                      </div>
                    ) : (selectedTemplate?.id === 'florida_fdot' || (documentTitle || '').toLowerCase().includes('exhibit e') || (documentTitle || '').includes('80101507')) ? (
                      <div>
                        {/* Authentic Florida Exhibit E Header Layout (from Doc/RTR_FL-pankajmaharwade829_gmail.com.pdf) */}
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Information Technology Staff Augmentation Services
                          </div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
                            Contract No. 80101507-23-STC-ITSA
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginTop: 14 }}>
                            Exhibit E
                          </div>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', textDecoration: 'underline', marginTop: 2 }}>
                            Resume Self-Certification Form
                          </div>
                        </div>

                        <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, marginBottom: 16 }}>
                          The Contractor’s candidates shall complete this Resume Self-Certification Form. Completed Resume Self-Certification Forms shall be submitted within the Contractor’s response to Customer’s Request for Quotes.
                        </p>

                        <blockquote style={{ fontSize: 11.5, color: '#1E293B', fontStyle: 'italic', lineHeight: 1.65, margin: '0 0 16px 0', padding: '0 8px', borderLeft: '3px solid #CBD5E1' }}>
                          “I the undersigned do hereby certify, under the penalty of perjury, that information in my resume submitted for consideration of the State of Florida contract position is true, correct, complete, and made in good faith to the best of my knowledge and belief. If an omission, falsification, misstatement, or misrepresentation has been made regarding my education, work ability, experience, employment history, and/or fitness for employment as a contractor, I may be disqualified as a contractor, and the matter will be reported to appropriate agency or law enforcement personnel. I understand that there may be civil and/or criminal penalties for misrepresenting pertinent information in connection with contract positions, including, but not limited to, penalties available under sections 287.133 or 817.566, Florida Statutes. I further understand that if I am not a United States citizen, violation cases may be reported to the US Department of Homeland Security for potential deportation.”
                        </blockquote>

                        <blockquote style={{ fontSize: 11.5, color: '#1E293B', fontStyle: 'italic', lineHeight: 1.65, margin: '0 0 28px 0', padding: '0 8px', borderLeft: '3px solid #CBD5E1' }}>
                          “In addition, I the undersigned do hereby consent to the release of my information by employers, educational institutions, law enforcement agencies, and other individuals and organizations to investigators and other authorized agents of Florida for verification and investigation purposes. I understand that any documents submitted to procure a contract(s) with the State of Florida, including resumes, are public records.”
                        </blockquote>

                        {/* Underline Guide Lines on Contract Sheet */}
                        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 28, opacity: 0.85 }}>
                          <div>
                            <div style={{ borderBottom: '1.5px solid #334155', height: 26, width: '60%' }} />
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginTop: 4 }}>Print Full Legal Name of Candidate</div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
                            <div>
                              <div style={{ borderBottom: '1.5px solid #334155', height: 32 }} />
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginTop: 4 }}>Candidate's Signature</div>
                            </div>
                            <div>
                              <div style={{ borderBottom: '1.5px solid #334155', height: 32 }} />
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginTop: 4 }}>Date</div>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
                            <div>
                              <div style={{ borderBottom: '1.5px solid #334155', height: 26 }} />
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginTop: 4 }}>Candidate's Form of Identification Presented</div>
                            </div>
                            <div>
                              <div style={{ borderBottom: '1.5px solid #334155', height: 26 }} />
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginTop: 4 }}>Identification number</div>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
                            <div>
                              <div style={{ borderBottom: '1.5px solid #334155', height: 26 }} />
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginTop: 4 }}>Contractor's Witness Signature One</div>
                            </div>
                            <div>
                              <div style={{ borderBottom: '1.5px solid #334155', height: 26 }} />
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginTop: 4 }}>Date</div>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
                            <div>
                              <div style={{ borderBottom: '1.5px solid #334155', height: 26 }} />
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginTop: 4 }}>Print Name Contractor's Witness One</div>
                            </div>
                            <div>
                              <div style={{ borderBottom: '1.5px solid #334155', height: 26 }} />
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginTop: 4 }}>Print Name Contractor's Witness Two</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap', userSelect: 'text' }}>{documentContent}</div>
                    )}

                    {/* OVERLAID PLACED FORM FIELDS ON CANVAS (Screenshots 3 & 4) */}
                    {placedFields.map((field) => {
                      const isSelected = selectedFieldId === field.id
                      const scale = zoomLevel / 100
                      const fX = (field.x ?? 60) * scale
                      const fY = (field.y ?? 400) * scale
                      const fW = (field.width ?? 220) * scale
                      const fH = (field.height ?? 46) * scale

                      const signer = signers[field.signerIndex || 0] || signers[0] || { name: 'Candidate' }

                      // In Preview Mode (Screenshot 4): Render interactive candidate view!
                      if (isPreviewMode) {
                        return (
                          <div
                            key={field.id}
                            style={{
                              position: 'absolute',
                              left: fX,
                              top: fY,
                              width: fW,
                              minHeight: fH,
                              zIndex: 20,
                              boxSizing: 'border-box'
                            }}
                          >
                            {field.type === 'signature' ? (
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  backgroundColor: '#FEF2F2',
                                  border: '2px dashed #DC2626',
                                  borderRadius: 6,
                                  color: '#DC2626',
                                  fontSize: 12.5 * scale,
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  padding: '6px 10px',
                                  boxSizing: 'border-box',
                                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.15)'
                                }}
                              >
                                <span>✍️</span> Click to sign *
                              </div>
                            ) : field.type === 'date' ? (
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  backgroundColor: '#F8FAFC',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: 4,
                                  padding: '6px 10px',
                                  fontSize: 12 * scale,
                                  fontWeight: 700,
                                  color: '#0F172A',
                                  display: 'flex',
                                  alignItems: 'center',
                                  boxSizing: 'border-box'
                                }}
                              >
                                {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, ' / ')}
                              </div>
                            ) : field.type === 'name' ? (
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  backgroundColor: '#F8FAFC',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: 4,
                                  padding: '6px 10px',
                                  fontSize: 12 * scale,
                                  fontWeight: 700,
                                  color: '#0F172A',
                                  display: 'flex',
                                  alignItems: 'center',
                                  boxSizing: 'border-box'
                                }}
                              >
                                {signer.name || 'Candidate Legal Name'}
                              </div>
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: 4,
                                  padding: '6px 10px',
                                  fontSize: 11.5 * scale,
                                  color: '#64748B',
                                  display: 'flex',
                                  alignItems: 'center',
                                  boxSizing: 'border-box'
                                }}
                              >
                                {field.label} {field.required ? '*' : ''}
                              </div>
                            )}
                          </div>
                        )
                      }

                      // In Editor Mode (Screenshot 3): Cyan HelloSign placement box!
                      return (
                        <div
                          key={field.id}
                          onMouseDown={(e) => handleFieldMouseDown(e, field.id)}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedFieldId(field.id)
                          }}
                          style={{
                            position: 'absolute',
                            left: fX,
                            top: fY,
                            width: fW,
                            minHeight: fH,
                            backgroundColor: isSelected ? '#D8F3F7' : 'rgba(216, 243, 247, 0.88)',
                            border: isSelected ? '2px solid #0087A4' : '1.5px solid #00A3C4',
                            borderRadius: 4,
                            padding: '4px 8px',
                            boxShadow: isSelected ? '0 0 0 2px rgba(0, 163, 196, 0.35)' : '0 1px 4px rgba(0,0,0,0.06)',
                            cursor: 'move',
                            userSelect: 'none',
                            zIndex: isSelected ? 30 : 15,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            boxSizing: 'border-box'
                          }}
                        >
                          {/* 4 Corner Resize Handles when selected (Screenshot 3) */}
                          {isSelected && (
                            <>
                              <div style={{ position: 'absolute', left: -4, top: -4, width: 7, height: 7, backgroundColor: '#FFFFFF', border: '1.5px solid #0087A4', borderRadius: 1 }} />
                              <div style={{ position: 'absolute', right: -4, top: -4, width: 7, height: 7, backgroundColor: '#FFFFFF', border: '1.5px solid #0087A4', borderRadius: 1 }} />
                              <div style={{ position: 'absolute', left: -4, bottom: -4, width: 7, height: 7, backgroundColor: '#FFFFFF', border: '1.5px solid #0087A4', borderRadius: 1 }} />
                              <div style={{ position: 'absolute', right: -4, bottom: -4, width: 7, height: 7, backgroundColor: '#FFFFFF', border: '1.5px solid #0087A4', borderRadius: 1 }} />
                            </>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 11 * scale, fontWeight: 800, color: '#0A6C84', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                {field.label} {field.required ? '*' : ''}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveField(field.id)
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#0A6C84',
                                fontSize: 11,
                                cursor: 'pointer',
                                padding: '0 2px',
                                lineHeight: 1,
                                fontWeight: 800
                              }}
                              title="Delete field"
                            >
                              ✕
                            </button>
                          </div>

                          <div style={{ fontSize: 9.5 * scale, color: '#0E7490', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                            Signer: {signer.name || 'Candidate'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Footer Bar (Screenshot 2: Preview toggle, Back, Next) */}
                <div style={{ height: 56, backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
                  <button
                    type="button"
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    style={{ background: 'none', border: 'none', color: isPreviewMode ? '#0061FE' : '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>{isPreviewMode ? '✏️' : '👁'}</span> {isPreviewMode ? 'Return to editing' : 'Preview document'}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      style={{ backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #CBD5E1', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPreviewMode(false)
                        setWizardStep(4)
                      }}
                      style={{ backgroundColor: '#0061FE', color: '#FFFFFF', border: 'none', padding: '8px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Inspector Sidebar (Screenshots 3 & 4) */}
              <div style={{ width: 250, borderLeft: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', padding: 20, display: 'flex', flexDirection: 'column' }}>
                {isPreviewMode ? (
                  /* Preview Mode Inspector (Screenshot 4) */
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>Signer</div>
                    <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Viewing as:</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{signers[0]?.name || 'Candidate Signer'}</div>
                    </div>

                    <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: 14, marginBottom: 18 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF', marginBottom: 4 }}>
                        Fields to complete:
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1D4ED8' }}>
                        {placedFields.filter(f => f.required).length} required field{placedFields.filter(f => f.required).length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                      This live preview displays the red <strong>[ Click to sign * ]</strong> prompt exactly as your recipient will experience it.
                    </p>
                  </div>
                ) : selectedFieldId ? (
                  /* Field Properties Inspector (Screenshot 3) */
                  (() => {
                    const f = placedFields.find(x => x.id === selectedFieldId)
                    if (!f) return null
                    return (
                      <div>
                        {/* Header: UPPERCASE FIELD TYPE + Trash icon (Screenshot 3) */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            {f.type.toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveField(f.id)}
                            style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 4 }}
                            title="Delete this field"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </div>

                        {/* Assigned to dropdown (Screenshot 3) */}
                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Assigned to</label>
                          <select
                            value={f.signerIndex || 0}
                            onChange={(e) => {
                              const updated = placedFields.map(x => x.id === f.id ? { ...x, signerIndex: Number(e.target.value) } : x)
                              setPlacedFields(updated)
                            }}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, backgroundColor: '#FFFFFF' }}
                          >
                            {signers.map((s, idx) => (
                              <option key={s.id || idx} value={idx}>{s.name} ({s.email || 'Signer ' + (idx + 1)})</option>
                            ))}
                          </select>
                        </div>

                        {/* Field name (required) input (Screenshot 3) */}
                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 5 }}>
                            Field name (required)
                          </label>
                          <input
                            type="text"
                            value={f.fieldName || f.label.replace(/\s+/g, '')}
                            onChange={(e) => {
                              const updated = placedFields.map(x => x.id === f.id ? { ...x, fieldName: e.target.value } : x)
                              setPlacedFields(updated)
                            }}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                          />
                          <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 4 }}>
                            Must be unique within the document
                          </div>
                        </div>

                        {/* Required field checkbox (Screenshot 3) */}
                        <div style={{ marginBottom: 18 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#334155', cursor: 'pointer', fontWeight: 600 }}>
                            <input
                              type="checkbox"
                              checked={f.required}
                              onChange={(e) => {
                                const updated = placedFields.map(x => x.id === f.id ? { ...x, required: e.target.checked } : x)
                                setPlacedFields(updated)
                              }}
                              style={{ width: 16, height: 16, accentColor: '#0061FE' }}
                            />
                            Required field
                          </label>
                        </div>

                        {/* Quick Placement Alignments */}
                        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12, marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>Position Shortcuts:</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => {
                                const targetY = 610
                                const updated = placedFields.map(x => x.id === f.id ? { ...x, y: targetY } : x)
                                setPlacedFields(updated)
                                if (docScrollContainerRef.current) {
                                  docScrollContainerRef.current.scrollTo({ top: (targetY - 60) * (zoomLevel / 100), behavior: 'smooth' })
                                }
                              }}
                              style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, padding: '5px 8px', fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'pointer', textAlign: 'left' }}
                            >
                              ↓ Move to Signature Block
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = placedFields.map(x => x.id === f.id ? { ...x, x: 60 } : x)
                                setPlacedFields(updated)
                              }}
                              style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, padding: '5px 8px', fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'pointer', textAlign: 'left' }}
                            >
                              ← Align Left (60px)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = placedFields.map(x => x.id === f.id ? { ...x, x: 380 } : x)
                                setPlacedFields(updated)
                              }}
                              style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, padding: '5px 8px', fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'pointer', textAlign: 'left' }}
                            >
                              → Align Right (380px)
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  /* No field selected state (Screenshot 2) */
                  <div style={{ textAlign: 'center', color: '#94A3B8', marginTop: 40 }}>
                    <div style={{ width: 60, height: 80, border: '1.5px solid #CBD5E1', borderRadius: 4, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', fontSize: 11, fontWeight: 700, color: '#64748B' }}>
                      Page 1
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Select a field</div>
                    <div style={{ fontSize: 11.5, color: '#94A3B8', lineHeight: 1.4 }}>
                      Click on any cyan box on the document to edit properties, or add new fields from the left palette.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── STEP 4: REVIEW AND SEND (Matching Screenshot 5) ─── */}
          {wizardStep === 4 && (
            <div style={{ flex: 1, padding: '40px 24px', overflowY: 'auto', display: 'flex', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
              <div style={{ maxWidth: 680, width: '100%' }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>Review and send</h2>
                <p style={{ fontSize: 13.5, color: '#64748B', marginBottom: 24 }}>
                  Add an optional message for your signers and review document details.
                </p>

                {createdAgreement ? (
                  <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #BBF7D0', borderRadius: 12, padding: 32, textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#22C55E', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>✓</div>
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: '#14532D', marginBottom: 8 }}>Ready for Signature!</h3>
                    <p style={{ fontSize: 13.5, color: '#166534', marginBottom: 8 }}>
                      Direct signing link generated and notification dispatched to <strong>{createdAgreement.candidateName}</strong> ({createdAgreement.candidateEmail}):
                    </p>
                    {ccRecipients.length > 0 && (
                      <p style={{ fontSize: 12, color: '#475569', marginBottom: 20 }}>
                        CC Copies notified: {ccRecipients.join(', ')}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
                      <input
                        type="text"
                        readOnly
                        value={createdAgreement.fullSigningUrl}
                        style={{ flex: 1, padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, backgroundColor: '#F8FAFC', color: '#0F172A' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(createdAgreement.fullSigningUrl)
                            showToast('✓ Link copied to clipboard!')
                          }
                        }}
                        style={{ backgroundColor: '#0F172A', color: '#FFFFFF', border: 'none', padding: '9px 18px', borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Copy Link
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => window.open(createdAgreement.signingUrl, '_blank')}
                        style={{ backgroundColor: '#0061FE', color: '#FFFFFF', border: 'none', padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Open Signer View ↗
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setWizardOpen(false)
                          setActiveTab('documents')
                        }}
                        style={{ backgroundColor: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Done / View Documents
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Section 1: Signers (Screenshot 5) */}
                    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '20px 22px' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Signers</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', marginBottom: 12 }}>
                        <span style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#0284C7', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                          {(signers[0]?.name || 'P').charAt(0).toUpperCase()}
                        </span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{signers[0]?.name}</span>
                          <span style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>({signers[0]?.email || 'No email specified'})</span>
                        </div>
                      </div>

                      {/* CC Recipients Section */}
                      {ccRecipients.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                          {ccRecipients.map(email => (
                            <span key={email} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', color: '#1E40AF', padding: '4px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600 }}>
                              <span>CC: {email}</span>
                              <button type="button" onClick={() => handleRemoveCc(email)} style={{ background: 'none', border: 'none', color: '#1E40AF', cursor: 'pointer', fontSize: 12, padding: 0 }}>✕</button>
                            </span>
                          ))}
                        </div>
                      )}

                      {showAddCc ? (
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <input
                            type="email"
                            value={ccInput}
                            onChange={(e) => setCcInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCc()}
                            placeholder="Enter CC email (e.g. manager@coolsofttech.com)"
                            style={{ flex: 1, padding: '7px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                          />
                          <button
                            type="button"
                            onClick={handleAddCc}
                            style={{ backgroundColor: '#0F172A', color: '#FFFFFF', border: 'none', padding: '7px 16px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddCc(false)}
                            style={{ backgroundColor: 'transparent', color: '#64748B', border: 'none', padding: '7px 10px', fontSize: 12, cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowAddCc(true)}
                          style={{ background: 'none', border: 'none', color: '#0061FE', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <span>+</span> Add CC recipient
                        </button>
                      )}
                    </div>

                    {/* Section 2: Document Options (Screenshot 5) */}
                    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '20px 22px' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Document options</div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Document expiration</label>
                        <select
                          value={expiryDays}
                          onChange={(e) => setExpiryDays(Number(e.target.value))}
                          style={{ width: '100%', maxWidth: 280, padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, backgroundColor: '#FFFFFF' }}
                        >
                          <option value={30}>30 days</option>
                          <option value={60}>60 days</option>
                          <option value={90}>90 days</option>
                          <option value={180}>180 days</option>
                        </select>
                      </div>
                    </div>

                    {/* Section 3: Email to signers (Screenshot 5) */}
                    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '20px 22px' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>Email to signers</div>

                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Email Title / Subject:</label>
                        <input
                          type="text"
                          value={emailSubject || `Signature requested: ${documentTitle}`}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder={`Signature requested: ${documentTitle}`}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Message to signers (optional):</label>
                        <textarea
                          rows={4}
                          value={emailMessage || `Hi ${signers[0]?.name || ''},\n\nPlease review and electronically sign this Florida Exhibit E Resume Self-Certification document for our client submission.\n\nThank you,\nCOOLSOFT Staffing Team`}
                          onChange={(e) => setEmailMessage(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, resize: 'vertical', lineHeight: 1.5 }}
                        />
                      </div>
                    </div>

                    {/* Footer Actions (Screenshot 5) */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => setWizardStep(3)}
                        style={{ backgroundColor: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleSendForSignature}
                        disabled={isSending}
                        style={{ backgroundColor: '#0061FE', color: '#FFFFFF', border: 'none', padding: '10px 26px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: isSending ? 'wait' : 'pointer', boxShadow: '0 2px 8px rgba(0, 97, 254, 0.3)' }}
                      >
                        {isSending ? 'Sending Document...' : 'Send for signature'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

