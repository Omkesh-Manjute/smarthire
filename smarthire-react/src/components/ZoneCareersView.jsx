import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ZoneHeroOrbitalIllustration,
  ZoneRecruiterMeetingIllustration,
  AirbnbLogo,
  DropboxLogo,
  FacebookLogo,
  GoogleLogo,
  Step1SignUpIcon,
  Step2ProfileIcon,
  Step3SearchJobIcon,
  BarChartExpIcon,
  ClockContractIcon,
  CashSalaryIcon,
  WorkModeUserIcon,
  HeartBookmarkIcon,
  LocationPinIcon
} from './ZoneCareerAssets'

export default function ZoneCareersView({
  jobs = [],
  filteredJobs = [],
  loading = false,
  searchQuery,
  setSearchQuery,
  selectedLocation,
  setSelectedLocation,
  selectedCategory,
  setSelectedCategory,
  HOT_CATEGORIES = [],
  deadlineFilter,
  setDeadlineFilter,
  activeOpenJobs = [],
  todayDeadlineCount = 0,
  remoteCount = 0,
  hybridCount = 0,
  onsiteCount = 0,
  appliedJobs = {},
  savedJobs = {},
  handleToggleSaveJob,
  candidateUser,
  handleCandidateSignOut,
  setShowLoginModal,
  handleApplyClick,
  setFullJdModalJob,
  setActiveChatCandidate,
  setShowCvUploadModal,
  clocksExpanded,
  setClocksExpanded,
  formatLiveTime,
  themeMode,
  toggleTheme,
  isLight,
  layoutView,
  handleSetLayoutView,
  cleanJobTitleWithPositionNumber,
  resolveJobLocation,
  formatExperience,
  formatRateOrSalary,
  formatContractType,
  isJobExpired
}) {
  const navigate = useNavigate()

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

  return (
    <div style={{
      backgroundColor: theme.bg,
      color: theme.textPrimary,
      minHeight: '100vh',
      fontFamily: "'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      transition: 'background-color 0.2s, color 0.2s'
    }}>
      <style>{`
        h1, h2, h3, h4, .zone-font-heading {
          font-family: 'Barlow', 'DM Sans', sans-serif;
        }

        .zone-search-box {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 8px 8px 8px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 20px 40px -4px rgba(0, 0, 0, 0.45);
          width: 100%;
          max-width: 620px;
          margin-top: 28px;
        }

        .zone-cat-card {
          background-color: ${theme.cardBg};
          border: 1px solid ${theme.border};
          border-radius: 16px;
          padding: 32px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: ${theme.cardShadow};
        }
        .zone-cat-card:hover {
          transform: translateY(-4px);
          box-shadow: ${theme.cardHoverShadow};
          border-color: ${theme.primary};
        }
        .zone-cat-card.active {
          border-color: ${theme.primary};
          background-color: ${isLight ? '#FFF8F5' : '#261C20'};
          box-shadow: 0 0 0 2px ${theme.primary};
        }

        .zone-job-card {
          background-color: ${theme.cardBg};
          border: 1px solid ${theme.border};
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: ${theme.cardShadow};
          position: relative;
        }
        .zone-job-card:hover {
          transform: translateY(-4px);
          box-shadow: ${theme.cardHoverShadow};
          border-color: ${theme.primary};
        }
        .zone-job-title {
          font-size: 18px;
          font-weight: 700;
          color: ${theme.textPrimary};
          margin: 12px 0 6px;
          line-height: 1.35;
          letter-spacing: -0.015em;
          transition: color 0.15s ease;
          font-family: 'Barlow', 'DM Sans', sans-serif;
        }
        .zone-job-card:hover .zone-job-title {
          color: ${theme.primary};
        }

        .zone-step-card {
          text-align: center;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      `}</style>

      {/* ─── 1. ZONE TOP NAVBAR ────────────────────────────────────────────── */}
      <header style={{
        backgroundColor: theme.headerBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.03)' : '0 1px 4px rgba(0,0,0,0.2)'
      }}>
        {/* Left Brand: ZONE style SmartHire• */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
            <span style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: 24,
              fontWeight: 800,
              color: theme.textPrimary,
              letterSpacing: '-0.03em'
            }}>
              Smart<span style={{ color: theme.primary }}>Hire</span>
            </span>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: theme.primary,
              display: 'inline-block',
              marginLeft: 4,
              marginBottom: 8
            }} />
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 22, fontSize: 14, fontWeight: 600 }}>
            <Link to="/" style={{ color: theme.textSecondary, textDecoration: 'none', transition: 'color 0.15s' }}>Home</Link>
            <a href="#jobs-list" style={{ color: theme.primary, textDecoration: 'none', fontWeight: 700 }}>Jobs</a>
            <a href="#categories" style={{ color: theme.textSecondary, textDecoration: 'none' }}>Categories</a>
            <a href="#for-candidates" style={{ color: theme.textSecondary, textDecoration: 'none' }}>For Candidates</a>
            <a href="#for-recruiters" style={{ color: theme.textSecondary, textDecoration: 'none' }}>For Recruiters</a>
            <Link to="/blog" style={{ color: theme.textSecondary, textDecoration: 'none' }}>Blog</Link>
          </nav>
        </div>

        {/* Right Tools: Mode Switcher, Clocks, Auth, Theme, Portal CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* 1-Click Layout Mode Switcher */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: '2px 4px',
            border: `1px solid ${isLight ? 'rgba(203, 213, 225, 0.85)' : 'rgba(255, 255, 255, 0.15)'}`
          }}>
            <button
              type="button"
              onClick={() => handleSetLayoutView('classic')}
              style={{
                background: layoutView === 'classic' ? (isLight ? '#1E293B' : '#2563EB') : 'transparent',
                color: layoutView === 'classic' ? '#FFFFFF' : theme.textSecondary,
                border: 'none',
                borderRadius: 16,
                padding: '4px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span>🏛️ Classic ATS</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetLayoutView('zone')}
              style={{
                background: layoutView === 'zone' ? '#FA541C' : 'transparent',
                color: layoutView === 'zone' ? '#FFFFFF' : theme.textSecondary,
                border: 'none',
                borderRadius: 16,
                padding: '4px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span>✨ Zone Modern</span>
            </button>
          </div>

          {/* US Clocks Tooltip / Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setClocksExpanded(!clocksExpanded)}
              style={{
                background: clocksExpanded ? (isLight ? '#FEE9D1' : '#33201C') : (isLight ? '#F4F6F8' : '#1C252E'),
                color: clocksExpanded ? theme.primary : theme.textSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
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
                borderRadius: 12,
                padding: 14,
                width: 270,
                boxShadow: '0 16px 32px rgba(0,0,0,0.15)',
                zIndex: 2100,
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: theme.primary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                  US Real-Time Clocks
                </div>
                {[
                  { name: 'Eastern (EST)', tz: 'America/New_York' },
                  { name: 'Central (CST)', tz: 'America/Chicago' },
                  { name: 'Mountain (MST)', tz: 'America/Denver' },
                  { name: 'Pacific (PST)', tz: 'America/Los_Angeles' }
                ].map((c) => {
                  const t = formatLiveTime(c.tz)
                  return (
                    <div key={c.tz} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <span style={{ color: theme.textSecondary, fontWeight: 600 }}>{c.name}</span>
                      <strong style={{ color: theme.textPrimary, fontFamily: 'monospace' }}>{t.time}</strong>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            style={{
              background: isLight ? '#F4F6F8' : '#1C252E',
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 14,
              cursor: 'pointer',
              color: theme.textPrimary
            }}
          >
            {isLight ? '🌙' : '☀️'}
          </button>

          {/* Candidate Profile / Sign In */}
          {candidateUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: theme.primary }}>
                👤 {candidateUser.name}
              </span>
              <button
                onClick={handleCandidateSignOut}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.textSecondary,
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
                background: 'transparent',
                border: 'none',
                color: theme.textPrimary,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
          )}

          {/* Primary CTA: ATS Portal */}
          <button
            onClick={() => navigate('/ats')}
            style={{
              backgroundColor: '#1C252E',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primary}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1C252E'}
          >
            <span>⚡ ATS Portal</span>
            <span>↗</span>
          </button>
        </div>
      </header>

      {/* ─── 2. ZONE HERO SECTION (SCREENSHOT 1) ───────────────────────────── */}
      <section style={{
        backgroundColor: '#141A21',
        backgroundImage: `
          radial-gradient(circle at 85% 30%, rgba(250, 84, 28, 0.18) 0%, transparent 55%),
          radial-gradient(circle at 15% 70%, rgba(142, 51, 255, 0.12) 0%, transparent 50%)
        `,
        padding: '70px 32px 80px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr',
          gap: 48,
          alignItems: 'center'
        }}>
          {/* Left Column: Headline, Search Box, Brands, Stats */}
          <div>
            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 62px)',
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1.12,
              letterSpacing: '-0.025em',
              margin: '0 0 18px',
              fontFamily: "'Barlow', 'DM Sans', sans-serif"
            }}>
              Get the{' '}
              <span style={{
                color: '#FA541C',
                background: 'linear-gradient(90deg, #FA541C 0%, #FDAB76 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Career
              </span>
              <br />
              you deserve
            </h1>

            <p style={{
              fontSize: 16,
              color: '#919EAB',
              lineHeight: 1.6,
              maxWidth: 500,
              margin: '0 0 24px'
            }}>
              Explore verified requisitions across top State Government, Healthcare Systems, and Enterprise leaders. Review requirements and apply directly in 1 click.
            </p>

            {/* Floating Search Console (Screenshot 1) */}
            <div className="zone-search-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <span style={{ color: '#919EAB', fontSize: 16 }}>🔍</span>
                <input
                  type="text"
                  placeholder="Job title, keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: 14,
                    color: '#1C252E',
                    width: '100%',
                    fontWeight: 500,
                    background: 'transparent'
                  }}
                />
              </div>

              <div style={{ width: 1, height: 26, backgroundColor: '#DFE3E8' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 140 }}>
                <LocationPinIcon size={18} color="#919EAB" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: 14,
                    color: '#1C252E',
                    fontWeight: 600,
                    background: 'transparent',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  <option value="All">All Locations</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>
              </div>

              <button
                onClick={() => {
                  const el = document.getElementById('jobs-list')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#FA541C',
                  color: '#FFFFFF',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 18,
                  boxShadow: '0 8px 16px rgba(250, 84, 28, 0.35)',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B3200E'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FA541C'}
                title="Search Jobs"
              >
                🔍
              </button>
            </div>

            {/* Brands Row (Screenshot 1) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 28,
              marginTop: 36,
              color: '#FFFFFF',
              opacity: 0.65
            }}>
              <AirbnbLogo />
              <DropboxLogo />
              <FacebookLogo />
              <GoogleLogo />
            </div>

            {/* 4 Stat Metric Counters (Screenshot 1) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 20,
              marginTop: 48,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: 32
            }}>
              {[
                { metric: `${jobs.length || 60}+`, label: 'Jobs' },
                { metric: '100%', label: 'Direct Hiring' },
                { metric: '< 24h', label: 'Review Time' },
                { metric: '0', label: 'Intermediaries' }
              ].map((s, idx) => (
                <div key={idx}>
                  <div style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: '#FFFFFF',
                    fontFamily: "'Barlow', sans-serif"
                  }}>
                    {s.metric}
                  </div>
                  <div style={{ fontSize: 13, color: '#919EAB', marginTop: 2 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Zone Orbital Graphic */}
          <div>
            <ZoneHeroOrbitalIllustration />
          </div>
        </div>
      </section>

      {/* ─── 3. FOR CANDIDATES SECTION (SCREENSHOT 2) ──────────────────────── */}
      <section id="for-candidates" style={{
        padding: '96px 32px',
        maxWidth: 1200,
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 800,
          color: theme.primary,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 10
        }}>
          FOR CANDIDATES
        </div>

        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 800,
          color: theme.textPrimary,
          margin: '0 0 12px',
          letterSpacing: '-0.02em'
        }}>
          Explore thousands of jobs
        </h2>

        <p style={{
          fontSize: 15.5,
          color: theme.textSecondary,
          maxWidth: 620,
          margin: '0 auto 56px',
          lineHeight: 1.6
        }}>
          A simple 3-step streamlined pathway to connect with premier IT employers and land your next high-impact contract.
        </p>

        {/* 3 Step Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 32,
          marginBottom: 56
        }}>
          <div className="zone-step-card">
            <Step1SignUpIcon />
            <div style={{ fontSize: 11, fontWeight: 800, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 18, marginBottom: 8 }}>
              STEP 1
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary, margin: '0 0 10px' }}>
              Create an account
            </h3>
            <p style={{ fontSize: 13.5, color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>
              Quick 1-click Google or email sign-in to track your applications and recruiter responses in real-time.
            </p>
          </div>

          <div className="zone-step-card">
            <Step2ProfileIcon />
            <div style={{ fontSize: 11, fontWeight: 800, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 18, marginBottom: 8 }}>
              STEP 2
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary, margin: '0 0 10px' }}>
              Complete your profile
            </h3>
            <p style={{ fontSize: 13.5, color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>
              Upload your resume for automated AI skill extraction, tax term mapping (C2C, W2, 1099), and rate preferences.
            </p>
          </div>

          <div className="zone-step-card">
            <Step3SearchJobIcon />
            <div style={{ fontSize: 11, fontWeight: 800, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 18, marginBottom: 8 }}>
              STEP 3
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary, margin: '0 0 10px' }}>
              Search your job
            </h3>
            <p style={{ fontSize: 13.5, color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>
              Filter by remote eligibility, client domain, and pay rate, then submit your application directly with 1 click.
            </p>
          </div>
        </div>

        {/* Action Button: Upload your CV */}
        <button
          onClick={() => setShowCvUploadModal(true)}
          style={{
            backgroundColor: '#1C252E',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 10,
            padding: '14px 28px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 14px rgba(28, 37, 46, 0.25)',
            transition: 'transform 0.15s, background-color 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.primary
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1C252E'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <span>📄</span>
          <span>Upload your CV</span>
        </button>
      </section>

      {/* ─── 4. HOT CATEGORIES SECTION (SCREENSHOT 3) ──────────────────────── */}
      <section id="categories" style={{
        padding: '40px 32px 80px',
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 38px)',
            fontWeight: 800,
            color: theme.textPrimary,
            margin: '0 0 8px',
            letterSpacing: '-0.02em'
          }}>
            Hot categories
          </h2>
          <p style={{ fontSize: 14.5, color: theme.textSecondary, margin: 0 }}>
            Browse active contract opportunities classified by industry domain.
          </p>
        </div>

        {/* 8 Category Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 20
        }}>
          {HOT_CATEGORIES.map((cat) => {
            const IconComponent = cat.icon
            const isSelected = selectedCategory === cat.id
            return (
              <div
                key={cat.id}
                className={`zone-cat-card ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(isSelected ? 'all' : cat.id)
                  const el = document.getElementById('jobs-list')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <div style={{ color: isSelected ? theme.primary : theme.textSecondary }}>
                  <IconComponent />
                </div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: isSelected ? theme.primary : theme.textPrimary,
                  fontFamily: "'Barlow', sans-serif"
                }}>
                  {cat.name}
                </div>
                <div style={{ fontSize: 12.5, color: theme.textSecondary, fontWeight: 500 }}>
                  {cat.count}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── 5. FEATURED JOBS / ACTIVE VACANCIES SECTION (SCREENSHOT 4) ─────── */}
      <section id="jobs-list" style={{
        padding: '50px 32px 90px',
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 32
        }}>
          <div>
            <h2 style={{
              fontSize: 'clamp(24px, 3.5vw, 32px)',
              fontWeight: 800,
              color: theme.textPrimary,
              margin: '0 0 6px',
              letterSpacing: '-0.02em'
            }}>
              Active IT Contract Vacancies
            </h2>
            <p style={{ fontSize: 14, color: theme.textSecondary, margin: 0 }}>
              Showing {filteredJobs.length} verified direct-client IT positions
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme.primary,
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginLeft: 8
                  }}
                >
                  (Clear {HOT_CATEGORIES.find(c => c.id === selectedCategory)?.name} filter ✕)
                </button>
              )}
            </p>
          </div>

          {/* Quick Filter Segmented Chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'All', label: 'All Roles' },
              { id: 'Today', label: `⏰ Closing Today (${todayDeadlineCount})` },
              { id: 'Remote', label: `Remote (${remoteCount})` },
              { id: 'Hybrid', label: `Hybrid (${hybridCount})` },
              { id: 'Onsite', label: `Onsite (${onsiteCount})` }
            ].map((chip) => {
              const active = selectedLocation === chip.id
              return (
                <button
                  key={chip.id}
                  onClick={() => setSelectedLocation(chip.id)}
                  style={{
                    backgroundColor: active ? (isLight ? '#1C252E' : '#FA541C') : (isLight ? '#F4F6F8' : '#1C252E'),
                    color: active ? '#FFFFFF' : theme.textSecondary,
                    border: `1px solid ${active ? 'transparent' : theme.border}`,
                    borderRadius: 20,
                    padding: '6px 14px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12, animation: 'spin 1s linear infinite' }}>⏳</div>
            <p style={{ color: theme.textSecondary, fontSize: 15 }}>Loading active client requisitions...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredJobs.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 24px',
            backgroundColor: theme.surface,
            borderRadius: 16,
            border: `1px solid ${theme.border}`
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', color: theme.textPrimary }}>
              No vacancies match your current search
            </h3>
            <p style={{ fontSize: 13.5, color: theme.textSecondary, margin: '0 0 16px' }}>
              Try clearing filters or search terms to browse all available requisitions.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedLocation('All'); setSelectedCategory('all'); }}
              style={{
                backgroundColor: theme.primary,
                color: '#FFF',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* 3-Column Job Cards Grid (Screenshot 4) */}
        {!loading && filteredJobs.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 24
          }}>
            {filteredJobs.map((job) => {
              const isApplied = appliedJobs[job.id]
              const isSaved = savedJobs[job.id]
              const expired = isJobExpired(job)

              const titleWords = (job.title || '').split(' ')
              const monogram = (titleWords[0]?.[0] || 'S') + (titleWords[1]?.[0] || 'H')
              const brandColor = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0284C7'][
                Math.abs(job.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 6
              ]

              return (
                <div key={job.id} className="zone-job-card">
                  <div>
                    {/* Top Row: Company Logo Badge & Heart Bookmark */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: brandColor,
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 800,
                        fontFamily: "'Barlow', sans-serif",
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
                      }}>
                        {monogram}
                      </div>

                      <HeartBookmarkIcon
                        saved={isSaved}
                        onClick={() => handleToggleSaveJob(job.id)}
                      />
                    </div>

                    {/* Job Title (Bold Barlow) */}
                    <h3
                      className="zone-job-title"
                      onClick={() => setFullJdModalJob(job)}
                      style={{ cursor: 'pointer' }}
                    >
                      {cleanJobTitleWithPositionNumber(job.title)}
                    </h3>

                    {/* Direct Client Link */}
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#00B8D9', marginBottom: 4 }}>
                      {job.client || 'Direct End-Client'}
                    </div>

                    {/* Location */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: theme.textSecondary, marginBottom: 8 }}>
                      <LocationPinIcon size={14} color="#919EAB" />
                      <span>{resolveJobLocation(job) || 'Remote, US'}</span>
                    </div>

                    {/* Posted Date */}
                    <div style={{ fontSize: 11.5, color: theme.textSecondary, marginBottom: 16 }}>
                      Posted at: {job.creationDate ? new Date(job.creationDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                    </div>

                    {/* Subtle Divider */}
                    <div style={{ height: 1, backgroundColor: theme.border, marginBottom: 16 }} />

                    {/* 2x2 Meta Attributes Grid (Screenshot 4) */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px 12px',
                      fontSize: 12,
                      color: theme.textSecondary,
                      marginBottom: 20
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BarChartExpIcon size={15} color="#919EAB" />
                        <span style={{ fontWeight: 600 }}>{formatExperience(job.experience)}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ClockContractIcon size={15} color="#919EAB" />
                        <span style={{ fontWeight: 600 }}>{formatContractType(job)}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CashSalaryIcon size={15} color="#919EAB" />
                        <span style={{ fontWeight: 600 }}>{formatRateOrSalary(job)}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <WorkModeUserIcon size={15} color="#919EAB" />
                        <span style={{ fontWeight: 600 }}>{job.work_mode || 'Remote'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingTop: 10, borderTop: `1px solid ${theme.border}` }}>
                    <button
                      onClick={() => setFullJdModalJob(job)}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        color: theme.textPrimary,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 8,
                        padding: '9px 12px',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, color 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = theme.primary
                        e.currentTarget.style.color = theme.primary
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = theme.border
                        e.currentTarget.style.color = theme.textPrimary
                      }}
                    >
                      📋 Full JD
                    </button>

                    {isApplied ? (
                      <button
                        onClick={() => {
                          const rec = appliedJobs[job.id]
                          if (rec) {
                            setActiveChatCandidate({
                              id: rec.candidateId || rec.sessionId,
                              sessionId: rec.sessionId,
                              name: rec.candidateName,
                              candidateName: rec.candidateName,
                              email: rec.candidateEmail,
                              jobTitle: job.title
                            })
                          }
                        }}
                        style={{
                          flex: 1.2,
                          background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 8,
                          padding: '9px 12px',
                          fontSize: 12.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        💬 Chat
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApplyClick(job)}
                        disabled={expired}
                        style={{
                          flex: 1.2,
                          background: expired ? (isLight ? '#F1F5F9' : '#334155') : 'linear-gradient(135deg, #FA541C 0%, #FDAB76 100%)',
                          color: expired ? '#94A3B8' : '#FFFFFF',
                          border: 'none',
                          borderRadius: 8,
                          padding: '9px 12px',
                          fontSize: 12.5,
                          fontWeight: 800,
                          cursor: expired ? 'not-allowed' : 'pointer',
                          boxShadow: expired ? 'none' : '0 4px 12px rgba(250, 84, 28, 0.35)',
                          transition: 'transform 0.15s'
                        }}
                        onMouseEnter={(e) => { if (!expired) e.currentTarget.style.transform = 'translateY(-1px)' }}
                        onMouseLeave={(e) => { if (!expired) e.currentTarget.style.transform = 'translateY(0)' }}
                      >
                        {expired ? 'Closed' : '⚡ Apply Now'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ─── 6. FOR RECRUITERS BANNER (SCREENSHOT 5) ────────────────────────── */}
      <section id="for-recruiters" style={{
        maxWidth: 1200,
        margin: '0 auto 100px',
        padding: '0 32px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #161C24 0%, #141A21 100%)',
          borderRadius: 24,
          padding: '56px 48px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 40,
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(250, 84, 28, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#FA541C',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 12
            }}>
              FOR RECRUITERS
            </div>

            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 800,
              color: '#FFFFFF',
              margin: '0 0 16px',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              Do you have a position to post job?
            </h2>

            <p style={{
              fontSize: 15,
              color: '#919EAB',
              lineHeight: 1.65,
              maxWidth: 480,
              margin: '0 0 32px'
            }}>
              Publish open requisitions to thousands of qualified IT candidates with instant AI matching, automated compliance verification, and real-time candidate pipeline tracking.
            </p>

            <button
              onClick={() => navigate('/dashboard')}
              style={{
                backgroundColor: '#FA541C',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                padding: '14px 28px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 8px 20px rgba(250, 84, 28, 0.4)',
                transition: 'background-color 0.15s, transform 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#B3200E'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FA541C'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span>📄</span>
              <span>Post a job</span>
            </button>
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <ZoneRecruiterMeetingIllustration />
          </div>
        </div>
      </section>

      {/* ─── 7. ZONE FOOTER ────────────────────────────────────────────────── */}
      <footer style={{
        backgroundColor: isLight ? '#F4F6F8' : '#0E1318',
        borderTop: `1px solid ${theme.border}`,
        padding: '64px 32px 40px'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: 40,
          marginBottom: 48
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 14 }}>
              <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 22, fontWeight: 800, color: theme.textPrimary }}>
                Smart<span style={{ color: theme.primary }}>Hire</span>
              </span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: theme.primary, display: 'inline-block', marginLeft: 3, marginBottom: 6 }} />
            </div>
            <p style={{ fontSize: 13.5, color: theme.textSecondary, lineHeight: 1.6, maxWidth: 320, margin: 0 }}>
              SmartHire Applicant Tracking System & direct-client IT careers portal. Connecting premier IT talent with State Government, Healthcare, and Enterprise requisitions.
            </p>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: theme.textPrimary, marginBottom: 16 }}>PORTAL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: theme.textSecondary }}>
              <a href="#jobs-list" style={{ color: 'inherit', textDecoration: 'none' }}>Job Listings</a>
              <a href="#categories" style={{ color: 'inherit', textDecoration: 'none' }}>Hot Categories</a>
              <a href="#for-candidates" style={{ color: 'inherit', textDecoration: 'none' }}>For Candidates</a>
              <a href="#for-recruiters" style={{ color: 'inherit', textDecoration: 'none' }}>For Recruiters</a>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: theme.textPrimary, marginBottom: 16 }}>CONTRACT TYPES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: theme.textSecondary }}>
              <Link to="/blog/c2c-vs-w2-vs-1099-it-contracts-guide" style={{ color: 'inherit', textDecoration: 'none' }}>C2C Contracts</Link>
              <Link to="/blog/c2c-vs-w2-vs-1099-it-contracts-guide" style={{ color: 'inherit', textDecoration: 'none' }}>W2 Hourly / Salaried</Link>
              <Link to="/blog/c2c-vs-w2-vs-1099-it-contracts-guide" style={{ color: 'inherit', textDecoration: 'none' }}>1099 Independent</Link>
              <Link to="/blog" style={{ color: 'inherit', textDecoration: 'none' }}>Tax &amp; Contract Guide</Link>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: theme.textPrimary, marginBottom: 16 }}>LEGAL &amp; SUPPORT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: theme.textSecondary }}>
              <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</Link>
              <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</Link>
              <Link to="/support" style={{ color: 'inherit', textDecoration: 'none' }}>Candidate Support</Link>
              <Link to="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>Contact Us</Link>
            </div>
          </div>
        </div>

        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          borderTop: `1px solid ${theme.border}`,
          paddingTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12.5,
          color: theme.textSecondary
        }}>
          <div>© 2026 SmartHire ATS. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 20 }}>
            <span>Verified Direct-Client Requisitions</span>
            <span>·</span>
            <span>Real-Time Matching</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
