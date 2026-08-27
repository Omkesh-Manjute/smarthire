import React, { useState, useEffect, useMemo } from 'react'

const DEFAULT_AUDIT_LOGS = []

export const logAuditEvent = (eventData) => {
  try {
    const existingStr = localStorage.getItem('smarthire_activity_audit_logs')
    let currentLogs = DEFAULT_AUDIT_LOGS
    if (existingStr) {
      try {
        const parsed = JSON.parse(existingStr)
        if (Array.isArray(parsed)) currentLogs = parsed
      } catch (e) {}
    }

    const timeString = new Date().toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

    const newLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      dateString: timeString,
      candidateId: eventData.candidateId || 'CAND-TEMP',
      candidateName: eventData.candidateName || 'Candidate',
      candidateRole: eventData.candidateRole || eventData.jobTitle || 'Consultant',
      jobId: eventData.jobId || '158938',
      jobTitle: eventData.jobTitle || 'Requisition Position',
      client: eventData.client || 'Client',
      actionType: eventData.actionType || 'STATUS_CHANGE',
      fromStatus: eventData.fromStatus || 'Pending',
      toStatus: eventData.toStatus || 'Updated',
      performedBy: eventData.performedBy || 'System User',
      performedByEmail: eventData.performedByEmail || '',
      userRole: eventData.userRole || 'recruiter',
      note: eventData.note || eventData.comments || 'Status updated',
      rejectedReason: eventData.rejectedReason || ''
    }

    const updated = [newLog, ...currentLogs]
    localStorage.setItem('smarthire_activity_audit_logs', JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('smarthire_audit_log_added', { detail: newLog }))
    return newLog
  } catch (err) {
    console.warn('Failed to record audit log:', err)
  }
}

