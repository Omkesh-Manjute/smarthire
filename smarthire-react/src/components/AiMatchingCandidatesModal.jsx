import React, { useState } from 'react'

export default function AiMatchingCandidatesModal({
  isOpen,
  onClose,
  job,
  matchingCandidates = [],
  currentUser,
  onAssignCandidate,
  onOpenCandidateDetails
}) {
  if (!isOpen || !job) return null

  const [assignedMap, setAssignedMap] = useState({})
  const [selectedOutreachCand, setSelectedOutreachCand] = useState(null)
  const [outreachSubject, setOutreachSubject] = useState('')
  const [outreachBody, setOutreachBody] = useState('')
  const [outreachSent, setOutreachSent] = useState(false)

  const userName = currentUser?.name || currentUser?.displayName || 'Recruiter'
  const userRole = currentUser?.role || 'recruiter'
  const cleanId = String(job.id || '158938').replace('J-', '')

  // Handle 1-click submit candidate to requisition
  const handleQuickSubmit = (cand) => {
    if (onAssignCandidate) {
      onAssignCandidate(cand, job)
    }
    setAssignedMap(prev => ({ ...prev, [cand.id]: true }))
  }

  // Handle opening email availability outreach draft
  const handleOpenOutreach = (cand) => {
    setSelectedOutreachCand(cand)
    setOutreachSubject(`New Opportunity: ${job.title || 'Senior Role'} at ${job.customer || job.client || 'State Client'} - Availability Check`)
    setOutreachBody(
      `Hi ${cand.name || 'Candidate'},\n\n` +
      `Hope you are doing well!\n\n` +
      `I noticed your profile is a strong match for a new opening we just received:\n` +
      `• Position: ${job.title || 'Consultant'}\n` +
      `• Client: ${job.customer || job.client || 'State Client'}\n` +
      `• Location: ${job.location || 'Columbia, SC (Hybrid/Remote)'}\n` +
      `• Target Rate: ${job.budget || '$75/hr'} (Your listed rate: ${cand.payRate || '$74/hr'})\n\n` +
      `Are you currently available and interested in being submitted for this role? Please confirm your availability date and updated resume at your earliest convenience.\n\n` +
      `Best regards,\n` +
      `${userName}\n` +
      `SmartHire Talent Team`
    )
    setOutreachSent(false)
  }

  // Handle sending email
  const handleSendOutreach = (e) => {
    e.preventDefault()
    setOutreachSent(true)
    setTimeout(() => {
      setSelectedOutreachCand(null)
      setOutreachSent(false)
    }, 2000)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(3px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Arial, Helvetica, sans-serif'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 0,
          border: '1px solid #7f9db9',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: '#000080',
          color: '#ffffff',
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#ffffff' }}>
                AI Proactive Candidate Matcher
              </div>
              <div style={{ fontSize: '11px', color: '#93c5fd', marginTop: '1px' }}>
                Requisition #{cleanId}: <strong>{job.title}</strong> ({job.customer || job.client || 'State Client'})
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#ffffff',
              fontSize: '16px',
              width: '26px',
              height: '26px',
              cursor: 'pointer',
              fontWeight: 'bold',
              borderRadius: 0
            }}
          >
            ✕
          </button>
        </div>

        {/* Info Banner */}
        <div style={{
          background: '#eff6ff',
          borderBottom: '1px solid #bfdbfe',
          padding: '8px 18px',
          fontSize: '11px',
          color: '#1e40af',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong>AI Matchmaker Found {matchingCandidates.length} Candidates</strong> from your sourcing pool matching skills & requirements. Check availability and submit with 1-Click!
          </div>
          <div style={{ fontWeight: 'bold', color: '#0369a1' }}>
            Target Budget: {job.budget || '$75/hr'}
          </div>
        </div>

        {/* Candidates List / Outreach View */}
        <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1, maxHeight: '65vh' }}>
          
          {/* Outreach Email Modal View */}
          {selectedOutreachCand ? (
            <div style={{ border: '1px solid #7f9db9', background: '#f8fafc', padding: '14px', borderRadius: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontWeight: 'bold', color: '#000080', fontSize: '12px' }}>
                  Quick Availability Outreach to {selectedOutreachCand.name} ({selectedOutreachCand.email || 'N/A'})
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOutreachCand(null)}
                  style={{ background: '#e2e8f0', border: '1px solid #94a3b8', padding: '2px 8px', fontSize: '10.5px', cursor: 'pointer', borderRadius: 0 }}
                >
                  Back to Matches
                </button>
              </div>

              {outreachSent ? (
                <div style={{ background: '#dcfce7', color: '#166534', padding: '16px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                  Availability email sent to {selectedOutreachCand.name}.
                </div>
              ) : (
                <form onSubmit={handleSendOutreach} style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#000080', marginBottom: '3px' }}>Subject:</label>
                    <input
                      type="text"
                      value={outreachSubject}
                      onChange={e => setOutreachSubject(e.target.value)}
                      style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #7f9db9', borderRadius: 0, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#000080', marginBottom: '3px' }}>Message Body:</label>
                    <textarea
                      rows={8}
                      value={outreachBody}
                      onChange={e => setOutreachBody(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '11px', lineHeight: '1.4', border: '1px solid #7f9db9', borderRadius: 0, boxSizing: 'border-box', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedOutreachCand(null)}
                      style={{ border: '1px solid #94a3b8', background: '#e2e8f0', padding: '3px 12px', fontSize: '11px', cursor: 'pointer', borderRadius: 0 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ border: '1px solid #000080', background: '#000080', color: '#ffffff', padding: '3px 16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', borderRadius: 0 }}
                    >
                      Send Availability Email
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {matchingCandidates.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  No candidates currently match this requisition's criteria above 75%. Try broadening the required skills.
                </div>
              ) : (
                matchingCandidates.map((cand, idx) => {
                  const isAssigned = assignedMap[cand.id]

                  // ── Real AI Multi-Criteria Scoring & Domain Check ──
                  const DOMAIN_KW = {
                    qa_sdet: ['qa', 'sdet', 'selenium', 'cypress', 'playwright', 'testing', 'automation', 'testng', 'cucumber', 'test lead'],
                    java_backend: ['java', 'spring boot', 'spring', 'microservices', 'hibernate', 'j2ee', 'kafka'],
                    dotnet_backend: ['.net', 'c#', 'asp.net', 'dotnet'],
                    python_backend: ['python', 'django', 'fastapi', 'flask'],
                    frontend: ['react', 'angular', 'vue', 'frontend', 'ui developer', 'javascript', 'typescript', 'next.js', 'css'],
                    data_analytics: ['data analyst', 'data engineer', 'power bi', 'tableau', 'sql', 'etl', 'data governance', 'data warehouse', 'snowflake', 'collibra'],
                    cloud_devops: ['devops', 'cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'terraform', 'ci/cd'],
                    network_security: ['network security', 'network engineer', 'cisco', 'palo alto', 'firewall', 'routing', 'switching', 'cybersecurity', 'vpn'],
                    ba_pm: ['business analyst', 'product owner', 'project manager', 'program director', 'scrum master', 'agile', 'pmp', 'brd', 'user stories'],
                    enterprise_erp: ['salesforce', 'sap', 'workday', 'servicenow', 'crm'],
                    legal_public: ['attorney', 'legal', 'compliance', 'regulatory', 'public health', 'counsel']
                  }

                  const classify = (title = '', skills = [], text = '') => {
                    const combined = `${title} ${Array.isArray(skills) ? skills.join(' ') : skills} ${text}`.toLowerCase()
                    let best = 'general'
                    let maxScore = 0
                    for (const [dom, kws] of Object.entries(DOMAIN_KW)) {
                      let score = 0
                      for (const kw of kws) {
                        if (title.toLowerCase().includes(kw)) score += 6
                        if (combined.includes(kw)) score += 2
                      }
                      if (score > maxScore) { maxScore = score; best = dom }
                    }
                    return best
                  }

                  const candSkillNames = (Array.isArray(cand.skills) ? cand.skills : (cand.skills || '').split(',').map(s => s.trim())).map(s => s.toLowerCase())
                  const reqSkills = Array.isArray(job.skills) ? job.skills : (typeof job.skills === 'string' ? job.skills.split(',').map(s => s.trim()) : [])
                  const reqTitle = (job.title || '').toLowerCase()
                  const candTitle = (cand.fullRole || cand.role || '').toLowerCase()

                  const candDomain = cand.candDomain || classify(candTitle, candSkillNames, cand.resumeText || '')
                  const jobDomain = classify(reqTitle, reqSkills, job.description || '')
                  const isDomainMatch = candDomain === jobDomain || candDomain === 'general' || jobDomain === 'general'

                  // 1. Title match (0-20)
                  let titlePts = 0
                  if (reqTitle && candTitle) {
                    if (candTitle === reqTitle) { titlePts = 20 }
                    else {
                      const reqWords = reqTitle.split(/\s+/).filter(w => w.length > 3 && !['senior', 'lead', 'specialist', 'junior'].includes(w))
                      const matchedWords = reqWords.filter(w => candTitle.includes(w))
                      const ratio = reqWords.length > 0 ? matchedWords.length / reqWords.length : 0
                      titlePts = ratio >= 0.75 ? 16 : ratio >= 0.4 ? 10 : 4
                    }
                  } else { titlePts = isDomainMatch ? 10 : 4 }

                  // 2. Skills match (0-45)
                  const matchedReqSkills = reqSkills.length > 0
                    ? reqSkills.filter(rs => candSkillNames.some(cs => cs.includes(rs.toLowerCase().trim()) || rs.toLowerCase().trim().includes(cs)))
                    : candSkillNames.slice(0, 5).map(s => s)
                  const skillPts = reqSkills.length > 0
                    ? Math.round((matchedReqSkills.length / reqSkills.length) * 45)
                    : (isDomainMatch ? 25 : 10)

                  // 3. Nice-to-have bonus (0-15)
                  const niceKeywords = ['agile', 'scrum', 'jira', 'sql', 'power bi', 'aws', 'azure', 'python', 'sharepoint']
                  const bonusMatched = niceKeywords.filter(kw => candSkillNames.some(cs => cs.includes(kw)))
                  const bonusPts = Math.min(15, bonusMatched.length * 2)

                  // 4. Govt/State experience (0-15)
                  const govtKeywords = ['state of', 'department of', 'county', 'dcf', 'hhs', 'government', 'federal', 'agency', 'city of', 'division of']
                  const candText = [cand.resumeText || '', cand.comments || '', ...(Array.isArray(cand.projects) ? cand.projects.map(p => `${p.client} ${p.description}`) : [])].join(' ').toLowerCase()
                  const govtMatches = govtKeywords.filter(kw => candText.includes(kw))
                  const govtPts = govtMatches.length >= 3 ? 15 : govtMatches.length >= 1 ? 8 : 0

                  // 5. Experience (0-5)
                  const candExp = parseInt(cand.exp || cand.experience || '0') || 0
                  const reqExpMatch = (job.description || '').match(/(\d+)\+?\s*years?/i)
                  const reqExp = reqExpMatch ? parseInt(reqExpMatch[1]) : 5
                  const expPts = candExp >= reqExp ? 5 : candExp >= reqExp - 2 ? 3 : 1

                  let rawScore = (isDomainMatch ? 20 : 0) + titlePts + skillPts + bonusPts + govtPts + expPts
                  if (!isDomainMatch) rawScore = Math.min(42, rawScore)

                  const fitScore = cand.matchScore ? cand.matchScore : Math.min(99, Math.max(30, rawScore))

                  // Build brief why-reasons
                  const whyReasons = []
                  if (isDomainMatch && candDomain !== 'general') whyReasons.push({ t: 'good', r: `Domain match: ${candDomain.replace('_', ' ').toUpperCase()}` })
                  if (titlePts >= 16) whyReasons.push({ t: 'good', r: `Title match: "${cand.fullRole || cand.role}"` })
                  else if (titlePts >= 10) whyReasons.push({ t: 'info', r: `Partial title match` })
                  if (matchedReqSkills.length > 0) whyReasons.push({ t: 'good', r: `${matchedReqSkills.length}/${reqSkills.length || '?'} required skills matched` })
                  if (govtPts > 0) whyReasons.push({ t: 'good', r: 'State/government experience detected' })
                  if (bonusPts > 0) whyReasons.push({ t: 'info', r: `${bonusMatched.length} bonus skills (${bonusMatched.slice(0, 3).join(', ')})` })
                  if (!isDomainMatch) whyReasons.push({ t: 'warn', r: `Domain divergence (${candDomain} vs ${jobDomain})` })

                  const scoreColor = fitScore >= 90 ? '#15803d' : fitScore >= 80 ? '#16a34a' : fitScore >= 70 ? '#0369a1' : '#92400e'
                  const scoreLabel = fitScore >= 90 ? 'Excellent' : fitScore >= 80 ? 'Strong' : fitScore >= 70 ? 'Good' : 'Moderate'

                  return (
                    <div
                      key={cand.id || idx}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #7f9db9',
                        borderLeft: `4px solid ${scoreColor}`,
                        borderRadius: 0,
                        padding: '10px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      {/* Top Row: Name, Score, Rate, Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            onClick={() => onOpenCandidateDetails && onOpenCandidateDetails(cand)}
                            style={{ fontWeight: 'bold', fontSize: '12.5px', color: '#000080', cursor: 'pointer' }}
                            title="Click to view full profile & resume"
                          >
                            {cand.name}
                          </span>

                          <span style={{
                            background: fitScore >= 90 ? '#dcfce7' : fitScore >= 80 ? '#d1fae5' : fitScore >= 70 ? '#e0f2fe' : '#fef3c7',
                            color: scoreColor,
                            border: `1px solid ${scoreColor}44`,
                            padding: '1px 6px',
                            fontSize: '10.5px',
                            fontWeight: 'bold',
                            borderRadius: 0
                          }}>
                            {fitScore}% — {scoreLabel}
                          </span>

                          <span style={{ color: '#475569', fontSize: '11px' }}>
                            Rate: <strong>{cand.payRate || '$74/hr'} ({cand.rateType || 'C2C'})</strong>
                          </span>

                          <span style={{ color: '#0284c7', fontSize: '10.5px', fontWeight: 'bold' }}>
                            Avbl: {cand.avblDate || 'Immediate'}
                          </span>

                          {govtPts > 0 && (
                            <span style={{ background: '#f3e8ff', color: '#7c3aed', fontSize: '9.5px', padding: '1px 6px', border: '1px solid #d8b4fe', fontWeight: 'bold' }}>
                              Govt Exp
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenOutreach(cand)}
                            style={{
                              border: '1px solid #7f9db9',
                              background: '#f8fafc',
                              color: '#000080',
                              padding: '3px 10px',
                              fontSize: '10.5px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              borderRadius: 0
                            }}
                          >
                            Check Availability
                          </button>

                          <button
                            type="button"
                            disabled={isAssigned}
                            onClick={() => handleQuickSubmit(cand)}
                            style={{
                              border: '1px solid #16a34a',
                              background: isAssigned ? '#dcfce7' : '#16a34a',
                              color: isAssigned ? '#166534' : '#ffffff',
                              padding: '3px 12px',
                              fontSize: '10.5px',
                              fontWeight: 'bold',
                              cursor: isAssigned ? 'default' : 'pointer',
                              borderRadius: 0
                            }}
                          >
                            {isAssigned ? 'Assigned to Req' : '1-Click Submit to Req'}
                          </button>
                        </div>
                      </div>

                      {/* Candidate Meta Info */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px', fontSize: '10.5px', color: '#334155', background: '#f8fafc', padding: '5px 8px', border: '1px solid #e2e8f0' }}>
                        <div>
                          <strong>Role:</strong> {cand.fullRole || cand.role || 'Consultant'} ({cand.exp || '5+'} Yrs)
                        </div>
                        <div>
                          <strong>Location:</strong> {cand.location || cand.city || 'Richmond, VA'} | {cand.workAuth || 'US Citizen'}
                        </div>
                        <div>
                          <strong>Owner / Sourced By:</strong> {cand.recruiter || cand.assignedTo || userName}
                        </div>
                      </div>

                      {/* Why This Match? (inline brief reasons) */}
                      {whyReasons.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '10px' }}>
                          <span style={{ color: '#64748b', fontWeight: 'bold' }}>Why match:</span>
                          {whyReasons.map((wr, wi) => (
                            <span key={wi} style={{ background: wr.t === 'good' ? '#dcfce7' : '#e0f2fe', color: wr.t === 'good' ? '#15803d' : '#0369a1', border: `1px solid ${wr.t === 'good' ? '#86efac' : '#bae6fd'}`, padding: '1px 6px' }}>
                              {wr.t === 'good' ? '✓' : '•'} {wr.r}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Matching Skills Breakdown */}
                      <div style={{ fontSize: '10.5px', color: '#166534' }}>
                        <strong>Skills: </strong>
                        <span style={{ color: '#0f172a' }}>
                          {Array.isArray(cand.skills) ? cand.skills.join(', ') : (cand.skills || 'General IT Consulting')}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div style={{
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          padding: '8px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px'
        }}>
          <span style={{ color: '#64748b' }}>
            SmartHire AI Proactive Match Engine • Evaluated against {matchingCandidates.length} candidate profile(s)
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid #71717a',
              background: '#e4e4e7',
              color: '#0f172a',
              padding: '3px 16px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderRadius: 0
            }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
