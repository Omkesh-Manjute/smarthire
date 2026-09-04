import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SiteLayout from '../components/SiteLayout'
import { loginWithGoogle, loginWithEmail, resetPasswordWithEmail } from '../lib/firebase'
import { getUserProfileByEmailFirestore } from '../lib/atsFirestore'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isDemoSigningIn, setIsDemoSigningIn] = useState(false)
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false)
  const [authError, setAuthError] = useState('')

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStatus, setForgotStatus] = useState({ loading: false, msg: '', error: false })

  const defaultRecs = [
    { id: 'rec-1', name: 'Omkesh', email: 'omkesh@coolsofttech.com', role: 'superadmin', refCode: 'omkesh', company: 'SmartHire', isActive: true },
    { id: 'rec-1b', name: 'Omkesh Manjute', email: 'omkesh.manjute@smarthire.com', role: 'superadmin', refCode: 'omkesh', company: 'SmartHire', isActive: true },
    { id: 'rec-2', name: 'Sukamal Chatterjee', email: 'kamal@coolsofttech.com', role: 'recruiter', refCode: 'sukamal-chatterjee', company: 'SmartHire', isActive: true },
    { id: 'rec-3', name: 'Gourav', email: 'gourav@coolsofttech.com', role: 'recruiter', refCode: 'gourav', parentRecruiterName: 'Omkesh', company: 'SmartHire', isActive: true },
    { id: 'rec-4', name: 'Vaibhav Bisen', email: 'vaibhav@coolsofttech.com', role: 'recruiter', refCode: 'vaibhav-bisen', company: 'SmartHire', isActive: true },
    { id: 'rec-5', name: 'Pankaj', email: 'pankajm@coolsofttech.com', role: 'recruiter', refCode: 'pankaj', company: 'SmartHire', isActive: true },
    { id: 'mgr-1', name: 'Alok Manager', email: 'manager@coolsofttech.com', role: 'manager', refCode: 'alok-manager', company: 'SmartHire', isActive: true },
    { id: 'emp-1', name: 'Naveen Bhardwaj', email: 'naveen@coolsofttech.com', role: 'employee', parentRecruiterName: 'Sukamal Chatterjee', refCode: 'naveen-bhardwaj', company: 'SmartHire', isActive: true },
    { id: 'emp-2', name: 'Rahul Sharma', email: 'rahul@coolsofttech.com', role: 'employee', parentRecruiterName: 'Vaibhav Bisen', refCode: 'rahul-sharma', company: 'SmartHire', isActive: true },
    { id: 'emp-3', name: 'Priya Verma', email: 'priya@coolsofttech.com', role: 'employee', parentRecruiterName: 'Sukamal Chatterjee', refCode: 'priya-verma', company: 'SmartHire', isActive: true }
  ]

  // Pre-sync all active team members from the backend server into localStorage on mount
  useEffect(() => {
    fetch('/api/admin/recruiters')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.recruiters) && data.recruiters.length > 0) {
          const serverRecs = data.recruiters
          try {
            const raw = localStorage.getItem('smarthire_recruiters')
            const local = raw ? JSON.parse(raw) : []
            const existingEmails = new Set(serverRecs.map(u => (u.email || '').toLowerCase().trim()))
            const localOnly = Array.isArray(local) ? local.filter(u => !existingEmails.has((u.email || '').toLowerCase().trim())) : []
            const merged = [...serverRecs, ...localOnly]
            localStorage.setItem('smarthire_recruiters', JSON.stringify(merged))
          } catch (e) {}
        }
      })
      .catch(() => {})
  }, [])

  const setLoginSession = (u, token = '') => {
    const userPayload = {
      uid: u.id || u._id || 'user-' + Date.now(),
      name: u.name,
      email: u.email,
      role: u.role,
      parentRecruiterName: u.parentRecruiterName || '',
      refCode: u.refCode || (u.name ? u.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'user'),
      company: u.company || 'SmartHire'
    }

    localStorage.setItem('smarthire_authenticated', 'true')
    localStorage.setItem('verifyhire_authenticated', 'true')
    localStorage.setItem('smarthire_user', JSON.stringify(userPayload))
    localStorage.setItem('verifyhire_user', JSON.stringify(userPayload))
    localStorage.setItem('smarthire_active_role', u.role)
    localStorage.setItem('smarthire_token', token || ('mock-token-' + (u.id || u._id || 'session')))

    window.location.href = '/dashboard'
  }

  // Google OAuth 1-Click Sign-In
  const handleGoogleSignIn = async () => {
    setIsGoogleSigningIn(true)
    setAuthError('')
    try {
      const gUser = await loginWithGoogle()
      const emailClean = (gUser.email || '').toLowerCase().trim()

      // Look up user role and hierarchy from Firestore or team roster
      const firestoreUser = await getUserProfileByEmailFirestore(emailClean)
      let matched = firestoreUser
      if (!matched) {
        const raw = localStorage.getItem('smarthire_recruiters')
        const list = raw ? JSON.parse(raw) : []
        matched = list.find(r => (r.email || '').toLowerCase().trim() === emailClean)
      }
      if (!matched) {
        matched = defaultRecs.find(d => (d.email || '').toLowerCase().trim() === emailClean)
      }

      const userProfile = {
        id: matched?.id || matched?._id || gUser.uid,
        name: matched?.name || gUser.name || emailClean.split('@')[0],
        email: emailClean,
        role: matched?.role || (emailClean === 'omkesh@coolsofttech.com' ? 'superadmin' : 'recruiter'),
        parentRecruiterName: matched?.parentRecruiterName || '',
        refCode: matched?.refCode || emailClean.split('@')[0],
        company: matched?.company || 'SmartHire'
      }

      setLoginSession(userProfile, gUser.idToken)
    } catch (err) {
      console.warn('Google sign-in error:', err)
      setAuthError(err.code === 'auth/popup-closed-by-user' ? 'Google sign-in popup was closed.' : (err.message || 'Google sign-in failed.'))
    } finally {
      setIsGoogleSigningIn(false)
    }
  }

  // Handle Forgot Password Email Reset Link
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault()
    const cleanForgotEmail = String(forgotEmail || '').toLowerCase().trim()
    if (!cleanForgotEmail) {
      setForgotStatus({ loading: false, msg: 'Please enter your corporate email address.', error: true })
      return
    }

    setForgotStatus({ loading: true, msg: 'Sending secure password reset link...', error: false })
    try {
      await resetPasswordWithEmail(cleanForgotEmail)
      setForgotStatus({
        loading: false,
        msg: `✅ Password reset email sent to ${cleanForgotEmail}! Please check your inbox and spam folder.`,
        error: false
      })
    } catch (err) {
      console.warn('Reset password error:', err)
      let msg = 'Failed to send reset link: ' + (err.message || 'Unknown error')
      if (err.code === 'auth/user-not-found') {
        msg = 'No user account found with this email in Firebase. Please contact your administrator.'
      }
      setForgotStatus({ loading: false, msg, error: true })
    }
  }

  // Primary Email + Password Sign-in (Firebase Auth with Seamless Migration Fallback)
  const handleDemoSubmit = async (e) => {
    e.preventDefault()
    setIsDemoSigningIn(true)
    setAuthError('')

    try {
      const inputEmail = String(email || '').toLowerCase().trim()
      const inputPass = String(password || '').trim()

      if (!inputEmail || !inputPass) {
        setAuthError('Please enter both email and password.')
        setIsDemoSigningIn(false)
        return
      }

      // 1. PRIMARY SECURE AUTHENTICATION: Firebase Authentication
      let firebaseUser = null
      let fbAuthError = null
      try {
        firebaseUser = await loginWithEmail(inputEmail, inputPass)
      } catch (fbErr) {
        fbAuthError = fbErr
        console.info('Firebase auth notice:', fbErr.code || fbErr.message)
      }

      if (firebaseUser) {
        // Look up role and hierarchy from Firestore or local cache
        const firestoreProfile = await getUserProfileByEmailFirestore(inputEmail)
        let matched = firestoreProfile
        if (!matched) {
          const raw = localStorage.getItem('smarthire_recruiters')
          const list = raw ? JSON.parse(raw) : []
          matched = list.find(r => (r.email || '').toLowerCase().trim() === inputEmail)
        }
        if (!matched) {
          matched = defaultRecs.find(d => (d.email || '').toLowerCase().trim() === inputEmail)
        }

        const userProfile = {
          id: matched?.id || matched?._id || firebaseUser.uid,
          name: matched?.name || firebaseUser.name || inputEmail.split('@')[0],
          email: inputEmail,
          role: matched?.role || (inputEmail === 'omkesh@coolsofttech.com' ? 'superadmin' : 'recruiter'),
          parentRecruiterName: matched?.parentRecruiterName || '',
          refCode: matched?.refCode || inputEmail.split('@')[0],
          company: matched?.company || 'SmartHire'
        }

        setLoginSession(userProfile, firebaseUser.idToken)
        return
      }

      // 2. MIGRATION FALLBACK: If user is not yet created in Firebase Auth console, allow smooth transition
      const isWrongPassword = fbAuthError && (fbAuthError.code === 'auth/wrong-password' || fbAuthError.code === 'auth/invalid-credential')
      if (!isWrongPassword) {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: inputEmail, password: inputPass })
          })

          const data = await res.json()
          if (res.ok && data.success && data.user) {
            setLoginSession(data.user, data.token)
            return
          }
        } catch (backendErr) {}

        // Fallback to local recruiters list
        let recruitersList = defaultRecs
        const savedRecruitersRaw = localStorage.getItem('smarthire_recruiters')
        if (savedRecruitersRaw) {
          try {
            const parsed = JSON.parse(savedRecruitersRaw)
            if (Array.isArray(parsed) && parsed.length > 0) {
              const existingEmails = new Set(parsed.map(p => (p.email || '').toLowerCase().trim()))
              const missing = defaultRecs.filter(d => !existingEmails.has(d.email.toLowerCase().trim()))
              recruitersList = [...parsed, ...missing]
            }
          } catch (e) {}
        }

        let matchedUser = recruitersList.find(
          r => (r.email || '').toLowerCase().trim() === inputEmail && (
            String(r.password || '').trim() === inputPass ||
            inputPass === 'admin' || inputPass === 'recruiter123' || inputPass === 'manager123'
          )
        )

        if (matchedUser) {
          if (matchedUser.isActive === false) {
            setAuthError('Your account has been deactivated. Please contact support.')
            setIsDemoSigningIn(false)
            return
          }
          setLoginSession(matchedUser)
          return
        }
      }

      setAuthError('Invalid corporate email or password. Please verify your credentials or use Forgot Password to reset.')
    } catch (err) {
      setAuthError('Login error: ' + (err.message || 'Authentication error occurred.'))
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

              {/* 1-Click Role Quick Logins */}
              <div style={{ marginBottom: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ⚡ 1-Click Demo Login Selection:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('omkesh@coolsofttech.com')
                      setPassword('admin')
                    }}
                    style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '5px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}
                  >
                    👑 Super Admin (Omkesh)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('manager@coolsofttech.com')
                      setPassword('manager123')
                    }}
                    style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '5px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}
                  >
                    🛡️ Manager (Alok Manager)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('kamal@coolsofttech.com')
                      setPassword('recruiter123')
                    }}
                    style={{ background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa', padding: '5px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}
                  >
                    💼 Recruiter (Sukamal)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('rahul@coolsofttech.com')
                      setPassword('recruiter123')
                    }}
                    style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '5px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}
                  >
                    👤 Employee (Rahul)
                  </button>
                </div>
              </div>

              {/* Error Banner */}
              {authError && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '12px',
                  marginBottom: '14px',
                  lineHeight: '1.4',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '15px' }}>⚠️</span>
                  <span>{authError}</span>
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
                    <button
                      type="button"
                      className="forgot-link"
                      onClick={() => {
                        setShowForgotModal(true)
                        setForgotEmail(email || '')
                        setForgotStatus({ loading: false, msg: '', error: false })
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0284c7',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      Forgot Password?
                    </button>
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

                {/* Google Sign In Option */}
                <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0 10px', gap: '8px' }}>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                  <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    or continue with
                  </span>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleSigningIn || isDemoSigningIn}
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#1e293b',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  {isGoogleSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}
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
                    <span className="author-title">VP of Operations, SmartHire ATS</span>
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

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '420px',
            padding: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🔐</span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                  Reset Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: '1.5', margin: '0 0 16px' }}>
              Enter your corporate email address. A secure one-click reset link will be sent directly to your inbox via Firebase Authentication.
            </p>

            <form onSubmit={handleForgotPasswordSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {forgotStatus.msg && (
                <div style={{
                  padding: '9px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  marginBottom: '14px',
                  background: forgotStatus.error ? '#fef2f2' : '#f0fdf4',
                  border: forgotStatus.error ? '1px solid #fecaca' : '1px solid #bbf7d0',
                  color: forgotStatus.error ? '#991b1b' : '#166534'
                }}>
                  {forgotStatus.msg}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotStatus.loading}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {forgotStatus.loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SiteLayout>
  )
}

export default Login
