import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SiteLayout from '../components/SiteLayout'
import CandidatePdfReportModal from '../components/CandidatePdfReportModal'

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

function parseResumeDetails(text, filename = '') {
  let firstName = ''
  let lastName = ''
  let email = ''
  let phone = ''
  let city = 'Richmond'
  let state = 'VA'
  let zip = '23173'
  let exp = '14'
  let jobTitle = 'Network Administrator / Consultant'

  if (text) {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    if (emailMatch) email = emailMatch[0]

    const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/)
    if (phoneMatch) phone = phoneMatch[0]

    const locMatch = text.match(/([A-Z][a-zA-Z\s]{2,15}),\s*([A-Z]{2})(?:\s*(\d{5}))?/)
    if (locMatch) {
      city = locMatch[1].trim()
      state = locMatch[2].trim()
      if (locMatch[3]) zip = locMatch[3].trim()
    }

    const expMatch = text.match(/(\d{1,2})\+?\s*(?:years|yrs)/i)
    if (expMatch) exp = expMatch[1]

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length > 0) {
      const nameParts = lines[0].replace(/[^a-zA-Z\s]/g, '').split(' ').filter(Boolean)
      if (nameParts.length >= 2) {
        firstName = nameParts[0]
        lastName = nameParts.slice(1).join(' ')
      } else if (nameParts.length === 1) {
        firstName = nameParts[0]
        lastName = 'Candidate'
      }
    }
  }

  if (!firstName && filename) {
    const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z\s_-]/g, ' ')
    const parts = cleanName.split(/[\s_-]+/).filter(Boolean)
    if (parts.length >= 2) {
      firstName = parts[0]
      lastName = parts[1]
    } else if (parts.length === 1) {
      firstName = parts[0]
      lastName = 'Candidate'
    }
  }

  return {
    firstName: firstName || 'Ashok',
    lastName: lastName || 'Ganta',
    email: email || 'ashok57800@gmail.com',
    phone: phone || '571-660-5778',
    city: city || 'Richmond',
    state: state || 'VA',
    zip: zip || '23173',
    exp: exp || '14',
    jobTitle: jobTitle || 'VDOT Network Administrator 4',
    resumeTitle: filename ? filename.replace(/\.[^/.]+$/, '') : `${firstName || 'Candidate'}_Resume`,
  }
}

// ─── RICH MOCK CANDIDATES (EXACT MATCH TO MEDIA_1787312540212.PNG) ───
const legacyCandidateData = [
  { id: '87501', name: 'Ashok Ankalla', role: 'Project ..', fullRole: 'Project Manager / Delivery Lead', exp: '18', location: 'Plainsboro,NJ', city: 'Plainsboro', state: 'NJ', locPref: '', payRate: '60 /hr', rateType: 'C2C', rating: 5, subVendor: '??????????????.', recruiter: 'Vaibhav Bisen', agrExists: false, avblDate: 'Aug 13, 2026', email: 'a.ankalla@gmail.com', phone: '609-555-1201', workAuth: 'GC', screened: 'Yes' },
  { id: '87534', name: 'Ashok Ganta', role: 'VDOT Net..', fullRole: 'VDOT Network Administrator 4 (807536)', exp: '14', location: 'Richmond,VA', city: 'Richmond', state: 'VA', locPref: '', payRate: '74 /hr', rateType: 'C2C', rating: 1, subVendor: 'Talent9 Inc', recruiter: 'Omkesh Manjute', agrExists: false, avblDate: 'Aug 31, 2026', email: 'ashok57800@gmail.com', phone: '571-660-5778', workAuth: 'GC', screened: 'Yes' },
  { id: '87503', name: 'Vadivelu Ashok Kumar', role: 'DCY - IT..', fullRole: 'DCY - IT Lead Architect', exp: '12', location: 'Minneapolis,MN', city: 'Minneapolis', state: 'MN', locPref: '', payRate: '75 /hr', rateType: 'C2C', rating: 1, subVendor: 'Paramount Software Solutions', recruiter: 'Prudhvi', agrExists: false, avblDate: 'Apr 30, 2026', email: 'vadivelu.kumar@paramount.com', phone: '612-555-8821', workAuth: 'H1B', screened: 'Yes' },
  { id: '87504', name: 'Ashok Rajendran', role: 'Applicat..', fullRole: 'Application Developer Senior', exp: '13', location: 'Omaha,NE', city: 'Omaha', state: 'NE', locPref: '', payRate: '74 /hr', rateType: 'C2C', rating: 1, subVendor: 'Ardor IT Systems INC', recruiter: 'Sukamal Chatterjee', agrExists: false, avblDate: 'Mar 31, 2026', email: 'ashok.raj@ardorit.com', phone: '402-555-0912', workAuth: 'GC', screened: 'Yes' },
  { id: '87505', name: 'Upendra Ganta', role: 'Data Eng..', fullRole: 'Data Engineer / Snowflake Lead', exp: '11', location: 'Hartford,CT', city: 'Hartford', state: 'CT', locPref: '', payRate: '60 /hr', rateType: 'C2C', rating: 1, subVendor: '??????????????.', recruiter: 'Omkesh Manjute', agrExists: false, avblDate: 'Feb 10, 2026', email: 'upendra.ganta@cloudtek.io', phone: '860-555-4421', workAuth: 'US Citizen', screened: 'Yes' },
  { id: '87506', name: 'Ashok Kumar Rayapudi', role: 'Project ..', fullRole: 'Project Manager - Infrastructure', exp: '17', location: 'Novi,MI', city: 'Novi', state: 'MI', locPref: '', payRate: '85 /hr', rateType: 'C2C', rating: 5, subVendor: 'IConnect', recruiter: 'Vaibhav Bisen', agrExists: false, avblDate: 'Jan 19, 2026', email: 'ashok.rayapudi@iconnect.com', phone: '248-555-3312', workAuth: 'US Citizen', screened: 'Yes' },
  { id: '87507', name: 'Goutham Gantala', role: 'Cloud En..', fullRole: 'Cloud Engineer / AWS Solutions', exp: '11', location: 'Bayonne,NY', city: 'Bayonne', state: 'NY', locPref: '', payRate: '78 /hr', rateType: 'C2C', rating: 1, subVendor: 'Cloud TechnoSoft LLC', recruiter: 'Nitin Bhosale', agrExists: false, avblDate: 'Dec 31, 2025', email: 'goutham.g@technosoft.com', phone: '201-555-9081', workAuth: 'H1B', screened: 'Yes' },
  { id: '87508', name: 'Vamshi Krishna Ganta', role: 'TAX - Sr..', fullRole: 'TAX - Senior Systems Analyst', exp: '8', location: 'Woodbridge,NJ', city: 'Woodbridge', state: 'NJ', locPref: '', payRate: '60 /hr', rateType: 'C2C', rating: 1, subVendor: 'Client Server Technologies', recruiter: 'Omkesh Manjute', agrExists: false, avblDate: 'Dec 31, 2025', email: 'vamshi.ganta@clientserver.com', phone: '732-555-6671', workAuth: 'GC', screened: 'Yes' },
  { id: '87509', name: 'Nagababu Ganta', role: 'Oracle D..', fullRole: 'Oracle DBA / PL-SQL Specialist', exp: '13', location: 'Katy,TX', city: 'Katy', state: 'TX', locPref: '', payRate: '63 /hr', rateType: 'C2C', rating: 5, subVendor: '??????????????.', recruiter: 'Vaibhav Bisen', agrExists: false, avblDate: 'Oct 9, 2025', email: 'nagababu.g@oracletech.net', phone: '281-555-1190', workAuth: 'GC', screened: 'Yes' },
  { id: '87510', name: 'Ashok Juttu Kannan', role: 'QA', fullRole: 'QA Automation Lead (Selenium/Cypress)', exp: '19', location: 'Louisville,KY', city: 'Louisville', state: 'KY', locPref: '', payRate: '40 /hr', rateType: 'C2C', rating: 1, subVendor: 'SmartHire LLC', recruiter: 'Sukamal Chatterjee', agrExists: false, avblDate: 'Oct 1, 2024', email: 'ashok.jk@smarthire.com', phone: '502-555-8721', workAuth: 'US Citizen', screened: 'Yes' },
  { id: '87511', name: 'Naga Babu Ganta', role: 'Database..', fullRole: 'Database Engineer - PostgreSQL / AWS', exp: '13', location: 'Katy,TX', city: 'Katy', state: 'TX', locPref: '', payRate: '70 /hr', rateType: 'C2C', rating: 5, subVendor: '??????????????.', recruiter: 'Omkesh Manjute', agrExists: false, avblDate: 'Oct 3, 2025', email: 'naga.ganta@katytech.io', phone: '281-555-7612', workAuth: 'US Citizen', screened: 'Yes' },
  { id: '87512', name: 'Cx Avinash Ashokrao Mahajan', role: 'Senior B..', fullRole: 'Senior Business Systems Analyst', exp: '16', location: 'Raleigh,NC', city: 'Raleigh', state: 'NC', locPref: '', payRate: '55 /hr', rateType: 'W2', rating: 1, subVendor: 'SmartHire LLC', recruiter: 'Vaibhav Bisen', agrExists: true, avblDate: 'May 14, 2025', email: 'avinash.mahajan@smarthire.com', phone: '919-555-0918', workAuth: 'US Citizen', screened: 'Yes' },
  { id: '87513', name: 'Naga Babu Ganta', role: 'Database..', fullRole: 'Database Administrator Senior', exp: '13', location: 'Houston,TX', city: 'Houston', state: 'TX', locPref: '', payRate: '65 /hr', rateType: 'C2C', rating: 1, subVendor: '??????????????.', recruiter: 'Prudhvi', agrExists: false, avblDate: 'Sep 3, 2025', email: 'naga.houston@databasedev.com', phone: '713-555-9921', workAuth: 'GC', screened: 'Yes' },
  { id: '87514', name: 'Ashok Ankalla', role: 'Project ..', fullRole: 'Project Coordinator / Scrum Master', exp: '18', location: 'Bentonville,AR', city: 'Bentonville', state: 'AR', locPref: '', payRate: '60 /hr', rateType: 'C2C', rating: 1, subVendor: '??????????????.', recruiter: 'Omkesh Manjute', agrExists: false, avblDate: 'Aug 29, 2025', email: 'ashok.a.benton@retailtech.com', phone: '479-555-1120', workAuth: 'US Citizen', screened: 'Yes' },
  { id: '87515', name: 'Tirumala Ashok Varmadantuluri', role: 'SCC - Sr..', fullRole: 'SCC - Senior Network Architect', exp: '16', location: 'Ashburn,VA', city: 'Ashburn', state: 'VA', locPref: '', payRate: '71 /hr', rateType: 'C2C', rating: 1, subVendor: 'Ameritech Global INC', recruiter: 'Nitin Bhosale', agrExists: false, avblDate: 'Jun 17, 2025', email: 'tirumala.v@ameritech.com', phone: '571-555-3341', workAuth: 'GC', screened: 'Yes' },
  { id: '87516', name: 'Priyanka Gantareddy', role: 'Senior Q..', fullRole: 'Senior Quality Assurance Lead', exp: '16', location: 'Austin,TX', city: 'Austin', state: 'TX', locPref: '', payRate: '60 /hr', rateType: 'C2C', rating: 5, subVendor: '??????????????.', recruiter: 'Omkesh Manjute', agrExists: false, avblDate: 'Feb 26, 2025', email: 'priyanka.ganta@austintech.com', phone: '512-555-7721', workAuth: 'US Citizen', screened: 'Yes' },
  { id: '87517', name: 'Nagajyothsna Ch Ganta', role: 'ERFO-ISD..', fullRole: 'ERFO-ISD Developer / Analyst', exp: '10', location: 'Ceref,CA', city: 'Ceref', state: 'CA', locPref: '', payRate: '65 /hr', rateType: 'C2C', rating: 1, subVendor: 'SmartHire LLC', recruiter: 'Vaibhav Bisen', agrExists: false, avblDate: 'Feb 13, 2025', email: 'nagajyothsna@smarthire.com', phone: '408-555-6671', workAuth: 'H1B', screened: 'Yes' },
  { id: '87518', name: 'Triveni Ganta', role: '.Net Dev..', fullRole: '.Net Core / Angular Full Stack Developer', exp: '8', location: 'Minneapolis,MN', city: 'Minneapolis', state: 'MN', locPref: '', payRate: '55 /hr', rateType: 'C2C', rating: 1, subVendor: 'Origin Tek Solutions', recruiter: 'Sukamal Chatterjee', agrExists: false, avblDate: 'Jan 22, 2025', email: 'triveni.ganta@origintek.com', phone: '612-555-1234', workAuth: 'H1B', screened: 'Yes' },
  { id: '87519', name: 'Ashok Anakalla', role: 'Technica..', fullRole: 'Technical Lead / Solution Architect', exp: '18', location: 'Herndon,VA', city: 'Herndon', state: 'VA', locPref: '', payRate: '68 /hr', rateType: 'C2C', rating: 1, subVendor: '??????????????.', recruiter: 'Omkesh Manjute', agrExists: false, avblDate: 'Jan 13, 2025', email: 'ashok.anakalla@herndontech.com', phone: '703-555-9012', workAuth: 'US Citizen', screened: 'Yes' },
  { id: '87520', name: 'Ashok Kumar Dodda', role: 'Cloud En..', fullRole: 'Cloud Enterprise Solutions Architect', exp: '13', location: 'Dallas,TX', city: 'Dallas', state: 'TX', locPref: '', payRate: '75 /hr', rateType: 'C2C', rating: 1, subVendor: 'E-Solutions Inc', recruiter: 'Vaibhav Bisen', agrExists: false, avblDate: 'Dec 12, 2024', email: 'ashok.dodda@esolutions.com', phone: '214-555-4431', workAuth: 'GC', screened: 'Yes' },
  { id: '87521', name: 'Ashok Reddy', role: 'Software..', fullRole: 'Software Engineer Lead (Java/Cloud)', exp: '14', location: 'Fishers,IN', city: 'Fishers', state: 'IN', locPref: '', payRate: '65 /hr', rateType: 'C2C', rating: 1, subVendor: '??????????????.', recruiter: 'Prudhvi', agrExists: false, avblDate: 'Dec 23, 2024', email: 'ashok.reddy@indydigital.com', phone: '317-555-8812', workAuth: 'US Citizen', screened: 'Yes' },
  { id: '87522', name: 'Ashok Bellala', role: 'Java Dev..', fullRole: 'Java Developer / Microservices', exp: '13', location: 'Columbus,OH', city: 'Columbus', state: 'OH', locPref: '', payRate: '60 /hr', rateType: '1099', rating: 1, subVendor: '48170', recruiter: 'Omkesh Manjute', agrExists: false, avblDate: 'Aug 25, 2020', email: 'ashok.bellala@ohiodata.org', phone: '614-555-0912', workAuth: 'GC', screened: 'Yes' },
  { id: '87523', name: 'Ashok Mundlamuri', role: 'NCDIT - ..', fullRole: 'NCDIT - Systems Security Specialist', exp: '12', location: 'North Brunswick,NJ', city: 'North Brunswick', state: 'NJ', locPref: '', payRate: '65 /hr', rateType: 'C2C', rating: 1, subVendor: '??????????????.', recruiter: 'Vaibhav Bisen', agrExists: false, avblDate: 'Sep 25, 2024', email: 'ashok.mundlamuri@njtech.io', phone: '732-555-1823', workAuth: 'US Citizen', screened: 'Yes' },
  { id: '87524', name: 'Ashok Natarajan', role: 'Project ..', fullRole: 'Project Manager - Enterprise ERP', exp: '17', location: 'Irving,TX', city: 'Irving', state: 'TX', locPref: '', payRate: '80 /hr', rateType: 'C2C', rating: 1, subVendor: 'Paramount Software Solutions', recruiter: 'Nitin Bhosale', agrExists: false, avblDate: 'Aug 28, 2024', email: 'ashok.natarajan@paramount.com', phone: '972-555-6671', workAuth: 'US Citizen', screened: 'Yes' },
  { id: '87525', name: 'Sri Sai Tejasvi Gantakolla', role: 'Power Pl..', fullRole: 'Power Platform / Dynamics 365 Architect', exp: '10', location: 'Memphis,TN', city: 'Memphis', state: 'TN', locPref: '', payRate: '65 /hr', rateType: 'C2C', rating: 1, subVendor: 'SmartHire LLC', recruiter: 'Sukamal Chatterjee', agrExists: false, avblDate: 'Aug 22, 2024', email: 'tejasvi.ganta@smarthire.com', phone: '901-555-7781', workAuth: 'GC', screened: 'Yes' }
]

