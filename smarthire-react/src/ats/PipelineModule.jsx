import React, { useState, useMemo } from 'react'

const ALL_STATUSES = [
  { id: 'New',                 label: 'New',               icon: '🆕', color: '#3b82f6', bg: '#eff6ff',  border: '#bfdbfe' },
  { id: 'Reviewed',            label: 'Reviewed',          icon: '👁️', color: '#7c3aed', bg: '#f5f3ff',  border: '#ddd6fe' },
  { id: 'Shortlisted',         label: 'Shortlisted',       icon: '⭐', color: '#0284c7', bg: '#f0f9ff',  border: '#bae6fd' },
  { id: 'RTR Requested',       label: 'RTR Sent',          icon: '📨', color: '#d97706', bg: '#fffbeb',  border: '#fef3c7' },
  { id: 'RTR Received',        label: 'RTR Received',      icon: '📩', color: '#ea580c', bg: '#fff7ed',  border: '#ffedd5' },
  { id: 'Interview Scheduled', label: 'Interview',         icon: '🎙️', color: '#db2777', bg: '#fdf2f8',  border: '#fbcfe8' },
  { id: 'Selected',            label: 'Offer',             icon: '✅', color: '#16a34a', bg: '#f0fdf4',  border: '#bbf7d0' },
  { id: 'Placed',              label: 'Placed',            icon: '🏆', color: '#15803d', bg: '#dcfce7',  border: '#86efac' },
  { id: 'Rejected',            label: 'Rejected',          icon: '❌', color: '#dc2626', bg: '#fef2f2',  border: '#fca5a5' },
]

function getStatusMeta(statusId) {
  return ALL_STATUSES.find(s => s.id === statusId) || ALL_STATUSES[0]
}

