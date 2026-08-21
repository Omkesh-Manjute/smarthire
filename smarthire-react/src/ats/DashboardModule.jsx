import React, { useState, useEffect, useMemo } from 'react'

function getFullDescriptionText(job) {
  if (!job) return ''
  const raw = job.rawDescription || job.fullDescription || job.rawText || job.details || job.rawJd
  if (raw && raw.length > 50) return raw

  if (job.description && job.description.length > 50 && !job.description.startsWith('Looking for a')) {
    return job.description
  }

  const reqSkills = Array.isArray(job.skills) && job.skills.length > 0
    ? job.skills.join(', ')
    : 'Technical leadership, architectural design, cloud deployments'

  const prefSkills = Array.isArray(job.preferredSkills) && job.preferredSkills.length > 0
    ? job.preferredSkills.join(', ')
    : Array.isArray(job.preferred_skills) && job.preferred_skills.length > 0
    ? job.preferred_skills.join(', ')
    : 'PMP Certification, Bachelors Degree in IT Related Field, Agile / Scrum Delivery'

  const expText = job.experience && job.experience !== 'TBD' && job.experience !== 'Any'
    ? job.experience
    : '5+ years'

  const locText = job.location || 'Columbia, SC'
  const modeText = job.work_mode || job.workMode || 'Hybrid'
  const deadlineText = job.deadline || '08/28 at 5:00 PM EST'

  return `Start date :${job.creationDate || '10/23/2026'}\nEnd Date   :${job.duration || '12 Months from projected start date'}\n\nSubmission deadline :${deadlineText}\n\nClient Info : ${job.client || 'ADMIN'}\n\nNote:\n* Interview Process: 1 round, Virtual/Online\n* Work Location: ${modeText} - schedule will be determined by the hiring manager after the start date.\n* Candidate Location: ${locText}\n\nRequired Skills & Experience:\n* Experience: ${expText}\n* Core Skills: ${reqSkills}\n* Certifications & Preferred: ${prefSkills}`
}

