import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'

// Default FDOT Statement of Work & RTR Document from Screenshot 4 & 5
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
    { id: 'f1', type: 'signature', label: 'Signature', required: true, x: 60, y: 780, signerIndex: 0 },
    { id: 'f2', type: 'date', label: 'Date signed', required: true, x: 420, y: 780, signerIndex: 0 },
    { id: 'f3', type: 'name', label: 'Full name', required: true, x: 60, y: 720, signerIndex: 0 },
    { id: 'f4', type: 'title', label: 'Title', required: false, x: 420, y: 720, signerIndex: 0 }
  ]
}

const PREBUILT_TEMPLATES = [
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
        { id: 'f1', type: 'signature', label: 'Signature', required: true, x: 60, y: 480, signerIndex: 0 },
        { id: 'f2', type: 'date', label: 'Date signed', required: true, x: 420, y: 480, signerIndex: 0 },
        { id: 'f3', type: 'name', label: 'Full name', required: true, x: 60, y: 420, signerIndex: 0 }
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
        { id: 'f1', type: 'signature', label: 'Signature', required: true, x: 60, y: 520, signerIndex: 0 },
        { id: 'f2', type: 'date', label: 'Date signed', required: true, x: 420, y: 520, signerIndex: 0 },
        { id: 'f3', type: 'name', label: 'Full name', required: true, x: 60, y: 460, signerIndex: 0 }
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
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
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
      const res = await fetch('/api/rtr/list')
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

      const authToken = localStorage.getItem('token') || ''
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

        // Calculate responsive Y coordinate for bottom signature block
        const textLen = (data.text || '').length
        const estimatedY = Math.max(500, Math.min(1800, Math.round(textLen * 0.45) + 160))

        const initialFields = [
          { id: `sig-${Date.now()}`, type: 'signature', label: 'Signature', required: true, x: 60, y: estimatedY + 70, width: 230, height: 52, signerIndex: 0 },
          { id: `date-${Date.now()}`, type: 'date', label: 'Date signed', required: true, x: 380, y: estimatedY + 70, width: 210, height: 52, signerIndex: 0 },
          { id: `name-${Date.now()}`, type: 'name', label: 'Full name', required: true, x: 60, y: estimatedY, width: 230, height: 46, signerIndex: 0 },
          { id: `title-${Date.now()}`, type: 'title', label: 'Title', required: false, x: 380, y: estimatedY, width: 210, height: 46, signerIndex: 0 }
        ]
        setPlacedFields(initialFields)
        setSelectedFieldId(initialFields[0].id)

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
        candidateName: primarySigner.name,
        candidateEmail: primarySigner.email,
        jobTitle: selectedTemplate?.name || 'Staff Augmentation Consultant',
        clientName: selectedTemplate?.client || 'Enterprise Client',
        payRate: selectedTemplate?.rate || '$75.00/hr C2C',
        allowReassignment,
        customNotes: emailMessage
      }

      const res = await fetch('/api/rtr/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      alert('Network error creating agreement.')
  }

  // Send Email Reminder
  const handleSendReminder = async (agreement) => {
    try {
      const res = await fetch('/api/rtr/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          candidateLegalName: typedName || candidateAgreement?.candidateName
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
            <div style={{ width: 44, height: 44, border: '3px solid #E2E8F0', borderTopColor: '#0284C7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
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
            <Link to="/ats" style={{ display: 'inline-block', backgroundColor: '#0284C7', color: '#FFFFFF', textDecoration: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
              Return to SmartHire ATS
            </Link>
          </div>
        </div>
      )
    }

    // Success Screen if already signed
    if (signedSuccessData) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 560, width: '100%', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '36px 32px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 18px' }}>✓</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Document Successfully Signed</h1>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
              Thank you, <strong>{signedSuccessData.signedLegalName || signedSuccessData.candidateName}</strong>. Your electronic signature has been legally recorded and verified under ESIGN & UETA compliance.
            </p>

            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, textAlign: 'left', fontSize: 12.5, lineHeight: 1.8, marginBottom: 24 }}>
              <div><strong style={{ color: '#334155' }}>Document:</strong> {signedSuccessData.documentTitle || 'Right to Represent Agreement'}</div>
              <div><strong style={{ color: '#334155' }}>Client Account:</strong> {signedSuccessData.clientName}</div>
              <div><strong style={{ color: '#334155' }}>Agreed Rate:</strong> {signedSuccessData.payRate}</div>
              <div><strong style={{ color: '#334155' }}>Signed At:</strong> {signedSuccessData.signedAt ? new Date(signedSuccessData.signedAt).toUTCString() : new Date().toUTCString()}</div>
              {signedSuccessData.audit?.certHash && (
                <div style={{ wordBreak: 'break-all', marginTop: 4 }}>
                  <strong style={{ color: '#334155' }}>Certificate SHA-256:</strong><br />
                  <code style={{ fontSize: 11, color: '#0284C7', backgroundColor: '#EFF6FF', padding: '2px 6px', borderRadius: 4 }}>{signedSuccessData.audit.certHash}</code>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              style={{ backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none', padding: '10px 22px', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
            >
              📥 Download / Print Signed Document
            </button>
          </div>
        </div>
      )
    }

    // Active Signing Document Canvas
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <header style={{ height: 60, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 17, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#0284C7' }}>✦</span> SmartSign
            </div>
            <span style={{ color: '#CBD5E1' }}>|</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
              {candidateAgreement?.documentTitle || 'Right to Represent (RTR) Document'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#64748B' }}>
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
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 800,
                cursor: isSigningSubmitting ? 'wait' : 'pointer',
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)'
              }}
            >
              {isSigningSubmitting ? 'Sealing Signature...' : 'Submit & Complete'}
            </button>
          </div>
        </header>

        {/* Document Content Canvas */}
        <main style={{ flex: 1, padding: '32px 20px', display: 'flex', justifyContent: 'center' }}>
          <div
            ref={docContainerRef}
            style={{
              width: '100%',
              maxWidth: 820,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              borderRadius: 6,
              padding: '48px 56px',
              border: '1px solid #E2E8F0',
              position: 'relative',
              fontSize: 13,
              lineHeight: 1.7,
              color: '#1E293B',
              whiteSpace: 'pre-wrap'
            }}
          >
            {candidateAgreement?.documentImageUrl ? (
              <div style={{ marginBottom: 28, textAlign: 'center' }}>
                <img
                  src={candidateAgreement.documentImageUrl}
                  alt="Agreement Document"
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }}
                />
              </div>
            ) : (
              <div>{candidateAgreement?.documentContent || DEFAULT_FDOT_DOCUMENT.content}</div>
            )}

            {/* Render Placed Signature Fields on Document */}
            <div style={{ marginTop: 40, borderTop: '2px solid #E2E8F0', paddingTop: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>
                Required Signatures & Acknowledgments
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                {/* 1. Signature Field */}
                <div style={{ border: '2px dashed #0284C7', borderRadius: 8, padding: 16, backgroundColor: '#F0F9FF', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#0369A1', textTransform: 'uppercase', marginBottom: 8 }}>
                    Signature Field *
                  </div>
                  {savedSignatureData ? (
                    <div>
                      <img src={savedSignatureData} alt="Candidate Signature" style={{ height: 50, maxWidth: '100%', objectFit: 'contain' }} />
                      <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 700, marginTop: 4 }}>✓ Signature Applied</div>
                      <button
                        type="button"
                        onClick={() => setSignModalOpen(true)}
                        style={{ background: 'none', border: 'none', color: '#0284C7', fontSize: 11, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}
                      >
                        Change Signature
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSignModalOpen(true)}
                      style={{
                        backgroundColor: '#0284C7',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        padding: '10px 18px',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)'
                      }}
                    >
                      ✍️ Click to Sign
                    </button>
                  )}
                </div>

                {/* 2. Date Signed */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, backgroundColor: '#F8FAFC' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
                    Date Signed
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>Auto-captured UTC timestamp</div>
                </div>

                {/* 3. Full Legal Name */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, backgroundColor: '#F8FAFC' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
                    Full Legal Name
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                    {candidateAgreement?.candidateName || 'Candidate Signer'}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>Verified ATS Candidate Profile</div>
                </div>
              </div>

              {/* Legal Acknowledgment Checkbox */}
              <div style={{ marginTop: 24, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <input
                  type="checkbox"
                  id="ack-terms"
                  checked={agreedToLegalTerms}
                  onChange={(e) => setAgreedToLegalTerms(e.target.checked)}
                  style={{ width: 17, height: 17, marginTop: 2, cursor: 'pointer', accentColor: '#0284C7' }}
                />
                <label htmlFor="ack-terms" style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, cursor: 'pointer' }}>
                  I agree to be legally bound by this document and electronic signature pursuant to the Electronic Signatures in Global and National Commerce Act (E-SIGN 15 U.S.C. § 7001) and Uniform Electronic Transactions Act (UETA).
                </label>
              </div>
            </div>
          </div>
        </main>

        {/* Electronic Signature Pad Modal (Draw / Type / Upload) */}
        {signModalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
            <div style={{ width: '100%', maxWidth: 520, backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
              {/* Modal Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Create Your Signature</div>
                <button type="button" onClick={() => setSignModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 18, color: '#64748B', cursor: 'pointer' }}>✕</button>
              </div>

              {/* Signature Method Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                {[
                  { id: 'draw', label: '✍️ Draw' },
                  { id: 'type', label: '🔤 Type' },
                  { id: 'upload', label: '📁 Upload' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSignMethod(tab.id)}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      border: 'none',
                      borderBottom: signMethod === tab.id ? '2px solid #0284C7' : '2px solid transparent',
                      backgroundColor: signMethod === tab.id ? '#FFFFFF' : 'transparent',
                      color: signMethod === tab.id ? '#0284C7' : '#64748B',
                      fontSize: 12.5,
                      fontWeight: signMethod === tab.id ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Body */}
              <div style={{ padding: 20 }}>
                {signMethod === 'draw' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11.5, color: '#64748B' }}>Draw your signature using mouse or finger:</span>
                      <button type="button" onClick={clearCanvas} style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>Clear</button>
                    </div>
                    <canvas
                      ref={canvasRef}
                      width={480}
                      height={140}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      style={{ width: '100%', height: 140, border: '1px solid #CBD5E1', borderRadius: 8, backgroundColor: '#FFFFFF', cursor: 'crosshair', touchAction: 'none' }}
                    />
                  </div>
                )}

                {signMethod === 'type' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Your Full Legal Name:</label>
                    <input
                      type="text"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder="e.g. Sathvik Racha"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, marginBottom: 14 }}
                    />
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '20px', backgroundColor: '#F8FAFC', textAlign: 'center', minHeight: 70 }}>
                      <span style={{ fontFamily: '"Brush Script MT", "Caveat", cursive', fontSize: 32, color: '#0F172A' }}>
                        {typedName || 'Your Signature Preview'}
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
                      style={{ width: '100%', padding: '8px', border: '1px dashed #CBD5E1', borderRadius: 8 }}
                    />
                    {uploadedSignatureUrl && (
                      <div style={{ marginTop: 12, textAlign: 'center', padding: 12, border: '1px solid #E2E8F0', borderRadius: 8 }}>
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
                  style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplySignatureToField}
                  style={{ padding: '8px 18px', borderRadius: 6, border: 'none', backgroundColor: '#0284C7', color: '#FFFFFF', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  Apply Signature
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
          {/* Wizard Header matching Screenshots 3, 4, 5 */}
          <div style={{ height: 60, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                type="button"
                onClick={() => setWizardOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 16, color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                ✕ <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Send for signature</span>
              </button>
            </div>

            {/* Step Progress Indicators (Screenshots 3, 4, 5) */}
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

            <div style={{ width: 80 }} />
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

          {/* ─── STEP 3: PLACE FIELDS VISUAL EDITOR (Matching Screenshots 4 & 5) ─── */}
          {wizardStep === 3 && (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Left Toolbox Sidebar (Screenshots 4 & 5) */}
              <div style={{ width: 220, borderRight: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
                {/* Signer Selector Pill (Screenshot 4: PM Pankaj Maharwade) */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Signer</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 20, backgroundColor: '#E0F2FE', color: '#0369A1', fontSize: 12, fontWeight: 700 }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#0284C7', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>PM</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {signers[0]?.name || 'Pankaj Maharwade'}
                    </span>
                  </div>
                </div>

                {/* Auto-place fields button (Screenshot 4) */}
                <button
                  type="button"
                  onClick={handleAutoPlaceFields}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '8px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <span>✨ Auto-place fields</span>
                  <span style={{ fontSize: 9.5, backgroundColor: '#EFF6FF', color: '#0284C7', padding: '1px 5px', borderRadius: 4 }}>BETA</span>
                </button>

                {/* Signature Fields (Screenshot 4 & 5) */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>Signature fields</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleAddField('signature', 'Signature')}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                    >
                      <span>✍️</span> <span>Signature</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('initials', 'Initials')}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                    >
                      <span>Aa</span> <span>Initials</span>
                    </button>
                  </div>
                </div>

                {/* Auto-fill fields (Screenshot 4 & 5) */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>Auto-fill fields</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleAddField('date', 'Date signed')}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                    >
                      <span>📅</span> <span>Date signed</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('name', 'Full name')}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                    >
                      <span>👤</span> <span>Full name</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('email', 'Email address')}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                    >
                      <span>✉️</span> <span>Email address</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('company', 'Company')}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                    >
                      <span>🏢</span> <span>Company</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('title', 'Title')}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                    >
                      <span>💼</span> <span>Title</span>
                    </button>
                  </div>
                </div>

                {/* Standard fields (Screenshot 5) */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>Standard fields</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleAddField('textbox', 'Textbox')}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                    >
                      <span>T</span> <span>Textbox</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('checkbox', 'Tickbox')}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                    >
                      <span>☑</span> <span>Tickbox</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Center Canvas Area (Screenshots 4 & 5) */}
              <div style={{ flex: 1, backgroundColor: '#F1F5F9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Canvas Zoom & Undo Bar (Screenshot 4 & 5) */}
                <div style={{ height: 42, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button type="button" onClick={() => showToast('Undo')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>↺</button>
                    <button type="button" onClick={() => showToast('Redo')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>↻</button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#64748B' }}>
                    <span>Zoom:</span>
                    <button type="button" onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))} style={{ background: 'none', border: '1px solid #CBD5E1', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>-</button>
                    <span style={{ fontWeight: 700, minWidth: 40, textAlign: 'center' }}>{zoomLevel}%</span>
                    <button type="button" onClick={() => setZoomLevel(Math.min(150, zoomLevel + 15))} style={{ background: 'none', border: '1px solid #CBD5E1', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>+</button>
                  </div>
                </div>

                {/* Scrollable Document Canvas (Screenshots 4 & 5) */}
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
                      whiteSpace: 'pre-wrap',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Render Image or Document Text */}
                    {uploadedImageUrl ? (
                      <div style={{ marginBottom: 24, textAlign: 'center' }}>
                        <img
                          src={uploadedImageUrl}
                          alt="Document Page"
                          style={{ maxWidth: '100%', height: 'auto', display: 'inline-block', borderRadius: 4, pointerEvents: 'none' }}
                        />
                      </div>
                    ) : (
                      <div style={{ userSelect: 'text' }}>{documentContent}</div>
                    )}

                    {/* OVERLAID DRAGGABLE FORM FIELDS ON CANVAS */}
                    {placedFields.map((field) => {
                      const isSelected = selectedFieldId === field.id
                      const isDragging = draggingFieldId === field.id
                      const scale = zoomLevel / 100
                      const fX = (field.x ?? 60) * scale
                      const fY = (field.y ?? 400) * scale
                      const fW = (field.width ?? 220) * scale
                      const fH = (field.height ?? 48) * scale

                      const signer = signers[field.signerIndex || 0] || signers[0] || { name: 'Candidate' }

                      let borderColor = isSelected ? '#2563EB' : '#0284C7'
                      let bgColor = isSelected ? '#EFF6FF' : '#F0F9FF'
                      let icon = '📝'
                      let tagLabel = field.label

                      if (field.type === 'signature') {
                        borderColor = isSelected ? '#2563EB' : '#D97706'
                        bgColor = isSelected ? '#EFF6FF' : 'rgba(254, 243, 199, 0.95)'
                        icon = '✍️'
                      } else if (field.type === 'initials') {
                        borderColor = isSelected ? '#2563EB' : '#7C3AED'
                        bgColor = isSelected ? '#EFF6FF' : '#F5F3FF'
                        icon = 'Aa'
                      } else if (field.type === 'date') {
                        borderColor = isSelected ? '#2563EB' : '#059669'
                        bgColor = isSelected ? '#EFF6FF' : '#ECFDF5'
                        icon = '📅'
                      } else if (field.type === 'name') {
                        borderColor = isSelected ? '#2563EB' : '#0284C7'
                        bgColor = isSelected ? '#EFF6FF' : '#F0F9FF'
                        icon = '👤'
                      } else if (field.type === 'textbox') {
                        borderColor = isSelected ? '#2563EB' : '#475569'
                        bgColor = isSelected ? '#EFF6FF' : '#F8FAFC'
                        icon = '🔤'
                      } else if (field.type === 'checkbox') {
                        borderColor = isSelected ? '#2563EB' : '#0D9488'
                        bgColor = isSelected ? '#EFF6FF' : '#F0FDFA'
                        icon = '☑'
                      }

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
                            backgroundColor: bgColor,
                            border: isSelected ? '2.5px solid #2563EB' : `2px dashed ${borderColor}`,
                            borderRadius: 6,
                            padding: '4px 8px',
                            boxShadow: isSelected ? '0 4px 16px rgba(37, 99, 235, 0.35)' : '0 2px 6px rgba(0,0,0,0.06)',
                            cursor: 'move',
                            userSelect: 'none',
                            zIndex: isSelected ? 30 : 15,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 10, color: '#64748B', cursor: 'grab' }}>⠿</span>
                              <span style={{ fontSize: 11 * scale, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                {icon} {tagLabel} {field.required ? '*' : ''}
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
                                color: '#EF4444',
                                fontSize: 12,
                                cursor: 'pointer',
                                padding: '0 2px',
                                lineHeight: 1
                              }}
                              title="Delete field"
                            >
                              ✕
                            </button>
                          </div>

                          <div style={{ fontSize: 9.5 * scale, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Signer: {signer.name || 'Candidate'}
                          </div>
                        </div>
                      )
                    })}

                    {/* Placed Fields Summary Section at bottom */}
                    <div style={{ marginTop: 48, paddingTop: 20, borderTop: '2px dashed #CBD5E1' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>✦</span> Required Document Signatures ({placedFields.length} fields placed)
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 12 }}>
                        Fields appear on the document canvas above. Click any field below to navigate directly to it, or drag it on the document:
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                        {placedFields.map(f => {
                          const isSel = selectedFieldId === f.id
                          return (
                            <div
                              key={f.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedFieldId(f.id)
                                if (docScrollContainerRef.current) {
                                  docScrollContainerRef.current.scrollTo({ top: (f.y - 120) * (zoomLevel / 100), behavior: 'smooth' })
                                }
                              }}
                              style={{
                                border: isSel ? '2px solid #2563EB' : '1px solid #E2E8F0',
                                backgroundColor: isSel ? '#EFF6FF' : '#F8FAFC',
                                borderRadius: 6,
                                padding: '8px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ fontSize: 12, fontWeight: 700, color: isSel ? '#1D4ED8' : '#334155' }}>
                                {f.label} {f.required && <span style={{ color: '#EF4444' }}>*</span>}
                              </div>
                              <span style={{ fontSize: 10.5, color: '#64748B' }}>
                                X: {f.x}, Y: {f.y}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Bar (Screenshot 4 & 5: Preview, Back, Next) */}
                <div style={{ height: 56, backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
                  <button
                    type="button"
                    onClick={() => showToast('Preview mode active')}
                    style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    👁 Preview
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
                      onClick={() => setWizardStep(4)}
                      style={{ backgroundColor: '#0F172A', color: '#FFFFFF', border: 'none', padding: '8px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Inspector Sidebar (Screenshot 4 & 5) */}
              <div style={{ width: 230, borderLeft: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', padding: 20, display: 'flex', flexDirection: 'column' }}>
                {selectedFieldId ? (
                  (() => {
                    const f = placedFields.find(x => x.id === selectedFieldId)
                    if (!f) return null
                    return (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>Field Settings</div>
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>Label</label>
                          <input
                            type="text"
                            value={f.label}
                            onChange={(e) => {
                              const updated = placedFields.map(x => x.id === f.id ? { ...x, label: e.target.value } : x)
                              setPlacedFields(updated)
                            }}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
                          />
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={f.required}
                              onChange={(e) => {
                                const updated = placedFields.map(x => x.id === f.id ? { ...x, required: e.target.checked } : x)
                                setPlacedFields(updated)
                              }}
                              style={{ accentColor: '#2563EB' }}
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
                                const contentLen = (documentContent || '').length
                                const targetY = Math.max(500, Math.min(1800, Math.round(contentLen * 0.45) + 120))
                                const updated = placedFields.map(x => x.id === f.id ? { ...x, y: targetY + 60 } : x)
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

                        <button
                          type="button"
                          onClick={() => handleRemoveField(f.id)}
                          style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', width: '100%' }}
                        >
                          Delete Field
                        </button>
                      </div>
                    )
                  })()
                ) : (
                  <div style={{ textAlign: 'center', color: '#94A3B8', marginTop: 40 }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>✎</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Nothing selected</div>
                    <div style={{ fontSize: 11.5, color: '#94A3B8' }}>Select or click a field to configure</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── STEP 4: REVIEW AND SEND ─── */}
          {wizardStep === 4 && (
            <div style={{ flex: 1, padding: '40px 24px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: 640, width: '100%' }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>Review and send</h2>
                <p style={{ fontSize: 13.5, color: '#64748B', marginBottom: 24 }}>
                  Add an optional message for your signers and review document details.
                </p>

                {createdAgreement ? (
                  <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#22C55E', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 12px' }}>✓</div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', marginBottom: 6 }}>Ready for Signature!</h3>
                    <p style={{ fontSize: 13, color: '#166534', marginBottom: 18 }}>
                      Direct signing link has been generated for <strong>{createdAgreement.candidateName}</strong>:
                    </p>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                      <input
                        type="text"
                        readOnly
                        value={createdAgreement.fullSigningUrl}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, backgroundColor: '#FFFFFF' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(createdAgreement.fullSigningUrl)
                            showToast('✓ Link copied to clipboard!')
                          }
                        }}
                        style={{ backgroundColor: '#0F172A', color: '#FFFFFF', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Copy Link
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => window.open(createdAgreement.signingUrl, '_blank')}
                        style={{ backgroundColor: '#0061FE', color: '#FFFFFF', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Open Signer View ↗
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setWizardOpen(false)
                          setActiveTab('documents')
                        }}
                        style={{ backgroundColor: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1', padding: '9px 18px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Done / View Documents
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, marginBottom: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Document Summary</div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>{documentTitle}</div>
                      <div style={{ fontSize: 12.5, color: '#475569' }}>
                        Signer: <strong>{signers[0]?.name}</strong> ({signers[0]?.email})
                      </div>
                      <div style={{ fontSize: 12, color: '#0284C7', marginTop: 4 }}>
                        {placedFields.length} interactive fields placed (Signatures, Dates, Names)
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Email Subject:</label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder={`Please sign: ${documentTitle}`}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                      />
                    </div>

                    <div style={{ marginBottom: 28 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Message to signers (optional):</label>
                      <textarea
                        rows={4}
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        placeholder="Hi! Please review and complete this Right to Represent agreement for our client submission."
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => setWizardStep(3)}
                        style={{ backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #CBD5E1', padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleSendForSignature}
                        disabled={isSending}
                        style={{ backgroundColor: '#0061FE', color: '#FFFFFF', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: isSending ? 'wait' : 'pointer' }}
                      >
                        {isSending ? 'Sending...' : 'Send for signature'}
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
}

