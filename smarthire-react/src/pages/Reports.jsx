import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import SiteLayout from '../components/SiteLayout'

// ─── MOCK DATA STORES FOR THE REPORTS ───

// Exact Match Data for "SmartHire Careers / JIH Candidate Summary" (media_1787315422853.png)
const mockSmartHireCareersCandidates = [
  { fName: 'Simone', lName: 'Thibodeau', email: 'simone.thibodeau@quopost.com', phone: '1413345819', canId: '87603', reqId: '158916', appliedDate: '8/20/2026 9:42:17 PM', status: 'Int-SubmittedToManager', rejectReason: '', comments: 'Submitted from SmartHire Careers' },
  { fName: 'Yadhria', lName: 'Marcos Avila', email: 'yadhiramavila@gmail.com', phone: '2522924109', canId: '87753', reqId: '158914', appliedDate: '8/20/2026 5:19:56 PM', status: 'Int-SubmittedToManager', rejectReason: '', comments: 'Submitted from SmartHire Careers' },
  { fName: 'Abhilash Reddy', lName: 'Nayalaconda', email: 'abhilashre@gmail.com', phone: '5715295350', canId: '87749', reqId: '158937', appliedDate: '8/20/2026 3:38:39 PM', status: 'Int-SubmittedToManager', rejectReason: '', comments: 'Submitted from SmartHire Careers' },
  { fName: 'Simone', lName: 'Thibodeau', email: 'simone.thibodeau@careerio-aa.com', phone: '1413345819', canId: '87442', reqId: '158916', appliedDate: '8/20/2026 1:25:43 PM', status: 'Int-SubmittedToManager', rejectReason: '', comments: 'Submitted from SmartHire Careers' },
  { fName: 'William', lName: 'Floyd', email: 'generalgrant64@hotmail.com', phone: '5403925784', canId: '87744', reqId: '158914', appliedDate: '8/19/2026 10:16:14 PM', status: 'Int-SubmittedToManager', rejectReason: '', comments: 'Submitted from SmartHire Careers' },
  { fName: 'Willie', lName: 'Black', email: 'billy.careering@gmail.com', phone: '7049993932', canId: '87740', reqId: '158902', appliedDate: '8/19/2026 4:14:03 PM', status: 'Int-SubmittedToManager', rejectReason: '', comments: 'Submitted from SmartHire Careers' },
  { fName: 'Courtney', lName: 'Tyree', email: 'courtneytyree75@gmail.com', phone: '6786950140', canId: '87735', reqId: '158904', appliedDate: '8/18/2026 9:23:14 PM', status: 'Int-SubmittedToManager', rejectReason: '', comments: 'Submitted from SmartHire Careers' },
  { fName: 'Sahana', lName: 'Sriram', email: 'sahanasriram853@gmail.com', phone: '7869815625', canId: '87729', reqId: '153771', appliedDate: '8/18/2026 3:39:09 PM', status: 'Int-SubmittedToManager', rejectReason: '', comments: 'Submitted from SmartHire Careers' },
  { fName: 'Anand', lName: 'Upadhyay', email: 'Aupadhyay5@Outlook.com', phone: '4403649547', canId: '87724', reqId: '158879', appliedDate: '8/18/2026 9:25:21 AM', status: 'Int-SubmittedToManager', rejectReason: '', comments: 'Submitted from SmartHire Careers' },
  { fName: 'Sunil Kamal', lName: 'Ahuja', email: 'sunilkamalahuja@quopost.com', phone: '4256155231', canId: '87475', reqId: '158873', appliedDate: '8/18/2026 2:43:43 AM', status: 'Int-SubmittedToManager', rejectReason: '', comments: 'Submitted from SmartHire Careers' },
  { fName: 'Sunil', lName: 'Ahuja', email: 'sunil.kamal.ahuja@careerio-aa.com', phone: '4256155231', canId: '87444', reqId: '158873', appliedDate: '8/18/2026 12:08:42 AM', status: 'Int-SubmittedToManager', rejectReason: '', comments: 'Submitted from SmartHire Careers' },
  { fName: 'Kaylar', lName: 'Allen', email: 'Allenkaylar36@gmail.com', phone: '6785291598', canId: '87714', reqId: '158904', appliedDate: '8/16/2026 9:25:37 AM', status: 'Int-SubmittedToManager', rejectReason: '', comments: 'Submitted from SmartHire Careers' }
]

