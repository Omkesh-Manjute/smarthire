import React, { useState, useMemo } from 'react'

function DashboardModule({
  totalCandidates = 0, liveCount = 0, activeJobs = 0, qualified = 0, newCandidates = 0, pendingRtr = 0,
  allCandidates = [], liveCandidates = [], jobsList = [], apiOnline = false, submissions = [], isSuperAdmin = true
}) {
  const [selectedReq, setSelectedReq] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editingFields, setEditingFields] = useState({})

  const safeCandidates = Array.isArray(allCandidates) ? allCandidates : []
  const safeJobs = Array.isArray(jobsList) ? jobsList : []
  const safeSubmissions = Array.isArray(submissions) ? submissions : []
  const safeLiveCandidates = Array.isArray(liveCandidates) ? liveCandidates : []

  // Today's metrics
  const today = new Date().toDateString()
  const todaysJobs = safeJobs.filter(j => {
    if (j && j.postedDate) return new Date(j.postedDate).toDateString() === today
    return false
  }).length
  const todaysSubmissions = safeSubmissions.filter(s => {
    if (s && s.submittedAt) return new Date(s.submittedAt).toDateString() === today
    return false
  }).length
  const placed = safeCandidates.filter(c => c && c.status === 'Placed').length
  const placementRate = totalCandidates > 0 ? ((placed / totalCandidates) * 100).toFixed(1) : 0
  const avgTimeToFill = placed > 0 ? '14.2' : '—'

  // Pipeline summary counts
  const pipelineCounts = {
    'New': safeCandidates.filter(c => c && c.status === 'New').length,
    'Reviewed': safeCandidates.filter(c => c && c.status === 'Reviewed').length,
    'Shortlisted': safeCandidates.filter(c => c && c.status === 'Shortlisted').length,
    'RTR Requested': safeCandidates.filter(c => c && c.status === 'RTR Requested').length,
    'RTR Received': safeCandidates.filter(c => c && c.status === 'RTR Received').length,
    'Interview Scheduled': safeCandidates.filter(c => c && c.status === 'Interview Scheduled').length,
    'Selected': safeCandidates.filter(c => c && c.status === 'Selected').length,
    'Rejected': safeCandidates.filter(c => c && c.status === 'Rejected').length,
  }

  // Upcoming deadlines (jobs with deadline field)
  const upcomingDeadlines = safeJobs
    .filter(j => j && j.deadline && (j.status === 'Active' || j.status === 'Posted'))
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4)

  const handleOpenReq = (job) => {
    setSelectedReq(job)
    setEditingFields({
      title: job.title || '',
      startDate: job.creationDate || '10/23/2026',
      duration: job.duration || '12 months',
      client: job.client || '',
      contact: job.contact || 'Hustedt Lexi',
      deadline: job.deadline || '8/28/2026',
      category: job.category || 'SP',
      type: job.type || 'Contract',
      address: job.address || '4430 Broad Rd.',
      location: job.location || '',
      billRate: job.billRate || '90',
      payRate: job.budget || '75',
      description: job.description || job.fullDescription || job.rawText || '',
      experience: job.experience || '5 years',
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : ''
    })
  }

  const handleSaveRequisition = (e) => {
    e.preventDefault()
    alert(`💾 Requisition #${selectedReq.id} saved successfully!`)
    setSelectedReq(null)
  }

  // Pagination slice for Open Requisitions
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return safeJobs.slice(start, start + pageSize)
  }, [safeJobs, currentPage, pageSize])

  const totalPages = Math.ceil(safeJobs.length / pageSize)

  const AVATAR_COLORS = ['#4f46e5', '#7c3aed', '#ec4899', '#0284c7', '#d97706', '#2563eb', '#16a34a']

  function getInitials(name) {
    if (!name) return '?'
    return String(name).split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // ─── RENDERING RECRUITER RETRO REQUISITIONS PORTAL ───
  if (!isSuperAdmin) {
    if (selectedReq) {
      // Single Requisition Details page layout (Image 3)
      return (
        <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 12, border: '1px solid #cbd5e1', fontFamily: 'Arial, sans-serif' }}>
          {/* Breadcrumb path */}
          <div style={{ fontSize: 11, color: '#1e3a8a', fontWeight: 'bold', marginBottom: 12 }}>
            You are here: Home &gt; Requisitions &gt; Edit Requisition
          </div>

          {/* Header Title with Action links */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ea580c', paddingBottom: 6, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16, color: '#1e3a8a', fontWeight: 'bold' }}>
              Requisition #:{selectedReq.id} <span style={{ color: '#dc2626', fontSize: 12, marginLeft: 8 }}>Status: In-Progress</span>
            </h2>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, fontWeight: 'bold' }}>
              <span style={{ color: '#0066cc', cursor: 'pointer' }} onClick={() => alert('Posting Job to JobsInHand...')}>Post To JobsInHand</span>
              <span style={{ color: '#0066cc', cursor: 'pointer' }} onClick={() => alert('Preparing Mass E-mail...')}>Mass E-mail</span>
              <span style={{ color: '#0066cc', cursor: 'pointer' }} onClick={() => setSelectedReq(null)}>&lt;&lt; Back To Search Results</span>
            </div>
          </div>

          <form onSubmit={handleSaveRequisition}>
            {/* Tab strip container */}
            <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', background: '#e2e8f0', padding: '4px 8px 0', gap: 2 }}>
              {['Details', 'Assign to Recruiters', 'Potential Candidates', 'Attachments', 'New Candidates'].map((t, idx) => (
                <div key={t} style={{
                  padding: '5px 12px', fontSize: 11, fontWeight: 'bold', borderRadius: '5px 5px 0 0',
                  background: idx === 0 ? '#ffffff' : '#f1f5f9',
                  border: idx === 0 ? '1px solid #cbd5e1' : 'none',
                  borderBottom: idx === 0 ? '1px solid #ffffff' : 'none',
                  color: idx === 0 ? '#0f172a' : '#475569',
                  cursor: 'pointer'
                }}>
                  {t} {idx === 2 ? '(2)' : idx === 4 ? '(0)' : ''}
                </div>
              ))}
            </div>

            {/* Form sheet panel */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: 'none', padding: '16px 20px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              
              {/* Left Column: Input Fields */}
              <div style={{ flex: '1 1 450px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '8px 12px', alignContent: 'start' }}>
                
                <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Position Title:*</label>
                <input type="text" value={editingFields.title} onChange={e => setEditingFields({ ...editingFields, title: e.target.value })} style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} required />

                <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Start Date:*</label>
                <input type="text" value={editingFields.startDate} onChange={e => setEditingFields({ ...editingFields, startDate: e.target.value })} style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} required />

                <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Duration:*</label>
                <input type="text" value={editingFields.duration} onChange={e => setEditingFields({ ...editingFields, duration: e.target.value })} style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} required />

                <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Customer:</label>
                <input type="text" value={editingFields.client} onChange={e => setEditingFields({ ...editingFields, client: e.target.value })} style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} />

                <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Contact:</label>
                <input type="text" value={editingFields.contact} onChange={e => setEditingFields({ ...editingFields, contact: e.target.value })} style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} />

                <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Submission Deadline:*</label>
                <input type="text" value={editingFields.deadline} onChange={e => setEditingFields({ ...editingFields, deadline: e.target.value })} style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} required />

                <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Req Category:*</label>
                <input type="text" value={editingFields.category} onChange={e => setEditingFields({ ...editingFields, category: e.target.value })} style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} required />

                <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Req Type:*</label>
                <select value={editingFields.type} onChange={e => setEditingFields({ ...editingFields, type: e.target.value })} style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }}>
                  <option>Contract</option>
                  <option>Permanent</option>
                  <option>C2H</option>
                </select>

                <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Location Address:</label>
                <input type="text" value={editingFields.address} onChange={e => setEditingFields({ ...editingFields, address: e.target.value })} style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} />

                <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>City, State, Zip:*</label>
                <input type="text" value={editingFields.location} onChange={e => setEditingFields({ ...editingFields, location: e.target.value })} style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} required />

                <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Bill Rate:</label>
                <input type="text" value={editingFields.billRate} onChange={e => setEditingFields({ ...editingFields, billRate: e.target.value })} style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} />

                <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Pay Rate:</label>
                <input type="text" value={editingFields.payRate} onChange={e => setEditingFields({ ...editingFields, payRate: e.target.value })} style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} />

                <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Interview:</label>
                <select style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }}>
                  <option>Select</option>
                  <option>1 Round Virtual</option>
                  <option>In-Person</option>
                </select>

                <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Work Authorization:</label>
                <select style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }}>
                  <option>Select</option>
                  <option>US Citizen</option>
                  <option>Green Card</option>
                  <option>H1B interop</option>
                </select>

                <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Subcontractable:*</label>
                <select style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }}>
                  <option>No</option>
                  <option>Yes</option>
                </select>

                <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Employment Type:</label>
                <input type="text" value="Contract" disabled style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3, background: '#f1f5f9' }} />

                <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Experience:*</label>
                <input type="text" value={editingFields.experience} onChange={e => setEditingFields({ ...editingFields, experience: e.target.value })} style={{ padding: '3px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} required />

              </div>

              {/* Right Column: Description text area & Skills */}
              <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', display: 'block', marginBottom: 4 }}>Description:*</label>
                  <textarea rows={12} value={editingFields.description} onChange={e => setEditingFields({ ...editingFields, description: e.target.value })} style={{ width: '100%', padding: '8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4, fontFamily: 'monospace' }} required />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', display: 'block', marginBottom: 6 }}>Required Skills:*</label>
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '10px 14px' }}>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#334155', lineHeight: 1.6 }}>
                      {editingFields.skills.split(',').map(s => s.trim()).filter(Boolean).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Created by info bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 18px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderTop: 'none', fontSize: 11, color: '#475569', fontWeight: 'bold' }}>
              <span>Created by: sharif on: 8/20/2026 2:31:19 PM</span>
              <span>Last Updated by: vaibhav on: {new Date().toLocaleDateString()}</span>
            </div>

            {/* Submit Save bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button type="submit" style={{
                background: '#ea580c', color: '#ffffff', border: 'none', borderRadius: 4,
                padding: '6px 22px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(234, 88, 12, 0.2)'
              }}>
                Save
              </button>
            </div>
          </form>
        </div>
      )
    }

    // Default portal Open Requisitions List View (Image 1 & 2)
    return (
      <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 12, border: '1px solid #cbd5e1', fontFamily: 'Arial, sans-serif' }}>
        {/* Breadcrumbs */}
        <div style={{ fontSize: 11, color: '#1e3a8a', fontWeight: 'bold', marginBottom: 12 }}>
          You are here: Home
        </div>

        {/* Banner header title */}
        <h2 style={{ margin: '0 0 4px', fontSize: 15, color: '#16a34a', fontWeight: 'bold' }}>
          COOLSOFT Recruitment Portal Home
        </h2>
        <div style={{ fontSize: 12, color: '#334155', fontWeight: 'bold', marginBottom: 14 }}>
          Welcome back to CoolWorks. You have {safeCandidates.length} tasks.
        </div>

        {/* All Open Requisitions Header Banner */}
        <div style={{
          background: '#bfdbfe', border: '1px solid #93c5fd', padding: '6px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderRadius: '4px 4px 0 0'
        }}>
          <span style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a' }}>All Open Requisitions</span>
          <span style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a' }}>
            (Requisitions {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, safeJobs.length)} of {safeJobs.length})
          </span>
        </div>

        {/* Open Requisitions Table List */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#94a3b8', color: '#ffffff', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Req#</th>
                <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Position</th>
                <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Skills</th>
                <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Customer</th>
                <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Location</th>
                <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Deadline</th>
                <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Pay Rate</th>
                <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Recruiters</th>
                <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Status</th>
                <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Req Ctg</th>
                <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Req Type</th>
                <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Duration</th>
                <th style={{ padding: '8px 6px', fontWeight: 'bold', textAlign: 'center' }}>W</th>
                <th style={{ padding: '8px 6px', fontWeight: 'bold', textAlign: 'center' }}>K</th>
                <th style={{ padding: '8px 6px', fontWeight: 'bold', textAlign: 'center' }}>Cont</th>
              </tr>
            </thead>
            <tbody>
              {paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan="15" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    No open requisitions found.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((job, idx) => (
                  <tr key={job.id} style={{
                    background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    {/* Req# clickable link */}
                    <td style={{ padding: '8px 10px', fontWeight: 'bold' }}>
                      <span onClick={() => handleOpenReq(job)} style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>
                        {job.id.replace('J-', '')}
                      </span>
                    </td>
                    {/* Position clickable link */}
                    <td style={{ padding: '8px 10px', fontWeight: 'bold' }}>
                      <span onClick={() => handleOpenReq(job)} style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>
                        {job.title}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', color: '#475569' }}>
                      {Array.isArray(job.skills) ? job.skills.slice(0, 3).join(', ') : ''}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#475569' }}>{job.client}</td>
                    <td style={{ padding: '8px 10px', color: '#475569' }}>{job.location}</td>
                    <td style={{ padding: '8px 10px', color: '#e11d48', fontWeight: 'bold' }}>{job.deadline || 'Aug 28, 2026'}</td>
                    <td style={{ padding: '8px 10px', color: '#475569' }}>{job.budget || 'TBD'}</td>
                    <td style={{ padding: '8px 10px', color: '#475569' }}>{job.postedByName || 'NitinBho...'}</td>
                    <td style={{ padding: '8px 10px', color: '#16a34a', fontWeight: 'bold' }}>{job.status || 'Active'}</td>
                    <td style={{ padding: '8px 10px', color: '#475569' }}>SP</td>
                    <td style={{ padding: '8px 10px', color: '#475569' }}>{job.type || 'Contract'}</td>
                    <td style={{ padding: '8px 10px', color: '#475569' }}>{job.duration || '12'}</td>
                    {/* Mock indicators to exactly replicate the table checks */}
                    <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                      <input type="checkbox" readOnly checked={false} />
                    </td>
                    <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                      <input type="checkbox" readOnly checked={false} />
                    </td>
                    <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                      <input type="checkbox" readOnly checked={idx % 2 === 1} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls matches Image 2 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid #cbd5e1', paddingTop: 10, marginTop: 10
        }}>
          {/* Numbers list */}
          <div style={{ display: 'flex', gap: 10, fontSize: 12, fontWeight: 'bold' }}>
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1
              return (
                <span key={p} onClick={() => setCurrentPage(p)} style={{
                  color: currentPage === p ? '#ea580c' : '#0066cc',
                  cursor: 'pointer',
                  textDecoration: currentPage === p ? 'none' : 'underline'
                }}>
                  {p}
                </span>
              )
            })}
            <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>Next</span>
            <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentPage(totalPages)}>Last</span>
          </div>

          {/* Page size select dropdown */}
          <div style={{ fontSize: 11, fontWeight: 'bold' }}>
            Page Size:
            <select value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} style={{ marginLeft: 6, fontSize: 11, padding: '1px 3px' }}>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  // ─── RENDERING MODERN ADMIN KPI DASHBOARD ───
  return (
    <div className="dashboard-content-fade">
      {/* Top KPI Row */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        <article className="kpi kpi-premium">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>👥</div>
          <div>
            <h3>Total Candidates</h3>
            <p>{totalCandidates}</p>
            <span className="kpi-trend trend-neutral">Combined database</span>
          </div>
        </article>
        <article className="kpi kpi-premium">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>⚡</div>
          <div>
            <h3>n8n Live Stream</h3>
            <p style={{ color: '#10b981' }}>{liveCount}</p>
            <span className="kpi-trend trend-up" style={{ color: '#10b981', fontWeight: 700 }}>Webhooks active</span>
          </div>
        </article>
        <article className="kpi kpi-premium">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#0891b2' }}>💼</div>
          <div>
            <h3>Active Positions</h3>
            <p>{activeJobs}</p>
            <span className="kpi-trend trend-neutral">Target postings</span>
          </div>
        </article>
        <article className="kpi kpi-premium">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' }}>🎯</div>
          <div>
            <h3>Qualified (80%+)</h3>
            <p style={{ color: '#7c3aed' }}>{qualified}</p>
            <span className="kpi-trend trend-up">{(totalCandidates > 0 ? (qualified / totalCandidates * 100).toFixed(0) : 0)}% of talent pool</span>
          </div>
        </article>
        <article className="kpi kpi-premium">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>⌛</div>
          <div>
            <h3>New / Pending</h3>
            <p>{newCandidates}</p>
            <span className="kpi-trend trend-down" style={{ color: '#d97706' }}>Needs screening</span>
          </div>
        </article>
        <article className="kpi kpi-premium">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(100, 116, 139, 0.12)', color: '#475569' }}>📜</div>
          <div>
            <h3>Pending RTR</h3>
            <p>{pendingRtr}</p>
            <span className="kpi-trend trend-neutral">Awaiting signatures</span>
          </div>
        </article>
      </div>

      {/* Today's Summary + Placement Rate Row */}
      <div className="dash-summary-row" style={{ marginTop: 16 }}>
        <div className="dash-summary-card">
          <div className="dash-summary-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>📋</div>
          <div>
            <span className="dash-summary-label">Today's Jobs</span>
            <span className="dash-summary-value">{todaysJobs}</span>
          </div>
        </div>
        <div className="dash-summary-card">
          <div className="dash-summary-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#0891b2' }}>📤</div>
          <div>
            <span className="dash-summary-label">Today's Submissions</span>
            <span className="dash-summary-value">{todaysSubmissions}</span>
          </div>
        </div>
        <div className="dash-summary-card">
          <div className="dash-summary-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>🏆</div>
          <div>
            <span className="dash-summary-label">Placement Rate</span>
            <span className="dash-summary-value">{placementRate}%</span>
          </div>
        </div>
        <div className="dash-summary-card">
          <div className="dash-summary-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed' }}>⏱️</div>
          <div>
            <span className="dash-summary-label">Avg Time to Fill</span>
            <span className="dash-summary-value">{avgTimeToFill} days</span>
          </div>
        </div>
      </div>

      {/* Pipeline Visual + Activity Row */}
      <div className="card-grid" style={{ marginTop: 24 }}>
        {/* Pipeline Overview */}
        <article className="card pipeline-metrics-card" style={{ gridColumn: 'span 2' }}>
          <h3>📊 Active Pipeline Overview</h3>
          <div className="pipeline-visual-bar">
            {Object.entries(pipelineCounts).map(([stage, count]) => (
              <div key={stage} className="pipeline-stage-block">
                <div
                  className="pipeline-bar-fill"
                  style={{
                    height: `${Math.max(count * 12, 4)}px`,
                    background: stage === 'Rejected'
                      ? 'var(--danger)'
                      : stage === 'Selected'
                        ? '#15803d'
                        : 'var(--brand)'
                  }}
                />
                <span className="pipeline-bar-count">{count}</span>
                <span className="pipeline-bar-label">{stage}</span>
              </div>
            ))}
          </div>
        </article>

        {/* Automation Hub */}
        <article className="card connection-status-card">
          <h3>🤖 Automation Hub</h3>
          <div className="automation-status-layout">
            <div className={`status-pill-indicator ${apiOnline ? 'pill-ok' : 'pill-warn'}`}>
              {apiOnline ? 'n8n Live Webhook Active' : 'Offline / Mock Data Engine'}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
              {apiOnline
                ? 'Integrations are running correctly. Resumes arriving at your synced email inbox are automatically parsed.'
                : 'Connect your n8n pipelines by starting the local API service.'}
            </p>
          </div>
        </article>
      </div>

      {/* Bottom row: Activity + Upcoming Deadlines */}
      <div className="card-grid" style={{ marginTop: 16 }}>
        <article className="card dashboard-activity-card">
          <h3>📬 Live Activity Stream</h3>
          <div className="activity-list-container">
            {safeLiveCandidates.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {safeLiveCandidates.slice(-3).reverse().map((c, i) => (
                  <div key={i} className="activity-log-item">
                    <span className="log-badge-emerald">NEW LIVE</span>
                    <div className="activity-details">
                      <strong>{c.extracted_profile?.name || c.name || 'Candidate'}</strong>
                      <span>Applied to {safeJobs.find(j => j && j.id === c.job_id)?.title || 'General Applicant'} ({c.jd_match?.match_score || 0}% Match)</span>
                      <span className="activity-time">{c.received_at ? new Date(c.received_at).toLocaleString() : 'Recently'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-activity-text">Waiting for incoming automated email candidates...</p>
            )}
          </div>
        </article>

        <article className="card">
          <h3>📅 Upcoming Deadlines</h3>
          {upcomingDeadlines.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {upcomingDeadlines.map(j => (
                <div key={j.id} className="deadline-item">
                  <div className="deadline-info">
                    <strong>{j.title}</strong>
                    <span>{j.client}</span>
                  </div>
                  <span className="deadline-date">{j.deadline}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-activity-text" style={{ marginTop: 12 }}>No upcoming deadlines configured.</p>
          )}
        </article>

        {/* Revenue Tracker */}
        <article className="card">
          <h3>💰 Revenue Tracker</h3>
          <div style={{ marginTop: 12 }}>
            <div className="revenue-metric">
              <span className="revenue-label">Placed Candidates</span>
              <span className="revenue-value">{placed}</span>
            </div>
            <div className="revenue-metric">
              <span className="revenue-label">Est. Monthly Revenue</span>
              <span className="revenue-value" style={{ color: '#15803d' }}>${(placed * 8500).toLocaleString()}</span>
            </div>
            <div className="revenue-metric">
              <span className="revenue-label">Active Submissions</span>
              <span className="revenue-value">{safeSubmissions.length}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}

export default DashboardModule
