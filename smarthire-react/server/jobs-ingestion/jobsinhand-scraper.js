/**
 * JobsInHand HTTP Scraper
 * ───────────────────────
 * Fetches today's new job postings from jobsinhand.com/search_jobs.aspx
 * using native HTTPS requests. Falls back to Playwright if blocked.
 *
 * Filters:
 *   - Excludes titles containing "Rebid" (case-insensitive)
 *   - Only includes jobs whose Create date matches today's date
 *   - Limits to latest 10 jobs
 */

import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const BASE_URL = 'https://www.jobsinhand.com';
const SEARCH_URL = `${BASE_URL}/search_jobs.aspx`;
const MAX_JOBS = 30;
const REQUEST_DELAY_MS = 800; // Be polite between requests

// ─── Utilities ───────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gets today's date string in multiple formats for flexible matching.
 * JobsInHand uses: "17-Jun-2026" or "Jun 17, 2026" etc.
 */
function getTodayFormats() {
  const now = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const m = months[now.getMonth()];
  const d = now.getDate();
  const y = now.getFullYear();
  const dd = String(d).padStart(2, '0');
  return [
    `${dd}-${m}-${y}`,        // 17-Jun-2026
    `${d}-${m}-${y}`,         // 17-Jun-2026 (no pad)
    `${m} ${d}, ${y}`,        // Jun 17, 2026
    `${m} ${dd}, ${y}`,       // Jun 17, 2026
    `${d}/${now.getMonth()+1}/${y}`,
    `${dd}/${String(now.getMonth()+1).padStart(2,'0')}/${y}`,
    `${y}-${String(now.getMonth()+1).padStart(2,'0')}-${dd}`,  // ISO
    // Loose match: just dd-Mon or Mon-dd
    `${dd}-${m}`,
    `${d} ${m}`,
  ];
}

/**
 * Returns true if a date string represents today.
 */
function isToday(dateStr) {
  if (!dateStr) return false;
  const s = dateStr.trim().toLowerCase();
  const formats = getTodayFormats();
  for (const fmt of formats) {
    if (s.includes(fmt.toLowerCase())) return true;
  }
  // Try parsing as a real date
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      const today = new Date();
      return (
        parsed.getDate() === today.getDate() &&
        parsed.getMonth() === today.getMonth() &&
        parsed.getFullYear() === today.getFullYear()
      );
    }
  } catch (_) {}
  return false;
}

/**
 * Returns today's ISO date string (YYYY-MM-DD).
 */
function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Strips HTML tags and normalises whitespace.
 */
function cleanHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── HTTP Request Helper ──────────────────────────────────────────────────────

/**
 * Makes an HTTPS GET request. Returns { statusCode, html } or throws.
 */
function httpGet(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const options = {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'identity',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          ...extraHeaders,
        },
        timeout: 30000,
      };

      const req = https.request(options, (res) => {
        // Follow redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let loc = res.headers.location;
          if (!loc.startsWith('http')) {
            loc = new URL(loc, url).href;
          }
          return httpGet(loc, extraHeaders).then(resolve).catch(reject);
        }

        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve({
          statusCode: res.statusCode,
          html: Buffer.concat(chunks).toString('utf-8'),
        }));
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timed out: ${url}`));
      });
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ─── Groq LLM Job Parser ──────────────────────────────────────────────────────

const GROQ_SYSTEM_PROMPT = `You are an expert HR recruitment ATS parsing assistant.
Parse a raw job description (JD) and extract key fields into a clean JSON object.

Extract these fields:
- title: Clean, professional Job Title. Remove rate info, brackets, and staffing jargon like 'Rebid', 'Urgent', 'Immediate hiring', 'W2', 'C2C', 'Contractor', 'Local candidates only', 'Need resume'. Capitalize words properly.
- client: End client company name if mentioned. If not, use "General Client".
- company: The posting/staffing company name if mentioned.
- skills: Array of top 4-6 required technical skills (e.g. ["Python", "Spark", "AWS"]).
- preferredSkills: Array of 2-4 preferred/nice-to-have technical skills if mentioned (e.g. ["Docker", "Kubernetes"]). If none are obvious, return an empty array [].
- budget: Budget rate or pay range (e.g. "$80/hr - $95/hr"). Use "TBD" if not mentioned.
- experience: Experience requirement (e.g. "5+ years"). Use "TBD" if not mentioned.
- location: Work location. Format as "City, ST" (e.g. "Dallas, TX", "Austin, TX"). If 100% remote with no location required, use "Remote". If hybrid, use the city/state (e.g. "Atlanta, GA").
- work_mode: Work location mode, strictly one of: "Remote", "Hybrid", "Onsite". Check if JD mentions "work from home", "remote", "hybrid", "onsite", "in-office", "local to", etc.
- employment_type: The contract type, strictly one of: "Contract", "Full-time", "C2H", "C2C", "W2". Default to "Contract" if unspecified.
- description: A clean 2-3 sentence summary of the role.

