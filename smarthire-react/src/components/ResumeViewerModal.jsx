import React, { useState, useEffect } from 'react'

export default function ResumeViewerModal({ candidate, job, onClose, onStatusChange, currentUser }) {
  const [aiScore, setAiScore] = useState(null)
  const [scoringLoading, setScoringLoading] = useState(false)
  const [newStatus, setNewStatus] = useState(candidate?.status || 'Submitted')
  const [statusChanging, setStatusChanging] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [activeTab, setActiveTab] = useState('resume')
  const [highlightedText, setHighlightedText] = useState('')
  const [formatterOpen, setFormatterOpen] = useState(false)
  const [formattedResume, setFormattedResume] = useState('')
  const [formatting, setFormatting] = useState(false)

  const resumeText = candidate?.resumeText || candidate?.parsedResume || ''
  const jobSkills = job?.skills || []
  const fileUrl = candidate?.fileUrl || candidate?.resumeUrl || null

  useEffect(() => {
    if (resumeText && jobSkills.length > 0) runAIMatch()
    if (resumeText) buildHighlightedResume()
  }, [candidate?.id])

  const runAIMatch = async () => {
    if (!resumeText) return
    setScoringLoading(true)
    try {
      const res = await fetch('/api/ai/manager-match', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobSkills, jobTitle: job?.title || job?.jobTitle || '', experienceRequired: job?.experienceRequired || job?.experience || '3' })
      })
      const data = await res.json()
      if (data.success) setAiScore(data)
    } catch (e) {}
    setScoringLoading(false)
  }

  const buildHighlightedResume = () => {
    if (!resumeText) { setHighlightedText(''); return }
    let text = resumeText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    if (jobSkills.length > 0) {
      jobSkills.forEach(skill => {
        const isInResume = resumeText.toLowerCase().includes(skill.toLowerCase())
        const color = isInResume ? '#bbf7d0' : '#fde68a'
        const border = isInResume ? '#16a34a' : '#d97706'
        const regex = new RegExp('(' + skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi')
        text = text.replace(regex, '<mark style="background:' + color + ';border-radius:3px;padding:0 2px;border-bottom:2px solid ' + border + ';font-weight:600">$1</mark>')
      })
    }
    setHighlightedText(text)
  }

  const handleStatusChange = async () => {
    const previousStatus = candidate?.status
    if (newStatus === previousStatus) return
    setStatusChanging(true)
    try {
      const assignedRecruiters = JSON.parse(localStorage.getItem('smarthire_job_assignments_' + job?.id) || '[]')
      await fetch('/api/notifications/status-change', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateName: candidate?.name || candidate?.candidateName, jobTitle: job?.title || job?.jobTitle, jobId: job?.id, newStatus, previousStatus, changedBy: currentUser?.name || 'Manager', assignedRecruiters })
      })
      if (onStatusChange) onStatusChange(candidate, newStatus)
      setStatusMsg('Status updated and recruiters notified!')
    } catch (e) { setStatusMsg('Failed to update status') }
    setStatusChanging(false)
    setTimeout(() => setStatusMsg(''), 4000)
  }

  const handleFormatResume = async () => {
    if (!resumeText) return
    setFormatting(true)
    try {
      const res = await fetch('/api/ai/format-resume', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, candidateName: candidate?.name || candidate?.candidateName || 'Candidate', jobTitle: job?.title || job?.jobTitle || '', skills: jobSkills, proposedRate: candidate?.payRate || candidate?.expectedRate || '', workAuth: candidate?.workAuth || candidate?.workAuthorization || '' })
      })
      const data = await res.json()
      if (data.success) { setFormattedResume(data.formattedResume); setFormatterOpen(true) }
    } catch (e) {}
    setFormatting(false)
  }

  const scorePercent = aiScore?.totalScore || 0
  const scoreColor = scorePercent >= 80 ? '#16a34a' : scorePercent >= 65 ? '#2563eb' : scorePercent >= 50 ? '#d97706' : '#dc2626'
  const PIPELINE_STATUSES = ['New', 'Matched', 'Submitted', 'Screening', 'Interview', 'Offer', 'Placed', 'Rejected', 'Withdrawn']

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end' }}>
      <div style={{ width: '100%', maxWidth: 1100, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '-4px 0 32px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
              {candidate?.name || candidate?.candidateName || 'Candidate Profile'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>{job?.title || job?.jobTitle} {candidate?.status ? '• ' + candidate.status : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleFormatResume} disabled={formatting} style={{ padding: '8px 14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{formatting ? 'Formatting...' : 'Format for Client'}</button>
            <button onClick={onClose} style={{ padding: '8px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Close</button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1.6, overflow: 'auto', padding: 20, borderRight: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, borderBottom: '2px solid #e2e8f0' }}>
              {['resume', 'pdf'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '7px 16px', fontWeight: 700, fontSize: 12, border: 'none', background: 'none', cursor: 'pointer', borderBottom: '3px solid ' + (activeTab === t ? '#2563eb' : 'transparent'), color: activeTab === t ? '#2563eb' : '#64748b', marginBottom: -2 }}>
                  {t === 'resume' ? 'Text View (Highlighted)' : 'PDF View'}
                </button>
              ))}
            </div>

            {activeTab === 'resume' && (
              <div>
                {jobSkills.length > 0 && (
                  <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 12 }}>
                    <strong>Skill Legend:</strong>{' '}
                    <span style={{ background: '#bbf7d0', padding: '1px 6px', borderRadius: 4, borderBottom: '2px solid #16a34a', fontSize: 11, fontWeight: 700 }}>Green = Matched</span>{' '}
                    <span style={{ background: '#fde68a', padding: '1px 6px', borderRadius: 4, borderBottom: '2px solid #d97706', fontSize: 11, fontWeight: 700 }}>Yellow = Missing</span>
                  </div>
                )}
                {resumeText ? (
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1.7, color: '#1e293b', margin: 0 }} dangerouslySetInnerHTML={{ __html: highlightedText || resumeText }} />
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}><p>No resume text available for this candidate.</p></div>
                )}
              </div>
            )}

            {activeTab === 'pdf' && (
              <div>
                {fileUrl ? (
                  <iframe src={fileUrl} title="Resume PDF" style={{ width: '100%', height: 700, border: '1px solid #e2e8f0', borderRadius: 8 }} />
                ) : (
                  <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}><p>No PDF file URL available.</p></div>
                )}
              </div>
            )}
          </div>

          <div style={{ width: 320, overflow: 'auto', padding: 18, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>AI Match Score</h4>
                <button onClick={runAIMatch} disabled={scoringLoading} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 700 }}>{scoringLoading ? '...' : 'Rescore'}</button>
              </div>
              {scoringLoading ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: 13 }}>Analyzing resume...</div>
              ) : aiScore ? (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <div style={{ fontSize: 42, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{scorePercent}%</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: scoreColor, marginTop: 4 }}>{aiScore.verdict}</div>
                    <div style={{ height: 10, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden', margin: '10px 0 0' }}>
                      <div style={{ height: '100%', width: scorePercent + '%', background: scoreColor, borderRadius: 10, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {Object.values(aiScore.breakdown || {}).map(dim => (
                      <div key={dim.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 11, color: '#64748b', width: 120, flexShrink: 0 }}>{dim.label}</div>
                        <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: Math.round((dim.score / dim.max) * 100) + '%', background: '#2563eb', borderRadius: 10 }} />
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', width: 40, textAlign: 'right' }}>{dim.score}/{dim.max}</div>
                      </div>
                    ))}
                  </div>
                  {aiScore.matchedSkills?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>Matched ({aiScore.matchedSkills.length})</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {aiScore.matchedSkills.slice(0, 8).map(s => <span key={s} style={{ background: '#dcfce7', color: '#15803d', fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>{s}</span>)}
                      </div>
                    </div>
                  )}
                  {aiScore.missingSkills?.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Missing ({aiScore.missingSkills.length})</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {aiScore.missingSkills.slice(0, 6).map(s => <span key={s} style={{ background: '#fee2e2', color: '#dc2626', fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>{s}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#64748b', fontSize: 13 }}>
                  <button onClick={runAIMatch} style={{ padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Analyze Now</button>
                </div>
              )}
            </div>

            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800 }}>Update Status</h4>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, marginBottom: 10 }}>
                {PIPELINE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              {statusMsg && <div style={{ background: statusMsg.includes('updated') ? '#f0fdf4' : '#fef2f2', border: '1px solid ' + (statusMsg.includes('updated') ? '#bbf7d0' : '#fca5a5'), padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: statusMsg.includes('updated') ? '#15803d' : '#dc2626', marginBottom: 10 }}>{statusMsg}</div>}
              <button onClick={handleStatusChange} disabled={statusChanging || newStatus === candidate?.status} style={{ width: '100%', padding: '10px 0', background: newStatus === candidate?.status ? '#e2e8f0' : '#0f172a', color: newStatus === candidate?.status ? '#94a3b8' : '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: newStatus === candidate?.status ? 'default' : 'pointer' }}>
                {statusChanging ? 'Updating...' : 'Save & Notify Recruiters'}
              </button>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: '#64748b' }}>CANDIDATE INFO</h4>
              {[['Email', candidate?.email], ['Phone', candidate?.phone], ['Location', candidate?.location || candidate?.currentLocation], ['Work Auth', candidate?.workAuth || candidate?.workAuthorization], ['Rate', candidate?.payRate || candidate?.expectedRate], ['Available', candidate?.availability || candidate?.availableDate]].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b', minWidth: 70 }}>{label}</span>
                  <span style={{ fontWeight: 600, color: '#0f172a', wordBreak: 'break-all' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {formatterOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '90%', maxWidth: 800, maxHeight: '90vh', background: '#fff', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#7c3aed', color: '#fff' }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>SmartHire Formatted Resume - Client Submission Ready</h4>
              <button onClick={() => setFormatterOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>X</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'Courier New, monospace', fontSize: 12, lineHeight: 1.6 }}>{formattedResume}</pre>
            </div>
            <div style={{ padding: '12px 18px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
              <button onClick={() => navigator.clipboard.writeText(formattedResume)} style={{ flex: 1, padding: '10px 0', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Copy All</button>
              <button onClick={() => { const blob = new Blob([formattedResume], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = (candidate?.name || 'Candidate') + '_SmartHire_Submission.txt'; a.click(); URL.revokeObjectURL(url) }} style={{ flex: 1, padding: '10px 0', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Download</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
