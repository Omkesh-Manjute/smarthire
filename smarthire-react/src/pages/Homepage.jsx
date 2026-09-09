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
      // 1. Try real backend login endpoint
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

      // 2. Fallback to localStorage (ensures offline robustness)
      const savedRecruitersRaw = localStorage.getItem('smarthire_recruiters')
      
      const defaultRecs = [
        { id: 'rec-1', name: 'Omkesh Manjute', email: 'omkesh@coolsofttech.com', role: 'superadmin', refCode: 'omkesh', company: 'SmartHire', isActive: true, password: 'admin' },
        { id: 'rec-2', name: 'Sukamal Chatterjee', email: 'kamal@coolsofttech.com', role: 'recruiter', refCode: 'sukamal-chatterjee', company: 'SmartHire', isActive: true, password: 'recruiter123' },
        { id: 'rec-3', name: 'Raj', email: 'raj@coolsofttech.com', role: 'recruiter', refCode: 'raj', company: 'SmartHire', isActive: true, password: 'recruiter123' },
        { id: 'rec-4', name: 'Vaibhav Bisen', email: 'vaibhav@coolsofttech.com', role: 'recruiter', refCode: 'vaibhav-bisen', company: 'SmartHire', isActive: true, password: 'recruiter123' },
        { id: 'rec-5', name: 'Pankaj', email: 'pankajm@coolsofttech.com', role: 'recruiter', refCode: 'pankaj', company: 'SmartHire', isActive: true, password: 'recruiter123' },
        { id: 'rec-6', name: 'Gourav', email: 'gourav@coolsofttech.com', role: 'employee', refCode: 'gourav', company: 'SmartHire', isActive: true, password: 'recruiter123', parentRecruiterName: 'Omkesh' }
      ]

      let recruitersList = defaultRecs
      if (savedRecruitersRaw) {
        try {
          recruitersList = JSON.parse(savedRecruitersRaw)
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
      const updatedRecruiters = recruitersList.map(r => r.id === matchedUser.id ? matchedUser : r)
      localStorage.setItem('smarthire_recruiters', JSON.stringify(updatedRecruiters))

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
                  Beautiful data representation{' '}
                  <span className="tf-highlight-box">built with SmartHire</span>
                </h1>

                <p className="tf-hero-subtitle">
                  Recruiters and staffing agencies use the SmartHire command center to source talent, verify credentials against proxy fraud, and dispatch directly to JobsInHand and Coolworks VMS in seconds.
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
                        Learn more
                      </a>
                    </>
                  )}
                </div>

                {/* Social Proof / Trust Footnote */}
                <div className="tf-hero-trust">
                  <div className="tf-avatar-stack">
                    <span className="tf-avatar tf-av-1">OM</span>
                    <span className="tf-avatar tf-av-2">SC</span>
                    <span className="tf-avatar tf-av-3">VB</span>
                    <span className="tf-avatar tf-av-4">GS</span>
                  </div>
                  <div className="tf-trust-text">
                    <strong>1,280+ Candidates Placed</strong>
                    <span>Verified across NC DHHS, State & Fortune 500 Clients</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Floating Dashboard UI Mockup (Matching Screenshot 2) */}
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
                      <span className="tf-dash-brand-name">Dashboard Kit</span>
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
                        <span>Candidates</span>
                      </li>
                      <li className="tf-dash-nav-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polygon points="10 8 16 12 10 16 10 8"/>
                        </svg>
                        <span>Auto-Apply Bot</span>
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
                          <span className="tf-dash-user-name">Omkesh Manjute</span>
                          <span className="tf-dash-user-role">Super Admin</span>
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
                        <span className="tf-kpi-label">Auto-Applied</span>
                        <span className="tf-kpi-num">142</span>
                      </div>
                    </div>

                    {/* Today's Trends Line Chart + Right Stats */}
                    <div className="tf-dash-chart-card">
                      <div className="tf-chart-left">
                        <div className="tf-chart-head">
                          <h4>Today's trends</h4>
                          <span className="tf-chart-timestamp">as of 25 May 2026, 09:41 PM</span>
                          <div className="tf-chart-legend">
                            <span className="tf-legend-dot blue"></span> Today
                            <span className="tf-legend-dot gray"></span> Yesterday
                          </div>
                        </div>

                        {/* Interactive SVG Bezier Chart */}
                        <div className="tf-svg-chart-container">
                          <svg viewBox="0 0 420 180" className="tf-bezier-svg">
                            <defs>
                              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25"/>
                                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0"/>
                              </linearGradient>
                            </defs>
                            <line x1="0" y1="40" x2="420" y2="40" stroke="#f1f5f9" strokeDasharray="3 3" />
                            <line x1="0" y1="80" x2="420" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
                            <line x1="0" y1="120" x2="420" y2="120" stroke="#f1f5f9" strokeDasharray="3 3" />
                            <line x1="0" y1="160" x2="420" y2="160" stroke="#f1f5f9" strokeDasharray="3 3" />

                            <path 
                              d="M 10,140 Q 60,110 110,130 T 210,100 T 310,120 T 410,70" 
                              fill="none" 
                              stroke="#cbd5e1" 
                              strokeWidth="2" 
                              strokeDasharray="4 4" 
                            />

                            <path 
                              d="M 10,150 Q 70,80 130,135 T 250,55 T 340,115 T 410,40 L 410,180 L 10,180 Z" 
                              fill="url(#chartGrad)" 
                            />

                            <path 
                              d="M 10,150 Q 70,80 130,135 T 250,55 T 340,115 T 410,40" 
                              fill="none" 
                              stroke="#2563eb" 
                              strokeWidth="2.5" 
                            />

                            <circle cx="250" cy="55" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                            <rect x="235" y="24" width="30" height="20" rx="4" fill="#ffffff" stroke="#e2e8f0" />
                            <text x="250" y="38" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a">38</text>
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
                          <span className="tf-stat-val">33m</span>
                        </div>
                        <div className="tf-stat-item">
                          <span className="tf-stat-label">JobsInHand sync speed</span>
                          <span className="tf-stat-val">1.2s</span>
                        </div>
                        <div className="tf-stat-item">
                          <span className="tf-stat-label">Resolution within SLA</span>
                          <span className="tf-stat-val">99%</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Recent Candidate Pipeline & Tasks */}
                    <div className="tf-dash-bottom-grid">
                      <div className="tf-dash-subcard">
                        <div className="tf-subcard-head">
                          <h5>Recent Candidate Submissions</h5>
                          <span className="tf-view-all">View details</span>
                        </div>
                        <ul className="tf-mini-list">
                          <li>
                            <div className="tf-cand-mini-info">
                              <span className="tf-cand-name">Kranthi Kumar</span>
                              <span className="tf-cand-role">Sr AWS Developer (Req #158997)</span>
                            </div>
                            <span className="tf-pill-badge blue">⚡ AUTO-APPLIED</span>
                          </li>
                          <li>
                            <div className="tf-cand-mini-info">
                              <span className="tf-cand-name">Sarah Jenkins</span>
                              <span className="tf-cand-role">Cloud Architect (Pos #808496)</span>
                            </div>
                            <span className="tf-pill-badge green">✓ CLIENT SUBMITTED</span>
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
                          <h5>Compliance & Verification</h5>
                          <span className="tf-view-all">View all</span>
                        </div>
                        <ul className="tf-mini-tasks">
                          <li>
                            <span>Anti-Proxy Liveness Video Check</span>
                            <span className="tf-task-badge urgent">PASSED 99.1%</span>
                          </li>
                          <li>
                            <span>EEO Step-2 Form Automation</span>
                            <span className="tf-task-badge new">COMPLETED</span>
                          </li>
                          <li>
                            <span>Work Authorization (C2C / W2)</span>
                            <span className="tf-task-badge default">VERIFIED</span>
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
            SECTION 2: CORE ATS FEATURES GRID ("How SmartHire Automates Recruiter Workflows")
            ========================================================================= */}
        <section className="tf-features-section" id="features">
          <div className="tf-container">
            <div className="tf-section-header text-center">
              <span className="tf-eyebrow-amber">INTELLIGENT AUTOMATION</span>
              <h2 className="tf-section-title">How SmartHire Automates Recruiter Workflows</h2>
              <p className="tf-section-subtitle">
                Cut down candidate sourcing and validation overhead by 80%. Our full-stack ATS handles resume intake, anti-proxy biometric vetting, and direct VMS application delivery.
              </p>
            </div>

            <div className="tf-features-cards-grid">
              
              {/* Feature 1 */}
              <div className="tf-feature-box">
                <div className="tf-feature-icon-wrap blue-bg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <h3 className="tf-feature-title">1-Click JobsInHand & Coolworks Auto-Apply</h3>
                <p className="tf-feature-desc">
                  Our embedded Playwright bot automates both Step 1 candidate submission and Step 2 EEO/compliance questionnaires, pushing applicants directly into Coolworks VMS "New Candidates" tab in seconds.
                </p>
                <div className="tf-feature-tag">2-Step Playwright Engine</div>
              </div>

              {/* Feature 2 */}
              <div className="tf-feature-box">
                <div className="tf-feature-icon-wrap emerald-bg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <h3 className="tf-feature-title">Anti-Proxy & Biometric Identity Flow</h3>
                <p className="tf-feature-desc">
                  Eliminate proxy interview fraud before client submission. Candidate liveness face matching, official passport/visa OCR document analysis, and IP telemetry ensure 100% verified identities.
                </p>
                <div className="tf-feature-tag">99.1% Liveness Precision</div>
              </div>

              {/* Feature 3 */}
              <div className="tf-feature-box">
                <div className="tf-feature-icon-wrap indigo-bg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                </div>
                <h3 className="tf-feature-title">AI Resume Parser & Skills Match</h3>
                <p className="tf-feature-desc">
                  Instantly extract technical stacks, years of experience, work authorizations (C2C, W2, 1099), and generate explainable candidate-job suitability scores across all open requisitions.
                </p>
                <div className="tf-feature-tag">Semantic Match Engine</div>
              </div>

              {/* Feature 4 */}
              <div className="tf-feature-box">
                <div className="tf-feature-icon-wrap purple-bg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <h3 className="tf-feature-title">Multi-Role Recruiter Hierarchy</h3>
                <p className="tf-feature-desc">
                  Granular permission scoping for Superadmin, Admin, Manager, Recruiter, and Sourcing Specialists with supervisor assignment trees (Gourav → Omkesh, Naveen → Sukamal, Rahul → Vaibhav).
                </p>
                <div className="tf-feature-tag">Role-Based Access Control</div>
              </div>

              {/* Feature 5 */}
              <div className="tf-feature-box">
                <div className="tf-feature-icon-wrap amber-bg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <h3 className="tf-feature-title">Real-Time Chime & Instant JD Sync</h3>
                <p className="tf-feature-desc">
                  Sub-second Cloud Firestore synchronization. When a new job requisition is posted or scraped, all logged-in recruiters receive an uplifting ascending 4-tone audio chime and instant visual alert.
                </p>
                <div className="tf-feature-tag">Sub-Second Audio Chime</div>
              </div>

              {/* Feature 6 */}
              <div className="tf-feature-box">
                <div className="tf-feature-icon-wrap cyan-bg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                </div>
                <h3 className="tf-feature-title">Public Careers Portal & Auto-Ingestion</h3>
                <p className="tf-feature-desc">
                  High-converting public career portal (`/careers` and `/jobs`) featuring Classic ATS and Zone Modern layouts. Direct applicant submissions sync into matching requisitions with zero manual entry.
                </p>
                <div className="tf-feature-tag">Dual Layout Switcher</div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: TABLE SHOWCASE + 3 BIG NUMBERS (Matching Screenshot 3)
            ========================================================================= */}
        <section className="tf-showcase-section">
          <div className="tf-container">
            <div className="tf-showcase-grid">
              
              {/* Left: Floating Tickets/Candidates Table Mockup */}
              <div className="tf-table-mockup-outer">
                <div className="tf-table-mockup-card">
                  <div className="tf-table-head-bar">
                    <h4>Active Candidate Pipeline</h4>
                    <div className="tf-table-head-actions">
                      <span className="tf-mini-btn">↕ Sort</span>
                      <span className="tf-mini-btn">⚡ Filter</span>
                    </div>
                  </div>

                  <div className="tf-table-responsive">
                    <table className="tf-mock-table">
                      <thead>
                        <tr>
                          <th>Candidate details</th>
                          <th>Assigned Req / Role</th>
                          <th>Date</th>
                          <th>Status / Priority</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <div className="tf-table-user">
                              <span className="tf-user-dot blue" />
                              <div>
                                <strong>Kranthi Kumar</strong>
                                <span>kranthi@gmail.com</span>
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
                                <strong>Robert Downey</strong>
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
                                <strong>Christian Bale</strong>
                                <span>bale.c@devcorp.com</span>
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
                                <strong>Meely Cool</strong>
                                <span>meely@coolsoft-tech.com</span>
                              </div>
                            </div>
                          </td>
                          <td>Cloud Security Specialist</td>
                          <td>May 25, 2026</td>
                          <td><span className="tf-priority-pill high">HIGH 99%</span></td>
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

              {/* Right: Headline with highlight + 3 Big Numbers */}
              <div className="tf-showcase-content">
                <h2 className="tf-showcase-headline">
                  Use flexible components{' '}
                  <span className="tf-highlight-box">to place talent quickly</span>
                </h2>
                <p className="tf-showcase-p">
                  SmartHire styles and extends enterprise ATS workflows with instant VMS delivery, multi-role recruiter visibility, and zero-duplicate candidate safeguards.
                </p>

                <div className="tf-big-stats-row">
                  <div className="tf-big-stat-col">
                    <span className="tf-stat-large">10x</span>
                    <p className="tf-stat-subtext">
                      Faster candidate screening with AI resume parsing & dynamic skill matching.
                    </p>
                  </div>

                  <div className="tf-big-stat-col">
                    <span className="tf-stat-large">100%</span>
                    <p className="tf-stat-subtext">
                      Anti-proxy identity checks & biometric liveness before manager submission.
                    </p>
                  </div>

                  <div className="tf-big-stat-col">
                    <span className="tf-stat-large">99.4%</span>
                    <p className="tf-stat-subtext">
                      Clean ATS delivery to JobsInHand & Coolworks VMS in under 3 seconds.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: SUPPORT TEAM & RECRUITER SUCCESS (Matching Screenshot 4)
            ========================================================================= */}
        <section className="tf-support-section">
          <div className="tf-container">
            <div className="tf-support-header text-center">
              <span className="tf-eyebrow-amber">SUPPORT TEAM</span>
              <h2 className="tf-section-title">Our friendly support team will help you with anything</h2>
              <p className="tf-section-subtitle">
                We aim to take care of you. Need help with portal integration, auto-apply bot execution, or candidate compliance? We'll be there to lend a helping hand.
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
                  <span className="tf-check-badge">✔</span> JobsInHand Bot
                </span>
                <span className="tf-check-item">
                  <span className="tf-check-badge">✔</span> Multi-Role Hierarchy
                </span>
                <span className="tf-check-item">
                  <span className="tf-check-badge">✔</span> Anti-Proxy Checks
                </span>
                <span className="tf-check-item">
                  <span className="tf-check-badge">✔</span> Audio Chimes
                </span>
                <span className="tf-check-item">
                  <span className="tf-check-badge">✔</span> Coolworks VMS
                </span>
              </div>
            </div>

            {/* Team Members Row */}
            <div className="tf-team-members-grid">
              
              <div className="tf-team-card">
                <div className="tf-team-avatar-circle" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                  OM
                </div>
                <h4 className="tf-team-name">Omkesh Manjute</h4>
                <span className="tf-team-title">Super Admin & Operations</span>
              </div>

              <div className="tf-team-card">
                <div className="tf-team-avatar-circle" style={{ background: 'linear-gradient(135deg, #10b981, #047857)' }}>
                  SC
                </div>
                <h4 className="tf-team-name">Sukamal Chatterjee</h4>
                <span className="tf-team-title">Recruiter Supervisor</span>
              </div>

              <div className="tf-team-card">
                <div className="tf-team-avatar-circle" style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)' }}>
                  VB
                </div>
                <h4 className="tf-team-name">Vaibhav Bisen</h4>
                <span className="tf-team-title">Delivery Manager</span>
              </div>

              <div className="tf-team-card">
                <div className="tf-team-avatar-circle" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                  GS
                </div>
                <h4 className="tf-team-name">Gourav</h4>
                <span className="tf-team-title">Sourcing Specialist</span>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: CUSTOMIZATION & OVERLAPPING PERSPECTIVE MOCKUP (Matching Screenshot 5)
            ========================================================================= */}
        <section className="tf-customization-section">
          <div className="tf-container">
            <div className="tf-customization-header text-center">
              <span className="tf-eyebrow-amber">CUSTOMIZATION</span>
              <h2 className="tf-section-title">Customize your product</h2>
              <p className="tf-section-subtitle">
                We aim to take care of you. Need customized candidate questionnaires, specialized pay rates, or custom scraper rules for your client requisitions? We'll be there to lend a helping hand.
              </p>

              <div className="tf-customization-actions">
                <button 
                  type="button" 
                  onClick={() => isAuthenticated ? navigate('/ats') : setShowLoginModal(true)} 
                  className="tf-btn tf-btn-primary"
                >
                  Start now
                </button>
                <a href="#calculator" className="tf-btn tf-btn-outline">
                  Learn more
                </a>
              </div>
            </div>

            {/* Overlapping Perspective Mockup Cards */}
            <div className="tf-perspective-container">
              
              {/* Card 1: Overview Chart in Left Perspective */}
              <div className="tf-persp-card tf-persp-left">
                <div className="tf-persp-header">
                  <div className="tf-persp-dots">
                    <span className="dot-red" />
                    <span className="dot-yellow" />
                    <span className="dot-green" />
                  </div>
                  <span className="tf-persp-title">Overview Analytics</span>
                </div>
                <div className="tf-persp-content">
                  <div className="tf-mini-kpis-row">
                    <div className="tf-mini-kpi"><span>Unresolved</span><strong>60</strong></div>
                    <div className="tf-mini-kpi tf-active-kpi"><span>Overdue</span><strong>16</strong></div>
                    <div className="tf-mini-kpi"><span>Open</span><strong>43</strong></div>
                    <div className="tf-mini-kpi"><span>On hold</span><strong>64</strong></div>
                  </div>
                  <div className="tf-persp-chart-preview">
                    <svg viewBox="0 0 300 90" className="tf-mini-chart-svg">
                      <path d="M 10,70 Q 50,20 100,50 T 180,25 T 250,60 T 290,20" fill="none" stroke="#2563eb" strokeWidth="2.5" />
                      <circle cx="180" cy="25" r="3.5" fill="#2563eb" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 2: Tickets / Requisition Table in Right Perspective */}
              <div className="tf-persp-card tf-persp-right">
                <div className="tf-persp-header">
                  <div className="tf-persp-dots">
                    <span className="dot-red" />
                    <span className="dot-yellow" />
                    <span className="dot-green" />
                  </div>
                  <span className="tf-persp-title">All Requisition Candidates</span>
                </div>
                <div className="tf-persp-content">
                  <div className="tf-persp-row">
                    <span className="tf-persp-tag red">HIGH</span>
                    <span>Kranthi Kumar — NC DHHS AWS Dev</span>
                    <strong>$75/hr</strong>
                  </div>
                  <div className="tf-persp-row">
                    <span className="tf-persp-tag yellow">LOW</span>
                    <span>Sarah Jenkins — Cloud Lead</span>
                    <strong>$85/hr</strong>
                  </div>
                  <div className="tf-persp-row">
                    <span className="tf-persp-tag green">NORMAL</span>
                    <span>Robert Downey — DevOps</span>
                    <strong>$70/hr</strong>
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
                  <li><span className="check">✓</span> Basic Resume Skill Matching</li>
                  <li><span className="check">✓</span> 1 Active Job Scraper Pipeline</li>
                  <li><span className="check">✓</span> 1-Click JobsInHand Bot Pushes</li>
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
                  <li><span className="check">✓</span> <strong>Unlimited</strong> JobsInHand Bot Submissions</li>
                  <li><span className="check">✓</span> Multi-Role Recruiter Hierarchy (10 seats)</li>
                  <li><span className="check">✓</span> Biometric Liveness & Anti-Proxy Checks</li>
                  <li><span className="check">✓</span> Real-Time Audio Chimes & Cross-Client Sync</li>
                  <li><span className="check">✓</span> Direct Coolworks VMS Pipeline Sync</li>
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
                  <li><span className="check">✓</span> Unlimited Recruiters, Managers & Specialists</li>
                  <li><span className="check">✓</span> Custom EEO & Questionnaire Automation</li>
                  <li><span className="check">✓</span> Custom Scraper Pipelines & State Portals</li>
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
                Enter your recruiter or admin credentials to access your live ATS workspace.
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
                    placeholder="name@coolsofttech.com"
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
                    onClick={() => fillDemoCreds('omkesh@coolsofttech.com', 'admin')}
                    className="tf-chip"
                  >
                    👑 Omkesh (Super Admin)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => fillDemoCreds('kamal@coolsofttech.com', 'recruiter123')}
                    className="tf-chip"
                  >
                    💼 Sukamal (Recruiter)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => fillDemoCreds('gourav@coolsofttech.com', 'recruiter123')}
                    className="tf-chip"
                  >
                    🔍 Gourav (Sourcing)
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
           DASHBOARD MOCKUP (Screenshot 2: theFront Floating Dashboard Kit)
           ========================================================================= */
        .tf-hero-mockup-wrap {
          perspective: 1200px;
        }

        .tf-dashboard-mockup {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 
            0 25px 60px -15px rgba(15, 23, 42, 0.18),
            0 10px 25px -5px rgba(15, 23, 42, 0.08);
          display: grid;
          grid-template-columns: 140px 1fr;
          overflow: hidden;
          transition: transform 0.3s ease;
        }

        @media (max-width: 640px) {
          .tf-dashboard-mockup {
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
           SECTION 2: FEATURES GRID
           ========================================================================= */
        .tf-features-section {
          padding: 90px 0;
          background: #fafbfd;
          border-top: 1px solid #f1f5f9;
        }

        .tf-section-header {
          max-width: 680px;
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
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }

        .tf-feature-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 30px 26px;
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
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 10px 0;
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
           SECTION 3: TABLE SHOWCASE + 3 BIG NUMBERS (Screenshot 3)
           ========================================================================= */
        .tf-showcase-section {
          padding: 90px 0;
          background: #ffffff;
        }

        .tf-showcase-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 50px;
          align-items: center;
        }

        @media (max-width: 1024px) {
          .tf-showcase-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
        }

        .tf-table-mockup-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }

        .tf-table-head-bar {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tf-table-head-bar h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
        }

        .tf-table-head-actions {
          display: flex;
          gap: 8px;
        }

        .tf-mini-btn {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
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
          background: #fafbfd;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 10px 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .tf-mock-table tbody td {
          padding: 12px 16px;
          border-bottom: 1px solid #f8fafc;
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
          padding: 10px 16px;
          display: flex;
          justify-content: flex-end;
          gap: 20px;
          font-size: 10px;
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
           SECTION 4: SUPPORT TEAM & RECRUITER SUCCESS (Screenshot 4)
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
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 44px;
        }

        .tf-team-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px 16px;
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
        }

        /* =========================================================================
           SECTION 5: CUSTOMIZATION (Screenshot 5)
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

        /* Overlapping Perspective Cards */
        .tf-perspective-container {
          position: relative;
          max-width: 860px;
          margin: 28px auto 0;
          height: 270px;
        }

        @media (max-width: 768px) {
          .tf-perspective-container {
            height: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
        }

        .tf-persp-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.1);
          overflow: hidden;
        }

        .tf-persp-left {
          position: absolute;
          left: 0;
          top: 0;
          width: 58%;
          z-index: 2;
          transform: rotate(-1deg);
          transition: transform 0.3s ease;
        }

        .tf-persp-right {
          position: absolute;
          right: 0;
          top: 35px;
          width: 55%;
          z-index: 3;
          transform: rotate(1.5deg);
          transition: transform 0.3s ease;
        }

        @media (max-width: 768px) {
          .tf-persp-left, .tf-persp-right {
            position: static;
            width: 100%;
            transform: none;
          }
        }

        .tf-persp-header {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 10px 14px;
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

        .dot-red { background: #ff5f56; }
        .dot-yellow { background: #ffbd2e; }
        .dot-green { background: #27c93f; }

        .tf-persp-title {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
        }

        .tf-persp-content {
          padding: 16px;
        }

        .tf-mini-kpis-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .tf-mini-kpi {
          flex: 1;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px;
          text-align: center;
          display: flex;
          flex-direction: column;
        }

        .tf-mini-kpi span { font-size: 9px; color: #64748b; }
        .tf-mini-kpi strong { font-size: 13px; color: #0f172a; }

        .tf-active-kpi {
          border-color: #93c5fd;
          background: #eff6ff;
        }
        .tf-active-kpi strong { color: #2563eb; }

        .tf-persp-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          padding: 8px 0;
          border-bottom: 1px solid #f8fafc;
        }

        .tf-persp-tag {
          font-size: 8px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .tf-persp-tag.red { background: #fee2e2; color: #dc2626; }
        .tf-persp-tag.yellow { background: #fef3c7; color: #d97706; }
        .tf-persp-tag.green { background: #dcfce7; color: #16a34a; }

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
      `}</style>
    </SiteLayout>
  )
}

export default Homepage