export default function AuditActivityLogModule({ isCompact = false }) {
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_activity_audit_logs')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {}
    return DEFAULT_AUDIT_LOGS
  })

  const [viewMode, setViewMode] = useState('timeline') // 'timeline' or 'table'
  const [searchQuery, setSearchQuery] = useState('')
  const [actorFilter, setActorFilter] = useState('All')
  const [actionFilter, setActionFilter] = useState('All')
  const [roleFilter, setRoleFilter] = useState('All')
  const [clientFilter, setClientFilter] = useState('All')

  // Sync with storage and events
  useEffect(() => {
    const handleNewLog = () => {
      try {
        const saved = localStorage.getItem('smarthire_activity_audit_logs')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) setLogs(parsed)
        }
      } catch (e) {}
    }

    window.addEventListener('smarthire_audit_log_added', handleNewLog)
    return () => window.removeEventListener('smarthire_audit_log_added', handleNewLog)
  }, [])

  // Unique lists for filters
  const uniqueActors = useMemo(() => {
    const set = new Set(logs.map(l => l.performedBy).filter(Boolean))
    return Array.from(set)
  }, [logs])

  const uniqueClients = useMemo(() => {
    const set = new Set(logs.map(l => l.client).filter(Boolean))
    return Array.from(set)
  }, [logs])

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (actorFilter !== 'All' && log.performedBy !== actorFilter) return false
      if (actionFilter !== 'All' && log.actionType !== actionFilter) return false
      if (roleFilter !== 'All' && log.userRole !== roleFilter) return false
      if (clientFilter !== 'All' && log.client !== clientFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const candMatch = (log.candidateName || '').toLowerCase().includes(q)
        const jobMatch = (log.jobTitle || '').toLowerCase().includes(q)
        const reqMatch = String(log.jobId || '').toLowerCase().includes(q)
        const noteMatch = (log.note || '').toLowerCase().includes(q)
        const actorMatch = (log.performedBy || '').toLowerCase().includes(q)
        const reasonMatch = (log.rejectedReason || '').toLowerCase().includes(q)
        if (!candMatch && !jobMatch && !reqMatch && !noteMatch && !actorMatch && !reasonMatch) {
          return false
        }
      }
      return true
    })
  }, [logs, actorFilter, actionFilter, roleFilter, clientFilter, searchQuery])

  // Metric stats
  const totalEvents = logs.length
  const approvalsCount = logs.filter(l => l.actionType === 'MANAGER_APPROVAL' || (l.toStatus && l.toStatus.includes('Approved'))).length
  const rejectionsCount = logs.filter(l => l.actionType === 'MANAGER_REJECTION' || (l.toStatus && l.toStatus.includes('Rejected'))).length
  const interviewsCount = logs.filter(l => l.actionType === 'INTERVIEW_SCHEDULED' || (l.toStatus && l.toStatus.includes('Interview'))).length
  const sourcedCount = logs.filter(l => l.actionType === 'CANDIDATE_SOURCED' || (l.fromStatus && l.fromStatus.includes('Sourcing'))).length

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Audit ID', 'Timestamp', 'Performed By', 'User Role', 'Candidate Name', 'Candidate ID', 'Job ID', 'Job Title', 'Client', 'From Status', 'To Status', 'Action Type', 'Audit Notes', 'Rejection Reason']
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.dateString || l.timestamp}"`,
      `"${l.performedBy}"`,
      l.userRole,
      `"${l.candidateName}"`,
      l.candidateId,
      l.jobId,
      `"${l.jobTitle}"`,
      `"${l.client}"`,
      `"${l.fromStatus}"`,
      `"${l.toStatus}"`,
      l.actionType,
      `"${(l.note || '').replace(/"/g, '""')}"`,
      `"${(l.rejectedReason || '').replace(/"/g, '""')}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `SmartHire_Audit_Activity_Logs_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Format relative time helper
  const getRelativeTime = (isoString) => {
    if (!isoString) return ''
    try {
      const diffMs = Date.now() - new Date(isoString).getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      const diffDays = Math.floor(diffHours / 24)
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch (e) {
      return ''
    }
  }

  return (
    <div className="audit-activity-module" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header Banner */}
      {!isCompact && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📜 Candidate Status Audit & Activity Log</span>
              <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                🟢 Real-Time Audit Trail
              </span>
            </h2>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
              Full chronological timeline tracking which user changed candidate hiring status, manager approvals, client interview stages, and rejection reasons.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: '6px', padding: '2px', border: '1px solid #cbd5e1' }}>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                style={{
                  background: viewMode === 'timeline' ? '#ffffff' : 'transparent',
                  border: 'none', padding: '5px 12px', fontSize: '11.5px', fontWeight: 'bold',
                  borderRadius: '4px', cursor: 'pointer', color: viewMode === 'timeline' ? '#4f46e5' : '#64748b',
                  boxShadow: viewMode === 'timeline' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                📅 Timeline View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  background: viewMode === 'table' ? '#ffffff' : 'transparent',
                  border: 'none', padding: '5px 12px', fontSize: '11.5px', fontWeight: 'bold',
                  borderRadius: '4px', cursor: 'pointer', color: viewMode === 'table' ? '#4f46e5' : '#64748b',
                  boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                📋 Data Table View
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                background: '#0284c7', color: '#ffffff', border: 'none',
                padding: '6px 14px', fontSize: '12px', fontWeight: 'bold',
                borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}
            >
              📥 Export CSV
            </button>

            {logs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all logged activity audit events?')) {
                    setLogs([])
                    try {
                      localStorage.setItem('smarthire_activity_audit_logs', JSON.stringify([]))
                    } catch (e) {}
                  }
                }}
                style={{
                  background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5',
                  padding: '6px 12px', fontSize: '11.5px', fontWeight: 'bold',
                  borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                }}
              >
                🗑️ Clear Logs
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5 KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#64748b' }}>TOTAL AUDIT EVENTS</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>{totalEvents}</div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Status Changes Tracked</div>
        </div>

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#166534' }}>✅ MANAGER APPROVALS</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#15803d', marginTop: '2px' }}>{approvalsCount}</div>
          <div style={{ fontSize: '10px', color: '#86efac' }}>Passed Manager Review</div>
        </div>

        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#991b1b' }}>❌ REJECTIONS & GAPS</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#dc2626', marginTop: '2px' }}>{rejectionsCount}</div>
          <div style={{ fontSize: '10px', color: '#fca5a5' }}>With Stated Reasons</div>
        </div>

        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#1d4ed8' }}>📅 CLIENT INTERVIEWS</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e40af', marginTop: '2px' }}>{interviewsCount}</div>
          <div style={{ fontSize: '10px', color: '#93c5fd' }}>Panel Scheduled</div>
        </div>

        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#c2410c' }}>📥 SOURCED SUBMISSIONS</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#ea580c', marginTop: '2px' }}>{sourcedCount}</div>
          <div style={{ fontSize: '10px', color: '#fdba74' }}>Added to Pool</div>
        </div>
      </div>

      {/* Multi-Filter & Search Strip */}
      <div style={{
        background: '#ffffff', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Search candidate, job, user, notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '5px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '220px' }}
          />

          {/* User / Performed By Filter */}
          <select
            value={actorFilter}
            onChange={e => setActorFilter(e.target.value)}
            style={{ padding: '5px 8px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#ffffff', fontWeight: 'bold' }}
          >
            <option value="All">All Users / Actors ({uniqueActors.length})</option>
            {uniqueActors.map(actor => (
              <option key={actor} value={actor}>{actor}</option>
            ))}
          </select>

          {/* Action Type Filter */}
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            style={{ padding: '5px 8px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#ffffff' }}
          >
            <option value="All">All Actions</option>
            <option value="MANAGER_APPROVAL">✅ Manager Approvals</option>
            <option value="MANAGER_REJECTION">❌ Manager Rejections</option>
            <option value="INTERVIEW_SCHEDULED">📅 Client Interviews</option>
            <option value="CANDIDATE_SOURCED">📥 Sourced Candidates</option>
            <option value="STATUS_CHANGE">⚡ Status Updates</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{ padding: '5px 8px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#ffffff' }}
          >
            <option value="All">All Roles</option>
            <option value="superadmin">👑 Super Admins</option>
            <option value="manager">🛡️ Managers</option>
            <option value="recruiter">💼 Lead Recruiters</option>
            <option value="employee">👤 Employees</option>
          </select>

          {/* Client Filter */}
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            style={{ padding: '5px 8px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#ffffff' }}
          >
            <option value="All">All Clients</option>
            {uniqueClients.map(cl => (
              <option key={cl} value={cl}>{cl}</option>
            ))}
          </select>

          {(searchQuery || actorFilter !== 'All' || actionFilter !== 'All' || roleFilter !== 'All' || clientFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setActorFilter('All')
                setActionFilter('All')
                setRoleFilter('All')
                setClientFilter('All')
              }}
              style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '4px 8px', fontSize: '11px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕ Clear Filters
            </button>
          )}
        </div>

        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
          Showing <strong style={{ color: '#4f46e5' }}>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> logged events
        </div>
      </div>

      {/* ─── VIEW MODE: CHRONOLOGICAL TIMELINE ─── */}
      {viewMode === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredLogs.length === 0 ? (
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No audit log records found matching your filter criteria.
            </div>
          ) : (
            filteredLogs.map((item, idx) => {
              let roleBadgeBg = '#dbeafe'
              let roleBadgeColor = '#1e40af'
              let roleBorder = '#bfdbfe'
              let roleIcon = '💼'
              if (item.userRole === 'superadmin' || item.userRole === 'admin') {
                roleBadgeBg = '#e0f2fe'
                roleBadgeColor = '#0369a1'
                roleBorder = '#bae6fd'
                roleIcon = '👑'
              } else if (item.userRole === 'manager') {
                roleBadgeBg = '#fef3c7'
                roleBadgeColor = '#92400e'
                roleBorder = '#fde68a'
                roleIcon = '🛡️'
              } else if (item.userRole === 'employee') {
                roleBadgeBg = '#dcfce7'
                roleBadgeColor = '#15803d'
                roleBorder = '#bbf7d0'
                roleIcon = '👤'
              }

              let actionBorderColor = '#cbd5e1'
              let actionHeaderBg = '#f8fafc'
              let actionTitle = 'Status Updated'
              let actionBadgeBg = '#f1f5f9'
              let actionBadgeColor = '#334155'

              if (item.actionType === 'MANAGER_APPROVAL' || item.toStatus?.includes('Approved')) {
                actionBorderColor = '#22c55e'
                actionHeaderBg = '#f0fdf4'
                actionTitle = 'Candidate Approved by Manager'
                actionBadgeBg = '#dcfce7'
                actionBadgeColor = '#15803d'
              } else if (item.actionType === 'MANAGER_REJECTION' || item.toStatus?.includes('Rejected')) {
                actionBorderColor = '#ef4444'
                actionHeaderBg = '#fef2f2'
                actionTitle = 'Candidate Rejected by Manager'
                actionBadgeBg = '#fee2e2'
                actionBadgeColor = '#b91c1c'
              } else if (item.actionType === 'INTERVIEW_SCHEDULED' || item.toStatus?.includes('Interview')) {
                actionBorderColor = '#0284c7'
                actionHeaderBg = '#eff6ff'
                actionTitle = 'Client Interview Scheduled'
                actionBadgeBg = '#e0f2fe'
                actionBadgeColor = '#0369a1'
              } else if (item.actionType === 'CANDIDATE_SOURCED') {
                actionBorderColor = '#ea580c'
                actionHeaderBg = '#fff7ed'
                actionTitle = 'Direct Sourcing Submission'
                actionBadgeBg = '#ffedd5'
                actionBadgeColor = '#c2410c'
              }

              return (
                <div
                  key={item.id || idx}
                  style={{
                    background: '#ffffff',
                    border: `1px solid ${actionBorderColor}`,
                    borderLeft: `5px solid ${actionBorderColor}`,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Top Bar of the Audit Card */}
                  <div style={{
                    background: actionHeaderBg,
                    padding: '8px 14px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: actionBadgeColor }}>
                        {actionTitle}
                      </span>
                      <span style={{ background: actionBadgeBg, color: actionBadgeColor, border: '1px solid rgba(0,0,0,0.08)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                        {item.fromStatus} ➔ {item.toStatus}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#64748b' }}>
                      <span>🕒 {item.dateString}</span>
                      <span style={{ background: '#e2e8f0', color: '#475569', padding: '1px 6px', borderRadius: '3px', fontSize: '10.5px', fontWeight: 'bold' }}>
                        {getRelativeTime(item.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '12px 14px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{item.candidateName}</strong>
                          <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px', fontSize: '11px', color: '#334155' }}>
                            ID #{item.candidateId}
                          </code>
                          <span style={{ color: '#64748b', fontSize: '11.5px' }}>({item.candidateRole})</span>
                        </div>

                        <div style={{ fontSize: '11.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Target Req: <strong>#{item.jobId} — {item.jobTitle}</strong></span>
                          <span style={{ background: '#eff6ff', color: '#1e40af', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold', fontSize: '10.5px' }}>
                            {item.client}
                          </span>
                        </div>
                      </div>

                      {/* Actor details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#4f46e5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                          {(item.performedBy || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#0f172a' }}>
                            {item.performedBy}
                          </div>
                          <span style={{ background: roleBadgeBg, color: roleBadgeColor, border: `1px solid ${roleBorder}`, padding: '1px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold' }}>
                            {roleIcon} {item.userRole}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Comments / Audit Notes */}
                    {item.note && (
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px 10px', fontSize: '11.5px', color: '#334155', marginTop: '6px' }}>
                        <span style={{ fontWeight: 'bold', color: '#1e3a8a', marginRight: '6px' }}>📝 Audit Note:</span>
                        {item.note}
                      </div>
                    )}

                    {/* Rejection reason box */}
                    {item.rejectedReason && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '6px 10px', fontSize: '11.5px', color: '#991b1b', marginTop: '6px', fontWeight: 'bold' }}>
                        ⚠️ Stated Rejection Reason: {item.rejectedReason}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ─── VIEW MODE: DATA TABLE ─── */}
      {viewMode === 'table' && (
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>Timestamp</th>
                <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>Changed By (Actor)</th>
                <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>Candidate</th>
                <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>Requisition / Client</th>
                <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>Status Transition</th>
                <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>Audit Notes / Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    No audit records match your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.dateString}</div>
                      <span style={{ fontSize: '10.5px', color: '#64748b' }}>{getRelativeTime(item.timestamp)}</span>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <strong style={{ color: '#0f172a', display: 'block' }}>{item.performedBy}</strong>
                      <span style={{ fontSize: '10.5px', color: '#4f46e5', fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {item.userRole}
                      </span>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <strong style={{ color: '#0f172a', display: 'block' }}>{item.candidateName}</strong>
                      <code style={{ fontSize: '10.5px', color: '#64748b' }}>#{item.candidateId}</code>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ color: '#0f172a', fontWeight: 'bold' }}>Req #{item.jobId}</div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{item.client}</span>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block' }}>
                        {item.fromStatus} ➔ {item.toStatus}
                      </span>
                    </td>

                    <td style={{ padding: '10px 12px', fontSize: '11.5px', color: '#334155', maxWidth: '300px' }}>
                      {item.note}
                      {item.rejectedReason && (
                        <div style={{ color: '#dc2626', fontWeight: 'bold', marginTop: '2px' }}>
                          Reason: {item.rejectedReason}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
