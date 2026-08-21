import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import SiteLayout from '../components/SiteLayout'

// ─── MOCK DATA STORES FOR THE 13 REPORTS ───

const mockSubmissionDetails = [
  { id: 'SUB-101', reqId: '158938', title: 'Project Manager - Consultant', client: 'State Of SC', candidateName: 'Ashok Ganta', recruiter: 'Omkesh Manjute', payRate: '$74/hr', billRate: '$90/hr', rateType: 'C2C', subVendor: 'Talent9 Inc', submitDate: '2026-08-20', status: 'Int-SubmittedToManager', comments: 'Strong SC government delivery background' },
  { id: 'SUB-102', reqId: '158938', title: 'Project Manager - Consultant', client: 'State Of SC', candidateName: 'Kashyap K Vora', recruiter: 'Vaibhav Bisen', payRate: '$55/hr', billRate: '$90/hr', rateType: 'W2', subVendor: 'SmartHire LLC', submitDate: '2026-08-20', status: 'Int-SubmittedToManager', comments: 'PMP certified, local in Columbia' },
  { id: 'SUB-103', reqId: '158766', title: 'VDOT Network Administrator 4', client: 'State Of VA', candidateName: 'Ashok Ankalla', recruiter: 'Vaibhav Bisen', payRate: '$60/hr', billRate: '$85/hr', rateType: 'C2C', subVendor: 'SmartHire LLC', submitDate: '2026-08-19', status: 'Interview Scheduled', comments: 'Cisco CCNA/CCNP expert' },
  { id: 'SUB-104', reqId: '158766', title: 'VDOT Network Administrator 4', client: 'State Of VA', candidateName: 'Tirumala Ashok Varmadantuluri', recruiter: 'Nitin Bhosale', payRate: '$71/hr', billRate: '$88/hr', rateType: 'C2C', subVendor: 'Ameritech Global INC', submitDate: '2026-08-18', status: 'Client Shortlisted', comments: 'SD-WAN and PKI background' },
  { id: 'SUB-105', reqId: '158420', title: 'DCY - IT Lead Architect', client: 'State of MN', candidateName: 'Vadivelu Ashok Kumar', recruiter: 'Prudhvi', payRate: '$75/hr', billRate: '$95/hr', rateType: 'C2C', subVendor: 'Paramount Software Solutions', submitDate: '2026-08-17', status: 'Offer Extended', comments: '12+ yrs experience in enterprise architecture' },
  { id: 'SUB-106', reqId: '158310', title: 'Senior Data Engineer / Snowflake', client: 'State of CT', candidateName: 'Upendra Ganta', recruiter: 'Omkesh Manjute', payRate: '$60/hr', billRate: '$82/hr', rateType: 'C2C', subVendor: 'SmartHire LLC', submitDate: '2026-08-16', status: 'Placed', comments: 'Snowflake + dbt specialist' },
  { id: 'SUB-107', reqId: '158204', title: 'Oracle DBA / PL-SQL Specialist', client: 'State of TX', candidateName: 'Nagababu Ganta', recruiter: 'Vaibhav Bisen', payRate: '$63/hr', billRate: '$80/hr', rateType: 'C2C', subVendor: 'SmartHire LLC', submitDate: '2026-08-15', status: 'Client Review', comments: '13 yrs Oracle performance tuning' },
  { id: 'SUB-108', reqId: '158112', title: 'Senior Business Systems Analyst', client: 'State of NC', candidateName: 'Cx Avinash Ashokrao Mahajan', recruiter: 'Vaibhav Bisen', payRate: '$55/hr', billRate: '$75/hr', rateType: 'W2', subVendor: 'SmartHire LLC', submitDate: '2026-08-14', status: 'Interview Scheduled', comments: 'Healthcare Medicaid specialist' },
  { id: 'SUB-109', reqId: '157980', title: '.Net Core / Angular Developer', client: 'State of MN', candidateName: 'Triveni Ganta', recruiter: 'Sukamal Chatterjee', payRate: '$55/hr', billRate: '$78/hr', rateType: 'C2C', subVendor: 'Origin Tek Solutions', submitDate: '2026-08-12', status: 'Pending Review', comments: 'C# .NET Core 8 with Angular 17' },
  { id: 'SUB-110', reqId: '157890', title: 'Power Platform / Dynamics 365', client: 'State of TN', candidateName: 'Sri Sai Tejasvi Gantakolla', recruiter: 'Sukamal Chatterjee', payRate: '$65/hr', billRate: '$85/hr', rateType: 'C2C', subVendor: 'SmartHire LLC', submitDate: '2026-08-10', status: 'Placed', comments: 'PowerApps certified solution developer' }
]

