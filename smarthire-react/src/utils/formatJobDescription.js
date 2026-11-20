/**
 * formatJobDescription.js
 * ───────────────────────
 * Formats raw, messy Job Descriptions into clean, professional,
 * structured sections with clear headings and bullet points.
 */

export const KNOWN_TITLE_MAP = [
  { match: /it deployment team member.*66166/i, positionNumber: '66166', reqId: '159021', title: 'IT Deployment Team Member' },
  { match: /cbus.*809896/i, positionNumber: '809896', reqId: '159020', title: 'Program Manager 1' },
  { match: /cbus.*809895/i, positionNumber: '809895', reqId: '159019', title: 'Program Manager 1' },
  { match: /network engineer ii.*165232/i, positionNumber: '165232', reqId: '159016', title: 'Network Engineer II' },
  { match: /systems administrator iii.*165231/i, positionNumber: '165231', reqId: '159015', title: 'Systems Administrator III' },
  { match: /vdot.*gis governance.*810103/i, positionNumber: '810103', reqId: '159014', title: 'Program Manager - Data & GIS Governance' },
  { match: /it data analyst.*stamford/i, positionNumber: '809113', reqId: '159013', title: 'IT Data Analyst' },
  { match: /business analyst.*intermediate.*13415/i, positionNumber: '13415', reqId: '159012', title: 'Business Analyst - Intermediate' },
  { match: /security analyst ii.*165213/i, positionNumber: '165213', reqId: '159010', title: 'Security Analyst II' },
  { match: /web accessibility consultant.*66235/i, positionNumber: '66235', reqId: '159009', title: 'Web Accessibility Consultant' },
  { match: /enterprise architect.*165118/i, positionNumber: '165118', reqId: '159008', title: 'Enterprise Architect' },
  { match: /ncdot.*business analyst.*expert.*810569/i, positionNumber: '810569', reqId: '159007', title: 'Business Analyst - Expert' },
  { match: /enterprise architect adoption literacy coordinator.*165119/i, positionNumber: '165119', reqId: '159006', title: 'Enterprise Architect Adoption Literacy Coordinator' },
  { match: /itsm.*change.*process|change.*process.*manager.*810453/i, positionNumber: '810453', reqId: '159005', title: 'ITSM Change Process Manager - Junior' },
  { match: /business analyst.*advanced.*13414/i, positionNumber: '13414', reqId: '159004', title: 'Business Analyst - Advanced' },
  { match: /enterprise project manager.*advanced.*13421/i, positionNumber: '13421', reqId: '159003', title: 'Enterprise Project Manager - Advanced' },
  { match: /system analyst 4.*806546|vrs.*system analyst/i, positionNumber: '806546', reqId: '159002', title: 'System Analyst 4' },
  { match: /ecm.*business.*analyst.*66279|digital content manager.*tn doe/i, positionNumber: '66279', reqId: '159000', title: 'Enterprise Content Management (ECM) Business Analyst' },
  { match: /junior java|java.*developer.*test|807791/i, positionNumber: '807791', reqId: '158999', title: 'Junior Java Developer / Test Engineer' },
  { match: /system(?:s)? administrator ii|808800/i, positionNumber: '808800', reqId: '158998', title: 'System Administrator II' },
  { match: /senior aws developer|aws senior|808496/i, positionNumber: '808496', reqId: '158997', title: 'AWS Senior Developer' },
  { match: /power platform|805119/i, positionNumber: '805119', reqId: '158996', title: 'Power Platform Developer Architect' },
  { match: /aws\s*\/?\s*java developer|809716/i, positionNumber: '809716', reqId: '158995', title: 'AWS / Java Developer' },
  { match: /ncdot.*business analyst.*expert.*810558/i, positionNumber: '810558', reqId: '158994', title: 'Business Analyst - Expert' },
  { match: /senior salesforce engineer.*809821/i, positionNumber: '809821', reqId: '158993', title: 'Senior Salesforce Engineer' },
  { match: /ecm.*business.*analyst.*66278/i, positionNumber: '66278', reqId: '158992', title: 'Enterprise Content Management (ECM) Business Analyst' },
  { match: /qa tester.*manual andautomation|seleniumpostman/i, positionNumber: '809114', reqId: '158991', title: 'Quality Assurance Analyst - QA Tester (Manual & Automation)' },
  { match: /ncdot.*specialist.*expert.*809207/i, positionNumber: '809207', reqId: '158990', title: 'Specialist - Expert' },
  { match: /pr1042105.*business analyst/i, positionNumber: '212926', reqId: '158989', title: 'Business Analyst - Advanced' },
  { match: /data analyst\s*\/\s*business system|it data analyst/i, positionNumber: '809112', reqId: '158988', title: 'IT Data Analyst' },
  { match: /apd writer.*809989/i, positionNumber: '809989', reqId: '158987', title: 'APD Writer' },
  { match: /senior salesforce engineer.*809822/i, positionNumber: '809822', reqId: '158986', title: 'Senior Salesforce Engineer' },
  { match: /ncdot.*cloud engineer.*809851/i, positionNumber: '809851', reqId: '158985', title: 'Cloud Engineer - Expert' },
  { match: /ncdot.*cloud engineer.*809157/i, positionNumber: '809157', reqId: '158984', title: 'Cloud Engineer - Expert' },
  { match: /ncdit.*senior it project manager.*810423/i, positionNumber: '810423', reqId: '158983', title: 'Senior IT Project Manager' },
  { match: /food service worker.*cook.*66265/i, positionNumber: '66265', reqId: '158982', title: 'Food Service Worker / Cook' },
  { match: /project manager 3.*165008/i, positionNumber: '165008', reqId: '158981', title: 'Project Manager 3' },
  { match: /project manager 3.*165010/i, positionNumber: '165010', reqId: '158980', title: 'Project Manager 3' },
  { match: /it healthcare consultant project manager.*13411/i, positionNumber: '13411', reqId: '158979', title: 'IT Healthcare Consultant Project Manager' },
  { match: /vdh infrastructure solutions architect.*810314/i, positionNumber: '810314', reqId: '158977', title: 'Infrastructure Solutions Architect' },
  { match: /system analyst 5.*165083/i, positionNumber: '165083', reqId: '158976', title: 'System Analyst 5' },
  { match: /senior business systems analyst.*810449/i, positionNumber: '810449', reqId: '158975', title: 'Senior Business Systems Analyst' },
  { match: /jfs.*product specialist 5.*810238/i, positionNumber: '810238', reqId: '158973', title: 'Product Specialist 5' },
  { match: /dot.*cadd\/gis administrator 3.*810431/i, positionNumber: '810431', reqId: '158972', title: 'CADD / GIS Administrator 3' },
  { match: /decal.*caps senior qa analyst.*810505/i, positionNumber: '810505', reqId: '158971', title: 'CAPS Senior QA Analyst' },
  { match: /software test analyst 5.*165025/i, positionNumber: '165025', reqId: '158970', title: 'Software Test Analyst 5' },
  { match: /nc fast integration engineer.*808977/i, positionNumber: '808977', reqId: '158969', title: 'Integration Engineer' },
  { match: /network architect.*13297/i, positionNumber: '13297', reqId: '158968', title: 'Network Architect' },
  { match: /warehouse worker.*66269/i, positionNumber: '66269', reqId: '158967', title: 'Warehouse Worker' },
  { match: /administrative services assistant.*66213/i, positionNumber: '66213', reqId: '158966', title: 'Administrative Services Assistant' },
  { match: /vsu.*technical support analyst 2.*810091/i, positionNumber: '810091', reqId: '158965', title: 'Technical Support Analyst 2' },
  { match: /business analyst 3.*529601639r/i, positionNumber: '529601639R', reqId: '158964', title: 'Business Analyst 3' },
  { match: /ncdot.*product manager.*806296/i, positionNumber: '806296', reqId: '158963', title: 'Product Manager - Junior' },
  { match: /business analyst 4.*164993/i, positionNumber: '164993', reqId: '158962', title: 'Business Analyst 4' },
  { match: /ncdot.*product manager.*810178/i, positionNumber: '810178', reqId: '158961', title: 'Product Manager - Junior' },
  { match: /network engineer.*project lead.*13296/i, positionNumber: '13296', reqId: '158960', title: 'Network Engineer - Project Lead' },
  { match: /business analyst.*27267/i, positionNumber: '27267', reqId: '158959', title: 'Business Analyst' },
  { match: /business analyst.*27266/i, positionNumber: '27266', reqId: '158958', title: 'Business Analyst' },
  { match: /esl teacher.*66211/i, positionNumber: '66211', reqId: '158957', title: 'ESL Teacher' },
  { match: /ncdot product manager.*810176/i, positionNumber: '810176', reqId: '158956', title: 'Product Manager - Junior' },
  { match: /security analyst iii.*164703/i, positionNumber: '164703', reqId: '158954', title: 'Security Analyst III' },
  { match: /network engineer.*project lead.*13295/i, positionNumber: '13295', reqId: '158953', title: 'Network Engineer - Project Lead' },
  { match: /web accessibility consultant.*66233/i, positionNumber: '66233', reqId: '158952', title: 'Web Accessibility Consultant' },
  { match: /qa analyst senior.*809973/i, positionNumber: '809973', reqId: '158951', title: 'QA Analyst Senior' },
  { match: /desktop support ii.*164880/i, positionNumber: '164880', reqId: '158950', title: 'Desktop Support II' },
  { match: /business analyst 5.*164891/i, positionNumber: '164891', reqId: '158949', title: 'Business Analyst 5' },
];

