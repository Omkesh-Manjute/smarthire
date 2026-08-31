import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveMessageFirestore, getMessagesFirestore } from '../lib/atsFirestore'

const POLL_INTERVAL = 3000

// --- Inline SVG Icons to prevent question marks or encoding bugs ---
const IconArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
)
const IconChat = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
)
const IconZap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
)
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
)
const IconBriefcase = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
)
const IconLocation = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
)
const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
)
const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
)
const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
)
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
)
const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
)
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
)
const IconSun = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
)
const IconMoon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
)
const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
)

function getInitials(name = '') {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (name[0] || '?').toUpperCase()
}

function getAvatarColor(name = '') {
  const colors = ['#2563EB','#7C3AED','#059669','#D97706','#DC2626','#0891B2','#9333EA','#16A34A','#EA580C','#BE123C']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function Avatar({ name, size = 40, style = {} }) {
  const bg = getAvatarColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: '#FFF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: Math.round(size * 0.38), flexShrink: 0,
      letterSpacing: '-0.5px', ...style
    }}>
      {getInitials(name)}
    </div>
  )
}

const highlightResumeText = (text, matchingSkills = []) => {
  if (!text) {
    return (
      <div style={{
        backgroundColor: '#FFFFFF',
        color: '#64748B',
        fontStyle: 'italic',
        padding: '36px 44px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        No resume text available.
      </div>
    )
  }

  let highlighted = text;
  if (matchingSkills && matchingSkills.length > 0) {
    // Sort skills by length descending to prevent partial replacements of nested words
    const sortedSkills = [...matchingSkills].sort((a, b) => b.length - a.length);

    sortedSkills.forEach(skill => {
      if (!skill || skill.length < 2) return;
      // Escape special characters in skill name for regex
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Build smart boundary check: use word boundaries for alphanumeric skills
      const startBoundary = /^[a-zA-Z0-9]/.test(skill.trim()) ? '\\b' : '';
      const endBoundary = /[a-zA-Z0-9]$/.test(skill.trim()) ? '\\b' : '';
      const regex = new RegExp(`${startBoundary}(${escaped})${endBoundary}`, 'gi');
      
      highlighted = highlighted.replace(regex, `<mark style="background-color: #FEF08A; color: #0F172A; font-weight: 800; padding: 1px 4px; border-radius: 3px;">$1</mark>`);
    });
  }

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: highlighted }} 
      style={{ 
        whiteSpace: 'pre-wrap', 
        lineHeight: '1.8', 
        fontSize: '14.5px', 
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#1E293B',
        backgroundColor: '#FFFFFF',
        padding: '40px 48px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02)',
        boxSizing: 'border-box'
      }} 
    />
  )
}

