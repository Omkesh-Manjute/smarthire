import React, { useState, useMemo } from 'react'

const PIPELINE_STAGES = [
  { id: 'New',                 label: 'New Applied',       icon: '🆕', color: '#3b82f6', bg: '#eff6ff',  border: '#bfdbfe', headerBg: '#dbeafe' },
  { id: 'Reviewed',            label: 'Reviewed',          icon: '👁️', color: '#7c3aed', bg: '#f5f3ff',  border: '#ddd6fe', headerBg: '#ede9fe' },
  { id: 'Shortlisted',         label: 'Shortlisted',       icon: '⭐', color: '#0284c7', bg: '#f0f9ff',  border: '#bae6fd', headerBg: '#e0f2fe' },
  { id: 'RTR Requested',       label: 'RTR Sent',          icon: '📨', color: '#d97706', bg: '#fffbeb',  border: '#fef3c7', headerBg: '#fef3c7' },
  { id: 'RTR Received',        label: 'RTR Signed',        icon: '📩', color: '#ea580c', bg: '#fff7ed',  border: '#ffedd5', headerBg: '#ffedd5' },
  { id: 'Interview Scheduled', label: 'Interview',         icon: '🎙️', color: '#db2777', bg: '#fdf2f8',  border: '#fbcfe8', headerBg: '#fce7f3' },
  { id: 'Selected',            label: 'Offer Selected',    icon: '✅', color: '#16a34a', bg: '#f0fdf4',  border: '#bbf7d0', headerBg: '#dcfce7' },
  { id: 'Placed',              label: 'Placed & Hired',    icon: '🏆', color: '#15803d', bg: '#dcfce7',  border: '#86efac', headerBg: '#bbf7d0' },
  { id: 'Rejected',            label: 'Archived / Reject', icon: '❌', color: '#dc2626', bg: '#fef2f2',  border: '#fca5a5', headerBg: '#fee2e2' },
]

