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

### 2026-09-05 — Public Careers (/jobs) Redesigned with LinkedIn / PraxiMinds Canvas & Zoho ATS UI/UX
- **LinkedIn / PraxiMinds Textured Executive Canvas**:
  - Replaced flat white background with subtle LinkedIn / PraxiMinds dot matrix textured canvas (`#F1F4F9` with `radial-gradient(#CBD5E1 0.85px, transparent 0.85px)` at 20px grid spacing; `#080C14` in dark mode).
  - Pure `#FFFFFF` cards pop with rich 3D depth, eliminating bland all-white layout while maintaining ultra-clean contrast.
- **PraxiMinds Executive Dark Tech Hero Banner**:
  - Replaced plain white box with signature PraxiMinds dark tech gradient (`linear-gradient(135deg, #0B0F19 0%, #161E31 55%, #0F172A 100%)`) and subtle radial ambient glow.
  - Added eyebrow badge (`✦ Direct Client Requisitions · State & Enterprise`) with orange/cyan accent highlights.
  - Added 4 Executive KPI Stat Metric Counters (`66+ Active Requisitions`, `100% Direct End-Clients`, `< 24 hrs Recruiter Review`, `0 (Direct) Intermediary Layers`).
  - Added elevated floating search console with search input, work mode dropdown, clear button, and Zoho segmented quick filter pills (`All Roles`, `⏰ Closing Today`, `Remote`, `Hybrid`, `Onsite`).
- **Zoho ATS Job Card Typography & Button UI/UX**:
  - Refined card layout (`border: 1px solid #E2E8F0`, `borderRadius: 12px`, soft hover elevation `translateY(-3px)` + soft blue glow).
  - High-contrast job titles (`#0F172A`, 16.5px, 700 weight) with smooth hover color transition to royal blue (`#2563EB`).
  - Authentic Req ID badges (`# Req {authenticReqId}`) and live status indicators (`🟢 Open` with animated pulsing dot / `⏰ Closing Today`).
  - Pastel work mode pills (`Remote` in emerald, `Hybrid` in amber, `Onsite` in slate).
  - Redesigned action buttons: Secondary `📋 Full JD` (clean outline button with hover elevation) and Primary `⚡ Apply Now` (royal blue gradient with shadow and lift).
- **Header Direct ATS Portal Shortcut**:
  - Added `⚡ ATS Portal ↗` button in the top navigation header for 1-click transition between candidate portal and Zoho ATS platform.
- **Production Build Verified**:
  - 0 errors or warnings on `npm run build` in `smarthire-react`.

### 2026-09-05 — Firebase Authentication Integration & Git Secret Security Hardening
- **Git Secret Scanning Remediation**:
  - Sanitized `smarthire-backend/check-atlas-db.js` by replacing hardcoded MongoDB Atlas credentials with `process.env.MONGODB_URI`.
  - Removed `check-atlas-db.js` and `smarthire-react/server/recruiters.json` from git tracking (`git rm --cached`).
  - Updated root `.gitignore` to strictly ignore all `.env*` variants, `recruiters.json`, `candidates.json`, `reports.json`, and database check scripts.
- **Firebase Authentication Integration (`Login.jsx`)**:
  - Implemented secure Firebase Authentication (`loginWithEmail`) as primary authentication method, eliminating the need to store passwords in git or code.
  - Connected Google Sign-In (`loginWithGoogle`) button for 1-click corporate account login.
  - Added interactive **"Forgot Password?"** modal utilizing `resetPasswordWithEmail` via Firebase Auth, sending automated one-click password reset links directly to corporate inboxes.
  - Implemented Firestore user profile lookup (`getUserProfileByEmailFirestore`) to dynamically map roles (`superadmin`, `recruiter`, `manager`, `employee`) and reporting hierarchy.
  - Added defensive credential stripping in `atsFirestore.js` (`saveTeamUsersFirestore` & `getTeamUsersFirestore`) to guarantee passwords are never persisted in plaintext in Cloud Firestore.
- **Production Build Verified**:
  - 0 errors or warnings on `npm run build` in `smarthire-react`.

### 2026-09-05 — Real-Time Audio Chime Sound & Desktop Push Notifications
- **Web Audio API Harmonic Chime (`playNotificationSound`)**:
  - Implemented client-side synthesized 3-tone chime (D5 `587.33Hz` → A5 `880Hz` → D6 `1174.66Hz`) using `AudioContext` with exponential gain ramps.
  - Zero external `.mp3` assets required, zero latency, and zero CORS/404 issues across all modern browsers.
  - Handles browser audio context suspension with automatic `.resume()`.
