import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

// ─── SVG Icons (Enterprise Line Icons, Rule 8 Compliant) ────────────────────
const IconArrowLeft = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)
const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
const IconPrint = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
)
const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)
const IconSignature = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21l3-1 11-11a2.8 2.8 0 0 0-4-4L2 16l-1 4 2 1z"/>
    <path d="M14 6l4 4"/>
    <path d="M3 21c3-1 6-1 8 0"/>
  </svg>
)
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconExternalLink = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)
const IconReset = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
  </svg>
)
const IconUpload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const IconFileText = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

// ─── Extract Actual Candidate Legal Name from Raw Text ──────────────────────
export function extractCandidateRealName(rawName, resumeText) {
  const isGeneric = !rawName || 
    rawName.trim().startsWith('.') || 
    /^(net|\.net|java|\.java|developer|engineer|consultant|hotlist|c2c|resume|specialist|lead)$/i.test(rawName.trim());
  
  if (!isGeneric && rawName.trim().length > 2) {
    return rawName.trim();
  }

  if (!resumeText) return rawName || 'Candidate Full Legal Name';

  const lines = resumeText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const l = lines[i];
    if (
      l.length >= 2 && 
      l.length <= 35 && 
      !l.includes(':') && 
      !l.includes('@') && 
      !/\d/.test(l) &&
      !/(developer|engineer|analyst|architect|consultant|summary|skills|experience|phone|email|authorization|visa)/i.test(l)
    ) {
      return l;
    }
  }
  return rawName || 'Candidate Full Legal Name';
}

// ─── Extract Rich Candidate Metadata from Raw Resume Text ───────────────────
export function extractResumeMetadata(rawText) {
  if (!rawText) return { name: '', role: '', phone: '', email: '', visa: '', location: '', experience: '', education: '', skills: [] };

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let name = '';
  let phone = '';
  let email = '';
  let visa = '';
  let role = '';
  let location = '';
  let experience = '';
  let education = '';

  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const l = lines[i];
    if (!name && l.length >= 2 && l.length <= 35 && !l.includes(':') && !l.includes('@') && !/\d/.test(l) && !/(developer|engineer|consultant|summary|skills|phone|email)/i.test(l)) {
      name = l;
    }
    const phoneMatch = l.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);
    if (phoneMatch && !phone) phone = phoneMatch[0];

    const emailMatch = l.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !email) email = emailMatch[0];

    const visaMatch = l.match(/(H-1B|H1B|US Citizen|Green Card|GC|Permanent Resident|OPT|CPT|TN Visa|EAD)/i);
    if (visaMatch && !visa) {
      visa = visaMatch[0].toUpperCase().includes('H') ? 'H-1B' : visaMatch[0].toUpperCase().includes('CITIZEN') ? 'US Citizen' : visaMatch[0];
    }

    const roleMatch = l.match(/^(Sr\.?|Lead|Principal|Junior)?\s*([A-Za-z0-9.#+/\s]+(Developer|Engineer|Architect|Analyst|Consultant|Manager))/i);
    if (roleMatch && !role) role = roleMatch[0].trim();
  }

  const expMatch = rawText.match(/(?:Over|Around|More than|\+)?\s*(\d{1,2})\+?\s*(?:years|yrs)\s+(?:of\s+)?(?:experience|IT\s+experience)/i);
  if (expMatch) {
    experience = `${expMatch[1]}+ Years`;
  }

  const locMatch = rawText.match(/([A-Z][a-zA-Z\s]{2,15},\s*[A-Z]{2})/);
  if (locMatch) {
    location = locMatch[1].trim();
  }

  const eduMatch = rawText.match(/(Bachelor[^\n\r]+|Master[^\n\r]+|B\.Tech[^\n\r]+|B\.S\.[^\n\r]+|Degree[^\n\r]+)/i);
  if (eduMatch) {
    education = eduMatch[0].trim().replace(/\.$/, '');
  }

  const skills = [];
  const commonTech = ['C#', 'ASP.NET', '.NET Core', 'Java', 'Python', 'React', 'Angular', 'TypeScript', 'JavaScript', 'SQL Server', 'Oracle', 'Azure', 'AWS', 'Docker', 'Kubernetes', 'Microservices', 'REST APIs', 'Git', 'CI/CD'];
  commonTech.forEach(tech => {
    const escaped = tech.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(rawText)) {
      skills.push(tech);
    }
  });

  return { name, role, phone, email, visa, location, experience, education, skills };
}

