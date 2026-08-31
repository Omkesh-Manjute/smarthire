/**
 * formatJobDescription.js
 * ───────────────────────
 * Formats raw, messy Job Descriptions into clean, professional,
 * structured sections with clear headings and bullet points.
 */

export const KNOWN_TITLE_MAP = [
  { match: /junior java|java.*developer.*test/i, positionNumber: '807791', reqId: '158999', title: 'NC FAST Junior Java Developer/Test Engineer (807791)' },
  { match: /system(?:s)? administrator ii/i, positionNumber: '808800', reqId: '158885', title: 'NC DHHS System Administrator II (808800)' },
  { match: /power platform/i, positionNumber: '805119', reqId: '158894', title: 'DHHS MS Power Platform Developer Architect (805119)' },
  { match: /senior aws developer|aws senior/i, positionNumber: '808496', reqId: '158950', title: 'NC DHHS AWS Senior Developer (808496)' },
  { match: /aws\s*\/?\s*java developer/i, positionNumber: '809716', reqId: '158776', title: 'NC DHHS AWS/Java Developer (809716)' },
  { match: /system analyst 4/i, positionNumber: '806546', reqId: '158611', title: 'VRS - System Analyst 4 (806546)' },
  { match: /world language/i, positionNumber: '809432', reqId: '158699', title: 'World Language Project Manager (809432)' },
  { match: /salesforce solution engineer/i, positionNumber: '809821', reqId: '158673', title: 'Salesforce Solution Engineer (809821)' },
  { match: /senior business analyst/i, positionNumber: '810558', reqId: '158674', title: 'Senior Business Analyst (810558)' },
  { match: /data analyst\s*\/\s*business system/i, positionNumber: '809112', reqId: '158655', title: 'Data Analyst / Business System Analyst (809112)' },
];

export function resolveReqId(rawId = '', job = {}) {
  const strId = String(rawId || job?.reqId || job?.id || '').replace('J-', '').replace('REQ-', '').trim();
  const title = String(job?.title || '');

  // 1. Specific known legacy map
  const idMap = {
    '84387': '158999',
    '84386': '158885',
    '84385': '158894',
    '84384': '158950',
    '84383': '158776',
    '84379': '158699',
    '84380': '158673',
    '84381': '158674',
    '84382': '158655',
    '84378': '158611',
  };
  if (idMap[strId]) return idMap[strId];

  // 2. Direct match by title in known title map
  for (const item of KNOWN_TITLE_MAP) {
    if (item.match.test(title)) {
      return item.reqId;
    }
  }

  // 3. If strId is already a clean authentic 6-digit JobsInHand ID starting with 158 or 159 (e.g. 158999), return it!
  if (/^15[89]\d{3}$/.test(strId)) {
    return strId;
  }

  // 4. If strId is a 6-digit number and NOT a timestamp starting with 178..., return it!
  if (/^\d{6}$/.test(strId) && !strId.startsWith('178')) {
    return strId;
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