Rules:
- Be highly accurate about "work_mode" (Remote, Hybrid, Onsite).
- Be highly accurate about "location". Use 2-letter ST code for states.
- Output ONLY a valid JSON object. No extra text, no markdown.`;

export function fallbackExtractLocationAndWorkMode(text, rawTitle = '') {
  const combined = ((rawTitle || '') + ' ' + (text || '')).toLowerCase();
  
  // 1. Work Mode Detection
  let workMode = 'Onsite';
  if (combined.includes('remote') || combined.includes('work from home') || combined.includes('wfh') || combined.includes('telecommute')) {
    workMode = combined.includes('hybrid') ? 'Hybrid' : 'Remote';
  } else if (combined.includes('hybrid')) {
    workMode = 'Hybrid';
  } else if (combined.includes('onsite') || combined.includes('on-site') || combined.includes('in-office') || combined.includes('in office')) {
    workMode = 'Onsite';
  }

  // 2. Location Detection
  let location = 'Unknown';
  const cityStateRegex = /\b([A-Z][a-zA-Z\s]{2,18}),\s*([A-Z]{2}|[A-Z][a-z]{3,12})\b/g;
  const matches = [...(text || '').matchAll(cityStateRegex)];

  const usStates = new Set(['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']);

  for (const m of matches) {
    const city = m[1].trim();
    const st = m[2].trim().toUpperCase();
    if (usStates.has(st)) {
      location = `${city}, ${st}`;
      break;
    }
  }

  if (location === 'Unknown' && workMode === 'Remote') {
    location = 'Remote';
  }

  return { location, workMode };
}

async function parseJobWithGroq(rawDescription, jobTitle) {
  if (!GROQ_API_KEY) {
    const fallback = fallbackExtractLocationAndWorkMode(rawDescription, jobTitle);
    return {
      title: jobTitle,
      client: 'General Client',
      company: 'JobsInHand',
      skills: [],
      preferredSkills: [],
      budget: 'TBD',
      experience: 'TBD',
      location: fallback.location,
      work_mode: fallback.workMode,
      type: fallback.workMode,
      employment_type: 'Contract',
      description: rawDescription.substring(0, 300),
    };
  }

  const userPrompt = `Parse the following Job Description:\nJob Title Hint: ${jobTitle}\n\n${rawDescription}`;

  const body = JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: GROQ_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 20000,
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
          if (data.error) return reject(new Error(`Groq error: ${data.error.message}`));
          const content = data.choices?.[0]?.message?.content;
          if (!content) return reject(new Error('Empty Groq response'));
          const parsed = JSON.parse(content);
          resolve(parsed);
        } catch (err) {
          reject(new Error(`Failed to parse Groq response: ${err.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Groq API timed out')); });
    req.write(body);
    req.end();
  });
}

// ─── HTML Parsers ─────────────────────────────────────────────────────────────

/**
 * Parses the job listing page and returns raw job rows.
 * Returns array of { title, rawLink, createDateStr }
 */
