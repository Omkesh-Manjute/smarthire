import React, { useState, useMemo } from 'react'

const STAGES = [
  { id: 'New',                label: 'New',           icon: '🆕', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'Reviewed',          label: 'Reviewed',      icon: '👁️', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { id: 'Shortlisted',       label: 'Shortlisted',   icon: '⭐', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  { id: 'RTR Requested',     label: 'RTR Sent',      icon: '📨', color: '#d97706', bg: '#fffbeb', border: '#fef3c7' },
  { id: 'RTR Received',      label: 'RTR Received',  icon: '📩', color: '#ea580c', bg: '#fff7ed', border: '#ffedd5' },
  { id: 'Interview Scheduled',label: 'Interview',    icon: '🎙️', color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8' },
  { id: 'Selected',          label: 'Offer',         icon: '✅', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { id: 'Placed',            label: 'Placed',        icon: '🏆', color: '#15803d', bg: '#dcfce7', border: '#86efac' },
]

const REJECT_STAGE = { id: 'Rejected', label: 'Rejected', icon: '❌', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' }

function getInitials(name) {
  if (!name) return '??'
  return String(name).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getDaysInStage(candidate) {
  if (!candidate || !candidate.statusUpdatedAt) return null
  const diff = Date.now() - new Date(candidate.statusUpdatedAt).getTime()
  if (isNaN(diff)) return null
  return Math.floor(diff / 86400000)
}

function CandidateCard({ candidate, stage, allJobs = [], updateStatus, onDragStart }) {
  if (!candidate) return null
  const nameDisplay = candidate.extracted_profile?.name || candidate.name || 'Unknown'
  const role = candidate.extracted_profile?.title || candidate.title || '—'
  const matchScore = candidate.jd_match?.match_score ?? candidate.matchScore ?? null
  const daysInStage = getDaysInStage(candidate)
  const job = Array.isArray(allJobs) ? allJobs.find(j => j && j.id === candidate.job_id) : null

  return (
    <div
      draggable
      onDragStart={() => onDragStart && onDragStart(candidate.id)}
      style={{
        background: '#ffffff',
        border: `1px solid ${stage.border}`,
        borderRadius: 10,
        padding: 12,
        cursor: 'grab',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'all 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = stage.color }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = stage.border }}
    >
      {/* Avatar + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: stage.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: '#ffffff', flexShrink: 0
        }}>
          {getInitials(nameDisplay)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nameDisplay}</div>
          <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{role}</div>
        </div>
      </div>

      {/* Job Tag */}
      {job && (
        <div style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 4, background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', marginBottom: 6, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', fontWeight: 500 }}>
          💼 {job.title}
        </div>
      )}

      {/* Match + Days */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {matchScore != null ? (
          <span style={{
            fontSize: 11.5, fontWeight: 800,
            color: matchScore >= 80 ? '#15803d' : matchScore >= 60 ? '#b45309' : '#b91c1c',
            background: matchScore >= 80 ? '#dcfce7' : matchScore >= 60 ? '#fef3c7' : '#fee2e2',
            padding: '2px 7px', borderRadius: 5,
          }}>
            {matchScore}% match
          </span>
        ) : (
          <span style={{ fontSize: 11, color: '#94a3b8' }}>No match score</span>
        )}
        {daysInStage != null && (
          <span style={{ fontSize: 10.5, color: daysInStage > 3 ? '#d97706' : '#64748b', fontWeight: 500 }}>
            {daysInStage === 0 ? 'Today' : `${daysInStage}d`}
          </span>
        )}
      </div>

      {/* Stage Selector */}
      <div style={{ marginTop: 8 }}>
        <select
          value={candidate.status || 'New'}
          onChange={e => updateStatus && updateStatus(candidate.id, e.target.value)}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', fontSize: 11, padding: '4px 6px', borderRadius: 6,
            background: stage.bg, color: stage.color, border: `1px solid ${stage.border}`,
            fontWeight: 700, cursor: 'pointer',
          }}
        >
          {[...STAGES, REJECT_STAGE].map(s => (
            <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function PipelineModule({ allCandidates = [], jobsList = [], updateStatus = () => {} }) {
  const [dragId, setDragId] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [jobFilter, setJobFilter] = useState('All')
  const [showRejected, setShowRejected] = useState(false)

  const safeCandidates = Array.isArray(allCandidates) ? allCandidates : []
  const safeJobs = Array.isArray(jobsList) ? jobsList : []

  const filtered = useMemo(() => {
    if (jobFilter === 'All') return safeCandidates
    return safeCandidates.filter(c => c && c.job_id === jobFilter)
  }, [safeCandidates, jobFilter])

  const stageMap = useMemo(() => {
    const map = {}
    for (const stage of [...STAGES, REJECT_STAGE]) {
      map[stage.id] = filtered.filter(c => c && (c.status === stage.id || (!c.status && stage.id === 'New')))
    }
    return map
  }, [filtered])

  const handleDrop = async (stageId) => {
    if (!dragId || dragId === stageId) return
    await updateStatus(dragId, stageId)
    setDragId(null)
    setDragOver(null)
  }

  const totalPlaced = stageMap['Placed']?.length || 0
  const totalInterview = stageMap['Interview Scheduled']?.length || 0
  const totalNew = stageMap['New']?.length || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header + Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#0f172a', fontSize: 16 }}>📈 Recruitment Pipeline</h3>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>Drag & drop candidates between pipeline stages or use stage selector</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={jobFilter} onChange={e => setJobFilter(e.target.value)}
            style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a', padding: '7px 12px', fontSize: 13 }}>
            <option value="All">All Jobs</option>
            {safeJobs.map(j => j && <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <button onClick={() => setShowRejected(v => !v)}
            style={{ background: showRejected ? '#fee2e2' : '#f1f5f9', color: showRejected ? '#b91c1c' : '#475569', border: `1px solid ${showRejected ? '#fca5a5' : '#cbd5e1'}`, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {showRejected ? '❌ Hide Rejected' : '👁️ Show Rejected'}
          </button>
        </div>
      </div>

      {/* Pipeline Funnel Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Total Candidates', val: filtered.length, color: '#2563eb', bg: '#eff6ff' },
          { label: 'New / Unreviewed', val: totalNew, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'In Interview', val: totalInterview, color: '#db2777', bg: '#fdf2f8' },
          { label: 'Placed', val: totalPlaced, color: '#16a34a', bg: '#f0fdf4' },
        ].map(s => (
          <div key={s.label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{s.val}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Kanban Board in Light Mode */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, minHeight: 500 }}>
        {[...STAGES, ...(showRejected ? [REJECT_STAGE] : [])].map(stage => {
          const cards = stageMap[stage.id] || []
          const isOver = dragOver === stage.id

          return (
            <div
              key={stage.id}
              onDragOver={e => { e.preventDefault(); setDragOver(stage.id) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(stage.id)}
              style={{
                minWidth: 215,
                width: 215,
                flexShrink: 0,
                background: isOver ? stage.bg : '#f8fafc',
                border: `1px solid ${isOver ? stage.color : '#e2e8f0'}`,
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.15s',
              }}
            >
              {/* Column Header */}
              <div style={{ padding: '12px 14px', borderBottom: `2px solid ${stage.border}`, background: stage.bg, borderRadius: '12px 12px 0 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{stage.icon}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: stage.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{stage.label}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#ffffff', background: stage.color, borderRadius: 20, padding: '1px 7px', minWidth: 20, textAlign: 'center' }}>
                    {cards.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cards.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 12, userSelect: 'none' }}>
                    Drop candidate here
                  </div>
                ) : (
                  cards.map(candidate => (
                    <CandidateCard
                      key={candidate.id || candidate.candidate_id}
                      candidate={candidate}
                      stage={stage}
                      allJobs={safeJobs}
                      updateStatus={updateStatus}
                      onDragStart={setDragId}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PipelineModule
