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

  // Standalone SmartScreen AI Plans (for recruiting teams and staffing agencies)
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
        { title: '15-Day Cloud Video & Interview Storage', note: 'Encrypted storage with instant replay' },
        { title: 'Standard Email & Ticket Support', note: null },
      ],
      systemIntegration: null,
      notIncluded: [
        'Custom Agency White-Label Branding',
        'Extended Cloud Video Storage',
        'Desktop Screen Share Proctoring',
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
      description: 'For growing staffing firms requiring branded candidate evaluation reports & custom questions.',
      badge: null,
      highlight: '#2563eb',
      popular: false,
      features: [
        { title: '300 AI Video & Audio Interviews / month', note: 'Scalable candidate evaluation pipeline' },
        { title: 'Shareable Client Review Links', note: 'Instant 1-click candidate preview link for hiring managers' },
        { title: 'SmartSign RTR & Rate Lock Intake', note: 'Digital Right-to-Represent agreement & rate lock' },
        { title: 'Custom Agency White-Label Branding', note: 'Your logo, primary color & company name' },
        { title: 'Downloadable Branded PDF Scorecards', note: 'Client-ready candidate evaluation report' },
        { title: 'Timed Question Prompts with Countdown Controls', note: 'Configurable time limits per question (60s, 90s, 120s)' },
        { title: 'Work Auth & Salary Expectation Intake', note: 'Auto-captures visa & compensation fit' },
        { title: '45-Day Cloud Video & Interview Storage', note: 'Extended cloud retention' },
        { title: 'Priority Recruiter Chat & Email Support', note: '<2hr response SLA' },
      ],
      systemIntegration: 'Shareable Client Links & 1-Click PDF Reports',
      notIncluded: [
        'Desktop Screen Share Proctoring (Commercial Only)',
        'Dedicated Enterprise Instance'
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
      description: 'For high-volume staffing agencies & enterprise clients needing unlimited candidate video interviews & advanced proctoring.',
      badge: 'RECOMMENDED',
      highlight: '#2563eb',
      popular: true,
      features: [
        { title: 'Unlimited AI Video & Audio Interviews / month', note: 'Zero per-interview overage fees ever' },
        { title: 'Multi-Recruiter Pipeline & Team Tracking', note: 'Track submissions and candidate progress across your team' },
        { title: 'Verified Geolocation & Network Telemetry', note: 'Device GPS coordinates and IP integrity verification' },
        { title: 'Full Anti-Cheat Proctoring Engine', note: 'Desktop screen share & suspicious activity audit' },
        { title: 'Bulk Candidate Invite Dispatch', note: '1-click batch screening invites via email or messaging' },
        { title: 'Custom Job Description Question Generator', note: 'Tailors questions to client JDs using AI' },
        { title: '90-Day Cloud Video & Interview Storage', note: 'Compliance-ready archive' },
        { title: 'Dedicated Solutions Engineer & Priority Support', note: 'Hands-on workflow onboarding' },
      ],
      systemIntegration: 'Full Anti-Cheat Proctoring + Unlimited Screenings',
      notIncluded: [],
      ctaText: 'Get Unlimited Screen',
      ctaType: 'primary'
    },
    {
      name: 'Enterprise Custom',
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
        { title: 'Custom System Integrations on Request', note: 'Tailored workflows for internal systems' },
        { title: 'Google Workspace & Corporate Email Auth', note: 'Secure organizational access control' },
        { title: 'Custom AI Scoring Calibration', note: 'Calibrated to your agency evaluation rubrics' },
        { title: 'Dedicated 24/7 Account Director', note: 'Direct executive escalation' },
      ],
      systemIntegration: 'Custom Enterprise Architecture + Dedicated SLA',
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
        'Custom Multi-Tenant Setup (Enterprise Only)'
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
        { title: 'SmartSign RTR & Document Intake Locker', note: 'Digital Right-to-Represent agreements & compliance storage' },
        { title: 'Automated Requisition Sync & JD Parsing', note: 'Instant job intake and role requirements extraction' },
        { title: 'Full Candidate Vault & Submittal History Intelligence', note: 'Search past resumes instantly' },
        { title: 'Dedicated Account Manager & 24/7 SLA Support', note: null },
      ],
      systemIntegration: 'Dedicated Support + Full ATS Engine',
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
        { title: 'Custom ATS Data Migration & Export Engine', note: 'Complete export to standardized Excel/CSV records' },
        { title: 'Corporate Identity & Role-Based Access Control', note: 'Granular multi-tier permissions' },
        { title: 'Dedicated Isolated Cloud Server Instance', note: 'Private database & custom storage' },
        { title: 'Dedicated 24/7 Account Director & Support', note: 'Direct executive escalation' },
      ],
      systemIntegration: 'White-Label Portal + Dedicated Infrastructure',
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
        { title: '15-Day Cloud Video & Interview Storage', note: 'Encrypted storage with instant replay' },
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
        { title: 'Multi-Role Hierarchy & Supervisor Approvals', note: 'Manager approval queues before client submittal' },
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
        { title: 'SmartSign RTR & Work Auth Document Locker', note: 'Digital signature and authorization record storage' },
        { title: 'Full Anti-Cheat Proctoring Engine & Screen Share', note: 'Desktop screen share & violation logging' },
        { title: 'Automated Requisition Sync & Auto-Match', note: 'Instant candidate fit alerts upon job ingestion' },
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
        { title: 'Custom Workflow Integration on Request', note: 'Tailored enterprise configuration' },
        { title: 'Corporate Identity & Role-Based Access Control', note: 'Enterprise team security' },
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
            ? 'Deploy asynchronous AI video, voice, and proctored candidate evaluations to qualify talent 10x faster.'
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
                borderRadius: '12px',
                border: plan.popular ? '2px solid #8B3A82' : '1px solid #DDDDDD',
                padding: plan.popular ? '0 24px 28px 24px' : '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: plan.popular
                  ? '0 10px 30px rgba(139, 58, 130, 0.12)'
                  : '0 2px 8px rgba(0,0,0,0.04)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              {/* Slack-style Top Banner for RECOMMENDED Plan */}
              {plan.popular && (
                <div style={{
                  background: '#8B3A82',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '800',
                  letterSpacing: '0.08em',
                  padding: '7px 0',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  borderTopLeftRadius: '10px',
                  borderTopRightRadius: '10px',
                  margin: '0 -24px 22px -24px'
                }}>
                  RECOMMENDED
                </div>
              )}

              {/* Enterprise Badge if non-popular */}
              {!plan.popular && plan.badge && (
                <div style={{
                  position: 'absolute',
                  top: '-11px',
                  right: '20px',
                  background: '#1D1C1D',
                  color: '#ffffff',
                  fontSize: '10.5px',
                  fontWeight: '800',
                  letterSpacing: '0.06em',
                  padding: '3px 12px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase'
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Plan Title & Subtitle */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: plan.popular ? '#8B3A82' : '#616061', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  {plan.tier}
                </div>
                <h3 style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: '#1D1C1D',
                  margin: 0,
                  lineHeight: '1.25'
                }}>
                  {plan.name}
                </h3>
                <p style={{ fontSize: '13.5px', color: '#616061', marginTop: '6px', marginBottom: 0, minHeight: '40px', lineHeight: '1.45' }}>
                  {plan.description}
                </p>
              </div>

              {/* Price Display (Matching Slack Screenshot) */}
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #EEEEEE', marginBottom: '18px' }}>
                {isEnterprise ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '48px' }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1D1C1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: '#1D1C1D' }}>
                        Contact sales for pricing
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#616061', marginTop: '4px' }}>
                      Custom enterprise SLA & multi-tenant deployment
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' }}>
                      {plan.originalPriceMonthly && (
                        <span style={{
                          fontSize: '18px',
                          color: '#868686',
                          textDecoration: 'line-through',
                          fontWeight: '500',
                          marginRight: '4px'
                        }}>
                          ${isYearly ? plan.originalPriceYearly : plan.originalPriceMonthly}
                        </span>
                      )}
                      <span style={{ fontSize: '22px', fontWeight: '600', color: '#1D1C1D' }}>$</span>
                      <span style={{ fontSize: '42px', fontWeight: '800', color: '#1D1C1D', lineHeight: 1, letterSpacing: '-0.02em' }}>
                        {price}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#616061', marginLeft: '4px' }}>
                        USD
                      </span>
                      {plan.savingsBadge && (
                        <span style={{
                          background: '#E6F4EA',
                          color: '#137333',
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          marginLeft: 'auto'
                        }}>
                          {plan.savingsBadge}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#616061', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{isYearly ? 'per month, billed annually' : 'per month, billed monthly'}</span>
                      <span title="Billed annually for maximum savings" style={{ cursor: 'help', color: '#868686', fontSize: '12px' }}>ⓘ</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button — Placed Directly Under Price matching Slack Screenshot */}
              <div style={{ marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => handleCta(plan)}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: plan.popular ? 'none' : isEnterprise ? '1.5px solid #1D1C1D' : '1.5px solid #007A5A',
                    background: plan.popular ? '#007A5A' : '#ffffff',
                    color: plan.popular ? '#ffffff' : isEnterprise ? '#1D1C1D' : '#007A5A',
                    boxShadow: plan.popular ? '0 1px 3px rgba(0,0,0,0.12)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (plan.popular) e.currentTarget.style.backgroundColor = '#00674c'
                    else e.currentTarget.style.backgroundColor = isEnterprise ? '#F8FAFC' : '#F4FBF7'
                  }}
                  onMouseLeave={(e) => {
                    if (plan.popular) e.currentTarget.style.backgroundColor = '#007A5A'
                    else e.currentTarget.style.backgroundColor = '#ffffff'
                  }}
                >
                  {plan.ctaText || 'Upgrade'}
                </button>
              </div>

              {/* Prominent Limit Callout Box */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '800', color: '#616061', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  {productTab === 'ats' ? 'Requisition & Recruiter Scope' : productTab === 'bundle' ? 'Unified Package Scope' : 'Candidate Interview Limit'}
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#1D1C1D', lineHeight: '1.35' }}>
                  {plan.interviewLimit}
                </div>
                <div style={{ fontSize: '11.5px', color: '#616061', marginTop: '3px' }}>
                  {plan.limitSubtext}
                </div>
              </div>

              {/* System Integration Pill if applicable */}
              {plan.systemIntegration && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  color: '#007A5A',
                  background: '#E8F5E9',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <span>{plan.systemIntegration}</span>
                </div>
              )}

              {/* Feature Checklist (Slack-style Violet Checkmark & Info Icon) */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#868686', letterSpacing: '0.06em', marginBottom: '12px' }}>
                  Included Capabilities:
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px' }}>
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', fontSize: '13px', color: '#1D1C1D', lineHeight: 1.45 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ color: '#8B3A82', fontWeight: '800', flexShrink: 0, fontSize: '14px', lineHeight: 1 }}>✓</span>
                        <div>
                          <span style={{ color: '#1D1C1D', fontWeight: feat.note ? '600' : '400' }}>{feat.title}</span>
                          {feat.note && (
                            <span style={{ display: 'block', fontSize: '11.5px', color: '#616061', marginTop: '2px', lineHeight: '1.4' }}>
                              {feat.note}
                            </span>
                          )}
                        </div>
                      </div>
                      <span title={feat.title} style={{ color: '#868686', fontSize: '12px', cursor: 'help', flexShrink: 0, userSelect: 'none' }}>ⓘ</span>
                    </li>
                  ))}
                </ul>

                {/* Exclusions */}
                {plan.notIncluded && plan.notIncluded.length > 0 && (
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #E2E8F0' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {plan.notIncluded.map((feat, fIdx) => (
                        <li key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#868686', lineHeight: 1.4 }}>
                          <span style={{ color: '#CBD5E1', fontWeight: '700', flexShrink: 0 }}>✕</span>
                          <span style={{ textDecoration: 'line-through' }}>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

            </div>
          )
        })}
      </div>

    </div>
  )
}