function getInitials(name) {
  if (!name) return '?'
  return String(name).split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getDaysInStage(candidate) {
  if (!candidate?.statusUpdatedAt) return null
  const diff = Date.now() - new Date(candidate.statusUpdatedAt).getTime()
  if (isNaN(diff)) return null
  return Math.floor(diff / 86400000)
}

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6', '#10b981']

function PipelineModule({ allCandidates = [], jobsList = [], updateStatus = () => {} }) {
  const [jobFilter, setJobFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const safeCandidates = Array.isArray(allCandidates) ? allCandidates : []
  const safeJobs = Array.isArray(jobsList) ? jobsList : []

  const filtered = useMemo(() => {
    return safeCandidates.filter(c => {
      if (!c) return false
      const name = (c.extracted_profile?.name || c.name || '').toLowerCase()
      const matchSearch = !search || name.includes(search.toLowerCase())
      const matchJob = jobFilter === 'All' || c.job_id === jobFilter
      const matchStatus = statusFilter === 'All' || (c.status || 'New') === statusFilter
      return matchSearch && matchJob && matchStatus
    })
  }, [safeCandidates, jobFilter, statusFilter, search])

  const handleStatusChange = async (candidateId, newStatus) => {
    setUpdatingId(candidateId)
    await updateStatus(candidateId, newStatus)
    setTimeout(() => setUpdatingId(null), 600)
  }

  // Summary stats
  const statCards = [
    { label: 'Total',     val: filtered.length,                                                                              color: '#6366f1', bg: '#eef2ff' },
    { label: 'New',       val: filtered.filter(c => (c.status || 'New') === 'New').length,                                  color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Interview', val: filtered.filter(c => c.status === 'Interview Scheduled').length,                             color: '#db2777', bg: '#fdf2f8' },
    { label: 'Placed',    val: filtered.filter(c => c.status === 'Placed').length,                                          color: '#15803d', bg: '#dcfce7' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Page Header ──────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>📈 Recruitment Pipeline</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>View and update candidate pipeline stages</p>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12,
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: s.color, flexShrink: 0,
            }}>{s.val}</div>
            <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters Bar ──────────────────────────────────────── */}
      <div style={{
        background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12,
        padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search candidate..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#374151',
              background: '#f9fafb', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Job Filter */}
        <select
          value={jobFilter}
          onChange={e => setJobFilter(e.target.value)}
          style={{
            background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8,
            color: '#374151', padding: '8px 12px', fontSize: 13, cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="All">All Jobs</option>
          {safeJobs.filter(Boolean).map(j => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8,
            color: '#374151', padding: '8px 12px', fontSize: 13, cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="All">All Stages</option>
          {ALL_STATUSES.map(s => (
            <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
          ))}
        </select>

        {/* Clear filters */}
        {(search || jobFilter !== 'All' || statusFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setJobFilter('All'); setStatusFilter('All') }}
            style={{
              background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
              borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
            }}
          >✕ Clear</button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>
          {filtered.length} candidate{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div style={{
        background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 14,
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2.5fr 1.5fr 1fr 1fr 1fr 1.8fr',
          background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
          padding: '12px 20px',
        }}>
          {['Candidate', 'Applied For', 'Match', 'Days in Stage', 'Added', 'Stage / Status'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 4 }}>No candidates found</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Try adjusting your filters or add candidates to jobs</div>
          </div>
        ) : (
          filtered.map((candidate, idx) => {
            const name = candidate.extracted_profile?.name || candidate.name || 'Unknown'
            const role = candidate.extracted_profile?.title || candidate.title || '—'
            const email = candidate.email || candidate.extracted_profile?.email || ''
            const matchScore = candidate.jd_match?.match_score ?? candidate.matchScore ?? null
            const daysInStage = getDaysInStage(candidate)
            const statusMeta = getStatusMeta(candidate.status || 'New')
            const job = safeJobs.find(j => j && j.id === candidate.job_id)
            const avatarBg = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
            const isUpdating = updatingId === candidate.id
            const addedDate = candidate.created_at || candidate.createdAt
              ? new Date(candidate.created_at || candidate.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : '—'

            return (
              <div
                key={candidate.id || candidate.candidate_id || idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.5fr 1.5fr 1fr 1fr 1fr 1.8fr',
                  padding: '14px 20px',
                  alignItems: 'center',
                  borderBottom: idx < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                  background: isUpdating ? '#fafbff' : idx % 2 === 0 ? '#ffffff' : '#fafafa',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isUpdating) e.currentTarget.style.background = '#f5f7ff' }}
                onMouseLeave={e => { e.currentTarget.style.background = isUpdating ? '#fafbff' : idx % 2 === 0 ? '#ffffff' : '#fafafa' }}
              >
                {/* Candidate Name + Email */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: avatarBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0,
                  }}>{getInitials(name)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    {email && <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>}
                    {!email && role && <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{role}</div>}
                  </div>
                </div>

                {/* Job */}
                <div style={{ minWidth: 0 }}>
                  {job ? (
                    <span style={{
                      display: 'inline-block', maxWidth: '100%',
                      fontSize: 11.5, fontWeight: 600, color: '#4b5563',
                      background: '#f3f4f6', borderRadius: 6, padding: '3px 8px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>💼 {job.title}</span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#d1d5db' }}>—</span>
                  )}
                </div>

                {/* Match Score */}
                <div>
                  {matchScore != null ? (
                    <span style={{
                      fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                      color: matchScore >= 80 ? '#15803d' : matchScore >= 60 ? '#b45309' : '#b91c1c',
                      background: matchScore >= 80 ? '#dcfce7' : matchScore >= 60 ? '#fef3c7' : '#fee2e2',
                    }}>{matchScore}%</span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#d1d5db' }}>—</span>
                  )}
                </div>

                {/* Days in Stage */}
                <div>
                  {daysInStage != null ? (
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: daysInStage > 5 ? '#d97706' : daysInStage > 2 ? '#6b7280' : '#10b981',
                    }}>
                      {daysInStage === 0 ? 'Today' : `${daysInStage}d`}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#d1d5db' }}>—</span>
                  )}
                </div>

                {/* Date Added */}
                <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{addedDate}</div>

                {/* Status Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    value={candidate.status || 'New'}
                    onChange={e => handleStatusChange(candidate.id, e.target.value)}
                    disabled={isUpdating}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      border: `1.5px solid ${statusMeta.border}`,
                      background: statusMeta.bg,
                      color: statusMeta.color,
                      cursor: 'pointer',
                      outline: 'none',
                      flex: 1,
                      opacity: isUpdating ? 0.6 : 1,
                      transition: 'all 0.15s',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 8px center',
                      paddingRight: 28,
                    }}
                  >
                    {ALL_STATUSES.map(s => (
                      <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                    ))}
                  </select>
                  {isUpdating && (
                    <div style={{
                      width: 16, height: 16, border: '2px solid #e5e7eb', borderTop: '2px solid #6366f1',
                      borderRadius: '50%', animation: 'spin 0.6s linear infinite', flexShrink: 0,
                    }} />
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default PipelineModule
