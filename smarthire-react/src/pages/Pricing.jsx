import React, { useState } from 'react'
import SiteLayout from '../components/SiteLayout'

// Competitor data for comparison table
const COMPETITORS = [
  {
    name: 'Bullhorn Starter',
    category: 'ATS Only',
    price: '$99',
    unit: '/user/mo',
    aiScreening: false,
    rtrSigning: false,
    hotlistIngestion: false,
    submittalPack: false,
    antiCheat: false,
    docVerification: false,
    color: '#f87171'
  },
  {
    name: 'Bullhorn Core',
    category: 'ATS + LinkedIn',
    price: '$165',
    unit: '/user/mo',
    aiScreening: false,
    rtrSigning: false,
    hotlistIngestion: false,
    submittalPack: false,
    antiCheat: false,
    docVerification: false,
    color: '#f87171'
  },
  {
    name: 'Manatal Pro',
    category: 'Budget ATS',
    price: '$35',
    unit: '/user/mo',
    aiScreening: false,
    rtrSigning: false,
    hotlistIngestion: false,
    submittalPack: false,
    antiCheat: false,
    docVerification: false,
    color: '#fb923c'
  },
  {
    name: 'HireVue',
    category: 'Video Only',
    price: '$35,000',
    unit: '/year',
    aiScreening: true,
    rtrSigning: false,
    hotlistIngestion: false,
    submittalPack: false,
    antiCheat: false,
    docVerification: false,
    color: '#f87171'
  },
  {
    name: 'DocuSign Business',
    category: 'eSign Only',
    price: '$45',
    unit: '/user/mo',
    aiScreening: false,
    rtrSigning: true,
    hotlistIngestion: false,
    submittalPack: false,
    antiCheat: false,
    docVerification: false,
    color: '#fb923c'
  },
  {
    name: 'Recruiterflow',
    category: 'AI-Native ATS',
    price: '$119',
    unit: '/user/mo',
    aiScreening: false,
    rtrSigning: false,
    hotlistIngestion: false,
    submittalPack: false,
    antiCheat: false,
    docVerification: false,
    color: '#f87171'
  },
  {
    name: 'SmartHire Pro',
    category: 'All-in-One ATS',
    price: '$149',
    unit: '/mo flat',
    aiScreening: true,
    rtrSigning: true,
    hotlistIngestion: true,
    submittalPack: true,
    antiCheat: true,
    docVerification: true,
    color: '#10b981',
    isUs: true
  }
]

const FEATURE_COLS = [
  { key: 'aiScreening', label: 'AI Video Screening' },
  { key: 'rtrSigning', label: 'RTR eSignature' },
  { key: 'hotlistIngestion', label: 'Vendor Hotlist Engine' },
  { key: 'submittalPack', label: 'Submittal Pack Generator' },
  { key: 'antiCheat', label: 'Anti-Cheat Proctoring' },
  { key: 'docVerification', label: 'Document Verification' },
]

function CheckIcon({ val }) {
  if (val) return (
    <span style={{ color: '#10b981', fontWeight: '700', fontSize: '14px' }}>✓</span>
  )
  return (
    <span style={{ color: '#cbd5e1', fontSize: '12px' }}>—</span>
  )
}

