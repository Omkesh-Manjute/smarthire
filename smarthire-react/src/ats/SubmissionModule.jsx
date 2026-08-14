import React, { useState } from 'react'

const SUBMISSION_STATUSES = ['Submitted', 'Client Review', 'Interview', 'Selected', 'Rejected']

function SubmissionModule({ allCandidates, jobsList, submissions, setSubmissions }) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    candidateId: '',
    jobId: '',
    recruiter: '',
    vendor: '',
    client: '',
    notes: '',
    rate: '',
  })
  const [statusFilter, setStatusFilter] = useState('All')

  const getInitials = (name) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.candidateId || !formData.jobId) {
      alert('Please select a candidate and a job.')
      return
    }
    const candidate = allCandidates.find(c => c.candidate_id === formData.candidateId)
    const job = jobsList.find(j => j.id === formData.jobId)

    const newSubmission = {
      id: `SUB-${Date.now().toString(36).toUpperCase()}`,
      candidateId: formData.candidateId,
      candidateName: candidate?.extracted_profile?.name || 'Unknown',
      jobId: formData.jobId,
      jobTitle: job?.title || 'Unknown',
      recruiter: formData.recruiter || 'Self',
      vendor: formData.vendor || '—',
      client: job?.client || formData.client || '—',
      notes: formData.notes,
      rate: formData.rate,
      status: 'Submitted',
      submittedAt: new Date().toISOString(),
    }

    setSubmissions(prev => [newSubmission, ...prev])
    setShowForm(false)
    setFormData({ candidateId: '', jobId: '', recruiter: '', vendor: '', client: '', notes: '', rate: '' })
  }

  const updateSubmissionStatus = (subId, newStatus) => {
    setSubmissions(prev =>
      prev.map(s => s.id === subId ? { ...s, status: newStatus } : s)
    )
  }

  const filteredSubmissions = statusFilter === 'All'
    ? submissions
    : submissions.filter(s => s.status === statusFilter)

  const submissionsByStatus = {
    'Submitted': submissions.filter(s => s.status === 'Submitted').length,
    'Client Review': submissions.filter(s => s.status === 'Client Review').length,
    'Interview': submissions.filter(s => s.status === 'Interview').length,
    'Selected': submissions.filter(s => s.status === 'Selected').length,
    'Rejected': submissions.filter(s => s.status === 'Rejected').length,
  }

  return (
    <div className="submission-module-layout">
      {/* Header */}
      <div className="submission-header">
        <div>
          <h3 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans' }}>📤 Candidate Submissions</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>
            Track all candidate submissions to clients. Submit candidates with notes, rate, and vendor info.
          </p>
        </div>
        <button className="btn" onClick={() => setShowForm(true)} id="submit-candidate-btn">
          ➕ Submit Candidate
        </button>
      </div>

      {/* Status Summary */}
      <div className="submission-status-row">
        {Object.entries(submissionsByStatus).map(([status, count]) => (
          <div
            key={status}
            className={`submission-status-card ${statusFilter === status ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === status ? 'All' : status)}
          >
            <span className="sub-status-count">{count}</span>
            <span className="sub-status-label">{status}</span>
          </div>
        ))}
      </div>

      {/* Submissions Table */}
      {filteredSubmissions.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sub ID</th>
                <th>Candidate</th>
                <th>Job / Role</th>
                <th>Recruiter</th>
                <th>Vendor</th>
                <th>Client</th>
                <th>Rate</th>
                <th>Status</th>
                <th>Submitted</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map(sub => (
                <tr key={sub.id}>
                  <td><code className="job-id-code">{sub.id}</code></td>
                  <td>
                    <div className="candidate-name-cell">
                      <div className="candidate-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                        {getInitials(sub.candidateName)}
                      </div>
                      <strong style={{ fontSize: 13 }}>{sub.candidateName}</strong>
                    </div>
                  </td>
                  <td><strong className="matched-job-title">{sub.jobTitle}</strong></td>
                  <td>{sub.recruiter}</td>
                  <td>{sub.vendor}</td>
                  <td><span className="job-client-tag">{sub.client}</span></td>
                  <td style={{ fontWeight: 600, color: 'var(--brand)' }}>{sub.rate || '—'}</td>
                  <td>
                    <span className={`pill ${sub.status === 'Selected' ? 'trusted' : sub.status === 'Rejected' ? 'risk' : 'review'}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                    {new Date(sub.submittedAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <select
                      className="table-action-select"
                      value={sub.status}
                      onChange={(e) => updateSubmissionStatus(sub.id, e.target.value)}
                    >
                      {SUBMISSION_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <h3>📋 No submissions {statusFilter !== 'All' ? `with status "${statusFilter}"` : 'yet'}</h3>
          <p style={{ color: 'var(--ink-soft)' }}>
            Click "Submit Candidate" to create your first submission.
          </p>
        </div>
      )}

      {/* Submit Candidate Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">📤 Submit Candidate</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ gap: 16 }}>
                {/* Candidate Select */}
                <div className="select-wrapper">
                  <label>Select Candidate *</label>
                  <select
                    value={formData.candidateId}
                    onChange={(e) => setFormData(prev => ({ ...prev, candidateId: e.target.value }))}
                    required
                  >
                    <option value="">Choose a candidate...</option>
                    {allCandidates.map(c => (
                      <option key={c.candidate_id} value={c.candidate_id}>
                        {c.extracted_profile.name} — {c.extracted_profile.email || 'No email'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Select */}
                <div className="select-wrapper">
                  <label>Target Job / Role *</label>
                  <select
                    value={formData.jobId}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobId: e.target.value }))}
                    required
                  >
                    <option value="">Choose a job...</option>
                    {jobsList.map(j => (
                      <option key={j.id} value={j.id}>{j.title} — {j.client} ({j.id})</option>
                    ))}
                  </select>
                </div>

                {/* Recruiter & Vendor Row */}
                <div className="modal-grid">
                  <div className="select-wrapper">
                    <label>Recruiter Name</label>
                    <input
                      placeholder="Your name"
                      value={formData.recruiter}
                      onChange={(e) => setFormData(prev => ({ ...prev, recruiter: e.target.value }))}
                    />
                  </div>
                  <div className="select-wrapper">
                    <label>Vendor</label>
                    <input
                      placeholder="Vendor company"
                      value={formData.vendor}
                      onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Client & Rate Row */}
                <div className="modal-grid">
                  <div className="select-wrapper">
                    <label>Client</label>
                    <input
                      placeholder="End client name"
                      value={formData.client}
                      onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                    />
                  </div>
                  <div className="select-wrapper">
                    <label>Bill Rate</label>
                    <input
                      placeholder="e.g. $95/hr"
                      value={formData.rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="select-wrapper">
                  <label>Submission Notes</label>
                  <textarea
                    placeholder="Add notes about this submission..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Resume Preview */}
                {formData.candidateId && (() => {
                  const selected = allCandidates.find(c => c.candidate_id === formData.candidateId)
                  if (!selected) return null
                  return (
                    <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: 6 }}>Candidate Preview</div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div className="candidate-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
                          {getInitials(selected.extracted_profile.name)}
                        </div>
                        <div>
                          <strong>{selected.extracted_profile.name}</strong>
                          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{selected.extracted_profile.email} • {selected.extracted_profile.experience_years} yrs exp</div>
                          <div className="skills-container-inline" style={{ marginTop: 4 }}>
                            {selected.extracted_profile.skills.slice(0, 4).map(s => (
                              <span key={s} className="tag-pill-mini">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn">📤 Submit Candidate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubmissionModule
