import React, { useState } from 'react'
import SiteLayout from '../components/SiteLayout'
import { Link } from 'react-router-dom'

function Terms() {
  const [activeSection, setActiveSection] = useState('acceptance')

  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Agreement' },
    { id: 'platform-services', title: '2. Platform Services & Scope' },
    { id: 'account-governance', title: '3. Enterprise Accounts & RBAC' },
    { id: 'candidate-sourcing', title: '4. Sourcing & Ownership Rules' },
    { id: 'eeoc-compliance', title: '5. Non-Discrimination & EEOC' },
    { id: 'confidentiality', title: '6. Confidentiality & Security' },
    { id: 'ip-rights', title: '7. Intellectual Property & Ownership' },
    { id: 'liability-warranty', title: '8. 99.9% SLA & Liability Limits' },
    { id: 'termination', title: '9. Term, Termination & Export' },
    { id: 'governing-law', title: '10. Governing Law & Legal Desk' }
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
      <div className="tf-terms-wrapper">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

          .tf-terms-wrapper {
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

          .tf-roles-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 14px;
            margin: 20px 0;
          }

          .tf-role-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          }

          .tf-role-title {
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .tf-role-desc {
            font-size: 12px;
            color: #64748b;
            line-height: 1.45;
            margin: 0;
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
              <span>ENTERPRISE MASTER SERVICES AGREEMENT & TERMS</span>
            </div>

            <h1 className="tf-hero-title">
              SmartHire Terms of Service{' '}
              <span className="tf-highlight-box">& Master Agreement</span>
            </h1>

            <p className="tf-hero-subtitle">
              These Terms of Service govern enterprise access to the SmartHire ATS, VMS, AI candidate verification platform, private talent vaults, and recruiter workforce management systems.
            </p>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '18px',
              fontSize: '12.5px',
              color: '#64748b',
              paddingTop: '8px'
            }}>
              <span>📅 <strong>Effective Date:</strong> August 26, 2026</span>
              <span>⚡ <strong>MSA Ref:</strong> SH-ENT-2026-V3</span>
              <span>🏛️ <strong>Entity:</strong> SmartHire Enterprise Inc.</span>
            </div>

            {/* 4 Quick Highlights */}
            <div className="tf-trust-cards-grid">
              <div className="tf-trust-card">
                <span className="tf-trust-icon">💼</span>
                <div>
                  <div className="tf-trust-title">Enterprise VMS & ATS</div>
                  <div className="tf-trust-desc">Multi-role recruiter staffing workflow & fast submission command.</div>
                </div>
              </div>
              <div className="tf-trust-card">
                <span className="tf-trust-icon">🛡️</span>
                <div>
                  <div className="tf-trust-title">99.9% Uptime SLA</div>
                  <div className="tf-trust-desc">High availability enterprise cloud infrastructure with sub-second sync.</div>
                </div>
              </div>
              <div className="tf-trust-card">
                <span className="tf-trust-icon">⚖️</span>
                <div>
                  <div className="tf-trust-title">EEOC & Fair Staffing</div>
                  <div className="tf-trust-desc">Strict non-discrimination algorithms and compliance audit trails.</div>
                </div>
              </div>
              <div className="tf-trust-card">
                <span className="tf-trust-icon">🔐</span>
                <div>
                  <div className="tf-trust-title">100% Talent Ownership</div>
                  <div className="tf-trust-desc">Your candidate records, resumes, and notes remain 100% yours.</div>
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
              <div className="tf-sidebar-title">Agreement Sections</div>
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
                <strong>Corporate Legal Affairs</strong>
                <p style={{ margin: '0 0 6px', fontSize: '11.5px', color: '#64748b' }}>
                  Need customized MSA amendments, SLA contracts, or vendor security reviews?
                </p>
                <a href="mailto:legal@smarthire.ai" className="tf-sidebar-link">
                  legal@smarthire.ai
                </a>
              </div>
            </aside>

            {/* Main Legal Clauses */}
            <main className="tf-legal-content">
              
              {/* Section 1 */}
              <section id="acceptance" className="tf-legal-section">
                <h2 className="tf-section-heading">1. Acceptance of Agreement</h2>
                <p>
                  By accessing, browsing, registering for, or using the <strong>SmartHire</strong> platform, web applications, candidate portals, or associated APIs, you ("Customer", "Enterprise Subscriber", or "Authorized User") agree to be legally bound by these Terms of Service, along with our <Link to="/privacy" style={{ color: '#2563eb', fontWeight: 600 }}>Privacy Policy</Link>.
                </p>
                <p>
                  If you are accepting these terms on behalf of a staffing agency, corporate enterprise, or vendor partner, you represent and warrant that you possess full legal authority to bind that entity to this Agreement.
                </p>
              </section>

              {/* Section 2 */}
              <section id="platform-services" className="tf-legal-section">
                <h2 className="tf-section-heading">2. Platform Services & Scope</h2>
                <p>
                  SmartHire provides an enterprise SaaS recruitment operating system comprising:
                </p>
                <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                  <li><strong>Job Requisition Management:</strong> Automated requisition intake, recruiter assignment, rate calculation, and client delivery tracking.</li>
                  <li><strong>Private Candidate Vaults:</strong> Recruiter sourcing pipelines, resume document storage, screening status tracking, and candidate profile management.</li>
                  <li><strong>Autonomous AI Matchmaker & Proactive Alerts:</strong> Instant matching notifications connecting newly published client requisitions with qualified available talent in your database.</li>
                  <li><strong>Executive Analytics & Reports:</strong> Real-time sourcing velocity, stage conversion funnels, submission volume audits, and recruiter activity logs.</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section id="account-governance" className="tf-legal-section">
                <h2 className="tf-section-heading">3. Enterprise Accounts & Role-Based Access Control (RBAC)</h2>
                <p>
                  Platform access is strictly segmented through organizational hierarchy to preserve recruiter talent privacy:
                </p>
                
                <div className="tf-roles-grid">
                  <div className="tf-role-card">
                    <div className="tf-role-title" style={{ color: '#0284c7' }}>👑 Super Admin / Admin</div>
                    <p className="tf-role-desc">Full organization governance, user provisioning, rate corridor controls, and master billing administration.</p>
                  </div>
                  <div className="tf-role-card">
                    <div className="tf-role-title" style={{ color: '#d97706' }}>🛡️ Lead Manager / Approver</div>
                    <p className="tf-role-desc">Team requisition assignment, candidate review, client submission approvals, and recruiter performance oversight.</p>
                  </div>
                  <div className="tf-role-card">
                    <div className="tf-role-title" style={{ color: '#ea580c' }}>💼 Lead Recruiter</div>
                    <p className="tf-role-desc">Candidate intake, requisition sourcing, submission staging, rate negotiation, and client interview coordination.</p>
                  </div>
                  <div className="tf-role-card">
                    <div className="tf-role-title" style={{ color: '#16a34a' }}>👤 Sourcing Specialist</div>
                    <p className="tf-role-desc">Candidate profile building, resume parsing, and private candidate directory enrichment under supervision.</p>
                  </div>
                </div>

                <p>
                  Users are responsible for maintaining login credential security and are strictly prohibited from sharing individual account access across multiple recruiters.
                </p>
              </section>

              {/* Section 4 */}
              <section id="candidate-sourcing" className="tf-legal-section">
                <h2 className="tf-section-heading">4. Candidate Sourcing, Ownership & Right to Represent (RTR)</h2>
                <p>
                  SmartHire enforces automated audit logging to prevent duplicate candidate submissions and maintain fair sourcing attribution across internal staffing teams:
                </p>
                <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                  <li><strong>Attribution Timestamp:</strong> When an employee or recruiter uploads a candidate, the candidate record is permanently stamped with the creator's user ID and timestamp ("Sourced By").</li>
                  <li><strong>Duplicate Detection:</strong> Submissions of duplicate email addresses or telephone numbers will prompt an alert to resolve potential multi-channel sourcing overlaps.</li>
                  <li><strong>Right to Represent (RTR):</strong> Recruiters confirm they have obtained verbal or digital Right to Represent consent from candidates prior to submitting profiles to client job requisitions.</li>
                </ul>
              </section>

              {/* Section 5 */}
              <section id="eeoc-compliance" className="tf-legal-section">
                <h2 className="tf-section-heading">5. Non-Discrimination & Equal Employment Opportunity (EEOC)</h2>
                <div className="tf-callout-card tf-callout-blue">
                  <div className="tf-callout-title">⚖️ Equal Opportunity Mandate</div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#1e3a8a', lineHeight: 1.6 }}>
                    Customers and users agree to use SmartHire in full compliance with federal, state, and international employment regulations, including Title VII of the Civil Rights Act, the Americans with Disabilities Act (ADA), and the Age Discrimination in Employment Act (ADEA).
                  </p>
                </div>
                <p>
                  Users shall not use SmartHire’s AI filters or search capabilities to discriminate against candidates based on race, color, religion, sex, sexual orientation, gender identity, national origin, veteran status, or disability status.
                </p>
              </section>

              {/* Section 6 */}
              <section id="confidentiality" className="tf-legal-section">
                <h2 className="tf-section-heading">6. Confidentiality & Security Protocols</h2>
                <p>
                  "Confidential Information" refers to all proprietary client job requisitions, candidate resume databases, billing pay rates, and technical specifications exchanged on the platform.
                </p>
                <p>
                  Each party agrees to hold the other’s Confidential Information in strict confidence, exercising at least the same standard of care used to protect its own proprietary assets. SmartHire maintains SOC-2 certified cloud hosting controls, AES-256 data encryption, and role-segregated database rules.
                </p>
              </section>

              {/* Section 7 */}
              <section id="ip-rights" className="tf-legal-section">
                <h2 className="tf-section-heading">7. Intellectual Property & Customer Ownership</h2>
                <p>
                  <strong>Customer Data Ownership:</strong> As between Customer and SmartHire, Customer exclusively owns all right, title, and interest in all candidate resumes, requisition notes, customer logos, and client files uploaded into the platform.
                </p>
                <p>
                  <strong>SmartHire Platform Rights:</strong> SmartHire retains all proprietary rights, copyright, and trade secrets in the platform software, algorithms, UI components, data structures, and documentation.
                </p>
              </section>

              {/* Section 8 */}
              <section id="liability-warranty" className="tf-legal-section">
                <h2 className="tf-section-heading">8. 99.9% Uptime SLA & Limitations of Liability</h2>
                <p>
                  SmartHire warrants that the platform will operate with commercial availability meeting an enterprise uptime service level of 99.9%.
                </p>
                <p>
                  SmartHire provides candidate matching scoring and profile insights as recruitment decision-support tools. The ultimate hiring, compensation, and background verification decisions remain the sole responsibility of the Customer and employer.
                </p>
              </section>

              {/* Section 9 */}
              <section id="termination" className="tf-legal-section">
                <h2 className="tf-section-heading">9. Term, Termination & 30-Day Export Guarantee</h2>
                <p>
                  This Agreement remains effective for the term of the Customer’s subscription plan. Either party may terminate upon written notice if the other party commits a material breach and fails to cure such breach within thirty (30) days.
                </p>
                <p>
                  Upon termination, Customer may request a full JSON/Excel export of all candidate records, resume attachments, and requisition history within thirty (30) days following account closure.
                </p>
              </section>

              {/* Section 10 */}
              <section id="governing-law" className="tf-legal-section">
                <h2 className="tf-section-heading">10. Governing Law & Legal Desk</h2>
                <p>
                  This Agreement is governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to conflict of law principles.
                </p>
                <div className="tf-callout-card">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
                    <div><strong>SmartHire Enterprise Inc.</strong> — Legal & Regulatory Division</div>
                    <div><strong>Corporate Legal Inquiries:</strong> <a href="mailto:legal@smarthire.ai" style={{ color: '#2563eb', fontWeight: 600 }}>legal@smarthire.ai</a></div>
                    <div><strong>Contracts & Compliance Desk:</strong> <a href="mailto:compliance@smarthire.ai" style={{ color: '#2563eb', fontWeight: 600 }}>compliance@smarthire.ai</a></div>
                    <div>
                      <Link to="/about#inquiry" className="tf-btn-support">
                        Contact Enterprise Contracts Desk →
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

export default Terms
