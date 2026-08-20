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
  const [showAddModal, setShowAddModal] = useState(false)
  const [targetStageToAdd, setTargetStageToAdd] = useState('Shortlisted')

  // Maintain list of candidates explicitly added to pipeline (Empty by default)
  const [pipelineCandidateIds, setPipelineCandidateIds] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_active_pipeline_ids')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const safeCandidates = Array.isArray(allCandidates) ? allCandidates : []
  const safeJobs = Array.isArray(jobsList) ? jobsList : []

  // Only candidates explicitly in the pipeline
  const pipelineCandidates = useMemo(() => {
    return safeCandidates.filter(c => c && pipelineCandidateIds.includes(c.id))
  }, [safeCandidates, pipelineCandidateIds])

  const filtered = useMemo(() => {
    return pipelineCandidates.filter(c => {
      if (!c) return false
      const name = (c.extracted_profile?.name || c.name || '').toLowerCase()
      const role = (c.job_title || c.title || '').toLowerCase()
      const matchSearch = !search || name.includes(search.toLowerCase()) || role.includes(search.toLowerCase())
      const matchJob = jobFilter === 'All' || c.job_id === jobFilter
      return matchSearch && matchJob
    })
  }, [pipelineCandidates, jobFilter, search])

  const handleStatusChange = async (candidateId, newStatus) => {
    setUpdatingId(candidateId)
    await updateStatus(candidateId, newStatus)
    setTimeout(() => setUpdatingId(null), 400)
  }

  const handleAddToPipeline = (candidateId, stage = 'Shortlisted') => {
    setPipelineCandidateIds(prev => {
      const next = prev.includes(candidateId) ? prev : [...prev, candidateId]
      try { localStorage.setItem('smarthire_active_pipeline_ids', JSON.stringify(next)) } catch {}
      return next
    })
    updateStatus(candidateId, stage)
  }

  const handleRemoveFromPipeline = (candidateId) => {
    setPipelineCandidateIds(prev => {
      const next = prev.filter(id => id !== candidateId)
      try { localStorage.setItem('smarthire_active_pipeline_ids', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const handleClearPipeline = () => {
    if (window.confirm('Are you sure you want to clear all candidates from the pipeline board?')) {
      setPipelineCandidateIds([])
      try { localStorage.setItem('smarthire_active_pipeline_ids', JSON.stringify([])) } catch {}
    }
  }

  // Group pipeline candidates by stage
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>

      {/* ─── PAGE HEADER & CONTROLS ─── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '16px 22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
              📈 Visual Recruitment Pipeline
            </h2>
            <span style={{
              background: '#f1f5f9',
              color: '#475569',
              fontSize: 11,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 20
            }}>
              {pipelineCandidates.length} Active in Pipeline
            </span>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
            Clean recruitment milestone board. Advance vetted talent across hiring stages.
          </p>
        </div>

        {/* Action buttons & View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => { setTargetStageToAdd('Shortlisted'); setShowAddModal(true); }}
            style={{
              background: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)'
            }}
          >
            <span>➕ Add Candidate to Pipeline</span>
          </button>

          {pipelineCandidates.length > 0 && (
            <button
              onClick={handleClearPipeline}
              style={{
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: 8,
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Clear all candidate cards from the pipeline"
            >
              🗑️ Clear Pipeline
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'kanban' ? '#ffffff' : 'transparent',
                color: viewMode === 'kanban' ? '#4f46e5' : '#64748b',
                fontWeight: viewMode === 'kanban' ? '800' : '600',
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: viewMode === 'kanban' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              📋 Kanban
            </button>
            <button
              onClick={() => setViewMode('funnel')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'funnel' ? '#ffffff' : 'transparent',
                color: viewMode === 'funnel' ? '#4f46e5' : '#64748b',
                fontWeight: viewMode === 'funnel' ? '800' : '600',
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: viewMode === 'funnel' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              📊 Funnel
            </button>
          </div>
        </div>
      </div>

      {/* ─── FILTERS BAR ─── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
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
              paddingLeft: 30,
              paddingRight: 10,
              paddingTop: 7,
              paddingBottom: 7,
              border: '1px solid #cbd5e1',
              borderRadius: 7,
              fontSize: 12.5,
              color: '#0f172a',
              background: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Job Filter */}
        <div style={{ flex: '1 1 180px', minWidth: 160 }}>
          <select
            value={jobFilter}
            onChange={e => setJobFilter(e.target.value)}
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 7,
              color: '#0f172a',
              padding: '7px 10px',
              fontSize: 12.5,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="All">All Jobs & Openings</option>
            {safeJobs.filter(Boolean).map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>

        {/* Reset Filter button */}
        {(search || jobFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setJobFilter('All') }}
            style={{
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: 7,
              padding: '6px 12px',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✕ Clear
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b', fontWeight: 600 }}>
          Tracking <strong style={{ color: '#4f46e5' }}>{filtered.length}</strong> pipeline candidates
        </div>
      </div>

      {/* ─── KANBAN BOARD VIEW ─── */}
      {viewMode === 'kanban' && (
        <div style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 16,
          minHeight: '560px',
          alignItems: 'flex-start',
          WebkitOverflowScrolling: 'touch'
        }}>
          {PIPELINE_STAGES.map(stage => {
            const list = stageGroups[stage.id] || []
            return (
              <div
                key={stage.id}
                style={{
                  width: '260px',
                  minWidth: '260px',
                  background: '#f8fafc',
                  border: `1px solid ${stage.border}`,
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '75vh',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                {/* Stage Column Header */}
                <div style={{
                  padding: '10px 12px',
                  background: stage.headerBg,
                  borderBottom: `1px solid ${stage.border}`,
                  borderRadius: '11px 11px 0 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{stage.icon}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: stage.color }}>
                      {stage.label}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '1px 7px',
                    borderRadius: 10,
                    background: '#ffffff',
                    color: stage.color,
                    border: `1px solid ${stage.border}`
                  }}>
                    {list.length}
                  </span>
                </div>

                {/* Candidate Cards List */}
                <div style={{
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  overflowY: 'auto',
                  flex: 1
                }}>
                  {list.length === 0 ? (
                    <div style={{
                      padding: '24px 10px',
                      textAlign: 'center',
                      color: '#94a3b8',
                      fontSize: 11.5,
                      border: '1px dashed #cbd5e1',
                      borderRadius: 8,
                      background: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span>📭 Empty Stage</span>
                      <button
                        onClick={() => { setTargetStageToAdd(stage.id); setShowAddModal(true); }}
                        style={{
                          background: 'transparent',
                          border: '1px solid #cbd5e1',
                          color: '#64748b',
                          borderRadius: 5,
                          padding: '3px 8px',
                          fontSize: 10.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          marginTop: 2
                        }}
                      >
                        + Add candidate
                      </button>
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
                            borderRadius: 8,
                            padding: '10px 12px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            opacity: isUpdating ? 0.5 : 1,
                            transition: 'all 0.12s ease'
                          }}
                        >
                          {/* Card Top: Avatar + Name + Match */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                              <div style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: avatarBg,
                                color: '#fff',
                                fontSize: 10,
                                fontWeight: 800,
                                display: 'grid',
                                placeItems: 'center',
                                flexShrink: 0
                              }}>
                                {getInitials(name)}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  color: '#0f172a',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }} title={name}>
                                  {name}
                                </div>
                                <div style={{
                                  fontSize: 10.5,
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
                                fontSize: 10.5,
                                fontWeight: 800,
                                padding: '1px 5px',
                                borderRadius: 4,
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
                              fontSize: 10.5,
                              color: '#4f46e5',
                              background: '#eef2ff',
                              padding: '2px 6px',
                              borderRadius: 4,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }} title={candidateJob.title}>
                              💼 {candidateJob.title}
                            </div>
                          )}

                          {/* Days in stage + Move Stage Select + Remove */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: '1px solid #f1f5f9',
                            paddingTop: 6,
                            marginTop: 2
                          }}>
                            <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600 }}>
                              ⏱️ {daysInStage === 0 ? 'Today' : `${daysInStage}d`}
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <select
                                value={candidate.status || 'New'}
                                onChange={e => handleStatusChange(candidate.id, e.target.value)}
                                disabled={isUpdating}
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: '2px 5px',
                                  borderRadius: 5,
                                  background: '#f8fafc',
                                  border: '1px solid #cbd5e1',
                                  color: '#334155',
                                  cursor: 'pointer',
                                  outline: 'none',
                                  maxWidth: '110px'
                                }}
                              >
                                {PIPELINE_STAGES.map(st => (
                                  <option key={st.id} value={st.id}>
                                    {st.label}
                                  </option>
                                ))}
                              </select>

                              <button
                                onClick={() => handleRemoveFromPipeline(candidate.id)}
                                title="Remove from pipeline"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  padding: '2px 4px'
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                              >
                                ✕
                              </button>
                            </div>
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
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
            📊 Recruitment Funnel & Conversion Rates
          </h3>
          <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
            Track progression rates across pipeline milestones from New Application down to Final Placement.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
            {PIPELINE_STAGES.map((stage) => {
              const count = stageGroups[stage.id]?.length || 0
              const percentage = filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0

              return (
                <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 130, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>
                    <span>{stage.icon}</span>
                    <span>{stage.label}</span>
                  </div>

                  <div style={{ flex: 1, height: 20, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.max(percentage, 2)}%`,
                      height: '100%',
                      background: stage.color,
                      borderRadius: 5,
                      transition: 'width 0.4s ease'
                    }} />
                  </div>

                  <div style={{ width: 80, textAlign: 'right', fontSize: 12, fontWeight: 800, color: stage.color }}>
                    {count} ({percentage}%)
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── ADD CANDIDATES TO PIPELINE MODAL ─── */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              width: '100%',
              maxWidth: 580,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  ➕ Add Candidate to Pipeline
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  Select talent to advance into stage: <strong>{targetStageToAdd}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 700, color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Candidate List Picker */}
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {safeCandidates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>No candidates available in talent directory.</div>
              ) : (
                safeCandidates.map(c => {
                  const name = c.extracted_profile?.name || c.name || c.candidateName || 'Candidate'
                  const role = c.job_title || c.jobTitle || 'Applicant'
                  const isAlreadyIn = pipelineCandidateIds.includes(c.id)
                  const candidateJob = safeJobs.find(j => j.id === c.job_id)

                  return (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: isAlreadyIn ? '#f0fdf4' : '#f8fafc',
                        border: isAlreadyIn ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{name}</div>
                        <div style={{ fontSize: 11.5, color: '#64748b' }}>
                          {role} {candidateJob ? `• 💼 ${candidateJob.title}` : ''}
                        </div>
                      </div>

                      {isAlreadyIn ? (
                        <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 800, background: '#dcfce7', padding: '3px 8px', borderRadius: 5 }}>
                          ✓ In Pipeline ({c.status || 'Active'})
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            handleAddToPipeline(c.id, targetStageToAdd)
                            setShowAddModal(false)
                          }}
                          style={{
                            background: '#4f46e5',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '5px 12px',
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          + Add to {targetStageToAdd}
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default PipelineModule
