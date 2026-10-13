import React, { useState } from 'react'
import { initiateRazorpayCheckout } from '../utils/razorpayCheckout'

export default function PricingSection({ onAuthClick, isStandalonePage = false, initialProductTab = 'smartscreen' }) {
  const [productTab, setProductTab] = useState(initialProductTab) // 'smartscreen' | 'ats' | 'bundle'
  const [isYearly, setIsYearly] = useState(true)
  
  // Razorpay Checkout states
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentPlanName, setPaymentPlanName] = useState('')
  const [paymentResult, setPaymentResult] = useState(null)
  const [paymentError, setPaymentError] = useState(null)

  // Standalone SmartScreen AI Plans (for teams using Bullhorn, Greenhouse, Lever, etc.)
  const smartScreenPlans = [
    {
      name: 'Starter Screen',
      tier: 'Boutique & Solo',
      priceMonthly: 99,
      priceYearly: 79,
      interviewLimit: '60 Candidate AI Video & Voice Interviews / mo',
      limitSubtext: 'Ideal for solo recruiters & boutique agencies',
      description: 'Plug AI video & audio screening into your recruiting workflow with zero ATS changes.',
      badge: null,
      highlight: '#0284c7',
      popular: false,
      features: [
        { title: '60 AI Video & Audio Interviews / month', note: 'Multi-format: 1-way video, audio, or text' },
        { title: 'Automated Speech-to-Text Transcripts', note: 'Fast, accurate candidate audio transcription using AI' },
        { title: 'AI Match Score & Question Scorecards', note: '0–100% fit score with instant summary' },
        { title: 'Anti-Cheat Tab Switch Lock', note: 'Monitors candidate browser focus' },
        { title: 'Candidate Self-Scheduling Links', note: 'Async 24/7 completion for candidates' },
        { title: 'Direct Email Candidate Invites', note: 'Send 1-click screening invites' },
        { title: '30-Day Cloud Video Storage', note: 'Encrypted storage with instant replay' },
        { title: 'Standard Email & Ticket Support', note: null },
      ],
      systemIntegration: null,
      notIncluded: [
        'Universal ATS Webhooks (Bullhorn, Greenhouse)',
        'Sub-15ms REST API Link Generation',
        'Custom Agency White-Label Branding',
      ],
      ctaText: 'Get Started',
      ctaType: 'outline'
    },
    {
      name: 'Growth Screen',
      tier: 'Recruiting Teams',
      priceMonthly: 279,
      priceYearly: 219,
      interviewLimit: '300 Candidate AI Video & Voice Interviews / mo',
      limitSubtext: 'Scalable candidate evaluation pipeline',
      description: 'For growing staffing firms requiring automated ATS webhooks & branded scorecards.',
      badge: null,
      highlight: '#2563eb',
      popular: false,
      features: [
        { title: '300 AI Video & Audio Interviews / month', note: 'Scalable candidate evaluation pipeline' },
        { title: 'Universal ATS Webhook Sync', note: 'Auto-syncs scorecards to Bullhorn, Greenhouse, Lever' },
        { title: 'Sub-15ms REST API Access', note: 'Programmatic link creation from your backend' },
        { title: 'Custom Agency White-Label Branding', note: 'Your logo, primary color & company name' },
        { title: 'Downloadable Branded PDF Scorecards', note: 'Client-ready candidate evaluation dossier' },
        { title: 'AI Audio Voice Question Prompts', note: 'Speaks questions out loud to candidates using AI' },
        { title: 'Work Auth & Salary Expectation Intake', note: 'Auto-captures visa & compensation fit' },
        { title: '90-Day Cloud Video Storage', note: 'Extended cloud retention' },
        { title: 'Priority Recruiter Chat & Email Support', note: '<2hr response SLA' },
      ],
      systemIntegration: 'Universal ATS Webhooks + REST API Included',
      notIncluded: [
        'Custom Subdomain (screen.youragency.com)',
        'Embedded ATS Iframe Studio'
      ],
      ctaText: 'Get Started',
      ctaType: 'outline'
    },
    {
      name: 'Commercial Unlimited Screen',
      tier: 'Commercial Scale',
      priceMonthly: 549,
      priceYearly: 449,
      interviewLimit: 'Unlimited Candidate AI Video & Voice Interviews / mo',
      limitSubtext: 'Zero per-interview overages · $500+ commercial volume',
      description: 'For high-volume staffing agencies & enterprise clients needing unlimited candidate video interviews & deep system integrations.',
      badge: 'RECOMMENDED',
      highlight: '#2563eb',
      popular: true,
      features: [
        { title: 'Unlimited AI Video & Audio Interviews / month', note: 'Zero per-interview overage fees ever' },
        { title: 'Deep System Integration & HMAC Webhooks', note: 'Cryptographically verified payload security' },
        { title: 'ATS Embedded Iframe Studio', note: 'Run screening directly inside your custom CRM' },
        { title: 'Full Anti-Cheat Proctoring Engine', note: 'Desktop screen share & suspicious activity audit' },
        { title: 'Custom Subdomain Routing', note: 'screen.youragency.com link branding' },
        { title: 'Custom Job Description Question Generator', note: 'Tailors questions to client JDs using AI' },
        { title: '1-Year Long-Term Cloud Storage', note: 'Compliance-ready archive' },
        { title: 'Dedicated Solutions Engineer & Slack Channel', note: 'Hands-on ATS webhook setup' },
      ],
      systemIntegration: 'HMAC Webhooks + Embedded Iframe + Custom API',
      notIncluded: [],
      ctaText: 'Get Unlimited Screen',
      ctaType: 'primary'
    },
    {
      name: 'Enterprise & API',
      tier: 'Enterprise Custom',
      priceMonthly: null,
      priceYearly: null,
      interviewLimit: 'Unlimited Scale & Multi-Tenant Deployment',
      limitSubtext: 'Dedicated infrastructure with 99.9% uptime SLA',
      description: 'Custom architecture for enterprise staffing corporations, MSPs & high-volume VMS suppliers.',
      badge: 'ENTERPRISE',
      highlight: '#0f172a',
      popular: false,
      features: [
        { title: 'Unlimited AI Video & Audio Candidate Screens', note: 'Zero per-interview overage fees' },
        { title: 'Dedicated Isolated Cloud Infrastructure', note: 'Single-tenant instance & private endpoints' },
        { title: 'Complete Agency White-Label Branding', note: 'Custom domain, logo & branded notifications' },
        { title: 'Universal Webhooks & REST API Integrations', note: 'Sync with internal systems & custom ATS' },
        { title: 'Single Sign-On (SSO / SAML 2.0 / Okta)', note: 'Enterprise identity security' },
        { title: 'Custom AI Scoring Calibration', note: 'Calibrated to your agency evaluation rubrics' },
        { title: 'Dedicated 24/7 Account Director', note: 'Direct executive escalation' },
      ],
      systemIntegration: 'Custom Enterprise Architecture + Full API',
      notIncluded: [],
      ctaText: 'Contact Enterprise Sales',
      ctaType: 'dark'
    }
  ]

  // All-In-One SmartHire ATS OS Plans
  const atsPlans = [
    {
      name: 'Starter ATS',
      tier: 'Solo Recruiter',
      priceMonthly: 149,
      priceYearly: 119,
      interviewLimit: '5 Active Jobs · 3 Recruiter Seats',
      limitSubtext: 'Full recruiting pipeline for boutique staffing desks',
      description: 'Complete ATS candidate pipeline, tracking, and applicant management.',
      badge: null,
      highlight: '#0284c7',
      popular: false,
      features: [
        { title: 'Full ATS Pipeline & Candidate Kanban', note: 'Track applicants from sourcing to placement' },
        { title: '5 Active Requisitions & 3 Recruiter Seats', note: 'Unlimited applications' },
        { title: 'AI Match Score & Candidate Ranking', note: 'Requisition fit rating 0–100%' },
        { title: 'Candidate Email Automation', note: 'Status updates & interview invite links' },
        { title: 'Location Tracker & Anti-Cheat Tab Lock', note: 'Monitors candidate focus & geolocation' },
        { title: 'Standard Recruiter Support', note: null },
      ],
      systemIntegration: 'Full SmartHire In-App Architecture',
      notIncluded: [
        'Automated AI Resume & Email Parser',
        'Vendor Hotlist Excel Grid Ingestion',
        '1-Click Submittal Pack Generator',
        'White-Label Branding (Enterprise Only)'
      ],
      ctaText: 'Get Started',
      ctaType: 'outline'
    },
    {
      name: 'Growth Pro ATS',
      tier: 'Recruiting Teams',
      priceMonthly: 389,
      priceYearly: 299,
      interviewLimit: '25 Active Jobs · 10 Recruiter Seats',
      limitSubtext: 'Complete recruiting stack for growing staffing teams',
      badge: null,
      highlight: '#2563eb',
      popular: false,
      description: 'Unified ATS pipeline, automated resume intake, hotlists, and client submittals.',
      features: [
        { title: 'Everything in Starter ATS included', note: null },
        { title: '25 Active Requisitions & Up to 10 Team Members', note: 'Multi-seat recruiting hierarchy' },
        { title: 'Automated AI Resume & Email Parser', note: 'Instant intake & skill extraction from PDF, Word & TXT' },
        { title: 'Vendor Hotlist Excel Grid Ingestion', note: 'Instant bench & vendor candidate matching' },
        { title: '1-Click Client Submittal Pack Generator', note: 'Formatted client coversheet & branded resume' },
        { title: 'Anti-Cheat Full Screen Lock & Telemetry', note: 'Strict proctoring & suspicious activity detection' },
        { title: 'Priority Recruiter Chat & Phone Support', note: null },
      ],
      systemIntegration: 'Full ATS Suite + Hotlists + Parsing',
      notIncluded: [
        'White-Label Branding (Enterprise Only)',
        'Universal Webhooks & REST API (Enterprise Only)'
      ],
      ctaText: 'Get Started',
      ctaType: 'outline'
    },
    {
      name: 'Commercial Unlimited ATS',
      tier: 'Commercial Agency',
      priceMonthly: 799,
      priceYearly: 649,
      interviewLimit: 'Unlimited Jobs · Unlimited Recruiter Seats',
      limitSubtext: 'Zero seat penalties · Enterprise commercial scale',
      description: 'Built for enterprise staffing agencies & multi-client recruitment operations without per-seat taxes.',
      badge: 'RECOMMENDED',
      highlight: '#2563eb',
      popular: true,
      features: [
        { title: 'Everything in Growth Pro ATS included', note: null },
        { title: 'Unlimited Active Requisitions & Recruiter Seats', note: 'Scale your team without per-seat fees' },
        { title: 'Full Anti-Cheat Lockout Engine', note: 'Strict proctoring & tab violation enforcement' },
        { title: 'AI Document Verification (Driver License / Visa)', note: 'Identity & work authorization validation using AI' },
        { title: 'Automated Daily Trending Direct Clients', note: 'Real-time hiring manager discovery' },
        { title: 'Full Candidate Vault & Submittal History Intelligence', note: 'Search past resumes instantly' },
        { title: 'Dedicated Account Manager & 24/7 SLA Support', note: null },
      ],
      systemIntegration: 'Dedicated Support + Direct Client Discovery',
      notIncluded: [
        'Custom Dedicated Cloud Server Instance'
      ],
      ctaText: 'Get Unlimited ATS',
      ctaType: 'primary'
    },
    {
      name: 'Enterprise ATS',
      tier: 'Enterprise Custom',
      priceMonthly: null,
      priceYearly: null,
      interviewLimit: 'Unlimited Everything · Dedicated Cloud Instance',
      limitSubtext: 'Complete white-labeling & private cloud infrastructure',
      description: 'Tailored contracts for enterprise staffing firms requiring full agency white-labeling & API integrations.',
      badge: 'ENTERPRISE',
      highlight: '#0f172a',
      popular: false,
      features: [
        { title: 'Everything in Commercial ATS included', note: null },
        { title: 'Unlimited Everything (Jobs, Seats & Sourcing)', note: 'Zero volume or seat limits' },
        { title: 'Complete White-Label Agency Branding', note: 'Your agency logo, custom domain, branded portal & email' },
        { title: 'Universal Webhooks & REST API Integrations', note: 'Sync candidate data & status with external systems' },
        { title: 'Single Sign-On (SSO / SAML 2.0 / Okta)', note: 'Enterprise identity security' },
        { title: 'Dedicated Isolated Cloud Server Instance', note: 'Private database & custom storage' },
        { title: 'Dedicated 24/7 Account Director & Support', note: 'Direct executive escalation' },
      ],
      systemIntegration: 'White-Label Portal + Full API & Webhooks',
      notIncluded: [],
      ctaText: 'Contact Enterprise Sales',
      ctaType: 'dark'
    }
  ]

  // All-In-One Combined Bundle Plans (SmartHire ATS + SmartScreen AI Unified — 35% OFF)
  const bundlePlans = [
    {
      name: 'Starter Combo',
      tier: 'Boutique Desks',
      priceMonthly: 159,
      priceYearly: 129,
      originalPriceMonthly: 248,
      originalPriceYearly: 198,
      savingsBadge: 'SAVE 35%',
      interviewLimit: '5 Active Jobs · 3 Seats · 60 AI Video Screens/mo',
      limitSubtext: 'Individual value $248/mo · Save 35% with unified bundle',
      description: 'Complete ATS candidate pipeline plus asynchronous video & audio pre-screening.',
      badge: 'COMBO SAVINGS',
      highlight: '#0284c7',
      popular: false,
      features: [
        { title: 'SmartHire ATS: 5 Active Jobs & 3 Recruiter Seats', note: 'Full Kanban candidate pipeline' },
        { title: 'SmartScreen AI: 60 AI Video & Voice Interviews / mo', note: 'Zero-login candidate screening' },
        { title: 'Automated Speech-to-Text Verbatim Transcripts', note: 'Fast, accurate candidate audio transcription using AI' },
        { title: 'AI Match Score & Candidate Ranking', note: 'Requisition fit rating 0–100%' },
        { title: 'Candidate Email Automation & Invite Links', note: '1-click workflow dispatch' },
        { title: 'Anti-Cheat Tab Lock & Geolocation', note: 'Monitors candidate focus & IP location' },
        { title: 'Standard Email & Ticket Support', note: null },
      ],
      systemIntegration: 'Unified In-App Recruiting & Screening',
      notIncluded: [
        'Automated AI Resume & Email Parser',
        'Vendor Hotlist Excel Grid Ingestion',
        'White-Label Branding (Enterprise Only)'
      ],
      ctaText: 'Get Starter Combo',
      ctaType: 'outline'
    },
    {
      name: 'Growth Pro Combo',
      tier: 'Recruiting Powerhouse',
      priceMonthly: 429,
      priceYearly: 339,
      originalPriceMonthly: 668,
      originalPriceYearly: 518,
      savingsBadge: 'SAVE 35%',
      interviewLimit: '25 Active Jobs · 10 Seats · 300 AI Video Screens/mo',
      limitSubtext: 'Individual value $668/mo · Save 35% with unified bundle',
      description: 'The ultimate agency engine: Unified ATS, automated resume parser, hotlists, submittal packs, and 300 video interviews.',
      badge: null,
      highlight: '#2563eb',
      popular: false,
      features: [
        { title: 'SmartHire ATS: 25 Active Jobs & 10 Recruiter Seats', note: 'Hierarchy & supervisor reporting' },
        { title: 'SmartScreen AI: 300 AI Video & Voice Interviews / mo', note: 'Embedded right into candidate profiles' },
        { title: 'Automated AI Resume & Email Parser', note: 'PDF, DOCX, TXT instant skill extraction' },
        { title: 'Vendor Hotlist Excel Grid Ingestion', note: 'Instant bench & vendor candidate matching' },
        { title: '1-Click Client Submittal Pack Generator', note: 'Formatted client coversheet & branded resume' },
        { title: 'Universal ATS Webhooks + REST API Access', note: 'Bi-directional system sync' },
        { title: 'Anti-Cheat Full Screen Lock & Telemetry', note: 'Strict proctoring & suspicious activity detection' },
        { title: 'Priority Recruiter Chat & Phone Support', note: '<2hr SLA' },
      ],
      systemIntegration: 'Full ATS Suite + Hotlists + Video Screening',
      notIncluded: [
        'White-Label Agency Branding (Enterprise Only)'
      ],
      ctaText: 'Get Growth Combo',
      ctaType: 'outline'
    },
    {
      name: 'Commercial All-Unlimited Combo',
      tier: 'Commercial Scale',
      priceMonthly: 875,
      priceYearly: 699,
      originalPriceMonthly: 1348,
      originalPriceYearly: 1098,
      savingsBadge: 'SAVE 35%',
      interviewLimit: 'UNLIMITED Jobs · UNLIMITED Seats · UNLIMITED Video Screens',
      limitSubtext: 'Individual value $1,348/mo · Save 35%! ($500+ Commercial Scale)',
      description: 'Zero volume or seat limits anywhere. Unlimited requisitions, unlimited recruiter seats, and unlimited candidate video screening for your entire staffing agency.',
      badge: 'RECOMMENDED · BEST VALUE',
      highlight: '#2563eb',
      popular: true,
      features: [
        { title: 'UNLIMITED Active Requisitions & UNLIMITED Recruiter Seats', note: 'Zero per-seat penalties forever' },
        { title: 'UNLIMITED Candidate AI Video & Voice Interviews', note: 'Zero per-interview overage fees' },
        { title: 'Automated AI Resume & Email Parser (Unlimited)', note: 'Continuous talent ingestion' },
        { title: 'Vendor Hotlist Excel Grid Ingestion Engine', note: 'Instant candidate-to-req matching' },
        { title: '1-Click Client Submittal Pack Generator', note: 'Formatted client coversheet & branded resume' },
        { title: 'AI Document Verification (Driver License / Visa)', note: 'Authenticity & work authorization checks' },
        { title: 'Full Anti-Cheat Proctoring Engine & Screen Share', note: 'Desktop screen share & violation logging' },
        { title: 'Automated Daily Trending Direct Clients', note: 'Real-time hiring manager radar' },
        { title: 'Dedicated Account Manager & 24/7 Priority SLA', note: 'Direct executive escalation' },
      ],
      systemIntegration: 'Complete All-In-One Enterprise Machine',
      notIncluded: [],
      ctaText: 'Get All-Unlimited Bundle',
      ctaType: 'primary'
    },
    {
      name: 'Enterprise Dedicated Combo',
      tier: 'Enterprise Custom',
      priceMonthly: null,
      priceYearly: null,
      originalPriceMonthly: null,
      originalPriceYearly: null,
      savingsBadge: null,
      interviewLimit: 'Dedicated Infrastructure & Full Agency White-Label',
      limitSubtext: 'Custom deployment tailored to your enterprise',
      description: 'Custom architecture for enterprise staffing corporations, MSPs & high-volume VMS suppliers.',
      badge: 'ENTERPRISE',
      highlight: '#0f172a',
      popular: false,
      features: [
        { title: 'Unlimited Everything Across ATS & Screening', note: 'Zero boundaries' },
        { title: 'Complete White-Label Agency Branding', note: 'Your logo, custom domain, branded candidate portal' },
        { title: 'Dedicated Isolated Cloud Infrastructure', note: 'Private database & single-tenant compute' },
        { title: 'Universal Webhooks & Full REST API Suite', note: 'Enterprise integration' },
        { title: 'Single Sign-On (SSO / SAML 2.0 / Okta)', note: 'Enterprise identity security' },
        { title: 'Custom AI Scoring Calibration', note: 'Calibrated to your agency evaluation rubrics' },
        { title: 'Dedicated 24/7 Account Director', note: 'Executive support' },
      ],
      systemIntegration: 'White-Label Portal + Dedicated Infrastructure',
      notIncluded: [],
      ctaText: 'Contact Enterprise Sales',
      ctaType: 'dark'
    }
  ]

  const activePlans = productTab === 'smartscreen'
    ? smartScreenPlans
    : productTab === 'ats'
    ? atsPlans
    : bundlePlans

  const handleLaunchPayment = ({ amountInPaise, planName }) => {
    setIsProcessingPayment(true)
    setPaymentPlanName(planName)
    setPaymentError(null)
    setPaymentResult(null)

    initiateRazorpayCheckout({
      amountInPaise: amountInPaise || 100,
      currency: 'INR',
      planName: planName || 'SmartHire Subscription',
      userEmail: 'omkesh@coolsofttech.com',
      userName: 'Recruiter Admin',
      userPhone: '9876543210',
      onSuccess: (data) => {
        setIsProcessingPayment(false)
        setPaymentResult(data)
      },
      onFailure: (err) => {
        setIsProcessingPayment(false)
        setPaymentError(err.message || 'Payment failed or cancelled.')
      },
      onDismiss: () => {
        setIsProcessingPayment(false)
      }
    }).catch((err) => {
      setIsProcessingPayment(false)
      setPaymentError(err.message)
    })
  }

  const handleCta = (plan) => {
    if (plan.name.includes('Enterprise')) {
      window.location.href = '/about?section=inquiry#inquiry'
      return
    }
    // Trigger Razorpay Standard Web Checkout
    handleLaunchPayment({
      amountInPaise: 100, // ₹1.00 Test Mode (100 paise)
      planName: `${plan.name} (${isYearly ? 'Annual' : 'Monthly'})`
    })
  }

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 16px' }}>

      {/* ── Product Switcher (Sleek Apple/Linear style segmented control) ── */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{
          display: 'inline-flex',
          background: '#f1f5f9',
          padding: '6px',
          borderRadius: '9999px',
          border: '1px solid #e2e8f0',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
          gap: '6px',
          maxWidth: '100%',
          overflowX: 'auto'
        }}>
          <button
            type="button"
            onClick={() => setProductTab('smartscreen')}
            style={{
              padding: '10px 20px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '700',
              transition: 'all 0.2s ease',
              background: productTab === 'smartscreen' ? '#2563eb' : 'transparent',
              color: productTab === 'smartscreen' ? '#ffffff' : '#475569',
              boxShadow: productTab === 'smartscreen' ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>SmartScreen AI (Video Screening)</span>
            <span style={{
              background: productTab === 'smartscreen' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
              color: productTab === 'smartscreen' ? '#ffffff' : '#0f172a',
              fontSize: '10px',
              fontWeight: '800',
              padding: '2px 8px',
              borderRadius: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Works with Any ATS
            </span>
          </button>

          <button
            type="button"
            onClick={() => setProductTab('ats')}
            style={{
              padding: '10px 20px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '700',
              transition: 'all 0.2s ease',
              background: productTab === 'ats' ? '#0f172a' : 'transparent',
              color: productTab === 'ats' ? '#ffffff' : '#475569',
              boxShadow: productTab === 'ats' ? '0 2px 8px rgba(15,23,42,0.25)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>SmartHire ATS OS (Recruiting Suite)</span>
            <span style={{
              background: productTab === 'ats' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
              color: productTab === 'ats' ? '#ffffff' : '#0f172a',
              fontSize: '10px',
              fontWeight: '800',
              padding: '2px 8px',
              borderRadius: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Full ATS Pipeline
            </span>
          </button>

          <button
            type="button"
            onClick={() => setProductTab('bundle')}
            style={{
              padding: '10px 20px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '700',
              transition: 'all 0.2s ease',
              background: productTab === 'bundle' ? '#059669' : 'transparent',
              color: productTab === 'bundle' ? '#ffffff' : '#475569',
              boxShadow: productTab === 'bundle' ? '0 2px 8px rgba(5,150,105,0.3)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>Combined Super-Bundle</span>
            <span style={{
              background: productTab === 'bundle' ? 'rgba(255,255,255,0.25)' : '#dcfce7',
              color: productTab === 'bundle' ? '#ffffff' : '#15803d',
              fontSize: '10px',
              fontWeight: '800',
              padding: '2px 8px',
              borderRadius: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Save 35% OFF
            </span>
          </button>
        </div>
      </div>

      {/* ── Modern Minimal Header ── */}
      <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 28px' }}>
        <div style={{
          display: 'inline-block',
          fontSize: '11px',
          fontWeight: '800',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: productTab === 'bundle' ? '#059669' : productTab === 'ats' ? '#0f172a' : '#2563eb',
          background: productTab === 'bundle' ? '#ecfdf5' : productTab === 'ats' ? '#f1f5f9' : '#eff6ff',
          border: productTab === 'bundle' ? '1px solid #a7f3d0' : productTab === 'ats' ? '1px solid #e2e8f0' : '1px solid #dbeafe',
          padding: '5px 14px',
          borderRadius: '9999px',
          marginBottom: '12px'
        }}>
          {productTab === 'smartscreen'
            ? 'STANDALONE CANDIDATE SCREENING · INTEGRATES WITH ANY ATS'
            : productTab === 'ats'
            ? 'COMPLETE RECRUITING OS · ZERO SEAT PENALTIES'
            : 'ALL-IN-ONE RECRUITING & SCREENING MACHINE · 35% BUNDLE SAVINGS'}
        </div>

        <h2 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '32px',
          fontWeight: '800',
          letterSpacing: '-0.03em',
          color: '#0f172a',
          margin: '0 0 10px',
          lineHeight: '1.25'
        }}>
          {productTab === 'smartscreen'
            ? 'AI Video & Voice Screening with Transparent Limits'
            : productTab === 'ats'
            ? 'One Complete Recruiting Platform. Zero Extra Add-Ons.'
            : 'SmartHire ATS + SmartScreen AI Unified for 35% Less'}
        </h2>

        <p style={{
          fontSize: '15px',
          color: '#64748b',
          lineHeight: '1.6',
          margin: '0 auto 20px',
          maxWidth: '660px'
        }}>
          {productTab === 'smartscreen'
            ? 'Plug asynchronous AI video, voice, and proctored evaluations directly into Bullhorn, Greenhouse, Lever, or Workday in minutes.'
            : productTab === 'ats'
            ? 'Unify candidate pipeline, automated resume intake, vendor hotlists, and client submittal packs in one subscription.'
            : 'Equip your team with the full ATS sourcing suite and autonomous AI video screening under one single cost-effective invoice.'}
        </p>

        {!isStandalonePage && (
          <div style={{ marginBottom: '18px' }}>
            <a
              href="/smartscreen"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#2563eb',
                textDecoration: 'none',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                padding: '5px 14px',
                borderRadius: '20px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Explore SmartScreen AI Features & Candidate Video Demo</span>
              <span>→</span>
            </a>
          </div>
        )}

        {/* ── Monthly / Yearly Billing Toggle ── */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          background: '#ffffff',
          padding: '6px 14px',
          borderRadius: '30px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <span style={{
            fontSize: '13px',
            fontWeight: !isYearly ? '700' : '500',
            color: !isYearly ? '#0f172a' : '#64748b',
            cursor: 'pointer'
          }} onClick={() => setIsYearly(false)}>
            Monthly Billing
          </span>

          <button
            type="button"
            onClick={() => setIsYearly(!isYearly)}
            style={{
              position: 'relative',
              width: '46px',
              height: '24px',
              borderRadius: '9999px',
              background: isYearly ? '#2563eb' : '#cbd5e1',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
              padding: 0
            }}
            aria-label="Toggle Billing Frequency"
          >
            <span style={{
              position: 'absolute',
              top: '2px',
              left: isYearly ? '24px' : '2px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'left 0.2s ease'
            }} />
          </button>

          <span style={{
            fontSize: '13px',
            fontWeight: isYearly ? '700' : '500',
            color: isYearly ? '#0f172a' : '#64748b',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }} onClick={() => setIsYearly(true)}>
            <span>Annual Billing</span>
            <span style={{
              background: '#dcfce7',
              color: '#15803d',
              fontSize: '10.5px',
              fontWeight: '800',
              padding: '2px 8px',
              borderRadius: '10px',
              letterSpacing: '0.02em'
            }}>
              Save up to 25%
            </span>
          </span>
        </div>
      </div>

      {/* ── ATS + SmartScreen Combined Bundle Banner / Quick Navigation Strip ── */}
      {productTab !== 'bundle' ? (
        <div style={{
          background: '#f8fafc',
          border: '1.5px dashed #93c5fd',
          borderRadius: '14px',
          padding: '14px 22px',
          margin: '0 auto 36px',
          maxWidth: '1020px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                Want Both? Combine SmartHire ATS + SmartScreen AI and get 35% OFF
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                Get unlimited candidate video screening + full recruitment ATS pipeline under one unified enterprise license.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setProductTab('bundle')}
            style={{
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s ease'
            }}
          >
            View Combined Bundle (35% OFF) ➔
          </button>
        </div>
      ) : (
        <div style={{
          background: '#f0fdf4',
          border: '1.5px solid #86efac',
          borderRadius: '14px',
          padding: '14px 22px',
          margin: '0 auto 36px',
          maxWidth: '1020px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#166534' }}>
                Viewing Unified Super-Bundle (ATS + Video Screening Combined · 35% Savings)
              </div>
              <div style={{ fontSize: '12.5px', color: '#15803d', marginTop: '2px' }}>
                Need only a single tool? You can subscribe individually to SmartScreen AI or SmartHire ATS OS anytime.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setProductTab('smartscreen')}
              style={{
                background: '#ffffff',
                color: '#1e293b',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Video Only
            </button>
            <button
              type="button"
              onClick={() => setProductTab('ats')}
              style={{
                background: '#ffffff',
                color: '#1e293b',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ATS Only
            </button>
          </div>
        </div>
      )}

      {/* ── Razorpay Payment Success Notification ── */}
      {paymentResult && (
        <div style={{
          background: '#ecfdf5',
          border: '1.5px solid #6ee7b7',
          borderRadius: '14px',
          padding: '24px 28px',
          maxWidth: '1020px',
          margin: '0 auto 32px',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '100%' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#10b981',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '3px 10px',
                borderRadius: '20px',
                marginBottom: '8px'
              }}>
                Payment Signature Verified (HMAC-SHA256 Match)
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#065f46', margin: '4px 0 8px' }}>
                Payment Successfully Completed & Verified!
              </h3>
              <p style={{ fontSize: '14px', color: '#047857', margin: '0 0 16px', lineHeight: 1.5 }}>
                Your Razorpay transaction was successfully captured and verified against the backend signature key.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', background: '#ffffff', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '14px 18px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Payment ID</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{paymentResult.payment_id || paymentResult.razorpay_payment_id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Order ID</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{paymentResult.order_id || paymentResult.razorpay_order_id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Plan / Service</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{paymentResult.planName || 'SmartHire Subscription'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Verification Status</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#16a34a' }}>PAID & VERIFIED</div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPaymentResult(null)}
              style={{ background: 'none', border: 'none', fontSize: '18px', color: '#059669', cursor: 'pointer', padding: '4px' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Payment Error Notice ── */}
      {paymentError && (
        <div style={{
          background: '#fef2f2',
          border: '1.5px solid #fca5a5',
          borderRadius: '12px',
          padding: '16px 20px',
          maxWidth: '1020px',
          margin: '0 auto 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#991b1b' }}>Payment Notice</div>
            <div style={{ fontSize: '13px', color: '#b91c1c', marginTop: '2px' }}>{paymentError}</div>
          </div>
          <button
            type="button"
            onClick={() => setPaymentError(null)}
            style={{ background: 'none', border: 'none', fontSize: '16px', color: '#991b1b', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Modern Pricing Cards Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
        gap: '24px',
        alignItems: 'stretch',
        marginBottom: '56px'
      }}>
        {activePlans.map((plan) => {
          const price = isYearly ? plan.priceYearly : plan.priceMonthly
          const isEnterprise = !price

          return (
            <div
              key={plan.name}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: plan.popular ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                padding: '32px 26px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: plan.popular
                  ? '0 14px 34px rgba(37,99,235,0.14)'
                  : '0 4px 16px rgba(15,23,42,0.04)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '24px',
                  background: plan.popular ? '#2563eb' : '#0f172a',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '800',
                  letterSpacing: '0.06em',
                  padding: '4px 14px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Plan Title & Subtitle */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: plan.popular ? '#2563eb' : '#64748b', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  {plan.tier}
                </div>
                <h3 style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '22px',
                  fontWeight: '800',
                  color: '#0f172a',
                  margin: 0,
                  lineHeight: '1.25'
                }}>
                  {plan.name}
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '8px', marginBottom: 0, minHeight: '44px', lineHeight: '1.5' }}>
                  {plan.description}
                </p>
              </div>

              {/* Price Display */}
              <div style={{ paddingBottom: '18px', borderBottom: '1px solid #f1f5f9', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                  {isEnterprise ? (
                    <span style={{ fontSize: '34px', fontWeight: '800', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Custom
                    </span>
                  ) : (
                    <>
                      {plan.originalPriceMonthly && (
                        <span style={{
                          fontSize: '19px',
                          color: '#94a3b8',
                          textDecoration: 'line-through',
                          fontWeight: '600',
                          marginRight: '2px'
                        }}>
                          ${isYearly ? plan.originalPriceYearly : plan.originalPriceMonthly}
                        </span>
                      )}
                      <span style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>$</span>
                      <span style={{ fontSize: '44px', fontWeight: '800', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1 }}>
                        {price}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>/month</span>
                      {plan.savingsBadge && (
                        <span style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          fontSize: '10.5px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          marginLeft: 'auto'
                        }}>
                          {plan.savingsBadge}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {!isEnterprise && (
                  <div style={{ fontSize: '12px', color: isYearly ? '#16a34a' : '#64748b', fontWeight: '600', marginTop: '6px' }}>
                    {isYearly ? `Billed annually ($${price * 12}/yr)` : 'Billed monthly · Cancel anytime'}
                  </div>
                )}
              </div>

              {/* Prominent Limit Callout Box */}
              <div style={{
                background: plan.popular ? '#eff6ff' : '#f8fafc',
                border: plan.popular ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', color: plan.popular ? '#1d4ed8' : '#475569', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  {productTab === 'ats' ? 'Requisition & Recruiter Scope' : productTab === 'bundle' ? 'Unified Package Scope' : 'Candidate Interview Limit'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', lineHeight: '1.35' }}>
                  {plan.interviewLimit}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                  {plan.limitSubtext}
                </div>
              </div>

              {/* System Integration Pill if applicable */}
              {plan.systemIntegration && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#1d4ed8',
                  background: '#eff6ff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  marginBottom: '18px'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <span>{plan.systemIntegration}</span>
                </div>
              )}

              {/* Feature Checklist */}
              <div style={{ flex: 1, marginBottom: '24px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: '12px' }}>
                  Features Included:
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px' }}>
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#334155', lineHeight: 1.45 }}>
                      <span style={{ color: '#16a34a', fontWeight: '800', flexShrink: 0, marginTop: '1px' }}>✓</span>
                      <div>
                        <strong style={{ color: '#0f172a', fontWeight: '700' }}>{feat.title}</strong>
                        {feat.note && (
                          <span style={{ display: 'block', fontSize: '11.5px', color: '#64748b', marginTop: '2px', lineHeight: '1.4' }}>
                            {feat.note}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Exclusions */}
                {plan.notIncluded && plan.notIncluded.length > 0 && (
                  <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed #e2e8f0' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
                      {plan.notIncluded.map((feat, fIdx) => (
                        <li key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                          <span style={{ color: '#cbd5e1', fontWeight: '700', flexShrink: 0 }}>✕</span>
                          <span style={{ textDecoration: 'line-through' }}>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  onClick={() => handleCta(plan)}
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: plan.ctaType === 'outline' ? '1.5px solid #cbd5e1' : 'none',
                    background: plan.ctaType === 'primary' ? '#2563eb' : plan.ctaType === 'dark' ? '#0f172a' : '#ffffff',
                    color: plan.ctaType === 'primary' || plan.ctaType === 'dark' ? '#ffffff' : '#0f172a',
                    boxShadow: plan.ctaType === 'primary' ? '0 4px 14px rgba(37,99,235,0.28)' : 'none'
                  }}
                >
                  {plan.ctaText}
                </button>
              </div>

            </div>
          )
        })}
      </div>

    </div>
  )
}
