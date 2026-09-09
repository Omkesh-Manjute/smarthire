import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SiteLayout from '../components/SiteLayout'

function Homepage() {
  const navigate = useNavigate()
  
  // Auth state
  const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user')
  let user = null
  try {
    if (userStr) user = JSON.parse(userStr)
  } catch (e) {}

  const isAuthenticated = 
    localStorage.getItem('smarthire_authenticated') === 'true' || 
    localStorage.getItem('verifyhire_authenticated') === 'true' ||
    Boolean(user && (user.email || user.name))

  // Login Modal / Form States
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Pricing Toggle State
  const [isYearly, setIsYearly] = useState(true)

  // Interactive Staffing Margin Calculator States
  const [billRate, setBillRate] = useState(85)
  const [payRate, setPayRate] = useState(65)
  const [consultantsCount, setConsultantsCount] = useState(3)

  // Calculated Margins
  const hourlySpread = Math.max(0, billRate - payRate)
  const monthlySpreadPerConsultant = hourlySpread * 160
  const annualSpreadTotal = monthlySpreadPerConsultant * 12 * consultantsCount

  // Login handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setErrorMessage('')
    
    try {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })

        const data = await res.json()
        if (res.ok && data.success) {
          const u = data.user
          localStorage.setItem('smarthire_authenticated', 'true')
          localStorage.setItem('smarthire_user', JSON.stringify({
            uid: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            refCode: u.refCode,
            company: u.company
          }))
          localStorage.setItem('smarthire_active_role', u.role)
          localStorage.setItem('smarthire_token', data.token || 'mock-token-' + u.id)
          setIsLoggingIn(false)
          setShowLoginModal(false)
          window.location.href = '/ats'
          return
        } else if (res.status === 401 || res.status === 403) {
          setErrorMessage(data.message || 'Invalid email or password.')
          setIsLoggingIn(false)
          return
        }
      } catch (backendErr) {
        console.warn('Backend login connection failed, falling back to local database:', backendErr.message)
      }

      // Fallback to localStorage
      const savedRecruitersRaw = localStorage.getItem('smarthire_recruiters')
      
      const defaultRecs = [
        { id: 'rec-1', name: 'Alex Morgan', email: 'admin@smarthire.com', role: 'superadmin', refCode: 'admin', company: 'SmartHire', isActive: true, password: 'admin' },
        { id: 'rec-2', name: 'Sarah Jenkins', email: 'recruiter@smarthire.com', role: 'recruiter', refCode: 'sarah-j', company: 'SmartHire', isActive: true, password: 'recruiter123' },
        { id: 'rec-3', name: 'David Chen', email: 'david@smarthire.com', role: 'manager', refCode: 'david-c', company: 'SmartHire', isActive: true, password: 'recruiter123' },
        { id: 'rec-4', name: 'Marcus Vance', email: 'sourcing@smarthire.com', role: 'employee', refCode: 'marcus-v', company: 'SmartHire', isActive: true, password: 'recruiter123', parentRecruiterName: 'Alex Morgan' },
        { id: 'rec-orig-1', name: 'Admin', email: 'omkesh@coolsofttech.com', role: 'superadmin', refCode: 'omkesh', company: 'SmartHire', isActive: true, password: 'admin' },
        { id: 'rec-orig-2', name: 'Recruiter', email: 'kamal@coolsofttech.com', role: 'recruiter', refCode: 'sukamal-chatterjee', company: 'SmartHire', isActive: true, password: 'recruiter123' },
        { id: 'rec-orig-3', name: 'Sourcing Specialist', email: 'gourav@coolsofttech.com', role: 'employee', refCode: 'gourav', company: 'SmartHire', isActive: true, password: 'recruiter123', parentRecruiterName: 'Admin' }
      ]

      let recruitersList = defaultRecs
      if (savedRecruitersRaw) {
        try {
          const parsed = JSON.parse(savedRecruitersRaw)
          if (Array.isArray(parsed) && parsed.length > 0) {
            recruitersList = [...defaultRecs, ...parsed.filter(p => !defaultRecs.some(d => d.email.toLowerCase() === p.email?.toLowerCase()))]
          }
        } catch (e) {}
      }

      const matchedUser = recruitersList.find(
        r => r.email.toLowerCase().trim() === email.toLowerCase().trim() && r.password === password
      )

      if (!matchedUser) {
        setErrorMessage('Invalid email or password.')
        setIsLoggingIn(false)
        return
      }

      if (!matchedUser.isActive) {
        setErrorMessage('Your account has been deactivated. Please contact support.')
        setIsLoggingIn(false)
        return
      }

      matchedUser.lastLogin = new Date().toISOString()
      localStorage.setItem('smarthire_authenticated', 'true')
      localStorage.setItem('smarthire_user', JSON.stringify({
        uid: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
        refCode: matchedUser.refCode,
        company: matchedUser.company
      }))
      localStorage.setItem('smarthire_active_role', matchedUser.role)
      localStorage.setItem('smarthire_token', 'mock-token-' + matchedUser.id)

      setShowLoginModal(false)
      window.location.href = '/ats'
    } catch (err) {
      setErrorMessage('Login error: ' + err.message)
    } finally {
      setIsLoggingIn(false)
    }
  }

  const fillDemoCreds = (demoEmail, demoPass) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setErrorMessage('')
  }

  return (
    <SiteLayout>
      <div className="tf-root">
        {/* =========================================================================
            HERO SECTION: theFront Style (Headline with highlight pill + Floating Dashboard Kit)
            ========================================================================= */}
        <section className="tf-hero-section">
          <div className="tf-container">
            <div className="tf-hero-grid">
              
              {/* Left Column: Typography & CTAs */}
              <div className="tf-hero-content">
                <div className="tf-badge-pill">
                  <span className="tf-badge-dot" />
                  <span>SMARTHIRE ENTERPRISE ATS V2.4 ACTIVE</span>
                </div>

                <h1 className="tf-hero-title">
                  Next-Gen Recruitment Operating System{' '}
                  <span className="tf-highlight-box">Built for Precision Staffing</span>
                </h1>

                <p className="tf-hero-subtitle">
                  Empower your staffing agency from candidate sourcing to client placement. Featuring placement-trained AI screening, private recruiter vaults, sub-second requisition sync, and anti-proxy biometric trust.
                </p>

                <div className="tf-hero-actions">
                  {isAuthenticated ? (
                    <>
                      <Link to="/ats" className="tf-btn tf-btn-primary">
                        Open ATS Console →
                      </Link>
                      <Link to="/careers" className="tf-btn tf-btn-outline">
                        View Careers Portal ↗
                      </Link>
                    </>
                  ) : (
                    <>
                      <button 
                        type="button" 
                        onClick={() => setShowLoginModal(true)} 
                        className="tf-btn tf-btn-primary"
                      >
                        Start now
                      </button>
                      <a href="#features" className="tf-btn tf-btn-outline">
                        Explore Features
                      </a>
                    </>
                  )}
                </div>

                {/* Social Proof / Trust Footnote */}
                <div className="tf-hero-trust">
                  <div className="tf-avatar-stack">
                    <span className="tf-avatar tf-av-1">AM</span>
                    <span className="tf-avatar tf-av-2">SJ</span>
                    <span className="tf-avatar tf-av-3">DC</span>
                    <span className="tf-avatar tf-av-4">MV</span>
                  </div>
                  <div className="tf-trust-text">
                    <strong>1,280+ High-Stakes Placements</strong>
                    <span>Private Recruiter Vaults & 99.4% Semantic Match Accuracy</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Floating Dashboard UI Mockup */}
              <div className="tf-hero-mockup-wrap">
                <div className="tf-dashboard-mockup">
                  
                  {/* Dark Left Sidebar */}
                  <div className="tf-dash-sidebar">
                    <div className="tf-dash-brand">
                      <div className="tf-dash-logo-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                      </div>
                      <span className="tf-dash-brand-name">SmartHire ATS</span>
                    </div>

                    <ul className="tf-dash-nav">
                      <li className="tf-dash-nav-item active">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7"/>
                          <rect x="14" y="3" width="7" height="7"/>
                          <rect x="14" y="14" width="7" height="7"/>
                          <rect x="3" y="14" width="7" height="7"/>
                        </svg>
                        <span>Overview</span>
                      </li>
                      <li className="tf-dash-nav-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <span>Requisitions</span>
                      </li>
                      <li className="tf-dash-nav-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span>Private Vaults</span>
                      </li>
                      <li className="tf-dash-nav-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polygon points="10 8 16 12 10 16 10 8"/>
                        </svg>
                        <span>AI Screening</span>
                      </li>
                      <li className="tf-dash-nav-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="20" x2="18" y2="10"/>
                          <line x1="12" y1="20" x2="12" y2="4"/>
                          <line x1="6" y1="20" x2="6" y2="14"/>
                        </svg>
                        <span>Manager Reports</span>
                      </li>
                      <li className="tf-dash-nav-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        <span>RBAC Security</span>
                      </li>
                    </ul>
                  </div>

                  {/* Main Clean Body */}
                  <div className="tf-dash-main">
                    
                    {/* Top App Header */}
                    <div className="tf-dash-header">
                      <div className="tf-dash-title-wrap">
                        <h3>Overview</h3>
                      </div>
                      <div className="tf-dash-user">
                        <span className="tf-dash-search-icon">🔍</span>
                        <span className="tf-dash-bell">🔔</span>
                        <div className="tf-dash-user-info">
                          <span className="tf-dash-user-name">Alex Morgan</span>
                          <span className="tf-dash-user-role">Super Admin (RBAC Active)</span>
                        </div>
                      </div>
                    </div>

                    {/* 4 KPI Cards */}
                    <div className="tf-dash-kpis">
                      <div className="tf-kpi-card">
                        <span className="tf-kpi-label">Active Reqs</span>
                        <span className="tf-kpi-num">64</span>
                      </div>
                      <div className="tf-kpi-card tf-kpi-highlighted">
                        <span className="tf-kpi-label">Pending Review</span>
                        <span className="tf-kpi-num tf-text-blue">16</span>
                      </div>
                      <div className="tf-kpi-card">
                        <span className="tf-kpi-label">In-Interview</span>
                        <span className="tf-kpi-num">43</span>
                      </div>
                      <div className="tf-kpi-card">
                        <span className="tf-kpi-label">AI Screened</span>
                        <span className="tf-kpi-num">142</span>
                      </div>
                    </div>

                    {/* Today's Trends Line Chart + Right Stats */}
                    <div className="tf-dash-chart-card">
                      <div className="tf-chart-left">
                        <div className="tf-chart-head">
                          <div className="tf-chart-head-top">
                            <h4>Today's sourcing trends</h4>
                            <span className="tf-live-stream-badge">
                              <span className="tf-pulse-dot" /> LIVE TELEMETRY
                            </span>
                          </div>
                          <span className="tf-chart-timestamp">as of 25 May 2026, 09:41 PM</span>
                          <div className="tf-chart-legend">
                            <span className="tf-legend-dot blue"></span> Today
                            <span className="tf-legend-dot gray"></span> Yesterday
                          </div>
                        </div>

                        {/* Interactive SVG Bezier Chart with Animated Wave & Radar Pulse */}
                        <div className="tf-svg-chart-container">
                          <svg viewBox="0 0 420 180" className="tf-bezier-svg">
                            <defs>
                              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28"/>
                                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0"/>
                              </linearGradient>
                            </defs>
                            <line x1="0" y1="40" x2="420" y2="40" stroke="#f1f5f9" strokeDasharray="3 3" />
                            <line x1="0" y1="80" x2="420" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
                            <line x1="0" y1="120" x2="420" y2="120" stroke="#f1f5f9" strokeDasharray="3 3" />
                            <line x1="0" y1="160" x2="420" y2="160" stroke="#f1f5f9" strokeDasharray="3 3" />

                            {/* Yesterday Reference Curve */}
                            <path 
                              className="tf-chart-yesterday-curve"
                              d="M 10,140 Q 60,110 110,130 T 210,100 T 310,120 T 410,70" 
                              fill="none" 
                              stroke="#cbd5e1" 
                              strokeWidth="2" 
                              strokeDasharray="4 4" 
                            />

                            {/* Animated Sourcing Gradient Fill Area (Up/Down Wave Motion) */}
                            <path 
                              className="tf-chart-area-fill"
                              d="M 10,150 Q 70,80 130,135 T 250,55 T 340,115 T 410,40 L 410,180 L 10,180 Z" 
                              fill="url(#chartGrad)" 
                            />

                            {/* Animated Sourcing Main Line (Smooth Draw-in & Wave Breathing) */}
                            <path 
                              className="tf-chart-main-curve"
                              d="M 10,150 Q 70,80 130,135 T 250,55 T 340,115 T 410,40" 
                              fill="none" 
                              stroke="#2563eb" 
                              strokeWidth="2.5" 
                              strokeLinecap="round"
                            />

                            {/* Peak Point Radar Ping Circles */}
                            <circle cx="250" cy="55" r="14" className="tf-chart-ping" />
                            <circle cx="250" cy="55" r="8" className="tf-chart-ping-inner" />
                            <circle cx="250" cy="55" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" className="tf-chart-peak-dot" />

                            {/* Floating Peak Tooltip (Badge '38') */}
                            <g className="tf-chart-tooltip-group">
                              <rect x="235" y="22" width="30" height="21" rx="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" className="tf-tooltip-rect" />
                              <polygon points="247,43 253,43 250,46" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                              <text x="250" y="37" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#0f172a">38</text>
                            </g>
                          </svg>
                          <div className="tf-chart-x-labels">
                            <span>0</span><span>2</span><span>4</span><span>6</span><span>8</span><span>10</span><span>12</span><span>14</span><span>16</span><span>18</span><span>20</span><span>22</span>
                          </div>
                        </div>
                      </div>

                      {/* Right KPI Sidebar */}
                      <div className="tf-chart-stats-col">
                        <div className="tf-stat-item">
                          <span className="tf-stat-label">Resolved / Placed</span>
                          <span className="tf-stat-val">449</span>
                        </div>
                        <div className="tf-stat-item">
                          <span className="tf-stat-label">Received / Sourced</span>
                          <span className="tf-stat-val">426</span>
                        </div>
                        <div className="tf-stat-item">
                          <span className="tf-stat-label">Avg first response</span>
                          <span className="tf-stat-val">18m</span>
                        </div>
                        <div className="tf-stat-item">
                          <span className="tf-stat-label">AI Match Latency</span>
                          <span className="tf-stat-val">0.8s</span>
                        </div>
                        <div className="tf-stat-item">
                          <span className="tf-stat-label">SLA Deadline Compliance</span>
                          <span className="tf-stat-val">99%</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Recent Candidate Pipeline & Tasks */}
                    <div className="tf-dash-bottom-grid">
                      <div className="tf-dash-subcard">
                        <div className="tf-subcard-head">
                          <h5>Recent Verified Submissions</h5>
                          <span className="tf-view-all">View details</span>
                        </div>
                        <ul className="tf-mini-list">
                          <li>
                            <div className="tf-cand-mini-info">
                              <span className="tf-cand-name">Jordan Lee</span>
                              <span className="tf-cand-role">Sr AWS Developer (Req #158997)</span>
                            </div>
                            <span className="tf-pill-badge blue">⚡ AI SCREENED</span>
                          </li>
                          <li>
                            <div className="tf-cand-mini-info">
                              <span className="tf-cand-name">Sarah Jenkins</span>
                              <span className="tf-cand-role">Cloud Architect (Pos #808496)</span>
                            </div>
                            <span className="tf-pill-badge green">✓ RTR CONFIRMED</span>
                          </li>
                          <li>
                            <div className="tf-cand-mini-info">
                              <span className="tf-cand-name">Michael Chang</span>
                              <span className="tf-cand-role">Full Stack Engineer</span>
                            </div>
                            <span className="tf-pill-badge orange">INTERVIEW</span>
                          </li>
                        </ul>
                      </div>

                      <div className="tf-dash-subcard">
                        <div className="tf-subcard-head">
                          <h5>Compliance & Vault Security</h5>
                          <span className="tf-view-all">View all</span>
                        </div>
                        <ul className="tf-mini-tasks">
                          <li>
                            <span>Private Vault Data Isolation</span>
                            <span className="tf-task-badge urgent">ENFORCED</span>
                          </li>
                          <li>
                            <span>Digital RTR Document Signed</span>
                            <span className="tf-task-badge new">COMPLETED</span>
                          </li>
                          <li>
                            <span>Anti-Proxy Face Liveness Verification</span>
                            <span className="tf-task-badge default">PASSED 99.1%</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: CORE ATS FEATURES GRID (8 High-Impact Feature Cards)
            ========================================================================= */}
        <section className="tf-features-section" id="features">
          <div className="tf-container">
            <div className="tf-section-header text-center">
              <span className="tf-eyebrow-amber">INTELLIGENT RECRUITMENT AUTOMATION</span>
              <h2 className="tf-section-title">Engineered for High-Velocity Recruiter Workflows</h2>
              <p className="tf-section-subtitle">
                Zero data leakage, fully trained AI screening, instant JD-to-talent matching alerts, and digital RTR compliance designed for enterprise staffing teams.
              </p>
            </div>

            <div className="tf-features-cards-grid">
              
              {/* Feature 1: Isolated Recruiter Vaults */}
              <div className="tf-feature-box">
                <div className="tf-feature-icon-wrap blue-bg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <h3 className="tf-feature-title">Isolated Recruiter Vaults & Role Privacy</h3>
                <p className="tf-feature-desc">
                  Strict individual database role-based access. No recruiter can see, edit, or poach another recruiter's candidates or notes. Complete privacy for every team member with supervisor audit visibility.
                </p>
                <div className="tf-feature-tag">Zero-Leakage RBAC Vaults</div>
              </div>

              {/* Feature 2: Smart JD-Candidate Instant Match Alerts */}
              <div className="tf-feature-box">
                <div className="tf-feature-icon-wrap amber-bg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <h3 className="tf-feature-title">Smart JD-Match Proactive Alerts</h3>
                <p className="tf-feature-desc">
                  Our background intelligence engine automatically scans your candidate vault the instant a new Requisition or JD arrives. If your candidate is a strong match, you receive an immediate alert.
                </p>
                <div className="tf-feature-tag">Instant Talent Match Chimes</div>
              </div>

              {/* Feature 3: Autonomous AI Candidate Screening Agent */}
              <div className="tf-feature-box">
                <div className="tf-feature-icon-wrap emerald-bg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    <circle cx="9" cy="10" r="1"/>
                    <circle cx="15" cy="10" r="1"/>
                  </svg>
                </div>
                <h3 className="tf-feature-title">Autonomous AI Screening & Confirmation</h3>
                <p className="tf-feature-desc">
                  An advanced conversational AI agent interacts with candidates 24/7. It screens mandatory technical proficiencies, verifies compensation expectations, and secures availability before recruiter review.
                </p>
                <div className="tf-feature-tag">Trained Pre-Screening AI</div>
              </div>

              {/* Feature 4: 1-Click Digital RTR & Compliance Document Intake */}
              <div className="tf-feature-box">
                <div className="tf-feature-icon-wrap indigo-bg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <h3 className="tf-feature-title">Instant Digital RTR & Document Intake</h3>
                <p className="tf-feature-desc">
                  Collect digital Right-to-Represent (RTR) agreements, passports, visas, work authorizations (C2C/W2/1099), and rate lock confirmations in one instant step before client presentation.
                </p>
                <div className="tf-feature-tag">1-Click RTR Sign & Lock</div>
              </div>

              {/* Feature 5: Real-Time Candidate Chat & Close System */}
              <div className="tf-feature-box">
                <div className="tf-feature-icon-wrap purple-bg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <h3 className="tf-feature-title">Integrated Candidate Chat & Fast Close</h3>
                <p className="tf-feature-desc">
                  Direct recruiter-to-candidate messaging portal. Negotiate bill/pay spreads, send live job briefs, and lock in submission confirmations without telephone tag delays.
                </p>
                <div className="tf-feature-tag">Live Recruiter-Talent Chat</div>
              </div>

              {/* Feature 6: Smart SLA Deadline & Priority Tracking */}
              <div className="tf-feature-box">
                <div className="tf-feature-icon-wrap cyan-bg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <h3 className="tf-feature-title">Smart SLA Deadline & Priority Tracking</h3>
                <p className="tf-feature-desc">
                  Proactive notification engine flags expiring requisitions, client submission cut-offs, and interview schedules so your team never misses a lucrative placement window.
                </p>
                <div className="tf-feature-tag">Requisition Cut-off Timers</div>
              </div>

              {/* Feature 7: Manager Command Hub & Audit Reports */}
              <div className="tf-feature-box">
                <div className="tf-feature-icon-wrap blue-bg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                </div>
                <h3 className="tf-feature-title">Manager Command Hub & Audit Reports</h3>
                <p className="tf-feature-desc">
                  Dedicated leadership views to oversee sourcing specialist throughput, track sub-recruiter pipeline metrics, review margin spreads, and export comprehensive compliance audit logs.
                </p>
                <div className="tf-feature-tag">Executive Pipeline Analytics</div>
              </div>

              {/* Feature 8: Anti-Proxy Biometric & Identity Flow */}
              <div className="tf-feature-box">
                <div className="tf-feature-icon-wrap emerald-bg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <h3 className="tf-feature-title">Anti-Proxy & Biometric Identity Flow</h3>
                <p className="tf-feature-desc">
                  Prevent candidate substitution and proxy fraud. Candidate facial liveness verification, official ID document OCR matching, and IP geolocation telemetry guarantee authentic talent submissions.
                </p>
                <div className="tf-feature-tag">99.1% Biometric Precision</div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION: 24x7 AUTONOMOUS RECRUITMENT WORKFLOW TIMELINE
            (Inspired by Tasklet.ai reference: continuous animated scanning beam,
             alternating event milestone cards above & below the 24h timeline)
            ========================================================================= */}
        <section className="tf-workflow-section" id="automations">
          <div className="tf-container">
            {/* Section Header */}
            <div className="tf-section-header text-center">
              <span className="tf-section-tag">AUTONOMOUS RECRUITMENT WORKFLOWS</span>
              <h2 className="tf-section-title">
                Automate staffing 24x7 with <span className="tf-highlight-box">always-on workflows</span>
              </h2>
              <p className="tf-section-subtitle">
                SmartHire autonomous agents take ongoing responsibility for full-cycle recruitment operations: ingesting live requisitions, ranking matched talent, conducting pre-screening, taking digital RTRs, and dispatching real-time alerts.
              </p>
            </div>

            {/* Main Interactive Workflow Timeline Card */}
            <div className="tf-workflow-card">
              {/* Card Top Header */}
              <div className="tf-wf-card-header">
                <div className="tf-wf-header-left">
                  <span className="tf-wf-status-beacon">
                    <span className="tf-wf-pulse-ring"></span>
                    <span className="tf-wf-pulse-dot"></span>
                  </span>
                  <span className="tf-wf-period-label">24-HOUR AUTONOMOUS RECRUITMENT CYCLE</span>
                </div>
                <div className="tf-wf-header-right">
                  <span className="tf-wf-stats-pill">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    6 runs completed • 100% SLA
                  </span>
                </div>
              </div>

              {/* Desktop Interactive 24-Hour Timeline Stage */}
              <div className="tf-timeline-stage">
                {/* Horizontal Timeline Rail */}
                <div className="tf-timeline-rail">
                  {/* Continuous Animated Scanning Laser Beam */}
                  <div className="tf-timeline-beam-runner">
                    <div className="tf-timeline-beam-head"></div>
                  </div>

                  {/* Milestone Rail Nodes (6 points matching events) */}
                  <div className="tf-rail-node" style={{ left: '9%' }}>
                    <span className="tf-node-ping"></span>
                    <span className="tf-node-dot"></span>
                  </div>
                  <div className="tf-rail-node" style={{ left: '26%' }}>
                    <span className="tf-node-ping"></span>
                    <span className="tf-node-dot"></span>
                  </div>
                  <div className="tf-rail-node" style={{ left: '44%' }}>
                    <span className="tf-node-ping"></span>
                    <span className="tf-node-dot"></span>
                  </div>
                  <div className="tf-rail-node" style={{ left: '62%' }}>
                    <span className="tf-node-ping"></span>
                    <span className="tf-node-dot"></span>
                  </div>
                  <div className="tf-rail-node" style={{ left: '79%' }}>
                    <span className="tf-node-ping"></span>
                    <span className="tf-node-dot"></span>
                  </div>
                  <div className="tf-rail-node" style={{ left: '93%' }}>
                    <span className="tf-node-ping"></span>
                    <span className="tf-node-dot"></span>
                  </div>
                </div>

                {/* Vertical Connector Stems */}
                <div className="tf-connector-stem stem-above" style={{ left: '9%' }}></div>
                <div className="tf-connector-stem stem-below" style={{ left: '26%' }}></div>
                <div className="tf-connector-stem stem-above" style={{ left: '44%' }}></div>
                <div className="tf-connector-stem stem-below" style={{ left: '62%' }}></div>
                <div className="tf-connector-stem stem-above" style={{ left: '79%' }}></div>
                <div className="tf-connector-stem stem-below" style={{ left: '93%' }}></div>

                {/* 6 Milestone Cards Alternating Above & Below */}
                {/* Card 1: Above (9%, 2:14 AM) */}
                <div className="tf-wf-card-item card-above" style={{ left: '9%' }}>
                  <div className="tf-wf-icon-box vms-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </div>
                  <div className="tf-wf-content">
                    <div className="tf-wf-title">Ingested new requisition</div>
                    <div className="tf-wf-sub">Req #158997: NC DHHS Cloud Dev • <strong>2:14 AM</strong></div>
                  </div>
                  <span className="tf-wf-mini-badge blue-pill">VMS Sync</span>
                </div>

                {/* Card 2: Below (26%, 7:00 AM) */}
                <div className="tf-wf-card-item card-below" style={{ left: '26%' }}>
                  <div className="tf-wf-icon-box aimatch-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </div>
                  <div className="tf-wf-content">
                    <div className="tf-wf-title">Top candidate matched & scored</div>
                    <div className="tf-wf-sub">Kranthi Kumar (96% Match • $88/hr) • <strong>7:00 AM</strong></div>
                  </div>
                  <span className="tf-wf-mini-badge emerald-pill">96% Score</span>
                </div>

                {/* Card 3: Above (44%, 8:00 AM) */}
                <div className="tf-wf-card-item card-above" style={{ left: '44%' }}>
                  <div className="tf-wf-icon-box email-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className="tf-wf-content">
                    <div className="tf-wf-title">AI Agent sent pre-screen & intake</div>
                    <div className="tf-wf-sub">Confirmed C2C, $88/hr & availability • <strong>8:00 AM</strong></div>
                  </div>
                  <span className="tf-wf-mini-badge amber-pill">Pre-Screen</span>
                </div>

                {/* Card 4: Below (62%, 11:30 AM) */}
                <div className="tf-wf-card-item card-below" style={{ left: '62%' }}>
                  <div className="tf-wf-icon-box rtr-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div className="tf-wf-content">
                    <div className="tf-wf-title">1-Click Digital RTR signed & received</div>
                    <div className="tf-wf-sub">Verified photo ID & Right-to-Represent • <strong>11:30 AM</strong></div>
                  </div>
                  <span className="tf-wf-mini-badge purple-pill">RTR Signed</span>
                </div>

                {/* Card 5: Above (79%, 3:45 PM) */}
                <div className="tf-wf-card-item card-above" style={{ left: '79%' }}>
                  <div className="tf-wf-icon-box slack-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M6 15a2 2 0 1 1-2-2h2v2zm1 0a2 2 0 0 1 2-2 2 2 0 0 1 2 2v5a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-5z" fill="#E01E5A"/>
                      <path d="M9 6a2 2 0 1 1-2-2v2h2zm0 1a2 2 0 0 1 2 2 2 2 0 0 1-2 2H4a2 2 0 0 1-2-2 2 2 0 0 1 2-2h5z" fill="#36C5F0"/>
                      <path d="M18 9a2 2 0 1 1 2 2h-2V9zm-1 0a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2 2 2 0 0 1 2 2v5z" fill="#2EB67D"/>
                      <path d="M15 18a2 2 0 1 1 2 2v-2h-2zm0-1a2 2 0 0 1-2-2 2 2 0 0 1 2-2h5a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-5z" fill="#ECB22E"/>
                    </svg>
                  </div>
                  <div className="tf-wf-content">
                    <div className="tf-wf-title">Posted candidate alert to #recruiter-desk</div>
                    <div className="tf-wf-sub">Recruiter Omkesh alerted on Slack • <strong>3:45 PM</strong></div>
                  </div>
                  <span className="tf-wf-mini-badge slack-pill">Slack Alert</span>
                </div>

                {/* Card 6: Below (93%, 10:05 PM) */}
                <div className="tf-wf-card-item card-below" style={{ left: '93%' }}>
                  <div className="tf-wf-icon-box portal-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <div className="tf-wf-content">
                    <div className="tf-wf-title">Client portal submission logged</div>
                    <div className="tf-wf-sub">CoolWorks ATS upload & audit trail • <strong>10:05 PM</strong></div>
                  </div>
                  <span className="tf-wf-mini-badge teal-pill">VMS Upload</span>
                </div>

                {/* Horizontal Time Axis Labels */}
                <div className="tf-time-axis-labels">
                  <span className="tf-axis-time" style={{ left: '1%' }}>12 AM</span>
                  <span className="tf-axis-time" style={{ left: '25%' }}>6 AM</span>
                  <span className="tf-axis-time" style={{ left: '50%' }}>12 PM</span>
                  <span className="tf-axis-time" style={{ left: '75%' }}>6 PM</span>
                  <span className="tf-axis-time tf-axis-moon" style={{ left: '97%' }}>
                    12 AM
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ marginLeft: '4px', verticalAlign: 'middle' }}>
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Mobile Sequential Timeline Flow (Shown on Screen Width <= 900px) */}
              <div className="tf-mobile-timeline-stage">
                {/* Mobile Item 1 */}
                <div className="tf-m-event-item">
                  <div className="tf-m-event-left">
                    <div className="tf-wf-icon-box vms-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                    </div>
                    <div className="tf-m-stem"></div>
                  </div>
                  <div className="tf-m-event-card">
                    <div className="tf-wf-title">Ingested new requisition</div>
                    <div className="tf-wf-sub">Req #158997: NC DHHS Cloud Dev • <strong>2:14 AM</strong></div>
                    <span className="tf-wf-mini-badge blue-pill">VMS Sync</span>
                  </div>
                </div>

                {/* Mobile Item 2 */}
                <div className="tf-m-event-item">
                  <div className="tf-m-event-left">
                    <div className="tf-wf-icon-box aimatch-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="4" />
                      </svg>
                    </div>
                    <div className="tf-m-stem"></div>
                  </div>
                  <div className="tf-m-event-card">
                    <div className="tf-wf-title">Top candidate matched & ranked</div>
                    <div className="tf-wf-sub">Kranthi Kumar (96% Match • $88/hr) • <strong>7:00 AM</strong></div>
                    <span className="tf-wf-mini-badge emerald-pill">96% Score</span>
                  </div>
                </div>

                {/* Mobile Item 3 */}
                <div className="tf-m-event-item">
                  <div className="tf-m-event-left">
                    <div className="tf-wf-icon-box email-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div className="tf-m-stem"></div>
                  </div>
                  <div className="tf-m-event-card">
                    <div className="tf-wf-title">AI Agent sent pre-screen & intake</div>
                    <div className="tf-wf-sub">Confirmed C2C, $88/hr & availability • <strong>8:00 AM</strong></div>
                    <span className="tf-wf-mini-badge amber-pill">Pre-Screen</span>
                  </div>
                </div>

                {/* Mobile Item 4 */}
                <div className="tf-m-event-item">
                  <div className="tf-m-event-left">
                    <div className="tf-wf-icon-box rtr-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div className="tf-m-stem"></div>
                  </div>
                  <div className="tf-m-event-card">
                    <div className="tf-wf-title">1-Click Digital RTR signed & received</div>
                    <div className="tf-wf-sub">Verified photo ID & Right-to-Represent • <strong>11:30 AM</strong></div>
                    <span className="tf-wf-mini-badge purple-pill">RTR Signed</span>
                  </div>
                </div>

                {/* Mobile Item 5 */}
                <div className="tf-m-event-item">
                  <div className="tf-m-event-left">
                    <div className="tf-wf-icon-box slack-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M6 15a2 2 0 1 1-2-2h2v2zm1 0a2 2 0 0 1 2-2 2 2 0 0 1 2 2v5a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-5z" fill="#E01E5A"/>
                        <path d="M9 6a2 2 0 1 1-2-2v2h2zm0 1a2 2 0 0 1 2 2 2 2 0 0 1-2 2H4a2 2 0 0 1-2-2 2 2 0 0 1 2-2h5z" fill="#36C5F0"/>
                        <path d="M18 9a2 2 0 1 1 2 2h-2V9zm-1 0a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2 2 2 0 0 1 2 2v5z" fill="#2EB67D"/>
                        <path d="M15 18a2 2 0 1 1 2 2v-2h-2zm0-1a2 2 0 0 1-2-2 2 2 0 0 1 2-2h5a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-5z" fill="#ECB22E"/>
                      </svg>
                    </div>
                    <div className="tf-m-stem"></div>
                  </div>
                  <div className="tf-m-event-card">
                    <div className="tf-wf-title">Posted pipeline update to #recruiter-desk</div>
                    <div className="tf-wf-sub">Recruiter Omkesh alerted on Slack • <strong>3:45 PM</strong></div>
                    <span className="tf-wf-mini-badge slack-pill">Slack Alert</span>
                  </div>
                </div>

                {/* Mobile Item 6 */}
                <div className="tf-m-event-item">
                  <div className="tf-m-event-left">
                    <div className="tf-wf-icon-box portal-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="tf-m-event-card">
                    <div className="tf-wf-title">Client portal submission logged</div>
                    <div className="tf-wf-sub">CoolWorks ATS upload & audit trail • <strong>10:05 PM</strong></div>
                    <span className="tf-wf-mini-badge teal-pill">VMS Upload</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Split Feature Cards (Matching Tasklet.ai subcards) */}
            <div className="tf-workflow-subgrid">
              {/* Card 1: Delegate Real Work */}
              <div className="tf-subcard">
                <div className="tf-subcard-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <h3 className="tf-subcard-title">Delegate real staffing work</h3>
                <p className="tf-subcard-desc">
                  Give real operational responsibilities to autonomous agents that run automatically based on live staffing events: a newly ingested VMS requisition, an incoming talent profile in your vault, or an expiring RTR document.
                </p>
                <div className="tf-subcard-badges">
                  <span className="tf-subcard-pill">⚡ Event-Driven Triggers</span>
                  <span className="tf-subcard-pill">🎯 Autonomous Sourcing</span>
                </div>
              </div>

              {/* Card 2: Keep Humans in the Loop */}
              <div className="tf-subcard">
                <div className="tf-subcard-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="tf-subcard-title">Keep recruiters in full control</h3>
                <p className="tf-subcard-desc">
                  Decide what your AI agents can do autonomously and where they pause for approval. AI agents draft candidate shortlists, verify rates, and format resumes — recruiters retain 100% final authorization on every client submission.
                </p>
                <div className="tf-subcard-badges">
                  <span className="tf-subcard-pill">🛡️ Human Authorization</span>
                  <span className="tf-subcard-pill">📋 Full Audit History</span>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* =========================================================================
            SECTION 3: CANDIDATE PIPELINE DASHBOARD MOCKUP + 3 BIG NUMBERS
            (Updated with full dark sidebar and recruitment headline per user feedback)
            ========================================================================= */}
        <section className="tf-showcase-section">
          <div className="tf-container">
            <div className="tf-showcase-grid">
              
              {/* Left: Complete Candidates Table Dashboard Mockup with Dark Sidebar */}
              <div className="tf-table-mockup-outer">
                <div className="tf-table-dashboard-mockup">
                  
                  {/* Dark Left Sidebar */}
                  <div className="tf-dash-sidebar">
                    <div className="tf-dash-brand">
                      <div className="tf-dash-logo-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                      </div>
                      <span className="tf-dash-brand-name">SmartHire ATS</span>
                    </div>

                    <ul className="tf-dash-nav">
                      <li className="tf-dash-nav-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7"/>
                          <rect x="14" y="3" width="7" height="7"/>
                          <rect x="14" y="14" width="7" height="7"/>
                          <rect x="3" y="14" width="7" height="7"/>
                        </svg>
                        <span>Overview</span>
                      </li>
                      <li className="tf-dash-nav-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <span>Requisitions</span>
                      </li>
                      <li className="tf-dash-nav-item active">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span>Candidates</span>
                      </li>
                      <li className="tf-dash-nav-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polygon points="10 8 16 12 10 16 10 8"/>
                        </svg>
                        <span>AI Screening</span>
                      </li>
                      <li className="tf-dash-nav-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="20" x2="18" y2="10"/>
                          <line x1="12" y1="20" x2="12" y2="4"/>
                          <line x1="6" y1="20" x2="6" y2="14"/>
                        </svg>
                        <span>Reports</span>
                      </li>
                      <li className="tf-dash-nav-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        <span>Settings</span>
                      </li>
                    </ul>
                  </div>

                  {/* Main Table Content */}
                  <div className="tf-dash-main tf-table-content-wrap">
                    
                    {/* Header */}
                    <div className="tf-table-top-header">
                      <div className="tf-dash-title-wrap">
                        <h3>Candidates</h3>
                      </div>
                      <div className="tf-dash-user">
                        <span className="tf-dash-search-icon">🔍</span>
                        <div className="tf-dash-user-info">
                          <span className="tf-dash-user-name">Alex Morgan</span>
                        </div>
                      </div>
                    </div>

                    {/* Sub Actions Bar */}
                    <div className="tf-table-actions-bar">
                      <span className="tf-table-count">All candidates (1,240)</span>
                      <div className="tf-table-head-actions">
                        <span className="tf-mini-btn">↕ Sort</span>
                        <span className="tf-mini-btn">⚡ Filter</span>
                      </div>
                    </div>

                    {/* Table Area */}
                    <div className="tf-table-responsive">
                      <table className="tf-mock-table">
                        <thead>
                          <tr>
                            <th>Candidate details</th>
                            <th>Assigned Req / Role</th>
                            <th>Date</th>
                            <th>Priority / Match</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              <div className="tf-table-user">
                                <span className="tf-user-dot blue" />
                                <div>
                                  <strong>Jordan Lee</strong>
                                  <span>jordan.lee@devmail.com</span>
                                </div>
                              </div>
                            </td>
                            <td>NC DHHS AWS Dev (808496)</td>
                            <td>May 26, 2026</td>
                            <td><span className="tf-priority-pill high">HIGH 98%</span></td>
                            <td><span className="tf-kebab">⋮</span></td>
                          </tr>

                          <tr>
                            <td>
                              <div className="tf-table-user">
                                <span className="tf-user-dot green" />
                                <div>
                                  <strong>Sarah Jenkins</strong>
                                  <span>sarah.j@outlook.com</span>
                                </div>
                              </div>
                            </td>
                            <td>React Tech Lead (158997)</td>
                            <td>May 26, 2026</td>
                            <td><span className="tf-priority-pill low">LOW 85%</span></td>
                            <td><span className="tf-kebab">⋮</span></td>
                          </tr>

                          <tr>
                            <td>
                              <div className="tf-table-user">
                                <span className="tf-user-dot purple" />
                                <div>
                                  <strong>Robert Davis</strong>
                                  <span>robert.d@techmail.com</span>
                                </div>
                              </div>
                            </td>
                            <td>DevOps Architect</td>
                            <td>May 25, 2026</td>
                            <td><span className="tf-priority-pill high">HIGH 96%</span></td>
                            <td><span className="tf-kebab">⋮</span></td>
                          </tr>

                          <tr>
                            <td>
                              <div className="tf-table-user">
                                <span className="tf-user-dot amber" />
                                <div>
                                  <strong>Christian Hall</strong>
                                  <span>hall.c@devcorp.com</span>
                                </div>
                              </div>
                            </td>
                            <td>Senior Data Engineer</td>
                            <td>May 25, 2026</td>
                            <td><span className="tf-priority-pill normal">NORMAL</span></td>
                            <td><span className="tf-kebab">⋮</span></td>
                          </tr>

                          <tr>
                            <td>
                              <div className="tf-table-user">
                                <span className="tf-user-dot cyan" />
                                <div>
                                  <strong>Maya Lin</strong>
                                  <span>maya.lin@cloudsec.io</span>
                                </div>
                              </div>
                            </td>
                            <td>Cloud Security Specialist</td>
                            <td>May 25, 2026</td>
                            <td><span className="tf-priority-pill high">HIGH 99%</span></td>
                            <td><span className="tf-kebab">⋮</span></td>
                          </tr>

                          <tr>
                            <td>
                              <div className="tf-table-user">
                                <span className="tf-user-dot blue" />
                                <div>
                                  <strong>David Patel</strong>
                                  <span>david.p@cloudtech.com</span>
                                </div>
                              </div>
                            </td>
                            <td>Full Stack Engineer</td>
                            <td>May 24, 2026</td>
                            <td><span className="tf-priority-pill high">HIGH 94%</span></td>
                            <td><span className="tf-kebab">⋮</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="tf-table-footer-bar">
                      <span>Rows per page: 8 ▼</span>
                      <span>1-8 of 1,240 &nbsp; &lt; &gt;</span>
                    </div>

                  </div>

                </div>
              </div>

              {/* Right: Headline with highlight + 3 Big Numbers */}
              <div className="tf-showcase-content">
                <h2 className="tf-showcase-headline">
                  Streamline candidate placement{' '}
                  <span className="tf-highlight-box">from sourcing to offer</span>
                </h2>
                <p className="tf-showcase-p">
                  SmartHire centralizes your entire talent pipeline into one intuitive command hub. Track candidate stages, review AI match scores, enforce private vault security, and move top technical talent seamlessly from intake to client interview.
                </p>

                <div className="tf-big-stats-row">
                  <div className="tf-big-stat-col">
                    <span className="tf-stat-large">10x</span>
                    <p className="tf-stat-subtext">
                      Faster candidate screening with autonomous AI pre-interview agents.
                    </p>
                  </div>

                  <div className="tf-big-stat-col">
                    <span className="tf-stat-large">100%</span>
                    <p className="tf-stat-subtext">
                      Anti-proxy identity checks & digital RTR verification before manager submission.
                    </p>
                  </div>

                  <div className="tf-big-stat-col">
                    <span className="tf-stat-large">99.4%</span>
                    <p className="tf-stat-subtext">
                      Candidate-to-requisition semantic match accuracy across all open roles.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: SUPPORT TEAM & RECRUITER SUCCESS (Screenshot 4)
            ========================================================================= */}
        <section className="tf-support-section">
          <div className="tf-container">
            <div className="tf-support-header text-center">
              <span className="tf-eyebrow-amber">ENTERPRISE ATS SUPPORT</span>
              <h2 className="tf-section-title">Our friendly support team will help you with anything</h2>
              <p className="tf-section-subtitle">
                We aim to take care of you. Need help configuring private recruiter vaults, setting up custom AI screening questions, or setting SLA alert deadlines? We'll be there to lend a helping hand.
              </p>

              <div className="tf-support-cta-wrap">
                <a href="mailto:support@smarthire.com" className="tf-btn tf-btn-primary">
                  <span style={{ marginRight: 8 }}>✉</span> Contact us
                </a>
              </div>

              {/* Feature checkmark pills */}
              <div className="tf-checklist-row">
                <span className="tf-check-item">
                  <span className="tf-check-badge">✔</span> All ATS features
                </span>
                <span className="tf-check-item">
                  <span className="tf-check-badge">✔</span> Private Vaults
                </span>
                <span className="tf-check-item">
                  <span className="tf-check-badge">✔</span> Multi-Role Hierarchy
                </span>
                <span className="tf-check-item">
                  <span className="tf-check-badge">✔</span> Anti-Proxy Checks
                </span>
                <span className="tf-check-item">
                  <span className="tf-check-badge">✔</span> Smart JD Chimes
                </span>
                <span className="tf-check-item">
                  <span className="tf-check-badge">✔</span> Manager Audit Reports
                </span>
              </div>
            </div>

            {/* Team Members Row: Professional Global Representatives */}
            <div className="tf-team-members-grid">
              
              <div className="tf-team-card">
                <div className="tf-team-avatar-circle" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                  AM
                </div>
                <h4 className="tf-team-name">Alex Morgan</h4>
                <span className="tf-team-title">VP of Talent Solutions & Enterprise</span>
              </div>

              <div className="tf-team-card">
                <div className="tf-team-avatar-circle" style={{ background: 'linear-gradient(135deg, #10b981, #047857)' }}>
                  ER
                </div>
                <h4 className="tf-team-name">Elena Rostova</h4>
                <span className="tf-team-title">Head of AI Screening & Client Success</span>
              </div>

              <div className="tf-team-card">
                <div className="tf-team-avatar-circle" style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)' }}>
                  DC
                </div>
                <h4 className="tf-team-name">David Chen</h4>
                <span className="tf-team-title">Compliance & Identity Systems Lead</span>
              </div>

              <div className="tf-team-card">
                <div className="tf-team-avatar-circle" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                  MV
                </div>
                <h4 className="tf-team-name">Marcus Vance</h4>
                <span className="tf-team-title">Senior Recruitment Workflow Architect</span>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: CUSTOMIZATION & OVERLAPPING PERSPECTIVE MOCKUP (Screenshot 5)
            ========================================================================= */}
        <section className="tf-customization-section" id="workflows">
          <div className="tf-container">
            <div className="tf-customization-header text-center">
              <span className="tf-eyebrow-amber">⚡ REAL-TIME RECRUITMENT INTELLIGENCE</span>
              <h2 className="tf-section-title">
                Total command over your{' '}
                <span className="tf-highlight-box">entire recruiting pipeline</span>
              </h2>
              <p className="tf-section-subtitle">
                Gain complete executive visibility across all recruiter pipelines, active client requisitions, sourcing targets, and placement conversions. Every chart, metric, and table reflects live data from your ATS operations.
              </p>

              <div className="tf-customization-actions">
                <button 
                  type="button" 
                  onClick={() => isAuthenticated ? navigate('/ats') : setShowLoginModal(true)} 
                  className="tf-btn tf-btn-primary"
                >
                  Explore ATS Portal →
                </button>
                <button
                  type="button"
                  onClick={() => isAuthenticated ? navigate('/ats?tab=reports') : setShowLoginModal(true)}
                  className="tf-btn tf-btn-outline"
                >
                  View Reports & Metrics
                </button>
              </div>
            </div>

            {/* Overlapping Perspective Mockup Container */}
            <div className="tf-perspective-container">
              
              {/* =======================================================
                  LEFT CARD: Real SmartHire Reports Dashboard (Screenshot 2)
                  ======================================================= */}
              <div className="tf-persp-card tf-persp-left">
                <div className="tf-persp-header">
                  <div className="tf-persp-dots">
                    <span className="dot-red" />
                    <span className="dot-yellow" />
                    <span className="dot-green" />
                  </div>
                  <div className="tf-persp-title-box">
                    <span className="tf-persp-title">SmartHire ATS — Executive Reports Dashboard</span>
                    <span className="tf-persp-live-pill">● Synced</span>
                  </div>
                </div>

                <div className="tf-persp-dashboard-layout">
                  {/* Left Micro Dark Sidebar */}
                  <div className="tf-persp-sidebar">
                    <div className="tf-persp-side-logo">⚡</div>
                    <div className="tf-persp-side-item" title="Home">🏠</div>
                    <div className="tf-persp-side-item" title="Workqueue">📋</div>
                    <div className="tf-persp-side-item active" title="Reports">📊</div>
                    <div className="tf-persp-side-item" title="AI Agents">🤖</div>
                    <div className="tf-persp-side-item" title="Settings">⚙️</div>
                  </div>

                  {/* Main Dashboard Canvas */}
                  <div className="tf-persp-main-view">
                    {/* Top sub-bar */}
                    <div className="tf-persp-subbar">
                      <div className="tf-persp-subbar-left">
                        <span className="tf-persp-subbar-title">Reports</span>
                        <span className="tf-persp-subbar-sep">/</span>
                        <span className="tf-persp-subbar-pill">Analytics ⭐ Org Overview</span>
                      </div>
                      <div className="tf-persp-subbar-right">
                        <span className="tf-persp-date-badge">📅 This Month</span>
                        <span className="tf-persp-btn-mini">+ Add Component</span>
                      </div>
                    </div>

                    {/* 4 Live KPI Cards */}
                    <div className="tf-persp-kpis-grid">
                      <div className="tf-persp-kpi-box">
                        <span className="kpi-label">Candidates (Month)</span>
                        <div className="kpi-val-row">
                          <strong className="kpi-num">39</strong>
                          <span className="kpi-growth green">▲ 100%</span>
                        </div>
                      </div>
                      <div className="tf-persp-kpi-box">
                        <span className="kpi-label">Active Requisitions</span>
                        <div className="kpi-val-row">
                          <strong className="kpi-num">40</strong>
                          <span className="kpi-growth green">▲ 14%</span>
                        </div>
                      </div>
                      <div className="tf-persp-kpi-box">
                        <span className="kpi-label">Deals / RTR Pipeline</span>
                        <div className="kpi-val-row">
                          <strong className="kpi-num">12</strong>
                          <span className="kpi-growth blue">▲ 28%</span>
                        </div>
                      </div>
                      <div className="tf-persp-kpi-box">
                        <span className="kpi-label">Interviews & Placed</span>
                        <div className="kpi-val-row">
                          <strong className="kpi-num">6</strong>
                          <span className="kpi-growth amber">▲ 50%</span>
                        </div>
                      </div>
                    </div>

                    {/* Mid Section: Speedometer Gauge + Sourcing Progress */}
                    <div className="tf-persp-mid-grid">
                      {/* Speedometer Gauge Widget */}
                      <div className="tf-persp-gauge-card">
                        <div className="gauge-card-header">
                          <span>Candidate Sourcing Target — This Year</span>
                          <span className="gauge-sub">Target: 100</span>
                        </div>
                        <div className="gauge-canvas-wrap">
                          <svg viewBox="0 0 200 115" className="gauge-svg">
                            {/* Gauge Background Track */}
                            <path 
                              d="M 25,100 A 75,75 0 0,1 175,100" 
                              fill="none" 
                              stroke="#e2e8f0" 
                              strokeWidth="14" 
                              strokeLinecap="round" 
                            />
                            {/* Gauge Colored Arc (39% = ~70.2 deg out of 180) */}
                            <path 
                              d="M 25,100 A 75,75 0 0,1 88,31" 
                              fill="none" 
                              stroke="url(#gaugeGradient)" 
                              strokeWidth="14" 
                              strokeLinecap="round" 
                            />
                            {/* Gauge Needle */}
                            <line 
                              x1="100" 
                              y1="100" 
                              x2="84" 
                              y2="36" 
                              stroke="#0f172a" 
                              strokeWidth="3.5" 
                              strokeLinecap="round" 
                            />
                            <circle cx="100" cy="100" r="7" fill="#0f172a" />
                            <circle cx="100" cy="100" r="3" fill="#ffffff" />
                            <defs>
                              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#2563eb" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="gauge-readout">
                            <span className="gauge-big-num">39</span>
                            <span className="gauge-lbl">Sourced</span>
                          </div>
                        </div>
                        <div className="gauge-meta-row">
                          <span>Progress: <strong>39%</strong></span>
                          <span>Remaining: <strong>61</strong></span>
                        </div>
                      </div>

                      {/* Right Stage Analytics Widget */}
                      <div className="tf-persp-stages-card">
                        <div className="stage-card-header">
                          <span>Candidates by Stage</span>
                          <span className="stage-total">39 Total</span>
                        </div>
                        
                        <div className="stage-bars-list">
                          <div className="stage-bar-item">
                            <div className="stage-bar-label">
                              <span>New Candidates</span>
                              <strong>35 (89.7%)</strong>
                            </div>
                            <div className="stage-progress-track">
                              <div className="stage-progress-fill stage-blue" style={{ width: '89.7%' }} />
                            </div>
                          </div>

                          <div className="stage-bar-item">
                            <div className="stage-bar-label">
                              <span>Submitted to Client</span>
                              <strong>4 (10.3%)</strong>
                            </div>
                            <div className="stage-progress-track">
                              <div className="stage-progress-fill stage-emerald" style={{ width: '10.3%' }} />
                            </div>
                          </div>
                        </div>

                        {/* Weekly Velocity Bars */}
                        <div className="weekly-velocity-wrap">
                          <span className="weekly-velocity-title">Submission Velocity (Weeks)</span>
                          <div className="weekly-bars-flex">
                            <div className="weekly-col"><div className="w-bar" style={{ height: '22%' }} /><span className="w-lbl">W1</span></div>
                            <div className="weekly-col"><div className="w-bar" style={{ height: '12%' }} /><span className="w-lbl">W2</span></div>
                            <div className="weekly-col"><div className="w-bar" style={{ height: '48%' }} /><span className="w-lbl">W3</span></div>
                            <div className="weekly-col"><div className="w-bar active" style={{ height: '88%' }} /><span className="w-lbl">W4</span></div>
                            <div className="weekly-col"><div className="w-bar" style={{ height: '65%' }} /><span className="w-lbl">W5</span></div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* =======================================================
                  RIGHT CARD: Real SmartHire Candidates Table (Screenshot 3)
                  ======================================================= */}
              <div className="tf-persp-card tf-persp-right">
                <div className="tf-persp-header">
                  <div className="tf-persp-dots">
                    <span className="dot-red" />
                    <span className="dot-yellow" />
                    <span className="dot-green" />
                  </div>
                  <div className="tf-persp-title-box">
                    <span className="tf-persp-title">SmartHire ATS — Live Candidate Talent Directory (39)</span>
                    <span className="tf-persp-live-pill-blue">Active Pool</span>
                  </div>
                </div>

                <div className="tf-persp-table-layout">
                  {/* Filter Sub-Column */}
                  <div className="tf-persp-filter-pane">
                    <span className="pane-title">Filter Candidates</span>
                    
                    <div className="pane-group">
                      <span className="pane-group-lbl">System Filters</span>
                      <div className="pane-filter-item active">
                        <span className="check-box">✓</span>
                        <span>Active Talent</span>
                      </div>
                      <div className="pane-filter-item active">
                        <span className="check-box">✓</span>
                        <span>AI Screened</span>
                      </div>
                      <div className="pane-filter-item">
                        <span className="check-box empty" />
                        <span>RTR Signed</span>
                      </div>
                    </div>

                    <div className="pane-group">
                      <span className="pane-group-lbl">Pipeline Status</span>
                      <div className="pane-status-row active">
                        <span>All Candidates</span>
                        <strong>39</strong>
                      </div>
                      <div className="pane-status-row">
                        <span>New Candidates</span>
                        <strong>35</strong>
                      </div>
                      <div className="pane-status-row">
                        <span>Client Submitted</span>
                        <strong>4</strong>
                      </div>
                    </div>
                  </div>

                  {/* Main Candidate Table */}
                  <div className="tf-persp-table-wrap">
                    <div className="tf-persp-table-head">
                      <div className="th-cell th-name">Candidate Name</div>
                      <div className="th-cell th-job">Target Requisition</div>
                      <div className="th-cell th-recruiter">Sourced By</div>
                      <div className="th-cell th-skills">Key Skills</div>
                      <div className="th-cell th-rate">Pay Rate</div>
                    </div>

                    <div className="tf-persp-table-body">
                      {/* Row 1: Vinod Jarugula */}
                      <div className="tf-persp-trow">
                        <div className="td-cell td-name">
                          <strong>Vinod Jarugula</strong>
                          <span className="td-sub-email">jvinod9876@gmail.com</span>
                        </div>
                        <div className="td-cell td-job">
                          <span className="req-pill">Req #159070</span>
                          <span className="req-sub">FDOT Job 2210</span>
                        </div>
                        <div className="td-cell td-recruiter">
                          <span className="recruiter-tag">👤 Omkesh</span>
                        </div>
                        <div className="td-cell td-skills">
                          <span className="skill-chip">python</span>
                          <span className="skill-chip">sql</span>
                          <span className="skill-chip more">+17</span>
                        </div>
                        <div className="td-cell td-rate">
                          <strong className="rate-num">$75/hr</strong>
                        </div>
                      </div>

                      {/* Row 2: Sandeep Guntupalli */}
                      <div className="tf-persp-trow">
                        <div className="td-cell td-name">
                          <strong>Sandeep Guntupalli</strong>
                          <span className="td-sub-email">sandeep@gmail.com</span>
                        </div>
                        <div className="td-cell td-job">
                          <span className="req-pill">Req #158667</span>
                          <span className="req-sub">General Applicant</span>
                        </div>
                        <div className="td-cell td-recruiter">
                          <span className="recruiter-tag">👤 Omkesh</span>
                        </div>
                        <div className="td-cell td-skills">
                          <span className="skill-chip">python</span>
                          <span className="skill-chip">sql</span>
                          <span className="skill-chip more">+35</span>
                        </div>
                        <div className="td-cell td-rate">
                          <strong className="rate-num">$75/hr</strong>
                        </div>
                      </div>

                      {/* Row 3: Laxmi V */}
                      <div className="tf-persp-trow">
                        <div className="td-cell td-name">
                          <strong>Laxmi V</strong>
                          <span className="td-sub-email">padugupadulaxmi@...</span>
                        </div>
                        <div className="td-cell td-job">
                          <span className="req-pill">Req #159070</span>
                          <span className="req-sub">FDOT Customer S...</span>
                        </div>
                        <div className="td-cell td-recruiter">
                          <span className="recruiter-tag">👤 Omkesh</span>
                        </div>
                        <div className="td-cell td-skills">
                          <span className="skill-chip">javascript</span>
                          <span className="skill-chip">html</span>
                          <span className="skill-chip more">+12</span>
                        </div>
                        <div className="td-cell td-rate">
                          <strong className="rate-num">$75/hr</strong>
                        </div>
                      </div>

                      {/* Row 4: Hemanth Pinninti */}
                      <div className="tf-persp-trow">
                        <div className="td-cell td-name">
                          <strong>Hemanth Pinninti</strong>
                          <span className="td-sub-email">hemanthpinninti@...</span>
                        </div>
                        <div className="td-cell td-job">
                          <span className="req-pill">Req #159070</span>
                          <span className="req-sub">FDOT Job 2210</span>
                        </div>
                        <div className="td-cell td-recruiter">
                          <span className="recruiter-tag">👤 Omkesh</span>
                        </div>
                        <div className="td-cell td-skills">
                          <span className="skill-chip">python</span>
                          <span className="skill-chip">sql</span>
                          <span className="skill-chip more">+69</span>
                        </div>
                        <div className="td-cell td-rate">
                          <strong className="rate-num">$75/hr</strong>
                        </div>
                      </div>

                      {/* Row 5: Kranthi Kumar Asike */}
                      <div className="tf-persp-trow highlight-row">
                        <div className="td-cell td-name">
                          <strong>Kranthi Kumar Asike</strong>
                          <span className="td-sub-email">kranthikumarap4@gmail.com</span>
                        </div>
                        <div className="td-cell td-job">
                          <span className="req-pill pulse-pill">Req #158997</span>
                          <span className="req-sub">NC DHHS AWS Dev</span>
                        </div>
                        <div className="td-cell td-recruiter">
                          <span className="recruiter-tag">👤 Omkesh</span>
                        </div>
                        <div className="td-cell td-skills">
                          <span className="skill-chip">aws</span>
                          <span className="skill-chip">python</span>
                          <span className="skill-chip more">+74</span>
                        </div>
                        <div className="td-cell td-rate">
                          <strong className="rate-num rate-high">$88/hr</strong>
                        </div>
                      </div>
                    </div>

                    {/* Table Footer */}
                    <div className="tf-persp-table-foot">
                      <span>Total Records: <strong>39</strong></span>
                      <span>Records per page: <strong>25</strong></span>
                      <span className="foot-pages">1 - 25 of 39</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 6: OPTIMIZED RATE & PRICING SECTION WITH MARGIN CALCULATOR
            ========================================================================= */}
        <section className="tf-pricing-section" id="pricing">
          <div className="tf-container">
            <div className="tf-section-header text-center">
              <span className="tf-eyebrow-amber">TRANSPARENT STAFFING PRICING</span>
              <h2 className="tf-section-title">Predictable investment built for high-margin staffing</h2>
              <p className="tf-section-subtitle">
                Choose the plan that matches your recruiting velocity. Zero hidden fees, full ATS access, and unlimited candidate verification.
              </p>

              {/* Monthly / Yearly Toggle */}
              <div className="tf-billing-toggle-box">
                <span className={!isYearly ? 'active-label' : ''}>Monthly</span>
                <button 
                  type="button" 
                  className="tf-switch-btn" 
                  onClick={() => setIsYearly(!isYearly)}
                  aria-label="Toggle Billing Frequency"
                >
                  <span className={`tf-switch-thumb ${isYearly ? 'yearly' : ''}`} />
                </button>
                <span className={isYearly ? 'active-label' : ''}>
                  Yearly <span className="tf-discount-chip">Save 20%</span>
                </span>
              </div>
            </div>

            {/* 3 Pricing Cards Grid */}
            <div className="tf-plans-grid">
              
              {/* Plan 1 */}
              <div className="tf-plan-card">
                <div className="tf-plan-top">
                  <h3 className="tf-plan-title">Recruiter Starter</h3>
                  <p className="tf-plan-desc">For independent recruiters & boutique sourcing agencies.</p>
                  <div className="tf-plan-price">
                    <span className="curr">$</span>
                    <span className="val">{isYearly ? 79 : 99}</span>
                    <span className="freq">/month</span>
                  </div>
                  {isYearly && <span className="tf-billed-note">Billed annually ($948/yr)</span>}
                </div>

                <div className="tf-plan-divider" />

                <ul className="tf-plan-perks">
                  <li><span className="check">✓</span> 50 AI Pre-Screening Chats / mo</li>
                  <li><span className="check">✓</span> Private Recruiter Talent Vault</li>
                  <li><span className="check">✓</span> Basic Resume Skill Matching</li>
                  <li><span className="check">✓</span> Digital RTR Document Collection</li>
                  <li><span className="check">✓</span> Standard Email Support</li>
                </ul>

                <button 
                  type="button" 
                  onClick={() => isAuthenticated ? navigate('/ats') : setShowLoginModal(true)} 
                  className="tf-plan-btn outline"
                >
                  Start Starter Trial
                </button>
              </div>

              {/* Plan 2: Most Popular */}
              <div className="tf-plan-card tf-popular-plan">
                <div className="tf-popular-banner">MOST POPULAR</div>
                <div className="tf-plan-top">
                  <h3 className="tf-plan-title">Staffing Team</h3>
                  <p className="tf-plan-desc">For high-volume staffing firms scaling client submissions.</p>
                  <div className="tf-plan-price">
                    <span className="curr">$</span>
                    <span className="val">{isYearly ? 199 : 249}</span>
                    <span className="freq">/month</span>
                  </div>
                  {isYearly && <span className="tf-billed-note">Billed annually ($2,388/yr)</span>}
                </div>

                <div className="tf-plan-divider" />

                <ul className="tf-plan-perks">
                  <li><span className="check">✓</span> <strong>Unlimited</strong> AI Candidate Pre-Screening</li>
                  <li><span className="check">✓</span> Smart JD-Match Instant Alert Engine</li>
                  <li><span className="check">✓</span> Multi-Role Hierarchy (10 seats) & Vault Privacy</li>
                  <li><span className="check">✓</span> Biometric Liveness & Anti-Proxy Checks</li>
                  <li><span className="check">✓</span> Candidate Direct Chat & Close Portal</li>
                  <li><span className="check">✓</span> Priority 24/7 SLA Recruiter Support</li>
                </ul>

                <button 
                  type="button" 
                  onClick={() => isAuthenticated ? navigate('/ats') : setShowLoginModal(true)} 
                  className="tf-plan-btn primary"
                >
                  Start Growth Trial
                </button>
              </div>

              {/* Plan 3 */}
              <div className="tf-plan-card">
                <div className="tf-plan-top">
                  <h3 className="tf-plan-title">Enterprise Scale</h3>
                  <p className="tf-plan-desc">For enterprise staffing agencies & multi-branch VMS suppliers.</p>
                  <div className="tf-plan-price">
                    <span className="curr">$</span>
                    <span className="val">{isYearly ? 479 : 599}</span>
                    <span className="freq">/month</span>
                  </div>
                  {isYearly && <span className="tf-billed-note">Billed annually ($5,748/yr)</span>}
                </div>

                <div className="tf-plan-divider" />

                <ul className="tf-plan-perks">
                  <li><span className="check">✓</span> Unlimited Recruiters, Managers & Private Vaults</li>
                  <li><span className="check">✓</span> Custom Autonomous AI Interview Agents</li>
                  <li><span className="check">✓</span> Executive Manager Audit & Commission Analytics</li>
                  <li><span className="check">✓</span> Dedicated Success Manager & Onboarding</li>
                  <li><span className="check">✓</span> Full Webhook & REST API Integration</li>
                  <li><span className="check">✓</span> 99.9% Production Uptime Guarantee</li>
                </ul>

                <button 
                  type="button" 
                  onClick={() => isAuthenticated ? navigate('/ats') : setShowLoginModal(true)} 
                  className="tf-plan-btn outline"
                >
                  Contact Enterprise Sales
                </button>
              </div>

            </div>

            {/* =========================================================================
                INTERACTIVE STAFFING SPREAD & RATE MARGIN CALCULATOR
                ========================================================================= */}
            <div className="tf-calculator-card" id="calculator">
              <div className="tf-calc-header">
                <div className="tf-calc-badge">STAFFING ROI CALCULATOR</div>
                <h3>Calculate Your IT Contract Placement Gross Margin</h3>
                <p>
                  See how fast SmartHire ATS pays for itself. Adjust your typical contract Bill Rate and candidate Pay Rate below:
                </p>
              </div>

              <div className="tf-calc-grid">
                
                {/* Sliders & Inputs Column */}
                <div className="tf-calc-controls">
                  
                  <div className="tf-slider-group">
                    <div className="tf-slider-label">
                      <span>Client Bill Rate</span>
                      <strong className="tf-highlight-val">${billRate} / hr</strong>
                    </div>
                    <input 
                      type="range" 
                      min="40" 
                      max="160" 
                      step="5" 
                      value={billRate} 
                      onChange={(e) => setBillRate(Number(e.target.value))} 
                      className="tf-calc-range"
                    />
                    <div className="tf-range-bounds"><span>$40/hr</span><span>$160/hr</span></div>
                  </div>

                  <div className="tf-slider-group">
                    <div className="tf-slider-label">
                      <span>Candidate Pay Rate</span>
                      <strong className="tf-highlight-val">${payRate} / hr</strong>
                    </div>
                    <input 
                      type="range" 
                      min="25" 
                      max="140" 
                      step="5" 
                      value={payRate} 
                      onChange={(e) => setPayRate(Number(e.target.value))} 
                      className="tf-calc-range"
                    />
                    <div className="tf-range-bounds"><span>$25/hr</span><span>$140/hr</span></div>
                  </div>

                  <div className="tf-slider-group">
                    <div className="tf-slider-label">
                      <span>Active Placed Consultants</span>
                      <strong className="tf-highlight-val">{consultantsCount} consultants</strong>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="20" 
                      step="1" 
                      value={consultantsCount} 
                      onChange={(e) => setConsultantsCount(Number(e.target.value))} 
                      className="tf-calc-range"
                    />
                    <div className="tf-range-bounds"><span>1</span><span>20</span></div>
                  </div>

                </div>

                {/* Live Output Column */}
                <div className="tf-calc-results">
                  <div className="tf-calc-metric-box">
                    <span className="tf-metric-subtitle">Hourly Spread</span>
                    <span className="tf-metric-number">${hourlySpread.toFixed(2)} <small>/ hr</small></span>
                    <span className="tf-metric-note">(${billRate} bill - ${payRate} pay)</span>
                  </div>

                  <div className="tf-calc-metric-box">
                    <span className="tf-metric-subtitle">Monthly Gross Spread</span>
                    <span className="tf-metric-number">${(monthlySpreadPerConsultant * consultantsCount).toLocaleString()} <small>/ mo</small></span>
                    <span className="tf-metric-note">Based on 160 billing hrs / month</span>
                  </div>

                  <div className="tf-calc-highlight-metric">
                    <span className="tf-annual-label">Estimated Annual Gross Margin</span>
                    <span className="tf-annual-val">${annualSpreadTotal.toLocaleString()}</span>
                    <p className="tf-annual-expl">
                      💡 <em>SmartHire's entire yearly subscription is recouped in less than <strong>2 days</strong> of margin from a single placement.</em>
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            LOGIN MODAL DIALOG
            ========================================================================= */}
        {showLoginModal && (
          <div className="tf-modal-backdrop" onClick={() => setShowLoginModal(false)}>
            <div className="tf-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="tf-modal-head">
                <div className="tf-modal-logo">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  <span>SmartHire ATS Login</span>
                </div>
                <button type="button" className="tf-close-btn" onClick={() => setShowLoginModal(false)}>✕</button>
              </div>

              <p className="tf-modal-subtitle">
                Enter your recruiter or admin credentials to access your private talent vault.
              </p>

              {errorMessage && (
                <div className="tf-error-alert">
                  ⚠️ {errorMessage}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="tf-login-form">
                <div className="tf-input-field">
                  <label>Corporate Email</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="name@smarthire.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="tf-input-field">
                  <label>Password</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="tf-submit-btn" disabled={isLoggingIn}>
                  {isLoggingIn ? 'Verifying Credentials...' : 'Sign In to ATS Console →'}
                </button>
              </form>

              {/* Demo Credentials Helper */}
              <div className="tf-demo-helpers">
                <span>Quick Demo Logins:</span>
                <div className="tf-demo-chips">
                  <button 
                    type="button" 
                    onClick={() => fillDemoCreds('admin@smarthire.com', 'admin')}
                    className="tf-chip"
                  >
                    👑 Admin Workspace
                  </button>
                  <button 
                    type="button" 
                    onClick={() => fillDemoCreds('recruiter@smarthire.com', 'recruiter123')}
                    className="tf-chip"
                  >
                    💼 Senior Recruiter
                  </button>
                  <button 
                    type="button" 
                    onClick={() => fillDemoCreds('sourcing@smarthire.com', 'recruiter123')}
                    className="tf-chip"
                  >
                    🔍 Sourcing Specialist
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          EMBEDDED theFront DESIGN SYSTEM STYLES
          ========================================================================= */}
      <style>{`
        .tf-root {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #1e293b;
          background: #ffffff;
          overflow-x: clip;
        }

        .tf-container {
          width: min(1280px, 92%);
          margin: 0 auto;
        }

        /* Hero Section */
        .tf-hero-section {
          padding: 70px 0 90px;
          background: 
            radial-gradient(ellipse at 85% 20%, rgba(37, 99, 235, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 15% 10%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
            #ffffff;
          position: relative;
        }

        .tf-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 50px;
          align-items: center;
        }

        @media (max-width: 1024px) {
          .tf-hero-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }
        }

        /* Badge Pill */
        .tf-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 6px 14px;
          border-radius: 9999px;
          margin-bottom: 24px;
        }

        .tf-badge-dot {
          width: 7px;
          height: 7px;
          background: #10b981;
          border-radius: 50%;
          animation: tfPulse 2s infinite;
        }

        @keyframes tfPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        /* theFront Headline with Signature Highlight Pill */
        .tf-hero-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(36px, 4.2vw, 54px);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: #0f172a;
          margin: 0 0 20px 0;
        }

        .tf-highlight-box {
          display: inline-block;
          background: #e0f2fe;
          color: #0284c7;
          padding: 2px 14px;
          border-radius: 8px;
          position: relative;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
        }

        .tf-hero-subtitle {
          font-size: 16.5px;
          line-height: 1.6;
          color: #64748b;
          margin: 0 0 32px 0;
          max-width: 540px;
        }

        .tf-hero-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }

        .tf-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 700;
          padding: 13px 26px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          border: none;
        }

        .tf-btn-primary {
          background: #2563eb;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
        }

        .tf-btn-primary:hover {
          background: #1d4ed8;
          transform: translateY(-1.5px);
          box-shadow: 0 8px 22px rgba(37, 99, 235, 0.4);
        }

        .tf-btn-outline {
          background: #ffffff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .tf-btn-outline:hover {
          background: #eff6ff;
          border-color: #93c5fd;
        }

        /* Hero Trust */
        .tf-hero-trust {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-top: 10px;
          border-top: 1px solid #f1f5f9;
        }

        .tf-avatar-stack {
          display: flex;
        }

        .tf-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          margin-left: -8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          color: white;
        }

        .tf-avatar:first-child { margin-left: 0; }
        .tf-av-1 { background: #3b82f6; }
        .tf-av-2 { background: #10b981; }
        .tf-av-3 { background: #f59e0b; }
        .tf-av-4 { background: #8b5cf6; }

        .tf-trust-text {
          display: flex;
          flex-direction: column;
          font-size: 12px;
          color: #64748b;
        }

        .tf-trust-text strong {
          color: #0f172a;
          font-size: 13px;
        }

        /* =========================================================================
           DASHBOARD MOCKUPS (Both Hero & Showcase Table)
           ========================================================================= */
        .tf-hero-mockup-wrap {
          perspective: 1200px;
        }

        .tf-dashboard-mockup, .tf-table-dashboard-mockup {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 
            0 25px 60px -15px rgba(15, 23, 42, 0.18),
            0 10px 25px -5px rgba(15, 23, 42, 0.08);
          display: grid;
          grid-template-columns: 140px 1fr;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
          animation: heroFloat 6s ease-in-out infinite;
          will-change: transform;
        }

        .tf-dashboard-mockup:hover {
          animation-play-state: paused;
          box-shadow: 
            0 32px 70px -15px rgba(15, 23, 42, 0.22),
            0 12px 30px -5px rgba(15, 23, 42, 0.1);
        }

        @keyframes heroFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @media (max-width: 640px) {
          .tf-dashboard-mockup, .tf-table-dashboard-mockup {
            grid-template-columns: 1fr;
          }
          .tf-dash-sidebar {
            display: none;
          }
        }

        /* Dark Sidebar */
        .tf-dash-sidebar {
          background: #181F2C;
          color: #94a3b8;
          padding: 18px 12px;
          display: flex;
          flex-direction: column;
        }

        .tf-dash-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          padding-left: 4px;
        }

        .tf-dash-logo-icon {
          width: 26px;
          height: 26px;
          background: #2563eb;
          color: white;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tf-dash-brand-name {
          font-size: 12px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.01em;
        }

        .tf-dash-nav {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tf-dash-nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .tf-dash-nav-item.active, .tf-dash-nav-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .tf-dash-nav-item.active {
          color: #60a5fa;
        }

        /* Main Dashboard Content */
        .tf-dash-main {
          padding: 20px 22px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .tf-dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tf-dash-title-wrap h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
        }

        .tf-dash-user {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
        }

        .tf-dash-user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          line-height: 1.2;
        }

        .tf-dash-user-name {
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
        }

        .tf-dash-user-role {
          font-size: 9px;
          color: #64748b;
        }

        /* 4 KPI Cards */
        .tf-dash-kpis {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        @media (max-width: 500px) {
          .tf-dash-kpis {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .tf-kpi-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: border-color 0.2s ease;
        }

        .tf-kpi-highlighted {
          border-color: #93c5fd;
          background: #eff6ff;
        }

        .tf-kpi-label {
          font-size: 9.5px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 4px;
        }

        .tf-kpi-num {
          font-size: 19px;
          font-weight: 800;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .tf-text-blue {
          color: #2563eb;
        }

        /* Trends Chart Card */
        .tf-dash-chart-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px 16px;
          display: grid;
          grid-template-columns: 1fr 135px;
          gap: 14px;
        }

        @media (max-width: 600px) {
          .tf-dash-chart-card {
            grid-template-columns: 1fr;
          }
        }

        .tf-chart-head h4 {
          margin: 0;
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
        }

        .tf-chart-timestamp {
          font-size: 8.5px;
          color: #94a3b8;
          display: block;
          margin-top: 1px;
        }

        .tf-chart-legend {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 8.5px;
          color: #64748b;
          margin-top: 4px;
        }

        .tf-legend-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }
        .tf-legend-dot.blue { background: #2563eb; }
        .tf-legend-dot.gray { background: #cbd5e1; }

        .tf-svg-chart-container {
          margin-top: 6px;
        }

        .tf-bezier-svg {
          width: 100%;
          height: auto;
          overflow: visible;
        }

        /* ─── Wave & Radar Animations for Sourcing Trends ─── */
        .tf-chart-head-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .tf-live-stream-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #059669;
          font-size: 8px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 9999px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .tf-pulse-dot {
          width: 5px;
          height: 5px;
          background: #10b981;
          border-radius: 50%;
          animation: dotPulse 1.8s infinite;
        }

        @keyframes dotPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        /* Animated Main Curve (Draw-in + Wave Breathe) */
        .tf-chart-main-curve {
          stroke-dasharray: 600;
          stroke-dashoffset: 0;
          animation: curveDraw 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards, curveBreathe 4s ease-in-out infinite 1.4s;
          transform-origin: 210px 100px;
          will-change: transform;
        }

        /* Animated Area Gradient Fill (Breathe with curve) */
        .tf-chart-area-fill {
          animation: areaFade 1.4s ease forwards, areaBreathe 4s ease-in-out infinite 1.4s;
          transform-origin: 210px 100px;
          will-change: transform;
        }

        @keyframes curveDraw {
          0% {
            stroke-dashoffset: 600;
            opacity: 0.3;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        @keyframes areaFade {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes curveBreathe {
          0%, 100% {
            transform: translateY(0px) scaleY(1);
          }
          50% {
            transform: translateY(-4.5px) scaleY(1.05);
          }
        }

        @keyframes areaBreathe {
          0%, 100% {
            transform: translateY(0px) scaleY(1);
            opacity: 0.85;
          }
          50% {
            transform: translateY(-4.5px) scaleY(1.05);
            opacity: 1;
          }
        }

        /* Radar Ripple on Peak Dot */
        .tf-chart-ping {
          fill: rgba(37, 99, 235, 0.2);
          transform-origin: 250px 55px;
          animation: radarPing 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .tf-chart-ping-inner {
          fill: rgba(37, 99, 235, 0.35);
          transform-origin: 250px 55px;
          animation: radarPingInner 2.4s cubic-bezier(0, 0, 0.2, 1) infinite 0.4s;
        }

        @keyframes radarPing {
          0% {
            r: 4;
            opacity: 0.8;
          }
          70% {
            r: 18;
            opacity: 0.15;
          }
          100% {
            r: 26;
            opacity: 0;
          }
        }

        @keyframes radarPingInner {
          0% {
            r: 4;
            opacity: 0.9;
          }
          70% {
            r: 12;
            opacity: 0.25;
          }
          100% {
            r: 17;
            opacity: 0;
          }
        }

        /* Floating Bob for Tooltip Badge ('38') */
        .tf-chart-tooltip-group {
          animation: floatTooltip 3s ease-in-out infinite;
          transform-origin: 250px 32px;
          will-change: transform;
        }

        @keyframes floatTooltip {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        .tf-tooltip-rect {
          filter: drop-shadow(0 2px 5px rgba(15, 23, 42, 0.12));
        }

        /* Highlighted KPI Breathing Glow */
        .tf-kpi-highlighted {
          border-color: #93c5fd;
          background: #eff6ff;
          animation: kpiGlow 3s ease-in-out infinite;
        }

        @keyframes kpiGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.1);
          }
          50% {
            box-shadow: 0 0 14px 2px rgba(37, 99, 235, 0.22);
          }
        }

        /* Mini Badges Pulse */
        .tf-pill-badge.blue {
          animation: badgeBreathe 3s ease-in-out infinite;
        }

        .tf-pill-badge.green {
          animation: badgeBreathe 3s ease-in-out infinite 1s;
        }

        @keyframes badgeBreathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .tf-chart-x-labels {
          display: flex;
          justify-content: space-between;
          font-size: 8px;
          color: #94a3b8;
          padding-top: 4px;
        }

        /* Chart right stats */
        .tf-chart-stats-col {
          border-left: 1px solid #f1f5f9;
          padding-left: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .tf-stat-item {
          display: flex;
          flex-direction: column;
          padding-bottom: 2px;
        }

        .tf-stat-label {
          font-size: 8.5px;
          color: #64748b;
          line-height: 1.15;
        }

        .tf-stat-val {
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
        }

        /* Bottom Mini Subcards */
        .tf-dash-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 640px) {
          .tf-dash-bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        .tf-dash-subcard {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 14px;
        }

        .tf-subcard-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .tf-subcard-head h5 {
          margin: 0;
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
        }

        .tf-view-all {
          font-size: 10px;
          color: #2563eb;
          font-weight: 600;
          cursor: pointer;
        }

        .tf-mini-list, .tf-mini-tasks {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tf-mini-list li, .tf-mini-tasks li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
        }

        .tf-cand-mini-info {
          display: flex;
          flex-direction: column;
        }

        .tf-cand-name {
          font-weight: 700;
          color: #0f172a;
        }

        .tf-cand-role {
          font-size: 8.5px;
          color: #64748b;
        }

        .tf-pill-badge {
          font-size: 8px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .tf-pill-badge.blue { background: #dbeafe; color: #1d4ed8; }
        .tf-pill-badge.green { background: #dcfce7; color: #15803d; }
        .tf-pill-badge.orange { background: #ffedd5; color: #c2410c; }

        .tf-task-badge {
          font-size: 8px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .tf-task-badge.urgent { background: #fef08a; color: #854d0e; }
        .tf-task-badge.new { background: #ccfbf1; color: #0f766e; }
        .tf-task-badge.default { background: #f1f5f9; color: #475569; }

        /* =========================================================================
           SECTION 2: FEATURES GRID (8 Cards)
           ========================================================================= */
        .tf-features-section {
          padding: 90px 0;
          background: #fafbfd;
          border-top: 1px solid #f1f5f9;
        }

        .tf-section-header {
          max-width: 720px;
          margin: 0 auto 50px;
        }

        .text-center { text-align: center; }

        .tf-eyebrow-amber {
          color: #d97706;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          display: inline-block;
          margin-bottom: 12px;
        }

        .tf-section-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(28px, 3.4vw, 40px);
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #0f172a;
          margin: 0 0 16px 0;
          line-height: 1.2;
        }

        .tf-section-subtitle {
          font-size: 15.5px;
          line-height: 1.6;
          color: #64748b;
          margin: 0;
        }

        .tf-features-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
          gap: 24px;
        }

        .tf-feature-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 30px 24px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.02);
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
        }

        .tf-feature-box:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(37, 99, 235, 0.07);
          border-color: #bfdbfe;
        }

        .tf-feature-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        .blue-bg { background: #eff6ff; color: #2563eb; }
        .emerald-bg { background: #ecfdf5; color: #059669; }
        .indigo-bg { background: #e0e7ff; color: #4338ca; }
        .purple-bg { background: #f3e8ff; color: #7e22ce; }
        .amber-bg { background: #fef3c7; color: #d97706; }
        .cyan-bg { background: #ecfeff; color: #0891b2; }

        .tf-feature-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 17.5px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 10px 0;
          line-height: 1.3;
        }

        .tf-feature-desc {
          font-size: 13.5px;
          line-height: 1.6;
          color: #64748b;
          margin: 0 0 18px 0;
          flex-grow: 1;
        }

        .tf-feature-tag {
          font-size: 11px;
          font-weight: 700;
          color: #2563eb;
          background: #eff6ff;
          padding: 4px 10px;
          border-radius: 6px;
          align-self: flex-start;
        }

        /* =========================================================================
           SECTION 3: TABLE SHOWCASE + 3 BIG NUMBERS (Screenshot 3 Match)
           ========================================================================= */
        .tf-showcase-section {
          padding: 90px 0;
          background: #ffffff;
        }

        .tf-showcase-grid {
          display: grid;
          grid-template-columns: 1.18fr 1fr;
          gap: 50px;
          align-items: center;
        }

        @media (max-width: 1024px) {
          .tf-showcase-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
        }

        .tf-table-content-wrap {
          padding: 16px 20px;
        }

        .tf-table-top-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .tf-table-actions-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f1f5f9;
        }

        .tf-table-count {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
        }

        .tf-table-head-actions {
          display: flex;
          gap: 8px;
        }

        .tf-mini-btn {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 4px 10px;
          border-radius: 4px;
          cursor: pointer;
        }

        .tf-mini-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .tf-table-responsive {
          overflow-x: auto;
        }

        .tf-mock-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          text-align: left;
        }

        .tf-mock-table thead th {
          background: #f8fafc;
          color: #64748b;
          font-size: 9.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 10px 14px;
          border-bottom: 1px solid #f1f5f9;
        }

        .tf-mock-table tbody td {
          padding: 12px 14px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          vertical-align: middle;
        }

        .tf-table-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tf-user-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .tf-user-dot.blue { background: #2563eb; }
        .tf-user-dot.green { background: #10b981; }
        .tf-user-dot.purple { background: #8b5cf6; }
        .tf-user-dot.amber { background: #f59e0b; }
        .tf-user-dot.cyan { background: #06b6d4; }

        .tf-table-user div {
          display: flex;
          flex-direction: column;
        }

        .tf-table-user strong {
          color: #0f172a;
          font-size: 12px;
        }

        .tf-table-user span {
          font-size: 10px;
          color: #94a3b8;
        }

        .tf-priority-pill {
          font-size: 9px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 9999px;
        }

        .tf-priority-pill.high { background: #fee2e2; color: #dc2626; }
        .tf-priority-pill.low { background: #fef3c7; color: #d97706; }
        .tf-priority-pill.normal { background: #dcfce7; color: #16a34a; }

        .tf-kebab {
          color: #94a3b8;
          font-weight: bold;
          cursor: pointer;
        }

        .tf-table-footer-bar {
          padding: 12px 14px;
          display: flex;
          justify-content: flex-end;
          gap: 20px;
          font-size: 10.5px;
          color: #94a3b8;
          border-top: 1px solid #f1f5f9;
        }

        /* Showcase Right Content */
        .tf-showcase-headline {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(30px, 3.6vw, 44px);
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.02em;
          color: #0f172a;
          margin: 0 0 18px 0;
        }

        .tf-showcase-p {
          font-size: 15.5px;
          line-height: 1.6;
          color: #64748b;
          margin: 0 0 32px 0;
        }

        /* 3 Big Stats */
        .tf-big-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          border-top: 1px solid #f1f5f9;
          padding-top: 28px;
        }

        @media (max-width: 540px) {
          .tf-big-stats-row {
            grid-template-columns: 1fr;
            gap: 18px;
          }
        }

        .tf-stat-large {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(36px, 3.8vw, 46px);
          font-weight: 800;
          color: #0f172a;
          display: block;
          line-height: 1;
          margin-bottom: 10px;
        }

        .tf-stat-subtext {
          font-size: 12.5px;
          line-height: 1.5;
          color: #64748b;
          margin: 0;
        }

        /* =========================================================================
           SECTION 4: SUPPORT TEAM (Professional Global Names)
           ========================================================================= */
        .tf-support-section {
          padding: 90px 0;
          background: #fafbfd;
          border-top: 1px solid #f1f5f9;
        }

        .tf-support-header {
          max-width: 740px;
          margin: 0 auto 44px;
        }

        .tf-support-cta-wrap {
          margin: 24px 0 28px;
        }

        .tf-checklist-row {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 14px 22px;
        }

        .tf-check-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .tf-check-badge {
          color: #d97706;
          font-weight: 800;
        }

        .tf-team-members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-top: 44px;
        }

        .tf-team-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 26px 18px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.02);
          transition: transform 0.2s ease;
        }

        .tf-team-card:hover {
          transform: translateY(-3px);
          border-color: #cbd5e1;
        }

        .tf-team-avatar-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          color: white;
          font-size: 19px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          box-shadow: 0 8px 16px rgba(15, 23, 42, 0.1);
        }

        .tf-team-name {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .tf-team-title {
          font-size: 12px;
          color: #64748b;
          line-height: 1.3;
        }

        /* =========================================================================
           SECTION 5: CUSTOMIZATION
           ========================================================================= */
        .tf-customization-section {
          padding: 90px 0;
          background: #ffffff;
          border-top: 1px solid #f1f5f9;
        }

        .tf-customization-header {
          max-width: 680px;
          margin: 0 auto 44px;
        }

        .tf-customization-actions {
          display: flex;
          justify-content: center;
          gap: 14px;
          margin-top: 22px;
        }

        /* Overlapping Perspective Cards & Real ATS Mockups */
        .tf-perspective-container {
          position: relative;
          max-width: 1180px;
          margin: 36px auto 0;
          height: 480px;
        }

        @media (max-width: 992px) {
          .tf-perspective-container {
            height: auto;
            display: flex;
            flex-direction: column;
            gap: 28px;
          }
        }

        .tf-persp-card {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.05);
          overflow: hidden;
        }

        .tf-persp-left {
          position: absolute;
          left: 0;
          top: 0;
          width: 58%;
          z-index: 2;
          transform: perspective(1200px) rotateY(3deg) rotateX(1.5deg) scale(0.98);
          transform-origin: left center;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
        }

        .tf-persp-left:hover {
          transform: perspective(1200px) rotateY(0deg) rotateX(0deg) scale(1);
          z-index: 5;
          box-shadow: 0 30px 70px -15px rgba(15, 23, 42, 0.25);
        }

        .tf-persp-right {
          position: absolute;
          right: 0;
          top: 36px;
          width: 58%;
          z-index: 3;
          transform: perspective(1200px) rotateY(-3deg) rotateX(1.5deg) scale(1);
          transform-origin: right center;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
        }

        .tf-persp-right:hover {
          transform: perspective(1200px) rotateY(0deg) rotateX(0deg) scale(1.02);
          z-index: 6;
          box-shadow: 0 35px 80px -15px rgba(15, 23, 42, 0.28);
        }

        @media (max-width: 992px) {
          .tf-persp-left, .tf-persp-right {
            position: static;
            width: 100%;
            transform: none !important;
          }
        }

        .tf-persp-header {
          background: #0f172a;
          border-bottom: 1px solid #1e293b;
          padding: 9px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .tf-persp-dots {
          display: flex;
          gap: 5px;
        }

        .tf-persp-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .dot-red { background: #ef4444; }
        .dot-yellow { background: #f59e0b; }
        .dot-green { background: #10b981; }

        .tf-persp-title-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tf-persp-title {
          font-size: 11px;
          font-weight: 700;
          color: #e2e8f0;
          letter-spacing: -0.01em;
        }

        .tf-persp-live-pill {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          font-size: 9px;
          font-weight: 800;
          padding: 1.5px 6px;
          border-radius: 9999px;
          text-transform: uppercase;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .tf-persp-live-pill-blue {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          font-size: 9px;
          font-weight: 800;
          padding: 1.5px 6px;
          border-radius: 9999px;
          text-transform: uppercase;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        /* ─── LEFT CARD: Reports Dashboard Styles ─── */
        .tf-persp-dashboard-layout {
          display: flex;
          height: 410px;
          background: #f8fafc;
        }

        .tf-persp-sidebar {
          width: 44px;
          background: #161e31;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 0;
          gap: 12px;
          border-right: 1px solid #1e293b;
        }

        .tf-persp-side-logo {
          font-size: 14px;
          color: #3b82f6;
          margin-bottom: 2px;
        }

        .tf-persp-side-item {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tf-persp-side-item.active {
          background: #24324f;
          color: #ffffff;
          box-shadow: 0 0 0 1px #3b82f6;
        }

        .tf-persp-main-view {
          flex: 1;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: hidden;
        }

        .tf-persp-subbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10.5px;
        }

        .tf-persp-subbar-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tf-persp-subbar-title {
          font-weight: 800;
          color: #0f172a;
        }

        .tf-persp-subbar-sep {
          color: #94a3b8;
        }

        .tf-persp-subbar-pill {
          background: #e2e8f0;
          color: #334155;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 4px;
          font-size: 9.5px;
        }

        .tf-persp-subbar-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tf-persp-date-badge {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
          font-size: 9.5px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .tf-persp-btn-mini {
          background: #2563eb;
          color: #ffffff;
          font-size: 9.5px;
          font-weight: 700;
          padding: 2.5px 8px;
          border-radius: 4px;
        }

        /* 4 Live KPI Cards */
        .tf-persp-kpis-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 7px;
        }

        .tf-persp-kpi-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 7px;
          padding: 7px 9px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }

        .kpi-label {
          font-size: 8.5px;
          color: #64748b;
          font-weight: 600;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .kpi-val-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-top: 2px;
        }

        .kpi-num {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
        }

        .kpi-growth {
          font-size: 8.5px;
          font-weight: 700;
        }

        .kpi-growth.green { color: #16a34a; }
        .kpi-growth.blue { color: #2563eb; }
        .kpi-growth.amber { color: #d97706; }

        /* Mid Analytics Grid */
        .tf-persp-mid-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
          flex: 1;
        }

        .tf-persp-gauge-card, .tf-persp-stages-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 9px 11px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }

        .gauge-card-header, .stage-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9.5px;
          font-weight: 700;
          color: #1e293b;
        }

        .gauge-sub, .stage-total {
          font-size: 8.5px;
          color: #64748b;
          font-weight: 600;
        }

        .gauge-canvas-wrap {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 4px 0;
        }

        .gauge-svg {
          width: 140px;
          height: 80px;
        }

        .gauge-readout {
          position: absolute;
          bottom: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1;
        }

        .gauge-big-num {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }

        .gauge-lbl {
          font-size: 8px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
        }

        .gauge-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #64748b;
          border-top: 1px solid #f1f5f9;
          padding-top: 5px;
        }

        .gauge-meta-row strong {
          color: #0f172a;
        }

        .stage-bars-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 4px 0;
        }

        .stage-bar-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .stage-bar-label {
          display: flex;
          justify-content: space-between;
          font-size: 8.5px;
          color: #475569;
        }

        .stage-bar-label strong {
          color: #0f172a;
        }

        .stage-progress-track {
          height: 6px;
          background: #f1f5f9;
          border-radius: 9999px;
          overflow: hidden;
        }

        .stage-progress-fill {
          height: 100%;
          border-radius: 9999px;
        }

        .stage-blue { background: #3b82f6; }
        .stage-emerald { background: #10b981; }

        .weekly-velocity-wrap {
          border-top: 1px solid #f1f5f9;
          padding-top: 5px;
        }

        .weekly-velocity-title {
          font-size: 8px;
          color: #64748b;
          font-weight: 700;
          display: block;
          margin-bottom: 4px;
        }

        .weekly-bars-flex {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 28px;
          gap: 4px;
        }

        .weekly-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
        }

        .w-bar {
          width: 100%;
          max-width: 14px;
          background: #cbd5e1;
          border-radius: 3px 3px 0 0;
          transition: height 0.2s ease;
        }

        .w-bar.active {
          background: #2563eb;
        }

        .w-lbl {
          font-size: 7.5px;
          color: #94a3b8;
          margin-top: 2px;
          font-weight: 600;
        }

        /* ─── RIGHT CARD: Candidates Table Styles ─── */
        .tf-persp-table-layout {
          display: flex;
          height: 410px;
          background: #ffffff;
        }

        .tf-persp-filter-pane {
          width: 125px;
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
          padding: 10px 8px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 9.5px;
        }

        .pane-title {
          font-size: 9px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .pane-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pane-group-lbl {
          font-size: 8px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
        }

        .pane-filter-item {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #475569;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 4px;
        }

        .pane-filter-item.active {
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 700;
        }

        .check-box {
          font-size: 8px;
          font-weight: 800;
          color: #2563eb;
        }

        .check-box.empty {
          display: inline-block;
          width: 8px;
          height: 8px;
          border: 1px solid #cbd5e1;
          border-radius: 2px;
        }

        .pane-status-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2px 4px;
          color: #475569;
          border-radius: 4px;
        }

        .pane-status-row.active {
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 700;
        }

        .pane-status-row strong {
          font-size: 9px;
        }

        /* Main Candidate Table */
        .tf-persp-table-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .tf-persp-table-head {
          display: grid;
          grid-template-columns: 2.2fr 1.8fr 1.2fr 1.8fr 1fr;
          gap: 6px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 8px 10px;
          font-size: 8.5px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .tf-persp-table-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .tf-persp-trow {
          display: grid;
          grid-template-columns: 2.2fr 1.8fr 1.2fr 1.8fr 1fr;
          gap: 6px;
          align-items: center;
          padding: 7px 10px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 9.5px;
          transition: background 0.15s ease;
        }

        .tf-persp-trow:hover {
          background: #f8fafc;
        }

        .tf-persp-trow.highlight-row {
          background: #f0fdf4;
          border-left: 2.5px solid #10b981;
        }

        .td-name {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }

        .td-name strong {
          color: #0f172a;
          font-size: 10px;
        }

        .td-sub-email {
          font-size: 8px;
          color: #64748b;
        }

        .td-job {
          display: flex;
          flex-direction: column;
          gap: 1.5px;
        }

        .req-pill {
          display: inline-block;
          font-size: 7.5px;
          font-weight: 700;
          background: #eff6ff;
          color: #2563eb;
          padding: 1px 4px;
          border-radius: 3px;
          width: fit-content;
        }

        .req-pill.pulse-pill {
          background: #dcfce7;
          color: #15803d;
          font-weight: 800;
        }

        .req-sub {
          font-size: 8px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .td-recruiter {
          display: flex;
          align-items: center;
        }

        .recruiter-tag {
          font-size: 8.5px;
          font-weight: 600;
          color: #334155;
          background: #f1f5f9;
          padding: 1.5px 5px;
          border-radius: 4px;
        }

        .td-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 3px;
          align-items: center;
        }

        .skill-chip {
          font-size: 7.5px;
          background: #f1f5f9;
          color: #475569;
          padding: 1px 4px;
          border-radius: 3px;
          font-weight: 600;
        }

        .skill-chip.more {
          background: #e2e8f0;
          color: #1e293b;
          font-weight: 700;
        }

        .td-rate {
          text-align: right;
        }

        .rate-num {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
        }

        .rate-num.rate-high {
          color: #16a34a;
        }

        .tf-persp-table-foot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 12px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          font-size: 8.5px;
          color: #64748b;
        }

        .tf-persp-table-foot strong {
          color: #0f172a;
        }

        .foot-pages {
          font-weight: 600;
        }

        /* =========================================================================
           SECTION 6: OPTIMIZED RATE & PRICING WITH MARGIN CALCULATOR
           ========================================================================= */
        .tf-pricing-section {
          padding: 90px 0;
          background: #fafbfd;
          border-top: 1px solid #f1f5f9;
        }

        .tf-billing-toggle-box {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-top: 22px;
          padding: 6px 14px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 9999px;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
        }

        .tf-billing-toggle-box span {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
        }

        .tf-billing-toggle-box span.active-label {
          color: #0f172a;
          font-weight: 700;
        }

        .tf-switch-btn {
          width: 44px;
          height: 24px;
          background: #2563eb;
          border: none;
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          padding: 0;
        }

        .tf-switch-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tf-switch-thumb.yearly {
          transform: translateX(20px);
        }

        .tf-discount-chip {
          background: #ecfdf5;
          color: #059669;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: 4px;
        }

        .tf-plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
          gap: 28px;
          align-items: stretch;
          margin-top: 44px;
        }

        .tf-plan-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 36px 28px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.03);
          transition: all 0.25s ease;
          position: relative;
        }

        .tf-plan-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
          border-color: #cbd5e1;
        }

        .tf-popular-plan {
          border-color: #2563eb;
          box-shadow: 0 16px 36px rgba(37, 99, 235, 0.12);
        }

        .tf-popular-banner {
          position: absolute;
          top: -12px;
          right: 28px;
          background: #2563eb;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 4px 12px;
          border-radius: 9999px;
        }

        .tf-plan-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px 0;
        }

        .tf-plan-desc {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 20px 0;
          min-height: 36px;
        }

        .tf-plan-price {
          display: flex;
          align-items: baseline;
          color: #0f172a;
        }

        .tf-plan-price .curr { font-size: 22px; font-weight: 700; margin-right: 2px; }
        .tf-plan-price .val { font-size: 44px; font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif; }
        .tf-plan-price .freq { font-size: 13px; color: #64748b; font-weight: 600; margin-left: 4px; }

        .tf-billed-note {
          display: block;
          font-size: 11px;
          color: #059669;
          font-weight: 600;
          margin-top: 4px;
        }

        .tf-plan-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 24px 0;
        }

        .tf-plan-perks {
          list-style: none;
          padding: 0;
          margin: 0 0 32px 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex-grow: 1;
        }

        .tf-plan-perks li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13.5px;
          color: #334155;
          line-height: 1.4;
        }

        .tf-plan-perks .check {
          color: #2563eb;
          font-weight: 800;
        }

        .tf-plan-btn {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .tf-plan-btn.primary {
          background: #2563eb;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }

        .tf-plan-btn.primary:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .tf-plan-btn.outline {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f172a;
        }

        .tf-plan-btn.outline:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        /* =========================================================================
           STAFFING MARGIN CALCULATOR CARD
           ========================================================================= */
        .tf-calculator-card {
          margin-top: 60px;
          background: #ffffff;
          border: 1px solid #bfdbfe;
          border-radius: 20px;
          padding: 40px 36px;
          box-shadow: 0 20px 45px rgba(37, 99, 235, 0.06);
        }

        .tf-calc-header {
          text-align: center;
          max-width: 640px;
          margin: 0 auto 36px;
        }

        .tf-calc-badge {
          display: inline-block;
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 4px 12px;
          border-radius: 9999px;
          margin-bottom: 12px;
        }

        .tf-calc-header h3 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 10px 0;
        }

        .tf-calc-header p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .tf-calc-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 44px;
          align-items: center;
        }

        @media (max-width: 860px) {
          .tf-calc-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }

        .tf-calc-controls {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .tf-slider-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tf-slider-label {
          display: flex;
          justify-content: space-between;
          font-size: 13.5px;
          font-weight: 600;
          color: #334155;
        }

        .tf-highlight-val {
          color: #2563eb;
          font-weight: 800;
        }

        .tf-calc-range {
          width: 100%;
          height: 6px;
          border-radius: 4px;
          background: #e2e8f0;
          outline: none;
          accent-color: #2563eb;
          cursor: pointer;
        }

        .tf-range-bounds {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #94a3b8;
        }

        .tf-calc-results {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tf-calc-metric-box {
          display: flex;
          flex-direction: column;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .tf-metric-subtitle {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
        }

        .tf-metric-number {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
        }

        .tf-metric-number small {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
        }

        .tf-metric-note {
          font-size: 11px;
          color: #94a3b8;
        }

        .tf-calc-highlight-metric {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          padding: 16px;
          display: flex;
          flex-direction: column;
        }

        .tf-annual-label {
          font-size: 11px;
          font-weight: 800;
          color: #1d4ed8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .tf-annual-val {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #1e3a8a;
          margin: 4px 0 6px 0;
        }

        .tf-annual-expl {
          font-size: 12px;
          color: #3b82f6;
          margin: 0;
          line-height: 1.4;
        }

        /* =========================================================================
           LOGIN MODAL STYLES
           ========================================================================= */
        .tf-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .tf-modal-card {
          background: #ffffff;
          border-radius: 16px;
          width: min(440px, 100%);
          padding: 32px 28px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
          animation: tfModalPop 0.2s ease-out;
        }

        @keyframes tfModalPop {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .tf-modal-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .tf-modal-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }

        .tf-close-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #94a3b8;
        }

        .tf-modal-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 20px 0;
        }

        .tf-error-alert {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          color: #b91c1c;
          font-size: 12px;
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .tf-login-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .tf-input-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tf-input-field label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
        }

        .tf-input-field input {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .tf-input-field input:focus {
          border-color: #2563eb;
        }

        .tf-submit-btn {
          margin-top: 8px;
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .tf-submit-btn:hover {
          background: #1d4ed8;
        }

        .tf-demo-helpers {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .tf-demo-helpers span {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 8px;
        }

        .tf-demo-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tf-chip {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          color: #334155;
          transition: all 0.15s ease;
        }

        .tf-chip:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #1d4ed8;
        }
      

        /* =========================================================================
           AUTONOMOUS WORKFLOW TIMELINE STYLES (Tasklet.ai Theme Match)
           ========================================================================= */
        .tf-workflow-section {
          padding: 80px 0 95px;
          background: #ffffff;
          position: relative;
        }

        .tf-workflow-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 32px 36px 40px;
          box-shadow: 0 4px 24px -2px rgba(15, 23, 42, 0.05);
          position: relative;
          overflow: hidden;
          margin-bottom: 32px;
        }

        .tf-wf-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 24px;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }

        .tf-wf-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tf-wf-status-beacon {
          position: relative;
          width: 10px;
          height: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .tf-wf-pulse-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          position: relative;
          z-index: 2;
        }

        .tf-wf-pulse-ring {
          position: absolute;
          width: 18px;
          height: 18px;
          background: rgba(16, 185, 129, 0.35);
          border-radius: 50%;
          animation: wfPulseBeacon 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes wfPulseBeacon {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .tf-wf-period-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: #475569;
          text-transform: uppercase;
        }

        .tf-wf-stats-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f172a;
          font-size: 12px;
          font-weight: 700;
          padding: 5px 14px;
          border-radius: 9999px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .tf-wf-stats-pill svg {
          color: #10b981;
        }

        /* Desktop Interactive Timeline Stage */
        .tf-timeline-stage {
          position: relative;
          width: 100%;
          height: 380px;
          margin-top: 10px;
        }

        @media (max-width: 900px) {
          .tf-timeline-stage {
            display: none;
          }
        }

        /* Horizontal Rail */
        .tf-timeline-rail {
          position: absolute;
          top: 50%;
          left: 1%;
          right: 1%;
          height: 3px;
          background: #cbd5e1;
          border-radius: 9999px;
          transform: translateY(-50%);
          z-index: 5;
        }

        /* Continuous Scanning Laser Beam Runner */
        .tf-timeline-beam-runner {
          position: absolute;
          top: -1.5px;
          left: -20%;
          height: 6px;
          width: 240px;
          background: linear-gradient(90deg, transparent 0%, rgba(37, 99, 235, 0.3) 25%, #2563eb 70%, #38bdf8 95%, #ffffff 100%);
          border-radius: 9999px;
          filter: drop-shadow(0 0 8px #38bdf8) drop-shadow(0 0 16px rgba(37, 99, 235, 0.6));
          animation: workflowBeam 5.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          z-index: 6;
        }

        .tf-timeline-beam-head {
          position: absolute;
          right: 0;
          top: -2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 10px #ffffff, 0 0 18px #38bdf8;
        }

        @keyframes workflowBeam {
          0% {
            left: -20%;
            opacity: 0;
          }
          4% {
            opacity: 1;
          }
          92% {
            opacity: 1;
          }
          100% {
            left: 102%;
            opacity: 0;
          }
        }

        /* Rail Milestone Nodes */
        .tf-rail-node {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 7;
        }

        .tf-node-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #0f172a;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 1px #94a3b8;
          transition: all 0.2s ease;
        }

        .tf-node-ping {
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.25);
          animation: nodePingAnim 3s infinite;
        }

        @keyframes nodePingAnim {
          0% { transform: scale(0.6); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(0.6); opacity: 0; }
        }

        /* Vertical Connector Stems */
        .tf-connector-stem {
          position: absolute;
          width: 2px;
          z-index: 4;
          transform: translateX(-50%);
        }

        .tf-connector-stem.stem-above {
          bottom: 50%;
          height: 48px;
          background: linear-gradient(to top, #94a3b8 60%, transparent 100%);
          border-left: 2px dashed #94a3b8;
        }

        .tf-connector-stem.stem-below {
          top: 50%;
          height: 48px;
          background: linear-gradient(to bottom, #94a3b8 60%, transparent 100%);
          border-left: 2px dashed #94a3b8;
        }

        /* Event Milestone Card Items */
        .tf-wf-card-item {
          position: absolute;
          transform: translateX(-50%);
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          width: 235px;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          z-index: 10;
          cursor: pointer;
        }

        .tf-wf-card-item:hover {
          transform: translateX(-50%) translateY(-3px);
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
          border-color: #93c5fd;
        }

        .tf-wf-card-item.card-above {
          bottom: calc(50% + 48px);
        }

        .tf-wf-card-item.card-below {
          top: calc(50% + 48px);
        }

        .tf-wf-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tf-wf-icon-box.vms-icon {
          background: #eff6ff;
          color: #2563eb;
        }

        .tf-wf-icon-box.aimatch-icon {
          background: #ecfdf5;
          color: #059669;
        }

        .tf-wf-icon-box.email-icon {
          background: #fff7ed;
          color: #ea580c;
        }

        .tf-wf-icon-box.rtr-icon {
          background: #faf5ff;
          color: #7c3aed;
        }

        .tf-wf-icon-box.slack-icon {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .tf-wf-icon-box.portal-icon {
          background: #f0fdfa;
          color: #0d9488;
        }

        .tf-wf-content {
          flex: 1;
          min-width: 0;
        }

        .tf-wf-title {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tf-wf-sub {
          font-size: 10px;
          color: #64748b;
          margin-top: 2px;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tf-wf-sub strong {
          color: #334155;
        }

        .tf-wf-mini-badge {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.04em;
          padding: 2px 6px;
          border-radius: 9999px;
          flex-shrink: 0;
          text-transform: uppercase;
        }

        .blue-pill { background: #dbeafe; color: #1e40af; }
        .emerald-pill { background: #d1fae5; color: #065f46; }
        .amber-pill { background: #fef3c7; color: #92400e; }
        .purple-pill { background: #ede9fe; color: #5b21b6; }
        .slack-pill { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
        .teal-pill { background: #ccfbf1; color: #115e59; }

        /* Time Axis Labels */
        .tf-time-axis-labels {
          position: absolute;
          top: calc(50% + 14px);
          left: 0;
          right: 0;
          height: 20px;
          pointer-events: none;
        }

        .tf-axis-time {
          position: absolute;
          transform: translateX(-50%);
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.02em;
        }

        .tf-axis-moon {
          display: inline-flex;
          align-items: center;
        }

        /* Mobile Timeline (<= 900px) */
        .tf-mobile-timeline-stage {
          display: none;
        }

        @media (max-width: 900px) {
          .tf-mobile-timeline-stage {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-top: 10px;
          }

          .tf-m-event-item {
            display: flex;
            gap: 14px;
            align-items: flex-start;
            position: relative;
          }

          .tf-m-event-left {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex-shrink: 0;
          }

          .tf-m-stem {
            width: 2px;
            height: 28px;
            background: #cbd5e1;
            margin-top: 6px;
          }

          .tf-m-event-card {
            flex: 1;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          }
        }

        /* Two Lower Sub-Cards (Delegate real work / Keep recruiters in the loop) */
        .tf-workflow-subgrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 800px) {
          .tf-workflow-subgrid {
            grid-template-columns: 1fr;
          }
        }

        .tf-subcard {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 32px 28px;
          box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .tf-subcard:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
        }

        .tf-subcard-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        .tf-subcard-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 10px;
          letter-spacing: -0.02em;
        }

        .tf-subcard-desc {
          font-size: 14px;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 18px;
        }

        .tf-subcard-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tf-subcard-pill {
          font-size: 11px;
          font-weight: 700;
          background: #f1f5f9;
          color: #334155;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

`}</style>
    </SiteLayout>
  )
}

export default Homepage
