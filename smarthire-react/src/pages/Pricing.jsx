import React, { useState } from 'react'
import SiteLayout from '../components/SiteLayout'
import PricingSection from '../components/PricingSection'

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
    name: 'SmartHire Starter Combo',
    category: 'Unified ATS + AI Screening',
    price: '$129',
    unit: '/mo ($79 Standalone)',
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
  const [showComparison, setShowComparison] = useState(false)

  return (
    <SiteLayout>
      <section className="pricing-section" style={{ padding: '40px 0 60px' }}>
        <div className="container" style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <PricingSection showIntegrationGuide={true} isStandalonePage={true} />

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
                  description: 'State-of-the-art AI transcribes real candidate speech and evaluates technical depth, communication, and role fit — per question, with a scored PDF evaluation report. Competitors charge $35,000/yr for this alone.',
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
