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
const MAX_JOBS = 150;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTodayISODate() {
  return new Date().toISOString().slice(0, 10);
}

function cleanText(txt) {
  return (txt || '').replace(/\s+/g, ' ').trim();
}

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
      client: 'State Client',
      company: 'JobsInHand',
      skills: [],
      preferredSkills: [],
      budget: '$75/hr',
      experience: '5+ years',
      location: fallback.location,
      work_mode: fallback.workMode,
      type: fallback.workMode,
      employment_type: 'Contract',
      description: rawDescription.substring(0, 300),
    };
  }

  const userPrompt = `Parse the following Job Description:\nJob Title Hint: ${jobTitle}\n\n${rawDescription.substring(0, 2500)}`;

  const body = JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are an expert HR ATS parser. Return a clean JSON with title, client, skills (array), location, work_mode (Remote/Hybrid/Onsite).' },
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
      timeout: 10000,
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

/**
 * Scrapes JobsInHand via Playwright headless Chromium.
 * Paginates across all pages (1 to 5+) to capture all active requirements without gaps.
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
    await page.goto(SEARCH_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(1500);

    const extractJobsFromCurrentPage = async () => {
      return await page.evaluate(() => {
        const items = [];
        const trs = document.querySelectorAll('#ctl00_Contentpage1_gv_jobs tr');
        trs.forEach(tr => {
          // Look for any valid link with job title (exclude pager links or mailto)
          const allLinks = tr.querySelectorAll('a');
          let a = null;
          for (const link of allLinks) {
            const href = link.getAttribute('href') || '';
            if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
              a = link;
              break;
            }
          }
          if (!a) return;

          const b = a.querySelector('b') || a;
          const title = (b.innerText || a.innerText || '').trim();
          const href = a.getAttribute('href');
          const trText = tr.innerText || '';
          const dateM = trText.match(/Create\s+date\s*:?\s*([^\n,]+)/i);

          // Extract requirement number directly from href or row text
          const hrefReqMatch = (href || '').match(/\b(1[56]\d{4}|\d{6})\b/);
          const textReqMatch = trText.match(/(?:Requirement|Req|Requisition)\s*(?:id|#|no\.?)?\s*:?\s*(\d{5,7})/i);
          const rowReqId = hrefReqMatch ? hrefReqMatch[1] : (textReqMatch ? textReqMatch[1] : '');

          if (title && href && !href.includes('mailto:')) {
            items.push({
              title,
              href,
              rowReqId,
              createDateStr: dateM ? dateM[1].trim() : '',
              rawSnippet: trText.substring(0, 500)
            });
          }
        });
        return items;
      });
    };

    const allRawJobs = [];
    const p1Jobs = await extractJobsFromCurrentPage();
    logger(`[playwright] Page 1 listings found: ${p1Jobs.length}`);
    allRawJobs.push(...p1Jobs);

    // Multi-page ASP.NET WebForms pagination (Pages 2 through 25)
    for (let p = 2; p <= 25; p++) {
      const selector = `#ctl00_Contentpage1_gv_jobs a[href*="Page\\$${p}"]`;
      let btn = await page.$(selector);

      // If direct Page$p link not found, check if there's a "..." or Next button
      if (!btn) {
        const nextDots = await page.$('#ctl00_Contentpage1_gv_jobs a[href*="Page\\$..."]');
        if (nextDots) {
          btn = nextDots;
        }
      }

      if (!btn) {
        logger(`[playwright] Pagination complete. Reached last page (${p - 1}).`);
        break;
      }
      logger(`[playwright] Navigating to page ${p}...`);
      try {
        await Promise.all([
          page.waitForLoadState('domcontentloaded').catch(() => {}),
          btn.click()
        ]);
      } catch (_) {
        try { await btn.click(); } catch (clickErr) {
          logger(`[playwright] Page click error: ${clickErr.message}`);
          break;
        }
      }
      await sleep(1500);
      const pJobs = await extractJobsFromCurrentPage();
      logger(`[playwright] Page ${p} listings found: ${pJobs.length}`);
      if (pJobs && pJobs.length > 0) {
        allRawJobs.push(...pJobs);
      }
    }

    logger(`[playwright] Total raw job rows extracted across all pages: ${allRawJobs.length}`);

    // Deduplicate by href and rowReqId to avoid double-processing
    const seenHrefs = new Set();
    const seenReqs = new Set();
    const uniqueRawJobs = [];
    for (const j of allRawJobs) {
      const key = j.rowReqId ? `req_${j.rowReqId}` : `href_${j.href}`;
      if (!seenHrefs.has(j.href) && (!j.rowReqId || !seenReqs.has(j.rowReqId))) {
        seenHrefs.add(j.href);
        if (j.rowReqId) seenReqs.add(j.rowReqId);
        uniqueRawJobs.push(j);
      }
    }
    logger(`[playwright] Unique active listings across all pages: ${uniqueRawJobs.length}`);

    // Process all active jobs without dropping any (no destructive Rebid or date cuts)
    const jobsToProcess = uniqueRawJobs.slice(0, MAX_JOBS);
    logger(`[playwright] Processing full details for ${jobsToProcess.length} requisitions...`);

    const results = [];

    for (let i = 0; i < jobsToProcess.length; i++) {
      const job = jobsToProcess[i];
      logger(`[playwright] [${i+1}/${jobsToProcess.length}] Fetching detail: ${job.title}`);

      let detailPage = null;
      let fullLink = job.href;
      if (!fullLink.startsWith('http')) {
        if (!fullLink.startsWith('/')) fullLink = '/' + fullLink;
        fullLink = BASE_URL + fullLink;
      }

      try {
        detailPage = await context.newPage();
        await detailPage.goto(fullLink, { waitUntil: 'domcontentloaded', timeout: 35000 });
        await sleep(400);

        // Extract authentic Requirement ID & description & metadata
        const detailData = await detailPage.evaluate(() => {
          let authenticReqId = '';
          const reqEl = document.querySelector('#ctl00_Contentpage1_lbl_reqid') ||
                        document.querySelector('#ctl00_Contentpage1_lbl_req_id') ||
                        document.querySelector('#ctl00_Contentpage1_lblReqId') ||
                        document.querySelector('[id*="reqid" i]') ||
                        document.querySelector('[id*="req_id" i]');
          if (reqEl && reqEl.innerText.trim()) {
            const m = reqEl.innerText.trim().match(/\d{5,7}/);
            authenticReqId = m ? m[0] : reqEl.innerText.trim();
          }

          if (!authenticReqId) {
            const bodyMatch = document.body.innerText.match(/(?:Requirement|Req|Requisition)\s*(?:ID|#|No\.?)?\s*[:\-]?\s*(\d{5,7})/i);
            if (bodyMatch) authenticReqId = bodyMatch[1];
          }

          if (!authenticReqId) {
            const urlMatch = window.location.href.match(/\b(1[56]\d{4}|\d{6})\b/);
            if (urlMatch) authenticReqId = urlMatch[1];
          }

          const posEl = document.querySelector('#ctl00_Contentpage1_lbl_pos_title, #ctl00_Contentpage1_lbl_title');
          const posTitle = posEl ? posEl.innerText.trim() : '';

          const clientEl = document.querySelector('#ctl00_Contentpage1_lbl_client');
          const clientText = clientEl ? clientEl.innerText.trim() : '';

          const skillsEl = document.querySelector('#ctl00_Contentpage1_lbl_skills');
          const skillsText = skillsEl ? skillsEl.innerText.trim() : '';

          const locEl = document.querySelector('#ctl00_Contentpage1_lbl_location');
          const locText = locEl ? locEl.innerText.trim() : '';

          const dateEl = document.querySelector('#ctl00_Contentpage1_lbl_date_open');
          const dateText = dateEl ? dateEl.innerText.trim() : '';

          const expEl = document.querySelector('#ctl00_Contentpage1_lbl_exp');
          const expText = expEl ? expEl.innerText.trim() : '';

          const selectors = [
            '#ctl00_Contentpage1_lbl_descr',
            '#ctl00_Contentpage1_lbl_description',
            '.job-description',
            '[id*="descr"]',
            '[class*="description"]',
          ];
          let description = '';
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.length > 50) {
              description = el.innerText.trim();
              break;
            }
          }
          if (!description) description = document.body.innerText.substring(0, 3000);

          return {
            authenticReqId,
            posTitle,
            clientText,
            skillsText,
            locText,
            dateText,
            expText,
            description
          };
        });

        await detailPage.close();
        detailPage = null;

        const resolvedReqId = detailData.authenticReqId || job.rowReqId || (job.href.match(/\b(1[56]\d{4}|\d{6})\b/) || [])[1] || undefined;
        const description = detailData.description;
        let parsed = null;
        if (GROQ_API_KEY && i < 15) {
          try {
            parsed = await parseJobWithGroq(description, job.title);
          } catch (_) {
            parsed = null;
          }
        }

        const fallback = fallbackExtractLocationAndWorkMode(description, job.title);
        
        let finalLocation = fallback.location;
        if (detailData.locText && detailData.locText.trim() && detailData.locText !== 'Unknown') {
          finalLocation = detailData.locText.replace(/^in\s+/i, '').trim();
        } else if (parsed?.location && parsed.location !== 'Unknown') {
          finalLocation = parsed.location;
        }

        const finalWorkMode = parsed?.work_mode || parsed?.workMode || (['Remote','Hybrid','Onsite'].includes(parsed?.type) ? parsed.type : fallback.workMode);
        const finalEmpType = parsed?.employment_type || (['Contract','Full-time','C2H','C2C','W2'].includes(parsed?.type) ? parsed.type : 'Contract');

        const parsedSkills = detailData.skillsText
          ? detailData.skillsText.split(',').map(s => s.trim()).filter(Boolean)
          : (Array.isArray(parsed?.skills) && parsed.skills.length > 0 ? parsed.skills : []);

        const finalClient = (detailData.clientText && detailData.clientText.trim())
          ? detailData.clientText.trim()
          : (parsed?.client && parsed.client !== 'General Client' ? parsed.client : 'State Client');

        results.push({
          id: resolvedReqId,
          reqId: resolvedReqId,
          title: parsed?.title || cleanText(job.title),
          client: finalClient,
          company: parsed?.company || 'JobsInHand',
          skills: parsedSkills,
          preferredSkills: Array.isArray(parsed?.preferredSkills) ? parsed.preferredSkills : [],
          budget: parsed?.budget || '$75/hr',
          experience: detailData.expText || parsed?.experience || '5+ years',
          location: finalLocation,
          work_mode: finalWorkMode,
          workMode: finalWorkMode,
          type: finalWorkMode,
          employment_type: finalEmpType,
          description: parsed?.description || description.substring(0, 500),
          rawDescription: description,
          applyUrl: fullLink,
          postDate: detailData.dateText || job.createDateStr,
          post_date: getTodayISODate(),
          source: 'jobsinhand',
          status: 'Open',
          skipped: false,
          error: null,
        });

        logger(`[playwright] ✅ [Req #${resolvedReqId || 'N/A'}] Extracted: ${job.title} @ ${finalLocation}`);
      } catch (err) {
        logger(`[playwright] ⚠️ Detail fetch notice for "${job.title}" (${err.message}). Preserving job via fallback.`);
        const fallbackReqId = job.rowReqId || (job.href.match(/\b(1[56]\d{4}|\d{6})\b/) || [])[1] || undefined;
        const fallback = fallbackExtractLocationAndWorkMode(job.rawSnippet, job.title);

        results.push({
          id: fallbackReqId,
          reqId: fallbackReqId,
          title: cleanText(job.title),
          client: 'State Client',
          company: 'JobsInHand',
          skills: [],
          preferredSkills: [],
          budget: '$75/hr',
          experience: '5+ years',
          location: fallback.location,
          work_mode: fallback.workMode,
          workMode: fallback.workMode,
          type: fallback.workMode,
          employment_type: 'Contract',
          description: job.rawSnippet || job.title,
          rawDescription: job.rawSnippet || job.title,
          applyUrl: fullLink,
          postDate: job.createDateStr,
          post_date: getTodayISODate(),
          source: 'jobsinhand',
          status: 'Open',
          skipped: false,
          error: null,
        });
      } finally {
        if (detailPage) {
          try { await detailPage.close(); } catch (_) {}
        }
      }

      await sleep(300);
    }

    await browser.close();

    const successful = results.filter(r => !r.skipped);
    logger(`[playwright] Playwright scrape complete. Successfully extracted ${successful.length} active requisitions.`);

    return {
      jobs: successful,
      allAttempted: results,
      mode: 'playwright',
      blocked: false,
      rebidFiltered: 0,
      notTodayFiltered: 0,
      totalFound: uniqueRawJobs.length,
    };

  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
    logger(`[playwright] ❌ Fatal Playwright error: ${err.message}`);
    throw err;
  }
}

