import React, { useState } from 'react'
import { saveAtsJob } from '../lib/atsFirestore'
import { pushActivityNotification } from '../components/ActivityNotificationBell'
import { formatJobDescription, resolveJobLocation, cleanJobTitleWithPositionNumber, resolveReqId } from '../utils/formatJobDescription'

function JobsModule({
  jobsList = [], allCandidates = [], submissions = [],
  rawJdText, setRawJdText, parsingJd, handleParseJd,
  isScraping, handleScrapeNow,
  publishingJobId, handlePostJobToLinkedIn, handleDeleteJob,
  handleOpenJobPreview, fetchJobs,
  recruiterInfo = null,   // { id, name, email, refCode }
  isSuperAdmin = true,
}) {
  const [expandedJobId, setExpandedJobId] = useState(null)
  const [editingJob, setEditingJob] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [reformattingJobId, setReformattingJobId] = useState(null)
  const [jdModalJob, setJdModalJob] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // AI Job Deep Analysis state
  const [aiAnalysisJobId, setAiAnalysisJobId] = useState(null)
  const [aiAnalysisResult, setAiAnalysisResult] = useState({})
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState({})
  const [copiedBoolean, setCopiedBoolean] = useState({})

  const handleAIJobAnalysis = async (job) => {
    const jobId = job.id || job._id
    setAiAnalysisJobId(prev => prev === jobId ? null : jobId)
    if (aiAnalysisResult[jobId]) return // already loaded
    setAiAnalysisLoading(prev => ({ ...prev, [jobId]: true }))
    try {
      const res = await fetch('/api/ai/job-analysis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, jobTitle: job.title || job.jobTitle, location: job.location, skills: job.skills || [], description: job.description || job.rawJd || '', workMode: job.work_mode || job.workMode, type: job.employment_type || job.type })
      })
      const data = await res.json()
      if (data.success) setAiAnalysisResult(prev => ({ ...prev, [jobId]: data.analysis }))
    } catch (e) {}
    setAiAnalysisLoading(prev => ({ ...prev, [jobId]: false }))
  }

  const copyBoolean = (jobId, platform, text) => {
    navigator.clipboard.writeText(text)
    setCopiedBoolean(prev => ({ ...prev, [jobId + platform]: true }))
    setTimeout(() => setCopiedBoolean(prev => ({ ...prev, [jobId + platform]: false })), 2000)
  }


  // Recruiter Manual Job Post state
  const [showPostForm, setShowPostForm] = useState(false)
  const [postForm, setPostForm] = useState({ title: '', client: '', location: '', work_mode: 'Onsite', employment_type: 'Contract', experience: '', skills: '', description: '' })
  const [postingJob, setPostingJob] = useState(false)
  const [postedJobLink, setPostedJobLink] = useState(null)

  // LinkedIn Post Generator Modal State
  const [linkedinModalJob, setLinkedinModalJob] = useState(null)
  const [linkedinPostText, setLinkedinPostText] = useState('')
  const [copiedSuccess, setCopiedSuccess] = useState(false)
  const [postingLinkedIn, setPostingLinkedIn] = useState(false)
  const [postSuccessMsg, setPostSuccessMsg] = useState('')

  // Recruiter List for Attribution
  const ALL_SMARTHIRE_RECRUITERS = [
    { name: 'Omkesh Manjute', email: 'omkesh.manjute@smarthire.com', refCode: 'omkesh', role: 'Super Admin' },
    { name: 'Vaibhav Bisen', email: 'vaibhav.bisen@smarthire.com', refCode: 'vaibhav-bisen', role: 'Lead Recruiter' },
    { name: 'Sukamal Chatterjee', email: 'sukamal.c@smarthire.com', refCode: 'sukamal-chatterjee', role: 'Senior Recruiter' },
    { name: 'Prudhvi Sevveti', email: 'prudhvi.s@smarthire.com', refCode: 'prudhvi-sevveti', role: 'Recruiter' },
    { name: 'Nitin Bhosale', email: 'nitin.b@smarthire.com', refCode: 'nitin-bhosale', role: 'Recruiter' },
    { name: 'Naveen Korimelli', email: 'naveen.k@smarthire.com', refCode: 'naveen-korimelli', role: 'Recruiter' },
    { name: 'Ajay Arya', email: 'ajay.a@smarthire.com', refCode: 'ajay-arya', role: 'Recruiter' },
    { name: 'Raj Barve', email: 'raj.b@smarthire.com', refCode: 'raj-barve', role: 'Recruiter' },
    { name: 'Pankaj Maharwade', email: 'pankaj.m@smarthire.com', refCode: 'pankaj-maharwade', role: 'Senior Recruiter' },
    { name: 'Nishant Kathane', email: 'nishant.k@smarthire.com', refCode: 'nishant-kathane', role: 'Recruiter' }
  ]

  const [selectedRecruiterPoster, setSelectedRecruiterPoster] = useState(() => {
    const matched = ALL_SMARTHIRE_RECRUITERS.find(r => 
      (recruiterInfo?.email && r.email.toLowerCase() === recruiterInfo.email.toLowerCase()) ||
      (recruiterInfo?.name && r.name.toLowerCase().includes(recruiterInfo.name.toLowerCase()))
    )
    return matched || ALL_SMARTHIRE_RECRUITERS[0]
  })

  // Candidate Application Links Modal State
  const [applyLinksJob, setApplyLinksJob] = useState(null)
  const [copiedLinkSuccess, setCopiedLinkSuccess] = useState(false)
  const [copyLinkToast, setCopyLinkToast] = useState('')

  const allSafeJobs = Array.isArray(jobsList) ? jobsList : []
  // Recruiters see only their own jobs; Admin sees all
  const safeJobs = isSuperAdmin
    ? allSafeJobs
    : allSafeJobs.filter(j => !j.postedBy || j.postedBy === (recruiterInfo?.id || recruiterInfo?.email || ''))
  const safeCandidates = Array.isArray(allCandidates) ? allCandidates : []
  const safeSubmissions = Array.isArray(submissions) ? submissions : []

  // Recruiter unique application link for a job
  const getRecruiterJobLink = (jobId, customRefCode) => {
    const ref = customRefCode || selectedRecruiterPoster?.refCode || recruiterInfo?.refCode || 'omkesh'
    const base = `${window.location.origin}/careers?job=${jobId}`
    return `${base}&ref=${ref}`
  }

  // LinkedIn Share URL generator (no API needed)
  const getLinkedInShareUrl = (job) => {
    const link = getRecruiterJobLink(job.id, selectedRecruiterPoster?.refCode)
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`
  }

  // Recruiter manual job post handler
  const handleManualPostJob = async (e) => {
    e.preventDefault()
    if (!postForm.title.trim()) return
    setPostingJob(true)
    try {
      const skillsArray = postForm.skills.split(',').map(s => s.trim()).filter(Boolean)
      const payload = {
        ...postForm,
        skills: skillsArray,
        status: 'Active',
        source: 'manual',
        postedBy: selectedRecruiterPoster.email || recruiterInfo?.id || recruiterInfo?.email || 'recruiter',
        postedByName: selectedRecruiterPoster.name || recruiterInfo?.name || 'Recruiter',
        refCode: selectedRecruiterPoster.refCode || recruiterInfo?.refCode || 'omkesh',
      }

      // 1. Direct Save to Firebase Firestore (Always persists, never sleeps)
      const tempId = `J-${Date.now()}`
      try {
        await saveAtsJob(tempId, { ...payload, id: tempId })
      } catch (fErr) {
        console.warn('Firebase saveAtsJob error:', fErr)
      }

      let finalJobId = tempId
      try {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('smarthire_token') || ''}` },
          body: JSON.stringify(payload)
        })
        const data = res.ok ? await res.json() : null
        finalJobId = data?.id || data?.data?.id || data?.job?.id || tempId
        const appLink = getRecruiterJobLink(finalJobId, selectedRecruiterPoster.refCode)
        setPostedJobLink(appLink)
      } catch (backendErr) {
        setPostedJobLink(getRecruiterJobLink(tempId, selectedRecruiterPoster.refCode))
      }

      // 3. Trigger instant in-app activity notification and audio chime
      pushActivityNotification({
        title: '💼 New Requisition Live!',
        message: `${payload.title} (${payload.client || 'Enterprise'} · ${payload.location || 'Remote'}) is now active in ATS.`,
        type: 'requisition',
        category: 'team',
        actor: payload.postedByName || recruiterInfo?.name || 'Recruiter',
        actorRole: 'Recruiter',
        reqId: finalJobId
      })

      setPostForm({ title: '', client: '', location: '', work_mode: 'Onsite', employment_type: 'Contract', experience: '', skills: '', description: '' })
      if (fetchJobs) fetchJobs()
    } catch (err) {
      console.error('Manual job post failed:', err)
      const tempId = `J-${Date.now()}`
      setPostedJobLink(getRecruiterJobLink(tempId, selectedRecruiterPoster.refCode))
    } finally {
      setPostingJob(false)
    }
  }

  const openJobs = safeJobs.filter(j => j && (j.status === 'Active' || j.status === 'Posted')).length

  const getJobCandidateCount = (jobId) => safeCandidates.filter(c => c && c.job_id === jobId).length
  const getJobSubmissionCount = (jobId) => safeSubmissions.filter(s => s && s.jobId === jobId).length
  const getJobInterviewCount = (jobId) => safeCandidates.filter(c => c && c.job_id === jobId && c.status === 'Interview Scheduled').length
  const getJobSubmittedCount = (jobId) => safeCandidates.filter(c => c && c.job_id === jobId && (c.status === 'Shortlisted' || c.status === 'RTR Received')).length

  const getFullDescriptionText = (job) => {
    if (!job) return ''
    const raw = job.rawDescription || job.fullDescription || job.rawText || job.details || job.rawJd || job.description
    if (raw && typeof raw === 'string' && raw.length > 30) {
      return formatJobDescription(raw, job)
    }
    return formatJobDescription('', job)
  }

  // LinkedIn Post Text Generator (Matching exact recruiter template format)
  const generateLinkedInPost = (job, specificRecruiter = null) => {
    if (!job) return ''
    const rec = specificRecruiter || selectedRecruiterPoster || ALL_SMARTHIRE_RECRUITERS[0]
    const title = job.title || 'Specialist'
    let loc = job.location || 'Remote, US'
    const mode = job.work_mode || job.workMode || 'Onsite'
    const type = job.employment_type || job.employmentType || job.type || 'Contract'
    const appLink = getRecruiterJobLink(job.id, rec.refCode)
    const emailToUse = rec.email || recruiterInfo?.email || 'omkesh.manjute@smarthire.com'

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

🔗 Direct Candidate Application Link: ${appLink}
✉️ Share the matching candidate resume at ${emailToUse}

${cleanTitleTag} ${locTag} ${modeTag} #USStaffing #ContractSoftwareTesting #AgileMethods #DevOps ${skillTags}`
  }

  const handleOpenLinkedInModal = (e, job, rec = null) => {
    if (e) e.stopPropagation()
    const activeRec = rec || selectedRecruiterPoster
    setLinkedinModalJob(job)
    setLinkedinPostText(generateLinkedInPost(job, activeRec))
    setCopiedSuccess(false)
    setCopiedLinkSuccess(false)
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
        await handlePostJobToLinkedIn(linkedinModalJob.id, linkedinPostText)
      }
      setPostSuccessMsg('🎉 Successfully posted to LinkedIn Feed!')
    } catch (err) {
      console.error('LinkedIn Direct Post Error:', err)
      setPostSuccessMsg(`❌ LinkedIn posting failed: ${err.message || 'connection error'}`)
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
      const updatePayload = {
        ...editFormData,
        skills: skillsArray,
        billRate: editFormData.budget,
        rawDescription: editFormData.description
      }

      // Save to Firebase Firestore
      try {
        await saveAtsJob(editingJob.id, updatePayload)
      } catch (fErr) {
        console.warn('Firestore update job error:', fErr)
      }

      // Also call backend if active
      try {
        await fetch(`/api/jobs/${editingJob.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        })
      } catch(e) {}

      setEditingJob(null)
      if (fetchJobs) fetchJobs()
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

      {/* ── RECRUITER MANUAL JOB POST FORM ─────────────────────── */}
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showPostForm ? 16 : 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
              ✍️ Post a Job
              {!isSuperAdmin && recruiterInfo?.refCode && (
                <span style={{ fontSize: 11, background: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe', borderRadius: 20, padding: '2px 9px', fontWeight: 700 }}>
                  🔗 Your ref: {recruiterInfo.refCode}
                </span>
              )}
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9ca3af' }}>Paste JD or fill form — candidates will apply through your unique link</p>
          </div>
          <button
            onClick={() => { setShowPostForm(v => !v); setPostedJobLink(null) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: showPostForm ? '#f3f4f6' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: showPostForm ? '#374151' : '#ffffff',
              border: showPostForm ? '1px solid #e5e7eb' : 'none',
              cursor: 'pointer', boxShadow: showPostForm ? 'none' : '0 2px 8px rgba(99,102,241,0.35)',
              transition: 'all 0.2s',
            }}
          >
            {showPostForm ? '✕ Close' : '+ Post New Job'}
          </button>
        </div>

        {showPostForm && (
          <form onSubmit={handleManualPostJob} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Job Title *</label>
                <input required value={postForm.title} onChange={e => setPostForm(p => ({...p, title: e.target.value}))} placeholder="e.g. Senior Java Developer" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Client / Company</label>
                <input value={postForm.client} onChange={e => setPostForm(p => ({...p, client: e.target.value}))} placeholder="e.g. Microsoft" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input value={postForm.location} onChange={e => setPostForm(p => ({...p, location: e.target.value}))} placeholder="e.g. Austin, TX" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Experience</label>
                <input value={postForm.experience} onChange={e => setPostForm(p => ({...p, experience: e.target.value}))} placeholder="e.g. 5+ years" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Work Mode</label>
                <select value={postForm.work_mode} onChange={e => setPostForm(p => ({...p, work_mode: e.target.value}))} style={inputStyle}>
                  <option>Onsite</option><option>Remote</option><option>Hybrid</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Employment Type</label>
                <select value={postForm.employment_type} onChange={e => setPostForm(p => ({...p, employment_type: e.target.value}))} style={inputStyle}>
                  <option>Contract</option><option>Full-time</option><option>Part-time</option><option>Contract-to-hire</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Required Skills (comma separated)</label>
              <input value={postForm.skills} onChange={e => setPostForm(p => ({...p, skills: e.target.value}))} placeholder="e.g. React, Node.js, MongoDB" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Job Description (paste full JD or leave blank)</label>
              <textarea value={postForm.description} onChange={e => setPostForm(p => ({...p, description: e.target.value}))} rows={4} placeholder="Paste JD or write a brief..." style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            {/* Posted Job Link Preview */}
            {postedJobLink && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginBottom: 8 }}>✅ Job Posted! Your unique candidate application link:</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input readOnly value={postedJobLink} style={{ flex: 1, ...inputStyle, background: '#f0fdf4', fontSize: 12, fontFamily: 'monospace', minWidth: 200 }} />
                  <button type="button" onClick={() => { navigator.clipboard.writeText(postedJobLink) }}
                    style={{ padding: '8px 12px', borderRadius: 7, background: '#059669', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    📋 Copy Link
                  </button>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postedJobLink)}`}
                    target="_blank" rel="noreferrer"
                    style={{ padding: '8px 12px', borderRadius: 7, background: '#0a66c2', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    Share on LinkedIn
                  </a>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setShowPostForm(false)}
                style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" disabled={postingJob || !postForm.title.trim()}
                style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (postingJob || !postForm.title.trim()) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                {postingJob ? '⏳ Posting...' : '🚀 Post Job'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* AI JD Parser — collapse/expand depending on if manual form open */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans', color: '#0f172a', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              🪄 AI Job Description Parser
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>Paste raw JD below — AI extracts title, client, skills, budget, location automatically</p>
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

      {/* Active Jobs Table (Zoho CRM Clean Layout) */}
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#ffffff' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Req#</th>
              <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Position Title</th>
              <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Client / Customer</th>
              <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Location</th>
              <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Work Mode</th>
              <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Key Skills</th>
              <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Deadline</th>
              <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', whiteSpace: 'nowrap' }}>Candidates</th>
              {isSuperAdmin && (
                <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', whiteSpace: 'nowrap' }}>LinkedIn Post</th>
              )}
              <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 10 : 9} style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
                  No active job postings found matching search criteria.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => {
                const displayReqId = resolveReqId(job.reqId || job.id, job)
                const cleanTitle = cleanJobTitleWithPositionNumber(job.title, job) || job.title
                const workMode = job.work_mode || job.workMode || job.type || 'Onsite'
                const candidateCount = getJobCandidateCount(job.id)
                const locationText = resolveJobLocation(job)
                const skillsList = Array.isArray(job.skills) ? job.skills : []

                return (
                  <tr
                    key={job.id}
                    style={{ background: '#ffffff', borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                  >
                    <td style={{ padding: '10px 14px', color: '#2563eb', fontWeight: '700', whiteSpace: 'nowrap' }}>
                      <span onClick={() => setJdModalJob(job)} style={{ cursor: 'pointer' }} title="View Requisition">
                        {displayReqId}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#0f172a', fontWeight: '600', maxWidth: '240px' }}>
                      <span onClick={() => setJdModalJob(job)} style={{ cursor: 'pointer' }} title={cleanTitle}>
                        {cleanTitle}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#475569', whiteSpace: 'nowrap' }}>
                      {job.client || 'Verified Client'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {locationText}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: workMode === 'Remote' ? '#ecfdf5' : workMode === 'Hybrid' ? '#fef3c7' : '#eff6ff',
                        color: workMode === 'Remote' ? '#047857' : workMode === 'Hybrid' ? '#b45309' : '#1d4ed8',
                        border: `1px solid ${workMode === 'Remote' ? '#a7f3d0' : workMode === 'Hybrid' ? '#fde68a' : '#bfdbfe'}`
                      }}>
                        {workMode}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#475569', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {skillsList.slice(0, 3).join(', ')}{skillsList.length > 3 ? ` +${skillsList.length - 3}` : ''}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {job.deadline || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700', color: candidateCount > 0 ? '#16a34a' : '#94a3b8' }}>
                      {candidateCount}
                    </td>
                    {isSuperAdmin && (
                      <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={(e) => handleOpenLinkedInModal(e, job)}
                          style={{
                            background: '#0a66c2',
                            color: '#ffffff',
                            border: 'none',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="Open LinkedIn Post Generator"
                        >
                          <span>🌐 Post</span>
                        </button>
                      </td>
                    )}
                    <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            const link = getRecruiterJobLink(job.id, selectedRecruiterPoster?.refCode)
                            navigator.clipboard.writeText(link)
                            setCopyLinkToast(`✅ Referral link copied for ${selectedRecruiterPoster?.name}!`)
                            setTimeout(() => setCopyLinkToast(''), 3500)
                          }}
                          style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', fontSize: '11px', fontWeight: '600', borderRadius: '4px', cursor: 'pointer', color: '#2563eb' }}
                          title="Copy candidate application link"
                        >
                          🔗 Apply
                        </button>
                        <button
                          type="button"
                          onClick={() => setJdModalJob(job)}
                          style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', fontSize: '11px', fontWeight: '600', borderRadius: '4px', cursor: 'pointer', color: '#334155' }}
                          title="View Full Job Description"
                        >
                          📄 JD
                        </button>
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(e, job)}
                            style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', fontSize: '11px', fontWeight: '600', borderRadius: '4px', cursor: 'pointer', color: '#334155' }}
                            title="Edit Job"
                          >
                            ✏️
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id) }}
                            style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '3px 8px', fontSize: '11px', fontWeight: '600', borderRadius: '4px', cursor: 'pointer', color: '#e11d48' }}
                            title="Delete Job"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* LINKEDIN POST FORMAT PREVIEW & GENERATOR MODAL */}
      {linkedinModalJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setLinkedinModalJob(null)}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', padding: 26, boxShadow: '0 20px 50px rgba(0,0,0,0.18)' }}
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

            {/* Recruiter Attribution Selector */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1e3a8a' }}>👤 Recruiter Attribution:</span>
                <select
                  value={selectedRecruiterPoster.refCode}
                  onChange={(e) => {
                    const found = ALL_SMARTHIRE_RECRUITERS.find(r => r.refCode === e.target.value) || ALL_SMARTHIRE_RECRUITERS[0]
                    setSelectedRecruiterPoster(found)
                    if (linkedinModalJob) {
                      setLinkedinPostText(generateLinkedInPost(linkedinModalJob, found))
                    }
                  }}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #94a3b8', fontSize: 13, fontWeight: 700, background: '#ffffff', color: '#0f172a' }}
                >
                  {ALL_SMARTHIRE_RECRUITERS.map(r => (
                    <option key={r.refCode} value={r.refCode}>
                      {r.name} ({r.email})
                    </option>
                  ))}
                </select>
              </div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                Link Tag: <code style={{ color: '#0284c7', background: '#e0f2fe', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>ref={selectedRecruiterPoster.refCode}</code>
              </span>
            </div>

            {copiedSuccess && (
              <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
                ✅ Full LinkedIn Post Copied to Clipboard with Direct Link & Hashtags!
              </div>
            )}

            {copiedLinkSuccess && (
              <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
                ✅ Candidate Application Link Copied for <strong>{selectedRecruiterPoster.name}</strong>!
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
              <button
                onClick={() => {
                  const link = getRecruiterJobLink(linkedinModalJob.id, selectedRecruiterPoster.refCode)
                  navigator.clipboard.writeText(link)
                  setCopiedLinkSuccess(true)
                  setTimeout(() => setCopiedLinkSuccess(false), 3000)
                }}
                style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                🔗 Copy Apply Link Only
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
                <div style={{ color: '#2563eb', fontSize: 13, marginTop: 4, fontWeight: 700 }}>📍 {resolveJobLocation(jdModalJob)} · {jdModalJob.client || 'Direct Client'}</div>
              </div>
              <button onClick={() => setJdModalJob(null)}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                ✕ Close
              </button>
            </div>

            {/* Job Meta Info */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {[
                { icon: '📍', label: 'Location', val: resolveJobLocation(jdModalJob) },
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

            {/* Skills Layout */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              {/* Required Skills */}
              {Array.isArray(jdModalJob.skills) && jdModalJob.skills.length > 0 && (
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {jdModalJob.skills.map(s => (
                      <span key={s} style={{ padding: '4px 10px', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: 12, fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferred Skills */}
              {((Array.isArray(jdModalJob.preferredSkills) && jdModalJob.preferredSkills.length > 0) || 
                (Array.isArray(jdModalJob.preferred_skills) && jdModalJob.preferred_skills.length > 0)) && (
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preferred Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(jdModalJob.preferredSkills || jdModalJob.preferred_skills).map(s => (
                      <span key={s} style={{ padding: '4px 10px', borderRadius: 6, background: '#faf5ff', color: '#7e22ce', border: '1px solid #e9d5ff', fontSize: 12, fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
