import React, { useState } from 'react'
import SiteLayout from '../components/SiteLayout'

function Pricing() {
  const [isYearly, setIsYearly] = useState(false)

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

  const usps = [
    {
      icon: '🤖',
      title: 'AI-Driven Candidate Pre-Screening',
      description: 'Conduct interactive, custom AI interviews per candidate. Rates responses and matches requirements automatically.'
    },
    {
      icon: '🔍',
      title: 'Vision-based Document Verification',
      description: 'Scan Driver\'s Licenses and work Visas for validity, checking expiration and anti-tampering using Groq Vision.'
    },
    {
      icon: '⚡',
      title: 'Integrated Job & Content Pipeline',
      description: 'Ingest active vacancies from the web, and auto-generate premium B2B LinkedIn posts to attract candidate traffic.'
    },
    {
      icon: '💾',
      title: 'Stateless-Proof Cloud Persistence',
      description: 'All candidates, verification reports, and screening session data are stored securely on MongoDB Atlas.'
    }
  ]

  return (
    <SiteLayout>
      <section className="pricing-section">
        <div className="container">
          {/* Header */}
          <div className="pricing-header-block text-center">
            <span className="pricing-eyebrow">PREMIUM TALENT ACQUISITION</span>
            <h1 className="pricing-title">Simple, Transparent Pricing</h1>
            <p className="pricing-subtitle">
              Choose the tier that matches your hiring speed. All plans utilize high-precision Llama-3 and Groq APIs with persistent cloud storage.
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

          {/* Cards Grid */}
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
                      onClick={() => alert(`Redirecting to payment checkout for ${plan.name}...`)}
                    >
                      {plan.cta}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* USP Section */}
          <div className="usp-container-block">
            <div className="text-center">
              <span className="pricing-eyebrow">OUR SPECIAL VALUE</span>
              <h2 className="usp-section-title">Why Staffing Agencies Choose VerifyHire</h2>
              <p className="pricing-subtitle">
                We combine recruitment marketing, AI verification, and automation workflows into a unified agentic platform.
              </p>
            </div>

            <div className="usp-grid-layout">
              {usps.map((usp, idx) => (
                <div key={idx} className="usp-card-item">
                  <div className="usp-card-icon">{usp.icon}</div>
                  <h4 className="usp-card-title">{usp.title}</h4>
                  <p className="usp-card-text">{usp.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Styled Scoped Styles */}
      <style>{`
        .pricing-section {
          padding: 80px 0;
          background: linear-gradient(180deg, var(--bg) 0%, var(--surface) 100%);
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

        /* Toggle Button */
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

        /* Plans Grid */
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
          gap: 28px;
          margin-bottom: 80px;
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

        /* Card Header */
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

        /* Features List */
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

        /* CTAs */
        .plan-card-footer {
          margin-top: auto;
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

        /* USP Grid */
        .usp-container-block {
          border-top: 1px solid var(--line);
          padding-top: 80px;
          margin-top: 40px;
        }
        .usp-section-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: var(--ink);
          margin: 12px 0 10px;
          letter-spacing: -0.015em;
        }
        .usp-grid-layout {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          margin-top: 48px;
        }
        .usp-card-item {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
        }
        .usp-card-icon {
          font-size: 24px;
          margin-bottom: 14px;
        }
        .usp-card-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          font-weight: 800;
          color: var(--ink);
          margin: 0 0 8px;
        }
        .usp-card-text {
          font-size: 12.5px;
          color: var(--ink-soft);
          line-height: 1.45;
          margin: 0;
        }
      `}</style>
    </SiteLayout>
  )
}

export default Pricing
