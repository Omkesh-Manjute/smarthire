import React, { useState } from 'react'
import SiteLayout from '../components/SiteLayout'
import { Link } from 'react-router-dom'

function Support() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openFaq, setOpenFaq] = useState(0)
  const [ticketSubmitted, setTicketSubmitted] = useState(false)
  const [generatedTicketId, setGeneratedTicketId] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    category: 'Requisition & Workflow',
    priority: 'Medium',
    subject: '',
    message: ''
  })

  const faqs = [
    {
      q: 'How does the automated candidate matching feature work?',
      a: 'When a new job requisition is created or updated, SmartHire’s semantic matching engine evaluates candidates in your pool against required skills, experience, location, and rate. If strong matches are identified, assigned recruiters receive instant real-time notifications via the Activity Bell to review and submit candidates immediately.'
    },
    {
      q: 'How do Lead Managers review and approve candidate submissions?',
      a: 'Managers can navigate to the Requisitions tab, open any position, and view the "Submissions / Pipeline" tab. From there, managers can inspect candidate profiles, adjust billing pay rates, change hiring statuses (e.g., Int-ApprovedByManager, Client-SubmittedToCustomer), and add interview schedules or status audit notes.'
    },
    {
      q: 'Can employees add candidates to their own sourcing pool?',
      a: 'Yes. Team members with the Employee role can access "My Candidate Pool", upload candidate resumes, and register their skills and contact info. When assigned to a requisition, employees can seamlessly select candidates from their personal pool and assign them with full attribution tracking.'
    },
    {
      q: 'How do I export candidate lists or submission activity to Excel?',
      a: 'In both the Candidate Directory and the Reports tabs, click the "Export Results to Excel" or "Export CSV" buttons located in the top table toolbar. The system will generate a standardized spreadsheet containing all filtered candidate records, pay rates, and submission history.'
    },
    {
      q: 'What should I do if a team member cannot log in or needs a password reset?',
      a: 'Super Admins and Managers can navigate to the "Manage Team" tab in the dashboard, locate the user record, and either reset their password or update their account status. For urgent account recoveries, you can also submit a priority ticket below.'
    },
    {
      q: 'Is our candidate and requisition data encrypted and confidential?',
      a: 'Yes. All data stored in SmartHire is encrypted at rest using AES-256 and in transit using TLS 1.3. Role-based access controls ensure team members only access requisitions and candidates assigned to their organization.'
    }
  ]

  const filteredFaqs = faqs.filter(f =>
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmitTicket = (e) => {
    e.preventDefault()
    const randomTicket = `TKT-${Math.floor(100000 + Math.random() * 900000)}`
    setGeneratedTicketId(randomTicket)
    setTicketSubmitted(true)
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
            🎧 24/7 Enterprise Help & Customer Support
          </div>

          <h1 style={{
            fontSize: '34px',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            margin: '0 0 12px',
            lineHeight: 1.2
          }}>
            How can we help your team today?
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#cbd5e1',
            maxWidth: '680px',
            margin: '0 auto 24px',
            lineHeight: 1.6
          }}>
            Search our recruitment operating system knowledge base, browse frequently asked questions, or submit a priority enterprise support ticket.
          </p>

          {/* Quick Search Box */}
          <div style={{ maxWidth: '580px', margin: '0 auto', position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 Search questions, workflows, approvals, or candidate matching..."
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: '#ffffff',
                color: '#0f172a',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </section>

      {/* ─── QUICK TOPIC CARDS ─── */}
      <section style={{ background: '#f8fafc', padding: '32px 20px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔧</div>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px' }}>System Setup & Access</h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              User logins, corporate email setups, role assignments, and password management.
            </p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px' }}>Requisitions & Sourcing</h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              CoolWorks requisition intake, recruiter allocations, candidate pooling, and rate setting.
            </p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤖</div>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px' }}>AI Matchmaker & Alerts</h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Real-time activity bell notifications, candidate qualification scoring, and match alerts.
            </p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px' }}>Reports & Submissions</h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Excel exports, submission audits, hiring approvals, and recruiter performance analytics.
            </p>
          </div>

        </div>
      </section>

      {/* ─── MAIN CONTENT: FAQS & TICKET FORM ─── */}
      <section style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 20px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '36px', alignItems: 'start' }}>
          
          {/* Left: Frequently Asked Questions Accordion */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                Frequently Asked Questions
              </h2>
              <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                {filteredFaqs.length} Answers
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredFaqs.map((faq, idx) => {
                const isOpen = openFaq === idx
                return (
                  <div
                    key={idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: isOpen ? '#f8fafc' : '#ffffff',
                        border: 'none',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13.5px',
                        color: isOpen ? '#0033cc' : '#0f172a'
                      }}
                    >
                      <span>{faq.q}</span>
                      <span style={{ fontSize: '14px', color: '#64748b', marginLeft: '12px' }}>
                        {isOpen ? '▲' : '▼'}
                      </span>
                    </button>

                    {isOpen && (
                      <div style={{
                        padding: '14px 16px',
                        borderTop: '1px solid #e2e8f0',
                        fontSize: '13px',
                        lineHeight: 1.65,
                        color: '#334155',
                        background: '#ffffff'
                      }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Direct Live Help Banner */}
            <div style={{
              marginTop: '30px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '14.5px', fontWeight: 'bold', color: '#1e40af' }}>
                  Didn't find what you're looking for?
                </h4>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#1e3a8a' }}>
                  Our technical support desk is available to assist your staffing operations.
                </p>
              </div>
              <a
                href="mailto:support@smarthire.ai"
                style={{
                  background: '#0033cc',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                ✉️ Email Support
              </a>
            </div>
          </div>

          {/* Right: Submit Support Ticket Box */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 6px' }}>
              Submit a Support Ticket
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 18px', lineHeight: 1.5 }}>
              Enterprise tickets receive an initial response within 1 hour under standard SLA.
            </p>

            {ticketSubmitted ? (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#166534', margin: '0 0 4px' }}>
                  Ticket Submitted Successfully!
                </h4>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', margin: '8px 0', background: '#ffffff', padding: '6px 12px', borderRadius: '4px', border: '1px solid #bbf7d0', display: 'inline-block' }}>
                  Ticket ID: #{generatedTicketId}
                </div>
                <p style={{ fontSize: '12px', color: '#166534', margin: '8px 0 16px' }}>
                  A confirmation email has been dispatched to <strong>{formData.email}</strong>. Our enterprise team will follow up promptly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTicketSubmitted(false)
                    setFormData({
                      name: '', email: '', company: '', category: 'Requisition & Workflow', priority: 'Medium', subject: '', message: ''
                    })
                  }}
                  style={{
                    background: '#166534',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 16px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  + Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                    Corporate Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@company.com"
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      style={{ width: '100%', padding: '7px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#ffffff', outline: 'none' }}
                    >
                      <option value="Requisition & Workflow">Requisitions</option>
                      <option value="Candidate Pool">Candidate Pool</option>
                      <option value="Login & Accounts">Account Access</option>
                      <option value="AI Matchmaker">AI Matchmaker</option>
                      <option value="Billing & Plans">Billing & Plans</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value })}
                      style={{ width: '100%', padding: '7px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#ffffff', outline: 'none' }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">🚨 Urgent (SLA)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief description of the issue"
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                    Message Details *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide details about the requisition ID, candidate name, or error encountered..."
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: '#0033cc',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '4px',
                    boxShadow: '0 2px 4px rgba(0,51,204,0.2)'
                  }}
                >
                  🚀 Submit Ticket
                </button>
              </form>
            )}

            {/* System Status Indicator */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: '#64748b' }}>Platform Status:</span>
              <span style={{ color: '#16a34a', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                🟢 All Systems Operational
              </span>
            </div>
          </div>

        </div>
      </section>
    </SiteLayout>
  )
}

export default Support
