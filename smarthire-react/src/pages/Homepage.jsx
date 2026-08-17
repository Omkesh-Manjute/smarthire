import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SiteLayout from '../components/SiteLayout'
import { loginWithGoogle } from '../lib/firebase'

const highlights = [
  { 
    title: 'Location Validation', 
    text: 'Cross-check claimed candidate locations against high-fidelity GPS, IP subnet intelligence, and cellular network telemetry.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    color: 'emerald'
  },
  { 
    title: 'Biometric Identity Flow', 
    text: 'Seamless candidate onboarding with real-time selfie liveness checks, official ID document validation, and video consent logging.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
    color: 'orange'
  },
  { 
    title: 'Explainable Trust Scoring', 
    text: 'Transparent, criteria-based confidence ratings that help recruiting teams represent candidates with complete confidence.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    color: 'teal'
  },
]

const plans = [
  {
    name: 'Recruiter Starter',
    priceMonthly: 99,
    priceYearly: 79,
    description: 'Ideal for independent recruiters & small staffing agencies starting out.',
    features: [
      '50 AI Pre-Screening Chats / mo',
      'Basic Resume Match Scoring',
      '1 Active Scraped Job Pipeline',
      'Standard Email Support',
      'Secure Database Storage'
    ],
    cta: 'Start Starter Trial',
    popular: false
  },
  {
    name: 'Talent Growth',
    priceMonthly: 249,
    priceYearly: 199,
    description: 'Perfect for growing recruitment firms needing candidate verification.',
    features: [
      '300 AI Pre-Screening Chats / mo',
      'Advanced AI Profile Matching',
      '5 Active Job Scraper Pipelines',
      'Vision AI Document Verifications',
      'Priority SLA Email Support',
      'Full CSV & Reports Export'
    ],
    cta: 'Start Growth Trial',
    popular: true
  },
  {
    name: 'Enterprise Scale',
    priceMonthly: 599,
    priceYearly: 479,
    description: 'Built for high-volume corporate HR and enterprise recruitment departments.',
    features: [
      'Unlimited AI Pre-Screening Chats',
      'Custom Pre-Screening Questions',
      'Unlimited Job Pipelines',
      'High-Volume Document Scanning',
      'Dedicated Success Manager',
      'Custom API Access & Webhooks'
    ],
    cta: 'Contact Sales',
    popular: false
  }
]