function parseJobListingPage(html) {
  const jobs = [];

  // JobsInHand renders jobs in a GridView table with alternating row IDs
  // Pattern: spans/cells with job titles as bold links + Create date text
  
  // Strategy 1: Match table rows containing job data
  const rowRegex = /<tr[^>]*>\s*([\s\S]*?)\s*<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];

    // Must have a bold link (job title)
    const titleMatch = rowHtml.match(/<a\s+href=["']?([^"'\s>]+)["']?[^>]*>\s*<b>([\s\S]*?)<\/b>\s*<\/a>/i);
    if (!titleMatch) continue;

    const rawLink = titleMatch[1].trim();
    const title = cleanHtml(titleMatch[2]).trim();

    // Skip empty or obviously non-job links
    if (!title || title.length < 4) continue;
    if (rawLink.includes('mailto:') || rawLink.includes('javascript:')) continue;

    // Extract Create date
    const dateMatch = rowHtml.match(/Create\s+date\s*:?\s*([^\n<,]+)/i);
    const createDateStr = dateMatch ? dateMatch[1].trim() : '';

    // Build proper link
    let link = rawLink;
    if (!link.startsWith('http')) {
      if (!link.startsWith('/')) link = '/' + link;
      link = BASE_URL + link;
    }

    jobs.push({ title, link, createDateStr });
  }

  // Strategy 2: fallback — look for spans with Label1 pattern (from test_scraper.js)
  if (jobs.length === 0) {
    const spanRegex = /id=["']ctl00_Contentpage1_gv_jobs_ctl\d+_Label1["']([\s\S]*?)<\/span>/g;
    let spanMatch;
    while ((spanMatch = spanRegex.exec(html)) !== null) {
      const spanHtml = spanMatch[1];
      const titleLinkMatch = spanHtml.match(/<a\s+href=["']?([^"'\s>]+)["']?[^>]*>\s*<b>([\s\S]*?)<\/b>\s*<\/a>/i);
      const dateMatch = spanHtml.match(/Create date:\s*([^<]+)/i);
      if (!titleLinkMatch) continue;

      let link = titleLinkMatch[1].trim();
      const title = cleanHtml(titleLinkMatch[2]).trim();
      const createDateStr = dateMatch ? dateMatch[1].trim() : '';

      if (!link.startsWith('http')) {
        if (!link.startsWith('/')) link = '/' + link;
        link = BASE_URL + link;
      }

      jobs.push({ title, link, createDateStr });
    }
  }

  return jobs;
}

/**
 * Parses a job detail page and returns the raw description text.
 */
