import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CandidateMessengerWidget from '../components/CandidateMessengerWidget'
import SmartHireBotWidget from '../components/SmartHireBotWidget'
import { saveCareerApplication, getAtsJobs } from '../lib/atsFirestore'
import { formatJobDescription, resolveJobLocation, cleanJobTitleWithPositionNumber } from '../utils/formatJobDescription'

export default function PublicCareers() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const targetJobId = searchParams.get('jobId') || searchParams.get('job')

  const ALL_SMARTHIRE_RECRUITERS = [
    { name: 'Omkesh Manjute', email: 'omkesh.manjute@smarthire.com', refCode: 'omkesh', role: 'Super Admin' },
    { name: 'Vaibhav Bisen', email: 'vaibhav.bisen@smarthire.com', refCode: 'vaibhav-bisen', role: 'Lead Recruiter' },
    { name: 'Sukamal Chatterjee', email: 'sukamal.c@smarthire.com', refCode: 'sukamal-chatterjee', role: 'Senior Recruiter' },
    { name: 'Prudhvi Sevveti', email: 'prudhvi.s@smarthire.com', refCode: 'prudhvi-sevveti', role: 'Recruiter' },
    { name: 'Nitin Bhosale', email: 'nitin.b@smarthire.com', refCode: 'nitin-bhosale', role: 'Recruiter' },
    { name: 'Naveen Korimelli', email: 'naveen.k@smarthire.com', refCode: 'naveen-korimelli', role: 'Recruiter' },
    { name: 'Ajay Arya', email: 'ajay.a@smarthire.com', refCode: 'ajay-arya', role: 'Recruiter' },
    { name: 'Raj Barve', email: 'raj.b@smarthire.com', refCode: 'raj-barve', role: 'Recruiter' },
    { name: 'Pankaj Maharwade', email: 'pankaj.m@smarthire.com', refCode: 'pankaj-maharwade', role: 'Senior Recruiter' },
    { name: 'Nishant Kathane', email: 'nishant.k@smarthire.com', refCode: 'nishant-kathane', role: 'Recruiter' }
  ]

  const resolveRecruiterFromRef = (refCode) => {
    if (!refCode) return null
    const clean = String(refCode).toLowerCase().trim()
    return ALL_SMARTHIRE_RECRUITERS.find(r => 
      r.refCode.toLowerCase() === clean || 
      r.name.toLowerCase().replace(/[^a-z0-9]/g, '-').includes(clean) ||
      clean.includes(r.refCode.toLowerCase())
    ) || { name: refCode.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), email: `${clean}@smarthire.com`, refCode: clean }
  }

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

  // Capture referral parameter from URL (e.g. ?ref=vaibhav-bisen)
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
  const [deadlineFilter, setDeadlineFilter] = useState('All')
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
  const [parsedSkills, setParsedSkills] = useState([])

  // Full JD Reader Modal State
  const [fullJdModalJob, setFullJdModalJob] = useState(null)

  // Submit State & Result
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(null)

  // Theme Palette (Zoho ATS + PraxiMinds Executive Canvas)
  const isLight = themeMode === 'light'
  const theme = {
    bg: isLight ? '#FAFBFD' : '#080C14',
    gridLine: isLight ? 'rgba(100, 116, 139, 0.12)' : 'rgba(255, 255, 255, 0.06)',
    cardBg: isLight ? '#FFFFFF' : '#111827',
    headerBg: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(8, 12, 20, 0.92)',
    textPrimary: isLight ? '#0F172A' : '#F8FAFC',
    textSecondary: isLight ? '#475569' : '#94A3B8',
    border: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)',
    cardBorder: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.09)',
    inputBg: isLight ? '#FFFFFF' : '#0F172A',
    inputBorder: isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.12)',
    accent: '#2563EB',
    accentHover: '#1D4ED8',
    brandOrange: '#FF6B00',
    purple: '#7C3AED',
    tagBg: isLight ? '#F8FAFC' : 'rgba(37, 99, 235, 0.12)',
    tagText: isLight ? '#334155' : '#93C5FD',
    cardShadow: isLight ? '0 2px 8px -2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.03)' : '0 10px 30px rgba(0, 0, 0, 0.4)',
    cardHoverShadow: isLight ? '0 14px 30px -4px rgba(37, 99, 235, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)' : '0 20px 40px rgba(0, 0, 0, 0.6)'
  }

  // Hero Background Carousel Slides (Ultra-sharp 100% in-focus images + preserved previous scenes)
  const HERO_SLIDES = [
    {
      id: 1,
      image: '/career-hero-slide1.jpg',
      label: 'Corporate Tech HQ',
      caption: 'Direct Enterprise & State Contracts'
    },
    {
      id: 2,
      image: '/career-hero-slide2.jpg',
      label: 'Executive Boardroom',
      caption: 'Direct Client Boardroom & Strategic Roles'
    },
    {
      id: 3,
      image: '/career-hero-slide3.jpg',
      label: 'Cloud Engineering Center',
      caption: 'Cloud, Data Systems & Tech Innovation'
    },
    {
      id: 4,
      image: '/career-hero-prev-slide1.jpg',
      label: 'Digital Constellation Hub',
      caption: 'High-Impact Consulting & Systems Architecture'
    }
  ]

  const [heroMediaMode, setHeroMediaMode] = useState('video') // 'video' | 'slides'
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0)
  const [isSliderHovered, setIsSliderHovered] = useState(false)

  // Auto-play slider with hover pause when in slides mode
  useEffect(() => {
    if (isSliderHovered || heroMediaMode !== 'slides') return
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isSliderHovered, heroMediaMode, HERO_SLIDES.length])

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
    const raw = job.rawDescription || job.fullDescription || job.rawText || job.details || job.rawJd || job.description
    if (raw && typeof raw === 'string' && raw.length > 30) {
      return formatJobDescription(raw, job)
    }
    return formatJobDescription('', job)
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
      if (data.success && Array.isArray(data.jobs) && data.jobs.length > 0) {
        setJobs(data.jobs)
        
        if (targetJobId) {
          const cleanTarget = String(targetJobId).replace('J-', '')
          const match = data.jobs.find(j => 
            j.id === targetJobId || 
            String(j.id).replace('J-', '') === cleanTarget ||
            j.id === `J-${cleanTarget}`
          )
          if (match) openApplicationModal(match)
        }
        setLoading(false)
        return
      }
    } catch (e) {
      console.warn('Backend /api/jobs asleep/unavailable, loading from Firebase Firestore...', e)
    }

    // Fallback: Load directly from Firebase Firestore (Always online, 0 sleep)
    try {
      const firestoreJobs = await getAtsJobs()
      if (firestoreJobs && firestoreJobs.length > 0) {
        setJobs(firestoreJobs)
        if (targetJobId) {
          const cleanTarget = String(targetJobId).replace('J-', '')
          const match = firestoreJobs.find(j => 
            j.id === targetJobId || 
            String(j.id).replace('J-', '') === cleanTarget ||
            j.id === `J-${cleanTarget}`
          )
          if (match) openApplicationModal(match)
        }
      }
    } catch (fErr) {
      console.error('Failed to fetch jobs from Firestore:', fErr)
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
    setParsedSkills([])
  }

  // Resume Upload Handler with Smart Name & Details Auto-Parsing
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setResumeFile(file)
    setIsParsingResume(true)
    setAutoFillSuccess(false)
    setParsedSkills([])
    setSubmitError('')

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      if (result.success && result.profile) {
        const p = result.profile
        let rawExtractedName = (p.name || '').trim()
        if (!rawExtractedName || rawExtractedName.toUpperCase() === 'PDF') {
          rawExtractedName = cleanNameFromFileName(file.name)
        }
        if (rawExtractedName && rawExtractedName.toUpperCase() !== 'PDF') setCandidateName(rawExtractedName)
        if (p.email) setCandidateEmail(p.email)
        if (p.phone) setCandidatePhone(p.phone)
        if (p.location) setCurrentLocation(p.location)
        if (Array.isArray(p.skills) && p.skills.length > 0) setParsedSkills(p.skills)
        if (p.resumeText) setResumeText(p.resumeText)
        if (!rawExtractedName && file.name) {
          const fallback = cleanNameFromFileName(file.name)
          if (fallback && fallback.toUpperCase() !== 'PDF') setCandidateName(fallback)
        }
        if (p.email || p.phone || p.location || (rawExtractedName && rawExtractedName.toUpperCase() !== 'PDF')) {
          setAutoFillSuccess(true)
        }
      } else {
        if (file.name) {
          const fallback = cleanNameFromFileName(file.name)
          if (fallback && fallback.toUpperCase() !== 'PDF') setCandidateName(fallback)
        }
        const text = await file.text().catch(() => '')
        if (text && text.length > 50) {
          setResumeText(text)
          const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > 2 && l.length < 40).filter(l => !/%pdf|pdf|adobe|stream|obj|endobj|resume|cv|curriculum|vitae|page|email|phone|tel|http|www|@/i.test(l))
          for (const line of lines) {
            const words = line.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/)
            if (words.length >= 2 && words.length <= 3 && words.every(w => w.length >= 2 && /^[A-Z]/.test(w))) {
              const guessed = words.join(' ')
              if (guessed.toUpperCase() !== 'PDF') {
                setCandidateName(guessed)
                break
              }
            }
          }
        }
        if (result.email || result.phone || result.location || (result.name && result.name.toUpperCase() !== 'PDF')) {
          setAutoFillSuccess(true)
        }
      }
    } catch (err) {
      console.error('Resume parsing error:', err)
    } finally {
      setIsParsingResume(false)
    }
  }

  const isDeadlineToday = (deadlineStr) => {
    if (!deadlineStr) return false
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const todayISO = `${yyyy}-${mm}-${dd}`
    const clean = String(deadlineStr).trim()
    if (clean.includes(todayISO)) return true

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const mStr = months[now.getMonth()]
    if (clean.toLowerCase().includes(`${now.getDate()}-${mStr.toLowerCase()}`) || clean.toLowerCase().includes(`${mStr.toLowerCase()} ${now.getDate()}`)) return true

    const dl = new Date(deadlineStr)
    if (!isNaN(dl.getTime())) {
      return (
        dl.getFullYear() === now.getFullYear() &&
        dl.getMonth() === now.getMonth() &&
        dl.getDate() === now.getDate()
      )
    }
    return false
  }

  const filteredJobs = jobs.filter((j) => {
    if (isJobExpired(j)) return false
    const titleMatch = j.title?.toLowerCase().includes(searchQuery.toLowerCase())
    const skillMatch = Array.isArray(j.skills) && j.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    const locMatch = (resolveJobLocation(j) || 'Remote, US').toLowerCase().includes(searchQuery.toLowerCase())
    const qMatch = titleMatch || skillMatch || locMatch

    if ((deadlineFilter === 'Today' || selectedLocation === 'Today') && !isDeadlineToday(j.deadline)) return false

    if (selectedLocation === 'Remote') return qMatch && (j.location || 'Remote').toLowerCase().includes('remote')
    if (selectedLocation === 'Hybrid') return qMatch && (j.location || '').toLowerCase().includes('hybrid')
    if (selectedLocation === 'Onsite') return qMatch && ((j.location || '').toLowerCase().includes('onsite') || (j.location || '').toLowerCase().includes('on-site'))
    return qMatch
  })

  const activeOpenJobs = jobs.filter(j => !isJobExpired(j))
  const todayDeadlineCount = activeOpenJobs.filter(j => isDeadlineToday(j.deadline)).length
  const remoteCount = activeOpenJobs.filter(j => (j.location || j.work_mode || '').toLowerCase().includes('remote')).length
  const hybridCount = activeOpenJobs.filter(j => (j.location || j.work_mode || '').toLowerCase().includes('hybrid')).length
  const onsiteCount = activeOpenJobs.filter(j => (j.location || j.work_mode || '').toLowerCase().includes('onsite') || (j.location || j.work_mode || '').toLowerCase().includes('on site')).length

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
      const urlParams = new URLSearchParams(window.location.search)
      const recruiterRef = sessionStorage.getItem('smarthire_recruiter_ref') || localStorage.getItem('smarthire_recruiter_ref') || urlParams.get('ref') || urlParams.get('recruiter') || '';
      const activeRecruiter = resolveRecruiterFromRef(recruiterRef) || ALL_SMARTHIRE_RECRUITERS[0]
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
        if (recruiterRef) formData.append('recruiterRef', recruiterRef)
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
            recruiterRef,
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

        // Save into smarthire_careers_applications so it immediately reflects in Reports & Dashboard
        const newApp = {
          fName: parsedName.split(' ')[0] || parsedName,
          lName: parsedName.split(' ').slice(1).join(' ') || '',
          name: parsedName,
          email: candidateEmail.trim(),
          phone: candidatePhone.trim() || '—',
          canId: data.candidateId || String(Math.floor(10000 + Math.random() * 89999)),
          reqId: selectedJob.id.replace('J-', ''),
          jobId: selectedJob.id,
          jobTitle: selectedJob.title,
          appliedDate: new Date().toLocaleDateString('en-US') + ' ' + new Date().toLocaleTimeString('en-US'),
          status: 'Int-SubmittedToManager',
          rejectReason: '',
          comments: `Submitted from SmartHire Careers via ${activeRecruiter.name}`,
          recruiter: activeRecruiter.name,
          recruiterEmail: activeRecruiter.email,
          recruiterRef: activeRecruiter.refCode
        }

        try {
          const existingApps = JSON.parse(localStorage.getItem('smarthire_careers_applications') || '[]')
          localStorage.setItem('smarthire_careers_applications', JSON.stringify([newApp, ...existingApps]))
        } catch(e) {}

        // Save to Firebase Firestore & Storage (Guaranteed cloud persistence)
        try {
          await saveCareerApplication({
            ...newApp,
            currentLocation: currentLocation.trim(),
            relocatePref,
            contractType,
            visaStatus,
            expectedRate,
            resumeFileName: resumeFile?.name || 'Candidate_Resume.pdf',
            resumeText: resumeText || `${parsedName} applied for ${selectedJob.title}`
          }, resumeFile || resumeText)
        } catch(fireErr) {
          console.warn('Firebase saveCareerApplication note:', fireErr)
        }

        setSubmitSuccess({ ...data, candidateName: parsedName, appRecord, recruiterName: activeRecruiter.name })
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
    <div style={{
      backgroundColor: theme.bg,
      backgroundImage: `
        radial-gradient(circle at 82% 180px, rgba(255, 107, 0, ${isLight ? '0.07' : '0.04'}) 0%, rgba(255, 154, 60, 0.02) 40%, transparent 65%),
        radial-gradient(circle at 15% 140px, rgba(37, 99, 235, ${isLight ? '0.06' : '0.03'}) 0%, transparent 50%),
        linear-gradient(to right, ${theme.gridLine} 1px, transparent 1px),
        linear-gradient(to bottom, ${theme.gridLine} 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 100% 100%, 32px 32px, 32px 32px',
      backgroundRepeat: 'no-repeat, no-repeat, repeat, repeat',
      color: theme.textPrimary,
      minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      transition: 'background-color 0.2s, color 0.2s'
    }}>
      <style>{`
        .sh-search-container {
          transition: all 0.2s ease-in-out;
        }
        .sh-job-card {
          background-color: ${theme.cardBg};
          border: 1px solid ${theme.cardBorder};
          border-radius: 12px;
          padding: 20px 22px 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: ${theme.cardShadow};
          position: relative;
        }
        .sh-card-body {
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
        }
        .sh-job-card:hover {
          transform: translateY(-3px);
          box-shadow: ${theme.cardHoverShadow};
          border-color: ${isLight ? '#93C5FD' : 'rgba(147, 197, 253, 0.4)'};
        }
        .sh-job-card.expired {
          background-color: ${isLight ? '#F8FAFC' : '#0F172A'};
          border-color: ${isLight ? '#E2E8F0' : 'rgba(239, 68, 68, 0.2)'};
          opacity: 0.78;
        }
        .sh-job-card.expired:hover {
          transform: none;
          box-shadow: none;
          border-color: ${isLight ? '#E2E8F0' : 'rgba(239, 68, 68, 0.2)'};
        }
        .sh-job-title {
          font-size: 16.5px;
          font-weight: 700;
          color: ${theme.textPrimary};
          margin: 0 0 8px;
          line-height: 1.35;
          letter-spacing: -0.015em;
          transition: color 0.15s ease;
        }
        .sh-job-card:not(.expired):hover .sh-job-title {
          color: #2563EB;
        }
        .sh-metadata-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
          align-items: center;
        }
        .sh-metadata-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: ${theme.textSecondary};
          font-weight: 500;
        }
        .sh-metadata-divider {
          width: 3px;
          height: 3px;
          background-color: ${theme.border};
          border-radius: 50%;
        }
        .sh-skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 12px 0 14px;
        }
        .sh-skill-pill {
          font-size: 11px;
          font-weight: 700;
          background: ${isLight ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.8) 100%)' : 'linear-gradient(180deg, rgba(37, 99, 235, 0.2) 0%, rgba(37, 99, 235, 0.08) 100%)'};
          color: ${isLight ? '#1E293B' : '#93C5FD'};
          padding: 3px 10px;
          border-radius: 6px;
          transition: all 0.15s ease;
          border: 1px solid ${isLight ? 'rgba(203, 213, 225, 0.85)' : 'rgba(37, 99, 235, 0.3)'};
          border-bottom-color: ${isLight ? 'rgba(148, 163, 184, 0.8)' : 'rgba(0, 0, 0, 0.3)'};
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.9), 0 1px 2px rgba(0, 0, 0, 0.04);
          letter-spacing: 0.01em;
        }
        .sh-job-card:not(.expired):hover .sh-skill-pill {
          border-color: rgba(37, 99, 235, 0.4);
          background: ${isLight ? 'linear-gradient(180deg, #EFF6FF 0%, #DBEAFE 100%)' : 'linear-gradient(180deg, rgba(37, 99, 235, 0.35) 0%, rgba(37, 99, 235, 0.15) 100%)'};
          color: #1D4ED8;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.9), 0 2px 5px rgba(37, 99, 235, 0.15);
        }
        .sh-card-footer {
          border-top: 1px solid ${theme.border};
          padding-top: 14px;
          margin-top: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sh-apply-btn {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(0, 0, 0, 0.03) 51%, rgba(0, 0, 0, 0.14) 100%), #2563EB;
          color: #FFF;
          border: 1px solid rgba(255, 255, 255, 0.45);
          border-bottom-color: rgba(0, 0, 0, 0.35);
          border-radius: 8px;
          padding: 8px 18px;
          font-size: 12.5px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 4px 12px rgba(37, 99, 235, 0.38), 0 1px 2px rgba(0, 0, 0, 0.15);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
          letter-spacing: 0.02em;
        }
        .sh-apply-btn:hover {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(0, 0, 0, 0.02) 51%, rgba(0, 0, 0, 0.10) 100%), #1D4ED8;
          transform: translateY(-2px);
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.95), 0 6px 18px rgba(37, 99, 235, 0.5), 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .sh-view-btn {
          background: ${isLight ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.85) 50%, rgba(241, 245, 249, 0.95) 100%)' : 'linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)'};
          color: ${isLight ? '#1E293B' : '#F1F5F9'};
          border: 1px solid ${isLight ? 'rgba(203, 213, 225, 0.95)' : 'rgba(255, 255, 255, 0.2)'};
          border-bottom-color: ${isLight ? 'rgba(148, 163, 184, 0.85)' : 'rgba(0, 0, 0, 0.4)'};
          border-radius: 8px;
          padding: 7px 15px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          gap: 5px;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.9), 0 2px 5px rgba(15, 23, 42, 0.06);
        }
        .sh-view-btn:hover {
          background: ${isLight ? 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)' : 'linear-gradient(180deg, #334155 0%, #1E293B 100%)'};
          color: #2563EB;
          border-color: #93C5FD;
          transform: translateY(-2px);
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 1), 0 4px 12px rgba(37, 99, 235, 0.15);
        }
        .sh-expired-btn {
          background-color: ${isLight ? '#F1F5F9' : '#334155'};
          color: ${isLight ? '#94A3B8' : '#64748B'};
          border: none;
          border-radius: 7px;
          padding: 7px 14px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: not-allowed;
        }
        .pulse-dot {
          width: 7px;
          height: 7px;
          background-color: #22C55E;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          animation: pulse-green 2s infinite;
        }
        @keyframes pulse-green {
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
        @keyframes pulse-orange {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(255, 107, 0, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 6px rgba(255, 107, 0, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(255, 107, 0, 0);
          }
        }
      `}</style>

      {/* Enterprise Header with SmartHire Brand & Integrated Tools */}
      <header style={{
        backgroundColor: theme.headerBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '12px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.03)' : '0 1px 4px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            color: '#FFF'
          }}>
            💼
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: theme.textPrimary, letterSpacing: '-0.02em' }}>
                Smart<span style={{ color: '#FF6B00', textShadow: '0 0 12px rgba(255, 107, 0, 0.35)' }}>Hire</span>
              </h1>
              <span style={{
                color: '#2563EB',
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: isLight ? '#EFF6FF' : 'rgba(37, 99, 235, 0.15)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                borderRadius: 4,
                padding: '1px 6px',
                letterSpacing: '0.04em'
              }}>
                CAREERS
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: theme.textSecondary }}>Direct Candidate Job Portal</p>
          </div>
        </div>

        {/* Header Right Tools: Integrated US Live Clocks, Candidate Auth & Theme */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
          
          {/* Integrated US Clocks Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setClocksExpanded(!clocksExpanded)}
              style={{
                background: clocksExpanded 
                  ? (isLight ? 'linear-gradient(180deg, #EFF6FF 0%, #DBEAFE 100%)' : 'rgba(37,99,235,0.25)') 
                  : (isLight ? 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.85) 50%, rgba(241,245,249,0.95) 100%)' : 'rgba(30,41,59,0.9)'),
                color: clocksExpanded ? '#1D4ED8' : theme.textSecondary,
                border: `1px solid ${clocksExpanded ? '#93C5FD' : isLight ? 'rgba(203, 213, 225, 0.9)' : theme.border}`,
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.9), 0 2px 5px rgba(15, 23, 42, 0.05)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🕒</span>
              <span>US Clocks</span>
              <span style={{ fontSize: 9, opacity: 0.7 }}>{clocksExpanded ? '▲' : '▼'}</span>
            </button>

            {clocksExpanded && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                backgroundColor: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                padding: 12,
                width: 270,
                boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                zIndex: 2100,
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}`, paddingBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: theme.textPrimary, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    🇺🇸 US Live Timezones
                  </span>
                  <button
                    onClick={() => setClocksExpanded(false)}
                    style={{ background: 'none', border: 'none', color: theme.textSecondary, fontSize: 12, cursor: 'pointer', padding: 2 }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[
                    { label: 'EDT / EST', name: 'Eastern', tz: 'America/New_York', color: '#eff6ff', textColor: '#1d4ed8', border: '#bfdbfe' },
                    { label: 'CDT / CST', name: 'Central', tz: 'America/Chicago', color: '#f5f3ff', textColor: '#6d28d9', border: '#ddd6fe' },
                    { label: 'MDT / MST', name: 'Mountain', tz: 'America/Denver', color: '#fffbeb', textColor: '#b45309', border: '#fde68a' },
                    { label: 'PDT / PST', name: 'Pacific', tz: 'America/Los_Angeles', color: '#f0fdf4', textColor: '#16a34a', border: '#bbf7d0' }
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
                          <span style={{ fontSize: 10, fontWeight: 800, color: isLight ? zone.textColor : theme.textPrimary }}>{zone.label}</span>
                          <span style={{ fontSize: 9, color: theme.textSecondary }}>{zone.name}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: theme.textPrimary, fontFamily: 'monospace', marginTop: 2 }}>{live.time}</span>
                        <span style={{ fontSize: 9, color: theme.textSecondary }}>{live.date.split(', ')[1]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Candidate Auth */}
          {candidateUser ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              backgroundColor: isLight ? '#EFF6FF' : 'rgba(37,99,235,0.15)',
              border: `1px solid ${isLight ? '#BFDBFE' : 'rgba(147,197,253,0.2)'}`,
              borderRadius: 20, padding: '4px 10px 4px 6px'
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                backgroundColor: '#2563EB', color: '#FFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800
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
                background: 'linear-gradient(180deg, rgba(239,246,255,0.98) 0%, rgba(219,234,254,0.85) 50%, rgba(191,219,254,0.95) 100%)',
                color: '#1D4ED8',
                border: '1px solid rgba(147, 197, 253, 0.9)',
                borderBottomColor: 'rgba(59, 130, 246, 0.6)',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.9), 0 2px 6px rgba(37, 99, 235, 0.15)',
                transition: 'all 0.18s ease'
              }}
            >
              <span>🔑</span>
              <span>Candidate Sign In</span>
            </button>
          )}

          {/* ATS Portal Direct Link */}
          <button
            onClick={() => navigate('/ats')}
            title="Open Internal ATS Platform"
            style={{
              background: isLight 
                ? 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.85) 50%, rgba(241,245,249,0.95) 100%)' 
                : 'linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.9) 100%)',
              color: theme.textPrimary,
              border: `1px solid ${isLight ? 'rgba(203, 213, 225, 0.95)' : 'rgba(255,255,255,0.2)'}`,
              borderBottomColor: isLight ? 'rgba(148, 163, 184, 0.85)' : 'rgba(0,0,0,0.4)',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.9), 0 2px 6px rgba(15, 23, 42, 0.06)',
              transition: 'all 0.18s ease'
            }}
          >
            <span style={{ color: '#2563EB' }}>⚡</span>
            <span>ATS Portal</span>
            <span style={{ fontSize: 10, opacity: 0.6 }}>↗</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setThemeMode(isLight ? 'dark' : 'light')}
            style={{
              background: isLight 
                ? 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.85) 50%, rgba(241,245,249,0.95) 100%)' 
                : 'linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.9) 100%)',
              color: theme.textSecondary,
              border: `1px solid ${isLight ? 'rgba(203, 213, 225, 0.9)' : theme.border}`,
              borderRadius: 8,
              padding: '6px 11px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.85), 0 2px 5px rgba(15, 23, 42, 0.05)',
              transition: 'all 0.15s ease'
            }}
          >
            {isLight ? '🌙' : '☀️'}
          </button>

          {/* Quick Scroll Action */}
          <button
            onClick={() => {
              const el = document.getElementById('jobs-list')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(0, 0, 0, 0.03) 51%, rgba(0, 0, 0, 0.14) 100%), #2563EB',
              color: '#FFF',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              borderBottomColor: 'rgba(0, 0, 0, 0.35)',
              borderRadius: 8,
              padding: '7px 16px',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 3px 10px rgba(37, 99, 235, 0.35)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
              transition: 'all 0.18s ease'
            }}
          >
            ⚡ {jobs.length} Positions
          </button>
        </div>
      </header>

      {/* Executive Hero Section with Real Career Image Background Slider & PraxiMinds Grid Canvas */}
      <section 
        onMouseEnter={() => setIsSliderHovered(true)}
        onMouseLeave={() => setIsSliderHovered(false)}
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderBottom: `1px solid ${theme.border}`,
          padding: '52px 24px 46px',
          textAlign: 'center'
        }}
      >
        {/* Live Looping 1080p Video Background - 100% Crystal Clear, Zero Blur */}
        <div style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          zIndex: 0,
          pointerEvents: 'none',
          opacity: heroMediaMode === 'video' ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out'
        }}>
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/career-hero-slide1.jpg"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'translate(-50%, -50%)',
              filter: 'none'
            }}
          >
            <source src="/career-hero-video.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Real Workplace Background Image Carousel / Slider - 100% Crystal Clarity, Zero Blur */}
        <div style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          zIndex: 0,
          pointerEvents: 'none',
          opacity: heroMediaMode === 'slides' ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out'
        }}>
          {HERO_SLIDES.map((slide, idx) => {
            const isActive = currentHeroSlide === idx
            return (
              <div
                key={slide.id}
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url('${slide.image}')`,
                  backgroundPosition: 'center 35%',
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  opacity: isActive ? 1.0 : 0,
                  transform: isActive ? 'scale(1.02)' : 'scale(1.0)',
                  transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 7s ease-out',
                  filter: 'none',
                  willChange: 'opacity, transform'
                }}
              />
            )
          })}
        </div>

        {/* Ultra-Sharp Cinematic Contrast Layer - Zero Fog, Zero Blur, 100% Crisp Visual Depth */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(11, 15, 25, 0.72) 0%, rgba(11, 15, 25, 0.40) 38%, rgba(11, 15, 25, 0.75) 82%, rgba(11, 15, 25, 0.96) 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          {/* PraxiMinds Signature Eyebrow Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11.5,
            fontWeight: 800,
            color: '#FFA500',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 107, 0, 0.45)',
            padding: '6px 18px',
            borderRadius: 24,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 18,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45), 0 0 14px rgba(255, 107, 0, 0.25)'
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: '#FF6B00',
              display: 'inline-block',
              boxShadow: '0 0 8px #FF6B00',
              animation: 'pulse-orange 2s infinite'
            }} />
            <span>Direct Client Requisitions · State & Enterprise</span>
          </div>

          {/* Main Headline */}
          <h2 style={{
            fontSize: 'clamp(28px, 4.5vw, 42px)',
            fontWeight: 900,
            margin: '0 0 14px',
            color: '#FFFFFF',
            letterSpacing: '-0.03em',
            lineHeight: 1.18,
            textShadow: '0 2px 14px rgba(0, 0, 0, 0.9), 0 4px 28px rgba(0, 0, 0, 0.6)'
          }}>
            Explore Career Opportunities with{' '}
            <span style={{
              color: '#FF6B00',
              fontWeight: 900,
              display: 'inline-block',
              textShadow: '0 0 35px rgba(255, 107, 0, 0.85), 0 2px 10px rgba(0, 0, 0, 0.95)',
              letterSpacing: '-0.01em'
            }}>
              SmartHire
            </span>
          </h2>

          {/* Subtitle */}
          <p style={{
            fontSize: 15.5,
            color: '#E2E8F0',
            fontWeight: 500,
            maxWidth: 680,
            margin: '0 auto 28px',
            lineHeight: 1.6,
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.85)'
          }}>
            Verified high-impact contracts (C2C, W2, 1099) with direct North Carolina, Virginia, and Fortune 500 enterprise clients. 0 intermediary layers.
          </p>

          {/* 4 PraxiMinds / Zoho ATS KPI Stat Metric Counters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
            gap: 12,
            maxWidth: 740,
            margin: '0 auto 32px'
          }}>
            {[
              { label: 'Active Requisitions', val: `${activeOpenJobs.length > 0 ? activeOpenJobs.length : 66}+`, icon: '⚡', accent: '#38BDF8' },
              { label: 'Direct End-Clients', val: '100%', icon: '🏢', accent: '#4ADE80' },
              { label: 'Recruiter Review', val: '< 24 hrs', icon: '⏱️', accent: '#FBBF24' },
              { label: 'Intermediary Layers', val: '0 (Direct)', icon: '🛡️', accent: '#FF6B00' }
            ].map((stat, i) => (
              <div key={i} style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: 10,
                padding: '11px 14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>
                  <span style={{ fontSize: 14 }}>{stat.icon}</span>
                  <span style={{ color: stat.accent }}>{stat.val}</span>
                </div>
                <span style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Elevated Floating Search Box */}
          <div style={{
            backgroundColor: isLight ? '#FFFFFF' : '#111827',
            border: `1px solid ${isLight ? '#CBD5E1' : '#374151'}`,
            borderRadius: 12,
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            maxWidth: 820,
            margin: '0 auto',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.42), 0 4px 14px rgba(0, 0, 0, 0.2)',
            flexWrap: 'wrap',
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease'
          }}>
            {/* Search Input */}
            <div style={{
              flex: '2 1 260px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              gap: 10
            }}>
              <span style={{ fontSize: 15, color: '#2563EB' }}>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job title, skill, position #, or location (e.g. Java, Raleigh, NC)..."
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: theme.textPrimary,
                  padding: '10px 0',
                  fontSize: 13.5,
                  fontWeight: 500,
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 13, padding: 2 }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 26, backgroundColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.12)', margin: '0 4px' }} />

            {/* Work Mode Select */}
            <div style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
              <span style={{ fontSize: 14, color: '#64748B', marginRight: 6 }}>🌐</span>
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value)
                  if (e.target.value === 'Today') setDeadlineFilter('Today')
                  else if (deadlineFilter === 'Today') setDeadlineFilter('All')
                }}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: theme.textPrimary,
                  padding: '10px 4px',
                  fontSize: 13,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                <option value="All">All Work Modes</option>
                <option value="Today">⏰ Closing Today {todayDeadlineCount > 0 ? `(${todayDeadlineCount})` : ''}</option>
                <option value="Remote">🏠 Remote ({remoteCount})</option>
                <option value="Hybrid">🏢 Hybrid ({hybridCount})</option>
                <option value="Onsite">📍 Onsite ({onsiteCount})</option>
              </select>
            </div>

            {/* Clear Filter Button */}
            {(searchQuery || selectedLocation !== 'All' || deadlineFilter !== 'All') && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedLocation('All'); setDeadlineFilter('All') }}
                style={{
                  backgroundColor: isLight ? '#F1F5F9' : '#374151',
                  color: theme.textSecondary,
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginRight: 4,
                  transition: 'background-color 0.15s ease'
                }}
              >
                Reset
              </button>
            )}
          </div>

          {/* Zoho Style Segmented Quick Chips - Glossy Specular Finish */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18, justifyContent: 'center', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => { setDeadlineFilter('All'); setSelectedLocation('All') }}
              style={{
                background: (deadlineFilter === 'All' && selectedLocation === 'All')
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 50%, rgba(0,0,0,0.03) 51%, rgba(0,0,0,0.14) 100%), #2563EB'
                  : (isLight ? 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)' : 'linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.9) 100%)'),
                color: (deadlineFilter === 'All' && selectedLocation === 'All') ? '#FFFFFF' : (isLight ? '#0F172A' : '#F1F5F9'),
                border: `1px solid ${(deadlineFilter === 'All' && selectedLocation === 'All') ? 'rgba(255, 255, 255, 0.45)' : (isLight ? 'rgba(203, 213, 225, 0.95)' : 'rgba(255,255,255,0.2)')}`,
                borderBottomColor: (deadlineFilter === 'All' && selectedLocation === 'All') ? 'rgba(0,0,0,0.35)' : (isLight ? 'rgba(148, 163, 184, 0.85)' : 'rgba(0,0,0,0.4)'),
                borderRadius: 20,
                padding: '6px 15px',
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: (deadlineFilter === 'All' && selectedLocation === 'All')
                  ? 'inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 3px 10px rgba(37, 99, 235, 0.4)'
                  : 'inset 0 1px 1px rgba(255, 255, 255, 0.9), 0 2px 6px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.15s ease'
              }}
            >
              All Roles ({activeOpenJobs.length})
            </button>

            <button
              type="button"
              onClick={() => {
                if (deadlineFilter === 'Today' || selectedLocation === 'Today') {
                  setDeadlineFilter('All')
                  setSelectedLocation('All')
                } else {
                  setDeadlineFilter('Today')
                  setSelectedLocation('Today')
                }
              }}
              style={{
                background: (deadlineFilter === 'Today' || selectedLocation === 'Today')
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 50%, rgba(0,0,0,0.03) 51%, rgba(0,0,0,0.14) 100%), #DC2626'
                  : (isLight ? 'linear-gradient(180deg, #FFFFFF 0%, #FEF2F2 100%)' : 'rgba(220, 38, 38, 0.18)'),
                color: (deadlineFilter === 'Today' || selectedLocation === 'Today') ? '#FFFFFF' : '#DC2626',
                border: `1px solid ${(deadlineFilter === 'Today' || selectedLocation === 'Today') ? 'rgba(255, 255, 255, 0.45)' : 'rgba(239, 68, 68, 0.5)'}`,
                borderBottomColor: (deadlineFilter === 'Today' || selectedLocation === 'Today') ? 'rgba(0,0,0,0.35)' : 'rgba(220, 38, 38, 0.6)',
                borderRadius: 20,
                padding: '6px 15px',
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: (deadlineFilter === 'Today' || selectedLocation === 'Today')
                  ? 'inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 3px 10px rgba(220, 38, 38, 0.4)'
                  : 'inset 0 1px 1px rgba(255, 255, 255, 0.9), 0 2px 6px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>⏰ Closing Today</span>
              <span style={{
                backgroundColor: (deadlineFilter === 'Today' || selectedLocation === 'Today') ? 'rgba(255,255,255,0.25)' : '#DC2626',
                color: '#FFF',
                borderRadius: 10,
                padding: '0 6px',
                fontSize: 11,
                fontWeight: 800
              }}>
                {todayDeadlineCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setDeadlineFilter('All'); setSelectedLocation('Remote') }}
              style={{
                background: (deadlineFilter === 'All' && selectedLocation === 'Remote')
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 50%, rgba(0,0,0,0.03) 51%, rgba(0,0,0,0.14) 100%), #2563EB'
                  : (isLight ? 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)' : 'linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.9) 100%)'),
                color: (deadlineFilter === 'All' && selectedLocation === 'Remote') ? '#FFFFFF' : (isLight ? '#0F172A' : '#F1F5F9'),
                border: `1px solid ${(deadlineFilter === 'All' && selectedLocation === 'Remote') ? 'rgba(255, 255, 255, 0.45)' : (isLight ? 'rgba(203, 213, 225, 0.95)' : 'rgba(255,255,255,0.2)')}`,
                borderBottomColor: (deadlineFilter === 'All' && selectedLocation === 'Remote') ? 'rgba(0,0,0,0.35)' : (isLight ? 'rgba(148, 163, 184, 0.85)' : 'rgba(0,0,0,0.4)'),
                borderRadius: 20,
                padding: '6px 15px',
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: (deadlineFilter === 'All' && selectedLocation === 'Remote')
                  ? 'inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 3px 10px rgba(37, 99, 235, 0.4)'
                  : 'inset 0 1px 1px rgba(255, 255, 255, 0.9), 0 2px 6px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.15s ease'
              }}
            >
              🏠 Remote ({remoteCount})
            </button>

            <button
              type="button"
              onClick={() => { setDeadlineFilter('All'); setSelectedLocation('Hybrid') }}
              style={{
                background: (deadlineFilter === 'All' && selectedLocation === 'Hybrid')
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 50%, rgba(0,0,0,0.03) 51%, rgba(0,0,0,0.14) 100%), #2563EB'
                  : (isLight ? 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)' : 'linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.9) 100%)'),
                color: (deadlineFilter === 'All' && selectedLocation === 'Hybrid') ? '#FFFFFF' : (isLight ? '#0F172A' : '#F1F5F9'),
                border: `1px solid ${(deadlineFilter === 'All' && selectedLocation === 'Hybrid') ? 'rgba(255, 255, 255, 0.45)' : (isLight ? 'rgba(203, 213, 225, 0.95)' : 'rgba(255,255,255,0.2)')}`,
                borderBottomColor: (deadlineFilter === 'All' && selectedLocation === 'Hybrid') ? 'rgba(0,0,0,0.35)' : (isLight ? 'rgba(148, 163, 184, 0.85)' : 'rgba(0,0,0,0.4)'),
                borderRadius: 20,
                padding: '6px 15px',
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: (deadlineFilter === 'All' && selectedLocation === 'Hybrid')
                  ? 'inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 3px 10px rgba(37, 99, 235, 0.4)'
                  : 'inset 0 1px 1px rgba(255, 255, 255, 0.9), 0 2px 6px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.15s ease'
              }}
            >
              🏢 Hybrid ({hybridCount})
            </button>

            <button
              type="button"
              onClick={() => { setDeadlineFilter('All'); setSelectedLocation('Onsite') }}
              style={{
                background: (deadlineFilter === 'All' && selectedLocation === 'Onsite')
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 50%, rgba(0,0,0,0.03) 51%, rgba(0,0,0,0.14) 100%), #2563EB'
                  : (isLight ? 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)' : 'linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.9) 100%)'),
                color: (deadlineFilter === 'All' && selectedLocation === 'Onsite') ? '#FFFFFF' : (isLight ? '#0F172A' : '#F1F5F9'),
                border: `1px solid ${(deadlineFilter === 'All' && selectedLocation === 'Onsite') ? 'rgba(255, 255, 255, 0.45)' : (isLight ? 'rgba(203, 213, 225, 0.95)' : 'rgba(255,255,255,0.2)')}`,
                borderBottomColor: (deadlineFilter === 'All' && selectedLocation === 'Onsite') ? 'rgba(0,0,0,0.35)' : (isLight ? 'rgba(148, 163, 184, 0.85)' : 'rgba(0,0,0,0.4)'),
                borderRadius: 20,
                padding: '6px 15px',
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: (deadlineFilter === 'All' && selectedLocation === 'Onsite')
                  ? 'inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 3px 10px rgba(37, 99, 235, 0.4)'
                  : 'inset 0 1px 1px rgba(255, 255, 255, 0.9), 0 2px 6px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.15s ease'
              }}
            >
              📍 Onsite ({onsiteCount})
            </button>
          </div>

          {/* Hero Media Controller Bar (Live Video / Photo Slides + Glossy Controls) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 22,
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 30,
            padding: '4px 14px 4px 6px',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 8px 24px rgba(0, 0, 0, 0.45)'
          }}>
            {/* Mode Switch: Video vs Slides */}
            <div style={{ display: 'inline-flex', background: 'rgba(2, 6, 23, 0.7)', borderRadius: 20, padding: 2 }}>
              <button
                type="button"
                onClick={() => setHeroMediaMode('video')}
                title="Play Looping 1080p Video Background"
                style={{
                  background: heroMediaMode === 'video'
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.06) 50%, rgba(0,0,0,0.12) 100%), #2563EB'
                    : 'transparent',
                  color: heroMediaMode === 'video' ? '#FFF' : '#94A3B8',
                  border: 'none',
                  borderRadius: 16,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: heroMediaMode === 'video' ? 'inset 0 1px 1px rgba(255,255,255,0.7), 0 2px 6px rgba(37,99,235,0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🎬 Live Video</span>
              </button>
              <button
                type="button"
                onClick={() => setHeroMediaMode('slides')}
                title="Switch to Photo Carousel Slides"
                style={{
                  background: heroMediaMode === 'slides'
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.06) 50%, rgba(0,0,0,0.12) 100%), #2563EB'
                    : 'transparent',
                  color: heroMediaMode === 'slides' ? '#FFF' : '#94A3B8',
                  border: 'none',
                  borderRadius: 16,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: heroMediaMode === 'slides' ? 'inset 0 1px 1px rgba(255,255,255,0.7), 0 2px 6px rgba(37,99,235,0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🖼️ Photo Slides</span>
              </button>
            </div>

            {/* Prev Button */}
            <button
              type="button"
              onClick={() => {
                setHeroMediaMode('slides')
                setCurrentHeroSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
              }}
              title="Previous Slide"
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'linear-gradient(180deg, #334155 0%, #1E293B 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 800,
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              ‹
            </button>

            {/* Slide Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {HERO_SLIDES.map((slide, idx) => {
                const isActive = heroMediaMode === 'slides' && currentHeroSlide === idx
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => {
                      setHeroMediaMode('slides')
                      setCurrentHeroSlide(idx)
                    }}
                    title={slide.label}
                    style={{
                      height: 6,
                      width: isActive ? 22 : 6,
                      borderRadius: 3,
                      background: isActive 
                        ? 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.1) 100%), #FF6B00' 
                        : 'rgba(255, 255, 255, 0.3)',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 0 8px rgba(255, 107, 0, 0.7)' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />
                )
              })}
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={() => {
                setHeroMediaMode('slides')
                setCurrentHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length)
              }}
              title="Next Slide"
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'linear-gradient(180deg, #334155 0%, #1E293B 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 800,
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              ›
            </button>

            {/* Active Scene Info Text */}
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#F1F5F9',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap'
            }}>
              {heroMediaMode === 'video' ? '🎬 Live 1080p Motion' : HERO_SLIDES[currentHeroSlide].label}
            </span>
          </div>
        </div>
      </section>

      {/* Main Content: Jobs Grid */}
      <section id="jobs-list" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: theme.textPrimary, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Active Vacancies</span>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#2563EB',
                backgroundColor: isLight ? '#EFF6FF' : 'rgba(37, 99, 235, 0.15)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                padding: '1px 8px',
                borderRadius: 12
              }}>
                {filteredJobs.length} Verified
              </span>
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: theme.textSecondary }}>
              Direct client contracts and full-time opportunities · Auto-refreshed in real-time
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: isLight ? '#059669' : '#34D399',
              backgroundColor: isLight ? '#ECFDF5' : 'rgba(5, 150, 105, 0.12)',
              border: `1px solid ${isLight ? '#A7F3D0' : 'rgba(5, 150, 105, 0.25)'}`,
              borderRadius: 20,
              padding: '4px 11px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span className="pulse-dot" /> Live Ingestion Active
            </span>
          </div>
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
            borderRadius: 10,
            padding: '50px 20px',
            textAlign: 'center',
            color: theme.textSecondary
          }}>
            <p style={{ fontSize: 15, margin: '0 0 12px' }}>No active vacancies match "{searchQuery || selectedLocation}".</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedLocation('All'); setDeadlineFilter('All') }}
              style={{
                backgroundColor: '#2563EB',
                border: 'none',
                color: '#FFFFFF',
                borderRadius: 6,
                padding: '7px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 20
          }}>
            {filteredJobs.map((job) => {
              const expired = isJobExpired(job)
              const isBriefExpanded = expandedBriefJobId === job.id
              const workModeText = job.work_mode || job.workMode || job.type || 'Onsite'
              const locationText = resolveJobLocation(job)
              const fullDesc = getFullDescriptionText(job)
              const displayTitle = cleanJobTitleWithPositionNumber(job.title, job)

              // Extract clean narrative preview summary (NO [object Object], NO raw separators)
              const summaryText = (() => {
                const summaryMatch = fullDesc.match(/🎯 PROJECT SUMMARY & OBJECTIVE\s*=+\s*([\s\S]*?)(?:=|$)/i)
                if (summaryMatch && summaryMatch[1].trim().length > 20) {
                  return summaryMatch[1].trim()
                }
                const clean = fullDesc.replace(/=+/g, '').replace(/📌.*?\n/g, '').replace(/•.*?\n/g, '').trim()
                return clean.length > 130 ? clean.substring(0, 130) + '...' : clean
              })()

              return (
                <div
                  key={job.id}
                  className={`sh-job-card ${expired ? 'expired' : ''}`}
                >
                  <div className="sh-card-body">
                    {/* Header: Work Mode & Status/Deadline (Req number omitted for public careers) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: '3px 9px',
                        borderRadius: 6,
                        backgroundColor: workModeText === 'Remote' ? (isLight ? '#ECFDF5' : 'rgba(16, 185, 129, 0.12)') : workModeText === 'Hybrid' ? (isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.12)') : (isLight ? '#F1F5F9' : '#1E293B'),
                        color: workModeText === 'Remote' ? '#065F46' : workModeText === 'Hybrid' ? '#92400E' : (isLight ? '#475569' : '#94A3B8'),
                        border: `1px solid ${workModeText === 'Remote' ? (isLight ? '#A7F3D0' : 'rgba(16, 185, 129, 0.25)') : workModeText === 'Hybrid' ? (isLight ? '#FDE68A' : 'rgba(245, 158, 11, 0.25)') : theme.border}`
                      }}>
                        {workModeText === 'Remote' ? '🏠 Remote' : workModeText === 'Hybrid' ? '🏢 Hybrid' : '📍 Onsite'}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {expired ? (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#DC2626',
                            backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)',
                            padding: '2px 8px',
                            borderRadius: 12
                          }}>
                            Closed
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#15803D',
                            backgroundColor: isLight ? '#DCFCE7' : 'rgba(22, 163, 74, 0.12)',
                            border: `1px solid ${isLight ? '#BBF7D0' : 'rgba(34, 197, 94, 0.25)'}`,
                            padding: '2px 8px',
                            borderRadius: 12,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }}>
                            <span className="pulse-dot" /> Open
                          </span>
                        )}
                        
                        {job.deadline && (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: expired ? '#94A3B8' : isDeadlineToday(job.deadline) ? '#DC2626' : '#B45309',
                            backgroundColor: expired ? (isLight ? '#F1F5F9' : '#1E293B') : isDeadlineToday(job.deadline) ? (isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.15)') : (isLight ? '#FEF3C7' : 'rgba(217, 119, 6, 0.12)'),
                            border: `1px solid ${expired ? theme.border : isDeadlineToday(job.deadline) ? (isLight ? '#FECACA' : 'rgba(239, 68, 68, 0.3)') : (isLight ? '#FDE68A' : 'rgba(217, 119, 6, 0.25)')}`,
                            padding: '2px 7px',
                            borderRadius: 4
                          }}>
                            ⏰ {job.deadline}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Job Title */}
                    <h4 className="sh-job-title" title={displayTitle}>
                      {displayTitle}
                    </h4>

                    {/* Metadata Items: Location & Experience */}
                    <div className="sh-metadata-container">
                      <span className="sh-metadata-item">
                        📍 {locationText}
                      </span>
                      {job.experience && job.experience !== 'TBD' && job.experience !== 'Any' && (
                        <>
                          <span className="sh-metadata-divider" />
                          <span className="sh-metadata-item">
                            ⏳ {formatExperience(job.experience)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Clean Narrative Description (NO Box-Inside-Box) */}
                    <div style={{ marginTop: 'auto', marginBottom: 12 }}>
                      <p style={{
                        margin: '0 0 6px',
                        fontSize: 12.5,
                        color: theme.textSecondary,
                        lineHeight: 1.55,
                        display: '-webkit-box',
                        WebkitLineClamp: isBriefExpanded ? 'unset' : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: isBriefExpanded ? 'visible' : 'hidden',
                        whiteSpace: isBriefExpanded ? 'pre-wrap' : 'normal'
                      }}>
                        {isBriefExpanded ? fullDesc : summaryText}
                      </p>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedBriefJobId(isBriefExpanded ? null : job.id)
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563EB',
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          {isBriefExpanded ? '▲ Collapse Summary' : '▼ Read Summary'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setFullJdModalJob(job)
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748B',
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                        >
                          <span>Full JD</span>
                          <span>↗</span>
                        </button>
                      </div>
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
                  </div>

                  {/* Card Footer Actions */}
                  <div className="sh-card-footer">
                    <span style={{ fontSize: 12, color: theme.textSecondary, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      💼 <strong style={{ color: theme.textPrimary, fontWeight: 600 }}>{job.employment_type || job.type || 'Contract'}</strong>
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => setFullJdModalJob(job)}
                        className="sh-view-btn"
                      >
                        <span>Full JD</span>
                      </button>

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
                            backgroundColor: '#059669',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: 7,
                            padding: '7px 14px',
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                        >
                          💬 Chat
                        </button>
                      ) : expired ? (
                        <button disabled className="sh-expired-btn">
                          Closed
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApplyClick(job)}
                          className="sh-apply-btn"
                        >
                          <span>⚡ Apply Now</span>
                        </button>
                      )}
                    </div>
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
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#2563EB', fontWeight: 700 }}>📍 {resolveJobLocation(fullJdModalJob)} · {fullJdModalJob.work_mode || 'Onsite'}</p>
              </div>
              <button onClick={() => setFullJdModalJob(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: theme.textSecondary, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              <span style={{ fontSize: 12, backgroundColor: theme.inputBg, color: theme.textSecondary, padding: '5px 12px', borderRadius: 6 }}>📍 Location: <strong>{resolveJobLocation(fullJdModalJob)}</strong></span>
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
                ⚡ Apply Now
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

            {/* Recruiter Referral Attribution Badge */}
            {(() => {
              const urlParams = new URLSearchParams(window.location.search)
              const refCode = sessionStorage.getItem('smarthire_recruiter_ref') || localStorage.getItem('smarthire_recruiter_ref') || urlParams.get('ref') || urlParams.get('recruiter')
              const rec = resolveRecruiterFromRef(refCode)
              if (!rec) return null
              return (
                <div style={{
                  background: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.12)',
                  border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(34, 197, 94, 0.3)'}`,
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: isLight ? '#15803d' : '#86efac' }}>
                    <span>👤</span>
                    <span>Sourcing Recruiter: <strong style={{ color: isLight ? '#0f172a' : '#ffffff' }}>{rec.name}</strong> ({rec.email})</span>
                  </div>
                  <span style={{ fontSize: 10.5, background: isLight ? '#dcfce7' : 'rgba(34, 197, 94, 0.25)', color: isLight ? '#166534' : '#bbf7d0', padding: '2px 8px', borderRadius: 12, fontWeight: 800 }}>
                    Direct Recruiter Referral
                  </span>
                </div>
              )
            })()}

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
              title="Open SmartHire Career Assistant"
              style={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 24,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: 15 }}>💬</span>
              <span>Career Assistant</span>
            </button>
          )}
        </>
      )}
    </div>
  )
}
