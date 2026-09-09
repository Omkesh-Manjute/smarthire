import React, { useState } from 'react'
import SiteLayout from '../components/SiteLayout'
import { Link } from 'react-router-dom'

function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('overview')

  const sections = [
    { id: 'overview', title: '1. Overview & Scope' },
    { id: 'information-collected', title: '2. Information We Collect' },
    { id: 'how-we-use-data', title: '3. How We Use Data' },
    { id: 'ai-processing', title: '4. AI Matching & Screening Telemetry' },
    { id: 'data-sharing', title: '5. Information Sharing & Disclosures' },
    { id: 'security-retention', title: '6. Data Security & Retention' },
    { id: 'user-rights', title: '7. Your Rights (GDPR & CCPA)' },
    { id: 'contact-dpo', title: '8. Contact Data Protection Officer' }
  ]

  const scrollToSection = (id) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <SiteLayout>
      <div className="tf-privacy-wrapper">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

          .tf-privacy-wrapper {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #ffffff;
            color: #1e293b;
            min-height: 100vh;
          }

          .tf-container {
            max-width: 1180px;
            margin: 0 auto;
            padding: 0 24px;
          }

          .tf-highlight-box {
            display: inline-block;
            background: #e0f2fe;
            color: #0284c7;
            padding: 2px 12px;
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
            margin-bottom: 20px;
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
            font-size: clamp(30px, 3.5vw, 44px);
            font-weight: 800;
            line-height: 1.2;
            letter-spacing: -0.03em;
            color: #0f172a;
            margin: 0 0 16px 0;
          }

          .tf-hero-subtitle {
            font-size: 16px;
            line-height: 1.65;
            color: #64748b;
            margin: 0 0 24px 0;
            max-width: 720px;
          }

          .tf-trust-cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 16px;
            margin: 28px 0 0;
          }

          .tf-trust-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
            transition: all 0.2s ease;
          }

          .tf-trust-card:hover {
            border-color: #cbd5e1;
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(15, 23, 42, 0.06);
          }

          .tf-trust-icon {
            font-size: 24px;
            line-height: 1;
          }

          .tf-trust-title {
            font-size: 13.5px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 2px;
          }

          .tf-trust-desc {
            font-size: 12px;
            color: #64748b;
            line-height: 1.4;
          }

          /* Main layout */
          .tf-legal-layout {
            display: grid;
            grid-template-columns: 280px 1fr;
            gap: 48px;
            padding: 56px 0 80px;
            align-items: start;
          }

          @media (max-width: 900px) {
            .tf-legal-layout {
              grid-template-columns: 1fr;
              gap: 32px;
            }
          }

          /* Sticky Sidebar */
          .tf-legal-sidebar {
            position: sticky;
            top: 90px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
          }

          .tf-sidebar-title {
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin-bottom: 14px;
            padding-bottom: 10px;
            border-bottom: 1px solid #f1f5f9;
          }

          .tf-toc-btn {
            display: block;
            width: 100%;
            text-align: left;
            padding: 8px 12px;
            font-size: 13px;
            font-weight: 500;
            color: #64748b;
            background: transparent;
            border: none;
            border-left: 3px solid transparent;
            border-radius: 0 6px 6px 0;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .tf-toc-btn:hover {
            color: #2563eb;
            background: #f8fafc;
          }

          .tf-toc-btn.active {
            color: #1d4ed8;
            font-weight: 700;
            background: #eff6ff;
            border-left-color: #2563eb;
          }

          .tf-sidebar-contact {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #f1f5f9;
            font-size: 12px;
            color: #64748b;
          }

          .tf-sidebar-contact strong {
            display: block;
            color: #0f172a;
            margin-bottom: 4px;
          }

          .tf-sidebar-link {
            color: #2563eb;
            font-weight: 600;
            text-decoration: none;
          }

          .tf-sidebar-link:hover {
            text-decoration: underline;
          }

          /* Content Area */
          .tf-legal-content {
            font-size: 14.5px;
            line-height: 1.75;
            color: #334155;
          }

          .tf-legal-section {
            margin-bottom: 48px;
            scroll-margin-top: 110px;
          }

          .tf-section-heading {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 16px 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
            letter-spacing: -0.02em;
          }

          .tf-callout-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 18px 22px;
            margin: 20px 0;
          }

          .tf-callout-blue {
            background: #eff6ff;
            border-color: #bfdbfe;
          }

          .tf-callout-title {
            font-size: 14px;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .tf-grid-2 {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 16px;
            margin: 20px 0;
          }

          .tf-feature-pill {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          }

          .tf-feature-pill strong {
            display: block;
            font-size: 13.5px;
            color: #0f172a;
            margin-bottom: 4px;
          }

          .tf-feature-pill p {
            margin: 0;
            font-size: 12.5px;
            color: #64748b;
            line-height: 1.5;
          }

          .tf-btn-support {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #2563eb;
            color: #ffffff;
            font-size: 13.5px;
            font-weight: 700;
            padding: 10px 20px;
            border-radius: 8px;
            text-decoration: none;
            transition: all 0.15s ease;
            margin-top: 12px;
          }

          .tf-btn-support:hover {
            background: #1d4ed8;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          }
        `}</style>

        {/* ─── HERO SECTION ─── */}
        <section style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          padding: '64px 0 48px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div className="tf-container">
            <div className="tf-badge-pill">
              <span className="tf-badge-dot" />
              <span>TRUST, PRIVACY & DATA PROTECTION HUB</span>
            </div>

            <h1 className="tf-hero-title">
              SmartHire Privacy Policy{' '}
              <span className="tf-highlight-box">for Talent & Enterprises</span>
            </h1>

            <p className="tf-hero-subtitle">
              We are dedicated to safeguarding candidate identification records, resume intelligence, recruiter telemetry, and client data with enterprise-grade AES-256 encryption and ethical AI governance.
            </p>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '18px',
              fontSize: '12.5px',
              color: '#64748b',
              paddingTop: '8px'
            }}>
              <span>📅 <strong>Last Updated:</strong> August 26, 2026</span>
              <span>⚡ <strong>Version:</strong> 3.4 (Enterprise Edition)</span>
              <span>🌐 <strong>Compliance:</strong> Global (GDPR, CCPA & EEOC Compliant)</span>
            </div>

            {/* 4 Quick Trust Badges */}
            <div className="tf-trust-cards-grid">
              <div className="tf-trust-card">
                <span className="tf-trust-icon">🔒</span>
                <div>
                  <div className="tf-trust-title">AES-256 & TLS 1.3</div>
                  <div className="tf-trust-desc">Full encryption at rest and in transit across all candidate pools.</div>
                </div>
              </div>
              <div className="tf-trust-card">
                <span className="tf-trust-icon">🚫</span>
                <div>
                  <div className="tf-trust-title">Zero Data Selling</div>
                  <div className="tf-trust-desc">We never sell, broker, or rent candidate contacts or resumes.</div>
                </div>
              </div>
              <div className="tf-trust-card">
                <span className="tf-trust-icon">🤖</span>
                <div>
                  <div className="tf-trust-title">Explainable AI</div>
                  <div className="tf-trust-desc">Unbiased matching trained on placed resumes; no protected traits.</div>
                </div>
              </div>
              <div className="tf-trust-card">
                <span className="tf-trust-icon">⚖️</span>
                <div>
                  <div className="tf-trust-title">GDPR & CCPA Ready</div>
                  <div className="tf-trust-desc">1-click candidate data export and right-to-be-forgotten deletion.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 2-COLUMN MAIN LEGAL LAYOUT ─── */}
        <div className="tf-container">
          <div className="tf-legal-layout">
            
            {/* Sticky Navigation Sidebar */}
            <aside className="tf-legal-sidebar">
              <div className="tf-sidebar-title">Table of Contents</div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollToSection(sec.id)}
                    className={`tf-toc-btn ${activeSection === sec.id ? 'active' : ''}`}
                  >
                    {sec.title}
                  </button>
                ))}
              </nav>

              <div className="tf-sidebar-contact">
                <strong>Data Protection Office</strong>
                <p style={{ margin: '0 0 6px', fontSize: '11.5px', color: '#64748b' }}>
                  Have questions about your candidate privacy or require a data export?
                </p>
                <a href="mailto:privacy@smarthire.ai" className="tf-sidebar-link">
                  privacy@smarthire.ai
                </a>
              </div>
            </aside>

            {/* Main Legal Clauses */}
            <main className="tf-legal-content">
              
              {/* Section 1: Overview */}
              <section id="overview" className="tf-legal-section">
                <h2 className="tf-section-heading">1. Overview & Scope</h2>
                <p>
                  This Privacy Policy applies to the <strong>SmartHire</strong> candidate relationship management (CRM), applicant tracking system (ATS), vendor management system (VMS), and AI candidate screening platform operated by SmartHire Enterprise Inc. (collectively, "SmartHire", "we", "our", or "us").
                </p>
                <p>
                  By accessing or using our recruitment portal, job application pages, candidate verification tools, or related APIs, you acknowledge that you have read and understood this Privacy Policy. This policy explains how we collect, store, process, protect, and disclose personal and professional candidate and enterprise user data.
                </p>
              </section>

              {/* Section 2: Information Collected */}
              <section id="information-collected" className="tf-legal-section">
                <h2 className="tf-section-heading">2. Information We Collect</h2>
                <p>We collect information categorized across three primary sources:</p>

                <div className="tf-callout-card">
                  <div className="tf-callout-title">💼 A. Candidate & Applicant Data</div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: '#334155' }}>
                    <li><strong>Identity & Contact Details:</strong> Full name, corporate/personal email address, telephone number, city, state, postal code, and country of residence.</li>
                    <li><strong>Professional Credentials:</strong> Employment work history, job titles, educational qualifications, certifications, technology skills, resume documents (.pdf, .docx), portfolio links, and LinkedIn profiles.</li>
                    <li><strong>Compensation & Work Authorization:</strong> Expected hourly pay rate, billing rate type (C2C, W2, 1099), work authorization status (US Citizen, Green Card, H-1B, OPT, etc.), and availability timelines.</li>
                  </ul>
                </div>

                <div className="tf-callout-card">
                  <div className="tf-callout-title">🛡️ B. Enterprise Recruiter & Employer Telemetry</div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: '#334155' }}>
                    <li>Corporate login credentials, corporate email addresses, user roles (Admin, Manager, Recruiter, Sourcing Specialist).</li>
                    <li>Requisition allocation records, candidate submission activity logs, interview scheduling timestamps, and hiring audit trails.</li>
                  </ul>
                </div>

                <div className="tf-callout-card">
                  <div className="tf-callout-title">⚙️ C. Automated Device & Log Data</div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: '#334155' }}>
                    <li>IP address, browser type and version, operating system, session duration, and page access timestamps.</li>
                  </ul>
                </div>
              </section>

              {/* Section 3: How We Use Data */}
              <section id="how-we-use-data" className="tf-legal-section">
                <h2 className="tf-section-heading">3. How We Use Data</h2>
                <p>SmartHire uses collected information exclusively for authorized recruitment, staffing, and compliance purposes:</p>
                <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                  <li><strong>Requisition Matching:</strong> Comparing candidate experience and skill sets against open client job descriptions to notify assigned recruiters of high-affinity matches.</li>
                  <li><strong>Client Submissions & Approvals:</strong> Transmitting candidate profiles and resumes to hiring managers and enterprise customers who have posted the respective job requisition.</li>
                  <li><strong>Real-Time Activity Notifications:</strong> Delivering live in-app notifications and email alerts when a candidate is assigned, screened, interviewed, approved, or placed.</li>
                  <li><strong>Audit Logging & Anti-Fraud:</strong> Preventing duplicate submissions, tracking sourcing ownership, and ensuring compliance with vendor SLAs.</li>
                </ul>
              </section>

              {/* Section 4: AI Matching & Screening */}
              <section id="ai-processing" className="tf-legal-section">
                <h2 className="tf-section-heading">4. AI Matching & Screening Telemetry</h2>
                <div className="tf-callout-card tf-callout-blue">
                  <div className="tf-callout-title">🤖 Ethical AI Governance & Fair Staffing</div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#1e3a8a', lineHeight: 1.6 }}>
                    SmartHire’s automated semantic matching algorithms evaluate candidates solely on verified job requirements, skill compatibility, and work history. Our AI models are strictly prohibited from using age, race, gender, ethnicity, disability, or religious data in hiring recommendations.
                  </p>
                </div>
                <p>
                  Candidate data is <strong>never used to train public external foundation models</strong>. All embeddings, scoring data, and screening session outputs remain private to your enterprise tenant.
                </p>
              </section>

              {/* Section 5: Data Sharing */}
              <section id="data-sharing" className="tf-legal-section">
                <h2 className="tf-section-heading">5. Information Sharing & Disclosures</h2>
                <p>
                  <strong>We do not sell, rent, trade, or monetize candidate personal information or contact details.</strong>
                </p>
                <p>We only share data under the following strictly defined conditions:</p>
                <ul style={{ paddingLeft: '20px' }}>
                  <li><strong>Authorized Enterprise Clients:</strong> When a recruiter submits a candidate to a specific open client requisition.</li>
                  <li><strong>Verified Infrastructure Providers:</strong> Secure hosting and cloud database infrastructure (Firebase Cloud Firestore, Google Cloud Platform, Render) bound by stringent data processing agreements (DPAs).</li>
                  <li><strong>Legal & Regulatory Mandates:</strong> Where required by applicable law, court summons, or regulatory authorities.</li>
                </ul>
              </section>

              {/* Section 6: Data Security & Retention */}
              <section id="security-retention" className="tf-legal-section">
                <h2 className="tf-section-heading">6. Data Security & Retention</h2>
                <p>
                  We implement comprehensive organizational, physical, and technical safeguards including:
                </p>
                <ul style={{ paddingLeft: '20px' }}>
                  <li><strong>Encryption:</strong> AES-256 bit encryption at rest and TLS 1.3 protocol encryption for all web and API traffic.</li>
                  <li><strong>Role-Based Access Control (RBAC):</strong> Granular permissions restricting candidate data visibility based on user organizational roles.</li>
                  <li><strong>Retention Timelines:</strong> Candidate resumes and profile records are retained for the duration of the recruitment engagement or as mandated by statutory employment record retention laws (typically 24–36 months), after which data is securely purged or anonymized upon request.</li>
                </ul>
              </section>

              {/* Section 7: User Rights */}
              <section id="user-rights" className="tf-legal-section">
                <h2 className="tf-section-heading">7. Your Rights (GDPR, CCPA & Global Rights)</h2>
                <p>Under applicable privacy laws, candidates and enterprise users maintain the following rights:</p>
                
                <div className="tf-grid-2">
                  <div className="tf-feature-pill">
                    <strong>📋 Right to Access</strong>
                    <p>Request an export copy of all stored profile data and submission logs.</p>
                  </div>
                  <div className="tf-feature-pill">
                    <strong>✏️ Right to Rectification</strong>
                    <p>Update incorrect contact info, skills, or resume documents anytime.</p>
                  </div>
                  <div className="tf-feature-pill">
                    <strong>🗑️ Right to Erasure</strong>
                    <p>Request permanent deletion of your candidate record from our talent pool.</p>
                  </div>
                  <div className="tf-feature-pill">
                    <strong>🚫 Right to Opt-Out</strong>
                    <p>Opt out of automated job matching alerts and notifications at any time.</p>
                  </div>
                </div>
              </section>

              {/* Section 8: Contact DPO */}
              <section id="contact-dpo" className="tf-legal-section">
                <h2 className="tf-section-heading">8. Contact Our Data Protection Officer (DPO)</h2>
                <p>
                  If you have any questions, data subject access requests (DSARs), or privacy concerns regarding this policy, please reach out to our dedicated privacy office:
                </p>
                <div className="tf-callout-card">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
                    <div><strong>SmartHire Enterprise Inc.</strong> — Privacy & Compliance Division</div>
                    <div><strong>Data Protection Officer:</strong> DPO & Legal Affairs</div>
                    <div><strong>Direct Email:</strong> <a href="mailto:privacy@smarthire.ai" style={{ color: '#2563eb', fontWeight: 600 }}>privacy@smarthire.ai</a> / <a href="mailto:dpo@smarthire.ai" style={{ color: '#2563eb', fontWeight: 600 }}>dpo@smarthire.ai</a></div>
                    <div>
                      <Link to="/about#inquiry" className="tf-btn-support">
                        Submit a Formal Privacy Inquiry →
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

            </main>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}

export default PrivacyPolicy
