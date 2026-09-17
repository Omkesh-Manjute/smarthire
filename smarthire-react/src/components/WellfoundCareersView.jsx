import React, { useState, useMemo } from 'react'
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

function LocationIcon({ size = 18, color = '#6B7280' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ChevronRightIcon({ size = 14, color = '#111827' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function CheckCircleIcon({ size = 18, color = '#00A76F' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function BriefcaseIcon({ size = 18, color = '#2065D1' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}

function TargetIcon({ size = 18, color = '#F43F5E' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function SlidersIcon({ size = 18, color = '#8B5CF6' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  )
}

function AwardIcon({ size = 18, color = '#10B981' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  )
}

// ─── Dynamic Modern Company Logo Generator ──────────────────────────────────
const LOGO_PALETTES = [
  { bg: '#0F172A', fg: '#FFFFFF' },
  { bg: '#10B981', fg: '#FFFFFF' },
  { bg: '#F97316', fg: '#FFFFFF' },
  { bg: '#8B5CF6', fg: '#FFFFFF' },
  { bg: '#2563EB', fg: '#FFFFFF' },
  { bg: '#EC4899', fg: '#FFFFFF' },
  { bg: '#0D9488', fg: '#FFFFFF' },
  { bg: '#1E293B', fg: '#38BDF8' },
  { bg: '#DC2626', fg: '#FFFFFF' }
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
      borderRadius: 9,
      backgroundColor: palette.bg,
      color: palette.fg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: Math.round(size * 0.38),
      fontWeight: 800,
      letterSpacing: '-0.02em',
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
      flexShrink: 0,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
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
  getFullDescriptionText
}) {
  // Local state for hero search inputs
  const [heroTitleQuery, setHeroTitleQuery] = useState(searchQuery || '')
  const [heroLocationQuery, setHeroLocationQuery] = useState(selectedLocation === 'All' ? '' : selectedLocation)

  // Theme-aware color variables
  const colors = {
    bg: isLight ? '#FFFFFF' : '#0B0F19',
    subtleBg: isLight ? '#FAFAFA' : '#111827',
    border: isLight ? '#E5E7EB' : '#1F2937',
    borderLight: isLight ? '#F3F4F6' : '#283344',
    textPrimary: isLight ? '#0A0E1A' : '#F9FAFB',
    textSecondary: isLight ? '#525866' : '#9CA3AF',
    textMuted: isLight ? '#8B949E' : '#6B7280',
    accentCoral: '#F43F5E',
    buttonDark: isLight ? '#0A0E1A' : '#F9FAFB',
    buttonDarkText: isLight ? '#FFFFFF' : '#0A0E1A',
    cardBg: isLight ? '#FFFFFF' : '#111827',
    hoverBg: isLight ? '#F9FAFB' : '#1E293B',
    badgeBg: isLight ? '#F3F4F6' : '#1F2937'
  }

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
    // Smooth scroll to jobs section
    const feed = document.getElementById('wellfound-jobs-feed')
    if (feed) {
      feed.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Quick category matcher
  const categorizedJobBuckets = useMemo(() => {
    const list = filteredJobs || []

    const trending = []
    const engineering = []
    const dataAnalytics = []
    const cloudDevops = []
    const managementPublic = []

    list.forEach(job => {
      const text = `${job.title || ''} ${(job.skills || []).join(' ')} ${job.description || ''} ${job.work_mode || ''}`.toLowerCase()

      if (/data|analytics|analyst|bi|power\s*bi|sql|etl|machine\s*learning|ai|scientist/i.test(text)) {
        dataAnalytics.push(job)
      } else if (/cloud|aws|azure|gcp|devops|kubernetes|docker|infrastructure|systems\s*admin|network|security/i.test(text)) {
        cloudDevops.push(job)
      } else if (/software|engineer|developer|java|python|c#|\.net|react|full\s*stack|frontend|backend/i.test(text)) {
        engineering.push(job)
      } else if (/director|manager|lead|health|clinical|dhhs|scrum|product|project|program|business\s*analyst/i.test(text)) {
        managementPublic.push(job)
      } else {
        engineering.push(job)
      }

      // Add to trending bucket if priority or recent
      if (trending.length < 5) {
        trending.push(job)
      }
    })

    return {
      trending: trending.length > 0 ? trending : list.slice(0, 4),
      engineering: engineering.length > 0 ? engineering : list.slice(0, 6),
      dataAnalytics: dataAnalytics.length > 0 ? dataAnalytics : list.slice(2, 6),
      cloudDevops: cloudDevops.length > 0 ? cloudDevops : list.slice(1, 5),
      managementPublic: managementPublic.length > 0 ? managementPublic : list.slice(0, 4)
    }
  }, [filteredJobs])

  // Helper to render a single Wellfound Job Row
  const renderJobRow = (job) => {
    const cleanTitle = cleanJobTitleWithPositionNumber ? cleanJobTitleWithPositionNumber(job.title) : job.title
    const loc = resolveJobLocation ? resolveJobLocation(job) : (job.work_mode || 'Remote, US')
    const rate = formatRateOrSalary ? formatRateOrSalary(job) : (job.payRate ? `$${job.payRate}/hr` : '$75k - $145k')
    const isExpired = isJobExpired ? isJobExpired(job) : false

    return (
      <div
        key={job.id}
        onClick={() => setFullJdModalJob && setFullJdModalJob(job)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.borderLight}`,
          backgroundColor: colors.cardBg,
          cursor: 'pointer',
          transition: 'background-color 0.15s ease, transform 0.15s ease',
          gap: 16
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.hoverBg
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.cardBg
        }}
      >
        {/* Left: Company Logo & Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
          <CompanyLogo job={job} size={42} />

          <div style={{ minWidth: 0, flex: 1 }}>
            <h4 style={{
              margin: '0 0 4px',
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

            <div style={{
              fontSize: 13,
              color: colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 6
            }}>
              <span style={{ fontWeight: 600, color: isLight ? '#1E293B' : '#CBD5E1' }}>Direct Client</span>
              <span style={{ color: colors.textMuted }}>•</span>
              <span>{loc}</span>
              <span style={{ color: colors.textMuted }}>•</span>
              <span style={{ color: isLight ? '#047857' : '#34D399', fontWeight: 600 }}>{rate}</span>
              <span style={{ color: colors.textMuted }}>•</span>
              <span style={{ fontSize: 12, color: colors.textMuted }}>Posted today</span>
              {isExpired && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#DC2626',
                  backgroundColor: isLight ? '#FEE2E2' : '#450A0A',
                  padding: '1px 6px',
                  borderRadius: 4,
                  marginLeft: 4
                }}>
                  Closed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: View Job Action Button Only (Save removed, Apply on 2nd page) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (setFullJdModalJob) setFullJdModalJob(job)
            }}
            style={{
              padding: '7px 18px',
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              backgroundColor: isLight ? '#FFFFFF' : '#1F2937',
              color: colors.textPrimary,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.textPrimary
              e.currentTarget.style.backgroundColor = colors.buttonDark
              e.currentTarget.style.color = colors.buttonDarkText
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.backgroundColor = isLight ? '#FFFFFF' : '#1F2937'
              e.currentTarget.style.color = colors.textPrimary
            }}
          >
            <span>View Job</span>
            <ChevronRightIcon size={13} color="currentColor" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      backgroundColor: colors.bg,
      color: colors.textPrimary,
      minHeight: '100vh',
      transition: 'background-color 0.2s, color 0.2s'
    }}>
      {/* ─── 1. WELLFOUND TOP NAVIGATION BAR ──────────────────────────────── */}
      <header style={{
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: colors.cardBg,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.02)' : 'none'
      }}>
        <div style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '0 24px',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20
        }}>
          {/* Brand Logo: smarthire: */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
              <span style={{
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: colors.textPrimary,
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}>
                smarthire<span style={{ color: colors.accentCoral }}>:</span>
              </span>
            </Link>

            {/* Navigation Tabs */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                  if (setSearchQuery) setSearchQuery('')
                  if (setSelectedLocation) setSelectedLocation('All')
                }}
                style={{
                  background: isLight ? '#F3F4F6' : '#1F2937',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 700,
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
                  const el = document.getElementById('wellfound-jobs-feed')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 500,
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
                  if (setSearchQuery) setSearchQuery('Direct Client')
                  const el = document.getElementById('wellfound-jobs-feed')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  color: colors.textSecondary,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Direct Client
              </button>
              <button
                onClick={() => {
                  if (setSearchQuery) setSearchQuery('Senior')
                  const el = document.getElementById('wellfound-jobs-feed')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  color: colors.textSecondary,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Salaries & Rates
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
        maxWidth: 1320,
        margin: '0 auto',
        padding: '56px 24px 32px',
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
          marginBottom: 16
        }}>
          OVER 100+ VERIFIED DIRECT-CLIENT IT REQUISITIONS
        </div>

        {/* Main Headline */}
        <h1 style={{
          fontSize: 'clamp(36px, 5.5vw, 56px)',
          fontWeight: 900,
          letterSpacing: '-0.035em',
          color: colors.textPrimary,
          margin: '0 0 32px',
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
            boxShadow: isLight ? '0 10px 30px rgba(0, 0, 0, 0.06)' : '0 10px 30px rgba(0, 0, 0, 0.4)',
            gap: 12
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
              placeholder="Location (e.g. Remote, Raleigh NC)"
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
              transition: 'opacity 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Search
          </button>
        </form>
      </section>

      {/* ─── 3. "TRENDING DIRECT CLIENTS HIRING NOW" 3-CARD GRID ──────────── */}
      <section style={{
        maxWidth: 1320,
        margin: '0 auto',
        padding: '24px 24px 44px'
      }}>
        <h2 style={{
          fontSize: 24,
          fontWeight: 800,
          color: colors.textPrimary,
          margin: '0 0 20px',
          letterSpacing: '-0.02em'
        }}>
          Trending direct clients hiring now
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20
        }}>
          {/* Card 1 */}
          <div style={{
            border: `1px solid ${colors.border}`,
            borderRadius: 14,
            backgroundColor: colors.cardBg,
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: '#0F172A',
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
                  <div style={{ fontSize: 12.5, color: colors.textSecondary }}>11-50 requisitions</div>
                </div>
              </div>

              <p style={{ fontSize: 13.5, color: colors.textSecondary, lineHeight: 1.5, margin: '0 0 14px' }}>
                All-in-one state & enterprise stack to build reliable agentic cloud workflows, modern data lakes, and secure microservices.
              </p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: isLight ? '#FCE7F3' : '#371B2B', color: '#BE185D' }}>
                  B2B
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                  Direct Client
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                  Remote Option
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (setSearchQuery) setSearchQuery('Cloud')
                const el = document.getElementById('wellfound-jobs-feed')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{
                borderTop: `1px solid ${colors.borderLight}`,
                paddingTop: 12,
                background: 'none',
                border: 'none',
                borderTopStyle: 'solid',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 13.5,
                fontWeight: 600,
                color: colors.textPrimary,
                cursor: 'pointer'
              }}
            >
              <span>{categorizedJobBuckets.cloudDevops.length || 4} open positions</span>
              <ChevronRightIcon size={14} color={colors.textPrimary} />
            </button>
          </div>

          {/* Card 2 */}
          <div style={{
            border: `1px solid ${colors.border}`,
            borderRadius: 14,
            backgroundColor: colors.cardBg,
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: '#2563EB',
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
                  <div style={{ fontSize: 12.5, color: colors.textSecondary }}>Public Health Sector</div>
                </div>
              </div>

              <p style={{ fontSize: 13.5, color: colors.textSecondary, lineHeight: 1.5, margin: '0 0 14px' }}>
                Empowers public healthcare programs and human services with high-security database analytics and automated patient workflows.
              </p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: isLight ? '#DBEAFE' : '#1E3A8A', color: '#1D4ED8' }}>
                  Public Sector
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                  Healthcare IT
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (setSearchQuery) setSearchQuery('Health')
                const el = document.getElementById('wellfound-jobs-feed')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{
                borderTop: `1px solid ${colors.borderLight}`,
                paddingTop: 12,
                background: 'none',
                border: 'none',
                borderTopStyle: 'solid',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 13.5,
                fontWeight: 600,
                color: colors.textPrimary,
                cursor: 'pointer'
              }}
            >
              <span>{categorizedJobBuckets.managementPublic.length || 6} open positions</span>
              <ChevronRightIcon size={14} color={colors.textPrimary} />
            </button>
          </div>

          {/* Card 3 */}
          <div style={{
            border: `1px solid ${colors.border}`,
            borderRadius: 14,
            backgroundColor: colors.cardBg,
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: '#059669',
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
                Full-stack digital modernization for government portals, high-concurrency payment engines, and citizen-facing services.
              </p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: isLight ? '#D1FAE5' : '#064E3B', color: '#047857' }}>
                  Enterprise
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                  Full Stack
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (setSearchQuery) setSearchQuery('Developer')
                const el = document.getElementById('wellfound-jobs-feed')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{
                borderTop: `1px solid ${colors.borderLight}`,
                paddingTop: 12,
                background: 'none',
                border: 'none',
                borderTopStyle: 'solid',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 13.5,
                fontWeight: 600,
                color: colors.textPrimary,
                cursor: 'pointer'
              }}
            >
              <span>{categorizedJobBuckets.engineering.length || 8} open positions</span>
              <ChevronRightIcon size={14} color={colors.textPrimary} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── 4. TWO-COLUMN MAIN JOB FEED & ADSENSE STICKY SIDEBAR ──────────── */}
      <section id="wellfound-jobs-feed" style={{
        maxWidth: 1320,
        margin: '0 auto',
        padding: '16px 24px 64px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: 32,
          alignItems: 'start'
        }}>
          {/* ── LEFT COLUMN: Categorized Job Feeds ── */}
          <div>
            {/* Category 1: Trending Direct Client Jobs */}
            <div style={{ marginBottom: 44 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                  Trending direct client jobs
                </h3>
                <button
                  onClick={() => {
                    if (setSearchQuery) setSearchQuery('')
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  View all jobs
                </button>
              </div>

              <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
                {categorizedJobBuckets.trending.map(job => renderJobRow(job))}
              </div>
            </div>

            {/* Category 2: Engineering Jobs */}
            <div style={{ marginBottom: 44 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                  Engineering jobs
                </h3>
                <button
                  onClick={() => {
                    if (setSearchQuery) setSearchQuery('Engineer')
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  View all engineering jobs
                </button>
              </div>

              <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
                {categorizedJobBuckets.engineering.slice(0, 5).map(job => renderJobRow(job))}
              </div>
            </div>

            {/* Category 3: Data and Analytics Jobs */}
            <div style={{ marginBottom: 44 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                  Data and Analytics jobs
                </h3>
                <button
                  onClick={() => {
                    if (setSearchQuery) setSearchQuery('Data')
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  View all data & analytics jobs
                </button>
              </div>

              <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
                {categorizedJobBuckets.dataAnalytics.slice(0, 5).map(job => renderJobRow(job))}
              </div>
            </div>

            {/* Category 4: Cloud & DevOps Jobs */}
            <div style={{ marginBottom: 44 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                  Cloud & Infrastructure jobs
                </h3>
                <button
                  onClick={() => {
                    if (setSearchQuery) setSearchQuery('Cloud')
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  View all cloud jobs
                </button>
              </div>

              <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
                {categorizedJobBuckets.cloudDevops.slice(0, 5).map(job => renderJobRow(job))}
              </div>
            </div>

            {/* Category 5: Management & Public Sector */}
            <div style={{ marginBottom: 44 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                  Management & Public Sector jobs
                </h3>
                <button
                  onClick={() => {
                    if (setSearchQuery) setSearchQuery('Manager')
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  View all management jobs
                </button>
              </div>

              <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
                {categorizedJobBuckets.managementPublic.slice(0, 5).map(job => renderJobRow(job))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Dedicated Google AdSense Slots & Benefits Card ── */}
          <div style={{ position: 'sticky', top: 88 }}>
            {/* Slot 1: Google AdSense Display Unit (Responsive 300x250) */}
            <div style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              backgroundColor: colors.cardBg,
              padding: 16,
              marginBottom: 24,
              textAlign: 'center',
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none'
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: colors.textMuted,
                textTransform: 'uppercase',
                marginBottom: 10
              }}>
                SPONSORED / ADVERTISEMENT
              </div>

              {/* AdSense Active Container */}
              <div style={{
                minHeight: 250,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isLight ? '#F9FAFB' : '#1F2937',
                borderRadius: 8,
                border: `1px dashed ${colors.border}`,
                padding: 16
              }}>
                {/* Standard Google AdSense Tag Wrapper (Automatically hydrates upon approval) */}
                <ins
                  className="adsbygoogle"
                  style={{ display: 'block', width: '100%', height: '100%', minHeight: 220 }}
                  data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                  data-ad-slot="1234567890"
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                />
                
                {/* High-fidelity fallback placeholder until publisher ID approval is active */}
                <div style={{ marginTop: -180 }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>💼</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>
                    Direct Client IT Contracts
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, maxWidth: 220, margin: '0 auto 12px' }}>
                    Top Fortune 500 & State Government opportunities with verified compensation.
                  </div>
                  <button
                    onClick={() => {
                      if (setShowCvUploadModal) setShowCvUploadModal(true)
                    }}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '6px 14px',
                      borderRadius: 6,
                      backgroundColor: colors.buttonDark,
                      color: colors.buttonDarkText,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Quick Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Slot 2: "Level up your job search" Benefits Card (media_1789654520486.png) */}
            <div style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              backgroundColor: colors.cardBg,
              padding: 24,
              marginBottom: 24,
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none'
            }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 800,
                color: colors.textPrimary,
                margin: '0 0 20px',
                letterSpacing: '-0.01em'
              }}>
                Level up your job search
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ marginTop: 2, flexShrink: 0 }}>
                    <BriefcaseIcon size={18} color="#2065D1" />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: colors.textPrimary, lineHeight: 1.4 }}>
                    Unique jobs in niche industries
                    <div style={{ fontSize: 12, fontWeight: 400, color: colors.textSecondary, marginTop: 2 }}>
                      Direct client contracts not found on generic boards.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ marginTop: 2, flexShrink: 0 }}>
                    <TargetIcon size={18} color="#F43F5E" />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: colors.textPrimary, lineHeight: 1.4 }}>
                    Set salary & contract upfront
                    <div style={{ fontSize: 12, fontWeight: 400, color: colors.textSecondary, marginTop: 2 }}>
                      Transparent C2C, W2, 1099 hourly and annual rates.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ marginTop: 2, flexShrink: 0 }}>
                    <SlidersIcon size={18} color="#8B5CF6" />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: colors.textPrimary, lineHeight: 1.4 }}>
                    Personalized job filters
                    <div style={{ fontSize: 12, fontWeight: 400, color: colors.textSecondary, marginTop: 2 }}>
                      Filter by Remote, State Government, and exact tech stacks.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ marginTop: 2, flexShrink: 0 }}>
                    <AwardIcon size={18} color="#10B981" />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: colors.textPrimary, lineHeight: 1.4 }}>
                    Showcase skills beyond a resume
                    <div style={{ fontSize: 12, fontWeight: 400, color: colors.textSecondary, marginTop: 2 }}>
                      Instant AI screening & skill match evaluations.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ marginTop: 2, flexShrink: 0 }}>
                    <CheckCircleIcon size={18} color="#00A76F" />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: colors.textPrimary, lineHeight: 1.4 }}>
                    1-click direct apply to clients
                    <div style={{ fontSize: 12, fontWeight: 400, color: colors.textSecondary, marginTop: 2 }}>
                      Direct recruiter review within 24 hours.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slot 3: Lower Google AdSense Container */}
            <div style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              backgroundColor: colors.cardBg,
              padding: 14,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: colors.textMuted,
                textTransform: 'uppercase',
                marginBottom: 8
              }}>
                ADVERTISEMENT
              </div>
              <div style={{
                height: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isLight ? '#F9FAFB' : '#1F2937',
                borderRadius: 8,
                border: `1px dashed ${colors.border}`,
                fontSize: 12,
                color: colors.textSecondary
              }}>
                <span>Google AdSense Display Space</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. WELLFOUND FOOTER ─────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${colors.border}`,
        backgroundColor: colors.cardBg,
        padding: '40px 24px 60px'
      }}>
        <div style={{
          maxWidth: 1320,
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
            <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6 }}>
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
