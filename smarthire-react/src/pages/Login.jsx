import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SiteLayout from '../components/SiteLayout'
import { loginWithGoogle, loginWithEmail } from '../lib/firebase'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isDemoSigningIn, setIsDemoSigningIn] = useState(false)
  const [authError, setAuthError] = useState('')

  const handleDemoSubmit = async (e) => {
    e.preventDefault()
    setIsDemoSigningIn(true)
    setAuthError('')

    try {
      const inputEmail = email.toLowerCase().trim()
      const inputPass = password.trim()

      // 1. Check local recruiters / employees list first (ensures newly added team members can log in immediately)
      const savedRecruitersRaw = localStorage.getItem('smarthire_recruiters')
      
      const defaultRecs = [
        { id: 'rec-1', name: 'Omkesh', email: 'omkesh@coolsofttech.com', role: 'superadmin', refCode: 'omkesh', company: 'SmartHire LLC', isActive: true, password: 'admin' },
        { id: 'rec-2', name: 'Sukamal Chatterjee', email: 'kamal@coolsofttech.com', role: 'recruiter', refCode: 'sukamal-chatterjee', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' },
        { id: 'rec-3', name: 'Raj', email: 'raj@coolsofttech.com', role: 'recruiter', refCode: 'raj', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' },
        { id: 'rec-4', name: 'Vaibhav Bisen', email: 'vaibhav@coolsofttech.com', role: 'recruiter', refCode: 'vaibhav-bisen', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' },
        { id: 'rec-5', name: 'Pankaj', email: 'pankajm@coolsofttech.com', role: 'recruiter', refCode: 'pankaj', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' },
        { id: 'emp-1', name: 'Rahul Sharma', email: 'rahul@coolsofttech.com', role: 'employee', parentRecruiterName: 'Vaibhav Bisen', refCode: 'rahul-sharma', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' },
        { id: 'emp-2', name: 'Priya Verma', email: 'priya@coolsofttech.com', role: 'employee', parentRecruiterName: 'Sukamal Chatterjee', refCode: 'priya-verma', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' }
      ]

      let recruitersList = defaultRecs
      if (savedRecruitersRaw) {
        try {
          const parsed = JSON.parse(savedRecruitersRaw)
          if (Array.isArray(parsed) && parsed.length > 0) {
            // merge in any missing default records
            const existingEmails = new Set(parsed.map(p => (p.email || '').toLowerCase().trim()))
            const missing = defaultRecs.filter(d => !existingEmails.has(d.email.toLowerCase().trim()))
            recruitersList = [...parsed, ...missing]
          }
        } catch (e) {}
      }

      // Validate credentials against local roster (Admin, Recruiters, and Employees)
      const matchedUser = recruitersList.find(
        r => (r.email || '').toLowerCase().trim() === inputEmail && (r.password || '').trim() === inputPass
      )

      if (matchedUser) {
        if (!matchedUser.isActive) {
          setAuthError('Your account has been deactivated. Please contact support.')
          setIsDemoSigningIn(false)
          return
        }

        // Update last active login time in localStorage
        matchedUser.lastLogin = new Date().toISOString()
        const updatedRecruiters = recruitersList.map(r => r.id === matchedUser.id ? matchedUser : r)
        localStorage.setItem('smarthire_recruiters', JSON.stringify(updatedRecruiters))

        // Set session
        localStorage.setItem('smarthire_authenticated', 'true')
        localStorage.setItem('smarthire_user', JSON.stringify({
          uid: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          role: matchedUser.role,
          parentRecruiterName: matchedUser.parentRecruiterName || '',
          refCode: matchedUser.refCode || matchedUser.name.toLowerCase().replace(/\s+/g, '-'),
          company: matchedUser.company || 'SmartHire LLC'
        }))
        localStorage.setItem('smarthire_active_role', matchedUser.role)
        localStorage.setItem('smarthire_token', 'mock-token-' + matchedUser.id)

        window.location.href = '/ats'
        return
      }

      // 2. Secondary: If not found in local team roster, attempt backend API login
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: inputEmail, password: inputPass })
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
            parentRecruiterName: u.parentRecruiterName || '',
            refCode: u.refCode || u.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            company: u.company || 'SmartHire LLC'
          }))
          localStorage.setItem('smarthire_active_role', u.role)
          localStorage.setItem('smarthire_token', data.token || 'mock-token-' + u.id)

          // Save to local recruiters list if not already present
          try {
            const raw = localStorage.getItem('smarthire_recruiters')
            const list = raw ? JSON.parse(raw) : []
            if (Array.isArray(list) && !list.some(r => (r.email || '').toLowerCase().trim() === inputEmail)) {
              list.push({ ...u, isActive: true, password: inputPass })
              localStorage.setItem('smarthire_recruiters', JSON.stringify(list))
            }
          } catch (e) {}

          window.location.href = '/ats'
          return
        } else if (data.message) {
          setAuthError(data.message)
          return
        }
      } catch (backendErr) {
        console.warn('Backend login connection attempt failed:', backendErr.message)
      }

      // 3. If neither matched
      setAuthError('Invalid email or password. Please check your credentials.')
    } catch (err) {
      setAuthError('Login error: ' + err.message)
    } finally {
      setIsDemoSigningIn(false)
    }
  }

  return (
    <SiteLayout>
      <section className="login-section">
        <div className="login-container">
          <div className="login-split-card">
            {/* Left Panel: Form */}
            <div className="login-form-pane">
              <div className="login-header-block">
                <span className="login-eyebrow">Enterprise Access</span>
                <h1 className="login-main-title">Sign in to Platform</h1>
                <p className="login-subtitle">Enter your corporate credentials to access your workspace.</p>
              </div>

              {authError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontSize: '13px', marginBottom: '16px' }}>
                  ⚠️ {authError}
                </div>
              )}




              {/* Form Input elements */}
              <form className="login-form" onSubmit={handleDemoSubmit}>
                <div className="login-group">
                  <label htmlFor="login-email">Corporate Email</label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="login-group">
                  <div className="password-label-row">
                    <label htmlFor="login-password">Password</label>
                    <a href="#forgot" className="forgot-link" onClick={() => alert('Password reset is a demo flow.')}>Forgot Password?</a>
                  </div>
                  <div className="password-input-wrapper">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle-eye"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                {/* Keep Signed In */}
                <div className="login-options-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isDemoSigningIn}
                  className="btn login-submit-btn"
                >
                  {isDemoSigningIn ? 'Securing Session...' : 'Sign In to Workspace'}
                </button>
              </form>
            </div>

            {/* Right Panel: Testimonial & Graphics */}
            <div className="login-visual-pane">
              <div className="gradient-glow-overlay" />
              <div className="visual-pane-content">
                <div className="platform-icon-shield">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="m9 11 2 2 4-4"/>
                  </svg>
                </div>

                <h2 className="visual-title">Verify Candidates with Absolute Confidence</h2>
                <p className="visual-desc">
                  Automate candidate background screening, verify professional records safely, and manage content pipelines.
                </p>

                {/* Benefits List */}
                <ul className="visual-benefits-list">
                  <li>
                    <span className="check-bullet">✓</span>
                    <span>AI-Powered Resume Matching</span>
                  </li>
                  <li>
                    <span className="check-bullet">✓</span>
                    <span>Automated B2B Content Strategy</span>
                  </li>
                  <li>
                    <span className="check-bullet">✓</span>
                    <span>Real-time Cron Worker Verification</span>
                  </li>
                </ul>

                {/* Mini testimonial block */}
                <div className="visual-testimonial-card">
                  <p className="testimonial-text">
                    "VerifyHire has simplified our background screening and marketing automation pipelines into a single high-performance dashboard."
                  </p>
                  <div className="testimonial-author">
                    <span className="author-name">Anjali Sharma</span>
                    <span className="author-title">VP of Operations, Praximind Pvt Ltd</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Premium Styles Scoped to Login Screen */}
      <style>{`
        .login-section {
          padding: 80px 0;
          display: grid;
          place-items: center;
          min-height: calc(100vh - 72px);
        }
        .login-container {
          width: min(1040px, 94%);
          margin: 0 auto;
        }
        .login-split-card {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(18, 39, 35, 0.08);
          min-height: 600px;
        }
        @media (max-width: 850px) {
          .login-split-card {
            grid-template-columns: 1fr;
          }
          .login-visual-pane {
            display: none;
          }
        }

        /* Left Form Pane */
        .login-form-pane {
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        @media (max-width: 480px) {
          .login-form-pane {
            padding: 30px 20px;
          }
        }
        .login-header-block {
          margin-bottom: 28px;
        }
        .login-eyebrow {
          color: var(--brand);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
          display: block;
          margin-bottom: 6px;
        }
        .login-main-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 32px;
          font-weight: 800;
          margin: 0 0 8px;
          color: var(--ink);
          letter-spacing: -0.02em;
        }
        .login-subtitle {
          color: var(--ink-soft);
          font-size: 14px;
          margin: 0;
          line-height: 1.4;
        }

        /* Social Auth Button Row */
        .social-auth-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }
        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 10px;
          font-weight: 600;
          font-size: 13.5px;
          cursor: pointer;
          color: var(--ink);
          transition: all 0.2s ease;
        }
        .social-btn:hover {
          background: var(--bg);
          border-color: var(--ink-soft);
        }

        .auth-divider {
          text-align: center;
          position: relative;
          margin-bottom: 24px;
        }
        .auth-divider::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 1px;
          background: var(--line);
          z-index: 1;
        }
        .auth-divider span {
          background: var(--surface);
          padding: 0 12px;
          font-size: 12px;
          color: var(--ink-soft);
          position: relative;
          z-index: 2;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        /* Form styling */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .login-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .login-group label {
          font-size: 13px;
          font-weight: 700;
          color: var(--ink);
        }
        .login-group input {
          border: 1px solid var(--line);
          border-radius: 10px;
          background: var(--surface);
          padding: 12px;
          font-size: 14px;
          font-family: inherit;
          color: var(--ink);
          transition: all 0.2s ease;
        }
        .login-group input:focus {
          outline: none;
          border-color: var(--brand);
          box-shadow: 0 0 0 3px rgba(18, 106, 90, 0.15);
        }
        
        .password-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .forgot-link {
          font-size: 12.5px;
          color: var(--brand);
          font-weight: 600;
        }
        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .password-input-wrapper input {
          width: 100%;
          padding-right: 44px;
        }
        .password-toggle-eye {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          display: grid;
          place-items: center;
          color: var(--ink-soft);
        }

        .login-options-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2px;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13.5px;
          color: var(--ink-soft);
          font-weight: 500;
        }
        .checkbox-label input {
          cursor: pointer;
          width: 16px;
          height: 16px;
          accent-color: var(--brand);
        }

        .login-submit-btn {
          border: none;
          border-radius: 10px;
          padding: 14px;
          background: linear-gradient(130deg, var(--brand), #1f8a75);
          color: white;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(18, 106, 90, 0.2);
          transition: all 0.2s ease;
          margin-top: 6px;
        }
        .login-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(18, 106, 90, 0.3);
        }
        .login-submit-btn:disabled {
          background: var(--line);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Right Visual Pane */
        .login-visual-pane {
          background: linear-gradient(145deg, #0f2b26, #16433a);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px;
          color: white;
        }
        .gradient-glow-overlay {
          position: absolute;
          top: -20%;
          right: -20%;
          width: 80%;
          height: 80%;
          background: radial-gradient(circle, rgba(219, 127, 53, 0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .visual-pane-content {
          position: relative;
          z-index: 2;
        }
        .platform-icon-shield {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: grid;
          place-items: center;
          color: #db7f35;
          margin-bottom: 24px;
          padding: 10px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }
        .visual-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 12px;
          line-height: 1.25;
          letter-spacing: -0.01em;
          background: linear-gradient(120deg, #ffffff, #e2e8f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .visual-desc {
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.5;
          margin: 0 0 24px;
        }
        .visual-benefits-list {
          list-style: none;
          padding: 0;
          margin: 0 0 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .visual-benefits-list li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13.5px;
          font-weight: 600;
          color: #e2e8f0;
        }
        .check-bullet {
          color: #38bdf8;
          font-weight: bold;
        }
        .visual-testimonial-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(10px);
        }
        .testimonial-text {
          font-style: italic;
          font-size: 13px;
          line-height: 1.5;
          color: #cbd5e1;
          margin: 0 0 12px;
        }
        .testimonial-author {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .author-name {
          font-size: 12.5px;
          font-weight: 700;
          color: white;
        }
        .author-title {
          font-size: 11px;
          color: #94a3b8;
        }
      `}</style>
    </SiteLayout>
  )
}

export default Login