// Exact Match Data for "Resumes Added" (media_1787315254728.png)
const mockResumesAddedRows = [
  {
    date: '08/20/2026', recruiter: 'Ajay Arya', total: 2, newCount: 0, poolCount: 2, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Srinivas Rao', role: 'Java AWS Lead', type: 'SW Pool', reqId: '158938', client: 'State Of SC', status: 'Added to Requisition' },
      { name: 'Kiran Verma', role: 'DevOps Architect', type: 'SW Pool', reqId: '158766', client: 'State Of VA', status: 'Submitted' }
    ]
  },
  {
    date: '08/20/2026', recruiter: 'Ashwath S', total: 1, newCount: 0, poolCount: 1, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Anil Reddy', role: 'Senior SQL DBA', type: 'SW Pool', reqId: '158204', client: 'State of TX', status: 'Reviewed' }
    ]
  },
  {
    date: '08/20/2026', recruiter: 'JIH Resumes', total: 3, newCount: 1, poolCount: 2, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Robert Miller', role: 'Cloud Engineer', type: 'NEW', reqId: '158310', client: 'State of CT', status: 'Parsed & Added' },
      { name: 'Samantha Clark', role: 'Project Manager', type: 'SW Pool', reqId: '158938', client: 'State Of SC', status: 'Matched' },
      { name: 'David Wilson', role: 'Network Specialist', type: 'SW Pool', reqId: '158766', client: 'State Of VA', status: 'Matched' }
    ]
  },
  {
    date: '08/20/2026', recruiter: 'Kamlesh SmartHire', total: 3, newCount: 0, poolCount: 3, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Vijay Kumar', role: 'Data Analyst', type: 'SW Pool', reqId: '158310', client: 'State of CT', status: 'Submitted' },
      { name: 'Deepak Patel', role: 'ETL Developer', type: 'SW Pool', reqId: '158310', client: 'State of CT', status: 'Submitted' },
      { name: 'Ramesh Naidu', role: 'QA Lead', type: 'SW Pool', reqId: '158420', client: 'State of MN', status: 'Screened' }
    ]
  },
  {
    date: '08/20/2026', recruiter: 'Krishnendu Jana', total: 1, newCount: 1, poolCount: 0, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Sourav Banerjee', role: 'Full Stack .Net', type: 'NEW', reqId: '157980', client: 'State of MN', status: 'Newly Added' }
    ]
  },
  {
    date: '08/20/2026', recruiter: 'Manikanta Siripalli', total: 1, newCount: 1, poolCount: 0, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Chaitanya Krishna', role: 'Snowflake Specialist', type: 'NEW', reqId: '158310', client: 'State of CT', status: 'Newly Added' }
    ]
  },
  {
    date: '08/20/2026', recruiter: 'Naveen Korimelli', total: 1, newCount: 0, poolCount: 1, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Girish Sharma', role: 'Business Systems Analyst', type: 'SW Pool', reqId: '158112', client: 'State of NC', status: 'Submitted' }
    ]
  },
  {
    date: '08/20/2026', recruiter: 'Nishant Kathane', total: 1, newCount: 1, poolCount: 0, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Tushar Deshmukh', role: 'Power Platform Developer', type: 'NEW', reqId: '157890', client: 'State of TN', status: 'Newly Added' }
    ]
  },
  {
    date: '08/20/2026', recruiter: 'Omkesh Manjute', total: 3, newCount: 1, poolCount: 2, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Ashok Ganta', role: 'VDOT Network Administrator 4', type: 'SW Pool', reqId: '158938', client: 'State Of SC', status: 'Int-SubmittedToManager' },
      { name: 'Upendra Ganta', role: 'Data Engineer', type: 'SW Pool', reqId: '158310', client: 'State of CT', status: 'Placed' },
      { name: 'Priyanka Gantareddy', role: 'Senior QA Lead', type: 'NEW', reqId: '158420', client: 'State of MN', status: 'Newly Added & Assigned' }
    ]
  },
  {
    date: '08/20/2026', recruiter: 'Pankaj Maharwade', total: 1, newCount: 0, poolCount: 1, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Sanjay Joshi', role: 'Systems Analyst', type: 'SW Pool', reqId: '158112', client: 'State of NC', status: 'Submitted' }
    ]
  },
  {
    date: '08/20/2026', recruiter: 'Prudhvi Sevveti', total: 1, newCount: 0, poolCount: 1, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Vadivelu Ashok Kumar', role: 'IT Lead Architect', type: 'SW Pool', reqId: '158420', client: 'State of MN', status: 'Offer Extended' }
    ]
  },
  {
    date: '08/20/2026', recruiter: 'Sukamal Chatterjee', total: 4, newCount: 4, poolCount: 0, notPerf: '', submittedClient: '',
    candidates: [
      { name: 'Ashok Rajendran', role: 'Application Developer', type: 'NEW', reqId: '157980', client: 'State of MN', status: 'Newly Added' },
      { name: 'Triveni Ganta', role: '.Net Angular Lead', type: 'NEW', reqId: '157980', client: 'State of MN', status: 'Newly Added' },
      { name: 'Sri Sai Tejasvi Gantakolla', role: 'Power Platform Lead', type: 'NEW', reqId: '157890', client: 'State of TN', status: 'Newly Added' },
      { name: 'Ravi Shankar', role: 'Cloud DevOps', type: 'NEW', reqId: '158766', client: 'State Of VA', status: 'Newly Added' }
    ]
  },
  {
    date: '08/20/2026', recruiter: 'Vaibhav Bisen', total: 1, newCount: 0, poolCount: 1, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Kashyap K Vora', role: 'Java Spring Boot Lead', type: 'SW Pool', reqId: '158938', client: 'State Of SC', status: 'Submitted' }
    ]
  },
  {
    date: '08/19/2026', recruiter: 'Ajay Arya', total: 1, newCount: 0, poolCount: 1, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Manoj Tiwari', role: 'Oracle Consultant', type: 'SW Pool', reqId: '158204', client: 'State of TX', status: 'Submitted' }
    ]
  },
  {
    date: '08/19/2026', recruiter: 'Bhanu Raman Budithi', total: 1, newCount: 1, poolCount: 0, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Sunil Gavaskar', role: 'Cybersecurity Analyst', type: 'NEW', reqId: '158766', client: 'State Of VA', status: 'Newly Added' }
    ]
  },
  {
    date: '08/19/2026', recruiter: 'Charan Teja Pappu', total: 1, newCount: 1, poolCount: 0, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Harsha Vardhan', role: 'React Frontend Developer', type: 'NEW', reqId: '157980', client: 'State of MN', status: 'Newly Added' }
    ]
  },
  {
    date: '08/19/2026', recruiter: 'JIH Resumes', total: 2, newCount: 2, poolCount: 0, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'James Anderson', role: 'Database Administrator', type: 'NEW', reqId: '158204', client: 'State of TX', status: 'Parsed & Added' },
      { name: 'Linda Brown', role: 'Project Coordinator', type: 'NEW', reqId: '158938', client: 'State Of SC', status: 'Parsed & Added' }
    ]
  },
  {
    date: '08/19/2026', recruiter: 'Kamlesh SmartHire', total: 1, newCount: 1, poolCount: 0, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Praveen Gupta', role: 'Solutions Architect', type: 'NEW', reqId: '158420', client: 'State of MN', status: 'Newly Added' }
    ]
  },
  {
    date: '08/19/2026', recruiter: 'Manikanta Siripalli', total: 1, newCount: 1, poolCount: 0, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Venkat Raman', role: 'Senior Data Engineer', type: 'NEW', reqId: '158310', client: 'State of CT', status: 'Newly Added' }
    ]
  },
  {
    date: '08/19/2026', recruiter: 'Omkesh Manjute', total: 2, newCount: 1, poolCount: 1, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Ashok Ankalla', role: 'Project Delivery Lead', type: 'SW Pool', reqId: '158766', client: 'State Of VA', status: 'Interview Scheduled' },
      { name: 'Vamshi Krishna Ganta', role: 'Senior Systems Analyst', type: 'NEW', reqId: '158112', client: 'State of NC', status: 'Newly Added' }
    ]
  },
  {
    date: '08/19/2026', recruiter: 'Sukamal Chatterjee', total: 2, newCount: 2, poolCount: 0, notPerf: '', submittedClient: '',
    candidates: [
      { name: 'Ashok Juttu Kannan', role: 'QA Automation Lead', type: 'NEW', reqId: '158420', client: 'State of MN', status: 'Newly Added' },
      { name: 'Goutham Gantala', role: 'Cloud Engineer AWS', type: 'NEW', reqId: '158766', client: 'State Of VA', status: 'Newly Added' }
    ]
  },
  {
    date: '08/19/2026', recruiter: 'Vaibhav Bisen', total: 2, newCount: 1, poolCount: 1, notPerf: 1, submittedClient: '',
    candidates: [
      { name: 'Ashok Kumar Rayapudi', role: 'Infrastructure Project Manager', type: 'NEW', reqId: '158938', client: 'State Of SC', status: 'Newly Added' },
      { name: 'Cx Avinash Ashokrao Mahajan', role: 'Senior Business Analyst', type: 'SW Pool', reqId: '158112', client: 'State of NC', status: 'Interview Scheduled' }
    ]
  }
]