export function normalizeJobId(val) {
  if (!val) return '';
  return String(val)
    .trim()
    .replace(/^#+/, '')
    .replace(/^(?:J-|REQ-|REQ_|REQ\s*#?)/i, '')
    .replace(/\/+$/, '')
    .trim();
}

export function resolvePositionNumber(job = {}) {
  if (!job) return '';
  if (typeof job === 'string' || typeof job === 'number') {
    return normalizeJobId(job);
  }
  // 1. Explicit positionNumber on job object
  if (job.positionNumber && String(job.positionNumber).trim()) {
    return String(job.positionNumber).trim();
  }
  // 2. Parenthesized number in title, e.g. "(808496)" or "(66166)" or "(84888)"
  const title = String(job.title || job.jobTitle || '');
  const titleMatch = title.match(/\((\d{4,8})\)/);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1];
  }
  // 3. sourceId (e.g. "84888" from JobsInHand or other VMS source)
  if (job.sourceId && String(job.sourceId).trim()) {
    return String(job.sourceId).trim();
  }
  // 4. vmsNumber / position_number
  if (job.vmsNumber && String(job.vmsNumber).trim()) {
    return String(job.vmsNumber).trim();
  }
  if (job.position_number && String(job.position_number).trim()) {
    return String(job.position_number).trim();
  }
  // 5. Look in KNOWN_TITLE_MAP
  for (const item of KNOWN_TITLE_MAP) {
    if (item.match && item.match.test(title)) {
      return item.positionNumber;
    }
  }
  // Fallback to reqId or id
  return normalizeJobId(job.reqId || job.id || job.jobId || '');
}

export function resolveReqId(rawId = '', job = {}) {
  let actualId = rawId;
  let actualJob = job;
  if (rawId && typeof rawId === 'object') {
    actualJob = rawId;
    actualId = rawId.reqId || rawId.id || rawId.jobId || '';
  }
  const strId = normalizeJobId(actualId || actualJob?.reqId || actualJob?.id || actualJob?.jobId || '');
  const title = String(actualJob?.title || '');

  // 1. If InfoOrigin source or authentic 4-5 digit InfoOrigin Req ID (e.g. 7589, 7588), RETURN IT DIRECTLY!
  if (job?.source === 'InfoOrigin' || job?.client === 'InfoOrigin' || job?.company === 'InfoOrigin' || strId.startsWith('IO-')) {
    return strId;
  }
  if (/^[1-9]\d{3,4}$/.test(strId) && parseInt(strId, 10) < 50000) {
    return strId;
  }

  // 1b. If strId is already a clean authentic 6-digit JobsInHand ID (e.g. 159023, 158999, 160001), RETURN IT DIRECTLY!
  if (/^1[56]\d{4}$/.test(strId)) {
    return strId;
  }
  if (/^\d{6}$/.test(strId) && !strId.startsWith('178')) {
    return strId;
  }

  // 2. Specific known legacy map
  const idMap = {
    '84405': '159021',
    '84404': '159019',
    '84403': '159020',
    '84402': '159016',
    '84401': '159015',
    '84400': '159014',
    '84399': '159013',
    '84398': '159012',
    '84397': '159010',
    '84396': '159009',
    '84395': '159008',
    '84394': '159007',
    '84393': '159006',
    '84392': '159005',
    '84391': '159000',
    '84390': '159004',
    '84389': '159003',
    '84388': '159002',
    '84387': '158999',
    '84386': '158998',
    '84385': '158996',
    '84384': '158997',
    '84383': '158995',
    '84382': '158988',
    '84381': '158994',
    '84380': '158993',
    '84379': '158992',
    '84378': '158990',
    '84377': '158991',
    '84376': '158989',
    '84375': '158987',
    '84374': '158986',
    '84373': '158984',
    '84372': '158985',
    '84371': '158983',
    '84370': '158982',
    '84369': '158981',
    '84368': '158980',
    '84367': '158979',
    '84366': '158977',
    '84365': '158976',
    '84364': '158975',
    '84363': '158973',
    '84362': '158972',
    '84361': '158971',
    '84360': '158970',
    '84359': '158969',
    '84358': '158968',
    '84357': '158967',
    '84356': '158966',
    '84355': '158965',
    '84354': '158964',
    '84353': '158963',
    '84352': '158962',
    '84351': '158961',
    '84350': '158960',
    '84349': '158959',
    '84348': '158958',
    '84347': '158957',
    '84346': '158956',
    '84345': '158953',
    '84344': '158954',
    '84343': '158952',
    '84342': '158951',
    '84341': '158950',
    '84340': '158949',
  };
  if (idMap[strId]) return idMap[strId];

  // 3. Match by title in known title map only as a fallback when strId is not authentic
  for (const item of KNOWN_TITLE_MAP) {
    if (item.match.test(title)) {
      return item.reqId;
    }
  }

  // 5. For long timestamp IDs (e.g. 1787944759918-490, 178795555459-270) or any non-6-digit ID:
  // Extract trailing suffix if present (e.g. 490 -> 158490) or hash deterministically
  const suffixMatch = strId.match(/-(\d{3,4})$/);
  if (suffixMatch && suffixMatch[1]) {
    const s = suffixMatch[1].padStart(3, '0').slice(-3);
    return `158${s}`;
  }

  // Deterministic 6-digit hash into 158000–158999 range
  let hash = 0;
  const hashSeed = strId + title;
  for (let i = 0; i < hashSeed.length; i++) {
    hash = (hash * 31 + hashSeed.charCodeAt(i)) & 0xffffffff;
  }
  const suffix = String(100 + (Math.abs(hash) % 890)).padStart(3, '0');
  return `158${suffix}`;
}

export function extractPositionNumber(title = '', text = '') {
  // Check title first: "(807791)" or "- 66278" or "(808800)"
  const titleMatch = String(title).match(/\((\d{5,8})\)/) || String(title).match(/-\s*(\d{5,8})\b/);
  if (titleMatch) return titleMatch[1];

  // Check text
  const textMatch = String(text).match(/Position\s*(?:#|No|Number|ID)?\s*:?\s*(\d{5,8})/i) ||
                    String(text).match(/Requirement\s*id\s*:?\s*(\d{5,8})/i) ||
                    String(text).match(/\b(\d{6})\b/);
  if (textMatch) return textMatch[1];

  return '';
}

export function resolveJobLocation(job = {}) {
  if (job?.location && typeof job.location === 'string') {
    const loc = job.location.trim();
    if (loc && !['tbd', 'any', 'unknown', 'n/a', 'na', 'remote', 'hybrid', 'onsite'].includes(loc.toLowerCase())) {
      return loc;
    }
  }

  // Look in city / state fields
  if (job?.city && job?.state) {
    return `${job.city}, ${job.state}`;
  }

  // Look in rawDescription / description / title / details
  const fullText = `${job?.title || ''} ${job?.rawDescription || ''} ${job?.description || ''} ${job?.details || ''}`;
  
  if (/nc\s*fast|dhhs|state of nc|raleigh|north carolina/i.test(fullText)) return 'Raleigh, NC';
  if (/vrs|richmond|virginia/i.test(fullText)) return 'Richmond, VA';
  if (/tn\s*doe|tennessee|nashville/i.test(fullText)) return 'Nashville, TN';
  if (/austin|texas/i.test(fullText)) return 'Austin, TX';
  if (/dallas/i.test(fullText)) return 'Dallas, TX';
  if (/atlanta|georgia/i.test(fullText)) return 'Atlanta, GA';
  if (/tallahassee|florida/i.test(fullText)) return 'Tallahassee, FL';

  // City, ST regex match
  const cityStateRegex = /\b([A-Z][a-zA-Z\s]{2,18}),\s*([A-Z]{2})\b/;
  const match = fullText.match(cityStateRegex);
  if (match) {
    return `${match[1].trim()}, ${match[2].trim()}`;
  }

  return (job?.work_mode === 'Remote' || job?.type === 'Remote') ? 'Remote, US' : 'Raleigh, NC';
}

export function cleanJobTitleWithPositionNumber(title = '', job = {}) {
  if (!title && !job?.title) return '';
  let str = String(title || job?.title || '').trim();

  // Check known titles
  for (const item of KNOWN_TITLE_MAP) {
    if (item.match.test(str)) {
      return item.title;
    }
  }
  
  // Remove client / agency prefixes
  let cleaned = str
    .replace(/^(VDOT|VDH|NCDOT|NCDIT|NC\s*DHHS|NC\s*FAST|DHHS|VRS|ETF|TN\s*DOH|TN\s*DOE|DOT|JFS|DECAL|VSU|CBUS|State\s*of\s*NC|State\s*of\s*VA|State\s*of\s*TN)\s*[-:–—]*\s*/i, '')
    // Remove position numbers in parentheses: (165643), (810453), etc.
    .replace(/\s*\(\s*\d{4,8}[a-zA-Z]?\s*\)/g, '')
    // Remove standalone position numbers or trailing numbers: - 66278, #810453
    .replace(/\s*[-–—#:]\s*\d{4,8}\b/g, '')
    .replace(/\b\d{5,8}\b/g, '')
    // Remove staffing jargon
    .replace(/\bcontractor\b/gi, '')
    .replace(/\bc2c\b/gi, '')
    .replace(/\bw2\b/gi, '')
    .replace(/\bcorp-to-corp\b/gi, '')
    .replace(/\bneed resume\b/gi, '')
    .replace(/\burgent hiring\b/gi, '')
    .replace(/\blocal candidates only\b/gi, '')
    .replace(/\bimmediate hiring\b/gi, '')
    // Rebid formatting clean up
    .replace(/\s*[-–—]+\s*rebid\b/gi, ' - Rebid')
    // Remove empty parentheses like (), ( ), (/), (-)
    .replace(/\([\s\-\|\/]*\)/g, '')
    // Remove trailing/leading hyphens, colons, or slashes
    .replace(/^[\s\-\|\/:]+|[\s\-\|\/:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || str;
}

/**
 * Strips legacy emojis and decorative Unicode symbols (Rule 1 & Rule 8 compliance)
 */
export function stripLegacyEmojis(str = '') {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2B50}\u{25C6}\u{25C7}\u{25B2}\u{25BC}\u{25CA}\u{2B21}\u{2B22}\u{25C8}]/gu, '')
    .replace(/[📌🎯⚡💼🏢📍💰📅⭐🔥🚀🛡️🏆🥇🥈🥉]/g, '')
    .trim();
}

/**
 * Strips HTML tags into clean text while preserving bullet structures and line breaks.
 */
function sanitizeHtmlToText(htmlStr = '') {
  if (typeof htmlStr !== 'string') return '';
  let s = htmlStr;
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, content) => `\n• ${content.trim()}`);
  s = s.replace(/<\/?(?:p|div|h[1-6]|tr|blockquote)[^>]*>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<[^>]+>/g, ' ');
  s = s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  return s;
}

/**
 * Strips leading bullet characters and list numbers (e.g. 1., 2), •, -, *),
 * while preserving leading numbers in quantitative expressions like "10+ years", "5+ years", "24/7 support".
 */
export function cleanBulletText(str = '') {
  if (!str) return '';
  return String(str)
    .replace(/^\s*(?:[•\u2022\u2023\u25E6\u2043\u2219\*\-]|(?:\d{1,2}[\.\)]))\s*/, '')
    .trim();
}

/**
 * Universal AST parser that ingests raw, scraped, ASCII-separated, or HTML JDs
 * and returns a canonical structured object.
 */
export function parseJobDescriptionToAST(rawText = '', jobMeta = {}) {
  const metaObj = (jobMeta && typeof jobMeta === 'object') ? jobMeta : {};
  let text = typeof rawText === 'string' ? rawText.trim() : '';

  // 1. Sanitize HTML tags into clean text representation if HTML detected
  if (/<[a-z][\s\S]*>/i.test(text)) {
    text = sanitizeHtmlToText(text);
  }

  // 2. Strip legacy emojis per Rule 1 and Rule 8
  text = stripLegacyEmojis(text);

  // 3. Extract metadata fields
  const title = cleanJobTitleWithPositionNumber(metaObj.title || '', metaObj);
  const positionNumber = resolvePositionNumber(metaObj);
  const reqId = resolveReqId(metaObj.reqId || metaObj.id || metaObj.jobId || positionNumber, metaObj);
  let location = resolveJobLocation(metaObj);
  if (!location || location === 'Remote, US' || location === 'Raleigh, NC') {
    const textLoc = resolveJobLocation({ location: '', description: text });
    if (textLoc && textLoc !== 'Raleigh, NC' && textLoc !== 'Remote, US') {
      location = textLoc;
    }
  }

  let workMode = metaObj.workMode || metaObj.work_mode;
  if (!workMode || ['contract', 'full-time', 'c2c', 'w2', 'any'].includes(String(workMode).toLowerCase())) {
    workMode = (metaObj.type && !['contract', 'full-time', 'c2c', 'w2'].includes(String(metaObj.type).toLowerCase())) ? metaObj.type : 'Onsite';
  }
  const workMatch = text.match(/\bWork\s*Arrangement\s*:?\s*([^\n\r<]+)/i) ||
                    text.match(/\bWork\s*Preference\s*:?\s*([^\n\r<]+)/i);
  if (workMatch) {
    const rawW = workMatch[1].split(/Interview|Description|Client|Submission|Note/i)[0].trim();
    if (rawW && !['contract', 'full-time', 'c2c', 'w2'].includes(rawW.toLowerCase())) {
      workMode = rawW;
    }
  }

  let startDate = '';
  const startMatch = text.match(/\bStart\s*date\s*:?\s*([^\n\r<]+)/i);
  if (startMatch) startDate = startMatch[1].split(/End|Submission|Client|Interview|Description/i)[0].trim();

  let endDate = '';
  const endMatch = text.match(/\bEnd\s*Date\s*:?\s*([^\n\r<]+)/i);
  if (endMatch) endDate = endMatch[1].split(/Submission|Client|Interview|Description/i)[0].trim();

  let deadline = metaObj.deadline || '';
  const deadlineMatch = text.match(/\bSubmission\s*deadline\s*:?\s*([^\n\r<]+)/i) ||
                        text.match(/\bDeadline\s*:?\s*([^\n\r<]+)/i);
  if (deadlineMatch) deadline = deadlineMatch[1].split(/Client|Interview|Description|Work/i)[0].trim();

  let interviewType = metaObj.interviewType || metaObj.interview_type || 'Webcam / In-Person';
  if (/webcam|video/i.test(interviewType) && /in-?\s*person|onsite/i.test(interviewType)) {
    interviewType = 'Webcam or In Person';
  } else if (/in-?\s*person|onsite/i.test(interviewType) && !/webcam|video/i.test(interviewType)) {
    interviewType = 'In-Person / Onsite';
  }
  const interviewMatch = text.match(/\b(?:Agency\s*)?Interview\s*Type\s*:?\s*([^\n\r<]+)/i) ||
                         text.match(/\bInterview\s*:\s*([^\n\r<]+)/i);
  if (interviewMatch) {
    let rawInt = interviewMatch[1].split(/Description\s*:/i)[0].trim();
    rawInt = rawInt.replace(/^[sS]\s*:\s*/, '').trim();
    if (/webcam|video/i.test(rawInt) && /in-?\s*person|onsite/i.test(rawInt)) {
      interviewType = 'Webcam or In Person';
    } else if (/webcam|video|zoom|teams/i.test(rawInt)) {
      interviewType = 'Webcam / Video';
    } else if (/in-?\s*person|onsite/i.test(rawInt)) {
      interviewType = 'In-Person / Onsite';
    } else if (rawInt.length > 2 && rawInt.length <= 45 && !/will be|scheduled|conducted/i.test(rawInt)) {
      interviewType = rawInt;
    }
  }

  let client = metaObj.client || metaObj.customer || 'Direct Client';
  if (/VDOT|VDH|NCDOT|NCDIT|NC\s*DHHS|NC\s*FAST|DHHS|VRS|ETF|TN\s*DOH|TN\s*DOE/i.test(client)) {
    client = 'Enterprise Client';
  }

  const employmentType = metaObj.type || metaObj.employment_type || 'Contract';
  const rate = metaObj.rate || metaObj.payRate || metaObj.billRate || '';

  // 4. Section parsing (handle pre-formatted ASCII sections vs unformatted)
  let summary = '';
  let responsibilities = [];
  let requiredSkills = Array.isArray(metaObj.skills) ? [...metaObj.skills] : [];
  let preferredSkills = Array.isArray(metaObj.preferredSkills) ? [...metaObj.preferredSkills] : 
                        (Array.isArray(metaObj.preferred_skills) ? [...metaObj.preferred_skills] : []);

  const hasSectionHeaders = /KEY ROLES & RESPONSIBILITIES|ROLES & RESPONSIBILITIES|PROJECT SUMMARY & OBJECTIVE|ABOUT THE ROLE|JOB SUMMARY|\bSUMMARY\b|\bOVERVIEW\b/i.test(text);

  if (hasSectionHeaders) {
    const summaryMatch = text.match(/(?:PROJECT SUMMARY & OBJECTIVE|ABOUT THE ROLE|JOB SUMMARY|SUMMARY|OVERVIEW)[:\s=-]*\n([\s\S]*?)(?=(?:[=-]{5,}|\n[ \t]*[A-Z][A-Za-z0-9\s&]{2,28}\n|KEY ROLES|ROLES & RESPONSIBILITIES|REQUIRED TECHNICAL|REQUIRED QUALIFICATIONS|REQUIRED SKILLS|$))/i);
    if (summaryMatch && summaryMatch[1].trim()) {
      summary = summaryMatch[1]
        .replace(/[=-]{5,}/g, '')
        .split(/\r?\n/)
        .filter(l => !/^[=-]{3,}$/.test(l.trim()))
        .join('\n')
        .trim();
    }

    const respMatch = text.match(/(?:KEY ROLES & RESPONSIBILITIES|ROLES & RESPONSIBILITIES|RESPONSIBILITIES|WHAT YOU'LL DO)[:\s=-]*\n([\s\S]*?)(?=(?:[=-]{5,}|\n[ \t]*[A-Z][A-Za-z0-9\s&]{2,28}\n|REQUIRED TECHNICAL|REQUIRED QUALIFICATIONS|REQUIRED SKILLS|PREFERRED QUALIFICATIONS|$))/i);
    if (respMatch && respMatch[1].trim()) {
      responsibilities = respMatch[1]
        .split(/\r?\n/)
        .map(l => cleanBulletText(l))
        .filter(l => l.length > 5 && !/[=-]{5,}/.test(l) && !/^[=-]{3,}$/.test(l));
    }

    const reqMatch = text.match(/(?:REQUIRED TECHNICAL PROFICIENCIES|REQUIRED QUALIFICATIONS & SKILLS|REQUIRED QUALIFICATIONS|REQUIRED SKILLS|REQUIREMENTS|QUALIFICATIONS)[:\s=-]*\n([\s\S]*?)(?=(?:[=-]{5,}|\n[ \t]*[A-Z][A-Za-z0-9\s&]{2,28}\n|PREFERRED QUALIFICATIONS|PREFERRED SKILLS|$))/i);
    if (reqMatch && reqMatch[1].trim()) {
      const extractedReq = reqMatch[1]
        .split(/\r?\n/)
        .map(l => cleanBulletText(l))
        .filter(l => l.length > 3 && !/[=-]{5,}/.test(l) && !/^[=-]{3,}$/.test(l));
      if (extractedReq.length > 0) {
        requiredSkills = extractedReq;
      }
    }

    const prefMatch = text.match(/(?:PREFERRED QUALIFICATIONS & DOMAIN SKILLS|PREFERRED QUALIFICATIONS|PREFERRED SKILLS|NICE TO HAVE)[:\s=-]*\n([\s\S]*?)(?=(?:[=-]{5,}|\n[ \t]*[A-Z][A-Za-z0-9\s&]{2,28}\n|$))/i);
    if (prefMatch && prefMatch[1].trim()) {
      const extractedPref = prefMatch[1]
        .split(/\r?\n/)
        .map(l => cleanBulletText(l))
        .filter(l => l.length > 3 && !/[=-]{5,}/.test(l) && !/^[=-]{3,}$/.test(l));
      if (extractedPref.length > 0) {
        preferredSkills = extractedPref;
      }
    }
  }

  // If unformatted or sections missing, run heuristic extraction
  if (!summary || responsibilities.length === 0) {
    let mainBody = text;
    const descMatch = text.match(/Description\s*:\s*([\s\S]+)/i);
    if (descMatch && descMatch[1].trim().length > 30) {
      mainBody = descMatch[1].trim();
    } else {
      mainBody = mainBody
        .replace(/^.*?Engineer:\s*[^\n]+/i, '')
        .replace(/Start\s*date\s*:[^\n]+/gi, '')
        .replace(/End\s*Date\s*:[^\n]+/gi, '')
        .replace(/Submission\s*deadline\s*:[^\n]+/gi, '')
        .replace(/Client\s*Info\s*:[^\n]+/gi, '')
        .replace(/Client\s*:[^\n]+/gi, '')
        .replace(/Agency\s*:[^\n]+/gi, '')
        .replace(/Work\s*Arrangement\s*:[^\n]+/gi, '')
        .replace(/Agency\s*Interview\s*Type\s*:[^\n]+/gi, '')
        .replace(/Interview\s*Type\s*:[^\n]+/gi, '')
        .replace(/Note:\s*/gi, '')
        .replace(/\(This job is for -.*?\)/gi, '')
        .replace(/Call\s*502-379-4456.*$/gi, '')
        .replace(/Please provide Requirement id.*$/gi, '')
        .replace(/\b(?:VDOT|VDH|NCDOT|NCDIT|NC\s*DHHS|NC\s*FAST|DHHS|VRS|ETF|TN\s*DOH|TN\s*DOE)\b/gi, 'Enterprise Client')
        .replace(/\s*\(\s*\d{4,8}[a-zA-Z]?\s*\)/g, '')
        .replace(/Pursuant to the State of.*?policy of non-discrimination.*?$/is, '')
        .replace(/Equal Opportunity Employer.*?$/is, '')
        .replace(/We are an equal opportunity employer.*?$/is, '')
        .replace(/\bEEO\b.*?$/is, '')
        .trim();
    }

    const rawSentences = mainBody
      .split(/(?<=[.?!])\s+(?=[A-Z])|(?:\r?\n\s*|\s+)[•\u2022\u2023\u25E6\u2043\u2219\*\-]\s+|\n\s*•|\n\s*-|\n\s*\*|\n\s*\d{1,2}\.\s+/)
      .map(s => cleanBulletText(s))
      .filter(s => s.length > 8 && !/policy of non-discrimination|equal opportunity employer|affirmative action|does not discriminate/i.test(s) && !/^[=-]{3,}$/.test(s));

    let summaryLines = [];
    let respLines = [];
    let reqSkillLines = [];
    let prefSkillLines = [];

    rawSentences.forEach(sentence => {
      const sLower = sentence.toLowerCase();
      if (sLower.includes('primary skills necessary') || sLower.includes('must have') || sLower.includes('required skills') || sLower.includes('proficient in') || sLower.includes('solid understanding of')) {
        reqSkillLines.push(sentence);
      } else if (sLower.includes('additional skills beyond') || sLower.includes('nice to have') || sLower.includes('preferred') || sLower.includes('familiarity with')) {
        prefSkillLines.push(sentence);
      } else if (sLower.includes('responsible for') || sLower.includes('responsibilities of') || sLower.includes('responsibility includes') || sLower.includes('role involves') || sLower.includes('assist with') || sLower.includes('serves as') || sLower.includes('operates') || sLower.includes('performing') || sLower.includes('cleans') || sLower.includes('polices') || sLower.includes('maintains') || sLower.includes('trains') || sLower.includes('contributes to') || sLower.includes('collaborate with') || sLower.includes('architected') || sLower.includes('develop') || sLower.includes('oversee') || sLower.includes('ensuring') || sLower.includes('guiding') || sLower.includes('testing')) {
        respLines.push(sentence);
      } else {
        if (summaryLines.length < 2 && !sLower.includes('custodian') && !sLower.includes('sweeps') && !sLower.includes('mops')) {
          summaryLines.push(sentence);
        } else {
          respLines.push(sentence);
        }
      }
    });

    if (!summary) {
      summary = summaryLines.join(' ').trim() ||
        `The client is seeking a qualified, results-driven professional to support enterprise operations and solution delivery. This role contributes to project milestones within an agile, collaborative environment.`;
    }
    if (responsibilities.length === 0) {
      responsibilities = respLines.length > 0 ? respLines : [
        'Oversee end-to-end implementation and support lifecycle in a collaborative environment.',
        'Collaborate with cross-functional technical teams, business stakeholders, and project managers.',
        'Ensure high standards of system integration, compliance controls, and comprehensive documentation.',
        'Support ongoing maintenance, testing, and continuous improvement initiatives.'
      ];
    }
    if (requiredSkills.length === 0) {
      requiredSkills = reqSkillLines.length > 0 ? reqSkillLines : [
        'Core Technical Proficiency in required functional & technical domain',
        'Experience with system architecture, workflow design, and access controls',
        'Strong problem-solving, documentation, and stakeholder collaboration capabilities'
      ];
    }
    if (preferredSkills.length === 0 && prefSkillLines.length > 0) {
      preferredSkills = prefSkillLines;
    }
  }

  responsibilities = [...new Set(responsibilities.map(r => cleanBulletText(stripLegacyEmojis(r))).filter(r => Boolean(r) && !/^[=-]{3,}$/.test(r)))];
  requiredSkills = [...new Set(requiredSkills.map(s => cleanBulletText(stripLegacyEmojis(s))).filter(s => Boolean(s) && !/^[=-]{3,}$/.test(s)))];
  preferredSkills = [...new Set(preferredSkills.map(s => cleanBulletText(stripLegacyEmojis(s))).filter(s => Boolean(s) && !/^[=-]{3,}$/.test(s)))];
  summary = stripLegacyEmojis(summary)
    .replace(/[=-]{5,}/g, '')
    .split(/\r?\n/)
    .filter(l => !/^[=-]{3,}$/.test(l.trim()))
    .join('\n')
    .trim();

  const specifications = [
    { label: 'Position Title', value: title || 'Technical Specialist' },
    { label: 'Requisition ID', value: `#${reqId}` },
    { label: 'Client / Agency', value: client },
    { label: 'Work Location', value: location },
    { label: 'Work Arrangement', value: workMode },
    { label: 'Employment Type', value: employmentType },
    { label: 'Interview Type', value: interviewType },
  ];
  if (rate) specifications.push({ label: 'Target Rate', value: rate });
  if (startDate) specifications.push({ label: 'Target Start Date', value: startDate });
  if (endDate) specifications.push({ label: 'Target End Date', value: endDate });
  if (deadline) specifications.push({ label: 'Submission Deadline', value: deadline });

  return {
    meta: {
      title: title || 'Technical Specialist',
      reqId,
      positionNumber,
      client,
      location,
      workMode,
      employmentType,
      rate,
      interviewType,
      startDate,
      endDate,
      deadline
    },
    summary,
    responsibilities,
    requiredSkills,
    preferredSkills,
    specifications
  };
}

/**
 * Generates clean, semantic HTML with proper headings, paragraphs, and list elements.
 * Supports email-safe inline styles for candidate outreach.
 */
export function formatJobDescriptionHtml(rawText = '', jobMeta = {}, options = {}) {
  const ast = (rawText && typeof rawText === 'object' && rawText.meta && rawText.summary)
    ? rawText
    : parseJobDescriptionToAST(rawText, jobMeta);

  const isEmail = Boolean(options.emailSafe);
  const includeMeta = options.includeMetaTable !== false;
  const fontStack = `"IBM Plex Sans", "IBM Plex Sans Fallback", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

  const escapeHtml = (str = '') => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  let metaHtml = '';
  if (includeMeta && ast.specifications && ast.specifications.length > 0) {
    if (isEmail) {
      metaHtml = `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
          Key Position Specifications
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; font-family: ${fontStack};">
          <tbody>
            ${ast.specifications.map(s => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 160px;">${escapeHtml(s.label)}:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 500;">${escapeHtml(s.value)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
    } else {
      metaHtml = `
      <div class="jd-specifications-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-bottom: 22px;">
        <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
          Position Overview &amp; Specifications
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px 18px;">
          ${ast.specifications.map(s => `
            <div>
              <div style="font-size: 10.5px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;">${escapeHtml(s.label)}</div>
              <div style="font-size: 13px; color: #0f172a; font-weight: 600; margin-top: 2px;">${escapeHtml(s.value)}</div>
            </div>
          `).join('')}
        </div>
      </div>`;
    }
  }

  const preferredSection = (ast.preferredSkills && ast.preferredSkills.length > 0) ? `
    <div style="margin-top: 22px;">
      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; font-family: ${fontStack};">
        Preferred Qualifications
      </h3>
      <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
        ${ast.preferredSkills.map(s => `
          <li style="font-size: 13.5px; color: #334155; line-height: 1.65; margin-bottom: 6px; font-family: ${fontStack};">
            ${escapeHtml(s)}
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';

  return `
<div class="smarthire-jd-html" style="font-family: ${fontStack}; color: #1e293b; line-height: 1.65; max-width: 820px;">
  ${metaHtml}

  <div style="margin-bottom: 22px;">
    <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; font-family: ${fontStack};">
      About the Role
    </h3>
    <p style="font-size: 14px; color: #334155; line-height: 1.7; margin: 0; font-family: ${fontStack};">
      ${escapeHtml(ast.summary)}
    </p>
  </div>

  <div style="margin-bottom: 22px;">
    <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; font-family: ${fontStack};">
      Key Roles &amp; Responsibilities
    </h3>
    <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
      ${ast.responsibilities.map(r => `
        <li style="font-size: 13.5px; color: #334155; line-height: 1.65; margin-bottom: 6px; font-family: ${fontStack};">
          ${escapeHtml(r)}
        </li>
      `).join('')}
    </ul>
  </div>

  <div style="margin-bottom: 22px;">
    <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; font-family: ${fontStack};">
      Required Qualifications &amp; Skills
    </h3>
    <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
      ${ast.requiredSkills.map(s => `
        <li style="font-size: 13.5px; color: #334155; line-height: 1.65; margin-bottom: 6px; font-family: ${fontStack};">
          ${escapeHtml(s)}
        </li>
      `).join('')}
    </ul>
  </div>

  ${preferredSection}
</div>`.trim();
}

/**
 * Generates clean, professional plain text with clear headings and bullet points.
 * Completely eliminates ASCII divider banners (===) and legacy emojis.
 */
export function formatJobDescriptionText(rawText = '', jobMeta = {}) {
  const ast = (rawText && typeof rawText === 'object' && rawText.meta && rawText.summary)
    ? rawText
    : parseJobDescriptionToAST(rawText, jobMeta);

  const lines = [];

  // Specifications
  lines.push('POSITION OVERVIEW');
  lines.push('-----------------');
  ast.specifications.forEach(s => {
    lines.push(`• ${s.label}: ${s.value}`);
  });
  lines.push('');

  // Summary
  lines.push('ABOUT THE ROLE');
  lines.push('--------------');
  const cleanSummary = (ast.summary || '')
    .replace(/[=-]{5,}/g, '')
    .split(/\r?\n/)
    .filter(l => !/^[=-]{3,}$/.test(l.trim()))
    .join('\n')
    .trim();
  lines.push(cleanSummary);
  lines.push('');

  // Responsibilities
  lines.push('KEY ROLES & RESPONSIBILITIES');
  lines.push('----------------------------');
  ast.responsibilities.forEach(r => {
    lines.push(`• ${r}`);
  });
  lines.push('');

  // Required Skills
  lines.push('REQUIRED QUALIFICATIONS & SKILLS');
  lines.push('--------------------------------');
  ast.requiredSkills.forEach(s => {
    lines.push(`• ${s}`);
  });

  // Preferred Skills
  if (ast.preferredSkills && ast.preferredSkills.length > 0) {
    lines.push('');
    lines.push('PREFERRED QUALIFICATIONS');
    lines.push('------------------------');
    ast.preferredSkills.forEach(s => {
      lines.push(`• ${s}`);
    });
  }

  return lines.join('\n');
}

/**
 * Copies formatted JD to the clipboard using multi-MIME payload (text/html and text/plain)
 * so it pastes with rich formatting into Gmail, Outlook, Word, or Docs.
 */
export async function copyJobDescriptionToClipboard(rawText = '', jobMeta = {}) {
  const ast = (rawText && typeof rawText === 'object' && rawText.meta)
    ? rawText
    : parseJobDescriptionToAST(rawText, jobMeta);
  const html = formatJobDescriptionHtml(ast, jobMeta);
  const text = formatJobDescriptionText(ast, jobMeta);

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    if (typeof ClipboardItem !== 'undefined' && typeof Blob !== 'undefined') {
      try {
        const item = new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' })
        });
        await navigator.clipboard.write([item]);
        return { success: true, mode: 'rich' };
      } catch (err) {
        await navigator.clipboard.writeText(text);
        return { success: true, mode: 'text' };
      }
    } else {
      await navigator.clipboard.writeText(text);
      return { success: true, mode: 'text' };
    }
  }
  return { success: false, error: 'Clipboard API not supported' };
}

/**
 * Backward-compatible wrapper for existing callers.
 * Formats raw text into structured text while stripping legacy emojis and ASCII dividers.
 */
export function formatJobDescription(rawText = '', jobMeta = {}) {
  const text = stripLegacyEmojis(typeof rawText === 'string' ? rawText.trim() : '');
  if (!text && !jobMeta?.title) return '';
  return formatJobDescriptionText(text, jobMeta);
}
