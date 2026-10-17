/**
 * AUTOMATED TEST SUITE: SMART HIRE COPILOT ATS MATCHING ENGINE
 * 
 * Verifies all 10 Acceptance Criteria from Section 13:
 * 1. JD parsing & required/preferred classification
 * 2. Full and partial resume extraction verification
 * 3. Direct and equivalent skill matching
 * 4. Weighted score calculations & proportional redistribution
 * 5. Eligibility gates (Wisconsin residency & hard blockers)
 * 6. Consistency between Quick Sourcing and Detailed Fit Dossier
 * 7. Candidate ranking & ineligibility blocker
 * 8. Cache invalidation on JD or resume change
 * 9. Temporary session data cleanup lifecycle
 * 10. Error handling & failed extraction
 */

import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let enginePath = path.resolve(__dirname, '../smarthire-react/server/matching_engine.cjs');
if (!fs.existsSync(enginePath)) {
  enginePath = path.resolve(__dirname, '../smarthire-main/smarthire-react/server/matching_engine.cjs');
}
const { default: SmartHireMatchingEngine } = await import('file://' + enginePath);

console.log('====================================================');
console.log('RUNNING SMART HIRE COPILOT MATCHING ENGINE TEST SUITE');
console.log(`Engine Version: ${SmartHireMatchingEngine.ENGINE_VERSION}`);
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] Test ${totalTests}: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] Test ${totalTests}: ${testName}`);
    console.error(`    Error: ${err.message}\n`, err.stack);
  }
}

// ---------------------------------------------------------------------
// TEST 1: JD PARSING & REQUIRED / PREFERRED CLASSIFICATION
// ---------------------------------------------------------------------
runTest('JD parsing and required/preferred classification', () => {
  const rawJd = {
    id: '159348',
    title: 'Project Manager / Scrum Master — Data & Analytics',
    location: 'Madison, WI',
    skills: ['Scrum', 'Agile', 'Jira', 'Snowflake', 'Python (preferred)', 'PMP (optional)'],
    description: 'Looking for a Senior Project Manager with 10+ years of experience leading multi-team Scrum delivery for Data & Analytics and Data Warehousing initiatives. Mandatory Wisconsin residency required.'
  };

  const norm = SmartHireMatchingEngine.normalizeJobDescription(rawJd);

  assert.strictEqual(norm.id, '159348');
  assert.strictEqual(norm.eligibilityRules.requiresWisconsin, true, 'Should detect Wisconsin residency constraint');
  assert.strictEqual(norm.requiredYears, 10, 'Should parse 10+ years requirement');

  // Verify Mandatory vs Preferred
  const prefReqs = norm.categories.PREFERRED_SKILLS;
  assert.ok(prefReqs.some(r => r.name.toLowerCase().includes('python')), 'Python should be classified as Preferred');
  assert.ok(prefReqs.some(r => r.name.toLowerCase().includes('pmp')), 'PMP should be classified as Preferred when marked optional');

  const mandTech = norm.categories.MANDATORY_TECHNICAL;
  assert.ok(mandTech.some(r => r.name.toLowerCase().includes('scrum')), 'Scrum should be classified as Mandatory Technical');
  assert.ok(mandTech.some(r => r.name.toLowerCase().includes('jira')), 'Jira should be classified as Mandatory Technical');

  // Verify Domain
  const domain = norm.categories.DOMAIN_FUNCTIONAL;
  assert.ok(domain.length > 0, 'Domain categories should be populated');
});

// ---------------------------------------------------------------------
// TEST 2: FULL VS PARTIAL RESUME EXTRACTION CLASSIFICATION
// ---------------------------------------------------------------------
runTest('Full, partial, and failed resume extraction classification', () => {
  // Case A: Full Resume (long text with experience, responsibilities, skills, education)
  const fullCand = {
    name: 'Jane Doe',
    resumeText: `Jane Doe - Senior Scrum Master
Summary: 11+ years of experience leading enterprise Agile teams and data platform migrations.
Key Responsibilities and Accomplishments:
• Facilitated daily standups, sprint planning, and backlog grooming in Jira.
• Led Snowflake and AWS cloud data warehouse delivery across 3 cross-functional teams.
• Managed executive steering committee reporting and release burndown charts.
Education: Bachelor of Science in Computer Science, University of Wisconsin.
Certifications: Certified Scrum Master (CSM), PMP.`.repeat(3)
  };
  const vFull = SmartHireMatchingEngine.verifyAndClassifyResume(fullCand);
  assert.strictEqual(vFull.status, 'FULL_RESUME_EXTRACTED');
  assert.strictEqual(vFull.isProvisional, false);
  assert.ok(vFull.sourceSectionsFound.includes('Experience'));
  assert.ok(vFull.sourceSectionsFound.includes('Responsibilities'));

  // Case B: Partial Resume (short summary, missing responsibilities)
  const partialCand = {
    name: 'John Smith',
    resumeText: 'John Smith. Scrum Master with 6 years experience in agile projects, jira, and data analysis. Based in Madison, WI.'
  };
  const vPart = SmartHireMatchingEngine.verifyAndClassifyResume(partialCand);
  assert.strictEqual(vPart.status, 'PARTIAL_RESUME_EXTRACTED');
  assert.strictEqual(vPart.isProvisional, true, 'Partial resume must be flagged as provisional');

  // Case C: Profile Only (only a headline)
  const profileOnlyCand = {
    name: 'Card Only',
    resumeText: 'Scrum Master | Top Skills: Jira, Agile'
  };
  const vProfile = SmartHireMatchingEngine.verifyAndClassifyResume(profileOnlyCand);
  assert.strictEqual(vProfile.status, 'PROFILE_ONLY');
  assert.strictEqual(vProfile.isProvisional, true);

  // Case D: Extraction Failed
  const emptyCand = { name: 'Empty', resumeText: '' };
  const vEmpty = SmartHireMatchingEngine.verifyAndClassifyResume(emptyCand);
  assert.strictEqual(vEmpty.status, 'EXTRACTION_FAILED');
});

// ---------------------------------------------------------------------
// TEST 3: DIRECT AND EQUIVALENT SKILL MATCHING
// ---------------------------------------------------------------------
runTest('Direct, equivalent, and partial skill matching', () => {
  const norm = SmartHireMatchingEngine.normalizeJobDescription({
    title: 'Project Manager / Scrum Master',
    skills: ['Scrum Master', 'Jira', 'Snowflake', 'Business Intelligence']
  });

  // Candidate with equivalents: "Agile Delivery Lead" for Scrum Master, "Azure DevOps" for Jira, "Redshift" for Snowflake
  const cand = {
    name: 'Alex Rivera',
    title: 'Agile Delivery Lead',
    resumeText: 'Alex Rivera. 8 years managing agile teams, backlog grooming in Azure DevOps, and AWS Redshift data warehouse migrations.'
  };

  const evalRes = SmartHireMatchingEngine.evaluateCandidate(cand, norm);
  assert.ok(evalRes.skillsMatchTable.length > 0);

  const jiraMatch = evalRes.skillsMatchTable.find(r => r.requirement.toLowerCase().includes('jira'));
  assert.ok(jiraMatch, 'Jira requirement should be in table');
  assert.strictEqual(jiraMatch.evidenceStatus, 'STRONG_EQUIVALENT', 'Azure DevOps should match Jira as STRONG_EQUIVALENT');

  const snowflakeMatch = evalRes.skillsMatchTable.find(r => r.requirement.toLowerCase().includes('snowflake'));
  assert.ok(snowflakeMatch);
  assert.strictEqual(snowflakeMatch.evidenceStatus, 'STRONG_EQUIVALENT', 'Redshift should match Snowflake as STRONG_EQUIVALENT');
});

// ---------------------------------------------------------------------
// TEST 4: WEIGHTED SCORE CALCULATIONS & PROPORTIONAL REDISTRIBUTION
// ---------------------------------------------------------------------
runTest('7-Category weighted score calculation and proportional redistribution', () => {
  // Requisition with all 7 categories
  const fullJd = SmartHireMatchingEngine.normalizeJobDescription({
    title: 'Senior Scrum Master / Project Lead',
    skills: ['Agile', 'Scrum', 'Jira', 'Snowflake', 'Python (preferred)', 'PMP'],
    description: '10+ years experience leading data warehouse projects and reporting to steering committees.'
  });

  const perfectCand = {
    name: 'Sarah Connor',
    title: 'Senior Scrum Master / Project Manager',
    location: 'Madison, WI',
    experience: '12+ Years',
    resumeText: `Sarah Connor — Senior Scrum Master & Agile Project Manager
Madison, WI · Authorized to Work in US · Phone: (608) 555-0144 · Email: sarah.connor@example.com

PROFESSIONAL SUMMARY:
Over 12+ years of enterprise experience leading multi-team Agile/Scrum delivery for large-scale data platforms, business intelligence, and cloud migrations. Proven track record managing cross-functional delivery teams, Jira backlog grooming, and executive stakeholder communication.

KEY RESPONSIBILITIES & ACCOMPLISHMENTS:
• Led 4 distributed Scrum teams delivering enterprise Snowflake and AWS cloud data warehouse migrations.
• Facilitated all Agile ceremonies including daily standups, sprint planning, sprint retrospectives, and Jira backlog grooming.
• Partnered closely with Enterprise Architects, Product Managers, and Business Intelligence reporting leads.
• Managed executive steering committee status presentations, milestone tracking, and risk management logs.
• Authored Python automation scripts for data pipeline verification and ETL quality checks.

EDUCATION & CERTIFICATIONS:
• Master of Science in Management Information Systems, University of Wisconsin-Madison
• Bachelor of Science in Computer Science, University of Wisconsin-Milwaukee
• Project Management Professional (PMP) — PMI Certified
• Certified Scrum Master (CSM) — Scrum Alliance`
  };

  const result = SmartHireMatchingEngine.evaluateCandidate(perfectCand, fullJd);
  assert.ok(result.score >= 85, `Perfect candidate should score >= 85%, got ${result.score}%`);
  assert.strictEqual(result.fitCategory, 'Strong Fit');
  assert.strictEqual(result.recommendation, 'SUBMIT');

  // Verify proportional redistribution when preferred skills are absent in JD
  const noPrefJd = SmartHireMatchingEngine.normalizeJobDescription({
    title: 'Java Developer',
    skills: ['Java', 'Spring Boot', 'SQL']
  });
  assert.strictEqual(noPrefJd.categories.PREFERRED_SKILLS.length, 0);

  const javaCand = {
    name: 'Dev One',
    title: 'Java Developer',
    skills: ['Java', 'Spring Boot', 'SQL'],
    resumeText: 'Java Developer with 6 years experience building Spring Boot microservices and SQL databases.'
  };
  const javaRes = SmartHireMatchingEngine.evaluateCandidate(javaCand, noPrefJd);
  assert.ok(javaRes.score >= 70, 'Score should proportionally redistribute unused categories');
});

// ---------------------------------------------------------------------
// TEST 5: HARD ELIGIBILITY GATES (WISCONSIN RESIDENCY & WORK AUTH)
// ---------------------------------------------------------------------
runTest('Hard eligibility gate: Wisconsin residency enforcement', () => {
  const wiJd = SmartHireMatchingEngine.normalizeJobDescription({
    id: '159348',
    title: 'Project Manager / Scrum Master — Data & Analytics',
    location: 'Madison, WI',
    description: 'Mandatory Wisconsin residency required for State of Wisconsin project.'
  });

  // Candidate A: Resident of Madison, WI -> Eligible
  const wiCand = {
    name: 'WI Resident',
    location: 'Madison, WI',
    skills: ['Agile', 'Scrum', 'Jira'],
    resumeText: 'Scrum Master living in Madison, WI with 8 years of agile project management experience.'
  };
  const resA = SmartHireMatchingEngine.evaluateCandidate(wiCand, wiJd);
  assert.strictEqual(resA.eligibilityStatus, 'VERIFIED_ELIGIBLE');
  assert.strictEqual(resA.isHardFailure, false);

  // Candidate B: High-scoring candidate in Dallas, TX with no WI residency -> INELIGIBLE
  const txCand = {
    name: 'Texas Candidate',
    title: 'Senior Scrum Master',
    location: 'Dallas, TX',
    skills: ['Agile', 'Scrum', 'Jira', 'Snowflake', 'Data Warehouse', 'PMP'],
    resumeText: `Dallas, TX based Senior Scrum Master. 12+ years experience.
Facilitated sprint planning, Jira backlogs, and multi-million dollar data warehouse migrations.
PMP certified, CSM certified.`
  };
  const resB = SmartHireMatchingEngine.evaluateCandidate(txCand, wiJd);
  assert.strictEqual(resB.eligibilityStatus, 'INELIGIBLE', 'Candidate in TX must be marked INELIGIBLE for WI-only role');
  assert.strictEqual(resB.isHardFailure, true);
  // MANDATORY RULE CHECK: Ineligible candidate MUST be REJECTED, never SUBMIT or INTERVIEW!
  assert.strictEqual(resB.recommendation, 'REJECT', 'Ineligible candidate recommendation MUST be REJECT regardless of score!');
  assert.ok(resB.recommendationExplanation.includes('disqualified due to mandatory eligibility constraints'));

  // Candidate C: Location unspecified / generic "United States" -> PENDING_VERIFICATION
  const usCand = {
    name: 'General US Candidate',
    location: 'United States',
    skills: ['Agile', 'Scrum'],
    resumeText: 'Agile Scrum Master based in United States.'
  };
  const resC = SmartHireMatchingEngine.evaluateCandidate(usCand, wiJd);
  assert.strictEqual(resC.eligibilityStatus, 'PENDING_VERIFICATION');
  assert.strictEqual(resC.isHardFailure, false);
});

// ---------------------------------------------------------------------
// TEST 6: CONSISTENCY BETWEEN QUICK SOURCING AND DETAILED FIT DOSSIER
// ---------------------------------------------------------------------
runTest('Consistency between Quick Sourcing and Detailed Fit Dossier', () => {
  const jd = SmartHireMatchingEngine.normalizeJobDescription({
    title: 'Scrum Master',
    skills: ['Agile', 'Scrum', 'Jira', 'Snowflake']
  });

  const cand = {
    id: 'cand-1234',
    name: 'Consistency Test Candidate',
    location: 'Milwaukee, WI',
    skills: ['Scrum', 'Jira', 'Snowflake'],
    resumeText: 'Scrum Master with 7 years leading sprint planning, backlog management in Jira, and Snowflake migrations.'
  };

  const cache = new SmartHireMatchingEngine.SessionEvaluationCache();

  // 1. Quick Sourcing evaluation
  const quickEval = cache.getOrEvaluate(cand, jd);

  // 2. Detailed Fit Dossier evaluation
  const dossierEval = cache.getOrEvaluate(cand, jd);

  // Assert exact identity and consistency
  assert.strictEqual(quickEval, dossierEval, 'Dossier must reuse the exact same evaluation object from cache');
  assert.strictEqual(quickEval.score, dossierEval.score, 'Scores must be identical');
  assert.strictEqual(quickEval.verdict, dossierEval.verdict, 'Verdicts must be identical');
  assert.strictEqual(quickEval.recommendation, dossierEval.recommendation, 'Recommendations must be identical');
  assert.strictEqual(quickEval.skillsMatchTable.length, dossierEval.skillsMatchTable.length);
});

// ---------------------------------------------------------------------
// TEST 7: CANDIDATE RANKING & INELIGIBLE SUBMISSION BLOCKER
// ---------------------------------------------------------------------
runTest('Candidate ranking blocks ineligible candidate from top rank', () => {
  const wiJd = SmartHireMatchingEngine.normalizeJobDescription({
    title: 'Scrum Master - Data & Analytics',
    location: 'Madison, WI'
  });

  const candidates = [
    {
      id: 'cand-tx',
      name: 'TX Superstar (Ineligible)',
      location: 'Austin, TX',
      resumeText: '15 years Scrum Master, Jira, Snowflake, PMP certified. Multi-team enterprise lead.'.repeat(3)
    },
    {
      id: 'cand-wi',
      name: 'WI Moderate (Eligible)',
      location: 'Madison, WI',
      resumeText: '8 years Scrum Master, Jira, Agile project management in Madison, WI.'.repeat(2)
    }
  ];

  const ranked = SmartHireMatchingEngine.rankCandidates(candidates, wiJd);

  assert.strictEqual(ranked.length, 2);
  // Candidate in WI must be ranked #1 because TX candidate is INELIGIBLE
  assert.strictEqual(ranked[0].candidateName, 'WI Moderate (Eligible)', 'Eligible candidate must outrank ineligible candidate');
  assert.strictEqual(ranked[0].rank, 1);
  assert.strictEqual(ranked[1].candidateName, 'TX Superstar (Ineligible)');
  assert.strictEqual(ranked[1].isHardFailure, true);
  assert.strictEqual(ranked[1].recommendation, 'REJECT');
});

// ---------------------------------------------------------------------
// TEST 8: CACHE INVALIDATION ON JD OR RESUME CHANGE
// ---------------------------------------------------------------------
runTest('Cache invalidation on JD change and resume content update', () => {
  const jd1 = SmartHireMatchingEngine.normalizeJobDescription({ id: '101', title: 'Scrum Master' });
  const jd2 = SmartHireMatchingEngine.normalizeJobDescription({ id: '102', title: '.NET Developer' });

  const cand = {
    id: 'cand-cache',
    name: 'Evolving Candidate',
    resumeText: 'Version 1 resume text: Scrum Master'
  };

  const cache = new SmartHireMatchingEngine.SessionEvaluationCache();

  // Evaluate on JD1
  const eval1 = cache.getOrEvaluate(cand, jd1);
  assert.strictEqual(cache.size(), 1);

  // Switching JD must clear previous evaluations
  cache.setActiveJd(jd2.jdHash);
  assert.strictEqual(cache.size(), 0, 'Switching active JD must invalidate previous session evaluations');

  // Update resume content on same candidate
  cand.resumeText = 'Version 2 updated resume text with expanded work history and Snowflake certification.';
  const eval2 = cache.getOrEvaluate(cand, jd2);
  assert.notStrictEqual(eval1.cacheKey, eval2.cacheKey, 'Cache key must differ when resume hash changes');
});

// ---------------------------------------------------------------------
// TEST 9: TEMPORARY DATA CLEANUP LIFECYCLE
// ---------------------------------------------------------------------
runTest('Temporary session data cleanup removes transient records', () => {
  const jd = SmartHireMatchingEngine.normalizeJobDescription({ title: 'Data Engineer' });
  const cache = new SmartHireMatchingEngine.SessionEvaluationCache();

  for (let i = 0; i < 5; i++) {
    cache.getOrEvaluate({ id: `c-${i}`, name: `Cand ${i}`, resumeText: 'Data engineering python sql' }, jd);
  }
  assert.strictEqual(cache.size(), 5);

  // Clear session
  cache.clear();
  assert.strictEqual(cache.size(), 0, 'Cache should be empty after clear()');
});

// ---------------------------------------------------------------------
// TEST 10: ERROR HANDLING & FAILED EXTRACTION
// ---------------------------------------------------------------------
runTest('Error handling for missing candidate data and failed extraction', () => {
  const jd = SmartHireMatchingEngine.normalizeJobDescription({ title: 'QA Engineer' });

  // Null candidate
  const resNull = SmartHireMatchingEngine.evaluateCandidate(null, jd);
  assert.strictEqual(resNull.extractionStatus, 'EXTRACTION_FAILED');
  assert.strictEqual(resNull.recommendation, 'HOLD_FOR_VERIFICATION');

  // Candidate with empty resume
  const resEmpty = SmartHireMatchingEngine.evaluateCandidate({ name: 'Empty Resume', resumeText: '' }, jd);
  assert.strictEqual(resEmpty.extractionStatus, 'EXTRACTION_FAILED');
  assert.strictEqual(resEmpty.confidence, 'Low');
  assert.ok(resEmpty.extractionVerification.warnings.length > 0);
});

// ---------------------------------------------------------------------
// TEST 11: FIX 1 - RESUME-ONLY EVIDENCE (MONSTER & DICE BUTTON STRIPPING)
// ---------------------------------------------------------------------
runTest('Fix 1: Monster/Dice action buttons & card boilerplate excluded from evidence snippets', () => {
  const jd = SmartHireMatchingEngine.normalizeJobDescription({
    title: 'Project Manager / Scrum Master — Data & Analytics',
    skills: ['Scrum Master', 'Jira', 'Stakeholder Reporting']
  });

  const noisyCand = {
    name: 'Noisy Profile',
    title: 'Scrum Master',
    location: 'Madison, WI',
    resumeText: `Select a Card Number-1, Open In New Tab, Favorite, SMS Opt-in
