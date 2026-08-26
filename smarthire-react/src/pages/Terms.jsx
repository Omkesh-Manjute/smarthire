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
    { id: 'ip-rights', title: '7. Intellectual Property' },
    { id: 'liability-warranty', title: '8. Warranties & Liability Limits' },
    { id: 'termination', title: '9. Term & Termination' },
    { id: 'governing-law', title: '10. Governing Law & Contact' }
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
      {/* ─── HERO HEADER ─── */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        color: '#ffffff',
        padding: '50px 20px 45px',
        borderBottom: '1px solid #cbd5e1'
      }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '16px'
          }}>
            ⚖️ Enterprise Terms & Master Services Agreement
          </div>

          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            margin: '0 0 10px',
            lineHeight: 1.2
          }}>
            SmartHire Terms of Service
          </h1>

          <p style={{
            fontSize: '15px',
            color: '#cbd5e1',
            maxWidth: '720px',
            margin: '0 0 20px',
            lineHeight: 1.6
          }}>
            These Terms of Service govern enterprise access to the SmartHire ATS, VMS, AI candidate verification platform, and recruiter workforce management systems.
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '12px',
            color: '#94a3b8'
          }}>
            <span>📅 <strong>Effective Date:</strong> August 26, 2026</span>
            <span>⚡ <strong>MSA Ref:</strong> SH-ENT-2026-V3</span>
            <span>🏛️ <strong>Entity:</strong> SmartHire Enterprise Inc.</span>
          </div>
        </div>
      </section>

      {/* ─── QUICK HIGHLIGHT PILLS ─── */}
      <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '16px 20px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>💼</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>Enterprise VMS & ATS</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Multi-role recruiter staffing workflow</div>
            </div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>99.9% Uptime SLA</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>High availability enterprise infrastructure</div>
            </div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚖️</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>EEOC & Fair Hiring</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Strict anti-bias sourcing standards</div>
            </div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔐</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>Data Ownership</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Your candidate records remain yours</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT LAYOUT WITH STICKY TOC ─── */}
      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '36px 20px 60px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '36px', alignItems: 'start' }}>
        
        {/* Sticky Sidebar Navigation */}
        <aside style={{
          position: 'sticky',
          top: '80px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
            Agreement Sections
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                style={{
                  background: activeSection === sec.id ? '#eff6ff' : 'transparent',
                  color: activeSection === sec.id ? '#1d4ed8' : '#475569',
                  fontWeight: activeSection === sec.id ? 'bold' : 'normal',
                  border: 'none',
                  borderLeft: activeSection === sec.id ? '3px solid #2563eb' : '3px solid transparent',
                  textAlign: 'left',
                  padding: '6px 10px',
                  fontSize: '12px',
                  borderRadius: '0 4px 4px 0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {sec.title}
              </button>
            ))}
          </nav>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '11.5px', color: '#64748b' }}>
            <div>Have legal questions?</div>
            <a href="mailto:legal@smarthire.ai" style={{ color: '#0033cc', fontWeight: 'bold', textDecoration: 'none' }}>
              legal@smarthire.ai
            </a>
          </div>
        </aside>

        {/* Structured Legal Content */}
        <main style={{ fontSize: '14px', lineHeight: 1.7, color: '#334155' }}>
          
          {/* Section 1 */}
          <section id="acceptance" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              1. Acceptance of Agreement
            </h2>
            <p>
              By accessing, browsing, registering for, or using the <strong>SmartHire</strong> platform, web applications, candidate portals, or associated APIs, you ("Customer", "Enterprise Subscriber", or "Authorized User") agree to be legally bound by these Terms of Service, along with our <Link to="/privacy" style={{ color: '#0033cc', textDecoration: 'underline' }}>Privacy Policy</Link>.
            </p>
            <p>
              If you are accepting these terms on behalf of a company, staffing agency, or corporate enterprise, you represent and warrant that you possess the full legal authority to bind that entity to this Agreement.
            </p>
          </section>

          {/* Section 2 */}
          <section id="platform-services" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              2. Platform Services & Scope
            </h2>
            <p>
              SmartHire provides an enterprise SaaS recruitment operating system comprising:
            </p>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>Job Requisition Management:</strong> CoolWorks-style requisition intake, recruiter assignment, rate calculation, and client delivery tracking.</li>
              <li><strong>Candidate Pool Directory:</strong> Sourcing pipeline, resume document repository, screening status management, and candidate profile tracking.</li>
              <li><strong>Automated AI Matchmaker & Alerts:</strong> Instant matching notifications connecting newly registered requisitions with qualified available talent in your database.</li>
              <li><strong>Analytics & Executive Reports:</strong> Sourcing performance metrics, submission volume audits, and recruiter activity logs.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="account-governance" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              3. Enterprise Accounts & Role-Based Access Control (RBAC)
            </h2>
            <p>
              Access to SmartHire is segmented through strict organizational roles:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', margin: '14px 0' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px 12px' }}>
                <div style={{ fontWeight: 'bold', color: '#0284c7', fontSize: '12.5px' }}>👑 Super Admin / Admin</div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>Full organization tenant governance, user provisioning, rate overrides, and billing control.</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px 12px' }}>
                <div style={{ fontWeight: 'bold', color: '#d97706', fontSize: '12.5px' }}>🛡️ Lead Manager / Approver</div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>Team requisition assignment, candidate review, client submission approval, and recruiter oversight.</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px 12px' }}>
                <div style={{ fontWeight: 'bold', color: '#ea580c', fontSize: '12.5px' }}>💼 Lead Recruiter</div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>Candidate intake, requisition sourcing, submission staging, and interview management.</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px 12px' }}>
                <div style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '12.5px' }}>👤 Sourcing Employee</div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>Candidate profile building, resume uploads, and pool directory contribution.</div>
              </div>
            </div>
            <p>
              Users are responsible for maintaining the confidentiality of their login credentials and are strictly prohibited from sharing individual account logins across team members.
            </p>
          </section>

          {/* Section 4 */}
          <section id="candidate-sourcing" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              4. Candidate Sourcing & Ownership Rules
            </h2>
            <p>
              SmartHire enforces automated audit logging to prevent duplicate candidate submissions and maintain fair sourcing attribution across internal staffing teams:
            </p>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>Attribution Timestamp:</strong> When an employee or recruiter uploads a candidate, the candidate record is tagged with the creator's user ID and timestamp ("Sourced By").</li>
              <li><strong>Duplicate Detection:</strong> Submissions of duplicate email addresses or telephone numbers will prompt a warning to resolve potential multi-channel sourcing overlaps.</li>
              <li><strong>Representation Authorization:</strong> Recruiters represent that they have obtained consent from candidates prior to submitting their resumes to client job requisitions.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="eeoc-compliance" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              5. Non-Discrimination & Equal Employment Opportunity (EEOC)
            </h2>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '14px 18px', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>
                ⚖️ Equal Opportunity Mandate
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#1e3a8a' }}>
                Customers and users agree to use SmartHire in full compliance with federal, state, and international employment regulations, including Title VII of the Civil Rights Act, the Americans with Disabilities Act (ADA), and the Age Discrimination in Employment Act (ADEA).
              </p>
            </div>
            <p>
              Users shall not use SmartHire’s filtering or search capabilities to discriminate against candidates based on race, color, religion, sex, sexual orientation, gender identity, national origin, veteran status, or disability status.
            </p>
          </section>

          {/* Section 6 */}
          <section id="confidentiality" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              6. Confidentiality & Data Security
            </h2>
            <p>
              "Confidential Information" refers to all proprietary client job requisitions, candidate resume databases, billing pay rates, and technical specifications exchanged on the platform.
            </p>
            <p>
              Each party agrees to hold the other’s Confidential Information in strict confidence, exercising at least the same standard of care used to protect its own proprietary assets. SmartHire maintains SOC-2 certified cloud hosting controls, AES-256 data encryption, and role-segregated databases.
            </p>
          </section>

          {/* Section 7 */}
          <section id="ip-rights" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              7. Intellectual Property & Customer Ownership
            </h2>
            <p>
              <strong>Customer Data Ownership:</strong> As between Customer and SmartHire, Customer exclusively owns all right, title, and interest in all candidate resumes, requisition notes, customer logos, and client files uploaded into the platform.
            </p>
            <p>
              <strong>SmartHire Platform Rights:</strong> SmartHire retains all proprietary rights, copyright, and trade secrets in the platform software, algorithms, UI components, data structures, and documentation.
            </p>
          </section>

          {/* Section 8 */}
          <section id="liability-warranty" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              8. Warranties & Limitations of Liability
            </h2>
            <p>
              SmartHire warrants that the platform will operate with commercial availability meeting an enterprise uptime service level of 99.9%.
            </p>
            <p>
              SmartHire provides candidate matching scoring and profile insights as recruitment decision-support tools. The ultimate hiring, compensation, and background verification decisions remain the sole responsibility of the Customer and employer.
            </p>
          </section>

          {/* Section 9 */}
          <section id="termination" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              9. Term & Termination
            </h2>
            <p>
              This Agreement remains effective for the term of the Customer’s subscription plan. Either party may terminate upon written notice if the other party commits a material breach and fails to cure such breach within thirty (30) days.
            </p>
            <p>
              Upon termination, Customer may request a full JSON/Excel export of all candidate records and requisition history within thirty (30) days following account closure.
            </p>
          </section>

          {/* Section 10 */}
          <section id="governing-law" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              10. Governing Law & Legal Inquiries
            </h2>
            <p>
              This Agreement is governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to conflict of law principles.
            </p>
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>SmartHire Enterprise Inc.</strong> — Legal & Regulatory Division</div>
              <div><strong>Corporate Legal Inquiries:</strong> <a href="mailto:legal@smarthire.ai" style={{ color: '#0033cc' }}>legal@smarthire.ai</a></div>
              <div><strong>Contracts & Compliance Desk:</strong> <a href="mailto:compliance@smarthire.ai" style={{ color: '#0033cc' }}>compliance@smarthire.ai</a></div>
              <div><strong>Support Center:</strong> <Link to="/contact" style={{ color: '#0033cc' }}>Visit Enterprise Support &gt;&gt;</Link></div>
            </div>
          </section>

        </main>
      </div>
    </SiteLayout>
  )
}

export default Terms