function parseJobDetailPage(html) {
  // Try multiple selector patterns used by JobsInHand
  const patterns = [
    /id=["']ctl00_Contentpage1_lbl_descr["'][^>]*>([\s\S]*?)<\/span>/i,
    /id=["']ctl00_Contentpage1_lbl_description["'][^>]*>([\s\S]*?)<\/span>/i,
    /class=["']job-description["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]+id=["']job_desc["'][^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return cleanHtml(match[1]);
  }

  // Last resort: get the largest text block
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    const bodyText = cleanHtml(bodyMatch[1]);
    // Find paragraphs with job-like content
    const lines = bodyText.split('\n').filter(l => l.trim().length > 20);
    return lines.slice(5, 60).join('\n');
  }

  return '';
}

// ─── Block Detection ──────────────────────────────────────────────────────────

/**
 * Detects if the response is a CAPTCHA or block page.
 */
function isBlockedResponse(html, statusCode) {
  if (statusCode === 403 || statusCode === 429 || statusCode === 503) return true;
  if (!html) return true;
  const lower = html.toLowerCase();
  return (
    lower.includes('captcha') ||
    lower.includes('access denied') ||
    lower.includes('cloudflare') ||
    lower.includes('rate limit') ||
    lower.includes('robot') ||
    lower.includes('are you human') ||
    lower.length < 500  // suspiciously short response
  );
}

// ─── Main HTTP Scraper ────────────────────────────────────────────────────────

/**
 * Scrapes JobsInHand using HTTP requests.
 * Returns { jobs: [], mode: 'http', blocked: false } or throws.
 */
export async function scrapeViaHttp(logger = console.log) {
  logger(`[scraper] Fetching job listing page via HTTP...`);
  logger(`[scraper] URL: ${SEARCH_URL}`);

  const { statusCode, html } = await httpGet(SEARCH_URL);
  logger(`[scraper] Response status: ${statusCode}, HTML length: ${html.length} chars`);

  if (isBlockedResponse(html, statusCode)) {
    logger(`[scraper] ⚠️  HTTP scraping blocked (status ${statusCode}). Playwright fallback needed.`);
    return { jobs: [], mode: 'http', blocked: true };
  }

  // Parse the listing page
  let rawJobs = parseJobListingPage(html);
  logger(`[scraper] Found ${rawJobs.length} total job entries on the listing page.`);

  // Filter 1: Remove "Rebid" jobs
  const beforeRebid = rawJobs.length;
  rawJobs = rawJobs.filter(j => !/rebid/i.test(j.title));
  const rebidCount = beforeRebid - rawJobs.length;
  logger(`[scraper] Filtered ${rebidCount} Rebid listings. Remaining: ${rawJobs.length}`);

  // Filter 2: Only today's jobs (fallback to all latest jobs if today count is 0)
  const beforeDate = rawJobs.length;
  const todayJobs = rawJobs.filter(j => isToday(j.createDateStr));
  const notTodayCount = beforeDate - todayJobs.length;
  logger(`[scraper] Filtered ${notTodayCount} jobs not created today. Today's jobs: ${todayJobs.length} (out of ${rawJobs.length} active)`);

  const eligibleJobs = todayJobs.length > 0 ? todayJobs : rawJobs;
  if (todayJobs.length === 0) {
    logger(`[scraper] ℹ️  Using latest ${rawJobs.length} active jobs from JobsInHand.`);
  }

  // Limit to MAX_JOBS
  const jobsToProcess = eligibleJobs.slice(0, MAX_JOBS);
  logger(`[scraper] Processing ${jobsToProcess.length} jobs for full detail extraction...`);

  // Fetch detail pages and parse with LLM
  const results = [];
  for (let i = 0; i < jobsToProcess.length; i++) {
    const job = jobsToProcess[i];
    logger(`[scraper] [${i + 1}/${jobsToProcess.length}] Fetching: ${job.title}`);

    try {
      await sleep(REQUEST_DELAY_MS); // polite delay

      const { statusCode: detailStatus, html: detailHtml } = await httpGet(job.link);

      if (isBlockedResponse(detailHtml, detailStatus)) {
        logger(`[scraper] ⚠️  Detail page blocked for: ${job.title}`);
        results.push({ ...job, error: 'Detail page blocked', skipped: true });
        continue;
      }

      const rawDescription = parseJobDetailPage(detailHtml);

      if (!rawDescription || rawDescription.length < 50) {
        logger(`[scraper] ⚠️  Could not extract description for: ${job.title}`);
        results.push({ ...job, rawDescription: '', skipped: true, error: 'Empty description' });
        continue;
      }

      logger(`[scraper] Parsing "${job.title}" with Groq LLM...`);
      const parsed = await parseJobWithGroq(rawDescription, job.title);

      const fallback = fallbackExtractLocationAndWorkMode(rawDescription, job.title);
      const finalLocation = (parsed.location && parsed.location !== 'Unknown') ? parsed.location : fallback.location;
      const finalWorkMode = parsed.work_mode || parsed.workMode || (['Remote','Hybrid','Onsite'].includes(parsed.type) ? parsed.type : fallback.workMode);
      const finalEmpType = parsed.employment_type || (['Contract','Full-time','C2H','C2C','W2'].includes(parsed.type) ? parsed.type : 'Contract');

      results.push({
        title: parsed.title || job.title,
        client: parsed.client || 'General Client',
        company: parsed.company || '',
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        preferredSkills: Array.isArray(parsed.preferredSkills) ? parsed.preferredSkills : [],
        budget: parsed.budget || 'TBD',
        experience: parsed.experience || 'TBD',
        location: finalLocation,
        work_mode: finalWorkMode,
        workMode: finalWorkMode,
        type: finalWorkMode,
        employment_type: finalEmpType,
        description: parsed.description || '',
        rawDescription,
        applyUrl: job.link,
        postDate: job.createDateStr,
        post_date: todayISODate(),
        source: 'jobsinhand',
        status: 'Active',
        skipped: false,
        error: null,
      });

      logger(`[scraper] ✅ Parsed: ${parsed.title || job.title} @ ${finalLocation} [${finalWorkMode}]`);
    } catch (err) {
      logger(`[scraper] ❌ Failed to process "${job.title}": ${err.message}`);
      results.push({
        title: job.title,
        applyUrl: job.link,
        postDate: job.createDateStr,
        post_date: todayISODate(),
        source: 'jobsinhand',
        status: 'Active',
        skipped: true,
        error: err.message,
      });
    }
  }

  const successful = results.filter(r => !r.skipped);
  logger(`[scraper] HTTP scrape complete. Successful: ${successful.length}, Failed: ${results.length - successful.length}`);

  return {
    jobs: successful,
    allAttempted: results,
    mode: 'http',
    blocked: false,
    rebidFiltered: rebidCount,
    notTodayFiltered: notTodayCount,
    totalFound: rawJobs.length + rebidCount,
  };
}

/**
 * Main export: scrape with comprehensive multi-page extraction.
 * Uses Playwright browser automation to paginate all pages (1 to 5+) and guarantee zero missing reqs.
 */
export async function scrapeJobsInHand(logger = console.log) {
  try {
    logger(`[scraper] 🤖 Initiating Playwright multi-page engine for complete requisition extraction...`);
    const { scrapeViaPlaywright } = await import('./playwright-scraper.js');
    const playwrightResult = await scrapeViaPlaywright(logger);
    return { ...playwrightResult, mode: 'playwright' };
  } catch (err) {
    logger(`[scraper] ⚠️ Playwright attempt failed (${err.message}). Trying HTTP scraper fallback...`);
    const httpResult = await scrapeViaHttp(logger);
    return httpResult;
  }
}