Candidate 1 of 24
Back to search results
Contact candidate · Send message · Add to Pipeline · Export to ATS · Next candidate
• Facilitated end-to-end Scrum ceremonies, daily standups, and Jira backlog refinement for data engineering teams.
• Presented weekly status reports and executive updates to key business stakeholders and steering committee.
Viewed by: recruiter@coolsofttech.com
Actions · Print · Share · Overview Profile Resume Activity Notes`
  };

  const res = SmartHireMatchingEngine.evaluateCandidate(noisyCand, jd);
  assert.ok(res.skillsMatchTable.length > 0);

  // Evidence snippets must NOT contain any Monster button text
  for (const row of res.skillsMatchTable) {
    const ev = (row.resumeEvidence || '').toLowerCase();
    assert.ok(!ev.includes('select a card'), 'Evidence snippet must not contain "Select a Card" button text');
    assert.ok(!ev.includes('contact candidate'), 'Evidence snippet must not contain "Contact candidate"');
    assert.ok(!ev.includes('export to ats'), 'Evidence snippet must not contain "Export to ATS"');
    assert.ok(!ev.includes('next candidate'), 'Evidence snippet must not contain "Next candidate"');
  }
});

// ---------------------------------------------------------------------
// TEST 12: FIX 2 - FULL-RESUME RECONCILIATION FOR SCRUM MASTER
// ---------------------------------------------------------------------
runTest('Fix 2: Scrum Master in candidate credentials never evaluates as NOT_DEMONSTRATED', () => {
  const jd = SmartHireMatchingEngine.normalizeJobDescription({
    title: 'Project Manager / Scrum Master — Data & Analytics',
    skills: ['Scrum Master', 'Jira', 'Agile']
  });

  const cand = {
    name: 'Scrum Leader',
    title: 'Agile Project Manager / Scrum Master',
    skills: ['Scrum Master', 'Agile', 'Jira'],
    resumeText: 'Certified Scrum Master with extensive experience leading multi-team Agile ceremonies and sprint retrospectives.'
  };

  const res = SmartHireMatchingEngine.evaluateCandidate(cand, jd);
  const scrumRow = res.skillsMatchTable.find(r => r.requirement.toLowerCase().includes('scrum'));
  assert.ok(scrumRow, 'Scrum requirement must exist in table');
  assert.notStrictEqual(scrumRow.evidenceStatus, 'NOT_DEMONSTRATED', 'Scrum Master must NEVER evaluate as NOT_DEMONSTRATED when present in resume');
  assert.strictEqual(scrumRow.evidenceStatus, 'DIRECT_MATCH');
});

// ---------------------------------------------------------------------
// TEST 13: FIX 3 - RAVI KUMAR FULL REQUIREMENT COVERAGE
// ---------------------------------------------------------------------
runTest('Fix 3: Ravi Kumar profile achieves complete requirement coverage (Scrum, Experience, Reporting)', () => {
  const jd = SmartHireMatchingEngine.normalizeJobDescription({
    id: '159348',
    title: 'Project Manager / Scrum Master — Data & Analytics',
    location: 'Madison, WI',
    skills: ['Scrum Master', 'Agile', 'Jira', 'Business Intelligence', 'Data Warehouse', 'Python (preferred)'],
    description: 'Looking for a Senior Scrum Master with 5+ years of experience leading multi-team Scrum delivery and stakeholder reporting. Wisconsin residency required.'
  });

  const raviKumar = {
    id: 'ravi-kumar-101',
    name: 'Ravi Kumar',
    title: 'Agile Project Manager / Scrum Master',
    location: 'Madison, WI',
    experience: '10+ Years',
    skills: ['Scrum Master', 'Agile', 'Jira', 'BigQuery', 'Hadoop', 'Spark', 'HDFS', 'Sprint Planning', 'Stakeholder Management'],
    resumeText: `Ravi Kumar — Agile Project Manager / Scrum Master
Location: Madison, WI · Authorized to Work in US

PROFESSIONAL SUMMARY:
Accomplished Agile Project Manager and Certified Scrum Master with over 10+ years of enterprise IT delivery experience managing cross-functional technical teams. Proven track record leading distributed Agile teams, managing Jira backlogs, and delivering analytics and data modernization initiatives.

CORE RESPONSIBILITIES & DELIVERABLES:
• Facilitated end-to-end Scrum ceremonies including daily standups, sprint planning, backlog grooming, and sprint retrospectives for data analytics teams.
• Managed Jira boards, burn-down metrics, and team velocity to ensure iterative on-time release cycles.
• Prepared and presented executive status reports, milestone progress, and risk registers to business stakeholders and leadership steering committees.
• Led big data platform modernizations using BigQuery, Hadoop, and Apache Spark for high-throughput streaming and data lake analytics.
• Mentored developers and product owners in Agile and Scrum values.