// Exact Match Data for "Report of Candidates submitted by a recruiter for a given period" (media_1787314976453.png)
const mockSubmissionSummaryGrouped = [
  {
    submissionDate: '07-01-2026',
    assignedDate: '',
    recruiters: [
      { name: 'Raj Barve', reqs: '', total: 2 },
      { name: 'Sukamal Chatterjee', reqs: '', total: 2 },
      { name: 'Pankaj Maharwade', reqs: '', total: 1 },
      { name: 'JIH Resumes', reqs: '', total: 2 },
      { name: 'Ajay Arya', reqs: '', total: 4 },
      { name: 'Vaibhav Bisen', reqs: '', total: 1 },
      { name: 'Prudhvi Sevveti', reqs: '', total: 1 }
    ]
  },
  {
    submissionDate: '07-02-2026',
    assignedDate: '',
    recruiters: [
      { name: 'Vaibhav Bisen', reqs: '', total: 1 },
      { name: 'JIH Resumes', reqs: '', total: 2 },
      { name: 'Nishant Kathane', reqs: '', total: 1 },
      { name: 'Prudhvi Sevveti', reqs: '', total: 1 },
      { name: 'Omkesh Manjute', reqs: '', total: 1 },
      { name: 'Naveen Korimelli', reqs: '', total: 2 }
    ]
  },
  {
    submissionDate: '07-03-2026',
    assignedDate: '',
    recruiters: [
      { name: 'JIH Resumes', reqs: '', total: 1 }
    ]
  },
  {
    submissionDate: '07-05-2026',
    assignedDate: '',
    recruiters: [
      { name: 'JIH Resumes', reqs: '', total: 1 }
    ]
  },
  {
    submissionDate: '07-06-2026',
    assignedDate: '',
    recruiters: [
      { name: 'Raj Barve', reqs: '', total: 4 },
      { name: 'Omkesh Manjute', reqs: '', total: 1 },
      { name: 'Naveen Korimelli', reqs: '', total: 1 },
      { name: 'Sukamal Chatterjee', reqs: '', total: 4 },
      { name: 'Nishant Kathane', reqs: '', total: 1 }
    ]
  },
  {
    submissionDate: '07-07-2026',
    assignedDate: '',
    recruiters: [
      { name: 'Ajay Arya', reqs: '', total: 2 },
      { name: 'Vaibhav Bisen', reqs: '', total: 3 },
      { name: 'Prudhvi Sevveti', reqs: '', total: 2 },
      { name: 'JIH Resumes', reqs: '', total: 1 }
    ]
  },
  {
    submissionDate: '07-08-2026',
    assignedDate: '',
    recruiters: [
      { name: 'Raj Barve', reqs: '', total: 3 },
      { name: 'Omkesh Manjute', reqs: '', total: 2 },
      { name: 'Sukamal Chatterjee', reqs: '', total: 3 },
      { name: 'Pankaj Maharwade', reqs: '', total: 2 }
    ]
  },
  {
    submissionDate: '07-09-2026',
    assignedDate: '',
    recruiters: [
      { name: 'Vaibhav Bisen', reqs: '', total: 2 },
      { name: 'Naveen Korimelli', reqs: '', total: 3 },
      { name: 'JIH Resumes', reqs: '', total: 2 }
    ]
  },
  {
    submissionDate: '07-10-2026',
    assignedDate: '',
    recruiters: [
      { name: 'Ajay Arya', reqs: '', total: 3 },
      { name: 'Omkesh Manjute', reqs: '', total: 4 },
      { name: 'Sukamal Chatterjee', reqs: '', total: 2 }
    ]
  }
]

