import React, { useState } from 'react'

function JobsModule({
  jobsList = [], allCandidates = [], submissions = [],
  rawJdText, setRawJdText, parsingJd, handleParseJd,
  isScraping, handleScrapeNow,
  publishingJobId, handlePostJobToLinkedIn, handleDeleteJob,
  handleOpenJobPreview, fetchJobs
}) {
  const [expandedJobId, setExpandedJobId] = useState(null)
  const [editingJob, setEditingJob] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [reformattingJobId, setReformattingJobId] = useState(null)
  const [jdModalJob, setJdModalJob] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // LinkedIn Post Generator Modal State
  const [linkedinModalJob, setLinkedinModalJob] = useState(null)
  const [linkedinPostText, setLinkedinPostText] = useState('')
  const [copiedSuccess, setCopiedSuccess] = useState(false)
  const [postingLinkedIn, setPostingLinkedIn] = useState(false)
  const [postSuccessMsg, setPostSuccessMsg] = useState('')

  const safeJobs = Array.isArray(jobsList) ? jobsList : []
  const safeCandidates = Array.isArray(allCandidates) ? allCandidates : []
  const safeSubmissions = Array.isArray(submissions) ? submissions : []

  const openJobs = safeJobs.filter(j => j && (j.status === 'Active' || j.status === 'Posted')).length

  const getJobCandidateCount = (jobId) => safeCandidates.filter(c => c && c.job_id === jobId).length
  const getJobSubmissionCount = (jobId) => safeSubmissions.filter(s => s && s.jobId === jobId).length
  const getJobInterviewCount = (jobId) => safeCandidates.filter(c => c && c.job_id === jobId && c.status === 'Interview Scheduled').length
  const getJobSubmittedCount = (jobId) => safeCandidates.filter(c => c && c.job_id === jobId && (c.status === 'Shortlisted' || c.status === 'RTR Received')).length

  const getFullDescriptionText = (job) => {
    if (!job) return ''
    const raw = job.rawDescription || job.fullDescription || job.rawText || job.details || job.rawJd
    if (raw && raw.length > 80) return raw

    if (job.description && job.description.length > 80 && !job.description.startsWith('Looking for a')) {
      return job.description
    }

    const reqSkills = Array.isArray(job.skills) && job.skills.length > 0
      ? job.skills.join(', ')
      : 'Technical expertise relevant to role'

    const prefSkills = Array.isArray(job.preferredSkills) && job.preferredSkills.length > 0
      ? job.preferredSkills.join(', ')
      : Array.isArray(job.preferred_skills) && job.preferred_skills.length > 0
      ? job.preferred_skills.join(', ')
      : 'Cloud architecture (AWS/Azure), Agile delivery, CI/CD pipeline integration'

    const expText = job.experience && job.experience !== 'TBD' && job.experience !== 'Any'
      ? job.experience
      : '3+ years of professional experience'

    const locText = job.location || 'Remote, US'
    const modeText = job.work_mode || job.workMode || job.type || 'Onsite'
    const typeText = job.employment_type || job.employmentType || job.type || 'Contract'

    return `📌 Position Overview:\nWe are recruiting for a ${job.title}. This is a ${typeText} position operating in a ${modeText} work model.\n\n📍 Location: ${locText}\n⏳ Required Experience: ${expText}\n\n🛠️ Required Technical Skills:\n• ${reqSkills.split(', ').join('\n• ')}\n\n⭐ Preferred Skills & Qualifications:\n• ${prefSkills.split(', ').join('\n• ')}\n\n📋 Key Responsibilities & Deliverables:\n• Perform end-to-end technical implementation, system analysis, and software development.\n• Collaborate closely with cross-functional technical teams, architects, and product leads.\n• Debug, troubleshoot, and optimize technical workflows and codebases.`
  }

  // LinkedIn Post Text Generator (Matching exact recruiter template format)
  const generateLinkedInPost = (job) => {
    if (!job) return ''
    const title = job.title || 'Specialist'
    let loc = job.location || 'Remote, US'
    const mode = job.work_mode || job.workMode || 'Onsite'
    const type = job.employment_type || job.employmentType || job.type || 'Contract'
    const appLink = `${window.location.origin}/jobs?jobId=${job.id}`

    // Clean location string if it duplicates work mode
    if (loc === 'Hybrid' || loc === 'Onsite' || loc === 'Remote') {
      loc = 'US Resident'
    }

    const headerLocation = mode === 'Remote'
      ? `Remote Work (${loc})`
      : `${mode} Work - ${loc}`

    const skills = Array.isArray(job.skills) && job.skills.length > 0
      ? job.skills
      : ['Software Development', 'Technical Analysis', 'System Optimization']

    const reqSkillsFormatted = skills.map(s => `✔ ${s}`).join('\n')

    const prefSkills = Array.isArray(job.preferredSkills) && job.preferredSkills.length > 0
      ? job.preferredSkills.map(s => `⭐ ${s}`).join('\n')
      : Array.isArray(job.preferred_skills) && job.preferred_skills.length > 0
      ? job.preferred_skills.map(s => `⭐ ${s}`).join('\n')
      : `⭐ Bachelor's degree in Computer Science or related field\n⭐ Certification in Agile methodologies or relevant domain`

    const cleanTitleTag = '#' + title.replace(/[^a-zA-Z0-9]/g, '')
    const locTag = '#' + loc.replace(/[^a-zA-Z0-9]/g, '')
    const modeTag = '#' + mode.replace(/[^a-zA-Z0-9]/g, '') + 'Work'
    const skillTags = skills.slice(0, 5).map(s => '#' + s.replace(/[^a-zA-Z0-9]/g, '')).join(' ')

    return `Hiring: ${title} (${headerLocation} • Local Candidates Required)

We are seeking an experienced ${title} to join a modern software development team with a focus on delivering high-quality applications via Agile methodologies and Microsoft based solutions.

Responsibilities:

✅ Develop, execute, and maintain automated test scripts to validate application functionality and performance
✅ Collaborate with cross-functional teams to identify and report defects, identify root cause, and implement corrective actions
✅ Participate in code reviews to ensure adherence to coding standards and best practices
✅ Analyze and interpret data to measure testing effectiveness and identify areas for process improvement
✅ Develop and maintain testing frameworks and test automation tools

Required Skills:

${reqSkillsFormatted}

Preferred:

${prefSkills}

${mode}
${type}
Only local candidates with a flexible in-office or remote work arrangement are eligible for this position.

🔗 Direct Candidate Application: ${appLink}
📧 Share the matching candidate resume at omkesh@coolsofttech.com

${cleanTitleTag} ${locTag} ${modeTag} #USStaffing #ContractSoftwareTesting #AgileMethods #DevOps ${skillTags}`
  }

  const handleOpenLinkedInModal = (e, job) => {
    if (e) e.stopPropagation()
    setLinkedinModalJob(job)
    setLinkedinPostText(generateLinkedInPost(job))
    setCopiedSuccess(false)
    setPostSuccessMsg('')
  }

  const handleCopyLinkedInPost = () => {
    navigator.clipboard.writeText(linkedinPostText)
    setCopiedSuccess(true)
    setTimeout(() => setCopiedSuccess(false), 3000)
  }

  const handleDirectPostLinkedIn = async () => {
    if (!linkedinModalJob) return
    setPostingLinkedIn(true)
    setPostSuccessMsg('')
    try {
      if (handlePostJobToLinkedIn) {
        await handlePostJobToLinkedIn(linkedinModalJob.id)
      }
      setPostSuccessMsg('🎉 Successfully posted to LinkedIn Feed!')
      // Also open LinkedIn share dialogue as standard fallback
      const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/jobs?jobId=${linkedinModalJob.id}`)}`
      window.open(shareUrl, '_blank', 'width=650,height=650')
    } catch (err) {
      console.error('LinkedIn Direct Post Error:', err)
      const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/jobs?jobId=${linkedinModalJob.id}`)}`
      window.open(shareUrl, '_blank', 'width=650,height=650')
    } finally {
      setPostingLinkedIn(false)
    }
  }

  const toggleExpand = (jobId) => {
    setExpandedJobId(prev => prev === jobId ? null : jobId)
  }

  const handleOpenEdit = (e, job) => {
    if (e) e.stopPropagation()
    const descText = getFullDescriptionText(job)
    setEditingJob(job)
    setEditFormData({
      title: job.title || '',
      client: job.client || '',
      location: job.location || '',
      work_mode: job.work_mode || job.workMode || job.type || 'Onsite',
      employment_type: job.employment_type || job.employmentType || 'Contract',
      budget: job.billRate || job.budget || '',
      experience: job.experience || '',
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : (job.skills || ''),
      description: descText,
      status: job.status || 'Active'
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingJob) return
    setSavingEdit(true)
    try {
      const skillsArray = editFormData.skills.split(',').map(s => s.trim()).filter(Boolean)
      const res = await fetch(`/api/jobs/${editingJob.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          skills: skillsArray,
          billRate: editFormData.budget,
          rawDescription: editFormData.description
        })
      })
      const data = await res.json()
      if (data.success) {
        setEditingJob(null)
        if (fetchJobs) fetchJobs()
      } else {
        alert(`Failed to save: ${data.message}`)
      }
    } catch (err) {
      alert('Error updating job.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleReformatJob = async (e, job) => {
    if (e) e.stopPropagation()
    if (reformattingJobId) return
    setReformattingJobId(job.id)
    try {
      const fullText = getFullDescriptionText(job)
      const res = await fetch(`/api/jobs/${job.id}/reformat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawDescription: fullText })
      })
      const data = await res.json()
      if (data.success && fetchJobs) fetchJobs()
      else alert(`Failed to reformat: ${data.message}`)
    } catch (err) {
      alert('Reformat error.')
    } finally {
      setReformattingJobId(null)
    }
  }

  const filteredJobs = safeJobs.filter(job => {
    if (!job) return false
    const matchStatus = statusFilter === 'All' || job.status === statusFilter
    const matchSearch = !searchQuery ||
      (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.client || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.location || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchStatus && matchSearch
  })

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }
  const labelStyle = { fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Light Theme KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Open Jobs', value: openJobs, icon: '💼', color: '#2563eb', bg: '#eff6ff' },
          { label: 'Total Postings', value: safeJobs.length, icon: '📋', color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Candidates Linked', value: safeCandidates.length, icon: '👤', color: '#0284c7', bg: '#f0f9ff' },
          { label: 'Submissions', value: safeSubmissions.length, icon: '📤', color: '#16a34a', bg: '#f0fdf4' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: kpi.color, flexShrink: 0 }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{kpi.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Light Theme AI JD Parser */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans', color: '#0f172a', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              🪄 AI Job Description Parser
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>Paste raw JD below — AI extracts title, client, skills, budget, location, and deadline automatically</p>
          </div>
        </div>
        <textarea
          placeholder="Paste raw Job Description here (e.g. 'We need a Senior Java Developer at Microsoft in Austin, TX. 5+ yrs exp...')"
          value={rawJdText}
          onChange={(e) => setRawJdText(e.target.value)}
          rows={3}
          disabled={parsingJd}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button
            onClick={handleParseJd}
            disabled={parsingJd || !rawJdText.trim()}
            style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (parsingJd || !rawJdText.trim()) ? 0.5 : 1, transition: 'background 0.15s' }}
          >
            {parsingJd ? '⏳ Parsing JD...' : '🪄 AI Parse & Add Job'}
          </button>
        </div>
      </div>

      {/* Jobs Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans', color: '#0f172a', fontSize: 16 }}>📋 Active Job Postings</h3>
          <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
            Click any job title to expand & read full description below
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, width: 200, padding: '7px 12px' }}
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ ...inputStyle, width: 130, padding: '7px 12px' }}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Posted">Posted</option>
            <option value="Closed">Closed</option>
          </select>
          <button
            onClick={handleScrapeNow}
            disabled={isScraping}
            style={{ background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {isScraping ? '⏳ Syncing Jobs...' : '⚡ Scrape Now'}
          </button>
        </div>
      </div>

      {/* Job Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {filteredJobs.map(job => {
          const workMode = job.work_mode || job.workMode || job.type || 'Onsite'
          const isClosed = (() => {
            const dl = job.deadline || job.submissionDeadline
            if (!dl) return false
            const d = new Date(dl); if (isNaN(d)) return false
            const t = new Date(); t.setHours(0,0,0,0); d.setHours(0,0,0,0)
            return t > d
          })()
          
          const fullDesc = getFullDescriptionText(job)
          const isExpanded = expandedJobId === job.id
          
          const modeBadge = workMode === 'Remote' 
            ? { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' } 
            : workMode === 'Hybrid' 
            ? { bg: '#fef3c7', text: '#b45309', border: '#fde68a' } 
            : { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }
          
          const isReformatting = reformattingJobId === job.id
          const jobCandidates = safeCandidates.filter(c => c && c.job_id === job.id)
          const locationText = job.location || 'Remote, US'

          return (
            <div key={job.id} style={{
              background: '#ffffff',
              border: `1px solid ${isExpanded ? '#2563eb' : isClosed ? '#fca5a5' : '#e2e8f0'}`,
              borderRadius: 14,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              boxShadow: isExpanded ? '0 8px 24px rgba(37,99,235,0.12)' : '0 1px 3px rgba(0,0,0,0.05)',
              opacity: isClosed ? 0.8 : 1,
              transition: 'all 0.2s',
            }}>
              {/* Card Top Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 700 }}>📍 {locationText}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: modeBadge.bg, color: modeBadge.text, border: `1px solid ${modeBadge.border}`, fontWeight: 700 }}>
                    {workMode === 'Remote' ? '🏠' : workMode === 'Hybrid' ? '🏢' : '📍'} {workMode}
                  </span>
                  {isClosed
                    ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: 700 }}>🔒 Closed</span>
                    : <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 700 }}>{job.status}</span>
                  }
                </div>
              </div>

              {/* Title & Client */}
              <div
                onClick={() => toggleExpand(job.id)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Click title to expand/read description"
              >
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: isExpanded ? '#2563eb' : '#0f172a', fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{job.title}</span>
                  <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 700, marginLeft: 8 }}>
                    {isExpanded ? '▲ Collapse' : '▼ Read Full JD'}
                  </span>
                </h4>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, fontWeight: 600 }}>{job.client || 'Verified Client'} · 📍 {locationText}</div>
              </div>

              {/* Stats Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {[
                  { label: 'Candidates', val: getJobCandidateCount(job.id) },
                  { label: 'Submitted', val: getJobSubmittedCount(job.id) },
                  { label: 'Interview', val: getJobInterviewCount(job.id) },
                  { label: 'Submissions', val: getJobSubmissionCount(job.id) },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 8, padding: '6px 0' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#2563eb' }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Brief JD Preview (when collapsed) */}
              {!isExpanded && fullDesc && (
                <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                  {fullDesc.slice(0, 140).trim()}...
                  <button
                    onClick={() => toggleExpand(job.id)}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer', padding: '0 0 0 4px', fontWeight: 700 }}
                  >Expand ▼</button>
                </div>
              )}

              {/* INLINE EXPANDED FULL DESCRIPTION SECTION (WHEN CLICKED) */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, maxHeight: 320, overflowY: 'auto' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>📝 Formatted Job Description</div>
                    <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {fullDesc}
                    </div>
                  </div>

                  {/* Matched candidates mini list */}
                  {jobCandidates.length > 0 && (
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>👥 Matched Candidates ({jobCandidates.length})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {jobCandidates.slice(0, 4).map((c, idx) => (
                          <div key={c.id || idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#1e3a8a' }}>
                            <span>{c.extracted_profile?.name || c.name}</span>
                            <span style={{ fontWeight: 700, color: '#16a34a' }}>{c.jd_match?.match_score || c.matchScore || 0}% Match</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Meta Row (Location, Exp, Deadline) */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { icon: '📍', val: locationText },
                  { icon: '💼', val: job.experience || 'Relevant Experience' },
                  { icon: '📅', val: job.creationDate || '—' },
                  { icon: '⏰', val: job.deadline || '—', danger: isClosed },
                ].map(m => (
                  <span key={m.icon + m.val} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#f1f5f9', color: m.danger ? '#b91c1c' : '#475569', border: '1px solid #e2e8f0', fontWeight: 500 }}>
                    {m.icon} {m.val}
                  </span>
                ))}
              </div>

              {/* Skills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(Array.isArray(job.skills) ? job.skills : []).slice(0, 5).map(s => (
                  <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 600 }}>{s}</span>
                ))}
                {(Array.isArray(job.skills) ? job.skills : []).length > 5 && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, color: '#64748b' }}>+{job.skills.length - 5} more</span>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: 12, marginTop: 4 }}>
                <button onClick={(e) => handleOpenEdit(e, job)}
                  style={{ flex: 1, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 7, padding: '7px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  ✏️ Edit
                </button>
                <button onClick={(e) => handleReformatJob(e, job)} disabled={isReformatting}
                  style={{ flex: 1, background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', borderRadius: 7, padding: '7px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {isReformatting ? '⏳' : '🪄'} {isReformatting ? 'Formatting...' : 'AI Re-format'}
                </button>
                <button onClick={() => setJdModalJob(job)}
                  style={{ flex: 1, background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 7, padding: '7px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  📄 Full JD
                </button>
                <button
                  onClick={(e) => handleOpenLinkedInModal(e, job)}
                  style={{ flex: 1, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 7, padding: '7px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  📡 LinkedIn
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id) }}
                  style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 7, padding: '7px 10px', fontSize: 12, cursor: 'pointer' }}>
                  🗑️
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredJobs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💼</div>
          <p style={{ fontSize: 16, fontWeight: 600 }}>No jobs found</p>
          <p style={{ fontSize: 13 }}>Try scraping JobsInHand or paste a JD above</p>
        </div>
      )}

      {/* LINKEDIN POST FORMAT PREVIEW & GENERATOR MODAL */}
      {linkedinModalJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setLinkedinModalJob(null)}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', padding: 26, boxShadow: '0 20px 50px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0a66c2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📡 LinkedIn Post Generator & Formatter
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: 18, fontFamily: 'Plus Jakarta Sans', color: '#0f172a', fontWeight: 800 }}>
                  LinkedIn Hiring Post for "{linkedinModalJob.title}"
                </h3>
              </div>
              <button onClick={() => setLinkedinModalJob(null)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>✕</button>
            </div>

            {copiedSuccess && (
              <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
                ✅ LinkedIn Post Copied to Clipboard with Direct Link & Hashtags!
              </div>
            )}

            {postSuccessMsg && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
                {postSuccessMsg}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Formatted LinkedIn Post Content (Editable):</label>
              <textarea
                rows={12}
                value={linkedinPostText}
                onChange={(e) => setLinkedinPostText(e.target.value)}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace, sans-serif', fontSize: 13, lineHeight: 1.6 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setLinkedinModalJob(null)} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleCopyLinkedInPost}
                style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                📋 Copy LinkedIn Post
              </button>
              <button onClick={handleDirectPostLinkedIn} disabled={postingLinkedIn}
                style={{ background: '#0a66c2', color: '#ffffff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(10,102,194,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {postingLinkedIn ? '⏳ Publishing...' : '📡 Post Direct to LinkedIn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JD FULL VIEW MODAL inside ATS */}
      {jdModalJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setJdModalJob(null)}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, width: '100%', maxWidth: 740, maxHeight: '88vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, color: '#0f172a', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 20, fontWeight: 800 }}>{jdModalJob.title}</h2>
                <div style={{ color: '#2563eb', fontSize: 13, marginTop: 4, fontWeight: 700 }}>📍 {jdModalJob.location || 'Remote, US'} · {jdModalJob.client || 'Direct Client'}</div>
              </div>
              <button onClick={() => setJdModalJob(null)}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                ✕ Close
              </button>
            </div>

            {/* Job Meta Info */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {[
                { icon: '📍', label: 'Location', val: jdModalJob.location || 'Remote, US' },
                { icon: '💼', label: 'Exp', val: jdModalJob.experience || 'Relevant Experience' },
                { icon: '🏢', label: 'Mode', val: jdModalJob.work_mode || 'Onsite' },
                { icon: '📋', label: 'Type', val: jdModalJob.employment_type || 'Contract' },
                { icon: '📅', label: 'Created', val: jdModalJob.creationDate || '—' },
                { icon: '⏰', label: 'Deadline', val: jdModalJob.deadline || '—' },
              ].map(m => (
                <div key={m.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{m.icon} {m.label}</div>
                  <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 700, marginTop: 2 }}>{m.val}</div>
                </div>
              ))}
            </div>

            {/* Required Skills */}
            {Array.isArray(jdModalJob.skills) && jdModalJob.skills.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {jdModalJob.skills.map(s => (
                    <span key={s} style={{ padding: '4px 10px', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: 12, fontWeight: 600 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Full Formatted JD Text */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📝 Full Job Description</div>
              <div style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {getFullDescriptionText(jdModalJob)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={(e) => { handleOpenEdit(e, jdModalJob); setJdModalJob(null) }}
                style={{ flex: 1, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                ✏️ Edit Job
              </button>
              <button onClick={() => { const link = `${window.location.origin}/jobs?jobId=${jdModalJob.id}`; navigator.clipboard.writeText(link) }}
                style={{ flex: 1, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                🔗 Copy Candidate Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT JOB MODAL */}
      {editingJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setEditingJob(null)}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'Plus Jakarta Sans', color: '#0f172a', fontWeight: 800 }}>✏️ Edit Job Posting ({editingJob.id})</h3>
              <button onClick={() => setEditingJob(null)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>✕</button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Job Title *</label>
                <input type="text" required value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Client Company</label>
                  <input type="text" value={editFormData.client} onChange={(e) => setEditFormData({ ...editFormData, client: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Location *</label>
                  <input type="text" required value={editFormData.location} onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })} placeholder="e.g. Austin, TX" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Work Mode</label>
                  <select value={editFormData.work_mode} onChange={(e) => setEditFormData({ ...editFormData, work_mode: e.target.value })} style={inputStyle}>
                    <option value="Remote">🏠 Remote</option>
                    <option value="Hybrid">🏢 Hybrid</option>
                    <option value="Onsite">📍 Onsite</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Employment Type</label>
                  <select value={editFormData.employment_type} onChange={(e) => setEditFormData({ ...editFormData, employment_type: e.target.value })} style={inputStyle}>
                    <option>Contract</option>
                    <option>Full-time</option>
                    <option>C2H</option>
                    <option>C2C</option>
                    <option>W2</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Skills (comma separated)</label>
                <input type="text" value={editFormData.skills} onChange={(e) => setEditFormData({ ...editFormData, skills: e.target.value })} placeholder="Python, AWS, SQL" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Full Job Description (Editable)</label>
                <textarea rows={8} value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setEditingJob(null)} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={savingEdit} style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {savingEdit ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobsModule
