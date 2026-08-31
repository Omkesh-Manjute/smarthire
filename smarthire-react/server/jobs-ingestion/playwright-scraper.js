/**
 * JobsInHand Playwright Fallback Scraper
 * ────────────────────────────────────────
 * Used automatically when HTTP scraping is blocked by anti-bot protection.
 * Launches a real headless Chromium browser to scrape the site.
 */

import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = 'https://www.jobsinhand.com';
const SEARCH_URL = `${BASE_URL}/search_jobs.aspx`;
const MAX_JOBS = 10;

const GROQ_API_KEY = process.env.GROQ_API_KEY;

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
  let workMode = 'Onsite';
  if (combined.includes('remote') || combined.includes('work from home') || combined.includes('wfh') || combined.includes('telecommute')) {
    workMode = combined.includes('hybrid') ? 'Hybrid' : 'Remote';
  } else if (combined.includes('hybrid')) {
    workMode = 'Hybrid';
  } else if (combined.includes('onsite') || combined.includes('on-site') || combined.includes('in-office') || combined.includes('in office')) {
    workMode = 'Onsite';
  }

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTodayISODate() {
  return new Date().toISOString().slice(0, 10);
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const now = new Date();
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const s = dateStr.trim().toLowerCase();
  
  // Check "17-jun-2026" format
  const m1 = s.match(/(\d{1,2})-([a-z]{3})-(\d{4})/);
  if (m1) {
    const day = parseInt(m1[1]);
    const monthIdx = months.indexOf(m1[2]);
    const year = parseInt(m1[3]);
    return day === now.getDate() && monthIdx === now.getMonth() && year === now.getFullYear();
  }
  
  // Try native date parse
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return (
        parsed.getDate() === now.getDate() &&
        parsed.getMonth() === now.getMonth() &&
        parsed.getFullYear() === now.getFullYear()
      );
    }
  } catch (_) {}

  return false;
}

function cleanText(txt) {
  return (txt || '').replace(/\s+/g, ' ').trim();
}

/**
 * Scrapes JobsInHand via Playwright headless Chromium.
 */
export async function scrapeViaPlaywright(logger = console.log) {
  let browser;
  try {
    const { chromium } = await import('playwright');
    logger(`[playwright] Launching headless Chromium...`);
    
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
      ],
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'en-US',
    });

    const page = await context.newPage();
    
    // Hide automation markers
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    logger(`[playwright] Navigating to ${SEARCH_URL}...`);
    await page.goto(SEARCH_URL, { waitUntil: 'networkidle', timeout: 45000 });
    await sleep(2000);

    logger(`[playwright] Page loaded. Extracting job listings...`);

    // Extract all job rows from the page
    const rawJobs = await page.evaluate(() => {
      const jobs = [];
      
      // Look for table rows with job links
      const rows = document.querySelectorAll('tr');
      rows.forEach(row => {
        const boldLinks = row.querySelectorAll('a > b, b > a');
        if (boldLinks.length === 0) return;

        const link = row.querySelector('a[href]');
        if (!link) return;

        const titleEl = row.querySelector('b');
        if (!titleEl) return;

        const title = titleEl.innerText.trim();
        const href = link.getAttribute('href') || '';
        const rowText = row.innerText || '';

        // Find Create date in row text
        const dateMatch = rowText.match(/Create\s+date\s*:?\s*([^\n,]+)/i);
        const createDateStr = dateMatch ? dateMatch[1].trim() : '';

        if (title.length > 3 && href && !href.includes('mailto:')) {
          jobs.push({ title, href, createDateStr, rowText: rowText.substring(0, 300) });
        }
      });

      return jobs;
    });

    logger(`[playwright] Found ${rawJobs.length} raw job entries.`);

    // Filter Rebid
    const noRebid = rawJobs.filter(j => !/rebid/i.test(j.title));
    logger(`[playwright] After Rebid filter: ${noRebid.length}`);

    // Filter today's jobs (fallback to all latest non-rebid jobs if today is 0)
    const todayJobs = noRebid.filter(j => isToday(j.createDateStr));
    logger(`[playwright] Today's jobs: ${todayJobs.length} (out of ${noRebid.length} active listings)`);

    const eligibleJobs = todayJobs.length > 0 ? todayJobs : noRebid;
    const jobsToProcess = eligibleJobs.slice(0, MAX_JOBS);

    const results = [];

    for (let i = 0; i < jobsToProcess.length; i++) {
      const job = jobsToProcess[i];
      logger(`[playwright] [${i+1}/${jobsToProcess.length}] Processing: ${job.title}`);

      try {
        let fullLink = job.href;
        if (!fullLink.startsWith('http')) {
          if (!fullLink.startsWith('/')) fullLink = '/' + fullLink;
          fullLink = BASE_URL + fullLink;
        }

        const detailPage = await context.newPage();
        await detailPage.goto(fullLink, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(1000);

        // Extract description
        const description = await detailPage.evaluate(() => {
          const selectors = [
            '#ctl00_Contentpage1_lbl_descr',
            '#ctl00_Contentpage1_lbl_description',
            '.job-description',
            '[id*="descr"]',
            '[class*="description"]',
          ];
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.length > 50) return el.innerText.trim();
          }
          return document.body.innerText.substring(0, 3000);
        });

        await detailPage.close();

        logger(`[playwright] Parsing "${job.title}" with Groq LLM...`);
        const parsed = await parseJobWithGroq(description, job.title);

        const fallback = fallbackExtractLocationAndWorkMode(description, job.title);
        const finalLocation = (parsed.location && parsed.location !== 'Unknown') ? parsed.location : fallback.location;
        const finalWorkMode = parsed.work_mode || parsed.workMode || (['Remote','Hybrid','Onsite'].includes(parsed.type) ? parsed.type : fallback.workMode);
        const finalEmpType = parsed.employment_type || (['Contract','Full-time','C2H','C2C','W2'].includes(parsed.type) ? parsed.type : 'Contract');

        results.push({
          title: parsed.title || cleanText(job.title),
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
          description: parsed.description || description.substring(0, 500),
          rawDescription: description,
          applyUrl: fullLink,
          postDate: job.createDateStr,
          post_date: getTodayISODate(),
          source: 'jobsinhand',
          status: 'Active',
          skipped: false,
          error: null,
        });

        logger(`[playwright] ✅ Extracted and parsed: ${parsed.title || job.title} @ ${finalLocation} [${finalWorkMode}]`);
      } catch (err) {
        logger(`[playwright] ❌ Failed: ${job.title} — ${err.message}`);
        results.push({
          title: cleanText(job.title),
          applyUrl: job.href,
          postDate: job.createDateStr,
          post_date: getTodayISODate(),
          source: 'jobsinhand',
          status: 'Active',
          skipped: true,
          error: err.message,
        });
      }

      await sleep(800);
    }

    await browser.close();

    const successful = results.filter(r => !r.skipped);
    logger(`[playwright] Playwright scrape complete. Successful: ${successful.length}`);

    return {
      jobs: successful,
      allAttempted: results,
      mode: 'playwright',
      blocked: false,
      rebidFiltered: rawJobs.length - noRebid.length,
      notTodayFiltered: noRebid.length - todayJobs.length,
      totalFound: rawJobs.length,
    };

  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
    logger(`[playwright] ❌ Fatal Playwright error: ${err.message}`);
    throw err;
  }
}
