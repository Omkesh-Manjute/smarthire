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

// ─── Dynamic Company Logo Colors ───────────────────────────────────────────
const LOGO_PALETTES = [
  { bg: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #047857 0%, #10B981 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #C2410C 0%, #F97316 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #BE185D 0%, #EC4899 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #1E293B 0%, #0284C7 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #B91C1C 0%, #EF4444 100%)', fg: '#FFFFFF' }
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
      borderRadius: 10,
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
      boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
    }}>
      {letters || 'IT'}
    </div>
  )
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
  layoutView = 'wellfound',
  handleSetLayoutView,
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

  // Selected Job for the Right-Side Full JD Panel
  const [selectedJobId, setSelectedJobId] = useState(null)
  const rightPanelRef = useRef(null)

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
  const handleTrendingCardClick = (categoryKey, term) => {
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

  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      backgroundColor: colors.bg,
      color: colors.textPrimary,
      minHeight: '100vh',
      transition: 'background-color 0.2s, color 0.2s'
    }}>
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
          maxWidth: 1400,
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
              <Link
                to="/about"
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: colors.textSecondary,
                  padding: '6px 12px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  transition: 'color 0.15s'
                }}
              >
                Why SmartHire
              </Link>
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
                Jobs
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
              <button
                onClick={() => {
                  setActiveCategoryFilter('cloud')
                  const el = document.getElementById('wellfound-split-workspace')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  background: activeCategoryFilter === 'cloud' ? (isLight ? '#F3F4F6' : '#1F2937') : 'transparent',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: activeCategoryFilter === 'cloud' ? 700 : 500,
                  color: colors.textSecondary,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Direct Client
              </button>
              <Link
                to="/ats"
                style={{
                  fontSize: 14,
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

          {/* Right Header Controls: Layout Switcher, Theme Toggle & Top Auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Multi-view layout dropdown switcher */}
            {handleSetLayoutView && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: colors.badgeBg, padding: '3px 5px', borderRadius: 8 }}>
                <button
                  onClick={() => handleSetLayoutView('wellfound')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11.5,
                    fontWeight: layoutView === 'wellfound' ? 700 : 500,
                    backgroundColor: layoutView === 'wellfound' ? (isLight ? '#FFFFFF' : '#374151') : 'transparent',
                    color: layoutView === 'wellfound' ? colors.textPrimary : colors.textSecondary,
                    cursor: 'pointer',
                    boxShadow: layoutView === 'wellfound' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                  title="Wellfound Modern View"
                >
                  Wellfound
                </button>
                <button
                  onClick={() => handleSetLayoutView('split')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11.5,
                    fontWeight: layoutView === 'split' ? 700 : 500,
                    backgroundColor: layoutView === 'split' ? (isLight ? '#FFFFFF' : '#374151') : 'transparent',
                    color: layoutView === 'split' ? colors.textPrimary : colors.textSecondary,
                    cursor: 'pointer',
                    boxShadow: layoutView === 'split' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                  title="LinkedIn Split View"
                >
                  Split
                </button>
                <button
                  onClick={() => handleSetLayoutView('zone')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11.5,
                    fontWeight: layoutView === 'zone' ? 700 : 500,
                    backgroundColor: layoutView === 'zone' ? (isLight ? '#FFFFFF' : '#374151') : 'transparent',
                    color: layoutView === 'zone' ? colors.textPrimary : colors.textSecondary,
                    cursor: 'pointer',
                    boxShadow: layoutView === 'zone' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                  title="Zone Cards"
                >
                  Zone
                </button>
                <button
                  onClick={() => handleSetLayoutView('classic')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11.5,
                    fontWeight: layoutView === 'classic' ? 700 : 500,
                    backgroundColor: layoutView === 'classic' ? (isLight ? '#FFFFFF' : '#374151') : 'transparent',
                    color: layoutView === 'classic' ? colors.textPrimary : colors.textSecondary,
                    cursor: 'pointer',
                    boxShadow: layoutView === 'classic' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                  title="Classic Table"
                >
                  Classic
                </button>
              </div>
            )}

            {/* Dark/Light mode toggle */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                style={{
                  background: 'none',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: colors.textSecondary,
                  fontSize: 15
                }}
                title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {isLight ? '🌙' : '☀️'}
              </button>
            )}

            {/* Candidate Authentication Controls in Top Bar */}
            {candidateUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 12px 4px 6px',
                  borderRadius: 24,
                  backgroundColor: colors.badgeBg,
                  border: `1px solid ${colors.border}`
                }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: '#2065D1',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700
                  }}>
                    {(candidateUser.name || candidateUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>
                    {candidateUser.name || candidateUser.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={handleCandidateSignOut}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.textSecondary,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '6px 8px'
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => setShowLoginModal && setShowLoginModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    color: colors.textPrimary,
                    cursor: 'pointer',
                    padding: '8px 12px'
                  }}
                >
                  Log in
                </button>
                <button
                  onClick={() => setShowLoginModal && setShowLoginModal(true)}
                  style={{
                    backgroundColor: colors.buttonDark,
                    color: colors.buttonDarkText,
                    border: 'none',
                    borderRadius: 24,
                    fontSize: 14,
                    fontWeight: 600,
                    padding: '9px 18px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  Create profile
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── 2. WELLFOUND HERO SECTION (media_1789654471631.png) ──────────── */}
      <section style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '48px 24px 28px',
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
          marginBottom: 14
        }}>
          OVER 100+ VERIFIED DIRECT-CLIENT IT REQUISITIONS
        </div>

        {/* Main Headline */}
        <h1 style={{
          fontSize: 'clamp(34px, 5vw, 54px)',
          fontWeight: 900,
          letterSpacing: '-0.035em',
          color: colors.textPrimary,
          margin: '0 0 28px',
          lineHeight: 1.1
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
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = isLight ? '0 14px 30px rgba(0, 0, 0, 0.08)' : '0 14px 30px rgba(0, 0, 0, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = isLight ? '0 10px 25px rgba(0, 0, 0, 0.05)' : '0 10px 25px rgba(0, 0, 0, 0.3)'
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
              placeholder="Location (e.g. Remote, NC, VA)"
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
              transition: 'transform 0.15s ease, opacity 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)'
              e.currentTarget.style.opacity = '0.92'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.opacity = '1'
            }}
          >
            Search
          </button>
        </form>
      </section>

      {/* ─── 3. "TRENDING DIRECT CLIENTS" 3-CARD INTERACTIVE GRID ─────────── */}
      <section style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '16px 24px 36px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{
            fontSize: 22,
            fontWeight: 800,
            color: colors.textPrimary,
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Trending direct clients hiring now
          </h2>
          <span style={{ fontSize: 13, color: colors.textSecondary, fontWeight: 500 }}>
            Click a client to filter opportunities
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20
        }}>
          {/* Card 1: Enterprise Cloud & AI */}
          <div
            onClick={() => handleTrendingCardClick('cloud', 'Cloud')}
            style={{
              border: `1.5px solid ${activeCategoryFilter === 'cloud' ? colors.activeBorder : colors.border}`,
              borderRadius: 14,
              backgroundColor: activeCategoryFilter === 'cloud' ? colors.activeBg : colors.cardBg,
              padding: 22,
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
              e.currentTarget.style.borderColor = colors.activeBorder
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none'
              if (activeCategoryFilter !== 'cloud') {
                e.currentTarget.style.borderColor = colors.border
              }
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 16
                }}>
                  EA
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>
                    Enterprise Cloud & AI
                  </h3>
                  <div style={{ fontSize: 12.5, color: colors.textSecondary }}>State & Enterprise Infrastructure</div>
                </div>
              </div>

              <p style={{ fontSize: 13.5, color: colors.textSecondary, lineHeight: 1.5, margin: '0 0 14px' }}>
                Modernizing state cloud infrastructures with AWS, Azure microservices, and high-security automated data pipelines.
              </p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: isLight ? '#FCE7F3' : '#371B2B', color: '#BE185D' }}>
                  Cloud Arch
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                  AWS / Azure
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                  Remote Available
                </span>
              </div>
            </div>

            <div style={{
              borderTop: `1px solid ${colors.borderLight}`,
              paddingTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13.5,
              fontWeight: 700,
              color: colors.textPrimary
            }}>
              <span>View Open Positions</span>
              <ChevronRightIcon size={14} color={colors.textPrimary} />
            </div>
          </div>

          {/* Card 2: State Healthcare Systems */}
          <div
            onClick={() => handleTrendingCardClick('health', 'Health')}
            style={{
              border: `1.5px solid ${activeCategoryFilter === 'health' ? colors.activeBorder : colors.border}`,
              borderRadius: 14,
              backgroundColor: activeCategoryFilter === 'health' ? colors.activeBg : colors.cardBg,
              padding: 22,
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
              e.currentTarget.style.borderColor = colors.activeBorder
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none'
              if (activeCategoryFilter !== 'health') {
                e.currentTarget.style.borderColor = colors.border
              }
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 16
                }}>
                  SH
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>
                    State Healthcare Systems
                  </h3>
                  <div style={{ fontSize: 12.5, color: colors.textSecondary }}>Public Health Agency</div>
                </div>
              </div>

              <p style={{ fontSize: 13.5, color: colors.textSecondary, lineHeight: 1.5, margin: '0 0 14px' }}>
                Empowers statewide public health initiatives, child welfare portals, and Medicaid management systems.
              </p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: isLight ? '#DBEAFE' : '#1E3A8A', color: '#1D4ED8' }}>
                  Public Sector
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                  Healthcare IT
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                  Long-term
                </span>
              </div>
            </div>

            <div style={{
              borderTop: `1px solid ${colors.borderLight}`,
              paddingTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13.5,
              fontWeight: 700,
              color: colors.textPrimary
            }}>
              <span>View Open Positions</span>
              <ChevronRightIcon size={14} color={colors.textPrimary} />
            </div>
          </div>

          {/* Card 3: Digital Platform Solutions */}
          <div
            onClick={() => handleTrendingCardClick('dev', 'Developer')}
            style={{
              border: `1.5px solid ${activeCategoryFilter === 'dev' ? colors.activeBorder : colors.border}`,
              borderRadius: 14,
              backgroundColor: activeCategoryFilter === 'dev' ? colors.activeBg : colors.cardBg,
              padding: 22,
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
              e.currentTarget.style.borderColor = colors.activeBorder
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none'
              if (activeCategoryFilter !== 'dev') {
                e.currentTarget.style.borderColor = colors.border
              }
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #047857 0%, #10B981 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 16
                }}>
                  DP
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>
                    Digital Platform Solutions
                  </h3>
                  <div style={{ fontSize: 12.5, color: colors.textSecondary }}>Enterprise Modernization</div>
                </div>
              </div>

              <p style={{ fontSize: 13.5, color: colors.textSecondary, lineHeight: 1.5, margin: '0 0 14px' }}>
                Full-stack software engineering, modern React/Node interfaces, and resilient backend microservices.
              </p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: isLight ? '#D1FAE5' : '#064E3B', color: '#047857' }}>
                  Full Stack
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                  Enterprise
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                  Hybrid / Onsite
                </span>
              </div>
            </div>

            <div style={{
              borderTop: `1px solid ${colors.borderLight}`,
              paddingTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13.5,
              fontWeight: 700,
              color: colors.textPrimary
            }}>
              <span>View Open Positions</span>
              <ChevronRightIcon size={14} color={colors.textPrimary} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. INTEGRATED SPLIT VIEW WORKSPACE (LEFT REQS + RIGHT FULL JD) ─ */}
      <section id="wellfound-split-workspace" style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '8px 24px 64px'
      }}>
        {/* Category Filter Pills Ribbon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 16,
          marginBottom: 16,
          borderBottom: `1px solid ${colors.borderLight}`
        }}>
          <button
            onClick={() => setActiveCategoryFilter('all')}
            style={{
              padding: '7px 16px',
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
              padding: '7px 16px',
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
              padding: '7px 16px',
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
              padding: '7px 16px',
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
              padding: '7px 16px',
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
              padding: '7px 16px',
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

        {/* ── SPLIT VIEW GRID: LEFT JOB FEED (46%) + RIGHT FULL JD DOSSIER (54%) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(360px, 490px) minmax(0, 1fr)',
          gap: 24,
          alignItems: 'start'
        }}>
          {/* ──── LEFT COLUMN: REQUISITIONS FEED ──── */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
            paddingRight: 6
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
                      if (rightPanelRef.current) {
                        rightPanelRef.current.scrollTop = 0
                      }
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '16px 18px',
                      borderRadius: 12,
                      border: `1.5px solid ${isSelected ? colors.activeBorder : colors.border}`,
                      borderLeft: isSelected ? `5px solid ${isLight ? '#0A0E1A' : '#3B82F6'}` : `1.5px solid ${colors.border}`,
                      backgroundColor: isSelected ? colors.activeBg : colors.cardBg,
                      cursor: 'pointer',
                      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                      gap: 10,
                      boxShadow: isSelected 
                        ? (isLight ? '0 6px 18px rgba(32, 101, 209, 0.08)' : '0 6px 18px rgba(0,0,0,0.4)')
                        : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = colors.hoverBg
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = isLight ? '0 4px 14px rgba(0,0,0,0.04)' : '0 4px 14px rgba(0,0,0,0.3)'
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
                    {/* Top Row: Avatar, Title & "View Job" Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                        <CompanyLogo job={job} size={40} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h4 style={{
                            margin: '0 0 2px',
                            fontSize: 15.5,
                            fontWeight: 700,
                            color: colors.textPrimary,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            letterSpacing: '-0.01em'
                          }}>
                            {cleanTitle}
                          </h4>
                          <div style={{ fontSize: 13, fontWeight: 600, color: isLight ? '#1E293B' : '#E2E8F0' }}>
                            {domainName}
                          </div>
                        </div>
                      </div>

                      {/* Right Action: "View Job" */}
                      <button
                        style={{
                          padding: '6px 14px',
                          borderRadius: 6,
                          border: `1px solid ${isSelected ? (isLight ? '#0A0E1A' : '#3B82F6') : colors.border}`,
                          backgroundColor: isSelected ? colors.buttonDark : (isLight ? '#FFFFFF' : '#1F2937'),
                          color: isSelected ? colors.buttonDarkText : colors.textPrimary,
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          flexShrink: 0
                        }}
                      >
                        <span>View Job</span>
                        <span>→</span>
                      </button>
                    </div>

                    {/* Middle Row: Work Mode, Location & Local Need Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, paddingTop: 2 }}>
                      {/* Work Mode Badge */}
                      <span style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        backgroundColor: workModeStyles.bg,
                        color: workModeStyles.text,
                        border: `1px solid ${workModeStyles.border}`
                      }}>
                        {workMode}
                      </span>

                      {/* Location Badge */}
                      <span style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 6,
                        backgroundColor: colors.badgeBg,
                        color: colors.textPrimary,
                        border: `1px solid ${colors.border}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <LocationIcon size={12} color={colors.textSecondary} />
                        <span>{loc}</span>
                      </span>

                      {/* Local Need Badge */}
                      <span style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        backgroundColor: localStyles.bg,
                        color: localStyles.text,
                        border: `1px solid ${localStyles.border}`
                      }}>
                        {localReq.label}
                      </span>

                      {isExpired && (
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: '#DC2626',
                          backgroundColor: isLight ? '#FEE2E2' : '#450A0A',
                          padding: '2px 6px',
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

          {/* ──── RIGHT COLUMN: FULL JOB DESCRIPTION (RIGHT PANEL DOSSIER) ──── */}
          <div
            ref={rightPanelRef}
            style={{
              position: 'sticky',
              top: 88,
              maxHeight: 'calc(100vh - 110px)',
              overflowY: 'auto',
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              backgroundColor: colors.cardBg,
              padding: 28,
              boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.03)' : 'none'
            }}
          >
            {selectedJob ? (
              <div>
                {/* 1. Google AdSense Slot at Top of JD Panel */}
                <div style={{
                  border: `1px dashed ${colors.border}`,
                  borderRadius: 10,
                  backgroundColor: isLight ? '#FAFAFA' : '#171F2C',
                  padding: 12,
                  marginBottom: 20,
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: colors.textMuted,
                    textTransform: 'uppercase',
                    marginBottom: 6
                  }}>
                    SPONSORED / ADVERTISEMENT
                  </div>
                  <ins
                    className="adsbygoogle"
                    style={{ display: 'block', width: '100%', height: 90 }}
                    data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                    data-ad-slot="9876543210"
                    data-ad-format="horizontal"
                    data-full-width-responsive="true"
                  />
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                    💼 Direct Fortune 500 & State Contracts with Fast-Track Recruiter Review
                  </div>
                </div>

                {/* 2. Job Title, Badges & Apply Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
                  <div>
                    {/* Work Mode & Location Badges */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        backgroundColor: isLight ? '#DCFCE7' : '#052E16',
                        color: isLight ? '#15803D' : '#86EFAC',
                        padding: '4px 10px',
                        borderRadius: 6
                      }}>
                        {resolveWorkArrangement(selectedJob)}
                      </span>

                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        backgroundColor: colors.badgeBg,
                        color: colors.textPrimary,
                        padding: '4px 10px',
                        borderRadius: 6
                      }}>
                        📍 {resolveJobLocation ? resolveJobLocation(selectedJob) : (selectedJob.work_mode || 'Remote, US')}
                      </span>

                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        backgroundColor: resolveLocalRequirement(selectedJob).isLocalNeeded
                          ? (isLight ? '#FEE2E2' : '#450A0A')
                          : (isLight ? '#E0F2FE' : '#082F49'),
                        color: resolveLocalRequirement(selectedJob).isLocalNeeded
                          ? (isLight ? '#B91C1C' : '#FCA5A5')
                          : (isLight ? '#0369A1' : '#7DD3FC'),
                        padding: '4px 10px',
                        borderRadius: 6
                      }}>
                        {resolveLocalRequirement(selectedJob).label}
                      </span>

                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        backgroundColor: colors.badgeBg,
                        color: colors.textSecondary,
                        padding: '4px 10px',
                        borderRadius: 6
                      }}>
                        Req #{resolveReqId ? resolveReqId(selectedJob.id, selectedJob) : selectedJob.id}
                      </span>
                    </div>

                    <h2 style={{
                      fontSize: 25,
                      fontWeight: 800,
                      color: colors.textPrimary,
                      margin: '0 0 6px',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.25
                    }}>
                      {cleanJobTitleWithPositionNumber ? cleanJobTitleWithPositionNumber(selectedJob.title) : selectedJob.title}
                    </h2>

                    <div style={{ fontSize: 14.5, fontWeight: 700, color: isLight ? '#1E293B' : '#E2E8F0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{resolveClientDomainName(selectedJob)}</span>
                    </div>
                  </div>

                  {/* Top Apply Button */}
                  <button
                    onClick={() => handleApplyClick && handleApplyClick(selectedJob)}
                    style={{
                      backgroundColor: colors.buttonDark,
                      color: colors.buttonDarkText,
                      border: 'none',
                      borderRadius: 8,
                      padding: '12px 24px',
                      fontSize: 14.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      flexShrink: 0,
                      boxShadow: '0 4px 14px rgba(10, 14, 26, 0.25)',
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

                {/* Timezone Post Clocks */}
                {getJobPostTimezones && (
                  <div style={{
                    backgroundColor: colors.subtleBg,
                    borderRadius: 8,
                    padding: '8px 12px',
                    display: 'flex',
                    gap: 16,
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginBottom: 22,
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

                {/* 3. Full Job Description Body */}
                <div style={{
                  fontSize: 14,
                  lineHeight: 1.75,
                  color: colors.textPrimary,
                  whiteSpace: 'pre-wrap',
                  borderTop: `1px solid ${colors.borderLight}`,
                  paddingTop: 18,
                  marginBottom: 24
                }}>
                  {getFullDescriptionText ? getFullDescriptionText(selectedJob) : (selectedJob.rawDescription || selectedJob.description || '')}
                </div>

                {/* 4. Required Skills */}
                {Array.isArray(selectedJob.skills) && selectedJob.skills.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: colors.textSecondary, marginBottom: 10, letterSpacing: '0.05em' }}>
                      REQUIRED SKILLS & TECHNOLOGIES
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {selectedJob.skills.map((s, i) => (
                        <span key={i} style={{
                          fontSize: 12,
                          fontWeight: 700,
                          backgroundColor: colors.subtleBg,
                          color: isLight ? '#1E293B' : '#E2E8F0',
                          border: `1px solid ${colors.border}`,
                          padding: '4px 10px',
                          borderRadius: 6
                        }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Bottom Prominent Apply Action Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                  borderTop: `1px solid ${colors.border}`,
                  paddingTop: 22,
                  marginBottom: 26
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
                      padding: '13px 30px',
                      fontSize: 15,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(10, 14, 26, 0.3)',
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

                {/* 6. Similar Jobs Recommendations Footer */}
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
                            if (rightPanelRef.current) {
                              rightPanelRef.current.scrollTop = 0
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
        </div>
      </section>

      {/* ─── 5. WELLFOUND FOOTER ─────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${colors.border}`,
        backgroundColor: colors.cardBg,
        padding: '36px 24px 50px'
      }}>
        <div style={{
          maxWidth: 1400,
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
