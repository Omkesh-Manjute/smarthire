import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SiteLayout from '../components/SiteLayout'
import CandidatePdfReportModal from '../components/CandidatePdfReportModal'

function RecruiterDashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedCandidateForPdf, setSelectedCandidateForPdf] = useState(null)
  const [jobs, setJobs] = useState([])
  const [candidates, setCandidates] = useState([])
  const [selectedReq, setSelectedReq] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editingFields, setEditingFields] = useState({})

  // User role state
  const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user')
  let currentUser = null
  try {
    if (userStr) currentUser = JSON.parse(userStr)
  } catch (e) {}

  const realUserRole = currentUser?.role || 'recruiter'
  const canSwitchRoles = realUserRole === 'superadmin' || realUserRole === 'admin'
  const activeRole = canSwitchRoles ? (localStorage.getItem('smarthire_active_role') || realUserRole) : realUserRole
  const isSuperAdmin = canSwitchRoles && (activeRole === 'superadmin' || activeRole === 'admin')

  const [activeView, setActiveView] = useState(() => {
    return isSuperAdmin ? 'analytics' : 'requisitions'
  })

  // Fetch real jobs and candidates from API
  useEffect(() => {
    const token = localStorage.getItem('smarthire_token') || ''
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

    fetch('/api/jobs', { headers })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.jobs || data.data || []
        setJobs(list)
      })
      .catch(err => console.error('Failed to load jobs:', err))

    fetch('/api/candidates', { headers })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.candidates || data.data || []
        setCandidates(list)
      })
      .catch(err => console.error('Failed to load candidates:', err))
  }, [])

  const handleOpenReq = (job) => {
    setSelectedReq(job)
    setEditingFields({
      title: job.title || '',
      startDate: job.creationDate || '10/23/2026',
      duration: job.duration || '12 months',
      client: job.client || '',
      contact: job.contact || 'Hustedt Lexi',
      deadline: job.deadline || '8/28/2026',
      category: job.category || 'SP',
      type: job.type || 'Contract',
      address: job.address || '4430 Broad Rd.',
      location: job.location || '',
      billRate: job.billRate || '90',
      payRate: job.budget || '75',
      description: job.description || job.fullDescription || job.rawText || '',
      experience: job.experience || '5 years',
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : ''
    })
  }

  const handleSaveRequisition = (e) => {
    e.preventDefault()
    alert(`💾 Requisition #${selectedReq.id} saved successfully!`)
    setSelectedReq(null)
  }

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      if (!j) return false
      const matchSearch = !searchTerm ||
        (j.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (j.client || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (j.location || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchStatus = statusFilter === 'All' || j.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [jobs, searchTerm, statusFilter])

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredJobs.slice(start, start + pageSize)
  }, [filteredJobs, currentPage, pageSize])

  const totalPages = Math.ceil(filteredJobs.length / pageSize) || 1

  return (
    <SiteLayout>
      <section className="section" style={{ paddingTop: '20px', minHeight: '85vh' }}>
        <div className="container-wide">
          
          {/* Header Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="eyebrow">COMMAND CONSOLE</span>
              {isSuperAdmin ? (
                <span style={{ background: '#7C3AED', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px' }}>SUPER ADMIN MODE</span>
              ) : (
                <span style={{ background: '#2563EB', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px' }}>RECRUITER PORTAL</span>
              )}
            </div>

            {/* View Mode Switcher */}
            <div style={{ display: 'flex', background: '#e2e8f0', padding: '3px', borderRadius: 8, gap: 4 }}>
              <button
                onClick={() => { setSelectedReq(null); setActiveView('requisitions'); }}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none',
                  background: activeView === 'requisitions' ? '#ffffff' : 'transparent',
                  color: activeView === 'requisitions' ? '#1d4ed8' : '#475569',
                  fontWeight: 'bold', fontSize: 12, cursor: 'pointer',
                  boxShadow: activeView === 'requisitions' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                🏢 Open Requisitions (CoolSoft Portal)
              </button>
              <button
                onClick={() => { setSelectedReq(null); setActiveView('analytics'); }}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none',
                  background: activeView === 'analytics' ? '#ffffff' : 'transparent',
                  color: activeView === 'analytics' ? '#1d4ed8' : '#475569',
                  fontWeight: 'bold', fontSize: 12, cursor: 'pointer',
                  boxShadow: activeView === 'analytics' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                📊 Analytics & Overview
              </button>
            </div>
          </div>

          {/* ═══════════ COOLSOFT OPEN REQUISITIONS VIEW (Images 1, 2, 3) ═══════════ */}
          {activeView === 'requisitions' && (
            <div>
              {selectedReq ? (
                /* Single Requisition Details Sheet (Image 3) */
                <div style={{ background: '#f8fafc', padding: '20px 24px', borderRadius: 12, border: '1px solid #cbd5e1', fontFamily: 'Arial, sans-serif' }}>
                  {/* Breadcrumbs */}
                  <div style={{ fontSize: 11, color: '#1e3a8a', fontWeight: 'bold', marginBottom: 12 }}>
                    You are here: Home &gt; Requisitions &gt; Edit Requisition
                  </div>

                  {/* Header Title with Action links */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ea580c', paddingBottom: 8, marginBottom: 16 }}>
                    <h2 style={{ margin: 0, fontSize: 17, color: '#1e3a8a', fontWeight: 'bold' }}>
                      Requisition #:{selectedReq.id} <span style={{ color: '#dc2626', fontSize: 13, marginLeft: 8 }}>Status: In-Progress</span>
                    </h2>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, fontWeight: 'bold' }}>
                      <span style={{ color: '#0066cc', cursor: 'pointer' }} onClick={() => alert('Posting Job to JobsInHand...')}>Post To JobsInHand</span>
                      <span style={{ color: '#0066cc', cursor: 'pointer' }} onClick={() => alert('Preparing Mass E-mail...')}>Mass E-mail</span>
                      <span style={{ color: '#0066cc', cursor: 'pointer' }} onClick={() => setSelectedReq(null)}>&lt;&lt; Back To Search Results</span>
                    </div>
                  </div>

                  <form onSubmit={handleSaveRequisition}>
                    {/* Tab strip container */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', background: '#e2e8f0', padding: '4px 8px 0', gap: 2 }}>
                      {['Details', 'Assign to Recruiters', 'Potential Candidates', 'Attachments', 'New Candidates'].map((t, idx) => (
                        <div key={t} style={{
                          padding: '6px 14px', fontSize: 11.5, fontWeight: 'bold', borderRadius: '5px 5px 0 0',
                          background: idx === 0 ? '#ffffff' : '#f1f5f9',
                          border: idx === 0 ? '1px solid #cbd5e1' : 'none',
                          borderBottom: idx === 0 ? '1px solid #ffffff' : 'none',
                          color: idx === 0 ? '#0f172a' : '#475569',
                          cursor: 'pointer'
                        }}>
                          {t} {idx === 2 ? '(2)' : idx === 4 ? '(0)' : ''}
                        </div>
                      ))}
                    </div>

                    {/* Form sheet panel */}
                    <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: 'none', padding: '20px 24px', display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                      
                      {/* Left Column: Form Fields */}
                      <div style={{ flex: '1 1 460px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px 12px', alignContent: 'start' }}>
                        
                        <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Position Title:*</label>
                        <input type="text" value={editingFields.title} onChange={e => setEditingFields({ ...editingFields, title: e.target.value })} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} required />

                        <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Start Date:*</label>
                        <input type="text" value={editingFields.startDate} onChange={e => setEditingFields({ ...editingFields, startDate: e.target.value })} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} required />

                        <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Duration:*</label>
                        <input type="text" value={editingFields.duration} onChange={e => setEditingFields({ ...editingFields, duration: e.target.value })} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} required />

                        <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Customer:</label>
                        <input type="text" value={editingFields.client} onChange={e => setEditingFields({ ...editingFields, client: e.target.value })} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} />

                        <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Contact:</label>
                        <input type="text" value={editingFields.contact} onChange={e => setEditingFields({ ...editingFields, contact: e.target.value })} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} />

                        <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Submission Deadline:*</label>
                        <input type="text" value={editingFields.deadline} onChange={e => setEditingFields({ ...editingFields, deadline: e.target.value })} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} required />

                        <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Req Category:*</label>
                        <input type="text" value={editingFields.category} onChange={e => setEditingFields({ ...editingFields, category: e.target.value })} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} required />

                        <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Req Type:*</label>
                        <select value={editingFields.type} onChange={e => setEditingFields({ ...editingFields, type: e.target.value })} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }}>
                          <option>Contract</option>
                          <option>Permanent</option>
                          <option>C2H</option>
                        </select>

                        <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Location Address:</label>
                        <input type="text" value={editingFields.address} onChange={e => setEditingFields({ ...editingFields, address: e.target.value })} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} />

                        <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>City, State, Zip:*</label>
                        <input type="text" value={editingFields.location} onChange={e => setEditingFields({ ...editingFields, location: e.target.value })} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} required />

                        <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Bill Rate:</label>
                        <input type="text" value={editingFields.billRate} onChange={e => setEditingFields({ ...editingFields, billRate: e.target.value })} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} />

                        <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Pay Rate:</label>
                        <input type="text" value={editingFields.payRate} onChange={e => setEditingFields({ ...editingFields, payRate: e.target.value })} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} />

                        <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Interview:</label>
                        <select style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }}>
                          <option>Select</option>
                          <option>1 Round Virtual</option>
                          <option>In-Person</option>
                        </select>

                        <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Work Authorization:</label>
                        <select style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }}>
                          <option>Select</option>
                          <option>US Citizen</option>
                          <option>Green Card</option>
                          <option>H1B interop</option>
                        </select>

                        <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Subcontractable:*</label>
                        <select style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }}>
                          <option>No</option>
                          <option>Yes</option>
                        </select>

                        <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Employment Type:</label>
                        <input type="text" value="Contract" disabled style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3, background: '#f1f5f9' }} />

                        <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Experience:*</label>
                        <input type="text" value={editingFields.experience} onChange={e => setEditingFields({ ...editingFields, experience: e.target.value })} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3 }} required />

                      </div>

                      {/* Right Column: Description text area & Skills */}
                      <div style={{ flex: '1 1 460px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                          <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', display: 'block', marginBottom: 6 }}>Description:*</label>
                          <textarea rows={13} value={editingFields.description} onChange={e => setEditingFields({ ...editingFields, description: e.target.value })} style={{ width: '100%', padding: '10px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4, fontFamily: 'monospace' }} required />
                        </div>

                        <div>
                          <label style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e3a8a', display: 'block', marginBottom: 6 }}>Required Skills:*</label>
                          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '12px 16px' }}>
                            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#334155', lineHeight: 1.7 }}>
                              {editingFields.skills.split(',').map(s => s.trim()).filter(Boolean).map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Created by info bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderTop: 'none', fontSize: 11.5, color: '#475569', fontWeight: 'bold' }}>
                      <span>Created by: sharif on: 8/20/2026 2:31:19 PM</span>
                      <span>Last Updated by: vaibhav on: {new Date().toLocaleDateString()}</span>
                    </div>

                    {/* Submit Save bar */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                      <button type="submit" style={{
                        background: '#ea580c', color: '#ffffff', border: 'none', borderRadius: 4,
                        padding: '8px 24px', fontSize: 12.5, fontWeight: 'bold', cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(234, 88, 12, 0.2)'
                      }}>
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* All Open Requisitions List View (Images 1 & 2) */
                <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 12, border: '1px solid #cbd5e1', fontFamily: 'Arial, sans-serif' }}>
                  {/* Breadcrumbs */}
                  <div style={{ fontSize: 11, color: '#1e3a8a', fontWeight: 'bold', marginBottom: 12 }}>
                    You are here: Home
                  </div>

                  {/* Banner header title */}
                  <h2 style={{ margin: '0 0 4px', fontSize: 16, color: '#16a34a', fontWeight: 'bold' }}>
                    COOLSOFT Recruitment Portal Home
                  </h2>
                  <div style={{ fontSize: 12, color: '#334155', fontWeight: 'bold', marginBottom: 14 }}>
                    Welcome back to CoolWorks. You have {jobs.length} tasks.
                  </div>

                  {/* All Open Requisitions Header Banner */}
                  <div style={{
                    background: '#bfdbfe', border: '1px solid #93c5fd', padding: '7px 14px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderRadius: '4px 4px 0 0'
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 'bold', color: '#1e3a8a' }}>All Open Requisitions</span>
                    <span style={{ fontSize: 12, fontWeight: 'bold', color: '#1e3a8a' }}>
                      (Requisitions {filteredJobs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredJobs.length)} of {filteredJobs.length})
                    </span>
                  </div>

                  {/* Open Requisitions Table List */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#94a3b8', color: '#ffffff', borderBottom: '1px solid #cbd5e1' }}>
                          <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Req#</th>
                          <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Position</th>
                          <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Skills</th>
                          <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Customer</th>
                          <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Location</th>
                          <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Deadline</th>
                          <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Pay Rate</th>
                          <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Recruiters</th>
                          <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Status</th>
                          <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Req Ctg</th>
                          <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Req Type</th>
                          <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Duration</th>
                          <th style={{ padding: '8px 6px', fontWeight: 'bold', textAlign: 'center' }}>W</th>
                          <th style={{ padding: '8px 6px', fontWeight: 'bold', textAlign: 'center' }}>K</th>
                          <th style={{ padding: '8px 6px', fontWeight: 'bold', textAlign: 'center' }}>Cont</th>
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
                              <td style={{ padding: '8px 10px', fontWeight: 'bold' }}>
                                <span onClick={() => handleOpenReq(job)} style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>
                                  {job.id.replace('J-', '')}
                                </span>
                              </td>
                              {/* Position clickable link */}
                              <td style={{ padding: '8px 10px', fontWeight: 'bold' }}>
                                <span onClick={() => handleOpenReq(job)} style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>
                                  {job.title}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px', color: '#475569' }}>
                                {Array.isArray(job.skills) ? job.skills.slice(0, 3).join(', ') : ''}
                              </td>
                              <td style={{ padding: '8px 10px', color: '#475569' }}>{job.client}</td>
                              <td style={{ padding: '8px 10px', color: '#475569' }}>{job.location}</td>
                              <td style={{ padding: '8px 10px', color: '#e11d48', fontWeight: 'bold' }}>{job.deadline || 'Aug 28, 2026'}</td>
                              <td style={{ padding: '8px 10px', color: '#475569' }}>{job.budget || 'TBD'}</td>
                              <td style={{ padding: '8px 10px', color: '#475569' }}>{job.postedByName || 'NitinBho...'}</td>
                              <td style={{ padding: '8px 10px', color: '#16a34a', fontWeight: 'bold' }}>{job.status || 'Active'}</td>
                              <td style={{ padding: '8px 10px', color: '#475569' }}>SP</td>
                              <td style={{ padding: '8px 10px', color: '#475569' }}>{job.type || 'Contract'}</td>
                              <td style={{ padding: '8px 10px', color: '#475569' }}>{job.duration || '12'}</td>
                              {/* Checkbox indicators matching the reference */}
                              <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                                <input type="checkbox" readOnly checked={false} />
                              </td>
                              <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                                <input type="checkbox" readOnly checked={false} />
                              </td>
                              <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                                <input type="checkbox" readOnly checked={idx % 2 === 1} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination controls matching Image 2 */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderTop: '1px solid #cbd5e1', paddingTop: 10, marginTop: 10
                  }}>
                    {/* Numbers list */}
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, fontWeight: 'bold' }}>
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
                    <div style={{ fontSize: 11, fontWeight: 'bold' }}>
                      Page Size:
                      <select value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} style={{ marginLeft: 6, fontSize: 11, padding: '1px 3px' }}>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ MODERN ANALYTICS OVERVIEW ═══════════ */}
          {activeView === 'analytics' && (
            <div>
              {/* KPI Cards */}
              <div className="kpi-grid">
                <article className="kpi kpi-premium">
                  <div className="kpi-icon-wrap">📊</div>
                  <div>
                    <h3>Total Candidates</h3>
                    <p>{candidates.length}</p>
                    <span className="kpi-trend trend-up">↑ 12% this week</span>
                  </div>
                </article>
                <article className="kpi kpi-premium">
                  <div className="kpi-icon-wrap kpi-icon-green">⚡</div>
                  <div>
                    <h3>Active Jobs</h3>
                    <p>{jobs.length}</p>
                    <span className="kpi-trend trend-neutral">All systems nominal</span>
                  </div>
                </article>
                <article className="kpi kpi-premium">
                  <div className="kpi-icon-wrap kpi-icon-emerald">🛡️</div>
                  <div>
                    <h3>High Trust Rate</h3>
                    <p>78%</p>
                    <span className="kpi-trend trend-up">↑ 3% vs avg</span>
                  </div>
                </article>
                <article className="kpi kpi-premium kpi-amber">
                  <div className="kpi-icon-wrap kpi-icon-amber">⚠️</div>
                  <div>
                    <h3>Needs Review</h3>
                    <p>{candidates.filter(c => c.status === 'New').length}</p>
                    <span className="kpi-trend trend-down">Pending screening</span>
                  </div>
                </article>
              </div>

              {/* Quick Actions Panel */}
              <div className="quick-actions-bar" style={{ marginTop: 20 }}>
                <div className="bar-title">Quick Actions:</div>
                <div className="actions-links">
                  <Link to="/ats" className="action-link-btn">
                    <span>🎯 Go to ATS Workspace</span>
                  </Link>
                  <Link to="/reports" className="action-link-btn">
                    <span>📋 View Intelligence Reports</span>
                  </Link>
                  {isSuperAdmin && (
                    <Link to="/linkedin-posts" className="action-link-btn" style={{ borderColor: '#7C3AED', color: '#7C3AED' }}>
                      <span>🤖 LinkedIn Post Automation (Super Admin)</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Candidate PDF Verification Certificate Modal */}
      {selectedCandidateForPdf && (
        <CandidatePdfReportModal
          candidate={selectedCandidateForPdf}
          onClose={() => setSelectedCandidateForPdf(null)}
        />
      )}

      {/* Scoped Styles */}
      <style>{`
        .kpi-premium {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .kpi-icon-wrap {
          width: 42px;
          height: 42px;
          background: rgba(18, 39, 35, 0.05);
          border-radius: 10px;
          display: grid;
          place-items: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .kpi-icon-green {
          background: rgba(219, 127, 53, 0.1);
          color: var(--brand-2);
        }
        .kpi-icon-emerald {
          background: #dcfce7;
          color: #15803d;
        }
        .kpi-icon-amber {
          background: #fef3c7;
          color: #d97706;
        }
        .kpi-trend {
          display: block;
          font-size: 11px;
          font-weight: 600;
          margin-top: 6px;
        }
        .trend-up {
          color: #16a34a;
        }
        .trend-down {
          color: #dc2626;
        }
        .trend-neutral {
          color: var(--ink-soft);
        }
        .quick-actions-bar {
          background: rgba(239, 229, 210, 0.4);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .bar-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: var(--ink-soft);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .actions-links {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .action-link-btn {
          font-size: 13px;
          font-weight: 600;
          background: var(--surface);
          border: 1px solid var(--line);
          padding: 6px 14px;
          border-radius: 8px;
          color: var(--ink);
          transition: all 0.2s ease;
        }
        .action-link-btn:hover {
          background: var(--brand);
          color: white;
          border-color: var(--brand);
          transform: translateY(-1px);
        }
      `}</style>
    </SiteLayout>
  )
}

export default RecruiterDashboard
