import React from 'react'
import SiteLayout from '../components/SiteLayout'

function PrivacyPolicy() {
  return (
    <SiteLayout>
      <section className="section">
        <div className="container narrow text-block">
          <h1 className="page-title">Privacy Policy</h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Last updated: July 29, 2026</p>
          <p>
            At VerifyHire, we take data privacy and security seriously. All candidate identification records, resumes, screening responses, and audit records processed by our platform are securely encrypted in transit and at rest.
          </p>
          <p>
            Recruiters and employers can manage their candidate screening sessions. We do not sell or share any candidate data with third-party networks. All facial verification telemetry and background credentials checks are kept strictly confidential for identity screening purposes only.
          </p>
        </div>
      </section>
    </SiteLayout>
  )
}

export default PrivacyPolicy