EDUCATION & CERTIFICATIONS:
• Certified Scrum Master (CSM)
• Bachelor of Science in Information Technology`
  };

  const res = SmartHireMatchingEngine.evaluateCandidate(raviKumar, jd);

  // 1. Scrum Master must be DIRECT_MATCH
  const scrumRow = res.skillsMatchTable.find(r => r.requirement.toLowerCase().includes('scrum'));
  assert.ok(scrumRow);
  assert.strictEqual(scrumRow.evidenceStatus, 'DIRECT_MATCH', 'Ravi Scrum Master must be DIRECT_MATCH');

  // 2. 5+ Years Experience must be DIRECT_MATCH (Ravi has 10+ years)
  const expRow = res.skillsMatchTable.find(r => r.requirement.toLowerCase().includes('experience'));
  assert.ok(expRow, 'Experience requirement must exist');
  assert.strictEqual(expRow.evidenceStatus, 'DIRECT_MATCH', '10+ years experience must satisfy 5+ years requirement as DIRECT_MATCH');

  // 3. Stakeholder Reporting must be DIRECT_MATCH or STRONG_EQUIVALENT
  const reportRow = res.skillsMatchTable.find(r => r.requirement.toLowerCase().includes('reporting') || r.requirement.toLowerCase().includes('leadership'));
  if (reportRow) {
    assert.ok(
      reportRow.evidenceStatus === 'DIRECT_MATCH' || reportRow.evidenceStatus === 'STRONG_EQUIVALENT',
      'Stakeholder reporting must be demonstrated'
    );
  }

  // 4. Overall eligibility & score
  assert.strictEqual(res.eligibilityStatus, 'VERIFIED_ELIGIBLE');
  assert.strictEqual(res.isHardFailure, false);
  assert.ok(res.score >= 80, `Ravi Kumar should score >= 80%, got ${res.score}%`);
  assert.ok(['SUBMIT', 'INTERVIEW'].includes(res.recommendation));
});

// ---------------------------------------------------------------------
// TEST 14: FIX 4 - RELATED DATA SKILLS (BIGQUERY, HADOOP, SPARK, HDFS)
// ---------------------------------------------------------------------
runTest('Fix 4: BigQuery, Hadoop, Spark, HDFS recognized as PARTIAL_MATCH for BI/DW Scrum Leadership', () => {
  const jd = SmartHireMatchingEngine.normalizeJobDescription({
    title: 'Project Manager / Scrum Master — Data & Analytics',
    skills: ['Scrum Master', 'Business Intelligence', 'Data Warehouse']
  });

  const bigDataCand = {
    name: 'Big Data Specialist',
    title: 'Scrum Master',
    skills: ['Scrum', 'BigQuery', 'Hadoop', 'Spark', 'HDFS'],
    resumeText: 'Scrum Master leading big data engineering teams using BigQuery, Hadoop, Spark, and HDFS for distributed data processing.'
  };

  const res = SmartHireMatchingEngine.evaluateCandidate(bigDataCand, jd);
  const biDwRow = res.skillsMatchTable.find(r => r.requirement.toLowerCase().includes('data warehouse') || r.requirement.toLowerCase().includes('business intelligence'));
  assert.ok(biDwRow, 'BI/DW requirement must be present');
  assert.strictEqual(
    biDwRow.evidenceStatus,
    'PARTIAL_MATCH',
    'BigQuery/Hadoop/Spark without explicit BI/DW must be PARTIAL_MATCH (0.50), not DIRECT_MATCH'
  );
  assert.ok(biDwRow.gapOrQualification.includes('BigQuery/Hadoop/Spark/HDFS'));
});

// ---------------------------------------------------------------------
// TEST 15: FIX 5 - SCORE AND RECOMMENDATION CONSISTENCY
// ---------------------------------------------------------------------
runTest('Fix 5: Authoritative calculation ensures identical scores between Quick Sourcing and Detailed Dossier', () => {
  const jd = SmartHireMatchingEngine.normalizeJobDescription({
    title: 'Project Manager / Scrum Master — Data & Analytics',
    skills: ['Scrum Master', 'Agile', 'Jira', 'Data Warehouse']
  });

  const cand = {
    id: 'cand-sync-test',
    name: 'Consistency Test Candidate',
    location: 'Madison, WI',
    resumeText: 'Scrum Master with 7 years experience delivering agile sprints, Jira boards, and enterprise data warehouse solutions in Madison, WI.'
  };

  // Quick Sourcing entry point
  const quickEval = SmartHireMatchingEngine.evaluateCandidate(cand, jd);

  // Detailed Dossier entry point (session cache)
  const cache = new SmartHireMatchingEngine.SessionEvaluationCache();
  const dossierEval = cache.getOrEvaluate(cand, jd);

  assert.strictEqual(quickEval.score, dossierEval.score, 'Quick Sourcing and Detailed Dossier scores MUST BE 100% IDENTICAL');
  assert.strictEqual(quickEval.verdict, dossierEval.verdict);
  assert.strictEqual(quickEval.fitCategory, dossierEval.fitCategory);
  assert.strictEqual(quickEval.recommendation, dossierEval.recommendation);
  assert.strictEqual(quickEval.eligibilityStatus, dossierEval.eligibilityStatus);
});

// ---------------------------------------------------------------------
// TEST 16: FIX - 172-CHAR MONSTER CARD SNIPPET PROVISIONAL VALIDATION
// ---------------------------------------------------------------------
runTest('Fix: 172-char search card snippet classified as provisional and blocked from SUBMIT', () => {
  const rajithaCardSnippet = {
    name: 'Rajitha A',
    title: 'Software Engineer in Test',
    location: 'Noblesville, Indiana',
    skills: ['Java', 'JavaScript', 'Python'],
    resumeText: 'Rajitha A. Software Engineer in Test. Noblesville, Indiana. Updated: 1 day ago. Current: Software Engineer in Test, Walmart Global Tech. Previous: Senior QA, Avenue Code. Top Skills: Java, JavaScript, Python.' // exact length ~207 chars
  };

  const vSnippet = SmartHireMatchingEngine.verifyAndClassifyResume(rajithaCardSnippet);
  assert.strictEqual(vSnippet.status, 'PARTIAL_RESUME_EXTRACTED', '172-200 char card snippet must be PARTIAL_RESUME_EXTRACTED');
  assert.strictEqual(vSnippet.isProvisional, true, 'Snippet must be marked provisional');
  assert.ok(vSnippet.extractedLength < 500, 'Snippet character count must reflect actual length');

  const qaJd = SmartHireMatchingEngine.normalizeJobDescription({
    title: 'QA Analyst / SDET',
    location: 'Remote',
    skills: ['Selenium', 'Playwright', 'Java', 'Python', 'Cucumber']
  });

  const evalSnippet = SmartHireMatchingEngine.evaluateCandidate(rajithaCardSnippet, qaJd);
  assert.strictEqual(evalSnippet.isProvisional, true);
  assert.notStrictEqual(evalSnippet.recommendation, 'SUBMIT', 'Provisional candidate with only card snippet CANNOT have SUBMIT recommendation');
  assert.strictEqual(evalSnippet.recommendation, 'HOLD_FOR_VERIFICATION');
});

// ---------------------------------------------------------------------
// TEST 17: FIX - RIGHT-PANE FULL RESUME EXTRACTION & RECONCILIATION
// ---------------------------------------------------------------------
runTest('Fix: Right-pane full resume extraction (2,000+ chars) achieves FULL_RESUME_EXTRACTED', () => {
  const rajithaFullResume = {
    name: 'Rajitha A',
    title: 'Software Engineer in Test',
    location: 'Noblesville, Indiana, United States',
    email: 'rajitha.a.vpsxa@contact.monster.com',
    skills: ['Java', 'JavaScript', 'Python', 'Selenium', 'Playwright', 'Cucumber', 'TestNG', 'Appium'],
    resumeSourceType: 'RESUME_DOCUMENT',
    resumeText: `Rajitha A
Software Engineer in Test
Noblesville, Indiana, United States
rajitha.a.vpsxa@contact.monster.com

SUMMARY
Over 7+ years of experience in testing a wide range of applications across various platforms. Onboarded, coached, and motivated junior-level developers and manual testers on automation. Expertise in manual and automation testing of client/server, mobile, web-based, and cloud (AWS) applications. Familiar with both Waterfall and Agile scrum methodology. Experience in working very closely with Product owners and attending different meetings, including sprint planning, scrum, backlog grooming, sprint review, and sprint retrospective. Worked with DevOps, installing, configuring, and integrating automation scripts on continuous integration tools. Expert in Behavior Driven Development (BDD) and Test-Driven Development (TDD). Developed tests in Gherkin syntax using Cucumber, creating scenarios, scenario outlines, features, step definitions, and Cucumber reports. Proficient in developing Test Plans, Test Cases, Test Scripts, and Test Designs. Extensive experience performing various types of testing, including Sanity, Smoke, Black Box, GUI, Functional, Unit, Integration, Regression, Compatibility, System, Performance, Load, Stress, and UAT tests. Expertise in automated testing using testing frameworks, including but not limited to Playwright, Selenium, Appium, TestNG, Cucumber, Cypress, Protractor and WebDriver IO framework. Experienced across the complete SDLC/STLC, including requirements analysis, test strategy, test planning, and defect lifecycle management.

PROFESSIONAL EXPERIENCE
Walmart Global Tech - Software Engineer in Test (Current)
• Designed and executed automated end-to-end regression suites using Playwright, TypeScript, and Selenium WebDriver.
• Implemented continuous integration test automation pipelines in Jenkins and GitHub Actions.
• Led daily defect triage and sprint retrospectives with cross-functional teams.

