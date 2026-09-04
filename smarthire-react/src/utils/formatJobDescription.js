/**
 * formatJobDescription.js
 * ───────────────────────
 * Formats raw, messy Job Descriptions into clean, professional,
 * structured sections with clear headings and bullet points.
 */

export const KNOWN_TITLE_MAP = [
  { match: /it deployment team member.*66166/i, positionNumber: '66166', reqId: '159021', title: 'IT Deployment Team Member (66166)' },
  { match: /cbus.*809896/i, positionNumber: '809896', reqId: '159020', title: 'CBUS Program Manager 1 (809896)' },
  { match: /cbus.*809895/i, positionNumber: '809895', reqId: '159019', title: 'CBUS Program Manager 1 (809895)' },
  { match: /network engineer ii.*165232/i, positionNumber: '165232', reqId: '159016', title: 'Network Engineer II (165232)' },
  { match: /systems administrator iii.*165231/i, positionNumber: '165231', reqId: '159015', title: 'Systems Administrator III (165231)' },
  { match: /vdot.*gis governance.*810103/i, positionNumber: '810103', reqId: '159014', title: 'VDOT Program Manager - Data And GIS Governance (810103)' },
  { match: /it data analyst.*stamford/i, positionNumber: '809113', reqId: '159013', title: 'IT Data Analyst (809113)' },
  { match: /business analyst.*intermediate.*13415/i, positionNumber: '13415', reqId: '159012', title: 'Business Analyst - Intermediate (13415)' },
  { match: /security analyst ii.*165213/i, positionNumber: '165213', reqId: '159010', title: 'Security Analyst II (165213)' },
  { match: /web accessibility consultant.*66235/i, positionNumber: '66235', reqId: '159009', title: 'Web Accessibility Consultant (66235)' },
  { match: /enterprise architect.*165118/i, positionNumber: '165118', reqId: '159008', title: 'Enterprise Architect (165118)' },
  { match: /ncdot.*business analyst.*expert.*810569/i, positionNumber: '810569', reqId: '159007', title: 'NCDOT - Business Analyst- Expert (810569)' },
  { match: /enterprise architect adoption literacy coordinator.*165119/i, positionNumber: '165119', reqId: '159006', title: 'Enterprise Architect Adoption Literacy Coordinator (165119)' },
  { match: /itsm.*change.*process|change.*process.*manager.*810453/i, positionNumber: '810453', reqId: '159005', title: 'NCDIT - ITSM Change Process Manager - Junior (810453)' },
  { match: /business analyst.*advanced.*13414/i, positionNumber: '13414', reqId: '159004', title: 'Business Analyst - Advanced (13414)' },
  { match: /enterprise project manager.*advanced.*13421/i, positionNumber: '13421', reqId: '159003', title: 'Enterprise Project Manager - Advanced (13421)' },
  { match: /system analyst 4.*806546|vrs.*system analyst/i, positionNumber: '806546', reqId: '159002', title: 'VRS - System Analyst 4 (806546)' },
  { match: /ecm.*business.*analyst.*66279|digital content manager.*tn doe/i, positionNumber: '66279', reqId: '159000', title: 'Enterprise Content Management (ECM) Business Analyst (66279)' },
  { match: /junior java|java.*developer.*test|807791/i, positionNumber: '807791', reqId: '158999', title: 'NC FAST Junior Java Developer/Test Engineer (807791)' },
  { match: /system(?:s)? administrator ii|808800/i, positionNumber: '808800', reqId: '158998', title: 'NC DHHS System Administrator II (808800)' },
  { match: /senior aws developer|aws senior|808496/i, positionNumber: '808496', reqId: '158997', title: 'NC DHHS AWS Senior Developer (808496)' },
  { match: /power platform|805119/i, positionNumber: '805119', reqId: '158996', title: 'DHHS MS Power Platform Developer Architect (805119)' },
  { match: /aws\s*\/?\s*java developer|809716/i, positionNumber: '809716', reqId: '158995', title: 'NC DHHS AWS/Java Developer (809716)' },
  { match: /ncdot.*business analyst.*expert.*810558/i, positionNumber: '810558', reqId: '158994', title: 'NCDOT - Business Analyst- Expert (810558)' },
  { match: /senior salesforce engineer.*809821/i, positionNumber: '809821', reqId: '158993', title: 'Senior Salesforce Engineer (809821)' },
  { match: /ecm.*business.*analyst.*66278/i, positionNumber: '66278', reqId: '158992', title: 'Enterprise Content Management (ECM) Business Analyst (66278)' },
  { match: /qa tester.*manual andautomation|seleniumpostman/i, positionNumber: '809114', reqId: '158991', title: 'Quality Assurance Analyst - QA Tester (Manual & Automation)' },
  { match: /ncdot.*specialist.*expert.*809207/i, positionNumber: '809207', reqId: '158990', title: 'NCDOT- Specialist- Expert (809207)' },
  { match: /pr1042105.*business analyst/i, positionNumber: '212926', reqId: '158989', title: 'Business Analyst C. Advanced (212926)' },
  { match: /data analyst\s*\/\s*business system|it data analyst/i, positionNumber: '809112', reqId: '158988', title: 'IT Data Analyst (809112)' },
  { match: /apd writer.*809989/i, positionNumber: '809989', reqId: '158987', title: 'APD Writer (809989)' },
  { match: /senior salesforce engineer.*809822/i, positionNumber: '809822', reqId: '158986', title: 'Senior Salesforce Engineer (809822)' },
  { match: /ncdot.*cloud engineer.*809851/i, positionNumber: '809851', reqId: '158985', title: 'NCDOT - Cloud Engineer- Expert (809851)' },
  { match: /ncdot.*cloud engineer.*809157/i, positionNumber: '809157', reqId: '158984', title: 'NCDOT - Cloud Engineer- Expert (809157)' },
  { match: /ncdit.*senior it project manager.*810423/i, positionNumber: '810423', reqId: '158983', title: 'NCDIT - Senior IT Project Manager (810423)' },
  { match: /food service worker.*cook.*66265/i, positionNumber: '66265', reqId: '158982', title: 'Food Service Worker/Cook (66265)' },
  { match: /project manager 3.*165008/i, positionNumber: '165008', reqId: '158981', title: 'Project Manager 3 (165008)' },
  { match: /project manager 3.*165010/i, positionNumber: '165010', reqId: '158980', title: 'Project Manager 3 (165010)' },
  { match: /it healthcare consultant project manager.*13411/i, positionNumber: '13411', reqId: '158979', title: 'IT Healthcare Consultant Project Manager (13411)' },
  { match: /vdh infrastructure solutions architect.*810314/i, positionNumber: '810314', reqId: '158977', title: 'VDH Infrastructure Solutions Architect (810314)' },
  { match: /system analyst 5.*165083/i, positionNumber: '165083', reqId: '158976', title: 'System Analyst 5 (165083)' },
  { match: /senior business systems analyst.*810449/i, positionNumber: '810449', reqId: '158975', title: 'Senior Business Systems Analyst (810449)' },
  { match: /jfs.*product specialist 5.*810238/i, positionNumber: '810238', reqId: '158973', title: 'JFS - Product Specialist 5 / PS5 (810238)' },
  { match: /dot.*cadd\/gis administrator 3.*810431/i, positionNumber: '810431', reqId: '158972', title: 'DOT - CADD/GIS Administrator 3/CGA3 (810431)' },
  { match: /decal.*caps senior qa analyst.*810505/i, positionNumber: '810505', reqId: '158971', title: 'DECAL - CAPS Senior QA Analyst (810505)' },
  { match: /software test analyst 5.*165025/i, positionNumber: '165025', reqId: '158970', title: 'Software Test Analyst 5 (165025)' },
  { match: /nc fast integration engineer.*808977/i, positionNumber: '808977', reqId: '158969', title: 'NC FAST Integration Engineer (808977)' },
  { match: /network architect.*13297/i, positionNumber: '13297', reqId: '158968', title: 'Network Architect (13297)' },
  { match: /warehouse worker.*66269/i, positionNumber: '66269', reqId: '158967', title: 'Warehouse Worker (66269)' },
  { match: /administrative services assistant.*66213/i, positionNumber: '66213', reqId: '158966', title: 'Administrative Services Assistant (66213)' },
  { match: /vsu.*technical support analyst 2.*810091/i, positionNumber: '810091', reqId: '158965', title: 'VSU - Technical Support Analyst 2 (810091)' },
  { match: /business analyst 3.*529601639r/i, positionNumber: '529601639R', reqId: '158964', title: 'Business Analyst 3 (529601639R)' },
  { match: /ncdot.*product manager.*806296/i, positionNumber: '806296', reqId: '158963', title: 'NCDOT - Product Manager- Junior (806296)' },
  { match: /business analyst 4.*164993/i, positionNumber: '164993', reqId: '158962', title: 'Business Analyst 4 (164993)' },
  { match: /ncdot.*product manager.*810178/i, positionNumber: '810178', reqId: '158961', title: 'NCDOT - Product Manager- Junior (810178)' },
  { match: /network engineer.*project lead.*13296/i, positionNumber: '13296', reqId: '158960', title: 'Network Engineer - Project Lead (13296)' },
  { match: /business analyst.*27267/i, positionNumber: '27267', reqId: '158959', title: 'Business Analyst (27267)' },
  { match: /business analyst.*27266/i, positionNumber: '27266', reqId: '158958', title: 'Business Analyst (27266)' },
  { match: /esl teacher.*66211/i, positionNumber: '66211', reqId: '158957', title: 'ESL Teacher (66211)' },
  { match: /ncdot product manager.*810176/i, positionNumber: '810176', reqId: '158956', title: 'NCDOT Product Manager- Junior (810176)' },
  { match: /security analyst iii.*164703/i, positionNumber: '164703', reqId: '158954', title: 'Security Analyst III (164703)' },
  { match: /network engineer.*project lead.*13295/i, positionNumber: '13295', reqId: '158953', title: 'Network Engineer - Project Lead (13295)' },
  { match: /web accessibility consultant.*66233/i, positionNumber: '66233', reqId: '158952', title: 'Web Accessibility Consultant (66233)' },
  { match: /qa analyst senior.*809973/i, positionNumber: '809973', reqId: '158951', title: 'QA Analyst Senior (809973)' },
  { match: /desktop support ii.*164880/i, positionNumber: '164880', reqId: '158950', title: 'Desktop Support II (164880)' },
  { match: /business analyst 5.*164891/i, positionNumber: '164891', reqId: '158949', title: 'Business Analyst 5 (164891)' },
];

