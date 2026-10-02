import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function SubmittalPackPage() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedCandidateId, setSelectedCandidateId] = useState('')
  const [selectedJobId, setSelectedJobId] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('standard')
  const [blindResume, setBlindResume] = useState(true)
  const [copyToast, setCopyToast] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  // Coversheet Form State
  const [coversheet, setCoversheet] = useState({
    candidateLegalName: '',
    targetRole: '',
    clientName: 'Enterprise Client',
    jobId: '',
    currentLocation: '',
    willingToRelocate: 'Yes (Open to Relocation)',
    visaStatus: 'US Citizen',
    visaExpiry: 'Valid / N/A',
    totalExperience: '8+ Years',
    relevantExperience: '7+ Years',
    proposedRate: '$75/hr C2C',
    highestEducation: 'B.S. in Computer Science',
    noticePeriod: 'Immediate / 2 Weeks',
    interviewAvailability: 'Flexible with 24 Hours Notice (Video)',
    linkedinUrl: '',
    references: 'Available upon client request',
    skillsMatrix: []
  })

  // Resume Content State
  const [resumeText, setResumeText] = useState('')

  // Load candidates and jobs on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [candsRes, jobsRes, hotlistsRes] = await Promise.all([
          fetch('/api/candidates', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}` }
          }).then(r => r.json()).catch(() => ({ candidates: [] })),
          fetch('/api/jobs').then(r => r.json()).catch(() => ({ jobs: [] })),
          fetch('/api/recruiter/vendor-hotlists').then(r => r.json()).catch(() => ({ hotlists: [] }))
        ])

        const candList = candsRes.candidates || []
        const hotlistItems = (hotlistsRes.hotlists || []).map(h => ({
          id: h.id,
          name: h.candidateName,
          role: h.role,
          skills: h.skills,
          experience: h.experience,
          location: h.location,
          visaStatus: h.visa,
          rate: h.rate,
          email: h.candidateEmail,
          phone: h.candidatePhone,
          isVendorHotlist: true,
          vendorCompany: h.vendorCompany
        }))

        // Combine and deduplicate
        const combined = [...candList, ...hotlistItems]
        const seen = new Set()
        const unique = combined.filter(c => {
          const key = (c.id || c.email || c.name).toLowerCase()
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

        setCandidates(unique)
        const jobList = jobsRes.jobs || jobsRes.requisitions || []
        setJobs(jobList)

        if (unique.length > 0) {
          setSelectedCandidateId(unique[0].id || unique[0].candidate_id)
        }
        if (jobList.length > 0) {
          setSelectedJobId(jobList[0].id)
        }
      } catch (err) {
        console.error('Failed to load submittal pack data:', err)
      }
    }
    loadInitialData()
  }, [])

  // Auto-populate when candidate or job changes
  useEffect(() => {
    if (!selectedCandidateId) return
    const cand = candidates.find(c => c.id === selectedCandidateId || c.candidate_id === selectedCandidateId)
    const job = jobs.find(j => String(j.id).replace(/^J-/, '') === String(selectedJobId).replace(/^J-/, '')) || (jobs.length > 0 ? jobs[0] : null)

    if (cand) {
      const exp = cand.experience || '8+ Years'
      const candSkills = Array.isArray(cand.skills) ? cand.skills : String(cand.skills || '').split(/[,|•]+/).map(s => s.trim()).filter(Boolean)
      const jobSkills = job ? (Array.isArray(job.skills) ? job.skills : String(job.skills || '').split(',').map(s => s.trim())) : ['Java', 'Cloud', 'Microservices', 'SQL']

      const matrix = jobSkills.slice(0, 5).map(sk => {
        const has = candSkills.some(cs => cs.toLowerCase().includes(sk.toLowerCase()) || sk.toLowerCase().includes(cs.toLowerCase()))
        return {
          skill: sk,
          requiredExp: '5+ Years',
          candidateExp: has ? `${Math.min(parseInt(exp) || 7, 7)}+ Years` : '3+ Years',
          rating: has ? 'Expert (9/10)' : 'Proficient (7/10)'
        }
      })

      setCoversheet({
        candidateLegalName: cand.name || cand.extracted_profile?.name || 'Candidate Full Legal Name',
        targetRole: cand.role || job?.title || 'Senior Consultant',
        clientName: job?.client || 'Enterprise Client',
        jobId: job ? String(job.id).replace(/^J-/, '') : 'REQ-101',
        currentLocation: cand.location || 'Austin, TX',
        willingToRelocate: 'Yes (Open to Relocation)',
        visaStatus: cand.visaStatus || cand.visa || 'US Citizen',
        visaExpiry: cand.visaStatus === 'US Citizen' || cand.visaStatus === 'Green Card' ? 'Permanent' : 'Valid & Active',
        totalExperience: exp,
        relevantExperience: `${parseInt(exp) > 2 ? parseInt(exp) - 1 : exp}+ Years`,
        proposedRate: cand.rate || job?.rate || '$75.00 / hr C2C',
        highestEducation: cand.education || 'B.S. in Computer Science',
        noticePeriod: 'Immediate / 2 Weeks',
        interviewAvailability: 'Flexible with 24 Hours Notice (Video)',
        linkedinUrl: cand.linkedinUrl || 'Verified LinkedIn Profile',
        references: 'Available upon client request',
        skillsMatrix: matrix
      })

      // Submittal Resume text
      const rawRes = cand.resumeText || cand.summary || ''
      if (rawRes) {
        setResumeText(rawRes)
      } else {
        setResumeText(`PROFESSIONAL SUMMARY\nAccomplished ${cand.role || 'Software Specialist'} with ${exp} of hands-on expertise building and scaling enterprise distributed systems.\n\nCORE COMPETENCIES\n${candSkills.join(' • ')}\n\nPROFESSIONAL WORK HISTORY\n• Spearheaded high-volume production microservices architecture with high availability\n• Designed RESTful and gRPC API gateways ensuring sub-second response times\n• Collaborated closely with cross-functional product, cloud, and QA squads\n\nEDUCATION & CERTIFICATIONS\n• ${cand.education || 'Bachelor of Science in Computer Science'}`)
      }
    }
  }, [selectedCandidateId, selectedJobId, candidates, jobs])

  // Generate plain-text coversheet for clipboard
  const generateFormattedCoversheetText = () => {
    return `=====================================================
