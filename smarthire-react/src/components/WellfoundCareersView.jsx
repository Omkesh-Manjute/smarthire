import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { resolveReqId } from '../utils/formatJobDescription'

// ─── Crisp SVG Icons for Wellfound UI ───────────────────────────────────────
function SearchIcon({ size = 18, color = '#6B7280' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function LocationIcon({ size = 16, color = '#6B7280' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ChevronRightIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function ChevronLeftIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ClockIcon({ size = 14, color = '#6B7280' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function BookmarkIcon({ size = 15, filled = false, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function CheckCircleIcon({ size = 16, color = '#10B981' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function ArrowLeftIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function TwitterIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function LinkedInIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25c-.9 0-1.63.73-1.63 1.63a1.63 1.63 0 0 0 1.63 1.63 1.63 1.63 0 0 0 1.63-1.63c0-.9-.73-1.63-1.63-1.63z" />
    </svg>
  )
}

export const resolveClientDomainName = (job) => {
  if (job?.client_domain) return job.client_domain
  if (job?.clientDomain) return job.clientDomain

  const text = `${job?.title || ''} ${(job?.skills || []).join(' ')} ${job?.rawDescription || job?.description || ''}`.toLowerCase()

  if (/health|clinical|med|epic|cerner|dhhs|care|patient|hospital|physician/i.test(text)) {
    return 'State Healthcare Systems'
  }
  if (/transportation|dot|vdot|highway|transit|gis|traffic/i.test(text)) {
    return 'State Transportation & Infrastructure'
  }
  if (/cloud|aws|azure|devops|kubernetes|docker|infrastructure|terraform|sre/i.test(text)) {
    return 'Enterprise Cloud Platform'
  }
  if (/data|analytics|bi|power\s*bi|sql|etl|snowflake|warehouse|machine\s*learning|ai|scientist/i.test(text)) {
    return 'Enterprise Data & Analytics'
  }
  if (/bank|finance|payment|treasury|tax|revenue|fintech|audit|fiscal/i.test(text)) {
    return 'Financial & Enterprise Systems'
  }
  if (/security|cyber|soc|iam|identity|firewall|threat|ciso/i.test(text)) {
    return 'Cybersecurity & Governance'
  }
  if (/education|doe|university|school|curriculum|student|teacher/i.test(text)) {
    return 'Public Education Technology'
  }
  if (/director|program\s*manager|project\s*manager|agile|scrum|product|lead/i.test(text)) {
    return 'Enterprise Strategic Services'
  }
  return 'Enterprise Direct Client'
}

// ─── Work Arrangement Resolver (Remote / Hybrid / Onsite) ───────────────────
export const resolveWorkArrangement = (job) => {
  const text = `${job?.work_mode || ''} ${job?.title || ''} ${job?.rawDescription || job?.description || ''}`.toLowerCase()
  if (text.includes('hybrid')) return 'Hybrid'
  if (text.includes('onsite') || text.includes('on-site') || text.includes('in office') || text.includes('in-office')) return 'Onsite'
  if (text.includes('remote')) return 'Remote'
  return job?.work_mode || 'Hybrid / Remote'
}

// ─── Local Candidate Requirement Resolver ──────────────────────────────────
export const resolveLocalRequirement = (job) => {
  const text = `${job?.title || ''} ${job?.description || ''} ${job?.rawDescription || ''} ${job?.work_mode || ''} ${job?.location || ''}`.toLowerCase()
  
  if (/local\s*only|only\s*local|local\s*candidates\s*only|must\s*be\s*local|must\s*reside\s*within|reside\s*locally/i.test(text)) {
    return { label: 'Local Candidates Only', isLocalNeeded: true, urgency: 'high' }
  }
  if (/local\s*preferred|preference\s*given\s*to\s*local|local\s*candidate|relocation\s*not\s*provided/i.test(text)) {
    return { label: 'Local Preferred', isLocalNeeded: true, urgency: 'medium' }
  }
  const mode = resolveWorkArrangement(job).toLowerCase()
  if (mode === 'onsite') {
    return { label: 'Local Required', isLocalNeeded: true, urgency: 'high' }
  }
  if (mode === 'hybrid') {
    return { label: 'Local / Commutable', isLocalNeeded: true, urgency: 'commutable' }
  }
  return { label: 'Nationwide (No Local Need)', isLocalNeeded: false, urgency: 'none' }
}

// ─── Dynamic Company Logo Colors ───────────────────────────────────────────
const LOGO_PALETTES = [
  { bg: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #047857 0%, #10B981 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #C2410C 0%, #F97316 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)', fg: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)', fg: '#FFFFFF' }
]

function CompanyLogo({ job, size = 42 }) {
  const hash = Math.abs(String(job?.id || job?.title || 'job').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0))
  const palette = LOGO_PALETTES[hash % LOGO_PALETTES.length]
  const cleanTitle = (job?.title || 'Engineer').replace(/[^a-zA-Z]/g, ' ').trim()
  const words = cleanTitle.split(/\s+/).filter(Boolean)
  const letters = words.length >= 2 
    ? (words[0][0] + words[1][0]).toUpperCase()
    : (cleanTitle.slice(0, 2).toUpperCase() || 'IT')

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: Math.round(size * 0.24),
      background: palette.bg,
      color: palette.fg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: Math.round(size * 0.38),
      fontWeight: 800,
      letterSpacing: '-0.02em',
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
      flexShrink: 0,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {letters || 'IT'}
    </div>
  )
}

// ─── Parse Real Requisition Content for Unified Wellfound Dossier Layout ──────
function parseWellfoundJobDetails(job, cleanTitle, domainName, location, workMode, localReq, getFullDescriptionText) {
  const fullText = (typeof getFullDescriptionText === 'function' ? getFullDescriptionText(job) : (job?.description || job?.rawDescription || ''))
  const rawSkills = Array.isArray(job?.skills) && job.skills.length > 0
    ? job.skills
    : ['Cloud Architecture', 'Microservices', 'REST APIs', 'Agile / Scrum', 'CI/CD']

  const aboutCompany = `${domainName} is delivering mission-critical modern technological platforms to enhance operational efficiency, security, and public sector services. We value engineers and leaders who take bold ownership, thrive in collaborative teams, and design scalable architectures built for enterprise longevity.`

  let text = String(fullText || '').trim()

  // Clean out common boilerplate, legal disclaimers, and partner branding
  text = text
    .replace(/Pursuant to the State of.*?policy of non-discrimination.*?$/is, '')
    .replace(/Equal Opportunity Employer.*?$/is, '')
    .replace(/We are an equal opportunity employer.*?$/is, '')
    .replace(/\bEEO\b.*?$/is, '')
    .replace(/\b(InfoOrigin|COOLSOFT\s*(?:LLC)?)\b/gi, 'Direct Client')

  let summary = ''
  let responsibilities = []
  let requiredSkills = []
  let preferredSkills = []
  let engagementDetails = []

  if (text.includes('KEY ROLES & RESPONSIBILITIES') || text.includes('PROJECT SUMMARY & OBJECTIVE') || text.includes('POSITION & CLIENT OVERVIEW')) {
    // Requisition formatted by formatJobDescription
    const summaryMatch = text.match(/(?:PROJECT SUMMARY & OBJECTIVE[^\n]*\n={5,}\n)([\s\S]*?)(?=\n={5,}|\nKEY ROLES|\nREQUIRED TECHNICAL|\nPREFERRED|$)/i)
    if (summaryMatch && summaryMatch[1].trim()) {
      summary = summaryMatch[1].trim()
    }

    const respMatch = text.match(/(?:KEY ROLES & RESPONSIBILITIES[^\n]*\n={5,}\n)([\s\S]*?)(?=\n={5,}|\nREQUIRED TECHNICAL|\nPREFERRED|$)/i)
    if (respMatch && respMatch[1].trim()) {
      responsibilities = respMatch[1]
        .split('\n')
        .map(l => l.replace(/^[•\u2022\u2023\u25E6\u2043\u2219\*\-\d\.]\s*/, '').trim())
        .filter(l => l.length > 5)
    }

    const skillsMatch = text.match(/(?:REQUIRED TECHNICAL PROFICIENCIES[^\n]*\n={5,}\n)([\s\S]*?)(?=\n={5,}|\nPREFERRED|$)/i)
    if (skillsMatch && skillsMatch[1].trim()) {
      requiredSkills = skillsMatch[1]
        .split('\n')
        .map(l => l.replace(/^[•\u2022\u2023\u25E6\u2043\u2219\*\-\d\.]\s*/, '').trim())
        .filter(l => l.length > 3)
    }

    const prefMatch = text.match(/(?:PREFERRED QUALIFICATIONS[^\n]*\n={5,}\n)([\s\S]*?)(?=\n={5,}|$)/i)
    if (prefMatch && prefMatch[1].trim()) {
      preferredSkills = prefMatch[1]
        .split('\n')
        .map(l => l.replace(/^[•\u2022\u2023\u25E6\u2043\u2219\*\-\d\.]\s*/, '').trim())
        .filter(l => l.length > 3)
    }

    const overviewMatch = text.match(/(?:POSITION & CLIENT OVERVIEW[^\n]*\n={5,}\n)([\s\S]*?)(?=\n={5,}|\nPROJECT SUMMARY|\nKEY ROLES|$)/i)
    if (overviewMatch && overviewMatch[1].trim()) {
      engagementDetails = overviewMatch[1]
        .split('\n')
        .map(l => l.replace(/^[•\u2022\u2023\u25E6\u2043\u2219\*\-\d\.]\s*/, '').trim())
        .map(l => l.replace(/\b(InfoOrigin|COOLSOFT\s*(?:LLC)?)\b/gi, 'Direct Client'))
        .filter(l => l.length > 3 && !l.toLowerCase().includes('position title'))
    }
  } else if (text.length > 30) {
    // Unformatted raw requisition body
    const cleaned = text
      .replace(/={5,}/g, '')
      .replace(/Description\s*:\s*/i, '')
      .trim()

    // Split on inline bullets or newlines
    const parts = cleaned.split(/(?:\r?\n\s*|\s+)[•\u2022\u2023\u25E6\u2043\u2219\*\-]\s+/)
    if (parts.length > 1) {
      summary = parts[0].trim()
      responsibilities = parts.slice(1).map(p => p.trim()).filter(p => p.length > 5)
    } else {
      const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean)
      const bullets = lines.filter(l => /^[•\u2022\u2023\u25E6\u2043\u2219\*\-\d\.]\s+/.test(l)).map(l => l.replace(/^[•\u2022\u2023\u25E6\u2043\u2219\*\-\d\.]\s+/, '').trim())

      if (bullets.length >= 2) {
        responsibilities = bullets
        summary = lines.filter(l => !/^[•\u2022\u2023\u25E6\u2043\u2219\*\-\d\.]\s+/.test(l)).slice(0, 3).join(' ')
      } else {
        summary = cleaned.slice(0, 450)
      }
    }
  }

  // Detect and unpack any inline bullets trapped inside summary
  if (/(?:\r?\n\s*|\s+)[•\u2022\u2023\u25E6\u2043\u2219\*\-]\s+/.test(summary)) {
    const splitSummary = summary.split(/(?:\r?\n\s*|\s+)[•\u2022\u2023\u25E6\u2043\u2219\*\-]\s+/)
    if (splitSummary.length > 1) {
      summary = splitSummary[0].trim()
      const extraBullets = splitSummary.slice(1).map(b => b.trim()).filter(b => b.length > 5)
      responsibilities = [...extraBullets, ...responsibilities]
    }
  }

  // Expand any items in responsibilities that contain nested/inline bullets
  const expandedResp = []
  responsibilities.forEach(item => {
    if (/(?:\r?\n\s*|\s+)[•\u2022\u2023\u25E6\u2043\u2219\*\-]\s+/.test(item)) {
      const sub = item.split(/(?:\r?\n\s*|\s+)[•\u2022\u2023\u25E6\u2043\u2219\*\-]\s+/).map(s => s.trim()).filter(Boolean)
      expandedResp.push(...sub)
    } else {
      expandedResp.push(item)
    }
  })
  responsibilities = expandedResp
    .map(r => r.replace(/^[•\u2022\u2023\u25E6\u2043\u2219\*\-\d\.]\s*/, '').trim())
    .filter(r => !/pursuant to the state|policy of non-discrimination|affirmative action|equal opportunity employer|does not discriminate|eeo\b/i.test(r) && r.length > 5)

  // Expand any items in requiredSkills that contain nested/inline bullets
  const expandedSkills = []
  requiredSkills.forEach(item => {
    if (/(?:\r?\n\s*|\s+)[•\u2022\u2023\u25E6\u2043\u2219\*\-]\s+/.test(item)) {
      const sub = item.split(/(?:\r?\n\s*|\s+)[•\u2022\u2023\u25E6\u2043\u2219\*\-]\s+/).map(s => s.trim()).filter(Boolean)
      expandedSkills.push(...sub)
    } else {
      expandedSkills.push(item)
    }
  })
  requiredSkills = expandedSkills
    .map(s => s.replace(/^[•\u2022\u2023\u25E6\u2043\u2219\*\-\d\.]\s*/, '').trim())
    .filter(s => !/pursuant to the state|policy of non-discrimination|affirmative action|equal opportunity employer|does not discriminate|eeo\b/i.test(s) && s.length > 3)

  // Graceful high-quality fallbacks if requisition data is sparse
  if (!summary) {
    summary = `We are seeking a talented and dedicated ${cleanTitle} to support enterprise operations and deliver high-impact results. In this direct client engagement, you will collaborate closely with cross-functional teams to execute critical workflows and ensure operational excellence.`
  }

  if (responsibilities.length === 0) {
    const s1 = rawSkills[0] || 'Core Architecture'
    const s2 = rawSkills[1] || 'API & Microservices'
    const s3 = rawSkills[2] || 'Automated CI/CD'
    const s4 = rawSkills[3] || 'Scalability & Performance'
    responsibilities = [
      `Drive hands-on execution and technical governance across modern enterprise environments, specializing in ${s1}.`,
      `Design and integrate secure, scalable solutions and reliable workflows (${s2}).`,
      `Champion best practices, documentation, and quality standards adhering to industry benchmarks (${s3}).`,
      `Ensure all operations, interactive services, and platform tasks meet enterprise reliability and quality targets (${s4}).`
    ]
  }

  if (requiredSkills.length === 0) {
    requiredSkills = [
      `Demonstrated practical experience as a ${cleanTitle} in direct-client or enterprise environments.`,
      `Hands-on proficiency in ${rawSkills.slice(0, 5).join(', ')}.`,
      `Strong understanding of quality standards, operational workflows, and system fundamentals.`,
      `Excellent communication, accountability, and problem-solving skills with ability to work independently.`,
      localReq.isLocalNeeded 
        ? `Local candidate or commutable to ${location} to support the client's ${workMode} requirements.`
        : `Ability to operate autonomously in a remote-first setup with high discipline and ownership.`
    ]
  }

  if (engagementDetails.length === 0) {
    engagementDetails = [
      `Client / Agency: Direct Client`,
      `Work Arrangement: ${workMode || 'Remote / Hybrid'}`,
      `Interview Type: Webcam / Virtual Video Interview`,
      `Engagement: Long-Term Contract (C2C / W2)`
    ]
  }

  return {
    aboutCompany,
    summary,
    responsibilities,
    requiredSkills,
    preferredSkills,
    engagementDetails,
    rawSkills
  }
}

// Curated Pool of Trending Direct Clients for Daily Dynamic Rotation
const TRENDING_CLIENTS_POOL = [
  {
    id: 'cloud-ai',
    categoryKey: 'cloud',
    avatar: 'EA',
    avatarGradient: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
    title: 'Enterprise Cloud & AI',
    subtitle: 'State & Enterprise Infrastructure',
    description: 'Modernizing state cloud infrastructures with AWS, Azure microservices, and automated data pipelines.',
    tag1: { label: 'Cloud Arch', bgLight: '#FCE7F3', bgDark: '#371B2B', color: '#BE185D' },
    tag2: 'AWS / Azure',
    tag3: 'Remote Available'
  },
  {
    id: 'health-systems',
    categoryKey: 'health',
    avatar: 'SH',
    avatarGradient: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
    title: 'State Healthcare Systems',
    subtitle: 'Public Sector Health Portals',
    description: 'Leading healthcare systems, clinical integration, and large-scale public data exchange platforms.',
    tag1: { label: 'Healthcare IT', bgLight: '#E0F2FE', bgDark: '#082F49', color: '#0284C7' },
    tag2: 'Long-term',
    tag3: 'Hybrid'
  },
  {
    id: 'digital-platforms',
    categoryKey: 'dev',
    avatar: 'DP',
    avatarGradient: 'linear-gradient(135deg, #047857 0%, #10B981 100%)',
    title: 'Digital Platform Solutions',
    subtitle: 'Enterprise Modernization',
    description: 'Full-stack software engineering, modern React/Node interfaces, and resilient backend microservices.',
    tag1: { label: 'Full Stack', bgLight: '#D1FAE5', bgDark: '#064E3B', color: '#047857' },
    tag2: 'Enterprise',
    tag3: 'Hybrid / Onsite'
  },
  {
    id: 'global-enterprise-tech',
    categoryKey: 'dev',
    countryKey: 'India',
    avatar: 'GE',
    avatarGradient: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
    title: 'Global Enterprise Tech',
    subtitle: 'Cloud & IoT Enterprise Engineering',
    description: 'High-growth technology teams delivering mission-critical IoT & Full-Stack applications across cloud environments.',
    tag1: { label: 'IoT & Cloud', bgLight: '#EDE9FE', bgDark: '#2E1065', color: '#6366F1' },
    tag2: 'Full Time',
    tag3: 'Pune / Noida'
  },
  {
    id: 'cyber-ztna',
    categoryKey: 'cloud',
    avatar: 'CZ',
    avatarGradient: 'linear-gradient(135deg, #991B1B 0%, #DC2626 100%)',
    title: 'Cybersecurity & ZTNA Defense',
    subtitle: 'Federal & Enterprise SecOps',
    description: 'Zero-trust network architecture, identity governance, vulnerability intelligence, and defense systems.',
    tag1: { label: 'ZTNA SecOps', bgLight: '#FEE2E2', bgDark: '#450A0A', color: '#DC2626' },
    tag2: 'Zero Trust',
    tag3: 'Direct Client'
  },
  {
    id: 'data-ai',
    categoryKey: 'data',
    avatar: 'DA',
    avatarGradient: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
    title: 'Data & AI Innovation Labs',
    subtitle: 'Enterprise Intelligence & ML Pipelines',
    description: 'High-velocity predictive analytics, real-time Snowflake data lakes, and generative AI workflow orchestration.',
    tag1: { label: 'Data Science', bgLight: '#F3E8FF', bgDark: '#3B0764', color: '#9333EA' },
    tag2: 'Python / SQL',
    tag3: 'Nationwide'
  },
  {
    id: 'govtech-systems',
    categoryKey: 'mgmt',
    avatar: 'GT',
    avatarGradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
    title: 'GovTech Systems & Public Sector',
    subtitle: 'State IT Modernization',
    description: 'Delivering modern digital citizen services, program governance, and cloud compliance for municipal authorities.',
    tag1: { label: 'State Contracts', bgLight: '#FEF3C7', bgDark: '#451A03', color: '#D97706' },
    tag2: 'Governance',
    tag3: 'Direct Client'
  },
  {
    id: 'devops-sre',
    categoryKey: 'cloud',
    avatar: 'ED',
    avatarGradient: 'linear-gradient(135deg, #0E7490 0%, #06B6D4 100%)',
    title: 'Enterprise Cloud & DevOps SRE',
    subtitle: 'High Availability Infrastructure',
    description: 'Scaling mission-critical Kubernetes clusters, automated CI/CD releases, and multi-region failover architecture.',
    tag1: { label: 'DevOps / SRE', bgLight: '#CFFAFE', bgDark: '#164E63', color: '#0891B2' },
    tag2: 'Kubernetes',
    tag3: 'Remote USA'
  }
]

export default function WellfoundCareersView({
  jobs = [],
  filteredJobs = [],
  loading = false,
  targetJobId = null,
  searchQuery = '',
  setSearchQuery,
  selectedLocation = 'All',
  setSelectedLocation,
  selectedCountry = 'ALL',
  setSelectedCountry,
  indiaJobsCount = 0,
  usaJobsCount = 0,
  deadlineFilter = 'All',
  setDeadlineFilter,
  appliedJobs = [],
  savedJobs = [],
  handleToggleSaveJob,
  candidateUser = null,
  handleCandidateSignOut,
  setShowLoginModal,
  handleApplyClick,
  setFullJdModalJob,
  setActiveChatCandidate,
  setShowCvUploadModal,
  clocksExpanded = false,
  setClocksExpanded,
  formatLiveTime,
  themeMode = 'light',
  toggleTheme,
  isLight = true,
  cleanJobTitleWithPositionNumber,
  resolveJobLocation,
  formatExperience,
  formatRateOrSalary,
  formatContractType,
  isJobExpired,
  getFullDescriptionText,
  getSimilarJobs,
  getJobPostTimezones
}) {
  // Local state for hero search inputs
  const [heroTitleQuery, setHeroTitleQuery] = useState(searchQuery || '')
  const [heroLocationQuery, setHeroLocationQuery] = useState(selectedLocation === 'All' ? '' : selectedLocation)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 15 // 15 requisitions per page matching authentic StaffingOrigin pagination

  // Selected Job for Page 2 (Job Detail View)
  const [selectedJobId, setSelectedJobId] = useState(() => {
    if (targetJobId) return targetJobId
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      return p.get('jobId') || p.get('job') || null
    }
    return null
  })
  const centerPanelRef = useRef(null)

  // Listen to browser navigation popstate (Back/Forward buttons)
  useEffect(() => {
    const onPopState = () => {
      const p = new URLSearchParams(window.location.search)
      const jId = p.get('jobId') || p.get('job') || null
      setSelectedJobId(jId)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Synchronize when targetJobId prop changes
  useEffect(() => {
    if (targetJobId) {
      setSelectedJobId(targetJobId)
    }
  }, [targetJobId])

  // Select a job to open Page 2
  const handleSelectJob = (jobId) => {
    setSelectedJobId(jobId)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (jobId) {
        url.searchParams.set('jobId', jobId)
      } else {
        url.searchParams.delete('jobId')
        url.searchParams.delete('job')
      }
      window.history.pushState({}, '', url.pathname + url.search)
    }
    if (centerPanelRef.current) {
      centerPanelRef.current.scrollTop = 0
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Return to Page 1
  const handleBackToAllJobs = () => {
    handleSelectJob(null)
  }

  // Theme-aware color palette
  const colors = {
    bg: isLight ? '#FFFFFF' : '#0B0F19',
    subtleBg: isLight ? '#F9FAFB' : '#111827',
    border: isLight ? '#E5E7EB' : '#1F2937',
    borderLight: isLight ? '#F3F4F6' : '#283344',
    textPrimary: isLight ? '#0A0E1A' : '#F9FAFB',
    textSecondary: isLight ? '#525866' : '#9CA3AF',
    textMuted: isLight ? '#8B949E' : '#6B7280',
    accentCoral: '#F43F5E',
    buttonDark: isLight ? '#0A0E1A' : '#F9FAFB',
    buttonDarkText: isLight ? '#FFFFFF' : '#0A0E1A',
    cardBg: isLight ? '#FFFFFF' : '#111827',
    hoverBg: isLight ? '#F8FAFC' : '#1E293B',
    activeBg: isLight ? '#EFF6FF' : '#1E293B',
    activeBorder: isLight ? '#2065D1' : '#3B82F6',
    badgeBg: isLight ? '#F3F4F6' : '#1F2937'
  }

  // Filter visible jobs by category tab if selected
  const categoryFilteredJobs = useMemo(() => {
    const list = filteredJobs || []
    if (activeCategoryFilter === 'all') return list

    return list.filter(job => {
      const text = `${job.title || ''} ${(job.skills || []).join(' ')} ${job.rawDescription || job.description || ''}`.toLowerCase()
      if (activeCategoryFilter === 'cloud') {
        return /cloud|aws|azure|gcp|devops|kubernetes|docker|infrastructure|systems\s*admin|network/i.test(text)
      }
      if (activeCategoryFilter === 'dev') {
        return /software|engineer|developer|java|python|c#|\.net|react|full\s*stack|frontend|backend/i.test(text)
      }
      if (activeCategoryFilter === 'data') {
        return /data|analytics|analyst|bi|power\s*bi|sql|etl|machine\s*learning|ai|scientist/i.test(text)
      }
      if (activeCategoryFilter === 'health') {
        return /health|clinical|med|epic|cerner|dhhs|care|patient|hospital/i.test(text)
      }
      if (activeCategoryFilter === 'mgmt') {
        return /director|manager|lead|scrum|product|project|program|business\s*analyst/i.test(text)
      }
      return true
    })
  }, [filteredJobs, activeCategoryFilter])

  // Reset pagination to page 1 whenever active filter or search queries change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeCategoryFilter, selectedCountry, searchQuery, selectedLocation])

  // Total pages and paginated slice of categoryFilteredJobs
  const totalPages = Math.ceil(categoryFilteredJobs.length / PAGE_SIZE) || 1
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return categoryFilteredJobs.slice(start, start + PAGE_SIZE)
  }, [categoryFilteredJobs, currentPage, PAGE_SIZE])

  // Daily Dynamic Client Rotation (rotates every midnight based on day of year)
  const dailyTrendingClients = useMemo(() => {
    const today = new Date()
    const startOfYear = new Date(today.getFullYear(), 0, 0)
    const diff = today - startOfYear + (startOfYear.getTimezoneOffset() - today.getTimezoneOffset()) * 60 * 1000
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
    const poolLen = TRENDING_CLIENTS_POOL.length
    const idx1 = dayOfYear % poolLen
    const idx2 = (dayOfYear + 1) % poolLen
    const idx3 = (dayOfYear + 2) % poolLen
    return [
      TRENDING_CLIENTS_POOL[idx1],
      TRENDING_CLIENTS_POOL[idx2],
      TRENDING_CLIENTS_POOL[idx3]
    ]
  }, [])

  const todayFormattedDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date())
    } catch (_) {
      return 'Today'
    }
  }, [])

  // Selected Job object for Page 2
  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null
    return (jobs || []).find(j => j.id === selectedJobId) || null
  }, [jobs, selectedJobId])

  // Categorized Buckets for Page 1 default view
  const categorizedJobBuckets = useMemo(() => {
    const list = jobs || []
    return {
      trending: list.slice(0, 6),
      engineering: list.filter(j => /software|engineer|developer|java|python|c#|\.net|react|full\s*stack|frontend|backend/i.test(`${j.title || ''} ${(j.skills || []).join(' ')}`)).slice(0, 6),
      dataAnalytics: list.filter(j => /data|analytics|analyst|bi|power\s*bi|sql|etl|machine\s*learning|ai|scientist/i.test(`${j.title || ''} ${(j.skills || []).join(' ')}`)).slice(0, 6),
      cloudDevops: list.filter(j => /cloud|aws|azure|gcp|devops|kubernetes|docker|infrastructure|terraform/i.test(`${j.title || ''} ${(j.skills || []).join(' ')}`)).slice(0, 6),
      managementPublic: list.filter(j => /director|manager|lead|scrum|product|project|program|business\s*analyst|health|clinical|med/i.test(`${j.title || ''} ${(j.skills || []).join(' ')}`)).slice(0, 6)
    }
  }, [jobs])

  // Handle Search Submission from Hero
  const handleHeroSearchSubmit = (e) => {
    if (e) e.preventDefault()
    if (setSearchQuery) setSearchQuery(heroTitleQuery)
    if (setSelectedLocation) {
      if (!heroLocationQuery.trim()) {
        setSelectedLocation('All')
      } else {
        setSelectedLocation(heroLocationQuery.trim())
      }
    }
    setCurrentPage(1)
    const feed = document.getElementById('wellfound-split-workspace')
    if (feed) {
      feed.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // 1-Click Trending Filter Selection with Smooth Scroll
  const handleTrendingCardClick = (target) => {
    if (typeof target === 'object' && target !== null) {
      if (target.countryKey && setSelectedCountry) {
        setSelectedCountry(target.countryKey)
      }
      if (target.categoryKey) {
        setActiveCategoryFilter(target.categoryKey)
      }
    } else if (typeof target === 'string') {
      setActiveCategoryFilter(target)
    }
    setCurrentPage(1)
    if (setSearchQuery) setSearchQuery('')
    const feed = document.getElementById('wellfound-split-workspace')
    if (feed) {
      feed.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Helper for Similar Jobs calculation fallback
  const similarJobsList = useMemo(() => {
    if (!selectedJob) return []
    if (typeof getSimilarJobs === 'function') {
      return getSimilarJobs(selectedJob, jobs, 3)
    }
    return jobs.filter(j => j.id !== selectedJob.id).slice(0, 3)
  }, [selectedJob, jobs, getSimilarJobs])

  // Computed properties for selected job (Page 2)
  const selCleanTitle = selectedJob ? (cleanJobTitleWithPositionNumber ? cleanJobTitleWithPositionNumber(selectedJob.title) : selectedJob.title) : ''
  const selDomain = selectedJob ? resolveClientDomainName(selectedJob) : ''
  const selLoc = selectedJob ? (resolveJobLocation ? resolveJobLocation(selectedJob) : (selectedJob.work_mode || 'Remote, US')) : ''
  const selWorkMode = selectedJob ? resolveWorkArrangement(selectedJob) : 'Hybrid'
  const selLocalReq = selectedJob ? resolveLocalRequirement(selectedJob) : { label: 'Nationwide', isLocalNeeded: false, urgency: 'none' }
  const selDetails = selectedJob ? parseWellfoundJobDetails(selectedJob, selCleanTitle, selDomain, selLoc, selWorkMode, selLocalReq, getFullDescriptionText) : null
  const isSaved = Boolean(
    selectedJob && (
      Array.isArray(savedJobs)
        ? savedJobs.includes(selectedJob.id)
        : savedJobs && typeof savedJobs === 'object'
        ? Boolean(savedJobs[selectedJob.id])
        : false
    )
  )

  // ─── FULL SEO DYNAMIC ENGINE (Google Jobs Schema.org & Meta Tags) ─────────
  useEffect(() => {
    const siteUrl = 'https://smarthireus.com'
    const currentUrl = typeof window !== 'undefined' ? window.location.href : `${siteUrl}/jobs`

    const setMeta = (name, content, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    if (selectedJob) {
      // ── Page 2 SEO (Job Detail)
      const pageTitle = `${selCleanTitle} | Direct Client Job in ${selLoc} | SmartHire Careers`
      document.title = pageTitle

      const desc = `Apply for ${selCleanTitle} at Direct Client in ${selLoc}. Verified ${selWorkMode} IT contract opportunity with competitive rate and fast recruiter review.`
      setMeta('description', desc)
      setMeta('keywords', `${selCleanTitle}, direct client it jobs, ${selLoc} IT jobs, ${selWorkMode} it contracts, c2c jobs, w2 contracts, smarthire careers`)
      setMeta('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1')

      // OpenGraph
      setMeta('og:type', 'article', true)
      setMeta('og:title', pageTitle, true)
      setMeta('og:description', desc, true)
      setMeta('og:url', currentUrl, true)
      setMeta('og:site_name', 'SmartHire Careers', true)

      // Twitter
      setMeta('twitter:card', 'summary_large_image')
      setMeta('twitter:title', pageTitle)
      setMeta('twitter:description', desc)

      // Canonical
      let canonical = document.querySelector('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
      }
      canonical.setAttribute('href', `${siteUrl}/jobs?jobId=${selectedJob.id}`)

      // Google for Jobs: Schema.org JobPosting JSON-LD
      const existingLd = document.getElementById('smarthire-jobposting-jsonld')
      if (existingLd) existingLd.remove()

      const ldScript = document.createElement('script')
      ldScript.id = 'smarthire-jobposting-jsonld'
      ldScript.type = 'application/ld+json'

      const isRemote = selWorkMode.toLowerCase().includes('remote')
      const validUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const jobPostingSchema = {
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        "title": selCleanTitle,
        "description": `<p><strong>Role:</strong> ${selCleanTitle}</p><p><strong>Client Domain:</strong> ${selDomain}</p><p><strong>Location:</strong> ${selLoc}</p><p><strong>Work Policy:</strong> ${selWorkMode}</p><p>${(getFullDescriptionText ? getFullDescriptionText(selectedJob) : selectedJob.description || '').replace(/\n/g, '<br/>')}</p>`,
        "identifier": {
          "@type": "PropertyValue",
          "name": "SmartHire ATS",
          "value": resolveReqId(selectedJob)
        },
        "datePosted": selectedJob.creationDate ? new Date(selectedJob.creationDate).toISOString().split('T')[0] : '2026-09-15',
        "validThrough": validUntil,
        "employmentType": "CONTRACTOR",
        "hiringOrganization": {
          "@type": "Organization",
          "name": selDomain || "Enterprise Direct Client",
          "sameAs": siteUrl
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": selLoc.split(',')[0]?.trim() || "Richmond",
            "addressRegion": selLoc.split(',')[1]?.trim() || "VA",
            "addressCountry": "US"
          }
        },
        ...(isRemote ? {
          "jobLocationType": "TELECOMMUTE",
          "applicantLocationRequirements": {
            "@type": "Country",
            "name": "USA"
          }
        } : {}),
        "directApply": true
      }

      ldScript.textContent = JSON.stringify(jobPostingSchema)
      document.head.appendChild(ldScript)

    } else {
      // ── Page 1 SEO (All Jobs)
      const pageTitle = 'Direct Client IT Jobs, C2C & W2 Remote Contracts | SmartHire ATS'
      document.title = pageTitle

      const desc = 'Browse 100+ verified direct client IT requisitions across State, Healthcare, Cloud and Enterprise clients. Remote, hybrid & onsite roles with fast ATS recruiter review.'
      setMeta('description', desc)
      setMeta('keywords', 'direct client it jobs, state it contracts, remote c2c jobs, w2 contracts, cloud engineer direct client, java developer state contracts, it staffing portal, smarthire ats')
      setMeta('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1')

      // OpenGraph
      setMeta('og:type', 'website', true)
      setMeta('og:title', pageTitle, true)
      setMeta('og:description', desc, true)
      setMeta('og:url', `${siteUrl}/jobs`, true)
      setMeta('og:site_name', 'SmartHire Careers', true)

      // Twitter
      setMeta('twitter:card', 'summary_large_image')
      setMeta('twitter:title', pageTitle)
      setMeta('twitter:description', desc)

      // Canonical
      let canonical = document.querySelector('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
      }
      canonical.setAttribute('href', `${siteUrl}/jobs`)

      // Google Job ItemList schema for Page 1
      const existingLd = document.getElementById('smarthire-jobposting-jsonld')
      if (existingLd) existingLd.remove()

      const ldScript = document.createElement('script')
      ldScript.id = 'smarthire-jobposting-jsonld'
      ldScript.type = 'application/ld+json'

      const itemListSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Direct Client IT Requisitions",
        "description": "Verified direct-client contract positions in Cloud, Software Engineering, Data & Public Sector IT.",
        "itemListElement": (jobs || []).slice(0, 25).map((job, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "url": `${siteUrl}/jobs?jobId=${job.id}`,
          "name": cleanJobTitleWithPositionNumber ? cleanJobTitleWithPositionNumber(job.title) : job.title
        }))
      }

      ldScript.textContent = JSON.stringify(itemListSchema)
      document.head.appendChild(ldScript)
    }

    return () => {
      const ld = document.getElementById('smarthire-jobposting-jsonld')
      if (ld) ld.remove()
    }
  }, [selectedJob, selCleanTitle, selLoc, selWorkMode, selDomain, jobs, cleanJobTitleWithPositionNumber, getFullDescriptionText])

  // ─── Render Clean Job Row for Page 1 Feed (No save, No apply button) ──────
  const renderJobRow = (job) => {
    const cleanTitle = cleanJobTitleWithPositionNumber ? cleanJobTitleWithPositionNumber(job.title) : job.title
    const domainName = resolveClientDomainName(job)
    const loc = resolveJobLocation ? resolveJobLocation(job) : (job.work_mode || 'Remote, US')
    const workMode = resolveWorkArrangement(job)
    const localReq = resolveLocalRequirement(job)
    const isExpired = isJobExpired ? isJobExpired(job) : false

    const workModeBadge = workMode === 'Remote'
      ? { bg: isLight ? '#DCFCE7' : '#052E16', text: isLight ? '#15803D' : '#86EFAC', border: isLight ? '#BBF7D0' : '#166534' }
      : workMode === 'Hybrid'
      ? { bg: isLight ? '#EDE9FE' : '#2E1065', text: isLight ? '#6D28D9' : '#C4B5FD', border: isLight ? '#DDD6FE' : '#5B21B6' }
      : { bg: isLight ? '#FEF3C7' : '#451A03', text: isLight ? '#B45309' : '#FDE68A', border: isLight ? '#FDE68A' : '#92400E' }

    return (
      <div
        key={job.id}
        onClick={() => handleSelectJob(job.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.borderLight}`,
          backgroundColor: colors.cardBg,
          cursor: 'pointer',
          transition: 'background-color 0.15s ease, transform 0.15s ease',
          gap: 16
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.hoverBg
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.cardBg
        }}
      >
        {/* Left: Company Logo & Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
          <CompanyLogo job={job} size={42} />

          <div style={{ minWidth: 0, flex: 1 }}>
            <h4 style={{
              margin: '0 0 5px',
              fontSize: 15.5,
              fontWeight: 700,
              color: colors.textPrimary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.01em'
            }}>
              {cleanTitle}
            </h4>

            <div style={{
              fontSize: 13,
              color: colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 6
            }}>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 4,
                backgroundColor: isLight ? '#EFF6FF' : '#1E293B',
                color: isLight ? '#1D4ED8' : '#60A5FA',
                border: `1px solid ${isLight ? '#BFDBFE' : '#2563EB'}`,
                letterSpacing: '0.02em'
              }}>
                {domainName}
              </span>
              {Boolean(job.country === 'India' || job.countryId === '76415c4c-6968-454c-aabc-36c68a9b1f06' || /(?:pune|delhi|noida|hyderabad|bangalore|bengaluru|mumbai|gondia)\b/i.test(job.location || '')) && (
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 4,
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #FDE68A',
                  letterSpacing: '0.02em'
                }}>
                  India
                </span>
              )}
              <span style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted }}>
                #{resolveReqId(job.reqId || job.id, job)}
              </span>
              <span style={{ color: colors.textMuted }}>•</span>
              <span style={{
                fontSize: 11.5,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                backgroundColor: workModeBadge.bg,
                color: workModeBadge.text,
                border: `1px solid ${workModeBadge.border}`
              }}>
                {workMode}
              </span>
              <span style={{ color: colors.textMuted }}>•</span>
              <span>{loc}</span>
              <span style={{ color: colors.textMuted }}>•</span>
              <span style={{
                fontSize: 11.5,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 4,
                backgroundColor: colors.badgeBg,
                color: colors.textSecondary
              }}>
                {localReq.label}
              </span>
              {isExpired && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#DC2626',
                  backgroundColor: isLight ? '#FEE2E2' : '#450A0A',
                  padding: '1px 6px',
                  borderRadius: 4,
                  marginLeft: 4
                }}>
                  Closed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: View Job Action Button Only (No save, No apply on page 1) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleSelectJob(job.id)
            }}
            style={{
              padding: '8px 18px',
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              backgroundColor: isLight ? '#FFFFFF' : '#1F2937',
              color: colors.textPrimary,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.textPrimary
              e.currentTarget.style.backgroundColor = colors.buttonDark
              e.currentTarget.style.color = colors.buttonDarkText
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.backgroundColor = isLight ? '#FFFFFF' : '#1F2937'
              e.currentTarget.style.color = colors.textPrimary
            }}
          >
            <span>View Job</span>
            <ChevronRightIcon size={13} color="currentColor" />
          </button>
        </div>
      </div>
    )
  }

  // ─── Dedicated Reusable Google AdSense & Highlights Sidebar ───────────────
  const renderSidebarAds = () => (
    <div className="wellfound-sidebar-ads" style={{
      position: 'sticky',
      top: 84,
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }}>
      {/* AdSense Unit 1: Sponsored Display Box */}
      <div style={{
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        backgroundColor: colors.cardBg,
        padding: 16,
        boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.08em',
          color: colors.textMuted,
          textTransform: 'uppercase',
          marginBottom: 10
        }}>
          SPONSORED / ADVERTISEMENT
        </div>

        {/* Google AdSense Responsive Unit */}
        <div style={{
          minHeight: 180,
          backgroundColor: isLight ? '#F9FAFB' : '#171F2C',
          borderRadius: 10,
          border: `1px dashed ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 14,
          gap: 8
        }}>
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: 140 }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
            data-ad-slot="9876543210"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.textPrimary }}>
            Direct Fortune 500 Contracts
          </div>
          <div style={{ fontSize: 11.5, color: colors.textSecondary, lineHeight: 1.4 }}>
            Fast-track your application with priority recruiter review.
          </div>
        </div>
      </div>

      {/* Checklist Card: "Level up your job search" (Reference Card) */}
      <div style={{
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        backgroundColor: colors.cardBg,
        padding: 20,
        boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none'
      }}>
        <h3 style={{
          fontSize: 15,
          fontWeight: 800,
          color: colors.textPrimary,
          margin: '0 0 4px',
          letterSpacing: '-0.01em'
        }}>
          Level up your job search
        </h3>
        <p style={{
          fontSize: 12.5,
          color: colors.textSecondary,
          margin: '0 0 16px',
          lineHeight: 1.4
        }}>
          Why top professionals apply directly through SmartHire:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <CheckCircleIcon size={16} color="#10B981" />
            <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600, lineHeight: 1.3 }}>
              Verified Direct Client contracts only
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <CheckCircleIcon size={16} color="#10B981" />
            <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600, lineHeight: 1.3 }}>
              Zero third-party markups or rate cuts
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <CheckCircleIcon size={16} color="#10B981" />
            <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600, lineHeight: 1.3 }}>
              Instant ATS parsing & skill matching
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <CheckCircleIcon size={16} color="#10B981" />
            <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600, lineHeight: 1.3 }}>
              Fast-track recruiter review in 24h
            </div>
          </div>
        </div>
      </div>

      {/* AdSense Unit 2: Career Partner Spotlight */}
      <div style={{
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        backgroundColor: colors.cardBg,
        padding: 16,
        boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.08em',
          color: colors.textMuted,
          textTransform: 'uppercase',
          marginBottom: 10
        }}>
          CAREER PARTNER SPOTLIGHT
        </div>

        <div style={{
          minHeight: 120,
          backgroundColor: isLight ? '#F9FAFB' : '#171F2C',
          borderRadius: 10,
          border: `1px dashed ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
          gap: 6
        }}>
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: 90 }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
            data-ad-slot="1234567890"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
          <div style={{ fontSize: 11.5, color: colors.textSecondary }}>
            Explore verified enterprise staffing opportunities
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      backgroundColor: colors.bg,
      color: colors.textPrimary,
      minHeight: '100vh',
      transition: 'background-color 0.2s, color 0.2s'
    }}>
      {/* Responsive Grid Layout Styles */}
      <style>{`
        @media (min-width: 1280px) {
          .wellfound-3col-workspace {
            display: grid !important;
            grid-template-columns: 360px minmax(0, 1fr) 290px !important;
            gap: 24px !important;
            align-items: start !important;
          }
          .wellfound-2col-workspace {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) 300px !important;
            gap: 28px !important;
            align-items: start !important;
          }
        }
        @media (min-width: 1024px) and (max-width: 1279px) {
          .wellfound-3col-workspace {
            display: grid !important;
            grid-template-columns: 340px minmax(0, 1fr) !important;
            gap: 20px !important;
            align-items: start !important;
          }
          .wellfound-2col-workspace {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) 280px !important;
            gap: 24px !important;
            align-items: start !important;
          }
        }
        @media (max-width: 1023px) {
          .wellfound-3col-workspace,
          .wellfound-2col-workspace {
            display: flex !important;
            flex-direction: column !important;
            gap: 20px !important;
          }
        }
      `}</style>

      {/* ─── 1. WELLFOUND TOP NAVIGATION BAR ──────────────────────────────── */}
      <header style={{
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: colors.cardBg,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : '0 1px 3px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          maxWidth: 1560,
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}>
          {/* Left Brand & Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <Link
              to="/jobs"
              onClick={handleBackToAllJobs}
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <span style={{
                fontSize: 22,
                fontWeight: 900,
                color: colors.textPrimary,
                letterSpacing: '-0.03em'
              }}>
                smarthire
              </span>
              <span style={{
                fontSize: 22,
                fontWeight: 900,
                color: colors.accentCoral,
                marginLeft: 1
              }}>
                :
              </span>
            </Link>

            <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => {
                  handleBackToAllJobs()
                  if (setSelectedCountry) setSelectedCountry('ALL')
                  if (setSelectedLocation) setSelectedLocation('All')
                }}
                style={{
                  background: (!selectedJobId && selectedCountry === 'ALL' && selectedLocation !== 'Remote') ? (isLight ? '#F3F4F6' : '#1F2937') : 'transparent',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: (!selectedJobId && selectedCountry === 'ALL' && selectedLocation !== 'Remote') ? 700 : 500,
                  color: (!selectedJobId && selectedCountry === 'ALL' && selectedLocation !== 'Remote') ? colors.textPrimary : colors.textSecondary,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                All Jobs
              </button>
              <button
                onClick={() => {
                  handleBackToAllJobs()
                  if (setSelectedCountry) setSelectedCountry('India')
                  const el = document.getElementById('wellfound-split-workspace')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  background: selectedCountry === 'India' ? (isLight ? '#EEF2FF' : '#1E1B4B') : 'transparent',
                  border: selectedCountry === 'India' ? '1px solid #C7D2FE' : 'none',
                  fontSize: 14,
                  fontWeight: selectedCountry === 'India' ? 700 : 500,
                  color: selectedCountry === 'India' ? '#4F46E5' : colors.textSecondary,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                India ({indiaJobsCount || 25})
              </button>
              <button
                onClick={() => {
                  handleBackToAllJobs()
                  if (setSelectedCountry) setSelectedCountry('USA')
                  const el = document.getElementById('wellfound-split-workspace')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  background: selectedCountry === 'USA' ? (isLight ? '#F3F4F6' : '#1F2937') : 'transparent',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: selectedCountry === 'USA' ? 700 : 500,
                  color: selectedCountry === 'USA' ? colors.textPrimary : colors.textSecondary,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                USA
              </button>
              <button
                onClick={() => {
                  handleBackToAllJobs()
                  if (setSelectedLocation) setSelectedLocation('Remote')
                  const el = document.getElementById('wellfound-split-workspace')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  background: selectedLocation === 'Remote' ? (isLight ? '#F3F4F6' : '#1F2937') : 'transparent',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: selectedLocation === 'Remote' ? 700 : 500,
                  color: colors.textSecondary,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Remote
              </button>
              <Link
                to="/blog"
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: colors.textSecondary,
                  padding: '6px 12px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  transition: 'background-color 0.15s ease, color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isLight ? '#F3F4F6' : '#1F2937'
                  e.currentTarget.style.color = colors.textPrimary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = colors.textSecondary
                }}
              >
                Blog
              </Link>
              <Link
                to="/"
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: colors.textSecondary,
                  padding: '6px 12px',
                  borderRadius: 6,
                  textDecoration: 'none'
                }}
              >
                For Employers
              </Link>
            </nav>
          </div>

          {/* Right Header Controls: Compact Auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {candidateUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px 4px 6px',
                  borderRadius: 20,
                  backgroundColor: '#F3F4F6',
                  border: `1px solid ${colors.border}`
                }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#0A0E1A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700
                  }}>
                    {(candidateUser.name || candidateUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.textPrimary }}>
                    {candidateUser.name || candidateUser.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={handleCandidateSignOut}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.textSecondary,
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '4px 6px'
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setShowLoginModal && setShowLoginModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    color: colors.textPrimary,
                    cursor: 'pointer',
                    padding: '6px 10px'
                  }}
                >
                  Log In
                </button>
                <button
                  onClick={() => setShowLoginModal && setShowLoginModal(true)}
                  style={{
                    backgroundColor: '#0A0E1A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: 700,
                    padding: '6px 14px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                    transition: 'opacity 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 1: ALL JOBS CATEGORIZED FRONT PAGE (When !selectedJob)
          Matches media_1789659179557.png
      ═══════════════════════════════════════════════════════════════════════ */}
      {!selectedJob && (
        <main>
          {/* ── 1. Hero Section ── */}
          <section style={{
            maxWidth: 1560,
            margin: '0 auto',
            padding: '42px 24px 24px',
            textAlign: 'center',
            position: 'relative'
          }}>
            {/* Eyebrow */}
            <div style={{
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: colors.accentCoral,
              marginBottom: 12
            }}>
              OVER 100+ VERIFIED DIRECT-CLIENT IT REQUISITIONS
            </div>

            {/* Main Headline */}
            <h1 style={{
              fontSize: 'clamp(32px, 4.5vw, 50px)',
              fontWeight: 900,
              letterSpacing: '-0.035em',
              color: colors.textPrimary,
              margin: '0 0 24px',
              lineHeight: 1.15
            }}>
              Find what's next<span style={{ color: colors.accentCoral }}>:</span>
            </h1>

            {/* Dual-Input Search Pill Container */}
            <form
              onSubmit={handleHeroSearchSubmit}
              style={{
                maxWidth: 820,
                margin: '0 auto',
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 50,
                padding: '8px 10px 8px 24px',
                display: 'flex',
                alignItems: 'center',
                boxShadow: isLight ? '0 10px 25px rgba(0, 0, 0, 0.05)' : '0 10px 25px rgba(0, 0, 0, 0.3)',
                gap: 12,
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease'
              }}
            >
              {/* Left: Job Title Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <SearchIcon size={20} color={colors.textSecondary} />
                <input
                  type="text"
                  placeholder="Job title, keywords, or skills"
                  value={heroTitleQuery}
                  onChange={(e) => setHeroTitleQuery(e.target.value)}
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: 15,
                    fontWeight: 500,
                    color: colors.textPrimary,
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Vertical Divider */}
              <div style={{ width: 1, height: 32, backgroundColor: colors.border }} />

              {/* Right: Location Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <LocationIcon size={20} color={colors.textSecondary} />
                <input
                  type="text"
                  placeholder="Location (e.g. Remote, NC, VA, MI)"
                  value={heroLocationQuery}
                  onChange={(e) => setHeroLocationQuery(e.target.value)}
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: 15,
                    fontWeight: 500,
                    color: colors.textPrimary,
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Vertical Divider */}
              <div style={{ width: 1, height: 32, backgroundColor: colors.border }} />

              {/* Country Selector Dropdown (StaffingOrigin style: ALL / India / USA) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    if (setSelectedCountry) setSelectedCountry(e.target.value)
                  }}
                  style={{
                    border: `1px solid ${selectedCountry === 'India' ? '#818CF8' : colors.border}`,
                    outline: 'none',
                    backgroundColor: selectedCountry === 'India' ? (isLight ? '#EEF2FF' : '#1E1B4B') : (isLight ? '#F8FAFC' : '#1E293B'),
                    color: selectedCountry === 'India' ? '#4F46E5' : colors.textPrimary,
                    fontSize: 13.5,
                    fontWeight: 700,
                    borderRadius: 20,
                    padding: '8px 14px',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                  title="Filter by country"
                >
                  <option value="ALL">All Countries</option>
                  <option value="India">India ({indiaJobsCount || 25})</option>
                  <option value="USA">USA ({usaJobsCount || 117})</option>
                </select>
              </div>

              {/* Black Pill Search Button */}
              <button
                type="submit"
                style={{
                  backgroundColor: colors.buttonDark,
                  color: colors.buttonDarkText,
                  border: 'none',
                  borderRadius: 30,
                  padding: '12px 28px',
                  fontSize: 14.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Search
              </button>
            </form>
          </section>

          {/* ── 2. Trending Direct Clients 3-Card Grid (Dynamic Daily Rotation) ── */}
          <section style={{
            maxWidth: 1560,
            margin: '0 auto',
            padding: '10px 24px 28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{
                  fontSize: 21,
                  fontWeight: 800,
                  color: colors.textPrimary,
                  margin: 0,
                  letterSpacing: '-0.02em'
                }}>
                  Trending direct clients hiring now
                </h2>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 12,
                  backgroundColor: isLight ? '#EFF6FF' : '#1E293B',
                  color: '#2563EB',
                  border: `1px solid ${isLight ? '#BFDBFE' : '#3B82F6'}`
                }}>
                  Updated Daily • {todayFormattedDate}
                </span>
              </div>
              <span style={{ fontSize: 13, color: colors.textSecondary, fontWeight: 500 }}>
                Click a client card to filter open opportunities
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 18
            }}>
              {dailyTrendingClients.map((client) => {
                const isSelected = activeCategoryFilter === client.categoryKey
                return (
                  <div
                    key={client.id}
                    onClick={() => handleTrendingCardClick(client)}
                    style={{
                      border: `1.5px solid ${isSelected ? colors.activeBorder : colors.border}`,
                      borderRadius: 14,
                      backgroundColor: isSelected ? colors.activeBg : colors.cardBg,
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = isLight ? '0 12px 24px rgba(0,0,0,0.08)' : '0 12px 24px rgba(0,0,0,0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <div style={{
                          width: 42,
                          height: 42,
                          borderRadius: 10,
                          background: client.avatarGradient,
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: 15
                        }}>
                          {client.avatar}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>
                            {client.title}
                          </h3>
                          <div style={{ fontSize: 12, color: colors.textSecondary }}>{client.subtitle}</div>
                        </div>
                      </div>

                      <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.5, margin: '0 0 12px' }}>
                        {client.description}
                      </p>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 6,
                          backgroundColor: isLight ? client.tag1.bgLight : client.tag1.bgDark,
                          color: client.tag1.color
                        }}>
                          {client.tag1.label}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                          {client.tag2}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.textSecondary }}>
                          {client.tag3}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      borderTop: `1px solid ${colors.borderLight}`,
                      paddingTop: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      fontWeight: 700,
                      color: colors.textPrimary
                    }}>
                      <span>View Open Positions</span>
                      <ChevronRightIcon size={14} color={colors.textPrimary} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── 3. Page 1 2-Column Feed: Categorized Listings + Right AdSense ── */}
          <section id="wellfound-split-workspace" style={{
            maxWidth: 1560,
            margin: '0 auto',
            padding: '8px 24px 64px'
          }}>
            {/* Category Filter Pills Ribbon */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 14,
              marginBottom: 24,
              borderBottom: `1px solid ${colors.borderLight}`
            }}>
              <button
                onClick={() => {
                  if (setSelectedCountry) setSelectedCountry('ALL')
                  setActiveCategoryFilter('all')
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1px solid ${(activeCategoryFilter === 'all' && selectedCountry === 'ALL') ? colors.buttonDark : colors.border}`,
                  backgroundColor: (activeCategoryFilter === 'all' && selectedCountry === 'ALL') ? colors.buttonDark : colors.cardBg,
                  color: (activeCategoryFilter === 'all' && selectedCountry === 'ALL') ? colors.buttonDarkText : colors.textPrimary,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                All Requisitions ({jobs.length})
              </button>
              <button
                onClick={() => {
                  if (setSelectedCountry) setSelectedCountry(selectedCountry === 'India' ? 'ALL' : 'India')
                  setActiveCategoryFilter('all')
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  border: `1px solid ${selectedCountry === 'India' ? '#4F46E5' : '#C7D2FE'}`,
                  backgroundColor: selectedCountry === 'India' ? '#4F46E5' : (isLight ? '#EEF2FF' : '#1E1B4B'),
                  color: selectedCountry === 'India' ? '#FFFFFF' : '#4F46E5',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                India ({indiaJobsCount || 25})
              </button>
              <button
                onClick={() => {
                  if (setSelectedCountry) setSelectedCountry(selectedCountry === 'USA' ? 'ALL' : 'USA')
                  setActiveCategoryFilter('all')
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1px solid ${selectedCountry === 'USA' ? colors.buttonDark : colors.border}`,
                  backgroundColor: selectedCountry === 'USA' ? colors.buttonDark : colors.cardBg,
                  color: selectedCountry === 'USA' ? colors.buttonDarkText : colors.textPrimary,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                USA ({usaJobsCount || 117})
              </button>
              <button
                onClick={() => setActiveCategoryFilter('dev')}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1px solid ${activeCategoryFilter === 'dev' ? colors.buttonDark : colors.border}`,
                  backgroundColor: activeCategoryFilter === 'dev' ? colors.buttonDark : colors.cardBg,
                  color: activeCategoryFilter === 'dev' ? colors.buttonDarkText : colors.textPrimary,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                Engineering
              </button>
              <button
                onClick={() => setActiveCategoryFilter('cloud')}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1px solid ${activeCategoryFilter === 'cloud' ? colors.buttonDark : colors.border}`,
                  backgroundColor: activeCategoryFilter === 'cloud' ? colors.buttonDark : colors.cardBg,
                  color: activeCategoryFilter === 'cloud' ? colors.buttonDarkText : colors.textPrimary,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                Cloud & Infrastructure
              </button>
              <button
                onClick={() => setActiveCategoryFilter('data')}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1px solid ${activeCategoryFilter === 'data' ? colors.buttonDark : colors.border}`,
                  backgroundColor: activeCategoryFilter === 'data' ? colors.buttonDark : colors.cardBg,
                  color: activeCategoryFilter === 'data' ? colors.buttonDarkText : colors.textPrimary,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                Data & AI
              </button>
              <button
                onClick={() => setActiveCategoryFilter('health')}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1px solid ${activeCategoryFilter === 'health' ? colors.buttonDark : colors.border}`,
                  backgroundColor: activeCategoryFilter === 'health' ? colors.buttonDark : colors.cardBg,
                  color: activeCategoryFilter === 'health' ? colors.buttonDarkText : colors.textPrimary,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                Public Health & State
              </button>
              <button
                onClick={() => setActiveCategoryFilter('mgmt')}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1px solid ${activeCategoryFilter === 'mgmt' ? colors.buttonDark : colors.border}`,
                  backgroundColor: activeCategoryFilter === 'mgmt' ? colors.buttonDark : colors.cardBg,
                  color: activeCategoryFilter === 'mgmt' ? colors.buttonDarkText : colors.textPrimary,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                Management & Governance
              </button>
            </div>

            {/* 2-Column Master Layout: Left Categorized Feeds + Right AdSense */}
            <div className="wellfound-2col-workspace">
              {/* ── Left Column: Job Feeds ── */}
              <div>
                {/* When User is filtering by country, category, or searching, show flat list */}
                {activeCategoryFilter !== 'all' || searchQuery || (selectedCountry && selectedCountry !== 'ALL') ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                        {selectedCountry === 'India' && `India Open Positions (${categoryFilteredJobs.length} positions found)`}
                        {selectedCountry === 'USA' && `USA Open Requisitions (${categoryFilteredJobs.length} positions found)`}
                        {selectedCountry === 'ALL' && activeCategoryFilter === 'cloud' && 'Cloud & Infrastructure Jobs'}
                        {selectedCountry === 'ALL' && activeCategoryFilter === 'dev' && 'Engineering Jobs'}
                        {selectedCountry === 'ALL' && activeCategoryFilter === 'data' && 'Data & Analytics Jobs'}
                        {selectedCountry === 'ALL' && activeCategoryFilter === 'health' && 'Public Health & State Jobs'}
                        {selectedCountry === 'ALL' && activeCategoryFilter === 'mgmt' && 'Management & Governance Jobs'}
                        {selectedCountry === 'ALL' && activeCategoryFilter === 'all' && `Search Results (${categoryFilteredJobs.length})`}
                      </h2>
                      <span style={{ fontSize: 13, color: colors.textSecondary }}>
                        {categoryFilteredJobs.length > 0 ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, categoryFilteredJobs.length)} of ${categoryFilteredJobs.length} positions` : '0 matches'}
                      </span>
                    </div>

                    <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
                      {categoryFilteredJobs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 24px', color: colors.textSecondary }}>
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>
                            No open requisitions found
                          </div>
                          <div style={{ fontSize: 13 }}>
                            Try adjusting your search terms or clearing your category filters.
                          </div>
                        </div>
                      ) : (
                        <>
                          {paginatedJobs.map(job => renderJobRow(job))}

                          {/* Authentic StaffingOrigin-style Pagination Controls (< 1 2 >) */}
                          {totalPages > 1 && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '16px 20px',
                              backgroundColor: isLight ? '#F8FAFC' : '#111827',
                              borderTop: `1px solid ${colors.border}`,
                              flexWrap: 'wrap',
                              gap: 12
                            }}>
                              <div style={{ fontSize: 13, color: colors.textSecondary, fontWeight: 500 }}>
                                Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, categoryFilteredJobs.length)} of {categoryFilteredJobs.length} positions (Page {currentPage} of {totalPages})
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {/* Previous Page Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (currentPage > 1) {
                                      setCurrentPage(prev => prev - 1)
                                      const feed = document.getElementById('wellfound-split-workspace')
                                      if (feed) feed.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                    }
                                  }}
                                  disabled={currentPage <= 1}
                                  style={{
                                    width: 36,
                                    height: 36,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 8,
                                    border: `1px solid ${colors.border}`,
                                    backgroundColor: isLight ? '#FFFFFF' : '#1F2937',
                                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                                    opacity: currentPage <= 1 ? 0.35 : 1,
                                    transition: 'all 0.15s ease'
                                  }}
                                  aria-label="Previous Page"
                                >
                                  <ChevronLeftIcon size={16} color={currentPage <= 1 ? colors.textMuted : colors.textPrimary} />
                                </button>

                                {/* Page Number Buttons */}
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                                  const isActive = pageNum === currentPage
                                  return (
                                    <button
                                      key={pageNum}
                                      type="button"
                                      onClick={() => {
                                        setCurrentPage(pageNum)
                                        const feed = document.getElementById('wellfound-split-workspace')
                                        if (feed) feed.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                      }}
                                      style={{
                                        minWidth: 36,
                                        height: 36,
                                        padding: '0 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 8,
                                        fontSize: 13.5,
                                        fontWeight: isActive ? 800 : 600,
                                        backgroundColor: isActive ? '#1E1B4B' : (isLight ? '#FFFFFF' : '#1F2937'),
                                        color: isActive ? '#FFFFFF' : colors.textPrimary,
                                        border: `1.5px solid ${isActive ? '#1E1B4B' : colors.border}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                      }}
                                    >
                                      {pageNum}
                                    </button>
                                  )
                                })}

                                {/* Next Page Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (currentPage < totalPages) {
                                      setCurrentPage(prev => prev + 1)
                                      const feed = document.getElementById('wellfound-split-workspace')
                                      if (feed) feed.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                    }
                                  }}
                                  disabled={currentPage >= totalPages}
                                  style={{
                                    width: 36,
                                    height: 36,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 8,
                                    border: `1px solid ${colors.border}`,
                                    backgroundColor: isLight ? '#FFFFFF' : '#1F2937',
                                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                                    opacity: currentPage >= totalPages ? 0.35 : 1,
                                    transition: 'all 0.15s ease'
                                  }}
                                  aria-label="Next Page"
                                >
                                  <ChevronRightIcon size={16} color={currentPage >= totalPages ? colors.textMuted : colors.textPrimary} />
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  /* When on default view, render 5 Categorized Sections */
                  <div>
                    {/* Section 1: Trending Direct Client Jobs */}
                    <div style={{ marginBottom: 38 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                          Trending direct client jobs
                        </h2>
                        <span style={{ fontSize: 13, color: colors.textSecondary }}>
                          High priority requisitions
                        </span>
                      </div>
                      <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
                        {categorizedJobBuckets.trending.map(job => renderJobRow(job))}
                      </div>
                    </div>

                    {/* Section 2: Engineering Jobs */}
                    <div style={{ marginBottom: 38 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                          Engineering jobs
                        </h2>
                        <button
                          onClick={() => setActiveCategoryFilter('dev')}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 700,
                            color: colors.textPrimary,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          View all engineering jobs →
                        </button>
                      </div>
                      <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
                        {categorizedJobBuckets.engineering.map(job => renderJobRow(job))}
                      </div>
                    </div>

                    {/* Section 3: Data & Analytics Jobs */}
                    <div style={{ marginBottom: 38 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                          Data and Analytics jobs
                        </h2>
                        <button
                          onClick={() => setActiveCategoryFilter('data')}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 700,
                            color: colors.textPrimary,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          View all data & analytics jobs →
                        </button>
                      </div>
                      <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
                        {categorizedJobBuckets.dataAnalytics.map(job => renderJobRow(job))}
                      </div>
                    </div>

                    {/* Section 4: Cloud & Infrastructure Jobs */}
                    <div style={{ marginBottom: 38 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                          Cloud & Infrastructure jobs
                        </h2>
                        <button
                          onClick={() => setActiveCategoryFilter('cloud')}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 700,
                            color: colors.textPrimary,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          View all cloud jobs →
                        </button>
                      </div>
                      <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
                        {categorizedJobBuckets.cloudDevops.map(job => renderJobRow(job))}
                      </div>
                    </div>

                    {/* Section 5: Management & Public Sector Jobs */}
                    <div style={{ marginBottom: 38 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                          Management & Public Sector jobs
                        </h2>
                        <button
                          onClick={() => setActiveCategoryFilter('mgmt')}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 700,
                            color: colors.textPrimary,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          View all management jobs →
                        </button>
                      </div>
                      <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
                        {categorizedJobBuckets.managementPublic.map(job => renderJobRow(job))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Right Column: AdSense Sidebar ── */}
              <div>
                {renderSidebarAds()}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 2: 3-COLUMN JOB DOSSIER WORKSPACE (When selectedJobId && selectedJob)
          Matches media_1789659080974.png & media_1789657089815.png
      ═══════════════════════════════════════════════════════════════════════ */}
      {selectedJob && (
        <main>
          {/* Top Breadcrumb & Back Action Bar */}
          <div style={{
            maxWidth: 1560,
            margin: '0 auto',
            padding: '16px 24px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16
          }}>
            <button
              onClick={handleBackToAllJobs}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13.5,
                fontWeight: 700,
                color: colors.textPrimary,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.hoverBg
                e.currentTarget.style.borderColor = colors.textPrimary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.cardBg
                e.currentTarget.style.borderColor = colors.border
              }}
            >
              <ArrowLeftIcon size={16} color="currentColor" />
              <span>Back to all jobs</span>
            </button>

            <div style={{
              fontSize: 13,
              color: colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span style={{ cursor: 'pointer' }} onClick={handleBackToAllJobs}>Jobs</span>
              <span>/</span>
              <span style={{ fontWeight: 600, color: colors.textPrimary, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selCleanTitle}
              </span>
            </div>
          </div>

          {/* 3-Column Master Layout */}
          <section style={{
            maxWidth: 1560,
            margin: '0 auto',
            padding: '12px 24px 64px'
          }}>
            <div className="wellfound-3col-workspace">
              {/* ════════ COLUMN 1: LEFT REQUISITIONS FEED (SIDE MAI BAKI KE CARD) ════════ */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                maxHeight: 'calc(100vh - 110px)',
                overflowY: 'auto',
                paddingRight: 6,
                position: 'sticky',
                top: 84
              }}>
                {(jobs || []).map(job => {
                  const isSelected = selectedJob?.id === job.id
                  const cleanTitle = cleanJobTitleWithPositionNumber ? cleanJobTitleWithPositionNumber(job.title) : job.title
                  const domainName = resolveClientDomainName(job)
                  const loc = resolveJobLocation ? resolveJobLocation(job) : (job.work_mode || 'Remote, US')
                  const workMode = resolveWorkArrangement(job)
                  const localReq = resolveLocalRequirement(job)
                  const isExpired = isJobExpired ? isJobExpired(job) : false

                  const workModeStyles = workMode === 'Remote'
                    ? { bg: isLight ? '#DCFCE7' : '#052E16', text: isLight ? '#15803D' : '#86EFAC', border: isLight ? '#BBF7D0' : '#166534' }
                    : workMode === 'Hybrid'
                    ? { bg: isLight ? '#EDE9FE' : '#2E1065', text: isLight ? '#6D28D9' : '#C4B5FD', border: isLight ? '#DDD6FE' : '#5B21B6' }
                    : { bg: isLight ? '#FEF3C7' : '#451A03', text: isLight ? '#B45309' : '#FDE68A', border: isLight ? '#FDE68A' : '#92400E' }

                  const localStyles = localReq.urgency === 'high'
                    ? { bg: isLight ? '#FEE2E2' : '#450A0A', text: isLight ? '#B91C1C' : '#FCA5A5', border: isLight ? '#FECACA' : '#991B1B' }
                    : localReq.urgency === 'medium'
                    ? { bg: isLight ? '#FFEDD5' : '#431407', text: isLight ? '#C2410C' : '#FDBA74', border: isLight ? '#FED7AA' : '#9A3412' }
                    : localReq.urgency === 'commutable'
                    ? { bg: isLight ? '#F1F5F9' : '#1E293B', text: isLight ? '#334155' : '#CBD5E1', border: isLight ? '#E2E8F0' : '#334155' }
                    : { bg: isLight ? '#E0F2FE' : '#082F49', text: isLight ? '#0369A1' : '#7DD3FC', border: isLight ? '#BAE6FD' : '#075985' }

                  return (
                    <div
                      key={job.id}
                      onClick={() => handleSelectJob(job.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '15px 16px',
                        borderRadius: 12,
                        border: `1.5px solid ${isSelected ? (isLight ? '#0A0E1A' : '#3B82F6') : colors.border}`,
                        borderLeft: isSelected ? `4px solid ${isLight ? '#0A0E1A' : '#3B82F6'}` : `1.5px solid ${colors.border}`,
                        backgroundColor: isSelected ? colors.activeBg : colors.cardBg,
                        cursor: 'pointer',
                        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                        gap: 8,
                        boxShadow: isSelected 
                          ? (isLight ? '0 4px 16px rgba(10, 14, 26, 0.08)' : '0 4px 16px rgba(0,0,0,0.4)')
                          : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = colors.hoverBg
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = isLight ? '0 4px 12px rgba(0,0,0,0.04)' : '0 4px 12px rgba(0,0,0,0.3)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = colors.cardBg
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }
                      }}
                    >
                      {/* Top Row: Avatar, Title & Right Arrow */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          <CompanyLogo job={job} size={38} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h4 style={{
                              margin: '0 0 2px',
                              fontSize: 14.5,
                              fontWeight: 700,
                              color: colors.textPrimary,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              letterSpacing: '-0.01em'
                            }}>
                              {cleanTitle}
                            </h4>
                            <div style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: colors.textSecondary,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {domainName}
                            </div>
                          </div>
                        </div>

                        <ChevronRightIcon size={14} color={isSelected ? (isLight ? '#0A0E1A' : '#3B82F6') : colors.textMuted} />
                      </div>

                      {/* Middle Row: Work Mode Pill & Location Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          backgroundColor: workModeStyles.bg,
                          color: workModeStyles.text,
                          border: `1px solid ${workModeStyles.border}`
                        }}>
                          {workMode}
                        </span>

                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: colors.textSecondary,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3
                        }}>
                          <LocationIcon size={12} color={colors.textSecondary} />
                          <span>{loc}</span>
                        </span>

                        {Boolean(job.country === 'India' || job.countryId === '76415c4c-6968-454c-aabc-36c68a9b1f06' || /(?:pune|delhi|noida|hyderabad|bangalore|bengaluru|mumbai|gondia)\b/i.test(job.location || '')) && (
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: 4,
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            border: '1px solid #FDE68A'
                          }}>
                            India
                          </span>
                        )}
                      </div>

                      {/* Bottom Row: Local Candidate Requirement Pill */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 4,
                          backgroundColor: localStyles.bg,
                          color: localStyles.text,
                          border: `1px solid ${localStyles.border}`
                        }}>
                          {localReq.label}
                        </span>

                        {isExpired && (
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: '#DC2626',
                            backgroundColor: isLight ? '#FEE2E2' : '#450A0A',
                            padding: '1px 6px',
                            borderRadius: 4
                          }}>
                            Closed
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ════════ COLUMN 2: CENTER SPACIOUS WELLFOUND JOB DOSSIER ════════ */}
              <article
                ref={centerPanelRef}
                style={{
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 16,
                  padding: '32px 36px',
                  boxShadow: isLight ? '0 4px 20px rgba(0, 0, 0, 0.04)' : 'none',
                  minHeight: 600
                }}
              >
                {/* ── 1. HEADER ROW: LOGO, TAGLINE, SAVE, APPLY NOW ── */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 20,
                  marginBottom: 20,
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <CompanyLogo job={selectedJob} size={58} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: colors.textPrimary }}>
                          {selDomain}
                        </span>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 12,
                          backgroundColor: isLight ? '#DCFCE7' : '#052E16',
                          color: isLight ? '#15803D' : '#86EFAC',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                          Actively Hiring
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: colors.textSecondary }}>
                        Direct-client contract opportunity with priority ATS review
                      </div>
                    </div>
                  </div>

                  {/* Top Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => handleToggleSaveJob && handleToggleSaveJob(selectedJob)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.cardBg,
                        color: colors.textPrimary,
                        fontSize: 13.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverBg}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.cardBg}
                    >
                      <BookmarkIcon size={15} filled={isSaved} color={colors.textPrimary} />
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>

                    <button
                      onClick={() => handleApplyClick && handleApplyClick(selectedJob)}
                      style={{
                        backgroundColor: colors.buttonDark,
                        color: colors.buttonDarkText,
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 24px',
                        fontSize: 13.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transition: 'opacity 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      Apply Now
                    </button>
                  </div>
                </div>

                {/* ── 2. JOB TITLE & METADATA ROW ── */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: isLight ? '#1D4ED8' : '#60A5FA',
                      background: isLight ? '#EFF6FF' : 'rgba(29, 78, 216, 0.2)',
                      border: `1px solid ${isLight ? '#BFDBFE' : '#2563EB'}`,
                      padding: '2px 8px',
                      borderRadius: 4
                    }}>
                      {selDomain || 'DIRECT CLIENT'}
                    </span>
                    {Boolean(selectedJob?.country === 'India' || selectedJob?.countryId === '76415c4c-6968-454c-aabc-36c68a9b1f06' || /(?:pune|delhi|noida|hyderabad|bangalore|bengaluru|mumbai|gondia)\b/i.test(selectedJob?.location || '')) && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        color: '#92400E',
                        background: '#FEF3C7',
                        border: '1px solid #FDE68A',
                        padding: '2px 8px',
                        borderRadius: 4
                      }}>
                        India
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 700 }}>
                      · Req #{resolveReqId(selectedJob?.reqId || selectedJob?.id, selectedJob)}
                    </span>
                  </div>

                  <h1 style={{
                    fontSize: 'clamp(24px, 3vw, 32px)',
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    color: colors.textPrimary,
                    margin: '0 0 10px',
                    lineHeight: 1.2
                  }}>
                    {selCleanTitle}
                  </h1>

                {/* ── POSITION OVERVIEW GRID (MATCHING SCREENSHOT 2) ── */}
                <div style={{
                  margin: '18px 0 22px',
                  background: isLight ? '#F8FAFC' : '#161F30',
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: '16px 18px'
                }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: colors.textPrimary,
                    marginBottom: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Position Overview
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '12px 14px'
                  }}>
                    {[
                      { label: 'JOB TYPE', val: selectedJob?.type || selectedJob?.employment_type || 'Contract' },
                      { label: 'CATEGORY', val: selectedJob?.category || 'IT' },
                      { label: 'REQ ID', val: resolveReqId(selectedJob?.reqId || selectedJob?.id, selectedJob) },
                      { label: 'COUNTRY', val: selectedJob?.country || 'USA' },
                      { label: 'INTERVIEW TYPE', val: selectedJob?.interviewType || 'Video or In Person' },
                      { label: 'DURATION', val: selectedJob?.duration || 'Long Term' },
                      { label: 'WORK PREFERENCE', val: selectedJob?.workMode || selectedJob?.work_mode || 'Onsite' },
                      { label: 'WORK LOCATION', val: selLoc }
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ fontSize: 10.5, color: colors.textMuted, fontWeight: 700, letterSpacing: '0.04em' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 800, marginTop: 2 }}>
                          {item.val}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                    fontSize: 13,
                    color: colors.textSecondary
                  }}>
                    <span style={{
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 6,
                      backgroundColor: selWorkMode === 'Remote' ? (isLight ? '#DCFCE7' : '#052E16') : (isLight ? '#EDE9FE' : '#2E1065'),
                      color: selWorkMode === 'Remote' ? (isLight ? '#15803D' : '#86EFAC') : (isLight ? '#6D28D9' : '#C4B5FD')
                    }}>
                      {selWorkMode}
                    </span>

                    <span>{formatExperience ? formatExperience(selectedJob) : '5+ Years Experience'}</span>
                    <span>•</span>
                    <span>{formatContractType ? formatContractType(selectedJob) : 'Contract (C2C / W2)'}</span>

                    {/* Timezone Indicator */}
                    {getJobPostTimezones && (
                      <>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: colors.textMuted }}>
                          <ClockIcon size={13} color={colors.textMuted} />
                          <span>EST: {getJobPostTimezones(selectedJob).EST?.split('at')[1] || '09:00 AM EST'}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* ── 3. 2-COLUMN ATTRIBUTE MATRIX ── */}
                <div style={{
                  borderTop: `1px solid ${colors.border}`,
                  borderBottom: `1px solid ${colors.border}`,
                  padding: '24px 0',
                  marginBottom: 32,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 20
                }}>
                  {/* Left Column of Matrix */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                        HIRES REMOTELY IN
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
                        {selLoc.includes('Remote') ? 'Everywhere in the United States' : selLoc}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                        COMPANY LOCATION
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
                        {selLoc}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                        RELOCATION
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
                        {selLocalReq.isLocalNeeded ? 'Not provided (Local candidates required)' : 'Not required for remote roles'}
                      </div>
                    </div>
                  </div>

                  {/* Right Column of Matrix */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Contract Engagement Details */}
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                        CONTRACT ENGAGEMENT
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
                        {formatContractType ? formatContractType(selectedJob) : 'Contract'} · Direct Client W2 / C2C
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                        REMOTE WORK POLICY
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
                        {selWorkMode === 'Remote' ? 'Fully Remote (Work from home anywhere in US)' : `${selWorkMode} schedule`}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                        VISA & WORK AUTHORIZATION
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
                        US Citizens, Green Card, H-1B Transfer, C2C / W2 Eligible
                      </div>
                    </div>
                  </div>

                  {/* Skills Pills Full-Width Row */}
                  <div style={{ gridColumn: '1 / -1', paddingTop: 6 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                      SKILLS & TECHNOLOGIES
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selDetails?.rawSkills.map((skill, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            padding: '6px 14px',
                            borderRadius: 20,
                            backgroundColor: isLight ? '#F1F0FB' : '#2A1F45',
                            color: isLight ? '#581C87' : '#E9D5FF',
                            border: `1px solid ${isLight ? '#E9D5FF' : '#581C87'}`
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── 4. STRUCTURED ABOUT THE JOB SECTIONS (EXACT WELLFOUND LAYOUT) ── */}
                <div style={{ marginBottom: 36, lineHeight: 1.75, fontSize: 15, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                  {/* About the Role */}
                  <div style={{ marginBottom: 30 }}>
                    <h3 style={{ fontSize: 19, fontWeight: 800, color: colors.textPrimary, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
                      About the Role
                    </h3>
                    <p style={{
                      margin: 0,
                      color: isLight ? '#1E293B' : '#E2E8F0',
                      fontSize: 15,
                      lineHeight: 1.75
                    }}>
                      {selDetails?.summary}
                    </p>
                  </div>

                  {/* What You'll Do */}
                  <div style={{ marginBottom: 30 }}>
                    <h3 style={{ fontSize: 19, fontWeight: 800, color: colors.textPrimary, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
                      What You'll Do
                    </h3>
                    <ul style={{
                      margin: 0,
                      padding: '0 0 0 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      listStyleType: 'disc'
                    }}>
                      {selDetails?.responsibilities?.map((item, idx) => {
                        const colonIdx = item.indexOf(':')
                        let prefix = null
                        let rest = item
                        if (colonIdx > 0 && colonIdx < 50 && !item.slice(0, colonIdx).includes('.')) {
                          prefix = item.slice(0, colonIdx).trim()
                          rest = item.slice(colonIdx + 1).trim()
                        }
                        return (
                          <li key={idx} style={{
                            fontSize: 15,
                            lineHeight: 1.65,
                            color: isLight ? '#1E293B' : '#E2E8F0',
                            paddingLeft: 4
                          }}>
                            {prefix ? (
                              <>
                                <strong style={{ color: isLight ? '#0A0E1A' : '#FFFFFF', fontWeight: 700 }}>
                                  {prefix}:
                                </strong>{' '}
                                {rest}
                              </>
                            ) : (
                              rest
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  {/* Who You Are (All Levels) */}
                  <div style={{ marginBottom: 30 }}>
                    <h3 style={{ fontSize: 19, fontWeight: 800, color: colors.textPrimary, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
                      Who You Are (All Levels)
                    </h3>
                    <ul style={{
                      margin: 0,
                      padding: '0 0 0 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      listStyleType: 'disc'
                    }}>
                      {selDetails?.requiredSkills?.map((req, idx) => {
                        const colonIdx = req.indexOf(':')
                        let prefix = null
                        let rest = req
                        if (colonIdx > 0 && colonIdx < 50 && !req.slice(0, colonIdx).includes('.')) {
                          prefix = req.slice(0, colonIdx).trim()
                          rest = req.slice(colonIdx + 1).trim()
                        }
                        return (
                          <li key={idx} style={{
                            fontSize: 15,
                            lineHeight: 1.65,
                            color: isLight ? '#1E293B' : '#E2E8F0',
                            paddingLeft: 4
                          }}>
                            {prefix ? (
                              <>
                                <strong style={{ color: isLight ? '#0A0E1A' : '#FFFFFF', fontWeight: 700 }}>
                                  {prefix}:
                                </strong>{' '}
                                {rest}
                              </>
                            ) : (
                              rest
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  {/* Preferred Qualifications (if present) */}
                  {selDetails?.preferredSkills && selDetails.preferredSkills.length > 0 && (
                    <div style={{ marginBottom: 30 }}>
                      <h3 style={{ fontSize: 19, fontWeight: 800, color: colors.textPrimary, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
                        Preferred Qualifications
                      </h3>
                      <ul style={{
                        margin: 0,
                        padding: '0 0 0 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        listStyleType: 'disc'
                      }}>
                        {selDetails.preferredSkills.map((req, idx) => (
                          <li key={idx} style={{
                            fontSize: 15,
                            lineHeight: 1.65,
                            color: isLight ? '#1E293B' : '#E2E8F0',
                            paddingLeft: 4
                          }}>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* About the Company */}
                  <div style={{ marginBottom: 30 }}>
                    <h3 style={{ fontSize: 19, fontWeight: 800, color: colors.textPrimary, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
                      About the Company
                    </h3>
                    <p style={{
                      margin: 0,
                      color: isLight ? '#1E293B' : '#E2E8F0',
                      fontSize: 15,
                      lineHeight: 1.75
                    }}>
                      {selDetails?.aboutCompany}
                    </p>
                  </div>

                  {/* Project & Engagement Specifications */}
                  {selDetails?.engagementDetails && selDetails.engagementDetails.length > 0 && (
                    <div style={{ marginBottom: 30 }}>
                      <h3 style={{ fontSize: 19, fontWeight: 800, color: colors.textPrimary, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
                        Project & Engagement Specifications
                      </h3>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: 12,
                        padding: '18px 20px',
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.subtleBg
                      }}>
                        {selDetails.engagementDetails.map((detail, idx) => {
                          const parts = detail.split(':')
                          const label = parts[0]?.trim() || ''
                          const val = parts.slice(1).join(':').trim() || label
                          return (
                            <div key={idx}>
                              <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                                {label}
                              </div>
                              <div style={{ fontSize: 13.5, fontWeight: 600, color: colors.textPrimary }}>
                                {val}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── 6. BOTTOM PROMINENT APPLY ACTION BAR ── */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                  borderTop: `1px solid ${colors.border}`,
                  paddingTop: 24,
                  marginBottom: 28
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: colors.textSecondary, fontWeight: 500 }}>
                      Direct Client Requisition · Fast Recruiter Review
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: colors.textPrimary }}>
                      Ready to submit your application?
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyClick && handleApplyClick(selectedJob)}
                    style={{
                      backgroundColor: colors.buttonDark,
                      color: colors.buttonDarkText,
                      border: 'none',
                      borderRadius: 8,
                      padding: '12px 28px',
                      fontSize: 14.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                      transition: 'opacity 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    Apply for this position →
                  </button>
                </div>

                {/* ── 7. SIMILAR JOBS RECOMMENDATION FOOTER ── */}
                {similarJobsList.length > 0 && (
                  <div style={{
                    marginTop: 36,
                    paddingTop: 28,
                    borderTop: `1px solid ${colors.border}`
                  }}>
                    <div style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: colors.textPrimary,
                      marginBottom: 16,
                      letterSpacing: '-0.02em'
                    }}>
                      Similar jobs you may be interested in
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: 14
                    }}>
                      {similarJobsList.map(simJob => (
                        <div
                          key={simJob.id}
                          onClick={() => handleSelectJob(simJob.id)}
                          style={{
                            border: `1px solid ${colors.border}`,
                            borderRadius: 10,
                            padding: 16,
                            backgroundColor: colors.subtleBg,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.cardBg
                            e.currentTarget.style.borderColor = colors.textPrimary
                            e.currentTarget.style.transform = 'translateY(-2px)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = colors.subtleBg
                            e.currentTarget.style.borderColor = colors.border
                            e.currentTarget.style.transform = 'translateY(0)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                              <CompanyLogo job={simJob} size={32} />
                              <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary }}>
                                {resolveClientDomainName(simJob)}
                              </div>
                            </div>
                            <div style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: colors.textPrimary,
                              marginBottom: 6,
                              lineHeight: 1.3
                            }}>
                              {cleanJobTitleWithPositionNumber ? cleanJobTitleWithPositionNumber(simJob.title) : simJob.title}
                            </div>
                            <div style={{ fontSize: 12, color: colors.textMuted }}>
                              {resolveJobLocation ? resolveJobLocation(simJob) : (simJob.work_mode || 'Remote')}
                            </div>
                          </div>

                          <div style={{
                            marginTop: 12,
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: isLight ? '#0A0E1A' : '#60A5FA'
                          }}>
                            View Details →
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>

              {/* ════════ COLUMN 3: RIGHT ADSENSE & HIGHLIGHTS SIDEBAR ════════ */}
              <div>
                {renderSidebarAds()}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ─── 5. MULTI-COLUMN WELLFOUND FOOTER (media_1789659143215.png) ───── */}
      <footer style={{
        borderTop: `1px solid ${colors.border}`,
        backgroundColor: colors.cardBg,
        padding: '48px 24px 40px'
      }}>
        <div style={{
          maxWidth: 1560,
          margin: '0 auto'
        }}>
          {/* Top 4-Column Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 40,
            marginBottom: 44
          }}>
            {/* Col 1: Brand, Tagline & Social */}
            <div>
              <div style={{
                fontSize: 22,
                fontWeight: 900,
                color: colors.textPrimary,
                letterSpacing: '-0.03em',
                marginBottom: 12
              }}>
                smarthire<span style={{ color: colors.accentCoral }}>:</span>
              </div>
              <p style={{
                fontSize: 13.5,
                color: colors.textSecondary,
                lineHeight: 1.6,
                margin: '0 0 20px',
                maxWidth: 290
              }}>
                Direct-client IT requisition ecosystem and next-generation applicant tracking system. Connecting elite engineering talent with state and enterprise clients.
              </p>

              {/* Social SVG Icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: colors.textSecondary, transition: 'color 0.15s' }}
                  aria-label="SmartHire on X / Twitter"
                >
                  <TwitterIcon size={18} color="currentColor" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: colors.textSecondary, transition: 'color 0.15s' }}
                  aria-label="SmartHire on Instagram"
                >
                  <InstagramIcon size={18} color="currentColor" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: colors.textSecondary, transition: 'color 0.15s' }}
                  aria-label="SmartHire on LinkedIn"
                >
                  <LinkedInIcon size={18} color="currentColor" />
                </a>
              </div>
            </div>

            {/* Col 2: For Candidates */}
            <div>
              <h3 style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: colors.textPrimary,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: '0 0 16px'
              }}>
                For Candidates
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
                <Link to="/jobs" onClick={handleBackToAllJobs} style={{ color: colors.textSecondary, textDecoration: 'none' }}>
                  Browse Direct Client Jobs
                </Link>
                <Link to="/jobs" onClick={() => { handleBackToAllJobs(); if (setSelectedLocation) setSelectedLocation('Remote') }} style={{ color: colors.textSecondary, textDecoration: 'none' }}>
                  Remote IT Careers
                </Link>
                <Link to="/jobs" onClick={() => { handleBackToAllJobs(); setActiveCategoryFilter('dev') }} style={{ color: colors.textSecondary, textDecoration: 'none' }}>
                  Software & Cloud Engineering
                </Link>
                <Link to="/jobs" onClick={() => { handleBackToAllJobs(); setActiveCategoryFilter('data') }} style={{ color: colors.textSecondary, textDecoration: 'none' }}>
                  Data & AI Architect Roles
                </Link>
                <Link to="/blog" style={{ color: colors.textSecondary, textDecoration: 'none' }}>
                  C2C vs W2 Contract Guide
                </Link>
              </div>
            </div>

            {/* Col 3: For Recruiters & Clients */}
            <div>
              <h3 style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: colors.textPrimary,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: '0 0 16px'
              }}>
                For Recruiters & Clients
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
                <Link to="/" style={{ color: colors.textSecondary, textDecoration: 'none' }}>
                  SmartHire ATS Overview
                </Link>
                <Link to="/contact" style={{ color: colors.textSecondary, textDecoration: 'none' }}>
                  Enterprise Demo & Inquiries
                </Link>
                <Link to="/login" style={{ color: colors.textSecondary, textDecoration: 'none' }}>
                  Recruiter Portal Login
                </Link>
              </div>
            </div>

            {/* Col 4: Company */}
            <div>
              <h3 style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: colors.textPrimary,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: '0 0 16px'
              }}>
                Company
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
                <Link to="/about" style={{ color: colors.textSecondary, textDecoration: 'none' }}>
                  About SmartHire
                </Link>
                <Link to="/contact" style={{ color: colors.textSecondary, textDecoration: 'none' }}>
                  Contact & Help Center
                </Link>
                <Link to="/privacy" style={{ color: colors.textSecondary, textDecoration: 'none' }}>
                  Privacy Policy
                </Link>
                <Link to="/terms" style={{ color: colors.textSecondary, textDecoration: 'none' }}>
                  Terms of Service
                </Link>
                <Link to="/support" style={{ color: colors.textSecondary, textDecoration: 'none' }}>
                  Security & Compliance
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Browse links */}
          <div style={{
            borderTop: `1px solid ${colors.borderLight}`,
            paddingTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            fontSize: 12.5,
            color: colors.textMuted
          }}>
            <div>
              Copyright © 2026 SmartHire LLC. All rights reserved. <span style={{ marginLeft: 8, cursor: 'pointer', textDecoration: 'underline' }}>Cookie Preferences</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span>Browse by:</span>
              <span style={{ color: colors.textSecondary }}>Direct Client Jobs</span>
              <span>•</span>
              <span style={{ color: colors.textSecondary }}>Remote Jobs</span>
              <span>•</span>
              <span style={{ color: colors.textSecondary }}>Locations</span>
              <span>•</span>
              <span style={{ color: colors.textSecondary }}>High Priority Requisitions</span>
              <span>•</span>
              <span style={{ color: colors.textSecondary }}>Enterprise Clients</span>
              <span>•</span>
              <span style={{ color: colors.textSecondary }}>Tech Hubs</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