function Reports() {
  // Navigation Menus Structure (Exact Match to User's Screenshots)
  const reportCategories = [
    {
      id: 'summary',
      name: 'Summary',
      items: [
        { id: 'smarthire-careers-summary', label: 'SmartHire Careers Candidate Summary' },
        { id: 'resumes-added', label: 'Resumes Added (New vs Old)' },
        { id: 'submission-summary', label: 'Submission Summary' },
        { id: 'submission-details', label: 'Submission Details' },
        { id: 'daily-submission-summary', label: 'Daily Submission Summary' },
        { id: 'recruiters-performance', label: 'Recruiters performance summary' },
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

  // Active Category & Sub-Report State (Defaults to SmartHire Careers Candidate Summary)
  const [activeCategory, setActiveCategory] = useState('summary')
  const [activeSubReport, setActiveSubReport] = useState('smarthire-careers-summary')
  const [hoverCategory, setHoverCategory] = useState(null)

  // Filters State
  const [startDate, setStartDate] = useState('7/1/2026 8:29:04 AM')
  const [endDate, setEndDate] = useState('8/21/2026 8:29:04 AM')
  const [selectedOffice, setSelectedOffice] = useState('All')
  const [selectedRecruiter, setSelectedRecruiter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [reportPage, setReportPage] = useState(1)
  const [totalPages, setTotalPages] = useState(2)

  // Modal State for Candidate Details Breakdown
  const [detailsModalData, setDetailsModalData] = useState(null)

  // Switch Sub-report
  const handleSelectReport = (catId, subId) => {
    setActiveCategory(catId)
    setActiveSubReport(subId)
    setHoverCategory(null)
    setReportPage(1)
  }

  // Filter SmartHire Careers Candidates
  const filteredCareersCandidates = useMemo(() => {
    return mockSmartHireCareersCandidates.filter(c => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const text = `${c.fName} ${c.lName} ${c.email} ${c.phone} ${c.canId} ${c.reqId} ${c.status}`.toLowerCase()
        if (!text.includes(q)) return false
      }
      return true
    })
  }, [searchTerm])

  // Filter Resumes Added Rows
  const filteredResumesAdded = useMemo(() => {
    return mockResumesAddedRows.filter(row => {
      if (selectedRecruiter !== 'All' && selectedRecruiter !== 'ALL') {
        if (!row.recruiter.toLowerCase().includes(selectedRecruiter.toLowerCase())) return false
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const text = `${row.date} ${row.recruiter}`.toLowerCase()
        if (!text.includes(q)) return false
      }
      return true
    })
  }, [selectedRecruiter, searchTerm])

  // Filter grouped submissions by recruiter
  const filteredSummaryGroups = useMemo(() => {
    return mockSubmissionSummaryGrouped.map(group => {
      let filteredRecs = group.recruiters
      if (selectedRecruiter !== 'All' && selectedRecruiter !== 'ALL') {
        filteredRecs = group.recruiters.filter(r => r.name.toLowerCase().includes(selectedRecruiter.toLowerCase()))
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        filteredRecs = filteredRecs.filter(r => r.name.toLowerCase().includes(q) || group.submissionDate.includes(q))
      }
      return {
        ...group,
        recruiters: filteredRecs
      }
    }).filter(group => group.recruiters.length > 0)
  }, [selectedRecruiter, searchTerm])

  // Export to CSV / Excel
  const handleExportToExcel = () => {
    let headers = []
    let rows = []

    if (activeSubReport === 'smarthire-careers-summary') {
      headers = ['FNAME', 'LNAME', 'EMAIL', 'Phone No', 'Can ID', 'Req ID', 'Applied Date', 'Submission Status', 'Reject Reason', 'Comments']
      filteredCareersCandidates.forEach(c => {
        rows.push([
          `"${c.fName}"`, `"${c.lName}"`, `"${c.email}"`, `"${c.phone}"`, c.canId, c.reqId, `"${c.appliedDate}"`, `"${c.status}"`, `"${c.rejectReason}"`, `"${c.comments}"`
        ])
      })
    } else if (activeSubReport === 'resumes-added') {
      headers = ['Submission Date', 'Recruiter Name', 'Resumes Submitted', 'New', 'SW Pool', 'Not Performed', 'Submitted To Client']
      filteredResumesAdded.forEach(r => {
        rows.push([
          r.date, `"${r.recruiter}"`, r.total, r.newCount, r.poolCount, r.notPerf, `"${r.submittedClient}"`
        ])
      })
    } else if (activeSubReport === 'submission-summary') {
      headers = ['Assigned Date', 'Submission Date', 'Name', '# of Reqs', 'Total Submissions']
      filteredSummaryGroups.forEach(group => {
        group.recruiters.forEach(r => {
          rows.push([
            group.assignedDate, group.submissionDate, `"${r.name}"`, r.reqs, r.total
          ])
        })
      })
    } else {
      headers = ['Candidate ID', 'Applied Date', 'Submission Status']
      filteredCareersCandidates.forEach(c => {
        rows.push([c.canId, c.appliedDate, c.status])
      })
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

  return (
    <SiteLayout>
      <div style={{ background: '#f1f5f9', minHeight: '92vh', paddingBottom: '40px', fontFamily: 'Arial, sans-serif' }}>
        
        {/* ═══════════ TOP BREADCRUMB ═══════════ */}
        <div style={{ background: '#ffffff', borderBottom: '1px solid #cbd5e1', padding: '6px 18px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
            <span style={{ fontSize: '16px' }}>🏠</span>
            <Link to="/dashboard" style={{ color: '#0066cc', textDecoration: 'underline' }}>Home</Link>
          </div>
        </div>

        {/* ═══════════ BLUE 4-TAB NAVIGATION BAR ═══════════ */}
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
                      setHoverCategory(null)
                    }}
                    style={{
                      padding: '8px 26px',
                      fontSize: '12.5px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      background: isActiveCat ? '#50789d' : isHovered ? '#6188ac' : 'transparent',
                      borderRight: '1px solid #5a82a6',
                      borderLeft: '1px solid rgba(255,255,255,0.15)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{cat.name}</span>
                    <span style={{ fontSize: '9px', opacity: 0.75 }}>▼</span>
                  </div>

                  {/* Dropdown Menu on Hover (Hides immediately when mouse leaves) */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      minWidth: '270px',
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

        {/* ═══════════ MAIN REPORT VIEWER (EXACT MATCH TO SCREENSHOTS) ═══════════ */}
        <div style={{ padding: '0 16px', maxWidth: '100%', margin: '0 auto' }}>
          
          {/* Top Filter Controls Area */}
          <div style={{
            background: '#e9edf1', border: '1px solid #cbd5e1', borderTop: 'none', padding: '12px 18px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '11.5px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              
              {/* Start Date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Start Date</span>
                <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #94a3b8', borderRadius: '2px', padding: '2px 6px' }}>
                  <input
                    type="text"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    style={{ border: 'none', outline: 'none', fontSize: '11px', width: '150px' }}
                  />
                  <span style={{ cursor: 'pointer', fontSize: '12px' }}>📅</span>
                </div>
              </div>

              {/* End Date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>End Date</span>
                <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #94a3b8', borderRadius: '2px', padding: '2px 6px' }}>
                  <input
                    type="text"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={{ border: 'none', outline: 'none', fontSize: '11px', width: '150px' }}
                  />
                  <span style={{ cursor: 'pointer', fontSize: '12px' }}>📅</span>
                </div>
              </div>

              {/* Office & Recruiter (when in Resumes Added view) */}
              {activeSubReport === 'resumes-added' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Office</span>
                    <select value={selectedOffice} onChange={e => setSelectedOffice(e.target.value)} style={{ padding: '2px 6px', fontSize: '11px', border: '1px solid #94a3b8' }}>
                      <option value="All">All</option>
                      <option value="Columbia">Columbia</option>
                      <option value="Richmond">Richmond</option>
                      <option value="Austin">Austin</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Recruiter</span>
                    <select value={selectedRecruiter} onChange={e => setSelectedRecruiter(e.target.value)} style={{ padding: '2px 6px', fontSize: '11px', border: '1px solid #94a3b8' }}>
                      <option value="All">All</option>
                      <option value="Ajay Arya">Ajay Arya</option>
                      <option value="Ashwath S">Ashwath S</option>
                      <option value="Omkesh Manjute">Omkesh Manjute</option>
                      <option value="Sukamal Chatterjee">Sukamal Chatterjee</option>
                      <option value="Vaibhav Bisen">Vaibhav Bisen</option>
                    </select>
                  </div>
                </>
              )}

            </div>

            {/* View Report Button */}
            <div>
              <button
                type="button"
                onClick={() => alert(`Report refreshed for date range ${startDate} to ${endDate}`)}
                style={{
                  background: '#f1f5f9', border: '1px solid #94a3b8', padding: '5px 18px',
                  fontSize: '11.5px', fontWeight: 'bold', color: '#0f172a', cursor: 'pointer',
                  boxShadow: 'inset 0 1px 0 #ffffff, 0 1px 2px rgba(0,0,0,0.1)', borderRadius: '2px'
                }}
              >
                View Report
              </button>
            </div>
          </div>

          {/* ═══════════ SSRS / CRYSTAL REPORTS TOOLBAR ═══════════ */}
          <div style={{
            background: '#e9ebd4', border: '1px solid #cbd5e1', borderTop: 'none', padding: '4px 14px',
            display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px', color: '#334155'
          }}>
            {/* Page Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ cursor: 'pointer', fontSize: '11px', color: '#475569' }} onClick={() => setReportPage(1)} title="First Page">⏮</span>
              <span style={{ cursor: 'pointer', fontSize: '11px', color: '#475569' }} onClick={() => setReportPage(prev => Math.max(1, prev - 1))} title="Previous Page">◀</span>
              <input
                type="text"
                value={reportPage}
                onChange={e => setReportPage(parseInt(e.target.value) || 1)}
                style={{ width: '26px', textAlign: 'center', padding: '1px', fontSize: '11px', border: '1px solid #94a3b8', background: '#ffffff' }}
              />
              <span style={{ fontSize: '11px' }}>of {totalPages} ?</span>
              <span style={{ cursor: 'pointer', fontSize: '11px', color: '#475569' }} onClick={() => setReportPage(prev => Math.min(totalPages, prev + 1))} title="Next Page">▶</span>
              <span style={{ cursor: 'pointer', fontSize: '11px', color: '#475569' }} onClick={() => setReportPage(totalPages)} title="Last Page">⏭</span>
            </div>

            <div style={{ height: '14px', width: '1px', background: '#cbd5e1' }} />

            {/* Refresh */}
            <span style={{ cursor: 'pointer', fontSize: '13px' }} onClick={() => alert('Report data reloaded!')} title="Refresh">
              🔄
            </span>

            <div style={{ height: '14px', width: '1px', background: '#cbd5e1' }} />

            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search candidates, req#, email..."
                style={{ padding: '1px 6px', fontSize: '11px', border: '1px solid #94a3b8', width: '140px', background: '#ffffff' }}
              />
              <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline', fontSize: '11px' }} onClick={() => {}}>
                Find | Next
              </span>
            </div>

            <div style={{ height: '14px', width: '1px', background: '#cbd5e1' }} />

            {/* Export Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={handleExportToExcel} title="Export to Excel / CSV">
              <span>💾</span>
              <span style={{ fontSize: '10px' }}>▼</span>
            </div>

            {/* Print */}
            <span style={{ cursor: 'pointer', fontSize: '13px' }} onClick={() => window.print()} title="Print Report">
              🖨️
            </span>
          </div>

          {/* ═══════════ REPORT CONTENT CANVAS ═══════════ */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: 'none', padding: '16px 20px', minHeight: '520px' }}>
            
            {/* ─── 1. REPORT: SMARTHIRE CAREERS CANDIDATE SUMMARY (EXACT MATCH TO MEDIA_1787315422853.PNG) ─── */}
            {activeSubReport === 'smarthire-careers-summary' && (
              <div style={{ border: '1px solid #000000', padding: '12px', background: '#ffffff' }}>
                
                <h2 style={{ margin: '0 0 10px', fontSize: '20px', color: '#000000', fontWeight: 'bold', fontFamily: 'Georgia, serif' }}>
                  SmartHire Careers Candidate Summary
                </h2>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left', border: '1px solid #000000' }}>
                    <thead>
                      <tr style={{ background: '#ffffff', color: '#000000', borderBottom: '1px solid #000000' }}>
                        <th style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid #000000', width: '85px' }}>FNAME</th>
                        <th style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid #000000', width: '90px' }}>LNAME</th>
                        <th style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid #000000' }}>EMAIL</th>
                        <th style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid #000000', width: '85px' }}>Phone No</th>
                        <th style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid #000000', width: '55px', textAlign: 'center' }}>Can ID</th>
                        <th style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid #000000', width: '55px', textAlign: 'center' }}>Req ID</th>
                        <th style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid #000000', width: '130px', textAlign: 'center' }}>Applied Date</th>
                        <th style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid #000000', width: '135px' }}>Submission Status</th>
                        <th style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid #000000', width: '85px' }}>Reject Reason</th>
                        <th style={{ padding: '5px 8px', fontWeight: 'bold' }}>Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCareersCandidates.length === 0 ? (
                        <tr>
                          <td colSpan="10" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                            No candidate applications found from SmartHire Careers matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredCareersCandidates.map((c, idx) => (
                          <tr key={`${c.canId}-${c.reqId}-${idx}`} style={{ borderBottom: '1px solid #000000', background: '#ffffff' }}>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #000000' }}>{c.fName}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #000000' }}>{c.lName}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #000000', color: '#0066cc', wordBreak: 'break-all' }}>{c.email}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #000000' }}>{c.phone}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #000000', textAlign: 'center' }}>{c.canId}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #000000', textAlign: 'center', fontWeight: 'bold', color: '#0066cc' }}>{c.reqId}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #000000', textAlign: 'center', fontSize: '10.5px' }}>{c.appliedDate}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #000000' }}>{c.status}</td>
                            <td style={{ padding: '5px 8px', borderRight: '1px solid #000000' }}>{c.rejectReason}</td>
                            <td style={{ padding: '5px 8px', color: '#334155' }}>{c.comments}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* ─── 2. REPORT: RESUMES ADDED (MATCHING MEDIA_1787315254728.PNG) ─── */}
            {activeSubReport === 'resumes-added' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '18px', marginBottom: '12px' }}>
                  <h1 style={{ margin: 0, fontSize: '20px', color: '#1d4ed8', fontWeight: 'bold', letterSpacing: '-0.02em' }}>
                    Resumes Added
                  </h1>
                  <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#0f172a' }}>
                    Total No.of non performed days: 138
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', maxWidth: '780px', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left', border: '1px solid #cbd5e1' }}>
                    <thead>
                      <tr style={{ background: '#3b82f6', color: '#ffffff' }}>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold', width: '110px', borderRight: '1px solid #60a5fa' }}>Submission Date ↕</th>
                        <th style={{ padding: '6px 12px', fontWeight: 'bold', width: '170px', borderRight: '1px solid #60a5fa' }}>Recruiter Name ↕</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold', textAlign: 'center', width: '115px', borderRight: '1px solid #60a5fa' }}>Resumes Submitted</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold', textAlign: 'center', width: '45px', borderRight: '1px solid #60a5fa', background: '#2563eb' }}>New</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold', textAlign: 'center', width: '45px', borderRight: '1px solid #60a5fa', background: '#2563eb' }}>CW</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold', textAlign: 'center', width: '90px', borderRight: '1px solid #60a5fa' }}>Not Performed</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold', width: '120px', borderRight: '1px solid #60a5fa' }}>Submitted To Client</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold', textAlign: 'center', width: '60px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResumesAdded.map((row, idx) => (
                        <tr key={`${row.date}-${row.recruiter}-${idx}`} style={{
                          background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                          borderBottom: '1px solid #e2e8f0'
                        }}>
                          <td style={{ padding: '5px 8px', borderRight: '1px solid #cbd5e1', color: '#0f172a' }}>{row.date}</td>
                          <td style={{ padding: '5px 12px', borderRight: '1px solid #cbd5e1', color: '#0f172a' }}>{row.recruiter}</td>
                          <td style={{ padding: '5px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'center', color: '#0f172a' }}>{row.total}</td>
                          <td style={{ padding: '5px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: row.newCount > 0 ? '#16a34a' : '#0f172a', background: row.newCount > 0 ? '#f0fdf4' : 'transparent' }}>
                            {row.newCount}
                          </td>
                          <td style={{ padding: '5px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: row.poolCount > 0 ? '#0284c7' : '#0f172a', background: row.poolCount > 0 ? '#eff6ff' : 'transparent' }}>
                            {row.poolCount}
                          </td>
                          <td style={{ padding: '5px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'center', color: '#0f172a' }}>{row.notPerf}</td>
                          <td style={{ padding: '5px 8px', borderRight: '1px solid #cbd5e1', color: '#0f172a' }}>{row.submittedClient}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                            <span
                              onClick={() => setDetailsModalData(row)}
                              style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
                            >
                              Details
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── 3. REPORT: SUBMISSION SUMMARY (MATCHING MEDIA_1787314976453.PNG) ─── */}
            {activeSubReport === 'submission-summary' && (
              <div>
                <h3 style={{ margin: '0 0 14px', fontSize: '13px', color: '#0f172a', fontWeight: 'bold' }}>
                  Report of Candidates submitted by a recruiter for a given period
                </h3>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', maxWidth: '640px', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left', border: '1px solid #cbd5e1' }}>
                    <thead>
                      <tr style={{ background: '#555555', color: '#ffffff' }}>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold', width: '100px', borderRight: '1px solid #777777' }}>Assigned Date</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold', width: '110px', borderRight: '1px solid #777777', textAlign: 'center' }}>Submission Date</th>
                        <th style={{ padding: '6px 12px', fontWeight: 'bold', borderRight: '1px solid #777777', textAlign: 'center' }}>Name</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold', width: '70px', borderRight: '1px solid #777777', textAlign: 'center' }}># of Reqs</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold', width: '110px', textAlign: 'center' }}>Total Submissions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSummaryGroups.map((group, gIdx) => (
                        <React.Fragment key={group.submissionDate}>
                          {group.recruiters.map((rec, rIdx) => (
                            <tr key={`${group.submissionDate}-${rec.name}-${rIdx}`} style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                              {rIdx === 0 && (
                                <td rowSpan={group.recruiters.length} style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                                  {group.assignedDate}
                                </td>
                              )}
                              {rIdx === 0 && (
                                <td rowSpan={group.recruiters.length} style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', verticalAlign: 'top', textAlign: 'center' }}>
                                  {group.submissionDate}
                                </td>
                              )}
                              <td style={{ padding: '5px 12px', borderRight: '1px solid #cbd5e1', color: '#0f172a' }}>{rec.name}</td>
                              <td style={{ padding: '5px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'center', color: '#475569' }}>{rec.reqs || ''}</td>
                              <td style={{ padding: '5px 8px', textAlign: 'center', color: '#0f172a' }}>{rec.total}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* ═══════════ RESUME DETAILS POPUP / MODAL ═══════════ */}
        {detailsModalData && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}>
            <div style={{ background: '#ffffff', borderRadius: '6px', maxWidth: '680px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
              <div style={{ background: '#1e3a8a', color: '#ffffff', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                  Candidate Breakdown - {detailsModalData.recruiter} ({detailsModalData.date})
                </span>
                <span style={{ cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }} onClick={() => setDetailsModalData(null)}>✕</span>
              </div>

              <div style={{ padding: '16px', maxHeight: '420px', overflowY: 'auto', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', gap: '16px', background: '#eff6ff', padding: '8px 12px', borderRadius: '4px', marginBottom: '14px' }}>
                  <div><strong>Total Submitted:</strong> <span style={{ color: '#1e3a8a' }}>{detailsModalData.total}</span></div>
                  <div><strong>New Resumes:</strong> <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{detailsModalData.newCount}</span></div>
                  <div><strong>Existing / SW Pool:</strong> <span style={{ color: '#0284c7', fontWeight: 'bold' }}>{detailsModalData.poolCount}</span></div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#e2e8f0', color: '#0f172a' }}>
                      <th style={{ padding: '6px 8px' }}>Candidate Name</th>
                      <th style={{ padding: '6px 8px' }}>Role</th>
                      <th style={{ padding: '6px 8px' }}>Source Type</th>
                      <th style={{ padding: '6px 8px' }}>Req #</th>
                      <th style={{ padding: '6px 8px' }}>Client</th>
                      <th style={{ padding: '6px 8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailsModalData.candidates && detailsModalData.candidates.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#0066cc' }}>{c.name}</td>
                        <td style={{ padding: '6px 8px' }}>{c.role}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{
                            padding: '1px 5px', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold',
                            background: c.type === 'NEW' ? '#dcfce7' : '#e0e7ff',
                            color: c.type === 'NEW' ? '#166534' : '#3730a3'
                          }}>
                            {c.type}
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px' }}>{c.reqId}</td>
                        <td style={{ padding: '6px 8px' }}>{c.client}</td>
                        <td style={{ padding: '6px 8px', color: '#16a34a', fontWeight: 'bold' }}>{c.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '8px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setDetailsModalData(null)}
                  style={{ background: '#e2e8f0', border: '1px solid #94a3b8', padding: '4px 14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ ORANGE FOOTER ═══════════ */}
        <footer style={{ background: '#ea580c', borderTop: '2px solid #c2410c', color: '#ffffff', textAlign: 'center', padding: '10px', marginTop: '40px', fontSize: '11px', fontWeight: 'bold' }}>
          © SmartHire LLC | All rights reserved | Release 1.9 06-May-2025 (New Server 2023 Aug)
        </footer>

      </div>
    </SiteLayout>
  )
}

export default Reports