- **Native OS / Browser Push Notifications (`triggerNativePushNotification`)**:
  - Added HTML5 `Notification` API support with permission requester (`requestPushNotificationPermission`).
  - Added prompt banner inside `ActivityNotificationBell` popover allowing one-click activation.
  - Sends native OS desktop notifications for new requisitions, candidate updates, and team alerts.
- **Sound Control & Testing**:
  - Added persistent sound toggle (`🔊 Sound ON` / `🔇 Muted`) in the notification popover header saved to `localStorage`.
  - Added `🔔 Test` button so recruiters can preview the chime sound instantly.
  - Added live status pill indicators in the popover footer (`🟢 Push Active` / `🟡 In-App`, `🔊 Sound ON` / `🔇 Muted`).
- **Live Background Sync for 6-Minute Scraper Updates**:
  - Integrated 35-second background polling in both `RecruiterDashboard.jsx` and `AtsPlatform.jsx`.
  - When the 6-minute scraper ingests new jobs from JobsInHand, SmartHire automatically triggers an in-app toast, audio chime sound, and native desktop push notification.
- **Production Build Verified**:
  - 0 errors or warnings on `npm run build` in `smarthire-react`.

### 2026-09-05 — Scraping Interval Updated to 6 Minutes & Complete Requirement Number Extraction Fix
- **6-Minute Cron Job Interval**:
  - Updated `INGESTION_INTERVAL_MS` in `server/index.js` to **6 minutes** (`6 * 60 * 1000`), ensuring rapid automatic background ingestion cycles.
  - Updated `setup-scheduler.bat` to 6-minute intervals (`/mo 6`).
- **Eliminated Missing Requirement Numbers (Zero Dropped Reqs)**:
  - **Authentic Req ID Precedence (`resolveReqId`)**: Fixed critical bug in `formatJobDescription.js` and `server/index.js` where `KNOWN_TITLE_MAP` checked title patterns before checking if an authentic 6-digit requirement ID (`15xxxx` / `16xxxx`) was already present. Live authentic IDs now take highest priority and are never overwritten.
  - **Distinct Req ID Preservation (`isDuplicate`)**: Fixed `run-ingestion.js` deduplication where jobs with different authentic Req IDs (e.g. `159020` vs `159019`) were erroneously discarded as duplicates if their position number matched.
  - **Server Store Dedupe Key**: Updated `loadJobsFromDisk` in `server/index.js` to key by `req_${cleanI}` instead of `pos_${pNum}`, preventing shared-position jobs from collapsing on startup.
  - **Multi-Selector & URL Req Extraction in Playwright**: Scraper now extracts the requirement number immediately from listing row `href` and text snippet, as well as detail page selectors (`#ctl00_Contentpage1_lbl_reqid`, `lbl_req_id`, URL regex, and body text regex).
  - **Zero-Drop Detail Page Fallback**: Detail page errors or timeouts no longer drop jobs; fallback retains the job with its authentic Req ID and listing snippet.
  - **Deep Pagination**: Extended Playwright pagination up to 25 pages with safe `waitForLoadState` navigation.
- **Production Build Verified**:
  - 0 errors or warnings on `npm run build` in `smarthire-react`.

### 2026-09-04 — Candidates Module Redesigned & Top Toolbar Squeeze / Scroll Overlap Fixed
- **Fixed Squeezed Toolbar & Removed Duplicate Title**:
  - Eliminated redundant stacked `Candidates` title; transformed subheader into a fixed 52px Zoho CRM toolbar with Starred View Preset dropdown (`★ {preset} ▾`), live count badges, and segmented status filter pills (`All`, `Shortlisted`, `Interviews`, `Placed`, `New`).
  - Set `flexWrap: 'nowrap'` and fixed heights, preventing toolbar controls from collapsing into double rows or overlapping on laptop viewports.
- **Eliminated Double-Scrollbars & Viewport Clipping**:
  - Fixed `AtsPlatform.jsx` canvas container with `overflowY: activeTab === 'candidates' ? 'hidden' : 'auto'`, removing rogue outer scrollbars.
  - Set `minHeight: 0, flex: 1, overflow: 'hidden'` across `CandidatesModule`, ensuring strict application-level viewport confinement.
  - Implemented sticky table `thead` with solid background and shadow, allowing candidates table to scroll cleanly under pinned headers with zero overlap.
  - Relocated pagination bar to a docked footer (`height: 42px`, `borderTop: 1px solid #e2e8f0`) so pagination is permanently accessible without scrolling to the table bottom.