Avenue Code - Senior QA Analyst (Previous)
• Spearheaded mobile and web API automation using Postman, RestAssured, and Appium.
• Authored comprehensive test plans, test cases, and requirement traceability matrices in JIRA.

EDUCATION & CERTIFICATIONS
Bachelor of Science in Computer Science
Certified Scrum Master (CSM), ISTQB Certified Tester`
  };

  const vFull = SmartHireMatchingEngine.verifyAndClassifyResume(rajithaFullResume);
  assert.strictEqual(vFull.status, 'FULL_RESUME_EXTRACTED');
  assert.strictEqual(vFull.isProvisional, false, 'Full resume must NOT be provisional');
  assert.ok(vFull.extractedLength > 1500, `Extracted length (${vFull.extractedLength}) must be > 1500`);
  assert.ok(vFull.sourceSectionsFound.includes('Summary'));
  assert.ok(vFull.sourceSectionsFound.includes('Experience'));
  assert.ok(vFull.sourceSectionsFound.includes('Responsibilities'));
  assert.ok(vFull.sourceSectionsFound.includes('Education'));
});

// ---------------------------------------------------------------------
// TEST 18: INACCESSIBLE / FAILED RESUME EXTRACTION
// ---------------------------------------------------------------------
runTest('Inaccessible or empty resume returns EXTRACTION_FAILED with provisional flag', () => {
  const emptyCandidate = {
    name: 'Unreachable Candidate',
    resumeText: '',
    summary: ''
  };

  const vEmpty = SmartHireMatchingEngine.verifyAndClassifyResume(emptyCandidate);
  assert.strictEqual(vEmpty.status, 'EXTRACTION_FAILED');
  assert.strictEqual(vEmpty.isProvisional, true);
  assert.strictEqual(vEmpty.extractedLength, 0);
  assert.strictEqual(vEmpty.sourceType, 'NONE');

  const jd = SmartHireMatchingEngine.normalizeJobDescription({ title: 'Software Engineer', skills: ['Python'] });
  const evalEmpty = SmartHireMatchingEngine.evaluateCandidate(emptyCandidate, jd);
  assert.strictEqual(evalEmpty.recommendation, 'HOLD_FOR_VERIFICATION');
  assert.ok(evalEmpty.recommendationExplanation.includes('extraction failed'));
});

// ---------------------------------------------------------------------
// TEST 19: UNRELATED WEBPAGE NOISE & MONSTER BUTTON EXCLUSION
// ---------------------------------------------------------------------
runTest('Unrelated webpage text and Monster action buttons are excluded from clean resume', () => {
  const dirtyMonsterPageText = `Select a Card Number-2
Viewed by: Recruiter
Favorite
Veteran Diversity
SMS Opt-in
Candidate 2 of 21
Back to search results
Contact candidate
Send message
Add to Pipeline
Export to ATS
Print
Share
Need Help?
Post a Job
Create Campaign
Clear All
Undo
Update
Rajitha A
Software Engineer in Test
SUMMARY
Over 7+ years of experience in testing a wide range of applications across various platforms.
• Led automated testing with Selenium, Playwright, and Cucumber.
• Managed sprint planning, scrum backlog grooming, and test plan creation in Jira.
Education: Bachelor of Science in Computer Science.`;

  const cleaned = SmartHireMatchingEngine.cleanCandidateResumeText(dirtyMonsterPageText);
  assert.ok(!cleaned.includes('Select a Card'), 'Must exclude Select a Card');
  assert.ok(!cleaned.includes('Contact candidate'), 'Must exclude Contact candidate');
  assert.ok(!cleaned.includes('Add to Pipeline'), 'Must exclude Add to Pipeline');
  assert.ok(!cleaned.includes('Export to ATS'), 'Must exclude Export to ATS');
  assert.ok(!cleaned.includes('Need Help?'), 'Must exclude Need Help?');
  assert.ok(cleaned.includes('Over 7+ years of experience in testing'), 'Genuine summary must be preserved');
  assert.ok(cleaned.includes('Selenium, Playwright, and Cucumber'), 'Genuine bullet points must be preserved');
});

// ---------------------------------------------------------------------
// TEST 20: UNIVERSAL JOB FAMILY - QA ANALYST / SDET MATCHING
// ---------------------------------------------------------------------
runTest('Universal Job Family: QA Analyst / SDET evaluation for Rajitha A yields Strong Fit', () => {
  const qaJd = SmartHireMatchingEngine.normalizeJobDescription({
    id: 'req-qa-001',
    title: 'Senior QA Analyst / SDET',
    location: 'Remote',
    description: 'Looking for a Senior QA Analyst with 5+ years of experience in manual and automated testing. Mandatory skills: Selenium, Playwright, Cucumber, BDD, Test Plans, Test Scripts, Agile Scrum.',
    skills: ['Selenium', 'Playwright', 'Cucumber', 'BDD', 'Test Plans', 'Agile Scrum']
  });

  const rajithaCandidate = {
    name: 'Rajitha A',
    title: 'Software Engineer in Test',
    location: 'Noblesville, Indiana',
    experience: '7+ Years',
    skills: ['Selenium', 'Playwright', 'Cucumber', 'BDD', 'Java', 'Python', 'TestNG'],
    resumeSourceType: 'RESUME_DOCUMENT',
    resumeText: `Rajitha A - Software Engineer in Test
SUMMARY: Over 7+ years of experience in software testing. Expertise in automated testing using Playwright, Selenium, and Cucumber BDD. Proficient in developing Test Plans, Test Cases, and Test Scripts. Attending sprint planning, scrum, backlog grooming, and defect triage.
Experience: Walmart Global Tech - Software Engineer in Test. Designed automated test suites using Selenium WebDriver and Playwright. Facilitated sprint planning and backlog grooming in Jira.
Education: Bachelor of Science in Computer Science.`
  };

  const evalResult = SmartHireMatchingEngine.evaluateCandidate(rajithaCandidate, qaJd);
  assert.ok(evalResult.score >= 85, `Score for qualified QA profile must be >= 85% (actual: ${evalResult.score}%)`);
  assert.strictEqual(evalResult.fitCategory, 'Strong Fit');
  assert.strictEqual(evalResult.recommendation, 'SUBMIT', 'Fully qualified QA candidate with full resume must be recommended for SUBMIT');
  assert.strictEqual(evalResult.isProvisional, false);
});

// ---------------------------------------------------------------------
// TEST 21: DYNAMIC STATE RESIDENCY GATING
// ---------------------------------------------------------------------
runTest('Dynamic state residency: California or Remote role does not reject non-WI candidates', () => {
  // Case A: Remote role without state mandate
  const remoteJd = SmartHireMatchingEngine.normalizeJobDescription({
    title: 'Software Engineer',
    location: 'Remote',
    description: '100% Remote position for full stack development. Any US location accepted.'
  });

  const indianaCandidate = {
    name: 'Indiana Resident',
    location: 'Noblesville, IN',
    resumeText: 'Full stack software developer with 6 years experience in React, Node.js, and PostgreSQL.'
  };

  const eligRemote = SmartHireMatchingEngine.evaluateEligibility(indianaCandidate, remoteJd);
  assert.strictEqual(eligRemote.eligibilityStatus, 'VERIFIED_ELIGIBLE');
  assert.strictEqual(eligRemote.isHardFailure, false);

  // Case B: Wisconsin agency role with explicit state mandate
  const wisconsinJd = SmartHireMatchingEngine.normalizeJobDescription({
    title: 'Agile Project Manager',
    location: 'Madison, WI',
    description: 'Mandatory Wisconsin residency required for State of Wisconsin project.'
  });

  const eligWiFailure = SmartHireMatchingEngine.evaluateEligibility(indianaCandidate, wisconsinJd);
  assert.strictEqual(eligWiFailure.eligibilityStatus, 'INELIGIBLE');
  assert.strictEqual(eligWiFailure.isHardFailure, true);
});

// ---------------------------------------------------------------------
// TEST 22: UNIVERSAL 35/20/15/10/10/5/5 WEIGHTS & EXPERIENCE RANGES
// ---------------------------------------------------------------------
runTest('Universal 35/20/15/10/10/5/5 weights and experience range parsing', () => {
  const weights = SmartHireMatchingEngine.DEFAULT_WEIGHTS;
  assert.strictEqual(weights.MANDATORY_TECHNICAL, 0.35, 'Mandatory Technical must be 35%');
  assert.strictEqual(weights.DOMAIN_FUNCTIONAL, 0.20, 'Domain Functional must be 20%');
  assert.strictEqual(weights.RESPONSIBILITIES, 0.15, 'Responsibilities must be 15%');
  assert.strictEqual(weights.EXPERIENCE_COMPLEXITY, 0.10, 'Experience Complexity must be 10%');
  assert.strictEqual(weights.PREFERRED_SKILLS, 0.10, 'Preferred Skills must be 10%');
  assert.strictEqual(weights.LEADERSHIP_COMM, 0.05, 'Leadership & Comm must be 5%');
  assert.strictEqual(weights.EDUCATION_CERTS, 0.05, 'Education & Certs must be 5%');

  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1.0) < 0.001, 'Sum of default weights must be 1.0 (100%)');

  // Experience range parsing
  const rangeJd = SmartHireMatchingEngine.normalizeJobDescription({
    title: 'QA Automation Engineer',
    description: 'Requires 1-3 years of experience in software test automation.'
  });
  assert.strictEqual(rangeJd.requiredYears, 1, 'Experience range "1-3 years" should parse minimum 1 year required');
});

// ---------------------------------------------------------------------
// TEST 23: FIX: LIA SMITH 1,101-CHAR PARTIAL PROFILE SUMMARY CLASSIFIED AS PROVISIONAL
// ---------------------------------------------------------------------
runTest('Fix: Lia Smith 1,101-char partial summary classified as PARTIAL_RESUME_EXTRACTED and blocked from SUBMIT', () => {
  const partialSummary = `Lia Smith