function Pricing() {
  const [productTab, setProductTab] = useState('ats') // 'ats' | 'smartscreen'
  const [isYearly, setIsYearly] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [activeIntegrationTab, setActiveIntegrationTab] = useState('curl')
  const [copiedSnippet, setCopiedSnippet] = useState(false)

  const handleCopyCode = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2200);
    }
  };

  const plans = [
    {
      name: 'Starter',
      priceMonthly: 49,
      priceYearly: 39,
      description: 'For solo recruiters & boutique staffing desks.',
      badge: null,
      highlight: '#3b82f6',
      features: [
        { text: 'Full ATS Pipeline & Candidate Management', note: null },
        { text: 'AI Video & Voice Screening', note: 'Groq Whisper powered' },
        { text: 'Resume Parser (PDF, Word, TXT)', note: null },
        { text: 'AI Match Score & Fit Verdict', note: null },
        { text: 'Candidate Status Auto-Notifications', note: null },
        { text: 'Anti-Cheat Tab Lock & Geolocation Capture', note: null },
        { text: '3 active requisitions & unlimited applications', note: null },
        { text: 'Standard email support', note: null },
      ],
      notIncluded: ['SmartSign RTR eSignature', 'Vendor Hotlist Ingestion', 'Submittal Pack Generator'],
      cta: 'Start free trial',
      popular: false,
      vsCompetitor: 'Bullhorn Starter alone is $99/user/mo — with no AI screening.'
    },
    {
      name: 'Pro',
      priceMonthly: 149,
      priceYearly: 119,
      description: 'For recruiting teams hiring across multiple client requisitions.',
      badge: 'Most Popular',
      highlight: '#2563eb',
      features: [
        { text: 'Everything in Starter', note: null },
        { text: '10 active requisitions & up to 5 team members', note: null },
        { text: 'SmartSign RTR eSignature', note: 'Replaces DocuSign ($45/user/mo)' },
        { text: 'Vendor Hotlist Ingestion (Excel Grid)', note: 'No other ATS has this' },
        { text: 'Submittal Pack Generator', note: '1-click client coversheet' },
        { text: 'Multi-Role Hierarchy (Admin, Manager, Recruiter)', note: null },
        { text: 'Anti-Cheat Screen Share Lock', note: null },
        { text: 'Automated 6-min Job Ingestion Engine', note: null },
        { text: 'Priority recruiter email & chat support', note: null },
      ],
      notIncluded: [],
      cta: 'Start free trial',
      popular: true,
      vsCompetitor: 'Bullhorn ($165/user) + HireVue ($35K/yr) + DocuSign ($45/user) combined = 20x more expensive.'
    },
    {
      name: 'Business',
      priceMonthly: 349,
      priceYearly: 279,
      description: 'For scaling staffing agencies & multi-client operations.',
      badge: null,
      highlight: '#7c3aed',
      features: [
        { text: 'Everything in Pro', note: null },
        { text: 'Unlimited active roles & unlimited recruiter seats', note: null },
        { text: 'Full Anti-Cheat Lockout Engine', note: null },
        { text: 'Groq Vision Document Verification (DL / Visa)', note: null },
        { text: 'White-label Branding (Custom domain & email)', note: null },
        { text: 'Custom AI Questions & Audio Voice Scoring', note: null },
        { text: 'Webhooks, REST API & ATS export integrations', note: null },
        { text: 'Automated Daily Trending Direct Clients Engine', note: null },
        { text: 'Dedicated account manager & 24/7 SLA support', note: null },
      ],
      notIncluded: [],
      cta: 'Start free trial',
      popular: false,
      vsCompetitor: 'Greenhouse Enterprise starts at $25,000/yr — we do more for $349/mo.'
    },
    {
      name: 'Enterprise',
      priceMonthly: null,
      priceYearly: null,
      description: 'Custom contracts for large agencies with 25+ recruiters.',
      badge: 'Custom',
      highlight: '#0f172a',
      features: [
        { text: 'Everything in Business', note: null },
        { text: 'Dedicated cloud instance (isolated)', note: null },
        { text: 'Custom onboarding & data migration', note: null },
        { text: 'SSO / SAML integration', note: null },
        { text: 'VMS Direct Integration (Fieldglass / Beeline)', note: null },
        { text: 'EEOC & compliance reporting', note: null },
        { text: 'SLA-backed 99.9% uptime guarantee', note: null },
        { text: 'Custom AI model fine-tuning for your roles', note: null },
      ],
      notIncluded: [],
      cta: 'Contact Sales',
      popular: false,
      vsCompetitor: 'Workday Recruiting: $35,000–$55,000/yr just for the recruiting module.'
    }
  ]

  const smartScreenPlans = [
    {
      name: 'Starter Screen',
      priceMonthly: 79,
      priceYearly: 59,
      description: 'Add AI video, voice & text candidate screening alongside your existing ATS.',
      badge: null,
      highlight: '#059669',
      features: [
        { text: 'Up to 40 candidate AI video & audio screens / month', note: 'Multi-format: 1-way video, audio, or text' },
        { text: 'Groq Whisper automated speech-to-text transcripts', note: null },
        { text: 'AI fit verdict & per-question scorecards (0-100%)', note: null },
        { text: 'Anti-cheat tab switch lock & IP capture', note: null },
        { text: '1-click shareable candidate screening link generator', note: null },
        { text: 'Instant email candidate invite dispatch', note: null },
        { text: 'Candidate self-scheduling & 24/7 async completion', note: null },
        { text: 'Standard email support & 7-day data retention', note: null },
      ],
      notIncluded: ['Universal ATS Webhooks (Bullhorn/Greenhouse)', 'REST API Link Generator', 'Custom Agency White-Label Branding'],
      cta: 'Start 14-day free trial',
      popular: false,
      vsCompetitor: 'HireVue starts at $35,000/yr. Starter Screen delivers real AI screening for $59/mo.'
    },
    {
      name: 'Growth Pro Screen',
      priceMonthly: 199,
      priceYearly: 159,
      description: 'For fast-growing staffing firms seeking automated ATS webhooks & custom agency branding.',
      badge: 'Most Popular',
      highlight: '#2563eb',
      features: [
        { text: 'Up to 200 candidate AI screens / month', note: null },
        { text: 'Universal Webhooks (Auto-sync to Bullhorn, Greenhouse, Lever, Workday)', note: 'Delivers result payload in <1s' },
        { text: 'Sub-15ms REST API (POST /api/v1/screening/create)', note: 'Zero-overhead endpoint' },
        { text: 'Custom agency branding (Logo & theme on candidate screen)', note: null },
        { text: 'Downloadable branded PDF candidate scorecard', note: null },
        { text: 'Audio voice question prompts (AI speaks questions out loud)', note: null },
        { text: 'Work authorization & salary expectation auto-intake', note: null },
        { text: 'Priority recruiter email & chat support', note: '90-day data retention' },
      ],
      notIncluded: ['Custom Subdomain (screen.agency.com)'],
      cta: 'Start 14-day free trial',
      popular: true,
      vsCompetitor: 'Syncs candidate video scores directly into Bullhorn/Greenhouse candidate notes.'
    },
    {
      name: 'Enterprise & API',
      priceMonthly: 499,
      priceYearly: 399,
      description: 'High-volume agency desks, VMS vendors, and custom ATS platforms needing dedicated scale.',
      badge: 'Enterprise Scale',
      highlight: '#7c3aed',
      features: [
        { text: 'Unlimited candidate AI video & voice screens', note: 'Zero per-screening overage fees' },
        { text: 'Custom Subdomain (screen.youragency.com)', note: 'Complete white-labeling' },
        { text: 'Dedicated webhook dispatcher with HMAC signature verification', note: null },
        { text: 'ATS Embedded Iframe widget (Screen inside your custom CRM)', note: null },
        { text: 'Custom screening question generator tailored to specific JDs', note: null },
        { text: 'EEOC compliant scoring & audit logging', note: null },
        { text: 'Dedicated integration engineer & 99.9% SLA uptime', note: null },
        { text: 'Dedicated account manager & 24/7 phone/Slack support', note: null },
      ],
      notIncluded: [],
      cta: 'Contact Solutions Team',
      popular: false,
      vsCompetitor: 'Full REST API + Webhooks with zero per-seat licensing penalties.'
    }
  ]

  const activePlans = productTab === 'ats' ? plans : smartScreenPlans

  const codeSnippets = {
    curl: `curl -X POST https://smarthireus.com/api/v1/screening/create \\
  -H "Content-Type: application/json" \\
  -d '{
    "candidateName": "Sarah Jenkins",
    "candidateEmail": "sarah.j@example.com",
    "jobTitle": "Senior Full-Stack Engineer",
    "companyName": "Apex Talent Group",
    "webhookUrl": "https://api.youragency.com/webhooks/screening-completed",
    "allowedFormats": ["video", "audio", "text"]
  }'`,
    node: `// Sub-15ms REST API call from your backend or cloud function
import fetch from 'node-fetch';

export async function createScreeningLink(candidate, requisition) {
  const response = await fetch('https://smarthireus.com/api/v1/screening/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      jobTitle: requisition.title,
      companyName: 'Apex Talent Group',
      webhookUrl: 'https://api.youragency.com/webhooks/screening-completed',
      allowedFormats: ['video', 'audio', 'text']
    })
  });

  const data = await response.json();
  // Returns: { success: true, sessionId: "SCR-...", screeningUrl: "https://smarthireus.com/candidate-chat/SCR-..." }
  return data.screeningUrl;
}`,
    webhook: `// Real-Time Webhook Payload delivered to your webhookUrl when candidate completes
{
  "event": "screening.completed",
  "sessionId": "SCR-EXT-1791823901",
  "candidateName": "Sarah Jenkins",
  "candidateEmail": "sarah.j@example.com",
  "jobTitle": "Senior Full-Stack Engineer",
  "aiScore": 91,
  "recommendation": "Strong Fit",
  "aiSummary": "Demonstrated deep proficiency in React, TypeScript, and microservices architecture...",
  "proctoring": {
    "flaggedCount": 0,
    "suspicious": false
  },
  "screeningUrl": "https://smarthireus.com/candidate-chat/SCR-EXT-1791823901",
  "submittedAt": "2026-10-13T01:10:00.000Z"
}`,
    nocode: `// No-Code Workflow (Zero Engineering Required)
1. Recruiter opens SmartScreen Studio in their browser.
2. Selects role & inputs Candidate Name + Email.
3. Copies generated instant link (e.g. smarthireus.com/candidate-chat/SCR-...).
4. Pastes link directly into LinkedIn InMail, Bullhorn email template, or WhatsApp.
5. When candidate completes, full AI dossier & scorecard is emailed instantly to recruiter.`
  }

  return (
    <SiteLayout>
      <section className="pricing-section">
        <div className="container">

          {/* ── Product Switcher (ATS Suite vs SmartScreen Standalone) ── */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              display: 'inline-flex',
              background: '#e2e8f0',
              padding: '4px',
              borderRadius: '32px',
              border: '1px solid #cbd5e1',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => setProductTab('ats')}
                style={{
                  padding: '9px 20px',
                  borderRadius: '28px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '700',
                  transition: 'all 0.2s ease',
                  background: productTab === 'ats' ? '#ffffff' : 'transparent',
                  color: productTab === 'ats' ? '#0f172a' : '#64748b',
                  boxShadow: productTab === 'ats' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                SmartHire ATS Suite (All-In-One)
              </button>
              <button
                type="button"
                onClick={() => setProductTab('smartscreen')}
                style={{
                  padding: '9px 20px',
                  borderRadius: '28px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '700',
                  transition: 'all 0.2s ease',
                  background: productTab === 'smartscreen' ? '#2563eb' : 'transparent',
                  color: productTab === 'smartscreen' ? '#ffffff' : '#64748b',
                  boxShadow: productTab === 'smartscreen' ? '0 2px 6px rgba(37,99,235,0.3)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>SmartScreen AI (Standalone SaaS)</span>
                <span style={{
                  background: productTab === 'smartscreen' ? 'rgba(255,255,255,0.22)' : '#dbeafe',
                  color: productTab === 'smartscreen' ? '#ffffff' : '#1d4ed8',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Works with Any ATS
                </span>
              </button>
            </div>
          </div>

          {/* ── Header ── */}
          <div className="pricing-header-block text-center">
            <span className="pricing-eyebrow">
              {productTab === 'ats' ? 'TRANSPARENT PRICING · NO HIDDEN FEES' : 'USE WITH BULLHORN · GREENHOUSE · LEVER · WORKDAY · OR ANY ATS'}
            </span>
            <h1 className="pricing-title">
              {productTab === 'ats' ? 'One Platform. Five Tools Replaced.' : 'Add AI Video Screening to Your Existing ATS.'}
            </h1>
            <p className="pricing-subtitle">
              {productTab === 'ats'
                ? 'SmartHire unifies ATS + AI Video Screening + RTR eSignature + Vendor Hotlist Engine + Submittal Pack Generator — all in a single subscription. Pay less than what others charge for just one of these tools.'
                : 'Already using Bullhorn, Greenhouse, Lever, Workday, or Ceipal? Connect SmartScreen AI in 3 minutes via universal REST API, Webhooks, or direct candidate links. Replace HireVue ($35,000/yr) with zero migration headaches.'}
            </p>

            {/* Billing Toggle */}
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
                Annual <span className="discount-badge">Save 20%</span>
              </span>
            </div>
          </div>

          {/* ── Value Callout Banner ── */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            borderRadius: '14px',
            padding: '20px 28px',
            margin: '0 auto 44px',
            maxWidth: '960px',
            border: '1px solid rgba(59,130,246,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                {productTab === 'ats' ? 'Why SmartHire Wins on Value' : 'Why SmartScreen AI Outclasses HireVue'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', lineHeight: 1.4 }}>
                {productTab === 'ats' ? (
                  <>
                    Competitors charge <span style={{ color: '#f87171', textDecoration: 'line-through' }}>$35,000+/yr</span> for AI video screening alone.
                    SmartHire includes it from <span style={{ color: '#34d399' }}>$49/mo</span>.
                  </>
                ) : (
                  <>
                    Enterprise video screening costs <span style={{ color: '#f87171', textDecoration: 'line-through' }}>$35,000/yr</span> with lock-in contracts.
                    SmartScreen AI plugs into any ATS from <span style={{ color: '#34d399' }}>$59/mo</span>.
                  </>
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {productTab === 'ats' ? [
                { label: 'ATS (Bullhorn)', cost: '$99/user/mo', smh: 'Included' },
                { label: 'Video Screening (HireVue)', cost: '$35,000/yr', smh: 'Included' },
                { label: 'eSignature (DocuSign)', cost: '$45/user/mo', smh: 'Included' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#f87171', textDecoration: 'line-through' }}>{item.cost}</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#34d399', marginTop: '2px' }}>{item.smh} in SmartHire</div>
                </div>
              )) : [
                { label: 'HireVue Annual Contract', cost: '$35,000/yr', smh: '$59/mo Flat' },
                { label: 'Modern Hire Video', cost: '$25,000/yr', smh: 'Included' },
                { label: 'ATS Integration Fee', cost: '$5,000+ Setup', smh: '$0 Setup' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#f87171', textDecoration: 'line-through' }}>{item.cost}</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#34d399', marginTop: '2px' }}>{item.smh}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Plan Cards ── */}
          <div className="plans-grid">
            {activePlans.map((plan, index) => {
              const currentPrice = isYearly ? plan.priceYearly : plan.priceMonthly
              return (
                <div key={index} className={`plan-card ${plan.popular ? 'popular-card' : ''}`}>
                  {plan.popular && <div className="popular-ribbon">Most Popular</div>}
                  {plan.badge && !plan.popular && (
                    <div style={{
                      position: 'absolute', top: '15px', right: '15px',
                      background: plan.name.includes('Enterprise') ? '#0f172a' : '#7c3aed',
                      color: 'white', fontSize: '10px', fontWeight: '800',
                      padding: '3px 9px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em',
                      border: plan.name.includes('Enterprise') ? '1px solid #334155' : 'none'
                    }}>{plan.badge}</div>
                  )}

                  <div className="plan-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: plan.highlight }} />
                      <h3 className="plan-name" style={{ margin: 0 }}>{plan.name}</h3>
                    </div>
                    <p className="plan-desc">{plan.description}</p>
                    <div className="price-display">
                      {currentPrice ? (
                        <>
                          <span className="currency">$</span>
                          <span className="price-value">{currentPrice}</span>
                          <span className="billing-period">/month</span>
                        </>
                      ) : (
                        <span className="price-value" style={{ fontSize: '28px' }}>Custom</span>
                      )}
                    </div>
                    {isYearly && currentPrice && (
                      <span className="yearly-disclaimer">Billed annually (${currentPrice * 12}/yr)</span>
                    )}
                    {/* vs Competitor note */}
                    <div style={{
                      marginTop: '12px',
                      padding: '8px 10px',
                      background: 'rgba(16,185,129,0.07)',
                      border: '1px solid rgba(16,185,129,0.15)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#059669',
                      lineHeight: 1.45,
                      fontWeight: '500'
                    }}>
                      {plan.vsCompetitor}
                    </div>
                  </div>

                  <div className="plan-divider" />

                  <div className="plan-card-body">
                    <ul className="features-list">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx}>
                          <span className="feat-check">✓</span>
                          <span>
                            {feat.text}
                            {feat.note && (
                              <span style={{ display: 'block', fontSize: '10.5px', color: '#64748b', marginTop: '1px', fontStyle: 'italic' }}>
                                {feat.note}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {plan.notIncluded && plan.notIncluded.length > 0 && (
                      <ul className="features-list" style={{ marginTop: '12px' }}>
                        {plan.notIncluded.map((feat, fIdx) => (
                          <li key={fIdx} style={{ opacity: 0.4 }}>
                            <span style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '14px' }}>✕</span>
                            <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="plan-card-footer">
                    <button
                      type="button"
                      className={`btn plan-cta-btn ${plan.popular ? 'popular-cta' : plan.name.includes('Enterprise') ? 'enterprise-cta' : 'flat-cta'}`}
                      onClick={() => {
                        if (plan.name.includes('Enterprise') || plan.name === 'Enterprise') {
                          window.location.href = '/about?section=inquiry#inquiry'
                        } else {
                          alert(`Redirecting to checkout for ${plan.name} (${productTab === 'ats' ? 'ATS Suite' : 'SmartScreen AI'})...`)
                        }
                      }}
                    >
                      {plan.cta}
                    </button>
                    {!plan.name.includes('Enterprise') && (
                      <p style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '10px', marginBottom: 0 }}>
                        14-day free trial · No credit card required
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Standalone ATS Integration Studio (Shown when SmartScreen tab active) ── */}
          {productTab === 'smartscreen' && (
            <div style={{
              background: '#0f172a',
              borderRadius: '16px',
              padding: '36px 32px',
              maxWidth: '960px',
              margin: '0 auto 80px',
              color: '#f8fafc',
              border: '1px solid #1e293b'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <span style={{ color: '#60a5fa', fontSize: '11px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  DEVELOPER & RECRUITER INTEGRATION GUIDE
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', margin: '8px 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Integrate with Any ATS in Under 3 Minutes
                </h2>
                <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '620px', margin: '0 auto' }}>
                  Ultra-lightweight REST endpoints and non-blocking webhooks. Zero CPU overhead on your system, sub-15ms response times.
                </p>

                {/* Compatible ATS Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                  {['Bullhorn', 'Greenhouse', 'Lever', 'Workday', 'Ceipal', 'Jobvite', 'iCIMS', 'Zoho Recruit', 'Custom CRM / Zapier'].map(ats => (
                    <span key={ats} style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: '#cbd5e1',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '11.5px',
                      fontWeight: '600',
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }}>
                      ✓ {ats}
                    </span>
                  ))}
                </div>
              </div>

              {/* Code Tab Switcher */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'curl', label: 'cURL / REST API' },
                    { id: 'node', label: 'Node.js' },
                    { id: 'webhook', label: 'Webhook Response' },
                    { id: 'nocode', label: 'No-Code / Direct Link' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveIntegrationTab(tab.id)}
                      style={{
                        background: activeIntegrationTab === tab.id ? '#2563eb' : 'rgba(255,255,255,0.06)',
                        color: activeIntegrationTab === tab.id ? '#ffffff' : '#94a3b8',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCode(codeSnippets[activeIntegrationTab])}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  {copiedSnippet ? 'Copied to Clipboard' : 'Copy Code'}
                </button>
              </div>

              {/* Code Pre Box */}
              <div style={{
                background: '#020617',
                borderRadius: '8px',
                padding: '18px 20px',
                border: '1px solid #1e293b',
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: '12.5px',
                lineHeight: 1.6,
                overflowX: 'auto',
                color: '#38bdf8'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {codeSnippets[activeIntegrationTab]}
                </pre>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94a3b8' }}>
                <div>Endpoint latency: &lt;15ms · 99.9% Uptime SLA · No API key required for testing</div>
                <div style={{ color: '#34d399', fontWeight: '600' }}>Live in Production</div>
              </div>
            </div>
          )}

          {/* ── Competitor Comparison Table ── */}
          <div style={{ margin: '0 auto 80px', maxWidth: '1100px' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span className="pricing-eyebrow">SIDE-BY-SIDE COMPARISON</span>
              <h2 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '26px', fontWeight: '800', color: 'var(--ink)',
                margin: '10px 0 8px', letterSpacing: '-0.015em'
              }}>
                How SmartHire Compares to the Market
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--ink-soft)', maxWidth: '520px', margin: '0 auto' }}>
                No other platform delivers all six of these capabilities under one subscription at any price.
              </p>
              <button
                type="button"
                onClick={() => setShowComparison(p => !p)}
                style={{
                  marginTop: '16px',
                  padding: '9px 20px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--ink)',
                  cursor: 'pointer'
                }}
              >
                {showComparison ? 'Hide Comparison Table' : 'Show Comparison Table'}
              </button>
            </div>

            {showComparison && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  fontSize: '13px'
                }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#334155', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #cbd5e1', minWidth: '150px' }}>
                        Platform
                      </th>
                      <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '700', color: '#334155', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #cbd5e1', minWidth: '90px' }}>
                        Price
                      </th>
                      {FEATURE_COLS.map(col => (
                        <th key={col.key} style={{
                          padding: '12px 10px', textAlign: 'center', fontWeight: '700', color: '#334155',
                          fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.03em',
                          borderBottom: '1px solid #cbd5e1', minWidth: '110px'
                        }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPETITORS.map((comp, idx) => (
                      <tr
                        key={comp.name}
                        style={{
                          background: comp.isUs
                            ? 'linear-gradient(90deg, rgba(16,185,129,0.07) 0%, rgba(16,185,129,0.03) 100%)'
                            : idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                          borderBottom: '1px solid #e2e8f0'
                        }}
                      >
                        <td style={{ padding: '13px 16px', borderRight: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {comp.isUs && (
                              <span style={{
                                display: 'inline-block', width: '6px', height: '6px',
                                borderRadius: '50%', background: '#10b981', flexShrink: 0
                              }} />
                            )}
                            <div>
                              <div style={{ fontWeight: comp.isUs ? '800' : '600', color: comp.isUs ? '#065f46' : '#1e293b' }}>
                                {comp.name}
                                {comp.isUs && (
                                  <span style={{ marginLeft: '6px', fontSize: '10px', background: '#d1fae5', color: '#065f46', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>
                                    Best Value
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{comp.category}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '13px 10px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                          <div style={{ fontWeight: '700', color: comp.isUs ? '#10b981' : comp.color, fontSize: '13.5px' }}>
                            {comp.price}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '1px' }}>{comp.unit}</div>
                        </td>
                        {FEATURE_COLS.map(col => (
                          <td key={col.key} style={{ padding: '13px 10px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                            <CheckIcon val={comp[col.key]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px', textAlign: 'center' }}>
                  * Competitor prices are publicly listed rates as of October 2026. Enterprise/custom plans excluded for clarity.
                  Bullhorn Pro/Max, Greenhouse, and Workday costs are significantly higher.
                </p>
              </div>
            )}
          </div>

          {/* ── FAQ / Trust Strip ── */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '32px 36px',
            maxWidth: '900px',
            margin: '0 auto 80px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px'
          }}>
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ),
                title: 'No Long-Term Lock-in',
                body: 'Month-to-month plans. Cancel anytime with no cancellation fees.'
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                ),
                title: 'No Credit Card to Try',
                body: '14-day full-featured trial for Starter and Pro plans. No card required.'
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </svg>
                ),
                title: 'Onboarding Included',
                body: 'Every paid plan includes a live 30-minute onboarding call with our team.'
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                ),
                title: 'Upgrade or Downgrade Anytime',
                body: 'Plans are prorated automatically. Upgrade when you grow, no questions asked.'
              },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ height: '26px', display: 'flex', alignItems: 'center' }}>{item.icon}</div>
                <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--ink)' }}>{item.title}</div>
                <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)', lineHeight: 1.5 }}>{item.body}</div>
              </div>
            ))}
          </div>

          {/* ── USP Grid ── */}
          <div className="usp-container-block">
            <div className="text-center">
              <span className="pricing-eyebrow">PLATFORM CAPABILITIES</span>
              <h2 className="usp-section-title">Why Staffing Agencies Choose SmartHire</h2>
              <p className="pricing-subtitle">
                We replace five separate tools with one unified, AI-native recruiting operating system.
              </p>
            </div>

            <div className="usp-grid-layout">
              {[
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  ),
                  title: 'AI Video & Voice Screening',
                  description: 'Groq Whisper transcribes real candidate speech. Llama-3 evaluates technical depth, communication, and role fit — per question, with a scored dossier PDF. HireVue charges $35,000/yr for this alone.',
                  badge: 'Replaces HireVue'
                },
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                      <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                    </svg>
                  ),
                  title: 'SmartSign RTR eSignature',
                  description: 'Candidates sign Right to Represent agreements in-browser — no DocuSign account needed. ESIGN/UETA compliant audit trail with IP, timestamp, and SHA-256 hash. PDF auto-saved to candidate profile.',
                  badge: 'Replaces DocuSign'
                },
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="9" x2="9" y2="21" />
                    </svg>
                  ),
                  title: 'Vendor Hotlist Ingestion',
                  description: 'Paste or upload vendor bench lists and instantly get AI match scores against your active requisitions. Excel-style grid with skill, visa, location, and rate data. No other ATS has this feature.',
                  badge: 'Unique to SmartHire'
                },
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                  ),
                  title: 'Submittal Pack Generator',
                  description: '1-click client-ready candidate coversheet with auto-filled legal name, visa, location, experience, rate, and key skills matrix. Supports 5 client templates including Texas DIR, MSP/VMS, and Prime Vendor C2C.',
                  badge: 'Unique to SmartHire'
                },
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                      <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><rect x="7" y="7" width="10" height="10" rx="1" />
                    </svg>
                  ),
                  title: 'Anti-Cheat Proctoring Engine',
                  description: 'Tab-switch detection, window blur monitoring, and verified GPS geolocation with IP fallback reverse-geocoding — all captured silently during candidate screening sessions. No competitor ATS does this.',
                  badge: 'Unique to SmartHire'
                },
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                      <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    </svg>
                  ),
                  title: 'Full-Stack Cloud ATS',
                  description: 'Five-tier recruiter hierarchy (Superadmin, Admin, Manager, Recruiter, Employee), 4 career portal themes, audit logs, automation engine, and sub-second Gzip-compressed API responses on MongoDB Atlas.',
                  badge: null
                },
              ].map((usp, idx) => (
                <div key={idx} className="usp-card-item">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div className="usp-card-icon" style={{ margin: 0 }}>{usp.icon}</div>
                    {usp.badge && (
                      <span style={{
                        fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '20px',
                        background: usp.badge.includes('Unique') ? 'rgba(124,58,237,0.08)' : 'rgba(37,99,235,0.08)',
                        color: usp.badge.includes('Unique') ? '#7c3aed' : '#2563eb',
                        textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap'
                      }}>
                        {usp.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="usp-card-title">{usp.title}</h4>
                  <p className="usp-card-text">{usp.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <style>{`
        .pricing-section {
          padding: 80px 0;
          background: linear-gradient(180deg, var(--bg) 0%, var(--surface) 100%);
        }
        .pricing-header-block {
          max-width: 720px;
          margin: 0 auto 44px;
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
          font-size: 36px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--ink);
          margin: 0 0 14px;
        }
        .pricing-subtitle {
          font-size: 15px;
          color: var(--ink-soft);
          line-height: 1.55;
          margin: 0;
        }
        .text-center { text-align: center; }

        /* Toggle */
        .billing-toggle-wrap {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-top: 28px;
          padding: 6px 14px;
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
        .billing-toggle-wrap span.active-period { color: var(--ink); }
        .toggle-switch-btn {
          width: 44px; height: 24px;
          background: var(--brand);
          border: none; border-radius: 12px;
          position: relative; cursor: pointer; padding: 0;
        }
        .switch-slider {
          position: absolute; top: 3px; left: 3px;
          width: 18px; height: 18px;
          border-radius: 50%; background: white;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .yearly-pos { transform: translateX(20px); }
        .discount-badge {
          background: rgba(219,127,53,0.15);
          color: #db7f35;
          font-size: 10px; font-weight: 700;
          padding: 2px 6px; border-radius: 20px; margin-left: 4px;
        }

        /* Plans Grid */
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
          gap: 24px;
          margin-bottom: 60px;
          align-items: stretch;
        }
        .plan-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: 36px 28px;
          position: relative;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          transition: all 0.22s ease;
        }
        .plan-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(0,0,0,0.06);
        }
        .popular-card {
          border-color: #2563eb;
          box-shadow: 0 12px 32px rgba(37,99,235,0.1);
        }
        .popular-ribbon {
          position: absolute; top: 14px; right: 14px;
          background: #2563eb; color: white;
          font-size: 10.5px; font-weight: 800;
          padding: 3px 10px; border-radius: 20px;
          text-transform: uppercase; letter-spacing: 0.05em;
        }

        /* Card Header */
        .plan-card-header { margin-bottom: 22px; }
        .plan-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 19px; font-weight: 800; color: var(--ink);
        }
        .plan-desc {
          font-size: 13px; color: var(--ink-soft);
          line-height: 1.4; margin: 0 0 16px; min-height: 36px;
        }
        .price-display {
          display: flex; align-items: baseline; color: var(--ink);
        }
        .currency { font-size: 20px; font-weight: 700; margin-right: 2px; }
        .price-value { font-size: 40px; font-weight: 800; letter-spacing: -0.03em; }
        .billing-period { font-size: 13px; color: var(--ink-soft); font-weight: 500; margin-left: 4px; }
        .yearly-disclaimer {
          display: block; font-size: 11px;
          color: #db7f35; font-weight: 600; margin-top: 4px;
        }
        .plan-divider { height: 1px; background: var(--line); margin-bottom: 22px; }

        /* Features */
        .plan-card-body { flex-grow: 1; margin-bottom: 28px; }
        .features-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 10px;
        }
        .features-list li {
          display: flex; align-items: flex-start;
          gap: 8px; font-size: 12.5px; color: var(--ink); line-height: 1.4;
        }
        .feat-check { color: var(--brand); font-weight: bold; font-size: 13px; }

        /* CTAs */
        .plan-card-footer { margin-top: auto; }
        .plan-cta-btn {
          width: 100%; border: none; border-radius: 9px;
          padding: 12px; font-size: 13.5px; font-weight: 700;
          cursor: pointer; transition: all 0.2s ease;
        }
        .popular-cta {
          background: linear-gradient(130deg, #2563eb, #1d4ed8);
          color: white;
          box-shadow: 0 4px 12px rgba(37,99,235,0.22);
        }
        .popular-cta:hover { box-shadow: 0 8px 20px rgba(37,99,235,0.32); transform: translateY(-1px); }
        .enterprise-cta {
          background: #0f172a; color: white;
        }
        .enterprise-cta:hover { background: #1e293b; }
        .flat-cta {
          background: var(--surface);
          border: 1px solid var(--line);
          color: var(--ink);
        }
        .flat-cta:hover { background: var(--bg); border-color: var(--ink-soft); }

        /* USP Grid */
        .usp-container-block { border-top: 1px solid var(--line); padding-top: 72px; margin-top: 20px; }
        .usp-section-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 26px; font-weight: 800; color: var(--ink);
          margin: 10px 0 10px; letter-spacing: -0.015em;
        }
        .usp-grid-layout {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px; margin-top: 44px;
        }
        .usp-card-item {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 22px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          transition: box-shadow 0.2s ease;
        }
        .usp-card-item:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.05); }
        .usp-card-icon { font-size: 22px; margin-bottom: 12px; }
        .usp-card-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14.5px; font-weight: 800; color: var(--ink); margin: 0 0 7px;
        }
        .usp-card-text { font-size: 12.5px; color: var(--ink-soft); line-height: 1.5; margin: 0; }
      `}</style>
    </SiteLayout>
  )
}

export default Pricing