const mockInterviewSchedules = [
  { id: 'INT-301', reqId: '158938', title: 'Project Manager - Consultant', client: 'State Of SC', candidateName: 'Ashok Ganta', recruiter: 'Omkesh Manjute', interviewDate: '2026-08-25', interviewTime: '10:00 AM EST', round: 'Round 1 (Virtual)', clientStartDate: '2026-10-23', status: 'Confirmed', feedback: 'Interview invite sent via Teams' },
  { id: 'INT-302', reqId: '158766', title: 'VDOT Network Administrator 4', client: 'State Of VA', candidateName: 'Ashok Ankalla', recruiter: 'Vaibhav Bisen', interviewDate: '2026-08-24', interviewTime: '02:30 PM EST', round: 'Technical Panel', clientStartDate: '2026-09-15', status: 'Completed', feedback: 'Passed technical round. Awaiting manager approval.' },
  { id: 'INT-303', reqId: '158112', title: 'Senior Business Systems Analyst', client: 'State of NC', candidateName: 'Cx Avinash Ashokrao Mahajan', recruiter: 'Vaibhav Bisen', interviewDate: '2026-08-26', interviewTime: '11:00 AM EST', round: 'Client Manager Round', clientStartDate: '2026-09-01', status: 'Scheduled', feedback: 'Webex video link shared with candidate' },
  { id: 'INT-304', reqId: '158420', title: 'DCY - IT Lead Architect', client: 'State of MN', candidateName: 'Vadivelu Ashok Kumar', recruiter: 'Prudhvi', interviewDate: '2026-08-22', interviewTime: '03:00 PM CST', round: 'Final Round', clientStartDate: '2026-09-08', status: 'Selected', feedback: 'Offer letter in preparation' },
  { id: 'INT-305', reqId: '158310', title: 'Senior Data Engineer / Snowflake', client: 'State of CT', candidateName: 'Upendra Ganta', recruiter: 'Omkesh Manjute', interviewDate: '2026-08-18', interviewTime: '01:00 PM EST', round: 'Round 1 (Online)', clientStartDate: '2026-09-01', status: 'Offered & Joined', feedback: 'Candidate started onboarding' }
]

const mockRequisitionStatuses = [
  { reqId: '158938', title: 'Project Manager - Consultant - 13285', client: 'State Of SC', category: 'SP', type: 'Contract', status: 'In-Progress', submissions: 2, maxSubmissions: 2, assignedRecruiters: 'Vaibhav Bisen, Omkesh Manjute', creationDate: '10/23/2026', deadline: '8/28/2026', billRate: '$90/hr', payRate: '$75/hr' },
  { reqId: '158766', title: 'VDOT Network Administrator 4 (807536)', client: 'State Of VA', category: 'IT', type: 'Contract', status: 'In-Progress', submissions: 2, maxSubmissions: 2, assignedRecruiters: 'Vaibhav Bisen, Nitin Bhosale', creationDate: '08/15/2026', deadline: '8/30/2026', billRate: '$88/hr', payRate: '$74/hr' },
  { reqId: '158420', title: 'DCY - IT Lead Architect', client: 'State of MN', category: 'IT', type: 'Contract', status: 'Ready', submissions: 1, maxSubmissions: 2, assignedRecruiters: 'Prudhvi', creationDate: '08/10/2026', deadline: '8/25/2026', billRate: '$95/hr', payRate: '$75/hr' },
  { reqId: '158310', title: 'Senior Data Engineer / Snowflake', client: 'State of CT', category: 'SP', type: 'Contract', status: 'Closed', submissions: 2, maxSubmissions: 2, assignedRecruiters: 'Omkesh Manjute', creationDate: '08/01/2026', deadline: '8/18/2026', billRate: '$82/hr', payRate: '$60/hr' },
  { reqId: '158204', title: 'Oracle DBA / PL-SQL Specialist', client: 'State of TX', category: 'IT', type: 'Contract', status: 'In-Progress', submissions: 1, maxSubmissions: 3, assignedRecruiters: 'Vaibhav Bisen', creationDate: '08/05/2026', deadline: '9/05/2026', billRate: '$80/hr', payRate: '$63/hr' },
  { reqId: '158112', title: 'Senior Business Systems Analyst', client: 'State of NC', category: 'SP', type: 'Contract', status: 'In-Progress', submissions: 1, maxSubmissions: 2, assignedRecruiters: 'Vaibhav Bisen', creationDate: '08/08/2026', deadline: '8/29/2026', billRate: '$75/hr', payRate: '$55/hr' },
  { reqId: '157980', title: '.Net Core / Angular Full Stack Developer', client: 'State of MN', category: 'ENG', type: 'Contract', status: 'In-Progress', submissions: 1, maxSubmissions: 2, assignedRecruiters: 'Sukamal Chatterjee', creationDate: '08/02/2026', deadline: '8/26/2026', billRate: '$78/hr', payRate: '$55/hr' },
  { reqId: '157890', title: 'Power Platform / Dynamics 365 Architect', client: 'State of TN', category: 'IT', type: 'Contract', status: 'Closed', submissions: 1, maxSubmissions: 1, assignedRecruiters: 'Sukamal Chatterjee', creationDate: '07/28/2026', deadline: '8/15/2026', billRate: '$85/hr', payRate: '$65/hr' }
]