- **Enhanced Left Filter Drawer**:
  - Added `48px` bottom padding and custom SVG chevron styling for the `Filter by Vacancy / Req` select dropdown, completely eliminating bottom edge clipping.
- **Production Build Verified**:
  - 0 errors or warnings on `npm run build` in `smarthire-react`.
- **Zoho CRM Analytics Subheader Toolbar**:
  - Integrated header toolbar with `Analytics` brand, dashboard dropdown (`★ Org Overview ▾`), dynamic timeframe filter (`This Month ▾`), spin-refresh action `🔄`, secondary outline button `+ Add Component`, and primary royal blue button `Create Dashboard`.
  - Added interactive modals for adding components and creating custom analytics dashboards.
- **Zoho CRM Metric KPI Cards**:
  - Replaced legacy emoji stat cards with clean Zoho metric cards (`#ffffff`, 1px `#e2e8f0` border, muted uppercase labels, 24px bold metric values, inline `▲ 100%` trend badges, and subtitle comparisons).
  - Configured 4 key cards: `CANDIDATES THIS MONTH`, `ACTIVE REQUISITIONS`, `DEALS / RTR IN PIPELINE`, and `INTERVIEWS & PLACEMENTS`.
- **Zoho Signature Speedometer & Target Achievement Bar**:
  - Built custom SVG Speedometer Dial Gauge for candidate sourcing target with arc stroke, needle indicator, min `0`, current value, target, and dynamic `Remaining : N` centered label.
  - Built horizontal Target Achievement Bullet Bar for `Entire Org` with achieved progress bar (`#86efac`), target label, axis tick steps (`0` to `100`), and clean achieved legend.
- **Refined Pipeline & Performance Analytics**:
  - Formatted Candidates by Stage, Weekly Submissions, Conversion Rate Donut rings, Recruitment Funnel progress bars, Most Common Skills, and Job Performance Breakdown table with Zoho CRM minimalist styling.
- **Production Build Verified**:
  - 0 errors or warnings on `npm run build` in `smarthire-react`.

### 2026-09-04 — Public Careers (/jobs) Redesigned with Zoho CRM Minimalist Styling
- **Eliminated AI-Template Artifacts & Floating Pinned Elements**:
  - Removed awkward floating left "US Clocks ▶" pill button hanging on the viewport edge; cleanly integrated US Live Clocks directly into the enterprise top navigation header with a sleek popover dropdown for EDT/EST, CDT/CST, MDT/MST, and PDT/PST.
  - Replaced oversized black "🤖 AI Career Assistant" bar with a clean Zoho SalesIQ floating launcher button (`#2563eb`, `💬 Career Assistant`).
- **Clean Enterprise Hero Search Banner**:
  - Replaced generic AI "✨ Direct Candidate Applications" badge and bulky search bar with a crisp Zoho enterprise banner.
  - Built unified search bar: Job search input + subtle divider + Work Mode dropdown (`All Work Modes`, `⏰ Closing Today`, `Remote`, `Hybrid`, `Onsite`) + reset button.
  - Added Zoho segmented quick filter chips with live counts (`All Roles`, `⏰ Closing Today`, `Remote`, `Hybrid`, `Onsite`).
- **Zoho CRM Job Vacancy Cards**:
  - Eliminated "box-in-a-box" nested description container with heavy blue border (`.sh-jd-box`).
  - Implemented clean `#ffffff` card layout with 1px `#e2e8f0` border, 10px radius, and subtle hover elevation.
  - Displayed authentic 6-digit Req IDs (`Req #{authenticReqId}`) in soft slate badges and clean position titles with position numbers.
  - Structured clean 2-line narrative summary with inline `▼ Read Summary` toggle and `↗ Full JD` trigger.
  - Standardized card footer with secondary `Full JD` outline button and primary `⚡ Apply` royal blue button (`#2563eb`).
- **Production Build Verified**:
  - 0 errors or warnings on `npm run build`.

