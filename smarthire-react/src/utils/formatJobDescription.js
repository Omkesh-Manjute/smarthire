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
  const strId = String(rawId || job.reqId || job.id || '').replace('J-', '').trim();
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

  // Match by title
  const title = String(job.title || '');
  for (const item of KNOWN_TITLE_MAP) {
    if (item.match.test(title)) {
      return item.reqId;
    }
  }
  return strId || '158999';
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
  let title = jobMeta.title || '';
  let location = jobMeta.location || '';
  let workMode = jobMeta.workMode || jobMeta.work_mode || jobMeta.type || 'Hybrid';
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
  if (clientMatch && !client) client = clientMatch[1].trim();

  const startMatch = text.match(/Start\s*date\s*:?\s*([^\n\r<]+)/i);
  if (startMatch) startDate = startMatch[1].trim();

  const endMatch = text.match(/End\s*Date\s*:?\s*([^\n\r<]+)/i);
  if (endMatch) endDate = endMatch[1].trim();

  const deadlineMatch = text.match(/Submission\s*deadline\s*:?\s*([^\n\r<]+)/i) ||
                           text.match(/Deadline\s*:?\s*([^\n\r<]+)/i);
  if (deadlineMatch) deadline = deadlineMatch[1].trim();

  const workMatch = text.match(/Work\s*Arrangement\s*:?\s*([^\n\r<]+)/i);
  if (workMatch) workMode = workMatch[1].trim();

  const interviewMatch = text.match(/Interview\s*Type\s*:?\s*([^\n\r<]+)/i) ||
                             text.match(/Interview\s*:?\s*([^\n\r<]+)/i);
  if (interviewMatch) interviewType = interviewMatch[1].trim();

  // Extract Description body
  let mainBody = text;

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
    .replace(/Description:\s*/gi, '')
    .replace(/\(This job is for -.*?\)/gi, '')
    .replace(/Call\s*502-379-4456.*$/gi, '')
    .replace(/Please provide Requirement id.*$/gi, '')
    .trim();

  // Separate summary paragraph vs responsibilities vs skills
  const sentences = mainBody
    .split(/(?<=[.?!])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  let summaryLines = [];
  let respLines = [];
  let reqSkillLines = [];
  let prefSkillLines = [];

  sentences.forEach(sentence => {
    const sLower = sentence.toLowerCase();
    if (sLower.includes('primary skills necessary') || sLower.includes('must have') || sLower.includes('required skills') || sLower.includes('proficient in') || sLower.includes('solid understanding of')) {
      reqSkillLines.push(sentence);
    } else if (sLower.includes('additional skills beyond') || sLower.includes('nice to have') || sLower.includes('preferred') || sLower.includes('familiarity with')) {
      prefSkillLines.push(sentence);
    } else if (sLower.includes('responsible for') || sLower.includes('responsibilities of') || sLower.includes('role involves') || sLower.includes('assist with') || sLower.includes('contributes to') || sLower.includes('collaborate with') || sLower.includes('architected') || sLower.includes('develop') || sLower.includes('testing')) {
      respLines.push(sentence);
    } else {
      if (summaryLines.length < 3) {
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
    bulletedResp = `• Assist with the end-to-end development, testing, and implementation lifecycle in an agile environment.\n• Responsible for writing test scripts, manual/automated testing, and debugging software solutions.\n• Collaborate with cross-functional technical teams, business analysts, and project managers across sprint cycles.\n• Ensure high code quality, system performance, adherence to SDLC standards, and comprehensive documentation.`;
  }

  // Build clean bullet points for required skills
  let bulletedSkills = '';
  if (skills.length > 0) {
    bulletedSkills = skills.map(sk => `• ${sk}`).join('\n');
  } else if (reqSkillLines.length > 0) {
    bulletedSkills = reqSkillLines.map(sk => `• ${sk.replace(/^[•\-\*\s]+/, '').trim()}`).join('\n');
  } else {
    bulletedSkills = `• Core Technical Proficiency in required development & testing tools\n• Solid understanding of Object-Oriented Design & Data Structures\n• Experience with Software Development Lifecycle (SDLC) & Version Control (Git)\n• Strong problem-solving and analytical capabilities`;
  }

  // Summary Text
  const summaryText = summaryLines.join(' ').trim() ||
    `The client is seeking a qualified, results-driven professional to support enterprise application development and operations. This resource contributes to the full project lifecycle within a collaborative agile environment.`;

  // Construct Final Beautiful Formatted JD
  const formattedJD = `===============================================================
📌 POSITION & CLIENT OVERVIEW
===============================================================
• Position Title: ${title || jobMeta.title || 'Technical Specialist'}
• Client / Agency: ${client || 'State Agency / Enterprise Client'}
• Work Arrangement: ${workMode || 'Hybrid'}
• Interview Type: ${interviewType || 'Webcam / In-Person Only'}
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