const mockW2Candidates = [
  { id: 'W2-87535', name: 'Kashyap K Vora', role: 'Full Stack Java / Spring Boot Lead', exp: '10 yrs', location: 'Columbia, SC', payRate: '$55/hr', workAuth: 'US Citizen', recruiter: 'Omkesh Manjute', addedDate: '2026-08-15', resumesSubmitted: 2, status: 'Active / Available' },
  { id: 'W2-87512', name: 'Cx Avinash Ashokrao Mahajan', role: 'Senior Business Systems Analyst', exp: '16 yrs', location: 'Raleigh, NC', payRate: '$55/hr', workAuth: 'US Citizen', recruiter: 'Vaibhav Bisen', addedDate: '2026-08-10', resumesSubmitted: 1, status: 'Interviewing' },
  { id: 'W2-87505', name: 'Upendra Ganta', role: 'Data Engineer / Snowflake Lead', exp: '11 yrs', location: 'Hartford, CT', payRate: '$60/hr', workAuth: 'US Citizen', recruiter: 'Omkesh Manjute', addedDate: '2026-08-01', resumesSubmitted: 2, status: 'Placed' },
  { id: 'W2-87514', name: 'Ashok Ankalla', role: 'Project Coordinator / Scrum Master', exp: '18 yrs', location: 'Bentonville, AR', payRate: '$60/hr', workAuth: 'US Citizen', recruiter: 'Omkesh Manjute', addedDate: '2026-07-25', resumesSubmitted: 3, status: 'Active / Available' },
  { id: 'W2-87516', name: 'Priyanka Gantareddy', role: 'Senior Quality Assurance Lead', exp: '16 yrs', location: 'Austin, TX', payRate: '$60/hr', workAuth: 'US Citizen', recruiter: 'Omkesh Manjute', addedDate: '2026-07-20', resumesSubmitted: 1, status: 'Active / Available' },
  { id: 'W2-87519', name: 'Ashok Anakalla', role: 'Technical Lead / Solution Architect', exp: '18 yrs', location: 'Herndon, VA', payRate: '$68/hr', workAuth: 'US Citizen', recruiter: 'Omkesh Manjute', addedDate: '2026-07-15', resumesSubmitted: 2, status: 'Active / Available' },
  { id: 'W2-87524', name: 'Ashok Natarajan', role: 'Project Manager - Enterprise ERP', exp: '17 yrs', location: 'Irving, TX', payRate: '$80/hr', workAuth: 'US Citizen', recruiter: 'Nitin Bhosale', addedDate: '2026-07-10', resumesSubmitted: 1, status: 'Active / Available' }
]

const mockRecruiterPerformance = [
  { recruiter: 'Omkesh Manjute', sourced: 28, submitted: 18, interviews: 8, offers: 4, placed: 3, margin: '$38,400', avgSubmissionTime: '1.8 days' },
  { recruiter: 'Vaibhav Bisen', sourced: 34, submitted: 22, interviews: 11, offers: 5, placed: 4, margin: '$46,200', avgSubmissionTime: '1.5 days' },
  { recruiter: 'Sukamal Chatterjee', sourced: 22, submitted: 14, interviews: 6, offers: 3, placed: 2, margin: '$24,800', avgSubmissionTime: '2.1 days' },
  { recruiter: 'Prudhvi', sourced: 19, submitted: 12, interviews: 5, offers: 2, placed: 2, margin: '$21,500', avgSubmissionTime: '2.0 days' },
  { recruiter: 'Nitin Bhosale', sourced: 25, submitted: 15, interviews: 7, offers: 3, placed: 2, margin: '$26,100', avgSubmissionTime: '1.9 days' }
]

