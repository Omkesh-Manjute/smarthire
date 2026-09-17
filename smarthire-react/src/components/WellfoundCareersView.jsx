import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { resolveReqId } from '../utils/formatJobDescription'

// ─── Crisp SVG Icons for Wellfound UI ───────────────────────────────────────
function SearchIcon({ size = 18, color = '#6B7280' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function LocationIcon({ size = 16, color = '#6B7280' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ChevronRightIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function ClockIcon({ size = 14, color = '#6B7280' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function BookmarkIcon({ size = 15, filled = false, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function CheckCircleIcon({ size = 16, color = '#10B981' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

// ─── Dynamic Client Domain Resolver (Eliminates Repetitive "Direct Client") ─
export const resolveClientDomainName = (job) => {
  const text = `${job?.title || ''} ${(job?.skills || []).join(' ')} ${job?.rawDescription || job?.description || ''}`.toLowerCase()

  if (/health|clinical|med|epic|cerner|dhhs|care|patient|hospital|physician/i.test(text)) {
    return 'State Healthcare Systems'
  }
  if (/transportation|dot|vdot|highway|transit|gis|traffic/i.test(text)) {
    return 'State Transportation & Infrastructure'
  }
  if (/cloud|aws|azure|devops|kubernetes|docker|infrastructure|terraform|sre/i.test(text)) {
    return 'Enterprise Cloud Platform'
  }
  if (/data|analytics|bi|power\s*bi|sql|etl|snowflake|warehouse|machine\s*learning|ai|scientist/i.test(text)) {
    return 'Enterprise Data & Analytics'
  }
  if (/bank|finance|payment|treasury|tax|revenue|fintech|audit|fiscal/i.test(text)) {
    return 'Financial & Enterprise Systems'
  }
  if (/security|cyber|soc|iam|identity|firewall|threat|ciso/i.test(text)) {
    return 'Cybersecurity & Governance'
  }
  if (/education|doe|university|school|curriculum|student|teacher/i.test(text)) {
    return 'Public Education Technology'
  }
  if (/director|program\s*manager|project\s*manager|agile|scrum|product|lead/i.test(text)) {
    return 'Enterprise Strategic Services'
  }
  return 'Enterprise Direct Client'
}

// ─── Work Arrangement Resolver (Remote / Hybrid / Onsite) ───────────────────
export const resolveWorkArrangement = (job) => {
  const text = `${job?.work_mode || ''} ${job?.title || ''} ${job?.rawDescription || job?.description || ''}`.toLowerCase()
  if (text.includes('hybrid')) return 'Hybrid'
  if (text.includes('onsite') || text.includes('on-site') || text.includes('in office') || text.includes('in-office')) return 'Onsite'
  if (text.includes('remote')) return 'Remote'
  return job?.work_mode || 'Hybrid / Remote'
}

// ─── Local Candidate Requirement Resolver ──────────────────────────────────
export const resolveLocalRequirement = (job) => {
  const text = `${job?.title || ''} ${job?.description || ''} ${job?.rawDescription || ''} ${job?.work_mode || ''} ${job?.location || ''}`.toLowerCase()
  
  if (/local\s*only|only\s*local|local\s*candidates\s*only|must\s*be\s*local|must\s*reside\s*within|reside\s*locally/i.test(text)) {
    return { label: 'Local Candidates Only', isLocalNeeded: true, urgency: 'high' }
  }
  if (/local\s*preferred|preference\s*given\s*to\s*local|local\s*candidate|relocation\s*not\s*provided/i.test(text)) {
    return { label: 'Local Preferred', isLocalNeeded: true, urgency: 'medium' }
  }
  const mode = resolveWorkArrangement(job).toLowerCase()
  if (mode === 'onsite') {
    return { label: 'Local Required', isLocalNeeded: true, urgency: 'high' }
  }
  if (mode === 'hybrid') {
    return { label: 'Local / Commutable', isLocalNeeded: true, urgency: 'commutable' }
  }
  return { label: 'Nationwide (No Local Need)', isLocalNeeded: false, urgency: 'none' }
}

// ─── Hiring Contact Resolver (Matches Screenshot 1 Avatar Block) ────────────
export const resolveRecruiterContact = (job, location) => {
  return {
    name: 'Sarah J. Thorne',
    role: 'Employee / Talent Partner',
    location: location && !location.includes('Remote') ? location : 'South San Francisco, CA',
    initials: 'ST'
  }
}

// ─── Dynamic Company Logo Colors ───────────────────────────────────────────
const LOGO_PALETTES = [
  { bg: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #047857 0%, #10B981 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #C2410C 0%, #F97316 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)', fg: '#FFFFFF' }
]

function CompanyLogo({ job, size = 42 }) {
  const hash = Math.abs(String(job?.id || job?.title || 'job').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0))
  const palette = LOGO_PALETTES[hash % LOGO_PALETTES.length]
  const cleanTitle = (job?.title || 'Engineer').replace(/[^a-zA-Z]/g, ' ').trim()
  const words = cleanTitle.split(/\s+/).filter(Boolean)
  const letters = words.length >= 2 
    ? (words[0][0] + words[1][0]).toUpperCase()
    : cleanTitle.slice(0, 2).toUpperCase()

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: Math.round(size * 0.24),
      background: palette.bg,
      color: palette.fg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: Math.round(size * 0.38),
      fontWeight: 800,
      letterSpacing: '-0.02em',
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
      flexShrink: 0,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {letters || 'IT'}
    </div>
  )
}

// ─── Structured Job Description Parser (Exact Match to Screenshot 2) ────────
export const parseWellfoundJobDetails = (job, cleanTitle, domainName, location, workMode, localReq) => {
  let aboutCompany = ''
  if (/health|clinical|med|epic|dhhs|hospital/i.test(domainName)) {
    aboutCompany = `${domainName} is an independent digital architecture and enterprise healthcare systems provider building high-converting public health solutions and resilient medical data platforms. Partnering with state health agencies and Medicaid networks, we build secure, patient-centric technology. Quality over volume. Always.`
  } else if (/transportation|dot|vdot|highway|transit/i.test(domainName)) {
    aboutCompany = `${domainName} builds mission-critical transportation infrastructure systems, automated highway asset monitoring platforms, and intelligent GIS networks. We bridge the gap between heavy public infrastructure and modern digital architecture with high performance and zero visual lag.`
  } else if (/cloud|aws|azure|devops|infrastructure/i.test(domainName)) {
    aboutCompany = `${domainName} is an enterprise cloud architecture studio delivering modern automated microservices, serverless workflows, and multi-region AWS/Azure infrastructure for direct clients. We work with a carefully chosen few with creative freedom, modern toolsets, and zero micromanagement.`
  } else if (/data|analytics|bi|power\s*bi|sql|etl/i.test(domainName)) {
    aboutCompany = `${domainName} is an enterprise data and analytics engineering organization building high-throughput data pipelines, cloud warehouses, and real-time operational BI dashboards for direct clients. We emphasize data integrity, scalability, and robust software craftsmanship.`
  } else if (/education|doe|university|school/i.test(domainName)) {
    aboutCompany = `${domainName} designs and deploys statewide digital education platforms, online assessment engines, and modern student information systems with an emphasis on accessibility, low latency, and rock-solid reliability.`
  } else {
    aboutCompany = `${domainName} is an enterprise digital architecture studio building high-performing digital systems and scalable technology products for direct clients. We work with a carefully chosen few. Quality over volume. Always.`
  }

  const expStr = job?.experience ? `${job.experience} of experience` : 'proven professional experience'
  const aboutRole = `We are looking for a ${cleanTitle} with ${expStr} who believes static legacy systems are obsolete. In this role, you will bridge the gap between complex client business requirements and living, high-performance digital solutions. You will be responsible for creating smooth, reliable, and secure technical architectures using modern toolsets and automation. You bring execution, technical mastery, and design sensitivity. We provide creative freedom, direct client impact, and zero micromanagement.`

  const rawSkills = Array.isArray(job?.skills) && job.skills.length > 0 
    ? job.skills 
    : ['System Architecture', 'Cloud Infrastructure', 'API Integration', 'Automated Testing', 'Performance Optimization']

  const s0 = rawSkills[0] || 'Interactive Prototyping'
  const s1 = rawSkills[1] || 'System Build & Architecture'
  const s2 = rawSkills[2] || 'Enterprise Integration'
  const s3 = rawSkills[3] || 'Continuous Delivery'
  const s4 = rawSkills[4] || 'Performance Optimization'

  const whatYouWillDo = [
    {
      title: `${s0}:`,
      description: `Bring static architectural requirements to life with high-fidelity implementations, robust workflows, and dynamic system transitions.`
    },
    {
      title: `${s1}:`,
      description: `Translate complex enterprise specifications into responsive, high-performance solutions with clean code structure and zero technical debt.`
    },
    {
      title: `${s2}:`,
      description: `Integrate secure REST/GraphQL APIs, microservice endpoints, and reliable data pipelines without sacrificing latency or system reliability.`
    },
    {
      title: `${s3}:`,
      description: `Champion automated CI/CD deployment pipelines, unit test coverage, and code reviews using modern version control and DevOps practices.`
    },
    {
      title: `${s4}:`,
      description: `Ensure all interactive elements, queries, and background processes run at a buttery 60fps and sub-second response times across modern platforms.`
    }
  ]

  const whatYouNeed = [
    `Demonstrated hands-on expertise as a ${cleanTitle} in high-visibility enterprise or direct-client environments.`,
    `Deep practical proficiency in ${rawSkills.slice(0, 5).join(', ')}.`,
    `Solid understanding of scalable architecture patterns, automated build pipelines, and system security fundamentals.`,
    `Strong communication and cross-functional coordination skills with the ability to ship independently.`,
    localReq.isLocalNeeded 
      ? `Local candidate or commutable to ${location} to support the client's ${workMode} requirements.`
      : `Ability to operate autonomously in a remote-first setup with high discipline and ownership.`
  ]

  return { aboutCompany, aboutRole, whatYouWillDo, whatYouNeed, rawSkills }
}

export default function WellfoundCareersView({
  jobs = [],
  filteredJobs = [],
  loading = false,
  searchQuery = '',
  setSearchQuery,
  selectedLocation = 'All',
  setSelectedLocation,
  deadlineFilter = 'All',
  setDeadlineFilter,
  appliedJobs = [],
  savedJobs = [],
  handleToggleSaveJob,
  candidateUser = null,
  handleCandidateSignOut,
  setShowLoginModal,
  handleApplyClick,
  setFullJdModalJob,
  setActiveChatCandidate,
  setShowCvUploadModal,
  themeMode = 'light',
  toggleTheme,
  isLight = true,
  cleanJobTitleWithPositionNumber,
  resolveJobLocation,
  formatExperience,
  formatRateOrSalary,
  formatContractType,
  isJobExpired,
  getFullDescriptionText,
  getSimilarJobs,
  getJobPostTimezones
}) {
  // Local state for hero search inputs
  const [heroTitleQuery, setHeroTitleQuery] = useState(searchQuery || '')
  const [heroLocationQuery, setHeroLocationQuery] = useState(selectedLocation === 'All' ? '' : selectedLocation)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all')

  // Selected Job for the Center Full JD View
  const [selectedJobId, setSelectedJobId] = useState(null)
  const centerPanelRef = useRef(null)

  // Theme-aware color palette
  const colors = {
    bg: isLight ? '#FFFFFF' : '#0B0F19',
    subtleBg: isLight ? '#F9FAFB' : '#111827',
    border: isLight ? '#E5E7EB' : '#1F2937',
    borderLight: isLight ? '#F3F4F6' : '#283344',
    textPrimary: isLight ? '#0A0E1A' : '#F9FAFB',
    textSecondary: isLight ? '#525866' : '#9CA3AF',
    textMuted: isLight ? '#8B949E' : '#6B7280',
    accentCoral: '#F43F5E',
    buttonDark: isLight ? '#0A0E1A' : '#F9FAFB',
    buttonDarkText: isLight ? '#FFFFFF' : '#0A0E1A',
    cardBg: isLight ? '#FFFFFF' : '#111827',
    hoverBg: isLight ? '#F8FAFC' : '#1E293B',
    activeBg: isLight ? '#EFF6FF' : '#1E293B',
    activeBorder: isLight ? '#2065D1' : '#3B82F6',
    badgeBg: isLight ? '#F3F4F6' : '#1F2937'
  }

  // Filter visible jobs by category tab if selected
  const categoryFilteredJobs = useMemo(() => {
    const list = filteredJobs || []
    if (activeCategoryFilter === 'all') return list

    return list.filter(job => {
      const text = `${job.title || ''} ${(job.skills || []).join(' ')} ${job.rawDescription || job.description || ''}`.toLowerCase()
      if (activeCategoryFilter === 'cloud') {
        return /cloud|aws|azure|gcp|devops|kubernetes|docker|infrastructure|systems\s*admin|network/i.test(text)
      }
      if (activeCategoryFilter === 'dev') {
        return /software|engineer|developer|java|python|c#|\.net|react|full\s*stack|frontend|backend/i.test(text)
      }
      if (activeCategoryFilter === 'data') {
        return /data|analytics|analyst|bi|power\s*bi|sql|etl|machine\s*learning|ai|scientist/i.test(text)
      }
      if (activeCategoryFilter === 'health') {
        return /health|clinical|med|epic|cerner|dhhs|care|patient|hospital/i.test(text)
      }
      if (activeCategoryFilter === 'mgmt') {
        return /director|manager|lead|scrum|product|project|program|business\s*analyst/i.test(text)
      }
      return true
    })
  }, [filteredJobs, activeCategoryFilter])

  // Automatically select the first job if none selected or if current selection leaves the list
  useEffect(() => {
    if (categoryFilteredJobs.length > 0) {
      if (!selectedJobId || !categoryFilteredJobs.some(j => j.id === selectedJobId)) {
        setSelectedJobId(categoryFilteredJobs[0].id)
      }
    } else {
      setSelectedJobId(null)
    }
  }, [categoryFilteredJobs, selectedJobId])

  const selectedJob = useMemo(() => {
    return categoryFilteredJobs.find(j => j.id === selectedJobId) || categoryFilteredJobs[0] || null
  }, [categoryFilteredJobs, selectedJobId])

  // Handle Search Submission from Hero
  const handleHeroSearchSubmit = (e) => {
    if (e) e.preventDefault()
    if (setSearchQuery) setSearchQuery(heroTitleQuery)
    if (setSelectedLocation) {
      if (!heroLocationQuery.trim()) {
        setSelectedLocation('All')
      } else {
        setSelectedLocation(heroLocationQuery.trim())
      }
    }
    const feed = document.getElementById('wellfound-split-workspace')
    if (feed) {
      feed.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // 1-Click Trending Filter Selection with Smooth Scroll
  const handleTrendingCardClick = (categoryKey) => {
    setActiveCategoryFilter(categoryKey)
    if (setSearchQuery) setSearchQuery('')
    const feed = document.getElementById('wellfound-split-workspace')
    if (feed) {
      feed.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Helper for Similar Jobs calculation fallback
  const similarJobsList = useMemo(() => {
    if (!selectedJob) return []
    if (typeof getSimilarJobs === 'function') {
      return getSimilarJobs(selectedJob, jobs, 3)
    }
    return jobs.filter(j => j.id !== selectedJob.id).slice(0, 3)
  }, [selectedJob, jobs, getSimilarJobs])

  // Computed properties for selected job
  const selCleanTitle = selectedJob ? (cleanJobTitleWithPositionNumber ? cleanJobTitleWithPositionNumber(selectedJob.title) : selectedJob.title) : ''
  const selDomain = selectedJob ? resolveClientDomainName(selectedJob) : ''
  const selLoc = selectedJob ? (resolveJobLocation ? resolveJobLocation(selectedJob) : (selectedJob.work_mode || 'Remote, US')) : ''
  const selWorkMode = selectedJob ? resolveWorkArrangement(selectedJob) : 'Hybrid'
  const selLocalReq = selectedJob ? resolveLocalRequirement(selectedJob) : { label: 'Nationwide', isLocalNeeded: false, urgency: 'none' }
  const selRecruiter = selectedJob ? resolveRecruiterContact(selectedJob, selLoc) : null
  const selDetails = selectedJob ? parseWellfoundJobDetails(selectedJob, selCleanTitle, selDomain, selLoc, selWorkMode, selLocalReq) : null
  const isSaved = selectedJob ? savedJobs.includes(selectedJob.id) : false

  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      backgroundColor: colors.bg,
      color: colors.textPrimary,
      minHeight: '100vh',
      transition: 'background-color 0.2s, color 0.2s'
    }}>
      {/* Dynamic Style for Responsive 3-Column Layout */}
      <style>{`
        @media (min-width: 1280px) {
          .wellfound-3col-workspace {
            display: grid !important;
            grid-template-columns: 360px minmax(0, 1fr) 290px !important;
            gap: 24px !important;
            align-items: start !important;
          }
          .wellfound-sidebar-ads {
            display: flex !important;
            flex-direction: column !important;
          }
        }
        @media (min-width: 1024px) and (max-width: 1279px) {
          .wellfound-3col-workspace {
            display: grid !important;
            grid-template-columns: 340px minmax(0, 1fr) !important;
            gap: 20px !important;
            align-items: start !important;
          }
          .wellfound-sidebar-ads {
            grid-column: span 2 !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 16px !important;
            margin-top: 20px !important;
          }
        }
        @media (max-width: 1023px) {
          .wellfound-3col-workspace {
            display: flex !important;
            flex-direction: column !important;
            gap: 20px !important;
          }
          .wellfound-sidebar-ads {
            display: flex !important;
            flex-direction: column !important;
            margin-top: 20px !important;
          }
        }
      `}</style>

      {/* ─── 1. TOP NAVIGATION BAR WITH AUTH ──────────────────────────────── */}
      <header style={{
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: colors.cardBg,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.03)' : 'none'
      }}>
        <div style={{
          maxWidth: 1560,
          margin: '0 auto',
          padding: '0 24px',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20
        }}>
          {/* Brand Logo: smarthire: */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
              <span style={{
                fontSize: 25,
                fontWeight: 900,
                letterSpacing: '-0.035em',
                color: colors.textPrimary,
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}>
                smarthire<span style={{ color: colors.accentCoral }}>:</span>
              </span>
            </Link>

            {/* Navigation Tabs */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => {
                  setActiveCategoryFilter('all')
                  if (setSearchQuery) setSearchQuery('')
                  if (setSelectedLocation) setSelectedLocation('All')
                }}
                style={{
                  background: activeCategoryFilter === 'all' && !searchQuery ? (isLight ? '#F3F4F6' : '#1F2937') : 'transparent',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: activeCategoryFilter === 'all' && !searchQuery ? 700 : 500,
                  color: colors.textPrimary,
                  padding: '6px 14px',
                  borderRadius: 20,
                  cursor: 'pointer'
                }}
              >
                Find Jobs
              </button>
              <button
                onClick={() => {
                  if (setSelectedLocation) setSelectedLocation('Remote')
                  const el = document.getElementById('wellfound-split-workspace')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  background: selectedLocation === 'Remote' ? (isLight ? '#F3F4F6' : '#1F2937') : 'transparent',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: selectedLocation === 'Remote' ? 700 : 500,
                  color: colors.textSecondary,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Remote
              </button>
              <Link
                to="/ats"
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: colors.textSecondary,
                  padding: '6px 12px',
                  borderRadius: 6,
                  textDecoration: 'none'
                }}
              >
                For Employers
              </Link>
            </nav>
          </div>

          {/* Right Header Controls: Compact Auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {candidateUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px 4px 6px',
                  borderRadius: 20,
                  backgroundColor: '#F3F4F6',
                  border: `1px solid ${colors.border}`
                }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#0A0E1A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700
                  }}>
                    {(candidateUser.name || candidateUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.textPrimary }}>
                    {candidateUser.name || candidateUser.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={handleCandidateSignOut}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.textSecondary,
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '4px 6px'
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setShowLoginModal && setShowLoginModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    color: colors.textPrimary,
                    cursor: 'pointer',
                    padding: '6px 10px'
                  }}
                >
                  Log In
                </button>
                <button
                  onClick={() => setShowLoginModal && setShowLoginModal(true)}
                  style={{
                    backgroundColor: '#0A0E1A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: 700,
                    padding: '6px 14px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                    transition: 'opacity 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── 2. WELLFOUND HERO SECTION (media_1789654471631.png) ──────────── */}
      <section style={{
        maxWidth: 1560,
        margin: '0 auto',
        padding: '42px 24px 24px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Eyebrow */}
        <div style={{
          fontSize: 12.5,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: colors.accentCoral,
          marginBottom: 12
        }}>
          OVER 100+ VERIFIED DIRECT-CLIENT IT REQUISITIONS
        </div>

        {/* Main Headline */}
        <h1 style={{
          fontSize: 'clamp(32px, 4.5vw, 50px)',
          fontWeight: 900,
          letterSpacing: '-0.035em',
          color: colors.textPrimary,
          margin: '0 0 24px',
          lineHeight: 1.15
        }}>
          Find what's next<span style={{ color: colors.accentCoral }}>:</span>
        </h1>

        {/* Dual-Input Search Pill Container */}
        <form
          onSubmit={handleHeroSearchSubmit}
          style={{
            maxWidth: 820,
            margin: '0 auto',
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: 50,
            padding: '8px 10px 8px 24px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: isLight ? '0 10px 25px rgba(0, 0, 0, 0.05)' : '0 10px 25px rgba(0, 0, 0, 0.3)',
            gap: 12,
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease'
          }}
        >
          {/* Left: Job Title Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <SearchIcon size={20} color={colors.textSecondary} />
            <input
              type="text"
              placeholder="Job title, keywords, or skills"
              value={heroTitleQuery}
              onChange={(e) => setHeroTitleQuery(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: 15,
                fontWeight: 500,
                color: colors.textPrimary,
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Vertical Divider */}
          <div style={{ width: 1, height: 32, backgroundColor: colors.border }} />

          {/* Right: Location Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <LocationIcon size={20} color={colors.textSecondary} />
            <input
              type="text"
              placeholder="Location (e.g. Remote, NC, VA, MI)"
              value={heroLocationQuery}
              onChange={(e) => setHeroLocationQuery(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: 15,
                fontWeight: 500,
                color: colors.textPrimary,
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Black Pill Search Button */}
          <button
            type="submit"
            style={{
              backgroundColor: colors.buttonDark,
              color: colors.buttonDarkText,
              border: 'none',
              borderRadius: 30,
              padding: '12px 28px',
              fontSize: 14.5,
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Search
          </button>
        </form>
      </section>

      {/* ─── 3. "TRENDING DIRECT CLIENTS" 3-CARD INTERACTIVE GRID ─────────── */}
      <section style={{
        maxWidth: 1560,
        margin: '0 auto',
        padding: '10px 24px 28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{
            fontSize: 21,
            fontWeight: 800,
            color: colors.textPrimary,
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Trending direct clients hiring now
          </h2>
          <span style={{ fontSize: 13, color: colors.textSecondary, fontWeight: 500 }}>
            Click a client card to filter open opportunities
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 18
        }}>
          {/* Card 1: Enterprise Cloud & AI */}
          <div
            onClick={() => handleTrendingCardClick('cloud')}
            style={{
              border: `1.5px solid ${activeCategoryFilter === 'cloud' ? colors.activeBorder : colors.border}`,
              borderRadius: 14,
              backgroundColor: activeCategoryFilter === 'cloud' ? colors.activeBg : colors.cardBg,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = isLight ? '0 12px 24px rgba(0,0,0,0.08)' : '0 12px 24px rgba(0,0,0,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 15
                }}>
                  EA
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>
                    Enterprise Cloud & AI
                  </h3>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>State & Enterprise Infrastructure</div>
                </div>
              </div>

              <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.5, margin: '0 0 12px' }}>
                Modernizing state cloud infrastructures with AWS, Azure microservices, and automated data pipelines.
              </p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: isLight ? '#FCE7F3' : '#371B2B', color: '#BE185D' }}>
                  Cloud Arch
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                  AWS / Azure
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                  Remote Available
                </span>
              </div>
            </div>

            <div style={{
              borderTop: `1px solid ${colors.borderLight}`,
              paddingTop: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
              fontWeight: 700,
              color: colors.textPrimary
            }}>
              <span>View Open Positions</span>
              <ChevronRightIcon size={14} color={colors.textPrimary} />
            </div>
          </div>

          {/* Card 2: State Healthcare Systems */}
          <div
            onClick={() => handleTrendingCardClick('health')}
            style={{
              border: `1.5px solid ${activeCategoryFilter === 'health' ? colors.activeBorder : colors.border}`,
              borderRadius: 14,
              backgroundColor: activeCategoryFilter === 'health' ? colors.activeBg : colors.cardBg,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = isLight ? '0 12px 24px rgba(0,0,0,0.08)' : '0 12px 24px rgba(0,0,0,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 15
                }}>
                  SH
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>
                    State Healthcare Systems
                  </h3>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>Public Health Agency</div>
                </div>
              </div>

              <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.5, margin: '0 0 12px' }}>
                Empowers statewide public health initiatives, child welfare portals, and Medicaid management systems.
              </p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: isLight ? '#DBEAFE' : '#1E3A8A', color: '#1D4ED8' }}>
                  Public Sector
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                  Healthcare IT
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                  Long-term
                </span>
              </div>
            </div>

            <div style={{
              borderTop: `1px solid ${colors.borderLight}`,
              paddingTop: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
              fontWeight: 700,
              color: colors.textPrimary
            }}>
              <span>View Open Positions</span>
              <ChevronRightIcon size={14} color={colors.textPrimary} />
            </div>
          </div>

          {/* Card 3: Digital Platform Solutions */}
          <div
            onClick={() => handleTrendingCardClick('dev')}
            style={{
              border: `1.5px solid ${activeCategoryFilter === 'dev' ? colors.activeBorder : colors.border}`,
              borderRadius: 14,
              backgroundColor: activeCategoryFilter === 'dev' ? colors.activeBg : colors.cardBg,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = isLight ? '0 12px 24px rgba(0,0,0,0.08)' : '0 12px 24px rgba(0,0,0,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #047857 0%, #10B981 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 15
                }}>
                  DP
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>
                    Digital Platform Solutions
                  </h3>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>Enterprise Modernization</div>
                </div>
              </div>

              <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.5, margin: '0 0 12px' }}>
                Full-stack software engineering, modern React/Node interfaces, and resilient backend microservices.
              </p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: isLight ? '#D1FAE5' : '#064E3B', color: '#047857' }}>
                  Full Stack
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                  Enterprise
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                  Hybrid / Onsite
                </span>
              </div>
            </div>

            <div style={{
              borderTop: `1px solid ${colors.borderLight}`,
              paddingTop: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
              fontWeight: 700,
              color: colors.textPrimary
            }}>
              <span>View Open Positions</span>
              <ChevronRightIcon size={14} color={colors.textPrimary} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. AUTHENTIC WELLFOUND 3-COLUMN WORKSPACE ────────────────────── */}
      <section id="wellfound-split-workspace" style={{
        maxWidth: 1560,
        margin: '0 auto',
        padding: '8px 24px 64px'
      }}>
        {/* Category Filter Pills Ribbon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 14,
          marginBottom: 16,
          borderBottom: `1px solid ${colors.borderLight}`
        }}>
          <button
            onClick={() => setActiveCategoryFilter('all')}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              border: `1px solid ${activeCategoryFilter === 'all' ? colors.buttonDark : colors.border}`,
              backgroundColor: activeCategoryFilter === 'all' ? colors.buttonDark : colors.cardBg,
              color: activeCategoryFilter === 'all' ? colors.buttonDarkText : colors.textPrimary,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            All Requisitions ({filteredJobs.length})
          </button>
          <button
            onClick={() => setActiveCategoryFilter('dev')}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              border: `1px solid ${activeCategoryFilter === 'dev' ? colors.buttonDark : colors.border}`,
              backgroundColor: activeCategoryFilter === 'dev' ? colors.buttonDark : colors.cardBg,
              color: activeCategoryFilter === 'dev' ? colors.buttonDarkText : colors.textPrimary,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            Engineering
          </button>
          <button
            onClick={() => setActiveCategoryFilter('cloud')}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              border: `1px solid ${activeCategoryFilter === 'cloud' ? colors.buttonDark : colors.border}`,
              backgroundColor: activeCategoryFilter === 'cloud' ? colors.buttonDark : colors.cardBg,
              color: activeCategoryFilter === 'cloud' ? colors.buttonDarkText : colors.textPrimary,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            Cloud & Infrastructure
          </button>
          <button
            onClick={() => setActiveCategoryFilter('data')}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              border: `1px solid ${activeCategoryFilter === 'data' ? colors.buttonDark : colors.border}`,
              backgroundColor: activeCategoryFilter === 'data' ? colors.buttonDark : colors.cardBg,
              color: activeCategoryFilter === 'data' ? colors.buttonDarkText : colors.textPrimary,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            Data & AI
          </button>
          <button
            onClick={() => setActiveCategoryFilter('health')}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              border: `1px solid ${activeCategoryFilter === 'health' ? colors.buttonDark : colors.border}`,
              backgroundColor: activeCategoryFilter === 'health' ? colors.buttonDark : colors.cardBg,
              color: activeCategoryFilter === 'health' ? colors.buttonDarkText : colors.textPrimary,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            Public Health & State
          </button>
          <button
            onClick={() => setActiveCategoryFilter('mgmt')}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              border: `1px solid ${activeCategoryFilter === 'mgmt' ? colors.buttonDark : colors.border}`,
              backgroundColor: activeCategoryFilter === 'mgmt' ? colors.buttonDark : colors.cardBg,
              color: activeCategoryFilter === 'mgmt' ? colors.buttonDarkText : colors.textPrimary,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            Management & Governance
          </button>
        </div>

        {/* ── 3-COLUMN MASTER WORKSPACE: LEFT REQS + CENTER WELLFOUND JD + RIGHT ADS ── */}
        <div className="wellfound-3col-workspace">
          {/* ════════ COLUMN 1: LEFT REQUISITIONS FEED (SIDE MAI BAKI KE CARD) ════════ */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxHeight: 'calc(100vh - 110px)',
            overflowY: 'auto',
            paddingRight: 6,
            position: 'sticky',
            top: 84
          }}>
            {categoryFilteredJobs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 24px',
                border: `1px dashed ${colors.border}`,
                borderRadius: 12,
                color: colors.textSecondary
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>
                  No open requisitions found
                </div>
                <div style={{ fontSize: 13 }}>
                  Try changing your search query or switching categories.
                </div>
              </div>
            ) : (
              categoryFilteredJobs.map(job => {
                const isSelected = selectedJob?.id === job.id
                const cleanTitle = cleanJobTitleWithPositionNumber ? cleanJobTitleWithPositionNumber(job.title) : job.title
                const domainName = resolveClientDomainName(job)
                const loc = resolveJobLocation ? resolveJobLocation(job) : (job.work_mode || 'Remote, US')
                const workMode = resolveWorkArrangement(job)
                const localReq = resolveLocalRequirement(job)
                const isExpired = isJobExpired ? isJobExpired(job) : false

                // Color mappings for Work Mode
                const workModeStyles = workMode === 'Remote'
                  ? { bg: isLight ? '#DCFCE7' : '#052E16', text: isLight ? '#15803D' : '#86EFAC', border: isLight ? '#BBF7D0' : '#166534' }
                  : workMode === 'Hybrid'
                  ? { bg: isLight ? '#EDE9FE' : '#2E1065', text: isLight ? '#6D28D9' : '#C4B5FD', border: isLight ? '#DDD6FE' : '#5B21B6' }
                  : { bg: isLight ? '#FEF3C7' : '#451A03', text: isLight ? '#B45309' : '#FDE68A', border: isLight ? '#FDE68A' : '#92400E' }

                // Color mappings for Local Need
                const localStyles = localReq.urgency === 'high'
                  ? { bg: isLight ? '#FEE2E2' : '#450A0A', text: isLight ? '#B91C1C' : '#FCA5A5', border: isLight ? '#FECACA' : '#991B1B' }
                  : localReq.urgency === 'medium'
                  ? { bg: isLight ? '#FFEDD5' : '#431407', text: isLight ? '#C2410C' : '#FDBA74', border: isLight ? '#FED7AA' : '#9A3412' }
                  : localReq.urgency === 'commutable'
                  ? { bg: isLight ? '#F1F5F9' : '#1E293B', text: isLight ? '#334155' : '#CBD5E1', border: isLight ? '#E2E8F0' : '#334155' }
                  : { bg: isLight ? '#E0F2FE' : '#082F49', text: isLight ? '#0369A1' : '#7DD3FC', border: isLight ? '#BAE6FD' : '#075985' }

                return (
                  <div
                    key={job.id}
                    onClick={() => {
                      setSelectedJobId(job.id)
                      if (centerPanelRef.current) {
                        centerPanelRef.current.scrollTop = 0
                      }
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '15px 16px',
                      borderRadius: 12,
                      border: `1.5px solid ${isSelected ? (isLight ? '#0A0E1A' : '#3B82F6') : colors.border}`,
                      borderLeft: isSelected ? `4px solid ${isLight ? '#0A0E1A' : '#3B82F6'}` : `1.5px solid ${colors.border}`,
                      backgroundColor: isSelected ? colors.activeBg : colors.cardBg,
                      cursor: 'pointer',
                      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                      gap: 8,
                      boxShadow: isSelected 
                        ? (isLight ? '0 4px 16px rgba(10, 14, 26, 0.08)' : '0 4px 16px rgba(0,0,0,0.4)')
                        : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = colors.hoverBg
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = isLight ? '0 4px 12px rgba(0,0,0,0.04)' : '0 4px 12px rgba(0,0,0,0.3)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = colors.cardBg
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    {/* Top Row: Avatar, Title & Right Arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                        <CompanyLogo job={job} size={38} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h4 style={{
                            margin: '0 0 2px',
                            fontSize: 14.5,
                            fontWeight: 700,
                            color: colors.textPrimary,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            letterSpacing: '-0.01em'
                          }}>
                            {cleanTitle}
                          </h4>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: isLight ? '#334155' : '#CBD5E1' }}>
                            {domainName}
                          </div>
                        </div>
                      </div>

                      <span style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isSelected ? colors.textPrimary : colors.textMuted
                      }}>
                        →
                      </span>
                    </div>

                    {/* Bottom Row: Work Mode, Location & Local Need Badges (No Rate) */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, paddingTop: 2 }}>
                      {/* Work Mode Badge */}
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2.5px 7px',
                        borderRadius: 6,
                        backgroundColor: workModeStyles.bg,
                        color: workModeStyles.text,
                        border: `1px solid ${workModeStyles.border}`
                      }}>
                        {workMode}
                      </span>

                      {/* Location Badge */}
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2.5px 7px',
                        borderRadius: 6,
                        backgroundColor: colors.badgeBg,
                        color: colors.textPrimary,
                        border: `1px solid ${colors.border}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3
                      }}>
                        <LocationIcon size={11} color={colors.textSecondary} />
                        <span>{loc}</span>
                      </span>

                      {/* Local Need Badge */}
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2.5px 7px',
                        borderRadius: 6,
                        backgroundColor: localStyles.bg,
                        color: localStyles.text,
                        border: `1px solid ${localStyles.border}`
                      }}>
                        {localReq.label}
                      </span>

                      {isExpired && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#DC2626',
                          backgroundColor: isLight ? '#FEE2E2' : '#450A0A',
                          padding: '2px 5px',
                          borderRadius: 4
                        }}>
                          Closed
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* ════════ COLUMN 2: CENTER SPACIOUS WELLFOUND JD VIEW + SIMILAR JOBS ════════ */}
          <div
            ref={centerPanelRef}
            style={{
              maxHeight: 'calc(100vh - 110px)',
              overflowY: 'auto',
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              backgroundColor: colors.cardBg,
              padding: '32px 36px',
              boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.03)' : 'none',
              position: 'sticky',
              top: 84
            }}
          >
            {selectedJob && selDetails ? (
              <div>
                {/* ── 1. WELLFOUND TOP HEADER CARD (EXACT MATCH TO SCREENSHOT 1) ── */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  marginBottom: 18
                }}>
                  {/* Left: Company Logo & Company Name & Tagline */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                    <CompanyLogo job={selectedJob} size={50} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 17,
                          fontWeight: 800,
                          color: colors.textPrimary,
                          letterSpacing: '-0.01em'
                        }}>
                          {selDomain}
                        </span>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#059669',
                          backgroundColor: isLight ? '#ECFDF5' : '#064E3B',
                          padding: '2px 8px',
                          borderRadius: 12
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
                          Actively Hiring
                        </span>
                      </div>
                      <div style={{
                        fontSize: 13,
                        color: colors.textSecondary,
                        marginTop: 3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        Direct client digital architecture and enterprise systems modernization
                      </div>
                    </div>
                  </div>

                  {/* Right: Save Button & Apply Now Button (Exact Screenshot 1) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <button
                      onClick={() => handleToggleSaveJob && handleToggleSaveJob(selectedJob)}
                      style={{
                        backgroundColor: isSaved ? (isLight ? '#FEE2E2' : '#450A0A') : colors.cardBg,
                        color: isSaved ? '#DC2626' : colors.textPrimary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 8,
                        padding: '9px 16px',
                        fontSize: 13.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <BookmarkIcon size={14} filled={isSaved} color={isSaved ? '#DC2626' : 'currentColor'} />
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>

                    <button
                      onClick={() => handleApplyClick && handleApplyClick(selectedJob)}
                      style={{
                        backgroundColor: colors.buttonDark,
                        color: colors.buttonDarkText,
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 22px',
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(10, 14, 26, 0.2)',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      Apply Now
                    </button>
                  </div>
                </div>

                {/* ── 2. JOB TITLE & METADATA LINE ── */}
                <h1 style={{
                  fontSize: 27,
                  fontWeight: 900,
                  color: colors.textPrimary,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.25,
                  margin: '0 0 10px'
                }}>
                  {selCleanTitle}
                </h1>

                {/* Subtitle Metadata: Work Mode | Exp | Contract | Req ID */}
                <div style={{
                  fontSize: 14.5,
                  color: colors.textSecondary,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 8
                }}>
                  <span>{selWorkMode} ({selLoc})</span>
                  <span>•</span>
                  <span>{formatExperience ? formatExperience(selectedJob) : '4+ years of exp'}</span>
                  <span>•</span>
                  <span>{formatContractType ? formatContractType(selectedJob) : 'Contract'}</span>
                  <span>•</span>
                  <span>Req #{resolveReqId ? resolveReqId(selectedJob.id, selectedJob) : selectedJob.id}</span>
                </div>

                {/* Posted Status Line */}
                <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 14 }}>
                  Posted: 2 days ago • Recruiter recently active
                </div>

                {/* Timezone Post Clocks */}
                {getJobPostTimezones && (
                  <div style={{
                    backgroundColor: colors.subtleBg,
                    borderRadius: 8,
                    padding: '8px 12px',
                    display: 'inline-flex',
                    gap: 16,
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginBottom: 20,
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ClockIcon size={14} color={colors.textSecondary} />
                      <span><strong>EST:</strong> {getJobPostTimezones(selectedJob).EST}</span>
                    </div>
                    <span><strong>CST:</strong> {getJobPostTimezones(selectedJob).CST}</span>
                    <span><strong>PST:</strong> {getJobPostTimezones(selectedJob).PST}</span>
                  </div>
                )}

                {/* Horizontal Divider */}
                <div style={{ borderBottom: `1px solid ${colors.borderLight}`, margin: '14px 0 24px' }} />

                {/* ── 3. 2-COLUMN ATTRIBUTE MATRIX (EXACT MATCH TO SCREENSHOT 1) ── */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '24px 32px',
                  marginBottom: 28
                }}>
                  {/* Left Column Attributes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>
                        Hires remotely in
                      </div>
                      <div style={{ fontSize: 14.5, color: colors.textSecondary, fontWeight: 500 }}>
                        {selWorkMode === 'Remote' ? 'Everywhere (US)' : `${selLoc} & Commutable Regions`}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>
                        Company Location
                      </div>
                      <div style={{ fontSize: 14.5, color: colors.textSecondary, fontWeight: 500 }}>
                        {selLoc}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>
                        Relocation
                      </div>
                      <div style={{ fontSize: 14.5, color: colors.textSecondary, fontWeight: 500 }}>
                        {selLocalReq.isLocalNeeded ? 'Not Allowed (Local Residing Only)' : 'Not Required'}
                      </div>
                    </div>

                    {/* Hiring Contact Block */}
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary, marginBottom: 8 }}>
                        Hiring contact
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 42,
                          height: 42,
                          borderRadius: 8,
                          backgroundColor: '#1E293B',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 14,
                          flexShrink: 0
                        }}>
                          {selRecruiter?.initials || 'ST'}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>
                            {selRecruiter?.name || 'Sarah J. Thorne'}
                          </div>
                          <div style={{ fontSize: 12.5, color: colors.textSecondary }}>
                            {selRecruiter?.role || 'Employee / Talent Partner'}
                          </div>
                          <div style={{ fontSize: 12, color: colors.textMuted }}>
                            {selRecruiter?.location || selLoc}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column Attributes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>
                        Remote Work Policy
                      </div>
                      <div style={{ fontSize: 14.5, color: colors.textSecondary, fontWeight: 500 }}>
                        {selWorkMode === 'Remote' 
                          ? 'Remote only' 
                          : selWorkMode === 'Hybrid' 
                          ? 'Hybrid (2-3 days onsite / week)' 
                          : 'Onsite in office'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>
                        Visa Sponsorship
                      </div>
                      <div style={{ fontSize: 14.5, color: colors.textSecondary, fontWeight: 500 }}>
                        {selLocalReq.urgency === 'high' 
                          ? 'Not Available (US Citizen / Green Card Required)' 
                          : 'Available / All Authorizations Considered'}
                      </div>
                    </div>

                    {/* Skills Pills (Matching Soft Purple Rounded Pills from Screenshot 1) */}
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary, marginBottom: 8 }}>
                        Skills
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {(selDetails?.rawSkills || []).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            style={{
                              display: 'inline-block',
                              fontSize: 12.5,
                              fontWeight: 600,
                              padding: '5px 12px',
                              borderRadius: 20,
                              backgroundColor: isLight ? '#F1F0FB' : '#2E1065',
                              color: isLight ? '#581C87' : '#DDD6FE',
                              border: `1px solid ${isLight ? '#E9D5FF' : '#4C1D95'}`
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Horizontal Divider */}
                <div style={{ borderBottom: `1px solid ${colors.borderLight}`, margin: '24px 0' }} />

                {/* ── 4. "ABOUT THE JOB" SECTION (EXACT MATCH TO SCREENSHOT 2) ── */}
                <div>
                  <h2 style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: colors.textPrimary,
                    margin: '0 0 22px',
                    letterSpacing: '-0.025em'
                  }}>
                    About the job
                  </h2>

                  {/* Section: About Company */}
                  <div style={{ marginBottom: 22 }}>
                    <h3 style={{
                      fontSize: 15.5,
                      fontWeight: 800,
                      color: colors.textPrimary,
                      margin: '0 0 8px'
                    }}>
                      About {selDomain}:
                    </h3>
                    <p style={{
                      fontSize: 14.5,
                      lineHeight: 1.85,
                      color: isLight ? '#374151' : '#D1D5DB',
                      margin: 0
                    }}>
                      {selDetails?.aboutCompany}
                    </p>
                  </div>

                  {/* Section: About The Role */}
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{
                      fontSize: 15.5,
                      fontWeight: 800,
                      color: colors.textPrimary,
                      margin: '0 0 8px'
                    }}>
                      About The Role:
                    </h3>
                    <p style={{
                      fontSize: 14.5,
                      lineHeight: 1.85,
                      color: isLight ? '#374151' : '#D1D5DB',
                      margin: 0
                    }}>
                      {selDetails?.aboutRole}
                    </p>
                  </div>

                  {/* Section: What You Will Do */}
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{
                      fontSize: 15.5,
                      fontWeight: 800,
                      color: colors.textPrimary,
                      margin: '0 0 12px'
                    }}>
                      What You Will Do:
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {selDetails?.whatYouWillDo.map((item, wIdx) => (
                        <div key={wIdx} style={{
                          fontSize: 14.5,
                          lineHeight: 1.8,
                          color: isLight ? '#374151' : '#D1D5DB'
                        }}>
                          <strong style={{ color: colors.textPrimary, fontWeight: 700 }}>
                            {item.title}{' '}
                          </strong>
                          {item.description}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section: What You'll Need */}
                  <div style={{ marginBottom: 26 }}>
                    <h3 style={{
                      fontSize: 15.5,
                      fontWeight: 800,
                      color: colors.textPrimary,
                      margin: '0 0 10px'
                    }}>
                      What You'll Need:
                    </h3>
                    <ul style={{
                      margin: 0,
                      paddingLeft: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}>
                      {selDetails?.whatYouNeed.map((need, nIdx) => (
                        <li key={nIdx} style={{
                          fontSize: 14.5,
                          lineHeight: 1.8,
                          color: isLight ? '#374151' : '#D1D5DB'
                        }}>
                          {need}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Additional Original JD Notes if present */}
                  {selectedJob?.description && selectedJob.description.length > 300 && (
                    <div style={{
                      backgroundColor: colors.subtleBg,
                      border: `1px solid ${colors.borderLight}`,
                      borderRadius: 10,
                      padding: '16px 20px',
                      marginBottom: 26
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: colors.textSecondary, marginBottom: 8, letterSpacing: '0.04em' }}>
                        TECHNICAL SPECIFICATIONS & CLIENT DETAILS
                      </div>
                      <div style={{
                        fontSize: 13.5,
                        lineHeight: 1.7,
                        color: colors.textSecondary,
                        whiteSpace: 'pre-wrap',
                        maxHeight: 280,
                        overflowY: 'auto'
                      }}>
                        {getFullDescriptionText ? getFullDescriptionText(selectedJob) : selectedJob.description}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── 5. BOTTOM PROMINENT APPLY ACTION BAR ── */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                  borderTop: `1px solid ${colors.border}`,
                  paddingTop: 24,
                  marginBottom: 28
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: colors.textSecondary, fontWeight: 500 }}>
                      Direct Client Requisition · Fast Recruiter Review
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: colors.textPrimary }}>
                      Ready to submit your application?
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyClick && handleApplyClick(selectedJob)}
                    style={{
                      backgroundColor: colors.buttonDark,
                      color: colors.buttonDarkText,
                      border: 'none',
                      borderRadius: 8,
                      padding: '12px 28px',
                      fontSize: 14.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(10, 14, 26, 0.25)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <span>Apply for this position</span>
                    <span>→</span>
                  </button>
                </div>

                {/* ── 6. SIMILAR JOBS FOOTER (BOTEM MAI SIMILER) ── */}
                {similarJobsList.length > 0 && (
                  <div style={{
                    borderTop: `1px solid ${colors.border}`,
                    paddingTop: 24
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: 800,
                        color: colors.textPrimary,
                        letterSpacing: '-0.01em'
                      }}>
                        Similar jobs you may be interested in
                      </h4>
                      <span style={{ fontSize: 12, color: colors.textSecondary }}>
                        Matched by domain & skills
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 12
                    }}>
                      {similarJobsList.map(simJob => (
                        <div
                          key={simJob.id}
                          onClick={() => {
                            setSelectedJobId(simJob.id)
                            if (centerPanelRef.current) {
                              centerPanelRef.current.scrollTop = 0
                            }
                          }}
                          style={{
                            border: `1px solid ${colors.border}`,
                            borderRadius: 10,
                            padding: 14,
                            backgroundColor: colors.subtleBg,
                            cursor: 'pointer',
                            transition: 'all 0.18s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = colors.activeBorder
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = isLight ? '0 6px 14px rgba(0,0,0,0.04)' : '0 6px 14px rgba(0,0,0,0.3)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.border
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        >
                          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                            <span style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              backgroundColor: isLight ? '#E0F2FE' : '#082F49',
                              color: '#0369A1',
                              padding: '2px 6px',
                              borderRadius: 4
                            }}>
                              {resolveWorkArrangement(simJob)}
                            </span>
                            <span style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              backgroundColor: resolveLocalRequirement(simJob).isLocalNeeded
                                ? (isLight ? '#FEE2E2' : '#450A0A')
                                : (isLight ? '#DCFCE7' : '#052E16'),
                              color: resolveLocalRequirement(simJob).isLocalNeeded
                                ? (isLight ? '#B91C1C' : '#FCA5A5')
                                : (isLight ? '#15803D' : '#86EFAC'),
                              padding: '2px 6px',
                              borderRadius: 4
                            }}>
                              {resolveLocalRequirement(simJob).label}
                            </span>
                          </div>

                          <div style={{
                            fontSize: 13.5,
                            fontWeight: 700,
                            color: colors.textPrimary,
                            marginBottom: 4,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {cleanJobTitleWithPositionNumber ? cleanJobTitleWithPositionNumber(simJob.title) : simJob.title}
                          </div>

                          <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>
                            📍 {resolveJobLocation ? resolveJobLocation(simJob) : (simJob.work_mode || 'Remote, US')}
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#2065D1'
                          }}>
                            View Details →
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textSecondary }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>💼</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>
                  Select a requisition on the left
                </div>
                <div style={{ fontSize: 13 }}>
                  Click any job to view its full responsibilities, requirements, and submit your profile.
                </div>
              </div>
            )}
          </div>

          {/* ════════ COLUMN 3: RIGHT ADSENSE & HIGHLIGHTS SIDEBAR (RIGHT SIDE MAI ADD) ════════ */}
          <div className="wellfound-sidebar-ads" style={{
            position: 'sticky',
            top: 84,
            gap: 16
          }}>
            {/* AdSense Unit 1: Sponsored Display Box */}
            <div style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              backgroundColor: colors.cardBg,
              padding: 16,
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: colors.textMuted,
                textTransform: 'uppercase',
                marginBottom: 10
              }}>
                SPONSORED / ADVERTISEMENT
              </div>

              {/* Google AdSense Responsive Unit */}
              <div style={{
                minHeight: 180,
                backgroundColor: isLight ? '#F9FAFB' : '#171F2C',
                borderRadius: 10,
                border: `1px dashed ${colors.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 14,
                gap: 8
              }}>
                <ins
                  className="adsbygoogle"
                  style={{ display: 'block', width: '100%', height: 140 }}
                  data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                  data-ad-slot="9876543210"
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                />
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.textPrimary }}>
                  Direct Fortune 500 Contracts
                </div>
                <div style={{ fontSize: 11.5, color: colors.textSecondary, lineHeight: 1.4 }}>
                  Fast-track your application with priority recruiter review.
                </div>
              </div>
            </div>

            {/* Checklist Card: "Level up your job search" (Reference Card) */}
            <div style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              backgroundColor: colors.cardBg,
              padding: 20,
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none'
            }}>
              <h3 style={{
                fontSize: 15,
                fontWeight: 800,
                color: colors.textPrimary,
                margin: '0 0 4px',
                letterSpacing: '-0.01em'
              }}>
                Level up your job search
              </h3>
              <p style={{
                fontSize: 12.5,
                color: colors.textSecondary,
                margin: '0 0 16px',
                lineHeight: 1.4
              }}>
                Why top professionals apply directly through SmartHire:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircleIcon size={16} color="#10B981" />
                  <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600, lineHeight: 1.3 }}>
                    Verified Direct Client contracts only
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircleIcon size={16} color="#10B981" />
                  <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600, lineHeight: 1.3 }}>
                    Zero third-party markups or rate cuts
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircleIcon size={16} color="#10B981" />
                  <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600, lineHeight: 1.3 }}>
                    Instant ATS parsing & skill matching
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircleIcon size={16} color="#10B981" />
                  <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600, lineHeight: 1.3 }}>
                    Fast-track recruiter review in 24h
                  </div>
                </div>
              </div>
            </div>

            {/* AdSense Unit 2: Career Partner Spotlight */}
            <div style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              backgroundColor: colors.cardBg,
              padding: 16,
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: colors.textMuted,
                textTransform: 'uppercase',
                marginBottom: 10
              }}>
                CAREER PARTNER SPOTLIGHT
              </div>

              <div style={{
                minHeight: 120,
                backgroundColor: isLight ? '#F9FAFB' : '#171F2C',
                borderRadius: 10,
                border: `1px dashed ${colors.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 12,
                gap: 6
              }}>
                <ins
                  className="adsbygoogle"
                  style={{ display: 'block', width: '100%', height: 90 }}
                  data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                  data-ad-slot="1234567890"
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                />
                <div style={{ fontSize: 11.5, color: colors.textSecondary }}>
                  Explore verified enterprise staffing opportunities
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. WELLFOUND FOOTER ─────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${colors.border}`,
        backgroundColor: colors.cardBg,
        padding: '36px 24px 50px'
      }}>
        <div style={{
          maxWidth: 1560,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20
        }}>
          <div>
            <span style={{ fontSize: 20, fontWeight: 900, color: colors.textPrimary }}>
              smarthire<span style={{ color: colors.accentCoral }}>:</span>
            </span>
            <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
              Direct-client IT requisition ecosystem & applicant tracking platform.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: colors.textSecondary }}>
            <Link to="/about" style={{ textDecoration: 'none', color: 'inherit' }}>About</Link>
            <Link to="/privacy" style={{ textDecoration: 'none', color: 'inherit' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ textDecoration: 'none', color: 'inherit' }}>Terms of Service</Link>
            <Link to="/contact" style={{ textDecoration: 'none', color: 'inherit' }}>Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
