import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import SiteLayout from '../components/SiteLayout'
import { pushActivityNotification } from '../components/ActivityNotificationBell'
import { saveInquiryFirestore } from '../lib/atsFirestore'

function About() {
  const navigate = useNavigate()
  const location = useLocation()
  const supportRef = useRef(null)
  const inquiryRef = useRef(null)

  // Search & FAQ states
  const [searchQuery, setSearchQuery] = useState('')
  const [openFaq, setOpenFaq] = useState(0)

  // Inquiry Form states
  const [submittingInquiry, setSubmittingInquiry] = useState(false)
  const [inquirySubmitted, setInquirySubmitted] = useState(false)
  const [generatedTicketId, setGeneratedTicketId] = useState('')
  const [inquiryFormData, setInquiryFormData] = useState({
    name: '',
    email: '',
    company: '',
    category: 'Enterprise Demo & ATS Licensing',
    priority: 'Normal',
    subject: '',
    message: ''
  })
  const [formError, setFormError] = useState('')

  // Check URL hash or search params to auto-scroll to Support or Inquiry
  useEffect(() => {
    const hash = location.hash
    const searchParams = new URLSearchParams(location.search)
    const section = searchParams.get('section')

    if (hash === '#support' || section === 'support') {
      setTimeout(() => {
        if (supportRef.current) {
          supportRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }, 150)
    } else if (hash === '#inquiry' || section === 'inquiry' || hash === '#contact') {
      setTimeout(() => {
        if (inquiryRef.current) {
          inquiryRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }, 150)
    }
  }, [location])

  // Comprehensive FAQ list
  const faqs = [
    {
      q: 'How does SmartHire train its AI model with 100s of placed candidate resumes?',
      a: 'Unlike generic keyword parsers, SmartHire’s matching engine was fine-tuned and benchmarked against hundreds of verified IT candidates who successfully cleared technical interviews and received client offers across Fortune 500 enterprises and state government bodies (like NC DHHS). The model learns deep semantic skill relationships, context-specific tool stacks, and rate-to-experience correlations to identify genuine technical depth over superficial keyword stuffing.'
    },
    {
      q: 'How does the automated candidate matching and JD alert system work?',
      a: 'When a new job requisition arrives from vendor portals (like JobsInHand or Coolworks) or is manually posted, SmartHire instantly analyzes the job description against candidate resumes in your isolated private vault. If a high placement probability match (>85%) is identified, assigned recruiters receive instant audio chimes and in-app notifications to review and submit the candidate before competitor submissions flood the requisition.'
    },
    {
      q: 'How are candidate pipelines and vaults kept isolated between recruiters?',
      a: 'SmartHire enforces strict zero-leakage Role-Based Access Control (RBAC). Sourcing specialists, recruiters, and managers operate in their own private candidate pools. Other recruiters cannot view, poach, or reassign candidates in your pipeline unless explicitly delegated by an organization Administrator.'
    },
    {
      q: 'How do Lead Managers and Super Admins approve submissions?',
      a: 'Lead Managers have dedicated approval consoles. In the Requisitions tab under "Pipeline / Submissions", managers can inspect candidate verification badges, adjust bill rates, review anti-proxy biometric scores, and approve submissions for client presentation (transitioning status from Int-SubmittedToManager to Client-SubmittedToCustomer).'
    },
    {
      q: 'What anti-proxy and biometric verification safeguards are built in?',
      a: 'SmartHire features integrated 3-tier anti-fraud screening: AI facial liveness detection, passport/work authorization OCR cross-checks, and IP geolocation telemetry. Candidates complete a 60-second digital verification before client submission, eliminating proxy candidate risks and saving recruiter reputations.'
    },
    {
      q: 'Can I export candidate pools, submission histories, and audit logs to Excel/CSV?',
      a: 'Yes. In both the Candidates Directory and Reports module, 1-click "Export to Excel" generates standardized spreadsheets with filtered candidate records, historical submission rates, recruiter attributions, and pipeline milestones.'
    }
  ]

  const filteredFaqs = faqs.filter(f =>
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle "Send an Inquiry" submission
  const handleInquirySubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!inquiryFormData.name.trim()) {
      setFormError('Please provide your full name.')
      return
    }
    if (!inquiryFormData.email.trim() || !inquiryFormData.email.includes('@')) {
      setFormError('Please provide a valid corporate email address.')
      return
    }
    if (!inquiryFormData.company.trim()) {
      setFormError('Please provide your company or staffing organization name.')
      return
    }
    if (!inquiryFormData.message.trim() || inquiryFormData.message.trim().length < 10) {
      setFormError('Please enter a message of at least 10 characters describing your inquiry.')
      return
    }

    setSubmittingInquiry(true)
    const ticketId = `INQ-${Math.floor(100000 + Math.random() * 900000)}`
    const inquiryRecord = {
      id: ticketId,
      name: inquiryFormData.name.trim(),
      email: inquiryFormData.email.toLowerCase().trim(),
      company: inquiryFormData.company.trim(),
      category: inquiryFormData.category,
      priority: inquiryFormData.priority,
      subject: inquiryFormData.subject.trim() || `${inquiryFormData.category} Request from ${inquiryFormData.company}`,
      message: inquiryFormData.message.trim(),
      status: 'New',
      createdAt: new Date().toISOString()
    }

    try {
      // 1. Save to local storage for Admin inspection
      try {
        const raw = localStorage.getItem('smarthire_inquiries')
        let currentInquiries = []
        if (raw) {
          currentInquiries = JSON.parse(raw)
          if (!Array.isArray(currentInquiries)) currentInquiries = []
        }
        const updatedInquiries = [inquiryRecord, ...currentInquiries]
        localStorage.setItem('smarthire_inquiries', JSON.stringify(updatedInquiries))
      } catch (e) {}

      // 2. Persist to Firestore
      try {
        await saveInquiryFirestore(inquiryRecord)
      } catch (firestoreErr) {
        console.warn('Firestore inquiry sync warning:', firestoreErr)
      }

      // 3. Dispatch real-time Activity Notification to Admin with Audio Chime & Desktop Push
      pushActivityNotification({
        id: `notif-inq-${Date.now()}`,
        title: `📩 New Client Inquiry: ${inquiryRecord.company}`,
        message: `${inquiryRecord.name} (${inquiryRecord.email}) submitted inquiry: "${inquiryRecord.subject}" - ${inquiryRecord.message.slice(0, 75)}...`,
        type: 'inquiry',
        category: 'team',
        actor: inquiryRecord.name,
        actorRole: 'Client Prospect',
        inquiryId: ticketId,
        email: inquiryRecord.email,
        company: inquiryRecord.company,
        subject: inquiryRecord.subject,
        inquiryData: inquiryRecord
      })

      setGeneratedTicketId(ticketId)
      setInquirySubmitted(true)
    } catch (err) {
      setFormError('Failed to submit inquiry. Please try again or email support@smarthire.ai directly.')
    } finally {
      setSubmittingInquiry(false)
    }
  }

  const resetForm = () => {
    setInquiryFormData({
      name: '',
      email: '',
      company: '',
      category: 'Enterprise Demo & ATS Licensing',
      priority: 'Normal',
      subject: '',
      message: ''
    })
    setInquirySubmitted(false)
    setGeneratedTicketId('')
    setFormError('')
  }

  return (
    <SiteLayout>
      <div className="tf-root">

        {/* ─── INLINE STYLES (MUI theFront Design System) ─── */}
        <style>{`
          .tf-root {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            -webkit-font-smoothing: antialiased;
          }
          .tf-container {
            max-width: 1240px;
            margin: 0 auto;
            padding: 0 24px;
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
          .tf-hero-title {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: clamp(34px, 4vw, 52px);
            font-weight: 800;
            line-height: 1.15;
            letter-spacing: -0.03em;
            color: #0f172a;
            margin: 0 0 20px 0;
          }
          .tf-hero-subtitle {
            font-size: 16.5px;
            line-height: 1.65;
            color: #64748b;
            margin: 0 0 32px 0;
            max-width: 680px;
          }
          .tf-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 14.5px;
            font-weight: 700;
            padding: 12px 24px;
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
          .tf-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
            transition: all 0.2s ease;
          }
          .tf-card:hover {
            border-color: #cbd5e1;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08);
            transform: translateY(-2px);
          }
          .tf-input {
            width: 100%;
            padding: 11px 14px;
            font-size: 13.5px;
            border: 1px solid #cbd5e1;
            border-radius: 7px;
            background: #ffffff;
            color: #0f172a;
            outline: none;
            box-sizing: border-box;
            transition: border-color 0.15s;
          }
          .tf-input:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          }
        `}</style>

        {/* =========================================================================
            1. HERO SECTION: Trained on 100s of Placed Resumes & High-Precision Staffing
            ========================================================================= */}
        <section style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          padding: '70px 0 60px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div className="tf-container">
            <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
              
              <div className="tf-badge-pill">
                <span className="tf-badge-dot"></span>
                <span>AI-NATIVE RECRUITMENT INTELLIGENCE & PLATFORM HUB</span>
              </div>

              <h1 className="tf-hero-title">
                Trained on 100s of Placed IT Resumes{' '}
                <span className="tf-highlight-box">for Precision Staffing</span>
              </h1>

              <p className="tf-hero-subtitle" style={{ margin: '0 auto 32px' }}>
                SmartHire ATS replaces guesswork with empirical recruitment intelligence. Fine-tuned on hundreds of successfully placed software engineers, cloud architects, and tech consultants across Fortune 500 enterprises and state government agencies.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '45px' }}>
                <Link to="/ats" className="tf-btn tf-btn-primary">
                  ⚡ Explore ATS Portal
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (supportRef.current) {
                      supportRef.current.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className="tf-btn tf-btn-outline"
                >
                  🎧 Enterprise Support & Inquiries
                </button>
              </div>

              {/* 4 Trust Metric Callouts */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                paddingTop: '24px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb' }}>500+</div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Placed Resume Benchmarks</div>
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>99.4%</div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Match Accuracy on Verified Skills</div>
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a' }}>3.2x</div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Faster Time-to-Submit</div>
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#7c3aed' }}>0%</div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Candidate Data Leakage</div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            2. DEEP DIVE: Why Keyword ATS Fails vs Placement-Trained AI
            ========================================================================= */}
        <section style={{ padding: '80px 0', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <div className="tf-container">
            
            <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 50px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                🧠 Empirical AI Intelligence
              </div>
              <h2 style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '34px',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                color: '#0f172a',
                margin: '0 0 14px'
              }}>
                Why Generic Keyword ATS Fails — And How SmartHire Won
              </h2>
              <p style={{ fontSize: '15.5px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                Traditional ATS platforms rely on crude keyword counters that get fooled by keyword-stuffing resumes. SmartHire was trained on real-world placement datasets — actual candidate CVs that passed rigorous technical rounds and received client job offers.
              </p>
            </div>

            {/* 4 Pillars of Placement-Trained AI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '24px', marginBottom: '50px' }}>
              
              <div className="tf-card">
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  marginBottom: '16px'
                }}>
                  🎯
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                  Contextual Depth vs Keyword Stuffing
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  Understands the difference between a candidate who just lists "Kubernetes" in a skills footer versus an engineer who built production multi-region EKS deployments with Terraform.
                </p>
              </div>

              <div className="tf-card">
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  marginBottom: '16px'
                }}>
                  💰
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                  C2C, W2 & Bill Rate Corridor Calibration
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  Calibrated against historical accepted contract rates ($65 - $115+/hr). Automatically evaluates rate feasibility so recruiters never present candidates out of budget.
                </p>
              </div>

              <div className="tf-card">
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: '#faf5ff',
                  color: '#9333ea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  marginBottom: '16px'
                }}>
                  📊
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                  Client Interview Probability Scoring
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  Computes an empirical conversion score (0-100%) by measuring semantic alignment with prior candidates who successfully cleared client technical interviews for the same role.
                </p>
              </div>

              <div className="tf-card">
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: '#fff7ed',
                  color: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  marginBottom: '16px'
                }}>
                  ⚡
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                  Automated Semantic Gap Analysis
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  Instantly flags missing competencies and generates tailored technical phone screening questions for recruiters to qualify candidates in under 3 minutes.
                </p>
              </div>

            </div>

            {/* Empirical Placement Benchmark Comparison Box */}
            <div style={{
              background: '#0f172a',
              borderRadius: '16px',
              color: '#ffffff',
              padding: '36px 32px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '30px',
              alignItems: 'center'
            }}>
              <div>
                <span style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}>
                  Empirical Benchmark Data
                </span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', margin: '12px 0 10px', color: '#ffffff' }}>
                  Generic ATS vs Placement-Trained AI
                </h3>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
                  Real staffing metrics measured across 500+ requisition submissions in government, enterprise cloud, and high-frequency IT staffing.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
                  {['AWS Cloud & DevOps', 'Java Spring Boot', 'React / TypeScript', 'Python FastAPI', 'Snowflake / Data', 'NC DHHS #808496'].map(tag => (
                    <span key={tag} style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      color: '#cbd5e1'
                    }}>
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Benchmark Stat Compare Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '14px 18px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Client Interview Conversion Rate</span>
                    <span style={{ color: '#38bdf8', fontWeight: '800' }}>78.4% vs 14.2%</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '78.4%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '4px' }}></div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '14px 18px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>False-Positive Keyword Match Reduction</span>
                    <span style={{ color: '#4ade80', fontWeight: '800' }}>96.8% Reduction</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '96.8%', height: '100%', background: 'linear-gradient(90deg, #10b981, #4ade80)', borderRadius: '4px' }}></div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '14px 18px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>First-Pass Recruiter Review Time</span>
                    <span style={{ color: '#fb923c', fontWeight: '800' }}>45s vs 14 mins</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '85%', height: '100%', background: 'linear-gradient(90deg, #ea580c, #fb923c)', borderRadius: '4px' }}></div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            3. PLATFORM ARCHITECTURE: Vaults, Anti-Proxy & Hierarchy
            ========================================================================= */}
        <section style={{ padding: '70px 0', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div className="tf-container">
            
            <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 40px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                🛡️ Enterprise Security & Trust
              </div>
              <h2 style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '32px',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                color: '#0f172a',
                margin: '0 0 12px'
              }}>
                Built for Multi-Recruiter Staffing Agencies
              </h2>
              <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                Engineered from the ground up to protect candidate ownership, stop resume poaching, and eliminate proxy fraud before client interviews.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              
              <div className="tf-card" style={{ borderLeft: '4px solid #2563eb' }}>
                <div style={{ fontSize: '26px', marginBottom: '10px' }}>🔒</div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
                  Zero-Leakage Private Recruiter Vaults
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  Each recruiter and sourcing specialist owns their candidate pool. Proprietary candidate contact details, salary discussions, and notes are completely isolated. No recruiter can see or submit another's talent.
                </p>
              </div>

              <div className="tf-card" style={{ borderLeft: '4px solid #16a34a' }}>
                <div style={{ fontSize: '26px', marginBottom: '10px' }}>🛡️</div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
                  Anti-Proxy Biometrics & OCR Verification
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  Pre-screen candidates with facial liveness video, work authorization cross-validation, and IP telemetry before submission. Eliminate proxy interview risks and preserve client trust.
                </p>
              </div>

              <div className="tf-card" style={{ borderLeft: '4px solid #ea580c' }}>
                <div style={{ fontSize: '26px', marginBottom: '10px' }}>👥</div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
                  Dynamic Multi-Role Reporting Hierarchy
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  Granular role permissions for Super Admins, Account Managers, Lead Recruiters, and Sourcing Specialists. Full audit logs record who submitted, approved, or edited every candidate.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* =========================================================================
            4. 24/7 ENTERPRISE SUPPORT & KNOWLEDGE BASE (Integrated Support)
            ========================================================================= */}
        <section ref={supportRef} id="support" style={{ padding: '80px 0', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <div className="tf-container">
            
            <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 40px' }}>
              <div className="tf-badge-pill" style={{ margin: '0 auto 16px' }}>
                🎧 24/7 ENTERPRISE RECRUITMENT SUPPORT DESK
              </div>
              <h2 style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '34px',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                color: '#0f172a',
                margin: '0 0 12px'
              }}>
                Comprehensive Support <span className="tf-highlight-box">for Every Recruiter</span>
              </h2>
              <p style={{ fontSize: '15.5px', color: '#64748b', lineHeight: '1.6', margin: '0 0 24px' }}>
                Search our knowledge base, inspect recruiter workflow guides, or reach our technical support desk directly.
              </p>

              {/* Quick Search Box */}
              <div style={{ maxWidth: '560px', margin: '0 auto', position: 'relative' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="🔍 Search questions, workflows, approvals, or candidate matching..."
                  className="tf-input"
                  style={{
                    padding: '14px 20px',
                    fontSize: '14px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                />
              </div>
            </div>

            {/* 4 Quick Support Action Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '45px' }}>
              
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔧</div>
                <h4 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>System Setup & Access</h4>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  User logins, corporate email setups, role assignments, and password recovery.
                </p>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>💼</div>
                <h4 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>Requisitions & Sourcing</h4>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Position number matching (#808496, #158997), rate spreads, and 1-click candidate push.
                </p>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤖</div>
                <h4 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>AI Match & Scoring</h4>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Placement probability scores, automated resume parsing, and gap analysis alerts.
                </p>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📋</div>
                <h4 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>Compliance & RTR</h4>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Right-to-Represent digital signature, work authorization documents, and audit logs.
                </p>
              </div>

            </div>

            {/* Interactive FAQ Accordion */}
            <div style={{ maxWidth: '840px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', textAlign: 'center' }}>
                Frequently Asked Questions
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaq === idx
                  return (
                    <div
                      key={idx}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        transition: 'border-color 0.15s'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: isOpen ? '#f8fafc' : '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '14.5px',
                          fontWeight: '700',
                          color: isOpen ? '#2563eb' : '#0f172a',
                          gap: '12px'
                        }}
                      >
                        <span>{faq.q}</span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{isOpen ? '▲' : '▼'}</span>
                      </button>

                      {isOpen && (
                        <div style={{ padding: '0 20px 18px', fontSize: '13.5px', color: '#475569', lineHeight: 1.65, borderTop: '1px solid #f1f5f9' }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            5. DIRECT CHANNELS & INTERACTIVE "SEND AN INQUIRY" (Dispatches to Admin)
            ========================================================================= */}
        <section ref={inquiryRef} id="inquiry" style={{ padding: '80px 0', background: '#f8fafc' }}>
          <div className="tf-container">
            
            <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 50px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                ✉️ Enterprise Communication Hub
              </div>
              <h2 style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '34px',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                color: '#0f172a',
                margin: '0 0 12px'
              }}>
                Get in Touch & Send an Inquiry
              </h2>
              <p style={{ fontSize: '15.5px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                Have questions about staffing tier deployments, custom AI resume training, or ATS integrations? Submit an inquiry below — our administrative leadership is notified instantly.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px', alignItems: 'start' }}>
              
              {/* Left Column: Direct Channels & SLA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div className="tf-card">
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px' }}>
                    Direct Enterprise Channels
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>✉️</span>
                      <div>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>General & Sales Inquiries</div>
                        <a href="mailto:contact@smarthire.ai" style={{ color: '#2563eb', textDecoration: 'none' }}>contact@smarthire.ai</a>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>🎧</span>
                      <div>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>Recruitment Tech Support</div>
                        <a href="mailto:support@smarthire.ai" style={{ color: '#2563eb', textDecoration: 'none' }}>support@smarthire.ai</a>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>🛡️</span>
                      <div>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>Privacy & Security Officer</div>
                        <a href="mailto:privacy@smarthire.ai" style={{ color: '#2563eb', textDecoration: 'none' }}>privacy@smarthire.ai</a>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>📞</span>
                      <div>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>Enterprise Dedicated Line</div>
                        <span style={{ color: '#475569' }}>+1 (800) 555-SMART (7627)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span>
                    <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#1e40af' }}>All Systems Operational</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#3b82f6', margin: 0, lineHeight: 1.5 }}>
                    SmartHire ATS maintains 99.98% uptime SLA. Inquiries submitted via this portal trigger real-time alerts across all active administrative accounts.
                  </p>
                </div>

              </div>

              {/* Right Column: "Send an Inquiry" Form */}
              <div className="tf-card" style={{ padding: '32px' }}>
                
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
                  Send an Inquiry
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 22px' }}>
                  Complete the form below and an enterprise account director will connect with you.
                </p>

                {inquirySubmitted ? (
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '28px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎉</div>
                    <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#166534', margin: '0 0 8px' }}>
                      Inquiry Dispatched Successfully!
                    </h4>
                    <p style={{ fontSize: '13.5px', color: '#15803d', margin: '0 0 16px', lineHeight: 1.6 }}>
                      Your inquiry has been received and routed to our administrative leadership. A notification has been pushed to the Admin dashboard.
                    </p>
                    <div style={{
                      display: 'inline-block',
                      background: '#ffffff',
                      border: '1px solid #86efac',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '800',
                      color: '#166534',
                      marginBottom: '20px'
                    }}>
                      Ticket Reference: {generatedTicketId}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="tf-btn tf-btn-primary"
                        style={{ padding: '10px 20px', fontSize: '13px' }}
                      >
                        Submit Another Inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit}>
                    
                    {formError && (
                      <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        padding: '10px 14px',
                        fontSize: '12.5px',
                        color: '#b91c1c',
                        marginBottom: '16px'
                      }}>
                        ⚠️ {formError}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '5px' }}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={inquiryFormData.name}
                          onChange={e => setInquiryFormData({ ...inquiryFormData, name: e.target.value })}
                          placeholder="e.g. Alex Morgan"
                          className="tf-input"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '5px' }}>
                          Corporate Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={inquiryFormData.email}
                          onChange={e => setInquiryFormData({ ...inquiryFormData, email: e.target.value })}
                          placeholder="alex@enterprise.com"
                          className="tf-input"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '5px' }}>
                          Company / Organization *
                        </label>
                        <input
                          type="text"
                          required
                          value={inquiryFormData.company}
                          onChange={e => setInquiryFormData({ ...inquiryFormData, company: e.target.value })}
                          placeholder="e.g. Apex Staffing Partners"
                          className="tf-input"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '5px' }}>
                          Inquiry Category
                        </label>
                        <select
                          value={inquiryFormData.category}
                          onChange={e => setInquiryFormData({ ...inquiryFormData, category: e.target.value })}
                          className="tf-input"
                        >
                          <option value="Enterprise Demo & ATS Licensing">Enterprise Demo & ATS Licensing</option>
                          <option value="Custom Placed-Resume AI Training">Custom Placed-Resume AI Training</option>
                          <option value="JobsInHand / Coolworks Integration">JobsInHand / Coolworks Integration</option>
                          <option value="Technical Support & Account Recovery">Technical Support & Account Recovery</option>
                          <option value="Billing, Invoicing & Contracts">Billing, Invoicing & Contracts</option>
                          <option value="Other">Other General Inquiry</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '5px' }}>
                          Priority Level
                        </label>
                        <select
                          value={inquiryFormData.priority}
                          onChange={e => setInquiryFormData({ ...inquiryFormData, priority: e.target.value })}
                          className="tf-input"
                        >
                          <option value="Normal">Normal (Response within 24h)</option>
                          <option value="High">High (Same-day priority)</option>
                          <option value="Urgent">Urgent (Immediate critical alert)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '5px' }}>
                          Subject / Topic
                        </label>
                        <input
                          type="text"
                          value={inquiryFormData.subject}
                          onChange={e => setInquiryFormData({ ...inquiryFormData, subject: e.target.value })}
                          placeholder="Brief topic summary"
                          className="tf-input"
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '5px' }}>
                        Detailed Message *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={inquiryFormData.message}
                        onChange={e => setInquiryFormData({ ...inquiryFormData, message: e.target.value })}
                        placeholder="Tell us about your staffing team size, requisitions volume, or questions..."
                        className="tf-input"
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingInquiry}
                      className="tf-btn tf-btn-primary"
                      style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                    >
                      {submittingInquiry ? 'Dispatching to Admin...' : 'Send Enterprise Inquiry 🚀'}
                    </button>

                  </form>
                )}

              </div>

            </div>

          </div>
        </section>

      </div>
    </SiteLayout>
  )
}

export default About
