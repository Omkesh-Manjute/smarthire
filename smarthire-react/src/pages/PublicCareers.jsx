import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CandidateMessengerWidget from '../components/CandidateMessengerWidget'
import SmartHireBotWidget from '../components/SmartHireBotWidget'
import { loginWithGoogle } from '../lib/firebase'

export default function PublicCareers() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const targetJobId = searchParams.get('jobId')

  const getJobPostTimezones = (job) => {
    let date = null;
    if (job.id && job.id.startsWith('J-')) {
      const ts = parseInt(job.id.replace('J-', ''), 10);
      if (!isNaN(ts)) {
        date = new Date(ts);
      }
    }
    if (!date || isNaN(date.getTime())) {
      date = job.creationDate ? new Date(job.creationDate) : new Date();
    }

    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };

    const formatZone = (tz, tzName) => {
      try {
        const dStr = new Intl.DateTimeFormat('en-US', { ...dateOptions, timeZone: tz }).format(date);
        const tStr = new Intl.DateTimeFormat('en-US', { ...timeOptions, timeZone: tz }).format(date);
        return `${dStr} at ${tStr} ${tzName}`;
      } catch (e) {
        return date.toLocaleDateString();
      }
    };

    return {
      EST: formatZone('America/New_York', 'EST'),
      CST: formatZone('America/Chicago', 'CST'),
      MST: formatZone('America/Denver', 'MST'),
      PST: formatZone('America/Los_Angeles', 'PST')
    };
  }

  // Capture referral parameter from URL (e.g. ?ref=john-doe)
  useEffect(() => {
    const refCode = searchParams.get('ref') || searchParams.get('recruiter') || searchParams.get('recruiterRef')
    if (refCode) {
      sessionStorage.setItem('smarthire_recruiter_ref', refCode)
      localStorage.setItem('smarthire_recruiter_ref', refCode)
    }
  }, [searchParams])

  const [themeMode, setThemeMode] = useState('light')
  const [activeChatCandidate, setActiveChatCandidate] = useState(null)

  const [currentTime, setCurrentTime] = useState(new Date())
  const [clocksExpanded, setClocksExpanded] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatLiveTime = (tz) => {
    try {
      const timeStr = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: tz
      }).format(currentTime)

      const dateStr = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        timeZone: tz
      }).format(currentTime)

      return { time: timeStr, date: dateStr }
    } catch (e) {
      return { time: currentTime.toLocaleTimeString(), date: currentTime.toLocaleDateString() }
    }
  }

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('All')
  const [chatEnabled, setChatEnabled] = useState(true)
  const [botWidgetOpen, setBotWidgetOpen] = useState(false)
  
  // Track applied jobs locally so candidate gets a direct "Message Recruiter" button on applied job cards
  const [appliedJobs, setAppliedJobs] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_applied_jobs')
      return saved ? JSON.parse(saved) : {}
    } catch(e) { return {} }
  })
  
  // Candidate Google Login State
  const [candidateUser, setCandidateUser] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_candidate_user')
      return saved ? JSON.parse(saved) : null
    } catch(e) { return null }
  })
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [targetJobForLogin, setTargetJobForLogin] = useState(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginName, setLoginName] = useState('')

  const handleCandidateLogin = (userObj) => {
    setCandidateUser(userObj)
    try { localStorage.setItem('smarthire_candidate_user', JSON.stringify(userObj)) } catch(e) {}
    setShowLoginModal(false)
    if (userObj.name) setCandidateName(userObj.name)
    if (userObj.email) setCandidateEmail(userObj.email)
    if (targetJobForLogin) {
      openApplicationModal(targetJobForLogin)
      setTargetJobForLogin(null)
    }
  }

  const handleCandidateSignOut = () => {
    setCandidateUser(null)
    localStorage.removeItem('smarthire_candidate_user')
  }

  const handleApplyClick = (job) => {
    if (!candidateUser) {
      setTargetJobForLogin(job)
      setShowLoginModal(true)
    } else {
      if (!candidateName && candidateUser.name) setCandidateName(candidateUser.name)
      if (!candidateEmail && candidateUser.email) setCandidateEmail(candidateUser.email)
      openApplicationModal(job)
    }
  }

  // Application Modal state
  const [selectedJob, setSelectedJob] = useState(null)
  const [candidateName, setCandidateName] = useState('')
  const [candidateEmail, setCandidateEmail] = useState('')
  const [candidatePhone, setCandidatePhone] = useState('')
  const [currentLocation, setCurrentLocation] = useState('')
  const [relocatePref, setRelocatePref] = useState('Yes')
  const [contractType, setContractType] = useState('C2C')
  const [visaStatus, setVisaStatus] = useState('US Citizen')
  const [expectedRate, setExpectedRate] = useState('')
  
  // File Upload & Auto-Parsing State
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [isParsingResume, setIsParsingResume] = useState(false)
  const [autoFillSuccess, setAutoFillSuccess] = useState(false)
  const [detailsVerified, setDetailsVerified] = useState(false)

  // Full JD Reader Modal State
  const [fullJdModalJob, setFullJdModalJob] = useState(null)

  // Submit State & Result
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(null)

  // Theme Palette
  const isLight = themeMode === 'light'
  const theme = {
    bg: isLight ? '#F8FAFC' : '#0B0F17',
    cardBg: isLight ? '#FFFFFF' : '#1E293B',
    headerBg: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)',
    textPrimary: isLight ? '#0F172A' : '#F1F5F9',
    textSecondary: isLight ? '#475569' : '#94A3B8',
    border: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)',
    inputBg: isLight ? '#F1F5F9' : '#0F172A',
    inputBorder: isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.12)',
    accent: '#2563EB',
    purple: '#7C3AED',
    tagBg: isLight ? '#EFF6FF' : 'rgba(37, 99, 235, 0.12)',
    tagText: isLight ? '#1D4ED8' : '#93C5FD',
    shadow: isLight ? '0 4px 20px rgba(15, 23, 42, 0.06)' : '0 10px 30px rgba(0, 0, 0, 0.4)'
  }

  const [expandedBriefJobId, setExpandedBriefJobId] = useState(null)

  // Helper to extract clean human name from resume filename
  const cleanNameFromFileName = (fileName) => {
    if (!fileName) return ''
    let name = fileName.replace(/\.(pdf|docx|doc|txt)$/i, '')
    // Split camelCase e.g. ResumeFrancisPribilovics -> Resume Francis Pribilovics
    name = name.replace(/([a-z])([A-Z])/g, '$1 $2')
    name = name.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    name = name.replace(/%20|_|-/g, ' ')
    // Strip common resume labels
    name = name.replace(/\b(resume|cv|curriculum|vitae|profile|applicant|candidate|doc|docx|pdf|updated|latest|draft|final|202\d|201\d)\b/gi, '')
    name = name.replace(/[^a-zA-Z\s]/g, ' ').replace(/\s+/g, ' ').trim()
    
    const words = name.split(' ').filter(w => w.length >= 2)
    if (words.length >= 2) {
      return words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    }
    return words.length === 1 ? words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase() : ''
  }

  const getFullDescriptionText = (job) => {
    if (!job) return ''
    const raw = job.rawDescription || job.fullDescription || job.rawText || job.details || job.rawJd
    if (raw && raw.length > 80) return raw

    const reqSkills = Array.isArray(job.skills) && job.skills.length > 0
      ? job.skills.join(', ')
      : 'Technical expertise relevant to role'

    const prefSkills = Array.isArray(job.preferredSkills) && job.preferredSkills.length > 0
      ? job.preferredSkills.join(', ')
      : Array.isArray(job.preferred_skills) && job.preferred_skills.length > 0
      ? job.preferred_skills.join(', ')
      : 'Cloud architecture (AWS/Azure), Agile delivery, CI/CD pipeline automation'

    const expText = job.experience && job.experience !== 'TBD' && job.experience !== 'Any'
      ? job.experience
      : '3+ years of professional experience'

    const locText = job.location || 'Remote, US'
    const modeText = job.work_mode || job.workMode || job.type || 'Onsite'
    const typeText = job.employment_type || job.employmentType || job.type || 'Contract'

    return `📌 Position Overview:\nWe are seeking a qualified ${job.title} to join our engineering queue. This is a ${typeText} role operating in a ${modeText} environment.\n\n📍 Work Location: ${locText}\n⏳ Required Experience: ${expText}\n\n🛠️ Required Technical Skills:\n• ${reqSkills.split(', ').join('\n• ')}\n\n⭐ Preferred Skills & Qualifications:\n• ${prefSkills.split(', ').join('\n• ')}\n\n📋 Key Responsibilities & Deliverables:\n• Design, develop, and deliver technical solutions according to project specifications.\n• Collaborate with cross-functional technical leads, architects, and project stakeholders.\n• Perform code reviews, system troubleshooting, and performance optimization.`
  }

  const formatExperience = (val) => {
    if (!val || val === 'TBD' || val === 'Any') return 'Relevant Experience'
    return val
  }

  const isJobExpired = (job) => {
    if (!job) return true
    const s = (job.status || '').toLowerCase()
    if (s === 'closed' || s === 'expired' || s === 'inactive') return true

    const dl = job.deadline || job.submissionDeadline
    if (dl) {
      const deadlineDate = new Date(dl)
      if (!isNaN(deadlineDate.getTime())) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        deadlineDate.setHours(0, 0, 0, 0)
        if (today > deadlineDate) return true
      }
    }
    return false
  }

  useEffect(() => {
    fetchJobs()
    fetchSiteSettings()
  }, [])

  const fetchSiteSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      if (data.success && data.settings) {
        setChatEnabled(data.settings.chatEnabled !== false)
      }
    } catch(e) {}
  }

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/jobs')
      const data = await res.json()
      if (data.success && Array.isArray(data.jobs)) {
        setJobs(data.jobs)
        
        if (targetJobId) {
          const match = data.jobs.find(j => j.id === targetJobId)
          if (match) openApplicationModal(match)
        }
      }
    } catch (e) {
      console.error('Failed to fetch public jobs:', e)
    } finally {
      setLoading(false)
    }
  }

  const openApplicationModal = (job) => {
    if (isJobExpired(job)) {
      alert(`⚠️ This job vacancy (${job.title}) has expired or been closed and is no longer accepting new applications.`)
      return
    }
    setSelectedJob(job)
    setSubmitSuccess(null)
    setSubmitError('')
    setSubmitting(false)
    setResumeFile(null)
    setResumeText('')
    setCandidateName('')
    setCandidateEmail('')
    setCandidatePhone('')
    setCurrentLocation('')
    setAutoFillSuccess(false)
    setDetailsVerified(false)
  }

  // Resume Upload Handler with Smart Name & Details Auto-Parsing
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setResumeFile(file)
    setIsParsingResume(true)
    setAutoFillSuccess(false)

    try {
      // 1. First extract candidate name from filename (e.g. ResumeFrancisPribilovics.pdf -> Francis Pribilovics)
      const nameFromFilename = cleanNameFromFileName(file.name)
      if (nameFromFilename && nameFromFilename.toUpperCase() !== 'PDF') {
        setCandidateName(nameFromFilename)
      }

      // 2. Send file to backend parser API for text extraction & regex matching
      const formData = new FormData()
      formData.append('resume', file)

      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()

      if (data.success) {
        const text = data.text || ''
        setResumeText(text)

        if (data.email) {
          setCandidateEmail(data.email)
        } else {
          const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
          if (emailMatch) setCandidateEmail(emailMatch[0])
        }

        if (data.phone) {
          setCandidatePhone(data.phone)
        } else {
          const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/)
          if (phoneMatch) setCandidatePhone(phoneMatch[0])
        }

        if (data.location) {
          setCurrentLocation(data.location)
        } else {
          const locationMatch = text.match(/([A-Z][a-zA-Z\s]{2,15},\s*[A-Z]{2})/)
          if (locationMatch) setCurrentLocation(locationMatch[1])
        }

        // Advanced Name Extraction from text lines if filename didn't produce a full 2-word name
        if (!nameFromFilename || nameFromFilename.split(' ').length < 2) {
          const cleanLines = text.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 2 && l.length < 40)
            .filter(l => !/%pdf|pdf|adobe|stream|obj|endobj|resume|cv|curriculum|vitae|page|email|phone|tel|http|www|@/i.test(l))

          for (const line of cleanLines) {
            const words = line.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/)
            if (words.length >= 2 && words.length <= 3 && words.every(w => w.length >= 2 && /^[A-Z]/.test(w))) {
              const nameCandidate = words.join(' ')
              if (nameCandidate.toUpperCase() !== 'PDF') {
                setCandidateName(nameCandidate)
                break
              }
            }
          }
        }

        // Only show autofill success badge if any details were successfully extracted
        if (data.email || data.phone || data.location || (nameFromFilename && nameFromFilename.toUpperCase() !== 'PDF')) {
          setAutoFillSuccess(true)
        }
      }
    } catch (err) {
      console.error('Resume parsing error:', err)
    } finally {
      setIsParsingResume(false)
    }
  }

  const filteredJobs = jobs.filter(j => {
    if (isJobExpired(j)) return false

    const titleMatch = j.title?.toLowerCase().includes(searchQuery.toLowerCase())
    const skillMatch = Array.isArray(j.skills) && j.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    const locMatch = (j.location || 'Remote, US').toLowerCase().includes(searchQuery.toLowerCase())
    const qMatch = titleMatch || skillMatch || locMatch

    if (selectedLocation === 'Remote') return qMatch && (j.location || 'Remote').toLowerCase().includes('remote')
    if (selectedLocation === 'Hybrid') return qMatch && (j.location || '').toLowerCase().includes('hybrid')
    if (selectedLocation === 'Onsite') return qMatch && ((j.location || '').toLowerCase().includes('onsite') || (j.location || '').toLowerCase().includes('on-site'))
    return qMatch
  })

  const handleApplySubmit = async (e) => {
    e.preventDefault()
    let validName = candidateName.trim()
    if (!validName || validName.toUpperCase() === 'PDF') {
      validName = cleanNameFromFileName(resumeFile?.name) || (candidateEmail ? candidateEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Candidate Application')
      setCandidateName(validName)
    }

    if (!validName || !candidateEmail.trim()) {
      setSubmitError('Please enter your Full Name and Email Address.')
      return
    }
    setSubmitting(true)
    setSubmitError('')

    try {
      let res
      if (resumeFile) {
        const formData = new FormData()
        formData.append('resume', resumeFile)
        formData.append('jobId', selectedJob.id)
        formData.append('candidateName', validName)
        formData.append('candidateEmail', candidateEmail.trim())
        formData.append('candidatePhone', candidatePhone.trim())
        formData.append('currentLocation', currentLocation.trim())
        formData.append('relocatePref', relocatePref)
        formData.append('contractType', contractType)
        formData.append('visaStatus', visaStatus)
        formData.append('expectedRate', expectedRate)
        if (resumeText) formData.append('resumeText', resumeText)

        res = await fetch('/api/screening/public-submit-file', {
          method: 'POST',
          body: formData
        })
      } else {
        res = await fetch('/api/screening/public-submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: selectedJob.id,
            candidateName: validName,
            candidateEmail: candidateEmail.trim(),
            candidatePhone: candidatePhone.trim(),
            currentLocation: currentLocation.trim(),
            relocatePref,
            contractType,
            visaStatus,
            expectedRate,
            resumeFileName: 'Candidate_Resume.pdf',
            resumeText: resumeText || `${validName} - Applied for ${selectedJob.title}`
          })
        })
      }

      const data = await res.json()

      if (data.success) {
        const parsedName = data.candidateName || validName;
        const appRecord = {
          sessionId: data.sessionId || 'SCR-' + Date.now(),
          candidateId: data.candidateId || data.sessionId || 'SCR-' + Date.now(),
          jobId: selectedJob.id,
          jobTitle: selectedJob.title,
          candidateName: parsedName,
          candidateEmail: candidateEmail.trim(),
          appliedAt: new Date().toISOString()
        }
        
        // Save applied job mapping
        const updated = { ...appliedJobs, [selectedJob.id]: appRecord }
        setAppliedJobs(updated)
        try { localStorage.setItem('smarthire_applied_jobs', JSON.stringify(updated)) } catch(e) {}

        setSubmitSuccess({ ...data, candidateName: parsedName, appRecord })
      } else {
        setSubmitError(data.message || 'Failed to submit application.')
      }
    } catch (err) {
      console.error('Submission error:', err)
      setSubmitError('Server connection error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.textPrimary, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'background-color 0.3s, color 0.3s' }}>
      <style>{`
        .sh-search-container {
          transition: all 0.2s ease-in-out;
        }
        .sh-search-container:focus-within {
          border-color: #3B82F6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
        }
        .sh-job-card {
          background-color: ${theme.cardBg};
          border: 1px solid ${theme.border};
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: ${theme.shadow};
          position: relative;
          overflow: hidden;
        }
        .sh-job-card:hover {
          transform: translateY(-6px);
          box-shadow: ${isLight ? '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'};
          border-color: #3B82F6;
        }
        .sh-job-card.expired {
          background-color: ${isLight ? '#F8FAFC' : '#0F172A'};
          border-color: ${isLight ? '#E2E8F0' : 'rgba(239, 68, 68, 0.25)'};
          opacity: 0.85;
        }
        .sh-job-card.expired:hover {
          transform: none;
          box-shadow: ${theme.shadow};
          border-color: ${isLight ? '#E2E8F0' : 'rgba(239, 68, 68, 0.25)'};
        }
        .sh-job-title {
          font-size: 19px;
          font-weight: 800;
          color: ${theme.textPrimary};
          margin: 0 0 12px;
          line-height: 1.4;
          transition: color 0.2s ease;
        }
        .sh-job-card:not(.expired):hover .sh-job-title {
          color: #2563EB;
        }
        .sh-metadata-container {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
          align-items: center;
        }
        .sh-metadata-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: ${theme.textSecondary};
          font-weight: 500;
        }
        .sh-metadata-divider {
          width: 4px;
          height: 4px;
          background-color: ${theme.border};
          border-radius: 50%;
        }
        .sh-skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 18px;
        }
        .sh-skill-pill {
          font-size: 11px;
          font-weight: 600;
          background-color: ${theme.tagBg};
          color: ${theme.tagText};
          padding: 4px 10px;
          border-radius: 6px;
          transition: all 0.2s ease;
          border: 1px solid ${isLight ? 'rgba(37, 99, 235, 0.15)' : 'rgba(147, 197, 253, 0.15)'};
        }
        .sh-job-card:not(.expired):hover .sh-skill-pill {
          border-color: rgba(37, 99, 235, 0.3);
        }
        .sh-jd-box {
          background-color: ${isLight ? '#F8FAFC' : '#0F172A'};
          border-left: 3.5px solid #3B82F6;
          border-radius: 4px 12px 12px 4px;
          padding: 14px 16px;
          font-size: 13px;
          color: ${theme.textSecondary};
          margin-bottom: 20px;
          line-height: 1.6;
          transition: all 0.2s ease;
          border-top: 1px solid ${theme.border};
          border-right: 1px solid ${theme.border};
          border-bottom: 1px solid ${theme.border};
        }
        .sh-jd-header {
          font-weight: 700;
          color: ${theme.textPrimary};
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sh-card-footer {
          border-top: 1px solid ${theme.border};
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sh-apply-btn {
          background-color: #2563EB;
          background-image: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
          color: #FFF;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sh-apply-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
        }
        .sh-apply-btn:active {
          transform: translateY(0);
        }
        .sh-expired-btn {
          background-color: ${isLight ? '#E2E8F0' : '#334155'};
          color: ${isLight ? '#64748B' : '#94A3B8'};
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: not-allowed;
        }
        .pulse-dot {
          width: 8px;
          height: 8px;
          background-color: #22C55E;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          animation: pulse 1.6s infinite;
        }
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }
      `}</style>

      {/* FLOATING COLLAPSIBLE US LIVE CLOCKS (Hangs on Left Side of Page, Below Header) */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: '110px',
        zIndex: 2000,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start'
      }}>
        {!clocksExpanded ? (
          <button
            onClick={() => setClocksExpanded(true)}
            style={{
              backgroundColor: '#2563EB',
              color: '#FFF',
              border: 'none',
              borderRadius: '0 8px 8px 0',
              padding: '10px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.35)',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
          >
            🇺🇸 US Clocks 🕒 ▶
          </button>
        ) : (
          <div style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderLeft: 'none',
            borderRadius: '0 12px 12px 0',
            padding: '12px 14px',
            width: '180px',
            boxShadow: theme.shadow,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            animation: 'slideIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}`, paddingBottom: 6 }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: theme.textPrimary, display: 'flex', alignItems: 'center', gap: 4 }}>
                🇺🇸 US Clocks
              </span>
              <button
                onClick={() => setClocksExpanded(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.textSecondary,
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: 4,
                  backgroundColor: isLight ? '#F1F5F9' : '#0F172A'
                }}
              >
                ◀ Hide
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'EDT/EST', name: 'Eastern', tz: 'America/New_York', color: '#eff6ff', textColor: '#1d4ed8', border: '#bfdbfe' },
                { label: 'CDT/CST', name: 'Central', tz: 'America/Chicago', color: '#f5f3ff', textColor: '#6d28d9', border: '#ddd6fe' },
                { label: 'MDT/MST', name: 'Mountain', tz: 'America/Denver', color: '#fffbeb', textColor: '#b45309', border: '#fde68a' },
                { label: 'PDT/PST', name: 'Pacific', tz: 'America/Los_Angeles', color: '#f0fdf4', textColor: '#16a34a', border: '#bbf7d0' }
              ].map((zone) => {
                const live = formatLiveTime(zone.tz)
                return (
                  <div key={zone.label} style={{
                    backgroundColor: isLight ? zone.color : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isLight ? zone.border : theme.border}`,
                    borderRadius: 6,
                    padding: '6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: isLight ? zone.textColor : theme.textPrimary }}>{zone.label}</span>
                      <span style={{ fontSize: '9px', color: theme.textSecondary }}>{zone.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 1 }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 900, color: theme.textPrimary, fontFamily: 'monospace' }}>{live.time}</span>
                      <span style={{ fontSize: '9px', color: theme.textSecondary }}>{live.date.split(', ')[1]}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Navbar with SmartHire Brand */}
      <header style={{
        backgroundColor: theme.headerBg,
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : '0 2px 10px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 800,
            color: '#FFF',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}>
            ⚡
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: theme.textPrimary }}>
              SmartHire <span style={{ color: '#2563EB', fontSize: 13, fontWeight: 700 }}>CAREERS</span>
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: theme.textSecondary }}>Direct Candidate Job Portal</p>
          </div>
        </div>

        {/* Header Navigation & Light/Dark Theme Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, fontWeight: 600 }}>
          {candidateUser ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              backgroundColor: isLight ? '#EFF6FF' : 'rgba(37,99,235,0.15)',
              border: `1px solid ${isLight ? 'rgba(37,99,235,0.2)' : 'rgba(147,197,253,0.2)'}`,
              borderRadius: 20, padding: '4px 12px 4px 6px'
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                backgroundColor: '#2563EB', color: '#FFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800
              }}>
                {(candidateUser.name || 'C')[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary }}>
                {candidateUser.name}
              </span>
              <button
                onClick={handleCandidateSignOut}
                title="Sign Out"
                style={{
                  background: 'none', border: 'none', color: theme.textSecondary,
                  fontSize: 11, cursor: 'pointer', padding: '2px 4px', marginLeft: 2
                }}
              >
                (Sign Out)
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                backgroundColor: isLight ? '#EFF6FF' : 'rgba(37,99,235,0.15)',
                color: '#2563EB',
                border: '1px solid rgba(37,99,235,0.3)',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              🔑 Candidate Sign In
            </button>
          )}

          <button
            onClick={() => setThemeMode(isLight ? 'dark' : 'light')}
            style={{
              backgroundColor: isLight ? '#E2E8F0' : '#1E293B',
              color: isLight ? '#0F172A' : '#F1F5F9',
              border: `1px solid ${theme.border}`,
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease'
            }}
          >
            {isLight ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('jobs-list')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              backgroundColor: '#2563EB',
              backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
              color: '#FFF',
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
          >
            ⚡ View {jobs.length} Vacancies
          </button>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section style={{
        padding: '44px 24px 26px',
        textAlign: 'center',
        background: isLight 
          ? 'radial-gradient(ellipse at top, rgba(37, 99, 235, 0.06) 0%, rgba(248, 250, 252, 0) 70%)'
          : 'radial-gradient(ellipse at top, rgba(37, 99, 235, 0.16) 0%, rgba(11, 15, 23, 0) 70%)',
        maxWidth: 1000,
        margin: '0 auto'
      }}>
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#2563EB',
          backgroundColor: isLight ? '#EFF6FF' : 'rgba(37, 99, 235, 0.15)',
          border: '1px solid #BFDBFE',
          padding: '4px 14px',
          borderRadius: 20,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          ✨ Direct Candidate Applications
        </span>
        <h2 style={{ fontSize: 32, fontWeight: 800, margin: '16px 0 10px', color: theme.textPrimary, lineHeight: 1.25 }}>
          Explore Vacancies & Apply Direct
        </h2>
        <p style={{ fontSize: 15, color: theme.textSecondary, maxWidth: 660, margin: '0 auto 24px', lineHeight: 1.6 }}>
          Submit your resume for C2C, W2, or 1099 contracts. Direct candidate submissions are immediately delivered to our recruiting team.
        </p>

        {/* Search & Filter Bar */}
        <div className="sh-search-container" style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: 14,
          padding: 8,
          display: 'flex',
          gap: 10,
          maxWidth: 780,
          margin: '0 auto',
          boxShadow: theme.shadow,
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '2 1 240px', display: 'flex', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 8, padding: '0 14px' }}>
            <span style={{ fontSize: 16, marginRight: 8 }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title, skill, location (e.g. DevOps, Texas)..."
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                color: theme.textPrimary,
                padding: '12px 0',
                fontSize: 14,
                outline: 'none'
              }}
            />
          </div>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            style={{
              flex: '1 1 140px',
              backgroundColor: theme.inputBg,
              border: `1px solid ${theme.inputBorder}`,
              color: theme.textPrimary,
              borderRadius: 8,
              padding: '0 14px',
              fontSize: 13,
              fontWeight: 600,
              outline: 'none'
            }}
          >
            <option value="All">🌐 All Work Modes</option>
            <option value="Remote">🏠 Remote Only</option>
            <option value="Hybrid">🏢 Hybrid</option>
            <option value="Onsite">📍 Onsite</option>
          </select>
        </div>
      </section>

      {/* Main Content: Jobs Grid */}
      <section id="jobs-list" style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: theme.textPrimary }}>
            Active Vacancies <span style={{ fontSize: 13, color: theme.textSecondary, fontWeight: 500 }}>({filteredJobs.length} open)</span>
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: theme.textSecondary }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚡</div>
            <p>Loading active vacancies...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{
            backgroundColor: theme.cardBg,
            border: `1px dashed ${theme.border}`,
            borderRadius: 16,
            padding: '50px 20px',
            textAlign: 'center',
            color: theme.textSecondary
          }}>
            <p style={{ fontSize: 15, margin: '0 0 10px' }}>No active vacancies match "{searchQuery}".</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedLocation('All') }}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #2563EB',
                color: '#2563EB',
                borderRadius: 8,
                padding: '6px 16px',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 20
          }}>
            {filteredJobs.map((job) => {
              const expired = isJobExpired(job)
              const isBriefExpanded = expandedBriefJobId === job.id
              const workModeText = job.work_mode || job.workMode || job.type || 'Onsite'
              const locationText = job.location || 'Remote, US'
              const fullDesc = getFullDescriptionText(job)

              return (
                <div
                  key={job.id}
                  className={`sh-job-card ${expired ? 'expired' : ''}`}
                >
                  <div>
                    {/* Header: Status and Deadline */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      {expired ? (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#DC2626',
                          backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          padding: '3px 10px',
                          borderRadius: 12,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          🔒 Closed
                        </span>
                      ) : (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#16A34A',
                          backgroundColor: isLight ? '#DCFCE7' : 'rgba(22, 163, 74, 0.12)',
                          border: '1px solid rgba(22, 163, 74, 0.2)',
                          padding: '3px 10px',
                          borderRadius: 12,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}>
                          <span className="pulse-dot" /> Active Opening
                        </span>
                      )}
                      
                      {job.deadline && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: expired ? '#94A3B8' : '#D97706',
                          backgroundColor: expired ? (isLight ? '#F1F5F9' : '#1E293B') : (isLight ? '#FEF3C7' : 'rgba(217, 119, 6, 0.12)'),
                          padding: '3px 9px',
                          borderRadius: 6
                        }}>
                          ⏰ Deadline: {job.deadline}
                        </span>
                      )}
                    </div>

                    {/* Job Timezone Dates */}
                    {(() => {
                      const tzTimes = getJobPostTimezones(job)
                      return (
                        <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4, background: isLight ? '#f8fafc' : '#1e293b', border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`, borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: isLight ? '#475569' : '#cbd5e1' }}>
                            <span>📅 <strong>EST:</strong> {tzTimes.EST}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between', fontSize: 10, color: isLight ? '#64748b' : '#94a3b8', borderTop: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`, paddingTop: 4, marginTop: 2 }}>
                            <span title="Central Time">CST: {tzTimes.CST.split(' at ')[1]}</span>
                            <span title="Mountain Time">MST: {tzTimes.MST.split(' at ')[1]}</span>
                            <span title="Pacific Time">PST: {tzTimes.PST.split(' at ')[1]}</span>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Job Title */}
                    <h4 className="sh-job-title">
                      {job.title}
                    </h4>

                    {/* Metadata Items */}
                    <div className="sh-metadata-container">
                      <span className="sh-metadata-item">
                        🏢 {workModeText === 'Remote' ? 'Remote' : workModeText === 'Hybrid' ? 'Hybrid' : 'Onsite'}
                      </span>
                      {job.location && !['onsite', 'on site', 'on-site', 'hybrid', 'remote', 'tbd', 'any'].includes(job.location.toLowerCase().trim()) && (
                        <>
                          <span className="sh-metadata-divider" />
                          <span className="sh-metadata-item">
                            📍 {job.location}
                          </span>
                        </>
                      )}
                      {job.experience && job.experience !== 'TBD' && job.experience !== 'Any' && (
                        <>
                          <span className="sh-metadata-divider" />
                          <span className="sh-metadata-item">
                            ⏳ {job.experience}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Skills pills */}
                    {job.skills && job.skills.length > 0 && (
                      <div className="sh-skills-container">
                        {job.skills.slice(0, 4).map((s, idx) => (
                          <span key={idx} className="sh-skill-pill">
                            {s}
                          </span>
                        ))}
                        {job.skills.length > 4 && (
                          <span className="sh-skill-pill" style={{ opacity: 0.8 }}>
                            +{job.skills.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Minimal Job Description Snippet */}
                    <div className="sh-jd-box">
                      <div className="sh-jd-header">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>📝 Job Description</span>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedBriefJobId(isBriefExpanded ? null : job.id)
                            }}
                            style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                          >
                            {isBriefExpanded ? '▲ Collapse' : '▼ Read Inline'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setFullJdModalJob(job)
                            }}
                            style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                          >
                            📖 Full JD ↗
                          </button>
                        </div>
                      </div>
                      <div style={{ whiteSpace: isBriefExpanded ? 'pre-wrap' : 'normal' }}>
                        {isBriefExpanded 
                          ? fullDesc
                          : (fullDesc.substring(0, 120) + '...')}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="sh-card-footer">
                    <span style={{ fontSize: 12.5, color: theme.textSecondary, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      💼 <strong style={{ color: theme.textPrimary, fontWeight: 600 }}>{job.employment_type || job.type || 'Contract'}</strong>
                    </span>

                    {appliedJobs[job.id] ? (
                      <button
                        onClick={() => {
                          const app = appliedJobs[job.id]
                          setActiveChatCandidate({
                            id: app.candidateId || app.sessionId,
                            sessionId: app.sessionId,
                            name: app.candidateName,
                            candidateName: app.candidateName,
                            email: app.candidateEmail,
                            jobTitle: job.title
                          })
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #059669, #10B981)',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 16px',
                          fontSize: 13,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                          fontFamily: 'inherit'
                        }}
                      >
                        💬 Message Recruiter
                      </button>
                    ) : expired ? (
                      <button disabled className="sh-expired-btn">
                        🔒 Closed
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApplyClick(job)}
                        className="sh-apply-btn"
                      >
                        ⚡ Apply Direct
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* CANDIDATE FULL JD READER MODAL */}
      {fullJdModalJob && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setFullJdModalJob(null)}>
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 16, width: '100%', maxWidth: 740, maxHeight: '88vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: theme.textPrimary }}>{fullJdModalJob.title}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#2563EB', fontWeight: 700 }}>📍 {fullJdModalJob.location || 'Remote, US'} · {fullJdModalJob.work_mode || 'Onsite'}</p>
              </div>
              <button onClick={() => setFullJdModalJob(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: theme.textSecondary, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              <span style={{ fontSize: 12, backgroundColor: theme.inputBg, color: theme.textSecondary, padding: '5px 12px', borderRadius: 6 }}>📍 Location: <strong>{fullJdModalJob.location || 'Remote, US'}</strong></span>
              <span style={{ fontSize: 12, backgroundColor: theme.inputBg, color: theme.textSecondary, padding: '5px 12px', borderRadius: 6 }}>⏳ Experience: <strong>{formatExperience(fullJdModalJob.experience)}</strong></span>
              <span style={{ fontSize: 12, backgroundColor: theme.inputBg, color: theme.textSecondary, padding: '5px 12px', borderRadius: 6 }}>🏢 Mode: <strong>{fullJdModalJob.work_mode || 'Onsite'}</strong></span>
              <span style={{ fontSize: 12, backgroundColor: theme.inputBg, color: theme.textSecondary, padding: '5px 12px', borderRadius: 6 }}>📋 Type: <strong>{fullJdModalJob.employment_type || fullJdModalJob.type || 'Contract'}</strong></span>
            </div>

            {/* Skills */}
            {Array.isArray(fullJdModalJob.skills) && fullJdModalJob.skills.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>Required Technical Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {fullJdModalJob.skills.map(s => (
                    <span key={s} style={{ fontSize: 12, fontWeight: 600, backgroundColor: theme.tagBg, color: theme.tagText, border: '1px solid rgba(37,99,235,0.2)', padding: '3px 10px', borderRadius: 6 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ backgroundColor: theme.inputBg, borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: theme.textPrimary, textTransform: 'uppercase' }}>📝 Full Job Description</h4>
              <div style={{ fontSize: 13.5, color: theme.textSecondary, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {getFullDescriptionText(fullJdModalJob)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setFullJdModalJob(null)} style={{ backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.textSecondary, borderRadius: 8, padding: '10px 18px', fontSize: 13, cursor: 'pointer' }}>Close</button>
              <button onClick={() => { const jobToApply = fullJdModalJob; setFullJdModalJob(null); openApplicationModal(jobToApply); }}
                style={{ backgroundColor: '#2563EB', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                ⚡ Apply Direct Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE APPLICATION MODAL */}
      {selectedJob && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            width: '100%',
            maxWidth: 680,
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: 28,
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            animation: 'scaleIn 0.2s ease-out'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 21, fontWeight: 800, color: theme.textPrimary, margin: '3px 0 0' }}>
                  {selectedJob.title}
                </h3>
                <p style={{ fontSize: 12, color: '#2563EB', margin: '2px 0 0', fontWeight: 700 }}>
                  📍 {selectedJob.location || 'Remote, US'} · {selectedJob.work_mode || 'Onsite'}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: theme.textSecondary, fontSize: 22, cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            {/* IF APPLICATION SUBMITTED */}
            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#16A34A', fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  ✓
                </div>
                <h4 style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, margin: '0 0 8px' }}>
                  🎉 Application Submitted Successfully!
                </h4>
                <p style={{ fontSize: 14, color: theme.textSecondary, maxWidth: 500, margin: '0 auto 20px', lineHeight: 1.6 }}>
                  Thank you <strong>{submitSuccess.candidateName || candidateName}</strong>! Your application for <strong>{submitSuccess.jobTitle}</strong> has been received and delivered to our recruiting team.
                </p>
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <button
                  onClick={() => {
                    const app = submitSuccess.appRecord
                    setSelectedJob(null)
                    setSubmitSuccess(null)
                    if (app) {
                      setActiveChatCandidate({
                        id: app.candidateId || app.sessionId,
                        sessionId: app.sessionId,
                        name: app.candidateName,
                        candidateName: app.candidateName,
                        email: app.candidateEmail,
                        jobTitle: selectedJob.title
                      })
                    }
                  }}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 18px',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)'
                  }}
                >
                  💬 Message Recruiter Now
                </button>
                <button
                  onClick={() => { setSelectedJob(null); setSubmitSuccess(null); }}
                  style={{
                    background: theme.inputBg,
                    color: theme.textPrimary,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    padding: '12px 18px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Close Window
                </button>
              </div>
              </div>
            ) : (
              /* FORM STATE */
              <>
                {/* Error banner */}
                {submitError && (
                  <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                    ⚠️ {submitError}
                  </div>
                )}

                {/* STEP 1: FIRST ATTACH RESUME FOR AUTO-PARSING */}
                <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 16, marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 800, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>📄 Step 1: Upload Your Resume First (Auto-Fills Form)</span>
                    </label>
                    {isParsingResume && (
                      <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 700 }}>⏳ Extracting details...</span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: '#3B82F6', margin: '0 0 10px 0' }}>
                    Attach your resume (.pdf, .docx, .txt). Your Name, Email, Phone, & Location will auto-populate below!
                  </p>

                  <div style={{
                    backgroundColor: '#FFFFFF',
                    border: `2px dashed ${resumeFile ? '#16A34A' : '#93C5FD'}`,
                    borderRadius: 10,
                    padding: 14,
                    textAlign: 'center',
                    position: 'relative',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={handleFileChange}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                    {resumeFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#16A34A', fontWeight: 700, fontSize: 13 }}>
                        <span>📄 {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setResumeFile(null); setResumeText(''); setCandidateName(''); setAutoFillSuccess(false); }}
                          style={{ backgroundColor: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div style={{ color: '#1E40AF', fontSize: 13 }}>
                        <span style={{ fontSize: 22, display: 'block', marginBottom: 2 }}>📎</span>
                        <strong>Click or Drag Resume File Here</strong> (.pdf, .docx, .txt)
                      </div>
                    )}
                  </div>

                  {autoFillSuccess && (
                    <div style={{ marginTop: 10, fontSize: 12, color: '#15803D', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>✨ Details auto-populated from resume! Review below.</span>
                    </div>
                  )}
                </div>

                {/* Candidate Form */}
                <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  
                  {/* Full Name */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="e.g. Francis Pribilovics"
                      style={{
                        width: '100%',
                        backgroundColor: theme.inputBg,
                        border: `1px solid ${theme.inputBorder}`,
                        color: theme.textPrimary,
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Email & Phone */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={candidateEmail}
                        onChange={(e) => setCandidateEmail(e.target.value)}
                        placeholder="john.smith@gmail.com"
                        style={{
                          width: '100%',
                          backgroundColor: theme.inputBg,
                          border: `1px solid ${theme.inputBorder}`,
                          color: theme.textPrimary,
                          borderRadius: 8,
                          padding: '10px 12px',
                          fontSize: 13,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={candidatePhone}
                        onChange={(e) => setCandidatePhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        style={{
                          width: '100%',
                          backgroundColor: theme.inputBg,
                          border: `1px solid ${theme.inputBorder}`,
                          color: theme.textPrimary,
                          borderRadius: 8,
                          padding: '10px 12px',
                          fontSize: 13,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Location & Relocation Preference */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>
                        Current Location *
                      </label>
                      <input
                        type="text"
                        required
                        value={currentLocation}
                        onChange={(e) => setCurrentLocation(e.target.value)}
                        placeholder="e.g. Dallas, TX"
                        style={{
                          width: '100%',
                          backgroundColor: theme.inputBg,
                          border: `1px solid ${theme.inputBorder}`,
                          color: theme.textPrimary,
                          borderRadius: 8,
                          padding: '10px 12px',
                          fontSize: 13,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>
                        Ready to Relocate?
                      </label>
                      <select
                        value={relocatePref}
                        onChange={(e) => setRelocatePref(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: theme.inputBg,
                          border: `1px solid ${theme.inputBorder}`,
                          color: theme.textPrimary,
                          borderRadius: 8,
                          padding: '10px 12px',
                          fontSize: 13,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="Yes">Yes, open to relocate</option>
                        <option value="No">No, local / remote only</option>
                        <option value="Hybrid">Hybrid / Open to Travel</option>
                      </select>
                    </div>
                  </div>

                  {/* Contract Type & Visa Status */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>
                        Employment Contract Type
                      </label>
                      <select
                        value={contractType}
                        onChange={(e) => setContractType(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: theme.inputBg,
                          border: `1px solid ${theme.inputBorder}`,
                          color: theme.textPrimary,
                          borderRadius: 8,
                          padding: '10px 12px',
                          fontSize: 13,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="C2C">C2C (Corp-to-Corp)</option>
                        <option value="W2">W2 (Direct W2)</option>
                        <option value="1099">1099 Independent Contractor</option>
                        <option value="C2C or W2">Open to C2C or W2</option>
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>
                        Visa / Work Authorization
                      </label>
                      <select
                        value={visaStatus}
                        onChange={(e) => setVisaStatus(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: theme.inputBg,
                          border: `1px solid ${theme.inputBorder}`,
                          color: theme.textPrimary,
                          borderRadius: 8,
                          padding: '10px 12px',
                          fontSize: 13,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="US Citizen">US Citizen</option>
                        <option value="Green Card">Green Card (PR)</option>
                        <option value="H1B">H1B Visa</option>
                        <option value="EAD / OPT">EAD / OPT</option>
                        <option value="C2C Vendor Candidate">C2C Vendor Candidate</option>
                        <option value="TN Visa">TN Visa</option>
                      </select>
                    </div>
                  </div>

                  {/* Expected Rate */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>
                      Expected Hourly Rate ($/hr)
                    </label>
                    <input
                      type="number"
                      value={expectedRate}
                      onChange={(e) => setExpectedRate(e.target.value)}
                      placeholder="e.g. 70"
                      style={{
                        width: '100%',
                        backgroundColor: theme.inputBg,
                        border: `1px solid ${theme.inputBorder}`,
                        color: theme.textPrimary,
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Details Verification Checkmark */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 4, marginBottom: 8 }}>
                    <input
                      type="checkbox"
                      id="detailsVerified"
                      required
                      checked={detailsVerified}
                      onChange={(e) => setDetailsVerified(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer', marginTop: 1 }}
                    />
                    <label htmlFor="detailsVerified" style={{ fontSize: 12.5, fontWeight: 700, color: theme.textSecondary, cursor: 'pointer', lineHeight: 1.4 }}>
                      ✓ I confirm that the details parsed from my resume are correct and verified.
                    </label>
                  </div>

                  {/* Submit Action */}
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      marginTop: 8,
                      backgroundColor: '#2563EB',
                      backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '14px',
                      fontSize: 15,
                      fontWeight: 800,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    {submitting ? '⚡ Submitting Application...' : '🚀 Submit Direct Application'}
                  </button>

                  <p style={{ fontSize: 11, color: theme.textSecondary, textAlign: 'center', margin: 0 }}>
                    Your application will be submitted directly to our recruiting team.
                  </p>
                </form>
              </>
            )}

          </div>
        </div>
      )}


      {/* CANDIDATE GOOGLE SIGN IN MODAL */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 4000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 18,
            width: '100%',
            maxWidth: 440,
            padding: 28,
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
            textAlign: 'center'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              backgroundColor: '#EFF6FF', color: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, margin: '0 auto 16px'
            }}>
              🔑
            </div>
            
            <h3 style={{ fontSize: 20, fontWeight: 800, color: theme.textPrimary, margin: '0 0 6px' }}>
              Candidate Sign-In Required
            </h3>
            <p style={{ fontSize: 13.5, color: theme.textSecondary, margin: '0 0 20px', lineHeight: 1.5 }}>
              Please sign in to submit your application for <strong>{targetJobForLogin?.title || 'this position'}</strong>.
            </p>

            {/* Google 1-Click Sign-In */}
            <button
              onClick={async () => {
                try {
                  const user = await loginWithGoogle()
                  const candidateUserObj = {
                    uid: user.uid,
                    name: user.name || user.email.split('@')[0],
                    email: user.email,
                    avatar: user.photoURL || 'https://lh3.googleusercontent.com/a/default-user',
                    provider: 'google'
                  }
                  handleCandidateLogin(candidateUserObj)
                } catch (err) {
                  console.error('Candidate Google Login Error:', err)
                  alert('Login failed: ' + err.message)
                }
              }}
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                color: '#1E293B',
                border: '1px solid #CBD5E1',
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                marginBottom: 16,
                fontFamily: 'inherit'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Sign In with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', color: theme.textSecondary, fontSize: 12 }}>
              <div style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
              <span style={{ padding: '0 10px' }}>OR</span>
              <div style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
            </div>

            {/* Email Candidate Login Form */}
            <div style={{ textAlign: 'left', marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>Your Full Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={loginName}
                onChange={e => setLoginName(e.target.value)}
                style={{ width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary, borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ textAlign: 'left', marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>Your Email Address</label>
              <input
                type="email"
                placeholder="e.g. john@example.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                style={{ width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary, borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              disabled={!loginEmail.trim() || !loginName.trim()}
              onClick={() => {
                handleCandidateLogin({
                  name: loginName.trim(),
                  email: loginEmail.trim(),
                  provider: 'email'
                })
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                color: '#FFF',
                border: 'none',
                borderRadius: 10,
                padding: '11px 16px',
                fontSize: 14,
                fontWeight: 800,
                cursor: (!loginEmail.trim() || !loginName.trim()) ? 'not-allowed' : 'pointer',
                opacity: (!loginEmail.trim() || !loginName.trim()) ? 0.5 : 1,
                fontFamily: 'inherit'
              }}
            >
              Continue to Application →
            </button>

            <button
              onClick={() => setShowLoginModal(false)}
              style={{ background: 'none', border: 'none', color: theme.textSecondary, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', marginTop: 14 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 1-ON-1 RECRUITER CHAT WIDGET (for candidates who applied) */}
      {activeChatCandidate && (
        <CandidateMessengerWidget
          candidate={activeChatCandidate}
          role="candidate"
          onClose={() => setActiveChatCandidate(null)}
        />
      )}

      {/* FLOATING AI CAREER BOT WIDGET */}
      {chatEnabled && (
        <>
          {botWidgetOpen ? (
            <SmartHireBotWidget
              jobs={jobs}
              onClose={() => setBotWidgetOpen(false)}
            />
          ) : (
            <button
              onClick={() => setBotWidgetOpen(true)}
              style={{
                position: 'fixed',
                bottom: 24,
                right: 28,
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                border: '1px solid #334155',
                borderRadius: 30,
                padding: '12px 20px',
                fontSize: 13.5,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.4)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'transform 0.2s, boxShadow 0.2s',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: 16 }}>🤖</span>
              AI Career Assistant
            </button>
          )}
        </>
      )}
    </div>
  )
}
