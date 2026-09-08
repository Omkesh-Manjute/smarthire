import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import CandidateMessengerWidget from '../components/CandidateMessengerWidget'
import SmartHireBotWidget from '../components/SmartHireBotWidget'
import { saveCareerApplication, getAtsJobs, saveRequisitionCandidates, saveCandidate } from '../lib/atsFirestore'
import { loginWithGoogle } from '../lib/firebase'
import { formatJobDescription, resolveJobLocation, cleanJobTitleWithPositionNumber, resolveReqId } from '../utils/formatJobDescription'
import ClassicCareersView from '../components/ClassicCareersView'
import ZoneCareersView from '../components/ZoneCareersView'
import {
  CategoryFinanceIcon,
  CategoryMarketingIcon,
  CategoryDesignIcon,
  CategoryDevIcon,
  CategoryHardwareIcon,
  CategoryCustomerServiceIcon,
  CategoryHealthcareIcon,
  CategoryBankingIcon
} from '../components/ZoneCareerAssets'

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
    let date = null
    if (job.id && job.id.startsWith('J-')) {
      const ts = parseInt(job.id.replace('J-', ''), 10)
      if (!isNaN(ts)) {
        date = new Date(ts)
      }
    }
    if (!date || isNaN(date.getTime())) {
      date = job.creationDate ? new Date(job.creationDate) : new Date()
    }

    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true }
    const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' }

    const formatZone = (tz, tzName) => {
      try {
        const dStr = new Intl.DateTimeFormat('en-US', { ...dateOptions, timeZone: tz }).format(date)
        const tStr = new Intl.DateTimeFormat('en-US', { ...timeOptions, timeZone: tz }).format(date)
        return `${dStr} at ${tStr} ${tzName}`
      } catch (e) {
        return date.toLocaleDateString()
      }
    }

    return {
      EST: formatZone('America/New_York', 'EST'),
      CST: formatZone('America/Chicago', 'CST'),
      MST: formatZone('America/Denver', 'MST'),
      PST: formatZone('America/Los_Angeles', 'PST')
    }
  }

  // Capture referral parameter from URL (e.g. ?ref=vaibhav-bisen)
  useEffect(() => {
    const refCode = searchParams.get('ref') || searchParams.get('recruiter') || searchParams.get('recruiterRef')
    if (refCode) {
      sessionStorage.setItem('smarthire_recruiter_ref', refCode)
      localStorage.setItem('smarthire_recruiter_ref', refCode)
    }
  }, [searchParams])

  // ─── SEO: Dynamic meta tags & JSON-LD for /jobs page ─────────────────────
  useEffect(() => {
    document.title = 'IT Jobs & Direct Client Contracts | SmartHire'

    const setMeta = (name, content, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('description', 'Browse 60+ direct-client IT contract jobs across State, Healthcare & Enterprise clients. Remote, Hybrid & Onsite roles. Apply in 1 click via SmartHire.')
    setMeta('keywords', 'IT jobs, direct client contracts, IT staffing, remote IT jobs, government IT contracts, C2C jobs, W2 jobs, healthcare IT, enterprise contracts, SmartHire')
    setMeta('robots', 'index, follow')
    setMeta('author', 'SmartHire')

    setMeta('og:type', 'website', true)
    setMeta('og:title', 'IT Jobs & Direct Client Contracts | SmartHire', true)
    setMeta('og:description', 'Browse 60+ verified direct-client IT requisitions. State, Healthcare & Enterprise contracts — Remote, Hybrid, Onsite. 1-click apply.', true)
    setMeta('og:url', 'https://smarthire-4zqf.onrender.com/jobs', true)
    setMeta('og:site_name', 'SmartHire', true)
    setMeta('og:locale', 'en_US', true)

    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', 'IT Jobs & Direct Client Contracts | SmartHire')
    setMeta('twitter:description', 'Browse 60+ verified direct-client IT requisitions. State, Healthcare & Enterprise. 1-click apply.')

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', 'https://smarthire-4zqf.onrender.com/jobs')

    const existingLd = document.getElementById('smarthire-jobs-jsonld')
    if (existingLd) existingLd.remove()
    const ldScript = document.createElement('script')
    ldScript.id = 'smarthire-jobs-jsonld'
    ldScript.type = 'application/ld+json'
    ldScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": "https://smarthire-4zqf.onrender.com/#website",
          "url": "https://smarthire-4zqf.onrender.com",
          "name": "SmartHire",
          "description": "Direct-client IT staffing & ATS platform"
        },
        {
          "@type": "WebPage",
          "@id": "https://smarthire-4zqf.onrender.com/jobs#webpage",
          "url": "https://smarthire-4zqf.onrender.com/jobs",
          "name": "IT Jobs & Direct Client Contracts | SmartHire"
        },
        {
          "@type": "Organization",
          "name": "SmartHire",
          "url": "https://smarthire-4zqf.onrender.com",
          "logo": "https://smarthire-4zqf.onrender.com/favicon.svg"
        }
      ]
    })
    document.head.appendChild(ldScript)

    return () => {
      const ld = document.getElementById('smarthire-jobs-jsonld')
      if (ld) ld.remove()
    }
  }, [])

  // ─── THEME & LIVE CLOCKS ──────────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('smarthire_theme') || 'light'
  })
  const isLight = themeMode === 'light'

  const toggleTheme = () => {
    const next = isLight ? 'dark' : 'light'
    setThemeMode(next)
    try { localStorage.setItem('smarthire_theme', next) } catch(e) {}
  }

  // ─── DUAL-VIEW LAYOUT PREFERENCE (CLASSIC ATS VS ZONE MODERN) ───────────
  const [layoutView, setLayoutView] = useState(() => {
    try {
      return localStorage.getItem('smarthire_career_layout_view') || 'classic'
    } catch (e) {
      return 'classic'
    }
  })

  const handleSetLayoutView = (view) => {
    setLayoutView(view)
    try {
      localStorage.setItem('smarthire_career_layout_view', view)
    } catch (e) {}
  }

  const [currentTime, setCurrentTime] = useState(new Date())
  const [clocksExpanded, setClocksExpanded] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
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

  // ─── STATE & DATA ─────────────────────────────────────────────────────────
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('All')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [deadlineFilter, setDeadlineFilter] = useState('All')
  const [chatEnabled, setChatEnabled] = useState(true)
  const [botWidgetOpen, setBotWidgetOpen] = useState(false)
  const [activeChatCandidate, setActiveChatCandidate] = useState(null)

  // Saved / Bookmarked jobs
  const [savedJobs, setSavedJobs] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_saved_jobs')
      return saved ? JSON.parse(saved) : {}
    } catch(e) { return {} }
  })

  const handleToggleSaveJob = (jobId) => {
    setSavedJobs(prev => {
      const next = { ...prev, [jobId]: !prev[jobId] }
      try { localStorage.setItem('smarthire_saved_jobs', JSON.stringify(next)) } catch(e) {}
      return next
    })
  }

  // Track applied jobs locally
  const [appliedJobs, setAppliedJobs] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_applied_jobs')
      return saved ? JSON.parse(saved) : {}
    } catch(e) { return {} }
  })

  // Candidate Auth State
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

  // Resume File Upload & Auto-Parsing State
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

  // General CV Upload Modal State (Candidate 3-Steps CTA)
  const [showCvUploadModal, setShowCvUploadModal] = useState(false)
  const [cvCandidateName, setCvCandidateName] = useState('')
  const [cvCandidateEmail, setCvCandidateEmail] = useState('')
  const [cvCandidatePhone, setCvCandidatePhone] = useState('')
  const [cvPreferredRole, setCvPreferredRole] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [cvParsing, setCvParsing] = useState(false)
  const [cvSuccess, setCvSuccess] = useState(false)

  // ─── HOT CATEGORIES DEFINITIONS (SCREENSHOT 3) ────────────────────────────
  const HOT_CATEGORIES = [
    {
      id: 'accounting',
      name: 'Accounting / Finance',
      count: '497 jobs',
      icon: CategoryFinanceIcon,
      keywords: ['accounting', 'finance', 'financial', 'audit', 'tax', 'payroll', 'controller']
    },
    {
      id: 'marketing',
      name: 'Marketing',
      count: '763 jobs',
      icon: CategoryMarketingIcon,
      keywords: ['marketing', 'seo', 'growth', 'brand', 'content', 'social media', 'campaign']
    },
    {
      id: 'design',
      name: 'Design',
      count: '684 jobs',
      icon: CategoryDesignIcon,
      keywords: ['design', 'ui', 'ux', 'product design', 'graphic', 'figma', 'creative']
    },
    {
      id: 'development',
      name: 'Development',
      count: '451 jobs',
      icon: CategoryDevIcon,
      keywords: ['developer', 'engineer', 'full stack', 'react', 'java', 'node', 'software', 'frontend', 'backend', 'python', 'c#', '.net']
    },
    {
      id: 'hardware',
      name: 'IT - Hardware',
      count: '433 jobs',
      icon: CategoryHardwareIcon,
      keywords: ['hardware', 'network', 'cloud', 'aws', 'infrastructure', 'devops', 'sysadmin', 'azure', 'cisco', 'security']
    },
    {
      id: 'support',
      name: 'Customer Service',
      count: '462 jobs',
      icon: CategoryCustomerServiceIcon,
      keywords: ['support', 'customer', 'service', 'helpdesk', 'operations', 'tier', 'coordinator']
    },
    {
      id: 'healthcare',
      name: 'Health and Care',
      count: '951 jobs',
      icon: CategoryHealthcareIcon,
      keywords: ['health', 'healthcare', 'medical', 'clinical', 'epic', 'cerner', 'hipaa', 'biomedical']
    },
    {
      id: 'banking',
      name: 'Banking',
      count: '194 jobs',
      icon: CategoryBankingIcon,
      keywords: ['bank', 'banking', 'fintech', 'treasury', 'capital', 'risk', 'compliance', 'wealth']
    }
  ]

  // ─── THEME TOKENS (ZONE UI SPECS) ─────────────────────────────────────────
  const theme = {
    primary: '#FA541C',
    primaryHover: '#B3200E',
    primaryLight: '#FEE9D1',
    bg: isLight ? '#FFFFFF' : '#141A21',
    surface: isLight ? '#F4F6F8' : '#1C252E',
    cardBg: isLight ? '#FFFFFF' : '#1C252E',
    headerBg: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(20, 26, 33, 0.92)',
    textPrimary: isLight ? '#1C252E' : '#FFFFFF',
    textSecondary: isLight ? '#637381' : '#919EAB',
    border: isLight ? 'rgba(145, 158, 171, 0.2)' : 'rgba(145, 158, 171, 0.24)',
    inputBg: isLight ? '#FFFFFF' : '#1C252E',
    inputBorder: isLight ? 'rgba(145, 158, 171, 0.28)' : 'rgba(145, 158, 171, 0.32)',
    cardShadow: isLight
      ? '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)'
      : '0 0 2px 0 rgba(0, 0, 0, 0.4), 0 12px 24px -4px rgba(0, 0, 0, 0.3)',
    cardHoverShadow: isLight
      ? '0 0 2px 0 rgba(145, 158, 171, 0.24), 0 20px 40px -4px rgba(145, 158, 171, 0.18)'
      : '0 0 2px 0 rgba(0, 0, 0, 0.5), 0 20px 40px -4px rgba(0, 0, 0, 0.5)'
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  const cleanNameFromFileName = (fileName) => {
    if (!fileName) return ''
    let name = fileName.replace(/\.(pdf|docx|doc|txt)$/i, '')
    name = name.replace(/([a-z])([A-Z])/g, '$1 $2')
    name = name.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    name = name.replace(/%20|_|-/g, ' ')
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
    if (!val || val === 'TBD' || val === 'Any') return '5+ Years Exp'
    if (/\d+/.test(val)) return val.includes('exp') ? val : `${val} Exp`
    return val
  }

  const formatRateOrSalary = (job) => {
    const rate = job.payRate || job.hourlyRate || job.rate || job.salary
    if (rate && rate !== 'TBD' && rate !== 'Competitive') {
      return rate.includes('$') ? rate : `$${rate}/hr`
    }
    return 'Competitive'
  }

  const formatContractType = (job) => {
    const ct = (job.contractType || job.jobType || job.type || '').toUpperCase()
    if (ct.includes('C2C') || ct.includes('CORP')) return 'C2C'
    if (ct.includes('W2')) return 'W2'
    if (ct.includes('1099')) return '1099'
    if (ct.includes('FULL')) return 'Full-time'
    if (ct.includes('PART')) return 'Part-time'
    return 'Contract'
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

  // ─── DATA FETCHING ────────────────────────────────────────────────────────
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

  // ─── RESUME AUTO PARSING ──────────────────────────────────────────────────
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
        }
      }
    } catch (err) {
      console.error('Resume parsing error:', err)
    } finally {
      setIsParsingResume(false)
    }
  }

  // ─── GENERAL CV UPLOAD MODAL PARSING ──────────────────────────────────────
  const handleCvDropFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCvFile(file)
    setCvParsing(true)
    try {
      const formData = new FormData()
      formData.append('resume', file)
      const res = await fetch('/api/parse-resume', { method: 'POST', body: formData })
      const result = await res.json()
      if (result.success && result.profile) {
        const p = result.profile
        const name = p.name || cleanNameFromFileName(file.name)
        if (name && name.toUpperCase() !== 'PDF') setCvCandidateName(name)
        if (p.email) setCvCandidateEmail(p.email)
        if (p.phone) setCvCandidatePhone(p.phone)
        if (p.skills && p.skills[0]) setCvPreferredRole(p.skills.slice(0, 3).join(', '))
      } else {
        const fallbackName = cleanNameFromFileName(file.name)
        if (fallbackName) setCvCandidateName(fallbackName)
      }
    } catch(err) {
      console.warn('CV parse error:', err)
    } finally {
      setCvParsing(false)
    }
  }

  const handleGeneralCvSubmit = async (e) => {
    e.preventDefault()
    if (!cvCandidateName.trim() || !cvCandidateEmail.trim()) {
      alert('Please enter your Name and Email.')
      return
    }
    setCvParsing(true)
    try {
      const appRecord = {
        name: cvCandidateName.trim(),
        email: cvCandidateEmail.trim(),
        phone: cvCandidatePhone.trim() || '—',
        jobTitle: cvPreferredRole || 'General Candidate Submission',
        status: 'New',
        appliedDate: new Date().toLocaleDateString('en-US'),
        comments: 'Submitted via Zone CV Quick Upload'
      }
      await saveCareerApplication(appRecord, cvFile)
      setCvSuccess(true)
    } catch(err) {
      console.error('General CV submit error:', err)
      alert('Upload failed. Please try again.')
    } finally {
      setCvParsing(false)
    }
  }

  // ─── FILTERING ────────────────────────────────────────────────────────────
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (isJobExpired(j)) return false

      // Category filter
      if (selectedCategory !== 'all') {
        const cat = HOT_CATEGORIES.find(c => c.id === selectedCategory)
        if (cat) {
          const matchCat = cat.keywords.some(kw => 
            (j.title || '').toLowerCase().includes(kw) ||
            (Array.isArray(j.skills) && j.skills.some(s => s.toLowerCase().includes(kw))) ||
            (j.description || '').toLowerCase().includes(kw)
          )
          if (!matchCat) return false
        }
      }

      // Keyword query match
      const titleMatch = (j.title || '').toLowerCase().includes(searchQuery.toLowerCase())
      const skillMatch = Array.isArray(j.skills) && j.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      const locMatch = (resolveJobLocation(j) || 'Remote, US').toLowerCase().includes(searchQuery.toLowerCase())
      const qMatch = titleMatch || skillMatch || locMatch

      if ((deadlineFilter === 'Today' || selectedLocation === 'Today') && !isDeadlineToday(j.deadline)) return false

      if (selectedLocation === 'Remote') return qMatch && (j.location || 'Remote').toLowerCase().includes('remote')
      if (selectedLocation === 'Hybrid') return qMatch && (j.location || '').toLowerCase().includes('hybrid')
      if (selectedLocation === 'Onsite') return qMatch && ((j.location || '').toLowerCase().includes('onsite') || (j.location || '').toLowerCase().includes('on-site'))
      
      return qMatch
    })
  }, [jobs, searchQuery, selectedLocation, selectedCategory, deadlineFilter])

  const activeOpenJobs = useMemo(() => jobs.filter(j => !isJobExpired(j)), [jobs])
  const todayDeadlineCount = useMemo(() => activeOpenJobs.filter(j => isDeadlineToday(j.deadline)).length, [activeOpenJobs])
  const remoteCount = useMemo(() => activeOpenJobs.filter(j => (j.location || j.work_mode || '').toLowerCase().includes('remote')).length, [activeOpenJobs])
  const hybridCount = useMemo(() => activeOpenJobs.filter(j => (j.location || j.work_mode || '').toLowerCase().includes('hybrid')).length, [activeOpenJobs])
  const onsiteCount = useMemo(() => activeOpenJobs.filter(j => (j.location || j.work_mode || '').toLowerCase().includes('onsite') || (j.location || j.work_mode || '').toLowerCase().includes('on site')).length, [activeOpenJobs])

  // ─── APPLICATION SUBMISSION ───────────────────────────────────────────────
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

    const recruiterRef = sessionStorage.getItem('smarthire_recruiter_ref') || localStorage.getItem('smarthire_recruiter_ref') || searchParams.get('ref') || 'direct'
    const activeRecruiter = resolveRecruiterFromRef(recruiterRef) || ALL_SMARTHIRE_RECRUITERS[0]

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
        formData.append('recruiterRef', recruiterRef)
        formData.append('resumeText', resumeText)

        res = await fetch('/api/screening/public-submit', {
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
        const parsedName = data.candidateName || validName
        const appRecord = {
          sessionId: data.sessionId || 'SCR-' + Date.now(),
          candidateId: data.candidateId || data.sessionId || 'SCR-' + Date.now(),
          jobId: selectedJob.id,
          jobTitle: selectedJob.title,
          candidateName: parsedName,
          candidateEmail: candidateEmail.trim(),
          appliedAt: new Date().toISOString()
        }

        const updated = { ...appliedJobs, [selectedJob.id]: appRecord }
        setAppliedJobs(updated)
        try { localStorage.setItem('smarthire_applied_jobs', JSON.stringify(updated)) } catch(e) {}

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
          comments: `Submitted from SmartHire Careers via ${activeRecruiter.name}`,
          recruiter: activeRecruiter.name,
          recruiterEmail: activeRecruiter.email,
          recruiterRef: activeRecruiter.refCode
        }

        try {
          const existingApps = JSON.parse(localStorage.getItem('smarthire_careers_applications') || '[]')
          localStorage.setItem('smarthire_careers_applications', JSON.stringify([newApp, ...existingApps]))
        } catch(e) {}

        // Multi-key auto-apply sync to Requisition Pipeline (Req ID, Resolved ID, Position Number)
        const cleanReqId = String(selectedJob.id || '').replace(/^J-/, '').trim()
        const resolvedReqId = resolveReqId(cleanReqId, selectedJob)
        const posNum = selectedJob.positionNumber || (selectedJob.title ? (selectedJob.title.match(/\((\d{5,8})\)/) || [])[1] : '') || ''
        const candidateId = data.candidateId || `APP-${Date.now()}`
        const allTargetKeys = Array.from(new Set([cleanReqId, resolvedReqId, posNum].filter(Boolean)))

        const candPipelineObj = {
          id: candidateId,
          candidateId: candidateId,
          name: parsedName,
          email: candidateEmail.trim(),
          phone: candidatePhone.trim() || '—',
          role: selectedJob.title || 'Applicant',
          jobTitle: selectedJob.title,
          payRate: expectedRate || '75/hr',
          payRateType: contractType || 'C2C',
          assignedBy: activeRecruiter.name || 'SmartHire Careers Auto-Apply',
          assignedOn: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          status: 'Int-SubmittedToManager',
          statusComments: `Auto-applied from SmartHire Careers Portal at ${expectedRate || '$75/hr'}`,
          interview: 'Select',
          source: 'SmartHire Careers (Auto-Apply)',
          skills: Array.isArray(selectedJob.skills) ? selectedJob.skills : ['Core Proficiencies'],
          reqId: resolvedReqId || cleanReqId,
          positionNumber: posNum,
          job_id: `J-${resolvedReqId || cleanReqId}`,
          pushedToJobsInHand: true,
          timestamp: Date.now(),
          createdAt: new Date().toISOString()
        }

        allTargetKeys.forEach(tKey => {
          try {
            const existingRaw = localStorage.getItem(`smarthire_potential_candidates_${tKey}`) ||
                                localStorage.getItem(`smarthire_potential_candidates_J-${tKey}`)
            let existingList = []
            if (existingRaw) {
              try { existingList = JSON.parse(existingRaw) } catch (e) {}
            }
            const merged = [candPipelineObj, ...existingList.filter(c => c.email !== candidateEmail.trim() && c.id !== candidateId)]
            localStorage.setItem(`smarthire_potential_candidates_${tKey}`, JSON.stringify(merged))
            localStorage.setItem(`smarthire_potential_candidates_J-${tKey}`, JSON.stringify(merged))
          } catch (e) {}
        })

        for (const tKey of allTargetKeys) {
          try {
            const existingRaw = localStorage.getItem(`smarthire_potential_candidates_${tKey}`)
            const listToSave = existingRaw ? JSON.parse(existingRaw) : [candPipelineObj]
            saveRequisitionCandidates(tKey, listToSave).catch(() => {})
          } catch (e) {}
        }

        try {
          const allCandsRaw = localStorage.getItem('smarthire_all_candidates')
          const allCands = allCandsRaw ? JSON.parse(allCandsRaw) : []
          const updatedAll = [candPipelineObj, ...allCands.filter(c => c.email !== candidateEmail.trim() && c.id !== candidateId)]
          localStorage.setItem('smarthire_all_candidates', JSON.stringify(updatedAll))
        } catch (e) {}

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

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      backgroundColor: layoutView === 'classic' ? (isLight ? '#FAFBFD' : '#080C14') : (isLight ? '#FFFFFF' : '#141A21'),
      color: isLight ? '#0F172A' : '#F8FAFC',
      transition: 'background-color 0.2s, color 0.2s'
    }}>
      {/* ─── 1-CLICK DUAL LAYOUT TOGGLE: CLASSIC ATS VS ZONE MODERN ─────────── */}
      {layoutView === 'classic' ? (
        <ClassicCareersView
          jobs={jobs}
          filteredJobs={filteredJobs}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          deadlineFilter={deadlineFilter}
          setDeadlineFilter={setDeadlineFilter}
          activeOpenJobs={activeOpenJobs}
          todayDeadlineCount={todayDeadlineCount}
          remoteCount={remoteCount}
          hybridCount={hybridCount}
          onsiteCount={onsiteCount}
          appliedJobs={appliedJobs}
          savedJobs={savedJobs}
          handleToggleSaveJob={handleToggleSaveJob}
          candidateUser={candidateUser}
          handleCandidateSignOut={handleCandidateSignOut}
          setShowLoginModal={setShowLoginModal}
          handleApplyClick={handleApplyClick}
          setFullJdModalJob={setFullJdModalJob}
          setActiveChatCandidate={setActiveChatCandidate}
          clocksExpanded={clocksExpanded}
          setClocksExpanded={setClocksExpanded}
          formatLiveTime={formatLiveTime}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          isLight={isLight}
          layoutView={layoutView}
          handleSetLayoutView={handleSetLayoutView}
          cleanJobTitleWithPositionNumber={cleanJobTitleWithPositionNumber}
          resolveJobLocation={resolveJobLocation}
          formatExperience={formatExperience}
          isJobExpired={isJobExpired}
          isDeadlineToday={isDeadlineToday}
        />
      ) : (
        <ZoneCareersView
          jobs={jobs}
          filteredJobs={filteredJobs}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          HOT_CATEGORIES={HOT_CATEGORIES}
          deadlineFilter={deadlineFilter}
          setDeadlineFilter={setDeadlineFilter}
          activeOpenJobs={activeOpenJobs}
          todayDeadlineCount={todayDeadlineCount}
          remoteCount={remoteCount}
          hybridCount={hybridCount}
          onsiteCount={onsiteCount}
          appliedJobs={appliedJobs}
          savedJobs={savedJobs}
          handleToggleSaveJob={handleToggleSaveJob}
          candidateUser={candidateUser}
          handleCandidateSignOut={handleCandidateSignOut}
          setShowLoginModal={setShowLoginModal}
          handleApplyClick={handleApplyClick}
          setFullJdModalJob={setFullJdModalJob}
          setActiveChatCandidate={setActiveChatCandidate}
          setShowCvUploadModal={setShowCvUploadModal}
          clocksExpanded={clocksExpanded}
          setClocksExpanded={setClocksExpanded}
          formatLiveTime={formatLiveTime}
          themeMode={themeMode}
          toggleTheme={toggleTheme}
          isLight={isLight}
          layoutView={layoutView}
          handleSetLayoutView={handleSetLayoutView}
          cleanJobTitleWithPositionNumber={cleanJobTitleWithPositionNumber}
          resolveJobLocation={resolveJobLocation}
          formatExperience={formatExperience}
          formatRateOrSalary={formatRateOrSalary}
          formatContractType={formatContractType}
          isJobExpired={isJobExpired}
        />
      )}

      {/* ─── FULL JD READER MODAL ──────────────────────────────────────────── */}
      {fullJdModalJob && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 200,
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
            maxWidth: 780,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 32,
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  backgroundColor: isLight ? '#FEE9D1' : '#33201C',
                  color: theme.primary,
                  padding: '3px 8px',
                  borderRadius: 6,
                  textTransform: 'uppercase'
                }}>
                  {formatContractType(fullJdModalJob)} · {fullJdModalJob.work_mode || 'Remote'}
                </span>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, margin: '8px 0 4px', fontFamily: "'Barlow', sans-serif" }}>
                  {cleanJobTitleWithPositionNumber(fullJdModalJob.title)}
                </h2>
                <div style={{ fontSize: 13, color: '#00B8D9', fontWeight: 700 }}>
                  {fullJdModalJob.client || 'Direct End-Client'} · 📍 {resolveJobLocation(fullJdModalJob) || 'Remote, US'}
                </div>
              </div>
              <button
                onClick={() => setFullJdModalJob(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 22,
                  cursor: 'pointer',
                  color: theme.textSecondary
                }}
              >
                ✕
              </button>
            </div>

            {/* Timezone Post Times */}
            {(() => {
              const tz = getJobPostTimezones(fullJdModalJob)
              return (
                <div style={{
                  backgroundColor: theme.surface,
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  gap: 16,
                  fontSize: 11.5,
                  color: theme.textSecondary,
                  marginBottom: 20,
                  flexWrap: 'wrap'
                }}>
                  <span>🕒 <strong>EST:</strong> {tz.EST}</span>
                  <span><strong>CST:</strong> {tz.CST}</span>
                  <span><strong>PST:</strong> {tz.PST}</span>
                </div>
              )
            })()}

            {/* Job Description Content */}
            <div style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: theme.textPrimary,
              whiteSpace: 'pre-wrap',
              borderTop: `1px solid ${theme.border}`,
              paddingTop: 18,
              marginBottom: 24
            }}>
              {getFullDescriptionText(fullJdModalJob)}
            </div>

            {/* Skills Pills */}
            {Array.isArray(fullJdModalJob.skills) && fullJdModalJob.skills.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: theme.textSecondary, marginBottom: 8 }}>REQUIRED SKILLS</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {fullJdModalJob.skills.map((s, i) => (
                    <span key={i} style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      backgroundColor: theme.surface,
                      color: theme.primary,
                      border: `1px solid ${theme.border}`,
                      padding: '3px 10px',
                      borderRadius: 6
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: `1px solid ${theme.border}`, paddingTop: 18 }}>
              <button
                onClick={() => setFullJdModalJob(null)}
                style={{
                  background: 'none',
                  border: `1px solid ${theme.border}`,
                  color: theme.textPrimary,
                  borderRadius: 8,
                  padding: '10px 18px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  const jobToApply = fullJdModalJob
                  setFullJdModalJob(null)
                  handleApplyClick(jobToApply)
                }}
                style={{
                  backgroundColor: theme.primary,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(250, 84, 28, 0.4)'
                }}
              >
                ⚡ Apply for this position
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CANDIDATE 1-CLICK APPLY MODAL ─────────────────────────────────── */}
      {selectedJob && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 250,
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
            maxWidth: 680,
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: 32,
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, margin: '0 0 4px', fontFamily: "'Barlow', sans-serif" }}>
                  {cleanJobTitleWithPositionNumber(selectedJob.title)}
                </h3>
                <p style={{ fontSize: 13, color: '#00B8D9', margin: 0, fontWeight: 700 }}>
                  📍 {resolveJobLocation(selectedJob) || 'Remote, US'} · {selectedJob.work_mode || 'Contract'}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                style={{ background: 'none', border: 'none', color: theme.textSecondary, fontSize: 22, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Sourcing Recruiter Referral Attribution */}
            {(() => {
              const refCode = sessionStorage.getItem('smarthire_recruiter_ref') || localStorage.getItem('smarthire_recruiter_ref') || searchParams.get('ref')
              const rec = resolveRecruiterFromRef(refCode)
              if (!rec) return null
              return (
                <div style={{
                  background: isLight ? '#F0FDF4' : 'rgba(22, 163, 74, 0.12)',
                  border: `1px solid ${isLight ? '#BBF7D0' : 'rgba(34, 197, 94, 0.3)'}`,
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isLight ? '#15803D' : '#86EFAC' }}>
                    👤 Sourcing Recruiter: <strong>{rec.name}</strong> ({rec.email})
                  </div>
                  <span style={{ fontSize: 10.5, background: isLight ? '#DCFCE7' : 'rgba(34, 197, 94, 0.25)', color: isLight ? '#166534' : '#BBF7D0', padding: '2px 8px', borderRadius: 12, fontWeight: 800 }}>
                    Direct Referral
                  </span>
                </div>
              )
            })()}

            {/* Application Success Screen */}
            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#16A34A', fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  ✓
                </div>
                <h4 style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, margin: '0 0 8px', fontFamily: "'Barlow', sans-serif" }}>
                  🎉 Application Submitted Successfully!
                </h4>
                <p style={{ fontSize: 14, color: theme.textSecondary, maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.6 }}>
                  Thank you <strong>{submitSuccess.candidateName || candidateName}</strong>! Your application for <strong>{submitSuccess.jobTitle}</strong> has been received by our recruiting team.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
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
                      background: 'linear-gradient(135deg, #FA541C, #FDAB76)',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px 24px',
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(250, 84, 28, 0.35)'
                    }}
                  >
                    💬 Message Recruiter Now
                  </button>
                  <button
                    onClick={() => { setSelectedJob(null); setSubmitSuccess(null); }}
                    style={{
                      background: theme.surface,
                      color: theme.textPrimary,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 10,
                      padding: '12px 20px',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Application Form */
              <>
                {submitError && (
                  <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                    ⚠️ {submitError}
                  </div>
                )}

                {/* Step 1: Resume Upload for Auto-Fill */}
                <div style={{
                  backgroundColor: isLight ? '#FFF8F5' : 'rgba(250, 84, 28, 0.08)',
                  border: `1px solid ${isLight ? '#FEE9D1' : 'rgba(250, 84, 28, 0.25)'}`,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: theme.primary }}>
                      📄 Step 1: Attach Resume (Auto-Fills Form)
                    </span>
                    {isParsingResume && (
                      <span style={{ fontSize: 11, color: theme.primary, fontWeight: 700 }}>⏳ Extracting details...</span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: theme.textSecondary, margin: '0 0 10px 0' }}>
                    Attach your resume (.pdf, .docx, .txt). Your Name, Email, Phone, & Location will auto-populate below!
                  </p>

                  <div style={{
                    backgroundColor: theme.cardBg,
                    border: `2px dashed ${resumeFile ? '#16A34A' : theme.primary}`,
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
                          style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div style={{ color: theme.textSecondary, fontSize: 13 }}>
                        <span style={{ fontSize: 20, display: 'block', marginBottom: 2 }}>📎</span>
                        <strong>Click or Drag Resume File Here</strong> (.pdf, .docx, .txt)
                      </div>
                    )}
                  </div>

                  {autoFillSuccess && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#15803D', fontWeight: 700 }}>
                      ✨ Details auto-populated from resume! Review below.
                    </div>
                  )}
                </div>

                {/* Candidate Form Fields */}
                <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="e.g. John Doe"
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

                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>Email Address *</label>
                      <input
                        type="email"
                        required
                        value={candidateEmail}
                        onChange={(e) => setCandidateEmail(e.target.value)}
                        placeholder="john@example.com"
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
                      <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>Phone Number</label>
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

                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>Contract Type</label>
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
                        <option value="W2">W2 Hourly / Salaried</option>
                        <option value="1099">1099 Independent</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>Expected Rate ($/hr)</label>
                      <input
                        type="number"
                        value={expectedRate}
                        onChange={(e) => setExpectedRate(e.target.value)}
                        placeholder="e.g. 75"
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <input
                      type="checkbox"
                      id="detailsVerified"
                      required
                      checked={detailsVerified}
                      onChange={(e) => setDetailsVerified(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <label htmlFor="detailsVerified" style={{ fontSize: 12.5, color: theme.textSecondary, cursor: 'pointer' }}>
                      I confirm the details provided are correct and accurate.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      marginTop: 10,
                      backgroundColor: theme.primary,
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '14px',
                      fontSize: 15,
                      fontWeight: 800,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 16px rgba(250, 84, 28, 0.35)',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    {submitting ? '⚡ Submitting...' : '🚀 Submit Direct Application'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── GENERAL CV UPLOAD MODAL (FROM "UPLOAD YOUR CV" CTA) ────────────── */}
      {showCvUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 300,
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
            maxWidth: 540,
            padding: 32,
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, margin: '0 0 4px', fontFamily: "'Barlow', sans-serif" }}>
                  Upload Your CV / Resume
                </h3>
                <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0 }}>
                  Join our verified candidate talent pool for direct client IT contracts.
                </p>
              </div>
              <button
                onClick={() => { setShowCvUploadModal(false); setCvSuccess(false); }}
                style={{ background: 'none', border: 'none', color: theme.textSecondary, fontSize: 22, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {cvSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#16A34A', fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  ✓
                </div>
                <h4 style={{ fontSize: 20, fontWeight: 800, color: theme.textPrimary, margin: '0 0 8px' }}>
                  CV Uploaded Successfully!
                </h4>
                <p style={{ fontSize: 13.5, color: theme.textSecondary, margin: '0 0 20px', lineHeight: 1.6 }}>
                  Thank you <strong>{cvCandidateName}</strong>. Our recruiters will review your qualifications and contact you when matching direct-client requisitions open.
                </p>
                <button
                  onClick={() => { setShowCvUploadModal(false); setCvSuccess(false); }}
                  style={{
                    backgroundColor: theme.primary,
                    color: '#FFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 22px',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleGeneralCvSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* File Drop Box */}
                <div style={{
                  backgroundColor: theme.surface,
                  border: `2px dashed ${cvFile ? '#16A34A' : theme.primary}`,
                  borderRadius: 12,
                  padding: 20,
                  textAlign: 'center',
                  position: 'relative',
                  cursor: 'pointer'
                }}>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    required={!cvFile}
                    onChange={handleCvDropFile}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                  {cvFile ? (
                    <div style={{ color: '#16A34A', fontWeight: 700, fontSize: 13 }}>
                      📄 {cvFile.name} ({(cvFile.size / 1024).toFixed(1)} KB)
                    </div>
                  ) : (
                    <div style={{ color: theme.textSecondary, fontSize: 13 }}>
                      <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>📎</span>
                      <strong>Click or Drag Your CV Here</strong> (.pdf, .docx, .txt)
                    </div>
                  )}
                  {cvParsing && <div style={{ fontSize: 11, color: theme.primary, marginTop: 4, fontWeight: 700 }}>⏳ Extracting resume details...</div>}
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={cvCandidateName}
                    onChange={(e) => setCvCandidateName(e.target.value)}
                    placeholder="e.g. John Doe"
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

                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>Email Address *</label>
                    <input
                      type="email"
                      required
                      value={cvCandidateEmail}
                      onChange={(e) => setCvCandidateEmail(e.target.value)}
                      placeholder="john@example.com"
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
                    <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>Phone Number</label>
                    <input
                      type="tel"
                      value={cvCandidatePhone}
                      onChange={(e) => setCvCandidatePhone(e.target.value)}
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

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, display: 'block', marginBottom: 4 }}>Target Role or Skills</label>
                  <input
                    type="text"
                    value={cvPreferredRole}
                    onChange={(e) => setCvPreferredRole(e.target.value)}
                    placeholder="e.g. Senior Java Developer, Cloud Architect"
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

                <button
                  type="submit"
                  disabled={cvParsing}
                  style={{
                    marginTop: 8,
                    backgroundColor: theme.primary,
                    color: '#FFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '13px',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: cvParsing ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(250, 84, 28, 0.35)'
                  }}
                >
                  {cvParsing ? 'Submitting...' : 'Upload & Register CV'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── CANDIDATE SIGN IN MODAL ────────────────────────────────────────── */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 400,
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
            padding: 32,
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
            textAlign: 'center'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              backgroundColor: isLight ? '#FEE9D1' : '#33201C',
              color: theme.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, margin: '0 auto 16px'
            }}>
              🔑
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, color: theme.textPrimary, margin: '0 0 6px', fontFamily: "'Barlow', sans-serif" }}>
              Candidate Sign-In Required
            </h3>
            <p style={{ fontSize: 13.5, color: theme.textSecondary, margin: '0 0 24px', lineHeight: 1.5 }}>
              Sign in to submit your application for <strong>{targetJobForLogin?.title || 'this position'}</strong>.
            </p>

            {/* Google Sign In */}
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
                marginBottom: 16
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

            {/* Email login */}
            <div style={{ textAlign: 'left', marginBottom: 12 }}>
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
                background: 'linear-gradient(135deg, #FA541C, #FDAB76)',
                color: '#FFF',
                border: 'none',
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 800,
                cursor: (!loginEmail.trim() || !loginName.trim()) ? 'not-allowed' : 'pointer',
                opacity: (!loginEmail.trim() || !loginName.trim()) ? 0.5 : 1
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

      {/* ─── 1-ON-1 RECRUITER CHAT WIDGET ──────────────────────────────────── */}
      {activeChatCandidate && (
        <CandidateMessengerWidget
          candidate={activeChatCandidate}
          role="candidate"
          onClose={() => setActiveChatCandidate(null)}
        />
      )}

      {/* ─── FLOATING AI CAREER BOT WIDGET ─────────────────────────────────── */}
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
                backgroundColor: '#FA541C',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 24,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(250, 84, 28, 0.4)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: 16 }}>💬</span>
              <span>Career Assistant</span>
            </button>
          )}
        </>
      )}
    </div>
  )
}
