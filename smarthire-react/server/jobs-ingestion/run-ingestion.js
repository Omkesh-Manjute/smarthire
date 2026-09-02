/**
 * JobsInHand Ingestion Pipeline Runner
 * ──────────────────────────────────────
 * Main entry point for the daily cron job.
 *
 * Flow:
 *   1. Scrape JobsInHand (HTTP → Playwright fallback if blocked)
 *   2. Deduplicate against existing jobs.json
 *   3. Save new jobs to jobs.json
 *   4. Append automation report to reports.json
 *   5. Write structured log to ingestion.log
 *
 * Usage:
 *   node server/jobs-ingestion/run-ingestion.js
 *   (also callable as a module function from the Express API)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { scrapeJobsInHand } from './jobsinhand-scraper.js';
import { resolveReqId, extractPositionNumber, cleanJobTitleWithPositionNumber, formatJobDescription } from '../../src/utils/formatJobDescription.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─── Paths ────────────────────────────────────────────────────────────────────
const JOBS_DB_PATH    = path.resolve(__dirname, '../jobs.json');
const REPORTS_DB_PATH = path.resolve(__dirname, '../reports.json');
const LOG_FILE_PATH   = path.resolve(__dirname, 'ingestion.log');
const STATUS_FILE_PATH = path.resolve(__dirname, 'ingestion-status.json');

const MAX_LOG_ENTRIES = 30; // Keep last 30 run logs

// Drop-in compatible schemas to persist lists to MongoDB Atlas collections
const JobsDoc = mongoose.models.JobsStore || mongoose.model('JobsStore', new mongoose.Schema({ list: Array }));
const ReportsDoc = mongoose.models.ReportsStore || mongoose.model('ReportsStore', new mongoose.Schema({ list: Array }));

let isMongoConnected = false;

// Determine if this script is run directly (CLI) or imported as a module
const isDirectRun = process.argv[1] &&
  (process.argv[1].endsWith('run-ingestion.js') || process.argv[1].includes('run-ingestion'));

async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger('⚠️  MONGODB_URI not configured in env — using local JSON files only.');
    return;
  }
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    isMongoConnected = true;
    logger('✅ MongoDB Atlas is already connected.');
    return;
  }
  try {
    await mongoose.connect(uri);
    isMongoConnected = true;
    logger('✅ Connected to MongoDB Atlas successfully in scraper.');
  } catch (err) {
    logger(`❌ Failed to connect to MongoDB Atlas in scraper: ${err.message}`);
  }
}

async function disconnectMongo() {
  if (isMongoConnected && isDirectRun) {
    try {
      await mongoose.disconnect();
      isMongoConnected = false;
      logger('🔌 Disconnected from MongoDB Atlas.');
    } catch (err) {
      logger(`⚠️  Error disconnecting from MongoDB: ${err.message}`);
    }
  }
}

// ─── Log Helpers ─────────────────────────────────────────────────────────────

const logLines = []; // buffer for current run

function logger(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  logLines.push(line);
}

function flushLog(runSummary) {
  try {
    // Load existing log entries
    let entries = [];
    if (fs.existsSync(LOG_FILE_PATH)) {
      const raw = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
      try { entries = JSON.parse(raw); } catch (_) { entries = []; }
    }

    const entry = {
      run_id: `RUN-${Date.now()}`,
      run_start: runSummary.run_start,
      run_end: new Date().toISOString(),
      duration_ms: Date.now() - new Date(runSummary.run_start).getTime(),
      mode: runSummary.mode || 'http',
      status: runSummary.status || 'success',
      jobs_found: runSummary.jobs_found ?? 0,
      jobs_added: runSummary.jobs_added ?? 0,
      duplicates_skipped: runSummary.duplicates_skipped ?? 0,
      rebid_filtered: runSummary.rebid_filtered ?? 0,
      failed_jobs: runSummary.failed_jobs ?? 0,
      lines: logLines.slice(-50), // keep last 50 log lines per run
    };

    entries.unshift(entry); // newest first
    entries = entries.slice(0, MAX_LOG_ENTRIES);

    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write ingestion log:', err.message);
  }
}

function saveStatus(statusData) {
  try {
    fs.writeFileSync(STATUS_FILE_PATH, JSON.stringify(statusData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save status file:', err.message);
  }
}

// ─── Database Helpers ─────────────────────────────────────────────────────────

async function loadJobsDb() {
  try {
    if (isMongoConnected) {
      const doc = await JobsDoc.findOne();
      if (doc) {
        logger(`📂 Loaded ${doc.list?.length || 0} jobs from MongoDB Atlas.`);
        return doc.list || [];
      }
    }
    if (fs.existsSync(JOBS_DB_PATH)) {
      return JSON.parse(fs.readFileSync(JOBS_DB_PATH, 'utf-8'));
    }
  } catch (err) {
    logger(`⚠️ Failed to load jobs database: ${err.message}`);
  }
  return [];
}

async function saveJobsDb(jobs) {
  try {
    fs.writeFileSync(JOBS_DB_PATH, JSON.stringify(jobs, null, 2), 'utf-8');
    if (isMongoConnected) {
      await JobsDoc.findOneAndUpdate({}, { list: jobs }, { upsert: true });
      logger('💾 Saved jobs to MongoDB Atlas.');
    }
  } catch (err) {
    logger(`⚠️ Failed to save jobs database: ${err.message}`);
  }
}

async function loadReportsDb() {
  try {
    if (isMongoConnected) {
      const doc = await ReportsDoc.findOne();
      if (doc) {
        logger(`📂 Loaded ${doc.list?.length || 0} reports from MongoDB Atlas.`);
        return doc.list || [];
      }
    }
    if (fs.existsSync(REPORTS_DB_PATH)) {
      return JSON.parse(fs.readFileSync(REPORTS_DB_PATH, 'utf-8'));
    }
  } catch (err) {
    logger(`⚠️ Failed to load reports database: ${err.message}`);
  }
  return [];
}

async function saveReportsDb(reports) {
  try {
    fs.writeFileSync(REPORTS_DB_PATH, JSON.stringify(reports, null, 2), 'utf-8');
    if (isMongoConnected) {
      await ReportsDoc.findOneAndUpdate({}, { list: reports }, { upsert: true });
      logger('💾 Saved reports to MongoDB Atlas.');
    }
  } catch (err) {
    logger(`⚠️ Failed to save reports database: ${err.message}`);
  }
}

// ─── Deduplication ────────────────────────────────────────────────────────────

/**
 * Returns true if a job is a duplicate of an existing job.
 * Match key: title (normalised) + client + post_date
 */
function isDuplicate(newJob, existingJobs) {
  const newPos = extractPositionNumber(newJob.title, newJob.description || newJob.rawDescription);
  const newResolvedId = resolveReqId(newJob.id || newJob.reqId || newJob.title, newJob);

  return existingJobs.some(existing => {
    const ePos = existing.positionNumber || extractPositionNumber(existing.title, existing.description);
    const eResolvedId = resolveReqId(existing.id || existing.reqId || existing.title, existing);

    // If both have resolved authentic req IDs and they match
    if (newResolvedId && eResolvedId && newResolvedId === eResolvedId && /^15[89]\d{3}$/.test(newResolvedId)) return true;

    // If both have valid non-empty position numbers and they match
    if (newPos && ePos && newPos === ePos) return true;

    return false;
  });
}

// ─── Report Builder ───────────────────────────────────────────────────────────

function buildReportContent(summary, addedJobs) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const statusIcon = summary.status === 'success' ? '✅' : summary.status === 'partial' ? '⚠️' : '❌';
  const modeLabel = summary.mode === 'playwright' ? '🤖 Playwright Multi-Page Automation' : '🌐 HTTP Scraper';

  let jobListSection = '';
  if (addedJobs.length > 0) {
    jobListSection = '\n\n### New Jobs Added Today (Newest at Top)\n';
    addedJobs.forEach((j, i) => {
      const skills = Array.isArray(j.skills) && j.skills.length > 0
        ? j.skills.slice(0, 3).join(', ')
        : 'Various';
      jobListSection += `- **${j.title}** (Req #${j.reqId || j.id}) — ${j.location || 'Location TBD'} · ${j.workMode || j.type || 'Hybrid'} · Skills: ${skills}\n`;
    });
  }

  return `### JobsInHand Complete Catalogue Sync — ${statusIcon} ${summary.status.toUpperCase()}

Automated job ingestion completed at **${timeStr}** on ${dateStr}.
Scraping mode: ${modeLabel}

### Sync Summary
- **${summary.jobs_found} Active Requisitions** scanned on JobsInHand.
- **${summary.jobs_added} New Requisitions** successfully synced to ATS.
- **${summary.duplicates_skipped} Existing Requisitions** preserved.
- **${summary.failed_jobs} Skipped Requisitions**.${jobListSection}

### Next Actions
All active requisitions are visible in descending sequential Req# order at the top of the ATS portal.`;
}