Columbia, SC · lia.smith@email.com
SUMMARY
Experienced Enterprise Program Manager and IT professional with over 8 years of experience leading cross-functional technology initiatives and enterprise technology delivery. Skilled in Agile methodologies, technology transformations, and managing complex IT project deliverables. Proven track record in stakeholder communication and steering committee reporting across financial services and banking environments. Coordinated IT operations and strategy across multi-functional delivery teams. Adept at identifying and mitigating project risks and ensuring regulatory compliance. Experienced with budget monitoring and vendor procurement renewals. Seeking Assistant IT Director or Senior Enterprise Project Lead role in Columbia, SC.`;

  assert.ok(partialSummary.length > 500 && partialSummary.length < 1500, 'Partial text must be between 500 and 1500 chars');

  const classified = SmartHireMatchingEngine.verifyAndClassifyResume({
    name: 'Lia Smith',
    resumeText: partialSummary,
    location: 'Columbia, SC'
  });

  assert.strictEqual(classified.status, 'PARTIAL_RESUME_EXTRACTED', 'Must be classified as PARTIAL_RESUME_EXTRACTED');
  assert.strictEqual(classified.isProvisional, true, 'isProvisional must be true for partial profile summary');
  assert.strictEqual(classified.sourceType, 'PROFILE_SNIPPET', 'sourceType must be PROFILE_SNIPPET');
  assert.ok(classified.warnings.length > 0, 'Must have extraction warning');

  const assistantItDirectorJd = SmartHireMatchingEngine.normalizeJobDescription({
    id: '159348',
    title: 'Assistant IT Director / Enterprise Program Manager - Project Lead',
    location: 'Columbia, SC',
    description: 'State Treasurers Office (STO). Full-time on-site in Columbia, SC 5 days a week. Mandatory SC residency. Enterprise technology delivery, Cybersecurity, Managed-Service SLA Ownership, Active Directory / Entra ID, Microsoft Intune, Financial services experience, IT Operations & Strategy Leadership, Direct supervisory experience 3+ years, Risk & Audit compliance, Incident response & after-hours support, Budget monitoring, Executive & steering committee reporting, PMP or SAFe certification, Bachelor degree required.'
  });

  const evalResult = SmartHireMatchingEngine.evaluateCandidate({
    id: 'lia-partial',
    name: 'Lia Smith',
    resumeText: partialSummary,
    location: 'Columbia, SC'
  }, assistantItDirectorJd);

  assert.strictEqual(evalResult.isProvisional, true, 'Evaluation must be flagged provisional');
  assert.notStrictEqual(evalResult.recommendation, 'SUBMIT', 'Provisional evaluation must never be SUBMIT');
  assert.strictEqual(evalResult.recommendation, 'HOLD_FOR_VERIFICATION', 'Provisional partial evaluation must be HOLD_FOR_VERIFICATION');
});

// ---------------------------------------------------------------------
// TEST 24: FIX: IN-PROGRESS DEGREE (EXPECTED JUNE 2027) GATED AS PARTIAL_MATCH (0.50)
// ---------------------------------------------------------------------
runTest('Fix: In-progress degree (Expected June 2027) awarded PARTIAL_MATCH (0.50) with qualification note', () => {
  const resumeWithInProgressDegree = `LIA SMITH
Columbia, SC · lia.smith@email.com
SUMMARY: Senior Enterprise Program Manager with 9+ years experience.
EDUCATION:
• Candidate for Bachelor of Science in Information Technology — University of South Carolina (Expected June 2027)
• Project Management Professional (PMP) — PMI`;

  const assistantItDirectorJd = SmartHireMatchingEngine.normalizeJobDescription({
    title: 'Assistant IT Director',
    description: "Requires Bachelor's Degree in Computer Science or Related field."
  });

  const eduReq = assistantItDirectorJd.categories.EDUCATION_CERTS.find(r => r.name.toLowerCase().includes('bachelor'));
  assert.ok(eduReq, "Must have Bachelor's Degree requirement");

  const match = SmartHireMatchingEngine.matchRequirementEvidence(eduReq, resumeWithInProgressDegree, ['pmp'], 'Enterprise Program Manager');
  assert.strictEqual(match.evidenceStatus, 'PARTIAL_MATCH', 'In-progress degree must be PARTIAL_MATCH');
  assert.strictEqual(match.evidenceScore, 0.50, 'In-progress degree score must be 0.50');
  assert.ok(match.gapOrQualification.includes('Degree in progress') && match.gapOrQualification.includes('2027'), 'Must specify in-progress graduation year in gap note');
});

// ---------------------------------------------------------------------
// TEST 25: FIX: STRICT NEGATIVE EVIDENCE GATING FOR SLA, AD/ENTRA, INTUNE, INCIDENT & SUPERVISORY
// ---------------------------------------------------------------------
runTest('Fix: Strict negative evidence gating awards NOT_DEMONSTRATED (0.00) for undocumented items', () => {
  const assistantItDirectorJd = SmartHireMatchingEngine.normalizeJobDescription({
    id: '159348',
    title: 'Assistant IT Director / Enterprise Program Manager - Project Lead',
    location: 'Columbia, SC',
    description: 'State Treasurers Office (STO). Full-time on-site in Columbia, SC 5 days a week. Mandatory SC residency. Enterprise technology delivery, Cybersecurity, Managed-Service SLA Ownership, Active Directory / Entra ID, Microsoft Intune, Financial services experience, IT Operations & Strategy Leadership, Direct supervisory experience 3+ years, Risk & Audit compliance, Incident response & after-hours support, Budget monitoring, Executive & steering committee reporting, PMP or SAFe certification, Bachelor degree required.'
  });

  // Resume has delivery & leadership but explicitly lacks SLA, AD, Intune, Incident Response, and Direct Supervisory Tenure
  const resumeWithoutNegativeEvidence = `Lia Smith
Columbia, SC
Summary: Senior Enterprise Program Manager with Agile, Scrum, and project delivery experience. Led software project milestones, coordinated meetings, and tracked financial project budgets.`;

  const techReqs = assistantItDirectorJd.categories.MANDATORY_TECHNICAL;
  const domainReqs = assistantItDirectorJd.categories.DOMAIN_FUNCTIONAL;
  const respReqs = assistantItDirectorJd.categories.RESPONSIBILITIES;

  const slaReq = techReqs.find(r => r.name.includes('SLA'));
  const adReq = techReqs.find(r => r.name.includes('Active Directory'));
  const intuneReq = techReqs.find(r => r.name.includes('Intune'));
  const supReq = domainReqs.find(r => r.name.includes('Direct Supervisory'));
  const incReq = respReqs.find(r => r.name.includes('Incident Response'));

  assert.ok(slaReq && adReq && intuneReq && supReq && incReq, 'All 5 gated requirements must be present in JD');

  const matchSla = SmartHireMatchingEngine.matchRequirementEvidence(slaReq, resumeWithoutNegativeEvidence, [], '');
  const matchAd = SmartHireMatchingEngine.matchRequirementEvidence(adReq, resumeWithoutNegativeEvidence, [], '');
  const matchIntune = SmartHireMatchingEngine.matchRequirementEvidence(intuneReq, resumeWithoutNegativeEvidence, [], '');
  const matchSup = SmartHireMatchingEngine.matchRequirementEvidence(supReq, resumeWithoutNegativeEvidence, [], '');
  const matchInc = SmartHireMatchingEngine.matchRequirementEvidence(incReq, resumeWithoutNegativeEvidence, [], '');

  assert.strictEqual(matchSla.evidenceStatus, 'NOT_DEMONSTRATED', 'SLA ownership must be NOT_DEMONSTRATED');
  assert.strictEqual(matchAd.evidenceStatus, 'NOT_DEMONSTRATED', 'Active Directory must be NOT_DEMONSTRATED');
  assert.strictEqual(matchIntune.evidenceStatus, 'NOT_DEMONSTRATED', 'Intune must be NOT_DEMONSTRATED');
  assert.strictEqual(matchSup.evidenceStatus, 'NOT_DEMONSTRATED', 'Supervisory tenure must be NOT_DEMONSTRATED');
  assert.strictEqual(matchInc.evidenceStatus, 'NOT_DEMONSTRATED', 'Incident response must be NOT_DEMONSTRATED');

  assert.strictEqual(matchSla.evidenceScore, 0.00);
  assert.strictEqual(matchAd.evidenceScore, 0.00);
  assert.strictEqual(matchIntune.evidenceScore, 0.00);
  assert.strictEqual(matchSup.evidenceScore, 0.00);
  assert.strictEqual(matchInc.evidenceScore, 0.00);
});

// ---------------------------------------------------------------------
// TEST 26: FIX: LIA SMITH COMPLETE 3-PAGE RESUME EVALUATION ACHIEVES FULL_RESUME_EXTRACTED
// ---------------------------------------------------------------------
runTest('Fix: Lia Smith full 3-page resume achieves FULL_RESUME_EXTRACTED and evaluates to objective ~64% Partial Fit (BACKUP)', () => {
  const fullResume3Page = `LIA SMITH
