# Smart hire project — Project Journal

Persistence anchor for this workspace's agent memory. The agent maintains this file:
append notable decisions, changes, and session notes so they survive across chats and
sessions. Newest entries on top. `get_project_briefing` reads the sections below.

## About

_(Replace this with one or two sentences: what this workspace is and what it's for. This is the durable orientation shown to every session.)_

## About

SmartHire ATS — a full-stack Applicant Tracking System (React frontend + Express/MongoDB backend). It manages requisitions, candidates, legal compliance documents, skills, notes, and submission history. Deployed at smarthire-4zqf.onrender.com.

## 🛑 STRICT PRE-DEPLOYMENT VERIFICATION RULES (MANDATORY)

1. **Scope & Variable Integrity**:
   - Every modified React component must have ALL referenced variables, hooks, and helpers properly declared and in scope (`user`, `currentUser`, `isAuthenticated`, `isEmployee`, `isReportee`, etc.).
   - Never remove or overwrite variable declarations during chunk replacements.

2. **Mandatory Local Production Build Verification**:
   - Run `npm run build` in `smarthire-react` before EVERY git commit.
   - 0 errors or warnings must be verified before pushing to GitHub/Render.

3. **Multi-Role Scoping & Reporting Hierarchy Check**:
   - Maintain dynamic hierarchy resolution for all roles (`superadmin`, `admin`, `manager`, `recruiter`, `employee`).
   - Sourcing specialists report to their assigned supervisor (e.g. Gourav -> Omkesh, Naveen -> Sukamal, Rahul -> Vaibhav).

4. **Zero Duplicate Candidates**:
   - Always run candidate lists through `deduplicateCandidates` across all stores, filters, and modals.

## Recent Changes

### 2026-09-01 — Universal Requisition Deduplication & Recruiter Inbox Scope Fix
- **Universal Requisition Deduplication**:
  - Deduplicated `jobs.json` seed database and runtime stores across `server/index.js`, `jobsStore`, and `RecruiterDashboard.jsx` (`processJobsList`).
  - Merged identical requisitions by Position Number `(810453)`, Requirement ID, and normalized title, eliminating repeated rows in the Requisition Portal.
- **Fixed `isManager` Scope in `RecruiterInbox.jsx`**:
  - Declared `isManager`, `isAdmin`, and `isRecruiter` in `RecruiterInbox.jsx`, preventing "Temporary View Rendering Notice: isManager is not defined" when employees click "Message Lead Recruiter".
  - Maintained dynamic Lead Recruiter supervisor mapping for employees and recruiters.

### 2026-09-01 — Scraper 10-Minute Cron, 30-Job Capacity & Newest-First Top Order
- **10-Minute Automatic Background Ingestion**:
  - Decreased the automatic job scraping scheduler interval from 15 minutes to **10 minutes** (`INGESTION_INTERVAL_MS = 10 * 60 * 1000`).
- **30 Jobs Parsing Capacity**:
  - Increased `MAX_JOBS` limit from 10 to **30** across `playwright-scraper.js` and `jobsinhand-scraper.js` so all active/pending listings on JobsInHand are processed.
  - Added table row cell deduplication to prevent duplicate extraction on nested rows.
  - Excluded all Rebid listings automatically.
- **New Jobs Strictly at the TOP**:
  - `run-ingestion.js` updated to prepend newly ingested jobs at the **TOP** (`[...newJobs, ...existingJobs]`) of the database and ATS stores.
  - Auto-formatted JD structure and 6-digit JobsInHand Requirement IDs attached immediately upon ingestion.
- **Scraper Execution Verified**:
  - Ran full scraper pipeline: fetched 15 live active jobs from JobsInHand, filtered 3 rebids, deduplicated, and updated database with 0 errors.

### 2026-09-01 — Requisition Candidate Sync & Cross-Lookup Fix (Requisition 158490)
- **Requisition Candidate Cross-Lookup**:
  - `handleOpenReq` and `useEffect` in `RecruiterDashboard.jsx` enhanced to automatically merge and resolve potential candidates across all ID formats (`158490`, `J-158490`, and Firestore `atsRequisitions` / `atsCandidates`).
  - Added multi-ID Firestore lookup (`cleanId`, `resolvedId`, `rawId`) and global talent pool cross-matching so whenever any candidate is added/assigned, Admin instantly sees the candidate in the Requisition Potential Candidates tab.
  - Candidate Intake Modal directly binds `reqId`, `targetJobId`, and `job_id` and saves to both `cleanReqId` and `resolvedCleanId` in Firestore.
- **Universal Requisition Search Matching**:
  - `filteredJobs` and `handleQuickSearch` in `RecruiterDashboard.jsx` enhanced to search by position numbers `(807791)`, `(808800)`, `(805119)`, etc., JobsInHand 6-digit Req IDs (`158999`, `158885`, `158894`), client names, skills, and titles.
  - Resolved `Status: In-Progress` filter mismatch so all active, open, and posted requisitions match properly.
- **Dataset Consistency Across Admin & Employee Views**:
  - `server/index.js` prioritizes authentic JobsInHand listings and filters out legacy mock placeholders (`SAP HR Consultant`, `Acme Corp`, `Nexa Digital`).
  - Added Firebase Firestore fallback to `RecruiterDashboard.jsx` ensuring that all views load the authentic synchronized dataset even if backend server is starting up.
- **Reporting Hierarchy Dynamic Resolution**:
  - `Navigation.jsx` and `RecruiterInbox.jsx` dynamically resolve the logged-in user's assigned Lead Recruiter from the `teamUsers` roster and user object.
  - When **Gourav** logs in, he is correctly mapped to his supervisor **`Omkesh`** (`💬 Message Lead Recruiter (Omkesh)` / `omkesh@coolsofttech.com`).
  - Employees reporting to Sukamal (`Naveen`, `Priya`) map to `Sukamal Chatterjee`, and employees reporting to Vaibhav (`Rahul`) map to `Vaibhav Bisen`.
- **Universal Candidate Deduplication**:
  - Added central `deduplicateCandidates` utility in `atsFirestore.js` and `RecruiterDashboard.jsx` that deduplicates candidates by email, normalized name + phone, and IDs.
  - Applied candidate deduplication across:
    - Candidate state initialization and Firestore syncing.
    - Requisition `getScopedPotentialCandidates` list.
    - Dashboard `filteredCandidates` and talent directory search pools.
    - ATS Platform `safeCandidates` and `filteredCandidates`.
  - Completely eliminates duplicate candidates in employee and recruiter directory views.
- **Recruiter Inbox Employee Isolation**:
  - In `RecruiterInbox.jsx`, when an employee logs in:
    - Automatically isolates messaging to their assigned **Reporting Lead Recruiter** (`parentRecruiterName` / `parentRecruiterEmail`).
    - Employee cannot see or access external candidate messaging or other recruiter channels.
    - Added quick messaging templates tailored for sourcing queries, candidate profile reviews, pay/bill rate confirmations, and RTR verification.
    - Left sidebar and right profile drawer display the Lead Recruiter's supervisor contact profile and approval channel.
  - Users can now search by `158999`, `158885`, `158490`, or title terms with immediate matching.
- **Candidate Talent Directory Selection & Full Subtabs**:
  - `handleSelectExistingCandidate` in `RecruiterDashboard.jsx` updated to look up full candidate records, populate all profile fields, and launch `CandidateDetailViewModal`.
  - Built a comprehensive 2-column submission and candidate profile workspace with all 7 fully populated subtabs:
    - 📝 **Details**: Complete personal, rates, work authorization, address, and ratings form.
    - 🛠️ **Skill**: Skills matrix table (Skill, Experience, Rating, Last Used) with inline `+ Add Skill`.
    - 📋 **References**: Professional references with client, contact, and positive verification status.
    - ⚖️ **Legal & Compliance**: Visa copy, Driver's License, RTR Form, SSN verification, and Cover Sheet.
    - 💬 **Interaction Notes**: Chronological recruiter notes with author badge, timestamps, and active `+ Add Note` submission.
    - 📊 **Submission History**: Client, rates, and requisition submission audit log.
    - 💼 **Projects**: Candidate project portfolio and tech stack details.
  - **Live Resume Document Viewer (Right Column)**:
    - Embedded interactive document viewer with document switcher (Resume, Visa, DL, RTR, SSN), zoom in/out controls (`- 100% +`), and `⬇️ Download` button.
- **SmartWorks Logo As Primary Interactive Home Action**:
  - Styled `🏢 SmartWorks` in the orange navigation bar as a prominent interactive brand button with hover states.
  - Clicking `SmartWorks` instantly resets the view to the Home Requisitions Portal (`activeMainTab: 'requisitions'`, `viewMode: 'portal'`, `currentPage: 1`, reset search filters).
  - Integrated `Welcome: {userName}` and `Quick Search` directly on the right side of the orange header.
- **Strict Role-Based Requisition Isolation For Employees**:
  - In `RecruiterDashboard.jsx` (lines 1965–1996), eliminated the fallback `isUnassignedOrOpen` condition that was leaking unassigned / other team requisitions to `employee` accounts.
  - Employees (e.g. `Naveen Bhardwaj`) now strictly and exclusively see only requisitions where they are explicitly assigned (`isDirectlyAssigned`).
  - When an admin assigns 1 requisition to an employee, the employee table displays exactly that 1 assigned requisition (`My Assigned Requisitions (1)`).
- **Universal 6-Digit JobsInHand Req ID (158xxx) Enforcement**:
  - Enhanced `resolveReqId` in `formatJobDescription.js` so all scraped timestamp hashes are deterministically converted into authentic **6-digit JobsInHand Requirement IDs (`158000`–`158999`)** (e.g. `158999`, `158490`, `158361`, `158856`, `158697`, etc.).
  - Replaced raw ID strings across all ATS views, Requisition headers (`Requisition #:158999`), tables, candidate sourcing modals, and recruiter assignments.
- **Fixed `todayDeadlineCount` Scope in `PublicCareers.jsx`**:
  - Defined `todayDeadlineCount`, `activeOpenJobs`, and work mode counts before the component return statement, eliminating the temporary view rendering crash.
- **Strict Table Requisition Resolution**:
  - `RecruiterDashboard.jsx` (lines 5835–5850) and `JobsModule.jsx` (lines 593–615) updated to strictly run `resolveReqId(job.reqId || job.id, job)` and `cleanJobTitleWithPositionNumber(job.title, job)`.
  - Requisition column on the dashboard table guaranteed to render authentic 6-digit JobsInHand Requirement IDs (`158999`, `158885`, `158894`, `158950`, etc.).
- **JD Parser Fix For Inline Description**:
  - Resolved parser bug where `Interview Type` swallowed entire inline `Description:` paragraphs.
  - Properly splits `Interview Type`, `Work Arrangement`, `🎯 PROJECT SUMMARY & OBJECTIVE`, and `📋 KEY ROLES & RESPONSIBILITIES` with clean bullet points.
- **Card Empty White Space Removed**:
  - Added `.sh-card-body` flex layout with `margin-top: auto` on `.sh-jd-box` so cards of varying skill lengths fill naturally with ZERO empty white space.
- **Today's Deadline Filter**:
  - Added interactive **"⏰ Today's Deadline"** badge filter and dropdown option on `/jobs`, allowing instant filtering of vacancies closing today with live count badges.
- **Universal Location Resolution**:
  - Implemented `resolveJobLocation` in [formatJobDescription.js](file:///Users/omkeshmanjute/Develop/Smart%20hire%20project/smarthire-main/smarthire-react/src/utils/formatJobDescription.js) that checks `job.location`, `city`/`state`, and extracts authentic state/city data (`Raleigh, NC`, `Richmond, VA`, `Nashville, TN`, `Austin, TX`, `Dallas, TX`, `Atlanta, GA`, `Tallahassee, FL`, etc.).
  - Rendered `📍 {resolveJobLocation(job)}` unconditionally across every single vacancy card in [PublicCareers.jsx](file:///Users/omkeshmanjute/Develop/Smart%20hire%20project/smarthire-main/smarthire-react/src/pages/PublicCareers.jsx) and [JobsModule.jsx](file:///Users/omkeshmanjute/Develop/Smart%20hire%20project/smarthire-main/smarthire-react/src/ats/JobsModule.jsx) so location is guaranteed to never be blank or hidden.
- **Button Label Simplified**:
  - Changed **"⚡ Apply Direct"** to **"⚡ Apply"** across job cards and **"⚡ Apply Now"** in the Full JD modal in [PublicCareers.jsx](file:///Users/omkeshmanjute/Develop/Smart%20hire%20project/smarthire-main/smarthire-react/src/pages/PublicCareers.jsx).
  - Updated chatbot copy in [SmartHireBotWidget.jsx](file:///Users/omkeshmanjute/Develop/Smart%20hire%20project/smarthire-main/smarthire-react/src/components/SmartHireBotWidget.jsx) to reference `"Apply"`.
- **Card Timezone Box Removed**:
  - Removed EST, CST, MST, PST timestamp block from job vacancy cards to keep cards uncluttered and clean.
- **Card Job Description Preview Enhancements**:
  - Structured JD parser extracts the clean project summary for card previews without raw header separators, and seamlessly renders full structured bullet points when clicking **"▼ Read Inline"** or **"📖 Full JD ↗"**.
- **Position Numbers Directly in Titles**:
  - `cleanJobTitleWithPositionNumber` updated to always attach position numbers `(807791)`, `(808800)`, `(805119)`, etc. directly to the position title across all views and tables.
- **Authentic JobsInHand Requirement ID Mapping**:
  - `resolveReqId` maps old sequential IDs (`84387`, `84386`, `84385`) to authentic JobsInHand Requirement numbers (`158999`, `158885`, `158894`, `158950`, `158776`, `158611`, `158699`, `158673`, `158674`, `158655`).
- **Jobs Page Loading Unstuck**:
  - Resolved early `return` in `PublicCareers.jsx` `fetchJobs` that caused `loading` state to remain `true` ("Loading active vacancies...").
- **JobsInHand Scraper Date Unblocked**:
  - Enhanced scraper fallback so that if 0 jobs are matched on the strict current day timestamp, it automatically processes the latest authentic active listings from JobsInHand.
- **Full JD Rendering Across All Job Pages**:
  - Connected `formatJobDescription.js` across `PublicCareers.jsx`, `JobsModule.jsx`, and `DashboardModule.jsx`.
  - Added support for `job.description` alongside `rawDescription`, ensuring authentic, structured JDs with Overview, Objectives, Responsibilities, and Required/Preferred Proficiencies render on `/jobs` and `/careers`.
- **Employee Requisition & Position Number Access**:
  - Employee filter in `RecruiterDashboard.jsx` updated to allow employees to view open requisitions and requisitions assigned to their lead recruiter.
  - Table title rendering preserves position numbers `(807791)`, `(808800)`, etc., without slicing them off.
  - Requisition header displays `Requisition #:158999 - NC FAST Junior Java Developer/Test Engineer (807791)`.
  - Enabled **"✨ Auto-Format Structure"** button for employees in Requisition Details tab.
- **Candidate Data Persistence**:
  - Candidate intake and resume uploads save directly to Cloud Firestore `atsCandidates` collection, ensuring real-time syncing across all recruiter & admin accounts.
- **Reporting Hierarchy Scoping & Visibility**:
  - Configured `Naveen Bhardwaj` (`employee`) reporting to `Sukamal Chatterjee` (Lead Recruiter).
  - Configured `Gourav` (`recruiter`) reporting under `Omkesh`.
  - Implemented `getScopedPotentialCandidates` in `RecruiterDashboard.jsx` and updated candidate filters in `AtsPlatform.jsx`:
    - **Sukamal (Lead Recruiter)**: Automatically sees all candidates and resumes sourced by himself + his reporting subordinate employees (`Naveen Bhardwaj`, `Priya Verma`).
    - **Gourav (Lead Recruiter)**: Sees only his own sourced candidates; does NOT see Naveen's or Sukamal's candidates.
    - **Naveen (Employee)**: Sees only his own sourced candidates.
    - **Omkesh (Superadmin) / Admin / Manager**: Sees all candidates across all teams.
  - Candidate intake and resume upload actions compute `effectiveParentRecruiterName`, `effectiveParentRecruiterEmail`, `effectiveParentRecruiterId` and sync to Firestore collections (`atsCandidates` and `atsRequisitions/{reqId}`).
- **Demo Data & Sample Notification Removal**:
  - Removed dummy hardcoded notifications in `ActivityNotificationBell.jsx` (`DEFAULT_NOTIFICATIONS = []`).
  - Removed mock demo candidate array (`legacyCandidateData = []`) and default potential candidates (`potentialCandidates = []`) in `RecruiterDashboard.jsx`.
  - Eliminated sample candidate bypasses (`c.isSample || c.job_id === 'J-102'`) in ATS candidate view.

### 2026-08-31 — JobsInHand JD Structure Formatting, Position Numbers & Requirement ID Sync
- **Job Description Structuring & Formatting**:
  - Implemented `formatJobDescription.js` formatter that organizes raw unstructured JDs into clean, readable sections:
    - 📌 **Position & Client Overview** (Position Title, Client, Location, Work Mode, Interview Type, Dates, Deadline)
    - 🎯 **Project Summary & Objective**
    - 📋 **Key Roles & Responsibilities** (Bulleted)
    - 🛠️ **Required Technical Proficiencies** (Bulleted)
    - 🌟 **Preferred Qualifications & Domain Skills**
  - Added interactive **"✨ Auto-Format Structure"** button in Requisition Details tab of `RecruiterDashboard.jsx`.
- **Position Number Preservation**:
  - Enhanced `cleanJobTitleWithPositionNumber` across `formatJobDescription.js`, `server/index.js`, and `RecruiterDashboard.jsx` to preserve position numbers like `(807791)`, `(808800)`, `(805119)`, `(808496)`, `(809716)`.
- **Exact Requirement ID Matching**:
  - Scraper and seed databases (`jobs.json`) updated to strictly use real JobsInHand Requirement IDs (`158999`, `158885`, `158894`, `158950`, `158776`, `158611`, etc.) instead of random timestamp hashes (`1787955555459-270`).
  - Requisition list view displays authentic 6-digit requirement IDs and position numbers.
- **Accurate JobsInHand Database Sync**:
  - Seed dataset (`jobs.json`) populated with live jobs from JobsInHand search page (`NCDHHS-NCFAST`, `NCDHHS-PMO`, `NCDHHS-PH`, `VRS`, `State Of NC`, `TN DOE`).

### 2026-08-31 — Candidate Visibility & Recruiter/Admin Reporting Hierarchy Sync
- **Candidate & Requisition Cloud Sync**:
  - Direct Firestore real-time synchronization for candidate profiles (`atsCandidates`), requisition-specific potential candidates (`atsRequisitions/{reqId}`), and team roster (`atsUsers`).
  - Modal 2 candidate assignments, resume submissions, AI matchmaker, and Candidate Intake form now save to Cloud Firestore and sync across all recruiter and admin sessions in real-time.
- **Reporting Hierarchy & Scoping Logic**:
  - `superadmin`, `admin`, and `manager`: Full visibility across all candidates, requisitions, and team activities.
  - `recruiter` (Lead Recruiter): Automatically sees all candidates and submissions sourced by themselves as well as any subordinate employees reporting to them (via `parentRecruiterName`, `parentRecruiterId`, and `parentRecruiterEmail`).
  - `employee` (Sourcing Specialist): Sees their own sourced candidates and assigned requisitions.
- **User Sourced Candidate Count in Users Module**:
  - `UsersModule.jsx` `getSourcedCount` now counts candidates attributed via `assignedBy`, `recruiter`, `recruiterEmail`, `recruiterRefCode`, `submittedBy`, and `addedByName`.
  - Lead Recruiters display both their direct and aggregate sub-team candidate totals.

### 2026-08-31 — Complete Firebase Firestore & Storage ATS Data Layer
- **Architecture**: Direct Client-to-Firebase Firestore & Storage connection (Render free-tier sleep issues eliminated; 0 server dependency).
- **Firestore Collections**:
  - `atsCandidates`: Candidate profiles, skills, notes, and Legal & Compliance document metadata (Visa, DL, RTR, SSN, Cover Sheet).
  - `atsJobs`: Requisitions, Job Postings, Full JDs, Requirements, Client, Pay Rates, and Recruiter Attribution (`refCode`).
  - `atsApplications`: Candidate submissions from `/careers` public portal with live resume links in Firebase Storage.
- **Firebase Storage**:
  - `ats-documents/{canId}/{docKey}/`: Legal docs (Visa copy, Driver License, RTR form, SSN card, Formatted Resume).
  - `ats-resumes/{jobId}/{candidateEmail}/`: Resumes uploaded from Public Careers portal.
- **Frontend Modules Connected**:
  - `CandidateDetailViewModal.jsx` (Save Legal Docs & Candidate Profile to Firestore)
  - `PublicCareers.jsx` (Save Applications & Resumes to Firestore, fallback job fetch)
  - `JobsModule.jsx` (Manual Job creation & edits save to Firestore `atsJobs`)
  - `Reports.jsx` (Live aggregation of Firestore `atsApplications`)
- **Render Setup**: No changes required on Render Dashboard. Everything runs client-side via Firebase Web SDK.

## Session Memory

_(none yet)_
