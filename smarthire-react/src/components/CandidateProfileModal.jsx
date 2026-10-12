import React, { useState, useEffect } from 'react'

export default function CandidateProfileModal({
  isOpen,
  onClose,
  candidateUser,
  onUpdateProfile,
  themeMode = 'light'
}) {
  const isLight = themeMode === 'light'
  const [activeTab, setActiveTab] = useState('form') // 'form' | 'applications'
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Profile Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [relocatePref, setRelocatePref] = useState('Yes')
  const [visaStatus, setVisaStatus] = useState('US Citizen')
  const [contractType, setContractType] = useState('C2C')
  const [employer, setEmployer] = useState('')
  const [primarySkill, setPrimarySkill] = useState('')
  const [experience, setExperience] = useState('')
  const [expectedRate, setExpectedRate] = useState('')
  const [resumeFileName, setResumeFileName] = useState('')
  const [resumeFileObj, setResumeFileObj] = useState(null)
  const [applications, setApplications] = useState([])

  // Load existing profile & applications on modal open or user change
  useEffect(() => {
    if (!isOpen) return

    let profile = {}
    try {
      const savedProfile = localStorage.getItem('smarthire_candidate_profile')
      if (savedProfile) profile = JSON.parse(savedProfile)
    } catch (e) {}

    const currentUser = candidateUser || {}
    setName(profile.name || currentUser.name || '')
    setEmail(profile.email || currentUser.email || '')
    setPhone(profile.phone || currentUser.phone || '')
    setLocation(profile.location || currentUser.location || '')
    setRelocatePref(profile.relocatePref || 'Yes')
    setVisaStatus(profile.visaStatus || 'US Citizen')
    setContractType(profile.contractType || 'C2C')
    setEmployer(profile.employer || currentUser.employer || '')
    setPrimarySkill(profile.primarySkill || '')
    setExperience(profile.experience || '')
    setExpectedRate(profile.expectedRate || '')
    setResumeFileName(profile.resumeFileName || '')

    // Load submitted applications
    try {
      const allApps = JSON.parse(localStorage.getItem('smarthire_careers_applications') || '[]')
      const targetEmail = (profile.email || currentUser.email || '').toLowerCase().trim()
      if (targetEmail) {
        const userApps = allApps.filter(a => (a.candidateEmail || a.email || '').toLowerCase().trim() === targetEmail)
        setApplications(userApps)
      } else {
        setApplications(allApps.slice(0, 10))
      }
    } catch (e) {
      setApplications([])
    }
  }, [isOpen, candidateUser])

  if (!isOpen) return null

  const handleResumeChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (file) {
      setResumeFileObj(file)
      setResumeFileName(file.name)
    }
  }

  const handleSave = (e) => {
    e.preventDefault()

    const updatedProfile = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      location: location.trim(),
      relocatePref,
      visaStatus,
      contractType,
      employer: employer.trim(),
      primarySkill: primarySkill.trim(),
      experience: experience.trim(),
      expectedRate: expectedRate.trim(),
      resumeFileName: resumeFileName || (resumeFileObj ? resumeFileObj.name : ''),
      updatedAt: new Date().toISOString()
    }

    try {
      localStorage.setItem('smarthire_candidate_profile', JSON.stringify(updatedProfile))
      const updatedUser = {
        ...(candidateUser || {}),
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        visaStatus: updatedProfile.visaStatus,
        contractType: updatedProfile.contractType,
        employer: updatedProfile.employer,
        resumeFileName: updatedProfile.resumeFileName
      }
      localStorage.setItem('smarthire_candidate_user', JSON.stringify(updatedUser))

      if (onUpdateProfile) {
        onUpdateProfile(updatedUser, updatedProfile, resumeFileObj)
      }
    } catch (e) {
      console.error('Failed to save profile:', e)
    }

    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  // Styles adhering to Rule 8 & 9 (Clean enterprise B2B, no emojis, Excel-style tabular grid)
  const colors = {
    bg: isLight ? '#FFFFFF' : '#0F172A',
    surface: isLight ? '#F8FAFC' : '#1E293B',
    border: isLight ? '#E2E8F0' : '#334155',
    textPrimary: isLight ? '#0F172A' : '#F8FAFC',
    textSecondary: isLight ? '#64748B' : '#94A3B8',
    inputBg: isLight ? '#FFFFFF' : '#0B0F19',
    inputBorder: isLight ? '#CBD5E1' : '#475569',
    gridHeader: isLight ? '#F1F5F9' : '#1E293B',
    gridBorder: isLight ? '#CBD5E1' : '#334155',
    gridRowAlt: isLight ? '#F8FAFC' : '#141E33'
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: 16
    }}>
      <div style={{
        backgroundColor: colors.bg,
        borderRadius: 12,
        width: '100%',
        maxWidth: 780,
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surface
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.01em' }}>
                Candidate Profile & Career Hub
              </h3>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#2563EB',
                backgroundColor: isLight ? '#EFF6FF' : '#1E3A8A',
                padding: '2px 8px',
                borderRadius: 4
              }}>
                Verified Portal
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.textSecondary }}>
              Manage your personal info, work authorization, resume, and track submitted applications.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              color: colors.textSecondary,
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              lineHeight: 1
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.bg,
          padding: '0 24px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'form' ? '2px solid #2563EB' : '2px solid transparent',
              color: activeTab === 'form' ? '#2563EB' : colors.textSecondary,
              fontWeight: activeTab === 'form' ? 700 : 500,
              fontSize: 13.5,
              padding: '12px 16px',
              cursor: 'pointer'
            }}
          >
            Profile & Resume Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'applications' ? '2px solid #2563EB' : '2px solid transparent',
              color: activeTab === 'applications' ? '#2563EB' : colors.textSecondary,
              fontWeight: activeTab === 'applications' ? 700 : 500,
              fontSize: 13.5,
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>My Submitted Applications</span>
            <span style={{
              fontSize: 11,
              backgroundColor: isLight ? '#F1F5F9' : '#334155',
              color: colors.textPrimary,
              padding: '1px 6px',
              borderRadius: 10,
              fontWeight: 700
            }}>
              {applications.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          flex: 1
        }}>
          {saveSuccess && (
            <div style={{
              backgroundColor: '#DCFCE7',
              border: '1px solid #86EFAC',
              color: '#166534',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>Profile, authorization, and resume details saved successfully!</span>
              <span style={{ fontSize: 11 }}>Auto-applied to future applications</span>
            </div>
          )}

          {activeTab === 'form' ? (
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {/* Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: colors.textPrimary, marginBottom: 5 }}>
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: `1px solid ${colors.inputBorder}`,
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: colors.textPrimary, marginBottom: 5 }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. john.doe@example.com"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: `1px solid ${colors.inputBorder}`,
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: colors.textPrimary, marginBottom: 5 }}>
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 234-5678"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: `1px solid ${colors.inputBorder}`,
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Current Location */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: colors.textPrimary, marginBottom: 5 }}>
                    Current Location (City, State)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Dallas, TX or Remote"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: `1px solid ${colors.inputBorder}`,
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Visa Status */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: colors.textPrimary, marginBottom: 5 }}>
                    Work Authorization / Visa Status *
                  </label>
                  <select
                    value={visaStatus}
                    onChange={(e) => setVisaStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: `1px solid ${colors.inputBorder}`,
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="US Citizen">US Citizen</option>
                    <option value="Green Card">Green Card (Permanent Resident)</option>
                    <option value="H-1B">H-1B (Work Visa)</option>
                    <option value="OPT/CPT">OPT / STEM OPT / CPT</option>
                    <option value="TN Visa">TN Visa (Canada / Mexico)</option>
                    <option value="EAD">EAD (GC / H4 / L2 / Asylum)</option>
                    <option value="Other">Other Authorized Status</option>
                  </select>
                </div>

                {/* Preferred Contract Type */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: colors.textPrimary, marginBottom: 5 }}>
                    Engagement Preference *
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: `1px solid ${colors.inputBorder}`,
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="C2C">Corp-to-Corp (C2C)</option>
                    <option value="W2">W2 (Direct Employment)</option>
                    <option value="1099">1099 (Independent Contractor)</option>
                    <option value="Full-Time">Full-Time / Direct Hire</option>
                  </select>
                </div>

                {/* Current Employer / Agency */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: colors.textPrimary, marginBottom: 5 }}>
                    Current Employer / Vendor Agency
                  </label>
                  <input
                    type="text"
                    value={employer}
                    onChange={(e) => setEmployer(e.target.value)}
                    placeholder="e.g. Coolsoft LLC or Independent"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: `1px solid ${colors.inputBorder}`,
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Expected Rate / Salary */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: colors.textPrimary, marginBottom: 5 }}>
                    Expected Rate / Compensation
                  </label>
                  <input
                    type="text"
                    value={expectedRate}
                    onChange={(e) => setExpectedRate(e.target.value)}
                    placeholder="e.g. $75/hr or $125,000/yr"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: `1px solid ${colors.inputBorder}`,
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Primary Skill & Title */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: colors.textPrimary, marginBottom: 5 }}>
                    Primary Skill / Current Job Title
                  </label>
                  <input
                    type="text"
                    value={primarySkill}
                    onChange={(e) => setPrimarySkill(e.target.value)}
                    placeholder="e.g. Senior .NET Full Stack Developer"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: `1px solid ${colors.inputBorder}`,
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Total Experience */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: colors.textPrimary, marginBottom: 5 }}>
                    Total Professional Experience
                  </label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 8+ Years"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: `1px solid ${colors.inputBorder}`,
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Resume Upload Section */}
              <div style={{
                marginTop: 20,
                padding: '16px 18px',
                borderRadius: 8,
                backgroundColor: colors.surface,
                border: `1px dashed ${colors.border}`
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>
                  Resume Document (PDF or Word)
                </div>
                <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 10px' }}>
                  Upload your master resume. It will be pre-attached whenever you click 1-click apply.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    id="profile-resume-input"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeChange}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="profile-resume-input"
                    style={{
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: 12.5,
                      fontWeight: 600,
                      padding: '8px 14px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'inline-block'
                    }}
                  >
                    {resumeFileName ? 'Replace Resume' : 'Attach Resume'}
                  </label>
                  {resumeFileName ? (
                    <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 600 }}>
                      Current: {resumeFileName}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12.5, color: colors.textSecondary }}>
                      No resume uploaded yet
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                    borderRadius: 6,
                    padding: '9px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#2563EB',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: 6,
                    padding: '9px 22px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save Profile Details
                </button>
              </div>
            </form>
          ) : (
            /* Applications Tab (Excel-Style Table adhering strictly to Rule 9) */
            <div>
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.textSecondary }}>
                  Showing {applications.length} submitted requisitions
                </div>
                <span style={{ fontSize: 11, color: '#64748B' }}>
                  Excel-Grid View • Realtime Status
                </span>
              </div>

              {applications.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 4 }}>
                    No Applications Submitted Yet
                  </div>
                  <p style={{ fontSize: 12.5, color: colors.textSecondary, margin: '0 0 14px' }}>
                    Browse our active requisitions and submit your application with 1-click.
                  </p>
                  <button
                    onClick={onClose}
                    style={{
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Browse Open Jobs
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: `1px solid ${colors.gridBorder}`, borderRadius: 6 }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 12.5,
                    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: colors.gridHeader, borderBottom: `2px solid ${colors.gridBorder}` }}>
                        <th style={{ padding: '9px 12px', textAlign: 'center', borderRight: `1px solid ${colors.gridBorder}`, fontWeight: 700, color: colors.textPrimary, width: 44 }}>
                          #
                        </th>
                        <th style={{ padding: '9px 14px', textAlign: 'left', borderRight: `1px solid ${colors.gridBorder}`, fontWeight: 700, color: colors.textPrimary }}>
                          Job Title & Requisition
                        </th>
                        <th style={{ padding: '9px 12px', textAlign: 'left', borderRight: `1px solid ${colors.gridBorder}`, fontWeight: 700, color: colors.textPrimary }}>
                          Client / Agency
                        </th>
                        <th style={{ padding: '9px 12px', textAlign: 'center', borderRight: `1px solid ${colors.gridBorder}`, fontWeight: 700, color: colors.textPrimary }}>
                          Submitted Rate
                        </th>
                        <th style={{ padding: '9px 12px', textAlign: 'center', borderRight: `1px solid ${colors.gridBorder}`, fontWeight: 700, color: colors.textPrimary }}>
                          Visa / Model
                        </th>
                        <th style={{ padding: '9px 12px', textAlign: 'center', borderRight: `1px solid ${colors.gridBorder}`, fontWeight: 700, color: colors.textPrimary }}>
                          Applied Date
                        </th>
                        <th style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 700, color: colors.textPrimary }}>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app, idx) => {
                        const isAlt = idx % 2 === 1
                        const statusText = app.status || 'Application Submitted'
                        const isUnderReview = statusText.toLowerCase().includes('submitted') || statusText.toLowerCase().includes('review')
                        return (
                          <tr
                            key={app.id || app.candidateId || idx}
                            style={{
                              backgroundColor: isAlt ? colors.gridRowAlt : colors.bg,
                              borderBottom: `1px solid ${colors.gridBorder}`,
                              height: 38
                            }}
                          >
                            <td style={{ padding: '8px 12px', textAlign: 'center', borderRight: `1px solid ${colors.gridBorder}`, color: colors.textSecondary, fontWeight: 600 }}>
                              {idx + 1}
                            </td>
                            <td style={{ padding: '8px 14px', borderRight: `1px solid ${colors.gridBorder}`, fontWeight: 600, color: colors.textPrimary }}>
                              <div>{app.role || app.jobTitle || 'Application'}</div>
                              {app.reqId && (
                                <div style={{ fontSize: 11, color: colors.textSecondary }}>Req #{app.reqId}</div>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px', borderRight: `1px solid ${colors.gridBorder}`, color: colors.textSecondary }}>
                              {app.client || app.matchedJobClient || 'Enterprise Client'}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', borderRight: `1px solid ${colors.gridBorder}`, fontWeight: 600, color: '#16A34A' }}>
                              {app.payRate || app.expectedRate || 'Negotiable'}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', borderRight: `1px solid ${colors.gridBorder}`, color: colors.textSecondary }}>
                              {app.visaStatus || app.payRateType || 'C2C'}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', borderRight: `1px solid ${colors.gridBorder}`, color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                              {app.assignedOn || (app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recent')}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <span style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 4,
                                backgroundColor: isUnderReview ? '#FEF3C7' : '#DCFCE7',
                                color: isUnderReview ? '#92400E' : '#166534',
                                display: 'inline-block'
                              }}>
                                {isUnderReview ? 'Under Review' : statusText}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
