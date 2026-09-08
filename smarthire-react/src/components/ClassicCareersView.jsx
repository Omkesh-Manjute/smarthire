import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatJobDescription } from '../utils/formatJobDescription'

export default function ClassicCareersView({
  jobs = [],
  filteredJobs = [],
  loading = false,
  searchQuery,
  setSearchQuery,
  selectedLocation,
  setSelectedLocation,
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
  clocksExpanded,
  setClocksExpanded,
  formatLiveTime,
  themeMode,
  setThemeMode,
  isLight,
  layoutView,
  handleSetLayoutView,
  cleanJobTitleWithPositionNumber,
  resolveJobLocation,
  formatExperience,
  isJobExpired,
  isDeadlineToday
}) {
  const navigate = useNavigate()

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

  const HERO_SLIDES = [
    { id: 1, image: '/career-hero-slide1.jpg', label: 'Corporate Tech HQ', caption: 'Direct Enterprise & State Contracts' },
    { id: 2, image: '/career-hero-slide2.jpg', label: 'Executive Boardroom', caption: 'Direct Client Boardroom & Strategic Roles' },
    { id: 3, image: '/career-hero-slide3.jpg', label: 'Cloud Engineering Center', caption: 'Cloud, Data Systems & Tech Innovation' },
    { id: 4, image: '/career-hero-prev-slide1.jpg', label: 'Digital Constellation Hub', caption: 'High-Impact Consulting & Systems Architecture' }
  ]

  const [heroMediaMode, setHeroMediaMode] = useState('video')
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0)
  const [isSliderHovered, setIsSliderHovered] = useState(false)

  useEffect(() => {
    if (isSliderHovered || heroMediaMode !== 'slides') return
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isSliderHovered, heroMediaMode, HERO_SLIDES.length])

  const getFullDescriptionText = (job) => {
    if (!job) return ''
    const raw = job.rawDescription || job.fullDescription || job.rawText || job.details || job.rawJd || job.description
    if (raw && typeof raw === 'string' && raw.length > 30) {
      return formatJobDescription(raw, job)
    }
    return formatJobDescription('', job)
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

          {/* Blog Link */}
          <button
            onClick={() => navigate('/blog')}
            title="SmartHire IT Career Blog"
            style={{
              background: 'none',
              border: `1px solid ${isLight ? '#E2E8F0' : '#374151'}`,
              color: isLight ? '#475569' : '#94A3B8',
              fontSize: 13,
              fontWeight: 600,
              padding: '6px 13px',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s ease'
            }}
          >
            <span>📝</span>
            <span>Blog</span>
          </button>

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

      {/* Executive Hero Section with Real Career Image Background Slider & Grid Canvas */}
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
          {/* Signature Eyebrow Badge */}
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

          {/* Main Headline — H1 for SEO */}
          <h1 style={{
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
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 15.5,
            color: '#E2E8F0',
            fontWeight: 500,
            maxWidth: 740,
            margin: '0 auto 10px',
            lineHeight: 1.65,
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.85)'
          }}>
            Explore verified requisitions across top State, Healthcare, and Enterprise clients and partner vendor networks. Review job requirements and submit your application directly with seamless 1-click apply.
          </p>

          {/* Elevated Floating Search Box - Positioned Comfortably Lower */}
          <div style={{
            backgroundColor: isLight ? '#FFFFFF' : '#111827',
            border: `1px solid ${isLight ? '#CBD5E1' : '#374151'}`,
            borderRadius: 12,
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            maxWidth: 820,
            margin: '38px auto 0',
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
        </div>
      </section>

      {/* Main Content: Jobs Grid */}
      <section id="jobs-list" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: theme.textPrimary, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Active IT Contract Vacancies</span>
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
            </h2>
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
                    <h3 className="sh-job-title" title={displayTitle}>
                      {displayTitle}
                    </h3>

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
                        margin: '0 0 8px',
                        fontSize: 12.5,
                        color: theme.textSecondary,
                        lineHeight: 1.55,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {summaryText}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setFullJdModalJob(job)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563EB',
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

      {/* ─── ATS FOOTER ─── */}
      <footer style={{
        backgroundColor: isLight ? '#F8FAFC' : '#0B0F19',
        borderTop: `1px solid ${theme.border}`,
        padding: '54px 32px 36px',
        marginTop: 64
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: 40,
          marginBottom: 40
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: theme.textPrimary, letterSpacing: '-0.02em' }}>
                Smart<span style={{ color: '#FF6B00' }}>Hire</span>
              </span>
              <span style={{
                color: '#2563EB',
                fontSize: 10.5,
                fontWeight: 800,
                backgroundColor: isLight ? '#EFF6FF' : 'rgba(37, 99, 235, 0.15)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                borderRadius: 4,
                padding: '1px 6px',
                letterSpacing: '0.04em'
              }}>
                CAREERS
              </span>
            </div>
            <p style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.6, maxWidth: 320, margin: 0 }}>
              SmartHire Applicant Tracking System & direct-client IT careers portal. Connecting premier IT talent with State Government, Healthcare, and Enterprise requisitions.
            </p>
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.textPrimary, marginBottom: 14, letterSpacing: '0.04em' }}>PORTAL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13, color: theme.textSecondary }}>
              <a href="#jobs-list" style={{ color: 'inherit', textDecoration: 'none' }}>Job Listings</a>
              <button onClick={() => handleSetLayoutView('zone')} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: 'inherit', fontSize: 13, cursor: 'pointer' }}>✨ Modern Zone View</button>
              <Link to="/ats" style={{ color: 'inherit', textDecoration: 'none' }}>Recruiter Platform</Link>
              <Link to="/blog" style={{ color: 'inherit', textDecoration: 'none' }}>Career Blog</Link>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.textPrimary, marginBottom: 14, letterSpacing: '0.04em' }}>CONTRACT TYPES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13, color: theme.textSecondary }}>
              <Link to="/blog/c2c-vs-w2-vs-1099-it-contracts-guide" style={{ color: 'inherit', textDecoration: 'none' }}>C2C Contracts</Link>
              <Link to="/blog/c2c-vs-w2-vs-1099-it-contracts-guide" style={{ color: 'inherit', textDecoration: 'none' }}>W2 Hourly / Salaried</Link>
              <Link to="/blog/c2c-vs-w2-vs-1099-it-contracts-guide" style={{ color: 'inherit', textDecoration: 'none' }}>1099 Independent</Link>
              <Link to="/blog" style={{ color: 'inherit', textDecoration: 'none' }}>Tax &amp; Contract Guide</Link>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.textPrimary, marginBottom: 14, letterSpacing: '0.04em' }}>LEGAL &amp; SUPPORT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13, color: theme.textSecondary }}>
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
          paddingTop: 22,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
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