export function resolveReqId(rawId = '', job = {}) {
  const strId = String(rawId || job?.reqId || job?.id || '').replace('J-', '').replace('REQ-', '').trim();
  const title = String(job?.title || '');

  // 1. If strId is already a clean authentic 6-digit JobsInHand ID (e.g. 159023, 158999, 160001), RETURN IT DIRECTLY!
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
  
  // Extract position number if present in string, job object, or description
  let posNum = extractPositionNumber(str);
  if (!posNum && job) {
    posNum = job.positionNumber || job.posNumber || extractPositionNumber('', job.rawDescription || job.description || job.details || '');
  }
  
  // Remove staffing jargon
  let cleaned = str
    .replace(/\bcontractor\b/gi, '')
    .replace(/\bc2c\b/gi, '')
    .replace(/\bw2\b/gi, '')
    .replace(/\bcorp-to-corp\b/gi, '')
    .replace(/\bneed resume\b/gi, '')
    .replace(/\burgent hiring\b/gi, '')
    .replace(/\blocal candidates only\b/gi, '')
    .replace(/\bimmediate hiring\b/gi, '')
    .trim();

  // Remove empty parentheses like (), ( ), (/), (-)
  cleaned = cleaned.replace(/\([\s\-\|\/]*\)/g, '').trim();

  // If position number was present but lost or formatted weirdly, ensure it is at the end: "Title (123456)"
  if (posNum && !cleaned.includes(`(${posNum})`)) {
    // Remove standalone number from title
    cleaned = cleaned.replace(new RegExp(`\\b${posNum}\\b`, 'g'), '').trim();
    cleaned = cleaned.replace(/^[\s\-\|\/]+|[\s\-\|\/]+$/g, '').trim();
    cleaned = `${cleaned} (${posNum})`;
  }

  // Remove trailing/leading hyphens or slashes
  cleaned = cleaned.replace(/^[\s\-\|\/]+|[\s\-\|\/]+$/g, '').replace(/\s+/g, ' ').trim();
  return cleaned;
}

