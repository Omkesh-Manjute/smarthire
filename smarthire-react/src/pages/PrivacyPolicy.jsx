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
            🛡️ Trust, Privacy & Data Protection
          </div>

          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            margin: '0 0 10px',
            lineHeight: 1.2
          }}>
            SmartHire Privacy Policy
          </h1>

          <p style={{
            fontSize: '15px',
            color: '#cbd5e1',
            maxWidth: '720px',
            margin: '0 0 20px',
            lineHeight: 1.6
          }}>
            We are dedicated to safeguarding candidate identification records, resume intelligence, recruiter telemetry, and client data with enterprise-grade encryption and ethical AI governance.
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '12px',
            color: '#94a3b8'
          }}>
            <span>📅 <strong>Last Updated:</strong> August 26, 2026</span>
            <span>⚡ <strong>Version:</strong> 3.4 (Enterprise Edition)</span>
            <span>🌐 <strong>Applicability:</strong> Global (GDPR, CCPA & EEOC Compliant)</span>
          </div>
        </div>
      </section>

      {/* ─── QUICK TRUST HIGHLIGHT PILLS ─── */}
      <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '16px 20px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔒</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>AES-256 & TLS 1.3</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Full encryption in transit & rest</div>
            </div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🚫</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>No Data Selling</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>We never sell candidate data</div>
            </div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🤖</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>Explainable AI</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Unbiased candidate matching</div>
            </div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚖️</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>GDPR & CCPA Ready</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Full candidate data sovereignty</div>
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
            Table of Contents
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
            <div>Need privacy assistance?</div>
            <a href="mailto:privacy@smarthire.ai" style={{ color: '#0033cc', fontWeight: 'bold', textDecoration: 'none' }}>
              privacy@smarthire.ai
            </a>
          </div>
        </aside>

        {/* Structured Legal Content */}
        <main style={{ fontSize: '14px', lineHeight: 1.7, color: '#334155' }}>
          
          {/* Section 1: Overview */}
          <section id="overview" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              1. Overview & Scope
            </h2>
            <p>
              This Privacy Policy applies to the <strong>SmartHire</strong> candidate relationship management (CRM), applicant tracking system (ATS), vendor management system (VMS), and AI candidate screening platform operated by SmartHire Enterprise Inc. (collectively, "SmartHire", "we", "our", or "us").
            </p>
            <p>
              By accessing or using our recruitment portal, job application pages, candidate verification tools, or related APIs, you acknowledge that you have read and understood this Privacy Policy. This policy explains how we collect, store, process, protect, and disclose personal and professional candidate and enterprise user data.
            </p>
          </section>

          {/* Section 2: Information We Collect */}
          <section id="information-collected" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              2. Information We Collect
            </h2>
            <p>We collect information categorized across three primary sources:</p>
            
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px 18px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 6px' }}>A. Candidate & Applicant Data</h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li><strong>Identity & Contact Details:</strong> Full name, email address, telephone number, city, state, postal code, and country of residence.</li>
                <li><strong>Professional Credentials:</strong> Work history, job titles, educational qualifications, certifications, technology skills, resume documents (.pdf, .docx), portfolio links, and LinkedIn profiles.</li>
                <li><strong>Compensation & Work Authorization:</strong> Expected hourly pay rate, billing rate type (C2C, W2, 1099), work authorization status (US Citizen, Green Card, H-1B, OPT, etc.), and availability timelines.</li>
              </ul>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px 18px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 6px' }}>B. Enterprise Recruiter & Employer Telemetry</h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Corporate login credentials, corporate email addresses, user roles (Admin, Manager, Recruiter, Employee).</li>
                <li>Requisition allocation records, candidate submission activity logs, interview scheduling timestamps, and hiring audit trails.</li>
              </ul>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px 18px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 6px' }}>C. Automated Device & Log Data</h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>IP address, browser type and version, operating system, session duration, and page access timestamps.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: How We Use Data */}
          <section id="how-we-use-data" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              3. How We Use Data
            </h2>
            <p>SmartHire uses collected information exclusively for authorized recruitment, staffing, and compliance purposes:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>Requisition Matching:</strong> Comparing candidate experience and skill sets against open client job descriptions to notify assigned recruiters of high-affinity matches.</li>
              <li><strong>Client Submissions & Approvals:</strong> Transmitting candidate profiles and resumes to hiring managers and enterprise customers who have posted the respective job requisition.</li>
              <li><strong>Real-Time Activity Notifications:</strong> Delivering live in-app notifications and email alerts when a candidate is assigned, screened, interviewed, approved, or placed.</li>
              <li><strong>Audit Logging & Anti-Fraud:</strong> Preventing duplicate submissions, tracking sourcing ownership, and ensuring compliance with vendor SLAs.</li>
            </ul>
          </section>

          {/* Section 4: AI Matching & Screening */}
          <section id="ai-processing" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              4. AI Matching & Screening Telemetry
            </h2>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '14px 18px', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>
                🤖 Ethical AI Principles
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#1e3a8a' }}>
                SmartHire’s automated semantic matching algorithms evaluate candidates solely on verified job requirements, skill compatibility, and work history. Our AI models are strictly prohibited from using age, race, gender, ethnicity, disability, or religious data in hiring recommendations.
              </p>
            </div>
            <p>
              Candidate data is <strong>never used to train public external foundation models</strong>. All embeddings, scoring data, and screening session outputs remain private to your enterprise tenant.
            </p>
          </section>

          {/* Section 5: Data Sharing */}
          <section id="data-sharing" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              5. Information Sharing & Disclosures
            </h2>
            <p>
              <strong>We do not sell, rent, trade, or monetize candidate personal information or contact details.</strong>
            </p>
            <p>We only share data under the following strictly defined conditions:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>Authorized Enterprise Clients:</strong> When a recruiter submits a candidate to a specific open client requisition.</li>
              <li><strong>Verified Infrastructure Providers:</strong> Secure hosting and cloud database infrastructure (Firebase Cloud Firestore, Google Cloud Platform, Vercel) bound by stringent data processing agreements (DPAs).</li>
              <li><strong>Legal & Regulatory Mandates:</strong> Where required by applicable law, court summons, or regulatory authorities.</li>
            </ul>
          </section>

          {/* Section 6: Data Security & Retention */}
          <section id="security-retention" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              6. Data Security & Retention
            </h2>
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
          <section id="user-rights" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              7. Your Rights (GDPR, CCPA & Global Rights)
            </h2>
            <p>Under applicable privacy laws, candidates and users maintain the following rights:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '12px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px 12px' }}>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>📋 Right to Access</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Request an export copy of all stored profile data and submission logs.</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px 12px' }}>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>✏️ Right to Rectification</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Update incorrect contact info, skills, or resume documents anytime.</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px 12px' }}>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>🗑️ Right to Erasure</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Request permanent deletion of your candidate record from our talent pool.</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px 12px' }}>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>🚫 Right to Opt-Out</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Opt out of automated job matching alerts and notifications at any time.</div>
              </div>
            </div>
          </section>

          {/* Section 8: Contact DPO */}
          <section id="contact-dpo" style={{ marginBottom: '36px', scrollMarginTop: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
              8. Contact Our Data Protection Officer (DPO)
            </h2>
            <p>
              If you have any questions, data subject access requests (DSARs), or privacy concerns regarding this policy, please reach out to our dedicated privacy office:
            </p>
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>SmartHire Enterprise Inc.</strong> — Privacy & Compliance Division</div>
              <div><strong>Data Protection Officer:</strong> DPO & Legal Affairs</div>
              <div><strong>Direct Email:</strong> <a href="mailto:privacy@smarthire.ai" style={{ color: '#0033cc' }}>privacy@smarthire.ai</a> / <a href="mailto:dpo@smarthire.ai" style={{ color: '#0033cc' }}>dpo@smarthire.ai</a></div>
              <div><strong>Enterprise Support Desk:</strong> <Link to="/contact" style={{ color: '#0033cc' }}>Visit Support Center &gt;&gt;</Link></div>
            </div>
          </section>

        </main>
      </div>
    </SiteLayout>
  )
}

export default PrivacyPolicy
