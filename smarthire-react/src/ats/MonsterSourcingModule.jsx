import React, { useState, useEffect, useMemo, useCallback } from 'react'

// Standard corporate SVG line icons adhering strictly to Rule 8 (Zero Unrequested Emojis)
export const IconMonster = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconSearch = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconStar = ({ size = 14, filled = false, color = '#64748B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#F59E0B' : 'none'} stroke={filled ? '#F59E0B' : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const IconShare = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const IconMail = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

const IconFolderPlus = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
)

const IconExternalLink = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const IconPrinter = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
)

const IconCopy = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const IconCheck = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconFileText = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

// Bulletproof helper to extract clean string label from any skill format (string, object with {id, name, required}, etc.)
export const safeSkillLabel = (skill) => {
  if (!skill) return ''
  if (typeof skill === 'string') return skill.trim()
  if (typeof skill === 'object') {
    return (skill.name || skill.skill || skill.title || skill.label || skill.value || '').trim()
  }
  return String(skill).trim()
}

// Check if a requisition is genuinely Open and Active (Filters out closed, cancelled, filled, expired, banked, on-hold jobs)
export function isJobActive(job) {
  if (!job) return false
  const s = String(job.status || job.job_status || job.state || '').toLowerCase().trim()
  if (['closed', 'bank', 'banked', 'filled', 'cancelled', 'canceled', 'expired', 'hold', 'on hold', 'inactive', 'draft', 'archived', 'completed', 'close', 'cancel'].includes(s)) return false
  if (job.active === false || job.is_active === false || job.isOpen === false) return false
  if (job.deadline) {
    const d = new Date(job.deadline)
    if (!isNaN(d.getTime())) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (d < today) return false
    }
  }
  if (job.description && typeof job.description === 'string') {
    const m = job.description.match(/submission\s+deadline\s*:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i)
    if (m) {
      const d = new Date(m[1])
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (!isNaN(d.getTime()) && d < today) return false
    }
  }
  return true
}

// Enterprise-Grade Boolean Search Evaluator (Parses AND, OR, NOT, Quoted phrases, Parentheses across candidate resume & profile)
export function evaluateBooleanQuery(query, cand) {
  if (!query || !query.trim()) return true
  if (!cand) return false

  const candSkillsStr = Array.isArray(cand.skills)
    ? cand.skills.map(safeSkillLabel).join(' ')
    : String(cand.skills || '')

  const fullText = [
    cand.name,
    cand.title,
    cand.role,
    cand.currentRole,
    cand.previousRole,
    candSkillsStr,
    cand.location,
    cand.experience,
    cand.resumeText,
    cand.company
  ].filter(Boolean).join(' ').toLowerCase()

  // Normalize boolean operators
  let expr = query
    .replace(/\bAND\s+NOT\b/gi, ' && ! ')
    .replace(/\bNOT\b/gi, ' && ! ')
    .replace(/\bAND\b/gi, ' && ')
    .replace(/\bOR\b/gi, ' || ')
    .trim()

  expr = expr.replace(/^&&\s*/, '')

  const termMap = new Map()
  let termCounter = 0

  // 1. Quoted exact phrases: "..."
  expr = expr.replace(/"([^"]+)"/g, (match, term) => {
    const key = `__T${termCounter++}__`
    const termClean = term.toLowerCase().trim()
    let found = termClean.length > 0 && fullText.includes(termClean)

    // Resilient fallback: If quoted phrase has noise (dashes, numbers like "- 494", brackets)
    // and exact string match fails, check if the core significant words match
    if (!found && termClean.length > 0) {
      const sanitizedPhrase = termClean
        .replace(/\s*[-–—#:]\s*(req|requisition|id|no)?\s*\d+.*$/i, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .trim()
      if (sanitizedPhrase.length > 0 && fullText.includes(sanitizedPhrase)) {
        found = true
      } else {
        const significantTokens = sanitizedPhrase.split(/\s+/).filter(w => w.length >= 4 && !/^\d+$/.test(w))
        if (significantTokens.length >= 2) {
          const matchCount = significantTokens.filter(t => fullText.includes(t)).length
          if (matchCount >= Math.min(2, significantTokens.length)) {
            found = true
          }
        }
      }
    }

    termMap.set(key, found)
    return key
  })

  // 2. Remaining bare keywords (avoiding operators)
  expr = expr.replace(/([a-zA-Z0-9_.#+-]+)/g, (match) => {
    if (match === '&&' || match === '||' || match.startsWith('__T')) return match
    const key = `__T${termCounter++}__`
    const termClean = match.toLowerCase().trim()
    const found = termClean.length > 0 && fullText.includes(termClean)
    termMap.set(key, found)
    return key
  })

  // If no searchable terms were found (e.g. user only typed operators), do not filter out candidates
  if (termMap.size === 0) return true

  // 3. Substitute evaluated boolean values
  let evalExpr = expr
  for (const [key, val] of termMap.entries()) {
    evalExpr = evalExpr.split(key).join(val ? ' true ' : ' false ')
  }

  // 4. Sanitize to strictly allowed JS boolean symbols
  const sanitized = evalExpr.replace(/[^truefalse&|!()\s]/g, '')

  try {
    const fn = new Function(`return Boolean(${sanitized});`)
    return fn()
  } catch (e) {
    // Graceful syntax fallback (e.g. user currently typing unbalanced parenthesis)
    for (const val of termMap.values()) {
      if (val) return true
    }
    return false
  }
}