/**
 * Parses raw text and splits it into structured sections.
 */
export function formatJobDescription(rawText = '', jobMeta = {}) {
  const text = typeof rawText === 'string' ? rawText.trim() : '';

  // If already cleanly formatted with our section dividers, return as-is
  if (text.includes('📌 POSITION & CLIENT OVERVIEW') && text.includes('📋 KEY ROLES & RESPONSIBILITIES')) {
    return text;
  }

  if (!text && !jobMeta?.title) return '';

  // ─── Metadata Extraction ───
  let client = jobMeta.client || jobMeta.customer || '';
  let title = cleanJobTitleWithPositionNumber(jobMeta.title || '', jobMeta);
  let location = resolveJobLocation(jobMeta);
  let workMode = jobMeta.workMode || jobMeta.work_mode;
  if (!workMode || ['contract', 'full-time', 'c2c', 'w2', 'any'].includes(String(workMode).toLowerCase())) {
    workMode = (jobMeta.type && !['contract', 'full-time', 'c2c', 'w2'].includes(String(jobMeta.type).toLowerCase())) ? jobMeta.type : 'Onsite';
  }
  let startDate = '';
  let endDate = '';
  let deadline = jobMeta.deadline || '';
  let interviewType = 'Webcam / In-Person';
  let skills = Array.isArray(jobMeta.skills) ? [...jobMeta.skills] : [];
  let preferredSkills = Array.isArray(jobMeta.preferredSkills) ? [...jobMeta.preferredSkills] : [];

  // Extract from text patterns
  const clientMatch = text.match(/Client\s*Info\s*:?\s*([^\n\r<]+)/i) ||
                      text.match(/Client\s*:?\s*([^\n\r<]+)/i) ||
                      text.match(/Agency\s*:?\s*([^\n\r<]+)/i);
  if (clientMatch && !client) client = clientMatch[1].split(/Work\s*Arrangement|Interview|Description/i)[0].trim();

  const startMatch = text.match(/Start\s*date\s*:?\s*([^\n\r<]+)/i);
  if (startMatch) startDate = startMatch[1].split(/End|Submission|Client|Interview/i)[0].trim();

  const endMatch = text.match(/End\s*Date\s*:?\s*([^\n\r<]+)/i);
  if (endMatch) endDate = endMatch[1].split(/Submission|Client|Interview|Description/i)[0].trim();

  const deadlineMatch = text.match(/Submission\s*deadline\s*:?\s*([^\n\r<]+)/i) ||
                           text.match(/Deadline\s*:?\s*([^\n\r<]+)/i);
  if (deadlineMatch) deadline = deadlineMatch[1].split(/Client|Interview|Description|Work/i)[0].trim();

  const workMatch = text.match(/Work\s*Arrangement\s*:?\s*([^\n\r<]+)/i);
  if (workMatch) {
    const rawW = workMatch[1].split(/Interview|Description|Client/i)[0].trim();
    if (rawW && !['contract', 'full-time', 'c2c', 'w2'].includes(rawW.toLowerCase())) {
      workMode = rawW;
    }
  }

  const interviewMatch = text.match(/Interview\s*Type\s*:?\s*([^\n\r<]+)/i) ||
                         text.match(/Interview\s*:?\s*([^\n\r<]+)/i);
  if (interviewMatch) {
    let rawInt = interviewMatch[1].split(/Description\s*:/i)[0].trim();
    rawInt = rawInt.replace(/^[sS]\s*:\s*/, '').trim();
    if (rawInt.length > 70) rawInt = rawInt.substring(0, 70).replace(/[,\.\s]+$/, '');
    if (rawInt && rawInt.length > 2) interviewType = rawInt;
  }

  // Extract Description body
  let mainBody = text;
  const descMatch = text.match(/Description\s*:\s*([\s\S]+)/i);
  if (descMatch && descMatch[1].trim().length > 30) {
    mainBody = descMatch[1].trim();
  } else {
    // Strip header metadata lines from body
    mainBody = mainBody
      .replace(/^.*?Engineer:\s*[^\n]+/i, '')
      .replace(/Start\s*date\s*:[^\n]+/gi, '')
      .replace(/End\s*Date\s*:[^\n]+/gi, '')
      .replace(/Submission\s*deadline\s*:[^\n]+/gi, '')
      .replace(/Client\s*Info\s*:[^\n]+/gi, '')
      .replace(/Client\s*:[^\n]+/gi, '')
      .replace(/Work\s*Arrangement\s*:[^\n]+/gi, '')
      .replace(/Agency\s*Interview\s*Type\s*:[^\n]+/gi, '')
      .replace(/Interview\s*Type\s*:[^\n]+/gi, '')
      .replace(/Note:\s*/gi, '')
      .replace(/\(This job is for -.*?\)/gi, '')
      .replace(/Call\s*502-379-4456.*$/gi, '')
      .replace(/Please provide Requirement id.*$/gi, '')
      .trim();
  }

  // Separate summary paragraph vs responsibilities vs skills
  const rawSentences = mainBody
    .split(/(?<=[.?!])\s+(?=[A-Z])|\n\s*•|\n\s*-|\n\s*\*/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

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
    } else if (sLower.includes('responsible for') || sLower.includes('responsibilities of') || sLower.includes('responsibility includes') || sLower.includes('role involves') || sLower.includes('assist with') || sLower.includes('contributes to') || sLower.includes('collaborate with') || sLower.includes('architected') || sLower.includes('develop') || sLower.includes('oversee') || sLower.includes('ensuring') || sLower.includes('guiding') || sLower.includes('testing')) {
      respLines.push(sentence);
    } else {
      if (summaryLines.length < 2) {
        summaryLines.push(sentence);
      } else {
        respLines.push(sentence);
      }
    }
  });

  // Build clean bullet points for responsibilities
  let bulletedResp = '';
  if (respLines.length > 0) {
    bulletedResp = respLines.map(r => `• ${r.replace(/^[•\-\*\s]+/, '').trim()}`).join('\n');
  } else {
    bulletedResp = `• Oversee end-to-end implementation and support lifecycle in a collaborative environment.\n• Collaborate with cross-functional technical teams, business stakeholders, and project managers.\n• Ensure high standards of system integration, compliance controls, and comprehensive documentation.\n• Support ongoing maintenance, testing, and continuous improvement initiatives.`;
  }

  // Build clean bullet points for required skills
  let bulletedSkills = '';
  if (skills.length > 0) {
    bulletedSkills = skills.map(sk => `• ${sk}`).join('\n');
  } else if (reqSkillLines.length > 0) {
    bulletedSkills = reqSkillLines.map(sk => `• ${sk.replace(/^[•\-\*\s]+/, '').trim()}`).join('\n');
  } else {
    bulletedSkills = `• Core Technical Proficiency in required functional & technical domain\n• Experience with system architecture, workflow design, and access controls\n• Strong problem-solving, documentation, and stakeholder collaboration capabilities`;
  }

  // Summary Text
  const summaryText = summaryLines.join(' ').trim() ||
    `The client is seeking a qualified, results-driven professional to support enterprise operations and solution delivery. This role contributes to project milestones within an agile, collaborative environment.`;

  // Construct Final Beautiful Formatted JD
  const formattedJD = `===============================================================
📌 POSITION & CLIENT OVERVIEW
===============================================================
• Position Title: ${title || jobMeta.title || 'Technical Specialist'}
• Client / Agency: ${client || 'State Agency / Enterprise Client'}
• Work Arrangement: ${workMode || 'Onsite'}
• Interview Type: ${interviewType || 'Webcam / In-Person'}
${startDate ? `• Target Start Date: ${startDate}\n` : ''}${endDate ? `• Target End Date: ${endDate}\n` : ''}${deadline ? `• Submission Deadline: ${deadline}\n` : ''}
===============================================================
🎯 PROJECT SUMMARY & OBJECTIVE
===============================================================
${summaryText}

===============================================================
📋 KEY ROLES & RESPONSIBILITIES
===============================================================
${bulletedResp}

===============================================================
🛠️ REQUIRED TECHNICAL PROFICIENCIES
===============================================================
${bulletedSkills}
${preferredSkills.length > 0 || prefSkillLines.length > 0 ? `
===============================================================
🌟 PREFERRED QUALIFICATIONS & DOMAIN SKILLS
===============================================================
${preferredSkills.length > 0 ? preferredSkills.map(ps => `• ${ps}`).join('\n') : prefSkillLines.map(ps => `• ${ps}`).join('\n')}` : ''}
`;

  return formattedJD.trim();
}