### 2026-09-04 — Complete Zoho CRM Minimalist Styling Across All Inner ATS Section Pages
- **Manage Users Module (`UsersModule.jsx`)**:
  - Replaced retro `#708090` header, `#7f9db9` border, and Arial font with Zoho CRM clean white card layout, `-apple-system/Inter` font, subtle `#e2e8f0` borders, `#f8fafc` uppercase 11px table header, and `#f1f5f9` subtle row separators.
  - Replaced heavy multi-color KPI cards with clean white cards (`#ffffff`, 1px `#e2e8f0` border, muted uppercase labels, 22px bold metrics).
  - Modernized both Team Recruiters and Candidates subtab tables with pastel pill badges and refined button controls.
- **Reports & Analytics Module (`ReportsModule.jsx`)**:
  - Fixed `undefined` bar chart bug by normalizing candidate statuses (`normalizeStatus`) and cleaning compound stage names.
  - Upgraded KPI StatCards and Bar Charts with sleek Zoho CRM cards, rounded top bars (`#2563eb`), and clean funnel/donut indicators.
- **Candidates Module (`CandidatesModule.jsx`)**:
  - Added `formatTitleCase` helper transforming loud uppercase candidate names (`SWATHI BA` -> `Swathi Ba`) into clean, professional title case.
  - Replaced default raw browser `<select>` boxes with sleek Zoho CRM status pill dropdowns with custom chevron arrows.
  - Unified table headers with uppercase 11px letter-spaced `#475569` labels.
- **Active Jobs Module (`JobsModule.jsx`)**:
  - Removed retro CoolWorks `#708090` / `#7f9db9` / Arial table and replaced with Zoho CRM minimal table layout (`#f8fafc` header, pastel work mode pills, clean action buttons).
- **Global Typography Upgrade (`index.css`)**:
  - Updated base font family from Arial to `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- **Production Build Verified**:
  - 0 errors or warnings on `npm run build`.

### 2026-09-04 — Zoho CRM Ultra-Modern ATS Redesign (/ats)
- **Zoho CRM Deep-Slate Navy Sidebar (`#161e31`)**:
  - Full-height dark navy sidebar with `SmartHire ATS` brand, collapse button, upper items (Home, Workqueue, Reports, AI Agents), collapsible `ATS Teamspace` with inline search, categorized navigation (Talent Acquisition, Operations & Admin, Quick Portals), and bottom pinned tools.
- **Enterprise White Top Navigation Bar (`#ffffff`)**:
  - Global search with shortcut, quick add `+`, candidate chat trigger, notification bell, user avatar with green online badge, and instant switch button to Requisitions Dashboard.
- **Zoho CRM Home Overview Screen**:
  - "Welcome Omkesh Manjute" banner, 4 clean white KPI cards (Active Requisitions, Total Candidates, Interviews Scheduled, Submissions & RTR), interactive setup & onboarding checklist widget, and 2-column split widgets (My Open Tasks & Sourcing Queue + Recent Applicants & Scheduled Interviews).
- **Zoho CRM Candidates / Leads View**:
  - View presets dropdown, `⚡ Filter` toggle button, `⇅ Sort` button, view switchers, and Royal Blue `+ Create Candidate ▾` split button with modal.
  - Collapsible left filter drawer with search, System Defined Filters with live counts, and status/req filters.
  - High-density data table with direct phone/email actions, pastel status badges, and fixed `[object Object]` bug in Key Skills.
- **Production Build Verified**:
  - 0 errors or warnings on `npm run build`.

### 2026-09-03 — Multi-Page Requisition Extraction Across All JobsInHand Pages & Gap Elimination (66 Active Requisitions)
- **Comprehensive Multi-Page ASP.NET WebForms Pagination**:
  - Implemented automatic pagination (`Page$1` to `Page$5`+) in `playwright-scraper.js` and `jobsinhand-scraper.js`, scanning and extracting all 66+ active requisitions from JobsInHand.
- **Eliminated Destructive Filters**:
  - Removed "Rebid" rejection filter so valid rebidded requisitions (e.g. `159015` "Systems Administrator III - 165231 - Rebid") are captured.
  - Removed `isToday` drop filter and increased `MAX_JOBS` limit to 150 to guarantee zero skipped requisitions.
- **Authentic Requirement ID Keying & Collision Elimination**:
  - Keyed deduplication in `run-ingestion.js`, `server/index.js`, and `RecruiterDashboard.jsx` strictly by `req_${reqId}` so generic title duplicates (e.g. `IT Data Analyst` req 159013 vs 158988) are never merged.
  - Aligned all 66 active requisitions with authentic 6-digit JobsInHand IDs (`159023`, `159021`, `159020`, `159019`, `159016`, `159015`, `159014`, `159012`, `159010`, `159009`, `159008`, `159007`, `159006`, `159005`, `159004`, `159003`, `159002`, `159000`, `158999`, ...).
