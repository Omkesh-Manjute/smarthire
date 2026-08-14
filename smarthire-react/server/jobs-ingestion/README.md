# JobsInHand Automated Ingestion — Setup Guide

## Overview

This pipeline scrapes **JobsInHand.com** daily at **7:00 PM IST** and saves today's new job postings directly into the VerifyHire ATS database.

---

## Files

| File | Purpose |
|---|---|
| `jobsinhand-scraper.js` | Core HTTP scraper + Groq LLM job parser |
| `playwright-scraper.js` | Playwright browser fallback (auto-used if HTTP is blocked) |
| `run-ingestion.js` | Main pipeline runner — dedup, save, report, log |
| `setup-scheduler.bat` | One-time Windows Task Scheduler setup (7 PM IST daily) |
| `ingestion.log` | Auto-created — stores last 30 run logs (JSON) |
| `ingestion-status.json` | Auto-created — current run status snapshot |

---

## First-Time Setup

### 1. Install Playwright Chromium (one time only)
```powershell
cd "f:\App Projects\Fake candidate app\verifyhire-react"
npx playwright install chromium
```

### 2. Register the Daily Cron (run as Administrator)
```
Right-click setup-scheduler.bat → Run as Administrator
```
Or from an elevated PowerShell:
```powershell
& "f:\App Projects\Fake candidate app\verifyhire-react\server\jobs-ingestion\setup-scheduler.bat"
```

### 3. Test the Ingestion Manually
```powershell
cd "f:\App Projects\Fake candidate app\verifyhire-react"
node server/jobs-ingestion/run-ingestion.js
```

---

## How It Works

```
Daily @ 7:00 PM IST
        │
        ▼
┌─────────────────────────────┐
│  Fetch jobsinhand.com       │  ← HTTP (fast, no browser)
│  search_jobs.aspx           │
└────────────┬────────────────┘
             │ If blocked (403/CAPTCHA)
             ▼
┌─────────────────────────────┐
│  Playwright Chromium        │  ← Headless browser fallback
│  (auto-switch)              │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  Filter jobs:               │
│  • Skip "Rebid" titles      │
│  • Only today's create date │
│  • Max 10 jobs              │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  Groq LLM (llama-3.1-8b)   │  ← Parses each job description
│  Extracts structured fields │     into clean JSON
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  Deduplicate                │  ← Title + Client + Date key
│  vs. jobs.json              │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  Save new jobs → jobs.json  │
│  Write report → reports.json│
│  Append → ingestion.log     │
└─────────────────────────────┘
```

---

## Viewing Results

- **ATS → Jobs tab** — new jobs appear automatically
- **Reports → JobsInHand Postings tab** — shows today's sync report
- **"Run Now" button** in Reports panel — triggers an immediate manual run

---

## Managing the Scheduled Task

```powershell
# Check status
schtasks /query /tn "VerifyHire_JobsInHand_Ingestion"

# Run immediately
schtasks /run /tn "VerifyHire_JobsInHand_Ingestion"

# Pause/disable
schtasks /change /tn "VerifyHire_JobsInHand_Ingestion" /disable

# Re-enable
schtasks /change /tn "VerifyHire_JobsInHand_Ingestion" /enable

# Remove permanently
schtasks /delete /tn "VerifyHire_JobsInHand_Ingestion" /f
```

---

## Changing the Schedule Time

Edit `setup-scheduler.bat` and change `SET START_TIME=19:00` to your desired time (24h format), then re-run the bat as Administrator.

---

## API Endpoints (via the running Express server)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/jobs/ingestion/status` | GET | Last run stats and status |
| `/api/jobs/ingestion/logs` | GET | Last 30 run log entries |
| `/api/jobs/ingestion/trigger` | POST | Manually trigger a run |
| `/api/jobs` | GET | All jobs in DB |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Playwright not found" | Run `npx playwright install chromium` |
| HTTP scrape returns 0 jobs | Check if JobsInHand changed their HTML structure |
| Groq API error | Verify `GROQ_API_KEY` in `.env` |
| Task Scheduler not running | Run setup-scheduler.bat as Administrator |
| No jobs match today's date | JobsInHand may not have posted today; check site manually |
