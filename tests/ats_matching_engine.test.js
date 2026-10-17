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
// SUMMARY
// ---------------------------------------------------------------------
console.log('\n====================================================');
console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
if (passedTests === totalTests) {
  console.log('ALL 10 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY! ✓');
} else {
  console.error(`FAILED ${totalTests - passedTests} TEST(S)!`);
  process.exit(1);
}
console.log('====================================================\n');