// ─── Main Ingestion Pipeline ──────────────────────────────────────────────────

export async function runIngestion() {
  const runStart = new Date().toISOString();
  const runSummary = {
    run_start: runStart,
    status: 'success',
    mode: 'playwright',
    jobs_found: 0,
    jobs_added: 0,
    duplicates_skipped: 0,
    rebid_filtered: 0,
    failed_jobs: 0,
  };

  logger(`════════════════════════════════════════════`);
  logger(`🚀 JobsInHand Ingestion Pipeline Started`);
  logger(`════════════════════════════════════════════`);
  logger(`Run start: ${runStart}`);

  try {
    await connectMongo();

    // Step 1: Scrape
    logger(`\n[Step 1] Scraping JobsInHand across all pages...`);
    const scrapeResult = await scrapeJobsInHand(logger);

    runSummary.mode = scrapeResult.mode;
    runSummary.jobs_found = scrapeResult.jobs.length;
    runSummary.rebid_filtered = scrapeResult.rebidFiltered || 0;
    runSummary.failed_jobs = (scrapeResult.allAttempted || []).filter(j => j.skipped).length;

    logger(`\n[Step 1] ✅ Scrape complete.`);
    logger(`  Mode: ${scrapeResult.mode}`);
    logger(`  Jobs fetched: ${scrapeResult.jobs.length}`);
    logger(`  Failed fetches: ${runSummary.failed_jobs}`);

    if (scrapeResult.jobs.length === 0) {
      logger(`\n[Step 2] ⚠️  No jobs to process. Ending run.`);
      runSummary.status = 'no_jobs';
    } else {
      // Step 2: Load existing DB and deduplicate
      logger(`\n[Step 2] Deduplicating against existing jobs database...`);
      const existingJobs = await loadJobsDb();
      logger(`  Existing jobs in DB: ${existingJobs.length}`);

      const newJobs = [];
      let dupCount = 0;

      for (const job of scrapeResult.jobs) {
        if (isDuplicate(job, existingJobs) || isDuplicate(job, newJobs)) {
          logger(`  [DUP] Skipping duplicate: "${job.title}" (${job.reqId || job.id})`);
          dupCount++;
        } else {
          const rawTitle = job.title;
          const posNumber = extractPositionNumber(rawTitle, job.rawDescription || job.description);
          const cleanTitle = cleanJobTitleWithPositionNumber(rawTitle, { ...job, positionNumber: posNumber });
          const resolvedReqId = resolveReqId(job.id || job.reqId || rawTitle, { ...job, positionNumber: posNumber, title: cleanTitle });
          const formattedDesc = formatJobDescription(job.rawDescription || job.description, { ...job, positionNumber: posNumber, title: cleanTitle, id: resolvedReqId });

          newJobs.push({
            id: resolvedReqId,
            reqId: resolvedReqId,
            positionNumber: posNumber || '',
            title: cleanTitle,
            client: job.client || 'State Client',
            company: job.company || '',
            skills: job.skills || [],
            preferredSkills: job.preferredSkills || [],
            budget: job.budget || '$75/hr',
            payRate: job.budget ? String(job.budget).replace(/[^0-9]/g, '') || '75' : '75',
            billRate: 'TBD',
            experience: job.experience || '5+ years',
            location: job.location || 'Unknown',
            type: job.type || 'Contract',
            workMode: job.work_mode || job.workMode || job.type || 'Hybrid',
            employment_type: job.employment_type || job.type || 'Contract',
            description: formattedDesc || job.description || job.rawDescription || '',
            rawDescription: job.rawDescription || '',
            applyUrl: job.applyUrl || '',
            postDate: job.postDate || '',
            post_date: job.post_date || new Date().toISOString().slice(0, 10),
            source: 'jobsinhand',
            source_url: 'https://www.jobsinhand.com/search_jobs.aspx',
            status: 'Open',
            ingested_at: new Date().toISOString(),
          });
        }
      }

      runSummary.duplicates_skipped = dupCount;
      runSummary.jobs_added = newJobs.length;

      logger(`\n[Step 2] Dedup complete.`);
      logger(`  New jobs to add: ${newJobs.length}`);
      logger(`  Duplicates skipped: ${dupCount}`);

      // Step 3: Save to jobs.json (Sorted strictly descending by Req ID)
      logger(`\n[Step 3] Sorting and saving ${newJobs.length} new jobs to database...`);
      const mergedJobs = [...newJobs, ...existingJobs];
      const uniqueMap = new Map();
      mergedJobs.forEach(j => {
        const key = j.reqId || j.id;
        if (key && !uniqueMap.has(key)) {
          uniqueMap.set(key, j);
        }
      });
      const updatedJobs = Array.from(uniqueMap.values()).sort((a, b) => {
        const aNum = parseInt(String(a.reqId || a.id).replace(/\D/g, ''), 10) || 0;
        const bNum = parseInt(String(b.reqId || b.id).replace(/\D/g, ''), 10) || 0;
        return bNum - aNum;
      });

      await saveJobsDb(updatedJobs);
      logger(`  ✅ Database saved with ${updatedJobs.length} total requisitions in descending Req# order.`);

      // Step 4: Write automation report to reports.json
      logger(`\n[Step 4] Writing automation report...`);
      const reports = await loadReportsDb();
      const todayDate = new Date().toISOString().slice(0, 10);

      const reportContent = buildReportContent(runSummary, newJobs);
      const reportId = `R-JIH-${Date.now()}`;

      const newReport = {
        id: reportId,
        type: 'jobs',
        report_date: todayDate,
        title: 'JobsInHand Daily Active Requirements Sync',
        content: reportContent,
        raw: {
          jobs_found: runSummary.jobs_found,
          jobs_added: runSummary.jobs_added,
          duplicates_skipped: runSummary.duplicates_skipped,
          rebid_filtered: runSummary.rebid_filtered,
          failed_jobs: runSummary.failed_jobs,
          scrape_mode: runSummary.mode,
          run_start: runSummary.run_start,
          run_end: new Date().toISOString(),
          new_job_ids: newJobs.map(j => j.id),
        },
        status: newJobs.length > 0 ? 'success' : 'no_jobs',
        created_at: new Date().toISOString(),
      };

      // Replace or prepend today's jobs report
      const otherReports = reports.filter(r => r.type !== 'jobs' || r.report_date !== todayDate);
      await saveReportsDb([newReport, ...otherReports]);
      logger(`  ✅ Report written (ID: ${reportId})`);
    }

  } catch (err) {
    logger(`\n❌ FATAL ERROR: ${err.message}`);
    logger(err.stack || '');
    runSummary.status = 'error';
    runSummary.error = err.message;
  } finally {
    await disconnectMongo();
  }

  // Step 5: Save status and flush log
  const finalStatus = {
    ...runSummary,
    last_run: new Date().toISOString(),
    run_end: new Date().toISOString(),
  };
  saveStatus(finalStatus);
  flushLog(runSummary);

  logger(`\n════════════════════════════════════════════`);
  logger(`📊 Run Summary:`);
  logger(`  Status:            ${runSummary.status}`);
  logger(`  Mode:              ${runSummary.mode}`);
  logger(`  Jobs found:        ${runSummary.jobs_found}`);
  logger(`  Jobs added:        ${runSummary.jobs_added}`);
  logger(`  Duplicates:        ${runSummary.duplicates_skipped}`);
  logger(`  Rebid filtered:    ${runSummary.rebid_filtered}`);
  logger(`  Failed:            ${runSummary.failed_jobs}`);
  logger(`════════════════════════════════════════════`);

  return finalStatus;
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────
// Runs when called directly: node server/jobs-ingestion/run-ingestion.js

// isDirectRun is already declared at line 45

if (isDirectRun) {
  runIngestion()
    .then(result => {
      console.log('\n✅ Ingestion complete:', result.status);
      process.exit(result.status === 'error' ? 1 : 0);
    })
    .catch(err => {
      console.error('❌ Unhandled error:', err);
      process.exit(1);
    });
}