Columbia, SC · (803) 555-0192 · lia.smith@email.com · linkedin.com/in/lia-smith-pm

PROFESSIONAL SUMMARY
Senior Enterprise Program Manager and IT Delivery Lead with 9+ years of progressive experience delivering complex enterprise technology delivery, infrastructure modernization, and systems integration programs across financial services and public sector institutions. Proven leader acting as trusted second-in-command working manager for executive IT leadership. Deep expertise in cybersecurity frameworks, NIST standards, IT operations coordination, risk assessment, and regulatory audit compliance. Expert in Agile/Scrum and Waterfall delivery models holding active PMP and SAFe certifications. Current South Carolina resident based in Columbia, SC with full availability for dedicated 5-day on-site engagement.

PROFESSIONAL EXPERIENCE

First State Financial Services / State Banking Treasury Project — Columbia, SC
Lead Enterprise Program Manager / Senior IT Project Lead | 2021 – Present
• Spearheaded enterprise technology delivery for multi-tier banking and treasury systems integration involving SAP environment and secure core payment operations.
• Acted as working manager coordinating IT division leadership, managing multi-functional technical teams, and aligning IT operations with strategic institutional goals.
• Implemented rigorous cybersecurity protocols, vulnerability management, and access control standards adhering to state financial security compliance guidelines.
• Facilitated risk & audit compliance reviews, conducting comprehensive risk assessments and remediation workflows across internal financial applications.
• Directed budget monitoring, procurement approvals, and vendor contract renewals totaling $4.2M annually, ensuring strict financial accountability.
• Prepared and presented executive reporting and weekly status briefings to the executive steering committee, agency directors, and senior stakeholders.
• Coordinated with cross-functional software engineering, database, and infrastructure teams across complex sprint cycles.

Carolina Enterprise Solutions — Columbia, SC
Senior Project Manager — IT Infrastructure & Agile Delivery | 2017 – 2021
• Managed enterprise IT systems integration programs, coordinating data center transitions and enterprise cloud migrations for financial institutions.
• Led sprint planning, backlog grooming, retrospectives, and cross-team Agile delivery across 4 simultaneous scrum teams.
• Collaborated with cybersecurity engineers to enforce data governance, network segmentation, and annual audit readiness.
• Oversaw capital IT hardware and software procurement budgets of $2.5M, negotiating vendor contracts and deliverables.
• Provided regular executive briefings, status dashboards, and steering committee reporting for senior agency leadership.

Midlands Technical Systems — Columbia, SC
Technical Project Coordinator | 2015 – 2017
• Supported enterprise technology delivery and system deployment lifecycles for state government clients.
• Assisted senior project managers with schedule tracking, milestone validation, and status reporting.

EDUCATION & CERTIFICATIONS
• Bachelor of Science in Information Technology — University of South Carolina, Columbia, SC (Expected June 2027)
• Project Management Professional (PMP) — Project Management Institute (PMI), License #2847192
• Certified SAFe® 5 Agilist — Scaled Agile Inc.
• Certified ScrumMaster (CSM) — Scrum Alliance

LOCATION & ELIGIBILITY
• Resident: Columbia, South Carolina (Current SC Resident)
• Work Authorization: US Citizen
• Work Arrangement: Full-time Onsite (Columbia, SC 5 days/week available)`;

  const classification = SmartHireMatchingEngine.verifyAndClassifyResume({
    name: 'Lia Smith',
    resumeText: fullResume3Page,
    location: 'Columbia, SC'
  });

  assert.strictEqual(classification.status, 'FULL_RESUME_EXTRACTED', 'Must be classified as FULL_RESUME_EXTRACTED');
  assert.strictEqual(classification.isProvisional, false, 'isProvisional must be false for complete resume');
  assert.strictEqual(classification.sourceType, 'RESUME_DOCUMENT', 'sourceType must be RESUME_DOCUMENT');
  assert.ok(classification.extractedLength > 3000, 'Length must be > 3000 characters');
  assert.ok(classification.sourceSectionsFound.includes('Summary') && classification.sourceSectionsFound.includes('Experience') && classification.sourceSectionsFound.includes('Education') && classification.sourceSectionsFound.includes('Certifications'));

  const assistantItDirectorJd = SmartHireMatchingEngine.normalizeJobDescription({
    id: '159348',
    title: 'Assistant IT Director / Enterprise Program Manager - Project Lead',
    location: 'Columbia, SC',
    description: 'State Treasurers Office (STO). Full-time on-site in Columbia, SC 5 days a week. Mandatory SC residency. Enterprise technology delivery, Cybersecurity, Managed-Service SLA Ownership, Active Directory / Entra ID, Microsoft Intune, Financial services experience, IT Operations & Strategy Leadership, Direct supervisory experience 3+ years, Risk & Audit compliance, Incident response & after-hours support, Budget monitoring, Executive & steering committee reporting, PMP or SAFe certification, Bachelor degree required.'
  });

  const fullEval = SmartHireMatchingEngine.evaluateCandidate({
    id: 'lia-full',
    name: 'Lia Smith',
    resumeText: fullResume3Page,
    location: 'Columbia, SC'
  }, assistantItDirectorJd);

  assert.strictEqual(fullEval.score, 64, 'Objectively calculated score must be 64% based on 7-category weights');
  assert.strictEqual(fullEval.fitCategory, 'Partial Fit', 'Fit category must be Partial Fit');
  assert.strictEqual(fullEval.recommendation, 'BACKUP', 'Recommendation must be BACKUP');
  assert.strictEqual(fullEval.isProvisional, false, 'Full evaluation must not be provisional');

  // Verify documented matches
  const techDelivery = fullEval.skillsMatchTable.find(r => r.requirement.includes('Enterprise Technology Delivery'));
  const cyber = fullEval.skillsMatchTable.find(r => r.requirement.includes('Cybersecurity'));
  const finServ = fullEval.skillsMatchTable.find(r => r.requirement.includes('Financial Services'));
  const itOps = fullEval.skillsMatchTable.find(r => r.requirement.includes('IT Operations'));
  const pmpCert = fullEval.skillsMatchTable.find(r => r.requirement.includes('PMP or SAFe'));

  assert.strictEqual(techDelivery.evidenceStatus, 'DIRECT_MATCH');
  assert.strictEqual(cyber.evidenceStatus, 'DIRECT_MATCH');
  assert.strictEqual(finServ.evidenceStatus, 'DIRECT_MATCH');
  assert.strictEqual(itOps.evidenceStatus, 'DIRECT_MATCH');
  assert.strictEqual(pmpCert.evidenceStatus, 'DIRECT_MATCH');
});

// ---------------------------------------------------------------------
// TEST 27: FIX: DYNAMIC SOUTH CAROLINA RESIDENCY AND 5-DAY ONSITE VALIDATION (PENDING_VERIFICATION)
// ---------------------------------------------------------------------
runTest('Fix: Dynamic South Carolina residency and 5-day onsite validation verified as PENDING_VERIFICATION', () => {
  const scJd = SmartHireMatchingEngine.normalizeJobDescription({
    id: '159348',
    title: 'Assistant IT Director / Enterprise Program Manager - Project Lead',
    location: 'Columbia, SC',
    description: 'State Treasurers Office (STO). Full-time on-site in Columbia, SC 5 days a week. Mandatory SC residency required.'
  });

  assert.strictEqual(scJd.eligibilityRules.requiresStateResidency, true);
  assert.strictEqual(scJd.eligibilityRules.requiredState, 'SC');

  // Candidate in Columbia, SC: Location aligns with 5-day on-site work, but legal state residency is PENDING_VERIFICATION
  const columbiaCandidate = {
    name: 'Lia Smith',
    location: 'Columbia, SC',
    resumeText: 'Experienced IT manager based in Columbia, SC.'
  };

  const eligResident = SmartHireMatchingEngine.evaluateEligibility(columbiaCandidate, scJd);
  assert.strictEqual(eligResident.eligibilityStatus, 'PENDING_VERIFICATION', 'Columbia, SC location must evaluate to PENDING_VERIFICATION');
  assert.strictEqual(eligResident.isHardFailure, false, 'Location alignment must not be a hard failure');
  assert.ok(eligResident.eligibilityNotes.includes('supports location alignment'), 'Notes must state location supports alignment');
  assert.ok(eligResident.eligibilityNotes.includes('pending formal verification of current South Carolina residency'), 'Notes must state residency pending verification');

  // Non-resident candidate in Dallas, TX
  const outOfStateCandidate = {
    name: 'Texas Candidate',
    location: 'Dallas, TX',
    resumeText: 'IT Director with 10 years experience.'
  };

  const eligNonResident = SmartHireMatchingEngine.evaluateEligibility(outOfStateCandidate, scJd);
  assert.strictEqual(eligNonResident.eligibilityStatus, 'INELIGIBLE', 'Out of state location must evaluate to INELIGIBLE');
  assert.strictEqual(eligNonResident.isHardFailure, true, 'Out of state location must be a hard failure');
  assert.ok(eligNonResident.eligibilityNotes.includes('INELIGIBLE'));
});

// ---------------------------------------------------------------------
// TEST 29: FIX: QUALIFYING IT EXPERIENCE CALCULATED FROM DOCUMENTED EMPLOYMENT DATES
// ---------------------------------------------------------------------
runTest('Fix: Qualifying IT experience derived from documented employment dates (not text length)', () => {
  const jd = SmartHireMatchingEngine.normalizeJobDescription({
    title: 'Assistant IT Director',
    description: 'Requires 6+ years of qualifying IT experience.'
  });
  const expReq = jd.categories.EXPERIENCE_COMPLEXITY[0];
  assert.ok(expReq, 'Experience requirement must be defined in JD');

  // Candidate with documented employment dates: 2015 – 2017, 2017 – 2021, 2021 – Present (= 11 years)
  // Plus graduation date 2027 which must NOT be treated as employment date
  const resumeWithDates = `LIA SMITH