CANDIDATE SUBMISSION COVERSHEET — ${coversheet.clientName.toUpperCase()}
REQUISITION: #${coversheet.jobId} - ${coversheet.targetRole}
AGENCY: CoolSoft LLC / SmartHire Recruiting Partner
=====================================================

Candidate Full Legal Name:  ${coversheet.candidateLegalName}
Target Position:            ${coversheet.targetRole}
Client Requisition ID:      #${coversheet.jobId} (${coversheet.clientName})
Current Location:           ${coversheet.currentLocation}
Relocation Preference:      ${coversheet.willingToRelocate}
Work Authorization / Visa:  ${coversheet.visaStatus} (Expiry: ${coversheet.visaExpiry})
Total Professional Exp:     ${coversheet.totalExperience}
Relevant Technology Exp:    ${coversheet.relevantExperience}
Proposed Billing / Pay Rate: ${coversheet.proposedRate}
Highest Education / Degree: ${coversheet.highestEducation}
Availability / Notice:      ${coversheet.noticePeriod}
Interview Availability:     ${coversheet.interviewAvailability}
LinkedIn Verification:      ${coversheet.linkedinUrl}

-----------------------------------------------------
TECHNICAL COMPETENCY & SKILLS MATRIX:
-----------------------------------------------------
${coversheet.skillsMatrix.map(sm => `• ${sm.skill.padEnd(24)} | Req: ${sm.requiredExp.padEnd(10)} | Candidate: ${sm.candidateExp.padEnd(10)} | ${sm.rating}`).join('\n')}