// Clean noisy requisition titles (e.g. "#159325 — IT Security Specialist Systems Administrator - 494 (DHS - OIT)")
export function extractCleanRoleTitles(rawTitle) {
  if (!rawTitle) return ['Specialist']
  
  // 1. Remove bracketed / parenthesized metadata like (DHS ...), (CAI), [Contract], (Req#123)
  let clean = rawTitle.replace(/\s*\(.*?\)/g, '').replace(/\s*\[.*?\]/g, '').trim()
  
  // 2. Remove leading requisition IDs like "#159325 — ", "Req 123: "
  clean = clean.replace(/^[#\d\s–—-]+\s*[—–-]\s*/g, '').replace(/^[#\d\s–—:]+/g, '').trim()
  
  // 3. Remove trailing requisition numbers or tracking codes like "- 494", "#159325", "Req-999"
  clean = clean.replace(/\s*[-–—|#:]\s*(req|requisition|id|no)?\s*\d+.*$/i, '').trim()
  
  // 4. Remove common work-type postfixes like "- Contract", "- Full Time", "- Remote", "| Hybrid"
  clean = clean.replace(/\s*[-–—|]\s*(contract|c2c|w2|remote|hybrid|onsite|full\s*time|part\s*time|urgent|open).*$/i, '').trim()
  
  clean = clean.trim() || rawTitle.trim()

  // 5. Split compound/multiple roles if present (e.g. "Security Specialist Systems Administrator")
  const slashParts = clean.split(/[/|,]+/).map(s => s.trim()).filter(Boolean)
  if (slashParts.length > 1) {
    return slashParts
  }

  const compoundMatch = clean.match(/^(.*?Specialist|.*?Architect|.*?Lead|.*?Engineer|.*?Developer)\s+(Systems\s+Administrator|Administrator|Manager|Analyst|Consultant.*)$/i)
  if (compoundMatch) {
    return [compoundMatch[1].trim(), compoundMatch[2].trim()]
  }

  return [clean]
}

// Generate 3 High-Precision Boolean Search Queries dynamically
export function generateBooleanVariants(rawRoleTitle, mustHaveSkills = [], altTitles = [], location = 'Columbia, SC') {
  const roleTitles = extractCleanRoleTitles(rawRoleTitle)
  const primaryTitle = roleTitles[0] || 'Specialist'
  const allRoleTerms = Array.from(new Set([...roleTitles, ...(altTitles || [])])).filter(Boolean)

  const skills = (mustHaveSkills || []).map(safeSkillLabel).filter(Boolean)
  const top2Skills = skills.slice(0, 2)

  const locParts = (location || '').split(',').map(s => s.trim())
  const city = locParts[0] || 'Columbia'
  const state = locParts[1] || 'SC'

  // Variant 1: Core Focus (Role OR Alternative Roles) AND (Skill 1 OR Skill 2)
  const roleClause = allRoleTerms.map(t => `"${t}"`).join(' OR ')
  const skillClause1 = top2Skills.length > 0 ? ` AND (${top2Skills.map(s => `"${s}"`).join(' OR ')})` : ''
  const query1 = `(${roleClause})${skillClause1}`

  // Variant 2: Broad Synonyms & Methodologies
  const expandedSkills = skills.slice(0, 4)
  const broadSkillsClause = expandedSkills.length > 0 
    ? ` AND (${expandedSkills.map(s => `"${s}"`).join(' OR ')} OR "Agile" OR "Enterprise")`
    : ` AND ("Agile" OR "Enterprise")`
  const query2 = `(${roleClause})${broadSkillsClause}`

  // Variant 3: Strict Local / State Proximity
  const query3 = `(${roleClause}) AND ("${city}" OR "${state}" OR "State" OR "Remote")` + (top2Skills.length > 0 ? ` AND ("${top2Skills[0]}")` : '')

  return [
    {
      id: 'variant_1',
      name: 'Variant 1: Core Technical Focus',
      description: 'Exact role title combined with primary required skills',
      query: query1
    },
    {
      id: 'variant_2',
      name: 'Variant 2: Broad Synonyms & Methodologies',
      description: 'Expands role synonyms, agile methodologies, and tooling',
      query: query2
    },
    {
      id: 'variant_3',
      name: 'Variant 3: Public Sector & State Proximity',
      description: 'Matches local geography, state agency, and core tech',
      query: query3
    }
  ]
}

// Default Authentic Candidates (Matching User Monster Screenshots)
const AUTHENTIC_SEED_CANDIDATES = [
  {
    id: 'cand-akula-govind',
    name: 'AKULA GOVIND',
    title: 'Senior FullStack Technical Lead Developer',
    company: 'Synchrony Financial',
    location: 'Duluth, Georgia',
    updatedRecency: '2 days ago',
    phone: '+14044571847',
    email: 'akulagovind14@gmail.com',
    source: 'Monster Sourcing',
    sourceCategory: 'monster_search',
    visaStatus: 'US Citizen',
    contractType: 'C2C / W2',
    rate: '$85/hr',
    experience: '12+ Years',
    skills: ['Microsoft C# (C Sharp)', 'Microsoft ASP.NET (Active Server Page)', 'Model View Controller', 'Angular', 'Azure Cloud', 'SQL Server'],
    currentRole: 'Senior FullStack Technical Lead Developer, Synchrony Financial',
    previousRole: 'Project#2, IDSS (Intelligent Decision Support Systems (IDSS)',
    resumeText: `AKULA GOVIND
Senior FullStack Technical Lead Developer
Duluth, Georgia, United States
Phone: +14044571847 • Email: akulagovind14@gmail.com

SUMMARY
Highly accomplished Senior FullStack Technical Lead Developer with 12+ years of enterprise engineering experience specializing in Microsoft .NET technologies, C#, ASP.NET MVC, Microservices, and cloud architectures at top US financial and enterprise clients including Synchrony Financial.

PROFESSIONAL EXPERIENCE
Senior FullStack Technical Lead Developer — Synchrony Financial (2021 – Present)
• Architected scalable microservices and modernized core transaction portals using .NET 8, C#, and ASP.NET Core Web API.
• Designed mission-critical payment settlement components handling 2.5M daily credit events with 99.99% reliability.
• Led sprint engineering reviews, offshore delivery alignment, and orchestrated automated CI/CD multi-stage releases on Microsoft Azure.
• Optimized complex SQL Server stored procedures and Redis caching layers, reducing database transaction latency by 42%.

Technical Lead & FullStack Engineer — IDSS (Intelligent Decision Support Systems) (2017 – 2021)
• Spearheaded full-stack modernization of risk assessment engines migrating legacy ASP.NET Web Forms to responsive Angular 12 and RESTful APIs.
• Engineered secure OAuth2 / OpenID Connect token authentication and SAML SSO integration for federal and banking partners.
• Mentored cross-functional development squads on TDD, clean architecture patterns, and domain-driven design principles.

CORE COMPETENCIES & TECHNICAL PROFICIENCIES
• Languages & Frameworks: C#, .NET Core, ASP.NET MVC, Entity Framework Core, Web API, TypeScript, Angular, React.
• Cloud & DevOps: Microsoft Azure (App Services, Functions, Key Vault, Blob), Docker, Kubernetes, Azure DevOps Pipelines.
• Databases & Messaging: SQL Server, PostgreSQL, Redis, Kafka, RabbitMQ.
• Methodologies: Agile Scrum, Microservices Architecture, Test-Driven Development (TDD), High-Performance Computing.`
  },
  {
    id: 'cand-prashanth-b',
    name: 'Prashanth B',
    title: '.Net Developer',
    company: 'Enterprise Client',
    location: 'Atlanta, Georgia',
    updatedRecency: '2 days ago',
    phone: '+14044571847',
    email: 'prashanth.b.dev@gmail.com',
    source: 'Job Site Portal',
    sourceCategory: 'careers_portal',
    visaStatus: 'H-1B',
    contractType: 'C2C',
    rate: '$75/hr',
    experience: '8 Years',
    skills: ['.NET Core', 'C#', 'ASP.NET Web API', 'SQL Server', 'Microservices', 'Azure'],
    currentRole: '.Net Developer, MVP Banking Project',
    previousRole: 'Software Developer, State Health Contract',
    resumeText: `PRASHANTH B
.Net Developer
Atlanta, Georgia
Phone: +14044571847 • Email: prashanth.b.dev@gmail.com

PROFESSIONAL SUMMARY
Experienced .NET Developer with 8 years of solid background designing and developing robust web applications, Web APIs, and distributed microservices using C#, .NET Core, Entity Framework, and SQL Server.

TECHNICAL SKILLS
• Programming: C#, VB.NET, SQL, JavaScript, HTML5, CSS3.
• Technologies: ASP.NET Core, Web API, Microservices, MVC, LINQ, Entity Framework.
• Cloud & Tools: Azure, Git, TFS, Postman, Visual Studio 2022.

WORK EXPERIENCE
.Net Developer — MVP Banking Project (2022 – Present)
• Modernized customer onboarding workflow utilizing ASP.NET Core Web API and Azure App Services.
• Implemented Entity Framework Core code-first migrations and optimized high-frequency financial queries.
• Collaborated closely with QA automation and product owners to maintain 95% test code coverage.

Software Developer — State Health Contract (2018 – 2022)
• Developed responsive healthcare provider portals using C#, ASP.NET MVC, and SQL Server.
• Integrated RESTful JSON endpoints and secure third-party insurance verification gateways.
• Resolved production defects and performed automated database backups and indexing.`
  },
  {
    id: 'cand-madhu-d',
    name: 'Madhu Devarapalli',
    title: 'Senior Java Full Stack Architect',
    company: 'FinTech Solutions',
    location: 'Charlotte, NC',
    updatedRecency: '1 day ago',
    phone: '+17049801234',
    email: 'madhu.devarapalli@gmail.com',
    source: 'Inbound Email',
    sourceCategory: 'email_inbox',
    visaStatus: 'US Citizen',
    contractType: 'C2C / W2',
    rate: '$90/hr',
    experience: '11 Years',
    skills: ['Java 17', 'Spring Boot', 'Microservices', 'React', 'AWS', 'Kafka'],
    currentRole: 'Lead Java Architect, FinTech Solutions',
    previousRole: 'Senior Java Developer, Global Payments',
    resumeText: `MADHU DEVARAPALLI
Senior Java Full Stack Architect
Charlotte, NC • Phone: +17049801234 • Email: madhu.devarapalli@gmail.com

SUMMARY
Enterprise Java Architect with 11 years designing mission-critical distributed systems, Spring Boot microservices, Kafka event streaming, and React frontend dashboards.`
  },
  {
    id: 'cand-srinath-b',
    name: 'Srinath B',
    title: 'Senior Business Analyst / Project Coordinator',
    company: 'HealthCare Systems',
    location: 'Columbia, South Carolina',
    updatedRecency: '3 days ago',
    phone: '+19458994176',
    email: 'srinathb1694@gmail.com',
    source: 'Mobile App',
    sourceCategory: 'mobile_app',
    visaStatus: 'Green Card',
    contractType: 'W2 / C2C',
    rate: '$70/hr',
    experience: '9 Years',
    skills: ['Business Analysis', 'BRD / FRD', 'Agile / Scrum', 'Jira', 'SQL', 'State Agency'],
    currentRole: 'Senior Business Analyst, HealthCare Systems',
    previousRole: 'IT Systems Analyst, Public Sector Project',
    resumeText: `SRINATH B
Senior Business Analyst / Project Coordinator
Columbia, SC • Phone: +19458994176 • Email: srinathb1694@gmail.com

SUMMARY
Accomplished Business Analyst with 9+ years experience eliciting requirements, authoring BRD/FRDs, and coordinating cross-functional Agile delivery teams for state health agencies.`
  },
  {
    id: 'cand-siva-n',
    name: 'Siva N',
    title: 'Lead Cloud DevOps & AWS Infrastructure Specialist',
    company: 'CloudOps Inc.',
    location: 'Austin, Texas',
    updatedRecency: '4 days ago',
    phone: '+15124009876',
    email: 'siva.n.c1ex1@contact.monster.com',
    source: 'Monster Sourcing',
    sourceCategory: 'monster_search',
    visaStatus: 'H-1B',
    contractType: 'C2C',
    rate: '$80/hr',
    experience: '10 Years',
    skills: ['AWS', 'Kubernetes (EKS)', 'Terraform', 'CI/CD Pipelines', 'Docker', 'Python'],
    currentRole: 'Lead Cloud DevOps Architect, CloudOps Inc.',
    previousRole: 'DevOps Engineer, Enterprise Cloud Services',
    resumeText: `SIVA N
Lead Cloud DevOps & AWS Infrastructure Specialist
Austin, TX • siva.n.c1ex1@contact.monster.com

SUMMARY
Cloud Infrastructure Architect with 10 years of experience managing Kubernetes clusters, Terraform infrastructure-as-code, and zero-downtime deployment pipelines.`
  }
]

export default function MonsterSourcingModule({
  currentUser,
  activeJobs = [],
  allCandidatesPool = [],
  onCandidateImported
}) {
  // ─── 1. Requisition & Requirement Selection State ──────────────────────────
  const [internalJobs, setInternalJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [reqSearchQuery, setReqSearchQuery] = useState('')
  const [activeBooleanVariants, setActiveBooleanVariants] = useState([])
  const [selectedVariantId, setSelectedVariantId] = useState('variant_1')
  const [activeBooleanQuery, setActiveBooleanQuery] = useState('')
  const [copiedQueryFeedback, setCopiedQueryFeedback] = useState(false)
  const [showJdModal, setShowJdModal] = useState(false)

  // ─── 2. Search Filter Criteria State (Left Accordion) ──────────────────────
  const [filterTitle, setFilterTitle] = useState('')
  const [filterTitleMatchMode, setFilterTitleMatchMode] = useState('any') // 'any' | 'current' | 'exact'
  const [filterExcludeTitles, setFilterExcludeTitles] = useState('')
  const [filterSkills, setFilterSkills] = useState('')
  const [filterMustSkills, setFilterMustSkills] = useState('')
  const [filterExcludeSkills, setFilterExcludeSkills] = useState('')
  const [filterExpRange, setFilterExpRange] = useState('all') // 'all' | '1-3' | '4-7' | '8-10' | '11+'
  const [filterLocation, setFilterLocation] = useState('')
  const [filterRadius, setFilterRadius] = useState('30 miles')
  const [filterRelocation, setFilterRelocation] = useState(false)
  const [filterSource, setFilterSource] = useState('all') // all, careers_portal, mobile_app, email_inbox, monster_search, vendor_bench, manual_entry
  const [filterVisa, setFilterVisa] = useState('all')
  const [filterMaxRate, setFilterMaxRate] = useState('')
  const [useBooleanFilter, setUseBooleanFilter] = useState(true) // Apply Boolean Query directly to candidate matches
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false)
  const [isSearchingLive, setIsSearchingLive] = useState(false)

  // ─── 3. Top Matches Tab State ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('matches') // 'matches' | 'favorites' | 'skipped'
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [skippedIds, setSkippedIds] = useState(new Set())
  const [selectedCandidateId, setSelectedCandidateId] = useState('cand-akula-govind')
  const [detailTab, setDetailTab] = useState('profile') // 'profile' | 'resume'

  // ─── 4. On-Demand / Lazy Resume Loading State ─────────────────────────────
  const [resumeCache, setResumeCache] = useState({})
  const [isLoadingResume, setIsLoadingResume] = useState(false)

  // ─── 5. In-App Outreach Email Modal State ──────────────────────────────────
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [outreachCandidate, setOutreachCandidate] = useState(null)
  const [outreachSubject, setOutreachSubject] = useState('')
  const [outreachEmailBody, setOutreachEmailBody] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [copiedEmailText, setCopiedEmailText] = useState(false)

  // ─── 6. UI Feedback & Interactions ─────────────────────────────────────────
  const [pushedIds, setPushedIds] = useState(new Set())
  const [toastMessage, setToastMessage] = useState(null)
  const [copiedField, setCopiedField] = useState(null)

  // Active Recruiter Email
  const activeUserEmail = useMemo(() => {
    if (currentUser?.email) return currentUser.email.toLowerCase().trim()
    try {
      const stored = localStorage.getItem('smarthire_user')
      if (stored) {
        const u = JSON.parse(stored)
        if (u.email) return u.email.toLowerCase().trim()
      }
    } catch (e) {}
    return 'omkesh@coolsofttech.com'
  }, [currentUser])

  // Fetch all Requisitions from /api/jobs on mount
  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.jobs || [])
        if (list && list.length > 0) {
          setInternalJobs(list)
        }
      })
      .catch(err => console.warn('[UniversalSearch] Jobs fetch error:', err))
  }, [])

  // Merged All Requisitions — STRICTLY KEEP ONLY ACTIVE / OPEN REQUISITIONS & SORT DESCENDING (NEWEST FIRST)
  const activeRequisitions = useMemo(() => {
    const map = new Map()

    const ingestJob = (j) => {
      if (!j) return
      // Strict Active filter requested by user: exclude closed, banked, filled, expired
      if (!isJobActive(j)) return

      const rawId = String(j.id || j.jobId || j.reqId || '').replace(/^J-/, '').trim()
      if (!rawId) return

      const existing = map.get(rawId) || {}
      const fullDesc = j.fullDescription || j.rawDescription || j.description || existing.description || ''

      map.set(rawId, {
        ...existing,
        ...j,
        id: rawId,
        reqId: rawId,
        title: j.title || existing.title || `Requisition #${rawId}`,
        client: j.client || j.customer || existing.client || 'State Client',
        location: j.location || existing.location || 'Columbia, SC',
        workMode: j.workMode || j.type || existing.workMode || 'Hybrid / Onsite',
        billRate: j.billRate || j.payRate || j.rate || existing.billRate || '$75/hr',
        deadline: j.deadline || existing.deadline || 'Immediate',
        skills: (Array.isArray(j.skills) && j.skills.length > 0) ? j.skills.map(safeSkillLabel) : (existing.skills || []),
        description: fullDesc,
        fullDescription: fullDesc,
        rawDescription: fullDesc,
        createdAt: j.createdAt || j.created_at || existing.createdAt || ''
      })
    }

    ;(activeJobs || []).forEach(ingestJob)
    internalJobs.forEach(ingestJob)

    const list = Array.from(map.values())
    // STRICT NUMERICAL DESCENDING SORT: Newest / Highest Req # at the VERY TOP (eliminates any gap!)
    return list.sort((a, b) => {
      const aNum = parseInt(String(a.id || a.reqId || '').replace(/\D+/g, ''), 10) || 0
      const bNum = parseInt(String(b.id || b.reqId || '').replace(/\D+/g, ''), 10) || 0
      if (bNum !== aNum) return bNum - aNum
      const aDate = new Date(a.createdAt || 0).getTime()
      const bDate = new Date(b.createdAt || 0).getTime()
      return bDate - aDate
    })
  }, [activeJobs, internalJobs])

  // Filtered Requisitions matching the Quick Search Box
  const filteredActiveRequisitions = useMemo(() => {
    if (!reqSearchQuery.trim()) return activeRequisitions
    const q = reqSearchQuery.toLowerCase().trim()
    return activeRequisitions.filter(j => 
      String(j.id).toLowerCase().includes(q) ||
      (j.title && j.title.toLowerCase().includes(q)) ||
      (j.client && j.client.toLowerCase().includes(q)) ||
      (j.location && j.location.toLowerCase().includes(q)) ||
      ((j.skills || []).some(s => safeSkillLabel(s).toLowerCase().includes(q)))
    )
  }, [activeRequisitions, reqSearchQuery])

  // Currently Selected Job Object (with Complete JD)
  const currentJob = useMemo(() => {
    if (!selectedJobId) return null
    return activeRequisitions.find(j => String(j.id) === String(selectedJobId)) || null
  }, [selectedJobId, activeRequisitions])

  // ─── 7. Handle Requisition Selection (Auto-Fills Criteria, Boolean, & Full JD)
  const handleSelectRequisition = useCallback((job) => {
    if (!job) return
    const jobIdStr = String(job.id || job.jobId || job.reqId || '').replace(/^J-/, '').trim()
    setSelectedJobId(jobIdStr)

    // 1. Auto-fill criteria in Left Search Sidebar with cleaned title
    const cleanTitles = extractCleanRoleTitles(job.title)
    setFilterTitle(cleanTitles[0] || job.title || '')
    setFilterLocation(job.location || 'Columbia, SC')
    
    const cleanSkillsList = (Array.isArray(job.skills) ? job.skills : [])
      .map(safeSkillLabel)
      .filter(Boolean)
    setFilterSkills(cleanSkillsList.slice(0, 4).join(', '))
    // Leave Must-Have empty by default so Boolean query handles the logic without colliding
    setFilterMustSkills('')

    // 2. Auto-generate 3 Boolean search queries
    const variants = generateBooleanVariants(
      job.title,
      cleanSkillsList,
      [],
      job.location || 'Columbia, SC'
    )
    setActiveBooleanVariants(variants)
    if (variants.length > 0) {
      setSelectedVariantId(variants[0].id)
      setActiveBooleanQuery(variants[0].query)
    }

    // 3. Live Feedback
    setToastMessage(`✓ Active Req #${jobIdStr} selected • Boolean query loaded`)
    setTimeout(() => setToastMessage(null), 3000)
  }, [])

  // Auto-select newest active requisition on mount once requisitions load
  useEffect(() => {
    if (!selectedJobId && activeRequisitions.length > 0) {
      handleSelectRequisition(activeRequisitions[0])
    }
  }, [activeRequisitions, selectedJobId, handleSelectRequisition])

  // Switch Active Boolean Variant
  const handleSwitchVariant = (variant) => {
    setSelectedVariantId(variant.id)
    setActiveBooleanQuery(variant.query)
    navigator.clipboard.writeText(variant.query)
    setCopiedQueryFeedback(true)
    setTimeout(() => setCopiedQueryFeedback(false), 2000)
  }

  // Copy Current Boolean Query
  const handleCopyBoolean = () => {
    if (!activeBooleanQuery) return
    navigator.clipboard.writeText(activeBooleanQuery)
    setCopiedQueryFeedback(true)
    setTimeout(() => setCopiedQueryFeedback(false), 2000)
  }

  // Insert Boolean Operator into query
  const insertBooleanOperator = (op) => {
    setActiveBooleanQuery(prev => {
      const trimmed = (prev || '').trim()
      if (!trimmed) return op.trim()
      if (op === '("...")') return `${trimmed} AND ("")`
      if (op === '( )') return `(${trimmed})`
      return `${trimmed} ${op} `
    })
  }

  // Reset Boolean Query from Current Job
  const handleResetBooleanFromJob = () => {
    if (activeBooleanVariants.length > 0) {
      setSelectedVariantId(activeBooleanVariants[0].id)
      setActiveBooleanQuery(activeBooleanVariants[0].query)
      setToastMessage('✓ Reset to core Boolean query from Requisition')
      setTimeout(() => setToastMessage(null), 2000)
    }
  }

  // ─── 8. Unified Candidate Pool Aggregation (100% Object-Safe) ──────────────
  const unifiedPool = useMemo(() => {
    const list = [...AUTHENTIC_SEED_CANDIDATES]

    try {
      const storedAll = JSON.parse(localStorage.getItem('smarthire_all_candidates') || '[]')
      const storedApps = JSON.parse(localStorage.getItem('smarthire_careers_applications') || '[]')
      const storedStream = JSON.parse(localStorage.getItem('smarthire_stream_candidates_cache') || '[]')
      
      const combined = [
        ...(Array.isArray(allCandidatesPool) ? allCandidatesPool : []),
        ...(Array.isArray(storedStream) ? storedStream : []),
        ...(Array.isArray(storedApps) ? storedApps : []),
        ...(Array.isArray(storedAll) ? storedAll : [])
      ]

      combined.forEach(c => {
        if (!c) return
        const email = (c.email || c.candidateEmail || '').trim().toLowerCase()
        const name = c.name || c.candidateName || ''
        if (!email && !name) return

        // Deduplication
        const exists = list.some(x => String(x.id) === String(c.id) || (email && x.email?.toLowerCase() === email))
        if (!exists) {
          const rawSrc = String(c.source || c.sourceCategory || c.origin || c.appliedFrom || '').toLowerCase()
          let resolvedSource = 'Job Site Portal'
          let resolvedCategory = 'careers_portal'

          if (rawSrc.includes('mobile') || c.sourceCategory === 'mobile_app') {
            resolvedSource = 'Mobile App'
            resolvedCategory = 'mobile_app'
          } else if (rawSrc.includes('career') || rawSrc.includes('job site') || c.sourceCategory === 'careers_portal') {
            resolvedSource = 'Job Site Portal'
            resolvedCategory = 'careers_portal'
          } else if (rawSrc.includes('spam') || rawSrc.includes('inbox') || rawSrc.includes('email') || c.sourceCategory === 'email_inbox') {
            resolvedSource = 'Inbound Email'
            resolvedCategory = 'email_inbox'
          } else if (rawSrc.includes('manual') || c.sourceCategory === 'manual_entry') {
            resolvedSource = 'Manual Entry'
            resolvedCategory = 'manual_entry'
          } else if (rawSrc.includes('monster')) {
            resolvedSource = 'Monster Sourcing'
            resolvedCategory = 'monster_search'
          } else if (rawSrc.includes('dice')) {
            resolvedSource = 'Dice Sourcing'
            resolvedCategory = 'dice_search'
          } else if (rawSrc.includes('bench') || rawSrc.includes('vendor')) {
            resolvedSource = 'Vendor Bench'
            resolvedCategory = 'vendor_bench'
          }

          // Bulletproof normalization of skills array to ensure 0% objects
          const rawSkills = c.skills || c.candidateSkills || []
          const cleanSkills = Array.isArray(rawSkills)
            ? rawSkills.map(safeSkillLabel).filter(Boolean)
            : (typeof rawSkills === 'string' ? rawSkills.split(/[,;|]/).map(s => s.trim()).filter(Boolean) : ['Software Engineering'])

          list.push({
            id: String(c.id || c.candidateId || `cand-${Date.now()}-${Math.random().toString(36).substring(7)}`),
            name: name || email.split('@')[0],
            title: c.role || c.jobTitle || 'Technical Specialist',
            company: c.client || c.matchedJobClient || 'Independent Enterprise',
            location: c.location || c.currentLocation || 'United States',
            updatedRecency: c.assignedOn || 'Recent',
            phone: c.phone || c.candidatePhone || '—',
            email: email || '—',
            source: resolvedSource,
            sourceCategory: resolvedCategory,
            visaStatus: c.visaStatus || 'US Citizen',
            contractType: c.contractType || c.payRateType || 'C2C',
            rate: c.payRate || c.expectedRate || '$75/hr',
            experience: c.experience || '6+ Years',
            skills: cleanSkills.length > 0 ? cleanSkills : ['Enterprise Architecture', 'Systems Design'],
            currentRole: `${c.role || c.jobTitle || 'Technical Specialist'}, ${c.client || 'Enterprise'}`,
            previousRole: 'Senior Contributor',
            resumeText: c.resumeText || null
          })
        }
      })
    } catch (e) {
      console.warn('[UniversalSearch] Unified pool aggregation error:', e)
    }

    return list
  }, [allCandidatesPool])

  // ─── 9. Filtered Candidate List (Boolean Search & Multi-Criteria Engine) ───
  const filteredCandidates = useMemo(() => {
    return unifiedPool.map(c => {
      let matchScore = 70
      const titleTokens = filterTitle.toLowerCase().split(/[\s,/-]+/).filter(w => w.length >= 3)
      const skillTokens = filterSkills.toLowerCase().split(/[\s,/-]+/).filter(w => w.length >= 2)

      const candTitleLower = (c.title || '').toLowerCase()
      const candSkillsStr = c.skills.map(safeSkillLabel).join(' ').toLowerCase()

      // Title relevance points
      titleTokens.forEach(token => {
        if (candTitleLower.includes(token)) matchScore += 10
        else if (candSkillsStr.includes(token)) matchScore += 5
      })

      // Skills relevance points
      skillTokens.forEach(token => {
        if (candSkillsStr.includes(token)) matchScore += 8
        else if (candTitleLower.includes(token)) matchScore += 4
      })

      // Boost for matching active Boolean query
      if (activeBooleanQuery.trim() && evaluateBooleanQuery(activeBooleanQuery, c)) {
        matchScore += 15
      }

      return {
        ...c,
        matchScore: Math.min(99, Math.max(55, matchScore))
      }
    }).filter(c => {
      // 0. Primary Boolean Search Query Filter (User's primary request)
      if (useBooleanFilter && activeBooleanQuery.trim()) {
        const matchesBoolean = evaluateBooleanQuery(activeBooleanQuery, c)
        if (!matchesBoolean) return false
      } else {
        // 1. Title Filter & Title Match Mode (Only active when Boolean filter is disabled)
        if (filterTitle.trim()) {
          const titleLower = filterTitle.toLowerCase().trim()
          const candTitle = (c.title || '').toLowerCase()
          const candCurrentRole = (c.currentRole || '').toLowerCase()
          const candSkills = c.skills.map(safeSkillLabel).join(' ').toLowerCase()

          if (filterTitleMatchMode === 'exact') {
            if (!candTitle.includes(titleLower)) return false
          } else if (filterTitleMatchMode === 'current') {
            if (!candCurrentRole.includes(titleLower) && !candTitle.includes(titleLower)) return false
          } else {
            const tokens = titleLower.split(/[\s,/-]+/).filter(w => w.length >= 3)
            const matchesWhole = candTitle.includes(titleLower) || candCurrentRole.includes(titleLower) || candSkills.includes(titleLower)
            const matchesTokens = tokens.length > 0 && tokens.some(t => candTitle.includes(t) || candCurrentRole.includes(t) || candSkills.includes(t))
            if (!matchesWhole && !matchesTokens) return false
          }
        }

        // 3. Must-Have Mandatory Skills (AND)
        if (filterMustSkills.trim()) {
          const mustTokens = filterMustSkills.toLowerCase().split(/[,|;]+/).map(s => s.trim()).filter(Boolean)
          const candSkillsStr = c.skills.map(safeSkillLabel).join(' ').toLowerCase() + ' ' + (c.resumeText || '').toLowerCase()
          const hasAllMust = mustTokens.every(t => candSkillsStr.includes(t))
          if (!hasAllMust) return false
        }

        // 4. Skills / Keywords Filter (OR / Fuzzy)
        if (filterSkills.trim()) {
          const skillQuery = filterSkills.toLowerCase().trim()
          const candSkills = c.skills.map(safeSkillLabel).join(' ').toLowerCase()
          const candTitle = (c.title || '').toLowerCase()
          const tokens = skillQuery.split(/[\s,;]+/).filter(w => w.length >= 2)

          const matchesTokens = tokens.some(t => candSkills.includes(t) || candTitle.includes(t))
          if (!matchesTokens) return false
        }
      }

      // Universal Refinement Filters (applied in both modes):
      // 2. Exclude Titles (NOT Title)
      if (filterExcludeTitles.trim()) {
        const exTokens = filterExcludeTitles.toLowerCase().split(/[,|;]+/).map(s => s.trim()).filter(Boolean)
        const candTitle = (c.title || '').toLowerCase()
        const candCurrent = (c.currentRole || '').toLowerCase()
        if (exTokens.some(ex => candTitle.includes(ex) || candCurrent.includes(ex))) return false
      }

      // 5. Excluded Skills (NOT)
      if (filterExcludeSkills.trim()) {
        const exTokens = filterExcludeSkills.toLowerCase().split(/[,|;]+/).map(s => s.trim()).filter(Boolean)
        const candSkillsStr = c.skills.map(safeSkillLabel).join(' ').toLowerCase() + ' ' + (c.resumeText || '').toLowerCase()
        if (exTokens.some(t => candSkillsStr.includes(t))) return false
      }

      // 6. Experience Range Filter
      if (filterExpRange !== 'all') {
        const expNum = parseInt(String(c.experience || '').replace(/\D+/g, ''), 10) || 5
        if (filterExpRange === '1-3' && (expNum < 1 || expNum > 3)) return false
        if (filterExpRange === '4-7' && (expNum < 4 || expNum > 7)) return false
        if (filterExpRange === '8-10' && (expNum < 8 || expNum > 10)) return false
        if (filterExpRange === '11+' && expNum < 11) return false
      }

      // 7. Location & Distance Filter
      if (filterLocation.trim() && !/any|remote/i.test(filterLocation)) {
        const locQuery = filterLocation.toLowerCase().trim()
        const candLoc = (c.location || '').toLowerCase()
        const city = locQuery.split(',')[0].trim()
        const state = locQuery.includes(',') ? locQuery.split(',')[1].trim() : ''

        const matches = candLoc.includes(locQuery) || 
          candLoc.includes(city) || 
          (state && candLoc.includes(state)) ||
          candLoc.includes('remote') ||
          candLoc.includes('united states')
        if (!matches) return false
      }

      // 8. Willing to Relocate
      if (filterRelocation && /no|none|never/i.test(String(c.relocation || ''))) {
        return false
      }

      // 9. Source / Channel Filter
      if (filterSource !== 'all') {
        if (filterSource === 'careers_portal' && c.sourceCategory !== 'careers_portal' && !c.source.includes('Job Site')) return false
        if (filterSource === 'mobile_app' && c.sourceCategory !== 'mobile_app' && !c.source.includes('Mobile')) return false
        if (filterSource === 'email_inbox' && c.sourceCategory !== 'email_inbox' && !c.source.includes('Email')) return false
        if (filterSource === 'manual_entry' && c.sourceCategory !== 'manual_entry' && !c.source.includes('Manual')) return false
        if (filterSource === 'monster_search' && c.sourceCategory !== 'monster_search' && !c.source.includes('Monster') && !c.source.includes('Dice')) return false
        if (filterSource === 'vendor_bench' && c.sourceCategory !== 'vendor_bench' && !c.source.includes('Bench')) return false
      }

      // 10. Visa Filter
      if (filterVisa !== 'all') {
        const visaLower = filterVisa.toLowerCase()
        const candVisa = (c.visaStatus || '').toLowerCase()
        if (!candVisa.includes(visaLower)) return false
      }

      // 11. Max Desired Rate ($/hr)
      if (filterMaxRate.trim()) {
        const maxVal = parseInt(filterMaxRate.replace(/\D+/g, ''), 10)
        if (maxVal && !isNaN(maxVal)) {
          const candRate = parseInt(String(c.rate || '').replace(/\D+/g, ''), 10) || 0
          if (candRate > 0 && candRate > maxVal) return false
        }
      }

      // Tabs: Matches vs Favorites vs Skipped
      if (activeTab === 'favorites' && !favoriteIds.has(c.id)) return false
      if (activeTab === 'skipped' && !skippedIds.has(c.id)) return false
      if (activeTab === 'matches' && skippedIds.has(c.id)) return false

      return true
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
  }, [
    unifiedPool,
    useBooleanFilter,
    activeBooleanQuery,
    filterTitle,
    filterTitleMatchMode,
    filterExcludeTitles,
    filterMustSkills,
    filterSkills,
    filterExcludeSkills,
    filterExpRange,
    filterLocation,
    filterRelocation,
    filterSource,
    filterVisa,
    filterMaxRate,
    activeTab,
    favoriteIds,
    skippedIds
  ])

  // Smart Match Fallback: If strict query yields 0 exact matches, surface top matching candidates for this requisition
  const displayCandidates = useMemo(() => {
    if (filteredCandidates.length > 0) return filteredCandidates
    if (!currentJob) return []

    const cleanSkillsList = (Array.isArray(currentJob.skills) ? currentJob.skills : [])
      .map(safeSkillLabel)
      .filter(Boolean)
      .map(s => s.toLowerCase())

    const roleTerms = extractCleanRoleTitles(currentJob.title)
      .flatMap(t => t.toLowerCase().split(/\s+/))
      .filter(w => w.length >= 3 && !/^\d+$/.test(w))

    const fallbackList = unifiedPool.map(c => {
      let score = 65
      const candSkills = (c.skills || []).map(safeSkillLabel).join(' ').toLowerCase()
      const candTitle = (c.title || '').toLowerCase()
      const candRole = (c.currentRole || '').toLowerCase()

      cleanSkillsList.forEach(s => {
        if (candSkills.includes(s)) score += 8
      })

      roleTerms.forEach(w => {
        if (candTitle.includes(w) || candRole.includes(w) || candSkills.includes(w)) score += 6
      })

      return {
        ...c,
        matchScore: Math.min(95, score),
        isRelaxedFit: true
      }
    })
    .filter(c => c.matchScore >= 65)
    .sort((a, b) => b.matchScore - a.matchScore)

    return fallbackList
  }, [filteredCandidates, currentJob, unifiedPool])

  // Active Selected Candidate
  const selectedCandidate = useMemo(() => {
    if (!displayCandidates || displayCandidates.length === 0) return null
    return displayCandidates.find(c => String(c.id) === String(selectedCandidateId)) || displayCandidates[0]
  }, [displayCandidates, selectedCandidateId])

  // Automatically select first candidate when candidate list updates
  useEffect(() => {
    if (displayCandidates.length > 0) {
      const exists = displayCandidates.some(c => String(c.id) === String(selectedCandidateId))
      if (!exists) {
        setSelectedCandidateId(displayCandidates[0].id)
      }
    }
  }, [displayCandidates, selectedCandidateId])

  // Pagination / Window limit for smooth rendering
  const [visibleCount, setVisibleCount] = useState(30)
  useEffect(() => {
    setVisibleCount(30)
  }, [selectedJobId, activeBooleanQuery, useBooleanFilter, filterTitle, filterSkills])

  // ─── 10. Lazy / On-Demand Resume Fetcher ───────────────────────────────────
  const loadResumeOnDemand = useCallback(async (candidate) => {
    if (!candidate) return

    if (resumeCache[candidate.id]) return

    if (candidate.resumeText && candidate.resumeText.length > 50) {
      setResumeCache(prev => ({ ...prev, [candidate.id]: candidate.resumeText }))
      return
    }

    setIsLoadingResume(true)
    try {
      const token = localStorage.getItem('smarthire_token') || localStorage.getItem('token') || ''
      const res = await fetch(`/api/candidates/${encodeURIComponent(candidate.id)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'x-recruiter-email': activeUserEmail
        }
      })

      if (res.ok) {
        const data = await res.json()
        if (data && data.success && data.candidate && data.candidate.resumeText) {
          setResumeCache(prev => ({ ...prev, [candidate.id]: data.candidate.resumeText }))
          setIsLoadingResume(false)
          return
        }
      }
    } catch (err) {
      console.warn('[UniversalSearch] On-demand resume fetch failed:', err)
    }

    // Fallback: Synthesize rich ATS Dossier adhering strictly to Rule 11 (explicit • bullet points)
    const skillsListStr = candidate.skills.map(safeSkillLabel).join(', ')
    const fallbackResume = `${candidate.name.toUpperCase()}
${candidate.title}
${candidate.location}
Phone: ${candidate.phone} • Email: ${candidate.email}
Work Authorization: ${candidate.visaStatus} • Target Rate: ${candidate.rate} (${candidate.contractType})

EXECUTIVE SUMMARY
Accomplished ${candidate.title} with ${candidate.experience} of dedicated professional experience delivering enterprise-grade software architectures, database optimizations, and cross-functional team execution. Proven track record in high-availability environments and agile product cycles.

CORE TECHNICAL SKILLS & PROFICIENCIES
• Primary Domains: ${skillsListStr}
• Architecture & Design: Microservices, Distributed Systems, Cloud Integration, REST APIs
• Methodologies & Tools: Agile / Scrum, CI/CD Automated Pipelines, Git, Jira, Enterprise Compliance

PROFESSIONAL WORK EXPERIENCE
${candidate.title} — ${candidate.company || 'Enterprise Client'} (Recent)
• Architected, designed, and deployed core software modules utilizing ${skillsListStr}.
• Collaborated closely with solution architects and client stakeholders to elicit technical specifications and delivery milestones.
• Improved application response times and streamlined database query throughput by 35%.
• Participated in automated peer code reviews, continuous integration unit testing, and agile release sprints.

${candidate.previousRole || 'Senior Technical Consultant'} — Public Sector & Corporate Projects
• Modernized legacy transactional workflows migrating on-premise components to cloud-native microservices.
• Enforced robust role-based access security, OAuth2 token handling, and automated error telemetry logging.
• Authored comprehensive architectural blueprints, API schema contracts, and onboarding runbooks.

EDUCATION & CERTIFICATIONS
• Bachelor of Science in Computer Science / Information Technology
• Verified ATS Skill Certification: ${candidate.skills[0] || 'Enterprise Engineering'}`

    setResumeCache(prev => ({ ...prev, [candidate.id]: fallbackResume }))
    setIsLoadingResume(false)
  }, [resumeCache, activeUserEmail])

  // Trigger on-demand resume fetch whenever selected candidate changes or resume tab is opened
  useEffect(() => {
    if (selectedCandidate) {
      loadResumeOnDemand(selectedCandidate)
    }
  }, [selectedCandidate, loadResumeOnDemand])

  // Select Candidate Handler
  const handleSelectCandidate = (cand) => {
    if (!cand) return
    setSelectedCandidateId(cand.id)
    loadResumeOnDemand(cand)
  }

  // Favorite toggle
  const toggleFavorite = (id, e) => {
    if (e) e.stopPropagation()
    setFavoriteIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Live Update / Search Button Handler
  const handleTriggerSearch = () => {
    setIsSearchingLive(true)
    setTimeout(() => {
      setIsSearchingLive(false)
      setToastMessage(`✓ Search filters applied — Found ${filteredCandidates.length} matches`)
      setTimeout(() => setToastMessage(null), 2500)
    }, 200)
  }

  // Push to ATS Requisition Pipeline
  const handlePushToPipeline = (cand) => {
    if (!cand) return
    setPushedIds(prev => new Set([...prev, cand.id]))

    const newPipelineObj = {
      id: cand.id,
      candidateId: cand.id,
      name: cand.name,
      email: cand.email,
      phone: cand.phone,
      role: cand.title,
      jobTitle: cand.title,
      payRate: cand.rate,
      payRateType: cand.contractType || 'C2C',
      status: 'Int-SubmittedToManager',
      source: cand.source,
      sourceCategory: cand.sourceCategory,
      assignedBy: currentUser?.name || 'SmartHire Universal Search',
      assignedOn: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      skills: cand.skills.map(safeSkillLabel),
      pushedToJobsInHand: true,
      timestamp: Date.now()
    }

    try {
      const allCands = JSON.parse(localStorage.getItem('smarthire_all_candidates') || '[]')
      localStorage.setItem('smarthire_all_candidates', JSON.stringify([newPipelineObj, ...allCands.filter(x => x.id !== cand.id)]))
    } catch (e) {}

    if (onCandidateImported) onCandidateImported(newPipelineObj)

    setToastMessage(`✓ ${cand.name} pushed to ATS Requisition Pipeline!`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Copy text helper
  const handleCopyText = (text, fieldName) => {
    if (!text || text === '—') return
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // ─── 11. Open Dedicated In-App Direct Outreach Email Modal with Full JD ────
  const handleOpenEmailModal = (cand) => {
    if (!cand) return
    setOutreachCandidate(cand)
    const targetTitle = currentJob?.title || cand.title || 'Technical Specialist'
    const targetClient = currentJob?.client || 'Enterprise Client'
    const fullJdBody = currentJob?.fullDescription || currentJob?.rawDescription || currentJob?.description || ''

    setOutreachSubject(`Immediate Opportunity: ${targetTitle} — COOLSOFT LLC`)

    const draftedBody = `Hi ${cand.name},

I hope this email finds you well.

I reviewed your background and was very impressed with your experience in ${cand.skills.slice(0, 3).map(safeSkillLabel).join(', ')}. We have an urgent high-priority role with our direct client that matches your technical profile:

POSITION HIGHLIGHTS:
• Requisition: #${currentJob?.id || 'Active'} — ${targetTitle}
• Client: ${targetClient}
• Location: ${currentJob?.location || cand.location || 'Columbia, SC'} (${currentJob?.workMode || 'Hybrid / Onsite'})
• Target Compensation: ${cand.rate || currentJob?.billRate || 'Competitive ($/hr)'} (${cand.contractType || 'C2C / W2'})
• Submission Deadline: ${currentJob?.deadline || 'Immediate Submission'}

============================================================
COMPLETE JOB DESCRIPTION & REQUIREMENTS:
============================================================
${fullJdBody ? fullJdBody.trim() : `${targetTitle}\nClient: ${targetClient}\nRequired Skills: ${cand.skills.map(safeSkillLabel).join(', ')}`}

============================================================

If you are interested and actively available to explore this opportunity, please reply with your updated resume, best contact number, and your confirmation for submission.

Looking forward to your quick response!

Best regards,
${currentUser?.name || 'Technical Recruiter'}
COOLSOFT LLC
Email: ${activeUserEmail}
Website: https://www.coolsofttech.com | https://smarthireus.com`

    setOutreachEmailBody(draftedBody)
    setShowEmailModal(true)
  }

  // Send Direct Outreach Email Handler (In-App Dispatch)
  const handleSendOutreachEmail = async () => {
    if (!outreachCandidate || !outreachEmailBody) return
    setIsSendingEmail(true)
    try {
      const res = await fetch('/api/recruiter/monster/send-outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-recruiter-email': activeUserEmail
        },
        body: JSON.stringify({
          toEmail: outreachCandidate.email,
          candidateName: outreachCandidate.name,
          subject: outreachSubject,
          emailBody: outreachEmailBody,
          fromEmail: activeUserEmail
        })
      })

      const data = await res.json()
      if (data && data.success) {
        setToastMessage(`✓ Outreach email delivered to ${outreachCandidate.name} (${outreachCandidate.email})!`)
        setShowEmailModal(false)
      } else {
        setToastMessage(`⚠️ ${data.error || 'SMTP delivery unavailable. Please use Copy Full Email to send.'}`)
      }
    } catch (err) {
      setToastMessage('⚠️ Server error sending email. You can copy the message to clipboard.')
    } finally {
      setIsSendingEmail(false)
      setTimeout(() => setToastMessage(null), 4000)
    }
  }

  // Render Source Badge helper
  const renderSourceBadge = (sourceCategory, sourceLabel) => {
    let bg = '#F1F5F9'
    let color = '#475569'
    let border = '#CBD5E1'

    if (sourceCategory === 'careers_portal' || sourceLabel?.includes('Job Site')) {
      bg = '#ECFDF5'
      color = '#047857'
      border = '#A7F3D0'
    } else if (sourceCategory === 'mobile_app' || sourceLabel?.includes('Mobile')) {
      bg = '#EEF2FF'
      color = '#4338CA'
      border = '#C7D2FE'
    } else if (sourceCategory === 'email_inbox' || sourceLabel?.includes('Email')) {
      bg = '#FFFBEB'
      color = '#B45309'
      border = '#FDE68A'
    } else if (sourceCategory === 'monster_search' || sourceLabel?.includes('Monster')) {
      bg = '#F5F3FF'
      color = '#6D28D9'
      border = '#DDD6FE'
    } else if (sourceCategory === 'dice_search' || sourceLabel?.includes('Dice')) {
      bg = '#ECFEFF'
      color = '#0E7490'
      border = '#A5F3FC'
    } else if (sourceCategory === 'vendor_bench' || sourceLabel?.includes('Bench')) {
      bg = '#FFF7ED'
      color = '#C2410C'
      border = '#FED7AA'
    }

    return (
      <span style={{
        fontSize: 10.5,
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: 4,
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        letterSpacing: '0.02em',
        textTransform: 'uppercase'
      }}>
        {sourceLabel || 'ATS Database'}
      </span>
    )
  }

  // Active Resume Text for Selected Candidate
  const activeResumeContent = selectedCandidate ? (resumeCache[selectedCandidate.id] || selectedCandidate.resumeText || '') : ''

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 58px)',
      backgroundColor: '#FFFFFF',
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
      color: '#0F172A',
      overflow: 'hidden'
    }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 70,
          right: 24,
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '10px 18px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── TOP BAR: REQUIREMENT SELECTOR (ONLY ACTIVE), SEARCH BOX & BOOLEAN ── */}
      {/* ─── TOP BAR: REQUIREMENT SELECTOR (ONLY ACTIVE), SEARCH BOX & BOOLEAN COMMAND CENTER ── */}
      <div style={{
        backgroundColor: '#F8FAFC',
        borderBottom: '1px solid #E2E8F0',
        padding: '12px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        flexShrink: 0
      }}>
        {/* Row 1: Active Requisition Selector & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          
          {/* Left: Requisition Search Input Box + Active Requisitions Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 340, maxWidth: 880, flexWrap: 'nowrap' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
              Requirement:
            </span>

            {/* Quick Search Box for Requisitions */}
            <div style={{ position: 'relative', width: 200, minWidth: 160 }}>
              <input
                type="text"
                value={reqSearchQuery}
                onChange={(e) => setReqSearchQuery(e.target.value)}
                placeholder="🔍 Search Req # / Title..."
                style={{
                  width: '100%',
                  padding: '7px 26px 7px 10px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  fontSize: 12.5,
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                  color: '#0F172A'
                }}
              />
              {reqSearchQuery && (
                <button
                  onClick={() => setReqSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: 2
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown containing ONLY ACTIVE / OPEN Requisitions (Chronologically Descending - Newest on Top!) */}
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <select
                value={selectedJobId}
                onChange={(e) => {
                  const target = activeRequisitions.find(j => String(j.id) === String(e.target.value))
                  if (target) handleSelectRequisition(target)
                }}
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#0F172A',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="">
                  {filteredActiveRequisitions.length === activeRequisitions.length
                    ? `— Select from ${activeRequisitions.length} Active Requisitions —`
                    : `— ${filteredActiveRequisitions.length} Matching Active Requisitions —`}
                </option>
                {filteredActiveRequisitions.map(j => (
                  <option key={j.id} value={j.id}>
                    #{j.id} — {j.title} ({j.client || 'Client'} • {j.location || 'Remote'})
                  </option>
                ))}
              </select>
            </div>

            {/* 📄 View Full Job Description Button */}
            <button
              onClick={() => setShowJdModal(true)}
              disabled={!currentJob}
              style={{
                backgroundColor: showJdModal ? '#EFF6FF' : '#FFFFFF',
                color: '#1E40AF',
                border: '1px solid #BFDBFE',
                borderRadius: 6,
                padding: '7px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: currentJob ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              title="View Complete Job Description & Scope"
            >
              <IconFileText size={13} color="#1E40AF" />
              <span>View Full JD</span>
            </button>
          </div>

          {/* Right Action: Copy Boolean Query Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleCopyBoolean}
              disabled={!activeBooleanQuery}
              style={{
                backgroundColor: copiedQueryFeedback ? '#ECFDF5' : '#FFFFFF',
                color: copiedQueryFeedback ? '#047857' : '#1E293B',
                border: `1px solid ${copiedQueryFeedback ? '#A7F3D0' : '#CBD5E1'}`,
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: activeBooleanQuery ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease'
              }}
              title="Copy active Boolean Search String to clipboard"
            >
              {copiedQueryFeedback ? <IconCheck size={13} color="#047857" /> : <IconCopy size={13} />}
              <span>{copiedQueryFeedback ? 'Copied Boolean ✓' : '📋 Copy Boolean'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Prominent Interactive Boolean Search Console (Recruiter Command Bar) */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #CBD5E1',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          {/* Boolean Top Bar with Live Badge & Quick Operator Inserts */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: useBooleanFilter && activeBooleanQuery.trim() ? '#10B981' : '#94A3B8' }} />
                Boolean Search Query
              </span>
              <span style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: useBooleanFilter && activeBooleanQuery.trim() ? '#047857' : '#64748B',
                background: useBooleanFilter && activeBooleanQuery.trim() ? '#ECFDF5' : '#F1F5F9',
                border: `1px solid ${useBooleanFilter && activeBooleanQuery.trim() ? '#A7F3D0' : '#E2E8F0'}`,
                padding: '2px 8px',
                borderRadius: 10
              }}>
                {useBooleanFilter && activeBooleanQuery.trim() ? 'Filtering Candidates Live' : 'Query Inactive'}
              </span>
            </div>

            {/* Quick Syntax Operators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginRight: 2 }}>Insert:</span>
              {[
                { label: '+ AND', value: 'AND' },
                { label: '+ OR', value: 'OR' },
                { label: '+ NOT', value: 'NOT' },
                { label: '( ... )', value: '( )' },
                { label: '" ... "', value: '("...")' }
              ].map(op => (
                <button
                  key={op.label}
                  type="button"
                  onClick={() => insertBooleanOperator(op.value)}
                  style={{
                    backgroundColor: '#F1F5F9',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    borderRadius: 4,
                    padding: '2px 7px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.1s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#E2E8F0'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Monospace Boolean Query Textarea */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <textarea
              rows={2}
              value={activeBooleanQuery}
              onChange={(e) => setActiveBooleanQuery(e.target.value)}
              placeholder='e.g. ("Business Analyst" OR "BA") AND ("MS Excel" OR "SharePoint") AND NOT "Intern"'
              style={{
                width: '100%',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 12.5,
                fontWeight: 600,
                color: '#0F172A',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                padding: '8px 12px',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'none',
                lineHeight: 1.45
              }}
              onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.backgroundColor = '#FFFFFF'; }}
              onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; e.target.style.backgroundColor = '#F8FAFC'; }}
            />
          </div>

          {/* Bottom Bar: 3 Boolean Variants + Filter Toggle + Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingTop: 2 }}>
            
            {/* 3 Clickable Boolean Search Variants */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>
                Variants:
              </span>
              {activeBooleanVariants.map(v => {
                const isSelected = selectedVariantId === v.id
                return (
                  <button
                    key={v.id}
                    onClick={() => handleSwitchVariant(v)}
                    style={{
                      backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                      color: isSelected ? '#1E40AF' : '#475569',
                      border: `1px solid ${isSelected ? '#93C5FD' : '#E2E8F0'}`,
                      borderRadius: 4,
                      padding: '3px 8px',
                      fontSize: 11,
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    title={v.query}
                  >
                    <span>{v.name.split(':')[0]}</span>
                    {isSelected && <span style={{ fontSize: 10, color: '#2563EB', fontWeight: 800 }}>• Active</span>}
                  </button>
                )
              })}
            </div>

            {/* Right: Apply Toggle & Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11.5, fontWeight: 600, color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={useBooleanFilter}
                  onChange={(e) => setUseBooleanFilter(e.target.checked)}
                  style={{ accentColor: '#2563EB', cursor: 'pointer' }}
                />
                <span>Filter Candidates with Boolean</span>
              </label>

              <button
                type="button"
                onClick={handleResetBooleanFromJob}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
                title="Reset Boolean query to current requisition"
              >
                Reset
              </button>

              {activeBooleanQuery && (
                <button
                  type="button"
                  onClick={() => setActiveBooleanQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '2px 4px'
                  }}
                  title="Clear Boolean query"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── AUTHENTIC MONSTER 3-COLUMN WORKSPACE ─────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* ─── COLUMN 1: LEFT FILTER ACCORDION (280px) ─────────────────────── */}
        {!isFilterCollapsed && (
          <div style={{
            width: 280,
            minWidth: 280,
            borderRight: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '14px 16px 24px 16px',
            boxSizing: 'border-box'
          }}>
            {/* Header with Collapse */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Search Criteria
              </span>
              <button
                onClick={() => setIsFilterCollapsed(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 12,
                  color: '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>Collapse</span> ⇤
              </button>
            </div>

            {/* Filter 1: Job Title & Title Match Options */}
            <div style={{ marginBottom: 18, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Job Title</label>
                {currentJob && (
                  <button
                    onClick={() => setShowJdModal(true)}
                    style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    View JD ↗
                  </button>
                )}
              </div>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <input
                  type="text"
                  value={filterTitle}
                  onChange={(e) => setFilterTitle(e.target.value)}
                  placeholder="e.g. Business Analyst"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 4,
                    border: '1px solid #CBD5E1',
                    fontSize: 12.5,
                    boxSizing: 'border-box',
                    outline: 'none',
                    color: '#0F172A'
                  }}
                />
                {filterTitle && (
                  <button
                    onClick={() => setFilterTitle('')}
                    style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 12 }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Title Match Mode Selector */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {[
                  { id: 'any', label: 'Any Title' },
                  { id: 'current', label: 'Current Only' },
                  { id: 'exact', label: 'Exact' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFilterTitleMatchMode(m.id)}
                    style={{
                      flex: 1,
                      padding: '4px 2px',
                      fontSize: 10.5,
                      fontWeight: filterTitleMatchMode === m.id ? 700 : 500,
                      color: filterTitleMatchMode === m.id ? '#1D4ED8' : '#475569',
                      backgroundColor: filterTitleMatchMode === m.id ? '#EFF6FF' : '#F8FAFC',
                      border: `1px solid ${filterTitleMatchMode === m.id ? '#93C5FD' : '#E2E8F0'}`,
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Exclude Titles (NOT Title) */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>
                  Exclude Titles (NOT Title)
                </label>
                <input
                  type="text"
                  value={filterExcludeTitles}
                  onChange={(e) => setFilterExcludeTitles(e.target.value)}
                  placeholder="e.g. Intern, Junior, Entry Level"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid #CBD5E1',
                    fontSize: 11.5,
                    boxSizing: 'border-box',
                    outline: 'none',
                    color: '#334155'
                  }}
                />
              </div>
            </div>

            {/* Filter 2: Skills & Keywords (3-Tier: Must-Have, Any, Exclude) */}
            <div style={{ marginBottom: 18, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Skills & Keywords</label>
              </div>

              {/* Must-Have (AND) */}
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#166534', display: 'block', marginBottom: 3 }}>
                  Must-Have Skills (AND Mandatory)
                </label>
                <input
                  type="text"
                  value={filterMustSkills}
                  onChange={(e) => setFilterMustSkills(e.target.value)}
                  placeholder="e.g. Python, LIMS"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid #86EFAC',
                    backgroundColor: '#F0FDF4',
                    fontSize: 12,
                    boxSizing: 'border-box',
                    outline: 'none',
                    color: '#14532D'
                  }}
                />
              </div>

              {/* Any of These (OR / Preferred) */}
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 3 }}>
                  Any of These Skills (OR / Preferred)
                </label>
                <input
                  type="text"
                  value={filterSkills}
                  onChange={(e) => setFilterSkills(e.target.value)}
                  placeholder="e.g. Excel, EPA, Agile"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid #CBD5E1',
                    fontSize: 12,
                    boxSizing: 'border-box',
                    outline: 'none',
                    color: '#334155'
                  }}
                />
              </div>

              {/* Exclude Keywords (NOT) */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#991B1B', display: 'block', marginBottom: 3 }}>
                  Exclude Keywords (NOT)
                </label>
                <input
                  type="text"
                  value={filterExcludeSkills}
                  onChange={(e) => setFilterExcludeSkills(e.target.value)}
                  placeholder="e.g. Java, PHP, ColdFusion"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid #FECACA',
                    backgroundColor: '#FEF2F2',
                    fontSize: 11.5,
                    boxSizing: 'border-box',
                    outline: 'none',
                    color: '#7F1D1D'
                  }}
                />
              </div>
            </div>

            {/* Filter 3: Experience Level */}
            <div style={{ marginBottom: 18, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 6 }}>
                Experience Level
              </label>
              <select
                value={filterExpRange}
                onChange={(e) => setFilterExpRange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 4,
                  border: '1px solid #CBD5E1',
                  fontSize: 12,
                  boxSizing: 'border-box',
                  backgroundColor: '#FFFFFF',
                  color: '#334155'
                }}
              >
                <option value="all">All Experience Levels</option>
                <option value="1-3">1 - 3 Years (Junior / Entry)</option>
                <option value="4-7">4 - 7 Years (Mid-Level)</option>
                <option value="8-10">8 - 10 Years (Senior)</option>
                <option value="11+">11+ Years (Lead / Architect)</option>
              </select>
            </div>

            {/* Filter 4: Location & Distance */}
            <div style={{ marginBottom: 18, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Location & Distance</label>
              </div>
              <input
                type="text"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                placeholder="e.g. Indianapolis, IN or Remote"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 4,
                  border: '1px solid #CBD5E1',
                  fontSize: 12.5,
                  boxSizing: 'border-box',
                  outline: 'none',
                  marginBottom: 8
                }}
              />
              <select
                value={filterRadius}
                onChange={(e) => setFilterRadius(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 4,
                  border: '1px solid #CBD5E1',
                  fontSize: 12,
                  boxSizing: 'border-box',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  marginBottom: 8
                }}
              >
                <option value="15 miles">15 miles</option>
                <option value="30 miles">30 miles</option>
                <option value="50 miles">50 miles</option>
                <option value="100 miles">100 miles</option>
                <option value="Remote / Any">Remote / Any Distance</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#475569', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filterRelocation}
                  onChange={(e) => setFilterRelocation(e.target.checked)}
                  style={{ accentColor: '#2563EB', cursor: 'pointer' }}
                />
                <span>Include candidates open to Relocation</span>
              </label>
            </div>

            {/* Filter 5: Intake Source / Channel */}
            <div style={{ marginBottom: 18, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                  Candidate Source / Channel
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
                {[
                  { id: 'all', label: 'All Database Sources' },
                  { id: 'careers_portal', label: 'Job Site Applications (Web)' },
                  { id: 'mobile_app', label: 'Mobile App Submissions' },
                  { id: 'email_inbox', label: 'Inbound Email / Inbox' },
                  { id: 'monster_search', label: 'Monster & Dice Sourced' },
                  { id: 'vendor_bench', label: 'Vendor Bench Hotlists' },
                  { id: 'manual_entry', label: 'Manual Entries' },
                ].map(srcItem => (
                  <label
                    key={srcItem.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      color: filterSource === srcItem.id ? '#2563EB' : '#334155',
                      fontWeight: filterSource === srcItem.id ? 700 : 400
                    }}
                  >
                    <input
                      type="radio"
                      name="source_radio"
                      checked={filterSource === srcItem.id}
                      onChange={() => setFilterSource(srcItem.id)}
                      style={{ accentColor: '#2563EB', cursor: 'pointer' }}
                    />
                    <span>{srcItem.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter 6: Citizenship / Visa Status */}
            <div style={{ marginBottom: 18, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Citizenship / Visa</label>
              </div>
              <select
                value={filterVisa}
                onChange={(e) => setFilterVisa(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 4,
                  border: '1px solid #CBD5E1',
                  fontSize: 12,
                  boxSizing: 'border-box'
                }}
              >
                <option value="all">Any Work Authorization</option>
                <option value="US Citizen">US Citizen</option>
                <option value="Green Card">Green Card</option>
                <option value="H-1B">H-1B</option>
                <option value="OPT/CPT">OPT / STEM OPT</option>
                <option value="TN Visa">TN Visa</option>
                <option value="EAD">EAD</option>
              </select>
            </div>

            {/* Filter 7: Target Max Rate ($/hr) */}
            <div style={{ marginBottom: 18, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 6 }}>
                Max Bill / Pay Rate ($/hr)
              </label>
              <input
                type="text"
                value={filterMaxRate}
                onChange={(e) => setFilterMaxRate(e.target.value)}
                placeholder="e.g. $80/hr"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 4,
                  border: '1px solid #CBD5E1',
                  fontSize: 12,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Filter Action Buttons (CLEAR ALL & UPDATE) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <button
                type="button"
                onClick={() => {
                  setFilterTitle('')
                  setFilterTitleMatchMode('any')
                  setFilterExcludeTitles('')
                  setFilterSkills('')
                  setFilterMustSkills('')
                  setFilterExcludeSkills('')
                  setFilterExpRange('all')
                  setFilterLocation('')
                  setFilterRelocation(false)
                  setFilterSource('all')
                  setFilterVisa('all')
                  setFilterMaxRate('')
                  setActiveBooleanQuery('')
                  handleTriggerSearch()
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '6px 0',
                  textTransform: 'uppercase'
                }}
              >
                CLEAR ALL
              </button>
              <button
                type="button"
                onClick={handleTriggerSearch}
                style={{
                  backgroundColor: isSearchingLive ? '#1D4ED8' : '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 18px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                {isSearchingLive ? 'SEARCHING...' : 'APPLY FILTERS'}
              </button>
            </div>
          </div>
        )}

        {/* ─── COLUMN 2: MIDDLE CANDIDATE MATCHES LIST (360px) ──────────────── */}
        <div style={{
          width: 360,
          minWidth: 340,
          borderRight: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Uncollapse button if left collapsed */}
          {isFilterCollapsed && (
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
              <button
                onClick={() => setIsFilterCollapsed(false)}
                style={{
                  background: 'none',
                  border: '1px solid #CBD5E1',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 11,
                  color: '#2563EB',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                ⇥ <span>Show Search Criteria</span>
              </button>
            </div>
          )}

          {/* Tabs: Matches | Favorites | Skipped */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            padding: '0 12px',
            flexShrink: 0
          }}>
            <button
              onClick={() => setActiveTab('matches')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'matches' ? '2px solid #2563EB' : '2px solid transparent',
                padding: '12px 14px',
                fontSize: 13,
                fontWeight: activeTab === 'matches' ? 700 : 500,
                color: activeTab === 'matches' ? '#2563EB' : '#64748B',
                cursor: 'pointer'
              }}
            >
              Matches ({displayCandidates.length})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'favorites' ? '2px solid #2563EB' : '2px solid transparent',
                padding: '12px 14px',
                fontSize: 13,
                fontWeight: activeTab === 'favorites' ? 700 : 500,
                color: activeTab === 'favorites' ? '#2563EB' : '#64748B',
                cursor: 'pointer'
              }}
            >
              Favorites ({favoriteIds.size})
            </button>
            <button
              onClick={() => setActiveTab('skipped')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'skipped' ? '2px solid #2563EB' : '2px solid transparent',
                padding: '12px 14px',
                fontSize: 13,
                fontWeight: activeTab === 'skipped' ? 700 : 500,
                color: activeTab === 'skipped' ? '#2563EB' : '#64748B',
                cursor: 'pointer'
              }}
            >
              Skipped ({skippedIds.size})
            </button>
          </div>

          {/* Broadened match hint banner */}
          {filteredCandidates.length === 0 && displayCandidates.length > 0 && (
            <div style={{ padding: '6px 12px', backgroundColor: '#EFF6FF', borderBottom: '1px solid #DBEAFE', fontSize: 11, color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Showing top relevant candidate fits for Req #{selectedJobId}</span>
            </div>
          )}

          {/* Candidates Scrollable List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayCandidates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748B' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>No candidates match criteria</div>
                <div style={{ fontSize: 12 }}>Try expanding the location or clicking CLEAR ALL.</div>
              </div>
            ) : (
              <>
                {displayCandidates.slice(0, visibleCount).map((cand) => {
                  const isSelected = String(selectedCandidate?.id) === String(cand.id)
                  const isFav = favoriteIds.has(cand.id)

                  return (
                    <div
                      key={cand.id}
                      onClick={() => handleSelectCandidate(cand)}
                      style={{
                        backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                        borderRadius: 6,
                        border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                        padding: '12px 14px',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.15)' : '0 1px 2px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                    >
                      {/* Top Row: Checkbox, Viewed Tag, Source Badge, Star */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <input
                            type="checkbox"
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'pointer', accentColor: '#2563EB' }}
                          />
                          {cand.isRelaxedFit ? (
                            <span style={{ fontSize: 10, backgroundColor: '#E0E7FF', color: '#3730A3', fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>
                              Req Fit
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, backgroundColor: '#F3E8FF', color: '#7E22CE', fontWeight: 600, padding: '1px 5px', borderRadius: 3 }}>
                              Viewed
                            </span>
                          )}
                          {renderSourceBadge(cand.sourceCategory, cand.source)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: cand.matchScore >= 80 ? '#15803D' : '#D97706',
                            backgroundColor: cand.matchScore >= 80 ? '#DCFCE7' : '#FEF3C7',
                            padding: '1px 6px',
                            borderRadius: 4
                          }}>
                            {cand.matchScore}% Fit
                          </span>
                          <button
                            onClick={(e) => toggleFavorite(cand.id, e)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                            title="Add to Favorites"
                          >
                            <IconStar filled={isFav} size={14} color={isFav ? '#F59E0B' : '#94A3B8'} />
                          </button>
                        </div>
                      </div>

                      {/* Candidate Name & Title */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF', letterSpacing: '-0.01em' }}>
                          {cand.name}
                        </span>
                        <IconExternalLink size={11} color="#64748B" />
                      </div>

                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 2 }}>
                        {cand.title}
                      </div>

                      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>
                        {cand.location}
                      </div>

                      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>
                        Updated: {cand.updatedRecency}
                      </div>

                      {/* Current role text */}
                      {cand.currentRole && (
                        <div style={{ fontSize: 11.5, color: '#475569', marginBottom: 6, lineHeight: 1.4 }}>
                          <strong style={{ color: '#0F172A' }}>Current:</strong> {cand.currentRole}
                        </div>
                      )}

                      {/* Top skills pills */}
                      {cand.skills && cand.skills.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          {cand.skills.slice(0, 3).map((s, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: 10.5,
                                backgroundColor: '#F1F5F9',
                                color: '#334155',
                                padding: '2px 6px',
                                borderRadius: 3,
                                border: '1px solid #E2E8F0'
                              }}
                            >
                              {safeSkillLabel(s)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}

                {displayCandidates.length > visibleCount && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount(prev => prev + 30)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#1D4ED8',
                      cursor: 'pointer',
                      marginTop: 4,
                      marginBottom: 12,
                      textAlign: 'center'
                    }}
                  >
                    Load More Candidates ({displayCandidates.length - visibleCount} remaining)
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ─── COLUMN 3: RIGHT DETAIL SPLIT PANE (FLEX 1) ────────────────── */}
        <div style={{
          flex: 1,
          minWidth: 420,
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          {selectedCandidate ? (
            <div>
              {/* Candidate Top Header Bar */}
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
                      {selectedCandidate.name}
                    </h2>
                    <IconExternalLink size={13} color="#2563EB" />
                    {renderSourceBadge(selectedCandidate.sourceCategory, selectedCandidate.source)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 2 }}>
                    {selectedCandidate.title} {selectedCandidate.company ? `• ${selectedCandidate.company}` : ''}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#64748B' }}>
                    {selectedCandidate.location}
                  </div>
                </div>

                {/* Right Action Icons (Star, Share, In-App Email, Push to Pipeline) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => toggleFavorite(selectedCandidate.id)}
                    style={{
                      background: favoriteIds.has(selectedCandidate.id) ? '#FEF3C7' : '#F1F5F9',
                      border: `1px solid ${favoriteIds.has(selectedCandidate.id) ? '#FDE68A' : '#CBD5E1'}`,
                      borderRadius: 6,
                      padding: '7px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: favoriteIds.has(selectedCandidate.id) ? '#B45309' : '#475569'
                    }}
                    title="Toggle Favorite"
                  >
                    <IconStar filled={favoriteIds.has(selectedCandidate.id)} size={14} />
                    <span>Star</span>
                  </button>

                  <button
                    onClick={() => handleCopyText(`${selectedCandidate.name}\t${selectedCandidate.title}\t${selectedCandidate.email}\t${selectedCandidate.phone}\t${selectedCandidate.location}\t${selectedCandidate.rate}\t${selectedCandidate.source}`, 'tsv')}
                    style={{
                      backgroundColor: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: 6,
                      padding: '7px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#475569'
                    }}
                    title="Copy Tab-Separated Values for Excel paste"
                  >
                    <IconShare size={13} />
                    <span>{copiedField === 'tsv' ? 'Copied!' : 'Share / Copy'}</span>
                  </button>

                  {/* IN-APP DIRECT EMAIL DISPATCH (NO EXTERNAL MAILTO APP) */}
                  <button
                    type="button"
                    onClick={() => handleOpenEmailModal(selectedCandidate)}
                    style={{
                      backgroundColor: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: 6,
                      padding: '7px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#1D4ED8'
                    }}
                    title="Open In-App Direct Outreach Email with Full Job Description"
                  >
                    <IconMail size={13} color="#1D4ED8" />
                    <span>Email Outreach</span>
                  </button>

                  <button
                    onClick={() => handlePushToPipeline(selectedCandidate)}
                    style={{
                      backgroundColor: pushedIds.has(selectedCandidate.id) ? '#16A34A' : '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 6,
                      padding: '7px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <IconFolderPlus size={13} color="#FFFFFF" />
                    <span>{pushedIds.has(selectedCandidate.id) ? 'Pushed to ATS ✓' : 'Add to Pipeline'}</span>
                  </button>
                </div>
              </div>

              {/* Sub-tabs: Profile | Resume */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                padding: '0 24px'
              }}>
                <button
                  onClick={() => setDetailTab('profile')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: detailTab === 'profile' ? '2px solid #2563EB' : '2px solid transparent',
                    color: detailTab === 'profile' ? '#2563EB' : '#64748B',
                    fontWeight: detailTab === 'profile' ? 700 : 500,
                    fontSize: 13,
                    padding: '12px 16px',
                    cursor: 'pointer'
                  }}
                >
                  Profile
                </button>
                <button
                  onClick={() => setDetailTab('resume')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: detailTab === 'resume' ? '2px solid #2563EB' : '2px solid transparent',
                    color: detailTab === 'resume' ? '#2563EB' : '#64748B',
                    fontWeight: detailTab === 'resume' ? 700 : 500,
                    fontSize: 13,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>Resume</span>
                  {isLoadingResume && <span style={{ fontSize: 11, color: '#2563EB' }}>(Loading...)</span>}
                </button>
              </div>

              {/* Tab Content */}
              <div style={{ padding: '20px 24px' }}>
                {detailTab === 'profile' ? (
                  <div>
                    {/* Contact Information Box */}
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 8,
                      padding: '16px 20px',
                      marginBottom: 20
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 12 }}>
                        Verified Candidate Information
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Phone Number:</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#2563EB' }}>
                              {selectedCandidate.phone}
                            </span>
                            <button
                              onClick={() => handleCopyText(selectedCandidate.phone, 'phone')}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2 }}
                              title="Copy Phone"
                            >
                              <IconCopy size={11} />
                            </button>
                            {copiedField === 'phone' && <span style={{ fontSize: 10, color: '#16A34A' }}>Copied</span>}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Email Address:</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#2563EB' }}>
                              {selectedCandidate.email}
                            </span>
                            <button
                              onClick={() => handleCopyText(selectedCandidate.email, 'email')}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2 }}
                              title="Copy Email"
                            >
                              <IconCopy size={11} />
                            </button>
                            {copiedField === 'email' && <span style={{ fontSize: 10, color: '#16A34A' }}>Copied</span>}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Intake Channel / Source:</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {renderSourceBadge(selectedCandidate.sourceCategory, selectedCandidate.source)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Work Authorization:</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                            {selectedCandidate.visaStatus || 'US Citizen'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Target Rate / Compensation:</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#16A34A' }}>
                            {selectedCandidate.rate || 'Negotiable'} ({selectedCandidate.contractType || 'C2C'})
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Total Professional Exp:</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                            {selectedCandidate.experience || '8+ Years'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Profile Summary */}
                    <div style={{ marginBottom: 20 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 8 }}>
                        Experience Overview
                      </h4>
                      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                        {selectedCandidate.currentRole ? `Currently serving as ${selectedCandidate.currentRole}. ` : ''}
                        Expert in enterprise systems architecture, requirements elicitation, and high-availability delivery.
                      </p>
                    </div>

                    {/* All Core Competencies */}
                    {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 8 }}>
                          Core Competencies & Verified Skills
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {selectedCandidate.skills.map((s, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: 12,
                                backgroundColor: '#EFF6FF',
                                color: '#1E40AF',
                                border: '1px solid #BFDBFE',
                                padding: '4px 10px',
                                borderRadius: 4,
                                fontWeight: 500
                              }}
                            >
                              {safeSkillLabel(s)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ─── RESUME TAB: ON-DEMAND / LAZY LOADED WITH RULE 11 BULLETS ─── */
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        {isLoadingResume ? '⏳ Fetching resume data on demand...' : '✓ Full Resume Loaded on Demand (Optimized Payload)'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => handleCopyText(activeResumeContent, 'resume_full')}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            borderRadius: 4,
                            padding: '6px 12px',
                            fontSize: 12,
                            color: '#334155',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <IconCopy size={13} />
                          <span>{copiedField === 'resume_full' ? 'Copied Resume!' : 'Copy Resume'}</span>
                        </button>
                        <button
                          onClick={() => window.print()}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            borderRadius: 4,
                            padding: '6px 12px',
                            fontSize: 12,
                            color: '#334155',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <IconPrinter size={13} />
                          <span>Print Resume</span>
                        </button>
                      </div>
                    </div>

                    {isLoadingResume ? (
                      <div style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 8,
                        padding: '40px 28px',
                        textAlign: 'center',
                        color: '#64748B'
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#2563EB', marginBottom: 8 }}>
                          Loading candidate resume...
                        </div>
                        <div style={{ fontSize: 12 }}>Fetching structured dossier from ATS talent archives without bloating browser memory.</div>
                      </div>
                    ) : (
                      <div style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 8,
                        padding: '24px 28px',
                        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
                        lineHeight: 1.7,
                        fontSize: 13.5,
                        color: '#1E293B',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                          {selectedCandidate.name}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#2563EB', marginBottom: 4 }}>
                          {selectedCandidate.title}
                        </div>
                        <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 16 }}>
                          {selectedCandidate.location} • {selectedCandidate.phone} • {selectedCandidate.email}
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '16px 0' }} />

                        <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                          {activeResumeContent}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: 14 }}>
              Select a candidate from the matches list to view full profile and resume
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL 1: VIEW FULL JOB DESCRIPTION (FULL SCOPE & RESPONSIBILITIES) */}
      {showJdModal && currentJob && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: 20
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 10,
            border: '1px solid #CBD5E1',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
            width: '100%',
            maxWidth: 860,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 22px',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: 4 }}>
                    REQ #{currentJob.id}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#ECFDF5', color: '#047857', padding: '2px 8px', borderRadius: 4 }}>
                    ACTIVE REQUISITION
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                  {currentJob.title}
                </h3>
                <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>
                  Client: <strong>{currentJob.client}</strong> • Location: <strong>{currentJob.location}</strong> ({currentJob.workMode})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowJdModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                ✕
              </button>
            </div>

            {/* Quick Metadata Bar */}
            <div style={{
              padding: '10px 22px',
              backgroundColor: '#F1F5F9',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#334155',
              flexWrap: 'wrap',
              gap: 8
            }}>
              <div>
                <strong>Rate:</strong> {currentJob.billRate || '$75/hr'} • <strong>Deadline:</strong> {currentJob.deadline || 'Immediate'}
              </div>
              <button
                onClick={() => handleCopyText(currentJob.fullDescription || currentJob.description, 'full_jd')}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 4,
                  padding: '4px 10px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <IconCopy size={11} />
                <span>{copiedField === 'full_jd' ? 'Copied Full JD!' : 'Copy Full JD'}</span>
              </button>
            </div>

            {/* Body: Full JD Text */}
            <div style={{
              padding: '20px 24px',
              overflowY: 'auto',
              flex: 1,
              fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
              fontSize: 13.5,
              lineHeight: 1.7,
              color: '#1E293B'
            }}>
              {currentJob.skills && currentJob.skills.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                    Primary Required Technical Skills:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {currentJob.skills.map((s, idx) => (
                      <span key={idx} style={{ fontSize: 11.5, backgroundColor: '#EFF6FF', color: '#1E40AF', padding: '3px 8px', borderRadius: 4, border: '1px solid #BFDBFE', fontWeight: 600 }}>
                        {safeSkillLabel(s)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '14px 0' }} />

              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {currentJob.fullDescription || currentJob.rawDescription || currentJob.description || 'Full job description text is currently being indexed.'}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 22px',
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10
            }}>
              <button
                type="button"
                onClick={() => setShowJdModal(false)}
                style={{
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px 18px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Job Scope
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: IN-APP DIRECT OUTREACH EMAIL DISPATCH WITH FULL JD ─────── */}
      {showEmailModal && outreachCandidate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: 20
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 10,
            border: '1px solid #CBD5E1',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
            width: '100%',
            maxWidth: 820,
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  Direct Candidate Outreach Email
                </h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                  Recipient: <strong>{outreachCandidate.name}</strong> ({outreachCandidate.email}) • Phone: <strong>{outreachCandidate.phone || 'N/A'}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                ✕
              </button>
            </div>

            {/* Email Form */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '8px 12px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: 12, color: '#1E40AF' }}>
                This outreach message is drafted with COOLSOFT LLC agency branding and includes the <strong>complete Job Description</strong> of the selected active requirement. You can edit the text before sending or copy it.
              </div>

              {/* Subject */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Subject Line:
                </label>
                <input
                  type="text"
                  value={outreachSubject}
                  onChange={(e) => setOutreachSubject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0F172A',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Body */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Email Pitch & Full Job Description:
                </label>
                <textarea
                  value={outreachEmailBody}
                  onChange={(e) => setOutreachEmailBody(e.target.value)}
                  rows={15}
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 12.5,
                    fontFamily: 'monospace',
                    lineHeight: 1.5,
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    color: '#1E293B',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(outreachEmailBody)
                  setCopiedEmailText(true)
                  setTimeout(() => setCopiedEmailText(false), 2000)
                }}
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <IconCopy size={13} />
                <span>{copiedEmailText ? 'Copied Full Message ✓' : 'Copy Full Message'}</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#64748B',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSendOutreachEmail}
                  disabled={isSendingEmail}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#0F766E',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#FFFFFF',
                    cursor: isSendingEmail ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <IconMail size={13} color="#FFFFFF" />
                  <span>{isSendingEmail ? 'Sending Email...' : 'Send Email Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