Experience:
Company A | 2021 – Present
Company B | 2017 – 2021
Company C | 2015 – 2017
Education:
Bachelor of Science (Expected June 2027)`;

  const match = SmartHireMatchingEngine.matchRequirementEvidence(expReq, resumeWithDates, [], 'IT Lead');
  assert.strictEqual(match.evidenceStatus, 'DIRECT_MATCH', 'Documented dates (2015-Present = 11 yrs) must DIRECT_MATCH 6+ yrs requirement');
  assert.strictEqual(match.evidenceScore, 1.00);
  assert.ok(match.resumeEvidence.includes('2015') && match.resumeEvidence.includes('11 years'), 'Evidence snippet must display documented employment dates and computed years');

  // Candidate with short employment dates (2023 – Present = 3 years) against 6+ yrs requirement
  const shortDateResume = `JANE DOE
Experience:
Tech Corp | 2023 – Present`;
  const shortMatch = SmartHireMatchingEngine.matchRequirementEvidence(expReq, shortDateResume, [], 'Developer');
  assert.strictEqual(shortMatch.evidenceStatus, 'PARTIAL_MATCH', 'Documented dates under requirement must PARTIAL_MATCH');
  assert.strictEqual(shortMatch.evidenceScore, 0.50);
  assert.ok(shortMatch.gapOrQualification.includes('3 years'), 'Gap note must reflect 3 years');
});

// ---------------------------------------------------------------------
// TEST 30: FIX: MONSTER UI SEARCH FILTER NOISE REJECTED FROM EVIDENCE
// ---------------------------------------------------------------------
runTest('Fix: Monster search filter accordion noise ("Expand search filter Degree/Major") stripped and rejected', () => {
  const noisyResume = `Lia Smith
Expand search filter Degree/Major
Expand search filter Company
Collapse search filter Location
Filter by Years of Experience
Summary: Senior IT Program Manager with experience leading technology deliverables.`;

  const jd = SmartHireMatchingEngine.normalizeJobDescription({
    title: 'Assistant IT Director',
    description: "Requires Bachelor's Degree in Computer Science or Related field."
  });
  const eduReq = jd.categories.EDUCATION_CERTS.find(r => r.name.toLowerCase().includes('bachelor'));
  assert.ok(eduReq);

  const match = SmartHireMatchingEngine.matchRequirementEvidence(eduReq, noisyResume, [], 'Program Manager');
  assert.strictEqual(match.evidenceStatus, 'NOT_DEMONSTRATED', 'Search filter accordion must be stripped and evaluate to NOT_DEMONSTRATED');
  assert.strictEqual(match.evidenceScore, 0.00);
  assert.ok(!match.resumeEvidence.includes('search filter'), 'Evidence must never contain search filter text');
});

// ---------------------------------------------------------------------
// TEST 28: FIX: 100% SCORE CONSISTENCY ACROSS QUICK SOURCING AND DETAILED DOSSIER
// ---------------------------------------------------------------------
runTest('Fix: 100% Score consistency across Quick Sourcing and Detailed Dossier for Lia Smith', () => {
  const fullResume = `LIA SMITH
Columbia, SC · lia.smith@email.com
SUMMARY: Senior Enterprise Program Manager with 9+ years experience delivering enterprise technology delivery, cybersecurity NIST frameworks, IT operations leadership, risk assessments, budget monitoring, and executive steering committee reporting.
EXPERIENCE:
• Enterprise technology delivery for financial services banking systems.
• Risk & audit compliance reviews and annual audit remediations.
• Directed budget monitoring and vendor procurement renewals.
• Prepared and presented executive reporting to steering committee.
EDUCATION & CERTIFICATIONS:
• Bachelor of Science in Information Technology (Expected June 2027)
• Project Management Professional (PMP)
• Certified SAFe® 5 Agilist`;

  const jd = SmartHireMatchingEngine.normalizeJobDescription({
    id: '159348',
    title: 'Assistant IT Director / Enterprise Program Manager - Project Lead',
    location: 'Columbia, SC',
    description: 'State Treasurers Office (STO). Full-time on-site in Columbia, SC 5 days a week. Mandatory SC residency. Enterprise technology delivery, Cybersecurity, Managed-Service SLA Ownership, Active Directory / Entra ID, Microsoft Intune, Financial services experience, IT Operations & Strategy Leadership, Direct supervisory experience 3+ years, Risk & Audit compliance, Incident response & after-hours support, Budget monitoring, Executive & steering committee reporting, PMP or SAFe certification, Bachelor degree required.'
  });

  const cand = {
    id: 'cand-lia-consistency',
    name: 'Lia Smith',
    location: 'Columbia, SC',
    resumeText: fullResume
  };

  // Quick Sourcing entry point
  const quickResult = SmartHireMatchingEngine.evaluateCandidate(cand, jd);

  // Detailed Dossier entry point (via sessionCache or direct evaluation)
  const dossierResult = SmartHireMatchingEngine.sessionCache.getOrEvaluate(cand, jd);

  assert.strictEqual(quickResult.score, dossierResult.score, 'Score must be 100% identical between Quick Sourcing and Dossier');
  assert.strictEqual(quickResult.fitCategory, dossierResult.fitCategory, 'Fit Category must be identical');
  assert.strictEqual(quickResult.verdict, dossierResult.verdict, 'Verdict must be identical');
  assert.strictEqual(quickResult.recommendation, dossierResult.recommendation, 'Recommendation must be identical');
  assert.strictEqual(quickResult.eligibilityStatus, dossierResult.eligibilityStatus, 'Eligibility must be identical');
  assert.strictEqual(quickResult.skillsMatchTable.length, dossierResult.skillsMatchTable.length, 'Skills match matrix length must be identical');

  quickResult.skillsMatchTable.forEach((row, idx) => {
    const dosRow = dossierResult.skillsMatchTable[idx];
    assert.strictEqual(row.requirement, dosRow.requirement);
    assert.strictEqual(row.evidenceStatus, dosRow.evidenceStatus);
    assert.strictEqual(row.evidenceScore, dosRow.evidenceScore);
  });
});

// ---------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------
console.log('\n====================================================');
console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
if (passedTests === totalTests) {
  console.log(`ALL ${totalTests} ACCEPTANCE CRITERIA & EXTRACTION TESTS VERIFIED SUCCESSFULLY! ✓`);
} else {
  console.error(`FAILED ${totalTests - passedTests} TEST(S)!`);
  process.exit(1);
}
console.log('====================================================\n');