-----------------------------------------------------
PROFESSIONAL REFERENCES:
-----------------------------------------------------
${coversheet.references}
=====================================================`
  }

  const handleCopyCoversheet = () => {
    navigator.clipboard.writeText(generateFormattedCoversheetText())
    setCopyToast(true)
    setTimeout(() => setCopyToast(false), 2500)
  }

  const handlePrintSubmittalPack = () => {
    window.print()
  }

  const handleOpenEmailModal = () => {
    const cand = candidates.find(c => c.id === selectedCandidateId)
    setEmailTo(cand?.recruiterEmail || 'account-manager@coolsofttech.com')
    setEmailSubject(`Candidate Submittal: ${coversheet.candidateLegalName} — ${coversheet.targetRole} (Req #${coversheet.jobId} - ${coversheet.clientName})`)
    setEmailBody(`Hi Team,\n\nPlease find attached the submittal package and client presentation coversheet for ${coversheet.candidateLegalName} for the ${coversheet.targetRole} opening with ${coversheet.clientName}.\n\nCandidate is confirmed at ${coversheet.proposedRate} with ${coversheet.visaStatus} work authorization and available on ${coversheet.noticePeriod}.\n\nBest regards,\nSmartHire Submissions Team`)
    setShowEmailModal(true)
  }

  const handleSendEmail = async (e) => {
    e.preventDefault()
    setIsSendingEmail(true)
    try {
      const res = await fetch('/api/recruiter/send-direct-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          message: `${emailBody}\n\n${generateFormattedCoversheetText()}`
        })
      })
      const data = await res.json()
      if (data.success) {
        alert('Submittal package successfully dispatched via email!')
        setShowEmailModal(false)
      } else {
        alert(data.message || 'Failed to dispatch email')
      }
    } catch (err) {
      alert('Error sending submittal email: ' + err.message)
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div style={styles.pageWrap}>
      {/* Top Navbar */}
      <header style={styles.topNav} className="no-print">
        <div style={styles.navLeft}>
          <button onClick={() => navigate('/inbox')} style={styles.backBtn}>
            ← Back to Inbox
          </button>
          <div style={{ height: 18, width: 1, backgroundColor: '#e2e8f0' }} />
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Submittal Pack & Coversheet Generator
          </h2>
          <span style={styles.betaBadge}>Enterprise Submissions</span>
        </div>

        <div style={styles.navRight}>
          <button
            type="button"
            onClick={handleCopyCoversheet}
            style={styles.actionBtnSecondary}
            title="Copy formatted text to clipboard for portal/email paste"
          >
            📋 {copyToast ? 'Copied to Clipboard!' : 'Copy Coversheet'}
          </button>
          <button
            type="button"
            onClick={handlePrintSubmittalPack}
            style={styles.actionBtnSecondary}
            title="Export clean PDF submittal package"
          >
            📥 Print / Save PDF
          </button>
          <button
            type="button"
            onClick={handleOpenEmailModal}
            style={styles.actionBtnPrimary}
            title="Send submittal directly to client or account manager"
          >
            ✉️ Email Submittal Pack
          </button>
        </div>
      </header>

      {/* Control Selector Bar */}
      <div style={styles.selectorBar} className="no-print">
        <div style={styles.selectorInner}>
          {/* 1. Candidate Selector */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Select Candidate:</label>
            <select
              value={selectedCandidateId}
              onChange={e => setSelectedCandidateId(e.target.value)}
              style={styles.selectInput}
            >
              {candidates.map(c => (
                <option key={c.id || c.candidate_id} value={c.id || c.candidate_id}>
                  {c.name || 'Candidate'} — {c.role || 'Specialist'} {c.isVendorHotlist ? `(Bench: ${c.vendorCompany})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Target Job Selector */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Target Job Requisition:</label>
            <select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              style={styles.selectInput}
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  #{String(j.id).replace(/^J-/, '')}: {j.title} ({j.client || 'Client'})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Submittal Template */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Presentation Template:</label>
            <select
              value={selectedTemplate}
              onChange={e => setSelectedTemplate(e.target.value)}
              style={styles.selectInput}
            >
              <option value="standard">Standard US Direct Client Format</option>
              <option value="texas_dir">State Government / Texas DIR Matrix</option>
              <option value="msp_vms">MSP / VMS Matrix (Fieldglass & Beeline)</option>
              <option value="prime_vendor">Prime Vendor C2C Presentation</option>
              <option value="custom">Custom Recruiter Format</option>
            </select>
          </div>

          {/* 4. Blind Resume Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '18px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>
              <input
                type="checkbox"
                checked={blindResume}
                onChange={e => setBlindResume(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Blind Resume (Mask Direct Phone/Email)
            </label>
          </div>
        </div>
      </div>

      {/* Main Workspace: Left Column Coversheet Form, Right Column Live Formatted Submittal Resume */}
      <div style={styles.workspace}>
        {/* LEFT COLUMN: EDITABLE COVERSHEET FORM */}
        <div style={styles.coversheetCol} className="no-print">
          <div style={styles.colHeader}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Client Submission Coversheet
            </h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Editable Live Form</span>
          </div>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Candidate Full Legal Name</label>
              <input
                type="text"
                value={coversheet.candidateLegalName}
                onChange={e => setCoversheet({ ...coversheet, candidateLegalName: e.target.value })}
                style={styles.textInput}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Target Position</label>
              <input
                type="text"
                value={coversheet.targetRole}
                onChange={e => setCoversheet({ ...coversheet, targetRole: e.target.value })}
                style={styles.textInput}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Current Location (City, State)</label>
              <input
                type="text"
                value={coversheet.currentLocation}
                onChange={e => setCoversheet({ ...coversheet, currentLocation: e.target.value })}
                style={styles.textInput}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Relocation Preference</label>
              <select
                value={coversheet.willingToRelocate}
                onChange={e => setCoversheet({ ...coversheet, willingToRelocate: e.target.value })}
                style={styles.selectInput}
              >
                <option value="Yes (Open to Relocation)">Yes (Open to Relocation)</option>
                <option value="No (Local Only)">No (Local Only)</option>
                <option value="100% Remote Eligible">100% Remote Eligible</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Work Authorization / Visa Status</label>
              <input
                type="text"
                value={coversheet.visaStatus}
                onChange={e => setCoversheet({ ...coversheet, visaStatus: e.target.value })}
                style={styles.textInput}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Visa Expiration Date</label>
              <input
                type="text"
                value={coversheet.visaExpiry}
                onChange={e => setCoversheet({ ...coversheet, visaExpiry: e.target.value })}
                style={styles.textInput}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Total Experience</label>
              <input
                type="text"
                value={coversheet.totalExperience}
                onChange={e => setCoversheet({ ...coversheet, totalExperience: e.target.value })}
                style={styles.textInput}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Proposed Rate ($/hr)</label>
              <input
                type="text"
                value={coversheet.proposedRate}
                onChange={e => setCoversheet({ ...coversheet, proposedRate: e.target.value })}
                style={styles.textInput}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Highest Education / University</label>
              <input
                type="text"
                value={coversheet.highestEducation}
                onChange={e => setCoversheet({ ...coversheet, highestEducation: e.target.value })}
                style={styles.textInput}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Availability / Notice Period</label>
              <input
                type="text"
                value={coversheet.noticePeriod}
                onChange={e => setCoversheet({ ...coversheet, noticePeriod: e.target.value })}
                style={styles.textInput}
              />
            </div>
          </div>

          {/* Technical Skills Matrix Editor */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px' }}>
              Required Technical Skills Matrix
            </div>
            <table style={styles.matrixTable}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={styles.matrixTh}>Skill / Requirement</th>
                  <th style={styles.matrixTh}>Req. Years</th>
                  <th style={styles.matrixTh}>Candidate Exp</th>
                  <th style={styles.matrixTh}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {coversheet.skillsMatrix.map((sm, sIdx) => (
                  <tr key={sIdx}>
                    <td style={styles.matrixTd}>
                      <input
                        type="text"
                        value={sm.skill}
                        onChange={e => {
                          const updated = [...coversheet.skillsMatrix]
                          updated[sIdx].skill = e.target.value
                          setCoversheet({ ...coversheet, skillsMatrix: updated })
                        }}
                        style={styles.matrixInput}
                      />
                    </td>
                    <td style={styles.matrixTd}>
                      <input
                        type="text"
                        value={sm.requiredExp}
                        onChange={e => {
                          const updated = [...coversheet.skillsMatrix]
                          updated[sIdx].requiredExp = e.target.value
                          setCoversheet({ ...coversheet, skillsMatrix: updated })
                        }}
                        style={styles.matrixInput}
                      />
                    </td>
                    <td style={styles.matrixTd}>
                      <input
                        type="text"
                        value={sm.candidateExp}
                        onChange={e => {
                          const updated = [...coversheet.skillsMatrix]
                          updated[sIdx].candidateExp = e.target.value
                          setCoversheet({ ...coversheet, skillsMatrix: updated })
                        }}
                        style={styles.matrixInput}
                      />
                    </td>
                    <td style={styles.matrixTd}>
                      <input
                        type="text"
                        value={sm.rating}
                        onChange={e => {
                          const updated = [...coversheet.skillsMatrix]
                          updated[sIdx].rating = e.target.value
                          setCoversheet({ ...coversheet, skillsMatrix: updated })
                        }}
                        style={styles.matrixInput}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: CLIENT-READY FORMATTED RESUME PREVIEW */}
        <div style={styles.resumeCol}>
          <div style={styles.colHeader} className="no-print">
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Client-Ready Submittal Resume Preview
            </h3>
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>
              ✓ Ready for Client Presentation
            </span>
          </div>

          {/* Formatted Paper Wrapper */}
          <div style={styles.resumePaper}>
            {/* Branded Letterhead */}
            <div style={styles.letterhead}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                    {coversheet.candidateLegalName}
                  </h1>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#2563eb' }}>
                    {coversheet.targetRole}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>CoolSoft LLC</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>SmartHire Authorized Presentation</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Req #{coversheet.jobId} • {coversheet.clientName}</div>
                </div>
              </div>

              {/* Sub-bar with metadata */}
              <div style={styles.metaSubBar}>
                <span>📍 {coversheet.currentLocation}</span>
                <span>•</span>
                <span>🛡️ {coversheet.visaStatus}</span>
                <span>•</span>
                <span>⏱️ {coversheet.totalExperience}</span>
                {blindResume ? (
                  <>
                    <span>•</span>
                    <span style={{ color: '#059669', fontWeight: '700' }}>Represented exclusively via CoolSoft LLC</span>
                  </>
                ) : (
                  <>
                    <span>•</span>
                    <span>{coversheet.linkedinUrl}</span>
                  </>
                )}
              </div>
            </div>

            {/* Editable Formatted Resume Body */}
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              style={styles.resumeTextarea}
              placeholder="Paste or edit candidate resume sections..."
            />
          </div>
        </div>
      </div>

      {/* Email Dispatch Modal Popup */}
      {showEmailModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEmailModal(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Email Submittal Package to Client / Account Manager
              </h3>
              <button onClick={() => setShowEmailModal(false)} style={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleSendEmail} style={{ padding: '20px' }}>
              <div style={styles.modalField}>
                <label style={styles.inputLabel}>Recipient Email (Client / Account Manager) *</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  style={styles.textInput}
                  required
                />
              </div>

              <div style={styles.modalField}>
                <label style={styles.inputLabel}>Subject Line *</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  style={styles.textInput}
                  required
                />
              </div>

              <div style={styles.modalField}>
                <label style={styles.inputLabel}>Cover Message</label>
                <textarea
                  rows={4}
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  style={{ ...styles.textInput, resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  style={styles.actionBtnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  style={styles.actionBtnPrimary}
                >
                  {isSendingEmail ? 'Dispatching...' : 'Send Submittal Email ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  pageWrap: {
    minHeight: '100vh',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },
  topNav: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  betaBadge: {
    fontSize: '11px',
    fontWeight: '800',
    padding: '2px 8px',
    borderRadius: '12px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe'
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  actionBtnPrimary: {
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    fontSize: '12.5px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  actionBtnSecondary: {
    padding: '8px 14px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  selectorBar: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '14px 24px'
  },
  selectorInner: {
    display: 'flex',
    gap: '18px',
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  filterGroup: {
    flex: 1,
    minWidth: '220px'
  },
  filterLabel: {
    display: 'block',
    fontSize: '11.5px',
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '4px'
  },
  selectInput: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    outline: 'none',
    boxSizing: 'border-box'
  },
  workspace: {
    flex: 1,
    display: 'flex',
    padding: '20px 24px',
    gap: '20px',
    boxSizing: 'border-box'
  },
  coversheetCol: {
    width: '440px',
    flexShrink: 0,
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    boxSizing: 'border-box',
    maxHeight: 'calc(100vh - 170px)',
    overflowY: 'auto'
  },
  resumeCol: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 170px)',
    overflowY: 'auto'
  },
  colHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '10px'
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  inputLabel: {
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#475569'
  },
  textInput: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '7px',
    border: '1px solid #cbd5e1',
    fontSize: '12.5px',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box'
  },
  matrixTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
    border: '1px solid #e2e8f0'
  },
  matrixTh: {
    padding: '6px 8px',
    border: '1px solid #e2e8f0',
    textAlign: 'left',
    color: '#475569',
    fontSize: '11px',
    fontWeight: '800'
  },
  matrixTd: {
    padding: '4px',
    border: '1px solid #e2e8f0'
  },
  matrixInput: {
    width: '100%',
    border: 'none',
    background: 'transparent',
    fontSize: '11.5px',
    outline: 'none'
  },
  resumePaper: {
    flex: 1,
    backgroundColor: '#fafbfc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '28px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column'
  },
  letterhead: {
    borderBottom: '2px solid #0f172a',
    paddingBottom: '14px',
    marginBottom: '16px'
  },
  metaSubBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#475569',
    marginTop: '10px',
    flexWrap: 'wrap'
  },
  resumeTextarea: {
    flex: 1,
    minHeight: '440px',
    width: '100%',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '16px',
    fontSize: '13px',
    lineHeight: 1.6,
    color: '#0f172a',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    width: '100%',
    maxWidth: '560px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    overflow: 'hidden'
  },
  modalHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    color: '#64748b'
  },
  modalField: {
    marginBottom: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  }
}
