import React, { useState, useEffect, useCallback } from 'react'

const API = '/api/screening'

export default function ScreeningModule({ jobsList = [], allCandidates = [] }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'submitted', 'shortlisted', 'reviewed', 'rejected'
  const [filterFormat, setFilterFormat] = useState('all') // 'all', 'video', 'audio', 'text'
  const [searchQuery, setSearchQuery] = useState('')

  // Campaign Builder Modal States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState('')
  const [campaignTitle, setCampaignTitle] = useState('')
  const [allowedFormats, setAllowedFormats] = useState(['video', 'audio', 'text'])
  const [maxDuration, setMaxDuration] = useState(120)
  const [questions, setQuestions] = useState([
    {
      id: 'q1',
      text: 'Give a 60-90 second introduction of your background, key technical skills, and recent work relevant to this position.',
      description: 'Highlight your strongest languages, frameworks, and recent achievements.',
      allowedFormats: ['video', 'audio', 'text'],
      maxDuration: 120
    },
    {
      id: 'q2',
      text: 'Describe a recent challenging technical problem or architecture you designed and how you resolved it.',
      description: 'Explain the technical hurdle, your contribution, and the measurable outcome.',
      allowedFormats: ['video', 'audio', 'text'],
      maxDuration: 120
    },
    {
      id: 'q3',
      text: 'What is your current work authorization status, earliest availability / notice period, and desired hourly rate or salary?',
      description: 'Confirm your current location, relocation/remote preference, and visa status.',
      allowedFormats: ['video', 'audio', 'text'],
      maxDuration: 90
    }
  ])
  const [isCreating, setIsCreating] = useState(false)
  const [createdLinkResult, setCreatedLinkResult] = useState(null)
  const [copySuccess, setCopySuccess] = useState(false)

  // Candidate Review Drawer / Modal States
  const [reviewSession, setReviewSession] = useState(null)
  const [activeQuestionTab, setActiveQuestionTab] = useState(0)
  const [recruiterRating, setRecruiterRating] = useState(0)
  const [recruiterNotes, setRecruiterNotes] = useState('')
  const [reviewStatus, setReviewStatus] = useState('submitted')
  const [isSavingReview, setIsSavingReview] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // Auto-fill campaign title & questions when job is selected
  useEffect(() => {
    if (selectedJobId) {
      const job = jobsList.find(j => j.id === selectedJobId)
      if (job) {
        setCampaignTitle(`${job.title} Screening Campaign`)
        setQuestions([
          {
            id: 'q1',
            text: `Give a 60-90 second introduction of your background, key technical skills, and recent projects relevant to ${job.title}.`,
            description: 'Summarize your core languages, frameworks, and client impact.',
            allowedFormats: ['video', 'audio', 'text'],
            maxDuration: 120
          },
          {
            id: 'q2',
            text: `Describe a recent challenging project or technical problem you solved involving ${(job.skills && job.skills.length > 0) ? job.skills.slice(0, 3).join(', ') : 'your primary skills'}.`,
            description: 'Explain the architecture, your specific contribution, and the final impact.',
            allowedFormats: ['video', 'audio', 'text'],
            maxDuration: 120
          },
          {
            id: 'q3',
            text: `What is your current work authorization, earliest availability or notice period, and desired hourly rate / compensation?`,
            description: 'Confirm your current location, remote/relocation flexibility, and visa authorization.',
            allowedFormats: ['video', 'audio', 'text'],
            maxDuration: 90
          }
        ])
      }
    }
  }, [selectedJobId, jobsList])

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API}/sessions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        }
      })
      const data = await res.json()
      if (data.success) {
        setSessions(data.sessions || [])
      }
    } catch (err) {
      console.error('Failed to fetch screening sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 12000) // poll every 12s
    return () => clearInterval(interval)
  }, [fetchSessions])

  // Handle Create Campaign
  const handleCreateCampaign = async () => {
    if (!selectedJobId) {
      alert('Please select a target Job Requisition.')
      return
    }

    setIsCreating(true)
    try {
      const job = jobsList.find(j => j.id === selectedJobId)
      const res = await fetch(`${API}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        },
        body: JSON.stringify({
          jobId: selectedJobId,
          campaignTitle,
          questions,
          allowedFormats,
          maxDuration
        })
      })

      const data = await res.json()
      if (data.success) {
        const fullLink = `${window.location.origin}/candidate-chat/${data.sessionId}`
        setCreatedLinkResult({
          sessionId: data.sessionId,
          screeningUrl: fullLink,
          jobTitle: job?.title || 'Open Position'
        })
        fetchSessions()
      } else {
        alert(data.message || 'Failed to create campaign')
      }
    } catch (err) {
      console.error(err)
      alert('Error creating screening campaign')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle Review Open
  const handleOpenReview = (session) => {
    setReviewSession(session)
    setActiveQuestionTab(0)
    setRecruiterRating(session.recruiterRating || 0)
    setRecruiterNotes(session.recruiterNotes || '')
    setReviewStatus(session.status || 'submitted')
    setPlaybackSpeed(1)
  }

  // Handle Save Recruiter Review
  const handleSaveReview = async (newStatus = null) => {
    if (!reviewSession) return
    setIsSavingReview(true)
    const statusToSave = newStatus || reviewStatus

    try {
      const res = await fetch(`${API}/${reviewSession.sessionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        },
        body: JSON.stringify({
          rating: recruiterRating,
          notes: recruiterNotes,
          status: statusToSave
        })
      })

      const data = await res.json()
      if (data.success) {
        setReviewStatus(statusToSave)
        setReviewSession(prev => ({
          ...prev,
          recruiterRating,
          recruiterNotes,
          status: statusToSave
        }))
        fetchSessions()
        if (newStatus === 'shortlisted') {
          alert('✓ Candidate successfully shortlisted for client requisition!')
        }
      } else {
        alert(data.message || 'Failed to update review')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving review: ' + err.message)
    } finally {
      setIsSavingReview(false)
    }
  }

  // Filtered Sessions
  const filteredSessions = sessions.filter(s => {
    if (!s) return false

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = (s.candidateName || '').toLowerCase().includes(q)
      const matchEmail = (s.candidateEmail || '').toLowerCase().includes(q)
      const matchJob = (s.jobTitle || '').toLowerCase().includes(q)
      const matchId = (s.sessionId || '').toLowerCase().includes(q)
      if (!matchName && !matchEmail && !matchJob && !matchId) return false
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'submitted' && s.status !== 'submitted') return false
      if (filterStatus === 'shortlisted' && s.status !== 'shortlisted') return false
      if (filterStatus === 'reviewed' && s.status !== 'reviewed') return false
      if (filterStatus === 'rejected' && s.status !== 'rejected') return false
    }

    // Format filter
    if (filterFormat !== 'all') {
      const responses = s.responses || []
      const hasFormat = responses.some(r => r.format === filterFormat)
      if (!hasFormat) return false
    }

    return true
  })

  // KPI Metrics
  const totalSubmissions = sessions.filter(s => s.status === 'submitted' || s.status === 'shortlisted' || s.screeningComplete).length
  const videoSubmissions = sessions.filter(s => (s.responses || []).some(r => r.format === 'video')).length
  const shortlistedCount = sessions.filter(s => s.status === 'shortlisted' || (s.recruiterRating && s.recruiterRating >= 4)).length
  const totalCampaigns = sessions.length

  return (
    <div style={styles.container}>
      {/* ─── PEEKHIRE RECRUITER HEADER ────────────────────────────────────── */}
      <div style={styles.topHeaderRow}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={styles.mainTitle}>Candidate Video & Audio Screening</h1>
            <span style={styles.peekHireBadge}>PeekHire Powered</span>
          </div>
          <p style={styles.mainSubtitle}>
            Screen candidates asynchronously with 1-way video, voice notes, or text — review on your own schedule with AI transcripts & scorecards.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateModal(true)
            setCreatedLinkResult(null)
          }}
          style={styles.createCampaignBtn}
        >
          + Create Screening Link
        </button>
      </div>

      {/* ─── 4 STATS KPI CARDS ────────────────────────────────────────────── */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={styles.kpiLabel}>Total Campaigns</span>
          </div>
          <div style={styles.kpiValue}>{totalCampaigns}</div>
          <div style={styles.kpiSub}>Active screening links</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={styles.kpiLabel}>Submissions Received</span>
          </div>
          <div style={styles.kpiValue}>{totalSubmissions}</div>
          <div style={styles.kpiSub}>Completed candidate screens</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={styles.kpiLabel}>Video Submissions</span>
          </div>
          <div style={styles.kpiValue}>{videoSubmissions}</div>
          <div style={styles.kpiSub}>Camera responses recorded</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={styles.kpiLabel}>AI Shortlisted</span>
            <span style={styles.kpiIconAmber}>✓</span>
          </div>
          <div style={styles.kpiValue}>{shortlistedCount}</div>
          <div style={styles.kpiSub}>Rating 4+ or shortlisted</div>
        </div>
      </div>

      {/* ─── TOOLBAR FILTERS ──────────────────────────────────────────────── */}
      <div style={styles.toolbarRow}>
        <div style={styles.searchBoxWrapper}>
          <svg style={{ width: '15px', height: '15px', color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search candidate name, email, or requisition..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={styles.clearSearchBtn}
            >
              ✕
            </button>
          )}
        </div>

        <div style={styles.filterButtonGroup}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', marginRight: '4px' }}>Status:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'submitted', label: 'New / Submitted' },
            { id: 'shortlisted', label: 'Shortlisted' },
            { id: 'reviewed', label: 'Reviewed' },
            { id: 'rejected', label: 'Rejected' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              style={{
                ...styles.filterTab,
                ...(filterStatus === tab.id ? styles.filterTabActive : {})
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={styles.filterButtonGroup}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', marginRight: '4px' }}>Format:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'video', label: 'Video' },
            { id: 'audio', label: 'Audio' },
            { id: 'text', label: 'Text' }
          ].map(fmt => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => setFilterFormat(fmt.id)}
              style={{
                ...styles.filterTab,
                ...(filterFormat === fmt.id ? styles.filterTabActive : {})
              }}
            >
              {fmt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── CANDIDATE SUBMISSIONS TABLE ──────────────────────────────────── */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <div style={styles.spinner}></div>
            <div style={{ marginTop: '12px', fontWeight: '600' }}>Loading screening submissions...</div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div style={styles.emptyTable}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#64748B' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10l5-3v10l-5-3v-4z"></path>
                <rect x="2" y="6" width="13" height="12" rx="2"></rect>
              </svg>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>No screening sessions found</div>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '420px', margin: '6px auto 16px' }}>
              Create a new PeekHire screening link and send it to candidates to collect asynchronous video, voice, and text answers.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              style={styles.primaryButton}
            >
              + Create First Screening Link
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeadRow}>
                  <th style={styles.th}>Candidate</th>
                  <th style={styles.th}>Target Requisition</th>
                  <th style={styles.th}>Formats</th>
                  <th style={styles.th}>AI Fit Score</th>
                  <th style={styles.th}>Recruiter Rating</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Submitted</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map(session => {
                  const responses = session.responses || []
                  const hasVideo = responses.some(r => r.format === 'video')
                  const hasAudio = responses.some(r => r.format === 'audio')
                  const hasText = responses.some(r => r.format === 'text')
                  const aiScore = session.aiScore || (session.jdMatch?.match_score) || 78
                  const candName = session.candidateName || 'Pending Applicant'
                  const candEmail = session.candidateEmail || 'No email yet'
                  const initials = candName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

                  return (
                    <tr
                      key={session.sessionId}
                      onClick={() => handleOpenReview(session)}
                      style={styles.tableRow}
                    >
                      {/* Candidate Column */}
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={styles.avatarCircle}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                              {candName}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                              {candEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Requisition */}
                      <td style={styles.td}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                          {session.jobTitle || 'General Position'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Req #{String(session.jobId || '102').replace(/^J-/, '')} • {session.jobClient || 'Enterprise Client'}
                        </div>
                      </td>

                      {/* Formats */}
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {hasVideo && <span style={styles.formatChipVideo}>Video</span>}
                          {hasAudio && <span style={styles.formatChipAudio}>Audio</span>}
                          {hasText && <span style={styles.formatChipText}>Text</span>}
                          {!hasVideo && !hasAudio && !hasText && (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Link Active</span>
                          )}
                        </div>
                      </td>

                      {/* AI Score */}
                      <td style={styles.td}>
                        {session.status === 'submitted' || session.status === 'shortlisted' || session.status === 'reviewed' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              ...styles.scoreBadge,
                              background: aiScore >= 85 ? '#dcfce7' : aiScore >= 75 ? '#eff6ff' : '#fef3c7',
                              color: aiScore >= 85 ? '#166534' : aiScore >= 75 ? '#1d4ed8' : '#b45309'
                            }}>
                              {aiScore}%
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Awaiting Answers</span>
                        )}
                      </td>

                      {/* Recruiter Rating */}
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', fontSize: '14px' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star}>
                              {star <= (session.recruiterRating || 0) ? '★' : '☆'}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          ...(session.status === 'shortlisted' ? styles.statusShortlisted :
                              session.status === 'submitted' ? styles.statusSubmitted :
                              session.status === 'rejected' ? styles.statusRejected :
                              styles.statusPending)
                        }}>
                          {session.status === 'shortlisted' ? 'Shortlisted' :
                           session.status === 'submitted' ? 'New Submitted' :
                           session.status === 'reviewed' ? '✓ Reviewed' :
                           session.status === 'rejected' ? '✕ Rejected' :
                           'In Progress'}
                        </span>
                      </td>

                      {/* Submitted Date */}
                      <td style={styles.td}>
                        <div style={{ fontSize: '12px', color: '#475569' }}>
                          {session.submittedAt ? new Date(session.submittedAt).toLocaleDateString() : 'Active Link'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenReview(session)
                          }}
                          style={styles.reviewButton}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── CREATE CAMPAIGN MODAL ────────────────────────────────────────── */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Create Screening Campaign & Sharable Link
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Generate a zero-friction video, voice, and text screening link for candidates.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              {!createdLinkResult ? (
                <div>
                  {/* Select Requisition */}
                  <div style={styles.modalFormGroup}>
                    <label style={styles.modalLabel}>Select Target Requisition *</label>
                    <select
                      value={selectedJobId}
                      onChange={e => setSelectedJobId(e.target.value)}
                      style={styles.modalSelect}
                    >
                      <option value="">-- Choose Job Opening --</option>
                      {jobsList.map(j => (
                        <option key={j.id} value={j.id}>
                          Req #{String(j.id).replace(/^J-/, '')} • {j.title} ({j.client || 'Client'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Campaign Title */}
                  <div style={styles.modalFormGroup}>
                    <label style={styles.modalLabel}>Campaign Title</label>
                    <input
                      type="text"
                      value={campaignTitle}
                      onChange={e => setCampaignTitle(e.target.value)}
                      style={styles.modalInput}
                      placeholder="e.g. Lead GenAI Engineer Asynchronous Screen"
                    />
                  </div>

                  {/* Allowed Formats */}
                  <div style={styles.modalFormGroup}>
                    <label style={styles.modalLabel}>Allowed Candidate Response Modes</label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                      {['video', 'audio', 'text'].map(fmt => (
                        <label key={fmt} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={allowedFormats.includes(fmt)}
                            onChange={e => {
                              if (e.target.checked) {
                                setAllowedFormats(prev => [...prev, fmt])
                              } else {
                                if (allowedFormats.length > 1) {
                                  setAllowedFormats(prev => prev.filter(f => f !== fmt))
                                }
                              }
                            }}
                          />
                          <span>{fmt === 'video' ? 'Video' : fmt === 'audio' ? 'Voice Note' : 'Text'}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Questions Builder */}
                  <div style={styles.modalFormGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={styles.modalLabel}>Screening Questions ({questions.length})</label>
                      <button
                        type="button"
                        onClick={() => {
                          setQuestions(prev => [
                            ...prev,
                            {
                              id: `q${prev.length + 1}`,
                              text: `New Question ${prev.length + 1}`,
                              description: 'Provide brief context for candidate.',
                              allowedFormats: ['video', 'audio', 'text'],
                              maxDuration: 120
                            }
                          ])
                        }}
                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        + Add Question
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {questions.map((q, qIdx) => (
                        <div key={q.id} style={styles.questionEditorRow}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={styles.qNumBadge}>Q{qIdx + 1}</span>
                            <input
                              type="text"
                              value={q.text}
                              onChange={e => {
                                const newText = e.target.value
                                setQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, text: newText } : item))
                              }}
                              style={styles.modalInput}
                            />
                            {questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setQuestions(prev => prev.filter((_, i) => i !== qIdx))}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px' }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      style={styles.secondaryButton}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCampaign}
                      disabled={isCreating}
                      style={styles.primaryButton}
                    >
                      {isCreating ? 'Generating...' : 'Generate Sharable Link'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Generated Link Result View */
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </div>
                  <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '12px 0 6px' }}>
                    Screening Link Ready!
                  </h4>
                  <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '440px', margin: '0 auto 20px' }}>
                    Share this link directly via email, LinkedIn, or SMS. Candidates can open it immediately with zero login.
                  </p>

                  <div style={styles.linkDisplayBox}>
                    <input
                      type="text"
                      readOnly
                      value={createdLinkResult.screeningUrl}
                      style={styles.linkInput}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdLinkResult.screeningUrl)
                        setCopySuccess(true)
                        setTimeout(() => setCopySuccess(false), 2500)
                      }}
                      style={styles.copyLinkBtn}
                    >
                      {copySuccess ? '✓ Copied!' : 'Copy Link'}
                    </button>
                  </div>

                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                    <a
                      href={`mailto:?subject=${encodeURIComponent(`Interview Screening: ${createdLinkResult.jobTitle}`)}&body=${encodeURIComponent(`Hi,\n\nPlease complete your short asynchronous screening (takes ~2-3 mins) using the link below:\n\n${createdLinkResult.screeningUrl}\n\nBest regards,\nSmartHire Talent Team`)}`}
                      style={styles.emailCandidateBtn}
                    >
                      Email Candidate Now
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      style={styles.primaryButton}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── PEEKHIRE CANDIDATE REVIEW DRAWER / MODAL ─────────────────────── */}
      {reviewSession && (
        <div style={styles.modalOverlay} onClick={() => setReviewSession(null)}>
          <div style={styles.reviewModalCard} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={styles.reviewHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={styles.avatarCircleLarge}>
                  {(reviewSession.candidateName || 'CA').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      {reviewSession.candidateName || 'Applicant'}
                    </h3>
                    <span style={{
                      ...styles.statusBadge,
                      ...(reviewStatus === 'shortlisted' ? styles.statusShortlisted :
                          reviewStatus === 'rejected' ? styles.statusRejected :
                          styles.statusSubmitted)
                    }}>
                      {reviewStatus}
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                    Applying for <strong>{reviewSession.jobTitle}</strong> • {reviewSession.candidateEmail}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleSaveReview('shortlisted')}
                  disabled={isSavingReview}
                  style={styles.shortlistTopBtn}
                >
                  Shortlist Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setReviewSession(null)}
                  style={styles.modalCloseBtn}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Split Content: Left Evaluation & Scorecard, Right Video/Audio Player */}
            <div style={styles.reviewBodySplit}>
              {/* LEFT COLUMN: CANDIDATE INFO & SCORECARD (~360px) */}
              <div style={styles.reviewLeftCol}>
                {/* Candidate Overview Card */}
                <div style={styles.reviewSideCard}>
                  <div style={styles.sideCardHeading}>Candidate Metadata</div>
                  <div style={styles.sideInfoRow}>
                    <span style={{ color: '#64748b' }}>Email:</span>
                    <span>{reviewSession.candidateEmail || 'N/A'}</span>
                  </div>
                  <div style={styles.sideInfoRow}>
                    <span style={{ color: '#64748b' }}>Phone:</span>
                    <span>{reviewSession.candidatePhone || 'N/A'}</span>
                  </div>
                  <div style={styles.sideInfoRow}>
                    <span style={{ color: '#64748b' }}>Location:</span>
                    <span>{reviewSession.candidateLocation || 'Remote'}</span>
                  </div>
                  <div style={styles.sideInfoRow}>
                    <span style={{ color: '#64748b' }}>Rate Expectation:</span>
                    <strong style={{ color: '#1d4ed8' }}>{reviewSession.expectedRate || 'Negotiable'}</strong>
                  </div>
                  {reviewSession.candidateLinkedin && (
                    <div style={styles.sideInfoRow}>
                      <span style={{ color: '#64748b' }}>LinkedIn:</span>
                      <a href={reviewSession.candidateLinkedin} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: '700' }}>
                        Profile ↗
                      </a>
                    </div>
                  )}
                </div>

                {/* AI Screening Assessment Card */}
                <div style={styles.reviewSideCard}>
                  <div style={styles.sideCardHeading}>AI Match & Insights</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0 12px' }}>
                    <div style={styles.aiMatchScoreCircle}>
                      {reviewSession.aiScore || 85}%
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                        {reviewSession.recommendation || 'Strong Match'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Evaluated against Requisition
                      </div>
                    </div>
                  </div>

                  {Array.isArray(reviewSession.aiSummary) && reviewSession.aiSummary.length > 0 ? (
                    <ul style={styles.aiSummaryList}>
                      {reviewSession.aiSummary.map((pt, pIdx) => (
                        <li key={pIdx} style={styles.aiSummaryItem}>
                          {pt}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4, margin: 0 }}>
                      {reviewSession.keyTakeaways || 'Candidate presented clear, well-structured technical answers.'}
                    </p>
                  )}
                </div>

                {/* Recruiter Evaluation & Scorecard */}
                <div style={styles.reviewSideCard}>
                  <div style={styles.sideCardHeading}>Recruiter Scorecard</div>
                  
                  {/* 1-5 Stars */}
                  <div style={{ margin: '8px 0 12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Your Rating:</span>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', cursor: 'pointer', fontSize: '24px', color: '#f59e0b' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span
                          key={star}
                          onClick={() => setRecruiterRating(star)}
                          style={{ transition: 'transform 0.1s' }}
                        >
                          {star <= recruiterRating ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status selector */}
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Update Status:</label>
                    <select
                      value={reviewStatus}
                      onChange={e => setReviewStatus(e.target.value)}
                      style={styles.sideSelect}
                    >
                      <option value="submitted">New / Submitted</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Recruiter Notes:</label>
                    <textarea
                      rows={3}
                      value={recruiterNotes}
                      onChange={e => setRecruiterNotes(e.target.value)}
                      placeholder="Add private recruiter evaluation notes..."
                      style={styles.sideTextarea}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveReview()}
                    disabled={isSavingReview}
                    style={styles.saveReviewBtn}
                  >
                    {isSavingReview ? 'Saving...' : 'Save Evaluation'}
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: QUESTION TABS & VIDEO/AUDIO PLAYER */}
              <div style={styles.reviewRightCol}>
                {/* Question Tabs */}
                <div style={styles.qTabRow}>
                  {(reviewSession.responses || []).map((resp, idx) => (
                    <button
                      key={resp.questionId || idx}
                      type="button"
                      onClick={() => setActiveQuestionTab(idx)}
                      style={{
                        ...styles.qTabBtn,
                        ...(activeQuestionTab === idx ? styles.qTabBtnActive : {})
                      }}
                    >
                      <span>Q{idx + 1}: {resp.format === 'video' ? 'Video' : resp.format === 'audio' ? 'Audio' : 'Text'}</span>
                    </button>
                  ))}
                </div>

                {/* Active Response Content */}
                {reviewSession.responses && reviewSession.responses[activeQuestionTab] ? (
                  (() => {
                    const currentAns = reviewSession.responses[activeQuestionTab]
                    return (
                      <div style={styles.playerWrapper}>
                        {/* Question Banner */}
                        <div style={styles.playerQuestionBanner}>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase' }}>
                            Question {activeQuestionTab + 1}
                          </div>
                          <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '4px 0 0' }}>
                            {currentAns.questionText || `Question ${activeQuestionTab + 1}`}
                          </h4>
                        </div>

                        {/* Player / Viewer */}
                        {currentAns.format === 'video' && currentAns.mediaUrl && (
                          <div style={styles.videoPlayerBox}>
                            <video
                              id="screening-review-video"
                              src={currentAns.mediaUrl}
                              controls
                              playbackRate={playbackSpeed}
                              style={styles.fullVideoElement}
                            />
                            {/* Playback speed controls */}
                            <div style={styles.speedControlsRow}>
                              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700' }}>Speed:</span>
                              {[1, 1.25, 1.5, 2].map(speed => (
                                <button
                                  key={speed}
                                  type="button"
                                  onClick={() => {
                                    setPlaybackSpeed(speed)
                                    const vid = document.getElementById('screening-review-video')
                                    if (vid) vid.playbackRate = speed
                                  }}
                                  style={{
                                    ...styles.speedBtn,
                                    ...(playbackSpeed === speed ? styles.speedBtnActive : {})
                                  }}
                                >
                                  {speed}x
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {currentAns.format === 'audio' && currentAns.mediaUrl && (
                          <div style={styles.audioPlayerBox}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                              </svg>
                            </div>
                            <audio
                              src={currentAns.mediaUrl}
                              controls
                              style={{ width: '100%', maxWidth: '440px' }}
                            />
                          </div>
                        )}

                        {currentAns.format === 'text' && (
                          <div style={styles.textAnswerBox}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>
                              Candidate's Written Response:
                            </div>
                            <div style={{ fontSize: '14.5px', color: '#0f172a', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                              {currentAns.textAnswer || currentAns.transcript || 'No written answer provided.'}
                            </div>
                          </div>
                        )}

                        {/* AI Transcript Box */}
                        {currentAns.transcript && currentAns.format !== 'text' && (
                          <div style={styles.transcriptBox}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', fontWeight: '800', color: '#4338ca', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                AI Speech-to-Text Transcript
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(currentAns.transcript)
                                  alert('Transcript copied to clipboard!')
                                }}
                                style={styles.copyTranscriptBtn}
                              >
                                Copy Text
                              </button>
                            </div>
                            <p style={styles.transcriptParagraph}>
                              "{currentAns.transcript}"
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })()
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    No responses recorded for this session.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── STYLES ───────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const styles = {
  container: {
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: '#0f172a'
  },
  topHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px'
  },
  mainTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.02em'
  },
  peekHireBadge: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#2563eb',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    padding: '3px 8px',
    borderRadius: '12px'
  },
  mainSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: '4px 0 0'
  },
  createCampaignBtn: {
    padding: '11px 20px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#ffffff',
    border: 'none',
    fontSize: '13.5px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  kpiCard: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '18px 20px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
  },
  kpiLabel: {
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#64748b'
  },
  kpiValue: {
    fontSize: '26px',
    fontWeight: '900',
    color: '#0f172a',
    margin: '8px 0 2px'
  },
  kpiSub: {
    fontSize: '11.5px',
    color: '#94a3b8'
  },
  kpiIconBlue: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px'
  },
  kpiIconTeal: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: '#ecfdf5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px'
  },
  kpiIconPurple: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: '#faf5ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px'
  },
  kpiIconAmber: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: '#fffbeb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px'
  },
  toolbarRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '16px'
  },
  searchBoxWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '8px 14px',
    width: '100%',
    maxWidth: '360px'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '13px',
    color: '#0f172a',
    fontFamily: 'inherit'
  },
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '12px'
  },
  filterButtonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  filterTab: {
    padding: '6px 12px',
    borderRadius: '8px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    color: '#475569',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  filterTabActive: {
    background: '#eff6ff',
    color: '#2563eb',
    borderColor: '#bfdbfe'
  },
  tableCard: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  tableHeadRow: {
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  },
  th: {
    padding: '12px 16px',
    fontSize: '11.5px',
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  tableRow: {
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'background 0.15s ease'
  },
  td: {
    padding: '14px 16px',
    verticalAlign: 'middle'
  },
  avatarCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#dbeafe',
    color: '#1d4ed8',
    fontWeight: '800',
    fontSize: '12.5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  avatarCircleLarge: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    background: '#dbeafe',
    color: '#1d4ed8',
    fontWeight: '900',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  formatChipVideo: {
    background: '#f3e8ff',
    color: '#7e22ce',
    fontSize: '10.5px',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '6px'
  },
  formatChipAudio: {
    background: '#e0f2fe',
    color: '#0369a1',
    fontSize: '10.5px',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '6px'
  },
  formatChipText: {
    background: '#f1f5f9',
    color: '#334155',
    fontSize: '10.5px',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '6px'
  },
  scoreBadge: {
    fontSize: '11.5px',
    fontWeight: '800',
    padding: '3px 8px',
    borderRadius: '12px'
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 9px',
    borderRadius: '12px'
  },
  statusShortlisted: {
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fde68a'
  },
  statusSubmitted: {
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0'
  },
  statusRejected: {
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca'
  },
  statusPending: {
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0'
  },
  reviewButton: {
    padding: '6px 14px',
    borderRadius: '8px',
    background: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  emptyTable: {
    padding: '60px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  primaryButton: {
    padding: '10px 20px',
    borderRadius: '10px',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  secondaryButton: {
    padding: '10px 18px',
    borderRadius: '10px',
    background: '#ffffff',
    color: '#475569',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(6px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  modalCard: {
    background: '#ffffff',
    borderRadius: '18px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: '1px solid #cbd5e1'
  },
  modalHeader: {
    padding: '18px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#94a3b8',
    cursor: 'pointer'
  },
  modalBody: {
    padding: '24px'
  },
  modalFormGroup: {
    marginBottom: '18px'
  },
  modalLabel: {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '6px'
  },
  modalSelect: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box'
  },
  modalInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box'
  },
  questionEditorRow: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '8px'
  },
  qNumBadge: {
    background: '#eff6ff',
    color: '#2563eb',
    fontSize: '11px',
    fontWeight: '800',
    padding: '4px 8px',
    borderRadius: '6px'
  },
  linkCreatedSuccessIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: '#ecfdf5',
    color: '#059669',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto'
  },
  linkDisplayBox: {
    display: 'flex',
    gap: '8px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '8px 10px'
  },
  linkInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    color: '#0f172a',
    fontFamily: 'monospace'
  },
  copyLinkBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  emailCandidateBtn: {
    padding: '10px 18px',
    borderRadius: '10px',
    background: '#f1f5f9',
    color: '#334155',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center'
  },
  reviewModalCard: {
    background: '#ffffff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '1080px',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
    border: '1px solid #cbd5e1',
    overflow: 'hidden'
  },
  reviewHeader: {
    padding: '18px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f8fafc'
  },
  shortlistTopBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fde68a',
    fontSize: '12.5px',
    fontWeight: '800',
    cursor: 'pointer'
  },
  reviewBodySplit: {
    flex: 1,
    display: 'flex',
    overflowY: 'auto'
  },
  reviewLeftCol: {
    width: '340px',
    borderRight: '1px solid #e2e8f0',
    background: '#f8fafc',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflowY: 'auto'
  },
  reviewRightCol: {
    flex: 1,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto'
  },
  reviewSideCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '16px'
  },
  sideCardHeading: {
    fontSize: '12px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: '#64748b',
    marginBottom: '10px'
  },
  sideInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12.5px',
    marginBottom: '6px'
  },
  aiMatchScoreCircle: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: '#eff6ff',
    color: '#1d4ed8',
    fontSize: '14px',
    fontWeight: '900',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #bfdbfe'
  },
  aiSummaryList: {
    margin: 0,
    paddingLeft: '16px',
    fontSize: '12px',
    color: '#334155',
    lineHeight: 1.5
  },
  aiSummaryItem: {
    marginBottom: '6px'
  },
  sideSelect: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '12.5px',
    color: '#0f172a',
    marginTop: '4px',
    outline: 'none'
  },
  sideTextarea: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '12.5px',
    color: '#0f172a',
    marginTop: '4px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  saveReviewBtn: {
    width: '100%',
    padding: '9px',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  qTabRow: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '12px',
    marginBottom: '18px',
    overflowX: 'auto'
  },
  qTabBtn: {
    padding: '7px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#475569',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  qTabBtnActive: {
    background: '#2563eb',
    color: '#ffffff',
    borderColor: '#2563eb'
  },
  playerWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  playerQuestionBanner: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px 18px'
  },
  videoPlayerBox: {
    position: 'relative',
    background: '#000000',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
  },
  fullVideoElement: {
    width: '100%',
    maxHeight: '420px',
    display: 'block'
  },
  speedControlsRow: {
    background: '#1e293b',
    padding: '8px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderTop: '1px solid #334155'
  },
  speedBtn: {
    padding: '3px 8px',
    borderRadius: '6px',
    background: '#334155',
    color: '#ffffff',
    border: 'none',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  speedBtnActive: {
    background: '#2563eb'
  },
  audioPlayerBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '36px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  textAnswerBox: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '18px'
  },
  transcriptBox: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    padding: '14px 18px'
  },
  copyTranscriptBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '11.5px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  transcriptParagraph: {
    fontSize: '13px',
    color: '#1e293b',
    fontStyle: 'italic',
    lineHeight: 1.5,
    margin: '8px 0 0'
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto'
  }
}