function RecruiterDashboard() {
  const [jobs, setJobs] = useState([])
  const [candidates, setCandidates] = useState(legacyCandidateData)
  
  // ─── DYNAMIC TEAM USERS & MULTI-LEVEL RBAC ───
  const DEFAULT_USERS_LIST = [
    { id: 'rec-1', name: 'Omkesh', email: 'omkesh@coolsofttech.com', role: 'superadmin', refCode: 'omkesh', company: 'SmartHire LLC', isActive: true, password: 'admin' },
    { id: 'rec-2', name: 'Sukamal Chatterjee', email: 'kamal@coolsofttech.com', role: 'recruiter', refCode: 'sukamal-chatterjee', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' },
    { id: 'rec-3', name: 'Raj', email: 'raj@coolsofttech.com', role: 'recruiter', refCode: 'raj', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' },
    { id: 'rec-4', name: 'Vaibhav Bisen', email: 'vaibhav@coolsofttech.com', role: 'recruiter', refCode: 'vaibhav-bisen', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' },
    { id: 'rec-5', name: 'Pankaj', email: 'pankajm@coolsofttech.com', role: 'recruiter', refCode: 'pankaj', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' },
    { id: 'emp-1', name: 'Rahul Sharma', email: 'rahul.s@coolsofttech.com', role: 'employee', parentRecruiterName: 'Vaibhav Bisen', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' },
    { id: 'emp-2', name: 'Priya Verma', email: 'priya.v@coolsofttech.com', role: 'employee', parentRecruiterName: 'Sukamal Chatterjee', company: 'SmartHire LLC', isActive: true, password: 'recruiter123' }
  ]

  const [teamUsers, setTeamUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_recruiters')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {}
    return DEFAULT_USERS_LIST
  })

  const saveTeamUsers = (updatedList) => {
    setTeamUsers(updatedList)
    try {
      localStorage.setItem('smarthire_recruiters', JSON.stringify(updatedList))
    } catch (e) {}
  }

  // User auth state & RBAC detection
  const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user')
  let currentUser = null
  try {
    if (userStr) currentUser = JSON.parse(userStr)
  } catch (e) {}

  const userName = currentUser?.name || currentUser?.displayName || 'Omkesh'
  const activeRoleOverride = localStorage.getItem('smarthire_active_role')
  const userRole = activeRoleOverride || currentUser?.role || (userName.toLowerCase().includes('omkesh') ? 'superadmin' : 'recruiter')
  
  const isAdmin = userRole === 'superadmin' || userRole === 'admin'
  const isRecruiter = userRole === 'recruiter'
  const isEmployee = userRole === 'employee'
  const isRecruiterRole = !isAdmin // True for recruiters and employees

  // Top Nav Tab: 'requisitions' | 'candidates' | 'admin'
  const [activeMainTab, setActiveMainTab] = useState('requisitions')

  // Navigation Flow State: 'portal' | 'requisition' | 'resumeSearch' | 'resumeSubmission'
  const [viewMode, setViewMode] = useState('portal')
  const [selectedReq, setSelectedReq] = useState(null)
  const [activeReqTab, setActiveReqTab] = useState('details')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [quickSearchId, setQuickSearchId] = useState('')
  const [showFilterPanel, setShowFilterPanel] = useState(true)

  // User Management Modal State (Admin / Recruiter adding employee)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'recruiter',
    parentRecruiterName: '',
    company: 'SmartHire LLC',
    isActive: true
  })
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('All')

  // Candidate Quick Add Modal State for Requisition Detail
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false)
  const [newCandReqForm, setNewCandReqForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    payRate: '70',
    payRateType: 'C2C',
    workAuth: 'US Citizen',
    exp: '6',
    skills: '',
    comments: 'Sourced directly for this requirement',
    status: 'Int-SubmittedToManager'
  })

  // ─── SEARCH REQUISITIONS FILTER STATE ───
  const [reqFilters, setReqFilters] = useState({
    reqId: '',
    title: '',
    skills: '',
    city: '',
    state: 'Select State',
    office: 'All',
    assignedTo: 'Any',
    zipCode: '',
    radius: 'Within Miles',
    category: 'Select Req Category',
    creationDate: '',
    deadlineDate: '',
    status: 'Select Status',
    endClient: 'Any',
    govtReqs: false,
    directClient: false,
    working: false,
    keyReq: false,
    hotReq: false,
    incumbentVendor: false,
    subcontractable: 'Select',
    reqType: 'Select Req Type'
  })

  // ─── SEARCH CANDIDATES FILTER STATE (IMAGE 1787312030395) ───
  const [candFilters, setCandFilters] = useState({
    candidateId: '',
    name: '',
    email: '',
    skills: '',
    city: '',
    state: 'Select',
    jobTitle: '',
    zipCode: '',
    radius: 'Select Miles',
    experience: '',
    workAuth: 'Any',
    assignedTo: isRecruiterRole ? userName : 'Any',
    subVendor: 'Select',
    availabilityDate: 'Any',
    securityClearance: false,
    rating: 0,
    currentEmployees: false,
    workPermit: 'All',
    officeLocation: 'All',
    skyped: false,
    screenedStatus: 'All'
  })

  // Requisition Edit Fields
  const [editingFields, setEditingFields] = useState({})

  // Dual Listbox for Assign to Recruiters
  const [availableRecruiters, setAvailableRecruiters] = useState([
    'Admin Blr', 'AI Agent', 'Ajay Arya', 'Anand Krishnamurthy', 'Deepak Joshi', 'Nitin Bhosale', 'Rahul Sharma', 'Priya Verma'
  ])
  const [assignedRecruiters, setAssignedRecruiters] = useState(['Vaibhav Bisen'])
  const [selectedAvailable, setSelectedAvailable] = useState([])
  const [selectedAssigned, setSelectedAssigned] = useState([])

  // Attachments List
  const [attachments, setAttachments] = useState([
    { id: 1, title: '13285 - Admin - 158938', filename: '13285 - Admin - 158938.docx' },
    { id: 2, title: 'SCMSP_Candidate_Cover_Sheet - 158938', filename: 'SCMSP_Candidate_Cover_Sheet - 158938.docx' },
    { id: 3, title: 'SSN References - 158938', filename: 'SSN References - 158938.doc' },
    { id: 4, title: 'Right_to_Represent_SOSC - 158938', filename: 'Right_to_Represent_SOSC - 158938.pdf' },
  ])
  const [showAddAttachment, setShowAddAttachment] = useState(false)
  const [newAttachmentTitle, setNewAttachmentTitle] = useState('')
  const [newAttachmentFile, setNewAttachmentFile] = useState(null)

  // Potential Candidates Attached to Requisition
  const [potentialCandidates, setPotentialCandidates] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_potential_candidates_158938')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return [
      {
        id: '87534',
        name: 'Ashok Ganta',
        payRate: '74/hr',
        payRateType: 'C2C',
        assignedBy: 'Prudhvi',
        assignedOn: 'Aug 20, 2026 04:40 PM',
        status: 'Int-SubmittedToManager',
        statusComments: 'Submitted',
        interview: 'Select',
        rejectedReason: 'Select',
        lastChangedBy: 'Prudhvi',
        lastChangedRole: 'Recruiter',
        lastChangedOn: 'Aug 20, 2026 04:40 PM'
      },
      {
        id: '87535',
        name: 'Kashyap K Vora',
        payRate: '55/hr',
        payRateType: 'W2',
        assignedBy: 'Vaibhav',
        assignedOn: 'Aug 20, 2026 06:41 PM',
        status: 'Int-SubmittedToManager',
        statusComments: 'Submitted',
        interview: 'Select',
        rejectedReason: 'Select',
        lastChangedBy: 'Vaibhav',
        lastChangedRole: 'Recruiter',
        lastChangedOn: 'Aug 20, 2026 06:41 PM'
      }
    ]
  })

  // Notification toast on save
  const [saveToastMessage, setSaveToastMessage] = useState(null)

  // Handler to update candidate submission status and record audit log (Who changed it, role, timestamp)
  const handleUpdatePotentialCandidate = (candId, field, value) => {
    const userRoleDisplay = currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || userName.toLowerCase().includes('omkesh') ? 'Manager' : 'Recruiter'
    const timeString = new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })

    setPotentialCandidates(prev => {
      const updated = prev.map(c => {
        if (c.id === candId) {
          return {
            ...c,
            [field]: value,
            lastChangedBy: userName,
            lastChangedRole: userRoleDisplay,
            lastChangedOn: timeString,
            history: [
              ...(c.history || []),
              {
                field,
                value,
                by: userName,
                role: userRoleDisplay,
                on: timeString
              }
            ]
          }
        }
        return c
      })
      try {
        localStorage.setItem('smarthire_potential_candidates_158938', JSON.stringify(updated))
      } catch (e) {}
      return updated
    })
  }

  // Step 1: Resume Search state
  const [searchCandFilter, setSearchCandFilter] = useState({
    candidateId: '',
    name: '',
    email: '',
    skills: '',
    city: '',
    state: 'Select',
    zipCode: '',
    radius: 'Select Miles',
    experience: '',
    workAuth: 'Any',
    screened: 'All',
    assignedTo: 'Any',
    availability: 'Any'
  })

  // Add New Candidate Form state (Step 1 -> Step 2)
  const [newCandForm, setNewCandForm] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    exp: '',
    city: '',
    state: 'Select',
    zip: '',
    resumeTitle: '',
    resumeFile: null,
    isParsing: false,
    parseSuccess: false
  })

  // Step 2: Resume Submission Form state
  const [activeSubTab, setActiveSubTab] = useState('details')
  const [submissionCandidate, setSubmissionCandidate] = useState({
    id: '87534',
    firstName: 'Ashok',
    lastName: 'Ganta',
    email: 'ashok57800@gmail.com',
    payRateMin: '74',
    payRateMax: '74',
    rateUnit: 'per hour',
    rateType: 'C2C',
    availableDate: '8/31/2026',
    dob: '',
    source: 'Other',
    subVendor: 'Talent9 Inc',
    jobTitle: 'VDOT Network Administrator 4 (807536)',
    phoneCell: '571-660-5778',
    phoneHome: '',
    phoneWork: '',
    address: '4430 Broad Rd.',
    city: 'Richmond',
    state: 'VA',
    zip: '23173',
    workAuth: 'GC',
    relocate: 'No',
    currentlyWorking: true,
    resumeName: 'Ashok Ganta- Network Engineer.docx',
    placementPref: '',
    ssnLast4: '****',
    experienceYears: '14',
    overallRating: 4,
    technicalRating: 5,
    commSkill: 4,
    securityClearance: false,
    proposedBillRate: '90',
    proposedPayRate: '74',
    proposedRateType: 'C2C',
    comments: '',
    interactionNotes: [
      {
        id: 1,
        note: 'I have 14 years of experience in designing and optimizing secure, high-performance network infrastructures across Hardware Systems, Operating Systems and enterprise Network Technologies. Proficient in hybrid cloud networking using Microsoft Azure, AWS, GCP, Cisco Routers, Cisco Switches and Cisco Meraki Wireless technologies to ensure scalability and security.',
        author: 'Sukamal Chatterjee',
        date: 'Aug 3, 2026 03:08 PM'
      },
      {
        id: 2,
        note: 'https://www.linkedin.com/in/ashoknetworkengineer/',
        author: 'Sukamal Chatterjee',
        date: 'Aug 3, 2026 03:07 PM'
      },
      {
        id: 3,
        note: 'Current Location: Richmond, Virginia',
        author: 'Sukamal Chatterjee',
        date: 'Aug 3, 2026 03:06 PM'
      }
    ],
    submissionHistory: [
      {
        reqId: '158766',
        title: 'VDOT Network Administrator 4 (807536) - ',
        startDate: '-',
        endDate: '-',
        endClient: 'State Of VA',
        billRate: '90/hr',
        payRate: '74/hr'
      }
    ]
  })
  const [newNoteText, setNewNoteText] = useState('')

  // All Available Recruiters & Employees (Dynamically derived from managed team)
  const allRecruitersList = useMemo(() => {
    return teamUsers.filter(u => u.isActive !== false).map(u => ({
      id: u.id,
      name: u.name,
      role: u.role === 'superadmin' || u.role === 'admin' ? 'Manager / Superadmin' : u.role === 'employee' ? `Employee (${u.parentRecruiterName ? 'reports to ' + u.parentRecruiterName : 'Team Member'})` : 'Recruiter',
      email: u.email,
      parentRecruiterName: u.parentRecruiterName,
      rawRole: u.role
    }))
  }, [teamUsers])

  const getJobAssignedRecruiters = (jobId) => {
    try {
      const cleanId = String(jobId || '').replace('J-', '')
      const saved = localStorage.getItem(`smarthire_req_assigned_${cleanId}`) || localStorage.getItem(`smarthire_req_assigned_J-${cleanId}`)
      if (saved !== null && saved !== undefined) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {}
    return [] // Default is completely empty if not assigned
  }

  // Fetch jobs
  useEffect(() => {
    const token = localStorage.getItem('smarthire_token') || ''
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

    fetch('/api/jobs', { headers })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.jobs || data.data || []
        const mapped = list.map(j => ({
          ...j,
          assignedRecruiters: getJobAssignedRecruiters(j.id)
        }))
        setJobs(mapped)
      })
      .catch(err => console.error('Failed to load jobs:', err))
  }, [])

  // Handler to save recruiter assignments specifically
  const handleSaveRecruiterAssignments = (customList) => {
    const assignedList = customList !== undefined ? customList : (editingFields.assignedRecruiters || [])
    const cleanId = String(selectedReq?.id || '158938').replace('J-', '')
    const fullId = selectedReq?.id ? (selectedReq.id.startsWith('J-') ? selectedReq.id : `J-${selectedReq.id}`) : `J-${cleanId}`

    try {
      localStorage.setItem(`smarthire_req_assigned_${cleanId}`, JSON.stringify(assignedList))
      localStorage.setItem(`smarthire_req_assigned_${fullId}`, JSON.stringify(assignedList))
    } catch (e) {}

    // Update selectedReq
    setSelectedReq(prev => prev ? ({ ...prev, assignedRecruiters: assignedList }) : prev)

    // Update editingFields
    setEditingFields(prev => ({ ...prev, assignedRecruiters: assignedList }))

    // Update jobs list in state
    setJobs(prev => prev.map(j => {
      const jClean = String(j.id || '').replace('J-', '')
      if (jClean === cleanId || j.id === fullId || j.id === `J-${cleanId}`) {
        return {
          ...j,
          assignedRecruiters: assignedList
        }
      }
      return j
    }))

    setSaveToastMessage(`✅ Assigned recruiters (${assignedList.length}) saved successfully for Requisition #${cleanId}!`)
    setTimeout(() => setSaveToastMessage(null), 4500)
  }

  // Open Requisition Detail
  const handleOpenReq = (job) => {
    setSelectedReq(job)
    setViewMode('requisition')
    setActiveReqTab('details')
    const fullDesc = getFullDescriptionText(job)
    const assigned = Array.isArray(job.assignedRecruiters) ? job.assignedRecruiters : getJobAssignedRecruiters(job.id)
    const cleanId = String(job.id || '158938').replace('J-', '')

    // Load candidates specifically for this requisition
    try {
      const savedCand = localStorage.getItem(`smarthire_potential_candidates_${cleanId}`)
      if (savedCand) {
        setPotentialCandidates(JSON.parse(savedCand))
      } else {
        // Default candidate if not set
        setPotentialCandidates([
          {
            id: '87534',
            name: 'Ashok Ganta',
            payRate: '74/hr',
            payRateType: 'C2C',
            assignedBy: assigned[0] || userName,
            assignedOn: 'Aug 20, 2026 04:40 PM',
            status: 'Int-SubmittedToManager',
            statusComments: 'Submitted',
            interview: 'Select',
            rejectedReason: 'Select',
            lastChangedBy: assigned[0] || userName,
            lastChangedRole: 'Recruiter',
            lastChangedOn: 'Aug 20, 2026 04:40 PM'
          }
        ])
      }
    } catch (e) {}

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
      assignedRecruiters: assigned,
      keyReq: false,
      working: true,
      hotReq: false,
      incumbentVendor: false
    })
  }

  // Create / Add New Requisition
  const handleAddNewRequisition = () => {
    const newReqId = `1589${Math.floor(40 + Math.random() * 50)}`
    const newJobObj = {
      id: `J-${newReqId}`,
      title: 'New Requisition Position',
      client: 'State Of SC',
      skills: ['Required Skill 1', 'Required Skill 2'],
      budget: '75/hr',
      experience: '5+ years',
      location: 'Columbia, SC',
      type: 'Contract',
      status: 'Ready',
      creationDate: new Date().toLocaleDateString(),
      deadline: 'Aug 28, 2026'
    }
    handleOpenReq(newJobObj)
  }

  // Quick Search handler
  const handleQuickSearch = (e) => {
    e.preventDefault()
    if (!quickSearchId.trim()) return
    const match = jobs.find(j => (j.id || '').toLowerCase().includes(quickSearchId.toLowerCase()) || (j.title || '').toLowerCase().includes(quickSearchId.toLowerCase()))
    if (match) {
      handleOpenReq(match)
    } else {
      alert(`Requisition "${quickSearchId}" not found.`)
    }
  }

  // Export Results to CSV / Excel
  const handleExportToExcel = () => {
    const headers = ['Scr?', 'Candidate ID', 'Name', 'Job Title', 'Exp', 'Location', 'Pay Rate', 'Rate Type', 'Rating', 'Sub Vendor', 'Recruiter (Added By)', 'AgrExists', 'Avbl Date']
    const rows = filteredCandidates.map(c => [
      c.screened,
      c.id,
      `"${c.name}"`,
      `"${c.fullRole || c.role}"`,
      c.exp,
      `"${c.location}"`,
      `"${c.payRate}"`,
      c.rateType,
      c.rating,
      `"${c.subVendor}"`,
      `"${c.recruiter || c.assignedTo}"`,
      c.agrExists ? 'Yes' : 'No',
      `"${c.avblDate}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `SmartWorks_Candidates_Export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Resume File Upload & AI Auto-Parsing
  const handleResumeFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setNewCandForm(prev => ({
      ...prev,
      resumeFile: file,
      resumeTitle: file.name.replace(/\.[^/.]+$/, ''),
      isParsing: true,
      parseSuccess: false
    }))

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        const parsed = parseResumeDetails(data.text || '', file.name)
        setNewCandForm(prev => ({
          ...prev,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          email: data.email || parsed.email,
          city: parsed.city,
          state: parsed.state,
          exp: parsed.exp,
          isParsing: false,
          parseSuccess: true
        }))
      } else {
        const parsed = parseResumeDetails('', file.name)
        setNewCandForm(prev => ({
          ...prev,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          email: parsed.email,
          city: parsed.city,
          state: parsed.state,
          exp: parsed.exp,
          isParsing: false,
          parseSuccess: true
        }))
      }
    } catch (err) {
      const parsed = parseResumeDetails('', file.name)
      setNewCandForm(prev => ({
        ...prev,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email,
        city: parsed.city,
        state: parsed.state,
        exp: parsed.exp,
        isParsing: false,
        parseSuccess: true
      }))
    }
  }

  const handleContinueToSubmission = (e) => {
    e.preventDefault()
    if (!newCandForm.firstName && !newCandForm.email) {
      alert('Please provide candidate name or upload a resume.')
      return
    }

    const candId = String(Math.floor(10000 + Math.random() * 90000))
    setSubmissionCandidate(prev => ({
      ...prev,
      id: candId,
      firstName: newCandForm.firstName || 'Candidate',
      lastName: newCandForm.lastName || 'Profile',
      email: newCandForm.email || 'candidate@example.com',
      city: newCandForm.city || 'Richmond',
      state: newCandForm.state !== 'Select' ? newCandForm.state : 'VA',
      experienceYears: newCandForm.exp || '5',
      resumeName: newCandForm.resumeFile ? newCandForm.resumeFile.name : `${newCandForm.firstName || 'Candidate'}_Resume.docx`,
      jobTitle: editingFields.title || 'Project Manager - Consultant',
      dob: newCandForm.dob || ''
    }))

    setViewMode('resumeSubmission')
    setActiveSubTab('details')
  }

  const handleSelectExistingCandidate = (c) => {
    const parts = (c.name || 'Candidate').split(' ')
    const fn = parts[0]
    const ln = parts.slice(1).join(' ') || ''
    const candId = String(c.id ? String(c.id).replace(/\D/g, '').slice(-5) || '87534' : '87534')

    setSubmissionCandidate(prev => ({
      ...prev,
      id: candId,
      firstName: fn,
      lastName: ln,
      email: c.email || `${fn.toLowerCase()}@example.com`,
      phoneCell: c.phone || '571-660-5778',
      city: c.city || (c.location ? c.location.split(',')[0].trim() : 'Richmond'),
      state: c.state || (c.location && c.location.split(',')[1] ? c.location.split(',')[1].trim().slice(0, 2) : 'VA'),
      experienceYears: c.exp || (c.experience ? String(c.experience).replace(/\D/g, '') || '8' : '8'),
      jobTitle: c.fullRole || c.role || editingFields.title || 'Consultant',
      resumeName: `${c.name || 'Candidate'}_Resume.docx`,
      proposedPayRate: c.payRate ? c.payRate.replace(/[^0-9]/g, '') : '74',
      proposedRateType: c.rateType || 'C2C'
    }))

    setViewMode('resumeSubmission')
    setActiveSubTab('details')
  }

  const handleAssignCandidateToReq = () => {
    const fullName = `${submissionCandidate.firstName} ${submissionCandidate.lastName}`.trim()
    
    setPotentialCandidates(prev => [
      {
        id: submissionCandidate.id,
        name: fullName,
        payRate: `${submissionCandidate.proposedPayRate}/hr`,
        payRateType: submissionCandidate.proposedRateType || 'C2C',
        assignedBy: currentUser?.name || 'Recruiter',
        assignedOn: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Int-SubmittedToManager',
        statusComments: 'Submitted',
        interview: 'Select',
        rejectedReason: ''
      },
      ...prev.filter(p => p.id !== submissionCandidate.id)
    ])

    alert(`✅ Candidate ${fullName} (ID: ${submissionCandidate.id}) has been successfully assigned to Requisition #${selectedReq?.id?.replace('J-', '') || '158938'}!`)
    setViewMode('requisition')
    setActiveReqTab('potential')
  }

  // ─── FILTER REQUISITIONS LIST (STRICT MULTI-LEVEL RBAC + SEARCH FILTERS) ───
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      if (!j) return false

      // ─── STRICT ROLE-BASED ACCESS CONTROL (RBAC) ───
      if (!isAdmin) {
        const assignedList = Array.isArray(j.assignedRecruiters) ? j.assignedRecruiters.map(r => String(r || '').toLowerCase().trim()) : []
        const userIdent = userName.toLowerCase().trim()
        const userEmailIdent = (currentUser?.email || '').toLowerCase().trim()

        // Subordinate employees reporting to this recruiter
        const mySubordinates = teamUsers
          .filter(u => u.parentRecruiterName && u.parentRecruiterName.toLowerCase().trim() === userIdent)
          .map(u => u.name.toLowerCase().trim())

        const isDirectlyAssigned = assignedList.some(r => r.includes(userIdent) || userIdent.includes(r) || (userEmailIdent && r.includes(userEmailIdent)))
        const isAssignedToSubordinate = isRecruiter && assignedList.some(r => mySubordinates.some(sub => r.includes(sub) || sub.includes(r)))

        // If neither directly assigned nor assigned to an employee under this recruiter, HIDE this requisition!
        if (!isDirectlyAssigned && !isAssignedToSubordinate) {
          return false
        }
      }

      if (reqFilters.reqId.trim()) {
        const cleanId = j.id.replace('J-', '')
        if (!cleanId.toLowerCase().includes(reqFilters.reqId.toLowerCase())) return false
      }
      if (reqFilters.title.trim()) {
        if (!j.title?.toLowerCase().includes(reqFilters.title.toLowerCase())) return false
      }
      if (reqFilters.skills.trim()) {
        const skillsStr = Array.isArray(j.skills) ? j.skills.join(' ').toLowerCase() : ''
        if (!skillsStr.includes(reqFilters.skills.toLowerCase())) return false
      }
      if (reqFilters.city.trim()) {
        const loc = (j.location || '').toLowerCase()
        if (!loc.includes(reqFilters.city.toLowerCase())) return false
      }
      if (reqFilters.state !== 'Select State') {
        const loc = (j.location || '').toLowerCase()
        if (!loc.includes(reqFilters.state.toLowerCase())) return false
      }
      if (reqFilters.status !== 'Select Status' && reqFilters.status !== 'All') {
        const stat = (j.status || '').toLowerCase()
        if (reqFilters.status === 'In-Progress' && stat !== 'active' && stat !== 'in-progress' && stat !== 'posted') return false
        if (reqFilters.status === 'Ready' && stat !== 'ready') return false
        if (reqFilters.status === 'Closed' && stat !== 'closed') return false
      }
      if (reqFilters.assignedTo && reqFilters.assignedTo !== 'Any' && reqFilters.assignedTo !== 'All') {
        const targetRec = reqFilters.assignedTo.toLowerCase()
        const assignedList = Array.isArray(j.assignedRecruiters) ? j.assignedRecruiters.map(r => r.toLowerCase()) : []
        const postedBy = (j.postedByName || '').toLowerCase()
        if (!assignedList.some(r => r.includes(targetRec)) && !postedBy.includes(targetRec)) {
          return false
        }
      }
      if (reqFilters.reqType !== 'Select Req Type') {
        const type = (j.type || '').toLowerCase()
        if (!type.includes(reqFilters.reqType.toLowerCase())) return false
      }
      return true
    })
  }, [jobs, reqFilters, isAdmin, isRecruiter, isEmployee, userName, currentUser, teamUsers])

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredJobs.slice(start, start + pageSize)
  }, [filteredJobs, currentPage, pageSize])

  const totalPages = Math.ceil(filteredJobs.length / pageSize) || 1

  // ─── FILTER CANDIDATES LIST (ROLE-BASED & SEARCH FILTERS) ───
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      if (!c) return false

      // Recruiter Name Filter (Assigned To)
      if (candFilters.assignedTo !== 'Any' && candFilters.assignedTo !== 'All') {
        const assigned = (c.recruiter || c.assignedTo || '').toLowerCase()
        const filterVal = candFilters.assignedTo.toLowerCase()
        if (!assigned.includes(filterVal) && !filterVal.includes(assigned)) return false
      }

      // Candidate ID Filter
      if (candFilters.candidateId.trim()) {
        if (!c.id.toLowerCase().includes(candFilters.candidateId.toLowerCase())) return false
      }

      // Name Filter
      if (candFilters.name.trim()) {
        if (!c.name.toLowerCase().includes(candFilters.name.toLowerCase())) return false
      }

      // Email Filter
      if (candFilters.email.trim()) {
        if (!c.email.toLowerCase().includes(candFilters.email.toLowerCase())) return false
      }

      // Skills / Role Filter
      if (candFilters.skills.trim()) {
        const skillsStr = (Array.isArray(c.skills) ? c.skills.join(' ') : '') + ' ' + (c.fullRole || c.role || '')
        if (!skillsStr.toLowerCase().includes(candFilters.skills.toLowerCase())) return false
      }

      // City Filter
      if (candFilters.city.trim()) {
        const loc = (c.location || c.city || '').toLowerCase()
        if (!loc.includes(candFilters.city.toLowerCase())) return false
      }

      // State Filter
      if (candFilters.state !== 'Select') {
        const loc = (c.location || c.state || '').toLowerCase()
        if (!loc.includes(candFilters.state.toLowerCase())) return false
      }

      // Job Title Filter
      if (candFilters.jobTitle.trim()) {
        const title = (c.fullRole || c.role || '').toLowerCase()
        if (!title.includes(candFilters.jobTitle.toLowerCase())) return false
      }

      // Work Auth Filter
      if (candFilters.workAuth !== 'Any') {
        if (c.workAuth !== candFilters.workAuth) return false
      }

      // Sub-Vendor Filter
      if (candFilters.subVendor !== 'Select') {
        if (c.subVendor !== candFilters.subVendor) return false
      }

      // Screened Status Filter
      if (candFilters.screenedStatus !== 'All') {
        if (c.screened !== candFilters.screenedStatus) return false
      }

      return true
    })
  }, [candidates, candFilters])

  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCandidates.slice(start, start + pageSize)
  }, [filteredCandidates, currentPage, pageSize])

  const totalCandPages = Math.ceil(filteredCandidates.length / pageSize) || 1

  // SmartWorks Header Navigation Tabs based on RBAC Role
  const navTabs = useMemo(() => {
    if (isAdmin) {
      return [
        { id: 'requisitions', name: 'Requisitions' },
        { id: 'candidates', name: 'Candidates' },
        { id: 'admin', name: 'Administration' },
        { id: 'reports', name: 'Reports', link: '/reports' },
        { id: 'process', name: 'Process', link: '/ats' }
      ]
    }
    if (isRecruiter) {
      return [
        { id: 'requisitions', name: 'My Requisitions' },
        { id: 'admin', name: 'My Team (Manage Employees)' },
        { id: 'candidates', name: 'My Candidates' }
      ]
    }
    // Employee
    return [
      { id: 'requisitions', name: 'My Requisitions' }
    ]
  }, [isAdmin, isRecruiter, isEmployee])

  return (
    <SiteLayout>
      <div style={{ background: '#f1f5f9', minHeight: '92vh', paddingBottom: '30px', fontFamily: 'Arial, sans-serif' }}>
        
        {/* ═══════════ TOP HEADER USER INFO STRIP ═══════════ */}
        <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '4px 16px', fontSize: '11px', color: '#475569' }}>
          <div className="container-wide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <span onClick={() => { setActiveMainTab('requisitions'); setViewMode('portal'); }} style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>Home</span>
              <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>About Us</span>
              <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>My Account</span>
              <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>Logout</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span>Theme: <select style={{ fontSize: '11px', padding: '1px 3px' }}><option>Default</option></select></span>
              <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Welcome: {userName}</span>
            </div>
          </div>
        </div>

        {/* ═══════════ SMARTWORKS ORANGE HEADER NAVIGATION BAR ═══════════ */}
        <header style={{ background: '#ea580c', borderBottom: '2px solid #c2410c', color: '#ffffff' }}>
          <div className="container-wide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '42px', padding: '0 16px' }}>
            
            <div style={{ display: 'flex', gap: '2px', height: '100%', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontWeight: 'bold', fontSize: '15px', letterSpacing: '0.02em', background: '#c2410c' }}>
                SmartWorks
              </div>
              {navTabs.map(t => (
                <div
                  key={t.id}
                  onClick={() => {
                    if (t.link) {
                      window.location.href = t.link
                    } else {
                      setActiveMainTab(t.id)
                      setViewMode('portal')
                      setCurrentPage(1)
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '12.5px', fontWeight: 'bold',
                    background: activeMainTab === t.id && viewMode === 'portal' ? '#d97706' : 'transparent',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer'
                  }}
                >
                  {t.name}
                </div>
              ))}
            </div>

            {/* Quick Search Input */}
            <form onSubmit={handleQuickSearch} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Requisition #</span>
              <input
                type="text"
                value={quickSearchId}
                onChange={e => setQuickSearchId(e.target.value)}
                placeholder="Req ID / Title"
                style={{ padding: '2px 6px', fontSize: '11px', width: '130px', border: '1px solid #ffffff', borderRadius: '2px' }}
              />
              <button
                type="submit"
                style={{ background: '#f8fafc', color: '#0f172a', border: 'none', padding: '3px 10px', fontSize: '11px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' }}
              >
                Quick Search
              </button>
            </form>
          </div>
        </header>

        {/* ═══════════ MAIN VIEW CONTAINER ═══════════ */}
        <div className="container-wide" style={{ padding: '16px', maxWidth: '1360px', margin: '0 auto' }}>

          {/* ─────────────────────────────────────────────────────────────
              TAB 2: CANDIDATES SEARCH & LIST VIEW (EXACT MATCH TO SCREENSHOTS)
              ───────────────────────────────────────────────────────────── */}
          {activeMainTab === 'candidates' && viewMode === 'portal' && (
            <div>
              {/* Breadcrumbs */}
              <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '8px' }}>
                You are here: <span style={{ color: '#0066cc', cursor: 'pointer' }}>Home</span> &gt; Candidates
              </div>

              {/* ─── SEARCH CANDIDATE 3-COLUMN PANEL (IMAGE 1787312030395) ─── */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px 18px', marginBottom: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h2 style={{ margin: 0, fontSize: '15px', color: '#1e3a8a', fontWeight: 'bold' }}>
                    Search Candidate
                  </h2>
                  <span
                    onClick={() => setViewMode('resumeSearch')}
                    style={{ color: '#0066cc', fontWeight: 'bold', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Add new Candidate
                  </span>
                </div>

                <form onSubmit={e => { e.preventDefault(); setCurrentPage(1); }} style={{ border: '1px solid #fed7aa', background: '#fffaf5', padding: '14px 18px', borderRadius: '3px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '14px 24px', fontSize: '11.5px' }}>
                    
                    {/* Column 1 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 8px', alignItems: 'center' }}>
                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Candidate #:</label>
                      <input type="text" value={candFilters.candidateId} onChange={e => setCandFilters({ ...candFilters, candidateId: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Name:</label>
                      <input type="text" value={candFilters.name} onChange={e => setCandFilters({ ...candFilters, name: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>E-mail:</label>
                      <input type="text" value={candFilters.email} onChange={e => setCandFilters({ ...candFilters, email: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Skills:</label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input type="text" value={candFilters.skills} onChange={e => setCandFilters({ ...candFilters, skills: e.target.value })} style={{ flex: 1, padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                        <span style={{ fontSize: '12px', cursor: 'pointer', color: '#0066cc' }}>❓</span>
                      </div>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>City:</label>
                      <input type="text" value={candFilters.city} onChange={e => setCandFilters({ ...candFilters, city: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>State:</label>
                      <select value={candFilters.state} onChange={e => setCandFilters({ ...candFilters, state: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                        <option>Select</option>
                        <option>NJ</option>
                        <option>VA</option>
                        <option>TX</option>
                        <option>MN</option>
                        <option>NE</option>
                        <option>CT</option>
                        <option>MI</option>
                        <option>NY</option>
                        <option>KY</option>
                        <option>NC</option>
                        <option>AR</option>
                        <option>CA</option>
                        <option>IN</option>
                        <option>OH</option>
                        <option>TN</option>
                      </select>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Job Title :</label>
                      <input type="text" value={candFilters.jobTitle} onChange={e => setCandFilters({ ...candFilters, jobTitle: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Zipcode:</label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input type="text" value={candFilters.zipCode} onChange={e => setCandFilters({ ...candFilters, zipCode: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                        <select value={candFilters.radius} onChange={e => setCandFilters({ ...candFilters, radius: e.target.value })} style={{ padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>Select Miles</option>
                          <option>10</option>
                          <option>25</option>
                          <option>50</option>
                          <option>100</option>
                        </select>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px 8px', alignItems: 'center' }}>
                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Experience:</label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input type="text" value={candFilters.experience} onChange={e => setCandFilters({ ...candFilters, experience: e.target.value })} style={{ width: '45px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                        <span>years</span>
                      </div>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Work Auth:</label>
                      <select value={candFilters.workAuth} onChange={e => setCandFilters({ ...candFilters, workAuth: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                        <option>Any</option>
                        <option>US Citizen</option>
                        <option>GC</option>
                        <option>H1B</option>
                      </select>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Assigned To:</label>
                      <select value={candFilters.assignedTo} onChange={e => setCandFilters({ ...candFilters, assignedTo: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                        <option value="Any">Any (All Pool)</option>
                        {allRecruitersList.map(r => (
                          <option key={r.name} value={r.name}>{r.name} {r.name === userName ? '(You)' : ''}</option>
                        ))}
                      </select>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Sub-Vendor :</label>
                      <select value={candFilters.subVendor} onChange={e => setCandFilters({ ...candFilters, subVendor: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                        <option>Select</option>
                        <option>Talent9 Inc</option>
                        <option>Paramount Software Solutions</option>
                        <option>Ardor IT Systems INC</option>
                        <option>IConnect</option>
                        <option>Cloud TechnoSoft LLC</option>
                        <option>Client Server Technologies</option>
                        <option>SmartHire LLC</option>
                        <option>Ameritech Global INC</option>
                        <option>Origin Tek Solutions</option>
                        <option>E-Solutions Inc</option>
                      </select>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Availability Date :</label>
                      <select value={candFilters.availabilityDate} onChange={e => setCandFilters({ ...candFilters, availabilityDate: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                        <option>Any</option>
                        <option>Immediate</option>
                        <option>2 Weeks</option>
                        <option>30 Days</option>
                      </select>

                      <div style={{ gridColumn: 'span 2', marginTop: '2px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                          <input type="checkbox" checked={candFilters.securityClearance} onChange={e => setCandFilters({ ...candFilters, securityClearance: e.target.checked })} />
                          Security Clearance / Federal clearance
                        </label>
                      </div>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Rating:</label>
                      <div>⛔ ⭐️⭐️⭐️⭐️⭐️</div>

                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                          <input type="checkbox" checked={candFilters.currentEmployees} onChange={e => setCandFilters({ ...candFilters, currentEmployees: e.target.checked })} />
                          Current Employees:
                        </label>
                      </div>
                    </div>

                    {/* Column 3 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 8px', alignContent: 'start', alignItems: 'center' }}>
                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Work Permit:</label>
                      <select value={candFilters.workPermit} onChange={e => setCandFilters({ ...candFilters, workPermit: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                        <option>All</option>
                        <option>US Citizen</option>
                        <option>Green Card</option>
                        <option>H1B</option>
                      </select>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Office Location</label>
                      <select value={candFilters.officeLocation} onChange={e => setCandFilters({ ...candFilters, officeLocation: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                        <option>All</option>
                        <option>Columbia</option>
                        <option>Richmond</option>
                        <option>Austin</option>
                      </select>

                      <div style={{ gridColumn: 'span 2', margin: '4px 0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                          <input type="checkbox" checked={candFilters.skyped} onChange={e => setCandFilters({ ...candFilters, skyped: e.target.checked })} />
                          Skyped
                        </label>
                      </div>

                      <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Screened Status:</label>
                      <select value={candFilters.screenedStatus} onChange={e => setCandFilters({ ...candFilters, screenedStatus: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                        <option>All</option>
                        <option>Yes</option>
                        <option>Pending</option>
                      </select>

                      <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                        <button
                          type="submit"
                          style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '3px 18px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Search
                        </button>
                      </div>
                    </div>

                  </div>
                </form>
              </div>

              {/* ─── CANDIDATE SEARCH RESULTS TABLE (EXACT MATCH TO MEDIA_1787312540212.PNG) ─── */}
              <div style={{ background: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                
                {/* Header Strip with Export to Excel Button & Counts */}
                <div style={{
                  background: '#bfdbfe', borderBottom: '1px solid #93c5fd', padding: '5px 12px',
                  display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '14px'
                }}>
                  <button
                    type="button"
                    onClick={handleExportToExcel}
                    style={{
                      background: '#f1f5f9', border: '1px solid #94a3b8', padding: '2px 10px',
                      fontSize: '11px', fontWeight: 'bold', color: '#0f172a', cursor: 'pointer',
                      boxShadow: 'inset 0 1px 0 #ffffff, 0 1px 2px rgba(0,0,0,0.1)', borderRadius: '2px'
                    }}
                  >
                    Export Results to Excel
                  </button>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a' }}>
                    (Candidates {filteredCandidates.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredCandidates.length)} of {filteredCandidates.length})
                  </span>
                </div>

                {/* Legacy CoolWorks Candidate Grid */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left', background: '#ffffff' }}>
                    <thead>
                      <tr style={{ background: '#94a3b8', color: '#ffffff', borderBottom: '1px solid #cbd5e1' }}>
                        <th style={{ padding: '6px 5px', fontWeight: 'bold', textAlign: 'center', width: '35px' }}>Scr?</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Name</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Job Title</th>
                        <th style={{ padding: '6px 5px', fontWeight: 'bold', textAlign: 'center', width: '35px' }}>Exp</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Location</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Location Preferences</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Pay Rate</th>
                        <th style={{ padding: '6px 6px', fontWeight: 'bold' }}>Rate Type</th>
                        <th style={{ padding: '6px 6px', fontWeight: 'bold' }}>Rating</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Sub Vendor</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold', color: '#ffffff', background: '#475569' }}>Recruiter (Added By)</th>
                        <th style={{ padding: '6px 5px', fontWeight: 'bold', textAlign: 'center' }}>AgrExists</th>
                        <th style={{ padding: '6px 8px', fontWeight: 'bold' }}>Avbl Date</th>
                        <th style={{ padding: '6px 5px', fontWeight: 'bold', textAlign: 'center', width: '35px' }}>Res</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCandidates.length === 0 ? (
                        <tr>
                          <td colSpan="14" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                            No candidates found matching search criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedCandidates.map((c, idx) => (
                          <tr key={c.id || idx} style={{
                            background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                            borderBottom: '1px solid #e2e8f0'
                          }}>
                            {/* Scr? Checkmark */}
                            <td style={{ padding: '5px 5px', textAlign: 'center' }}>
                              <span style={{ color: '#16a34a', fontSize: '12px' }} title="Screened">🟢</span>
                            </td>

                            {/* Name Link */}
                            <td style={{ padding: '5px 8px', fontWeight: 'bold' }}>
                              <span onClick={() => handleSelectExistingCandidate(c)} style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>
                                {c.name}
                              </span>
                            </td>

                            {/* Job Title */}
                            <td style={{ padding: '5px 8px', color: '#334155' }} title={c.fullRole || c.role}>
                              {c.role}
                            </td>

                            {/* Exp */}
                            <td style={{ padding: '5px 5px', textAlign: 'center', color: '#334155' }}>
                              {c.exp}
                            </td>

                            {/* Location */}
                            <td style={{ padding: '5px 8px', color: '#334155' }}>
                              {c.location}
                            </td>

                            {/* Location Preferences */}
                            <td style={{ padding: '5px 8px', color: '#64748b' }}>
                              {c.locPref || ''}
                            </td>

                            {/* Pay Rate */}
                            <td style={{ padding: '5px 8px', color: '#334155' }}>
                              {c.payRate}
                            </td>

                            {/* Rate Type */}
                            <td style={{ padding: '5px 6px', color: '#334155' }}>
                              {c.rateType}
                            </td>

                            {/* Rating Stars */}
                            <td style={{ padding: '5px 6px' }}>
                              {c.rating >= 4 ? (
                                <span style={{ color: '#f59e0b', fontSize: '11px' }}>⭐⭐⭐⭐⭐</span>
                              ) : (
                                <span style={{ color: '#cbd5e1', fontSize: '11px' }}>☆☆☆☆☆</span>
                              )}
                            </td>

                            {/* Sub Vendor */}
                            <td style={{ padding: '5px 8px', color: '#334155' }}>
                              {c.subVendor}
                            </td>

                            {/* Recruiter / Added By */}
                            <td style={{ padding: '5px 8px', fontWeight: 'bold', color: '#1e3a8a', background: idx % 2 === 0 ? '#f1f5f9' : '#e2e8f0' }}>
                              {c.recruiter || c.assignedTo || 'Unassigned'}
                            </td>

                            {/* AgrExists */}
                            <td style={{ padding: '5px 5px', textAlign: 'center' }}>
                              {c.agrExists && (
                                <span style={{ color: '#16a34a', fontSize: '12px' }}>🟢</span>
                              )}
                            </td>

                            {/* Avbl Date */}
                            <td style={{ padding: '5px 8px', color: '#334155' }}>
                              {c.avblDate}
                            </td>

                            {/* Resume Icon */}
                            <td style={{ padding: '5px 5px', textAlign: 'center' }}>
                              <span onClick={() => handleSelectExistingCandidate(c)} style={{ cursor: 'pointer', fontSize: '13px' }} title="View / Download Resume">
                                📎
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Pagination Bar (Exact to Screenshot) */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#f8fafc', borderTop: '1px solid #cbd5e1', padding: '6px 14px'
                }}>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11.5px', fontWeight: 'bold' }}>
                    {[1, 2, 3, 4, 5].map(p => (
                      <span key={p} onClick={() => setCurrentPage(p)} style={{
                        color: currentPage === p ? '#ea580c' : '#0066cc',
                        cursor: 'pointer',
                        textDecoration: currentPage === p ? 'none' : 'underline'
                      }}>
                        {p}
                      </span>
                    ))}
                    <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentPage(prev => Math.min(totalCandPages, prev + 1))}>Next</span>
                    <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentPage(totalCandPages)}>Last</span>
                  </div>

                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a' }}>
                    Page Size:
                    <select value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} style={{ marginLeft: '6px', fontSize: '11px', padding: '1px 3px' }}>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW MODE 1: STEP 1 - RESUME SEARCH & ADD CANDIDATE FORM
              ───────────────────────────────────────────────────────────── */}
          {viewMode === 'resumeSearch' && (
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ background: '#e2e8f0', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '4px', marginBottom: '12px', fontSize: '11.5px', color: '#1e3a8a', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
                <div><strong>Requisition #:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{selectedReq?.id?.replace('J-', '') || '158938'}</span></div>
                <div><strong>Position Title:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.title || 'Project Manager - Consultant - 13285'}</span></div>
                <div><strong>Status:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>In-Progress</span></div>
                <div><strong>Agency:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.customer || 'State Of SC'}</span></div>
                <div><strong>Start Date:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.startDate || '10/23/2026'}</span></div>
                <div><strong>Duration:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.duration || '12'} Months</span></div>
              </div>

              <div style={{ fontSize: '11.5px', color: '#1e3a8a', marginBottom: '6px' }}>
                To submit resume, search and select an existing candidate or add a new candidate.
              </div>
              <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 'bold', marginBottom: '14px' }}>
                Status: Ready
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Left Panel */}
                <div style={{ border: '1px solid #1e3a8a', borderRadius: '3px', padding: '12px 16px', background: '#ffffff' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '12.5px', color: '#1e3a8a', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
                    Search Candidate and assign to this position
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px 8px', fontSize: '11.5px', alignItems: 'center' }}>
                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Candidate #:</label>
                    <input type="text" value={searchCandFilter.candidateId} onChange={e => setSearchCandFilter({ ...searchCandFilter, candidateId: e.target.value })} style={{ width: '90px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Name:</label>
                    <input type="text" value={searchCandFilter.name} onChange={e => setSearchCandFilter({ ...searchCandFilter, name: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>E-mail:</label>
                    <input type="text" value={searchCandFilter.email} onChange={e => setSearchCandFilter({ ...searchCandFilter, email: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Skills:</label>
                    <input type="text" value={searchCandFilter.skills} onChange={e => setSearchCandFilter({ ...searchCandFilter, skills: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>City:</label>
                    <input type="text" value={searchCandFilter.city} onChange={e => setSearchCandFilter({ ...searchCandFilter, city: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>State:</label>
                    <select value={searchCandFilter.state} onChange={e => setSearchCandFilter({ ...searchCandFilter, state: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                      <option>Select</option>
                      <option>SC</option>
                      <option>VA</option>
                      <option>TX</option>
                      <option>NC</option>
                    </select>

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Zip Code:</label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input type="text" value={searchCandFilter.zipCode} onChange={e => setSearchCandFilter({ ...searchCandFilter, zipCode: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                      <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Within</span>
                      <select value={searchCandFilter.radius} onChange={e => setSearchCandFilter({ ...searchCandFilter, radius: e.target.value })} style={{ padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                        <option>Select Miles</option>
                        <option>10</option>
                        <option>25</option>
                        <option>50</option>
                      </select>
                    </div>

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Experience:</label>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input type="text" value={searchCandFilter.experience} onChange={e => setSearchCandFilter({ ...searchCandFilter, experience: e.target.value })} style={{ width: '50px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                      <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Years</span>
                    </div>

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Work Authorization:</label>
                    <select value={searchCandFilter.workAuth} onChange={e => setSearchCandFilter({ ...searchCandFilter, workAuth: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                      <option>Any</option>
                      <option>US Citizen</option>
                      <option>GC</option>
                    </select>

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Assigned To:</label>
                    <select value={searchCandFilter.assignedTo} onChange={e => setSearchCandFilter({ ...searchCandFilter, assignedTo: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                      <option>Any</option>
                      <option>{userName}</option>
                      <option>Vaibhav Bisen</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => alert(`Found ${candidates.length} candidate(s) in system.`)}
                      style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '3px 14px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Search
                    </button>
                  </div>

                  <div style={{ marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Existing Candidates in Pool:</div>
                    <div style={{ maxHeight: '110px', overflowY: 'auto', fontSize: '11px' }}>
                      {candidates.slice(0, 4).map(c => (
                        <div key={c.id || c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', borderBottom: '1px solid #f1f5f9' }}>
                          <span><strong>{c.name}</strong> ({c.role || 'Consultant'})</span>
                          <span onClick={() => handleSelectExistingCandidate(c)} style={{ color: '#0066cc', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
                            Select &gt;&gt;
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Panel */}
                <form onSubmit={handleContinueToSubmission} style={{ border: '1px solid #1e3a8a', borderRadius: '3px', padding: '12px 16px', background: '#ffffff' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '12.5px', color: '#1e3a8a', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
                    Add a new candidate and assign to this position
                  </h3>

                  <div style={{ background: '#eff6ff', border: '1px dashed #3b82f6', borderRadius: '4px', padding: '10px 12px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>
                      ⚡ Smart AI Resume Auto-Parser
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', marginBottom: '6px' }}>
                      Select the word resume (*.doc, *.docx, *.pdf) to auto-fill all candidate details:
                    </div>
                    <input
                      type="file"
                      accept=".doc,.docx,.pdf"
                      onChange={handleResumeFileUpload}
                      style={{ fontSize: '11px', width: '100%' }}
                    />
                    {newCandForm.isParsing && (
                      <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 'bold', marginTop: '4px' }}>
                        ⏳ Extracting candidate information from resume...
                      </div>
                    )}
                    {newCandForm.parseSuccess && (
                      <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold', marginTop: '4px' }}>
                        ✅ Resume parsed successfully! Details populated below (you can edit them).
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 8px', fontSize: '11.5px', alignItems: 'center' }}>
                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Name*:</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input type="text" placeholder="First Name" value={newCandForm.firstName} onChange={e => setNewCandForm({ ...newCandForm, firstName: e.target.value })} style={{ flex: 1, padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} required />
                      <input type="text" placeholder="Last Name" value={newCandForm.lastName} onChange={e => setNewCandForm({ ...newCandForm, lastName: e.target.value })} style={{ flex: 1, padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Date Of Birth:</label>
                    <input type="text" placeholder="MM/DD/YYYY" value={newCandForm.dob} onChange={e => setNewCandForm({ ...newCandForm, dob: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Email*:</label>
                    <input type="email" value={newCandForm.email} onChange={e => setNewCandForm({ ...newCandForm, email: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} required />

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Experience*:</label>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input type="text" value={newCandForm.exp} onChange={e => setNewCandForm({ ...newCandForm, exp: e.target.value })} style={{ width: '45px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                      <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Years</span>
                    </div>

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>City*:</label>
                    <input type="text" value={newCandForm.city} onChange={e => setNewCandForm({ ...newCandForm, city: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>State*:</label>
                    <select value={newCandForm.state} onChange={e => setNewCandForm({ ...newCandForm, state: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                      <option>Select</option>
                      <option>SC</option>
                      <option>VA</option>
                      <option>TX</option>
                      <option>NC</option>
                    </select>

                    <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Resume Title*:</label>
                    <input type="text" value={newCandForm.resumeTitle} onChange={e => setNewCandForm({ ...newCandForm, resumeTitle: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                  </div>

                  <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11.5px', color: '#1e3a8a', marginBottom: '8px' }}>
                      Click continue to continue to next step.
                    </div>
                    <button
                      type="submit"
                      style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '4px 18px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Continue
                    </button>
                  </div>
                </form>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-start' }}>
                <span onClick={() => { setViewMode('requisition'); setActiveReqTab('potential'); }} style={{ color: '#0066cc', fontWeight: 'bold', fontSize: '11.5px', textDecoration: 'underline', cursor: 'pointer' }}>
                  &lt;&lt; Cancel and Return to Requisition
                </span>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW MODE 2: STEP 2 - RESUME SUBMISSION FORM
              ───────────────────────────────────────────────────────────── */}
          {viewMode === 'resumeSubmission' && (
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ background: '#e2e8f0', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '4px', marginBottom: '8px', fontSize: '11.5px', color: '#1e3a8a', display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '4px 20px' }}>
                <div><strong>Requisition #:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{selectedReq?.id?.replace('J-', '') || '158938'}</span></div>
                <div><strong>Position Title:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.title || 'Project Manager - Consultant - 13285'}</span></div>
                <div><strong>Status:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>In-Progress</span></div>
                <div><strong>Customer:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.customer || 'State Of SC'}</span></div>
                <div><strong>Start Date:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.startDate || '10/23/2026'}</span></div>
                <div><strong>Duration:</strong> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{editingFields.duration || '12'} Months</span></div>
              </div>

              <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 'bold', marginBottom: '10px' }}>
                Status: Ready
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '3px', marginBottom: '12px', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                  <span><strong>Candidate # :</strong> <span style={{ color: '#0066cc', fontWeight: 'bold' }}>{submissionCandidate.id}</span></span>
                  <button type="button" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 8px', fontSize: '11px', cursor: 'pointer' }}>Candidate Projects</button>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1e3a8a', fontWeight: 'bold' }}>
                    <input type="checkbox" defaultChecked /> Screened
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ color: '#1e3a8a', fontWeight: 'bold', width: '110px' }}>Candidate Name:*</label>
                    <input type="text" value={submissionCandidate.firstName} onChange={e => setSubmissionCandidate({ ...submissionCandidate, firstName: e.target.value })} style={{ flex: 1, padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                    <input type="text" value={submissionCandidate.lastName} onChange={e => setSubmissionCandidate({ ...submissionCandidate, lastName: e.target.value })} style={{ flex: 1, padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ color: '#1e3a8a', fontWeight: 'bold', width: '70px' }}>E-mail:*</label>
                    <input type="email" value={submissionCandidate.email} onChange={e => setSubmissionCandidate({ ...submissionCandidate, email: e.target.value })} style={{ flex: 1, padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Pay Rate:</span>
                  <input type="text" value={submissionCandidate.payRateMin} onChange={e => setSubmissionCandidate({ ...submissionCandidate, payRateMin: e.target.value })} style={{ width: '45px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                  <span>To</span>
                  <input type="text" value={submissionCandidate.payRateMax} onChange={e => setSubmissionCandidate({ ...submissionCandidate, payRateMax: e.target.value })} style={{ width: '45px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                  <select value={submissionCandidate.rateUnit} onChange={e => setSubmissionCandidate({ ...submissionCandidate, rateUnit: e.target.value })} style={{ padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                    <option>per hour</option>
                    <option>annual</option>
                  </select>

                  <span style={{ color: '#1e3a8a', fontWeight: 'bold', marginLeft: '10px' }}>Rate Type:</span>
                  <select value={submissionCandidate.rateType} onChange={e => setSubmissionCandidate({ ...submissionCandidate, rateType: e.target.value })} style={{ padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                    <option>C2C</option>
                    <option>W2</option>
                    <option>1099</option>
                  </select>

                  <span style={{ color: '#1e3a8a', fontWeight: 'bold', marginLeft: '10px' }}>Available Date:*</span>
                  <input type="text" value={submissionCandidate.availableDate} onChange={e => setSubmissionCandidate({ ...submissionCandidate, availableDate: e.target.value })} style={{ width: '110px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', background: '#e2e8f0', padding: '4px 8px 0', gap: '2px' }}>
                {[
                  { id: 'details', label: 'Details' },
                  { id: 'skill', label: 'Skill' },
                  { id: 'references', label: 'References' },
                  { id: 'legal', label: 'Legal' },
                  { id: 'notes', label: `Interaction Notes (${submissionCandidate.interactionNotes?.length || 3})` },
                  { id: 'history', label: 'Submission History' },
                  { id: 'projects', label: 'Projects' }
                ].map(tab => (
                  <div
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    style={{
                      padding: '6px 14px', fontSize: '11.5px', fontWeight: 'bold', borderRadius: '4px 4px 0 0',
                      background: activeSubTab === tab.id ? '#ffffff' : '#f1f5f9',
                      border: activeSubTab === tab.id ? '1px solid #cbd5e1' : '1px solid transparent',
                      borderBottom: activeSubTab === tab.id ? '1px solid #ffffff' : 'none',
                      color: activeSubTab === tab.id ? '#0f172a' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </div>
                ))}
              </div>

              {/* Sub-Tab Body */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: 'none', padding: '16px 20px', minHeight: '340px' }}>
                {activeSubTab === 'details' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px 8px', fontSize: '11.5px', alignContent: 'start', alignItems: 'center' }}>
                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Date of Birth:</label>
                        <input type="text" value={submissionCandidate.dob || ''} onChange={e => setSubmissionCandidate({ ...submissionCandidate, dob: e.target.value })} style={{ width: '130px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', textAlign: 'right', fontWeight: 'bold' }}>Candidate Source*:</label>
                        <select value={submissionCandidate.source} onChange={e => setSubmissionCandidate({ ...submissionCandidate, source: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>Other</option>
                          <option>LinkedIn</option>
                          <option>Direct Application</option>
                          <option>Vendor Referral</option>
                        </select>

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Sub-Vendor:</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select value={submissionCandidate.subVendor} onChange={e => setSubmissionCandidate({ ...submissionCandidate, subVendor: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                            <option>Talent9 Inc</option>
                            <option>Direct</option>
                            <option>SmartHire Tech</option>
                          </select>
                          <span style={{ color: '#0066cc', textDecoration: 'underline', cursor: 'pointer', fontSize: '11px' }}>AddSubVendor</span>
                        </div>

                        <label style={{ color: '#1e3a8a', textAlign: 'right', fontWeight: 'bold' }}>Job Title:*</label>
                        <input type="text" value={submissionCandidate.jobTitle} onChange={e => setSubmissionCandidate({ ...submissionCandidate, jobTitle: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Phone(any one):</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '4px', alignItems: 'center' }}>
                          <span>Cell</span>
                          <input type="text" value={submissionCandidate.phoneCell} onChange={e => setSubmissionCandidate({ ...submissionCandidate, phoneCell: e.target.value })} style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                          <span>Home</span>
                          <input type="text" value={submissionCandidate.phoneHome} onChange={e => setSubmissionCandidate({ ...submissionCandidate, phoneHome: e.target.value })} style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                          <span>Work</span>
                          <input type="text" value={submissionCandidate.phoneWork} onChange={e => setSubmissionCandidate({ ...submissionCandidate, phoneWork: e.target.value })} style={{ padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                        </div>

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Address:</label>
                        <input type="text" value={submissionCandidate.address} onChange={e => setSubmissionCandidate({ ...submissionCandidate, address: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>City, State, Zip:</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input type="text" value={submissionCandidate.city} onChange={e => setSubmissionCandidate({ ...submissionCandidate, city: e.target.value })} style={{ flex: 2, padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                          <select value={submissionCandidate.state} onChange={e => setSubmissionCandidate({ ...submissionCandidate, state: e.target.value })} style={{ flex: 1, padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                            <option>VA</option>
                            <option>SC</option>
                            <option>TX</option>
                            <option>NC</option>
                          </select>
                          <input type="text" value={submissionCandidate.zip} onChange={e => setSubmissionCandidate({ ...submissionCandidate, zip: e.target.value })} style={{ width: '55px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                        </div>

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Work Authorization:</label>
                        <select value={submissionCandidate.workAuth} onChange={e => setSubmissionCandidate({ ...submissionCandidate, workAuth: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>GC</option>
                          <option>US Citizen</option>
                          <option>H1B</option>
                        </select>

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Ready to Relocate:</label>
                        <select value={submissionCandidate.relocate} onChange={e => setSubmissionCandidate({ ...submissionCandidate, relocate: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>No</option>
                          <option>Yes</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px 8px', fontSize: '11.5px', alignContent: 'start', alignItems: 'center' }}>
                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Currently Working:</label>
                        <input type="checkbox" checked={submissionCandidate.currentlyWorking} onChange={e => setSubmissionCandidate({ ...submissionCandidate, currentlyWorking: e.target.checked })} />

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Resume Document:</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ color: '#0066cc', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
                            {submissionCandidate.resumeName}
                          </span>
                          <span style={{ cursor: 'pointer' }}>✏️</span>
                        </div>

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Preferences for Placement:</label>
                        <textarea rows={3} value={submissionCandidate.placementPref} onChange={e => setSubmissionCandidate({ ...submissionCandidate, placementPref: e.target.value })} style={{ padding: '4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>SSN(Last four):</label>
                        <input type="text" value={submissionCandidate.ssnLast4} onChange={e => setSubmissionCandidate({ ...submissionCandidate, ssnLast4: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', textAlign: 'right', fontWeight: 'bold' }}>Experience:*</label>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input type="text" value={submissionCandidate.experienceYears} onChange={e => setSubmissionCandidate({ ...submissionCandidate, experienceYears: e.target.value })} style={{ width: '45px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                          <span>years</span>
                        </div>

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Overall Rating:</label>
                        <div>⛔ ⭐️⭐️⭐️⭐️⭐️</div>

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Technical Rating:</label>
                        <div>⛔ ⭐️⭐️⭐️⭐️⭐️</div>

                        <label style={{ color: '#1e3a8a', textAlign: 'right' }}>Comm Skill:</label>
                        <div>⛔ ⭐️⭐️⭐️⭐️⭐️</div>

                        <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a' }}>
                            <input type="checkbox" checked={submissionCandidate.securityClearance} onChange={e => setSubmissionCandidate({ ...submissionCandidate, securityClearance: e.target.checked })} />
                            Security Clearance / Federal Clearance:
                          </label>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '12px', marginTop: '14px', fontSize: '11.5px' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Proposed Bill Rate*:</span>
                        <input type="text" value={submissionCandidate.proposedBillRate} onChange={e => setSubmissionCandidate({ ...submissionCandidate, proposedBillRate: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                        <span>per hour</span>

                        <span style={{ color: '#1e3a8a', fontWeight: 'bold', marginLeft: '12px' }}>Pay Rate*:</span>
                        <input type="text" value={submissionCandidate.proposedPayRate} onChange={e => setSubmissionCandidate({ ...submissionCandidate, proposedPayRate: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                        <span>per hour</span>

                        <span style={{ color: '#1e3a8a', fontWeight: 'bold', marginLeft: '12px' }}>Rate Type:</span>
                        <select value={submissionCandidate.proposedRateType} onChange={e => setSubmissionCandidate({ ...submissionCandidate, proposedRateType: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>C2C</option>
                          <option>W2</option>
                          <option>1099</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '6px', marginBottom: '14px' }}>
                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Comments:</label>
                        <textarea rows={3} value={submissionCandidate.comments} onChange={e => setSubmissionCandidate({ ...submissionCandidate, comments: e.target.value })} style={{ width: '100%', maxWidth: '600px', padding: '6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                      </div>

                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                        <button type="button" onClick={() => setViewMode('resumeSearch')} style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '4px 14px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}>
                          Back To Search Results
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            alert(`Candidate draft details saved successfully for ${submissionCandidate.firstName} ${submissionCandidate.lastName}!`);
                          }}
                          style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '4px 16px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Save
                        </button>
                        <button type="button" onClick={() => { setViewMode('requisition'); setActiveReqTab('potential'); }} style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '4px 14px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}>
                          Cancel
                        </button>
                        <button type="button" onClick={handleAssignCandidateToReq} style={{ background: '#ea580c', color: '#ffffff', border: 'none', padding: '4px 22px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' }}>
                          Assign
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW MODE 3: SINGLE REQUISITION DETAIL VIEW
              ───────────────────────────────────────────────────────────── */}
          {viewMode === 'requisition' && selectedReq && (
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '10px' }}>
                You are here: <span style={{ color: '#0066cc', cursor: 'pointer' }} onClick={() => setViewMode('portal')}>Home</span> &gt; Requisitions &gt; Edit Requisition
              </div>

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
                  <span style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setViewMode('portal')}>
                    &lt;&lt; Back To Search Results
                  </span>
                </div>
              </div>

              {/* Success Notification Banner */}
              {saveToastMessage && (
                <div style={{
                  background: '#ecfdf5',
                  border: '1px solid #10b981',
                  color: '#065f46',
                  padding: '8px 14px',
                  borderRadius: '3px',
                  fontSize: '11.5px',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  <span>{saveToastMessage}</span>
                  <span style={{ cursor: 'pointer', marginLeft: '12px', fontSize: '13px' }} onClick={() => setSaveToastMessage(null)}>✕</span>
                </div>
              )}

              {/* 3-Column Header Form */}
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '4px', marginBottom: '14px',
                display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px 18px', fontSize: '11.5px'
              }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px 8px', alignItems: 'center' }}>
                  <div style={{ visibility: 'hidden' }}>spacer</div>
                  <div style={{ visibility: 'hidden' }}>spacer</div>

                  <label style={{ fontWeight: 'bold', color: '#0066cc', textAlign: 'right', textDecoration: 'underline', cursor: 'pointer' }}>Customer:</label>
                  <select value={editingFields.customer || ''} onChange={e => setEditingFields({ ...editingFields, customer: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                    <option>State Of SC</option>
                    <option>DFA</option>
                    <option>DBHDS</option>
                    <option>VDOT</option>
                  </select>

                  <label style={{ fontWeight: 'bold', color: '#0066cc', textAlign: 'right', textDecoration: 'underline', cursor: 'pointer' }}>Contact:</label>
                  <select value={editingFields.contact || ''} onChange={e => setEditingFields({ ...editingFields, contact: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                    <option>Hustedt Lexi</option>
                    <option>Miller Sarah</option>
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
                  </select>
                </div>
              </div>

              {/* Sub Tabs */}
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

              {/* Tab Panel Content */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: 'none', padding: '16px 20px', minHeight: '340px' }}>
                {activeReqTab === 'details' && (
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
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
                        </select>
                        <input type="text" value={editingFields.zip || '29210'} onChange={e => setEditingFields({ ...editingFields, zip: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />
                      </div>

                      <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Bill Rate:</label>
                      <input type="text" value={editingFields.billRate || '90'} onChange={e => setEditingFields({ ...editingFields, billRate: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />

                      <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Pay Rate:</label>
                      <input type="text" value={editingFields.payRate || '75'} onChange={e => setEditingFields({ ...editingFields, payRate: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />

                      <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Interview:</label>
                      <select value={editingFields.interview || 'Select'} onChange={e => setEditingFields({ ...editingFields, interview: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                        <option>Select</option>
                        <option>1 Round Virtual/Online</option>
                      </select>

                      <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Work Authorization:</label>
                      <select value={editingFields.workAuth || 'Select'} onChange={e => setEditingFields({ ...editingFields, workAuth: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                        <option>Select</option>
                        <option>US Citizen</option>
                        <option>Green Card</option>
                      </select>

                      <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Subcontractable:*</label>
                      <select value={editingFields.subcontractable || 'No'} onChange={e => setEditingFields({ ...editingFields, subcontractable: e.target.value })} style={{ padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }}>
                        <option>No</option>
                        <option>Yes</option>
                      </select>

                      <label style={{ fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', alignSelf: 'center' }}>Experience:*</label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input type="text" value={editingFields.experience || '5'} onChange={e => setEditingFields({ ...editingFields, experience: e.target.value })} style={{ width: '45px', padding: '3px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1' }} />
                        <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>years</span>
                      </div>
                    </div>

                    <div style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a' }}>Description:*</label>
                          <span style={{ fontSize: '13px', cursor: 'pointer' }}>🖨️</span>
                        </div>
                        <textarea
                          rows={11}
                          value={editingFields.description || ''}
                          onChange={e => setEditingFields({ ...editingFields, description: e.target.value })}
                          style={{ width: '100%', padding: '8px', fontSize: '11.5px', lineHeight: '1.6', border: '1px solid #cbd5e1', fontFamily: 'monospace', background: '#fafafa' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div>
                          <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>Required Skills:*</label>
                          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: '#0066cc', fontWeight: 'bold', lineHeight: '1.6' }}>
                            {Array.isArray(editingFields.skills) && editingFields.skills.map((s, idx) => (
                              <li key={idx}><span style={{ color: '#1e3a8a' }}>{s}</span></li>
                            ))}
                          </ul>
                        </div>
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

                {/* ─── TAB 2: ASSIGN TO RECRUITERS ─── */}
                {activeReqTab === 'assign' && (
                  <div style={{ fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '13px' }}>
                          Assign Requisition to Recruiters
                        </div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          Select one or multiple recruiters who are assigned to source, screen, and submit candidates for Requisition #{selectedReq.id.replace('J-', '')}.
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFields(prev => ({
                              ...prev,
                              assignedRecruiters: allRecruitersList.map(r => r.name)
                            }))
                          }}
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' }}
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFields(prev => ({
                              ...prev,
                              assignedRecruiters: []
                            }))
                          }}
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' }}
                        >
                          Clear All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const current = editingFields.assignedRecruiters || []
                            if (!current.includes(userName)) {
                              setEditingFields(prev => ({
                                ...prev,
                                assignedRecruiters: [...current, userName]
                              }))
                            }
                          }}
                          style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '4px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' }}
                        >
                          + Assign to Me ({userName})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveRecruiterAssignments()}
                          style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '4px 16px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                        >
                          💾 Save Assignments
                        </button>
                      </div>
                    </div>

                    {/* Currently Assigned Summary Bar */}
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '11.5px' }}>
                        Currently Assigned ({editingFields.assignedRecruiters?.length || 0}):
                      </span>
                      {(!editingFields.assignedRecruiters || editingFields.assignedRecruiters.length === 0) ? (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '11px' }}>No recruiters assigned yet (empty)</span>
                      ) : (
                        editingFields.assignedRecruiters.map(recName => (
                          <span
                            key={recName}
                            style={{
                              background: '#e0f2fe',
                              color: '#0369a1',
                              border: '1px solid #bae6fd',
                              borderRadius: '12px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            👤 {recName}
                            <span
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingFields(prev => ({
                                  ...prev,
                                  assignedRecruiters: (prev.assignedRecruiters || []).filter(r => r !== recName)
                                }))
                              }}
                              style={{ cursor: 'pointer', color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}
                              title="Remove"
                            >
                              ✕
                            </span>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Recruiters Selection Table */}
                    <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '3px', marginBottom: '12px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#94a3b8', color: '#ffffff' }}>
                            <th style={{ padding: '7px 10px', width: '40px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={allRecruitersList.length > 0 && allRecruitersList.every(r => (editingFields.assignedRecruiters || []).includes(r.name))}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setEditingFields(prev => ({ ...prev, assignedRecruiters: allRecruitersList.map(r => r.name) }))
                                  } else {
                                    setEditingFields(prev => ({ ...prev, assignedRecruiters: [] }))
                                  }
                                }}
                              />
                            </th>
                            <th style={{ padding: '7px 10px', fontWeight: 'bold' }}>Recruiter Name</th>
                            <th style={{ padding: '7px 10px', fontWeight: 'bold' }}>Role / Designation</th>
                            <th style={{ padding: '7px 10px', fontWeight: 'bold' }}>Email Address</th>
                            <th style={{ padding: '7px 10px', fontWeight: 'bold' }}>Assignment Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allRecruitersList.map((rec, idx) => {
                            const isAssigned = (editingFields.assignedRecruiters || []).includes(rec.name)
                            return (
                              <tr
                                key={rec.name}
                                onClick={() => {
                                  const current = editingFields.assignedRecruiters || []
                                  if (isAssigned) {
                                    setEditingFields(prev => ({ ...prev, assignedRecruiters: current.filter(r => r !== rec.name) }))
                                  } else {
                                    setEditingFields(prev => ({ ...prev, assignedRecruiters: [...current, rec.name] }))
                                  }
                                }}
                                style={{
                                  background: isAssigned ? '#eff6ff' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc'),
                                  borderBottom: '1px solid #e2e8f0',
                                  cursor: 'pointer'
                                }}
                              >
                                <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                                  <input
                                    type="checkbox"
                                    checked={isAssigned}
                                    onChange={() => {}} // handled by row onClick
                                  />
                                </td>
                                <td style={{ padding: '7px 10px', fontWeight: 'bold', color: isAssigned ? '#0284c7' : '#0f172a' }}>
                                  {rec.name} {rec.name === userName ? '(You)' : ''}
                                </td>
                                <td style={{ padding: '7px 10px', color: '#475569' }}>
                                  {rec.role}
                                </td>
                                <td style={{ padding: '7px 10px', color: '#64748b', fontFamily: 'monospace' }}>
                                  {rec.email}
                                </td>
                                <td style={{ padding: '7px 10px' }}>
                                  {isAssigned ? (
                                    <span style={{ color: '#16a34a', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      🟢 Assigned
                                    </span>
                                  ) : (
                                    <span style={{ color: '#94a3b8' }}>
                                      ⚪ Not Assigned
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Save Action Bar inside Tab */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '3px' }}>
                      <span style={{ color: '#475569', fontSize: '11px', fontWeight: 'bold' }}>
                        Selected: <span style={{ color: '#0284c7' }}>{editingFields.assignedRecruiters?.length || 0}</span> recruiter(s)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSaveRecruiterAssignments()}
                        style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '5px 20px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                      >
                        💾 Save Assigned Recruiters
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── TAB 3: POTENTIAL CANDIDATES ─── */}
                {activeReqTab === 'potential' && (
                  <div style={{ fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '13px' }}>
                          Candidates Assigned to Requisition #{selectedReq?.id?.replace('J-', '') || '158938'} ({potentialCandidates.length})
                        </div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          Manage submissions, rate negotiations, internal/client statuses, and add new candidates for this specific requirement.
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setNewCandReqForm({
                              firstName: '',
                              lastName: '',
                              email: '',
                              phone: '',
                              payRate: editingFields.payRate || '70',
                              payRateType: 'C2C',
                              workAuth: editingFields.workAuth !== 'Select' ? editingFields.workAuth : 'US Citizen',
                              exp: editingFields.experience || '5',
                              skills: Array.isArray(editingFields.skills) ? editingFields.skills.join(', ') : '',
                              comments: `Sourced by ${userName} for Requisition #${selectedReq?.id?.replace('J-', '')}`,
                              status: 'Int-SubmittedToManager'
                            })
                            setShowAddCandidateModal(true)
                          }}
                          style={{
                            background: '#ea580c',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 16px',
                            fontSize: '11.5px',
                            fontWeight: 'bold',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 1px 3px rgba(234, 88, 12, 0.3)'
                          }}
                        >
                          <span>+ Add Candidate to this Requisition</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setViewMode('resumeSearch')}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            color: '#1e3a8a'
                          }}
                        >
                          🔍 Search Talent Directory
                        </button>
                      </div>
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
                          {potentialCandidates.length === 0 ? (
                            <tr>
                              <td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#f8fafc' }}>
                                No candidates submitted to this requisition yet.{' '}
                                <span
                                  onClick={() => setShowAddCandidateModal(true)}
                                  style={{ color: '#ea580c', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                  + Click here to add the first candidate
                                </span>
                              </td>
                            </tr>
                          ) : (
                            potentialCandidates.map((pc, idx) => (
                              <tr key={pc.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>
                                  <span onClick={() => {
                                    const parts = pc.name.split(' ')
                                    setSubmissionCandidate(prev => ({
                                      ...prev,
                                      id: pc.id,
                                      firstName: parts[0] || 'Candidate',
                                      lastName: parts.slice(1).join(' ') || '',
                                      proposedPayRate: pc.payRate.replace(/[^0-9]/g, '') || '74',
                                      proposedRateType: pc.payRateType || 'C2C'
                                    }))
                                    setViewMode('resumeSubmission')
                                    setActiveSubTab('details')
                                  }} style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>
                                    {pc.name}
                                  </span>
                                </td>
                                <td style={{ padding: '6px 8px', color: '#1e293b' }}>{pc.payRate}</td>
                                <td style={{ padding: '6px 8px', color: '#1e293b' }}>{pc.payRateType}</td>
                                <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#0066cc' }}>{pc.assignedBy}</td>
                                <td style={{ padding: '6px 8px', color: '#475569', fontSize: '10.5px' }}>{pc.assignedOn}</td>
                                <td style={{ padding: '6px 8px', minWidth: '190px' }}>
                                  <select
                                    value={pc.status}
                                    onChange={e => handleUpdatePotentialCandidate(pc.id, 'status', e.target.value)}
                                    style={{
                                      fontSize: '11px',
                                      padding: '3px 6px',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '2px',
                                      background: '#ffffff',
                                      fontWeight: 'bold',
                                      width: '100%',
                                      color: pc.status === 'Placed' ? '#166534' : pc.status.includes('Interview') ? '#1d4ed8' : pc.status.includes('Rejected') ? '#dc2626' : '#1e3a8a'
                                    }}
                                  >
                                    <option value="Int-SubmittedToManager">Int-SubmittedToManager</option>
                                    <option value="Int-ApprovedByManager">Int-ApprovedByManager</option>
                                    <option value="Int-RejectedByManager">Int-RejectedByManager</option>
                                    <option value="Agency-Submitted">Agency-Submitted</option>
                                    <option value="Agency-InterviewScheduled">Agency-InterviewScheduled</option>
                                    <option value="Agency-Approved">Agency-Approved</option>
                                    <option value="Agency-Rejected">Agency-Rejected</option>
                                    <option value="Client-SubmittedToCustomer">Client-SubmittedToCustomer</option>
                                    <option value="Client-InterviewScheduled">Client-InterviewScheduled</option>
                                    <option value="Client-Selected">Client-Selected</option>
                                    <option value="Client-Rejected">Client-Rejected</option>
                                    <option value="Offer Extended">Offer Extended</option>
                                    <option value="Placed">Placed</option>
                                  </select>
                                  
                                  {/* Audit Info Strip */}
                                  {pc.lastChangedBy && (
                                    <div style={{ fontSize: '9.5px', color: '#475569', marginTop: '3px', lineHeight: '1.2' }}>
                                      <span style={{ fontWeight: 'bold' }}>Changed by:</span>{' '}
                                      <span style={{ color: pc.lastChangedRole === 'Manager' || pc.lastChangedRole === 'superadmin' ? '#b45309' : '#0284c7', fontWeight: 'bold' }}>
                                        {pc.lastChangedRole || 'Recruiter'} ({pc.lastChangedBy})
                                      </span>
                                      <br />
                                      <span style={{ color: '#94a3b8' }}>{pc.lastChangedOn}</span>
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '6px 8px' }}>
                                  <textarea
                                    rows={2}
                                    value={pc.statusComments || ''}
                                    onChange={e => handleUpdatePotentialCandidate(pc.id, 'statusComments', e.target.value)}
                                    placeholder="Status comments..."
                                    style={{
                                      fontSize: '11px',
                                      padding: '3px 6px',
                                      width: '130px',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '2px',
                                      fontFamily: 'inherit',
                                      resize: 'vertical'
                                    }}
                                  />
                                </td>
                                <td style={{ padding: '6px 8px' }}>
                                  <select
                                    value={pc.interview || 'Select'}
                                    onChange={e => handleUpdatePotentialCandidate(pc.id, 'interview', e.target.value)}
                                    style={{ fontSize: '11px', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '2px', background: '#ffffff', minWidth: '110px' }}
                                  >
                                    <option value="Select">Select</option>
                                    <option value="Round 1 (Virtual)">Round 1 (Virtual)</option>
                                    <option value="Technical Panel">Technical Panel</option>
                                    <option value="Client Manager Round">Client Manager Round</option>
                                    <option value="Final Round">Final Round</option>
                                  </select>
                                </td>
                                <td style={{ padding: '6px 8px' }}>
                                  <select
                                    value={pc.rejectedReason || 'Select'}
                                    onChange={e => handleUpdatePotentialCandidate(pc.id, 'rejectedReason', e.target.value)}
                                    style={{ fontSize: '11px', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '2px', background: '#ffffff', minWidth: '110px' }}
                                  >
                                    <option value="Select">Select</option>
                                    <option value="Rate High">Rate High</option>
                                    <option value="Skill Gap">Skill Gap</option>
                                    <option value="Client Selected Another">Client Selected Another</option>
                                    <option value="Not Local">Not Local</option>
                                    <option value="Failed Tech Round">Failed Tech Round</option>
                                    <option value="Candidate Withdrew">Candidate Withdrew</option>
                                  </select>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <span
                        onClick={() => setViewMode('resumeSearch')}
                        style={{ color: '#0066cc', fontWeight: 'bold', fontSize: '11.5px', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        Search Candidates Directory &gt;&gt;
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddCandidateModal(true)}
                        style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '4px 12px', fontSize: '11px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' }}
                      >
                        + Add Candidate
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const cleanId = String(selectedReq?.id || '158938').replace('J-', '')
                    const fullId = selectedReq?.id ? (selectedReq.id.startsWith('J-') ? selectedReq.id : `J-${selectedReq.id}`) : `J-${cleanId}`
                    const updatedAssigned = editingFields.assignedRecruiters || []

                    try {
                      localStorage.setItem(`smarthire_potential_candidates_${cleanId}`, JSON.stringify(potentialCandidates))
                      localStorage.setItem(`smarthire_req_${cleanId}`, JSON.stringify(editingFields))
                      localStorage.setItem(`smarthire_req_assigned_${cleanId}`, JSON.stringify(updatedAssigned))
                      localStorage.setItem(`smarthire_req_assigned_${fullId}`, JSON.stringify(updatedAssigned))
                    } catch (e) {}

                    // Update selectedReq
                    setSelectedReq(prev => prev ? ({ ...prev, title: editingFields.title || prev.title, assignedRecruiters: updatedAssigned }) : prev)

                    // Update jobs list in state
                    setJobs(prev => prev.map(j => {
                      const jClean = String(j.id || '').replace('J-', '')
                      if (jClean === cleanId || j.id === fullId || j.id === `J-${cleanId}`) {
                        return {
                          ...j,
                          title: editingFields.title || j.title,
                          assignedRecruiters: updatedAssigned
                        }
                      }
                      return j
                    }))

                    setSaveToastMessage(`✅ Requisition #${cleanId} updated successfully! Candidate statuses and assigned recruiters (${updatedAssigned.length}) saved.`)
                    setTimeout(() => setSaveToastMessage(null), 5000)
                  }}
                  style={{ background: '#e2e8f0', color: '#0f172a', border: '1px solid #94a3b8', padding: '5px 22px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px', boxShadow: 'inset 0 1px 0 #ffffff, 0 1px 2px rgba(0,0,0,0.05)' }}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 3: ADMINISTRATION & TEAM / EMPLOYEE MANAGEMENT PANEL
              ───────────────────────────────────────────────────────────── */}
          {activeMainTab === 'admin' && viewMode === 'portal' && (
            <div>
              <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '8px' }}>
                You are here: <span style={{ color: '#0066cc', cursor: 'pointer' }} onClick={() => setActiveMainTab('requisitions')}>Home</span> &gt; Administration &gt; Team & Employee Management
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px 20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Header Strip */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ea580c', paddingBottom: '8px', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '16px', color: '#1e3a8a', fontWeight: 'bold' }}>
                      {isAdmin ? 'SmartWorks Administration — Team & Recruiter Management' : `My Team — Employees & Sourcing Specialists under ${userName}`}
                    </h2>
                    <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: '#64748b' }}>
                      {isAdmin
                        ? 'Create and manage recruiters, add employees under recruiters, set credentials, and manage requirement permissions.'
                        : 'Add sub-users/employees under your recruiter account, assign them requirements, and manage their access.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null)
                      setUserFormData({
                        name: '',
                        email: '',
                        password: 'recruiter123',
                        role: isAdmin ? 'recruiter' : 'employee',
                        parentRecruiterName: isAdmin ? '' : userName,
                        company: 'SmartHire LLC',
                        isActive: true
                      })
                      setShowUserModal(true)
                    }}
                    style={{
                      background: '#ea580c',
                      color: '#ffffff',
                      border: 'none',
                      padding: '7px 18px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 1px 3px rgba(234, 88, 12, 0.3)'
                    }}
                  >
                    <span>+ {isAdmin ? 'Add New Team Member / Recruiter' : 'Add Employee Under Me'}</span>
                  </button>
                </div>

                {/* 4 Key Metric Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1d4ed8' }}>TOTAL TEAM USERS</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#1e3a8a', marginTop: '2px' }}>
                      {isAdmin ? teamUsers.length : teamUsers.filter(u => u.name === userName || (u.parentRecruiterName && u.parentRecruiterName.toLowerCase() === userName.toLowerCase())).length}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#60a5fa', marginTop: '2px' }}>Registered in portal</div>
                  </div>

                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#047857' }}>ACTIVE RECRUITERS</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#065f46', marginTop: '2px' }}>
                      {teamUsers.filter(u => u.role === 'recruiter' && u.isActive !== false).length}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#34d399', marginTop: '2px' }}>Lead talent acquisition</div>
                  </div>

                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#b45309' }}>EMPLOYEES / SOURCERS</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#78350f', marginTop: '2px' }}>
                      {teamUsers.filter(u => u.role === 'employee' && u.isActive !== false).length}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#f59e0b', marginTop: '2px' }}>Subordinate members</div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>ASSIGNED REQUISITIONS</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                      {jobs.filter(j => Array.isArray(j.assignedRecruiters) && j.assignedRecruiters.length > 0).length}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>Active requirements</div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '4px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a' }}>Filter Team:</span>
                    <input
                      type="text"
                      placeholder="Search name, email..."
                      value={userSearchQuery}
                      onChange={e => setUserSearchQuery(e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px', width: '180px' }}
                    />
                    {isAdmin && (
                      <select
                        value={userRoleFilter}
                        onChange={e => setUserRoleFilter(e.target.value)}
                        style={{ padding: '4px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '2px' }}
                      >
                        <option value="All">All Roles</option>
                        <option value="superadmin">Super Admin / Managers</option>
                        <option value="recruiter">Recruiters</option>
                        <option value="employee">Employees (Sub-Recruiters)</option>
                      </select>
                    )}
                  </div>

                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>
                    Showing users for: <span style={{ color: '#0284c7' }}>{isAdmin ? 'Entire Organization' : `Team of ${userName}`}</span>
                  </span>
                </div>

                {/* Team Users Table */}
                <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '3px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#94a3b8', color: '#ffffff' }}>
                        <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Member Name</th>
                        <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Role / Designation</th>
                        <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Reports To (Lead Recruiter)</th>
                        <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Corporate Email (Login ID)</th>
                        <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Password</th>
                        <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Assigned Requirements</th>
                        <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Account Status</th>
                        <th style={{ padding: '8px 10px', fontWeight: 'bold', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamUsers
                        .filter(u => {
                          if (!isAdmin) {
                            // Non-admins only see themselves and their subordinates
                            const isMe = u.name.toLowerCase() === userName.toLowerCase()
                            const isMySub = u.parentRecruiterName && u.parentRecruiterName.toLowerCase() === userName.toLowerCase()
                            if (!isMe && !isMySub) return false
                          }
                          if (userRoleFilter !== 'All' && u.role !== userRoleFilter) return false
                          if (userSearchQuery.trim()) {
                            const q = userSearchQuery.toLowerCase()
                            return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.parentRecruiterName?.toLowerCase().includes(q)
                          }
                          return true
                        })
                        .map((u, idx) => {
                          const assignedReqsCount = jobs.filter(j => Array.isArray(j.assignedRecruiters) && j.assignedRecruiters.some(r => r.toLowerCase().includes(u.name.toLowerCase()))).length
                          const isCurrentUser = u.name.toLowerCase() === userName.toLowerCase() || u.email?.toLowerCase() === currentUser?.email?.toLowerCase()

                          return (
                            <tr key={u.id || idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#0f172a' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{
                                    width: '26px', height: '26px', borderRadius: '50%',
                                    background: u.role === 'superadmin' || u.role === 'admin' ? '#0284c7' : u.role === 'recruiter' ? '#ea580c' : '#10b981',
                                    color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold'
                                  }}>
                                    {u.name?.slice(0, 2).toUpperCase() || 'U'}
                                  </div>
                                  <span>{u.name} {isCurrentUser ? '(You)' : ''}</span>
                                </div>
                              </td>

                              <td style={{ padding: '8px 10px' }}>
                                <span style={{
                                  background: u.role === 'superadmin' || u.role === 'admin' ? '#e0f2fe' : u.role === 'recruiter' ? '#ffedd5' : '#dcfce7',
                                  color: u.role === 'superadmin' || u.role === 'admin' ? '#0369a1' : u.role === 'recruiter' ? '#c2410c' : '#15803d',
                                  border: '1px solid',
                                  borderColor: u.role === 'superadmin' || u.role === 'admin' ? '#bae6fd' : u.role === 'recruiter' ? '#fed7aa' : '#bbf7d0',
                                  borderRadius: '12px', padding: '2px 8px', fontSize: '10.5px', fontWeight: 'bold'
                                }}>
                                  {u.role === 'superadmin' || u.role === 'admin' ? '👑 Admin / Manager' : u.role === 'recruiter' ? '💼 Lead Recruiter' : '👤 Employee (Sourcing)'}
                                </span>
                              </td>

                              <td style={{ padding: '8px 10px', color: '#475569' }}>
                                {u.parentRecruiterName ? (
                                  <span style={{ color: '#0284c7', fontWeight: 'bold' }}>
                                    Reports to {u.parentRecruiterName}
                                  </span>
                                ) : (
                                  <span style={{ color: '#94a3b8' }}>Independent</span>
                                )}
                              </td>

                              <td style={{ padding: '8px 10px', color: '#0066cc', fontFamily: 'monospace' }}>
                                {u.email}
                              </td>

                              <td style={{ padding: '8px 10px', color: '#475569', fontFamily: 'monospace' }}>
                                <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '3px', border: '1px solid #cbd5e1' }}>
                                  {u.password || '••••••••'}
                                </span>
                              </td>

                              <td style={{ padding: '8px 10px' }}>
                                <span style={{
                                  background: assignedReqsCount > 0 ? '#dbeafe' : '#f1f5f9',
                                  color: assignedReqsCount > 0 ? '#1e40af' : '#64748b',
                                  fontWeight: 'bold', borderRadius: '10px', padding: '2px 8px', fontSize: '11px'
                                }}>
                                  {assignedReqsCount} Req{assignedReqsCount === 1 ? '' : 's'} Assigned
                                </span>
                              </td>

                              <td style={{ padding: '8px 10px' }}>
                                <span style={{
                                  color: u.isActive !== false ? '#16a34a' : '#dc2626',
                                  fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px'
                                }}>
                                  {u.isActive !== false ? '🟢 Active' : '🔴 Inactive'}
                                </span>
                              </td>

                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingUser(u)
                                      setUserFormData({
                                        name: u.name || '',
                                        email: u.email || '',
                                        password: u.password || '',
                                        role: u.role || 'recruiter',
                                        parentRecruiterName: u.parentRecruiterName || '',
                                        company: u.company || 'SmartHire LLC',
                                        isActive: u.isActive !== false
                                      })
                                      setShowUserModal(true)
                                    }}
                                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 8px', fontSize: '10.5px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' }}
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = teamUsers.map(item => item.id === u.id || item.email === u.email ? { ...item, isActive: !item.isActive } : item)
                                      saveTeamUsers(updated)
                                      setSaveToastMessage(`User ${u.name} status toggled!`)
                                      setTimeout(() => setSaveToastMessage(null), 3000)
                                    }}
                                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 8px', fontSize: '10.5px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' }}
                                  >
                                    {u.isActive !== false ? 'Deactivate' : 'Activate'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 1: REQUISITIONS VIEW (PORTAL HOME + SEARCH REQUISITIONS)
              ───────────────────────────────────────────────────────────── */}
          {activeMainTab === 'requisitions' && viewMode === 'portal' && (
            <div>
              <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '8px' }}>
                You are here: <span style={{ color: '#0066cc', cursor: 'pointer' }}>Home</span> &gt; Requisitions
              </div>

              {/* Search Requisitions Filter Panel */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px 18px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h2 style={{ margin: 0, fontSize: '15px', color: '#1e3a8a', fontWeight: 'bold' }}>
                    Search Requisitions
                  </h2>
                  <span
                    onClick={handleAddNewRequisition}
                    style={{ color: '#0066cc', fontWeight: 'bold', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Add new Requisition
                  </span>
                </div>

                <div
                  onClick={() => setShowFilterPanel(prev => !prev)}
                  style={{
                    background: '#bfdbfe', border: '1px solid #93c5fd', padding: '6px 12px',
                    fontSize: '11.5px', fontWeight: 'bold', color: '#1e3a8a', cursor: 'pointer',
                    borderRadius: '3px 3px 0 0', display: 'flex', justifyContent: 'space-between'
                  }}
                >
                  <span>Modify Search &gt;&gt;</span>
                  <span>{showFilterPanel ? '▲ Hide Filters' : '▼ Show Filters'}</span>
                </div>

                {showFilterPanel && (
                  <form onSubmit={e => { e.preventDefault(); setCurrentPage(1); }} style={{ border: '1px solid #cbd5e1', borderTop: 'none', padding: '14px 16px', background: '#fdfdfe' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '14px 30px', fontSize: '11.5px' }}>
                      
                      {/* Left Column */}
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 10px', alignItems: 'center' }}>
                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Requisition #:</label>
                        <input type="text" value={reqFilters.reqId} onChange={e => setReqFilters({ ...reqFilters, reqId: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Position Title:</label>
                        <input type="text" value={reqFilters.title} onChange={e => setReqFilters({ ...reqFilters, title: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Skills:</label>
                        <input type="text" value={reqFilters.skills} onChange={e => setReqFilters({ ...reqFilters, skills: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>City:</label>
                        <input type="text" value={reqFilters.city} onChange={e => setReqFilters({ ...reqFilters, city: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>State:</label>
                        <select value={reqFilters.state} onChange={e => setReqFilters({ ...reqFilters, state: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>Select State</option>
                          <option>SC</option>
                          <option>VA</option>
                          <option>TX</option>
                          <option>NC</option>
                          <option>GA</option>
                          <option>FL</option>
                        </select>

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Office:</label>
                        <select value={reqFilters.office} onChange={e => setReqFilters({ ...reqFilters, office: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>All</option>
                          <option>Columbia</option>
                          <option>Richmond</option>
                          <option>Austin</option>
                        </select>

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Assigned To:</label>
                        <select value={reqFilters.assignedTo} onChange={e => setReqFilters({ ...reqFilters, assignedTo: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option value="Any">Any</option>
                          {allRecruitersList.map(r => (
                            <option key={r.name} value={r.name}>{r.name} {r.name === userName ? '(You)' : ''}</option>
                          ))}
                        </select>

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Zip Code:</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input type="text" value={reqFilters.zipCode} onChange={e => setReqFilters({ ...reqFilters, zipCode: e.target.value })} style={{ width: '60px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />
                          <select value={reqFilters.radius} onChange={e => setReqFilters({ ...reqFilters, radius: e.target.value })} style={{ padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                            <option>Within Miles</option>
                            <option>10</option>
                            <option>25</option>
                            <option>50</option>
                            <option>100</option>
                          </select>
                        </div>

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Req Category:</label>
                        <select value={reqFilters.category} onChange={e => setReqFilters({ ...reqFilters, category: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>Select Req Category</option>
                          <option>SP</option>
                          <option>IT</option>
                          <option>ENG</option>
                        </select>
                      </div>

                      {/* Right Column */}
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 10px', alignItems: 'center' }}>
                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Creation Date:</label>
                        <input type="text" placeholder="MM/DD/YYYY" value={reqFilters.creationDate} onChange={e => setReqFilters({ ...reqFilters, creationDate: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Deadline Date:</label>
                        <input type="text" placeholder="MM/DD/YYYY" value={reqFilters.deadlineDate} onChange={e => setReqFilters({ ...reqFilters, deadlineDate: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }} />

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Status:</label>
                        <select value={reqFilters.status} onChange={e => setReqFilters({ ...reqFilters, status: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>Select Status</option>
                          <option>In-Progress</option>
                          <option>Ready</option>
                          <option>Closed</option>
                          <option>All</option>
                        </select>

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>End client:</label>
                        <select value={reqFilters.endClient} onChange={e => setReqFilters({ ...reqFilters, endClient: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>Any</option>
                          <option>State Of SC</option>
                          <option>DFA</option>
                          <option>DBHDS</option>
                          <option>VDOT</option>
                        </select>

                        <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', margin: '4px 0' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                            <input type="checkbox" checked={reqFilters.govtReqs} onChange={e => setReqFilters({ ...reqFilters, govtReqs: e.target.checked })} /> Govt Requisitions
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                            <input type="checkbox" checked={reqFilters.directClient} onChange={e => setReqFilters({ ...reqFilters, directClient: e.target.checked })} /> Direct Client
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                            <input type="checkbox" checked={reqFilters.working} onChange={e => setReqFilters({ ...reqFilters, working: e.target.checked })} /> Working(W)
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                            <input type="checkbox" checked={reqFilters.keyReq} onChange={e => setReqFilters({ ...reqFilters, keyReq: e.target.checked })} /> Key (K)
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                            <input type="checkbox" checked={reqFilters.hotReq} onChange={e => setReqFilters({ ...reqFilters, hotReq: e.target.checked })} /> Hot Req
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                            <input type="checkbox" checked={reqFilters.incumbentVendor} onChange={e => setReqFilters({ ...reqFilters, incumbentVendor: e.target.checked })} /> IncumbentVendor(IV)
                          </label>
                        </div>

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Subcontractable:</label>
                        <select value={reqFilters.subcontractable} onChange={e => setReqFilters({ ...reqFilters, subcontractable: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>Select</option>
                          <option>No</option>
                          <option>Yes</option>
                        </select>

                        <label style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Req Type:</label>
                        <select value={reqFilters.reqType} onChange={e => setReqFilters({ ...reqFilters, reqType: e.target.value })} style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                          <option>Select Req Type</option>
                          <option>Contract</option>
                          <option>Permanent</option>
                          <option>C2H</option>
                        </select>
                      </div>

                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setReqFilters({
                            reqId: '',
                            title: '',
                            skills: '',
                            city: '',
                            state: 'Select State',
                            office: 'All',
                            assignedTo: 'Any',
                            zipCode: '',
                            radius: 'Within Miles',
                            category: 'Select Req Category',
                            creationDate: '',
                            deadlineDate: '',
                            status: 'Select Status',
                            endClient: 'Any',
                            govtReqs: false,
                            directClient: false,
                            working: false,
                            keyReq: false,
                            hotReq: false,
                            incumbentVendor: false,
                            subcontractable: 'Select',
                            reqType: 'Select Req Type'
                          })
                        }}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 12px', fontSize: '11.5px', cursor: 'pointer' }}
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '3px 18px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Search
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* All Open Requisitions Table */}
              <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '4px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h2 style={{ margin: '0 0 2px', fontSize: '15px', color: '#16a34a', fontWeight: 'bold' }}>
                  SmartHire Recruitment Portal Home
                </h2>
                <div style={{ fontSize: '12px', color: '#334155', fontWeight: 'bold', marginBottom: '12px' }}>
                  Welcome back to SmartWorks. You have {jobs.length} tasks.
                </div>

                <div style={{
                  background: '#bfdbfe', border: '1px solid #93c5fd', padding: '6px 12px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderRadius: '3px 3px 0 0'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a' }}>All Open Requisitions</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a' }}>
                    (Requisitions {filteredJobs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredJobs.length)} of {filteredJobs.length})
                  </span>
                </div>

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
                            No open requisitions found matching search criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedJobs.map((job, idx) => (
                          <tr key={job.id} style={{
                            background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                            borderBottom: '1px solid #e2e8f0'
                          }}>
                            <td style={{ padding: '7px 9px', fontWeight: 'bold' }}>
                              <span onClick={() => handleOpenReq(job)} style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>
                                {job.id.replace('J-', '')}
                              </span>
                            </td>
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
                            <td style={{ padding: '7px 9px', color: '#1e3a8a', fontWeight: 'bold' }}>
                              {Array.isArray(job.assignedRecruiters) && job.assignedRecruiters.length > 0
                                ? job.assignedRecruiters.join(', ')
                                : ''}
                            </td>
                            <td style={{ padding: '7px 9px', color: '#16a34a', fontWeight: 'bold' }}>{job.status === 'Active' ? 'In-Progress' : (job.status || 'In-Progress')}</td>
                            <td style={{ padding: '7px 9px', color: '#475569' }}>SP</td>
                            <td style={{ padding: '7px 9px', color: '#475569' }}>{job.type || 'Contract'}</td>
                            <td style={{ padding: '7px 9px', color: '#475569' }}>{job.duration || '12'}</td>
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

                {/* Pagination */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderTop: '1px solid #cbd5e1', paddingTop: '10px', marginTop: '10px'
                }}>
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

                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                    Page Size:
                    <select value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} style={{ marginLeft: '6px', fontSize: '11px', padding: '1px 3px' }}>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* ═══════════ MODAL 1: ADD / EDIT TEAM USER (RECRUITER / EMPLOYEE / ADMIN) ═══════════ */}
        {showUserModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px'
          }}>
            <div style={{
              background: '#ffffff', borderRadius: '6px', width: '100%', maxWidth: '520px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden', border: '1px solid #cbd5e1'
            }}>
              {/* Modal Header */}
              <div style={{ background: '#ea580c', color: '#ffffff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>
                  {editingUser ? '✏️ Edit Team Member' : (isAdmin ? '➕ Add New Recruiter / Employee' : '➕ Add Employee Under My Account')}
                </h3>
                <span
                  onClick={() => setShowUserModal(false)}
                  style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1' }}
                >
                  &times;
                </span>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={e => {
                e.preventDefault()
                if (!userFormData.name.trim() || !userFormData.email.trim()) {
                  alert('Please enter both Name and Email.')
                  return
                }

                let updatedList
                if (editingUser) {
                  updatedList = teamUsers.map(u => {
                    if (u.id === editingUser.id || u.email === editingUser.email) {
                      return {
                        ...u,
                        name: userFormData.name.trim(),
                        email: userFormData.email.trim(),
                        password: userFormData.password.trim(),
                        role: userFormData.role,
                        parentRecruiterName: userFormData.role === 'employee' ? (userFormData.parentRecruiterName || (isRecruiter ? userName : '')) : '',
                        company: userFormData.company || 'SmartHire LLC',
                        isActive: userFormData.isActive !== false
                      }
                    }
                    return u
                  })
                  setSaveToastMessage(`✅ Updated profile for ${userFormData.name}!`)
                } else {
                  const newUserId = userFormData.role === 'employee' ? `emp-${Date.now().toString().slice(-4)}` : `rec-${Date.now().toString().slice(-4)}`
                  const newUser = {
                    id: newUserId,
                    name: userFormData.name.trim(),
                    email: userFormData.email.trim(),
                    password: userFormData.password.trim() || 'recruiter123',
                    role: userFormData.role,
                    parentRecruiterName: userFormData.role === 'employee' ? (userFormData.parentRecruiterName || (isRecruiter ? userName : '')) : '',
                    company: userFormData.company || 'SmartHire LLC',
                    isActive: userFormData.isActive !== false
                  }
                  updatedList = [...teamUsers, newUser]
                  setSaveToastMessage(`🎉 User ${newUser.name} created successfully as ${newUser.role}!`)
                }

                saveTeamUsers(updatedList)
                setShowUserModal(false)
                setTimeout(() => setSaveToastMessage(null), 4000)
              }} style={{ padding: '18px 20px', fontSize: '12px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={userFormData.name}
                      onChange={e => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Corporate Email (Login ID) *</label>
                    <input
                      type="email"
                      required
                      placeholder="sarah@smarthire.io"
                      value={userFormData.email}
                      onChange={e => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Password *</label>
                    <input
                      type="text"
                      required
                      placeholder="Password"
                      value={userFormData.password}
                      onChange={e => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Role / Level *</label>
                    {isAdmin ? (
                      <select
                        value={userFormData.role}
                        onChange={e => setUserFormData(prev => ({ ...prev, role: e.target.value }))}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#ffffff' }}
                      >
                        <option value="recruiter">Lead Recruiter</option>
                        <option value="employee">Employee / Sourcing Specialist</option>
                        <option value="superadmin">Administrator / Manager</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        readOnly
                        value="Employee (Reporting to You)"
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#f1f5f9', color: '#64748b', fontWeight: 'bold' }}
                      />
                    )}
                  </div>
                </div>

                {/* Reports To (Only relevant if role is employee) */}
                {userFormData.role === 'employee' && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>
                      Reporting Manager / Lead Recruiter
                    </label>
                    {isAdmin ? (
                      <select
                        value={userFormData.parentRecruiterName || ''}
                        onChange={e => setUserFormData(prev => ({ ...prev, parentRecruiterName: e.target.value }))}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#ffffff' }}
                      >
                        <option value="">None (Independent Employee)</option>
                        {teamUsers
                          .filter(u => u.role === 'recruiter' || u.role === 'superadmin')
                          .map(u => (
                            <option key={u.id || u.name} value={u.name}>
                              {u.name} ({u.role})
                            </option>
                          ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        readOnly
                        value={userName}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#f1f5f9', color: '#1e3a8a', fontWeight: 'bold' }}
                      />
                    )}
                    <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '3px' }}>
                      Requisitions assigned to this employee will automatically be visible to the reporting recruiter.
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginTop: '8px' }}>
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={userFormData.isActive !== false}
                    onChange={e => setUserFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <label htmlFor="isActiveCheck" style={{ fontWeight: 'bold', color: '#334155', cursor: 'pointer' }}>
                    Account is Active (Can log in to portal)
                  </label>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: '#ea580c', color: '#ffffff', border: 'none', padding: '6px 18px', fontSize: '12px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                  >
                    {editingUser ? 'Save Changes' : 'Create User'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ═══════════ MODAL 2: ADD / SUBMIT CANDIDATE DIRECTLY TO REQUISITION ═══════════ */}
        {showAddCandidateModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px'
          }}>
            <div style={{
              background: '#ffffff', borderRadius: '6px', width: '100%', maxWidth: '600px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden', border: '1px solid #cbd5e1'
            }}>
              {/* Modal Header */}
              <div style={{ background: '#ea580c', color: '#ffffff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>
                    ➕ Add Candidate to Requisition #{selectedReq?.id?.replace('J-', '') || '158938'}
                  </h3>
                  <div style={{ fontSize: '11px', color: '#ffedd5', marginTop: '2px' }}>
                    {selectedReq?.title || 'Senior Software Engineer'}
                  </div>
                </div>
                <span
                  onClick={() => setShowAddCandidateModal(false)}
                  style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1' }}
                >
                  &times;
                </span>
              </div>

              {/* Form Body */}
              <form onSubmit={e => {
                e.preventDefault()
                if (!newCandReqForm.firstName.trim() || !newCandReqForm.lastName.trim()) {
                  alert('Please enter both First Name and Last Name.')
                  return
                }

                const cleanId = String(selectedReq?.id || '158938').replace('J-', '')
                const fullName = `${newCandReqForm.firstName.trim()} ${newCandReqForm.lastName.trim()}`
                const newCandId = `CAND-${Date.now().toString().slice(-5)}`
                const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                const newCandObj = {
                  id: newCandId,
                  name: fullName,
                  payRate: `$${newCandReqForm.payRate}/hr`,
                  payRateType: newCandReqForm.payRateType || 'C2C',
                  assignedBy: userName,
                  assignedOn: dateStr,
                  status: newCandReqForm.status || 'Int-SubmittedToManager',
                  statusComments: newCandReqForm.comments || 'Direct submission',
                  interview: 'Select',
                  rejectedReason: '',
                  lastChangedBy: userName,
                  lastChangedRole: isAdmin ? 'superadmin' : (isRecruiter ? 'Recruiter' : 'Employee'),
                  lastChangedOn: dateStr
                }

                const updatedCandidates = [newCandObj, ...potentialCandidates]
                setPotentialCandidates(updatedCandidates)

                try {
                  localStorage.setItem(`smarthire_potential_candidates_${cleanId}`, JSON.stringify(updatedCandidates))
                } catch (err) {}

                setShowAddCandidateModal(false)
                setSaveToastMessage(`🎉 Candidate ${fullName} successfully added to Requisition #${cleanId}!`)
                setTimeout(() => setSaveToastMessage(null), 4000)
              }} style={{ padding: '18px 20px', fontSize: '12px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="First Name"
                      value={newCandReqForm.firstName}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, firstName: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Last Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Last Name"
                      value={newCandReqForm.lastName}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, lastName: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="candidate@email.com"
                      value={newCandReqForm.email}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, email: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="(555) 000-0000"
                      value={newCandReqForm.phone}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, phone: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Proposed Pay Rate ($/hr) *</label>
                    <input
                      type="text"
                      required
                      placeholder="75"
                      value={newCandReqForm.payRate}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, payRate: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Rate Type</label>
                    <select
                      value={newCandReqForm.payRateType}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, payRateType: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#ffffff' }}
                    >
                      <option value="C2C">C2C</option>
                      <option value="W2">W2</option>
                      <option value="1099">1099</option>
                      <option value="Fulltime">Fulltime</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Work Authorization</label>
                    <select
                      value={newCandReqForm.workAuth}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, workAuth: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#ffffff' }}
                    >
                      <option value="US Citizen">US Citizen</option>
                      <option value="Green Card">Green Card</option>
                      <option value="H1B">H1B</option>
                      <option value="EAD - GC">EAD - GC</option>
                      <option value="OPT/CPT">OPT/CPT</option>
                      <option value="TN Visa">TN Visa</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Initial Submission Status</label>
                    <select
                      value={newCandReqForm.status}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, status: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', background: '#ffffff', fontWeight: 'bold' }}
                    >
                      <option value="Int-SubmittedToManager">Int-SubmittedToManager</option>
                      <option value="Int-ApprovedByManager">Int-ApprovedByManager</option>
                      <option value="Agency-Submitted">Agency-Submitted</option>
                      <option value="Client-SubmittedToCustomer">Client-SubmittedToCustomer</option>
                      <option value="Placed">Placed</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Key Skills</label>
                    <input
                      type="text"
                      placeholder="React, Java, AWS, Python"
                      value={newCandReqForm.skills}
                      onChange={e => setNewCandReqForm(prev => ({ ...prev, skills: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Submission Notes / Comments</label>
                  <textarea
                    rows={2}
                    placeholder="Candidate profile summary, availability, and screening notes..."
                    value={newCandReqForm.comments}
                    onChange={e => setNewCandReqForm(prev => ({ ...prev, comments: e.target.value }))}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '14px', fontSize: '11px', color: '#475569' }}>
                  👤 Submitting as: <strong style={{ color: '#0284c7' }}>{userName}</strong> ({isAdmin ? 'Administrator' : (isRecruiter ? 'Lead Recruiter' : 'Employee')})
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddCandidateModal(false)}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: '#ea580c', color: '#ffffff', border: 'none', padding: '6px 20px', fontSize: '12px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                  >
                    Submit to Requisition
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ═══════════ SMARTHIRE ORANGE FOOTER ═══════════ */}
        <footer style={{ background: '#ea580c', borderTop: '2px solid #c2410c', color: '#ffffff', textAlign: 'center', padding: '10px', marginTop: '30px', fontSize: '11px', fontWeight: 'bold' }}>
          © SmartHire LLC | All rights reserved | Release 1.9 06-May-2025 (New Server 2023 Aug)
        </footer>

      </div>
    </SiteLayout>
  )
}

export default RecruiterDashboard
