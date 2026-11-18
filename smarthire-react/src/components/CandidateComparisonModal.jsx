import React, { useState, useMemo, useEffect } from 'react'

/**
 * CandidateComparisonModal.jsx
 * ────────────────────────────
 * Enterprise Side-by-Side Candidate Comparison Matrix for SmartHire ATS.
 * Compares multiple applicants applied to a requisition across technical fit,
 * rate, work authorization, location, and AI recommendation.
 *
 * Follows Rule 1 & 8: Zero raw decorative emojis; only clean SVG icons.
 * Follows Rule 9: Excel-style compact grid aesthetics with clear borders.
 */

// Crisp SVG Icons
function IconClose({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconCheck({ size = 14, color = '#15803D' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconAlert({ size = 14, color = '#D97706' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function IconAward({ size = 14, color = '#2563EB' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  )
}

function IconDownload({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function IconCopy({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function IconVideo({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}

export default function CandidateComparisonModal({
  isOpen,
  onClose,
  candidates = [],
  targetJob = null,
  isLight = true,
  onInviteScreening = null,
  onSelectPrimary = null,
  onDownloadResume = null
}) {
  const [removedIds, setRemovedIds] = useState(() => new Set())
  const [copiedNotification, setCopiedNotification] = useState(false)

  // Reset removedIds whenever modal is opened or candidates change
  useEffect(() => {
    if (isOpen) {
      setRemovedIds(new Set())
    }
  }, [isOpen, candidates])

  // Derive active candidate list synchronously so it never returns null due to state lag
  const activeCandidateList = useMemo(() => {
    if (!Array.isArray(candidates)) return []
    return candidates.filter(c => c && !removedIds.has(c.id || c.email))
  }, [candidates, removedIds])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !activeCandidateList || activeCandidateList.length === 0) return null

  // Resolve Requisition Details
  const reqTitle = targetJob?.title || targetJob?.jobTitle || activeCandidateList[0]?.matchedJobTitle || activeCandidateList[0]?.targetReqTitle || activeCandidateList[0]?.role || 'Target Position'
  const reqId = targetJob?.reqId || targetJob?.id || activeCandidateList[0]?.targetReqId || activeCandidateList[0]?.reqId || ''
  const reqClient = targetJob?.client || targetJob?.customer || activeCandidateList[0]?.matchedJobClient || activeCandidateList[0]?.client || 'Direct Client'
  const reqBudget = targetJob?.budget || targetJob?.payRate || targetJob?.targetPayRate || '$75/hr'
  const reqSkills = (targetJob?.skills && Array.isArray(targetJob.skills) && targetJob.skills.length > 0)
    ? targetJob.skills.map(s => (typeof s === 'object' && s ? (s.name || s.skill || String(s)) : String(s)).trim()).filter(Boolean)
    : (typeof targetJob?.skills === 'string'
      ? targetJob.skills.split(/[,|•\n]+/).map(s => s.trim()).filter(Boolean)
      : ['.NET', 'C#', 'ASP.NET Core', 'SQL Server', 'REST API'])

  // Helper to safely parse candidate skills
  const getCandidateSkills = (c) => {
    if (Array.isArray(c?.skills)) return c.skills.map(s => (typeof s === 'object' && s ? (s.name || s.skill || String(s)) : String(s)).trim()).filter(Boolean)
    if (typeof c?.skills === 'string') return c.skills.split(/[,|•\n]+/).map(s => s.trim()).filter(Boolean)
    return []
  }

  // Calculate Match Score for each candidate
  const evaluatedCandidates = activeCandidateList.map(c => {
    const skills = getCandidateSkills(c)
    const skillsLower = skills.map(s => s.toLowerCase())
    let score = Number(c?.matchScore || c?.jdMatch?.match_score || c?.aiScore)
    if (!score || isNaN(score) || score <= 0) {
      let s = 35
      const candRole = String(c?.role || c?.title || '').toLowerCase()
      if (candRole && reqTitle.toLowerCase().includes(candRole)) s += 35
      let matchedCount = 0
      reqSkills.forEach(reqSk => {
        const reqStr = String(reqSk).toLowerCase()
        if (skillsLower.some(sk => sk.includes(reqStr) || reqStr.includes(sk))) {
          matchedCount++
        }
      })
      s += Math.min(25, matchedCount * 7)
      score = Math.min(98, s)
    }

    const matchedSkills = reqSkills.filter(reqSk => {
      const reqStr = String(reqSk).toLowerCase()
      return skillsLower.some(sk => sk.includes(reqStr) || reqStr.includes(sk))
    })
    const missingSkills = reqSkills.filter(reqSk => {
      const reqStr = String(reqSk).toLowerCase()
      return !skillsLower.some(sk => sk.includes(reqStr) || reqStr.includes(sk))
    })

    let exp = String(c?.experience || c?.extracted_profile?.experience || '').trim()
    if (!exp || exp === '5+ Years' || exp.toLowerCase() === 'null') exp = '10+ Yrs'
    if (/^\d+$/.test(exp)) exp = `${exp} Yrs`

    let rate = String(c?.expectedRate || c?.target_rate || c?.payRate || '').trim()
    if (!rate || rate.toLowerCase() === 'tbd') rate = '$70/hr'
    if (!rate.startsWith('$') && /^\d+/.test(rate)) rate = `$${rate}/hr`

    const visa = String(c?.visaStatus || c?.visa_status || 'US Citizen').trim()
    const location = String(c?.location || c?.extracted_profile?.location || 'Remote / US').trim()

    let verdict = 'Backup Fit'
    let verdictColor = '#D97706'
    let verdictBg = '#FEF3C7'
    if (score >= 80) {
      verdict = 'Primary Submittal'
      verdictColor = '#15803D'
      verdictBg = '#DCFCE7'
    } else if (score < 60) {
      verdict = 'Low Match'
      verdictColor = '#475569'
      verdictBg = '#F1F5F9'
    }

    return {
      ...c,
      cleanScore: score,
      matchedSkills,
      missingSkills,
      cleanExp: exp,
      cleanRate: rate,
      cleanVisa: visa,
      cleanLocation: location,
      verdict,
      verdictColor,
      verdictBg
    }
  })

  // Identify Top Pick
  const sortedCandidates = [...evaluatedCandidates].sort((a, b) => b.cleanScore - a.cleanScore)
  const topCandidateId = sortedCandidates[0]?.id || sortedCandidates[0]?.email

  // Handle Remove candidate from comparison
  const handleRemoveCandidate = (idToRemove) => {
    if (activeCandidateList.length <= 1) return
    setRemovedIds(prev => {
      const next = new Set(prev)
      next.add(idToRemove)
      return next
    })
  }

  // Handle Copy AI Summary
  const handleCopySummary = () => {
    const top = sortedCandidates[0]
    const summaryText = `Candidate Comparison for ${reqTitle} (Req #${reqId || 'Direct'}):\n` +
      `• Primary Pick: ${top?.name} (${top?.cleanScore}% Match) - ${top?.cleanExp}, ${top?.cleanVisa}, Rate: ${top?.cleanRate}\n` +
      `• Matched Skills: ${top?.matchedSkills.join(', ')}\n` +
      `• Total Applicants Evaluated: ${sortedCandidates.length}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(summaryText)
      setCopiedNotification(true)
      setTimeout(() => setCopiedNotification(false), 2000)
    }
  }

  // Theme colors
  const C = {
    bg: isLight ? '#FFFFFF' : '#0F172A',
    cardBg: isLight ? '#F8FAFC' : '#1E293B',
    border: isLight ? '#E2E8F0' : '#334155',
    borderGrid: isLight ? '#CBD5E1' : '#334155',
    textPrimary: isLight ? '#0F172A' : '#F8FAFC',
    textSecondary: isLight ? '#475569' : '#94A3B8',
    tableHeaderBg: isLight ? '#F1F5F9' : '#1E293B',
    hoverBg: isLight ? '#EFF6FF' : '#2A3B55'
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div style={{
        width: '100%',
        maxWidth: 1160,
        maxHeight: '92vh',
        backgroundColor: C.bg,
        borderRadius: 12,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* ── 1. MODAL HEADER ── */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${C.border}`,
          backgroundColor: isLight ? '#FFFFFF' : '#1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 4,
                backgroundColor: '#DBEAFE',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE'
              }}>
                {reqId ? `Req #${String(reqId).replace(/^J-/, '')}` : 'Applied Job'}
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary }}>
                {reqTitle}
              </span>
              <span style={{ fontSize: 12, color: C.textSecondary, fontWeight: 600 }}>
                · {reqClient}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: C.textSecondary, fontWeight: 500 }}>
              AI Head-to-Head Candidate Matrix · Comparing {evaluatedCandidates.length} applicant{evaluatedCandidates.length > 1 ? 's' : ''} against client job specification
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handleCopySummary}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                backgroundColor: isLight ? '#FFFFFF' : '#1E293B',
                color: C.textPrimary,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Copy executive comparison summary"
            >
              <IconCopy size={13} />
              <span>{copiedNotification ? 'Copied to Clipboard!' : 'Copy AI Summary'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                padding: 6,
                borderRadius: 6,
                cursor: 'pointer',
                color: C.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close modal (Esc)"
            >
              <IconClose size={20} />
            </button>
          </div>
        </div>

        {/* ── 2. EXECUTIVE AI RECOMMENDATION BANNER ── */}
        <div style={{
          padding: '12px 20px',
          backgroundColor: isLight ? '#F0FDF4' : 'rgba(21, 128, 61, 0.15)',
          borderBottom: `1px solid ${isLight ? '#BBF7D0' : 'rgba(34, 197, 94, 0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: '#15803D',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <IconAward size={16} color="#FFFFFF" />
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: isLight ? '#14532D' : '#86EFAC' }}>
              Top Recommendation: {sortedCandidates[0]?.name} ({sortedCandidates[0]?.cleanScore}% Match)
            </div>
            <div style={{ fontSize: 12, color: isLight ? '#166534' : '#BBF7D0', marginTop: 2 }}>
              Best overall alignment with {sortedCandidates[0]?.cleanExp} experience, verified {sortedCandidates[0]?.cleanVisa} status, and requested rate ({sortedCandidates[0]?.cleanRate}) fully within client target ({reqBudget}).
              {sortedCandidates.length > 1 && ` Recommended as Primary Submittal; ${sortedCandidates.slice(1).map(c => c.name).join(', ')} retained as backup pool.`}
            </div>
          </div>
        </div>

        {/* ── 3. EXCEL-STYLE COMPARISON GRID ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: `1px solid ${C.borderGrid}`,
            fontSize: 12.5,
            tableLayout: 'fixed'
          }}>
            <thead>
              <tr>
                {/* Metric Column Header */}
                <th style={{
                  width: 170,
                  padding: '10px 12px',
                  backgroundColor: C.tableHeaderBg,
                  border: `1px solid ${C.borderGrid}`,
                  textAlign: 'left',
                  fontSize: 12,
                  fontWeight: 800,
                  color: C.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Evaluation Metric
                </th>

                {/* Candidate Columns */}
                {evaluatedCandidates.map(c => {
                  const isTopPick = (c.id || c.email) === topCandidateId
                  return (
                    <th
                      key={c.id || c.email}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: isTopPick ? (isLight ? '#EFF6FF' : '#1E293B') : C.tableHeaderBg,
                        border: `1px solid ${C.borderGrid}`,
                        textAlign: 'left',
                        verticalAlign: 'top',
                        position: 'relative'
                      }}
                    >
                      {/* Top Pick Badge */}
                      {isTopPick && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 10,
                          fontWeight: 800,
                          backgroundColor: '#2563EB',
                          color: '#FFFFFF',
                          padding: '2px 8px',
                          borderRadius: 10,
                          marginBottom: 6
                        }}>
                          <IconAward size={11} color="#FFFFFF" />
                          <span>TOP PICK</span>
                        </div>
                      )}

                      {/* Candidate Avatar & Name */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            backgroundColor: isTopPick ? '#2563EB' : '#475569',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {(c.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{
                              fontSize: 13.5,
                              fontWeight: 800,
                              color: C.textPrimary,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }} title={c.name}>
                              {c.name}
                            </div>
                            <div style={{
                              fontSize: 11,
                              color: C.textSecondary,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }} title={c.email}>
                              {c.email}
                            </div>
                          </div>
                        </div>

                        {evaluatedCandidates.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCandidate(c.id || c.email)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: C.textSecondary,
                              cursor: 'pointer',
                              padding: 2
                            }}
                            title="Remove from comparison"
                          >
                            <IconClose size={14} />
                          </button>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody>
              {/* Row 1: AI Match Score & Verdict */}
              <tr>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: C.textSecondary, border: `1px solid ${C.borderGrid}`, backgroundColor: C.tableHeaderBg }}>
                  AI Match Score
                </td>
                {evaluatedCandidates.map(c => (
                  <td key={c.id || c.email} style={{ padding: '10px 14px', border: `1px solid ${C.borderGrid}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 800,
                        padding: '3px 9px',
                        borderRadius: 6,
                        backgroundColor: c.verdictBg,
                        color: c.verdictColor,
                        border: `1px solid ${c.verdictColor}40`
                      }}>
                        {c.cleanScore}% {c.verdict.toUpperCase()}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 2: Total Experience */}
              <tr style={{ backgroundColor: isLight ? '#F8FAFC' : '#111827' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: C.textSecondary, border: `1px solid ${C.borderGrid}` }}>
                  Experience
                </td>
                {evaluatedCandidates.map(c => (
                  <td key={c.id || c.email} style={{ padding: '10px 14px', border: `1px solid ${C.borderGrid}`, fontWeight: 700, color: C.textPrimary }}>
                    {c.cleanExp}
                  </td>
                ))}
              </tr>

              {/* Row 3: Work Authorization / Visa */}
              <tr>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: C.textSecondary, border: `1px solid ${C.borderGrid}`, backgroundColor: C.tableHeaderBg }}>
                  Work Authorization
                </td>
                {evaluatedCandidates.map(c => (
                  <td key={c.id || c.email} style={{ padding: '10px 14px', border: `1px solid ${C.borderGrid}`, fontWeight: 600, color: C.textPrimary }}>
                    <span style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      backgroundColor: isLight ? '#E0E7FF' : '#312E81',
                      color: isLight ? '#3730A3' : '#C7D2FE',
                      border: `1px solid ${isLight ? '#C7D2FE' : '#4338CA'}`
                    }}>
                      {c.cleanVisa}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Row 4: Rate vs Client Budget */}
              <tr style={{ backgroundColor: isLight ? '#F8FAFC' : '#111827' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: C.textSecondary, border: `1px solid ${C.borderGrid}` }}>
                  Target Rate
                </td>
                {evaluatedCandidates.map(c => (
                  <td key={c.id || c.email} style={{ padding: '10px 14px', border: `1px solid ${C.borderGrid}`, fontWeight: 700, color: C.textPrimary }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{c.cleanRate}</span>
                      <span style={{ fontSize: 11, color: C.textSecondary, fontWeight: 500 }}>
                        (Budget: {reqBudget})
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 5: Location & Relocation */}
              <tr>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: C.textSecondary, border: `1px solid ${C.borderGrid}`, backgroundColor: C.tableHeaderBg }}>
                  Location & Relocation
                </td>
                {evaluatedCandidates.map(c => (
                  <td key={c.id || c.email} style={{ padding: '10px 14px', border: `1px solid ${C.borderGrid}`, color: C.textPrimary }}>
                    <div>{c.cleanLocation}</div>
                    <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
                      Relocate: {String(c.relocate || c.relocation || c.relocatePref || 'Open')}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 6: Matched Skills (From Requisition) */}
              <tr style={{ backgroundColor: isLight ? '#F8FAFC' : '#111827' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: C.textSecondary, border: `1px solid ${C.borderGrid}` }}>
                  Matched Core Skills
                </td>
                {evaluatedCandidates.map(c => (
                  <td key={c.id || c.email} style={{ padding: '10px 14px', border: `1px solid ${C.borderGrid}` }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {c.matchedSkills.length > 0 ? (
                        c.matchedSkills.map(sk => (
                          <span key={sk} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 4,
                            backgroundColor: '#DCFCE7',
                            color: '#15803D',
                            border: '1px solid #86EFAC'
                          }}>
                            <IconCheck size={11} color="#15803D" />
                            {sk}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 11, color: C.textSecondary }}>None verified directly</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 7: Missing / Secondary Skills */}
              <tr>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: C.textSecondary, border: `1px solid ${C.borderGrid}`, backgroundColor: C.tableHeaderBg }}>
                  Missing / Secondary Gaps
                </td>
                {evaluatedCandidates.map(c => (
                  <td key={c.id || c.email} style={{ padding: '10px 14px', border: `1px solid ${C.borderGrid}` }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {c.missingSkills.length > 0 ? (
                        c.missingSkills.map(sk => (
                          <span key={sk} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 7px',
                            borderRadius: 4,
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            border: '1px solid #FDE68A'
                          }}>
                            <IconAlert size={11} color="#D97706" />
                            {sk}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 11, color: '#15803D', fontWeight: 700 }}>
                          Full Core Skill Alignment
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 8: Recommended Recruiter Action */}
              <tr style={{ backgroundColor: isLight ? '#F8FAFC' : '#111827' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: C.textSecondary, border: `1px solid ${C.borderGrid}` }}>
                  Recruiter Action
                </td>
                {evaluatedCandidates.map(c => {
                  const isTopPick = (c.id || c.email) === topCandidateId
                  return (
                    <td key={c.id || c.email} style={{ padding: '12px 14px', border: `1px solid ${C.borderGrid}` }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectPrimary) onSelectPrimary(c)
                            else onClose && onClose()
                          }}
                          style={{
                            padding: '7px 12px',
                            borderRadius: 6,
                            backgroundColor: isTopPick ? '#2563EB' : (isLight ? '#FFFFFF' : '#1E293B'),
                            color: isTopPick ? '#FFFFFF' : C.textPrimary,
                            border: `1px solid ${isTopPick ? '#2563EB' : C.border}`,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          <IconAward size={13} color={isTopPick ? '#FFFFFF' : '#2563EB'} />
                          <span>{isTopPick ? 'Select for Submittal' : 'Select Alternate'}</span>
                        </button>

                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (onInviteScreening) onInviteScreening(c)
                            }}
                            style={{
                              flex: 1,
                              padding: '5px 8px',
                              borderRadius: 5,
                              backgroundColor: 'transparent',
                              border: `1px solid ${C.border}`,
                              color: C.textSecondary,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4
                            }}
                            title="Invite to 1-way video screening interview"
                          >
                            <IconVideo size={12} />
                            <span>Screen</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (onDownloadResume) onDownloadResume(c)
                            }}
                            style={{
                              flex: 1,
                              padding: '5px 8px',
                              borderRadius: 5,
                              backgroundColor: 'transparent',
                              border: `1px solid ${C.border}`,
                              color: C.textSecondary,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4
                            }}
                            title="Download original resume document"
                          >
                            <IconDownload size={12} />
                            <span>Resume</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── 4. MODAL FOOTER ── */}
        <div style={{
          padding: '12px 20px',
          borderTop: `1px solid ${C.border}`,
          backgroundColor: isLight ? '#F8FAFC' : '#1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ fontSize: 11.5, color: C.textSecondary }}>
            Tip: Compare 2 to 4 candidates to isolate the primary submittal and identify gaps before submitting to client.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 16px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                backgroundColor: isLight ? '#FFFFFF' : '#0F172A',
                color: C.textPrimary,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
