import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import SiteLayout from '../components/SiteLayout'
import CandidatePdfReportModal from '../components/CandidatePdfReportModal'

const initialCandidates = [
  { name: 'Rahul Kumar', role: 'Java Developer', city: 'Austin, TX', score: 87, status: 'Trusted', date: '2026-06-15' },
  { name: 'Anita Shah', role: 'Data Engineer', city: 'Dallas, TX', score: 74, status: 'Review', date: '2026-06-14' },
  { name: 'Vikram Nair', role: 'DevOps Engineer', city: 'Chicago, IL', score: 61, status: 'Risk', date: '2026-06-12' },
  { name: 'Priya Patel', role: 'Frontend Architect', city: 'Houston, TX', score: 94, status: 'Trusted', date: '2026-06-15' },
  { name: 'Arjun Mehta', role: 'Product Manager', city: 'San Jose, CA', score: 81, status: 'Trusted', date: '2026-06-11' },
]

function RecruiterDashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedCandidateForPdf, setSelectedCandidateForPdf] = useState(null)

  // User state
  const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user')
  let currentUser = null
  try {
    if (userStr) currentUser = JSON.parse(userStr)
  } catch (e) {}

  const userRole = currentUser?.role || 'recruiter'
  const isSuperAdmin = userRole === 'superadmin' || userRole === 'admin'
  const refCode = currentUser?.refCode || (currentUser?.name ? currentUser.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'default-ref')

  // Referral link generator
  const origin = window.location.origin
  const recruiterShareLink = `${origin}/careers?ref=${refCode}`
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(recruiterShareLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  // Super Admin - Recruiter Creation & Management State
  const [recruiters, setRecruiters] = useState([
    { _id: '1', name: 'Rahul Sharma', email: 'rahul@smarthire.com', refCode: 'rahul-sharma-892', totalCandidates: 14, trustedCandidates: 11, isActive: true },
    { _id: '2', name: 'Priya Verma', email: 'priya@smarthire.com', refCode: 'priya-verma-341', totalCandidates: 9, trustedCandidates: 7, isActive: true }
  ])
  const [showAddRecruiterModal, setShowAddRecruiterModal] = useState(false)
  const [newRecName, setNewRecName] = useState('')
  const [newRecEmail, setNewRecEmail] = useState('')
  const [newRecPass, setNewRecPass] = useState('')
  const [newRecCompany, setNewRecCompany] = useState('')
  const [newRecCustomRef, setNewRecCustomRef] = useState('')
  const [recruiterMsg, setRecruiterMsg] = useState('')
  const [recruiterError, setRecruiterError] = useState('')

  // Load Backend Data
  React.useEffect(() => {
    const token = localStorage.getItem('smarthire_token')
    if (token && isSuperAdmin) {
      fetch('/api/users/recruiters', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.recruiters) {
            setRecruiters(data.data.recruiters)
          }
        })
        .catch(() => {})
    }
  }, [isSuperAdmin])

  const handleCreateRecruiter = async (e) => {
    e.preventDefault()
    setRecruiterMsg('')
    setRecruiterError('')
    const token = localStorage.getItem('smarthire_token')
    
    try {
      if (token) {
        const res = await fetch('/api/users/recruiter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newRecName,
            email: newRecEmail,
            password: newRecPass,
            company: newRecCompany,
            customRefCode: newRecCustomRef
          })
        })
        const data = await res.json()
        if (data.success) {
          setRecruiterMsg(`Recruiter ${newRecName} created successfully! Link: ${origin}/careers?ref=${data.data.recruiter.refCode}`)
          setRecruiters([data.data.recruiter, ...recruiters])
          setNewRecName('')
          setNewRecEmail('')
          setNewRecPass('')
          setNewRecCompany('')
          setNewRecCustomRef('')
          setTimeout(() => setShowAddRecruiterModal(false), 2000)
        } else {
          setRecruiterError(data.message || 'Failed to create recruiter')
        }
      } else {
        // Fallback local mockup
        const mockRef = newRecCustomRef || newRecName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-991'
        const newRec = {
          _id: Date.now().toString(),
          name: newRecName,
          email: newRecEmail,
          refCode: mockRef,
          totalCandidates: 0,
          trustedCandidates: 0,
          isActive: true
        }
        setRecruiters([newRec, ...recruiters])
        setRecruiterMsg(`Recruiter ${newRecName} created successfully! Link: ${origin}/careers?ref=${mockRef}`)
        setNewRecName('')
        setNewRecEmail('')
        setNewRecPass('')
        setNewRecCompany('')
        setNewRecCustomRef('')
        setTimeout(() => setShowAddRecruiterModal(false), 2000)
      }
    } catch (err) {
      setRecruiterError('Error creating recruiter: ' + err.message)
    }
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const getAvatarColorClass = (status) => {
    const s = status.toLowerCase()
    if (s === 'trusted') return ''
    if (s === 'review') return 'avatar-orange'
    return 'avatar-red'
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#15803d'
    if (score >= 60) return '#d97706'
    return '#b91c1c'
  }

  const candidatesList = [
    { name: 'Rahul Kumar', role: 'Java Developer', city: 'Austin, TX', score: 87, status: 'Trusted', date: '2026-06-15', referredBy: 'Rahul Sharma (ref: rahul-sharma)' },
    { name: 'Anita Shah', role: 'Data Engineer', city: 'Dallas, TX', score: 74, status: 'Review', date: '2026-06-14', referredBy: 'Priya Verma (ref: priya-verma)' },
    { name: 'Vikram Nair', role: 'DevOps Engineer', city: 'Chicago, IL', score: 61, status: 'Risk', date: '2026-06-12', referredBy: 'Direct Applicant' },
    { name: 'Priya Patel', role: 'Frontend Architect', city: 'Houston, TX', score: 94, status: 'Trusted', date: '2026-06-15', referredBy: 'Rahul Sharma (ref: rahul-sharma)' },
    { name: 'Arjun Mehta', role: 'Product Manager', city: 'San Jose, CA', score: 81, status: 'Trusted', date: '2026-06-11', referredBy: 'Direct Applicant' },
  ]

  const filteredCandidates = candidatesList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <SiteLayout>
      <section className="section">
        <div className="container-wide">
          {/* Header Area */}
          <div className="dashboard-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="eyebrow">COMMAND CONSOLE</span>
                {isSuperAdmin ? (
                  <span style={{ background: '#7C3AED', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px' }}>SUPER ADMIN MODE</span>
                ) : (
                  <span style={{ background: '#2563EB', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px' }}>RECRUITER PORTAL</span>
                )}
              </div>
              <h1 className="page-title">{isSuperAdmin ? 'Master Super Admin Control Hub' : 'Recruiter Workspace & Share Hub'}</h1>
              <p className="lead">
                Monitor live candidate verification pipelines, track recruiter referral links, and inspect candidate compliance.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/ats" className="btn btn-primary-premium">
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Verification
              </Link>
            </div>
          </div>

          {/* Recruiter Referral Link Hub Card */}
          <div style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(124, 58, 237, 0.05))', border: '1px solid rgba(37, 99, 235, 0.2)', borderRadius: '16px', padding: '24px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--ink)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔗 Your Unique Recruiter Referral Link
                  <span style={{ fontSize: '12px', background: 'rgba(37, 99, 235, 0.15)', color: '#2563EB', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                    TAG: {refCode}
                  </span>
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--ink-soft)', margin: 0 }}>
                  Share this unique link with candidates. Any candidate who applies via this link will automatically be tagged to your account.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', maxWidth: '520px' }}>
                <input
                  type="text"
                  readOnly
                  value={recruiterShareLink}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: '#fff',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    fontWeight: '600'
                  }}
                />
                <button
                  onClick={handleCopyLink}
                  className="btn"
                  style={{
                    background: copiedLink ? '#16a34a' : '#2563EB',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {copiedLink ? '✓ Copied!' : 'Copy Link 📋'}
                </button>
              </div>
            </div>
          </div>

          {/* Super Admin - Recruiter Team Management Panel */}
          {isSuperAdmin && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--ink)', margin: 0 }}>
                    👥 Recruiter Team & Referral Attribution Control
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: '4px 0 0 0' }}>
                    Create login credentials for recruiters and view real-time attribution reports on candidate acquisition.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddRecruiterModal(true)}
                  style={{
                    background: '#7C3AED',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  + Add New Recruiter Account
                </button>
              </div>

              {/* Recruiter Table */}
              <div className="table-wrap" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700' }}>Recruiter Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700' }}>Email Address</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700' }}>Ref Tag Code</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '700' }}>Candidates Sourced</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '700' }}>Trusted Rate</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '700' }}>Actions & Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recruiters.map((rec) => (
                      <tr key={rec._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 16px', fontWeight: '700', color: 'var(--ink)' }}>{rec.name}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--ink-soft)', fontSize: '13px' }}>{rec.email}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontFamily: 'monospace', background: '#EFF6FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                            {rec.refCode}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '800', color: '#2563EB' }}>{rec.totalCandidates}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', color: '#16a34a' }}>{rec.trustedCandidates}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${origin}/careers?ref=${rec.refCode}`)
                              alert(`Copied link for ${rec.name}:\n${origin}/careers?ref=${rec.refCode}`)
                            }}
                            style={{ background: 'rgba(37,99,235,0.08)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Copy Link 🔗
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add Recruiter Modal */}
          {showAddRecruiterModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 999 }}>
              <div style={{ background: '#fff', width: '90%', maxWidth: '480px', borderRadius: '16px', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Create New Recruiter Account</h3>
                  <button onClick={() => setShowAddRecruiterModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                </div>
                {recruiterMsg && <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', fontWeight: '600' }}>{recruiterMsg}</div>}
                {recruiterError && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', fontWeight: '600' }}>{recruiterError}</div>}
                <form onSubmit={handleCreateRecruiter}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Recruiter Full Name</label>
                    <input type="text" required value={newRecName} onChange={(e) => setNewRecName(e.target.value)} placeholder="e.g. Rahul Sharma" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }} />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Login Email Address</label>
                    <input type="email" required value={newRecEmail} onChange={(e) => setNewRecEmail(e.target.value)} placeholder="e.g. rahul@smarthire.com" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }} />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Password</label>
                    <input type="password" required value={newRecPass} onChange={(e) => setNewRecPass(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }} />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Company / Agency Name (Optional)</label>
                    <input type="text" value={newRecCompany} onChange={(e) => setNewRecCompany(e.target.value)} placeholder="e.g. TechRecruit Inc" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }} />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Custom Referral Code (Optional)</label>
                    <input type="text" value={newRecCustomRef} onChange={(e) => setNewRecCustomRef(e.target.value)} placeholder="e.g. rahul-sharma" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', fontFamily: 'monospace' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setShowAddRecruiterModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                    <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#7C3AED', color: '#fff', cursor: 'pointer', fontWeight: '700' }}>Create Recruiter →</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="kpi-grid">
            <article className="kpi kpi-premium">
              <div className="kpi-icon-wrap">📊</div>
              <div>
                <h3>Total Candidate Verifications</h3>
                <p>128</p>
                <span className="kpi-trend trend-up">↑ 12% this week</span>
              </div>
            </article>
            <article className="kpi kpi-premium">
              <div className="kpi-icon-wrap kpi-icon-green">⚡</div>
              <div>
                <h3>Completed Today</h3>
                <p>19</p>
                <span className="kpi-trend trend-neutral">All systems nominal</span>
              </div>
            </article>
            <article className="kpi kpi-premium">
              <div className="kpi-icon-wrap kpi-icon-emerald">🛡️</div>
              <div>
                <h3>High Trust Rate</h3>
                <p>78%</p>
                <span className="kpi-trend trend-up">↑ 3% vs avg</span>
              </div>
            </article>
            <article className="kpi kpi-premium kpi-amber">
              <div className="kpi-icon-wrap kpi-icon-amber">⚠️</div>
              <div>
                <h3>Needs Review</h3>
                <p>22%</p>
                <span className="kpi-trend trend-down">↓ 1.4% change</span>
              </div>
            </article>
          </div>

          {/* Quick Actions Panel */}
          <div className="quick-actions-bar">
            <div className="bar-title">Quick Actions:</div>
            <div className="actions-links">
              <Link to="/ats" className="action-link-btn">
                <span>🎯 Go to ATS Workspace</span>
              </Link>
              <Link to="/reports" className="action-link-btn">
                <span>📋 View Intelligence Reports</span>
              </Link>
              {isSuperAdmin && (
                <Link to="/linkedin-posts" className="action-link-btn" style={{ borderColor: '#7C3AED', color: '#7C3AED' }}>
                  <span>🤖 LinkedIn Post Automation (Super Admin)</span>
                </Link>
              )}
            </div>
          </div>

          {/* Main Pipeline Table Section */}
          <div className="card pipeline-card">
            <div className="pipeline-header">
              <h2>Active Candidate Pipeline & Referral Attribution</h2>
              <div className="pipeline-filters">
                <input
                  type="text"
                  placeholder="Search candidate, role, city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="filter-input"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All Statuses</option>
                  <option value="Trusted">Trusted</option>
                  <option value="Review">Review</option>
                  <option value="Risk">Risk</option>
                </select>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Candidate Details</th>
                    <th>Target Role</th>
                    <th>Referral Attribution</th>
                    <th>Trust Score</th>
                    <th>Compliance Status</th>
                    <th>Date</th>
                    <th style={{ width: 140, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate) => (
                      <tr key={candidate.name}>
                        <td>
                          <div className="candidate-name-cell">
                            <div className={`candidate-avatar ${getAvatarColorClass(candidate.status)}`}>
                              {getInitials(candidate.name)}
                            </div>
                            <div>
                              <strong className="candidate-name-text">{candidate.name}</strong>
                              <span className="candidate-city-text">{candidate.city}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="candidate-role-text">{candidate.role}</span>
                        </td>
                        <td>
                          <span style={{ background: candidate.referredBy.includes('Direct') ? '#F1F5F9' : '#EFF6FF', color: candidate.referredBy.includes('Direct') ? '#64748B' : '#1D4ED8', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {candidate.referredBy.includes('Direct') ? '🌐 ' : '👤 '}
                            {candidate.referredBy}
                          </span>
                        </td>
                        <td>
                          <div className="score-container">
                            <div className="score-number-row">
                              <span className="score-val" style={{ color: getScoreColor(candidate.score) }}>
                                {candidate.score}%
                              </span>
                            </div>
                            <div className="score-bar-bg">
                              <div
                                className="score-bar-fill"
                                style={{
                                  width: `${candidate.score}%`,
                                  backgroundColor: getScoreColor(candidate.score),
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`pill ${candidate.status.toLowerCase()}`}>
                            {candidate.status === 'Trusted' && '🛡️ '}
                            {candidate.status === 'Review' && '⚠️ '}
                            {candidate.status === 'Risk' && '🚨 '}
                            {candidate.status}
                          </span>
                        </td>
                        <td>
                          <span className="date-text">{candidate.date}</span>
                        </td>
                        <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => setSelectedCandidateForPdf(candidate)}
                            style={{
                              background: 'rgba(37, 99, 235, 0.08)',
                              color: '#2563EB',
                              border: '1px solid rgba(37, 99, 235, 0.2)',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            PDF Report 📄
                          </button>
                          <Link to="/ats" className="action-btn-link" title="View in ATS Platform">
                            Manage →
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-soft)' }}>
                        No candidates found matching the filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Candidate PDF Verification Certificate Modal */}
      {selectedCandidateForPdf && (
        <CandidatePdfReportModal
          candidate={selectedCandidateForPdf}
          onClose={() => setSelectedCandidateForPdf(null)}
        />
      )}

      {/* Scoped Premium Styles */}
      <style>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .btn-primary-premium {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          border-radius: 12px;
          padding: 12px 22px;
          background: linear-gradient(135deg, var(--brand), #1a5e51);
          color: white;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(18, 106, 90, 0.2);
        }
        .btn-primary-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(18, 106, 90, 0.3);
          background: linear-gradient(135deg, #155549, #0f3d34);
        }
        .btn-icon {
          width: 16px;
          height: 16px;
        }
        .kpi-premium {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .kpi-icon-wrap {
          width: 42px;
          height: 42px;
          background: rgba(18, 39, 35, 0.05);
          border-radius: 10px;
          display: grid;
          place-items: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .kpi-icon-green {
          background: rgba(219, 127, 53, 0.1);
          color: var(--brand-2);
        }
        .kpi-icon-emerald {
          background: #dcfce7;
          color: #15803d;
        }
        .kpi-icon-amber {
          background: #fef3c7;
          color: #d97706;
        }
        .kpi-trend {
          display: block;
          font-size: 11px;
          font-weight: 600;
          margin-top: 6px;
        }
        .trend-up {
          color: #16a34a;
        }
        .trend-down {
          color: #dc2626;
        }
        .trend-neutral {
          color: var(--ink-soft);
        }
        
        .quick-actions-bar {
          background: rgba(239, 229, 210, 0.4);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .bar-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: var(--ink-soft);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .actions-links {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .action-link-btn {
          font-size: 13px;
          font-weight: 600;
          background: var(--surface);
          border: 1px solid var(--line);
          padding: 6px 14px;
          border-radius: 8px;
          color: var(--ink);
          transition: all 0.2s ease;
        }
        .action-link-btn:hover {
          background: var(--brand);
          color: white;
          border-color: var(--brand);
          transform: translateY(-1px);
        }

        .pipeline-card {
          padding: 24px;
          background: var(--surface);
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
          margin-bottom: 24px;
        }
        .pipeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .pipeline-header h2 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: var(--ink);
        }
        .pipeline-filters {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .filter-input {
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          border: 1px solid var(--line);
          background: var(--surface);
          width: 220px;
        }
        .filter-select {
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          border: 1px solid var(--line);
          background: var(--surface);
          cursor: pointer;
        }

        .candidate-name-text {
          display: block;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: var(--ink);
          font-size: 14px;
        }
        .candidate-city-text {
          display: block;
          font-size: 12px;
          color: var(--ink-soft);
          margin-top: 1px;
        }
        .candidate-role-text {
          font-weight: 600;
          font-size: 13.5px;
          color: var(--ink);
        }
        .score-container {
          width: 120px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .score-number-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .score-val {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          font-size: 13px;
        }
        .score-bar-bg {
          height: 6px;
          background: var(--surface-2);
          border-radius: 10px;
          overflow: hidden;
          width: 100%;
        }
        .score-bar-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.4s ease;
        }
        .date-text {
          font-size: 13px;
          color: var(--ink-soft);
        }
        .action-btn-link {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: var(--brand);
          transition: color 0.15s ease;
        }
        .action-btn-link:hover {
          color: var(--brand-2);
        }
      `}</style>
    </SiteLayout>
  )
}

export default RecruiterDashboard