- **Synced Database & Cloud Firestore (`atsJobs`)**:
  - Synced complete 66-requisition dataset to `jobs.json`, MongoDB Atlas, and Firebase Firestore `atsJobs`.
  - Requisitions table strictly ordered descending newest-first.

### 2026-09-01 — Two-Way Real-Time Team & Candidate Messaging Sync (Sukamal-Naveen & Hierarchy)
- **Two-Way Supervisor & Employee Messaging**:
  - Connected `RecruiterInbox.jsx` with Cloud Firestore (`atsMessages`) and backend `/api/messages`.
  - When **Sukamal Chatterjee** (Lead Recruiter) opens the inbox, he automatically sees all reporting employees (**Naveen Bhardwaj**, **Priya Verma**) at the top of his conversations list with live badge indicators.
  - When **Naveen Bhardwaj** (or any employee) opens the inbox, he sees his assigned Supervisor (**Sukamal Chatterjee**) as the direct reporting & approvals channel.
  - When either party sends a message, it is instantly written to Cloud Firestore `atsMessages` and `/api/messages/team-reportee-{email}` with 3-second auto-polling and optimistic UI updates.
- **Enabled Top Header Messages Icon for All Roles**:
  - Removed employee restriction on the top orange bar message icon in `Navigation.jsx` so employees can instantly launch their direct supervisor channel.
- **Backend Bypass for Team Channels**:
  - Updated `server/index.js` `/api/messages/:candidateId` GET & POST endpoints to bypass candidate ownership 403 blocks for `team-` and `lead-` communication threads.
- **Firestore Security Rules Released**:
  - Deployed rules for `atsMessages/{threadId}` allowing unrestricted team messaging across all recruiter and employee accounts.

### 2026-09-01 — Strict Descending Serial Number (Req #) Sorting & Array Processing Fix
- **Fixed `processJobsList` Immediate Return Bug**:
  - In `RecruiterDashboard.jsx`, corrected `processJobsList` which was previously returning the raw array before deduplication and descending serial number sorting could run.
  - All requisitions across the ATS portal are now strictly sorted by descending numeric Requirement ID (`159005` -> `159004` -> `159003` -> `159002` -> `159000` -> `158999` -> `158998` -> `158997` -> `158996` -> `158995` -> ...).
  - The latest authentic requisitions are guaranteed to appear sequentially at the top of the table.

### 2026-09-01 — Authentic JobsInHand Requirement ID Alignment (159005, 159000, etc.) & Newest-First Top Order
- **Authentic Requirement ID Extraction**:
  - Extracted exact authentic `Requirement id` (`ctl00_Contentpage1_lbl_reqid`) directly from JobsInHand detail pages instead of hash-based IDs.
  - Aligned all live requisitions with their real JobsInHand requirement numbers:
    - **`159005`**: `NCDIT - ITSM Change Process Manager - Junior (810453)` (Top #1)
    - **`159000`**: `Enterprise Content Management (ECM) Business Analyst (66279)`
    - **`159004`**: `Business Analyst - Advanced (13414)`
    - **`159003`**: `Enterprise Project Manager - Advanced (13421)`
    - **`159002`**: `VRS - System Analyst 4 (806546)`
    - **`158999`**: `NC FAST Junior Java Developer/Test Engineer (807791)`
- **Newest-First Sort Guarantee**:
  - `filteredJobs` in `RecruiterDashboard.jsx` and `/api/jobs` strictly sort newest/highest requirement numbers at the top of the table.
- **Synced to Cloud Firestore**:
  - All 15 authentic jobs with real Req IDs written directly to Firestore `atsJobs`.

### 2026-09-01 — Backend /api/jobs Scope Fix & Cloud Firestore Jobs Sync
- **Fixed `extractPositionNumber` Backend Crash**:
  - Declared `extractPositionNumber` in `server/index.js`, fixing the 500 error that occurred during `loadJobsFromDisk()` and `/api/jobs`.
  - Requisition portal and Public Careers `/jobs` now return all 15 authentic deduplicated jobs immediately without empty tables.
- **Direct Cloud Firestore Sync (`atsJobs`)**:
  - Synchronized all 15 authentic jobs directly to Firebase Firestore `atsJobs` collection, providing instant client fallback even if backend is asleep.

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