function Homepage() {
  const navigate = useNavigate()
  const isAuthenticated = localStorage.getItem('smarthire_authenticated') === 'true' || localStorage.getItem('verifyhire_authenticated') === 'true'
  
  // Login Form States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Pricing Toggle State
  const [isYearly, setIsYearly] = useState(false)

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setErrorMessage('')
    
    try {
      // 1. Load users from localStorage (or fallback to DEFAULT_RECRUITERS if empty)
      const savedRecruitersRaw = localStorage.getItem('smarthire_recruiters')
      
      const defaultRecs = [
        { id: 'rec-1', name: 'Omkesh', email: 'omkesh@coolsofttech.com', role: 'superadmin', refCode: 'omkesh', company: 'Coolsoft LLC', isActive: true, password: 'admin' },
        { id: 'rec-2', name: 'Sukamal Chatterjee', email: 'kamal@coolsofttech.com', role: 'recruiter', refCode: 'sukamal-chatterjee', company: 'Coolsoft LLC', isActive: true, password: 'recruiter123' },
        { id: 'rec-3', name: 'Raj', email: 'raj@coolsofttech.com', role: 'recruiter', refCode: 'raj', company: 'Coolsoft LLC', isActive: true, password: 'recruiter123' },
        { id: 'rec-4', name: 'Vaibhav Bisen', email: 'vaibhav@coolsofttech.com', role: 'recruiter', refCode: 'vaibhav-bisen', company: 'Coolsoft LLC', isActive: true, password: 'recruiter123' },
        { id: 'rec-5', name: 'Pankaj', email: 'pankajm@coolsofttech.com', role: 'recruiter', refCode: 'pankaj', company: 'Coolsoft LLC', isActive: true, password: 'recruiter123' }
      ]

      let recruitersList = defaultRecs
      if (savedRecruitersRaw) {
        try {
          recruitersList = JSON.parse(savedRecruitersRaw)
        } catch (e) {}
      } else {
        localStorage.setItem('smarthire_recruiters', JSON.stringify(defaultRecs))
      }

      // 2. Validate credentials
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

      // Update last active login time
      matchedUser.lastLogin = new Date().toISOString()
      const updatedRecruiters = recruitersList.map(r => r.id === matchedUser.id ? matchedUser : r)
      localStorage.setItem('smarthire_recruiters', JSON.stringify(updatedRecruiters))

      // 3. Set session
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

      window.location.href = '/ats'
    } catch (err) {
      setErrorMessage('Login error: ' + err.message)
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <SiteLayout>
      <section className="homepage-hero">
        <div className="container hero-grid">
          <div className="hero-text-block">
            <div className="floating-badge">
              <span className="badge-dot"></span>
              <span>SmartHire Enterprise v2.0 Active</span>
            </div>
            <p className="eyebrow" style={{ color: 'var(--brand)', letterSpacing: '0.15em', fontWeight: 800 }}>AI RECRUITMENT & TALENT MANAGEMENT</p>
            <h1 className="hero-headline">Refined Vetting for High-Stakes Teams.</h1>
            <p className="lead">
              Verify credentials, automate technical skill matching, and manage candidates in one unified command center. Engineered for state-of-the-art recruitment.
            </p>
            {isAuthenticated ? (
              <div className="actions">
                <Link to="/ats" className="btn btn-primary-hero">Open ATS Console →</Link>
                <Link to="/ats" className="btn btn-ghost">Explore AI Recruiter ATS</Link>
              </div>
            ) : (
              <div className="actions">
                <a href="#login" className="btn btn-primary-hero">Sign In to Workspace →</a>
                <a href="#pricing" className="btn btn-ghost">View Pricing</a>
              </div>
            )}
          </div>
          
          {/* Right column: Interactive Login Form or Console Telemetry */}
          {isAuthenticated ? (
            <div className="hero-visual-card shadow-premium">
              <div className="glass-header">
                <div className="glass-dots">
                  <span className="dot-red"></span>
                  <span className="dot-yellow"></span>
                  <span className="dot-green"></span>
                </div>
                <span className="glass-title">smarthire_command_hub</span>
              </div>
              <div className="glass-body">
                <div className="metric-row-main">
                  <span className="metric-label-big">Verification Completion</span>
                  <span className="metric-value-big">94.8%</span>
                </div>
                <div className="metric-indicator-bar">
                  <div className="indicator-progress" style={{ width: '94.8%' }}></div>
                </div>

                <ul className="snapshot-checklist">
                  <li>
                    <span className="snap-check">✓</span>
                    <span>Average completion time: <strong>under 3m</strong></span>
                  </li>
                  <li>
                    <span className="snap-check">✓</span>
                    <span>Liveness face verification rate: <strong>99.1%</strong></span>
                  </li>
                  <li>
                    <span className="snap-check">✓</span>
                    <span>Active candidates tracked: <strong>1,284</strong></span>
                  </li>
                </ul>

                <div className="developer-tag">
                  <code>ENV: enterprise_active_mode</code>
                </div>
              </div>
            </div>
          ) : (
            <div className="login-card-embedded shadow-premium" id="login">
              <div className="login-card-header">
                <h3>Recruiter Portal Login</h3>
                <p>Sign in using corporate admin credentials to manage verification pipelines.</p>
              </div>
              
              {errorMessage && (
                <div className="login-error-pill">
                  ⚠️ {errorMessage}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="login-form-embedded">
                <div className="form-field">
                  <label>Corporate Email</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="name@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>Password</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                


                <button type="submit" className="btn btn-login-submit" disabled={isLoggingIn}>
                  {isLoggingIn ? 'Verifying Credentials...' : 'Sign In to ATS Console →'}
                </button>


              </form>
            </div>
          )}
        </div>
      </section>

      {/* AI Recruitment Details & Core Features */}
      <section className="homepage-highlights" id="features">
        <div className="container">
          <div className="section-head-home">
            <span className="eyebrow">INTELLIGENT AUTOMATION</span>
            <h2>How SmartHire Automates Recruiter Workflows</h2>
            <p className="pricing-subtitle" style={{ maxWidth: 680, margin: '10px auto 0' }}>
              Cut down screening overhead by 80%. Our state-aware AI recruiter does the heavy lifting, checking required skills and credentials instantly.
            </p>
          </div>
          
          <div className="recruiter-benefits-grid">
            <article className="benefit-card">
              <div className="benefit-icon">🤖</div>
              <h3>State-Aware AI Chatbot</h3>
              <p>
                Our screening bot guides candidates dynamically. It matches mandatory required skills first, negotiates rate rates, and rejects unqualified candidates instantly.
              </p>
            </article>

            <article className="benefit-card">
              <div className="benefit-icon">🔍</div>
              <h3>Anti-Proxy Identity Checks</h3>
              <p>
                Detect candidate substitution using webcam snapshot matching, work visa compliance checks, and cellular location verification.
              </p>
            </article>

            <article className="benefit-card">
              <div className="benefit-icon">📊</div>
              <h3>Central ATS Dashboard</h3>
              <p>
                Manage job vacancies, track candidate match scores, review candidate passport/visa attachments, and analyze LinkedIn matching reports.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Embedded Pricing Section */}
      <section className="pricing-embedded-section" id="pricing">
        <div className="container">
          <div className="pricing-header-block text-center">
            <span className="pricing-eyebrow">PREMIUM ENTERPRISE PLANS</span>
            <h2 className="pricing-title" style={{ fontSize: 32 }}>Transparent pricing built for scale</h2>
            <p className="pricing-subtitle">
              Choose the package that aligns with your company recruiting velocity.
            </p>

            {/* Toggle */}
            <div className="billing-toggle-wrap">
              <span className={!isYearly ? 'active-period' : ''}>Monthly</span>
              <button 
                type="button" 
                className="toggle-switch-btn" 
                onClick={() => setIsYearly(!isYearly)}
                aria-label="Toggle Billing Period"
              >
                <span className={`switch-slider ${isYearly ? 'yearly-pos' : ''}`} />
              </button>
              <span className={isYearly ? 'active-period' : ''}>
                Yearly <span className="discount-badge">Save 20%</span>
              </span>
            </div>
          </div>

          <div className="plans-grid">
            {plans.map((plan, index) => {
              const currentPrice = isYearly ? plan.priceYearly : plan.priceMonthly
              return (
                <div key={index} className={`plan-card ${plan.popular ? 'popular-card' : ''}`}>
                  {plan.popular && <div className="popular-ribbon">Most Popular</div>}
                  <div className="plan-card-header">
                    <h3 className="plan-name">{plan.name}</h3>
                    <p className="plan-desc">{plan.description}</p>
                    <div className="price-display">
                      <span className="currency">$</span>
                      <span className="price-value">{currentPrice}</span>
                      <span className="billing-period">/month</span>
                    </div>
                    {isYearly && <span className="yearly-disclaimer">Billed annually (${currentPrice * 12}/yr)</span>}
                  </div>

                  <div className="plan-divider" />

                  <div className="plan-card-body">
                    <ul className="features-list">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx}>
                          <span className="feat-check">✓</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="plan-card-footer">
                    <button 
                      type="button" 
                      className={`btn plan-cta-btn ${plan.popular ? 'popular-cta' : 'flat-cta'}`}
                      onClick={() => alert(`Redirecting to registration for ${plan.name}...`)}
                    >
                      {plan.cta}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Embedded CSS styling for Homepage */}
      <style>{`
        .homepage-hero {
          padding: 96px 0 72px;
          position: relative;
          background: linear-gradient(180deg, var(--bg) 0%, rgba(18, 106, 90, 0.02) 100%);
        }
        .hero-text-block {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .floating-badge {
          background: rgba(18, 106, 90, 0.08);
          border: 1px solid rgba(18, 106, 90, 0.18);
          color: var(--brand);
          border-radius: 99px;
          padding: 6px 14px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 20px;
        }
        .badge-dot {
          width: 6px;
          height: 6px;
          background: #10b981;
          border-radius: 50%;
          animation: statusPulse 1.8s infinite ease-in-out;
        }
        .hero-headline {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(34px, 5vw, 54px);
          line-height: 1.1;
          letter-spacing: -0.02em;
          font-weight: 800;
          color: var(--ink);
          margin-bottom: 16px;
        }
        .btn-primary-hero {
          background: linear-gradient(135deg, var(--brand), #1b5347);
          box-shadow: 0 4px 14px rgba(18, 106, 90, 0.25);
          transition: all 0.2s ease;
          color: white;
          font-weight: 700;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
        }
        .btn-primary-hero:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 8px 20px rgba(18, 106, 90, 0.35);
        }

        /* Login Card Embedded styling */
        .login-card-embedded {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 36px 30px;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: fadeIn 0.4s ease-out;
        }
        .login-card-header h3 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: var(--ink);
          margin: 0 0 6px 0;
        }
        .login-card-header p {
          font-size: 13px;
          color: var(--ink-soft);
          line-height: 1.4;
          margin: 0;
        }
        .login-form-embedded {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-field label {
          font-size: 12px;
          font-weight: 700;
          color: var(--ink);
        }
        .form-field input {
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--surface);
          padding: 10px 12px;
          font-size: 14px;
          color: var(--ink);
          font-family: inherit;
          transition: border-color 0.2s ease;
        }
        .form-field input:focus {
          outline: none;
          border-color: var(--brand);
        }
        .demo-tip-pill {
          background: rgba(18, 106, 90, 0.05);
          border: 1px solid rgba(18, 106, 90, 0.12);
          padding: 10px;
          border-radius: 6px;
          font-size: 12px;
          color: var(--brand);
        }
        .btn-login-submit {
          border: none;
          background: linear-gradient(130deg, var(--brand), #1b5347);
          color: white;
          font-weight: 700;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          box-shadow: 0 4px 10px rgba(18, 106, 90, 0.15);
          transition: all 0.2s ease;
        }
        .btn-login-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(18, 106, 90, 0.25);
        }
        .login-error-pill {
          background: rgba(181, 71, 79, 0.08);
          border: 1px solid rgba(181, 71, 79, 0.2);
          color: var(--danger);
          padding: 10px;
          border-radius: 8px;
          font-size: 12px;
        }

        /* Glassmorphic Card Mockup */
        .hero-visual-card {
          background: rgba(255, 253, 248, 0.7);
          border: 1px solid var(--line);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          padding: 0;
          box-shadow: 0 20px 40px rgba(18, 39, 35, 0.06);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .glass-header {
          background: rgba(239, 229, 210, 0.5);
          border-bottom: 1px solid var(--line);
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .glass-dots {
          display: flex;
          gap: 6px;
        }
        .glass-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .dot-red { background: #ff5f56; }
        .dot-yellow { background: #ffbd2e; }
        .dot-green { background: #27c93f; }
        .glass-title {
          font-family: monospace;
          font-size: 11px;
          color: var(--ink-soft);
          font-weight: 700;
        }
        .glass-body {
          padding: 24px;
        }
        .metric-row-main {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 10px;
        }
        .metric-label-big {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--ink-soft);
          font-weight: 700;
        }
        .metric-value-big {
          font-size: 32px;
          font-weight: 800;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: var(--brand);
        }
        .metric-indicator-bar {
          width: 100%;
          height: 8px;
          background: var(--surface-2);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .indicator-progress {
          height: 100%;
          background: linear-gradient(90deg, var(--brand), #27ae60);
          border-radius: 10px;
        }
        .snapshot-checklist {
          list-style: none;
          padding: 0;
          margin: 0 0 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .snapshot-checklist li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: var(--ink);
        }
        .snap-check {
          color: var(--brand);
          font-weight: 800;
          font-size: 15px;
        }
        .developer-tag {
          background: rgba(18, 106, 90, 0.06);
          border: 1px solid rgba(18, 106, 90, 0.12);
          border-radius: 6px;
          padding: 6px 12px;
          display: inline-block;
        }
        .developer-tag code {
          color: var(--brand);
          font-size: 11px;
        }

        /* Recruiter Benefits Grid */
        .recruiter-benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-top: 40px;
        }
        .benefit-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
          transition: all 0.2s ease;
        }
        .benefit-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(18, 106, 90, 0.05);
          border-color: rgba(18, 106, 90, 0.15);
        }
        .benefit-icon {
          font-size: 32px;
          margin-bottom: 16px;
        }
        .benefit-card h3 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: var(--ink);
          margin: 0 0 10px 0;
        }
        .benefit-card p {
          font-size: 13.5px;
          color: var(--ink-soft);
          line-height: 1.5;
          margin: 0;
        }

        /* Pricing Section */
        .pricing-embedded-section {
          padding: 80px 0;
          border-top: 1px solid var(--line);
          background: linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%);
        }
        .pricing-header-block {
          max-width: 720px;
          margin: 0 auto 50px;
        }
        .pricing-eyebrow {
          color: var(--brand);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          display: block;
          margin-bottom: 12px;
        }
        .pricing-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 38px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--ink);
          margin: 0 0 16px;
        }
        .pricing-subtitle {
          font-size: 15px;
          color: var(--ink-soft);
          line-height: 1.5;
          margin: 0;
        }
        .text-center {
          text-align: center;
        }

        .billing-toggle-wrap {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-top: 30px;
          padding: 6px 12px;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 30px;
        }
        .billing-toggle-wrap span {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--ink-soft);
          transition: color 0.2s ease;
        }
        .billing-toggle-wrap span.active-period {
          color: var(--ink);
        }
        .toggle-switch-btn {
          width: 44px;
          height: 24px;
          background: var(--brand);
          border: none;
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          padding: 0;
        }
        .switch-slider {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .yearly-pos {
          transform: translateX(20px);
        }
        .discount-badge {
          background: rgba(219, 127, 53, 0.15);
          color: #db7f35;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 20px;
          margin-left: 4px;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
          gap: 28px;
          align-items: stretch;
        }
        .plan-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 40px 30px;
          position: relative;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
          transition: all 0.25s ease;
        }
        .plan-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(18, 106, 90, 0.06);
          border-color: rgba(18, 106, 90, 0.25);
        }
        .popular-card {
          border-color: var(--brand);
          box-shadow: 0 20px 40px rgba(18, 106, 90, 0.08);
          background: linear-gradient(180deg, var(--surface) 0%, rgba(18, 106, 90, 0.01) 100%);
        }
        .popular-ribbon {
          position: absolute;
          top: 15px;
          right: 15px;
          background: var(--brand);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .plan-card-header {
          margin-bottom: 24px;
        }
        .plan-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: var(--ink);
          margin: 0 0 10px;
        }
        .plan-desc {
          font-size: 13px;
          color: var(--ink-soft);
          line-height: 1.4;
          margin: 0 0 20px;
          min-height: 38px;
        }
        .price-display {
          display: flex;
          align-items: baseline;
          color: var(--ink);
        }
        .currency {
          font-size: 20px;
          font-weight: 700;
          margin-right: 2px;
        }
        .price-value {
          font-size: 42px;
          font-weight: 800;
          letter-spacing: -0.03em;
        }
        .billing-period {
          font-size: 13px;
          color: var(--ink-soft);
          font-weight: 500;
          margin-left: 4px;
        }
        .yearly-disclaimer {
          display: block;
          font-size: 11px;
          color: #db7f35;
          font-weight: 600;
          margin-top: 6px;
        }
        .plan-divider {
          height: 1px;
          background: var(--line);
          margin-bottom: 24px;
        }
        .plan-card-body {
          flex-grow: 1;
          margin-bottom: 30px;
        }
        .features-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .features-list li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: var(--ink);
          line-height: 1.4;
        }
        .feat-check {
          color: var(--brand);
          font-weight: bold;
          font-size: 14px;
        }
        .plan-cta-btn {
          width: 100%;
          border: none;
          border-radius: 10px;
          padding: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .popular-cta {
          background: linear-gradient(130deg, var(--brand), #1f8a75);
          color: white;
          box-shadow: 0 4px 12px rgba(18, 106, 90, 0.2);
        }
        .popular-cta:hover {
          box-shadow: 0 8px 18px rgba(18, 106, 90, 0.3);
          transform: translateY(-1px);
        }
        .flat-cta {
          background: var(--surface);
          border: 1px solid var(--line);
          color: var(--ink);
        }
        .flat-cta:hover {
          background: var(--bg);
          border-color: var(--ink-soft);
        }

        /* General Features highlights */
        .homepage-highlights {
          padding: 80px 0;
          border-top: 1px solid var(--line);
        }
        .section-head-home {
          text-align: center;
          margin-bottom: 48px;
        }
        .section-head-home h2 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 32px;
          font-weight: 800;
          margin: 8px 0 0;
          color: var(--ink);
          letter-spacing: -0.02em;
        }
      `}</style>
    </SiteLayout>
  )
}

export default Homepage
