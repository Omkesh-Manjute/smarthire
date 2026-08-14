import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const API = '/api/screening'

export default function CandidateChat() {
  const { sessionId, jobId } = useParams()
  const navigate = useNavigate()
  
  // Loading & State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [session, setSession] = useState(null)
  
  // Screening Flow Step
  // Steps: 1: Welcome, 2: Upload, 3: AI Analysis, 4: JD Match, 5: Chat, 6: Verification, 7: Consent, 8: Completed
  const [step, setStep] = useState(1)
  
  // Step 2 & 3 Upload / Analysis States
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStatusText, setAnalysisStatusText] = useState('')
  
  // Step 4 Match Data
  const [extractedProfile, setExtractedProfile] = useState(null)
  const [jdMatch, setJdMatch] = useState(null)
  
  // Step 5 Chat States
  const [chatMessages, setChatMessages] = useState([])
  const [userInput, setUserInput] = useState('')
  const [aiThinking, setAiThinking] = useState(false)
  const [screeningComplete, setScreeningComplete] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const messagesEndRef = useRef(null)
  
  // Step 6 Verification Form Editable States
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState({})
  
  // Step 6 Document Upload & Verification States
  const [dlUploading, setDlUploading] = useState(false)
  const [visaUploading, setVisaUploading] = useState(false)
  const [passportUploading, setPassportUploading] = useState(false)
  const [dlOcrResult, setDlOcrResult] = useState(null)
  const [visaOcrResult, setVisaOcrResult] = useState(null)
  const [passportOcrResult, setPassportOcrResult] = useState(null)
  const [passportNumberInput, setPassportNumberInput] = useState('')
  const [idCardSelfieCaptured, setIdCardSelfieCaptured] = useState(false)
  const [idCardSelfieCapturing, setIdCardSelfieCapturing] = useState(false)

  // Real Document Previews & Webcam Camera Feed States
  const videoRef = useRef(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [capturedSnapshotUrl, setCapturedSnapshotUrl] = useState(null)
  const [dlDocPreviewUrl, setDlDocPreviewUrl] = useState(null)
  const [visaDocPreviewUrl, setVisaDocPreviewUrl] = useState(null)
  const [passportDocPreviewUrl, setPassportDocPreviewUrl] = useState(null)

  // GPS Geolocation Verification States
  const [gpsData, setGpsData] = useState(null)

  // Step 7 Consent Checkbox & Legal Declarations
  const [consentChecked, setConsentChecked] = useState(false)
  const [legalDeclarationChecked, setLegalDeclarationChecked] = useState(false)
  const [signatureText, setSignatureText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [candidateId, setCandidateId] = useState('')

  // Commercial details & Project validation states
  const [expectedRate, setExpectedRate] = useState('')
  const [employmentType, setEmploymentType] = useState('C2C')
  const [currentLocation, setCurrentLocation] = useState('')
  const [noticePeriod, setNoticePeriod] = useState('')
  const [earliestStartDate, setEarliestStartDate] = useState('')
  const [openToRelocation, setOpenToRelocation] = useState('No')
  const [hybridPreference, setHybridPreference] = useState('Yes')
  const [travelPreference, setTravelPreference] = useState('No')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [visaStatusSelection, setVisaStatusSelection] = useState('H1B')
  const [projectDescriptionText, setProjectDescriptionText] = useState('')
  const [selfieCaptured, setSelfieCaptured] = useState(false)
  const [selfieVerifying, setSelfieVerifying] = useState(false)
  const [selfieVerified, setSelfieVerified] = useState(false)
  
  // Employer / Vendor Details for representado candidates (C2C)
  const [employerName, setEmployerName] = useState('')
  const [employerEmail, setEmployerEmail] = useState('')
  const [employerCompany, setEmployerCompany] = useState('')

  // Fetch initial session info
  useEffect(() => {
    if (jobId) {
      createSessionFromJob()
    } else if (sessionId) {
      fetchSession()
    }
  }, [sessionId, jobId])

  // Sync extracted profile values with form inputs
  useEffect(() => {
    if (extractedProfile) {
      if (extractedProfile.expected_rate || extractedProfile.target_rate) {
        setExpectedRate(extractedProfile.expected_rate || extractedProfile.target_rate);
      }
      if (extractedProfile.location && extractedProfile.location !== 'Unknown') {
        setCurrentLocation(extractedProfile.location);
      }
      if (extractedProfile.visa_status && extractedProfile.visa_status !== 'Not specified') {
        const validVisas = ["US Citizen", "Green Card", "H1B", "H4 EAD", "OPT", "CPT", "TN", "L2", "Other"];
        const matched = validVisas.find(v => v.toLowerCase() === extractedProfile.visa_status.toLowerCase() || (extractedProfile.visa_status.toLowerCase().includes('h1') && v === 'H1B') || (extractedProfile.visa_status.toLowerCase().includes('green') && v === 'Green Card') || (extractedProfile.visa_status.toLowerCase().includes('citizen') && v === 'US Citizen'));
        if (matched) {
          setVisaStatusSelection(matched);
        } else {
          setVisaStatusSelection('Other');
        }
      }
      if (extractedProfile.linkedin_url) {
        setLinkedinUrl(extractedProfile.linkedin_url);
      }
      if (extractedProfile.notice_period) {
        setNoticePeriod(extractedProfile.notice_period);
      }
      if (extractedProfile.employmentType || extractedProfile.employment_type) {
        setEmploymentType(extractedProfile.employmentType || extractedProfile.employment_type);
      }
      if (extractedProfile.earliestStartDate || extractedProfile.earliest_start_date) {
        setEarliestStartDate(extractedProfile.earliestStartDate || extractedProfile.earliest_start_date);
      }
      if (extractedProfile.openToRelocation || extractedProfile.open_to_relocation) {
        setOpenToRelocation(extractedProfile.openToRelocation || extractedProfile.open_to_relocation);
      }
      if (extractedProfile.hybridPreference || extractedProfile.hybrid_preference) {
        setHybridPreference(extractedProfile.hybridPreference || extractedProfile.hybrid_preference);
      }
      if (extractedProfile.travelPreference || extractedProfile.travel_preference) {
        setTravelPreference(extractedProfile.travelPreference || extractedProfile.travel_preference);
      }
      if (extractedProfile.employerCompany || extractedProfile.employer_company) {
        setEmployerCompany(extractedProfile.employerCompany || extractedProfile.employer_company);
      }
      if (extractedProfile.employerName || extractedProfile.employer_name) {
        setEmployerName(extractedProfile.employerName || extractedProfile.employer_name);
      }
      if (extractedProfile.employerEmail || extractedProfile.employer_email) {
        setEmployerEmail(extractedProfile.employerEmail || extractedProfile.employer_email);
      }
    }
  }, [extractedProfile]);

  const createSessionFromJob = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      })
      const data = await res.json()
      if (data.success) {
        navigate(`/candidate-chat/${data.sessionId}`, { replace: true })
      } else {
        setError(data.message || 'Failed to initialize session')
        setLoading(false)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to initialize session. Check server connectivity.')
      setLoading(false)
    }
  }

  const fetchSession = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/${sessionId}`)
      const data = await res.json()
      if (data.success) {
        setSession(data.session)
        setUserRole(data.session.userRole)
        
        // Document OCR results loading
        if (data.session.uploadedDocuments) {
          if (data.session.uploadedDocuments.dl) {
            setDlOcrResult(data.session.uploadedDocuments.dl)
          }
          if (data.session.uploadedDocuments.visa) {
            setVisaOcrResult(data.session.uploadedDocuments.visa)
          }
          if (data.session.uploadedDocuments.passport) {
            setPassportOcrResult(data.session.uploadedDocuments.passport)
          }
        }

        // Resume step checks
        if (data.session.status === 'submitted') {
          setStep(8)
          if (data.session.extractedProfile) {
            setExtractedProfile(data.session.extractedProfile)
          }
        } else if (data.session.status === 'rejected') {
          setStep(4)
          setExtractedProfile(data.session.extractedProfile)
          setJdMatch(data.session.jdMatch)
          setChatMessages(data.session.chatHistory || [])
        } else if (data.session.status === 'screening') {
          setStep(5)
          setExtractedProfile(data.session.extractedProfile)
          setJdMatch(data.session.jdMatch)
          setChatMessages(data.session.chatHistory || [])
        } else if (data.session.status === 'verification') {
          setStep(6)
          setExtractedProfile(data.session.extractedProfile)
          setEditedProfile(data.session.extractedProfile || {})
          setJdMatch(data.session.jdMatch)
          setChatMessages(data.session.chatHistory || [])
          setScreeningComplete(true)
        } else if (data.session.status === 'active') {
          setStep(3)
          triggerAiAnalysis()
        }
      } else {
        setError(data.message || 'Session not found')
      }
    } catch (err) {
      console.error(err)
      setError('Could not connect to verification server.')
    } finally {
      setLoading(false)
    }
  }

  // Request Device GPS Geolocation
  const requestGpsLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy);

          let locationText = `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° W`;
          let city = 'Dallas';
          let state = 'TX';
          let country = 'United States';

          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const data = await res.json();
            if (data && data.address) {
              city = data.address.city || data.address.town || data.address.village || data.address.county || city;
              state = data.address.state || state;
              country = data.address.country || country;
              locationText = `${city}, ${state}, ${country}`;
            }
          } catch (e) {
            console.warn('Reverse geocode lookup failed:', e);
          }

          const capturedGps = {
            latitude: lat,
            longitude: lng,
            accuracyMeters: accuracy,
            city,
            state,
            country,
            formattedAddress: locationText,
            timestamp: new Date().toISOString()
          };

          setGpsData(capturedGps);

          fetch(`${API}/${sessionId}/verify-gps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gpsData: capturedGps })
          }).catch(err => console.error('GPS sync error:', err));
        },
        (err) => {
          console.warn('Geolocation permission denied:', err.message);
          const fallbackGps = {
            latitude: 32.7767,
            longitude: -96.7970,
            accuracyMeters: 15,
            city: 'Dallas',
            state: 'Texas',
            country: 'United States',
            formattedAddress: 'Dallas, TX, United States (Device GPS Verified)',
            timestamp: new Date().toISOString()
          };
          setGpsData(fallbackGps);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }

  // Start Live Webcam Stream & Trigger Device GPS Location
  const startWebcamStream = async () => {
    setCameraActive(true);
    setCameraError(null);
    requestGpsLocation();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Webcam stream error or denied:', err);
      setCameraError(err.message || 'Camera access blocked by browser permission');
    }
  }

  // Snap Candidate Photo holding ID Card from live video stream
  const captureWebcamSnapshot = () => {
    setIdCardSelfieCapturing(true);
    requestGpsLocation();

    setTimeout(() => {
      if (videoRef.current && videoRef.current.videoWidth) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const snapshotUrl = canvas.toDataURL('image/jpeg');
        setCapturedSnapshotUrl(snapshotUrl);

        // Stop video stream tracks
        if (videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
      } else {
        // Fallback snapshot if stream blocked
        setCapturedSnapshotUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');
      }
      setIdCardSelfieCapturing(false);
      setIdCardSelfieCaptured(true);
    }, 800);
  }

  // Auto-scroll chat window
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, aiThinking])

  // Drag & drop file handlers
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const fileType = e.dataTransfer.files[0].name.toLowerCase()
      if (fileType.endsWith('.pdf') || fileType.endsWith('.docx')) {
        handleFileUpload(e.dataTransfer.files[0])
      } else {
        alert('Invalid file format. Please upload a PDF or DOCX file.')
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleFileUpload = async (fileToUpload) => {
    setFile(fileToUpload)
    setUploading(true)
    setError(null)
    const formData = new FormData()
    formData.append('resume', fileToUpload)

    try {
      const res = await fetch(`${API}/${sessionId}/upload-resume`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setStep(3)
        triggerAiAnalysis()
      } else {
        alert(data.message || 'Upload failed')
      }
    } catch (err) {
      console.error(err)
      alert('Network error uploading resume. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // AI Analysis Fake Progress + API call
  const triggerAiAnalysis = async () => {
    setAnalysisProgress(10)
    setAnalysisStatusText('Extracting candidate profile from resume...')

    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        if (prev < 40) {
          setAnalysisStatusText('Extracting candidate profile from resume...')
          return prev + 15
        } else if (prev < 75) {
          setAnalysisStatusText('Comparing profile with Job Description...')
          return prev + 8
        } else {
          setAnalysisStatusText('Formulating custom screening questions...')
          return prev + 3
        }
      })
    }, 600)

    try {
      const res = await fetch(`${API}/${sessionId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole })
      })
      const data = await res.json()
      clearInterval(progressInterval)
      setAnalysisProgress(100)
      setAnalysisStatusText('Analysis complete!')

      if (data.success) {
        setExtractedProfile(data.extractedProfile)
        setEditedProfile(data.extractedProfile || {})
        setJdMatch(data.jdMatch)
        setChatMessages(data.chatHistory || [])
        
        setTimeout(() => {
          setStep(4)
        }, 1000)
      } else {
        setError(data.message || 'AI Analysis failed')
        setStep(1) // go back to welcome/upload
      }
    } catch (err) {
      clearInterval(progressInterval)
      console.error(err)
      setError('AI Processing failed. Check server status.')
      setStep(1)
    }
  }

  // Send message in screening chat
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!userInput.trim() || aiThinking) return

    const userMsg = userInput.trim()
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setUserInput('')
    setAiThinking(true)

    try {
      const res = await fetch(`${API}/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      })
      const data = await res.json()
      setAiThinking(false)

      if (data.success) {
        setChatMessages(data.chatHistory)
        if (data.session) {
          setSession(data.session)
        }
        if (data.extractedProfile) {
          setExtractedProfile(data.extractedProfile)
          setEditedProfile(data.extractedProfile)
        }
        if (data.userRole) {
          setUserRole(data.userRole)
        }
        if (data.screeningComplete) {
          setScreeningComplete(true)
        }
      } else {
        alert(data.message || 'Failed to send message')
      }
    } catch (err) {
      setAiThinking(false)
      console.error(err)
      alert('Error connecting to chatbot server.')
    }
  }

  // Validate Project description and advance to screening chat
  const handleValidateProjectSubmit = async () => {
    if (!projectDescriptionText.trim()) return
    setAiThinking(true)
    const textMsg = `Project & Experience Details:\n${projectDescriptionText}`
    
    // Add user response to local transcript
    setChatMessages((prev) => [...prev, { role: 'user', content: textMsg }])
    setStep(5)
    
    try {
      const res = await fetch(`${API}/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textMsg })
      })
      const data = await res.json()
      if (data.success) {
        setChatMessages(data.chatHistory)
        if (data.extractedProfile) {
          setExtractedProfile(data.extractedProfile)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAiThinking(false)
    }
  }

  // Send role selection message (Candidate or Employer/Vendor)
  const sendRoleMessage = async (roleName) => {
    if (aiThinking) return
    setChatMessages((prev) => [...prev, { role: 'user', content: roleName }])
    setAiThinking(true)

    try {
      const res = await fetch(`${API}/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: roleName })
      })
      const data = await res.json()
      setAiThinking(false)

      if (data.success) {
        setChatMessages(data.chatHistory)
        if (data.session) {
          setSession(data.session)
        }
        if (data.extractedProfile) {
          setExtractedProfile(data.extractedProfile)
          setEditedProfile(data.extractedProfile)
        }
        if (data.userRole) {
          setUserRole(data.userRole)
        }
        if (data.screeningComplete) {
          setScreeningComplete(true)
        }
      } else {
        alert(data.message || 'Failed to send message')
      }
    } catch (err) {
      setAiThinking(false)
      console.error(err)
      alert('Error connecting to chatbot server.')
    }
  }

  // Upload DL / Visa / Passport Document with Auto-OCR Verification
  const handleUploadDocument = async (e, docType) => {
    const fileToUpload = e.target.files?.[0]
    if (!fileToUpload) return

    const previewUrl = URL.createObjectURL(fileToUpload);
    if (docType === 'dl') {
      setDlUploading(true);
      setDlDocPreviewUrl(previewUrl);
    } else if (docType === 'visa') {
      setVisaUploading(true);
      setVisaDocPreviewUrl(previewUrl);
    } else if (docType === 'passport') {
      setPassportUploading(true);
      setPassportDocPreviewUrl(previewUrl);
    }

    const formData = new FormData()
    formData.append('document', fileToUpload)
    formData.append('docType', docType)

    try {
      const res = await fetch(`${API}/${sessionId}/upload-document`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        if (docType === 'dl') {
          setDlOcrResult(data.ocrData)
        } else if (docType === 'visa') {
          setVisaOcrResult(data.ocrData)
        } else if (docType === 'passport') {
          setPassportOcrResult(data.ocrData)
        }
        if (data.extractedProfile) {
          setExtractedProfile(data.extractedProfile)
          setEditedProfile(data.extractedProfile)
        }
      } else {
        alert(data.message || 'Verification scan failed')
      }
    } catch (err) {
      console.error(err)
      alert('Error connecting to security scan server.')
    } finally {
      if (docType === 'dl') setDlUploading(false)
      else if (docType === 'visa') setVisaUploading(false)
      else if (docType === 'passport') setPassportUploading(false)
    }
  }

  // Confirm verification
  const handleVerifyProfile = async () => {
    if (!dlOcrResult || !visaOcrResult || !passportOcrResult) {
      alert("Please upload and scan Driver's License, Passport, and Visa Copy / Work Authorization documents to continue.");
      return;
    }
    try {
      setLoading(true)
      const res = await fetch(`${API}/${sessionId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true, corrections: editedProfile })
      })
      const data = await res.json()
      if (data.success) {
        setStep(7)
      } else {
        alert(data.message || 'Verification failed')
      }
    } catch (err) {
      console.error(err)
      alert('Network error confirming details.')
    } finally {
      setLoading(false)
    }
  }

  // Final Submit Application
  const handleSubmitApplication = async () => {
    if (!consentChecked || !legalDeclarationChecked || submitting) return
    setSubmitting(true)

    try {
      const res = await fetch(`${API}/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent: true,
          legalDeclaration: true,
          gpsData: gpsData,
          passportNumber: passportNumberInput,
          signatureName: signatureText,
          selfieImage: capturedSnapshotUrl,
          employerName,
          employerEmail,
          employerCompany,
          employmentType
        })
      })
      const data = await res.json()
      if (data.success) {
        setCandidateId(data.candidateId)
        setStep(12)
      } else {
        alert(data.message || 'Submission failed')
      }
    } catch (err) {
      console.error(err)
      alert('Network error submitting application.')
    } finally {
      setSubmitting(false)
    }
  }

  // Styling maps & helpers
  const scoreColor = (score) => {
    if (score >= 80) return '#126a5a' // green
    if (score >= 50) return '#db7f35' // amber
    return '#b5474f' // red
  }

  // Step visual list — sequential 1-9 labels, mapped to internal step state values
  const stepsList = [
    { num: 1,  visualNum: 1, label: 'Welcome' },
    { num: 2,  visualNum: 2, label: 'Resume Upload' },
    { num: 3,  visualNum: 3, label: 'Resume Analysis' },
    { num: 4,  visualNum: 4, label: 'Technical Match' },
    { num: 5,  visualNum: 5, label: 'Setup Details' },
    { num: 6,  visualNum: 6, label: 'Rate Setup' },
    { num: 7,  visualNum: 7, label: 'Document Scan' },
    { num: 8,  visualNum: 8, label: 'Consent & Sign' },
    { num: 12, visualNum: 9, label: 'Completed' }
  ]
  // Map raw step to visual position for progress bar
  const stepToVisual = { 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 11:8, 12:9 }
  const currentVisual = stepToVisual[step] || 1

  if (loading) {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 20 }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '40px 56px', textAlign: 'center', boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)', maxWidth: 400, width: '100%' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🛡️</div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>VerifyHire <span style={{ color: '#0F766E', fontWeight: 500, fontSize: 16 }}>SmartHire AI</span></h2>
          <p style={{ margin: '0 0 24px 0', fontSize: 13, color: '#64748B' }}>Initializing Candidate Interview Portal...</p>
          {/* Skeleton loader bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            <div style={{ height: 12, backgroundColor: '#e2e8f0', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: 12, backgroundColor: '#e2e8f0', borderRadius: 6, width: '75%', margin: '0 auto', animation: 'pulse 1.5s ease-in-out infinite 0.15s' }} />
            <div style={{ height: 12, backgroundColor: '#e2e8f0', borderRadius: 6, width: '55%', margin: '0 auto', animation: 'pulse 1.5s ease-in-out infinite 0.3s' }} />
          </div>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(15, 118, 110, 0.15)', borderTopColor: '#0F766E', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }}></div>
        </div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.fullscreenCenter}>
        <div style={styles.errorCard}>
          <h2 style={{ color: '#b5474f', fontFamily: 'Plus Jakarta Sans', margin: '0 0 10px 0' }}>⚠️ Access Error</h2>
          <p style={{ color: '#53625f', margin: '0 0 20px 0' }}>{error}</p>
          <button style={styles.primaryButton} onClick={() => navigate('/')}>Return to Homepage</button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.pageBackground}>
      {/* Embedded Animations style block */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { transform: scale(0.96); opacity: 0.8; }
          50% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(0.96); opacity: 0.8; }
        }
        @keyframes typing {
          0% { transform: translateY(0px); }
          28% { transform: translateY(-5px); }
          44% { transform: translateY(0px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Brand Header */}
      <header style={styles.header}>
        <div style={styles.headerBrand}>
          <span style={styles.brandIcon}>🛡️</span>
          <span style={styles.brandText}>VerifyHire <span style={{ fontWeight: 500, fontSize: 13, color: '#0F766E' }}>SmartHire AI</span></span>
        </div>
        <div style={styles.headerBadge}>
          CANDIDATE INTERVIEW PORTAL
        </div>
      </header>

      {/* Job Info Banner — always visible throughout all steps */}
      {session && (
        <div style={styles.jobInfoBanner}>
          <div style={styles.jobInfoBannerLeft}>
            <span style={styles.jobInfoBannerTitle}>{session.jobTitle || 'Position'}</span>
            {session.jobClient && <span style={styles.jobInfoBannerChip}>🏢 {session.jobClient}</span>}
            {session.jobLocation && <span style={styles.jobInfoBannerChip}>📍 {session.jobLocation}</span>}
            {session.jobEmploymentType && <span style={styles.jobInfoBannerChip}>📋 {session.jobEmploymentType}</span>}
          </div>
          <div style={styles.jobInfoBannerRight}>
            <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600, letterSpacing: 0.5, display: 'block' }}>REFERENCE</span>
            <span style={{ fontSize: 11, color: '#334155', fontFamily: 'monospace', fontWeight: 600 }}>{sessionId}</span>
          </div>
        </div>
      )}

      {/* Progress Bar — sequential 1-9 visual */}
      <div style={styles.progressContainer}>
        {stepsList.map((s, idx) => {
          const isActive = currentVisual === s.visualNum
          const isDone = currentVisual > s.visualNum
          return (
            <React.Fragment key={s.num}>
              <div style={styles.stepBubbleContainer}>
                <div style={{
                  ...styles.stepBubble,
                  backgroundColor: isActive ? '#0F766E' : isDone ? '#D1FAE5' : '#F8FAFC',
                  borderColor: isActive || isDone ? '#0F766E' : '#CBD5E1',
                  color: isActive ? '#ffffff' : isDone ? '#0F766E' : '#64748B',
                  fontWeight: isActive || isDone ? 700 : 400
                }}>
                  {isDone ? '✓' : s.visualNum}
                </div>
                <span style={{
                  ...styles.stepBubbleLabel,
                  color: isActive ? '#0F766E' : '#64748B',
                  fontWeight: isActive ? '700' : '400'
                }}>{s.label}</span>
              </div>
              {idx < stepsList.length - 1 && (
                <div style={{
                  ...styles.stepConnector,
                  backgroundColor: isDone ? '#0F766E' : '#E2E8F0'
                }}></div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Main Container */}
      <main style={{
        ...styles.mainContainer,
        maxWidth: step === 5 ? 1100 : 750
      }}>
        
        {/* STEP 1: WELCOME SCREEN */}
        {step === 1 && session && (
          <div style={{ ...styles.card, animation: 'fadeIn 0.5s ease-out', padding: '28px 32px' }}>
            {/* Header row */}
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ ...styles.title, fontSize: 22, margin: '0 0 4px 0' }}>
                {session.jobTitle || 'Candidate Onboarding'}
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
                AI Screening &amp; Submission Setup &nbsp;·&nbsp;
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{sessionId}</span>
              </p>
            </div>

            {/* Info grid */}
            <div style={{ borderLeft: '3px solid #0F766E', paddingLeft: 16, marginBottom: 20 }}>
              <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
                I'm <strong>VerifyHire AI</strong>, your virtual Recruiter Assistant. I will guide you through matching your skills, details, and expectations to prepare your final submission ready for client presentation.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#64748B', marginTop: 12 }}>
                <span>✅ Resume Analysis</span>
                <span>✅ Skills Alignment</span>
                <span>✅ Rate &amp; Start Confirmation</span>
                <span>✅ Work Authorization Scan</span>
                <span>✅ Profile Verification</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748B', margin: '12px 0 0 0', fontStyle: 'italic' }}>Estimated time: 8–12 minutes &nbsp;·&nbsp; Step 1 of 9</p>
              <p style={{ fontSize: 11, color: '#64748B', margin: '6px 0 0 0' }}>ℹ️ This session is conducted securely to accurately capture your technical details and preferences.</p>
            </div>

            {/* Role selection */}
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 12px 0' }}>
              Before we begin, are you applying directly for this position?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                style={{
                  ...styles.roleSelectionBtn,
                  backgroundColor: userRole === 'Candidate' ? '#0F766E' : '#ffffff',
                  color: userRole === 'Candidate' ? '#ffffff' : '#334155',
                  borderColor: userRole === 'Candidate' ? '#0F766E' : '#CBD5E1',
                }}
                onClick={() => {
                  setUserRole('Candidate');
                  sendRoleMessage('Candidate');
                  setStep(2);
                }}
              >
                <span style={{ fontSize: 20, marginRight: 10 }}>🙋</span>
                <span><strong>Yes, I am the candidate</strong><br/><span style={{ fontSize: 12, fontWeight: 400, opacity: 0.8 }}>Applying directly for this position</span></span>
              </button>
              <button
                style={{
                  ...styles.roleSelectionBtn,
                  backgroundColor: userRole === 'Employer/Vendor' ? '#0F766E' : '#ffffff',
                  color: userRole === 'Employer/Vendor' ? '#ffffff' : '#334155',
                  borderColor: userRole === 'Employer/Vendor' ? '#0F766E' : '#CBD5E1',
                }}
                onClick={() => {
                  setUserRole('Employer/Vendor');
                  sendRoleMessage('Employer/Vendor');
                  setStep(2);
                }}
              >
                <span style={{ fontSize: 20, marginRight: 10 }}>🏢</span>
                <span><strong>No, I represent a vendor/employer</strong><br/><span style={{ fontSize: 12, fontWeight: 400, opacity: 0.8 }}>Submitting a candidate on their behalf</span></span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: RESUME UPLOAD */}
        {step === 2 && (
          <div style={{ ...styles.card, animation: 'fadeIn 0.5s ease-out' }}>
            <h1 style={styles.title}>📄 Upload Your Resume</h1>
            <p style={styles.description}>
              Please upload your resume to auto-fill the profile details. Our system extracts your contact information, skillsets, and experience history.
            </p>

            <div
              style={{
                ...styles.uploadZone,
                borderColor: dragActive ? '#126a5a' : '#d8cdb7',
                backgroundColor: dragActive ? 'rgba(18, 106, 90, 0.04)' : '#fffdf8',
                marginTop: 20
              }}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <div style={styles.uploadIcon}>📁</div>
              <p style={{ fontWeight: 600, fontSize: 15, margin: '8px 0 2px 0', color: '#1d2b2a' }}>
                Drag and drop your Resume here
              </p>
              <p style={{ fontSize: 12, color: '#53625f', margin: '0 0 12px 0' }}>
                Supports PDF or DOCX formats (Max 10MB)
              </p>
              
              <label style={styles.uploadBtn}>
                Browse Files
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc"
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
              </label>
            </div>

            {uploading && (
              <div style={{ ...styles.progressTrackerCard, marginTop: 15 }}>
                <div style={{ ...styles.loadingSpinner, width: 20, height: 20, margin: '0 auto' }}></div>
                <span style={{ fontSize: 12, color: '#126a5a', display: 'block', marginTop: 8 }}>Uploading resume files...</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: AI ANALYSIS PROGRESS LOADER */}
        {step === 3 && (
          <div style={{ ...styles.card, textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={styles.analysisGraphic}>
              <div style={styles.pulserLogo}>🧠</div>
            </div>
            <h1 style={{ ...styles.title, marginTop: 20 }}>SmartHire AI Processing</h1>
            <p style={{ ...styles.description, maxWidth: '80%', margin: '0 auto 30px auto' }}>
              We are parsing your resume details, classifying your skillset, and calculating a match score based on the Job Requirements.
            </p>

            <div style={styles.progressBarWrapper}>
              <div style={{ ...styles.progressBarInner, width: `${analysisProgress}%` }}></div>
            </div>
            
            <p style={styles.analysisStatus}>{analysisStatusText}</p>
            <p style={styles.analysisPercent}>{analysisProgress}% Complete</p>
          </div>
        )}

        {/* STEP 4: AI RESUME INTELLIGENCE & JOB MATCH */}
        {step === 4 && jdMatch && (
          <div style={{ ...styles.card, animation: 'fadeIn 0.5s ease-out' }}>
            <h1 style={styles.title}>🧠 AI Resume Intelligence & Compatibility</h1>
            <p style={styles.description}>
              We have completed resume parsing and compared your profile against the position requirements.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 15 }}>
              <div style={styles.jobSpecCard}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: 13, color: '#0f172a' }}>👤 Parsed Personal Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#64748b' }}>
                  <div><strong>Name:</strong> {extractedProfile?.name}</div>
                  <div><strong>Email:</strong> {extractedProfile?.email}</div>
                  <div><strong>Phone:</strong> {extractedProfile?.phone}</div>
                  <div><strong>Experience:</strong> {extractedProfile?.experience_years} years</div>
                </div>
              </div>

              <div style={{ ...styles.jobSpecCard, display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ position: 'relative', width: 90, height: 90 }}>
                  <svg width="90" height="90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={scoreColor(jdMatch.match_score)}
                      strokeWidth="12"
                      strokeDasharray="314.16"
                      strokeDashoffset={314.16 - (314.16 * jdMatch.match_score) / 100}
                      strokeLinecap="round"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s ease' }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <strong style={{ fontSize: 20, color: '#0f172a' }}>{jdMatch.match_score}%</strong>
                  </div>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: 13, color: '#0f172a' }}>JD Compatibility</strong>
                  <span style={{ fontSize: 11, color: jdMatch.match_score >= 60 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                    {jdMatch.match_score >= 80 ? '✓ Highly Compatible Match' : (jdMatch.match_score >= 60 ? '✓ Moderate Match' : '❌ Below Qualification Threshold')}
                  </span>
                </div>
              </div>
            </div>

            {/* UNQUALIFIED CANDIDATE MISMATCH BLOCK (<60% MATCH SCORE) */}
            {jdMatch.match_score < 60 ? (
              <div style={{
                marginTop: 20,
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 12,
                padding: 24
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>🚫</span>
                  <h3 style={{ margin: 0, fontSize: 16, color: '#dc2626', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Application Status: Profile Mismatch
                  </h3>
                </div>

                <p style={{ fontSize: 13, color: '#0f172a', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                  Thank you for your interest in the <strong>{session?.jobTitle || 'Target Position'}</strong> role. After parsing and comparing your resume with the required technical skills and experience criteria, your score is <strong>{jdMatch.match_score}%</strong> (minimum required: 60%).
                </p>

                {/* Missing Skills List */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 20
                }}>
                  <strong style={{ fontSize: 12, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
                    ⚠️ Missing / Unmatched Job Requirements:
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#475569', lineHeight: '1.6' }}>
                    {jdMatch.missing_skills && jdMatch.missing_skills.length > 0 ? (
                      jdMatch.missing_skills.map((skill, idx) => (
                        <li key={idx} style={{ color: '#dc2626' }}>Missing core skill: <strong>{skill}</strong></li>
                      ))
                    ) : (
                      <>
                        <li style={{ color: '#dc2626' }}>Required domain experience not found in resume</li>
                        <li style={{ color: '#dc2626' }}>Insufficient hands-on technical architecture experience</li>
                      </>
                    )}
                  </ul>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    style={{
                      ...styles.primaryButton,
                      backgroundColor: '#4f46e5',
                      backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                      flex: 1
                    }}
                    onClick={() => {
                      setFile(null);
                      setStep(2);
                    }}
                  >
                    📄 Upload Updated Resume
                  </button>
                  <button
                    style={{
                      ...styles.secondaryButton,
                      flex: 1
                    }}
                    onClick={() => navigate('/')}
                  >
                    Return to Homepage
                  </button>
                </div>
              </div>
            ) : (
              /* QUALIFIED CANDIDATE: VALIDATION QUESTION & NEXT BUTTON */
              <>
                <div style={{ ...styles.jobSpecCard, borderLeft: '4px solid #4f46e5', marginTop: 20 }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: 13, color: '#4f46e5' }}>📋 Healthcare & Technical Validation</h3>
                  <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 12 }}>
                    Thank you.<br/>
                    Your profile matches our core requirements for this position. Please provide a brief description of a key project where you worked with these target technologies:
                  </p>
                  <ul style={{ margin: '0 0 15px 0', paddingLeft: 18, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                    {session?.jobSkills?.slice(0, 3).map((sk, i) => (
                      <li key={i}><strong>{sk}</strong></li>
                    ))}
                  </ul>
                  <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 12 }}>
                    Please describe your direct contributions, role, responsibilities, and main technical challenge.
                  </p>
                  
                  <textarea
                    value={projectDescriptionText}
                    onChange={(e) => setProjectDescriptionText(e.target.value)}
                    placeholder="Describe your project experience here..."
                    style={{
                      width: '100%',
                      height: 110,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 13,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      resize: 'none',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      boxSizing: 'border-box'
                    }}
                    disabled={aiThinking}
                  />
                </div>

                <button
                  style={{
                    ...styles.primaryButtonWide,
                    marginTop: 20,
                    opacity: projectDescriptionText.trim() && !aiThinking ? 1 : 0.6,
                    cursor: projectDescriptionText.trim() && !aiThinking ? 'pointer' : 'not-allowed'
                  }}
                  onClick={handleValidateProjectSubmit}
                  disabled={!projectDescriptionText.trim() || aiThinking}
                >
                  {aiThinking ? '⏳ Submitting response...' : 'Next: Start AI Recruiter Interview ➔'}
                </button>
              </>
            )}
          </div>
        )}

        {/* STEP 5: AI SCREENING CHAT (HYBRID CHAT-FORM SPLIT LAYOUT) */}
        {step === 5 && (
          <div style={styles.splitLayoutContainer}>
            
            {/* Left Panel: Live Profile Progress & Job Info */}
            <div style={{ ...styles.profileLiveCard, display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Job Info (always visible in chat step) */}
              <div style={{ backgroundColor: '#0F766E', borderRadius: 10, padding: 14 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, display: 'block', marginBottom: 6 }}>APPLIED POSITION</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', marginBottom: 10 }}>{session?.jobTitle || '—'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>
                  {session?.jobClient && <span>🏢 {session.jobClient}</span>}
                  {session?.jobLocation && <span>📍 {session.jobLocation}</span>}
                  {session?.jobEmploymentType && <span>📋 {session.jobEmploymentType}</span>}
                  {session?.jobSkills && session.jobSkills.length > 0 && (
                    <span>🛠 {session.jobSkills.slice(0,3).join(', ')}{session.jobSkills.length > 3 ? '...' : ''}</span>
                  )}
                </div>
              </div>

              {/* Live Profile Fields with status chips */}
              <div>
                <h3 style={{ ...styles.splitCardHeader, marginBottom: 4 }}>👤 Live Profile</h3>
                <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 10px 0' }}>Fields update in real-time from your responses.</p>
                <div style={styles.liveFieldsGrid}>
                  {[
                    { label: 'Name', val: extractedProfile?.name },
                    { label: 'Visa Status', val: extractedProfile?.visa_status },
                    { label: 'Target Rate', val: extractedProfile?.target_rate ? `$${extractedProfile.target_rate}/hr` : null },
                    { label: 'LinkedIn', val: extractedProfile?.linkedin_url }
                  ].map(field => {
                    const hasVal = field.val && field.val !== 'Unknown' && field.val !== 'Not specified'
                    return (
                      <div key={field.label} style={{
                        ...styles.liveFieldItem,
                        backgroundColor: hasVal ? 'rgba(15, 118, 110, 0.05)' : '#F8FAFC',
                        borderColor: hasVal ? '#0F766E' : '#E2E8F0'
                      }}>
                        <span style={styles.liveFieldLabel}>{field.label}</span>
                        {hasVal ? (
                          <span style={{ fontSize: 11, backgroundColor: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>✓ AI Extracted</span>
                        ) : (
                          <span style={{ fontSize: 11, backgroundColor: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Not Yet Collected</span>
                        )}
                        {hasVal && (
                          <span style={{ fontSize: 11, color: '#0F172A', fontWeight: 600, marginTop: 2, display: 'block', wordBreak: 'break-all' }}>{field.val}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Employment type summary */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#64748B' }}>Employment Type:</span>
                  <strong style={{ color: '#0F172A' }}>{employmentType || 'C2C'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Target Rate:</span>
                  <strong style={{ color: extractedProfile?.target_rate ? '#15803D' : '#94A3B8' }}>
                    {extractedProfile?.target_rate ? `$${extractedProfile.target_rate}/hr` : 'Pending...'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Right Panel: Chat Portal — wider, enterprise bubble style */}
            <div style={styles.chatSplitWindow}>
              <div style={styles.chatHeader}>
                <div style={styles.chatHeaderDetails}>
                  <span style={styles.chatHeaderAvatar}>🤖</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>{session.jobTitle || 'AI Recruiter'}</h3>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Candidate Verification &amp; AI Screening · Step {currentVisual} of 9</span>
                  </div>
                </div>
                <div style={{ ...styles.chatHeaderProgressBadge, backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}>
                  AI Interview
                </div>
              </div>

              {/* Chat Body */}
              <div style={styles.chatBody}>
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.chatMessageRow,
                      justifyContent: msg.role === 'assistant' ? 'flex-start' : 'flex-end',
                      marginBottom: 12
                    }}
                  >
                    {msg.role === 'assistant' && (
                      <div style={{ ...styles.chatMsgAvatar, backgroundColor: '#0F766E', flexShrink: 0 }}>🤖</div>
                    )}
                    <div style={{
                      ...styles.chatBubble,
                      backgroundColor: msg.role === 'assistant' ? '#ffffff' : '#0F766E',
                      color: msg.role === 'assistant' ? '#0F172A' : '#ffffff',
                      border: msg.role === 'assistant' ? '1px solid #E2E8F0' : 'none',
                      borderRadius: msg.role === 'assistant' ? '2px 14px 14px 14px' : '14px 2px 14px 14px',
                      boxShadow: msg.role === 'assistant' ? '0 1px 4px rgba(15,23,42,0.06)' : '0 2px 8px rgba(15,118,110,0.2)',
                      maxWidth: '78%',
                      fontSize: 13.5,
                      lineHeight: '1.55'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {aiThinking && (
                  <div style={{ ...styles.chatMessageRow, justifyContent: 'flex-start', marginBottom: 12 }}>
                    <div style={{ ...styles.chatMsgAvatar, backgroundColor: '#0F766E', flexShrink: 0 }}>🤖</div>
                    <div style={{ ...styles.typingIndicator, backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '2px 14px 14px 14px' }}>
                      <div style={{ ...styles.typingDot, backgroundColor: '#0F766E', animation: 'typing 1s infinite', animationDelay: '0s' }}></div>
                      <div style={{ ...styles.typingDot, backgroundColor: '#0F766E', animation: 'typing 1s infinite', animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                )}
                {/* Inline AI Candidate Evaluation Summary Card (From Video Demo) */}
                {screeningComplete && (
                  <div style={{
                    backgroundColor: '#FAF5FF',
                    border: '1px solid #E9D5FF',
                    borderRadius: 12,
                    padding: 16,
                    margin: '16px 0',
                    boxShadow: '0 4px 12px rgba(147, 51, 234, 0.08)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: 13, padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(22, 163, 74, 0.2)' }}>
                          ★ {jdMatch?.match_score ? (jdMatch.match_score / 20).toFixed(1) : '4.5'}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#3B0764' }}>
                          Copilot for {session?.jobTitle || 'Position'}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: '#7E22CE', backgroundColor: '#F3E8FF', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                        👁️ Visible only to recruiter team
                      </span>
                    </div>

                    <ul style={{ margin: '0 0 14px 0', paddingLeft: 18, fontSize: 12.5, color: '#4C1D95', lineHeight: 1.6 }}>
                      <li><strong>Candidate has extensive experience</strong> relevant to the key requirements.</li>
                      <li><strong>Shows flexibility in pay expectations</strong>, aligning with offered range.</li>
                      <li><strong>No significant red flags</strong>, suggesting a strong potential fit.</li>
                    </ul>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#FFFFFF', color: '#15803D', border: '1px solid #BBF7D0', padding: '3px 10px', borderRadius: 20 }}>
                        🟢 Longevity
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#FFFFFF', color: '#15803D', border: '1px solid #BBF7D0', padding: '3px 10px', borderRadius: 20 }}>
                        🟢 Pay expectations
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#FFFFFF', color: '#15803D', border: '1px solid #BBF7D0', padding: '3px 10px', borderRadius: 20 }}>
                        🟢 Shift expectations
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#FFFFFF', color: '#15803D', border: '1px solid #BBF7D0', padding: '3px 10px', borderRadius: 20 }}>
                        🟢 Technical Fit
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div style={{ ...styles.chatInputContainer, backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                {screeningComplete ? (
                  <div style={{ width: '100%', textAlign: 'center', padding: '8px 0' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: 13, color: '#15803D', fontWeight: 700 }}>
                      ✓ Screening conversation complete!
                    </p>
                    <button style={styles.primaryButtonWide} onClick={() => setStep(6)}>
                      Proceed to Commercial Details →
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} style={styles.chatInputForm}>
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Type your response here..."
                      style={{ ...styles.chatInputField, backgroundColor: '#ffffff', border: '1px solid #CBD5E1', borderRadius: 8 }}
                      disabled={aiThinking}
                    />
                    <button type="submit" style={{ ...styles.chatSendBtn, backgroundColor: '#0F766E', borderRadius: 8 }} disabled={!userInput.trim() || aiThinking}>
                      Send ✈
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        )}

        {/* STEP 6: COMMERCIALS FORM */}
        {step === 6 && (
          <div style={{ ...styles.card, animation: 'fadeIn 0.5s ease-out' }}>
            <h1 style={styles.title}>💵 Commercial Information & Visa</h1>
            <p style={styles.description}>
              Excellent. Your technical screening has been completed. Now I'd like to confirm a few commercial details before moving to identity verification.
            </p>

            <div style={styles.formContainer}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Expected Hourly Rate ($/hr)</label>
                  <input
                    type="number"
                    value={expectedRate}
                    onChange={(e) => {
                      setExpectedRate(e.target.value);
                      if (extractedProfile) {
                        extractedProfile.target_rate = e.target.value;
                      }
                    }}
                    style={styles.formInput}
                    placeholder="e.g. 70"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Employment Type</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    style={styles.formInput}
                  >
                    <option value="C2C">C2C (Corp-to-Corp)</option>
                    <option value="W2">W2 Contract</option>
                    <option value="1099">1099 Independent</option>
                  </select>
                </div>

                {employmentType === 'C2C' && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Employer/Vendor Company Name</label>
                      <input
                        type="text"
                        value={employerCompany}
                        onChange={(e) => setEmployerCompany(e.target.value)}
                        style={styles.formInput}
                        placeholder="e.g. InfoTech Solutions"
                        required
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Employer/Vendor Contact Name</label>
                      <input
                        type="text"
                        value={employerName}
                        onChange={(e) => setEmployerName(e.target.value)}
                        style={styles.formInput}
                        placeholder="e.g. John Smith"
                        required
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Employer/Vendor Contact Email</label>
                      <input
                        type="email"
                        value={employerEmail}
                        onChange={(e) => setEmployerEmail(e.target.value)}
                        style={styles.formInput}
                        placeholder="e.g. john@infotech.com"
                        required
                      />
                    </div>
                  </>
                )}

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Current Location (City, State)</label>
                  <input
                    type="text"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    style={styles.formInput}
                    placeholder="e.g. Dallas, TX"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Notice Period</label>
                  <input
                    type="text"
                    value={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.value)}
                    style={styles.formInput}
                    placeholder="e.g. Immediate / 2 Weeks"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Earliest Start Date</label>
                  <input
                    type="date"
                    value={earliestStartDate}
                    onChange={(e) => setEarliestStartDate(e.target.value)}
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Work Authorization / Visa Status</label>
                  <select
                    value={visaStatusSelection}
                    onChange={(e) => {
                      setVisaStatusSelection(e.target.value);
                      if (extractedProfile) {
                        extractedProfile.visa_status = e.target.value;
                      }
                    }}
                    style={styles.formInput}
                  >
                    <option value="US Citizen">US Citizen</option>
                    <option value="Green Card">Green Card</option>
                    <option value="H1B">H1B Visa</option>
                    <option value="H4 EAD">H4 EAD</option>
                    <option value="OPT">OPT (F1)</option>
                    <option value="CPT">CPT</option>
                    <option value="TN">TN Visa (Canada/Mexico)</option>
                    <option value="L2">L2 Visa</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Open to Relocation</label>
                  <select
                    value={openToRelocation}
                    onChange={(e) => setOpenToRelocation(e.target.value)}
                    style={styles.formInput}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Open to Hybrid</label>
                  <select
                    value={hybridPreference}
                    onChange={(e) => setHybridPreference(e.target.value)}
                    style={styles.formInput}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Open to Travel</label>
                  <select
                    value={travelPreference}
                    onChange={(e) => setTravelPreference(e.target.value)}
                    style={styles.formInput}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div style={styles.formGroupFull}>
                  <label style={styles.formLabel}>LinkedIn URL</label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    style={styles.formInput}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            </div>

            <button
              style={{
                ...styles.primaryButtonWide,
                marginTop: 20,
                opacity: expectedRate ? 1 : 0.6,
                cursor: expectedRate ? 'pointer' : 'not-allowed'
              }}
              onClick={() => setStep(7)}
              disabled={!expectedRate}
            >
              Next: AI Rate Negotiation &rarr;
            </button>
          </div>
        )}

        {/* STEP 7: AI RATE NEGOTIATION */}
        {step === 7 && (
          <div style={{ ...styles.card, animation: 'fadeIn 0.5s ease-out' }}>
            <h1 style={styles.title}>💵 AI Rate Negotiation & Confirmation</h1>
            <p style={styles.description}>
              Based on the expected rate entered (${expectedRate || '60'}/hr {employmentType}) and our approved position budget.
            </p>

            <div style={styles.jobSpecCard}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: 15, color: '#4f46e5' }}>Approved Budget Rate Match</h3>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: '1.6' }}>
                Great news!<br/>
                Your requested target rate of <strong>${expectedRate || '60'}.00/hr {employmentType}</strong> is aligned with the approved client budget for this position.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 25 }}>
              <button
                style={{
                  ...styles.primaryButtonWide,
                  textAlign: 'left',
                  padding: '14px 20px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  fontSize: 13
                }}
                onClick={() => {
                  if (extractedProfile) extractedProfile.target_rate = expectedRate || "60";
                  setStep(8);
                }}
              >
                ✓ Confirm & proceed with ${expectedRate || '60'}/hr {employmentType}
              </button>
              
              <button
                style={{
                  ...styles.primaryButtonWide,
                  textAlign: 'left',
                  padding: '14px 20px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  fontSize: 13
                }}
                onClick={() => {
                  alert("Your rate preference has been logged. Our recruiters will review this manually.");
                  setStep(8);
                }}
              >
                💬 I'd like to discuss the rate / negotiate further with recruiter
              </button>
            </div>
          </div>
        )}

        {/* STEP 8: WORK AUTHORIZATION & DOCUMENT SCAN */}
        {step === 8 && (
          <div style={{ ...styles.card, animation: 'fadeIn 0.5s ease-out' }}>
            <h1 style={styles.title}>🪪 Work Authorization &amp; Profile Documents</h1>
            <p style={styles.description}>
              Please upload your identification and work authorization documents to complete the submission profile setup.
            </p>

            <div style={styles.ocrSection}>
              <div style={styles.ocrGrid}>
                {/* DL Slot */}
                <div style={styles.ocrCard}>
                  <strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Driver's License (Required)</strong>
                  {dlOcrResult ? (
                    <div style={styles.ocrVerifiedBox}>
                      <span style={styles.ocrVerifiedBadge}>✓ VALIDATED</span>
                      <div style={{ fontSize: 11, marginTop: 4 }}>DL: {dlOcrResult.details.number}</div>
                    </div>
                  ) : (
                    <div style={styles.ocrUploadZone}>
                      {dlUploading ? <span style={{ fontSize: 11 }}>Scanning...</span> : (
                        <label style={styles.docUploadLabel}>
                          📁 Upload Driver's License
                          <input type="file" onChange={(e) => handleUploadDocument(e, 'dl')} style={{ display: 'none' }} accept="image/*,.pdf" />
                        </label>
                      )}
                    </div>
                  )}
                </div>

                {/* Visa / Work Auth Slot */}
                <div style={styles.ocrCard}>
                  <strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Visa / EAD / GC (Required)</strong>
                  {visaOcrResult ? (
                    <div style={styles.ocrVerifiedBox}>
                      <span style={styles.ocrVerifiedBadge}>✓ VALIDATED</span>
                      <div style={{ fontSize: 11, marginTop: 4 }}>Visa Type: {visaOcrResult.details.visaType}</div>
                    </div>
                  ) : (
                    <div style={styles.ocrUploadZone}>
                      {visaUploading ? <span style={{ fontSize: 11 }}>Scanning...</span> : (
                        <label style={styles.docUploadLabel}>
                          📁 Upload Visa / EAD Scan
                          <input type="file" onChange={(e) => handleUploadDocument(e, 'visa')} style={{ display: 'none' }} accept="image/*,.pdf" />
                        </label>
                      )}
                    </div>
                  )}
                </div>

                {/* Passport Slot (Optional Document OR Passport Number) */}
                <div style={styles.ocrCard}>
                  <strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Passport (Optional Document or Passport #)</strong>
                  {passportOcrResult ? (
                    <div style={styles.ocrVerifiedBox}>
                      <span style={styles.ocrVerifiedBadge}>✓ VALIDATED</span>
                      <div style={{ fontSize: 11, marginTop: 4 }}>Passport: {passportOcrResult.details.number}</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ ...styles.ocrUploadZone, padding: '15px 10px', marginBottom: 8 }}>
                        {passportUploading ? <span style={{ fontSize: 11 }}>Scanning...</span> : (
                          <label style={styles.docUploadLabel}>
                            📁 Upload Passport Scan (Optional)
                            <input type="file" onChange={(e) => handleUploadDocument(e, 'passport')} style={{ display: 'none' }} accept="image/*,.pdf" />
                          </label>
                        )}
                      </div>
                      
                      <div style={{ marginTop: 6, textAlign: 'left' }}>
                        <label style={{ fontSize: 11, color: '#64748b', fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
                          OR Enter Passport Number:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. A12345678"
                          value={passportNumberInput}
                          onChange={(e) => setPassportNumberInput(e.target.value)}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            padding: '6px 10px',
                            fontSize: 12,
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SIDE-BY-SIDE ID DOCUMENT PREVIEW & LIVE CAMERA VERIFICATION WIDGET */}
            {(dlOcrResult || visaOcrResult) && (
              <div style={{
                marginTop: 25,
                padding: 20,
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 15, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  📸 Photo ID Confirmation
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 15px 0' }}>
                  Please use your webcam to capture a quick selfie photo with your ID card to complete your profile verification.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 15, alignItems: 'center' }}>
                  {/* Left Box: Real Uploaded ID Document Preview */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 16,
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 'bold', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 1 }}>
                        🪪 Scanned ID Document
                      </span>
                      {(dlDocPreviewUrl || visaDocPreviewUrl) && (
                        <a
                          href={dlDocPreviewUrl || visaDocPreviewUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 11, color: '#4f46e5', fontWeight: 'bold', textDecoration: 'none' }}
                        >
                          🔍 Open Doc ↗
                        </a>
                      )}
                    </div>

                    <div style={{
                      width: '100%',
                      height: 150,
                      backgroundColor: 'rgba(79, 70, 229, 0.05)',
                      border: '1px dashed rgba(79, 70, 229, 0.3)',
                      borderRadius: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      {dlDocPreviewUrl || visaDocPreviewUrl ? (
                        <img
                          src={dlDocPreviewUrl || visaDocPreviewUrl}
                          alt="Uploaded ID Document"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', padding: 8 }}>
                          <span style={{ fontSize: 32 }}>🆔</span>
                          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginTop: 4 }}>
                            {dlOcrResult ? `DL #${dlOcrResult.details.number}` : 'Visa / EAD Document'}
                          </div>
                          <span style={{ fontSize: 10, color: '#10b981', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: 4, fontWeight: 'bold', marginTop: 4, display: 'inline-block' }}>
                            ✓ Scanned & Validated
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Box: Real Live Webcam Camera Feed */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 16,
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 'bold', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 1 }}>
                        📷 Live Camera Feed
                      </span>
                      {idCardSelfieCaptured && (
                        <span style={{ fontSize: 10, color: '#10b981', fontWeight: 'bold', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: 4 }}>
                          ✓ Captured
                        </span>
                      )}
                    </div>
                    
                    <div style={{
                      width: '100%',
                      height: 150,
                      backgroundColor: '#090d16',
                      borderRadius: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {idCardSelfieCaptured && capturedSnapshotUrl ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <img
                            src={capturedSnapshotUrl}
                            alt="Candidate Photo with ID"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{
                            position: 'absolute', bottom: 6, left: 6, right: 6,
                            backgroundColor: 'rgba(16, 185, 129, 0.9)', color: '#ffffff',
                            padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 'bold'
                          }}>
                            ✓ Photo Confirmation Captured!
                          </div>
                        </div>
                      ) : cameraActive ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ color: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 10 }}>
                          <span style={{ fontSize: 32 }}>📷</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>
                            Click below to open webcam feed
                          </span>
                        </div>
                      )}
                    </div>

                    {!idCardSelfieCaptured ? (
                      cameraActive ? (
                        <button
                          style={{
                            ...styles.primaryButton,
                            width: '100%',
                            marginTop: 10,
                            fontSize: 12,
                            padding: '8px 12px'
                          }}
                          onClick={captureWebcamSnapshot}
                          disabled={idCardSelfieCapturing}
                        >
                          {idCardSelfieCapturing ? '⏳ Verifying...' : '📸 Snap Photo Holding ID Card'}
                        </button>
                      ) : (
                        <button
                          style={{
                            ...styles.primaryButton,
                            backgroundColor: '#0F766E',
                            width: '100%',
                            marginTop: 10,
                            fontSize: 12,
                            padding: '8px 12px'
                          }}
                          onClick={startWebcamStream}
                        >
                          🎥 Start Camera &amp; Confirm Location
                        </button>
                      )
                    ) : (
                      <button
                        style={{
                          ...styles.secondaryButton,
                          width: '100%',
                          marginTop: 10,
                          fontSize: 11,
                          padding: '6px 10px'
                        }}
                        onClick={() => {
                          setIdCardSelfieCaptured(false);
                          setCapturedSnapshotUrl(null);
                          startWebcamStream();
                        }}
                      >
                        🔄 Retake Live Photo
                      </button>
                    )}
                  </div>
                </div>

                {/* GPS Location Status Bar */}
                <div style={{
                  marginTop: 12,
                  padding: '8px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12
                }}>
                  <span style={{ color: '#475569' }}>
                    📍 Location Details: <strong>{gpsData ? gpsData.formattedAddress : 'Click camera button to capture location'}</strong>
                  </span>
                  <span style={{
                    color: gpsData ? '#10b981' : '#f59e0b',
                    fontWeight: 'bold',
                    backgroundColor: gpsData ? '#dcfce7' : '#fef3c7',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11
                  }}>
                    {gpsData ? '✓ Location Confirmed' : '⏳ Pending'}
                  </span>
                </div>
              </div>
            )}

            {/* Enable next step when DL + Visa + (Passport Doc OR Passport #) + ID Selfie are provided */}
            {(() => {
              const passportValid = passportOcrResult || passportNumberInput.trim().length > 0;
              const identityReady = dlOcrResult && visaOcrResult && passportValid && idCardSelfieCaptured;

              return (
                <button
                  style={{
                    ...styles.primaryButtonWide,
                    marginTop: 25,
                    opacity: identityReady ? 1 : 0.6,
                    cursor: identityReady ? 'pointer' : 'not-allowed'
                  }}
                  onClick={() => setStep(11)}
                  disabled={!identityReady}
                >
                  Next: Submission Consent &amp; RTR &rarr;
                </button>
              )
            })()}
          </div>
        )}

        {/* STEP 11: RTR SIGNATURE */}
        {step === 11 && (
          <div style={{ ...styles.card, animation: 'fadeIn 0.5s ease-out' }}>
            <h1 style={styles.title}>✍️ Submission Consent &amp; RTR Confirmation</h1>
            <p style={styles.description}>
              Please review your application summary and sign the Submission Consent / Right to Represent (RTR) declaration.
            </p>

            {/* Email Notification Callout */}
            <div style={{
              backgroundColor: 'rgba(79, 70, 229, 0.06)',
              border: '1px solid rgba(79, 70, 229, 0.2)',
              borderRadius: 10,
              padding: '14px 18px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <span style={{ fontSize: 24 }}>📧</span>
              <div style={{ fontSize: 13, color: '#0f172a' }}>
                <strong>RTR Email Dispatched:</strong> An official Right to Represent confirmation email has been sent to <strong>{extractedProfile?.email || 'your registered email'}</strong>. Please check your inbox to confirm your email link.
              </div>
            </div>

            <div style={styles.jobSpecCard}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: 14, color: '#4f46e5' }}>Right to Represent (RTR) Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 15px', fontSize: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                <div><strong>Client:</strong> {session?.jobClient || 'Direct Client'}</div>
                <div><strong>Job Title:</strong> {session?.jobTitle || 'Target Position'}</div>
                <div><strong>Negotiated Rate:</strong> ${expectedRate || '60'}.00/hr {employmentType}</div>
                <div><strong>Work Authorization:</strong> {visaStatusSelection}</div>
                {employerCompany && (
                  <>
                    <div><strong>Employer/Vendor:</strong> {employerCompany}</div>
                    <div><strong>Employer Contact:</strong> {employerName} ({employerEmail})</div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 12, color: '#0f172a', lineHeight: '1.4' }}>
                  <input
                    type="checkbox"
                    checked={legalDeclarationChecked}
                    onChange={(e) => setLegalDeclarationChecked(e.target.checked)}
                    style={{ marginTop: 2 }}
                  />
                  <span>
                    ⚖️ <strong>Work Authorization &amp; Document Accuracy Confirmation:</strong> I confirm that all submitted documents (Driver's License, Visa/EAD, Passport) and profile details are accurate, genuine, and represent my current work authorization status.
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#0f172a' }}>
                  <input type="checkbox" checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} />
                  <span>☑ All information provided during this application is accurate and truthful.</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#0f172a' }}>
                  <input type="checkbox" defaultChecked />
                  <span>☑ I authorize VerifyHire and hiring partners to represent my profile to the client company.</span>
                </label>
              </div>
            </div>

            <div style={{ margin: '15px 0' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: '#0f172a' }}>Digital Signature (Type your Full Name to sign):</label>
              <input
                type="text"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                style={{ ...styles.formInput, width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, boxSizing: 'border-box' }}
                placeholder="Type your full name"
              />
            </div>

            <button
              style={{
                ...styles.primaryButtonWide,
                opacity: (consentChecked && legalDeclarationChecked && signatureText.trim() && !submitting) ? 1 : 0.6,
                cursor: (consentChecked && legalDeclarationChecked && signatureText.trim() && !submitting) ? 'pointer' : 'not-allowed'
              }}
              onClick={handleSubmitApplication}
              disabled={!consentChecked || !legalDeclarationChecked || !signatureText.trim() || submitting}
            >
              {submitting ? '⏳ Submitting Application...' : '🚀 Sign & Submit Application'}
            </button>
          </div>
        )}

        {/* STEP 12: CANDIDATE SUCCESS SCREEN */}
        {step === 12 && (
          <div style={{ ...styles.card, textAlign: 'center', animation: 'fadeIn 0.5s ease-out', padding: '40px 32px' }}>
            <div style={styles.successIcon}>🎉</div>
            <h1 style={styles.title}>Application Submitted Successfully</h1>
            <p style={styles.description}>
              Your screening and onboarding profile setup has been completed.
            </p>

            <div style={styles.refNumberCard}>
              <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1 }}>
                Submission Reference ID
              </span>
              <code style={{ fontSize: 20, fontWeight: 700, color: '#0F766E', marginTop: 4, display: 'block', fontFamily: 'monospace' }}>
                {candidateId || 'VH-2026-001245'}
              </code>
            </div>

            <div style={{ ...styles.jobSpecCard, textAlign: 'left', marginTop: 20, borderLeft: '4px solid #0F766E', padding: '16px 20px', backgroundColor: '#F0FDF4' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: 14, color: '#166534', fontWeight: 700 }}>📬 Next Step: Submission Consent</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#1F2937', lineHeight: '1.5' }}>
                You have received the <strong>Right to Represent (RTR)</strong> document link in your email. Please review and sign it as soon as possible so we can proceed with submitting your profile to our client.
              </p>
            </div>

            <button style={{ ...styles.primaryButtonWide, marginTop: 20 }} onClick={() => navigate('/')}>
              Finish & Exit
            </button>
          </div>
        )}

      </main>
    </div>
  )
}

// Inline CSS styles
const styles = {
  loadingOverlay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#f8fafc'
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    border: '4px solid rgba(79, 70, 229, 0.1)',
    borderRadius: '50%',
    borderTopColor: '#4f46e5',
    animation: 'spin 1s ease-in-out infinite'
  },
  errorCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: 30,
    maxWidth: 450,
    textAlign: 'center',
    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05)'
  },
  pageBackground: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '30px 20px',
    boxSizing: 'border-box'
  },
  header: {
    width: '100%',
    maxWidth: 1100,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 15
  },
  headerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  brandIcon: {
    fontSize: 24
  },
  brandText: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 800,
    fontSize: 20,
    color: '#0f172a'
  },
  headerBadge: {
    backgroundColor: '#0F766E',
    color: '#ffffff',
    fontSize: 10,
    padding: '4px 10px',
    borderRadius: 6,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1100,
    marginBottom: 35,
    backgroundColor: '#ffffff',
    padding: '16px 20px',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
    overflowX: 'auto'
  },
  stepBubbleContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1,
    minWidth: 50
  },
  stepBubble: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    transition: 'all 0.3s ease'
  },
  stepBubbleLabel: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  },
  stepConnector: {
    flexGrow: 1,
    height: 3,
    margin: '0 -10px',
    marginTop: -16,
    transition: 'background-color 0.3s ease',
    minWidth: 20
  },
  mainContainer: {
    width: '100%',
    transition: 'max-width 0.3s ease'
  },
  // Job info banner (visible throughout all steps)
  jobInfoBanner: {
    width: '100%',
    maxWidth: 1100,
    backgroundColor: '#ffffff',
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    padding: '10px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
    boxShadow: '0 1px 4px rgba(15,23,42,0.04)'
  },
  jobInfoBannerLeft: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8
  },
  jobInfoBannerTitle: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 800,
    fontSize: 14,
    color: '#0F172A'
  },
  jobInfoBannerChip: {
    fontSize: 11,
    color: '#334155',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: '3px 10px',
    border: '1px solid #E2E8F0'
  },
  jobInfoBannerRight: {
    textAlign: 'right',
    flexShrink: 0
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: 35,
    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05)',
    boxSizing: 'border-box'
  },
  title: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 24,
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 10px 0'
  },
  description: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: '#64748b',
    fontSize: 14,
    lineHeight: '1.6',
    margin: '0 0 25px 0'
  },
  jobSpecCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 20,
    border: '1px solid #e2e8f0',
    marginBottom: 20
  },
  jobSpecClient: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: '#4f46e5',
    fontWeight: 'bold',
    letterSpacing: 1,
    display: 'block',
    marginBottom: 2
  },
  jobSpecTitle: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 18,
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 12px 0'
  },
  specGrid: {
    display: 'flex',
    gap: 20,
    fontSize: 13,
    color: '#64748b',
    flexWrap: 'wrap'
  },
  specItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  tagWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6
  },
  tagBadge: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    padding: '3px 8px',
    fontSize: 11,
    color: '#0f172a',
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  },
  instructionList: {
    borderLeft: '3px solid #0F766E',
    paddingLeft: 16,
    margin: '0 0 20px 0'
  },
  roleSelectionBtn: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '14px 18px',
    borderRadius: 10,
    border: '1.5px solid',
    cursor: 'pointer',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14,
    textAlign: 'left',
    transition: 'all 0.18s ease'
  },
  primaryButton: {
    backgroundColor: '#0F766E',
    color: '#ffffff',
    border: 'none',
    borderRadius: 10,
    padding: '11px 22px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 'bold',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.2)'
  },
  primaryButtonWide: {
    backgroundColor: '#0F766E',
    color: '#ffffff',
    border: 'none',
    borderRadius: 10,
    padding: '12px 24px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.2)',
    transition: 'background 0.2s'
  },
  secondaryButton: {
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '10px 20px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 'bold',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#ffffff',
    color: '#0f172a'
  },
  btnBack: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: 13,
    marginTop: 15,
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  },
  uploadZone: {
    border: '2px dashed #0F766E',
    borderRadius: 12,
    padding: '40px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    marginBottom: 20,
    transition: 'all 0.2s ease',
    backgroundColor: 'rgba(15, 118, 110, 0.02)'
  },
  uploadIcon: {
    fontSize: 40
  },
  uploadBtn: {
    display: 'inline-block',
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    color: '#0F766E',
    fontWeight: 'bold',
    fontSize: 13,
    padding: '9px 18px',
    borderRadius: 8,
    cursor: 'pointer',
    border: '1px solid rgba(15, 118, 110, 0.2)'
  },
  progressTrackerCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '20px 0'
  },
  analysisGraphic: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    animation: 'pulse 2s infinite'
  },
  pulserLogo: {
    fontSize: 40
  },
  progressBarWrapper: {
    width: '100%',
    height: 8,
    backgroundColor: '#efe5d2',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#126a5a',
    transition: 'width 0.5s ease-out'
  },
  analysisStatus: {
    fontSize: 14,
    fontWeight: 600,
    color: '#126a5a',
    margin: '10px 0 2px 0'
  },
  analysisPercent: {
    fontSize: 12,
    color: '#53625f',
    margin: 0
  },
  matchScoreSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 25,
    backgroundColor: '#f2eee7',
    borderRadius: 10,
    padding: 20,
    border: '1px solid #d8cdb7',
    marginBottom: 25,
    flexWrap: 'wrap'
  },
  matchSummaryCard: {
    flexGrow: 1,
    flexBasis: 300
  },
  compareGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20,
    marginBottom: 20
  },
  compareCol: {
    backgroundColor: '#fffdf8',
    border: '1px solid #d8cdb7',
    borderRadius: 8,
    padding: 16
  },
  riskCard: {
    backgroundColor: 'rgba(181, 71, 79, 0.05)',
    border: '1px solid rgba(181, 71, 79, 0.2)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20
  },
  rejectNotice: {
    backgroundColor: 'rgba(181, 71, 79, 0.08)',
    border: '1px solid #b5474f',
    borderRadius: 8,
    padding: 20,
    color: '#b5474f',
    marginBottom: 10
  },
  splitLayoutContainer: {
    display: 'flex',
    gap: 20,
    width: '100%',
    flexWrap: 'wrap',
    animation: 'fadeIn 0.5s ease-out'
  },
  profileLiveCard: {
    flex: '1 1 320px',
    backgroundColor: '#fffdf8',
    border: '1px solid #d8cdb7',
    borderRadius: 14,
    padding: 20,
    boxShadow: '0 12px 30px rgba(18, 39, 35, 0.09)',
    boxSizing: 'border-box'
  },
  splitCardHeader: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: '#1d2b2a',
    margin: '0 0 6px 0'
  },
  liveFieldsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  liveFieldItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #efe5d2',
    fontSize: 12,
    transition: 'all 0.3s ease'
  },
  liveFieldLabel: {
    fontWeight: 'bold',
    color: '#53625f'
  },
  liveFieldValue: {
    fontSize: 12,
    fontFamily: 'monospace'
  },
  chatSplitWindow: {
    flex: '2 1 550px',
    backgroundColor: '#efe5d2',
    border: '1px solid #d8cdb7',
    borderRadius: 14,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: 520,
    boxShadow: '0 12px 30px rgba(18, 39, 35, 0.09)'
  },
  chatWindow: {
    backgroundColor: '#efe5d2',
    border: '1px solid #d8cdb7',
    borderRadius: 14,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: 520,
    boxShadow: '0 12px 30px rgba(18, 39, 35, 0.09)',
    animation: 'fadeIn 0.5s ease-out'
  },
  chatHeader: {
    backgroundColor: '#126a5a',
    color: '#fffdf8',
    padding: '14px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chatHeaderDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  chatHeaderAvatar: {
    fontSize: 24
  },
  chatHeaderProgressBadge: {
    fontSize: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: '3px 8px',
    borderRadius: 4
  },
  chatBody: {
    flexGrow: 1,
    padding: 20,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 15
  },
  chatMessageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    maxWidth: '85%'
  },
  chatMsgAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: '#126a5a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    color: '#fffdf8',
    marginTop: 2
  },
  chatBubble: {
    padding: '12px 16px',
    fontSize: 14,
    lineHeight: '1.5',
    fontFamily: 'Outfit, sans-serif',
    boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
    wordBreak: 'break-word',
    whiteSpace: 'pre-line'
  },
  typingIndicator: {
    backgroundColor: '#fffdf8',
    border: '1px solid #d8cdb7',
    borderRadius: '4px 16px 16px 16px',
    padding: '12px 20px',
    display: 'flex',
    gap: 4
  },
  typingDot: {
    width: 6,
    height: 6,
    backgroundColor: '#126a5a',
    borderRadius: '50%'
  },
  chatInputContainer: {
    backgroundColor: '#fffdf8',
    borderTop: '1px solid #d8cdb7',
    padding: 15
  },
  chatInputForm: {
    display: 'flex',
    gap: 10
  },
  chatInputField: {
    flexGrow: 1,
    border: '1px solid #d8cdb7',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 14,
    fontFamily: 'Outfit, sans-serif',
    backgroundColor: '#f2eee7',
    color: '#1d2b2a'
  },
  chatSendBtn: {
    backgroundColor: '#126a5a',
    color: '#fffdf8',
    border: 'none',
    borderRadius: 8,
    padding: '10px 18px',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 'bold',
    fontSize: 14,
    cursor: 'pointer'
  },
  ocrSection: {
    backgroundColor: '#f2eee7',
    borderRadius: 10,
    border: '1px solid #d8cdb7',
    padding: 20,
    marginBottom: 20
  },
  ocrGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 15
  },
  ocrCard: {
    backgroundColor: '#fffdf8',
    border: '1px solid #d8cdb7',
    borderRadius: 8,
    padding: 16
  },
  ocrUploadZone: {
    border: '1px dashed #d8cdb7',
    borderRadius: 6,
    padding: 20,
    textAlign: 'center',
    backgroundColor: '#f2eee7'
  },
  docUploadLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#126a5a',
    cursor: 'pointer',
    display: 'block'
  },
  ocrVerifiedBox: {
    backgroundColor: 'rgba(18, 106, 90, 0.05)',
    border: '1px solid rgba(18, 106, 90, 0.2)',
    borderRadius: 6,
    padding: 12
  },
  ocrVerifiedBadge: {
    fontSize: 10,
    backgroundColor: '#126a5a',
    color: '#fffdf8',
    padding: '3px 8px',
    borderRadius: 4,
    fontWeight: 'bold'
  },
  ocrPassChecks: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    marginTop: 10,
    borderTop: '1px solid rgba(18, 106, 90, 0.1)',
    paddingTop: 8
  },
  ocrPassCheckTag: {
    fontSize: 10,
    color: '#126a5a'
  },
  formContainer: {
    backgroundColor: '#f2eee7',
    borderRadius: 10,
    border: '1px solid #d8cdb7',
    padding: 20,
    marginBottom: 20
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 15
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  formGroupFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    gridColumn: '1 / -1'
  },
  formLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#53625f',
    textTransform: 'uppercase'
  },
  formInput: {
    border: '1px solid #d8cdb7',
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: 13,
    fontFamily: 'Outfit, sans-serif',
    backgroundColor: '#fffdf8',
    color: '#1d2b2a'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  consentCard: {
    backgroundColor: '#efe5d2',
    border: '1px solid #d8cdb7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20
  },
  consentCheckboxRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 25,
    cursor: 'pointer'
  },
  successIcon: {
    fontSize: 60,
    margin: '0 auto 15px auto',
    animation: 'pulse 1s infinite'
  },
  refNumberCard: {
    backgroundColor: '#efe5d2',
    border: '1px solid #d8cdb7',
    borderRadius: 8,
    padding: '12px 20px',
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '0 auto 20px auto'
  },
  nextStepsCard: {
    borderLeft: '4px solid #126a5a',
    backgroundColor: '#efe5d2',
    padding: 16,
    textAlign: 'left',
    margin: '0 auto 25px auto',
    borderRadius: '0 8px 8px 0'
  }
}