// ─── Format Candidate Resume Text with Authentic Word Styling & Bullets ────
export function formatStructuredWordResume(resumeText, blindResume = false) {
  if (!resumeText) return '<p><i>No resume experience provided.</i></p>';

  let raw = resumeText;

  // Mask sensitive direct contact info if blind resume is active
  if (blindResume) {
    raw = raw
      .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[Contact details available via CoolSoft LLC]')
      .replace(/\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[Contact details available via CoolSoft LLC]')
      .replace(/linkedin\.com\/in\/[\w.-]+/gi, 'linkedin.com/in/[Agency-Verified-Profile]');
  }

  // Normalize sticky section headers
  raw = raw
    .replace(/([^\n])\s*(Professional Summary|Summary of Qualifications|Summary):/gi, '$1\n$2:')
    .replace(/([^\n])\s*(Technical Skills|Skills & Abilities|Core Competencies):/gi, '$1\n$2:')
    .replace(/([^\n])\s*(Professional Experience|Employment History|Work Experience|Work History):/gi, '$1\n$2:')
    .replace(/([^\n])\s*(Education|Education & Certifications):/gi, '$1\n$2:')
    .replace(/([^\n])\s*(Client:|Project\s*#?\d*:|Role:|Responsibilities:|Environment:)/gi, '$1\n$2:');

  const rawLines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Merge wrapped broken lines
  const mergedLines = [];
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const isHeader = /^(PROFESSIONAL SUMMARY|TECHNICAL SKILLS|EMPLOYMENT HISTORY|PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|WORK HISTORY|EDUCATION|CLIENT:|PROJECT|ROLE:|RESPONSIBILITIES:|ENVIRONMENT:)/i.test(line);
    const startsWithBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');
    const prevLine = mergedLines[mergedLines.length - 1];

    if (prevLine && !isHeader && !startsWithBullet && (!prevLine.endsWith('.') && !prevLine.endsWith(':') && !prevLine.endsWith(';')) && !line.includes(':') && line.length < 90) {
      mergedLines[mergedLines.length - 1] = prevLine + ' ' + line;
    } else {
      mergedLines.push(line);
    }
  }

  let html = '';
  let currentSection = ''; // 'summary', 'skills', 'experience', 'education'
  let inList = false;
  let inResp = false;

  for (let i = 0; i < mergedLines.length; i++) {
    const l = mergedLines[i];

    // Check main section headers
    if (/^(PROFESSIONAL SUMMARY|SUMMARY OF QUALIFICATIONS|SUMMARY):?/i.test(l)) {
      if (inList) { html += '</ul>'; inList = false; }
      currentSection = 'summary';
      inResp = false;
      html += '<p style="margin: 18px 0 6px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; font-weight: bold; text-decoration: underline; color: #000000; text-transform: uppercase;">PROFESSIONAL SUMMARY</p>';
      continue;
    }
    if (/^(TECHNICAL SKILLS|SKILLS & ABILITIES|CORE COMPETENCIES|AREAS OF EXPERTISE):?/i.test(l)) {
      if (inList) { html += '</ul>'; inList = false; }
      currentSection = 'skills';
      inResp = false;
      html += '<p style="margin: 18px 0 6px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; font-weight: bold; text-decoration: underline; color: #000000; text-transform: uppercase;">TECHNICAL SKILLS</p>';
      continue;
    }
    if (/^(PROFESSIONAL EXPERIENCE|EMPLOYMENT HISTORY|WORK EXPERIENCE|WORK HISTORY):?/i.test(l)) {
      if (inList) { html += '</ul>'; inList = false; }
      currentSection = 'experience';
      inResp = false;
      html += '<p style="margin: 20px 0 8px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; font-weight: bold; text-decoration: underline; color: #000000; text-transform: uppercase;">EMPLOYMENT HISTORY</p>';
      continue;
    }
    if (/^(EDUCATION|EDUCATION & CERTIFICATIONS|ACADEMIC BACKGROUND):?/i.test(l)) {
      if (inList) { html += '</ul>'; inList = false; }
      currentSection = 'education';
      inResp = false;
      html += '<p style="margin: 20px 0 6px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; font-weight: bold; text-decoration: underline; color: #000000; text-transform: uppercase;">EDUCATION</p>';
      continue;
    }

    // Skip redundant top lines (e.g. name or phone if before summary)
    if (!currentSection && i < 4 && (/phone|email|authorization|contact/i.test(l) || l.length < 35)) {
      continue;
    }

    // Detect Project Title / Client / Company / Dates
    const isClientLine = /^(Client|Company|Employer):/i.test(l) || 
      /((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–—to]+\s*(Present|Current|Till Date|\d{4}|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})/i.test(l);

    const isProjectNameLine = /^(Project\s*#?\d*):/i.test(l);
    const isRoleLine = /^(Role|Title|Designation|Position):/i.test(l) || (/^(Senior|Sr\.?|Lead|Principal|Junior|Staff)?\s*(Developer|Engineer|Architect|Consultant|Analyst|Programmer)/i.test(l) && l.length < 50);
    const isDescriptionLine = /^(Description|Project Description):/i.test(l);
    const isRespHeader = /^(Responsibilities|Key Responsibilities|Duties|Accomplishments):/i.test(l);
    const isEnvLine = /^(Environment|Technologies|Tools|Tech Stack):/i.test(l);

    if (isClientLine) {
      if (inList) { html += '</ul>'; inList = false; }
      inResp = false;
      html += '<div style="margin-top: 16px; margin-bottom: 6px; padding-top: 8px; border-top: 1px dashed #CBD5E1;">';
      html += '<p style="margin: 0 0 3px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; font-weight: bold; color: #0F172A;">' + l + '</p></div>';
      continue;
    }

    if (isRoleLine) {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<p style="margin: 2px 0 4px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; font-weight: bold; color: #1E293B;">' + (l.startsWith('Role:') ? l : '<b>Role:</b> ' + l) + '</p>';
      continue;
    }

    if (isProjectNameLine) {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<p style="margin: 2px 0 3px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; font-weight: bold; color: #334155;">' + l + '</p>';
      continue;
    }

    if (isDescriptionLine) {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<p style="margin: 2px 0 4px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11px; color: #334155; line-height: 1.5;">' + l + '</p>';
      continue;
    }

    if (isEnvLine) {
      if (inList) { html += '</ul>'; inList = false; }
      inResp = false;
      html += '<p style="margin: 4px 0 8px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11px; font-style: italic; color: #334155;"><b>' + l + '</b></p>';
      continue;
    }

    if (isRespHeader) {
      if (inList) { html += '</ul>'; inList = false; }
      inResp = true;
      html += '<p style="margin: 6px 0 4px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; font-weight: bold; color: #000000;">Responsibilities:</p>';
      continue;
    }

    // Format skills categories with bold label
    if (currentSection === 'skills') {
      if (inList) { html += '</ul>'; inList = false; }
      const colonIdx = l.indexOf(':');
      if (colonIdx > 0 && colonIdx < 35) {
        const cat = l.substring(0, colonIdx);
        const vals = l.substring(colonIdx + 1);
        html += '<p style="margin: 3px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; line-height: 1.5; color: #000000;"><b>' + cat + ':</b>' + vals + '</p>';
      } else {
        html += '<p style="margin: 3px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; line-height: 1.5; color: #000000;">' + l + '</p>';
      }
      continue;
    }

    // Detect bullet points for summary, responsibilities, or lines with bullet symbols/verbs
    const hasBulletSymbol = l.startsWith('•') || l.startsWith('-') || l.startsWith('*');
    const isBulletItem = currentSection === 'summary' || inResp || hasBulletSymbol || currentSection === 'education';

    if (isBulletItem) {
      if (!inList) {
        html += '<ul style="margin: 3px 0 10px 20px; padding: 0; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; line-height: 1.6; color: #000000; list-style-type: disc;">';
        inList = true;
      }
      const cleanText = l.replace(/^[•\-*]\s*/, '');
      html += '<li style="margin-bottom: 5px;">' + cleanText + '</li>';
      continue;
    }

    if (inList) { html += '</ul>'; inList = false; }
    html += '<p style="margin: 3px 0 5px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; line-height: 1.5; color: #000000;">' + l + '</p>';
  }

  if (inList) html += '</ul>';
  return html;
}

// ─── Supported Presentation & E-RTR Templates ──────────────────────────────
export const SUBMITTAL_TEMPLATES = [
  {
    id: 'standard',
    name: 'Standard US Direct Client Format',
    badge: 'Direct Client',
    agencyName: 'CoolSoft LLC',
    mspName: 'Direct Client Account Team',
    contractName: 'Master Professional Services Agreement',
    hasCaiBox: false,
    description: 'Corporate client coversheet with agency letterhead, competencies matrix, and standard RTR.'
  },
  {
    id: 'nc_cai',
    name: 'State of North Carolina (NC VectorVMS / CAI Format)',
    badge: 'NC VectorVMS / CAI',
    agencyName: 'COOLSOFT LLC',
    mspName: 'Computer Aid, Inc. (CAI)',
    contractName: 'North Carolina IT Supplemental Services Contract',
    defaultCaiManager: 'Nicole Walker',
    defaultCaiPhone: '910-520-1506',
    defaultCaiEmail: 'nicole.walker@cai.io',
    hasCaiBox: true,
    description: 'Official North Carolina VectorVMS submittal resume layout & Right to Represent acknowledgement.'
  },
  {
    id: 'georgia_cai',
    name: 'State of Georgia (GDOT / VectorVMS / CAI Format)',
    badge: 'Georgia VectorVMS / CAI',
    agencyName: 'COOLSOFT LLC',
    mspName: 'Computer Aid, Inc. (CAI)',
    contractName: "State of Georgia's IT Staffing Services Contract",
    defaultCaiManager: 'Tim Brodrick',
    defaultCaiPhone: '678-427-3660',
    defaultCaiEmail: 'Timothy.Brodrick@cai.io',
    hasCaiBox: true,
    description: 'Official State of Georgia (GDOT) VectorVMS submittal layout with CAI Contact block, Pay Rate & Employment Type.'
  },
  {
    id: 'texas_dir',
    name: 'State Government / Texas DIR Matrix Format',
    badge: 'Texas DIR',
    agencyName: 'CoolSoft LLC',
    mspName: 'Texas Department of Information Resources',
    contractName: 'DIR Cooperative Contracts Program (DIR-CPO-ITSA-0442)',
    hasCaiBox: false,
    description: 'Texas DIR compliant technical skills matrix, solicitation ID tracking, and exclusivity declaration.'
  },
  {
    id: 'msp_vms',
    name: 'MSP / VMS Matrix (Fieldglass & Beeline)',
    badge: 'Fieldglass / Beeline',
    agencyName: 'CoolSoft LLC',
    mspName: 'Contingent Workforce MSP',
    contractName: 'VMS Contingent Labor Staffing Agreement',
    hasCaiBox: false,
    description: 'Fieldglass & Beeline candidate submittal package with rate breakdown and VMS requisition binding.'
  },
  {
    id: 'prime_vendor',
    name: 'Prime Vendor C2C Presentation',
    badge: 'C2C Prime Partner',
    agencyName: 'CoolSoft LLC',
    mspName: 'Prime Vendor / Implementation Partner',
    contractName: 'Subcontracting Corp-to-Corp Agreement',
    hasCaiBox: false,
    description: 'Prime vendor candidate submittal package with blind resume option and non-poach representation.'
  }
]

export default function SubmittalPackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const urlCandidateId = searchParams.get('candidateId')
  const urlReqId = searchParams.get('reqId') || searchParams.get('jobId')

  // Core Data
  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedCandidateId, setSelectedCandidateId] = useState('')
  const [selectedJobId, setSelectedJobId] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('standard')
  const [activePreviewTab, setActivePreviewTab] = useState('resume') // 'resume', 'rtr', 'all'
  const [blindResume, setBlindResume] = useState(true)

  // Position & Requisition Dynamic Binding State
  const [positionTitle, setPositionTitle] = useState('Senior Full Stack Developer')
  const [vmsNumber, setVmsNumber] = useState('159256')
  const [clientAgency, setClientAgency] = useState('Enterprise Client')
  const [employmentType, setEmploymentType] = useState('C2C')

  // CAI / MSP Contract Manager Configuration State
  const [caiManagerName, setCaiManagerName] = useState('Nicole Walker')
  const [caiManagerPhone, setCaiManagerPhone] = useState('910-520-1506')
  const [caiManagerEmail, setCaiManagerEmail] = useState('nicole.walker@cai.io')

  // Notification Toast State
  const [copyToastText, setCopyToastText] = useState('')

  // Email Submittal Pack Modal
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  // Coversheet Form State
  const [coversheet, setCoversheet] = useState({
    candidateLegalName: '',
    targetRole: '',
    clientName: 'Enterprise Client',
    jobId: '',
    currentLocation: '',
    willingToRelocate: 'Yes (Open to Relocation)',
    visaStatus: 'US Citizen',
    visaExpiry: 'Permanent',
    totalExperience: '8+ Years',
    relevantExperience: '7+ Years',
    proposedRate: '$75.00 / hr C2C',
    highestEducation: 'B.S. in Computer Science',
    noticePeriod: 'Immediate / 2 Weeks',
    interviewAvailability: 'Flexible with 24 Hours Notice (Video)',
    linkedinUrl: 'Verified Profile',
    references: 'Available upon client request',
    skillsMatrix: []
  })

  // Resume Content State
  const [resumeText, setResumeText] = useState('')

  // Resume File Upload & Live Parsing State
  const resumeFileInputRef = useRef(null)
  const [isParsingResume, setIsParsingResume] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pastedResumeText, setPastedResumeText] = useState('')

  // Editable Document Refs & Version Tracker
  const resumeEditorRef = useRef(null)
  const rtrEditorRef = useRef(null)
  const [isLiveEditDirty, setIsLiveEditDirty] = useState(false)

  // Active Template Config
  const activeTemplateMeta = useMemo(() => {
    return SUBMITTAL_TEMPLATES.find(t => t.id === selectedTemplate) || SUBMITTAL_TEMPLATES[0]
  }, [selectedTemplate])

  // Extract clean numerical rate (e.g. "$75.00 / hr C2C" -> "75.00")
  const cleanRateNumber = useMemo(() => {
    const m = String(coversheet.proposedRate || '').match(/[\d]+(?:\.[\d]+)?/)
    return m ? m[0] : '75'
  }, [coversheet.proposedRate])

  // 1. Initial Data Ingestion (Candidates, Jobs, Hotlists)
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [candsRes, jobsRes, hotlistsRes] = await Promise.all([
          fetch('/api/candidates', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}` }
          }).then(r => r.json()).catch(() => ({ candidates: [] })),
          fetch('/api/jobs').then(r => r.json()).catch(() => ({ jobs: [] })),
          fetch('/api/recruiter/vendor-hotlists').then(r => r.json()).catch(() => ({ hotlists: [] }))
        ])

        const candList = candsRes.candidates || []
        const hotlistItems = (hotlistsRes.hotlists || []).map(h => ({
          id: h.id,
          candidate_id: h.id,
          name: h.candidateName,
          role: h.role,
          skills: h.skills,
          experience: h.experience,
          location: h.location,
          visaStatus: h.visa,
          rate: h.rate,
          email: h.candidateEmail,
          phone: h.candidatePhone,
          isVendorHotlist: true,
          vendorCompany: h.vendorCompany
        }))

        // Combine and deduplicate candidates
        const combined = [...candList, ...hotlistItems]
        const seen = new Set()
        const unique = combined.filter(c => {
          const key = (c.id || c.candidate_id || c.email || c.name || '').toLowerCase()
          if (!key || seen.has(key)) return false
          seen.add(key)
          return true
        })

        setCandidates(unique)
        const jobList = jobsRes.jobs || jobsRes.requisitions || []
        setJobs(jobList)

        // Pre-select via URL parameters or defaults
        if (urlCandidateId) {
          setSelectedCandidateId(urlCandidateId)
        } else if (unique.length > 0) {
          setSelectedCandidateId(unique[0].id || unique[0].candidate_id)
        }

        if (urlReqId) {
          const matchJob = jobList.find(j => String(j.id) === String(urlReqId) || String(j.id).replace(/^J-/, '') === String(urlReqId))
          if (matchJob) setSelectedJobId(matchJob.id)
          else setSelectedJobId(urlReqId)
        } else if (jobList.length > 0) {
          setSelectedJobId(jobList[0].id)
        }
      } catch (err) {
        console.error('Failed to load submittal pack data:', err)
      }
    }
    loadInitialData()
  }, [urlCandidateId, urlReqId])

  // 2. Dynamic Position & Requisition Binding when Target Job Changes
  useEffect(() => {
    if (!selectedJobId) return
    const job = jobs.find(j => String(j.id) === String(selectedJobId) || String(j.id).replace(/^J-/, '') === String(selectedJobId))
    if (!job) return

    // Extract title & VMS number (e.g. from "Epic Orders Analyst (812797)" or "Mainframe Developer (66393)")
    const titleStr = job.title || 'Senior Consultant'
    const vmsMatch = titleStr.match(/\(([\d]{4,7})\)/)
    const extractedNum = vmsMatch ? vmsMatch[1] : String(job.id).replace(/^J-/, '')
    const cleanRole = titleStr.replace(/\([\d]+\)/g, '').trim()
    const agency = job.client || 'Enterprise Client'

    setPositionTitle(cleanRole)
    setVmsNumber(extractedNum)
    setClientAgency(agency)

    // Intelligently auto-match state template if appropriate
    const lowerCombined = (titleStr + ' ' + agency).toLowerCase()
    if (lowerCombined.includes('nc') || lowerCombined.includes('north carolina') || lowerCombined.includes('ncdhhs') || lowerCombined.includes('dhhs')) {
      setSelectedTemplate('nc_cai')
      setCaiManagerName('Nicole Walker')
      setCaiManagerPhone('910-520-1506')
      setCaiManagerEmail('nicole.walker@cai.io')
    } else if (lowerCombined.includes('georgia') || lowerCombined.includes('gdot')) {
      setSelectedTemplate('georgia_cai')
      setCaiManagerName('Tim Brodrick')
      setCaiManagerPhone('678-427-3660')
      setCaiManagerEmail('Timothy.Brodrick@cai.io')
    } else if (lowerCombined.includes('texas') || lowerCombined.includes('dir')) {
      setSelectedTemplate('texas_dir')
    }
    setIsLiveEditDirty(false)
  }, [selectedJobId, jobs])

  // 3. Update CAI defaults when user manually switches template
  const handleTemplateChange = (tplId) => {
    setSelectedTemplate(tplId)
    if (tplId === 'nc_cai') {
      setCaiManagerName('Nicole Walker')
      setCaiManagerPhone('910-520-1506')
      setCaiManagerEmail('nicole.walker@cai.io')
    } else if (tplId === 'georgia_cai') {
      setCaiManagerName('Tim Brodrick')
      setCaiManagerPhone('678-427-3660')
      setCaiManagerEmail('Timothy.Brodrick@cai.io')
    }
    setIsLiveEditDirty(false)
  }

  // ─── Direct Candidate Resume Upload & Parsing Handlers ───────────────────
  const handleResumeFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsParsingResume(true)
    setUploadedFileName(file.name)
    try {
      let extractedText = ''
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'txt' || ext === 'rtf') {
        extractedText = await file.text()
      } else {
        const formData = new FormData()
        formData.append('resume', file)
        const res = await fetch('/api/parse-resume', {
          method: 'POST',
          body: formData
        })
        const data = await res.json()
        if (data.success && data.text) {
          extractedText = data.text
        } else {
          throw new Error(data.message || 'Failed to extract resume text')
        }
      }
      processUploadedResumeText(extractedText, file.name)
    } catch (err) {
      console.error('Resume upload error:', err)
      alert('Error uploading or parsing resume: ' + err.message)
    } finally {
      setIsParsingResume(false)
      if (e.target) e.target.value = ''
    }
  }

  const processUploadedResumeText = (rawText, sourceFileName = '') => {
    if (!rawText || !rawText.trim()) return
    const detected = extractResumeMetadata(rawText)
    const candName = detected.name || sourceFileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') || 'Candidate Full Legal Name'
    const candRole = detected.role || positionTitle || 'Senior Specialist'
    const candVisa = detected.visa || 'H-1B'
    const candExp = detected.experience || '7+ Years'
    const candEdu = detected.education || 'Bachelor of Science in Computer Science'
    const candLoc = detected.location || 'Remote / US'
    const candPhone = detected.phone || ''
    const candEmail = detected.email || ''

    const newCand = {
      id: `cand-upload-${Date.now()}`,
      name: candName,
      role: candRole,
      phone: candPhone,
      email: candEmail,
      location: candLoc,
      visaStatus: candVisa,
      experience: candExp,
      education: candEdu,
      skills: detected.skills.length > 0 ? detected.skills : ['Java', 'SQL', 'Cloud', 'Microservices'],
      resumeText: rawText,
      isUploaded: true
    }

    setCandidates(prev => [newCand, ...prev.filter(c => c.id !== newCand.id)])
    setSelectedCandidateId(newCand.id)
    setResumeText(rawText)
    setCoversheet(prev => ({
      ...prev,
      candidateLegalName: candName,
      targetRole: positionTitle || candRole,
      currentLocation: candLoc,
      visaStatus: candVisa,
      totalExperience: candExp,
      highestEducation: candEdu,
      relevantExperience: `${parseInt(candExp) > 2 ? parseInt(candExp) - 1 : candExp}+ Years`
    }))
    setIsLiveEditDirty(false)
    showToast(`Resume for ${candName} parsed & loaded!`)
    setShowPasteModal(false)
    setPastedResumeText('')
  }

  // 4. Auto-populate Candidate Data into Coversheet and Resume
  useEffect(() => {
    if (!selectedCandidateId) return
    const cand = candidates.find(c => c.id === selectedCandidateId || c.candidate_id === selectedCandidateId)
    const job = jobs.find(j => String(j.id) === String(selectedJobId) || String(j.id).replace(/^J-/, '') === String(selectedJobId))

    if (cand) {
      const rawRes = cand.resumeText || cand.summary || ''
      const realLegalName = extractCandidateRealName(cand.name, rawRes)
      const detected = extractResumeMetadata(rawRes)

      const exp = cand.experience || detected.experience || '7+ Years'
      const candSkills = Array.isArray(cand.skills)
        ? cand.skills
        : (detected.skills.length > 0 ? detected.skills : String(cand.skills || '').split(/[,|•]+/).map(s => s.trim()).filter(Boolean))
      const jobSkills = job
        ? (Array.isArray(job.skills) ? job.skills : String(job.skills || '').split(',').map(s => s.trim()))
        : (candSkills.slice(0, 5).length > 0 ? candSkills.slice(0, 5) : ['Java', 'SQL', 'Cloud', 'Microservices', 'REST APIs'])

      const matrix = jobSkills.slice(0, 6).map(sk => {
        const has = candSkills.some(cs => cs.toLowerCase().includes(sk.toLowerCase()) || sk.toLowerCase().includes(cs.toLowerCase()))
        return {
          skill: sk,
          requiredExp: '5+ Years',
          candidateExp: has ? `${Math.min(parseInt(exp) || 7, 7)}+ Years` : '3+ Years',
          rating: has ? 'Expert (9/10)' : 'Proficient (7/10)'
        }
      })

      const rawRate = cand.rate || job?.rate || '$75.00 / hr C2C'
      const matchedEmp = String(rawRate).toUpperCase().includes('W2')
        ? 'W2'
        : String(rawRate).toUpperCase().includes('1099')
          ? '1099'
          : 'C2C'
      setEmploymentType(matchedEmp)

      const finalVisa = cand.visaStatus || cand.visa || detected.visa || 'H-1B'
      const finalEdu = cand.education || detected.education || 'Bachelor of Science in Computer Science'
      const finalLoc = cand.location || detected.location || 'Remote / US'

      setCoversheet(prev => ({
        ...prev,
        candidateLegalName: realLegalName,
        targetRole: positionTitle || cand.role || detected.role || 'Senior Specialist',
        clientName: clientAgency || job?.client || 'Enterprise Client',
        jobId: vmsNumber || String(job?.id || '').replace(/^J-/, '') || '159256',
        currentLocation: finalLoc,
        willingToRelocate: 'Yes (Open to Relocation)',
        visaStatus: finalVisa,
        visaExpiry: (finalVisa === 'US Citizen' || finalVisa === 'Green Card') ? 'Permanent' : 'Valid & Active',
        totalExperience: exp,
        relevantExperience: `${parseInt(exp) > 2 ? parseInt(exp) - 1 : exp}+ Years`,
        proposedRate: rawRate,
        highestEducation: finalEdu,
        noticePeriod: 'Immediate / 2 Weeks',
        interviewAvailability: 'Flexible with 24 Hours Notice (Video)',
        linkedinUrl: cand.linkedinUrl || 'Represented Exclusively via CoolSoft LLC',
        references: 'Available upon client request',
        skillsMatrix: matrix
      }))

      if (rawRes) {
        setResumeText(rawRes)
      } else {
        setResumeText(`PROFESSIONAL SUMMARY
Accomplished ${cand.role || positionTitle} with ${exp} of hands-on expertise building and scaling enterprise distributed systems.

CORE COMPETENCIES
${candSkills.length > 0 ? candSkills.join(' • ') : 'Java • SQL • Cloud • REST APIs • Microservices'}

PROFESSIONAL WORK HISTORY
• Spearheaded high-volume production microservices architecture with high availability
• Designed RESTful and gRPC API gateways ensuring sub-second response times
• Collaborated closely with cross-functional product, cloud, and QA squads

EDUCATION & CERTIFICATIONS
• ${finalEdu}`)
      }
      setIsLiveEditDirty(false)
    }
  }, [selectedCandidateId, selectedJobId, candidates, jobs, positionTitle, vmsNumber, clientAgency])

  // Synchronize coversheet fields when recruiter directly edits position/vmsNumber
  useEffect(() => {
    setCoversheet(prev => ({
      ...prev,
      targetRole: positionTitle,
      jobId: vmsNumber,
      clientName: clientAgency
    }))
  }, [positionTitle, vmsNumber, clientAgency])

  // ─── Format Candidate Resume Text with Structured Headers & Authentic Bullets ────
  const formattedResumeBodyHtml = useMemo(() => {
    return formatStructuredWordResume(resumeText, blindResume)
  }, [resumeText, blindResume])

  // ─── Generate Authentic Word-Formatted Resume HTML ────────────────────────
  const generatedResumeTemplateHtml = useMemo(() => {
    const candidateName = coversheet.candidateLegalName || 'Candidate Full Legal Name'

    if (activeTemplateMeta.hasCaiBox) {
      const isNc = selectedTemplate === 'nc_cai'
      return `
        <!-- CAI Contact Box (Word 12px Verdana, exactly matching Doc template) -->
        <p style="margin: 12px 0 3px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; font-weight: bold; ${isNc ? 'text-decoration: underline;' : ''} color: #000000;">
          CAI CONTACT
        </p>
        <p style="margin: 2px 0 10px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; line-height: 1.5; color: #000000;">
          &lt;Insert name and contact information for the CAI Contract Manager listed on the VectorVMS requirement. For ease of reference, the Contract Managers’ contact information appears below.&gt;
        </p>
        <p style="margin: 8px 0 2px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; font-weight: bold; color: #000000;">
          ${caiManagerName}
        </p>
        <p style="margin: 2px 0 2px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; color: #000000;">
          Phone: ${caiManagerPhone}
        </p>
        <p style="margin: 2px 0 14px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; color: #000000;">
          Email: <a href="mailto:${caiManagerEmail}" style="color: #0000EE; text-decoration: underline;">${caiManagerEmail}</a>
        </p>

        <!-- Candidate Name (Bold, Underline, 13px Verdana) -->
        <p style="margin: 18px 0 4px 0; font-family: Verdana, Geneva, sans-serif; font-size: 13px; font-weight: bold; text-decoration: underline; color: #000000; text-transform: uppercase;">
          ${candidateName}
        </p>
        <p style="margin: 2px 0 18px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; color: #334155;">
          ${positionTitle} • Req #${vmsNumber} (${clientAgency}) • Represented via COOLSOFT LLC
        </p>

        <!-- Structured Resume Body (Summary, Skills, Experience with Project Titles & Bullets, Education) -->
        <div style="font-family: Verdana, Geneva, sans-serif; font-size: 12px; line-height: 1.6; color: #000000;">
          ${formattedResumeBodyHtml}
        </div>
      `
    }

    // Default Standard Direct Client Presentation Format
    return `
      <!-- Standard Corporate Letterhead -->
      <div style="border-bottom: 2px solid #0F172A; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="font-family: Verdana, Geneva, sans-serif; font-size: 20px; font-weight: bold; color: #0F172A; margin: 0 0 4px;">
              ${candidateName}
            </h1>
            <div style="font-family: Verdana, Geneva, sans-serif; font-size: 13.5px; font-weight: bold; color: #2563EB;">
              ${positionTitle}
            </div>
          </div>
          <div style="text-align: right; font-family: Verdana, Geneva, sans-serif;">
            <div style="font-size: 13.5px; font-weight: bold; color: #0F172A;">${activeTemplateMeta.agencyName}</div>
            <div style="font-size: 11px; color: #64748B;">SmartHire Authorized Presentation</div>
            <div style="font-size: 11px; color: #64748B;">Req #${vmsNumber} • ${clientAgency}</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; color: #475569; margin-top: 8px; flex-wrap: wrap;">
          <span>Location: ${coversheet.currentLocation}</span>
          <span>•</span>
          <span>Visa: ${coversheet.visaStatus}</span>
          <span>•</span>
          <span>Experience: ${coversheet.totalExperience}</span>
          <span>•</span>
          <span style="color: #059669; font-weight: bold;">Represented exclusively via ${activeTemplateMeta.agencyName}</span>
        </div>
      </div>

      <div style="font-family: Verdana, Geneva, sans-serif; font-size: 12px; line-height: 1.6; color: #000000;">
        ${formattedResumeBodyHtml}
      </div>
    `
  }, [activeTemplateMeta, selectedTemplate, caiManagerName, caiManagerPhone, caiManagerEmail, coversheet, positionTitle, vmsNumber, clientAgency, formattedResumeBodyHtml])

  // ─── Generate Authentic Word-Formatted E-RTR HTML ─────────────────────────
  const generatedRtrTemplateHtml = useMemo(() => {
    const candidateName = coversheet.candidateLegalName || 'Candidate Full Legal Name'
    const reqInfo = `${positionTitle || 'Specialist'} (${vmsNumber || 'Req'})`
    const client = clientAgency || 'Client Agency'

    if (selectedTemplate === 'nc_cai') {
      return `
        <!-- RED HEADER 1: Subject instruction (Verdana 12px, bold, underline, #FF0000) -->
        <p style="margin: 0 0 8px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; line-height: 17px; font-weight: bold; text-decoration: underline; color: #FF0000;">
          INSERT THE FOLLOWING INTO EMAIL SUBJECT AND UPDATE
        </p>

        <!-- Subject Line -->
        <p style="margin: 0 0 16px 0; font-family: Verdana, Geneva, sans-serif; font-size: 13.5px; font-weight: bold; color: #000000;">
          ${reqInfo}
        </p>

        <!-- RED HEADER 2: Body instruction (Verdana 12px, bold, underline, #FF0000) -->
        <p style="margin: 0 0 10px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; line-height: 17px; font-weight: bold; text-decoration: underline; color: #FF0000;">
          COPY, PASTE AND UPDATE THE FOLLOWING IN EMAIL BODY
        </p>

        <!-- Centered RTR Title (Verdana 10px/11px, bold, underline) -->
        <p style="margin: 0 0 14px 0; text-align: center; font-family: Verdana, Geneva, sans-serif; font-size: 11px; line-height: 17px; font-weight: bold; text-decoration: underline; color: #000000;">
          Right to Represent Acknowledgement
        </p>

        <!-- Body Paragraph 1 (Verdana 10.5px/11px, justified) -->
        <p style="margin: 0 0 12px 0; text-align: justify; font-family: Verdana, Geneva, sans-serif; font-size: 11px; line-height: 1.6; color: #000000;">
          By signing below, I acknowledge and agree that <b>[COOLSOFT LLC]</b> has the sole right to represent me in matters of work assignment relating the North Carolina IT Supplemental Services Contract by submitting my professional resume to the Contract’s Managed Service Provider, Computer Aid, Inc. for the requirement identified below.
        </p>

        <!-- Body Paragraph 2 (Verdana 10.5px/11px, justified) -->
        <p style="margin: 0 0 14px 0; text-align: justify; font-family: Verdana, Geneva, sans-serif; font-size: 11px; line-height: 1.6; color: #000000;">
          I also acknowledge and verify that all the information contained in my resume related to my technical credentials is accurate and is based on educational training and professional experience obtained throughout my career.
        </p>

        <!-- Req number & Title label -->
        <p style="margin: 0 0 2px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11px; line-height: 14px; font-weight: bold; color: #000000;">
          VectorVMS Requirement Number and Title (including Name of Agency):
        </p>
        <p style="margin: 0 0 14px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; font-weight: bold; color: #000000;">
          ${reqInfo} - ${client}
        </p>

        <!-- Candidate Full Legal Name label & Yellow Highlight Field -->
        <p style="margin: 0 0 2px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11px; line-height: 14px; font-weight: bold; color: #000000;">
          Candidate Full Legal Name:
        </p>
        <p style="margin: 0 0 18px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; line-height: 16px;">
          <span style="background-color: #FFFF00; font-weight: bold; padding: 2px 8px; border-bottom: 1px solid #000000;">
            ${candidateName}
          </span>
        </p>

        <!-- Red Instructions 3: Email template to candidate -->
        <p style="margin: 0 0 8px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; line-height: 17px; font-weight: bold; text-decoration: underline; color: #FF0000;">
          EMAIL TEMPLATE TO CANDIDATE
        </p>
        <p style="margin: 0 0 10px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; line-height: 17px; font-weight: bold; text-decoration: underline; color: #FF0000;">
          ONCE CANDIDATE RESPONDS VIA EMAIL AGREEING WITH YOUR REPRESENTATION, SAVE ENTIRE EMAIL THREAD AS A PDF DOC AND UPLOAD IN CANDIDATE’S VECTORVMS PROFILE
        </p>
      `
    }

    if (selectedTemplate === 'georgia_cai') {
      return `
        <!-- RED HEADER 1: Subject instruction (Verdana 12px, bold, underline, #FF0000) -->
        <p style="margin: 0 0 8px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; line-height: 17px; font-weight: bold; text-decoration: underline; color: #FF0000;">
          INSERT THE FOLLOWING INTO EMAIL SUBJECT AND UPDATE
        </p>

        <!-- Subject Line -->
        <p style="margin: 0 0 16px 0; font-family: Verdana, Geneva, sans-serif; font-size: 13.5px; font-weight: bold; color: #000000;">
          ${reqInfo}
        </p>

        <!-- RED HEADER 2: Body instruction (Verdana 12px, bold, underline, #FF0000) -->
        <p style="margin: 0 0 10px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; line-height: 17px; font-weight: bold; text-decoration: underline; color: #FF0000;">
          COPY, PASTE AND UPDATE THE FOLLOWING IN EMAIL BODY
        </p>

        <!-- Centered RTR Title (Verdana 10px/11px, bold, underline) -->
        <p style="margin: 0 0 14px 0; text-align: center; font-family: Verdana, Geneva, sans-serif; font-size: 11px; line-height: 17px; font-weight: bold; text-decoration: underline; color: #000000;">
          Right to Represent Acknowledgement
        </p>

        <!-- Body Paragraph 1 (Verdana 10.5px/11px, justified) -->
        <p style="margin: 0 0 12px 0; text-align: justify; font-family: Verdana, Geneva, sans-serif; font-size: 11px; line-height: 1.6; color: #000000;">
          By inserting my full legal name below, I acknowledge and agree that <b>[COOLSOFT LLC]</b> has the sole right to represent me in matters of work assignment relating to the State of Georgia’s IT Staffing Services Contract by submitting my professional resume to the Contract’s Managed Service Provider, Computer Aid, Inc. for the requirement identified below.
        </p>

        <!-- Body Paragraph 2 (Verdana 10.5px/11px, justified) -->
        <p style="margin: 0 0 14px 0; text-align: justify; font-family: Verdana, Geneva, sans-serif; font-size: 11px; line-height: 1.6; color: #000000;">
          I also acknowledge and verify that all the information contained in my resume related to my technical credentials is accurate and is based on educational training and professional experience obtained throughout my career.
        </p>

        <!-- Req number & Title label -->
        <p style="margin: 0 0 2px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11px; line-height: 14px; font-weight: bold; color: #000000;">
          VectorVMS Requirement Number and Title (including Name of Agency):
        </p>
        <p style="margin: 0 0 14px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; font-weight: bold; color: #000000;">
          ${reqInfo} - ${client}
        </p>

        <!-- Candidate Full Legal Name label & Yellow Highlight Field -->
        <p style="margin: 0 0 2px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11px; line-height: 14px; font-weight: bold; color: #000000;">
          Candidate Full Legal Name:
        </p>
        <p style="margin: 0 0 14px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; line-height: 16px;">
          <span style="background-color: #FFFF00; font-weight: bold; padding: 2px 8px; border-bottom: 1px solid #000000;">
            ${candidateName}
          </span>
        </p>

        <!-- Candidate Pay Rate label & Yellow Highlight Field -->
        <p style="margin: 0 0 2px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11px; line-height: 14px; font-weight: bold; color: #000000;">
          Candidate Pay Rate for this Position (as Referenced in VectorVMS Requirement):
        </p>
        <p style="margin: 0 0 14px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; font-weight: bold; color: #000000;">
          $<span style="background-color: #FFFF00; font-weight: bold; padding: 2px 6px;">${cleanRateNumber}</span>/hour
        </p>

        <!-- Candidate Employment Type label & Yellow Highlight Field -->
        <p style="margin: 0 0 2px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11px; line-height: 14px; font-weight: bold; color: #000000;">
          Candidate Employment Type if Selected for Engagement (W2, 1099, C2C):
        </p>
        <p style="margin: 0 0 18px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; font-weight: bold; color: #000000;">
          (W2, 1099, C2C): <span style="background-color: #FFFF00; font-weight: bold; padding: 2px 8px;">${employmentType}</span>
        </p>

        <!-- Red Instructions 3: Email template to candidate -->
        <p style="margin: 0 0 8px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; line-height: 17px; font-weight: bold; text-decoration: underline; color: #FF0000;">
          EMAIL TEMPLATE TO CANDIDATE
        </p>
        <p style="margin: 0 0 10px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; line-height: 17px; font-weight: bold; text-decoration: underline; color: #FF0000;">
          ONCE CANDIDATE RESPONDS VIA EMAIL AGREEING WITH YOUR REPRESENTATION, SAVE ENTIRE EMAIL THREAD AS A PDF DOC AND UPLOAD IN CANDIDATE’S VECTORVMS PROFILE
        </p>
      `
    }

    if (selectedTemplate === 'texas_dir') {
      return `
        <p style="margin: 0 0 6px 0; font-family: Verdana, Geneva, sans-serif; font-size: 13px; font-weight: bold; color: #0F172A;">
          State of Texas Department of Information Resources (DIR)
        </p>
        <p style="margin: 0 0 14px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; color: #475569;">
          Contract Representation & Exclusivity Agreement • DIR-CPO-ITSA-0442
        </p>
        <p style="margin: 0 0 10px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11px; line-height: 1.6; color: #000000;">
          1. <b>Scope of Representation</b>: The undersigned candidate hereby grants COOLSOFT LLC the exclusive authorization to submit credentials, resume, and rate proposal for active requisition #${vmsNumber} (${positionTitle}) issued under the Texas DIR Cooperative Contracts Program.
        </p>
        <p style="margin: 0 0 10px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11px; line-height: 1.6; color: #000000;">
          2. <b>Candidate Acknowledgment</b>: Candidate acknowledges that only one submittal per candidate is permitted by the State of Texas for each Solicitation ID. Dual representation will lead to immediate disqualification.
        </p>
        <p style="margin: 0 0 14px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11px; line-height: 1.6; color: #000000;">
          3. <b>Agreed Rate & Term</b>: Agreed Hourly Submittal Rate: <span style="background-color: #FFFF00; font-weight: bold; padding: 2px 6px;">$${cleanRateNumber}/hr (${employmentType})</span>. Exclusivity Window: 60 Days from signature date.
        </p>
        <p style="margin: 0 0 4px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11px; font-weight: bold; color: #000000;">Candidate Full Legal Name:</p>
        <p style="margin: 0 0 16px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px;"><span style="background-color: #FFFF00; font-weight: bold; padding: 2px 6px;">${candidateName}</span></p>
      `
    }

    // Default Standard Direct Client RTR
    return `
      <div style="border-bottom: 2px solid #0F172A; padding-bottom: 10px; margin-bottom: 14px;">
        <h3 style="font-family: Verdana, Geneva, sans-serif; font-size: 15px; font-weight: bold; color: #0F172A; margin: 0 0 4px;">
          Exclusive Right to Represent & Authorization Agreement (RTR)
        </h3>
        <div style="font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; color: #64748B;">
          CoolSoft LLC Staff Augmentation Services • Requisition #${vmsNumber} (${clientAgency})
        </div>
      </div>
      <p style="margin: 0 0 12px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; line-height: 1.6; color: #000000;">
        I, <span style="background-color: #FFFF00; font-weight: bold; padding: 2px 6px;">${candidateName}</span>, hereby grant COOLSOFT LLC the exclusive authorization to represent and submit my candidate credentials for the <b>${positionTitle}</b> requirement (Req #${vmsNumber}) with <b>${clientAgency}</b>.
      </p>
      <p style="margin: 0 0 12px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; line-height: 1.6; color: #000000;">
        I confirm that I am legally authorized to work in the United States (${coversheet.visaStatus}) and have not authorized any other staffing agency or vendor to submit my resume for this engagement.
      </p>
      <p style="margin: 0 0 14px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; line-height: 1.6; color: #000000;">
        <b>Agreed Pay Rate:</b> <span style="background-color: #FFFF00; font-weight: bold; padding: 2px 6px;">$${cleanRateNumber}/hour (${employmentType})</span><br>
        <b>Notice Period:</b> ${coversheet.noticePeriod}<br>
        <b>Representation Term:</b> 60 Calendar Days
      </p>
      <p style="margin: 0 0 4px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11px; font-weight: bold; color: #000000;">Candidate Signature Verification:</p>
      <p style="margin: 0 0 16px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px;"><span style="background-color: #FFFF00; font-weight: bold; padding: 2px 6px;">${candidateName}</span></p>
    `
  }, [selectedTemplate, positionTitle, vmsNumber, clientAgency, coversheet, cleanRateNumber, employmentType])

  // Synchronize HTML into the live contentEditable DOM elements
  useEffect(() => {
    if (!isLiveEditDirty) {
      if (resumeEditorRef.current) {
        resumeEditorRef.current.innerHTML = generatedResumeTemplateHtml
      }
      if (rtrEditorRef.current) {
        rtrEditorRef.current.innerHTML = generatedRtrTemplateHtml
      }
    }
  }, [generatedResumeTemplateHtml, generatedRtrTemplateHtml, isLiveEditDirty])

  // Reset edited document back to default generated template
  const handleResetToTemplate = () => {
    setIsLiveEditDirty(false)
    if (resumeEditorRef.current) {
      resumeEditorRef.current.innerHTML = generatedResumeTemplateHtml
    }
    if (rtrEditorRef.current) {
      rtrEditorRef.current.innerHTML = generatedRtrTemplateHtml
    }
    showToast('Reset to original template!')
  }

  // Formatting actions for live editing
  const execCmd = (cmd, val = null) => {
    document.execCommand(cmd, false, val)
    setIsLiveEditDirty(true)
  }

  const handleInsertProjectHeader = () => {
    const snippet = `
      <div style="margin-top: 16px; margin-bottom: 6px; padding-top: 8px; border-top: 1px dashed #CBD5E1;">
        <p style="margin: 0 0 3px 0; font-family: Verdana, Geneva, sans-serif; font-size: 12px; font-weight: bold; color: #0F172A;">
          Client: [Company / Client Name] — [City, State] <span style="float: right; font-weight: bold;">[Jan 2022 – Present]</span>
        </p>
        <p style="margin: 2px 0 4px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; font-weight: bold; color: #1E293B;">
          Role: [Job Title]
        </p>
        <p style="margin: 6px 0 4px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; font-weight: bold; color: #000000;">
          Responsibilities:
        </p>
        <ul style="margin: 3px 0 10px 20px; padding: 0; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; line-height: 1.6; color: #000000; list-style-type: disc;">
          <li style="margin-bottom: 5px;">• [Key accomplishment or responsibility]</li>
        </ul>
        <p style="margin: 4px 0 8px 0; font-family: Verdana, Geneva, sans-serif; font-size: 11px; font-style: italic; color: #334155;">
          <b>Environment:</b> [Technologies and tools used]
        </p>
      </div>
    `
    document.execCommand('insertHTML', false, snippet)
    setIsLiveEditDirty(true)
  }

  // ─── Coversheet Text Generator (Plain-text for ATS / Portals) ──────────────
  const formattedCoversheetText = useMemo(() => {
    return `=====================================================
CANDIDATE SUBMISSION COVERSHEET — ${coversheet.clientName.toUpperCase()}
REQUISITION: #${coversheet.jobId} - ${coversheet.targetRole}
AGENCY: CoolSoft LLC / SmartHire Recruiting Partner
PRESENTATION FORMAT: ${activeTemplateMeta.name}
=====================================================

Candidate Full Legal Name:  ${coversheet.candidateLegalName}
Target Position:            ${coversheet.targetRole}
Client Requisition ID:      #${coversheet.jobId} (${coversheet.clientName})
Current Location:           ${coversheet.currentLocation}
Relocation Preference:      ${coversheet.willingToRelocate}
Work Authorization / Visa:  ${coversheet.visaStatus} (Expiry: ${coversheet.visaExpiry})
Total Professional Exp:     ${coversheet.totalExperience}
Relevant Technology Exp:    ${coversheet.relevantExperience}
Proposed Billing / Pay Rate: ${coversheet.proposedRate} (${employmentType})
Highest Education / Degree: ${coversheet.highestEducation}
Availability / Notice:      ${coversheet.noticePeriod}
Interview Availability:     ${coversheet.interviewAvailability}
Representation Status:      Exclusive via CoolSoft LLC

${activeTemplateMeta.hasCaiBox ? `-----------------------------------------------------
MSP / CAI CONTRACT MANAGER DETAILS:
Name:  ${caiManagerName}
Phone: ${caiManagerPhone}
Email: ${caiManagerEmail}
Contract: ${activeTemplateMeta.contractName}` : ''}

-----------------------------------------------------
TECHNICAL COMPETENCY & SKILLS MATRIX:
-----------------------------------------------------
${coversheet.skillsMatrix.map(sm => `• ${sm.skill.padEnd(24)} | Req: ${sm.requiredExp.padEnd(10)} | Candidate: ${sm.candidateExp.padEnd(10)} | ${sm.rating}`).join('\n')}

-----------------------------------------------------
PROFESSIONAL REFERENCES:
-----------------------------------------------------
${coversheet.references}
=====================================================`
  }, [coversheet, employmentType, activeTemplateMeta, caiManagerName, caiManagerPhone, caiManagerEmail])

  // ─── 1-Click Clipboard Actions ───────────────────────────────────────────
  const showToast = (msg) => {
    setCopyToastText(msg)
    setTimeout(() => setCopyToastText(''), 2600)
  }

  const handleCopyCoversheet = () => {
    navigator.clipboard.writeText(formattedCoversheetText)
    showToast('Coversheet copied to clipboard!')
  }

  const handleCopyRtr = () => {
    const rawRtrText = rtrEditorRef.current ? rtrEditorRef.current.innerText : ''
    const subjectLine = `${positionTitle} (${vmsNumber})`
    navigator.clipboard.writeText(`SUBJECT: ${subjectLine}\n\n${rawRtrText}`)
    showToast('E-RTR Subject & Body copied!')
  }

  const handleCopyCurrentView = () => {
    if (activePreviewTab === 'rtr') {
      handleCopyRtr()
    } else if (activePreviewTab === 'all') {
      const resumeHtml = resumeEditorRef.current ? resumeEditorRef.current.innerText : ''
      const rtrText = rtrEditorRef.current ? rtrEditorRef.current.innerText : ''
      const combined = `${formattedCoversheetText}\n\n=====================================================\nSUBMITTAL RESUME\n=====================================================\n\n${resumeHtml}\n\n=====================================================\nRIGHT TO REPRESENT (E-RTR)\n=====================================================\n\n${rtrText}`
      navigator.clipboard.writeText(combined)
      showToast('Complete Submittal Pack copied!')
    } else {
      const resumeTextRaw = resumeEditorRef.current ? resumeEditorRef.current.innerText : ''
      navigator.clipboard.writeText(`${formattedCoversheetText}\n\n${resumeTextRaw}`)
      showToast('Resume & Coversheet copied!')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // ─── Email Modal Handler ──────────────────────────────────────────────────
  const handleOpenEmailModal = () => {
    const cand = candidates.find(c => c.id === selectedCandidateId)
    setEmailTo(cand?.recruiterEmail || 'account-manager@coolsofttech.com')
    setEmailSubject(`Candidate Submittal: ${coversheet.candidateLegalName} — ${positionTitle} (Req #${vmsNumber} - ${clientAgency})`)
    setEmailBody(`Hi Team,\n\nPlease find attached the submittal package and presentation coversheet for ${coversheet.candidateLegalName} for the ${positionTitle} opening with ${clientAgency}.\n\nCandidate is confirmed at ${coversheet.proposedRate} (${employmentType}) with ${coversheet.visaStatus} work authorization and is available on ${coversheet.noticePeriod}.\n\nBest regards,\nSmartHire Submissions Team\nCoolSoft LLC`)
    setShowEmailModal(true)
  }

  const handleSendEmail = async (e) => {
    e.preventDefault()
    setIsSendingEmail(true)
    try {
      const rtrText = rtrEditorRef.current ? rtrEditorRef.current.innerText : ''
      const resumeTextCurrent = resumeEditorRef.current ? resumeEditorRef.current.innerText : ''
      const payloadMessage = `${emailBody}\n\n${formattedCoversheetText}\n\n=====================================================\nSUBMITTAL RESUME\n=====================================================\n${resumeTextCurrent}\n\n=====================================================\nE-RTR ACKNOWLEDGEMENT\n=====================================================\n${rtrText}`
      const res = await fetch('/api/recruiter/send-direct-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          message: payloadMessage
        })
      })
      const data = await res.json()
      if (data.success) {
        showToast('Submittal pack successfully emailed!')
        setShowEmailModal(false)
      } else {
        alert(data.message || 'Failed to dispatch email')
      }
    } catch (err) {
      alert('Error sending submittal email: ' + err.message)
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div style={styles.pageWrap}>
      {/* ─── Top Navbar ──────────────────────────────────────────────────── */}
      <header style={styles.topNav} className="no-print">
        <div style={styles.navLeft}>
          <button onClick={() => navigate('/inbox')} style={styles.backBtn} title="Back to Recruiter Inbox">
            <IconArrowLeft /> <span>Back to Inbox</span>
          </button>
          <div style={{ height: 18, width: 1, backgroundColor: '#CBD5E1' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
                Submittal Pack & Coversheet Generator
              </h2>
              <span style={styles.badgeEnterprise}>
                {activeTemplateMeta.badge}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: 1 }}>
              Official Client Presentation Engine • VectorVMS & Direct Client Certified
            </div>
          </div>
        </div>

        <div style={styles.navRight}>
          {copyToastText && (
            <div style={styles.toastChip}>
              <IconCheck /> <span>{copyToastText}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopyCurrentView}
            style={styles.actionBtnSecondary}
            title="Copy current active view to clipboard"
          >
            <IconCopy /> <span>Copy {activePreviewTab === 'rtr' ? 'E-RTR' : activePreviewTab === 'all' ? 'Pack' : 'Coversheet'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyRtr}
            style={styles.actionBtnSecondary}
            title="Copy Right to Represent email subject and body for candidate"
          >
            <IconSignature /> <span>Copy RTR Email</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={styles.actionBtnSecondary}
            title="Export clean PDF submittal package"
          >
            <IconPrint /> <span>Print / Save PDF</span>
          </button>

          <button
            type="button"
            onClick={handleOpenEmailModal}
            style={styles.actionBtnPrimary}
            title="Send submittal directly to client or account manager"
          >
            <IconMail /> <span>Email Submittal Pack</span>
          </button>
        </div>
      </header>

      {/* ─── Control Selector Bar ────────────────────────────────────────── */}
      <div style={styles.selectorBar} className="no-print">
        <div style={styles.selectorInner}>
          {/* 1. Candidate Selector */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>SELECT CANDIDATE:</label>
            <select
              value={selectedCandidateId}
              onChange={e => setSelectedCandidateId(e.target.value)}
              style={styles.selectInput}
            >
              {candidates.map(c => {
                const displayName = extractCandidateRealName(c.name, c.resumeText)
                return (
                  <option key={c.id || c.candidate_id} value={c.id || c.candidate_id}>
                    {c.isUploaded ? '📁 [Uploaded] ' : ''}{displayName} — {c.role || 'Specialist'} {c.phone ? `Phone: ${c.phone}` : ''} {c.isVendorHotlist ? `(Bench: ${c.vendorCompany})` : ''}
                  </option>
                )
              })}
            </select>
          </div>

          {/* 2. Target Job Selector */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>TARGET JOB REQUISITION:</label>
            <select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              style={styles.selectInput}
            >
              {jobs.map(j => {
                const titleStr = j.title || 'Requisition'
                const vmsMatch = titleStr.match(/\(([\d]{4,7})\)/)
                const num = vmsMatch ? vmsMatch[1] : String(j.id).replace(/^J-/, '')
                return (
                  <option key={j.id} value={j.id}>
                    #{num}: {titleStr} ({j.client || 'Client'})
                  </option>
                )
              })}
            </select>
          </div>

          {/* 3. Submittal Presentation Template Selector */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>PRESENTATION TEMPLATE:</label>
            <select
              value={selectedTemplate}
              onChange={e => handleTemplateChange(e.target.value)}
              style={{ ...styles.selectInput, fontWeight: '700', color: '#1D4ED8' }}
            >
              {SUBMITTAL_TEMPLATES.map(tpl => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Blind Resume Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 18 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>
              <input
                type="checkbox"
                checked={blindResume}
                onChange={e => setBlindResume(e.target.checked)}
                style={{ cursor: 'pointer', width: 15, height: 15, accentColor: '#2563EB' }}
              />
              Blind Resume (Mask Direct Phone/Email)
            </label>
          </div>
        </div>
      </div>

      {/* ─── Main Workspace: Left Column Coversheet Form, Right Column Presentation ─── */}
      <div style={styles.workspace}>
        {/* LEFT COLUMN: EDITABLE POSITION & COVERSHEET FORM */}
        <div style={styles.coversheetCol} className="no-print">
          <div style={styles.colHeader}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Client Submission Coversheet
              </h3>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: 2 }}>
                Dynamic Position Parameters & Live Form
              </div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', background: '#EFF6FF', padding: '3px 8px', borderRadius: 6, border: '1px solid #BFDBFE' }}>
              Editable Live
            </span>
          </div>

          {/* 0. Upload Candidate Resume Card */}
          <div style={styles.uploadCard}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Upload Candidate Resume</span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#047857', background: '#ECFDF5', padding: '2px 6px', borderRadius: 4, border: '1px solid #A7F3D0' }}>
                DOCX • PDF • TXT
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 10px 0', lineHeight: 1.4 }}>
              Upload candidate resume to auto-extract details, format projects & bullets, and prepare submittal pack.
            </p>
            
            <input
              type="file"
              ref={resumeFileInputRef}
              style={{ display: 'none' }}
              accept=".docx,.doc,.pdf,.txt,.rtf"
              onChange={handleResumeFileUpload}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => resumeFileInputRef.current?.click()}
                disabled={isParsingResume}
                style={styles.uploadBtnPrimary}
              >
                <IconUpload /> <span>{isParsingResume ? 'Parsing...' : 'Upload File'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPasteModal(true)}
                style={styles.uploadBtnSecondary}
              >
                <IconFileText /> <span>Paste Resume</span>
              </button>
            </div>

            {uploadedFileName && (
              <div style={{ marginTop: 8, padding: '5px 8px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, fontSize: '11px', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                  ✓ <b>{uploadedFileName}</b>
                </span>
                <button
                  type="button"
                  onClick={() => setUploadedFileName('')}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '12px' }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Position Binding Section */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionCardTitle}>
              Position & Requisition Binding
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Target Position / Job Title *</label>
                <input
                  type="text"
                  value={positionTitle}
                  onChange={e => {
                    setPositionTitle(e.target.value)
                    setIsLiveEditDirty(false)
                  }}
                  style={{ ...styles.textInput, fontWeight: '700', color: '#1E293B' }}
                  placeholder="e.g. Epic Orders Analyst"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={styles.formGroup}>
                  <label style={styles.inputLabel}>Requisition / VMS # *</label>
                  <input
                    type="text"
                    value={vmsNumber}
                    onChange={e => {
                      setVmsNumber(e.target.value)
                      setIsLiveEditDirty(false)
                    }}
                    style={{ ...styles.textInput, fontWeight: '800', color: '#2563EB' }}
                    placeholder="e.g. 812797"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.inputLabel}>Client / State Agency *</label>
                  <input
                    type="text"
                    value={clientAgency}
                    onChange={e => {
                      setClientAgency(e.target.value)
                      setIsLiveEditDirty(false)
                    }}
                    style={styles.textInput}
                    placeholder="e.g. NCDHHS-AM or GDOT"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={styles.formGroup}>
                  <label style={styles.inputLabel}>Proposed Rate ($/hr) *</label>
                  <input
                    type="text"
                    value={coversheet.proposedRate}
                    onChange={e => {
                      setCoversheet({ ...coversheet, proposedRate: e.target.value })
                      setIsLiveEditDirty(false)
                    }}
                    style={{ ...styles.textInput, fontWeight: '700' }}
                    placeholder="e.g. $75.00 / hr"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.inputLabel}>Employment Type (W2/1099/C2C)</label>
                  <select
                    value={employmentType}
                    onChange={e => {
                      setEmploymentType(e.target.value)
                      setIsLiveEditDirty(false)
                    }}
                    style={styles.selectInput}
                  >
                    <option value="C2C">Corp-to-Corp (C2C)</option>
                    <option value="W2">W2 Hourly</option>
                    <option value="1099">1099 Independent</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* MSP / CAI Contract Manager Details (Shown for NC & Georgia Templates) */}
          {activeTemplateMeta.hasCaiBox && (
            <div style={{ ...styles.sectionCard, borderLeft: '3.5px solid #2563EB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={styles.sectionCardTitle}>
                  CAI Contract Manager (VectorVMS Requirement)
                </div>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#059669', background: '#ECFDF5', padding: '2px 6px', borderRadius: 4 }}>
                  Auto-Populated
                </span>
              </div>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.inputLabel}>Manager Name</label>
                  <input
                    type="text"
                    value={caiManagerName}
                    onChange={e => {
                      setCaiManagerName(e.target.value)
                      setIsLiveEditDirty(false)
                    }}
                    style={styles.textInput}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={styles.formGroup}>
                    <label style={styles.inputLabel}>Phone</label>
                    <input
                      type="text"
                      value={caiManagerPhone}
                      onChange={e => {
                        setCaiManagerPhone(e.target.value)
                        setIsLiveEditDirty(false)
                      }}
                      style={styles.textInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.inputLabel}>Email</label>
                    <input
                      type="email"
                      value={caiManagerEmail}
                      onChange={e => {
                        setCaiManagerEmail(e.target.value)
                        setIsLiveEditDirty(false)
                      }}
                      style={styles.textInput}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Candidate Legal & Background Details */}
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Candidate Full Legal Name *</label>
              <input
                type="text"
                value={coversheet.candidateLegalName}
                onChange={e => {
                  setCoversheet({ ...coversheet, candidateLegalName: e.target.value })
                  setIsLiveEditDirty(false)
                }}
                style={{ ...styles.textInput, fontWeight: '700' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Current Location (City, State)</label>
                <input
                  type="text"
                  value={coversheet.currentLocation}
                  onChange={e => setCoversheet({ ...coversheet, currentLocation: e.target.value })}
                  style={styles.textInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Relocation Preference</label>
                <select
                  value={coversheet.willingToRelocate}
                  onChange={e => setCoversheet({ ...coversheet, willingToRelocate: e.target.value })}
                  style={styles.selectInput}
                >
                  <option value="Yes (Open to Relocation)">Yes (Open to Relocation)</option>
                  <option value="No (Local Only)">No (Local Only)</option>
                  <option value="100% Remote Eligible">100% Remote Eligible</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Work Authorization / Visa</label>
                <input
                  type="text"
                  value={coversheet.visaStatus}
                  onChange={e => setCoversheet({ ...coversheet, visaStatus: e.target.value })}
                  style={styles.textInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Visa Expiration Date</label>
                <input
                  type="text"
                  value={coversheet.visaExpiry}
                  onChange={e => setCoversheet({ ...coversheet, visaExpiry: e.target.value })}
                  style={styles.textInput}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Total Experience</label>
                <input
                  type="text"
                  value={coversheet.totalExperience}
                  onChange={e => setCoversheet({ ...coversheet, totalExperience: e.target.value })}
                  style={styles.textInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Relevant Experience</label>
                <input
                  type="text"
                  value={coversheet.relevantExperience}
                  onChange={e => setCoversheet({ ...coversheet, relevantExperience: e.target.value })}
                  style={styles.textInput}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Highest Education / University</label>
              <input
                type="text"
                value={coversheet.highestEducation}
                onChange={e => setCoversheet({ ...coversheet, highestEducation: e.target.value })}
                style={styles.textInput}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Notice Period</label>
                <input
                  type="text"
                  value={coversheet.noticePeriod}
                  onChange={e => setCoversheet({ ...coversheet, noticePeriod: e.target.value })}
                  style={styles.textInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Interview Availability</label>
                <input
                  type="text"
                  value={coversheet.interviewAvailability}
                  onChange={e => setCoversheet({ ...coversheet, interviewAvailability: e.target.value })}
                  style={styles.textInput}
                />
              </div>
            </div>
          </div>

          {/* Technical Skills Matrix Editor */}
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Required Technical Skills Matrix
              </div>
              <button
                type="button"
                onClick={() => setCoversheet({
                  ...coversheet,
                  skillsMatrix: [...coversheet.skillsMatrix, { skill: 'New Skill', requiredExp: '5+ Years', candidateExp: '5+ Years', rating: 'Expert (9/10)' }]
                })}
                style={styles.smallAddBtn}
              >
                + Add Skill
              </button>
            </div>
            <table style={styles.matrixTable}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={styles.matrixTh}>Skill / Requirement</th>
                  <th style={styles.matrixTh}>Req. Years</th>
                  <th style={styles.matrixTh}>Candidate Exp</th>
                  <th style={styles.matrixTh}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {coversheet.skillsMatrix.map((sm, sIdx) => (
                  <tr key={sIdx}>
                    <td style={styles.matrixTd}>
                      <input
                        type="text"
                        value={sm.skill}
                        onChange={e => {
                          const updated = [...coversheet.skillsMatrix]
                          updated[sIdx].skill = e.target.value
                          setCoversheet({ ...coversheet, skillsMatrix: updated })
                        }}
                        style={styles.matrixInput}
                      />
                    </td>
                    <td style={styles.matrixTd}>
                      <input
                        type="text"
                        value={sm.requiredExp}
                        onChange={e => {
                          const updated = [...coversheet.skillsMatrix]
                          updated[sIdx].requiredExp = e.target.value
                          setCoversheet({ ...coversheet, skillsMatrix: updated })
                        }}
                        style={styles.matrixInput}
                      />
                    </td>
                    <td style={styles.matrixTd}>
                      <input
                        type="text"
                        value={sm.candidateExp}
                        onChange={e => {
                          const updated = [...coversheet.skillsMatrix]
                          updated[sIdx].candidateExp = e.target.value
                          setCoversheet({ ...coversheet, skillsMatrix: updated })
                        }}
                        style={styles.matrixInput}
                      />
                    </td>
                    <td style={styles.matrixTd}>
                      <input
                        type="text"
                        value={sm.rating}
                        onChange={e => {
                          const updated = [...coversheet.skillsMatrix]
                          updated[sIdx].rating = e.target.value
                          setCoversheet({ ...coversheet, skillsMatrix: updated })
                        }}
                        style={styles.matrixInput}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: PRESENTATION PREVIEW WITH AUTHENTIC WORD FORMATTING & LIVE EDITING */}
        <div style={styles.resumeCol}>
          {/* View Tab Switcher Header */}
          <div style={styles.previewTabHeader} className="no-print">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => setActivePreviewTab('resume')}
                style={{
                  ...styles.tabBtn,
                  ...(activePreviewTab === 'resume' ? styles.tabBtnActive : {})
                }}
              >
                Client-Ready Resume Preview
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('rtr')}
                style={{
                  ...styles.tabBtn,
                  ...(activePreviewTab === 'rtr' ? styles.tabBtnActive : {})
                }}
              >
                Electronic Right to Represent (E-RTR)
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('all')}
                style={{
                  ...styles.tabBtn,
                  ...(activePreviewTab === 'all' ? styles.tabBtnActive : {})
                }}
              >
                Complete Submittal Pack
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700', display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconCheck /> Authentic Doc Format (Verdana)
              </span>
            </div>
          </div>

          {/* Quick Word-Style Formatting Toolbar (Bold, Italic, Underline, Yellow Highlight, Bullets, Reset) */}
          <div style={styles.editorToolbar} className="no-print">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginRight: 4 }}>
                Live Edit:
              </span>
              <button
                type="button"
                onClick={() => execCmd('bold')}
                style={styles.toolbarBtn}
                title="Bold (Ctrl+B)"
              >
                <b>B</b>
              </button>
              <button
                type="button"
                onClick={() => execCmd('italic')}
                style={styles.toolbarBtn}
                title="Italic (Ctrl+I)"
              >
                <i>I</i>
              </button>
              <button
                type="button"
                onClick={() => execCmd('underline')}
                style={styles.toolbarBtn}
                title="Underline (Ctrl+U)"
              >
                <u>U</u>
              </button>
              <button
                type="button"
                onClick={() => execCmd('hiliteColor', '#FFFF00')}
                style={{ ...styles.toolbarBtn, backgroundColor: '#FEF08A', color: '#854D0E', fontWeight: '700' }}
                title="Yellow Highlight"
              >
                Highlight
              </button>
              <button
                type="button"
                onClick={() => execCmd('insertUnorderedList')}
                style={styles.toolbarBtn}
                title="Insert Bullet List"
              >
                • Bullet
              </button>
              <button
                type="button"
                onClick={handleInsertProjectHeader}
                style={{ ...styles.toolbarBtn, color: '#1D4ED8', fontWeight: '700' }}
                title="Insert New Project / Client Experience Block"
              >
                + Project
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={handleResetToTemplate}
                style={styles.toolbarResetBtn}
                title="Re-populate document from live candidate and requisition fields"
              >
                <IconReset /> <span>Reset Template</span>
              </button>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Click text on document to edit directly
              </span>
            </div>
          </div>

          {/* ─── TAB 1: CLIENT-READY SUBMITTAL RESUME (EXACT VERDANA WORD FORMAT) ─── */}
          {(activePreviewTab === 'resume' || activePreviewTab === 'all') && (
            <div style={styles.wordPaperWrapper}>
              <div
                ref={resumeEditorRef}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={() => setIsLiveEditDirty(true)}
                style={styles.wordPaper}
              />
            </div>
          )}

          {/* ─── TAB 2: ELECTRONIC RIGHT TO REPRESENT (E-RTR) (EXACT DOC FORMAT) ─── */}
          {(activePreviewTab === 'rtr' || activePreviewTab === 'all') && (
            <div style={{ ...styles.wordPaperWrapper, marginTop: activePreviewTab === 'all' ? 24 : 0 }}>
              <div
                ref={rtrEditorRef}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={() => setIsLiveEditDirty(true)}
                style={styles.wordPaper}
              />

              {/* Action Toolbar for E-RTR */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }} className="no-print">
                <button
                  type="button"
                  onClick={handleCopyRtr}
                  style={styles.actionBtnPrimary}
                >
                  <IconCopy /> <span>Copy RTR Email Text</span>
                </button>

                <Link
                  to={`/sign-rtr?template=${selectedTemplate}&candidateId=${encodeURIComponent(selectedCandidateId)}`}
                  style={styles.actionBtnSecondaryLink}
                  title="Open candidate digital signature interface"
                >
                  <IconSignature /> <span>Request Candidate Digital Signature (SmartSign RTR)</span> <IconExternalLink />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Email Submittal Dispatch Modal ───────────────────────────────── */}
      {showEmailModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEmailModal(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Email Submittal Package to Client / Account Manager
              </h3>
              <button onClick={() => setShowEmailModal(false)} style={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleSendEmail} style={{ padding: '20px' }}>
              <div style={styles.modalField}>
                <label style={styles.inputLabel}>Recipient Email *</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  style={styles.textInput}
                  required
                />
              </div>

              <div style={styles.modalField}>
                <label style={styles.inputLabel}>Subject Line *</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  style={styles.textInput}
                  required
                />
              </div>

              <div style={styles.modalField}>
                <label style={styles.inputLabel}>Cover Message *</label>
                <textarea
                  rows={4}
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  style={{ ...styles.textInput, resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  style={styles.actionBtnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  style={styles.actionBtnPrimary}
                >
                  {isSendingEmail ? 'Dispatching...' : 'Send Submittal Email ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Paste Candidate Resume Text Modal ────────────────────────────── */}
      {showPasteModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPasteModal(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Paste Candidate Resume Text
              </h3>
              <button onClick={() => setShowPasteModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: '11.5px', color: '#64748B', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                Paste the candidate's resume from Word, PDF, or email. SmartHire will automatically extract their legal name, target role, contact, visa, experience, bulleted responsibilities, and format everything in authentic Word styling.
              </p>
              <textarea
                rows={12}
                value={pastedResumeText}
                onChange={e => setPastedResumeText(e.target.value)}
                placeholder="Paste full resume text here (Ctrl+V)..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontFamily: 'monospace',
                  fontSize: '11.5px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: '1.5'
                }}
              />
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  style={styles.actionBtnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!pastedResumeText.trim()}
                  onClick={() => processUploadedResumeText(pastedResumeText, 'Pasted Resume')}
                  style={styles.actionBtnPrimary}
                >
                  Parse & Load Resume
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  pageWrap: {
    minHeight: '100vh',
    backgroundColor: '#F1F5F9',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },
  topNav: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    flexShrink: 0
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#2563EB',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 6px',
    borderRadius: 6
  },
  badgeEnterprise: {
    fontSize: '11px',
    fontWeight: '800',
    padding: '2px 8px',
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    border: '1px solid #BFDBFE'
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  toastChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    color: '#059669',
    border: '1px solid #A7F3D0',
    fontSize: '12px',
    fontWeight: '700'
  },
  actionBtnPrimary: {
    padding: '8px 16px',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 1px 3px rgba(15,23,42,0.15)'
  },
  actionBtnSecondary: {
    padding: '8px 13px',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    border: '1px solid #CBD5E1',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6
  },
  actionBtnSecondaryLink: {
    padding: '8px 14px',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#1D4ED8',
    border: '1px solid #93C5FD',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    textDecoration: 'none'
  },
  selectorBar: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    padding: '12px 24px',
    flexShrink: 0
  },
  selectorInner: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  filterGroup: {
    flex: 1,
    minWidth: '220px'
  },
  filterLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 4
  },
  selectInput: {
    width: '100%',
    padding: '7px 10px',
    borderRadius: 8,
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    outline: 'none',
    boxSizing: 'border-box'
  },
  workspace: {
    flex: 1,
    display: 'flex',
    padding: '18px 24px',
    gap: 20,
    boxSizing: 'border-box',
    alignItems: 'flex-start'
  },
  coversheetCol: {
    width: '450px',
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    border: '1px solid #CBD5E1',
    padding: 18,
    boxSizing: 'border-box',
    maxHeight: 'calc(100vh - 160px)',
    overflowY: 'auto'
  },
  resumeCol: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    border: '1px solid #CBD5E1',
    padding: 18,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 160px)',
    overflowY: 'auto'
  },
  colHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottom: '1px solid #E2E8F0',
    paddingBottom: 10
  },
  previewTabHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottom: '1px solid #E2E8F0',
    paddingBottom: 8,
    flexWrap: 'wrap',
    gap: 8
  },
  tabBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    background: 'none',
    border: 'none',
    color: '#64748B',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  tabBtnActive: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    fontWeight: '800',
    boxShadow: '0 1px 2px rgba(37,99,235,0.1)'
  },
  editorToolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    padding: '6px 10px',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 6
  },
  toolbarBtn: {
    padding: '4px 9px',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    fontSize: '11.5px',
    fontWeight: '600',
    color: '#0F172A',
    cursor: 'pointer'
  },
  toolbarResetBtn: {
    background: 'none',
    border: '1px solid #CBD5E1',
    borderRadius: 4,
    padding: '3px 8px',
    color: '#475569',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF'
  },
  wordPaperWrapper: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    padding: '16px',
    borderRadius: 10,
    boxSizing: 'border-box'
  },
  wordPaper: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: 2,
    padding: '40px 48px',
    boxSizing: 'border-box',
    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
    fontFamily: 'Verdana, Geneva, sans-serif',
    fontSize: '12px',
    lineHeight: '1.6',
    color: '#000000',
    outline: 'none',
    minHeight: '680px',
    cursor: 'text'
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14
  },
  sectionCardTitle: {
    fontSize: '11.5px',
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    marginBottom: 8
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3
  },
  inputLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#475569'
  },
  textInput: {
    width: '100%',
    padding: '7px 9px',
    borderRadius: 6,
    border: '1px solid #CBD5E1',
    fontSize: '12.5px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#FFFFFF'
  },
  smallAddBtn: {
    background: 'none',
    border: 'none',
    color: '#2563EB',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  matrixTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '11.5px',
    border: '1px solid #E2E8F0'
  },
  matrixTh: {
    padding: '6px 8px',
    border: '1px solid #E2E8F0',
    textAlign: 'left',
    color: '#475569',
    fontSize: '10.5px',
    fontWeight: '800'
  },
  matrixTd: {
    padding: '4px',
    border: '1px solid #E2E8F0'
  },
  matrixInput: {
    width: '100%',
    border: 'none',
    background: 'transparent',
    fontSize: '11px',
    outline: 'none',
    color: '#0F172A'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: '100%',
    maxWidth: '560px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    overflow: 'hidden'
  },
  modalHeader: {
    padding: '14px 18px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    color: '#64748B'
  },
  modalField: {
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    padding: '14px 16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
  },
  uploadBtnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '11.5px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  uploadBtnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: '#F8FAFC',
    color: '#1E293B',
    border: '1px solid #CBD5E1',
    fontSize: '11.5px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  }
}