function DashboardModule({
  totalCandidates = 0, liveCount = 0, activeJobs = 0, qualified = 0, newCandidates = 0, pendingRtr = 0,
  allCandidates = [], liveCandidates = [], jobsList = [], apiOnline = false, submissions = [], isSuperAdmin = true
}) {
  const [selectedReq, setSelectedReq] = useState(null)
  const [activeReqTab, setActiveReqTab] = useState('details')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editingFields, setEditingFields] = useState({})

  // Assign Recruiters State
  const [availableRecruiters, setAvailableRecruiters] = useState([
    'Admin Blr', 'AI Agent', 'Ajay Arya', 'Anand Krishnamurthy', 'Deepak Joshi', 'Nitin Bhosale', 'Rahul Sharma', 'Priya Verma'
  ])
  const [assignedRecruiters, setAssignedRecruiters] = useState(['Vaibhav Bisen'])
  const [selectedAvailable, setSelectedAvailable] = useState([])
  const [selectedAssigned, setSelectedAssigned] = useState([])
  const [emailOption, setEmailOption] = useState('none')

  // Attachments State
  const [attachments, setAttachments] = useState([
    { id: 1, title: '13285 - Admin - 158938', filename: '13285 - Admin - 158938.docx' },
    { id: 2, title: 'SCMSP_Candidate_Cover_Sheet - 158938', filename: 'SCMSP_Candidate_Cover_Sheet - 158938.docx' },
    { id: 3, title: 'SSN References - 158938', filename: 'SSN References - 158938.doc' },
    { id: 4, title: 'Right_to_Represent_SOSC - 158938', filename: 'Right_to_Represent_SOSC - 158938.pdf' },
  ])
  const [showAddAttachment, setShowAddAttachment] = useState(false)
  const [newAttachmentTitle, setNewAttachmentTitle] = useState('')
  const [newAttachmentFile, setNewAttachmentFile] = useState(null)

  // Potential Candidates State
  const [potentialCandidates, setPotentialCandidates] = useState([
    {
      id: 'PC-1',
      name: 'Kashyap K Vora',
      payRate: '55/hr',
      payRateType: 'W2',
      assignedBy: 'Vaibhav',
      assignedOn: 'Aug 20, 2026 06:41 PM',
      status: 'Int-SubmittedToManager',
      statusComments: 'Submitted',
      interview: 'Select',
      rejectedReason: ''
    },
    {
      id: 'PC-2',
      name: 'Ashok Ankalla',
      payRate: '70/hr',
      payRateType: 'C2C',
      assignedBy: 'Prudhvi',
      assignedOn: 'Aug 20, 2026 04:40 PM',
      status: 'Int-SubmittedToManager',
      statusComments: 'Submitted',
      interview: 'Select',
      rejectedReason: ''
    }
  ])

  const safeCandidates = Array.isArray(allCandidates) ? allCandidates : []
  const safeJobs = Array.isArray(jobsList) ? jobsList : []

  const handleOpenReq = (job) => {
    setSelectedReq(job)
    setActiveReqTab('details')
    const fullDesc = getFullDescriptionText(job)
    setEditingFields({
      title: job.title || '',
      startDate: job.creationDate || '10/23/2026',
      duration: job.duration || '12',
      durationUnit: 'months',
      customer: job.client || 'State Of SC',
      endClient: job.client || 'State Of SC',
      contact: job.contact || 'Hustedt Lexi',
      numPositions: job.numPositions || '1',
      deadline: job.deadline || '8/28/2026',
      maxSubmissions: job.maxSubmissions || '2',
      category: job.category || 'SP',
      type: job.type || 'Contract',
      address: job.address || '4430 Broad Rd.',
      city: job.city || 'Columbia',
      state: job.state || 'SC',
      zip: job.zip || '29210',
      location: job.location || 'Columbia, SC 29210',
      billRate: job.billRate || '90',
      payRate: job.budget ? job.budget.replace(/[^0-9]/g, '').slice(0, 3) || '75' : '75',
      interview: 'Select',
      workAuth: 'Select',
      subcontractable: 'No',
      employmentType: 'Contract',
      experience: job.experience ? (job.experience.replace(/[^0-9]/g, '') || '5') : '5',
      description: fullDesc,
      skills: Array.isArray(job.skills) ? job.skills : ['PMP Certification', 'Bachelors Degree In An IT Related Field', 'Project Management'],
      desiredSkills: Array.isArray(job.preferredSkills) ? job.preferredSkills : ['Cloud Security', 'Public Sector Experience'],
      status: job.status === 'Active' ? 'In-Progress' : (job.status || 'In-Progress'),
      keyReq: false,
      working: true,
      hotReq: false,
      incumbentVendor: false
    })
  }

  const handleSaveRequisition = (e) => {
    e.preventDefault()
    alert(`💾 Requisition #${selectedReq.id} saved successfully!`)
    setSelectedReq(null)
  }

  const handleAssignToSelected = () => {
    if (selectedAvailable.length === 0) return
    setAssignedRecruiters(prev => [...prev, ...selectedAvailable])
    setAvailableRecruiters(prev => prev.filter(r => !selectedAvailable.includes(r)))
    setSelectedAvailable([])
  }

  const handleUnassignSelected = () => {
    if (selectedAssigned.length === 0) return
    setAvailableRecruiters(prev => [...prev, ...selectedAssigned])
    setAssignedRecruiters(prev => prev.filter(r => !selectedAssigned.includes(r)))
    setSelectedAssigned([])
  }

  const handleAddAttachment = (e) => {
    e.preventDefault()
    if (!newAttachmentTitle.trim() && !newAttachmentFile) {
      alert('Please provide an attachment title or file.')
      return
    }
    const name = newAttachmentFile ? newAttachmentFile.name : `${newAttachmentTitle}.docx`
    setAttachments(prev => [
      ...prev,
      { id: Date.now(), title: newAttachmentTitle || name, filename: name }
    ])
    setNewAttachmentTitle('')
    setNewAttachmentFile(null)
    setShowAddAttachment(false)
    alert('✅ Document attached successfully!')
  }

  const handleDeleteAttachment = (id) => {
    if (window.confirm('Delete this attachment?')) {
      setAttachments(prev => prev.filter(a => a.id !== id))
    }
  }

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return safeJobs.slice(start, start + pageSize)
  }, [safeJobs, currentPage, pageSize])

  const totalPages = Math.ceil(safeJobs.length / pageSize) || 1

  return (
    <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px 20px', fontFamily: 'Arial, sans-serif' }}>
      
      {/* ─────────────────────────────────────────────────────────────
          VIEW 1: SINGLE REQUISITION DETAIL / EDIT SHEET (IMAGES 1, 3, 4, 5)
          ───────────────────────────────────────────────────────────── */}
      {selectedReq ? (
        <div>
          {/* Breadcrumb path */}
          <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '10px' }}>
            You are here: <span style={{ color: '#0066cc', cursor: 'pointer' }} onClick={() => setSelectedReq(null)}>Home</span> &gt; Requisitions &gt; Edit Requisition
          </div>

          {/* Title Bar with Status & Action Links */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ea580c', paddingBottom: '6px', marginBottom: '14px', flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: '16px', color: '#1e3a8a', fontWeight: 'bold' }}>
              Requisition #:{selectedReq.id.replace('J-', '')} <span style={{ color: '#dc2626', fontSize: '12.5px', marginLeft: '8px' }}>Status: Ready</span>
            </h2>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 'bold' }}>
              <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => alert('Job posted to JobsInHand successfully!')}>
                Post To JobsInHand
              </span>
              <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => alert('Opening Mass E-mail Dispatcher...')}>
                Mass E-mail
              </span>
              <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setSelectedReq(null)}>
                &lt;&lt; Back To Search Results
              </span>
            </div>
          </div>

          {/* Top 3-Column Header Form (Image 1) */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '4px', marginBottom: '14px',
            display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px 18px', fontSize: '11.5px'
          }}>
            {/* Column 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px 8px', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>Position Title:*</label>
              <input type="text" value={editingFields.title || ''} onChange={e => setEditingFields({ ...editingFields, title: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />

              <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>Start Date:*</label>
              <input type="text" value={editingFields.startDate || ''} onChange={e => setEditingFields({ ...editingFields, startDate: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />

              <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>Duration:*</label>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input type="text" value={editingFields.duration || '12'} onChange={e => setEditingFields({ ...editingFields, duration: e.target.value })} style={{ width: '45px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />
                <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>months</span>
              </div>

              <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}># of Positions:*</label>
              <input type="text" value={editingFields.numPositions || '1'} onChange={e => setEditingFields({ ...editingFields, numPositions: e.target.value })} style={{ width: '45px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />

              <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>Max Submission:*</label>
              <input type="text" value={editingFields.maxSubmissions || '2'} onChange={e => setEditingFields({ ...editingFields, maxSubmissions: e.target.value })} style={{ width: '45px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />
            </div>

            {/* Column 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px 8px', alignItems: 'center' }}>
              <div style={{ visibility: 'hidden' }}>spacer</div>
              <div style={{ visibility: 'hidden' }}>spacer</div>

              <label style={{ fontWeight: 'bold', color: '#0066cc', textAlign: 'right', textDecoration: 'underline', cursor: 'pointer' }}>Customer:</label>
              <select value={editingFields.customer || ''} onChange={e => setEditingFields({ ...editingFields, customer: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                <option>State Of SC</option>
                <option>DFA</option>
                <option>DBHDS</option>
                <option>VDOT</option>
                <option>Acme Corp</option>
              </select>

              <label style={{ fontWeight: 'bold', color: '#0066cc', textAlign: 'right', textDecoration: 'underline', cursor: 'pointer' }}>Contact:</label>
              <select value={editingFields.contact || ''} onChange={e => setEditingFields({ ...editingFields, contact: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                <option>Hustedt Lexi</option>
                <option>Miller Sarah</option>
                <option>Johnson Dave</option>
              </select>

              <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>Submission Deadline:*</label>
              <input type="text" value={editingFields.deadline || ''} onChange={e => setEditingFields({ ...editingFields, deadline: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />

              <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>Req Category:*</label>
              <select value={editingFields.category || 'SP'} onChange={e => setEditingFields({ ...editingFields, category: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                <option>SP</option>
                <option>IT</option>
                <option>ENG</option>
              </select>
            </div>

            {/* Column 3 */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px 8px', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>Status:</label>
              <select value={editingFields.status || 'In-Progress'} onChange={e => setEditingFields({ ...editingFields, status: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                <option>In-Progress</option>
                <option>Ready</option>
                <option>Closed</option>
              </select>

              <label style={{ fontWeight: 'bold', color: '#0066cc', textAlign: 'right', textDecoration: 'underline', cursor: 'pointer' }}>End Client:</label>
              <select value={editingFields.endClient || ''} onChange={e => setEditingFields({ ...editingFields, endClient: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                <option>State Of SC</option>
                <option>DFA</option>
                <option>DBHDS</option>
              </select>

              <label style={{ fontWeight: 'bold', color: '#0066cc', textAlign: 'right', textDecoration: 'underline', cursor: 'pointer' }}>Contact:</label>
              <select value={editingFields.contact || ''} onChange={e => setEditingFields({ ...editingFields, contact: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                <option>Hustedt Lexi</option>
              </select>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold' }}>
                  <input type="checkbox" checked={editingFields.keyReq || false} onChange={e => setEditingFields({ ...editingFields, keyReq: e.target.checked })} /> Key Req
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold' }}>
                  <input type="checkbox" checked={editingFields.working || true} onChange={e => setEditingFields({ ...editingFields, working: e.target.checked })} /> Working
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold' }}>
                  <input type="checkbox" checked={editingFields.hotReq || false} onChange={e => setEditingFields({ ...editingFields, hotReq: e.target.checked })} /> Hot Req
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold' }}>
                  <input type="checkbox" checked={editingFields.incumbentVendor || false} onChange={e => setEditingFields({ ...editingFields, incumbentVendor: e.target.checked })} /> Incumbent Vendor
                </label>
              </div>

              <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right' }}>Req Type:*</label>
              <select value={editingFields.type || 'Contract'} onChange={e => setEditingFields({ ...editingFields, type: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                <option>Contract</option>
                <option>Full-Time</option>
                <option>C2H</option>
              </select>
            </div>
          </div>

          {/* ═══════════ SUB-TAB STRIP ═══════════ */}
          <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', background: '#e2e8f0', padding: '4px 8px 0', gap: '2px' }}>
            {[
              { id: 'details', label: 'Details' },
              { id: 'assign', label: 'Assign to Recruiters' },
              { id: 'potential', label: `Potential Candidates (${potentialCandidates.length})` },
              { id: 'attachments', label: `Attachments (${attachments.length})` },
              { id: 'newCandidates', label: 'New Candidates (0)' }
            ].map(tab => (
              <div
                key={tab.id}
                onClick={() => setActiveReqTab(tab.id)}
                style={{
                  padding: '6px 14px', fontSize: '11.5px', fontWeight: 'bold', borderRadius: '4px 4px 0 0',
                  background: activeReqTab === tab.id ? '#ffffff' : '#f1f5f9',
                  border: activeReqTab === tab.id ? '1px solid #cbd5e1' : '1px solid transparent',
                  borderBottom: activeReqTab === tab.id ? '1px solid #ffffff' : 'none',
                  color: activeReqTab === tab.id ? '#0f172a' : '#475569',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </div>
            ))}
          </div>

          {/* ═══════════ TAB PANEL CONTENT ═══════════ */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: 'none', padding: '16px 20px', minHeight: '340px' }}>
            
            {/* ─── TAB 1: DETAILS (Image 1) ─── */}
            {activeReqTab === 'details' && (
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {/* Left Form Attributes */}
                <div style={{ flex: '1 1 420px', display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px 10px', alignContent: 'start', fontSize: '11.5px' }}>
                  
                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Location Address:</label>
                  <input type="text" value={editingFields.address || ''} onChange={e => setEditingFields({ ...editingFields, address: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />

                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>City*, State*, Zip*:</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" value={editingFields.city || 'Columbia'} onChange={e => setEditingFields({ ...editingFields, city: e.target.value })} style={{ flex: 2, padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />
                    <select value={editingFields.state || 'SC'} onChange={e => setEditingFields({ ...editingFields, state: e.target.value })} style={{ flex: 1, padding: '3px 4px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                      <option>SC</option>
                      <option>VA</option>
                      <option>TX</option>
                      <option>NC</option>
                      <option>GA</option>
                      <option>FL</option>
                    </select>
                    <input type="text" value={editingFields.zip || '29210'} onChange={e => setEditingFields({ ...editingFields, zip: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />
                  </div>

                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Bill Rate:</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" value={editingFields.billRate || '90'} onChange={e => setEditingFields({ ...editingFields, billRate: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />
                    <select style={{ padding: '3px 4px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                      <option>Select</option>
                      <option>Hourly</option>
                      <option>Annual</option>
                    </select>
                  </div>

                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Pay Rate:</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" value={editingFields.payRate || '75'} onChange={e => setEditingFields({ ...editingFields, payRate: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />
                    <select style={{ padding: '3px 4px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                      <option>Select</option>
                      <option>Hourly</option>
                      <option>Annual</option>
                    </select>
                  </div>

                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Interview:</label>
                  <select value={editingFields.interview || 'Select'} onChange={e => setEditingFields({ ...editingFields, interview: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                    <option>Select</option>
                    <option>1 Round Virtual/Online</option>
                    <option>In-Person Interview</option>
                  </select>

                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Work Authorization:</label>
                  <select value={editingFields.workAuth || 'Select'} onChange={e => setEditingFields({ ...editingFields, workAuth: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                    <option>Select</option>
                    <option>US Citizen</option>
                    <option>Green Card</option>
                    <option>H1B / All eligible</option>
                  </select>

                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Subcontractable:*</label>
                  <select value={editingFields.subcontractable || 'No'} onChange={e => setEditingFields({ ...editingFields, subcontractable: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                    <option>No</option>
                    <option>Yes</option>
                  </select>

                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Employment Type:</label>
                  <select value={editingFields.employmentType || 'Contract'} onChange={e => setEditingFields({ ...editingFields, employmentType: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                    <option>Contract</option>
                    <option>Permanent</option>
                    <option>C2H</option>
                  </select>

                  <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Experience:*</label>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input type="text" value={editingFields.experience || '5'} onChange={e => setEditingFields({ ...editingFields, experience: e.target.value })} style={{ width: '45px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />
                    <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>years</span>
                  </div>
                </div>

                {/* Right Form: Scraped Description Textarea & Skills Bullet Points */}
                <div style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a' }}>Description:*</label>
                      <span style={{ fontSize: '13px', cursor: 'pointer' }} title="Formatted Description View">🖨️</span>
                    </div>
                    <textarea
                      rows={11}
                      value={editingFields.description || ''}
                      onChange={e => setEditingFields({ ...editingFields, description: e.target.value })}
                      style={{
                        width: '100%', padding: '8px', fontSize: '11.5px', lineHeight: '1.6',
                        border: '1px solid #cbd5e1', borderRadius: '2px', fontFamily: 'monospace',
                        background: '#fafafa', resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {/* Required Skills */}
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>Required Skills:*</label>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: '#0066cc', fontWeight: 'bold', lineHeight: '1.6' }}>
                        {Array.isArray(editingFields.skills) && editingFields.skills.map((s, idx) => (
                          <li key={idx}><span style={{ color: '#1e3a8a' }}>{s}</span></li>
                        ))}
                      </ul>
                    </div>

                    {/* Desired Skills */}
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>Desired Skills:</label>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: '#0066cc', fontWeight: 'bold', lineHeight: '1.6' }}>
                        {Array.isArray(editingFields.desiredSkills) && editingFields.desiredSkills.map((s, idx) => (
                          <li key={idx}><span style={{ color: '#1e3a8a' }}>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 2: ASSIGN TO RECRUITERS (Image 3) ─── */}
            {activeReqTab === 'assign' && (
              <div style={{ fontSize: '11.5px' }}>
                <div style={{ fontWeight: 'bold', color: '#1e3a8a', marginBottom: '10px' }}>
                  Select vendors to send the new Requisition
                </div>

                {/* Dual Listbox Selector */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                  <select
                    multiple
                    size={6}
                    value={selectedAvailable}
                    onChange={e => setSelectedAvailable(Array.from(e.target.selectedOptions, o => o.value))}
                    style={{ width: '220px', height: '120px', border: '1px solid #cbd5e1', padding: '4px', fontSize: '11.5px' }}
                  >
                    {availableRecruiters.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={handleAssignToSelected}
                      style={{ padding: '3px 12px', fontSize: '11px', fontWeight: 'bold', background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                    >
                      &gt;&gt;
                    </button>
                    <button
                      type="button"
                      onClick={handleUnassignSelected}
                      style={{ padding: '3px 12px', fontSize: '11px', fontWeight: 'bold', background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                    >
                      &lt;&lt;
                    </button>
                  </div>

                  <select
                    multiple
                    size={6}
                    value={selectedAssigned}
                    onChange={e => setSelectedAssigned(Array.from(e.target.selectedOptions, o => o.value))}
                    style={{ width: '220px', height: '120px', border: '1px solid #cbd5e1', padding: '4px', fontSize: '11.5px' }}
                  >
                    {assignedRecruiters.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Email Body Textarea */}
                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '8px', marginBottom: '14px' }}>
                  <label style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Email Body:</label>
                  <textarea
                    rows={5}
                    defaultValue={`A requisition has been assigned to you with the below details:\nhttp://portal.smarthire.com/Web/Requisition.aspx?id=${selectedReq.id.replace('J-', '')}\n\nReq#:${selectedReq.id.replace('J-', '')}   Position Title:${editingFields.title}\nStart Date:${editingFields.startDate}   Duration:${editingFields.duration} months`}
                    style={{ width: '100%', maxWidth: '620px', padding: '6px', fontSize: '11.5px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}
                  />
                </div>

                {/* Send Email Radio Options */}
                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '8px' }}>
                  <label style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Send Email:</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="radio" name="sendEmail" checked={emailOption === 'none'} onChange={() => setEmailOption('none')} />
                      Do not send E-mail when I click save.
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="radio" name="sendEmail" checked={emailOption === 'new'} onChange={() => setEmailOption('new')} />
                      Send E-mail to newly assigned recruiters/vendors when I click save.
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="radio" name="sendEmail" checked={emailOption === 'all'} onChange={() => setEmailOption('all')} />
                      Send E-mail to all assigned recruiters/vendors when I click save.
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 3: POTENTIAL CANDIDATES (Image 4) ─── */}
            {activeReqTab === 'potential' && (
              <div style={{ fontSize: '11.5px' }}>
                <div style={{ fontWeight: 'bold', color: '#1e3a8a', marginBottom: '10px' }}>
                  Candidates available for this view:
                </div>

                <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#94a3b8', color: '#ffffff' }}>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Name</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Pay Rate</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Pay Rate Type</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Assigned By</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Assigned On</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Status</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Status Comments</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Schedule Interview</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Rejected Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {potentialCandidates.map((pc, idx) => (
                        <tr key={pc.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>
                            <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>{pc.name}</span>
                          </td>
                          <td style={{ padding: '6px 8px' }}>{pc.payRate}</td>
                          <td style={{ padding: '6px 8px' }}>{pc.payRateType}</td>
                          <td style={{ padding: '6px 8px' }}>
                            <span style={{ color: '#0066cc', cursor: 'pointer' }}>{pc.assignedBy}</span>
                          </td>
                          <td style={{ padding: '6px 8px', color: '#475569' }}>{pc.assignedOn}</td>
                          <td style={{ padding: '6px 8px' }}>
                            <select defaultValue={pc.status} style={{ fontSize: '11px', padding: '2px 4px', border: '1px solid #cbd5e1' }}>
                              <option value="Int-SubmittedToManager">Int-SubmittedToManager</option>
                              <option value="Shortlisted">Shortlisted</option>
                              <option value="Interview-Scheduled">Interview-Scheduled</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input type="text" defaultValue={pc.statusComments} style={{ fontSize: '11px', padding: '2px 4px', width: '90px', border: '1px solid #cbd5e1' }} />
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <select defaultValue="Select" style={{ fontSize: '11px', padding: '2px 4px', border: '1px solid #cbd5e1' }}>
                              <option>Select</option>
                              <option>Round 1 Technical</option>
                              <option>Client Manager Round</option>
                            </select>
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input type="text" defaultValue={pc.rejectedReason} placeholder="—" style={{ fontSize: '11px', padding: '2px 4px', width: '80px', border: '1px solid #cbd5e1' }} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <span
                    onClick={() => {
                      const name = prompt('Enter Candidate Name to link to this Requisition:')
                      if (name) {
                        setPotentialCandidates(prev => [
                          ...prev,
                          {
                            id: 'PC-' + Date.now(),
                            name: name,
                            payRate: '65/hr',
                            payRateType: 'W2',
                            assignedBy: 'Recruiter',
                            assignedOn: new Date().toLocaleString(),
                            status: 'Int-SubmittedToManager',
                            statusComments: 'Submitted',
                            interview: 'Select',
                            rejectedReason: ''
                          }
                        ])
                      }
                    }}
                    style={{ color: '#0066cc', fontWeight: 'bold', fontSize: '11.5px', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Select Candidate
                  </span>
                </div>
              </div>
            )}

            {/* ─── TAB 4: ATTACHMENTS (Image 5) ─── */}
            {activeReqTab === 'attachments' && (
              <div style={{ fontSize: '11.5px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <span
                    onClick={() => setShowAddAttachment(prev => !prev)}
                    style={{ color: '#0066cc', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Add New Attachment
                  </span>
                </div>

                <div style={{ maxWidth: '580px', marginBottom: '18px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                    <tbody>
                      {attachments.map((att, idx) => (
                        <tr key={att.id} style={{ background: idx % 2 === 0 ? '#f8fafc' : '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px 10px', color: '#1e293b' }}>{att.title}</td>
                          <td style={{ padding: '6px 10px' }}>
                            <span style={{ color: '#0066cc', textDecoration: 'underline', cursor: 'pointer' }}>
                              {att.filename}
                            </span>
                          </td>
                          <td style={{ padding: '6px 10px', width: '50px', textAlign: 'right' }}>
                            <span style={{ cursor: 'pointer', marginRight: '8px' }} title="Edit">✏️</span>
                            <span onClick={() => handleDeleteAttachment(att.id)} style={{ color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }} title="Delete">❌</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {showAddAttachment && (
                  <form onSubmit={handleAddAttachment} style={{ border: '1px solid #60a5fa', background: '#eff6ff', padding: '14px 18px', maxWidth: '540px', borderRadius: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Attach New Document</span>
                      <span onClick={() => setShowAddAttachment(false)} style={{ cursor: 'pointer', fontWeight: 'bold', color: '#1e3a8a' }}>X</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px 10px', alignItems: 'center', marginBottom: '12px' }}>
                      <label style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Attachment :</label>
                      <input type="file" onChange={e => setNewAttachmentFile(e.target.files[0])} style={{ fontSize: '11px' }} />

                      <label style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Title :</label>
                      <input type="text" value={newAttachmentTitle} onChange={e => setNewAttachmentTitle(e.target.value)} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} placeholder="Document Title" />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" style={{ background: '#e2e8f0', border: '1px solid #94a3b8', padding: '3px 14px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Save
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ─── TAB 5: NEW CANDIDATES ─── */}
            {activeReqTab === 'newCandidates' && (
              <div style={{ fontSize: '11.5px', color: '#475569', padding: '20px 0' }}>
                <div style={{ fontWeight: 'bold', color: '#1e3a8a', marginBottom: '8px' }}>
                  New Unscreened Applicants (0)
                </div>
                <p>No new unprocessed candidate applications found for Requisition #{selectedReq.id.replace('J-', '')}.</p>
              </div>
            )}

          </div>

          {/* Created by info bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderTop: 'none', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>
            <span>Created by: sharif on: 8/20/2026 2:31:19 PM</span>
            <span>Last Updated by: vaibhav on: {new Date().toLocaleDateString()}</span>
          </div>

          {/* Submit / Save Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
            <button
              type="button"
              onClick={handleSaveRequisition}
              style={{
                background: '#e2e8f0', color: '#0f172a', border: '1px solid #94a3b8',
                padding: '4px 20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              Save
            </button>
          </div>

        </div>
      ) : (

        /* ─────────────────────────────────────────────────────────────
            VIEW 2: ALL OPEN REQUISITIONS LIST VIEW (IMAGES 1 & 2)
            ───────────────────────────────────────────────────────────── */
        <div>
          {/* Breadcrumb path */}
          <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '8px' }}>
            You are here: Home
          </div>

          {/* Welcome Header */}
          <h2 style={{ margin: '0 0 2px', fontSize: '15px', color: '#16a34a', fontWeight: 'bold' }}>
            SmartHire Recruitment Portal Home
          </h2>
          <div style={{ fontSize: '12px', color: '#334155', fontWeight: 'bold', marginBottom: '14px' }}>
            Welcome back to SmartWorks. You have {safeJobs.length} tasks.
          </div>

          {/* All Open Requisitions Header Banner */}
          <div style={{
            background: '#bfdbfe', border: '1px solid #93c5fd', padding: '6px 12px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderRadius: '3px 3px 0 0'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a' }}>All Open Requisitions</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a' }}>
              (Requisitions {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, safeJobs.length)} of {safeJobs.length})
            </span>
          </div>

          {/* Open Requisitions Table List */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#94a3b8', color: '#ffffff', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Req#</th>
                  <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Position</th>
                  <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Skills</th>
                  <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Customer</th>
                  <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Location</th>
                  <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Deadline</th>
                  <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Pay Rate</th>
                  <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Recruiters</th>
                  <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Status</th>
                  <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Req Ctg</th>
                  <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Req Type</th>
                  <th style={{ padding: '7px 9px', fontWeight: 'bold' }}>Duration</th>
                  <th style={{ padding: '7px 5px', fontWeight: 'bold', textAlign: 'center' }}>W</th>
                  <th style={{ padding: '7px 5px', fontWeight: 'bold', textAlign: 'center' }}>K</th>
                  <th style={{ padding: '7px 5px', fontWeight: 'bold', textAlign: 'center' }}>Cont</th>
                </tr>
              </thead>
              <tbody>
                {paginatedJobs.length === 0 ? (
                  <tr>
                    <td colSpan="15" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                      No open requisitions found.
                    </td>
                  </tr>
                ) : (
                  paginatedJobs.map((job, idx) => (
                    <tr key={job.id} style={{
                      background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      {/* Req# clickable link */}
                      <td style={{ padding: '7px 9px', fontWeight: 'bold' }}>
                        <span onClick={() => handleOpenReq(job)} style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>
                          {job.id.replace('J-', '')}
                        </span>
                      </td>
                      {/* Position clickable link */}
                      <td style={{ padding: '7px 9px', fontWeight: 'bold' }}>
                        <span onClick={() => handleOpenReq(job)} style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>
                          {job.title}
                        </span>
                      </td>
                      <td style={{ padding: '7px 9px', color: '#475569' }}>
                        {Array.isArray(job.skills) ? job.skills.slice(0, 3).join(', ') : ''}
                      </td>
                      <td style={{ padding: '7px 9px', color: '#475569' }}>{job.client || 'State Of SC'}</td>
                      <td style={{ padding: '7px 9px', color: '#475569' }}>{job.location || 'Columbia, SC'}</td>
                      <td style={{ padding: '7px 9px', color: '#e11d48', fontWeight: 'bold' }}>{job.deadline || 'Aug 28, 2026'}</td>
                      <td style={{ padding: '7px 9px', color: '#475569' }}>{job.budget || '75/hr'}</td>
                      <td style={{ padding: '7px 9px', color: '#475569' }}>{job.postedByName || 'VaibhavB...'}</td>
                      <td style={{ padding: '7px 9px', color: '#16a34a', fontWeight: 'bold' }}>{job.status === 'Active' ? 'In-Progress' : (job.status || 'In-Progress')}</td>
                      <td style={{ padding: '7px 9px', color: '#475569' }}>SP</td>
                      <td style={{ padding: '7px 9px', color: '#475569' }}>{job.type || 'Contract'}</td>
                      <td style={{ padding: '7px 9px', color: '#475569' }}>{job.duration || '12'}</td>
                      {/* Checkbox indicators */}
                      <td style={{ padding: '7px 5px', textAlign: 'center' }}>
                        <input type="checkbox" readOnly checked={false} />
                      </td>
                      <td style={{ padding: '7px 5px', textAlign: 'center' }}>
                        <input type="checkbox" readOnly checked={false} />
                      </td>
                      <td style={{ padding: '7px 5px', textAlign: 'center' }}>
                        <input type="checkbox" readOnly checked={idx % 2 === 1} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls matches Image 2 */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderTop: '1px solid #cbd5e1', paddingTop: '10px', marginTop: '10px'
          }}>
            {/* Numbers list */}
            <div style={{ display: 'flex', gap: '10px', fontSize: '12px', fontWeight: 'bold' }}>
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1
                return (
                  <span key={p} onClick={() => setCurrentPage(p)} style={{
                    color: currentPage === p ? '#ea580c' : '#0066cc',
                    cursor: 'pointer',
                    textDecoration: currentPage === p ? 'none' : 'underline'
                  }}>
                    {p}
                  </span>
                )
              })}
              <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>Next</span>
              <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentPage(totalPages)}>Last</span>
            </div>

            {/* Page size select dropdown */}
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
              Page Size:
              <select value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} style={{ marginLeft: '6px', fontSize: '11px', padding: '1px 3px' }}>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>

        </div>
      )}

    </div>
  )
}

export default DashboardModule
