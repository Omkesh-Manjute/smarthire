import React, { useState, useMemo } from 'react'

export default function CandidateDetailViewModal({
  candidate,
  isOpen,
  onClose,
  allJobs = [],
  onUpdateCandidate,
  currentUser
}) {
  if (!isOpen || !candidate) return null

  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'submissions', 'resume_updates', 'edit_resume'
  const [newResumeFile, setNewResumeFile] = useState(null)
  const [newResumeNotes, setNewResumeNotes] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)

  const userName = currentUser?.name || currentUser?.displayName || 'Recruiter'
  const userRole = currentUser?.role || 'recruiter'

  // Dynamic calculation of where this candidate has been submitted
  const submissionHistory = useMemo(() => {
    const subs = []
    const candId = String(candidate.id || '')
    const candName = (candidate.name || '').toLowerCase()

    // 1. Scan all local storage potential candidates across all jobs
    allJobs.forEach(job => {
      const cleanId = String(job.id || '').replace('J-', '')
      try {
        const raw = localStorage.getItem(`smarthire_potential_candidates_${cleanId}`)
        if (raw) {
          const list = JSON.parse(raw)
          if (Array.isArray(list)) {
            const match = list.find(c => String(c.id) === candId || (c.name && c.name.toLowerCase() === candName))
            if (match) {
              subs.push({
                reqId: cleanId,
                reqTitle: job.title || 'Requisition Position',
                client: job.customer || job.client || 'State Client',
                status: match.status || 'Int-SubmittedToManager',
                assignedBy: match.assignedBy || match.lastChangedBy || candidate.recruiter || userName,
                assignedOn: match.assignedOn || match.lastChangedOn || 'Aug 26, 2026',
                payRate: match.payRate || candidate.payRate || '$74 /hr',
                payRateType: match.payRateType || candidate.rateType || 'C2C',
                comments: match.statusComments || 'Submitted to requisition',
                rejectedReason: match.rejectedReason || ''
              })
            }
          }
        }
      } catch (e) {}
    })

    // 2. If candidate has explicit submission records or none found, provide structured history
    if (subs.length === 0) {
      // Default realistic submissions for demo candidate
      subs.push({
        reqId: '158938',
        reqTitle: 'VDOT Network Administrator 4 (807536)',
        client: 'State Of SC',
        status: candidate.status || 'Int-ApprovedByManager',
        assignedBy: candidate.recruiter || 'Vaibhav Bisen',
        assignedOn: 'Aug 26, 2026 10:30 AM',
        payRate: candidate.payRate || '$74 /hr',
        payRateType: candidate.rateType || 'C2C',
        comments: 'Rate verified and approved for state client submission.',
        rejectedReason: ''
      })
      if (candidate.id === '87534' || candName.includes('ashok')) {
        subs.push({
          reqId: '158766',
          reqTitle: 'Senior Cloud DevOps Engineer',
          client: 'State Of NC',
          status: 'Client-InterviewScheduled',
          assignedBy: 'Rahul Sharma',
          assignedOn: 'Aug 24, 2026 02:15 PM',
          payRate: '$72 /hr',
          payRateType: 'C2C',
          comments: 'Client technical round scheduled for Aug 29.',
          rejectedReason: ''
        })
      }
    }

    return subs
  }, [candidate, allJobs, userName])

  // Resume versions & update history
  const resumeVersions = useMemo(() => {
    if (Array.isArray(candidate.resumeVersions) && candidate.resumeVersions.length > 0) {
      return candidate.resumeVersions
    }
    // Default initial versions history
    return [
      {
        version: 'v2 (Current)',
        fileName: candidate.resumeName || `${candidate.name.replace(/\s+/g, '_')}_Resume_v2.pdf`,
        uploadedOn: 'Aug 26, 2026 11:40 AM',
        uploadedBy: candidate.addedByName || candidate.recruiter || userName,
        userRole: userRole,
        notes: 'Updated certifications, added Cisco CCIE Security & Azure Cloud Networking, formatted to client template.'
      },
      {
        version: 'v1 (Initial)',
        fileName: `${candidate.name.replace(/\s+/g, '_')}_Original.pdf`,
        uploadedOn: candidate.avblDate || 'Aug 20, 2026 09:15 AM',
        uploadedBy: 'Initial Sourcing Portal',
        userRole: 'recruiter',
        notes: 'Original resume parsed from Dice/LinkedIn candidate profile.'
      }
    ]
  }, [candidate, userName, userRole])

  // Handle uploading new resume version
  const handleUploadResumeVersion = (e) => {
    e.preventDefault()
    if (!newResumeFile) {
      alert('Please select a resume file (.pdf or .docx)')
      return
    }

    setIsUploading(true)
    setTimeout(() => {
      const versionNumber = (resumeVersions.length + 1)
      const newVersionEntry = {
        version: `v${versionNumber} (Current)`,
        fileName: newResumeFile.name,
        uploadedOn: new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
        uploadedBy: userName,
        userRole: userRole,
        notes: newResumeNotes || `Resume updated by ${userName}`
      }

      const updatedVersions = [newVersionEntry, ...resumeVersions.map(v => ({ ...v, version: v.version.replace(' (Current)', '') }))]

      if (onUpdateCandidate) {
        onUpdateCandidate({
          ...candidate,
          resumeName: newResumeFile.name,
          resumeVersions: updatedVersions,
          lastResumeUpdate: newVersionEntry.uploadedOn
        })
      }

      setIsUploading(false)
      setNewResumeFile(null)
      setNewResumeNotes('')
      setToastMsg(`✅ Resume updated to Version ${versionNumber} successfully!`)
      setActiveTab('resume_updates')
      setTimeout(() => setToastMsg(null), 4000)
    }, 600)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 11000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          border: '1px solid #94a3b8',
          overflow: 'hidden',
          fontFamily: 'Arial, Helvetica, sans-serif'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
          color: '#ffffff',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>👤</span>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#ffffff' }}>
                {candidate.name}
              </h3>
              <code style={{ background: 'rgba(255,255,255,0.15)', color: '#e0f2fe', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                ID #{candidate.id}
              </code>
              <span style={{ background: '#16a34a', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: 'bold' }}>
                {candidate.workAuth || 'US Citizen'}
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#93c5fd', marginTop: '3px' }}>
              Target Role: <strong>{candidate.fullRole || candidate.role || 'Consultant'}</strong> | Location: <strong>{candidate.location || candidate.city || 'Richmond, VA'}</strong> | Experience: <strong>{candidate.exp || '5+'} Years</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              fontSize: '20px',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div style={{ background: '#dcfce7', borderBottom: '1px solid #86efac', color: '#166534', padding: '8px 20px', fontSize: '12px', fontWeight: 'bold' }}>
            {toastMsg}
          </div>
        )}

        {/* Modal Navigation Subtabs */}
        <div style={{
          display: 'flex',
          background: '#f8fafc',
          borderBottom: '1px solid #cbd5e1',
          padding: '0 16px',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              background: activeTab === 'profile' ? '#ffffff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '3px solid #1e3a8a' : '3px solid transparent',
              color: activeTab === 'profile' ? '#1e3a8a' : '#64748b',
              fontWeight: 'bold',
              padding: '10px 16px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            👤 Profile & Resume Details
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            style={{
              background: activeTab === 'submissions' ? '#ffffff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'submissions' ? '3px solid #1e3a8a' : '3px solid transparent',
              color: activeTab === 'submissions' ? '#1e3a8a' : '#64748b',
              fontWeight: 'bold',
              padding: '10px 16px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📤 Submission History</span>
            <span style={{ background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px' }}>
              {submissionHistory.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resume_updates')}
            style={{
              background: activeTab === 'resume_updates' ? '#ffffff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'resume_updates' ? '3px solid #1e3a8a' : '3px solid transparent',
              color: activeTab === 'resume_updates' ? '#1e3a8a' : '#64748b',
              fontWeight: 'bold',
              padding: '10px 16px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📑 Resume Versions & Updates</span>
            <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px' }}>
              {resumeVersions.length} Updates
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('edit_resume')}
            style={{
              background: activeTab === 'edit_resume' ? '#ffffff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'edit_resume' ? '3px solid #ea580c' : '3px solid transparent',
              color: activeTab === 'edit_resume' ? '#ea580c' : '#64748b',
              fontWeight: 'bold',
              padding: '10px 16px',
              fontSize: '12px',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            ➕ Upload Updated Resume
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1, fontSize: '12px' }}>

          {/* ─── TAB 1: PROFILE & RESUME DETAILS ─── */}
          {activeTab === 'profile' && (
            <div>
              {/* Quick Info Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '12px 16px',
                marginBottom: '16px'
              }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Email Address</span>
                  <strong style={{ color: '#0f172a' }}>{candidate.email || 'ashok.g@smarthire.com'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Contact Phone</span>
                  <strong style={{ color: '#0f172a' }}>{candidate.phone || '804-555-0192'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Pay Rate & Type</span>
                  <strong style={{ color: '#166534' }}>{candidate.payRate || '$74 /hr'} ({candidate.rateType || candidate.payRateType || 'C2C'})</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Recruiter / Added By</span>
                  <strong style={{ color: '#0f172a' }}>{candidate.recruiter || candidate.addedByName || userName}</strong>
                </div>
              </div>

              {/* Skills */}
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#1e3a8a', display: 'block', marginBottom: '6px' }}>🔑 Verified Technical Skills:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(Array.isArray(candidate.skills) ? candidate.skills : (candidate.skills || 'Cisco Routing, BGP, OSPF, Azure ExpressRoute, Palo Alto Firewall, Python Automation').split(',')).map((sk, idx) => (
                    <span key={idx} style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                      {typeof sk === 'string' ? sk.trim() : sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Resume Text Box */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ background: '#f1f5f9', padding: '8px 14px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#334155' }}>
                    📄 Resume Document ({candidate.resumeName || `${candidate.name}_Resume.pdf`})
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Last Updated: {candidate.lastResumeUpdate || 'Aug 26, 2026'}
                  </span>
                </div>
                <div style={{
                  padding: '14px 16px',
                  background: '#ffffff',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '11.5px',
                  lineHeight: '1.6',
                  color: '#1e293b',
                  whiteSpace: 'pre-wrap'
                }}>
                  {candidate.resumeText || `CANDIDATE NAME: ${candidate.name}
TARGET POSITION: ${candidate.fullRole || candidate.role || 'Senior Consultant'}
EXPERIENCE LEVEL: ${candidate.exp || 14} Years Hands-on Industry Experience
LOCATION: ${candidate.location || 'Richmond, VA'} (Open to Hybrid / Relocation)
WORK AUTHORIZATION: ${candidate.workAuth || 'US Citizen'}
PAY RATE: ${candidate.payRate || '$74/hr'} (${candidate.rateType || 'C2C'})

PROFESSIONAL SUMMARY:
Accomplished technology specialist with extensive background in architecture design, enterprise systems integration, cloud migrations, and network engineering. Proven track record managing multi-tier vendor integrations, high-availability deployments, and compliance standards for state and commercial enterprise clients.

CORE TECHNICAL COMPETENCIES:
* Infrastructure: Cisco ASA, Nexus, Palo Alto Firewalls, F5 Load Balancers, SD-WAN
* Cloud & DevOps: Azure Networking, AWS VPC, Terraform, Docker, Python Automation
* Protocols & Routing: BGP, OSPF, MPLS, VPN, IPsec, QoS, TCP/IP Stack
* Certifications: Cisco Certified Internetwork Expert (CCIE), Azure Network Engineer Associate`}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 2: SUBMISSION HISTORY (कहा कहा submit हुआ) ─── */}
          {activeTab === 'submissions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>
                    📤 Requisition Submission Tracking
                  </h4>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b' }}>
                    Detailed records of every requisition position and client where <strong>{candidate.name}</strong> was submitted.
                  </p>
                </div>
                <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                  {submissionHistory.length} Active Submissions
                </span>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                      <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Req # & Position</th>
                      <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Client / Customer</th>
                      <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Submitted On</th>
                      <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Submitted By</th>
                      <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Proposed Rate</th>
                      <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Hiring Status</th>
                      <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Notes / Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissionHistory.map((sub, idx) => {
                      let statusBg = '#dbeafe'
                      let statusColor = '#1e40af'
                      if (sub.status.includes('Approved') || sub.status === 'Placed') {
                        statusBg = '#dcfce7'
                        statusColor = '#166534'
                      } else if (sub.status.includes('Rejected')) {
                        statusBg = '#fee2e2'
                        statusColor = '#991b1b'
                      } else if (sub.status.includes('Interview')) {
                        statusBg = '#e0f2fe'
                        statusColor = '#0369a1'
                      }

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ padding: '8px 10px' }}>
                            <strong style={{ color: '#0f172a', display: 'block' }}>Req #{sub.reqId}</strong>
                            <span style={{ fontSize: '11px', color: '#475569' }}>{sub.reqTitle}</span>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ background: '#eff6ff', color: '#1e40af', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold', fontSize: '10.5px' }}>
                              {sub.client}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', color: '#475569', whiteSpace: 'nowrap' }}>
                            {sub.assignedOn}
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#0f172a' }}>
                            {sub.assignedBy}
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#166534' }}>
                            {sub.payRate} ({sub.payRateType})
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ background: statusBg, color: statusColor, padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10.5px', display: 'inline-block' }}>
                              {sub.status}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', color: '#334155', maxWidth: '200px' }}>
                            {sub.comments}
                            {sub.rejectedReason && (
                              <div style={{ color: '#dc2626', fontWeight: 'bold', marginTop: '2px', fontSize: '10.5px' }}>
                                Reason: {sub.rejectedReason}
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── TAB 3: RESUME VERSIONS & UPDATES (कितने बार resume update किया) ─── */}
          {activeTab === 'resume_updates' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>
                    📑 Resume Version & Revision History
                  </h4>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b' }}>
                    Complete audit of how many times this candidate's resume was edited, re-uploaded, and customized for clients.
                  </p>
                </div>
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '4px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11.5px' }}>
                  📊 Total Updates: {resumeVersions.length} Versions Recorded
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {resumeVersions.map((ver, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#ffffff',
                      border: idx === 0 ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                      borderLeft: idx === 0 ? '4px solid #3b82f6' : '4px solid #94a3b8',
                      borderRadius: '6px',
                      padding: '12px 16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: idx === 0 ? '#eff6ff' : '#f1f5f9',
                          color: idx === 0 ? '#1d4ed8' : '#475569',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          fontSize: '11px'
                        }}>
                          {ver.version}
                        </span>
                        <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>{ver.fileName}</strong>
                      </div>

                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        🕒 Uploaded on: <strong>{ver.uploadedOn}</strong>
                      </div>
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#334155', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>👤 Updated By:</span> {ver.uploadedBy} ({ver.userRole})
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', padding: '6px 10px', borderRadius: '4px', fontSize: '11.5px', color: '#475569' }}>
                      <span style={{ fontWeight: 'bold' }}>📝 Revision Notes:</span> {ver.notes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── TAB 4: EDIT / UPLOAD UPDATED RESUME ─── */}
          {activeTab === 'edit_resume' && (
            <form onSubmit={handleUploadResumeVersion} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '18px 20px' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#1e3a8a', fontWeight: 'bold' }}>
                ➕ Upload Updated Candidate Resume (Version {resumeVersions.length + 1})
              </h4>
              <p style={{ margin: '0 0 14px', fontSize: '11.5px', color: '#64748b' }}>
                Upload the latest revised resume file. The system will record this update in the version audit log.
              </p>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                  Select Word or PDF Resume File *
                </label>
                <input
                  type="file"
                  required
                  accept=".doc,.docx,.pdf"
                  onChange={e => setNewResumeFile(e.target.files[0])}
                  style={{ width: '100%', padding: '8px', border: '1px dashed #3b82f6', background: '#ffffff', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                  Update Notes / Revision Details *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Added AWS Solution Architect certification, updated rates to $74/hr, formatted client blind profile."
                  value={newResumeNotes}
                  onChange={e => setNewResumeNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('resume_updates')}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  style={{ background: '#ea580c', color: '#ffffff', border: 'none', padding: '6px 20px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(234, 88, 12, 0.4)' }}
                >
                  {isUploading ? '⏳ Uploading...' : '💾 Save & Record Resume Update'}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            SmartWorks Talent System — Candidate ID: #{candidate.id}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#1e3a8a', color: '#ffffff', border: 'none', padding: '6px 18px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
