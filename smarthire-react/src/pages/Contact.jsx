import React, { useState } from 'react'
import SiteLayout from '../components/SiteLayout'

function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <SiteLayout>
      <section className="section">
        <div className="container narrow">
          <p className="eyebrow">Enterprise Support</p>
          <h1 className="page-title">Talk to our support team</h1>
          {submitted ? (
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: 20, borderRadius: 8, marginTop: 20 }}>
              <p style={{ color: '#047857', fontWeight: 'bold', margin: 0 }}>✓ Inquiry Submitted Successfully</p>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>Thank you for reaching out. A platform representative will contact you shortly.</p>
            </div>
          ) : (
            <>
              <p style={{ color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 20 }}>
                Have questions about our AI screening workflow, recruiter integrations, or security rules? Get in touch with our team.
              </p>
              <form className="form" onSubmit={handleSubmit}>
                <label>Name<input type="text" required placeholder="Your name" /></label>
                <label>Email<input type="email" required placeholder="you@company.com" /></label>
                <label>Message<textarea required rows="5" placeholder="Tell us what you need" /></label>
                <button className="btn" type="submit">Submit Inquiry</button>
              </form>
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  )
}

export default Contact