function getInitials(name) {
  if (!name) return '?'
  return String(name).split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getDaysInStage(candidate) {
  if (!candidate?.statusUpdatedAt && !candidate?.updated_at && !candidate?.created_at) return 0
  const dateStr = candidate.statusUpdatedAt || candidate.updated_at || candidate.created_at
  const diff = Date.now() - new Date(dateStr).getTime()
  if (isNaN(diff)) return 0
  return Math.max(0, Math.floor(diff / 86400000))
}

const AVATAR_COLORS = ['#4f46e5', '#7c3aed', '#ec4899', '#0284c7', '#d97706', '#2563eb', '#16a34a']

function PipelineModule({ allCandidates = [], jobsList = [], updateStatus = () => {} }) {
  const [jobFilter, setJobFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [viewMode, setViewMode] = useState('kanban') // 'kanban' | 'funnel'

  const safeCandidates = Array.isArray(allCandidates) ? allCandidates : []
  const safeJobs = Array.isArray(jobsList) ? jobsList : []

  const filtered = useMemo(() => {
    return safeCandidates.filter(c => {
      if (!c) return false
      const name = (c.extracted_profile?.name || c.name || '').toLowerCase()
      const role = (c.job_title || c.title || '').toLowerCase()
      const matchSearch = !search || name.includes(search.toLowerCase()) || role.includes(search.toLowerCase())
      const matchJob = jobFilter === 'All' || c.job_id === jobFilter
      return matchSearch && matchJob
    })
  }, [safeCandidates, jobFilter, search])

  const handleStatusChange = async (candidateId, newStatus) => {
    setUpdatingId(candidateId)
    await updateStatus(candidateId, newStatus)
    setTimeout(() => setUpdatingId(null), 400)
  }

  // Group candidates by stage
  const stageGroups = useMemo(() => {
    const map = {}
    PIPELINE_STAGES.forEach(st => {
      map[st.id] = []
    })

    filtered.forEach(c => {
      const st = c.status || 'New'
      if (map[st]) {
        map[st].push(c)
      } else {
        // Fallback to New
        map['New'].push(c)
      }
    })
    return map
  }, [filtered])

  const scoreColor = (score) => {
    if (score >= 80) return '#15803d'
    if (score >= 60) return '#b45309'
    return '#b91c1c'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>

      {/* ─── PAGE HEADER & CONTROLS ─── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
              📈 Visual Recruitment Pipeline
            </h2>
            <span style={{
              background: '#e0e7ff',
              color: '#4338ca',
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: 20
            }}>
              Kanban Workflow
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748b' }}>
            Interactive stage workflow board. Drag, review, and advance talent across recruitment milestones.
          </p>
        </div>

        {/* View Switcher (Kanban vs Analytics Funnel) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setViewMode('kanban')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '7px',
              border: 'none',
              background: viewMode === 'kanban' ? '#ffffff' : 'transparent',
              color: viewMode === 'kanban' ? '#4f46e5' : '#64748b',
              fontWeight: viewMode === 'kanban' ? '800' : '600',
              fontSize: '12.5px',
              cursor: 'pointer',
              boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <span>📋 Kanban Board</span>
          </button>

          <button
            onClick={() => setViewMode('funnel')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '7px',
              border: 'none',
              background: viewMode === 'funnel' ? '#ffffff' : 'transparent',
              color: viewMode === 'funnel' ? '#4f46e5' : '#64748b',
              fontWeight: viewMode === 'funnel' ? '800' : '600',
              fontSize: '12.5px',
              cursor: 'pointer',
              boxShadow: viewMode === 'funnel' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <span>📊 Conversion Funnel</span>
          </button>
        </div>
      </div>

      {/* ─── FILTERS BAR ─── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search candidate in pipeline..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 32,
              paddingRight: 12,
              paddingTop: 8,
              paddingBottom: 8,
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              fontSize: 13,
              color: '#0f172a',
              background: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Job Filter */}
        <div style={{ flex: '1 1 200px', minWidth: 180 }}>
          <select
            value={jobFilter}
            onChange={e => setJobFilter(e.target.value)}
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              color: '#0f172a',
              padding: '8px 12px',
              fontSize: 13,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="All">All Jobs & Openings ({safeJobs.length})</option>
            {safeJobs.filter(Boolean).map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>

        {/* Clear Filter button */}
        {(search || jobFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setJobFilter('All') }}
            style={{
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✕ Reset Filters
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>
          Tracking <strong style={{ color: '#4f46e5' }}>{filtered.length}</strong> active candidate{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ─── KANBAN BOARD VIEW ─── */}
      {viewMode === 'kanban' && (
        <div style={{
          display: 'flex',
          gap: 14,
          overflowX: 'auto',
          paddingBottom: 16,
          minHeight: '620px',
          alignItems: 'flex-start',
          WebkitOverflowScrolling: 'touch'
        }}>
          {PIPELINE_STAGES.map(stage => {
            const list = stageGroups[stage.id] || []
            return (
              <div
                key={stage.id}
                style={{
                  width: '280px',
                  minWidth: '280px',
                  background: '#f8fafc',
                  border: `1px solid ${stage.border}`,
                  borderRadius: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '78vh',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                {/* Stage Column Header */}
                <div style={{
                  padding: '12px 14px',
                  background: stage.headerBg,
                  borderBottom: `1px solid ${stage.border}`,
                  borderRadius: '13px 13px 0 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15 }}>{stage.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: stage.color }}>
                      {stage.label}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: '#ffffff',
                    color: stage.color,
                    border: `1px solid ${stage.border}`
                  }}>
                    {list.length}
                  </span>
                </div>

                {/* Candidate Cards List */}
                <div style={{
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  overflowY: 'auto',
                  flex: 1
                }}>
                  {list.length === 0 ? (
                    <div style={{
                      padding: '24px 12px',
                      textAlign: 'center',
                      color: '#94a3b8',
                      fontSize: 12,
                      border: '1px dashed #cbd5e1',
                      borderRadius: 10,
                      background: '#ffffff'
                    }}>
                      No candidates in {stage.label}
                    </div>
                  ) : (
                    list.map((candidate, idx) => {
                      const name = candidate.extracted_profile?.name || candidate.name || candidate.candidateName || 'Candidate'
                      const role = candidate.job_title || candidate.jobTitle || 'General Applicant'
                      const matchScore = candidate.jd_match?.match_score ?? candidate.matchScore ?? candidate.ai_match?.score ?? null
                      const daysInStage = getDaysInStage(candidate)
                      const avatarBg = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
                      const candidateJob = safeJobs.find(j => j.id === candidate.job_id)
                      const isUpdating = updatingId === candidate.id

                      return (
                        <div
                          key={candidate.id || idx}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 10,
                            padding: '12px 14px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            opacity: isUpdating ? 0.5 : 1,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {/* Card Top: Avatar + Name + Match */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                              <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: avatarBg,
                                color: '#fff',
                                fontSize: 10.5,
                                fontWeight: 800,
                                display: 'grid',
                                placeItems: 'center',
                                flexShrink: 0
                              }}>
                                {getInitials(name)}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: '#0f172a',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }} title={name}>
                                  {name}
                                </div>
                                <div style={{
                                  fontSize: 11,
                                  color: '#64748b',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }} title={role}>
                                  {role}
                                </div>
                              </div>
                            </div>

                            {matchScore != null && (
                              <span style={{
                                fontSize: 11,
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: 5,
                                color: scoreColor(matchScore),
                                background: matchScore >= 80 ? '#dcfce7' : matchScore >= 60 ? '#fef3c7' : '#fee2e2',
                                border: `1px solid ${matchScore >= 80 ? '#bbf7d0' : matchScore >= 60 ? '#fde68a' : '#fca5a5'}`,
                                flexShrink: 0
                              }}>
                                {matchScore}%
                              </span>
                            )}
                          </div>

                          {/* Applied Job Badge */}
                          {candidateJob && (
                            <div style={{
                              fontSize: 11,
                              color: '#4f46e5',
                              background: '#eef2ff',
                              padding: '2px 8px',
                              borderRadius: 5,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }} title={candidateJob.title}>
                              💼 {candidateJob.title}
                            </div>
                          )}

                          {/* Days in stage + Move Stage Select */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: '1px solid #f1f5f9',
                            paddingTop: 8,
                            marginTop: 2
                          }}>
                            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                              ⏱️ {daysInStage === 0 ? 'Today' : `${daysInStage}d ago`}
                            </span>

                            {/* Move Stage Selector */}
                            <select
                              value={candidate.status || 'New'}
                              onChange={e => handleStatusChange(candidate.id, e.target.value)}
                              disabled={isUpdating}
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '3px 6px',
                                borderRadius: 6,
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                color: '#334155',
                                cursor: 'pointer',
                                outline: 'none',
                                maxWidth: '120px'
                              }}
                            >
                              {PIPELINE_STAGES.map(st => (
                                <option key={st.id} value={st.id}>
                                  {st.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── CONVERSION FUNNEL VIEW ─── */}
      {viewMode === 'funnel' && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
            📊 Recruitment Funnel & Conversion Rates
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Track progression rates across pipeline milestones from New Application down to Final Placement.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
            {PIPELINE_STAGES.map((stage, idx) => {
              const count = stageGroups[stage.id]?.length || 0
              const percentage = filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0

              return (
                <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 140, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                    <span>{stage.icon}</span>
                    <span>{stage.label}</span>
                  </div>

                  <div style={{ flex: 1, height: 24, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      width: `${Math.max(percentage, 2)}%`,
                      height: '100%',
                      background: stage.color,
                      borderRadius: 6,
                      transition: 'width 0.4s ease'
                    }} />
                  </div>

                  <div style={{ width: 90, textAlign: 'right', fontSize: 12.5, fontWeight: 800, color: stage.color }}>
                    {count} ({percentage}%)
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default PipelineModule
