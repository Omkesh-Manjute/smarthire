import React, { useState } from 'react'
import SiteLayout from '../components/SiteLayout'
import { Link } from 'react-router-dom'

function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: 'Enterprise Recruiter',
    inquiryType: 'Enterprise Demo & Sales',
    message: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
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
        <div style={{ maxWidth: '1120px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '16px'
          }}>
            🏢 Enterprise Inquiries & Staffing Support
          </div>

          <h1 style={{
            fontSize: '34px',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            margin: '0 0 12px',
            lineHeight: 1.2
          }}>
            Get in touch with our team
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#cbd5e1',
            maxWidth: '660px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Have questions regarding our enterprise ATS/VMS operating system, AI candidate screening models, or custom integrations? We're here to help.
          </p>
        </div>
      </section>

      {/* ─── MAIN CONTACT SECTION ─── */}
      <section style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 20px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '36px', alignItems: 'start' }}>
          
          {/* Left: Contact Channels Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 14px' }}>
                Direct Channels
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '18px' }}>✉️</span>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>General & Sales</div>
                    <a href="mailto:contact@smarthire.ai" style={{ color: '#0033cc', textDecoration: 'none' }}>contact@smarthire.ai</a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '18px' }}>🎧</span>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>Technical Support</div>
                    <a href="mailto:support@smarthire.ai" style={{ color: '#0033cc', textDecoration: 'none' }}>support@smarthire.ai</a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '18px' }}>🛡️</span>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>Privacy & Security</div>
                    <a href="mailto:privacy@smarthire.ai" style={{ color: '#0033cc', textDecoration: 'none' }}>privacy@smarthire.ai</a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '18px' }}>📞</span>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>Enterprise Support Line</div>
                    <span style={{ color: '#334155' }}>+1 (800) 555-SMART (7627)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links Card */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                Helpful Resources
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#0033cc', lineHeight: 1.8 }}>
                <li><Link to="/support" style={{ color: '#0033cc', textDecoration: 'none' }}>Knowledge Base & FAQ</Link></li>
                <li><Link to="/privacy" style={{ color: '#0033cc', textDecoration: 'none' }}>Privacy Policy</Link></li>
                <li><Link to="/terms" style={{ color: '#0033cc', textDecoration: 'none' }}>Terms of Service</Link></li>
                <li><Link to="/careers" style={{ color: '#0033cc', textDecoration: 'none' }}>Public Careers Portal</Link></li>
              </ul>
            </div>

          </div>

          {/* Right: Contact Form */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '28px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 6px' }}>
              Send an Inquiry
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>
              Fill in the form below and an enterprise account specialist will respond within 1 business day.
            </p>

            {submitted ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎉</div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534', margin: '0 0 6px' }}>
                  Thank you for reaching out!
                </h3>
                <p style={{ fontSize: '13px', color: '#166534', margin: '0 0 16px' }}>
                  Your message has been received. Our team will review your inquiry and contact you at <strong>{formData.email}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false)
                    setFormData({ name: '', email: '', company: '', role: 'Enterprise Recruiter', inquiryType: 'Enterprise Demo & Sales', message: '' })
                  }}
                  style={{
                    background: '#166534',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 18px',
                    fontSize: '12.5px',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Sarah Connor"
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                      Corporate Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="sarah@enterprise.com"
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={e => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Apex Staffing"
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                      Inquiry Type
                    </label>
                    <select
                      value={formData.inquiryType}
                      onChange={e => setFormData({ ...formData, inquiryType: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#ffffff', outline: 'none' }}
                    >
                      <option value="Enterprise Demo & Sales">Enterprise Demo & Sales</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Partnership / Integration">Partnership / Integration</option>
                      <option value="Billing & Licensing">Billing & Licensing</option>
                      <option value="Legal & Privacy">Legal & Privacy</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                    Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe how we can support your recruitment and staffing operations..."
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: '#0033cc',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px 20px',
                    fontSize: '13.5px',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    boxShadow: '0 2px 4px rgba(0,51,204,0.2)'
                  }}
                >
                  ✉️ Send Inquiry
                </button>
              </form>
            )}
          </div>

        </div>
      </section>
    </SiteLayout>
  )
}

export default Contact