function Reports() {
  // Navigation Menus Structure (Exact Match to User's 4 Screenshots)
  const reportCategories = [
    {
      id: 'summary',
      name: 'Summary',
      items: [
        { id: 'submission-summary', label: 'Submission Summary' },
        { id: 'submission-details', label: 'Submission Details' },
        { id: 'daily-submission-summary', label: 'Daily Submission Summary' },
        { id: 'recruiters-performance', label: 'Recruiters performance summary' },
        { id: 'jih-candidate-summary', label: 'JIH Candidate Summary' },
        { id: 'candidate-by-hrai', label: 'Candidate By HRAI' }
      ]
    },
    {
      id: 'interview-schedule',
      name: 'Interview Schedule',
      items: [
        { id: 'interview-schedule-client-start', label: 'InterviewSchedule ClientStartDate' },
        { id: 'performance-summary', label: 'Performance Summary' },
        { id: 'performance-details', label: 'Performance Details' },
        { id: 'monthly-status', label: 'Monthly Status' }
      ]
    },
    {
      id: 'requisition',
      name: 'Requisition',
      items: [
        { id: 'requisition-status', label: 'Requisition Status' }
      ]
    },
    {
      id: 'w2-candidate',
      name: 'W2 Candidate',
      items: [
        { id: 'w2-candidate-added', label: 'W2 Candidate Added' },
        { id: 'resumes-submitted', label: 'Resumes Submitted' }
      ]
    }
  ]

  // Active Category & Sub-Report State
  const [activeCategory, setActiveCategory] = useState('summary')
  const [activeSubReport, setActiveSubReport] = useState('submission-details')
  const [hoverCategory, setHoverCategory] = useState(null)

  // Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecruiter, setSelectedRecruiter] = useState('All')
  const [selectedClient, setSelectedClient] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [startDate, setStartDate] = useState('2026-08-01')
  const [endDate, setEndDate] = useState('2026-08-31')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Switch Sub-report
  const handleSelectReport = (catId, subId) => {
    setActiveCategory(catId)
    setActiveSubReport(subId)
    setHoverCategory(null)
    setCurrentPage(1)
  }

  // Export to CSV / Excel
  const handleExportToExcel = () => {
    let headers = []
    let rows = []

    if (activeSubReport === 'submission-details' || activeSubReport === 'submission-summary' || activeSubReport === 'daily-submission-summary' || activeSubReport === 'resumes-submitted') {
      headers = ['ID', 'Req #', 'Job Title', 'Client', 'Candidate Name', 'Recruiter', 'Pay Rate', 'Bill Rate', 'Rate Type', 'Sub Vendor', 'Submit Date', 'Status', 'Comments']
      rows = filteredSubmissions.map(s => [
        s.id, s.reqId, `"${s.title}"`, `"${s.client}"`, `"${s.candidateName}"`, `"${s.recruiter}"`, `"${s.payRate}"`, `"${s.billRate}"`, s.rateType, `"${s.subVendor}"`, s.submitDate, `"${s.status}"`, `"${s.comments}"`
      ])
    } else if (activeSubReport.startsWith('interview')) {
      headers = ['Interview ID', 'Req #', 'Job Title', 'Client', 'Candidate Name', 'Recruiter', 'Interview Date', 'Interview Time', 'Round', 'Client Start Date', 'Status', 'Feedback']
      rows = filteredInterviews.map(i => [
        i.id, i.reqId, `"${i.title}"`, `"${i.client}"`, `"${i.candidateName}"`, `"${i.recruiter}"`, i.interviewDate, i.interviewTime, `"${i.round}"`, i.clientStartDate, `"${i.status}"`, `"${i.feedback}"`
      ])
    } else if (activeSubReport === 'requisition-status') {
      headers = ['Req #', 'Position Title', 'Client', 'Category', 'Type', 'Status', 'Submissions', 'Max Submissions', 'Assigned Recruiters', 'Creation Date', 'Deadline', 'Bill Rate', 'Pay Rate']
      rows = filteredRequisitions.map(r => [
        r.reqId, `"${r.title}"`, `"${r.client}"`, r.category, r.type, r.status, r.submissions, r.maxSubmissions, `"${r.assignedRecruiters}"`, r.creationDate, r.deadline, `"${r.billRate}"`, `"${r.payRate}"`
      ])
    } else if (activeSubReport === 'w2-candidate-added') {
      headers = ['Candidate ID', 'Name', 'Role', 'Experience', 'Location', 'Pay Rate', 'Work Auth', 'Recruiter', 'Added Date', 'Resumes Submitted', 'Status']
      rows = filteredW2Candidates.map(w => [
        w.id, `"${w.name}"`, `"${w.role}"`, w.exp, `"${w.location}"`, `"${w.payRate}"`, w.workAuth, `"${w.recruiter}"`, w.addedDate, w.resumesSubmitted, `"${w.status}"`
      ])
    } else if (activeSubReport === 'recruiters-performance' || activeSubReport === 'performance-summary' || activeSubReport === 'performance-details') {
      headers = ['Recruiter Name', 'Candidates Sourced', 'Submitted', 'Interviews', 'Offers', 'Placed', 'Margin Generated', 'Avg Submission Time']
      rows = mockRecruiterPerformance.map(p => [
        `"${p.recruiter}"`, p.sourced, p.submitted, p.interviews, p.offers, p.placed, `"${p.margin}"`, `"${p.avgSubmissionTime}"`
      ])
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `SmartWorks_${activeSubReport}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter Submissions
  const filteredSubmissions = useMemo(() => {
    return mockSubmissionDetails.filter(s => {
      if (selectedRecruiter !== 'All' && s.recruiter !== selectedRecruiter) return false
      if (selectedClient !== 'All' && s.client !== selectedClient) return false
      if (selectedStatus !== 'All' && s.status !== selectedStatus) return false
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const text = `${s.reqId} ${s.title} ${s.candidateName} ${s.client} ${s.recruiter} ${s.subVendor}`.toLowerCase()
        if (!text.includes(q)) return false
      }
      return true
    })
  }, [selectedRecruiter, selectedClient, selectedStatus, searchTerm])

  // Filter Interviews
  const filteredInterviews = useMemo(() => {
    return mockInterviewSchedules.filter(i => {
      if (selectedRecruiter !== 'All' && i.recruiter !== selectedRecruiter) return false
      if (selectedClient !== 'All' && i.client !== selectedClient) return false
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const text = `${i.reqId} ${i.title} ${i.candidateName} ${i.client} ${i.recruiter} ${i.status}`.toLowerCase()
        if (!text.includes(q)) return false
      }
      return true
    })
  }, [selectedRecruiter, selectedClient, searchTerm])

  // Filter Requisitions
  const filteredRequisitions = useMemo(() => {
    return mockRequisitionStatuses.filter(r => {
      if (selectedClient !== 'All' && r.client !== selectedClient) return false
      if (selectedStatus !== 'All' && r.status !== selectedStatus) return false
      if (selectedRecruiter !== 'All' && !r.assignedRecruiters.includes(selectedRecruiter)) return false
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const text = `${r.reqId} ${r.title} ${r.client} ${r.assignedRecruiters}`.toLowerCase()
        if (!text.includes(q)) return false
      }
      return true
    })
  }, [selectedClient, selectedStatus, selectedRecruiter, searchTerm])

  // Filter W2 Candidates
  const filteredW2Candidates = useMemo(() => {
    return mockW2Candidates.filter(w => {
      if (selectedRecruiter !== 'All' && w.recruiter !== selectedRecruiter) return false
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const text = `${w.name} ${w.role} ${w.location} ${w.recruiter}`.toLowerCase()
        if (!text.includes(q)) return false
      }
      return true
    })
  }, [selectedRecruiter, searchTerm])

  // Active Report Name Helper
  const currentReportLabel = useMemo(() => {
    for (const cat of reportCategories) {
      const match = cat.items.find(i => i.id === activeSubReport)
      if (match) return match.label
    }
    return 'Report'
  }, [activeSubReport])

  return (
    <SiteLayout>
      <div style={{ background: '#f1f5f9', minHeight: '92vh', paddingBottom: '40px', fontFamily: 'Arial, sans-serif' }}>
        
        {/* ═══════════ TOP BREADCRUMB & LOGO BAR ═══════════ */}
        <div style={{ background: '#ffffff', borderBottom: '1px solid #cbd5e1', padding: '6px 18px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
            <span style={{ fontSize: '16px' }}>🏠</span>
            <Link to="/dashboard" style={{ color: '#0066cc', textDecoration: 'underline' }}>Home</Link>
            <span>&gt;</span>
            <span>Reports</span>
            <span>&gt;</span>
            <span style={{ color: '#ea580c' }}>{currentReportLabel}</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#475569', fontWeight: 'bold' }}>
            SmartWorks Intelligence & Reporting Suite
          </div>
        </div>

        {/* ═══════════ BLUE 4-TAB NAVIGATION BAR (MATCHING SCREENSHOTS) ═══════════ */}
        <div style={{ background: '#739bbd', borderBottom: '1px solid #557b9d', position: 'relative', zIndex: 100 }}>
          <div className="container-wide" style={{ display: 'flex', alignItems: 'stretch', padding: '0 16px' }}>
            {reportCategories.map(cat => {
              const isActiveCat = activeCategory === cat.id
              const isHovered = hoverCategory === cat.id

              return (
                <div
                  key={cat.id}
                  onMouseEnter={() => setHoverCategory(cat.id)}
                  onMouseLeave={() => setHoverCategory(null)}
                  style={{ position: 'relative' }}
                >
                  {/* Category Top Tab Button */}
                  <div
                    onClick={() => {
                      setActiveCategory(cat.id)
                      setActiveSubReport(cat.items[0].id)
                    }}
                    style={{
                      padding: '8px 24px',
                      fontSize: '12.5px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      background: isActiveCat ? '#50789d' : 'transparent',
                      borderRight: '1px solid #5a82a6',
                      borderLeft: '1px solid rgba(255,255,255,0.15)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{cat.name}</span>
                    <span style={{ fontSize: '9px', opacity: 0.8 }}>▼</span>
                  </div>

                  {/* Dropdown Menu on Hover / Active (Exact styling from screenshots) */}
                  {(isHovered || (isActiveCat && hoverCategory === null)) && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      minWidth: '220px',
                      background: '#8ba8c4',
                      border: '1px solid #668cae',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                      zIndex: 200
                    }}>
                      {cat.items.map(item => {
                        const isSubActive = activeSubReport === item.id
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectReport(cat.id, item.id)}
                            style={{
                              padding: '7px 14px',
                              fontSize: '11.5px',
                              fontWeight: isSubActive ? 'bold' : 'normal',
                              color: '#ffffff',
                              background: isSubActive ? '#50789d' : 'transparent',
                              borderBottom: '1px solid #7a9cb8',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#658bad' }}
                            onMouseLeave={e => { e.currentTarget.style.background = isSubActive ? '#50789d' : 'transparent' }}
                          >
                            <span>{item.label}</span>
                            {isSubActive && <span style={{ fontSize: '10px' }}>✔</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ═══════════ MAIN REPORT CONTAINER ═══════════ */}
        <div className="container-wide" style={{ padding: '16px', maxWidth: '1360px', margin: '0 auto', marginTop: '10px' }}>
          
          {/* Top Quick Search & Filter Panel */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 16px', marginBottom: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>📑</span>
                <h2 style={{ margin: 0, fontSize: '15px', color: '#1e3a8a', fontWeight: 'bold' }}>
                  {currentReportLabel}
                </h2>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleExportToExcel}
                  style={{
                    background: '#f1f5f9', border: '1px solid #94a3b8', padding: '4px 12px',
                    fontSize: '11.5px', fontWeight: 'bold', color: '#0f172a', cursor: 'pointer',
                    boxShadow: 'inset 0 1px 0 #ffffff, 0 1px 2px rgba(0,0,0,0.05)', borderRadius: '2px',
                    display: 'flex', alignItems: 'center', gap: '5px'
                  }}
                >
                  <span>📊</span>
                  <span>Export to Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: '#f1f5f9', border: '1px solid #94a3b8', padding: '4px 12px',
                    fontSize: '11.5px', fontWeight: 'bold', color: '#0f172a', cursor: 'pointer',
                    borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '5px'
                  }}
                >
                  <span>🖨️</span>
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '3px',
              display: 'flex', gap: '12px 18px', alignItems: 'center', flexWrap: 'wrap', fontSize: '11.5px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Search:</label>
                <input
                  type="text"
                  placeholder="Filter candidate, req#, keyword..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ padding: '3px 8px', fontSize: '11px', border: '1px solid #cbd5e1', width: '180px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Recruiter:</label>
                <select
                  value={selectedRecruiter}
                  onChange={e => setSelectedRecruiter(e.target.value)}
                  style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                >
                  <option value="All">All Recruiters</option>
                  <option value="Omkesh Manjute">Omkesh Manjute</option>
                  <option value="Vaibhav Bisen">Vaibhav Bisen</option>
                  <option value="Sukamal Chatterjee">Sukamal Chatterjee</option>
                  <option value="Prudhvi">Prudhvi</option>
                  <option value="Nitin Bhosale">Nitin Bhosale</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Client:</label>
                <select
                  value={selectedClient}
                  onChange={e => setSelectedClient(e.target.value)}
                  style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                >
                  <option value="All">All Clients</option>
                  <option value="State Of SC">State Of SC</option>
                  <option value="State Of VA">State Of VA</option>
                  <option value="State of MN">State of MN</option>
                  <option value="State of CT">State of CT</option>
                  <option value="State of TX">State of TX</option>
                  <option value="State of NC">State of NC</option>
                  <option value="State of TN">State of TN</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Date From:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ padding: '2px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                />
                <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ padding: '2px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <button
                type="button"
                onClick={() => { setSearchTerm(''); setSelectedRecruiter('All'); setSelectedClient('All'); setSelectedStatus('All'); }}
                style={{ background: '#e2e8f0', border: '1px solid #94a3b8', padding: '3px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Reset
              </button>
            </div>

          </div>

          {/* ═══════════ KPI SUMMARY WIDGETS ═══════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Submissions</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginTop: '2px' }}>{mockSubmissionDetails.length}</div>
              <div style={{ fontSize: '10.5px', color: '#0284c7', marginTop: '2px' }}>Across 8 active state agencies</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', borderLeft: '4px solid #16a34a' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Interviews Scheduled</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginTop: '2px' }}>{mockInterviewSchedules.length}</div>
              <div style={{ fontSize: '10.5px', color: '#16a34a', marginTop: '2px' }}>4 upcoming this week</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', borderLeft: '4px solid #ea580c' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Open Requisitions</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginTop: '2px' }}>{mockRequisitionStatuses.filter(r => r.status === 'In-Progress').length}</div>
              <div style={{ fontSize: '10.5px', color: '#ea580c', marginTop: '2px' }}>Ready for candidate submittals</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 14px', borderLeft: '4px solid #7c3aed' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>W2 Candidates In Pool</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginTop: '2px' }}>{mockW2Candidates.length}</div>
              <div style={{ fontSize: '10.5px', color: '#7c3aed', marginTop: '2px' }}>Vetted and available for placement</div>
            </div>
          </div>

          {/* ═══════════ REPORT DATA TABLES ═══════════ */}
          <div style={{ background: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            
            {/* Table Header Bar */}
            <div style={{
              background: '#bfdbfe', borderBottom: '1px solid #93c5fd', padding: '6px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a' }}>
                {currentReportLabel} Records
              </span>
              <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a' }}>
                Total Matches: {
                  activeSubReport === 'submission-details' || activeSubReport === 'submission-summary' || activeSubReport === 'daily-submission-summary' || activeSubReport === 'resumes-submitted'
                    ? filteredSubmissions.length
                    : activeSubReport.startsWith('interview')
                    ? filteredInterviews.length
                    : activeSubReport === 'requisition-status'
                    ? filteredRequisitions.length
                    : activeSubReport === 'w2-candidate-added'
                    ? filteredW2Candidates.length
                    : mockRecruiterPerformance.length
                }
              </span>
            </div>

            {/* 1. SUBMISSIONS REPORT TABLE */}
            {(activeSubReport === 'submission-details' || activeSubReport === 'submission-summary' || activeSubReport === 'daily-submission-summary' || activeSubReport === 'resumes-submitted' || activeSubReport === 'jih-candidate-summary' || activeSubReport === 'candidate-by-hrai') && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#94a3b8', color: '#ffffff' }}>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Submission ID</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Req #</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Position Title</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Client</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Candidate Name</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Recruiter (Added By)</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Pay Rate</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Bill Rate</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Rate Type</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Sub Vendor</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Submitted On</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan="12" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No submission records found matching criteria.</td>
                      </tr>
                    ) : (
                      filteredSubmissions.map((s, idx) => (
                        <tr key={s.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#0066cc' }}>{s.id}</td>
                          <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>
                            <Link to="/dashboard" style={{ color: '#0066cc', textDecoration: 'underline' }}>{s.reqId}</Link>
                          </td>
                          <td style={{ padding: '6px 8px', color: '#1e293b' }}>{s.title}</td>
                          <td style={{ padding: '6px 8px', color: '#334155' }}>{s.client}</td>
                          <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>
                            <Link to="/dashboard" style={{ color: '#0066cc', textDecoration: 'underline' }}>{s.candidateName}</Link>
                          </td>
                          <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#1e3a8a', background: idx % 2 === 0 ? '#f1f5f9' : '#e2e8f0' }}>{s.recruiter}</td>
                          <td style={{ padding: '6px 8px', color: '#16a34a', fontWeight: 'bold' }}>{s.payRate}</td>
                          <td style={{ padding: '6px 8px', color: '#334155' }}>{s.billRate}</td>
                          <td style={{ padding: '6px 8px', color: '#334155' }}>{s.rateType}</td>
                          <td style={{ padding: '6px 8px', color: '#334155' }}>{s.subVendor}</td>
                          <td style={{ padding: '6px 8px', color: '#64748b' }}>{s.submitDate}</td>
                          <td style={{ padding: '6px 8px' }}>
                            <span style={{
                              padding: '2px 6px', borderRadius: '3px', fontSize: '10.5px', fontWeight: 'bold',
                              background: s.status === 'Placed' ? '#dcfce7' : s.status.includes('Interview') ? '#e0e7ff' : '#fef3c7',
                              color: s.status === 'Placed' ? '#166534' : s.status.includes('Interview') ? '#3730a3' : '#92400e'
                            }}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. RECRUITER PERFORMANCE TABLE */}
            {(activeSubReport === 'recruiters-performance' || activeSubReport === 'performance-summary' || activeSubReport === 'performance-details' || activeSubReport === 'monthly-status') && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#94a3b8', color: '#ffffff' }}>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Recruiter Name</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Candidates Sourced</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Submissions</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Interviews</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Offers</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Placed</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Margin Generated</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Avg Sourcing Speed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRecruiterPerformance.map((p, idx) => (
                      <tr key={p.recruiter} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#1e3a8a' }}>{p.recruiter}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{p.sourced}</td>
                        <td style={{ padding: '6px 8px', color: '#0284c7', fontWeight: 'bold' }}>{p.submitted}</td>
                        <td style={{ padding: '6px 8px', color: '#7c3aed', fontWeight: 'bold' }}>{p.interviews}</td>
                        <td style={{ padding: '6px 8px', color: '#ea580c', fontWeight: 'bold' }}>{p.offers}</td>
                        <td style={{ padding: '6px 8px', color: '#16a34a', fontWeight: 'bold' }}>{p.placed}</td>
                        <td style={{ padding: '6px 8px', color: '#15803d', fontWeight: 'bold' }}>{p.margin}</td>
                        <td style={{ padding: '6px 8px', color: '#475569' }}>{p.avgSubmissionTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. INTERVIEW SCHEDULE TABLE */}
            {activeSubReport === 'interview-schedule-client-start' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#94a3b8', color: '#ffffff' }}>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Interview ID</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Req #</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Position Title</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Client</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Candidate Name</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Recruiter</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Interview Date</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Time</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Round</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold', color: '#fef08a' }}>Client Start Date</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Status</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Feedback / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInterviews.map((i, idx) => (
                      <tr key={i.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#0066cc' }}>{i.id}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{i.reqId}</td>
                        <td style={{ padding: '6px 8px', color: '#1e293b' }}>{i.title}</td>
                        <td style={{ padding: '6px 8px', color: '#334155' }}>{i.client}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#0066cc' }}>{i.candidateName}</td>
                        <td style={{ padding: '6px 8px', color: '#1e3a8a', fontWeight: 'bold' }}>{i.recruiter}</td>
                        <td style={{ padding: '6px 8px', color: '#dc2626', fontWeight: 'bold' }}>{i.interviewDate}</td>
                        <td style={{ padding: '6px 8px', color: '#475569' }}>{i.interviewTime}</td>
                        <td style={{ padding: '6px 8px', color: '#334155' }}>{i.round}</td>
                        <td style={{ padding: '6px 8px', color: '#16a34a', fontWeight: 'bold', background: '#f0fdf4' }}>{i.clientStartDate}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{i.status}</td>
                        <td style={{ padding: '6px 8px', color: '#64748b' }}>{i.feedback}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. REQUISITION STATUS TABLE */}
            {activeSubReport === 'requisition-status' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#94a3b8', color: '#ffffff' }}>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Req #</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Position Title</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Client</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Category</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Type</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Status</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Submissions</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Assigned Recruiters</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Creation Date</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Deadline</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Pay Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequisitions.map((r, idx) => (
                      <tr key={r.reqId} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#0066cc' }}>{r.reqId}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#1e293b' }}>{r.title}</td>
                        <td style={{ padding: '6px 8px', color: '#334155' }}>{r.client}</td>
                        <td style={{ padding: '6px 8px', color: '#475569' }}>{r.category}</td>
                        <td style={{ padding: '6px 8px', color: '#475569' }}>{r.type}</td>
                        <td style={{ padding: '6px 8px', color: '#16a34a', fontWeight: 'bold' }}>{r.status}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#0066cc' }}>{r.submissions} / {r.maxSubmissions}</td>
                        <td style={{ padding: '6px 8px', color: '#1e3a8a', fontWeight: 'bold' }}>{r.assignedRecruiters}</td>
                        <td style={{ padding: '6px 8px', color: '#64748b' }}>{r.creationDate}</td>
                        <td style={{ padding: '6px 8px', color: '#dc2626', fontWeight: 'bold' }}>{r.deadline}</td>
                        <td style={{ padding: '6px 8px', color: '#334155' }}>{r.payRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 5. W2 CANDIDATE TABLE */}
            {activeSubReport === 'w2-candidate-added' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#94a3b8', color: '#ffffff' }}>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Candidate ID</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Candidate Name</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Role</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Exp</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Location</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Pay Rate</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Work Auth</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Recruiter (Added By)</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Added On</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Resumes Submitted</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredW2Candidates.map((w, idx) => (
                      <tr key={w.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#0066cc' }}>{w.id}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#0066cc' }}>{w.name}</td>
                        <td style={{ padding: '6px 8px', color: '#1e293b' }}>{w.role}</td>
                        <td style={{ padding: '6px 8px', color: '#475569' }}>{w.exp}</td>
                        <td style={{ padding: '6px 8px', color: '#475569' }}>{w.location}</td>
                        <td style={{ padding: '6px 8px', color: '#16a34a', fontWeight: 'bold' }}>{w.payRate}</td>
                        <td style={{ padding: '6px 8px', color: '#475569' }}>{w.workAuth}</td>
                        <td style={{ padding: '6px 8px', color: '#1e3a8a', fontWeight: 'bold', background: idx % 2 === 0 ? '#f1f5f9' : '#e2e8f0' }}>{w.recruiter}</td>
                        <td style={{ padding: '6px 8px', color: '#64748b' }}>{w.addedDate}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 'bold', textAlign: 'center' }}>{w.resumesSubmitted}</td>
                        <td style={{ padding: '6px 8px', color: '#16a34a', fontWeight: 'bold' }}>{w.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#f8fafc', borderTop: '1px solid #cbd5e1', padding: '6px 14px'
            }}>
              <div style={{ display: 'flex', gap: '8px', fontSize: '11.5px', fontWeight: 'bold' }}>
                <span style={{ color: '#ea580c', cursor: 'pointer' }}>1</span>
                <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>2</span>
                <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>3</span>
                <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>Next</span>
                <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>Last</span>
              </div>

              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a' }}>
                Page Size:
                <select value={pageSize} onChange={e => setPageSize(parseInt(e.target.value))} style={{ marginLeft: '6px', fontSize: '11px', padding: '1px 3px' }}>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>

          </div>

        </div>

        {/* ═══════════ ORANGE FOOTER ═══════════ */}
        <footer style={{ background: '#ea580c', borderTop: '2px solid #c2410c', color: '#ffffff', textAlign: 'center', padding: '10px', marginTop: '40px', fontSize: '11px', fontWeight: 'bold' }}>
          © SmartHire LLC | All rights reserved | Release 1.9 06-May-2025 (New Server 2023 Aug)
        </footer>

      </div>
    </SiteLayout>
  )
}

export default Reports
