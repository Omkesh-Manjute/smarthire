import React from 'react'

function DashboardModule({
  totalCandidates = 0, liveCount = 0, activeJobs = 0, qualified = 0, newCandidates = 0, pendingRtr = 0,
  allCandidates = [], liveCandidates = [], jobsList = [], apiOnline = false, submissions = []
}) {
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
