/**
 * InfoOrigin Staffing HTTP Scraper
 * ─────────────────────────────────
 * Fetches open position requirements from staffingorigin.com / infoorigin.infoapps.io
 *
 * Source URL: https://staffingorigin.com/OpenPosition
 * API Endpoint: https://infoorigin.infoapps.io/api-staffing/get/requirement
 * Countries API: https://infoorigin.infoapps.io/api-staffing/get/country
 */

import https from 'https';

const API_REQUIREMENT_URL = 'https://infoorigin.infoapps.io/api-staffing/get/requirement';
const API_COUNTRY_URL = 'https://infoorigin.infoapps.io/api-staffing/get/country';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      }
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (err) {
          reject(new Error(`JSON parse error from ${url}: ${err.message}`));
        }
      });
    }).on('error', reject).on('timeout', () => reject(new Error(`Timeout connecting to ${url}`)));
  });
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractSkillsFromHtml(html, title = '') {
  const skills = new Set();
  if (!html) return [];

  // 1. Look for <li> tags with short skill-like descriptions
  const liMatches = [...html.matchAll(/<li>(.*?)<\/li>/gi)];
  for (const m of liMatches) {
    const text = m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').trim();
    if (!text) continue;

    // Direct skill bullet (e.g. "7+ years in JAVA", "SQL Server Advanced Preferred", "Linux RHEL 8.10")
    if (text.length <= 40 && !text.includes('expected to perform') && !text.includes('Client is seeking')) {
      const cleaned = text
        .replace(/^(?:Required|Preferred|Intermediate|Advanced|Hands-on|Must have|Experience in)\s*:?\s*/i, '')
        .replace(/\s+(?:Required|Preferred|Intermediate|Advanced)$/i, '')
        .trim();
      if (cleaned.length >= 2 && cleaned.length <= 35) {
        skills.add(cleaned);
      }
    } else if (text.length <= 80) {
      // Check for patterns like "X+ years in JAVA", "Proficiency in X"
      const yrsMatch = text.match(/\b(?:\d+\+?\s*years?(?:\s*of)?\s*(?:in|with|experience)?\s*)([a-zA-Z0-9#\+\.\s]{2,25})/i);
      if (yrsMatch && yrsMatch[1]) {
        skills.add(yrsMatch[1].trim());
      }
    }
  }

  // 2. Scan for common tech stack keywords in HTML and title
  const techKeywords = [
    'Java', 'Spring Boot', 'Python', 'React', 'Angular', 'Vue.js', 'Node.js', 'JavaScript', 'TypeScript',
    'C#', '.NET', 'ASP.NET', 'SQL Server', 'Oracle', 'PostgreSQL', 'MySQL', 'MongoDB', 'AWS', 'Azure',
    'GCP', 'DevOps', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Jira', 'Agile', 'Scrum', 'Linux',
    'Red Hat', 'RHEL', 'Applinx', 'Adabas', 'Salesforce', 'ServiceNow', 'Power BI', 'Tableau', 'Snowflake',
    'ETL', 'Informatica', 'QA Testing', 'Selenium', 'Postman', 'Cypress', 'Network Engineer', 'Cisco',
    'Firewall', 'Cybersecurity', 'Business Analyst', 'Project Manager', 'Data Analyst', 'Hardware Asset'
  ];

  const fullText = `${title} ${stripHtml(html)}`;
  for (const kw of techKeywords) {
    const regex = new RegExp(`\\b${kw.replace(/[\.\+\#]/g, '\\$&')}\\b`, 'i');
    if (regex.test(fullText)) {
      skills.add(kw);
    }
  }

  const result = Array.from(skills);
  return result.length > 0 ? result.slice(0, 8) : ['IT Professional', 'Enterprise Systems'];
}

export async function scrapeInfoOrigin(logger = console.log) {
  logger('🌐 Connecting to Staffing Origin / InfoOrigin API...');
  
  // 1. Fetch Countries
  let countryMap = { '2': 'USA', '1': 'India', '76415c4c-6968-454c-aabc-36c68a9b1f06': 'India' };
  try {
    const countries = await fetchJson(API_COUNTRY_URL);
    if (Array.isArray(countries)) {
      countries.forEach(c => {
        if (c.COUNTRY_UUID && c.COUNTRY_NAME) countryMap[c.COUNTRY_UUID] = c.COUNTRY_NAME;
        if (c.COUNTRY_ID && c.COUNTRY_NAME) countryMap[String(c.COUNTRY_ID)] = c.COUNTRY_NAME;
        if (c.COUNTRY_CODE && c.COUNTRY_NAME) countryMap[c.COUNTRY_CODE] = c.COUNTRY_NAME;
      });
      logger(`  ✅ Loaded ${countries.length} country definitions.`);
    }
  } catch (err) {
    logger(`  ⚠️ Country load warning: ${err.message} (using fallback mapping)`);
  }

  // 2. Fetch Requirements
  const rawJobs = await fetchJson(API_REQUIREMENT_URL);
  if (!Array.isArray(rawJobs)) {
    throw new Error('Invalid response from InfoOrigin requirement API: expected array');
  }

  logger(`  ✅ Fetched ${rawJobs.length} total requirements from InfoOrigin.`);

  const jobs = [];
  for (const j of rawJobs) {
    if (!j.REQ_ID && !j.REQUIREMENT_UUID) continue;

    const reqId = String(j.REQ_ID || j.REQUIREMENT_UUID);
    const title = (j.PSTN_TITLE || 'IT Specialist').trim();
    const rawLoc = (j.PSTN_LCTN || '').trim();
    const isIndia = j.COUNTRY === '76415c4c-6968-454c-aabc-36c68a9b1f06' ||
      j.COUNTRY === '1' ||
      j.COUNTRY === 1 ||
      String(countryMap[j.COUNTRY] || '').toLowerCase() === 'india' ||
      /(?:pune|delhi|noida|hyderabad|bangalore|bengaluru|mumbai|gondia|gurgaon|gurugram|\bmh\b|\bdl\b|\bup\b|\bts\b|\bka\b)/i.test(rawLoc);
    const countryName = isIndia ? 'India' : (countryMap[j.COUNTRY] || (j.COUNTRY === '2' ? 'USA' : 'USA'));
    const location = (rawLoc || (isIndia ? 'India' : 'USA')).trim();
    const workMode = (j.WORK_LOCATION_PREFERENCE || 'Onsite').trim();
    const jobType = (j.PSTN_TYP || 'Contract').trim();
    const rate = (j.PSTN_RATE || 'Market Rate').trim();
    const duration = (j.PSTN_DURTN || 'Long Term').trim();
    const interviewType = (j.INTVW_TYP || 'Video or In Person').trim();
    const rawDesc = j.INTERNAL_JOB_DESCRIPTION || '';
    const cleanDesc = stripHtml(rawDesc);
    const skills = extractSkillsFromHtml(rawDesc, title);

    const jobObj = {
      id: reqId,
      reqId: reqId,
      title: title,
      client: 'InfoOrigin',
      company: 'InfoOrigin',
      customer: 'InfoOrigin',
      source: 'InfoOrigin',
      source_url: 'https://staffingorigin.com/OpenPosition',
      applyUrl: 'https://staffingorigin.com/OpenPosition',
      location: location,
      country: countryName,
      countryId: j.COUNTRY,
      type: jobType,
      workMode: workMode,
      work_mode: workMode,
      employment_type: jobType,
      budget: rate,
      rate: rate,
      payRate: rate.replace(/[^0-9]/g, '') || 'Market Rate',
      billRate: rate,
      duration: duration,
      interviewType: interviewType,
      experience: '5+ years',
      skills: skills,
      preferredSkills: [],
      description: cleanDesc,
      rawDescription: rawDesc,
      htmlDescription: rawDesc,
      status: 'Active',
      postDate: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      post_date: new Date().toISOString().slice(0, 10),
      ingested_at: new Date().toISOString()
    };

    jobs.push(jobObj);
  }

  logger(`  🎉 Successfully processed ${jobs.length} InfoOrigin jobs.`);
  return {
    source: 'InfoOrigin',
    totalFound: rawJobs.length,
    jobs: jobs
  };
}