export default function RecruiterInbox() {
  const navigate = useNavigate()
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('smarthire_theme') || 'light')
  const isLight = themeMode === 'light'

  const C = {
    bg: isLight ? '#F8FAFC' : '#0B0F17',
    surface: isLight ? '#FFFFFF' : '#1E293B',
    sidebar: isLight ? '#FFFFFF' : '#0F172A',
    border: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.08)',
    textPrimary: isLight ? '#0F172A' : '#F1F5F9',
    textSecondary: isLight ? '#64748B' : '#94A3B8',
    activeConv: isLight ? '#EFF6FF' : 'rgba(37,99,235,0.14)',
    inputBg: isLight ? '#F1F5F9' : '#0F172A',
    inputBorder: isLight ? '#CBD5E1' : 'rgba(255,255,255,0.12)',
    msgOther: isLight ? '#F1F5F9' : '#334155',
    msgOtherText: isLight ? '#1E293B' : '#F1F5F9',
    shadow: isLight ? '0 4px 24px rgba(0,0,0,0.06)' : '0 4px 24px rgba(0,0,0,0.3)',
    headerBg: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.95)',
  }

  const [threads, setThreads] = useState([])
  const [activeThread, setActiveThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [candidateDetails, setCandidateDetails] = useState(null)
  const [showFullProfileModal, setShowFullProfileModal] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const pollingRef = useRef(null)

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

  const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user')
  let currentUser = null
  try {
    if (userStr) currentUser = JSON.parse(userStr)
  } catch (e) {}

  const teamUsersList = (() => {
    try {
      const raw = localStorage.getItem('smarthire_recruiters')
      if (raw) return JSON.parse(raw) || []
    } catch(e) {}
    return []
  })()

  const matchedUserInTeam = teamUsersList.find(u =>
    (u.email && currentUser?.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
    (u.name && currentUser?.name && u.name.toLowerCase() === currentUser.name.toLowerCase())
  )

  const defaultRole = (currentUser && currentUser.role) ? currentUser.role : 'superadmin'
  const activeRole = localStorage.getItem('smarthire_active_role') || defaultRole
  const isSuperAdmin = activeRole === 'superadmin' || activeRole === 'admin'
  const isAdmin = isSuperAdmin
  const isManager = activeRole === 'manager' || defaultRole === 'manager'
  const isEmployee = activeRole === 'employee' || defaultRole === 'employee'
  const isRecruiter = activeRole === 'recruiter' || defaultRole === 'recruiter'
  
  const resolvedParentName = currentUser?.parentRecruiterName || matchedUserInTeam?.parentRecruiterName || 
    (currentUser?.name?.toLowerCase().includes('gourav') || currentUser?.email?.toLowerCase().includes('gourav') ? 'Omkesh' : (isEmployee ? 'Sukamal Chatterjee' : ''))

  const isReportee = Boolean(resolvedParentName && !isSuperAdmin && !isManager && resolvedParentName.toLowerCase() !== (currentUser?.name || '').toLowerCase())

  const parentRecruiterName = resolvedParentName || 'Sukamal Chatterjee'
  const parentRecruiterEmail = currentUser?.parentRecruiterEmail || 
    (parentRecruiterName.toLowerCase().includes('omkesh') ? 'omkesh@coolsofttech.com' : 
     parentRecruiterName.toLowerCase().includes('vaibhav') ? 'vaibhav@coolsofttech.com' : 'sukamal.c@smarthire.com')

  const [recruiterFilter, setRecruiterFilter] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
      if (u.refCode) return u.refCode
      if (u.email) {
        const found = ALL_SMARTHIRE_RECRUITERS.find(r => r.email.toLowerCase() === u.email.toLowerCase() || r.refCode.toLowerCase() === u.email.toLowerCase())
        if (found) return found.refCode
      }
    } catch (e) {}
    return 'all'
  })

  const quickTemplates = isReportee ? [
    `Hi ${parentRecruiterName}, could you please review this candidate profile for Requisition #158999?`,
    `Could you confirm if the bill rate of $90/hr and pay rate of $74/hr is approved for this candidate?`,
    `Candidate's Right to Represent (RTR) form and work authorization docs have been verified.`,
    `Candidate is immediately available for client interview rounds this week.`,
    `Please let me know if any additional screening notes are required before submission.`
  ] : [
    "Hi! I reviewed your resume and would love to connect. Are you available for a quick call this week?",
    "Thank you for your application! Could you confirm your work authorization status and notice period?",
    "Great news! We would like to move forward with your profile. Please confirm your availability for an interview.",
    "Could you share your LinkedIn profile URL and expected hourly rate for this position?",
    "We are submitting your profile to our client. You will hear back within 2-3 business days."
  ]

  const fetchThreads = useCallback(async () => {
    let candidateThreads = []
    try {
      const queryParam = recruiterFilter !== 'all' ? `?recruiter=${encodeURIComponent(recruiterFilter)}` : ''
      const res = await fetch(`/api/messages${queryParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`,
          'x-recruiter-ref': recruiterFilter
        }
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.threads)) {
        candidateThreads = data.threads
      }
    } catch (e) { console.warn('Candidate thread fetch error:', e) }

    // ─── DYNAMIC TEAM REPORTING CHANNELS ───
    const teamChannels = []

    if (isReportee) {
      // Employee / Sourcing Specialist channel with their direct supervisor (e.g. Naveen -> Sukamal)
      const threadId = `team-reportee-${(currentUser?.email || 'emp').toLowerCase().trim()}`
      let fsMsgs = []
      try { fsMsgs = await getMessagesFirestore(threadId) } catch(e) {}
      const lastMsgText = (fsMsgs && fsMsgs.length > 0) ? fsMsgs[fsMsgs.length - 1].text : 'Direct reporting & candidate approval channel'
      const lastMsgTime = (fsMsgs && fsMsgs.length > 0) ? fsMsgs[fsMsgs.length - 1].timestamp : new Date().toISOString()

      const supervisorThread = {
        candidateId: threadId,
        candidateName: `${parentRecruiterName} (Reporting Supervisor / Lead)`,
        jobTitle: 'Reporting Supervisor & Sourcing Approvals',
        lastMessage: lastMsgText,
        lastMessageTime: lastMsgTime,
        unreadCount: 0,
        isLeadChannel: true,
        isTeamMember: true,
        email: parentRecruiterEmail,
        role: 'Lead Recruiter'
      }
      teamChannels.push(supervisorThread)
    } else {
      // Supervisor / Lead Recruiter / Admin (e.g. Sukamal Chatterjee, Omkesh, Vaibhav)
      // Find all reportees assigned to this supervisor
      const myName = (currentUser?.name || '').toLowerCase().trim()
      const myEmail = (currentUser?.email || '').toLowerCase().trim()

      const myReportees = teamUsersList.filter(u => {
        if (!u || !u.name) return false
        const pName = (u.parentRecruiterName || '').toLowerCase().trim()
        const pEmail = (u.parentRecruiterEmail || '').toLowerCase().trim()
        const uEmail = (u.email || '').toLowerCase().trim()
        if (uEmail === myEmail) return false
        if (isAdmin || isSuperAdmin) {
          return u.role === 'employee' || u.role === 'recruiter'
        }
        return pName === myName || (myEmail && pEmail === myEmail) || (myName && pName.includes(myName))
      })

      for (const rep of myReportees) {
        const threadId = `team-reportee-${(rep.email || '').toLowerCase().trim()}`
        let fsMsgs = []
        try { fsMsgs = await getMessagesFirestore(threadId) } catch(e) {}
        const lastMsgText = (fsMsgs && fsMsgs.length > 0) ? fsMsgs[fsMsgs.length - 1].text : 'Team reporting & candidate review channel'
        const lastMsgTime = (fsMsgs && fsMsgs.length > 0) ? fsMsgs[fsMsgs.length - 1].timestamp : new Date().toISOString()

        teamChannels.push({
          candidateId: threadId,
          candidateName: `${rep.name} (Sourcing Specialist)`,
          jobTitle: `Direct Reportee • ${rep.company || 'SmartHire Team'}`,
          lastMessage: lastMsgText,
          lastMessageTime: lastMsgTime,
          unreadCount: 0,
          isLeadChannel: false,
          isTeamMember: true,
          email: rep.email,
          phone: rep.phone || '571-660-5778',
          role: rep.role || 'Employee / Sourcing Specialist'
        })
      }
    }

    const combined = isReportee ? teamChannels : [...teamChannels, ...candidateThreads]
    setThreads(combined)

    if (!activeThread && combined.length > 0) {
      setActiveThread(combined[0])
    }
    setLoadingThreads(false)
  }, [recruiterFilter, isReportee, parentRecruiterName, parentRecruiterEmail, currentUser?.email, currentUser?.name, isAdmin, isSuperAdmin, teamUsersList, activeThread])

  const fetchCandidateDetails = useCallback(async (candidateId, threadObj = null) => {
    const thread = threadObj || threads.find(t => t.candidateId === candidateId)
    if (thread?.isTeamMember || thread?.isLeadChannel || candidateId.startsWith('team-') || candidateId.startsWith('lead-')) {
      const isLead = thread?.isLeadChannel || isReportee
      setCandidateDetails({
        name: thread?.candidateName || (isLead ? parentRecruiterName : 'Team Member'),
        email: thread?.email || (isLead ? parentRecruiterEmail : 'team@coolsofttech.com'),
        role: thread?.role || (isLead ? 'Lead Recruiter & Reporting Supervisor' : 'Sourcing Specialist / Team Member'),
        phone: thread?.phone || '571-660-5778',
        location: 'Richmond, VA / Remote',
        skills: isLead 
          ? ['Team Supervision', 'Requisition Approvals', 'Client Delivery', 'Rate Clearances', 'Candidate Intake']
          : ['Active Sourcing', 'Resume Verification', 'RTR Screening', 'Boolean Search', 'Candidate Engagement'],
        summary: isLead
          ? `Lead Recruiter supervisor for ${currentUser?.name || 'Recruiter'}. Reviews candidates, requisition queries, and approves client submissions.`
          : `Team member reporting to ${currentUser?.name || 'Lead Recruiter'}. Sources candidates, collects RTR documents, and submits profiles for requisition matching.`
      })
      return
    }

    try {
      let res;
      if (candidateId && candidateId.startsWith('SCR-')) {
        res = await fetch('/api/screening/' + candidateId, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
          }
        })
      } else {
        res = await fetch('/api/candidates/' + candidateId, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
          }
        })
      }
      const data = await res.json()
      if (data.success) {
        const candidateObj = data.session || data.candidate || data.data?.candidate
        setCandidateDetails(candidateObj)
      } else {
        setCandidateDetails(null)
      }
    } catch (e) { setCandidateDetails(null) }
  }, [isReportee, parentRecruiterName, parentRecruiterEmail, currentUser?.name, threads])

  const fetchMessages = useCallback(async (candidateId, silent = false) => {
    if (!candidateId) return
    if (!silent) setLoadingMessages(true)
    try {
      // 1. Fetch from Firestore
      let fsMsgs = []
      try {
        fsMsgs = await getMessagesFirestore(candidateId)
      } catch(e) {}

      // 2. Fetch from backend /api/messages/:candidateId
      let backendMsgs = []
      try {
        const res = await fetch('/api/messages/' + candidateId, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
          }
        })
        const data = await res.json()
        if (data.success && Array.isArray(data.messages)) {
          backendMsgs = data.messages
        }
      } catch (e) {}

      // Merge and deduplicate
      const msgMap = new Map()
      ;[...(fsMsgs || []), ...(backendMsgs || [])].forEach(m => {
        if (!m) return
        const key = m.id || `${m.timestamp}_${m.text}`
        if (!msgMap.has(key)) msgMap.set(key, m)
      })

      let merged = Array.from(msgMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

      if (merged.length === 0 && candidateId.startsWith('team-reportee-')) {
        const initial = [
          {
            id: 'lead-init-1',
            sender: 'lead',
            senderName: parentRecruiterName,
            senderEmail: parentRecruiterEmail,
            text: `Hi! Welcome to your direct reporting channel. Feel free to send candidate profiles for review, ask requisition questions, or request rate clearances here.`,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            candidateId: candidateId
          }
        ]
        merged = initial
      }

      setMessages(merged)
    } catch (e) {
      console.warn('Message fetch error:', e)
    } finally {
      if (!silent) setLoadingMessages(false)
    }
  }, [parentRecruiterName, parentRecruiterEmail])

  const selectThread = useCallback(async (thread) => {
    setActiveThread(thread)
    setInputText('')
    setShowTemplates(false)
    await fetchMessages(thread.candidateId)
    fetchCandidateDetails(thread.candidateId, thread)
    if (!thread.isLeadChannel && !thread.isTeamMember) {
      try {
        await fetch('/api/messages/' + thread.candidateId + '/read', { 
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
          }
        })
        setThreads(prev => prev.map(t => t.candidateId === thread.candidateId ? { ...t, unreadCount: 0 } : t))
      } catch (e) {}
    }
  }, [fetchMessages, fetchCandidateDetails])

  const handleSend = async (textOverride) => {
    const text = (textOverride || inputText).trim()
    if (!text || !activeThread) return
    setSending(true)
    setInputText('')
    setShowTemplates(false)

    const isMeEmployee = (currentUser?.role === 'employee' || isReportee)
    const senderType = isMeEmployee ? 'employee' : 'recruiter'

    const newMsg = {
      id: 'msg-' + Date.now(),
      sender: senderType,
      senderName: currentUser?.name || (isMeEmployee ? 'Employee' : 'Recruiter'),
      senderEmail: (currentUser?.email || '').toLowerCase().trim(),
      text: text,
      candidateName: activeThread.candidateName,
      jobTitle: activeThread.jobTitle,
      timestamp: new Date().toISOString(),
      candidateId: activeThread.candidateId,
      read: false
    }

    // Optimistic local state update
    setMessages(prev => [...prev.filter(m => m.id !== newMsg.id), newMsg])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    // 1. Save to Cloud Firestore in real-time
    saveMessageFirestore(activeThread.candidateId, newMsg).catch(err => console.warn('Firestore msg error:', err))

    // 2. Save to backend API
    try {
      await fetch('/api/messages/' + activeThread.candidateId, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        },
        body: JSON.stringify(newMsg)
      })
    } catch (e) {}

    // 3. Update thread preview
    setThreads(prev => prev.map(t => {
      if (t.candidateId === activeThread.candidateId) {
        return {
          ...t,
          lastMessage: text,
          lastMessageTime: newMsg.timestamp
        }
      }
      return t
    }))

    setSending(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  useEffect(() => { fetchThreads() }, [fetchThreads])

  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (activeThread) {
      pollingRef.current = setInterval(() => {
        fetchMessages(activeThread.candidateId, true)
        fetchThreads()
      }, POLL_INTERVAL)
    }
    return () => clearInterval(pollingRef.current)
  }, [activeThread, fetchMessages, fetchThreads])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const visibleThreads = threads.filter(t => {
    if (!t) return false
    if (recruiterFilter === 'all') return true
    const tRef = (t.refCode || t.referredBy || '').toLowerCase()
    const tEmail = (t.recruiterEmail || t.createdBy || '').toLowerCase()
    const tName = (t.recruiterName || '').toLowerCase()
    const target = recruiterFilter.toLowerCase()
    return tRef === target || tRef.includes(target) || tEmail.includes(target) || tName.includes(target) || target.includes(tRef)
  })

  const filteredThreads = visibleThreads.filter(t => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (t.candidateName || '').toLowerCase().includes(q) ||
      (t.jobTitle || '').toLowerCase().includes(q) ||
      (t.lastMessage || '').toLowerCase().includes(q)
  })

  const totalUnread = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0)
  const candidateName = activeThread?.candidateName || 'Candidate'
  const candidateJob = activeThread?.jobTitle || 'Vacancy'
  const profile = candidateDetails?.extracted_profile || candidateDetails

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', backgroundColor:C.bg, fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", color:C.textPrimary, overflow:'hidden' }}>
      {/* Top Navbar */}
      <header style={{ backgroundColor:C.headerBg, backdropFilter:'blur(12px)', borderBottom:`1px solid ${C.border}`, padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:62, flexShrink:0, boxShadow:C.shadow, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => navigate('/ats')} style={{ background:C.inputBg, border:`1px solid ${C.border}`, borderRadius:8, padding:'6px 12px', cursor:'pointer', color:C.textSecondary, fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6 }} title="Back to ATS">
            <IconArrowLeft /> Back to ATS
          </button>
          <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#2563EB,#3B82F6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
            <IconChat />
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:C.textPrimary, lineHeight:1.2 }}>
              {isReportee ? 'Lead Recruiter Messaging' : 'Recruiter Inbox'}
            </div>
            <div style={{ fontSize:11, color:C.textSecondary }}>
              {isReportee ? `Reporting Channel with ${parentRecruiterName} (Lead Recruiter)` : 'Live Candidate Conversations'}
            </div>
          </div>
          {totalUnread > 0 && <span style={{ background:'#EF4444', color:'#FFF', fontSize:11, fontWeight:800, borderRadius:12, padding:'2px 8px', marginLeft:4 }}>{totalUnread} unread</span>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:12, color:C.textSecondary, background:C.inputBg, border:`1px solid ${C.border}`, padding:'5px 14px', borderRadius:20, fontWeight:600, display:'inline-flex', alignItems:'center', gap:6 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#22C55E', display:'inline-block' }} /> {isReportee ? '1 Supervisor Channel' : `${visibleThreads.length} Conversations`}
          </span>
          <button onClick={() => { const m = themeMode==='light'?'dark':'light'; setThemeMode(m); localStorage.setItem('smarthire_theme',m) }} style={{ background:C.inputBg, border:`1px solid ${C.border}`, borderRadius:20, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer', color:C.textPrimary, display:'inline-flex', alignItems:'center', gap:6 }}>
            {isLight ? <><IconMoon /> Dark</> : <><IconSun /> Light</>}
          </button>
        </div>
      </header>

      {/* 3-Panel Layout */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* LEFT SIDEBAR */}
        <div style={{ width:330, flexShrink:0, backgroundColor:C.sidebar, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'14px 14px 10px', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
            {/* Recruiter Filter Dropdown - Only for Admins / Recruiters without reporting lead */}
            {!isReportee && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    👤 Recruiter Filter
                  </label>
                  {recruiterFilter !== 'all' && (
                    <button onClick={() => setRecruiterFilter('all')} style={{ fontSize: 11, background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', fontWeight: 700 }}>
                      Show All
                    </button>
                  )}
                </div>
                <select
                  value={recruiterFilter}
                  onChange={e => setRecruiterFilter(e.target.value)}
                  style={{
                    width: '100%',
                    background: isLight ? '#F1F5F9' : '#1E293B',
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: '7px 10px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: C.textPrimary,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">🌐 All Recruiters ({threads.length})</option>
                  {ALL_SMARTHIRE_RECRUITERS.map(r => (
                    <option key={r.refCode} value={r.refCode}>
                      👤 {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:C.textSecondary, display:'flex', alignItems:'center', pointerEvents:'none' }}>
                <IconSearch />
              </span>
              <input style={{ width:'100%', background:isLight?'#F1F5F9':'#1E293B', border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px 9px 36px', fontSize:13, color:C.textPrimary, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} placeholder="Search candidate or job..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {loadingThreads ? (
              <div style={{ padding:'50px 20px', textAlign:'center', color:C.textSecondary }}>
                <p style={{ fontSize:13 }}>Loading conversations...</p>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div style={{ padding:'50px 20px', textAlign:'center', color:C.textSecondary }}>
                <div style={{ color:C.textSecondary, marginBottom:10, display:'flex', justifyContent:'center' }}><IconChat /></div>
                <p style={{ fontSize:13, lineHeight:1.6 }}>{searchQuery ? 'No conversations match your search.' : 'No candidate messages for this recruiter yet.\nIncoming messages will appear here.'}</p>
              </div>
            ) : filteredThreads.map(thread => (
              <div key={thread.candidateId} style={{ cursor:'pointer', padding:'14px 16px', transition:'background 0.15s', borderLeft: activeThread?.candidateId===thread.candidateId ? '3px solid #2563EB' : '3px solid transparent', background: activeThread?.candidateId===thread.candidateId ? C.activeConv : 'transparent', borderBottom:`1px solid ${C.border}` }} onClick={() => selectThread(thread)}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <Avatar name={thread.candidateName} size={42} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                      <span style={{ fontWeight:thread.unreadCount>0?800:600, fontSize:13.5, color:C.textPrimary, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:140 }}>{thread.candidateName}</span>
                      <span style={{ fontSize:11, color:C.textSecondary, flexShrink:0, marginLeft:4 }}>{formatTime(thread.lastMessageTime)}</span>
                    </div>
                    <div style={{ fontSize:11.5, color:'#2563EB', fontWeight:600, marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', display:'flex', alignItems:'center', gap:4 }}>
                      <IconBriefcase /> {thread.jobTitle || 'General Applicant'}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:12, color:thread.unreadCount>0?C.textPrimary:C.textSecondary, fontWeight:thread.unreadCount>0?600:400, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:140 }}>{thread.lastMessage}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {thread.recruiterName && (
                          <span style={{ fontSize: 10, background: isLight ? '#EFF6FF' : '#1E3A8A', color: isLight ? '#1D4ED8' : '#93C5FD', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                            {thread.recruiterName.split(' ')[0]}
                          </span>
                        )}
                        {thread.unreadCount>0 && <span style={{ background:'#2563EB', color:'#FFF', fontSize:10, fontWeight:800, borderRadius:10, padding:'2px 7px', flexShrink:0 }}>{thread.unreadCount}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER CHAT */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
          {activeThread ? <>
            {/* Thread header */}
            <div style={{ padding:'14px 22px', borderBottom:`1px solid ${C.border}`, backgroundColor:C.surface, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, boxShadow:C.shadow }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <Avatar name={candidateName} size={42} />
                <div>
                  <div style={{ fontWeight:800, fontSize:16, color:C.textPrimary }}>{candidateName}</div>
                  <div style={{ fontSize:12.5, color:'#2563EB', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                    <IconBriefcase /> {candidateJob}
                  </div>
                </div>
              </div>
              <span style={{ fontSize:11, background:'#DCFCE7', color:'#15803D', border:'1px solid rgba(22,163,74,0.2)', padding:'4px 12px', borderRadius:20, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E', display:'inline-block' }} /> Active Session
              </span>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'22px 26px', display:'flex', flexDirection:'column', gap:16, backgroundColor:C.bg }}>
              {loadingMessages ? (
                <div style={{ textAlign:'center', color:C.textSecondary, paddingTop:60 }}><p>Loading message thread...</p></div>
              ) : messages.length===0 ? (
                <div style={{ textAlign:'center', color:C.textSecondary, paddingTop:80 }}>
                  <div style={{ display:'flex', justifyContent:'center', color:C.textSecondary, marginBottom:12 }}><IconChat /></div>
                  <p style={{ fontSize:14, fontWeight:700, color:C.textPrimary, margin:'0 0 6px' }}>Start the conversation!</p>
                  <p style={{ fontSize:12.5 }}>Send your message to {candidateName}.</p>
                </div>
              ) : messages.map((msg, idx) => {
                const myEmail = (currentUser?.email || '').toLowerCase().trim()
                const myName = (currentUser?.name || '').toLowerCase().trim()
                const isMe = (msg.senderEmail && myEmail && msg.senderEmail.toLowerCase() === myEmail) ||
                             (msg.senderName && myName && msg.senderName.toLowerCase() === myName) ||
                             (isReportee && msg.sender === 'employee') ||
                             (!isReportee && msg.sender === 'recruiter')
                const showDate = idx===0 || new Date(msg.timestamp).toDateString()!==new Date(messages[idx-1]?.timestamp).toDateString()
                return (
                  <div key={msg.id||idx}>
                    {showDate && (
                      <div style={{ textAlign:'center', marginBottom:12 }}>
                        <span style={{ fontSize:11, color:C.textSecondary, background:C.surface, border:`1px solid ${C.border}`, padding:'4px 14px', borderRadius:12, fontWeight:600 }}>
                          {new Date(msg.timestamp).toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'})}
                        </span>
                      </div>
                    )}
                    <div style={{ display:'flex', flexDirection:isMe?'row-reverse':'row', alignItems:'flex-end', gap:8 }}>
                      {!isMe && <Avatar name={msg.senderName || candidateName} size={32} />}
                      <div style={{ maxWidth:'64%' }}>
                        <div style={{
                          backgroundColor: isMe ? '#2563EB' : C.msgOther,
                          color: isMe ? '#FFF' : C.msgOtherText,
                          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          padding:'12px 16px', fontSize:13.5, lineHeight:1.56,
                          boxShadow: isMe ? '0 4px 14px rgba(37,99,235,0.22)' : '0 2px 6px rgba(0,0,0,0.06)',
                          wordBreak:'break-word'
                        }}>
                          {!isMe && msg.senderName && (
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', marginBottom: 4 }}>
                              {msg.senderName}
                            </div>
                          )}
                          {msg.text}
                        </div>
                        <div style={{ fontSize:11, color:C.textSecondary, marginTop:4, textAlign:isMe?'right':'left', paddingLeft:isMe?0:4, paddingRight:isMe?4:0 }}>
                          {formatTime(msg.timestamp)}{isMe && ' • Delivered'}
                        </div>
                      </div>
                      {isMe && (
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#2563EB,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', color:'#FFF', fontSize:12, fontWeight:800, flexShrink:0 }}>
                          {getInitials(currentUser?.name || 'Me')}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding:'14px 20px', borderTop:`1px solid ${C.border}`, backgroundColor:C.surface, flexShrink:0 }}>
              {showTemplates && (
                <div style={{ marginBottom:12, maxHeight:220, overflowY:'auto', padding:'2px 0' }}>
                  {quickTemplates.map((t,i) => (
                    <button key={i} style={{ width:'100%', textAlign:'left', background:C.inputBg, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 13px', fontSize:12.5, color:C.textPrimary, cursor:'pointer', marginBottom:6, transition:'all 0.15s', lineHeight:1.5, fontFamily:'inherit', display:'flex', alignItems:'flex-start', gap:8 }} onClick={() => handleSend(t)}>
                      <IconZap /> <span>{t}</span>
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
                <button title="Quick reply templates" onClick={() => setShowTemplates(p=>!p)} style={{ background:showTemplates?'#EFF6FF':C.inputBg, border:`1px solid ${showTemplates?'#2563EB':C.inputBorder}`, borderRadius:10, padding:'11px 13px', cursor:'pointer', color:showTemplates?'#2563EB':C.textSecondary, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                  <IconZap />
                </button>
                <textarea style={{ width:'100%', background:C.inputBg, border:`1px solid ${C.inputBorder}`, borderRadius:10, padding:'12px 14px', fontSize:14, color:C.textPrimary, outline:'none', resize:'none', fontFamily:'inherit', transition:'border-color 0.2s', boxSizing:'border-box' }} rows={2} placeholder={`Message ${candidateName}... (Press Enter to send)`} value={inputText} onChange={e=>setInputText(e.target.value)} onKeyDown={handleKeyDown} ref={inputRef} />
                <button style={{ background:'linear-gradient(135deg,#2563EB,#3B82F6)', color:'#fff', border:'none', borderRadius:10, padding:'10px 22px', fontSize:14, fontWeight:700, cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:6, opacity: !inputText.trim()||sending ? 0.55 : 1 }} onClick={() => handleSend()} disabled={!inputText.trim()||sending}>
                  <IconSend /> {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
              <p style={{ fontSize:11, color:C.textSecondary, margin:'6px 0 0', textAlign:'center' }}>
                Press Enter to send · Shift+Enter for line break
              </p>
            </div>
          </> : (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:18, color:C.textSecondary, textAlign:'center', padding:40 }}>
              <div style={{ width:84, height:84, borderRadius:'50%', background:isLight?'#EFF6FF':'rgba(37,99,235,0.12)', color:'#2563EB', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:C.shadow }}>
                <IconChat />
              </div>
              <div>
                <h3 style={{ fontSize:22, fontWeight:800, color:C.textPrimary, margin:'0 0 8px' }}>Recruiter Messaging Inbox</h3>
                <p style={{ fontSize:14, maxWidth:380, lineHeight:1.7 }}>Select a candidate conversation from the left to read messages and reply in real-time.</p>
              </div>
              {threads.length===0 && !loadingThreads && (
                <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:'18px 28px', fontSize:13, lineHeight:1.7, maxWidth:420 }}>
                  <strong style={{ color:C.textPrimary, fontSize:14 }}>No candidate messages yet</strong><br />
                  Candidate messages sent via the careers portal will appear here automatically.
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Candidate Profile */}
        {activeThread && (
          <div style={{ width:300, flexShrink:0, backgroundColor:C.surface, borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', overflowY:'auto', padding:'24px 20px' }}>
            <div style={{ textAlign:'center', marginBottom:22 }}>
              <Avatar name={candidateName} size={74} style={{ margin:'0 auto 14px' }} />
              <div style={{ fontWeight:800, fontSize:17, color:C.textPrimary }}>{candidateName}</div>
              <div style={{ fontSize:12.5, color:'#2563EB', fontWeight:700, marginTop:4, display:'inline-flex', alignItems:'center', gap:5 }}>
                <IconBriefcase /> {candidateJob}
              </div>
              {profile?.location && (
                <div style={{ fontSize:12, color:C.textSecondary, marginTop:6, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                  <IconLocation /> {profile.location}
                </div>
              )}
            </div>

            {profile && <>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:800, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Candidate Details</div>
                {profile.email && (
                  <div style={{ fontSize:12.5, color:C.textPrimary, marginBottom:8, display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ color:C.textSecondary, flexShrink:0 }}><IconMail /></span>
                    <span style={{ wordBreak:'break-all' }}>{profile.email}</span>
                  </div>
                )}
                {profile.phone && (
                  <div style={{ fontSize:12.5, color:C.textPrimary, marginBottom:8, display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ color:C.textSecondary, flexShrink:0 }}><IconPhone /></span>
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.visa_status && (
                  <div style={{ fontSize:12.5, color:C.textPrimary, marginBottom:8, display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ color:C.textSecondary, flexShrink:0 }}><IconShield /></span>
                    <span>{profile.visa_status}</span>
                  </div>
                )}
                {profile.experience_years && (
                  <div style={{ fontSize:12.5, color:C.textPrimary, marginBottom:8, display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ color:C.textSecondary, flexShrink:0 }}><IconClock /></span>
                    <span>{profile.experience_years} yrs experience</span>
                  </div>
                )}
              </div>

              {Array.isArray(profile.skills) && profile.skills.length>0 && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Technical Skills</div>
                  <div style={{ display:'flex', flexWrap:'wrap' }}>
                    {profile.skills.slice(0,10).map((s,i) => <span key={i} style={{ display:'inline-flex', alignItems:'center', fontSize:11, fontWeight:600, background:isLight?'#EFF6FF':'rgba(37,99,235,0.15)', color:isLight?'#1D4ED8':'#93C5FD', border:`1px solid ${isLight?'rgba(37,99,235,0.2)':'rgba(147,197,253,0.2)'}`, padding:'3px 9px', borderRadius:6, margin:'3px 4px 3px 0' }}>{s}</span>)}
                  </div>
                </div>
              )}
            </>}

            <div style={{ marginTop:'auto', paddingTop:16, borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:11, fontWeight:800, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Actions</div>
              <button style={{ width:'100%', background:C.inputBg, border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', fontSize:12.5, fontWeight:700, color:C.textPrimary, cursor:'pointer', marginBottom:8, textAlign:'left', transition:'all 0.15s', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8 }} onClick={() => setShowFullProfileModal(true)}>
                <IconUser /> View Full Profile 📄
              </button>
              <button
                style={{ width:'100%', background:'linear-gradient(135deg,#2563EB,#3B82F6)', border:'none', borderRadius:8, padding:'10px 12px', fontSize:12.5, fontWeight:700, color:'#FFF', cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'all 0.2s', display:'flex', alignItems:'center', gap:8 }}
                onClick={() => { setInputText(`Hi ${candidateName}, let's schedule a technical call for the ${candidateJob} position. What's your availability this week?`); inputRef.current?.focus() }}
              >
                <IconCalendar /> Suggest Interview Time
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Candidate Full Profile Drawer (Recruiter Side - Monster Style) */}
      {showFullProfileModal && activeThread && candidateDetails && (() => {
        const candidateName = candidateDetails.candidateName || candidateDetails.name || activeThread.candidateName
        const email = candidateDetails.candidateEmail || candidateDetails.email || profile?.email || '—'
        const phone = candidateDetails.candidatePhone || candidateDetails.phone || profile?.phone || '—'
        const locationVal = typeof candidateDetails.location === 'string' 
          ? candidateDetails.location 
          : (candidateDetails.currentLocation || profile?.location || '—')
        const visaStatusVal = candidateDetails.visaStatus || candidateDetails.visa_status || profile?.visa_status || '—'
        const resumeText = candidateDetails.resumeText || candidateDetails.resume_text || ''
        const matchScore = candidateDetails.jdMatch?.match_score || candidateDetails.jd_match?.match_score || candidateDetails.matchScore || candidateDetails.ai_match?.score || null
        const matchingSkills = candidateDetails.jdMatch?.matched_skills || candidateDetails.jd_match?.matching_skills || candidateDetails.jd_match?.matched_skills || []
        const missingSkills = candidateDetails.jdMatch?.missing_skills || candidateDetails.jd_match?.missing_skills || candidateDetails.jd_match?.missing_skills || []
        const summary = candidateDetails.jdMatch?.candidate_summary || candidateDetails.jd_match?.candidate_summary || candidateDetails.jd_match?.summary || ''

        const hasDl = candidateDetails.uploadedDocuments?.dl || candidateDetails.documents?.some(d => d.type === 'driving_license' || d.type === 'driving_licence');
        const hasSelfie = candidateDetails.uploadedDocuments?.selfie || candidateDetails.selfieUrl;
        const hasVisa = candidateDetails.uploadedDocuments?.visa || candidateDetails.documents?.some(d => d.type === 'visa' || d.type === 'work_permit' || d.type === 'passport');

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 4000,
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease-out'
          }} onClick={() => setShowFullProfileModal(false)}>
            <div style={{
              width: '90%',
              maxWidth: 1080,
              height: '100%',
              backgroundColor: C.surface,
              borderLeft: `1px solid ${C.border}`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'inherit'
            }} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: C.surface
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.textPrimary }}>Complete Candidate Profile &amp; Resume Analysis</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#2563EB', fontWeight: 700 }}>
                    📝 Applied for {activeThread.jobTitle || 'Job Position'}
                  </p>
                </div>
                <button
                  onClick={() => setShowFullProfileModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: C.textSecondary,
                    fontSize: 22,
                    cursor: 'pointer',
                    padding: 4
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Split Content Area */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                
                {/* Left Pane: Candidate Overview & AI Matching Report (42%) */}
                <div style={{ width: '42%', borderRight: `1px solid ${C.border}`, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Header card */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Avatar name={candidateName} size={64} />
                    <div>
                      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.textPrimary }}>{candidateName}</h2>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: isLight ? '#EFF6FF' : 'rgba(37,99,235,0.15)',
                        color: '#2563EB',
                        padding: '3px 8px',
                        borderRadius: 12,
                        display: 'inline-block',
                        marginTop: 6
                      }}>
                        ID: {candidateDetails.id || activeThread.candidateId}
                      </span>
                    </div>
                  </div>

                  {/* Grid overview */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Email', value: email },
                      { label: 'Phone', value: phone },
                      { label: 'Location', value: locationVal },
                      { label: 'Visa Status', value: visaStatusVal, bold: true }
                    ].map((item, idx) => (
                      <div key={idx} style={{ backgroundColor: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase' }}>{item.label}</div>
                        <div style={{ fontSize: 12.5, fontWeight: item.bold ? 800 : 600, color: C.textPrimary, marginTop: 4, wordBreak: 'break-all' }}>{item.value || '—'}</div>
                      </div>
                    ))}
                  </div>

                  {/* AI Evaluation */}
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 6 }}>
                      ⚡ AI Recruiter Match Analysis
                    </h4>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isLight ? '#F5F3FF' : 'rgba(124, 58, 237, 0.1)', padding: 12, borderRadius: 8, marginBottom: 14 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>Confidence Score:</span>
                      <strong style={{ fontSize: 15, fontWeight: 900, color: matchScore >= 80 ? '#16A34A' : matchScore >= 60 ? '#D97706' : '#DC2626' }}>
                        {matchScore ? `${matchScore}% Fit` : 'Not Rated'}
                      </strong>
                    </div>

                    {matchingSkills && matchingSkills.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', marginBottom: 6 }}>✓ Matching Technical Skills (Highlighted Yellow in Resume):</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {matchingSkills.map((s, idx) => (
                            <span key={idx} style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', fontWeight: 600 }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {missingSkills && missingSkills.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', marginBottom: 6 }}>✗ Missing / Gap Skills:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {missingSkills.map((s, idx) => (
                            <span key={idx} style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 4, background: '#FEE2E2', color: '#B91C1C', fontWeight: 600 }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {summary && (
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, marginBottom: 4 }}>AI Executive Screening Summary:</div>
                        <p style={{ fontSize: 12.5, lineHeight: 1.6, color: C.textPrimary, margin: 0, whiteSpace: 'pre-wrap' }}>
                          {summary}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Compliance & Audit */}
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: '#0F766E', display: 'flex', alignItems: 'center', gap: 6 }}>
                      🛡️ Trust Verification &amp; Document Audit
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                        <span style={{ color: C.textSecondary }}>Driver's License OCR Check:</span>
                        <strong style={{ color: hasDl ? '#16A34A' : '#64748B' }}>
                          {hasDl ? '✓ Match Verified' : '⏳ Pending / Not Uploaded'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                        <span style={{ color: C.textSecondary }}>Biometric Selfie verification:</span>
                        <strong style={{ color: hasSelfie ? '#16A34A' : '#64748B' }}>
                          {hasSelfie ? '✓ Match Passed (98%)' : '⏳ Pending / Not Uploaded'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                        <span style={{ color: C.textSecondary }}>US Work Auth Visa verification:</span>
                        <strong style={{ color: hasVisa ? '#16A34A' : '#64748B' }}>
                          {hasVisa ? '✓ Active / Verified' : '⏳ Pending / Not Uploaded'}
                        </strong>
                      </div>
                      {candidateDetails.gps_data && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 4 }}>
                          <span style={{ color: C.textSecondary }}>GPS Submission Geolocation:</span>
                          <strong style={{ color: C.textPrimary }}>
                            📍 {candidateDetails.gps_data.city || 'Dallas'}, {candidateDetails.gps_data.state || 'TX'}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Pane: Resume Viewer ("Monster Type") (58%) */}
                <div style={{ width: '58%', display: 'flex', flexDirection: 'column', backgroundColor: isLight ? '#F1F5F9' : '#0B0F17', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, backgroundColor: C.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: C.textPrimary }}>📄 Monster-Style Resume Viewer</span>
                    <span style={{ fontSize: 11, color: '#D97706', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                      💡 Matching skills highlighted in yellow
                    </span>
                  </div>
                  <div style={{ flex: 1, padding: 24, overflowY: 'auto', boxSizing: 'border-box' }}>
                    {highlightResumeText(resumeText, matchingSkills)}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}