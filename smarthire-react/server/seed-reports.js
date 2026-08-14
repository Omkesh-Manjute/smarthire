// Uses native fetch available in Node.js 18+

const SECRET = process.env.AUTOMATION_SECRET || 'super-secret';
const API_URL = 'http://127.0.0.1:8787/api/automation/report';

const reports = [
  {
    type: 'ai-brief',
    report_date: new Date().toISOString().split('T')[0],
    title: 'Daily Sourcing Intelligence & Verification Brief',
    status: 'success',
    content: `### Sourcing Summary
Today, our automated crawler scanned 24 active recruiter email chains and parsed 12 new resumes. 
- **8 candidates** passed the initial heuristics check.
- **3 candidates** were flagged for potential location anomalies (GPS mismatch with IP address).
- **1 candidate** profile was successfully auto-imported to the ATS dashboard for manual recruiter verification.

### Identity Highlights
- **John Doe** (React Developer, 5 yrs exp) completed selfie verification flow. Trust score is **92%**.
- **Jane Smith** (Azure Cloud Architect, 8 yrs exp) uploaded matching ID snapshot. Verification pending recruiter approval.
- **Robert Johnson** (Golang Specialist) was flagged for suspicious IP context (VPN detected).

### Action Items
1. Review Robert Johnson's profile in the ATS tab.
2. Approve Jane Smith's verified status to trigger email submission to Client A.`,
    raw: {
      total_scanned: 24,
      total_parsed: 12,
      passed_heuristics: 8,
      flagged_anomalies: 3,
      imported_to_ats: 1,
      timestamp: new Date().toISOString()
    }
  },
  {
    type: 'jobs',
    report_date: new Date().toISOString().split('T')[0],
    title: 'JobsInHand Daily Active Requirements Sync',
    status: 'success',
    content: `### Active Jobs Sync Completed
Successfully fetched requirements from internal JobsInHand client feeds and synchronized them with the VerifyHire ATS database.

### Sync Summary
- **14 New Jobs** identified and imported.
- **5 Expired/Filled Jobs** closed and archived.
- **42 Candidate Matches** matched against active jobs using skill matching heuristics.

### Critical High-Priority Matching
- **Job J-202 (Senior React Developer)**: Matched with candidate **John Doe** (Match Score: 92%).
- **Job J-504 (Azure Architect)**: Matched with candidate **Jane Smith** (Match Score: 88%).
- **Job J-101 (Golang Engineer)**: Matched with candidate **Robert Johnson** (Match Score: 68%).

### Next Actions
Recruiters have been notified of candidate-to-job matches. Recommendations are visible in the Candidate List.`,
    raw: {
      jobs_fetched: 35,
      jobs_imported: 14,
      jobs_archived: 5,
      total_matches_generated: 42,
      sync_duration_ms: 2480,
      timestamp: new Date().toISOString()
    }
  }
];

async function seed() {
  console.log('🌱 Seeding automation reports to local Express server...');
  
  for (const report of reports) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-automation-secret': SECRET
        },
        body: JSON.stringify(report)
      });
      
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ Seeded ${report.type} report successfully: ${data.id}`);
      } else {
        console.error(`❌ Failed to seed ${report.type}:`, data.message);
      }
    } catch (e) {
      console.error(`❌ Error seeding ${report.type}:`, e.message);
    }
  }
}

seed();
