import React, { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { resolveReqId } from '../utils/formatJobDescription'

export default function LinkedInCareersView({
  jobs = [],
  filteredJobs = [],
  loading = false,
  searchQuery = '',
  setSearchQuery,
  selectedLocation = 'All',
  setSelectedLocation,
  deadlineFilter = 'All',
  setDeadlineFilter,
  appliedJobs = {},
  savedJobs = {},
  handleToggleSaveJob,
  candidateUser = null,
  handleCandidateSignOut,
  setShowLoginModal,
  handleApplyClick,
  setFullJdModalJob,
  setActiveChatCandidate,
  setShowCvUploadModal,
  clocksExpanded,
  setClocksExpanded,
  formatLiveTime,
  themeMode = 'light',
  toggleTheme,
  isLight = true,
  layoutView = 'split',
  handleSetLayoutView,
  cleanJobTitleWithPositionNumber,
  resolveJobLocation,
  formatExperience,
  formatRateOrSalary,
  formatContractType,
  isJobExpired,
  getFullDescriptionText
}) {
  const navigate = useNavigate()

  // Selected job for right-hand dossier detail view
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'cloud', 'dev', 'data', 'health', 'pm'
  const [selectedPayFilter, setSelectedPayFilter] = useState('all') // 'all', '60', '75', '85', '100'
  const [showMatchDetails, setShowMatchDetails] = useState(false)
  const [feedbackGiven, setFeedbackGiven] = useState(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [dismissedJobs, setDismissedJobs] = useState({})
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)

  // Determine the effective active job
  const visibleJobs = useMemo(() => {
    return filteredJobs.filter(j => !dismissedJobs[j.id])
  }, [filteredJobs, dismissedJobs])

  // Filter further by pay rate and domain tab if selected
  const domainAndPayFilteredJobs = useMemo(() => {
    return visibleJobs.filter(j => {
      // Domain filter
      if (activeTab !== 'all') {
        const text = `${j.title || ''} ${(j.skills || []).join(' ')} ${j.rawDescription || ''}`.toLowerCase()
        if (activeTab === 'cloud' && !/cloud|aws|azure|gcp|devops|kubernetes|docker|infrastructure/i.test(text)) return false
        if (activeTab === 'dev' && !/java|react|python|full\s*stack|developer|software|node|c#|\.net/i.test(text)) return false
        if (activeTab === 'data' && !/data|analyst|ai|machine\s*learning|sql|bi|etl|power\s*bi/i.test(text)) return false
        if (activeTab === 'health' && !/health|med|epic|cerner|clinical|dhhs|care/i.test(text)) return false
        if (activeTab === 'pm' && !/project\s*manager|program\s*manager|scrum|agile|business\s*analyst|director/i.test(text)) return false
      }

      // Pay filter
      if (selectedPayFilter !== 'all') {
        const minRate = parseInt(selectedPayFilter, 10)
        const rawRate = j.payRate || j.hourlyRate || j.rate || j.salary || ''
        const rateMatch = String(rawRate).match(/\$?(\d{2,3})/)
        if (rateMatch) {
          const num = parseInt(rateMatch[1], 10)
          if (num < minRate) return false
        }
      }

      return true
    })
  }, [visibleJobs, activeTab, selectedPayFilter])

  // Auto-select first job if none selected or if selected job is no longer in list
  useEffect(() => {
    if (domainAndPayFilteredJobs.length > 0) {
      if (!selectedJobId || !domainAndPayFilteredJobs.some(j => j.id === selectedJobId)) {
        setSelectedJobId(domainAndPayFilteredJobs[0].id)
      }
    } else {
      setSelectedJobId(null)
    }
  }, [domainAndPayFilteredJobs, selectedJobId])

  const selectedJob = useMemo(() => {
    return domainAndPayFilteredJobs.find(j => j.id === selectedJobId) || domainAndPayFilteredJobs[0] || null
  }, [domainAndPayFilteredJobs, selectedJobId])

  // Deterministic time posted text (e.g. "2 weeks ago", "3 days ago")
  const getPostedTimeAgo = (job) => {
    if (!job) return 'Recently posted'
    let ts = null
    if (job.id && job.id.startsWith('J-')) {
      const parsed = parseInt(job.id.replace('J-', ''), 10)
      if (!isNaN(parsed) && parsed > 1600000000000) ts = parsed
    }
    if (!ts && job.creationDate) {
      const parsed = new Date(job.creationDate).getTime()
      if (!isNaN(parsed)) ts = parsed
    }
    if (!ts) {
      // Deterministic hash based on job id
      const seed = String(job.id || 'job').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
      const days = (seed % 14) + 1
      return `${days} days ago`
    }
    const diffHours = Math.max(1, Math.floor((Date.now() - ts) / (1000 * 60 * 60)))
    if (diffHours < 24) return `${diffHours} hours ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} days ago`
    const diffWeeks = Math.floor(diffDays / 7)
    return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`
  }

  // Deterministic applicant counter matching LinkedIn screenshot: "18 people clicked apply"
  const getApplicantCount = (job) => {
    if (!job) return 14
    const seed = String(job.id || 'job').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return 12 + (seed % 28)
  }

  // Company avatar generator with rich colors
  const getAvatarBadge = (job) => {
    const title = (cleanJobTitleWithPositionNumber ? cleanJobTitleWithPositionNumber(job.title, job) : job.title) || 'Role'
    const colors = [
      { bg: '#0A66C2', text: '#FFFFFF' }, // LinkedIn blue
      { bg: '#00875A', text: '#FFFFFF' }, // Emerald
      { bg: '#5E4DB2', text: '#FFFFFF' }, // Royal purple
      { bg: '#0052CC', text: '#FFFFFF' }, // Atlantic blue
      { bg: '#D97706', text: '#FFFFFF' }, // Warm amber
      { bg: '#DC2626', text: '#FFFFFF' }, // Ruby
      { bg: '#2563EB', text: '#FFFFFF' }  // Modern blue
    ]
    const seed = title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const scheme = colors[seed % colors.length]
    const initials = title
      .split(/\s+/)
      .filter(w => !/^(a|an|the|of|in|for|and)&/i.test(w))
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase() || 'DC'

    return { initials, scheme }
  }

  const handleDismissJob = (e, jobId) => {
    e.stopPropagation()
    setDismissedJobs(prev => ({ ...prev, [jobId]: true }))
  }

  const handleShareJob = (job) => {
    if (!job) return
    const url = `${window.location.origin}/jobs?jobId=${job.id}`
    try {
      navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    } catch(e) {}
  }

  // Format full job description with safety
  const jdText = useMemo(() => {
    if (!selectedJob) return ''
    if (typeof getFullDescriptionText === 'function') {
      return getFullDescriptionText(selectedJob)
    }
    return selectedJob.rawDescription || selectedJob.description || ''
  }, [selectedJob, getFullDescriptionText])

  const themeTokens = {
    bg: isLight ? '#F3F2F0' : '#0B0F19', // LinkedIn page backdrop
    cardBg: isLight ? '#FFFFFF' : '#141A23',
    cardBorder: isLight ? '#E0E0E0' : 'rgba(255, 255, 255, 0.08)',
    textPrimary: isLight ? '#191919' : '#F9FAFB',
    textSecondary: isLight ? '#666666' : '#9CA3AF',
    textMuted: isLight ? '#8C8C8C' : '#6B7280',
    brandBlue: '#0A66C2',
    brandBlueHover: '#004182',
    brandBlueSoft: isLight ? '#EBF3FE' : 'rgba(10, 102, 194, 0.18)',
    activeCardBorder: '#0A66C2',
    activeCardBg: isLight ? '#EDF3F8' : 'rgba(10, 102, 194, 0.12)',
    badgeBg: isLight ? '#F3F2EF' : '#1E2633',
    pillBorder: isLight ? '#D0D7DE' : 'rgba(255, 255, 255, 0.15)',
    greenAccent: '#057642',
    greenSoftBg: isLight ? '#E6F4EA' : 'rgba(5, 118, 66, 0.15)',
    amberBadge: isLight ? '#FFF8E1' : 'rgba(255, 171, 0, 0.15)',
    amberText: '#B76E00'
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: themeTokens.bg,
      color: themeTokens.textPrimary,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* ─── STICKY LINKEDIN SEARCH & GLOBAL HEADER ──────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: themeTokens.cardBg,
        borderBottom: `1px solid ${themeTokens.cardBorder}`,
        boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.4)',
        padding: '10px 20px'
      }}>
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap'
        }}>
          {/* Logo & Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 500px', maxWidth: 720 }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 20,
                letterSpacing: -0.5,
                boxShadow: '0 2px 6px rgba(10,102,194,0.3)'
              }}>
                SH
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 800, fontSize: 17, color: themeTokens.textPrimary, lineHeight: 1.1 }}>
                  SmartHire
                </span>
                <span style={{ fontSize: 11, color: themeTokens.textSecondary, fontWeight: 500 }}>
                  Direct Client Jobs
                </span>
              </div>
            </Link>

            {/* LinkedIn-style Search Input matching media_1789641431661.png */}
            <div style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{
                position: 'absolute',
                left: 14,
                color: themeTokens.textSecondary,
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none'
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                type="text"
                placeholder="Describe the job you want (e.g. AWS, Java, Python, React, Project Manager)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 36px 9px 38px',
                  borderRadius: 24,
                  border: `1px solid ${themeTokens.pillBorder}`,
                  backgroundColor: isLight ? '#EDF3F8' : '#1E2633',
                  color: themeTokens.textPrimary,
                  fontSize: 14,
                  fontWeight: 400,
                  outline: 'none',
                  transition: 'all 0.18s ease'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 12,
                    background: 'none',
                    border: 'none',
                    color: themeTokens.textSecondary,
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: 2
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Action Controls: 3-Way Layout Switcher, Theme & Auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {/* 3-Way Layout Switcher */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: isLight ? '#F3F2EF' : '#1C2431',
              borderRadius: 20,
              padding: 2,
              border: `1px solid ${themeTokens.cardBorder}`
            }}>
              <button
                onClick={() => handleSetLayoutView('wellfound')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 18,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: layoutView === 'wellfound' ? themeTokens.brandBlue : 'transparent',
                  color: layoutView === 'wellfound' ? '#FFFFFF' : themeTokens.textSecondary,
                  transition: 'all 0.15s ease'
                }}
              >
                Wellfound
              </button>
              <button
                onClick={() => handleSetLayoutView('split')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 18,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: layoutView === 'split' ? themeTokens.brandBlue : 'transparent',
                  color: layoutView === 'split' ? '#FFFFFF' : themeTokens.textSecondary,
                  transition: 'all 0.15s ease'
                }}
              >
                Split View
              </button>
              <button
                onClick={() => handleSetLayoutView('zone')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 18,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: layoutView === 'zone' ? themeTokens.brandBlue : 'transparent',
                  color: layoutView === 'zone' ? '#FFFFFF' : themeTokens.textSecondary,
                  transition: 'all 0.15s ease'
                }}
              >
                Zone
              </button>
              <button
                onClick={() => handleSetLayoutView('classic')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 18,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: layoutView === 'classic' ? themeTokens.brandBlue : 'transparent',
                  color: layoutView === 'classic' ? '#FFFFFF' : themeTokens.textSecondary,
                  transition: 'all 0.15s ease'
                }}
              >
                Classic
              </button>
            </div>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: `1px solid ${themeTokens.pillBorder}`,
                backgroundColor: themeTokens.cardBg,
                color: themeTokens.textPrimary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: themeTokens.textPrimary
              }}
              title="Toggle Theme"
            >
              {isLight ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              )}
            </button>

            {/* Candidate Auth */}
            {candidateUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  backgroundColor: themeTokens.brandBlueSoft,
                  color: themeTokens.brandBlue,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13
                }}>
                  {candidateUser.name ? candidateUser.name[0].toUpperCase() : 'U'}
                </div>
                <button
                  onClick={handleCandidateSignOut}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: themeTokens.textSecondary,
                    fontSize: 12,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 20,
                  border: `1.5px solid ${themeTokens.brandBlue}`,
                  backgroundColor: 'transparent',
                  color: themeTokens.brandBlue,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                Sign In
              </button>
            )}

            {/* Recruiter Login Shortcut */}
            <Link
              to="/login"
              style={{
                padding: '7px 14px',
                borderRadius: 20,
                backgroundColor: isLight ? '#0F172A' : '#334155',
                color: '#FFF',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              Recruiter ↗
            </Link>
          </div>
        </div>

        {/* Filter Pills Ribbon (Work Mode, Min Pay, Tech Domains) */}
        <div style={{
          maxWidth: 1400,
          margin: '8px auto 0',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none'
        }}>
          {/* Work Mode Pills */}
          <span style={{ fontSize: 12, fontWeight: 600, color: themeTokens.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 4 }}>
            Work Mode:
          </span>
          {[
            { id: 'All', label: 'All Modes' },
            { id: 'Remote', label: 'Remote' },
            { id: 'Hybrid', label: 'Hybrid' },
            { id: 'Onsite', label: 'On-site' }
          ].map(loc => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc.id)}
              style={{
                padding: '5px 12px',
                borderRadius: 16,
                border: `1px solid ${selectedLocation === loc.id ? themeTokens.brandBlue : themeTokens.pillBorder}`,
                backgroundColor: selectedLocation === loc.id ? '#057642' : 'transparent',
                color: selectedLocation === loc.id ? '#FFFFFF' : themeTokens.textPrimary,
                fontSize: 13,
                fontWeight: selectedLocation === loc.id ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {loc.label}
            </button>
          ))}

          <div style={{ width: 1, height: 20, backgroundColor: themeTokens.cardBorder, margin: '0 4px' }} />

          {/* Min Pay Rate Pills */}
          <span style={{ fontSize: 12, fontWeight: 600, color: themeTokens.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 4 }}>
            Pay Rate:
          </span>
          {[
            { id: 'all', label: 'All Rates' },
            { id: '60', label: '$60+/hr' },
            { id: '75', label: '$75+/hr' },
            { id: '85', label: '$85+/hr' },
            { id: '100', label: '$100+/hr' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPayFilter(p.id)}
              style={{
                padding: '5px 12px',
                borderRadius: 16,
                border: `1px solid ${selectedPayFilter === p.id ? themeTokens.brandBlue : themeTokens.pillBorder}`,
                backgroundColor: selectedPayFilter === p.id ? themeTokens.brandBlueSoft : 'transparent',
                color: selectedPayFilter === p.id ? themeTokens.brandBlue : themeTokens.textPrimary,
                fontSize: 13,
                fontWeight: selectedPayFilter === p.id ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {p.label}
            </button>
          ))}

          <div style={{ width: 1, height: 20, backgroundColor: themeTokens.cardBorder, margin: '0 4px' }} />

          {/* Domain Pills */}
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'cloud', label: 'Cloud & DevOps' },
            { id: 'dev', label: 'Full Stack & Java' },
            { id: 'data', label: 'Data & AI' },
            { id: 'health', label: 'Health IT' },
            { id: 'pm', label: 'PM & Agile' }
          ].map(d => (
            <button
              key={d.id}
              onClick={() => setActiveTab(d.id)}
              style={{
                padding: '5px 12px',
                borderRadius: 16,
                border: `1px solid ${activeTab === d.id ? themeTokens.brandBlue : themeTokens.pillBorder}`,
                backgroundColor: activeTab === d.id ? themeTokens.brandBlueSoft : 'transparent',
                color: activeTab === d.id ? themeTokens.brandBlue : themeTokens.textSecondary,
                fontSize: 13,
                fontWeight: activeTab === d.id ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </header>

      {/* ─── TWO-COLUMN MASTER-DETAIL SPLIT CONTAINER ────────────────────────── */}
      <main style={{
        maxWidth: 1400,
        width: '100%',
        margin: '0 auto',
        padding: '16px 20px 40px',
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 480px) 1fr',
        gap: 20,
        alignItems: 'start',
        flex: 1
      }}>
        {/* ─── LEFT COLUMN: "MORE JOBS FOR YOU" LIST ─────────────────────────── */}
        <section style={{
          backgroundColor: themeTokens.cardBg,
          borderRadius: 10,
          border: `1px solid ${themeTokens.cardBorder}`,
          boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* List Header matching media_1789641431661.png */}
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${themeTokens.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: themeTokens.textPrimary,
                lineHeight: 1.2
              }}>
                More jobs for you
              </h2>
              <p style={{
                margin: '3px 0 0',
                fontSize: 13,
                color: themeTokens.textSecondary
              }}>
                {loading ? 'Searching direct client roles...' : `${domainAndPayFilteredJobs.length} results`}
              </p>
            </div>

            {/* Quick Status / Verified Pill */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: 12,
              backgroundColor: themeTokens.greenSoftBg,
              color: themeTokens.greenAccent
            }}>
              Direct Client
            </span>
          </div>

          {/* Job Card List */}
          <div style={{
            maxHeight: 'calc(100vh - 185px)',
            overflowY: 'auto',
            padding: '4px 0'
          }}>
            {loading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: themeTokens.textSecondary }}>
                <div style={{ fontWeight: 600 }}>Loading open direct client jobs...</div>
              </div>
            ) : domainAndPayFilteredJobs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: themeTokens.textSecondary }}>
                <div style={{ fontWeight: 600, color: themeTokens.textPrimary, fontSize: 16, marginBottom: 4 }}>
                  No jobs found matching your filters
                </div>
                <p style={{ fontSize: 13, margin: '0 0 16px' }}>
                  Try adjusting your search keywords, pay range, or work arrangement.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedLocation('All')
                    setSelectedPayFilter('all')
                    setActiveTab('all')
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: `1.5px solid ${themeTokens.brandBlue}`,
                    backgroundColor: 'transparent',
                    color: themeTokens.brandBlue,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              domainAndPayFilteredJobs.map((job) => {
                const isSelected = selectedJob?.id === job.id
                const isSaved = !!savedJobs[job.id]
                const isApplied = !!appliedJobs[job.id]
                const cleanTitle = cleanJobTitleWithPositionNumber ? cleanJobTitleWithPositionNumber(job.title, job) : job.title
                const jobLocation = resolveJobLocation ? resolveJobLocation(job) : (job.location || 'Remote, US')
                const payRate = formatRateOrSalary ? formatRateOrSalary(job) : 'Competitive'
                const contractTypeStr = formatContractType ? formatContractType(job) : 'Contract'
                const postedAgo = getPostedTimeAgo(job)
                const avatar = getAvatarBadge(job)

                return (
                  <div
                    key={job.id}
                    onClick={() => {
                      setSelectedJobId(job.id)
                      setMobileDetailOpen(true)
                    }}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      gap: 12,
                      padding: '16px 20px',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${themeTokens.cardBorder}`,
                      backgroundColor: isSelected ? themeTokens.activeCardBg : 'transparent',
                      borderLeft: isSelected ? `3px solid ${themeTokens.activeCardBorder}` : '3px solid transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Square Avatar matching media_1789641431661.png */}
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      backgroundColor: avatar.scheme.bg,
                      color: avatar.scheme.text,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 16,
                      flexShrink: 0,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      {avatar.initials}
                    </div>

                    {/* Middle Card Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title with Verified Checkmark Badge */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                        <h3 style={{
                          margin: 0,
                          fontSize: 15,
                          fontWeight: 700,
                          color: isSelected ? themeTokens.brandBlue : themeTokens.textPrimary,
                          lineHeight: 1.3,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}>
                          <span>{cleanTitle}</span>
                          <span style={{ color: '#0A66C2', fontSize: 13 }} title="Verified Direct Client Requisition">
                            ✓
                          </span>
                        </h3>

                        {/* Top-right dismiss '✕' matching media_1789641431661.png */}
                        <button
                          onClick={(e) => handleDismissJob(e, job.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: themeTokens.textMuted,
                            cursor: 'pointer',
                            fontSize: 14,
                            padding: '2px 4px',
                            lineHeight: 1,
                            borderRadius: 4
                          }}
                          title="Hide this job"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Anonymized Company Name */}
                      <div style={{
                        fontSize: 13,
                        color: themeTokens.textSecondary,
                        marginTop: 2,
                        fontWeight: 500
                      }}>
                        Direct Client · Enterprise
                      </div>

                      {/* Location & Work Mode */}
                      <div style={{
                        fontSize: 13,
                        color: themeTokens.textSecondary,
                        marginTop: 2
                      }}>
                        {jobLocation} ({job.work_mode || (job.location && job.location.toLowerCase().includes('remote') ? 'Remote' : 'On-site')})
                      </div>

                      {/* Compensation / Benefits Line matching screenshot */}
                      <div style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: themeTokens.greenAccent,
                        marginTop: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <span>{payRate}</span>
                        <span style={{ color: themeTokens.textMuted, fontWeight: 400 }}>·</span>
                        <span style={{ color: themeTokens.textSecondary, fontWeight: 500 }}>{contractTypeStr}</span>
                      </div>

                      {/* Social Proof & Status Line matching media_1789641431661.png */}
                      <div style={{
                        marginTop: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        color: themeTokens.textMuted,
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ color: themeTokens.greenAccent, fontWeight: 600 }}>
                          Be an early applicant
                        </span>
                        <span>·</span>
                        <span>{postedAgo}</span>
                        {isApplied && (
                          <span style={{
                            backgroundColor: themeTokens.greenSoftBg,
                            color: themeTokens.greenAccent,
                            padding: '1px 6px',
                            borderRadius: 4,
                            fontWeight: 600,
                            fontSize: 11
                          }}>
                            ✓ Applied
                          </span>
                        )}
                        {isSaved && (
                          <span style={{
                            backgroundColor: themeTokens.brandBlueSoft,
                            color: themeTokens.brandBlue,
                            padding: '1px 6px',
                            borderRadius: 4,
                            fontWeight: 600,
                            fontSize: 11
                          }}>
                            Saved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* ─── RIGHT COLUMN: STICKY FULL JOB DOSSIER ─────────────────────────── */}
        <section style={{
          backgroundColor: themeTokens.cardBg,
          borderRadius: 10,
          border: `1px solid ${themeTokens.cardBorder}`,
          boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.3)',
          padding: '24px 28px',
          position: 'sticky',
          top: 130,
          maxHeight: 'calc(100vh - 150px)',
          overflowY: 'auto'
        }}>
          {!selectedJob ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: themeTokens.textSecondary }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.7 }}><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>
              <h3 style={{ margin: 0, color: themeTokens.textPrimary }}>Select a job to view details</h3>
              <p style={{ margin: '8px 0 0', fontSize: 14 }}>
                Choose any open requisition from the left list to read the complete description and apply.
              </p>
            </div>
          ) : (
            <div>
              {/* Header with Company Logo & Actions Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    backgroundColor: getAvatarBadge(selectedJob).scheme.bg,
                    color: getAvatarBadge(selectedJob).scheme.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 16,
                    flexShrink: 0
                  }}>
                    {getAvatarBadge(selectedJob).initials}
                  </div>
                  <div>
                    <span style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: themeTokens.textPrimary
                    }}>
                      Direct Client · Enterprise
                    </span>
                    <div style={{ fontSize: 12, color: themeTokens.textSecondary }}>
                      Req #{resolveReqId(selectedJob.id)}
                    </div>
                  </div>
                </div>

                {/* Header Actions: Share, Save, More */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => handleShareJob(selectedJob)}
                    style={{
                      background: 'none',
                      border: `1px solid ${themeTokens.pillBorder}`,
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: themeTokens.textSecondary,
                      cursor: 'pointer',
                      fontSize: 15
                    }}
                    title="Share job link"
                  >
                    {copiedLink ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    )}
                  </button>

                  <button
                    onClick={() => handleToggleSaveJob(selectedJob.id)}
                    style={{
                      background: 'none',
                      border: `1px solid ${themeTokens.pillBorder}`,
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: savedJobs[selectedJob.id] ? themeTokens.brandBlue : themeTokens.textSecondary,
                      cursor: 'pointer'
                    }}
                    title={savedJobs[selectedJob.id] ? 'Remove from saved' : 'Save job'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={savedJobs[selectedJob.id] ? themeTokens.brandBlue : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Big Bold Job Title matching media_1789641431661.png */}
              <h1 style={{
                margin: '0 0 6px',
                fontSize: 24,
                fontWeight: 700,
                color: themeTokens.textPrimary,
                lineHeight: 1.25,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap'
              }}>
                <span>{cleanJobTitleWithPositionNumber ? cleanJobTitleWithPositionNumber(selectedJob.title, selectedJob) : selectedJob.title}</span>
                <span style={{ color: '#0A66C2', fontSize: 18 }} title="Verified Direct Client Requisition">
                  ✓
                </span>
              </h1>

              {/* Sub-Metadata Line */}
              <div style={{
                fontSize: 14,
                color: themeTokens.textSecondary,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap'
              }}>
                <span>{resolveJobLocation ? resolveJobLocation(selectedJob) : (selectedJob.location || 'Remote, US')}</span>
                <span>·</span>
                <span>{getPostedTimeAgo(selectedJob)}</span>
                <span>·</span>
                <span style={{ color: themeTokens.greenAccent, fontWeight: 600 }}>
                  {getApplicantCount(selectedJob)} people clicked apply
                </span>
              </div>

              {/* Response notice */}
              <div style={{
                fontSize: 12,
                color: themeTokens.textMuted,
                marginBottom: 16
              }}>
                Responses managed directly off LinkedIn via SmartHire ATS
              </div>

              {/* Work Mode & Type Badges (Pills) matching media_1789641431661.png */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 20,
                flexWrap: 'wrap'
              }}>
                <span style={{
                  padding: '5px 12px',
                  borderRadius: 16,
                  backgroundColor: themeTokens.badgeBg,
                  color: themeTokens.textPrimary,
                  fontSize: 13,
                  fontWeight: 500,
                  border: `1px solid ${themeTokens.pillBorder}`
                }}>
                  {selectedJob.work_mode || (selectedJob.location && selectedJob.location.toLowerCase().includes('remote') ? 'Remote' : 'On-site')}
                </span>

                <span style={{
                  padding: '5px 12px',
                  borderRadius: 16,
                  backgroundColor: themeTokens.badgeBg,
                  color: themeTokens.textPrimary,
                  fontSize: 13,
                  fontWeight: 500,
                  border: `1px solid ${themeTokens.pillBorder}`
                }}>
                  {formatContractType ? formatContractType(selectedJob) : 'Full-time / Contract'}
                </span>

                <span style={{
                  padding: '5px 12px',
                  borderRadius: 16,
                  backgroundColor: themeTokens.greenSoftBg,
                  color: themeTokens.greenAccent,
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1px solid ${isLight ? 'rgba(5, 118, 66, 0.2)' : 'rgba(5, 118, 66, 0.4)'}`
                }}>
                  {formatRateOrSalary ? formatRateOrSalary(selectedJob) : 'Competitive'}
                </span>

                <span style={{
                  padding: '5px 12px',
                  borderRadius: 16,
                  backgroundColor: themeTokens.badgeBg,
                  color: themeTokens.textSecondary,
                  fontSize: 13,
                  fontWeight: 500,
                  border: `1px solid ${themeTokens.pillBorder}`
                }}>
                  {formatExperience ? formatExperience(selectedJob.experience) : '5+ Years Exp'}
                </span>
              </div>

              {/* Primary Call-to-Action Buttons matching media_1789641431661.png */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 24
              }}>
                <button
                  onClick={() => handleApplyClick(selectedJob)}
                  style={{
                    backgroundColor: themeTokens.brandBlue,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 24,
                    padding: '10px 24px',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 6px rgba(10,102,194,0.3)',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeTokens.brandBlueHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = themeTokens.brandBlue}
                >
                  {appliedJobs[selectedJob.id] ? '✓ Applied' : 'Apply ↗'}
                </button>

                <button
                  onClick={() => handleToggleSaveJob(selectedJob.id)}
                  style={{
                    backgroundColor: 'transparent',
                    color: savedJobs[selectedJob.id] ? themeTokens.brandBlue : themeTokens.brandBlue,
                    border: `1.5px solid ${themeTokens.brandBlue}`,
                    borderRadius: 24,
                    padding: '9px 20px',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {savedJobs[selectedJob.id] ? 'Saved' : 'Save'}
                </button>
              </div>

              {/* ─── LINKEDIN AI MATCH & QUALIFICATIONS CARD (media_1789641431661.png) ─── */}
              <div style={{
                backgroundColor: isLight ? '#F8FAFC' : '#17202C',
                border: `1px solid ${isLight ? '#D0D7DE' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 10,
                padding: '16px 20px',
                marginBottom: 28
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <p style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 600,
                      color: themeTokens.textPrimary,
                      lineHeight: 1.35
                    }}>
                      Your profile and resume <strong style={{ color: themeTokens.brandBlue }}>match key technical requirements</strong> for this role.
                    </p>
                    <p style={{ margin: '4px 0 12px', fontSize: 13, color: themeTokens.textSecondary }}>
                      SmartHire AI evaluation across verified Direct Client criteria.
                    </p>

                    <button
                      onClick={() => setShowMatchDetails(!showMatchDetails)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: themeTokens.brandBlue,
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      {showMatchDetails ? 'Hide match details' : 'Show match details'}
                    </button>
                  </div>

                  {/* SmartHire Badge Avatar on right matching screenshot */}
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 14,
                    flexShrink: 0
                  }}>
                    SH
                  </div>
                </div>

                {/* Expandable Match Breakdown */}
                {showMatchDetails && (
                  <div style={{
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: `1px solid ${themeTokens.cardBorder}`,
                    fontSize: 13,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: themeTokens.greenAccent, fontWeight: 600 }}>
                      <span>✓</span>
                      <span>Rate & Compensation: Matching client budget range ({formatRateOrSalary ? formatRateOrSalary(selectedJob) : 'Competitive'})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: themeTokens.greenAccent, fontWeight: 600 }}>
                      <span>✓</span>
                      <span>Work Arrangement: {selectedJob.work_mode || 'On-site'} location alignment ({resolveJobLocation ? resolveJobLocation(selectedJob) : 'Location'})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: themeTokens.brandBlue, fontWeight: 600 }}>
                      <span>•</span>
                      <span>Contract Structure: Verified C2C / W2 requisition format</span>
                    </div>
                  </div>
                )}

                {/* Footer Feedback line matching screenshot */}
                <div style={{
                  marginTop: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: themeTokens.textMuted,
                  borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                  paddingTop: 10
                }}>
                  <span>BETA · Is this information helpful?</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setFeedbackGiven('up')}
                      style={{
                        background: feedbackGiven === 'up' ? themeTokens.brandBlueSoft : 'none',
                        border: `1px solid ${themeTokens.pillBorder}`,
                        cursor: 'pointer',
                        fontSize: 12,
                        padding: '3px 8px',
                        borderRadius: 4,
                        color: feedbackGiven === 'up' ? themeTokens.brandBlue : themeTokens.textSecondary,
                        fontWeight: 500
                      }}
                      title="Helpful"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setFeedbackGiven('down')}
                      style={{
                        background: feedbackGiven === 'down' ? themeTokens.brandBlueSoft : 'none',
                        border: `1px solid ${themeTokens.pillBorder}`,
                        cursor: 'pointer',
                        fontSize: 12,
                        padding: '3px 8px',
                        borderRadius: 4,
                        color: feedbackGiven === 'down' ? themeTokens.brandBlue : themeTokens.textSecondary,
                        fontWeight: 500
                      }}
                      title="Not helpful"
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              {/* ─── ABOUT THE JOB SECTION (media_1789641431661.png) ───────────── */}
              <div>
                <h2 style={{
                  margin: '0 0 4px',
                  fontSize: 19,
                  fontWeight: 700,
                  color: themeTokens.textPrimary
                }}>
                  About the job
                </h2>
                <h3 style={{
                  margin: '0 0 16px',
                  fontSize: 15,
                  fontWeight: 600,
                  color: themeTokens.textSecondary
                }}>
                  Description
                </h3>

                {/* Skills Chips Pills */}
                {Array.isArray(selectedJob.skills) && selectedJob.skills.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: themeTokens.textSecondary, marginBottom: 8 }}>
                      Required Tech Stack & Skills:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {selectedJob.skills.map((s, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 14,
                            backgroundColor: themeTokens.brandBlueSoft,
                            color: themeTokens.brandBlue,
                            fontSize: 12,
                            fontWeight: 600
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clean Formatted Description Text */}
                <div style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: themeTokens.textPrimary,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit'
                }}>
                  {jdText}
                </div>

                {/* Recruiter / Direct Client Compliance Footer */}
                <div style={{
                  marginTop: 32,
                  padding: '16px 20px',
                  borderRadius: 8,
                  backgroundColor: themeTokens.badgeBg,
                  border: `1px solid ${themeTokens.cardBorder}`,
                  fontSize: 13,
                  color: themeTokens.textSecondary
                }}>
                  <div style={{ fontWeight: 600, color: themeTokens.textPrimary, marginBottom: 4 }}>
                    SmartHire Direct Client Commitment
                  </div>
                  All requisitions listed on this portal are authorized direct client contracts. Resumes submitted are securely reviewed by assigned recruitment partners with candidate privacy and rate transparency.
                </div>

                {/* Sticky Apply Action at Bottom */}
                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-start' }}>
                  <button
                    onClick={() => handleApplyClick(selectedJob)}
                    style={{
                      backgroundColor: themeTokens.brandBlue,
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 24,
                      padding: '12px 32px',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(10,102,194,0.35)'
                    }}
                  >
                    {appliedJobs[selectedJob.id] ? '✓ Applied' : 'Apply for this position ↗'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
